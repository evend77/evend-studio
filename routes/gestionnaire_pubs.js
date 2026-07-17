// routes/gestionnaire_pubs.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isGestionnaire } = require('../middleware/auth');
const { getMontantParClic } = require('../src/utils/monetisationPub');

// ════════════════════════════════════════════════════════════════
// 📋 PUBS QUI ROULENT SUR MON SITE (avec statut bloqué/actif)
// ════════════════════════════════════════════════════════════════

// GET — Liste des pubs actives (toutes catégories confondues) + statut de blocage pour ce gestionnaire
// Supporte la recherche (par ID exact, titre, ou nom de sponsor) et la pagination
// (50 par page par défaut) — pensé pour tenir avec des milliers de pubs.
router.get('/pubs', authenticateToken, isGestionnaire, async (req, res) => {
  try {
    const gestionnaire_id = req.user.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    // Sans recherche : seulement les pubs actives (ce qui peut vraiment circuler).
    // Avec recherche : on cherche partout (même une pub pausée/coupée depuis),
    // pour qu'un gestionnaire puisse retrouver et bloquer une pub signalée
    // même si elle n'est plus active au moment où il la cherche.
    const conditionRecherche = `(sp.id::text = $COUNT_IDX OR sp.titre ILIKE '%' || $COUNT_IDX || '%' OR s.nom ILIKE '%' || $COUNT_IDX || '%')`;

    // ── Total (pour la pagination) ──
    const paramsCount = search ? [search] : [];
    const whereCount = search
      ? `s.active = true AND ${conditionRecherche.replaceAll('$COUNT_IDX', '$1')}`
      : 's.active = true AND sp.actif = true';
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM sponsor_pubs sp JOIN sponsors s ON s.id = sp.sponsor_id WHERE ${whereCount}`,
      paramsCount
    );
    const total = parseInt(countResult.rows[0].total);

    // ── Page demandée ──
    // gestionnaire_id est toujours $1 (utilisé dans les EXISTS ci-dessous)
    const paramsListe = search ? [gestionnaire_id, search, limit, offset] : [gestionnaire_id, limit, offset];
    const whereListe = search
      ? `s.active = true AND ${conditionRecherche.replaceAll('$COUNT_IDX', '$2')}`
      : 's.active = true AND sp.actif = true';
    const limitIdx = search ? 3 : 2;
    const offsetIdx = search ? 4 : 3;

    const result = await pool.query(
      `SELECT
        sp.id, sp.titre, sp.description, sp.url_image, sp.type, sp.categories, sp.actif, sp.statut,
        sp.sponsor_id, s.nom AS sponsor_nom,
        EXISTS(SELECT 1 FROM gestionnaire_pubs_bloquees b WHERE b.gestionnaire_id = $1 AND b.pub_id = sp.id) AS bloquee,
        EXISTS(SELECT 1 FROM gestionnaire_sponsors_bloques bs WHERE bs.gestionnaire_id = $1 AND bs.sponsor_id = sp.sponsor_id) AS sponsor_bloque
       FROM sponsor_pubs sp
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE ${whereListe}
       ORDER BY s.nom, sp.titre
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      paramsListe
    );

    res.json({
      pubs: result.rows,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    console.error('❌ Erreur liste pubs gestionnaire:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pubs' });
  }
});

// PUT — Bloquer / débloquer une pub précise
router.put('/pubs/:pubId/bloquer', authenticateToken, isGestionnaire, async (req, res) => {
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
router.put('/sponsors/:sponsorId/bloquer', authenticateToken, isGestionnaire, async (req, res) => {
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
router.get('/monetisation', authenticateToken, isGestionnaire, async (req, res) => {
  try {
    const gestionnaire_id = req.user.id;
    const { periode = '30' } = req.query;

    const montantParClic = await getMontantParClic(gestionnaire_id);
    if (montantParClic === null) {
      return res.status(404).json({ error: 'Gestionnaire non trouvé' });
    }

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
      const clics = parseInt(r.clics) || 0;
      return {
        pub_id: r.pub_id,
        titre: r.titre,
        sponsor_nom: r.sponsor_nom,
        impressions: parseInt(r.impressions) || 0,
        clics,
        revenu_brut: parseFloat(r.revenu_brut) || 0, // ce que le sponsor paie (informatif)
        revenu_gestionnaire: clics * montantParClic,  // ce que TOI tu reçois — montant fixe par clic
      };
    });

    const totalBrut = detail.reduce((sum, d) => sum + d.revenu_brut, 0);
    const totalGestionnaire = detail.reduce((sum, d) => sum + d.revenu_gestionnaire, 0);

    res.json({
      montant_par_clic: montantParClic,
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

// GET — Revenu pub pour une plage de dates EXACTE (utilisé par "Mes services" :
// mois en cours = 1er du mois → aujourd'hui, historique = periode_debut/fin de la vraie facture)
router.get('/monetisation-periode', authenticateToken, isGestionnaire, async (req, res) => {
  try {
    const gestionnaire_id = req.user.id;
    const { debut, fin } = req.query;
    if (!debut || !fin) {
      return res.status(400).json({ error: 'Paramètres debut et fin requis (YYYY-MM-DD)' });
    }

    const montantParClic = await getMontantParClic(gestionnaire_id);
    if (montantParClic === null) {
      return res.status(404).json({ error: 'Gestionnaire non trouvé' });
    }

    const result = await pool.query(
      `SELECT COALESCE(SUM(clics), 0) as clics, COALESCE(SUM(impressions), 0) as impressions
       FROM addon_pub_stats
       WHERE gestionnaire_id = $1 AND date >= $2::date AND date <= $3::date`,
      [gestionnaire_id, debut, fin]
    );

    const clics = parseInt(result.rows[0].clics) || 0;
    const impressions = parseInt(result.rows[0].impressions) || 0;

    res.json({
      debut, fin,
      montant_par_clic: montantParClic,
      clics, impressions,
      revenu: clics * montantParClic,
    });
  } catch (error) {
    console.error('❌ Erreur monétisation période:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la monétisation' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🏷️ CATÉGORIES DE PUBS ACCEPTÉES SUR MON SITE
// ════════════════════════════════════════════════════════════════

// GET — Catégories actuellement autorisées (null/vide = toutes)
router.get('/categories-autorisees', authenticateToken, isGestionnaire, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT categories_pub_autorisees FROM options_gestionnaire WHERE gestionnaire_id = $1',
      [req.user.id]
    );
    res.json({ categories: result.rows[0]?.categories_pub_autorisees || [] });
  } catch (error) {
    console.error('❌ Erreur récupération catégories autorisées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// PUT — Modifier les catégories autorisées ([] = toutes acceptées)
router.put('/categories-autorisees', authenticateToken, isGestionnaire, async (req, res) => {
  try {
    const { categories } = req.body; // tableau de clés, ex: ['cours', 'general']
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Format invalide' });
    }
    await pool.query(
      `INSERT INTO options_gestionnaire (gestionnaire_id, categories_pub_autorisees)
       VALUES ($1, $2)
       ON CONFLICT (gestionnaire_id) DO UPDATE SET categories_pub_autorisees = $2`,
      [req.user.id, categories.length > 0 ? categories : null]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur modification catégories autorisées:', error);
    res.status(500).json({ error: 'Erreur lors de la modification des catégories' });
  }
});

module.exports = router;