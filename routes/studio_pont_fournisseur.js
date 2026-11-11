// CHEMIN : routes/studio_pont_fournisseur.js
// e-Vend Studio — « Pont » Studio → e-Vend : un collaborateur autorise e-Vend à LIRE ses annonces Studio (lecture seule).
// Monté dans routes/ebay_connexion.js sur /api/ebay-connexion/studio-pont  (adresse publique : https://e-vendstudio.ca/api/ebay-connexion/studio-pont/…)
//   Serveur à serveur (en-tête x-pont-secret = STUDIO_PONT_SECRET, ≥ 32 caractères, le MÊME sur e-Vend) :
//     POST /etat · POST /echange · GET /resume · GET /annonces · GET /expedition · POST /revoquer
//   Navigateur du collaborateur :
//     GET /autoriser?etat=…  (page : connexion Studio → choix de la boutique → Autoriser)  ·  POST /identifier  ·  POST /autoriser
// Sécurité : le mot de passe Studio n'est tapé QUE sur cette page (jamais chez e-Vend) ; états et codes à usage unique ; accès de 3 h en lecture seule,
// jeton gardé sous forme d'empreinte SHA-256 ; adresse de retour FIXE (variable EVEND_PONT_RETOUR) ; limite d'essais par adresse IP + blocage de compte habituel de Studio.

'use strict';

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { verifierCompteBloque, gererTentativeEchouee } = require('./authStudio');

const router = express.Router();
const RETOUR = () => process.env.EVEND_PONT_RETOUR || 'https://api.e-vend.ca/api/auth/studio-import/retour';
const JWT_SECRET = () => process.env.JWT_SECRET || '';
const ETAT_RE = /^[a-f0-9]{64}$/;
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const LOT_MAX = 50;
const TTL_JETON_S = 3 * 60 * 60;

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) { console.error('[studio-pont-fournisseur]', req.method, req.path, e && e.message); res.status(500).json({ error: 'Erreur serveur' }); }
};
const nombre = (v) => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const nettoyer = (s, max) => String(s === null || s === undefined ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const echapper = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function exigerSecret(req, res, next) {
  const attendu = process.env.STUDIO_PONT_SECRET || '';
  if (attendu.length < 32) return res.status(503).json({ error: 'Pont non configuré' });
  const recu = String(req.headers['x-pont-secret'] || '');
  if (!crypto.timingSafeEqual(Buffer.from(sha(recu)), Buffer.from(sha(attendu)))) return res.status(401).json({ error: 'Non autorisé' });
  next();
}
async function exigerJeton(req, res, next) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(String(req.headers.authorization || ''));
  if (!m) return res.status(401).json({ error: 'Accès refusé' });
  const r = await pool.query(
    `SELECT j.collaborateur_id, j.gestionnaire_id FROM pont_evend_jetons j JOIN marketplace_collaborateurs c ON c.id = j.collaborateur_id
      WHERE j.jeton_hash = $1 AND NOT j.revoque AND j.expire_le > NOW() AND c.statut = 'actif'`, [sha(m[1])]);
  if (!r.rows[0]) return res.status(401).json({ error: 'Accès refusé ou expiré' });
  req.pont = { cid: r.rows[0].collaborateur_id, gid: r.rows[0].gestionnaire_id };
  next();
}

// Limite d'essais par adresse IP (en mémoire : suffisant, le blocage de compte de Studio s'ajoute)
const essais = new Map();
function limiter(max, fenetreMs) {
  return (req, res, next) => {
    const cle = (req.ip || '') + '|' + req.path; const maintenant = Date.now();
    const e = essais.get(cle);
    if (!e || e.fin < maintenant) essais.set(cle, { n: 1, fin: maintenant + fenetreMs });
    else if (++e.n > max) return res.status(429).json({ error: 'Trop d\'essais. Réessayez dans quelques minutes.' });
    if (essais.size > 5000) { essais.forEach((v, k) => { if (v.fin < maintenant) essais.delete(k); }); }
    next();
  };
}

// ─── Comptage / lecture des annonces ──────────────────────────────────────────
// Seules les annonces CRÉÉES dans Studio sont proposées (pas celles venues d'e-Vend, eBay ou Etsy : évite les doublons et les allers-retours).
const ORIGINE_STUDIO = `to_jsonb(p)->>'evend_produit_id' IS NULL AND to_jsonb(p)->>'ebay_item_id' IS NULL AND to_jsonb(p)->>'etsy_listing_id' IS NULL`;
const STATUTS = `p.statut IN ('actif','brouillon','en_attente')`;

async function compter(cid, gid) {
  const r = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE ${ORIGINE_STUDIO})::int AS importables,
            COUNT(*) FILTER (WHERE NOT (${ORIGINE_STUDIO}))::int AS autres
       FROM produits p WHERE p.collaborateur_id = $1 AND p.gestionnaire_id = $2 AND ${STATUTS}`, [cid, gid]);
  return r.rows[0];
}
const jsonTableau = (v) => { if (Array.isArray(v)) return v; try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch (e) { return []; } };

// ─── Serveur à serveur ────────────────────────────────────────────────────────
router.post('/etat', exigerSecret, express.json({ limit: '10kb' }), h(async (req, res) => {
  const { etat, label } = req.body || {};
  if (typeof etat !== 'string' || !ETAT_RE.test(etat)) return res.status(400).json({ error: 'État invalide' });
  await pool.query('DELETE FROM pont_evend_etats WHERE expire_le < NOW()');
  await pool.query(`INSERT INTO pont_evend_etats (etat, label, expire_le) VALUES ($1,$2, NOW() + interval '15 minutes') ON CONFLICT (etat) DO NOTHING`, [etat, nettoyer(label, 80)]);
  res.json({ ok: true });
}));

router.post('/echange', exigerSecret, express.json({ limit: '10kb' }), h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const code = (req.body || {}).code;
  if (typeof code !== 'string' || !ETAT_RE.test(code)) return res.status(400).json({ error: 'Code invalide' });
  const r = await pool.query(`UPDATE pont_evend_codes SET utilise = TRUE WHERE code_hash = $1 AND NOT utilise AND expire_le > NOW() RETURNING collaborateur_id, gestionnaire_id`, [sha(code)]);
  if (!r.rows[0]) return res.status(400).json({ error: 'Code expiré ou déjà utilisé' });
  const jeton = crypto.randomBytes(32).toString('hex');
  await pool.query(`INSERT INTO pont_evend_jetons (jeton_hash, collaborateur_id, gestionnaire_id, expire_le) VALUES ($1,$2,$3, NOW() + ($4 || ' seconds')::interval)`, [sha(jeton), r.rows[0].collaborateur_id, r.rows[0].gestionnaire_id, String(TTL_JETON_S)]);
  const c = (await pool.query('SELECT nom_boutique FROM marketplace_collaborateurs WHERE id = $1', [r.rows[0].collaborateur_id])).rows[0];
  res.json({ jeton, expire_dans: TTL_JETON_S, boutique: { nom: nettoyer(c && c.nom_boutique, 120) } });
}));

router.get('/resume', exigerSecret, exigerJeton, h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await compter(req.pont.cid, req.pont.gid));
}));

router.get('/annonces', exigerSecret, exigerJeton, h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const apres = Math.max(parseInt(req.query.apres, 10) || 0, 0);
  const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || LOT_MAX, 1), LOT_MAX);
  const lignes = (await pool.query(
    `SELECT p.id, p.titre, p.description, p.prix, p.prix_promo, p.stock, p.sku, p.categorie, p.categorie_id, p.photos, p.photo_principale, p.variantes,
            p.statut, p.poids, p.quantite_min, p.prix_revient, c.nom AS cat_nom, c.taxable AS cat_taxable
       FROM produits p LEFT JOIN studio_categories c ON c.id = p.categorie_id
      WHERE p.collaborateur_id = $1 AND p.gestionnaire_id = $2 AND ${STATUTS} AND ${ORIGINE_STUDIO} AND p.id > $3
      ORDER BY p.id ASC LIMIT $4`, [req.pont.cid, req.pont.gid, apres, limite])).rows;
  const ids = lignes.map((p) => p.id);
  const meth = {};
  if (ids.length) {
    try {
      const m = await pool.query(`SELECT l.produit_id, m.transporteur_id FROM collab_produit_methodes_expedition l JOIN collab_methodes_expedition m ON m.id = l.methode_id WHERE m.collaborateur_id = $1 AND m.actif = true AND l.produit_id = ANY($2::int[])`, [req.pont.cid, ids]);
      m.rows.forEach((x) => { (meth[x.produit_id] = meth[x.produit_id] || []).push(x.transporteur_id); });
    } catch (e) { /* tables d'expédition absentes : aucune méthode */ }
  }
  const annonces = lignes.map((p) => {
    const photos = jsonTableau(p.photos).filter((u) => typeof u === 'string').slice(0, 8);
    if (!photos.length && p.photo_principale) photos.push(p.photo_principale);
    return {
      id: p.id, titre: nettoyer(p.titre, 255), description: String(p.description || '').slice(0, 20000),
      prix: nombre(p.prix), prix_promo: nombre(p.prix_promo), stock: nombre(p.stock), sku: p.sku ? nettoyer(p.sku, 100) : null,
      categorie: p.cat_nom || p.categorie || null, categorie_taxable: p.cat_taxable !== false,
      photos, variantes: jsonTableau(p.variantes).slice(0, 20).map((v) => ({ nom: nettoyer(v && v.nom, 60), prix: nombre(v && v.prix), stock: nombre(v && v.stock) })),
      statut: p.statut === 'brouillon' ? 'brouillon' : 'actif',
      poids: nombre(p.poids), quantite_min: nombre(p.quantite_min), prix_revient: nombre(p.prix_revient),
      methodes_expedition: meth[p.id] || [],
    };
  });
  res.json({ annonces, suivant: lignes.length === limite ? ids[ids.length - 1] : null });
}));

// Méthodes d'expédition actives du collaborateur (mêmes champs qu'e-Vend) + nombre d'annonces importables qui les utilisent
router.get('/expedition', exigerSecret, exigerJeton, h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  let rows = [];
  try {
    rows = (await pool.query(
      `SELECT m.transporteur_id, m.frais_fixes, m.frais_par_kg, m.delais_estime, m.gratuit_superieur, m.mode_calcul, m.combine_shipping, m.combine_frais_fixe_unique,
              m.combine_kg_additionne, m.frais_zones, m.nom_personnalise, m.logo_personnalise,
              (SELECT COUNT(*)::int FROM collab_produit_methodes_expedition l JOIN produits p ON p.id = l.produit_id
                WHERE l.methode_id = m.id AND ${STATUTS} AND ${ORIGINE_STUDIO}) AS nb_annonces
         FROM collab_methodes_expedition m WHERE m.collaborateur_id = $1 AND m.gestionnaire_id = $2 AND m.actif = true ORDER BY m.transporteur_id LIMIT 50`, [req.pont.cid, req.pont.gid])).rows;
  } catch (e) { rows = []; }
  res.json({ methodes: rows.map((m) => ({
    transporteur_id: m.transporteur_id, frais_fixes: nombre(m.frais_fixes), frais_par_kg: nombre(m.frais_par_kg), gratuit_superieur: nombre(m.gratuit_superieur),
    delais_estime: m.delais_estime ? nettoyer(m.delais_estime, 100) : null,
    mode_calcul: ['fixe', 'fixe_kg', 'kg', 'zone'].includes(m.mode_calcul) ? m.mode_calcul : 'fixe',
    combine_shipping: m.combine_shipping === true, combine_frais_fixe_unique: m.combine_frais_fixe_unique !== false, combine_kg_additionne: m.combine_kg_additionne !== false,
    frais_zones: m.frais_zones && typeof m.frais_zones === 'object' ? m.frais_zones : null,
    nom_personnalise: m.nom_personnalise ? nettoyer(m.nom_personnalise, 100) : null,
    logo_personnalise: m.logo_personnalise ? String(m.logo_personnalise).slice(0, 10) : null, nb_annonces: m.nb_annonces })) });
}));

router.post('/revoquer', exigerSecret, exigerJeton, h(async (req, res) => {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(String(req.headers.authorization || ''));
  await pool.query('UPDATE pont_evend_jetons SET revoque = TRUE WHERE jeton_hash = $1', [sha(m[1])]);
  res.json({ ok: true });
}));

// ─── Navigateur du collaborateur ──────────────────────────────────────────────
function entetes(res) {
  res.set({
    'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",
  });
}
const ticketPour = (etat, cid, exp) => crypto.createHmac('sha256', JWT_SECRET()).update(`pont|${etat}|${cid}|${exp}`).digest('hex');
function ticketValide(etat, cid, exp, ticket) {
  if (!JWT_SECRET() || !(Number(exp) > Date.now()) || typeof ticket !== 'string' || !/^[a-f0-9]{64}$/.test(ticket)) return false;
  return crypto.timingSafeEqual(Buffer.from(ticketPour(etat, cid, exp)), Buffer.from(ticket));
}
const STYLE = `*{box-sizing:border-box}body{margin:0;background:#060d1f;font-family:system-ui,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
.c{background:#fff;border-radius:16px;max-width:440px;width:100%;padding:28px;color:#1a2332}h1{font-size:21px;margin:0 0 8px}p{font-size:14px;line-height:1.5;color:#374151}
label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px}input{width:100%;padding:11px;border:1px solid #d1d5db;border-radius:8px;font-size:15px}
button{width:100%;padding:13px;border:0;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;margin-top:14px;background:#16a34a;color:#fff}button.g{background:#fff;color:#1a2332;border:1px solid #d1d5db}
.e{color:#b91c1c;font-size:13px;margin-top:10px;min-height:16px}.b{background:#f3f4f6;border-radius:10px;padding:12px;margin:10px 0;font-size:14px}.w{color:#92400e;font-size:12px}`;
const page = (titre, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${echapper(titre)}</title><style>${STYLE}</style></head><body><div class="c">${corps}</div></body></html>`;
const pageErreur = (t, m) => page(t, `<h1>${echapper(t)}</h1><p>${echapper(m)}</p>`);

const SCRIPT = `
var q=document.getElementById('c'),etat=q.getAttribute('data-etat'),lab=q.getAttribute('data-label');
function post(u,b){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b),credentials:'omit'}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})}
function el(t,a,x){var e=document.createElement(t);for(var k in a)e.setAttribute(k,a[k]);if(x)e.textContent=x;return e}
var f=document.getElementById('f'),err=document.getElementById('err');
f.onsubmit=function(ev){ev.preventDefault();err.textContent='';var bt=f.querySelector('button');bt.disabled=true;
post('identifier',{etat:etat,email:f.email.value,password:f.pw.value}).then(function(r){bt.disabled=false;if(!r.ok){err.textContent=r.j.error||'Connexion impossible';return}
var bs=r.j.boutiques;f.style.display='none';var z=document.getElementById('z');z.textContent='';
z.appendChild(el('p',{},'« '+lab+' » demande à lire vos annonces Studio pour les importer dans e-Vend. Choisissez la boutique :'));
bs.forEach(function(b){var bx=el('div',{'class':'b'});bx.appendChild(el('strong',{},b.nom||'Ma boutique'));bx.appendChild(el('div',{},b.importables+' annonce(s) importable(s)'));
var ok=el('button',{type:'button'},'Autoriser cette boutique');ok.onclick=function(){ok.disabled=true;post('autoriser',{etat:etat,decision:'oui',cid:b.id,exp:b.exp,ticket:b.ticket}).then(function(x){if(x.ok&&x.j.redirect){location.href=x.j.redirect}else{ok.disabled=false;err.textContent=x.j.error||'Erreur'}})};bx.appendChild(ok);z.appendChild(bx)});
z.appendChild(el('p',{'class':'w'},'e-Vend pourra seulement lire (titre, description, prix, stock, photos, variantes). Rien ne sera modifié sur Studio, et l’accès expire après 3 heures. Continuez seulement si vous venez de cliquer sur « Importer mes annonces Studio » dans e-Vend.'));
var no=el('button',{type:'button','class':'g'},'Annuler');no.onclick=function(){post('autoriser',{etat:etat,decision:'non'}).then(function(x){if(x.ok&&x.j.redirect)location.href=x.j.redirect})};z.appendChild(no)})
.catch(function(){bt.disabled=false;err.textContent='Erreur réseau'})};`;

router.get('/autoriser', limiter(60, 15 * 60 * 1000), h(async (req, res) => {
  entetes(res);
  const etat = String(req.query.etat || '');
  const e = ETAT_RE.test(etat) ? (await pool.query(`SELECT etat, label FROM pont_evend_etats WHERE etat = $1 AND NOT utilise AND expire_le > NOW()`, [etat])).rows[0] : null;
  if (!e) return res.status(400).send(pageErreur('Lien expiré', "Ce lien n'est plus valide. Retournez dans e-Vend et cliquez de nouveau sur « Importer mes annonces Studio »."));
  res.send(page('Connexion à Studio', `<div id="c" data-etat="${echapper(etat)}" data-label="${echapper(e.label || 'e-Vend')}">
<h1>Connectez-vous à Studio</h1><p>Entrez les identifiants de votre compte <strong>collaborateur Studio</strong> (ceux de votre boutique). Ils ne sont jamais transmis à e-Vend.</p>
<form id="f" autocomplete="on"><label for="email">Courriel</label><input id="email" name="email" type="email" required autocomplete="username"><label for="pw">Mot de passe</label><input id="pw" name="pw" type="password" required autocomplete="current-password"><button type="submit">Continuer</button></form>
<div id="z"></div><div class="e" id="err"></div></div><script>${SCRIPT}</script>`));
}));

router.post('/identifier', limiter(10, 15 * 60 * 1000), express.json({ limit: '10kb' }), h(async (req, res) => {
  const { etat, email, password } = req.body || {};
  if (typeof etat !== 'string' || !ETAT_RE.test(etat) || typeof email !== 'string' || typeof password !== 'string' || !email || !password || password.length > 200 || email.length > 255) return res.status(400).json({ error: 'Champs invalides' });
  const e = (await pool.query(`SELECT 1 FROM pont_evend_etats WHERE etat = $1 AND NOT utilise AND expire_le > NOW()`, [etat])).rows[0];
  if (!e) return res.status(400).json({ error: 'Lien expiré. Recommencez depuis e-Vend.' });
  const comptes = (await pool.query(`SELECT id, gestionnaire_id, nom_boutique, mot_de_passe, nom_responsable FROM marketplace_collaborateurs WHERE LOWER(email) = LOWER($1) AND statut = 'actif' LIMIT 20`, [email.trim()])).rows;
  const bons = [];
  for (const c of comptes) {
    const cle = `collaborateur_${c.gestionnaire_id}`;
    const bloque = await verifierCompteBloque(email, cle);
    if (bloque) return res.status(403).json({ error: bloque.message || 'Compte temporairement bloqué.' });
    if (c.mot_de_passe && await bcrypt.compare(password, c.mot_de_passe)) bons.push(c);
    else await gererTentativeEchouee(email, cle, c.nom_responsable);
  }
  if (!bons.length) return res.status(401).json({ error: 'Courriel ou mot de passe incorrect' });
  for (const c of bons) await pool.query('DELETE FROM login_attempts WHERE email = $1 AND user_type = $2', [email.toLowerCase(), `collaborateur_${c.gestionnaire_id}`]);
  const exp = Date.now() + 5 * 60 * 1000;
  const boutiques = [];
  for (const c of bons) {
    const n = await compter(c.id, c.gestionnaire_id);
    boutiques.push({ id: c.id, nom: nettoyer(c.nom_boutique, 120), importables: n.importables, exp, ticket: ticketPour(etat, c.id, exp) });
  }
  res.json({ boutiques });
}));

router.post('/autoriser', limiter(30, 15 * 60 * 1000), express.json({ limit: '10kb' }), h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const b = req.body || {};
  if (typeof b.etat !== 'string' || !ETAT_RE.test(b.etat)) return res.status(400).json({ error: 'Lien invalide' });
  const url = (extra) => { const u = new URL(RETOUR()); u.searchParams.set('etat', b.etat); Object.keys(extra).forEach((k) => u.searchParams.set(k, extra[k])); return u.toString(); };
  if (b.decision === 'non') {
    await pool.query('UPDATE pont_evend_etats SET utilise = TRUE WHERE etat = $1', [b.etat]);
    return res.json({ redirect: url({ erreur: 'refuse' }) });
  }
  const cid = parseInt(b.cid, 10);
  if (b.decision !== 'oui' || !cid || !ticketValide(b.etat, cid, b.exp, b.ticket)) return res.status(403).json({ error: 'Autorisation invalide. Recommencez.' });
  const c = (await pool.query(`SELECT id, gestionnaire_id FROM marketplace_collaborateurs WHERE id = $1 AND statut = 'actif'`, [cid])).rows[0];
  if (!c) return res.status(403).json({ error: 'Compte indisponible' });
  const u = await pool.query(`UPDATE pont_evend_etats SET utilise = TRUE WHERE etat = $1 AND NOT utilise AND expire_le > NOW() RETURNING etat`, [b.etat]);
  if (!u.rows[0]) return res.status(400).json({ error: 'Lien expiré ou déjà utilisé' });
  const code = crypto.randomBytes(32).toString('hex');
  await pool.query(`INSERT INTO pont_evend_codes (code_hash, etat, collaborateur_id, gestionnaire_id, expire_le) VALUES ($1,$2,$3,$4, NOW() + interval '2 minutes')`, [sha(code), b.etat, c.id, c.gestionnaire_id]);
  res.json({ redirect: url({ code }) });
}));

module.exports = router;