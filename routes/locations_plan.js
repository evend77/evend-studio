// CHEMIN : routes/locations_plan.js
// e-Vend Studio — Location de biens : palier du gestionnaire. Monté sur : /api/locations/plan   (connexion requise)
//   GET /  → { success, limite, nb_objets, palier_actuel, paliers:[{label,limite,prix,plan_id}] }   (limite = null : aucune limite)
//   PUT /  { limite } → choisit le palier (refusé si le catalogue contient trop d'objets)

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const L = require('../services/locations_limites');

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ message: 'Accès réservé aux gestionnaires.' });
    res.json({ success: true, ...(await L.etatPourPage(req.user.id)) });
  } catch (e) {
    console.error('❌ GET locations/plan :', e.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ message: 'Accès réservé aux gestionnaires.' });
    const limite = parseInt((req.body || {}).limite, 10);
    if (!Number.isInteger(limite) || limite < 1) return res.status(400).json({ message: 'Palier invalide.' });
    res.json({ success: true, ...(await L.changerPalier(req.user.id, limite)) });
  } catch (e) {
    if (e instanceof L.ErreurLocation) return res.status(e.status).json(Object.assign({ message: e.message, code: e.code }, e.extra || {}));
    console.error('❌ PUT locations/plan :', e.message);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;