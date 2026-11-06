// CHEMIN : routes/mv_contact_inbox.js
// e-Vend Studio — Boîte de réception « Contact » du gestionnaire (site multi-vendeur).
//
// Les visiteurs envoient leur message par le formulaire existant POST /api/studio/contact (routes/studio_contact.js) :
// courriel d'alerte au gestionnaire, anti-spam, liste noire, quota — et enregistrement dans la table messages_contact.
// Ce fichier ne fait que LIRE et GÉRER ces messages pour la page « MULTI-VENDEUR › Contact » (accès : le gestionnaire connecté,
// pour SA boutique seulement).
//
// Monté dans server.js sur : /api/mv-contact/:gestionnaireId
//   GET  /messages?page=&limit=&filtre=tous|non_lus|lus&q=
//   GET  /count                              → { non_lus }
//   PUT  /messages/lire-tous
//   PUT  /messages/:id/lu   { lu: true|false }
//   DELETE /messages/:id

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
}

// ════════════════════════════════════════════════════════════════════════════
// GESTIONNAIRE : boîte de réception
// ════════════════════════════════════════════════════════════════════════════
const router = express.Router({ mergeParams: true });

router.use(authenticateToken, (req, res, next) => {
  const gid = entier(req.params.gestionnaireId);
  if (!gid || !req.user || req.user.role !== 'gestionnaire' || Number(req.user.id) !== gid) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  req.gid = gid;
  next();
});

const h = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { console.error('[mv_contact_inbox]', req.method, req.path, e && e.message ? e.message : e); res.status(500).json({ error: 'Erreur serveur' }); }
};

router.get('/count', h(async (req, res) => {
  const r = await pool.query('SELECT COUNT(*)::int AS n FROM messages_contact WHERE gestionnaire_id = $1 AND lu IS NOT TRUE', [req.gid]);
  res.json({ non_lus: r.rows[0].n });
}));

router.get('/messages', h(async (req, res) => {
  const page = Math.min(Math.max(entier(req.query.page) || 1, 1), 10000);
  const lim = Math.min(Math.max(entier(req.query.limit) || 20, 1), 100);
  const params = [req.gid];
  let where = 'gestionnaire_id = $1';
  if (req.query.filtre === 'non_lus') where += ' AND lu IS NOT TRUE';
  else if (req.query.filtre === 'lus') where += ' AND lu IS TRUE';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  if (q) {
    params.push('%' + q.replace(/[\\%_]/g, '\\$&') + '%');
    const n = params.length;
    where += ` AND (nom ILIKE $${n} OR email ILIKE $${n} OR COALESCE(sujet,'') ILIKE $${n} OR message ILIKE $${n})`;
  }
  const r = await pool.query(
    `SELECT id, nom, email, telephone, sujet, message, lu, created_at, COUNT(*) OVER()::int AS total_lignes
       FROM messages_contact WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ${lim} OFFSET ${(page - 1) * lim}`, params);
  let total = r.rows.length ? r.rows[0].total_lignes : 0;
  if (!r.rows.length && page > 1) total = (await pool.query(`SELECT COUNT(*)::int AS n FROM messages_contact WHERE ${where}`, params)).rows[0].n;
  const nl = await pool.query('SELECT COUNT(*)::int AS n FROM messages_contact WHERE gestionnaire_id = $1 AND lu IS NOT TRUE', [req.gid]);
  res.json({
    messages: r.rows.map(({ total_lignes, ...m }) => m),
    pagination: { total, page, limit: lim, pages: Math.max(1, Math.ceil(total / lim)) },
    non_lus: nl.rows[0].n,
  });
}));

router.put('/messages/lire-tous', h(async (req, res) => {
  const r = await pool.query('UPDATE messages_contact SET lu = true WHERE gestionnaire_id = $1 AND lu IS NOT TRUE', [req.gid]);
  res.json({ success: true, modifies: r.rowCount });
}));

router.put('/messages/:id/lu', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.status(404).json({ error: 'Message introuvable' });
  const r = await pool.query('UPDATE messages_contact SET lu = $3 WHERE id = $1 AND gestionnaire_id = $2 RETURNING id', [id, req.gid, req.body && req.body.lu === false ? false : true]);
  if (!r.rows.length) return res.status(404).json({ error: 'Message introuvable' });
  res.json({ success: true });
}));

router.delete('/messages/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) return res.status(404).json({ error: 'Message introuvable' });
  const r = await pool.query('DELETE FROM messages_contact WHERE id = $1 AND gestionnaire_id = $2 RETURNING id', [id, req.gid]);
  if (!r.rows.length) return res.status(404).json({ error: 'Message introuvable' });
  res.json({ success: true });
}));

module.exports = router;