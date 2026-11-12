
// routes/images.js
// Gestionnaire de fichiers Cloudflare R2 - Logos, Divers & Audio
// e-Vend Studio, indépendant du blog

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const multer = require('multer');
const { verifierTypeFichier } = require('../utils/verifierTypeFichier');

// ─── R2 CONFIG ────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_ADMIN;

// ─── CONFIGURATION UPLOAD ─────────────────────────────────────────────────

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 Mo

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowed =
      /^(image\/jpeg|image\/png|image\/gif|image\/webp|audio\/mpeg)$/i.test(file.mimetype);

    if (!allowed) {
      return cb(new Error('TYPE_FICHIER_INVALIDE'));
    }

    cb(null, true);
  },
});

// ─── EXTENSIONS AUTORISÉES ────────────────────────────────────────────────

const EXTENSIONS_PAR_CATEGORIE = {
  logo: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  divers: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  audio: ['mp3'],
};

// ─── UPLOAD VERS R2 ───────────────────────────────────────────────────────

async function uploadToR2(buffer, originalName, mimetype, folder, category) {
  // Vérification du véritable contenu du fichier (magic bytes).
  const extensionsAutorisees =
    EXTENSIONS_PAR_CATEGORIE[category] || EXTENSIONS_PAR_CATEGORIE.divers;

  const verif = await verifierTypeFichier(
    buffer,
    extensionsAutorisees
  );

  if (!verif.ok) {
    console.warn(
      `⚠️ Upload rejeté : catégorie "${category}", type détecté : ${verif.mimeDetecte || 'inconnu'}`
    );

    const err = new Error(
      category === 'audio'
        ? "Le fichier envoyé n'est pas un MP3 valide."
        : "Le fichier envoyé n'est pas une image valide."
    );

    err.status = 400;
    throw err;
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `studio/${folder}/${Date.now()}-${safeName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: verif.mimeDetecte,
    })
  );

  return {
    url: `https://admin-media.e-vend.ca/${key}`,
    key,
  };
}

// ─── ROUTES ───────────────────────────────────────────────────────────────

// Réservé aux administrateurs du Studio.
router.use(authenticateToken, isAdmin);

// ─── GET /api/images?category=logo|divers|audio ────────────────────────────

router.get('/', async (req, res) => {
  const { category } = req.query;

  if (!category || !['logo', 'divers', 'audio'].includes(category)) {
    return res.status(400).json({
      error: 'category must be "logo", "divers" or "audio"',
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, url, key, nom, taille, type, category,
              uploaded_at as "uploadedAt"
       FROM admin_images
       WHERE category = $1
       ORDER BY uploaded_at DESC`,
      [category]
    );

    res.json({ images: result.rows });
  } catch (err) {
    console.error('GET /images error:', err);

    res.status(500).json({
      error: 'Erreur lors de la récupération des fichiers.',
    });
  }
});

// ─── POST /api/images/upload ──────────────────────────────────────────────

router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Erreur Multer upload:', err);

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            code: 'LIMIT_FILE_SIZE',
            error: 'Fichier trop volumineux. La taille maximale autorisée est de 15 Mo.',
            maxSize: MAX_FILE_SIZE,
          });
        }

        return res.status(400).json({
          error: 'Erreur lors de la réception du fichier.',
          code: err.code,
        });
      }

      if (err.message === 'TYPE_FICHIER_INVALIDE') {
        return res.status(400).json({
          error: 'Format de fichier non autorisé. Utilisez JPG, PNG, GIF, WEBP ou MP3 selon la catégorie.',
        });
      }

      return res.status(400).json({
        error: 'Impossible de recevoir ce fichier.',
      });
    }

    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Aucun fichier fourni.',
    });
  }

  const { category } = req.body;

  if (!category || !['logo', 'divers', 'audio'].includes(category)) {
    return res.status(400).json({
      error: 'category must be "logo", "divers" or "audio"',
    });
  }

  try {
    const folder =
      category === 'logo'
        ? 'logos'
        : category === 'audio'
          ? 'audio'
          : 'divers';

    const { url, key } = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder,
      category
    );

    const result = await pool.query(
      `INSERT INTO admin_images
        (url, key, nom, taille, type, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, url, key, nom, taille, type, category,
                 uploaded_at as "uploadedAt"`,
      [
        url,
        key,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        category,
      ]
    );

    res.status(201).json({
      image: result.rows[0],
    });
  } catch (err) {
    console.error('POST /images/upload error:', err);

    res.status(err.status || 500).json({
      error: err.status
        ? err.message
        : "Une erreur est survenue pendant l'envoi du fichier.",
    });
  }
});

// ─── DELETE /api/images/:id ───────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const imgResult = await pool.query(
      'SELECT key FROM admin_images WHERE id = $1',
      [req.params.id]
    );

    if (imgResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Image non trouvée.',
      });
    }

    // Suppression dans R2.
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: imgResult.rows[0].key,
      })
    );

    // Suppression dans PostgreSQL.
    await pool.query(
      'DELETE FROM admin_images WHERE id = $1',
      [req.params.id]
    );

    res.json({
      message: 'Image supprimée',
    });
  } catch (err) {
    console.error('DELETE /images/:id error:', err);

    res.status(500).json({
      error: 'Erreur lors de la suppression du fichier.',
    });
  }
});

module.exports = router;
