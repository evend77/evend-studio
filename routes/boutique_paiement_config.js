// CHEMIN : routes/boutique_paiement_config.js
// e-Vend Studio — Configuration des paiements du gestionnaire (templates boutique, solo).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/paiement
//   GET    /                       → état (clés secrètes JAMAIS en clair, seulement masquées)
//   PUT    /                       → sauvegarder (clés secrètes chiffrées) et activer/désactiver Stripe / PayPal
//   POST   /stripe/tester          → tester la clé Stripe du mode actuel
//   POST   /stripe/webhook         → créer le webhook sur le Stripe du gestionnaire
//   POST   /paypal/tester          → tester les clés PayPal du mode actuel
//   POST   /paypal/webhook         → créer le webhook sur le PayPal du gestionnaire
//   POST   /deconnecter            → { fournisseur: 'stripe' | 'paypal' } : retire les clés et les webhooks
// Argent : directement sur le compte du gestionnaire. Studio ne touche à rien et ne prend aucune commission.

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { chiffrer } = require('../src/utils/chiffrement');
const P = require('../services/boutique_paiement');

const router = express.Router();

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

class Refus extends Error { constructor(message, status) { super(message); this.status = status || 400; } }
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Refus) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_paiement_config]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const ENVS = ['dev', 'prod'];
const DEVISES = ['CAD', 'USD'];
const EVENEMENTS_STRIPE = [
  'checkout.session.completed', 'checkout.session.expired',
  'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed',
  'charge.refunded', 'charge.dispute.created',
];
const EVENEMENTS_PAYPAL = ['CHECKOUT.ORDER.APPROVED', 'PAYMENT.CAPTURE.COMPLETED', 'PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.REFUNDED'];

const PREFIXES = {
  stripe_dev_publish_key: ['pk_test_'], stripe_prod_publish_key: ['pk_live_'],
  stripe_dev_secret_key: ['sk_test_', 'rk_test_'], stripe_prod_secret_key: ['sk_live_', 'rk_live_'],
};

function baseUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
  return `${proto}://${host}`;
}

const texte = (v, max) => {
  if (v === null) return '';
  if (typeof v !== 'string') throw new Refus('Valeur invalide');
  const t = v.trim();
  if (t.length > (max || 300)) throw new Refus('Valeur trop longue');
  return t;
};

function masque(valeurChiffree, longueurDebut) {
  const cle = P.lire(valeurChiffree);
  if (!cle) return null;
  return `${cle.slice(0, longueurDebut)}••••${cle.slice(-4)}`;
}

const stripePret = (c, env) => !!(c[`stripe_${env}_secret_key`] && c[`stripe_${env}_publish_key`] && c[`stripe_${env}_webhook_secret`]);
const paypalPret = (c, env) => !!(c[`paypal_${env}_client_id`] && c[`paypal_${env}_secret`] && c[`paypal_${env}_webhook_id`]);

async function charger(gid) {
  await pool.query('INSERT INTO boutique_paiement_config (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING', [gid]);
  return (await pool.query('SELECT * FROM boutique_paiement_config WHERE gestionnaire_id = $1', [gid])).rows[0];
}

function vue(c, req) {
  const base = baseUrl(req);
  const sec = (env) => ({
    publish_key: c[`stripe_${env}_publish_key`] || '',
    secret_masque: masque(c[`stripe_${env}_secret_key`], 8),
    webhook: !!c[`stripe_${env}_webhook_secret`],
    pret: stripePret(c, env),
  });
  const pp = (env) => ({
    client_id: c[`paypal_${env}_client_id`] || '',
    secret_masque: masque(c[`paypal_${env}_secret`], 0),
    webhook: !!c[`paypal_${env}_webhook_id`],
    pret: paypalPret(c, env),
  });
  return {
    sandbox: c.sandbox !== false,
    devise: c.devise || 'CAD',
    stripe: { actif: !!c.stripe_actif, dev: sec('dev'), prod: sec('prod'), webhook_url: `${base}/api/webhooks/boutique-stripe/${c.gestionnaire_id}` },
    paypal: { actif: !!c.paypal_actif, dev: pp('dev'), prod: pp('prod'), webhook_url: `${base}/api/webhooks/boutique-paypal/${c.gestionnaire_id}` },
  };
}

// ─── GET / ────────────────────────────────────────────────────────────────────
router.get('/', h(async (req, res) => {
  res.json(vue(await charger(req.gid), req));
}));

// ─── PUT / ────────────────────────────────────────────────────────────────────
router.put('/', h(async (req, res) => {
  const b = req.body || {};
  const c = await charger(req.gid);
  const m = { ...c };   // état final voulu ; vérifié en entier avant d'écrire quoi que ce soit

  if (b.sandbox !== undefined) { if (typeof b.sandbox !== 'boolean') throw new Refus('Mode invalide'); m.sandbox = b.sandbox; }
  if (b.devise !== undefined) {
    if (!DEVISES.includes(b.devise)) throw new Refus('Devise invalide');
    m.devise = b.devise;
  }
  if (b.stripe_actif !== undefined) { if (typeof b.stripe_actif !== 'boolean') throw new Refus('Valeur invalide'); m.stripe_actif = b.stripe_actif; }
  if (b.paypal_actif !== undefined) { if (typeof b.paypal_actif !== 'boolean') throw new Refus('Valeur invalide'); m.paypal_actif = b.paypal_actif; }

  const resetStripe = [];
  const resetPaypal = [];

  // Clés Stripe (préfixe vérifié ; clé secrète vide = inchangée)
  for (const champ of Object.keys(PREFIXES)) {
    if (b[champ] === undefined) continue;
    const v = texte(b[champ]);
    const env = champ.includes('_dev_') ? 'dev' : 'prod';
    const secret = champ.endsWith('secret_key');
    if (secret && !v) continue;
    if (v && !PREFIXES[champ].some((p) => v.startsWith(p))) throw new Refus(`Cette clé doit commencer par ${PREFIXES[champ][0]}`);
    m[champ] = v ? (secret ? chiffrer(v) : v) : null;
    if (secret) resetStripe.push(env);
  }
  // Identifiants PayPal (client ID visible ; secret chiffré, vide = inchangé)
  for (const env of ENVS) {
    if (b[`paypal_${env}_client_id`] !== undefined) {
      const v = texte(b[`paypal_${env}_client_id`]);
      if (v !== (c[`paypal_${env}_client_id`] || '')) resetPaypal.push(env);
      m[`paypal_${env}_client_id`] = v || null;
    }
    if (b[`paypal_${env}_secret`] !== undefined) {
      const v = texte(b[`paypal_${env}_secret`]);
      if (v) { m[`paypal_${env}_secret`] = chiffrer(v); resetPaypal.push(env); }
    }
  }
  // Nouvelle clé = possiblement un autre compte : l'ancien webhook n'est plus valide
  for (const env of resetStripe) { m[`stripe_${env}_webhook_id`] = null; m[`stripe_${env}_webhook_secret`] = null; }
  for (const env of resetPaypal) { m[`paypal_${env}_webhook_id`] = null; }

  // Activation : seulement si tout est prêt pour le mode choisi
  const env = m.sandbox === false ? 'prod' : 'dev';
  const mode = env === 'dev' ? 'test' : 'production';
  if (m.stripe_actif && !stripePret(m, env)) {
    throw new Refus(`Pour activer Stripe en mode ${mode}, enregistrez votre clé publique et votre clé secrète, puis créez le webhook.`);
  }
  if (m.paypal_actif && !paypalPret(m, env)) {
    throw new Refus(`Pour activer PayPal en mode ${mode}, enregistrez votre Client ID et votre clé secrète, puis créez le webhook.`);
  }

  const colonnes = [
    'sandbox', 'devise', 'stripe_actif', 'paypal_actif',
    'stripe_dev_publish_key', 'stripe_dev_secret_key', 'stripe_dev_webhook_id', 'stripe_dev_webhook_secret',
    'stripe_prod_publish_key', 'stripe_prod_secret_key', 'stripe_prod_webhook_id', 'stripe_prod_webhook_secret',
    'paypal_dev_client_id', 'paypal_dev_secret', 'paypal_dev_webhook_id',
    'paypal_prod_client_id', 'paypal_prod_secret', 'paypal_prod_webhook_id',
  ];
  const vals = colonnes.map((k) => (m[k] === undefined ? null : m[k]));
  vals.push(req.gid);
  await pool.query(
    `UPDATE boutique_paiement_config SET ${colonnes.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = NOW() WHERE gestionnaire_id = $${vals.length}`,
    vals
  );
  res.json(vue(await charger(req.gid), req));
}));

// ─── Stripe : tester ──────────────────────────────────────────────────────────
router.post('/stripe/tester', h(async (req, res) => {
  const c = await charger(req.gid);
  const env = P.envDe(c);
  const stripe = P.clientStripe(c, env);
  if (!stripe) throw new Refus('Aucune clé secrète Stripe enregistrée pour ce mode.');
  let compte;
  try { compte = await stripe.accounts.retrieve(); }
  catch (e) { throw new Refus(`Stripe refuse la clé : ${e.message}`); }
  res.json({
    ok: true, account_id: compte.id, pays: compte.country || null,
    nom: (compte.business_profile && compte.business_profile.name) || (compte.settings && compte.settings.dashboard && compte.settings.dashboard.display_name) || null,
    paiements_actifs: !!compte.charges_enabled,
  });
}));

// ─── Stripe : créer le webhook ────────────────────────────────────────────────
router.post('/stripe/webhook', h(async (req, res) => {
  const c = await charger(req.gid);
  const env = P.envDe(c);
  const stripe = P.clientStripe(c, env);
  if (!stripe) throw new Refus("Enregistrez et sauvegardez d'abord votre clé secrète Stripe.");
  const url = `${baseUrl(req)}/api/webhooks/boutique-stripe/${req.gid}`;
  if (!/^https:\/\//.test(url)) throw new Refus("Stripe exige une adresse https publique : le webhook ne peut pas être créé depuis un poste local.");

  // Un seul webhook par mode : on retire l'ancien chez Stripe (si possible) avant d'en créer un nouveau
  const ancien = c[`stripe_${env}_webhook_id`];
  if (ancien) { try { await stripe.webhookEndpoints.del(ancien); } catch (e) { /* déjà supprimé */ } }

  let endpoint;
  try {
    endpoint = await stripe.webhookEndpoints.create({ url, enabled_events: EVENEMENTS_STRIPE, description: 'e-Vend Studio — commandes de ma boutique' });
  } catch (e) { throw new Refus(`Stripe a refusé la création du webhook : ${e.message}`); }

  await pool.query(
    `UPDATE boutique_paiement_config SET stripe_${env}_webhook_id = $1, stripe_${env}_webhook_secret = $2, updated_at = NOW() WHERE gestionnaire_id = $3`,
    [endpoint.id, chiffrer(endpoint.secret), req.gid]
  );
  res.json({ ok: true, webhook_id: endpoint.id, evenements: EVENEMENTS_STRIPE });
}));

// ─── PayPal : tester ──────────────────────────────────────────────────────────
router.post('/paypal/tester', h(async (req, res) => {
  const c = await charger(req.gid);
  const env = P.envDe(c);
  const secret = P.lire(c[`paypal_${env}_secret`]);
  if (!c[`paypal_${env}_client_id`] || !secret) throw new Refus('Aucune clé PayPal enregistrée pour ce mode.');
  try { await P.jetonPaypal(c[`paypal_${env}_client_id`], secret, env); }
  catch (e) { throw new Refus(`PayPal refuse les clés : ${e.message}`); }
  res.json({ ok: true });
}));

// ─── PayPal : créer le webhook ────────────────────────────────────────────────
router.post('/paypal/webhook', h(async (req, res) => {
  const c = await charger(req.gid);
  const env = P.envDe(c);
  if (!c[`paypal_${env}_client_id`] || !c[`paypal_${env}_secret`]) throw new Refus('Enregistrez et sauvegardez d\'abord vos clés PayPal.');
  const url = `${baseUrl(req)}/api/webhooks/boutique-paypal/${req.gid}`;
  if (!/^https:\/\//.test(url)) throw new Refus("PayPal exige une adresse https publique : le webhook ne peut pas être créé depuis un poste local.");

  const ancien = c[`paypal_${env}_webhook_id`];
  if (ancien) { try { await P.appelPaypal(c, env, 'DELETE', `/v1/notifications/webhooks/${encodeURIComponent(ancien)}`); } catch (e) { /* déjà supprimé */ } }

  let id = null;
  try {
    const r = await P.appelPaypal(c, env, 'POST', '/v1/notifications/webhooks', { url, event_types: EVENEMENTS_PAYPAL.map((name) => ({ name })) });
    if (r.status === 201 && r.data && r.data.id) id = r.data.id;
    else if (r.status === 400 || r.status === 422) {
      // Cette adresse existe déjà chez PayPal : on la reprend
      const l = await P.appelPaypal(c, env, 'GET', '/v1/notifications/webhooks');
      const trouve = l.data && Array.isArray(l.data.webhooks) ? l.data.webhooks.find((w) => w.url === url) : null;
      if (trouve) id = trouve.id;
      else throw new Refus(`PayPal a refusé la création du webhook : ${(r.data && (r.data.message || r.data.name)) || r.status}`);
    } else throw new Refus(`PayPal a refusé la création du webhook : ${(r.data && (r.data.message || r.data.name)) || r.status}`);
  } catch (e) {
    if (e instanceof Refus) throw e;
    throw new Refus(`PayPal a refusé la création du webhook : ${e.message}`);
  }

  await pool.query(`UPDATE boutique_paiement_config SET paypal_${env}_webhook_id = $1, updated_at = NOW() WHERE gestionnaire_id = $2`, [id, req.gid]);
  res.json({ ok: true, webhook_id: id, evenements: EVENEMENTS_PAYPAL });
}));

// ─── Déconnecter Stripe ou PayPal ─────────────────────────────────────────────
router.post('/deconnecter', h(async (req, res) => {
  const f = req.body && req.body.fournisseur;
  if (!['stripe', 'paypal'].includes(f)) throw new Refus('Fournisseur invalide');
  const c = await charger(req.gid);

  // Retrait des webhooks chez le fournisseur (au mieux : si ça échoue, on retire quand même les clés ici)
  for (const env of ENVS) {
    try {
      if (f === 'stripe' && c[`stripe_${env}_webhook_id`]) {
        const s = P.clientStripe(c, env);
        if (s) await s.webhookEndpoints.del(c[`stripe_${env}_webhook_id`]);
      }
      if (f === 'paypal' && c[`paypal_${env}_webhook_id`]) {
        await P.appelPaypal(c, env, 'DELETE', `/v1/notifications/webhooks/${encodeURIComponent(c[`paypal_${env}_webhook_id`])}`);
      }
    } catch (e) { /* tant pis */ }
  }
  const cols = f === 'stripe'
    ? ['stripe_dev_publish_key', 'stripe_dev_secret_key', 'stripe_dev_webhook_id', 'stripe_dev_webhook_secret',
       'stripe_prod_publish_key', 'stripe_prod_secret_key', 'stripe_prod_webhook_id', 'stripe_prod_webhook_secret']
    : ['paypal_dev_client_id', 'paypal_dev_secret', 'paypal_dev_webhook_id', 'paypal_prod_client_id', 'paypal_prod_secret', 'paypal_prod_webhook_id'];
  await pool.query(
    `UPDATE boutique_paiement_config SET ${cols.map((k) => `${k} = NULL`).join(', ')}, ${f}_actif = FALSE, updated_at = NOW() WHERE gestionnaire_id = $1`,
    [req.gid]
  );
  res.json(vue(await charger(req.gid), req));
}));

module.exports = router;