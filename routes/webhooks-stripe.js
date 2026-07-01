// routes/webhooks-stripe.js
// ============================================================
// Webhooks Stripe Connect — avec calcul et transfert automatique
// des commissions e-Vend au moment du paiement
// ✅ CORRÉGÉ: Utilisation des metadata pour récupérer commande_id et vendeur_id
// ✅ CORRÉGÉ: event.account n'existe pas pour payment_intent.succeeded
// ============================================================
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Importer les helpers commissions
const { calculerCommission, effectuerTransfer } = require('./commissions');

// ─────────────────────────────────────────────────────────────────────────────
// Fonction email SES (identique à avant)
// ─────────────────────────────────────────────────────────────────────────────
async function sendEmail(destinataire, sujet, corpsHtml) {
  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID || process.env.REACT_APP_AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
  const awsRegion    = process.env.AWS_REGION || process.env.REACT_APP_AWS_REGION || 'us-east-2';
  const fromEmail    = process.env.FROM_EMAIL || 'evend.ca@outlook.com';

  const sesClient = new SESClient({
    region:      awsRegion,
    credentials: { accessKeyId: awsAccessKey, secretAccessKey: awsSecretKey },
  });

  return await sesClient.send(new SendEmailCommand({
    Destination: { ToAddresses: [destinataire] },
    Message: {
      Subject: { Data: sujet,     Charset: 'UTF-8' },
      Body:    { Html: { Data: corpsHtml, Charset: 'UTF-8' } },
    },
    Source: fromEmail,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers lisibles (identiques à avant)
// ─────────────────────────────────────────────────────────────────────────────
function typeCompteLabel(type) {
  return ({ express: 'Express', standard: 'Standard', custom: 'Custom' })[type] || type || 'Inconnu';
}

function delaiPayoutLabel(schedule) {
  if (!schedule) return 'Non défini';
  if (schedule.interval === 'manual')  return 'Manuel';
  if (schedule.interval === 'daily')   return 'Quotidien';
  if (schedule.interval === 'weekly')  return `Hebdomadaire (${schedule.weekly_anchor || ''})`;
  if (schedule.interval === 'monthly') return `Mensuel (jour ${schedule.monthly_anchor || ''})`;
  return schedule.interval || 'Non défini';
}

function statutVerificationLabel(compte) {
  const req = compte.requirements;
  if (!req) return 'Inconnu';
  if (req.disabled_reason)             return `❌ Désactivé: ${req.disabled_reason}`;
  if (req.currently_due?.length > 0)   return '⚠️ Documents manquants';
  if (req.eventually_due?.length > 0)  return '🟡 Documents à fournir éventuellement';
  return '✅ Vérifié';
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Traitement commun d'un event Stripe après validation signature
// ─────────────────────────────────────────────────────────────────────────────
async function traiterEvent(event, res) {
  const estProduction = process.env.NODE_ENV === 'production';
  if (estProduction && !event.livemode) {
    console.log(`⚠️  Event test ignoré en production: ${event.type} (${event.id})`);
    return res.status(200).json({ received: true, ignored: 'test event in production' });
  }

  try {
    switch (event.type) {

      // ── EVENTS COMPTES CONNECTÉS (webhook /stripe/vendeurs) ────────────────
      case 'account.updated':
        await handleAccountUpdated(event);
        break;
      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event);
        break;
      case 'transfer.created':
        await handleTransferCreated(event);
        break;
      case 'payout.paid':
        await handlePayoutPaid(event);
        break;
      case 'payout.failed':
        await handlePayoutFailed(event);
        break;
      case 'charge.dispute.created':
        await handleDisputeCreated(event);
        break;
      case 'charge.dispute.closed':
        await handleDisputeClosed(event);
        break;
      // ✅ Remboursement (API 2025-06-30.basil) — charge.refunded désactivé (double reversal)
      case 'refund.created':
        await handleRefundCreated(event);
        break;
      case 'charge.updated':
        await handleChargeUpdated(event);
        break;

      // ── EVENTS COMPTE PLATFORM (webhook /stripe/paiements) ────────────────
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;

      default:
        console.log(`ℹ️  Event ignoré: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error(`❌ Erreur traitement ${event.type}:`, error.message);
    console.error('Stack:', error.stack);
    try {
      await pool.query(
        `INSERT INTO audit_logs (action, utilisateur, details, niveau, date)
         VALUES ($1, $2, $3::jsonb, $4, NOW())`,
        ['STRIPE_WEBHOOK_ERROR', 'stripe',
         JSON.stringify({ event_type: event.type, event_id: event.id, error: error.message }),
         'error']
      );
    } catch (_) {}
    res.status(200).json({ received: true, warning: 'Erreur de traitement interne' });
  }

  console.log('💳 ' + '='.repeat(50) + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 1 — Webhook "e-Vend versement aux vendeurs" (Comptes connectés)
// URL Stripe : https://evend-multivendeur-api.onrender.com/api/webhooks/stripe/vendeurs
// Variable   : STRIPE_WEBHOOK_SECRET
// Events     : account.updated, account.application.deauthorized, transfer.created,
//              payout.paid, payout.failed, charge.dispute.created, charge.dispute.closed,
//              refund.created, charge.updated
// ⚠️  IMPORTANT : express.raw() doit être AVANT express.json() dans server.js
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/stripe/vendeurs',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    console.log('\n💳 ' + '='.repeat(50));
    console.log('💳 WEBHOOK STRIPE — VENDEURS');
    console.log('💳 ' + '='.repeat(50));

    const signature   = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      console.log(`✅ Signature valide — event: ${event.type} (${event.id})`);
    } catch (err) {
      console.error('🔴 Signature invalide:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await traiterEvent(event, res);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE 2 — Webhook "e-Vend paiements" (Votre compte)
// URL Stripe : https://evend-multivendeur-api.onrender.com/api/webhooks/stripe/paiements
// Variable   : STRIPE_WEBHOOK_SECRET_PAIEMENTS
// Events     : checkout.session.completed, payment_intent.succeeded
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/stripe/paiements',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    console.log('\n💳 ' + '='.repeat(50));
    console.log('💳 WEBHOOK STRIPE — PAIEMENTS');
    console.log('💳 ' + '='.repeat(50));

    const signature   = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_PAIEMENTS;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
      console.log(`✅ Signature valide — event: ${event.type} (${event.id})`);
    } catch (err) {
      console.error('🔴 Signature invalide:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await traiterEvent(event, res);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE LEGACY — Garde l'ancienne route /stripe active pour compatibilité
// À supprimer une fois les URLs mises à jour dans le dashboard Stripe
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    console.log('\n⚠️  WEBHOOK STRIPE — Route legacy /stripe (à migrer)');
    const signature   = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_PAIEMENTS;
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      // Essayer l'autre clé si la première échoue
      try {
        const altSecret = process.env.STRIPE_WEBHOOK_SECRET_PAIEMENTS || process.env.STRIPE_WEBHOOK_SECRET;
        event = stripe.webhooks.constructEvent(req.body, signature, altSecret);
      } catch (err2) {
        console.error('🔴 Signature invalide sur les deux clés:', err2.message);
        return res.status(400).send(`Webhook Error: ${err2.message}`);
      }
    }
    await traiterEvent(event, res);
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : account.updated
// ═════════════════════════════════════════════════════════════════════════════
async function handleAccountUpdated(event) {
  const compte         = event.data.object;
  const stripeAccountId = compte.id;

  console.log(`\n👤 account.updated — Stripe ID: ${stripeAccountId}`);
  console.log(`   Type: ${typeCompteLabel(compte.type)}`);
  console.log(`   Statut: ${statutVerificationLabel(compte)}`);

  const vendeurResult = await pool.query(
    `SELECT id, nom, email, nom_boutique, stripe_account_type, stripe_payout_delay
     FROM vendeurs WHERE stripe_account_id = $1`,
    [stripeAccountId]
  );

  if (vendeurResult.rows.length === 0) {
    console.log(`   ⚠️  Aucun vendeur trouvé pour stripe_account_id: ${stripeAccountId}`);
    return;
  }

  const vendeur   = vendeurResult.rows[0];
  const vendeurId = vendeur.id;

  const typeCompte       = compte.type;
  const payoutSchedule   = compte.settings?.payouts?.schedule;
  const delaiPayout      = payoutSchedule?.interval || 'manual';
  const chargesEnabled   = compte.charges_enabled;
  const payoutsEnabled   = compte.payouts_enabled;
  const documentManquants = compte.requirements?.currently_due || [];
  const estVerifie       = chargesEnabled && payoutsEnabled && documentManquants.length === 0;

  await pool.query(
    `UPDATE vendeurs SET
       stripe_account_type    = $1,
       stripe_payout_delay    = $2,
       stripe_charges_enabled = $3,
       stripe_payouts_enabled = $4,
       stripe_verified        = $5,
       stripe_requirements    = $6::jsonb,
       updated_at             = NOW()
     WHERE id = $7`,
    [typeCompte, delaiPayout, chargesEnabled, payoutsEnabled, estVerifie,
     JSON.stringify(compte.requirements || {}), vendeurId]
  );
  console.log(`   ✅ Vendeur ${vendeurId} mis à jour`);

  const messageNotif = estVerifie
    ? `Votre compte Stripe ${typeCompteLabel(typeCompte)} est vérifié et actif.`
    : `Action requise sur votre compte Stripe: ${documentManquants.join(', ')}`;

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW())`,
    [
      estVerifie ? '✅ Compte Stripe vérifié' : '⚠️ Action requise — Stripe',
      messageNotif,
      estVerifie ? 'succes' : 'avertissement',
      'vendeurs', vendeurId
    ]
  );

  if (vendeur.email) {
    const sujet    = estVerifie ? '✅ Votre compte Stripe est vérifié — e-Vend' : '⚠️ Action requise sur votre compte Stripe — e-Vend';
    const corpsHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
          <div style="background:${estVerifie ? '#16a34a' : '#d97706'};padding:20px;text-align:center;">
            <h1 style="color:white;margin:0;">${estVerifie ? '✅ Compte vérifié' : '⚠️ Action requise'}</h1>
          </div>
          <div style="padding:24px;">
            <p style="font-size:16px;font-weight:bold;">Bonjour ${vendeur.nom || 'cher vendeur'},</p>
            <p>${messageNotif}</p>
            <div style="background:#f8fafc;border-left:4px solid #2d6a9f;padding:12px 16px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Type :</strong> ${typeCompteLabel(typeCompte)}</p>
              <p style="margin:4px 0;"><strong>Délai payout :</strong> ${delaiPayoutLabel(payoutSchedule)}</p>
              <p style="margin:4px 0;"><strong>Paiements activés :</strong> ${chargesEnabled ? '✅ Oui' : '❌ Non'}</p>
              <p style="margin:4px 0;"><strong>Virements activés :</strong> ${payoutsEnabled ? '✅ Oui' : '❌ Non'}</p>
              ${documentManquants.length > 0 ? `<p style="margin:4px 0;color:#dc2626;"><strong>Documents manquants :</strong> ${documentManquants.join(', ')}</p>` : ''}
            </div>
            ${!estVerifie ? `<div style="margin-top:20px;text-align:center;"><a href="https://dashboard.stripe.com" style="display:inline-block;background:#635bff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Compléter mon profil Stripe →</a></div>` : ''}
            <p style="font-size:12px;color:#6b7280;margin-top:24px;text-align:center;">© e-Vend.ca</p>
          </div>
        </div>
      </body></html>`;
    try { await sendEmail(vendeur.email, sujet, corpsHtml); } catch (e) { console.error('❌ Email:', e.message); }
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_ACCOUNT_UPDATED', 'stripe', JSON.stringify({ stripe_account_id: stripeAccountId, vendeur_id: vendeurId, verified: estVerifie }), estVerifie ? 'info' : 'avertissement']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : checkout.session.completed
// Déclenché quand une session Stripe Checkout est complétée avec succès.
// On met à jour le stripe_session_id et on laisse payment_intent.succeeded
// gérer le transfer — les deux events arrivent pour le même paiement.
// ═════════════════════════════════════════════════════════════════════════════
async function handleCheckoutSessionCompleted(event) {
  const session    = event.data.object;
  const commandeId = session.metadata?.commande_id || null;
  const sessionId  = session.id;
  const piId       = session.payment_intent || null;

  console.log(`\n🛒 checkout.session.completed — Session: ${sessionId}`);
  console.log(`   Payment Intent: ${piId}`);
  console.log(`   Commande: ${commandeId}`);

  if (commandeId) {
    await pool.query(
      `UPDATE commandes SET
         stripe_session_id = $1,
         updated_at        = NOW()
       WHERE commande_id = $2`,
      [sessionId, commandeId]
    );
    console.log(`   ✅ stripe_session_id mis à jour pour commande ${commandeId}`);
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date)
     VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_CHECKOUT_COMPLETED', 'stripe',
     JSON.stringify({ session_id: sessionId, payment_intent: piId, commande_id: commandeId }),
     'info']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : payment_intent.succeeded  ← PARTIE CLÉ AVEC COMMISSION AUTO
// ✅ CORRIGÉ: Utilise pi.metadata au lieu de event.account (inexistant)
// ✅ CORRIGÉ: Récupère vendeur_id depuis metadata et cherche stripe_account_id en DB
// ═════════════════════════════════════════════════════════════════════════════
async function handlePaymentIntentSucceeded(event) {
  const pi = event.data.object;
  
  // ⚠️ IMPORTANT: event.account n'existe PAS pour payment_intent.succeeded
  // On doit utiliser les metadata pour récupérer commande_id et vendeur_id
  const commandeId = pi.metadata?.commande_id || null;
  const vendeurId  = pi.metadata?.vendeur_id || null;
  const montant    = pi.amount / 100;

  console.log(`\n💰 payment_intent.succeeded — PI: ${pi.id}`);
  console.log(`   Montant: ${montant.toFixed(2)} ${pi.currency.toUpperCase()}`);
  console.log(`   Metadata:`, pi.metadata);
  console.log(`   Commande ID (metadata): ${commandeId}`);
  console.log(`   Vendeur ID (metadata): ${vendeurId}`);

  // ✅ ÉTAPE 2 — Lire les taxes et extras depuis la BD — plus fiable que les metadata Stripe
  let montantTaxes = 0;
  let extras       = { frais_expedition: 0, pourboire: 0, frais_manutention: 0 };
  if (commandeId) {
    const taxResult = await pool.query(
      `SELECT COALESCE(tps,0) + COALESCE(tvq,0) + COALESCE(tvh,0) AS total_taxes,
              COALESCE(frais_expedition,0)  AS frais_expedition,
              COALESCE(pourboire,0)         AS pourboire,
              COALESCE(frais_manutention,0) AS frais_manutention
       FROM commandes WHERE commande_id = $1`,
      [commandeId]
    );
    if (taxResult.rows[0]) {
      montantTaxes = parseFloat(taxResult.rows[0].total_taxes || 0);
      extras = {
        frais_expedition:  parseFloat(taxResult.rows[0].frais_expedition  || 0),
        pourboire:         parseFloat(taxResult.rows[0].pourboire         || 0),
        frais_manutention: parseFloat(taxResult.rows[0].frais_manutention || 0),
      };
    }
  }
  if (montantTaxes > 0) {
    console.log(`   🧾 Taxes BD: ${montantTaxes.toFixed(2)} $ (tps+tvq+tvh)`);
  }
  const totalExtras = extras.frais_expedition + extras.pourboire + extras.frais_manutention;
  if (totalExtras > 0) {
    console.log(`   🚚 Extras: expédition ${extras.frais_expedition.toFixed(2)}$ | pourboire ${extras.pourboire.toFixed(2)}$ | manutention ${extras.frais_manutention.toFixed(2)}$`);
  }

  // ── 1. Mettre à jour la commande comme payée ─────────────────────────────
  if (commandeId) {
    const chargeId = pi.latest_charge || null;

    await pool.query(
      `UPDATE commandes SET
         statut_paiement   = 'paye',
         stripe_payment_id = $1,
         stripe_charge_id  = $2,
         montant_paye      = $3,
         date_paiement     = NOW(),
         updated_at        = NOW()
       WHERE commande_id = $4`,
      [pi.id, chargeId, montant, commandeId]
    );
    console.log(`   ✅ Commande ${commandeId} marquée payée (PI: ${pi.id} | Charge: ${chargeId})`);
  }

  // ── 2. Récupérer le vendeur depuis la BD (via vendeurId des metadata) ────
  let vendeur = null;
  if (vendeurId) {
    const r = await pool.query(
      `SELECT id, nom, email, nom_boutique, stripe_account_id,
              stripe_charges_enabled, stripe_payouts_enabled
       FROM vendeurs WHERE id = $1`,
      [vendeurId]
    );
    vendeur = r.rows[0] || null;
  }

  if (!vendeur) {
    console.log(`   ⚠️  Aucun vendeur trouvé pour vendeur_id: ${vendeurId}`);
  }

  // ── 3. Calculer + transférer selon processing_method configuré ─────────────
  if (vendeur && commandeId && montant > 0) {

    // Lire le processing_method depuis la config Stripe admin
    let processingMethod = 'SEPARATE CHARGES AND TRANSFERS'; // défaut sécuritaire
    try {
      const cfgResult = await pool.query(
        `SELECT processing_method FROM configuration_stripe_admin WHERE id = 1`
      );
      if (cfgResult.rows.length > 0) {
        processingMethod = (cfgResult.rows[0].processing_method || '').toUpperCase();
      }
    } catch (_) {}

    const isDirectCharge = processingMethod.includes('DIRECT');

    if (isDirectCharge) {
      // ── DIRECT CHARGES ────────────────────────────────────────────────────
      // Le PaymentIntent a été créé sur le compte Connect du vendeur
      // avec application_fee_amount = commission.
      // Stripe transfère automatiquement la commission à notre compte platform.
      console.log(`   ✅ Mode DIRECT CHARGES — commission capturée via application_fee_amount`);
      console.log(`   💰 Montant total: ${montant.toFixed(2)} $ (commission intégrée au PaymentIntent)`);

      // Enregistrer la commission sans transfer (elle a déjà été perçue)
      const calcul = await calculerCommission(montant, vendeur.id, montantTaxes, extras);
      await pool.query(
        `INSERT INTO commissions (
           commande_id, vendeur_id, montant_total, taux_commission,
           commission_fixe, montant_commission, montant_vendeur,
           devise, statut, stripe_payment_intent_id, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'transfer_complete',$9,NOW())
         ON CONFLICT (commande_id, vendeur_id) DO NOTHING`,
        [
          commandeId, vendeur.id, montant,
          calcul.taux_commission, calcul.commission_fixe,
          calcul.montant_commission, calcul.montant_vendeur,
          pi.currency || 'cad', pi.id
        ]
      );

    } else {
      // ── DESTINATION CHARGES ou SEPARATE CHARGES AND TRANSFERS ─────────────
      // Le PaymentIntent a été créé sur notre compte platform.
      // On doit transférer la part du vendeur via stripe.transfers.create()

      // Vérifier qu'un transfer n'a pas déjà été fait pour cette commande
      const dejaTransfer = await pool.query(
        `SELECT stripe_transfer_id FROM commandes WHERE commande_id = $1`,
        [commandeId]
      );

      if (dejaTransfer.rows[0]?.stripe_transfer_id) {
        console.log(`   ⏭️  Transfer déjà effectué (${dejaTransfer.rows[0].stripe_transfer_id}) — on passe`);
      } else if (!vendeur.stripe_account_id) {
        console.log(`   ⚠️  Vendeur ${vendeur.id} sans compte Stripe Connect — pas de transfer`);
      } else if (!vendeur.stripe_charges_enabled || !vendeur.stripe_payouts_enabled) {
        console.log(`   ⚠️  Compte Stripe vendeur ${vendeur.id} non vérifié — pas de transfer`);
      } else {
        try {
          const calcul = await calculerCommission(montant, vendeur.id, montantTaxes, extras);

          console.log(`   📊 Mode: ${processingMethod}`);
          console.log(`   🏦 Commission e-Vend (${calcul.taux_commission}%): ${calcul.montant_commission.toFixed(2)} $`);
          console.log(`   👤 Part vendeur: ${calcul.montant_vendeur.toFixed(2)} $`);

          const commissionResult = await pool.query(
            `INSERT INTO commissions (
               commande_id, vendeur_id, montant_total, taux_commission,
               commission_fixe, montant_commission, montant_vendeur,
               devise, statut, stripe_payment_intent_id, created_at
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'en_attente',$9,NOW())
             RETURNING id`,
            [
              commandeId, vendeur.id, montant,
              calcul.taux_commission, calcul.commission_fixe,
              calcul.montant_commission, calcul.montant_vendeur,
              pi.currency || 'cad', pi.id
            ]
          );
          const commissionId = commissionResult.rows[0].id;

          // Déclencher le transfer Stripe
          const chargeId = pi.latest_charge || null;
          const transfer = await effectuerTransfer(
            commissionId, commandeId, vendeur,
            calcul.montant_vendeur, pi.currency || 'cad',
            chargeId
          );

          console.log(`   ✅ Transfer automatique réussi: ${transfer.id}`);

          await pool.query(
            `UPDATE commandes SET commission_id = $1 WHERE commande_id = $2`,
            [commissionId, commandeId]
          );

        } catch (transferErr) {
          console.error(`   ❌ Erreur transfer automatique:`, transferErr.message);
          await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
            ['TRANSFER_AUTO_ERREUR', 'stripe', JSON.stringify({ commande_id: commandeId, vendeur_id: vendeur?.id, error: transferErr.message }), 'error']
          );
        }
      }
    }
  } else if (!vendeur) {
    console.log(`   ⚠️  Aucun vendeur trouvé — pas de transfer`);
  }

  // ── 4. Notification + email vendeur ─────────────────────────────────────
  if (vendeur) {
    await pool.query(
      `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
       VALUES ($1,$2,$3,$4,$5,false,NOW())`,
      ['💰 Paiement reçu', `Un paiement de ${montant.toFixed(2)} $ a été reçu pour la commande #${commandeId || 'N/A'}.`, 'succes', 'vendeurs', vendeur.id]
    );

    if (vendeur.email) {
      const corpsHtml = `
        <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
            <div style="background:#16a34a;padding:20px;text-align:center;">
              <h1 style="color:white;margin:0;">💰 Paiement reçu</h1>
            </div>
            <div style="padding:24px;">
              <p style="font-size:16px;font-weight:bold;">Bonjour ${vendeur.nom || 'cher vendeur'},</p>
              <p>Un paiement a été confirmé pour votre boutique <strong>${vendeur.nom_boutique || 'e-Vend'}</strong>.</p>
              <div style="background:#f8fafc;border-left:4px solid #16a34a;padding:12px 16px;margin:16px 0;">
                <p style="margin:4px 0;"><strong>Commande :</strong> #${commandeId || 'N/A'}</p>
                <p style="margin:4px 0;"><strong>Montant total :</strong> <span style="font-size:20px;font-weight:bold;color:#16a34a;">${montant.toFixed(2)} ${pi.currency.toUpperCase()}</span></p>
                <p style="margin:4px 0;"><strong>Référence Stripe :</strong> ${pi.id}</p>
                <p style="margin:4px 0;"><strong>Date :</strong> ${new Date().toLocaleString('fr-CA')}</p>
              </div>
              <p style="color:#6b7280;font-size:13px;">Le virement de votre part sera effectué automatiquement vers votre compte Stripe.</p>
              <div style="margin-top:20px;text-align:center;">
                <a href="https://admin.e-vend.ca/vendeur/commandes/${commandeId}" style="display:inline-block;background:#2d6a9f;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">📋 Voir la commande →</a>
              </div>
              <p style="font-size:12px;color:#6b7280;margin-top:24px;text-align:center;">© e-Vend.ca</p>
            </div>
          </div>
        </body></html>`;
      try { await sendEmail(vendeur.email, `💰 Paiement reçu — Commande #${commandeId}`, corpsHtml); } catch (e) { console.error('❌ Email:', e.message); }
    }
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_PAYMENT_SUCCEEDED', 'stripe', JSON.stringify({ payment_intent_id: pi.id, commande_id: commandeId, vendeur_id: vendeurId, montant }), 'info']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : transfer.created
// ═════════════════════════════════════════════════════════════════════════════
async function handleTransferCreated(event) {
  const transfer  = event.data.object;
  const montant   = transfer.amount / 100;
  const commandeId = transfer.metadata?.commande_id || null;
  const vendeurId  = transfer.metadata?.vendeur_id  || null;

  console.log(`\n🔁 transfer.created — Transfer: ${transfer.id}`);
  console.log(`   Destination: ${transfer.destination}`);
  console.log(`   Montant: ${montant.toFixed(2)} ${transfer.currency.toUpperCase()}`);

  await pool.query(
    `INSERT INTO stripe_transfers (
       stripe_transfer_id, vendeur_id, commande_id, montant, devise, destination_account, statut, created_at
     ) VALUES ($1,$2,$3,$4,$5,$6,'cree',NOW())
     ON CONFLICT (stripe_transfer_id) DO NOTHING`,
    [transfer.id, vendeurId, commandeId, montant, transfer.currency, transfer.destination]
  );

  if (commandeId) {
    await pool.query(
      `UPDATE commandes SET stripe_transfer_id=$1, montant_transfer=$2, date_transfer=NOW(), updated_at=NOW() WHERE commande_id=$3`,
      [transfer.id, montant, commandeId]
    );
  }

  // Mettre à jour la commission si elle existe
  await pool.query(
    `UPDATE commissions SET
       stripe_transfer_id = $1,
       statut             = 'transfer_initie',
       updated_at         = NOW()
     WHERE commande_id = $2 AND stripe_transfer_id IS NULL`,
    [transfer.id, commandeId]
  );

  let vendeur = null;
  if (vendeurId) {
    const r = await pool.query(`SELECT id, nom, email, nom_boutique, stripe_payout_delay, stripe_account_type FROM vendeurs WHERE id = $1`, [vendeurId]);
    vendeur = r.rows[0] || null;
  } else {
    const r = await pool.query(`SELECT id, nom, email, nom_boutique, stripe_payout_delay, stripe_account_type FROM vendeurs WHERE stripe_account_id = $1`, [transfer.destination]);
    vendeur = r.rows[0] || null;
  }

  if (!vendeur) { console.log(`   ⚠️  Vendeur introuvable`); return; }

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at) VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    ['🔁 Virement initié', `Un virement de ${montant.toFixed(2)} $ a été envoyé vers votre compte Stripe.`, 'info', 'vendeurs', vendeur.id]
  );

  if (vendeur.email) {
    const delaiTexte = vendeur.stripe_payout_delay === 'manual' ? 'selon votre configuration manuelle' : `sous ${vendeur.stripe_payout_delay || 'quelques jours'}`;
    const corpsHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
          <div style="background:#2d6a9f;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">🔁 Virement initié</h1></div>
          <div style="padding:24px;">
            <p style="font-size:16px;font-weight:bold;">Bonjour ${vendeur.nom || 'cher vendeur'},</p>
            <p>Un virement a été initié depuis e-Vend vers votre compte Stripe.</p>
            <div style="background:#f8fafc;border-left:4px solid #2d6a9f;padding:12px 16px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Montant :</strong> <span style="font-size:20px;font-weight:bold;color:#2d6a9f;">${montant.toFixed(2)} ${transfer.currency.toUpperCase()}</span></p>
              <p style="margin:4px 0;"><strong>Commande :</strong> #${commandeId || 'N/A'}</p>
              <p style="margin:4px 0;"><strong>Délai réception :</strong> ${delaiTexte}</p>
              <p style="margin:4px 0;"><strong>Référence :</strong> ${transfer.id}</p>
            </div>
            <p style="font-size:12px;color:#6b7280;margin-top:24px;text-align:center;">© e-Vend.ca</p>
          </div>
        </div>
      </body></html>`;
    try { await sendEmail(vendeur.email, `🔁 Virement de ${montant.toFixed(2)} $ initié — e-Vend`, corpsHtml); } catch (e) { console.error('❌ Email:', e.message); }
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_TRANSFER_CREATED', 'stripe', JSON.stringify({ transfer_id: transfer.id, vendeur_id: vendeur.id, commande_id: commandeId, montant }), 'info']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : payout.paid
// ═════════════════════════════════════════════════════════════════════════════
async function handlePayoutPaid(event) {
  const payout          = event.data.object;
  const stripeAccountId = event.account;
  const montant         = payout.amount / 100;
  const dateArrivee     = new Date(payout.arrival_date * 1000);

  console.log(`\n🏦 payout.paid — Payout: ${payout.id}`);
  console.log(`   Compte Connect: ${stripeAccountId}`);
  console.log(`   Montant: ${montant.toFixed(2)} ${payout.currency.toUpperCase()}`);

  const vendeurResult = await pool.query(
    `SELECT id, nom, email, nom_boutique, stripe_account_type, stripe_payout_delay
     FROM vendeurs WHERE stripe_account_id = $1`,
    [stripeAccountId]
  );

  if (vendeurResult.rows.length === 0) {
    console.log(`   ⚠️  Vendeur introuvable pour ${stripeAccountId}`);
    return;
  }

  const vendeur = vendeurResult.rows[0];

  await pool.query(
    `INSERT INTO stripe_payouts (stripe_payout_id, vendeur_id, montant, devise, methode, date_arrivee, statut, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,'paye',NOW())
     ON CONFLICT (stripe_payout_id) DO UPDATE SET statut='paye', updated_at=NOW()`,
    [payout.id, vendeur.id, montant, payout.currency, payout.method, dateArrivee]
  );

  // Marquer les commissions comme transfer_complete
  await pool.query(
    `UPDATE commissions SET statut='transfer_complete', updated_at=NOW()
     WHERE vendeur_id=$1 AND statut='transfer_initie'`,
    [vendeur.id]
  );

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at) VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    ['🏦 Virement bancaire complété', `${montant.toFixed(2)} $ ont été déposés dans votre compte bancaire le ${dateArrivee.toLocaleDateString('fr-CA')}.`, 'succes', 'vendeurs', vendeur.id]
  );

  if (vendeur.email) {
    const corpsHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
          <div style="background:#16a34a;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">🏦 Argent déposé!</h1></div>
          <div style="padding:24px;">
            <p style="font-size:16px;font-weight:bold;">Bonjour ${vendeur.nom || 'cher vendeur'},</p>
            <p>Stripe a complété le virement vers votre compte bancaire.</p>
            <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Montant déposé :</strong> <span style="font-size:22px;font-weight:bold;color:#16a34a;">${montant.toFixed(2)} ${payout.currency.toUpperCase()}</span></p>
              <p style="margin:4px 0;"><strong>Date :</strong> ${dateArrivee.toLocaleDateString('fr-CA', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
              <p style="margin:4px 0;"><strong>Méthode :</strong> ${payout.method === 'standard' ? 'Virement standard' : 'Virement instantané'}</p>
              <p style="margin:4px 0;"><strong>Référence :</strong> ${payout.id}</p>
            </div>
            <div style="margin-top:20px;text-align:center;">
              <a href="https://admin.e-vend.ca/vendeur/finances" style="display:inline-block;background:#2d6a9f;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">📊 Voir mes finances →</a>
            </div>
            <p style="font-size:12px;color:#6b7280;margin-top:24px;text-align:center;">© e-Vend.ca</p>
          </div>
        </div>
      </body></html>`;
    try { await sendEmail(vendeur.email, `🏦 ${montant.toFixed(2)} $ déposés — e-Vend`, corpsHtml); } catch (e) { console.error('❌ Email:', e.message); }
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_PAYOUT_PAID', 'stripe', JSON.stringify({ payout_id: payout.id, stripe_account_id: stripeAccountId, vendeur_id: vendeur.id, montant }), 'info']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : payout.failed
// ═════════════════════════════════════════════════════════════════════════════
async function handlePayoutFailed(event) {
  const payout          = event.data.object;
  const stripeAccountId = event.account;
  const montant         = payout.amount / 100;

  console.log(`\n❌ payout.failed — Payout: ${payout.id}`);
  console.log(`   Compte Connect: ${stripeAccountId}`);
  console.log(`   Raison: ${payout.failure_message || payout.failure_code || 'inconnue'}`);

  const vendeurResult = await pool.query(
    `SELECT id, nom, email FROM vendeurs WHERE stripe_account_id = $1`,
    [stripeAccountId]
  );
  if (vendeurResult.rows.length === 0) {
    console.log(`   ⚠️  Vendeur introuvable pour ${stripeAccountId}`);
    return;
  }
  const vendeur = vendeurResult.rows[0];

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
     VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    [
      '❌ Échec du virement bancaire',
      `Un virement de ${montant.toFixed(2)} $ a échoué. Raison: ${payout.failure_message || payout.failure_code || 'inconnue'}. Veuillez mettre à jour vos informations bancaires dans votre dashboard Stripe.`,
      'danger', 'vendeurs', vendeur.id
    ]
  );

  if (vendeur.email) {
    const corpsHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
      <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
        <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
          <div style="background:#dc2626;padding:20px;text-align:center;">
            <h1 style="color:white;margin:0;">❌ Échec du virement</h1>
          </div>
          <div style="padding:24px;">
            <p style="font-size:16px;font-weight:bold;">Bonjour ${vendeur.nom || 'cher vendeur'},</p>
            <p>Un virement vers votre compte bancaire a échoué.</p>
            <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Montant :</strong> ${montant.toFixed(2)} ${payout.currency.toUpperCase()}</p>
              <p style="margin:4px 0;"><strong>Raison :</strong> ${payout.failure_message || payout.failure_code || 'Erreur bancaire'}</p>
              <p style="margin:4px 0;"><strong>Référence :</strong> ${payout.id}</p>
            </div>
            <p>Veuillez mettre à jour vos informations bancaires dans votre dashboard Stripe pour que les prochains virements puissent être effectués.</p>
            <div style="margin-top:20px;text-align:center;">
              <a href="https://dashboard.stripe.com" style="display:inline-block;background:#635bff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Mettre à jour mes infos bancaires →</a>
            </div>
            <p style="font-size:12px;color:#6b7280;margin-top:24px;text-align:center;">© e-Vend.ca</p>
          </div>
        </div>
      </body></html>`;
    try { await sendEmail(vendeur.email, `❌ Échec du virement — Action requise — e-Vend`, corpsHtml); } catch (e) { console.error('❌ Email:', e.message); }
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_PAYOUT_FAILED', 'stripe',
     JSON.stringify({ payout_id: payout.id, stripe_account_id: stripeAccountId, vendeur_id: vendeur.id, montant, raison: payout.failure_code }),
     'error']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : account.application.deauthorized
// ═════════════════════════════════════════════════════════════════════════════
async function handleAccountDeauthorized(event) {
  const stripeAccountId = event.account;

  console.log(`\n🔌 account.application.deauthorized — Compte: ${stripeAccountId}`);

  const vendeurResult = await pool.query(
    `SELECT id, nom, email FROM vendeurs WHERE stripe_account_id = $1`,
    [stripeAccountId]
  );
  if (vendeurResult.rows.length === 0) {
    console.log(`   ⚠️  Vendeur introuvable pour ${stripeAccountId}`);
    return;
  }
  const vendeur = vendeurResult.rows[0];

  await pool.query(
    `UPDATE vendeurs SET
       stripe_account_id      = NULL,
       stripe_account_type    = NULL,
       stripe_charges_enabled = false,
       stripe_payouts_enabled = false,
       stripe_verified        = false,
       updated_at             = NOW()
     WHERE id = $1`,
    [vendeur.id]
  );
  console.log(`   ✅ Vendeur ${vendeur.id} — compte Stripe déconnecté, BD nettoyée`);

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
     VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    [
      '🔌 Compte Stripe déconnecté',
      'Votre compte Stripe a été déconnecté de la plateforme e-Vend. Les paiements et virements sont suspendus jusqu\'à reconnexion.',
      'danger', 'vendeurs', vendeur.id
    ]
  );

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_ACCOUNT_DEAUTHORIZED', 'stripe',
     JSON.stringify({ stripe_account_id: stripeAccountId, vendeur_id: vendeur.id }),
     'warning']
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// HELPER — Obtenir la clé Stripe depuis la config
// ═════════════════════════════════════════════════════════════════════════════
async function getStripeClient() {
  const cfgResult = await pool.query(
    `SELECT sandbox, dev_secret_key, prod_secret_key FROM configuration_stripe_admin WHERE id = 1`
  );
  if (cfgResult.rows.length === 0) return null;
  const cfg = cfgResult.rows[0];
  const { dechiffrer } = require('./commissions');
  const stripeKey = dechiffrer(cfg.sandbox ? cfg.dev_secret_key : cfg.prod_secret_key);
  if (!stripeKey) return null;
  return require('stripe')(stripeKey);
}

// ═════════════════════════════════════════════════════════════════════════════
// HELPER — Reversal proportionnel d'un transfer
// ═════════════════════════════════════════════════════════════════════════════
async function reversalProportionnel(transferId, montantTotal, montantCeRemboursement, raison, disputeId, commandeId) {
  try {
    const stripeClient = await getStripeClient();
    if (!stripeClient) return null;

    const cmdResult = await pool.query(
      `SELECT montant_transfer, montant_paye, statut_paiement, montant_rembourse_total
       FROM commandes WHERE commande_id = $1`,
      [commandeId]
    );
    const commande = cmdResult.rows[0];
    if (!commande) {
      console.log(`   ⚠️  Commande ${commandeId} introuvable — reversal annulé`);
      return null;
    }

    const montantTransfer    = parseFloat(commande.montant_transfer || 0);
    const montantPayeOriginal = parseFloat(commande.montant_paye || 0);
    const dejaRembourse      = parseFloat(commande.montant_rembourse_total || 0);

    if (commande.statut_paiement !== 'paye' && commande.statut_paiement !== 'rembourse_partiel') {
      console.log(`   ⚠️  Commande ${commandeId} non payée (statut: ${commande.statut_paiement}) — reversal annulé`);
      return null;
    }

    if (montantTransfer <= 0) {
      console.log(`   ⚠️  Pas de montant transféré pour ${commandeId} — reversal annulé`);
      return null;
    }

    const proportion           = montantCeRemboursement / montantTotal;
    const montantAReverserBrut = montantTransfer * proportion;
    const dejaReverseTransfer = montantTransfer * (dejaRembourse / montantTotal);
    const maxReversal         = montantTransfer - dejaReverseTransfer;

    if (maxReversal <= 0) {
      console.log(`   ⚠️  Transfer déjà entièrement reversé pour ${commandeId} — rien à reverser`);
      return null;
    }

    const montantAReverserFinal = Math.min(montantAReverserBrut, maxReversal);
    const montantCents          = Math.round(montantAReverserFinal * 100);

    if (montantCents <= 0) return null;

    const reversal = await stripeClient.transfers.createReversal(transferId, {
      amount:   montantCents,
      metadata: {
        raison,
        dispute_id:          disputeId || '',
        commande_id:         commandeId,
        proportion:          proportion.toFixed(4),
        montant_rembourse:   montantCeRemboursement.toFixed(2),
        deja_rembourse_avant: dejaRembourse.toFixed(2),
      },
    });

    const nouveauTotal = dejaRembourse + montantCeRemboursement;
    await pool.query(
      `UPDATE commandes SET
         montant_rembourse_total = $1,
         updated_at              = NOW()
       WHERE commande_id = $2`,
      [Math.min(nouveauTotal, montantPayeOriginal), commandeId]
    );

    console.log(`   ✅ Reversal: ${(montantCents/100).toFixed(2)} $ (${(proportion*100).toFixed(1)}% de ${montantTransfer.toFixed(2)} $, max=${maxReversal.toFixed(2)} $)`);
    return reversal;

  } catch (err) {
    console.error(`   ❌ Reversal échoué: ${err.message}`);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : charge.dispute.created
// ═════════════════════════════════════════════════════════════════════════════
async function handleDisputeCreated(event) {
  const dispute  = event.data.object;
  const chargeId = dispute.charge;
  const montant  = dispute.amount / 100;

  console.log(`\n⚠️  charge.dispute.created — Dispute: ${dispute.id}`);
  console.log(`   Charge: ${chargeId} | Montant: ${montant.toFixed(2)} | Raison: ${dispute.reason}`);

  const cmdResult = await pool.query(
    `SELECT commande_id, vendeur_id, montant_paye, stripe_transfer_id, montant_transfer
     FROM commandes WHERE stripe_charge_id = $1 OR stripe_payment_id = $1 LIMIT 1`,
    [chargeId]
  );
  const commande   = cmdResult.rows[0] || null;
  const commandeId = commande?.commande_id || 'inconnue';
  const vendeurId  = commande?.vendeur_id  || null;

  let reversal = null;
  if (commande?.stripe_transfer_id && commande?.montant_paye) {
    reversal = await reversalProportionnel(
      commande.stripe_transfer_id,
      parseFloat(commande.montant_paye),
      montant,
      'chargeback',
      dispute.id,
      commandeId
    );

    if (reversal) {
      await pool.query(
        `UPDATE commandes SET
           stripe_dispute_id      = $1,
           stripe_reversal_id     = $2,
           montant_dispute        = $3,
           updated_at             = NOW()
         WHERE commande_id = $4`,
        [dispute.id, reversal.id, montant, commandeId]
      );
      await pool.query(
        `UPDATE commissions SET statut = 'dispute', updated_at = NOW() WHERE commande_id = $1`,
        [commandeId]
      );
    }
  }

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
     VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    ['⚠️ Dispute/Chargeback reçu',
     `Chargeback de ${montant.toFixed(2)} $ — Commande #${commandeId} — Raison: ${dispute.reason}. ${reversal ? 'Transfer reversé ✅' : 'Reversal non effectué ⚠️'}`,
     'danger', 'admin', vendeurId]
  );

  if (vendeurId) {
    await pool.query(
      `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
       VALUES ($1,$2,$3,$4,$5,false,NOW())`,
      ['⚠️ Contestation de paiement',
       `Un client a contesté ${montant.toFixed(2)} $ pour la commande #${commandeId}. Raison: ${dispute.reason}. Les fonds sont temporairement retenus.`,
       'danger', 'vendeurs', vendeurId]
    );

    const vendeurResult = await pool.query(`SELECT nom, email FROM vendeurs WHERE id = $1`, [vendeurId]);
    const vendeur = vendeurResult.rows[0];
    if (vendeur?.email) {
      const corpsHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
          <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
            <div style="background:#dc2626;padding:20px;text-align:center;"><h1 style="color:white;margin:0;">⚠️ Contestation de paiement</h1></div>
            <div style="padding:24px;">
              <p>Bonjour ${vendeur.nom},</p>
              <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:16px 0;">
                <p style="margin:4px 0;"><strong>Commande :</strong> #${commandeId}</p>
                <p style="margin:4px 0;"><strong>Montant contesté :</strong> ${montant.toFixed(2)} $</p>
                <p style="margin:4px 0;"><strong>Raison :</strong> ${dispute.reason}</p>
                <p style="margin:4px 0;"><strong>Référence :</strong> ${dispute.id}</p>
              </div>
              <p>Conservez toutes les preuves de livraison. Notre équipe gère cette contestation.</p>
              <p style="font-size:12px;color:#6b7280;margin-top:24px;text-align:center;">© e-Vend.ca</p>
            </div>
          </div>
        </body></html>`;
      try { await sendEmail(vendeur.email, `⚠️ Contestation — Commande #${commandeId}`, corpsHtml); } catch (e) {}
    }
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_DISPUTE_CREATED', 'stripe',
     JSON.stringify({ dispute_id: dispute.id, charge_id: chargeId, commande_id: commandeId, vendeur_id: vendeurId, montant, raison: dispute.reason, reversal_id: reversal?.id }),
     'error']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : charge.dispute.closed
// ═════════════════════════════════════════════════════════════════════════════
async function handleDisputeClosed(event) {
  const dispute   = event.data.object;
  const chargeId  = dispute.charge;
  const montant   = dispute.amount / 100;
  const estGagnee = dispute.status === 'won';

  console.log(`\n${estGagnee ? '✅' : '❌'} charge.dispute.closed — ${dispute.id} — ${dispute.status}`);

  const cmdResult = await pool.query(
    `SELECT commande_id, vendeur_id, stripe_transfer_id, stripe_reversal_id,
            montant_transfer, montant_dispute, montant_paye
     FROM commandes WHERE stripe_charge_id = $1 OR stripe_payment_id = $1 LIMIT 1`,
    [chargeId]
  );
  const commande   = cmdResult.rows[0] || null;
  const commandeId = commande?.commande_id || 'inconnue';
  const vendeurId  = commande?.vendeur_id  || null;

  if (estGagnee && commande?.stripe_reversal_id && vendeurId) {
    try {
      const vendeurResult = await pool.query(
        `SELECT stripe_account_id FROM vendeurs WHERE id = $1`, [vendeurId]
      );
      const stripeAccountId = vendeurResult.rows[0]?.stripe_account_id;

      if (stripeAccountId) {
        const stripeClient = await getStripeClient();
        if (stripeClient) {
          const proportion   = parseFloat(commande.montant_dispute || montant) / parseFloat(commande.montant_paye || montant);
          const montantCents = Math.round(parseFloat(commande.montant_transfer || 0) * proportion * 100);

          if (montantCents > 0) {
            const transfer = await stripeClient.transfers.create({
              amount:         montantCents,
              currency:       'cad',
              destination:    stripeAccountId,
              transfer_group: `commande_${commandeId}`,
              metadata:       { raison: 'dispute_gagnee', dispute_id: dispute.id, commande_id: commandeId },
              description:    `e-Vend — Dispute gagnée — Commande #${commandeId}`,
            });
            console.log(`   ✅ Fonds retransférés au vendeur: ${(montantCents/100).toFixed(2)} $ → ${transfer.id}`);

            await pool.query(
              `UPDATE commandes SET stripe_transfer_id=$1, stripe_dispute_id=NULL, stripe_reversal_id=NULL, updated_at=NOW() WHERE commande_id=$2`,
              [transfer.id, commandeId]
            );
            await pool.query(
              `UPDATE commissions SET statut='transfer_complete', updated_at=NOW() WHERE commande_id=$1`,
              [commandeId]
            );
          }
        }
      }
    } catch (err) {
      console.error(`   ❌ Retransfer après dispute gagnée échoué: ${err.message}`);
    }
  }

  const message = estGagnee
    ? `Dispute gagnée ✅ — ${montant.toFixed(2)} $ — Commande #${commandeId}. Fonds retransférés au vendeur.`
    : `Dispute perdue ❌ — ${montant.toFixed(2)} $ — Commande #${commandeId}. Client remboursé.`;

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
     VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    [estGagnee ? '✅ Dispute gagnée' : '❌ Dispute perdue', message, estGagnee ? 'succes' : 'danger', 'admin', vendeurId]
  );

  if (vendeurId) {
    await pool.query(
      `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
       VALUES ($1,$2,$3,$4,$5,false,NOW())`,
      [estGagnee ? '✅ Contestation résolue en votre faveur' : '❌ Contestation perdue',
       estGagnee ? `La contestation pour la commande #${commandeId} a été résolue. Vos fonds ont été rétablis.`
                 : `La contestation pour la commande #${commandeId} a été perdue. Le client a été remboursé.`,
       estGagnee ? 'succes' : 'danger', 'vendeurs', vendeurId]
    );
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_DISPUTE_CLOSED', 'stripe',
     JSON.stringify({ dispute_id: dispute.id, charge_id: chargeId, commande_id: commandeId, statut: dispute.status, montant }),
     estGagnee ? 'info' : 'warning']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : charge.refunded
// ═════════════════════════════════════════════════════════════════════════════
async function handleChargeRefunded(event) {
  const charge   = event.data.object;
  const chargeId = charge.id;

  const dernierRefund     = charge.refunds?.data?.[0];
  if (!dernierRefund) return;

  const montantCeRemboursement = dernierRefund.amount / 100;
  const montantTotalCharge     = charge.amount / 100;
  const totalRembourseStripe   = charge.amount_refunded / 100;
  const estTotal               = charge.refunded === true;

  if (charge.status !== 'succeeded') {
    console.log(`   ⚠️  Charge ${chargeId} non succeeded (${charge.status}) — ignoré`);
    return;
  }

  console.log(`\n💸 charge.refunded — Charge: ${chargeId}`);
  console.log(`   Ce remboursement: ${montantCeRemboursement.toFixed(2)} $`);

  const cmdResult = await pool.query(
    `SELECT commande_id, vendeur_id, montant_paye, stripe_transfer_id,
            montant_transfer, montant_rembourse_total, statut_paiement
     FROM commandes WHERE stripe_charge_id = $1 OR stripe_payment_id = $1 LIMIT 1`,
    [chargeId]
  );
  const commande   = cmdResult.rows[0] || null;
  const commandeId = commande?.commande_id || 'inconnue';
  const vendeurId  = commande?.vendeur_id  || null;

  if (!commande) {
    console.log(`   ⚠️  Commande introuvable pour charge ${chargeId}`);
    return;
  }

  const montantPayeBD    = parseFloat(commande.montant_paye || 0);
  const dejaRemboursBD   = parseFloat(commande.montant_rembourse_total || 0);
  const apresRemboursement = dejaRemboursBD + montantCeRemboursement;

  if (apresRemboursement > montantPayeBD + 0.01) {
    console.log(`   🚨 PROTECTION: Remboursement cumulatif dépasse montant payé — annulé`);
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
      ['STRIPE_REMBOURSEMENT_DEPASSE', 'stripe',
       JSON.stringify({ charge_id: chargeId, commande_id: commandeId, montant_paye: montantPayeBD }),
       'error']
    );
    return;
  }

  if (!commande.stripe_transfer_id) {
    console.log(`   ⚠️  Pas de transfer à reverser pour ${commandeId}`);
    await pool.query(
      `UPDATE commandes SET
         statut_paiement       = $1,
         montant_rembourse_total = COALESCE(montant_rembourse_total,0) + $2,
         updated_at            = NOW()
       WHERE commande_id = $3`,
      [estTotal ? 'rembourse' : 'rembourse_partiel', montantCeRemboursement, commandeId]
    );
    return;
  }

  const reversal = await reversalProportionnel(
    commande.stripe_transfer_id,
    montantPayeBD || montantTotalCharge,
    montantCeRemboursement,
    'remboursement',
    null,
    commandeId
  );

  const nouveauStatut = estTotal ? 'rembourse' : 'rembourse_partiel';
  await pool.query(
    `UPDATE commandes SET statut_paiement=$1, updated_at=NOW() WHERE commande_id=$2`,
    [nouveauStatut, commandeId]
  );
  await pool.query(
    `UPDATE commissions SET statut=$1, updated_at=NOW() WHERE commande_id=$2`,
    [nouveauStatut, commandeId]
  );

  const msgAdmin = `Remboursement ${estTotal ? 'total' : 'partiel'} de ${montantCeRemboursement.toFixed(2)} $ — Commande #${commandeId}. ${reversal ? 'Transfer reversé ✅' : 'Reversal non effectué ⚠️'}`;
  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
     VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    [`💸 Remboursement ${estTotal ? 'total' : 'partiel'}`, msgAdmin, 'info', 'admin', vendeurId]
  );

  if (vendeurId) {
    await pool.query(
      `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
       VALUES ($1,$2,$3,$4,$5,false,NOW())`,
      [`💸 Remboursement client ${estTotal ? 'total' : 'partiel'}`,
       `Un remboursement de ${montantCeRemboursement.toFixed(2)} $ a été effectué pour la commande #${commandeId}.`,
       'info', 'vendeurs', vendeurId]
    );
  }

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_CHARGE_REFUNDED', 'stripe',
     JSON.stringify({ charge_id: chargeId, commande_id: commandeId, montant_ce_remboursement: montantCeRemboursement, est_total: estTotal, reversal_id: reversal?.id }),
     'info']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : refund.created (API 2024-10-28+)
// ═════════════════════════════════════════════════════════════════════════════
async function handleRefundCreated(event) {
  const refund   = event.data.object;
  const chargeId = refund.charge;
  if (!chargeId) return;

  const montantCeRemboursement = refund.amount / 100;

  console.log(`\n💸 refund.created — Refund: ${refund.id} | Charge: ${chargeId}`);
  console.log(`   Montant: ${montantCeRemboursement.toFixed(2)} $ | Statut: ${refund.status}`);

  if (refund.status !== 'succeeded') {
    console.log(`   ⚠️  Refund ${refund.id} non succeeded (${refund.status}) — ignoré`);
    return;
  }

  const cmdResult = await pool.query(
    `SELECT commande_id, vendeur_id, montant_paye, stripe_transfer_id,
            montant_transfer, montant_rembourse_total, statut_paiement
     FROM commandes WHERE stripe_charge_id = $1 OR stripe_payment_id = $1 LIMIT 1`,
    [chargeId]
  );
  const commande   = cmdResult.rows[0] || null;
  const commandeId = commande?.commande_id || 'inconnue';
  const vendeurId  = commande?.vendeur_id  || null;

  if (!commande) {
    console.log(`   ⚠️  Commande introuvable pour charge ${chargeId}`);
    return;
  }

  const montantPayeBD  = parseFloat(commande.montant_paye || 0);
  const dejaRemboursBD = parseFloat(commande.montant_rembourse_total || 0);

  if (dejaRemboursBD + montantCeRemboursement > montantPayeBD + 0.01) {
    console.log(`   🚨 PROTECTION: Cumul remboursements dépasse montant payé`);
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
      ['STRIPE_REMBOURSEMENT_DEPASSE', 'stripe',
       JSON.stringify({ refund_id: refund.id, charge_id: chargeId, commande_id: commandeId }),
       'error']
    );
    return;
  }

  if (!commande.stripe_transfer_id) return;

  await reversalProportionnel(
    commande.stripe_transfer_id,
    montantPayeBD,
    montantCeRemboursement,
    'remboursement_refund',
    null,
    commandeId
  );

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_REFUND_CREATED', 'stripe',
     JSON.stringify({ refund_id: refund.id, charge_id: chargeId, commande_id: commandeId, montant: montantCeRemboursement }),
     'info']
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HANDLER : charge.updated
// ═════════════════════════════════════════════════════════════════════════════
async function handleChargeUpdated(event) {
  const charge   = event.data.object;
  const chargeId = charge.id;

  if (!charge.transfer_data || charge.transfer !== null) return;

  console.log(`\n⚠️  charge.updated — Transfer skippé pour charge: ${chargeId}`);

  const cmdResult = await pool.query(
    `SELECT commande_id, vendeur_id FROM commandes WHERE stripe_charge_id = $1 OR stripe_payment_id = $1 LIMIT 1`,
    [chargeId]
  );
  const commande   = cmdResult.rows[0] || null;
  const commandeId = commande?.commande_id || 'inconnue';
  const vendeurId  = commande?.vendeur_id  || null;

  await pool.query(
    `INSERT INTO notifications_systeme (titre, message, type, destinataire_type, vendeur_id, lu, created_at)
     VALUES ($1,$2,$3,$4,$5,false,NOW())`,
    ['⚠️ Transfer skippé — Action requise',
     `Le transfer pour la commande #${commandeId} a été skippé. Vérifier manuellement.`,
     'danger', 'admin', vendeurId]
  );

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
    ['STRIPE_TRANSFER_SKIPPED', 'stripe',
     JSON.stringify({ charge_id: chargeId, commande_id: commandeId, vendeur_id: vendeurId }),
     'error']
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Route de test
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stripe/test', (req, res) => {
  res.json({
    success: true,
    message: 'Routes webhooks Stripe fonctionnelles',
    routes: {
      vendeurs:  '/api/webhooks/stripe/vendeurs  — Comptes connectés (STRIPE_WEBHOOK_SECRET)',
      paiements: '/api/webhooks/stripe/paiements — Votre compte (STRIPE_WEBHOOK_SECRET_PAIEMENTS)',
      legacy:    '/api/webhooks/stripe           — Ancienne route (compatibilité)',
    },
    events_vendeurs: [
      'account.updated',
      'account.application.deauthorized',
      'transfer.created',
      'payout.paid',
      'payout.failed',
      'charge.dispute.created',
      'charge.dispute.closed',
      'refund.created',
      'charge.updated',
    ],
    events_paiements: [
      'checkout.session.completed',
      'payment_intent.succeeded',
    ],
    commission_auto: 'Activée — calculée et transférée au payment_intent.succeeded',
    livemode_check:  'Activée en production — events de test ignorés',
  });
});

module.exports = router;