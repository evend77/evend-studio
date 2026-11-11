// CHEMIN : services/boutique_paiement.js
// e-Vend Studio — Paiement des templates boutique (solo). Chaque gestionnaire utilise SON PROPRE Stripe et SON PROPRE PayPal :
// pas de Stripe Connect, pas de commission, jamais le Stripe de l'admin. Aucun lien avec services/studio_paiement.js (MV).
//
// Étape 2 : accès aux clés du gestionnaire, appels Stripe/PayPal, réception des événements des webhooks.
// Étape 4 (panier et paiement) : les fonctions « confirmer… » et le balayage seront complétés dans CE fichier.

'use strict';

const Stripe = require('stripe');
const pool = require('../db');
const { dechiffrer } = require('../src/utils/chiffrement');

const PAYPAL_HOTE = { dev: 'https://api-m.sandbox.paypal.com', prod: 'https://api-m.paypal.com' };

function lire(valeurChiffree) {
  if (!valeurChiffree) return null;
  try { return dechiffrer(valeurChiffree) || null; } catch (e) { return null; }
}

// Mode du gestionnaire : « dev » (test) tant que sandbox n'est pas explicitement faux
const envDe = (cfg) => (cfg && cfg.sandbox === false ? 'prod' : 'dev');

async function config(gid, db) {
  const r = await (db || pool).query('SELECT * FROM boutique_paiement_config WHERE gestionnaire_id = $1', [gid]);
  return r.rows[0] || null;
}

function clientStripe(cfg, env) {
  const cle = cfg ? lire(cfg[`stripe_${env}_secret_key`]) : null;
  return cle ? Stripe(cle) : null;
}

// ─── PayPal (API REST, sans librairie) ────────────────────────────────────────
async function jetonPaypal(clientId, secret, env) {
  if (typeof fetch !== 'function') throw new Error('fetch indisponible (Node 18 ou plus requis)');
  const r = await fetch(`${PAYPAL_HOTE[env]}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.access_token) {
    throw new Error(data.error_description || data.message || `PayPal a refusé la connexion (${r.status})`);
  }
  return data.access_token;
}

// corps : objet (envoyé en JSON) ou texte déjà en JSON. Retourne { status, data }.
async function appelPaypal(cfg, env, methode, chemin, corps) {
  const clientId = cfg && cfg[`paypal_${env}_client_id`];
  const secret = cfg ? lire(cfg[`paypal_${env}_secret`]) : null;
  if (!clientId || !secret) throw new Error('Clés PayPal manquantes pour ce mode.');
  const jeton = await jetonPaypal(clientId, secret, env);
  const r = await fetch(`${PAYPAL_HOTE[env]}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
    body: corps === undefined ? undefined : (typeof corps === 'string' ? corps : JSON.stringify(corps)),
    signal: AbortSignal.timeout(15000),
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

// ─── Événements reçus des webhooks ────────────────────────────────────────────
// Étape 2 : on les reçoit, on les vérifie, on les enregistre. Étape 4 : on les applique aux commandes (boutique_commandes).
async function confirmerPaiementStripe(gid, session) {
  console.log(`ℹ️ [boutique-stripe] gestionnaire=${gid} paiement reçu (session ${session && session.id}) — commandes : étape 4`);
  return { traite: false };
}
async function sessionStripeExpiree(gid, session) {
  console.log(`ℹ️ [boutique-stripe] gestionnaire=${gid} session expirée (${session && session.id}) — commandes : étape 4`);
  return { traite: false };
}
async function evenementPaypal(gid, evenement) {
  console.log(`ℹ️ [boutique-paypal] gestionnaire=${gid} ${evenement && evenement.event_type} — commandes : étape 4`);
  return { traite: false };
}

// Étape 4 : remettra en vente le stock des commandes jamais payées. Aucune tâche tant qu'il n'y a pas de commandes.
function demarrerBalayage() { /* rien pour l'instant */ }

module.exports = {
  lire, envDe, config, clientStripe, jetonPaypal, appelPaypal, PAYPAL_HOTE,
  confirmerPaiementStripe, sessionStripeExpiree, evenementPaypal, demarrerBalayage,
};