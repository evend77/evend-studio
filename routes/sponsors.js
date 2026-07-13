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

// POST — Inscription d'un nouveau sponsor
router.post('/inscription', async (req, res) => {
  try {
    const { 
      nom, 
      email, 
      mot_de_passe, 
      site_web, 
      description, 
      forfait = 'basique',
      type_sponsor = 'photos'
    } = req.body;

    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    }
    if (mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    if (!['photos', 'pub', 'both'].includes(type_sponsor)) {
      return res.status(400).json({ error: 'Type de sponsor invalide' });
    }

    const existing = await pool.query('SELECT id FROM sponsors WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

    const result = await pool.query(
      `INSERT INTO sponsors 
       (nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING id, nom, email, site_web, description, forfait, type_sponsor, active, created_at`,
      [nom.trim(), email.toLowerCase().trim(), hashedPassword, site_web || null, description || null, forfait, type_sponsor]
    );

    const sponsor = result.rows[0];

    const token = jwt.sign(
      { id: sponsor.id, email: sponsor.email, role: 'commanditaire' },
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

    const result = await pool.query(
      `SELECT id, nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, created_at
       FROM sponsors WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const sponsor = result.rows[0];

    const validPassword = await bcrypt.compare(mot_de_passe, sponsor.mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!sponsor.active) {
      return res.status(403).json({ error: 'Votre compte a été désactivé. Contactez le support.' });
    }

    const token = jwt.sign(
      { id: sponsor.id, email: sponsor.email, role: 'commanditaire' },
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
// 🔐 ROUTES PROTÉGÉES
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

    const result = await pool.query(
      'SELECT mot_de_passe FROM sponsors WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    const validPassword = await bcrypt.compare(ancien_mot_de_passe, result.rows[0].mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

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

    const check = await pool.query('SELECT id FROM sponsors WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    await pool.query('DELETE FROM sponsor_photos WHERE sponsor_id = $1', [id]);
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