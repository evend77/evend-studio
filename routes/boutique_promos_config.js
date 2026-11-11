// CHEMIN : routes/boutique_promos_config.js
// e-Vend Studio — Codes promo du gestionnaire (templates boutique, solo).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/promos
//   GET /  ·  POST /  ·  PUT /:id  ·  DELETE /:id
// Le code est appliqué à la caisse par services/boutique_commandes.js (vérifié et recalculé par le serveur).

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const P = require('../services/boutique_promos');
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
    console.error('[boutique_promos_config]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const idDe = (req) => { const n = parseInt(req.params.id, 10); if (!Number.isInteger(n) || n <= 0) throw new ErreurCommande('Code introuvable.', 404); return n; };

router.get('/', h(async (req, res) => { res.json({ codes: await P.lister(req.gid) }); }));
router.post('/', h(async (req, res) => { res.status(201).json({ code: await P.creer(req.gid, req.body || {}) }); }));
router.put('/:id', h(async (req, res) => { res.json({ code: await P.modifier(req.gid, idDe(req), req.body || {}) }); }));
router.delete('/:id', h(async (req, res) => { await P.supprimer(req.gid, idDe(req)); res.json({ message: 'Code supprimé' }); }));

module.exports = router;