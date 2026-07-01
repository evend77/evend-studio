// routes/politiquesPlateforme.js
// Politiques de e-Vend Studio — conditions, confidentialité, etc.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ─── ROUTE PUBLIQUE ───────────────────────────────────────────────────────
// GET /api/politiques/public/:slug — Sans auth pour affichage sur le site
router.get('/public/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, contenu, updated_at FROM politiques_plateforme WHERE slug = $1 AND actif = true`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Politique introuvable' });
    res.json({ politique: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/politiques/public — Toutes les politiques actives
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, contenu, updated_at FROM politiques_plateforme WHERE actif = true ORDER BY id`
    );
    res.json({ politiques: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES ADMIN ─────────────────────────────────────────────────────────
router.use(authenticateToken, isAdmin);

// GET /api/politiques — Toutes les politiques (admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM politiques_plateforme ORDER BY id`
    );
    res.json({ politiques: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/politiques/:slug — Sauvegarder une politique
router.patch('/:slug', async (req, res) => {
  const { contenu, titre, actif } = req.body;
  try {
    const result = await pool.query(
      `UPDATE politiques_plateforme SET
        contenu    = COALESCE($1, contenu),
        titre      = COALESCE($2, titre),
        actif      = COALESCE($3, actif),
        updated_at = NOW(),
        updated_by = 'Administrateur'
       WHERE slug = $4 RETURNING *`,
      [contenu, titre, actif, req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Politique introuvable' });
    res.json({ politique: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;