// CHEMIN : routes/boutique_avis_acheteur.js
// e-Vend Studio — Add-on « Avis clients » (boutique solo), partie ACHETEUR.
// Monté par routes/boutique_acheteur.js (après sa garde : req.gid et req.acheteurId sont déjà vérifiés) sur /api/boutique/acheteur/:gid/avis
//   GET    /            { actif, a_evaluer[], avis[], config }   produits que je peux évaluer + mes avis
//   POST   /            { produit_id, commande_id, note, titre?, commentaire, photos? }   déposer un avis
//   PUT    /:id         { note, titre?, commentaire, photos? }                           modifier mon avis
//   DELETE /:id                                                                           supprimer mon avis
//   POST   /photo       (multipart, champ « photo »)                                      envoyer une photo → { url }

'use strict';

const express = require('express');
const multer = require('multer');
const { ErreurBoutique } = require('../services/boutique_limites');
const V = require('../services/boutique_avis');
const PH = require('../services/boutique_avis_photos');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ message: e.message, error: e.message });
    console.error('[boutique_avis_acheteur]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ message: 'Erreur serveur', error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const mauvais = (res, m) => res.status(400).json({ message: m, error: m });

// Écritures : 12 par minute et par acheteur ; photos : 15 par minute
const compteurs = new Map();
const limiter = (nom, max) => (req, res, next) => {
  const k = `${nom}:${req.gid}:${req.acheteurId}`, n = Date.now(), c = compteurs.get(k);
  if (!c || n - c.debut > 60000) { compteurs.set(k, { debut: n, n: 1 }); if (compteurs.size > 5000) for (const [kk, v] of compteurs) if (n - v.debut > 60000) compteurs.delete(kk); return next(); }
  if (c.n >= max) return res.status(429).json({ message: 'Trop de demandes, réessayez dans un instant.', error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};
const limiteEcriture = limiter('e', 12);
const limitePhoto = limiter('p', 15);

const televerser = multer({ storage: multer.memoryStorage(), limits: { fileSize: PH.MAX_OCTETS, files: 1 } }).single('photo');

router.get('/', h(async (req, res) => { res.json(await V.etatAcheteur(req.gid, req.acheteurId)); }));

router.post('/photo', limitePhoto, (req, res) => {
  televerser(req, res, (err) => {
    if (err) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Photo trop lourde (5 Mo maximum).' : 'Envoi invalide.', error: 'Envoi invalide.' });
    h(async () => {
      if (!req.file) return mauvais(res, 'Aucune photo reçue.');
      res.status(201).json(await V.envoyerPhoto({ gid: req.gid, acheteurId: req.acheteurId, buffer: req.file.buffer }));
    })(req, res);
  });
});

router.post('/', limiteEcriture, h(async (req, res) => {
  const b = req.body || {};
  res.status(201).json(await V.creer({ gid: req.gid, acheteurId: req.acheteurId, produitId: b.produit_id, commandeId: b.commande_id, note: b.note, titre: b.titre, commentaire: b.commentaire, photos: b.photos }));
}));

router.put('/:id', limiteEcriture, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return mauvais(res, 'Avis invalide.');
  const b = req.body || {};
  res.json(await V.modifier({ gid: req.gid, acheteurId: req.acheteurId, id, note: b.note, titre: b.titre, commentaire: b.commentaire, photos: b.photos }));
}));

router.delete('/:id', limiteEcriture, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return mauvais(res, 'Avis invalide.');
  res.json(await V.supprimerParAcheteur({ gid: req.gid, acheteurId: req.acheteurId, id }));
}));

module.exports = router;