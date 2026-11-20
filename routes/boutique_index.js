// CHEMIN : routes/boutique_index.js
// e-Vend Studio — Point d'entrée des routes des templates boutique (solo). Monté sur /api/boutique dans server.js.
// Chaque nouveau morceau du solo (panier, commandes, catalogue public…) s'ajoute ici, jamais dans server.js.
//
// Deux zones, pour que les gardes de sécurité ne se mélangent jamais :
//   /api/boutique/gestionnaire/…  → partie privée du gestionnaire (connecté, rôle gestionnaire)
//   /api/boutique/public/…        → catalogue public (à venir, étapes suivantes)
//   /api/boutique/acheteur/:gid/… → panier, caisse, commandes de l'acheteur

const express = require('express');
const router = express.Router();

router.use('/gestionnaire', require('./boutique_produits'));
router.use('/gestionnaire/paiement', require('./boutique_paiement_config'));
router.use('/gestionnaire/expedition', require('./boutique_expedition_config'));
router.use('/gestionnaire/taxes', require('./boutique_taxes_config'));
router.use('/gestionnaire/commandes', require('./boutique_commandes_gestionnaire'));
router.use('/gestionnaire/promos', require('./boutique_promos_config'));
router.use('/gestionnaire/retours', require('./boutique_retours_gestionnaire'));
router.use('/gestionnaire/addons', require('./boutique_addons_gestionnaire'));
router.use('/gestionnaire/effets', require('./boutique_effets_gestionnaire'));
router.use('/gestionnaire/offres', require('./boutique_offres_gestionnaire'));
router.use('/gestionnaire/negociations', require('./boutique_negociations_gestionnaire'));
router.use('/gestionnaire/encheres', require('./boutique_encheres_gestionnaire'));
router.use('/gestionnaire/questions', require('./boutique_questions_gestionnaire'));
router.use('/gestionnaire/blog', require('./boutique_blog_gestionnaire'));
router.use('/gestionnaire/chatbot', require('./boutique_chatbot_gestionnaire'));
router.use('/gestionnaire/popup', require('./boutique_popup_gestionnaire'));
router.use('/gestionnaire/favoris', require('./boutique_favoris_gestionnaire'));
router.use('/gestionnaire/avis', require('./boutique_avis_gestionnaire'));
router.use('/gestionnaire/parution', require('./boutique_parution_gestionnaire'));
router.use('/gestionnaire/verificateur-age', require('./boutique_verificateur_age_gestionnaire'));
router.use('/gestionnaire/favicon', require('./boutique_favicon_gestionnaire'));
router.use('/gestionnaire/pwa', require('./boutique_pwa_gestionnaire'));

// Publics (sans connexion) — AVANT la zone connectée ci-dessous : catalogue de la boutique, inscription d'un acheteur
router.use('/catalogue', require('./boutique_catalogue'));
router.use('/effets', require('./boutique_effets_public'));
router.use('/negociations', require('./boutique_negociations_public'));
router.use('/encheres', require('./boutique_encheres_public'));
router.use('/questions', require('./boutique_questions_public'));
router.use('/blog', require('./boutique_blog_public'));
router.use('/chatbot', require('./boutique_chatbot_public'));
router.use('/popup', require('./boutique_popup_public'));
router.use('/favoris', require('./boutique_favoris_public'));
router.use('/avis', require('./boutique_avis_public'));
router.use('/parution', require('./boutique_parution_public'));
router.use('/verificateur-age', require('./boutique_verificateur_age_public'));
router.use('/favicon', require('./boutique_favicon_public'));
router.use('/pwa', require('./boutique_pwa_public'));
router.use('/acheteur/:gid/inscription', require('./boutique_inscription'));

// Acheteur connecté : panier, caisse, commandes (compte acheteur du MV réutilisé)
router.use('/acheteur/:gid', require('./boutique_acheteur'));

module.exports = router;