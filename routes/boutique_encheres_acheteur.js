// CHEMIN : routes/boutique_encheres_acheteur.js
// e-Vend Studio — Add-on « Enchères » (boutique solo), partie ACHETEUR. Adapté de routes/studio_encheres.js (MV).
// Monté par routes/boutique_acheteur.js (après sa garde : req.gid et req.acheteurId sont déjà vérifiés) sur /api/boutique/acheteur/:gid/encheres
//   POST /:id/miser            { montant }
//   GET  /mes                  mes enchères (en tête, surpassé, à payer, perdue…) + compteur « à payer »
//   POST /:id/remettre-panier  remet l'article gagné dans mon panier (tant que le délai de paiement court)

'use strict';

const express = require('express');
const { ErreurBoutique } = require('../services/boutique_limites');
const E = require('../services/boutique_encheres');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ message: e.message, error: e.message });
    console.error('[boutique_encheres_acheteur]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ message: 'Erreur serveur', error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

// Mises : 20 par minute et par acheteur
const m = new Map();
const limiteMises = (req, res, next) => {
  const k = `${req.gid}:${req.acheteurId}`, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 60000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 60000) m.delete(kk); return next(); }
  if (c.n >= 20) return res.status(429).json({ message: 'Trop de demandes, réessayez dans un instant.', error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

router.get('/mes', h(async (req, res) => {
  const encheres = await E.mesEncheres(req.gid, req.acheteurId);
  res.json({ encheres, a_payer: encheres.filter((x) => x.etat === 'a_payer').length, maintenant: new Date().toISOString() });
}));

router.post('/:id/miser', limiteMises, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return res.status(400).json({ message: 'Enchère invalide.', error: 'Enchère invalide.' });
  res.json(await E.miser({ gid: req.gid, enchereId: id, acheteurId: req.acheteurId, montant: req.body && req.body.montant }));
}));

router.post('/:id/remettre-panier', limiteMises, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return res.status(400).json({ message: 'Enchère invalide.', error: 'Enchère invalide.' });
  res.json({ success: true, ...(await E.remettreAuPanier({ gid: req.gid, enchereId: id, acheteurId: req.acheteurId })) });
}));

module.exports = router;