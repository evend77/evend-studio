// routes/draft-orders.js
// ============================================================
// Gestion des brouillons de commandes (commande manuelle)
// Pour e-Vend.ca - vendeur peut créer une commande au nom du client
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken: verifierToken } = require('../middleware/auth');

// ============================================================
// HELPER - Générer numéro de commande e-Vend unique
// ============================================================
async function genererNumeroCommande() {
  const result = await pool.query(
    `SELECT 'EV' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(COALESCE(MAX(SUBSTRING(no_commande_evend FROM '\\d+$')::int), 0) + 1, 6, '0') AS nouveau_numero
     FROM commandes_brouillons
     WHERE no_commande_evend LIKE 'EV' || TO_CHAR(NOW(), 'YYYYMMDD') || '%'`
  );
  return result.rows[0].nouveau_numero;
}

// ============================================================
// GET /api/vendor/draft-orders
// Récupérer tous les brouillons du vendeur connecté
// ============================================================
router.get('/', verifierToken, async (req, res) => {
  const vendeurId = req.user.vendeur_id;

  try {
    const result = await pool.query(
      `SELECT 
         cb.id,
         cb.no_commande_evend,
         cb.nom_commande,
         cb.montant_total,
         cb.email_client,
         cb.nom_client,
         TO_CHAR(cb.created_at, 'DD-MM-YYYY HH:MI AM') AS date,
         cb.statut
       FROM commandes_brouillons cb
       WHERE cb.vendeur_id = $1
       ORDER BY cb.created_at DESC`,
      [vendeurId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET /draft-orders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/vendor/draft-orders/:id
// Récupérer un brouillon spécifique avec ses produits
// ============================================================
router.get('/:id', verifierToken, async (req, res) => {
  const vendeurId = req.user.vendeur_id;
  const { id } = req.params;

  try {
    // Récupérer la commande
    const commandeResult = await pool.query(
      `SELECT 
         cb.*,
         TO_CHAR(cb.created_at, 'DD-MM-YYYY HH:MI AM') AS date_formatee
       FROM commandes_brouillons cb
       WHERE cb.id = $1 AND cb.vendeur_id = $2`,
      [id, vendeurId]
    );

    if (commandeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Brouillon non trouvé' });
    }

    const commande = commandeResult.rows[0];

    // Récupérer les produits de la commande
    const itemsResult = await pool.query(
      `SELECT 
         cbi.id,
         cbi.produit_id,
         p.nom AS nom_produit,
         cbi.quantite,
         cbi.prix_unitaire,
         (cbi.quantite * cbi.prix_unitaire) AS total_ligne,
         cbi.taxable
       FROM commandes_brouillons_items cbi
       JOIN produits p ON p.id = cbi.produit_id
       WHERE cbi.commande_brouillon_id = $1`,
      [id]
    );

    res.json({
      ...commande,
      items: itemsResult.rows,
      sous_total: commande.montant_subtotal,
      taxes: commande.montant_taxes,
      total: commande.montant_total
    });
  } catch (err) {
    console.error('❌ GET /draft-orders/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/vendor/draft-orders
// Créer un nouveau brouillon de commande
// Body: { customerId, items, notes, tags, discountCode, ... }
// ============================================================
router.post('/', verifierToken, async (req, res) => {
  const vendeurId = req.user.vendeur_id;
  const {
    customerId,
    items,
    notes,
    tags,
    discountCode,
    discountAmount = 0,
    shippingCost = 0,
    allowDiscountCodes = false
  } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'customerId requis' });
  }
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Au moins un produit requis' });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Récupérer les infos du client
    const clientResult = await client.query(
      `SELECT prenom, nom, email FROM clients WHERE id = $1 AND vendeur_id = $2`,
      [customerId, vendeurId]
    );

    if (clientResult.rows.length === 0) {
      throw new Error('Client non trouvé');
    }

    const client = clientResult.rows[0];
    const nomClient = `${client.prenom} ${client.nom}`;

    // 2. Calculer les montants
    let subtotal = 0;
    const itemsWithDetails = [];

    for (const item of items) {
      const produitResult = await client.query(
        `SELECT nom, prix, taxable FROM produits WHERE id = $1 AND vendeur_id = $2`,
        [item.productId, vendeurId]
      );
      
      if (produitResult.rows.length === 0) {
        throw new Error(`Produit ${item.productId} non trouvé`);
      }

      const produit = produitResult.rows[0];
      const totalLigne = item.price * item.quantity;
      subtotal += totalLigne;

      itemsWithDetails.push({
        produit_id: item.productId,
        nom_produit: produit.nom,
        quantite: item.quantity,
        prix_unitaire: item.price,
        taxable: produit.taxable,
        total_ligne: totalLigne
      });
    }

    // Calculer les taxes (TVQ 9.975% + TPS 5% = 14.975%)
    const tauxTaxes = 0.14975;
    const taxes = subtotal * tauxTaxes;
    const total = subtotal + taxes + (shippingCost || 0) - (discountAmount || 0);

    // 3. Générer numéro de commande unique
    const noCommande = await genererNumeroCommande();
    const nomCommande = `#D${Math.floor(Math.random() * 1000)}`;

    // 4. Insérer la commande brouillon
    const commandeResult = await client.query(
      `INSERT INTO commandes_brouillons (
         vendeur_id, client_id, no_commande_evend, nom_commande,
         montant_subtotal, montant_taxes, montant_total,
         frais_livraison, montant_rabais, code_rabais,
         email_client, nom_client, notes, tags,
         autoriser_codes_rabais, statut, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft', NOW())
       RETURNING id`,
      [
        vendeurId, customerId, noCommande, nomCommande,
        subtotal, taxes, total,
        shippingCost || 0, discountAmount || 0, discountCode || null,
        client.email, nomClient, notes || null, tags || null,
        allowDiscountCodes || false
      ]
    );

    const commandeId = commandeResult.rows[0].id;

    // 5. Insérer les items
    for (const item of itemsWithDetails) {
      await client.query(
        `INSERT INTO commandes_brouillons_items (
           commande_brouillon_id, produit_id, quantite, prix_unitaire, taxable
         ) VALUES ($1, $2, $3, $4, $5)`,
        [commandeId, item.produit_id, item.quantite, item.prix_unitaire, item.taxable]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      commande_id: commandeId,
      no_commande: noCommande,
      message: 'Brouillon créé avec succès'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ POST /draft-orders:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// PUT /api/vendor/draft-orders/:id
// Mettre à jour un brouillon
// ============================================================
router.put('/:id', verifierToken, async (req, res) => {
  const vendeurId = req.user.vendeur_id;
  const { id } = req.params;
  const {
    notes,
    tags,
    discountCode,
    discountAmount,
    shippingCost,
    status
  } = req.body;

  try {
    const updates = [];
    const values = [];
    let idx = 1;

    if (notes !== undefined) {
      updates.push(`notes = $${idx++}`);
      values.push(notes);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${idx++}`);
      values.push(tags);
    }
    if (discountCode !== undefined) {
      updates.push(`code_rabais = $${idx++}`);
      values.push(discountCode);
    }
    if (discountAmount !== undefined) {
      updates.push(`montant_rabais = $${idx++}`);
      values.push(discountAmount);
      // Recalculer le total
      updates.push(`montant_total = montant_subtotal + montant_taxes + frais_livraison - $${idx++}`);
      values.push(discountAmount);
    }
    if (shippingCost !== undefined) {
      updates.push(`frais_livraison = $${idx++}`);
      values.push(shippingCost);
      updates.push(`montant_total = montant_subtotal + montant_taxes + $${idx++} - montant_rabais`);
      values.push(shippingCost);
    }
    if (status !== undefined) {
      updates.push(`statut = $${idx++}`);
      values.push(status);
    }

    updates.push(`updated_at = NOW()`);

    values.push(id, vendeurId);

    const result = await pool.query(
      `UPDATE commandes_brouillons 
       SET ${updates.join(', ')}
       WHERE id = $${idx++} AND vendeur_id = $${idx}
       RETURNING *`,
      [...values, id, vendeurId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Brouillon non trouvé' });
    }

    res.json({
      success: true,
      commande: result.rows[0]
    });
  } catch (err) {
    console.error('❌ PUT /draft-orders/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DELETE /api/vendor/draft-orders/:id
// Supprimer un brouillon
// ============================================================
router.delete('/:id', verifierToken, async (req, res) => {
  const vendeurId = req.user.vendeur_id;
  const { id } = req.params;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Supprimer les items d'abord
    await client.query(
      `DELETE FROM commandes_brouillons_items WHERE commande_brouillon_id = $1`,
      [id]
    );
    
    // Supprimer la commande
    const result = await client.query(
      `DELETE FROM commandes_brouillons WHERE id = $1 AND vendeur_id = $2 RETURNING id`,
      [id, vendeurId]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Brouillon non trouvé' });
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Brouillon supprimé' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ DELETE /draft-orders/:id:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// POST /api/vendor/draft-orders/:id/send-invoice
// Envoyer la facture au client
// ============================================================
router.post('/:id/send-invoice', verifierToken, async (req, res) => {
  const vendeurId = req.user.vendeur_id;
  const { id } = req.params;

  try {
    // Récupérer la commande
    const commandeResult = await pool.query(
      `SELECT cb.*, c.email 
       FROM commandes_brouillons cb
       JOIN clients c ON c.id = cb.client_id
       WHERE cb.id = $1 AND cb.vendeur_id = $2`,
      [id, vendeurId]
    );

    if (commandeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Brouillon non trouvé' });
    }

    const commande = commandeResult.rows[0];

    // Mettre à jour le statut
    await pool.query(
      `UPDATE commandes_brouillons 
       SET statut = 'invoice_sent', 
           date_facture_envoyee = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // TODO: Intégrer l'envoi d'email ici (nodemailer, SendGrid, etc.)
    // await envoyerEmailFacture(commande.email, commande);

    res.json({
      success: true,
      message: `Facture envoyée à ${commande.email_client}`
    });
  } catch (err) {
    console.error('❌ POST /draft-orders/:id/send-invoice:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/vendor/draft-orders/stats/summary
// Statistiques des brouillons
// ============================================================
router.get('/stats/summary', verifierToken, async (req, res) => {
  const vendeurId = req.user.vendeur_id;

  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) AS total_brouillons,
         COUNT(*) FILTER (WHERE statut = 'draft') AS brouillons,
         COUNT(*) FILTER (WHERE statut = 'invoice_sent') AS factures_envoyees,
         COUNT(*) FILTER (WHERE statut = 'completed') AS completes,
         COALESCE(SUM(montant_total), 0) AS total_valeur
       FROM commandes_brouillons
       WHERE vendeur_id = $1`,
      [vendeurId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ GET /draft-orders/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;