// routes/blogs.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/blogs/mes-blogs — tous les blogs du vendeur connecté ────────────
router.get('/mes-blogs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, titre, contenu, statut, tags, vues,
                    date_creation, date_publication, updated_at
             FROM blogs
             WHERE vendeur_id = $1
             ORDER BY date_creation DESC`,
            [req.user.id]
        );
        const blogs = result.rows.map(b => ({
            ...b,
            tags: b.tags ? b.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        }));
        res.json(blogs);
    } catch (err) {
        console.error('❌ GET /api/blogs/mes-blogs:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/blogs/vendeur/:vendeurId — blogs publiés d'une boutique publique ─
router.get('/vendeur/:vendeurId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, titre, contenu, tags, vues, date_creation, date_publication
             FROM blogs
             WHERE vendeur_id = $1 AND statut = 'publie'
             ORDER BY date_publication DESC`,
            [req.params.vendeurId]
        );
        const blogs = result.rows.map(b => ({
            ...b,
            tags: b.tags ? b.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        }));
        res.json(blogs);
    } catch (err) {
        console.error('❌ GET /api/blogs/vendeur/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/blogs — créer un article ──────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { titre, contenu, statut = 'brouillon', tags = [] } = req.body;
        if (!titre?.trim() || !contenu?.trim()) {
            return res.status(400).json({ error: 'Le titre et le contenu sont obligatoires.' });
        }
        const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;
        const datePublication = statut === 'publie' ? new Date() : null;

        const result = await pool.query(
            `INSERT INTO blogs (vendeur_id, titre, contenu, statut, tags, date_publication)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [req.user.id, titre.trim(), contenu.trim(), statut, tagsStr, datePublication]
        );
        const blog = { ...result.rows[0], tags: result.rows[0].tags ? result.rows[0].tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
        console.log('✅ Blog créé:', blog.id, '|', blog.titre, '| statut:', blog.statut);
        res.status(201).json({ success: true, blog });
    } catch (err) {
        console.error('❌ POST /api/blogs:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/blogs/:id — modifier un article ─────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { titre, contenu, statut, tags } = req.body;

        const check = await pool.query(
            'SELECT id, statut, date_publication FROM blogs WHERE id = $1 AND vendeur_id = $2',
            [req.params.id, req.user.id]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Article non trouvé ou accès refusé.' });
        }

        const ancien = check.rows[0];
        const sets = ['updated_at = NOW()'];
        const vals = [];
        let idx = 1;

        if (titre !== undefined)   { sets.push(`titre = $${idx++}`);   vals.push(titre.trim()); }
        if (contenu !== undefined) { sets.push(`contenu = $${idx++}`); vals.push(contenu.trim()); }
        if (tags !== undefined) {
            const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;
            sets.push(`tags = $${idx++}`);
            vals.push(tagsStr);
        }
        if (statut !== undefined) {
            sets.push(`statut = $${idx++}`);
            vals.push(statut);
            if (statut === 'publie' && !ancien.date_publication) {
                sets.push(`date_publication = NOW()`);
            } else if (statut === 'brouillon') {
                sets.push(`date_publication = NULL`);
            }
        }

        vals.push(req.params.id);
        const result = await pool.query(
            `UPDATE blogs SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            vals
        );
        const blog = { ...result.rows[0], tags: result.rows[0].tags ? result.rows[0].tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
        console.log('✅ Blog mis à jour:', blog.id, '| statut:', blog.statut);
        res.json({ success: true, blog });
    } catch (err) {
        console.error('❌ PUT /api/blogs/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/blogs/:id — supprimer un article ─────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM blogs WHERE id = $1 AND vendeur_id = $2 RETURNING id, titre',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article non trouvé ou accès refusé.' });
        }
        console.log('🗑️ Blog supprimé:', result.rows[0].id, '|', result.rows[0].titre);
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('❌ DELETE /api/blogs/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/blogs/:id/vue — incrémenter les vues ───────────────────────────
router.post('/:id/vue', async (req, res) => {
    try {
        await pool.query('UPDATE blogs SET vues = vues + 1 WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
