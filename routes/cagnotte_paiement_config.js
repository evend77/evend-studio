// CHEMIN : routes/cagnotte_paiement_config.js
// e-Vend Studio — Cagnotte : le gestionnaire branche SON Stripe et/ou SON PayPal pour recevoir les dons.
// Monté sur : /api/gestionnaire/cagnotte-paiement
//   GET  /                   → configuration (clés secrètes JAMAIS en clair, seulement masquées)
//   POST /                   → enregistrer (clés secrètes chiffrées)
//   POST /tester             → { fournisseur: 'stripe'|'paypal' } → teste les clés du mode courant
//   POST /webhook/register   → { fournisseur } → crée le webhook chez Stripe / PayPal automatiquement

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { chiffrer } = require('../src/utils/chiffrement');
const schema = require('../services/cagnotte_schema');
const paiement = require('../services/cagnotte_paiement');

const router = express.Router();
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  next();
});

const texte = (v, n = 300) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const ENVS = ['dev', 'prod'];

function baseUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
  return `${proto}://${host}`;
}
function masquer(v) {
  const c = paiement.lire(v);
  return c ? `${c.slice(0, 8)}••••${c.slice(-4)}` : null;
}
async function charger(gid) {
  await schema.pret();
  await pool.query('INSERT INTO cagnotte_paiement_config (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING', [gid]);
  return paiement.config(gid);
}

router.get('/', async (req, res) => {
  try {
    const gid = req.user.id;
    const cfg = await charger(gid);
    const base = baseUrl(req);
    const sortie = {
      sandbox: cfg.sandbox, devise: cfg.devise, stripe_actif: cfg.stripe_actif, paypal_actif: cfg.paypal_actif,
      modes: paiement.modesDisponibles(cfg),
      webhook_urls: { stripe: `${base}/api/webhooks/cagnotte-stripe/${gid}`, paypal: `${base}/api/webhooks/cagnotte-paypal/${gid}` },
    };
    for (const e of ENVS) {
      sortie[`stripe_${e}_publish_key`] = cfg[`stripe_${e}_publish_key`] || '';
      sortie[`stripe_${e}_secret_key_masque`] = masquer(cfg[`stripe_${e}_secret_key`]);
      sortie[`stripe_${e}_webhook`] = !!(cfg[`stripe_${e}_webhook_id`] && cfg[`stripe_${e}_webhook_secret`]);
      sortie[`paypal_${e}_client_id`] = cfg[`paypal_${e}_client_id`] || '';
      sortie[`paypal_${e}_secret_masque`] = masquer(cfg[`paypal_${e}_secret`]);
      sortie[`paypal_${e}_webhook`] = !!cfg[`paypal_${e}_webhook_id`];
    }
    res.json(sortie);
  } catch (e) { console.error('❌ GET cagnotte-paiement :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/', async (req, res) => {
  try {
    const gid = req.user.id;
    const b = req.body || {};
    const cfg = await charger(gid);
    const sets = [], vals = [];
    const ajouter = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };

    if (typeof b.devise === 'string') { const d = b.devise.toUpperCase(); if (!['CAD', 'USD'].includes(d)) return res.status(400).json({ error: 'Devise non supportée (CAD ou USD).' }); ajouter('devise', d); }
    if (typeof b.stripe_actif === 'boolean') ajouter('stripe_actif', b.stripe_actif);
    if (typeof b.paypal_actif === 'boolean') ajouter('paypal_actif', b.paypal_actif);

    for (const e of ENVS) {
      const pub = texte(b[`stripe_${e}_publish_key`]); if (b[`stripe_${e}_publish_key`] !== undefined) ajouter(`stripe_${e}_publish_key`, pub || null);
      const sk = texte(b[`stripe_${e}_secret_key`], 400);
      if (sk) {
        if (!/^(sk|rk)_(test|live)_/.test(sk)) return res.status(400).json({ error: 'Clé secrète Stripe invalide (elle commence par sk_test_ ou sk_live_).' });
        if ((e === 'dev') !== sk.includes('_test_')) return res.status(400).json({ error: e === 'dev' ? 'La clé du mode test doit commencer par sk_test_.' : 'La clé de production doit commencer par sk_live_.' });
        ajouter(`stripe_${e}_secret_key`, chiffrer(sk));
        ajouter(`stripe_${e}_webhook_id`, null); ajouter(`stripe_${e}_webhook_secret`, null);   // nouvelle clé → le webhook est à recréer
      }
      const cid = texte(b[`paypal_${e}_client_id`], 200); if (b[`paypal_${e}_client_id`] !== undefined) ajouter(`paypal_${e}_client_id`, cid || null);
      const ps = texte(b[`paypal_${e}_secret`], 400); if (ps) { ajouter(`paypal_${e}_secret`, chiffrer(ps)); ajouter(`paypal_${e}_webhook_id`, null); }
    }
    if (typeof b.sandbox === 'boolean') {
      if (b.sandbox === false) {
        const aProd = !!(cfg.stripe_prod_secret_key || texte(b.stripe_prod_secret_key)) || !!(cfg.paypal_prod_secret || texte(b.paypal_prod_secret));
        if (!aProd) return res.status(400).json({ error: "Enregistrez d'abord vos clés de production avant de quitter le mode test." });
      }
      ajouter('sandbox', b.sandbox);
    }
    if (sets.length) {
      vals.push(gid);
      await pool.query(`UPDATE cagnotte_paiement_config SET ${sets.join(', ')}, updated_at = NOW() WHERE gestionnaire_id = $${vals.length}`, vals);
    }
    res.json({ success: true });
  } catch (e) { console.error('❌ POST cagnotte-paiement :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/tester', async (req, res) => {
  try {
    const cfg = await charger(req.user.id);
    const env = paiement.envDe(cfg);
    if (req.body && req.body.fournisseur === 'paypal') {
      const id = cfg[`paypal_${env}_client_id`], sec = paiement.lire(cfg[`paypal_${env}_secret`]);
      if (!id || !sec) return res.json({ ok: false, message: `Clés PayPal du mode ${env === 'dev' ? 'test' : 'production'} manquantes.` });
      try { await paiement.jetonPaypal(id, sec, env); return res.json({ ok: true, message: 'PayPal : connexion réussie ✅' }); }
      catch (e) { return res.json({ ok: false, message: `PayPal : ${e.message}` }); }
    }
    const stripe = paiement.clientStripe(cfg, env);
    if (!stripe) return res.json({ ok: false, message: `Clé Stripe du mode ${env === 'dev' ? 'test' : 'production'} manquante.` });
    try { await stripe.balance.retrieve(); return res.json({ ok: true, message: 'Stripe : connexion réussie ✅' }); }
    catch (e) { return res.json({ ok: false, message: `Stripe : ${e.message}` }); }
  } catch (e) { console.error('❌ tester cagnotte-paiement :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/webhook/register', async (req, res) => {
  try {
    const gid = req.user.id;
    const cfg = await charger(gid);
    const env = paiement.envDe(cfg);
    const base = baseUrl(req);
    if (!base.startsWith('https://')) return res.json({ ok: false, message: 'Le webhook exige une adresse https (impossible en local).' });

    if (req.body && req.body.fournisseur === 'paypal') {
      const url = `${base}/api/webhooks/cagnotte-paypal/${gid}`;
      const r = await paiement.appelPaypal(cfg, env, 'POST', '/v1/notifications/webhooks', { url, event_types: [{ name: 'PAYMENT.CAPTURE.COMPLETED' }, { name: 'PAYMENT.CAPTURE.DENIED' }, { name: 'CHECKOUT.ORDER.APPROVED' }] });
      let id = r.data && r.data.id;
      if (!id && r.data && r.data.name === 'WEBHOOK_URL_ALREADY_EXISTS') {   // déjà créé : on le retrouve
        const l = await paiement.appelPaypal(cfg, env, 'GET', '/v1/notifications/webhooks');
        const w = ((l.data && l.data.webhooks) || []).find((x) => x.url === url); id = w && w.id;
      }
      if (!id) return res.json({ ok: false, message: `PayPal a refusé la création du webhook (${(r.data && (r.data.message || r.data.name)) || r.status}).` });
      await pool.query(`UPDATE cagnotte_paiement_config SET paypal_${env}_webhook_id = $1, updated_at = NOW() WHERE gestionnaire_id = $2`, [id, gid]);
      return res.json({ ok: true, message: 'Webhook PayPal créé ✅' });
    }

    const stripe = paiement.clientStripe(cfg, env);
    if (!stripe) return res.json({ ok: false, message: 'Enregistrez et testez votre clé Stripe avant de créer le webhook.' });
    const ancien = cfg[`stripe_${env}_webhook_id`];
    if (ancien) { try { await stripe.webhookEndpoints.del(ancien); } catch (e) { /* déjà supprimé */ } }
    const w = await stripe.webhookEndpoints.create({
      url: `${base}/api/webhooks/cagnotte-stripe/${gid}`,
      enabled_events: ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'],
      description: 'e-Vend Studio — Cagnotte (dons)',
    });
    await pool.query(`UPDATE cagnotte_paiement_config SET stripe_${env}_webhook_id = $1, stripe_${env}_webhook_secret = $2, updated_at = NOW() WHERE gestionnaire_id = $3`, [w.id, chiffrer(w.secret), gid]);
    res.json({ ok: true, message: 'Webhook Stripe créé ✅' });
  } catch (e) {
    console.error('❌ webhook/register cagnotte :', e.message);
    res.json({ ok: false, message: `Création du webhook impossible : ${e.message}` });
  }
});

module.exports = router;