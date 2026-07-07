// routes/studio_cookies_site.js
//
// GET /api/studio/cookies-site/:gestionnaireId/public  — config publique (sans auth, appelée par le site du vendeur)
// GET /api/studio/cookies-site/:vendeurId         — lecture dashboard gestionnaire (auth)
// PUT /api/studio/cookies-site/:vendeurId         — sauvegarder la config (auth)

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Valeurs par défaut ───────────────────────────────────────────────────────
const DEFAUTS = {
  actif:                       true,
  position:                    'bas-gauche',
  titre:                       'Nous respectons votre vie privée !',
  description:                 "Conformément à la Loi 25 (Québec) et à la LPRPDE (Canada), certains témoins de connexion sont nécessaires au fonctionnement sécurisé de ce site.",
  bouton_accepter:             'Accepter tout',
  bouton_refuser:              'Accepter obligatoire uniquement',
  bouton_preferences:          'Gérer les préférences',
  lien_politique:              '/politique-confidentialite',
  lien_conditions:             '/conditions-service',
  texte_politique:             'Politique de confidentialité',
  texte_conditions:            'Conditions générales',
  couleur_fond:                '#1a2436',
  couleur_titre:               '#ffffff',
  couleur_texte:               '#cccccc',
  couleur_bouton_accept:       '#c9a96e',
  couleur_texte_bouton_accept: '#1a1a1a',
  afficher_bouton_preferences: true,
  categories_actives:          { fonctionnalite: true, analytique: true, marketing: true },
  supprimer_non_essentiels:    true,
};

// ─── Helper propriétaire ──────────────────────────────────────────────────────
function verifierProprietaire(req, res) {
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  const gestionnaireIdToken = parseInt(req.user?.id, 10);
  if (gestionnaireIdToken !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// ─── Helper : formater la config depuis la BD ─────────────────────────────────
function formaterConfig(row) {
  return {
    ...DEFAUTS,
    ...row,
    categories_actives: typeof row.categories_actives === 'string'
      ? JSON.parse(row.categories_actives)
      : (row.categories_actives ?? DEFAUTS.categories_actives),
  };
}

// =============================================================================
// GET /api/studio/cookies-site/:gestionnaireId/public
// Appelée par le site du vendeur pour afficher la bannière aux visiteurs
// =============================================================================
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT actif, position, titre, description,
              bouton_accepter, bouton_refuser, bouton_preferences,
              lien_politique, lien_conditions, texte_politique, texte_conditions,
              couleur_fond, couleur_titre, couleur_texte,
              couleur_bouton_accept, couleur_texte_bouton_accept,
              afficher_bouton_preferences, categories_actives
         FROM cookies_site_gestionnaire
        WHERE gestionnaire_id = $1`,
      [req.params.gestionnaireId]
    );
    if (result.rows.length === 0) return res.json(DEFAUTS);
    res.json(formaterConfig(result.rows[0]));
  } catch (err) {
    console.error('GET /studio/cookies-site/:gestionnaireId/public :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/cookies-site/:vendeurId
// Lecture complète pour le dashboard gestionnaire
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT * FROM cookies_site_gestionnaire WHERE gestionnaire_id = $1`,
      [req.params.gestionnaireId]
    );
    res.set('Cache-Control', 'no-store');
    if (result.rows.length === 0) return res.json(DEFAUTS);
    res.json(formaterConfig(result.rows[0]));
  } catch (err) {
    console.error('GET /studio/cookies-site/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/cookies-site/:vendeurId
// Sauvegarder la configuration de la bannière
// =============================================================================
router.put('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;

  const {
    actif, position, titre, description,
    bouton_accepter, bouton_refuser, bouton_preferences,
    lien_politique, lien_conditions, texte_politique, texte_conditions,
    couleur_fond, couleur_titre, couleur_texte,
    couleur_bouton_accept, couleur_texte_bouton_accept,
    afficher_bouton_preferences, categories_actives, supprimer_non_essentiels,
  } = req.body;

  const { gestionnaireId } = req.params;

  try {
    const result = await pool.query(
      `INSERT INTO cookies_site_gestionnaire (
         gestionnaire_id, actif, position, titre, description,
         bouton_accepter, bouton_refuser, bouton_preferences,
         lien_politique, lien_conditions, texte_politique, texte_conditions,
         couleur_fond, couleur_titre, couleur_texte,
         couleur_bouton_accept, couleur_texte_bouton_accept,
         afficher_bouton_preferences, categories_actives, supprimer_non_essentiels,
         updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
       ON CONFLICT (gestionnaire_id) DO UPDATE SET
         actif                       = EXCLUDED.actif,
         position                    = EXCLUDED.position,
         titre                       = EXCLUDED.titre,
         description                 = EXCLUDED.description,
         bouton_accepter             = EXCLUDED.bouton_accepter,
         bouton_refuser              = EXCLUDED.bouton_refuser,
         bouton_preferences          = EXCLUDED.bouton_preferences,
         lien_politique              = EXCLUDED.lien_politique,
         lien_conditions             = EXCLUDED.lien_conditions,
         texte_politique             = EXCLUDED.texte_politique,
         texte_conditions            = EXCLUDED.texte_conditions,
         couleur_fond                = EXCLUDED.couleur_fond,
         couleur_titre               = EXCLUDED.couleur_titre,
         couleur_texte               = EXCLUDED.couleur_texte,
         couleur_bouton_accept       = EXCLUDED.couleur_bouton_accept,
         couleur_texte_bouton_accept = EXCLUDED.couleur_texte_bouton_accept,
         afficher_bouton_preferences = EXCLUDED.afficher_bouton_preferences,
         categories_actives          = EXCLUDED.categories_actives,
         supprimer_non_essentiels    = EXCLUDED.supprimer_non_essentiels,
         updated_at                  = NOW()
       RETURNING *`,
      [
        vendeurId,
        actif ?? true,
        position ?? 'bas-gauche',
        titre ?? DEFAUTS.titre,
        description ?? DEFAUTS.description,
        bouton_accepter ?? DEFAUTS.bouton_accepter,
        bouton_refuser ?? DEFAUTS.bouton_refuser,
        bouton_preferences ?? DEFAUTS.bouton_preferences,
        lien_politique ?? DEFAUTS.lien_politique,
        lien_conditions ?? DEFAUTS.lien_conditions,
        texte_politique ?? DEFAUTS.texte_politique,
        texte_conditions ?? DEFAUTS.texte_conditions,
        couleur_fond ?? DEFAUTS.couleur_fond,
        couleur_titre ?? DEFAUTS.couleur_titre,
        couleur_texte ?? DEFAUTS.couleur_texte,
        couleur_bouton_accept ?? DEFAUTS.couleur_bouton_accept,
        couleur_texte_bouton_accept ?? DEFAUTS.couleur_texte_bouton_accept,
        afficher_bouton_preferences ?? true,
        JSON.stringify(categories_actives ?? DEFAUTS.categories_actives),
        supprimer_non_essentiels ?? true,
      ]
    );

    res.json({ success: true, config: formaterConfig(result.rows[0]) });
  } catch (err) {
    console.error('PUT /studio/cookies-site/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;