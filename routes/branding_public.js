// routes/branding_public.js
// e-Vend Studio — Endpoint public pour le badge "Propulsé par e-Vend Studio"
// Monté dans server.js via : app.use('/api/branding-public', require('./routes/branding_public'));
// PAS d'authentification — appelé depuis le site public par des visiteurs anonymes.

const express = require('express');
const router = express.Router();
const pool = require('../db');

// ─── GET /api/branding-public/gestionnaire/:id/cacher-propulse ─────────────
router.get('/gestionnaire/:id/cacher-propulse', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cacher_propulse FROM options_gestionnaire WHERE gestionnaire_id = $1`,
      [req.params.id]
    );
    // Aucune ligne = jamais configuré = badge visible par défaut (false)
    res.json({ cacher_propulse: result.rows[0]?.cacher_propulse || false });
  } catch (err) {
    // En cas d'erreur, on préfère montrer le badge plutôt que planter le site du visiteur
    res.json({ cacher_propulse: false });
  }
});

module.exports = router;