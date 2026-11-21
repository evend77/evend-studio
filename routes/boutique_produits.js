// CHEMIN : routes/boutique_produits.js
// e-Vend Studio — Annonces des templates boutique (solo) : le gestionnaire est son propre vendeur.
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire (partie privée du gestionnaire).
// Table `produits` avec collaborateur_id VIDE : ces annonces n'entrent jamais dans le catalogue du MV.
// Accès : gestionnaire connecté (authenticateToken), limité à SES annonces.

'use strict';

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const L = require('../services/boutique_limites');
const MONO = require('../services/boutique_mono');   // template Mono-produit : un seul produit vendu
const PAL = require('../services/boutique_paliers');   // add-on « Prix par palier »
const PARU = require('../services/boutique_parution');   // add-on « Parution future »

const router = express.Router();
const PAR_PAGE = 50;
const MAX_ANNONCES = 10000;   // plafond de sécurité (la vraie limite vient du palier)

const bad = (message, status, extra) => { throw new L.ErreurBoutique(message, status, extra); };
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof L.ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    console.error('[boutique_produits]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

function nombre(v, nom, min, max, vide) {
  if (v === undefined || v === null || v === '') { if (vide === undefined) bad(`${nom} requis`); return vide; }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) bad(`${nom} invalide (entre ${min} et ${max})`);
  return Math.round(n * 100) / 100;
}

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

function motif(q) {
  const t = typeof q === 'string' ? q.trim().slice(0, 80) : '';
  return t ? '%' + t.replace(/[\\%_]/g, (c) => '\\' + c) + '%' : null;
}

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now); compteurs.set(cle, liste);
  return true;
}

// ─── Images (JPEG, PNG, WebP, GIF ; 5 Mo ; jamais de SVG) — Cloudflare R2, dossier studio/boutique/<gestionnaire>/ ───
const MEDIA_URL = 'https://media.e-vend.ca';
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
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
  if (!limite(`bq-up-${req.gid}`, 30, 60 * 1000)) return res.status(429).json({ error: "Trop d'envois. Réessayez dans une minute." });
  envoi(req, res, (err) => {
    if (err) {
      const gros = err.code === 'LIMIT_FILE_SIZE';
      return res.status(gros ? 413 : 400).json({ error: gros ? 'Image trop lourde (max 5 Mo)' : 'Envoi invalide' });
    }
    h(async () => {
      if (!req.file) bad('Aucun fichier reçu');
      const ext = extensionSelonContenu(req.file.buffer);
      if (!ext) bad('Format non accepté (JPEG, PNG, WebP ou GIF seulement)');
      const cle = `studio/boutique/${req.gid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
      const mimes = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
      await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: req.file.buffer, ContentType: mimes[ext] }));
      res.status(201).json({ url: `${MEDIA_URL}/${cle}` });
    })(req, res);
  });
});

// Photo : envoyée via /upload par CE gestionnaire, ou reprise telle quelle d'e-Vend (même adresse media.e-vend.ca)
const PHOTO_EVEND_RE = /^https:\/\/media\.e-vend\.ca\/[A-Za-z0-9_\-./%]+\.(jpe?g|png|webp|gif|avif)$/i;
function urlPhoto(req, v) {
  if (typeof v !== 'string') bad('Photo invalide');
  if (PHOTO_EVEND_RE.test(v) && !v.includes('..')) {
    const propre = new RegExp(`^${MEDIA_URL.replace(/\./g, '\\.')}/studio/boutique/(\\d+)/`).exec(v);
    if (propre && Number(propre[1]) !== req.gid) bad("Photo invalide (utilisez le bouton d'envoi)");
    return v;
  }
  bad("Photo invalide (utilisez le bouton d'envoi)");
}

// ─── Lecture / validation d'une annonce ───────────────────────────────────────
const STATUTS = ['actif', 'brouillon'];

function lireProduit(req) {
  const b = req.body || {};
  const titre = texte(b.titre, 'Titre', 150, true);
  const description = texte(b.description, 'Description', 5000);
  const prix = nombre(b.prix, 'Prix', 0.01, 1000000);
  const prixPromo = nombre(b.prix_promo, 'Prix promo', 0.01, 1000000, null);
  if (prixPromo !== null && prixPromo >= prix) bad('Le prix promo doit être inférieur au prix');
  const stock = b.stock === '' || b.stock === undefined || b.stock === null ? null : Math.trunc(nombre(b.stock, 'Stock', 0, 1000000));
  const sku = texte(b.sku, 'SKU', 60);
  let categorieId = null;
  if (b.categorie_id !== undefined && b.categorie_id !== null && b.categorie_id !== '') {
    categorieId = entier(b.categorie_id);
    if (!categorieId) bad('Catégorie invalide');
  }
  const statut = b.statut === undefined ? 'brouillon' : b.statut;
  if (!STATUTS.includes(statut)) bad('Statut invalide');
  if (!Array.isArray(b.photos || [])) bad('Photos invalides');
  if ((b.photos || []).length > 8) bad('Maximum 8 photos');
  const photos = (b.photos || []).map((u) => urlPhoto(req, u));
  if (!Array.isArray(b.variantes || [])) bad('Variantes invalides');
  if ((b.variantes || []).length > 20) bad('Maximum 20 variantes');
  const variantes = (b.variantes || []).map((v) => {
    if (!v || typeof v !== 'object') bad('Variante invalide');
    return {
      nom: texte(v.nom, 'Nom de variante', 60, true),
      prix: nombre(v.prix, 'Prix de variante', 0.01, 1000000, null),
      stock: v.stock === '' || v.stock === undefined || v.stock === null ? null : Math.trunc(nombre(v.stock, 'Stock de variante', 0, 1000000)),
    };
  });
  let poids = null;
  if (b.poids !== undefined && b.poids !== null && b.poids !== '') {
    poids = Number(b.poids);
    if (!Number.isFinite(poids) || poids < 0 || poids > 10000) bad('Poids invalide (entre 0 et 10 000 kg)');
    poids = Math.round(poids * 1000) / 1000;
  }
  let quantiteMin = null;
  if (b.quantite_min !== undefined && b.quantite_min !== null && b.quantite_min !== '') {
    quantiteMin = Math.trunc(Number(b.quantite_min));
    if (!Number.isFinite(quantiteMin) || quantiteMin < 1 || quantiteMin > 9999) bad('Quantité minimum invalide (entre 1 et 9 999)');
    if (quantiteMin === 1) quantiteMin = null;
  }
  const prixRevient = nombre(b.prix_revient, 'Prix de revient', 0, 1000000, null);
  // Add-on « Prix par palier » : undefined = on ne touche pas ; sinon validé plus bas (après vérification de l'add-on) avec le prix et les variantes
  const paliersBruts = b.paliers;
  // Add-on « Parution future » : 'AAAA-MM-JJTHH:mm' (heure de Montréal) ; '' / null = retirer ; absent = ne pas toucher (validé avant d'écrire)
  const dateParutionBrute = b.date_parution;
  // Méthodes d'expédition choisies pour cette annonce (undefined = on ne touche pas aux choix existants)
  let methodes;
  if (b.methodes_expedition_ids !== undefined) {
    if (!Array.isArray(b.methodes_expedition_ids) || b.methodes_expedition_ids.length > 20) bad("Méthodes d'expédition invalides");
    methodes = Array.from(new Set(b.methodes_expedition_ids.map(entier)));
    if (methodes.some((x) => !x)) bad("Méthodes d'expédition invalides");
  }
  return { titre, description, prix, prixPromo, stock, sku, categorieId, statut, photos, variantes, poids, quantiteMin, prixRevient, methodes, paliersBruts, dateParutionBrute };
}

// Add-on « Prix par palier » : validé AVANT d'écrire l'annonce (une erreur n'enregistre rien). Retourne undefined = ne rien toucher
// (champ absent, ou add-on non activé : les paliers existants sont conservés), null = effacer, tableau = paliers propres.
async function preparerPaliers(req, p) {
  if (p.paliersBruts === undefined) return undefined;
  if (!(await PAL.actifPourBoutique(req.gid))) return undefined;
  if (p.paliersBruts === null) return null;
  if (!Array.isArray(p.paliersBruts)) bad('Paliers de prix invalides');
  return PAL.valider(p.paliersBruts, p.prix, p.variantes);
}
async function ecrireParution(req, id, valeur) {
  if (valeur === undefined) return;
  await pool.query("UPDATE produits SET date_parution = CASE WHEN $1::text IS NULL THEN NULL ELSE ($1::timestamp AT TIME ZONE 'America/Toronto') END WHERE id = $2 AND gestionnaire_id = $3 AND collaborateur_id IS NULL", [valeur, id, req.gid]);
}
async function ecrirePaliers(req, id, propres) {
  if (propres === undefined) return;
  await pool.query('UPDATE produits SET paliers = $1 WHERE id = $2 AND gestionnaire_id = $3 AND collaborateur_id IS NULL', [propres ? JSON.stringify(propres) : null, id, req.gid]);
}

// Les méthodes choisies doivent être des méthodes ACTIVES de ce gestionnaire ; une méthode au kg exige un poids
async function verifierMethodes(req, p) {
  if (p.methodes === undefined || !p.methodes.length) return;
  const r = await pool.query('SELECT id, mode_calcul FROM boutique_methodes_expedition WHERE gestionnaire_id = $1 AND actif = true AND id = ANY($2::int[])', [req.gid, p.methodes]);
  if (r.rowCount !== p.methodes.length) bad("Méthode d'expédition introuvable");
  if (r.rows.some((m) => m.mode_calcul === 'kg' || m.mode_calcul === 'fixe_kg') && !(p.poids > 0)) {
    bad('Indiquez le poids du produit : une des méthodes choisies calcule les frais au kg.');
  }
}

async function ecrireMethodes(produitId, p) {
  if (p.methodes === undefined) return;
  await pool.query('DELETE FROM boutique_produit_methodes_expedition WHERE produit_id = $1', [produitId]);
  if (p.methodes.length) {
    await pool.query('INSERT INTO boutique_produit_methodes_expedition (produit_id, methode_id) SELECT $1, UNNEST($2::int[])', [produitId, p.methodes]);
  }
}

// La catégorie doit appartenir à ce gestionnaire et être active
async function nomCategorie(req, categorieId) {
  if (!categorieId) return null;
  const r = await pool.query('SELECT nom FROM studio_categories WHERE id = $1 AND gestionnaire_id = $2 AND active = true', [categorieId, req.gid]);
  if (!r.rowCount) bad('Catégorie introuvable');
  return r.rows[0].nom;
}

// Filtre commun : annonces du SOLO seulement
const BASE = 'gestionnaire_id = $1 AND collaborateur_id IS NULL';

// ─── Catégories du gestionnaire ───────────────────────────────────────────────
router.get('/categories', h(async (req, res) => {
  const r = await pool.query(
    `SELECT c.id, c.nom, g.nom AS groupe_nom FROM studio_categories c LEFT JOIN studio_groupes_categories g ON g.id = c.groupe_id
      WHERE c.gestionnaire_id = $1 AND c.active = true ORDER BY c.nom`, [req.gid]);
  res.json(r.rows);
}));

// ─── Plan & limites ───────────────────────────────────────────────────────────
router.get('/plan', h(async (req, res) => {
  const e = await L.etat(req.gid);
  const nb = await L.compter(req.gid);
  res.json({
    template_id: e.templateId, plan: e.plan, limite: e.limite, nb_actifs: nb,
    palier_actuel: e.palier ? L.planId(e.templateId, e.palier.limite) : null,
    paliers: e.paliers.map((p) => ({ ...p, plan_id: L.planId(e.templateId, p.limite) })),
  });
}));

router.put('/plan', h(async (req, res) => {
  const brut = req.body && (req.body.limite !== undefined ? req.body.limite : String((req.body.plan || '')).split('-').pop());
  const lim = parseInt(brut, 10);
  if (!Number.isInteger(lim) || lim < 1) bad('Palier invalide');
  res.json({ success: true, ...(await L.changerPalier(req.gid, lim)) });
}));

// Avant de changer de template : dit si c'est permis (sans rien modifier)
router.post('/verifier-template', h(async (req, res) => {
  const t = typeof (req.body && req.body.template_id) === 'string' ? req.body.template_id.slice(0, 80) : '';
  if (!t) bad('Template requis');
  const paliers = await L.paliersDuTemplate(t);
  if (!paliers.length) return res.json({ ok: true, limite: null });
  const nb = await L.compter(req.gid);
  const convenable = paliers.find((p) => p.limite >= nb);
  if (!convenable) {
    const max = paliers[paliers.length - 1].limite;
    return res.json({ ok: false, nb_actifs: nb, limite: max, message: `Ce template permet au maximum ${max} annonces actives et vous en avez ${nb}. Désactivez ou supprimez ${nb - max} annonce${nb - max > 1 ? 's' : ''} d'abord.` });
  }
  res.json({ ok: true, nb_actifs: nb, palier_propose: convenable.limite });
}));

// ─── Liste ────────────────────────────────────────────────────────────────────
// Origine d'une annonce : Studio (créée ici), eBay, Etsy ou e-Vend (importée). Les colonnes d'import peuvent ne pas exister : on s'adapte.
const SOURCES = ['studio', 'ebay', 'etsy', 'evend'];
let _colsSource = null;
async function exprSource() {
  if (!_colsSource) {
    try {
      const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'produits' AND column_name IN ('ebay_item_id','etsy_listing_id','etsy_item_id','evend_produit_id')`);
      const n = r.rows.map((x) => x.column_name);
      _colsSource = { ebay: n.includes('ebay_item_id') ? 'ebay_item_id' : null, etsy: n.includes('etsy_listing_id') ? 'etsy_listing_id' : (n.includes('etsy_item_id') ? 'etsy_item_id' : null), evend: n.includes('evend_produit_id') ? 'evend_produit_id' : null };
    } catch (e) { return "'studio'"; }
  }
  const c = _colsSource;
  return c.ebay || c.etsy || c.evend
    ? `CASE ${c.ebay ? `WHEN ${c.ebay} IS NOT NULL THEN 'ebay' ` : ''}${c.etsy ? `WHEN ${c.etsy} IS NOT NULL THEN 'etsy' ` : ''}${c.evend ? `WHEN ${c.evend} IS NOT NULL THEN 'evend' ` : ''}ELSE 'studio' END`
    : "'studio'";
}

async function filtresListe(req) {
  const expr = await exprSource();
  const where = [BASE]; const params = [req.gid];
  const m = motif(req.query.q);
  if (m) { params.push(m); where.push(`(titre ILIKE $${params.length} OR sku ILIKE $${params.length})`); }
  if (STATUTS.includes(req.query.statut)) { params.push(req.query.statut); where.push(`statut = $${params.length}`); }
  if (req.query.stock === 'rupture') where.push('stock = 0');
  if (SOURCES.includes(req.query.source)) { params.push(req.query.source); where.push(`(${expr}) = $${params.length}`); }
  return { W: where.join(' AND '), params, expr };
}

// Identifiants de TOUS les produits qui correspondent aux filtres (« Sélectionner tous les produits »)
router.get('/produits-ids', h(async (req, res) => {
  const { W, params } = await filtresListe(req);
  const r = await pool.query(`SELECT id FROM produits WHERE ${W} ORDER BY created_at DESC, id DESC LIMIT 1000`, params);
  res.json({ ids: r.rows.map((x) => x.id) });
}));

router.get('/produits', h(async (req, res) => {
  const { W, params, expr } = await filtresListe(req);
  const p = parseInt(req.query.page, 10);
  const page = Number.isInteger(p) && p > 0 && p < 100000 ? p : 1;
  const [liste, total, stats] = await Promise.all([
    pool.query(`SELECT id, titre, prix, prix_promo, stock, sku, categorie, photo_principale, statut, created_at, ${expr} AS source
                  FROM produits WHERE ${W} ORDER BY created_at DESC, id DESC LIMIT ${PAR_PAGE} OFFSET ${(page - 1) * PAR_PAGE}`, params),
    pool.query(`SELECT COUNT(*) AS n FROM produits WHERE ${W}`, params),
    pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE statut = 'actif') AS actifs, COUNT(*) FILTER (WHERE statut = 'brouillon') AS brouillons,
                       COUNT(*) FILTER (WHERE stock = 0) AS ruptures FROM produits WHERE ${BASE}`, [req.gid]),
  ]);
  const n = parseInt(total.rows[0].n, 10);
  const s = stats.rows[0];
  const e = await L.etat(req.gid);
  res.json({
    produits: liste.rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAR_PAGE)),
    stats: { total: +s.total, actifs: +s.actifs, brouillons: +s.brouillons, ruptures: +s.ruptures },
    limite: e.limite,
  });
}));

router.get('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const r = await pool.query(
    `SELECT id, titre, description, prix, prix_promo, stock, sku, categorie, categorie_id, photo_principale, photos, variantes, statut, poids, quantite_min, prix_revient, paliers,
            to_char(date_parution AT TIME ZONE 'America/Toronto', 'YYYY-MM-DD"T"HH24:MI') AS date_parution_local
       FROM produits WHERE id = $2 AND ${BASE}`, [req.gid, id]);
  if (!r.rows.length) bad('Produit introuvable', 404);
  const m = await pool.query('SELECT methode_id FROM boutique_produit_methodes_expedition WHERE produit_id = $1 ORDER BY methode_id', [id]);
  res.json({ ...r.rows[0], paliers_actif: await PAL.actifPourBoutique(req.gid), parution_actif: await PARU.autorise(req.gid), methodes_expedition_ids: m.rows.map((x) => x.methode_id) });
}));

// ─── Création / modification ──────────────────────────────────────────────────
router.post('/produits', h(async (req, res) => {
  const p = lireProduit(req);
  p.categorie = await nomCategorie(req, p.categorieId);
  await verifierMethodes(req, p);
  const paliers = await preparerPaliers(req, p);
  const parution = await PARU.resoudreDate(req.gid, null, p.dateParutionBrute);
  const n = await pool.query(`SELECT COUNT(*)::int AS n FROM produits WHERE ${BASE}`, [req.gid]);
  if (n.rows[0].n >= MAX_ANNONCES) bad(`Limite de ${MAX_ANNONCES} annonces atteinte`, 409);
  if (p.statut === 'actif') await L.verifierActivation(req.gid, 1);
  const r = await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, prix_promo, stock, sku, categorie, categorie_id,
                           photo_principale, photos, variantes, statut, poids, quantite_min, prix_revient)
     VALUES ($1, NULL, $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [req.gid, p.titre, p.description, p.prix, p.prixPromo, p.stock, p.sku || null, p.categorie || null, p.categorieId,
     p.photos[0] || null, JSON.stringify(p.photos), JSON.stringify(p.variantes), p.statut, p.poids, p.quantiteMin, p.prixRevient]);
  await ecrireMethodes(r.rows[0].id, p);
  await ecrirePaliers(req, r.rows[0].id, paliers);
  await ecrireParution(req, r.rows[0].id, parution);
  if (p.statut === 'actif') await MONO.apresActivation(req.gid, r.rows[0].id);
  res.status(201).json({ id: r.rows[0].id, statut: p.statut });
}));

router.put('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const p = lireProduit(req);
  p.categorie = await nomCategorie(req, p.categorieId);
  await verifierMethodes(req, p);
  const paliers = await preparerPaliers(req, p);
  const parution = await PARU.resoudreDate(req.gid, id, p.dateParutionBrute);
  const ancien = await pool.query(`SELECT statut, stock FROM produits WHERE id = $2 AND ${BASE}`, [req.gid, id]);
  if (!ancien.rows.length) bad('Produit introuvable', 404);
  if (p.statut === 'actif' && ancien.rows[0].statut !== 'actif') await L.verifierActivation(req.gid, 1);
  // Add-on « Enchères » : une enchère retire 1 unité du stock ; modifier le stock en même temps la ferait déraper
  if ((ancien.rows[0].stock === null ? null : Number(ancien.rows[0].stock)) !== (p.stock === null ? null : Number(p.stock))) {
    const e = await pool.query(`SELECT 1 FROM boutique_encheres WHERE produit_id = $1 AND statut IN ('active','attente_paiement') LIMIT 1`, [id]);
    if (e.rowCount) bad("Ce produit est aux enchères : le stock ne peut pas être modifié avant la fin de l'enchère.", 409);
  }
  await pool.query(
    `UPDATE produits SET titre=$1, description=$2, prix=$3, prix_promo=$4, stock=$5, sku=$6, categorie=$7, categorie_id=$8,
            photo_principale=$9, photos=$10, variantes=$11, statut=$12, poids=$13, quantite_min=$14, prix_revient=$15, updated_at=NOW()
      WHERE id=$16 AND gestionnaire_id=$17 AND collaborateur_id IS NULL`,
    [p.titre, p.description, p.prix, p.prixPromo, p.stock, p.sku || null, p.categorie || null, p.categorieId,
     p.photos[0] || null, JSON.stringify(p.photos), JSON.stringify(p.variantes), p.statut, p.poids, p.quantiteMin, p.prixRevient, id, req.gid]);
  await ecrireMethodes(id, p);
  await ecrirePaliers(req, id, paliers);
  await ecrireParution(req, id, parution);
  if (p.statut === 'actif') await MONO.apresActivation(req.gid, id);
  res.json({ success: true, statut: p.statut });
}));

router.patch('/produits/:id/statut', h(async (req, res) => {
  const id = entier(req.params.id);
  const statut = req.body && req.body.statut;
  if (!id || !STATUTS.includes(statut)) bad('Statut invalide');
  const ancien = await pool.query(`SELECT statut FROM produits WHERE id = $2 AND ${BASE}`, [req.gid, id]);
  if (!ancien.rows.length) bad('Produit introuvable', 404);
  if (statut === 'actif' && ancien.rows[0].statut !== 'actif') await L.verifierActivation(req.gid, 1);
  await pool.query(`UPDATE produits SET statut=$1, updated_at=NOW() WHERE id=$2 AND gestionnaire_id=$3 AND collaborateur_id IS NULL`, [statut, id, req.gid]);
  if (statut === 'actif') await MONO.apresActivation(req.gid, id);
  res.json({ success: true, statut });
}));

router.post('/produits/:id/dupliquer', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const r = await pool.query(
    `INSERT INTO produits (gestionnaire_id, collaborateur_id, titre, description, prix, prix_promo, stock, sku, categorie, categorie_id,
                           photo_principale, photos, variantes, statut, poids, quantite_min, prix_revient, paliers)
     SELECT gestionnaire_id, NULL, LEFT('Copie de ' || titre, 150), description, prix, prix_promo, stock, NULL, categorie, categorie_id,
            photo_principale, photos, variantes, 'brouillon', poids, quantite_min, prix_revient, paliers
       FROM produits WHERE id = $2 AND ${BASE} RETURNING id`, [req.gid, id]);
  if (!r.rowCount) bad('Produit introuvable', 404);
  await pool.query('INSERT INTO boutique_produit_methodes_expedition (produit_id, methode_id) SELECT $1, methode_id FROM boutique_produit_methodes_expedition WHERE produit_id = $2', [r.rows[0].id, id]);
  res.status(201).json({ id: r.rows[0].id });
}));

router.delete('/produits/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Produit invalide');
  const enchere = await pool.query(`SELECT 1 FROM boutique_encheres WHERE produit_id = $1 AND gestionnaire_id = $2 AND statut IN ('active','attente_paiement') LIMIT 1`, [id, req.gid]);   // add-on « Enchères »
  if (enchere.rowCount) bad("Ce produit est aux enchères : annulez d'abord l'enchère (ou attendez sa fin et le paiement du gagnant).", 409);
  const r = await pool.query('DELETE FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL', [id, req.gid]);
  if (!r.rowCount) bad('Produit introuvable', 404);
  res.json({ success: true });
}));

router.post('/produits/bulk/supprimer', h(async (req, res) => {
  const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids.map(entier).filter(Boolean).slice(0, 100) : [];
  if (!ids.length) bad('Aucun produit sélectionné');
  // Add-on « Enchères » : un produit aux enchères n'est jamais supprimé (les autres le sont)
  const r = await pool.query(`DELETE FROM produits WHERE id = ANY($1::int[]) AND gestionnaire_id = $2 AND collaborateur_id IS NULL
                                 AND NOT EXISTS (SELECT 1 FROM boutique_encheres en WHERE en.produit_id = produits.id AND en.statut IN ('active','attente_paiement'))`, [ids, req.gid]);
  res.json({ supprimes: r.rowCount, ignores: ids.length - r.rowCount });
}));

module.exports = router;