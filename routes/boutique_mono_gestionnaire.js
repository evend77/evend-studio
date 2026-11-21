// CHEMIN : routes/boutique_mono_gestionnaire.js
// e-Vend Studio — Template Mono-produit : le gestionnaire voit et change SON produit vendu.
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/mono-produit
//   GET /   → { mono, retenu_id, produits:[{id,titre,prix,photo}] }   (annonces actives ; mono:false si le template n'est pas le mono-produit)
//   PUT /   → { produit_id }  choisit le produit vendu (doit être une de ses annonces actives)

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const M = require('../services/boutique_mono');

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
  catch (e) { console.error('[boutique_mono_gestionnaire]', req.method, req.path, e && e.message ? e.message : e); res.status(500).json({ error: 'Erreur serveur' }); }
};

router.get('/', h(async (req, res) => { res.json(await M.etat(req.gid)); }));

router.put('/', h(async (req, res) => {
  if (!(await M.estMono(req.gid))) return res.status(403).json({ error: "Cette option est réservée au template Mono-produit." });
  const id = Number(req.body && req.body.produit_id);
  if (!Number.isInteger(id) || id <= 0 || id >= 2147483647) return res.status(400).json({ error: 'Produit invalide.' });
  if (!(await M.choisir(req.gid, id))) return res.status(404).json({ error: "Choisissez une de vos annonces actives." });
  res.json({ success: true, ...(await M.etat(req.gid)) });
}));

module.exports = router;