// routes/audit.js — Audit logs
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin, isVendeur, isAcheteur } = require('../middleware/auth');

// ROUTES AUDIT LOGS
// ============================================================

router.post('/logs', authenticateToken, async (req, res) => {
    const { action, details, niveau } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    try {
        // details peut être string ou objet — on stocke toujours en string
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details || {});
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau, ip) VALUES ($1,$2,$3,$4,$5)`,
            [action, req.user?.email || 'système', detailsStr, niveau || 'info', ip]
        );
        res.status(201).json({ message: 'Log ajouté' });
    } catch (error) {
        console.error('Erreur ajout log:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

router.get('/logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM audit_logs ORDER BY date DESC LIMIT 1000')).rows);
    } catch (error) {
        console.error('Erreur GET logs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================


module.exports = router;
