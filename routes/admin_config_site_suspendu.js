// routes/admin_config_site_suspendu.js
// GET  /api/admin/config/page-maintenance/public  — lecture publique (sans auth)
// GET  /api/admin/config/page-maintenance         — lire la config (admin)
// PUT  /api/admin/config/page-maintenance         — mettre à jour la config (admin)
// POST /api/admin/config/page-maintenance/image   — uploader une image vers S3 (admin)

const express  = require('express');
const router   = express.Router();
const pool     = require('../db');
const multer   = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ─── S3 (même config que admin_config_404.js) ────────────────────────────────
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
    fileFilter: (_req, file, cb) => {
        const ok = /^image\/(jpeg|png|gif|webp|svg\+xml)$/i.test(file.mimetype);
        cb(ok ? null : new Error('Fichier non supporté. Accepté : JPG, PNG, GIF, WebP, SVG.'), ok);
    },
});

const DEFAUTS = {
    titre:        'Site en maintenance',
    sous_titre:   "Nous effectuons présentement des travaux de maintenance. Merci de revenir un peu plus tard.",
    texte_bouton: '',
    url_bouton:   '',
    image_url:    '',
};

// =============================================================================
// GET /api/admin/config/page-maintenance/public
// Lecture publique — appelée par SiteMaintenance.tsx sans authentification
// =============================================================================
router.get('/public', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT titre, sous_titre, texte_bouton, url_bouton, image_url FROM config_page_maintenance WHERE id = 1'
        );
        if (result.rows.length === 0) return res.json(DEFAUTS);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('GET /admin/config/page-maintenance/public:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// GET /api/admin/config/page-maintenance
// Lecture de la config pour le dashboard admin
// =============================================================================
router.get('/', authenticateToken, isAdmin, async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT titre, sous_titre, texte_bouton, url_bouton, image_url, updated_at FROM config_page_maintenance WHERE id = 1'
        );
        if (result.rows.length === 0) {
            const ins = await pool.query('INSERT INTO config_page_maintenance DEFAULT VALUES RETURNING *');
            return res.json(ins.rows[0]);
        }
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.json(result.rows[0]);
    } catch (err) {
        console.error('GET /admin/config/page-maintenance:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// PUT /api/admin/config/page-maintenance
// Body : { titre, sous_titre, texte_bouton, url_bouton, image_url }
// ⚠️ Contrairement à la 404, le bouton est optionnel ici — une page "site
// en maintenance" n'a pas toujours d'action utile à proposer au visiteur.
// =============================================================================
router.put('/', authenticateToken, isAdmin, async (req, res) => {
    const { titre, sous_titre, texte_bouton, url_bouton, image_url } = req.body;

    if (!titre || !sous_titre) {
        return res.status(400).json({ error: 'Le titre et le sous-titre sont obligatoires.' });
    }
    if (url_bouton) {
        try { new URL(url_bouton); } catch {
            return res.status(400).json({ error: "L'URL du bouton est invalide." });
        }
    }

    try {
        const result = await pool.query(`
            INSERT INTO config_page_maintenance (id, titre, sous_titre, texte_bouton, url_bouton, image_url, updated_at)
            VALUES (1, $1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE
            SET titre        = EXCLUDED.titre,
                sous_titre   = EXCLUDED.sous_titre,
                texte_bouton = EXCLUDED.texte_bouton,
                url_bouton   = EXCLUDED.url_bouton,
                image_url    = EXCLUDED.image_url,
                updated_at   = NOW()
            RETURNING *
        `, [titre.trim(), sous_titre.trim(), (texte_bouton || '').trim(), (url_bouton || '').trim(), (image_url || '').trim()]);

        res.json({ success: true, config: result.rows[0] });
    } catch (err) {
        console.error('PUT /admin/config/page-maintenance:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// POST /api/admin/config/page-maintenance/image
// Upload image vers S3 — retourne { image_url }
// =============================================================================
router.post('/image', authenticateToken, isAdmin, (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Fichier trop lourd (max 2 Mo).' });
            }
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier reçu.' });
        }
        try {
            const { buffer, mimetype, originalname } = req.file;
            const ext   = (originalname.split('.').pop() || 'jpg').toLowerCase();
            const s3Key = `config/pagemaintenance/pagemaintenance_${Date.now()}.${ext}`;

            await s3.send(new PutObjectCommand({
                Bucket: BUCKET, Key: s3Key, Body: buffer, ContentType: mimetype,
            }));

            const imageUrl = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${s3Key}`;
            console.log(`🖼️ Image "site en maintenance" uploadée sur S3: ${imageUrl}`);
            res.json({ success: true, image_url: imageUrl });
        } catch (s3err) {
            console.error('❌ Erreur S3 upload page maintenance:', s3err.message);
            res.status(500).json({ error: s3err.message });
        }
    });
});

module.exports = router;