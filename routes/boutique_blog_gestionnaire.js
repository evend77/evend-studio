// CHEMIN : routes/boutique_blog_gestionnaire.js
// e-Vend Studio — Blog des templates boutique (solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/blog
//   GET    /mes?statut=brouillon|publie|archive &q= &page=   liste (sans le contenu) + { stats }
//   GET    /:id                                              un article complet (pour l'éditeur)
//   POST   /                                                 créer      { titre, contenu, extrait, image_couverture, auteur, tags, statut, date_publication }
//   PUT    /:id                                              modifier   (seulement les champs envoyés ; le slug ne change jamais)
//   DELETE /:id
// L'image de couverture et les images du texte sont envoyées par POST /api/boutique/gestionnaire/upload (déjà existant).

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const B = require('../services/boutique_blog');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_blog_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const idA = (req, res) => { const id = entier(req.params.id); if (!id) res.status(400).json({ error: 'Article invalide.' }); return id; };

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

router.get('/mes', h(async (req, res) => { res.json(await B.lister(req.gid, { statut: req.query.statut, q: req.query.q, page: req.query.page })); }));

router.get('/:id', h(async (req, res) => { const id = idA(req, res); if (!id) return; res.json({ article: await B.lire(req.gid, id) }); }));

router.post('/', h(async (req, res) => { res.status(201).json({ article: await B.creer(req.gid, req.body) }); }));

router.put('/:id', h(async (req, res) => { const id = idA(req, res); if (!id) return; res.json({ article: await B.modifier(req.gid, id, req.body) }); }));

router.delete('/:id', h(async (req, res) => { const id = idA(req, res); if (!id) return; await B.supprimer(req.gid, id); res.json({ ok: true }); }));

module.exports = router;