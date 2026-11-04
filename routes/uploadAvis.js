// routes/uploadAvis.js
// Upload des photos pour les avis produits (acheteur → R2)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { authenticateToken, isAcheteur } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { verifierTypeFichier } = require('../utils/verifierTypeFichier');

// Configuration multer (mémoire, pas de stockage disque)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max par photo
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP.'), false);
    }
  }
});

// Client R2
const BUCKET = process.env.R2_BUCKET_AVIS; // photos-avis-e-vend

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Supprimer une photo de R2 à partir de son URL
 * @param {string} photoUrl - URL complète de la photo (avis.e-vend.ca)
 */
const deletePhotoFromS3 = async (photoUrl) => {
  try {
    if (!photoUrl || !BUCKET) return false;

    // Extraire la clé (key) de l'URL — domaine personnalisé avis.e-vend.ca
    const match = photoUrl.match(/avis\.e-vend\.ca\/(.+)$/);
    const key = match ? match[1] : null;

    if (!key) {
      console.log(`⚠️ Impossible d'extraire la clé de: ${photoUrl}`);
      return false;
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    await s3.send(command);
    console.log(`🗑️ Photo supprimée de R2: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression R2:', error.message);
    return false;
  }
};

/**
 * Supprimer toutes les photos d'un avis depuis la BD
 * @param {object} db - Connexion à la base de données
 * @param {number} avisId - ID de l'avis
 */
const deleteAllPhotosFromAvis = async (db, avisId) => {
  try {
    const result = await db.query(
      `SELECT photos FROM avis_produits WHERE id = $1`,
      [avisId]
    );

    const photos = result.rows[0]?.photos || [];

    if (photos.length === 0) return 0;

    let deletedCount = 0;
    for (const photoUrl of photos) {
      const deleted = await deletePhotoFromS3(photoUrl);
      if (deleted) deletedCount++;
    }

    console.log(`🗑️ ${deletedCount}/${photos.length} photo(s) supprimées pour l'avis ${avisId}`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Erreur suppression photos avis:', error.message);
    return 0;
  }
};

/**
 * POST /api/avis-produits/upload-photo
 * Upload une seule photo pour un avis
 * Retourne l'URL publique R2
 */
router.post('/upload-photo', authenticateToken, isAcheteur, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune photo fournie' });
    }

    if (!BUCKET) {
      console.error('❌ R2_BUCKET_AVIS non défini dans .env');
      return res.status(500).json({ success: false, message: 'Configuration R2 manquante' });
    }

    // 🔒 Vérification du VRAI contenu du fichier (magic bytes) — le
    // fileFilter ne regarde que le Content-Type déclaré par le client,
    // qui peut être falsifié. Ces photos sont affichées publiquement sur
    // les fiches produits, vues par tous les visiteurs.
    const verif = await verifierTypeFichier(req.file.buffer, ['jpg', 'jpeg', 'png', 'webp']);
    if (!verif.ok) {
      console.warn(`⚠️ Upload rejeté (avis produit) : contenu réel ne correspond pas à une image autorisée (détecté: ${verif.mimeDetecte || 'inconnu'})`);
      return res.status(400).json({ success: false, message: 'Le fichier envoyé n\'est pas une image valide.' });
    }

    const acheteurId = req.user.id;
    const timestamp = Date.now();
    const randomString = uuidv4();
    const extension = verif.extensionDetectee; // extension réelle détectée, pas déclarée par le client
    const key = `studio/avis-produits/${acheteurId}/${timestamp}_${randomString}.${extension}`;

    console.log(`📸 Upload R2: ${key} (${req.file.size} bytes)`);

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: verif.mimeDetecte,
      // Pas d'ACL : R2 ne les supporte pas. L'accès public passe par le domaine
      // personnalisé du bucket (avis.e-vend.ca), pas par objet.
    });

    await s3.send(command);

    const url = `https://avis.e-vend.ca/${key}`;

    console.log(`✅ Photo uploadée: ${url}`);

    res.json({
      success: true,
      url,
      message: 'Photo uploadée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur upload R2:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'upload'
    });
  }
});

module.exports = {
  router,
  deletePhotoFromS3,
  deleteAllPhotosFromAvis
};