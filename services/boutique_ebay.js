// CHEMIN : services/boutique_ebay.js
// e-Vend Studio — Add-on « Connecteur eBay » (boutique solo) : clés « développeur » du gestionnaire, connexion OAuth de SON compte eBay, jetons (chiffrés).
// Adapté de services/studio_ebay.js (MV) : ici il n'y a pas de collaborateur — le gestionnaire connecte lui-même son compte (UNE connexion par boutique).
// Tables propres à la boutique : boutique_ebay_config, boutique_ebay_connexion, boutique_ebay_etats. Les clés viennent de la BASE (pas du .env) :
// chaque boutique a donc SA PROPRE limite d'appels eBay. Aucun effet sur le multivendeur.

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const CODE_ADDON = 'connecteur_ebay';
const BASE_PUBLIQUE = (process.env.PUBLIC_BASE_URL || 'https://e-vendstudio.ca').replace(/\/+$/, '');
// L'adresse de retour d'eBay doit être FIXE : toujours le domaine principal de Studio (jamais le domaine d'une boutique).
const URL_ACCEPTEE = `${BASE_PUBLIQUE}/api/boutique/ebay/callback`;
const URL_REFUSEE = `${BASE_PUBLIQUE}/api/boutique/ebay/refus`;

// Mêmes permissions que le connecteur MV (éprouvées avec l'API Trading et l'API REST).
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

const refus = (m, s, extra) => { throw new ErreurBoutique(m, s || 400, extra); };
const lire = (v) => { if (!v) return null; try { return dechiffrer(v) || null; } catch (e) { return null; } };
const masquer = (v) => { const c = lire(v); return c ? `${c.slice(0, 6)}••••${c.slice(-4)}` : null; };
const texte = (v) => (typeof v === 'string' ? v.trim() : '');
const SANS_ESPACE = /^\S{8,200}$/;

const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);
const refusAddon = () => refus("L'option « Connecteur eBay » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
async function exigerAddon(gid) { if (!(await autorise(gid))) refusAddon(); }

// ─── Clés du gestionnaire ─────────────────────────────────────────────────────

async function chargerConfig(gid) {
  await pool.query('INSERT INTO boutique_ebay_config (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING', [gid]);
  return (await pool.query('SELECT * FROM boutique_ebay_config WHERE gestionnaire_id = $1', [gid])).rows[0];
}

// Les clés de test (sandbox) et de production ne se mélangent pas : eBay les reconnaît à leur contenu.
function erreurEnvironnement(env, clientId) {
  if (!clientId) return null;
  if (env === 'production' && /-SBX-/i.test(clientId)) return "Cet ID client est une clé de TEST (sandbox). Choisissez l'environnement « Test » ou utilisez votre clé de production.";
  if (env === 'sandbox' && /-PRD-/i.test(clientId)) return "Cet ID client est une clé de PRODUCTION. Choisissez l'environnement « Production » ou utilisez votre clé de test.";
  return null;
}

/** État de la configuration (secrets JAMAIS en clair : seulement masqués). Lisible même sans add-on (la page affiche le verrou). */
async function etatConfig(gid) {
  const addon = await autorise(gid);
  const c = addon ? await chargerConfig(gid) : ((await pool.query('SELECT * FROM boutique_ebay_config WHERE gestionnaire_id = $1', [gid])).rows[0] || {});
  return {
    addon_actif: addon,
    env: c.env || 'production',
    client_id_masque: masquer(c.client_id_chiffre),
    dev_id_masque: masquer(c.dev_id_chiffre),
    client_secret_masque: masquer(c.client_secret_chiffre),
    runame: c.runame || '',
    configure: !!(c.client_id_chiffre && c.dev_id_chiffre && c.client_secret_chiffre && c.runame),
    verifie_le: c.verifie_le || null,
    url_acceptee: URL_ACCEPTEE,
    url_refusee: URL_REFUSEE,
  };
}

/** Enregistre (champ vide = inchangé ; secrets chiffrés). Toute nouvelle clé ou tout changement d'environnement annule le dernier test et la connexion. */
async function enregistrerConfig(gid, b) {
  await exigerAddon(gid);
  b = b || {};
  const cfg = await chargerConfig(gid);
  const sets = []; const vals = [];
  const ajouter = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  let env = cfg.env;
  if (b.env !== undefined) { if (!['production', 'sandbox'].includes(b.env)) refus('Environnement invalide'); env = b.env; }
  const clientId = texte(b.client_id), devId = texte(b.dev_id), secret = texte(b.client_secret), runame = texte(b.runame);
  if (clientId) {
    if (!SANS_ESPACE.test(clientId)) refus('ID client invalide : copiez-le en entier, sans espace.');
    const e = erreurEnvironnement(env, clientId); if (e) refus(e);
    ajouter('client_id_chiffre', chiffrer(clientId));
  } else if (b.env !== undefined && b.env !== cfg.env) {
    const e = erreurEnvironnement(env, lire(cfg.client_id_chiffre)); if (e) refus(e);
  }
  if (devId) { if (!SANS_ESPACE.test(devId)) refus('ID développeur invalide : copiez-le en entier, sans espace.'); ajouter('dev_id_chiffre', chiffrer(devId)); }
  if (secret) {
    if (!SANS_ESPACE.test(secret)) refus('Secret invalide : copiez-le en entier, sans espace.');
    if (env === 'production' && /^SBX-/i.test(secret)) refus('Ce secret est une clé de TEST (sandbox).');
    if (env === 'sandbox' && /^PRD-/i.test(secret)) refus('Ce secret est une clé de PRODUCTION.');
    ajouter('client_secret_chiffre', chiffrer(secret));
  }
  if (b.runame !== undefined) {
    if (runame && !/^[A-Za-z0-9_.-]{5,150}$/.test(runame)) refus("Nom d'URL de redirection (RuName) invalide : copiez-le tel qu'eBay l'affiche, sans espace.");
    ajouter('runame', runame || null);
  }
  if (env !== cfg.env) ajouter('env', env);
  if (sets.length) {
    ajouter('verifie_le', null);
    vals.push(gid);
    await pool.query(`UPDATE boutique_ebay_config SET ${sets.join(', ')}, updated_at = NOW() WHERE gestionnaire_id = $${vals.length}`, vals);
    await marquerReconnexion(gid);   // le jeton ne vaut que pour les anciennes clés
  }
}

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now); compteurs.set(cle, liste); return true;
}

/** Demande un jeton « application » à eBay : prouve que l'ID client et le secret sont valides et du bon environnement. */
async function tester(gid) {
  await exigerAddon(gid);
  if (!limite(`bq-ebay-test-${gid}`, 6, 60 * 1000)) refus("Trop d'essais. Réessayez dans une minute.", 429);
  const cfg = await chargerConfig(gid);
  const clientId = lire(cfg.client_id_chiffre), secret = lire(cfg.client_secret_chiffre);
  if (!clientId || !secret) refus("Enregistrez d'abord l'ID client et le secret.");
  let r;
  try {
    r = await appelEbay(`${HOTES[cfg.env].api}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' }),
    });
  } catch (e) { refus("Impossible de joindre eBay pour l'instant. Réessayez dans un moment.", 502); }
  if (r.ok) {
    await pool.query('UPDATE boutique_ebay_config SET verifie_le = NOW() WHERE gestionnaire_id = $1', [gid]);
    return { ok: true, message: 'eBay a accepté votre ID client et votre secret.' };
  }
  const corps = await r.json().catch(() => ({}));
  let message = `eBay a refusé la connexion (code ${r.status}).`;
  if (corps.error === 'invalid_client') message = "eBay a refusé l'ID client ou le secret. Vérifiez qu'ils viennent du même jeu de clés et de l'environnement choisi (Test ou Production).";
  else if (corps.error === 'invalid_scope') message = "eBay a refusé la demande d'accès. Vérifiez que votre jeu de clés est bien activé.";
  refus(message);
}

async function effacerConfig(gid) {
  await exigerAddon(gid);
  await pool.query(`UPDATE boutique_ebay_config SET client_id_chiffre = NULL, dev_id_chiffre = NULL, client_secret_chiffre = NULL, runame = NULL, verifie_le = NULL, updated_at = NOW() WHERE gestionnaire_id = $1`, [gid]);
  await marquerReconnexion(gid);
}

// Clés complètes (ou null si la configuration n'est pas terminée)
async function configGestionnaire(gid) {
  const c = (await pool.query('SELECT * FROM boutique_ebay_config WHERE gestionnaire_id = $1', [gid])).rows[0];
  if (!c) return null;
  const clientId = lire(c.client_id_chiffre), secret = lire(c.client_secret_chiffre), devId = lire(c.dev_id_chiffre);
  if (!clientId || !secret || !devId || !c.runame) return null;
  return { env: c.env, clientId, secret, devId, runame: c.runame };
}

// ─── Appels eBay ──────────────────────────────────────────────────────────────

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

async function creerEtat(gid, retourUrl) {
  await pool.query('DELETE FROM boutique_ebay_etats WHERE expire_le < NOW() OR gestionnaire_id = $1', [gid]);
  const etat = crypto.randomBytes(32).toString('hex');
  await pool.query(`INSERT INTO boutique_ebay_etats (etat, gestionnaire_id, retour_url, expire_le) VALUES ($1,$2,$3, NOW() + ($4 || ' milliseconds')::interval)`,
    [etat, gid, retourUrl, String(DUREE_ETAT_MS)]);
  return etat;
}

// Lit ET détruit l'état (impossible de le rejouer). null si inconnu ou expiré.
async function consommerEtat(etat) {
  if (typeof etat !== 'string' || !/^[a-f0-9]{64}$/.test(etat)) return null;
  const e = (await pool.query('DELETE FROM boutique_ebay_etats WHERE etat = $1 RETURNING *', [etat])).rows[0];
  return e && new Date(e.expire_le).getTime() > Date.now() ? e : null;
}

function urlAutorisation(cfg, etat) {
  const p = new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.runame, response_type: 'code', scope: SCOPES, state: etat });
  return `${HOTES[cfg.env].auth}?${p.toString()}`;
}

/** Début de la connexion : retourne l'adresse eBay où le gestionnaire autorise l'accès. */
async function demarrerConnexion(gid, retourUrl) {
  await exigerAddon(gid);
  const cfg = await configGestionnaire(gid);
  if (!cfg) refus("Terminez d'abord la configuration : ID client, ID développeur, secret et RuName.", 409);
  const etat = await creerEtat(gid, retourUrl);
  return { url: urlAutorisation(cfg, etat) };
}

async function identite(env, accessToken) {
  try {
    const r = await appelEbay(`${HOTES[env].identite}/commerce/identity/v1/user`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return {};
    const j = await r.json().catch(() => ({}));
    return { userId: j.userId || null, username: j.username || null };
  } catch (e) { return {}; }
}

// Échange le code eBay contre les jetons et enregistre la connexion de la boutique.
async function connecterAvecCode(gid, code) {
  if (!(await autorise(gid))) throw new ErreurEbay("L'option « Connecteur eBay » n'est pas activée.", 403);
  const cfg = await configGestionnaire(gid);
  if (!cfg) throw new ErreurEbay("La configuration eBay n'est pas terminée.", 409);
  if (typeof code !== 'string' || code.length < 10 || code.length > 4000) throw new ErreurEbay('Code eBay invalide.', 400);
  const j = await demanderJeton(cfg, { grant_type: 'authorization_code', code, redirect_uri: cfg.runame });
  if (!j.refresh_token) throw new ErreurEbay("eBay n'a pas fourni de jeton de renouvellement.", 502);
  const id = await identite(cfg.env, j.access_token);
  const expire = new Date(Date.now() + (Number(j.expires_in) || 7200) * 1000);
  const expireRefresh = j.refresh_token_expires_in ? new Date(Date.now() + Number(j.refresh_token_expires_in) * 1000) : null;
  await pool.query(
    `INSERT INTO boutique_ebay_connexion (gestionnaire_id, env, ebay_user_id, ebay_username, access_token_chiffre, refresh_token_chiffre, expires_at, refresh_expires_at, statut, message_erreur)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'connecte',NULL)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET env = EXCLUDED.env, ebay_user_id = EXCLUDED.ebay_user_id, ebay_username = EXCLUDED.ebay_username,
       access_token_chiffre = EXCLUDED.access_token_chiffre, refresh_token_chiffre = EXCLUDED.refresh_token_chiffre, expires_at = EXCLUDED.expires_at,
       refresh_expires_at = EXCLUDED.refresh_expires_at, statut = 'connecte', message_erreur = NULL, updated_at = NOW()`,
    [gid, cfg.env, id.userId || null, id.username || null, chiffrer(j.access_token), chiffrer(j.refresh_token), expire, expireRefresh]);
  return { username: id.username || null };
}

// Jeton d'accès valide (renouvelé automatiquement). Un seul renouvellement à la fois par boutique.
const verrous = new Map();
function obtenirJeton(gid) {
  if (verrous.has(gid)) return verrous.get(gid);
  const p = obtenirJetonInterne(gid).finally(() => verrous.delete(gid));
  verrous.set(gid, p);
  return p;
}
async function obtenirJetonInterne(gid) {
  const c = (await pool.query('SELECT * FROM boutique_ebay_connexion WHERE gestionnaire_id = $1', [gid])).rows[0];
  if (!c) throw new ErreurEbay("Aucun compte eBay n'est connecté.", 409, 'non_connecte');
  if (c.statut === 'reconnexion') throw new ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
  const acces = lire(c.access_token_chiffre);
  if (acces && c.expires_at && new Date(c.expires_at).getTime() > Date.now() + MARGE_JETON_MS) return acces;
  const refresh = lire(c.refresh_token_chiffre);
  const cfg = await configGestionnaire(gid);
  if (!refresh || !cfg || cfg.env !== c.env) {
    await pool.query(`UPDATE boutique_ebay_connexion SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE gestionnaire_id = $1`, [gid, 'Vos clés eBay ont changé : reconnectez votre compte.']);
    throw new ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
  }
  let j;
  try { j = await demanderJeton(cfg, { grant_type: 'refresh_token', refresh_token: refresh, scope: SCOPES }); }
  catch (e) {
    if (e instanceof ErreurEbay && e.code === 'invalid_grant') {
      await pool.query(`UPDATE boutique_ebay_connexion SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE gestionnaire_id = $1`, [gid, "L'autorisation eBay a expiré ou a été retirée : reconnectez votre compte."]);
      throw new ErreurEbay('Reconnexion eBay requise.', 409, 'reconnexion');
    }
    throw e;   // panne réseau ou refus passager : la connexion reste valide, on réessaiera
  }
  const expire = new Date(Date.now() + (Number(j.expires_in) || 7200) * 1000);
  await pool.query(
    `UPDATE boutique_ebay_connexion SET access_token_chiffre = $2, expires_at = $3, refresh_token_chiffre = COALESCE($4, refresh_token_chiffre), updated_at = NOW() WHERE gestionnaire_id = $1`,
    [gid, chiffrer(j.access_token), expire, j.refresh_token ? chiffrer(j.refresh_token) : null]);
  return j.access_token;
}

/** État de la connexion (jamais les jetons). */
async function etatConnexion(gid) {
  const c = (await pool.query('SELECT env, ebay_username, statut, message_erreur, created_at FROM boutique_ebay_connexion WHERE gestionnaire_id = $1', [gid])).rows[0];
  return { connexion: c ? { statut: c.statut, username: c.ebay_username, env: c.env, message: c.message_erreur, connecte_le: c.created_at } : null };
}

async function deconnecter(gid) {
  await exigerAddon(gid);
  await pool.query('DELETE FROM boutique_ebay_connexion WHERE gestionnaire_id = $1', [gid]);
}

// Clés changées ou effacées : le compte doit être reconnecté.
async function marquerReconnexion(gid) {
  await pool.query(`UPDATE boutique_ebay_connexion SET statut = 'reconnexion', message_erreur = $2, updated_at = NOW() WHERE gestionnaire_id = $1`, [gid, 'Vos clés eBay ont changé : reconnectez votre compte.']);
}

module.exports = {
  ErreurEbay, SCOPES, HOTES, CODE_ADDON, autorise, exigerAddon, etatConfig, enregistrerConfig, tester, effacerConfig, configGestionnaire,
  demarrerConnexion, creerEtat, consommerEtat, urlAutorisation, connecterAvecCode, obtenirJeton, etatConnexion, deconnecter, marquerReconnexion,
};