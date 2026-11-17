// CHEMIN : routes/boutique_negociations_gestionnaire.js
// e-Vend Studio — Add-on « Faire une offre » (boutique solo), partie GESTIONNAIRE (il est le vendeur). Adapté de routes/studio_negociations.js (MV, côté collaborateur).
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/negociations
//   GET  /mes?etat=&page=&q=              offres reçues + compteurs + réglages
//   GET  /compte                          { a_repondre } (pastille du menu)
//   POST /:id/accepter | refuser | contre { prix?, message? }
//   PUT  /reglages                        { actif, min_pct, validite_h, reponse_jours, max_par_jour }
// Accès : gestionnaire connecté dont l'add-on est activé (sinon 403).

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const N = require('../services/boutique_negociations');

const router = express.Router();
const PAR_PAGE = 20;
const ETATS = ['attente', 'contre', 'acceptee', 'refusee', 'annulee', 'payee', 'expiree'];

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_negociations_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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
  if (!(await N.actifPourBoutique(req.gid))) return res.status(403).json({ error: "L'add-on « Faire une offre » n'est pas activé. Activez-le dans « Mon plan & limites »." });
  next();
}));

const reglagesSortie = (c) => ({ actif: c.actif, min_pct: c.minPct, validite_h: c.validiteH, reponse_jours: c.reponseJours, max_par_jour: c.maxParJour });

router.get('/mes', h(async (req, res) => {
  const pg = Math.min(Math.max(entier(req.query.page) || 1, 1), 100000);
  const etat = ETATS.includes(req.query.etat) ? req.query.etat : '';
  const params = [req.gid]; const where = ['n.gestionnaire_id = $1'];
  if (etat) { params.push(etat); where.push(`${N.sqlEtat('n')} = $${params.length}`); }
  const mo = motif(req.query.q);
  if (mo) { params.push(mo); where.push(`(n.titre ILIKE $${params.length} OR p.sku ILIKE $${params.length})`); }
  params.push(PAR_PAGE, (pg - 1) * PAR_PAGE);
  const r = await pool.query(
    `SELECT n.*, ${N.sqlEtat('n')} AS etat, NULLIF(TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')), '') AS acheteur_nom, p.sku, p.stock, COUNT(*) OVER()::int AS total_lignes
       FROM boutique_negociations n LEFT JOIN marketplace_acheteurs a ON a.id = n.acheteur_id LEFT JOIN produits p ON p.id = n.produit_id
      WHERE ${where.join(' AND ')}
      ORDER BY CASE ${N.sqlEtat('n')} WHEN 'attente' THEN 0 WHEN 'contre' THEN 1 WHEN 'acceptee' THEN 2 ELSE 3 END, n.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const stats = (await pool.query(
    `SELECT COUNT(*) FILTER (WHERE ${N.sqlEtat('n')} = 'attente')::int AS a_repondre, COUNT(*) FILTER (WHERE ${N.sqlEtat('n')} = 'contre')::int AS contre,
            COUNT(*) FILTER (WHERE ${N.sqlEtat('n')} = 'acceptee')::int AS acceptees, COUNT(*) FILTER (WHERE n.statut = 'payee')::int AS payees
       FROM boutique_negociations n WHERE n.gestionnaire_id = $1`, [req.gid])).rows[0];
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  res.json({
    addon_actif: true, reglages: reglagesSortie(await N.reglages(req.gid)), total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)), stats,
    offres: r.rows.map((x) => ({ ...N.sortie(x), acheteur: x.acheteur_nom, sku: x.sku || null, stock: x.stock })),
  });
}));

router.get('/compte', h(async (req, res) => {
  const r = await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_negociations n WHERE n.gestionnaire_id = $1 AND ${N.sqlEtat('n')} = 'attente'`, [req.gid]);
  res.json({ a_repondre: r.rows[0].n });
}));

for (const action of ['accepter', 'refuser', 'contre']) {
  router.post(`/:id/${action}`, h(async (req, res) => {
    const id = entier(req.params.id); if (!id) return res.status(400).json({ error: 'Offre invalide.' });
    const b = req.body || {};
    await N.repondreVendeur({ gid: req.gid, id, action, prixContre: b.prix, message: b.message });
    res.json({ success: true });
  }));
}

router.put('/reglages', h(async (req, res) => {
  res.json({ success: true, reglages: reglagesSortie(await N.ecrireReglages(req.gid, req.body)) });
}));

module.exports = router;