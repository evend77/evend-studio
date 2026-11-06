// CHEMIN : routes/studio_categories.js
// e-Vend Studio — Gestion des catégories et groupes de catégories PAR GESTIONNAIRE (+ « taxable » par catégorie).
//
// Monté dans server.js sur : /api/studio-categories/:gestionnaireId
// Accès : le gestionnaire connecté, pour SA boutique seulement (cookie + authenticateToken).
//   GET/POST /categories · PUT/DELETE /categories/:id
//   GET/POST /groupes    · PUT/DELETE /groupes/:id
//   POST /upload         (image de catégorie / de groupe → Cloudflare R2 ; ?dossier=banniere|apropos pour les images de l'accueil)

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// ─── Utilitaires (inline) ─────────────────────────────────────────────────────

class Invalide extends Error {
  constructor(message, status) { super(message); this.status = status || 400; }
}
const bad = (message, status) => { throw new Invalide(message, status); };

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Invalide) return res.status(e.status).json({ error: e.message });
    if (e && e.code === '23505') return res.status(409).json({ error: 'Ce nom existe déjà.' });
    console.error('[studio_categories]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
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

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now);
  compteurs.set(cle, liste);
  return true;
}

// ─── Authentification : gestionnaire connecté, pour sa propre boutique ────────

router.use(authenticateToken, (req, res, next) => {
  const gid = entier(req.params.gestionnaireId);
  if (!gid || !req.user || req.user.role !== 'gestionnaire' || Number(req.user.id) !== gid) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  req.gid = gid;
  next();
});

// ─── Images (R2, comme les produits) ──────────────────────────────────────────

const MEDIA_URL = 'https://media.e-vend.ca';
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const envoi = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('image');

function extensionSelonContenu(b) {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  return null;
}

router.post('/upload', (req, res) => {
  if (!limite(`cat-up-${req.gid}`, 30, 60 * 1000)) return res.status(429).json({ success: false, message: 'Trop d\'envois. Réessayez dans une minute.' });
  envoi(req, res, (err) => {
    if (err) {
      const gros = err.code === 'LIMIT_FILE_SIZE';
      return res.status(gros ? 413 : 400).json({ success: false, message: gros ? 'Image trop lourde (max 5 Mo)' : 'Envoi invalide' });
    }
    (async () => {
      try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier reçu' });
        const ext = extensionSelonContenu(req.file.buffer);
        if (!ext) return res.status(400).json({ success: false, message: 'Format non accepté (JPEG, PNG, WebP ou GIF seulement)' });
        const dossier = ['banniere', 'apropos'].includes(req.query.dossier) ? req.query.dossier : 'categories'; // banniere / apropos = images de l'accueil
        const cle = `studio/${dossier}/${req.gid}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
        const mimes = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
        await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: req.file.buffer, ContentType: mimes[ext] }));
        res.status(201).json({ success: true, image_url: `${MEDIA_URL}/${cle}` });
      } catch (e) {
        console.error('[studio_categories] upload', e && e.message ? e.message : e);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
      }
    })();
  });
});

function urlImage(req, v) {
  if (v === undefined || v === null || v === '') return null;
  const re = new RegExp(`^${MEDIA_URL.replace(/\./g, '\\.')}/studio/categories/${req.gid}/[a-f0-9]{32}\\.(jpg|png|webp|gif)$`);
  if (typeof v !== 'string' || !re.test(v)) bad('Image invalide (utilisez le bouton d\'envoi)');
  return v;
}

// ════════════════════════════════════════════════════════════════════════════
// GROUPES
// ════════════════════════════════════════════════════════════════════════════

router.get('/groupes', h(async (req, res) => {
  const r = await pool.query(
    `SELECT g.id, g.nom, g.ordre, g.active, g.image,
            (SELECT COUNT(*) FROM studio_categories c WHERE c.groupe_id = g.id)::int AS nb_categories
       FROM studio_groupes_categories g
      WHERE g.gestionnaire_id = $1
      ORDER BY g.ordre ASC NULLS LAST, g.nom ASC`, [req.gid]);
  res.json({ groupes: r.rows });
}));

function lireGroupe(req) {
  const b = req.body || {};
  const nom = texte(b.nom, 'Le nom du groupe', 100, true);
  let ordre = null;
  if (b.ordre !== undefined && b.ordre !== null && b.ordre !== '') {
    ordre = Number(b.ordre);
    if (!Number.isInteger(ordre) || ordre < 0 || ordre > 100000) bad('Ordre invalide');
  }
  return { nom, ordre, active: b.active !== false, image: urlImage(req, b.image) };
}

router.post('/groupes', h(async (req, res) => {
  const g = lireGroupe(req);
  const n = await pool.query('SELECT COUNT(*)::int AS n FROM studio_groupes_categories WHERE gestionnaire_id = $1', [req.gid]);
  if (n.rows[0].n >= 200) bad('Limite de 200 groupes atteinte', 409);
  const dup = await pool.query('SELECT 1 FROM studio_groupes_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [req.gid, g.nom]);
  if (dup.rowCount) bad('Un groupe avec ce nom existe déjà.', 409);
  const r = await pool.query(
    `INSERT INTO studio_groupes_categories (gestionnaire_id, nom, ordre, active, image) VALUES ($1,$2,$3,$4,$5) RETURNING id, nom, ordre, active, image`,
    [req.gid, g.nom, g.ordre, g.active, g.image]);
  res.status(201).json({ success: true, groupe: r.rows[0] });
}));

router.put('/groupes/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Groupe invalide');
  const g = lireGroupe(req);
  const dup = await pool.query('SELECT 1 FROM studio_groupes_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2) AND id <> $3', [req.gid, g.nom, id]);
  if (dup.rowCount) bad('Un groupe avec ce nom existe déjà.', 409);
  const r = await pool.query(
    `UPDATE studio_groupes_categories SET nom=$1, ordre=$2, active=$3, image=$4 WHERE id=$5 AND gestionnaire_id=$6 RETURNING id, nom, ordre, active, image`,
    [g.nom, g.ordre, g.active, g.image, id, req.gid]);
  if (!r.rowCount) bad('Groupe introuvable', 404);
  res.json({ success: true, groupe: r.rows[0] });
}));

router.delete('/groupes/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Groupe invalide');
  const liees = await pool.query('SELECT COUNT(*)::int AS n FROM studio_categories WHERE groupe_id = $1 AND gestionnaire_id = $2', [id, req.gid]);
  if (liees.rows[0].n > 0) {
    bad(`Impossible de supprimer : ${liees.rows[0].n} catégorie(s) sont encore assignée(s) à ce groupe. Réassigne-les à un autre groupe d'abord.`, 409);
  }
  const r = await pool.query('DELETE FROM studio_groupes_categories WHERE id = $1 AND gestionnaire_id = $2 RETURNING id, nom', [id, req.gid]);
  if (!r.rowCount) bad('Groupe introuvable', 404);
  res.json({ success: true, deleted: r.rows[0] });
}));

// ════════════════════════════════════════════════════════════════════════════
// CATÉGORIES
// ════════════════════════════════════════════════════════════════════════════

router.get('/categories', h(async (req, res) => {
  const r = await pool.query(
    `SELECT c.id, c.nom, c.active, c.description, c.image, c.groupe_id, c.taxable,
            g.nom AS groupe_nom,
            (SELECT COUNT(*) FROM produits p WHERE p.categorie_id = c.id)::int AS product_count
       FROM studio_categories c
       LEFT JOIN studio_groupes_categories g ON g.id = c.groupe_id
      WHERE c.gestionnaire_id = $1
      ORDER BY c.nom ASC`, [req.gid]);
  res.json({ categories: r.rows });
}));

async function lireCategorie(req) {
  const b = req.body || {};
  const nom = texte(b.nom, 'Le nom de la catégorie', 100, true);
  const description = texte(b.description, 'Description', 1000) || null;
  let groupeId = null;
  if (b.groupe_id !== undefined && b.groupe_id !== null && b.groupe_id !== '') {
    groupeId = entier(b.groupe_id);
    if (!groupeId) bad('Groupe invalide');
    const g = await pool.query('SELECT 1 FROM studio_groupes_categories WHERE id = $1 AND gestionnaire_id = $2', [groupeId, req.gid]);
    if (!g.rowCount) bad('Groupe introuvable', 404);
  }
  return { nom, description, image: urlImage(req, b.image), groupeId, active: b.active !== false, taxable: b.taxable !== false };
}

router.post('/categories', h(async (req, res) => {
  const c = await lireCategorie(req);
  const n = await pool.query('SELECT COUNT(*)::int AS n FROM studio_categories WHERE gestionnaire_id = $1', [req.gid]);
  if (n.rows[0].n >= 1000) bad('Limite de 1000 catégories atteinte', 409);
  const dup = await pool.query('SELECT 1 FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2)', [req.gid, c.nom]);
  if (dup.rowCount) bad('Une catégorie avec ce nom existe déjà.', 409);
  const r = await pool.query(
    `INSERT INTO studio_categories (gestionnaire_id, nom, description, image, active, groupe_id, taxable)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.gid, c.nom, c.description, c.image, c.active, c.groupeId, c.taxable]);
  res.status(201).json({ id: r.rows[0].id });
}));

router.put('/categories/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Catégorie invalide');
  const c = await lireCategorie(req);
  const dup = await pool.query('SELECT 1 FROM studio_categories WHERE gestionnaire_id = $1 AND LOWER(nom) = LOWER($2) AND id <> $3', [req.gid, c.nom, id]);
  if (dup.rowCount) bad('Une catégorie avec ce nom existe déjà.', 409);
  const r = await pool.query(
    `UPDATE studio_categories SET nom=$1, description=$2, image=$3, active=$4, groupe_id=$5, taxable=$6
      WHERE id=$7 AND gestionnaire_id=$8 RETURNING id`,
    [c.nom, c.description, c.image, c.active, c.groupeId, c.taxable, id, req.gid]);
  if (!r.rowCount) bad('Catégorie introuvable', 404);
  // Le nom est aussi copié sur les produits (affichage / recherche) : on le garde à jour.
  await pool.query('UPDATE produits SET categorie = $1 WHERE categorie_id = $2 AND gestionnaire_id = $3', [c.nom, id, req.gid]);
  res.json({ success: true });
}));

router.delete('/categories/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Catégorie invalide');
  const r = await pool.query('DELETE FROM studio_categories WHERE id = $1 AND gestionnaire_id = $2 RETURNING id, nom', [id, req.gid]);
  if (!r.rowCount) bad('Catégorie introuvable', 404);
  // Les produits de cette catégorie n'ont plus de catégorie (categorie_id se vide tout seul ; on vide aussi le nom copié).
  await pool.query('UPDATE produits SET categorie = NULL WHERE categorie_id IS NULL AND categorie = $1 AND gestionnaire_id = $2', [r.rows[0].nom, req.gid]);
  res.json({ success: true, deleted: r.rows[0] });
}));

module.exports = router;