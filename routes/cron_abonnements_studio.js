// routes/cron_abonnements_studio.js
// ============================================================
// Cron — Gestion des essais et suppressions e-Vend Studio
// ============================================================
// Vérifie quotidiennement :
//   J-1 avant fin essai  → rappel courriel (template #66)
//   Fin essai (J0)       → courriel "essai terminé" (template #67)
//   J+2 (48h après fin)  → soft-delete si toujours aucun paiement
//
// Le soft-delete marque le compte 'a_supprimer' —
// une deuxième passe supprime réellement les données 24h plus tard.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://e-vendstudio.ca';
const FROM_EMAIL   = process.env.FROM_EMAIL   || 'contact@e-vendstudio.ca';

// ─────────────────────────────────────────────────────────────
// HELPER — Email SES
// ─────────────────────────────────────────────────────────────
async function sendEmail(destinataire, sujet, html) {
  try {
    const ses = new SESClient({
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    await ses.send(new SendEmailCommand({
      Destination: { ToAddresses: [destinataire] },
      Message: {
        Subject: { Data: sujet, Charset: 'UTF-8' },
        Body:    { Html:  { Data: html,  Charset: 'UTF-8' } },
      },
      Source: FROM_EMAIL,
    }));
    return true;
  } catch (err) {
    console.error(`   ❌ Erreur email SES → ${destinataire}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER — Email via template BD
// ─────────────────────────────────────────────────────────────
async function sendEmailSiActif(templateId, destinataire, variables = {}) {
  try {
    const r = await pool.query(
      'SELECT actif, sujet, html FROM email_templates WHERE id = $1 LIMIT 1',
      [templateId]
    );
    if (!r.rows.length) { console.log(`   ⚠️  Template #${templateId} non trouvé`); return false; }
    const tpl = r.rows[0];
    if (!tpl.actif) { console.log(`   ⏭️  Template #${templateId} désactivé`); return false; }

    const dateStr = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    let html = tpl.html, sujet = tpl.sujet;
    const vars = { date: dateStr, nom_boutique: 'e-Vend Studio', lien_dashboard: `${FRONTEND_URL}/dashboard`, ...variables };
    for (const [k, v] of Object.entries(vars)) {
      html  = html.split(`{$${k}}`).join(String(v ?? ''));
      sujet = sujet.split(`{$${k}}`).join(String(v ?? ''));
    }
    await sendEmail(destinataire, sujet, html);
    console.log(`   📧 Template #${templateId} → ${destinataire}`);
    return true;
  } catch (err) {
    console.error(`   ❌ Erreur template #${templateId}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER — Formater une date lisible
// ─────────────────────────────────────────────────────────────
function formaterDate(date) {
  return new Date(date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────
// CORE — Passe 1 : rappels + marquage soft-delete
// ─────────────────────────────────────────────────────────────
async function verifierEssais() {
  console.log('\n⏰ Cron abonnements Studio — vérification des essais...');

  const maintenant   = new Date();
  const dans24h      = new Date(maintenant.getTime() + 24 * 60 * 60 * 1000);
  const il_y_a_48h   = new Date(maintenant.getTime() - 48 * 60 * 60 * 1000);

  try {
    // Récupérer tous les essais actifs (pas encore payants, pas encore supprimés)
    const essais = await pool.query(
      `SELECT a.*, g.email, g.nom, g.nom_boutique
       FROM abonnements_studio a
       JOIN gestionnaires g ON g.id = a.gestionnaire_id
       WHERE a.statut IN ('essai', 'expire')
         AND a.essai_fin IS NOT NULL`
    );

    for (const abo of essais.rows) {
      const essaiFin    = new Date(abo.essai_fin);
      const label       = `${abo.email} (gestionnaire ${abo.gestionnaire_id})`;
      const nomGest     = abo.nom || abo.nom_boutique || abo.email;
      const dateEssaiFin = formaterDate(essaiFin);

      // ── CAS 1 : Rappel J-1 (essai se termine dans les prochaines 24h) ──
      if (essaiFin > maintenant && essaiFin <= dans24h && !abo.rappel_j1_envoye) {
        console.log(`   📢 J-1 essai → ${label}`);
        await sendEmailSiActif(66, abo.email, {
          nom_gestionnaire:  nomGest,
          date_fin_essai:    dateEssaiFin,
          lien_paiement:     `${FRONTEND_URL}/dashboard?configurer-paiement=1`,
        });
        await pool.query(
          `UPDATE abonnements_studio SET rappel_j1_envoye = TRUE WHERE id = $1`, [abo.id]
        );
      }

      // ── CAS 2 : Essai terminé (J0) — aucun paiement reçu ──
      if (essaiFin <= maintenant && abo.statut === 'essai' && !abo.rappel_fin_essai_envoye) {
        console.log(`   ⏰ Fin essai → ${label}`);
        await pool.query(
          `UPDATE abonnements_studio SET statut = 'expire', updated_at = NOW() WHERE id = $1`, [abo.id]
        );
        await pool.query(
          `UPDATE gestionnaires SET statut_abo = 'expire' WHERE id = $1`, [abo.gestionnaire_id]
        );
        await sendEmailSiActif(67, abo.email, {
          nom_gestionnaire:  nomGest,
          date_fin_essai:    dateEssaiFin,
          date_suppression:  formaterDate(new Date(essaiFin.getTime() + 48 * 60 * 60 * 1000)),
          lien_paiement:     `${FRONTEND_URL}/dashboard?configurer-paiement=1`,
        });
        await pool.query(
          `UPDATE abonnements_studio SET rappel_fin_essai_envoye = TRUE WHERE id = $1`, [abo.id]
        );
      }

      // ── CAS 3 : +48h après fin essai — dernière chance avant suppression ──
      if (essaiFin <= il_y_a_48h && abo.statut === 'expire' && !abo.rappel_suppression_envoye) {
        console.log(`   🚨 Dernière chance → ${label}`);
        await sendEmailSiActif(68, abo.email, {
          nom_gestionnaire:  nomGest,
          lien_paiement:     `${FRONTEND_URL}/dashboard?configurer-paiement=1`,
        });
        // Marquer pour suppression définitive dans la prochaine passe
        await pool.query(
          `UPDATE abonnements_studio
           SET statut = 'a_supprimer', rappel_suppression_envoye = TRUE, updated_at = NOW()
           WHERE id = $1`,
          [abo.id]
        );
        await pool.query(
          `UPDATE gestionnaires SET statut_abo = 'a_supprimer' WHERE id = $1`, [abo.gestionnaire_id]
        );
      }
    }

    console.log('   ✅ Passe 1 (rappels) terminée');
  } catch (err) {
    console.error('❌ Erreur passe 1:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// CORE — Passe 2 : suppression physique des comptes marqués
// Les comptes 'a_supprimer' depuis plus de 24h sont supprimés.
// Le ON DELETE CASCADE sur toutes les FK s'occupe des données liées.
// ─────────────────────────────────────────────────────────────
async function supprimerComptesExpires() {
  console.log('\n🗑️  Cron — suppression des comptes expirés...');

  try {
    const il_y_a_24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const aSupprimer = await pool.query(
      `SELECT a.gestionnaire_id, g.email, g.nom, g.nom_boutique
       FROM abonnements_studio a
       JOIN gestionnaires g ON g.id = a.gestionnaire_id
       WHERE a.statut = 'a_supprimer'
         AND a.updated_at < $1`,
      [il_y_a_24h]
    );

    for (const compte of aSupprimer.rows) {
      const label = `${compte.email} (gestionnaire ${compte.gestionnaire_id})`;
      try {
        // La suppression du gestionnaire cascade sur tous les sites, domaines, etc.
        await pool.query(`DELETE FROM gestionnaires WHERE id = $1`, [compte.gestionnaire_id]);
        console.log(`   🗑️  Compte supprimé : ${label}`);
      } catch (err) {
        console.error(`   ❌ Erreur suppression ${label}:`, err.message);
      }
    }

    console.log(`   ✅ ${aSupprimer.rows.length} compte(s) traité(s)`);
  } catch (err) {
    console.error('❌ Erreur passe 2 (suppression):', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// DÉMARRER — appelé depuis server.js
// ─────────────────────────────────────────────────────────────
function demarrer() {
  console.log('⏰ Cron abonnements Studio démarré (vérification toutes les heures)');

  // Passe 1 : rappels (vérification horaire — assez fréquent pour ne pas rater
  // une fin d'essai qui tombe en milieu de nuit)
  const runPasse1 = async () => {
    try { await verifierEssais(); }
    catch (err) { console.error('❌ Cron passe 1:', err.message); }
  };

  // Passe 2 : suppression (1x/jour suffit)
  const runPasse2 = async () => {
    try { await supprimerComptesExpires(); }
    catch (err) { console.error('❌ Cron passe 2:', err.message); }
  };

  // Premier run au démarrage (après un délai pour laisser le serveur s'initialiser)
  setTimeout(runPasse1, 60 * 1000);
  setTimeout(runPasse2, 90 * 1000);

  // Runs périodiques
  setInterval(runPasse1, 60 * 60 * 1000);        // toutes les heures
  setInterval(runPasse2, 24 * 60 * 60 * 1000);   // 1x par jour
}

// ─────────────────────────────────────────────────────────────
// ENDPOINTS ADMIN — déclencher manuellement depuis le dashboard
// ─────────────────────────────────────────────────────────────
router.post('/lancer-rappels', authenticateToken, isAdmin, async (req, res) => {
  verifierEssais().catch(err => console.error('❌ Run manuel passe 1:', err.message));
  res.json({ success: true, message: 'Passe rappels lancée en arrière-plan — vérifiez les logs.' });
});

router.post('/lancer-suppression', authenticateToken, isAdmin, async (req, res) => {
  supprimerComptesExpires().catch(err => console.error('❌ Run manuel passe 2:', err.message));
  res.json({ success: true, message: 'Passe suppression lancée en arrière-plan — vérifiez les logs.' });
});

router.get('/statut-essais', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.statut, a.essai_fin, a.rappel_j1_envoye, a.rappel_fin_essai_envoye,
              a.rappel_suppression_envoye, g.email, g.nom_boutique
       FROM abonnements_studio a
       JOIN gestionnaires g ON g.id = a.gestionnaire_id
       WHERE a.statut IN ('essai','expire','a_supprimer')
       ORDER BY a.essai_fin ASC LIMIT 50`
    );
    res.json({ essais: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.demarrer = demarrer;