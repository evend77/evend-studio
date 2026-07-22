// routes/sponsor_2fa.js
// GET /api/sponsors/2fa — lire l'état F2A du commanditaire connecté
// PUT /api/sponsors/2fa — activer/désactiver, body : { enabled: boolean }
// Utilise req.user.id (le token) — un commanditaire ne gère que son propre compte.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/2fa', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'commanditaire') return res.status(403).json({ error: 'Accès non autorisé.' });
    const result = await pool.query(
      `SELECT two_factor_enabled FROM sponsors WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compte introuvable.' });
    res.json({ two_factor_enabled: !!result.rows[0].two_factor_enabled });
  } catch (err) {
    console.error('GET /sponsors/2fa :', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/2fa', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'commanditaire') return res.status(403).json({ error: 'Accès non autorisé.' });
    const { enabled } = req.body;
    const result = await pool.query(
      `UPDATE sponsors SET two_factor_enabled = $1 WHERE id = $2 RETURNING id`,
      [!!enabled, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Compte introuvable.' });
    res.json({ success: true, two_factor_enabled: !!enabled });
  } catch (err) {
    console.error('PUT /sponsors/2fa :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;