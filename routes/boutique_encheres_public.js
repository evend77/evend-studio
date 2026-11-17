// CHEMIN : routes/boutique_encheres_public.js
// e-Vend Studio — Add-on « Enchères » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/encheres
//   GET /:gid/produit/:produitId   → { enchere | null, maintenant }   (page produit)
//   GET /:gid                      → enchères en cours (?page= ?limit= ?tri=fin_proche|recent|mise_asc|mise_desc|nb_mises ?reserve=1)
//   GET /:gid/:id/mises            → dernières mises (noms masqués)
// Aucune connexion exigée. Les enchères déjà lancées restent visibles même si l'add-on est désactivé ensuite (elles vont jusqu'au bout).

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const E = require('../services/boutique_encheres');

const router = express.Router();
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

// Limite de lectures : 600 par 5 minutes et par adresse
const m = new Map();
const limite = (req, res, next) => {
  const k = 'ip:' + req.ip, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 300000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 300000) m.delete(kk); return next(); }
  if (c.n >= 600) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

function acheteurConnecte(req, gid) {
  const cookie = req.cookies && req.cookies[`mv_token_${gid}`];
  const a = req.headers.authorization;
  const token = cookie || (a && a.startsWith('Bearer ') ? a.slice(7) : null);
  if (!token) return null;
  try { const p = jwt.verify(token, process.env.JWT_SECRET); return p.gestionnaireId === gid && p.type === 'acheteur' ? p.id : null; } catch (e) { return null; }
}

router.get('/:gid/produit/:produitId', limite, async (req, res) => {
  try {
    const gid = entier(req.params.gid), pid = entier(req.params.produitId);
    if (!gid || !pid) return res.json({ enchere: null });
    res.json(await E.infoProduit(gid, pid, acheteurConnecte(req, gid)));
  } catch (e) {
    console.error('[boutique_encheres_public]', e && e.message ? e.message : e);
    res.json({ enchere: null });
  }
});

router.get('/:gid/:id/mises', limite, async (req, res) => {
  try {
    const gid = entier(req.params.gid), id = entier(req.params.id);
    if (!gid || !id) return res.json({ mises: [] });
    res.json({ mises: await E.mises(gid, id) });
  } catch (e) {
    console.error('[boutique_encheres_public]', e && e.message ? e.message : e);
    res.json({ mises: [] });
  }
});

router.get('/:gid', limite, async (req, res) => {
  const gid = entier(req.params.gid);
  const vide = { encheres: [], page: 1, pagination: { total: 0, page: 1, limit: 24, pages: 1 } };
  try {
    if (!gid) return res.json(vide);
    res.json(await E.listePublique(gid, { page: req.query.page, limit: req.query.limit, tri: req.query.tri, reserve: req.query.reserve === '1' }));
  } catch (e) {
    console.error('[boutique_encheres_public]', e && e.message ? e.message : e);
    res.json(vide);
  }
});

module.exports = router;