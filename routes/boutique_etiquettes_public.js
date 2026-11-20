// CHEMIN : routes/boutique_etiquettes_public.js
// e-Vend Studio — Add-on « Étiquettes Shippo » (boutique solo), webhook de suivi. Monté par routes/boutique_index.js sur /api/boutique/etiquettes
//   POST /webhook/shippo   (événement Shippo « track_updated »). URL à coller dans Shippo (Settings → API → Webhooks) :
//                          https://e-vendstudio.ca/api/boutique/etiquettes/webhook/shippo
// 🔒 Le contenu du webhook n'est jamais cru : il sert seulement à retrouver la commande ; le vrai statut est redemandé à Shippo avec la clé du gestionnaire.

'use strict';

const express = require('express');
const E = require('../services/boutique_etiquettes');

const router = express.Router();

const appels = new Map();
function limiteur(req, res, next) {
  const ip = req.ip || 'inconnue', n = Date.now();
  const recents = (appels.get(ip) || []).filter((t) => n - t < 10 * 60 * 1000);
  if (recents.length >= 600) return res.status(429).json({ error: 'Trop de requêtes' });
  recents.push(n); appels.set(ip, recents);
  next();
}
setInterval(() => { const m = Date.now(); for (const [ip, ts] of appels) if (!ts.some((t) => m - t < 10 * 60 * 1000)) appels.delete(ip); }, 10 * 60 * 1000).unref();

router.post('/webhook/shippo', limiteur, async (req, res) => {
  res.status(200).json({ received: true });   // réponse immédiate : Shippo réessaie sinon
  try {
    let payload = req.body;
    if (Buffer.isBuffer(payload)) { try { payload = JSON.parse(payload.toString('utf8')); } catch (e) { return; } }
    if (!payload || typeof payload !== 'object') return;
    const r = await E.traiterWebhookShippo(payload);
    if (r && r.traitees) console.log(`📦 Webhook Shippo boutique (vérifié via l'API) : ${r.traitees} commande(s) mise(s) à jour`);
  } catch (err) { console.error('❌ Webhook Shippo boutique :', err.message); }
});

module.exports = router;