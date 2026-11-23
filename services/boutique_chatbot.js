// CHEMIN : services/boutique_chatbot.js
// e-Vend Studio — Add-on « Chatbot » (sans IA) des templates boutique (solo). Adapté de routes/chatbot_public.js + routes/chatbot_gestionnaire.js + services/studio_chatbot.js (MV) ;
// ne touche à rien du MV. Les 5 tables chatbot_* sont celles du MV, déjà liées à gestionnaire_id (un gestionnaire = une boutique) : aucune nouvelle table.
//
// Qui peut l'utiliser : l'add-on « chatbot » doit être activé (boutique_addons_achetes) — même règle que les autres add-ons boutique (A.addonActif).
// Ordre de réponse (comme le MV) : 1. liste noire  2. réponses rapides  3. sources personnalisées  4. recherche dans le contenu de la boutique :
//   produits actifs, politiques, FAQ, À propos (config du site) et blog. Chaque résultat porte un `nav` que le widget donne au site pour ouvrir la bonne page sans recharger.
// Tout est scopé par gestionnaire_id : jamais de réponse qui traverse les données d'une autre boutique.

'use strict';

const pool = require('../db');
const { nettoyerTexte } = require('../utils/sanitize');   // nettoyage unique (utils/sanitize.js)
const A = require('./boutique_addons');
const EXP = require('./boutique_expedition');
const O = require('./boutique_offres');
const BL = require('./boutique_blog');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'chatbot';
const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };

async function autorise(gid) { return A.addonActif(gid, CODE_ADDON); }

// ── Texte ──
const normaliser = (t = '') => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const NORM_SQL = (col) => `translate(lower(COALESCE(${col}, '')), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy')`;
const MOTS_VIDES = new Set(['les', 'des', 'une', 'est', 'pour', 'dans', 'avec', 'sans', 'sur', 'que', 'qui', 'quel', 'quelle', 'quels', 'quelles',
  'vous', 'nous', 'mon', 'ton', 'son', 'votre', 'notre', 'ils', 'elle', 'elles', 'ont', 'sont', 'pas', 'plus', 'comment', 'pourquoi', 'quand',
  'faire', 'peut', 'puis', 'aussi', 'cette', 'ces', 'mes', 'tes', 'ses', 'aux', 'par', 'car', 'quoi', 'dont', 'etre', 'avoir', 'bonjour', 'salut',
  'je', 'tu', 'il', 'on', 'le', 'la', 'un', 'de', 'du', 'et', 'ou', 'au', 'en', 'se', 'ce', 'ca', 'cela', 'veux', 'voudrais', 'cherche', 'besoin']);

function motsRecherche(question) {
  const brut = normaliser(question).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((m) => m.length > 2);
  const utiles = brut.filter((m) => !MOTS_VIDES.has(m));
  const liste = (utiles.length ? utiles : brut).map((m) => (m.length > 4 && /[sx]$/.test(m) ? m.slice(0, -1) : m));   // chaussures → chaussure
  return [...new Set(liste)].slice(0, 8);
}
const motifsLike = (mots) => mots.map((m) => '%' + m.replace(/[\\%_]/g, '\\$&') + '%');
const conditionLike = (colonnes, nbMots) => Array.from({ length: nbMots }, (_, i) => '(' + colonnes.map((c) => `${NORM_SQL(c)} LIKE $${i + 2}`).join(' OR ') + ')').join(' OR ');
function scoreTexte(titre, corps, mots) {
  const t = normaliser(titre || ''), c = normaliser(corps || '');
  let s = 0;
  for (const m of mots) { if (t.includes(m)) s += 3; if (c.includes(m)) s += 1; }
  return s;
}
const apercu = (t, max) => (t.length > max ? t.slice(0, max).replace(/\s+\S*$/, '') + '…' : t);
const texteSimple = (h) => BL.texteSimple(h);

// Découpe un contenu HTML riche par titres (h1–h4) et garde les sections qui contiennent les mots cherchés (logique du MV, sans accents)
function sectionsParTitres(html, mots, max) {
  if (!html) return [];
  const net = String(html).replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  const sections = [];
  const re = /<(h[1-4])[^>]*>(.*?)<\/\1>/gi;
  let dernier = null, m;
  const pousser = (d, fin) => {
    const contenu = texteSimple(net.substring(d.fin, fin)).replace(/^[^\wÀ-ÿ]*/, '');
    if (contenu.length > 30) sections.push({ titre: d.titre, contenu: contenu.substring(0, 500) });
  };
  while ((m = re.exec(net)) !== null) {
    if (dernier) pousser(dernier, m.index);
    dernier = { titre: texteSimple(m[2]), fin: m.index + m[0].length };
  }
  if (dernier) pousser(dernier, net.length);
  if (!sections.length) {
    for (const p of net.split(/<\/p>/i)) { const t = texteSimple(p); if (t.length > 50) sections.push({ titre: 'Extrait', contenu: t.substring(0, 500) }); }
  }
  const bons = [];
  for (const s of sections) {
    let score = 0;
    const tout = normaliser(s.titre + ' ' + s.contenu);
    for (const mot of mots) {
      score += (tout.match(new RegExp(mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (normaliser(s.titre).includes(mot)) score += 3;
    }
    if (score > 0) bons.push({ ...s, score });
  }
  return bons.sort((a, b) => b.score - a.score).slice(0, max);
}

// ── Configuration (tables chatbot_* du MV) ──
const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
function positionValide(p) {
  const v = String(p || '').toLowerCase();
  const bas = !(v.includes('haut') || v.includes('top'));
  const gauche = v.includes('gauche') || v.includes('left');
  return `${bas ? 'bottom' : 'top'}-${gauche ? 'left' : 'right'}`;
}
const COLS_PUBLIC = `actif, accueil_phrases, transition_phrases, attente_phrases, erreur_phrases, fin_phrases, suggestions_defaut,
  bouton_couleur, bouton_couleur_survol, bulle_couleur, bulle_entete_couleur, texte_couleur, texte_entete_couleur, accroche_couleur,
  largeur_widget, hauteur_widget, largeur_min, hauteur_min, bouton_taille, bouton_icone_taille, position_widget, marge_bas, marge_droite, marge_gauche, marge_haut,
  border_radius_widget, border_radius_bouton, ombre_widget, police_texte, taille_texte, logo_url, logo_taille, icone_bouton,
  delai_reponse, animation_duree, suggerer_questions, afficher_bulle_bienvenue, delai_bulle_bienvenue, max_caracteres_question`;

async function configGestionnaire(gid) {
  await pool.query('INSERT INTO chatbot_config_gestionnaire (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING', [gid]);
  const r = await pool.query('SELECT * FROM chatbot_config_gestionnaire WHERE gestionnaire_id = $1', [gid]);
  const c = r.rows[0];
  c.position_widget = positionValide(c.position_widget);
  return c;
}

// Public : seulement si l'add-on est activé ET que le gestionnaire a allumé le chatbot
async function configPublique(gid) {
  if (!(await autorise(gid))) return null;
  const r = await pool.query(`SELECT ${COLS_PUBLIC} FROM chatbot_config_gestionnaire WHERE gestionnaire_id = $1 AND actif = true`, [gid]);
  if (!r.rowCount) return null;
  const c = r.rows[0];
  c.position_widget = positionValide(c.position_widget);
  return c;
}

// ── Validation de la configuration envoyée par le gestionnaire ──
const COULEUR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\))$/;
const COULEURS = ['bouton_couleur', 'bouton_couleur_survol', 'bulle_couleur', 'bulle_entete_couleur', 'texte_couleur', 'texte_entete_couleur', 'accroche_couleur'];
const ENTIERS = { largeur_widget: [240, 700], hauteur_widget: [300, 900], largeur_min: [200, 700], hauteur_min: [200, 900], bouton_taille: [30, 120], bouton_icone_taille: [12, 80],
  marge_bas: [0, 400], marge_droite: [0, 400], marge_gauche: [0, 400], marge_haut: [0, 400], border_radius_widget: [0, 60], border_radius_bouton: [0, 100],
  taille_texte: [10, 24], logo_taille: [16, 120], delai_reponse: [0, 5000], animation_duree: [0, 2000], delai_bulle_bienvenue: [0, 60000], max_historique: [1, 100],
  max_caracteres_question: [20, 500], max_resultats: [1, 10] };
const BOOLEENS = ['actif', 'suggerer_questions', 'afficher_bulle_bienvenue', 'sonore_notification'];
const PHRASES = ['accueil_phrases', 'transition_phrases', 'attente_phrases', 'erreur_phrases', 'fin_phrases', 'suggestions_defaut'];
const SOURCES = ['produits', 'politiques', 'faq', 'apropos', 'blog', 'pages'];
const PHOTO_RE = /^https:\/\/media\.e-vend\.ca\/[A-Za-z0-9_\-./%]+\.(jpe?g|png|webp|gif|avif)$/i;
const proprete = (v, max) => nettoyerTexte(String(v), 1000000).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim().slice(0, max);

function lireConfig(b, gid) {
  const o = {};
  for (const k of BOOLEENS) if (b[k] !== undefined) { if (typeof b[k] !== 'boolean') refus(`${k} invalide.`); o[k] = b[k]; }
  for (const k of COULEURS) if (b[k] !== undefined) { if (typeof b[k] !== 'string' || !COULEUR_RE.test(b[k].trim())) refus(`Couleur invalide (${k}).`); o[k] = b[k].trim(); }
  for (const [k, [mn, mx]] of Object.entries(ENTIERS)) if (b[k] !== undefined) { const n = Number(b[k]); if (!Number.isFinite(n)) refus(`Valeur invalide (${k}).`); o[k] = Math.min(mx, Math.max(mn, Math.round(n))); }
  if (b.score_minimum !== undefined) { const n = Number(b.score_minimum); if (!Number.isFinite(n)) refus('Score minimum invalide.'); o.score_minimum = Math.min(1, Math.max(0, n)); }
  if (b.position_widget !== undefined) { if (!POSITIONS.includes(b.position_widget)) refus('Position invalide.'); o.position_widget = b.position_widget; }
  for (const k of PHRASES) if (b[k] !== undefined) {
    if (!Array.isArray(b[k]) || b[k].length > 30) refus(`${k} invalide.`);
    o[k] = JSON.stringify(b[k].filter((x) => typeof x === 'string').map((x) => proprete(x, 300)).filter(Boolean));
  }
  if (b.ombre_widget !== undefined) { if (typeof b.ombre_widget !== 'string' || !/^[0-9a-zA-Z#%.,()\s-]{1,100}$/.test(b.ombre_widget)) refus('Ombre invalide.'); o.ombre_widget = b.ombre_widget; }
  if (b.police_texte !== undefined) { if (typeof b.police_texte !== 'string' || !/^[A-Za-z0-9 ,'-]{1,50}$/.test(b.police_texte)) refus('Police invalide.'); o.police_texte = b.police_texte; }
  if (b.icone_bouton !== undefined) { if (typeof b.icone_bouton !== 'string') refus('Icône invalide.'); o.icone_bouton = proprete(b.icone_bouton, 10) || '💬'; }
  if (b.logo_url !== undefined) {
    if (b.logo_url === null || b.logo_url === '') o.logo_url = null;
    else {
      if (typeof b.logo_url !== 'string' || !PHOTO_RE.test(b.logo_url) || b.logo_url.includes('..')) refus("Logo invalide (utilisez le bouton d'envoi).");
      const propre = /\/studio\/boutique\/(\d+)\//.exec(b.logo_url);
      if (propre && Number(propre[1]) !== gid) refus("Logo invalide (utilisez le bouton d'envoi).");
      o.logo_url = b.logo_url;
    }
  }
  if (b.sources_contenu !== undefined) {
    if (!b.sources_contenu || typeof b.sources_contenu !== 'object' || Array.isArray(b.sources_contenu)) refus('Sources invalides.');
    const s = {};
    for (const k of SOURCES) if (typeof b.sources_contenu[k] === 'boolean') s[k] = b.sources_contenu[k];
    o.sources_contenu = JSON.stringify(s);
  }
  return o;
}
const JSONB = new Set([...PHRASES, 'sources_contenu']);

async function majConfig(gid, b) {
  const o = lireConfig(b || {}, gid);
  if (!Object.keys(o).length) refus('Aucun champ à mettre à jour.');
  await configGestionnaire(gid);
  const sets = [], v = [];
  for (const [k, val] of Object.entries(o)) { v.push(val); sets.push(`${k} = $${v.length}${JSONB.has(k) ? '::jsonb' : ''}`); }
  sets.push('updated_at = NOW()'); v.push(gid);
  const r = await pool.query(`UPDATE chatbot_config_gestionnaire SET ${sets.join(', ')} WHERE gestionnaire_id = $${v.length} RETURNING *`, v);
  const c = r.rows[0]; c.position_widget = positionValide(c.position_widget);
  return c;
}

// ── Réponses rapides / liste noire / sources personnalisées (CRUD du gestionnaire) ──
const LIMITE_LIGNES = 300;
function lireMots(v, requis) {
  if (v === undefined || v === null) { if (requis) refus('Au moins un mot-clé est requis.'); return null; }
  const l = (Array.isArray(v) ? v : String(v).split(',')).map((x) => proprete(x, 60)).filter(Boolean);
  if (requis && !l.length) refus('Au moins un mot-clé est requis.');
  if (l.length > 40) refus('Maximum 40 mots-clés.');
  return l;
}
const texteLibre = (v, max, nom) => { if (v === undefined || v === null) return null; if (typeof v !== 'string') refus(`${nom} invalide.`); const t = v.replace(/<[^>]*>/g, '').trim(); if (t.length > max) refus(`${nom} : ${max} caractères maximum.`); return t; };
function lireMenu(m) {
  if (m === undefined || m === null) return null;
  if (typeof m !== 'object' || !Array.isArray(m.choix)) refus('Menu invalide.');
  return JSON.stringify({ question: texteLibre(m.question || '', 200, 'Question du menu') || '', choix: m.choix.slice(0, 5).map((c) => ({ label: texteLibre((c && c.label) || '', 80, 'Libellé') || '', reponse: texteLibre((c && c.reponse) || '', 1000, 'Réponse') || '' })) });
}
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
async function compter(table, gid) { return (await pool.query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE gestionnaire_id = $1`, [gid])).rows[0].n; }

const RD = {
  async lister(gid) { return (await pool.query('SELECT id, mots_cles, reponse, reponses, menu_choix, actif, ordre, categorie, created_at, updated_at FROM chatbot_reponses_directes WHERE gestionnaire_id = $1 ORDER BY ordre ASC, id ASC', [gid])).rows; },
  async creer(gid, b) {
    const mots = lireMots(b.mots_cles, true);
    const reponse = texteLibre(b.reponse, 2000, 'Réponse') || '';
    const reponses = Array.isArray(b.reponses) ? b.reponses.map((x) => texteLibre(String(x), 2000, 'Réponse')).filter(Boolean).slice(0, 20) : null;
    const menu = lireMenu(b.menu_choix);
    if (!reponse && !menu && !(reponses && reponses.length)) refus('Écrivez une réponse (ou un menu de choix).');
    if (await compter('chatbot_reponses_directes', gid) >= LIMITE_LIGNES) refus(`Limite de ${LIMITE_LIGNES} réponses rapides atteinte.`, 409);
    const cat = ['site', 'divertissement'].includes(b.categorie) ? b.categorie : 'site';
    return (await pool.query(
      `INSERT INTO chatbot_reponses_directes (gestionnaire_id, mots_cles, reponse, reponses, menu_choix, actif, ordre, categorie)
       VALUES ($1,$2,$3,$4,$5::jsonb, COALESCE($6,true), (SELECT COALESCE(MAX(ordre),0)+1 FROM chatbot_reponses_directes WHERE gestionnaire_id=$1), $7) RETURNING *`,
      [gid, mots, reponse, reponses && reponses.length ? reponses : null, menu, typeof b.actif === 'boolean' ? b.actif : null, cat])).rows[0];
  },
  async modifier(gid, id, b) {
    const mots = b.mots_cles === undefined ? null : lireMots(b.mots_cles, true);
    const reponse = b.reponse === undefined ? null : (texteLibre(b.reponse, 2000, 'Réponse') || '');
    const reponses = b.reponses === undefined ? undefined : (Array.isArray(b.reponses) ? b.reponses.map((x) => texteLibre(String(x), 2000, 'Réponse')).filter(Boolean).slice(0, 20) : null);
    const menu = b.menu_choix === undefined ? undefined : lireMenu(b.menu_choix);
    const cat = b.categorie === undefined ? null : (['site', 'divertissement'].includes(b.categorie) ? b.categorie : refus('Catégorie invalide.'));
    const r = await pool.query(
      `UPDATE chatbot_reponses_directes SET mots_cles = COALESCE($1, mots_cles), reponse = COALESCE($2, reponse),
         reponses = CASE WHEN $3::boolean THEN $4 ELSE reponses END, menu_choix = CASE WHEN $5::boolean THEN $6::jsonb ELSE menu_choix END,
         actif = COALESCE($7, actif), ordre = COALESCE($8, ordre), categorie = COALESCE($9, categorie), updated_at = NOW()
       WHERE id = $10 AND gestionnaire_id = $11 RETURNING *`,
      [mots, reponse, reponses !== undefined, reponses && reponses.length ? reponses : null, menu !== undefined, menu === undefined ? null : menu,
        typeof b.actif === 'boolean' ? b.actif : null, Number.isInteger(b.ordre) ? b.ordre : null, cat, id, gid]);
    if (!r.rowCount) refus('Réponse introuvable.', 404);
    return r.rows[0];
  },
  async supprimer(gid, id) { const r = await pool.query('DELETE FROM chatbot_reponses_directes WHERE id = $1 AND gestionnaire_id = $2 RETURNING id', [id, gid]); if (!r.rowCount) refus('Réponse introuvable.', 404); },
};

const LN = {
  async lister(gid) { return (await pool.query('SELECT id, mots_cles, message_reponse, actif, created_at FROM chatbot_blacklist WHERE gestionnaire_id = $1 ORDER BY id ASC', [gid])).rows; },
  async creer(gid, b) {
    const mots = lireMots(b.mots_cles, true);
    const msg = texteLibre(b.message_reponse, 500, 'Le message'); if (!msg) refus('Le message de réponse est requis.');
    if (await compter('chatbot_blacklist', gid) >= LIMITE_LIGNES) refus(`Limite de ${LIMITE_LIGNES} entrées atteinte.`, 409);
    return (await pool.query('INSERT INTO chatbot_blacklist (gestionnaire_id, mots_cles, message_reponse, actif) VALUES ($1,$2,$3, COALESCE($4,true)) RETURNING *', [gid, mots, msg, typeof b.actif === 'boolean' ? b.actif : null])).rows[0];
  },
  async modifier(gid, id, b) {
    const mots = b.mots_cles === undefined ? null : lireMots(b.mots_cles, true);
    const msg = b.message_reponse === undefined ? null : (texteLibre(b.message_reponse, 500, 'Le message') || refus('Le message de réponse est requis.'));
    const r = await pool.query('UPDATE chatbot_blacklist SET mots_cles = COALESCE($1, mots_cles), message_reponse = COALESCE($2, message_reponse), actif = COALESCE($3, actif) WHERE id = $4 AND gestionnaire_id = $5 RETURNING *',
      [mots, msg, typeof b.actif === 'boolean' ? b.actif : null, id, gid]);
    if (!r.rowCount) refus('Entrée introuvable.', 404);
    return r.rows[0];
  },
  async supprimer(gid, id) { const r = await pool.query('DELETE FROM chatbot_blacklist WHERE id = $1 AND gestionnaire_id = $2 RETURNING id', [id, gid]); if (!r.rowCount) refus('Entrée introuvable.', 404); },
};

// Source personnalisée : l'adresse doit être https:// (jamais javascript: ni data:) — elle devient un lien cliquable dans la réponse
function lireUrl(v) {
  if (typeof v !== 'string') refus("L'adresse de la source est requise.");
  const t = v.trim();
  let u; try { u = new URL(t); } catch (e) { refus("Adresse invalide (elle doit commencer par https://)."); }
  if (u.protocol !== 'https:') refus("Adresse invalide (elle doit commencer par https://).");
  if (t.length > 1000) refus('Adresse trop longue.');
  return t;
}
const SP = {
  async lister(gid) { return (await pool.query('SELECT id, mots_cles, url_source, titre, description, actif, ordre, created_at FROM chatbot_sources_personnalisees WHERE gestionnaire_id = $1 ORDER BY ordre ASC, id DESC', [gid])).rows; },
  async creer(gid, b) {
    const mots = lireMots(b.mots_cles, true); const url = lireUrl(b.url_source);
    if (await compter('chatbot_sources_personnalisees', gid) >= LIMITE_LIGNES) refus(`Limite de ${LIMITE_LIGNES} sources atteinte.`, 409);
    return (await pool.query(
      `INSERT INTO chatbot_sources_personnalisees (gestionnaire_id, mots_cles, url_source, titre, description, actif, ordre)
       VALUES ($1,$2,$3,$4,$5, COALESCE($6,true), (SELECT COALESCE(MAX(ordre),0)+1 FROM chatbot_sources_personnalisees WHERE gestionnaire_id=$1)) RETURNING *`,
      [gid, mots, url, texteLibre(b.titre, 200, 'Le titre'), texteLibre(b.description, 1000, 'La description'), typeof b.actif === 'boolean' ? b.actif : null])).rows[0];
  },
  async modifier(gid, id, b) {
    const mots = b.mots_cles === undefined ? null : lireMots(b.mots_cles, true);
    const url = b.url_source === undefined ? null : lireUrl(b.url_source);
    const r = await pool.query(
      `UPDATE chatbot_sources_personnalisees SET mots_cles = COALESCE($1, mots_cles), url_source = COALESCE($2, url_source), titre = COALESCE($3, titre),
         description = COALESCE($4, description), actif = COALESCE($5, actif), ordre = COALESCE($6, ordre), updated_at = NOW()
       WHERE id = $7 AND gestionnaire_id = $8 RETURNING *`,
      [mots, url, b.titre === undefined ? null : texteLibre(b.titre, 200, 'Le titre'), b.description === undefined ? null : texteLibre(b.description, 1000, 'La description'),
        typeof b.actif === 'boolean' ? b.actif : null, Number.isInteger(b.ordre) ? b.ordre : null, id, gid]);
    if (!r.rowCount) refus('Source introuvable.', 404);
    return r.rows[0];
  },
  async supprimer(gid, id) { const r = await pool.query('DELETE FROM chatbot_sources_personnalisees WHERE id = $1 AND gestionnaire_id = $2 RETURNING id', [id, gid]); if (!r.rowCount) refus('Source introuvable.', 404); },
};

async function stats(gid) {
  const jour = await pool.query(
    `SELECT COUNT(*)::int AS total_conversations, COUNT(DISTINCT session_id)::int AS sessions_uniques, AVG(score) AS score_moyen, DATE(date_question) AS date
       FROM chatbot_conversations WHERE gestionnaire_id = $1 AND date_question > NOW() - INTERVAL '30 days' GROUP BY DATE(date_question) ORDER BY DATE(date_question) DESC`, [gid]);
  const total = await pool.query('SELECT COUNT(*)::int AS total, COUNT(DISTINCT session_id)::int AS sessions, AVG(score) AS score_moyen FROM chatbot_conversations WHERE gestionnaire_id = $1', [gid]);
  return { stats: jour.rows, total: total.rows[0] };
}

// ── Réponse à un visiteur ──
async function checkListeNoire(q, gid) {
  const ql = normaliser(q);
  const { rows } = await pool.query('SELECT mots_cles, message_reponse FROM chatbot_blacklist WHERE gestionnaire_id = $1 AND actif = true', [gid]);
  for (const it of rows) for (const mot of it.mots_cles) if (mot && ql.includes(normaliser(mot))) return { message: it.message_reponse };
  return null;
}
async function checkReponseRapide(q, gid) {
  const ql = normaliser(q);
  const { rows } = await pool.query('SELECT mots_cles, reponse, reponses, menu_choix FROM chatbot_reponses_directes WHERE gestionnaire_id = $1 AND actif = true ORDER BY ordre ASC, id ASC', [gid]);
  for (const it of rows) for (const mot of it.mots_cles) {
    if (!mot || !ql.includes(normaliser(mot))) continue;
    if (it.menu_choix) return { reponse: '', menu_choix: it.menu_choix };
    const v = Array.isArray(it.reponses) ? it.reponses.filter((r) => r && r.trim()) : [];
    return { reponse: v.length ? v[Math.floor(Math.random() * v.length)] : it.reponse };
  }
  return null;
}
async function checkSourcePerso(q, gid) {
  const ql = normaliser(q);
  const { rows } = await pool.query('SELECT mots_cles, url_source, titre, description FROM chatbot_sources_personnalisees WHERE gestionnaire_id = $1 AND actif = true ORDER BY ordre ASC, id ASC', [gid]);
  for (const s of rows) for (const mot of s.mots_cles) if (mot && mot.trim() && ql.includes(normaliser(mot))) return s;
  return null;
}

const FLAG_POLITIQUE = { 'conditions-service': 'afficherConditions', confidentialite: 'afficherConfidentialite', 'retour-remboursement': 'afficherRetours', expedition: 'afficherLivraison', 'mentions-legales': 'afficherMentions', coordonnees: 'afficherCoordonnees' };

async function siteConfig(gid) {
  const r = await pool.query("SELECT template_id, config FROM sites WHERE gestionnaire_id = $1 AND template_id LIKE 'boutique-%' LIMIT 1", [gid]);
  let c = r.rows[0] && r.rows[0].config;
  if (typeof c === 'string') { try { c = JSON.parse(c); } catch (e) { c = null; } }
  // La config du site vit sous la clé de son template : « simplisse » pour Simplisse, « simple » pour le Mono-produit, « complete » pour la Boutique Complète, « premium » pour les autres (comportement d'origine)
  const t = String((r.rows[0] && r.rows[0].template_id) || '');
  const cle = t === 'boutique-simple' ? 'simple' : t === 'boutique-complete' ? 'complete' : t === 'boutique-catalogue' ? 'avance' : t === 'boutique-agricole' ? 'ferme' : t === 'boutique-artisan' ? 'artisan' : t.startsWith('boutique-simplisse-mode') ? 'mode' : (t.startsWith('boutique-simplisse') && !t.startsWith('boutique-simplisse-mode')) ? 'simplisse' : 'premium';   // Mono-produit et Complète : comparaison EXACTE
  return (c && typeof c[cle] === 'object' && c[cle]) || {};
}
const valeursTexte = (o) => Object.values(o || {}).filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()).join(' — ');

// Cherche dans le contenu PUBLIC de la boutique. Retourne des sections { type, titre, contenu, pageTitre, nav, score }.
async function rechercher(gid, mots, src) {
  if (!mots.length) return [];
  const on = (k, ...alias) => [k, ...alias].every((x) => src[x] === undefined || src[x] !== false);
  const motifs = motifsLike(mots);
  const sections = [];
  const premium = await siteConfig(gid);
  const masques = Array.isArray(premium.menu && premium.menu.masques) ? premium.menu.masques : [];
  const taches = [];

  if (on('produits')) taches.push((async () => {
    const devise = await EXP.deviseDe(pool, gid);
    const { rows } = await pool.query(
      `SELECT p.id, p.titre, p.description, p.prix, ${O.sqlPromo('p')} AS prix_promo, p.stock, sc.nom AS categorie_nom
         FROM produits p LEFT JOIN studio_categories sc ON sc.id = p.categorie_id
        WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.statut = 'actif'
          AND (p.date_parution IS NULL OR p.date_parution <= NOW()) AND (p.date_expiration IS NULL OR p.date_expiration > NOW())
          AND (${conditionLike(['p.titre', 'p.description', 'sc.nom'], mots.length)})
        LIMIT 60`, [gid, ...motifs]);
    for (const p of rows) {
      const score = scoreTexte(p.titre, `${p.description || ''} ${p.categorie_nom || ''}`, mots);
      if (score <= 0) continue;
      const promo = p.prix_promo !== null && p.prix_promo !== undefined && Number(p.prix_promo) > 0;
      const prix = promo ? `${EXP.montant(p.prix_promo, devise)} (rabais)` : EXP.montant(p.prix, devise);
      const epuise = p.stock !== null && p.stock !== undefined && Number(p.stock) <= 0;
      const desc = apercu(texteSimple(p.description || ''), 220);
      sections.push({ type: 'produit', titre: p.titre, score, contenu: `${desc ? desc + ' — ' : ''}Prix : ${prix}${epuise ? ' · Épuisé' : ''}`, pageTitre: p.titre, nav: { page: 'produit', produitId: p.id } });
    }
  })());

  if (on('politiques', 'pages')) taches.push((async () => {
    const flags = (premium.footer && premium.footer.politiques) || {};
    const { rows } = await pool.query(
      `SELECT slug, titre, contenu FROM politiques_gestionnaire WHERE gestionnaire_id = $1 AND contenu IS NOT NULL AND contenu <> '' AND (${conditionLike(['titre', 'contenu'], mots.length)}) LIMIT 20`, [gid, ...motifs]);
    for (const pg of rows) {
      if (FLAG_POLITIQUE[pg.slug] && flags[FLAG_POLITIQUE[pg.slug]] === false) continue;   // politique masquée dans le pied de page du site
      for (const s of sectionsParTitres(pg.contenu, mots, 2)) sections.push({ type: 'politique', titre: s.titre, contenu: s.contenu, score: s.score, pageTitre: pg.titre, nav: { page: 'politique', politiqueSlug: pg.slug } });
    }
  })());

  if (on('faq') && !masques.includes('faq')) {
    const items = Array.isArray(premium.faq && premium.faq.items) ? premium.faq.items : [];
    for (const it of items) {
      if (!it || typeof it.question !== 'string' || typeof it.reponse !== 'string' || !it.question.trim() || !it.reponse.trim()) continue;
      const score = scoreTexte(it.question, it.reponse, mots);
      if (score > 0) sections.push({ type: 'faq', titre: it.question.trim(), contenu: apercu(texteSimple(it.reponse), 400), score, pageTitre: 'FAQ', nav: { page: 'faq' } });
    }
  }

  if (on('apropos') && !masques.includes('a-propos') && premium.aPropos && typeof premium.aPropos === 'object') {
    const ap = premium.aPropos;
    const blocs = [];
    const intro = [ap.titre, ap.sousTitre, ap.accroche].filter((x) => typeof x === 'string' && x.trim()).join(' — ');
    if (intro) blocs.push({ titre: (typeof ap.titre === 'string' && ap.titre.trim()) || 'À propos', contenu: intro });
    if (ap.afficherValeurs !== false && Array.isArray(ap.valeurs)) for (const v of ap.valeurs) { const t = valeursTexte(v); if (t) blocs.push({ titre: (v && v.titre) || 'Nos valeurs', contenu: (v && v.desc) || t }); }
    if (ap.afficherChiffres !== false && Array.isArray(ap.chiffres)) { const t = ap.chiffres.map(valeursTexte).filter(Boolean).join(' · '); if (t) blocs.push({ titre: 'Nos chiffres', contenu: t }); }
    if (ap.afficherEquipe !== false && Array.isArray(ap.equipe)) for (const m of ap.equipe) { const t = valeursTexte(m); if (t) blocs.push({ titre: [m && m.prenom, m && m.nom].filter(Boolean).join(' ') || 'Notre équipe', contenu: t }); }
    for (const b of blocs) {
      const score = scoreTexte(b.titre, b.contenu, mots);
      if (score > 0) sections.push({ type: 'apropos', titre: String(b.titre), contenu: apercu(texteSimple(String(b.contenu)), 400), score, pageTitre: 'À propos', nav: { page: 'a-propos' } });
    }
  }

  if (on('blog') && !masques.includes('blog')) taches.push((async () => {
    for (const a of await BL.chercher(gid, mots, 20)) {
      const meilleure = sectionsParTitres(a.contenu, mots, 1)[0];
      const corps = meilleure ? meilleure.contenu : texteSimple(a.contenu);
      const score = scoreTexte(a.titre, `${corps} ${(a.tags || []).join(' ')}`, mots) + (meilleure ? meilleure.score : 0);
      if (score <= 0) continue;
      sections.push({ type: 'blog', titre: a.titre, contenu: apercu(a.extrait && !meilleure ? a.extrait : corps, 320), score, pageTitre: 'Blog', nav: { page: 'article', articleSlug: a.slug } });
    }
  })());

  await Promise.all(taches);
  return sections;
}

const choisir = (l, defaut) => { const t = Array.isArray(l) && l.length ? l : [defaut]; return t[Math.floor(Math.random() * t.length)]; };
async function journal(gid, session, question, reponse, score, ip, ua) {
  await pool.query('INSERT INTO chatbot_conversations (gestionnaire_id, session_id, question, reponse, score, ip, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [gid, session ? String(session).slice(0, 64) : null, question, reponse, score, ip ? String(ip).slice(0, 64) : null, ua || null]);
}
const EMOJI = { produit: '🛍️', politique: '📜', faq: '❓', apropos: 'ℹ️', blog: '📝' };

// Une question de visiteur → { reponse, menu_choix?, pages?, found, … }
async function repondre(gid, question, session, ip, ua) {
  if (!(await autorise(gid))) return { reponse: null, error: 'Le chatbot est temporairement désactivé' };
  const cfgR = await pool.query('SELECT actif, sources_contenu, score_minimum, max_resultats, transition_phrases, erreur_phrases, fin_phrases, suggestions_defaut, max_caracteres_question FROM chatbot_config_gestionnaire WHERE gestionnaire_id = $1', [gid]);
  const cfg = cfgR.rows[0];
  if (!cfg || !cfg.actif) return { reponse: null, error: 'Le chatbot est temporairement désactivé' };
  const q = String(question || '').trim();
  const maxQ = Math.min(500, cfg.max_caracteres_question || 500);
  if (q.length < 3) return { reponse: null, error: 'Posez-moi une question sur cette boutique.' };
  if (q.length > maxQ) return { reponse: null, error: `Votre question est trop longue (max ${maxQ} caractères).` };

  const noire = await checkListeNoire(q, gid);
  if (noire) { await journal(gid, session, q, noire.message, 0, ip, ua); return { reponse: noire.message, found: true, blacklist: true }; }

  const rapide = await checkReponseRapide(q, gid);
  if (rapide) { await journal(gid, session, q, rapide.reponse, 1, ip, ua); return { reponse: rapide.reponse, menu_choix: rapide.menu_choix || null, found: true, direct: true }; }

  const perso = await checkSourcePerso(q, gid);
  if (perso) {
    const titre = perso.titre || 'Source spécifique';
    const reponse = `📚 ${titre}\n\n${perso.description || 'Voici la source qui correspond à votre recherche :'}`;
    await journal(gid, session, q, reponse, 0.9, ip, ua);
    return { reponse, lien: { url: perso.url_source, texte: 'Ouvrir' }, found: true, source_personnalisee: true };
  }

  const scoreMin = parseFloat(cfg.score_minimum); const seuil = Number.isFinite(scoreMin) ? scoreMin : 0.05;
  const maxRes = Math.min(10, Math.max(1, parseInt(cfg.max_resultats, 10) || 5));
  const toutes = await rechercher(gid, motsRecherche(q), cfg.sources_contenu || {});
  toutes.sort((a, b) => (b.score || 0) - (a.score || 0));
  const finales = toutes.filter((s) => s.type === 'produit' || Math.min(1, (s.score || 0) / 5) >= seuil).slice(0, maxRes);

  const erreurs = choisir(cfg.erreur_phrases, "😕 Je n'ai pas trouvé de réponse.");
  const suggestions = Array.isArray(cfg.suggestions_defaut) ? cfg.suggestions_defaut : [];
  if (!finales.length) {
    await journal(gid, session, q, null, 0, ip, ua);
    return { reponse: erreurs, suggestions, found: false };
  }
  let texte = `${choisir(cfg.transition_phrases, '📚 Voici ce que j\'ai trouvé :')}\n\n`;
  finales.forEach((s, i) => {
    texte += `${EMOJI[s.type] || '📄'} ${s.titre}\n${s.contenu}`;
    if (s.pageTitre && s.pageTitre !== s.titre) texte += `\n— ${s.pageTitre}`;
    texte += i < finales.length - 1 ? '\n\n---\n\n' : '\n\n';
  });
  texte += choisir(cfg.fin_phrases, '💡 Autre question ?');
  await journal(gid, session, q, texte, finales[0].score || 0, ip, ua);
  return { reponse: texte, pages: finales.map((s) => ({ titre: s.titre, pageTitre: s.pageTitre, nav: s.nav, type: s.type, score: s.score })), found: true, multiple_sources: finales.length > 1 };
}

module.exports = { CODE_ADDON, autorise, configGestionnaire, configPublique, majConfig, RD, LN, SP, stats, repondre, rechercher, motsRecherche, entier };