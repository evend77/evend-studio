// routes/paypal_admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ============================================
// ROUTES POUR LA CONFIGURATION PAYPAL ADMIN
// ============================================

// GET - Récupérer la configuration PayPal
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM configuration_paypal_admin WHERE id = 1'
        );
        
        if (result.rows.length === 0) {
            const newConfig = await pool.query(
                `INSERT INTO configuration_paypal_admin (id) VALUES (1) RETURNING *`
            );
            return res.json(newConfig.rows[0]);
        }
        
        res.json(result.rows[0]);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/admin/paypal:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Mettre à jour toute la configuration PayPal
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const data = req.body;
        
        console.log('========================================');
        console.log('📥 SAUVEGARDE CONFIG PAYPAL ADMIN');
        console.log('========================================');
        console.log('🔑 Utilisateur:', req.user?.email);
        
        // Vérifier que la ligne id=1 existe
        const rowCheck = await pool.query('SELECT id FROM configuration_paypal_admin WHERE id = 1');
        
        if (rowCheck.rows.length === 0) {
            await pool.query('INSERT INTO configuration_paypal_admin (id) VALUES (1)');
        }
        
        const query = `
            UPDATE configuration_paypal_admin SET
                -- Paramètres généraux
                sandbox = COALESCE($1, sandbox),
                autopay = COALESCE($2, autopay),
                pay_after = COALESCE($3, pay_after),
                client_id = COALESCE($4, client_id),
                secret_key = COALESCE($5, secret_key),
                delai_vendeur = COALESCE($6, delai_vendeur),
                montant_min = COALESCE($7, montant_min),
                devise = COALESCE($8, devise),
                frais_pris_en = COALESCE($9, frais_pris_en),
                
                -- Paramètres AutoPay & Planification
                schedule_autopay = COALESCE($10, schedule_autopay),
                transaction_type = COALESCE($11, transaction_type),
                period = COALESCE($12, period),
                billing_day = COALESCE($13, billing_day),
                billing_date = COALESCE($14, billing_date),
                delai_traitement = COALESCE($15, delai_traitement),
                montant_min_auto = COALESCE($16, montant_min_auto),
                notif_vendeur = COALESCE($17, notif_vendeur),
                notif_admin = COALESCE($18, notif_admin),
                
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
            RETURNING *
        `;
        
        const values = [
            // Paramètres généraux (1-9)
            data.sandbox,
            data.autopay,
            data.pay_after,
            data.client_id,
            data.secret_key,
            data.delai_vendeur,
            data.montant_min,
            data.devise,
            data.frais_pris_en,
            
            // Paramètres AutoPay & Planification (10-18)
            data.schedule_autopay,
            data.transaction_type,
            data.period,
            data.billing_day,
            data.billing_date,
            data.delai_traitement,
            data.montant_min_auto,
            data.notif_vendeur,
            data.notif_admin
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['CONFIG_PAYPAL_ADMIN_UPDATE', req.user?.email || 'admin',
             JSON.stringify({ updated_by: req.user?.email, timestamp: new Date().toISOString() }), 'info']
        ).catch(e => console.error('Erreur log:', e.message));
        
        console.log('✅ Configuration PayPal admin sauvegardee');
        console.log('========================================\n');
        
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur POST /api/admin/paypal:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH - Mettre à jour partiellement la configuration PayPal
router.patch('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnee a mettre a jour' });
        }
        
        // Mapper les noms camelCase vers snake_case
        const columnMap = {
            'sandbox': 'sandbox',
            'autopay': 'autopay',
            'payAfter': 'pay_after',
            'clientId': 'client_id',
            'secretKey': 'secret_key',
            'delaiVendeur': 'delai_vendeur',
            'montantMin': 'montant_min',
            'devise': 'devise',
            'fraisPrisEn': 'frais_pris_en',
            'scheduleAutopay': 'schedule_autopay',
            'transactionType': 'transaction_type',
            'period': 'period',
            'billingDay': 'billing_day',
            'billingDate': 'billing_date',
            'delaiTraitement': 'delai_traitement',
            'montantMinAuto': 'montant_min_auto',
            'notifVendeur': 'notif_vendeur',
            'notifAdmin': 'notif_admin'
        };
        
        const dbFields = fields.map(f => columnMap[f] || f);
        const values = Object.values(updates);
        const setClause = dbFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        values.push(1);
        
        const query = `
            UPDATE configuration_paypal_admin 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${values.length}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur PATCH /api/admin/paypal:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ROUTES POUR LES VENDEURS PAYPAL CONNECT
// ============================================

// GET - Récupérer tous les vendeurs PayPal Connect
router.get('/vendeurs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { statut, recherche } = req.query;
        
        let query = 'SELECT * FROM vendeurs_paypal_connect_admin WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (statut && statut !== 'tous') {
            query += ` AND paypal_account_status = $${paramIndex}`;
            params.push(statut);
            paramIndex++;
        }
        
        if (recherche) {
            query += ` AND (vendeur_nom ILIKE $${paramIndex} OR vendeur_email ILIKE $${paramIndex} OR paypal_email ILIKE $${paramIndex})`;
            params.push(`%${recherche}%`);
            paramIndex++;
        }
        
        query += ' ORDER BY connected_at DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/admin/paypal/vendeurs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Récupérer un vendeur PayPal Connect par ID
router.get('/vendeurs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        
        const result = await pool.query(
            'SELECT * FROM vendeurs_paypal_connect_admin WHERE vendeur_id = $1',
            [vendeurId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendeur non trouve' });
        }
        
        res.json(result.rows[0]);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/admin/paypal/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT - Mettre à jour le statut d'un vendeur PayPal Connect
router.put('/vendeurs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        const { paypal_account_status, paypal_payouts_enabled, paypal_verification_disabled_reason } = req.body;
        
        const query = `
            UPDATE vendeurs_paypal_connect_admin SET
                paypal_account_status = COALESCE($1, paypal_account_status),
                paypal_payouts_enabled = COALESCE($2, paypal_payouts_enabled),
                paypal_verification_disabled_reason = COALESCE($3, paypal_verification_disabled_reason),
                last_sync_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE vendeur_id = $4
            RETURNING *
        `;
        
        const values = [
            paypal_account_status,
            paypal_payouts_enabled,
            paypal_verification_disabled_reason,
            vendeurId
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendeur non trouve' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['PAYPAL_VENDEUR_UPDATE', req.user?.email || 'admin',
             JSON.stringify({ vendeur_id: vendeurId, nouveau_statut: paypal_account_status }), 'info']
        ).catch(e => console.error('Erreur log:', e.message));
        
        res.json({ success: true, vendeur: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur PUT /api/admin/paypal/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Synchroniser les vendeurs PayPal (à appeler périodiquement)
router.post('/vendeurs/sync', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Ici, tu pourras appeler l'API PayPal pour synchroniser les vendeurs
        // Pour l'instant, on met juste à jour last_sync_at
        await pool.query(
            `UPDATE vendeurs_paypal_connect_admin SET last_sync_at = CURRENT_TIMESTAMP`
        );
        
        res.json({ success: true, message: 'Synchronisation lancee' });
        
    } catch (err) {
        console.error('❌ Erreur POST /api/admin/paypal/vendeurs/sync:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Supprimer un vendeur PayPal Connect (déconnecter)
router.delete('/vendeurs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        
        const result = await pool.query(
            'DELETE FROM vendeurs_paypal_connect_admin WHERE vendeur_id = $1 RETURNING vendeur_id, vendeur_nom',
            [vendeurId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendeur non trouve' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['PAYPAL_VENDEUR_DELETE', req.user?.email || 'admin',
             JSON.stringify({ vendeur_id: vendeurId, vendeur_nom: result.rows[0].vendeur_nom }), 'warning']
        ).catch(e => console.error('Erreur log:', e.message));
        
        res.json({ success: true, message: 'Vendeur deconnecte de PayPal' });
        
    } catch (err) {
        console.error('❌ Erreur DELETE /api/admin/paypal/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;