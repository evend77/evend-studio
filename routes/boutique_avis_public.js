// CHEMIN : routes/boutique_avis_public.js
// e-Vend Studio — Add-on « Avis clients » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/avis
//   GET /:gid/produit/:produitId?page=   → { actif, afficher_moyenne, total, moyenne, repartition, page, pages, avis[] }  (avis publiés seulement)
// Aucune connexion exigée. { actif:false } si l'add-on n'est pas activé ou si le produit n'est pas en vente.

'use strict';

const express = require('express');
const V = require('../services/boutique_avis');

const router = express.Router();
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

const m = new Map();
const limite = (req, res, next) => {
  const k = 'ip:' + req.ip, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 300000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 300000) m.delete(kk); return next(); }
  if (c.n >= 600) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

router.get('/:gid/produit/:produitId', limite, async (req, res) => {
  try {
    const gid = entier(req.params.gid), pid = entier(req.params.produitId);
    if (!gid || !pid) return res.json({ actif: false });
    res.json(await V.infoProduit(gid, pid, req.query.page));
  } catch (e) {
    console.error('[boutique_avis_public]', e && e.message ? e.message : e);
    res.json({ actif: false });
  }
});

module.exports = router;