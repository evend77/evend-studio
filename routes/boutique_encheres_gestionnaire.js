// CHEMIN : routes/boutique_encheres_gestionnaire.js
// e-Vend Studio — Add-on « Enchères » (boutique solo), partie GESTIONNAIRE (il est le vendeur). Adapté de routes/studio_encheres_admin.js + studio_encheres.js (MV).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/encheres
//   GET  /mes?statut=&page=   SES enchères (active | attente_paiement | payee | expiree | sans_gagnant | annulee) + compteurs + réglages
//   GET  /produits?q=         ses produits actifs, avec la raison si une enchère n'est pas possible (sélecteur)
//   POST /                    { produit_id, prix_depart, prix_reserve?, duree_heures }   (add-on activé requis)
//   POST /:id/annuler         annule une enchère EN COURS (même avec des mises) ; l'unité revient en stock
//   GET  /config              { addon_actif, reglages, apparence }   (page « Config enchère »)
//   PUT  /apparence           { modele, secondes, format_date, nb_mises, meneur, evidence, confirmer, libelle_confirmer, prefill, reserve }   (add-on activé requis)
//   PUT  /reglages            { actif, duree_min_h, duree_max_jours, increment_min, reserve_permise, delai_paiement_h }   (add-on activé requis)
// La liste reste lisible même si l'add-on est désactivé (les enchères déjà lancées vont jusqu'au bout).

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const E = require('../services/boutique_encheres');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_encheres_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
function motif(q) {
  const t = typeof q === 'string' ? q.trim().slice(0, 80) : '';
  return t ? '%' + t.replace(/[\\%_]/g, (c) => '\\' + c) + '%' : null;
}

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});
const exigerAddon = h(async (req, res, next) => {
  if (!(await E.actifPourBoutique(req.gid))) return res.status(403).json({ error: "L'add-on « Enchères » n'est pas activé. Activez-le dans « Mon plan & limites »." });
  next();
});

const reglagesSortie = (c) => ({ actif: c.actif, duree_min_h: c.dureeMinH, duree_max_jours: c.dureeMaxJours, increment_min: c.increment, reserve_permise: c.reserve, delai_paiement_h: c.delaiPaiementH });

router.get('/mes', h(async (req, res) => {
  const d = await E.listeGestionnaire(req.gid, { statut: req.query.statut, page: req.query.page });
  res.json({ addon_actif: await E.actifPourBoutique(req.gid), reglages: reglagesSortie(await E.reglages(req.gid)), maintenant: new Date().toISOString(), ...d });
}));

router.get('/produits', exigerAddon, h(async (req, res) => {
  res.json({ produits: await E.produitsPourEnchere(req.gid, motif(req.query.q)) });
}));

router.post('/', exigerAddon, h(async (req, res) => {
  const b = req.body || {};
  const pid = entier(b.produit_id);
  if (!pid) return res.status(400).json({ error: 'Produit invalide.' });
  const e = await E.creerEnchere({ gid: req.gid, produitId: pid, prixDepart: b.prix_depart, prixReserve: b.prix_reserve, dureeH: b.duree_heures });
  res.status(201).json({ success: true, id: e.id, date_fin: e.date_fin });
}));

router.post('/:id/annuler', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ error: 'Enchère invalide.' });
  await E.annulerEnchere({ gid: req.gid, enchereId: id });
  res.json({ success: true });
}));

router.get('/config', h(async (req, res) => {
  res.json({ addon_actif: await E.actifPourBoutique(req.gid), reglages: reglagesSortie(await E.reglages(req.gid)), apparence: await E.apparence(req.gid) });
}));

router.put('/apparence', exigerAddon, h(async (req, res) => {
  res.json({ success: true, apparence: await E.ecrireApparence(req.gid, req.body) });
}));

router.put('/reglages', exigerAddon, h(async (req, res) => {
  res.json({ success: true, reglages: reglagesSortie(await E.ecrireReglages(req.gid, req.body)) });
}));

module.exports = router;