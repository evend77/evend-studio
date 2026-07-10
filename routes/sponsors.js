// routes/sponsors.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

// ── MIDDLEWARE ──────────────────────────────────────────────────
const verifierAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ════════════════════════════════════════════════════════════════
// 🔓 ROUTES PUBLIQUES
// ════════════════════════════════════════════════════════════════

// POST — Inscription d'un nouveau sponsor (avec type_sponsor)
router.post('/inscription', async (req, res) => {
  try {
    const { 
      nom, 
      email, 
      mot_de_passe, 
      site_web, 
      description, 
      forfait = 'basique',
      type_sponsor = 'photos' // 'photos' | 'pub' | 'both'
    } = req.body;

    // Validation
    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    }
    if (mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    if (!['photos', 'pub', 'both'].includes(type_sponsor)) {
      return res.status(400).json({ error: 'Type de sponsor invalide' });
    }

    // Vérifier si l'email existe déjà
    const existing = await pool.query('SELECT id FROM sponsors WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

    // Créer le sponsor
    const result = await pool.query(
      `INSERT INTO sponsors 
       (nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING id, nom, email, site_web, description, forfait, type_sponsor, active, created_at`,
      [nom.trim(), email.toLowerCase().trim(), hashedPassword, site_web || null, description || null, forfait, type_sponsor]
    );

    const sponsor = result.rows[0];

    // Générer un token JWT
    const token = jwt.sign(
      { id: sponsor.id, email: sponsor.email, role: 'sponsor' },
      process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie !',
      token,
      sponsor: {
        id: sponsor.id,
        nom: sponsor.nom,
        email: sponsor.email,
        site_web: sponsor.site_web,
        description: sponsor.description,
        forfait: sponsor.forfait,
        type_sponsor: sponsor.type_sponsor,
        active: sponsor.active,
      }
    });
  } catch (error) {
    console.error('❌ Erreur inscription sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// POST — Connexion sponsor
router.post('/login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Vérifier si le sponsor existe
    const result = await pool.query(
      `SELECT id, nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, created_at
       FROM sponsors WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const sponsor = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(mot_de_passe, sponsor.mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier si le compte est actif
    if (!sponsor.active) {
      return res.status(403).json({ error: 'Votre compte a été désactivé. Contactez le support.' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: sponsor.id, email: sponsor.email, role: 'sponsor' },
      process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie !',
      token,
      sponsor: {
        id: sponsor.id,
        nom: sponsor.nom,
        email: sponsor.email,
        site_web: sponsor.site_web,
        description: sponsor.description,
        forfait: sponsor.forfait,
        type_sponsor: sponsor.type_sponsor,
        active: sponsor.active,
      }
    });
  } catch (error) {
    console.error('❌ Erreur login sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🔐 ROUTES PROTÉGÉES (authentification requise)
// ════════════════════════════════════════════════════════════════

// GET — Profil du sponsor connecté
router.get('/moi', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, email, site_web, description, logo, forfait, type_sponsor, active, created_at, updated_at
       FROM sponsors WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur profil sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// PUT — Mettre à jour le profil du sponsor
router.put('/moi', authenticateToken, async (req, res) => {
  try {
    const { nom, site_web, description, logo } = req.body;

    const result = await pool.query(
      `UPDATE sponsors SET
        nom = COALESCE($1, nom),
        site_web = COALESCE($2, site_web),
        description = COALESCE($3, description),
        logo = COALESCE($4, logo),
        updated_at = NOW()
       WHERE id = $5
       RETURNING id, nom, email, site_web, description, logo, forfait, type_sponsor, active`,
      [nom || null, site_web || null, description || null, logo || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour',
      sponsor: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour profil sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// PUT — Changer le mot de passe
router.put('/mot-de-passe', authenticateToken, async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }
    if (nouveau_mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    // Récupérer le mot de passe actuel
    const result = await pool.query(
      'SELECT mot_de_passe FROM sponsors WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const validPassword = await bcrypt.compare(ancien_mot_de_passe, result.rows[0].mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 12);

    await pool.query(
      'UPDATE sponsors SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur changement mot de passe sponsor:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// GET — Statistiques du sponsor
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Récupérer les stats des photos du sponsor
    const statsResult = await pool.query(
      `SELECT 
        sp.id as photo_id,
        sp.titre,
        COALESCE(SUM(ss.vue_count), 0) as vues,
        COALESCE(SUM(ss.selection_count), 0) as selections,
        COALESCE(SUM(ss.click_count), 0) as clics
       FROM sponsor_photos sp
       LEFT JOIN sponsor_photo_stats ss ON ss.photo_id = sp.id
       WHERE sp.sponsor_id = $1
       GROUP BY sp.id, sp.titre
       ORDER BY vues DESC`,
      [req.user.id]
    );

    // Total des stats
    const totalResult = await pool.query(
      `SELECT 
        COALESCE(SUM(vue_count), 0) as total_vues,
        COALESCE(SUM(selection_count), 0) as total_selections,
        COALESCE(SUM(click_count), 0) as total_clics
       FROM sponsor_photo_stats ss
       JOIN sponsor_photos sp ON sp.id = ss.photo_id
       WHERE sp.sponsor_id = $1`,
      [req.user.id]
    );

    res.json({
      stats: statsResult.rows,
      total: totalResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur stats sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// GET — Toutes les photos du sponsor
router.get('/photos', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        titre,
        description,
        url_image,
        url_original,
        alt_text,
        active,
        created_at
       FROM sponsor_photos
       WHERE sponsor_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const photos = result.rows.map(row => ({
      id: row.id,
      urls: {
        small: row.url_image,
        regular: row.url_original || row.url_image,
        full: row.url_original || row.url_image,
        thumb: row.url_image,
      },
      alt_description: row.alt_text || row.titre,
      titre: row.titre,
      description: row.description,
      active: row.active,
      created_at: row.created_at,
    }));

    res.json({ photos, total: photos.length });
  } catch (error) {
    console.error('❌ Erreur récupération photos sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des photos' });
  }
});

// POST — Upload d'une photo par le sponsor
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { titre, description, alt_text, url_image, url_original } = req.body;

    if (!url_image && !url_original) {
      return res.status(400).json({ error: 'Une URL d\'image est requise' });
    }

    // Vérifier le quota (nombre de photos actives)
    const quotaCheck = await pool.query(
      `SELECT COUNT(*) as count FROM sponsor_photos 
       WHERE sponsor_id = $1 AND active = true`,
      [req.user.id]
    );

    // Récupérer le forfait du sponsor
    const sponsorResult = await pool.query(
      'SELECT forfait, type_sponsor FROM sponsors WHERE id = $1',
      [req.user.id]
    );

    // Vérifier si le sponsor peut uploader des photos
    const type_sponsor = sponsorResult.rows[0]?.type_sponsor || 'photos';
    if (type_sponsor === 'pub') {
      return res.status(403).json({ 
        error: 'Votre compte est de type "Publicité". Vous ne pouvez pas uploader de photos.' 
      });
    }

    let maxPhotos = 10; // Basique
    const forfait = sponsorResult.rows[0]?.forfait || 'basique';
    if (forfait === 'standard') maxPhotos = 50;
    if (forfait === 'premium') maxPhotos = 200;

    if (parseInt(quotaCheck.rows[0].count) >= maxPhotos) {
      return res.status(403).json({ 
        error: `Vous avez atteint votre quota de ${maxPhotos} photos actives. Mettez à jour votre forfait pour plus.`
      });
    }

    const result = await pool.query(
      `INSERT INTO sponsor_photos 
       (sponsor_id, titre, description, url_image, url_original, alt_text, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
       RETURNING *`,
      [req.user.id, titre || null, description || null, url_image, url_original || null, alt_text || null]
    );

    res.status(201).json({
      success: true,
      message: 'Photo ajoutée avec succès',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur upload photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' });
  }
});

// PUT — Modifier une photo du sponsor
router.put('/photos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, description, alt_text, active } = req.body;

    // Vérifier que la photo appartient bien au sponsor
    const check = await pool.query(
      'SELECT id FROM sponsor_photos WHERE id = $1 AND sponsor_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée ou vous n\'avez pas les droits' });
    }

    const result = await pool.query(
      `UPDATE sponsor_photos SET
        titre = COALESCE($1, titre),
        description = COALESCE($2, description),
        alt_text = COALESCE($3, alt_text),
        active = COALESCE($4, active),
        updated_at = NOW()
       WHERE id = $5 AND sponsor_id = $6
       RETURNING *`,
      [titre || null, description || null, alt_text || null, active !== undefined ? active : null, id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Photo mise à jour',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la photo' });
  }
});

// DELETE — Supprimer une photo du sponsor
router.delete('/photos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que la photo appartient bien au sponsor
    const check = await pool.query(
      'SELECT id FROM sponsor_photos WHERE id = $1 AND sponsor_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Photo non trouvée ou vous n\'avez pas les droits' });
    }

    await pool.query(
      'DELETE FROM sponsor_photos WHERE id = $1 AND sponsor_id = $2',
      [id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Photo supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression photo sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la photo' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🔐 ROUTES ADMIN
// ════════════════════════════════════════════════════════════════

// GET — Liste de tous les sponsors (admin)
router.get('/admin/liste', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, nom, email, site_web, description, forfait, type_sponsor, active, 
        created_at, updated_at,
        (SELECT COUNT(*) FROM sponsor_photos WHERE sponsor_id = sponsors.id AND active = true) as photos_actives
       FROM sponsors
       ORDER BY created_at DESC`
    );

    res.json({ sponsors: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('❌ Erreur liste sponsors:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sponsors' });
  }
});

// PUT — Modifier un sponsor (admin)
router.put('/admin/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, site_web, description, forfait, type_sponsor, active } = req.body;

    const result = await pool.query(
      `UPDATE sponsors SET
        nom = COALESCE($1, nom),
        email = COALESCE($2, email),
        site_web = COALESCE($3, site_web),
        description = COALESCE($4, description),
        forfait = COALESCE($5, forfait),
        type_sponsor = COALESCE($6, type_sponsor),
        active = COALESCE($7, active),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [nom || null, email || null, site_web || null, description || null, forfait || null, type_sponsor || null, active !== undefined ? active : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    res.json({
      success: true,
      message: 'Sponsor mis à jour',
      sponsor: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur modification sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du sponsor' });
  }
});

// DELETE — Supprimer un sponsor (admin)
router.delete('/admin/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le sponsor existe
    const check = await pool.query('SELECT id FROM sponsors WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    // Supprimer les photos du sponsor
    await pool.query('DELETE FROM sponsor_photos WHERE sponsor_id = $1', [id]);
    // Supprimer le sponsor
    await pool.query('DELETE FROM sponsors WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Sponsor et toutes ses photos supprimés'
    });
  } catch (error) {
    console.error('❌ Erreur suppression sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du sponsor' });
  }
});

module.exports = router;