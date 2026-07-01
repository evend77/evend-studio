/**
 * routes/chat_admin_sv.js — e-Vend Studio
 * Chat chiffré AES-256-CBC entre le vendeur (proprio) et ses sous-vendeurs
 * Tables : chat_admin_sv, chat_admin_sv_msg
 *
 * Monté sur : /api/chat-admin-sv/:vendeurId
 *
 * ── Côté vendeur (proprio) ──
 * GET  /admin/conversations
 * POST /admin/conversations
 * GET  /admin/conversations/:chatId/messages
 * POST /admin/conversations/:chatId/messages
 * PUT  /admin/conversations/:chatId/statut
 * DELETE /admin/messages/:msgId
 *
 * ── Côté sous-vendeur ──
 * GET  /sv/:sousVendeurId/conversations
 * POST /sv/:sousVendeurId/conversations
 * GET  /sv/:sousVendeurId/conversations/:chatId/messages
 * POST /sv/:sousVendeurId/conversations/:chatId/messages
 *
 * ── Commun ──
 * GET  /sous-vendeurs  — liste SV actifs du site
 */

const express = require('express');
const router  = express.Router({ mergeParams: true });
const crypto  = require('crypto');
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════
// CHIFFREMENT AES-256-CBC
// ══════════════════════════════════════════════════════════════════
const ENCRYPTION_KEY = Buffer.from(
  process.env.MSG_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 64),
  'hex'
).slice(0, 32);

function chiffrer(texte) {
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let c = cipher.update(texte || '', 'utf8', 'base64');
  c += cipher.final('base64');
  return { chiffre: c, iv: iv.toString('hex') };
}

function dechiffrer(chiffre, ivHex) {
  try {
    const iv       = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let d = decipher.update(chiffre, 'base64', 'utf8');
    d += decipher.final('utf8');
    return d;
  } catch { return '[Message non déchiffrable]'; }
}

async function getSiteId(vendeurId) {
  const r = await pool.query(`SELECT id FROM sites WHERE vendeur_id = $1`, [vendeurId]);
  return r.rows[0]?.id ?? null;
}

function formatMsg(m) {
  return {
    id:               m.id,
    expediteur_id:    m.expediteur_id,
    expediteur_role:  m.expediteur_role,
    expediteur_nom:   m.expediteur_nom,
    contenu:          m.supprime ? '🗑️ Message supprimé' : dechiffrer(m.contenu, m.iv),
    piece_jointe_url: m.piece_jointe_url,
    piece_jointe_nom: m.piece_jointe_nom,
    piece_jointe_type:m.piece_jointe_type,
    supprime:         m.supprime,
    created_at:       m.created_at,
  };
}

const MSG_QUERY = `
  SELECT m.id, m.expediteur_id, m.expediteur_role, m.contenu, m.iv,
         m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
         m.supprime, m.created_at,
         CASE
           WHEN m.expediteur_role = 'admin' THEN v.nom_boutique
           ELSE sv.nom
         END AS expediteur_nom
    FROM chat_admin_sv_msg m
    JOIN chat_admin_sv c ON c.id = m.chat_id
    JOIN vendeurs v       ON v.id  = c.vendeur_id
    JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
   WHERE m.chat_id = $1
   ORDER BY m.created_at ASC
`;

// ════════════════════════════════════════════════════════════════════════
// COMMUN
// ════════════════════════════════════════════════════════════════════════

// GET /sous-vendeurs
router.get('/sous-vendeurs', authenticateToken, async (req, res) => {
  try {
    const siteId = await getSiteId(req.params.vendeurId);
    if (!siteId) return res.json([]);
    const r = await pool.query(
      `SELECT id, nom, nom_boutique FROM sous_vendeurs WHERE site_id = $1 AND statut = 'actif' ORDER BY nom_boutique`,
      [siteId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════
// CÔTÉ VENDEUR (ADMIN)
// ════════════════════════════════════════════════════════════════════════

// GET /admin/conversations
router.get('/admin/conversations', authenticateToken, async (req, res) => {
  const { vendeurId } = req.params;
  try {
    const siteId = await getSiteId(vendeurId);
    if (!siteId) return res.json([]);

    const rows = await pool.query(`
      SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
             sv.id AS sv_id, sv.nom AS sv_nom, sv.nom_boutique AS sv_boutique,
             (SELECT contenu    FROM chat_admin_sv_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_c,
             (SELECT iv         FROM chat_admin_sv_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_iv,
             (SELECT created_at FROM chat_admin_sv_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_date,
             (SELECT COUNT(*)   FROM chat_admin_sv_msg WHERE chat_id = c.id AND expediteur_role = 'sous_vendeur' AND lu = false) AS non_lus
        FROM chat_admin_sv c
        JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
       WHERE c.vendeur_id = $1
       ORDER BY c.updated_at DESC
    `, [vendeurId]);

    res.json(rows.rows.map(r => ({
      id: r.id, sujet: r.sujet, statut: r.statut,
      created_at: r.created_at, updated_at: r.updated_at,
      sous_vendeur: { id: r.sv_id, nom: r.sv_nom, nom_boutique: r.sv_boutique },
      dernier_message: r.dm_c ? dechiffrer(r.dm_c, r.dm_iv) : null,
      dernier_message_date: r.dm_date,
      non_lus: parseInt(r.non_lus, 10) || 0,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /admin/conversations
router.post('/admin/conversations', authenticateToken, async (req, res) => {
  const { vendeurId } = req.params;
  const { sous_vendeur_id, sujet, message } = req.body;
  if (!sous_vendeur_id || !sujet?.trim() || !message?.trim())
    return res.status(400).json({ error: 'sous_vendeur_id, sujet et message requis' });

  try {
    const c = await pool.query(
      `INSERT INTO chat_admin_sv (vendeur_id, sous_vendeur_id, sujet)
       VALUES ($1, $2, $3) RETURNING id`,
      [vendeurId, sous_vendeur_id, sujet.trim()]
    );
    const chatId = c.rows[0].id;
    const { chiffre, iv } = chiffrer(message.trim());
    await pool.query(
      `INSERT INTO chat_admin_sv_msg (chat_id, expediteur_id, expediteur_role, contenu, iv)
       VALUES ($1, $2, 'admin', $3, $4)`,
      [chatId, vendeurId, chiffre, iv]
    );
    await pool.query(`UPDATE chat_admin_sv SET updated_at = NOW() WHERE id = $1`, [chatId]);

    const sv = await pool.query(`SELECT id, nom, nom_boutique FROM sous_vendeurs WHERE id = $1`, [sous_vendeur_id]);
    const s  = sv.rows[0];
    res.json({
      conversation: {
        id: chatId, sujet: sujet.trim(), statut: 'actif',
        created_at: new Date(), updated_at: new Date(),
        sous_vendeur: { id: s.id, nom: s.nom, nom_boutique: s.nom_boutique },
        dernier_message: message.trim(), dernier_message_date: new Date(), non_lus: 0,
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /admin/conversations/:chatId/messages
router.get('/admin/conversations/:chatId/messages', authenticateToken, async (req, res) => {
  const { vendeurId, chatId } = req.params;
  try {
    const check = await pool.query(`SELECT id FROM chat_admin_sv WHERE id = $1 AND vendeur_id = $2`, [chatId, vendeurId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Accès refusé' });
    const msgs = await pool.query(MSG_QUERY, [chatId]);
    await pool.query(`UPDATE chat_admin_sv_msg SET lu = true WHERE chat_id = $1 AND expediteur_role = 'sous_vendeur' AND lu = false`, [chatId]);
    res.json(msgs.rows.map(formatMsg));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /admin/conversations/:chatId/messages
router.post('/admin/conversations/:chatId/messages', authenticateToken, async (req, res) => {
  const { vendeurId, chatId } = req.params;
  const { contenu, piece_jointe_url, piece_jointe_nom, piece_jointe_type } = req.body;
  if (!contenu?.trim() && !piece_jointe_url) return res.status(400).json({ error: 'Contenu requis' });

  try {
    const check = await pool.query(`SELECT id FROM chat_admin_sv WHERE id = $1 AND vendeur_id = $2 AND statut = 'actif'`, [chatId, vendeurId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });
    const { chiffre, iv } = chiffrer(contenu?.trim() || '');
    await pool.query(
      `INSERT INTO chat_admin_sv_msg (chat_id, expediteur_id, expediteur_role, contenu, iv, piece_jointe_url, piece_jointe_nom, piece_jointe_type)
       VALUES ($1, $2, 'admin', $3, $4, $5, $6, $7)`,
      [chatId, vendeurId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null, piece_jointe_type || null]
    );
    await pool.query(`UPDATE chat_admin_sv SET updated_at = NOW() WHERE id = $1`, [chatId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /admin/conversations/:chatId/statut
router.put('/admin/conversations/:chatId/statut', authenticateToken, async (req, res) => {
  const { vendeurId, chatId } = req.params;
  const { statut } = req.body;
  if (!['actif','resolu','ferme'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
  try {
    await pool.query(`UPDATE chat_admin_sv SET statut = $1, updated_at = NOW() WHERE id = $2 AND vendeur_id = $3`, [statut, chatId, vendeurId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /admin/messages/:msgId
router.delete('/admin/messages/:msgId', authenticateToken, async (req, res) => {
  const { vendeurId, msgId } = req.params;
  try {
    const check = await pool.query(`
      SELECT m.id FROM chat_admin_sv_msg m
        JOIN chat_admin_sv c ON c.id = m.chat_id
       WHERE m.id = $1 AND c.vendeur_id = $2`, [msgId, vendeurId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Accès refusé' });
    await pool.query(`UPDATE chat_admin_sv_msg SET supprime = true WHERE id = $1`, [msgId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════════════
// CÔTÉ SOUS-VENDEUR
// ════════════════════════════════════════════════════════════════════════

// GET /sv/:sousVendeurId/conversations
router.get('/sv/:sousVendeurId/conversations', authenticateToken, async (req, res) => {
  const { sousVendeurId } = req.params;
  try {
    const rows = await pool.query(`
      SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
             (SELECT contenu    FROM chat_admin_sv_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_c,
             (SELECT iv         FROM chat_admin_sv_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_iv,
             (SELECT created_at FROM chat_admin_sv_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_date,
             (SELECT COUNT(*)   FROM chat_admin_sv_msg WHERE chat_id = c.id AND expediteur_role = 'admin' AND lu = false) AS non_lus
        FROM chat_admin_sv c
       WHERE c.sous_vendeur_id = $1
       ORDER BY c.updated_at DESC
    `, [sousVendeurId]);

    res.json(rows.rows.map(r => ({
      id: r.id, sujet: r.sujet, statut: r.statut,
      created_at: r.created_at, updated_at: r.updated_at,
      dernier_message: r.dm_c ? dechiffrer(r.dm_c, r.dm_iv) : null,
      dernier_message_date: r.dm_date,
      non_lus: parseInt(r.non_lus, 10) || 0,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /sv/:sousVendeurId/conversations
router.post('/sv/:sousVendeurId/conversations', authenticateToken, async (req, res) => {
  const { vendeurId, sousVendeurId } = req.params;
  const { sujet, message } = req.body;
  if (!sujet?.trim() || !message?.trim()) return res.status(400).json({ error: 'sujet et message requis' });

  try {
    const c = await pool.query(
      `INSERT INTO chat_admin_sv (vendeur_id, sous_vendeur_id, sujet)
       VALUES ($1, $2, $3) RETURNING id`,
      [vendeurId, sousVendeurId, sujet.trim()]
    );
    const chatId = c.rows[0].id;
    const { chiffre, iv } = chiffrer(message.trim());
    await pool.query(
      `INSERT INTO chat_admin_sv_msg (chat_id, expediteur_id, expediteur_role, contenu, iv)
       VALUES ($1, $2, 'sous_vendeur', $3, $4)`,
      [chatId, sousVendeurId, chiffre, iv]
    );
    await pool.query(`UPDATE chat_admin_sv SET updated_at = NOW() WHERE id = $1`, [chatId]);
    res.json({ conversation: { id: chatId, sujet: sujet.trim(), statut: 'actif', created_at: new Date(), updated_at: new Date(), dernier_message: message.trim(), dernier_message_date: new Date(), non_lus: 0 } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /sv/:sousVendeurId/conversations/:chatId/messages
router.get('/sv/:sousVendeurId/conversations/:chatId/messages', authenticateToken, async (req, res) => {
  const { sousVendeurId, chatId } = req.params;
  try {
    const check = await pool.query(`SELECT id FROM chat_admin_sv WHERE id = $1 AND sous_vendeur_id = $2`, [chatId, sousVendeurId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Accès refusé' });
    const msgs = await pool.query(MSG_QUERY, [chatId]);
    await pool.query(`UPDATE chat_admin_sv_msg SET lu = true WHERE chat_id = $1 AND expediteur_role = 'admin' AND lu = false`, [chatId]);
    res.json(msgs.rows.map(formatMsg));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /sv/:sousVendeurId/conversations/:chatId/messages
router.post('/sv/:sousVendeurId/conversations/:chatId/messages', authenticateToken, async (req, res) => {
  const { sousVendeurId, chatId } = req.params;
  const { contenu, piece_jointe_url, piece_jointe_nom, piece_jointe_type } = req.body;
  if (!contenu?.trim() && !piece_jointe_url) return res.status(400).json({ error: 'Contenu requis' });

  try {
    const check = await pool.query(`SELECT id FROM chat_admin_sv WHERE id = $1 AND sous_vendeur_id = $2 AND statut = 'actif'`, [chatId, sousVendeurId]);
    if (!check.rows.length) return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });
    const { chiffre, iv } = chiffrer(contenu?.trim() || '');
    await pool.query(
      `INSERT INTO chat_admin_sv_msg (chat_id, expediteur_id, expediteur_role, contenu, iv, piece_jointe_url, piece_jointe_nom, piece_jointe_type)
       VALUES ($1, $2, 'sous_vendeur', $3, $4, $5, $6, $7)`,
      [chatId, sousVendeurId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null, piece_jointe_type || null]
    );
    await pool.query(`UPDATE chat_admin_sv SET updated_at = NOW() WHERE id = $1`, [chatId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;