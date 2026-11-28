// CHEMIN : routes/vitrines_addons_admin.js
// e-Vend Studio — Vitrines : page ADMIN des prix des add-ons. Monté sur : /api/admin/vitrines-addons
//   GET /        → { addons[] }
//   PUT /:code   → { prix_ht?, actif? }

'use strict';

const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const V = require('../services/vitrines_addons');

const router = express.Router();
router.use(authenticateToken, isAdmin);

router.get('/', async (req, res) => {
  try { res.json({ addons: await V.catalogue() }); }
  catch (e) { console.error('❌ GET admin/vitrines-addons :', e.message); res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.put('/:code', async (req, res) => {
  try { await V.modifier(req.params.code, req.body); res.json({ success: true, addons: await V.catalogue() }); }
  catch (e) {
    if (e instanceof V.ErreurAddon) return res.status(e.status).json({ message: e.message });
    console.error('❌ PUT admin/vitrines-addons :', e.message); res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;