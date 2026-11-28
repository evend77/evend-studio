// CHEMIN : routes/locations_prix_public.js
// e-Vend Studio — Location de biens : prix publics (lecture seule, sans connexion). Monté sur : /api/locations/prix
//   GET / → { success, actif, paliers:[{label,limite,prix,prix_nombre}], devise, suffixe, a_partir_de }
// Source unique : la grille réglée dans la page admin Templates → « Locations (tarifs) ». « actif » = false tant que la grille est vide
// (les pages gardent alors le prix de leur sous-catégorie).

'use strict';

const express = require('express');
const P = require('../services/locations_prix');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rg = await P.reglages();
    const paliers = rg.paliers.map((p) => ({ label: p.nom, limite: p.limite, prix: P.formaterPrix(p.prix, rg.devise, rg.suffixe), prix_nombre: p.prix }));
    const min = rg.paliers.length ? Math.min(...rg.paliers.map((p) => p.prix)) : null;
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      success: true, actif: paliers.length > 0, paliers, devise: rg.devise, suffixe: rg.suffixe,
      a_partir_de: min === null ? '' : `À partir de ${P.formaterPrix(min, rg.devise, rg.suffixe)}`,
    });
  } catch (e) {
    console.error('❌ GET /locations/prix :', e.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;