// CHEMIN : services/boutique_avis.js
// e-Vend Studio — Add-on « Avis clients » des templates boutique (solo). Inspiré de services/studio_avis.js et de routes/acheteur_dashboard.js (MV), sans y toucher.
// Différence avec le MV : ici l'avis porte sur un PRODUIT acheté (une ligne par acheteur, produit et commande) ; le gestionnaire est le vendeur : il modère ET répond.
// Tables : boutique_avis (les avis) et boutique_avis_config (réglages du gestionnaire) — créées par etape22_brancher_avis.sql. Accès : add-on « avis_clients » activé (A.addonActif).
//
// Qui peut évaluer un produit ? L'acheteur dont la commande est payée ET (livrée, OU expédiée depuis au moins N jours sans être marquée livrée — N réglable de 1 à 30, 14 par défaut,
//   toujours actif : le vendeur ne peut pas bloquer les avis en ne marquant jamais « livrée »). Fenêtre pour déposer l'avis : 30 à 365 jours (60 par défaut) après ce moment.
//   Un produit déjà remboursé par un retour ne peut pas être évalué. Un seul avis par produit et par commande.
// Cycle : « publie » (visible), « attente » (approbation du gestionnaire requise), « masque » (retiré par le gestionnaire, raison obligatoire). Un avis n'est jamais publié à la place du gestionnaire.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');
const Q = require('./boutique_questions');
const PH = require('./boutique_avis_photos');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'avis_clients';
const PAR_PAGE = 10;
const MAX_PHOTOS = 5;
const COMMENTAIRE_MIN = 5, COMMENTAIRE_MAX = 1500, TITRE_MAX = 120, REPONSE_MIN = 2, REPONSE_MAX = 1000;
const MAX_PAR_JOUR = 10;
const JOURS_ANCIEN = 3;   // un avis en attente depuis plus longtemps est mis en évidence chez le gestionnaire
const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };
const autorise = (gid) => A.addonActif(gid, CODE_ADDON);
async function exigerActif(gid) { if (!(await autorise(gid))) refus("L'option « Avis clients » n'est pas activée pour cette boutique.", 403); }
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

// ─── Réglages du gestionnaire ────────────────────────────────────────────────
const DEFAUT = { approbation_auto: true, photos_actif: true, titre_obligatoire: false, afficher_moyenne: true, delai_depot_jours: 60, delai_expedie_jours: 14 };
const BORNES = { delai_depot_jours: [30, 365], delai_expedie_jours: [1, 30] };

function nettoyerConfig(brut) {
  const out = {};
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return out;
  for (const cle of Object.keys(DEFAUT)) {
    if (brut[cle] === undefined) continue;
    if (typeof DEFAUT[cle] === 'boolean') { if (typeof brut[cle] === 'boolean') out[cle] = brut[cle]; }
    else {
      const n = Number(brut[cle]);
      if (!Number.isFinite(n)) continue;
      const [a, b] = BORNES[cle];
      out[cle] = Math.min(b, Math.max(a, Math.round(n)));
    }
  }
  return out;
}
async function lireConfig(gid) {
  let c = {};
  try { const r = await pool.query('SELECT config FROM boutique_avis_config WHERE gestionnaire_id = $1', [gid]); c = (r.rows[0] && r.rows[0].config) || {}; } catch (e) { c = {}; }
  return { ...DEFAUT, ...nettoyerConfig(c) };
}
async function enregistrerConfig(gid, brut) {
  await exigerActif(gid);
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) refus('Réglages invalides.');
  for (const cle of Object.keys(BORNES)) {
    if (brut[cle] === undefined) continue;
    const n = Number(brut[cle]); const [a, b] = BORNES[cle];
    if (!Number.isInteger(n) || n < a || n > b) refus(cle === 'delai_expedie_jours' ? `Le délai « expédiée depuis » doit être entre ${a} et ${b} jours.` : `Le délai pour déposer un avis doit être entre ${a} et ${b} jours.`);
  }
  const c = { ...(await lireConfig(gid)), ...nettoyerConfig(brut) };
  await pool.query(
    `INSERT INTO boutique_avis_config (gestionnaire_id, config, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET config = $2::jsonb, updated_at = NOW()`, [gid, JSON.stringify(c)]);
  return c;
}
async function reinitialiserConfig(gid) {
  await pool.query('DELETE FROM boutique_avis_config WHERE gestionnaire_id = $1', [gid]);
  return { ...DEFAUT };
}

// ─── Texte ───────────────────────────────────────────────────────────────────
function verifierTexte(brut, { min, max, nom, obligatoire }) {
  const t = Q.nettoyer(brut);
  if (!t) { if (obligatoire) refus(`${nom} est obligatoire.`); return ''; }
  if (t.length < min) refus(`${nom} est trop court (au moins ${min} caractères).`);
  if (t.length > max) refus(`${nom} est trop long (${max} caractères maximum).`);
  if (Q.contientCoordonnees(t)) refus("Pour votre sécurité, n'écrivez pas de courriel, de numéro de téléphone ou de lien dans ce texte.");
  return t;
}

// ─── Admissibilité : quels produits cet acheteur peut-il évaluer ? ────────────
function momentOuverture(cmd, reg) {
  if (cmd.statut === 'livree') return cmd.livree_le || cmd.expediee_le || cmd.paye_le || null;
  if (!cmd.expediee_le) return null;
  const d = new Date(new Date(cmd.expediee_le).getTime() + reg.delai_expedie_jours * 86400000);
  return d.getTime() <= Date.now() ? d : null;
}

/** Produits que l'acheteur peut évaluer maintenant (un par commande et produit, hors déjà évalués). `filtre` : { commandeId, produitId } pour une vérification précise. */
async function evaluables(gid, acheteurId, reg, filtre) {
  const cmds = (await pool.query(
    `SELECT id, numero_commande, articles, statut, livree_le, expediee_le, paye_le, created_at, total, rembourse
       FROM boutique_commandes
      WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND statut_paiement = 'paye' AND statut IN ('expediee','livree')
        ${filtre && filtre.commandeId ? 'AND id = $3' : ''}
      ORDER BY created_at DESC LIMIT 100`, filtre && filtre.commandeId ? [gid, acheteurId, filtre.commandeId] : [gid, acheteurId])).rows;
  if (!cmds.length) return [];
  const ids = cmds.map((c) => c.id);
  const rembourses = new Set();
  try {
    const rr = await pool.query(`SELECT commande_id, articles FROM boutique_retours WHERE commande_id = ANY($1::int[]) AND statut = 'rembourse'`, [ids]);
    for (const x of rr.rows) for (const a of (Array.isArray(x.articles) ? x.articles : [])) rembourses.add(`${x.commande_id}|${parseInt(a.produit_id, 10)}`);
  } catch (e) { /* aucune table de retours exploitable : on n'exclut rien */ }
  const deja = new Set((await pool.query('SELECT commande_id, produit_id FROM boutique_avis WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND commande_id = ANY($3::int[])', [gid, acheteurId, ids])).rows.map((x) => `${x.commande_id}|${x.produit_id}`));
  const produitsIds = new Set();
  for (const c of cmds) for (const a of (Array.isArray(c.articles) ? c.articles : [])) { const p = entier(a.produit_id); if (p) produitsIds.add(p); }
  if (!produitsIds.size) return [];
  const prods = new Map((await pool.query(
    `SELECT id, titre, photo_principale FROM produits WHERE id = ANY($1::int[]) AND gestionnaire_id = $2 AND collaborateur_id IS NULL`, [[...produitsIds], gid])).rows.map((p) => [p.id, p]));
  const out = [];
  for (const c of cmds) {
    if (Number(c.rembourse) >= Number(c.total) && Number(c.total) > 0) continue;
    const debut = momentOuverture(c, reg);
    if (!debut) continue;
    const limite = new Date(new Date(debut).getTime() + reg.delai_depot_jours * 86400000);
    if (limite.getTime() < Date.now()) continue;
    const vus = new Set();
    for (const a of (Array.isArray(c.articles) ? c.articles : [])) {
      const pid = entier(a.produit_id);
      if (!pid || vus.has(pid) || !prods.has(pid)) continue;
      if (filtre && filtre.produitId && filtre.produitId !== pid) continue;
      vus.add(pid);
      const cle = `${c.id}|${pid}`;
      if (deja.has(cle) || rembourses.has(cle)) continue;
      const p = prods.get(pid);
      out.push({ commande_id: c.id, numero_commande: c.numero_commande, produit_id: pid, titre: p.titre || a.titre, photo: p.photo_principale || a.image_url || null, variante: a.variante || null, limite_le: limite.toISOString() });
    }
  }
  return out;
}

// ─── Acheteur ────────────────────────────────────────────────────────────────
const COLS_ACHETEUR = `v.id, v.produit_id, v.commande_id, v.note, v.titre, v.commentaire, v.photos, v.statut, v.masque_raison, v.reponse, v.reponse_le, v.created_at, v.updated_at,
  p.titre AS produit_titre, p.photo_principale, c.numero_commande`;

async function etatAcheteur(gid, acheteurId) {
  if (!(await autorise(gid))) return { actif: false, a_evaluer: [], avis: [], config: null };
  const reg = await lireConfig(gid);
  const a_evaluer = await evaluables(gid, acheteurId, reg);
  const avis = (await pool.query(
    `SELECT ${COLS_ACHETEUR} FROM boutique_avis v LEFT JOIN produits p ON p.id = v.produit_id LEFT JOIN boutique_commandes c ON c.id = v.commande_id
      WHERE v.gestionnaire_id = $1 AND v.acheteur_id = $2 ORDER BY v.created_at DESC, v.id DESC LIMIT 200`, [gid, acheteurId])).rows;
  return { actif: true, a_evaluer, avis, config: { photos_actif: reg.photos_actif, titre_obligatoire: reg.titre_obligatoire, max_photos: MAX_PHOTOS, approbation_auto: reg.approbation_auto, commentaire_min: COMMENTAIRE_MIN, commentaire_max: COMMENTAIRE_MAX, titre_max: TITRE_MAX } };
}

function verifierPhotos(brut, reg, gid, acheteurId) {
  const liste = Array.isArray(brut) ? brut : [];
  if (!liste.length) return [];
  if (!reg.photos_actif) refus("Les photos ne sont pas acceptées pour les avis de cette boutique.");
  if (liste.length > MAX_PHOTOS) refus(`Maximum ${MAX_PHOTOS} photos par avis.`);
  const uniques = [...new Set(liste)];
  for (const u of uniques) if (!PH.urlValide(u, gid, acheteurId)) refus('Photo invalide. Utilisez le bouton d\'envoi.');
  return uniques;
}
function verifierNote(n) { const v = Number(n); if (!Number.isInteger(v) || v < 1 || v > 5) refus('Choisissez une note de 1 à 5 étoiles.'); return v; }

async function creer({ gid, acheteurId, produitId, commandeId, note, titre, commentaire, photos }) {
  await exigerActif(gid);
  const reg = await lireConfig(gid);
  const pid = entier(produitId), cid = entier(commandeId);
  if (!pid || !cid) refus('Produit ou commande invalide.');
  const n = verifierNote(note);
  const t = verifierTexte(titre, { min: 2, max: TITRE_MAX, nom: 'Le titre', obligatoire: reg.titre_obligatoire });
  const c = verifierTexte(commentaire, { min: COMMENTAIRE_MIN, max: COMMENTAIRE_MAX, nom: 'Votre commentaire', obligatoire: true });
  const ph = verifierPhotos(photos, reg, gid, acheteurId);
  const jour = (await pool.query(`SELECT COUNT(*)::int n FROM boutique_avis WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`, [gid, acheteurId])).rows[0].n;
  if (jour >= MAX_PAR_JOUR) refus("Vous avez déposé beaucoup d'avis aujourd'hui. Réessayez demain.", 429);
  const ok = await evaluables(gid, acheteurId, reg, { commandeId: cid, produitId: pid });
  if (!ok.length) {
    const deja = await pool.query('SELECT 1 FROM boutique_avis WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND commande_id = $3 AND produit_id = $4', [gid, acheteurId, cid, pid]);
    if (deja.rowCount) refus('Vous avez déjà évalué ce produit pour cette commande.', 409);
    refus("Vous ne pouvez pas évaluer ce produit pour le moment (la commande doit être livrée, ou expédiée depuis quelques jours, et le délai pour déposer un avis ne doit pas être dépassé).", 409);
  }
  const statut = reg.approbation_auto ? 'publie' : 'attente';
  const ins = await pool.query(
    `INSERT INTO boutique_avis (gestionnaire_id, acheteur_id, produit_id, commande_id, note, titre, commentaire, photos, statut)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) ON CONFLICT (acheteur_id, produit_id, commande_id) DO NOTHING RETURNING id`,
    [gid, acheteurId, pid, cid, n, t || null, c, JSON.stringify(ph), statut]);
  if (!ins.rowCount) refus('Vous avez déjà évalué ce produit pour cette commande.', 409);
  return { id: ins.rows[0].id, statut, message: statut === 'publie' ? 'Merci ! Votre avis est publié.' : "Merci ! Votre avis sera publié après vérification par la boutique." };
}

async function modifier({ gid, acheteurId, id, note, titre, commentaire, photos }) {
  await exigerActif(gid);
  const reg = await lireConfig(gid);
  const a = (await pool.query('SELECT id, statut, photos FROM boutique_avis WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3', [id, gid, acheteurId])).rows[0];
  if (!a) refus('Avis introuvable.', 404);
  if (a.statut === 'masque') refus('Cet avis a été retiré par la boutique et ne peut plus être modifié.', 409);
  const n = verifierNote(note);
  const t = verifierTexte(titre, { min: 2, max: TITRE_MAX, nom: 'Le titre', obligatoire: reg.titre_obligatoire });
  const c = verifierTexte(commentaire, { min: COMMENTAIRE_MIN, max: COMMENTAIRE_MAX, nom: 'Votre commentaire', obligatoire: true });
  const ph = verifierPhotos(photos, reg, gid, acheteurId);
  const statut = reg.approbation_auto ? 'publie' : 'attente';
  await pool.query(
    `UPDATE boutique_avis SET note = $1, titre = $2, commentaire = $3, photos = $4::jsonb, statut = $5, updated_at = NOW() WHERE id = $6 AND gestionnaire_id = $7 AND acheteur_id = $8`,
    [n, t || null, c, JSON.stringify(ph), statut, id, gid, acheteurId]);
  const retirees = (Array.isArray(a.photos) ? a.photos : []).filter((u) => !ph.includes(u));
  if (retirees.length) await PH.supprimer(retirees, gid);
  return { statut, message: statut === 'publie' ? 'Votre avis a été modifié.' : "Votre avis a été modifié. Il sera de nouveau publié après vérification par la boutique." };
}

async function supprimerParAcheteur({ gid, acheteurId, id }) {
  const a = (await pool.query('DELETE FROM boutique_avis WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 RETURNING photos', [id, gid, acheteurId])).rows[0];
  if (!a) refus('Avis introuvable.', 404);
  await PH.supprimer(a.photos, gid);
  return { message: 'Votre avis a été supprimé.' };
}

async function envoyerPhoto({ gid, acheteurId, buffer }) {
  await exigerActif(gid);
  const reg = await lireConfig(gid);
  if (!reg.photos_actif) refus("Les photos ne sont pas acceptées pour les avis de cette boutique.");
  const r = await PH.envoyer(gid, acheteurId, buffer);
  if (r.erreur) refus(r.erreur);
  return { url: r.url };
}

// ─── Public : avis publiés d'un produit ──────────────────────────────────────
async function infoProduit(gid, produitId, page) {
  if (!(await autorise(gid))) return { actif: false };
  const prod = (await pool.query(`SELECT id FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif' AND collaborateur_id IS NULL`, [produitId, gid])).rows[0];
  if (!prod) return { actif: false };
  const reg = await lireConfig(gid);
  const pg = Math.min(Math.max(parseInt(page, 10) || 1, 1), 10000);
  const st = (await pool.query(
    `SELECT COUNT(*)::int AS total, COALESCE(AVG(note), 0)::float AS moyenne,
            COUNT(*) FILTER (WHERE note = 1)::int AS n1, COUNT(*) FILTER (WHERE note = 2)::int AS n2, COUNT(*) FILTER (WHERE note = 3)::int AS n3,
            COUNT(*) FILTER (WHERE note = 4)::int AS n4, COUNT(*) FILTER (WHERE note = 5)::int AS n5
       FROM boutique_avis WHERE produit_id = $1 AND gestionnaire_id = $2 AND statut = 'publie'`, [produitId, gid])).rows[0];
  const r = await pool.query(
    `SELECT v.id, v.note, v.titre, v.commentaire, v.photos, v.reponse, v.reponse_le, v.created_at, a.prenom, a.nom AS acheteur_nom
       FROM boutique_avis v LEFT JOIN marketplace_acheteurs a ON a.id = v.acheteur_id
      WHERE v.produit_id = $1 AND v.gestionnaire_id = $2 AND v.statut = 'publie'
      ORDER BY v.created_at DESC, v.id DESC LIMIT $3 OFFSET $4`, [produitId, gid, PAR_PAGE, (pg - 1) * PAR_PAGE]);
  return {
    actif: true, afficher_moyenne: reg.afficher_moyenne, total: st.total, moyenne: Math.round(st.moyenne * 10) / 10,
    repartition: { 1: st.n1, 2: st.n2, 3: st.n3, 4: st.n4, 5: st.n5 },
    page: pg, pages: Math.max(1, Math.ceil(st.total / PAR_PAGE)),
    avis: r.rows.map((x) => ({ id: x.id, note: x.note, titre: x.titre, commentaire: x.commentaire, photos: Array.isArray(x.photos) ? x.photos : [], reponse: x.reponse, reponse_le: x.reponse_le, created_at: x.created_at, auteur: Q.nomPublic(x.prenom, x.acheteur_nom) })),
  };
}

// ─── Gestionnaire ────────────────────────────────────────────────────────────
async function compte(gid) {
  const r = (await pool.query(
    `SELECT COUNT(*) FILTER (WHERE statut = 'attente')::int AS attente,
            COUNT(*) FILTER (WHERE statut = 'attente' AND created_at < NOW() - INTERVAL '${JOURS_ANCIEN} days')::int AS anciens
       FROM boutique_avis WHERE gestionnaire_id = $1`, [gid])).rows[0];
  return { attente: r.attente, anciens: r.anciens, a_traiter: r.attente };
}

const motif = (q) => { const t = typeof q === 'string' ? q.trim().slice(0, 80) : ''; return t ? '%' + t.replace(/[\\%_]/g, (c) => '\\' + c) + '%' : null; };

async function liste(gid, { statut, q, note, page } = {}) {
  const st = ['attente', 'publie', 'masque'].includes(statut) ? statut : null;
  const params = [gid]; let filtre = '';
  if (st) { params.push(st); filtre += ` AND v.statut = $${params.length}`; }
  const n = parseInt(note, 10);
  if (Number.isInteger(n) && n >= 1 && n <= 5) { params.push(n); filtre += ` AND v.note = $${params.length}`; }
  const m = motif(q);
  if (m) { params.push(m); filtre += ` AND (v.titre ILIKE $${params.length} OR v.commentaire ILIKE $${params.length} OR p.titre ILIKE $${params.length})`; }
  const pg = Math.min(Math.max(parseInt(page, 10) || 1, 1), 10000);
  params.push(PAR_PAGE, (pg - 1) * PAR_PAGE);
  const r = await pool.query(
    `SELECT v.id, v.produit_id, v.commande_id, v.note, v.titre, v.commentaire, v.photos, v.statut, v.masque_raison, v.masque_le, v.reponse, v.reponse_le, v.created_at,
            p.titre AS produit_titre, p.photo_principale, c.numero_commande, a.prenom, a.nom AS acheteur_nom, COUNT(*) OVER()::int AS total_lignes,
            (v.statut = 'attente' AND v.created_at < NOW() - INTERVAL '${JOURS_ANCIEN} days') AS ancien
       FROM boutique_avis v
       LEFT JOIN produits p ON p.id = v.produit_id LEFT JOIN boutique_commandes c ON c.id = v.commande_id LEFT JOIN marketplace_acheteurs a ON a.id = v.acheteur_id
      WHERE v.gestionnaire_id = $1${filtre}
      ORDER BY (v.statut = 'attente') DESC, CASE WHEN v.statut = 'attente' THEN v.created_at END ASC, v.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const stats = (await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE statut = 'attente')::int AS attente, COUNT(*) FILTER (WHERE statut = 'publie')::int AS publies,
            COUNT(*) FILTER (WHERE statut = 'masque')::int AS masques, COALESCE(AVG(note) FILTER (WHERE statut = 'publie'), 0)::float AS moyenne
       FROM boutique_avis WHERE gestionnaire_id = $1`, [gid])).rows[0];
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  return {
    total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)), stats: { ...stats, moyenne: Math.round(stats.moyenne * 10) / 10 },
    avis: r.rows.map((x) => ({
      id: x.id, produit_id: x.produit_id, produit_titre: x.produit_titre, produit_photo: x.photo_principale || null, numero_commande: x.numero_commande || null,
      note: x.note, titre: x.titre, commentaire: x.commentaire, photos: Array.isArray(x.photos) ? x.photos : [], statut: x.statut, masque_raison: x.masque_raison, masque_le: x.masque_le,
      reponse: x.reponse, reponse_le: x.reponse_le, created_at: x.created_at, ancien: !!x.ancien, acheteur: Q.nomPublic(x.prenom, x.acheteur_nom),
    })),
  };
}

async function notifierAcheteur(gid, acheteurId, titre, message) {
  if (!acheteurId) return;
  try {
    await pool.query(`INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,'avis')`, [gid, acheteurId, titre, message]);
  } catch (e) { console.error('[boutique_avis] notification acheteur :', e.message); }
}

async function approuver({ gid, id }) {
  await exigerActif(gid);
  const u = await pool.query(`UPDATE boutique_avis SET statut = 'publie', updated_at = NOW() WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'attente' RETURNING acheteur_id, produit_id`, [id, gid]);
  if (!u.rowCount) refus('Avis introuvable ou déjà traité.', 404);
  const p = (await pool.query('SELECT titre FROM produits WHERE id = $1', [u.rows[0].produit_id])).rows[0];
  await notifierAcheteur(gid, u.rows[0].acheteur_id, 'Votre avis est publié', `Votre avis sur « ${(p && p.titre) || 'un produit'} » est maintenant visible sur la boutique.`);
  return { message: 'Avis publié.' };
}
async function masquer({ gid, id, raison }) {
  const r = typeof raison === 'string' ? Q.nettoyer(raison).slice(0, 200) : '';
  if (r.length < 3) refus('Indiquez la raison (au moins 3 caractères).');
  const u = await pool.query(`UPDATE boutique_avis SET statut = 'masque', masque_raison = $1, masque_le = NOW(), updated_at = NOW() WHERE id = $2 AND gestionnaire_id = $3 AND statut <> 'masque'`, [r, id, gid]);
  if (!u.rowCount) refus('Avis introuvable.', 404);
  return { message: 'Avis retiré.' };
}
async function retablir({ gid, id }) {
  const u = await pool.query(`UPDATE boutique_avis SET statut = 'publie', masque_raison = NULL, masque_le = NULL, updated_at = NOW() WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'masque'`, [id, gid]);
  if (!u.rowCount) refus('Avis introuvable.', 404);
  return { message: 'Avis rétabli.' };
}
async function repondre({ gid, id, reponse }) {
  await exigerActif(gid);
  const a = (await pool.query('SELECT id, statut, reponse, acheteur_id, produit_id FROM boutique_avis WHERE id = $1 AND gestionnaire_id = $2', [id, gid])).rows[0];
  if (!a) refus('Avis introuvable.', 404);
  if (a.statut !== 'publie') refus("Publiez l'avis avant d'y répondre.", 409);
  const t = verifierTexte(reponse, { min: REPONSE_MIN, max: REPONSE_MAX, nom: 'La réponse', obligatoire: true });
  await pool.query('UPDATE boutique_avis SET reponse = $1, reponse_le = NOW(), updated_at = NOW() WHERE id = $2 AND gestionnaire_id = $3', [t, id, gid]);
  if (!a.reponse) {
    const p = (await pool.query('SELECT titre FROM produits WHERE id = $1', [a.produit_id])).rows[0];
    await notifierAcheteur(gid, a.acheteur_id, 'Le vendeur a répondu à votre avis', `Le vendeur a répondu à votre avis sur « ${(p && p.titre) || 'un produit'} ».`);
  }
  return { message: a.reponse ? 'Réponse modifiée.' : 'Réponse publiée.' };
}
async function retirerReponse({ gid, id }) {
  const u = await pool.query('UPDATE boutique_avis SET reponse = NULL, reponse_le = NULL, updated_at = NOW() WHERE id = $1 AND gestionnaire_id = $2 AND reponse IS NOT NULL', [id, gid]);
  if (!u.rowCount) refus('Réponse introuvable.', 404);
  return { message: 'Réponse retirée.' };
}
async function supprimerParGestionnaire({ gid, id }) {
  const a = (await pool.query('DELETE FROM boutique_avis WHERE id = $1 AND gestionnaire_id = $2 RETURNING photos', [id, gid])).rows[0];
  if (!a) refus('Avis introuvable.', 404);
  await PH.supprimer(a.photos, gid);
  return { message: 'Avis supprimé.' };
}

module.exports = { CODE_ADDON, DEFAUT, BORNES, autorise, lireConfig, enregistrerConfig, reinitialiserConfig, evaluables, etatAcheteur, creer, modifier, supprimerParAcheteur, envoyerPhoto,
  infoProduit, compte, liste, approuver, masquer, retablir, repondre, retirerReponse, supprimerParGestionnaire };