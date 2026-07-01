// routes/studio_photos_vendeur.js
//
// GET    /api/studio/photos-vendeur/:vendeurId         — liste des photos (auth)
// POST   /api/studio/photos-vendeur/:gestionnaireId/upload  — uploader une photo vers S3 (auth)
// DELETE /api/studio/photos-vendeur/:gestionnaireId/:id     — supprimer une photo (auth)
//
// Limite : 25 photos max par site vendeur

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const multer  = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

const MAX_PHOTOS = 25;

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/i.test(file.mimetype);
    cb(ok ? null : new Error('Format non supporté. Accepté : JPG, PNG, GIF, WebP, SVG.'), ok);
  },
});

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
// GET /api/studio/photos-vendeur/:vendeurId
// Liste toutes les photos du site vendeur
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT id, url, s3_key, nom, taille, type, created_at
         FROM photos_site_gestionnaire
        WHERE gestionnaire_id = $1
        ORDER BY created_at DESC`,
      [req.params.gestionnaireId]
    );
    res.json({
      photos: result.rows,
      total:  result.rows.length,
      max:    MAX_PHOTOS,
      restant: Math.max(0, MAX_PHOTOS - result.rows.length),
    });
  } catch (err) {
    console.error('GET /studio/photos-vendeur/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/photos-vendeur/:gestionnaireId/upload
// Uploader une photo vers S3 — bloqué si quota 25 atteint
// =============================================================================
router.post('/upload', authenticateToken, (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  upload.single('photo')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Fichier trop lourd (max 10 Mo).' });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

    const { gestionnaireId } = req.params;

    try {
      // Vérifier le quota
      const count = await pool.query(
        `SELECT COUNT(*) AS total FROM photos_site_gestionnaire WHERE gestionnaire_id = $1`,
        [gestionnaireId]
      );
      if (parseInt(count.rows[0].total, 10) >= MAX_PHOTOS) {
        return res.status(400).json({
          error: `Quota de ${MAX_PHOTOS} photos atteint. Supprimez des photos pour en ajouter de nouvelles.`,
          quota_atteint: true,
        });
      }

      // Upload vers S3
      const { buffer, mimetype, originalname, size } = req.file;
      const ext    = path.extname(originalname).toLowerCase() || '.jpg';
      const s3Key  = `studio/photos-site/gestionnaire_${gestionnaireId}/${uuidv4()}${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         s3Key,
        Body:        buffer,
        ContentType: mimetype,
      }));

      const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

      // Sauvegarder en BD
      const result = await pool.query(
        `INSERT INTO photos_site_gestionnaire (gestionnaire_id, url, s3_key, nom, taille, type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [vendeurId, url, s3Key, originalname, size, mimetype]
      );

      // Retourner le nouveau total
      const newCount = parseInt(count.rows[0].total, 10) + 1;

      console.log(`🖼️  Photo gestionnaire ${gestionnaireId} uploadée : ${url}`);
      res.json({
        success: true,
        photo:   result.rows[0],
        total:   newCount,
        restant: Math.max(0, MAX_PHOTOS - newCount),
      });

    } catch (s3err) {
      console.error('❌ Erreur S3 upload photo vendeur :', s3err.message);
      res.status(500).json({ error: s3err.message });
    }
  });
});

// =============================================================================
// DELETE /api/studio/photos-vendeur/:gestionnaireId/:id
// Supprimer une photo (BD + S3)
// =============================================================================
router.delete('/:id', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { vendeurId, id } = req.params;

  try {
    // Récupérer la clé S3 avant suppression
    const photo = await pool.query(
      `SELECT s3_key FROM photos_site_gestionnaire WHERE id = $1 AND vendeur_id = $2`,
      [id, vendeurId]
    );
    if (photo.rows.length === 0) return res.status(404).json({ error: 'Photo introuvable.' });

    const s3Key = photo.rows[0].s3_key;

    // Supprimer de S3
    if (s3Key && BUCKET) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
      } catch (e) {
        console.warn('⚠️ Impossible de supprimer la photo S3 :', e.message);
      }
    }

    // Supprimer de la BD
    await pool.query(`DELETE FROM photos_site_gestionnaire WHERE id = $1`, [id]);

    // Retourner le nouveau total
    const count = await pool.query(
      `SELECT COUNT(*) AS total FROM photos_site_gestionnaire WHERE gestionnaire_id = $1`,
      [gestionnaireId]
    );
    const newTotal = parseInt(count.rows[0].total, 10);

    res.json({
      success: true,
      total:   newTotal,
      restant: Math.max(0, MAX_PHOTOS - newTotal),
    });

  } catch (err) {
    console.error('DELETE /studio/photos-vendeur/:gestionnaireId/:id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;