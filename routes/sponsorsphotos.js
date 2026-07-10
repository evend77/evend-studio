// routes/sponsorsphotos.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ── CONFIGURATION MULTER ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/sponsors');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

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

// ── MIDDLEWARE ──────────────────────────────────────────────────
const verifierAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ════════════════════════════════════════════════════════════════
// 📸 ROUTES PUBLIQUES (pour le modal)
// ════════════════════════════════════════════════════════════════

// GET — Récupérer toutes les photos sponsors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        sp.id,
        sp.titre,
        sp.description,
        sp.url_image,
        sp.url_original,
        sp.alt_text,
        sp.sponsor_id,
        s.nom AS sponsor_nom,
        s.logo AS sponsor_logo,
        s.site_web AS sponsor_site,
        sp.created_at,
        sp.active
       FROM sponsor_photos sp
       JOIN sponsors s ON s.id = sp.sponsor_id
       WHERE sp.active = true AND s.active = true
       ORDER BY sp.created_at DESC
       LIMIT 100`
    );

    // Formater pour correspondre à l'interface Unsplash
    const photos = result.rows.map(row => ({
      id: row.id,
      urls: {
        small: row.url_image,
        regular: row.url_original || row.url_image,
        full: row.url_original || row.url_image,
        thumb: row.url_image,
      },
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

// GET — Rechercher dans les photos sponsors
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    let sql = `
      SELECT 
        sp.id,
        sp.titre,
        sp.description,
        sp.url_image,
        sp.url_original,
        sp.alt_text,
        sp.sponsor_id,
        s.nom AS sponsor_nom,
        s.logo AS sponsor_logo,
        s.site_web AS sponsor_site,
        sp.created_at,
        sp.active
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
        regular: row.url_original || row.url_image,
        full: row.url_original || row.url_image,
        thumb: row.url_image,
      },
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
// 🔐 ROUTES ADMIN (pour gérer les photos sponsors)
// ════════════════════════════════════════════════════════════════

// POST — Ajouter une photo sponsor
router.post('/', authenticateToken, verifierAdmin, upload.single('image'), async (req, res) => {
  try {
    const { sponsor_id, titre, description, alt_text, url_original } = req.body;

    if (!sponsor_id) {
      return res.status(400).json({ error: 'Le sponsor_id est requis' });
    }

    // Vérifier que le sponsor existe
    const sponsorCheck = await pool.query('SELECT id, nom FROM sponsors WHERE id = $1 AND active = true', [sponsor_id]);
    if (sponsorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé ou inactif' });
    }

    // Si une image est uploadée
    let url_image = null;
    if (req.file) {
      url_image = `/uploads/sponsors/${req.file.filename}`;
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

// PUT — Modifier une photo sponsor
router.put('/:id', authenticateToken, verifierAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { sponsor_id, titre, description, alt_text, url_original, active } = req.body;

    // Récupérer la photo existante
    const existing = await pool.query('SELECT * FROM sponsor_photos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    let url_image = existing.rows[0].url_image;
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (url_image && url_image.startsWith('/uploads/sponsors/')) {
        const oldPath = path.join(__dirname, '..', url_image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      url_image = `/uploads/sponsors/${req.file.filename}`;
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

// DELETE — Supprimer une photo sponsor
router.delete('/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la photo
    const existing = await pool.query('SELECT * FROM sponsor_photos WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée' });
    }

    // Supprimer le fichier si c'est un upload local
    const url_image = existing.rows[0].url_image;
    if (url_image && url_image.startsWith('/uploads/sponsors/')) {
      const filePath = path.join(__dirname, '..', url_image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

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

module.exports = router;