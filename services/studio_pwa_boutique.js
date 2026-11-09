// CHEMIN : services/studio_pwa_boutique.js
// e-Vend Studio — Add-on « App installable (PWA) » : trouve la boutique selon le domaine visité
// (sous-domaine *.e-vendstudio.ca OU domaine personnalisé) et fabrique le manifest + les balises HTML.

'use strict';

const pool = require('../db');
const addons = require('./studio_addons');

const CODE_ADDON = 'pwa_boutique';
const DOMAINE_PRINCIPAL = 'e-vendstudio.ca';
const THEME_DEFAUT = '#2d6a9f';
const FOND_DEFAUT = '#ffffff';
const COULEUR_RE = /^#[0-9a-fA-F]{6}$/;

// Petit cache mémoire (60 s) : le serveur ne questionne pas la base à chaque page.
const cache = new Map();
const DUREE_CACHE = 60 * 1000;
function viderCache() { cache.clear(); }

function normaliserHote(h) {
  return String(h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '');
}

async function chercherSite(hote) {
  if (!hote || hote === DOMAINE_PRINCIPAL || hote === 'www.' + DOMAINE_PRINCIPAL || hote === 'localhost') return null;
  const SELECT = `
    SELECT g.id AS gid, g.nom_boutique, g.statut,
           c.nom_app, c.nom_court, c.couleur_theme, c.couleur_fond, c.icone_url
    FROM sites s
    JOIN gestionnaires g ON g.id = s.gestionnaire_id
    JOIN gestionnaire_pwa_config c ON c.gestionnaire_id = g.id
    WHERE `;
  let r;
  if (hote.endsWith('.' + DOMAINE_PRINCIPAL)) {
    const etiquette = hote.slice(0, -(DOMAINE_PRINCIPAL.length + 1));
    if (!etiquette || etiquette.includes('.')) return null;
    r = await pool.query(SELECT + 's.sous_domaine = $1 LIMIT 1', [etiquette]);
  } else {
    const sansWww = hote.replace(/^www\./, '');
    r = await pool.query(SELECT + 's.domaine_perso = ANY($1::text[]) LIMIT 1', [[hote, sansWww, 'www.' + sansWww]]);
  }
  return r.rows[0] || null;
}

// → { gid, nom, nomCourt, theme, fond, icone } ou null (add-on inactif, pas d'icône, boutique suspendue, domaine inconnu)
async function pwaPourHote(hoteBrut) {
  const hote = normaliserHote(hoteBrut);
  const memo = cache.get(hote);
  if (memo && Date.now() - memo.t < DUREE_CACHE) return memo.v;

  let v = null;
  try {
    const row = await chercherSite(hote);
    if (row && row.icone_url && !['suspendu', 'banni'].includes(row.statut)
        && await addons.addonActifRapide(row.gid, CODE_ADDON, pool)) {
      const nom = String(row.nom_app || row.nom_boutique || 'Boutique').trim().slice(0, 45) || 'Boutique';
      v = {
        gid: row.gid,
        nom,
        nomCourt: String(row.nom_court || nom).trim().slice(0, 12) || nom.slice(0, 12),
        theme: COULEUR_RE.test(row.couleur_theme || '') ? row.couleur_theme : THEME_DEFAUT,
        fond: COULEUR_RE.test(row.couleur_fond || '') ? row.couleur_fond : FOND_DEFAUT,
        icone: row.icone_url,
      };
    }
  } catch (e) {
    console.warn('[pwa_boutique] résolution', e.message);
    return null; // erreur → pas mis en cache
  }
  if (cache.size > 500) cache.clear();
  cache.set(hote, { t: Date.now(), v });
  return v;
}

function manifestPour(p) {
  return {
    name: p.nom,
    short_name: p.nomCourt,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: p.fond,
    theme_color: p.theme,
    icons: [
      { src: p.icone, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: p.icone, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: p.icone, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonSur = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Script minuscule placé dans <head> : garde l'invitation d'installation du navigateur, enregistre le service worker,
// compte l'installation (une fois, quand l'app est réellement installée).
function scriptInstall(p) {
  return `(function(){
window.__pwaBoutique=${jsonSur({ nom: p.nom, theme: p.theme })};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallEvent=e;});
window.addEventListener('appinstalled',function(){
  try{
    var id=null;try{id=localStorage.getItem('pwa_device_id');}catch(x){}
    if(!id){id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(16).slice(2,10);try{localStorage.setItem('pwa_device_id',id);}catch(x){}}
    var ua=navigator.userAgent||'';var pl=/android/i.test(ua)?'android':(/iphone|ipad|ipod/i.test(ua)?'ios':'desktop');
    fetch('/api/pwa-boutique/installation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({device_id:id,plateforme:pl}),keepalive:true}).catch(function(){});
  }catch(x){}
});
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/pwa-boutique-sw.js').catch(function(){});});}
})();`;
}

function balisesHtml(p) {
  return [
    '<link rel="manifest" href="/api/pwa-boutique/manifest.webmanifest">',
    `<meta name="theme-color" content="${esc(p.theme)}">`,
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    `<meta name="apple-mobile-web-app-title" content="${esc(p.nomCourt)}">`,
    `<link rel="apple-touch-icon" href="${esc(p.icone)}">`,
    `<script>${scriptInstall(p)}</script>`,
  ].join('\n');
}

// Retourne le HTML avec les balises PWA de la boutique (ou tel quel si ce domaine n'a pas l'add-on).
async function injecter(html, hote) {
  const p = await pwaPourHote(hote);
  if (!p) return html;
  html = html
    .replace(/<link[^>]+rel=["']manifest["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']theme-color["'][^>]*>/gi, '')
    .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '');
  if (!/<\/head>/i.test(html)) return html;
  return html.replace(/<\/head>/i, () => balisesHtml(p) + '\n</head>');
}

module.exports = { CODE_ADDON, COULEUR_RE, THEME_DEFAUT, FOND_DEFAUT, pwaPourHote, manifestPour, injecter, viderCache, normaliserHote };