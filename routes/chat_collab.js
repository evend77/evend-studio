/**
 * routes/chat_sv.js — e-Vend Studio
 * Chat chiffré AES-256-CBC entre sous-vendeurs et acheteurs
 * Photos hébergées sur AWS S3 (via /api/upload existant)
 *
 * Tables : chat_sv_acheteur, chat_sv_acheteur_msg
 *
 * Routes montées sur : /api/chat-sv/:vendeurId
 *
 * ── Côté sous-vendeur ──
 * GET  /sv/:sousVendeurId/conversations
 * POST /sv/:sousVendeurId/conversations/:chatId/messages
 * GET  /sv/:sousVendeurId/conversations/:chatId/messages
 * PUT  /sv/:sousVendeurId/conversations/:chatId/statut
 *
 * ── Côté acheteur ──
 * GET  /sous-vendeurs                               — liste SV disponibles
 * GET  /acheteur/:acheteurId/conversations
 * POST /acheteur/:acheteurId/conversations          — nouvelle conv
 * GET  /acheteur/:acheteurId/conversations/:chatId/messages
 * POST /acheteur/:acheteurId/conversations/:chatId/messages
 *
 * ── Côté vendeur (surveillance) ──
 * GET  /surveillance                                — tous les chats du site
 * GET  /surveillance/:chatId/messages               — messages déchiffrés
 * POST /surveillance/:chatId/intervention           — intervention vendeur
 * PUT  /surveillance/:chatId/statut                 — changer statut
 * DELETE /surveillance/messages/:msgId              — supprimer message
 */

const express = require('express');
const router  = express.Router({ mergeParams: true }); // pour accéder à :vendeurId
const crypto  = require('crypto');
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ══════════════════════════════════════════════════════════════════
// CHIFFREMENT AES-256-CBC — même pattern que messagerie.js
// ══════════════════════════════════════════════════════════════════

const ENCRYPTION_KEY = Buffer.from(
    process.env.MSG_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 64),
    'hex'
).slice(0, 32); // 32 bytes = 256 bits

function chiffrer(texte) {
    const iv     = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let chiffre  = cipher.update(texte || '', 'utf8', 'base64');
    chiffre += cipher.final('base64');
    return { chiffre, iv: iv.toString('hex') };
}

function dechiffrer(chiffre, ivHex) {
    try {
        const iv       = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let dechiffre  = decipher.update(chiffre, 'base64', 'utf8');
        dechiffre += decipher.final('utf8');
        return dechiffre;
    } catch {
        return '[Message non déchiffrable]';
    }
}

// ── Helper : vérifier que le site appartient au vendeur ───────────────────────
async function getSiteId(vendeurId) {
    const r = await pool.query(`SELECT id FROM sites WHERE vendeur_id = $1`, [vendeurId]);
    return r.rows[0]?.id ?? null;
}

// ── Helper : compter messages non lus ─────────────────────────────────────────
async function nbNonLus(chatId, role) {
    const r = await pool.query(
        `SELECT COUNT(*) FROM chat_sv_acheteur_msg
          WHERE chat_id = $1 AND expediteur_role <> $2 AND lu = false`,
        [chatId, role]
    );
    return parseInt(r.rows[0].count, 10);
}

// ── Helper : marquer messages lus ─────────────────────────────────────────────
async function marquerLus(chatId, role) {
    await pool.query(
        `UPDATE chat_sv_acheteur_msg SET lu = true
          WHERE chat_id = $1 AND expediteur_role <> $2 AND lu = false`,
        [chatId, role]
    );
}

// ── Helper : formater un message row ─────────────────────────────────────────
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
        est_intervention: m.est_intervention,
        supprime:         m.supprime,
        created_at:       m.created_at,
    };
}

// ════════════════════════════════════════════════════════════════════════
// CÔTÉ SOUS-VENDEUR
// ════════════════════════════════════════════════════════════════════════

// GET /api/chat-sv/:vendeurId/sv/:sousVendeurId/conversations
router.get('/sv/:sousVendeurId/conversations', authenticateToken, async (req, res) => {
    const { vendeurId, sousVendeurId } = req.params;
    try {
        const siteId = await getSiteId(vendeurId);
        if (!siteId) return res.json([]);

        const rows = await pool.query(`
            SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
                   a.id AS acheteur_id, a.email AS acheteur_email,
                   TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')) AS acheteur_nom,
                   (SELECT contenu FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_chiffre,
                   (SELECT iv      FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_iv,
                   (SELECT created_at FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_date,
                   (SELECT COUNT(*) FROM chat_sv_acheteur_msg WHERE chat_id = c.id AND expediteur_role <> 'sous_vendeur' AND lu = false) AS non_lus
              FROM chat_sv_acheteur c
              JOIN acheteurs a ON a.id = c.acheteur_id
             WHERE c.site_id = $1 AND c.sous_vendeur_id = $2 AND c.statut <> 'archive'
             ORDER BY c.updated_at DESC
        `, [siteId, sousVendeurId]);

        const convs = rows.rows.map(r => ({
            id: r.id, sujet: r.sujet, statut: r.statut,
            created_at: r.created_at, updated_at: r.updated_at,
            acheteur: { id: r.acheteur_id, nom: r.acheteur_nom, email: r.acheteur_email },
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
            non_lus: parseInt(r.non_lus, 10) || 0,
        }));

        res.json(convs);
    } catch (err) {
        console.error('❌ GET sv conversations:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat-sv/:vendeurId/sv/:sousVendeurId/conversations/:chatId/messages
router.get('/sv/:sousVendeurId/conversations/:chatId/messages', authenticateToken, async (req, res) => {
    const { vendeurId, sousVendeurId, chatId } = req.params;
    try {
        const check = await pool.query(
            `SELECT id FROM chat_sv_acheteur WHERE id = $1 AND sous_vendeur_id = $2`,
            [chatId, sousVendeurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé' });

        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_id, m.expediteur_role, m.contenu, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.est_intervention, m.supprime, m.created_at,
                   CASE
                     WHEN m.expediteur_role = 'sous_vendeur' THEN sv.nom
                     WHEN m.expediteur_role = 'acheteur'     THEN TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                     ELSE 'Propriétaire'
                   END AS expediteur_nom
              FROM chat_sv_acheteur_msg m
              JOIN chat_sv_acheteur c ON c.id = m.chat_id
         LEFT JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
         LEFT JOIN acheteurs a       ON a.id  = c.acheteur_id
             WHERE m.chat_id = $1
             ORDER BY m.created_at ASC
        `, [chatId]);

        await marquerLus(chatId, 'sous_vendeur');
        res.json(msgs.rows.map(formatMsg));
    } catch (err) {
        console.error('❌ GET sv messages:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat-sv/:vendeurId/sv/:sousVendeurId/conversations/:chatId/messages
router.post('/sv/:sousVendeurId/conversations/:chatId/messages', authenticateToken, async (req, res) => {
    const { sousVendeurId, chatId } = req.params;
    const { contenu, piece_jointe_url, piece_jointe_nom, piece_jointe_type } = req.body;

    if (!contenu?.trim() && !piece_jointe_url) return res.status(400).json({ error: 'Contenu requis' });

    try {
        const check = await pool.query(
            `SELECT id FROM chat_sv_acheteur WHERE id = $1 AND sous_vendeur_id = $2 AND statut = 'actif'`,
            [chatId, sousVendeurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });

        const { chiffre, iv } = chiffrer(contenu?.trim() || '');
        const result = await pool.query(
            `INSERT INTO chat_sv_acheteur_msg
               (chat_id, expediteur_id, expediteur_role, contenu, iv, piece_jointe_url, piece_jointe_nom, piece_jointe_type)
             VALUES ($1, $2, 'sous_vendeur', $3, $4, $5, $6, $7)
             RETURNING id, created_at`,
            [chatId, sousVendeurId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null, piece_jointe_type || null]
        );
        await pool.query(`UPDATE chat_sv_acheteur SET updated_at = NOW() WHERE id = $1`, [chatId]);

        console.log('✅ Message SV envoyé — chat:', chatId, '| SV:', sousVendeurId);
        res.json({ id: result.rows[0].id, created_at: result.rows[0].created_at });
    } catch (err) {
        console.error('❌ POST sv message:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/chat-sv/:vendeurId/sv/:sousVendeurId/conversations/:chatId/statut
router.put('/sv/:sousVendeurId/conversations/:chatId/statut', authenticateToken, async (req, res) => {
    const { sousVendeurId, chatId } = req.params;
    const { statut } = req.body;
    const STATUTS = ['actif', 'resolu', 'ferme'];
    if (!STATUTS.includes(statut)) return res.status(400).json({ error: 'Statut invalide' });

    try {
        await pool.query(
            `UPDATE chat_sv_acheteur SET statut = $1, updated_at = NOW()
              WHERE id = $2 AND sous_vendeur_id = $3`,
            [statut, chatId, sousVendeurId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════
// CÔTÉ ACHETEUR
// ════════════════════════════════════════════════════════════════════════

// GET /api/chat-sv/:vendeurId/sous-vendeurs — liste des SV actifs du site
router.get('/sous-vendeurs', authenticateToken, async (req, res) => {
    const { vendeurId } = req.params;
    try {
        const siteId = await getSiteId(vendeurId);
        if (!siteId) return res.json([]);

        const rows = await pool.query(
            `SELECT id, nom, nom_boutique FROM sous_vendeurs
              WHERE site_id = $1 AND statut = 'actif'
              ORDER BY nom_boutique ASC`,
            [siteId]
        );
        res.json(rows.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat-sv/:vendeurId/acheteur/:acheteurId/conversations
router.get('/acheteur/:acheteurId/conversations', authenticateToken, async (req, res) => {
    const { vendeurId, acheteurId } = req.params;
    try {
        const siteId = await getSiteId(vendeurId);
        if (!siteId) return res.json([]);

        const rows = await pool.query(`
            SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
                   sv.id AS sv_id, sv.nom AS sv_nom, sv.nom_boutique AS sv_boutique,
                   (SELECT contenu    FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_chiffre,
                   (SELECT iv         FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_iv,
                   (SELECT created_at FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_date,
                   (SELECT COUNT(*) FROM chat_sv_acheteur_msg WHERE chat_id = c.id AND expediteur_role <> 'acheteur' AND lu = false) AS non_lus
              FROM chat_sv_acheteur c
              JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
             WHERE c.site_id = $1 AND c.acheteur_id = $2 AND c.statut <> 'archive'
             ORDER BY c.updated_at DESC
        `, [siteId, acheteurId]);

        const convs = rows.rows.map(r => ({
            id: r.id, sujet: r.sujet, statut: r.statut,
            created_at: r.created_at, updated_at: r.updated_at,
            sous_vendeur: { id: r.sv_id, nom: r.sv_nom, boutique: r.sv_boutique },
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
            non_lus: parseInt(r.non_lus, 10) || 0,
        }));

        res.json(convs);
    } catch (err) {
        console.error('❌ GET acheteur conversations:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat-sv/:vendeurId/acheteur/:acheteurId/conversations — nouvelle conv
router.post('/acheteur/:acheteurId/conversations', authenticateToken, async (req, res) => {
    const { vendeurId, acheteurId } = req.params;
    const { sous_vendeur_id, sujet, message } = req.body;

    if (!sous_vendeur_id || !message?.trim()) return res.status(400).json({ error: 'sous_vendeur_id et message requis' });

    try {
        const siteId = await getSiteId(vendeurId);
        if (!siteId) return res.status(404).json({ error: 'Site introuvable' });

        // Vérifier si une conversation active existe déjà
        const exist = await pool.query(
            `SELECT id FROM chat_sv_acheteur
              WHERE site_id = $1 AND sous_vendeur_id = $2 AND acheteur_id = $3
                AND statut = 'actif' LIMIT 1`,
            [siteId, sous_vendeur_id, acheteurId]
        );

        let chatId;
        if (exist.rows.length > 0) {
            chatId = exist.rows[0].id;
        } else {
            const c = await pool.query(
                `INSERT INTO chat_sv_acheteur (site_id, sous_vendeur_id, acheteur_id, sujet)
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [siteId, sous_vendeur_id, acheteurId, sujet?.trim() || 'Nouvelle conversation']
            );
            chatId = c.rows[0].id;
        }

        // Chiffrer et insérer le premier message
        const { chiffre, iv } = chiffrer(message.trim());
        await pool.query(
            `INSERT INTO chat_sv_acheteur_msg (chat_id, expediteur_id, expediteur_role, contenu, iv)
             VALUES ($1, $2, 'acheteur', $3, $4)`,
            [chatId, acheteurId, chiffre, iv]
        );
        await pool.query(`UPDATE chat_sv_acheteur SET updated_at = NOW() WHERE id = $1`, [chatId]);

        // Retourner la conversation complète
        const conv = await pool.query(`
            SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
                   sv.id AS sv_id, sv.nom AS sv_nom, sv.nom_boutique AS sv_boutique
              FROM chat_sv_acheteur c
              JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
             WHERE c.id = $1
        `, [chatId]);

        const r = conv.rows[0];
        res.json({
            conversation: {
                id: r.id, sujet: r.sujet, statut: r.statut,
                created_at: r.created_at, updated_at: r.updated_at,
                sous_vendeur: { id: r.sv_id, nom: r.sv_nom, boutique: r.sv_boutique },
                dernier_message: message.trim(), dernier_message_date: new Date(), non_lus: 0,
            }
        });
    } catch (err) {
        console.error('❌ POST acheteur conversation:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat-sv/:vendeurId/acheteur/:acheteurId/conversations/:chatId/messages
router.get('/acheteur/:acheteurId/conversations/:chatId/messages', authenticateToken, async (req, res) => {
    const { acheteurId, chatId } = req.params;
    try {
        const check = await pool.query(
            `SELECT id FROM chat_sv_acheteur WHERE id = $1 AND acheteur_id = $2`,
            [chatId, acheteurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé' });

        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_id, m.expediteur_role, m.contenu, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.est_intervention, m.supprime, m.created_at,
                   CASE
                     WHEN m.expediteur_role = 'sous_vendeur' THEN sv.nom
                     WHEN m.expediteur_role = 'acheteur'     THEN TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                     ELSE 'Propriétaire'
                   END AS expediteur_nom
              FROM chat_sv_acheteur_msg m
              JOIN chat_sv_acheteur c ON c.id = m.chat_id
         LEFT JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
         LEFT JOIN acheteurs a       ON a.id  = c.acheteur_id
             WHERE m.chat_id = $1
             ORDER BY m.created_at ASC
        `, [chatId]);

        await marquerLus(chatId, 'acheteur');
        res.json(msgs.rows.map(formatMsg));
    } catch (err) {
        console.error('❌ GET acheteur messages:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat-sv/:vendeurId/acheteur/:acheteurId/conversations/:chatId/messages
router.post('/acheteur/:acheteurId/conversations/:chatId/messages', authenticateToken, async (req, res) => {
    const { acheteurId, chatId } = req.params;
    const { contenu, piece_jointe_url, piece_jointe_nom, piece_jointe_type } = req.body;

    if (!contenu?.trim() && !piece_jointe_url) return res.status(400).json({ error: 'Contenu requis' });

    try {
        const check = await pool.query(
            `SELECT id FROM chat_sv_acheteur WHERE id = $1 AND acheteur_id = $2 AND statut = 'actif'`,
            [chatId, acheteurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });

        const { chiffre, iv } = chiffrer(contenu?.trim() || '');
        const result = await pool.query(
            `INSERT INTO chat_sv_acheteur_msg
               (chat_id, expediteur_id, expediteur_role, contenu, iv, piece_jointe_url, piece_jointe_nom, piece_jointe_type)
             VALUES ($1, $2, 'acheteur', $3, $4, $5, $6, $7)
             RETURNING id, created_at`,
            [chatId, acheteurId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null, piece_jointe_type || null]
        );
        await pool.query(`UPDATE chat_sv_acheteur SET updated_at = NOW() WHERE id = $1`, [chatId]);

        console.log('✅ Message acheteur envoyé — chat:', chatId);
        res.json({ id: result.rows[0].id, created_at: result.rows[0].created_at });
    } catch (err) {
        console.error('❌ POST acheteur message:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════════════════════
// CÔTÉ VENDEUR — SURVEILLANCE
// ════════════════════════════════════════════════════════════════════════

// GET /api/chat-sv/:vendeurId/surveillance — tous les chats du site
router.get('/surveillance', authenticateToken, async (req, res) => {
    const { vendeurId } = req.params;
    try {
        const siteId = await getSiteId(vendeurId);
        if (!siteId) return res.json([]);

        const rows = await pool.query(`
            SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
                   sv.id AS sv_id, sv.nom AS sv_nom, sv.nom_boutique AS sv_boutique,
                   a.id AS a_id, a.email AS a_email,
                   TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')) AS a_nom,
                   (SELECT contenu    FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_chiffre,
                   (SELECT iv         FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_iv,
                   (SELECT created_at FROM chat_sv_acheteur_msg WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS dm_date,
                   (SELECT COUNT(*) FROM chat_sv_acheteur_msg WHERE chat_id = c.id) AS nb_messages
              FROM chat_sv_acheteur c
              JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
              JOIN acheteurs a       ON a.id  = c.acheteur_id
             WHERE c.site_id = $1
             ORDER BY c.updated_at DESC
        `, [siteId]);

        const chats = rows.rows.map(r => ({
            id: r.id, sujet: r.sujet, statut: r.statut,
            created_at: r.created_at, updated_at: r.updated_at,
            nb_messages: parseInt(r.nb_messages, 10) || 0,
            sous_vendeur: { id: r.sv_id, nom: r.sv_nom, nom_boutique: r.sv_boutique },
            acheteur:     { id: r.a_id,  nom: r.a_nom,  email: r.a_email },
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
        }));

        res.json(chats);
    } catch (err) {
        console.error('❌ GET surveillance:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat-sv/:vendeurId/surveillance/:chatId/messages
router.get('/surveillance/:chatId/messages', authenticateToken, async (req, res) => {
    const { vendeurId, chatId } = req.params;
    try {
        const siteId = await getSiteId(vendeurId);
        const check  = await pool.query(
            `SELECT id FROM chat_sv_acheteur WHERE id = $1 AND site_id = $2`,
            [chatId, siteId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé' });

        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_id, m.expediteur_role, m.contenu, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.est_intervention, m.supprime, m.created_at,
                   CASE
                     WHEN m.expediteur_role = 'sous_vendeur' THEN sv.nom
                     WHEN m.expediteur_role = 'acheteur'     THEN TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                     ELSE 'Propriétaire'
                   END AS expediteur_nom
              FROM chat_sv_acheteur_msg m
              JOIN chat_sv_acheteur c ON c.id = m.chat_id
         LEFT JOIN sous_vendeurs sv ON sv.id = c.sous_vendeur_id
         LEFT JOIN acheteurs a       ON a.id  = c.acheteur_id
             WHERE m.chat_id = $1
             ORDER BY m.created_at ASC
        `, [chatId]);

        res.json(msgs.rows.map(formatMsg));
    } catch (err) {
        console.error('❌ GET surveillance messages:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat-sv/:vendeurId/surveillance/:chatId/intervention
router.post('/surveillance/:chatId/intervention', authenticateToken, async (req, res) => {
    const { vendeurId, chatId } = req.params;
    const { contenu } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ error: 'Contenu requis' });

    try {
        const siteId = await getSiteId(vendeurId);
        const check  = await pool.query(
            `SELECT id FROM chat_sv_acheteur WHERE id = $1 AND site_id = $2`,
            [chatId, siteId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé' });

        const { chiffre, iv } = chiffrer(contenu.trim());
        await pool.query(
            `INSERT INTO chat_sv_acheteur_msg
               (chat_id, expediteur_id, expediteur_role, contenu, iv, est_intervention)
             VALUES ($1, $2, 'proprietaire', $3, $4, true)`,
            [chatId, vendeurId, chiffre, iv]
        );
        await pool.query(`UPDATE chat_sv_acheteur SET updated_at = NOW() WHERE id = $1`, [chatId]);

        console.log('⭐ Intervention vendeur — chat:', chatId, '| vendeur:', vendeurId);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ POST intervention:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/chat-sv/:vendeurId/surveillance/:chatId/statut
router.put('/surveillance/:chatId/statut', authenticateToken, async (req, res) => {
    const { vendeurId, chatId } = req.params;
    const { statut } = req.body;
    const STATUTS = ['actif', 'resolu', 'ferme', 'archive'];
    if (!STATUTS.includes(statut)) return res.status(400).json({ error: 'Statut invalide' });

    try {
        const siteId = await getSiteId(vendeurId);
        await pool.query(
            `UPDATE chat_sv_acheteur SET statut = $1, updated_at = NOW()
              WHERE id = $2 AND site_id = $3`,
            [statut, chatId, siteId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/chat-sv/:vendeurId/surveillance/messages/:msgId
router.delete('/surveillance/messages/:msgId', authenticateToken, async (req, res) => {
    const { vendeurId, msgId } = req.params;
    try {
        const siteId = await getSiteId(vendeurId);
        // Vérifier que le message appartient à un chat du site
        const check = await pool.query(`
            SELECT m.id FROM chat_sv_acheteur_msg m
              JOIN chat_sv_acheteur c ON c.id = m.chat_id
             WHERE m.id = $1 AND c.site_id = $2
        `, [msgId, siteId]);
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé' });

        await pool.query(
            `UPDATE chat_sv_acheteur_msg SET supprime = true WHERE id = $1`,
            [msgId]
        );
        console.log('🗑️ Message supprimé par vendeur — msg:', msgId);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ DELETE message:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;