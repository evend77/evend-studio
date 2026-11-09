// CHEMIN : routes/gestionnaire_ebay.js
// Clés eBay « développeur » du GESTIONNAIRE (add-on « Connecteur eBay »).
// Monté sur : /api/gestionnaire/ebay
//   GET     /          → configuration (secrets JAMAIS en clair, seulement masqués)
//   POST    /          → enregistrer (champ vide = inchangé ; secrets chiffrés)
//   POST    /tester    → vérifier l'ID client + le secret auprès d'eBay
//   DELETE  /          → effacer les clés

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');
const addons = require('../services/studio_addons');

const router = express.Router();
const CODE_ADDON = 'connecteur_ebay';
// L'adresse de retour d'eBay doit être FIXE : toujours le domaine principal de Studio (jamais le domaine d'une boutique).
const BASE_PUBLIQUE = (process.env.PUBLIC_BASE_URL || 'https://e-vendstudio.ca').replace(/\/+$/, '');
const URL_ACCEPTEE = `${BASE_PUBLIQUE}/api/ebay-connexion/callback`;
const URL_REFUSEE = `${BASE_PUBLIQUE}/api/ebay-connexion/refus`;

router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  next();
});
router.use(async (req, res, next) => {
  try {
    if (!(await addons.addonActifRapide(req.user.id, CODE_ADDON, pool))) {
      return res.status(403).json({ error: "L'add-on « Connecteur eBay » n'est pas activé pour votre marketplace." });
    }
    next();
  } catch (e) {
    console.error('[gestionnaire_ebay] add-on', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const lire = (v) => { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } };
const masquer = (v) => { const c = lire(v); return c ? `${c.slice(0, 6)}••••${c.slice(-4)}` : null; };
const texte = (v) => (typeof v === 'string' ? v.trim() : '');

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now); compteurs.set(cle, liste); return true;
}

async function charger(gid) {
  await pool.query('INSERT INTO gestionnaire_ebay_config (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING', [gid]);
  return (await pool.query('SELECT * FROM gestionnaire_ebay_config WHERE gestionnaire_id = $1', [gid])).rows[0];
}

// Les clés de test (sandbox) et de production ne se mélangent pas : eBay les reconnaît à leur contenu.
function erreurEnvironnement(env, clientId) {
  if (!clientId) return null;
  if (env === 'production' && /-SBX-/i.test(clientId)) return "Cet ID client est une clé de TEST (sandbox). Choisissez l'environnement « Test » ou utilisez votre clé de production.";
  if (env === 'sandbox' && /-PRD-/i.test(clientId)) return "Cet ID client est une clé de PRODUCTION. Choisissez l'environnement « Production » ou utilisez votre clé de test.";
  return null;
}

const SANS_ESPACE = /^\S{8,200}$/;

// ─── GET / ────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cfg = await charger(req.user.id);
    res.json({
      env: cfg.env,
      client_id_masque: masquer(cfg.client_id_chiffre),
      dev_id_masque: masquer(cfg.dev_id_chiffre),
      client_secret_masque: masquer(cfg.client_secret_chiffre),
      runame: cfg.runame || '',
      configure: !!(cfg.client_id_chiffre && cfg.dev_id_chiffre && cfg.client_secret_chiffre && cfg.runame),
      verifie_le: cfg.verifie_le,
      url_acceptee: URL_ACCEPTEE,
      url_refusee: URL_REFUSEE,
    });
  } catch (e) {
    console.error('❌ GET /api/gestionnaire/ebay :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const gid = req.user.id;
    const b = req.body || {};
    const cfg = await charger(gid);
    const sets = [];
    const vals = [];
    const ajouter = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };

    let env = cfg.env;
    if (b.env !== undefined) {
      if (!['production', 'sandbox'].includes(b.env)) return res.status(400).json({ error: 'Environnement invalide' });
      env = b.env;
    }

    const clientId = texte(b.client_id);
    const devId = texte(b.dev_id);
    const secret = texte(b.client_secret);
    const runame = texte(b.runame);

    if (clientId) {
      if (!SANS_ESPACE.test(clientId)) return res.status(400).json({ error: "ID client invalide : copiez-le en entier, sans espace." });
      const e = erreurEnvironnement(env, clientId); if (e) return res.status(400).json({ error: e });
      ajouter('client_id_chiffre', chiffrer(clientId));
    } else if (b.env !== undefined && b.env !== cfg.env) {
      // Changer d'environnement sans redonner l'ID client : on vérifie celui déjà enregistré
      const e = erreurEnvironnement(env, lire(cfg.client_id_chiffre)); if (e) return res.status(400).json({ error: e });
    }
    if (devId) {
      if (!SANS_ESPACE.test(devId)) return res.status(400).json({ error: 'ID développeur invalide : copiez-le en entier, sans espace.' });
      ajouter('dev_id_chiffre', chiffrer(devId));
    }
    if (secret) {
      if (!SANS_ESPACE.test(secret)) return res.status(400).json({ error: 'Secret invalide : copiez-le en entier, sans espace.' });
      if (env === 'production' && /^SBX-/i.test(secret)) return res.status(400).json({ error: 'Ce secret est une clé de TEST (sandbox).' });
      if (env === 'sandbox' && /^PRD-/i.test(secret)) return res.status(400).json({ error: 'Ce secret est une clé de PRODUCTION.' });
      ajouter('client_secret_chiffre', chiffrer(secret));
    }
    if (b.runame !== undefined) {
      if (runame && !/^[A-Za-z0-9_.-]{5,150}$/.test(runame)) return res.status(400).json({ error: "Nom d'URL de redirection (RuName) invalide : copiez-le tel qu'eBay l'affiche, sans espace." });
      ajouter('runame', runame || null);
    }
    if (env !== cfg.env) ajouter('env', env);

    if (sets.length) {
      // Toute nouvelle clé ou tout changement d'environnement annule le dernier test réussi
      ajouter('verifie_le', null);
      vals.push(gid);
      await pool.query(`UPDATE gestionnaire_ebay_config SET ${sets.join(', ')}, updated_at = NOW() WHERE gestionnaire_id = $${vals.length}`, vals);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('❌ POST /api/gestionnaire/ebay :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POST /tester ─────────────────────────────────────────────────────────────
// Demande un jeton « application » à eBay : prouve que l'ID client et le secret sont valides et du bon environnement.
// (Ne vérifie PAS l'ID développeur ni le RuName : ceux-ci ne servent qu'à la connexion d'un compte eBay.)
router.post('/tester', async (req, res) => {
  try {
    const gid = req.user.id;
    if (!limite(`ebay-test-${gid}`, 6, 60 * 1000)) return res.status(429).json({ error: 'Trop d\'essais. Réessayez dans une minute.' });
    const cfg = await charger(gid);
    const clientId = lire(cfg.client_id_chiffre);
    const secret = lire(cfg.client_secret_chiffre);
    if (!clientId || !secret) return res.status(400).json({ error: "Enregistrez d'abord l'ID client et le secret." });

    const hote = cfg.env === 'sandbox' ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
    const ctrl = new AbortController();
    const delai = setTimeout(() => ctrl.abort(), 15000);
    let r;
    try {
      r = await fetch(`${hote}/identity/v1/oauth2/token`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' }),
        signal: ctrl.signal,
      });
    } catch (e) {
      return res.status(502).json({ error: "Impossible de joindre eBay pour l'instant. Réessayez dans un moment." });
    } finally { clearTimeout(delai); }

    if (r.ok) {
      await pool.query('UPDATE gestionnaire_ebay_config SET verifie_le = NOW() WHERE gestionnaire_id = $1', [gid]);
      return res.json({ ok: true, message: 'eBay a accepté votre ID client et votre secret.' });
    }
    const corps = await r.json().catch(() => ({}));
    const code = corps.error || '';
    let message = `eBay a refusé la connexion (code ${r.status}).`;
    if (code === 'invalid_client') message = "eBay a refusé l'ID client ou le secret. Vérifiez qu'ils viennent du même jeu de clés et de l'environnement choisi (Test ou Production).";
    else if (code === 'invalid_scope') message = "eBay a refusé la demande d'accès. Vérifiez que votre jeu de clés est bien activé.";
    res.status(400).json({ error: message });
  } catch (e) {
    console.error('❌ POST /api/gestionnaire/ebay/tester :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── DELETE / ─────────────────────────────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    await pool.query(
      `UPDATE gestionnaire_ebay_config SET client_id_chiffre = NULL, dev_id_chiffre = NULL, client_secret_chiffre = NULL, runame = NULL, verifie_le = NULL, updated_at = NOW() WHERE gestionnaire_id = $1`,
      [req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('❌ DELETE /api/gestionnaire/ebay :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;