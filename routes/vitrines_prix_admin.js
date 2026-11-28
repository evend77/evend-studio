// CHEMIN : routes/vitrines_prix_admin.js
// e-Vend Studio — Vitrines : page ADMIN du prix par sous-catégorie. Monté sur : /api/admin/vitrines-prix
//   GET /  → réglages actuels { prix:{ <groupe>: nombre }, devise, suffixe }
//   PUT /  → enregistrer (validé côté serveur ; un groupe sans prix garde son ancien prix affiché)

'use strict';

const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const P = require('../services/vitrines_prix');

const router = express.Router();
router.use(authenticateToken, isAdmin);

router.get('/', async (req, res) => {
  try { res.json(await P.reglages()); }
  catch (e) { console.error('❌ GET admin/vitrines-prix :', e.message); res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.put('/', async (req, res) => {
  try { res.json({ success: true, ...(await P.enregistrer(req.body)) }); }
  catch (e) {
    if (/^(Prix invalide|Devise)/.test(e.message)) return res.status(400).json({ message: e.message });
    console.error('❌ PUT admin/vitrines-prix :', e.message); res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;