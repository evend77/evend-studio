// routes/studio_pages.js
//
// GET    /api/studio/pages/:gestionnaireId/public         — toutes les pages actives (site public)
// GET    /api/studio/pages/:gestionnaireId/public/:slug   — une page publique par slug
// GET    /api/studio/pages/:vendeurId                — toutes les pages (dashboard gestionnaire)
// POST   /api/studio/pages/:vendeurId                — créer une nouvelle page
// GET    /api/studio/pages/:gestionnaireId/:slug          — lire une page (dashboard)
// PATCH  /api/studio/pages/:gestionnaireId/:slug          — modifier une page
// DELETE /api/studio/pages/:gestionnaireId/:slug          — supprimer une page
// PATCH  /api/studio/pages/:gestionnaireId/:slug/ordre    — réordonner

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Helper propriétaire ──────────────────────────────────────────────────────
function verifierProprietaire(req, res) {
  console.log('🔍 req.user:', req.user);
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  if (parseInt(req.user?.id, 10) !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// ─── Helper slug ──────────────────────────────────────────────────────────────
function genererSlug(titre) {
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlever accents
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// =============================================================================
// GET /api/studio/pages/:gestionnaireId/public
// Toutes les pages actives du site du vendeur — sans auth
// =============================================================================
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, meta_description, ordre, updated_at
         FROM pages_gestionnaire
        WHERE gestionnaire_id = $1 AND actif = true
        ORDER BY ordre ASC, id ASC`,
      [req.params.gestionnaireId]
    );
    res.json({ pages: result.rows });
  } catch (err) {
    console.error('GET /studio/pages/:gestionnaireId/public :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/pages/:gestionnaireId/public/:slug
// Une page publique par slug — sans auth
// =============================================================================
router.get('/public/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, contenu, meta_description, updated_at
         FROM pages_gestionnaire
        WHERE gestionnaire_id = $1 AND slug = $2 AND actif = true`,
      [req.params.gestionnaireId, req.params.slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page introuvable.' });
    }
    res.json({ page: result.rows[0] });
  } catch (err) {
    console.error('GET /studio/pages/:gestionnaireId/public/:slug :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/pages/:vendeurId
// Toutes les pages du vendeur — dashboard (auth)
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT id, slug, titre, contenu, meta_description, actif, afficher_dans_menu, ordre, created_at, updated_at
         FROM pages_gestionnaire
        WHERE gestionnaire_id = $1
        ORDER BY ordre ASC, id ASC`,
      [req.params.gestionnaireId]
    );
    res.set('Cache-Control', 'no-store');
    res.json({ pages: result.rows });
  } catch (err) {
    console.error('GET /studio/pages/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/pages/:vendeurId
// Créer une nouvelle page
// Body : { titre, contenu?, meta_description?, actif?, afficher_dans_menu? }
// =============================================================================
router.post('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { titre, contenu, meta_description, actif, afficher_dans_menu } = req.body;

  if (!titre?.trim()) {
    return res.status(400).json({ error: 'Le titre est obligatoire.' });
  }

  const { gestionnaireId } = req.params;

  // Générer un slug unique pour ce vendeur
  let slug = genererSlug(titre);
  if (!slug) slug = 'page';

  // S'assurer que le slug est unique pour ce vendeur
  try {
    const existing = await pool.query(
      `SELECT slug FROM pages_gestionnaire WHERE gestionnaire_id = $1 AND slug LIKE $2`,
      [vendeurId, `${slug}%`]
    );
    if (existing.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const result = await pool.query(
      `INSERT INTO pages_gestionnaire
         (gestionnaire_id, slug, titre, contenu, meta_description, actif, afficher_dans_menu, ordre)
       VALUES ($1, $2, $3, $4, $5, $6, $7,
         (SELECT COALESCE(MAX(ordre), 0) + 1 FROM pages_gestionnaire WHERE gestionnaire_id = $1))
       RETURNING *`,
      [
        vendeurId,
        slug,
        titre.trim(),
        contenu ?? '',
        meta_description ?? '',
        actif !== false,
        afficher_dans_menu !== false,
      ]
    );

    res.status(201).json({ success: true, page: result.rows[0] });
  } catch (err) {
    console.error('POST /studio/pages/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/pages/:gestionnaireId/:slug
// Lire une page spécifique — dashboard (auth)
// =============================================================================
router.get('/:slug', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT * FROM pages_gestionnaire WHERE gestionnaire_id = $1 AND slug = $2`,
      [req.params.gestionnaireId, req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ page: result.rows[0] });
  } catch (err) {
    console.error('GET /studio/pages/:gestionnaireId/:slug :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PATCH /api/studio/pages/:gestionnaireId/:slug
// Modifier une page
// Body : { titre?, contenu?, meta_description?, actif?, afficher_dans_menu? }
// =============================================================================
router.patch('/:slug', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { titre, contenu, meta_description, actif, afficher_dans_menu } = req.body;
  const { vendeurId, slug } = req.params;

  try {
    const result = await pool.query(
      `UPDATE pages_vendeur
          SET titre              = COALESCE($1, titre),
              contenu            = COALESCE($2, contenu),
              meta_description   = COALESCE($3, meta_description),
              actif              = COALESCE($4, actif),
              afficher_dans_menu = COALESCE($5, afficher_dans_menu),
              updated_at         = NOW()
        WHERE gestionnaire_id = $6 AND slug = $7
        RETURNING *`,
      [
        titre?.trim() || null,
        contenu ?? null,
        meta_description ?? null,
        actif ?? null,
        afficher_dans_menu ?? null,
        vendeurId,
        slug,
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ success: true, page: result.rows[0] });
  } catch (err) {
    console.error('PATCH /studio/pages/:gestionnaireId/:slug :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/pages/:gestionnaireId/:slug
// Supprimer une page
// =============================================================================
router.delete('/:slug', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { vendeurId, slug } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM pages_gestionnaire WHERE gestionnaire_id = $1 AND slug = $2 RETURNING id`,
      [vendeurId, slug]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ success: true, message: 'Page supprimée.' });
  } catch (err) {
    console.error('DELETE /studio/pages/:gestionnaireId/:slug :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PATCH /api/studio/pages/:gestionnaireId/:slug/ordre
// Réordonner une page
// Body : { ordre }
// =============================================================================
router.patch('/:slug/ordre', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { ordre } = req.body;
  if (ordre === undefined || typeof ordre !== 'number') {
    return res.status(400).json({ error: 'ordre est requis et doit être un nombre.' });
  }

  const { vendeurId, slug } = req.params;

  try {
    const result = await pool.query(
      `UPDATE pages_vendeur SET ordre = $1, updated_at = NOW()
        WHERE vendeur_id = $2 AND slug = $3
        RETURNING id, slug, ordre`,
      [ordre, vendeurId, slug]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ success: true, page: result.rows[0] });
  } catch (err) {
    console.error('PATCH /studio/pages/:gestionnaireId/:slug/ordre :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;