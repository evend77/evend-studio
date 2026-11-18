// CHEMIN : routes/boutique_chatbot_gestionnaire.js
// e-Vend Studio — Add-on « Chatbot » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/chatbot
//   GET  /config            (crée la ligne au premier appel)      PATCH /config  { …champs… }
//   GET|POST /reponses-directes     PUT /reponses-directes  { id, … }     DELETE /reponses-directes/:id
//   GET|POST /blacklist             PUT /blacklist          { id, … }     DELETE /blacklist/:id
//   GET|POST /sources-personnalisees    PUT /sources-personnalisees/:id   DELETE /sources-personnalisees/:id
//   GET  /stats
// Toutes les routes exigent l'add-on « chatbot » activé ; elles sont scopées sur le gestionnaire connecté (jamais un id venant du client).
// Les données déjà saisies restent en base si l'add-on est retiré.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const C = require('../services/boutique_chatbot');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_chatbot_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const idDe = (req, res, v) => { const id = C.entier(v); if (!id) res.status(400).json({ error: 'Identifiant invalide.' }); return id; };

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});
router.use(h(async (req, res, next) => {
  if (await C.autorise(req.gid)) return next();
  res.status(403).json({ error: "L'option « Chatbot » n'est pas activée pour votre boutique.", addon_inactif: true });
}));

router.get('/config', h(async (req, res) => { res.json({ config: await C.configGestionnaire(req.gid) }); }));
router.patch('/config', h(async (req, res) => { res.json({ config: await C.majConfig(req.gid, req.body && req.body.config) }); }));

router.get('/reponses-directes', h(async (req, res) => { res.json({ reponses: await C.RD.lister(req.gid) }); }));
router.post('/reponses-directes', h(async (req, res) => { res.status(201).json({ reponse: await C.RD.creer(req.gid, req.body || {}) }); }));
router.put('/reponses-directes', h(async (req, res) => { const id = idDe(req, res, req.body && req.body.id); if (!id) return; res.json({ reponse: await C.RD.modifier(req.gid, id, req.body) }); }));
router.delete('/reponses-directes/:id', h(async (req, res) => { const id = idDe(req, res, req.params.id); if (!id) return; await C.RD.supprimer(req.gid, id); res.json({ ok: true }); }));

router.get('/blacklist', h(async (req, res) => { res.json({ blacklist: await C.LN.lister(req.gid) }); }));
router.post('/blacklist', h(async (req, res) => { res.status(201).json({ item: await C.LN.creer(req.gid, req.body || {}) }); }));
router.put('/blacklist', h(async (req, res) => { const id = idDe(req, res, req.body && req.body.id); if (!id) return; res.json({ item: await C.LN.modifier(req.gid, id, req.body) }); }));
router.delete('/blacklist/:id', h(async (req, res) => { const id = idDe(req, res, req.params.id); if (!id) return; await C.LN.supprimer(req.gid, id); res.json({ ok: true }); }));

router.get('/sources-personnalisees', h(async (req, res) => { res.json({ sources: await C.SP.lister(req.gid) }); }));
router.post('/sources-personnalisees', h(async (req, res) => { res.status(201).json({ source: await C.SP.creer(req.gid, req.body || {}) }); }));
router.put('/sources-personnalisees/:id', h(async (req, res) => { const id = idDe(req, res, req.params.id); if (!id) return; res.json({ source: await C.SP.modifier(req.gid, id, req.body || {}) }); }));
router.delete('/sources-personnalisees/:id', h(async (req, res) => { const id = idDe(req, res, req.params.id); if (!id) return; await C.SP.supprimer(req.gid, id); res.json({ ok: true }); }));

router.get('/stats', h(async (req, res) => { res.json(await C.stats(req.gid)); }));

module.exports = router;