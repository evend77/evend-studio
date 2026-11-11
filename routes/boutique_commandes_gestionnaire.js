// CHEMIN : routes/boutique_commandes_gestionnaire.js
// e-Vend Studio — Commandes et paiements reçus, côté GESTIONNAIRE (templates boutique, solo).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/commandes
//   GET   /?filtre=a_traiter|expediees|livrees|annulees|attente|toutes&q=&page=   → liste + compteurs
//   GET   /paiements/resume?du=AAAA-MM-JJ&au=AAAA-MM-JJ                           → paiements reçus, taxes perçues, remboursements
//   GET   /:id                                                                    → détail
//   PATCH /:id/statut        { statut: 'expediee'|'livree', numero_suivi?, transporteur? }
//   POST  /:id/rembourser    { montant?, remettre_stock?, raison? }  (vide = remboursement total)
//   POST  /:id/annuler       (commande NON payée seulement)

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const G = require('../services/boutique_gestion_commandes');
const { ErreurCommande } = require('../services/boutique_commandes');

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
  catch (e) {
    if (e instanceof ErreurCommande) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_commandes_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const idDe = (req) => { const n = parseInt(req.params.id, 10); if (!Number.isInteger(n) || n <= 0) throw new ErreurCommande('Commande introuvable.', 404); return n; };

router.get('/', h(async (req, res) => { res.json(await G.lister(req.gid, { filtre: req.query.filtre, q: req.query.q, page: req.query.page, limite: req.query.limite })); }));
router.get('/paiements/resume', h(async (req, res) => { res.json(await G.resumePaiements(req.gid, { du: req.query.du, au: req.query.au })); }));
router.get('/:id', h(async (req, res) => { res.json({ commande: await G.detail(req.gid, idDe(req)) }); }));
router.patch('/:id/statut', h(async (req, res) => { res.json({ commande: await G.changerStatut(req.gid, idDe(req), req.body || {}) }); }));
router.post('/:id/rembourser', h(async (req, res) => {
  const b = req.body || {};
  res.json({ commande: await G.rembourser(req.gid, idDe(req), { montant: b.montant, remettreStock: b.remettre_stock === true, raison: b.raison }) });
}));
router.post('/:id/annuler', h(async (req, res) => { res.json({ commande: await G.annulerNonPayee(req.gid, idDe(req)) }); }));

module.exports = router;