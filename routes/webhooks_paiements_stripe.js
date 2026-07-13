// routes/webhooks_paiements_stripe.js
// e-Vend Studio — Webhook Stripe pour les paiements de RÉSERVATION et
// ABONNEMENT École/Cours (et futurs add-ons similaires), sur les comptes
// Connect STANDARD des gestionnaires.
//
// ⚠️ À NE PAS CONFONDRE avec routes/webhooks_studio_stripe.js, qui gère la
// facturation de e-Vend Studio AU gestionnaire (abonnement_studio, frais de
// template/add-on) — relation complètement différente, compte Stripe
// différent, déjà construite et fonctionnelle, jamais touchée ici.
//
// Celui-ci écoute les événements sur les comptes CONNECTÉS (Standard) des
// gestionnaires — les paiements que LEURS clients font pour des réservations
// ou abonnements de cours. Utilise configuration_stripe_admin (dev/prod +
// secret webhook Connect), pas process.env.STRIPE_WEBHOOK_SECRET_STUDIO.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { dechiffrer } = require('../utils/chiffrement');

async function chargerConfigAdmin() {
  const r = await pool.query('SELECT * FROM configuration_stripe_admin WHERE id = 1');
  return r.rows[0] || { sandbox: true };
}

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const configAdmin = await chargerConfigAdmin();
  const { Stripe } = require('stripe');
  const stripe = Stripe(dechiffrer(configAdmin.sandbox ? configAdmin.dev_secret_key : configAdmin.prod_secret_key));

  const sig = req.headers['stripe-signature'];
  const secret = dechiffrer(configAdmin.sandbox ? configAdmin.dev_connect_webhook_secret : configAdmin.prod_connect_webhook_secret);

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('❌ Webhook paiements — signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const stripeAccountId = event.account; // compte connecté du gestionnaire, fourni par Stripe sur les événements Connect
  console.log(`\n🔔 Webhook paiements: ${event.type} (compte ${stripeAccountId})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, stripe, stripeAccountId); break;
      case 'invoice.payment_succeeded':
        await handlePaiementReussi(event.data.object, stripe, stripeAccountId); break;
      case 'invoice.payment_failed':
        await handlePaiementEchoue(event.data.object); break;
      case 'customer.subscription.deleted':
        await handleAbonnementSupprime(event.data.object); break;
      default:
        console.log(`   ⏭️  Événement non géré : ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ Erreur traitement ${event.type}:`, err.message);
    // On répond 200 quand même pour éviter les retries Stripe sur une erreur interne
  }

  res.json({ received: true });
});

// ── checkout.session.completed — réservation (paiement unique) ou abonnement (1er paiement) ──
async function handleCheckoutCompleted(session, stripe, stripeAccountId) {
  const type = session.metadata?.type;

  if (type === 'reservation') {
    const reservationId = session.metadata?.reservation_id;
    if (!reservationId) return console.log('   ⚠️  metadata.reservation_id manquant — skip');

    const result = await pool.query(`SELECT * FROM reservations WHERE id = $1`, [reservationId]);
    if (!result.rows.length) return console.log(`   ⚠️  Réservation ${reservationId} introuvable`);
    const reservation = result.rows[0];
    if (reservation.statut_paiement === 'recu') return; // déjà traité (idempotence)

    await pool.query(
      `UPDATE reservations SET statut = 'confirmee', statut_paiement = 'recu', stripe_payment_intent_id = $1 WHERE id = $2`,
      [session.payment_intent, reservationId]
    );

    const { envoyerCourrielReservation } = require('./reservations');
    const siteResult = await pool.query(
      `SELECT s.config, g.email as gestionnaire_email FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id WHERE s.id = $1`,
      [reservation.site_id]
    );
    const siteData = siteResult.rows[0];
    const configSite = { ...(siteData?.config || {}), gestionnaireEmail: siteData?.gestionnaire_email };
    await envoyerCourrielReservation('confirmation', { ...reservation, statut_paiement: 'recu' }, configSite);

    console.log(`   ✅ Réservation ${reservationId} payée et confirmée`);
  }

  if (type === 'abonnement') {
    const abonnementId = session.metadata?.abonnement_id;
    if (!abonnementId) return console.log('   ⚠️  metadata.abonnement_id manquant — skip');

    const sub = await stripe.subscriptions.retrieve(session.subscription, { stripeAccount: stripeAccountId });
    const prochaineFacturation = new Date(sub.current_period_end * 1000);

    const result = await pool.query(
      `UPDATE abonnements_clients
       SET statut = 'actif', stripe_customer_id = $1, stripe_subscription_id = $2,
           date_debut = NOW(), prochaine_facturation = $3
       WHERE id = $4 RETURNING *`,
      [session.customer, session.subscription, prochaineFacturation, abonnementId]
    );
    if (!result.rows.length) return console.log(`   ⚠️  Abonnement ${abonnementId} introuvable`);
    const abonnement = result.rows[0];

    const formationResult = await pool.query(`SELECT titre FROM formations WHERE id = $1`, [abonnement.formation_id]);
    const siteResult = await pool.query(
      `SELECT s.config, g.email as gestionnaire_email FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id WHERE s.id = $1`,
      [abonnement.site_id]
    );
    const siteData = siteResult.rows[0];
    const configSite = { ...(siteData?.config || {}), gestionnaireEmail: siteData?.gestionnaire_email };
    const { envoyerCourrielAbonnement } = require('./abonnements');
    await envoyerCourrielAbonnement('confirmation', abonnement, configSite, formationResult.rows[0]);

    console.log(`   ✅ Abonnement ${abonnementId} activé`);
  }
}

// ── invoice.payment_succeeded — prélèvement récurrent réussi (renouvellement d'abonnement) ──
async function handlePaiementReussi(invoice, stripe, stripeAccountId) {
  if (invoice.billing_reason === 'subscription_create') return; // 1er paiement déjà géré par checkout.session.completed
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const result = await pool.query(`SELECT * FROM abonnements_clients WHERE stripe_subscription_id = $1`, [subscriptionId]);
  if (!result.rows.length) return console.log(`   ⚠️  Abonnement introuvable pour subscription ${subscriptionId}`);
  const abonnement = result.rows[0];

  const sub = await stripe.subscriptions.retrieve(subscriptionId, { stripeAccount: stripeAccountId });
  const prochaineFacturation = new Date(sub.current_period_end * 1000);

  await pool.query(`UPDATE abonnements_clients SET statut = 'actif', prochaine_facturation = $1 WHERE id = $2`, [prochaineFacturation, abonnement.id]);

  await pool.query(
    `INSERT INTO formations_paiements (abonnement_id, montant, devise, stripe_invoice_id, statut)
     VALUES ($1,$2,$3,$4,'reussi')`,
    [abonnement.id, (invoice.amount_paid || 0) / 100, invoice.currency || 'cad', invoice.id]
  );

  const formationResult = await pool.query(`SELECT titre FROM formations WHERE id = $1`, [abonnement.formation_id]);
  const siteResult = await pool.query(
    `SELECT s.config, g.email as gestionnaire_email FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id WHERE s.id = $1`,
    [abonnement.site_id]
  );
  const siteData = siteResult.rows[0];
  const configSite = { ...(siteData?.config || {}), gestionnaireEmail: siteData?.gestionnaire_email };
  const { envoyerCourrielAbonnement } = require('./abonnements');
  await envoyerCourrielAbonnement('recu_paiement', abonnement, configSite, formationResult.rows[0]);

  console.log(`   ✅ Prélèvement réussi — abonnement ${abonnement.id}`);
}

// ── invoice.payment_failed — carte refusée sur un renouvellement ──
async function handlePaiementEchoue(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const result = await pool.query(`SELECT * FROM abonnements_clients WHERE stripe_subscription_id = $1`, [subscriptionId]);
  if (!result.rows.length) return;
  const abonnement = result.rows[0];

  await pool.query(`UPDATE abonnements_clients SET statut = 'impaye' WHERE id = $1`, [abonnement.id]);
  await pool.query(
    `INSERT INTO formations_paiements (abonnement_id, montant, devise, stripe_invoice_id, statut)
     VALUES ($1,$2,$3,$4,'echoue')`,
    [abonnement.id, (invoice.amount_due || 0) / 100, invoice.currency || 'cad', invoice.id]
  );

  console.log(`   ❌ Prélèvement échoué — abonnement ${abonnement.id}`);
}

// ── customer.subscription.deleted — abonnement terminé côté Stripe (retries épuisés, etc.) ──
async function handleAbonnementSupprime(subscription) {
  const result = await pool.query(`SELECT id FROM abonnements_clients WHERE stripe_subscription_id = $1`, [subscription.id]);
  if (!result.rows.length) return;
  await pool.query(`UPDATE abonnements_clients SET statut = 'annule', annule_le = NOW() WHERE id = $1`, [result.rows[0].id]);
  console.log(`   🚫 Abonnement ${result.rows[0].id} terminé côté Stripe`);
}

module.exports = router;