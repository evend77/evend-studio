// CHEMIN : services/boutique_effets.js
// e-Vend Studio — Add-on « Effets de boutique » des templates boutique (solo) : lecture / validation des réglages.
// Table PROPRE à la boutique (boutique_effets). Le catalogue de musiques (effets_musiques) est partagé avec le MV, en lecture seule.
// Ne lit ni n'écrit rien du multivendeur.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');

const CODE_ADDON = 'effets_boutique';
const ID_RE = /^[a-z0-9-]{1,60}$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const STYLES = ['fixe', 'scintillement', 'chenillard', 'vague'];

const nombre = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
};

function nettoyerIds(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x) => typeof x === 'string' && ID_RE.test(x)))].slice(0, 40);
}

// { effetId: { taille, nombre, vitesse, vitesseRotation, couleurs[], couleur, styleAnimation, texte, drapeaux[] } }
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

const VIDE = { saison: null, effets: [], effetsConfig: {}, venteEffets: [], venteEffetsConfig: {}, musique: null, musiqueUrl: null, musiqueConfig: { volume: 45, boucle: true } };

// Config enregistrée (forme utilisée par la page du gestionnaire et par la boutique)
async function lire(gid) {
  const { rows } = await pool.query(
    `SELECT g.saison_active, g.effets_actifs, g.effets_config, g.vente_effets_actifs, g.vente_effets_config,
            g.musique_slug, g.musique_config, m.url AS musique_url
       FROM boutique_effets g
       LEFT JOIN effets_musiques m ON m.slug = g.musique_slug AND m.actif = TRUE
      WHERE g.gestionnaire_id = $1`, [gid]);
  const r = rows[0];
  if (!r) return { ...VIDE };
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

async function musiquesDisponibles() {
  const r = await pool.query('SELECT slug AS id, nom, categorie, emoji, url FROM effets_musiques WHERE actif = TRUE ORDER BY categorie, nom');
  return r.rows;
}

async function enregistrer(gid, body) {
  const v = valider(body);
  if (v.musique) {
    const ok = await pool.query('SELECT 1 FROM effets_musiques WHERE slug = $1 AND actif = TRUE', [v.musique]);
    if (!ok.rows.length) v.musique = null;
  }
  await pool.query(
    `INSERT INTO boutique_effets (gestionnaire_id, saison_active, effets_actifs, effets_config, vente_effets_actifs, vente_effets_config, musique_slug, musique_config, updated_at)
     VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8::jsonb,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET saison_active = EXCLUDED.saison_active, effets_actifs = EXCLUDED.effets_actifs,
       effets_config = EXCLUDED.effets_config, vente_effets_actifs = EXCLUDED.vente_effets_actifs, vente_effets_config = EXCLUDED.vente_effets_config,
       musique_slug = EXCLUDED.musique_slug, musique_config = EXCLUDED.musique_config, updated_at = NOW()`,
    [gid, v.saison, JSON.stringify(v.effets), JSON.stringify(v.effetsConfig), JSON.stringify(v.venteEffets),
     JSON.stringify(v.venteEffetsConfig), v.musique, JSON.stringify(v.musiqueConfig)]);
  return lire(gid);
}

// Cet add-on est-il actif pour ce gestionnaire ? (activé dans « Mon plan & limites » ET branché)
async function actif(gid) {
  return A.addonActif(gid, CODE_ADDON);
}

module.exports = { CODE_ADDON, valider, lire, enregistrer, musiquesDisponibles, actif };