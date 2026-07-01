// routes/config_parution_futur.js
// Endpoints : GET + POST /api/admin/configuration/parution-futur
// GET est PUBLIC (appelé par le widget JS sur Shopify)
// POST est protégé (admin seulement)

const express = require('express');
const router  = express.Router();
const db      = require('../config/database');

const DEFAULT_CONFIG = {
  couleur_fond_debut:        '#0d2b5d',
  couleur_fond_fin:          '#0a1a3d',
  couleur_texte:             '#e2ebff',
  couleur_titres:            '#b7c9ff',
  couleur_chiffres:          '#ffffff',
  couleur_bordure:           '#000000',
  couleur_boite_fond:        '#1a3a6e',
  couleur_boite_bordure:     '#3a6aaf',
  taille_chiffres:           140,
  border_radius:             14,
  border_width:              3,
  ombre_active:              true,
  ombre_intensite:           35,
  couleur_fond_mobile_debut: '#0d2b5d',
  couleur_fond_mobile_fin:   '#0a1a3d',
  masquer_timezone_mobile:   false,
  texte_titre:               '⏳ Disponible dans :',
  texte_date_prefix:         '🗓️ Mise en vente le',
  texte_timezone:            '(Heure de Montréal — EST/EDT)',
  texte_seo:                 'Ce produit sera disponible à la vente dès la fin du compte à rebours.',
  texte_vente_ouverte:       '🎉 La vente est ouverte !!!',
  texte_atc_bloque:          '',
  afficher_feux_artifice:    true,
  duree_feux_artifice:       5,
  afficher_timezone:         true,
  afficher_seo:              true,
  effet_vague:               true,
  vitesse_vague:             'normale',
  effet_bordure:             true,
  bloquer_wishlist:          true,
  afficher_message_atc:      false,
  duree_vente_ouverte:       24,
  duree_disparition_bloc:    5,
};

// ── GET /api/admin/configuration/parution-futur ────────────────────────────
// PUBLIC — appelé par le widget JS depuis Shopify
// Retourne la config avec headers CORS pour autoriser les appels cross-origin
router.get('/parution-futur', async (req, res) => {
  // Headers CORS pour que le widget Shopify puisse appeler cette route
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60'); // Cache 60s pour ne pas surcharger
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const result = await db.query(
      `SELECT config_parution_futur FROM configuration_generale_admin WHERE id = 1 LIMIT 1`
    );

    if (result.rows.length === 0 || !result.rows[0].config_parution_futur) {
      return res.json({ success: true, config: DEFAULT_CONFIG });
    }

    const config = { ...DEFAULT_CONFIG, ...result.rows[0].config_parution_futur };
    res.json({ success: true, config });

  } catch (error) {
    console.error('[config-parution-futur GET]', error.message);
    // En cas d'erreur, retourner la config par défaut pour ne pas bloquer le widget
    res.json({ success: true, config: DEFAULT_CONFIG });
  }
});

// ── POST /api/admin/configuration/parution-futur ───────────────────────────
// PROTÉGÉ — admin seulement
router.post('/parution-futur', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token manquant' });

    // Vérifier le token admin
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
    }

    // Extraire la config — le frontend peut envoyer soit { ...config } soit { config: {...} }
    let configRaw = req.body;
    if (configRaw && configRaw.config && typeof configRaw.config === 'object') {
      configRaw = configRaw.config;
    }

    // Valider que c'est bien un objet
    if (!configRaw || typeof configRaw !== 'object' || Array.isArray(configRaw)) {
      return res.status(400).json({ success: false, message: 'Configuration invalide' });
    }

    // Retirer les champs parasites (success, message, etc.)
    const CHAMPS_VALIDES = Object.keys(DEFAULT_CONFIG);
    const configNettoyee = {};
    for (const key of CHAMPS_VALIDES) {
      if (configRaw[key] !== undefined) configNettoyee[key] = configRaw[key];
    }

    // Fusionner avec les defaults pour s'assurer qu'il ne manque rien
    const configComplete = { ...DEFAULT_CONFIG, ...configNettoyee };

    // S'assurer que la ligne id=1 existe
    await db.query(`
      INSERT INTO configuration_generale_admin (id, config_parution_futur)
      VALUES (1, $1::jsonb)
      ON CONFLICT (id) DO UPDATE
      SET config_parution_futur = $1::jsonb,
          updated_at = NOW()
    `, [JSON.stringify(configComplete)]);

    console.log('✅ Config parution future sauvegardée par admin:', decoded.email || decoded.id);

    res.json({ success: true, message: '✅ Configuration sauvegardée avec succès', config: configComplete });

  } catch (error) {
    console.error('[config-parution-futur POST]', error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde' });
  }
});

module.exports = router;