// CHEMIN : services/vitrines_templates.js
// Identifiants des templates « Sites Vitrine » (même liste que la catégorie vitrines de src/pages/PageTemplates.tsx).
// ⚠️ À CHAQUE NOUVEAU TEMPLATE VITRINE : ajouter son identifiant ici, sinon Favicon et App installable ne s'appliquent pas à son site.

'use strict';

const TEMPLATES_VITRINE = new Set([
  'vitrine-carte', 'vitrine-evenementiel', 'vitrine-portfolio', 'vitrine-cv',
  'vitrine-pro-entrepreneur', 'vitrine-pro-tech', 'vitrine-pro-beaute', 'vitrine-pro-mariage',
  'vitrine-pro-sante', 'vitrine-paysager', 'cours-danse', 'cours-peinture',
  'cours-equitation', 'cours-yoga', 'cours-cuisine', 'cours-web',
  'cours-langues', 'cours-piano', 'cours-coach', 'vitrine-boulangerie',
  'vitrine-foodtruck', 'vitrine-resto', 'vitrine-bistro', 'agricole',
  'vitrine-avocat', 'salon-coiffure', 'reservation-restaurant', 'reservation-service',
  'reservation-spectacle',
]);

module.exports = { TEMPLATES_VITRINE, estVitrine: (id) => TEMPLATES_VITRINE.has(String(id || '')) };