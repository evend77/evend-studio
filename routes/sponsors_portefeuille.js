// routes/sponsors_portefeuille.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://e-vendstudio.ca';

// Montants suggérés — le sponsor peut aussi entrer un montant personnalisé
const MONTANTS_SUGGERES = [20, 50, 100, 250];
const MONTANT_MIN = 5;

// GET — Solde actuel + historique des transactions (paginé, plus récent en premier)
router.get('/solde', authenticateToken, async (req, res) => {
  try {
    const sponsor_id = req.user.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 30;
    const offset = (page - 1) * limit;

    const soldeResult = await pool.query('SELECT solde_portefeuille FROM sponsors WHERE id = $1', [sponsor_id]);
    if (soldeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    const transactionsResult = await pool.query(
      `SELECT t.id, t.type, t.montant, t.description, t.pub_id, sp.titre AS pub_titre, t.created_at
       FROM sponsor_transactions_portefeuille t
       LEFT JOIN sponsor_pubs sp ON sp.id = t.pub_id
       WHERE t.sponsor_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [sponsor_id, limit, offset]
    );

    const totalResult = await pool.query('SELECT COUNT(*) as total FROM sponsor_transactions_portefeuille WHERE sponsor_id = $1', [sponsor_id]);

    res.json({
      solde: parseFloat(soldeResult.rows[0].solde_portefeuille),
      transactions: transactionsResult.rows,
      total: parseInt(totalResult.rows[0].total),
      page,
      totalPages: Math.max(Math.ceil(parseInt(totalResult.rows[0].total) / limit), 1),
      montants_suggeres: MONTANTS_SUGGERES,
    });
  } catch (error) {
    console.error('❌ Erreur récupération solde portefeuille:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du solde' });
  }
});

// POST — Créer une session Stripe Checkout pour recharger le portefeuille
router.post('/recharger', authenticateToken, async (req, res) => {
  try {
    const sponsor_id = req.user.id;
    const montant = parseFloat(req.body.montant);

    if (isNaN(montant) || montant < MONTANT_MIN) {
      return res.status(400).json({ error: `Le montant minimum de recharge est de ${MONTANT_MIN}$` });
    }

    const sponsorResult = await pool.query('SELECT email, nom FROM sponsors WHERE id = $1', [sponsor_id]);
    if (sponsorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }
    const sponsor = sponsorResult.rows[0];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: sponsor.email,
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: 'Recharge du portefeuille publicitaire e-Vend Studio',
            description: `Ajout de ${montant.toFixed(2)}$ au solde disponible pour vos publicités`,
          },
          unit_amount: Math.round(montant * 100),
        },
        quantity: 1,
      }],
      metadata: {
        type: 'recharge_portefeuille',
        sponsor_id: String(sponsor_id),
        montant: montant.toFixed(2),
      },
      success_url: `${FRONTEND_URL}/sponsor-dashboard?onglet=abonnement&recharge=succes`,
      cancel_url: `${FRONTEND_URL}/sponsor-dashboard?onglet=abonnement&recharge=annule`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Erreur création session recharge:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
});

module.exports = router;