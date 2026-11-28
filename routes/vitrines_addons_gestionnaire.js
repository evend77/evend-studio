// CHEMIN : routes/vitrines_addons_gestionnaire.js
// e-Vend Studio — Vitrines : add-ons du gestionnaire connecté. Monté sur : /api/vitrines-addons
//   GET    /mon-etat        → { addons[], total_ht }
//   POST   /:code/activer
//   DELETE /:code

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const V = require('../services/vitrines_addons');

const router = express.Router();
router.use(authenticateToken);
// Seul un gestionnaire (ou un admin en « ouvrir en tant que ») : l'identifiant vient du jeton, jamais de la requête
router.use((req, res, next) => {
  if (req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès non autorisé.' });
  next();
});

function echec(res, e, ou) {
  if (e instanceof V.ErreurAddon) return res.status(e.status).json({ error: e.message });
  console.error(`❌ ${ou} :`, e.message);
  return res.status(500).json({ error: 'Erreur serveur.' });
}

router.get('/mon-etat', async (req, res) => {
  try { res.json(await V.etat(req.user.id)); }
  catch (e) { echec(res, e, 'GET vitrines-addons/mon-etat'); }
});

router.post('/:code/activer', async (req, res) => {
  try { await V.activer(req.user.id, req.params.code); res.json({ success: true }); }
  catch (e) { echec(res, e, 'POST vitrines-addons/activer'); }
});

router.delete('/:code', async (req, res) => {
  try { await V.desactiver(req.user.id, req.params.code); res.json({ success: true }); }
  catch (e) { echec(res, e, 'DELETE vitrines-addons'); }
});

module.exports = router;