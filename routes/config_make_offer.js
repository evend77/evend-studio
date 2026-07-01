// routes/config_make_offer.js
// Endpoints : GET + POST /api/admin/configuration/make-offer
// GET est PUBLIC (appelé par le widget JS sur Shopify)
// POST est protégé (admin seulement)

const express = require('express');
const router  = express.Router();
const db      = require('../config/database');

const DEFAULT_CONFIG = {
  // Activation globale
  make_offer_actif:              true,
  // Permissions vendeurs
  auto_accept_global:            false,
  permettre_vendeur_auto_accept: true,
  permettre_vendeur_configurer:  true,
  // Limites
  duree_expiration_heures:       48,
  max_offres_par_produit:        10,
  offre_min_pourcentage:         30,
  // Emails
  email_vendeur_nouvelle_offre:  true,
  email_acheteur_confirmation:   true,
  email_acheteur_accepte:        true,
  email_acheteur_refuse:         true,
  // Apparence widget
  couleur_fond:                  '#ffffff',
  couleur_texte:                 '#1a2332',
  couleur_bouton:                '#2d6a9f',
  couleur_bouton_texte:          '#ffffff',
  couleur_bordure:               '#e1e4e8',
  border_radius:                 10,
  // Textes widget
  texte_bouton:                  '💬 Faire une offre',
  texte_titre_modal:             '💬 Faire une offre au vendeur',
  texte_placeholder_montant:     'Ex : 45.00',
  texte_placeholder_message:     'Ex : Je suis très intéressé, voici mon offre...',
  texte_offre_envoyee:           '✅ Votre offre a été envoyée au vendeur !',
  texte_offre_acceptee:          '🎉 Offre acceptée ! Le vendeur a accepté votre prix.',
  texte_offre_refusee:           '❌ Le vendeur a refusé votre offre.',
  texte_label_montant:           'Votre offre ($)',
  texte_label_message:           'Message au vendeur (optionnel)',
  texte_label_email:             'Votre courriel',
  texte_label_nom:               'Votre nom',
  texte_bouton_envoyer:          'Envoyer mon offre',
  texte_bouton_annuler:          'Annuler',
};

// ── GET /api/admin/configuration/make-offer ────────────────────────────────
// PUBLIC — appelé par le widget JS depuis Shopify
router.get('/make-offer', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const result = await db.query(
      `SELECT config_make_offer FROM configuration_generale_admin WHERE id = 1 LIMIT 1`
    );

    if (result.rows.length === 0 || !result.rows[0].config_make_offer) {
      return res.json({ success: true, config: DEFAULT_CONFIG });
    }

    const config = { ...DEFAULT_CONFIG, ...result.rows[0].config_make_offer };
    res.json({ success: true, config });

  } catch (error) {
    console.error('[config-make-offer GET]', error.message);
    res.json({ success: true, config: DEFAULT_CONFIG });
  }
});

// ── POST /api/admin/configuration/make-offer ───────────────────────────────
// PROTÉGÉ — admin seulement
router.post('/make-offer', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token manquant' });

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

    let configRaw = req.body;
    if (configRaw && configRaw.config && typeof configRaw.config === 'object') {
      configRaw = configRaw.config;
    }

    if (!configRaw || typeof configRaw !== 'object' || Array.isArray(configRaw)) {
      return res.status(400).json({ success: false, message: 'Configuration invalide' });
    }

    const CHAMPS_VALIDES = Object.keys(DEFAULT_CONFIG);
    const configNettoyee = {};
    for (const key of CHAMPS_VALIDES) {
      if (configRaw[key] !== undefined) configNettoyee[key] = configRaw[key];
    }

    const configComplete = { ...DEFAULT_CONFIG, ...configNettoyee };

    await db.query(`
      INSERT INTO configuration_generale_admin (id, config_make_offer)
      VALUES (1, $1::jsonb)
      ON CONFLICT (id) DO UPDATE
      SET config_make_offer = $1::jsonb,
          updated_at = NOW()
    `, [JSON.stringify(configComplete)]);

    console.log('✅ Config Make Offer sauvegardée par admin:', decoded.email || decoded.id);
    res.json({ success: true, message: '✅ Configuration sauvegardée avec succès', config: configComplete });

  } catch (error) {
    console.error('[config-make-offer POST]', error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la sauvegarde' });
  }
});

module.exports = router;