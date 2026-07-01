const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db'); // Pour la base de donnees
require('dotenv').config();

// ── Client S3 ────────────────────────────────────────────────────────────────
const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'evend-messagerie-photo';

// ── Stockage blog (local, inchangé) ─────────────────────────────────────────
const storageBlog = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/blog');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadBlog = multer({
    storage: storageBlog,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Stockage messagerie → AWS S3 ─────────────────────────────────────────────
const uploadMessagerie = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: S3_BUCKET,
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname).toLowerCase();
            // Déterminer le dossier selon le type
            const folder = req.body.type === 'banner' ? 'banners' : (req.body.type === 'logo' ? 'logos' : 'messagerie');
            cb(null, `${folder}/msg-${uniqueSuffix}${ext}`);
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: function (req, file, cb) {
        const allowed = /jpeg|jpg|png|gif|webp|pdf/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Fichier non autorisé. Formats acceptés : JPG, PNG, GIF, WEBP, PDF'));
    },
});

// ── POST /api/upload/blog-image ───────────────────────────────────────────────
router.post('/blog-image', authenticateToken, uploadBlog.single('image'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Aucune image' });
        const imageUrl = `http://localhost:5000/uploads/blog/${req.file.filename}`;
        res.json({ success: true, url: imageUrl, path: `/uploads/blog/${req.file.filename}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── POST /api/upload — messagerie (images + PDF → S3) ────────────────────────
router.post('/', authenticateToken, uploadMessagerie.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
        
        const fileUrl = req.file.location;
        const { type, vendeur_id } = req.body;
        
        console.log('✅ Upload réussi - URL:', fileUrl);
        console.log('📦 Données reçues - type:', type, 'vendeur_id:', vendeur_id);
        
        // SI C'EST UNE BANNIÈRE OU UN LOGO, SAUVEGARDER DANS LA DB
        if (vendeur_id && (type === 'banner' || type === 'logo')) {
            const field = type === 'banner' ? 'banniere_url' : 'logo_url';
            
            console.log(`📝 Sauvegarde en DB: UPDATE vendeurs SET ${field} = '${fileUrl}' WHERE id = ${vendeur_id}`);
            
            const result = await db.query(
                `UPDATE vendeurs SET ${field} = $1 WHERE id = $2 RETURNING *`,
                [fileUrl, vendeur_id]
            );
            
            console.log('✅ DB mise à jour:', result.rows[0]?.id ? 'Succès' : 'Échec');
        }
        
        res.json({
            success: true,
            url: fileUrl,
            nom: req.file.originalname,
            type: req.file.mimetype,
        });
    } catch (error) {
        console.error('❌ Erreur upload:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
