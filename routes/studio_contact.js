// routes/studio_contact.js
// e-Vend Studio — Formulaire de contact des templates
// Visiteur → email au propriétaire du site Studio
// ReplyTo = email du visiteur → le propriétaire répond directement en cliquant Reply
//
// POST /api/studio/contact
//
// Body :
//   nom_expediteur    string  requis
//   email_expediteur  string  requis
//   message           string  requis
//   sujet             string  optionnel (contexte affiché dans l'email)
//   telephone         string  optionnel
//   champ_extra       object  optionnel  { label, valeur }[]  — champs spécifiques au template
//   vendeur_id        number  requis
//   template_id       string  optionnel  (pour branding de l'email)
//   copie_expediteur  bool    optionnel  (envoyer une copie au visiteur)
//   honeypot          string  anti-bot (laisser vide)
//   form_start_time   number  timestamp anti-bot

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { verifierEtIncrementerQuota } = require('./messagerie_contact');
const { getListeMots } = require('./blacklist_contact');

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@e-vend.ca';

// ─────────────────────────────────────────────────────────────────────────────
// ANTI-SPAM
// ─────────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 heures
const MIN_TIME_MS       = 3000;                 // 3 secondes minimum
const MAX_TIME_MS       = 30 * 60 * 1000;       // 30 minutes maximum

const rateLimitStore = new Map();

// La liste noire vit maintenant en base de données (table blacklist_mots_contact),
// gérée par l'admin plateforme — voir routes/blacklist_contact.js

const TEMP_EMAIL_DOMAINS = [
  'tempmail','10minutemail','guerrillamail','mailinator',
  'throwaway','yopmail','temp-mail','mailnator',
];

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isTempEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return TEMP_EMAIL_DOMAINS.some(t => domain.includes(t));
}

async function containsBlacklist(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const mots = await getListeMots();
  return mots.some(w => lower.includes(w));
}

function checkRateLimit(ip) {
  const now  = Date.now();
  const data = rateLimitStore.get(ip) || { messages: [] };
  data.messages = data.messages.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (data.messages.length >= RATE_LIMIT_MAX) {
    const waitMinutes = Math.ceil((RATE_LIMIT_WINDOW - (now - data.messages[0])) / 60000);
    return { allowed: false, waitMinutes };
  }
  data.messages.push(now);
  rateLimitStore.set(ip, data);
  return { allowed: true, remaining: RATE_LIMIT_MAX - data.messages.length };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────────────────────────────────────
// ENVOI SES
// ─────────────────────────────────────────────────────────────────────────────
async function envoyerEmail({ to, subject, html, replyTo }) {
  if (!to || !subject || !html) return false;
  try {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const ses = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body:    { Html:    { Data: html,    Charset: 'UTF-8' } },
      },
      Source: FROM_EMAIL,
    };
    if (replyTo && validateEmail(replyTo)) {
      params.ReplyToAddresses = [replyTo];
    }
    await ses.send(new SendEmailCommand(params));
    console.log(`📧 [studio/contact] → ${to} | ${subject}`);
    return true;
  } catch (err) {
    console.error(`❌ [studio/contact] Échec SES → ${to}:`, err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COULEURS PAR TEMPLATE — pour le branding de l'email
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATE_BRANDING = {
  'cours-coach':        { couleur: '#C9A96E', fond: '#2C3E35', nom: 'Coach de Vie',          icone: '🌿' },
  'cours-danse':        { couleur: '#e91e8c', fond: '#0a0a0f', nom: 'École de Danse',         icone: '💃' },
  'cours-peinture':     { couleur: '#e63946', fond: '#1a1a2e', nom: 'École de Peinture',      icone: '🎨' },
  'cours-equitation':   { couleur: '#c9a84c', fond: '#2c1a10', nom: "Centre d'Équitation",    icone: '🐎' },
  'cours-yoga':         { couleur: '#c17f5a', fond: '#f5f0ea', nom: 'Studio Yoga',            icone: '🧘' },
  'cours-cuisine':      { couleur: '#c0392b', fond: '#1a0a08', nom: 'École de Cuisine',       icone: '🍳' },
  'cours-web':          { couleur: '#00d4ff', fond: '#0a0a1a', nom: 'Formation Web',          icone: '⚙️' },
  'cours-langues':      { couleur: '#4F46E5', fond: '#0a0820', nom: 'École de Langues',       icone: '🌍' },
  'cours-piano':        { couleur: '#e8a87c', fond: '#1a1008', nom: 'Cours de Piano',         icone: '🎹' },
  'vitrine-bar':        { couleur: '#c9a96e', fond: '#0a0805', nom: 'Bar & Cocktails',        icone: '🍸' },
  'cours-spa':          { couleur: '#7fbfbf', fond: '#0d1f1f', nom: 'Spa & Massage',          icone: '🌸' },
  'vitrine-photo':      { couleur: '#e8e8e8', fond: '#0a0a0a', nom: 'Photographe',            icone: '📷' },
  'vitrine-tattoo':     { couleur: '#c9a96e', fond: '#0a0a0a', nom: 'Studio Tatouage',        icone: '🎭' },
  'vitrine-sante':      { couleur: '#4a90d9', fond: '#f0f8ff', nom: 'Clinique & Physio',      icone: '🏥' },
  'salon-coiffure':     { couleur: '#e8820a', fond: '#1a0f05', nom: 'Salon de Coiffure',      icone: '✂️' },
  'vitrine-paysager':   { couleur: '#b5e24a', fond: '#1a2a0a', nom: 'Entretien Paysager',     icone: '🌿' },
  'vitrine-avocat':     { couleur: '#c9a84c', fond: '#1a1508', nom: "Bureau d'Avocat",        icone: '⚖️' },
  'vitrine-resto':      { couleur: '#e8820a', fond: '#1a0805', nom: 'Restaurant',             icone: '🍽️' },
  'vitrine-bistro':     { couleur: '#8b6914', fond: '#1a1005', nom: 'Bistro & Café',          icone: '☕' },
  'vitrine-boulangerie':{ couleur: '#8b4513', fond: '#1a0a05', nom: 'Boulangerie',            icone: '🥐' },
  'vitrine-foodtruck':  { couleur: '#ff6b00', fond: '#1a0800', nom: 'Food Truck',             icone: '🚚' },
};

const BRANDING_DEFAUT = { couleur: '#c9a96e', fond: '#1a1a2e', nom: 'e-Vend Studio', icone: '✨' };

// ─────────────────────────────────────────────────────────────────────────────
// HTML EMAIL — propriétaire du site
// ─────────────────────────────────────────────────────────────────────────────
function buildEmailProprietaire({ branding, nomProprietaire, nomSite, nomExpediteur, emailExpediteur, telephone, sujet, message, champsExtra, templateId, annee }) {
  const messageHtml = escapeHtml(message).replace(/\n/g, '<br>');

  // Champs supplémentaires (optionnel — ex: objectif, type de soin, date souhaitée…)
  const lignesChampsExtra = (champsExtra || [])
    .filter(c => c.label && c.valeur)
    .map(c => `
      <tr>
        <td style="padding:8px 14px;color:#6b7280;font-size:12px;font-weight:700;white-space:nowrap;width:130px;">${escapeHtml(c.label)}</td>
        <td style="padding:8px 14px;color:#1f2937;font-size:13px;">${escapeHtml(String(c.valeur))}</td>
      </tr>`)
    .join('');

  const blocChampsExtra = lignesChampsExtra ? `
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;font-size:13px;">
      ${lignesChampsExtra}
    </table>` : '';

  const ligneSubject = sujet
    ? `<p style="margin:0 0 16px;font-size:14px;color:#374151;"><strong>Sujet :</strong> ${escapeHtml(sujet)}</p>`
    : '';

  const ligneTelephone = telephone
    ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">📞 ${escapeHtml(telephone)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header brandé selon le template -->
    <div style="background:linear-gradient(135deg,${branding.fond},${branding.fond}dd);padding:0;border-bottom:3px solid ${branding.couleur};">
      <div style="padding:24px 28px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
          <span style="font-size:28px;">${branding.icone}</span>
          <div>
            <h1 style="color:#fff;font-size:18px;margin:0;font-weight:800;">${escapeHtml(nomSite || branding.nom)}</h1>
            <p style="color:rgba(255,255,255,0.55);margin:2px 0 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">Nouveau message reçu</p>
          </div>
        </div>
      </div>
      <div style="background:${branding.couleur};padding:10px 28px;">
        <p style="margin:0;color:#fff;font-size:13px;font-weight:700;">📩 Un visiteur vous a contacté via votre site e-Vend Studio</p>
      </div>
    </div>

    <div style="padding:28px;">

      <p style="color:#374151;font-size:14px;margin-top:0;line-height:1.6;">
        Bonjour <strong>${escapeHtml(nomProprietaire)}</strong>,<br>
        Vous avez reçu un nouveau message via votre site web.
      </p>

      <!-- Expéditeur -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">De la part de</p>
        <p style="margin:0;font-size:17px;font-weight:800;color:#1f2937;">${escapeHtml(nomExpediteur)}</p>
        <a href="mailto:${escapeHtml(emailExpediteur)}" style="font-size:13px;color:#3b82f6;text-decoration:none;">${escapeHtml(emailExpediteur)}</a>
        ${ligneTelephone}
      </div>

      ${ligneSubject}
      ${blocChampsExtra}

      <!-- Message -->
      <div style="background:#fafafa;border-left:4px solid ${branding.couleur};border-radius:0 10px 10px 0;padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.9;">${messageHtml}</p>
      </div>

      <!-- Bouton répondre -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="mailto:${escapeHtml(emailExpediteur)}?subject=Re: Message de ${escapeHtml(nomExpediteur)}"
           style="background:${branding.couleur};color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
          ✉️ Répondre à ${escapeHtml(nomExpediteur)}
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;line-height:1.7;">
        Cliquez sur le bouton ou utilisez simplement <strong>Répondre</strong> dans votre client email.<br>
        Votre réponse ira directement à votre visiteur.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:14px 28px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">© ${annee} e-Vend Studio</p>
      <p style="margin:0;font-size:11px;color:#9ca3af;">Template : ${escapeHtml(templateId || 'studio')}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML EMAIL — copie pour l'expéditeur (visiteur)
// ─────────────────────────────────────────────────────────────────────────────
function buildEmailCopieExpediteur({ branding, nomSite, nomExpediteur, nomProprietaire, sujet, message, champsExtra, annee }) {
  const messageHtml = escapeHtml(message).replace(/\n/g, '<br>');
  const ligneSubject = sujet
    ? `<p style="margin:0 0 16px;font-size:14px;color:#374151;"><strong>Sujet :</strong> ${escapeHtml(sujet)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,${branding.fond},${branding.fond}cc);padding:24px 28px;border-bottom:3px solid ${branding.couleur};">
      <h1 style="color:#fff;font-size:18px;margin:0;font-weight:800;">${branding.icone} ${escapeHtml(nomSite || branding.nom)}</h1>
      <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:13px;">📋 Copie de votre message</p>
    </div>

    <div style="padding:28px;">
      <p style="color:#374151;font-size:14px;margin-top:0;line-height:1.6;">
        Bonjour <strong>${escapeHtml(nomExpediteur)}</strong>,<br>
        Voici une copie du message que vous avez envoyé à <strong>${escapeHtml(nomProprietaire)}</strong>.<br>
        Votre message a bien été transmis et vous recevrez une réponse par email.
      </p>

      ${ligneSubject}

      <div style="background:#fafafa;border-left:4px solid ${branding.couleur};border-radius:0 10px 10px 0;padding:18px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.9;">${messageHtml}</p>
      </div>

      <p style="font-size:13px;color:#6b7280;text-align:center;line-height:1.7;">
        Vous recevrez la réponse directement dans votre boîte de réception.<br>
        Gardez un oeil sur votre email <strong>${escapeHtml((nomExpediteur || ''))}</strong>.
      </p>
    </div>

    <div style="background:#f9fafb;padding:14px 28px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">© ${annee} e-Vend Studio — Ce message a été envoyé via ${escapeHtml(nomSite || branding.nom)}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/studio/contact
// ─────────────────────────────────────────────────────────────────────────────
router.post('/contact', async (req, res) => {
  const {
    nom_expediteur,
    email_expediteur,
    message,
    sujet,
    telephone,
    champs_extra      = [],   // [{ label, valeur }] — champs spécifiques au template
    vendeur_id,
    template_id       = '',
    copie_expediteur  = false,
    honeypot,
    form_start_time,
  } = req.body;

  const ip  = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now();
  const annee = new Date().getFullYear();

  // ── 1. HONEYPOT ───────────────────────────────────────────────────────────
  if (honeypot && honeypot.trim() !== '') {
    console.log(`🤖 [studio/contact] Honeypot — IP: ${ip}`);
    return res.status(200).json({ succes: true, message: 'Message envoyé avec succès.' });
  }

  // ── 2. TIMING ─────────────────────────────────────────────────────────────
  if (form_start_time) {
    const elapsed = now - parseInt(form_start_time);
    if (elapsed < MIN_TIME_MS) {
      console.log(`🤖 [studio/contact] Trop rapide (${elapsed}ms) — IP: ${ip}`);
      return res.status(200).json({ succes: true, message: 'Message envoyé avec succès.' });
    }
    if (elapsed > MAX_TIME_MS) {
      return res.status(400).json({ message: 'Formulaire expiré. Rafraîchissez la page et réessayez.' });
    }
  }

  // ── 3. RATE LIMIT ─────────────────────────────────────────────────────────
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({ message: `Trop de messages. Réessayez dans ${rate.waitMinutes} minutes.` });
  }

  // ── 4. VALIDATION ─────────────────────────────────────────────────────────
  if (!nom_expediteur?.trim() || nom_expediteur.trim().length < 2 || nom_expediteur.trim().length > 100)
    return res.status(400).json({ message: 'Nom invalide (2–100 caractères).' });

  if (!email_expediteur?.trim() || !validateEmail(email_expediteur))
    return res.status(400).json({ message: 'Adresse email invalide.' });

  if (isTempEmail(email_expediteur))
    return res.status(400).json({ message: 'Veuillez utiliser une adresse email permanente.' });

  if (!message?.trim() || message.trim().length < 10)
    return res.status(400).json({ message: 'Message trop court (minimum 10 caractères).' });

  if (message.trim().length > 5000)
    return res.status(400).json({ message: 'Message trop long (maximum 5000 caractères).' });

  if (!vendeur_id)
    return res.status(400).json({ message: 'Destinataire non spécifié.' });

  // ── 5. BLACKLIST ──────────────────────────────────────────────────────────
  if ((await containsBlacklist(message)) || (await containsBlacklist(sujet))) {
    console.log(`⚠️ [studio/contact] Blacklist — IP: ${ip}`);
    return res.status(400).json({ message: 'Message invalide.' });
  }

  // ── 6. CHARS RÉPÉTITIFS ───────────────────────────────────────────────────
  const cleanMsg = message.trim().toLowerCase();
  if (new Set(cleanMsg).size < 3 && cleanMsg.length > 15)
    return res.status(400).json({ message: 'Message invalide.' });

  // ── 7. RATIO CHIFFRES ─────────────────────────────────────────────────────
  const letters = (message.match(/[a-zA-Z]/g) || []).length;
  const digits  = (message.match(/[0-9]/g)    || []).length;
  if (digits > letters * 2 && letters < 20)
    return res.status(400).json({ message: 'Message invalide.' });

  // ── 7.5 QUOTA MESSAGERIE ──────────────────────────────────────────────────
  // Le formulaire de contact est gratuit et inclus, mais limité à un quota
  // mensuel (100 messages + blocs achetés). Vérifié ici, PAS avant la
  // validation anti-spam, pour ne jamais consommer de quota sur un spam bloqué.
  let quotaInfo;
  try {
    quotaInfo = await verifierEtIncrementerQuota(vendeur_id);
  } catch (err) {
    console.error('[studio/contact] Erreur vérification quota:', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
  if (!quotaInfo.autorise) {
    console.log(`🚫 [studio/contact] Quota atteint — vendeur_id: ${vendeur_id} (${quotaInfo.utilises}/${quotaInfo.limite})`);
    return res.status(403).json({
      message: "Le formulaire de contact n'est pas disponible pour le moment.",
      quota_atteint: true,
    });
  }

  // ── 8. RÉCUPÉRER EMAIL + NOM DU PROPRIÉTAIRE EN BD ───────────────────────
  let proprietaireEmail, proprietaireNom, nomSite;
  try {
    // On cherche d'abord l'email du vendeur
    const resVendeur = await pool.query(
      `SELECT v.email, COALESCE(v.nom_boutique, v.nom, v.email) AS nom_affiche,
              COALESCE(s.config->>'nomSite', s.config->>'nomCoach', s.config->>'nomCommerce', s.config->>'nomBoutique', v.nom_boutique, v.nom) AS nom_site
       FROM gestionnaires v
       LEFT JOIN sites s ON s.vendeur_id = v.id
       WHERE v.id = $1 AND v.statut = 'actif'`,
      [vendeur_id]
    );
    if (resVendeur.rows.length === 0) {
      console.warn(`[studio/contact] Vendeur introuvable: id=${vendeur_id}`);
      return res.status(404).json({ message: 'Destinataire introuvable.' });
    }
    proprietaireEmail = resVendeur.rows[0].email;
    proprietaireNom   = resVendeur.rows[0].nom_affiche;
    nomSite           = resVendeur.rows[0].nom_site;
  } catch (err) {
    console.error('[studio/contact] Erreur BD:', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }

  // ── 9. BRANDING ───────────────────────────────────────────────────────────
  const branding = TEMPLATE_BRANDING[template_id] || BRANDING_DEFAUT;

  // ── 10. ENVOI EMAIL AU PROPRIÉTAIRE ───────────────────────────────────────
  const sujetEmail = sujet
    ? `[${nomSite || branding.nom}] ${escapeHtml(sujet)} — de ${escapeHtml(nom_expediteur)}`
    : `[${nomSite || branding.nom}] Nouveau message de ${escapeHtml(nom_expediteur)}`;

  const htmlProprietaire = buildEmailProprietaire({
    branding, nomProprietaire: proprietaireNom, nomSite,
    nomExpediteur: nom_expediteur, emailExpediteur: email_expediteur,
    telephone, sujet, message, champsExtra: champs_extra,
    templateId: template_id, annee,
  });

  try {
    const ok = await envoyerEmail({
      to:      proprietaireEmail,
      subject: sujetEmail,
      html:    htmlProprietaire,
      replyTo: email_expediteur,   // Reply direct → visiteur
    });
    if (!ok) throw new Error('SES failed');

    console.log(`📩 [studio/contact] → ${proprietaireEmail} | de: ${email_expediteur} | template: ${template_id} | IP: ${ip} | reste: ${rate.remaining}/${RATE_LIMIT_MAX}`);

    // ── 10.5 ENREGISTREMENT DU MESSAGE — visible dans Messagerie ─────────────
    // Ne bloque jamais la réponse au visiteur si ça échoue — l'email est déjà parti.
    try {
      const champsSupplementaires = Object.fromEntries(
        (champs_extra || []).filter(c => c.label && c.valeur).map(c => [c.label, c.valeur])
      );
      await pool.query(
        `INSERT INTO messages_contact (gestionnaire_id, nom, email, telephone, sujet, message, champs_supplementaires)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [vendeur_id, nom_expediteur, email_expediteur, telephone || null, sujet || null, message, JSON.stringify(champsSupplementaires)]
      );
    } catch (err) {
      console.error('[studio/contact] Erreur enregistrement message (email envoyé quand même):', err.message);
    }

    // ── 11. COPIE EXPÉDITEUR (optionnel) ──────────────────────────────────
    if (copie_expediteur && validateEmail(email_expediteur)) {
      const htmlCopie = buildEmailCopieExpediteur({
        branding, nomSite, nomExpediteur: nom_expediteur,
        nomProprietaire: proprietaireNom, sujet, message,
        champsExtra: champs_extra, annee,
      });
      await envoyerEmail({
        to:      email_expediteur,
        subject: `[Copie] ${sujetEmail}`,
        html:    htmlCopie,
        replyTo: null,
      });
      console.log(`📋 [studio/contact] copie → ${email_expediteur}`);
    }

    return res.status(200).json({ succes: true, message: 'Message envoyé avec succès.' });

  } catch (err) {
    console.error('❌ [studio/contact] Erreur envoi:', err.message);
    return res.status(500).json({ message: "Erreur lors de l'envoi. Veuillez réessayer." });
  }
});

module.exports = router;