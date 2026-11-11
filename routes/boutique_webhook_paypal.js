// CHEMIN : routes/boutique_webhook_paypal.js
// e-Vend Studio — Webhook PayPal des templates boutique (solo). Le gestionnaire a SON PayPal : une URL par gestionnaire.
// Monté sur : /api/webhooks/boutique-paypal   →   POST /:gestionnaireId
//
// La signature est vérifiée auprès de PayPal (verify-webhook-signature). On lui renvoie le texte EXACT reçu :
// server.js met donc express.raw() sur ce chemin AVANT express.json().

'use strict';

const express = require('express');
const pool = require('../db');
const paiement = require('../services/boutique_paiement');

const router = express.Router();

async function verifier(cfg, env, entetes, brut) {
  const webhookId = cfg[`paypal_${env}_webhook_id`];
  if (!webhookId) return false;
  const j = JSON.stringify;
  const corps = `{"auth_algo":${j(entetes['paypal-auth-algo'])},"cert_url":${j(entetes['paypal-cert-url'])},`
    + `"transmission_id":${j(entetes['paypal-transmission-id'])},"transmission_sig":${j(entetes['paypal-transmission-sig'])},`
    + `"transmission_time":${j(entetes['paypal-transmission-time'])},"webhook_id":${j(webhookId)},"webhook_event":${brut}}`;
  try {
    const r = await paiement.appelPaypal(cfg, env, 'POST', '/v1/notifications/verify-webhook-signature', corps);
    return r.status === 200 && r.data && r.data.verification_status === 'SUCCESS';
  } catch (e) { return false; }
}

router.post('/:gestionnaireId', async (req, res) => {
  const gid = parseInt(req.params.gestionnaireId, 10);
  if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ error: 'Webhook inconnu' });
  if (!Buffer.isBuffer(req.body)) {
    console.error('❌ [boutique-paypal] body non brut — express.raw() manquant sur ce chemin dans server.js');
    return res.status(400).json({ error: 'Corps de requête invalide' });
  }
  const h = req.headers;
  if (!h['paypal-transmission-sig'] || !h['paypal-transmission-id']) return res.status(400).json({ error: 'Signature manquante' });

  const brut = req.body.toString('utf8');
  let event;
  try { event = JSON.parse(brut); } catch (e) { return res.status(400).json({ error: 'Corps invalide' }); }
  if (!event || typeof event.id !== 'string' || typeof event.event_type !== 'string') return res.status(400).json({ error: 'Événement invalide' });

  try {
    const cfg = await paiement.config(gid);
    if (!cfg) return res.status(404).json({ error: 'Webhook inconnu' });

    let env = null;
    for (const e of ['dev', 'prod']) {
      if (await verifier(cfg, e, h, brut)) { env = e; break; }
    }
    if (!env) return res.status(400).json({ error: 'Signature invalide' });

    const nouveau = await pool.query(
      `INSERT INTO boutique_evenements_paiement (fournisseur, event_id, gestionnaire_id, type)
       VALUES ('paypal', $1, $2, $3) ON CONFLICT (fournisseur, event_id) DO NOTHING RETURNING event_id`,
      [event.id, gid, event.event_type]
    );
    if (!nouveau.rows.length) return res.json({ received: true, duplicate: true });

    try {
      await paiement.evenementPaypal(gid, event);
    } catch (e) {
      await pool.query(`DELETE FROM boutique_evenements_paiement WHERE fournisseur = 'paypal' AND event_id = $1`, [event.id]).catch(() => {});
      console.error(`❌ [boutique-paypal] traitement ${event.event_type} (${event.id}) :`, e.message);
      return res.status(500).json({ error: 'Erreur de traitement' });
    }
    res.json({ received: true });
  } catch (e) {
    console.error('❌ [boutique-paypal] erreur :', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;