// CHEMIN : routes/cagnotte_webhook_stripe.js
// e-Vend Studio — Webhook Stripe des dons de cagnotte. Le gestionnaire a SON Stripe : une URL par gestionnaire.
// Monté sur : /api/webhooks/cagnotte-stripe   →   POST /:gestionnaireId
// ⚠️ Le body doit arriver BRUT (Buffer) : server.js met express.raw() sur ce chemin AVANT express.json().

'use strict';

const express = require('express');
const pool = require('../db');
const schema = require('../services/cagnotte_schema');
const paiement = require('../services/cagnotte_paiement');
const dons = require('../services/cagnotte_dons');

const router = express.Router();
const cents = (n) => Math.round(Number(n));

async function traiter(event, gid) {
  const s = event.data && event.data.object;
  if (!s || !s.metadata || s.metadata.type !== 'cagnotte_don' || String(s.metadata.gestionnaire_id) !== String(gid)) return;   // pas un don de ce gestionnaire
  const donId = parseInt(s.metadata.don_id, 10);
  if (!Number.isInteger(donId)) return;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      if (s.payment_status && s.payment_status !== 'paid') return;   // paiement différé : on attend l'événement « async_payment_succeeded »
      const pi = typeof s.payment_intent === 'string' ? s.payment_intent : (s.payment_intent && s.payment_intent.id) || s.id;
      await dons.confirmerDon(gid, donId, { mode: 'stripe', reference: pi, totalC: cents(s.amount_total), devise: String(s.currency || '').toUpperCase() });
      return;
    }
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      await dons.annulerDon(gid, donId);
      return;
    default: return;
  }
}

router.post('/:gestionnaireId', async (req, res) => {
  const gid = parseInt(req.params.gestionnaireId, 10);
  if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ error: 'Webhook inconnu' });
  if (!Buffer.isBuffer(req.body)) {
    console.error('❌ [cagnotte-stripe] body non brut — express.raw() manquant sur ce chemin dans server.js');
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }
  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Signature manquante' });
  try {
    await schema.pret();
    const cfg = await paiement.config(gid);
    if (!cfg) return res.status(404).json({ error: 'Webhook inconnu' });
    let event = null, env = null;
    for (const e of ['dev', 'prod']) {
      const secret = paiement.lire(cfg[`stripe_${e}_webhook_secret`]);
      const stripe = paiement.clientStripe(cfg, e);
      if (!secret || !stripe) continue;
      try { event = stripe.webhooks.constructEvent(req.body, signature, secret); env = e; break; } catch (err) { /* mauvais secret */ }
    }
    if (!event) return res.status(400).json({ error: 'Signature invalide' });
    if ((env === 'prod') !== !!event.livemode) return res.status(400).json({ error: 'Environnement incohérent' });

    const nouveau = await pool.query(
      `INSERT INTO cagnotte_evenements (fournisseur, event_id, gestionnaire_id, type) VALUES ('stripe', $1, $2, $3) ON CONFLICT (fournisseur, event_id) DO NOTHING RETURNING event_id`,
      [event.id, gid, event.type]);
    if (!nouveau.rows.length) return res.json({ received: true, duplicate: true });
    try { await traiter(event, gid); }
    catch (e) {
      await pool.query(`DELETE FROM cagnotte_evenements WHERE fournisseur = 'stripe' AND event_id = $1`, [event.id]).catch(() => {});
      console.error(`❌ [cagnotte-stripe] ${event.type} (${event.id}) :`, e.message);
      return res.status(500).json({ error: 'Erreur de traitement' });
    }
    res.json({ received: true });
  } catch (e) { console.error('❌ [cagnotte-stripe] erreur :', e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;