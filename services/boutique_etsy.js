// CHEMIN : services/boutique_etsy.js
// e-Vend Studio — Add-on « Connecteur Etsy » (boutique solo) : clés « développeur » du gestionnaire, connexion OAuth 2.0 + PKCE de SA boutique Etsy, jetons (chiffrés).
// Adapté de services/studio_etsy.js (MV) : ici il n'y a pas de collaborateur — le gestionnaire connecte lui-même son compte (UNE connexion par boutique).
// Tables propres à la boutique : boutique_etsy_config, boutique_etsy_connexion, boutique_etsy_etats. Les clés viennent de la BASE (pas du .env) :
// chaque boutique a donc SA PROPRE app Etsy et sa propre limite d'appels. Lecture seule : Studio ne modifie jamais rien sur Etsy.

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const CODE_ADDON = 'connecteur_etsy';
const API = 'https://openapi.etsy.com/v3/application';
const URL_AUTH = 'https://www.etsy.com/oauth/connect';
const URL_JETON = 'https://api.etsy.com/v3/public/oauth/token';
const SCOPES = 'listings_r shops_r';
const DUREE_ETAT_MS = 15 * 60 * 1000;
const MARGE_JETON_MS = 5 * 60 * 1000;
const BASE_PUBLIQUE = (process.env.PUBLIC_BASE_URL || 'https://e-vendstudio.ca').replace(/\/+$/, '');
// L'adresse de retour doit être FIXE : toujours le domaine principal de Studio (jamais le domaine d'une boutique).
const URL_RETOUR = `${BASE_PUBLIQUE}/api/boutique/etsy/callback`;

class ErreurEtsy extends Error {
  constructor(message, status, code) { super(message); this.status = status || 400; this.code = code || null; }
}
class QuotaEtsy extends Error {
  constructor(retryAfterSec, m) { super(m || "Limite d'appels Etsy atteinte"); this.quota = true; this.retryAfterSec = retryAfterSec || null; }
}

const refus = (m, s, extra) => { throw new ErreurBoutique(m, s || 400, extra); };
const lire = (v) => { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } };
const masquer = (v) => { const c = lire(v); return c ? `${c.slice(0, 4)}••••${c.slice(-3)}` : null; };
const texte = (v) => (typeof v === 'string' ? v.trim() : '');
const SANS_ESPACE = /^[A-Za-z0-9_-]{8,100}$/;

const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);
const refusAddon = () => refus("L'option « Connecteur Etsy » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
async function exigerAddon(gid) { if (!(await autorise(gid))) refusAddon(); }

// ─── Clés du gestionnaire ─────────────────────────────────────────────────────

async function chargerConfig(gid) {
  await pool.query('INSERT INTO boutique_etsy_config (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING', [gid]);
  return (await pool.query('SELECT * FROM boutique_etsy_config WHERE gestionnaire_id = $1', [gid])).rows[0];
}

/** État de la configuration (secrets JAMAIS en clair : seulement masqués). Lisible même sans add-on (la page affiche le verrou). */
async function etatConfig(gid) {
  const addon = await autorise(gid);
  const c = addon ? await chargerConfig(gid) : ((await pool.query('SELECT * FROM boutique_etsy_config WHERE gestionnaire_id = $1', [gid])).rows[0] || {});
  return {
    addon_actif: addon,
    keystring_masque: masquer(c.keystring_chiffre),
    secret_masque: masquer(c.secret_chiffre),
    configure: !!(c.keystring_chiffre && c.secret_chiffre),
    verifie_le: c.verifie_le || null,
    url_retour: URL_RETOUR,
  };
}

/** Enregistre (champ vide = inchangé ; chiffré). Toute nouvelle clé annule le dernier test et oblige à reconnecter le compte. */
async function enregistrerConfig(gid, b) {
  await exigerAddon(gid);
  b = b || {};
  await chargerConfig(gid);
  const sets = []; const vals = [];
  const ajouter = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  const keystring = texte(b.keystring), secret = texte(b.secret);
  if (keystring) { if (!SANS_ESPACE.test(keystring)) refus('Keystring invalide : copiez-le en entier, sans espace.'); ajouter('keystring_chiffre', chiffrer(keystring)); }
  if (secret) { if (!SANS_ESPACE.test(secret)) refus('Shared secret invalide : copiez-le en entier, sans espace.'); ajouter('secret_chiffre', chiffrer(secret)); }
  if (sets.length) {
    ajouter('verifie_le', null);
    vals.push(gid);
    await pool.query(`UPDATE boutique_etsy_config SET ${sets.join(', ')}, updated_at = NOW() WHERE gestionnaire_id = $${vals.length}`, vals);
    await marquerReconnexion(gid);
  }
}

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now); compteurs.set(cle, liste); return true;
}

/** Appelle le « ping » d'Etsy avec la clé : prouve que le Keystring et le Shared secret sont valides. */
async function tester(gid) {
  await exigerAddon(gid);
  if (!limite(`bq-etsy-test-${gid}`, 6, 60 * 1000)) refus("Trop d'essais. Réessayez dans une minute.", 429);
  const c = await chargerConfig(gid);
  const ks = lire(c.keystring_chiffre), sec = lire(c.secret_chiffre);
  if (!ks || !sec) refus("Enregistrez d'abord le Keystring et le Shared secret.");
  let r;
  try { r = await appel(`${API}/openapi-ping`, { headers: { 'x-api-key': `${ks}:${sec}` } }); }
  catch (e) { refus("Impossible de joindre Etsy pour l'instant. Réessayez dans un moment.", 502); }
  if (r.ok) {
    await pool.query('UPDATE boutique_etsy_config SET verifie_le = NOW() WHERE gestionnaire_id = $1', [gid]);
    return { ok: true, message: 'Etsy a accepté votre Keystring et votre Shared secret.' };
  }
  if (r.status === 401 || r.status === 403) refus("Etsy a refusé la clé. Vérifiez le Keystring et le Shared secret (même app Etsy), et que votre app est bien approuvée par Etsy.");
  refus(`Etsy a refusé la connexion (code ${r.status}).`);
}

async function effacerConfig(gid) {
  await exigerAddon(gid);
  await pool.query('UPDATE boutique_etsy_config SET keystring_chiffre = NULL, secret_chiffre = NULL, verifie_le = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [gid]);
  await marquerReconnexion(gid);
}

// Clés complètes (ou null si la configuration n'est pas terminée)
async function configGestionnaire(gid) {
  const c = (await pool.query('SELECT * FROM boutique_etsy_config WHERE gestionnaire_id = $1', [gid])).rows[0];
  if (!c) return null;
  const keystring = lire(c.keystring_chiffre), secret = lire(c.secret_chiffre);
  if (!keystring || !secret) return null;
  return { keystring, secret, cleApi: `${keystring}:${secret}` };   // en-tête x-api-key = « keystring:secret »
}

// ─── Appels Etsy ──────────────────────────────────────────────────────────────

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

async function creerEtat(gid, retourUrl) {
  await pool.query('DELETE FROM boutique_etsy_etats WHERE expire_le < NOW() OR gestionnaire_id = $1', [gid]);
  const etat = crypto.randomBytes(32).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  await pool.query(
    `INSERT INTO boutique_etsy_etats (etat, gestionnaire_id, code_verifier, retour_url, expire_le) VALUES ($1,$2,$3,$4, NOW() + ($5 || ' milliseconds')::interval)`,
    [etat, gid, verifier, retourUrl, String(DUREE_ETAT_MS)]);
  return { etat, challenge: crypto.createHash('sha256').update(verifier).digest('base64url') };
}

// Lit ET détruit l'état (impossible de le rejouer). null si inconnu ou expiré.
async function consommerEtat(etat) {
  if (typeof etat !== 'string' || !/^[a-f0-9]{64}$/.test(etat)) return null;
  const e = (await pool.query('DELETE FROM boutique_etsy_etats WHERE etat = $1 RETURNING *', [etat])).rows[0];
  return e && new Date(e.expire_le).getTime() > Date.now() ? e : null;
}

function urlAutorisation(cfg, etat, challenge) {
  const p = new URLSearchParams({ response_type: 'code', client_id: cfg.keystring, redirect_uri: URL_RETOUR, scope: SCOPES, state: etat, code_challenge: challenge, code_challenge_method: 'S256' });
  return `${URL_AUTH}?${p.toString()}`;
}

/** Début de la connexion : retourne l'adresse Etsy où le gestionnaire autorise l'accès. */
async function demarrerConnexion(gid, retourUrl) {
  await exigerAddon(gid);
  const cfg = await configGestionnaire(gid);
  if (!cfg) refus("Terminez d'abord la configuration : Keystring et Shared secret.", 409);
  const { etat, challenge } = await creerEtat(gid, retourUrl);
  return { url: urlAutorisation(cfg, etat, challenge) };
}

// Échange le code Etsy contre les jetons et enregistre la connexion de la boutique.
async function connecterAvecCode(gid, code, verifier) {
  if (!(await autorise(gid))) throw new ErreurEtsy("L'option « Connecteur Etsy » n'est pas activée.", 403);
  const cfg = await configGestionnaire(gid);
  if (!cfg) throw new ErreurEtsy("La configuration Etsy n'est pas terminée.", 409);
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
    `INSERT INTO boutique_etsy_connexion (gestionnaire_id, etsy_user_id, etsy_shop_id, etsy_shop_name, access_token_chiffre, refresh_token_chiffre, expires_at, statut, message_erreur)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'connecte',NULL)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET etsy_user_id = EXCLUDED.etsy_user_id, etsy_shop_id = EXCLUDED.etsy_shop_id, etsy_shop_name = EXCLUDED.etsy_shop_name,
       access_token_chiffre = EXCLUDED.access_token_chiffre, refresh_token_chiffre = EXCLUDED.refresh_token_chiffre, expires_at = EXCLUDED.expires_at,
       statut = 'connecte', message_erreur = NULL, updated_at = NOW()`,
    [gid, userId, String(shop.shop_id), String(shop.shop_name || '').slice(0, 120) || null, chiffrer(j.access_token), chiffrer(j.refresh_token), expire]);
  return { boutique: shop.shop_name || null };
}

// Jeton d'accès valide (l'accès Etsy dure 1 h : renouvelé automatiquement). Un seul renouvellement à la fois par boutique.
const verrous = new Map();
function obtenirJeton(gid) {
  if (verrous.has(gid)) return verrous.get(gid);
  const p = obtenirJetonInterne(gid).finally(() => verrous.delete(gid));
  verrous.set(gid, p);
  return p;
}
async function marquerReconnexionMsg(gid, message) {
  await pool.query(`UPDATE boutique_etsy_connexion SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE gestionnaire_id = $1`, [gid, message]);
}
async function obtenirJetonInterne(gid) {
  const c = (await pool.query('SELECT * FROM boutique_etsy_connexion WHERE gestionnaire_id = $1', [gid])).rows[0];
  if (!c) throw new ErreurEtsy("Aucun compte Etsy n'est connecté.", 409, 'non_connecte');
  if (c.statut === 'reconnexion') throw new ErreurEtsy('Reconnexion Etsy requise.', 409, 'reconnexion');
  const acces = lire(c.access_token_chiffre);
  if (acces && c.expires_at && new Date(c.expires_at).getTime() > Date.now() + MARGE_JETON_MS) return acces;

  const refresh = lire(c.refresh_token_chiffre);
  const cfg = await configGestionnaire(gid);
  if (!refresh || !cfg) {
    await marquerReconnexionMsg(gid, 'Vos clés Etsy ont changé : reconnectez votre compte.');
    throw new ErreurEtsy('Reconnexion Etsy requise.', 409, 'reconnexion');
  }
  let j;
  try { j = await demanderJeton(cfg, { grant_type: 'refresh_token', refresh_token: refresh }); }
  catch (e) {
    if (e instanceof ErreurEtsy && /invalid_grant|invalid_token/.test(e.code || '')) {
      await marquerReconnexionMsg(gid, "L'autorisation Etsy a expiré ou a été retirée : reconnectez votre compte.");
      throw new ErreurEtsy('Reconnexion Etsy requise.', 409, 'reconnexion');
    }
    throw e;   // panne réseau ou refus passager : la connexion reste valide, on réessaiera
  }
  const expire = new Date(Date.now() + (Number(j.expires_in) || 3600) * 1000);
  await pool.query(`UPDATE boutique_etsy_connexion SET access_token_chiffre = $2, refresh_token_chiffre = $3, expires_at = $4, updated_at = NOW() WHERE gestionnaire_id = $1`,
    [gid, chiffrer(j.access_token), chiffrer(j.refresh_token), expire]);
  return j.access_token;
}

/** État de la connexion (jamais les jetons). */
async function etatConnexion(gid) {
  const c = (await pool.query('SELECT etsy_shop_name, statut, message_erreur, created_at FROM boutique_etsy_connexion WHERE gestionnaire_id = $1', [gid])).rows[0];
  return { connexion: c ? { statut: c.statut, boutique: c.etsy_shop_name, message: c.message_erreur, connecte_le: c.created_at } : null };
}

async function deconnecter(gid) {
  await exigerAddon(gid);
  await pool.query('DELETE FROM boutique_etsy_connexion WHERE gestionnaire_id = $1', [gid]);
}

// Clés changées ou effacées : le compte doit être reconnecté.
async function marquerReconnexion(gid) {
  await marquerReconnexionMsg(gid, 'Vos clés Etsy ont changé : reconnectez votre compte.');
}

module.exports = {
  ErreurEtsy, QuotaEtsy, API, URL_RETOUR, CODE_ADDON, autorise, exigerAddon, etatConfig, enregistrerConfig, tester, effacerConfig, configGestionnaire,
  etsyGet, demarrerConnexion, creerEtat, consommerEtat, urlAutorisation, connecterAvecCode, obtenirJeton, etatConnexion, deconnecter, marquerReconnexion,
};