// CHEMIN : routes/boutique_perso_gestionnaire.js
// e-Vend Studio — Add-on « Produits personnalisés » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/perso
//   GET /etat → produits de la boutique + réglage (actif, nb de champs) + polices proposées
//   GET /produit/:id · PUT /produit/:id { actif, champs, faces } · DELETE /produit/:id
// Les photos de faces sont envoyées par /api/boutique/gestionnaire/upload (comme les photos de produits). Add-on inactif → 403 { addon_inactif: true }.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const svc = require('../services/boutique_perso');

const router = express.Router();
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_perso_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id; next();
});
const pid = (req) => { const n = parseInt(req.params.id, 10); if (!Number.isInteger(n) || n <= 0) throw new ErreurBoutique('Produit invalide.', 400); return n; };

router.get('/etat', h(async (req, res) => res.json(await svc.etat(req.gid))));
router.get('/produit/:id', h(async (req, res) => res.json(await svc.lireConfig(req.gid, pid(req)))));
router.put('/produit/:id', h(async (req, res) => res.json(await svc.enregistrerConfig(req.gid, pid(req), req.body))));
router.delete('/produit/:id', h(async (req, res) => res.json(await svc.supprimerConfig(req.gid, pid(req)))));

module.exports = router;