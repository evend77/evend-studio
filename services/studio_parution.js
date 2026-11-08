// CHEMIN : services/studio_parution.js
// e-Vend Studio — Add-on « Parution future » : apparence du compte à rebours.
// Valeurs par défaut = Configuration date futur de l'admin Studio (table configuration_generale_admin) ;
// chaque gestionnaire peut les personnaliser pour SA marketplace (table parution_futur_gestionnaire).

'use strict';

const pool = require('../db');

const DEFAUT = {
  couleur_fond_debut: '#0d2b5d', couleur_fond_fin: '#0a1a3d', couleur_texte: '#e2ebff', couleur_titres: '#b7c9ff', couleur_chiffres: '#ffffff',
  couleur_bordure: '#000000', couleur_boite_fond: '#1a3a6e', couleur_boite_bordure: '#3a6aaf', taille_chiffres: 140, border_radius: 14,
  border_width: 3, ombre_active: true, ombre_intensite: 35, couleur_fond_mobile_debut: '#0d2b5d', couleur_fond_mobile_fin: '#0a1a3d',
  masquer_timezone_mobile: false, texte_titre: '⏳ Disponible dans :', texte_date_prefix: '🗓️ Mise en vente le',
  texte_timezone: '(Heure de Montréal — EST/EDT)', texte_seo: 'Ce produit sera disponible à la vente dès la fin du compte à rebours.',
  texte_vente_ouverte: '🎉 La vente est ouverte !!!', texte_atc_bloque: '', afficher_feux_artifice: true, duree_feux_artifice: 5,
  afficher_timezone: true, afficher_seo: true, effet_vague: true, vitesse_vague: 'normale', effet_bordure: true, bloquer_wishlist: true,
  afficher_message_atc: false, duree_vente_ouverte: 24, duree_disparition_bloc: 5,
  couleur_feux_1: '#fbbf24', couleur_feux_2: '#f472b6', couleur_feux_3: '#60a5fa',   // couleurs des feux d'artifice
};
const BORNES = { taille_chiffres: [80, 220], border_radius: [0, 30], border_width: [0, 8], ombre_intensite: [5, 100], duree_feux_artifice: [1, 30], duree_vente_ouverte: [1, 48], duree_disparition_bloc: [1, 30] };

/** Valeurs de base de la plateforme (admin Studio) + défauts. */
async function configGlobale(db = pool) {
  try {
    const r = await db.query('SELECT config_parution_futur FROM configuration_generale_admin WHERE id = 1 LIMIT 1');
    const c = r.rows[0] && r.rows[0].config_parution_futur;
    return { ...DEFAUT, ...(c && typeof c === 'object' ? c : {}) };
  } catch (e) { return { ...DEFAUT }; }
}

/** Personnalisation propre au gestionnaire (peut être vide). */
async function surchargeGestionnaire(gid, db = pool) {
  try {
    const r = await db.query('SELECT config FROM parution_futur_gestionnaire WHERE gestionnaire_id = $1', [gid]);
    return (r.rows[0] && r.rows[0].config) || {};
  } catch (e) { return {}; }
}

/** Configuration effective pour une marketplace : plateforme, puis réglages du gestionnaire par-dessus. */
async function configPour(gid, db = pool) {
  const [g, s] = await Promise.all([configGlobale(db), surchargeGestionnaire(gid, db)]);
  return { ...g, ...nettoyer(s) };
}

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

async function sauverGestionnaire(gid, brut, db = pool) {
  const c = nettoyer(brut);
  await db.query(
    `INSERT INTO parution_futur_gestionnaire (gestionnaire_id, config, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET config = $2::jsonb, updated_at = NOW()`, [gid, JSON.stringify(c)]);
  return c;
}

async function reinitialiserGestionnaire(gid, db = pool) {
  await db.query('DELETE FROM parution_futur_gestionnaire WHERE gestionnaire_id = $1', [gid]).catch(() => {});
}

module.exports = { DEFAUT, configGlobale, surchargeGestionnaire, configPour, nettoyer, sauverGestionnaire, reinitialiserGestionnaire };