// CHEMIN : services/boutique_favoris.js
// e-Vend Studio — Add-on « Favoris » (liste de souhaits) des templates boutique (solo). Adapté de services/studio_favoris.js (MV) et de routes/acheteur_dashboard.js (liste de souhaits), sans y toucher.
// Tables réutilisées telles quelles : favoris_config_gestionnaire (réglages, une ligne par gestionnaire) et marketplace_wishlist (la liste de l'acheteur). Aucune nouvelle table.
// Qui peut l'utiliser : l'add-on « favoris » doit être activé (boutique_addons_achetes) — même règle que les autres add-ons boutique (A.addonActif).
// Seuls les produits de la boutique solo comptent (collaborateur_id vide). Les listes restent en base si l'add-on est retiré, mais plus rien n'est affiché ni modifiable.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');
const O = require('./boutique_offres');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'favoris';
const MAX_ARTICLES = 300;      // taille maximale de la liste d'un acheteur
const MAX_SYNCHRO = 200;       // produits acceptés en une fois lors du transfert de la liste d'un visiteur
const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };
async function autorise(gid) { return A.addonActif(gid, CODE_ADDON); }

// ─── Réglages du gestionnaire ────────────────────────────────────────────────
const DEFAUT = {
  bouton_catalogue_actif: true, bouton_catalogue_position: 'superposition', bouton_catalogue_style: 'moderne',
  bouton_produit_actif: true, bouton_produit_position: 'avant_panier',
  elements_par_page: 20,
  entete_actif: true, entete_compteur: true,
  flottant_actif: false, flottant_position: 'bas_droite',
  icone_style: 'coeur', icone_animation: 'echelle', icone_taille: 24, icone_couleur: '#9ca3af', icone_couleur_active: '#ef4444',
  notif_actif: true, notif_duree: 3, notif_placement: 'bas_centre', notif_animer: true,
  notif_couleur_texte: '#ffffff', notif_couleur_fond: '#19af66', notif_couleur_erreur_texte: '#ffffff', notif_couleur_erreur_fond: '#f84e40',
  notif_msg_ajout: 'Article ajouté à votre liste de souhaits', notif_msg_retrait: 'Article retiré de votre liste de souhaits',
  notif_msg_invite: "Article ajouté temporairement — connectez-vous pour l'enregistrer",
  invites_actif: true, invites_duree_jours: 30, invites_max: 50,
};
const BORNES = { elements_par_page: [5, 100], icone_taille: [16, 48], notif_duree: [1, 15], invites_duree_jours: [1, 365], invites_max: [1, 200] };
const CHOIX = {
  bouton_catalogue_position: ['haut', 'bas', 'superposition'], bouton_catalogue_style: ['moderne', 'classique', 'minimaliste'],
  bouton_produit_position: ['avant_panier', 'apres_panier'], flottant_position: ['bas_droite', 'bas_gauche', 'haut_droite', 'haut_gauche'],
  icone_style: ['coeur', 'etoile', 'signet'], icone_animation: ['aucune', 'rebond', 'echelle', 'fondu'],
  notif_placement: ['bas_centre', 'bas_droite', 'bas_gauche', 'haut_centre'],
};

/** Ne garde que les clés connues, du bon type, dans les bornes (une couleur ou un texte invalide est ignoré, jamais enregistré). */
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
    } else if (CHOIX[cle]) { if (CHOIX[cle].includes(v)) out[cle] = v; }
    else if (cle.startsWith('icone_couleur') || cle.startsWith('notif_couleur')) { if (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim())) out[cle] = v.trim(); }
    else if (typeof v === 'string') { const t = v.replace(/[<>]/g, '').trim().slice(0, 160); if (t) out[cle] = t; }
  }
  return out;
}

async function surcharge(gid) {
  try {
    const r = await pool.query('SELECT config FROM favoris_config_gestionnaire WHERE gestionnaire_id = $1', [gid]);
    return { existe: r.rowCount > 0, config: (r.rows[0] && r.rows[0].config) || {} };
  } catch (e) { return { existe: false, config: {} }; }
}

/** Gestionnaire : réglages effectifs (défauts + les siens) et `personnalisee` (a-t-il déjà enregistré ?). */
async function lire(gid) {
  const s = await surcharge(gid);
  return { config: { ...DEFAUT, ...nettoyer(s.config) }, personnalisee: s.existe };
}

async function enregistrer(gid, brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) refus('Réglages invalides.');
  const c = nettoyer(brut);
  await pool.query(
    `INSERT INTO favoris_config_gestionnaire (gestionnaire_id, config, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET config = $2::jsonb, updated_at = NOW()`, [gid, JSON.stringify(c)]);
  return { ...DEFAUT, ...c };
}

async function reinitialiser(gid) {
  await pool.query('DELETE FROM favoris_config_gestionnaire WHERE gestionnaire_id = $1', [gid]);
  return { ...DEFAUT };
}

/** Public (lu par le site) : les réglages, ou null si l'add-on n'est pas activé. */
async function configPublique(gid) {
  if (!(await autorise(gid))) return null;
  return (await lire(gid)).config;
}

// ─── Liste de souhaits de l'acheteur ─────────────────────────────────────────
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

function disponible(p) {
  if (p.statut !== 'actif') return false;
  if (p.date_parution && new Date(p.date_parution).getTime() > Date.now()) return false;
  if (p.date_expiration && new Date(p.date_expiration).getTime() <= Date.now()) return false;
  return true;
}

/** { actif, items, ids } — items prêts à afficher (prix promo du moment, disponibilité), ids pour colorer les cœurs. Vide si l'add-on est inactif. */
async function lister(gid, acheteurId) {
  if (!(await autorise(gid))) return { actif: false, items: [], ids: [] };
  const r = await pool.query(
    `SELECT w.id, w.created_at, p.id AS produit_id, p.titre, p.prix, ${O.sqlPromo('p')} AS prix_promo, p.stock, p.photo_principale, p.categorie, p.statut,
            p.date_parution, p.date_expiration, p.variantes
       FROM marketplace_wishlist w
       JOIN produits p ON p.id = w.produit_id AND p.gestionnaire_id = w.gestionnaire_id AND p.collaborateur_id IS NULL
      WHERE w.acheteur_id = $1 AND w.gestionnaire_id = $2
      ORDER BY w.created_at DESC, w.id DESC LIMIT ${MAX_ARTICLES}`, [acheteurId, gid]);
  const items = r.rows.map((p) => {
    const { date_parution, date_expiration, variantes, ...reste } = p;
    return { ...reste, a_variantes: Array.isArray(variantes) && variantes.length > 0, disponible: disponible(p) && (p.stock === null || Number(p.stock) > 0 || (Array.isArray(variantes) && variantes.length > 0)) };
  });
  return { actif: true, items, ids: items.map((i) => i.produit_id) };
}

async function exigerActif(gid) {
  if (!(await autorise(gid))) refus("L'option « Favoris » n'est pas activée pour cette boutique.", 403);
}

async function ajouter(gid, acheteurId, produitBrut) {
  await exigerActif(gid);
  const pid = entier(produitBrut); if (!pid) refus('Annonce invalide.');
  const p = await pool.query(`SELECT id FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL AND statut = 'actif'`, [pid, gid]);
  if (!p.rowCount) refus('Annonce introuvable.', 404);
  const deja = await pool.query('SELECT 1 FROM marketplace_wishlist WHERE acheteur_id = $1 AND produit_id = $2', [acheteurId, pid]);
  if (!deja.rowCount) {
    const n = (await pool.query('SELECT COUNT(*)::int n FROM marketplace_wishlist WHERE acheteur_id = $1 AND gestionnaire_id = $2', [acheteurId, gid])).rows[0].n;
    if (n >= MAX_ARTICLES) refus(`Votre liste est pleine (${MAX_ARTICLES} articles). Retirez-en quelques-uns d'abord.`, 409);
    await pool.query('INSERT INTO marketplace_wishlist (gestionnaire_id, acheteur_id, produit_id) VALUES ($1,$2,$3) ON CONFLICT (acheteur_id, produit_id) DO NOTHING', [gid, acheteurId, pid]);
  }
  return { produit_id: pid };
}

async function retirer(gid, acheteurId, produitBrut) {
  await exigerActif(gid);
  const pid = entier(produitBrut); if (!pid) refus('Annonce invalide.');
  await pool.query('DELETE FROM marketplace_wishlist WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND produit_id = $3', [acheteurId, gid, pid]);
  return { produit_id: pid };
}

/** Après la connexion : enregistre d'un coup les produits ajoutés en visiteur (ignore ce qui n'existe pas ou n'est plus actif, respecte le plafond). */
async function synchroniser(gid, acheteurId, brut) {
  await exigerActif(gid);
  const liste = Array.isArray(brut) ? brut.slice(0, MAX_SYNCHRO).map(entier).filter(Boolean) : [];
  const ids = [...new Set(liste)];
  if (!ids.length) return { ajoutes: 0 };
  const n = (await pool.query('SELECT COUNT(*)::int n FROM marketplace_wishlist WHERE acheteur_id = $1 AND gestionnaire_id = $2', [acheteurId, gid])).rows[0].n;
  const place = Math.max(0, MAX_ARTICLES - n);
  if (!place) return { ajoutes: 0 };
  const r = await pool.query(
    `INSERT INTO marketplace_wishlist (gestionnaire_id, acheteur_id, produit_id)
     SELECT $1, $2, p.id FROM produits p WHERE p.id = ANY($3::int[]) AND p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.statut = 'actif'
      ORDER BY p.id LIMIT $4
     ON CONFLICT (acheteur_id, produit_id) DO NOTHING`, [gid, acheteurId, ids, place]);
  return { ajoutes: r.rowCount };
}

module.exports = { CODE_ADDON, MAX_ARTICLES, MAX_SYNCHRO, DEFAUT, autorise, nettoyer, lire, enregistrer, reinitialiser, configPublique, lister, ajouter, retirer, synchroniser };