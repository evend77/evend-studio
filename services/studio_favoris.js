// CHEMIN : services/studio_favoris.js
// e-Vend Studio — Add-on « Favoris » (liste de souhaits + boutiques favorites) : apparence et comportement,
// personnalisables par chaque gestionnaire pour SA marketplace (table favoris_config_gestionnaire).

'use strict';

const pool = require('../db');

const DEFAUT = {
  // Général
  bouton_catalogue_actif: true, bouton_catalogue_position: 'superposition', bouton_catalogue_style: 'moderne',
  bouton_produit_actif: true, bouton_produit_position: 'avant_panier',
  elements_par_page: 20,
  entete_actif: true, entete_compteur: true,
  flottant_actif: false, flottant_position: 'bas_droite',
  // Apparence de l'icône
  icone_style: 'coeur', icone_animation: 'echelle', icone_taille: 24, icone_couleur: '#9ca3af', icone_couleur_active: '#ef4444',
  // Notifications
  notif_actif: true, notif_duree: 3, notif_placement: 'bas_centre', notif_animer: true,
  notif_couleur_texte: '#ffffff', notif_couleur_fond: '#19af66', notif_couleur_erreur_texte: '#ffffff', notif_couleur_erreur_fond: '#f84e40',
  notif_msg_ajout: "Article ajouté à votre liste de souhaits", notif_msg_retrait: "Article retiré de votre liste de souhaits",
  notif_msg_invite: "Article ajouté temporairement — connectez-vous pour l'enregistrer",
  // Invités (visiteurs non connectés)
  invites_actif: true, invites_duree_jours: 30, invites_max: 50,
};
const BORNES = { elements_par_page: [5, 100], icone_taille: [16, 48], notif_duree: [1, 15], invites_duree_jours: [1, 365], invites_max: [1, 200] };
const CHOIX = {
  bouton_catalogue_position: ['haut', 'bas', 'superposition'], bouton_catalogue_style: ['moderne', 'classique', 'minimaliste'],
  bouton_produit_position: ['avant_panier', 'apres_panier'], flottant_position: ['bas_droite', 'bas_gauche', 'haut_droite', 'haut_gauche'],
  icone_style: ['coeur', 'etoile', 'signet'], icone_animation: ['aucune', 'rebond', 'echelle', 'fondu'],
  notif_placement: ['bas_centre', 'bas_droite', 'bas_gauche', 'haut_centre'],
};

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
    } else if (CHOIX[cle]) { if (CHOIX[cle].includes(v)) out[cle] = v; }
    else if (cle.startsWith('icone_couleur') || cle.startsWith('notif_couleur')) { if (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim())) out[cle] = v.trim(); }
    else if (typeof v === 'string') out[cle] = v.replace(/[<>]/g, '').slice(0, 160);
  }
  return out;
}

async function surchargeGestionnaire(gid, db = pool) {
  try {
    const r = await db.query('SELECT config FROM favoris_config_gestionnaire WHERE gestionnaire_id = $1', [gid]);
    return (r.rows[0] && r.rows[0].config) || {};
  } catch (e) { return {}; }
}

/** Configuration effective : défauts, puis réglages du gestionnaire par-dessus. */
async function configPour(gid, db = pool) {
  return { ...DEFAUT, ...nettoyer(await surchargeGestionnaire(gid, db)) };
}

async function sauverGestionnaire(gid, brut, db = pool) {
  const c = nettoyer(brut);
  await db.query(
    `INSERT INTO favoris_config_gestionnaire (gestionnaire_id, config, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET config = $2::jsonb, updated_at = NOW()`, [gid, JSON.stringify(c)]);
  return c;
}

async function reinitialiserGestionnaire(gid, db = pool) {
  await db.query('DELETE FROM favoris_config_gestionnaire WHERE gestionnaire_id = $1', [gid]).catch(() => {});
}

module.exports = { DEFAUT, configPour, surchargeGestionnaire, nettoyer, sauverGestionnaire, reinitialiserGestionnaire };