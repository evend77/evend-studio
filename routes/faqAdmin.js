// routes/faqAdmin.js
// FAQ Admin plateforme e-Vend — CRUD complet
// SEPARÉ de la table faq vendeurs (qui a vendeur_id)

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.use(authenticateToken, isAdmin);

// GET /api/faq-admin — Liste toutes les questions
router.get('/', async (req, res) => {
  const { categorie, q, active } = req.query;
  try {
    let conditions = [];
    let params = [];
    let idx = 1;
    if (categorie) { conditions.push(`categorie = $${idx++}`); params.push(categorie); }
    if (q) { conditions.push(`(question ILIKE $${idx} OR reponse ILIKE $${idx})`); params.push(`%${q}%`); idx++; }
    if (active !== undefined) { conditions.push(`active = $${idx++}`); params.push(active === 'true'); }
    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const result = await pool.query(`SELECT * FROM faq_admin ${where} ORDER BY ordre ASC, id ASC`, params);
    const stats = await pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE active = true) AS visibles, COUNT(*) FILTER (WHERE active = false) AS masquees, COUNT(DISTINCT categorie) AS nb_categories FROM faq_admin`);
    const categories = await pool.query(`SELECT DISTINCT categorie, COUNT(*) AS nb FROM faq_admin GROUP BY categorie ORDER BY categorie`);
    res.json({ questions: result.rows, stats: stats.rows[0], categories: categories.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/faq-admin — Creer une question
router.post('/', async (req, res) => {
  const { question, reponse, categorie, ordre } = req.body;
  if (!question || !reponse) return res.status(400).json({ error: 'question et reponse requis' });
  try {
    let ordreItem = ordre;
    if (!ordreItem) {
      const max = await pool.query(`SELECT COALESCE(MAX(ordre), 0) + 1 AS next FROM faq_admin`);
      ordreItem = max.rows[0].next;
    }
    const result = await pool.query(
      `INSERT INTO faq_admin (question, reponse, categorie, ordre, active) VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [question, reponse, categorie || 'General', ordreItem]
    );
    res.status(201).json({ question: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/faq-admin/:id — Modifier une question
router.patch('/:id', async (req, res) => {
  const { question, reponse, categorie, active, ordre } = req.body;
  try {
    const result = await pool.query(
      `UPDATE faq_admin SET question = COALESCE($1, question), reponse = COALESCE($2, reponse), categorie = COALESCE($3, categorie), active = COALESCE($4, active), ordre = COALESCE($5, ordre), updated_at = NOW() WHERE id = $6 RETURNING *`,
      [question, reponse, categorie, active, ordre, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Question introuvable' });
    res.json({ question: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/faq-admin/reordonner
router.put('/reordonner', async (req, res) => {
  const { ordres } = req.body;
  if (!Array.isArray(ordres)) return res.status(400).json({ error: 'ordres requis' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, ordre } of ordres) {
      await client.query(`UPDATE faq_admin SET ordre = $1, updated_at = NOW() WHERE id = $2`, [ordre, id]);
    }
    await client.query('COMMIT');
    res.json({ message: 'Ordre mis a jour' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /api/faq-admin/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM faq_admin WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Question supprimee' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/faq-admin/public — FAQ publique sans auth
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, question, reponse, categorie, ordre FROM faq_admin WHERE active = true ORDER BY ordre ASC, id ASC`);
    res.json({ questions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;