// CHEMIN : services/vitrines_pwa.js
// e-Vend Studio — Add-on « App installable (PWA) » des sites VITRINE (parallèle au MV et aux boutiques).
// Nom, couleurs, icône, manifest, installations. Tables propres : vitrine_pwa_config, vitrine_pwa_installations.
// Service worker : /pwa-boutique-sw.js (générique, aucun cache). Un site vitrine reçoit toujours le repère <!--bq-pwa--> :
// server.js n'applique alors pas l'injecteur du MV.

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const V = require('./vitrines_addons');
const C = require('./vitrines_commun');
const { estVitrine } = require('./vitrines_templates');

const CODE_ADDON = 'pwa_vitrine';
const NOM = 'App installable (PWA)';
const THEME_DEFAUT = '#2d6a9f';
const FOND_DEFAUT = '#ffffff';
const COULEUR_RE = /^#[0-9a-fA-F]{6}$/;
const MIN = 512, MAX = 2048;
const REPERE = '<!--bq-pwa-->';

let _pret = null;
function pret() {
  if (!_pret) {
    _pret = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS vitrine_pwa_config (
        gestionnaire_id INTEGER PRIMARY KEY,
        nom_app TEXT,
        nom_court TEXT,
        couleur_theme TEXT,
        couleur_fond TEXT,
        icone_url TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS vitrine_pwa_installations (
        id SERIAL PRIMARY KEY,
        gestionnaire_id INTEGER NOT NULL,
        device_id TEXT NOT NULL,
        plateforme TEXT,
        user_agent TEXT,
        installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query('CREATE INDEX IF NOT EXISTS idx_vitrine_pwa_installations ON vitrine_pwa_installations (gestionnaire_id, installed_at)');
    })().catch((e) => { _pret = null; throw e; });
  }
  return _pret;
}

// → null (pas un site vitrine) ou { gid, pwa } ; pwa = { nom, nomCourt, theme, fond, icone } ou null
const memo = C.memoParHote('vitrines_pwa', async (hote) => {
  const site = await C.siteDeLHote(hote);
  if (!site || !estVitrine(site.template_id)) return null;
  const v = { gid: site.gid, pwa: null };
  if (['suspendu', 'banni'].includes(site.statut) || !(await V.actif(site.gid, CODE_ADDON))) return v;
  await pret();
  const c = (await pool.query('SELECT * FROM vitrine_pwa_config WHERE gestionnaire_id = $1', [site.gid])).rows[0];
  if (!c || !c.icone_url) return v;
  const nom = String(c.nom_app || site.nom_boutique || 'Mon site').trim().slice(0, 45) || 'Mon site';
  v.pwa = {
    nom,
    nomCourt: String(c.nom_court || nom).trim().slice(0, 12) || nom.slice(0, 12),
    theme: COULEUR_RE.test(c.couleur_theme || '') ? c.couleur_theme : THEME_DEFAUT,
    fond: COULEUR_RE.test(c.couleur_fond || '') ? c.couleur_fond : FOND_DEFAUT,
    icone: c.icone_url,
  };
  return v;
});
const pourHote = (h) => memo.lire(h);
const viderCache = () => memo.vider();

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

// Script placé dans <head> : garde l'invitation d'installation, enregistre le service worker, compte l'installation.
function scriptInstall(p) {
  return `(function(){
window.__pwaVitrine=${C.jsonSur({ nom: p.nom, theme: p.theme })};
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallEvent=e;});
window.addEventListener('appinstalled',function(){
  try{
    var id=null;try{id=localStorage.getItem('pwa_device_id');}catch(x){}
    if(!id){id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(16).slice(2,10);try{localStorage.setItem('pwa_device_id',id);}catch(x){}}
    var ua=navigator.userAgent||'';var pl=/android/i.test(ua)?'android':(/iphone|ipad|ipod/i.test(ua)?'ios':'desktop');
    fetch('/api/vitrines-pwa/installation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({device_id:id,plateforme:pl}),keepalive:true}).catch(function(){});
  }catch(x){}
});
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/pwa-boutique-sw.js').catch(function(){});});}
})();`;
}

function balisesHtml(p) {
  return [
    '<link rel="manifest" href="/api/vitrines-pwa/manifest.webmanifest">',
    `<meta name="theme-color" content="${C.esc(p.theme)}">`,
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    `<meta name="apple-mobile-web-app-title" content="${C.esc(p.nomCourt)}">`,
    `<link rel="apple-touch-icon" href="${C.esc(p.icone)}">`,
    `<script>${scriptInstall(p)}</script>`,
  ].join('\n');
}

// Appelé par server.js pour chaque page HTML : ne touche que les sites vitrine.
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

// ── Public ──
async function manifestPourHote(hote) { const r = await pourHote(hote); return r && r.pwa ? manifestPour(r.pwa) : null; }

// → 'cree' | 'doublon' | 'invalide' | 'aucune'
async function compterInstallation(hote, deviceId, plateforme, userAgent) {
  if (typeof deviceId !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(deviceId)) return 'invalide';
  const r = await pourHote(hote);
  if (!r || !r.pwa) return 'aucune';
  const plat = ['android', 'ios', 'desktop'].includes(plateforme) ? plateforme : null;
  const deja = await pool.query(`SELECT 1 FROM vitrine_pwa_installations WHERE gestionnaire_id = $1 AND device_id = $2 AND installed_at > NOW() - INTERVAL '1 minute' LIMIT 1`, [r.gid, deviceId]);
  if (deja.rows.length) return 'doublon';
  await pool.query('INSERT INTO vitrine_pwa_installations (gestionnaire_id, device_id, plateforme, user_agent) VALUES ($1, $2, $3, $4)', [r.gid, deviceId, plat, String(userAgent || '').slice(0, 300)]);
  return 'cree';
}

// ── Gestionnaire ──
async function statistiques(gid) {
  const d = (await pool.query(`
    SELECT date_trunc('day',   NOW() AT TIME ZONE '${C.FUSEAU}') AT TIME ZONE '${C.FUSEAU}' AS jour,
           date_trunc('week',  NOW() AT TIME ZONE '${C.FUSEAU}') AT TIME ZONE '${C.FUSEAU}' AS semaine,
           date_trunc('month', NOW() AT TIME ZONE '${C.FUSEAU}') AT TIME ZONE '${C.FUSEAU}' AS mois,
           date_trunc('year',  NOW() AT TIME ZONE '${C.FUSEAU}') AT TIME ZONE '${C.FUSEAU}' AS annee`)).rows[0];
  const params = [gid, d.jour, d.semaine, d.mois, d.annee];
  const inst = (await pool.query(`
    SELECT COUNT(*) FILTER (WHERE installed_at >= $2)::int AS jour, COUNT(*) FILTER (WHERE installed_at >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE installed_at >= $4)::int AS mois, COUNT(*) FILTER (WHERE installed_at >= $5)::int AS annee, COUNT(*)::int AS total
    FROM vitrine_pwa_installations WHERE gestionnaire_id = $1`, params)).rows[0];
  // « appareils » = première installation de chaque appareil (une réinstallation ne compte pas)
  const app = (await pool.query(`
    WITH premiere AS (SELECT device_id, MIN(installed_at) AS p FROM vitrine_pwa_installations WHERE gestionnaire_id = $1 GROUP BY device_id)
    SELECT COUNT(*) FILTER (WHERE p >= $2)::int AS jour, COUNT(*) FILTER (WHERE p >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE p >= $4)::int AS mois, COUNT(*) FILTER (WHERE p >= $5)::int AS annee, COUNT(*)::int AS total
    FROM premiere`, params)).rows[0];
  const plat = (await pool.query(`SELECT COALESCE(plateforme, 'autre') AS plateforme, COUNT(DISTINCT device_id)::int AS n FROM vitrine_pwa_installations WHERE gestionnaire_id = $1 GROUP BY 1`, [gid])).rows;
  return { appareils: app, installations: inst, plateformes: plat };
}

async function lire(gid) {
  const addon_actif = await V.actif(gid, CODE_ADDON);
  await pret();
  const r = (await pool.query(`SELECT g.nom_boutique, p.nom_app, p.nom_court, p.couleur_theme, p.couleur_fond, p.icone_url
                               FROM gestionnaires g LEFT JOIN vitrine_pwa_config p ON p.gestionnaire_id = g.id WHERE g.id = $1`, [gid])).rows[0] || {};
  return {
    nom_boutique: r.nom_boutique || '', nom_app: r.nom_app || '', nom_court: r.nom_court || '',
    couleur_theme: r.couleur_theme || THEME_DEFAUT, couleur_fond: r.couleur_fond || FOND_DEFAUT,
    icone_url: r.icone_url || null, active: !!r.icone_url, addon_actif, stats: await statistiques(gid),
  };
}

async function enregistrer(gid, b) {
  await C.exigerAddon(gid, CODE_ADDON, NOM);
  await pret();
  b = b && typeof b === 'object' && !Array.isArray(b) ? b : {};
  const nettoyer = (v, max) => (typeof v === 'string' ? v.replace(C.CTRL, '').trim().slice(0, max) : '');
  const nom = nettoyer(b.nom_app, 45), court = nettoyer(b.nom_court, 12);
  const theme = String(b.couleur_theme || '').trim(), fond = String(b.couleur_fond || '').trim();
  if (!COULEUR_RE.test(theme) || !COULEUR_RE.test(fond)) throw new V.ErreurAddon('Les couleurs doivent être au format #rrggbb (ex. #2d6a9f).');
  await pool.query(
    `INSERT INTO vitrine_pwa_config (gestionnaire_id, nom_app, nom_court, couleur_theme, couleur_fond, updated_at)
     VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET nom_app = EXCLUDED.nom_app, nom_court = EXCLUDED.nom_court,
       couleur_theme = EXCLUDED.couleur_theme, couleur_fond = EXCLUDED.couleur_fond, updated_at = NOW()`,
    [gid, nom, court, theme, fond]);
  viderCache();
}

const urlActuelle = async (gid) => ((await pool.query('SELECT icone_url FROM vitrine_pwa_config WHERE gestionnaire_id = $1', [gid])).rows[0] || {}).icone_url;

async function televerserIcone(gid, buffer) {
  await C.exigerAddon(gid, CODE_ADDON, NOM);
  await pret();
  const t = C.taillePng(buffer);
  if (!t) throw new V.ErreurAddon("Format non accepté : l'icône doit être une image PNG.");
  if (t.w !== t.h) throw new V.ErreurAddon(`L'icône doit être carrée (la vôtre fait ${t.w} x ${t.h}).`);
  if (t.w < MIN) throw new V.ErreurAddon(`L'icône est trop petite (${t.w} x ${t.h}). Minimum : ${MIN} x ${MIN}.`);
  if (t.w > MAX) throw new V.ErreurAddon(`L'icône est trop grande (${t.w} x ${t.h}). Maximum : ${MAX} x ${MAX}.`);
  const avant = await urlActuelle(gid);
  const cle = `vitrine/pwa/${gid}/${crypto.randomBytes(16).toString('hex')}.png`;
  await C.stockage.put(cle, buffer);
  const url = `${C.MEDIA_URL}/${cle}`;
  await pool.query(`INSERT INTO vitrine_pwa_config (gestionnaire_id, icone_url, updated_at) VALUES ($1, $2, NOW())
                    ON CONFLICT (gestionnaire_id) DO UPDATE SET icone_url = EXCLUDED.icone_url, updated_at = NOW()`, [gid, url]);
  viderCache();
  await C.supprimerAncien('pwa', gid, avant);
  return url;
}

// Retirer est toujours permis : la PWA se désactive
async function retirerIcone(gid) {
  await pret();
  const avant = await urlActuelle(gid);
  await pool.query('UPDATE vitrine_pwa_config SET icone_url = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [gid]);
  viderCache();
  await C.supprimerAncien('pwa', gid, avant);
}

module.exports = { CODE_ADDON, REPERE, pret, pourHote, injecter, viderCache, manifestPourHote, compterInstallation, lire, enregistrer, televerserIcone, retirerIcone };