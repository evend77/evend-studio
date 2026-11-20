// CHEMIN : routes/boutique_webhook_etiquettes.js
// e-Vend Studio — Webhook de suivi EasyPost des étiquettes des templates boutique (solo). Chaque gestionnaire configure cette URL dans SON compte EasyPost
// (Webhooks & Events → Add webhook) :  https://e-vendstudio.ca/api/webhooks/boutique-etiquettes/easypost
// 🔒 La signature (en-tête X-Hmac-Signature) porte sur les octets EXACTS reçus : corps brut obligatoire. Un statut n'est cru qu'après vérification avec le secret du gestionnaire.
//
// ⚠️ MONTAGE dans server.js, AVANT express.json() global (à côté des autres webhooks boutique) :
//   app.post('/api/webhooks/boutique-etiquettes/easypost', express.raw({ type: 'application/json' }));
//   app.use('/api/webhooks/boutique-etiquettes', require('./routes/boutique_webhook_etiquettes'));

'use strict';

const express = require('express');
const E = require('../services/boutique_etiquettes');

const router = express.Router();

router.post('/easypost', async (req, res) => {
  res.status(200).json({ received: true });   // réponse immédiate : EasyPost réessaie sinon
  try {
    if (!Buffer.isBuffer(req.body)) return;
    const r = await E.traiterWebhookEasyPost(req.body, req.headers['x-hmac-signature']);
    if (r && r.traitees) console.log(`📦 Webhook EasyPost boutique (signature vérifiée) : ${r.traitees} commande(s) mise(s) à jour`);
  } catch (err) { console.error('❌ Webhook EasyPost boutique :', err.message); }
});

module.exports = router;