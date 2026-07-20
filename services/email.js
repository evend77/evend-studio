// services/email.js
// Service d'envoi de courriels côté BACKEND uniquement — les clés AWS ne doivent
// JAMAIS être exposées côté frontend (voir REACT_APP_AWS_* dans l'ancien
// src/services/emailService.js — à supprimer, c'était une fuite de clés).
//
// ⚠️ TODO (à faire quand la table des modèles est identifiée) :
// ModelesCourriel.tsx charge des overrides admin via GET /api/modeles-email
// (une table BD qui permet de personnaliser sujet/html par numéro de template).
// Pour l'instant, ce fichier utilise des modèles codés en dur (copiés de
// ModelesCourriel.tsx) comme solution qui fonctionne immédiatement. Pour brancher
// les vrais overrides BD plus tard : dans envoyerEmailModele(), avant de tomber sur
// TEMPLATES[numero], faire un SELECT sujet, html FROM <table_modeles> WHERE id = $1
// et l'utiliser en priorité si une ligne existe.

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ── Layout HTML partagé (copié de ModelesCourriel.tsx → baseHTML) ──────────
function baseHTML(sujet, corps, couleur = '#2d6a9f') {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#f0f2f5; font-family:'Segoe UI',Arial,sans-serif; padding:32px 16px; }
.wrap { max-width:600px; margin:0 auto; }
.hdr { background:${couleur}; border-radius:12px 12px 0 0; padding:24px 32px; display:flex; justify-content:space-between; align-items:center; }
.logo { font-size:20px; font-weight:900; color:white; }
.logo em { color:#fbbf24; font-style:normal; }
.hdr-sub { color:rgba(255,255,255,0.8); font-size:11px; font-weight:700; text-align:right; text-transform:uppercase; }
.body { background:white; padding:32px; border:1px solid #e1e4e8; border-top:none; }
.greeting { font-size:15px; font-weight:700; color:#1a2332; margin-bottom:16px; }
.content { font-size:13px; color:#374151; line-height:1.8; }
.content p { margin-bottom:12px; }
.btn { display:inline-block; background:${couleur}; color:white !important; padding:12px 24px; border-radius:8px; font-weight:800; font-size:13px; text-decoration:none; margin:16px 0; }
.ftr { background:#f8fafc; border-radius:0 0 12px 12px; border:1px solid #e1e4e8; border-top:none; padding:18px 32px; text-align:center; }
.ftr p { font-size:10px; color:#9ca3af; line-height:1.6; }
</style></head>
<body><div class="wrap">
<div class="hdr"><div class="logo">e<em>-</em>Vend<span style="color:rgba(255,255,255,0.4);font-size:12px;"> Studio</span></div><div class="hdr-sub">${sujet}</div></div>
<div class="body">${corps}</div>
<div class="ftr"><p><strong>e-Vend Studio</strong> · Créez votre boutique en ligne<br>© 2026 e-Vend Studio — Tous droits réservés · {$date}</p></div>
</div></body></html>`;
}

// ── Modèles codés en dur (fallback tant que la table BD n'est pas branchée) ──
const TEMPLATES = {
  3: {
    sujet: '🔐 Vérifiez votre adresse courriel — e-Vend.ca',
    html: baseHTML(
      '🔐 Vérifiez votre adresse courriel — e-Vend.ca',
      `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Confirmez votre adresse courriel pour activer votre compte.</p><a href='{$lien_verification}' class='btn'>✅ Confirmer mon adresse</a><p style='font-size:11px;color:#9ca3af;'>Lien valide 48h. Si vous n'avez pas créé de compte, ignorez ce message.</p></div>`,
      '#1d4ed8'
    ),
  },
  // Ajouter les autres numéros ici au besoin (69, etc.) en attendant le branchement BD.
};

function remplacerVariables(texte, variables) {
  let resultat = texte;
  for (const [cle, valeur] of Object.entries(variables || {})) {
    resultat = resultat.split(`{$${cle}}`).join(valeur ?? '');
  }
  // Date auto-injectée si pas déjà fournie
  resultat = resultat.split('{$date}').join(new Date().toLocaleDateString('fr-CA'));
  return resultat;
}

/**
 * Envoie un courriel basé sur un modèle numéroté.
 * @param {number} numero - numéro du template (ex: 3 = vérification email)
 * @param {string} destinataire - adresse courriel du destinataire
 * @param {object} variables - clés SANS {$...}, ex: { nom_vendeur: 'Marie', lien_verification: 'https://...' }
 */
async function envoyerEmailModele(numero, destinataire, variables = {}) {
  const template = TEMPLATES[numero];
  if (!template) {
    throw new Error(`Modèle de courriel #${numero} introuvable (non défini dans services/email.js).`);
  }

  const sujetFinal = remplacerVariables(template.sujet, variables);
  const htmlFinal  = remplacerVariables(template.html, variables);

  await ses.send(new SendEmailCommand({
    Destination: { ToAddresses: [destinataire] },
    Message: {
      Subject: { Data: sujetFinal, Charset: 'UTF-8' },
      Body: { Html: { Data: htmlFinal, Charset: 'UTF-8' } },
    },
    Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
  }));
}

module.exports = { envoyerEmailModele };