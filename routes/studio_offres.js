// CHEMIN : routes/studio_offres.js
// e-Vend Studio — Add-on « Offres du jour » : routes du COLLABORATEUR (la boutique lit les offres via le catalogue public : ?offres=1).
// Monté dans server.js :  app.use('/api/marketplace/:gid/offres', require('./routes/studio_offres'));
//
//   GET    /collaborateur/mes?q=&etat=cours|venir|terminee|aucune&page=   mes produits actifs + état de leur offre (+ stats, durée max)
//   PUT    /collaborateur/:produitId   { prix_offre, debut?, fin }        crée ou remplace l'offre
//   DELETE /collaborateur/:produitId                                      retire l'offre
// La modération du gestionnaire est dans routes/studio_mv_admin.js (/api/studio/mv/:gid/offres).

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const O = require('../services/studio_offres');

const router = express.Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET;
const PAR_PAGE = 20;

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof O.ErreurOffre) return res.status(e.status).json({ error: e.message });
    console.error('[studio_offres]', req.method, req.path, e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const m = new Map();
const limiteEcriture = (req, res, next) => {
  const k = 'u:' + (req.mvUser ? req.mvUser.id : req.ip), n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 60000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 60000) m.delete(kk); return next(); }
  if (c.n >= 30) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

function lireJeton(req) {
  const gid = req.params.gid;
  const cookie = req.cookies && req.cookies[`mv_token_${gid}`];
  const a = req.headers.authorization;
  const token = cookie || (a && a.startsWith('Bearer ') ? a.slice(7) : null);
  if (!token) return null;
  try { const p = jwt.verify(token, JWT_SECRET); return p.gestionnaireId === Number(gid) ? p : null; } catch (e) { return null; }
}
const exigerCollab = (req, res, next) => {
  const p = lireJeton(req);
  if (!p) return res.status(401).json({ error: 'Connexion requise.' });
  if (p.type !== 'collaborateur') return res.status(403).json({ error: 'Un compte collaborateur est requis.' });
  req.mvUser = p; next();
};

const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const gidDe = (req) => entier(req.params.gid);

router.get('/collaborateur/mes', exigerCollab, h(async (req, res) => {
  const gid = gidDe(req), cid = req.mvUser.id;
  const pg = Math.min(Math.max(entier(req.query.page) || 1, 1), 10000);
  const params = [gid, cid]; let filtre = '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  if (q) { params.push('%' + q.replace(/[\\%_]/g, '\\$&') + '%'); filtre += ` AND (p.titre ILIKE $${params.length} OR p.sku ILIKE $${params.length})`; }
  const etat = ['cours', 'venir', 'terminee', 'aucune'].includes(req.query.etat) ? req.query.etat : '';
  if (etat) { params.push(etat); filtre += ` AND ${O.sqlEtat('p')} = $${params.length}`; }
  params.push(PAR_PAGE, (pg - 1) * PAR_PAGE);
  const r = await pool.query(
    `SELECT p.id, p.titre, p.sku, p.prix, p.prix_promo, p.stock, p.photo_principale, p.offre_prix, p.offre_debut, p.offre_fin,
            ${O.sqlEtat('p')} AS etat, ${O.sqlEnchereVivante('p')} AS enchere, COUNT(*) OVER()::int AS total_lignes
       FROM produits p
      WHERE p.gestionnaire_id = $1 AND p.collaborateur_id = $2 AND p.statut = 'actif'${filtre}
      ORDER BY CASE ${O.sqlEtat('p')} WHEN 'cours' THEN 0 WHEN 'venir' THEN 1 WHEN 'aucune' THEN 2 ELSE 3 END, p.offre_fin ASC NULLS LAST, p.titre ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const stats = (await pool.query(
    `SELECT COUNT(*) FILTER (WHERE ${O.sqlEtat('p')} = 'cours')::int AS cours, COUNT(*) FILTER (WHERE ${O.sqlEtat('p')} = 'venir')::int AS venir,
            COUNT(*) FILTER (WHERE ${O.sqlEtat('p')} = 'terminee')::int AS terminee
       FROM produits p WHERE p.gestionnaire_id = $1 AND p.collaborateur_id = $2 AND p.statut = 'actif'`, [gid, cid])).rows[0];
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  const cfg = await O.reglages(gid);
  res.json({
    addon_actif: await O.actifPourBoutique(gid), duree_max_jours: cfg.dureeMaxJours, total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)), stats, maintenant: new Date().toISOString(),
    produits: r.rows.map((x) => ({
      id: x.id, titre: x.titre, sku: x.sku || null, photo: x.photo_principale || null, prix: Number(x.prix) || 0,
      prix_promo: x.prix_promo !== null && x.prix_promo !== undefined && Number(x.prix_promo) > 0 ? Number(x.prix_promo) : null, stock: x.stock,
      etat: x.etat, enchere: x.enchere === true,
      offre: x.offre_prix !== null ? { prix: Number(x.offre_prix), debut: x.offre_debut, fin: x.offre_fin } : null,
    })),
  });
}));

router.put('/collaborateur/:produitId', exigerCollab, limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), pid = entier(req.params.produitId);
  if (!gid || !pid) return res.status(400).json({ error: 'Produit invalide.' });
  const b = req.body || {};
  const o = await O.enregistrerOffre({ gid, collaborateurId: req.mvUser.id, produitId: pid, prixOffre: b.prix_offre, debut: b.debut || null, fin: b.fin });
  res.json({ success: true, message: 'Offre enregistrée.', offre: o });
}));

router.delete('/collaborateur/:produitId', exigerCollab, limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), pid = entier(req.params.produitId);
  if (!gid || !pid) return res.status(400).json({ error: 'Produit invalide.' });
  await O.retirerOffre({ gid, collaborateurId: req.mvUser.id, produitId: pid });
  res.json({ success: true, message: 'Offre retirée.' });
}));

module.exports = router;