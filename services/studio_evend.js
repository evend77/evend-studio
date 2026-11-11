// CHEMIN : services/studio_evend.js
// e-Vend Studio — « Pont » e-Vend → Studio : le collaborateur autorise Studio à LIRE ses annonces e-Vend (lecture seule).
// Le collaborateur est envoyé sur e-Vend (connexion + F2A d'e-Vend), clique « Autoriser », puis revient avec un code à usage unique.
// Le serveur de Studio échange ce code contre un accès temporaire (3 h) gardé CHIFFRÉ. Le mot de passe d'e-Vend n'arrive jamais ici.
// Variables d'environnement : STUDIO_PONT_SECRET (32 caractères ou plus, le MÊME que sur e-Vend), EVEND_API_URL (défaut https://api.e-vend.ca).

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const DUREE_ETAT_MS = 15 * 60 * 1000;
const base = () => String(process.env.EVEND_API_URL || 'https://api.e-vend.ca').replace(/\/+$/, '');
const secret = () => process.env.STUDIO_PONT_SECRET || '';
const configure = () => secret().length >= 32;

class ErreurEvend extends Error {
  constructor(message, status = 502, reconnexion = false) { super(message); this.status = status; this.reconnexion = reconnexion; }
}

async function appeler(methode, chemin, { jeton, corps } = {}) {
  if (!configure()) throw new ErreurEvend("La connexion à e-Vend n'est pas encore configurée.", 503);
  const ctrl = new AbortController();
  const delai = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(`${base()}/api/auth/studio-pont${chemin}`, {
      method: methode, signal: ctrl.signal,
      headers: { 'x-pont-secret': secret(), ...(corps ? { 'Content-Type': 'application/json' } : {}), ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
      body: corps ? JSON.stringify(corps) : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return j;
    const msg = String(j.error || '');
    if (r.status === 401 && /^Accès/.test(msg)) throw new ErreurEvend('Votre accès à e-Vend a expiré : reconnectez-vous.', 401, true);
    if (r.status === 401 || r.status === 503) throw new ErreurEvend("La connexion avec e-Vend n'est pas configurée correctement. Contactez le support.", 503);
    if (r.status === 400 || r.status === 403) throw new ErreurEvend(msg.slice(0, 200) || 'e-Vend a refusé la demande.', 400);
    throw new ErreurEvend("e-Vend est injoignable pour l'instant. Réessayez dans quelques minutes.", 502);
  } catch (e) {
    if (e instanceof ErreurEvend) throw e;
    throw new ErreurEvend("e-Vend est injoignable pour l'instant. Réessayez dans quelques minutes.", 502);
  } finally { clearTimeout(delai); }
}

// ─── Connexion ────────────────────────────────────────────────────────────────
// L'état est d'abord enregistré chez e-Vend (de serveur à serveur) : e-Vend n'accepte que les états créés par Studio.
async function creerEtat(gid, cid, retourUrl, label) {
  await pool.query('DELETE FROM evend_pont_etats WHERE expire_le < NOW() OR collaborateur_id = $1', [cid]);
  const etat = crypto.randomBytes(32).toString('hex');
  await appeler('POST', '/etat', { corps: { etat, label: String(label || '').slice(0, 80) } });
  await pool.query(
    `INSERT INTO evend_pont_etats (etat, gestionnaire_id, collaborateur_id, retour_url, expire_le) VALUES ($1,$2,$3,$4, NOW() + ($5 || ' milliseconds')::interval)`,
    [etat, gid, cid, retourUrl, String(DUREE_ETAT_MS)]);
  return { etat, url: `${base()}/api/auth/studio-pont/autoriser?etat=${etat}` };
}
async function consommerEtat(etat) {
  if (typeof etat !== 'string' || !/^[a-f0-9]{64}$/.test(etat)) return null;
  const r = await pool.query('DELETE FROM evend_pont_etats WHERE etat = $1 RETURNING *', [etat]);
  const e = r.rows[0];
  return e && new Date(e.expire_le).getTime() > Date.now() ? e : null;
}

// Échange le code contre l'accès temporaire et garde le résumé (nombre d'annonces)
async function connecterAvecCode(gid, cid, code) {
  if (typeof code !== 'string' || !/^[a-f0-9]{64}$/.test(code)) throw new ErreurEvend('Code invalide.', 400);
  const j = await appeler('POST', '/echange', { corps: { code } });
  const resume = await appeler('GET', '/resume', { jeton: j.jeton });
  const dureeSec = Math.max((parseInt(j.expire_dans, 10) || 10800) - 300, 600);   // 5 minutes de marge
  await pool.query(
    `INSERT INTO evend_connexions (collaborateur_id, gestionnaire_id, jeton_chiffre, expire_le, vendeur_nom, importables, numeriques, autres)
     VALUES ($1,$2,$3, NOW() + ($4 || ' seconds')::interval, $5,$6,$7,$8)
     ON CONFLICT (collaborateur_id) DO UPDATE SET gestionnaire_id = EXCLUDED.gestionnaire_id, jeton_chiffre = EXCLUDED.jeton_chiffre, expire_le = EXCLUDED.expire_le,
       vendeur_nom = EXCLUDED.vendeur_nom, importables = EXCLUDED.importables, numeriques = EXCLUDED.numeriques, autres = EXCLUDED.autres, cree_le = NOW()`,
    [cid, gid, chiffrer(j.jeton), String(dureeSec), String((j.vendeur && j.vendeur.nom) || '').slice(0, 120) || null,
      parseInt(resume.importables, 10) || 0, parseInt(resume.numeriques, 10) || 0, parseInt(resume.autres, 10) || 0]);
}

// ─── État ─────────────────────────────────────────────────────────────────────
async function etat(gid, cid) {
  await pool.query('DELETE FROM evend_connexions WHERE collaborateur_id = $1 AND expire_le < NOW()', [cid]);
  const r = await pool.query(
    `SELECT vendeur_nom, importables, numeriques, autres, expire_le, cree_le FROM evend_connexions WHERE collaborateur_id = $1 AND gestionnaire_id = $2`, [cid, gid]);
  const c = r.rows[0];
  return {
    configure: configure(),
    connexion: c ? { vendeur: c.vendeur_nom, importables: c.importables, numeriques: c.numeriques, autres: c.autres, expire_le: c.expire_le, connecte_le: c.cree_le } : null,
  };
}

async function jetonDe(gid, cid) {
  const r = await pool.query('SELECT jeton_chiffre FROM evend_connexions WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND expire_le > NOW()', [cid, gid]);
  if (!r.rows[0]) return null;
  try { return dechiffrer(r.rows[0].jeton_chiffre) || null; } catch (e) { return null; }
}

// Ferme l'accès chez e-Vend (au mieux) et oublie le jeton
async function deconnecter(gid, cid) {
  const jeton = await jetonDe(gid, cid);
  if (jeton) { try { await appeler('POST', '/revoquer', { jeton, corps: {} }); } catch (e) { /* l'accès expire de lui-même après 3 h */ } }
  await pool.query('DELETE FROM evend_connexions WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid]);
}

module.exports = { ErreurEvend, configure, appeler, creerEtat, consommerEtat, connecterAvecCode, etat, jetonDe, deconnecter };