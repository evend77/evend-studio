import React, { useState, useEffect, useMemo, useCallback } from 'react';

const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
};

type Canal  = 'email' | 'interne' | 'les_deux';
type Theme  = 'compte' | 'commandes' | 'paiements' | 'produits' | 'litiges' | 'offres' | 'abonnements' | 'vacances' | 'alertes';

interface Template {
  id: number; nom: string; theme: Theme;
  destinataire: 'vendeur' | 'acheteur'; canal: Canal;
  actif: boolean; sujet: string; html: string;
  variables: { cle: string; desc: string }[];
}

const THEMES: Record<Theme, { label: string; icon: string; couleur: string; bg: string }> = {
  compte:      { label: 'Compte & Sécurité',     icon: '🔵', couleur: '#1d4ed8', bg: '#eff6ff' },
  commandes:   { label: 'Commandes & Livraison',  icon: '🟢', couleur: '#15803d', bg: '#f0fdf4' },
  paiements:   { label: 'Paiements & Factures',   icon: '🟡', couleur: '#a16207', bg: '#fefce8' },
  produits:    { label: 'Produits & Catalogue',   icon: '🟠', couleur: '#c2410c', bg: '#fff7ed' },
  litiges:     { label: 'Litiges & Retours RMA',  icon: '🔴', couleur: '#b91c1c', bg: '#fef2f2' },
  offres:      { label: 'Offres & Négociations',  icon: '🟣', couleur: '#7e22ce', bg: '#faf5ff' },
  abonnements: { label: 'Abonnements & Forfaits', icon: '⚫', couleur: '#1f2937', bg: '#f9fafb' },
  vacances:    { label: 'Vacances & Absences',    icon: '⚪', couleur: '#6b7280', bg: '#f9fafb' },
  alertes:     { label: 'Alertes Prix',            icon: '💰', couleur: '#d97706', bg: '#fffbeb' },
};

const CANAL_CONFIG: Record<Canal, { label: string; icon: string }> = {
  email:    { label: 'Email seulement',      icon: '📧' },
  interne:  { label: 'Notification interne', icon: '🔔' },
  les_deux: { label: 'Email + Notification', icon: '📧🔔' },
};

// ── Layout HTML partagé (baseHTML) ────────────────────────────────────────
const baseHTML = (sujet: string, corps: string, couleur = '#2d6a9f') => `<!DOCTYPE html>
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
.box { background:#f8fafc; border-left:4px solid ${couleur}; border-radius:0 8px 8px 0; padding:14px 18px; margin:16px 0; }
.row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #f3f4f6; font-size:12px; }
.row:last-child { border-bottom:none; }
.row .lbl { color:#6b7280; } .row .val { font-weight:700; color:#1a2332; }
.hr { height:1px; background:#e1e4e8; margin:20px 0; }
.otp { background:#1a2332; border-radius:12px; padding:24px; text-align:center; margin:20px 0; }
.otp-code { font-size:40px; font-weight:900; letter-spacing:8px; color:#fbbf24; font-family:monospace; }
.otp-note { font-size:11px; color:#9ca3af; margin-top:8px; }
.badge-ok  { background:#dcfce7; color:#16a34a; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.badge-warn{ background:#fef3c7; color:#d97706; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.badge-err { background:#fee2e2; color:#dc2626; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.ftr { background:#f8fafc; border-radius:0 0 12px 12px; border:1px solid #e1e4e8; border-top:none; padding:18px 32px; text-align:center; }
.ftr p { font-size:10px; color:#9ca3af; line-height:1.6; }
.photo-produit { text-align:center; margin:0 0 20px 0; }
.photo-produit a { text-decoration:none; display:inline-block; }
.photo-produit img { width:180px; height:180px; object-fit:cover; border-radius:12px; border:2px solid #e1e4e8; display:block; }
.photo-produit .photo-titre { font-size:12px; font-weight:700; color:#1a2332; margin-top:8px; }
.photo-produit .photo-variante { display:inline-block; background:rgba(0,0,0,0.7); color:white; font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px; margin-top:4px; }
.felicitations { background:linear-gradient(135deg,#f0fdf4,#dcfce7); border:2px solid #86efac; border-radius:12px; padding:20px 24px; margin:0 0 20px 0; text-align:center; }
.felicitations .f-icon { font-size:40px; margin-bottom:8px; }
.felicitations .f-titre { font-size:17px; font-weight:900; color:#15803d; margin-bottom:4px; }
.felicitations .f-sous { font-size:12px; color:#16a34a; }
.code-promo-bloc { background:white; border:2px dashed #16a34a; border-radius:10px; padding:16px 20px; margin:16px 0; text-align:center; }
.code-promo-label { font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; }
.code-promo-value { font-size:28px; font-weight:900; color:#15803d; letter-spacing:4px; font-family:monospace; }
.code-promo-note { font-size:11px; color:#6b7280; margin-top:6px; }
.alerte-expiration { background:#fffbeb; border:1px solid #fcd34d; border-radius:8px; padding:10px 14px; margin-top:12px; font-size:12px; color:#92400e; }
.steps { margin:16px 0; }
.step { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid #f3f4f6; }
.step:last-child { border-bottom:none; }
.step-num { width:28px; height:28px; border-radius:50%; background:${couleur}; color:white; font-size:12px; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.step-txt { font-size:12px; color:#374151; padding-top:4px; }
</style></head>
<body><div class="wrap">
<div class="hdr"><div class="logo">e<em>-</em>Vend<span style="color:rgba(255,255,255,0.4);font-size:12px;">.ca</span></div><div class="hdr-sub">${sujet}</div></div>
<div class="body">${corps}</div>
<div class="ftr"><p><strong>e-Vend.ca</strong> · La marketplace québécoise<br>© 2026 e-Vend.ca — Tous droits réservés · {$date}</p></div>
</div></body></html>`;

const VC = [
  { cle: '{$date}',           desc: "Date d'envoi" },
  { cle: '{$nom_boutique}',   desc: 'Nom boutique e-Vend' },
  { cle: '{$lien_dashboard}', desc: 'Lien tableau de bord' },
];
const VV = [
  { cle: '{$nom_vendeur}',          desc: 'Nom complet vendeur' },
  { cle: '{$nom_boutique_vendeur}', desc: 'Nom boutique vendeur' },
  { cle: '{$email_vendeur}',        desc: 'Courriel vendeur' },
  { cle: '{$plan_actuel}',          desc: 'Plan souscrit' },
];
const VA = [
  { cle: '{$nom_acheteur}',  desc: "Nom complet acheteur" },
  { cle: '{$email_acheteur}',desc: "Courriel acheteur" },
];
const VCO = [
  { cle: '{$numero_commande}', desc: 'N° commande' },
  { cle: '{$date_commande}',   desc: 'Date commande' },
  { cle: '{$montant_total}',   desc: 'Montant total' },
  { cle: '{$liste_produits}',  desc: 'Liste produits' },
  { cle: '{$adresse_livraison}',desc:'Adresse livraison' },
];

const SUJETS: Record<number, string> = {
  1: 'Bienvenue sur e-Vend.ca, {$nom_vendeur} ! 🎉',
  2: 'Bienvenue sur e-Vend.ca, {$nom_acheteur} ! 🎉',
  3: '🔐 Vérifiez votre adresse courriel — e-Vend.ca',
  4: '✅ Votre compte vendeur e-Vend a été approuvé !',
  5: '⚠️ Votre compte e-Vend a été suspendu',
  6: '✅ Votre compte e-Vend a été réactivé',
  7: '🔑 Réinitialisation de votre mot de passe vendeur',
  8: '🔑 Réinitialisation de votre mot de passe e-Vend',
  9: '🔑 Votre code de connexion e-Vend : {$code_otp}',
  10: '📢 Message de l\'administration e-Vend',
  11: '🛒 Nouvelle commande #{$numero_commande} reçue !',
  12: '✅ Confirmation de votre commande #{$numero_commande}',
  13: '📦 Votre commande #{$numero_commande} est en route !',
  14: '📦 Confirmation d\'expédition — #{$numero_commande}',
  15: '✏️ Numéro de suivi mis à jour — #{$numero_commande}',
  16: '🏠 Votre commande #{$numero_commande} est prête !',
  17: '⏰ Rappel — Commande #{$numero_commande} non expédiée',
  18: '❌ Votre commande #{$numero_commande} a été annulée',
  19: '💾 Votre téléchargement est prêt — #{$numero_commande}',
  20: '🔄 Fichier numérique mis à jour — {$nom_produit}',
  21: '💰 Virement reçu — {$montant_paiement}',
  22: '💰 Remboursement de {$montant_remboursement} en cours',
  23: '🧾 Votre facture e-Vend — #{$numero_commande}',
  24: '🧾 Votre facture de commission — {$date}',
  25: '🧾 Facture abonnement {$plan_actuel} — {$date}',
  26: '❌ Échec du virement Stripe — Action requise',
  27: '❌ Échec du virement PayPal — Action requise',
  31: '✅ Votre produit "{$nom_produit}" a été approuvé !',
  32: '❌ Votre produit "{$nom_produit}" a été refusé',
  33: '⚠️ Votre produit "{$nom_produit}" a été désactivé',
  34: '⚠️ Stock faible pour "{$nom_produit}"',
  35: '📅 Votre produit "{$nom_produit}" sera publié demain !',
  36: '🌐 Votre produit "{$nom_produit}" est publié !',
  41: '⚖️ Un litige a été ouvert — #{$numero_commande}',
  42: '⚖️ Mise à jour de votre litige — #{$numero_commande}',
  43: '📦 Demande de retour reçue — #{$numero_commande}',
  44: '✅ Votre retour #{$numero_rma} est approuvé',
  45: '📦 Retour #{$numero_rma} reçu — Inspection requise',
  51: '💬 Nouvelle offre reçue pour "{$nom_produit}"',
  52: '🎉 Votre offre pour "{$nom_produit}" est acceptée !',
  53: '❌ Votre offre pour "{$nom_produit}" a été refusée',
  54: '💬 Contre-offre pour "{$nom_produit}"',
  55: '📤 Votre offre pour "{$nom_produit}" a bien été envoyée',
  61: '⏰ Votre plan {$plan_actuel} se renouvelle dans 7 jours',
  62: '✅ Votre plan a été mis à jour — {$plan_actuel}',
  63: '⚠️ Votre plan {$plan_actuel} a expiré',
  64: '❌ Échec du paiement — Abonnement {$plan_actuel}',
  71: '🏖️ Mode vacances activé pour votre boutique',
  72: '📅 Votre mode vacances se termine dans 2 jours',
  73: '🎉 Bienvenue de retour ! Votre boutique est réactivée',
  74: '🏖️ La boutique "{$nom_boutique_vendeur}" est en vacances',
  80: '💰 Baisse de prix ! {$product_title}',
};

const TEMPLATES_INIT: Template[] = [
  {
    id: 1, nom: 'Bienvenue nouveau vendeur', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'email', actif: true,
    sujet: SUJETS[1],
    html: baseHTML(SUJETS[1], `<p class='greeting'>Bonjour {$nom_vendeur} 👋</p><div class='content'><p>Bienvenue sur <strong>e-Vend.ca</strong> ! Votre compte vendeur a été créé.</p><div class='box'><div class='row'><span class='lbl'>Boutique</span><span class='val'>{$nom_boutique_vendeur}</span></div><div class='row'><span class='lbl'>Plan</span><span class='val'>{$plan_actuel}</span></div></div><a href='{$lien_dashboard}' class='btn'>Accéder à mon tableau de bord →</a></div>`, '#1d4ed8'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$lien_dashboard}', desc: 'Lien tableau de bord' },
    ],
  },
  {
    id: 2, nom: 'Bienvenue nouvel acheteur', theme: 'compte' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[2],
    html: baseHTML(SUJETS[2], `<p class='greeting'>Bonjour {$nom_acheteur} 👋</p><div class='content'><p>Bienvenue sur <strong>e-Vend.ca</strong> ! Votre compte a été créé avec succès.</p><a href='{$lien_dashboard}' class='btn'>Découvrir e-Vend.ca →</a></div>`, '#1d4ed8'),
    variables: [
    ...VC,
    ...VA,
    ],
  },
  {
    id: 3, nom: 'Vérification email vendeur', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'email', actif: true,
    sujet: SUJETS[3],
    html: baseHTML(SUJETS[3], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Confirmez votre adresse courriel pour activer votre compte.</p><a href='{$lien_verification}' class='btn'>✅ Confirmer mon adresse</a><p style='font-size:11px;color:#9ca3af;'>Lien valide 48h. Si vous n'avez pas créé de compte, ignorez ce message.</p></div>`, '#1d4ed8'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$lien_verification}', desc: 'Lien vérification' },
    ],
  },
  {
    id: 4, nom: 'Approbation compte vendeur', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[4],
    html: baseHTML(SUJETS[4], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>🎉 Votre compte vendeur est <span class='badge-ok'>APPROUVÉ</span> !</p><div class='box'><div class='row'><span class='lbl'>Boutique</span><span class='val'>{$nom_boutique_vendeur}</span></div><div class='row'><span class='lbl'>Plan</span><span class='val'>{$plan_actuel}</span></div></div><a href='{$lien_dashboard}' class='btn'>Commencer à vendre →</a></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VV,
    ],
  },
  {
    id: 5, nom: 'Compte vendeur suspendu', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[5],
    html: baseHTML(SUJETS[5], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre compte est <span class='badge-warn'>SUSPENDU</span> temporairement.</p><div class='box'><div class='row'><span class='lbl'>Boutique</span><span class='val'>{$nom_boutique_vendeur}</span></div><div class='row'><span class='lbl'>Date</span><span class='val'>{$date}</span></div></div><a href='{$lien_dashboard}' class='btn'>Contacter le support →</a></div>`, '#d97706'),
    variables: [
    ...VC,
    ...VV,
    ],
  },
  {
    id: 6, nom: 'Compte vendeur réactivé', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[6],
    html: baseHTML(SUJETS[6], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre compte est <span class='badge-ok'>RÉACTIVÉ</span>.</p><a href='{$lien_dashboard}' class='btn'>Accéder à ma boutique →</a></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VV,
    ],
  },
  {
    id: 7, nom: 'Mot de passe oublié — vendeur', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'email', actif: true,
    sujet: SUJETS[7],
    html: baseHTML(SUJETS[7], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Vous avez demandé la réinitialisation de votre mot de passe vendeur.</p><a href='{$lien_reinitialisation}' class='btn'>🔑 Créer un nouveau mot de passe</a><p style='font-size:11px;color:#9ca3af;'>Lien valide 24h.</p></div>`, '#7c3aed'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$lien_reinitialisation}', desc: 'Lien réinitialisation' },
    ],
  },
  {
    id: 8, nom: 'Mot de passe oublié — acheteur', theme: 'compte' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[8],
    html: baseHTML(SUJETS[8], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Vous avez demandé la réinitialisation de votre mot de passe.</p><a href='{$lien_reinitialisation}' class='btn'>🔑 Créer un nouveau mot de passe</a><p style='font-size:11px;color:#9ca3af;'>Lien valide 24h.</p></div>`, '#7c3aed'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$lien_reinitialisation}', desc: 'Lien réinitialisation' },
    ],
  },
  {
    id: 9, nom: 'Code OTP — 2 facteurs', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'email', actif: true,
    sujet: SUJETS[9],
    html: baseHTML(SUJETS[9], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre code de connexion e-Vend :</p><div class='otp'><div class='otp-code'>{$code_otp}</div><div class='otp-note'>Valide 10 minutes · Ne partagez jamais ce code</div></div><p style='font-size:11px;color:#dc2626;'>⚠️ Si vous n'avez pas tenté de vous connecter, changez votre mot de passe.</p></div>`, '#1a2332'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$code_otp}', desc: 'Code OTP 6 chiffres' },
    ],
  },
  {
    id: 10, nom: 'Message admin interne', theme: 'compte' as Theme,
    destinataire: 'vendeur', canal: 'interne', actif: true,
    sujet: SUJETS[10],
    html: baseHTML(SUJETS[10], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Vous avez reçu un message de l'administration e-Vend.ca.</p><a href='{$lien_dashboard}' class='btn'>📬 Lire le message →</a></div>`, '#1d4ed8'),
    variables: [
    ...VC,
    ...VV,
    ],
  },
  {
    id: 11, nom: 'Nouvelle commande — vendeur', theme: 'commandes' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[11],
    html: baseHTML(SUJETS[11], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>🎉 Nouvelle commande sur <strong>{$nom_boutique_vendeur}</strong> !</p><div class='box'><div class='row'><span class='lbl'>N°</span><span class='val'>#{$numero_commande}</span></div><div class='row'><span class='lbl'>Date</span><span class='val'>{$date_commande}</span></div><div class='row'><span class='lbl'>Montant</span><span class='val'>{$montant_total}</span></div><div class='row'><span class='lbl'>Livraison</span><span class='val'>{$adresse_livraison}</span></div></div><a href='{$lien_dashboard}' class='btn'>Traiter cette commande →</a></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VV,
    ...VCO,
    ],
  },
  {
    id: 12, nom: 'Confirmation commande — acheteur', theme: 'commandes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[12],
    html: baseHTML(SUJETS[12], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Merci pour votre commande sur e-Vend.ca !</p><div class='box'><div class='row'><span class='lbl'>N°</span><span class='val'>#{$numero_commande}</span></div><div class='row'><span class='lbl'>Boutique</span><span class='val'>{$nom_boutique_vendeur}</span></div><div class='row'><span class='lbl'>Livraison</span><span class='val'>{$methode_livraison}</span></div><div class='row'><span class='lbl'>Total TTC</span><span class='val'><strong>{$total_avec_taxes}</strong></span></div></div><a href='{$lien_dashboard}' class='btn'>Suivre ma commande →</a></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VA,
    ...VCO,
    { cle: '{$total_avec_taxes}', desc: 'Total TTC' },
    { cle: '{$methode_livraison}', desc: 'Méthode livraison' },
    { cle: '{$nom_boutique_vendeur}', desc: 'Boutique vendeur' },
    ],
  },
  {
    id: 13, nom: 'Commande expédiée — acheteur', theme: 'commandes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[13],
    html: baseHTML(SUJETS[13], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>📦 Votre commande <strong>#{$numero_commande}</strong> a été expédiée !</p><div class='box'><div class='row'><span class='lbl'>Transporteur</span><span class='val'>{$transporteur}</span></div><div class='row'><span class='lbl'>N° suivi</span><span class='val'><strong>{$numero_suivi}</strong></span></div></div><a href='{$lien_suivi}' class='btn'>📦 Suivre mon colis →</a></div>`, '#0891b2'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$transporteur}', desc: 'Transporteur' },
    { cle: '{$numero_suivi}', desc: 'N° suivi' },
    { cle: '{$lien_suivi}', desc: 'Lien suivi' },
    ],
  },
  {
    id: 14, nom: 'Confirmation expédition — vendeur', theme: 'commandes' as Theme,
    destinataire: 'vendeur', canal: 'interne', actif: true,
    sujet: SUJETS[14],
    html: baseHTML(SUJETS[14], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Confirmation d'expédition enregistrée pour la commande <strong>#{$numero_commande}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Suivi</span><span class='val'>{$numero_suivi}</span></div><div class='row'><span class='lbl'>Transporteur</span><span class='val'>{$transporteur}</span></div></div><p style='font-size:11px;color:#6b7280;'>L'acheteur a été notifié automatiquement.</p></div>`, '#0891b2'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$transporteur}', desc: 'Transporteur' },
    { cle: '{$numero_suivi}', desc: 'N° suivi' },
    ],
  },
  {
    id: 15, nom: 'Numéro de suivi modifié', theme: 'commandes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[15],
    html: baseHTML(SUJETS[15], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Numéro de suivi mis à jour pour la commande <strong>#{$numero_commande}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Nouveau suivi</span><span class='val'><strong>{$numero_suivi}</strong></span></div><div class='row'><span class='lbl'>Transporteur</span><span class='val'>{$transporteur}</span></div></div><a href='{$lien_suivi}' class='btn'>Suivre mon colis →</a></div>`, '#0891b2'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$transporteur}', desc: 'Transporteur' },
    { cle: '{$numero_suivi}', desc: 'Nouveau N° suivi' },
    { cle: '{$lien_suivi}', desc: 'Lien suivi' },
    ],
  },
  {
    id: 16, nom: 'Commande prête pour ramassage', theme: 'commandes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[16],
    html: baseHTML(SUJETS[16], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Votre commande <strong>#{$numero_commande}</strong> est prête à ramasser !</p><div class='box'><div class='row'><span class='lbl'>Adresse</span><span class='val'>{$adresse_ramassage}</span></div><div class='row'><span class='lbl'>Heures</span><span class='val'>{$heures_ouverture}</span></div><div class='row'><span class='lbl'>Date limite</span><span class='val'><span class='badge-warn'>{$date_limite_ramassage}</span></span></div></div></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$adresse_ramassage}', desc: 'Adresse ramassage' },
    { cle: '{$heures_ouverture}', desc: "Heures d'ouverture" },
    { cle: '{$date_limite_ramassage}', desc: 'Date limite' },
    ],
  },
  {
    id: 17, nom: 'Rappel expédition — retard', theme: 'commandes' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[17],
    html: baseHTML(SUJETS[17], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>⚠️ La commande <strong>#{$numero_commande}</strong> n'a pas encore été expédiée.</p><div class='box'><div class='row'><span class='lbl'>Jours écoulés</span><span class='val'><span class='badge-warn'>{$jours_attente} jours</span></span></div></div><a href='{$lien_dashboard}' class='btn'>Traiter cette commande →</a></div>`, '#d97706'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$jours_attente}', desc: 'Jours écoulés' },
    ],
  },
  {
    id: 18, nom: 'Commande annulée', theme: 'commandes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[18],
    html: baseHTML(SUJETS[18], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Votre commande <strong>#{$numero_commande}</strong> est <span class='badge-err'>ANNULÉE</span>.</p><div class='box'><div class='row'><span class='lbl'>Motif</span><span class='val'>{$motif_annulation}</span></div></div><p>Le remboursement sera traité sous 3 à 5 jours ouvrables.</p></div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$motif_annulation}', desc: "Motif d'annulation" },
    ],
  },
  {
    id: 19, nom: 'Téléchargement prêt — numérique', theme: 'commandes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[19],
    html: baseHTML(SUJETS[19], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Votre produit numérique est disponible !</p><div class='box'><div class='row'><span class='lbl'>Produit</span><span class='val'>{$nom_produit}</span></div><div class='row'><span class='lbl'>Expiration</span><span class='val'>{$date_expiration_lien}</span></div><div class='row'><span class='lbl'>Téléchargements max</span><span class='val'>{$nb_telechargements_max}</span></div></div><a href='{$lien_telechargement}' class='btn'>💾 Télécharger →</a></div>`, '#7c3aed'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$nom_produit}', desc: 'Nom produit' },
    { cle: '{$lien_telechargement}', desc: 'Lien téléchargement' },
    { cle: '{$date_expiration_lien}', desc: 'Expiration lien' },
    { cle: '{$nb_telechargements_max}', desc: 'Max téléchargements' },
    ],
  },
  {
    id: 20, nom: 'Téléchargement mis à jour', theme: 'commandes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[20],
    html: baseHTML(SUJETS[20], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Votre fichier numérique a été mis à jour par <strong>{$nom_boutique_vendeur}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Produit</span><span class='val'>{$nom_produit}</span></div><div class='row'><span class='lbl'>Version</span><span class='val'><span class='badge-ok'>{$version_produit}</span></span></div></div><a href='{$lien_telechargement}' class='btn'>💾 Télécharger la mise à jour →</a></div>`, '#7c3aed'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$nom_produit}', desc: 'Nom produit' },
    { cle: '{$version_produit}', desc: 'N° version' },
    { cle: '{$lien_telechargement}', desc: 'Lien mis à jour' },
    { cle: '{$date_expiration_lien}', desc: 'Expiration' },
    ],
  },
  {
    id: 21, nom: 'Virement reçu — vendeur', theme: 'paiements' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[21],
    html: baseHTML(SUJETS[21], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Un virement a été effectué sur votre compte.</p><div class='box'><div class='row'><span class='lbl'>Montant</span><span class='val'><strong>{$montant_paiement}</strong></span></div><div class='row'><span class='lbl'>Référence</span><span class='val'>{$numero_facture}</span></div><div class='row'><span class='lbl'>Commission déduite</span><span class='val'>-{$montant_commission} ({$taux_commission}%)</span></div></div><a href='{$lien_dashboard}' class='btn'>Voir mes finances →</a></div>`, '#a16207'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$montant_paiement}', desc: 'Montant' },
    { cle: '{$numero_facture}', desc: 'N° facture' },
    { cle: '{$montant_commission}', desc: 'Commission' },
    { cle: '{$taux_commission}', desc: 'Taux commission' },
    ],
  },
  {
    id: 22, nom: 'Remboursement émis — acheteur', theme: 'paiements' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[22],
    html: baseHTML(SUJETS[22], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Un remboursement a été émis pour la commande <strong>#{$numero_commande}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Montant remboursé</span><span class='val'><strong>{$montant_remboursement}</strong></span></div></div><p>Crédité dans 3 à 5 jours ouvrables.</p></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$montant_remboursement}', desc: 'Montant remboursé' },
    { cle: '{$numero_commande}', desc: 'N° commande' },
    ],
  },
  {
    id: 23, nom: "Facture d'achat — acheteur", theme: 'paiements' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[23],
    html: baseHTML(SUJETS[23], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Votre facture pour la commande <strong>#{$numero_commande}</strong>.</p><div class='box'><div class='row'><span class='lbl'>N° Facture</span><span class='val'>{$numero_facture}</span></div><div class='row'><span class='lbl'>Boutique</span><span class='val'>{$nom_boutique_vendeur}</span></div><div class='row'><span class='lbl'>Sous-total</span><span class='val'>{$sous_total}</span></div><div class='row'><span class='lbl'>TPS (5%)</span><span class='val'>{$tps}</span></div><div class='row'><span class='lbl'>TVQ (9.975%)</span><span class='val'>{$tvq}</span></div><div class='row'><span class='lbl'>Total TTC</span><span class='val'><strong>{$total_avec_taxes}</strong></span></div></div><a href='{$lien_facture}' class='btn'>📄 Télécharger la facture PDF →</a></div>`, '#a16207'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$numero_facture}', desc: 'N° facture' },
    { cle: '{$nom_boutique_vendeur}', desc: 'Boutique' },
    { cle: '{$sous_total}', desc: 'Sous-total' },
    { cle: '{$tps}', desc: 'TPS 5%' },
    { cle: '{$tvq}', desc: 'TVQ 9.975%' },
    { cle: '{$total_avec_taxes}', desc: 'Total TTC' },
    { cle: '{$lien_facture}', desc: 'Lien PDF' },
    ],
  },
  {
    id: 24, nom: 'Facture commission — vendeur', theme: 'paiements' as Theme,
    destinataire: 'vendeur', canal: 'email', actif: true,
    sujet: SUJETS[24],
    html: baseHTML(SUJETS[24], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre facture de commission.</p><div class='box'><div class='row'><span class='lbl'>N° Facture</span><span class='val'>{$numero_facture}</span></div><div class='row'><span class='lbl'>Taux</span><span class='val'>{$taux_commission}%</span></div><div class='row'><span class='lbl'>Commission</span><span class='val'><strong>{$montant_commission}</strong></span></div></div><a href='{$lien_facture}' class='btn'>📄 Télécharger PDF →</a></div>`, '#a16207'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$numero_facture}', desc: 'N° facture' },
    { cle: '{$taux_commission}', desc: 'Taux' },
    { cle: '{$montant_commission}', desc: 'Commission' },
    { cle: '{$lien_facture}', desc: 'Lien PDF' },
    ],
  },
  {
    id: 25, nom: 'Facture abonnement — vendeur', theme: 'paiements' as Theme,
    destinataire: 'vendeur', canal: 'email', actif: true,
    sujet: SUJETS[25],
    html: baseHTML(SUJETS[25], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre facture d'abonnement <strong>{$plan_actuel}</strong>.</p><div class='box'><div class='row'><span class='lbl'>N° Facture</span><span class='val'>{$numero_facture}</span></div><div class='row'><span class='lbl'>Période</span><span class='val'>{$date} → {$date_renouvellement}</span></div><div class='row'><span class='lbl'>Montant HT</span><span class='val'>{$montant_paiement}</span></div><div class='row'><span class='lbl'>TPS (5%)</span><span class='val'>{$tps}</span></div><div class='row'><span class='lbl'>TVQ (9.975%)</span><span class='val'>{$tvq}</span></div><div class='row'><span class='lbl'>Total TTC</span><span class='val'><strong>{$total_ttc}</strong></span></div></div><a href='{$lien_facture}' class='btn'>📄 Télécharger PDF →</a></div>`, '#a16207'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$numero_facture}', desc: 'N° facture' },
    { cle: '{$montant_paiement}', desc: 'Montant HT' },
    { cle: '{$tps}', desc: 'TPS' },
    { cle: '{$tvq}', desc: 'TVQ' },
    { cle: '{$total_ttc}', desc: 'Total TTC' },
    { cle: '{$lien_facture}', desc: 'Lien PDF' },
    ],
  },
  {
    id: 26, nom: 'Erreur paiement Stripe', theme: 'paiements' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[26],
    html: baseHTML(SUJETS[26], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>⚠️ Virement Stripe échoué pour <strong>{$nom_boutique_vendeur}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Montant</span><span class='val'>{$montant_paiement}</span></div><div class='row'><span class='lbl'>Erreur</span><span class='val'><span class='badge-err'>{$code_erreur}</span></span></div></div><a href='{$lien_dashboard}' class='btn'>Vérifier mon compte Stripe →</a></div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$code_erreur}', desc: "Code d'erreur Stripe" },
    ],
  },
  {
    id: 27, nom: 'Erreur paiement PayPal', theme: 'paiements' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[27],
    html: baseHTML(SUJETS[27], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>⚠️ Virement PayPal échoué pour <strong>{$nom_boutique_vendeur}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Montant</span><span class='val'>{$montant_paiement}</span></div><div class='row'><span class='lbl'>Raison</span><span class='val'><span class='badge-err'>{$raison_echec}</span></span></div></div><a href='{$lien_dashboard}' class='btn'>Vérifier mon compte PayPal →</a></div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$raison_echec}', desc: "Raison de l'échec" },
    ],
  },
  {
    id: 31, nom: 'Produit approuvé', theme: 'produits' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[31],
    html: baseHTML(SUJETS[31], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>🎉 Votre produit est <span class='badge-ok'>APPROUVÉ</span> !</p><div class='box'><div class='row'><span class='lbl'>Produit</span><span class='val'>{$nom_produit}</span></div><div class='row'><span class='lbl'>SKU</span><span class='val'>{$sku_produit}</span></div></div><a href='{$lien_produit}' class='btn'>Voir mon produit →</a></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$nom_produit}', desc: 'Nom produit' },
    { cle: '{$sku_produit}', desc: 'SKU' },
    { cle: '{$lien_produit}', desc: 'Lien produit' },
    ],
  },
  {
    id: 32, nom: 'Produit refusé', theme: 'produits' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[32],
    html: baseHTML(SUJETS[32], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre produit est <span class='badge-err'>REFUSÉ</span>.</p><div class='box'><div class='row'><span class='lbl'>Produit</span><span class='val'>{$nom_produit}</span></div><div class='row'><span class='lbl'>Motif</span><span class='val'>{$motif_refus}</span></div></div><a href='{$lien_dashboard}' class='btn'>Modifier et soumettre →</a></div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$nom_produit}', desc: 'Nom produit' },
    { cle: '{$sku_produit}', desc: 'SKU' },
    { cle: '{$motif_refus}', desc: 'Motif' },
    ],
  },
  {
    id: 33, nom: 'Produit désactivé', theme: 'produits' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[33],
    html: baseHTML(SUJETS[33], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre produit est <span class='badge-warn'>DÉSACTIVÉ</span>.</p><div class='box'><div class='row'><span class='lbl'>Produit</span><span class='val'>{$nom_produit}</span></div><div class='row'><span class='lbl'>Raison</span><span class='val'>{$raison_desactivation}</span></div></div><a href='{$lien_dashboard}' class='btn'>Corriger et réactiver →</a></div>`, '#d97706'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$nom_produit}', desc: 'Nom produit' },
    { cle: '{$raison_desactivation}', desc: 'Raison' },
    ],
  },
  {
    id: 34, nom: 'Stock faible', theme: 'produits' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[34],
    html: baseHTML(SUJETS[34], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>⚠️ Stock faible pour <strong>{$nom_produit}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Qté restante</span><span class='val'><span class='badge-warn'>{$quantite_restante} unités</span></span></div><div class='row'><span class='lbl'>Seuil</span><span class='val'>{$seuil_alerte} unités</span></div></div><a href='{$lien_produit}' class='btn'>Réapprovisionner →</a></div>`, '#d97706'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$nom_produit}', desc: 'Produit' },
    { cle: '{$quantite_restante}', desc: 'Qté restante' },
    { cle: '{$sku_produit}', desc: 'SKU' },
    { cle: '{$seuil_alerte}', desc: "Seuil d'alerte" },
    ],
  },
  {
    id: 35, nom: 'Publication future — rappel veille', theme: 'produits' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[35],
    html: baseHTML(SUJETS[35], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>📅 Votre produit <strong>{$nom_produit}</strong> sera publié demain !</p><div class='box'><div class='row'><span class='lbl'>Date</span><span class='val'>{$date_publication}</span></div><div class='row'><span class='lbl'>Heure</span><span class='val'>{$heure_publication}</span></div></div><a href='{$lien_produit}' class='btn'>Vérifier mon produit →</a></div>`, '#c2410c'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$nom_produit}', desc: 'Produit' },
    { cle: '{$date_publication}', desc: 'Date prévue' },
    { cle: '{$heure_publication}', desc: 'Heure' },
    ],
  },
  {
    id: 36, nom: 'Produit futur publié', theme: 'produits' as Theme,
    destinataire: 'vendeur', canal: 'interne', actif: true,
    sujet: SUJETS[36],
    html: baseHTML(SUJETS[36], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre produit <strong>{$nom_produit}</strong> est <span class='badge-ok'>PUBLIÉ</span> automatiquement !</p><a href='{$lien_produit}' class='btn'>Voir en ligne →</a></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$nom_produit}', desc: 'Produit' },
    { cle: '{$sku_produit}', desc: 'SKU' },
    ],
  },
  {
    id: 41, nom: 'Litige ouvert — vendeur', theme: 'litiges' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[41],
    html: baseHTML(SUJETS[41], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>⚠️ Un litige a été ouvert pour la commande <strong>#{$numero_commande}</strong>.</p><a href='{$lien_litige}' class='btn'>⚖️ Gérer ce litige →</a></div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$numero_commande}', desc: 'N° commande' },
    { cle: '{$lien_litige}', desc: 'Lien litige' },
    ],
  },
  {
    id: 42, nom: 'Litige mis à jour — acheteur', theme: 'litiges' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[42],
    html: baseHTML(SUJETS[42], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Mise à jour de votre litige pour la commande <strong>#{$numero_commande}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Statut</span><span class='val'>{$statut_litige}</span></div></div><a href='{$lien_litige}' class='btn'>Voir mon litige →</a></div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$numero_commande}', desc: 'N° commande' },
    { cle: '{$statut_litige}', desc: 'Statut' },
    { cle: '{$lien_litige}', desc: 'Lien litige' },
    ],
  },
  {
    id: 43, nom: 'Demande retour RMA reçue', theme: 'litiges' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[43],
    html: baseHTML(SUJETS[43], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Demande de retour RMA reçue pour la commande <strong>#{$numero_commande}</strong>.</p><div class='box'><div class='row'><span class='lbl'>N° RMA</span><span class='val'><strong>{$numero_rma}</strong></span></div><div class='row'><span class='lbl'>Motif</span><span class='val'>{$motif_retour}</span></div><div class='row'><span class='lbl'>Statut</span><span class='val'><span class='badge-warn'>En attente</span></span></div></div></div>`, '#7e22ce'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$numero_commande}', desc: 'N° commande' },
    { cle: '{$numero_rma}', desc: 'N° RMA' },
    { cle: '{$produits_retour}', desc: 'Produits' },
    { cle: '{$motif_retour}', desc: 'Motif' },
    ],
  },
  {
    id: 44, nom: 'Retour RMA approuvé', theme: 'litiges' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[44],
    html: baseHTML(SUJETS[44], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>Votre retour <strong>#{$numero_rma}</strong> est <span class='badge-ok'>APPROUVÉ</span> !</p><div class='box'><div class='row'><span class='lbl'>Adresse retour</span><span class='val'>{$adresse_retour}</span></div><div class='row'><span class='lbl'>Date limite expédition</span><span class='val'><span class='badge-warn'>{$date_limite_retour}</span></span></div></div><p>{$instructions_retour}</p></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$numero_rma}', desc: 'N° RMA' },
    { cle: '{$adresse_retour}', desc: 'Adresse retour' },
    { cle: '{$date_limite_retour}', desc: 'Date limite' },
    { cle: '{$instructions_retour}', desc: 'Instructions' },
    ],
  },
  {
    id: 45, nom: 'Retour RMA reçu — vendeur', theme: 'litiges' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[45],
    html: baseHTML(SUJETS[45], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Colis de retour reçu pour votre boutique.</p><div class='box'><div class='row'><span class='lbl'>N° RMA</span><span class='val'>{$numero_rma}</span></div><div class='row'><span class='lbl'>Commande</span><span class='val'>#{$numero_commande}</span></div></div><p>Inspectez le colis dans les <strong>48 heures</strong>.</p><a href='{$lien_dashboard}' class='btn'>Traiter ce retour →</a></div>`, '#7e22ce'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$numero_rma}', desc: 'N° RMA' },
    { cle: '{$numero_commande}', desc: 'N° commande' },
    ],
  },
  {
    id: 51, nom: 'Nouvelle offre reçue — vendeur', theme: 'offres' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[51],
    html: baseHTML(SUJETS[51], `
<p class='greeting'>Bonjour {$nom_vendeur},</p>
<div class='content'>
  <p>Vous avez reçu une nouvelle offre sur l'un de vos produits. Connectez-vous à votre tableau de bord pour accepter ou refuser.</p>

  <div class='photo-produit'>
    <a href='{$lien_produit}'>
      <img src='{$photo_produit}' alt='{$nom_produit}' />
      <p class='photo-titre'>{$nom_produit}</p>
      {$badge_variante}
    </a>
  </div>

  <div class='box'>
    <div class='row'><span class='lbl'>Prix affiché</span><span class='val'>{$prix_original} $</span></div>
    <div class='row'><span class='lbl'>Offre proposée</span><span class='val'><strong style="font-size:16px;color:#7e22ce;">{$montant_offre} $</strong></span></div>
    <div class='row'><span class='lbl'>Écart</span><span class='val'>{$ecart_offre} $</span></div>
    <div class='row'><span class='lbl'>Acheteur</span><span class='val'>{$nom_acheteur}</span></div>
    <div class='row'><span class='lbl'>Courriel acheteur</span><span class='val'>{$email_acheteur}</span></div>
    <div class='row'><span class='lbl'>Expire dans</span><span class='val'><span class='badge-warn'>{$heures_expiration}h</span></span></div>
  </div>

  {$bloc_message_acheteur}

  <div class='alerte-expiration'>⚠️ Répondez dans les {$heures_expiration} heures — passé ce délai, l'offre sera automatiquement expirée.</div>

  <div style='text-align:center;margin-top:20px;'>
    <a href='{$lien_offre}' class='btn'>Répondre à cette offre →</a>
  </div>
</div>`, '#7e22ce'),
    variables: [
    ...VC,
    ...VV,
    ...VA,
    { cle: '{$nom_produit}',       desc: 'Nom du produit' },
    { cle: '{$photo_produit}',     desc: 'URL photo produit' },
    { cle: '{$badge_variante}',    desc: 'Badge variante HTML (optionnel)' },
    { cle: '{$prix_original}',     desc: 'Prix affiché' },
    { cle: '{$montant_offre}',     desc: 'Montant offre proposé' },
    { cle: '{$ecart_offre}',       desc: 'Différence prix - offre' },
    { cle: '{$heures_expiration}', desc: 'Heures avant expiration' },
    { cle: '{$bloc_message_acheteur}', desc: 'Bloc message acheteur HTML' },
    { cle: '{$lien_offre}',        desc: 'Lien dashboard offres' },
    { cle: '{$lien_produit}',      desc: 'Lien page produit' },
    ],
  },
  {
    id: 52, nom: 'Offre acceptée — acheteur', theme: 'offres' as Theme,
    destinataire: 'acheteur', canal: 'les_deux', actif: true,
    sujet: SUJETS[52],
    html: baseHTML(SUJETS[52], `
<p class='greeting'>Bonjour {$nom_acheteur} 🎉</p>
<div class='content'>

  <div class='felicitations'>
    <div class='f-icon'>🎉</div>
    <div class='f-titre'>Félicitations ! Votre offre a été acceptée !</div>
    <div class='f-sous'>Le vendeur a dit oui à votre proposition — vous avez fait une excellente affaire !</div>
  </div>

  <div class='photo-produit'>
    <a href='{$lien_produit}'>
      <img src='{$photo_produit}' alt='{$nom_produit}' />
      <p class='photo-titre'>{$nom_produit}</p>
      {$badge_variante}
    </a>
  </div>

  <div class='box'>
    <div class='row'><span class='lbl'>Prix original</span><span class='val'><s>{$prix_original} $</s></span></div>
    <div class='row'><span class='lbl'>✅ Votre offre acceptée</span><span class='val'><strong style="color:#15803d;font-size:16px;">{$montant_offre} $</strong></span></div>
    <div class='row'><span class='lbl'>🎁 Vous économisez</span><span class='val'><strong style="color:#16a34a;">{$montant_rabais} $</strong></span></div>
    <div class='row'><span class='lbl'>Code de réduction</span><span class='val'><span class='badge-ok'>{$code_promo}</span></span></div>
    <div class='row'><span class='lbl'>Valide jusqu'au</span><span class='val'><span class='badge-warn'>{$date_expiration_offre}</span></span></div>
  </div>

  <div class='code-promo-bloc'>
    <div class='code-promo-label'>🎟️ Votre code de réduction personnel</div>
    <div class='code-promo-value'>{$code_promo}</div>
    <div class='code-promo-note'>Usage unique · Valide jusqu'au {$date_expiration_offre}</div>
  </div>

  <div class='steps'>
    <p style='font-weight:700;font-size:13px;margin-bottom:8px;'>Comment utiliser votre code :</p>
    <div class='step'><div class='step-num'>1</div><div class='step-txt'>Cliquez sur "Voir le produit" ci-dessous et ajoutez-le au panier</div></div>
    <div class='step'><div class='step-num'>2</div><div class='step-txt'>Au checkout Shopify, entrez le code <strong>{$code_promo}</strong> dans le champ "Code de réduction"</div></div>
    <div class='step'><div class='step-num'>3</div><div class='step-txt'>Le rabais de <strong>{$montant_rabais} $</strong> sera appliqué automatiquement ✅</div></div>
  </div>

  <div style='text-align:center;margin:20px 0;'>
    <a href='{$lien_produit}' class='btn'>🛒 Acheter maintenant →</a>
  </div>

  <div class='alerte-expiration'>⏰ Ce code expire le {$date_expiration_offre} — ne tardez pas !</div>
</div>`, '#15803d'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$nom_produit}',          desc: 'Nom du produit' },
    { cle: '{$photo_produit}',        desc: 'URL photo produit' },
    { cle: '{$badge_variante}',       desc: 'Badge variante HTML' },
    { cle: '{$prix_original}',        desc: 'Prix original' },
    { cle: '{$montant_offre}',        desc: 'Montant accepté' },
    { cle: '{$montant_rabais}',       desc: 'Montant économisé' },
    { cle: '{$code_promo}',           desc: 'Code promo Shopify' },
    { cle: '{$date_expiration_offre}',desc: 'Date expiration code' },
    { cle: '{$lien_produit}',         desc: 'Lien page produit' },
    ],
  },
  {
    id: 53, nom: 'Offre refusée — acheteur', theme: 'offres' as Theme,
    destinataire: 'acheteur', canal: 'les_deux', actif: true,
    sujet: SUJETS[53],
    html: baseHTML(SUJETS[53], `
<p class='greeting'>Bonjour {$nom_acheteur},</p>
<div class='content'>
  <p>Malheureusement, le vendeur n'a pas pu accepter votre offre cette fois-ci. Ne vous découragez pas — vous pouvez faire une nouvelle offre ou acheter au prix affiché.</p>

  <div class='photo-produit'>
    <a href='{$lien_produit}'>
      <img src='{$photo_produit}' alt='{$nom_produit}' />
      <p class='photo-titre'>{$nom_produit}</p>
      {$badge_variante}
    </a>
  </div>

  <div class='box'>
    <div class='row'><span class='lbl'>Produit</span><span class='val'>{$nom_produit}</span></div>
    <div class='row'><span class='lbl'>Votre offre</span><span class='val'><s style="color:#dc2626;">{$montant_offre} $</s></span></div>
    <div class='row'><span class='lbl'>Prix affiché</span><span class='val'>{$prix_original} $</span></div>
  </div>

  <div style='background:#fef9c3;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:16px 0;'>
    <p style='font-size:12px;color:#92400e;margin:0;'>💡 <strong>Conseil :</strong> essayez une offre un peu plus proche du prix affiché pour augmenter vos chances d'acceptation.</p>
  </div>

  <div style='text-align:center;margin:20px 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;'>
    <a href='{$lien_nouvelle_offre}' class='btn'>💬 Faire une nouvelle offre</a>
    <a href='{$lien_produit}' style='display:inline-block;border:1px solid #e1e4e8;color:#374151 !important;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px;text-decoration:none;margin:16px 0;'>Acheter au prix normal</a>
  </div>
</div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$nom_produit}',       desc: 'Nom du produit' },
    { cle: '{$photo_produit}',     desc: 'URL photo produit' },
    { cle: '{$badge_variante}',    desc: 'Badge variante HTML' },
    { cle: '{$montant_offre}',     desc: 'Montant refusé' },
    { cle: '{$prix_original}',     desc: 'Prix affiché' },
    { cle: '{$lien_produit}',      desc: 'Lien page produit' },
    { cle: '{$lien_nouvelle_offre}',desc:'Lien pour refaire une offre' },
    ],
  },
  {
    id: 54, nom: 'Contre-offre reçue — acheteur', theme: 'offres' as Theme,
    destinataire: 'acheteur', canal: 'les_deux', actif: true,
    sujet: SUJETS[54],
    html: baseHTML(SUJETS[54], `
<p class='greeting'>Bonjour {$nom_acheteur},</p>
<div class='content'>
  <p>Le vendeur a examiné votre offre et vous propose une contre-offre. C'est une bonne nouvelle — il est intéressé à vendre !</p>

  <div class='photo-produit'>
    <a href='{$lien_produit}'>
      <img src='{$photo_produit}' alt='{$nom_produit}' />
      <p class='photo-titre'>{$nom_produit}</p>
      {$badge_variante}
    </a>
  </div>

  <div class='box'>
    <div class='row'><span class='lbl'>Prix affiché</span><span class='val'>{$prix_original} $</span></div>
    <div class='row'><span class='lbl'>Votre offre initiale</span><span class='val'>{$montant_offre} $</span></div>
    <div class='row'><span class='lbl'>💬 Contre-offre du vendeur</span><span class='val'><strong style="color:#7e22ce;font-size:15px;">{$montant_contre_offre} $</strong></span></div>
    <div class='row'><span class='lbl'>Valide jusqu'au</span><span class='val'><span class='badge-warn'>{$date_expiration_offre}</span></span></div>
  </div>

  <div style='text-align:center;margin:20px 0;'>
    <a href='{$lien_offre}' class='btn'>Répondre à la contre-offre →</a>
  </div>

  <div class='alerte-expiration'>⚠️ Cette contre-offre expire le {$date_expiration_offre} — répondez rapidement !</div>
</div>`, '#7e22ce'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$nom_produit}',           desc: 'Nom du produit' },
    { cle: '{$photo_produit}',         desc: 'URL photo produit' },
    { cle: '{$badge_variante}',        desc: 'Badge variante HTML' },
    { cle: '{$prix_original}',         desc: 'Prix affiché' },
    { cle: '{$montant_offre}',         desc: 'Offre initiale acheteur' },
    { cle: '{$montant_contre_offre}',  desc: 'Contre-offre vendeur' },
    { cle: '{$date_expiration_offre}', desc: 'Expiration contre-offre' },
    { cle: '{$lien_offre}',            desc: 'Lien pour répondre' },
    { cle: '{$lien_produit}',          desc: 'Lien page produit' },
    ],
  },
  {
    id: 55, nom: 'Confirmation envoi offre — acheteur', theme: 'offres' as Theme,
    destinataire: 'acheteur', canal: 'les_deux', actif: true,
    sujet: SUJETS[55],
    html: baseHTML(SUJETS[55], `
<p class='greeting'>Bonjour {$nom_acheteur},</p>
<div class='content'>
  <p>Votre offre a bien été transmise au vendeur. Vous recevrez une notification dès qu'il vous répond.</p>

  <div class='photo-produit'>
    <a href='{$lien_produit}'>
      <img src='{$photo_produit}' alt='{$nom_produit}' />
      <p class='photo-titre'>{$nom_produit}</p>
      {$badge_variante}
    </a>
  </div>

  <div class='box'>
    <div class='row'><span class='lbl'>Produit</span><span class='val'>{$nom_produit}</span></div>
    <div class='row'><span class='lbl'>Prix affiché</span><span class='val'>{$prix_original} $</span></div>
    <div class='row'><span class='lbl'>📤 Votre offre</span><span class='val'><strong style="color:#2d6a9f;font-size:15px;">{$montant_offre} $</strong></span></div>
    <div class='row'><span class='lbl'>Réf. offre</span><span class='val'>#{$ref_offre}</span></div>
    <div class='row'><span class='lbl'>Expire dans</span><span class='val'><span class='badge-warn'>{$heures_expiration}h</span></span></div>
  </div>

  {$bloc_message_envoye}

  <div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin:16px 0;'>
    <p style='font-size:12px;color:#0369a1;margin:0;'>📧 Vous recevrez un courriel dès que le vendeur répond à votre offre. Le délai de réponse habituel est de quelques heures.</p>
  </div>

  <div style='text-align:center;margin:20px 0;'>
    <a href='{$lien_produit}' class='btn'>Voir le produit →</a>
  </div>

  <div class='alerte-expiration'>⏰ Votre offre expire automatiquement dans {$heures_expiration} heures si le vendeur ne répond pas.</div>
</div>`, '#2d6a9f'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$nom_produit}',       desc: 'Nom du produit' },
    { cle: '{$photo_produit}',     desc: 'URL photo produit' },
    { cle: '{$badge_variante}',    desc: 'Badge variante HTML' },
    { cle: '{$prix_original}',     desc: 'Prix affiché' },
    { cle: '{$montant_offre}',     desc: "Montant de l'offre envoyée" },
    { cle: '{$ref_offre}',         desc: 'Référence offre (ID)' },
    { cle: '{$heures_expiration}', desc: 'Heures avant expiration' },
    { cle: '{$bloc_message_envoye}',desc:'Bloc confirmation message HTML' },
    { cle: '{$lien_produit}',      desc: 'Lien page produit' },
    ],
  },
  {
    id: 61, nom: 'Renouvellement plan — rappel 7j', theme: 'abonnements' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[61],
    html: baseHTML(SUJETS[61], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>⏰ Votre abonnement <strong>{$plan_actuel}</strong> se renouvelle dans <strong>7 jours</strong>.</p><div class='box'><div class='row'><span class='lbl'>Date renouvellement</span><span class='val'>{$date_renouvellement}</span></div><div class='row'><span class='lbl'>Montant</span><span class='val'>{$montant_paiement}</span></div></div><a href='{$lien_abonnement}' class='btn'>Gérer mon abonnement →</a></div>`, '#1f2937'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$date_renouvellement}', desc: 'Date renouvellement' },
    { cle: '{$montant_paiement}', desc: 'Montant' },
    ],
  },
  {
    id: 62, nom: 'Plan changé — confirmation', theme: 'abonnements' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[62],
    html: baseHTML(SUJETS[62], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre plan a été modifié avec succès.</p><div class='box'><div class='row'><span class='lbl'>Ancien plan</span><span class='val'>{$ancien_plan}</span></div><div class='row'><span class='lbl'>Nouveau plan</span><span class='val'><span class='badge-ok'>{$plan_actuel}</span></span></div><div class='row'><span class='lbl'>Prochain renouvellement</span><span class='val'>{$date_renouvellement}</span></div></div></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$ancien_plan}', desc: 'Ancien plan' },
    { cle: '{$date_renouvellement}', desc: 'Prochain renouvellement' },
    ],
  },
  {
    id: 63, nom: 'Plan expiré', theme: 'abonnements' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[63],
    html: baseHTML(SUJETS[63], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre plan <strong>{$plan_actuel}</strong> est <span class='badge-err'>EXPIRÉ</span>.</p><p>Votre boutique est temporairement suspendue.</p><a href='{$lien_abonnement}' class='btn'>Renouveler mon abonnement →</a></div>`, '#d97706'),
    variables: [
    ...VC,
    ...VV,
    ],
  },
  {
    id: 64, nom: 'Paiement plan échoué', theme: 'abonnements' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[64],
    html: baseHTML(SUJETS[64], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>⚠️ Échec du paiement de l'abonnement <strong>{$plan_actuel}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Raison</span><span class='val'><span class='badge-err'>{$raison_echec}</span></span></div></div><a href='{$lien_paiement}' class='btn'>Mettre à jour le paiement →</a></div>`, '#b91c1c'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$raison_echec}', desc: "Raison de l'échec" },
    ],
  },
  {
    id: 71, nom: 'Mode vacances activé', theme: 'vacances' as Theme,
    destinataire: 'vendeur', canal: 'interne', actif: true,
    sujet: SUJETS[71],
    html: baseHTML(SUJETS[71], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Mode vacances activé pour <strong>{$nom_boutique_vendeur}</strong>.</p><div class='box'><div class='row'><span class='lbl'>Début</span><span class='val'>{$date_debut_vacances}</span></div><div class='row'><span class='lbl'>Retour prévu</span><span class='val'>{$date_fin_vacances}</span></div></div></div>`, '#6b7280'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$date_debut_vacances}', desc: 'Début' },
    { cle: '{$date_fin_vacances}', desc: 'Fin' },
    { cle: '{$message_vacances}', desc: 'Message acheteurs' },
    ],
  },
  {
    id: 72, nom: 'Fin vacances dans 2 jours', theme: 'vacances' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[72],
    html: baseHTML(SUJETS[72], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>Votre mode vacances se termine dans <strong>2 jours</strong>.</p><div class='box'><div class='row'><span class='lbl'>Date de fin</span><span class='val'>{$date_fin_vacances}</span></div></div><a href='{$lien_dashboard}' class='btn'>Gérer mes vacances →</a></div>`, '#6b7280'),
    variables: [
    ...VC,
    ...VV,
    { cle: '{$date_fin_vacances}', desc: 'Date fin' },
    ],
  },
  {
    id: 73, nom: 'Retour vacances — boutique active', theme: 'vacances' as Theme,
    destinataire: 'vendeur', canal: 'les_deux', actif: true,
    sujet: SUJETS[73],
    html: baseHTML(SUJETS[73], `<p class='greeting'>Bonjour {$nom_vendeur},</p><div class='content'><p>🎉 Votre boutique <strong>{$nom_boutique_vendeur}</strong> est <span class='badge-ok'>ACTIVE</span> !</p><a href='{$lien_dashboard}' class='btn'>Voir ma boutique →</a></div>`, '#15803d'),
    variables: [
    ...VC,
    ...VV,
    ],
  },
  {
    id: 74, nom: 'Boutique en vacances — acheteur', theme: 'vacances' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: false,
    sujet: SUJETS[74],
    html: baseHTML(SUJETS[74], `<p class='greeting'>Bonjour {$nom_acheteur},</p><div class='content'><p>La boutique <strong>{$nom_boutique_vendeur}</strong> est en mode vacances.</p><div class='box'><div class='row'><span class='lbl'>Retour prévu</span><span class='val'>{$date_fin_vacances}</span></div></div></div>`, '#6b7280'),
    variables: [
    ...VC,
    ...VA,
    { cle: '{$date_fin_vacances}', desc: 'Date retour' },
    { cle: '{$message_vacances}', desc: 'Message' },
    ],
  },
  {
    id: 80, nom: 'Alerte baisse de prix — acheteur', theme: 'alertes' as Theme,
    destinataire: 'acheteur', canal: 'email', actif: true,
    sujet: SUJETS[80],
    html: baseHTML(SUJETS[80], `
      <p class='greeting'>Bonjour,</p>
      <div class='content'>
        <p>Le produit que vous surveillez a baissé de prix !</p>
        <div class='box' style='text-align:center;'>
          {$product_image}
          <h3 style='margin:0 0 8px 0;text-align:left;'>{$product_title}</h3>
          <div style='display:flex;align-items:center;gap:16px;margin:10px 0;'>
            <span style='text-decoration:line-through;color:#9ca3af;font-size:14px;'>{$prix_avant} $</span>
            <span style='font-size:28px;font-weight:900;color:#16a34a;'>{$prix_actuel} $ CAD</span>
          </div>
          <p style='font-size:12px;color:#6b7280;margin:4px 0;'>Votre prix cible : {$prix_cible} $</p>
        </div>
        {$message_acheteur}
        <a href='{$product_url}' class='btn' style='background:#d97706;'>Voir le produit →</a>
        <p style='margin-top:20px;font-size:11px;color:#9ca3af;'>Vous recevez cet email car vous avez activé une alerte prix sur e-Vend.ca.</p>
      </div>
    `, '#d97706'),
    variables: [
      ...VC,
      { cle: '{$product_title}',    desc: 'Nom du produit' },
      { cle: '{$product_image}',    desc: 'Image du produit (balise <img>)' },
      { cle: '{$prix_avant}',       desc: 'Prix avant la baisse' },
      { cle: '{$prix_actuel}',      desc: 'Nouveau prix actuel' },
      { cle: '{$prix_cible}',       desc: "Prix cible de l'acheteur" },
      { cle: '{$message_acheteur}', desc: "Note optionnelle de l'acheteur" },
      { cle: '{$product_url}',      desc: 'URL du produit Shopify' },
    ],
  },
];
const HTML_ORIGINAL: Record<number, string> = Object.fromEntries(
  TEMPLATES_INIT.map(t => [t.id, t.html])
);

function Toast({ msg, type }: { msg: string; type: 'success'|'danger'|'info' }) {
  const bg = { success: T.success, danger: T.danger, info: T.accent }[type];
  return <div style={{ position:'fixed', top:'20px', right:'20px', backgroundColor:bg, color:'white', padding:'12px 18px', borderRadius:'10px', fontSize:'13px', fontWeight:'700', zIndex:3000, boxShadow:'0 4px 16px rgba(0,0,0,0.2)' }}>{msg}</div>;
}

export default function ModelesCourriel({ naviguerVers }: { naviguerVers: (p: string, d?: any) => void }) {
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES_INIT);
  const [actifId, setActifId]     = useState<number>(1);
  const [onglet, setOnglet]       = useState<'apercu'|'editeur'|'variables'>('apercu');
  const [recherche, setRecherche] = useState('');
  const [toast, setToast]         = useState<{msg:string;type:'success'|'danger'|'info'}|null>(null);
  const [popupReinit, setPopupReinit] = useState(false);
  const [popupTest, setPopupTest]     = useState(false);
  const [emailTest, setEmailTest]     = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [sauvegarde, setSauvegarde]     = useState(false);

  const API = 'https://evend-multivendeur-api.onrender.com/api';

  // Charger les templates sauvegardés depuis la BD au montage
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/modeles-email`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((rows: any[]) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        setTemplates(prev => prev.map(t => {
          const saved = rows.find((r: any) => r.id === t.id);
          if (!saved) return t;
          return { ...t, sujet: saved.sujet, html: saved.html, actif: saved.actif, canal: saved.canal };
        }));
      })
      .catch(() => {}); // silencieux si table vide
  }, []);

  const showToast = (msg: string, type: 'success'|'danger'|'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tpl = templates.find(t => t.id === actifId)!;

  const updateTpl = useCallback((champ: keyof Template, val: any) => {
    setTemplates(prev => prev.map(t => t.id === actifId ? { ...t, [champ]: val } : t));
  }, [actifId]);

  const toggleActif = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, actif: !t.actif } : t));
  };

  const insererVariable = (cle: string) => {
    const ta = document.getElementById('html-ed') as HTMLTextAreaElement;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    updateTpl('html', tpl.html.substring(0, s) + cle + tpl.html.substring(e));
    setOnglet('editeur');
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + cle.length; ta.focus(); }, 50);
    showToast(`Variable ${cle} insérée !`, 'success');
  };

  const tplsFiltres = useMemo(() =>
    recherche.trim() ? templates.filter(t => t.nom.toLowerCase().includes(recherche.toLowerCase()))
    : templates
  , [templates, recherche]);

  // 🔥 NOUVELLE FONCTION : Envoyer un email de test via le backend
  const envoyerEmailTest = async () => {
    if (!emailTest || !emailTest.includes('@')) return;
    
    setEnvoiEnCours(true);
    
    try {
      // Préparer les données de test
      const variablesTest = {
        nom_vendeur: "Alexandre",
        nom_boutique_vendeur: "Boutique Test",
        plan_actuel: "Gratuit",
        nom_acheteur: "Jean Test",
        nom_produit: "Produit Test",
        numero_commande: "CMD-12345",
        date_commande: new Date().toLocaleDateString('fr-CA'),
        montant_total: "89.99 $",
        code_otp: "123456",
        lien_dashboard: "https://www.e-vend.ca/dashboard",
        ...Object.fromEntries(tpl.variables.map(v => [v.cle.replace(/[{}]/g, ''), `[TEST: ${v.desc}]`]))
      };

      // Appel à votre futur backend
      // Pour l'instant, on simule un appel API
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: {
            sujet: tpl.sujet,
            html: tpl.html,
            variables: tpl.variables
          },
          destinataire: emailTest,
          variables: variablesTest
        })
      });

      const resultat = await response.json();
      
      if (response.ok) {
        showToast(`✉️ Email test envoyé à ${emailTest} !`, 'success');
        setPopupTest(false);
        setEmailTest('');
      } else {
        showToast(`❌ Erreur: ${resultat.error || 'Inconnue'}`, 'danger');
      }
    } catch (error) {
      console.error("Erreur d'envoi:", error);
      showToast(`❌ Erreur de connexion au serveur`, 'danger');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const CANAL_ICO: Record<Canal, string> = { email: '📧', interne: '🔔', les_deux: '📧🔔' };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* POPUP CONFIRMATION RÉINITIALISER */}
      {popupReinit && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setPopupReinit(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor:'white', borderRadius:'14px', padding:'28px 32px', maxWidth:'420px', width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', textAlign:'center' as const }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🔄</div>
            <h3 style={{ fontSize:'16px', fontWeight:'900', color:T.text, margin:'0 0 8px' }}>Réinitialiser ce template ?</h3>
            <p style={{ fontSize:'13px', color:T.textLight, margin:'0 0 20px', lineHeight:'1.6' }}>
              Le template <strong>«&nbsp;{tpl.nom}&nbsp;»</strong> sera remplacé par la version originale.<br/>
              Toutes vos modifications seront perdues.
            </p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <button onClick={() => setPopupReinit(false)}
                style={{ padding:'10px 22px', borderRadius:'8px', border:`1px solid ${T.border}`, backgroundColor:'white', color:T.text, fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                Annuler
              </button>
              <button onClick={() => { updateTpl('html', HTML_ORIGINAL[actifId]); setPopupReinit(false); showToast('🔄 Template réinitialisé.', 'info'); }}
                style={{ padding:'10px 22px', borderRadius:'8px', border:'none', backgroundColor:T.danger, color:'white', fontSize:'13px', fontWeight:'800', cursor:'pointer' }}>
                Oui, réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP ENVOI TEST - MODIFIÉ POUR APPEL BACKEND */}
      {popupTest && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => !envoiEnCours && setPopupTest(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor:'white', borderRadius:'14px', padding:'28px 32px', maxWidth:'440px', width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'10px', backgroundColor:'#f3e8ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>✉️</div>
              <div>
                <h3 style={{ fontSize:'15px', fontWeight:'900', color:T.text, margin:0 }}>Envoyer un courriel de test</h3>
                <p style={{ fontSize:'11px', color:T.textLight, margin:0 }}>Template : {tpl.nom}</p>
              </div>
            </div>

            <div style={{ backgroundColor:'#f8f9fb', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px', fontSize:'12px', color:T.textLight }}>
              <strong style={{ color:T.text }}>Sujet :</strong> {tpl.sujet.replace(/\{\$[^}]+\}/g, '[variable]').substring(0, 60)}...
            </div>

            <label style={{ fontSize:'12px', fontWeight:'700', color:T.text, display:'block', marginBottom:'6px' }}>
              📬 Adresse courriel de destination
            </label>
            <input
              type="email"
              value={emailTest}
              onChange={e => setEmailTest(e.target.value)}
              placeholder="exemple@email.com"
              autoFocus
              disabled={envoiEnCours}
              style={{ width:'100%', border:`2px solid ${T.border}`, borderRadius:'8px', padding:'10px 12px', fontSize:'13px', outline:'none', boxSizing:'border-box' as const, marginBottom:'6px',
                borderColor: emailTest && !emailTest.includes('@') ? T.danger : T.border,
                opacity: envoiEnCours ? 0.7 : 1 }}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            {emailTest && !emailTest.includes('@') && (
              <p style={{ fontSize:'11px', color:T.danger, margin:'0 0 10px' }}>⚠️ Entrez une adresse courriel valide</p>
            )}

            <p style={{ fontSize:'11px', color:T.textLight, margin:'8px 0 18px', lineHeight:'1.5' }}>
              Un email de test avec des données fictives sera envoyé à cette adresse via le serveur backend.
            </p>

            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button 
                onClick={() => setPopupTest(false)} 
                disabled={envoiEnCours}
                style={{ padding:'10px 20px', borderRadius:'8px', border:`1px solid ${T.border}`, backgroundColor:'white', color:T.text, fontSize:'13px', fontWeight:'700', cursor: envoiEnCours ? 'not-allowed' : 'pointer', opacity: envoiEnCours ? 0.5 : 1 }}>
                Annuler
              </button>
              <button
                disabled={!emailTest || !emailTest.includes('@') || envoiEnCours}
                onClick={envoyerEmailTest}
                style={{ padding:'10px 22px', borderRadius:'8px', border:'none',
                  backgroundColor: (emailTest && emailTest.includes('@') && !envoiEnCours) ? '#7c3aed' : '#d1d5db',
                  color:'white', fontSize:'13px', fontWeight:'800', 
                  cursor: (emailTest && emailTest.includes('@') && !envoiEnCours) ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '6px' }}>
                {envoiEnCours ? (
                  <>⏳ Envoi en cours...</>
                ) : (
                  <>✉️ Envoyer le test</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interface principale - inchangée */}
      <div style={{ display:'flex', height:'100vh', backgroundColor:T.bg, overflow:'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width:'270px', backgroundColor:'#f8f9fb', borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
          {/* Header */}
          <div style={{ padding:'14px 14px 10px', borderBottom:`1px solid ${T.border}`, backgroundColor:T.card }}>
            <h2 style={{ fontSize:'13px', fontWeight:'900', color:T.accent, textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 8px' }}>📧 Modèles de courriels</h2>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:'8px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:T.textLight }}>🔍</span>
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un template..."
                style={{ width:'100%', border:`1px solid ${T.border}`, borderRadius:'7px', padding:'7px 8px 7px 28px', fontSize:'11px', outline:'none', boxSizing:'border-box' as const, backgroundColor:'#f8f9fb' }} />
            </div>
            <p style={{ fontSize:'10px', color:T.textLight, margin:'6px 0 0', textAlign:'center' }}>
              {templates.filter(t => t.actif).length}/{templates.length} actifs
            </p>
          </div>

          {/* Liste groupée */}
          <div style={{ flex:1, overflowY:'auto' as const }}>
            {Object.entries(THEMES).map(([themeId, themeCfg], groupIdx) => {
              const bgColors = ['#f0f4ff','#f0fdf4','#fefce8','#fff7ed','#fef2f2','#faf5ff','#f4f4f5','#f9fafb'];
              const borderColors = ['#c7d7ff','#a7f3d0','#fde68a','#fed7aa','#fecaca','#e9d5ff','#d4d4d8','#e5e7eb'];
              const items = recherche.trim() ? templates.filter(t => t.theme === themeId && t.nom.toLowerCase().includes(recherche.toLowerCase())) : templates.filter(t => t.theme === themeId);
              if (!items.length) return null;
              const actifCount = items.filter(t => t.actif).length;
              return (
                <div key={themeId} style={{ borderBottom:`1px solid ${T.border}` }}>
                  {/* En-tête catégorie */}
                  <div style={{ backgroundColor: bgColors[groupIdx % bgColors.length], borderLeft:`3px solid ${borderColors[groupIdx % borderColors.length]}`, padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{ fontSize:'13px' }}>{themeCfg.icon.replace('🔵','').replace('🟢','').replace('🟡','').replace('🟠','').replace('🔴','').replace('🟣','').replace('⚫','').replace('⚪','') || '●'}</span>
                      <span style={{ fontSize:'11px', fontWeight:'900', color: themeCfg.couleur, textTransform:'uppercase' as const, letterSpacing:'0.3px' }}>{themeCfg.label}</span>
                    </div>
                    <span style={{ fontSize:'10px', backgroundColor:'white', color: themeCfg.couleur, padding:'2px 7px', borderRadius:'10px', fontWeight:'800', border:`1px solid ${borderColors[groupIdx % borderColors.length]}` }}>
                      {actifCount}/{items.length}
                    </span>
                  </div>

                  {/* Rows des templates */}
                  {items.map((t, idx) => {
                    const isSelected = actifId === t.id;
                    const globalNum = templates.findIndex(x => x.id === t.id) + 1;
                    return (
                      <div key={t.id} onClick={() => { setActifId(t.id); setOnglet('apercu'); }}
                        style={{ display:'flex', alignItems:'center', padding:'8px 12px 8px 10px', cursor:'pointer', borderLeft:`3px solid ${isSelected ? themeCfg.couleur : 'transparent'}`,
                          backgroundColor: isSelected ? 'white' : (idx % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'),
                          boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.9)'; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'; }}>
                        <span style={{ fontSize:'10px', fontWeight:'800', color: isSelected ? themeCfg.couleur : '#9ca3af', width:'20px', flexShrink:0, textAlign:'center' as const }}>
                          {globalNum}
                        </span>
                        <div style={{ flex:1, minWidth:0, marginLeft:'6px' }}>
                          <p style={{ fontSize:'11px', fontWeight: isSelected ? '800' : '600', color: t.actif ? (isSelected ? themeCfg.couleur : T.text) : '#9ca3af', margin:0, whiteSpace:'nowrap' as const, overflow:'hidden', textOverflow:'ellipsis', textDecoration: t.actif ? 'none' : 'line-through' }}>
                            {t.nom}
                          </p>
                          <div style={{ display:'flex', gap:'3px', marginTop:'2px' }}>
                            <span style={{ fontSize:'9px', backgroundColor: t.destinataire === 'vendeur' ? '#eff6ff' : '#fef3c7', color: t.destinataire === 'vendeur' ? '#1d4ed8' : '#92400e', padding:'1px 5px', borderRadius:'4px', fontWeight:'700' }}>
                              {t.destinataire === 'vendeur' ? '🏪 V' : '🛒 A'}
                            </span>
                            <span style={{ fontSize:'9px', color:T.textLight, fontWeight:'700', padding:'1px 4px', backgroundColor:'#f3f4f6', borderRadius:'4px' }}>
                              {CANAL_ICO[t.canal]}
                            </span>
                          </div>
                        </div>
                        <div onClick={e => toggleActif(t.id, e)}
                          title={t.actif ? 'Désactiver' : 'Activer'}
                          style={{ width:'32px', height:'18px', borderRadius:'9px', backgroundColor: t.actif ? T.success : '#d1d5db', position:'relative', flexShrink:0, cursor:'pointer', transition:'background 0.2s', marginLeft:'8px' }}>
                          <div style={{ position:'absolute', top:'2px', left: t.actif ? '16px' : '2px', width:'14px', height:'14px', borderRadius:'50%', backgroundColor:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ZONE PRINCIPALE */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* En-tête */}
          <div style={{ backgroundColor:T.card, borderBottom:`1px solid ${T.border}`, padding:'11px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, gap:'12px' }}>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                <h1 style={{ fontSize:'14px', fontWeight:'900', margin:0, color:T.text }}>{tpl.nom}</h1>
                <span style={{ fontSize:'10px', backgroundColor:THEMES[tpl.theme].bg, color:THEMES[tpl.theme].couleur, padding:'2px 8px', borderRadius:'10px', fontWeight:'700', flexShrink:0 }}>
                  {THEMES[tpl.theme].icon} {THEMES[tpl.theme].label}
                </span>
              </div>
              <p style={{ fontSize:'11px', color:T.textLight, margin:0 }}>#{tpl.id} · {tpl.destinataire === 'vendeur' ? '🏪 Vendeur' : '🛒 Acheteur'}</p>
            </div>

            <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
              <select value={tpl.canal} onChange={e => updateTpl('canal', e.target.value as Canal)}
                style={{ border:`1px solid ${T.border}`, borderRadius:'7px', padding:'5px 8px', fontSize:'11px', outline:'none', cursor:'pointer', fontWeight:'700' }}>
                {Object.entries(CANAL_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>

              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize:'11px', fontWeight:'700', color: tpl.actif ? T.success : T.textLight }}>{tpl.actif ? '● Actif' : '○ Inactif'}</span>
                <div onClick={() => toggleActif(actifId)}
                  style={{ width:'36px', height:'20px', borderRadius:'10px', backgroundColor: tpl.actif ? T.success : '#d1d5db', position:'relative', cursor:'pointer', transition:'background 0.2s' }}>
                  <div style={{ position:'absolute', top:'3px', left: tpl.actif ? '18px' : '3px', width:'14px', height:'14px', borderRadius:'50%', backgroundColor:'white', transition:'left 0.2s' }} />
                </div>
              </div>

              <div style={{ display:'flex', backgroundColor:'#f3f4f6', borderRadius:'8px', padding:'3px' }}>
                {([['apercu','👁 Aperçu'],['editeur','✏️ HTML'],['variables','📋 Variables']] as const).map(([id,label]) => (
                  <button key={id} onClick={() => setOnglet(id)}
                    style={{ padding:'6px 10px', borderRadius:'6px', border:'none', backgroundColor: onglet === id ? 'white' : 'transparent', color: onglet === id ? T.text : T.textLight, fontSize:'11px', fontWeight:'700', cursor:'pointer', boxShadow: onglet === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', whiteSpace:'nowrap' as const }}>
                    {label}
                  </button>
                ))}
              </div>

              <button onClick={() => setPopupReinit(true)}
                style={{ backgroundColor:'white', color:T.textLight, border:`1px solid ${T.border}`, borderRadius:'7px', padding:'6px 11px', fontSize:'11px', fontWeight:'700', cursor:'pointer' }}
                title="Réinitialiser au template original">
                🔄 Réinitialiser
              </button>
              
              {/* 🔥 BOUTON TEST AMÉLIORÉ */}
              <button 
                onClick={() => { setEmailTest(''); setPopupTest(true); }}
                style={{ 
                  backgroundColor: '#7c3aed', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '7px', 
                  padding: '7px 14px', 
                  fontSize: '12px', 
                  fontWeight: '800', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                <span>✉️</span> Tester
              </button>
              
              <button onClick={async () => {
                setSauvegarde(true);
                try {
                  const token = localStorage.getItem('token');
                  const r = await fetch(`${API}/modeles-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(tpl)
                  });
                  if (r.ok) showToast(`✅ "${tpl.nom}" sauvegardé en BD !`, 'success');
                  else showToast('❌ Erreur sauvegarde', 'danger');
                } catch { showToast('❌ Erreur connexion', 'danger'); }
                finally { setSauvegarde(false); }
              }} disabled={sauvegarde}
                style={{ backgroundColor: sauvegarde ? '#9ca3af' : T.success, color:'white', border:'none', borderRadius:'7px', padding:'7px 14px', fontSize:'12px', fontWeight:'800', cursor: sauvegarde ? 'not-allowed' : 'pointer' }}>
                {sauvegarde ? '⏳...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Champ sujet */}
          <div style={{ backgroundColor:'#fffbeb', borderBottom:`1px solid #fde68a`, padding:'7px 16px', display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
            <span style={{ fontSize:'11px', fontWeight:'800', color:'#92400e', flexShrink:0 }}>Sujet :</span>
            <input value={tpl.sujet} onChange={e => updateTpl('sujet', e.target.value)}
              style={{ flex:1, border:'none', background:'transparent', fontSize:'12px', fontWeight:'700', color:T.text, outline:'none' }} />
          </div>

          {/* Contenu */}
          <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
            {onglet === 'apercu' && (
              <div style={{ flex:1, padding:'16px', overflow:'auto', backgroundColor:'#525659' }}>
                <div style={{ maxWidth:'660px', margin:'0 auto' }}>
                  <div style={{ backgroundColor:'#3a3a3a', borderRadius:'10px 10px 0 0', padding:'9px 14px', display:'flex', alignItems:'center', gap:'8px' }}>
                    {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor:c }} />)}
                    <span style={{ fontSize:'11px', color:'#888', marginLeft:'6px' }}>Aperçu email — {tpl.sujet.substring(0,50)}...</span>
                  </div>
                  <iframe srcDoc={tpl.html} title="apercu" style={{ width:'100%', height:'580px', border:'none', display:'block', backgroundColor:'white', borderRadius:'0 0 10px 10px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }} sandbox="allow-same-origin" />
                </div>
              </div>
            )}

            {onglet === 'editeur' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'12px', gap:'8px', overflow:'hidden' }}>
                <div style={{ backgroundColor:'#1e1e1e', borderRadius:'8px', padding:'7px 12px', display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                  {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor:c }} />)}
                  <span style={{ fontSize:'11px', color:'#888', fontFamily:'monospace' }}>email_{tpl.id}.html · {tpl.html.length} chars</span>
                </div>
                <textarea id="html-ed" value={tpl.html} onChange={e => updateTpl('html', e.target.value)}
                  spellCheck={false}
                  style={{ flex:1, backgroundColor:'#1e1e1e', color:'#d4d4d4', border:'none', borderRadius:'8px', padding:'14px', fontFamily:"'Courier New',monospace", fontSize:'12px', lineHeight:'1.6', resize:'none', outline:'none' }} />
                <div style={{ backgroundColor:'#fffbeb', border:'1px solid #fde68a', borderRadius:'7px', padding:'8px 12px', fontSize:'11px', color:'#92400e', flexShrink:0 }}>
                  💡 Les variables entre accolades seront remplacées par les données réelles.
                </div>
              </div>
            )}

            {onglet === 'variables' && (
              <div style={{ flex:1, padding:'16px', overflow:'auto' }}>
                <div style={{ maxWidth:'720px', margin:'0 auto' }}>
                  <div style={{ backgroundColor:T.accentLight, border:`1px solid #bfdbfe`, borderRadius:'10px', padding:'12px 16px', marginBottom:'14px' }}>
                    <p style={{ fontSize:'12px', color:T.accent, fontWeight:'700', margin:'0 0 3px' }}>📋 Variables pour : {tpl.nom}</p>
                    <p style={{ fontSize:'11px', color:T.textLight, margin:0 }}>Cliquez pour insérer à la position du curseur dans l'éditeur HTML.</p>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                    {tpl.variables.map((v, i) => (
                      <div key={i} onClick={() => insererVariable(v.cle)}
                        style={{ backgroundColor:T.card, border:`1px solid ${T.border}`, borderRadius:'8px', padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', transition:'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.accent; (e.currentTarget as HTMLElement).style.backgroundColor = T.accentLight; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.backgroundColor = T.card; }}>
                        <code style={{ fontSize:'11px', fontWeight:'800', color:T.accent, backgroundColor:T.accentLight, padding:'2px 7px', borderRadius:'5px', flexShrink:0 }}>{v.cle}</code>
                        <span style={{ fontSize:'11px', color:T.textLight, flex:1 }}>{v.desc}</span>
                        <span style={{ fontSize:'14px', color:T.accent, flexShrink:0 }}>+</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}