// routes/images.js
// Gestionnaire de fichiers Cloudflare R2 - Logos, Divers & Audio (e-Vend Studio, indépendant du blog)

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const { verifierTypeFichier } = require('../utils/verifierTypeFichier');

// ─── R2 Config ────────────────────────────────────────────────────────────
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_ADMIN; // photos-videos-admin-pour-site

// 🆕 Catégorie "audio" (musique de fond boutique publique).
// Multer n'a pas accès de façon fiable à req.body.category à ce stade (l'ordre
// des champs du FormData n'est pas garanti), donc on reste permissif ici
// (image OU audio) et c'est verifierTypeFichier() ci-dessous — avec la bonne
// liste selon la catégorie réelle — qui fait l'étape de validation stricte.
//
// 🐛 CORRECTION : la regex précédente (/mpeg/i) ne matchait que "audio/mpeg".
// Or certains navigateurs (Firefox, mobiles) envoient "audio/mp3", "audio/wav",
// "audio/x-wav", "audio/ogg" ou "audio/webm" → le fichier était rejeté
// silencieusement (cb(null, false) → req.file undefined → 400 trompeur
// "Aucun fichier fourni"). On accepte maintenant explicitement tous les
// formats audio courants, et on renvoie une VRAIE erreur multer (cb(new Error))
// pour que le message soit clair côté client.
const IMAGE_MIME_REGEX = /^image\/(jpeg|jpg|png|gif|webp)$/i;
const AUDIO_MIME_REGEX = /^audio\/(mpeg|mp3|mpg|wav|x-wav|wave|ogg|webm)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const isImage = IMAGE_MIME_REGEX.test(file.mimetype);
    const isAudio = AUDIO_MIME_REGEX.test(file.mimetype);
    if (isImage || isAudio) return cb(null, true);

    console.warn(
      `⚠️ Upload rejeté par fileFilter : mimetype="${file.mimetype}" (nom="${file.originalname}")`
    );
    cb(new Error(`Type de fichier non autorisé : ${file.mimetype}`));
  },
});

const EXTENSIONS_PAR_CATEGORIE = {
  logo:   ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  divers: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  audio:  ['mp3', 'wav', 'ogg', 'webm'], // élargi : cohérent avec les MIME acceptés
};

// Upload vers R2
async function uploadToR2(buffer, originalName, mimetype, folder, category) {
  // 🔒 Vérification du VRAI contenu du fichier (magic bytes) — le
  // fileFilter ne regarde que le Content-Type déclaré par le client.
  const extensionsAutorisees =
    EXTENSIONS_PAR_CATEGORIE[category] || EXTENSIONS_PAR_CATEGORIE.divers;

  const verif = await verifierTypeFichier(buffer, extensionsAutorisees);
  if (!verif.ok) {
    console.warn(
      `⚠️ Upload rejeté (images admin, catégorie "${category}") : contenu réel non conforme (détecté: ${verif.mimeDetecte || 'inconnu'})`
    );
    const err = new Error(
      category === 'audio'
        ? 'Le fichier envoyé n\'est pas un audio valide (mp3, wav, ogg ou webm attendu).'
        : 'Le fichier envoyé n\'est pas une image valide.'
    );
    err.status = 400;
    throw err;
  }

  const ext = verif.extensionDetectee; // extension réelle détectée
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
    key: key,
  };
}

// ─── ROUTES ───────────────────────────────────────────────────────────────

// Gestionnaire de fichiers : réservé aux admins du Studio.
router.use(authenticateToken, isAdmin);

// GET /api/images?category=logo|divers|audio
router.get('/', async (req, res) => {
  const { category } = req.query;

  if (!category || !['logo', 'divers', 'audio'].includes(category)) {
    return res
      .status(400)
      .json({ error: 'category must be "logo", "divers" or "audio"' });
  }

  try {
    const result = await pool.query(
      `SELECT id, url, key, nom, taille, type, category, uploaded_at as "uploadedAt"
       FROM admin_images
       WHERE category = $1
       ORDER BY uploaded_at DESC`,
      [category]
    );
    res.json({ images: result.rows });
  } catch (err) {
    console.error('GET /images error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/images/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier fourni' });
  }

  const { category } = req.body;
  if (!category || !['logo', 'divers', 'audio'].includes(category)) {
    return res
      .status(400)
      .json({ error: 'category must be "logo", "divers" or "audio"' });
  }

  // 🔒 Cohérence catégorie ↔ type MIME : évite qu'un mp3 soit classé
  // en "logo" ou une image en "audio" (ce qui casserait l'affichage).
  const isAudio = AUDIO_MIME_REGEX.test(req.file.mimetype);
  if (category === 'audio' && !isAudio) {
    return res
      .status(400)
      .json({ error: 'La catégorie "audio" exige un fichier audio.' });
  }
  if (category !== 'audio' && isAudio) {
    return res
      .status(400)
      .json({ error: 'Un fichier audio ne peut pas être classé dans cette catégorie.' });
  }

  try {
    const folder =
      category === 'logo' ? 'logos' : category === 'audio' ? 'audio' : 'divers';

    const { url, key } = await uploadToR2(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder,
      category
    );

    const result = await pool.query(
      `INSERT INTO admin_images (url, key, nom, taille, type, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, url, key, nom, taille, type, category, uploaded_at as "uploadedAt"`,
      [url, key, req.file.originalname, req.file.size, req.file.mimetype, category]
    );

    res.status(201).json({ image: result.rows[0] });
  } catch (err) {
    console.error('POST /images/upload error:', err);
    res
      .status(err.status || 500)
      .json({ error: err.status ? err.message : 'Erreur upload: ' + err.message });
  }
});

// DELETE /api/images/:id
router.delete('/:id', async (req, res) => {
  try {
    const imgResult = await pool.query(
      `SELECT key FROM admin_images WHERE id = $1`,
      [req.params.id]
    );

    if (imgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: imgResult.rows[0].key,
      })
    );

    await pool.query(`DELETE FROM admin_images WHERE id = $1`, [req.params.id]);

    res.json({ message: 'Fichier supprimé' });
  } catch (err) {
    console.error('DELETE /images/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ⚠️ Middleware d'erreurs LOCAL au routeur — DOIT être en dernier.
// Convertit les erreurs Multer (taille, type refusé) en réponse JSON 400
// au lieu d'une 500 générique ou d'une page HTML.
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.warn('⚠️ Erreur Multer :', err.code, err.message);
    return res.status(400).json({
      error:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Fichier trop volumineux (max 10 Mo).'
          : `Erreur upload : ${err.message}`,
    });
  }
  if (err && err.message && /Type de fichier non autorisé/.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;