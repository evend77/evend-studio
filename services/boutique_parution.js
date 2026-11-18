// CHEMIN : services/boutique_parution.js
// e-Vend Studio — Add-on « Parution future » des templates boutique (solo) : apparence du compte à rebours + règles de la date.
// Valeurs par défaut = Configuration date futur de l'admin Studio (configuration_generale_admin.config_parution_futur, si la colonne existe) ;
// le gestionnaire personnalise SA boutique (table parution_futur_gestionnaire, la même que le MV : un gestionnaire n'a qu'un seul site).
// Accès : add-on « parution_future » activé (A.addonActif). Aucun lien de code avec le MV.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'parution_future';
const DELAI_MIN_MINUTES = 30;   // une NOUVELLE date doit être au moins 30 minutes dans le futur

const DEFAUT = {
  couleur_fond_debut: '#0d2b5d', couleur_fond_fin: '#0a1a3d', couleur_texte: '#e2ebff', couleur_titres: '#b7c9ff', couleur_chiffres: '#ffffff',
  couleur_bordure: '#000000', couleur_boite_fond: '#1a3a6e', couleur_boite_bordure: '#3a6aaf', taille_chiffres: 140, border_radius: 14,
  border_width: 3, ombre_active: true, ombre_intensite: 35, couleur_fond_mobile_debut: '#0d2b5d', couleur_fond_mobile_fin: '#0a1a3d',
  masquer_timezone_mobile: false, texte_titre: '⏳ Disponible dans :', texte_date_prefix: '🗓️ Mise en vente le',
  texte_timezone: '(Heure de Montréal — EST/EDT)', texte_seo: 'Ce produit sera disponible à la vente dès la fin du compte à rebours.',
  texte_vente_ouverte: '🎉 La vente est ouverte !!!', texte_atc_bloque: '', afficher_feux_artifice: true, duree_feux_artifice: 5,
  afficher_timezone: true, afficher_seo: true, effet_vague: true, vitesse_vague: 'normale', effet_bordure: true, bloquer_wishlist: true,
  afficher_message_atc: false, duree_vente_ouverte: 24, duree_disparition_bloc: 5,
  couleur_feux_1: '#fbbf24', couleur_feux_2: '#f472b6', couleur_feux_3: '#60a5fa',
};
const BORNES = { taille_chiffres: [80, 220], border_radius: [0, 30], border_width: [0, 8], ombre_intensite: [5, 100], duree_feux_artifice: [1, 30], duree_vente_ouverte: [1, 48], duree_disparition_bloc: [1, 30] };

const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

// Condition SQL « add-on actif pour le gestionnaire de l'alias a »
const sqlAddonOn = (a) => `EXISTS (SELECT 1 FROM boutique_addons_achetes x JOIN boutique_addons d ON d.code = x.code WHERE x.gestionnaire_id = ${a}.gestionnaire_id AND x.code = '${CODE_ADDON}' AND d.actif = true AND d.branche = true)`;

/** Ne garde que les clés connues, du bon type, dans les bornes. */
function nettoyer(brut) {
  const out = {};
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return out;
  for (const cle of Object.keys(DEFAUT)) {
    if (brut[cle] === undefined) continue;
    const ref = DEFAUT[cle], v = brut[cle];
    if (typeof ref === 'boolean') { if (typeof v === 'boolean') out[cle] = v; }
    else if (typeof ref === 'number') {
      const n = Number(v);
      if (Number.isFinite(n)) { const [a, b] = BORNES[cle] || [0, 1000]; out[cle] = Math.min(b, Math.max(a, Math.round(n))); }
    } else if (cle === 'vitesse_vague') { if (['lente', 'normale', 'rapide'].includes(v)) out[cle] = v; }
    else if (cle.startsWith('couleur_')) { if (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim())) out[cle] = v.trim(); }
    else if (typeof v === 'string') out[cle] = v.slice(0, cle === 'texte_seo' ? 400 : 160);
  }
  return out;
}

/** Valeurs de base de la plateforme (admin Studio) + défauts. La colonne peut ne pas exister : on retombe alors sur les défauts. */
async function configGlobale(db) {
  try {
    const r = await (db || pool).query('SELECT config_parution_futur FROM configuration_generale_admin WHERE id = 1 LIMIT 1');
    const c = r.rows[0] && r.rows[0].config_parution_futur;
    return { ...DEFAUT, ...nettoyer(c) };
  } catch (e) { return { ...DEFAUT }; }
}

async function surcharge(gid, db) {
  try {
    const r = await (db || pool).query('SELECT config FROM parution_futur_gestionnaire WHERE gestionnaire_id = $1', [gid]);
    return nettoyer(r.rows[0] && r.rows[0].config);
  } catch (e) { return {}; }
}

async function configPour(gid, db) {
  const [g, s] = await Promise.all([configGlobale(db), surcharge(gid, db)]);
  return { ...g, ...s };
}

// Page de réglages : lisible même si l'add-on n'est pas activé (l'enregistrement, lui, exige l'add-on)
async function lire(gid, db) {
  const [g, s, actif] = await Promise.all([configGlobale(db), surcharge(gid, db), autorise(gid, db)]);
  return { config: { ...g, ...s }, personnalisee: Object.keys(s).length > 0, addon_actif: actif };
}

async function enregistrer(gid, brut, db) {
  if (!(await autorise(gid, db))) throw new ErreurBoutique("L'option « Parution future » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new ErreurBoutique('Réglages invalides.', 400);
  const c = nettoyer(brut);
  await (db || pool).query(
    `INSERT INTO parution_futur_gestionnaire (gestionnaire_id, config, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET config = $2::jsonb, updated_at = NOW()`, [gid, JSON.stringify(c)]);
  return { ...(await configGlobale(db)), ...c };
}

async function reinitialiser(gid, db) {
  await (db || pool).query('DELETE FROM parution_futur_gestionnaire WHERE gestionnaire_id = $1', [gid]);
  return configGlobale(db);
}

// Public (lu par la fiche produit) : null si l'add-on n'est pas activé
async function configPublique(gid, db) {
  if (!(await autorise(gid, db))) return null;
  return configPour(gid, db);
}

// Date de parution reçue de l'éditeur : 'AAAA-MM-JJTHH:mm' (heure de Montréal), '' ou null = retirer, undefined = ne pas toucher.
// Retourne undefined (ne rien changer), null (retirer) ou la chaîne locale à enregistrer.
// Fixer une NOUVELLE date exige l'add-on actif et au moins 30 minutes d'avance ; retirer la date est toujours permis.
async function resoudreDate(gid, produitId, brut, db) {
  const c = db || pool;
  if (brut === undefined) return undefined;
  if (brut === null || brut === '') return null;
  if (typeof brut !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(brut.trim())) throw new ErreurBoutique('Date de parution invalide.', 400);
  const valeur = brut.trim();
  let valide;
  try { valide = (await c.query(`SELECT ($1::timestamp IS NOT NULL) AS ok`, [valeur])).rows[0].ok; } catch (e) { valide = false; }
  if (!valide) throw new ErreurBoutique('Date de parution invalide.', 400);
  if (produitId) {
    const a = await c.query(`SELECT to_char(date_parution AT TIME ZONE 'America/Toronto', 'YYYY-MM-DD"T"HH24:MI') AS d FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL`, [produitId, gid]);
    if (a.rows[0] && a.rows[0].d === valeur) return undefined;   // inchangée : rien à valider (même si l'add-on a été retiré entre-temps)
  }
  if (!(await autorise(gid, c))) throw new ErreurBoutique("L'option « Parution future » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
  const ok = await c.query(`SELECT (($1::timestamp AT TIME ZONE 'America/Toronto') > NOW() + INTERVAL '${DELAI_MIN_MINUTES} minutes') AS ok`, [valeur]);
  if (!ok.rows[0].ok) throw new ErreurBoutique(`La date de parution doit être dans au moins ${DELAI_MIN_MINUTES} minutes.`, 400);
  return valeur;
}

module.exports = { CODE_ADDON, DEFAUT, DELAI_MIN_MINUTES, autorise, sqlAddonOn, nettoyer, configGlobale, configPour, lire, enregistrer, reinitialiser, configPublique, resoudreDate };