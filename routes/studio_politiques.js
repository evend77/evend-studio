// routes/studio_politiques.js
//
// GET  /api/studio/politiques/:gestionnaireId/public   — toutes les politiques publiques du site
// GET  /api/studio/politiques/:gestionnaireId/public/:slug — une politique publique
// GET  /api/studio/politiques/:vendeurId          — lecture dashboard gestionnaire (auth)
// PUT  /api/studio/politiques/:gestionnaireId/:slug    — sauvegarder une politique (auth)

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── 6 politiques fixes pour chaque site vendeur ─────────────────────────────
const POLITIQUES_DEFAUT = [
  { slug: 'retour-remboursement', titre: 'Politique de retour et remboursement' },
  { slug: 'confidentialite',      titre: 'Politique de confidentialité'          },
  { slug: 'conditions-service',   titre: 'Conditions de service'                 },
  { slug: 'expedition',           titre: "Politique d'expédition"                },
  { slug: 'coordonnees',          titre: 'Coordonnées'                           },
  { slug: 'mentions-legales',     titre: 'Mentions légales'                      },
];

// ─── Helper : vérifie que le vendeur connecté accède à son propre site ────────
function verifierProprietaire(req, res) {
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  const gestionnaireIdToken = parseInt(req.user?.id, 10);
  if (gestionnaireIdToken !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// ─── Helper : récupère les politiques d'un vendeur et complète avec les défauts
async function chargerPolitiques(vendeurId) {
  const result = await pool.query(
    `SELECT slug, titre, contenu, updated_at
       FROM politiques_gestionnaire
      WHERE gestionnaire_id = $1
      ORDER BY id`,
    [gestionnaireId]
  );

  // On construit un map de ce qui existe en BD
  const enBd = {};
  result.rows.forEach(r => { enBd[r.slug] = r; });

  // On retourne les 6 politiques dans l'ordre, avec contenu vide si pas encore créée
  return POLITIQUES_DEFAUT.map(def => ({
    slug:       def.slug,
    titre:      enBd[def.slug]?.titre      ?? def.titre,
    contenu:    enBd[def.slug]?.contenu    ?? '',
    updated_at: enBd[def.slug]?.updated_at ?? null,
  }));
}

// =============================================================================
// GET /api/studio/politiques/:gestionnaireId/public
// Toutes les politiques publiques — appelée par le site du vendeur
// =============================================================================
router.get('/public', async (req, res) => {
  try {
    const politiques = await chargerPolitiques(req.params.gestionnaireId);
    res.json({ politiques });
  } catch (err) {
    console.error('GET /studio/politiques/:gestionnaireId/public :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/politiques/:gestionnaireId/public/:slug
// Une politique publique par slug — appelée par le site du vendeur
// =============================================================================
router.get('/public/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, contenu, updated_at
         FROM politiques_gestionnaire
        WHERE gestionnaire_id = $1 AND slug = $2`,
      [req.params.gestionnaireId, req.params.slug]
    );

    const defaut = POLITIQUES_DEFAUT.find(p => p.slug === req.params.slug);
    if (!defaut) return res.status(404).json({ error: 'Politique introuvable.' });

    if (result.rows.length === 0) {
      return res.json({
        politique: { slug: defaut.slug, titre: defaut.titre, contenu: '', updated_at: null }
      });
    }

    res.json({ politique: result.rows[0] });
  } catch (err) {
    console.error('GET /studio/politiques/:gestionnaireId/public/:slug :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/politiques/:vendeurId
// Lecture pour le dashboard gestionnaire — toutes les politiques
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const politiques = await chargerPolitiques(req.params.gestionnaireId);
    res.set('Cache-Control', 'no-store');
    res.json({ politiques });
  } catch (err) {
    console.error('GET /studio/politiques/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/politiques/:gestionnaireId/:slug
// Sauvegarder le contenu d'une politique
// Body : { contenu, titre? }
// =============================================================================
router.put('/:slug', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const { vendeurId, slug } = req.params;
  const { contenu, titre } = req.body;

  // Valider que le slug est l'un des 6 autorisés
  const defaut = POLITIQUES_DEFAUT.find(p => p.slug === slug);
  if (!defaut) return res.status(400).json({ error: 'Politique invalide.' });

  const titreAUtiliser = (titre?.trim()) || defaut.titre;

  try {
    const result = await pool.query(
      `INSERT INTO politiques_gestionnaire (gestionnaire_id, slug, titre, contenu, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (gestionnaire_id, slug) DO UPDATE
         SET contenu    = EXCLUDED.contenu,
             titre      = EXCLUDED.titre,
             updated_at = NOW()
       RETURNING slug, titre, contenu, updated_at`,
      [vendeurId, slug, titreAUtiliser, contenu ?? '']
    );

    res.json({ success: true, politique: result.rows[0] });
  } catch (err) {
    console.error('PUT /studio/politiques/:gestionnaireId/:slug :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;