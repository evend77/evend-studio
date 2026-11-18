// CHEMIN : services/boutique_questions.js
// e-Vend Studio — Add-on « Questions sur le produit » des templates boutique (solo). Adapté de services/studio_questions.js + routes/studio_questions.js
// + modération de routes/studio_mv_admin.js (MV) ; ne touche à rien du MV.
//
// Différences avec le MV : pas de collaborateur — le GESTIONNAIRE est le vendeur : il répond ET modère, depuis une seule page.
// Les questions vivent dans boutique_questions (+ boutique_questions_signalements) ; l'interrupteur « accepter les questions » est boutique_reglages.questions_actif.
// Règles reprises du MV : question 10–500 caractères, réponse 2–1000, ni courriel ni téléphone ni lien ; 2 questions en attente par acheteur et par produit ;
// 10 questions par acheteur par 24 h ; pas deux fois la même question ; une question n'est PUBLIQUE qu'une fois répondue ; un signalement par acheteur.
// L'acheteur est notifié (marketplace_notifications, type « question ») quand le gestionnaire répond pour la première fois.

'use strict';

const pool = require('../db');
const sanitizeHtml = require('sanitize-html');
const { ErreurBoutique } = require('./boutique_limites');
const A = require('./boutique_addons');

const CODE_ADDON = 'questions_produit';
const QUESTION_MIN = 10, QUESTION_MAX = 500;
const REPONSE_MIN = 2, REPONSE_MAX = 1000;
const PAR_PAGE = 10;
const MAX_ATTENTE_PAR_PRODUIT = 2;
const MAX_PAR_JOUR = 10;
const MSG_COORDONNEES = "Pour votre sécurité, n'écrivez pas de courriel, de numéro de téléphone ou de lien dans ce texte.";

const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };

// ── Texte ──
function nettoyer(t) {
  const brut = typeof t === 'string' ? t : '';
  return sanitizeHtml(brut, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
const RE_COURRIEL = /[^\s@]+@[^\s@]+\.[a-z]{2,}|\barobase\b/i;
const RE_TELEPHONE = /(?:\+?\d[\s.\-()]*){10,}/;
const RE_LIEN = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]{2,}\.(?:com|ca|net|org|io|co|fr|shop|store|app|me|biz|info)\b/i;
const contientCoordonnees = (t) => RE_COURRIEL.test(t) || RE_TELEPHONE.test(t) || RE_LIEN.test(t);
function verifierQuestion(t) {
  const q = nettoyer(t);
  if (q.length < QUESTION_MIN) refus(`Votre question est trop courte (au moins ${QUESTION_MIN} caractères).`);
  if (q.length > QUESTION_MAX) refus(`Votre question est trop longue (${QUESTION_MAX} caractères maximum).`);
  if (contientCoordonnees(q)) refus(MSG_COORDONNEES);
  return q;
}
function verifierReponse(t) {
  const r = nettoyer(t);
  if (r.length < REPONSE_MIN) refus('Écrivez votre réponse.');
  if (r.length > REPONSE_MAX) refus(`La réponse est trop longue (${REPONSE_MAX} caractères maximum).`);
  if (contientCoordonnees(r)) refus(MSG_COORDONNEES);
  return r;
}
// « Alex B. » : prénom + initiale du nom (jamais le courriel ni le nom complet)
function nomPublic(prenom, nom) {
  const p = String(prenom || '').trim().split(/\s+/)[0] || 'Acheteur';
  const n = String(nom || '').trim();
  return n ? `${p} ${n.charAt(0).toUpperCase()}.` : p;
}

// ── Add-on et interrupteur ──
const actifPourBoutique = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);
async function questionsAcceptees(gid, db) {
  const r = (await (db || pool).query('SELECT questions_actif FROM boutique_reglages WHERE gestionnaire_id = $1', [gid])).rows[0];
  return !r || r.questions_actif !== false;
}
async function ecrireReglage(gid, actif) {
  const v = actif === true || actif === 'true';
  await pool.query(
    `INSERT INTO boutique_reglages (gestionnaire_id, questions_actif, updated_at) VALUES ($1,$2,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET questions_actif = EXCLUDED.questions_actif, updated_at = NOW()`, [gid, v]);
  return v;
}

// ── Public : questions publiées d'un produit ──
async function infoProduit(gid, produitId, acheteurId, page) {
  if (!(await actifPourBoutique(gid)) || !(await questionsAcceptees(gid))) return { actif: false };
  const prod = (await pool.query(`SELECT id FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif' AND collaborateur_id IS NULL`, [produitId, gid])).rows[0];
  if (!prod) return { actif: false };
  const pg = Math.min(Math.max(parseInt(page, 10) || 1, 1), 10000);
  const r = await pool.query(
    `SELECT q.id, q.question, q.reponse, q.reponse_le, q.created_at, a.prenom, a.nom AS acheteur_nom, COUNT(*) OVER()::int AS total_lignes
       FROM boutique_questions q JOIN marketplace_acheteurs a ON a.id = q.acheteur_id
      WHERE q.produit_id = $1 AND q.gestionnaire_id = $2 AND q.statut = 'publiee'
      ORDER BY q.reponse_le DESC, q.id DESC LIMIT $3 OFFSET $4`, [produitId, gid, PAR_PAGE, (pg - 1) * PAR_PAGE]);
  const total = r.rows.length ? r.rows[0].total_lignes : (pg > 1 ? (await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_questions WHERE produit_id = $1 AND gestionnaire_id = $2 AND statut = 'publiee'`, [produitId, gid])).rows[0].n : 0);
  let mesAttente = [];
  if (acheteurId) {
    mesAttente = (await pool.query(`SELECT id, question, created_at FROM boutique_questions WHERE produit_id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 AND statut = 'attente' ORDER BY id DESC LIMIT 5`, [produitId, gid, acheteurId])).rows;
  }
  return {
    actif: true, total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)),
    questions: r.rows.map((x) => ({ id: x.id, question: x.question, reponse: x.reponse, reponse_le: x.reponse_le, created_at: x.created_at, auteur: nomPublic(x.prenom, x.acheteur_nom) })),
    peut_poser: !!acheteurId, mes_en_attente: mesAttente,
  };
}

// ── Acheteur ──
async function poser({ gid, produitId, acheteurId, question }) {
  if (!(await actifPourBoutique(gid))) refus("L'option « Questions sur le produit » n'est pas activée pour cette boutique.", 403);
  if (!(await questionsAcceptees(gid))) refus('Cette boutique ne reçoit pas de questions sur ses produits.', 403);
  const prod = (await pool.query(`SELECT id, titre FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif' AND collaborateur_id IS NULL`, [produitId, gid])).rows[0];
  if (!prod) refus('Annonce introuvable.', 404);
  const q = verifierQuestion(question);
  const jour = (await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_questions WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`, [acheteurId, gid])).rows[0].n;
  if (jour >= MAX_PAR_JOUR) refus("Vous avez posé beaucoup de questions aujourd'hui. Réessayez demain.", 429);
  const att = (await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_questions WHERE acheteur_id = $1 AND produit_id = $2 AND statut = 'attente'`, [acheteurId, produitId])).rows[0].n;
  if (att >= MAX_ATTENTE_PAR_PRODUIT) refus(`Vous avez déjà ${MAX_ATTENTE_PAR_PRODUIT} questions en attente de réponse sur cette annonce.`, 409);
  const dup = await pool.query(`SELECT 1 FROM boutique_questions WHERE acheteur_id = $1 AND produit_id = $2 AND lower(question) = lower($3) LIMIT 1`, [acheteurId, produitId, q]);
  if (dup.rowCount) refus('Vous avez déjà posé cette question.', 409);
  const ins = await pool.query(`INSERT INTO boutique_questions (gestionnaire_id, produit_id, acheteur_id, question) VALUES ($1,$2,$3,$4) RETURNING id`, [gid, produitId, acheteurId, q]);
  return { id: ins.rows[0].id, message: "Votre question a été envoyée au vendeur. Elle sera affichée sur la page dès qu'il aura répondu." };
}

async function signaler({ gid, questionId, acheteurId }) {
  const q = (await pool.query(`SELECT id FROM boutique_questions WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'publiee'`, [questionId, gid])).rows[0];
  if (!q) refus('Question introuvable.', 404);
  const ins = await pool.query(`INSERT INTO boutique_questions_signalements (question_id, acheteur_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [questionId, acheteurId]);
  if (ins.rowCount) await pool.query(`UPDATE boutique_questions SET signalements = signalements + 1 WHERE id = $1`, [questionId]);
  return { message: 'Merci, la question a été signalée au vendeur.' };
}

// ── Gestionnaire ──
async function compte(gid) {
  const r = (await pool.query(
    `SELECT COUNT(*) FILTER (WHERE statut = 'attente')::int AS attente, COUNT(*) FILTER (WHERE statut = 'publiee' AND signalements > 0)::int AS signalees
       FROM boutique_questions WHERE gestionnaire_id = $1`, [gid])).rows[0];
  return { attente: r.attente, signalees: r.signalees, a_traiter: r.attente + r.signalees };
}

const motif = (q) => { const t = typeof q === 'string' ? q.trim().slice(0, 80) : ''; return t ? '%' + t.replace(/[\\%_]/g, (c) => '\\' + c) + '%' : null; };

async function liste(gid, { statut, q, page } = {}) {
  const st = ['attente', 'publiee', 'masquee', 'signalees'].includes(statut) ? statut : null;
  const params = [gid]; let filtre = '';
  if (st === 'signalees') filtre += ` AND q.statut = 'publiee' AND q.signalements > 0`;
  else if (st) { params.push(st); filtre += ` AND q.statut = $${params.length}`; }
  const m = motif(q);
  if (m) { params.push(m); filtre += ` AND (q.question ILIKE $${params.length} OR q.reponse ILIKE $${params.length} OR p.titre ILIKE $${params.length})`; }
  const pg = Math.min(Math.max(parseInt(page, 10) || 1, 1), 10000);
  params.push(PAR_PAGE, (pg - 1) * PAR_PAGE);
  const r = await pool.query(
    `SELECT q.id, q.produit_id, q.question, q.reponse, q.reponse_le, q.statut, q.masque_raison, q.masque_par, q.signalements, q.created_at,
            p.titre AS produit_titre, p.photo_principale, p.sku, p.prix, p.stock, a.prenom, a.nom AS acheteur_nom, COUNT(*) OVER()::int AS total_lignes
       FROM boutique_questions q
       LEFT JOIN produits p ON p.id = q.produit_id
       LEFT JOIN marketplace_acheteurs a ON a.id = q.acheteur_id
      WHERE q.gestionnaire_id = $1${filtre}
      ORDER BY (q.statut = 'attente') DESC, (q.statut = 'publiee' AND q.signalements > 0) DESC, q.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const stats = (await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE statut = 'attente')::int AS attente, COUNT(*) FILTER (WHERE statut = 'publiee')::int AS publiees,
            COUNT(*) FILTER (WHERE statut = 'masquee')::int AS masquees, COUNT(*) FILTER (WHERE statut = 'publiee' AND signalements > 0)::int AS signalees
       FROM boutique_questions WHERE gestionnaire_id = $1`, [gid])).rows[0];
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  return {
    total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)), stats,
    questions: r.rows.map((x) => ({
      id: x.id, produit_id: x.produit_id, produit_titre: x.produit_titre, produit_photo: x.photo_principale || null, produit_sku: x.sku || null,
      produit_prix: x.prix === null ? null : Number(x.prix), produit_stock: x.stock === null || x.stock === undefined ? null : Number(x.stock),
      question: x.question, reponse: x.reponse, reponse_le: x.reponse_le, statut: x.statut, masque_raison: x.masque_raison, masque_par: x.masque_par,
      signalements: x.signalements, created_at: x.created_at, acheteur: nomPublic(x.prenom, x.acheteur_nom),
    })),
  };
}

async function notifierAcheteur(gid, acheteurId, titre, message) {
  try {
    await pool.query(`INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,'question')`, [gid, acheteurId, titre, message]);
  } catch (e) { console.error('[boutique_questions] notification acheteur :', e.message); }
}

async function repondre({ gid, questionId, reponse }) {
  if (!(await actifPourBoutique(gid))) refus("L'option « Questions sur le produit » n'est pas activée. Activez-la dans « Mon plan & limites ».", 403);
  const q = (await pool.query(
    `SELECT q.id, q.statut, q.acheteur_id, p.titre FROM boutique_questions q LEFT JOIN produits p ON p.id = q.produit_id WHERE q.id = $1 AND q.gestionnaire_id = $2`, [questionId, gid])).rows[0];
  if (!q) refus('Question introuvable.', 404);
  if (q.statut === 'masquee') refus('Cette question a été retirée. Rétablissez-la avant de répondre.', 409);
  const texte = verifierReponse(reponse);
  const premiere = q.statut === 'attente';
  await pool.query(`UPDATE boutique_questions SET reponse = $1, reponse_le = NOW(), statut = 'publiee' WHERE id = $2 AND gestionnaire_id = $3`, [texte, questionId, gid]);
  if (premiere) await notifierAcheteur(gid, q.acheteur_id, 'Réponse à votre question', `Le vendeur a répondu à votre question sur « ${q.titre || 'une annonce'} ». Elle est maintenant visible sur la page de l'annonce.`);
  return { message: premiere ? "Réponse publiée sur la page de l'annonce." : 'Réponse modifiée.' };
}

async function masquer({ gid, questionId, raison }) {
  const r = typeof raison === 'string' ? nettoyer(raison).slice(0, 200) : '';
  if (r.length < 3) refus('Indiquez la raison (au moins 3 caractères).');
  const u = await pool.query(`UPDATE boutique_questions SET statut = 'masquee', masque_raison = $1, masque_par = 'gestionnaire' WHERE id = $2 AND gestionnaire_id = $3 AND statut <> 'masquee'`, [r, questionId, gid]);
  if (!u.rowCount) refus('Question introuvable.', 404);
  return { message: 'Question retirée.' };
}
async function retablir({ gid, questionId }) {
  const u = await pool.query(
    `UPDATE boutique_questions SET statut = CASE WHEN reponse IS NOT NULL THEN 'publiee' ELSE 'attente' END, masque_raison = NULL, masque_par = NULL, signalements = 0
      WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'masquee'`, [questionId, gid]);
  if (!u.rowCount) refus('Question introuvable.', 404);
  await pool.query('DELETE FROM boutique_questions_signalements WHERE question_id = $1', [questionId]);
  return { message: 'Question rétablie.' };
}
async function ignorerSignalements({ gid, questionId }) {
  const u = await pool.query(`UPDATE boutique_questions SET signalements = 0 WHERE id = $1 AND gestionnaire_id = $2`, [questionId, gid]);
  if (!u.rowCount) refus('Question introuvable.', 404);
  await pool.query('DELETE FROM boutique_questions_signalements WHERE question_id = $1', [questionId]);
  return { message: 'Signalements ignorés.' };
}
async function supprimer({ gid, questionId }) {
  const u = await pool.query('DELETE FROM boutique_questions WHERE id = $1 AND gestionnaire_id = $2', [questionId, gid]);
  if (!u.rowCount) refus('Question introuvable.', 404);
  return { message: 'Question supprimée.' };
}

module.exports = { CODE_ADDON, actifPourBoutique, questionsAcceptees, ecrireReglage, infoProduit, poser, signaler, compte, liste, repondre, masquer, retablir, ignorerSignalements, supprimer, nettoyer, nomPublic, contientCoordonnees };