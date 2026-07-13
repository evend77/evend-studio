// routes/sponsorsphotos.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin, isCommanditaire } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ── AWS S3 CONFIGURATION ──────────────────────────────────────
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_SPONSOR || 'evend-studio-sponsors-2026-296886269853-us-east-1-an';

// ── MULTER (upload vers S3) ──────────────────────────────────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG, WEBP ou GIF.'));
    }
  }
});

// ── UTILITAIRES ─────────────────────────────────────────────────
// Upload vers S3
async function uploadToS3(file, folder = 'sponsors') {
  const key = `${folder}/${uuidv4()}-${file.originalname}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  });
  await s3Client.send(command);
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

// Supprimer de S3
async function deleteFromS3(url) {
  if (!url) return;
  const baseUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/`;
  if (!url.startsWith(baseUrl)) return;
  const key = url.replace(baseUrl, '');
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
}

// ════════════════════════════════════════════════════════════════
// 📸 ROUTES PUBLIQUES (pour le modal)
// ════════════════════════════════════════════════════════════════

// GET — Récupérer toutes les photos sponsors (publiques)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        sp.id,
        sp.titre,
        sp.description,
        sp.url_image,
        sp.alt_text,
        sp.sponsor_id,
        s.nom AS sponsor_nom,
        s.logo AS sponsor_logo,
        s.site_web AS sponsor_site,
        sp.created_at
       FROM sponsor_photos sp
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE sp.active = true AND s.active = true
       ORDER BY sp.created_at DESC
       LIMIT 100`
    );

    const photos = result.rows.map(row => ({
      id: row.id,
      urls: {
        small: row.url_image,
        regular: row.url_image,
        full: row.url_image,
        thumb: row.url_image,
      },
      url_image: row.url_image,
      titre: row.titre,
      alt_description: row.alt_text || row.titre,
      user: {
        name: row.sponsor_nom,
        links: {
          html: row.sponsor_site || '#',
        }
      },
      sponsor_name: row.sponsor_nom,
      sponsor_logo: row.sponsor_logo,
      sponsor_id: row.sponsor_id,
      description: row.description,
      created_at: row.created_at,
    }));

    res.json({ photos, total: photos.length });
  } catch (error) {
    console.error('❌ Erreur récupération sponsors photos:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos sponsorisées' });
  }
});

// GET — Rechercher dans les photos sponsors (publique)
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    let sql = `
      SELECT 
        sp.id,
        sp.titre,
        sp.description,
        sp.url_image,
        sp.alt_text,
        sp.sponsor_id,
        s.nom AS sponsor_nom,
        s.logo AS sponsor_logo,
        s.site_web AS sponsor_site,
        sp.created_at
      FROM sponsor_photos sp
      JOIN sponsors s ON s.id = sp.sponsor_id
      WHERE sp.active = true AND s.active = true
    `;

    const params = [];
    if (query && query.trim() !== '') {
      sql += ` AND (sp.titre ILIKE $1 OR sp.description ILIKE $1 OR sp.alt_text ILIKE $1 OR s.nom ILIKE $1)`;
      params.push(`%${query.trim()}%`);
    }

    sql += ` ORDER BY sp.created_at DESC LIMIT 100`;

    const result = await pool.query(sql, params);

    const photos = result.rows.map(row => ({
      id: row.id,
      urls: {
        small: row.url_image,
        regular: row.url_image,
        full: row.url_image,
        thumb: row.url_image,
      },
      url_image: row.url_image,
      titre: row.titre,
      alt_description: row.alt_text || row.titre,
      user: {
        name: row.sponsor_nom,
        links: {
          html: row.sponsor_site || '#',
        }
      },
      sponsor_name: row.sponsor_nom,
      sponsor_logo: row.sponsor_logo,
      sponsor_id: row.sponsor_id,
      description: row.description,
      created_at: row.created_at,
    }));

    res.json({ photos, total: photos.length });
  } catch (error) {
    console.error('❌ Erreur recherche sponsors photos:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📸 ROUTES ADMIN (pour gérer les photos sponsors)
// ════════════════════════════════════════════════════════════════

// POST — Ajouter une photo sponsor (admin)
router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { sponsor_id, titre, description, alt_text, url_original } = req.body;

    if (!sponsor_id) {
      return res.status(400).json({ error: 'Le sponsor_id est requis' });
    }

    const sponsorCheck = await pool.query('SELECT id, nom FROM sponsors WHERE id = $1 AND active = true', [sponsor_id]);
    if (sponsorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé ou inactif' });
    }

    let url_image = null;
    if (req.file) {
      url_image = await uploadToS3(req.file, 'sponsors');
    } else if (url_original) {
      url_image = url_original;
    } else {
      return res.status(400).json({ error: 'Une image ou une URL est requise' });
    }

    const result = await pool.query(
      `INSERT INTO sponsor_photos 
       (sponsor_id, titre, description, url_image, url_original, alt_text, created_at, active)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)
       RETURNING *`,
      [sponsor_id, titre || null, description || null, url_image, url_original || null, alt_text || null]
    );

    res.status(201).json({
      success: true,
      message: 'Photo sponsor ajoutée avec succès',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur ajout photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la photo' });
  }
});

// PUT — Modifier une photo sponsor (admin)
router.put('/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsor_id, titre, description, alt_text, url_original, active } = req.body;

    const existing = await pool.query('SELECT * FROM sponsor_photos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    let url_image = existing.rows[0].url_image;
    if (req.file) {
      await deleteFromS3(url_image);
      url_image = await uploadToS3(req.file, 'sponsors');
    } else if (url_original) {
      url_image = url_original;
    }

    const result = await pool.query(
      `UPDATE sponsor_photos SET
        sponsor_id = COALESCE($1, sponsor_id),
        titre = COALESCE($2, titre),
        description = COALESCE($3, description),
        url_image = COALESCE($4, url_image),
        url_original = COALESCE($5, url_original),
        alt_text = COALESCE($6, alt_text),
        active = COALESCE($7, active),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        sponsor_id || existing.rows[0].sponsor_id,
        titre || existing.rows[0].titre,
        description !== undefined ? description : existing.rows[0].description,
        url_image,
        url_original || existing.rows[0].url_original,
        alt_text !== undefined ? alt_text : existing.rows[0].alt_text,
        active !== undefined ? active : existing.rows[0].active,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Photo sponsor modifiée avec succès',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur modification photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// DELETE — Supprimer une photo sponsor (admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM sponsor_photos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    await deleteFromS3(existing.rows[0].url_image);
    await pool.query('DELETE FROM sponsor_photos WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Photo sponsor supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ════════════════════════════════════════════════════════════════
// 📸 ROUTES SPONSOR (pour les commanditaires eux-mêmes)
// ════════════════════════════════════════════════════════════════

// POST — Uploader une photo (sponsor)
router.post('/sponsor/upload', authenticateToken, isCommanditaire, upload.single('image'), async (req, res) => {
  try {
    const { titre, description, alt_text } = req.body;
    const sponsor_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Une image est requise' });
    }

    // Vérifier le quota
    const quotaCheck = await pool.query(
      `SELECT COUNT(*) as count FROM sponsor_photos 
       WHERE sponsor_id = $1 AND active = true`,
      [sponsor_id]
    );

    const sponsorResult = await pool.query(
      'SELECT forfait, type_sponsor FROM sponsors WHERE id = $1',
      [sponsor_id]
    );

    const type_sponsor = sponsorResult.rows[0]?.type_sponsor || 'photos';
    if (type_sponsor === 'pub') {
      return res.status(403).json({ 
        error: 'Votre compte est de type "Publicité". Vous ne pouvez pas uploader de photos.' 
      });
    }

    let maxPhotos = 10;
    const forfait = sponsorResult.rows[0]?.forfait || 'basique';
    if (forfait === 'standard') maxPhotos = 50;
    if (forfait === 'premium') maxPhotos = 200;

    if (parseInt(quotaCheck.rows[0].count) >= maxPhotos) {
      return res.status(403).json({ 
        error: `Vous avez atteint votre quota de ${maxPhotos} photos actives.`
      });
    }

    // Upload vers S3
    const url_image = await uploadToS3(req.file, `sponsors/${sponsor_id}`);

    const result = await pool.query(
      `INSERT INTO sponsor_photos 
       (sponsor_id, titre, description, url_image, alt_text, created_at, active)
       VALUES ($1, $2, $3, $4, $5, NOW(), true)
       RETURNING *`,
      [sponsor_id, titre || null, description || null, url_image, alt_text || null]
    );

    res.status(201).json({
      success: true,
      message: 'Photo uploadée avec succès',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur upload photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' });
  }
});

// GET — Récupérer les photos du sponsor connecté
router.get('/sponsor/photos', authenticateToken, isCommanditaire, async (req, res) => {
  try {
    const sponsor_id = req.user.id;

    const result = await pool.query(
      `SELECT 
        id, titre, description, url_image, alt_text, active, created_at
       FROM sponsor_photos
       WHERE sponsor_id = $1
       ORDER BY created_at DESC`,
      [sponsor_id]
    );

    const photos = result.rows.map(row => ({
      id: row.id,
      url_image: row.url_image,
      titre: row.titre,
      description: row.description,
      alt_text: row.alt_text,
      active: row.active,
      created_at: row.created_at,
      urls: {
        small: row.url_image,
        regular: row.url_image,
        full: row.url_image,
        thumb: row.url_image,
      }
    }));

    res.json({ photos, total: photos.length });
  } catch (error) {
    console.error('❌ Erreur récupération photos sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos' });
  }
});

// DELETE — Supprimer une photo (sponsor)
router.delete('/sponsor/photos/:id', authenticateToken, isCommanditaire, async (req, res) => {
  try {
    const { id } = req.params;
    const sponsor_id = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM sponsor_photos WHERE id = $1 AND sponsor_id = $2',
      [id, sponsor_id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    await deleteFromS3(existing.rows[0].url_image);
    await pool.query('DELETE FROM sponsor_photos WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Photo supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;