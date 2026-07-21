// routes/cron_verification_email.js
// ============================================================
// Cron — Vérification de courriel : suspension & nettoyage
// ============================================================
// Séparé de routes/cron_abonnements_studio.js (qui gère les essais/paiements,
// une préoccupation différente).
//
// Vérifie périodiquement :
//   1) Changement d'email non reconfirmé après 48h (premiere_verification_faite
//      = true, email_verifie = false, délai expiré) → suspend le site
//      (sites.site_suspendu_email = true). Se lève automatiquement dès que
//      GET /api/gestionnaires/verifier-email/:token réussit.
//   2) Inscriptions jamais vérifiées ne serait-ce qu'une fois
//      (premiere_verification_faite = false) après un délai de grâce
//      (7 jours par défaut) → suppression du compte, pour garder la BD propre.
//      Ces comptes n'ont jamais eu accès au dashboard (bloqués par la modale),
//      donc aucune perte de données réelle à craindre.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const DELAI_GRACE_INSCRIPTION_JOURS = parseInt(process.env.DELAI_GRACE_INSCRIPTION_JOURS || '7', 10);

// ─────────────────────────────────────────────────────────────
// CORE — Passe 1 : suspendre les sites dont le changement d'email
// n'a pas été reconfirmé dans les 48h
// ─────────────────────────────────────────────────────────────
async function suspendreSitesEmailExpire() {
  console.log('\n⏰ Cron vérification email — suspension des sites...');
  try {
    const result = await pool.query(
      `UPDATE sites s
       SET site_suspendu_email = true, updated_at = NOW()
       FROM gestionnaires g
       WHERE s.gestionnaire_id = g.id
         AND g.premiere_verification_faite = true
         AND g.email_verifie = false
         AND g.email_verification_expire IS NOT NULL
         AND g.email_verification_expire < NOW()
         AND s.site_suspendu_email = false
       RETURNING s.gestionnaire_id, g.email`
    );
    for (const row of result.rows) {
      console.log(`   🚫 Site suspendu (email non reconfirmé) → ${row.email} (gestionnaire ${row.gestionnaire_id})`);
    }
    console.log(`   ✅ ${result.rowCount} site(s) suspendu(s)`);
  } catch (err) {
    console.error('❌ Erreur suspension sites (email) :', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// CORE — Passe 2 : nettoyer les inscriptions jamais vérifiées
// ─────────────────────────────────────────────────────────────
async function nettoyerInscriptionsJamaisVerifiees() {
  console.log('\n🗑️  Cron vérification email — nettoyage des inscriptions abandonnées...');
  try {
    const seuil = new Date(Date.now() - DELAI_GRACE_INSCRIPTION_JOURS * 24 * 60 * 60 * 1000);

    const aSupprimer = await pool.query(
      `SELECT id, email, created_at FROM gestionnaires
       WHERE premiere_verification_faite = false
         AND created_at < $1`,
      [seuil]
    );

    for (const compte of aSupprimer.rows) {
      try {
        // Le ON DELETE CASCADE (si configuré sur les FK) s'occupe des données liées.
        await pool.query(`DELETE FROM gestionnaires WHERE id = $1`, [compte.id]);
        console.log(`   🗑️  Inscription jamais vérifiée supprimée : ${compte.email} (créé le ${compte.created_at})`);
      } catch (err) {
        console.error(`   ❌ Erreur suppression ${compte.email}:`, err.message);
      }
    }
    console.log(`   ✅ ${aSupprimer.rows.length} compte(s) nettoyé(s)`);
  } catch (err) {
    console.error('❌ Erreur nettoyage inscriptions :', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// DÉMARRER — appelé depuis server.js
// ─────────────────────────────────────────────────────────────
function demarrer() {
  console.log(`⏰ Cron vérification email démarré (suspension : horaire · nettoyage : quotidien, délai ${DELAI_GRACE_INSCRIPTION_JOURS}j)`);

  const runSuspension = async () => {
    try { await suspendreSitesEmailExpire(); }
    catch (err) { console.error('❌ Cron suspension:', err.message); }
  };
  const runNettoyage = async () => {
    try { await nettoyerInscriptionsJamaisVerifiees(); }
    catch (err) { console.error('❌ Cron nettoyage:', err.message); }
  };

  // Premier run au démarrage (décalé pour laisser le serveur s'initialiser)
  setTimeout(runSuspension, 45 * 1000);
  setTimeout(runNettoyage, 75 * 1000);

  // Runs périodiques
  setInterval(runSuspension, 60 * 60 * 1000);       // toutes les heures — le délai est de 48h, pas besoin plus fréquent
  setInterval(runNettoyage, 24 * 60 * 60 * 1000);   // 1x par jour

  return { runSuspension, runNettoyage };
}

// ─────────────────────────────────────────────────────────────
// ENDPOINTS ADMIN — déclencher manuellement / consulter l'état
// ─────────────────────────────────────────────────────────────
router.post('/lancer-suspension', authenticateToken, isAdmin, async (req, res) => {
  suspendreSitesEmailExpire().catch(err => console.error('❌ Run manuel suspension:', err.message));
  res.json({ success: true, message: 'Passe de suspension lancée en arrière-plan — vérifiez les logs.' });
});

router.post('/lancer-nettoyage', authenticateToken, isAdmin, async (req, res) => {
  nettoyerInscriptionsJamaisVerifiees().catch(err => console.error('❌ Run manuel nettoyage:', err.message));
  res.json({ success: true, message: 'Passe de nettoyage lancée en arrière-plan — vérifiez les logs.' });
});

router.get('/statut', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { rows: enAttente } = await pool.query(
      `SELECT id, email, nom, premiere_verification_faite, email_verifie, email_verification_expire, created_at
       FROM gestionnaires
       WHERE email_verifie = false
       ORDER BY email_verification_expire ASC NULLS LAST LIMIT 50`
    );
    const { rows: sitesSuspendus } = await pool.query(
      `SELECT s.gestionnaire_id, g.email, g.nom, s.updated_at
       FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id
       WHERE s.site_suspendu_email = true
       ORDER BY s.updated_at DESC LIMIT 50`
    );
    res.json({ en_attente_verification: enAttente, sites_suspendus: sitesSuspendus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.demarrer = demarrer;