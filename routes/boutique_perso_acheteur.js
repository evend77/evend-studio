// CHEMIN : routes/boutique_perso_acheteur.js
// e-Vend Studio — Add-on « Produits personnalisés » (boutique solo), partie ACHETEUR connecté. Monté par routes/boutique_acheteur.js (déjà protégé) sur …/acheteur/:gid/perso
//   POST /fichier  (multipart, champ « file ») → { id, url, nom } : image JPEG/PNG/WebP, 5 Mo max, vérifiée sur son vrai contenu

'use strict';

const express = require('express');
const multer = require('multer');
const { ErreurCommande } = require('../services/boutique_commandes_erreur');
const svc = require('../services/boutique_perso');

const router = express.Router({ mergeParams: true });
const envoi = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('file');

router.post('/fichier', (req, res) => {
  envoi(req, res, async (err) => {
    if (err) { const gros = err.code === 'LIMIT_FILE_SIZE'; return res.status(gros ? 413 : 400).json({ message: gros ? 'Image trop lourde (max 5 Mo).' : 'Envoi invalide.' }); }
    try { res.status(201).json(await svc.televerser(req.gid, req.acheteurId, req.file)); }
    catch (e) {
      if (e instanceof ErreurCommande) return res.status(e.status).json({ message: e.message });
      console.error('[boutique_perso_acheteur]', e && e.message); res.status(500).json({ message: 'Erreur serveur' });
    }
  });
});
module.exports = router;