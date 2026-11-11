// CHEMIN : routes/boutique_webhook_stripe.js
// e-Vend Studio — Webhook Stripe des templates boutique (solo). Le gestionnaire a SON Stripe : une URL par gestionnaire.
// Monté sur : /api/webhooks/boutique-stripe   →   POST /:gestionnaireId
//
// ⚠️ Le body doit arriver BRUT (Buffer) : server.js met express.raw() sur ce chemin AVANT express.json().

'use strict';

const express = require('express');
const pool = require('../db');
const paiement = require('../services/boutique_paiement');

const router = express.Router();

async function traiter(event, gid) {
  const obj = event.data && event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await paiement.confirmerPaiementStripe(gid, obj);
      return;
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      await paiement.sessionStripeExpiree(gid, obj);
      return;
    default:
      // Remboursements, litiges, etc. : reçus et enregistrés (traités dans les étapes suivantes)
      console.log(`ℹ️ [boutique-stripe] gestionnaire=${gid} ← ${event.type} (${event.id})`);
  }
}

router.post('/:gestionnaireId', async (req, res) => {
  const gid = parseInt(req.params.gestionnaireId, 10);
  if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ error: 'Webhook inconnu' });
  if (!Buffer.isBuffer(req.body)) {
    console.error('❌ [boutique-stripe] body non brut — express.raw() manquant sur ce chemin dans server.js');
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Signature manquante' });

  try {
    const cfg = await paiement.config(gid);
    if (!cfg) return res.status(404).json({ error: 'Webhook inconnu' });

    // Test ou production ? On ne le sait qu'après avoir vérifié la signature : on essaie chaque secret enregistré.
    let event = null;
    let env = null;
    for (const e of ['dev', 'prod']) {
      const secret = paiement.lire(cfg[`stripe_${e}_webhook_secret`]);
      const stripe = paiement.clientStripe(cfg, e);
      if (!secret || !stripe) continue;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, secret);
        env = e;
        break;
      } catch (err) { /* mauvais secret, on essaie l'autre */ }
    }
    if (!event) return res.status(400).json({ error: 'Signature invalide' });
    if ((env === 'prod') !== !!event.livemode) return res.status(400).json({ error: 'Environnement incohérent' });

    // Idempotence : déjà traité → 200 sans rien refaire
    const nouveau = await pool.query(
      `INSERT INTO boutique_evenements_paiement (fournisseur, event_id, gestionnaire_id, type)
       VALUES ('stripe', $1, $2, $3) ON CONFLICT (fournisseur, event_id) DO NOTHING RETURNING event_id`,
      [event.id, gid, event.type]
    );
    if (!nouveau.rows.length) return res.json({ received: true, duplicate: true });

    try {
      await traiter(event, gid);
    } catch (e) {
      // Échec : on libère l'événement pour que Stripe puisse le renvoyer
      await pool.query(`DELETE FROM boutique_evenements_paiement WHERE fournisseur = 'stripe' AND event_id = $1`, [event.id]).catch(() => {});
      console.error(`❌ [boutique-stripe] traitement ${event.type} (${event.id}) :`, e.message);
      return res.status(500).json({ error: 'Erreur de traitement' });
    }
    res.json({ received: true });
  } catch (e) {
    console.error('❌ [boutique-stripe] erreur :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;