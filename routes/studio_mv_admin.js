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
//   GET   /remboursements           → ?statut=en_attente|effectue|refuse|echoue  (demandes des collaborateurs)
//   POST  /remboursements/:id/approuver → exécute le remboursement Stripe
//   POST  /remboursements/:id/refuser   → { motif }
//   GET   /avis                     → ?q= ?note=1..5 ?statut=publie|attente|masque|tous ?collaborateur_id= ?page=  (+ stats)
//   GET   /avis/compte              → { attente } nombre d'avis à approuver (pastille du menu)
//   POST  /avis/:id/approuver       → publie un avis en attente (et prévient le collaborateur)
//   POST  /avis/:id/masquer         → { raison (min. 5 caractères) } : refuse un avis en attente ou masque un avis publié
//   POST  /avis/:id/retablir        → remet en ligne un avis masqué
//   GET   /questions                → ?q= ?statut=attente|publiee|masquee|signalees ?collaborateur_id= ?page=  (+ stats) — add-on « Questions sur le produit »
//   GET   /questions/compte         → { signalees } pastille du menu
//   POST  /questions/:id/masquer | /retablir | /ignorer-signalements ; DELETE /questions/:id
//   GET   /dashboard                → ?periode=7|30|90|365  statistiques du tableau de bord (selon le template du site)

'use strict';

const express = require('express');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const paiement = require('../services/studio_paiement');
const rembMV = require('../services/studio_remboursement');
const avisMV = require('../services/studio_avis');

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
  if ([...STATUTS_PRODUIT, 'en_attente'].includes(req.query.statut)) { params.push(req.query.statut); where.push(`p.statut = $${params.length}`); }
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
                       COUNT(*) FILTER (WHERE statut = 'en_attente') AS en_attente, COUNT(*) FILTER (WHERE stock = 0) AS ruptures FROM produits WHERE gestionnaire_id = $1`, [req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10), s = stats.rows[0];
  res.json({ produits: liste.rows, total: n, page: pg, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
             stats: { total: +s.total, actifs: +s.actifs, brouillons: +s.brouillons, en_attente: +s.en_attente, ruptures: +s.ruptures } });
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
              jsonb_array_length(COALESCE(c.articles, '[]'::jsonb)) AS nb_articles, c.code_promo, c.rabais, c.montant_rembourse,
              EXISTS (SELECT 1 FROM commande_remboursements r WHERE r.commande_id = c.id AND r.statut = 'en_attente') AS remboursement_en_attente,
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
            c.date_commande, c.paye_le, c.frais_expedition, c.taxes, c.code_promo, c.rabais, c.numero_suivi, c.transporteur, c.collaborateur_id, c.montant_rembourse, c.raison_annulation,
            a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email, a.telephone AS acheteur_telephone,
            col.nom_boutique AS boutique
       FROM marketplace_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
       LEFT JOIN marketplace_collaborateurs col ON col.id = c.collaborateur_id
      WHERE c.id = $1 AND c.gestionnaire_id = $2`, [id, req.gid]);
  if (!r.rows.length) bad('Commande introuvable.', 404);
  const rembs = await pool.query(
    `SELECT id, origine, montant, raison, statut, demande_par, motif_refus, erreur, created_at, traite_le FROM commande_remboursements WHERE commande_id = $1 ORDER BY created_at DESC, id DESC`, [id]);
  res.json({ ...r.rows[0], remboursements: rembs.rows });
}));

// ── Demandes de remboursement des collaborateurs ─────────────────────────────
router.get('/remboursements', h(async (req, res) => {
  const where = ['r.gestionnaire_id = $1'];
  const params = [req.gid];
  if (['en_attente', 'en_cours', 'effectue', 'refuse', 'echoue'].includes(req.query.statut)) { params.push(req.query.statut); where.push(`r.statut = $${params.length}`); }
  const r = await pool.query(
    `SELECT r.id, r.commande_id, r.origine, r.montant, r.raison, r.statut, r.demande_par, r.motif_refus, r.erreur, r.created_at, r.traite_le,
            c.numero_commande, c.total AS total_commande, c.montant_rembourse, col.nom_boutique AS boutique,
            a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email
       FROM commande_remboursements r JOIN marketplace_commandes c ON c.id = r.commande_id
       LEFT JOIN marketplace_collaborateurs col ON col.id = r.collaborateur_id
       LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
      WHERE ${where.join(' AND ')} ORDER BY (r.statut = 'en_attente') DESC, r.created_at DESC, r.id DESC LIMIT 100`, params);
  const n = await pool.query(`SELECT COUNT(*) AS n FROM commande_remboursements WHERE gestionnaire_id = $1 AND statut = 'en_attente'`, [req.gid]);
  res.json({ remboursements: r.rows, en_attente: parseInt(n.rows[0].n, 10) });
}));

router.post('/remboursements/:id/approuver', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Demande invalide.');
  try { res.json({ success: true, ...(await rembMV.executer(id, { par: 'gestionnaire', gid: req.gid })) }); }
  catch (e) { if (e instanceof rembMV.ErreurRemboursement) bad(e.message, e.status); throw e; }
}));

router.post('/remboursements/:id/refuser', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Demande invalide.');
  try { res.json(await rembMV.refuserDemande(id, req.gid, req.body && req.body.motif)); }
  catch (e) { if (e instanceof rembMV.ErreurRemboursement) bad(e.message, e.status); throw e; }
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

// ── Avis clients : modération ────────────────────────────────────────────────
router.get('/avis', h(async (req, res) => {
  // Add-on inactif : on ne supprime rien, on cache. L'écran affiche « Add-on non activé ».
  if (!(await avisMV.addonActif(req.gid, pool))) return res.json({ addon_actif: false, avis: [], total: 0, page: 1, pages: 1, stats: { total: 0, publies: 0, attente: 0, chez_collab: 0, masques: 0, moyenne: 0 } });
  const params = [req.gid];
  const where = ['v.gestionnaire_id = $1'];
  const statut = ['publie', 'attente', 'chez_collab', 'masque', 'tous'].includes(req.query.statut) ? req.query.statut : 'tous';
  if (statut === 'publie') where.push('v.approuve = true');
  if (statut === 'attente') where.push(`v.approuve = false AND v.masque_le IS NULL AND v.approbateur IS DISTINCT FROM 'collaborateur'`);
  if (statut === 'chez_collab') where.push(`v.approuve = false AND v.masque_le IS NULL AND v.approbateur = 'collaborateur'`);
  if (statut === 'masque') where.push('v.approuve = false AND v.masque_le IS NOT NULL');
  const note = entier(req.query.note);
  if (note && note <= 5) { params.push(note); where.push(`v.note = $${params.length}`); }
  const cid = entier(req.query.collaborateur_id);
  if (cid) { params.push(cid); where.push(`v.collaborateur_id = $${params.length}`); }
  const m = motif(req.query.q);
  if (m) {
    params.push(m);
    const i = params.length;
    where.push(`(v.titre ILIKE $${i} OR v.commentaire ILIKE $${i} OR a.email ILIKE $${i} OR a.prenom ILIKE $${i} OR a.nom ILIKE $${i}
                 OR mc.nom_boutique ILIKE $${i} OR mc.nom_responsable ILIKE $${i})`);
  }
  const W = where.join(' AND ');
  const pg = page(req);
  const DE = `FROM avis_collaborateur v
              LEFT JOIN marketplace_acheteurs a ON a.id = v.acheteur_id
              LEFT JOIN marketplace_collaborateurs mc ON mc.id = v.collaborateur_id`;
  const [liste, total, stats] = await Promise.all([
    pool.query(
      `SELECT v.id, v.note, v.titre, v.commentaire, v.approuve, v.approbateur, v.masque_raison, v.masque_le, v.masque_par, v.criteres, v.photos, v.reponse, v.created_at, v.commande_id,
              COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS boutique,
              COALESCE(NULLIF(TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')), ''), 'Acheteur supprimé') AS acheteur_nom,
              a.email AS acheteur_email, c.numero_commande
         ${DE} LEFT JOIN marketplace_commandes c ON c.id = v.commande_id
        WHERE ${W} ORDER BY v.created_at DESC, v.id DESC LIMIT ${PAR_PAGE} OFFSET ${(pg - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n ${DE} WHERE ${W}`, params),
    pool.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE approuve) AS publies,
              COUNT(*) FILTER (WHERE NOT approuve AND masque_le IS NULL AND approbateur IS DISTINCT FROM 'collaborateur') AS attente,
              COUNT(*) FILTER (WHERE NOT approuve AND masque_le IS NULL AND approbateur = 'collaborateur') AS chez_collab, COUNT(*) FILTER (WHERE NOT approuve AND masque_le IS NOT NULL) AS masques,
              COALESCE(AVG(note) FILTER (WHERE approuve), 0) AS moyenne
         FROM avis_collaborateur WHERE gestionnaire_id = $1`, [req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const s = stats.rows[0];
  res.json({
    avis: liste.rows, total: n, page: pg, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
    addon_actif: true,
    stats: { total: +s.total, publies: +s.publies, attente: +s.attente, chez_collab: +s.chez_collab, masques: +s.masques, moyenne: Math.round(parseFloat(s.moyenne) * 10) / 10 },
  });
}));

router.get('/avis/compte', h(async (req, res) => {
  if (!(await avisMV.addonActif(req.gid, pool))) return res.json({ attente: 0, addon_actif: false });
  const r = await pool.query(`SELECT COUNT(*) AS n FROM avis_collaborateur WHERE gestionnaire_id = $1 AND approuve = false AND masque_le IS NULL AND approbateur IS DISTINCT FROM 'collaborateur'`, [req.gid]);
  res.json({ attente: parseInt(r.rows[0].n, 10) });
}));

router.post('/avis/:id/approuver', h(async (req, res) => {
  if (!(await avisMV.addonActif(req.gid, pool))) bad("L'add-on « Avis clients » n'est pas activé. Activez-le dans Forfait & Plan.", 403);
  const id = entier(req.params.id);
  if (!id) bad('Avis invalide');
  const r = await pool.query(
    `UPDATE avis_collaborateur SET approuve = true WHERE id = $1 AND gestionnaire_id = $2 AND approuve = false AND masque_le IS NULL`, [id, req.gid]);
  if (!r.rowCount) bad('Avis introuvable ou déjà traité.', 404);
  avisMV.notifierNouvelAvis(req.gid, id, pool);   // le collaborateur est prévenu à la publication
  res.json({ success: true });
}));

router.post('/avis/:id/masquer', h(async (req, res) => {
  if (!(await avisMV.addonActif(req.gid, pool))) bad("L'add-on « Avis clients » n'est pas activé. Activez-le dans Forfait & Plan.", 403);
  const id = entier(req.params.id);
  if (!id) bad('Avis invalide');
  const raison = texte(req.body && req.body.raison, 'Raison', 300);
  if (raison.length < 5) bad('Indiquez la raison (au moins 5 caractères).');
  const r = await pool.query(
    `UPDATE avis_collaborateur SET approuve = false, masque_raison = $1, masque_le = NOW(), masque_par = 'gestionnaire'
      WHERE id = $2 AND gestionnaire_id = $3 AND (approuve = true OR masque_le IS NULL)`, [raison, id, req.gid]);
  if (!r.rowCount) bad('Avis introuvable ou déjà masqué.', 404);
  res.json({ success: true });
}));

router.post('/avis/:id/retablir', h(async (req, res) => {
  if (!(await avisMV.addonActif(req.gid, pool))) bad("L'add-on « Avis clients » n'est pas activé. Activez-le dans Forfait & Plan.", 403);
  const id = entier(req.params.id);
  if (!id) bad('Avis invalide');
  const r = await pool.query(
    `UPDATE avis_collaborateur SET approuve = true, masque_raison = NULL, masque_le = NULL, masque_par = NULL
      WHERE id = $1 AND gestionnaire_id = $2 AND approuve = false AND masque_le IS NOT NULL`, [id, req.gid]);
  if (!r.rowCount) bad('Avis introuvable ou pas masqué.', 404);
  res.json({ success: true });
}));

// ── Questions sur le produit (add-on « questions_produit ») : modération du gestionnaire ─────────────────────────────────
// Les questions sont posées par les acheteurs, le vendeur y répond ; ici le gestionnaire voit tout, masque, rétablit ou supprime.
router.get('/questions/compte', h(async (req, res) => {
  const r = await pool.query(`SELECT COUNT(*)::int AS n FROM questions_produit WHERE gestionnaire_id = $1 AND statut = 'publiee' AND signalements > 0`, [req.gid]);
  res.json({ signalees: r.rows[0].n });
}));

router.get('/questions', h(async (req, res) => {
  const actifAddon = await require('../services/studio_addons').addonActifRapide(req.gid, 'questions_produit', pool);
  const statut = ['attente', 'publiee', 'masquee', 'signalees'].includes(req.query.statut) ? req.query.statut : null;
  const params = [req.gid]; let filtre = '';
  if (statut === 'signalees') filtre += ` AND q.statut = 'publiee' AND q.signalements > 0`;
  else if (statut) { params.push(statut); filtre += ` AND q.statut = $${params.length}`; }
  const cid = entier(req.query.collaborateur_id);
  if (cid) { params.push(cid); filtre += ` AND q.collaborateur_id = $${params.length}`; }
  const m = motif(req.query.q);
  if (m) { params.push(m); filtre += ` AND (q.question ILIKE $${params.length} OR q.reponse ILIKE $${params.length} OR p.titre ILIKE $${params.length})`; }
  const pg = page(req);
  params.push(PAR_PAGE, (pg - 1) * PAR_PAGE);
  const r = await pool.query(
    `SELECT q.id, q.question, q.reponse, q.reponse_le, q.statut, q.masque_raison, q.masque_par, q.signalements, q.created_at,
            q.produit_id, p.titre AS produit_titre, c.nom_boutique AS boutique, a.prenom, a.nom AS acheteur_nom, COUNT(*) OVER()::int AS total_lignes
       FROM questions_produit q
       LEFT JOIN produits p ON p.id = q.produit_id
       LEFT JOIN marketplace_collaborateurs c ON c.id = q.collaborateur_id
       LEFT JOIN marketplace_acheteurs a ON a.id = q.acheteur_id
      WHERE q.gestionnaire_id = $1${filtre}
      ORDER BY (q.statut = 'publiee' AND q.signalements > 0) DESC, q.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const stats = (await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE statut = 'attente')::int AS attente, COUNT(*) FILTER (WHERE statut = 'publiee')::int AS publiees,
            COUNT(*) FILTER (WHERE statut = 'masquee')::int AS masquees, COUNT(*) FILTER (WHERE statut = 'publiee' AND signalements > 0)::int AS signalees
       FROM questions_produit WHERE gestionnaire_id = $1`, [req.gid])).rows[0];
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  const nomPublic = require('../services/studio_questions').nomPublic;
  res.json({
    addon_actif: actifAddon, total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)), stats,
    questions: r.rows.map((x) => ({ id: x.id, produit_id: x.produit_id, produit_titre: x.produit_titre, boutique: x.boutique, question: x.question, reponse: x.reponse, reponse_le: x.reponse_le,
      statut: x.statut, masque_raison: x.masque_raison, masque_par: x.masque_par, signalements: x.signalements, created_at: x.created_at, acheteur: nomPublic(x.prenom, x.acheteur_nom) })),
  });
}));

router.post('/questions/:id/masquer', h(async (req, res) => {
  const id = entier(req.params.id); if (!id) bad('Question invalide.');
  const raison = typeof req.body.raison === 'string' ? req.body.raison.trim().slice(0, 200) : '';
  if (raison.length < 3) bad('Indiquez la raison (au moins 3 caractères).');
  const r = await pool.query(`UPDATE questions_produit SET statut = 'masquee', masque_raison = $1, masque_par = 'gestionnaire' WHERE id = $2 AND gestionnaire_id = $3 AND statut <> 'masquee'`, [raison, id, req.gid]);
  if (!r.rowCount) bad('Question introuvable.', 404);
  res.json({ message: 'Question masquée.' });
}));

router.post('/questions/:id/retablir', h(async (req, res) => {
  const id = entier(req.params.id); if (!id) bad('Question invalide.');
  const r = await pool.query(
    `UPDATE questions_produit SET statut = CASE WHEN reponse IS NOT NULL THEN 'publiee' ELSE 'attente' END, masque_raison = NULL, masque_par = NULL, signalements = 0
      WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'masquee'`, [id, req.gid]);
  if (!r.rowCount) bad('Question introuvable.', 404);
  await pool.query('DELETE FROM questions_produit_signalements WHERE question_id = $1', [id]);
  res.json({ message: 'Question rétablie.' });
}));

// « Ignorer » les signalements d'une question publiée (elle reste en ligne)
router.post('/questions/:id/ignorer-signalements', h(async (req, res) => {
  const id = entier(req.params.id); if (!id) bad('Question invalide.');
  const r = await pool.query(`UPDATE questions_produit SET signalements = 0 WHERE id = $1 AND gestionnaire_id = $2`, [id, req.gid]);
  if (!r.rowCount) bad('Question introuvable.', 404);
  await pool.query('DELETE FROM questions_produit_signalements WHERE question_id = $1', [id]);
  res.json({ message: 'Signalements ignorés.' });
}));

router.delete('/questions/:id', h(async (req, res) => {
  const id = entier(req.params.id); if (!id) bad('Question invalide.');
  const r = await pool.query('DELETE FROM questions_produit WHERE id = $1 AND gestionnaire_id = $2', [id, req.gid]);
  if (!r.rowCount) bad('Question introuvable.', 404);
  res.json({ message: 'Question supprimée.' });
}));

// ── Tableau de bord ──────────────────────────────────────────────────────────
// Adapté au template : le bloc « site » existe toujours ; les blocs boutique (ventes, produits, collaborateurs, avis…)
// seulement si le site est un Multi-vendeur. Les ventes comptent les commandes PAYÉES (hors annulées).
router.get('/dashboard', h(async (req, res) => {
  const jours = [7, 30, 90, 365].includes(parseInt(req.query.periode, 10)) ? parseInt(req.query.periode, 10) : 30;
  const nb = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const gid = req.gid;

  const site = (await pool.query(
    `SELECT template_id, publie, sous_domaine, domaine_perso, domaine_statut FROM sites WHERE gestionnaire_id = $1 LIMIT 1`, [gid])).rows[0] || {};
  const estMV = String(site.template_id || '').startsWith('multi-vendeur-premium');
  const base = { periode: jours, est_mv: estMV, site: {
    template_id: site.template_id || null, publie: site.publie === true,
    adresse: site.domaine_perso || (site.sous_domaine ? site.sous_domaine + '.e-vendstudio.ca' : null),
    domaine_perso: site.domaine_perso || null, domaine_statut: site.domaine_statut || null,
  } };
  if (!estMV) return res.json(base);

  const PAYE = `statut_paiement = 'paye' AND statut IS DISTINCT FROM 'annulee'`;
  // Pas du graphique : jour (≤ 90 j) ou semaine (1 an)
  const pas = jours > 90 ? 'week' : 'day';
  const [kpi, graph, parStatut, topProd, topCollab, prod, collab, acheteurs, avisR, distAvis, attAvis, attRemb] = await Promise.all([
    pool.query(`SELECT
        COALESCE(SUM(total) FILTER (WHERE ${PAYE} AND date_commande >= NOW() - make_interval(days => $2::int)), 0) AS ventes,
        COALESCE(SUM(total) FILTER (WHERE ${PAYE} AND date_commande >= NOW() - make_interval(days => $2::int * 2) AND date_commande < NOW() - make_interval(days => $2::int)), 0) AS ventes_prec,
        COALESCE(SUM(commission) FILTER (WHERE ${PAYE} AND date_commande >= NOW() - make_interval(days => $2::int)), 0) AS commissions,
        COALESCE(SUM(total) FILTER (WHERE ${PAYE} AND date_commande >= date_trunc('day', NOW())), 0) AS ventes_aujourdhui,
        COALESCE(SUM(total) FILTER (WHERE ${PAYE}), 0) AS ventes_total,
        COUNT(*) FILTER (WHERE ${PAYE} AND date_commande >= NOW() - make_interval(days => $2::int)) AS commandes,
        COUNT(*) FILTER (WHERE ${PAYE} AND date_commande >= NOW() - make_interval(days => $2::int * 2) AND date_commande < NOW() - make_interval(days => $2::int)) AS commandes_prec,
        COUNT(*) FILTER (WHERE ${PAYE}) AS commandes_total
      FROM marketplace_commandes WHERE gestionnaire_id = $1`, [gid, jours]),
    pool.query(`SELECT to_char(g.d, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(c.total), 0) AS ventes, COUNT(c.id) AS commandes
      FROM generate_series(date_trunc('${pas}', NOW() - make_interval(days => $2::int)), date_trunc('${pas}', NOW()), '1 ${pas}'::interval) AS g(d)
      LEFT JOIN marketplace_commandes c ON c.gestionnaire_id = $1 AND c.statut_paiement = 'paye' AND c.statut IS DISTINCT FROM 'annulee'
           AND date_trunc('${pas}', c.date_commande) = g.d
      GROUP BY g.d ORDER BY g.d`, [gid, jours]),
    pool.query(`SELECT statut, COUNT(*) AS n FROM marketplace_commandes
                 WHERE gestionnaire_id = $1 AND statut_paiement = 'paye' AND date_commande >= NOW() - make_interval(days => $2::int) GROUP BY statut`, [gid, jours]),
    pool.query(`SELECT COALESCE(a->>'titre', 'Produit') AS nom,
                       SUM(COALESCE(NULLIF(a->>'quantite','')::int, 1)) AS ventes,
                       SUM(COALESCE(NULLIF(a->>'prix','')::numeric, 0) * COALESCE(NULLIF(a->>'quantite','')::int, 1)) AS revenu
                  FROM marketplace_commandes c, jsonb_array_elements(COALESCE(c.articles, '[]'::jsonb)) a
                 WHERE c.gestionnaire_id = $1 AND c.statut_paiement = 'paye' AND c.statut IS DISTINCT FROM 'annulee'
                   AND c.date_commande >= NOW() - make_interval(days => $2::int)
                 GROUP BY 1 ORDER BY revenu DESC LIMIT 5`, [gid, jours]),
    pool.query(`SELECT COALESCE(col.nom_boutique, 'Boutique') AS nom, COUNT(*) AS commandes, COALESCE(SUM(c.total), 0) AS revenu
                  FROM marketplace_commandes c LEFT JOIN marketplace_collaborateurs col ON col.id = c.collaborateur_id
                 WHERE c.gestionnaire_id = $1 AND c.statut_paiement = 'paye' AND c.statut IS DISTINCT FROM 'annulee'
                   AND c.date_commande >= NOW() - make_interval(days => $2::int)
                 GROUP BY col.id, col.nom_boutique ORDER BY revenu DESC LIMIT 5`, [gid, jours]),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE statut = 'actif') AS actifs, COUNT(*) FILTER (WHERE statut = 'brouillon') AS brouillons,
                       COUNT(*) FILTER (WHERE statut = 'en_attente') AS en_attente, COUNT(*) FILTER (WHERE stock = 0) AS ruptures
                  FROM produits WHERE gestionnaire_id = $1`, [gid]),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE statut = 'actif') AS actifs FROM marketplace_collaborateurs WHERE gestionnaire_id = $1`, [gid]),
    pool.query(`SELECT COUNT(*) AS total FROM marketplace_acheteurs WHERE gestionnaire_id = $1`, [gid]),
    pool.query(`SELECT COALESCE(AVG(note), 0) AS moyenne, COUNT(*) AS total FROM avis_collaborateur WHERE gestionnaire_id = $1 AND approuve = true`, [gid]),
    pool.query(`SELECT note, COUNT(*) AS n FROM avis_collaborateur WHERE gestionnaire_id = $1 AND approuve = true GROUP BY note`, [gid]),
    pool.query(`SELECT COUNT(*) AS n FROM avis_collaborateur WHERE gestionnaire_id = $1 AND approuve = false AND masque_le IS NULL AND approbateur IS DISTINCT FROM 'collaborateur'`, [gid]),
    pool.query(`SELECT COUNT(*) AS n FROM commande_remboursements WHERE gestionnaire_id = $1 AND statut = 'en_attente'`, [gid]),
  ]);

  const k = kpi.rows[0], p = prod.rows[0], c = collab.rows[0];
  const croiss = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : null);
  const statuts = {}; parStatut.rows.forEach((r) => { statuts[r.statut] = parseInt(r.n, 10); });
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; distAvis.rows.forEach((r) => { const n = Math.round(nb(r.note)); if (dist[n] !== undefined) dist[n] = parseInt(r.n, 10); });

  res.json({
    ...base,
    ventes: { periode: nb(k.ventes), croissance: croiss(nb(k.ventes), nb(k.ventes_prec)), aujourdhui: nb(k.ventes_aujourdhui), total: nb(k.ventes_total), commissions: nb(k.commissions) },
    commandes: { periode: parseInt(k.commandes, 10), croissance: croiss(+k.commandes, +k.commandes_prec), total: parseInt(k.commandes_total, 10), par_statut: statuts },
    graphique: graph.rows.map((r) => ({ date: r.date, ventes: nb(r.ventes), commandes: parseInt(r.commandes, 10) })),
    pas,
    top_produits: topProd.rows.map((r) => ({ nom: r.nom, ventes: parseInt(r.ventes, 10), revenu: nb(r.revenu) })),
    top_collaborateurs: topCollab.rows.map((r) => ({ nom: r.nom, commandes: parseInt(r.commandes, 10), revenu: nb(r.revenu) })),
    produits: { total: +p.total, actifs: +p.actifs, brouillons: +p.brouillons, en_attente: +p.en_attente, ruptures: +p.ruptures },
    collaborateurs: { total: +c.total, actifs: +c.actifs },
    acheteurs: { total: parseInt(acheteurs.rows[0].total, 10) },
    avis: { moyenne: nb(avisR.rows[0].moyenne), total: parseInt(avisR.rows[0].total, 10), distribution: dist },
    a_faire: { avis_en_attente: parseInt(attAvis.rows[0].n, 10), remboursements_en_attente: parseInt(attRemb.rows[0].n, 10), produits_en_attente: +p.en_attente,
               commandes_a_traiter: (statuts.en_attente || 0) + (statuts.confirmee || 0) },
  });
}));

module.exports = router;