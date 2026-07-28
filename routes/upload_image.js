// backend/routes/upload_image.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { authenticateToken, isVendeur } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { verifierTypeFichier } = require('../utils/verifierTypeFichier');

const BUCKET = process.env.AWS_S3_BUCKET;

// us-east-1 hardcodé — c'est la région du bucket evend-ca-storage-2026
const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seuls les fichiers image sont acceptés'), false);
  }
});

router.post('/', authenticateToken, isVendeur, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier image fourni' });
    }

    const { buffer, mimetype, originalname } = req.file;

    // 🔒 Vérification du VRAI contenu du fichier (magic bytes) — le
    // fileFilter ci-dessus ne regarde que le Content-Type déclaré par le
    // client, qui peut être falsifié. On confirme ici que le fichier est
    // réellement une image du bon type, peu importe ce qu'il prétend être.
    const verif = await verifierTypeFichier(buffer, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    if (!verif.ok) {
      console.warn(`⚠️ Upload rejeté : contenu réel ne correspond pas à une image autorisée (détecté: ${verif.mimeDetecte || 'inconnu'})`);
      return res.status(400).json({ success: false, message: 'Le fichier envoyé n\'est pas une image valide.' });
    }

    const vendeurId = req.user.id;
    console.log(`📸 Upload image reçu: ${originalname} (${mimetype}, ${buffer.length} bytes)`);

    const ext   = verif.extensionDetectee; // extension réelle détectée, pas celle du nom de fichier
    const s3Key = `produits/${vendeurId}/${uuidv4()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         s3Key,
      Body:        buffer,
      ContentType: verif.mimeDetecte,
    }));

    const imageUrl = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${s3Key}`;
    console.log(`✅ Image uploadée sur S3: ${imageUrl}`);

    return res.json({ success: true, image_url: imageUrl, filename: originalname });

  } catch (error) {
    console.error('❌ Erreur /api/upload-image:', error.message);
    if (error.$metadata) console.error('   HTTP status:', error.$metadata.httpStatusCode);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;