const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db'); // Pour la base de donnees
require('dotenv').config();

// ── Client R2 ────────────────────────────────────────────────────────────────
const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId:     process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_PROFILS = process.env.R2_BUCKET_PROFILES; // public : profils.e-vend.ca (logos, bannières)
const BUCKET_CHAT    = process.env.R2_BUCKET_CHAT;     // privé : messagerie

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
    // 🔒 CORRIGÉ : aucune validation de type n'existait avant — n'importe
    // quel fichier pouvait être uploadé (pas juste des images), stocké
    // localement avec son extension d'origine préservée.
    fileFilter: function (req, file, cb) {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Fichier non autorisé. Formats acceptés : JPG, PNG, GIF, WEBP'));
    },
});

// ── Stockage messagerie / logo / bannière → R2 (reçu en mémoire puis envoyé) ──
const uploadMessagerie = multer({
    storage: multer.memoryStorage(),
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

// ── POST /api/upload — messagerie (images + PDF → R2) ────────────────────────
router.post('/', authenticateToken, uploadMessagerie.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

        const { type } = req.body;

        // Logo / bannière → bucket public (adresse https://profils.e-vend.ca/...).
        // Messagerie → bucket privé : on garde la clé seule, comme e-Vend (pas d'adresse publique).
        const estPublic = (type === 'banner' || type === 'logo');
        const bucket    = estPublic ? BUCKET_PROFILS : BUCKET_CHAT;
        if (!bucket) {
            console.error('❌ Bucket R2 non défini dans .env (R2_BUCKET_PROFILES / R2_BUCKET_CHAT)');
            return res.status(500).json({ error: 'Configuration R2 manquante' });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext    = path.extname(req.file.originalname).toLowerCase();
        const folder = type === 'banner' ? 'banners' : (type === 'logo' ? 'logos' : 'messagerie');
        const cle    = `studio/${folder}/msg-${uniqueSuffix}${ext}`;

        await s3Client.send(new PutObjectCommand({
            Bucket:      bucket,
            Key:         cle,
            Body:        req.file.buffer,
            ContentType: req.file.mimetype,
        }));

        const fileUrl = estPublic ? `https://profils.e-vend.ca/${cle}` : cle;

        // 🔒 CORRIGÉ : le vendeur_id venait du corps de la requête, jamais
        // vérifié contre l'utilisateur réellement connecté — n'importe quel
        // compte authentifié pouvait écraser la bannière/le logo d'un autre
        // vendeur en envoyant son ID à la place. On utilise maintenant
        // l'identité du token (req.user), sauf pour un admin qui peut agir
        // au nom d'un vendeur via le body (ex: écran d'administration).
        const vendeur_id = (req.user.role === 'admin' && req.body.vendeur_id)
            ? req.body.vendeur_id
            : req.user.id;

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
