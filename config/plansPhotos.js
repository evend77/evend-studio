// config/plansPhotos.js
// Anciennement codé en dur — maintenant géré depuis l'admin (table plans_photos).
// Garde le même genre d'interface (PLAN_PHOTOS_DEFAUT) pour ne pas casser les
// appelants existants, mais les plans eux-mêmes viennent de la BD.
const pool = require('../db');

const PLAN_PHOTOS_DEFAUT = 'decouverte';

// Retourne TOUS les plans (actifs et inactifs) sous forme de tableau, triés par ordre.
// Les appelants qui ont juste besoin de trouver LE plan d'un sponsor (même si ce
// plan a été désactivé depuis par l'admin) doivent chercher dans ce tableau complet,
// pas seulement les actifs — sinon un sponsor sur un plan retiré perdrait sa limite.
async function getTousLesPlansPhotos() {
  const result = await pool.query(
    'SELECT id, plan_key, label, max_photos, prix, actif, ordre FROM plans_photos ORDER BY ordre'
  );
  return result.rows.map(r => ({
    id: r.id,
    key: r.plan_key,
    label: r.label,
    maxPhotos: r.max_photos === null ? null : parseInt(r.max_photos),
    prix: parseFloat(r.prix),
    actif: r.actif,
    ordre: r.ordre,
  }));
}

// Petit utilitaire : construit un dictionnaire { plan_key: plan } à partir du tableau,
// pour retrouver rapidement le plan d'un sponsor par sa clé.
function versDictionnaire(plans) {
  const dict = {};
  plans.forEach(p => { dict[p.key] = p; });
  return dict;
}

module.exports = { getTousLesPlansPhotos, versDictionnaire, PLAN_PHOTOS_DEFAUT };