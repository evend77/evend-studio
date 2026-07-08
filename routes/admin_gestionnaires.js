// routes/admin_gestionnaires.js
// ============================================================
// e-Vend Studio — Administration des gestionnaires
// ============================================================
// Liste enrichie (jointure abonnement), notes internes,
// changement de statut, changement de mot de passe, impersonation.
// ============================================================

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const JWT_SECRET  = process.env.JWT_SECRET  || 'evend-studio-secret-change-en-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// ─────────────────────────────────────────────────────────────
// GET /api/admin/gestionnaires
// Liste tous les gestionnaires avec leur abonnement (statut, essai, période)
// ─────────────────────────────────────────────────────────────
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.id, g.nom, g.email, g.nom_boutique, g.plan, g.statut,
        g.template_actif, g.telephone, g.created_at,
        COALESCE(g.two_factor_enabled, false) AS two_factor_enabled,
        a.statut       AS abo_statut,
        a.essai_fin    AS essai_fin,
        a.periode_fin  AS periode_fin,
        a.forfait_id   AS forfait_id,
        f.nom          AS forfait_nom,
        COALESCE(n.nb_notes, 0) AS nb_notes
      FROM gestionnaires g
      LEFT JOIN LATERAL (
        SELECT * FROM abonnements_studio a2
        WHERE a2.gestionnaire_id = g.id
        ORDER BY a2.created_at DESC LIMIT 1
      ) a ON true
      LEFT JOIN forfaits_studio f ON f.id = a.forfait_id
      LEFT JOIN (
        SELECT gestionnaire_id, COUNT(*) AS nb_notes
        FROM notes_gestionnaire GROUP BY gestionnaire_id
      ) n ON n.gestionnaire_id = g.id
      ORDER BY g.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET /api/admin/gestionnaires:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/gestionnaires/:id/statut
// Change le statut du compte (actif, suspendu, etc.)
// ─────────────────────────────────────────────────────────────
router.put('/:id/statut', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const { statut } = req.body;
    if (!statut) return res.status(400).json({ error: 'Statut requis.' });

    await pool.query(`UPDATE gestionnaires SET statut = $1, updated_at = NOW() WHERE id = $2`, [statut, gestionnaireId]);

    pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['CHANGEMENT_STATUT_GESTIONNAIRE', req.user.email || req.user.id,
       JSON.stringify({ gestionnaire_id: gestionnaireId, nouveau_statut: statut }), 'info']
    ).catch(() => {});

    res.json({ success: true, statut });
  } catch (err) {
    console.error('❌ PUT /:id/statut:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/gestionnaires/:id/plan
// Change le plan d'un gestionnaire (ex: gratuit, pro, etc.)
// Équivalent de l'ancienne route vestige de server.js, recréée ici
// par prudence au cas où un écran existant l'appelle encore.
// ─────────────────────────────────────────────────────────────
router.put('/:id/plan', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ error: 'Plan requis.' });

    await pool.query(`UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2`, [plan, gestionnaireId]);

    pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['CHANGEMENT_PLAN_GESTIONNAIRE', req.user.email || req.user.id,
       JSON.stringify({ gestionnaire_id: gestionnaireId, nouveau_plan: plan }), 'info']
    ).catch(() => {});

    res.json({ success: true, plan });
  } catch (err) {
    console.error('❌ PUT /:id/plan:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/gestionnaires/:id/mot-de-passe
// Change le mot de passe d'un gestionnaire (action admin)
// ─────────────────────────────────────────────────────────────
router.put('/:id/mot-de-passe', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const { nouveau_mot_de_passe } = req.body;
    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query(`UPDATE gestionnaires SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2`, [hash, gestionnaireId]);

    pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['CHANGEMENT_MDP_GESTIONNAIRE_ADMIN', req.user.email || req.user.id,
       JSON.stringify({ gestionnaire_id: gestionnaireId }), 'warning']
    ).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error('❌ PUT /:id/mot-de-passe:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/gestionnaires/:id
// Supprime définitivement un gestionnaire (cascade sur ses données)
// ─────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    await pool.query(`DELETE FROM gestionnaires WHERE id = $1`, [gestionnaireId]);

    pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['SUPPRESSION_GESTIONNAIRE_ADMIN', req.user.email || req.user.id,
       JSON.stringify({ gestionnaire_id: gestionnaireId }), 'warning']
    ).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/gestionnaires/:id/2fa
// Active/désactive la F2A pour un gestionnaire (contrôle admin)
// ─────────────────────────────────────────────────────────────
router.put('/:id/2fa', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const { enabled } = req.body;

    await pool.query(
      `UPDATE gestionnaires SET two_factor_enabled = $1, updated_at = NOW() WHERE id = $2`,
      [!!enabled, gestionnaireId]
    );

    pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['TOGGLE_F2A_GESTIONNAIRE', req.user.email || req.user.id,
       JSON.stringify({ gestionnaire_id: gestionnaireId, enabled: !!enabled }), 'info']
    ).catch(() => {});

    res.json({ success: true, enabled: !!enabled });
  } catch (err) {
    console.error('❌ PUT /:id/2fa:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/gestionnaires/:id/notes
// Liste les notes internes d'un gestionnaire
// ─────────────────────────────────────────────────────────────
router.get('/:id/notes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const result = await pool.query(
      `SELECT id, auteur, contenu, created_at AS date_creation
       FROM notes_gestionnaire WHERE gestionnaire_id = $1 ORDER BY created_at ASC`,
      [gestionnaireId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET /:id/notes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/gestionnaires/:id/notes
// Ajoute une note interne
// ─────────────────────────────────────────────────────────────
router.post('/:id/notes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const { contenu, auteur } = req.body;
    if (!contenu || !contenu.trim()) return res.status(400).json({ error: 'Contenu requis.' });

    const result = await pool.query(
      `INSERT INTO notes_gestionnaire (gestionnaire_id, auteur, contenu)
       VALUES ($1, $2, $3) RETURNING id, auteur, contenu, created_at AS date_creation`,
      [gestionnaireId, auteur || req.user.email || 'Admin', contenu.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ POST /:id/notes:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/gestionnaires/notes/:noteId
// Supprime une note interne
// ─────────────────────────────────────────────────────────────
router.delete('/notes/:noteId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const noteId = parseInt(req.params.noteId);
    await pool.query(`DELETE FROM notes_gestionnaire WHERE id = $1`, [noteId]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /notes/:noteId:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/gestionnaires/:id/impersonate
// Génère un token gestionnaire valide pour que l'admin puisse
// accéder au dashboard "en tant que" ce gestionnaire.
// L'action est journalisée dans les audit_logs.
// ─────────────────────────────────────────────────────────────
router.post('/:id/impersonate', authenticateToken, isAdmin, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const gRes = await pool.query(
      `SELECT id, email, nom, plan, statut FROM gestionnaires WHERE id = $1`,
      [gestionnaireId]
    );
    if (!gRes.rows.length) return res.status(404).json({ error: 'Gestionnaire introuvable.' });
    const gestionnaire = gRes.rows[0];

    const token = jwt.sign(
      { id: gestionnaire.id, email: gestionnaire.email, role: 'gestionnaire', plan: gestionnaire.plan, impersonated_by: req.user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['IMPERSONATION_GESTIONNAIRE', req.user.email || req.user.id,
       JSON.stringify({ gestionnaire_id: gestionnaireId, gestionnaire_email: gestionnaire.email }), 'warning']
    ).catch(() => {});

    res.json({
      token,
      user: { id: gestionnaire.id, email: gestionnaire.email, nom: gestionnaire.nom, plan: gestionnaire.plan, statut: gestionnaire.statut, role: 'gestionnaire' },
    });
  } catch (err) {
    console.error('❌ POST /:id/impersonate:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;