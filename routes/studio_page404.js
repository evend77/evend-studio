// routes/studio_page404.js
//
// GET  /api/studio/page-404/:gestionnaireId/public   — lecture publique (sans auth) appelée par le site du vendeur
// GET  /api/studio/page-404/:vendeurId          — lecture pour le dashboard gestionnaire (auth requise)
// PUT  /api/studio/page-404/:vendeurId          — sauvegarder la config (auth requise)
// POST /api/studio/page-404/:gestionnaireId/image    — uploader une image vers S3 (auth requise)

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const multer  = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { authenticateToken } = require('../middleware/auth');

// ─── Valeurs par défaut ───────────────────────────────────────────────────────
// Appliquées quand un vendeur n'a pas encore configuré sa page 404.
const DEFAUTS_PAGE404 = {
  titre:         'Page introuvable',
  sous_titre:    "Oups\u00a0! La page que vous cherchez n'existe pas ou a \u00e9t\u00e9 d\u00e9plac\u00e9e.",
  texte_bouton:  'Retour \u00e0 l\u2019accueil',
  url_bouton:    '/',           // Retour à la racine du site du vendeur
  couleur_fond:  '#0a0f1e',
  couleur_texte: '#ffffff',
  couleur_bouton:'#f59e0b',
  image_url:     '',
};

// ─── S3 ───────────────────────────────────────────────────────────────────────
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp|svg\+xml)$/i.test(file.mimetype);
    cb(ok ? null : new Error('Fichier non support\u00e9. Accept\u00e9\u00a0: JPG, PNG, GIF, WebP, SVG.'), ok);
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Vérifie que le vendeur connecté accède bien à son propre site
// (un vendeur ne peut pas modifier la page 404 d'un autre vendeur)
function verifierProprietaire(req, res) {
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  const gestionnaireIdToken = req.user?.id;

  if (gestionnaireIdToken !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// Fusionne la config page404 stockée en BD avec les valeurs par défaut
function avecDefauts(page404Brut) {
  return { ...DEFAUTS_PAGE404, ...(page404Brut || {}) };
}

// =============================================================================
// GET /api/studio/page-404/:gestionnaireId/public
// Appelée par le site public du vendeur quand une page 404 se déclenche.
// Aucune authentification requise.
// =============================================================================
router.get('/public', async (req, res) => {
  try {
    const { gestionnaireId } = req.params;

    const result = await pool.query(
      `SELECT config->'page404' AS page404
         FROM sites
        WHERE gestionnaire_id = $1`,
      [gestionnaireId]
    );

    if (result.rows.length === 0) {
      // Vendeur inconnu → on retourne les défauts quand même (le site peut exister)
      return res.json(DEFAUTS_PAGE404);
    }

    res.json(avecDefauts(result.rows[0].page404));

  } catch (err) {
    console.error('GET /studio/page-404/:gestionnaireId/public :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/page-404/:vendeurId
// Lecture pour le dashboard gestionnaire — retourne la config + les défauts appliqués
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  try {
    const { gestionnaireId } = req.params;

    const result = await pool.query(
      `SELECT config->'page404' AS page404
         FROM sites
        WHERE gestionnaire_id = $1`,
      [gestionnaireId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site introuvable pour ce gestionnaire.' });
    }

    res.set('Cache-Control', 'no-store');
    res.json(avecDefauts(result.rows[0].page404));

  } catch (err) {
    console.error('GET /studio/page-404/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/page-404/:vendeurId
// Body : { titre, sous_titre, texte_bouton, url_bouton,
//          couleur_fond, couleur_texte, couleur_bouton, image_url }
// Fusionne uniquement la clé "page404" dans le JSONB config — le reste est intact.
// =============================================================================
router.put('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const {
    titre, sous_titre, texte_bouton, url_bouton,
    couleur_fond, couleur_texte, couleur_bouton, image_url,
  } = req.body;

  // Validation basique
  if (!titre || !sous_titre || !texte_bouton || !url_bouton) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  // Validation couleurs (hex basique)
  const hexRe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  if (couleur_fond   && !hexRe.test(couleur_fond))   return res.status(400).json({ error: 'couleur_fond invalide.'   });
  if (couleur_texte  && !hexRe.test(couleur_texte))  return res.status(400).json({ error: 'couleur_texte invalide.'  });
  if (couleur_bouton && !hexRe.test(couleur_bouton)) return res.status(400).json({ error: 'couleur_bouton invalide.' });

  const nouvelleConfig = {
    titre:         titre.trim(),
    sous_titre:    sous_titre.trim(),
    texte_bouton:  texte_bouton.trim(),
    url_bouton:    url_bouton.trim(),
    couleur_fond:  (couleur_fond   || DEFAUTS_PAGE404.couleur_fond).trim(),
    couleur_texte: (couleur_texte  || DEFAUTS_PAGE404.couleur_texte).trim(),
    couleur_bouton:(couleur_bouton || DEFAUTS_PAGE404.couleur_bouton).trim(),
    image_url:     (image_url      || '').trim(),
  };

  try {
    const { gestionnaireId } = req.params;

    const result = await pool.query(
      // jsonb_set fusionne uniquement la clé page404 — le reste de config est préservé
      `UPDATE sites
          SET config     = jsonb_set(config, '{page404}', $1::jsonb, true),
              updated_at = NOW()
        WHERE gestionnaire_id = $2
        RETURNING config->'page404' AS page404`,
      [JSON.stringify(nouvelleConfig), vendeurId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Site introuvable pour ce gestionnaire.' });
    }

    res.json({ success: true, config: avecDefauts(result.rows[0].page404) });

  } catch (err) {
    console.error('PUT /studio/page-404/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/page-404/:gestionnaireId/image
// Upload image vers S3 — retourne { image_url }
// =============================================================================
router.post('/image', authenticateToken, (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop lourd (max 2 Mo).' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const { gestionnaireId } = req.params;

    try {
      const { buffer, mimetype, originalname } = req.file;
      const ext    = (originalname.split('.').pop() || 'jpg').toLowerCase();
      const s3Key  = `studio/page404/gestionnaire_${gestionnaireId}_${Date.now()}.${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket:      BUCKET,
        Key:         s3Key,
        Body:        buffer,
        ContentType: mimetype,
      }));

      const imageUrl = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${s3Key}`;
      console.log(`🖼️  Image page 404 gestionnaire ${gestionnaireId} uploadée : ${imageUrl}`);

      res.json({ success: true, image_url: imageUrl });

    } catch (s3err) {
      console.error('❌ Erreur S3 upload page 404 studio :', s3err.message);
      res.status(500).json({ error: s3err.message });
    }
  });
});

module.exports = router;