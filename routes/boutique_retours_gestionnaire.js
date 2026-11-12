// CHEMIN : routes/boutique_retours_gestionnaire.js
// e-Vend Studio — Retours côté gestionnaire (templates boutique, solo).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/retours
//   GET /?filtre=a_traiter|en_cours|termines|tous · GET /:id · POST /:id/accepter · /refuser · /recu · /rembourser · PUT /reglages

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const R = require('../services/boutique_retours');
const { ErreurCommande } = require('../services/boutique_commandes_erreur');

const router = express.Router();

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

const h = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (e instanceof ErreurCommande) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_retours_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const idDe = (req) => { const n = parseInt(req.params.id, 10); if (!Number.isInteger(n) || n <= 0) throw new ErreurCommande('Retour introuvable.', 404); return n; };

router.get('/', h(async (req, res) => { res.json(await R.listerGest(req.gid, String(req.query.filtre || 'tous'))); }));
router.put('/reglages', h(async (req, res) => { res.json({ reglages: await R.majReglages(req.gid, req.body || {}) }); }));
router.get('/:id', h(async (req, res) => { res.json({ retour: await R.detailGest(req.gid, idDe(req)) }); }));
router.post('/:id/accepter', h(async (req, res) => { res.json({ retour: await R.accepter(req.gid, idDe(req), req.body || {}) }); }));
router.post('/:id/refuser', h(async (req, res) => { res.json({ retour: await R.refuser(req.gid, idDe(req), req.body || {}) }); }));
router.post('/:id/recu', h(async (req, res) => { res.json({ retour: await R.recu(req.gid, idDe(req), { remettreStock: !!(req.body || {}).remettre_stock }) }); }));
router.post('/:id/rembourser', h(async (req, res) => { const b = req.body || {}; res.json({ retour: await R.rembourser(req.gid, idDe(req), { montant: b.montant, raison: b.raison }) }); }));

module.exports = router;