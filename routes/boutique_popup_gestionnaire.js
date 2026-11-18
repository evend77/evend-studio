// CHEMIN : routes/boutique_popup_gestionnaire.js
// e-Vend Studio — Add-on « Popup Annonce » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/popup
//   GET /   → { config, existe }   (valeurs par défaut tant que rien n'est enregistré)
//   PUT /   { …champs… } → { config }
// Exige l'add-on « popup_annonce » activé ; scopé sur le gestionnaire connecté (jamais un id venant du client). Les données restent en base si l'add-on est retiré.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const P = require('../services/boutique_popup');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_popup_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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
  if (await P.autorise(req.gid)) return next();
  res.status(403).json({ error: "L'option « Popup Annonce » n'est pas activée pour votre boutique.", addon_inactif: true });
}));

router.get('/', h(async (req, res) => { res.json(await P.lire(req.gid)); }));
router.put('/', h(async (req, res) => { res.json({ config: await P.enregistrer(req.gid, req.body) }); }));

module.exports = router;