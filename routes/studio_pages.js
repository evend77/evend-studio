// CHEMIN : routes/studio_pages.js
//
// GET    /api/studio/pages/:gestionnaireId/public         — toutes les pages actives (site public)
// GET    /api/studio/pages/:gestionnaireId/public/:slug   — une page publique par slug
// GET    /api/studio/pages/:gestionnaireId                — toutes les pages (dashboard gestionnaire)
// POST   /api/studio/pages/:gestionnaireId                — créer une nouvelle page
// GET    /api/studio/pages/:gestionnaireId/:slug          — lire une page (dashboard)
// PATCH  /api/studio/pages/:gestionnaireId/:slug          — modifier une page
// DELETE /api/studio/pages/:gestionnaireId/:slug          — supprimer une page
// PATCH  /api/studio/pages/:gestionnaireId/:slug/ordre    — réordonner

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const { nettoyerHtml } = require('../utils/sanitize');
const { authenticateToken } = require('../middleware/auth');
const sec = require('../services/studio_securite_inscription');

// Limites de taille (évite les contenus géants) — texte nettoyé : pas de balises dans les titres/descriptions
const txt = (v, max) => (typeof v === 'string' ? sec.nettoyerTexte(v, max) : '');

// ─── Helper propriétaire ──────────────────────────────────────────────────────
function verifierProprietaire(req, res) {
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  // 🔒 Le rôle compte : un jeton d'acheteur/commanditaire de même numéro n'a pas le droit de modifier ces pages
  if (req.user?.role !== 'gestionnaire' || parseInt(req.user?.id, 10) !== gestionnaireIdParam) {
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
    res.status(500).json({ error: 'Erreur serveur' });
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =============================================================================
// GET /api/studio/pages/:gestionnaireId
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =============================================================================
// POST /api/studio/pages/:gestionnaireId
// Créer une nouvelle page
// Body : { titre, contenu?, meta_description?, actif?, afficher_dans_menu? }
// =============================================================================
router.post('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  // 🔒 Avant : un titre qui n'était pas du texte (ex. un nombre) plantait hors du try → erreur non interceptée
  const B = req.body && typeof req.body === 'object' ? req.body : {};
  const { contenu, actif, afficher_dans_menu } = B;
  const titre = txt(B.titre, 200);
  const meta_description = txt(B.meta_description, 300);

  if (!titre) {
    return res.status(400).json({ error: 'Le titre est obligatoire.' });
  }
  if (contenu !== undefined && contenu !== null && (typeof contenu !== 'string' || contenu.length > 200000)) {
    return res.status(400).json({ error: 'Contenu invalide ou trop long.' });
  }

  const { gestionnaireId } = req.params;

  // Générer un slug unique pour ce vendeur
  let slug = genererSlug(titre);
  if (!slug) slug = 'page';

  // S'assurer que le slug est unique pour ce vendeur
  try {
    const existing = await pool.query(
      `SELECT slug FROM pages_gestionnaire WHERE gestionnaire_id = $1 AND slug LIKE $2`,
      [gestionnaireId, `${slug}%`]
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
        gestionnaireId,
        slug,
        titre,
        nettoyerHtml(contenu) ?? '',
        meta_description,
        actif !== false,
        afficher_dans_menu !== false,
      ]
    );

    res.status(201).json({ success: true, page: result.rows[0] });
  } catch (err) {
    console.error('POST /studio/pages/:gestionnaireId :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =============================================================================
// PATCH /api/studio/pages/:gestionnaireId/:slug
// Modifier une page
// Body : { titre?, contenu?, meta_description?, actif?, afficher_dans_menu? }
// =============================================================================
router.patch('/:slug', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const B = req.body && typeof req.body === 'object' ? req.body : {};
  const { contenu } = B;
  const titre = typeof B.titre === 'string' ? txt(B.titre, 200) : null;
  const meta_description = typeof B.meta_description === 'string' ? txt(B.meta_description, 300) : null;
  const actif = typeof B.actif === 'boolean' ? B.actif : null;
  const afficher_dans_menu = typeof B.afficher_dans_menu === 'boolean' ? B.afficher_dans_menu : null;
  const { gestionnaireId, slug } = req.params;
  if (contenu !== undefined && contenu !== null && (typeof contenu !== 'string' || contenu.length > 200000)) {
    return res.status(400).json({ error: 'Contenu invalide ou trop long.' });
  }

  try {
    const result = await pool.query(
      `UPDATE pages_gestionnaire
          SET titre              = COALESCE($1, titre),
              contenu            = COALESCE($2, contenu),
              meta_description   = COALESCE($3, meta_description),
              actif              = COALESCE($4, actif),
              afficher_dans_menu = COALESCE($5, afficher_dans_menu),
              updated_at         = NOW()
        WHERE gestionnaire_id = $6 AND slug = $7
        RETURNING *`,
      [
        titre || null,
        nettoyerHtml(contenu) ?? null,
        meta_description,
        actif,
        afficher_dans_menu,
        gestionnaireId,
        slug,
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ success: true, page: result.rows[0] });
  } catch (err) {
    console.error('PATCH /studio/pages/:gestionnaireId/:slug :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =============================================================================
// DELETE /api/studio/pages/:gestionnaireId/:slug
// Supprimer une page
// =============================================================================
router.delete('/:slug', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { gestionnaireId, slug } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM pages_gestionnaire WHERE gestionnaire_id = $1 AND slug = $2 RETURNING id`,
      [gestionnaireId, slug]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ success: true, message: 'Page supprimée.' });
  } catch (err) {
    console.error('DELETE /studio/pages/:gestionnaireId/:slug :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
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

  const { gestionnaireId, slug } = req.params;

  try {
    const result = await pool.query(
      `UPDATE pages_gestionnaire SET ordre = $1, updated_at = NOW()
        WHERE gestionnaire_id = $2 AND slug = $3
        RETURNING id, slug, ordre`,
      [ordre, gestionnaireId, slug]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Page introuvable.' });
    res.json({ success: true, page: result.rows[0] });
  } catch (err) {
    console.error('PATCH /studio/pages/:gestionnaireId/:slug/ordre :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;