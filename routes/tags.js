// routes/tags.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/tags — liste tous les tags (public) ──────────────────────────────
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, nom FROM tags ORDER BY nom ASC`);
        res.json({ tags: result.rows });
    } catch (err) {
        console.error('❌ GET /api/tags:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
