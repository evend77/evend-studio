// CHEMIN : routes/boutique_inscription.js
// e-Vend Studio — Inscription publique d'un ACHETEUR (templates boutique solo). Monté par routes/boutique_index.js sur :
//   POST /api/boutique/acheteur/:gid/inscription   (aucune connexion requise — monté AVANT la zone connectée)
// La validation suit la config du gestionnaire (champs, âge, termes) : un champ obligatoire manquant est refusé même si la page est contournée.

'use strict';

const express = require('express');
const S = require('../services/boutique_inscription');
const router = express.Router({ mergeParams: true });

router.post('/', async (req, res) => {
  try {
    const gid = parseInt(req.params.gid, 10);
    if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ message: 'Boutique introuvable' });
    const r = await S.inscrire(gid, req.body);
    if (r.statut === 201) return res.status(201).json({ acheteur: r.acheteur });
    return res.status(r.statut).json(r.ferme ? { message: r.message, ferme: true } : { message: r.message });
  } catch (err) {
    console.error('Erreur inscription acheteur boutique:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;