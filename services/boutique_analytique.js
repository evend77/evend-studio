// CHEMIN : services/boutique_analytique.js
// e-Vend Studio — Add-on « Analytique » des templates boutique (solo) : enregistrement des visites + statistiques du gestionnaire.
// Mêmes tables que le MV (visites, visites_sessions) : un gestionnaire n'a qu'un seul site. Aucun lien de code avec routes/analytique.js (MV).
// Isolation entre boutiques :
//   • LECTURE : toujours avec l'id du gestionnaire connecté (jamais un id venant du navigateur).
//   • ÉCRITURE : la visite est rattachée à la boutique du DOMAINE visité (sous-domaine *.e-vendstudio.ca ou domaine personnalisé), solo seulement ;
//     l'id de l'URL doit correspondre à ce domaine, sinon refus. Une boutique ne peut donc pas écrire dans les chiffres d'une autre.
//   • DURÉE : mise à jour seulement avec le jeton propre à la visite (signé), jamais avec un simple numéro de visite.
// Accès : add-on « analytique » acheté et activé (A.addonActif). La bannière de cookies du gestionnaire doit être active ET proposer la catégorie « analytique ».
// Aucune adresse IP n'est conservée : seulement pays / province / ville déduits au moment de la visite.

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const A = require('./boutique_addons');

const CODE_ADDON = 'analytique';
const DOMAINE_PRINCIPAL = 'e-vendstudio.ca';
const DUREE_CACHE = 60 * 1000;
const DUREE_MAX = 1800;           // 30 min max par page (un onglet oublié ne fausse pas la moyenne)
const SESSION_RE = /^[A-Za-z0-9_-]{8,64}$/;
const RESOLUTION_RE = /^\d{2,5}x\d{2,5}$/;
const LANGUE_RE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|preview|curl|wget|python-requests|httpclient|go-http|java\//i;
const CTRL = /[\u0000-\u001f\u007f]/g;
const PERIODES = [7, 30, 90, 365];

const cache = new Map();         // hôte → { t, v }
const cacheConfig = new Map();   // gid  → { t, v }
function viderCache() { cache.clear(); cacheConfig.clear(); }
const normaliserHote = (h) => String(h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '');
const nettoyer = (s, max) => String(s == null ? '' : s).replace(CTRL, ' ').trim().slice(0, max);
const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

// Géolocalisation : geoip-lite (déjà utilisé par le MV). Chargé à la demande ; remplaçable dans les tests.
let geo = null;
function geoLookup(ip) {
  try {
    if (!geo) geo = require('geoip-lite').lookup;
    return geo(ip);
  } catch (e) { return null; }
}
function _setGeo(fn) { geo = fn; }

// Jeton de durée propre à une visite (signé avec le même secret que l'authentification)
function secret() { return process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025'; }
function jetonVisite(gid, id) {
  return crypto.createHmac('sha256', secret()).update(`bq-analytique:${gid}:${id}`).digest('hex').slice(0, 32);
}
function jetonValide(gid, id, jeton) {
  const attendu = Buffer.from(jetonVisite(gid, id)), recu = Buffer.from(String(jeton || ''));
  return attendu.length === recu.length && crypto.timingSafeEqual(attendu, recu);
}

function parseUserAgent(ua = '') {
  let navigateur = 'Autre', os = 'Autre', device = 'desktop';
  if (ua.includes('Edg/')) navigateur = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) navigateur = 'Opera';
  else if (ua.includes('Chrome')) navigateur = 'Chrome';
  else if (ua.includes('Firefox')) navigateur = 'Firefox';
  else if (ua.includes('Safari')) navigateur = 'Safari';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  if (ua.includes('iPad') || ua.includes('Tablet')) device = 'tablet';
  else if (ua.includes('Mobi') || ua.includes('Android') || ua.includes('iPhone')) device = 'mobile';
  return { navigateur, os, device };
}

// utm_* lus dans la partie « ?… » de l'adresse d'arrivée (envoyée par le site), pas dans le référent
function extraireUTM(recherche) {
  const r = { utm_source: null, utm_medium: null, utm_campaign: null };
  try {
    const p = new URLSearchParams(String(recherche || '').slice(0, 400));
    for (const k of Object.keys(r)) { const v = nettoyer(p.get(k), 100); if (v) r[k] = v; }
  } catch (e) { /* ignoré */ }
  return r;
}

// Boutique SOLO du domaine visité → { gid, statut, template_id } ou null
async function chercher(hote) {
  if (!hote || hote === DOMAINE_PRINCIPAL || hote === 'www.' + DOMAINE_PRINCIPAL || hote === 'localhost') return null;
  const SELECT = `
    SELECT g.id AS gid, g.statut, s.template_id
    FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id
    WHERE `;
  if (hote.endsWith('.' + DOMAINE_PRINCIPAL)) {
    const etiquette = hote.slice(0, -(DOMAINE_PRINCIPAL.length + 1));
    if (!etiquette || etiquette.includes('.')) return null;
    return (await pool.query(SELECT + 's.sous_domaine = $1 LIMIT 1', [etiquette])).rows[0] || null;
  }
  const sansWww = hote.replace(/^www\./, '');
  return (await pool.query(SELECT + 's.domaine_perso = ANY($1::text[]) LIMIT 1', [[hote, sansWww, 'www.' + sansWww]])).rows[0] || null;
}

// → gid de la boutique solo de ce domaine (non suspendue) ou null
async function gidPourHote(hoteBrut) {
  const hote = normaliserHote(hoteBrut);
  const memo = cache.get(hote);
  if (memo && Date.now() - memo.t < DUREE_CACHE) return memo.v;
  let v = null;
  try {
    const row = await chercher(hote);
    if (row && A.estTemplateSolo(row.template_id) && !['suspendu', 'banni'].includes(row.statut)) v = row.gid;
  } catch (e) { console.error('[boutique_analytique] hote', e && e.message ? e.message : e); }
  cache.set(hote, { t: Date.now(), v });
  return v;
}

// Bannière de cookies du gestionnaire : sans ligne enregistrée, les valeurs par défaut du MV s'appliquent (bannière active, 3 catégories)
async function banniere(gid) {
  try {
    const r = await pool.query('SELECT actif, categories_actives FROM cookies_site_gestionnaire WHERE gestionnaire_id = $1', [gid]);
    if (!r.rows.length) return { active: true, categorie: true };
    let cat = r.rows[0].categories_actives;
    if (typeof cat === 'string') { try { cat = JSON.parse(cat); } catch (e) { cat = null; } }
    return { active: r.rows[0].actif !== false, categorie: !cat || cat.analytique !== false };
  } catch (e) { return { active: true, categorie: true }; }
}

// Config publique pour le site : { actif } — vrai seulement si add-on actif + bannière active + catégorie « analytique » proposée
async function configPublique(gid) {
  const memo = cacheConfig.get(gid);
  if (memo && Date.now() - memo.t < DUREE_CACHE) return memo.v;
  let actif = false;
  try {
    if (await autorise(gid)) { const b = await banniere(gid); actif = b.active && b.categorie; }
  } catch (e) { console.error('[boutique_analytique] config', e && e.message ? e.message : e); }
  const v = { actif };
  cacheConfig.set(gid, { t: Date.now(), v });
  return v;
}

// Enregistre une visite → { id, token } | 'invalide' | 'bot' | 'hote' | 'inactif'
async function enregistrerVisite(gid, hote, body, ip, ua) {
  const b = body || {};
  const session = String(b.session_id || '');
  const page = nettoyer(b.page, 200);
  if (!Number.isInteger(gid) || !SESSION_RE.test(session) || !page.startsWith('/')) return 'invalide';
  if (BOT_RE.test(String(ua || ''))) return 'bot';
  const gidHote = await gidPourHote(hote);
  if (!gidHote || gidHote !== gid) return 'hote';
  if (!(await configPublique(gid)).actif) return 'inactif';

  const referent = /^https?:\/\//i.test(String(b.referent || '')) ? nettoyer(b.referent, 500) : null;
  const resolution = RESOLUTION_RE.test(String(b.resolution || '')) ? String(b.resolution) : null;
  const langue = LANGUE_RE.test(String(b.langue || '')) ? String(b.langue).slice(0, 10) : null;
  const { navigateur, os, device } = parseUserAgent(String(ua || ''));
  const utm = extraireUTM(b.recherche);
  const g = geoLookup(String(ip || '').replace(/^::ffff:/, ''));
  const pays = g && g.country ? String(g.country).slice(0, 2) : null;
  const province = g && g.region ? String(g.region).slice(0, 10) : null;
  const ville = g && g.city ? String(g.city).slice(0, 100) : null;

  const cl = await pool.connect();
  let id;
  try {
    await cl.query('BEGIN');
    id = (await cl.query(
      `INSERT INTO visites (gestionnaire_id, session_id, page, titre, referent, pays, province, ville, device, navigateur, os,
                            resolution, langue, utm_source, utm_medium, utm_campaign)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [gid, session, page, nettoyer(b.titre, 200) || null, referent, pays, province, ville, device, navigateur, os,
        resolution, langue, utm.utm_source, utm.utm_medium, utm.utm_campaign])).rows[0].id;
    await cl.query(
      `INSERT INTO visites_sessions (session_id, gestionnaire_id, pays, device, derniere_visite, nb_pages)
       VALUES ($1,$2,$3,$4,NOW(),1)
       ON CONFLICT (session_id, gestionnaire_id) DO UPDATE SET derniere_visite = NOW(), nb_pages = visites_sessions.nb_pages + 1`,
      [session, gid, pays, device]);
    await cl.query('COMMIT');
  } catch (e) {
    try { await cl.query('ROLLBACK'); } catch (e2) { /* ignoré */ }
    throw e;
  } finally { cl.release(); }
  return { id: Number(id), token: jetonVisite(gid, id) };
}

// Durée passée sur une page → true | 'invalide' | 'refuse'
async function enregistrerDuree(gid, id, jeton, secondes) {
  const n = parseInt(id, 10), s = Number(secondes);
  if (!Number.isInteger(gid) || !Number.isInteger(n) || n <= 0 || !Number.isFinite(s) || s < 0) return 'invalide';
  if (!jetonValide(gid, n, jeton)) return 'refuse';
  await pool.query(
    `UPDATE visites SET duree_secondes = GREATEST(COALESCE(duree_secondes, 0), $1)
      WHERE id = $2 AND gestionnaire_id = $3`,
    [Math.min(Math.round(s), DUREE_MAX), n, gid]);
  return true;
}

const num = (v) => (v == null ? 0 : Number(v));

// Statistiques du gestionnaire connecté — jamais un autre
async function lire(gid, periodeBrute) {
  let jours = parseInt(periodeBrute, 10);
  if (!Number.isInteger(jours) || jours < 1) jours = 30;
  jours = Math.min(jours, 365);
  const addon = await autorise(gid);
  const ban = await banniere(gid);
  // « created_at » est sans fuseau : on le lit dans le fuseau du serveur, puis on le convertit en heure de Toronto pour le découpage par jour
  const LOCAL = `(created_at AT TIME ZONE current_setting('TimeZone')) AT TIME ZONE 'America/Toronto'`;
  const FENETRE = `gestionnaire_id = $1 AND created_at >= NOW() - ($2 || ' days')::INTERVAL`;
  const q = (sql) => pool.query(sql, [gid, jours]);

  const [totaux, parJour, pagesTop, paysTop, devices, navigateurs, referents, provinces] = await Promise.all([
    q(`SELECT COUNT(*) AS total_visites,
              COUNT(DISTINCT v.session_id) AS visiteurs_uniques,
              ROUND(AVG(v.duree_secondes) FILTER (WHERE v.duree_secondes > 0)) AS duree_moyenne,
              ROUND(AVG(s.nb_pages)) AS pages_par_session,
              COUNT(DISTINCT v.session_id) FILTER (WHERE v.created_at >= NOW() - INTERVAL '24 hours') AS actifs_aujourdhui
         FROM visites v
         LEFT JOIN visites_sessions s ON s.session_id = v.session_id AND s.gestionnaire_id = v.gestionnaire_id
        WHERE v.gestionnaire_id = $1 AND v.created_at >= NOW() - ($2 || ' days')::INTERVAL`),
    q(`SELECT TO_CHAR(DATE(${LOCAL}), 'YYYY-MM-DD') AS jour, COUNT(*) AS visites, COUNT(DISTINCT session_id) AS visiteurs
         FROM visites WHERE ${FENETRE} GROUP BY jour ORDER BY jour ASC`),
    q(`SELECT page, MAX(titre) AS titre, COUNT(*) AS visites, COUNT(DISTINCT session_id) AS visiteurs_uniques,
              ROUND(AVG(duree_secondes) FILTER (WHERE duree_secondes > 0)) AS duree_moy
         FROM visites WHERE ${FENETRE} GROUP BY page ORDER BY visites DESC LIMIT 200`),
    q(`SELECT COALESCE(pays, 'Inconnu') AS pays, COUNT(*) AS visites, COUNT(DISTINCT session_id) AS visiteurs
         FROM visites WHERE ${FENETRE} GROUP BY pays ORDER BY visites DESC LIMIT 10`),
    q(`SELECT COALESCE(device, 'desktop') AS device, COUNT(*) AS total FROM visites WHERE ${FENETRE} GROUP BY 1 ORDER BY total DESC`),
    q(`SELECT COALESCE(navigateur, 'Autre') AS navigateur, COUNT(*) AS total FROM visites WHERE ${FENETRE} GROUP BY 1 ORDER BY total DESC LIMIT 6`),
    q(`SELECT CASE
                WHEN referent IS NULL OR referent = '' THEN 'Direct'
                WHEN referent ILIKE '%google%' THEN 'Google'
                WHEN referent ILIKE '%facebook%' THEN 'Facebook'
                WHEN referent ILIKE '%instagram%' THEN 'Instagram'
                WHEN referent ILIKE '%tiktok%' THEN 'TikTok'
                WHEN referent ILIKE '%twitter%' OR referent ILIKE '%x.com%' THEN 'Twitter/X'
                WHEN referent ILIKE '%youtube%' THEN 'YouTube'
                ELSE 'Autre' END AS source, COUNT(*) AS visites
         FROM visites WHERE ${FENETRE} GROUP BY source ORDER BY visites DESC`),
    q(`SELECT province, COUNT(*) AS visites FROM visites
        WHERE ${FENETRE} AND pays = 'CA' AND province IS NOT NULL GROUP BY province ORDER BY visites DESC`),
  ]);

  const t = totaux.rows[0] || {};
  return {
    addon_actif: addon,
    banniere_active: ban.active,
    categorie_analytique: ban.categorie,
    periode: jours,
    totaux: {
      total_visites: num(t.total_visites), visiteurs_uniques: num(t.visiteurs_uniques), duree_moyenne: num(t.duree_moyenne),
      pages_par_session: num(t.pages_par_session), actifs_aujourdhui: num(t.actifs_aujourdhui),
    },
    parJour: parJour.rows.map((r) => ({ jour: r.jour, visites: num(r.visites), visiteurs: num(r.visiteurs) })),
    pagesTop: pagesTop.rows.map((r) => ({ page: r.page, titre: r.titre, visites: num(r.visites), visiteurs_uniques: num(r.visiteurs_uniques), duree_moy: num(r.duree_moy) })),
    paysTop: paysTop.rows.map((r) => ({ pays: r.pays, visites: num(r.visites), visiteurs: num(r.visiteurs) })),
    devices: devices.rows.map((r) => ({ device: r.device, total: num(r.total) })),
    navigateurs: navigateurs.rows.map((r) => ({ navigateur: r.navigateur, total: num(r.total) })),
    referents: referents.rows.map((r) => ({ source: r.source, visites: num(r.visites) })),
    provincesTop: provinces.rows.map((r) => ({ province: r.province, visites: num(r.visites) })),
  };
}

module.exports = {
  CODE_ADDON, PERIODES, DUREE_MAX, viderCache, parseUserAgent, extraireUTM, gidPourHote, configPublique,
  enregistrerVisite, enregistrerDuree, lire, jetonVisite, _setGeo,
};