// routes/produits.js — Collections, Tags, Types
const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ── COLLECTIONS (/api/collections) ───────────────────────────────────────────
router.get('/collections', async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, nom as name, active as status, description, image, ordre, date_creation FROM categories ORDER BY ordre`);
        res.json(result.rows.map(row => ({
            id: row.id, name: row.name,
            status: row.status ? 'enabled' : 'disabled',
            productCount: 0, image: row.image,
            description: row.description, dateCreation: row.date_creation,
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/collections/:id', async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, nom as name, active as status, description, image, ordre, date_creation FROM categories WHERE id=$1`, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Collection non trouvée' });
        const row = result.rows[0];
        res.json({ id: row.id, name: row.name, status: row.status ? 'enabled' : 'disabled', productCount: 0, image: row.image, description: row.description, dateCreation: row.date_creation });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/collections', async (req, res) => {
    try {
        const { name, description, image, status } = req.body;
        const ordreResult = await pool.query('SELECT COALESCE(MAX(ordre), 0) + 1 as next_ordre FROM categories');
        const result = await pool.query(
            `INSERT INTO categories (nom, description, image, active, ordre, date_creation) VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) RETURNING *`,
            [name, description || null, image || null, status === 'enabled', ordreResult.rows[0].next_ordre]
        );
        const r = result.rows[0];
        res.json({ id: r.id, name: r.nom, status: r.active ? 'enabled' : 'disabled', productCount: 0, image: r.image, description: r.description, dateCreation: r.date_creation });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/collections/:id', async (req, res) => {
    try {
        const { name, description, image, status } = req.body;
        const result = await pool.query(
            `UPDATE categories SET nom=$1, description=$2, image=$3, active=$4 WHERE id=$5 RETURNING *`,
            [name, description || null, image || null, status === 'enabled', req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Collection non trouvée' });
        const r = result.rows[0];
        res.json({ id: r.id, name: r.nom, status: r.active ? 'enabled' : 'disabled', image: r.image, description: r.description });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/collections/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM categories WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Collection non trouvée' });
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TAGS (/api/tags) ──────────────────────────────────────────────────────────
router.get('/tags', async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM tags ORDER BY nom')).rows); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tags/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tags WHERE id=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Tag non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tags', async (req, res) => {
    try {
        const { nom, description, statut } = req.body;
        res.json((await pool.query('INSERT INTO tags (nom, description, statut) VALUES ($1,$2,$3) RETURNING *', [nom, description || null, statut || 'actif'])).rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/tags/:id', async (req, res) => {
    try {
        const { nom, description, statut } = req.body;
        const result = await pool.query('UPDATE tags SET nom=$1, description=$2, statut=$3 WHERE id=$4 RETURNING *', [nom, description, statut, req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Tag non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/tags/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM tags WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Tag non trouvé' });
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TYPES (/api/types) ────────────────────────────────────────────────────────
router.get('/types', async (req, res) => {
    try { res.json((await pool.query('SELECT * FROM types ORDER BY nom')).rows); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/types/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM types WHERE id=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Type non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/types', async (req, res) => {
    try {
        const { nom, description, statut } = req.body;
        res.json((await pool.query('INSERT INTO types (nom, description, statut) VALUES ($1,$2,$3) RETURNING *', [nom, description || null, statut || 'actif'])).rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/types/:id', async (req, res) => {
    try {
        const { nom, description, statut } = req.body;
        const result = await pool.query('UPDATE types SET nom=$1, description=$2, statut=$3 WHERE id=$4 RETURNING *', [nom, description, statut, req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Type non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/types/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM types WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Type non trouvé' });
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
