// routes/webhooks_studio_stripe.js
// ============================================================
// Webhooks Stripe — Abonnements e-Vend Studio
// ============================================================
// Événements gérés :
//   - checkout.session.completed     → activer l'abonnement après paiement
//   - invoice.payment_succeeded      → enregistrer le paiement reçu
//   - invoice.payment_failed         → marquer comme impayé
//   - customer.subscription.deleted  → abonnement terminé (annulé ou impayé)
//   - customer.subscription.updated  → changement de statut Stripe
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const TAUX_TPS = 0.05;
const TAUX_TVQ = 0.09975;

function calculerTaxes(montantHT) {
  const tps = Math.round(montantHT * TAUX_TPS * 100) / 100;
  const tvq = Math.round(montantHT * TAUX_TVQ * 100) / 100;
  return { tps, tvq, total: Math.round((montantHT + tps + tvq) * 100) / 100 };
}

// ─────────────────────────────────────────────────────────────
// POST /api/webhooks-studio
// Point d'entrée unique — Stripe envoie ici tous les événements
// ─────────────────────────────────────────────────────────────
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET_STUDIO;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('❌ Webhook signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`\n🔔 Webhook Studio: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object); break;
      case 'invoice.payment_succeeded':
        await handlePaiementReussi(event.data.object); break;
      case 'invoice.payment_failed':
        await handlePaiementEchoue(event.data.object); break;
      case 'customer.subscription.deleted':
        await handleAbonnementSupprime(event.data.object); break;
      case 'customer.subscription.updated':
        await handleAbonnementMisAJour(event.data.object); break;
      default:
        console.log(`   ⏭️  Événement non géré : ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ Erreur traitement ${event.type}:`, err.message);
    // On répond 200 quand même pour éviter les retries Stripe sur une erreur
    // de notre côté (ex: doublon de webhook traité deux fois)
  }

  res.json({ received: true });
});

// ─────────────────────────────────────────────────────────────
// HANDLER : checkout.session.completed
// Le gestionnaire a configuré sa carte — activer l'abonnement
// ─────────────────────────────────────────────────────────────
async function handleCheckoutCompleted(session) {
  const gestionnaireId  = session.metadata?.gestionnaire_id;
  const abonnementId    = session.metadata?.abonnement_id;
  const subscriptionId  = session.subscription;

  if (!gestionnaireId || !abonnementId || !subscriptionId) {
    console.log('   ⚠️  Metadata manquants dans checkout.session.completed — skip');
    return;
  }

  // Récupérer les détails de la subscription Stripe pour les dates
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const periodeDebut = new Date(sub.current_period_start * 1000);
  const periodeFin   = new Date(sub.current_period_end   * 1000);

  await pool.query(
    `UPDATE abonnements_studio
     SET statut                 = 'actif',
         stripe_subscription_id = $1,
         periode_debut           = $2,
         periode_fin             = $3,
         updated_at              = NOW()
     WHERE id = $4`,
    [subscriptionId, periodeDebut, periodeFin, abonnementId]
  );

  await pool.query(
    `UPDATE gestionnaires SET statut_abo = 'actif' WHERE id = $1`,
    [gestionnaireId]
  );

  console.log(`   ✅ Abonnement ${abonnementId} activé (gestionnaire ${gestionnaireId})`);
}

// ─────────────────────────────────────────────────────────────
// HANDLER : invoice.payment_succeeded
// Renouvellement mensuel réussi — mettre à jour les dates et
// enregistrer le paiement dans l'historique
// ─────────────────────────────────────────────────────────────
async function handlePaiementReussi(invoice) {
  if (invoice.billing_reason === 'subscription_create') {
    // Premier paiement déjà géré par checkout.session.completed
    return;
  }

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const aboRes = await pool.query(
    `SELECT * FROM abonnements_studio WHERE stripe_subscription_id = $1 LIMIT 1`,
    [subscriptionId]
  );
  if (!aboRes.rows.length) {
    console.log(`   ⚠️  Abonnement introuvable pour subscription ${subscriptionId}`);
    return;
  }
  const abo = aboRes.rows[0];

  // Récupérer les nouvelles dates de période depuis Stripe
  const sub          = await stripe.subscriptions.retrieve(subscriptionId);
  const periodeDebut = new Date(sub.current_period_start * 1000);
  const periodeFin   = new Date(sub.current_period_end   * 1000);

  await pool.query(
    `UPDATE abonnements_studio
     SET statut = 'actif', periode_debut = $1, periode_fin = $2, updated_at = NOW()
     WHERE id = $3`,
    [periodeDebut, periodeFin, abo.id]
  );

  // Enregistrer le paiement dans l'historique
  const montantTotal = (invoice.amount_paid || 0) / 100;
  const montantHT    = Math.round(montantTotal / (1 + 0.05 + 0.09975) * 100) / 100;
  const taxes        = calculerTaxes(montantHT);

  await pool.query(
    `INSERT INTO abonnements_paiements
       (abonnement_id, gestionnaire_id, stripe_invoice_id, stripe_payment_intent,
        montant_ht, tps, tvq, montant_total, statut, periode_debut, periode_fin)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'paye',$9,$10)
     ON CONFLICT (stripe_invoice_id) DO NOTHING`,
    [abo.id, abo.gestionnaire_id, invoice.id, invoice.payment_intent,
     montantHT, taxes.tps, taxes.tvq, montantTotal, periodeDebut, periodeFin]
  );

  await pool.query(
    `UPDATE gestionnaires SET statut_abo = 'actif' WHERE id = $1`,
    [abo.gestionnaire_id]
  );

  console.log(`   ✅ Paiement enregistré — gestionnaire ${abo.gestionnaire_id} | ${montantTotal}$ CAD`);
}

// ─────────────────────────────────────────────────────────────
// HANDLER : invoice.payment_failed
// Paiement échoué — marquer comme impayé
// ─────────────────────────────────────────────────────────────
async function handlePaiementEchoue(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const aboRes = await pool.query(
    `SELECT * FROM abonnements_studio WHERE stripe_subscription_id = $1 LIMIT 1`,
    [subscriptionId]
  );
  if (!aboRes.rows.length) return;
  const abo = aboRes.rows[0];

  await pool.query(
    `UPDATE abonnements_studio SET statut = 'impaye', updated_at = NOW() WHERE id = $1`,
    [abo.id]
  );
  await pool.query(
    `UPDATE gestionnaires SET statut_abo = 'impaye' WHERE id = $1`,
    [abo.gestionnaire_id]
  );

  // Enregistrer l'échec dans l'historique
  await pool.query(
    `INSERT INTO abonnements_paiements
       (abonnement_id, gestionnaire_id, stripe_invoice_id, montant_total, statut)
     VALUES ($1,$2,$3,$4,'echoue')
     ON CONFLICT (stripe_invoice_id) DO NOTHING`,
    [abo.id, abo.gestionnaire_id, invoice.id, (invoice.amount_due || 0) / 100]
  );

  console.log(`   ❌ Paiement échoué — gestionnaire ${abo.gestionnaire_id}`);
}

// ─────────────────────────────────────────────────────────────
// HANDLER : customer.subscription.deleted
// Abonnement définitivement terminé (annulé + période expirée)
// ─────────────────────────────────────────────────────────────
async function handleAbonnementSupprime(subscription) {
  const aboRes = await pool.query(
    `SELECT * FROM abonnements_studio WHERE stripe_subscription_id = $1 LIMIT 1`,
    [subscription.id]
  );
  if (!aboRes.rows.length) return;
  const abo = aboRes.rows[0];

  await pool.query(
    `UPDATE abonnements_studio
     SET statut = 'expire', updated_at = NOW()
     WHERE id = $1`,
    [abo.id]
  );
  await pool.query(
    `UPDATE gestionnaires SET statut_abo = 'expire' WHERE id = $1`,
    [abo.gestionnaire_id]
  );

  console.log(`   🚫 Abonnement terminé — gestionnaire ${abo.gestionnaire_id}`);
}

// ─────────────────────────────────────────────────────────────
// HANDLER : customer.subscription.updated
// Mise à jour Stripe (ex: cancel_at_period_end activé)
// ─────────────────────────────────────────────────────────────
async function handleAbonnementMisAJour(subscription) {
  const aboRes = await pool.query(
    `SELECT * FROM abonnements_studio WHERE stripe_subscription_id = $1 LIMIT 1`,
    [subscription.id]
  );
  if (!aboRes.rows.length) return;
  const abo = aboRes.rows[0];

  const periodeDebut = new Date(subscription.current_period_start * 1000);
  const periodeFin   = new Date(subscription.current_period_end   * 1000);

  // Si annulé en attente de fin, le statut reste 'annule' dans notre BD
  // (déjà mis à jour par la route /annuler) — on met juste les dates à jour
  await pool.query(
    `UPDATE abonnements_studio
     SET periode_debut = $1, periode_fin = $2, updated_at = NOW()
     WHERE id = $3`,
    [periodeDebut, periodeFin, abo.id]
  );

  console.log(`   🔄 Abonnement mis à jour — gestionnaire ${abo.gestionnaire_id}`);
}

module.exports = router;