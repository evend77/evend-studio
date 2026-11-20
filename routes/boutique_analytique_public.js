// CHEMIN : routes/boutique_analytique_public.js
// e-Vend Studio — Add-on « Analytique » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/analytique
//   GET  /:gid/config                    → { actif } : le site sait s'il doit compter les visites (add-on actif + bannière active + catégorie « analytique »)
//   POST /:gid/visite                    → enregistre une page vue { session_id, page, titre, referent, resolution, langue, recherche } → { visite_id, token }
//   POST /:gid/visite/:id/duree          → durée de la page { duree_secondes, token }   (sendBeacon = POST)
// La boutique doit correspondre au DOMAINE visité. 240 appels / 10 min / adresse. Le site n'appelle qu'après le consentement du visiteur (Loi 25).

'use strict';

const express = require('express');
const V = require('../services/boutique_analytique');

const router = express.Router();

const appels = new Map();
function limiteur(req, res, next) {
  const ip = req.ip || 'inconnue', n = Date.now();
  const recents = (appels.get(ip) || []).filter((t) => n - t < 10 * 60 * 1000);
  if (recents.length >= 240) return res.status(429).json({ error: 'Trop de requêtes' });
  recents.push(n); appels.set(ip, recents);
  next();
}
setInterval(() => { const m = Date.now(); for (const [ip, ts] of appels) if (!ts.some((t) => m - t < 10 * 60 * 1000)) appels.delete(ip); }, 10 * 60 * 1000).unref();

const gidDe = (req) => { const g = parseInt(req.params.gid, 10); return Number.isInteger(g) && g > 0 ? g : null; };
const erreur = (res, e, ou) => { console.error('[boutique_analytique_public]', ou, e && e.message ? e.message : e); res.status(500).json({ error: 'Erreur serveur' }); };

router.get('/:gid/config', limiteur, async (req, res) => {
  try {
    const gid = gidDe(req);
    if (!gid) return res.json({ actif: false });
    if ((await V.gidPourHote(req.hostname)) !== gid) return res.json({ actif: false });
    res.json(await V.configPublique(gid));
  } catch (e) { erreur(res, e, 'config'); }
});

router.post('/:gid/visite', limiteur, express.json({ limit: '4kb' }), async (req, res) => {
  try {
    const gid = gidDe(req);
    const r = gid ? await V.enregistrerVisite(gid, req.hostname, req.body, req.ip, req.get('user-agent')) : 'invalide';
    if (r === 'invalide') return res.status(400).json({ error: 'Données invalides' });
    if (r === 'bot' || r === 'inactif') return res.status(204).end();
    if (r === 'hote') return res.status(403).json({ error: 'Domaine non autorisé' });
    res.status(201).json({ success: true, visite_id: r.id, token: r.token });
  } catch (e) { erreur(res, e, 'visite'); }
});

router.post('/:gid/visite/:id/duree', limiteur, express.json({ limit: '2kb' }), async (req, res) => {
  try {
    const gid = gidDe(req);
    const b = req.body || {};
    const r = gid ? await V.enregistrerDuree(gid, req.params.id, b.token, b.duree_secondes) : 'invalide';
    if (r === 'invalide') return res.status(400).json({ error: 'Données invalides' });
    if (r === 'refuse') return res.status(403).json({ error: 'Jeton invalide' });
    res.json({ success: true });
  } catch (e) { erreur(res, e, 'duree'); }
});

module.exports = router;