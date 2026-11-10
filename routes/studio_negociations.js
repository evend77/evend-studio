// CHEMIN : routes/studio_negociations.js
// e-Vend Studio — Add-on « Faire une offre » : routes de l'ACHETEUR et du COLLABORATEUR.
// Monté dans server.js :  app.use('/api/marketplace/:gid/negociations', require('./routes/studio_negociations'));
//
//  Acheteur
//   POST /offrir                  { produit_id, variante?, prix, message? }
//   GET  /acheteur/mes?etat=      mes offres (état calculé : expirée si le délai est passé)
//   POST /acheteur/:id/accepter   accepter une contre-offre
//   POST /acheteur/:id/panier     mettre l'offre acceptée au panier (prix verrouillé)
//   POST /acheteur/:id/retirer    retirer / décliner
//   GET  /produit/:produitId      l'offre en cours de l'acheteur sur ce produit (page produit) — null sans connexion
//  Collaborateur
//   GET  /collaborateur/mes?etat=&page=     offres reçues (+ compteurs)
//   POST /collaborateur/:id/accepter | refuser | contre   { prix?, message? }
//   GET/PUT /collaborateur/reglages         { actif, min_pct }
// Modération du gestionnaire : routes/studio_mv_admin.js (/api/studio/mv/:gid/negociations).

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const N = require('../services/studio_negociations');

const router = express.Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET;
const PAR_PAGE = 20;

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof N.ErreurNego) return res.status(e.status).json({ error: e.message });
    console.error('[studio_negociations]', req.method, req.path, e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const m = new Map();
const limiteEcriture = (req, res, next) => {
  const k = 'u:' + (req.mvUser ? req.mvUser.type + req.mvUser.id : req.ip), n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 60000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 60000) m.delete(kk); return next(); }
  if (c.n >= 20) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
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
const exiger = (type, texte) => (req, res, next) => {
  const p = lireJeton(req);
  if (!p) return res.status(401).json({ error: 'Connexion requise.' });
  if (p.type !== type) return res.status(403).json({ error: texte });
  req.mvUser = p; next();
};
const exigerAcheteur = exiger('acheteur', 'Un compte acheteur est requis.');
const exigerCollab = exiger('collaborateur', 'Un compte collaborateur est requis.');

const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const gidDe = (req) => entier(req.params.gid);
const ETATS = ['attente', 'contre', 'acceptee', 'refusee', 'annulee', 'payee', 'expiree'];

const sortie = (x) => ({
  id: x.id, produit_id: x.produit_id, titre: x.titre, variante: x.variante || '', photo: x.image_url || null,
  prix_produit: Number(x.prix_produit), prix_offert: Number(x.prix_offert), prix_contre: x.prix_contre === null ? null : Number(x.prix_contre),
  prix_final: x.prix_final === null ? null : Number(x.prix_final), message: x.message || null, message_vendeur: x.message_vendeur || null,
  etat: x.etat, cree: x.created_at, expire: x.expire_le,
});

// ───────── Acheteur ─────────
router.post('/offrir', exigerAcheteur, limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), pid = entier(req.body && req.body.produit_id);
  if (!gid || !pid) return res.status(400).json({ error: 'Produit invalide.' });
  const b = req.body;
  await N.faireOffre({ gid, acheteurId: req.mvUser.id, produitId: pid, variante: b.variante, prix: b.prix, message: b.message });
  res.json({ success: true, message: 'Offre envoyée. Le vendeur a 7 jours pour répondre.' });
}));

router.get('/acheteur/mes', exigerAcheteur, h(async (req, res) => {
  const gid = gidDe(req);
  const etat = ETATS.includes(req.query.etat) ? req.query.etat : '';
  const params = [gid, req.mvUser.id]; let filtre = '';
  if (etat) { params.push(etat); filtre = ` AND ${N.sqlEtat('n')} = $3`; }
  const r = await pool.query(
    `SELECT n.*, ${N.sqlEtat('n')} AS etat FROM negociations n WHERE n.gestionnaire_id = $1 AND n.acheteur_id = $2${filtre} ORDER BY n.updated_at DESC LIMIT 100`, params);
  const cfg = await N.reglages(gid);
  res.json({ addon_actif: await N.actifPourBoutique(gid), validite_heures: cfg.validiteHeures, maintenant: new Date().toISOString(), offres: r.rows.map(sortie),
             a_repondre: r.rows.filter((x) => x.etat === 'contre' || x.etat === 'acceptee').length });
}));

router.post('/acheteur/:id/accepter', exigerAcheteur, limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), id = entier(req.params.id); if (!gid || !id) return res.status(400).json({ error: 'Offre invalide.' });
  await N.repondreAcheteur({ gid, acheteurId: req.mvUser.id, id, action: 'accepter' });
  res.json({ success: true });
}));
router.post('/acheteur/:id/retirer', exigerAcheteur, limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), id = entier(req.params.id); if (!gid || !id) return res.status(400).json({ error: 'Offre invalide.' });
  await N.repondreAcheteur({ gid, acheteurId: req.mvUser.id, id, action: 'retirer' });
  res.json({ success: true });
}));
router.post('/acheteur/:id/panier', exigerAcheteur, limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), id = entier(req.params.id); if (!gid || !id) return res.status(400).json({ error: 'Offre invalide.' });
  await N.mettreAuPanier({ gid, acheteurId: req.mvUser.id, id });
  res.json({ success: true });
}));

// Page produit : bouton affiché ? (add-on + vendeur d'accord) et l'offre vivante / acceptée de l'acheteur connecté — jamais d'erreur 401 (visiteur : offre null)
router.get('/produit/:produitId', h(async (req, res) => {
  const gid = gidDe(req), pid = entier(req.params.produitId);
  if (!gid || !pid) return res.json({ actif: false, offre: null });
  if (!(await N.actifPourBoutique(gid))) return res.json({ actif: false, offre: null });
  const pr = (await pool.query('SELECT collaborateur_id FROM produits WHERE id = $1 AND gestionnaire_id = $2', [pid, gid])).rows[0];
  if (!pr) return res.json({ actif: false, offre: null });
  const cfg = await N.reglagesCollab(gid, pr.collaborateur_id);
  const p = lireJeton(req);
  let offre = null;
  if (p && p.type === 'acheteur') {
    const r = await pool.query(
      `SELECT n.*, ${N.sqlEtat('n')} AS etat FROM negociations n WHERE n.gestionnaire_id = $1 AND n.acheteur_id = $2 AND n.produit_id = $3 AND ${N.sqlVivante('n')} ORDER BY n.id DESC LIMIT 1`, [gid, p.id, pid]);
    if (r.rows[0]) offre = sortie(r.rows[0]);
  }
  res.json({ actif: cfg.actif, min_pct: cfg.minPct, validite_heures: (await N.reglages(gid)).validiteHeures, maintenant: new Date().toISOString(), offre });
}));

// ───────── Collaborateur ─────────
router.get('/collaborateur/mes', exigerCollab, h(async (req, res) => {
  const gid = gidDe(req), cid = req.mvUser.id;
  const pg = Math.min(Math.max(entier(req.query.page) || 1, 1), 10000);
  const etat = ETATS.includes(req.query.etat) ? req.query.etat : '';
  const params = [gid, cid]; let filtre = '';
  if (etat) { params.push(etat); filtre = ` AND ${N.sqlEtat('n')} = $${params.length}`; }
  params.push(PAR_PAGE, (pg - 1) * PAR_PAGE);
  const r = await pool.query(
    `SELECT n.*, ${N.sqlEtat('n')} AS etat, NULLIF(TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')), '') AS acheteur_nom, p.sku, p.stock, COUNT(*) OVER()::int AS total_lignes
       FROM negociations n LEFT JOIN marketplace_acheteurs a ON a.id = n.acheteur_id LEFT JOIN produits p ON p.id = n.produit_id
      WHERE n.gestionnaire_id = $1 AND n.collaborateur_id = $2${filtre}
      ORDER BY CASE ${N.sqlEtat('n')} WHEN 'attente' THEN 0 WHEN 'contre' THEN 1 WHEN 'acceptee' THEN 2 ELSE 3 END, n.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const stats = (await pool.query(
    `SELECT COUNT(*) FILTER (WHERE ${N.sqlEtat('n')} = 'attente')::int AS a_repondre, COUNT(*) FILTER (WHERE ${N.sqlEtat('n')} = 'contre')::int AS contre,
            COUNT(*) FILTER (WHERE ${N.sqlEtat('n')} = 'acceptee')::int AS acceptees, COUNT(*) FILTER (WHERE n.statut = 'payee')::int AS payees
       FROM negociations n WHERE n.gestionnaire_id = $1 AND n.collaborateur_id = $2`, [gid, cid])).rows[0];
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  const cfg = await N.reglages(gid);
  res.json({
    addon_actif: await N.actifPourBoutique(gid), validite_heures: cfg.validiteHeures, reglages: await N.reglagesCollab(gid, cid), total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)), stats,
    offres: r.rows.map((x) => ({ ...sortie(x), acheteur: x.acheteur_nom, sku: x.sku || null, stock: x.stock })),
  });
}));

for (const action of ['accepter', 'refuser', 'contre']) {
  router.post(`/collaborateur/:id/${action}`, exigerCollab, limiteEcriture, h(async (req, res) => {
    const gid = gidDe(req), id = entier(req.params.id); if (!gid || !id) return res.status(400).json({ error: 'Offre invalide.' });
    const b = req.body || {};
    await N.repondreVendeur({ gid, collabId: req.mvUser.id, id, action, prixContre: b.prix, message: b.message });
    res.json({ success: true });
  }));
}

router.get('/collaborateur/reglages', exigerCollab, h(async (req, res) => {
  res.json(await N.reglagesCollab(gidDe(req), req.mvUser.id));
}));
router.put('/collaborateur/reglages', exigerCollab, limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), b = req.body || {};
  const pct = Math.round(Number(b.min_pct));
  if (!Number.isFinite(pct) || pct < 10 || pct > 99) return res.status(400).json({ error: "L'offre minimale doit être entre 10 % et 99 % du prix." });
  await pool.query(
    `INSERT INTO negociations_collab (gestionnaire_id, collaborateur_id, actif, min_pct) VALUES ($1,$2,$3,$4)
     ON CONFLICT (gestionnaire_id, collaborateur_id) DO UPDATE SET actif = EXCLUDED.actif, min_pct = EXCLUDED.min_pct`, [gid, req.mvUser.id, b.actif !== false, pct]);
  res.json({ success: true });
}));

module.exports = router;