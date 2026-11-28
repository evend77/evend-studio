// CHEMIN : routes/vitrines_effets_routes.js
// Add-on « Effets de boutique » des sites vitrine. Monté sur : /api/vitrines-effets
//   PUBLIC  GET  /public/:gid   → effets + musique à dessiner sur le site ({ actif:false } sinon)
//   GET     /gestionnaire       → réglages enregistrés + musiques disponibles
//   POST    /gestionnaire       → enregistre les réglages (saison, effets, vente, musique)

'use strict';

const express = require('express');
const S = require('../services/vitrines_effets');
const { exigerAddon } = require('../services/vitrines_commun');
const { seulementGestionnaire, sur } = require('./vitrines_outils');

const router = express.Router();

// Petit cache en mémoire (20 s) pour ne pas interroger la base à chaque page vue ; vidé à chaque enregistrement.
// Aucun cache côté navigateur : les changements du gestionnaire apparaissent tout de suite.
const memoire = new Map();
setInterval(() => memoire.clear(), 10 * 60 * 1000).unref();

router.get('/public/:gid', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const gid = Number(req.params.gid);
    if (!Number.isInteger(gid) || gid <= 0 || gid > 2147483647) return res.json({ actif: false });
    const m = memoire.get(gid);
    if (m && Date.now() - m.t < 20000) return res.json(m.d);
    const d = await S.pourSite(gid);
    if (memoire.size > 500) memoire.clear();
    memoire.set(gid, { t: Date.now(), d });
    res.json(d);
  } catch (e) {
    console.error('[vitrines_effets] public', e.message);
    res.json({ actif: false });
  }
});

const gest = express.Router();
router.use('/gestionnaire', seulementGestionnaire, gest);

gest.get('/', sur('vitrines_effets GET', async (req, res) => {
  await exigerAddon(req.user.id, S.CODE_ADDON, S.NOM);
  res.json({ config: await S.lire(req.user.id), musiques: await S.musiquesDisponibles() });
}));
gest.post('/', express.json({ limit: '50kb' }), sur('vitrines_effets POST', async (req, res) => {
  await exigerAddon(req.user.id, S.CODE_ADDON, S.NOM);
  const config = await S.enregistrer(req.user.id, req.body);
  memoire.delete(Number(req.user.id));
  res.json({ ok: true, config });
}));

module.exports = router;