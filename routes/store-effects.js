// =============================================
// FICHIER: routes/store-effects.js
// ROUTES API POUR LA GESTION DES EFFETS VISUELS
// =============================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// =====================================================================
// ADMIN - CRÉER LE CATALOGUE DES EFFETS (initialisation)
// =====================================================================
router.post('/admin/init-catalogue', authenticateToken, isAdmin, async (req, res) => {
  try {
    // On insère tous les effets disponibles
    const effets = [
      // === SAISONNIERS ===
      { effect_id: 'neige', nom: 'Chute de neige', description: 'Flocons de neige qui tombent', categorie: 'magasin', icone: '❄️', prix: 5.00, gratuit: false },
      { effect_id: 'neige3d', nom: 'Neige 3D immersive', description: 'Neige en 3D avec profondeur', categorie: 'magasin', icone: '🌨️', prix: 10.00, gratuit: false },
      { effect_id: 'feuxartifice', nom: 'Feux d\'artifice', description: 'Feux d\'artifice explosifs', categorie: 'magasin', icone: '🎆', prix: 5.00, gratuit: false },
      { effect_id: 'noel', nom: 'Père Noël de Noël', description: 'Père Noël qui traverse l\'écran', categorie: 'magasin', icone: '🎅', prix: 5.00, gratuit: false },
      { effect_id: 'halloween', nom: 'Citrouille d\'Halloween', description: 'Citrouilles qui apparaissent', categorie: 'magasin', icone: '🎃', prix: 5.00, gratuit: false },
      { effect_id: 'chauvesouris', nom: 'Chauves-souris d\'Halloween', description: 'Vol de chauves-souris', categorie: 'magasin', icone: '🦇', prix: 5.00, gratuit: false },
      { effect_id: 'sorciere', nom: 'Sorcière volante avec chauves-souris', description: 'Sorcière sur son balai', categorie: 'magasin', icone: '🧙', prix: 0, gratuit: true },
      { effect_id: 'papillon', nom: 'Papillon', description: 'Papillons qui volent', categorie: 'magasin', icone: '🦋', prix: 0, gratuit: true },
      
      // === CONFETTIS ===
      { effect_id: 'confettis', nom: 'Confettis colorés', description: 'Pluie de confettis', categorie: 'magasin', icone: '🎊', prix: 5.00, gratuit: false },
      { effect_id: 'confettis_licorne', nom: 'Confettis licorne', description: 'Confettis arc-en-ciel', categorie: 'magasin', icone: '🦄', prix: 5.00, gratuit: false },
      { effect_id: 'confettis_etoile', nom: 'Confettis en forme d\'étoile', description: 'Étoiles tombantes', categorie: 'magasin', icone: '⭐', prix: 5.00, gratuit: false },
      { effect_id: 'confettis_coeur', nom: 'Confettis en forme de cœur', description: 'Cœurs qui tombent', categorie: 'magasin', icone: '❤️', prix: 5.00, gratuit: false },
      { effect_id: 'confettis_feu', nom: 'Confettis de feux d\'artifice', description: 'Explosion de confettis', categorie: 'magasin', icone: '🎇', prix: 5.00, gratuit: false },
      { effect_id: 'confettis_bienvenue', nom: 'Confettis de bienvenue', description: 'Bienvenue en couleurs', categorie: 'magasin', icone: '👋', prix: 5.00, gratuit: false },
      { effect_id: 'confettis_tombants', nom: 'Confettis tombants', description: 'Confettis qui tombent', categorie: 'magasin', icone: '📉', prix: 5.00, gratuit: false },
      
      // === RUBANS ===
      { effect_id: 'rubans_classic', nom: 'Rubans classiques', description: 'Rubans traditionnels', categorie: 'magasin', icone: '🎀', prix: 0, gratuit: true },
      { effect_id: 'rubans_large', nom: 'Rubans larges', description: 'Grands rubans flottants', categorie: 'magasin', icone: '🎗️', prix: 5.00, gratuit: false },
      { effect_id: 'rubans_colorful', nom: 'Rubans colorés', description: 'Rubans multicolores', categorie: 'magasin', icone: '🌈', prix: 5.00, gratuit: false },
      { effect_id: 'rubans_fixed', nom: 'Rubans position fixe', description: 'Rubans en haut de page', categorie: 'magasin', icone: '📍', prix: 5.00, gratuit: false },
      
      // === VENTE ===
      { effect_id: 'vente_ete', nom: 'Vente d\'été', description: 'Promotion estivale', categorie: 'magasin', icone: '☀️', prix: 0, gratuit: true },
      { effect_id: 'vente_50', nom: '50% de réduction', description: 'Bannière -50%', categorie: 'magasin', icone: '🏷️', prix: 0, gratuit: true },
      { effect_id: 'vente_merci', nom: 'Merci', description: 'Message de remerciement', categorie: 'magasin', icone: '🙏', prix: 0, gratuit: true },
      { effect_id: 'vente_noir', nom: 'Vendredi noir', description: 'Black Friday', categorie: 'magasin', icone: '🖤', prix: 5.00, gratuit: false },
      { effect_id: 'vente_grande', nom: 'Grande vente', description: 'Grande promotion', categorie: 'magasin', icone: '💰', prix: 5.00, gratuit: false },
      { effect_id: 'prime_amazon', nom: 'Journée Prime Amazon', description: 'Style Prime Day', categorie: 'magasin', icone: '📦', prix: 0, gratuit: true },
      { effect_id: 'cyber_monday', nom: 'Lundi cyber', description: 'Cyber Monday', categorie: 'magasin', icone: '💻', prix: 0, gratuit: true },
      
      // === AUTOMNE ===
      { effect_id: 'feuilles', nom: 'Feuilles de fleurs', description: 'Feuilles qui tombent', categorie: 'magasin', icone: '🍂', prix: 5.00, gratuit: false },
      { effect_id: 'pongal', nom: 'Pongal', description: 'Fête des récoltes', categorie: 'magasin', icone: '🌾', prix: 0, gratuit: true },
      { effect_id: 'holi', nom: 'Holi', description: 'Fête des couleurs', categorie: 'magasin', icone: '🎨', prix: 0, gratuit: true },
      { effect_id: 'diya', nom: 'Effet Diya', description: 'Lampes à huile', categorie: 'magasin', icone: '🪔', prix: 0, gratuit: true },
      
      // === AUTRES ===
      { effect_id: 'pluie', nom: 'Pluie', description: 'Gouttes de pluie', categorie: 'magasin', icone: '🌧️', prix: 5.00, gratuit: false },
      { effect_id: 'pluie_ondulations', nom: 'Pluie avec ondulations', description: 'Pluie avec effet d\'eau', categorie: 'magasin', icone: '💧', prix: 10.00, gratuit: false },
      { effect_id: 'etoiles', nom: 'Chute d\'étoiles', description: 'Étoiles filantes', categorie: 'magasin', icone: '⭐', prix: 5.00, gratuit: false },
      { effect_id: 'cerise', nom: 'Effet cerise', description: 'Cerises qui tombent', categorie: 'magasin', icone: '🍒', prix: 0, gratuit: true },
      { effect_id: 'bulle', nom: 'Bulle', description: 'Bulles qui flottent', categorie: 'magasin', icone: '🫧', prix: 0, gratuit: true },
      { effect_id: 'soleil', nom: 'Soleil', description: 'Rayons de soleil', categorie: 'magasin', icone: '☀️', prix: 0, gratuit: true },
      { effect_id: 'lune', nom: 'Lune du Ramadan', description: 'Croissant de lune', categorie: 'magasin', icone: '🌙', prix: 0, gratuit: true },
      { effect_id: 'ovni', nom: 'Alien OVNI', description: 'Soucoupe volante', categorie: 'magasin', icone: '🛸', prix: 0, gratuit: true },
      { effect_id: 'drapeau_us', nom: 'Drapeau américain', description: 'Drapeau USA', categorie: 'magasin', icone: '🇺🇸', prix: 0, gratuit: true },
      { effect_id: 'drapeau_uk', nom: 'Drapeau anglais', description: 'Drapeau UK', categorie: 'magasin', icone: '🇬🇧', prix: 0, gratuit: true },
      { effect_id: 'drapeau_chine', nom: 'Drapeau de la Chine', description: 'Drapeau Chine', categorie: 'magasin', icone: '🇨🇳', prix: 0, gratuit: true },
      { effect_id: 'image', nom: 'Effet d\'image personnalisé', description: 'Votre propre image', categorie: 'magasin', icone: '🖼️', prix: 10.00, gratuit: false },
      { effect_id: 'texte', nom: 'Chute de texte personnalisée', description: 'Votre texte animé', categorie: 'magasin', icone: '✏️', prix: 10.00, gratuit: false },
      { effect_id: 'emoji', nom: 'Chute d\'emoji personnalisée', description: 'Vos emojis en pluie', categorie: 'magasin', icone: '😊', prix: 5.00, gratuit: false },
      { effect_id: 'fusee', nom: 'Fusée', description: 'Fusée qui décolle', categorie: 'magasin', icone: '🚀', prix: 5.00, gratuit: false },
      { effect_id: 'scintillant', nom: 'Effet scintillant', description: 'Étincelles', categorie: 'magasin', icone: '✨', prix: 0, gratuit: true },
      
      // === CURSEURS ===
      { effect_id: 'curseur_halloween', nom: 'Curseur Halloween', description: 'Citrouille', categorie: 'curseur', icone: '🎃', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_noel', nom: 'Curseur Noël', description: 'Sapin de Noël', categorie: 'curseur', icone: '🎄', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_chauve', nom: 'Curseur chauves-souris', description: 'Chauve-souris', categorie: 'curseur', icone: '🦇', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_etoile', nom: 'Curseur étoile', description: 'Étoile scintillante', categorie: 'curseur', icone: '⭐', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_neige', nom: 'Curseur neige', description: 'Flocon de neige', categorie: 'curseur', icone: '❄️', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_bulles', nom: 'Curseur bulles', description: 'Bulles', categorie: 'curseur', icone: '🫧', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_arcenciel', nom: 'Curseur arc-en-ciel', description: 'Arc-en-ciel', categorie: 'curseur', icone: '🌈', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_coeur', nom: 'Curseur cœur', description: 'Cœur', categorie: 'curseur', icone: '❤️', prix: 0, gratuit: true },
      { effect_id: 'curseur_licorne', nom: 'Curseur licorne', description: 'Licorne', categorie: 'curseur', icone: '🦄', prix: 0, gratuit: true },
      { effect_id: 'curseur_fantome', nom: 'Curseur fantôme', description: 'Fantôme', categorie: 'curseur', icone: '👻', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_fee', nom: 'Curseur poussière de fée', description: 'Poussière de fée', categorie: 'curseur', icone: '🧚', prix: 0, gratuit: true },
      { effect_id: 'curseur_emoji', nom: 'Curseur emoji personnalisé', description: 'Votre emoji', categorie: 'curseur', icone: '😊', prix: 0, gratuit: true },
      { effect_id: 'curseur_point_gris', nom: 'Curseur point gris', description: 'Point gris', categorie: 'curseur', icone: '⚪', prix: 5.00, gratuit: false },
      { effect_id: 'curseur_point_rouge', nom: 'Curseur point rouge', description: 'Point rouge', categorie: 'curseur', icone: '🔴', prix: 0, gratuit: true },
      { effect_id: 'curseur_point_bleu', nom: 'Curseur point bleu', description: 'Point bleu', categorie: 'curseur', icone: '🔵', prix: 0, gratuit: true },
      { effect_id: 'curseur_trail', nom: 'Curseur traînée', description: 'Effet de traînée', categorie: 'curseur', icone: '💫', prix: 0, gratuit: true },
      { effect_id: 'curseur_image', nom: 'Curseur image personnalisé', description: 'Votre image', categorie: 'curseur', icone: '🖼️', prix: 0, gratuit: true },
      
      // === MUSIQUE ===
      { effect_id: 'musique_noel', nom: 'Musique de Noël', description: 'Chants de Noël', categorie: 'musique', icone: '🎄', prix: 0, gratuit: true },
      { effect_id: 'musique_piano_noel', nom: 'Piano de Noël', description: 'Piano', categorie: 'musique', icone: '🎹', prix: 0, gratuit: true },
      { effect_id: 'musique_nuit_noel', nom: 'Nuit de Noël', description: 'Nuit paisible', categorie: 'musique', icone: '🌙', prix: 0, gratuit: true },
      { effect_id: 'musique_halloween', nom: 'Musique d\'Halloween', description: 'Ambiance', categorie: 'musique', icone: '🎃', prix: 0, gratuit: true },
      { effect_id: 'musique_romantique', nom: 'Musique romantique', description: 'Douce ambiance', categorie: 'musique', icone: '💕', prix: 0, gratuit: true },
      { effect_id: 'musique_bienvenue', nom: 'Musique de bienvenue', description: 'Message d\'accueil', categorie: 'musique', icone: '👋', prix: 0, gratuit: true },
      { effect_id: 'musique_esprit_noel', nom: 'Esprit de Noël', description: 'Joyeux Noël', categorie: 'musique', icone: '✨', prix: 5.00, gratuit: false },
      
      // === DÉCORATIONS ===
      { effect_id: 'decoration_guirlande', nom: 'Guirlandes lumineuses', description: 'Lumière de Noël', categorie: 'decoration', icone: '💡', prix: 0, gratuit: true },
      { effect_id: 'decoration_araignee', nom: 'Araignées suspendues', description: 'Toiles d\'araignée', categorie: 'decoration', icone: '🕷️', prix: 0, gratuit: true },
      { effect_id: 'decoration_neige', nom: 'Décoration hivernale', description: 'Paysage enneigé', categorie: 'decoration', icone: '☃️', prix: 0, gratuit: true },
      { effect_id: 'decoration_halloween', nom: 'Décoration d\'Halloween', description: 'Ambiance', categorie: 'decoration', icone: '💀', prix: 0, gratuit: true },
      { effect_id: 'decoration_squelette', nom: 'Squelette mouvant', description: 'Squelette animé', categorie: 'decoration', icone: '💀', prix: 0, gratuit: true },
      { effect_id: 'decoration_graveyard', nom: 'Cimetière hanté', description: 'Atmosphère', categorie: 'decoration', icone: '🪦', prix: 0, gratuit: true },
      
      // === PANIER ===
      { effect_id: 'panier_confettis', nom: 'Confettis', description: 'Confettis au panier', categorie: 'panier', icone: '🎊', prix: 0, gratuit: true },
      { effect_id: 'panier_rubans', nom: 'Rubans', description: 'Rubans', categorie: 'panier', icone: '🎀', prix: 0, gratuit: true },
      { effect_id: 'panier_etoiles', nom: 'Étoiles', description: 'Étoiles', categorie: 'panier', icone: '⭐', prix: 0, gratuit: true },
      { effect_id: 'panier_feux', nom: 'Feux d\'artifice', description: 'Feux', categorie: 'panier', icone: '🎆', prix: 5.00, gratuit: false },
      { effect_id: 'panier_coeurs', nom: 'Cœurs', description: 'Cœurs', categorie: 'panier', icone: '❤️', prix: 5.00, gratuit: false },
      
      // === FONCTIONNALITÉS SPÉCIALES ===
      { effect_id: 'scroll_to_top', nom: 'Bouton remonter', description: 'Retour en haut', categorie: 'scroll', icone: '⬆️', prix: 0, gratuit: true },
      { effect_id: 'tab_animation', nom: 'Animation onglet', description: 'Titre animé', categorie: 'tab', icone: '🔄', prix: 0, gratuit: true },
    ];

    for (const e of effets) {
      await pool.query(`
        INSERT INTO store_effects_catalogue 
        (effect_id, nom, description, categorie, icone, prix, gratuit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (effect_id) DO UPDATE SET
          nom = EXCLUDED.nom,
          description = EXCLUDED.description,
          categorie = EXCLUDED.categorie,
          icone = EXCLUDED.icone,
          prix = EXCLUDED.prix,
          gratuit = EXCLUDED.gratuit
      `, [e.effect_id, e.nom, e.description, e.categorie, e.icone, e.prix, e.gratuit]);
    }

    res.json({ success: true, message: `✅ ${effets.length} effets importés` });

  } catch (err) {
    console.error('❌ Erreur init catalogue:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// GET - Récupérer la config d'un gestionnaire
// =====================================================================
router.get('/config/:gestionnaireId', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;

    // Récupérer tous les effets activés pour ce gestionnaire
    const result = await pool.query(`
      SELECT 
        eg.effect_id,
        eg.actif,
        eg.settings,
        ec.nom,
        ec.categorie,
        ec.icone,
        ec.gratuit,
        ec.prix
      FROM store_effects_gestionnaires eg
      JOIN store_effects_catalogue ec ON eg.effect_id = ec.effect_id
      WHERE eg.gestionnaire_id = $1 AND ec.actif = true
    `, [gestionnaireId]);

    // Construire l'objet config
    const config = {
      actif: result.rows.some(r => r.actif === true),
      effetMagasin: null,
      effetMagasinSettings: {},
      curseur: null,
      curseurSettings: {},
      musique: null,
      musiqueSettings: {},
      decoration: null,
      decorationSettings: {},
      addToCart: null,
      addToCartSettings: {},
      scrollToTop: { enabled: false },
      tabAnimation: { enabled: false, messages: [] }
    };

    result.rows.forEach(row => {
      const settings = row.settings || {};
      
      switch(row.categorie) {
        case 'magasin':
          config.effetMagasin = row.effect_id;
          config.effetMagasinSettings = settings;
          break;
        case 'curseur':
          config.curseur = row.effect_id;
          config.curseurSettings = settings;
          break;
        case 'musique':
          config.musique = row.effect_id;
          config.musiqueSettings = settings;
          break;
        case 'decoration':
          config.decoration = row.effect_id;
          config.decorationSettings = settings;
          break;
        case 'panier':
          config.addToCart = row.effect_id;
          config.addToCartSettings = settings;
          break;
        case 'scroll':
          config.scrollToTop = { enabled: row.actif, ...settings };
          break;
        case 'tab':
          config.tabAnimation = { 
            enabled: row.actif, 
            messages: settings.messages || [], 
            ...settings 
          };
          break;
      }
    });

    res.json({ success: true, config });

  } catch (err) {
    console.error('❌ Erreur chargement config effets:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// PUT - Sauvegarder la config d'un gestionnaire
// =====================================================================
router.put('/config/:gestionnaireId', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;
    const { config } = req.body;

    // Vérifier que le gestionnaire existe
    const check = await pool.query('SELECT id FROM gestionnaires WHERE id = $1', [gestionnaireId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Gestionnaire non trouvé' });
    }

    // On commence une transaction
    await pool.query('BEGIN');

    // 1. Supprimer toutes les entrées existantes pour ce gestionnaire
    await pool.query(
      'DELETE FROM store_effects_gestionnaires WHERE gestionnaire_id = $1',
      [gestionnaireId]
    );

    // 2. Insérer chaque effet configuré
    const effets = [];

    // Effet magasin
    if (config.effetMagasin) {
      effets.push({
        effect_id: config.effetMagasin,
        actif: config.actif,
        settings: config.effetMagasinSettings || {},
        categorie: 'magasin'
      });
    }

    // Curseur
    if (config.curseur) {
      effets.push({
        effect_id: config.curseur,
        actif: config.actif,
        settings: config.curseurSettings || {},
        categorie: 'curseur'
      });
    }

    // Musique
    if (config.musique) {
      effets.push({
        effect_id: config.musique,
        actif: config.actif,
        settings: config.musiqueSettings || {},
        categorie: 'musique'
      });
    }

    // Décoration
    if (config.decoration) {
      effets.push({
        effect_id: config.decoration,
        actif: config.actif,
        settings: config.decorationSettings || {},
        categorie: 'decoration'
      });
    }

    // Ajout panier
    if (config.addToCart) {
      effets.push({
        effect_id: config.addToCart,
        actif: config.actif,
        settings: config.addToCartSettings || {},
        categorie: 'panier'
      });
    }

    // Scroll
    if (config.scrollToTop?.enabled) {
      effets.push({
        effect_id: 'scroll_to_top',
        actif: true,
        settings: config.scrollToTop || {},
        categorie: 'scroll'
      });
    }

    // Tab animation
    if (config.tabAnimation?.enabled) {
      effets.push({
        effect_id: 'tab_animation',
        actif: true,
        settings: config.tabAnimation || { messages: [] },
        categorie: 'tab'
      });
    }

    // Insérer tous les effets
    for (const e of effets) {
      await pool.query(`
        INSERT INTO store_effects_gestionnaires 
        (gestionnaire_id, effect_id, actif, settings)
        VALUES ($1, $2, $3, $4)
      `, [gestionnaireId, e.effect_id, e.actif, e.settings]);
    }

    await pool.query('COMMIT');

    // Log de l'action
    await pool.query(`
      INSERT INTO store_effects_logs (gestionnaire_id, action, details)
      VALUES ($1, $2, $3)
    `, [gestionnaireId, 'sauvegarde_config', JSON.stringify({ 
      effets_actifs: effets.length,
      actif: config.actif 
    })]);

    res.json({ success: true, message: '✅ Configuration sauvegardée' });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Erreur sauvegarde config effets:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// GET - Catalogue des effets disponibles
// =====================================================================
router.get('/catalogue', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM store_effects_catalogue 
      WHERE actif = true 
      ORDER BY categorie, nom
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Erreur catalogue effets:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// GET - Effets activés d'un gestionnaire (pour le template)
// =====================================================================
router.get('/gestionnaire/:gestionnaireId/actifs', authenticateToken, async (req, res) => {
  try {
    const { gestionnaireId } = req.params;

    const result = await pool.query(`
      SELECT 
        eg.effect_id,
        eg.actif,
        eg.settings,
        ec.nom,
        ec.categorie,
        ec.icone,
        ec.gratuit,
        ec.prix
      FROM store_effects_gestionnaires eg
      JOIN store_effects_catalogue ec ON eg.effect_id = ec.effect_id
      WHERE eg.gestionnaire_id = $1 
        AND eg.actif = true 
        AND ec.actif = true
    `, [gestionnaireId]);

    // Grouper par catégorie
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.categorie]) grouped[row.categorie] = [];
      grouped[row.categorie].push({
        effect_id: row.effect_id,
        nom: row.nom,
        icone: row.icone,
        settings: row.settings || {}
      });
    });

    res.json({ 
      success: true, 
      data: grouped,
      total: result.rows.length 
    });

  } catch (err) {
    console.error('❌ Erreur chargement effets actifs:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - Activer/désactiver un effet globalement
// =====================================================================
router.post('/admin/:effect_id/toggle', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { effect_id } = req.params;

    const current = await pool.query(
      'SELECT actif FROM store_effects_catalogue WHERE effect_id = $1',
      [effect_id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Effet non trouvé' });
    }

    const nouvelEtat = !current.rows[0].actif;

    await pool.query(
      'UPDATE store_effects_catalogue SET actif = $1 WHERE effect_id = $2',
      [nouvelEtat, effect_id]
    );

    res.json({ 
      success: true, 
      message: nouvelEtat ? '✅ Effet activé' : '⏸ Effet désactivé',
      actif: nouvelEtat 
    });

  } catch (err) {
    console.error('❌ Erreur toggle effet:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - Définir le prix d'un effet
// =====================================================================
router.put('/admin/:effect_id/prix', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { effect_id } = req.params;
    const { prix, gratuit } = req.body;

    const result = await pool.query(`
      UPDATE store_effects_catalogue 
      SET prix = $1, gratuit = $2
      WHERE effect_id = $3
      RETURNING effect_id, nom, prix, gratuit
    `, [prix || 0, gratuit || false, effect_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Effet non trouvé' });
    }

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: '✅ Prix mis à jour' 
    });

  } catch (err) {
    console.error('❌ Erreur mise à jour prix:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - Statistiques des effets
// =====================================================================
router.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Nombre total d'effets
    const total = await pool.query('SELECT COUNT(*) FROM store_effects_catalogue WHERE actif = true');
    
    // Nombre d'effets gratuits vs payants
    const gratuit = await pool.query("SELECT COUNT(*) FROM store_effects_catalogue WHERE gratuit = true AND actif = true");
    const payant = await pool.query("SELECT COUNT(*) FROM store_effects_catalogue WHERE gratuit = false AND actif = true");
    
    // Nombre de gestionnaires qui ont activé au moins un effet
    const gestionnaires = await pool.query(`
      SELECT COUNT(DISTINCT gestionnaire_id) 
      FROM store_effects_gestionnaires 
      WHERE actif = true
    `);

    // Top 5 des effets les plus activés
    const top = await pool.query(`
      SELECT 
        ec.effect_id,
        ec.nom,
        ec.icone,
        COUNT(eg.gestionnaire_id) as nb_actifs
      FROM store_effects_gestionnaires eg
      JOIN store_effects_catalogue ec ON eg.effect_id = ec.effect_id
      WHERE eg.actif = true AND ec.actif = true
      GROUP BY ec.effect_id, ec.nom, ec.icone
      ORDER BY nb_actifs DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        total: parseInt(total.rows[0].count),
        gratuit: parseInt(gratuit.rows[0].count),
        payant: parseInt(payant.rows[0].count),
        gestionnaires: parseInt(gestionnaires.rows[0].count),
        top_effets: top.rows
      }
    });

  } catch (err) {
    console.error('❌ Erreur stats effets:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - Récupérer la liste des effets (admin)
// =====================================================================
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM store_effects_catalogue 
      ORDER BY categorie, nom
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Erreur chargement tous les effets:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;