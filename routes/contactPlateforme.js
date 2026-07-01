// routes/contactPlateforme.js
// Formulaire de contact public — Anti-spam intégré (honeypot + rate limit + timing + blacklist)

const express = require('express');
const router = express.Router();
const pool = require('../db');

const FROM_EMAIL = process.env.FROM_EMAIL || 'contact@e-vend.ca';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION ANTI-SPAM
// ─────────────────────────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 5;           // 5 messages maximum
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // par 24 heures
const MIN_TIME_MS = 3000;           // 3 secondes minimum pour remplir (anti-bot rapide)
const MAX_TIME_MS = 30 * 60 * 1000;  // 30 minutes maximum (expiration formulaire)

// Stockage rate limiting (en mémoire, redémarrage = reset)
const rateLimitStore = new Map();

// Blacklist de mots clés (spam classique)
const BLACKLIST = [
  'casino', 'viagra', 'porn', 'xxx', 'crypto', 'bitcoin',
  'pharmacie', 'enlargement', 'loan', 'prix', 'gagné',
  'gagnant', 'cagnotte', 'lottery', 'prize', 'viagra',
  'cialis', 'xanax', 'valium', 'ambien', 'tramadol',
  'dofollow', 'backlink', 'seo', 'referencement'
];

// Domaines email temporaires / jetables
const TEMP_EMAIL_DOMAINS = [
  'tempmail', '10minutemail', 'guerrillamail', 'mailinator',
  'throwaway', 'yopmail', 'temp-mail', 'mailnator'
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Anti-spam
// ─────────────────────────────────────────────────────────────────────────────

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isTempEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  return TEMP_EMAIL_DOMAINS.some(temp => domain.includes(temp));
}

function containsBlacklistedWords(text) {
  const lower = text.toLowerCase();
  return BLACKLIST.some(word => lower.includes(word));
}

function checkRateLimit(ip) {
  const now = Date.now();
  const userData = rateLimitStore.get(ip) || { messages: [], firstSeen: now };
  
  // Nettoyer les anciens messages (plus vieux que la fenêtre)
  userData.messages = userData.messages.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (userData.messages.length >= RATE_LIMIT_MAX) {
    const oldest = userData.messages[0];
    const waitMinutes = Math.ceil((RATE_LIMIT_WINDOW - (now - oldest)) / 60000);
    return { allowed: false, remaining: 0, waitMinutes };
  }
  
  userData.messages.push(now);
  if (!userData.firstSeen) userData.firstSeen = now;
  rateLimitStore.set(ip, userData);
  
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - userData.messages.length,
    firstSeen: userData.firstSeen
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Email (même méthode que encheres_emails)
// ─────────────────────────────────────────────────────────────────────────────

async function envoyerEmail({ to, subject, html, replyTo }) {
  if (!to || !subject || !html) {
    console.warn('[contactPlateforme] envoyerEmail — paramètres manquants');
    return false;
  }
  try {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const ses = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    const commandParams = {
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
      Source: FROM_EMAIL,
    };
    
    // Ajouter ReplyTo pour pouvoir répondre directement à l'utilisateur
    if (replyTo && validateEmail(replyTo)) {
      commandParams.ReplyToAddresses = [replyTo];
    }
    
    await ses.send(new SendEmailCommand(commandParams));
    console.log(`📧 [contactPlateforme] → ${to} | ${subject} | Reply-To: ${replyTo || 'non défini'}`);
    return true;
  } catch (err) {
    console.error(`❌ [contactPlateforme] Échec envoi → ${to}:`, err.message);
    return false;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE PUBLIQUE — Formulaire de contact avec anti-spam complet
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send', async (req, res) => {
  const { 
    nom, email, sujet, message, 
    honeypot,        // Champ caché anti-bot
    form_start_time  // Timestamp de début du formulaire (frontend)
  } = req.body;
  
  const ip = req.ip || req.connection.remoteAddress || 
             req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HONEYPOT — Champ invisible que seul un bot remplit
  // ═══════════════════════════════════════════════════════════════════════════
  if (honeypot && honeypot.trim() !== '') {
    console.log(`🤖 [contactPlateforme] Honeypot détecté - IP: ${ip}`);
    return res.status(200).json({ success: true, message: 'Message envoyé avec succès' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. TIMING — Vérifier que le formulaire n'a pas été rempli trop vite
  // ═══════════════════════════════════════════════════════════════════════════
  if (form_start_time) {
    const elapsedTime = now - parseInt(form_start_time);
    
    if (elapsedTime < MIN_TIME_MS) {
      console.log(`🤖 [contactPlateforme] Timing trop rapide (${elapsedTime}ms) - IP: ${ip}`);
      return res.status(200).json({ success: true, message: 'Message envoyé avec succès' });
    }
    
    if (elapsedTime > MAX_TIME_MS) {
      console.log(`⏰ [contactPlateforme] Formulaire expiré (${Math.floor(elapsedTime/60000)}min) - IP: ${ip}`);
      return res.status(400).json({ error: 'Formulaire expiré. Veuillez rafraîchir la page et réessayer.' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. RATE LIMITING — Max 5 messages par IP / 24h
  // ═══════════════════════════════════════════════════════════════════════════
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    console.log(`⚠️ [contactPlateforme] Rate limit dépassé pour ${ip} - attendre ${rate.waitMinutes}min`);
    return res.status(429).json({ 
      error: `Trop de messages. Veuillez réessayer dans ${rate.waitMinutes} minutes.` 
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. VALIDATION DES CHAMPS
  // ═══════════════════════════════════════════════════════════════════════════
  if (!nom || nom.trim().length === 0) {
    return res.status(400).json({ error: 'Le nom est requis' });
  }
  
  if (nom.trim().length < 2 || nom.trim().length > 100) {
    return res.status(400).json({ error: 'Le nom doit contenir entre 2 et 100 caractères' });
  }
  
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  
  // Vérifier email temporaire
  if (isTempEmail(email)) {
    console.log(`⚠️ [contactPlateforme] Email temporaire refusé: ${email} - IP: ${ip}`);
    return res.status(400).json({ error: 'Veuillez utiliser une adresse email valide et permanente.' });
  }
  
  if (!sujet || sujet.trim().length === 0) {
    return res.status(400).json({ error: 'Le sujet est requis' });
  }
  
  if (sujet.trim().length < 3 || sujet.trim().length > 200) {
    return res.status(400).json({ error: 'Le sujet doit contenir entre 3 et 200 caractères' });
  }
  
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ error: 'Le message doit contenir au moins 10 caractères' });
  }
  
  if (message.trim().length > 5000) {
    return res.status(400).json({ error: 'Le message ne peut pas dépasser 5000 caractères' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. BLACKLIST — Mots clés interdits
  // ═══════════════════════════════════════════════════════════════════════════
  if (containsBlacklistedWords(message) || containsBlacklistedWords(sujet)) {
    console.log(`⚠️ [contactPlateforme] Blacklist triggered - IP: ${ip}`);
    return res.status(400).json({ error: 'Message invalide' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. VÉRIFICATION CARACTÈRES RÉPÉTITIFS
  // ═══════════════════════════════════════════════════════════════════════════
  const cleanMessage = message.trim().toLowerCase();
  const uniqueChars = new Set(cleanMessage.split('')).size;
  if (uniqueChars < 3 && cleanMessage.length > 15) {
    console.log(`⚠️ [contactPlateforme] Message répétitif détecté - IP: ${ip}`);
    return res.status(400).json({ error: 'Message invalide' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. VÉRIFICATION TAUX LETTRES/CHIFFRES
  // ═══════════════════════════════════════════════════════════════════════════
  const letterCount = (message.match(/[a-zA-Z]/g) || []).length;
  const digitCount = (message.match(/[0-9]/g) || []).length;
  if (digitCount > letterCount * 2 && letterCount < 20) {
    console.log(`⚠️ [contactPlateforme] Trop de chiffres dans le message - IP: ${ip}`);
    return res.status(400).json({ error: 'Message invalide' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ENVOI DE L'EMAIL
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; color: #000; font-size: 24px;">📬 Nouveau message de contact</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="margin-bottom: 20px;">
              <strong style="color: #374151;">👤 Nom</strong>
              <div style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 5px;">${escapeHtml(nom)}</div>
            </div>
            <div style="margin-bottom: 20px;">
              <strong style="color: #374151;">📧 Email</strong>
              <div style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 5px;">${escapeHtml(email)}</div>
            </div>
            <div style="margin-bottom: 20px;">
              <strong style="color: #374151;">📝 Sujet</strong>
              <div style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 5px;">${escapeHtml(sujet)}</div>
            </div>
            <div style="margin-bottom: 20px;">
              <strong style="color: #374151;">💬 Message</strong>
              <div style="background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 5px; white-space: pre-wrap;">${escapeHtml(message)}</div>
            </div>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
            <p>Message envoyé depuis le formulaire de contact de e-Vend Studio</p>
            <p>IP: ${ip}</p>
            <p>Message #${rate.messages?.length || 1}/${RATE_LIMIT_MAX} (24h)</p>
            <p>Pour répondre, utilisez simplement "Répondre" dans votre client email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const success = await envoyerEmail({
      to: 'contact@e-vend.ca',
      subject: `[e-Vend Studio Contact] ${sujet} - de ${nom}`,
      html: htmlContent,
      replyTo: email,  // ← Le bouton "Répondre" ira directement à l'utilisateur
    });

    if (!success) {
      throw new Error('Échec envoi email');
    }

    console.log(`✅ [contactPlateforme] Message de ${email} (${ip}) - ${rate.remaining}/${RATE_LIMIT_MAX} restants`);
    res.status(200).json({ success: true, message: 'Message envoyé avec succès' });

  } catch (error) {
    console.error('❌ [contactPlateforme] Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact/vendeur
// Envoie un email au vendeur via son vendeur_id (email récupéré en BD)
// ReplyTo = email de l'expéditeur → le vendeur clique Reply pour répondre
// AVEC PROTECTIONS ANTI-SPAM COMPLÈTES
// ─────────────────────────────────────────────────────────────────────────────
router.post('/vendeur', async (req, res) => {
  const {
    nom_expediteur,
    email_expediteur,
    message,
    copie_expediteur = false,
    vendeur_id,
    vendeur_nom,       // pour affichage dans les emails seulement
    sujet,             // contexte boutique seulement
    produit_nom,
    produit_sku,
    produit_id,
    contexte = 'general',
    // Champs anti-spam
    honeypot,          // Champ caché anti-bot
    form_start_time    // Timestamp de début du formulaire (frontend)
  } = req.body;

  const ip = req.ip || req.connection.remoteAddress || 
             req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const now = Date.now();

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HONEYPOT — Champ invisible que seul un bot remplit
  // ═══════════════════════════════════════════════════════════════════════════
  if (honeypot && honeypot.trim() !== '') {
    console.log(`🤖 [contact/vendeur] Honeypot détecté - IP: ${ip}`);
    return res.status(200).json({ succes: true, message: 'Message envoyé avec succès' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. TIMING — Vérifier que le formulaire n'a pas été rempli trop vite
  // ═══════════════════════════════════════════════════════════════════════════
  if (form_start_time) {
    const elapsedTime = now - parseInt(form_start_time);
    
    if (elapsedTime < MIN_TIME_MS) {
      console.log(`🤖 [contact/vendeur] Timing trop rapide (${elapsedTime}ms) - IP: ${ip}`);
      return res.status(200).json({ succes: true, message: 'Message envoyé avec succès' });
    }
    
    if (elapsedTime > MAX_TIME_MS) {
      console.log(`⏰ [contact/vendeur] Formulaire expiré (${Math.floor(elapsedTime/60000)}min) - IP: ${ip}`);
      return res.status(400).json({ message: 'Formulaire expiré. Veuillez rafraîchir la page et réessayer.' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. RATE LIMITING — Max 5 messages par IP / 24h
  // ═══════════════════════════════════════════════════════════════════════════
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    console.log(`⚠️ [contact/vendeur] Rate limit dépassé pour ${ip} - attendre ${rate.waitMinutes}min`);
    return res.status(429).json({ 
      message: `Trop de messages. Veuillez réessayer dans ${rate.waitMinutes} minutes.` 
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. VALIDATION DE BASE
  // ═══════════════════════════════════════════════════════════════════════════
  if (!nom_expediteur?.trim())
    return res.status(400).json({ message: 'Nom requis.' });
  
  if (nom_expediteur.trim().length < 2 || nom_expediteur.trim().length > 100)
    return res.status(400).json({ message: 'Le nom doit contenir entre 2 et 100 caractères.' });
  
  if (!email_expediteur?.trim() || !validateEmail(email_expediteur))
    return res.status(400).json({ message: 'Email invalide.' });
  
  // Vérifier email temporaire
  if (isTempEmail(email_expediteur)) {
    console.log(`⚠️ [contact/vendeur] Email temporaire refusé: ${email_expediteur} - IP: ${ip}`);
    return res.status(400).json({ message: 'Veuillez utiliser une adresse email valide et permanente.' });
  }
  
  if (!message?.trim())
    return res.status(400).json({ message: 'Message requis.' });
  
  if (message.trim().length < 10)
    return res.status(400).json({ message: 'Le message doit contenir au moins 10 caractères.' });
  
  if (message.trim().length > 5000)
    return res.status(400).json({ message: 'Le message ne peut pas dépasser 5000 caractères.' });
  
  if (!vendeur_id)
    return res.status(400).json({ message: 'Vendeur non spécifié.' });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. BLACKLIST — Mots clés interdits
  // ═══════════════════════════════════════════════════════════════════════════
  if (containsBlacklistedWords(message) || (sujet && containsBlacklistedWords(sujet))) {
    console.log(`⚠️ [contact/vendeur] Blacklist triggered - IP: ${ip}`);
    return res.status(400).json({ message: 'Message invalide.' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. VÉRIFICATION CARACTÈRES RÉPÉTITIFS
  // ═══════════════════════════════════════════════════════════════════════════
  const cleanMessage = message.trim().toLowerCase();
  const uniqueChars = new Set(cleanMessage.split('')).size;
  if (uniqueChars < 3 && cleanMessage.length > 15) {
    console.log(`⚠️ [contact/vendeur] Message répétitif détecté - IP: ${ip}`);
    return res.status(400).json({ message: 'Message invalide.' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. VÉRIFICATION TAUX LETTRES/CHIFFRES
  // ═══════════════════════════════════════════════════════════════════════════
  const letterCount = (message.match(/[a-zA-Z]/g) || []).length;
  const digitCount = (message.match(/[0-9]/g) || []).length;
  if (digitCount > letterCount * 2 && letterCount < 20) {
    console.log(`⚠️ [contact/vendeur] Trop de chiffres dans le message - IP: ${ip}`);
    return res.status(400).json({ message: 'Message invalide.' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. RÉCUPÉRER L'EMAIL DU VENDEUR EN BD
  // ═══════════════════════════════════════════════════════════════════════════
  let vendeurEmail;
  let vendeurNomBD;
  try {
    const result = await pool.query(
      `SELECT email, COALESCE(nom_boutique, nom) AS nom_affiche
       FROM vendeurs
       WHERE id = $1 AND statut = 'actif'`,
      [vendeur_id]
    );
    if (result.rows.length === 0) {
      console.warn(`[contact/vendeur] Vendeur introuvable ou inactif: id=${vendeur_id}`);
      return res.status(404).json({ message: 'Vendeur introuvable.' });
    }
    vendeurEmail = result.rows[0].email;
    vendeurNomBD = result.rows[0].nom_affiche || vendeur_nom || 'le vendeur';
  } catch (err) {
    console.error('[contact/vendeur] Erreur BD:', err.message);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }

  // ── Construction du bloc produit HTML ────────────────────────────
  const blocProduitHtml = (contexte === 'produit' && produit_nom)
    ? `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#f0f5f5;border-radius:8px;overflow:hidden;font-size:13px;">
        <tr>
          <td style="padding:8px 14px;color:#537373;font-weight:700;width:70px;">Article</td>
          <td style="padding:8px 14px;color:#1f2937;">${escapeHtml(produit_nom)}</td>
        </tr>
        <tr>
          <td style="padding:8px 14px;color:#537373;font-weight:700;">SKU</td>
          <td style="padding:8px 14px;color:#1f2937;">${escapeHtml(produit_sku || 'non spécifié')}</td>
        </tr>
        <tr>
          <td style="padding:8px 14px;color:#537373;font-weight:700;">ID</td>
          <td style="padding:8px 14px;color:#1f2937;">${escapeHtml(String(produit_id || '—'))}</td>
        </tr>
      </table>`
    : '';

  // Sujet affiché dans l'email (contexte boutique)
  const sujetAffiche = sujet ? `<p style="margin:0 0 16px;font-size:14px;color:#374151;"><strong>Sujet :</strong> ${escapeHtml(sujet)}</p>` : '';

  const messageHtml = escapeHtml(message).replace(/\n/g, '<br>');

  // Ligne objet de l'email
  const ligneObjet = contexte === 'produit' && produit_nom
    ? `[e-Vend.ca] Message de ${escapeHtml(nom_expediteur)} — ${escapeHtml(produit_nom)}`
    : sujet
    ? `[e-Vend.ca] ${escapeHtml(sujet)} — de ${escapeHtml(nom_expediteur)}`
    : `[e-Vend.ca] Nouveau message de ${escapeHtml(nom_expediteur)}`;

  // ── Email au vendeur ──────────────────────────────────────────────
  const htmlVendeur = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#537373,#3d5c5c);padding:24px 28px;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-weight:800;">📩 Nouveau message d'un acheteur</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Via e-Vend.ca</p>
    </div>

    <div style="padding:28px;">
      <p style="color:#374151;font-size:14px;margin-top:0;">
        Bonjour <strong>${escapeHtml(vendeurNomBD)}</strong>,<br>
        Vous avez reçu un message via votre boutique e-Vend.ca.
      </p>

      <!-- Expéditeur -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">De la part de</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#1f2937;">${escapeHtml(nom_expediteur)}</p>
        <a href="mailto:${escapeHtml(email_expediteur)}" style="font-size:13px;color:#3b82f6;">${escapeHtml(email_expediteur)}</a>
      </div>

      ${sujetAffiche}
      ${blocProduitHtml}

      <!-- Message -->
      <div style="background:#f9fafb;border-left:4px solid #537373;border-radius:0 8px 8px 0;padding:16px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">${messageHtml}</p>
      </div>

      <!-- Bouton répondre -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="mailto:${escapeHtml(email_expediteur)}?subject=Re: ${ligneObjet.replace(/"/g, '')}"
           style="background:#537373;color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:700;display:inline-block;">
          ✉️ Répondre à ${escapeHtml(nom_expediteur)}
        </a>
      </div>

      <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">
        Pour répondre, cliquez sur le bouton ci-dessus ou utilisez simplement <strong>Répondre</strong> dans votre client email.<br>
        Votre réponse ira directement à l'acheteur.
      </p>
    </div>

    <div style="background:#f3f4f6;padding:14px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} e-Vend.ca — Marketplace québécois</p>
    </div>
  </div>
</body>
</html>`;

  // ── Email copie expéditeur ────────────────────────────────────────
  const htmlCopie = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px 28px;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-weight:800;">📋 Copie de votre message</h1>
    </div>

    <div style="padding:28px;">
      <p style="color:#374151;font-size:14px;margin-top:0;">
        Bonjour <strong>${escapeHtml(nom_expediteur)}</strong>,<br>
        Voici une copie du message que vous avez envoyé à <strong>${escapeHtml(vendeurNomBD)}</strong>.
      </p>

      ${sujetAffiche}
      ${blocProduitHtml}

      <div style="background:#f9fafb;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">${messageHtml}</p>
      </div>

      <p style="font-size:13px;color:#6b7280;text-align:center;">
        Le vendeur recevra votre message et pourra vous répondre directement par email.
      </p>
    </div>

    <div style="background:#f3f4f6;padding:14px 28px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b7280;">© ${new Date().getFullYear()} e-Vend.ca — Marketplace québécois</p>
    </div>
  </div>
</body>
</html>`;

  // ── Envoi ─────────────────────────────────────────────────────────
  try {
    // Email au vendeur (ReplyTo = email acheteur → Reply fonctionne direct)
    const ok = await envoyerEmail({
      to:      vendeurEmail,
      subject: ligneObjet,
      html:    htmlVendeur,
      replyTo: email_expediteur,
    });

    if (!ok) throw new Error('Échec envoi SES');

    console.log(`📩 [contact/vendeur] → ${vendeurEmail} | de: ${email_expediteur} | IP: ${ip} | ${rate.remaining}/${RATE_LIMIT_MAX} restants`);

    // Copie optionnelle à l'expéditeur
    if (copie_expediteur) {
      await envoyerEmail({
        to:      email_expediteur,
        subject: `[Copie] ${ligneObjet}`,
        html:    htmlCopie,
        replyTo: null,
      });
      console.log(`📋 [contact/vendeur] copie → ${email_expediteur}`);
    }

    return res.status(200).json({ succes: true, message: 'Message envoyé avec succès.' });

  } catch (err) {
    console.error('❌ [contact/vendeur] Erreur envoi:', err.message);
    return res.status(500).json({ message: "Erreur lors de l'envoi. Réessayez." });
  }
});

module.exports = router;