// routes/categories_admin.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

// ── GET /api/categories/public — toutes les catégories actives ──────────────
router.get('/public', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nom, parent_id, active 
             FROM categories 
             WHERE active = true 
             ORDER BY nom`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /api/categories/public:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/categories/public/hierarchie — catégories avec hiérarchie ──────
router.get('/public/hierarchie', async (req, res) => {
    try {
        const parents = await pool.query(
            `SELECT id, nom 
             FROM categories 
             WHERE parent_id IS NULL AND active = true 
             ORDER BY nom`
        );
        
        const categoriesWithChildren = await Promise.all(parents.rows.map(async (parent) => {
            const children = await pool.query(
                `SELECT id, nom 
                 FROM categories 
                 WHERE parent_id = $1 AND active = true 
                 ORDER BY nom`,
                [parent.id]
            );
            return {
                ...parent,
                sous_categories: children.rows
            };
        }));
        
        res.json(categoriesWithChildren);
    } catch (err) {
        console.error('Erreur GET /api/categories/public/hierarchie:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ROUTES ADMIN (avec authentification)
// ============================================

// ── GET /api/admin/categories — toutes les catégories ────────────────────────
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nom, description, ordre, active, created_at
             FROM categories ORDER BY ordre ASC NULLS LAST, nom ASC`
        );
        res.json({ categories: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/admin/categories — créer ───────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nom, description, ordre } = req.body;
        if (!nom?.trim()) return res.status(400).json({ error: 'Le nom est obligatoire.' });
        const result = await pool.query(
            `INSERT INTO categories (nom, description, ordre, active) VALUES ($1, $2, $3, true) RETURNING *`,
            [nom.trim(), description || null, ordre || null]
        );
        res.status(201).json({ success: true, categorie: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/admin/categories/:id — modifier ─────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { nom, description, ordre, active } = req.body;
        const result = await pool.query(
            `UPDATE categories SET nom=$1, description=$2, ordre=$3, active=$4 WHERE id=$5 RETURNING *`,
            [nom?.trim(), description || null, ordre || null, active !== false, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
        res.json({ success: true, categorie: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/admin/categories/:id/toggle — activer/désactiver ──────────────
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE categories SET active = NOT active WHERE id=$1 RETURNING id, nom, active`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
        res.json({ success: true, categorie: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/admin/categories/:id — supprimer ─────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM categories WHERE id=$1 RETURNING id, nom`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
        res.json({ success: true, message: `Catégorie "${result.rows[0].nom}" supprimée` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;