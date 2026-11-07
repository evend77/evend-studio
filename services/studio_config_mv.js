// CHEMIN : services/studio_config_mv.js
// e-Vend Studio — Lecture centralisée de « Configuration marketplace » (sites.config.multivendeur) par les routes serveur :
// fuseau horaire, devise, inscriptions, avis, limites… Une seule façon de lire, avec des valeurs par défaut sûres.

const pool = require('../db');

const FUSEAU_DEFAUT = 'America/Toronto';
// Liste blanche : seuls ces fuseaux sont acceptés (une valeur inconnue retombe sur Toronto, sans jamais casser une requête SQL)
const FUSEAUX = [
  'America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Regina', 'America/Winnipeg',
  'America/Halifax', 'America/St_Johns', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/Paris', 'Europe/London',
];
const DEVISES = ['CAD', 'USD', 'EUR', 'GBP'];

async function lire(gid, db) {
  try {
    const r = await (db || pool).query(`SELECT config->'multivendeur' AS mv FROM sites WHERE gestionnaire_id = $1 LIMIT 1`, [gid]);
    const mv = r.rows[0] && r.rows[0].mv;
    return mv && typeof mv === 'object' ? mv : {};
  } catch (e) { return {}; }
}

const fuseauDe = (mv) => (mv && FUSEAUX.includes(mv.fuseau_horaire) ? mv.fuseau_horaire : FUSEAU_DEFAUT);
const deviseDe = (mv) => (mv && DEVISES.includes(String(mv.devise || '').toUpperCase()) ? String(mv.devise).toUpperCase() : 'CAD');
const fuseau = async (gid, db) => fuseauDe(await lire(gid, db));
const devise = async (gid, db) => deviseDe(await lire(gid, db));

// Interrupteur booléen : valeur absente → défaut
const actif = (mv, cle, defaut) => (mv && mv[cle] !== undefined && mv[cle] !== null ? (mv[cle] === true || mv[cle] === 'true') : defaut);

// Fragment SQL : fuseau du gestionnaire (expr = colonne/valeur SQL de l'id du gestionnaire). Toujours un fuseau de la liste blanche.
function fuseauSql(expr) {
  const liste = FUSEAUX.map((f) => `'${f}'`).join(',');
  return `COALESCE((SELECT CASE WHEN st.config->'multivendeur'->>'fuseau_horaire' IN (${liste}) THEN st.config->'multivendeur'->>'fuseau_horaire' END
                      FROM sites st WHERE st.gestionnaire_id = ${expr} LIMIT 1), '${FUSEAU_DEFAUT}')`;
}

// Montant formaté selon la devise : « 45,00 $ », « 45,00 $ US », « 45,00 € », « 45,00 £ »
function montant(n, dev) {
  const v = Number(n || 0).toFixed(2).replace('.', ',');
  const d = String(dev || 'CAD').toUpperCase();
  return d === 'EUR' ? `${v} €` : d === 'GBP' ? `${v} £` : d === 'USD' ? `${v} $ US` : `${v} $`;
}

module.exports = { FUSEAUX, DEVISES, FUSEAU_DEFAUT, lire, fuseau, fuseauDe, devise, deviseDe, actif, fuseauSql, montant };