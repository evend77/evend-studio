// CHEMIN : services/studio_etsy.js
// e-Vend Studio — Connecteur Etsy : clés du gestionnaire, connexion OAuth 2.0 + PKCE d'un collaborateur, jetons (chiffrés).
// Adapté de routes/etsySync.js (e-Vend). Les clés Etsy viennent de la BASE (gestionnaire_etsy_config), pas du .env :
// chaque marketplace a donc SA PROPRE app Etsy et sa propre limite d'appels.

const crypto = require('crypto');
const pool = require('../db');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const API = 'https://openapi.etsy.com/v3/application';
const URL_AUTH = 'https://www.etsy.com/oauth/connect';
const URL_JETON = 'https://api.etsy.com/v3/public/oauth/token';
const SCOPES = 'listings_r shops_r';      // lecture seule : Studio ne modifie jamais rien sur Etsy
const DUREE_ETAT_MS = 15 * 60 * 1000;
const MARGE_JETON_MS = 5 * 60 * 1000;
const BASE_PUBLIQUE = (process.env.PUBLIC_BASE_URL || 'https://e-vendstudio.ca').replace(/\/+$/, '');
const URL_RETOUR = `${BASE_PUBLIQUE}/api/ebay-connexion/etsy-callback`;

class ErreurEtsy extends Error {
  constructor(message, status, code) { super(message); this.status = status || 400; this.code = code || null; }
}
class QuotaEtsy extends Error {
  constructor(retryAfterSec, m) { super(m || "Limite d'appels Etsy atteinte"); this.quota = true; this.retryAfterSec = retryAfterSec || null; }
}

const lire = (v) => { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } };

async function configGestionnaire(gid) {
  const r = await pool.query('SELECT * FROM gestionnaire_etsy_config WHERE gestionnaire_id = $1', [gid]);
  const c = r.rows[0];
  if (!c) return null;
  const keystring = lire(c.keystring_chiffre), secret = lire(c.secret_chiffre);
  if (!keystring || !secret) return null;
  return { keystring, secret, cleApi: `${keystring}:${secret}` };   // en-tête x-api-key = « keystring:secret »
}

async function appel(url, options) {
  const ctrl = new AbortController();
  const delai = setTimeout(() => ctrl.abort(), 20000);
  try { return await fetch(url, { ...options, signal: ctrl.signal }); }
  catch (e) { throw new ErreurEtsy("Impossible de joindre Etsy pour l'instant. Réessayez dans un moment.", 502); }
  finally { clearTimeout(delai); }
}

// GET sur l'API Etsy. Limite par seconde : on attend sur place ; limite du jour : QuotaEtsy (le travail se met en pause).
async function etsyGet(cfg, jeton, chemin, params) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  for (let essai = 1; ; essai++) {
    const r = await appel(`${API}${chemin}${qs}`, { headers: { 'x-api-key': cfg.cleApi, Authorization: `Bearer ${jeton}` } });
    if (r.status === 429) {
      const ra = parseInt(r.headers.get('retry-after'), 10);
      const sec = Number.isFinite(ra) && ra > 0 ? ra : null;
      if (sec && sec <= 10 && essai < 3) { await new Promise((ok) => setTimeout(ok, (sec + 1) * 1000)); continue; }
      throw new QuotaEtsy(sec);
    }
    if (r.status === 401) throw new ErreurEtsy('Reconnexion Etsy requise.', 409, 'reconnexion');
    if (r.status >= 500) throw new ErreurEtsy("Etsy est injoignable pour l'instant.", 502);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || `Erreur Etsy ${r.status}`); e.status = r.status; throw e; }
    return j;
  }
}

async function demanderJeton(cfg, params) {
  const r = await appel(URL_JETON, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'x-api-key': cfg.cleApi },
    body: new URLSearchParams({ client_id: cfg.keystring, ...params }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErreurEtsy(`Etsy a refusé la demande (${j.error || r.status}).`, 400, j.error || null);
  if (!j.access_token || !j.refresh_token) throw new ErreurEtsy("Réponse inattendue d'Etsy.", 502);
  return j;
}

// ─── États de connexion (anti-falsification + PKCE, usage unique) ─────────────
async function creerEtat(gid, cid, retourUrl) {
  await pool.query('DELETE FROM etsy_oauth_etats WHERE expire_le < NOW() OR collaborateur_id = $1', [cid]);
  const etat = crypto.randomBytes(32).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  await pool.query(
    `INSERT INTO etsy_oauth_etats (etat, gestionnaire_id, collaborateur_id, code_verifier, retour_url, expire_le) VALUES ($1,$2,$3,$4,$5, NOW() + ($6 || ' milliseconds')::interval)`,
    [etat, gid, cid, verifier, retourUrl, String(DUREE_ETAT_MS)]);
  return { etat, challenge: crypto.createHash('sha256').update(verifier).digest('base64url') };
}
async function consommerEtat(etat) {
  if (typeof etat !== 'string' || !/^[a-f0-9]{64}$/.test(etat)) return null;
  const r = await pool.query('DELETE FROM etsy_oauth_etats WHERE etat = $1 RETURNING *', [etat]);
  const e = r.rows[0];
  return e && new Date(e.expire_le).getTime() > Date.now() ? e : null;
}

function urlAutorisation(cfg, etat, challenge) {
  const p = new URLSearchParams({ response_type: 'code', client_id: cfg.keystring, redirect_uri: URL_RETOUR, scope: SCOPES, state: etat, code_challenge: challenge, code_challenge_method: 'S256' });
  return `${URL_AUTH}?${p.toString()}`;
}

// Échange le code Etsy contre les jetons et enregistre la connexion du collaborateur.
async function connecterAvecCode(gid, cid, code, verifier) {
  const cfg = await configGestionnaire(gid);
  if (!cfg) throw new ErreurEtsy("Votre gestionnaire n'a pas terminé la configuration Etsy.", 409);
  if (typeof code !== 'string' || code.length < 10 || code.length > 4000) throw new ErreurEtsy('Code Etsy invalide.', 400);
  const j = await demanderJeton(cfg, { grant_type: 'authorization_code', redirect_uri: URL_RETOUR, code, code_verifier: verifier });
  const userId = String(j.access_token).split('.')[0];      // les jetons Etsy sont préfixés par l'identifiant de l'utilisateur
  if (!/^\d+$/.test(userId)) throw new ErreurEtsy("Réponse inattendue d'Etsy.", 502);
  let shop;
  try { shop = await etsyGet(cfg, j.access_token, `/users/${userId}/shops`); }
  catch (e) { throw new ErreurEtsy("Impossible de lire votre boutique Etsy. Vérifiez que votre compte Etsy a une boutique active.", 400); }
  if (!shop || !shop.shop_id) throw new ErreurEtsy("Aucune boutique Etsy trouvée pour ce compte : il faut une boutique Etsy active.", 400);
  const expire = new Date(Date.now() + (Number(j.expires_in) || 3600) * 1000);
  await pool.query(
    `INSERT INTO etsy_connexions (gestionnaire_id, collaborateur_id, etsy_user_id, etsy_shop_id, etsy_shop_name, access_token_chiffre, refresh_token_chiffre, expires_at, statut, message_erreur)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'connecte',NULL)
     ON CONFLICT (collaborateur_id) DO UPDATE SET gestionnaire_id = EXCLUDED.gestionnaire_id, etsy_user_id = EXCLUDED.etsy_user_id, etsy_shop_id = EXCLUDED.etsy_shop_id,
       etsy_shop_name = EXCLUDED.etsy_shop_name, access_token_chiffre = EXCLUDED.access_token_chiffre, refresh_token_chiffre = EXCLUDED.refresh_token_chiffre,
       expires_at = EXCLUDED.expires_at, statut = 'connecte', message_erreur = NULL, updated_at = NOW()`,
    [gid, cid, userId, String(shop.shop_id), String(shop.shop_name || '').slice(0, 120) || null, chiffrer(j.access_token), chiffrer(j.refresh_token), expire]);
  return { boutique: shop.shop_name || null };
}

// Jeton d'accès valide (l'accès Etsy dure 1 h : renouvelé automatiquement). Un seul renouvellement à la fois par collaborateur.
const verrous = new Map();
function obtenirJeton(cid) {
  if (verrous.has(cid)) return verrous.get(cid);
  const p = obtenirJetonInterne(cid).finally(() => verrous.delete(cid));
  verrous.set(cid, p);
  return p;
}
async function marquerReconnexion(id, message) {
  await pool.query(`UPDATE etsy_connexions SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE id = $1`, [id, message]);
}
async function obtenirJetonInterne(cid) {
  const r = await pool.query('SELECT * FROM etsy_connexions WHERE collaborateur_id = $1', [cid]);
  const c = r.rows[0];
  if (!c) throw new ErreurEtsy("Aucun compte Etsy n'est connecté.", 409, 'non_connecte');
  if (c.statut === 'reconnexion') throw new ErreurEtsy('Reconnexion Etsy requise.', 409, 'reconnexion');
  const acces = lire(c.access_token_chiffre);
  if (acces && c.expires_at && new Date(c.expires_at).getTime() > Date.now() + MARGE_JETON_MS) return acces;

  const refresh = lire(c.refresh_token_chiffre);
  const cfg = await configGestionnaire(c.gestionnaire_id);
  if (!refresh || !cfg) {
    await marquerReconnexion(c.id, 'Les clés Etsy de la marketplace ont changé : reconnectez votre compte.');
    throw new ErreurEtsy('Reconnexion Etsy requise.', 409, 'reconnexion');
  }
  let j;
  try { j = await demanderJeton(cfg, { grant_type: 'refresh_token', refresh_token: refresh }); }
  catch (e) {
    if (e instanceof ErreurEtsy && /invalid_grant|invalid_token/.test(e.code || '')) {
      await marquerReconnexion(c.id, "L'autorisation Etsy a expiré ou a été retirée : reconnectez votre compte.");
      throw new ErreurEtsy('Reconnexion Etsy requise.', 409, 'reconnexion');
    }
    throw e;
  }
  const expire = new Date(Date.now() + (Number(j.expires_in) || 3600) * 1000);
  await pool.query(`UPDATE etsy_connexions SET access_token_chiffre = $2, refresh_token_chiffre = $3, expires_at = $4, updated_at = NOW() WHERE id = $1`,
    [c.id, chiffrer(j.access_token), chiffrer(j.refresh_token), expire]);
  return j.access_token;
}

async function etat(gid, cid) {
  const cfg = await configGestionnaire(gid);
  const r = await pool.query('SELECT etsy_shop_name, statut, message_erreur, created_at FROM etsy_connexions WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid]);
  const c = r.rows[0];
  return {
    gestionnaire_configure: !!cfg,
    connexion: c ? { statut: c.statut, boutique: c.etsy_shop_name, message: c.message_erreur, connecte_le: c.created_at } : null,
  };
}
async function deconnecter(gid, cid) {
  await pool.query('DELETE FROM etsy_connexions WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid]);
}
async function marquerReconnexionGestionnaire(gid) {
  try {
    await pool.query(`UPDATE etsy_connexions SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE gestionnaire_id = $1`,
      [gid, 'Les clés Etsy de la marketplace ont changé : reconnectez votre compte.']);
  } catch (e) { /* table pas encore créée */ }
}

module.exports = { ErreurEtsy, QuotaEtsy, API, URL_RETOUR, configGestionnaire, etsyGet, creerEtat, consommerEtat, urlAutorisation, connecterAvecCode, obtenirJeton, etat, deconnecter, marquerReconnexionGestionnaire };