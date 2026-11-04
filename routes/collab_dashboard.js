// CHEMIN : routes/collab_dashboard.js
// e-Vend Studio — API du dashboard collaborateur (produits, réductions, commandes, paiements,
// retours, avis, profil, boutique, configuration, envoi d'images).
//
// Monté dans server.js sur : /api/collab/:gestionnaireId
// Accès : cookie httpOnly mv_token_<gestionnaireId> d'un collaborateur au statut « actif ».
// Chaque requête est limitée aux données de CE collaborateur dans CETTE boutique.

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');

const router = express.Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET;
const PAR_PAGE = 50;

// ─── Utilitaires (inline) ─────────────────────────────────────────────────────

class Invalide extends Error {
  constructor(message, status) { super(message); this.status = status || 400; }
}
const bad = (message, status) => { throw new Invalide(message, status); };

// Enveloppe : erreurs de validation → 4xx lisible ; le reste → 500 sans détail.
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Invalide) return res.status(e.status).json({ error: e.message });
    if (e && e.code === '23505') return res.status(409).json({ error: 'Cet élément existe déjà.' });
    console.error('[collab_dashboard]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
}

// Nombre borné. `vide` : valeur renvoyée si le champ est vide (undefined = champ obligatoire).
function nombre(v, nom, min, max, vide) {
  if (v === undefined || v === null || v === '') {
    if (vide === undefined) bad(`${nom} requis`);
    return vide;
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) bad(`${nom} invalide (entre ${min} et ${max})`);
  return Math.round(n * 100) / 100;
}

// Texte seul : balises retirées (scripts avec leur contenu), caractères de contrôle retirés.
const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };
function texte(v, nom, max, obligatoire) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') bad(`${nom} invalide`);
  if (v.length > max * 5) bad(`${nom} trop long (max ${max} caractères)`);
  let t = sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} });
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITES[e]);
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  t = t.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (t.length > max) bad(`${nom} trop long (max ${max} caractères)`);
  if (obligatoire && !t) bad(`${nom} requis`);
  return t;
}

function dateISO(v, nom) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) bad(`${nom} invalide`);
  return v;
}

function pageDemandee(req) {
  const p = parseInt(req.query.page, 10);
  return Number.isInteger(p) && p > 0 && p < 100000 ? p : 1;
}

function motif(q) { // texte de recherche → motif ILIKE sûr
  const t = typeof q === 'string' ? q.trim().slice(0, 80) : '';
  return t ? '%' + t.replace(/[\\%_]/g, (c) => '\\' + c) + '%' : null;
}

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now);
  compteurs.set(cle, liste);
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [cle, liste] of compteurs) {
    const restants = liste.filter((t) => now - t < 3600000);
    if (restants.length) compteurs.set(cle, restants); else compteurs.delete(cle);
  }
}, 10 * 60 * 1000).unref();

// ─── Authentification collaborateur ───────────────────────────────────────────

router.use(h(async (req, res, next) => {
  const gid = entier(req.params.gestionnaireId);
  if (!gid) bad('Boutique invalide');
  const token = req.cookies && req.cookies[`mv_token_${gid}`];
  if (!token) bad('Non authentifié', 401);
  let payload;
  try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { bad('Session expirée', 401); }
  if (payload.type !== 'collaborateur' || Number(payload.gestionnaireId) !== gid) bad('Accès refusé', 403);
  const r = await pool.query(
    `SELECT id FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif'`,
    [entier(payload.id), gid]
  );
  if (!r.rows.length) bad('Compte non actif', 403);
  req.gid = gid;
  req.cid = r.rows[0].id;
  next();
}));

// ════════════════════════════════════════════════════════════════════════════
// IMAGES — envoi (JPEG, PNG, WebP, GIF ; 5 Mo ; jamais de SVG)
// ════════════════════════════════════════════════════════════════════════════

const envoi = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('file');

function extensionSelonContenu(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  return null;
}

router.post('/upload', (req, res) => {
  if (!limite(`up-${req.cid}`, 30, 60 * 1000)) return res.status(429).json({ error: 'Trop d\'envois. Réessayez dans une minute.' });
  envoi(req, res, (err) => {
    if (err) {
      const gros = err.code === 'LIMIT_FILE_SIZE';
      return res.status(gros ? 413 : 400).json({ error: gros ? 'Image trop lourde (max 5 Mo)' : 'Envoi invalide' });
    }
    h(async () => {
      if (!req.file) bad('Aucun fichier reçu');
      const ext = extensionSelonContenu(req.file.buffer);
      if (!ext) bad('Format non accepté (JPEG, PNG, WebP ou GIF seulement)');
      const dossier = path.join(__dirname, '..', 'uploads', 'collab', String(req.gid), String(req.cid));
      await fs.promises.mkdir(dossier, { recursive: true });
      const existants = await fs.promises.readdir(dossier);
      if (existants.length >= 300) bad('Limite de 300 images atteinte', 409);
      const nom = crypto.randomBytes(16).toString('hex') + '.' + ext;
      await fs.promises.writeFile(path.join(dossier, nom), req.file.buffer, { flag: 'wx' });
      res.status(201).json({ url: `/uploads/collab/${req.gid}/${req.cid}/${nom}` });
    })(req, res);
  });
});

function urlImage(req, v, nom) {
  if (v === undefined || v === null || v === '') return null;
  const re = new RegExp(`^/uploads/collab/${req.gid}/${req.cid}/[a-f0-9]{32}\\.(jpg|png|webp|gif)$`);
  if (typeof v !== 'string' || !re.test(v)) bad(`${nom} invalide (utilisez le bouton d'envoi)`);
  return v;
}

// ════════════════════════════════════════════════════════════════════════════
// PRODUITS (annonces)
// ════════════════════════════════════════════════════════════════════════════

const STATUTS_PRODUIT = ['actif', 'brouillon'];

router.get('/categories', h(async (req, res) => {
  const r = await pool.query(`SELECT cle, label, emoji FROM categories_pub WHERE actif = true ORDER BY ordre, label`);
  res.json(r.rows);
}));

router.get('/produits', h(async (req, res) => {
  const where = ['collaborateur_id = $1', 'gestionnaire_id = $2'];
  const params = [req.cid, req.gid];
  const m = motif(req.query.q);
  if (m) { params.push(m); where.push(`(titre ILIKE $${params.length} OR sku ILIKE $${params.length})`); }
  if (STATUTS_PRODUIT.includes(req.query.statut)) { params.push(req.query.statut); where.push(`statut = $${params.length}`); }
  if (req.query.stock === 'rupture') where.push('stock = 0');
  const W = where.join(' AND ');
  const page = pageDemandee(req);
  const [liste, total, stats] = await Promise.all([
    pool.query(
      `SELECT id, titre, prix, prix_promo, stock, sku, categorie, photo_principale, statut, created_at
         FROM produits WHERE ${W} ORDER BY created_at DESC, id DESC LIMIT ${PAR_PAGE} OFFSET ${(page - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n FROM produits WHERE ${W}`, params),
    pool.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE statut = 'actif') AS actifs,
              COUNT(*) FILTER (WHERE statut = 'brouillon') AS brouillons, COUNT(*) FILTER (WHERE stock = 0) AS ruptures
         FROM produits WHERE collaborateur_id = $1 AND gestionnaire_id = $2`, [req.cid, req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const s = stats.rows[0];
  res.json({
    produits: liste.rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
    stats: { total: +s.total, actifs: +s.actifs, brouillons: +s.brouillons, ruptures: +s.ruptures },
  });
}));

router.get('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const r = await pool.query(
    `SELECT id, titre, description, prix, prix_promo, stock, sku, categorie, photo_principale, photos, variantes, statut
       FROM produits WHERE id = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3`, [id, req.cid, req.gid]);
  if (!r.rows.length) bad('Produit introuvable', 404);
  res.json(r.rows[0]);
}));

function lireProduit(req) {
  const b = req.body || {};
  const titre = texte(b.titre, 'Titre', 150, true);
  const description = texte(b.description, 'Description', 5000);
  const prix = nombre(b.prix, 'Prix', 0, 1000000);
  const prixPromo = nombre(b.prix_promo, 'Prix promo', 0, 1000000, null);
  if (prixPromo !== null && prixPromo >= prix) bad('Le prix promo doit être inférieur au prix');
  const stock = b.stock === '' || b.stock === undefined || b.stock === null ? null : Math.trunc(nombre(b.stock, 'Stock', 0, 1000000));
  const sku = texte(b.sku, 'SKU', 60);
  const categorie = texte(b.categorie, 'Catégorie', 80);
  const statut = b.statut === undefined ? 'brouillon' : b.statut;
  if (!STATUTS_PRODUIT.includes(statut)) bad('Statut invalide');
  if (!Array.isArray(b.photos || [])) bad('Photos invalides');
  const photos = (b.photos || []).slice(0, 8).map((u) => urlImage(req, u, 'Photo'));
  if ((b.photos || []).length > 8) bad('Maximum 8 photos');
  if (!Array.isArray(b.variantes || [])) bad('Variantes invalides');
  if ((b.variantes || []).length > 20) bad('Maximum 20 variantes');
  const variantes = (b.variantes || []).map((v) => {
    if (!v || typeof v !== 'object') bad('Variante invalide');
    return {
      nom: texte(v.nom, 'Nom de variante', 60, true),
      prix: nombre(v.prix, 'Prix de variante', 0, 1000000, null),
      stock: v.stock === '' || v.stock === undefined || v.stock === null ? null : Math.trunc(nombre(v.stock, 'Stock de variante', 0, 1000000)),
    };
  });
  return { titre, description, prix, prixPromo, stock, sku, categorie, statut, photos, variantes };
}

router.post('/produits', h(async (req, res) => {
  const p = lireProduit(req);
  const n = await pool.query(`SELECT COUNT(*) AS n FROM produits WHERE collaborateur_id = $1`, [req.cid]);
  if (+n.rows[0].n >= 1000) bad('Limite de 1000 produits atteinte', 409);
  const r = await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, prix_promo, stock, sku, categorie,
                           photo_principale, photos, variantes, statut)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [req.gid, req.cid, p.titre, p.description, p.prix, p.prixPromo, p.stock, p.sku || null, p.categorie || null,
     p.photos[0] || null, JSON.stringify(p.photos), JSON.stringify(p.variantes), p.statut]);
  res.status(201).json({ id: r.rows[0].id });
}));

router.put('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const p = lireProduit(req);
  const r = await pool.query(
    `UPDATE produits SET titre=$1, description=$2, prix=$3, prix_promo=$4, stock=$5, sku=$6, categorie=$7,
            photo_principale=$8, photos=$9, variantes=$10, statut=$11, updated_at=NOW()
      WHERE id=$12 AND collaborateur_id=$13 AND gestionnaire_id=$14`,
    [p.titre, p.description, p.prix, p.prixPromo, p.stock, p.sku || null, p.categorie || null,
     p.photos[0] || null, JSON.stringify(p.photos), JSON.stringify(p.variantes), p.statut, id, req.cid, req.gid]);
  if (!r.rowCount) bad('Produit introuvable', 404);
  res.json({ success: true });
}));

router.patch('/produits/:id/statut', h(async (req, res) => {
  const id = entier(req.params.id);
  const statut = req.body && req.body.statut;
  if (!id || !STATUTS_PRODUIT.includes(statut)) bad('Statut invalide');
  const r = await pool.query(
    `UPDATE produits SET statut=$1, updated_at=NOW() WHERE id=$2 AND collaborateur_id=$3 AND gestionnaire_id=$4`,
    [statut, id, req.cid, req.gid]);
  if (!r.rowCount) bad('Produit introuvable', 404);
  res.json({ success: true });
}));

router.post('/produits/:id/dupliquer', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const r = await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, prix_promo, stock, sku, categorie,
                           photo_principale, photos, variantes, statut)
     SELECT gestionnaire_id, collaborateur_id, LEFT('Copie de ' || titre, 150), description, prix, prix_promo, stock, NULL, categorie,
            photo_principale, photos, variantes, 'brouillon'
       FROM produits WHERE id=$1 AND collaborateur_id=$2 AND gestionnaire_id=$3 RETURNING id`,
    [id, req.cid, req.gid]);
  if (!r.rowCount) bad('Produit introuvable', 404);
  res.status(201).json({ id: r.rows[0].id });
}));

router.delete('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const r = await pool.query(`DELETE FROM produits WHERE id=$1 AND collaborateur_id=$2 AND gestionnaire_id=$3`, [id, req.cid, req.gid]);
  if (!r.rowCount) bad('Produit introuvable', 404);
  res.json({ success: true });
}));

router.post('/produits/bulk/supprimer', h(async (req, res) => {
  const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map(entier).filter(Boolean).slice(0, 100) : [];
  if (!ids.length) bad('Aucun produit sélectionné');
  const r = await pool.query(
    `DELETE FROM produits WHERE id = ANY($1::int[]) AND collaborateur_id=$2 AND gestionnaire_id=$3`, [ids, req.cid, req.gid]);
  res.json({ supprimes: r.rowCount });
}));

// ════════════════════════════════════════════════════════════════════════════
// RÉDUCTIONS / CODES PROMO
// ════════════════════════════════════════════════════════════════════════════

const SQL_RED = `
  SELECT id, code, type, valeur, montant_minimum, date_debut::text AS date_debut, date_fin::text AS date_fin, utilisations_max, utilisations, actif, created_at,
         CASE WHEN NOT actif THEN 'inactif'
              WHEN date_fin IS NOT NULL AND date_fin < CURRENT_DATE THEN 'expire'
              WHEN date_debut IS NOT NULL AND date_debut > CURRENT_DATE THEN 'planifie'
              WHEN utilisations_max IS NOT NULL AND utilisations >= utilisations_max THEN 'epuise'
              ELSE 'actif' END AS etat
    FROM reductions_collaborateur WHERE collaborateur_id = $1 AND gestionnaire_id = $2`;

router.get('/reductions', h(async (req, res) => {
  const r = await pool.query(SQL_RED + ' ORDER BY created_at DESC LIMIT 500', [req.cid, req.gid]);
  res.json(r.rows);
}));

function lireReduction(req) {
  const b = req.body || {};
  const code = texte(b.code, 'Code', 30, true).toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) bad('Code invalide : 3 à 30 lettres, chiffres, - ou _');
  if (!['pourcentage', 'montant'].includes(b.type)) bad('Type invalide');
  const valeur = nombre(b.valeur, 'Valeur', 0.01, b.type === 'pourcentage' ? 100 : 10000);
  const montantMin = nombre(b.montant_minimum, 'Montant minimum', 0, 1000000, 0);
  const debut = dateISO(b.date_debut, 'Date de début');
  const fin = dateISO(b.date_fin, 'Date de fin');
  if (debut && fin && fin < debut) bad('La date de fin précède la date de début');
  const max = b.utilisations_max === '' || b.utilisations_max === undefined || b.utilisations_max === null
    ? null : Math.trunc(nombre(b.utilisations_max, 'Utilisations max', 1, 1000000));
  return { code, type: b.type, valeur, montantMin, debut, fin, max, actif: b.actif !== false };
}

router.post('/reductions', h(async (req, res) => {
  const d = lireReduction(req);
  const n = await pool.query(`SELECT COUNT(*) AS n FROM reductions_collaborateur WHERE collaborateur_id=$1`, [req.cid]);
  if (+n.rows[0].n >= 200) bad('Limite de 200 codes atteinte', 409);
  const r = await pool.query(
    `INSERT INTO reductions_collaborateur (gestionnaire_id, collaborateur_id, code, type, valeur, montant_minimum, date_debut, date_fin, utilisations_max, actif)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [req.gid, req.cid, d.code, d.type, d.valeur, d.montantMin, d.debut, d.fin, d.max, d.actif]);
  res.status(201).json({ id: r.rows[0].id });
}));

router.put('/reductions/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Code invalide');
  const d = lireReduction(req);
  const r = await pool.query(
    `UPDATE reductions_collaborateur SET code=$1, type=$2, valeur=$3, montant_minimum=$4, date_debut=$5, date_fin=$6, utilisations_max=$7, actif=$8
      WHERE id=$9 AND collaborateur_id=$10 AND gestionnaire_id=$11`,
    [d.code, d.type, d.valeur, d.montantMin, d.debut, d.fin, d.max, d.actif, id, req.cid, req.gid]);
  if (!r.rowCount) bad('Code introuvable', 404);
  res.json({ success: true });
}));

router.patch('/reductions/:id/actif', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id || typeof (req.body && req.body.actif) !== 'boolean') bad('Requête invalide');
  const r = await pool.query(
    `UPDATE reductions_collaborateur SET actif=$1 WHERE id=$2 AND collaborateur_id=$3 AND gestionnaire_id=$4`,
    [req.body.actif, id, req.cid, req.gid]);
  if (!r.rowCount) bad('Code introuvable', 404);
  res.json({ success: true });
}));

router.delete('/reductions/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Code invalide');
  const r = await pool.query(`DELETE FROM reductions_collaborateur WHERE id=$1 AND collaborateur_id=$2 AND gestionnaire_id=$3`, [id, req.cid, req.gid]);
  if (!r.rowCount) bad('Code introuvable', 404);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// COMMANDES
// ════════════════════════════════════════════════════════════════════════════

const STATUTS_COMMANDE = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'];
const STATUTS_PAIEMENT = ['en_attente', 'paye', 'rembourse', 'echoue'];
const TRANSITIONS = {
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['expediee', 'annulee'],
  expediee: ['livree'],
  livree: [],
  annulee: [],
};

function filtreCommandes(req, ignorerStatut) {
  const where = ['c.collaborateur_id = $1', 'c.gestionnaire_id = $2'];
  const params = [req.cid, req.gid];
  const m = motif(req.query.q);
  if (m) {
    params.push(m);
    const i = params.length;
    where.push(`(c.numero_commande ILIKE $${i} OR a.nom ILIKE $${i} OR a.prenom ILIKE $${i} OR a.email ILIKE $${i})`);
  }
  if (!ignorerStatut && STATUTS_COMMANDE.includes(req.query.statut)) { params.push(req.query.statut); where.push(`c.statut = $${params.length}`); }
  if (STATUTS_PAIEMENT.includes(req.query.statut_paiement)) { params.push(req.query.statut_paiement); where.push(`c.statut_paiement = $${params.length}`); }
  const du = req.query.du ? dateISO(req.query.du, 'Date de début') : null;
  const au = req.query.au ? dateISO(req.query.au, 'Date de fin') : null;
  if (du) { params.push(du); where.push(`c.date_commande >= $${params.length}::date`); }
  if (au) { params.push(au); where.push(`c.date_commande < ($${params.length}::date + 1)`); }
  return { W: where.join(' AND '), params };
}

const COLS_COMMANDE = `c.id, c.numero_commande, c.statut, c.statut_paiement, c.total, c.commission, c.montant_net,
       c.date_commande, c.numero_suivi, c.transporteur, jsonb_array_length(COALESCE(c.articles, '[]'::jsonb)) AS nb_articles,
       a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email`;
const JOIN_ACHETEUR = 'FROM marketplace_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id';

router.get('/commandes', h(async (req, res) => {
  const { W, params } = filtreCommandes(req, false);
  const page = pageDemandee(req);
  const [liste, total, comptes] = await Promise.all([
    pool.query(`SELECT ${COLS_COMMANDE} ${JOIN_ACHETEUR} WHERE ${W} ORDER BY c.date_commande DESC, c.id DESC LIMIT ${PAR_PAGE} OFFSET ${(page - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n ${JOIN_ACHETEUR} WHERE ${W}`, params),
    pool.query(`SELECT statut, COUNT(*) AS n FROM marketplace_commandes WHERE collaborateur_id=$1 AND gestionnaire_id=$2 GROUP BY statut`, [req.cid, req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const parStatut = {};
  comptes.rows.forEach((r) => { parStatut[r.statut] = parseInt(r.n, 10); });
  res.json({ commandes: liste.rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAR_PAGE)), par_statut: parStatut });
}));

router.get('/commandes/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Commande invalide');
  const r = await pool.query(
    `SELECT c.id, c.numero_commande, c.statut, c.statut_paiement, c.total, c.commission, c.montant_net, c.articles, c.adresse_livraison,
            c.note, c.date_commande, c.numero_suivi, c.transporteur, c.paye_le,
            a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email, a.telephone AS acheteur_telephone
       ${JOIN_ACHETEUR} WHERE c.id = $1 AND c.collaborateur_id = $2 AND c.gestionnaire_id = $3`, [id, req.cid, req.gid]);
  if (!r.rows.length) bad('Commande introuvable', 404);
  const retours = await pool.query(
    `SELECT id, motif, statut, created_at FROM demandes_retour WHERE commande_id = $1 AND collaborateur_id = $2 ORDER BY created_at DESC`, [id, req.cid]);
  res.json({ ...r.rows[0], retours: retours.rows, transitions: TRANSITIONS[r.rows[0].statut] || [] });
}));

router.put('/commandes/:id/statut', h(async (req, res) => {
  const id = entier(req.params.id);
  const b = req.body || {};
  if (!id || !STATUTS_COMMANDE.includes(b.statut)) bad('Statut invalide');
  const c = await pool.query(
    `SELECT statut, statut_paiement FROM marketplace_commandes WHERE id=$1 AND collaborateur_id=$2 AND gestionnaire_id=$3`, [id, req.cid, req.gid]);
  if (!c.rows.length) bad('Commande introuvable', 404);
  const actuel = c.rows[0];
  if (!(TRANSITIONS[actuel.statut] || []).includes(b.statut)) bad(`Passage impossible : ${actuel.statut} → ${b.statut}`, 409);
  if (b.statut === 'annulee' && actuel.statut_paiement === 'paye') {
    bad('Commande déjà payée : traitez-la avec une demande de retour / remboursement.', 409);
  }
  const suivi = b.statut === 'expediee' ? texte(b.numero_suivi, 'Numéro de suivi', 80) : '';
  const transp = b.statut === 'expediee' ? texte(b.transporteur, 'Transporteur', 60) : '';
  await pool.query(
    `UPDATE marketplace_commandes SET statut=$1, updated_at=NOW(),
            numero_suivi = CASE WHEN $7::boolean THEN NULLIF($2::text,'') ELSE numero_suivi END,
            transporteur = CASE WHEN $7::boolean THEN NULLIF($3::text,'') ELSE transporteur END
      WHERE id=$4 AND collaborateur_id=$5 AND gestionnaire_id=$6`,
    [b.statut, suivi, transp, id, req.cid, req.gid, b.statut === 'expediee']);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// PAIEMENTS
// ════════════════════════════════════════════════════════════════════════════

router.get('/paiements', h(async (req, res) => {
  const { W, params } = filtreCommandes(req, true);
  const base = `${W} AND c.statut <> 'annulee'`;
  const page = pageDemandee(req);
  const [liste, total, somme] = await Promise.all([
    pool.query(`SELECT ${COLS_COMMANDE}, c.paye_le ${JOIN_ACHETEUR} WHERE ${base} ORDER BY c.date_commande DESC, c.id DESC LIMIT ${PAR_PAGE} OFFSET ${(page - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n ${JOIN_ACHETEUR} WHERE ${base}`, params),
    pool.query(
      `SELECT COALESCE(SUM(c.total) FILTER (WHERE c.statut_paiement = 'paye'), 0) AS encaisse,
              COALESCE(SUM(c.commission) FILTER (WHERE c.statut_paiement = 'paye'), 0) AS commissions,
              COALESCE(SUM(c.montant_net) FILTER (WHERE c.statut_paiement = 'paye'), 0) AS net,
              COALESCE(SUM(c.total) FILTER (WHERE c.statut_paiement = 'en_attente'), 0) AS en_attente,
              COALESCE(SUM(c.total) FILTER (WHERE c.statut_paiement = 'rembourse'), 0) AS rembourse
         ${JOIN_ACHETEUR} WHERE ${base}`, params),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const s = somme.rows[0];
  res.json({
    paiements: liste.rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
    totaux: { encaisse: +s.encaisse, commissions: +s.commissions, net: +s.net, en_attente: +s.en_attente, rembourse: +s.rembourse },
  });
}));

// ════════════════════════════════════════════════════════════════════════════
// RETOURS / REMBOURSEMENTS
// ════════════════════════════════════════════════════════════════════════════

router.get('/retours', h(async (req, res) => {
  const where = ['r.collaborateur_id = $1', 'r.gestionnaire_id = $2'];
  const params = [req.cid, req.gid];
  if (['en_attente', 'approuve', 'refuse', 'termine'].includes(req.query.statut)) { params.push(req.query.statut); where.push(`r.statut = $${params.length}`); }
  const W = where.join(' AND ');
  const page = pageDemandee(req);
  const [liste, total, comptes] = await Promise.all([
    pool.query(
      `SELECT r.id, r.commande_id, r.motif, r.details, r.statut, r.montant_remboursement, r.reponse, r.created_at, r.updated_at,
              c.numero_commande, c.total AS total_commande, a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email
         FROM demandes_retour r JOIN marketplace_commandes c ON c.id = r.commande_id
         LEFT JOIN marketplace_acheteurs a ON a.id = r.acheteur_id
        WHERE ${W} ORDER BY r.created_at DESC, r.id DESC LIMIT ${PAR_PAGE} OFFSET ${(page - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n FROM demandes_retour r WHERE ${W}`, params),
    pool.query(`SELECT statut, COUNT(*) AS n FROM demandes_retour WHERE collaborateur_id=$1 AND gestionnaire_id=$2 GROUP BY statut`, [req.cid, req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const parStatut = {};
  comptes.rows.forEach((r) => { parStatut[r.statut] = parseInt(r.n, 10); });
  res.json({ retours: liste.rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAR_PAGE)), par_statut: parStatut });
}));

async function actionRetour(req, res, depuis, vers, champs) {
  const id = entier(req.params.id);
  if (!id) bad('Demande invalide');
  const c = await pool.query(
    `SELECT r.statut, c.total FROM demandes_retour r JOIN marketplace_commandes c ON c.id = r.commande_id
      WHERE r.id=$1 AND r.collaborateur_id=$2 AND r.gestionnaire_id=$3`, [id, req.cid, req.gid]);
  if (!c.rows.length) bad('Demande introuvable', 404);
  if (c.rows[0].statut !== depuis) bad('Cette demande ne peut plus être modifiée ainsi', 409);
  const f = champs(c.rows[0]);
  await pool.query(
    `UPDATE demandes_retour SET statut=$1, montant_remboursement=COALESCE($2, montant_remboursement),
            reponse=COALESCE(NULLIF($3,''), reponse), updated_at=NOW() WHERE id=$4`,
    [vers, f.montant, f.reponse, id]);
  res.json({ success: true });
}

router.put('/retours/:id/approuver', h((req, res) => actionRetour(req, res, 'en_attente', 'approuve', (cmd) => {
  const montant = nombre(req.body && req.body.montant_remboursement, 'Montant', 0, 1000000, null);
  if (montant !== null && montant > Number(cmd.total)) bad('Le remboursement dépasse le total de la commande');
  return { montant, reponse: texte(req.body && req.body.reponse, 'Réponse', 1000) };
})));
router.put('/retours/:id/refuser', h((req, res) => actionRetour(req, res, 'en_attente', 'refuse', () => (
  { montant: null, reponse: texte(req.body && req.body.reponse, 'Raison du refus', 1000, true) }
))));
router.put('/retours/:id/terminer', h((req, res) => actionRetour(req, res, 'approuve', 'termine', () => (
  { montant: null, reponse: '' }
))));

// ════════════════════════════════════════════════════════════════════════════
// AVIS CLIENTS
// ════════════════════════════════════════════════════════════════════════════

router.get('/avis', h(async (req, res) => {
  const where = ['v.collaborateur_id = $1', 'v.gestionnaire_id = $2', 'v.approuve = true'];
  const params = [req.cid, req.gid];
  const note = entier(req.query.note);
  if (note && note <= 5) { params.push(note); where.push(`v.note = $${params.length}`); }
  if (req.query.sans_reponse === '1') where.push('v.reponse IS NULL');
  const W = where.join(' AND ');
  const page = pageDemandee(req);
  const [liste, total, stats] = await Promise.all([
    pool.query(
      `SELECT v.id, v.note, v.titre, v.commentaire, v.reponse, v.reponse_le, v.created_at, p.titre AS produit_titre,
              a.prenom AS acheteur_prenom, LEFT(COALESCE(a.nom, ''), 1) AS acheteur_initiale
         FROM avis_collaborateur v LEFT JOIN marketplace_acheteurs a ON a.id = v.acheteur_id
         LEFT JOIN produits p ON p.id = v.produit_id
        WHERE ${W} ORDER BY v.created_at DESC, v.id DESC LIMIT ${PAR_PAGE} OFFSET ${(page - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n FROM avis_collaborateur v WHERE ${W}`, params),
    pool.query(
      `SELECT COALESCE(AVG(note), 0) AS moyenne, COUNT(*) AS total,
              COUNT(*) FILTER (WHERE note = 5) AS n5, COUNT(*) FILTER (WHERE note = 4) AS n4, COUNT(*) FILTER (WHERE note = 3) AS n3,
              COUNT(*) FILTER (WHERE note = 2) AS n2, COUNT(*) FILTER (WHERE note = 1) AS n1
         FROM avis_collaborateur WHERE collaborateur_id=$1 AND gestionnaire_id=$2 AND approuve = true`, [req.cid, req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const s = stats.rows[0];
  res.json({
    avis: liste.rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
    stats: { moyenne: Math.round(parseFloat(s.moyenne) * 10) / 10, total: +s.total, repartition: { 5: +s.n5, 4: +s.n4, 3: +s.n3, 2: +s.n2, 1: +s.n1 } },
  });
}));

router.put('/avis/:id/reponse', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Avis invalide');
  const reponse = texte(req.body && req.body.reponse, 'Réponse', 1000);
  const r = await pool.query(
    `UPDATE avis_collaborateur SET reponse = NULLIF($1::text,''), reponse_le = CASE WHEN $1::text = '' THEN NULL ELSE NOW() END
      WHERE id=$2 AND collaborateur_id=$3 AND gestionnaire_id=$4 AND approuve = true`,
    [reponse, id, req.cid, req.gid]);
  if (!r.rowCount) bad('Avis introuvable', 404);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// PROFIL (compte) ET BOUTIQUE
// ════════════════════════════════════════════════════════════════════════════

router.get('/profil', h(async (req, res) => {
  const r = await pool.query(
    `SELECT id, nom_responsable, email, telephone, type_entreprise, nom_boutique, created_at
       FROM marketplace_collaborateurs WHERE id=$1 AND gestionnaire_id=$2`, [req.cid, req.gid]);
  res.json(r.rows[0]);
}));

router.put('/profil', h(async (req, res) => {
  const b = req.body || {};
  const nom = texte(b.nom_responsable, 'Nom', 80, true);
  const tel = texte(b.telephone, 'Téléphone', 30);
  if (tel && !/^[0-9+().\-\s]{7,30}$/.test(tel)) bad('Téléphone invalide');
  const type = texte(b.type_entreprise, 'Type d\'entreprise', 40);
  await pool.query(
    `UPDATE marketplace_collaborateurs SET nom_responsable=$1, telephone=NULLIF($2,''), type_entreprise=NULLIF($3,'') WHERE id=$4 AND gestionnaire_id=$5`,
    [nom, tel, type, req.cid, req.gid]);
  res.json({ success: true });
}));

router.put('/profil/mot-de-passe', h(async (req, res) => {
  if (!limite(`mdp-${req.cid}`, 5, 10 * 60 * 1000)) bad('Trop d\'essais. Réessayez plus tard.', 429);
  const b = req.body || {};
  if (typeof b.actuel !== 'string' || typeof b.nouveau !== 'string') bad('Champs requis');
  if (b.nouveau.length < 8 || b.nouveau.length > 72 || !/[A-Za-z]/.test(b.nouveau) || !/\d/.test(b.nouveau)) {
    bad('Nouveau mot de passe : 8 à 72 caractères, avec au moins une lettre et un chiffre');
  }
  const r = await pool.query(`SELECT mot_de_passe FROM marketplace_collaborateurs WHERE id=$1 AND gestionnaire_id=$2`, [req.cid, req.gid]);
  const ok = await bcrypt.compare(b.actuel, r.rows[0].mot_de_passe);
  if (!ok) bad('Mot de passe actuel incorrect', 403);
  const hash = await bcrypt.hash(b.nouveau, 12);
  await pool.query(`UPDATE marketplace_collaborateurs SET mot_de_passe=$1 WHERE id=$2 AND gestionnaire_id=$3`, [hash, req.cid, req.gid]);
  res.json({ success: true });
}));

router.get('/boutique', h(async (req, res) => {
  const r = await pool.query(
    `SELECT nom_boutique, description_boutique, logo_url, banniere_url, adresse, ville, province, code_postal, site_web, politique_retour
       FROM marketplace_collaborateurs WHERE id=$1 AND gestionnaire_id=$2`, [req.cid, req.gid]);
  res.json(r.rows[0]);
}));

router.put('/boutique', h(async (req, res) => {
  const b = req.body || {};
  const nom = texte(b.nom_boutique, 'Nom de la boutique', 80, true);
  const description = texte(b.description_boutique, 'Description', 2000);
  const logo = urlImage(req, b.logo_url, 'Logo');
  const banniere = urlImage(req, b.banniere_url, 'Bannière');
  const adresse = texte(b.adresse, 'Adresse', 160);
  const ville = texte(b.ville, 'Ville', 80);
  const province = texte(b.province, 'Province', 60);
  const cp = texte(b.code_postal, 'Code postal', 12);
  let site = texte(b.site_web, 'Site web', 200);
  if (site && !/^https?:\/\/[^\s<>"']+$/i.test(site)) bad('Site web invalide (doit commencer par http:// ou https://)');
  const politique = texte(b.politique_retour, 'Politique de retour', 2000);
  await pool.query(
    `UPDATE marketplace_collaborateurs SET nom_boutique=$1, description_boutique=NULLIF($2,''), logo_url=$3, banniere_url=$4,
            adresse=NULLIF($5,''), ville=NULLIF($6,''), province=NULLIF($7,''), code_postal=NULLIF($8,''), site_web=NULLIF($9,''), politique_retour=NULLIF($10,'')
      WHERE id=$11 AND gestionnaire_id=$12`,
    [nom, description, logo, banniere, adresse, ville, province, cp, site, politique, req.cid, req.gid]);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION GÉNÉRALE
// ════════════════════════════════════════════════════════════════════════════

const DEFAUT_CONFIG = {
  vacances: false, vacances_message: '', vacances_retour: null, delai_traitement_jours: 2,
  notif_commande: true, notif_message: true, notif_avis: true, message_remerciement: '',
};

router.get('/configuration', h(async (req, res) => {
  const r = await pool.query(
    `SELECT vacances, vacances_message, vacances_retour::text AS vacances_retour, delai_traitement_jours, notif_commande, notif_message, notif_avis, message_remerciement
       FROM collaborateur_config WHERE collaborateur_id=$1 AND gestionnaire_id=$2`, [req.cid, req.gid]);
  res.json(r.rows[0] || DEFAUT_CONFIG);
}));

router.put('/configuration', h(async (req, res) => {
  const b = req.body || {};
  const bool = (v, nom) => { if (typeof v !== 'boolean') bad(`${nom} invalide`); return v; };
  const vacances = bool(b.vacances, 'Vacances');
  const message = texte(b.vacances_message, 'Message de vacances', 300);
  const retour = dateISO(b.vacances_retour, 'Date de retour');
  const delai = Math.trunc(nombre(b.delai_traitement_jours, 'Délai de traitement', 0, 30));
  const remerciement = texte(b.message_remerciement, 'Message de remerciement', 500);
  await pool.query(
    `INSERT INTO collaborateur_config (collaborateur_id, gestionnaire_id, vacances, vacances_message, vacances_retour,
            delai_traitement_jours, notif_commande, notif_message, notif_avis, message_remerciement, updated_at)
     VALUES ($1,$2,$3,NULLIF($4,''),$5,$6,$7,$8,$9,NULLIF($10,''),NOW())
     ON CONFLICT (collaborateur_id) DO UPDATE SET vacances=EXCLUDED.vacances, vacances_message=EXCLUDED.vacances_message,
            vacances_retour=EXCLUDED.vacances_retour, delai_traitement_jours=EXCLUDED.delai_traitement_jours,
            notif_commande=EXCLUDED.notif_commande, notif_message=EXCLUDED.notif_message, notif_avis=EXCLUDED.notif_avis,
            message_remerciement=EXCLUDED.message_remerciement, updated_at=NOW()`,
    [req.cid, req.gid, vacances, message, retour, delai, bool(b.notif_commande, 'Notification commande'),
     bool(b.notif_message, 'Notification message'), bool(b.notif_avis, 'Notification avis'), remerciement]);
  res.json({ success: true });
}));

module.exports = router;