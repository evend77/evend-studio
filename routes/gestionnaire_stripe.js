// CHEMIN : routes/gestionnaire_stripe.js
// Config Stripe Connect du GESTIONNAIRE (template multivendeur).
// Monté sur : /api/gestionnaire/stripe
//   GET    /                      → config (clés secrètes JAMAIS en clair, seulement masquées)
//   POST   /                      → sauvegarder (clés secrètes chiffrées)
//   POST   /tester                → tester la connexion Stripe + vérifier Connect
//   POST   /webhook/register      → créer le webhook sur le Stripe du gestionnaire ({ type: 'principal' | 'connect' })
//   GET    /collaborateurs        → collaborateurs qui ont lié leur compte Stripe

const express = require('express');
const Stripe = require('stripe');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const router = express.Router();

// ─── Sécurité : connecté + rôle gestionnaire, et on n'agit QUE sur son propre id ───
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') {
    return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  }
  next();
});

// ─── Utilitaires (inline) ─────────────────────────────────────────────────────
const TYPES_COMPTE = ['express', 'standard', 'custom'];

const EVENEMENTS = {
  principal: [
    'payment_intent.succeeded', 'payment_intent.payment_failed', 'checkout.session.completed',
    'charge.refunded', 'charge.updated', 'charge.dispute.created', 'charge.dispute.closed',
    'payout.paid', 'payout.failed',
  ],
  // Direct Charges : les paiements arrivent sur le compte du collaborateur → événements "Connect"
  connect: [
    'account.updated', 'account.application.deauthorized',
    'payment_intent.succeeded', 'payment_intent.payment_failed', 'checkout.session.completed',
    'charge.refunded', 'charge.updated', 'charge.dispute.created', 'charge.dispute.closed',
    'transfer.created', 'payout.paid', 'payout.failed',
  ],
};

function baseUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
  return `${proto}://${host}`;
}

function lireCle(valeurChiffree) {
  if (!valeurChiffree) return null;
  try { return dechiffrer(valeurChiffree) || null; } catch (e) { return null; }
}

function masquer(valeurChiffree) {
  const cle = lireCle(valeurChiffree);
  if (!cle) return null;
  return `${cle.slice(0, 8)}••••${cle.slice(-4)}`;
}

async function chargerConfig(gestionnaireId) {
  await pool.query(
    'INSERT INTO gestionnaire_stripe_config (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING',
    [gestionnaireId]
  );
  const r = await pool.query('SELECT * FROM gestionnaire_stripe_config WHERE gestionnaire_id = $1', [gestionnaireId]);
  return r.rows[0];
}

function clientStripe(cfg, env) {
  const cle = lireCle(env === 'dev' ? cfg.dev_secret_key : cfg.prod_secret_key);
  return cle ? Stripe(cle) : null;
}

const texte = (v) => (typeof v === 'string' ? v.trim().slice(0, 300) : '');

// ─── GET / ────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const gid = req.user.id;
    const cfg = await chargerConfig(gid);
    const env = cfg.sandbox ? 'dev' : 'prod';

    const wh = await pool.query(
      'SELECT env, type FROM gestionnaire_stripe_webhooks WHERE gestionnaire_id = $1', [gid]
    );
    const webhooks = { dev: { principal: false, connect: false }, prod: { principal: false, connect: false } };
    for (const w of wh.rows) webhooks[w.env][w.type] = true;

    const base = baseUrl(req);
    res.json({
      sandbox: cfg.sandbox,
      dev_publish_key: cfg.dev_publish_key || '',
      prod_publish_key: cfg.prod_publish_key || '',
      dev_secret_key_masque: masquer(cfg.dev_secret_key),
      prod_secret_key_masque: masquer(cfg.prod_secret_key),
      dev_client_id: cfg.dev_client_id || '',
      prod_client_id: cfg.prod_client_id || '',
      webhooks,
      webhook_urls: {
        principal: `${base}/api/webhooks/gestionnaire-stripe/${gid}/principal`,
        connect: `${base}/api/webhooks/gestionnaire-stripe/${gid}/connect`,
      },
      connect_actif: env === 'dev' ? cfg.connect_actif_dev : cfg.connect_actif_prod,
      account_type: cfg.account_type,
      parametres: cfg.parametres || {},
    });
  } catch (e) {
    console.error('❌ GET /api/gestionnaire/stripe :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const gid = req.user.id;
    const b = req.body || {};
    const cfg = await chargerConfig(gid);

    const sets = [];
    const vals = [];
    const ajouter = (colonne, valeur, cast = '') => { vals.push(valeur); sets.push(`${colonne} = $${vals.length}${cast}`); };

    // Mode test / production
    if (typeof b.sandbox === 'boolean') {
      const aCleProd = !!cfg.prod_secret_key || !!texte(b.prod_secret_key);
      if (b.sandbox === false && !aCleProd) {
        return res.status(400).json({ error: "Enregistre d'abord ta clé secrète de production avant de quitter le mode test." });
      }
      ajouter('sandbox', b.sandbox);
    }

    // Clés publiques (préfixe vérifié)
    for (const [champ, prefixe] of [['dev_publish_key', 'pk_test_'], ['prod_publish_key', 'pk_live_']]) {
      if (b[champ] !== undefined) {
        const v = texte(b[champ]);
        if (v && !v.startsWith(prefixe)) return res.status(400).json({ error: `La clé publique doit commencer par ${prefixe}` });
        ajouter(champ, v || null);
      }
    }

    // Clés secrètes : chiffrées, ignorées si vides (= inchangées)
    const envsChanges = [];
    for (const [champ, prefixes, env] of [
      ['dev_secret_key', ['sk_test_', 'rk_test_'], 'dev'],
      ['prod_secret_key', ['sk_live_', 'rk_live_'], 'prod'],
    ]) {
      const v = texte(b[champ]);
      if (!v) continue;
      if (!prefixes.some(p => v.startsWith(p))) {
        return res.status(400).json({ error: `La clé secrète doit commencer par ${prefixes[0]}` });
      }
      ajouter(champ, chiffrer(v));
      ajouter(`connect_actif_${env}`, false);
      ajouter(`${env}_account_id`, null);
      envsChanges.push(env);
    }

    // Client ID
    for (const champ of ['dev_client_id', 'prod_client_id']) {
      if (b[champ] !== undefined) ajouter(champ, texte(b[champ]) || null);
    }

    // Type de compte collaborateur
    if (b.account_type !== undefined) {
      if (!TYPES_COMPTE.includes(b.account_type)) return res.status(400).json({ error: 'Type de compte invalide' });
      ajouter('account_type', b.account_type);
    }

    // Réglages détaillés (fusionnés avec l'existant)
    if (b.parametres !== undefined) {
      if (!b.parametres || typeof b.parametres !== 'object' || Array.isArray(b.parametres)) {
        return res.status(400).json({ error: 'Paramètres invalides' });
      }
      const fusion = { ...(cfg.parametres || {}), ...b.parametres };
      const json = JSON.stringify(fusion);
      if (json.length > 50000) return res.status(400).json({ error: 'Paramètres trop volumineux' });
      ajouter('parametres', json, '::jsonb');
    }

    if (sets.length) {
      vals.push(gid);
      await pool.query(
        `UPDATE gestionnaire_stripe_config SET ${sets.join(', ')}, updated_at = NOW() WHERE gestionnaire_id = $${vals.length}`,
        vals
      );
    }

    // Nouvelle clé = autre compte Stripe possible → les anciens webhooks ne sont plus valides
    for (const env of envsChanges) {
      await pool.query('DELETE FROM gestionnaire_stripe_webhooks WHERE gestionnaire_id = $1 AND env = $2', [gid, env]);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('❌ POST /api/gestionnaire/stripe :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /tester ─────────────────────────────────────────────────────────────
router.post('/tester', async (req, res) => {
  try {
    const gid = req.user.id;
    const cfg = await chargerConfig(gid);
    const env = cfg.sandbox ? 'dev' : 'prod';
    const stripe = clientStripe(cfg, env);
    if (!stripe) return res.status(400).json({ error: 'Aucune clé secrète enregistrée pour ce mode.' });

    let compte;
    try {
      compte = await stripe.accounts.retrieve();
    } catch (e) {
      return res.status(400).json({ error: `Stripe refuse la clé : ${e.message}` });
    }

    // Connect activé ? (seules les plateformes Connect peuvent lister des comptes)
    let connectActif = false;
    try {
      await stripe.accounts.list({ limit: 1 });
      connectActif = true;
    } catch (e) {
      connectActif = false;
    }

    await pool.query(
      `UPDATE gestionnaire_stripe_config
          SET ${env}_account_id = $1, connect_actif_${env} = $2, updated_at = NOW()
        WHERE gestionnaire_id = $3`,
      [compte.id, connectActif, gid]
    );

    res.json({ ok: true, account_id: compte.id, connect_actif: connectActif });
  } catch (e) {
    console.error('❌ POST /api/gestionnaire/stripe/tester :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /webhook/register ───────────────────────────────────────────────────
router.post('/webhook/register', async (req, res) => {
  try {
    const gid = req.user.id;
    const type = req.body && req.body.type;
    if (!['principal', 'connect'].includes(type)) return res.status(400).json({ error: 'Type de webhook invalide' });

    const cfg = await chargerConfig(gid);
    const env = cfg.sandbox ? 'dev' : 'prod';
    const stripe = clientStripe(cfg, env);
    if (!stripe) return res.status(400).json({ error: 'Enregistre et sauvegarde d\'abord ta clé secrète.' });

    const url = `${baseUrl(req)}/api/webhooks/gestionnaire-stripe/${gid}/${type}`;

    // Un seul webhook par type : on retire l'ancien chez Stripe (si possible) avant d'en créer un nouveau
    const ancien = await pool.query(
      'SELECT stripe_webhook_id FROM gestionnaire_stripe_webhooks WHERE gestionnaire_id = $1 AND env = $2 AND type = $3',
      [gid, env, type]
    );
    if (ancien.rows[0]) {
      try { await stripe.webhookEndpoints.del(ancien.rows[0].stripe_webhook_id); } catch (e) { /* déjà supprimé */ }
    }

    const params = {
      url,
      enabled_events: EVENEMENTS[type],
      description: type === 'connect' ? 'Studio — comptes connectés (collaborateurs)' : 'Studio — votre compte',
    };
    if (type === 'connect') params.connect = true;

    let endpoint;
    try {
      endpoint = await stripe.webhookEndpoints.create(params);
    } catch (e) {
      return res.status(400).json({ error: `Stripe a refusé la création du webhook : ${e.message}` });
    }

    await pool.query(
      `INSERT INTO gestionnaire_stripe_webhooks (gestionnaire_id, env, type, stripe_webhook_id, signing_secret, url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (gestionnaire_id, env, type)
       DO UPDATE SET stripe_webhook_id = EXCLUDED.stripe_webhook_id,
                     signing_secret = EXCLUDED.signing_secret,
                     url = EXCLUDED.url,
                     updated_at = NOW()`,
      [gid, env, type, endpoint.id, chiffrer(endpoint.secret), url]
    );

    res.json({ ok: true, webhook_id: endpoint.id, events: EVENEMENTS[type] });
  } catch (e) {
    console.error('❌ POST /api/gestionnaire/stripe/webhook/register :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GET /collaborateurs ──────────────────────────────────────────────────────
router.get('/collaborateurs', async (req, res) => {
  try {
    const gid = req.user.id;
    const cfg = await chargerConfig(gid);
    const env = cfg.sandbox ? 'dev' : 'prod';
    const r = await pool.query(
      `SELECT cs.id,
              COALESCE(NULLIF(mc.nom_boutique, ''), mc.nom_responsable) AS nom,
              mc.email,
              cs.stripe_account_id,
              cs.account_type,
              cs.statut,
              cs.connected_at
         FROM collaborateurs_stripe cs
         JOIN marketplace_collaborateurs mc ON mc.id = cs.collaborateur_id
        WHERE cs.gestionnaire_id = $1 AND cs.env = $2
        ORDER BY cs.connected_at DESC`,
      [gid, env]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('❌ GET /api/gestionnaire/stripe/collaborateurs :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;