// CHEMIN : services/studio_favicon_boutique.js
// e-Vend Studio — Add-on « Favicon personnalisé » :
//   1) remplace le favicon de la plateforme par celui du gestionnaire,
//   2) ajoute (si le gestionnaire l'a réglée) l'animation d'onglet : titre + favicon qui attirent le client qui a changé d'onglet.
// SEULEMENT sur l'adresse d'une boutique (sous-domaine *.e-vendstudio.ca ou domaine personnalisé).
// e-vendstudio.ca et www.e-vendstudio.ca ne sont jamais touchés.

'use strict';

const pool = require('../db');
const addons = require('./studio_addons');

const CODE_ADDON = 'favicon_boutique';
const DOMAINE_PRINCIPAL = 'e-vendstudio.ca';
const DUREE_CACHE = 60 * 1000;
const cache = new Map();
function viderCache() { cache.clear(); }

const DECLENCHEURS = ['inactif', 'panier', 'toujours'];
const STYLES = ['clignotant', 'machine'];

const normaliserHote = (h) => String(h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '');

async function chercher(hote) {
  if (!hote || hote === DOMAINE_PRINCIPAL || hote === 'www.' + DOMAINE_PRINCIPAL || hote === 'localhost') return null;
  const SELECT = `
    SELECT g.id AS gid, g.statut, f.favicon_url, f.anim_actif, f.anim_declencheur, f.anim_style, f.anim_emoji, f.anim_messages
    FROM sites s
    JOIN gestionnaires g ON g.id = s.gestionnaire_id
    JOIN gestionnaire_favicon f ON f.gestionnaire_id = g.id
    WHERE (f.favicon_url IS NOT NULL OR f.anim_actif) AND `;
  if (hote.endsWith('.' + DOMAINE_PRINCIPAL)) {
    const etiquette = hote.slice(0, -(DOMAINE_PRINCIPAL.length + 1));
    if (!etiquette || etiquette.includes('.')) return null;
    return (await pool.query(SELECT + 's.sous_domaine = $1 LIMIT 1', [etiquette])).rows[0] || null;
  }
  const sansWww = hote.replace(/^www\./, '');
  return (await pool.query(SELECT + 's.domaine_perso = ANY($1::text[]) LIMIT 1', [[hote, sansWww, 'www.' + sansWww]])).rows[0] || null;
}

// → { gid, favicon (url|null), anim ({d,s,e,m}|null) } ou null (add-on inactif, rien de réglé, suspendue, domaine inconnu)
async function pourHote(hoteBrut) {
  const hote = normaliserHote(hoteBrut);
  const memo = cache.get(hote);
  if (memo && Date.now() - memo.t < DUREE_CACHE) return memo.v;
  let v = null;
  try {
    const row = await chercher(hote);
    if (row && !['suspendu', 'banni'].includes(row.statut) && await addons.addonActifRapide(row.gid, CODE_ADDON, pool)) {
      const messages = Array.isArray(row.anim_messages) ? row.anim_messages.filter((x) => typeof x === 'string' && x.trim()).slice(0, 5) : [];
      v = {
        gid: row.gid,
        favicon: row.favicon_url || null,
        anim: row.anim_actif && messages.length ? {
          d: DECLENCHEURS.includes(row.anim_declencheur) ? row.anim_declencheur : 'inactif',
          s: STYLES.includes(row.anim_style) ? row.anim_style : 'clignotant',
          e: row.anim_emoji || '',
          m: messages,
        } : null,
      };
      if (!v.favicon && !v.anim) v = null;
    }
  } catch (e) {
    console.warn('[favicon_boutique] résolution', e.message);
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
//   {n} dans un message = nombre d'articles dans le panier du client connecté.
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
    try{navigator.sendBeacon('/api/favicon-boutique/retour',new Blob([JSON.stringify({panier:n>0})],{type:'application/json'}));}catch(e){}
  }
}
function voirPanier(cb){
  var utile=C.d==='panier'||C.m.some(function(m){return /\\{n\\}/.test(m);});
  if(!utile){cb();return;}
  try{
    fetch('/api/marketplace/'+C.g+'/panier',{credentials:'include'}).then(function(r){return r.ok?r.json():null;}).then(function(d){
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

async function injecter(html, hote) {
  const p = await pourHote(hote);
  if (!p || !/<\/head>/i.test(html)) return html;
  let ajout = '';
  if (p.favicon) {
    html = html
      .replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi, '')
      .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '');
    ajout += balisesFavicon(p.favicon) + '\n';
  }
  if (p.anim) ajout += `<script>${SCRIPT_ANIM}(${jsonSur({ g: p.gid, d: p.anim.d, s: p.anim.s, e: p.anim.e, m: p.anim.m })});</script>\n`;
  return html.replace(/<\/head>/i, () => ajout + '</head>');
}

module.exports = { CODE_ADDON, DECLENCHEURS, STYLES, pourHote, injecter, viderCache, normaliserHote, SCRIPT_ANIM };