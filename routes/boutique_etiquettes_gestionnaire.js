// CHEMIN : routes/boutique_etiquettes_gestionnaire.js
// e-Vend Studio — Add-on « Étiquettes Shippo » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/etiquettes
//   GET  /config                       → état (add-on actif, clé configurée oui/non, mode, URL du webhook, adresse complète) — jamais la clé
//   PUT  /shippo                       → { token?, actif?, effacer? } enregistre / active / désactive / efface la clé Shippo
//   GET  /commandes/:id/apercu         → poids connu des articles + état de l'adresse d'expédition
//   POST /commandes/:id/tarifs         → { poids_kg?, longueur_cm?, largeur_cm?, hauteur_cm? } → tarifs disponibles
//   POST /commandes/:id/etiquette      → { rate_id, transporteur? } achète l'étiquette et passe la commande à « expédiée »
// Scopé sur le gestionnaire connecté (jamais un id venant du client).

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const E = require('../services/boutique_etiquettes');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_etiquettes_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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
const idCmd = (req) => { const n = parseInt(req.params.id, 10); if (!Number.isInteger(n) || n <= 0) throw new ErreurBoutique('Commande introuvable', 404); return n; };

router.get('/config', h(async (req, res) => { res.set('Cache-Control', 'no-store'); res.json(await E.etatConfig(req.gid)); }));

router.put('/shippo', h(async (req, res) => {
  const b = req.body || {};
  await E.enregistrerShippo(req.gid, { token: b.token, actif: typeof b.actif === 'boolean' ? b.actif : undefined, effacer: b.effacer === true });
  res.json(await E.etatConfig(req.gid));
}));

router.get('/commandes/:id/apercu', h(async (req, res) => { res.set('Cache-Control', 'no-store'); res.json(await E.apercu(req.gid, idCmd(req))); }));
router.post('/commandes/:id/tarifs', h(async (req, res) => { res.json(await E.tarifs(req.gid, idCmd(req), req.body || {})); }));
router.post('/commandes/:id/etiquette', h(async (req, res) => { res.json(await E.acheter(req.gid, idCmd(req), req.body || {})); }));

module.exports = router;