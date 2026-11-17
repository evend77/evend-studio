// CHEMIN : routes/boutique_addons_gestionnaire.js
// e-Vend Studio — Add-ons du gestionnaire des templates boutique (solo). Monté par routes/boutique_index.js sur
// /api/boutique/gestionnaire/addons.
//   GET    /                → catalogue offert + état d'activation + total mensuel
//   POST   /:code/activer   → activer un add-on
//   DELETE /:code           → désactiver un add-on
// Accès : gestionnaire connecté, sur SES add-ons seulement.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const L = require('../services/boutique_limites');
const A = require('../services/boutique_addons');

const router = express.Router();
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof L.ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_addons]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

const CODE = /^[a-z0-9_]{2,50}$/;
const codeValide = (req) => { const c = String(req.params.code || ''); if (!CODE.test(c)) throw new L.ErreurBoutique('Code invalide.', 400); return c; };

router.get('/', h(async (req, res) => { res.json(await A.etat(req.gid)); }));

router.post('/:code/activer', h(async (req, res) => {
  const r = await A.activer(req.gid, codeValide(req));
  res.json({ success: true, ...r, ...(await A.etat(req.gid)) });
}));

router.delete('/:code', h(async (req, res) => {
  const r = await A.desactiver(req.gid, codeValide(req));
  res.json({ success: true, ...r, ...(await A.etat(req.gid)) });
}));

module.exports = router;