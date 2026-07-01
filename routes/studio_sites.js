// routes/studio_sites.js
// e-Vend Studio — Routes pour la config des sites des gestionnaires
// Utilisé par ConfigMesPagesSimplisse, ConfigMesPagesPremium, SitePreview

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── GET /api/studio/sites/:gestionnaireId ───────────────────────────────────
// Retourne les infos du site + config JSON du gestionnaire
router.get('/:gestionnaireId', async (req, res) => {
  try {
    const { gestionnaireId } = req.params;

    const result = await pool.query(
      `SELECT s.id, s.gestionnaire_id, s.template_id, s.config, s.publie,
              g.nom_boutique, g.plan, g.logo_url, g.banniere_url, g.description
       FROM sites s
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.gestionnaire_id = $1
       LIMIT 1`,
      [gestionnaireId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Site non trouvé.' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /studio/sites/:gestionnaireId', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/studio/sites/:gestionnaireId/config ────────────────────────────
// Sauvegarde la config JSON du site (merge avec l'existant)
router.put('/:gestionnaireId/config', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

    // Vérifier que le gestionnaire modifie son propre site (ou admin)
    if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    const configPatch = req.body; // ex: { simplisse: {...} } ou { premium: {...} }

    // Charger la config existante
    const existing = await pool.query(
      'SELECT config FROM sites WHERE gestionnaire_id = $1 LIMIT 1',
      [gestionnaireId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ success: false, message: 'Site non trouvé.' });
    }

    const configActuelle = existing.rows[0].config || {};

    // Merger — garder les autres clés, écraser seulement ce qui est envoyé
    const nouvelleConfig = { ...configActuelle, ...configPatch };

    await pool.query(
      `UPDATE sites SET config = $1, updated_at = NOW()
       WHERE gestionnaire_id = $2`,
      [JSON.stringify(nouvelleConfig), gestionnaireId]
    );

    console.log(`✅ Config site mis à jour — gestionnaire ${gestionnaireId}`);
    return res.json({ success: true, config: nouvelleConfig });

  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/config', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/studio/sites/:gestionnaireId/template ──────────────────────────
// Change le template actif du gestionnaire
router.put('/:gestionnaireId/template', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { template_id } = req.body;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

    if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    if (!template_id) {
      return res.status(400).json({ success: false, message: 'template_id requis.' });
    }

    await pool.query(
      `UPDATE sites SET template_id = $1, updated_at = NOW()
       WHERE gestionnaire_id = $2`,
      [template_id, gestionnaireId]
    );

    return res.json({ success: true, template_id });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/template', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/studio/sites/:gestionnaireId/publier ───────────────────────────
// Publier / dépublier le site
router.put('/:gestionnaireId/publier', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { publie } = req.body;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';

    if (!isAdmin && String(req.user.id) !== String(gestionnaireId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }

    await pool.query(
      'UPDATE sites SET publie = $1, updated_at = NOW() WHERE gestionnaire_id = $2',
      [publie === true, gestionnaireId]
    );

    return res.json({ success: true, publie: publie === true });
  } catch (err) {
    console.error('PUT /studio/sites/:gestionnaireId/publier', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;