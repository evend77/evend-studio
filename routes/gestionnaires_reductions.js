// routes/vendeurs_reductions.js
// Routes pour les réductions / codes promo (sans Shopify - version debug)
// Montées sous /api/vendeurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /:vendeurId/reductions
router.get('/:vendeurId/reductions', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const { statut, recherche } = req.query;
        let query = 'SELECT * FROM reductions WHERE vendeur_id = $1';
        const params = [vendeurId];
        let paramIndex = 2;

        if (statut && statut !== 'tout') { query += ` AND statut = $${paramIndex}`; params.push(statut); paramIndex++; }
        if (recherche) { query += ` AND code ILIKE $${paramIndex}`; params.push(`%${recherche}%`); paramIndex++; }
        query += ' ORDER BY id DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Erreur GET /:vendeurId/reductions:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /:vendeurId/reductions
router.post('/:vendeurId/reductions', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const { code, type, type_remise, valeur, date_debut, date_fin, usages_max, limite_client, produit_id } = req.body;
        if (!code || !type || !type_remise || valeur === undefined || !date_debut)
            return res.status(400).json({ error: 'Champs obligatoires manquants' });

        const existing = await pool.query('SELECT id FROM reductions WHERE code = $1', [code]);
        if (existing.rows.length > 0) return res.status(400).json({ error: 'Ce code de réduction existe déjà' });

        // 🔥 Shopify désactivé - on insère uniquement en BD
        console.log(`📝 Création code promo "${code}" pour vendeur ${vendeurId} (Shopify désactivé)`);

        const result = await pool.query(
            `INSERT INTO reductions
             (vendeur_id, code, type, type_remise, valeur, date_debut, date_fin,
              usages_max, limite_client, produit_id, statut,
              shopify_price_rule_id, shopify_discount_code_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'actif', $11, $12)
             RETURNING *`,
            [vendeurId, code, type, type_remise, valeur, date_debut, date_fin || null,
             usages_max || null, limite_client || false, produit_id || '',
             null, null]  // ← shopify IDs à null
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Erreur POST /:vendeurId/reductions:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:vendeurId/reductions/:reductionId
router.put('/:vendeurId/reductions/:reductionId', authenticateToken, async (req, res) => {
    try {
        const vendeurId    = parseInt(req.params.vendeurId);
        const reductionId  = parseInt(req.params.reductionId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const { type, type_remise, valeur, date_debut, date_fin, usages_max, limite_client, produit_id, statut } = req.body;

        // 🔥 Shopify désactivé - on met à jour uniquement la BD
        console.log(`📝 Mise à jour code promo ID ${reductionId} pour vendeur ${vendeurId} (Shopify désactivé)`);

        const result = await pool.query(
            `UPDATE reductions
             SET type = $1, type_remise = $2, valeur = $3, date_debut = $4,
                 date_fin = $5, usages_max = $6, limite_client = $7,
                 produit_id = $8, statut = $9, updated_at = CURRENT_TIMESTAMP
             WHERE id = $10 AND vendeur_id = $11 RETURNING *`,
            [type, type_remise, valeur, date_debut, date_fin || null, usages_max || null,
             limite_client || false, produit_id || '', statut || 'actif', reductionId, vendeurId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Réduction non trouvée' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Erreur PUT /:vendeurId/reductions/:reductionId:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:vendeurId/reductions/:reductionId
router.delete('/:vendeurId/reductions/:reductionId', authenticateToken, async (req, res) => {
    try {
        const vendeurId   = parseInt(req.params.vendeurId);
        const reductionId = parseInt(req.params.reductionId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        // 🔥 Shopify désactivé - on supprime uniquement de la BD
        console.log(`🗑️ Suppression code promo ID ${reductionId} pour vendeur ${vendeurId} (Shopify désactivé)`);

        const result = await pool.query(
            'DELETE FROM reductions WHERE id = $1 AND vendeur_id = $2 RETURNING id',
            [reductionId, vendeurId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Réduction non trouvée' });
        res.json({ success: true, message: 'Réduction supprimée avec succès' });
    } catch (err) {
        console.error('❌ Erreur DELETE /:vendeurId/reductions/:reductionId:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;