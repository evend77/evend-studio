// routes/uploadAvis.js
// Upload des photos pour les avis produits (acheteur → S3)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { authenticateToken, isAcheteur } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

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

// Client S3 - IDENTIQUE à upload_image.js (us-east-1 hardcodé)
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region: 'us-east-1',  // ← FORCÉ à us-east-1 comme dans upload_image.js
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Supprimer une photo de S3 à partir de son URL
 * @param {string} photoUrl - URL complète de la photo sur S3
 */
const deletePhotoFromS3 = async (photoUrl) => {
  try {
    if (!photoUrl || !BUCKET) return false;
    
    // Extraire la clé (key) de l'URL
    const match = photoUrl.match(/\.amazonaws\.com\/(.+)$/);
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
    console.log(`🗑️ Photo supprimée de S3: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression S3:', error.message);
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
 * Retourne l'URL publique S3
 */
router.post('/upload-photo', authenticateToken, isAcheteur, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune photo fournie' });
    }

    if (!BUCKET) {
      console.error('❌ AWS_S3_BUCKET non défini dans .env');
      return res.status(500).json({ success: false, message: 'Configuration S3 manquante' });
    }

    const acheteurId = req.user.id;
    const timestamp = Date.now();
    const randomString = uuidv4();
    const extension = req.file.mimetype.split('/')[1];
    const key = `avis-produits/${acheteurId}/${timestamp}_${randomString}.${extension}`;

    console.log(`📸 Upload S3: ${key} (${req.file.size} bytes)`);

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    });

    await s3.send(command);

    // URL avec us-east-1 forcé (comme dans upload_image.js)
    const url = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${key}`;
    
    console.log(`✅ Photo uploadée: ${url}`);
    
    res.json({ 
      success: true, 
      url,
      message: 'Photo uploadée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur upload S3:', error.message);
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