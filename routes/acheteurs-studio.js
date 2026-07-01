// routes/acheteurs-studio.js
// e-Vend Studio — Gestion des acheteurs par site

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025';

// ─── Helper token acheteur ────────────────────────────────────────────────────
function genererTokenAcheteur(acheteur) {
  return jwt.sign(
    { id: acheteur.id, email: acheteur.email, site_id: acheteur.site_id, role: 'acheteur' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// ─── POST /api/acheteurs-studio/inscription ───────────────────────────────────
router.post('/inscription', async (req, res) => {
  const { site_id, prenom, nom, email, mot_de_passe, telephone } = req.body;
  if (!site_id || !nom || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }
  try {
    const existe = await pool.query(
      'SELECT id FROM acheteurs_studio WHERE site_id = $1 AND email = $2',
      [site_id, email.toLowerCase()]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);
    const siteInfo = await pool.query('SELECT vendeur_id FROM sites WHERE id = $1', [site_id]);

    const result = await pool.query(
      `INSERT INTO acheteurs_studio (site_id, vendeur_id, prenom, nom, email, mot_de_passe, telephone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, prenom, nom, email, site_id, statut`,
      [site_id, siteInfo.rows[0]?.gestionnaire_id, prenom || null, nom, email.toLowerCase(), hash, telephone || null]
    );

    const acheteur = result.rows[0];
    const token = genererTokenAcheteur(acheteur);
    res.status(201).json({ success: true, token, acheteur });
  } catch (err) {
    console.error('POST inscription acheteur:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── POST /api/acheteurs-studio/connexion ────────────────────────────────────
router.post('/connexion', async (req, res) => {
  const { site_id, email, mot_de_passe } = req.body;
  if (!site_id || !email || !mot_de_passe) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM acheteurs_studio WHERE site_id = $1 AND email = $2',
      [site_id, email.toLowerCase()]
    );
    if (!result.rows.length) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const acheteur = result.rows[0];
    if (acheteur.statut === 'suspendu') {
      return res.status(403).json({ message: 'Votre compte est suspendu.' });
    }
    const valide = await bcrypt.compare(mot_de_passe, acheteur.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    await pool.query(
      'UPDATE acheteurs_studio SET derniere_connexion = NOW() WHERE id = $1',
      [acheteur.id]
    );

    const token = genererTokenAcheteur(acheteur);
    res.json({
      success: true, token,
      acheteur: { id: acheteur.id, prenom: acheteur.prenom, nom: acheteur.nom, email: acheteur.email, site_id: acheteur.site_id }
    });
  } catch (err) {
    console.error('POST connexion acheteur:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── GET /api/acheteurs-studio/moi ───────────────────────────────────────────
router.get('/moi', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Non authentifié.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, prenom, nom, email, telephone, adresse, ville, province, code_postal, statut, created_at FROM acheteurs_studio WHERE id = $1',
      [payload.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Acheteur non trouvé.' });
    res.json(result.rows[0]);
  } catch {
    res.status(401).json({ message: 'Token invalide.' });
  }
});

// ─── GET /api/acheteurs-studio/mes-commandes ─────────────────────────────────
router.get('/mes-commandes', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Non authentifié.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      `SELECT id, produit_nom, variante, quantite, total, statut, created_at, stripe_payment_intent
       FROM commandes_studio WHERE acheteur_id = $1 ORDER BY created_at DESC`,
      [payload.id]
    );
    res.json({ commandes: result.rows });
  } catch {
    res.status(401).json({ message: 'Token invalide.' });
  }
});

// ─── GET /api/acheteurs-studio/vendeur — liste pour le vendeur ───────────────
router.get('/vendeur', authenticateToken, async (req, res) => {
  try {
    const siteResult = await pool.query('SELECT id FROM sites WHERE gestionnaire_id = $1', [req.user.id]);
    if (!siteResult.rows.length) return res.json({ acheteurs: [], total: 0 });
    const siteId = siteResult.rows[0].id;

    const result = await pool.query(
      `SELECT a.id, a.prenom, a.nom, a.email, a.telephone, a.statut,
              a.created_at, a.derniere_connexion,
              COUNT(c.id) as nb_commandes,
              COALESCE(SUM(c.total), 0) as total_achats
       FROM acheteurs_studio a
       LEFT JOIN commandes_studio c ON c.acheteur_id = a.id
       WHERE a.site_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [siteId]
    );
    res.json({ acheteurs: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET acheteurs gestionnaire:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/acheteurs-studio/:id/statut ────────────────────────────────────
router.put('/:id/statut', authenticateToken, async (req, res) => {
  const { statut } = req.body;
  if (!['actif', 'suspendu'].includes(statut)) return res.status(400).json({ message: 'Statut invalide.' });
  try {
    await pool.query(
      `UPDATE acheteurs_studio SET statut = $1
       WHERE id = $2 AND site_id IN (SELECT id FROM sites WHERE gestionnaire_id = $3)`,
      [statut, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── GET /api/acheteurs-studio/:id/commandes ─────────────────────────────────
router.get('/:id/commandes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM commandes_studio
       WHERE acheteur_id = $1
       AND site_id IN (SELECT id FROM sites WHERE gestionnaire_id = $2)
       ORDER BY created_at DESC`,
      [req.params.id, req.user.id]
    );
    res.json({ commandes: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;