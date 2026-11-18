// CHEMIN : routes/boutique_questions_gestionnaire.js
// e-Vend Studio — Add-on « Questions sur le produit » (boutique solo), partie GESTIONNAIRE (il est le vendeur : il répond ET modère).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/questions
//   GET    /mes?statut=attente|publiee|masquee|signalees &q= &page=   liste + compteurs + { addon_actif, questions_actif }
//   GET    /compte                                                      { attente, signalees, a_traiter }  (pastille du menu)
//   PUT    /reglage                 { actif }   accepter ou non les questions sur mes produits
//   POST   /:id/repondre            { reponse } publie la question avec sa réponse (ou corrige la réponse)
//   POST   /:id/masquer             { raison }  retire la question (raison obligatoire)
//   POST   /:id/retablir            POST /:id/ignorer-signalements      DELETE /:id
// La liste et la modération restent accessibles si l'add-on est désactivé ; répondre exige l'add-on.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const Q = require('../services/boutique_questions');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_questions_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const idQ = (req, res) => { const id = entier(req.params.id); if (!id) res.status(400).json({ error: 'Question invalide.' }); return id; };

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

router.get('/compte', h(async (req, res) => { res.json(await Q.compte(req.gid)); }));

router.get('/mes', h(async (req, res) => {
  const d = await Q.liste(req.gid, { statut: req.query.statut, q: req.query.q, page: req.query.page });
  res.json({ addon_actif: await Q.actifPourBoutique(req.gid), questions_actif: await Q.questionsAcceptees(req.gid), ...d });
}));

router.put('/reglage', h(async (req, res) => {
  if (!(await Q.actifPourBoutique(req.gid))) return res.status(403).json({ error: "L'add-on « Questions sur le produit » n'est pas activé. Activez-le dans « Mon plan & limites »." });
  const actif = await Q.ecrireReglage(req.gid, req.body && req.body.actif);
  res.json({ questions_actif: actif, message: actif ? 'Les acheteurs peuvent poser des questions sur vos produits.' : 'Les questions sont désactivées sur vos produits (les réponses déjà publiées sont conservées mais masquées).' });
}));

router.post('/:id/repondre', h(async (req, res) => { const id = idQ(req, res); if (!id) return; res.json(await Q.repondre({ gid: req.gid, questionId: id, reponse: req.body && req.body.reponse })); }));
router.post('/:id/masquer', h(async (req, res) => { const id = idQ(req, res); if (!id) return; res.json(await Q.masquer({ gid: req.gid, questionId: id, raison: req.body && req.body.raison })); }));
router.post('/:id/retablir', h(async (req, res) => { const id = idQ(req, res); if (!id) return; res.json(await Q.retablir({ gid: req.gid, questionId: id })); }));
router.post('/:id/ignorer-signalements', h(async (req, res) => { const id = idQ(req, res); if (!id) return; res.json(await Q.ignorerSignalements({ gid: req.gid, questionId: id })); }));
router.delete('/:id', h(async (req, res) => { const id = idQ(req, res); if (!id) return; res.json(await Q.supprimer({ gid: req.gid, questionId: id })); }));

module.exports = router;