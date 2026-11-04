// CHEMIN : routes/seoPlateforme.js
// SEO de la page d'accueil d'e-Vend Studio (titre, méta-description, image de partage)
//
// GET  /api/seoPlateforme/public  — lecture publique (sans auth)
// GET  /api/seoPlateforme         — lecture admin
// POST /api/seoPlateforme         — sauvegarde admin (+ image Open Graph vers R2)

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const multer  = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { verifierTypeFichier } = require('../utils/verifierTypeFichier');

// ─── Client R2 (même bucket admin que le blog) ────────────────────────────
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_ADMIN;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Format non supporté. PNG, JPG ou WEBP seulement.'), ok);
  },
});

// ─── Table (créée automatiquement, une seule ligne id = 1) ────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS seo_plateforme (
    id               INTEGER PRIMARY KEY DEFAULT 1,
    titre_accueil    VARCHAR(70)  NOT NULL DEFAULT '',
    meta_description VARCHAR(320) NOT NULL DEFAULT '',
    og_image_url     TEXT,
    og_image_key     TEXT,
    updated_at       TIMESTAMP DEFAULT NOW(),
    CONSTRAINT seo_plateforme_une_ligne CHECK (id = 1)
  )
`).then(() => pool.query(`ALTER TABLE seo_plateforme ADD COLUMN IF NOT EXISTS og_image_key TEXT`))
  .catch(err => console.error('❌ Création table seo_plateforme :', err.message));

// Supprime une image R2 (sans faire échouer la sauvegarde si ça rate)
async function supprimerImageR2(key) {
  if (!key || !BUCKET) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    console.warn("⚠️ Impossible de supprimer l'ancienne image R2 :", e.message);
  }
}

const VIDE = { titre_accueil: '', meta_description: '', og_image_url: null };

async function lire() {
  const r = await pool.query(
    `SELECT titre_accueil, meta_description, og_image_url FROM seo_plateforme WHERE id = 1`
  );
  return r.rows[0] || VIDE;
}

// ─── Public ───────────────────────────────────────────────────────────────
router.get('/public', async (_req, res) => {
  try {
    res.json(await lire());
  } catch (err) {
    console.error('GET /seoPlateforme/public :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin ────────────────────────────────────────────────────────────────
router.get('/', authenticateToken, isAdmin, async (_req, res) => {
  try {
    res.json(await lire());
  } catch (err) {
    console.error('GET /seoPlateforme :', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, isAdmin, upload.single('og_image'), async (req, res) => {
  try {
    const titre = String(req.body.titre_accueil    || '').trim().slice(0, 70);
    const desc  = String(req.body.meta_description || '').trim().slice(0, 320);
    const supprimer = req.body.supprimer_image === 'true';

    const actuel = await pool.query(`SELECT og_image_url, og_image_key FROM seo_plateforme WHERE id = 1`);
    let imageUrl = actuel.rows[0]?.og_image_url || null;
    let imageKey = actuel.rows[0]?.og_image_key || null;
    const ancienneKey = imageKey;

    if (req.file) {
      if (!BUCKET) return res.status(500).json({ error: 'Configuration R2 manquante (R2_BUCKET_ADMIN)' });

      // 🔒 Vérification du VRAI contenu du fichier (magic bytes)
      const verif = await verifierTypeFichier(req.file.buffer, ['jpg', 'jpeg', 'png', 'webp']);
      if (!verif.ok) {
        return res.status(400).json({ error: "Le fichier envoyé n'est pas une image valide." });
      }
      const key = `studio/seo/${Date.now()}-${uuidv4()}.${verif.extensionDetectee}`;
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: verif.mimeDetecte,
      }));
      imageUrl = `https://admin-media.e-vend.ca/${key}`;
      imageKey = key;
      await supprimerImageR2(ancienneKey);   // l'ancienne image n'est plus utile
    } else if (supprimer) {
      await supprimerImageR2(ancienneKey);
      imageUrl = null;
      imageKey = null;
    }

    await pool.query(
      `INSERT INTO seo_plateforme (id, titre_accueil, meta_description, og_image_url, og_image_key, updated_at)
       VALUES (1, $1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE
         SET titre_accueil = $1, meta_description = $2, og_image_url = $3, og_image_key = $4, updated_at = NOW()`,
      [titre, desc, imageUrl, imageKey]
    );

    res.json({ titre_accueil: titre, meta_description: desc, og_image_url: imageUrl });
  } catch (err) {
    console.error('POST /seoPlateforme :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;