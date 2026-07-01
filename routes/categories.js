// routes/categories.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/categories — liste toutes les catégories (public) ────────────────
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nom, active, description, image,
                    (SELECT COUNT(*) FROM produits p WHERE p.categorie_id = categories.id) AS product_count
             FROM categories
             ORDER BY nom ASC`
        );
        res.json({ categories: result.rows });
    } catch (err) {
        console.error('❌ GET /api/categories:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/categories/:id — une catégorie ───────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/categories — créer (admin seulement) ────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nom, description, image, active = true } = req.body;
        if (!nom?.trim()) return res.status(400).json({ error: 'Le nom est obligatoire' });

        const result = await pool.query(
            `INSERT INTO categories (nom, description, image, active)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nom.trim(), description || null, image || null, active]
        );
        console.log('✅ Catégorie créée:', result.rows[0].id, '|', nom);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ POST /api/categories:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/categories/:id — modifier ───────────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { nom, description, image, active } = req.body;
        if (!nom?.trim()) return res.status(400).json({ error: 'Le nom est obligatoire' });

        const result = await pool.query(
            `UPDATE categories SET nom=$1, description=$2, image=$3, active=$4
             WHERE id=$5 RETURNING *`,
            [nom.trim(), description || null, image || null, active !== undefined ? active : true, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
        console.log('✅ Catégorie modifiée:', req.params.id, '|', nom);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ PUT /api/categories:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/categories/:id — supprimer ────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM categories WHERE id=$1 RETURNING id, nom',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
        console.log('🗑️ Catégorie supprimée:', result.rows[0].id, '|', result.rows[0].nom);
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('❌ DELETE /api/categories:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
