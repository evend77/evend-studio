// CHEMIN : routes/boutique_parution_gestionnaire.js
// e-Vend Studio — Add-on « Parution future » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/parution
//   GET /      → { config, personnalisee, addon_actif }   (lisible même sans l'add-on)
//   PUT /      { …réglages… } → { config }               (exige l'add-on « parution_future »)
//   DELETE /   → { config }                              retour aux réglages par défaut
// Scopé sur le gestionnaire connecté (jamais un id venant du client).

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const P = require('../services/boutique_parution');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_parution_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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

router.get('/', h(async (req, res) => { res.json(await P.lire(req.gid)); }));
router.put('/', h(async (req, res) => { res.json({ config: await P.enregistrer(req.gid, req.body) }); }));
router.delete('/', h(async (req, res) => { res.json({ config: await P.reinitialiser(req.gid) }); }));

module.exports = router;