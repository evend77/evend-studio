// routes/pagesPlateforme.js
// Pages de la plateforme e-Vend Studio — Guides, documentation

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer  = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// ── Client S3 (même config que upload_image.js) ──────────────────────────────
const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET;

const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB pour vidéos
  fileFilter: (req, file, cb) => {
    const allowed = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm|ogg)/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format non supporté. Images : JPG, PNG, GIF, WEBP — Vidéos : MP4, WEBM'));
  }
});

// ─── ROUTES PUBLIQUES ───────────────────────────────────────────────────────

// GET /api/pages/public/menu — Pages à afficher dans le menu (afficher_dans_menu = true)
router.get('/public/menu', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre 
       FROM pages_plateforme 
       WHERE actif = true AND afficher_dans_menu = true 
       ORDER BY titre ASC`
    );
    res.json({ pages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pages/public/:slug — Sans auth pour affichage sur le site
router.get('/public/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, contenu, meta_description, updated_at 
       FROM pages_plateforme 
       WHERE slug = $1 AND actif = true`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page introuvable' });
    res.json({ page: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pages/public — Toutes les pages actives (pour footer, sitemap, etc.)
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, meta_description, updated_at 
       FROM pages_plateforme 
       WHERE actif = true 
       ORDER BY ordre ASC, id ASC`
    );
    res.json({ pages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pages/public/with-content — Toutes les pages actives avec contenu (pour recherche)
router.get('/public/with-content', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, contenu, meta_description, updated_at 
       FROM pages_plateforme 
       WHERE actif = true 
       ORDER BY ordre ASC, id ASC`
    );
    res.json({ pages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pages/upload-media — Upload image ou vidéo vers S3 (admin)
router.post('/upload-media', authenticateToken, isAdmin, uploadMedia.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    const { buffer, mimetype, originalname } = req.file;
    const isVideo = mimetype.startsWith('video/');
    const ext     = (originalname.split('.').pop() || 'jpg').toLowerCase();
    const s3Key   = `pages/${isVideo ? 'videos' : 'images'}/${uuidv4()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         s3Key,
      Body:        buffer,
      ContentType: mimetype,
    }));

    const url = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${s3Key}`;
    console.log(`✅ Média page uploadé: ${url}`);

    res.json({ success: true, url, type: isVideo ? 'video' : 'image' });
  } catch (error) {
    console.error('❌ Erreur upload média page:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── ROUTES ADMIN ─────────────────────────────────────────────────────────
router.use(authenticateToken, isAdmin);

// GET /api/pages — Toutes les pages (admin)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM pages_plateforme ORDER BY ordre ASC, id ASC`
    );
    res.json({ pages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pages/:slug — Récupérer une page spécifique (admin)
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM pages_plateforme WHERE slug = $1`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page introuvable' });
    res.json({ page: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pages/:slug — Sauvegarder une page (admin)
router.patch('/:slug', async (req, res) => {
  const { contenu, titre, actif, meta_description, ordre, afficher_dans_menu } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pages_plateforme SET
        contenu          = COALESCE($1, contenu),
        titre            = COALESCE($2, titre),
        actif            = COALESCE($3, actif),
        meta_description = COALESCE($4, meta_description),
        ordre            = COALESCE($5, ordre),
        afficher_dans_menu = COALESCE($6, afficher_dans_menu),
        updated_at       = NOW(),
        updated_by       = $7
       WHERE slug = $8 RETURNING *`,
      [contenu, titre, actif, meta_description, ordre, afficher_dans_menu, 'Administrateur', req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page introuvable' });
    res.json({ page: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pages — Créer une nouvelle page (admin)
router.post('/', async (req, res) => {
  const { slug, titre, contenu, actif, meta_description, ordre, afficher_dans_menu } = req.body;
  
  if (!slug || !titre) {
    return res.status(400).json({ error: 'slug et titre sont requis' });
  }
  
  try {
    // Vérifier si le slug existe déjà
    const existing = await pool.query(
      `SELECT id FROM pages_plateforme WHERE slug = $1`,
      [slug]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Une page avec ce slug existe déjà' });
    }
    
    const result = await pool.query(
      `INSERT INTO pages_plateforme (slug, titre, contenu, actif, meta_description, ordre, afficher_dans_menu, updated_by)
       VALUES ($1, $2, $3, COALESCE($4, true), $5, COALESCE($6, 0), COALESCE($7, true), 'Administrateur')
       RETURNING *`,
      [slug, titre, contenu, actif, meta_description, ordre, afficher_dans_menu]
    );
    res.status(201).json({ page: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/pages/:slug — Supprimer une page (soft delete ou hard ?)
router.delete('/:slug', async (req, res) => {
  try {
    // Option 1: Hard delete
    const result = await pool.query(
      `DELETE FROM pages_plateforme WHERE slug = $1 RETURNING id`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page introuvable' });
    res.json({ message: 'Page supprimée avec succès' });
    
    // Option 2: Soft delete (mettre actif = false)
    // const result = await pool.query(
    //   `UPDATE pages_plateforme SET actif = false, updated_at = NOW(), updated_by = 'Administrateur'
    //    WHERE slug = $1 RETURNING id`,
    //   [req.params.slug]
    // );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/pages/:slug/order — Réordonner les pages (admin)
router.patch('/:slug/order', async (req, res) => {
  const { ordre } = req.body;
  if (ordre === undefined || typeof ordre !== 'number') {
    return res.status(400).json({ error: 'ordre est requis et doit être un nombre' });
  }
  try {
    const result = await pool.query(
      `UPDATE pages_plateforme SET ordre = $1, updated_at = NOW(), updated_by = 'Administrateur'
       WHERE slug = $2 RETURNING id, slug, ordre`,
      [ordre, req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page introuvable' });
    res.json({ page: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;