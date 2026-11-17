// CHEMIN : routes/boutique_negociations_public.js
// e-Vend Studio — Add-on « Faire une offre » (boutique solo), page produit. Monté par routes/boutique_index.js sur /api/boutique/negociations
//   GET /:gid/produit/:produitId   → { actif, min_pct, validite_heures, reponse_jours, maintenant, offre }
// Aucune connexion exigée : sans acheteur connecté, offre = null (jamais d'erreur 401 sur une page publique).
// « actif » est faux si l'add-on est désactivé, si le gestionnaire refuse les offres ou si le produit ne s'y prête pas (enchère, lot, épuisé…).

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const N = require('../services/boutique_negociations');

const router = express.Router();
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

function acheteurConnecte(req, gid) {
  const cookie = req.cookies && req.cookies[`mv_token_${gid}`];
  const a = req.headers.authorization;
  const token = cookie || (a && a.startsWith('Bearer ') ? a.slice(7) : null);
  if (!token) return null;
  try { const p = jwt.verify(token, process.env.JWT_SECRET); return p.gestionnaireId === gid && p.type === 'acheteur' ? p.id : null; } catch (e) { return null; }
}

router.get('/:gid/produit/:produitId', async (req, res) => {
  try {
    const gid = entier(req.params.gid), pid = entier(req.params.produitId);
    if (!gid || !pid) return res.json({ actif: false, offre: null });
    res.json(await N.infoProduit(gid, pid, acheteurConnecte(req, gid)));
  } catch (e) {
    console.error('[boutique_negociations_public]', e && e.message ? e.message : e);
    res.json({ actif: false, offre: null });
  }
});

module.exports = router;