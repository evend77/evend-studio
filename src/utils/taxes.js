// src/utils/taxes.js
// e-Vend Studio — Calcul de taxes pour les réservations/abonnements École-Cours.
// Règle établie : service rendu à un endroit fixe (le studio) → la taxe suit
// LA PROVINCE DU GESTIONNAIRE, pas celle du client. Un seul taux fixe par
// gestionnaire, appliqué à toutes ses ventes peu importe d'où vient le client.
//
// Le taux appliqué est celui SAUVEGARDÉ SUR LE GESTIONNAIRE (gestionnaires.taux_tps
// / taux_provincial) — pas une table admin partagée. Ça permet à chaque
// gestionnaire d'ajuster son propre taux si le gouvernement change les règles,
// sans jamais toucher au code. La table taux_taxes_provinces ne sert qu'à
// PRÉREMPLIR ces champs par défaut quand le gestionnaire choisit sa province
// dans Mon Profil — elle n'est jamais consultée au moment du calcul réel.
//
// Si le gestionnaire n'a pas activé "est_entreprise_enregistree" (Mon Profil),
// aucune taxe n'est calculée — beaucoup de petits commerces sous le seuil de
// 30 000$/an ne sont pas obligés de facturer la TPS/TVH.

async function calculerTaxesParSite(pool, montantHT, siteId) {
  const gestResult = await pool.query(
    `SELECT g.est_entreprise, g.province_entreprise, g.taux_tps, g.taux_provincial
     FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id
     WHERE s.id = $1`,
    [siteId]
  );
  const g = gestResult.rows[0];

  if (!g || !g.est_entreprise) {
    return { taxable: false, montantHT: Number(montantHT), tps: 0, provincial: 0, total: Number(montantHT), province: null };
  }

  const tauxTps = Number(g.taux_tps || 0);
  const tauxProvincial = Number(g.taux_provincial || 0);

  const tps = Math.round(Number(montantHT) * tauxTps * 100) / 100;
  const provincial = Math.round(Number(montantHT) * tauxProvincial * 100) / 100;
  const total = Math.round((Number(montantHT) + tps + provincial) * 100) / 100;

  return {
    taxable: tauxTps > 0 || tauxProvincial > 0,
    montantHT: Number(montantHT),
    tps, provincial, total,
    tauxTpsRate: tauxTps,
    tauxProvincialRate: tauxProvincial,
    province: g.province_entreprise,
  };
}

module.exports = { calculerTaxesParSite };