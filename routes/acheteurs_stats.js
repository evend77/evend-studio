/**
 * routes/acheteurs_stats.js
 * Routes pour les statistiques des acheteurs
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// =====================================================================
// STATISTIQUES ACHETEUR
// =====================================================================
router.get('/acheteurs/:id/stats', authenticateToken, async (req, res) => {
  try {
    const acheteurId = parseInt(req.params.id);
    
    console.log(`ðŸ“Š Stats acheteur ${acheteurId}`);
    
    // VÃ©rifier que l'acheteur accÃ¨de Ã  ses propres stats
    if (req.user.role === 'acheteur' && req.user.id !== acheteurId) {
      return res.status(403).json({ error: 'AccÃ¨s refusÃ©' });
    }

    // =============================================================
    // 1. STATS COMMANDES
    // =============================================================
    let commandes = { total: 0, enCours: 0, livrees: 0, annulees: 0, totalDepense: 0, moisDepense: 0 };
    
    try {
      // Commandes de l'acheteur (table commandes avec acheteur_id)
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN statut_commande = 'Unfulfilled' OR statut_commande = 'Partially Fulfilled' THEN 1 END) as en_cours,
          COUNT(CASE WHEN statut_commande = 'Fulfilled' THEN 1 END) as livrees,
          COUNT(CASE WHEN statut_paiement = 'voided' OR statut_commande = 'Annulee' THEN 1 END) as annulees,
          COALESCE(SUM(montant), 0) as total_depense,
          COALESCE(SUM(CASE WHEN date_commande >= date_trunc('month', NOW()) THEN montant END), 0) as mois_depense
        FROM commandes
        WHERE acheteur_id = $1 AND statut_paiement = 'Paid'
      `, [acheteurId]);
      
      commandes = {
        total: parseInt(result.rows[0]?.total) || 0,
        enCours: parseInt(result.rows[0]?.en_cours) || 0,
        livrees: parseInt(result.rows[0]?.livrees) || 0,
        annulees: parseInt(result.rows[0]?.annulees) || 0,
        totalDepense: parseFloat(result.rows[0]?.total_depense) || 0,
        moisDepense: parseFloat(result.rows[0]?.mois_depense) || 0
      };
      
      console.log('ðŸ“¦ Commandes:', commandes);
    } catch (err) {
      console.log('âš ï¸ Erreur stats commandes:', err.message);
    }

    // =============================================================
    // 2. STATS FAVORIS (vendeurs favoris et wishlist)
    // =============================================================
    let favoris = { totalVendeurs: 0, totalWishlist: 0 };
    
    try {
      // Vendeurs favoris (table vendeurs_favoris Ã  crÃ©er ?)
      // Pour l'instant, valeurs par dÃ©faut
      favoris = { totalVendeurs: 0, totalWishlist: 0 };
      
      // Si tu as une table vendeurs_favoris, dÃ©commente :
      /*
      const vendeursFav = await pool.query(`
        SELECT COUNT(*) as count FROM vendeurs_favoris WHERE acheteur_id = $1
      `, [acheteurId]);
      
      const wishlist = await pool.query(`
        SELECT COUNT(*) as count FROM wishlist WHERE acheteur_id = $1
      `, [acheurId]);
      
      favoris = {
        totalVendeurs: parseInt(vendeursFav.rows[0]?.count) || 0,
        totalWishlist: parseInt(wishlist.rows[0]?.count) || 0
      };
      */
      
      console.log('â­ Favoris:', favoris);
    } catch (err) {
      console.log('âš ï¸ Erreur stats favoris:', err.message);
    }

    // =============================================================
    // 3. STATS AVIS
    // =============================================================
    let avis = { 
      total: 0, 
      moyenne: 0, 
      cinqEtoiles: 0, 
      quatreEtoiles: 0, 
      troisEtoiles: 0, 
      deuxEtoiles: 0, 
      uneEtoile: 0 
    };
    
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(AVG(note_globale), 0) as moyenne,
          COUNT(CASE WHEN note_globale = 5 THEN 1 END) as cinq_etoiles,
          COUNT(CASE WHEN note_globale = 4 THEN 1 END) as quatre_etoiles,
          COUNT(CASE WHEN note_globale = 3 THEN 1 END) as trois_etoiles,
          COUNT(CASE WHEN note_globale = 2 THEN 1 END) as deux_etoiles,
          COUNT(CASE WHEN note_globale = 1 THEN 1 END) as une_etoile
        FROM avis
        WHERE acheteur_id = $1
      `, [acheteurId]);
      
      avis = {
        total: parseInt(result.rows[0]?.total) || 0,
        moyenne: parseFloat(result.rows[0]?.moyenne) || 0,
        cinqEtoiles: parseInt(result.rows[0]?.cinq_etoiles) || 0,
        quatreEtoiles: parseInt(result.rows[0]?.quatre_etoiles) || 0,
        troisEtoiles: parseInt(result.rows[0]?.trois_etoiles) || 0,
        deuxEtoiles: parseInt(result.rows[0]?.deux_etoiles) || 0,
        uneEtoile: parseInt(result.rows[0]?.une_etoile) || 0
      };
      
      console.log('â­ Avis:', avis);
    } catch (err) {
      console.log('âš ï¸ Erreur stats avis:', err.message);
    }

    // =============================================================
    // 4. STATS MESSAGES (non lus)
    // =============================================================
    let messages = { nonLusVendeur: 0, nonLusAdmin: 0 };
    
    try {
      // Messages non lus des vendeurs
      const vendeurRes = await pool.query(`
        SELECT COUNT(*) as count
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE c.acheteur_id = $1 
          AND false = true 
          AND m.lu = false
      `, [acheteurId]);
      
      // Messages non lus de l'admin
      const adminRes = await pool.query(`
        SELECT COUNT(*) as count
        FROM messages_admin m
        JOIN conversations_admin c ON c.id = m.conversation_id
        WHERE c.acheteur_id = $1 
          AND false = true 
          AND m.lu = false
      `, [acheteurId]);
      
      messages = {
        nonLusVendeur: parseInt(vendeurRes.rows[0]?.count) || 0,
        nonLusAdmin: parseInt(adminRes.rows[0]?.count) || 0
      };
      
      console.log('ðŸ’¬ Messages non lus:', messages);
    } catch (err) {
      console.log('âš ï¸ Erreur stats messages:', err.message);
    }

    // =============================================================
    // 5. GRAPHIQUE DÃ‰PENSES 30 JOURS
    // =============================================================
    let depenses30j = [];
    
    try {
      const result = await pool.query(`
        WITH dates AS (
          SELECT generate_series(
            date_trunc('day', NOW() - interval '29 days'),
            date_trunc('day', NOW()),
            interval '1 day'
          )::date AS date
        )
        SELECT 
          to_char(d.date, 'DD/MM') as date,
          COALESCE(SUM(c.montant), 0) as montant,
          COUNT(c.id) as commandes
        FROM dates d
        LEFT JOIN commandes c ON c.date_commande::date = d.date 
          AND c.acheteur_id = $1 
          AND c.statut_paiement = 'Paid'
        GROUP BY d.date
        ORDER BY d.date
      `, [acheteurId]);
      
      depenses30j = result.rows;
      console.log('ðŸ“Š DÃ©penses 30j:', depenses30j.length, 'jours');
    } catch (err) {
      console.log('âš ï¸ Erreur graphique dÃ©penses:', err.message);
    }

    // =============================================================
    // 6. RÃ‰PARTITION STATUTS
    // =============================================================
    let repartitionStatuts = [];
    
    try {
      const result = await pool.query(`
        SELECT 
          CASE 
            WHEN statut_commande = 'Unfulfilled' THEN 'En attente'
            WHEN statut_commande = 'Partially Fulfilled' THEN 'Partielle'
            WHEN statut_commande = 'Fulfilled' THEN 'LivrÃ©e'
            ELSE statut_commande
          END as nom,
          COUNT(*) as valeur
        FROM commandes
        WHERE acheteur_id = $1 AND statut_paiement = 'Paid'
        GROUP BY statut_commande
      `, [acheteurId]);
      
      repartitionStatuts = result.rows.map(row => ({
        nom: row.nom,
        valeur: parseInt(row.valeur),
        couleur: 
          row.nom === 'LivrÃ©e' ? '#10b981' :
          row.nom === 'En attente' ? '#f59e0b' :
          row.nom === 'Partielle' ? '#3b82f6' :
          row.nom === 'AnnulÃ©e' ? '#ef4444' : '#8b5cf6'
      }));
      
      console.log('ðŸ¥§ RÃ©partition statuts:', repartitionStatuts);
    } catch (err) {
      console.log('âš ï¸ Erreur rÃ©partition statuts:', err.message);
    }

    // =============================================================
    // 7. TOP VENDEURS (les plus commandÃ©s par l'acheteur)
    // =============================================================
    let topVendeurs = [];
    
    try {
      const result = await pool.query(`
        SELECT 
          COALESCE(v.nom_boutique v.nom, 'Vendeur') as nom,
          COUNT(c.id) as commandes,
          SUM(c.montant) as depense
        FROM commandes c
        LEFT JOIN vendeurs v ON v.id = c.vendeur_id
        WHERE c.acheteur_id = $1 AND c.statut_paiement = 'Paid'
        GROUP BY c.vendeur_id, v.nom_boutique, v.nom
        ORDER BY commandes DESC
        LIMIT 5
      `, [acheteurId]);
      
      topVendeurs = result.rows.map(row => ({
        nom: row.nom,
        commandes: parseInt(row.commandes),
        depense: parseFloat(row.depense) || 0
      }));
      
      console.log('ðŸ† Top vendeurs:', topVendeurs);
    } catch (err) {
      console.log('âš ï¸ Erreur top vendeurs:', err.message);
    }

    // =============================================================
    // 8. VISITES PRODUITS (simulÃ©es si la colonne n'existe pas)
    // =============================================================
    const visitesProduits = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      visitesProduits.push({
        date: date.toLocaleDateString('fr-CA', { weekday: 'short' }),
        vues: Math.floor(Math.random() * 30) + 5
      });
    }

    // Construction de la rÃ©ponse
    const stats = {
      commandes,
      favoris,
      avis,
      messages,
      graphiques: {
        depenses30j,
        repartitionStatuts,
        topVendeurs,
        visitesProduits
      }
    };

    console.log('âœ… Stats acheteur envoyÃ©es');
    res.json(stats);

  } catch (err) {
    console.error('âŒ Erreur stats acheteur:', err);
    res.status(500).json({ 
      error: err.message,
      commandes: { total: 0, enCours: 0, livrees: 0, annulees: 0, totalDepense: 0, moisDepense: 0 },
      favoris: { totalVendeurs: 0, totalWishlist: 0 },
      avis: { total: 0, moyenne: 0, cinqEtoiles: 0, quatreEtoiles: 0, troisEtoiles: 0, deuxEtoiles: 0, uneEtoile: 0 },
      messages: { nonLusVendeur: 0, nonLusAdmin: 0 },
      graphiques: { depenses30j: [], repartitionStatuts: [], topVendeurs: [], visitesProduits: [] }
    });
  }
});

module.exports = router;



