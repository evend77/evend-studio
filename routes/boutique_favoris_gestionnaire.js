// CHEMIN : routes/boutique_favoris_gestionnaire.js
// e-Vend Studio — Add-on « Favoris » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/favoris
//   GET /      → { config, personnalisee }   (valeurs par défaut tant que rien n'est enregistré)
//   PUT /      { …réglages… } → { config }
//   DELETE /   → { config }                  retour aux réglages par défaut
// Exige l'add-on « favoris » activé ; scopé sur le gestionnaire connecté (jamais un id venant du client).

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const F = require('../services/boutique_favoris');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_favoris_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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
router.use(h(async (req, res, next) => {
  if (await F.autorise(req.gid)) return next();
  res.status(403).json({ error: "L'option « Favoris » n'est pas activée pour votre boutique.", addon_inactif: true });
}));

router.get('/', h(async (req, res) => { res.json(await F.lire(req.gid)); }));
router.put('/', h(async (req, res) => { res.json({ config: await F.enregistrer(req.gid, req.body) }); }));
router.delete('/', h(async (req, res) => { res.json({ config: await F.reinitialiser(req.gid) }); }));

module.exports = router;