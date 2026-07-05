// routes/cron_domaine.js
// ============================================================
// Rappels d'expiration de domaine — e-Vend Studio
// Envoie un courriel 1 semaine avant l'expiration d'un domaine personnalisé
// pour avertir le gestionnaire que le renouvellement est dû, sans quoi son
// site sera mis hors service à l'expiration.
// ============================================================
// Pour démarrer : ajouter dans server.js (juste avant app.listen) :
//   const cronDomaine = require('./routes/cron_domaine');
//   cronDomaine.demarrer();
// ============================================================

const pool   = require('../db');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const dynadotService = require('./dynadot'); // réutilise calculerPrixClient / calculerTaxes

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://e-vendstudio.ca';
const FROM_EMAIL   = process.env.FROM_EMAIL   || 'contact@e-vendstudio.ca';

// ── Nombre de jours avant expiration où l'on envoie le rappel ──────────────
const JOURS_AVANT_RAPPEL = 7;

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  INTERVALLE_MS: 24 * 60 * 60 * 1000, // vérification quotidienne
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Email SES
// ─────────────────────────────────────────────────────────────────────────────
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
        Subject: { Data: sujet,  Charset: 'UTF-8' },
        Body:    { Html: { Data: html, Charset: 'UTF-8' } },
      },
      Source: FROM_EMAIL,
    }));
    return true;
  } catch (err) {
    console.error(`   ❌ Erreur email SES → ${destinataire}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Envoyer email via template BD (email_templates)
// ─────────────────────────────────────────────────────────────────────────────
async function sendEmailSiActif(templateId, destinataire, variables = {}) {
  try {
    const r = await pool.query(
      'SELECT actif, sujet, html FROM email_templates WHERE id = $1 LIMIT 1',
      [templateId]
    );
    if (r.rows.length === 0) { console.log(`   ⚠️  Template #${templateId} non trouvé — skip`); return false; }
    const tpl = r.rows[0];
    if (!tpl.actif) { console.log(`   ⏭️  Template #${templateId} désactivé — skip`); return false; }
    const dateStr = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    let html  = tpl.html;
    let sujet = tpl.sujet;
    const varsFinales = { date: dateStr, nom_boutique: 'e-Vend Studio', lien_dashboard: `${FRONTEND_URL}/dashboard`, ...variables };
    for (const [cle, val] of Object.entries(varsFinales)) {
      html  = html.split(`{$${cle}}`).join(String(val ?? ''));
      sujet = sujet.split(`{$${cle}}`).join(String(val ?? ''));
    }
    await sendEmail(destinataire, sujet, html);
    console.log(`   📧 Template #${templateId} envoyé à ${destinataire}`);
    return true;
  } catch (err) {
    console.error(`   ❌ Erreur sendEmailSiActif #${templateId}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Formater montant
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) => parseFloat(n || 0).toFixed(2).replace('.', ',') + ' $';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Formater une date Unix (ms) en date lisible fr-CA
// ─────────────────────────────────────────────────────────────────────────────
function formaterDate(timestampMs) {
  if (!timestampMs) return 'N/A';
  const d = new Date(Number(timestampMs));
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE — Vérifier les domaines qui expirent bientôt et envoyer les rappels
// ─────────────────────────────────────────────────────────────────────────────
async function verifierDomainesExpirants() {
  console.log('🌐 Vérification des domaines expirant bientôt...');

  try {
    // On récupère tous les domaines actifs avec une date d'expiration connue,
    // puis on filtre en JS (plus sûr que de manipuler des epoch ms en SQL).
    const res = await pool.query(
      `SELECT d.id, d.domaine, d.gestionnaire_id, d.expiration_date, d.prix_dynadot,
              d.dernier_rappel_envoye,
              g.nom, g.email, g.nom_boutique
       FROM domaines d
       JOIN gestionnaires g ON g.id = d.gestionnaire_id
       WHERE d.statut = 'actif' AND d.expiration_date IS NOT NULL`
    );

    if (res.rows.length === 0) {
      console.log('   ✅ Aucun domaine actif avec date d\'expiration à vérifier');
      return;
    }

    const maintenant = Date.now();
    let envoyes = 0;

    for (const d of res.rows) {
      const expirationMs = Number(d.expiration_date);
      if (isNaN(expirationMs)) continue;

      const joursRestants = Math.ceil((expirationMs - maintenant) / (1000 * 60 * 60 * 24));

      // On envoie le rappel une seule fois, quand il reste JOURS_AVANT_RAPPEL
      // jours ou moins (mais que le domaine n'a pas encore expiré), et qu'on
      // ne l'a pas déjà envoyé pour cette échéance.
      const dejaEnvoye = d.dernier_rappel_envoye === JOURS_AVANT_RAPPEL;

      if (joursRestants <= JOURS_AVANT_RAPPEL && joursRestants >= 0 && !dejaEnvoye) {
        const label = `${d.domaine} (gestionnaire ${d.gestionnaire_id})`;

        try {
          const prixDynadot = d.prix_dynadot != null ? parseFloat(d.prix_dynadot) : 12.99;
          const prixClient = dynadotService.calculerPrixClient(prixDynadot);
          const taxes = dynadotService.calculerTaxes(prixClient);

          const destinataire = d.email;
          if (!destinataire) {
            console.log(`   ⚠️  ${label} — aucun courriel de gestionnaire trouvé, skip`);
            continue;
          }

          await sendEmailSiActif(65, destinataire, {
            nom_gestionnaire:          d.nom || d.nom_boutique || d.email,
            nom_boutique_gestionnaire: d.nom_boutique || d.nom || '',
            nom_domaine:               d.domaine,
            jours_restants:            String(Math.max(0, joursRestants)),
            date_expiration:           formaterDate(expirationMs),
            montant_renouvellement:    fmt(taxes.total),
            lien_renouvellement:       `${FRONTEND_URL}/mon-domaine`,
          });

          await pool.query(
            `UPDATE domaines SET dernier_rappel_envoye = $1 WHERE id = $2`,
            [JOURS_AVANT_RAPPEL, d.id]
          );

          console.log(`   📧 Rappel envoyé pour ${label} (${joursRestants} jours restants)`);
          envoyes++;
        } catch (errUnique) {
          console.error(`   ❌ Erreur traitement ${label}:`, errUnique.message);
        }
      }
    }

    console.log(`   ✅ ${envoyes} rappel(s) envoyé(s)`);
  } catch (err) {
    console.error('❌ Erreur verifierDomainesExpirants:', err.message);
  }

  console.log('🌐 Vérification des domaines terminée\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMARRER — appelé depuis server.js
// Lance une première vérification au boot, puis toutes les 24h
// ─────────────────────────────────────────────────────────────────────────────
function demarrer() {
  console.log('⏰ Cron domaines démarré (vérification quotidienne des expirations)');

  setTimeout(async () => {
    try {
      await verifierDomainesExpirants();
    } catch (err) {
      console.error('❌ Erreur run initial cron domaines:', err.message);
    }
  }, 45 * 1000); // léger décalage par rapport aux autres crons au boot

  setInterval(async () => {
    try {
      await verifierDomainesExpirants();
    } catch (err) {
      console.error('❌ Erreur cron domaines:', err.message);
    }
  }, CONFIG.INTERVALLE_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT — Déclencher manuellement depuis l'admin (optionnel)
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.post('/lancer', authenticateToken, isAdmin, async (req, res) => {
  console.log('🔧 Vérification domaines déclenchée manuellement par admin');
  verifierDomainesExpirants().catch(err => console.error('❌ Erreur run manuel cron domaines:', err.message));
  res.json({ success: true, message: 'Vérification lancée en arrière-plan — vérifiez les logs.' });
});

router.get('/statut', authenticateToken, isAdmin, async (req, res) => {
  try {
    const prochains = await pool.query(
      `SELECT d.domaine, d.gestionnaire_id, d.expiration_date, d.dernier_rappel_envoye, g.nom_boutique
       FROM domaines d
       JOIN gestionnaires g ON g.id = d.gestionnaire_id
       WHERE d.statut = 'actif' AND d.expiration_date IS NOT NULL
       ORDER BY d.expiration_date ASC LIMIT 20`
    );
    res.json({ prochaines_expirations: prochains.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.demarrer = demarrer;
module.exports.verifierDomainesExpirants = verifierDomainesExpirants;