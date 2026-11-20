// CHEMIN : routes/boutique_analytique_gestionnaire.js
// e-Vend Studio — Add-on « Analytique » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/analytique
//   GET /?periode=30   → statistiques de SA boutique + addon_actif + état de la bannière de cookies   (lisible même sans l'add-on)
// Scopé sur le gestionnaire connecté (jamais un id venant du client).

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const V = require('../services/boutique_analytique');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_analytique_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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

router.get('/', h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await V.lire(req.gid, req.query.periode));
}));

module.exports = router;