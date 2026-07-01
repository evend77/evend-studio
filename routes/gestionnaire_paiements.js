// routes/vendeur_paiements.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET /api/vendeurs/:id/paiements
router.get('/:id/paiements', async (req, res) => {
    const vendeurId = parseInt(req.params.id);
    
    try {
        // 1. Commissions depuis la table commissions
        const commissions = await pool.query(`
            SELECT * FROM commissions 
            WHERE vendeur_id = $1 
            ORDER BY created_at DESC
        `, [vendeurId]);

        // 2. Transferts Stripe
        const stripeTransfers = await pool.query(`
            SELECT stripe_transfer_id as id, 'stripe' as plateforme, 
                   commande_id, montant, devise, statut, created_at,
                   destination_account as destination
            FROM stripe_transfers 
            WHERE vendeur_id = $1 
            ORDER BY created_at DESC
        `, [vendeurId]);

        // 3. Payouts Stripe
        const stripePayouts = await pool.query(`
            SELECT stripe_payout_id as id, 'stripe' as plateforme,
                   montant, devise, methode, date_arrivee, statut, created_at
            FROM stripe_payouts 
            WHERE vendeur_id = $1 
            ORDER BY created_at DESC
        `, [vendeurId]);

        // 4. PayPal (quand les tables existeront)
        let paypalTransfers = [];
        let paypalPayouts = [];
        
        try {
            const pt = await pool.query(`
                SELECT paypal_transfer_id as id, 'paypal' as plateforme,
                       commande_id, montant, devise, destination_email as destination,
                       statut, created_at
                FROM paypal_transfers 
                WHERE vendeur_id = $1 
                ORDER BY created_at DESC
            `, [vendeurId]);
            paypalTransfers = pt.rows;
        } catch(e) { console.log('Table paypal_transfers pas encore créée'); }
        
        try {
            const pp = await pool.query(`
                SELECT paypal_payout_id as id, 'paypal' as plateforme,
                       montant, devise, methode, date_arrivee, statut, created_at
                FROM paypal_payouts 
                WHERE vendeur_id = $1 
                ORDER BY created_at DESC
            `, [vendeurId]);
            paypalPayouts = pp.rows;
        } catch(e) { console.log('Table paypal_payouts pas encore créée'); }

        // Calcul des stats
        const totalVentes = commissions.rows.reduce((s, c) => s + (parseFloat(c.montant_vendeur) || 0), 0);
        const totalCommission = commissions.rows.reduce((s, c) => s + (parseFloat(c.montant_commission) || 0), 0);
        const totalPaye = stripeTransfers.rows.reduce((s, t) => s + (parseFloat(t.montant) || 0), 0);
        const totalDue = totalVentes - totalPaye;

        // Fusionner TOUS les paiements (Stripe + PayPal)
        const tousPaiements = [
            ...stripeTransfers.rows.map(t => ({ ...t, type: 'transfert' })),
            ...stripePayouts.rows.map(p => ({ ...p, type: 'payout' })),
            ...paypalTransfers.map(t => ({ ...t, type: 'transfert' })),
            ...paypalPayouts.map(p => ({ ...p, type: 'payout' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        res.json({
            stats: {
                total_ventes: totalVentes,
                total_commission: totalCommission,
                total_paye: totalPaye,
                total_due: totalDue > 0 ? totalDue : 0,
                nb_commissions: commissions.rows.length,
                nb_paiements: tousPaiements.length
            },
            commissions: commissions.rows,
            paiements: tousPaiements
        });

    } catch (err) {
        console.error('❌ GET /paiements:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;