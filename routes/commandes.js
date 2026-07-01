const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// =====================================================================
// RÉCUPÉRER LES COMMANDES D'UN ACHETEUR
// =====================================================================
router.get('/acheteurs/:id/commandes', authenticateToken, async (req, res) => {
  try {
    const acheteurId = parseInt(req.params.id);
    
    // Vérifier que l'acheteur accède à ses propres commandes
    if (req.user.role === 'acheteur' && req.user.id !== acheteurId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer les commandes directement depuis la table commandes
    const result = await pool.query(`
      SELECT 
        c.id,
        c.store_order_id as commande_id,
        c.montant,
        to_char(c.date_commande, 'DD/MM/YYYY') as date,
        c.statut_paiement,
        CASE 
          WHEN c.statut_commande = 'Fulfilled' THEN 'Livrée'
          WHEN c.statut_commande = 'Unfulfilled' THEN 'En attente'
          WHEN c.statut_commande = 'Partially Fulfilled' THEN 'Partiellement livrée'
          ELSE c.statut_commande
        END as statut,
        c.montant::text || ' $' as total,
        c.vendeur_id,
        v.nom as vendeur_nom,
        v.boutique as vendeur_boutique,
        c.client_nom as destinataire,
        c.ville || ', ' || c.province || ', ' || c.pays as adresseLivraison,
        c.ville || ', ' || c.province || ', ' || c.pays as adresseFacturation,
        c.client_nom as nomClient,
        c.client_email as emailClient,
        c.transporteur,
        c.numero_suivi as numeroSuivi,
        -- Formatage des produits à partir du JSON
        CASE 
          WHEN c.produits IS NOT NULL AND c.produits != '[]'::jsonb 
          THEN c.produits
          ELSE '[{"nom": "Produit", "quantite": 1, "prix": "' || c.montant || '"}]'::jsonb
        END as articles_json
      FROM commandes c
      LEFT JOIN vendeurs v ON v.id = c.vendeur_id
      WHERE c.acheteur_id = $1
      ORDER BY c.date_commande DESC
    `, [acheteurId]);

    // Transformer les données pour le frontend
    const commandes = result.rows.map(row => {
      // Parser le JSON des produits
      let articles = [];
      try {
        if (row.articles_json && row.articles_json !== '[]') {
          articles = typeof row.articles_json === 'string' 
            ? JSON.parse(row.articles_json) 
            : row.articles_json;
        } else {
          // Produit par défaut si pas de données
          articles = [{
            nom: 'Produit',
            quantite: 1,
            prix: `${row.montant} $`
          }];
        }
      } catch (e) {
        articles = [{
          nom: 'Produit',
          quantite: 1,
          prix: `${row.montant} $`
        }];
      }

      return {
        id: row.id,
        commande_id: row.commande_id || `CMD-${row.id}`,
        date: row.date,
        statut: row.statut || 'Confirmée',
        total: row.total || `${row.montant} $`,
        montant: row.montant,
        articles: articles,
        destinataire: row.destinataire,
        adresseLivraison: row.adresseLivraison,
        adresseFacturation: row.adresseFacturation,
        nomClient: row.nomClient,
        emailClient: row.emailClient,
        vendeur_id: row.vendeur_id,
        vendeur_nom: row.vendeur_nom,
        vendeur_boutique: row.vendeur_boutique,
        transporteur: row.transporteur,
        numeroSuivi: row.numeroSuivi
      };
    });

    console.log(`✅ ${commandes.length} commandes trouvées pour l'acheteur ${acheteurId}`);
    res.json(commandes);

  } catch (err) {
    console.error('❌ Erreur chargement commandes:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
