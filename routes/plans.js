// routes/plans.js — Plans
// Préfixe monté : /api/plans
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET tous les plans (admin dashboard)
router.get('/', async (req, res) => {
    try {
        res.json((await pool.query('SELECT * FROM plans ORDER BY position')).rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET plans visibles aux acheteurs (public)
router.get('/acheteur/public', async (req, res) => {
    try {
        const colCheck = await pool.query(
            `SELECT column_name FROM information_schema.columns 
             WHERE table_name='plans' AND column_name='visible_acheteur'`
        );
        let query;
        if (colCheck.rows.length > 0) {
            query = `SELECT * FROM plans WHERE statut='actif' AND visible_acheteur=true ORDER BY position`;
        } else {
            query = `SELECT * FROM plans WHERE statut='actif' ORDER BY position`;
        }
        res.json((await pool.query(query)).rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET plan actif d'un vendeur + ses limites + son utilisation courante
router.get('/vendeur/:vendeurId/plan-actif', async (req, res) => {
    try {
        const { vendeurId } = req.params;

        // 1. Trouver l'abonnement actif du vendeur
        const abonnementRes = await pool.query(
            `SELECT * FROM abonnements 
             WHERE seller_id = $1 
               AND statut = 'actif' 
             ORDER BY date_debut DESC 
             LIMIT 1`,
            [vendeurId]
        );

        // ── Auto-renouvellement : si statut='actif' mais date_fin dépassée, on prolonge ──
        if (abonnementRes.rows.length > 0) {
            const abo = abonnementRes.rows[0];
            if (abo.statut === 'actif' && abo.date_fin && new Date(abo.date_fin) < new Date()) {
                // Calculer la nouvelle date_fin selon le type d'abonnement
                const planPourRenou = await pool.query(
                    `SELECT type_abonnement FROM plans WHERE LOWER(TRIM(nom)) = LOWER(TRIM($1)) LIMIT 1`,
                    [abo.plan]
                );
                const typeAbo = planPourRenou.rows[0]?.type_abonnement || 'mensuel';
                let nouvelleDateFin = new Date();
                if (typeAbo === 'annuel') {
                    nouvelleDateFin.setFullYear(nouvelleDateFin.getFullYear() + 1);
                } else {
                    nouvelleDateFin.setMonth(nouvelleDateFin.getMonth() + 1);
                }
                await pool.query(
                    `UPDATE abonnements SET date_fin = $1 WHERE id = $2`,
                    [nouvelleDateFin.toISOString().split('T')[0], abo.id]
                );
                console.log(`🔄 Abonnement #${abo.id} (${abo.plan}) auto-renouvelé jusqu'au ${nouvelleDateFin.toISOString().split('T')[0]}`);
                abonnementRes.rows[0].date_fin = nouvelleDateFin.toISOString().split('T')[0];
            }
        }

        if (abonnementRes.rows.length === 0) {
            return res.json({
                plan: null,
                limites: {
                    limiter_produits: true,
                    limite_produits: 0,
                    commission_active: false,
                    commission: 0,
                    fonctionnalites: {}
                },
                utilisation: {
                    nb_produits_actifs: 0,
                    peut_creer_produit: false,
                    produits_restants: 0
                },
                abonnement: null
            });
        }

        const abonnement = abonnementRes.rows[0];

        // 2. Trouver le plan correspondant dans la table plans (match par nom, insensible à la casse)
        const planRes = await pool.query(
            `SELECT * FROM plans 
             WHERE LOWER(TRIM(nom)) = LOWER(TRIM($1)) 
               AND (statut = 'actif' OR statut IS NULL)
             LIMIT 1`,
            [abonnement.plan]
        );

        const plan = planRes.rows[0] || null;

        // 3. Compter les produits actifs du vendeur
        const produitsRes = await pool.query(
            `SELECT COUNT(*) as nb 
             FROM produits 
             WHERE vendeur_id = $1 
               AND statut NOT IN ('supprime', 'archive')`,
            [vendeurId]
        );
        const nbProduitsActifs = parseInt(produitsRes.rows[0].nb) || 0;

        // 4. Calculer si le vendeur peut créer un produit
        let peutCreerProduit = true;
        let produitsRestants = null;

        if (plan && plan.limiter_produits && plan.limite_produits !== null) {
            produitsRestants = Math.max(0, plan.limite_produits - nbProduitsActifs);
            peutCreerProduit = nbProduitsActifs < plan.limite_produits;
        } else if (!plan) {
            peutCreerProduit = false;
            produitsRestants = 0;
        }

        res.json({
            plan: plan || null,
            limites: plan ? {
                limiter_produits: plan.limiter_produits,
                limite_produits: plan.limite_produits,
                commission_active: plan.commission_active,
                commission: plan.commission,
                fonctionnalites: plan.fonctionnalites || {}
            } : {
                limiter_produits: true,
                limite_produits: 0,
                commission_active: false,
                commission: 0,
                fonctionnalites: {}
            },
            utilisation: {
                nb_produits_actifs: nbProduitsActifs,
                peut_creer_produit: peutCreerProduit,
                produits_restants: produitsRestants
            },
            abonnement: {
                id: abonnement.id,
                plan: abonnement.plan,
                statut: abonnement.statut,
                date_fin: abonnement.date_fin
            }
        });

    } catch (err) {
        console.error('❌ Erreur plan-actif vendeur:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET un plan par id
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM plans WHERE id=$1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plan non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST créer un plan
router.post('/', async (req, res) => {
    try {
        const {
            nom, emoji, type_abonnement, prix_ht, tps, tvq, tvh,
            limiter_produits, limite_produits, jours_essai,
            visible_vendeur, position, recommande,
            commission_active, commission, info_supplementaire,
            frais_activation_actif, frais_activation_ht,
            frais_activation_tps, frais_activation_tvq, frais_activation_tvh,
            charger_frais_sur, assigner_vendeurs, emails_vendeurs,
            couleur_banniere, couleur_carte, description, fonctionnalites
        } = req.body;
        const result = await pool.query(
            `INSERT INTO plans (nom, emoji, type_abonnement, prix_ht, tps, tvq, tvh, limiter_produits, limite_produits, jours_essai, visible_vendeur, position, recommande, commission_active, commission, info_supplementaire, frais_activation_actif, frais_activation_ht, frais_activation_tps, frais_activation_tvq, frais_activation_tvh, charger_frais_sur, assigner_vendeurs, emails_vendeurs, couleur_banniere, couleur_carte, description, fonctionnalites, statut)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING *`,
            [nom, emoji, type_abonnement, prix_ht, tps, tvq, tvh, limiter_produits, limite_produits, jours_essai, visible_vendeur, position, recommande, commission_active, commission, info_supplementaire, frais_activation_actif, frais_activation_ht, frais_activation_tps, frais_activation_tvq, frais_activation_tvh, charger_frais_sur, assigner_vendeurs, emails_vendeurs, couleur_banniere, couleur_carte, description, fonctionnalites, 'actif']
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT modifier un plan
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nom, emoji, type_abonnement, prix_ht, tps, tvq, tvh,
            limiter_produits, limite_produits, jours_essai,
            visible_vendeur, position, recommande,
            commission_active, commission, info_supplementaire,
            frais_activation_actif, frais_activation_ht,
            frais_activation_tps, frais_activation_tvq, frais_activation_tvh,
            charger_frais_sur, assigner_vendeurs, emails_vendeurs,
            couleur_banniere, couleur_carte, description, fonctionnalites, statut
        } = req.body;
        const result = await pool.query(
            `UPDATE plans SET nom=$1, emoji=$2, type_abonnement=$3, prix_ht=$4, tps=$5, tvq=$6, tvh=$7, limiter_produits=$8, limite_produits=$9, jours_essai=$10, visible_vendeur=$11, position=$12, recommande=$13, commission_active=$14, commission=$15, info_supplementaire=$16, frais_activation_actif=$17, frais_activation_ht=$18, frais_activation_tps=$19, frais_activation_tvq=$20, frais_activation_tvh=$21, charger_frais_sur=$22, assigner_vendeurs=$23, emails_vendeurs=$24, couleur_banniere=$25, couleur_carte=$26, description=$27, fonctionnalites=$28, statut=$29 WHERE id=$30 RETURNING *`,
            [nom, emoji, type_abonnement, prix_ht, tps, tvq, tvh, limiter_produits, limite_produits, jours_essai, visible_vendeur, position, recommande, commission_active, commission, info_supplementaire, frais_activation_actif, frais_activation_ht, frais_activation_tps, frais_activation_tvq, frais_activation_tvh, charger_frais_sur, assigner_vendeurs, emails_vendeurs, couleur_banniere, couleur_carte, description, fonctionnalites, statut, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plan non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE supprimer un plan
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM plans WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Plan non trouvé' });
        res.json({ success: true, deleted: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;