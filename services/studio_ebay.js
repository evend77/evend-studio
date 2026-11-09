// CHEMIN : services/studio_ebay.js
// e-Vend Studio — Connecteur eBay : clés du gestionnaire, connexion OAuth d'un collaborateur, jetons (chiffrés).
// Adapté de routes/ebaySync.js (e-Vend), mais les clés eBay viennent de la BASE (gestionnaire_ebay_config), pas du .env :
// chaque marketplace a donc SA PROPRE limite d'appels eBay.

const crypto = require('crypto');
const pool = require('../db');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

// Mêmes permissions que le connecteur d'e-Vend (éprouvées avec l'API Trading et l'API REST).
const SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
].join(' ');

const HOTES = {
  production: { auth: 'https://auth.ebay.com/oauth2/authorize', api: 'https://api.ebay.com', identite: 'https://apiz.ebay.com' },
  sandbox: { auth: 'https://auth.sandbox.ebay.com/oauth2/authorize', api: 'https://api.sandbox.ebay.com', identite: 'https://apiz.sandbox.ebay.com' },
};

const DUREE_ETAT_MS = 15 * 60 * 1000;
const MARGE_JETON_MS = 5 * 60 * 1000;

class ErreurEbay extends Error {
  constructor(message, status, code) { super(message); this.status = status || 400; this.code = code || null; }
}

const lire = (v) => { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } };

// Clés complètes du gestionnaire (ou null s'il n'a pas terminé la configuration)
async function configGestionnaire(gid) {
  const r = await pool.query('SELECT * FROM gestionnaire_ebay_config WHERE gestionnaire_id = $1', [gid]);
  const c = r.rows[0];
  if (!c) return null;
  const clientId = lire(c.client_id_chiffre), secret = lire(c.client_secret_chiffre), devId = lire(c.dev_id_chiffre);
  if (!clientId || !secret || !devId || !c.runame) return null;
  return { env: c.env, clientId, secret, devId, runame: c.runame };
}

async function appelEbay(url, options) {
  const ctrl = new AbortController();
  const delai = setTimeout(() => ctrl.abort(), 15000);
  try { return await fetch(url, { ...options, signal: ctrl.signal }); }
  catch (e) { throw new ErreurEbay("Impossible de joindre eBay pour l'instant. Réessayez dans un moment.", 502); }
  finally { clearTimeout(delai); }
}

async function demanderJeton(cfg, params) {
  const r = await appelEbay(`${HOTES[cfg.env].api}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${cfg.clientId}:${cfg.secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErreurEbay(`eBay a refusé la demande (${j.error || r.status}).`, 400, j.error || null);
  if (!j.access_token) throw new ErreurEbay("Réponse inattendue d'eBay.", 502);
  return j;
}

// ─── États de connexion (anti-falsification, usage unique) ───────────────────
async function creerEtat(gid, cid, retourUrl) {
  await pool.query('DELETE FROM ebay_oauth_etats WHERE expire_le < NOW() OR collaborateur_id = $1', [cid]);
  const etat = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO ebay_oauth_etats (etat, gestionnaire_id, collaborateur_id, retour_url, expire_le) VALUES ($1,$2,$3,$4, NOW() + ($5 || ' milliseconds')::interval)`,
    [etat, gid, cid, retourUrl, String(DUREE_ETAT_MS)]);
  return etat;
}

// Lit ET détruit l'état (impossible de le rejouer). null si inconnu ou expiré.
async function consommerEtat(etat) {
  if (typeof etat !== 'string' || !/^[a-f0-9]{64}$/.test(etat)) return null;
  const r = await pool.query('DELETE FROM ebay_oauth_etats WHERE etat = $1 RETURNING *', [etat]);
  const e = r.rows[0];
  return e && new Date(e.expire_le).getTime() > Date.now() ? e : null;
}

function urlAutorisation(cfg, etat) {
  const p = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.runame, response_type: 'code', scope: SCOPES, state: etat });
  return `${HOTES[cfg.env].auth}?${p.toString()}`;
}

// Identité du compte eBay : facultative (si eBay ne l'accorde pas, la connexion reste valide)
async function identite(env, accessToken) {
  try {
    const r = await appelEbay(`${HOTES[env].identite}/commerce/identity/v1/user`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return {};
    const j = await r.json().catch(() => ({}));
    return { userId: j.userId || null, username: j.username || null };
  } catch (e) { return {}; }
}

// Échange le code eBay contre les jetons et enregistre la connexion du collaborateur.
async function connecterAvecCode(gid, cid, code) {
  const cfg = await configGestionnaire(gid);
  if (!cfg) throw new ErreurEbay("Votre gestionnaire n'a pas terminé la configuration eBay.", 409);
  if (typeof code !== 'string' || code.length < 10 || code.length > 4000) throw new ErreurEbay('Code eBay invalide.', 400);
  const j = await demanderJeton(cfg, { grant_type: 'authorization_code', code, redirect_uri: cfg.runame });
  if (!j.refresh_token) throw new ErreurEbay("eBay n'a pas fourni de jeton de renouvellement.", 502);
  const id = await identite(cfg.env, j.access_token);
  const expire = new Date(Date.now() + (Number(j.expires_in) || 7200) * 1000);
  const expireRefresh = j.refresh_token_expires_in ? new Date(Date.now() + Number(j.refresh_token_expires_in) * 1000) : null;
  await pool.query(
    `INSERT INTO ebay_connexions (gestionnaire_id, collaborateur_id, env, ebay_user_id, ebay_username, access_token_chiffre, refresh_token_chiffre, expires_at, refresh_expires_at, statut, message_erreur)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'connecte',NULL)
     ON CONFLICT (collaborateur_id) DO UPDATE SET gestionnaire_id = EXCLUDED.gestionnaire_id, env = EXCLUDED.env, ebay_user_id = EXCLUDED.ebay_user_id,
       ebay_username = EXCLUDED.ebay_username, access_token_chiffre = EXCLUDED.access_token_chiffre, refresh_token_chiffre = EXCLUDED.refresh_token_chiffre,
       expires_at = EXCLUDED.expires_at, refresh_expires_at = EXCLUDED.refresh_expires_at, statut = 'connecte', message_erreur = NULL, updated_at = NOW()`,
    [gid, cid, cfg.env, id.userId || null, id.username || null, chiffrer(j.access_token), chiffrer(j.refresh_token), expire, expireRefresh]);
  return { username: id.username || null };
}

// Jeton d'accès valide pour un collaborateur (renouvelé automatiquement). Un seul renouvellement à la fois par collaborateur.
const verrous = new Map();
function obtenirJeton(cid) {
  if (verrous.has(cid)) return verrous.get(cid);
  const p = obtenirJetonInterne(cid).finally(() => verrous.delete(cid));
  verrous.set(cid, p);
  return p;
}
async function obtenirJetonInterne(cid) {
  const r = await pool.query('SELECT * FROM ebay_connexions WHERE collaborateur_id = $1', [cid]);
  const c = r.rows[0];
  if (!c) throw new ErreurEbay("Aucun compte eBay n'est connecté.", 409, 'non_connecte');
  if (c.statut === 'reconnexion') throw new ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
  const acces = lire(c.access_token_chiffre);
  if (acces && c.expires_at && new Date(c.expires_at).getTime() > Date.now() + MARGE_JETON_MS) return acces;

  const refresh = lire(c.refresh_token_chiffre);
  const cfg = await configGestionnaire(c.gestionnaire_id);
  if (!refresh || !cfg || cfg.env !== c.env) {
    await pool.query(`UPDATE ebay_connexions SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE id = $1`, [c.id, "Les clés eBay de la marketplace ont changé : reconnectez votre compte."]);
    throw new ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
  }
  let j;
  try { j = await demanderJeton(cfg, { grant_type: 'refresh_token', refresh_token: refresh, scope: SCOPES }); }
  catch (e) {
    if (e instanceof ErreurEbay && e.code === 'invalid_grant') {
      await pool.query(`UPDATE ebay_connexions SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE id = $1`, [c.id, "L'autorisation eBay a expiré ou a été retirée : reconnectez votre compte."]);
      throw new ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
    }
    throw e;   // panne réseau ou refus passager : la connexion reste valide, on réessaiera
  }
  const expire = new Date(Date.now() + (Number(j.expires_in) || 7200) * 1000);
  await pool.query(
    `UPDATE ebay_connexions SET access_token_chiffre = $2, expires_at = $3,
            refresh_token_chiffre = COALESCE($4, refresh_token_chiffre), updated_at = NOW() WHERE id = $1`,
    [c.id, chiffrer(j.access_token), expire, j.refresh_token ? chiffrer(j.refresh_token) : null]);
  return j.access_token;
}

async function etat(gid, cid) {
  const cfg = await configGestionnaire(gid);
  const r = await pool.query('SELECT env, ebay_username, statut, message_erreur, created_at, updated_at FROM ebay_connexions WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid]);
  const c = r.rows[0];
  return {
    gestionnaire_configure: !!cfg,
    connexion: c ? { statut: c.statut, username: c.ebay_username, env: c.env, message: c.message_erreur, connecte_le: c.created_at } : null,
  };
}

async function deconnecter(gid, cid) {
  await pool.query('DELETE FROM ebay_connexions WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid]);
}

// Le gestionnaire a changé ou effacé ses clés : tous ses collaborateurs doivent se reconnecter.
async function marquerReconnexionGestionnaire(gid) {
  try {
    await pool.query(`UPDATE ebay_connexions SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE gestionnaire_id = $1`,
      [gid, 'Les clés eBay de la marketplace ont changé : reconnectez votre compte.']);
  } catch (e) { /* table pas encore créée (étape 2 non installée) */ }
}

module.exports = { ErreurEbay, SCOPES, HOTES, configGestionnaire, creerEtat, consommerEtat, urlAutorisation, connecterAvecCode, obtenirJeton, etat, deconnecter, marquerReconnexionGestionnaire };