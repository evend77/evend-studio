// src/utils/monetisationPub.js
const pool = require('../../db');

// Retourne le montant fixe ($/clic) dû à ce gestionnaire — son montant personnalisé
// s'il en a un, sinon la valeur par défaut globale configurée par l'admin.
async function getMontantParClic(gestionnaire_id) {
  const gestionnaireResult = await pool.query(
    'SELECT montant_par_clic FROM gestionnaires WHERE id = $1',
    [gestionnaire_id]
  );
  if (gestionnaireResult.rows.length === 0) return null;

  let montantParClic = gestionnaireResult.rows[0].montant_par_clic;
  if (montantParClic === null) {
    const cfg = await pool.query('SELECT montant_par_clic_defaut FROM configuration_monetisation_pub WHERE id = 1');
    montantParClic = parseFloat(cfg.rows[0]?.montant_par_clic_defaut ?? 0.10);
  } else {
    montantParClic = parseFloat(montantParClic);
  }
  return montantParClic;
}

module.exports = { getMontantParClic };