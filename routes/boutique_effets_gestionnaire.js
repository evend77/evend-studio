// CHEMIN : routes/boutique_effets_gestionnaire.js
// e-Vend Studio — Add-on « Effets de boutique » (templates boutique solo), partie gestionnaire.
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/effets
//   GET  /  → réglages enregistrés + musiques disponibles
//   POST /  → enregistre les réglages (saison, effets, effets de vente, musique)
// Accès : gestionnaire connecté dont l'add-on est activé.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const E = require('../services/boutique_effets');
const cache = require('./boutique_effets_public');

const router = express.Router();

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});
router.use(async (req, res, next) => {
  try {
    if (!(await E.actif(req.gid))) return res.status(403).json({ error: "L'add-on « Effets de boutique » n'est pas activé. Activez-le dans « Mon plan & limites »." });
    next();
  } catch (e) {
    console.error('[boutique_effets] addon', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/', async (req, res) => {
  try {
    res.json({ config: await E.lire(req.gid), musiques: await E.musiquesDisponibles() });
  } catch (e) {
    console.error('[boutique_effets] get', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', express.json({ limit: '50kb' }), async (req, res) => {
  try {
    const config = await E.enregistrer(req.gid, req.body);
    cache.vider(req.gid);
    res.json({ ok: true, config });
  } catch (e) {
    console.error('[boutique_effets] post', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;