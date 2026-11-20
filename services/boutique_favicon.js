// CHEMIN : services/boutique_favicon.js
// e-Vend Studio — Add-on « Favicon personnalisé » des templates boutique (solo) :
//   1) remplace le favicon de la plateforme par celui du gestionnaire,
//   2) ajoute (si le gestionnaire l'a réglée) l'animation d'onglet : titre + favicon qui attirent le client qui a changé d'onglet.
// SEULEMENT sur l'adresse d'une boutique SOLO (sous-domaine *.e-vendstudio.ca ou domaine personnalisé dont le template est boutique-*).
// Réglages dans gestionnaire_favicon et compteur dans favicon_retours (mêmes tables que le MV : un gestionnaire n'a qu'un seul site).
// Accès : add-on « favicon_boutique » acheté et activé (A.addonActif). Aucun lien de code avec le MV.
// Une boutique solo reçoit toujours le repère <!--bq-favicon--> : server.js n'applique alors PAS l'injecteur du MV (pas de doublon, pas de contournement).

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'favicon_boutique';
const DOMAINE_PRINCIPAL = 'e-vendstudio.ca';
const DUREE_CACHE = 60 * 1000;
const MIN = 192, MAX = 1024, MAX_OCTETS = 2 * 1024 * 1024;
const MEDIA_URL = 'https://media.e-vend.ca';
const FUSEAU = 'America/Toronto';
const REPERE = '<!--bq-favicon-->';
const CTRL = /[\u0000-\u001f\u007f<>]/g;

const cache = new Map();
function viderCache() { cache.clear(); }

const DECLENCHEURS = ['inactif', 'panier', 'toujours'];
const STYLES = ['clignotant', 'machine'];
const normaliserHote = (h) => String(h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '');
const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

// ─── Résolution du domaine → boutique solo ───────────────────────────────────
async function chercher(hote) {
  if (!hote || hote === DOMAINE_PRINCIPAL || hote === 'www.' + DOMAINE_PRINCIPAL || hote === 'localhost') return null;
  const SELECT = `
    SELECT g.id AS gid, g.statut, s.template_id, f.favicon_url, f.anim_actif, f.anim_declencheur, f.anim_style, f.anim_emoji, f.anim_messages
    FROM sites s
    JOIN gestionnaires g ON g.id = s.gestionnaire_id
    LEFT JOIN gestionnaire_favicon f ON f.gestionnaire_id = g.id
    WHERE `;
  if (hote.endsWith('.' + DOMAINE_PRINCIPAL)) {
    const etiquette = hote.slice(0, -(DOMAINE_PRINCIPAL.length + 1));
    if (!etiquette || etiquette.includes('.')) return null;
    return (await pool.query(SELECT + 's.sous_domaine = $1 LIMIT 1', [etiquette])).rows[0] || null;
  }
  const sansWww = hote.replace(/^www\./, '');
  return (await pool.query(SELECT + 's.domaine_perso = ANY($1::text[]) LIMIT 1', [[hote, sansWww, 'www.' + sansWww]])).rows[0] || null;
}

// → null (pas une boutique solo / domaine inconnu) ou { gid, favicon (url|null), anim ({d,s,e,m}|null) } ; favicon et anim sont vides si l'add-on est inactif, rien de réglé ou boutique suspendue.
async function pourHote(hoteBrut) {
  const hote = normaliserHote(hoteBrut);
  const memo = cache.get(hote);
  if (memo && Date.now() - memo.t < DUREE_CACHE) return memo.v;
  let v = null;
  try {
    const row = await chercher(hote);
    if (row && A.estTemplateSolo(row.template_id)) {
      v = { gid: row.gid, favicon: null, anim: null };
      if (!['suspendu', 'banni'].includes(row.statut) && await autorise(row.gid)) {
        const messages = Array.isArray(row.anim_messages) ? row.anim_messages.filter((x) => typeof x === 'string' && x.trim()).slice(0, 5) : [];
        v.favicon = row.favicon_url || null;
        v.anim = row.anim_actif && messages.length ? {
          d: DECLENCHEURS.includes(row.anim_declencheur) ? row.anim_declencheur : 'inactif',
          s: STYLES.includes(row.anim_style) ? row.anim_style : 'clignotant',
          e: row.anim_emoji || '',
          m: messages,
        } : null;
      }
    }
  } catch (e) {
    console.warn('[boutique_favicon] résolution', e.message);
    return null;
  }
  if (cache.size > 500) cache.clear();
  cache.set(hote, { t: Date.now(), v });
  return v;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonSur = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// ── Script d'animation (tourne dans le navigateur du visiteur ; le serveur ne fait rien de plus) ──
//   C = { g: id boutique, d: déclencheur, s: style, e: émoji, m: messages }
//   {n} dans un message = nombre d'articles dans le panier du client connecté (/api/boutique/acheteur/<g>/panier).
const SCRIPT_ANIM = `(function(C){
if(!C||!C.m||!C.m.length)return;
try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;}catch(x){}
var timer=null,actif=false,orig='',tick=0,idx=0,debut=0,n=0,favs=[],emojiUrl=null,cree=null;
function iconLinks(){return [].slice.call(document.querySelectorAll('link[rel~="icon"]'));}
function emoji(){
  if(emojiUrl||!C.e)return emojiUrl;
  try{var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');x.font='52px serif';x.textAlign='center';x.textBaseline='middle';x.fillText(C.e,32,36);emojiUrl=c.toDataURL('image/png');}catch(e){}
  return emojiUrl;
}
function sauverFavs(){
  favs=iconLinks().map(function(el){return {el:el,href:el.getAttribute('href')};});
  if(!favs.length){cree=document.createElement('link');cree.rel='icon';document.head.appendChild(cree);favs=[{el:cree,href:''}];}
}
function setFav(alt){
  var u=emoji();
  favs.forEach(function(f){
    if(alt&&u){f.el.removeAttribute('type');f.el.setAttribute('href',u);}
    else if(f.href!==null){f.el.setAttribute('href',f.href);}
  });
}
function texte(i){return String(C.m[i%C.m.length]).replace(/\\{n\\}/g,String(n));}
function etape(){
  tick++;
  if(C.s==='machine'){
    var t=texte(idx),L=t.length;
    var pos=tick<=L?tick:L;
    document.title=(t.slice(0,pos)||'\\u00a0')+(tick<=L?'|':'');
    setFav(Math.floor(tick/7)%2===1);
    if(tick>L+14){tick=0;idx++;}
  }else{
    var on=tick%2===1;
    document.title=on?texte(idx):orig;
    setFav(on);
    if(!on)idx++;
  }
}
function demarrer(){
  if(actif)return;
  actif=true;orig=document.title;tick=0;idx=0;debut=Date.now();
  sauverFavs();
  etape();
  timer=setInterval(etape,C.s==='machine'?140:1000);
}
function arreter(compter){
  if(!actif)return;
  clearInterval(timer);actif=false;
  document.title=orig;
  favs.forEach(function(f){if(f.href!==null)f.el.setAttribute('href',f.href);});
  if(cree){cree.parentNode&&cree.parentNode.removeChild(cree);cree=null;}
  if(compter&&Date.now()-debut>2000){
    try{navigator.sendBeacon('/api/boutique/favicon/retour',new Blob([JSON.stringify({panier:n>0})],{type:'application/json'}));}catch(e){}
  }
}
function voirPanier(cb){
  var utile=C.d==='panier'||C.m.some(function(m){return /\\{n\\}/.test(m);});
  if(!utile){cb();return;}
  try{
    var h={};try{var tk=localStorage.getItem('mv_token_'+C.g);if(tk)h.Authorization='Bearer '+tk;}catch(x){}
    fetch('/api/boutique/acheteur/'+C.g+'/panier',{credentials:'include',headers:h}).then(function(r){return r.ok?r.json():null;}).then(function(d){
      var a=d&&d.articles;n=0;
      if(Array.isArray(a)){a.forEach(function(l){var q=parseInt(l&&l.quantite,10);n+=q>0?q:1;});}
      cb();
    }).catch(function(){n=0;cb();});
  }catch(e){n=0;cb();}
}
if(C.d==='toujours'){
  window.addEventListener('load',function(){voirPanier(demarrer);});
}else{
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      voirPanier(function(){
        if(!document.hidden)return;
        if(C.d==='panier'&&n<1)return;
        demarrer();
      });
    }else{arreter(true);}
  });
}
})`;

function balisesFavicon(url) {
  return `<link rel="icon" type="image/png" href="${esc(url)}">\n<link rel="apple-touch-icon" href="${esc(url)}">`;
}

// Appelé par server.js pour chaque page HTML : ne touche que les boutiques solo.
async function injecter(html, hote) {
  const p = await pourHote(hote);
  if (!p || !/<\/head>/i.test(html)) return html;
  let ajout = REPERE + '\n';
  if (p.favicon) {
    html = html
      .replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi, '')
      .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '');
    ajout += balisesFavicon(p.favicon) + '\n';
  }
  if (p.anim) ajout += `<script>${SCRIPT_ANIM}(${jsonSur({ g: p.gid, d: p.anim.d, s: p.anim.s, e: p.anim.e, m: p.anim.m })});</script>\n`;
  return html.replace(/<\/head>/i, () => ajout + '</head>');
}

// ─── Gestionnaire ─────────────────────────────────────────────────────────────
function taillePng(b) {
  if (!Buffer.isBuffer(b) || b.length < 33) return null;
  if (b.readUInt32BE(0) !== 0x89504e47 || b.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

async function lire(gid, db) {
  const c = db || pool;
  const f = (await c.query(`SELECT favicon_url, anim_actif, anim_declencheur, anim_style, anim_emoji, anim_messages FROM gestionnaire_favicon WHERE gestionnaire_id = $1`, [gid])).rows[0] || {};
  const d = (await c.query(`
    SELECT date_trunc('day',   NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS jour,
           date_trunc('week',  NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS semaine,
           date_trunc('month', NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS mois`)).rows[0];
  const st = (await c.query(`
    SELECT COUNT(*) FILTER (WHERE cree_le >= $2)::int AS jour, COUNT(*) FILTER (WHERE cree_le >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE cree_le >= $4)::int AS mois, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE avec_panier)::int AS total_avec_panier
    FROM favicon_retours WHERE gestionnaire_id = $1`, [gid, d.jour, d.semaine, d.mois])).rows[0];
  return {
    favicon_url: f.favicon_url || null, min: MIN, max: MAX, addon_actif: await autorise(gid, c),
    animation: {
      actif: !!f.anim_actif, declencheur: f.anim_declencheur || 'inactif', style: f.anim_style || 'clignotant',
      emoji: f.anim_emoji || '', messages: Array.isArray(f.anim_messages) ? f.anim_messages : [],
    },
    retours: st,
  };
}

async function exigerAddon(gid, db) {
  if (!(await autorise(gid, db))) throw new ErreurBoutique("L'option « Favicon personnalisé » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
}

async function enregistrerAnimation(gid, b, db) {
  await exigerAddon(gid, db);
  b = b && typeof b === 'object' && !Array.isArray(b) ? b : {};
  const actif = b.actif === true;
  const declencheur = String(b.declencheur || ''), style = String(b.style || '');
  if (!DECLENCHEURS.includes(declencheur)) throw new ErreurBoutique('Déclencheur invalide.', 400);
  if (!STYLES.includes(style)) throw new ErreurBoutique("Style d'animation invalide.", 400);
  const emoji = String(b.emoji || '').replace(CTRL, '').replace(/["'\\`]/g, '').trim();
  if ([...emoji].length > 4) throw new ErreurBoutique("L'émoji doit tenir en 1 à 4 caractères (ex. ✨ ou 🛒).", 400);
  const messages = (Array.isArray(b.messages) ? b.messages : []).map((m) => (typeof m === 'string' ? m.replace(CTRL, '').trim().slice(0, 60) : '')).filter(Boolean).slice(0, 5);
  if (actif && !messages.length) throw new ErreurBoutique("Écrivez au moins un message pour activer l'animation.", 400);
  await (db || pool).query(
    `INSERT INTO gestionnaire_favicon (gestionnaire_id, anim_actif, anim_declencheur, anim_style, anim_emoji, anim_messages, updated_at)
     VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET anim_actif = EXCLUDED.anim_actif, anim_declencheur = EXCLUDED.anim_declencheur,
       anim_style = EXCLUDED.anim_style, anim_emoji = EXCLUDED.anim_emoji, anim_messages = EXCLUDED.anim_messages, updated_at = NOW()`,
    [gid, actif, declencheur, style, emoji, JSON.stringify(messages)]);
  viderCache();
}

// Stockage R2 (remplaçable dans les tests)
let s3 = null;
const stockage = {
  async put(cle, buffer) {
    if (!process.env.R2_BUCKET_PRODUITS || !process.env.R2_ENDPOINT) throw new ErreurBoutique("L'envoi d'images n'est pas disponible pour le moment.", 503);
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    s3 = s3 || new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
    await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buffer, ContentType: 'image/png' }));
  },
  async del(cle) {
    if (!process.env.R2_BUCKET_PRODUITS || !process.env.R2_ENDPOINT) return;
    const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    s3 = s3 || new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle }));
  },
};
const cleDe = (gid, url) => {
  const pre = `${MEDIA_URL}/boutique/favicon/${gid}/`;
  return typeof url === 'string' && url.startsWith(pre) ? url.slice(MEDIA_URL.length + 1) : null;   // seulement NOS fichiers
};
async function supprimerAncien(gid, url) { const k = cleDe(gid, url); if (k) { try { await stockage.del(k); } catch (e) { console.warn('[boutique_favicon] suppression R2', e.message); } } }

async function televerser(gid, buffer, db) {
  await exigerAddon(gid, db);
  const t = taillePng(buffer);
  if (!t) throw new ErreurBoutique('Format non accepté : le favicon doit être une image PNG.', 400);
  if (t.w !== t.h) throw new ErreurBoutique(`Le favicon doit être carré (le vôtre fait ${t.w} x ${t.h}).`, 400);
  if (t.w < MIN) throw new ErreurBoutique(`Le favicon est trop petit (${t.w} x ${t.h}). Minimum : ${MIN} x ${MIN}.`, 400);
  if (t.w > MAX) throw new ErreurBoutique(`Le favicon est trop grand (${t.w} x ${t.h}). Maximum : ${MAX} x ${MAX}.`, 400);
  const c = db || pool;
  const avant = (await c.query('SELECT favicon_url FROM gestionnaire_favicon WHERE gestionnaire_id = $1', [gid])).rows[0];
  const cle = `boutique/favicon/${gid}/${crypto.randomBytes(16).toString('hex')}.png`;
  await stockage.put(cle, buffer);
  const url = `${MEDIA_URL}/${cle}`;
  await c.query(`INSERT INTO gestionnaire_favicon (gestionnaire_id, favicon_url, updated_at) VALUES ($1, $2, NOW())
                 ON CONFLICT (gestionnaire_id) DO UPDATE SET favicon_url = EXCLUDED.favicon_url, updated_at = NOW()`, [gid, url]);
  viderCache();
  if (avant) await supprimerAncien(gid, avant.favicon_url);
  return url;
}

// Retirer est toujours permis (même si l'add-on a été retiré)
async function retirer(gid, db) {
  const c = db || pool;
  const avant = (await c.query('SELECT favicon_url FROM gestionnaire_favicon WHERE gestionnaire_id = $1', [gid])).rows[0];
  await c.query('UPDATE gestionnaire_favicon SET favicon_url = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [gid]);
  viderCache();
  if (avant) await supprimerAncien(gid, avant.favicon_url);
}

// Retour d'un client sur l'onglet (public) : la boutique vient du domaine visité, jamais d'un champ du navigateur
async function compterRetour(hote, avecPanier, db) {
  const p = await pourHote(hote);
  if (!p || !p.anim) return false;
  await (db || pool).query('INSERT INTO favicon_retours (gestionnaire_id, avec_panier) VALUES ($1, $2)', [p.gid, !!avecPanier]);
  return true;
}

module.exports = { CODE_ADDON, DECLENCHEURS, STYLES, MIN, MAX, MAX_OCTETS, REPERE, pourHote, injecter, viderCache, normaliserHote, SCRIPT_ANIM, lire, enregistrerAnimation, televerser, retirer, compterRetour, stockage, taillePng };