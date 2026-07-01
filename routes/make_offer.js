// routes/make_offer.js
// Gestion complète des offres (Make Offer) — sans Shopify
// Le code promo Shopify est remplacé par un lien direct vers le produit e-Vend

const express = require('express');
const router  = express.Router();
const db      = require('../config/database');
const jwt     = require('jsonwebtoken');

const FROM_EMAIL = process.env.FROM_EMAIL || 'evend.ca@outlook.com';

// ── Helpers ────────────────────────────────────────────────────────────────

function verifierToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}

async function getConfig() {
  try {
    const r = await db.query(
      `SELECT config_make_offer FROM configuration_generale_admin WHERE id = 1 LIMIT 1`
    );
    return r.rows[0]?.config_make_offer || {};
  } catch { return {}; }
}

async function getTemplateEmail(templateId, variables = {}, produitImageUrl = null, varianteInfo = null) {
  try {
    const result = await db.query(
      'SELECT sujet, html, actif FROM email_templates WHERE id = $1 LIMIT 1',
      [templateId]
    );
    if (result.rows.length === 0 || !result.rows[0].actif) return null;
    let { sujet, html } = result.rows[0];
    const dateStr = new Date().toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    const photoUrl = (varianteInfo && varianteInfo.image_url) || produitImageUrl || '';
    const badgeVariante = varianteInfo?.titre ? `<span class='photo-variante'>${varianteInfo.titre}</span>` : '';
    const allVars = { '{$date}': dateStr, '{$photo_produit}': photoUrl, '{$badge_variante}': badgeVariante, ...variables };
    for (const [cle, val] of Object.entries(allVars)) {
      const regex = new RegExp(cle.replace(/[${}]/g, c => '\\' + c), 'g');
      html  = html.replace(regex, String(val ?? ''));
      sujet = sujet.replace(regex, String(val ?? ''));
    }
    html  = html.replace(/\{\$[a-z_]+\}/g, '');
    sujet = sujet.replace(/\{\$[a-z_]+\}/g, '');
    return { sujet, html };
  } catch (err) {
    console.warn(`[make-offer] Erreur template ${templateId}:`, err.message);
    return null;
  }
}

async function envoyerEmail({ to, subject, html }) {
  try {
    const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
    const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1', credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });
    await ses.send(new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Html: { Data: html, Charset: 'UTF-8' } } },
      Source: FROM_EMAIL,
    }));
    console.log(`📧 Email Make Offer → ${to}`);
  } catch (err) {
    console.error(`❌ Erreur email → ${to}:`, err.message);
  }
}

function blocPhotoProduit({ produitImageUrl, produitTitre, varianteInfo, produitUrl }) {
  const imageUrl = varianteInfo?.image_url || produitImageUrl || null;
  if (!imageUrl) return '';
  return `<div style="text-align:center;margin-bottom:20px;"><a href="${produitUrl||'#'}" style="display:inline-block;text-decoration:none;"><img src="${imageUrl}" alt="${produitTitre||'Produit'}" width="200" height="200" style="width:200px;height:200px;object-fit:cover;border-radius:12px;border:2px solid #e1e4e8;display:block;"/><p style="font-size:13px;font-weight:700;color:#1a2332;margin:8px 0 0;font-family:Arial,sans-serif;">${produitTitre||''}</p></a></div>`;
}

// ── Templates emails ───────────────────────────────────────────────────────

function emailVendeurNouvelleOffre({ vendeurNom, acheteurNom, acheteurEmail, montant, produitTitre, produitUrl, offreId, messageAcheteur, expirationHeures = 48, produitImageUrl, varianteInfo }) {
  return {
    subject: `💬 Nouvelle offre reçue — ${produitTitre}`,
    html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg,#1a2436,#2d6a9f);padding:28px 32px;"><h1 style="color:white;margin:0;font-size:20px;font-weight:800;">💬 Nouvelle offre reçue</h1><p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">Bonjour ${vendeurNom}, un acheteur a fait une offre.</p></div><div style="padding:28px 32px;">${blocPhotoProduit({ produitImageUrl, varianteInfo, produitTitre, produitUrl })}<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;"><p style="font-size:13px;color:#15803d;margin:0 0 6px;font-weight:600;">Offre proposée</p><p style="font-size:36px;font-weight:900;color:#15803d;margin:0;">${montant} $</p></div><table style="width:100%;border-collapse:collapse;margin-bottom:20px;"><tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;width:35%;">Produit</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a2332;font-weight:600;">${produitTitre}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;">Acheteur</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a2332;">${acheteurNom}</td></tr><tr><td style="padding:10px 0;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;">Courriel</td><td style="padding:10px 0;font-size:13px;color:#1a2332;">${acheteurEmail}</td></tr>${messageAcheteur?`<tr><td style="padding:10px 0;font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;vertical-align:top;">Message</td><td style="padding:10px 0;font-size:13px;color:#1a2332;font-style:italic;">"${messageAcheteur}"</td></tr>`:''}</table><p style="font-size:13px;color:#6b7280;margin:0 0 20px;">Connectez-vous à votre tableau de bord pour accepter ou refuser. Elle expirera dans ${expirationHeures}h.</p><div style="text-align:center;margin-bottom:20px;"><a href="${produitUrl||'#'}" style="display:inline-block;background:#2d6a9f;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;">Voir le produit →</a></div></div><div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e1e4e8;text-align:center;"><p style="font-size:11px;color:#9ca3af;margin:0;">e-Vend — Réf. offre #${offreId}</p></div></div></body></html>`
  };
}

function emailAcheteurConfirmation({ acheteurNom, acheteurEmail, montant, produitTitre, produitUrl, offreId, expirationHeures = 48, produitImageUrl, varianteInfo }) {
  return {
    subject: `📤 Votre offre a été envoyée — ${produitTitre}`,
    html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;"><div style="background:linear-gradient(135deg,#1a2436,#2d6a9f);padding:28px 32px;"><h1 style="color:white;margin:0;font-size:20px;font-weight:800;">📤 Offre envoyée avec succès</h1></div><div style="padding:28px 32px;">${blocPhotoProduit({ produitImageUrl, varianteInfo, produitTitre, produitUrl })}<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;"><p style="font-size:13px;color:#0369a1;margin:0 0 6px;font-weight:600;">Votre offre</p><p style="font-size:36px;font-weight:900;color:#0369a1;margin:0;">${montant} $</p></div><p style="font-size:13px;color:#374151;margin:0 0 16px;">Le vendeur vous répondra dans les ${expirationHeures}h. Réf. #${offreId}</p><div style="text-align:center;"><a href="${produitUrl||'#'}" style="display:inline-block;background:#2d6a9f;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;">Voir le produit →</a></div></div></div></body></html>`
  };
}

function emailAcheteurAcceptee({ acheteurNom, montantOffre, produitTitre, produitUrl, offreId, expirationHeures = 48, produitImageUrl, varianteInfo }) {
  return {
    subject: `🎉 Votre offre a été acceptée — ${produitTitre}`,
    html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;"><div style="background:linear-gradient(135deg,#14532d,#16a34a);padding:28px 32px;"><h1 style="color:white;margin:0;font-size:20px;font-weight:800;">🎉 Offre acceptée !</h1><p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Bonjour ${acheteurNom}, le vendeur a accepté votre offre.</p></div><div style="padding:28px 32px;">${blocPhotoProduit({ produitImageUrl, varianteInfo, produitTitre, produitUrl })}<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;"><p style="font-size:13px;color:#15803d;margin:0 0 6px;font-weight:600;">Offre acceptée pour</p><p style="font-size:36px;font-weight:900;color:#15803d;margin:0;">${montantOffre} $</p></div><p style="font-size:13px;color:#374151;margin:0 0 20px;">Rendez-vous sur la page du produit pour finaliser votre achat au prix convenu.</p><div style="text-align:center;"><a href="${produitUrl||'#'}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:800;font-size:14px;">Finaliser mon achat →</a></div></div><div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e1e4e8;text-align:center;"><p style="font-size:11px;color:#9ca3af;margin:0;">e-Vend — Réf. offre #${offreId}</p></div></div></body></html>`
  };
}

function emailAcheteurRefusee({ acheteurNom, montant, produitTitre, produitUrl, offreId, produitImageUrl, varianteInfo }) {
  return {
    subject: `❌ Votre offre a été refusée — ${produitTitre}`,
    html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;"><div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;"><div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:28px 32px;"><h1 style="color:white;margin:0;font-size:20px;font-weight:800;">Offre non retenue</h1></div><div style="padding:28px 32px;">${blocPhotoProduit({ produitImageUrl, varianteInfo, produitTitre, produitUrl })}<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center;"><p style="font-size:32px;font-weight:900;color:#dc2626;margin:0;text-decoration:line-through;opacity:0.7;">${montant} $</p></div><p style="font-size:13px;color:#374151;margin:0 0 16px;">Vous pouvez faire une nouvelle offre ou acheter au prix affiché.</p><div style="text-align:center;"><a href="${produitUrl||'#'}" style="display:inline-block;background:#2d6a9f;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;">Voir le produit →</a></div></div><div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e1e4e8;text-align:center;"><p style="font-size:11px;color:#9ca3af;margin:0;">e-Vend — Réf. offre #${offreId}</p></div></div></body></html>`
  };
}

// ── POST /api/make-offer ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { annonce_id, vendeur_id, acheteur_email, acheteur_nom, montant, message, produit_titre, produit_url, variante_info = null } = req.body;

    if (!annonce_id || !acheteur_email || !montant) {
      return res.status(400).json({ success: false, message: 'Champs requis: annonce_id, acheteur_email, montant' });
    }
    if (isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }

    const cfg = await getConfig();
    if (!cfg.make_offer_actif) {
      return res.status(403).json({ success: false, message: 'Make Offer est désactivé.' });
    }

    const annonceResult = await db.query(
      `SELECT make_offer_enabled, make_offer_prix_min, make_offer_auto_accept,
              vendeur_id, prix, image, images, images_data
       FROM produits WHERE id::text = $1 LIMIT 1`,
      [String(annonce_id)]
    );

    if (annonceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Annonce introuvable.' });
    }

    const annonce = annonceResult.rows[0];

    if (!annonce.make_offer_enabled) {
      return res.status(403).json({ success: false, message: 'Make Offer non activé pour ce produit.' });
    }

    const montantNum = parseFloat(montant);

    if (annonce.make_offer_prix_min && montantNum < parseFloat(annonce.make_offer_prix_min)) {
      return res.status(400).json({ success: false, message: `Offre trop basse. Minimum: ${annonce.make_offer_prix_min} $.` });
    }

    const maxOffres = cfg.max_offres_par_produit || 10;
    const countResult = await db.query(
      `SELECT COUNT(*) FROM make_offers WHERE annonce_id = $1 AND statut = 'en_attente'`,
      [String(annonce_id)]
    );
    if (parseInt(countResult.rows[0].count) >= maxOffres) {
      return res.status(429).json({ success: false, message: 'Limite d\'offres atteinte. Réessayez plus tard.' });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (cfg.duree_expiration_heures || 48));

    const vendeurIdFinal = vendeur_id || annonce.vendeur_id;
    const doitAutoAccepter = cfg.auto_accept_global || (cfg.permettre_vendeur_auto_accept && annonce.make_offer_auto_accept);
    const statutInitial = doitAutoAccepter ? 'accepte' : 'en_attente';

    const insertResult = await db.query(
      `INSERT INTO make_offers (annonce_id, vendeur_id, acheteur_email, acheteur_nom, montant, statut, message, expires_at, accepted_at, variante_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [String(annonce_id), vendeurIdFinal || null, acheteur_email, acheteur_nom || null, montantNum, statutInitial, message || null, expiresAt, doitAutoAccepter ? new Date() : null, variante_info ? JSON.stringify(variante_info) : null]
    );

    const offreId = insertResult.rows[0].id;

    let vendeurEmail = null, vendeurNom = 'Vendeur';
    if (vendeurIdFinal) {
      const vr = await db.query(`SELECT email, nom FROM vendeurs WHERE id = $1 LIMIT 1`, [vendeurIdFinal]);
      if (vr.rows.length > 0) { vendeurEmail = vr.rows[0].email; vendeurNom = vr.rows[0].nom || 'Vendeur'; }
    }

    // Image produit
    let produitImageUrl = null;
    try {
      const imgRow = annonceResult.rows[0];
      if (variante_info?.image_url) { produitImageUrl = variante_info.image_url; }
      else if (imgRow.image) { produitImageUrl = imgRow.image; }
      else if (imgRow.images_data) {
        const imgs = typeof imgRow.images_data === 'string' ? JSON.parse(imgRow.images_data) : imgRow.images_data;
        if (Array.isArray(imgs) && imgs[0]?.url) produitImageUrl = imgs[0].url;
      } else if (imgRow.images) {
        const imgs = typeof imgRow.images === 'string' ? JSON.parse(imgRow.images) : imgRow.images;
        if (Array.isArray(imgs) && imgs[0]) produitImageUrl = imgs[0];
      }
    } catch {}

    const heuresExp = cfg.duree_expiration_heures || 48;
    const titreEmail = produit_titre || `Produit #${annonce_id}`;
    const urlEmail = produit_url || `${process.env.FRONTEND_URL || 'https://evend-multivendeur-api.onrender.com'}/produit/${annonce_id}`;

    // Email vendeur
    if (cfg.email_vendeur_nouvelle_offre && vendeurEmail && !doitAutoAccepter) {
      const tpl = await getTemplateEmail(51, { '{$nom_vendeur}': vendeurNom, '{$nom_acheteur}': acheteur_nom || acheteur_email, '{$email_acheteur}': acheteur_email, '{$nom_produit}': titreEmail, '{$montant_offre}': montantNum.toFixed(2), '{$heures_expiration}': String(heuresExp), '{$lien_produit}': urlEmail }, produitImageUrl, variante_info);
      if (tpl) { await envoyerEmail({ to: vendeurEmail, subject: tpl.sujet, html: tpl.html }); }
      else { const { subject, html } = emailVendeurNouvelleOffre({ vendeurNom, acheteurNom: acheteur_nom || acheteur_email, acheteurEmail: acheteur_email, montant: montantNum.toFixed(2), produitTitre: titreEmail, produitUrl: urlEmail, offreId, messageAcheteur: message, expirationHeures: heuresExp, produitImageUrl, varianteInfo: variante_info }); await envoyerEmail({ to: vendeurEmail, subject, html }); }
    }

    // Email acheteur
    if (cfg.email_acheteur_confirmation && !doitAutoAccepter) {
      const tpl = await getTemplateEmail(55, { '{$nom_acheteur}': acheteur_nom || acheteur_email, '{$nom_produit}': titreEmail, '{$montant_offre}': montantNum.toFixed(2), '{$ref_offre}': String(offreId), '{$heures_expiration}': String(heuresExp), '{$lien_produit}': urlEmail }, produitImageUrl, variante_info);
      if (tpl) { await envoyerEmail({ to: acheteur_email, subject: tpl.sujet, html: tpl.html }); }
      else { const { subject, html } = emailAcheteurConfirmation({ acheteurNom: acheteur_nom || acheteur_email, acheteurEmail: acheteur_email, montant: montantNum.toFixed(2), produitTitre: titreEmail, produitUrl: urlEmail, offreId, expirationHeures: heuresExp, produitImageUrl, varianteInfo: variante_info }); await envoyerEmail({ to: acheteur_email, subject, html }); }
    }

    // Auto-accept
    if (doitAutoAccepter && cfg.email_acheteur_accepte) {
      const tpl = await getTemplateEmail(52, { '{$nom_acheteur}': acheteur_nom || acheteur_email, '{$nom_produit}': titreEmail, '{$montant_offre}': montantNum.toFixed(2), '{$lien_produit}': urlEmail }, produitImageUrl, variante_info);
      if (tpl) { await envoyerEmail({ to: acheteur_email, subject: tpl.sujet, html: tpl.html }); }
      else { const { subject, html } = emailAcheteurAcceptee({ acheteurNom: acheteur_nom || acheteur_email, montantOffre: montantNum.toFixed(2), produitTitre: titreEmail, produitUrl: urlEmail, offreId, expirationHeures: heuresExp, produitImageUrl, varianteInfo: variante_info }); await envoyerEmail({ to: acheteur_email, subject, html }); }
    }

    console.log(`✅ Offre #${offreId} — ${acheteur_email} → ${montantNum}$ — ${statutInitial}`);
    res.json({ success: true, message: doitAutoAccepter ? '🎉 Offre automatiquement acceptée !' : '✅ Offre envoyée au vendeur !', offre_id: offreId, statut: statutInitial, auto_accepte: doitAutoAccepter });

  } catch (error) {
    console.error('[make-offer POST]', error.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ── GET /api/make-offer/produit/:annonce_id ────────────────────────────────
router.get('/produit/:annonce_id', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=30');
  try {
    const result = await db.query(
      `SELECT make_offer_enabled, make_offer_prix_min, make_offer_auto_accept
       FROM produits WHERE id::text = $1 LIMIT 1`,
      [String(req.params.annonce_id)]
    );
    if (result.rows.length === 0) return res.json({ success: true, actif: false });
    const { make_offer_enabled, make_offer_prix_min, make_offer_auto_accept } = result.rows[0];
    res.json({ success: true, actif: !!make_offer_enabled, prix_min: make_offer_prix_min ? parseFloat(make_offer_prix_min) : null, auto_accept: !!make_offer_auto_accept });
  } catch (error) {
    console.error('[make-offer/produit GET]', error.message);
    res.json({ success: true, actif: false });
  }
});

// ── GET /api/make-offer/vendeur ────────────────────────────────────────────
router.get('/vendeur', async (req, res) => {
  try {
    const decoded = verifierToken(req);
    if (!decoded) return res.status(401).json({ success: false, message: 'Non autorisé' });
    const vendeurId = decoded.id || decoded.vendeur_id;
    const result = await db.query(
      `SELECT mo.id, mo.annonce_id, mo.acheteur_email, mo.acheteur_nom, mo.montant, mo.statut, mo.message, mo.expires_at, mo.accepted_at, mo.refused_at, mo.created_at, mo.variante_info,
              a.nom AS produit_titre, a.image AS produit_image, a.images AS produit_images, a.images_data AS produit_images_data
       FROM make_offers mo
       LEFT JOIN produits a ON a.id::text = mo.annonce_id
       WHERE mo.vendeur_id = $1 ORDER BY mo.created_at DESC LIMIT 100`,
      [vendeurId]
    );
    const offres = result.rows.map(row => {
      let imageProduit = row.produit_image || null;
      if (row.variante_info) { try { const vi = typeof row.variante_info === 'string' ? JSON.parse(row.variante_info) : row.variante_info; if (vi.image_url) imageProduit = vi.image_url; } catch {} }
      if (!imageProduit && row.produit_images_data) { try { const imgs = typeof row.produit_images_data === 'string' ? JSON.parse(row.produit_images_data) : row.produit_images_data; if (Array.isArray(imgs) && imgs[0]?.url) imageProduit = imgs[0].url; } catch {} }
      if (!imageProduit && row.produit_images) { try { const imgs = typeof row.produit_images === 'string' ? JSON.parse(row.produit_images) : row.produit_images; if (Array.isArray(imgs) && imgs[0]) imageProduit = imgs[0]; } catch {} }
      return { ...row, produit_image_url: imageProduit };
    });
    res.json({ success: true, offres });
  } catch (error) {
    console.error('[make-offer/vendeur GET]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/make-offer/:id/accepter ─────────────────────────────────────
router.post('/:id/accepter', async (req, res) => {
  try {
    const decoded = verifierToken(req);
    if (!decoded) return res.status(401).json({ success: false, message: 'Non autorisé' });
    const offreId = parseInt(req.params.id);
    const vendeurId = decoded.id || decoded.vendeur_id;

    const offreResult = await db.query(
      `SELECT mo.*, a.nom AS produit_titre, a.prix AS prix_original, a.id AS produit_id
       FROM make_offers mo
       LEFT JOIN produits a ON a.id::text = mo.annonce_id
       WHERE mo.id = $1 AND (mo.vendeur_id = $2 OR $3 = 'admin')`,
      [offreId, vendeurId, decoded.role || '']
    );

    if (offreResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Offre introuvable.' });
    const offre = offreResult.rows[0];
    if (offre.statut !== 'en_attente') return res.status(400).json({ success: false, message: `Offre déjà en statut "${offre.statut}".` });

    const montantOffre = parseFloat(offre.montant);

    await db.query(
      `UPDATE make_offers SET statut = 'accepte', accepted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [offreId]
    );

    // Lien produit e-Vend (remplace le code promo Shopify)
    const produitUrl = `${process.env.FRONTEND_URL || 'https://evend-multivendeur-api.onrender.com'}/produit/${offre.annonce_id}`;

    const cfg = await getConfig();
    if (cfg.email_acheteur_accepte) {
      let produitImageUrl = null;
      try {
        const imgRes = await db.query(`SELECT image FROM produits WHERE id::text = $1 LIMIT 1`, [String(offre.annonce_id)]);
        produitImageUrl = imgRes.rows[0]?.image || null;
      } catch {}
      const varianteInfo = offre.variante_info ? (typeof offre.variante_info === 'string' ? JSON.parse(offre.variante_info) : offre.variante_info) : null;
      const tpl = await getTemplateEmail(52, { '{$nom_acheteur}': offre.acheteur_nom || offre.acheteur_email, '{$nom_produit}': offre.produit_titre || `Produit #${offre.annonce_id}`, '{$montant_offre}': montantOffre.toFixed(2), '{$lien_produit}': produitUrl }, produitImageUrl, varianteInfo);
      if (tpl) { await envoyerEmail({ to: offre.acheteur_email, subject: tpl.sujet, html: tpl.html }); }
      else { const { subject, html } = emailAcheteurAcceptee({ acheteurNom: offre.acheteur_nom || offre.acheteur_email, montantOffre: montantOffre.toFixed(2), produitTitre: offre.produit_titre || `Produit #${offre.annonce_id}`, produitUrl, offreId, produitImageUrl, varianteInfo }); await envoyerEmail({ to: offre.acheteur_email, subject, html }); }
    }

    console.log(`✅ Offre #${offreId} acceptée`);
    res.json({ success: true, message: "✅ Offre acceptée — l'acheteur a été notifié." });

  } catch (error) {
    console.error('[make-offer/accepter POST]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/make-offer/:id/refuser ──────────────────────────────────────
router.post('/:id/refuser', async (req, res) => {
  try {
    const decoded = verifierToken(req);
    if (!decoded) return res.status(401).json({ success: false, message: 'Non autorisé' });
    const offreId = parseInt(req.params.id);
    const vendeurId = decoded.id || decoded.vendeur_id;

    const offreResult = await db.query(
      `SELECT mo.*, a.nom AS produit_titre, a.id AS produit_id
       FROM make_offers mo LEFT JOIN produits a ON a.id::text = mo.annonce_id
       WHERE mo.id = $1 AND (mo.vendeur_id = $2 OR $3 = 'admin')`,
      [offreId, vendeurId, decoded.role || '']
    );

    if (offreResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Offre introuvable.' });
    const offre = offreResult.rows[0];
    if (offre.statut !== 'en_attente') return res.status(400).json({ success: false, message: `Offre déjà en statut "${offre.statut}".` });

    await db.query(`UPDATE make_offers SET statut = 'refuse', refused_at = NOW(), updated_at = NOW() WHERE id = $1`, [offreId]);

    const cfg = await getConfig();
    const produitUrl = `${process.env.FRONTEND_URL || 'https://evend-multivendeur-api.onrender.com'}/produit/${offre.annonce_id}`;
    if (cfg.email_acheteur_refuse) {
      let produitImageUrl = null;
      try { const imgRes = await db.query(`SELECT image FROM produits WHERE id::text = $1 LIMIT 1`, [String(offre.annonce_id)]); produitImageUrl = imgRes.rows[0]?.image || null; } catch {}
      const varianteInfo = offre.variante_info ? (typeof offre.variante_info === 'string' ? JSON.parse(offre.variante_info) : offre.variante_info) : null;
      const tpl = await getTemplateEmail(53, { '{$nom_acheteur}': offre.acheteur_nom || offre.acheteur_email, '{$nom_produit}': offre.produit_titre || `Produit #${offre.annonce_id}`, '{$montant_offre}': parseFloat(offre.montant).toFixed(2), '{$lien_produit}': produitUrl }, produitImageUrl, varianteInfo);
      if (tpl) { await envoyerEmail({ to: offre.acheteur_email, subject: tpl.sujet, html: tpl.html }); }
      else { const { subject, html } = emailAcheteurRefusee({ acheteurNom: offre.acheteur_nom || offre.acheteur_email, montant: parseFloat(offre.montant).toFixed(2), produitTitre: offre.produit_titre || `Produit #${offre.annonce_id}`, produitUrl, offreId, produitImageUrl, varianteInfo }); await envoyerEmail({ to: offre.acheteur_email, subject, html }); }
    }

    console.log(`❌ Offre #${offreId} refusée`);
    res.json({ success: true, message: "❌ Offre refusée — l'acheteur a été notifié." });

  } catch (error) {
    console.error('[make-offer/refuser POST]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/make-offer/admin ──────────────────────────────────────────────
router.get('/admin', async (req, res) => {
  try {
    const decoded = verifierToken(req);
    if (!decoded || decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Accès admin requis' });
    const { statut, limit = 50, offset = 0 } = req.query;
    let query = `SELECT mo.id, mo.annonce_id, mo.acheteur_email, mo.acheteur_nom, mo.montant, mo.statut, mo.message, mo.expires_at, mo.accepted_at, mo.refused_at, mo.created_at, mo.vendeur_id, v.nom AS vendeur_nom, a.nom AS produit_titre FROM make_offers mo LEFT JOIN vendeurs v ON v.id = mo.vendeur_id LEFT JOIN produits a ON a.id::text = mo.annonce_id`;
    const params = [];
    if (statut) { query += ` WHERE mo.statut = $${params.length + 1}`; params.push(statut); }
    query += ` ORDER BY mo.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(query, params);
    const stats = await db.query(`SELECT COUNT(*) FILTER (WHERE statut='en_attente') AS en_attente, COUNT(*) FILTER (WHERE statut='accepte') AS acceptees, COUNT(*) FILTER (WHERE statut='refuse') AS refusees, COUNT(*) AS total FROM make_offers`);
    res.json({ success: true, offres: result.rows, stats: stats.rows[0] });
  } catch (error) {
    console.error('[make-offer/admin GET]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── CRON — expirer les offres ──────────────────────────────────────────────
async function expirerOffres() {
  try {
    const result = await db.query(`UPDATE make_offers SET statut = 'expire', updated_at = NOW() WHERE statut = 'en_attente' AND expires_at < NOW() RETURNING id`);
    if (result.rowCount > 0) console.log(`⏰ Make Offer — ${result.rowCount} offre(s) expirée(s)`);
  } catch (err) {
    console.warn('⚠️ Erreur cron expiration offres:', err.message);
  }
}

router.expirerOffres = expirerOffres;
module.exports = router;