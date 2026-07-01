// routes/factures.js — Gestion complète des factures
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin, isVendeur, isAcheteur } = require('../middleware/auth');

console.log('🔥🔥🔥 ROUTES FACTURES CHARGÉES !!! 🔥🔥🔥');

// =====================================================================
// FONCTIONS UTILITAIRES
// =====================================================================

/**
 * Calcule les taxes selon la province
 */
function calculerTaxes(montant, province = 'QC') {
  let tps = 0;
  let tvq = 0;
  let tvh = 0;
  
  // TPS (5% partout sauf provinces TVH)
  if (!['ON', 'NB', 'NS', 'NL', 'PE', 'BC'].includes(province)) {
    tps = montant * 0.05;
  }
  
  // Taxes selon la province
  switch(province) {
    case 'QC': // Québec
      tvq = montant * 0.09975; // 9.975%
      break;
    case 'ON': // Ontario
    case 'NB': // Nouveau-Brunswick
    case 'NS': // Nouvelle-Écosse
    case 'NL': // Terre-Neuve
    case 'PE': // Île-du-Prince-Édouard
      tvh = montant * 0.15; // 15% HST
      break;
    case 'BC': // Colombie-Britannique
      tvh = montant * 0.12; // 12% PST+GST
      break;
    // Autres provinces : seulement TPS
  }
  
  return {
    tps: Math.round(tps * 100) / 100,
    tvq: Math.round(tvq * 100) / 100,
    tvh: Math.round(tvh * 100) / 100,
    total: Math.round((tps + tvq + tvh) * 100) / 100
  };
}

/**
 * Génère un numéro de facture unique
 */
async function genererNumeroFacture(annee, mois) {
  const result = await pool.query(
    `SELECT COUNT(*) + 1 as next 
     FROM factures 
     WHERE EXTRACT(YEAR FROM date_emission) = $1
     AND EXTRACT(MONTH FROM date_emission) = $2`,
    [annee, mois]
  );
  
  const compteur = String(result.rows[0].next).padStart(5, '0');
  return `FAC-${annee}${String(mois).padStart(2, '0')}-${compteur}`;
}

// =====================================================================
// GÉNÉRER UNE FACTURE À PARTIR D'UNE COMMANDE (CORRIGÉ)
// =====================================================================
router.post('/commandes/:id/facture', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const commandeId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // Récupérer la commande avec tous les détails (CORRIGÉ avec les bons noms de colonnes)
    const commandeRes = await client.query(`
      SELECT 
        c.*,
        v.id as vendeur_id,
        v.nom as vendeur_nom,
        v.boutique,
        v.tps as vendeur_tps,
        v.tvq as vendeur_tvq,
        v.tvh_no as vendeur_tvh,
        v.no_entreprise as entreprise_no,
        -- Adresse du vendeur (concaténation des champs)
        CONCAT(
          COALESCE(v.num_civique || ' ', ''),
          COALESCE(v.rue || ', ', ''),
          COALESCE(v.ville || ', ', ''),
          COALESCE(v.province || ', ', ''),
          COALESCE(v.code_postal, '')
        ) as vendeur_adresse,
        v.telephone as vendeur_telephone,
        v.email as vendeur_email,
        v.regime_taxes,
        v.province as vendeur_province,
        
        a.id as acheteur_id,
        a.prenom || ' ' || a.nom as acheteur_nom,
        a.email as acheteur_email,
        -- Adresse de l'acheteur (colonne unique)
        a.adresse as acheteur_adresse,
        a.province as acheteur_province
        
      FROM commandes c
      LEFT JOIN vendeurs v ON v.id = c.vendeur_id
      LEFT JOIN acheteurs a ON a.id = c.acheteur_id
      WHERE c.id = $1
    `, [commandeId]);

    if (commandeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const cmd = commandeRes.rows[0];

    // Vérifier les permissions
    if (userRole === 'acheteur' && cmd.acheteur_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (userRole === 'vendeur' && cmd.vendeur_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier si la facture existe déjà
    const factureExistante = await client.query(
      'SELECT id, numero_facture FROM factures WHERE commande_id = $1',
      [commandeId]
    );

    if (factureExistante.rows.length > 0) {
      await client.query('COMMIT');
      return res.json(factureExistante.rows[0]);
    }

    // Générer un numéro de facture unique
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    const numeroFacture = await genererNumeroFacture(annee, mois);

    // Parser les produits
    let produits = [];
    try {
      produits = typeof cmd.produits === 'string' ? JSON.parse(cmd.produits) : cmd.produits || [];
    } catch {
      produits = [];
    }

    // Calculer les sous-totaux
    const sousTotal = produits.reduce((sum, p) => sum + (parseFloat(p.prix) * (p.quantite || 1)), 0);
    const fraisExpedition = parseFloat(cmd.frais_expedition) || 0;
    const pourboire = parseFloat(cmd.pourboire) || 0;
    const baseImposable = sousTotal + fraisExpedition + pourboire;

    // Calculer les taxes selon la province de l'acheteur
    const taxes = calculerTaxes(baseImposable, cmd.acheteur_province || 'QC');
    const total = baseImposable + taxes.total;

    // Insérer la facture
    const factureRes = await client.query(`
      INSERT INTO factures (
        numero_facture, type, commande_id,
        vendeur_id, acheteur_id,
        vendeur_nom, vendeur_boutique, vendeur_adresse, vendeur_telephone, vendeur_email,
        vendeur_tps, vendeur_tvq, vendeur_entreprise_no,
        acheteur_nom, acheteur_adresse, acheteur_email,
        numero_commande, date_commande,
        sous_total, frais_expedition, tps, tvq, tvh, pourboire, total,
        methode_paiement, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING id, numero_facture
    `, [
      numeroFacture, 'vente', commandeId,
      cmd.vendeur_id, cmd.acheteur_id,
      cmd.vendeur_nom, cmd.boutique, cmd.vendeur_adresse, cmd.vendeur_telephone, cmd.vendeur_email,
      cmd.vendeur_tps, cmd.vendeur_tvq, cmd.entreprise_no,
      cmd.acheteur_nom, cmd.acheteur_adresse, cmd.acheteur_email,
      cmd.store_order_id, cmd.date_commande,
      sousTotal, fraisExpedition, taxes.tps, taxes.tvq, taxes.tvh, pourboire, total,
      cmd.mode_paiement || 'Carte de crédit', 'emise'
    ]);

    const factureId = factureRes.rows[0].id;

    // Insérer les lignes de facture
    for (const p of produits) {
      const prixUnitaire = parseFloat(p.prix) || 0;
      const quantite = p.quantite || 1;
      const totalLigne = prixUnitaire * quantite;
      
      await client.query(`
        INSERT INTO facture_lignes (
          facture_id, produit_id, produit_nom, produit_sku,
          quantite, prix_unitaire, total_ligne,
          tps_applicable, tvq_applicable
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        factureId, p.produit_id || null, p.nom || 'Produit', p.sku || null,
        quantite, prixUnitaire, totalLigne,
        true, true
      ]);
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau)
       VALUES ($1, $2, $3::jsonb, $4)`,
      ['FACTURE_CREE', req.user.email, 
       JSON.stringify({ facture_id: factureId, commande_id: commandeId }), 'info']
    );

    await client.query('COMMIT');
    
    res.json({
      success: true,
      id: factureId,
      numero_facture: numeroFacture
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur génération facture:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// =====================================================================
// RÉCUPÉRER UNE FACTURE
// =====================================================================
router.get('/factures/:id', authenticateToken, async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const factureRes = await pool.query(`
      SELECT 
        f.*,
        json_agg(
          json_build_object(
            'id', fl.id,
            'produit_nom', fl.produit_nom,
            'sku', fl.produit_sku,
            'quantite', fl.quantite,
            'prix_unitaire', fl.prix_unitaire,
            'total_ligne', fl.total_ligne
          ) ORDER BY fl.id
        ) as lignes,
        to_char(f.date_emission, 'DD/MM/YYYY') as date_emission_fr,
        to_char(f.date_commande, 'DD/MM/YYYY') as date_commande_fr
      FROM factures f
      LEFT JOIN facture_lignes fl ON fl.facture_id = f.id
      WHERE f.id = $1
      GROUP BY f.id
    `, [factureId]);

    if (factureRes.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const facture = factureRes.rows[0];

    // Vérifier les permissions
    if (userRole === 'acheteur' && facture.acheteur_id !== userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    if (userRole === 'vendeur' && facture.vendeur_id !== userId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    res.json(facture);

  } catch (err) {
    console.error('❌ Erreur récupération facture:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// LISTER LES FACTURES (pour acheteur/vendeur/admin)
// =====================================================================
router.get('/factures', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limite = 100, offset = 0 } = req.query;

    let query = `
      SELECT 
        id, numero_facture, type, 
        to_char(date_emission, 'DD/MM/YYYY') as date_emission,
        statut,
        vendeur_nom, vendeur_boutique,
        acheteur_nom,
        total, devise
      FROM factures
    `;

    if (userRole === 'acheteur') {
      query += ` WHERE acheteur_id = $1`;
    } else if (userRole === 'vendeur') {
      query += ` WHERE vendeur_id = $1`;
    }
    // Admin voit tout

    query += ` ORDER BY date_emission DESC LIMIT $2 OFFSET $3`;

    const params = userRole !== 'admin' ? [userId, limite, offset] : [limite, offset];
    const result = await pool.query(query, params);
    
    res.json({
      factures: result.rows,
      total: result.rows.length,
      limite,
      offset
    });

  } catch (err) {
    console.error('❌ Erreur liste factures:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// RÉCUPÉRER LES FACTURES D'UNE COMMANDE
// =====================================================================
router.get('/commandes/:id/factures', authenticateToken, async (req, res) => {
  try {
    const commandeId = parseInt(req.params.id);
    
    const result = await pool.query(`
      SELECT 
        id, numero_facture, type, 
        to_char(date_emission, 'DD/MM/YYYY') as date_emission,
        statut, total, devise
      FROM factures
      WHERE commande_id = $1
      ORDER BY date_emission DESC
    `, [commandeId]);
    
    res.json(result.rows);

  } catch (err) {
    console.error('❌ Erreur récupération factures commande:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ANNULER UNE FACTURE (admin seulement)
// =====================================================================
router.put('/factures/:id/annuler', authenticateToken, isAdmin, async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    const { raison } = req.body;

    const result = await pool.query(`
      UPDATE factures 
      SET statut = 'annulee', notes = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, numero_facture
    `, [raison || 'Annulation par administrateur', factureId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau)
       VALUES ($1, $2, $3::jsonb, $4)`,
      ['FACTURE_ANNULEE', req.user.email, 
       JSON.stringify({ facture_id: factureId }), 'warning']
    );

    res.json({ success: true, facture: result.rows[0] });

  } catch (err) {
    console.error('❌ Erreur annulation facture:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// STATISTIQUES DES FACTURES (admin)
// =====================================================================
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { annee, mois } = req.query;
    
    let condition = '';
    let params = [];
    
    if (annee && mois) {
      condition = 'WHERE EXTRACT(YEAR FROM date_emission) = $1 AND EXTRACT(MONTH FROM date_emission) = $2';
      params = [annee, mois];
    }

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_factures,
        COUNT(CASE WHEN statut = 'emise' THEN 1 END) as factures_emises,
        COUNT(CASE WHEN statut = 'payee' THEN 1 END) as factures_payees,
        COUNT(CASE WHEN statut = 'annulee' THEN 1 END) as factures_annulees,
        COALESCE(SUM(CASE WHEN statut = 'payee' THEN total END), 0) as montant_total,
        COALESCE(SUM(tps), 0) as total_tps,
        COALESCE(SUM(tvq), 0) as total_tvq,
        COALESCE(SUM(tvh), 0) as total_tvh
      FROM factures
      ${condition}
    `, params);

    res.json(stats.rows[0]);

  } catch (err) {
    console.error('❌ Erreur stats factures:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
