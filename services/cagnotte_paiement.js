// CHEMIN : services/cagnotte_paiement.js
// e-Vend Studio — Cagnotte : accès aux clés Stripe / PayPal du GESTIONNAIRE (les siennes, jamais celles de l'admin).
// Pas de Stripe Connect, pas de commission. Réutilise les outils de boutique_paiement.js (déchiffrement, appels PayPal),
// mais lit sa propre table : cagnotte_paiement_config.

'use strict';

const pool = require('../db');
const base = require('./boutique_paiement');

async function config(gid, db) {
  const r = await (db || pool).query('SELECT * FROM cagnotte_paiement_config WHERE gestionnaire_id = $1', [gid]);
  return r.rows[0] || null;
}

// Modes offerts aux donateurs : actif + clés présentes pour le mode courant (test ou production)
function modesDisponibles(cfg) {
  if (!cfg) return { stripe: false, paypal: false, env: 'dev' };
  const env = base.envDe(cfg);
  const stripe = !!cfg.stripe_actif && !!base.lire(cfg[`stripe_${env}_secret_key`]);
  const paypal = !!cfg.paypal_actif && !!cfg[`paypal_${env}_client_id`] && !!base.lire(cfg[`paypal_${env}_secret`]);
  return { stripe, paypal, env };
}

module.exports = {
  lire: base.lire,
  envDe: base.envDe,
  clientStripe: base.clientStripe,
  appelPaypal: base.appelPaypal,
  jetonPaypal: base.jetonPaypal,
  PAYPAL_HOTE: base.PAYPAL_HOTE,
  config,
  modesDisponibles,
};