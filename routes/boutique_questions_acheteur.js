// CHEMIN : routes/boutique_questions_acheteur.js
// e-Vend Studio — Add-on « Questions sur le produit » (boutique solo), partie ACHETEUR. Adapté de routes/studio_questions.js (MV).
// Monté par routes/boutique_acheteur.js (après sa garde : req.gid et req.acheteurId sont déjà vérifiés) sur /api/boutique/acheteur/:gid/questions
//   POST /produit/:produitId   { question }   poser une question (invisible tant que le vendeur n'a pas répondu)
//   POST /:id/signaler                        signaler une question publiée

'use strict';

const express = require('express');
const { ErreurBoutique } = require('../services/boutique_limites');
const Q = require('../services/boutique_questions');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ message: e.message, error: e.message });
    console.error('[boutique_questions_acheteur]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ message: 'Erreur serveur', error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

// 12 écritures par minute et par acheteur
const m = new Map();
const limiteEcriture = (req, res, next) => {
  const k = `${req.gid}:${req.acheteurId}`, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 60000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 60000) m.delete(kk); return next(); }
  if (c.n >= 12) return res.status(429).json({ message: 'Trop de demandes, réessayez dans un instant.', error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

router.post('/produit/:produitId', limiteEcriture, h(async (req, res) => {
  const pid = entier(req.params.produitId); if (!pid) return res.status(400).json({ message: 'Annonce invalide.', error: 'Annonce invalide.' });
  res.status(201).json(await Q.poser({ gid: req.gid, produitId: pid, acheteurId: req.acheteurId, question: req.body && req.body.question }));
}));

router.post('/:id/signaler', limiteEcriture, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return res.status(400).json({ message: 'Question invalide.', error: 'Question invalide.' });
  res.json(await Q.signaler({ gid: req.gid, questionId: id, acheteurId: req.acheteurId }));
}));

module.exports = router;