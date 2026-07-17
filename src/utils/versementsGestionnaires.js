// src/utils/versementsGestionnaires.js
// Vérifie si un gestionnaire a atteint le seuil minimum de versement (configurable
// dans l'admin → Monétisation) pour son solde de revenus publicitaires, et exécute
// le virement Stripe Connect si oui. Appelé à chaque cycle de facturation réussi
// du gestionnaire (voir webhooks_studio_stripe.js) — jamais sur une simple minuterie,
// pour rester aligné avec "au prochain cycle de facturation" tel que discuté.
const pool = require('../../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function verifierEtPayerGestionnaire(gestionnaire_id, options = {}) {
  const ignorerSeuil = !!options.ignorerSeuil;
  try {
    const soldeResult = await pool.query(
      'SELECT solde_du FROM soldes_gestionnaires_pub WHERE gestionnaire_id = $1',
      [gestionnaire_id]
    );
    if (soldeResult.rows.length === 0) return; // aucun revenu pub accumulé, rien à faire
    const soldeDu = parseFloat(soldeResult.rows[0].solde_du);
    if (soldeDu <= 0) return;

    const cfgResult = await pool.query(
      'SELECT seuil_versement_gestionnaire FROM configuration_monetisation_pub WHERE id = 1'
    );
    const seuil = parseFloat(cfgResult.rows[0]?.seuil_versement_gestionnaire ?? 10);

    if (!ignorerSeuil && soldeDu < seuil) {
      console.log(`   ℹ️  Solde pub de ${soldeDu.toFixed(2)}$ pour gestionnaire ${gestionnaire_id} — sous le seuil de ${seuil}$, accumulation`);
      return;
    }

    const optResult = await pool.query(
      'SELECT stripe_account_id, stripe_verifie FROM options_gestionnaire WHERE gestionnaire_id = $1',
      [gestionnaire_id]
    );
    const opt = optResult.rows[0];

    if (!opt?.stripe_account_id || !opt?.stripe_verifie) {
      console.log(`   ⚠️  Gestionnaire ${gestionnaire_id} doit ${soldeDu.toFixed(2)}$ mais n'a pas de compte Stripe Connect vérifié — le solde reste en attente`);
      await pool.query(
        `INSERT INTO versements_gestionnaires (gestionnaire_id, montant, statut, erreur)
         VALUES ($1, $2, 'echec', 'Compte Stripe Connect non configuré ou non vérifié')`,
        [gestionnaire_id, soldeDu]
      );
      return; // ⚠️ on NE remet PAS solde_du à 0 — l'argent reste dû, juste pas encore payable
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(soldeDu * 100),
        currency: 'cad',
        destination: opt.stripe_account_id,
        description: 'Revenu publicitaire e-Vend Studio',
      });

      await pool.query(
        `UPDATE soldes_gestionnaires_pub SET solde_du = 0, updated_at = NOW() WHERE gestionnaire_id = $1`,
        [gestionnaire_id]
      );
      await pool.query(
        `INSERT INTO versements_gestionnaires (gestionnaire_id, montant, stripe_transfer_id, statut)
         VALUES ($1, $2, $3, 'envoye')`,
        [gestionnaire_id, soldeDu, transfer.id]
      );

      console.log(`   💸 Versement de ${soldeDu.toFixed(2)}$ envoyé au gestionnaire ${gestionnaire_id} (transfer ${transfer.id})`);
    } catch (err) {
      console.error(`   ❌ Échec du virement Stripe pour gestionnaire ${gestionnaire_id}:`, err.message);
      await pool.query(
        `INSERT INTO versements_gestionnaires (gestionnaire_id, montant, statut, erreur)
         VALUES ($1, $2, 'echec', $3)`,
        [gestionnaire_id, soldeDu, err.message]
      );
      // Le solde reste intact — on retentera au prochain cycle de facturation
    }
  } catch (err) {
    console.error(`❌ Erreur verifierEtPayerGestionnaire (gestionnaire ${gestionnaire_id}):`, err.message);
  }
}

module.exports = { verifierEtPayerGestionnaire };