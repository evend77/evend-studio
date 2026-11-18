// CHEMIN : routes/boutique_avis_gestionnaire.js
// e-Vend Studio — Add-on « Avis clients » (boutique solo), partie GESTIONNAIRE (il est le vendeur : il modère ET répond).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/avis
//   GET    /mes?statut=attente|publie|masque &note= &q= &page=   liste + compteurs + { addon_actif, config }
//   GET    /compte                                                { attente, anciens, a_traiter }  (pastille du menu)
//   GET    /reglages      PUT /reglages      DELETE /reglages     réglages (PUT et DELETE : add-on activé requis pour PUT)
//   POST   /:id/approuver   POST /:id/masquer { raison }   POST /:id/retablir   POST /:id/repondre { reponse }   DELETE /:id/reponse   DELETE /:id
// La liste et le retrait d'un avis restent accessibles si l'add-on est désactivé ; approuver, répondre et changer les réglages exigent l'add-on.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const V = require('../services/boutique_avis');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_avis_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const idAvis = (req, res) => { const id = entier(req.params.id); if (!id) res.status(400).json({ error: 'Avis invalide.' }); return id; };

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

router.get('/compte', h(async (req, res) => { res.json(await V.compte(req.gid)); }));

router.get('/mes', h(async (req, res) => {
  const d = await V.liste(req.gid, { statut: req.query.statut, q: req.query.q, note: req.query.note, page: req.query.page });
  res.json({ addon_actif: await V.autorise(req.gid), config: await V.lireConfig(req.gid), ...d });
}));

router.get('/reglages', h(async (req, res) => { res.json({ addon_actif: await V.autorise(req.gid), config: await V.lireConfig(req.gid), defaut: V.DEFAUT, bornes: V.BORNES }); }));
router.put('/reglages', h(async (req, res) => { res.json({ config: await V.enregistrerConfig(req.gid, req.body), message: 'Réglages enregistrés.' }); }));
router.delete('/reglages', h(async (req, res) => { res.json({ config: await V.reinitialiserConfig(req.gid), message: 'Réglages réinitialisés.' }); }));

router.post('/:id/approuver', h(async (req, res) => { const id = idAvis(req, res); if (!id) return; res.json(await V.approuver({ gid: req.gid, id })); }));
router.post('/:id/masquer', h(async (req, res) => { const id = idAvis(req, res); if (!id) return; res.json(await V.masquer({ gid: req.gid, id, raison: req.body && req.body.raison })); }));
router.post('/:id/retablir', h(async (req, res) => { const id = idAvis(req, res); if (!id) return; res.json(await V.retablir({ gid: req.gid, id })); }));
router.post('/:id/repondre', h(async (req, res) => { const id = idAvis(req, res); if (!id) return; res.json(await V.repondre({ gid: req.gid, id, reponse: req.body && req.body.reponse })); }));
router.delete('/:id/reponse', h(async (req, res) => { const id = idAvis(req, res); if (!id) return; res.json(await V.retirerReponse({ gid: req.gid, id })); }));
router.delete('/:id', h(async (req, res) => { const id = idAvis(req, res); if (!id) return; res.json(await V.supprimerParGestionnaire({ gid: req.gid, id })); }));

module.exports = router;