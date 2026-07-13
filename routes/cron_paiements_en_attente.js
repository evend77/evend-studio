// routes/cron_paiements_en_attente.js
// e-Vend Studio — Relance courriel si un paiement (réservation ou abonnement)
// reste "en attente" plus de 45 minutes. Un seul envoi par réservation/abonnement
// (flag relance_paiement_envoyee), même pattern que cron_reservations.js.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const BACKEND_URL = process.env.BACKEND_URL || 'https://www.e-vendstudio.ca';
const DELAI_MINUTES = 45;

// ─────────────────────────────────────────────────────────────
// CORE — Relance réservations en attente de paiement
// ─────────────────────────────────────────────────────────────
async function relancerReservations() {
  console.log('\n⏰ Cron paiements — vérification des réservations en attente...');
  try {
    const result = await pool.query(
      `SELECT r.*, s.config, g.email as gestionnaire_email
       FROM reservations r
       JOIN sites s ON s.id = r.site_id
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE r.statut_paiement = 'en_attente'
         AND r.relance_paiement_envoyee IS NOT TRUE
         AND r.created_at <= NOW() - ($1 || ' minutes')::interval`,
      [DELAI_MINUTES]
    );

    const { envoyerCourrielReservation } = require('./reservations');

    for (const reservation of result.rows) {
      const configSite = { ...(reservation.config || {}), gestionnaireEmail: reservation.gestionnaire_email };
      const lienPaiement = `${BACKEND_URL}/paiement?type=reservation&id=${reservation.id}`;
      console.log(`   📢 Relance paiement réservation #${reservation.id} → ${reservation.email_client}`);
      await envoyerCourrielReservation('paiement_en_attente', reservation, configSite, { lienPaiement });
      await pool.query(`UPDATE reservations SET relance_paiement_envoyee = TRUE WHERE id = $1`, [reservation.id]);
    }
    console.log(`   ✅ ${result.rows.length} relance(s) réservation envoyée(s)`);
  } catch (err) {
    console.error('❌ Erreur cron relance réservations:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// CORE — Relance abonnements en attente de paiement
// ─────────────────────────────────────────────────────────────
async function relancerAbonnements() {
  console.log('\n⏰ Cron paiements — vérification des abonnements en attente...');
  try {
    const result = await pool.query(
      `SELECT a.*, f.titre as formation_titre, s.config, g.email as gestionnaire_email
       FROM abonnements_clients a
       JOIN formations f ON f.id = a.formation_id
       JOIN sites s ON s.id = a.site_id
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE a.statut = 'en_attente_paiement'
         AND a.relance_paiement_envoyee IS NOT TRUE
         AND a.created_at <= NOW() - ($1 || ' minutes')::interval`,
      [DELAI_MINUTES]
    );

    const { envoyerCourrielAbonnement } = require('./abonnements');

    for (const abonnement of result.rows) {
      const configSite = { ...(abonnement.config || {}), gestionnaireEmail: abonnement.gestionnaire_email };
      const lienPaiement = `${BACKEND_URL}/paiement?type=abonnement&id=${abonnement.id}`;
      console.log(`   📢 Relance paiement abonnement #${abonnement.id} → ${abonnement.email_client}`);
      await envoyerCourrielAbonnement('paiement_en_attente', abonnement, configSite, { titre: abonnement.formation_titre }, { lienPaiement });
      await pool.query(`UPDATE abonnements_clients SET relance_paiement_envoyee = TRUE WHERE id = $1`, [abonnement.id]);
    }
    console.log(`   ✅ ${result.rows.length} relance(s) abonnement envoyée(s)`);
  } catch (err) {
    console.error('❌ Erreur cron relance abonnements:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// DÉMARRER
// ─────────────────────────────────────────────────────────────
function demarrer() {
  console.log('⏰ Cron paiements en attente démarré (vérification toutes les heures)');

  const run = async () => {
    try { await relancerReservations(); await relancerAbonnements(); }
    catch (err) { console.error('❌ Cron paiements en attente:', err.message); }
  };

  setTimeout(run, 80 * 1000);
  setInterval(run, 60 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────
// ENDPOINT ADMIN — déclencher manuellement
// ─────────────────────────────────────────────────────────────
router.post('/lancer', authenticateToken, isAdmin, async (req, res) => {
  Promise.all([relancerReservations(), relancerAbonnements()]).catch(err => console.error('❌ Run manuel relance paiements:', err.message));
  res.json({ success: true, message: 'Relance lancée en arrière-plan — vérifiez les logs.' });
});

module.exports = router;
module.exports.demarrer = demarrer;