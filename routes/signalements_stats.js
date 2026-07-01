/**
 * routes/signalements_stats.js
 * Routes pour les statistiques des signalements
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

console.log('🔥 ROUTE SIGNALEMENTS STATS CHARGÉE 🔥');

// =====================================================================
// STATISTIQUES GÉNÉRALES DES SIGNALEMENTS
// =====================================================================
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  console.log('📊 REQUÊTE STATS SIGNALEMENTS REÇUE');
  console.log('📊 Période demandée:', req.query.periode);
  console.log('📊 Utilisateur:', req.user.id, req.user.email);
  
  try {
    const { periode = '30j' } = req.query;
    
    // Déterminer la date de début selon la période
    let dateDebut = new Date();
    switch(periode) {
      case '7j':
        dateDebut.setDate(dateDebut.getDate() - 7);
        break;
      case '30j':
        dateDebut.setDate(dateDebut.getDate() - 30);
        break;
      case '90j':
        dateDebut.setDate(dateDebut.getDate() - 90);
        break;
      case 'annee':
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
        break;
      default:
        dateDebut.setDate(dateDebut.getDate() - 30);
    }

    // Format pour PostgreSQL
    const dateDebutStr = dateDebut.toISOString().split('T')[0];
    console.log('📊 Date début:', dateDebutStr);

    // =================================================================
    // 1. STATISTIQUES GLOBALES
    // =================================================================
    const globalStats = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN statut = 'nouveau' THEN 1 END) AS nouveaux,
        COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) AS en_cours,
        COUNT(CASE WHEN statut = 'resolu' THEN 1 END) AS resolus
      FROM signalements
    `);
    
    console.log('📊 Stats globales:', globalStats.rows[0]);

    // =================================================================
    // 2. RÉPARTITION PAR CATÉGORIE (type)
    // =================================================================
    const typeStats = await pool.query(`
      SELECT 
        categorie AS type,
        COUNT(*) AS count,
        ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM signalements), 0), 0) AS pourcentage
      FROM signalements
      GROUP BY categorie
      ORDER BY count DESC
    `);
    
    console.log('📊 Stats par type:', typeStats.rows);

    // =================================================================
    // 3. STATUTS (remplace gravité)
    // =================================================================
    const statutStats = await pool.query(`
      SELECT 
        statut,
        COUNT(*) AS count
      FROM signalements
      GROUP BY statut
      ORDER BY 
        CASE statut
          WHEN 'nouveau' THEN 1
          WHEN 'en_cours' THEN 2
          WHEN 'resolu' THEN 3
          WHEN 'rejete' THEN 4
        END
    `);
    
    console.log('📊 Stats par statut:', statutStats.rows);

    // =================================================================
    // 4. RÉPARTITION PAR TYPE DE SIGNALEUR
    // =================================================================
    const signaleurStats = await pool.query(`
      SELECT 
        signaleur_type AS type,
        COUNT(*) AS count
      FROM signalements
      GROUP BY signaleur_type
    `);
    
    console.log('📊 Stats par signaleur:', signaleurStats.rows);

    // =================================================================
    // 5. ÉVOLUTION TEMPORELLE (7 derniers jours)
    // =================================================================
    const evolutionStats = await pool.query(`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('day', NOW() - interval '6 days'),
          date_trunc('day', NOW()),
          interval '1 day'
        )::date AS date
      )
      SELECT 
        to_char(d.date, 'Dy') AS jour,
        d.date,
        COUNT(s.id) AS total,
        COUNT(CASE WHEN s.created_at::date = d.date THEN 1 END) AS nouveaux
      FROM dates d
      LEFT JOIN signalements s ON s.created_at::date = d.date
      GROUP BY d.date
      ORDER BY d.date
    `);
    
    console.log('📊 Stats évolution:', evolutionStats.rows);

    // =================================================================
    // 6. TEMPS MOYEN DE RÉSOLUTION
    // =================================================================
    const tempsResolution = await pool.query(`
      SELECT 
        COALESCE(AVG(EXTRACT(EPOCH FROM (date_traitement - created_at)) / 3600), 0) AS moyenne
      FROM signalements
      WHERE statut = 'resolu' AND date_traitement IS NOT NULL
    `);
    
    console.log('📊 Temps résolution:', tempsResolution.rows[0]);

    // =================================================================
    // 7. TOP SIGNALEURS (ceux qui signalent le plus)
    // =================================================================
    const topSignaleurs = await pool.query(`
      SELECT 
        signaleur_id AS id,
        COALESCE(signaleur_nom, 'Anonyme') AS nom,
        signaleur_type AS type,
        COUNT(*) AS count
      FROM signalements
      WHERE created_at >= $1 AND signaleur_id IS NOT NULL
      GROUP BY signaleur_id, signaleur_nom, signaleur_type
      ORDER BY count DESC
      LIMIT 5
    `, [dateDebutStr]);
    
    console.log('📊 Top signalants:', topSignaleurs.rows);

    // =================================================================
    // 8. TOP SIGNALÉS (vendeurs les plus signalés)
    // =================================================================
    const topSignales = await pool.query(`
      SELECT 
        s.vendeur_id AS id,
        COALESCE(v.nom, 'Vendeur inconnu') AS nom,
        'vendeur' AS type,
        COUNT(*) AS count
      FROM signalements s
      LEFT JOIN vendeurs v ON v.id = s.vendeur_id
      WHERE s.created_at >= $1 AND s.vendeur_id IS NOT NULL
      GROUP BY s.vendeur_id, v.nom
      ORDER BY count DESC
      LIMIT 5
    `, [dateDebutStr]);
    
    console.log('📊 Top signalés:', topSignales.rows);

    // Fonction pour obtenir la couleur selon la catégorie
    const getCouleurParCategorie = (categorie) => {
      const couleurs = {
        'fraude': '#dc2626',
        'harcelement': '#d97706',
        'produit contrefait': '#8b5cf6',
        'non-livraison': '#3b82f6',
        'spam': '#ec4899',
        'autre': '#6b7280'
      };
      return couleurs[categorie?.toLowerCase()] || '#6b7280';
    };

    // Formater les données pour le frontend
    const stats = {
      total: parseInt(globalStats.rows[0]?.total) || 0,
      nouveaux: parseInt(globalStats.rows[0]?.nouveaux) || 0,
      enCours: parseInt(globalStats.rows[0]?.en_cours) || 0,
      resolus: parseInt(globalStats.rows[0]?.resolus) || 0,
      
      parType: typeStats.rows.map(row => ({
        type: row.type || 'Non catégorisé',
        count: parseInt(row.count),
        pourcentage: parseInt(row.pourcentage) || 0,
        couleur: getCouleurParCategorie(row.type)
      })),
      
      parGravite: [
        { gravite: 'nouveau', count: parseInt(statutStats.rows.find(r => r.statut === 'nouveau')?.count || 0), couleur: '#3b82f6' },
        { gravite: 'en_cours', count: parseInt(statutStats.rows.find(r => r.statut === 'en_cours')?.count || 0), couleur: '#d97706' },
        { gravite: 'resolu', count: parseInt(statutStats.rows.find(r => r.statut === 'resolu')?.count || 0), couleur: '#16a34a' },
        { gravite: 'rejete', count: parseInt(statutStats.rows.find(r => r.statut === 'rejete')?.count || 0), couleur: '#6b7280' }
      ].filter(g => g.count > 0),
      
      parCible: signaleurStats.rows.map(row => ({
        cible: row.type === 'acheteur' ? 'acheteur' : 'vendeur',
        count: parseInt(row.count)
      })),
      
      evolution: evolutionStats.rows.map(row => ({
        date: row.jour || '???',
        total: parseInt(row.total) || 0,
        nouveaux: parseInt(row.nouveaux) || 0
      })),
      
      tempsResolution: {
        moyenne: Math.round(tempsResolution.rows[0]?.moyenne || 0),
        parGravite: [
          { gravite: 'moyen', temps: Math.round(tempsResolution.rows[0]?.moyenne || 0) }
        ]
      },
      
      topSignalants: topSignaleurs.rows.map(row => ({
        id: row.id,
        nom: row.nom || 'Anonyme',
        type: row.type || 'acheteur',
        count: parseInt(row.count)
      })),
      
      topSignales: topSignales.rows.map(row => ({
        id: row.id,
        nom: row.nom || 'Inconnu',
        type: 'vendeur',
        count: parseInt(row.count)
      }))
    };

    //
    if (stats.parType.length === 0) {
      stats.parType = [{ type: 'Aucun signalement', count: 0, pourcentage: 0, couleur: '#6b7280' }];
    }
    
    if (stats.parCible.length === 0) {
      stats.parCible = [
        { cible: 'vendeur', count: 0 },
        { cible: 'acheteur', count: 0 }
      ];
    }
    
    if (stats.evolution.length === 0) {
      const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      stats.evolution = jours.map(jour => ({ date: jour, total: 0, nouveaux: 0 }));
    }
    
    if (stats.topSignalants.length === 0) {
      stats.topSignalants = [
        { id: 0, nom: 'Aucun signalement', type: 'acheteur', count: 0 }
      ];
    }
    
    if (stats.topSignales.length === 0) {
      stats.topSignales = [
        { id: 0, nom: 'Aucun signalement', type: 'vendeur', count: 0 }
      ];
    }

    console.log('✅ Stats envoyées au frontend');
    res.json(stats);

  } catch (err) {
    console.error('❌ Erreur stats signalements:', err);
    res.status(500).json({ 
      error: err.message,
      // Retourner des données par défaut en cas d'erreur
      total: 0,
      nouveaux: 0,
      enCours: 0,
      resolus: 0,
      parType: [{ type: 'Erreur de chargement', count: 0, pourcentage: 0, couleur: '#6b7280' }],
      parGravite: [],
      parCible: [],
      evolution: [],
      tempsResolution: { moyenne: 0, parGravite: [] },
      topSignalants: [],
      topSignales: []
    });
  }
});

module.exports = router;
