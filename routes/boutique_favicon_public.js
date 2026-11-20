// CHEMIN : routes/boutique_favicon_public.js
// e-Vend Studio — Add-on « Favicon personnalisé » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/favicon
//   POST /retour  → compte un client revenu sur l'onglet pendant l'animation. La boutique est celle du DOMAINE visité (jamais un champ envoyé par le navigateur).
//   Toujours 204 (rien à révéler) ; 429 au-delà de 60 appels par heure et par adresse.

'use strict';

const express = require('express');
const V = require('../services/boutique_favicon');

const router = express.Router();

const appels = new Map();
function limiteur(req, res, next) {
  const ip = req.ip || 'inconnue', n = Date.now();
  const recents = (appels.get(ip) || []).filter((t) => n - t < 3600 * 1000);
  if (recents.length >= 60) return res.status(429).json({ error: 'Trop de requêtes' });
  recents.push(n); appels.set(ip, recents);
  next();
}
setInterval(() => { const m = Date.now(); for (const [ip, ts] of appels) if (!ts.some((t) => m - t < 3600 * 1000)) appels.delete(ip); }, 3600 * 1000).unref();

router.post('/retour', limiteur, express.json({ limit: '1kb', type: () => true }), async (req, res) => {
  try { await V.compterRetour(req.hostname, !!(req.body && req.body.panier === true)); }
  catch (e) { console.error('[boutique_favicon_public]', e && e.message ? e.message : e); }
  res.status(204).end();
});

module.exports = router;