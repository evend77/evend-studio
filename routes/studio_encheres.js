// CHEMIN : routes/studio_encheres.js
// e-Vend Studio — API des enchères (communes à tous les templates multivendeur).
// Monté dans server.js sur : /api/marketplace/:gid/encheres
//
//  PUBLIC
//   GET  /produit/:produitId        → enchère en cours d'un produit (ou null) — pour la page produit
//   GET  /                          → enchères en cours (?collaborateur_id=, ?page=)
//   GET  /:id/mises                 → dernières mises (noms masqués)
//  ACHETEUR (connecté)
//   POST /:id/miser                 → { montant }
//   GET  /mes-encheres              → mes enchères (en tête, surpassé, à payer, perdue…)
//   POST /:id/remettre-panier       → remet l'article gagné dans mon panier
//  COLLABORATEUR (connecté)
//   POST /                          → créer { produit_id, prix_depart, prix_reserve?, duree_heures }
//   GET  /collaborateur/mes         → mes enchères
//   POST /:id/annuler               → annuler (seulement sans mise)

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const enc = require('../services/studio_encheres');

const router = express.Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET;

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof enc.ErreurEnchere) return res.status(e.status).json({ error: e.message });
    console.error('[studio_encheres]', req.method, req.path, e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Limiteurs en mémoire ─────────────────────────────────────────────────────
function limiteur(max, fenetreMs, cle) {
  const m = new Map();
  return (req, res, next) => {
    const k = cle(req), n = Date.now();
    const c = m.get(k);
    if (!c || n - c.debut > fenetreMs) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > fenetreMs) m.delete(kk); return next(); }
    if (c.n >= max) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
    c.n++; next();
  };
}
const limitePublic = limiteur(600, 5 * 60000, (req) => 'ip:' + req.ip);
const limiteMises = limiteur(20, 60000, (req) => 'u:' + (req.mvUser ? req.mvUser.id : req.ip));

// ── Authentification ─────────────────────────────────────────────────────────
function lireJeton(req) {
  const gid = req.params.gid;
  const cookie = req.cookies && req.cookies[`mv_token_${gid}`];
  const a = req.headers.authorization;
  const token = cookie || (a && a.startsWith('Bearer ') ? a.slice(7) : null);
  if (!token) return null;
  try {
    const p = jwt.verify(token, JWT_SECRET);
    return p.gestionnaireId === Number(gid) ? p : null;
  } catch (e) { return null; }
}
const exiger = (type) => (req, res, next) => {
  const p = lireJeton(req);
  if (!p) return res.status(401).json({ error: 'Connexion requise.' });
  if (p.type !== type) return res.status(403).json({ error: type === 'acheteur' ? 'Un compte acheteur est requis.' : 'Un compte collaborateur est requis.' });
  req.mvUser = p; next();
};
const optionnel = (req, res, next) => { const p = lireJeton(req); if (p) req.mvUser = p; next(); };

const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 ? n : null; };
const gidDe = (req) => entier(req.params.gid);

// Vue publique d'une enchère : le prix de réserve n'est JAMAIS révélé, seulement s'il est atteint.
function vue(e, moi) {
  const active = e.statut === 'active';
  return {
    id: e.id, produit_id: e.produit_id, collaborateur_id: e.collaborateur_id, titre: e.titre, image_url: e.image_url,
    statut: active ? 'active' : 'terminee',
    prix_depart: Number(e.prix_depart), mise_actuelle: e.mise_actuelle === null ? null : Number(e.mise_actuelle),
    prochaine_mise: active ? enc.prochaineMise(e) : null, increment: Number(e.increment),
    nb_mises: e.nb_mises, date_fin: e.date_fin,
    nom_boutique: e.nom_boutique || null,
    reserve: e.prix_reserve === null ? null : { atteinte: e.mise_actuelle !== null && Number(e.mise_actuelle) >= Number(e.prix_reserve) },
    ...(moi ? { en_tete: !!e.en_tete } : {}),
  };
}

const COLS = `e.*, (SELECT acheteur_id FROM encheres_mises m WHERE m.enchere_id = e.id ORDER BY montant DESC, id DESC LIMIT 1) AS meneur_id`;

router.get('/produit/:produitId', limitePublic, optionnel, h(async (req, res) => {
  const gid = gidDe(req), pid = entier(req.params.produitId);
  if (!gid || !pid) return res.json({ enchere: null });
  let e = (await pool.query(`SELECT ${COLS} FROM encheres e WHERE e.gestionnaire_id = $1 AND e.produit_id = $2 AND e.statut IN ('active','attente_paiement') LIMIT 1`, [gid, pid])).rows[0];
  if (e && e.statut === 'active' && new Date(e.date_fin) <= new Date()) {
    await enc.finaliser(e.id);
    e = (await pool.query(`SELECT ${COLS} FROM encheres e WHERE e.id = $1`, [e.id])).rows[0];
  }
  if (!e || e.statut !== 'active') return res.json({ enchere: null });
  if (req.mvUser && req.mvUser.type === 'acheteur') e.en_tete = e.meneur_id === req.mvUser.id;
  res.json({ enchere: vue(e, !!(req.mvUser && req.mvUser.type === 'acheteur')) });
}));

const TRIS_ENCHERES = {
  fin_proche: 'e.date_fin ASC',
  recent: 'e.created_at DESC',
  mise_asc: 'COALESCE(e.mise_actuelle, e.prix_depart) ASC, e.date_fin ASC',
  mise_desc: 'COALESCE(e.mise_actuelle, e.prix_depart) DESC, e.date_fin ASC',
  nb_mises: 'e.nb_mises DESC, e.date_fin ASC',
};

// Liste publique paginée : ?page=1&limit=50&tri=fin_proche|recent|mise_asc|mise_desc|nb_mises&reserve=1
router.get('/', limitePublic, h(async (req, res) => {
  const gid = gidDe(req);
  const page = Math.min(Math.max(entier(req.query.page) || 1, 1), 1000);
  const limit = Math.min(Math.max(entier(req.query.limit) || 24, 1), 100);
  const params = [gid, limit, (page - 1) * limit];
  let filtre = '';
  const cid = entier(req.query.collaborateur_id);
  if (cid) { params.push(cid); filtre += ` AND e.collaborateur_id = $${params.length}`; }
  if (req.query.reserve === '1') filtre += ' AND e.prix_reserve IS NOT NULL AND e.mise_actuelle >= e.prix_reserve';
  const tri = TRIS_ENCHERES[req.query.tri] || TRIS_ENCHERES.fin_proche;
  const r = await pool.query(
    `SELECT e.*, COUNT(*) OVER()::int AS total_lignes,
            (SELECT c.nom_boutique FROM marketplace_collaborateurs c WHERE c.id = e.collaborateur_id) AS nom_boutique
       FROM encheres e WHERE e.gestionnaire_id = $1 AND e.statut = 'active' AND e.date_fin > NOW()${filtre}
      ORDER BY ${tri}, e.id ASC LIMIT $2 OFFSET $3`, params);
  let total = r.rows.length ? r.rows[0].total_lignes : 0;
  if (!r.rows.length && page > 1) { // page au-delà de la fin : on retrouve le total pour que l'écran puisse revenir en arrière
    const t = await pool.query(`SELECT COUNT(*)::int AS n FROM encheres e WHERE e.gestionnaire_id = $1 AND e.statut = 'active' AND e.date_fin > NOW()${filtre}`, [gid, ...params.slice(3)]);
    total = t.rows[0].n;
  }
  res.json({ encheres: r.rows.map((e) => vue(e, false)), page, pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) } });
}));

router.get('/mes-encheres', exiger('acheteur'), h(async (req, res) => {
  const gid = gidDe(req), uid = req.mvUser.id;
  const r = await pool.query(
    `SELECT ${COLS}, (SELECT MAX(montant) FROM encheres_mises m WHERE m.enchere_id = e.id AND m.acheteur_id = $2) AS ma_mise,
            EXISTS (SELECT 1 FROM marketplace_panier p WHERE p.enchere_id = e.id AND p.acheteur_id = $2) AS dans_panier
       FROM encheres e
      WHERE e.gestionnaire_id = $1 AND EXISTS (SELECT 1 FROM encheres_mises m WHERE m.enchere_id = e.id AND m.acheteur_id = $2)
      ORDER BY e.created_at DESC LIMIT 100`, [gid, uid]);
  res.json({ encheres: r.rows.map((e) => {
    let etat;
    if (e.statut === 'active') etat = e.meneur_id === uid ? 'en_tete' : 'surpasse';
    else if (e.gagnant_id === uid) etat = e.statut === 'attente_paiement' ? 'a_payer' : e.statut === 'payee' ? 'payee' : e.statut === 'expiree' ? 'expiree' : e.statut;
    else etat = 'perdue';
    return { id: e.id, produit_id: e.produit_id, titre: e.titre, image_url: e.image_url, statut: e.statut, etat, ma_mise: Number(e.ma_mise),
             mise_actuelle: e.mise_actuelle === null ? null : Number(e.mise_actuelle), prix_final: e.gagnant_id === uid && e.prix_final ? Number(e.prix_final) : null,
             date_fin: e.date_fin, paiement_expire_le: etat === 'a_payer' ? e.paiement_expire_le : null, dans_panier: etat === 'a_payer' ? e.dans_panier : false };
  }) });
}));

router.get('/collaborateur/mes', exiger('collaborateur'), h(async (req, res) => {
  const r = await pool.query(
    `SELECT e.*, (SELECT COUNT(DISTINCT acheteur_id)::int FROM encheres_mises m WHERE m.enchere_id = e.id) AS nb_encherisseurs
       FROM encheres e WHERE e.gestionnaire_id = $1 AND e.collaborateur_id = $2 ORDER BY e.created_at DESC LIMIT 200`, [gidDe(req), req.mvUser.id]);
  res.json({ encheres: r.rows.map((e) => ({
    id: e.id, produit_id: e.produit_id, titre: e.titre, image_url: e.image_url, statut: e.statut, prix_depart: Number(e.prix_depart),
    prix_reserve: e.prix_reserve === null ? null : Number(e.prix_reserve), mise_actuelle: e.mise_actuelle === null ? null : Number(e.mise_actuelle),
    prix_final: e.prix_final === null ? null : Number(e.prix_final), nb_mises: e.nb_mises, nb_encherisseurs: e.nb_encherisseurs,
    date_fin: e.date_fin, paiement_expire_le: e.paiement_expire_le })) });
}));

router.get('/:id/mises', limitePublic, h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.json({ mises: [] });
  const r = await pool.query(
    `SELECT m.montant, m.created_at, a.prenom FROM encheres_mises m
       JOIN encheres e ON e.id = m.enchere_id AND e.gestionnaire_id = $2
       LEFT JOIN marketplace_acheteurs a ON a.id = m.acheteur_id
      WHERE m.enchere_id = $1 ORDER BY m.montant DESC, m.id DESC LIMIT 20`, [id, gidDe(req)]);
  res.json({ mises: r.rows.map((x) => ({ montant: Number(x.montant), date: x.created_at, enchérisseur: (x.prenom ? String(x.prenom).trim().charAt(0).toUpperCase() : '?') + '***' })) });
}));

router.post('/:id/miser', exiger('acheteur'), limiteMises, h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ error: 'Enchère invalide.' });
  res.json(await enc.miser({ gid: gidDe(req), enchereId: id, acheteurId: req.mvUser.id, montant: req.body && req.body.montant }));
}));

router.post('/:id/remettre-panier', exiger('acheteur'), h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ error: 'Enchère invalide.' });
  res.json({ success: true, ...(await enc.remettreAuPanier({ gid: gidDe(req), enchereId: id, acheteurId: req.mvUser.id })) });
}));

router.post('/', exiger('collaborateur'), h(async (req, res) => {
  const b = req.body || {};
  const produitId = entier(b.produit_id);
  if (!produitId) return res.status(400).json({ error: 'Produit invalide.' });
  const e = await enc.creerEnchere({ gid: gidDe(req), collaborateurId: req.mvUser.id, produitId, prixDepart: b.prix_depart, prixReserve: b.prix_reserve, dureeH: b.duree_heures });
  res.status(201).json({ success: true, id: e.id, date_fin: e.date_fin });
}));

router.post('/:id/annuler', exiger('collaborateur'), h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ error: 'Enchère invalide.' });
  await enc.annulerEnchere({ gid: gidDe(req), enchereId: id, collaborateurId: req.mvUser.id });
  res.json({ success: true });
}));

module.exports = router;