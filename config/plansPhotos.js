// config/plansPhotos.js
// 🚧 Codé en dur pour l'instant — sera remplacé par une table BD gérée
// depuis une page admin plus tard. En attendant, c'est LA seule source de
// vérité — sponsors.js ET sponsorsphotos.js l'importent tous les deux d'ici,
// pour ne jamais avoir 2 chiffres différents pour le même palier.

const PLANS_PHOTOS = {
  decouverte: { label: 'Découverte', maxPhotos: 10, prix: 15 },
  standard:   { label: 'Standard',   maxPhotos: 25, prix: 29 },
  premium:    { label: 'Premium',    maxPhotos: 60, prix: 59 },
  illimite:   { label: 'Illimité',   maxPhotos: null, prix: 99 }, // null = pas de limite
};

const PLAN_PHOTOS_DEFAUT = 'decouverte';

module.exports = { PLANS_PHOTOS, PLAN_PHOTOS_DEFAUT };