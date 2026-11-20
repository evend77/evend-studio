// CHEMIN : routes/boutique_pwa_public.js
// e-Vend Studio — Add-on « App installable (PWA) » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/pwa
//   GET  /manifest.webmanifest → manifest de la boutique selon le domaine visité (404 si pas de PWA pour ce domaine)
//   POST /installation         → compte une installation { device_id, plateforme } ; la boutique est celle du DOMAINE visité. 20 appels / heure / adresse.

'use strict';

const express = require('express');
const V = require('../services/boutique_pwa');

const router = express.Router();

router.get('/manifest.webmanifest', async (req, res) => {
  try {
    const m = await V.manifestPourHote(req.hostname);
    if (!m) return res.status(404).json({ error: 'Aucune app pour ce domaine' });
    res.set('Cache-Control', 'public, max-age=300');
    res.type('application/manifest+json').send(JSON.stringify(m));
  } catch (e) {
    console.error('[boutique_pwa_public] manifest', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const appels = new Map();
function limiteur(req, res, next) {
  const ip = req.ip || 'inconnue', n = Date.now();
  const recents = (appels.get(ip) || []).filter((t) => n - t < 3600 * 1000);
  if (recents.length >= 20) return res.status(429).json({ error: 'Trop de requêtes' });
  recents.push(n); appels.set(ip, recents);
  next();
}
setInterval(() => { const m = Date.now(); for (const [ip, ts] of appels) if (!ts.some((t) => m - t < 3600 * 1000)) appels.delete(ip); }, 3600 * 1000).unref();

router.post('/installation', limiteur, express.json({ limit: '2kb' }), async (req, res) => {
  try {
    const { device_id, plateforme } = req.body || {};
    const r = await V.compterInstallation(req.hostname, device_id, plateforme, req.get('user-agent'));
    if (r === 'invalide') return res.status(400).json({ error: 'device_id invalide' });
    if (r === 'aucune') return res.status(404).json({ error: 'Aucune app pour ce domaine' });
    if (r === 'doublon') return res.json({ success: true, doublon: true });
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('[boutique_pwa_public] installation', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;