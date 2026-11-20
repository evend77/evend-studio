// CHEMIN : services/boutique_pwa.js
// e-Vend Studio — Add-on « App installable (PWA) » des templates boutique (solo) : nom, couleurs, icône, manifest, installations.
// Trouve la boutique selon le domaine visité (sous-domaine *.e-vendstudio.ca OU domaine personnalisé) — boutiques SOLO seulement.
// Réglages dans gestionnaire_pwa_config et installations dans pwa_boutique_installations (mêmes tables que le MV : un gestionnaire n'a qu'un seul site).
// Accès : add-on « pwa_boutique » acheté et activé (A.addonActif). Aucun lien de code avec le MV.
// Une boutique solo reçoit toujours le repère <!--bq-pwa--> : server.js n'applique alors PAS l'injecteur du MV (pas de doublon, pas de contournement).

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'pwa_boutique';
const DOMAINE_PRINCIPAL = 'e-vendstudio.ca';
const THEME_DEFAUT = '#2d6a9f';
const FOND_DEFAUT = '#ffffff';
const COULEUR_RE = /^#[0-9a-fA-F]{6}$/;
const MIN = 512, MAX = 2048, MAX_OCTETS = 2 * 1024 * 1024;
const MEDIA_URL = 'https://media.e-vend.ca';
const FUSEAU = 'America/Toronto';
const REPERE = '<!--bq-pwa-->';
const CTRL = /[\u0000-\u001f\u007f<>]/g;
const DUREE_CACHE = 60 * 1000;

const cache = new Map();
function viderCache() { cache.clear(); }
const normaliserHote = (h) => String(h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '');
const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

async function chercher(hote) {
  if (!hote || hote === DOMAINE_PRINCIPAL || hote === 'www.' + DOMAINE_PRINCIPAL || hote === 'localhost') return null;
  const SELECT = `
    SELECT g.id AS gid, g.nom_boutique, g.statut, s.template_id, c.nom_app, c.nom_court, c.couleur_theme, c.couleur_fond, c.icone_url
    FROM sites s
    JOIN gestionnaires g ON g.id = s.gestionnaire_id
    LEFT JOIN gestionnaire_pwa_config c ON c.gestionnaire_id = g.id
    WHERE `;
  if (hote.endsWith('.' + DOMAINE_PRINCIPAL)) {
    const etiquette = hote.slice(0, -(DOMAINE_PRINCIPAL.length + 1));
    if (!etiquette || etiquette.includes('.')) return null;
    return (await pool.query(SELECT + 's.sous_domaine = $1 LIMIT 1', [etiquette])).rows[0] || null;
  }
  const sansWww = hote.replace(/^www\./, '');
  return (await pool.query(SELECT + 's.domaine_perso = ANY($1::text[]) LIMIT 1', [[hote, sansWww, 'www.' + sansWww]])).rows[0] || null;
}

// → null (pas une boutique solo / domaine inconnu) ou { gid, pwa } ; pwa = { nom, nomCourt, theme, fond, icone } ou null (add-on inactif, pas d'icône, boutique suspendue)
async function pourHote(hoteBrut) {
  const hote = normaliserHote(hoteBrut);
  const memo = cache.get(hote);
  if (memo && Date.now() - memo.t < DUREE_CACHE) return memo.v;
  let v = null;
  try {
    const row = await chercher(hote);
    if (row && A.estTemplateSolo(row.template_id)) {
      v = { gid: row.gid, pwa: null };
      if (row.icone_url && !['suspendu', 'banni'].includes(row.statut) && await autorise(row.gid)) {
        const nom = String(row.nom_app || row.nom_boutique || 'Boutique').trim().slice(0, 45) || 'Boutique';
        v.pwa = {
          nom,
          nomCourt: String(row.nom_court || nom).trim().slice(0, 12) || nom.slice(0, 12),
          theme: COULEUR_RE.test(row.couleur_theme || '') ? row.couleur_theme : THEME_DEFAUT,
          fond: COULEUR_RE.test(row.couleur_fond || '') ? row.couleur_fond : FOND_DEFAUT,
          icone: row.icone_url,
        };
      }
    }
  } catch (e) {
    console.warn('[boutique_pwa] résolution', e.message);
    return null;
  }
  if (cache.size > 500) cache.clear();
  cache.set(hote, { t: Date.now(), v });
  return v;
}

function manifestPour(p) {
  return {
    name: p.nom, short_name: p.nomCourt, start_url: '/', scope: '/', display: 'standalone',
    background_color: p.fond, theme_color: p.theme,
    icons: [
      { src: p.icone, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: p.icone, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: p.icone, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonSur = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Script minuscule placé dans <head> : garde l'invitation d'installation du navigateur, enregistre le service worker (/pwa-boutique-sw.js, le même que le MV),
// compte l'installation (une fois, quand l'app est réellement installée) vers /api/boutique/pwa/installation.
function scriptInstall(p) {
  return `(function(){
window.__pwaBoutique=${jsonSur({ nom: p.nom, theme: p.theme })};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallEvent=e;});
window.addEventListener('appinstalled',function(){
  try{
    var id=null;try{id=localStorage.getItem('pwa_device_id');}catch(x){}
    if(!id){id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(16).slice(2,10);try{localStorage.setItem('pwa_device_id',id);}catch(x){}}
    var ua=navigator.userAgent||'';var pl=/android/i.test(ua)?'android':(/iphone|ipad|ipod/i.test(ua)?'ios':'desktop');
    fetch('/api/boutique/pwa/installation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({device_id:id,plateforme:pl}),keepalive:true}).catch(function(){});
  }catch(x){}
});
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/pwa-boutique-sw.js').catch(function(){});});}
})();`;
}

function balisesHtml(p) {
  return [
    '<link rel="manifest" href="/api/boutique/pwa/manifest.webmanifest">',
    `<meta name="theme-color" content="${esc(p.theme)}">`,
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    `<meta name="apple-mobile-web-app-title" content="${esc(p.nomCourt)}">`,
    `<link rel="apple-touch-icon" href="${esc(p.icone)}">`,
    `<script>${scriptInstall(p)}</script>`,
  ].join('\n');
}

// Appelé par server.js pour chaque page HTML : ne touche que les boutiques solo.
async function injecter(html, hote) {
  const r = await pourHote(hote);
  if (!r || !/<\/head>/i.test(html)) return html;
  let ajout = REPERE + '\n';
  if (r.pwa) {
    html = html
      .replace(/<link[^>]+rel=["']manifest["'][^>]*>/gi, '')
      .replace(/<meta[^>]+name=["']theme-color["'][^>]*>/gi, '')
      .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '');
    ajout += balisesHtml(r.pwa) + '\n';
  }
  return html.replace(/<\/head>/i, () => ajout + '</head>');
}

// ─── Public ───────────────────────────────────────────────────────────────────
async function manifestPourHote(hote) { const r = await pourHote(hote); return r && r.pwa ? manifestPour(r.pwa) : null; }

// Installation d'un appareil : la boutique vient du domaine visité (jamais d'un champ du navigateur). → 'cree' | 'doublon' | 'invalide' | 'aucune'
async function compterInstallation(hote, deviceId, plateforme, userAgent, db) {
  if (typeof deviceId !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(deviceId)) return 'invalide';
  const r = await pourHote(hote);
  if (!r || !r.pwa) return 'aucune';
  const c = db || pool;
  const plat = ['android', 'ios', 'desktop'].includes(plateforme) ? plateforme : null;
  const deja = await c.query(`SELECT 1 FROM pwa_boutique_installations WHERE gestionnaire_id = $1 AND device_id = $2 AND installed_at > NOW() - INTERVAL '1 minute' LIMIT 1`, [r.gid, deviceId]);
  if (deja.rows.length) return 'doublon';
  await c.query('INSERT INTO pwa_boutique_installations (gestionnaire_id, device_id, plateforme, user_agent) VALUES ($1, $2, $3, $4)', [r.gid, deviceId, plat, String(userAgent || '').slice(0, 300)]);
  return 'cree';
}

// ─── Gestionnaire ─────────────────────────────────────────────────────────────
function taillePng(b) {
  if (!Buffer.isBuffer(b) || b.length < 33) return null;
  if (b.readUInt32BE(0) !== 0x89504e47 || b.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

async function statistiques(gid, db) {
  const c = db || pool;
  const d = (await c.query(`
    SELECT date_trunc('day',   NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS jour,
           date_trunc('week',  NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS semaine,
           date_trunc('month', NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS mois,
           date_trunc('year',  NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS annee`)).rows[0];
  const params = [gid, d.jour, d.semaine, d.mois, d.annee];
  const inst = (await c.query(`
    SELECT COUNT(*) FILTER (WHERE installed_at >= $2)::int AS jour, COUNT(*) FILTER (WHERE installed_at >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE installed_at >= $4)::int AS mois, COUNT(*) FILTER (WHERE installed_at >= $5)::int AS annee, COUNT(*)::int AS total
    FROM pwa_boutique_installations WHERE gestionnaire_id = $1`, params)).rows[0];
  // « appareils » = première installation de chaque appareil (une réinstallation ne compte pas)
  const app = (await c.query(`
    WITH premiere AS (SELECT device_id, MIN(installed_at) AS p FROM pwa_boutique_installations WHERE gestionnaire_id = $1 GROUP BY device_id)
    SELECT COUNT(*) FILTER (WHERE p >= $2)::int AS jour, COUNT(*) FILTER (WHERE p >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE p >= $4)::int AS mois, COUNT(*) FILTER (WHERE p >= $5)::int AS annee, COUNT(*)::int AS total
    FROM premiere`, params)).rows[0];
  const plat = (await c.query(`SELECT COALESCE(plateforme, 'autre') AS plateforme, COUNT(DISTINCT device_id)::int AS n FROM pwa_boutique_installations WHERE gestionnaire_id = $1 GROUP BY 1`, [gid])).rows;
  return { appareils: app, installations: inst, plateformes: plat };
}

async function lire(gid, db) {
  const c = db || pool;
  const r = (await c.query(`SELECT g.nom_boutique, p.nom_app, p.nom_court, p.couleur_theme, p.couleur_fond, p.icone_url
                            FROM gestionnaires g LEFT JOIN gestionnaire_pwa_config p ON p.gestionnaire_id = g.id WHERE g.id = $1`, [gid])).rows[0] || {};
  return {
    nom_boutique: r.nom_boutique || '', nom_app: r.nom_app || '', nom_court: r.nom_court || '',
    couleur_theme: r.couleur_theme || THEME_DEFAUT, couleur_fond: r.couleur_fond || FOND_DEFAUT,
    icone_url: r.icone_url || null, active: !!r.icone_url, min: MIN, max: MAX,
    addon_actif: await autorise(gid, c), stats: await statistiques(gid, c),
  };
}

async function exigerAddon(gid, db) {
  if (!(await autorise(gid, db))) throw new ErreurBoutique("L'option « App installable (PWA) » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
}

async function enregistrer(gid, b, db) {
  await exigerAddon(gid, db);
  b = b && typeof b === 'object' && !Array.isArray(b) ? b : {};
  const nettoyer = (v, max) => (typeof v === 'string' ? v.replace(CTRL, '').trim().slice(0, max) : '');
  const nom = nettoyer(b.nom_app, 45), court = nettoyer(b.nom_court, 12);
  const theme = String(b.couleur_theme || '').trim(), fond = String(b.couleur_fond || '').trim();
  if (!COULEUR_RE.test(theme) || !COULEUR_RE.test(fond)) throw new ErreurBoutique('Les couleurs doivent être au format #rrggbb (ex. #2d6a9f).', 400);
  await (db || pool).query(
    `INSERT INTO gestionnaire_pwa_config (gestionnaire_id, nom_app, nom_court, couleur_theme, couleur_fond, updated_at)
     VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET nom_app = EXCLUDED.nom_app, nom_court = EXCLUDED.nom_court,
       couleur_theme = EXCLUDED.couleur_theme, couleur_fond = EXCLUDED.couleur_fond, updated_at = NOW()`,
    [gid, nom, court, theme, fond]);
  viderCache();
}

// Stockage R2 (remplaçable dans les tests)
let s3 = null;
const client = () => {
  if (!process.env.R2_BUCKET_PRODUITS || !process.env.R2_ENDPOINT) throw new ErreurBoutique("L'envoi d'images n'est pas disponible pour le moment.", 503);
  const { S3Client } = require('@aws-sdk/client-s3');
  return s3 || (s3 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } }));
};
const stockage = {
  async put(cle, buffer) { const { PutObjectCommand } = require('@aws-sdk/client-s3'); await client().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buffer, ContentType: 'image/png' })); },
  async del(cle) { const { DeleteObjectCommand } = require('@aws-sdk/client-s3'); await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle })); },
};
const cleDe = (gid, url) => { const pre = `${MEDIA_URL}/boutique/pwa/${gid}/`; return typeof url === 'string' && url.startsWith(pre) ? url.slice(MEDIA_URL.length + 1) : null; };   // seulement NOS fichiers
async function supprimerAncien(gid, url) { const k = cleDe(gid, url); if (k) { try { await stockage.del(k); } catch (e) { console.warn('[boutique_pwa] suppression R2', e.message); } } }

async function televerserIcone(gid, buffer, db) {
  await exigerAddon(gid, db);
  const t = taillePng(buffer);
  if (!t) throw new ErreurBoutique("Format non accepté : l'icône doit être une image PNG.", 400);
  if (t.w !== t.h) throw new ErreurBoutique(`L'icône doit être carrée (la vôtre fait ${t.w} x ${t.h}).`, 400);
  if (t.w < MIN) throw new ErreurBoutique(`L'icône est trop petite (${t.w} x ${t.h}). Minimum : ${MIN} x ${MIN}.`, 400);
  if (t.w > MAX) throw new ErreurBoutique(`L'icône est trop grande (${t.w} x ${t.h}). Maximum : ${MAX} x ${MAX}.`, 400);
  const c = db || pool;
  const avant = (await c.query('SELECT icone_url FROM gestionnaire_pwa_config WHERE gestionnaire_id = $1', [gid])).rows[0];
  const cle = `boutique/pwa/${gid}/${crypto.randomBytes(16).toString('hex')}.png`;
  await stockage.put(cle, buffer);
  const url = `${MEDIA_URL}/${cle}`;
  await c.query(`INSERT INTO gestionnaire_pwa_config (gestionnaire_id, icone_url, updated_at) VALUES ($1, $2, NOW())
                 ON CONFLICT (gestionnaire_id) DO UPDATE SET icone_url = EXCLUDED.icone_url, updated_at = NOW()`, [gid, url]);
  viderCache();
  if (avant) await supprimerAncien(gid, avant.icone_url);
  return url;
}

// Retirer est toujours permis (même si l'add-on a été retiré) : la PWA se désactive
async function retirerIcone(gid, db) {
  const c = db || pool;
  const avant = (await c.query('SELECT icone_url FROM gestionnaire_pwa_config WHERE gestionnaire_id = $1', [gid])).rows[0];
  await c.query('UPDATE gestionnaire_pwa_config SET icone_url = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [gid]);
  viderCache();
  if (avant) await supprimerAncien(gid, avant.icone_url);
}

module.exports = { CODE_ADDON, COULEUR_RE, THEME_DEFAUT, FOND_DEFAUT, MIN, MAX, MAX_OCTETS, REPERE, pourHote, manifestPour, manifestPourHote, injecter, viderCache, normaliserHote, compterInstallation, lire, enregistrer, televerserIcone, retirerIcone, stockage, taillePng };