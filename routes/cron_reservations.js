// routes/cron_reservations.js
// ============================================================
// Cron — Rappel de réservation 24h avant (courriel "rappel")
// ============================================================
// Vérifie régulièrement les réservations confirmées dont la date
// tombe dans les prochaines 24h, et envoie le courriel de rappel
// (modèle "rappel" du gestionnaire — sites.config.modeles_courriel.rappel —
// avec repli automatique si aucun modèle actif, même logique que la
// confirmation/annulation dans routes/reservations.js).
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { envoyerCourrielReservation } = require('./reservations');

// ─────────────────────────────────────────────────────────────
// CORE — Rappels 24h avant
// ─────────────────────────────────────────────────────────────
async function verifierRappels24h() {
  console.log('\n⏰ Cron réservations — vérification des rappels 24h...');

  const maintenant = new Date();
  const dans24h     = new Date(maintenant.getTime() + 24 * 60 * 60 * 1000);

  try {
    // Réservations confirmées dont le cours/rendez-vous a lieu dans les
    // prochaines 24h, et pour lesquelles le rappel n'a pas encore été envoyé.
    const result = await pool.query(
      `SELECT r.*, s.config, g.email as gestionnaire_email
       FROM reservations r
       JOIN sites s ON s.id = r.site_id
       JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE r.statut = 'confirmee'
         AND r.rappel_envoye IS NOT TRUE
         AND r.date_debut > $1
         AND r.date_debut <= $2
         AND r.email_client IS NOT NULL`,
      [maintenant, dans24h]
    );

    for (const reservation of result.rows) {
      const configSite = {
        ...(reservation.config || {}),
        gestionnaireEmail: reservation.gestionnaire_email,
      };
      console.log(`   📢 Rappel 24h → ${reservation.email_client} (réservation #${reservation.id})`);
      await envoyerCourrielReservation('rappel', reservation, configSite);
      await pool.query(`UPDATE reservations SET rappel_envoye = TRUE WHERE id = $1`, [reservation.id]);
    }

    console.log(`   ✅ ${result.rows.length} rappel(s) envoyé(s)`);
  } catch (err) {
    console.error('❌ Erreur cron rappels réservations:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// DÉMARRER — appelé depuis server.js
// ─────────────────────────────────────────────────────────────
function demarrer() {
  console.log('⏰ Cron réservations démarré (vérification toutes les heures)');

  const runRappels = async () => {
    try { await verifierRappels24h(); }
    catch (err) { console.error('❌ Cron rappels réservations:', err.message); }
  };

  // Premier run au démarrage (après un délai pour laisser le serveur s'initialiser)
  setTimeout(runRappels, 75 * 1000);

  // Run périodique — horaire, pour rester précis à ±1h près sur le délai de 24h
  setInterval(runRappels, 60 * 60 * 1000);
}

// ─────────────────────────────────────────────────────────────
// ENDPOINT ADMIN — déclencher manuellement depuis le dashboard
// ─────────────────────────────────────────────────────────────
router.post('/lancer-rappels', authenticateToken, isAdmin, async (req, res) => {
  verifierRappels24h().catch(err => console.error('❌ Run manuel rappels réservations:', err.message));
  res.json({ success: true, message: 'Passe de rappels lancée en arrière-plan — vérifiez les logs.' });
});

module.exports = router;
module.exports.demarrer = demarrer;