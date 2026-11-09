// CHEMIN : services/studio_effets_boutique.js
// Add-on « Effets de boutique » — lecture / validation des réglages.
'use strict';

const pool = require('../db');
const addons = require('./studio_addons');

const CODE_ADDON = 'effets_boutique';
const ID_RE = /^[a-z0-9-]{1,40}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const STYLES = ['fixe', 'scintillement', 'chenillard', 'vague'];

const nombre = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
};

// Nettoie une liste d'ids (effets cochés)
function nettoyerIds(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x) => typeof x === 'string' && ID_RE.test(x)))].slice(0, 40);
}

// Nettoie la config { effetId: { taille, nombre, vitesse, vitesseRotation, couleurs[], couleur, styleAnimation, texte, drapeaux[] } }
function nettoyerConfig(v) {
  const out = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [id, c] of Object.entries(v).slice(0, 40)) {
    if (!ID_RE.test(id) || !c || typeof c !== 'object') continue;
    const r = {};
    const t = nombre(c.taille, 1, 300); if (t !== undefined) r.taille = t;
    const n = nombre(c.nombre, 1, 60); if (n !== undefined) r.nombre = n;
    const vi = nombre(c.vitesse, 1, 120); if (vi !== undefined) r.vitesse = vi;
    const vr = nombre(c.vitesseRotation, 0.1, 30); if (vr !== undefined) r.vitesseRotation = vr;
    if (typeof c.couleur === 'string' && HEX_RE.test(c.couleur)) r.couleur = c.couleur;
    if (Array.isArray(c.couleurs)) r.couleurs = c.couleurs.filter((x) => typeof x === 'string' && HEX_RE.test(x)).slice(0, 12);
    if (typeof c.styleAnimation === 'string' && STYLES.includes(c.styleAnimation)) r.styleAnimation = c.styleAnimation;
    if (typeof c.texte === 'string') r.texte = c.texte.slice(0, 40);
    if (Array.isArray(c.drapeaux)) r.drapeaux = nettoyerIds(c.drapeaux).slice(0, 14);
    out[id] = r;
  }
  return out;
}

// Valide ce que le gestionnaire envoie
function valider(body) {
  const b = body || {};
  const saison = typeof b.saison === 'string' && ID_RE.test(b.saison) ? b.saison : null;
  const mc = b.musiqueConfig || {};
  return {
    saison,
    effets: saison ? nettoyerIds(b.effets) : [],
    effetsConfig: nettoyerConfig(b.effetsConfig),
    venteEffets: nettoyerIds(b.venteEffets),
    venteEffetsConfig: nettoyerConfig(b.venteEffetsConfig),
    musique: typeof b.musique === 'string' && ID_RE.test(b.musique) ? b.musique : null,
    musiqueConfig: { volume: nombre(mc.volume, 0, 100) ?? 45, boucle: mc.boucle !== false },
  };
}

// Config enregistrée (forme utilisée par la page et par la boutique)
async function lire(gid) {
  const { rows } = await pool.query(
    `SELECT g.saison_active, g.effets_actifs, g.effets_config, g.vente_effets_actifs, g.vente_effets_config,
            g.musique_slug, g.musique_config, m.url AS musique_url
       FROM gestionnaire_effets g
       LEFT JOIN effets_musiques m ON m.slug = g.musique_slug AND m.actif = TRUE
      WHERE g.gestionnaire_id = $1`, [gid]);
  const r = rows[0];
  if (!r) return { saison: null, effets: [], effetsConfig: {}, venteEffets: [], venteEffetsConfig: {}, musique: null, musiqueUrl: null, musiqueConfig: { volume: 45, boucle: true } };
  return {
    saison: r.saison_active,
    effets: r.effets_actifs || [],
    effetsConfig: r.effets_config || {},
    venteEffets: r.vente_effets_actifs || [],
    venteEffetsConfig: r.vente_effets_config || {},
    musique: r.musique_url ? r.musique_slug : null,
    musiqueUrl: r.musique_url || null,
    musiqueConfig: r.musique_config || { volume: 45, boucle: true },
  };
}

async function actif(gid) {
  return addons.addonActifRapide(gid, CODE_ADDON, pool);
}

module.exports = { CODE_ADDON, valider, lire, actif };