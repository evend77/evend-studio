// CHEMIN : routes/webhooks_etiquettes.js
// e-Vend Studio — Webhooks de suivi des étiquettes d'expédition (événement Shippo « track_updated »).
// Adapté de routes/webhooks-shippo.js (e-Vend). Chaque collaborateur configure cette URL commune dans SON PROPRE
// compte Shippo (Settings → API → Webhooks) :  https://e-vendstudio.ca/api/webhooks-etiquettes/shippo
//
// 🔒 Aucune confiance accordée au contenu du webhook : il sert seulement à savoir QUELLE commande vérifier. Le vrai statut
// est redemandé directement à Shippo avec le token du collaborateur (voir services/studio_etiquettes.js).
//
// ⚠️ MONTAGE dans server.js, AVANT express.json() global (voir les autres webhooks) :
//   app.post('/api/webhooks-etiquettes/shippo', express.raw({ type: 'application/json' }));
//   app.post('/api/webhooks-etiquettes/easypost', express.raw({ type: 'application/json' }));
//   app.use('/api/webhooks-etiquettes', require('./routes/webhooks_etiquettes'));

const express = require('express');
const svc = require('../services/studio_etiquettes');

const router = express.Router();

router.post('/shippo', async (req, res) => {
  // Réponse immédiate : Shippo réessaie sinon, et une lenteur de notre côté ne doit jamais déclencher de boucle de reprises.
  res.status(200).json({ received: true });
  try {
    let payload;
    try {
      const brut = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
      payload = JSON.parse(brut.toString('utf8'));
    } catch (e) { return; }
    const r = await svc.traiterWebhookShippo(payload);
    if (r && r.traitees) console.log(`📦 Webhook Shippo (vérifié via l'API) : ${r.traitees} commande(s) mise(s) à jour`);
  } catch (err) {
    console.error('❌ Erreur traitement webhook Shippo :', err.message);
  }
});

// EasyPost : la signature (en-tête X-Hmac-Signature) porte sur les octets EXACTS reçus → corps brut obligatoire (voir montage).
router.post('/easypost', async (req, res) => {
  res.status(200).json({ received: true });
  try {
    if (!Buffer.isBuffer(req.body)) return;
    const r = await svc.traiterWebhookEasyPost(req.body, req.headers['x-hmac-signature']);
    if (r && r.traitees) console.log(`📦 Webhook EasyPost (signature vérifiée) : ${r.traitees} commande(s) mise(s) à jour`);
  } catch (err) {
    console.error('❌ Erreur traitement webhook EasyPost :', err.message);
  }
});

module.exports = router;