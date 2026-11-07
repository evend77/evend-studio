// CHEMIN : services/studio_courriels.js
// e-Vend Studio — Envoi des courriels d'une boutique, avec le SMTP DU GESTIONNAIRE (jamais celui de la plateforme).
//
// Utilisation depuis n'importe quelle route :
//   const courriels = require('../services/studio_courriels');
//   courriels.envoyerCourriel({ gestionnaireId, cle: 'commande_confirmation', a: 'client@x.com', variables: { prenom: 'Marie', ... } })
//     .catch(() => {});   // ne lance jamais d'erreur : renvoie { envoye, raison }
//
// Si le gestionnaire n'a pas configuré son SMTP, ou a désactivé le modèle, rien n'est envoyé.

'use strict';

const dns = require('dns').promises;
const net = require('net');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const { chiffrer, dechiffrer } = require('../utils/chiffrement_smtp');
const { COMMUNES, EXEMPLES, MODELES, parCle } = require('./courriels_defauts');

const PORTS_PERMIS = [25, 465, 587, 2525];
const LIMITE_PAR_HEURE = 300; // courriels / heure / gestionnaire (protège son serveur SMTP et la plateforme)

// ── Texte ────────────────────────────────────────────────────────────────────
const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const lienSur = (v) => (/^https?:\/\/[^\s<>"']+$/i.test(String(v)) ? String(v) : '#');

// Variables dont la valeur peut contenir du HTML préparé PAR LE SITE (jamais saisi par un visiteur)
const VARIABLES_HTML = new Set(['liste_articles', 'liste_commandes', 'detail_expedition']);

function rendreHtml(modele, vars) {
  return String(modele).replace(/\{\$([a-z_0-9]+)\}/g, (m, k) => {
    if (!(k in vars)) return '';
    const v = vars[k];
    if (v === null || v === undefined) return '';
    if (k === 'couleur') return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#c9a96e';
    if (k.startsWith('lien_')) return echapper(lienSur(v));
    return VARIABLES_HTML.has(k) ? String(v) : echapper(v);
  });
}
function rendreSujet(modele, vars) {
  return String(modele).replace(/\{\$([a-z_0-9]+)\}/g, (m, k) => (k in vars && vars[k] !== null && vars[k] !== undefined ? String(vars[k]) : ''))
    .replace(/[\r\n\u0000-\u001F]+/g, ' ').trim().slice(0, 200);
}

// ── Nettoyage du HTML saisi par le gestionnaire ──────────────────────────────
const STYLE_OK = /^[#a-zA-Z0-9 ,.%()\-{}$_!\/:]+$/;
function nettoyerHtml(html) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: ['div', 'span', 'p', 'br', 'hr', 'a', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'center', 'small', 'blockquote'],
    allowedAttributes: {
      a: ['href', 'style', 'target'], img: ['src', 'alt', 'width', 'height', 'style'],
      td: ['colspan', 'rowspan', 'align', 'valign', 'width', 'style'], th: ['colspan', 'rowspan', 'align', 'valign', 'width', 'style'],
      table: ['width', 'cellpadding', 'cellspacing', 'border', 'align', 'style'],
      '*': ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: { a: (tag, att) => ({ tagName: 'a', attribs: { ...att, target: '_blank' } }) },
    allowedStyles: { '*': Object.fromEntries(['color', 'background', 'background-color', 'font-size', 'font-weight', 'font-family', 'text-align', 'text-decoration', 'line-height', 'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-radius', 'border-collapse', 'width', 'max-width', 'height', 'display', 'opacity', 'letter-spacing', 'vertical-align'].map((k) => [k, [STYLE_OK]])) },
    exclusiveFilter: () => false,
  }).replace(/url\s*\(|expression\s*\(|javascript:/gi, '');
}

const enrober = (fragment) => `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#f3f4f6;">${fragment}</body></html>`;

// ── Modèles en base ──────────────────────────────────────────────────────────
async function assurerModeles(gid) {
  const manquants = await pool.query(`SELECT cle FROM studio_modeles_courriel WHERE gestionnaire_id = $1`, [gid]);
  const presents = new Set(manquants.rows.map((r) => r.cle));
  for (const m of MODELES) {
    if (presents.has(m.cle)) continue;
    await pool.query(
      `INSERT INTO studio_modeles_courriel (gestionnaire_id, cle, sujet, html, actif, modifie) VALUES ($1,$2,$3,$4,true,false) ON CONFLICT (gestionnaire_id, cle) DO NOTHING`,
      [gid, m.cle, m.sujet, m.html]);
  }
}

async function infosSite(gid) {
  const r = await pool.query(`SELECT slug, domaine_custom, config FROM sites WHERE gestionnaire_id = $1`, [gid]);
  const s = r.rows[0] || {};
  const cfg = s.config || {};
  const domaine = s.domaine_custom || (s.slug ? `${s.slug}.e-vendstudio.ca` : '');
  return {
    nom_site: String(cfg.nom_boutique || cfg.nom_site || 'Ma boutique').slice(0, 80),
    lien_site: domaine ? `https://${domaine}` : '',
    couleur: /^#[0-9a-fA-F]{6}$/.test(cfg.couleur_accent || '') ? cfg.couleur_accent : '#c9a96e',
  };
}

function variablesCommunes(site) {
  const d = new Date();
  return { ...site, date: d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' }), annee: String(d.getFullYear()) };
}

// ── SMTP ─────────────────────────────────────────────────────────────────────
function adresseInterne(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' || v.startsWith('fe80') || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('::ffff:');
}

// Refuse les serveurs internes (la base de données, le réseau Docker, etc.) : protection contre le détournement du SMTP.
async function verifierServeurSmtp(host) {
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9.\-]{0,251}[a-zA-Z0-9])?$/.test(host || '')) throw new Error('Serveur SMTP invalide.');
  if (net.isIP(host)) { if (adresseInterne(host)) throw new Error('Ce serveur SMTP n\'est pas permis.'); return host; }
  const adresses = await dns.lookup(host, { all: true }).catch(() => []);
  if (!adresses.length) throw new Error('Serveur SMTP introuvable (vérifiez l\'adresse).');
  if (adresses.some((a) => adresseInterne(a.address))) throw new Error('Ce serveur SMTP n\'est pas permis.');
  return adresses[0].address;
}

async function chargerSmtp(gid) {
  const r = await pool.query(`SELECT * FROM studio_smtp WHERE gestionnaire_id = $1`, [gid]);
  return r.rows[0] || null;
}

async function creerTransport(cfg) {
  const nodemailer = require('nodemailer');
  const ip = await verifierServeurSmtp(cfg.host);
  return nodemailer.createTransport({
    host: ip, port: cfg.port, secure: cfg.port === 465, requireTLS: cfg.port !== 465 && cfg.port !== 25,
    auth: cfg.utilisateur ? { user: cfg.utilisateur, pass: dechiffrer(cfg.mot_de_passe_chiffre) } : undefined,
    tls: { servername: cfg.host }, // certificat vérifié sur le vrai nom du serveur
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

const messageErreur = (e) => {
  const code = e && e.code ? String(e.code) : '';
  if (code === 'EAUTH') return 'Identifiants refusés par le serveur (utilisateur ou mot de passe incorrect).';
  if (code === 'ECONNECTION' || code === 'ETIMEDOUT' || code === 'ESOCKET') return 'Connexion impossible au serveur SMTP (adresse, port ou sécurité incorrects).';
  return String((e && e.message) || 'Erreur SMTP').replace(/[\r\n]+/g, ' ').slice(0, 200);
};

// ── Limite d'envoi par gestionnaire ──────────────────────────────────────────
const compteurs = new Map();
function sousLaLimite(gid) {
  const maintenant = Date.now(), c = compteurs.get(gid);
  if (!c || maintenant - c.debut > 3600000) { compteurs.set(gid, { debut: maintenant, n: 1 }); return true; }
  if (c.n >= LIMITE_PAR_HEURE) return false;
  c.n++; return true;
}

// ── Envoi ────────────────────────────────────────────────────────────────────
async function expedier(gid, cfg, { a, sujet, html }) {
  const transport = await creerTransport(cfg);
  const de = cfg.expediteur_nom ? { name: cfg.expediteur_nom.replace(/[\r\n"<>]/g, ''), address: cfg.expediteur_email } : cfg.expediteur_email;
  await transport.sendMail({ from: de, to: a, subject: sujet, html });
}

async function envoyerCourriel({ gestionnaireId, cle, a, variables = {} }) {
  try {
    const gid = parseInt(gestionnaireId, 10);
    if (!gid || !parCle.has(cle)) return { envoye: false, raison: 'modele_inconnu' };
    if (!a || !/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/.test(a)) return { envoye: false, raison: 'destinataire_invalide' };
    const cfg = await chargerSmtp(gid);
    if (!cfg || !cfg.actif) return { envoye: false, raison: 'smtp_non_configure' };
    await assurerModeles(gid);
    const m = (await pool.query(`SELECT sujet, html, actif FROM studio_modeles_courriel WHERE gestionnaire_id = $1 AND cle = $2`, [gid, cle])).rows[0];
    if (!m || !m.actif) return { envoye: false, raison: 'modele_desactive' };
    if (!sousLaLimite(gid)) return { envoye: false, raison: 'limite_atteinte' };
    const vars = { ...variablesCommunes(await infosSite(gid)), ...variables };
    await expedier(gid, cfg, { a, sujet: rendreSujet(m.sujet, vars), html: enrober(rendreHtml(nettoyerHtml(m.html), vars)) });
    return { envoye: true };
  } catch (e) {
    console.error('[studio_courriels] envoi :', e.message);
    return { envoye: false, raison: 'erreur', message: messageErreur(e) };
  }
}

// Aperçu / test : mêmes règles, avec des valeurs d'exemple
async function composerExemple(gid, sujetBrut, htmlBrut) {
  const vars = { ...variablesCommunes(await infosSite(gid)) };
  const exemples = { ...EXEMPLES }; delete exemples.nom_site; delete exemples.lien_site; delete exemples.date; delete exemples.annee; delete exemples.couleur;
  Object.assign(vars, exemples);
  if (!vars.lien_site) vars.lien_site = EXEMPLES.lien_site;
  return { sujet: rendreSujet(sujetBrut, vars), html: enrober(rendreHtml(nettoyerHtml(htmlBrut), vars)) };
}

async function envoyerTest(gid, a, sujetBrut, htmlBrut) {
  const cfg = await chargerSmtp(gid);
  if (!cfg) throw new Error('Configurez d\'abord votre serveur d\'envoi (SMTP).');
  const { sujet, html } = await composerExemple(gid, sujetBrut, htmlBrut);
  await expedier(gid, cfg, { a, sujet: '[TEST] ' + sujet, html });
}

module.exports = {
  PORTS_PERMIS, COMMUNES, MODELES, parCle,
  assurerModeles, chargerSmtp, chiffrer, nettoyerHtml, composerExemple, envoyerTest, envoyerCourriel,
  verifierServeurSmtp, creerTransport, messageErreur, rendreSujet, rendreHtml, enrober,
};