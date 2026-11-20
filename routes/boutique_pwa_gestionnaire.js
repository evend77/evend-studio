// CHEMIN : routes/boutique_pwa_gestionnaire.js
// e-Vend Studio — Add-on « App installable (PWA) » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/pwa
//   GET /          → configuration + statistiques + addon_actif   (lisible même sans l'add-on)
//   POST /         { nom_app, nom_court, couleur_theme, couleur_fond } → enregistre   (exige l'add-on)
//   POST /icone    → téléverser l'icône (champ « file », PNG carré 512 à 2048 px, max 2 Mo)   (exige l'add-on)
//   DELETE /icone  → retirer l'icône (la PWA se désactive)
// Scopé sur le gestionnaire connecté (jamais un id venant du client).

'use strict';

const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const V = require('../services/boutique_pwa');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_pwa_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

const envoi = multer({ storage: multer.memoryStorage(), limits: { fileSize: V.MAX_OCTETS, files: 1 } }).single('file');
const envois = new Map();

router.get('/', h(async (req, res) => { res.json(await V.lire(req.gid)); }));

router.post('/', express.json({ limit: '4kb' }), h(async (req, res) => {
  await V.enregistrer(req.gid, req.body);
  res.json({ ok: true, ...(await V.lire(req.gid)) });
}));

router.post('/icone', (req, res) => {
  const now = Date.now();
  const rec = (envois.get(req.gid) || []).filter((t) => now - t < 60 * 1000);
  if (rec.length >= 10) return res.status(429).json({ error: "Trop d'envois. Réessayez dans une minute." });
  rec.push(now); envois.set(req.gid, rec);
  envoi(req, res, async (err) => {
    if (err) {
      const gros = err.code === 'LIMIT_FILE_SIZE';
      return res.status(gros ? 413 : 400).json({ error: gros ? 'Image trop lourde (max 2 Mo)' : 'Envoi invalide' });
    }
    try {
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
      const url = await V.televerserIcone(req.gid, req.file.buffer);
      res.status(201).json({ ok: true, icone_url: url });
    } catch (e) {
      if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
      console.error('[boutique_pwa_gestionnaire] icone', e && e.message ? e.message : e);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
});

router.delete('/icone', h(async (req, res) => { await V.retirerIcone(req.gid); res.json({ ok: true }); }));

module.exports = router;