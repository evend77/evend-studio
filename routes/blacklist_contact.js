// routes/blacklist_contact.js
// e-Vend Studio — Gestion de la liste noire anti-spam (admin plateforme)
// Monté dans server.js via : app.use('/api/blacklist-contact', require('./routes/blacklist_contact'));

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ─── GET /api/blacklist-contact — liste complète (admin) ───────────────────
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM blacklist_mots_contact ORDER BY mot ASC`);
    res.json({ mots: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/blacklist-contact — ajouter un mot (admin) ──────────────────
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const mot = (req.body?.mot || '').trim().toLowerCase();
  if (!mot) return res.status(400).json({ error: 'Le mot est requis.' });
  try {
    const result = await pool.query(
      `INSERT INTO blacklist_mots_contact (mot, created_by) VALUES ($1, $2)
       ON CONFLICT (mot) DO NOTHING RETURNING *`,
      [mot, req.user?.email || 'Administrateur']
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Ce mot est déjà dans la liste.' });
    }
    res.status(201).json({ mot: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/blacklist-contact/:id — retirer un mot (admin) ────────────
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM blacklist_mots_contact WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mot introuvable.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Utilisé par studio_contact.js — retourne juste le tableau de mots ─────
// Pas de auth ici : appelée en interne par studio_contact.js, pas exposée en route publique.
async function getListeMots() {
  const result = await pool.query(`SELECT mot FROM blacklist_mots_contact`);
  return result.rows.map(r => r.mot);
}

module.exports = router;
module.exports.getListeMots = getListeMots;