// routes/studio_seo_site.js
//
// GET  /api/studio/seo-site/:gestionnaireId/public  — lecture publique (sans auth)
// GET  /api/studio/seo-site/:vendeurId         — lecture dashboard gestionnaire (auth)
// POST /api/studio/seo-site/:vendeurId         — sauvegarder + upload image S3 (auth)

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const multer  = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

// ─── S3 ───────────────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.AWS_S3_BUCKET;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Format non supporté. PNG, JPG ou WEBP seulement.'), ok);
  },
});

// ─── Valeurs par défaut ───────────────────────────────────────────────────────
const DEFAUTS = {
  titre_accueil:    '',
  meta_description: '',
  og_image_url:     '',
  og_image_key:     '',
};

// ─── Helper propriétaire ──────────────────────────────────────────────────────
function verifierProprietaire(req, res) {
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  const gestionnaireIdToken = parseInt(req.user?.id, 10);
  if (gestionnaireIdToken !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// =============================================================================
// GET /api/studio/seo-site/:gestionnaireId/public
// Lecture publique — appelée par le site du vendeur pour injecter les balises SEO
// =============================================================================
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT titre_accueil, meta_description, og_image_url
         FROM seo_site_gestionnaire
        WHERE gestionnaire_id = $1`,
      [req.params.gestionnaireId]
    );
    if (result.rows.length === 0) return res.json(DEFAUTS);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /studio/seo-site/:gestionnaireId/public :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/seo-site/:vendeurId
// Lecture pour le dashboard gestionnaire
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT titre_accueil, meta_description, og_image_url, og_image_key, updated_at
         FROM seo_site_gestionnaire
        WHERE gestionnaire_id = $1`,
      [req.params.gestionnaireId]
    );
    res.set('Cache-Control', 'no-store');
    res.json(result.rows.length === 0 ? DEFAUTS : result.rows[0]);
  } catch (err) {
    console.error('GET /studio/seo-site/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/seo-site/:vendeurId
// Sauvegarder la config SEO + upload image OG vers S3
// FormData : { titre_accueil, meta_description, og_image?, supprimer_image? }
// =============================================================================
router.post('/', authenticateToken, (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  upload.single('og_image')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const { gestionnaireId } = req.params;
    const { titre_accueil, meta_description, supprimer_image } = req.body;

    try {
      // Config actuelle (pour supprimer l'ancienne image S3)
      const current     = await pool.query(
        `SELECT og_image_key FROM seo_site_gestionnaire WHERE gestionnaire_id = $1`,
        [gestionnaireId]
      );
      const ancienneKey = current.rows[0]?.og_image_key;

      let og_image_url = undefined;
      let og_image_key = undefined;

      if (req.file) {
        // Supprimer l'ancienne image S3
        if (ancienneKey && BUCKET) {
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: ancienneKey }));
          } catch (e) {
            console.warn('⚠️ Impossible de supprimer l\'ancienne image S3 :', e.message);
          }
        }
        // Upload nouvelle image
        const ext      = path.extname(req.file.originalname) || '.jpg';
        const s3Key    = `studio/seo/gestionnaire_${gestionnaireId}_og_${uuidv4()}${ext}`;
        await s3.send(new PutObjectCommand({
          Bucket:      BUCKET,
          Key:         s3Key,
          Body:        req.file.buffer,
          ContentType: req.file.mimetype,
        }));
        og_image_url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
        og_image_key = s3Key;
        console.log(`🖼️  Image OG gestionnaire ${gestionnaireId} uploadée : ${og_image_url}`);

      } else if (supprimer_image === 'true') {
        if (ancienneKey && BUCKET) {
          try {
            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: ancienneKey }));
          } catch (e) {
            console.warn('⚠️ Impossible de supprimer l\'image S3 :', e.message);
          }
        }
        og_image_url = '';
        og_image_key = '';
      }

      // UPSERT — crée la ligne si elle n'existe pas encore
      const setClauses = ['updated_at = NOW()'];
      const values     = [];
      let   idx        = 1;

      if (titre_accueil    !== undefined) { setClauses.push(`titre_accueil = $${idx++}`);    values.push(titre_accueil); }
      if (meta_description !== undefined) { setClauses.push(`meta_description = $${idx++}`); values.push(meta_description); }
      if (og_image_url     !== undefined) { setClauses.push(`og_image_url = $${idx++}`);     values.push(og_image_url); }
      if (og_image_key     !== undefined) { setClauses.push(`og_image_key = $${idx++}`);     values.push(og_image_key); }

      const result = await pool.query(
        `INSERT INTO seo_site_gestionnaire (gestionnaire_id, titre_accueil, meta_description, og_image_url, og_image_key)
         VALUES ($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})
         ON CONFLICT (gestionnaire_id) DO UPDATE
           SET ${setClauses.join(', ')}
         RETURNING *`,
        [
          ...values,
          vendeurId,
          titre_accueil    ?? '',
          meta_description ?? '',
          og_image_url     ?? '',
          og_image_key     ?? '',
        ]
      );

      res.json({ success: true, config: result.rows[0] });
    } catch (err) {
      console.error('POST /studio/seo-site/:gestionnaireId :', err.message);
      res.status(500).json({ error: err.message });
    }
  });
});

module.exports = router;