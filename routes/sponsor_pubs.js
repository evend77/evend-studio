// routes/sponsor_pubs.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ── MIDDLEWARE ──────────────────────────────────────────────────
const verifierAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ════════════════════════════════════════════════════════════════
// 📢 ROUTES SPONSOR
// ════════════════════════════════════════════════════════════════

// GET — Récupérer les pubs du sponsor
router.get('/pubs', authenticateToken, async (req, res) => {
  try {
    const sponsor_id = req.user.id;
    const result = await pool.query(
      `SELECT 
        id, titre, description, url_image, url_lien,
        actif, impressions, clics, type, effet, prix_par_click,
        budget_type, budget_montant, budget_depense,
        categories,
        roue_active, codes_promo_roue, participations_roue, gagnants_roue,
        created_at
       FROM sponsor_pubs
       WHERE sponsor_id = $1
       ORDER BY created_at DESC`,
      [sponsor_id]
    );
    res.json({ pubs: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération pubs sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pubs' });
  }
});

// POST — Créer une pub (sponsor)
router.post('/pubs', authenticateToken, async (req, res) => {
  try {
    const {
      titre, description, url_lien, type, effet,
      images, prix_par_click, budget_type, budget_montant,
      categories,
      roue_active, codes_promo_roue,
      question, choix, compteur, code_promo, note, auteur
    } = req.body;

    const sponsor_id = req.user.id;

    // Vérifier que le sponsor a le bon type
    const sponsorCheck = await pool.query(
      'SELECT type_sponsor FROM sponsors WHERE id = $1',
      [sponsor_id]
    );
    if (sponsorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }
    if (sponsorCheck.rows[0].type_sponsor === 'photos') {
      return res.status(403).json({ error: 'Votre compte n\'est pas autorisé à créer des publicités' });
    }

    // Sauvegarder les données spécifiques au format
    let extra_data = {};
    if (type === 'interactive') {
      extra_data = { question, choix };
    } else if (type === 'social') {
      extra_data = { compteur };
    } else if (type === 'codepromo') {
      extra_data = { code_promo };
    } else if (type === 'temoignage') {
      extra_data = { note, auteur };
    }

    // Codes promo de la roue
    const codesPromoArray = codes_promo_roue && codes_promo_roue.length > 0 
      ? codes_promo_roue 
      : [];

    const result = await pool.query(
      `INSERT INTO sponsor_pubs 
       (sponsor_id, titre, description, url_image, url_lien, actif,
        type, effet, prix_par_click, extra_data,
        budget_type, budget_montant, budget_depense,
        categories,
        roue_active, codes_promo_roue,
        created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10, $11, 0, $12, $13, $14, NOW(), NOW())
       RETURNING *`,
      [
        sponsor_id,
        titre,
        description,
        images?.[0] || '',
        url_lien,
        type || 'basique',
        effet || null,
        prix_par_click || 0.50,
        JSON.stringify(extra_data),
        budget_type || 'jour',
        budget_montant || 10,
        categories || [],
        roue_active || false,
        codesPromoArray
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Publicité créée avec succès',
      pub: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur création pub:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la publicité' });
  }
});

// PUT — Activer/Désactiver une pub
router.put('/pubs/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;
    const sponsor_id = req.user.id;

    const check = await pool.query(
      'SELECT id FROM sponsor_pubs WHERE id = $1 AND sponsor_id = $2',
      [id, sponsor_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    await pool.query(
      `UPDATE sponsor_pubs SET actif = $1, updated_at = NOW()
       WHERE id = $2 AND sponsor_id = $3`,
      [actif, id, sponsor_id]
    );

    res.json({
      success: true,
      message: actif ? 'Publicité activée' : 'Publicité désactivée'
    });
  } catch (error) {
    console.error('❌ Erreur toggle pub:', error);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// DELETE — Supprimer une pub
router.delete('/pubs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor_id = req.user.id;

    const check = await pool.query(
      'SELECT id FROM sponsor_pubs WHERE id = $1 AND sponsor_id = $2',
      [id, sponsor_id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    await pool.query('DELETE FROM sponsor_pubs WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Publicité supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression pub:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📊 STATISTIQUES
// ════════════════════════════════════════════════════════════════

// GET — Statistiques des pubs du sponsor
router.get('/pubs/stats', authenticateToken, async (req, res) => {
  try {
    const sponsor_id = req.user.id;
    const { periode = '30' } = req.query;

    const pubsResult = await pool.query(
      `SELECT 
        id, titre, type, actif, prix_par_click,
        impressions, clics,
        budget_montant, budget_depense,
        categories,
        roue_active, codes_promo_roue, participations_roue, gagnants_roue,
        COALESCE(clics * prix_par_click, 0) as cout_estime,
        created_at
       FROM sponsor_pubs
       WHERE sponsor_id = $1
       ORDER BY created_at DESC`,
      [sponsor_id]
    );

    const stats = pubsResult.rows.map(pub => ({
      id: pub.id,
      titre: pub.titre,
      type: pub.type,
      actif: pub.actif,
      impressions: pub.impressions || 0,
      clics: pub.clics || 0,
      ctr: pub.impressions > 0 ? (pub.clics / pub.impressions) * 100 : 0,
      cout: parseFloat(pub.cout_estime) || 0,
      budget_montant: parseFloat(pub.budget_montant) || 0,
      budget_depense: parseFloat(pub.budget_depense) || 0,
      budget_restant: Math.max(parseFloat(pub.budget_montant) - parseFloat(pub.cout_estime), 0),
      categories: pub.categories || [],
      roue_active: pub.roue_active || false,
      codes_promo_roue: pub.codes_promo_roue || [],
      participations_roue: pub.participations_roue || 0,
      gagnants_roue: pub.gagnants_roue || 0,
      prix_par_click: pub.prix_par_click || 0.50,
      created_at: pub.created_at,
    }));

    const totalImpressions = stats.reduce((sum, s) => sum + s.impressions, 0);
    const totalClics = stats.reduce((sum, s) => sum + s.clics, 0);
    const totalCout = stats.reduce((sum, s) => sum + s.cout, 0);
    const ctrGlobal = totalImpressions > 0 ? (totalClics / totalImpressions) * 100 : 0;

    // Stats de la roue
    const totalParticipations = stats.reduce((sum, s) => sum + s.participations_roue, 0);
    const totalGagnants = stats.reduce((sum, s) => sum + s.gagnants_roue, 0);

    res.json({
      stats,
      total_impressions: totalImpressions,
      total_clics: totalClics,
      total_cout: totalCout,
      ctr_global: ctrGlobal,
      total_participations_roue: totalParticipations,
      total_gagnants_roue: totalGagnants,
    });
  } catch (error) {
    console.error('❌ Erreur stats pubs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🎡 ROUTES ROUE DE LA FORTUNE
// ════════════════════════════════════════════════════════════════

// POST — Enregistrer une participation à la roue
router.post('/roue/:pubId/participer', async (req, res) => {
  try {
    const { pubId } = req.params;
    const { gagne } = req.body;

    // Incrémenter les participations
    await pool.query(
      `UPDATE sponsor_pubs SET 
        participations_roue = participations_roue + 1,
        updated_at = NOW()
       WHERE id = $1`,
      [pubId]
    );

    // Si l'utilisateur a gagné, incrémenter les gagnants
    if (gagne) {
      await pool.query(
        `UPDATE sponsor_pubs SET 
          gagnants_roue = gagnants_roue + 1,
          updated_at = NOW()
         WHERE id = $1`,
        [pubId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur participation roue:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la participation' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📊 ROUTES PUBLIQUES (pour l'affichage)
// ════════════════════════════════════════════════════════════════

// GET — Récupérer une pub aléatoire pour un site spécifique
router.get('/pub/random/:categorieSite', async (req, res) => {
  try {
    const { categorieSite } = req.params;

    let query = `
      SELECT 
        sp.id, sp.titre, sp.description, sp.url_image, sp.url_lien,
        sp.type, sp.effet, sp.extra_data, sp.categories,
        sp.roue_active, sp.codes_promo_roue,
        s.nom AS sponsor_nom
      FROM sponsor_pubs sp
      JOIN sponsors s ON s.id = sp.sponsor_id
      WHERE sp.actif = true AND s.active = true
    `;

    // Filtrer par catégorie
    query += ` AND (sp.categories = '{}' OR $1 = ANY(sp.categories))`;
    query += ` ORDER BY RANDOM() LIMIT 1`;

    const result = await pool.query(query, [categorieSite]);

    if (result.rows.length === 0) {
      return res.status(200).json({ pub: null, message: 'Aucune pub disponible' });
    }

    const pub = result.rows[0];
    await pool.query(
      `UPDATE sponsor_pubs SET impressions = impressions + 1 WHERE id = $1`,
      [pub.id]
    );

    res.json({ pub });
  } catch (error) {
    console.error('❌ Erreur récupération pub aléatoire:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la pub' });
  }
});

// POST — Track un clic sur une pub
router.post('/pub/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const { gestionnaireId } = req.body;

    await pool.query(
      `UPDATE sponsor_pubs SET clics = clics + 1 WHERE id = $1`,
      [id]
    );

    if (gestionnaireId) {
      await pool.query(
        `INSERT INTO addon_pub_stats (gestionnaire_id, pub_id, clics, date)
         VALUES ($1, $2, 1, CURRENT_DATE)
         ON CONFLICT (gestionnaire_id, pub_id, date) 
         DO UPDATE SET clics = addon_pub_stats.clics + 1`,
        [gestionnaireId, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur track clic:', error);
    res.status(500).json({ error: 'Erreur lors du tracking du clic' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🔧 ADMIN ROUTES
// ════════════════════════════════════════════════════════════════

// GET — Toutes les pubs (admin)
router.get('/admin/all', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        sp.*,
        s.nom AS sponsor_nom
       FROM sponsor_pubs sp
       JOIN sponsors s ON s.id = sp.sponsor_id
       ORDER BY sp.created_at DESC`
    );
    res.json({ pubs: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération pubs admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des pubs' });
  }
});

// PUT — Modifier une pub (admin)
router.put('/admin/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { actif, prix_par_click } = req.body;

    const result = await pool.query(
      `UPDATE sponsor_pubs SET
        actif = COALESCE($1, actif),
        prix_par_click = COALESCE($2, prix_par_click),
        updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [actif, prix_par_click, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Publicité non trouvée' });
    }

    res.json({
      success: true,
      message: 'Publicité modifiée avec succès',
      pub: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur modification pub admin:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// ── VÉRIFICATION DES BUDGETS (CRON) ──────────────────────────────────
router.get('/verifier-budgets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sp.id, sp.budget_type, sp.budget_montant, sp.budget_depense,
        sp.budget_date_debut, sp.budget_date_fin,
        COALESCE(SUM(asp.clics * sp.prix_par_click), 0) as cout_estime
      FROM sponsor_pubs sp
      LEFT JOIN addon_pub_stats asp ON asp.pub_id = sp.id 
        AND asp.date >= DATE_TRUNC('day', NOW())
      WHERE sp.actif = true
      GROUP BY sp.id
    `);

    const now = new Date();
    let desactives = 0;
    let budgetExpires = [];

    for (const pub of result.rows) {
      const depense = parseFloat(pub.budget_depense || 0);
      const coutEstime = parseFloat(pub.cout_estime || 0);
      const totalDepense = Math.max(depense, coutEstime);

      if (totalDepense >= pub.budget_montant) {
        await pool.query(
          'UPDATE sponsor_pubs SET actif = false WHERE id = $1',
          [pub.id]
        );
        desactives++;
        budgetExpires.push({
          id: pub.id,
          raison: 'budget_atteint',
          depense: totalDepense,
          budget: pub.budget_montant
        });
        continue;
      }

      const debut = new Date(pub.budget_date_debut);
      let reset = false;

      if (pub.budget_type === 'jour') {
        const diffJours = Math.floor((now.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
        if (diffJours >= 1) reset = true;
      } else if (pub.budget_type === 'semaine') {
        const diffSemaines = Math.floor((now.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24 * 7));
        if (diffSemaines >= 1) reset = true;
      } else if (pub.budget_type === 'mois') {
        const diffMois = (now.getFullYear() - debut.getFullYear()) * 12 + now.getMonth() - debut.getMonth();
        if (diffMois >= 1) reset = true;
      } else if (pub.budget_type === 'annee') {
        const diffAnnees = now.getFullYear() - debut.getFullYear();
        if (diffAnnees >= 1) reset = true;
      }

      if (reset) {
        await pool.query(
          `UPDATE sponsor_pubs SET 
            budget_depense = 0,
            budget_date_debut = NOW(),
            budget_date_fin = NOW() + INTERVAL '1 ' || 
              CASE budget_type 
                WHEN 'jour' THEN 'day'
                WHEN 'semaine' THEN 'week'
                WHEN 'mois' THEN 'month'
                WHEN 'annee' THEN 'year'
              END
           WHERE id = $1`,
          [pub.id]
        );
        budgetExpires.push({
          id: pub.id,
          raison: 'reset_periode',
          type: pub.budget_type
        });
      }
    }

    res.json({
      success: true,
      pubs_verifies: result.rows.length,
      desactives,
      budgetExpires
    });
  } catch (error) {
    console.error('❌ Erreur vérification budgets:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification des budgets' });
  }
});

// ── WEBHOOK POUR LES CLICS (mise à jour du budget) ──────────────────
router.post('/webhook/click', async (req, res) => {
  try {
    const { pub_id, cout } = req.body;

    if (!pub_id) {
      return res.status(400).json({ error: 'pub_id requis' });
    }

    await pool.query(
      `UPDATE sponsor_pubs SET 
        budget_depense = budget_depense + $1,
        updated_at = NOW()
       WHERE id = $2`,
      [cout || 0.50, pub_id]
    );

    const check = await pool.query(
      `SELECT budget_montant, budget_depense FROM sponsor_pubs WHERE id = $1`,
      [pub_id]
    );

    if (check.rows.length > 0) {
      const { budget_montant, budget_depense } = check.rows[0];
      if (budget_depense >= budget_montant) {
        await pool.query(
          `UPDATE sponsor_pubs SET actif = false WHERE id = $1`,
          [pub_id]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur webhook click:', error);
    res.status(500).json({ error: 'Erreur lors du webhook' });
  }
});

module.exports = router;