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
let pool = null;
try { pool = require('../db'); } catch (e) { /* pool optionnel — fallback pur si absent */ }

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
const TEMPLATE_1_HTML = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#f0f2f5; font-family:'Segoe UI',Arial,sans-serif; padding:32px 16px; }
.wrap { max-width:600px; margin:0 auto; }
.hdr { background:#1d4ed8; border-radius:12px 12px 0 0; padding:32px; text-align:center; }
.logo { font-size:28px; font-weight:900; color:white; letter-spacing:-1px; margin-bottom:6px; }
.logo em { color:#fbbf24; font-style:normal; }
.hdr-tag { color:rgba(255,255,255,0.75); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
.body { background:white; padding:32px; border:1px solid #e1e4e8; border-top:none; }
.greeting { font-size:18px; font-weight:900; color:#1a2332; margin-bottom:6px; }
.sous-greeting { font-size:13px; color:#6b7280; margin-bottom:20px; }
.content { font-size:13px; color:#374151; line-height:1.8; }
.content p { margin-bottom:12px; }
.merci-bloc { background:linear-gradient(135deg,#eff6ff,#dbeafe); border:2px solid #93c5fd; border-radius:14px; padding:24px 26px; margin:0 0 24px; text-align:center; }
.merci-icon { font-size:44px; margin-bottom:10px; }
.merci-titre { font-size:19px; font-weight:900; color:#1d4ed8; margin-bottom:8px; }
.merci-sous { font-size:12.5px; color:#4b5563; line-height:1.8; }
.section-titre { font-size:13px; font-weight:900; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.5px; margin:24px 0 12px; padding-bottom:6px; border-bottom:2px solid #bfdbfe; }
.recap-bloc { background:#f8fafc; border-left:4px solid #1d4ed8; border-radius:0 8px 8px 0; padding:14px 18px; margin:16px 0; }
.row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #f3f4f6; font-size:12px; }
.row:last-child { border-bottom:none; }
.row .lbl { color:#6b7280; }
.row .val { font-weight:700; color:#1a2332; }
.badge-ok { background:#dbeafe; color:#1d4ed8; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.step { display:flex; align-items:flex-start; gap:14px; padding:14px 0; border-bottom:1px solid #f3f4f6; }
.step:last-child { border-bottom:none; }
.step-num { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#1d4ed8,#c9a96e); color:white; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
.step-body { flex:1; }
.step-titre { font-size:13px; font-weight:800; color:#1a2332; margin-bottom:3px; }
.step-menu { display:inline-block; background:#dbeafe; color:#1d4ed8; font-size:10px; font-weight:800; padding:2px 8px; border-radius:5px; margin-bottom:5px; font-family:monospace; }
.step-desc { font-size:12px; color:#6b7280; line-height:1.6; }
.alerte-14j { background:#fef2f2; border:2px solid #fca5a5; border-radius:12px; padding:16px 20px; margin:12px 0 0; }
.alerte-titre { font-size:12px; font-weight:900; color:#dc2626; margin-bottom:6px; }
.alerte-desc { font-size:12px; color:#374151; line-height:1.7; }
.btn { display:inline-block; background:linear-gradient(135deg,#1d4ed8,#c9a96e); color:white !important; padding:14px 32px; border-radius:10px; font-weight:900; font-size:14px; text-decoration:none; margin:16px 0; }
.signature { margin-top:20px; padding-top:16px; border-top:1px solid #f3f4f6; font-size:12px; color:#6b7280; line-height:1.8; }
.ftr { background:#f8fafc; border-radius:0 0 12px 12px; border:1px solid #e1e4e8; border-top:none; padding:18px 32px; text-align:center; }
.ftr p { font-size:10px; color:#9ca3af; line-height:1.6; }
</style></head>
<body><div class="wrap">

<div class="hdr">
  <div class="logo">e<em>-</em>Vend Studio</div>
  <div class="hdr-tag">🇨🇦 Fièrement québécois</div>
</div>

<div class="body">
  <p class="greeting">Bienvenue, {$nom_vendeur} ! 🎉</p>
  <p class="sous-greeting">Votre adresse courriel est confirmée — votre boutique est prête à prendre vie.</p>

  <div class="content">

    <div class="merci-bloc">
      <div class="merci-icon">🙏</div>
      <div class="merci-titre">Merci de nous faire confiance</div>
      <div class="merci-sous">
        Choisir e-Vend Studio pour bâtir <strong>{$nom_boutique_vendeur}</strong>, c'est choisir une équipe
        d'ici. On est fiers d'être québécois, et on est fiers de vous aider à faire rayonner votre
        commerce. Ensemble, on encourage l'achat local, un entrepreneur à la fois — et ça, c'est une
        équipe qu'on trouve pas mal belle. 💙
      </div>
    </div>

    <div class="recap-bloc">
      <div class="row"><span class="lbl">Boutique</span><span class="val">{$nom_boutique_vendeur}</span></div>
      <div class="row"><span class="lbl">Forfait actuel</span><span class="val">{$plan_actuel}</span></div>
      <div class="row"><span class="lbl">Statut</span><span class="val"><span class="badge-ok">✅ Courriel vérifié</span></span></div>
    </div>

    <div class="section-titre">🚀 Pour bien démarrer</div>

    <div class="step">
      <div class="step-num">1</div>
      <div class="step-body">
        <div class="step-titre">🎨 Choisissez votre gabarit</div>
        <div class="step-desc">Dès votre première visite du tableau de bord, on vous invite à choisir le gabarit visuel qui représente le mieux votre commerce. C'est le point de départ de votre boutique.</div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">2</div>
      <div class="step-body">
        <div class="step-titre">📝 Complétez votre profil</div>
        <span class="step-menu">Menu → Profil → Mon compte</span>
        <div class="step-desc">Ajoutez vos coordonnées, votre logo et les détails de votre boutique. Un profil complet donne confiance à vos futurs clients.</div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">3</div>
      <div class="step-body">
        <div class="step-titre">🌐 Configurez votre domaine</div>
        <span class="step-menu">Menu → Mon domaine</span>
        <div class="step-desc">Choisissez votre sous-domaine gratuit e-Vend Studio, ou connectez votre propre nom de domaine si vous en avez déjà un.</div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">4</div>
      <div class="step-body">
        <div class="step-titre">🖌️ Personnalisez votre gabarit</div>
        <div class="step-desc">Ajustez les couleurs, ajoutez vos produits et votre contenu pour que votre boutique vous ressemble.</div>
      </div>
    </div>

    <div class="alerte-14j">
      <div class="alerte-titre">⏰ Votre essai gratuit de 14 jours</div>
      <div class="alerte-desc">
        Aucune carte de crédit requise pendant l'essai. Vous devez toutefois configurer un moyen de
        paiement avant la fin de vos 14 jours — sans quoi, le travail accompli durant cette période
        sera perdu. Ne vous en faites pas, on vous enverra un rappel avant la dernière journée. 😊
      </div>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="{$lien_dashboard}" class="btn">🚀 Accéder à mon tableau de bord →</a>
    </div>

    <div class="signature">
      <p>Bonne continuation, {$nom_vendeur} — on est vraiment contents de vous compter parmi nous ! 🌟</p>
      <br>
      <p><strong>L'équipe e-Vend Studio</strong><br>🇨🇦 Fièrement québécois</p>
    </div>

  </div>
</div>

<div class="ftr"><p><strong>e-Vend Studio</strong> · Créez votre boutique en ligne<br>© 2026 e-Vend Studio — Tous droits réservés · {$date}</p></div>
</div></body></html>`;

const TEMPLATES = {
  1: {
    sujet: 'Bienvenue chez e-Vend Studio, {$nom_vendeur} ! Merci de votre confiance 🎉',
    html: TEMPLATE_1_HTML,
  },
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
  let sujetSrc, htmlSrc;

  // 1) Table réelle email_templates (voir routes/cron_abonnements_studio.js →
  //    sendEmailSiActif, qui confirme son existence et ses colonnes).
  if (pool) {
    try {
      const r = await pool.query(
        'SELECT actif, sujet, html FROM email_templates WHERE id = $1 LIMIT 1',
        [numero]
      );
      if (r.rows.length && r.rows[0].actif) {
        sujetSrc = r.rows[0].sujet;
        htmlSrc  = r.rows[0].html;
      } else if (r.rows.length && !r.rows[0].actif) {
        console.log(`⏭️  Modèle #${numero} désactivé en BD — courriel non envoyé.`);
        return;
      }
    } catch (e) {
      console.warn(`⚠️ Lecture email_templates #${numero} impossible, fallback codé en dur:`, e.message);
    }
  }

  // 2) Fallback codé en dur si la table est vide/absente pour ce numéro
  if (!sujetSrc || !htmlSrc) {
    const template = TEMPLATES[numero];
    if (!template) {
      throw new Error(`Modèle de courriel #${numero} introuvable (ni en BD, ni dans services/email.js).`);
    }
    sujetSrc = template.sujet;
    htmlSrc  = template.html;
  }

  const sujetFinal = remplacerVariables(sujetSrc, variables);
  const htmlFinal  = remplacerVariables(htmlSrc, variables);

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