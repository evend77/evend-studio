// Blog plateforme e-Vend — CRUD articles + upload images

const express  = require('express');
const router   = express.Router();
const pool     = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer   = require('multer');
const { v4: uuidv4 } = require('uuid');

// ─── S3 Config ────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'evend-ca-storage-2026';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(file.mimetype);
    if (!ok) cb(new Error('Format non supporté'), false);
    else cb(null, true);
  },
});

async function uploadS3(buffer, originalname, mimetype) {
  const ext = originalname.split('.').pop() || 'jpg';
  const key = `blog/${Date.now()}-${uuidv4()}.${ext}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));
  
  return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

function genererSlug(titre) {
  return titre.toLowerCase()
    .replace(/[àáâã]/g, 'a').replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i').replace(/[ôõ]/g, 'o').replace(/[ùûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    + '-' + Date.now();
}

console.log('✅ BlogPlateforme routes chargées');

// ─── ROUTES PUBLIQUES ─────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const { categorie, tag, q, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let conditions = [`a.statut = 'publie'`, `a.visible = true`];
    let params = [];
    let idx = 1;

    if (categorie) {
      conditions.push(`c.slug = $${idx++}`);
      params.push(categorie);
    }
    if (tag) {
      conditions.push(`$${idx++} = ANY(a.tags)`);
      params.push(tag);
    }
    if (q) {
      conditions.push(`(a.titre ILIKE $${idx} OR a.extrait ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const total = await pool.query(
      `SELECT COUNT(*) FROM blog_admin a LEFT JOIN blog_categories c ON c.id = a.categorie_id ${where}`,
      params
    );

    const articles = await pool.query(
      `SELECT a.id, a.titre, a.slug, a.extrait, a.image_couverture, a.auteur,
              a.date_publication, a.nb_vues, a.tags,
              c.nom AS categorie_nom, c.slug AS categorie_slug
       FROM blog_admin a
       LEFT JOIN blog_categories c ON c.id = a.categorie_id
       ${where}
       ORDER BY a.date_publication DESC NULLS LAST, a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    const categories = await pool.query(
      `SELECT c.id, c.nom, c.slug, COUNT(a.id) AS nb
       FROM blog_categories c
       LEFT JOIN blog_admin a ON a.categorie_id = c.id AND a.statut = 'publie' AND a.visible = true
       GROUP BY c.id ORDER BY c.ordre, c.nom`
    );

    res.json({
      articles: articles.rows,
      categories: categories.rows,
      pagination: {
        total: parseInt(total.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('GET /blog:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/article/:slug', async (req, res) => {
  try {
    await pool.query(`UPDATE blog_admin SET nb_vues = nb_vues + 1 WHERE slug = $1`, [req.params.slug]);
    const result = await pool.query(
      `SELECT a.*, c.nom AS categorie_nom, c.slug AS categorie_slug
       FROM blog_admin a
       LEFT JOIN blog_categories c ON c.id = a.categorie_id
       WHERE a.slug = $1 AND a.statut = 'publie' AND a.visible = true`,
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article introuvable' });
    res.json({ article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ROUTES ADMIN ─────────────────────────────────────────────────────────

router.use(authenticateToken, isAdmin);

router.get('/admin/articles', async (req, res) => {
  const { statut, q, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let conditions = [];
    let params = [];
    let idx = 1;

    if (statut && statut !== 'tous') {
      conditions.push(`a.statut = $${idx++}`);
      params.push(statut);
    }
    if (q) {
      conditions.push(`(a.titre ILIKE $${idx} OR a.auteur ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const total = await pool.query(`SELECT COUNT(*) FROM blog_admin a ${where}`, params);
    const articles = await pool.query(
      `SELECT a.id, a.titre, a.slug, a.statut, a.visible, a.auteur,
              a.image_couverture, a.date_publication, a.nb_vues, a.tags,
              a.created_at, a.updated_at,
              c.nom AS categorie_nom
       FROM blog_admin a
       LEFT JOIN blog_categories c ON c.id = a.categorie_id
       ${where}
       ORDER BY a.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      articles: articles.rows,
      pagination: {
        total: parseInt(total.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/articles/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.nom AS categorie_nom
       FROM blog_admin a
       LEFT JOIN blog_categories c ON c.id = a.categorie_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article introuvable' });
    res.json({ article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/articles', async (req, res) => {
  const {
    titre, contenu, extrait, image_couverture, auteur, categorie_id,
    tags, statut, visible, date_publication, seo_titre, seo_description
  } = req.body;

  if (!titre) return res.status(400).json({ error: 'Le titre est requis' });

  try {
    const slug = genererSlug(titre);
    const result = await pool.query(
      `INSERT INTO blog_admin
        (titre, slug, contenu, extrait, image_couverture, auteur, categorie_id,
         tags, statut, visible, date_publication, seo_titre, seo_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        titre, slug, contenu || null, extrait || null, image_couverture || null,
        auteur || 'e-Vend', categorie_id || null,
        tags || [], statut || 'brouillon', visible || false,
        date_publication || null, seo_titre || null, seo_description || null,
      ]
    );
    res.status(201).json({ article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/articles/:id', async (req, res) => {
  const {
    titre, contenu, extrait, image_couverture, auteur, categorie_id,
    tags, statut, visible, date_publication, seo_titre, seo_description
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE blog_admin SET
        titre            = COALESCE($1,  titre),
        contenu          = COALESCE($2,  contenu),
        extrait          = COALESCE($3,  extrait),
        image_couverture = COALESCE($4,  image_couverture),
        auteur           = COALESCE($5,  auteur),
        categorie_id     = COALESCE($6,  categorie_id),
        tags             = COALESCE($7,  tags),
        statut           = COALESCE($8,  statut),
        visible          = COALESCE($9,  visible),
        date_publication = COALESCE($10, date_publication),
        seo_titre        = COALESCE($11, seo_titre),
        seo_description  = COALESCE($12, seo_description),
        updated_at       = NOW()
       WHERE id = $13 RETURNING *`,
      [
        titre, contenu, extrait, image_couverture, auteur, categorie_id,
        tags, statut, visible, date_publication, seo_titre, seo_description,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Article introuvable' });
    res.json({ article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/articles/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM blog_admin WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ROUTE UPLOAD CORRIGÉE (sans ACL)
router.post('/admin/upload-image', upload.single('image'), async (req, res) => {
  console.log('🔥 Upload route appelée!');
  
  if (!req.file) {
    console.log('❌ Aucun fichier reçu');
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  console.log('📸 Fichier reçu:', req.file.originalname, req.file.mimetype, req.file.size);

  try {
    const url = await uploadS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    console.log('✅ Upload réussi:', url);
    res.json({ url });
  } catch (err) {
    console.error('❌ Erreur upload S3:', err.message);
    res.status(500).json({ error: 'Erreur upload: ' + err.message });
  }
});

router.get('/admin/categories', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM blog_categories ORDER BY ordre, nom`);
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;