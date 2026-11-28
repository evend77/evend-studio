// CHEMIN : routes/vitrines_pwa_routes.js
// Add-on « App installable (PWA) » des sites vitrine. Monté sur : /api/vitrines-pwa
//   PUBLIC  GET  /manifest.webmanifest   → manifest du site selon le domaine visité
//   PUBLIC  POST /installation           → { device_id, plateforme }
//   GET     /gestionnaire                → configuration + statistiques
//   POST    /gestionnaire                → nom, nom court, couleurs
//   POST    /gestionnaire/icone          → téléverser l'icône (PNG carré, min 512 x 512)
//   DELETE  /gestionnaire/icone          → retirer l'icône

const express = require('express');
const S = require('../services/vitrines_pwa');
const { seulementGestionnaire, sur, limiteur, recevoirImage } = require('./vitrines_outils');

const router = express.Router();

router.get('/manifest.webmanifest', sur('vitrines_pwa manifest', async (req, res) => {
  const m = await S.manifestPourHote(req.hostname);
  if (!m) return res.status(404).json({ error: 'Aucune app pour ce domaine' });
  res.set('Cache-Control', 'public, max-age=300');
  res.type('application/manifest+json').send(JSON.stringify(m));
}));

router.post('/installation', limiteur(20, 3600 * 1000, (r) => r.ip || 'inconnue'), sur('vitrines_pwa installation', async (req, res) => {
  const { device_id, plateforme } = req.body || {};
  const r = await S.compterInstallation(req.hostname, device_id, plateforme, req.get('user-agent'));
  if (r === 'invalide') return res.status(400).json({ error: 'device_id invalide' });
  if (r === 'aucune') return res.status(404).json({ error: 'Aucune app pour ce domaine' });
  res.status(r === 'cree' ? 201 : 200).json({ success: true, doublon: r === 'doublon' });
}));

const gest = express.Router();
router.use('/gestionnaire', seulementGestionnaire, gest);

gest.get('/', sur('vitrines_pwa GET', async (req, res) => res.json(await S.lire(req.user.id))));
gest.post('/', sur('vitrines_pwa POST', async (req, res) => {
  await S.enregistrer(req.user.id, req.body);
  res.json({ ok: true });
}));
gest.post('/icone', limiteur(10, 60 * 1000, (r) => r.user.id), recevoirImage, sur('vitrines_pwa icone', async (req, res) => {
  res.status(201).json({ ok: true, icone_url: await S.televerserIcone(req.user.id, req.file.buffer) });
}));
gest.delete('/icone', sur('vitrines_pwa DELETE icone', async (req, res) => {
  await S.retirerIcone(req.user.id);
  res.json({ ok: true });
}));

module.exports = router;