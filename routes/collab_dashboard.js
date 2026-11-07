// CHEMIN : routes/collab_dashboard.js
// e-Vend Studio — API du dashboard collaborateur (produits, réductions, commandes, paiements,
// retours, avis, profil, boutique, configuration, envoi d'images, FAQ et blog de la boutique).
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
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const paiementMV = require('../services/studio_paiement');
const expMV = require('../services/studio_expedition');
const vacMV = require('../services/studio_vacances');

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

const MEDIA_URL = 'https://media.e-vend.ca';
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

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
      // Stockage sur Cloudflare R2 (comme e-Vend) : les images survivent aux déploiements.
      const cle = `studio/collab/${req.gid}/${req.cid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
      const mimes = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_PRODUITS,
        Key: cle,
        Body: req.file.buffer,
        ContentType: mimes[ext],
      }));
      res.status(201).json({ url: `${MEDIA_URL}/${cle}` });
    })(req, res);
  });
});

function urlImage(req, v, nom) {
  if (v === undefined || v === null || v === '') return null;
  const re = new RegExp(`^${MEDIA_URL.replace(/\./g, '\\.')}/studio/collab/${req.gid}/${req.cid}/[a-f0-9]{32}\\.(jpg|png|webp|gif)$`);
  if (typeof v !== 'string' || !re.test(v)) bad(`${nom} invalide (utilisez le bouton d'envoi)`);
  return v;
}

// ════════════════════════════════════════════════════════════════════════════
// PRODUITS (annonces)
// ════════════════════════════════════════════════════════════════════════════

const STATUTS_PRODUIT = ['actif', 'brouillon'];

router.get('/categories', h(async (req, res) => {
  // Catégories créées par le gestionnaire de cette boutique (actives seulement).
  const r = await pool.query(
    `SELECT c.id, c.nom, g.nom AS groupe_nom
       FROM studio_categories c LEFT JOIN studio_groupes_categories g ON g.id = c.groupe_id
      WHERE c.gestionnaire_id = $1 AND c.active = true ORDER BY c.nom`, [req.gid]);
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

async function uniteReserveeEnchere(db, produitId) {
  try {
    const e = await db.query(`SELECT 1 FROM encheres WHERE produit_id = $1 AND statut IN ('active','attente_paiement') AND stock_reserve = true LIMIT 1`, [produitId]);
    return e.rows.length > 0;
  } catch (err) { return false; } // table des enchères absente
}

router.get('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const r = await pool.query(
    `SELECT id, titre, description, prix, prix_promo, stock, sku, categorie, categorie_id, photo_principale, photos, variantes, statut, poids
       FROM produits WHERE id = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3`, [id, req.cid, req.gid]);
  if (!r.rows.length) bad('Produit introuvable', 404);
  let methodes = [];
  try { methodes = (await pool.query('SELECT methode_id FROM collab_produit_methodes_expedition WHERE produit_id = $1', [id])).rows.map((x) => x.methode_id); } catch (e) { /* tables absentes */ }
  // Enchère en cours : 1 unité est retirée du stock vendable. Le formulaire affiche le stock TOTAL (vente directe + unité de l'enchère).
  const reserve = await uniteReserveeEnchere(pool, id);
  const prod = { ...r.rows[0], methodes_expedition_ids: methodes, stock_reserve_enchere: reserve };
  if (reserve && prod.stock !== null && prod.stock !== undefined) prod.stock = Number(prod.stock) + 1;
  res.json(prod);
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
  let categorieId = null;
  if (b.categorie_id !== undefined && b.categorie_id !== null && b.categorie_id !== '') {
    categorieId = entier(b.categorie_id);
    if (!categorieId) bad('Catégorie invalide');
  }
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
  // Poids en kg (3 décimales) pour les modes d'expédition « par kg »
  let poids = null;
  if (b.poids !== undefined && b.poids !== null && b.poids !== '') {
    poids = Number(b.poids);
    if (!Number.isFinite(poids) || poids < 0 || poids > 10000) bad('Poids invalide (entre 0 et 10 000 kg)');
    poids = Math.round(poids * 1000) / 1000;
  }
  // Méthodes d'expédition choisies pour l'annonce (undefined = ne pas toucher)
  let methodesIds;
  if (b.methodes_expedition_ids !== undefined) {
    if (!Array.isArray(b.methodes_expedition_ids) || b.methodes_expedition_ids.length > 50) bad("Méthodes d'expédition invalides");
    methodesIds = [...new Set(b.methodes_expedition_ids.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  }
  return { titre, description, prix, prixPromo, stock, sku, categorieId, statut, photos, variantes, poids, methodesIds };
}

// La catégorie doit exister, être active et appartenir au gestionnaire de cette boutique.
async function nomCategorie(req, categorieId) {
  if (!categorieId) return null;
  const r = await pool.query('SELECT nom FROM studio_categories WHERE id = $1 AND gestionnaire_id = $2 AND active = true', [categorieId, req.gid]);
  if (!r.rowCount) bad('Catégorie introuvable');
  return r.rows[0].nom;
}

// Enregistre les méthodes d'expédition de l'annonce (seulement celles du collaborateur, actives)
async function sauverMethodesProduit(req, produitId, ids) {
  if (ids === undefined) return;
  let valides = [];
  let nbConfigurees = 0;
  try {
    nbConfigurees = +(await pool.query('SELECT COUNT(*) AS n FROM collab_methodes_expedition WHERE collaborateur_id = $1 AND actif = true', [req.cid])).rows[0].n;
    if (ids.length) valides = (await pool.query('SELECT id FROM collab_methodes_expedition WHERE collaborateur_id = $1 AND actif = true AND id = ANY($2::int[])', [req.cid, ids])).rows.map((x) => x.id);
  } catch (e) { return; } // tables absentes : rien à enregistrer (livraison gratuite)
  if (nbConfigurees > 0 && valides.length === 0) bad("Sélectionnez au moins une méthode d'expédition.");
  await pool.query('DELETE FROM collab_produit_methodes_expedition WHERE produit_id = $1', [produitId]);
  if (valides.length) await pool.query('INSERT INTO collab_produit_methodes_expedition (produit_id, methode_id) SELECT $1, UNNEST($2::int[]) ON CONFLICT DO NOTHING', [produitId, valides]);
}

router.post('/produits', h(async (req, res) => {
  const p = lireProduit(req);
  p.categorie = await nomCategorie(req, p.categorieId);
  const n = await pool.query(`SELECT COUNT(*) AS n FROM produits WHERE collaborateur_id = $1`, [req.cid]);
  if (+n.rows[0].n >= 1000) bad('Limite de 1000 produits atteinte', 409);
  const r = await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, prix_promo, stock, sku, categorie, categorie_id,
                           photo_principale, photos, variantes, statut, poids)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [req.gid, req.cid, p.titre, p.description, p.prix, p.prixPromo, p.stock, p.sku || null, p.categorie || null, p.categorieId,
     p.photos[0] || null, JSON.stringify(p.photos), JSON.stringify(p.variantes), p.statut, p.poids]);
  try { await sauverMethodesProduit(req, r.rows[0].id, p.methodesIds); }
  catch (e) { await pool.query('DELETE FROM produits WHERE id = $1', [r.rows[0].id]); throw e; }
  res.status(201).json({ id: r.rows[0].id });
}));

router.put('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const p = lireProduit(req);
  p.categorie = await nomCategorie(req, p.categorieId);
  // Le stock saisi est le total : on garde 1 unité réservée à l'enchère en cours
  if (p.stock !== null && await uniteReserveeEnchere(pool, id)) {
    if (p.stock < 1) bad("Une enchère est en cours : il faut au moins 1 unité en stock (celle de l'enchère).");
    p.stock -= 1;
  }
  const r = await pool.query(
    `UPDATE produits SET titre=$1, description=$2, prix=$3, prix_promo=$4, stock=$5, sku=$6, categorie=$7, categorie_id=$8,
            photo_principale=$9, photos=$10, variantes=$11, statut=$12, poids=$16, updated_at=NOW()
      WHERE id=$13 AND collaborateur_id=$14 AND gestionnaire_id=$15`,
    [p.titre, p.description, p.prix, p.prixPromo, p.stock, p.sku || null, p.categorie || null, p.categorieId,
     p.photos[0] || null, JSON.stringify(p.photos), JSON.stringify(p.variantes), p.statut, id, req.cid, req.gid, p.poids]);
  if (!r.rowCount) bad('Produit introuvable', 404);
  await sauverMethodesProduit(req, id, p.methodesIds);
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
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, prix_promo, stock, sku, categorie, categorie_id,
                           photo_principale, photos, variantes, statut)
     SELECT gestionnaire_id, collaborateur_id, LEFT('Copie de ' || titre, 150), description, prix, prix_promo, stock, NULL, categorie, categorie_id,
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

const COLS_COMMANDE = `c.id, c.numero_commande, c.statut, c.statut_paiement, c.total, c.commission, c.commission_taxes, c.montant_net,
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
    `SELECT c.id, c.numero_commande, c.statut, c.statut_paiement, c.total, c.commission, c.commission_taxes, c.montant_net, c.articles, c.adresse_livraison,
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
    `SELECT statut, statut_paiement, acheteur_id, numero_commande FROM marketplace_commandes WHERE id=$1 AND collaborateur_id=$2 AND gestionnaire_id=$3`, [id, req.cid, req.gid]);
  if (!c.rows.length) bad('Commande introuvable', 404);
  const actuel = c.rows[0];
  if (!(TRANSITIONS[actuel.statut] || []).includes(b.statut)) bad(`Passage impossible : ${actuel.statut} → ${b.statut}`, 409);
  if (b.statut === 'annulee' && actuel.statut_paiement === 'paye') {
    bad('Commande déjà payée : traitez-la avec une demande de retour / remboursement.', 409);
  }
  if (b.statut === 'annulee') {
    // Commande non payée : ferme la page de paiement Stripe et remet le stock réservé
    try { await paiementMV.annulerNonPayee(id, { par: 'collaborateur', raison: texte(b.raison, 'Raison', 300) }); }
    catch (e) { if (e instanceof paiementMV.ErreurPaiement) bad(e.message, e.status); throw e; }
    if (actuel.acheteur_id) {
      await notifierAcheteur(req.gid, actuel.acheteur_id, 'Commande annulée', `Votre commande ${actuel.numero_commande} est maintenant annulée.`, 'commande');
    }
    return res.json({ success: true });
  }
  const suivi = b.statut === 'expediee' ? texte(b.numero_suivi, 'Numéro de suivi', 80) : '';
  const transp = b.statut === 'expediee' ? texte(b.transporteur, 'Transporteur', 60) : '';
  await pool.query(
    `UPDATE marketplace_commandes SET statut=$1, updated_at=NOW(),
            numero_suivi = CASE WHEN $7::boolean THEN NULLIF($2::text,'') ELSE numero_suivi END,
            transporteur = CASE WHEN $7::boolean THEN NULLIF($3::text,'') ELSE transporteur END
      WHERE id=$4 AND collaborateur_id=$5 AND gestionnaire_id=$6`,
    [b.statut, suivi, transp, id, req.cid, req.gid, b.statut === 'expediee']);
  const LIB = { confirmee: 'confirmée', expediee: 'expédiée', livree: 'livrée', annulee: 'annulée' };
  if (LIB[b.statut] && actuel.acheteur_id) {
    await notifierAcheteur(req.gid, actuel.acheteur_id, `Commande ${LIB[b.statut]}`,
      `Votre commande ${actuel.numero_commande} est maintenant ${LIB[b.statut]}.${suivi ? ' Suivi : ' + suivi + '.' : ''}`, 'commande');
  }
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


// Notification vers l'acheteur (les erreurs ne bloquent jamais l'action principale)
async function notifierAcheteur(gid, acheteurId, titre, message, type) {
  try {
    await pool.query(
      `INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,$5)`,
      [gid, acheteurId, titre, message, type || 'commande']);
  } catch (e) { console.error('[collab_dashboard] notifierAcheteur', e && e.message); }
}

async function actionRetour(req, res, depuis, vers, champs) {
  const id = entier(req.params.id);
  if (!id) bad('Demande invalide');
  const c = await pool.query(
    `SELECT r.statut, r.acheteur_id, c.numero_commande, c.total FROM demandes_retour r JOIN marketplace_commandes c ON c.id = r.commande_id
      WHERE r.id=$1 AND r.collaborateur_id=$2 AND r.gestionnaire_id=$3`, [id, req.cid, req.gid]);
  if (!c.rows.length) bad('Demande introuvable', 404);
  if (c.rows[0].statut !== depuis) bad('Cette demande ne peut plus être modifiée ainsi', 409);
  const f = champs(c.rows[0]);
  await pool.query(
    `UPDATE demandes_retour SET statut=$1, montant_remboursement=COALESCE($2, montant_remboursement),
            reponse=COALESCE(NULLIF($3,''), reponse), updated_at=NOW() WHERE id=$4`,
    [vers, f.montant, f.reponse, id]);
  const TXT = { approuve: 'approuvée', refuse: 'refusée', termine: 'terminée' };
  await notifierAcheteur(req.gid, c.rows[0].acheteur_id, `Demande de retour ${TXT[vers]}`,
    `Votre demande pour la commande ${c.rows[0].numero_commande} a été ${TXT[vers]}.`, 'retour');
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
    `SELECT id, nom_responsable, email, telephone, type_entreprise, nom_boutique, created_at,
            inscrit_taxes, numero_tps, numero_tvq
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

// Statut fiscal : un collaborateur NON inscrit aux taxes (petit fournisseur) ne facture aucune taxe.
// Inscrit : la taxe s'applique selon la catégorie du produit (voir services/studio_taxes.js).
router.put('/profil/taxes', h(async (req, res) => {
  const b = req.body || {};
  if (typeof b.inscrit_taxes !== 'boolean') bad('Choisissez si vous êtes inscrit aux taxes');
  let tps = texte(b.numero_tps, 'Numéro de TPS/TVH', 30).toUpperCase().replace(/\s+/g, '');
  let tvq = texte(b.numero_tvq, 'Numéro de TVQ', 30).toUpperCase().replace(/\s+/g, '');
  if (b.inscrit_taxes) {
    if (!tps) bad('Entrez votre numéro de TPS/TVH (ex. : 123456789RT0001)');
    if (!/^\d{9}RT\d{4}$/.test(tps)) bad('Numéro de TPS/TVH invalide (format : 123456789RT0001)');
    if (tvq && !/^\d{10}TQ\d{4}$/.test(tvq)) bad('Numéro de TVQ invalide (format : 1234567890TQ0001)');
  } else { tps = ''; tvq = ''; }
  await pool.query(
    `UPDATE marketplace_collaborateurs SET inscrit_taxes=$1, numero_tps=NULLIF($2,''), numero_tvq=NULLIF($3,'') WHERE id=$4 AND gestionnaire_id=$5`,
    [b.inscrit_taxes, tps, tvq, req.cid, req.gid]);
  res.json({ success: true, inscrit_taxes: b.inscrit_taxes, numero_tps: tps || null, numero_tvq: tvq || null });
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

// Réseaux sociaux : lien https vers le bon site seulement (jamais de javascript:, data:, ni de site étranger).
const RESEAUX = {
  facebook:  ['facebook.com', 'fb.com', 'fb.me'],
  instagram: ['instagram.com'],
  tiktok:    ['tiktok.com'],
  youtube:   ['youtube.com', 'youtu.be'],
  x:         ['x.com', 'twitter.com'],
  linkedin:  ['linkedin.com'],
  pinterest: ['pinterest.com', 'pin.it'],
};
function lireReseaux(brut) {
  if (brut === undefined || brut === null) return {};
  if (typeof brut !== 'object' || Array.isArray(brut)) bad('Réseaux sociaux invalides');
  const sortie = {};
  for (const cle of Object.keys(RESEAUX)) {
    let v = brut[cle];
    if (v === undefined || v === null || v === '') continue;
    if (typeof v !== 'string') bad('Lien de réseau social invalide');
    v = v.trim();
    if (!v) continue;
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
    if (v.length > 200 || /[\s<>"'\\]/.test(v)) bad(`Lien ${cle} invalide`);
    let u;
    try { u = new URL(v); } catch (e) { bad(`Lien ${cle} invalide`); }
    const hote = u.hostname.toLowerCase();
    if (u.protocol !== 'https:' && u.protocol !== 'http:') bad(`Lien ${cle} invalide`);
    if (u.username || u.password || !RESEAUX[cle].some((d) => hote === d || hote.endsWith('.' + d))) bad(`Le lien ${cle} doit pointer vers ${RESEAUX[cle][0]}`);
    sortie[cle] = 'https://' + u.host + u.pathname + u.search;
  }
  return sortie;
}

router.get('/boutique', h(async (req, res) => {
  const r = await pool.query(
    `SELECT nom_boutique, description_boutique, logo_url, banniere_url, adresse, ville, province, code_postal, site_web, politique_retour, politique_livraison, details_publics, reseaux_sociaux
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
  const livraison = texte(b.politique_livraison, 'Informations de livraison', 2000);
  const detailsPublics = b.details_publics === true;
  const reseaux = lireReseaux(b.reseaux_sociaux);
  await pool.query(
    `UPDATE marketplace_collaborateurs SET nom_boutique=$1, description_boutique=NULLIF($2,''), logo_url=$3, banniere_url=$4,
            adresse=NULLIF($5,''), ville=NULLIF($6,''), province=NULLIF($7,''), code_postal=NULLIF($8,''), site_web=NULLIF($9,''), politique_retour=NULLIF($10,''), politique_livraison=NULLIF($11,''),
            details_publics=$12, reseaux_sociaux=$13::jsonb
      WHERE id=$14 AND gestionnaire_id=$15`,
    [nom, description, logo, banniere, adresse, ville, province, cp, site, politique, livraison, detailsPublics, JSON.stringify(reseaux), req.cid, req.gid]);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION GÉNÉRALE
// ════════════════════════════════════════════════════════════════════════════

const DEFAUT_CONFIG = {
  vacances: false, vacances_message: '', vacances_debut: null, vacances_retour: null, vacances_mode: 'visible', delai_traitement_jours: 2,
  notif_commande: true, notif_message: true, notif_avis: true, message_remerciement: '',
};

router.get('/configuration', h(async (req, res) => {
  const r = await pool.query(
    `SELECT vacances, vacances_message, vacances_debut::text AS vacances_debut, vacances_retour::text AS vacances_retour, vacances_mode,
            delai_traitement_jours, notif_commande, notif_message, notif_avis, message_remerciement
       FROM collaborateur_config WHERE collaborateur_id=$1 AND gestionnaire_id=$2`, [req.cid, req.gid]);
  const [permises, actuel] = await Promise.all([vacMV.permisParGestionnaire(pool, req.gid), vacMV.etat(pool, req.gid, req.cid)]);
  res.json({ ...(r.rows[0] || DEFAUT_CONFIG), vacances_permises: permises, vacances_actif_maintenant: !!actuel, vacances_message_defaut: vacMV.MESSAGE_DEFAUT });
}));

router.put('/configuration', h(async (req, res) => {
  const b = req.body || {};
  const bool = (v, nom) => { if (typeof v !== 'boolean') bad(`${nom} invalide`); return v; };
  const vacances = bool(b.vacances, 'Vacances');
  const message = texte(b.vacances_message, 'Message de vacances', 300);
  const debut = dateISO(b.vacances_debut, 'Date de début');
  const retour = dateISO(b.vacances_retour, 'Date de retour');
  const modeVac = b.vacances_mode === undefined ? 'visible' : b.vacances_mode;
  if (modeVac !== 'visible' && modeVac !== 'masque') bad('Choix de mode vacances invalide');
  if (vacances) {
    if (!(await vacMV.permisParGestionnaire(pool, req.gid))) bad("Le mode vacances n'est pas activé par le gestionnaire de cette boutique.", 403);
    if (debut && retour && retour <= debut) bad('La date de retour doit être après la date de début');
    const auj = (await pool.query(`SELECT (NOW() AT TIME ZONE '${vacMV.FUSEAU}')::date::text AS d`)).rows[0].d;
    if (retour && retour <= auj) bad('La date de retour est déjà passée');
  }
  const delai = Math.trunc(nombre(b.delai_traitement_jours, 'Délai de traitement', 0, 30));
  const remerciement = texte(b.message_remerciement, 'Message de remerciement', 500);
  await pool.query(
    `INSERT INTO collaborateur_config (collaborateur_id, gestionnaire_id, vacances, vacances_message, vacances_retour,
            delai_traitement_jours, notif_commande, notif_message, notif_avis, message_remerciement, vacances_debut, vacances_mode, updated_at)
     VALUES ($1,$2,$3,NULLIF($4,''),$5,$6,$7,$8,$9,NULLIF($10,''),$11,$12,NOW())
     ON CONFLICT (collaborateur_id) DO UPDATE SET vacances=EXCLUDED.vacances, vacances_message=EXCLUDED.vacances_message,
            vacances_retour=EXCLUDED.vacances_retour, vacances_debut=EXCLUDED.vacances_debut, vacances_mode=EXCLUDED.vacances_mode,
            delai_traitement_jours=EXCLUDED.delai_traitement_jours,
            notif_commande=EXCLUDED.notif_commande, notif_message=EXCLUDED.notif_message, notif_avis=EXCLUDED.notif_avis,
            message_remerciement=EXCLUDED.message_remerciement, updated_at=NOW()`,
    [req.cid, req.gid, vacances, message, retour, delai, bool(b.notif_commande, 'Notification commande'),
     bool(b.notif_message, 'Notification message'), bool(b.notif_avis, 'Notification avis'), remerciement, debut, modeVac]);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════
// MÉTHODES D'EXPÉDITION (comme e-Vend : 4 modes, combine shipping, zones par province, transporteurs personnalisés)
// ════════════════════════════════════════════════════════════

const MODES_CALCUL = ['fixe', 'fixe_kg', 'kg', 'zone'];
const IDS_TRANSPORTEURS = [...Object.keys(expMV.TRANSPORTEURS).map(Number), ...expMV.IDS_PERSONNALISES];

// Liste complète (actives ou non) — pour la page « Méthodes d'expédition »
router.get('/methodes-expedition', h(async (req, res) => {
  let rows = [];
  try { rows = (await pool.query('SELECT * FROM collab_methodes_expedition WHERE collaborateur_id = $1 AND gestionnaire_id = $2 ORDER BY transporteur_id', [req.cid, req.gid])).rows; }
  catch (e) { return res.json([]); }
  res.json(rows);
}));

// Méthodes actives enrichies (nom, logo, libellé de prix) — pour le choix dans l'annonce
router.get('/methodes-expedition/details', h(async (req, res) => {
  let rows = [];
  try { rows = (await pool.query('SELECT * FROM collab_methodes_expedition WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND actif = true ORDER BY transporteur_id', [req.cid, req.gid])).rows; }
  catch (e) { return res.json([]); }
  res.json(rows.map((m) => ({ ...expMV.enrichir(m, null, 0, 'QC'), libelle_prix: expMV.libellePrix(m) })));
}));

function lireMethodeExpedition(m) {
  if (!m || typeof m !== 'object') bad('Méthode invalide');
  const tid = Number(m.transporteur_id);
  if (!IDS_TRANSPORTEURS.includes(tid)) bad('Transporteur invalide');
  const perso = expMV.IDS_PERSONNALISES.includes(tid);
  let nomPerso = null, logoPerso = null;
  if (perso) {
    nomPerso = texte(m.nom_personnalise, 'Nom du transporteur', 100, true);
    if (!expMV.LOGOS_PERSONNALISES.includes(m.logo_personnalise)) bad('Logo de transporteur personnalisé invalide');
    logoPerso = m.logo_personnalise;
  }
  const mode = MODES_CALCUL.includes(m.mode_calcul) ? m.mode_calcul : 'fixe';
  const montant = (v, nom) => (v === undefined || v === null || v === '' ? null : nombre(v, nom, 0, 100000, null));
  let zones = null;
  if (mode === 'zone') {
    if (!m.frais_zones || typeof m.frais_zones !== 'object') bad('Frais par province requis');
    zones = {};
    for (const code of expMV.PROVINCES) {
      const v = m.frais_zones[code];
      if (v === undefined) bad(`Frais manquant pour ${code}`);
      zones[code] = v === null || v === 'non' ? null : String(nombre(v, `Frais ${code}`, 0, 100000));
    }
  }
  return {
    tid, mode, nomPerso, logoPerso, zones,
    fixes: montant(m.frais_fixes, 'Frais fixe'), parKg: montant(m.frais_par_kg, 'Frais par kg'), gratuit: montant(m.gratuit_superieur, 'Livraison gratuite dès'),
    delais: texte(m.delais_estime, 'Délais estimés', 100) || null,
    combine: m.combine_shipping === true, fixeUnique: m.combine_frais_fixe_unique !== false, kgAdd: m.combine_kg_additionne !== false,
  };
}

router.put('/methodes-expedition', h(async (req, res) => {
  const liste = req.body && req.body.methodes;
  if (!Array.isArray(liste) || liste.length > 20) bad('Données invalides');
  const ms = liste.map(lireMethodeExpedition);
  ms.forEach((m) => {
    if ((m.mode === 'fixe' || m.mode === 'fixe_kg') && m.fixes === null && m.tid !== 14) bad('Frais fixe requis');
    if ((m.mode === 'kg' || m.mode === 'fixe_kg') && !m.parKg) bad('Frais par kg requis');
  });
  if (new Set(ms.map((m) => m.tid)).size !== ms.length) bad('Transporteur en double');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // On ne supprime que les transporteurs retirés : les identifiants restent stables, donc les choix des annonces aussi
    await client.query('DELETE FROM collab_methodes_expedition WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND transporteur_id <> ALL($3::int[])',
      [req.cid, req.gid, ms.map((m) => m.tid)]);
    for (const m of ms) {
      await client.query(
        `INSERT INTO collab_methodes_expedition (collaborateur_id, gestionnaire_id, transporteur_id, actif, frais_fixes, frais_par_kg, delais_estime,
                gratuit_superieur, mode_calcul, combine_shipping, combine_frais_fixe_unique, combine_kg_additionne, frais_zones,
                nom_personnalise, logo_personnalise, updated_at)
         VALUES ($1,$2,$3,true,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
         ON CONFLICT (collaborateur_id, transporteur_id) DO UPDATE SET actif=true, frais_fixes=EXCLUDED.frais_fixes, frais_par_kg=EXCLUDED.frais_par_kg,
                delais_estime=EXCLUDED.delais_estime, gratuit_superieur=EXCLUDED.gratuit_superieur, mode_calcul=EXCLUDED.mode_calcul,
                combine_shipping=EXCLUDED.combine_shipping, combine_frais_fixe_unique=EXCLUDED.combine_frais_fixe_unique,
                combine_kg_additionne=EXCLUDED.combine_kg_additionne, frais_zones=EXCLUDED.frais_zones,
                nom_personnalise=EXCLUDED.nom_personnalise, logo_personnalise=EXCLUDED.logo_personnalise, updated_at=NOW()`,
        [req.cid, req.gid, m.tid, m.fixes, m.parKg, m.delais, m.gratuit, m.mode, m.combine, m.fixeUnique, m.kgAdd,
         m.zones ? JSON.stringify(m.zones) : null, m.nomPerso, m.logoPerso]);
    }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
  res.json({ success: true, message: "Méthodes d'expédition sauvegardées avec succès" });
}));

// Livraison gratuite globale (à partir d'un montant d'achat)
router.get('/expedition-config', h(async (req, res) => {
  const c = await expMV.infosCollab(pool, req.cid);
  res.json({
    livraison_gratuite_globale_actif: !!(c && c.livraison_gratuite_globale_actif),
    livraison_gratuite_globale_seuil: c && c.livraison_gratuite_globale_seuil !== null ? Number(c.livraison_gratuite_globale_seuil) : 0,
    livraison_gratuite_globale_provinces: (c && c.livraison_gratuite_globale_provinces) || [],
  });
}));

router.patch('/expedition-config', h(async (req, res) => {
  const b = req.body || {};
  if (typeof b.livraison_gratuite_globale_actif !== 'boolean') bad('Valeur invalide');
  const seuil = nombre(b.livraison_gratuite_globale_seuil, 'Montant minimum', 0, 1000000, 0);
  const provs = b.livraison_gratuite_globale_provinces === undefined ? [] : b.livraison_gratuite_globale_provinces;
  if (!Array.isArray(provs) || provs.some((p) => !expMV.PROVINCES.includes(p))) bad('Provinces invalides');
  if (b.livraison_gratuite_globale_actif && !(seuil > 0)) bad("Indiquez un montant d'achat minimum supérieur à 0 $");
  await pool.query(
    `UPDATE marketplace_collaborateurs SET livraison_gratuite_globale_actif=$1, livraison_gratuite_globale_seuil=$2, livraison_gratuite_globale_provinces=$3::jsonb
      WHERE id=$4 AND gestionnaire_id=$5`, [b.livraison_gratuite_globale_actif, seuil, JSON.stringify([...new Set(provs)]), req.cid, req.gid]);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════
// FAQ DE LA BOUTIQUE (visible dans l'onglet FAQ de la page boutique)
// ════════════════════════════════════════════════════════════

const MAX_FAQ = 100;
const MAX_BLOGS = 200;

router.get('/faq', h(async (req, res) => {
  const r = await pool.query(
    `SELECT id, question, reponse, ordre, active FROM collab_faq
      WHERE collaborateur_id = $1 AND gestionnaire_id = $2 ORDER BY ordre ASC, id ASC`, [req.cid, req.gid]);
  res.json(r.rows);
}));

router.post('/faq', h(async (req, res) => {
  const b = req.body || {};
  const question = texte(b.question, 'Question', 300, true);
  const reponse = texte(b.reponse, 'Réponse', 2000, true);
  const n = await pool.query(`SELECT COUNT(*)::int AS n, COALESCE(MAX(ordre),0)::int AS mx FROM collab_faq WHERE collaborateur_id=$1 AND gestionnaire_id=$2`, [req.cid, req.gid]);
  if (n.rows[0].n >= MAX_FAQ) bad(`Maximum ${MAX_FAQ} questions`);
  const r = await pool.query(
    `INSERT INTO collab_faq (gestionnaire_id, collaborateur_id, question, reponse, ordre) VALUES ($1,$2,$3,$4,$5)
     RETURNING id, question, reponse, ordre, active`, [req.gid, req.cid, question, reponse, n.rows[0].mx + 1]);
  res.status(201).json({ success: true, faq: r.rows[0] });
}));

// Doit venir AVANT /faq/:id
router.put('/faq/reordonner', h(async (req, res) => {
  const liste = req.body && req.body.ordre;
  if (!Array.isArray(liste) || liste.length > MAX_FAQ) bad('Format invalide');
  for (let i = 0; i < liste.length; i++) {
    const id = entier(liste[i] && liste[i].id);
    if (!id) bad('Question invalide');
    await pool.query(`UPDATE collab_faq SET ordre = $1, updated_at = NOW() WHERE id = $2 AND collaborateur_id = $3 AND gestionnaire_id = $4`,
      [i + 1, id, req.cid, req.gid]);
  }
  res.json({ success: true });
}));

router.put('/faq/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Question invalide');
  const b = req.body || {};
  const question = b.question !== undefined ? texte(b.question, 'Question', 300, true) : null;
  const reponse = b.reponse !== undefined ? texte(b.reponse, 'Réponse', 2000, true) : null;
  const active = typeof b.active === 'boolean' ? b.active : null;
  const r = await pool.query(
    `UPDATE collab_faq SET question = COALESCE($1, question), reponse = COALESCE($2, reponse),
            active = COALESCE($3, active), updated_at = NOW()
      WHERE id = $4 AND collaborateur_id = $5 AND gestionnaire_id = $6
      RETURNING id, question, reponse, ordre, active`, [question, reponse, active, id, req.cid, req.gid]);
  if (!r.rows.length) bad('Question introuvable', 404);
  res.json({ success: true, faq: r.rows[0] });
}));

router.delete('/faq/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Question invalide');
  const r = await pool.query(`DELETE FROM collab_faq WHERE id = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3`, [id, req.cid, req.gid]);
  if (!r.rowCount) bad('Question introuvable', 404);
  res.json({ success: true });
}));

// ════════════════════════════════════════════════════════════
// BLOG DE LA BOUTIQUE (articles en texte enrichi, images envoyées par /upload)
// ════════════════════════════════════════════════════════════

// Texte enrichi : seules les balises de mise en forme sont gardées. Aucun script, aucun style libre,
// aucun lien, et les images doivent venir de NOTRE stockage (jamais de data: ni d'adresse externe).
function htmlBlog(req, v) {
  if (typeof v !== 'string') bad('Contenu invalide');
  if (v.length > 200000) bad('Contenu trop long');
  const prefixe = `${MEDIA_URL}/studio/collab/${req.gid}/${req.cid}/`;
  const propre = sanitizeHtml(v, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'div', 'span', 'font', 'img'],
    allowedAttributes: { img: ['src', 'alt'], font: ['size'], p: ['style'], div: ['style'], span: ['style'], li: ['style'], h2: ['style'], h3: ['style'] },
    allowedStyles: { '*': { 'text-align': [/^(left|center|right|justify)$/] } },
    allowedSchemes: ['https'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    exclusiveFilter: (f) => f.tag === 'img' && !(typeof f.attribs.src === 'string' && f.attribs.src.startsWith(prefixe) && /^[a-f0-9]{32}\.(jpg|png|webp|gif)$/.test(f.attribs.src.slice(prefixe.length))),
  }).trim();
  const apercu = sanitizeHtml(propre, { allowedTags: [], allowedAttributes: {} }).trim();
  if (!apercu && !/<img /.test(propre)) bad('Contenu requis');
  if (propre.length > 60000) bad('Contenu trop long (max 60 000 caractères)');
  return propre;
}

function listeTags(v) {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.length > 10) bad('Tags invalides (max 10)');
  return [...new Set(v.map((t) => texte(t, 'Tag', 30).replace(/[#,]/g, '').trim()).filter(Boolean))];
}

const COLS_BLOG = 'id, titre, contenu, tags, statut, vues, date_publication, created_at AS date_creation';

router.get('/blogs', h(async (req, res) => {
  const r = await pool.query(`SELECT ${COLS_BLOG} FROM collab_blogs WHERE collaborateur_id = $1 AND gestionnaire_id = $2 ORDER BY created_at DESC LIMIT ${MAX_BLOGS}`, [req.cid, req.gid]);
  res.json(r.rows);
}));

router.post('/blogs', h(async (req, res) => {
  const b = req.body || {};
  const titre = texte(b.titre, 'Titre', 200, true);
  const contenu = htmlBlog(req, b.contenu);
  const tags = listeTags(b.tags);
  const statut = b.statut === 'publie' ? 'publie' : 'brouillon';
  const n = await pool.query(`SELECT COUNT(*)::int AS n FROM collab_blogs WHERE collaborateur_id=$1 AND gestionnaire_id=$2`, [req.cid, req.gid]);
  if (n.rows[0].n >= MAX_BLOGS) bad(`Maximum ${MAX_BLOGS} articles`);
  const r = await pool.query(
    `INSERT INTO collab_blogs (gestionnaire_id, collaborateur_id, titre, contenu, tags, statut, date_publication)
     VALUES ($1,$2,$3,$4,$5,$6::varchar, CASE WHEN $6::varchar = 'publie' THEN NOW() END) RETURNING ${COLS_BLOG}`,
    [req.gid, req.cid, titre, contenu, tags, statut]);
  res.status(201).json({ success: true, blog: r.rows[0] });
}));

router.put('/blogs/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Article invalide');
  const b = req.body || {};
  const titre = b.titre !== undefined ? texte(b.titre, 'Titre', 200, true) : null;
  const contenu = b.contenu !== undefined ? htmlBlog(req, b.contenu) : null;
  const tags = b.tags !== undefined ? listeTags(b.tags) : null;
  const statut = b.statut === 'publie' || b.statut === 'brouillon' ? b.statut : null;
  const r = await pool.query(
    `UPDATE collab_blogs SET titre = COALESCE($1, titre), contenu = COALESCE($2, contenu), tags = COALESCE($3, tags),
            statut = COALESCE($4::varchar, statut),
            date_publication = CASE WHEN COALESCE($4::varchar, statut) = 'publie' THEN COALESCE(date_publication, NOW()) ELSE date_publication END,
            updated_at = NOW()
      WHERE id = $5 AND collaborateur_id = $6 AND gestionnaire_id = $7 RETURNING ${COLS_BLOG}`,
    [titre, contenu, tags, statut, id, req.cid, req.gid]);
  if (!r.rows.length) bad('Article introuvable', 404);
  res.json({ success: true, blog: r.rows[0] });
}));

router.delete('/blogs/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Article invalide');
  const r = await pool.query(`DELETE FROM collab_blogs WHERE id = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3`, [id, req.cid, req.gid]);
  if (!r.rowCount) bad('Article introuvable', 404);
  res.json({ success: true });
}));

module.exports = router;