// routes/badges.js — Badges
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin, isVendeur, isAcheteur } = require('../middleware/auth');

// ROUTES BADGES
// ============================================================

router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM badges ORDER BY niveau ASC, nom ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur GET badges:', error);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});

router.put('/bulk/status', authenticateToken, isAdmin, async (req, res) => {
    const { ids, statut } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "Liste d'IDs requise" });
    if (!['actif', 'inactif'].includes(statut)) return res.status(400).json({ message: 'Statut invalide' });
    try {
        const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
        await pool.query(`UPDATE badges SET statut=$1 WHERE id IN (${placeholders})`, [statut, ...ids.map(String)]);
        res.json({ message: `${ids.length} badge(s) mis à jour`, updated: ids.length });
    } catch (error) {
        console.error('Erreur bulk update:', error);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});

router.delete('/bulk', authenticateToken, isAdmin, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "Liste d'IDs requise" });
    try {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const result = await pool.query(`DELETE FROM badges WHERE id IN (${placeholders})`, ids.map(String));
        res.json({ message: `${result.rowCount} badge(s) supprimé(s)`, deleted: result.rowCount });
    } catch (error) {
        console.error('Erreur bulk delete:', error);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});

router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM badges WHERE id=$1', [String(req.params.id)]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Badge non trouvé' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur GET badge:', error);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { nom, description, statut, icone, couleur, niveau, critere } = req.body;
    if (!nom) return res.status(400).json({ message: 'Le nom du badge est requis' });
    try {
        const result = await pool.query(
            `INSERT INTO badges (nom, description, statut, icone, couleur, niveau, critere, datecreation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE) RETURNING *`,
            [nom, description || null, statut || 'actif', icone || null, couleur || null, niveau || 1, critere || null]
        );
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['CREATION_BADGE', req.user?.email || 'admin', JSON.stringify({ id: result.rows[0].id, nom }), 'success']
        ).catch(e => console.error('Erreur log:', e));
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur POST badge:', error);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { nom, description, statut, icone, couleur, niveau, critere } = req.body;
    const id = String(req.params.id);
    try {
        const existing = await pool.query('SELECT * FROM badges WHERE id=$1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Badge non trouvé' });
        const updates = [];
        const values = [];
        let p = 1;
        if (nom !== undefined)         { updates.push(`nom=$${p++}`);         values.push(nom); }
        if (description !== undefined) { updates.push(`description=$${p++}`); values.push(description || null); }
        if (statut !== undefined)      { updates.push(`statut=$${p++}`);      values.push(statut); }
        if (icone !== undefined)       { updates.push(`icone=$${p++}`);       values.push(icone || null); }
        if (couleur !== undefined)     { updates.push(`couleur=$${p++}`);     values.push(couleur || null); }
        if (niveau !== undefined)      { updates.push(`niveau=$${p++}`);      values.push(niveau); }
        if (critere !== undefined)     { updates.push(`critere=$${p++}`);     values.push(critere || null); }
        if (updates.length === 0) return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
        values.push(id);
        const result = await pool.query(
            `UPDATE badges SET ${updates.join(', ')} WHERE id=$${p} RETURNING *`,
            values
        );
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['MODIFICATION_BADGE', req.user?.email || 'admin', JSON.stringify({ id, modifications: req.body }), 'info']
        ).catch(e => console.error('Erreur log:', e));
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur PUT badge:', error);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const id = String(req.params.id);
    try {
        const result = await pool.query('DELETE FROM badges WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Badge non trouvé' });
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['SUPPRESSION_BADGE', req.user?.email || 'admin', JSON.stringify({ id, nom: result.rows[0]?.nom }), 'error']
        ).catch(e => console.error('Erreur log:', e));
        res.json({ message: 'Badge supprimé avec succès' });
    } catch (error) {
        console.error('Erreur DELETE badge:', error);
        res.status(500).json({ message: 'Erreur serveur', detail: error.message });
    }
});




module.exports = router;
