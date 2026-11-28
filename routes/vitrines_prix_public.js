// CHEMIN : routes/vitrines_prix_public.js
// e-Vend Studio — Vitrines : prix publics par sous-catégorie (lecture seule, sans connexion). Monté sur : /api/vitrines/prix
//   GET / → { success, actif, groupes:{ <groupe>:{ prix_texte, prix_nombre } }, devise, suffixe }
// « actif » = false tant qu'aucun prix n'est saisi dans la page admin Templates → « Vitrines (tarifs) ».

'use strict';

const express = require('express');
const P = require('../services/vitrines_prix');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rg = await P.reglages();
    const groupes = {};
    for (const g of Object.keys(rg.prix)) groupes[g] = { prix_texte: P.formaterPrix(rg.prix[g], rg.devise, rg.suffixe), prix_nombre: rg.prix[g] };
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, actif: Object.keys(groupes).length > 0, groupes, devise: rg.devise, suffixe: rg.suffixe });
  } catch (e) {
    console.error('❌ GET /vitrines/prix :', e.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;