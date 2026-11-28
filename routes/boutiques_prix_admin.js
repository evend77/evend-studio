// CHEMIN : routes/boutiques_prix_admin.js
// e-Vend Studio — Templates boutique : page ADMIN de la grille de prix unique. Monté sur : /api/admin/boutiques-prix
//   GET /  → réglages actuels { paliers:[{nom,limite,prix}], devise, suffixe }
//   PUT /  → enregistrer (validé côté serveur ; paliers vides = retour aux « Prix Template »)

'use strict';

const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const P = require('../services/boutiques_prix');

const router = express.Router();
router.use(authenticateToken, isAdmin);

router.get('/', async (req, res) => {
  try { res.json(await P.reglages()); }
  catch (e) { console.error('❌ GET admin/boutiques-prix :', e.message); res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.put('/', async (req, res) => {
  try { res.json({ success: true, ...(await P.enregistrer(req.body)) }); }
  catch (e) {
    if (/^(Entre|Chaque|Prix invalide|Deux paliers|Devise)/.test(e.message)) return res.status(400).json({ message: e.message });
    console.error('❌ PUT admin/boutiques-prix :', e.message); res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;