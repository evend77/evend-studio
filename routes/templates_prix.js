// routes/templates_prix.js
// e-Vend Studio — Gestion des prix par catégorie et par template
//
// Résolution du prix affiché pour un template :
//   1. Surcharge dans templates_prix (si prix_texte non NULL)
//   2. Défaut de sa catégorie dans groupes_prix
//   3. 'Gratuit' par défaut

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ─── GET /api/admin/templates-prix ────────────────────────────────────────────
// ADMIN — retourne les tables brutes (pour affichage/édition dans le dashboard)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [groupesRes, templatesRes] = await Promise.all([
      pool.query('SELECT * FROM groupes_prix ORDER BY groupe_id'),
      pool.query('SELECT * FROM templates_prix ORDER BY groupe_id, template_id'),
    ]);
    return res.json({ success: true, groupes: groupesRes.rows, templates: templatesRes.rows });
  } catch (err) {
    console.error('Erreur GET /api/admin/templates-prix:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/admin/templates-prix/groupe/:groupeId ──────────────────────────
// ADMIN — définir le prix par défaut d'une catégorie
router.put('/groupe/:groupeId', authenticateToken, isAdmin, async (req, res) => {
  const { groupeId } = req.params;
  const { prix_texte, prix_type } = req.body;

  if (!prix_texte || !prix_type) {
    return res.status(400).json({ success: false, message: 'prix_texte et prix_type sont requis.' });
  }
  const typesValides = ['gratuit', 'unique', 'abonnement', 'paliers'];
  if (!typesValides.includes(prix_type)) {
    return res.status(400).json({ success: false, message: 'prix_type invalide.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO groupes_prix (groupe_id, prix_texte, prix_type, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (groupe_id) DO UPDATE SET
         prix_texte = EXCLUDED.prix_texte,
         prix_type  = EXCLUDED.prix_type,
         updated_at = now()
       RETURNING *`,
      [groupeId, prix_texte.trim(), prix_type]
    );
    return res.json({ success: true, groupe: result.rows[0] });
  } catch (err) {
    console.error('Erreur PUT /api/admin/templates-prix/groupe:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/admin/templates-prix/template/:templateId ─────────────────────
// ADMIN — définir/modifier le prix d'un template spécifique (surcharge la catégorie)
router.put('/template/:templateId', authenticateToken, isAdmin, async (req, res) => {
  const { templateId } = req.params;
  const { groupe_id, prix_texte, prix_type, prix_paliers } = req.body;

  if (!prix_type) {
    return res.status(400).json({ success: false, message: 'prix_type est requis.' });
  }
  const typesValides = ['gratuit', 'unique', 'abonnement', 'paliers'];
  if (!typesValides.includes(prix_type)) {
    return res.status(400).json({ success: false, message: 'prix_type invalide.' });
  }
  if (prix_type === 'paliers' && (!Array.isArray(prix_paliers) || prix_paliers.length === 0)) {
    return res.status(400).json({ success: false, message: 'prix_paliers doit être un tableau non vide pour le type "paliers".' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO templates_prix (template_id, groupe_id, prix_texte, prix_type, prix_paliers, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (template_id) DO UPDATE SET
         groupe_id    = EXCLUDED.groupe_id,
         prix_texte   = EXCLUDED.prix_texte,
         prix_type    = EXCLUDED.prix_type,
         prix_paliers = EXCLUDED.prix_paliers,
         updated_at   = now()
       RETURNING *`,
      [
        templateId,
        groupe_id || null,
        prix_texte ? prix_texte.trim() : null,
        prix_type,
        prix_type === 'paliers' ? JSON.stringify(prix_paliers) : null,
      ]
    );
    return res.json({ success: true, template: result.rows[0] });
  } catch (err) {
    console.error('Erreur PUT /api/admin/templates-prix/template:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─── DELETE /api/admin/templates-prix/template/:templateId ──────────────────
// ADMIN — retirer la surcharge d'un template (il retombe sur le défaut de sa catégorie)
router.delete('/template/:templateId', authenticateToken, isAdmin, async (req, res) => {
  const { templateId } = req.params;
  try {
    await pool.query('DELETE FROM templates_prix WHERE template_id = $1', [templateId]);
    return res.json({ success: true, message: 'Surcharge retirée — le template hérite maintenant du prix de sa catégorie.' });
  } catch (err) {
    console.error('Erreur DELETE /api/admin/templates-prix/template:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;