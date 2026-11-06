// CHEMIN : routes/studio_encheres_admin.js
// e-Vend Studio — Enchères vues par le gestionnaire (SA boutique seulement).
// Monté dans server.js sur : /api/studio/encheres/:gestionnaireId
//   GET  /            → liste (?statut=active|attente_paiement|payee|expiree|sans_gagnant|annulee|toutes, ?page=)
//   POST /:id/annuler → annule une enchère EN COURS (même avec des mises) ; l'unité revient en stock, les enchérisseurs sont prévenus

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const enc = require('../services/studio_encheres');

const router = express.Router({ mergeParams: true });

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof enc.ErreurEnchere) return res.status(e.status).json({ error: e.message });
    console.error('[studio_encheres_admin]', req.method, req.path, e.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

function proprietaire(req, res, next) {
  const idToken = parseInt(req.user && req.user.id, 10);
  const idParam = parseInt(req.params.gestionnaireId, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(idParam) || idToken !== idParam) return res.status(403).json({ error: 'Accès refusé.' });
  req.gid = idParam;
  next();
}
router.use(authenticateToken, proprietaire);

const STATUTS = ['active', 'attente_paiement', 'payee', 'expiree', 'sans_gagnant', 'annulee'];

router.get('/', h(async (req, res) => {
  const statut = STATUTS.includes(req.query.statut) ? req.query.statut : null;
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 1000);
  const params = [req.gid, 30, (page - 1) * 30];
  let filtre = '';
  if (statut) { params.push(statut); filtre = ` AND e.statut = $${params.length}`; }
  const r = await pool.query(
    `SELECT e.id, e.produit_id, e.titre, e.image_url, e.statut, e.prix_depart, e.prix_reserve, e.mise_actuelle, e.prix_final, e.nb_mises,
            e.date_fin, e.paiement_expire_le, e.created_at, e.collaborateur_id,
            (SELECT c.nom_boutique FROM marketplace_collaborateurs c WHERE c.id = e.collaborateur_id) AS boutique,
            (SELECT COUNT(DISTINCT m.acheteur_id)::int FROM encheres_mises m WHERE m.enchere_id = e.id) AS nb_encherisseurs
       FROM encheres e WHERE e.gestionnaire_id = $1${filtre}
      ORDER BY (e.statut = 'active') DESC, e.created_at DESC LIMIT $2 OFFSET $3`, params);
  const c = await pool.query(`SELECT statut, COUNT(*)::int AS n FROM encheres WHERE gestionnaire_id = $1 GROUP BY statut`, [req.gid]);
  const compte = {}; for (const x of c.rows) compte[x.statut] = x.n;
  const num = (v) => (v === null || v === undefined ? null : Number(v));
  res.json({
    page, compte,
    encheres: r.rows.map((e) => ({ ...e, prix_depart: num(e.prix_depart), prix_reserve: num(e.prix_reserve), mise_actuelle: num(e.mise_actuelle), prix_final: num(e.prix_final) })),
  });
}));

router.post('/:id/annuler', h(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Enchère invalide.' });
  await enc.annulerEnchere({ gid: req.gid, enchereId: id, parGestionnaire: true });
  res.json({ success: true });
}));

module.exports = router;