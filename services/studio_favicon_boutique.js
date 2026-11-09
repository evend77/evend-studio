// CHEMIN : services/studio_favicon_boutique.js
// e-Vend Studio — Add-on « Favicon personnalisé » : remplace le favicon de la plateforme par celui du gestionnaire,
// SEULEMENT sur l'adresse de sa boutique (sous-domaine *.e-vendstudio.ca ou domaine personnalisé).
// e-vendstudio.ca et www.e-vendstudio.ca ne sont jamais touchés.

'use strict';

const pool = require('../db');
const addons = require('./studio_addons');

const CODE_ADDON = 'favicon_boutique';
const DOMAINE_PRINCIPAL = 'e-vendstudio.ca';
const DUREE_CACHE = 60 * 1000;
const cache = new Map();
function viderCache() { cache.clear(); }

const normaliserHote = (h) => String(h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '');

async function chercher(hote) {
  if (!hote || hote === DOMAINE_PRINCIPAL || hote === 'www.' + DOMAINE_PRINCIPAL || hote === 'localhost') return null;
  const SELECT = `
    SELECT g.id AS gid, g.statut, f.favicon_url
    FROM sites s
    JOIN gestionnaires g ON g.id = s.gestionnaire_id
    JOIN gestionnaire_favicon f ON f.gestionnaire_id = g.id
    WHERE f.favicon_url IS NOT NULL AND `;
  if (hote.endsWith('.' + DOMAINE_PRINCIPAL)) {
    const etiquette = hote.slice(0, -(DOMAINE_PRINCIPAL.length + 1));
    if (!etiquette || etiquette.includes('.')) return null;
    return (await pool.query(SELECT + 's.sous_domaine = $1 LIMIT 1', [etiquette])).rows[0] || null;
  }
  const sansWww = hote.replace(/^www\./, '');
  return (await pool.query(SELECT + 's.domaine_perso = ANY($1::text[]) LIMIT 1', [[hote, sansWww, 'www.' + sansWww]])).rows[0] || null;
}

// → url du favicon de la boutique, ou null (add-on inactif, pas d'image, boutique suspendue, domaine inconnu)
async function faviconPourHote(hoteBrut) {
  const hote = normaliserHote(hoteBrut);
  const memo = cache.get(hote);
  if (memo && Date.now() - memo.t < DUREE_CACHE) return memo.v;
  let v = null;
  try {
    const row = await chercher(hote);
    if (row && !['suspendu', 'banni'].includes(row.statut) && await addons.addonActifRapide(row.gid, CODE_ADDON, pool)) v = row.favicon_url;
  } catch (e) {
    console.warn('[favicon_boutique] résolution', e.message);
    return null;
  }
  if (cache.size > 500) cache.clear();
  cache.set(hote, { t: Date.now(), v });
  return v;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function injecter(html, hote) {
  const url = await faviconPourHote(hote);
  if (!url || !/<\/head>/i.test(html)) return html;
  html = html
    .replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi, '')
    .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '');
  return html.replace(/<\/head>/i, () => `<link rel="icon" type="image/png" href="${esc(url)}">\n<link rel="apple-touch-icon" href="${esc(url)}">\n</head>`);
}

module.exports = { CODE_ADDON, faviconPourHote, injecter, viderCache, normaliserHote };