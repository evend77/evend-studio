// routes/vendeurs_commandes.js
// Routes pour la gestion des commandes par le vendeur
// Montées sous /api/vendeurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// POST /commande/:id/accepter
router.post('/commande/:id/accepter', authenticateToken, async (req, res) => {
    try {
        const commandeId = parseInt(req.params.id);
        const vendeurId  = req.user.id;

        const checkCommande = await pool.query(
            'SELECT id, statut_acceptation, historique_suivi FROM commandes WHERE id = $1 AND vendeur_id = $2',
            [commandeId, vendeurId]
        );
        if (checkCommande.rows.length === 0)
            return res.status(404).json({ error: 'Commande non trouvée ou non autorisée' });
        if (checkCommande.rows[0].statut_acceptation !== 'Pending')
            return res.status(400).json({ error: 'Cette commande a déjà été traitée' });

        let historiqueActuel = checkCommande.rows[0].historique_suivi || [];
        if (typeof historiqueActuel === 'string') {
            try { historiqueActuel = JSON.parse(historiqueActuel); } catch (e) { historiqueActuel = []; }
        }

        const nouvelHistorique = [...historiqueActuel, {
            date: new Date().toISOString(),
            statut: 'Commande acceptée',
            description: 'Votre commande a été acceptée par le vendeur',
            etape: 'acceptee'
        }];

        const result = await pool.query(`
            UPDATE commandes
            SET statut_acceptation = 'Accepted', statut_commande = 'Unfulfilled',
                etape_traitement = 'acceptee', date_acceptation = NOW(),
                updated_at = NOW(), historique_suivi = $1
            WHERE id = $2 AND vendeur_id = $3 AND statut_acceptation = 'Pending'
            RETURNING id, statut_acceptation, statut_commande, etape_traitement, date_acceptation, historique_suivi
        `, [JSON.stringify(nouvelHistorique), commandeId, vendeurId]);

        if (result.rows.length === 0)
            return res.status(400).json({ error: 'Erreur lors de l\'acceptation de la commande' });

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1, $2, $3, $4)`,
            ['COMMANDE_ACCEPTEE', req.user?.email || 'vendeur',
             JSON.stringify({ commande_id: commandeId, vendeur_id: vendeurId }), 'info']
        ).catch(e => console.error('Erreur log:', e));

        console.log(`✅ Commande ${commandeId} acceptée par vendeur ${vendeurId}`);
        res.json({ success: true, message: 'Commande acceptée avec succès', commande: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur POST /commande/:id/accepter:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /commande/:id/refuser
router.post('/commande/:id/refuser', authenticateToken, async (req, res) => {
    try {
        const commandeId = parseInt(req.params.id);
        const vendeurId  = req.user.id;

        const checkCommande = await pool.query(
            'SELECT id, statut_acceptation FROM commandes WHERE id = $1 AND vendeur_id = $2',
            [commandeId, vendeurId]
        );
        if (checkCommande.rows.length === 0)
            return res.status(404).json({ error: 'Commande non trouvée ou non autorisée' });
        if (checkCommande.rows[0].statut_acceptation !== 'Pending')
            return res.status(400).json({ error: 'Cette commande a déjà été traitée' });

        const result = await pool.query(`
            UPDATE commandes
            SET statut_acceptation = 'Rejected', statut_commande = 'Unfulfilled', updated_at = NOW()
            WHERE id = $1 AND vendeur_id = $2 AND statut_acceptation = 'Pending'
            RETURNING id, statut_acceptation, statut_commande
        `, [commandeId, vendeurId]);

        if (result.rows.length === 0)
            return res.status(400).json({ error: 'Erreur lors du refus de la commande' });

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1, $2, $3, $4)`,
            ['COMMANDE_REFUSEE', req.user?.email || 'vendeur',
             JSON.stringify({ commande_id: commandeId, vendeur_id: vendeurId }), 'warning']
        ).catch(e => console.error('Erreur log:', e));

        console.log(`❌ Commande ${commandeId} refusée par vendeur ${vendeurId}`);
        res.json({ success: true, message: 'Commande refusée avec succès', commande: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur POST /commande/:id/refuser:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /commande/:id/traiter
router.post('/commande/:id/traiter', authenticateToken, async (req, res) => {
    try {
        const commandeId = parseInt(req.params.id);
        const vendeurId  = req.user.id;
        const { numero_suivi, transporteur, url_suivi, etape_livraison } = req.body;

        const checkCommande = await pool.query(
            'SELECT id, statut_acceptation FROM commandes WHERE id = $1 AND vendeur_id = $2',
            [commandeId, vendeurId]
        );
        if (checkCommande.rows.length === 0)
            return res.status(404).json({ error: 'Commande non trouvée ou non autorisée' });
        if (checkCommande.rows[0].statut_acceptation !== 'Accepted')
            return res.status(400).json({ error: 'La commande doit être acceptée avant d\'être traitée' });

        const result = await pool.query(`
            UPDATE commandes
            SET numero_suivi = COALESCE($1, numero_suivi),
                transporteur = COALESCE($2, transporteur),
                url_suivi = COALESCE($3, url_suivi),
                etape_livraison = COALESCE($4, etape_livraison),
                statut_commande = 'Fulfilled', updated_at = NOW()
            WHERE id = $5 AND vendeur_id = $6
            RETURNING *
        `, [numero_suivi || null, transporteur || null, url_suivi || null, etape_livraison || null, commandeId, vendeurId]);

        if (result.rows.length === 0)
            return res.status(400).json({ error: 'Erreur lors du traitement de la commande' });

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1, $2, $3, $4)`,
            ['COMMANDE_TRAITEE', req.user?.email || 'vendeur',
             JSON.stringify({ commande_id: commandeId, vendeur_id: vendeurId, transporteur, numero_suivi }), 'info']
        ).catch(e => console.error('Erreur log:', e));

        console.log(`📦 Commande ${commandeId} traitée par vendeur ${vendeurId}`);
        res.json({ success: true, message: 'Commande traitée avec succès', commande: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur POST /commande/:id/traiter:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /commande/:id/annuler
router.post('/commande/:id/annuler', authenticateToken, async (req, res) => {
    try {
        const commandeId = parseInt(req.params.id);
        const vendeurId  = req.user.id;
        const { raison_annulation } = req.body;

        if (!raison_annulation || raison_annulation.trim() === '')
            return res.status(400).json({ error: 'La raison de l\'annulation est obligatoire' });

        const checkCommande = await pool.query(
            'SELECT id, statut_acceptation, statut_commande, statut_paiement FROM commandes WHERE id = $1 AND vendeur_id = $2',
            [commandeId, vendeurId]
        );
        if (checkCommande.rows.length === 0)
            return res.status(404).json({ error: 'Commande non trouvée ou non autorisée' });

        const commande = checkCommande.rows[0];
        if (commande.statut_commande === 'Cancelled' || commande.statut_paiement === 'voided')
            return res.status(400).json({ error: 'Cette commande est déjà annulée' });

        const result = await pool.query(`
            UPDATE commandes
            SET statut_acceptation = CASE WHEN statut_acceptation = 'Pending' THEN 'Rejected' ELSE statut_acceptation END,
                statut_commande = 'Cancelled', statut_paiement = 'voided',
                statut_annulation = 'cancelled_by_vendeur', raison_annulation = $1,
                annule_par = 'vendeur', etape_livraison = 'annulee',
                etape_traitement = 'annulee', updated_at = NOW()
            WHERE id = $2 AND vendeur_id = $3
            RETURNING id, statut_acceptation, statut_commande, statut_paiement, statut_annulation, raison_annulation, annule_par
        `, [raison_annulation.trim(), commandeId, vendeurId]);

        if (result.rows.length === 0)
            return res.status(400).json({ error: 'Erreur lors de l\'annulation de la commande' });

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1, $2, $3, $4)`,
            ['COMMANDE_ANNULEE_VENDEUR', req.user?.email || 'vendeur',
             JSON.stringify({ commande_id: commandeId, raison: raison_annulation }), 'warning']
        ).catch(e => console.error('Erreur log:', e));

        console.log(`❌ Commande ${commandeId} annulée par vendeur ${vendeurId}`);
        res.json({ success: true, message: 'Commande annulée avec succès', commande: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur POST /commande/:id/annuler:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /commande/:id — détail d'une commande
router.get('/commande/:id', authenticateToken, async (req, res) => {
    try {
        const commandeId = parseInt(req.params.id);
        const result = await pool.query(`
            SELECT c.*, v.nom AS vendeur_nom, v.nom_boutique AS vendeur_boutique
            FROM commandes c
            LEFT JOIN vendeurs v ON v.id = c.vendeur_id
            WHERE c.id = $1
        `, [commandeId]);

        if (!result.rows[0]) return res.status(404).json({ error: 'Commande introuvable' });

        const row = result.rows[0];
        let produits = [];
        try {
            const raw = Array.isArray(row.articles) ? row.articles : JSON.parse(row.articles || '[]');
            produits = await Promise.all(raw.map(async (p) => {
                let image = null;
                if (p.product_id) {
                    const img = await pool.query('SELECT image FROM produits WHERE shopify_id=$1 LIMIT 1', [String(p.product_id)]);
                    image = img.rows[0]?.image || null;
                }
                return { ...p, image };
            }));
        } catch (e) {
            console.error('Erreur parsing produits:', e);
        }
        res.json({ ...row, produits });
    } catch (err) {
        console.error('GET /commande/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /commande/:id — mettre à jour une commande
router.put('/commande/:id', authenticateToken, async (req, res) => {
    try {
        const commandeId = parseInt(req.params.id);
        const { numero_suivi, transporteur, url_suivi, etape_livraison, statut_commande } = req.body;
        const result = await pool.query(`
            UPDATE commandes SET
                numero_suivi = COALESCE($1, numero_suivi),
                transporteur = COALESCE($2, transporteur),
                url_suivi = COALESCE($3, url_suivi),
                etape_livraison = COALESCE($4, etape_livraison),
                statut_commande = COALESCE($5, statut_commande),
                updated_at = NOW()
            WHERE id = $6 RETURNING *
        `, [numero_suivi || null, transporteur || null, url_suivi || null,
            etape_livraison || null, statut_commande || null, commandeId]);

        if (!result.rows[0]) return res.status(404).json({ error: 'Commande introuvable' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('PUT /commande/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /vendeur-commandes/:id — liste des commandes d'un vendeur
router.get('/vendeur-commandes/:id', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        const isAdminUser = req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAdminUser && req.user.id !== vendeurId)
            return res.status(403).json({ error: 'Accès refusé' });

        const result = await pool.query(`
            SELECT id, store_order_id, date_commande, client_nom, client_email,
                   mode_paiement, statut_paiement, statut_commande, statut_acceptation,
                   montant, etape_livraison, transporteur, numero_suivi, url_suivi
            FROM commandes WHERE vendeur_id = $1
            ORDER BY date_commande DESC LIMIT 200
        `, [vendeurId]);
        res.json(result.rows);
    } catch (err) {
        console.error('GET /vendeur-commandes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;