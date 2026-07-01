// routes/types_produits.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ── GET /api/types-produits — liste publique ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, description, actif FROM types_produits WHERE actif = true ORDER BY nom ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET /api/types-produits:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
