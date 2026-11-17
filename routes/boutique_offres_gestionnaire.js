// CHEMIN : routes/boutique_offres_gestionnaire.js
// e-Vend Studio — Add-on « Offres du jour » (templates boutique solo), partie gestionnaire. Adapté de routes/studio_offres.js (MV, côté collaborateur).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/offres
//   GET    /mes?q=&etat=&page=&produit_id=  → SES produits actifs avec leur offre (état : aucune | venir | cours | terminee)
//   PUT    /:produitId  { prix_offre, debut?, fin }  → crée ou remplace l'offre
//   DELETE /:produitId  → retire l'offre (le prix redevient normal tout de suite)
// Accès : gestionnaire connecté dont l'add-on est activé. Le prix d'offre est appliqué par le serveur (voir services/boutique_offres.js).

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const L = require('../services/boutique_limites');
const O = require('../services/boutique_offres');

const router = express.Router();
const PAR_PAGE = 20;
const ETATS = ['aucune', 'venir', 'cours', 'terminee'];

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof L.ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_offres]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
function motif(q) {
  const t = typeof q === 'string' ? q.trim().slice(0, 80) : '';
  return t ? '%' + t.replace(/[\\%_]/g, (c) => '\\' + c) + '%' : null;
}

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});
router.use(h(async (req, res, next) => {
  if (!(await O.actifPourGestionnaire(req.gid))) return res.status(403).json({ error: "L'add-on « Offres du jour » n'est pas activé. Activez-le dans « Mon plan & limites »." });
  next();
}));

router.get('/mes', h(async (req, res) => {
  const where = [`p.gestionnaire_id = $1`, 'p.collaborateur_id IS NULL', `p.statut = 'actif'`];
  const params = [req.gid];
  const m = motif(req.query.q);
  if (m) { params.push(m); where.push(`(p.titre ILIKE $${params.length} OR p.sku ILIKE $${params.length})`); }
  const pid = entier(req.query.produit_id);
  if (pid) { params.push(pid); where.push(`p.id = $${params.length}`); }
  if (ETATS.includes(req.query.etat)) { params.push(req.query.etat); where.push(`${O.sqlEtat('p')} = $${params.length}`); }
  const W = where.join(' AND ');
  const pg = parseInt(req.query.page, 10);
  const page = Number.isInteger(pg) && pg > 0 && pg < 100000 ? pg : 1;
  const [liste, total, stats] = await Promise.all([
    pool.query(
      `SELECT p.id, p.titre, p.sku, p.photo_principale AS photo, p.prix, p.prix_promo, p.stock, ${O.sqlEtat('p')} AS etat, p.offre_prix, p.offre_debut, p.offre_fin
         FROM produits p WHERE ${W} ORDER BY (p.offre_prix IS NOT NULL AND p.offre_fin > NOW()) DESC, p.created_at DESC, p.id DESC LIMIT ${PAR_PAGE} OFFSET ${(page - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n FROM produits p WHERE ${W}`, params),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE ${O.sqlEtat('p')} = 'cours') AS cours, COUNT(*) FILTER (WHERE ${O.sqlEtat('p')} = 'venir') AS venir,
              COUNT(*) FILTER (WHERE ${O.sqlEtat('p')} = 'terminee') AS terminee
         FROM produits p WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.statut = 'actif'`, [req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const s = stats.rows[0];
  res.json({
    addon_actif: true, total: n, page, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
    stats: { cours: +s.cours, venir: +s.venir, terminee: +s.terminee },
    produits: liste.rows.map((x) => ({
      id: x.id, titre: x.titre, sku: x.sku, photo: x.photo, prix: Number(x.prix), prix_promo: x.prix_promo === null ? null : Number(x.prix_promo),
      stock: x.stock, etat: x.etat,
      offre: x.offre_prix === null ? null : { prix: Number(x.offre_prix), debut: x.offre_debut, fin: x.offre_fin },
    })),
  });
}));

router.put('/:produitId', h(async (req, res) => {
  const produitId = entier(req.params.produitId);
  if (!produitId) throw new L.ErreurBoutique('Produit invalide', 400);
  const b = req.body || {};
  const r = await O.enregistrerOffre({ gid: req.gid, produitId, prixOffre: b.prix_offre, debut: b.debut, fin: b.fin });
  res.json({ ok: true, ...r, message: 'Offre enregistrée.' });
}));

router.delete('/:produitId', h(async (req, res) => {
  const produitId = entier(req.params.produitId);
  if (!produitId) throw new L.ErreurBoutique('Produit invalide', 400);
  await O.retirerOffre({ gid: req.gid, produitId });
  res.json({ ok: true });
}));

module.exports = router;