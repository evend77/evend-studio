// CHEMIN : services/boutique_popup.js
// e-Vend Studio — Add-on « Popup Annonce » des templates boutique (solo). Adapté de routes/gestionnaire.js (GET/PUT /:id/popup-annonce) du multivendeur, sans y toucher.
// Table réutilisée telle quelle : config_popup_annonce (une ligne par gestionnaire). Aucune nouvelle table.
// Qui peut l'utiliser : l'add-on « popup_annonce » doit être activé (boutique_addons_achetes) — même règle que les autres add-ons boutique (A.addonActif).
// Tout ce que le gestionnaire envoie est validé ici (couleurs, textes sans HTML, adresse du bouton en https:// seulement, durées bornées, dates cohérentes).

'use strict';

const pool = require('../db');
const sanitizeHtml = require('sanitize-html');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'popup_annonce';
const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };
async function autorise(gid) { return A.addonActif(gid, CODE_ADDON); }

const TYPES = ['popup', 'banniere_haut', 'banniere_bas'];
const COULEUR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;
const propre = (v, max) => sanitizeHtml(String(v), { allowedTags: [], allowedAttributes: {} }).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[ \t]+/g, ' ').trim().slice(0, max);
const COLS = `actif, type_affichage, titre, message, bouton_label, bouton_url, bouton_actif, couleur_fond, couleur_texte, couleur_bouton,
  delai_secondes, fermeture_auto, fermeture_auto_secondes, se_souvenir_heures, icone, date_debut, date_fin, updated_at`;

// Valeurs proposées à un gestionnaire qui n'a encore rien enregistré
const DEFAUT = { actif: true, type_affichage: 'popup', titre: 'Annonce importante', message: 'Profitez de notre offre spéciale limitée dans le temps !', bouton_label: 'En savoir plus', bouton_url: '', bouton_actif: true,
  couleur_fond: '#1a1a2e', couleur_texte: '#ffffff', couleur_bouton: '#e63946', delai_secondes: 2, fermeture_auto: false, fermeture_auto_secondes: 10, se_souvenir_heures: 24, icone: '📢', date_debut: null, date_fin: null };

// Gestionnaire : sa config (ou les valeurs par défaut, `existe:false`, tant qu'il n'a rien enregistré)
async function lire(gid) {
  const r = await pool.query(`SELECT ${COLS} FROM config_popup_annonce WHERE gestionnaire_id = $1`, [gid]);
  if (!r.rowCount) return { config: { ...DEFAUT }, existe: false };
  return { config: r.rows[0], existe: true };
}

function entierBorne(v, nom, mn, mx) {
  const n = Number(v);
  if (!Number.isFinite(n)) refus(`${nom} invalide.`);
  return Math.min(mx, Math.max(mn, Math.round(n)));
}
function lireDate(v, nom) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(v);
  if (typeof v !== 'string' || isNaN(d.getTime())) refus(`${nom} invalide.`);
  return d.toISOString();
}

function valider(b) {
  const o = {};
  if (b.actif !== undefined) { if (typeof b.actif !== 'boolean') refus('Valeur « actif » invalide.'); o.actif = b.actif; }
  if (b.bouton_actif !== undefined) { if (typeof b.bouton_actif !== 'boolean') refus('Valeur du bouton invalide.'); o.bouton_actif = b.bouton_actif; }
  if (b.fermeture_auto !== undefined) { if (typeof b.fermeture_auto !== 'boolean') refus('Fermeture automatique invalide.'); o.fermeture_auto = b.fermeture_auto; }
  if (b.type_affichage !== undefined) { if (!TYPES.includes(b.type_affichage)) refus("Type d'affichage invalide."); o.type_affichage = b.type_affichage; }
  if (b.titre !== undefined) { if (typeof b.titre !== 'string') refus('Titre invalide.'); o.titre = propre(b.titre, 200); }
  if (b.message !== undefined) { if (typeof b.message !== 'string') refus('Message invalide.'); o.message = propre(b.message, 1000); }
  if (b.bouton_label !== undefined) { if (typeof b.bouton_label !== 'string') refus('Texte du bouton invalide.'); o.bouton_label = propre(b.bouton_label, 100); }
  if (b.icone !== undefined) { if (typeof b.icone !== 'string') refus('Icône invalide.'); o.icone = propre(b.icone, 10); }
  for (const k of ['couleur_fond', 'couleur_texte', 'couleur_bouton']) {
    if (b[k] !== undefined) { if (typeof b[k] !== 'string' || !COULEUR_RE.test(b[k].trim())) refus(`Couleur invalide (${k}).`); o[k] = b[k].trim(); }
  }
  if (b.bouton_url !== undefined) {
    if (b.bouton_url === null || String(b.bouton_url).trim() === '') o.bouton_url = null;
    else {
      const t = String(b.bouton_url).trim();
      let u; try { u = new URL(t); } catch (e) { refus("Adresse du bouton invalide (elle doit commencer par https://)."); }
      if (u.protocol !== 'https:' || t.length > 1000) refus("Adresse du bouton invalide (elle doit commencer par https://).");
      o.bouton_url = t;
    }
  }
  if (b.delai_secondes !== undefined) o.delai_secondes = entierBorne(b.delai_secondes, 'Délai', 0, 120);
  if (b.fermeture_auto_secondes !== undefined) o.fermeture_auto_secondes = entierBorne(b.fermeture_auto_secondes, 'Durée de fermeture', 3, 300);
  if (b.se_souvenir_heures !== undefined) o.se_souvenir_heures = entierBorne(b.se_souvenir_heures, 'Durée de mémoire', 0, 720);
  const d1 = lireDate(b.date_debut, 'Date de début'); if (d1 !== undefined) o.date_debut = d1;
  const d2 = lireDate(b.date_fin, 'Date de fin'); if (d2 !== undefined) o.date_fin = d2;
  return o;
}

// Enregistre (crée ou remplace les champs envoyés) — retourne la config complète
async function enregistrer(gid, b) {
  const o = valider(b || {});
  const { config } = await lire(gid);
  const f = { ...config, ...o };
  if (!f.titre && !f.message) refus('Écrivez un titre ou un message.');
  if (f.date_debut && f.date_fin && new Date(f.date_fin).getTime() <= new Date(f.date_debut).getTime()) refus('La date de fin doit être après la date de début.');
  await pool.query(
    `INSERT INTO config_popup_annonce (gestionnaire_id, actif, type_affichage, titre, message, bouton_label, bouton_url, bouton_actif, couleur_fond, couleur_texte, couleur_bouton,
       delai_secondes, fermeture_auto, fermeture_auto_secondes, se_souvenir_heures, icone, date_debut, date_fin, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET actif = EXCLUDED.actif, type_affichage = EXCLUDED.type_affichage, titre = EXCLUDED.titre, message = EXCLUDED.message,
       bouton_label = EXCLUDED.bouton_label, bouton_url = EXCLUDED.bouton_url, bouton_actif = EXCLUDED.bouton_actif, couleur_fond = EXCLUDED.couleur_fond,
       couleur_texte = EXCLUDED.couleur_texte, couleur_bouton = EXCLUDED.couleur_bouton, delai_secondes = EXCLUDED.delai_secondes, fermeture_auto = EXCLUDED.fermeture_auto,
       fermeture_auto_secondes = EXCLUDED.fermeture_auto_secondes, se_souvenir_heures = EXCLUDED.se_souvenir_heures, icone = EXCLUDED.icone,
       date_debut = EXCLUDED.date_debut, date_fin = EXCLUDED.date_fin, updated_at = NOW()`,
    [gid, f.actif, f.type_affichage, f.titre, f.message, f.bouton_label, f.bouton_url || null, f.bouton_actif, f.couleur_fond, f.couleur_texte, f.couleur_bouton,
      f.delai_secondes, f.fermeture_auto, f.fermeture_auto_secondes, f.se_souvenir_heures, f.icone, f.date_debut || null, f.date_fin || null]);
  return (await lire(gid)).config;
}

// Public (le site) : seulement si l'add-on est activé, l'annonce enregistrée, allumée, et dans sa période d'affichage (heure du serveur).
// `version` change à chaque modification : le site s'en sert pour ré-afficher une annonce modifiée à un visiteur qui avait fermé l'ancienne.
async function configPublique(gid) {
  if (!(await autorise(gid))) return null;
  const r = await pool.query(
    `SELECT ${COLS} FROM config_popup_annonce WHERE gestionnaire_id = $1 AND actif = true
       AND (date_debut IS NULL OR date_debut <= NOW()) AND (date_fin IS NULL OR date_fin >= NOW())`, [gid]);
  if (!r.rowCount) return null;
  const c = r.rows[0];
  const version = new Date(c.updated_at).getTime();
  delete c.updated_at; delete c.actif;
  return { ...c, version };
}

module.exports = { CODE_ADDON, TYPES, DEFAUT, autorise, lire, enregistrer, configPublique };