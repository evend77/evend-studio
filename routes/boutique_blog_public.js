// CHEMIN : routes/boutique_blog_public.js
// e-Vend Studio — Blog des templates boutique (solo), partie PUBLIQUE (sans connexion). Monté par routes/boutique_index.js sur /api/boutique/blog
//   GET /:gid?page=&limite=        → { total, page, pages, articles[] }   articles publiés seulement, sans le contenu (léger)
//   GET /:gid/article/:slug        → { article }                           l'article complet (contenu déjà nettoyé) ; compte une vue par visiteur et par heure

'use strict';

const express = require('express');
const { ErreurBoutique } = require('../services/boutique_limites');
const B = require('../services/boutique_blog');

const router = express.Router();
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

const m = new Map();
const limite = (req, res, next) => {
  const k = 'ip:' + req.ip, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 300000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 300000) m.delete(kk); return next(); }
  if (c.n >= 600) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_blog_public]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

router.use(limite);

router.get('/:gid', h(async (req, res) => {
  const gid = entier(req.params.gid);
  if (!gid) return res.status(400).json({ error: 'Boutique invalide.' });
  res.json(await B.listePublique(gid, req.query.page, req.query.limite));
}));

router.get('/:gid/article/:slug', h(async (req, res) => {
  const gid = entier(req.params.gid);
  if (!gid) return res.status(400).json({ error: 'Boutique invalide.' });
  const a = await B.articlePublic(gid, req.params.slug);
  B.compterVue(gid, a.id, req.ip).then((ok) => { if (ok) a.vues += 1; }).catch(() => {});
  res.json({ article: a });
}));

module.exports = router;