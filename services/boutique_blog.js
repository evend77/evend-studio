// CHEMIN : services/boutique_blog.js
// e-Vend Studio — Blog des templates boutique (solo). Inspiré du blog d'e-Vend (routes/blogPlateforme + pages Blog / BlogArticle) ;
// ne touche à rien d'autre : table boutique_blog_articles, une seule par gestionnaire (un gestionnaire = une boutique).
//
// Règles :
//  • Le gestionnaire écrit en HTML ou en texte brut ; le contenu est TOUJOURS nettoyé ici (sanitize-html) avant d'être enregistré,
//    car il s'affiche tel quel sur le site public.
//  • Un article est PUBLIC seulement si statut = 'publie' ET date_publication <= maintenant (date future = publication programmée).
//  • La liste publique ne renvoie jamais le contenu (léger, paginée) ; l'article complet se charge par son slug.
//  • Le slug est fabriqué à partir du titre, unique par gestionnaire (-2, -3… si besoin) et ne change plus après la création.

'use strict';

const pool = require('../db');
const sanitizeHtml = require('sanitize-html');
const { ErreurBoutique } = require('./boutique_limites');

const STATUTS = ['brouillon', 'publie', 'archive'];
const PAR_PAGE_GEST = 15;
const PAR_PAGE_PUBLIC = 12;
const MAX_ARTICLES = 2000;        // plafond de sécurité par gestionnaire
const TITRE_MAX = 200, EXTRAIT_MAX = 400, AUTEUR_MAX = 100, CONTENU_MAX = 200000, MAX_TAGS = 10, TAG_MAX = 30;

const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

// ── Texte / HTML ──
const sansAccents = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
function slugifier(titre) {
  const s = sansAccents(titre).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  return s || 'article';
}
function echapper(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Texte brut → HTML (paragraphes sur lignes vides, retours simples en <br>) ; le HTML déjà écrit est gardé tel quel (puis nettoyé)
function texteVersHtml(t) {
  const s = String(t || '').trim();
  if (!s) return '';
  if (/^<[a-zA-Z!]/.test(s)) return s;
  return s.split(/\n{2,}/).map((p) => `<p>${echapper(p.trim()).replace(/\n/g, '<br />')}</p>`).join('\n');
}

const OPTIONS_HTML = {
  allowedTags: ['h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'span', 'div'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['https', 'http', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tag, attribs) => ({ tagName: 'a', attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' } }),
    h1: 'h2',
  },
};
function nettoyerContenu(t) {
  const html = sanitizeHtml(texteVersHtml(t), OPTIONS_HTML).trim();
  if (html.length > CONTENU_MAX) refus(`L'article est trop long (maximum ${CONTENU_MAX} caractères).`);
  return html;
}
function texteSimple(html) {
  return sanitizeHtml(String(html || '').replace(/<\/(p|h[1-6]|li|div|tr|td|th|blockquote|figcaption)>|<br\s*\/?>/gi, ' '), { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
function court(s, max) { return s.length > max ? s.slice(0, max).replace(/\s+\S*$/, '') + '…' : s; }

function lireTexte(v, nom, max, requis) {
  if (v === undefined || v === null || v === '') { if (requis) refus(`${nom} est obligatoire.`); return null; }
  if (typeof v !== 'string') refus(`${nom} invalide.`);
  const t = sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} }).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  if (!t) { if (requis) refus(`${nom} est obligatoire.`); return null; }
  if (t.length > max) refus(`${nom} : ${max} caractères maximum.`);
  return t;
}
function lireTags(v) {
  if (v === undefined || v === null) return null;
  const liste = Array.isArray(v) ? v : String(v).split(',');
  const propres = [...new Set(liste.map((x) => texteSimple(String(x)).slice(0, TAG_MAX)).filter(Boolean))];
  if (propres.length > MAX_TAGS) refus(`Maximum ${MAX_TAGS} balises.`);
  return propres;
}
// Photo de couverture : envoyée via /api/boutique/gestionnaire/upload (même règle que les photos de produits) ou reprise d'e-Vend
const PHOTO_RE = /^https:\/\/media\.e-vend\.ca\/[A-Za-z0-9_\-./%]+\.(jpe?g|png|webp|gif|avif)$/i;
function lirePhoto(v, gid) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string' || !PHOTO_RE.test(v) || v.includes('..')) refus("Image invalide (utilisez le bouton d'envoi).");
  const propre = /\/studio\/boutique\/(\d+)\//.exec(v);
  if (propre && Number(propre[1]) !== gid) refus("Image invalide (utilisez le bouton d'envoi).");
  return v;
}
function lireDate(v) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(v);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) refus('Date de publication invalide.');
  return d;
}

async function slugLibre(c, gid, titre, sauf) {
  const base = slugifier(titre);
  for (let i = 1; i < 500; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const r = await c.query('SELECT 1 FROM boutique_blog_articles WHERE gestionnaire_id = $1 AND slug = $2 AND ($3::bigint IS NULL OR id <> $3)', [gid, slug, sauf || null]);
    if (!r.rowCount) return slug;
  }
  return `${base}-${Date.now()}`;
}

// ── Gestionnaire ──
const COLS_LISTE = 'id, titre, slug, extrait, image_couverture, auteur, tags, statut, date_publication, vues, created_at, updated_at';

async function stats(gid) {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE statut = 'publie' AND (date_publication IS NULL OR date_publication <= NOW()))::int AS publies,
            COUNT(*) FILTER (WHERE statut = 'publie' AND date_publication > NOW())::int AS programmes,
            COUNT(*) FILTER (WHERE statut = 'brouillon')::int AS brouillons,
            COUNT(*) FILTER (WHERE statut = 'archive')::int AS archives
       FROM boutique_blog_articles WHERE gestionnaire_id = $1`, [gid]);
  return r.rows[0];
}

async function lister(gid, { statut, q, page } = {}) {
  const p = Math.max(1, entier(page) || 1);
  const params = [gid];
  let cond = 'gestionnaire_id = $1';
  if (STATUTS.includes(statut)) { params.push(statut); cond += ` AND statut = $${params.length}`; }
  const terme = texteSimple(q || '').slice(0, 80);
  if (terme) { params.push('%' + terme.replace(/[\\%_]/g, '\\$&') + '%'); cond += ` AND (titre ILIKE $${params.length} OR extrait ILIKE $${params.length})`; }
  const total = (await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_blog_articles WHERE ${cond}`, params)).rows[0].n;
  const lignes = (await pool.query(
    `SELECT ${COLS_LISTE} FROM boutique_blog_articles WHERE ${cond} ORDER BY COALESCE(date_publication, created_at) DESC, id DESC LIMIT ${PAR_PAGE_GEST} OFFSET ${(p - 1) * PAR_PAGE_GEST}`, params)).rows;
  return { total, page: p, pages: Math.max(1, Math.ceil(total / PAR_PAGE_GEST)), stats: await stats(gid), articles: lignes };
}

async function lire(gid, id) {
  const r = await pool.query('SELECT * FROM boutique_blog_articles WHERE id = $1 AND gestionnaire_id = $2', [id, gid]);
  if (!r.rowCount) refus('Article introuvable.', 404);
  return r.rows[0];
}

// Lecture + contrôle des champs d'un article (création : tout ; modification : seulement ce qui est envoyé)
function lireChamps(b, gid, creation) {
  const o = {};
  if (creation || b.titre !== undefined) o.titre = lireTexte(b.titre, 'Le titre', TITRE_MAX, true);
  if (b.contenu !== undefined) o.contenu = nettoyerContenu(b.contenu);
  else if (creation) o.contenu = '';
  if (b.extrait !== undefined) o.extrait = lireTexte(b.extrait, "L'extrait", EXTRAIT_MAX, false);
  if (b.auteur !== undefined) o.auteur = lireTexte(b.auteur, "L'auteur", AUTEUR_MAX, false);
  const tags = lireTags(b.tags); if (tags !== null) o.tags = tags;
  const photo = lirePhoto(b.image_couverture, gid); if (photo !== undefined) o.image_couverture = photo;
  const date = lireDate(b.date_publication); if (date !== undefined) o.date_publication = date;
  if (b.statut !== undefined) { if (!STATUTS.includes(b.statut)) refus('Statut invalide.'); o.statut = b.statut; }
  return o;
}
function verifierPublication(o, existant) {
  const statut = o.statut !== undefined ? o.statut : (existant ? existant.statut : 'brouillon');
  const contenu = o.contenu !== undefined ? o.contenu : (existant ? existant.contenu : '');
  if (statut === 'publie' && texteSimple(contenu).length < 10) refus("Écrivez le contenu de l'article avant de le publier.");
}

async function creer(gid, b) {
  const o = lireChamps(b || {}, gid, true);
  verifierPublication(o, null);
  const n = (await pool.query('SELECT COUNT(*)::int AS n FROM boutique_blog_articles WHERE gestionnaire_id = $1', [gid])).rows[0].n;
  if (n >= MAX_ARTICLES) refus(`Limite de ${MAX_ARTICLES} articles atteinte.`, 409);
  const statut = o.statut || 'brouillon';
  const date = statut === 'publie' ? (o.date_publication || new Date()) : (o.date_publication || null);
  const extrait = o.extrait || (o.contenu ? court(texteSimple(o.contenu), 200) || null : null);
  const slug = await slugLibre(pool, gid, o.titre);
  try {
    const r = await pool.query(
      `INSERT INTO boutique_blog_articles (gestionnaire_id, titre, slug, extrait, contenu, image_couverture, auteur, tags, statut, date_publication)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [gid, o.titre, slug, extrait, o.contenu, o.image_couverture || null, o.auteur || null, o.tags || [], statut, date]);
    return r.rows[0];
  } catch (e) {
    if (e && e.code === '23505') refus('Un article de ce titre vient d’être créé. Réessayez.', 409);
    throw e;
  }
}

async function modifier(gid, id, b) {
  const ex = await lire(gid, id);
  const o = lireChamps(b || {}, gid, false);
  if (!Object.keys(o).length) refus('Rien à modifier.');
  verifierPublication(o, ex);
  const sets = [], v = [];
  const poser = (col, val) => { v.push(val); sets.push(`${col} = $${v.length}`); };
  for (const col of ['titre', 'contenu', 'extrait', 'auteur', 'tags', 'image_couverture']) if (o[col] !== undefined) poser(col, o[col]);
  const statut = o.statut !== undefined ? o.statut : ex.statut;
  if (o.statut !== undefined) poser('statut', o.statut);
  if (o.date_publication !== undefined) poser('date_publication', o.date_publication);
  else if (statut === 'publie' && !ex.date_publication) poser('date_publication', new Date());
  if (o.contenu !== undefined && o.extrait === undefined && !ex.extrait) poser('extrait', court(texteSimple(o.contenu), 200) || null);
  sets.push('updated_at = NOW()');
  v.push(id, gid);
  const r = await pool.query(`UPDATE boutique_blog_articles SET ${sets.join(', ')} WHERE id = $${v.length - 1} AND gestionnaire_id = $${v.length} RETURNING *`, v);
  return r.rows[0];
}

async function supprimer(gid, id) {
  const r = await pool.query('DELETE FROM boutique_blog_articles WHERE id = $1 AND gestionnaire_id = $2 RETURNING id', [id, gid]);
  if (!r.rowCount) refus('Article introuvable.', 404);
}

// ── Public ──
const VISIBLE = `gestionnaire_id = $1 AND statut = 'publie' AND (date_publication IS NULL OR date_publication <= NOW())`;

async function listePublique(gid, page, limite) {
  const p = Math.max(1, entier(page) || 1);
  const lim = Math.min(24, Math.max(1, entier(limite) || PAR_PAGE_PUBLIC));
  const total = (await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_blog_articles WHERE ${VISIBLE}`, [gid])).rows[0].n;
  const r = await pool.query(
    `SELECT id, titre, slug, extrait, image_couverture, auteur, tags, COALESCE(date_publication, created_at) AS date_publication, vues
       FROM boutique_blog_articles WHERE ${VISIBLE} ORDER BY COALESCE(date_publication, created_at) DESC, id DESC LIMIT ${lim} OFFSET ${(p - 1) * lim}`, [gid]);
  return { total, page: p, pages: Math.max(1, Math.ceil(total / lim)), articles: r.rows };
}

async function articlePublic(gid, slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9-]{1,220}$/.test(slug)) refus('Article introuvable.', 404);
  const r = await pool.query(
    `SELECT id, titre, slug, extrait, contenu, image_couverture, auteur, tags, COALESCE(date_publication, created_at) AS date_publication, vues
       FROM boutique_blog_articles WHERE ${VISIBLE} AND slug = $2`, [gid, slug]);
  if (!r.rowCount) refus('Article introuvable.', 404);
  return r.rows[0];
}

// Compteur de vues : une vue par visiteur (IP) et par article toutes les heures
const vus = new Map();
async function compterVue(gid, id, ip) {
  const k = `${id}|${ip}`, n = Date.now(), t = vus.get(k);
  if (t && n - t < 3600000) return false;
  vus.set(k, n);
  if (vus.size > 20000) for (const [kk, tt] of vus) if (n - tt > 3600000) vus.delete(kk);
  await pool.query('UPDATE boutique_blog_articles SET vues = vues + 1 WHERE id = $1 AND gestionnaire_id = $2', [id, gid]);
  return true;
}

// Recherche pour le chatbot (étape suivante) : articles publics dont le titre, l'extrait, les balises ou le contenu contiennent un des mots
async function chercher(gid, mots, max) {
  if (!mots || !mots.length) return [];
  const params = [gid];
  const conds = mots.map((m) => { params.push('%' + sansAccents(m).toLowerCase().replace(/[\\%_]/g, '\\$&') + '%'); const i = params.length; return `(translate(lower(titre || ' ' || COALESCE(extrait,'') || ' ' || array_to_string(tags,' ') || ' ' || contenu), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy') LIKE $${i})`; });
  const r = await pool.query(
    `SELECT id, titre, slug, extrait, contenu, tags FROM boutique_blog_articles WHERE ${VISIBLE} AND (${conds.join(' OR ')}) LIMIT ${Math.min(40, max || 20)}`, params);
  return r.rows;
}

module.exports = { lister, lire, creer, modifier, supprimer, stats, listePublique, articlePublic, compterVue, chercher, nettoyerContenu, texteSimple, slugifier, STATUTS };