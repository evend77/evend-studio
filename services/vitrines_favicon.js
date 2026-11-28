// CHEMIN : services/vitrines_favicon.js
// e-Vend Studio — Add-on « Favicon personnalisé » des sites VITRINE (parallèle au MV et aux boutiques) :
//   1) remplace le favicon de la plateforme par celui du gestionnaire,
//   2) ajoute (si réglée) l'animation d'onglet : titre + favicon qui attirent le visiteur parti sur un autre onglet.
// SEULEMENT sur l'adresse d'un site dont le template est une vitrine. Tables propres : vitrine_favicon, vitrine_favicon_retours.
// Un site vitrine reçoit toujours le repère <!--bq-favicon--> : server.js n'applique alors pas l'injecteur du MV (pas de doublon).

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const V = require('./vitrines_addons');
const C = require('./vitrines_commun');
const { estVitrine } = require('./vitrines_templates');

const CODE_ADDON = 'favicon_vitrine';
const NOM = 'Favicon personnalisé';
const MIN = 192, MAX = 1024;
const REPERE = '<!--bq-favicon-->';
const DECLENCHEURS = ['inactif', 'toujours'];
const STYLES = ['clignotant', 'machine'];

let _pret = null;
function pret() {
  if (!_pret) {
    _pret = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS vitrine_favicon (
        gestionnaire_id INTEGER PRIMARY KEY,
        favicon_url TEXT,
        anim_actif BOOLEAN NOT NULL DEFAULT false,
        anim_declencheur TEXT NOT NULL DEFAULT 'inactif',
        anim_style TEXT NOT NULL DEFAULT 'clignotant',
        anim_emoji TEXT,
        anim_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query(`CREATE TABLE IF NOT EXISTS vitrine_favicon_retours (
        id SERIAL PRIMARY KEY,
        gestionnaire_id INTEGER NOT NULL,
        cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query('CREATE INDEX IF NOT EXISTS idx_vitrine_favicon_retours ON vitrine_favicon_retours (gestionnaire_id, cree_le)');
    })().catch((e) => { _pret = null; throw e; });
  }
  return _pret;
}

const messagesValides = (m) => (Array.isArray(m) ? m.filter((x) => typeof x === 'string' && x.trim()).slice(0, 5) : []);

// → null (pas un site vitrine) ou { gid, favicon (url|null), anim ({d,s,e,m}|null) }
const memo = C.memoParHote('vitrines_favicon', async (hote) => {
  const site = await C.siteDeLHote(hote);
  if (!site || !estVitrine(site.template_id)) return null;
  const v = { gid: site.gid, favicon: null, anim: null };
  if (['suspendu', 'banni'].includes(site.statut) || !(await V.actif(site.gid, CODE_ADDON))) return v;
  await pret();
  const f = (await pool.query('SELECT * FROM vitrine_favicon WHERE gestionnaire_id = $1', [site.gid])).rows[0] || {};
  const messages = messagesValides(f.anim_messages);
  v.favicon = f.favicon_url || null;
  v.anim = f.anim_actif && messages.length ? {
    d: DECLENCHEURS.includes(f.anim_declencheur) ? f.anim_declencheur : 'inactif',
    s: STYLES.includes(f.anim_style) ? f.anim_style : 'clignotant',
    e: f.anim_emoji || '',
    m: messages,
  } : null;
  return v;
});
const pourHote = (h) => memo.lire(h);
const viderCache = () => memo.vider();

// ── Script d'animation (tourne dans le navigateur du visiteur) : C = { d: déclencheur, s: style, e: émoji, m: messages }
const SCRIPT_ANIM = `(function(C){
if(!C||!C.m||!C.m.length)return;
try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;}catch(x){}
var timer=null,actif=false,orig='',tick=0,idx=0,debut=0,favs=[],emojiUrl=null,cree=null;
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
function texte(i){return String(C.m[i%C.m.length]);}
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
    try{navigator.sendBeacon('/api/vitrines-favicon/retour',new Blob(['{}'],{type:'application/json'}));}catch(e){}
  }
}
if(C.d==='toujours'){
  window.addEventListener('load',demarrer);
}else{
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){
      demarrer();
    }else{arreter(true);}
  });
}
})`;

// Appelé par server.js pour chaque page HTML : ne touche que les sites vitrine.
async function injecter(html, hote) {
  const p = await pourHote(hote);
  if (!p || !/<\/head>/i.test(html)) return html;
  let ajout = REPERE + '\n';
  if (p.favicon) {
    html = html
      .replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi, '')
      .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '');
    ajout += `<link rel="icon" type="image/png" href="${C.esc(p.favicon)}">\n<link rel="apple-touch-icon" href="${C.esc(p.favicon)}">\n`;
  }
  if (p.anim) ajout += `<script>${SCRIPT_ANIM}(${C.jsonSur(p.anim)});</script>\n`;
  return html.replace(/<\/head>/i, () => ajout + '</head>');
}

// ── Gestionnaire ──
async function lire(gid) {
  const addon_actif = await V.actif(gid, CODE_ADDON);
  await pret();
  const f = (await pool.query('SELECT * FROM vitrine_favicon WHERE gestionnaire_id = $1', [gid])).rows[0] || {};
  const d = (await pool.query(`
    SELECT date_trunc('day',   NOW() AT TIME ZONE '${C.FUSEAU}') AT TIME ZONE '${C.FUSEAU}' AS jour,
           date_trunc('week',  NOW() AT TIME ZONE '${C.FUSEAU}') AT TIME ZONE '${C.FUSEAU}' AS semaine,
           date_trunc('month', NOW() AT TIME ZONE '${C.FUSEAU}') AT TIME ZONE '${C.FUSEAU}' AS mois`)).rows[0];
  const st = (await pool.query(`
    SELECT COUNT(*) FILTER (WHERE cree_le >= $2)::int AS jour,
           COUNT(*) FILTER (WHERE cree_le >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE cree_le >= $4)::int AS mois,
           COUNT(*)::int AS total
    FROM vitrine_favicon_retours WHERE gestionnaire_id = $1`, [gid, d.jour, d.semaine, d.mois])).rows[0];
  return {
    favicon_url: f.favicon_url || null, min: MIN, max: MAX, addon_actif,
    animation: {
      actif: !!f.anim_actif, declencheur: f.anim_declencheur || 'inactif', style: f.anim_style || 'clignotant',
      emoji: f.anim_emoji || '', messages: Array.isArray(f.anim_messages) ? f.anim_messages : [],
    },
    retours: st,
  };
}

async function enregistrerAnimation(gid, b) {
  await C.exigerAddon(gid, CODE_ADDON, NOM);
  await pret();
  b = b && typeof b === 'object' && !Array.isArray(b) ? b : {};
  const actif = b.actif === true;
  const declencheur = String(b.declencheur || ''), style = String(b.style || '');
  if (!DECLENCHEURS.includes(declencheur)) throw new V.ErreurAddon('Déclencheur invalide.');
  if (!STYLES.includes(style)) throw new V.ErreurAddon("Style d'animation invalide.");
  const emoji = String(b.emoji || '').replace(C.CTRL, '').replace(/["'\\`]/g, '').trim();
  if ([...emoji].length > 4) throw new V.ErreurAddon("L'émoji doit tenir en 1 à 4 caractères (ex. ✨).");
  const messages = (Array.isArray(b.messages) ? b.messages : []).map((m) => (typeof m === 'string' ? m.replace(C.CTRL, '').trim().slice(0, 60) : '')).filter(Boolean).slice(0, 5);
  if (actif && !messages.length) throw new V.ErreurAddon("Écrivez au moins un message pour activer l'animation.");
  await pool.query(
    `INSERT INTO vitrine_favicon (gestionnaire_id, anim_actif, anim_declencheur, anim_style, anim_emoji, anim_messages, updated_at)
     VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET anim_actif = EXCLUDED.anim_actif, anim_declencheur = EXCLUDED.anim_declencheur,
       anim_style = EXCLUDED.anim_style, anim_emoji = EXCLUDED.anim_emoji, anim_messages = EXCLUDED.anim_messages, updated_at = NOW()`,
    [gid, actif, declencheur, style, emoji, JSON.stringify(messages)]);
  viderCache();
}

const urlActuelle = async (gid) => ((await pool.query('SELECT favicon_url FROM vitrine_favicon WHERE gestionnaire_id = $1', [gid])).rows[0] || {}).favicon_url;

async function televerser(gid, buffer) {
  await C.exigerAddon(gid, CODE_ADDON, NOM);
  await pret();
  const t = C.taillePng(buffer);
  if (!t) throw new V.ErreurAddon('Format non accepté : le favicon doit être une image PNG.');
  if (t.w !== t.h) throw new V.ErreurAddon(`Le favicon doit être carré (le vôtre fait ${t.w} x ${t.h}).`);
  if (t.w < MIN) throw new V.ErreurAddon(`Le favicon est trop petit (${t.w} x ${t.h}). Minimum : ${MIN} x ${MIN}.`);
  if (t.w > MAX) throw new V.ErreurAddon(`Le favicon est trop grand (${t.w} x ${t.h}). Maximum : ${MAX} x ${MAX}.`);
  const avant = await urlActuelle(gid);
  const cle = `vitrine/favicon/${gid}/${crypto.randomBytes(16).toString('hex')}.png`;
  await C.stockage.put(cle, buffer);
  const url = `${C.MEDIA_URL}/${cle}`;
  await pool.query(`INSERT INTO vitrine_favicon (gestionnaire_id, favicon_url, updated_at) VALUES ($1, $2, NOW())
                    ON CONFLICT (gestionnaire_id) DO UPDATE SET favicon_url = EXCLUDED.favicon_url, updated_at = NOW()`, [gid, url]);
  viderCache();
  await C.supprimerAncien('favicon', gid, avant);
  return url;
}

// Retirer est toujours permis (même si l'add-on a été désactivé)
async function retirer(gid) {
  await pret();
  const avant = await urlActuelle(gid);
  await pool.query('UPDATE vitrine_favicon SET favicon_url = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [gid]);
  viderCache();
  await C.supprimerAncien('favicon', gid, avant);
}

// Retour d'un visiteur sur l'onglet (public) : le site vient du domaine visité, jamais d'un champ du navigateur
async function compterRetour(hote) {
  const p = await pourHote(hote);
  if (!p || !p.anim) return false;
  await pool.query('INSERT INTO vitrine_favicon_retours (gestionnaire_id) VALUES ($1)', [p.gid]);
  return true;
}

module.exports = { CODE_ADDON, REPERE, MIN, MAX, SCRIPT_ANIM, pret, pourHote, injecter, viderCache, lire, enregistrerAnimation, televerser, retirer, compterRetour };