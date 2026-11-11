// CHEMIN : routes/boutique_index.js
// e-Vend Studio — Point d'entrée des routes des templates boutique (solo). Monté sur /api/boutique dans server.js.
// Chaque nouveau morceau du solo (panier, commandes, catalogue public…) s'ajoute ici, jamais dans server.js.
//
// Deux zones, pour que les gardes de sécurité ne se mélangent jamais :
//   /api/boutique/gestionnaire/…  → partie privée du gestionnaire (connecté, rôle gestionnaire)
//   /api/boutique/public/…        → catalogue public (à venir, étapes suivantes)
//   /api/boutique/acheteur/…      → panier, commandes de l'acheteur (à venir)

const express = require('express');
const router = express.Router();

router.use('/gestionnaire', require('./boutique_produits'));
router.use('/gestionnaire/paiement', require('./boutique_paiement_config'));
router.use('/gestionnaire/expedition', require('./boutique_expedition_config'));
router.use('/gestionnaire/taxes', require('./boutique_taxes_config'));

module.exports = router;