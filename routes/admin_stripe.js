// routes/admin_stripe.js
// e-Vend Studio — Configuration Stripe côté admin (Alexandre), compte plateforme
// SÉPARÉ de celui du marketplace e-Vend original. Gère la relation
// Studio ↔ gestionnaire uniquement (comptes Connect Standard, 0% commission).
//
// Le pattern account_type/controller (STANDARD/EXPRESS/CUSTOM) est gardé
// flexible exprès : c'est le même pattern qui sera réutilisé plus tard pour
// un système multi-vendeur (le gestionnaire devenant "plateforme" pour SES
// propres sous-vendeurs) — mais dans une table/fichier séparé, jamais ici,
// puisque ce fichier-ci gère seulement la relation Studio↔gestionnaire (0%
// commission, donc pas de logique de split de paiement).

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

// Les 6 champs sensibles — chiffrés en BD, déchiffrés seulement au moment de s'en servir ou de les afficher à l'admin.
const CHAMPS_SENSIBLES = ['dev_secret_key', 'prod_secret_key', 'dev_webhook_secret', 'prod_webhook_secret', 'dev_connect_webhook_secret', 'prod_connect_webhook_secret'];

function dechiffrerConfig(config) {
  const copie = { ...config };
  for (const champ of CHAMPS_SENSIBLES) copie[champ] = dechiffrer(copie[champ]);
  return copie;
}

function getStripe(sandbox, configChiffree) {
  const { Stripe } = require('stripe');
  const cle = sandbox ? dechiffrer(configChiffree.dev_secret_key) : dechiffrer(configChiffree.prod_secret_key);
  return Stripe(cle || process.env.STRIPE_SECRET_KEY_STUDIO);
}

// GET /api/admin/stripe — charger la configuration (déchiffrée pour l'admin)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM configuration_stripe_admin WHERE id = 1');
    if (!result.rows.length) {
      result = await pool.query('INSERT INTO configuration_stripe_admin (id) VALUES (1) RETURNING *');
    }
    res.json(dechiffrerConfig(result.rows[0]));
  } catch (err) {
    console.error('GET /api/admin/stripe', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/stripe — sauvegarder toute la configuration (chiffre les 6 champs sensibles)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const c = req.body || {};
    const rowCheck = await pool.query('SELECT id FROM configuration_stripe_admin WHERE id = 1');
    if (!rowCheck.rows.length) await pool.query('INSERT INTO configuration_stripe_admin (id) VALUES (1)');

    // Chiffrer seulement les champs sensibles fournis (undefined → on laisse COALESCE garder l'ancienne valeur chiffrée)
    const devSecret        = c.dev_secret_key !== undefined ? chiffrer(c.dev_secret_key) : undefined;
    const prodSecret       = c.prod_secret_key !== undefined ? chiffrer(c.prod_secret_key) : undefined;
    const devWebhook       = c.dev_webhook_secret !== undefined ? chiffrer(c.dev_webhook_secret) : undefined;
    const prodWebhook      = c.prod_webhook_secret !== undefined ? chiffrer(c.prod_webhook_secret) : undefined;
    const devConnectWh     = c.dev_connect_webhook_secret !== undefined ? chiffrer(c.dev_connect_webhook_secret) : undefined;
    const prodConnectWh    = c.prod_connect_webhook_secret !== undefined ? chiffrer(c.prod_connect_webhook_secret) : undefined;

    const result = await pool.query(
      `UPDATE configuration_stripe_admin SET
         sandbox = COALESCE($1, sandbox),
         dev_publish_key = COALESCE($2, dev_publish_key),
         dev_secret_key = COALESCE($3, dev_secret_key),
         dev_client_id = COALESCE($4, dev_client_id),
         dev_webhook_secret = COALESCE($5, dev_webhook_secret),
         dev_connect_webhook_secret = COALESCE($6, dev_connect_webhook_secret),
         prod_publish_key = COALESCE($7, prod_publish_key),
         prod_secret_key = COALESCE($8, prod_secret_key),
         prod_client_id = COALESCE($9, prod_client_id),
         prod_webhook_secret = COALESCE($10, prod_webhook_secret),
         prod_connect_webhook_secret = COALESCE($11, prod_connect_webhook_secret),
         account_type = COALESCE($12, account_type),
         connect_flow = COALESCE($13, connect_flow),
         full_service = COALESCE($14, full_service),
         cross_border = COALESCE($15, cross_border),
         debit_negative = COALESCE($16, debit_negative),
         payout_time = COALESCE($17, payout_time),
         controller_losses = COALESCE($18, controller_losses),
         controller_fees_payer = COALESCE($19, controller_fees_payer),
         controller_dashboard = COALESCE($20, controller_dashboard),
         controller_requirements = COALESCE($21, controller_requirements),
         updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [c.sandbox, c.dev_publish_key, devSecret, c.dev_client_id, devWebhook, devConnectWh,
       c.prod_publish_key, prodSecret, c.prod_client_id, prodWebhook, prodConnectWh,
       c.account_type, c.connect_flow, c.full_service, c.cross_border, c.debit_negative, c.payout_time,
       c.controller_losses, c.controller_fees_payer, c.controller_dashboard, c.controller_requirements]
    );
    res.json(dechiffrerConfig(result.rows[0]));
  } catch (err) {
    console.error('POST /api/admin/stripe', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stripe/vendeurs — gestionnaires ayant connecté Stripe et/ou PayPal
router.get('/vendeurs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id as gestionnaire_id, g.nom as gestionnaire_nom, g.email as gestionnaire_email,
              o.stripe_account_id, o.stripe_verifie,
              o.paypal_actif, o.paypal_email, o.paypal_client_id
       FROM options_gestionnaire o
       JOIN gestionnaires g ON g.id = o.gestionnaire_id
       WHERE o.stripe_account_id IS NOT NULL OR o.paypal_actif = TRUE
       ORDER BY g.nom ASC`
    );
    const vendeurs = result.rows.map(r => ({
      ...r,
      stripe_account_status: r.stripe_verifie ? 'active' : 'pending',
    }));
    res.json(vendeurs);
  } catch (err) {
    console.error('GET /api/admin/stripe/vendeurs', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/stripe/webhook/register — crée l'endpoint webhook directement sur Stripe
// et retourne le signing secret pour qu'il soit sauvegardé automatiquement côté front.
router.post('/webhook/register', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.body; // 'principal' | 'connect'
    const configResult = await pool.query('SELECT * FROM configuration_stripe_admin WHERE id = 1');
    const config = configResult.rows[0] || {};
    const stripe = getStripe(config.sandbox, config);

    const baseUrl = process.env.BACKEND_URL || 'https://www.e-vendstudio.ca';
    const endpointUrl = `${baseUrl}/api/webhooks/paiements-connect`;

    const evenements = type === 'connect'
      ? ['account.updated', 'account.application.deauthorized', 'payout.paid', 'payout.failed']
      : ['payment_intent.succeeded', 'charge.refunded', 'charge.dispute.created', 'invoice.payment_succeeded', 'invoice.payment_failed', 'customer.subscription.deleted'];

    const webhook = await stripe.webhookEndpoints.create({
      url: endpointUrl,
      enabled_events: evenements,
      connect: type === 'connect', // true = écoute les événements sur les comptes connectés
    });

    res.json({ webhook_id: webhook.id, signing_secret: webhook.secret, events: webhook.enabled_events });
  } catch (err) {
    console.error('POST /api/admin/stripe/webhook/register', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;