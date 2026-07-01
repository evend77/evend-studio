// routes/acheteurs_config.js
// Routes pour la configuration générale de l'acheteur
// Montées sous /api/acheteurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// GET /api/acheteurs/:acheteurId/config
// Récupère la configuration d'un acheteur
// ============================================================
router.get('/:acheteurId/config', authenticateToken, async (req, res) => {
    try {
        const acheteurId = parseInt(req.params.acheteurId);
        const isAuthorized = req.user.id === acheteurId || req.user.role === 'admin' || req.user.role === 'administration';
        
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        // Vérifier si l'acheteur existe
        const acheteurCheck = await pool.query(
            'SELECT id, email, nom FROM acheteurs WHERE id = $1',
            [acheteurId]
        );
        
        if (acheteurCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Acheteur non trouvé' });
        }

        // Récupérer ou créer la configuration
        let configResult = await pool.query(
            `SELECT * FROM config_acheteur WHERE acheteur_id = $1`,
            [acheteurId]
        );
        
        if (configResult.rows.length === 0) {
            // Créer une configuration par défaut
            const insertResult = await pool.query(
                `INSERT INTO config_acheteur (acheteur_id, deux_facteurs_actif, notifications_actif, alertes_email_actif)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [acheteurId, false, true, true]
            );
            configResult = insertResult;
        }

        // Ajouter les infos de base de l'acheteur
        const config = {
            ...configResult.rows[0],
            email: acheteurCheck.rows[0].email,
            nom: acheteurCheck.rows[0].nom
        };

        res.json(config);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/acheteurs/:acheteurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// PUT /api/acheteurs/:acheteurId/config
// Met à jour la configuration d'un acheteur
// ============================================================
router.put('/:acheteurId/config', authenticateToken, async (req, res) => {
    try {
        const acheteurId = parseInt(req.params.acheteurId);
        const isAuthorized = req.user.id === acheteurId || req.user.role === 'admin' || req.user.role === 'administration';
        
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        const data = req.body;
        
        // Vérifier si l'acheteur existe
        const acheteurCheck = await pool.query(
            'SELECT id FROM acheteurs WHERE id = $1',
            [acheteurId]
        );
        
        if (acheteurCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Acheteur non trouvé' });
        }

        // Mettre à jour ou insérer la configuration
        const result = await pool.query(
            `INSERT INTO config_acheteur (
                acheteur_id, 
                deux_facteurs_actif,
                notifications_actif,
                alertes_email_actif,
                mise_maximale_defaut,
                tags_suivi,
                categories_preferees,
                updated_at
            ) VALUES ($1, COALESCE($2, false), COALESCE($3, true), COALESCE($4, true), $5, $6, $7, CURRENT_TIMESTAMP)
            ON CONFLICT (acheteur_id) DO UPDATE SET
                deux_facteurs_actif = COALESCE(EXCLUDED.deux_facteurs_actif, config_acheteur.deux_facteurs_actif),
                notifications_actif = COALESCE(EXCLUDED.notifications_actif, config_acheteur.notifications_actif),
                alertes_email_actif = COALESCE(EXCLUDED.alertes_email_actif, config_acheteur.alertes_email_actif),
                mise_maximale_defaut = COALESCE(EXCLUDED.mise_maximale_defaut, config_acheteur.mise_maximale_defaut),
                tags_suivi = COALESCE(EXCLUDED.tags_suivi, config_acheteur.tags_suivi),
                categories_preferees = COALESCE(EXCLUDED.categories_preferees, config_acheteur.categories_preferees),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
                acheteurId,
                data.deux_facteurs_actif,
                data.notifications_actif,
                data.alertes_email_actif,
                data.mise_maximale_defaut || null,
                data.tags_suivi || [],
                data.categories_preferees || []
            ]
        );

        // Logger l'action
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) 
             VALUES ($1, $2, $3, $4)`,
            ['CONFIG_ACHETEUR_UPDATE', req.user?.email || 'acheteur', 
             JSON.stringify({ acheteur_id: acheteurId, updates: Object.keys(data) }), 'info']
        ).catch(e => console.error('Erreur log:', e));

        console.log(`✅ Configuration mise à jour pour l'acheteur ${acheteurId}`);
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur PUT /api/acheteurs/:acheteurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// PATCH /api/acheteurs/:acheteurId/config
// Mise à jour partielle de la configuration
// ============================================================
router.patch('/:acheteurId/config', authenticateToken, async (req, res) => {
    try {
        const acheteurId = parseInt(req.params.acheteurId);
        const isAuthorized = req.user.id === acheteurId || req.user.role === 'admin' || req.user.role === 'administration';
        
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        const updates = req.body;
        const fields = Object.keys(updates);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        // Construire la requête dynamique
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        const values = [...Object.values(updates), acheteurId];
        
        const result = await pool.query(
            `UPDATE config_acheteur 
             SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
             WHERE acheteur_id = $${values.length} 
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvée' });
        }

        console.log(`✅ Configuration partielle mise à jour pour l'acheteur ${acheteurId}`);
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur PATCH /api/acheteurs/:acheteurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;