// CHEMIN : routes/vitrines_favicon_routes.js
// Add-on « Favicon personnalisé » des sites vitrine. Monté sur : /api/vitrines-favicon
//   PUBLIC  POST /retour                → visiteur revenu sur l'onglet (site = domaine visité)
//   GET     /gestionnaire               → favicon + animation + statistiques
//   POST    /gestionnaire               → téléverser (PNG carré, 192 à 1024 px, max 2 Mo)
//   DELETE  /gestionnaire               → retirer
//   POST    /gestionnaire/animation     → régler l'animation d'onglet

const express = require('express');
const S = require('../services/vitrines_favicon');
const { seulementGestionnaire, sur, limiteur, recevoirImage } = require('./vitrines_outils');

const router = express.Router();

router.post('/retour', limiteur(60, 3600 * 1000, (r) => r.ip || 'inconnue'), async (req, res) => {
  try { await S.compterRetour(req.hostname); } catch (e) { console.error('[vitrines_favicon] retour', e.message); }
  res.status(204).end();
});

const gest = express.Router();
router.use('/gestionnaire', seulementGestionnaire, gest);

gest.get('/', sur('vitrines_favicon GET', async (req, res) => res.json(await S.lire(req.user.id))));
gest.post('/animation', sur('vitrines_favicon animation', async (req, res) => {
  await S.enregistrerAnimation(req.user.id, req.body);
  res.json({ ok: true });
}));
gest.post('/', limiteur(10, 60 * 1000, (r) => r.user.id), recevoirImage, sur('vitrines_favicon POST', async (req, res) => {
  res.status(201).json({ ok: true, favicon_url: await S.televerser(req.user.id, req.file.buffer) });
}));
gest.delete('/', sur('vitrines_favicon DELETE', async (req, res) => {
  await S.retirer(req.user.id);
  res.json({ ok: true });
}));

module.exports = router;