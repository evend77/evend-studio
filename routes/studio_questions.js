// CHEMIN : routes/studio_questions.js
// e-Vend Studio — Add-on « Questions sur le produit ». Monté dans server.js sur : /api/marketplace/:gid/questions
//
//  PUBLIC
//   GET  /produit/:produitId          → { actif, total, page, pages, questions[], peut_poser, mes_en_attente[] }
//                                        (questions publiées seulement : celles qui ont reçu une réponse)
//  ACHETEUR (connecté)
//   POST /produit/:produitId          → { question }       poser une question (invisible tant que le vendeur n'a pas répondu)
//   POST /:id/signaler                → signaler une question publiée
//  COLLABORATEUR (connecté)
//   GET  /collaborateur/mes           → ?statut=attente|publiee|masquee|tous ?page=
//   GET  /collaborateur/compte        → { attente } pastille du menu
//   GET  /collaborateur/reglage       → { actif }  le vendeur accepte-t-il les questions sur ses annonces ?
//   PUT  /collaborateur/reglage       → { actif }  activer / désactiver (même si le gestionnaire offre l'option)
//   POST /collaborateur/:id/repondre  → { reponse }        publie la question avec sa réponse (ou corrige la réponse)
//   POST /collaborateur/:id/refuser   → { raison? }        retire une question hors sujet
// La modération du gestionnaire est dans routes/studio_mv_admin.js (/api/studio/mv/:gid/questions).

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const addons = require('../services/studio_addons');
const Q = require('../services/studio_questions');

const router = express.Router({ mergeParams: true });
const JWT_SECRET = process.env.JWT_SECRET;
const PAR_PAGE = 10;
const MAX_ATTENTE_PAR_PRODUIT = 2;   // questions sans réponse d'un même acheteur sur une même annonce
const MAX_PAR_JOUR = 10;             // questions par acheteur par 24 h

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Q.ErreurQuestion) return res.status(e.status).json({ error: e.message });
    console.error('[studio_questions]', req.method, req.path, e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

function limiteur(max, fenetreMs, cle) {
  const m = new Map();
  return (req, res, next) => {
    const k = cle(req), n = Date.now();
    const c = m.get(k);
    if (!c || n - c.debut > fenetreMs) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > fenetreMs) m.delete(kk); return next(); }
    if (c.n >= max) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
    c.n++; next();
  };
}
const limitePublic = limiteur(600, 5 * 60000, (req) => 'ip:' + req.ip);
const limiteEcriture = limiteur(12, 60000, (req) => 'u:' + (req.mvUser ? req.mvUser.id : req.ip));

function lireJeton(req) {
  const gid = req.params.gid;
  const cookie = req.cookies && req.cookies[`mv_token_${gid}`];
  const a = req.headers.authorization;
  const token = cookie || (a && a.startsWith('Bearer ') ? a.slice(7) : null);
  if (!token) return null;
  try {
    const p = jwt.verify(token, JWT_SECRET);
    return p.gestionnaireId === Number(gid) ? p : null;
  } catch (e) { return null; }
}
const exiger = (type) => (req, res, next) => {
  const p = lireJeton(req);
  if (!p) return res.status(401).json({ error: 'Connexion requise.' });
  if (p.type !== type) return res.status(403).json({ error: type === 'acheteur' ? 'Un compte acheteur est requis.' : 'Un compte collaborateur est requis.' });
  req.mvUser = p; next();
};
const optionnel = (req, res, next) => { const p = lireJeton(req); if (p) req.mvUser = p; next(); };

const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };
const gidDe = (req) => entier(req.params.gid);
const actif = (gid) => addons.addonActifRapide(gid, Q.CODE_ADDON, pool);
const page = (req) => Math.min(Math.max(entier(req.query.page) || 1, 1), 10000);

async function exigerAddon(gid, res) {
  if (await actif(gid)) return true;
  res.status(403).json({ error: "L'option « Questions sur le produit » n'est pas activée pour cette marketplace." });
  return false;
}

async function notifierAcheteur(gid, acheteurId, titre, message) {
  try {
    await pool.query(`INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,'question')`, [gid, acheteurId, titre, message]);
  } catch (e) { console.error('[studio_questions] notification acheteur :', e.message); }
}

// Le vendeur peut refuser les questions sur ses annonces (pas de ligne = accepte)
async function collabAccepte(gid, collabId) {
  const r = await pool.query('SELECT actif FROM questions_produit_collab WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [collabId, gid]);
  return !r.rows[0] || r.rows[0].actif !== false;
}

// ── PUBLIC ───────────────────────────────────────────────────────────────────
router.get('/produit/:produitId', limitePublic, optionnel, h(async (req, res) => {
  const gid = gidDe(req), pid = entier(req.params.produitId);
  if (!gid || !pid) return res.json({ actif: false });
  if (!(await actif(gid))) return res.json({ actif: false });
  const prod = (await pool.query(
    `SELECT p.id, c.nom_boutique, p.collaborateur_id FROM produits p LEFT JOIN marketplace_collaborateurs c ON c.id = p.collaborateur_id
      WHERE p.id = $1 AND p.gestionnaire_id = $2 AND p.statut = 'actif' AND p.collaborateur_id IS NOT NULL`, [pid, gid])).rows[0];
  if (!prod) return res.json({ actif: false });
  if (!(await collabAccepte(gid, prod.collaborateur_id))) return res.json({ actif: false });   // ce vendeur a désactivé les questions
  const pg = page(req);
  const r = await pool.query(
    `SELECT q.id, q.question, q.reponse, q.reponse_le, q.created_at, a.prenom, a.nom AS acheteur_nom, COUNT(*) OVER()::int AS total_lignes
       FROM questions_produit q JOIN marketplace_acheteurs a ON a.id = q.acheteur_id
      WHERE q.produit_id = $1 AND q.gestionnaire_id = $2 AND q.statut = 'publiee'
      ORDER BY q.reponse_le DESC, q.id DESC LIMIT $3 OFFSET $4`, [pid, gid, PAR_PAGE, (pg - 1) * PAR_PAGE]);
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  const estAcheteur = !!(req.mvUser && req.mvUser.type === 'acheteur');
  let mesAttente = [];
  if (estAcheteur) {
    mesAttente = (await pool.query(
      `SELECT id, question, created_at FROM questions_produit WHERE produit_id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 AND statut = 'attente' ORDER BY id DESC LIMIT 5`,
      [pid, gid, req.mvUser.id])).rows;
  }
  res.json({
    actif: true, boutique: prod.nom_boutique || null, total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)),
    questions: r.rows.map((x) => ({ id: x.id, question: x.question, reponse: x.reponse, reponse_le: x.reponse_le, created_at: x.created_at, auteur: Q.nomPublic(x.prenom, x.acheteur_nom) })),
    peut_poser: estAcheteur, mes_en_attente: mesAttente,
  });
}));

// ── ACHETEUR ─────────────────────────────────────────────────────────────────
router.post('/produit/:produitId', exiger('acheteur'), limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), pid = entier(req.params.produitId), uid = req.mvUser.id;
  if (!gid || !pid) return res.status(400).json({ error: 'Annonce invalide.' });
  if (!(await exigerAddon(gid, res))) return;
  const prod = (await pool.query(
    `SELECT id, titre, collaborateur_id FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif' AND collaborateur_id IS NOT NULL`, [pid, gid])).rows[0];
  if (!prod) return res.status(404).json({ error: 'Annonce introuvable.' });
  if (!(await collabAccepte(gid, prod.collaborateur_id))) return res.status(403).json({ error: 'Ce vendeur ne reçoit pas de questions sur ses annonces. Utilisez la messagerie de la boutique.' });

  const question = Q.verifierQuestion(req.body && req.body.question);

  const jour = (await pool.query(`SELECT COUNT(*)::int AS n FROM questions_produit WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`, [uid, gid])).rows[0].n;
  if (jour >= MAX_PAR_JOUR) return res.status(429).json({ error: 'Vous avez posé beaucoup de questions aujourd\'hui. Réessayez demain.' });
  const att = (await pool.query(`SELECT COUNT(*)::int AS n FROM questions_produit WHERE acheteur_id = $1 AND produit_id = $2 AND statut = 'attente'`, [uid, pid])).rows[0].n;
  if (att >= MAX_ATTENTE_PAR_PRODUIT) return res.status(409).json({ error: `Vous avez déjà ${MAX_ATTENTE_PAR_PRODUIT} questions en attente de réponse sur cette annonce.` });
  const dup = await pool.query(`SELECT 1 FROM questions_produit WHERE acheteur_id = $1 AND produit_id = $2 AND lower(question) = lower($3) LIMIT 1`, [uid, pid, question]);
  if (dup.rowCount) return res.status(409).json({ error: 'Vous avez déjà posé cette question.' });

  const ins = await pool.query(
    `INSERT INTO questions_produit (gestionnaire_id, produit_id, collaborateur_id, acheteur_id, question) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [gid, pid, prod.collaborateur_id, uid, question]);

  // Le vendeur voit la question dans son menu (pastille « Questions des acheteurs »). Aucun message n'est envoyé dans sa messagerie.

  res.status(201).json({ id: ins.rows[0].id, message: 'Votre question a été envoyée au vendeur. Elle sera affichée sur la page dès qu\'il aura répondu.' });
}));

router.post('/:id/signaler', exiger('acheteur'), limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), id = entier(req.params.id), uid = req.mvUser.id;
  if (!gid || !id) return res.status(400).json({ error: 'Question invalide.' });
  const q = (await pool.query(`SELECT id FROM questions_produit WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'publiee'`, [id, gid])).rows[0];
  if (!q) return res.status(404).json({ error: 'Question introuvable.' });
  const ins = await pool.query(`INSERT INTO questions_produit_signalements (question_id, acheteur_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, uid]);
  if (ins.rowCount) await pool.query(`UPDATE questions_produit SET signalements = signalements + 1 WHERE id = $1`, [id]);
  res.json({ message: 'Merci, la question a été signalée au gestionnaire.' });
}));

// ── COLLABORATEUR ────────────────────────────────────────────────────────────
router.get('/collaborateur/compte', exiger('collaborateur'), h(async (req, res) => {
  const gid = gidDe(req);
  const n = (await pool.query(`SELECT COUNT(*)::int AS n FROM questions_produit WHERE gestionnaire_id = $1 AND collaborateur_id = $2 AND statut = 'attente'`, [gid, req.mvUser.id])).rows[0].n;
  res.json({ attente: n });
}));

router.get('/collaborateur/reglage', exiger('collaborateur'), h(async (req, res) => {
  const gid = gidDe(req);
  res.json({ addon_actif: await actif(gid), actif: await collabAccepte(gid, req.mvUser.id) });
}));

router.put('/collaborateur/reglage', exiger('collaborateur'), limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req);
  if (!(await exigerAddon(gid, res))) return;
  const val = !!(req.body && req.body.actif);
  await pool.query(
    `INSERT INTO questions_produit_collab (collaborateur_id, gestionnaire_id, actif) VALUES ($1,$2,$3)
     ON CONFLICT (collaborateur_id) DO UPDATE SET actif = $3, updated_at = NOW()`, [req.mvUser.id, gid, val]);
  res.json({ actif: val, message: val ? 'Les acheteurs peuvent poser des questions sur vos annonces.' : 'Les questions sont désactivées sur vos annonces (les réponses déjà publiées sont conservées mais masquées).' });
}));

router.get('/collaborateur/mes', exiger('collaborateur'), h(async (req, res) => {
  const gid = gidDe(req), cid = req.mvUser.id;
  const statut = ['attente', 'publiee', 'masquee'].includes(req.query.statut) ? req.query.statut : null;
  const pg = page(req);
  const params = [gid, cid]; let filtre = '';
  if (statut) { params.push(statut); filtre = ` AND q.statut = $${params.length}`; }
  params.push(PAR_PAGE, (pg - 1) * PAR_PAGE);
  const r = await pool.query(
    `SELECT q.id, q.produit_id, q.question, q.reponse, q.reponse_le, q.statut, q.masque_raison, q.masque_par, q.created_at, p.titre AS produit_titre, p.photo_principale, p.sku, p.prix, p.prix_promo, p.stock,
            a.prenom, a.nom AS acheteur_nom, COUNT(*) OVER()::int AS total_lignes
       FROM questions_produit q
       LEFT JOIN produits p ON p.id = q.produit_id
       JOIN marketplace_acheteurs a ON a.id = q.acheteur_id
      WHERE q.gestionnaire_id = $1 AND q.collaborateur_id = $2${filtre}
      ORDER BY (q.statut = 'attente') DESC, q.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  const stats = (await pool.query(
    `SELECT COUNT(*) FILTER (WHERE statut = 'attente')::int AS attente, COUNT(*) FILTER (WHERE statut = 'publiee')::int AS publiee, COUNT(*) FILTER (WHERE statut = 'masquee')::int AS masquee
       FROM questions_produit WHERE gestionnaire_id = $1 AND collaborateur_id = $2`, [gid, cid])).rows[0];
  const total = r.rows.length ? r.rows[0].total_lignes : 0;
  res.json({
    addon_actif: await actif(gid), questions_actif: await collabAccepte(gid, cid), total, page: pg, pages: Math.max(1, Math.ceil(total / PAR_PAGE)), stats,
    questions: r.rows.map((x) => ({ id: x.id, produit_id: x.produit_id, produit_titre: x.produit_titre, produit_photo: x.photo_principale || null, produit_sku: x.sku || null, produit_prix: x.prix_promo != null && Number(x.prix_promo) > 0 ? x.prix_promo : x.prix, produit_stock: x.stock, question: x.question, reponse: x.reponse, reponse_le: x.reponse_le,
      statut: x.statut, masque_raison: x.masque_raison, masque_par: x.masque_par, created_at: x.created_at, acheteur: Q.nomPublic(x.prenom, x.acheteur_nom) })),
  });
}));

router.post('/collaborateur/:id/repondre', exiger('collaborateur'), limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), id = entier(req.params.id), cid = req.mvUser.id;
  if (!gid || !id) return res.status(400).json({ error: 'Question invalide.' });
  if (!(await exigerAddon(gid, res))) return;
  const q = (await pool.query(
    `SELECT q.id, q.statut, q.acheteur_id, q.produit_id, p.titre FROM questions_produit q LEFT JOIN produits p ON p.id = q.produit_id
      WHERE q.id = $1 AND q.gestionnaire_id = $2 AND q.collaborateur_id = $3`, [id, gid, cid])).rows[0];
  if (!q) return res.status(404).json({ error: 'Question introuvable.' });
  if (q.statut === 'masquee') return res.status(409).json({ error: 'Cette question a été retirée.' });
  const reponse = Q.verifierReponse(req.body && req.body.reponse);
  const premiere = q.statut === 'attente';
  await pool.query(`UPDATE questions_produit SET reponse = $1, reponse_le = NOW(), statut = 'publiee' WHERE id = $2`, [reponse, id]);
  if (premiere) await notifierAcheteur(gid, q.acheteur_id, 'Réponse à votre question', `Le vendeur a répondu à votre question sur « ${q.titre || 'une annonce'} ». Elle est maintenant visible sur la page de l'annonce.`);
  res.json({ message: premiere ? 'Réponse publiée sur la page de l\'annonce.' : 'Réponse modifiée.' });
}));

router.post('/collaborateur/:id/refuser', exiger('collaborateur'), limiteEcriture, h(async (req, res) => {
  const gid = gidDe(req), id = entier(req.params.id), cid = req.mvUser.id;
  if (!gid || !id) return res.status(400).json({ error: 'Question invalide.' });
  const raison = Q.nettoyer(req.body && req.body.raison).slice(0, 200) || 'Question hors sujet';
  const r = await pool.query(
    `UPDATE questions_produit SET statut = 'masquee', masque_raison = $1, masque_par = 'collaborateur'
      WHERE id = $2 AND gestionnaire_id = $3 AND collaborateur_id = $4 AND statut <> 'masquee'`, [raison, id, gid, cid]);
  if (!r.rowCount) return res.status(404).json({ error: 'Question introuvable.' });
  res.json({ message: 'Question retirée.' });
}));

module.exports = router;