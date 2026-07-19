// src/utils/monetisationPub.js
// Gère aussi maintenant getTauxTaxes()/calculerTaxes() — utilisées à la fois
// par la recharge du portefeuille sponsor ET la facturation d'abonnement Studio.
// Nom du fichier resté tel quel pour éviter de casser tous les imports existants.
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

// Calcule TPS/TVQ sur un montant, à partir des taux configurés dans l'admin
// (Configuration Générale → Généralités → Taux de taxes, table configuration_generale_admin)
// — jamais codés en dur, pour survivre à un changement de taux gouvernemental
// sans toucher au code. Sert à tout le site (Studio, portefeuille sponsor, etc.).
async function getTauxTaxes() {
  const cfg = await pool.query('SELECT taux_tps, taux_tvq FROM configuration_generale_admin WHERE id = 1');
  return {
    tps: parseFloat(cfg.rows[0]?.taux_tps ?? 0.05),
    tvq: parseFloat(cfg.rows[0]?.taux_tvq ?? 0.09975),
  };
}

async function calculerTaxes(montantHT) {
  const taux = await getTauxTaxes();
  const tps = Math.round(montantHT * taux.tps * 100) / 100;
  const tvq = Math.round(montantHT * taux.tvq * 100) / 100;
  return { tps, tvq, total: Math.round((montantHT + tps + tvq) * 100) / 100 };
}

module.exports.getTauxTaxes = getTauxTaxes;
module.exports.calculerTaxes = calculerTaxes;

// Numéros de taxes de e-Vend Studio elle-même — à afficher sur les factures
// (Configuration Générale → Généralités → Taux de taxes).
async function getNumerosTaxesPlateforme() {
  const cfg = await pool.query('SELECT no_tps_plateforme, no_tvq_plateforme FROM configuration_generale_admin WHERE id = 1');
  return {
    no_tps: cfg.rows[0]?.no_tps_plateforme || null,
    no_tvq: cfg.rows[0]?.no_tvq_plateforme || null,
  };
}

module.exports.getNumerosTaxesPlateforme = getNumerosTaxesPlateforme;