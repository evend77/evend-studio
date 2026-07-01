const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// =====================================================================
// STATISTIQUES VENDEUR
// =====================================================================
router.get('/vendeurs/:id/stats', authenticateToken, async (req, res) => {
  try {
    const vendeurId = parseInt(req.params.id);
    const { periode = '30' } = req.query;
    
    console.log(`📊 Stats vendeur ${vendeurId} - période ${periode}`);
    
    // Vérifier que le vendeur accède à ses propres stats
    if (req.user.role === 'vendeur' && req.user.id !== vendeurId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // =============================================================
    // STATS REVENUS (commandes avec statut_paiement = 'Paid')
    // =============================================================
    let revenus = { total: 0, mois: 0, aujourdhui: 0 };
    try {
      const result = await pool.query(`
        SELECT 
          COALESCE(SUM(montant), 0) as total,
          COALESCE(SUM(CASE WHEN date_commande >= date_trunc('month', NOW()) THEN montant END), 0) as mois,
          COALESCE(SUM(CASE WHEN date_commande::date = CURRENT_DATE THEN montant END), 0) as aujourdhui
        FROM commandes
        WHERE vendeur_id = $1 AND statut_paiement = 'Paid'
      `, [vendeurId]);
      revenus = result.rows[0];
      console.log('💰 Revenus:', revenus);
    } catch (err) {
      console.log('⚠️ Erreur stats revenus:', err.message);
    }

    // Croissance vs mois dernier
    let croissance = 0;
    try {
      const result = await pool.query(`
        WITH mois_courant AS (
          SELECT COALESCE(SUM(montant), 0) as total
          FROM commandes
          WHERE vendeur_id = $1 
            AND statut_paiement = 'Paid'
            AND date_commande >= date_trunc('month', NOW())
        ),
        mois_dernier AS (
          SELECT COALESCE(SUM(montant), 0) as total
          FROM commandes
          WHERE vendeur_id = $1 
            AND statut_paiement = 'Paid'
            AND date_commande >= date_trunc('month', NOW() - interval '1 month')
            AND date_commande < date_trunc('month', NOW())
        )
        SELECT 
          CASE 
            WHEN mois_dernier.total = 0 THEN 0
            ELSE ((mois_courant.total - mois_dernier.total) / mois_dernier.total * 100)
          END as croissance
        FROM mois_courant, mois_dernier
      `, [vendeurId]);
      croissance = parseFloat(result.rows[0]?.croissance) || 0;
      console.log('📈 Croissance:', croissance);
    } catch (err) {
      console.log('⚠️ Erreur stats croissance:', err.message);
    }

    // =============================================================
    // STATS COMMANDES (selon statut_commande)
    // =============================================================
    let commandes = { total: 0, enAttente: 0, expediees: 0, livrees: 0, annulees: 0 };
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN statut_commande = 'Unfulfilled' THEN 1 END) as en_attente,
          COUNT(CASE WHEN statut_commande = 'Fulfilled' THEN 1 END) as livrees,
          COUNT(CASE WHEN statut_commande = 'Partially Fulfilled' THEN 1 END) as expediees,
          0 as annulees
        FROM commandes
        WHERE vendeur_id = $1 AND statut_paiement = 'Paid'
      `, [vendeurId]);
      commandes = result.rows[0];
      console.log('📦 Commandes:', commandes);
    } catch (err) {
      console.log('⚠️ Erreur stats commandes:', err.message);
    }

    let croissanceCommandes = 0;
    try {
      const result = await pool.query(`
        SELECT 
          CASE 
            WHEN COUNT(*) FILTER (WHERE date_commande >= date_trunc('month', NOW() - interval '1 month') AND date_commande < date_trunc('month', NOW())) = 0 THEN 0
            ELSE ((COUNT(*) FILTER (WHERE date_commande >= date_trunc('month', NOW())) - 
                   COUNT(*) FILTER (WHERE date_commande >= date_trunc('month', NOW() - interval '1 month') AND date_commande < date_trunc('month', NOW()))) * 100.0 /
                   COUNT(*) FILTER (WHERE date_commande >= date_trunc('month', NOW() - interval '1 month') AND date_commande < date_trunc('month', NOW())))
          END as croissance
        FROM commandes
        WHERE vendeur_id = $1 AND statut_paiement = 'Paid'
      `, [vendeurId]);
      croissanceCommandes = parseFloat(result.rows[0]?.croissance) || 0;
    } catch (err) {
      console.log('⚠️ Erreur stats croissance commandes:', err.message);
    }

    // =============================================================
    // STATS PRODUITS
    // =============================================================
    let produits = { total: 0, actifs: 0, enRupture: 0, vues: 0 };
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs,
          COUNT(CASE WHEN stock <= 0 THEN 1 END) as en_rupture,
          COALESCE(SUM(vues), 0) as vues
        FROM produits
        WHERE vendeur_id = $1
      `, [vendeurId]);
      produits = result.rows[0];
      console.log('📦 Produits:', produits);
    } catch (err) {
      console.log('⚠️ Erreur stats produits:', err.message);
    }

    let vuesCroissance = 0;
    try {
      const result = await pool.query(`
        SELECT 
          CASE 
            WHEN COALESCE(SUM(vues) FILTER (WHERE created_at >= date_trunc('day', NOW() - interval '1 day') AND created_at < date_trunc('day', NOW())), 0) = 0 THEN 0
            ELSE ((COALESCE(SUM(vues) FILTER (WHERE created_at >= date_trunc('day', NOW())), 0) - 
                   COALESCE(SUM(vues) FILTER (WHERE created_at >= date_trunc('day', NOW() - interval '1 day') AND created_at < date_trunc('day', NOW())), 0)) * 100.0 /
                   COALESCE(SUM(vues) FILTER (WHERE created_at >= date_trunc('day', NOW() - interval '1 day') AND created_at < date_trunc('day', NOW())), 1))
          END as croissance
        FROM produits
        WHERE vendeur_id = $1
      `, [vendeurId]);
      vuesCroissance = parseFloat(result.rows[0]?.croissance) || 0;
    } catch (err) {
      console.log('⚠️ Erreur stats vues croissance:', err.message);
    }

    // =============================================================
    // STATS AVIS
    // =============================================================
    let avis = { moyenne: 0, total: 0, cinqEtoiles: 0, quatreEtoiles: 0, troisEtoiles: 0, deuxEtoiles: 0, uneEtoile: 0 };
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
        WHERE vendeur_id = $1
      `, [vendeurId]);
      avis = result.rows[0];
      console.log('⭐ Avis:', avis);
    } catch (err) {
      console.log('⚠️ Erreur stats avis:', err.message);
    }

    // =============================================================
    // GRAPHIQUE VENTES 30 JOURS
    // =============================================================
    let ventes30j = [];
    try {
      const nbJours = parseInt(periode) || 30;
      // Pour 365 jours, grouper par mois au lieu de par jour
      const parMois = nbJours >= 365;
      const result = await pool.query(parMois ? `
        WITH mois AS (
          SELECT generate_series(
            date_trunc('month', NOW() - interval '11 months'),
            date_trunc('month', NOW()),
            interval '1 month'
          )::date AS date
        )
        SELECT 
          to_char(m.date, 'MM/YYYY') as date,
          COALESCE(SUM(c.montant), 0) as ventes,
          COUNT(c.id) as commandes
        FROM mois m
        LEFT JOIN commandes c ON date_trunc('month', c.date_commande) = date_trunc('month', m.date::timestamp)
          AND c.vendeur_id = $1 
          AND c.statut_paiement = 'Paid'
        GROUP BY m.date
        ORDER BY m.date
      ` : `
        WITH dates AS (
          SELECT generate_series(
            date_trunc('day', NOW() - (($2 - 1) || ' days')::interval),
            date_trunc('day', NOW()),
            interval '1 day'
          )::date AS date
        )
        SELECT 
          to_char(d.date, 'DD/MM') as date,
          COALESCE(SUM(c.montant), 0) as ventes,
          COUNT(c.id) as commandes
        FROM dates d
        LEFT JOIN commandes c ON c.date_commande::date = d.date 
          AND c.vendeur_id = $1 
          AND c.statut_paiement = 'Paid'
        GROUP BY d.date
        ORDER BY d.date
      `, parMois ? [vendeurId] : [vendeurId, nbJours]);
      ventes30j = result.rows;
      console.log(`📊 Ventes ${nbJours}j:`, ventes30j.length, 'entrées');
    } catch (err) {
      console.log('⚠️ Erreur graphique ventes:', err.message);
    }

    // =============================================================
    // TOP PRODUITS (en attendant la table ligne_commandes)
    // =============================================================
    let topProduits = [];
    try {
      // Version simplifiée si ligne_commandes n'existe pas
      topProduits = [
        { nom: 'Exemple produit 1', ventes: 0, revenu: 0 },
        { nom: 'Exemple produit 2', ventes: 0, revenu: 0 }
      ];
      console.log('🏆 Top produits (simulés):', topProduits);
    } catch (err) {
      console.log('⚠️ Erreur top produits:', err.message);
    }

    // =============================================================
    // RÉPARTITION STATUTS
    // =============================================================
    const repartitionStatuts = [
      { nom: 'En attente', valeur: parseInt(commandes.en_attente) || 0, couleur: '#F39C12' },
      { nom: 'Expédiées', valeur: parseInt(commandes.expediees) || 0, couleur: '#3498DB' },
      { nom: 'Livrées', valeur: parseInt(commandes.livrees) || 0, couleur: '#008060' }
    ].filter(s => s.valeur > 0);

    // =============================================================
    // VISITES PRODUITS (simulées pour l'exemple)
    // =============================================================
    const visites = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      visites.push({
        date: date.toLocaleDateString('fr-CA', { weekday: 'short' }),
        vues: Math.floor(Math.random() * 50) + 10
      });
    }

    // Construction de la réponse
    const stats = {
      revenus: {
        total: parseFloat(revenus.total) || 0,
        mois: parseFloat(revenus.mois) || 0,
        aujourdhui: parseFloat(revenus.aujourdhui) || 0,
        croissance: croissance || 0
      },
      commandes: {
        total: parseInt(commandes.total) || 0,
        enAttente: parseInt(commandes.en_attente) || 0,
        expediees: parseInt(commandes.expediees) || 0,
        livrees: parseInt(commandes.livrees) || 0,
        annulees: 0, // Pas de données pour les annulations
        croissance: croissanceCommandes || 0
      },
      produits: {
        total: parseInt(produits.total) || 0,
        actifs: parseInt(produits.actifs) || 0,
        enRupture: parseInt(produits.en_rupture) || 0,
        vues: parseInt(produits.vues) || 0,
        vuesCroissance: vuesCroissance || 0
      },
      avis: {
        moyenne: parseFloat(avis.moyenne) || 0,
        total: parseInt(avis.total) || 0,
        cinqEtoiles: parseInt(avis.cinq_etoiles) || 0,
        quatreEtoiles: parseInt(avis.quatre_etoiles) || 0,
        troisEtoiles: parseInt(avis.trois_etoiles) || 0,
        deuxEtoiles: parseInt(avis.deux_etoiles) || 0,
        uneEtoile: parseInt(avis.une_etoile) || 0
      },
      graphiques: {
        ventes30j,
        topProduits,
        repartitionStatuts,
        visites
      }
    };

    console.log('✅ Stats envoyées');
    res.json(stats);

  } catch (err) {
    console.error('❌ Erreur stats vendeur:', err);
    res.status(500).json({ 
      error: err.message,
      revenus: { total: 0, mois: 0, aujourdhui: 0, croissance: 0 },
      commandes: { total: 0, enAttente: 0, expediees: 0, livrees: 0, annulees: 0, croissance: 0 },
      produits: { total: 0, actifs: 0, enRupture: 0, vues: 0, vuesCroissance: 0 },
      avis: { moyenne: 0, total: 0, cinqEtoiles: 0, quatreEtoiles: 0, troisEtoiles: 0, deuxEtoiles: 0, uneEtoile: 0 },
      graphiques: { ventes30j: [], topProduits: [], repartitionStatuts: [], visites: [] }
    });
  }
});

module.exports = router;