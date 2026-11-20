// CHEMIN : services/boutique_verificateur_age.js
// e-Vend Studio — Add-on « Vérificateur d'âge » des templates boutique (solo).
// Réglages dans config_verificateur_age (même table que le MV : un gestionnaire n'a qu'un seul site).
// Accès : add-on « verificateur_age » acheté et activé (A.addonActif). Aucun lien de code avec le MV.
// Tout est validé ici : âge 13–99, mode et thème dans une liste, couleurs hexadécimales, liens https seulement, longueurs limitées.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'verificateur_age';
const MODES = ['boutons', 'date_naissance', 'annee_naissance'];
const THEMES = ['sombre', 'bleu', 'violet', 'vert', 'custom'];

const DEFAUT = {
  actif: true,
  age_minimum: 18,
  mode: 'boutons',
  theme: 'sombre',
  titre: "Vérification d'âge requise",
  message: 'Ce site est réservé aux personnes majeures. Veuillez confirmer votre âge pour continuer.',
  texte_accepter: "Oui, j'ai 18 ans ou plus",
  texte_refuser: "Non, j'ai moins de 18 ans",
  couleur_fond: '#0f0f0f',
  couleur_accent: '#ef4444',
  logo_url: '',
  url_redirection_refus: '',
  se_souvenir_jours: 30,
};

const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

const HEX = /^#[0-9a-fA-F]{3,8}$/;
function lienHttps(v, champ) {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') throw new ErreurBoutique(`${champ} invalide.`, 400);
  const t = v.trim();
  if (!t) return '';
  if (t.length > 500) throw new ErreurBoutique(`${champ} est trop long.`, 400);
  let u;
  try { u = new URL(t); } catch (e) { throw new ErreurBoutique(`${champ} invalide : entrez une adresse complète (https://…).`, 400); }
  if (u.protocol !== 'https:') throw new ErreurBoutique(`${champ} doit commencer par https://`, 400);
  return t;
}
function texte(v, max, champ, defaut) {
  if (v === undefined || v === null) return defaut;
  if (typeof v !== 'string') throw new ErreurBoutique(`${champ} invalide.`, 400);
  const t = v.trim();
  if (!t) return defaut;
  if (t.length > max) throw new ErreurBoutique(`${champ} est trop long (${max} caractères maximum).`, 400);
  return t;
}

/** Valide et complète les réglages reçus (erreur 400 si une valeur est invalide). */
function valider(brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new ErreurBoutique('Réglages invalides.', 400);
  const age = Number(brut.age_minimum === undefined ? DEFAUT.age_minimum : brut.age_minimum);
  if (!Number.isInteger(age) || age < 13 || age > 99) throw new ErreurBoutique("L'âge minimum doit être un nombre entier entre 13 et 99.", 400);
  const mode = brut.mode === undefined ? DEFAUT.mode : brut.mode;
  if (!MODES.includes(mode)) throw new ErreurBoutique('Mode de vérification invalide.', 400);
  const theme = brut.theme === undefined ? DEFAUT.theme : brut.theme;
  if (!THEMES.includes(theme)) throw new ErreurBoutique('Thème invalide.', 400);
  const jours = Number(brut.se_souvenir_jours === undefined ? DEFAUT.se_souvenir_jours : brut.se_souvenir_jours);
  if (!Number.isInteger(jours) || jours < 1 || jours > 365) throw new ErreurBoutique('La mémorisation doit être de 1 à 365 jours.', 400);
  const couleur = (v, d, champ) => {
    if (v === undefined || v === null || v === '') return d;
    if (typeof v !== 'string' || !HEX.test(v.trim())) throw new ErreurBoutique(`${champ} invalide.`, 400);
    return v.trim();
  };
  if (brut.actif !== undefined && typeof brut.actif !== 'boolean') throw new ErreurBoutique('Réglages invalides.', 400);
  return {
    actif: brut.actif === undefined ? true : brut.actif,
    age_minimum: age, mode, theme,
    titre: texte(brut.titre, 200, 'Le titre', DEFAUT.titre),
    message: texte(brut.message, 600, 'Le message', DEFAUT.message),
    texte_accepter: texte(brut.texte_accepter, 200, 'Le texte du bouton Accepter', `Oui, j'ai ${age} ans ou plus`),
    texte_refuser: texte(brut.texte_refuser, 200, 'Le texte du bouton Refuser', `Non, j'ai moins de ${age} ans`),
    couleur_fond: couleur(brut.couleur_fond, DEFAUT.couleur_fond, 'La couleur de fond'),
    couleur_accent: couleur(brut.couleur_accent, DEFAUT.couleur_accent, "La couleur d'accent"),
    logo_url: lienHttps(brut.logo_url, "L'adresse du logo"),
    url_redirection_refus: lienHttps(brut.url_redirection_refus, "L'adresse de redirection"),
    se_souvenir_jours: jours,
  };
}

// Ligne enregistrée → réglages complets (valeurs manquantes = défauts)
function completer(ligne) {
  const r = { ...DEFAUT };
  if (!ligne) return r;
  for (const k of Object.keys(DEFAUT)) if (ligne[k] !== null && ligne[k] !== undefined) r[k] = ligne[k];
  return r;
}

async function ligne(gid, db) {
  const r = await (db || pool).query('SELECT * FROM config_verificateur_age WHERE gestionnaire_id = $1', [gid]);
  return r.rows[0] || null;
}

// Page de réglages : lisible même sans l'add-on (l'enregistrement, lui, l'exige)
async function lire(gid, db) {
  const [l, actif] = await Promise.all([ligne(gid, db), autorise(gid, db)]);
  return { config: completer(l), existe: !!l, addon_actif: actif };
}

async function enregistrer(gid, brut, db) {
  if (!(await autorise(gid, db))) throw new ErreurBoutique("L'option « Vérificateur d'âge » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
  const c = valider(brut);
  await (db || pool).query(
    `INSERT INTO config_verificateur_age (gestionnaire_id, actif, age_minimum, mode, theme, titre, message, texte_accepter, texte_refuser, couleur_fond, couleur_accent, logo_url, url_redirection_refus, se_souvenir_jours, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET actif=$2, age_minimum=$3, mode=$4, theme=$5, titre=$6, message=$7, texte_accepter=$8, texte_refuser=$9,
       couleur_fond=$10, couleur_accent=$11, logo_url=$12, url_redirection_refus=$13, se_souvenir_jours=$14, updated_at=NOW()`,
    [gid, c.actif, c.age_minimum, c.mode, c.theme, c.titre, c.message, c.texte_accepter, c.texte_refuser, c.couleur_fond, c.couleur_accent, c.logo_url || null, c.url_redirection_refus || null, c.se_souvenir_jours]);
  return c;
}

// Public (lu par la boutique) : null si l'add-on n'est pas activé, si rien n'a encore été enregistré ou si le gestionnaire l'a mis en pause
async function configPublique(gid, db) {
  if (!(await autorise(gid, db))) return null;
  const l = await ligne(gid, db);
  if (!l || l.actif === false) return null;
  const c = completer(l);
  return {
    age_minimum: c.age_minimum, mode: c.mode, titre: c.titre, message: c.message, texte_accepter: c.texte_accepter, texte_refuser: c.texte_refuser,
    couleur_fond: c.couleur_fond, couleur_accent: c.couleur_accent, logo_url: c.logo_url || '', url_redirection_refus: c.url_redirection_refus || '',
    se_souvenir_jours: c.se_souvenir_jours,
  };
}

module.exports = { CODE_ADDON, DEFAUT, MODES, THEMES, autorise, valider, lire, enregistrer, configPublique };