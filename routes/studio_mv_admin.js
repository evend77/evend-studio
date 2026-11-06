// CHEMIN : routes/studio_mv_admin.js
// e-Vend Studio — Multi-vendeur : le gestionnaire voit et gère les PRODUITS et COMMANDES de tous ses collaborateurs.
// Monté dans server.js sur : /api/studio/mv/:gestionnaireId   (gestionnaire connecté, SA boutique seulement)
//
//   GET   /collaborateurs           → boutiques (pour les filtres)
//   GET   /categories              → catégories actives
//   GET   /produits                 → ?q= ?collaborateur_id= ?statut= ?page=
//   GET   /produits/:id             → fiche complète
//   PUT   /produits/:id             → modifier { titre, description, prix, prix_promo, stock, sku, categorie_id, statut }
//                                      (photos et variantes restent celles du collaborateur)
//   PATCH /produits/:id/statut      → { statut: 'actif'|'brouillon' }
//   GET   /commandes                → ?q= ?collaborateur_id= ?statut= ?paiement= ?page=
//   GET   /commandes/:id            → détail
//   POST  /commandes/:id/annuler    → annule une commande NON payée { raison? }

'use strict';

const express = require('express');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const paiement = require('../services/studio_paiement');

const router = express.Router({ mergeParams: true });
const PAR_PAGE = 40;

class Invalide extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const bad = (m, s) => { throw new Invalide(m, s); };
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Invalide) return res.status(e.status).json({ error: e.message });
    console.error('[studio_mv_admin]', req.method, req.path, e.message);
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

const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const page = (req) => { const p = parseInt(req.query.page, 10); return Number.isInteger(p) && p > 0 && p < 100000 ? p : 1; };
const motif = (q) => { const t = typeof q === 'string' ? q.trim().slice(0, 80) : ''; return t ? '%' + t.replace(/[\\%_]/g, (c) => '\\' + c) + '%' : null; };

const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };
function texte(v, nom, max, obligatoire) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') bad(`${nom} invalide.`);
  if (v.length > max * 5) bad(`${nom} trop long (max ${max} caractères).`);
  let t = sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} });
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITES[e]);
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (t.length > max) bad(`${nom} trop long (max ${max} caractères).`);
  if (obligatoire && !t) bad(`${nom} requis.`);
  return t;
}
function nombre(v, nom, min, max, vide) {
  if (v === undefined || v === null || v === '') { if (vide === undefined) bad(`${nom} requis.`); return vide; }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) bad(`${nom} invalide (entre ${min} et ${max}).`);
  return Math.round(n * 100) / 100;
}

// ── Collaborateurs (filtres) ─────────────────────────────────────────────────
router.get('/collaborateurs', h(async (req, res) => {
  const r = await pool.query(`SELECT id, nom_boutique FROM marketplace_collaborateurs WHERE gestionnaire_id = $1 ORDER BY nom_boutique`, [req.gid]);
  res.json(r.rows);
}));

router.get('/categories', h(async (req, res) => {
  const r = await pool.query('SELECT id, nom FROM studio_categories WHERE gestionnaire_id = $1 AND active = true ORDER BY nom', [req.gid]);
  res.json(r.rows);
}));

// ── Produits ─────────────────────────────────────────────────────────────────
const STATUTS_PRODUIT = ['actif', 'brouillon'];

router.get('/produits', h(async (req, res) => {
  const where = ['p.gestionnaire_id = $1'];
  const params = [req.gid];
  const m = motif(req.query.q);
  if (m) { params.push(m); where.push(`(p.titre ILIKE $${params.length} OR p.sku ILIKE $${params.length})`); }
  const cid = entier(req.query.collaborateur_id);
  if (cid) { params.push(cid); where.push(`p.collaborateur_id = $${params.length}`); }
  if (STATUTS_PRODUIT.includes(req.query.statut)) { params.push(req.query.statut); where.push(`p.statut = $${params.length}`); }
  if (req.query.stock === 'rupture') where.push('p.stock = 0');
  const W = where.join(' AND ');
  const pg = page(req);
  const [liste, total, stats] = await Promise.all([
    pool.query(
      `SELECT p.id, p.titre, p.prix, p.prix_promo, p.stock, p.sku, p.categorie, p.photo_principale, p.statut, p.created_at, p.collaborateur_id,
              c.nom_boutique AS boutique,
              EXISTS (SELECT 1 FROM encheres e WHERE e.produit_id = p.id AND e.statut IN ('active','attente_paiement')) AS en_enchere
         FROM produits p LEFT JOIN marketplace_collaborateurs c ON c.id = p.collaborateur_id
        WHERE ${W} ORDER BY p.created_at DESC, p.id DESC LIMIT ${PAR_PAGE} OFFSET ${(pg - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n FROM produits p WHERE ${W}`, params),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE statut = 'actif') AS actifs, COUNT(*) FILTER (WHERE statut = 'brouillon') AS brouillons,
                       COUNT(*) FILTER (WHERE stock = 0) AS ruptures FROM produits WHERE gestionnaire_id = $1`, [req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10), s = stats.rows[0];
  res.json({ produits: liste.rows, total: n, page: pg, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
             stats: { total: +s.total, actifs: +s.actifs, brouillons: +s.brouillons, ruptures: +s.ruptures } });
}));

router.get('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide.');
  const r = await pool.query(
    `SELECT p.id, p.titre, p.description, p.prix, p.prix_promo, p.stock, p.sku, p.categorie, p.categorie_id, p.photo_principale, p.photos, p.variantes,
            p.statut, p.collaborateur_id, c.nom_boutique AS boutique,
            EXISTS (SELECT 1 FROM encheres e WHERE e.produit_id = p.id AND e.statut IN ('active','attente_paiement')) AS en_enchere
       FROM produits p LEFT JOIN marketplace_collaborateurs c ON c.id = p.collaborateur_id
      WHERE p.id = $1 AND p.gestionnaire_id = $2`, [id, req.gid]);
  if (!r.rows.length) bad('Produit introuvable.', 404);
  res.json(r.rows[0]);
}));

router.put('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide.');
  const b = req.body || {};
  const titre = texte(b.titre, 'Titre', 150, true);
  const description = texte(b.description, 'Description', 5000);
  const prix = nombre(b.prix, 'Prix', 0, 1000000);
  const prixPromo = nombre(b.prix_promo, 'Prix promo', 0, 1000000, null);
  if (prixPromo !== null && prixPromo >= prix) bad('Le prix promo doit être inférieur au prix.');
  const stock = b.stock === '' || b.stock === undefined || b.stock === null ? null : Math.trunc(nombre(b.stock, 'Stock', 0, 1000000));
  const sku = texte(b.sku, 'SKU', 60);
  const statut = b.statut === undefined ? null : b.statut;
  if (statut !== null && !STATUTS_PRODUIT.includes(statut)) bad('Statut invalide.');
  let categorieId = null, categorie = null;
  if (b.categorie_id !== undefined && b.categorie_id !== null && b.categorie_id !== '') {
    categorieId = entier(b.categorie_id);
    if (!categorieId) bad('Catégorie invalide.');
    const c = await pool.query('SELECT nom FROM studio_categories WHERE id = $1 AND gestionnaire_id = $2 AND active = true', [categorieId, req.gid]);
    if (!c.rowCount) bad('Catégorie introuvable.');
    categorie = c.rows[0].nom;
  }
  const actuel = (await pool.query('SELECT stock FROM produits WHERE id = $1 AND gestionnaire_id = $2', [id, req.gid])).rows[0];
  if (!actuel) bad('Produit introuvable.', 404);
  // Une enchère réserve une unité : modifier le stock en même temps la ferait déraper
  if ((actuel.stock === null ? null : Number(actuel.stock)) !== stock) {
    const e = await pool.query(`SELECT 1 FROM encheres WHERE produit_id = $1 AND statut IN ('active','attente_paiement') LIMIT 1`, [id]);
    if (e.rowCount) bad("Ce produit est en enchère : le stock ne peut pas être modifié avant la fin de l'enchère.", 409);
  }
  const r = await pool.query(
    `UPDATE produits SET titre=$1, description=$2, prix=$3, prix_promo=$4, stock=$5, sku=$6, categorie=$7, categorie_id=$8,
            statut=COALESCE($9, statut), updated_at=NOW()
      WHERE id=$10 AND gestionnaire_id=$11`,
    [titre, description, prix, prixPromo, stock, sku || null, categorie, categorieId, statut, id, req.gid]);
  if (!r.rowCount) bad('Produit introuvable.', 404);
  res.json({ success: true });
}));

router.patch('/produits/:id/statut', h(async (req, res) => {
  const id = entier(req.params.id);
  const statut = req.body && req.body.statut;
  if (!id || !STATUTS_PRODUIT.includes(statut)) bad('Statut invalide.');
  const r = await pool.query('UPDATE produits SET statut=$1, updated_at=NOW() WHERE id=$2 AND gestionnaire_id=$3', [statut, id, req.gid]);
  if (!r.rowCount) bad('Produit introuvable.', 404);
  res.json({ success: true });
}));

// ── Commandes ────────────────────────────────────────────────────────────────
const STATUTS_COMMANDE = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'];
const PAIEMENTS = ['en_attente', 'paye', 'echoue', 'rembourse'];

router.get('/commandes', h(async (req, res) => {
  const where = ['c.gestionnaire_id = $1'];
  const params = [req.gid];
  const m = motif(req.query.q);
  if (m) { params.push(m); where.push(`(c.numero_commande ILIKE $${params.length} OR a.email ILIKE $${params.length} OR a.nom ILIKE $${params.length} OR a.prenom ILIKE $${params.length})`); }
  const cid = entier(req.query.collaborateur_id);
  if (cid) { params.push(cid); where.push(`c.collaborateur_id = $${params.length}`); }
  if (STATUTS_COMMANDE.includes(req.query.statut)) { params.push(req.query.statut); where.push(`c.statut = $${params.length}`); }
  if (PAIEMENTS.includes(req.query.paiement)) { params.push(req.query.paiement); where.push(`c.statut_paiement = $${params.length}`); }
  const W = where.join(' AND ');
  const pg = page(req);
  const base = 'FROM marketplace_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id LEFT JOIN marketplace_collaborateurs col ON col.id = c.collaborateur_id';
  const [liste, total, tot] = await Promise.all([
    pool.query(
      `SELECT c.id, c.numero_commande, c.statut, c.statut_paiement, c.total, c.commission, c.commission_taxes, c.montant_net, c.date_commande, c.collaborateur_id,
              jsonb_array_length(COALESCE(c.articles, '[]'::jsonb)) AS nb_articles, c.code_promo, c.rabais,
              a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email, col.nom_boutique AS boutique
         ${base} WHERE ${W} ORDER BY c.date_commande DESC, c.id DESC LIMIT ${PAR_PAGE} OFFSET ${(pg - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n ${base} WHERE ${W}`, params),
    pool.query(`SELECT COALESCE(SUM(total) FILTER (WHERE statut_paiement = 'paye'), 0) AS ventes,
                       COALESCE(SUM(commission) FILTER (WHERE statut_paiement = 'paye'), 0) AS commissions,
                       COUNT(*) FILTER (WHERE statut_paiement = 'paye') AS payees
                  FROM marketplace_commandes WHERE gestionnaire_id = $1`, [req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10), t = tot.rows[0];
  res.json({ commandes: liste.rows, total: n, page: pg, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
             totaux: { ventes: Number(t.ventes), commissions: Number(t.commissions), payees: +t.payees } });
}));

router.get('/commandes/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide.');
  const r = await pool.query(
    `SELECT c.id, c.numero_commande, c.statut, c.statut_paiement, c.total, c.commission, c.commission_taxes, c.montant_net, c.articles, c.adresse_livraison, c.note,
            c.date_commande, c.paye_le, c.frais_expedition, c.taxes, c.code_promo, c.rabais, c.numero_suivi, c.transporteur, c.collaborateur_id,
            a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email, a.telephone AS acheteur_telephone,
            col.nom_boutique AS boutique
       FROM marketplace_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
       LEFT JOIN marketplace_collaborateurs col ON col.id = c.collaborateur_id
      WHERE c.id = $1 AND c.gestionnaire_id = $2`, [id, req.gid]);
  if (!r.rows.length) bad('Commande introuvable.', 404);
  res.json(r.rows[0]);
}));

router.post('/commandes/:id/annuler', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide.');
  const c = (await pool.query('SELECT statut, statut_paiement FROM marketplace_commandes WHERE id = $1 AND gestionnaire_id = $2', [id, req.gid])).rows[0];
  if (!c) bad('Commande introuvable.', 404);
  if (c.statut_paiement === 'paye') bad('Commande déjà payée : un remboursement se fait dans Stripe ou via une demande de retour.', 409);
  if (c.statut === 'annulee') bad('Commande déjà annulée.', 409);
  try { await paiement.annulerNonPayee(id, { par: 'gestionnaire', raison: texte(req.body && req.body.raison, 'Raison', 300) }); }
  catch (e) { if (e instanceof paiement.ErreurPaiement) bad(e.message, e.status); throw e; }
  res.json({ success: true });
}));

module.exports = router;