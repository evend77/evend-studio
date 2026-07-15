// config/plansPub.js
// Anciennement codé en dur — maintenant géré depuis l'admin (table plans_pub).
const pool = require('../db');

const PLAN_PUB_DEFAUT = 'decouverte';

async function getTousLesPlansPub() {
  const result = await pool.query(
    'SELECT id, plan_key, label, max_pubs_actives, prix, actif, ordre FROM plans_pub ORDER BY ordre'
  );
  return result.rows.map(r => ({
    id: r.id,
    key: r.plan_key,
    label: r.label,
    maxPubsActives: r.max_pubs_actives === null ? null : parseInt(r.max_pubs_actives),
    prix: parseFloat(r.prix),
    actif: r.actif,
    ordre: r.ordre,
  }));
}

function versDictionnaire(plans) {
  const dict = {};
  plans.forEach(p => { dict[p.key] = p; });
  return dict;
}

module.exports = { getTousLesPlansPub, versDictionnaire, PLAN_PUB_DEFAUT };