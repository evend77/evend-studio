// routes/abonnements.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET /api/abonnements/historique — historique paiements du vendeur connecté
router.get('/historique', authenticateToken, async (req, res) => {
    try {
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables WHERE table_name = 'paiements'
            ) AS exists
        `);
        if (!tableCheck.rows[0].exists) return res.json([]);
        const result = await pool.query(`
            SELECT id, date_debut, date_fin, montant_ht, frais_installation,
                   methode_paiement AS methode, statut
            FROM paiements WHERE vendeur_id = $1
            ORDER BY date_debut DESC LIMIT 50
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /historique:', err);
        res.json([]);
    }
});

// GET /api/abonnements — liste tous les abonnements [ADMIN]
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                v.id, v.seller_id AS "sellerId",
                COALESCE(v.nom_boutique, v.nom) AS "nomBoutique",
                v.email, v.plan, v.statut,
                CASE
                    WHEN v.plan ILIKE '%basic%'     THEN 'free'
                    WHEN v.plan ILIKE '%bronze%'    THEN 'silver'
                    WHEN v.plan ILIKE '%argent%'    THEN 'silver'
                    WHEN v.plan ILIKE '%or%'        THEN 'gold'
                    WHEN v.plan ILIKE '%extreme%'   THEN 'custom'
                    WHEN v.plan ILIKE '%fondateur%' THEN 'custom'
                    WHEN v.plan ILIKE '%gratuit%'   THEN 'free'
                    ELSE 'free'
                END AS "planType",
                COALESCE(a.statut, 'actif') AS "statut_paiement",
                COALESCE(a.date_debut::text, v.date_inscription::text) AS "date_debut",
                COALESCE(a.date_fin::text, (v.date_inscription::date + INTERVAL '30 days')::text) AS "date_fin",
                COALESCE(p.prix_ht, 0) AS "prixMensuel",
                COALESCE(p.commission, 0) AS commission,
                COALESCE(p.tps, 0) AS tps,
                COALESCE(p.tvq, 0) AS tvq,
                COALESCE(p.tvh, 0) AS tvh,
                v.province
            FROM vendeurs v
            LEFT JOIN abonnements a ON a.seller_id = v.id AND a.statut = 'actif'
            LEFT JOIN plans p ON LOWER(TRIM(p.nom)) = LOWER(TRIM(v.plan))
            ORDER BY v.date_inscription DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /api/abonnements:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/abonnements/:sellerId — abonnement d'un vendeur spécifique
// Supporte le seller_id textuel (VEN-2026-001) ET l'id numérique (1)
router.get('/:sellerId', async (req, res) => {
    try {
        const param = req.params.sellerId;
        const isNumeric = /^\d+$/.test(param);

        const whereClause = isNumeric ? 'v.id = $1' : 'v.seller_id = $1';

        const result = await pool.query(`
            SELECT
                v.id, v.seller_id AS "sellerId",
                COALESCE(v.nom_boutique, v.nom) AS "nomBoutique",
                v.email, v.plan, v.statut,
                a.statut AS "statut_abonnement",
                'Actif' AS "statut_paiement",
                COALESCE(a.date_debut::text, v.date_inscription::text) AS "date_debut",
                COALESCE(a.date_fin::text, (v.date_inscription::date + INTERVAL '30 days')::text) AS "date_fin",
                p.prix_ht AS "prixMensuel", p.commission, p.commission_active,
                p.limiter_produits, p.limite_produits,
                p.frais_activation_actif, p.frais_activation_ht,
                p.fonctionnalites, p.tps, p.tvq, p.tvh,
                v.province
            FROM vendeurs v
            LEFT JOIN abonnements a ON a.seller_id = v.id AND a.statut = 'actif'
            LEFT JOIN plans p ON LOWER(TRIM(p.nom)) = LOWER(TRIM(v.plan))
            WHERE ${whereClause}
            ORDER BY a.date_debut DESC
            LIMIT 1
        `.replace('${whereClause}', whereClause), [param]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Abonnement non trouvé' });
        const row = result.rows[0];
        console.log('GET /:sellerId — plan:', row.plan, '| fonctionnalites:', !!row.fonctionnalites, '| prix_ht:', row.prixMensuel);
        res.json(row);
    } catch (err) {
        console.error('Erreur GET /:sellerId:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;