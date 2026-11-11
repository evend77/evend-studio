// CHEMIN : services/boutique_paiement.js
// e-Vend Studio — Paiement des templates boutique (solo). Chaque gestionnaire utilise SON PROPRE Stripe et SON PROPRE PayPal :
// pas de Stripe Connect, pas de commission, jamais le Stripe de l'admin. Aucun lien avec services/studio_paiement.js (MV).
//
// Accès aux clés du gestionnaire, appels Stripe/PayPal, réception des événements des webhooks.
// Les commandes (panier, stock, confirmation) sont dans services/boutique_commandes.js.

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

// ─── Événements reçus des webhooks → appliqués aux commandes (services/boutique_commandes.js) ───
// (chargé au moment de l'appel : boutique_commandes a besoin de ce fichier, pas l'inverse)
const commandes = () => require('./boutique_commandes');
const confirmerPaiementStripe = (gid, session) => commandes().confirmerStripe(gid, session);
const sessionStripeExpiree = (gid, session) => commandes().expireeStripe(gid, session);
const evenementPaypal = (gid, evenement) => commandes().evenementPaypalCommande(gid, evenement);
// Remet en vente le stock des commandes jamais payées (toutes les 5 minutes)
const demarrerBalayage = () => commandes().demarrerBalayage();

module.exports = {
  lire, envDe, config, clientStripe, jetonPaypal, appelPaypal, PAYPAL_HOTE,
  confirmerPaiementStripe, sessionStripeExpiree, evenementPaypal, demarrerBalayage,
};