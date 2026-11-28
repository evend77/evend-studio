// CHEMIN : routes/mv_prix_public.js
// e-Vend Studio — Multivendeur : prix publics des forfaits (lecture seule, sans connexion). Monté sur : /api/mv/prix
//   GET / → { success, actif, plans:[{ plan_id, nom, prix, vendeurs_max, stockage_go }], a_partir_de_nombre }
// Source unique : les forfaits réglés dans l'admin « ⭐ Forfaits & Plans MV » (table plans_multivendeur, forfaits ACTIFS seulement).
// Aucun prix n'est écrit ici et aucune nouvelle table : les cartes de templates et l'encadré de prix lisent les mêmes forfaits que les gestionnaires MV.

'use strict';

const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const liste = await require('../services/studio_addons').listerPlansMV({ actifSeulement: true });
    const plans = liste
      .filter((p) => Number.isFinite(p.prix) && p.prix >= 0)
      .map((p) => ({ plan_id: p.plan_id, nom: p.nom, prix: p.prix, vendeurs_max: p.vendeurs_max, stockage_go: p.stockage_go }));
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ success: true, actif: plans.length > 0, plans, a_partir_de_nombre: plans.length ? Math.min(...plans.map((p) => p.prix)) : null });
  } catch (e) {
    console.error('❌ GET /mv/prix :', e.message);
    res.status(500).json({ success: false });
  }
});

module.exports = router;