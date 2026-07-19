// routes/webhooks_sponsors_stripe.js
// e-Vend Studio — Webhook Stripe pour les paiements du PORTEFEUILLE SPONSOR
// (recharges prépayées, utilisées pour financer les clics sur leurs pubs).
//
// ⚠️ À NE PAS CONFONDRE avec :
//   - webhooks_studio_stripe.js  → facturation Studio → gestionnaire (abonnement du site)
//   - webhooks_paiements_stripe.js → paiements clients → gestionnaire (réservations/abonnements, comptes Connect)
// Celui-ci gère l'argent des SPONSORS vers e-Vend, sur le compte Stripe principal
// (même compte que webhooks_studio_stripe.js — pas de Connect ici).

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET_SPONSORS;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('❌ Webhook sponsors — signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`\n🔔 Webhook Sponsors: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleRechargePortefeuille(event.data.object); break;
      default:
        console.log(`   ⏭️  Événement non géré : ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ Erreur traitement ${event.type}:`, err.message);
    // On répond 200 quand même pour éviter les retries Stripe sur une erreur interne
  }

  res.json({ received: true });
});

// ── checkout.session.completed — recharge du portefeuille confirmée ──
async function handleRechargePortefeuille(session) {
  if (session.metadata?.type !== 'recharge_portefeuille') {
    return; // pas notre affaire, ignorer
  }

  const sponsorId = session.metadata?.sponsor_id;
  if (!sponsorId) {
    console.log('   ⚠️  metadata.sponsor_id manquant — skip');
    return;
  }

  // Idempotence : si ce paiement a déjà été traité (retry Stripe), ne pas recréditer deux fois
  const dejaTraite = await pool.query(
    'SELECT id FROM sponsor_transactions_portefeuille WHERE stripe_payment_intent_id = $1',
    [session.payment_intent]
  );
  if (dejaTraite.rows.length > 0) {
    console.log('   ⏭️  Paiement déjà traité (idempotence) — skip');
    return;
  }

  const montant = parseFloat(session.metadata?.montant) || (session.amount_total || 0) / 100;
  const tps = parseFloat(session.metadata?.tps) || 0;
  const tvq = parseFloat(session.metadata?.tvq) || 0;
  if (montant <= 0) {
    console.log('   ⚠️  Montant invalide — skip');
    return;
  }

  await pool.query(
    'UPDATE sponsors SET solde_portefeuille = solde_portefeuille + $1, updated_at = NOW() WHERE id = $2',
    [montant, sponsorId]
  );

  await pool.query(
    `INSERT INTO sponsor_transactions_portefeuille (sponsor_id, type, montant, tps, tvq, description, stripe_payment_intent_id)
     VALUES ($1, 'recharge', $2, $3, $4, 'Recharge du portefeuille publicitaire', $5)`,
    [sponsorId, montant, tps, tvq, session.payment_intent]
  );

  console.log(`   ✅ Portefeuille rechargé de ${montant}$ CAD (+ ${(tps + tvq).toFixed(2)}$ de taxes) — sponsor ${sponsorId}`);
}

module.exports = router;