// routes/webhooksSes.js
// Reçoit les avis d'Amazon SES (envoyés via Amazon SNS) quand un courriel
// rebondit ou qu'un destinataire le signale comme indésirable, et désactive
// automatiquement cet abonné de l'infolettre (actif = false).
//
// ⚠️ À monter dans server.js AVANT express.json() ET avant la protection par
// mot de passe (même zone que les autres webhooks) :
//   app.use('/api/webhooks/ses', require('./routes/webhooksSes'));
//
// SÉCURITÉ : Amazon ne peut pas se connecter à ton site, donc cette adresse est
// publique. Elle est protégée par un code secret placé dans l'URL
// (variable d'environnement SES_WEBHOOK_SECRET) :
//   https://e-vendstudio.ca/api/webhooks/ses/<SES_WEBHOOK_SECRET>
// Sans le bon code, la requête est refusée (403). Ce webhook ne peut QUE
// désactiver des abonnés : jamais en ajouter, ni en réactiver, ni lire des données.
//
// Optionnel : SES_SNS_TOPIC_ARN = l'identifiant (ARN) du topic SNS. S'il est
// défini, les avis venant d'un autre topic sont refusés.
//
// AUCUN nouveau paquet : express, crypto (intégré) et fetch (Node 18+) seulement.

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../db');

function secretValide(fourni) {
  const attendu = process.env.SES_WEBHOOK_SECRET || '';
  if (!attendu || typeof fourni !== 'string') return false;
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// SES donne normalement l'adresse seule, mais on se protège du format "Nom <adresse>".
function extraireEmail(brut) {
  const s = String(brut || '');
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim().toLowerCase();
}

// SNS envoie son JSON avec un Content-Type "text/plain" : on lit donc le corps
// en texte (express.text) et on le parse nous-mêmes.
router.post('/:secret', express.text({ type: '*/*', limit: '256kb' }), async (req, res) => {
  if (!process.env.SES_WEBHOOK_SECRET) {
    console.error('[ses-webhook] SES_WEBHOOK_SECRET absent du .env — avis ignoré.');
    return res.status(503).json({ error: 'Webhook non configuré' });
  }
  if (!secretValide(req.params.secret)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  let enveloppe;
  try {
    enveloppe = JSON.parse(req.body);
  } catch {
    return res.status(400).json({ error: 'Corps invalide' });
  }

  const topicAttendu = process.env.SES_SNS_TOPIC_ARN || '';
  if (topicAttendu && enveloppe.TopicArn !== topicAttendu) {
    return res.status(403).json({ error: 'Topic non autorisé' });
  }

  try {
    // ── 1. Confirmation d'abonnement (une seule fois, quand tu relies SNS à ton site) ──
    if (enveloppe.Type === 'SubscriptionConfirmation') {
      let url;
      try { url = new URL(enveloppe.SubscribeURL); } catch { return res.status(400).json({ error: 'SubscribeURL invalide' }); }
      // On ne visite QUE une adresse officielle d'Amazon SNS.
      if (url.protocol !== 'https:' || !/^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/.test(url.hostname)) {
        console.warn('[ses-webhook] SubscribeURL refusée (hôte non Amazon):', url.hostname);
        return res.status(400).json({ error: 'SubscribeURL non autorisée' });
      }
      const r = await fetch(url.toString());
      console.log(`[ses-webhook] Abonnement SNS confirmé (HTTP ${r.status}).`);
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }

    // ── 2. Avis de rebond / plainte ──
    if (enveloppe.Type === 'Notification') {
      let msg;
      try { msg = JSON.parse(enveloppe.Message); } catch { return res.json({ ok: true, ignore: 'message non JSON' }); }

      const evenement = msg.notificationType || msg.eventType;
      let adresses = [];
      let motif = '';

      if (evenement === 'Bounce' && msg.bounce) {
        if (msg.bounce.bounceType === 'Permanent') {
          adresses = (msg.bounce.bouncedRecipients || []).map(r => r.emailAddress);
          motif = 'rebond permanent';
        } else {
          // Temporaire (boîte pleine...) ou indéterminé : on note seulement, on ne désactive pas.
          const n = (msg.bounce.bouncedRecipients || []).length;
          console.log(`[ses-webhook] Rebond ${msg.bounce.bounceType || 'inconnu'} noté (${n} adresse(s)) — aucune désactivation.`);
        }
      } else if (evenement === 'Complaint' && msg.complaint) {
        adresses = (msg.complaint.complainedRecipients || []).map(r => r.emailAddress);
        motif = 'plainte (indésirable)';
      }

      const liste = [...new Set(adresses.filter(Boolean).map(extraireEmail))];
      if (liste.length > 0) {
        // Ne touche que les abonnés encore actifs. Aucune réactivation possible ici.
        const { rows } = await pool.query(
          `UPDATE infolettre_abonnes
              SET actif = false, date_desabonnement = NOW()
            WHERE lower(email) = ANY($1::text[]) AND actif = true
        RETURNING email`,
          [liste]
        );
        console.log(`[ses-webhook] ${motif} : ${rows.length} abonné(s) désactivé(s) sur ${liste.length} adresse(s) reçue(s).`);
      }
      return res.json({ ok: true });
    }

    // UnsubscribeConfirmation ou autre type : rien à faire.
    return res.json({ ok: true, ignore: enveloppe.Type || 'inconnu' });
  } catch (err) {
    // 500 → SNS réessaiera plus tard (ex : base de données momentanément indisponible).
    console.error('[ses-webhook] Erreur:', err.message);
    return res.status(500).json({ error: 'Erreur de traitement' });
  }
});

module.exports = router;