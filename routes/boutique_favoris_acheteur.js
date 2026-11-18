// CHEMIN : routes/boutique_favoris_acheteur.js
// e-Vend Studio — Add-on « Favoris » (boutique solo), partie ACHETEUR. Adapté de routes/acheteur_dashboard.js (MV, /wishlist).
// Monté par routes/boutique_acheteur.js (après sa garde : req.gid et req.acheteurId sont déjà vérifiés) sur /api/boutique/acheteur/:gid/favoris
//   GET /                      → { actif, items, ids }   liste vide si l'add-on est inactif
//   POST /                     { produit_id }            ajouter (403 si l'add-on est inactif)
//   POST /synchroniser         { produit_ids: [...] }    transférer la liste d'un visiteur après sa connexion
//   DELETE /:produitId                                   retirer

'use strict';

const express = require('express');
const { ErreurBoutique } = require('../services/boutique_limites');
const F = require('../services/boutique_favoris');

const router = express.Router({ mergeParams: true });

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ message: e.message, error: e.message });
    console.error('[boutique_favoris_acheteur]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ message: 'Erreur serveur', error: 'Erreur serveur' });
  }
};

// 60 écritures par minute et par acheteur
const m = new Map();
const limiteEcriture = (req, res, next) => {
  const k = `${req.gid}:${req.acheteurId}`, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 60000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 60000) m.delete(kk); return next(); }
  if (c.n >= 60) return res.status(429).json({ message: 'Trop de demandes, réessayez dans un instant.', error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

router.get('/', h(async (req, res) => { res.json(await F.lister(req.gid, req.acheteurId)); }));
router.post('/synchroniser', limiteEcriture, h(async (req, res) => { res.json(await F.synchroniser(req.gid, req.acheteurId, req.body && req.body.produit_ids)); }));
router.post('/', limiteEcriture, h(async (req, res) => { res.status(201).json(await F.ajouter(req.gid, req.acheteurId, req.body && req.body.produit_id)); }));
router.delete('/:produitId', limiteEcriture, h(async (req, res) => { res.json(await F.retirer(req.gid, req.acheteurId, req.params.produitId)); }));

module.exports = router;