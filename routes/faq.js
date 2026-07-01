// routes/faq.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/faq/ma-faq — toutes les questions du vendeur connecté ───────────
router.get('/ma-faq', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, question, reponse, ordre, active, created_at, updated_at
             FROM faq
             WHERE vendeur_id = $1
             ORDER BY ordre ASC, created_at ASC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ GET /api/faq/ma-faq:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/faq/vendeur/:vendeurId — FAQ publique d'une boutique ─────────────
router.get('/vendeur/:vendeurId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, question, reponse, ordre
             FROM faq
             WHERE vendeur_id = $1 AND active = TRUE
             ORDER BY ordre ASC, created_at ASC`,
            [req.params.vendeurId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('❌ GET /api/faq/vendeur/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

//
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { question, reponse, ordre, active = true } = req.body;
        if (!question?.trim() || !reponse?.trim()) {
            return res.status(400).json({ error: 'La question et la réponse sont obligatoires.' });
        }
        // Calculer le prochain ordre si non fourni
        let ordreVal = ordre;
        if (!ordreVal) {
            const count = await pool.query('SELECT COUNT(*) FROM faq WHERE vendeur_id = $1', [req.user.id]);
            ordreVal = parseInt(count.rows[0].count) + 1;
        }

        const result = await pool.query(
            `INSERT INTO faq (vendeur_id, question, reponse, ordre, active)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [req.user.id, question.trim(), reponse.trim(), ordreVal, active]
        );
        console.log('✅ FAQ créée:', result.rows[0].id, '|', result.rows[0].question.slice(0, 40));
        res.status(201).json({ success: true, faq: result.rows[0] });
    } catch (err) {
        console.error('❌ POST /api/faq:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/faq/reordonner — sauvegarder le nouvel ordre ────────────────────
router.put('/reordonner', authenticateToken, async (req, res) => {
    try {
        const { ordre } = req.body; // [{ id, ordre }, ...]
        if (!Array.isArray(ordre)) {
            return res.status(400).json({ error: 'Format invalide.' });
        }
        // Mettre à jour chaque entrée
        for (const item of ordre) {
            await pool.query(
                'UPDATE faq SET ordre = $1, updated_at = NOW() WHERE id = $2 AND vendeur_id = $3',
                [item.ordre, item.id, req.user.id]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error('❌ PUT /api/faq/reordonner:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/faq/:id — modifier une question ─────────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { question, reponse, ordre, active } = req.body;

        const check = await pool.query(
            'SELECT id FROM faq WHERE id = $1 AND vendeur_id = $2',
            [req.params.id, req.user.id]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Question non trouvée ou accès refusé.' });
        }

        const sets = ['updated_at = NOW()'];
        const vals = [];
        let idx = 1;

        if (question !== undefined) { sets.push(`question = $${idx++}`); vals.push(question.trim()); }
        if (reponse  !== undefined) { sets.push(`reponse = $${idx++}`);  vals.push(reponse.trim()); }
        if (ordre    !== undefined) { sets.push(`ordre = $${idx++}`);    vals.push(ordre); }
        if (active   !== undefined) { sets.push(`active = $${idx++}`);   vals.push(active); }

        vals.push(req.params.id);
        const result = await pool.query(
            `UPDATE faq SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
            vals
        );
        console.log('✅ FAQ mise à jour:', result.rows[0].id);
        res.json({ success: true, faq: result.rows[0] });
    } catch (err) {
        console.error('❌ PUT /api/faq/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/faq/:id — supprimer une question ─────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM faq WHERE id = $1 AND vendeur_id = $2 RETURNING id, question',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question non trouvée ou accès refusé.' });
        }
        console.log('🗑️ FAQ supprimée:', result.rows[0].id);
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) {
        console.error('❌ DELETE /api/faq/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
