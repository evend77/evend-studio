// CHEMIN : routes/cagnotte_prix_public.js
// e-Vend Studio — Cagnotte : prix publics (lecture seule, sans connexion). Monté sur : /api/cagnotte/prix
//   GET / → { success, paliers:[{id,nom,objectif_max,prix}], duree_max_jours, devise, remboursement:{actif,pct} }
// Source unique : les réglages de la page admin Cagnotte. Rien n'est codé en dur côté pages.

'use strict';

const express = require('express');
const camp = require('../services/cagnotte_campagnes');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rg = await camp.reglages();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      success: true,
      paliers: rg.paliers,
      duree_max_jours: rg.duree_max_jours,
      devise: rg.devise,
      remboursement: { actif: rg.remboursement_actif, pct: rg.remboursement_pct },
    });
  } catch (e) {
    console.error('❌ GET /cagnotte/prix :', e.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;