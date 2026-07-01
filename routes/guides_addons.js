// routes/guides_addons.js
//
// GET  /api/guides-addons/public/:addon_id  — lecture publique (vendeur)
// GET  /api/guides-addons/public            — tous les guides actifs
// GET  /api/guides-addons                   — tous les guides (admin)
// GET  /api/guides-addons/:addon_id         — un guide (admin)
// POST /api/guides-addons                   — créer un guide (admin)
// PATCH /api/guides-addons/:addon_id        — modifier un guide (admin)
// DELETE /api/guides-addons/:addon_id       — supprimer un guide (admin)

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// =============================================================================
// ROUTES PUBLIQUES
// =============================================================================

// GET /api/guides-addons/public/:addon_id
router.get('/public/:addon_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT addon_id, titre, emoji, description, contenu, updated_at
         FROM guides_addons
        WHERE addon_id = $1 AND actif = true`,
      [req.params.addon_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guide introuvable.' });
    }
    res.json({ guide: result.rows[0] });
  } catch (err) {
    console.error('GET /guides-addons/public/:addon_id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/guides-addons/public — tous les guides actifs
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT addon_id, titre, emoji, description, updated_at
         FROM guides_addons
        WHERE actif = true
        ORDER BY ordre ASC, titre ASC`
    );
    res.json({ guides: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// ROUTES ADMIN
// =============================================================================

// GET /api/guides-addons — tous les guides
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM guides_addons ORDER BY ordre ASC, titre ASC`
    );
    res.json({ guides: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/guides-addons/:addon_id — un guide
router.get('/:addon_id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM guides_addons WHERE addon_id = $1`,
      [req.params.addon_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guide introuvable.' });
    }
    res.json({ guide: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guides-addons — créer un guide
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { addon_id, titre, emoji, description, contenu, actif, ordre } = req.body;
  if (!addon_id?.trim() || !titre?.trim()) {
    return res.status(400).json({ error: 'addon_id et titre sont requis.' });
  }
  try {
    const existing = await pool.query(
      `SELECT addon_id FROM guides_addons WHERE addon_id = $1`, [addon_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Un guide pour l'add-on "${addon_id}" existe déjà.` });
    }
    const result = await pool.query(
      `INSERT INTO guides_addons (addon_id, titre, emoji, description, contenu, actif, ordre, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Admin')
       RETURNING *`,
      [addon_id.trim(), titre.trim(), emoji || '📖', description || '', contenu || '', actif !== false, ordre || 0]
    );
    res.status(201).json({ guide: result.rows[0] });
  } catch (err) {
    console.error('POST /guides-addons :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/guides-addons/:addon_id — modifier
router.patch('/:addon_id', authenticateToken, isAdmin, async (req, res) => {
  const { titre, emoji, description, contenu, actif, ordre, addon_id: nouvelAddonId } = req.body;
  try {
    const result = await pool.query(
      `UPDATE guides_addons SET
         titre       = COALESCE($1, titre),
         emoji       = COALESCE($2, emoji),
         description = COALESCE($3, description),
         contenu     = COALESCE($4, contenu),
         actif       = COALESCE($5, actif),
         ordre       = COALESCE($6, ordre),
         addon_id    = COALESCE($7, addon_id),
         updated_at  = NOW(),
         updated_by  = 'Admin'
       WHERE addon_id = $8
       RETURNING *`,
      [titre, emoji, description, contenu, actif, ordre, nouvelAddonId || null, req.params.addon_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guide introuvable.' });
    }
    res.json({ guide: result.rows[0] });
  } catch (err) {
    console.error('PATCH /guides-addons/:addon_id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/guides-addons/:addon_id — supprimer
router.delete('/:addon_id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM guides_addons WHERE addon_id = $1 RETURNING addon_id`,
      [req.params.addon_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guide introuvable.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;