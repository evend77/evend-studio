// CHEMIN : routes/boutiques_plan.js
// e-Vend Studio — Boutiques (solo) : choix du palier dans la fenêtre « Choisir un template ». Monté sur : /api/boutiques/plan
//   PUT / { limite, template_id } → enregistre gestionnaires.plan = « <famille>-<limite> » pour ce template (refusé si trop de produits actifs)
// Les paliers viennent de la grille de l'admin (Templates → Boutiques (tarifs)) ou, si elle est vide, des « Prix Template ».

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const BL = require('../services/boutique_limites');

const router = express.Router();
router.use(authenticateToken);

router.put('/', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ message: 'Accès réservé aux gestionnaires.' });
    const limite = parseInt((req.body || {}).limite, 10);
    const tid = typeof (req.body || {}).template_id === 'string' ? req.body.template_id.slice(0, 80) : '';
    if (!Number.isInteger(limite) || limite < 1 || !tid.startsWith('boutique-')) return res.status(400).json({ message: 'Palier invalide.' });
    res.json({ success: true, ...(await BL.changerPalier(req.user.id, limite, tid)) });
  } catch (e) {
    if (e instanceof BL.ErreurBoutique) return res.status(e.status).json(Object.assign({ message: e.message }, e.extra || {}));
    console.error('❌ PUT boutiques/plan :', e.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;