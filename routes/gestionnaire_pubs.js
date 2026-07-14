// routes/gestionnaire_pubs.js
// ⚠️ Je n'ai pas vu le contenu de middleware/auth.js — je pars du principe que
// authenticateToken pose req.user = { id, role } et que role === 'gestionnaire'
// pour un gestionnaire connecté (même pattern que req.user.role === 'admin' dans
// sponsors.js). À VÉRIFIER avant de brancher ces routes.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const verifierGestionnaire = (req, res, next) => {
  if (req.user?.role !== 'gestionnaire') {
    return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  }
  next();
};

// ════════════════════════════════════════════════════════════════
// 📋 PUBS QUI ROULENT SUR MON SITE (avec statut bloqué/actif)
// ════════════════════════════════════════════════════════════════

// GET — Liste des pubs actives (toutes catégories confondues) + statut de blocage pour ce gestionnaire
router.get('/pubs', authenticateToken, verifierGestionnaire, async (req, res) => {
  try {
    const gestionnaire_id = req.user.id;

    const result = await pool.query(
      `SELECT
        sp.id, sp.titre, sp.description, sp.url_image, sp.type, sp.categories,
        sp.sponsor_id, s.nom AS sponsor_nom,
        EXISTS(SELECT 1 FROM gestionnaire_pubs_bloquees b WHERE b.gestionnaire_id = $1 AND b.pub_id = sp.id) AS bloquee,
        EXISTS(SELECT 1 FROM gestionnaire_sponsors_bloques bs WHERE bs.gestionnaire_id = $1 AND bs.sponsor_id = sp.sponsor_id) AS sponsor_bloque
       FROM sponsor_pubs sp
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE sp.actif = true AND s.active = true
       ORDER BY s.nom, sp.titre`,
      [gestionnaire_id]
    );

    res.json({ pubs: result.rows });
  } catch (error) {
    console.error('❌ Erreur liste pubs gestionnaire:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pubs' });
  }
});

// PUT — Bloquer / débloquer une pub précise
router.put('/pubs/:pubId/bloquer', authenticateToken, verifierGestionnaire, async (req, res) => {
  try {
    const { pubId } = req.params;
    const { bloquer } = req.body; // true = bloquer, false = débloquer
    const gestionnaire_id = req.user.id;

    if (bloquer) {
      await pool.query(
        `INSERT INTO gestionnaire_pubs_bloquees (gestionnaire_id, pub_id)
         VALUES ($1, $2) ON CONFLICT (gestionnaire_id, pub_id) DO NOTHING`,
        [gestionnaire_id, pubId]
      );
    } else {
      await pool.query(
        `DELETE FROM gestionnaire_pubs_bloquees WHERE gestionnaire_id = $1 AND pub_id = $2`,
        [gestionnaire_id, pubId]
      );
    }

    res.json({ success: true, message: bloquer ? 'Publicité bloquée' : 'Publicité débloquée' });
  } catch (error) {
    console.error('❌ Erreur blocage pub:', error);
    res.status(500).json({ error: 'Erreur lors du blocage de la publicité' });
  }
});

// PUT — Bloquer / débloquer un sponsor au complet
router.put('/sponsors/:sponsorId/bloquer', authenticateToken, verifierGestionnaire, async (req, res) => {
  try {
    const { sponsorId } = req.params;
    const { bloquer } = req.body;
    const gestionnaire_id = req.user.id;

    if (bloquer) {
      await pool.query(
        `INSERT INTO gestionnaire_sponsors_bloques (gestionnaire_id, sponsor_id)
         VALUES ($1, $2) ON CONFLICT (gestionnaire_id, sponsor_id) DO NOTHING`,
        [gestionnaire_id, sponsorId]
      );
    } else {
      await pool.query(
        `DELETE FROM gestionnaire_sponsors_bloques WHERE gestionnaire_id = $1 AND sponsor_id = $2`,
        [gestionnaire_id, sponsorId]
      );
    }

    res.json({ success: true, message: bloquer ? 'Sponsor bloqué' : 'Sponsor débloqué' });
  } catch (error) {
    console.error('❌ Erreur blocage sponsor:', error);
    res.status(500).json({ error: 'Erreur lors du blocage du sponsor' });
  }
});

// ════════════════════════════════════════════════════════════════
// 💰 MONÉTISATION
// ════════════════════════════════════════════════════════════════

// GET — Revenu généré par les pubs sur mon site
router.get('/monetisation', authenticateToken, verifierGestionnaire, async (req, res) => {
  try {
    const gestionnaire_id = req.user.id;
    const { periode = '30' } = req.query;

    const gestionnaireResult = await pool.query(
      'SELECT taux_partage_pub FROM gestionnaires WHERE id = $1',
      [gestionnaire_id]
    );
    if (gestionnaireResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gestionnaire non trouvé' });
    }
    const tauxPartage = parseFloat(gestionnaireResult.rows[0].taux_partage_pub) || 70;

    const statsResult = await pool.query(
      `SELECT
        aps.pub_id, sp.titre, s.nom AS sponsor_nom,
        SUM(aps.impressions) AS impressions,
        SUM(aps.clics) AS clics,
        SUM(aps.clics * sp.prix_par_click) AS revenu_brut
       FROM addon_pub_stats aps
       JOIN sponsor_pubs sp ON sp.id = aps.pub_id
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE aps.gestionnaire_id = $1
         AND aps.date >= CURRENT_DATE - ($2 || ' days')::interval
       GROUP BY aps.pub_id, sp.titre, s.nom
       ORDER BY revenu_brut DESC`,
      [gestionnaire_id, periode]
    );

    const detail = statsResult.rows.map(r => {
      const revenuBrut = parseFloat(r.revenu_brut) || 0;
      const revenuGestionnaire = revenuBrut * (tauxPartage / 100);
      return {
        pub_id: r.pub_id,
        titre: r.titre,
        sponsor_nom: r.sponsor_nom,
        impressions: parseInt(r.impressions) || 0,
        clics: parseInt(r.clics) || 0,
        revenu_brut: revenuBrut,
        revenu_gestionnaire: revenuGestionnaire,
      };
    });

    const totalBrut = detail.reduce((sum, d) => sum + d.revenu_brut, 0);
    const totalGestionnaire = detail.reduce((sum, d) => sum + d.revenu_gestionnaire, 0);

    res.json({
      taux_partage_pub: tauxPartage,
      periode_jours: parseInt(periode),
      total_revenu_brut: totalBrut,
      total_revenu_gestionnaire: totalGestionnaire,
      detail,
    });
  } catch (error) {
    console.error('❌ Erreur monétisation pubs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la monétisation' });
  }
});

module.exports = router;