// CHEMIN : services/studio_vacances.js
// e-Vend Studio — Mode vacances du collaborateur.
//  • « visible » : les annonces restent en vente, un bandeau (message + date de retour) s'affiche sur la boutique, les fiches produit et le paiement.
//  • « masque »  : la boutique et ses annonces disparaissent du catalogue, de la recherche et de la liste des boutiques ; achat impossible
//                  (sauf paiement d'une enchère déjà gagnée). Les enchères en cours se terminent normalement ; aucune nouvelle enchère.
// Rien n'est modifié dans les annonces : le mode est calculé à chaque lecture (actif entre la date de début et la date de retour).
// Le mode n'agit que si le gestionnaire l'autorise (Config multi → « Mode vacances vendeur »).

const pool = require('../db');

const FUSEAU = 'America/Toronto';
const MESSAGE_DEFAUT = 'Ce vendeur est en vacances. Les commandes seront traitées à son retour.';
const AUJOURDHUI = `(NOW() AT TIME ZONE '${FUSEAU}')::date`;

// Fragments SQL. Alias attendus : mc (marketplace_collaborateurs) et cvac (collaborateur_config, jointure gauche).
const VAC_JOIN = 'LEFT JOIN collaborateur_config cvac ON cvac.collaborateur_id = mc.id';
const VAC_ACTIF = `(cvac.vacances IS TRUE
  AND COALESCE((SELECT st.config->'multivendeur'->>'vacances_vendeur' FROM sites st WHERE st.gestionnaire_id = mc.gestionnaire_id LIMIT 1), '') = 'true'
  AND (cvac.vacances_debut IS NULL OR cvac.vacances_debut <= ${AUJOURDHUI})
  AND (cvac.vacances_retour IS NULL OR cvac.vacances_retour > ${AUJOURDHUI}))`;
const VAC_MASQUE = `(${VAC_ACTIF} AND COALESCE(cvac.vacances_mode, 'visible') = 'masque')`;
const VAC_COLS = `${VAC_ACTIF} AS vac_actif, COALESCE(cvac.vacances_mode, 'visible') AS vac_mode, cvac.vacances_message AS vac_message, cvac.vacances_retour::text AS vac_retour`;

// Ligne SQL (colonnes VAC_COLS) → objet public, ou null
function publicDe(r) {
  if (!r || r.vac_actif !== true) return null;
  const message = typeof r.vac_message === 'string' && r.vac_message.trim() ? r.vac_message.trim() : MESSAGE_DEFAUT;
  return { mode: r.vac_mode === 'masque' ? 'masque' : 'visible', message, retour: r.vac_retour ? String(r.vac_retour).slice(0, 10) : null };
}

// État d'un collaborateur (pour les routes serveur)
async function etat(db, gid, collaborateurId) {
  const r = await (db || pool).query(
    `SELECT mc.id, ${VAC_COLS}
       FROM marketplace_collaborateurs mc ${VAC_JOIN}
      WHERE mc.id = $1 AND mc.gestionnaire_id = $2`, [collaborateurId, gid]);
  return publicDe(r.rows[0]);
}

function dateFr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${parseInt(m[3], 10)}${m[3] === '01' ? 'er' : ''} ${mois[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

// Message affiché quand un achat est refusé (mode « annonces masquées »)
function texteBlocage(v) {
  return `Cette boutique est en vacances${v && v.retour ? ` (de retour le ${dateFr(v.retour)})` : ''} : les achats sont temporairement fermés.`;
}

async function estMasque(db, gid, collaborateurId) {
  const v = await etat(db, gid, collaborateurId);
  return !!(v && v.mode === 'masque');
}

// Le gestionnaire autorise-t-il le mode vacances ?
async function permisParGestionnaire(db, gid) {
  const r = await (db || pool).query(`SELECT config->'multivendeur'->>'vacances_vendeur' AS v FROM sites WHERE gestionnaire_id = $1 LIMIT 1`, [gid]);
  return !!(r.rows[0] && r.rows[0].v === 'true');
}

module.exports = { FUSEAU, MESSAGE_DEFAUT, VAC_JOIN, VAC_ACTIF, VAC_MASQUE, VAC_COLS, publicDe, etat, estMasque, texteBlocage, dateFr, permisParGestionnaire };