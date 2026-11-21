// CHEMIN : routes/boutique_infolettre_gestionnaire.js
// e-Vend Studio — Add-on « Infolettre » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/infolettre
//   GET /etat · POST /config · DELETE /cles · POST /tester · GET /abonnes?q&statut&page · DELETE /abonnes/:id · POST /renvoyer · GET /export.csv
// Scopé sur le gestionnaire connecté (jamais un id venant du client). Add-on inactif → 403 { addon_inactif: true }.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const svc = require('../services/boutique_infolettre');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_infolettre_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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

router.get('/etat', h(async (req, res) => res.json(await svc.etat(req.gid))));
router.post('/config', h(async (req, res) => { await svc.enregistrer(req.gid, req.body); res.json(await svc.etat(req.gid)); }));
router.delete('/cles', h(async (req, res) => { await svc.effacerCles(req.gid); res.json(await svc.etat(req.gid)); }));
router.post('/tester', h(async (req, res) => res.json(await svc.tester(req.gid))));
router.get('/abonnes', h(async (req, res) => res.json(await svc.lister(req.gid, { q: req.query.q, statut: req.query.statut, page: req.query.page }))));
router.delete('/abonnes/:id', h(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide' });
  res.json(await svc.supprimer(req.gid, id));
}));
router.post('/renvoyer', h(async (req, res) => res.json(await svc.renvoyer(req.gid))));
router.get('/export.csv', h(async (req, res) => {
  const csv = await svc.exporterCsv(req.gid);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="abonnes-infolettre.csv"');
  res.send(csv);
}));

module.exports = router;