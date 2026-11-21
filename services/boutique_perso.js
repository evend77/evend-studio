// CHEMIN : services/boutique_perso.js
// e-Vend Studio — Add-on « Produits personnalisés » (boutique solo). Le gestionnaire définit, par produit, les champs que l'acheteur remplit (texte, liste, case,
// image) avec un supplément de prix facultatif, et les faces/zones de l'aperçu (recto, verso…). Tout est revalidé ICI : le navigateur ne décide jamais du prix,
// des valeurs permises ni des fichiers. Le texte est nettoyé (jamais interprété comme du HTML) ; les images sont vérifiées sur leur vrai contenu (JPEG/PNG/WebP).
// Tables : boutique_perso_config, boutique_perso_fichiers ; colonnes boutique_panier(.personnalisation, .perso_cle).

'use strict';

const crypto = require('crypto');
const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');
const { ErreurCommande } = require('./boutique_commandes_erreur');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const CODE_ADDON = 'personnalisation';
const MEDIA_URL = 'https://media.e-vend.ca';
const TYPES = ['texte', 'texte_long', 'liste', 'case', 'image', 'date', 'nombre', 'couleur'];
const TYPES_TEXTE = ['texte', 'texte_long', 'date', 'nombre'];   // s'impriment dans une zone de l'aperçu avec police et couleur
const FORMES = ['rect', 'arrondi', 'rond'];
const MAX_CHAMPS = 12, MAX_FACES = 4, MAX_ZONES = 6, MAX_OPTIONS = 20, MAX_COULEURS = 12, SUPPLEMENT_MAX = 1000;
const MAX_FICHIER = 5 * 1024 * 1024;
const JOURS_CONSERVATION = 7;

// Polices proposées (polices déjà présentes sur les appareils : aucun téléchargement de police, aucun suivi)
const POLICES = {
  sans: { nom: 'Moderne (Arial)', pile: 'Arial, Helvetica, sans-serif' },
  serif: { nom: 'Classique (Georgia)', pile: 'Georgia, "Times New Roman", serif' },
  mono: { nom: 'Machine à écrire', pile: '"Courier New", Courier, monospace' },
  impact: { nom: 'Gras (Impact)', pile: 'Impact, "Arial Black", sans-serif' },
  script: { nom: 'Manuscrite', pile: '"Brush Script MT", "Segoe Script", cursive' },
  trebuchet: { nom: 'Arrondie (Trebuchet)', pile: '"Trebuchet MS", Tahoma, sans-serif' },
  verdana: { nom: 'Large (Verdana)', pile: 'Verdana, Geneva, sans-serif' },
};

const refus = (m, s, extra) => { throw new ErreurBoutique(m, s || 400, extra); };
const refusAcheteur = (m, s) => { throw new ErreurCommande(m, s || 400, 'PERSO'); };
const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);
async function exigerAddon(gid) { if (!(await autorise(gid))) refus("L'option « Produits personnalisés » n'est pas activée pour votre boutique.", 403, { addon_inactif: true }); }

// ─── Texte : jamais de balise, de code ni de caractère invisible ──────────────
function nettoyerTexte(v, max, { lignes = false } = {}) {
  let s = typeof v === 'string' ? v : (typeof v === 'number' ? String(v) : '');
  s = s.normalize('NFC').replace(/[​-‏‪-‮⁠-⁤﻿]/g, '');   // invisibles et inversion de sens du texte
  s = s.replace(/\r\n?/g, '\n');
  s = lignes ? s.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '') : s.replace(/[\u0000-\u001f\u007f]/g, ' ');
  s = s.replace(/[<>`]/g, '');                               // pas de balise
  s = lignes ? s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/ ?\n ?/g, '\n') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}
const nombre = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const argent2 = (v) => Math.round(nombre(v, 0, SUPPLEMENT_MAX, 0) * 100) / 100;
const idCourt = (v) => { const s = typeof v === 'string' ? v.trim() : ''; return /^[a-z0-9_]{1,16}$/i.test(s) ? s : crypto.randomBytes(4).toString('hex'); };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function dateIso(v) {   // 'AAAA-MM-JJ' réelle (le 31 février est refusé) ou null
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [a, m, j] = v.split('-').map(Number); const d = new Date(Date.UTC(a, m - 1, j));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j && a >= 1900 && a <= 2200 ? v : null;
}
const dateLongue = (v) => { const [a, m, j] = v.split('-').map(Number); return `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}`; };
const hex = (v) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim()) ? v.trim().toLowerCase() : null);

// Photos de faces : envoyées par CE gestionnaire (même règle que les photos de produits)
const PHOTO_RE = /^https:\/\/media\.e-vend\.ca\/[A-Za-z0-9_\-./%]+\.(jpe?g|png|webp|gif|avif)$/i;
function urlPhoto(gid, v) {
  if (typeof v !== 'string' || !PHOTO_RE.test(v) || v.includes('..')) refus("Photo de face invalide (utilisez le bouton d'envoi).");
  const propre = /^https:\/\/media\.e-vend\.ca\/studio\/boutique\/(\d+)\//.exec(v);
  if (propre && Number(propre[1]) !== gid) refus("Photo de face invalide (utilisez le bouton d'envoi).");
  return v;
}

// ─── Configuration (gestionnaire) ─────────────────────────────────────────────
function normaliserConfig(gid, b) {
  b = b || {};
  const facesIn = Array.isArray(b.faces) ? b.faces.slice(0, MAX_FACES) : [];
  const faces = []; const idsFaces = new Set(); const zones = new Map();
  for (const f of facesIn) {
    if (!f || typeof f !== 'object') continue;
    let id = idCourt(f.id); while (idsFaces.has(id)) id = crypto.randomBytes(4).toString('hex'); idsFaces.add(id);
    const zs = [];
    for (const z of (Array.isArray(f.zones) ? f.zones.slice(0, MAX_ZONES) : [])) {
      if (!z || typeof z !== 'object') continue;
      let zid = idCourt(z.id); while (zones.has(zid)) zid = crypto.randomBytes(4).toString('hex');
      const w = nombre(z.w, 3, 100, 30), hh = nombre(z.h, 3, 100, 20);
      const x = nombre(z.x, 0, 100 - w, 0), y = nombre(z.y, 0, 100 - hh, 0);
      const zone = { id: zid, nom: nettoyerTexte(z.nom, 30) || 'Zone', x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, w: Math.round(w * 100) / 100, h: Math.round(hh * 100) / 100, forme: FORMES.includes(z.forme) ? z.forme : 'rect' };
      zones.set(zid, f); zs.push(zone);
    }
    faces.push({ id, nom: nettoyerTexte(f.nom, 30) || `Face ${faces.length + 1}`, photo_url: urlPhoto(gid, f.photo_url), zones: zs });
  }
  const champsIn = Array.isArray(b.champs) ? b.champs.slice(0, MAX_CHAMPS) : [];
  const champs = []; const ids = new Set(); const idMap = new Map();
  for (const c of champsIn) {
    if (!c || typeof c !== 'object' || !TYPES.includes(c.type)) refus('Type de champ invalide.');
    const libelle = nettoyerTexte(c.libelle, 80);
    if (!libelle) refus('Chaque champ doit avoir un libellé.');
    let id = idCourt(c.id); while (ids.has(id)) id = crypto.randomBytes(4).toString('hex'); ids.add(id);
    const out = { id, type: c.type, libelle, aide: nettoyerTexte(c.aide, 200), obligatoire: c.obligatoire === true };
    if (TYPES_TEXTE.includes(c.type)) {
      if (c.type === 'texte' || c.type === 'texte_long') out.max = Math.round(nombre(c.max, 1, 500, c.type === 'texte' ? 40 : 300));
      if (c.type === 'date') {
        out.min = dateIso(c.min) || ''; out.max = dateIso(c.max) || '';
        if (out.min && out.max && out.min > out.max) refus(`Le champ « ${libelle} » : la date minimale doit précéder la date maximale.`);
      }
      if (c.type === 'nombre') {
        out.entier = c.entier !== false;
        out.min = Math.round(nombre(c.min, -1000000, 1000000, 0) * 100) / 100; out.max = Math.round(nombre(c.max, -1000000, 1000000, 9999) * 100) / 100;
        if (out.min > out.max) refus(`Le champ « ${libelle} » : le minimum doit être inférieur au maximum.`);
      }
      const polices = (Array.isArray(c.polices) ? c.polices : []).filter((k) => typeof k === 'string' && POLICES[k]);
      out.polices = polices.length ? [...new Set(polices)] : ['sans'];
      const couleurs = [...new Set((Array.isArray(c.couleurs) ? c.couleurs : []).map(hex).filter(Boolean))].slice(0, MAX_COULEURS);
      out.couleurs = couleurs.length ? couleurs : ['#000000', '#ffffff'];
      out.supplement = argent2(c.supplement);
    } else if (c.type === 'liste') {
      const opts = [];
      for (const o of (Array.isArray(c.options) ? c.options.slice(0, MAX_OPTIONS) : [])) {
        const l = nettoyerTexte(o && o.libelle, 60); if (!l) continue;
        let oid = idCourt(o.id); while (opts.some((x) => x.id === oid)) oid = crypto.randomBytes(3).toString('hex');
        opts.push({ id: oid, libelle: l, supplement: argent2(o.supplement) });
      }
      if (opts.length < 2) refus(`Le champ « ${libelle} » doit avoir au moins 2 choix.`);
      out.options = opts;
    } else if (c.type === 'couleur') {
      if (champs.some((x) => x.type === 'couleur')) refus('Un seul champ « Couleur du produit » par produit.');
      const opts = [];
      for (const o of (Array.isArray(c.options) ? c.options.slice(0, MAX_COULEURS) : [])) {
        const l = nettoyerTexte(o && o.libelle, 40); if (!l) continue;
        let oid = idCourt(o.id); while (opts.some((x) => x.id === oid)) oid = crypto.randomBytes(3).toString('hex');
        const photos = {};
        if (o.photos && typeof o.photos === 'object' && !Array.isArray(o.photos)) for (const fid of Object.keys(o.photos)) { if (idsFaces.has(fid) && o.photos[fid]) photos[fid] = urlPhoto(gid, o.photos[fid]); }
        opts.push({ id: oid, libelle: l, hex: hex(o.hex) || '#cccccc', supplement: argent2(o.supplement), photos });
      }
      if (opts.length < 2) refus(`Le champ « ${libelle} » doit avoir au moins 2 couleurs.`);
      out.options = opts;
    } else if (c.type === 'case') { out.supplement = argent2(c.supplement); }
    else if (c.type === 'image') { out.supplement = argent2(c.supplement); }
    if (TYPES_TEXTE.includes(c.type) || c.type === 'image') {
      const z = typeof c.zone === 'string' ? c.zone : '';
      out.zone = z && zones.has(z) ? z : null;
    }
    if (c.si && typeof c.si === 'object') out.__si = c.si;
    idMap.set(typeof c.id === 'string' ? c.id.trim() : '', id);
    champs.push(out);
  }
  // Affichage conditionnel : « afficher seulement si <champ précédent> = <valeur> » (un champ ne peut dépendre que d'un champ placé AVANT lui : pas de boucle possible)
  champs.forEach((c, i) => {
    const si = c.__si; delete c.__si; if (!si) return;
    const ref = champs.slice(0, i).find((x) => x.id === idMap.get(typeof si.champ === 'string' ? si.champ.trim() : ''));
    if (!ref) refus(`Le champ « ${c.libelle} » dépend d'un champ qui doit se trouver avant lui.`);
    let valeur;
    if (ref.type === 'case') valeur = 'oui';
    else if (ref.type === 'liste' || ref.type === 'couleur') { if (!ref.options.some((o) => o.id === si.valeur)) refus(`Le champ « ${c.libelle} » : choix de condition invalide.`); valeur = si.valeur; }
    else valeur = '*';
    c.si = { champ: ref.id, valeur };
  });
  return { actif: b.actif !== false, champs, faces };
}

async function produitDe(gid, pid) {
  const p = (await pool.query('SELECT id, titre, photo_principale FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL', [pid, gid])).rows[0];
  if (!p) refus('Produit introuvable.', 404);
  return p;
}

async function etat(gid) {
  if (!(await autorise(gid))) return { addon_actif: false, produits: [], polices: [] };
  const r = await pool.query(
    `SELECT p.id, p.titre, p.photo_principale, p.statut, c.actif AS perso_actif, COALESCE(jsonb_array_length(c.champs), 0) AS nb_champs
       FROM produits p LEFT JOIN boutique_perso_config c ON c.produit_id = p.id
      WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL ORDER BY (c.produit_id IS NULL), p.titre LIMIT 1000`, [gid]);
  return { addon_actif: true, produits: r.rows, polices: Object.entries(POLICES).map(([cle, v]) => ({ cle, nom: v.nom, pile: v.pile })) };
}

async function lireConfig(gid, pid) {
  await exigerAddon(gid);
  const p = await produitDe(gid, pid);
  const c = (await pool.query('SELECT actif, champs, faces FROM boutique_perso_config WHERE produit_id = $1 AND gestionnaire_id = $2', [pid, gid])).rows[0];
  return { produit: p, config: c ? { actif: c.actif, champs: c.champs, faces: c.faces } : { actif: true, champs: [], faces: [] }, existe: !!c };
}

async function enregistrerConfig(gid, pid, body) {
  await exigerAddon(gid);
  await produitDe(gid, pid);
  const c = normaliserConfig(gid, body);
  if (c.actif && !c.champs.length) refus('Ajoutez au moins un champ avant de rendre la personnalisation active.');
  await pool.query(
    `INSERT INTO boutique_perso_config (produit_id, gestionnaire_id, actif, champs, faces, updated_at) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,NOW())
     ON CONFLICT (produit_id) DO UPDATE SET actif = EXCLUDED.actif, champs = EXCLUDED.champs, faces = EXCLUDED.faces, updated_at = NOW()`,
    [pid, gid, c.actif, JSON.stringify(c.champs), JSON.stringify(c.faces)]);
  return lireConfig(gid, pid);
}

async function supprimerConfig(gid, pid) {
  await exigerAddon(gid);
  await pool.query('DELETE FROM boutique_perso_config WHERE produit_id = $1 AND gestionnaire_id = $2', [pid, gid]);
  return { ok: true };
}

/** Ce que voit l'acheteur sur la page produit. null si l'add-on est inactif ou si le produit n'est pas personnalisable. */
async function configPublique(gid, pid) {
  if (!(await autorise(gid))) return null;
  const c = (await pool.query(
    `SELECT c.actif, c.champs, c.faces FROM boutique_perso_config c JOIN produits p ON p.id = c.produit_id
      WHERE c.produit_id = $1 AND c.gestionnaire_id = $2 AND p.collaborateur_id IS NULL`, [pid, gid])).rows[0];
  if (!c || !c.actif || !Array.isArray(c.champs) || !c.champs.length) return null;
  return { champs: c.champs, faces: c.faces, polices: Object.fromEntries(Object.entries(POLICES).map(([k, v]) => [k, v.pile])) };
}

// ─── Fichiers des acheteurs (images) ──────────────────────────────────────────
let s3 = null;
const client = () => s3 || (s3 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } }));
function extensionSelonContenu(b) {   // vrai contenu du fichier (jamais l'extension ni le type annoncé) ; pas de GIF (animé) ni de SVG (peut contenir du code)
  if (!b || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG' && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}
const MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now(); const l = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (l.length >= max) { compteurs.set(cle, l); return false; }
  l.push(now); compteurs.set(cle, l);
  if (compteurs.size > 20000) for (const [k, v] of compteurs) if (!v.length || now - v[v.length - 1] > fenetreMs) compteurs.delete(k);
  return true;
}

async function televerser(gid, acheteurId, fichier) {
  if (!(await autorise(gid))) refusAcheteur("Cette option n'est pas disponible.", 404);
  if (!limite(`bq-perso-up-${gid}-${acheteurId}`, 20, 60 * 60 * 1000)) refusAcheteur("Trop d'envois d'images. Réessayez plus tard.", 429);
  if (!fichier || !fichier.buffer) refusAcheteur('Aucun fichier reçu.');
  if (fichier.size > MAX_FICHIER) refusAcheteur('Image trop lourde (max 5 Mo).', 413);
  const ext = extensionSelonContenu(fichier.buffer);
  if (!ext) refusAcheteur('Format non accepté (JPEG, PNG ou WebP seulement).');
  const n = +(await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_perso_fichiers WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND created_at > NOW() - interval '1 day'`, [gid, acheteurId])).rows[0].n;
  if (n >= 60) refusAcheteur("Limite d'images atteinte pour aujourd'hui.", 429);
  const id = crypto.randomBytes(16).toString('hex');
  const cle = `studio/boutique/${gid}/perso/${id}.${ext}`;
  await client().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: fichier.buffer, ContentType: MIMES[ext] }));
  const url = `${MEDIA_URL}/${cle}`;
  const nom = nettoyerTexte(String(fichier.originalname || 'image').split(/[\\/]/).pop(), 60) || 'image';
  await pool.query('INSERT INTO boutique_perso_fichiers (id, gestionnaire_id, acheteur_id, cle, url, nom_original, mime, taille) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [id, gid, acheteurId, cle, url, nom, MIMES[ext], fichier.size]);
  return { id, url, nom };
}

/** Efface de R2 les images de plus de 7 jours qui ne sont dans aucun panier, « plus tard » ni commande. */
async function nettoyer() {
  const r = await pool.query(
    `SELECT f.id, f.cle FROM boutique_perso_fichiers f
      WHERE f.created_at < NOW() - ($1 || ' days')::interval
        AND NOT EXISTS (SELECT 1 FROM boutique_panier p WHERE p.gestionnaire_id = f.gestionnaire_id AND p.personnalisation IS NOT NULL AND p.personnalisation::text LIKE '%' || f.id || '%')
        AND NOT EXISTS (SELECT 1 FROM boutique_panier_plus_tard p WHERE p.gestionnaire_id = f.gestionnaire_id AND p.personnalisation IS NOT NULL AND p.personnalisation::text LIKE '%' || f.id || '%')
        AND NOT EXISTS (SELECT 1 FROM boutique_commandes c WHERE c.gestionnaire_id = f.gestionnaire_id AND c.created_at >= f.created_at AND c.articles::text LIKE '%' || f.id || '%')
      ORDER BY f.created_at LIMIT 200`, [String(JOURS_CONSERVATION)]);
  let n = 0;
  for (const f of r.rows) {
    try { await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: f.cle })); await pool.query('DELETE FROM boutique_perso_fichiers WHERE id = $1', [f.id]); n++; }
    catch (e) { console.error('[boutique_perso] nettoyage', f.id, e && e.message); }
  }
  return n;
}
function demarrerNettoyage() {
  if (process.env.PERSO_NETTOYAGE_DESACTIVE === '1') return;
  const tour = () => nettoyer().catch((e) => console.error('[boutique_perso] nettoyage', e && e.message));
  setTimeout(tour, 5 * 60 * 1000).unref();
  setInterval(tour, 6 * 60 * 60 * 1000).unref();
}

// ─── Validation des réponses de l'acheteur ────────────────────────────────────
/**
 * Relit la config du produit et valide les réponses. Retourne { perso, cle, supplementC } ; perso = null si le produit n'est pas personnalisable
 * ou si rien n'a été rempli (ligne ordinaire). Lève ErreurCommande (400) avec un message clair sinon.
 * `perso` est le cliché gardé dans le panier puis dans la commande : textes, choix, fichiers, supplément ET aperçu (faces/zones) tels qu'au moment de l'achat.
 */
async function valider(gid, produitId, reponses, acheteurId, db) {
  db = db || pool;
  if (!(await autorise(gid, db))) return { perso: null, cle: '', supplementC: 0 };
  const cfg = (await db.query('SELECT actif, champs, faces FROM boutique_perso_config WHERE produit_id = $1 AND gestionnaire_id = $2', [produitId, gid])).rows[0];
  if (!cfg || !cfg.actif || !Array.isArray(cfg.champs) || !cfg.champs.length) return { perso: null, cle: '', supplementC: 0 };
  const rep = reponses && typeof reponses === 'object' && !Array.isArray(reponses) ? reponses : {};
  const sortie = []; let supC = 0; const etatChamp = {}; let faces = cfg.faces;
  for (const c of cfg.champs) {
    if (c.si) { const e = etatChamp[c.si.champ]; if (!(c.si.valeur === '*' ? e !== undefined : e === c.si.valeur)) continue; }   // champ masqué : ignoré (même obligatoire)
    const r = rep[c.id] && typeof rep[c.id] === 'object' ? rep[c.id] : {};
    const manque = () => refusAcheteur(`Le champ « ${c.libelle} » est requis.`);
    const base = { id: c.id, type: c.type, libelle: c.libelle, zone: c.zone || null };
    const typo = () => ({ police: c.polices.includes(r.police) ? r.police : c.polices[0], couleur: c.couleurs.includes(hex(r.couleur)) ? hex(r.couleur) : c.couleurs[0] });
    const sup = () => { const x = Number(c.supplement) || 0; supC += Math.round(x * 100); return x; };
    if (c.type === 'texte' || c.type === 'texte_long') {
      const v = nettoyerTexte(r.valeur, c.max || (c.type === 'texte' ? 40 : 300), { lignes: c.type === 'texte_long' });
      if (!v) { if (c.obligatoire) manque(); continue; }
      const t = typo(); const x = sup(); etatChamp[c.id] = '*';
      sortie.push({ ...base, affichage: v, ...t, supplement: x });
    } else if (c.type === 'date') {
      if (r.valeur === undefined || r.valeur === null || r.valeur === '') { if (c.obligatoire) manque(); continue; }
      const d = dateIso(r.valeur); if (!d) refusAcheteur(`La date du champ « ${c.libelle} » est invalide.`);
      if ((c.min && d < c.min) || (c.max && d > c.max)) refusAcheteur(`La date du champ « ${c.libelle} » doit être ${c.min && c.max ? `entre le ${dateLongue(c.min)} et le ${dateLongue(c.max)}` : c.min ? `à partir du ${dateLongue(c.min)}` : `au plus tard le ${dateLongue(c.max)}`}.`);
      const t = typo(); const x = sup(); etatChamp[c.id] = '*';
      sortie.push({ ...base, affichage: dateLongue(d), ...t, supplement: x });
    } else if (c.type === 'nombre') {
      if (r.valeur === undefined || r.valeur === null || String(r.valeur).trim() === '') { if (c.obligatoire) manque(); continue; }
      const n = Number(String(r.valeur).trim().replace(',', '.'));
      if (!Number.isFinite(n) || (c.entier !== false && !Number.isInteger(n))) refusAcheteur(`Le champ « ${c.libelle} » doit être ${c.entier !== false ? 'un nombre entier' : 'un nombre'}.`);
      if (n < c.min || n > c.max) refusAcheteur(`Le champ « ${c.libelle} » doit être entre ${c.min} et ${c.max}.`);
      const t = typo(); const x = sup(); etatChamp[c.id] = '*';
      sortie.push({ ...base, affichage: String(Math.round(n * 100) / 100), ...t, supplement: x });
    } else if (c.type === 'liste' || c.type === 'couleur') {
      const o = c.options.find((x) => x.id === r.valeur);
      if (!o) { if (c.obligatoire) manque(); continue; }
      const x = Number(o.supplement) || 0; supC += Math.round(x * 100); etatChamp[c.id] = o.id;
      if (c.type === 'couleur') {
        faces = cfg.faces.map((f) => (o.photos && o.photos[f.id] ? { ...f, photo_url: o.photos[f.id] } : f));   // le cliché garde la photo de la couleur choisie
        sortie.push({ ...base, affichage: o.libelle, option: o.id, hex: o.hex, supplement: x });
      } else sortie.push({ ...base, affichage: o.libelle, option: o.id, supplement: x });
    } else if (c.type === 'case') {
      if (r.valeur !== true) { if (c.obligatoire) refusAcheteur(`Veuillez cocher « ${c.libelle} ».`); continue; }
      const x = sup(); etatChamp[c.id] = 'oui';
      sortie.push({ ...base, affichage: 'Oui', supplement: x });
    } else if (c.type === 'image') {
      const fid = typeof r.fichier === 'string' && /^[a-f0-9]{32}$/.test(r.fichier) ? r.fichier : null;
      if (!fid) { if (c.obligatoire) manque(); continue; }
      const f = (await db.query('SELECT id, url, nom_original FROM boutique_perso_fichiers WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3', [fid, gid, acheteurId])).rows[0];
      if (!f) refusAcheteur(`L'image du champ « ${c.libelle} » est introuvable. Envoyez-la de nouveau.`);
      const x = sup(); etatChamp[c.id] = '*';
      sortie.push({ ...base, affichage: f.nom_original || 'image', fichier: f.id, url: f.url, dx: nombre(r.dx, -100, 100, 0), dy: nombre(r.dy, -100, 100, 0), zoom: nombre(r.zoom, 0.3, 4, 1), supplement: x });
    }
  }
  if (!sortie.length) return { perso: null, cle: '', supplementC: 0 };
  const cle = crypto.createHash('sha256').update(JSON.stringify(sortie.map((s) => [s.id, s.affichage, s.police || '', s.couleur || '', s.fichier || '', s.dx || 0, s.dy || 0, s.zoom || 1]))).digest('hex').slice(0, 32);
  const perso = { v: 1, champs: sortie, faces, supplement: supC / 100 };
  return { perso, cle, supplementC: supC };
}

module.exports = {
  CODE_ADDON, POLICES, TYPES, TYPES_TEXTE, autorise, exigerAddon, etat, lireConfig, enregistrerConfig, supprimerConfig, configPublique,
  televerser, nettoyer, demarrerNettoyage, valider, nettoyerTexte, extensionSelonContenu, normaliserConfig, _limites: compteurs,
};