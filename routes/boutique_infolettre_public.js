// CHEMIN : routes/boutique_infolettre_public.js
// e-Vend Studio — Add-on « Infolettre » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/infolettre
//   GET  /:gid/config       → textes et affichage (404 si l'add-on est inactif, en pause ou pas configuré : le site cache alors le bloc)
//   POST /:gid/inscription  { email, consentement, source, site_web (piège invisible), t (ms depuis l'affichage) }

'use strict';

const express = require('express');
const { ErreurBoutique } = require('../services/boutique_limites');
const svc = require('../services/boutique_infolettre');

const router = express.Router();

// IP réelle : dernière valeur de X-Forwarded-For (ajoutée par notre proxy), sinon l'IP directe
function ipClient(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return xff.length ? xff[xff.length - 1] : (req.ip || (req.socket && req.socket.remoteAddress) || 'inconnue');
}
const gidDe = (req) => { const n = parseInt(req.params.gid, 10); return Number.isInteger(n) && n > 0 ? n : null; };

router.get('/:gid/config', async (req, res) => {
  try {
    const gid = gidDe(req); if (!gid) return res.status(404).json({ error: 'Introuvable' });
    const c = await svc.configPublique(gid);
    if (!c) return res.status(404).json({ error: 'Introuvable' });
    res.json(c);
  } catch (e) { console.error('[boutique_infolettre_public] config', e && e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/:gid/inscription', async (req, res) => {
  try {
    const gid = gidDe(req); if (!gid) return res.status(404).json({ error: 'Introuvable' });
    const b = req.body || {};
    const r = await svc.inscrire(gid, {
      email: b.email, consentement: b.consentement === true, source: b.source, piege: b.site_web,
      delaiMs: typeof b.t === 'number' ? b.t : NaN, ip: ipClient(req),
    });
    res.status(r.deja_inscrit ? 200 : 201).json(r);
  } catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_infolettre_public] inscription', e && e.message); res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

module.exports = router;