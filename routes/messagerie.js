/**
 * routes/messagerie.js
 * Messagerie interne chiffrée AES-256-CBC
 * Polling + pièces jointes + interventions admin
 * Trois types de conversations :
 * - acheteur ↔ vendeur (table conversations)
 * - vendeur ↔ admin (tables conversations_admin / messages_admin)
 * - acheteur ↔ admin (tables conversations_admin_acheteur / messages_admin_acheteur)
 */
const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const pool     = require('../db');
const { authenticateToken, isAdmin, isVendeur } = require('../middleware/auth');

// ── Chiffrement AES-256-CBC ────────────────────────────────────────────────
const ENCRYPTION_KEY = Buffer.from(
    process.env.MSG_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 64),
    'hex'
).slice(0, 32); // 32 bytes = 256 bits

function chiffrer(texte) {
    const iv  = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let chiffre  = cipher.update(texte, 'utf8', 'base64');
    chiffre += cipher.final('base64');
    return { chiffre, iv: iv.toString('hex') };
}

function dechiffrer(chiffre, ivHex) {
    try {
        const iv      = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let dechiffre  = decipher.update(chiffre, 'base64', 'utf8');
        dechiffre += decipher.final('utf8');
        return dechiffre;
    } catch {
        return '[Message non déchiffrable]';
    }
}

// ── Helper: nb messages non lus pour un utilisateur dans une conversation ──
async function nbNonLus(convId, userId, role, table = 'messages') {
    const res = await pool.query(`
        SELECT COUNT(*) FROM ${table} m
        WHERE m.conversation_id = $1
          AND m.expediteur_role <> $2
          AND NOT EXISTS (
            SELECT 1 FROM messages_lus ml
            WHERE ml.message_id = m.id AND ml.utilisateur_id = $3 AND ml.role = $2
          )
    `, [convId, role, userId]);
    return parseInt(res.rows[0].count);
}

// ── Helper: marquer tous les messages d'une conv comme lus ─────────────────
async function marquerLus(convId, userId, role) {
    const msgs = await pool.query(
        `SELECT m.id FROM messages m
         WHERE m.conversation_id = $1
           AND m.expediteur_role <> $2
           AND NOT EXISTS (
             SELECT 1 FROM messages_lus ml
             WHERE ml.message_id = m.id AND ml.utilisateur_id = $3 AND ml.role = $2
           )`,
        [convId, role, userId]
    );
    for (const msg of msgs.rows) {
        await pool.query(
            `INSERT INTO messages_lus (message_id, utilisateur_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [msg.id, userId, role]
        );
    }
}

// ════════════════════════════════════════════════════════════════
// PARTIE 1 : ACHETEUR ↔ VENDEUR (table conversations)
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/acheteur/conversations — liste conversations acheteur avec vendeurs
router.get('/acheteur/conversations', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const rows = await pool.query(`
            SELECT
                c.id, c.sujet, c.statut, c.est_litige, c.commande_id,
                c.cree_le, c.mis_a_jour_le,
                v.id AS vendeur_id, v.nom AS vendeur_nom, v.boutique AS vendeur_boutique,
                (SELECT m.contenu_chiffre FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_chiffre,
                (SELECT m.iv             FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_iv,
                (SELECT m.cree_le        FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_date
            FROM conversations c
            JOIN vendeurs v ON v.id = c.vendeur_id
            WHERE c.acheteur_id = $1 AND c.statut <> 'archive'
            ORDER BY c.mis_a_jour_le DESC
        `, [acheteurId]);

        const convs = await Promise.all(rows.rows.map(async r => ({
            id: r.id, sujet: r.sujet, statut: r.statut,
            est_litige: r.est_litige, commande_id: r.commande_id,
            cree_le: r.cree_le, mis_a_jour_le: r.mis_a_jour_le,
            vendeur: { id: r.vendeur_id, nom: r.vendeur_nom, boutique: r.vendeur_boutique },
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
            non_lus: await nbNonLus(r.id, acheteurId, 'acheteur'),
        })));

        res.json(convs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/messagerie/acheteur/conversations — nouvelle conversation avec vendeur
router.post('/acheteur/conversations', authenticateToken, async (req, res) => {
    try {
        const { vendeur_id, sujet, commande_id, message } = req.body;
        if (!vendeur_id || !message?.trim()) return res.status(400).json({ error: 'vendeur_id et message requis' });

        const acheteurId = req.user.id;

        const exist = await pool.query(
            `SELECT id FROM conversations WHERE acheteur_id=$1 AND vendeur_id=$2 AND statut NOT IN ('archive','ferme') LIMIT 1`,
            [acheteurId, vendeur_id]
        );

        let convId;
        if (exist.rows.length > 0) {
            convId = exist.rows[0].id;
        } else {
            const c = await pool.query(
                `INSERT INTO conversations (acheteur_id, vendeur_id, sujet, commande_id, ouvert_par)
                 VALUES ($1, $2, $3, $4, 'acheteur') RETURNING id`,
                [acheteurId, vendeur_id, sujet || 'Nouvelle conversation', commande_id || null]
            );
            convId = c.rows[0].id;
        }

        const { chiffre, iv } = chiffrer(message.trim());
        await pool.query(
            `INSERT INTO messages (conversation_id, expediteur_id, expediteur_role, contenu_chiffre, iv)
             VALUES ($1, $2, 'acheteur', $3, $4)`,
            [convId, acheteurId, chiffre, iv]
        );

        await pool.query(`UPDATE conversations SET mis_a_jour_le = NOW() WHERE id = $1`, [convId]);

        res.json({ conversation_id: convId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/messagerie/acheteur/conversations/:id/messages
router.get('/acheteur/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const convId     = parseInt(req.params.id);
        const since      = req.query.since;

        const check = await pool.query(
            `SELECT id FROM conversations WHERE id=$1 AND acheteur_id=$2`,
            [convId, acheteurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé' });

        let query = `
            SELECT m.id, m.expediteur_id, m.expediteur_role, m.contenu_chiffre, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.est_intervention, m.cree_le,
                   CASE
                     WHEN m.expediteur_role = 'acheteur' THEN (
                         SELECT TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                         FROM acheteurs a WHERE a.id = m.expediteur_id
                     )
                     WHEN m.expediteur_role = 'vendeur'  THEN (SELECT nom FROM vendeurs WHERE id = m.expediteur_id)
                     ELSE 'Admin e-Vend'
                   END AS expediteur_nom
            FROM messages m
            WHERE m.conversation_id = $1
        `;
        const params = [convId];
        if (since) { query += ` AND m.cree_le > $2`; params.push(since); }
        query += ` ORDER BY m.cree_le ASC`;

        const msgs = await pool.query(query, params);
        await marquerLus(convId, acheteurId, 'acheteur');

        res.json(msgs.rows.map(m => ({
            id: m.id,
            expediteur_id: m.expediteur_id,
            expediteur_role: m.expediteur_role,
            expediteur_nom: m.expediteur_nom,
            contenu: dechiffrer(m.contenu_chiffre, m.iv),
            piece_jointe_url:  m.piece_jointe_url,
            piece_jointe_nom:  m.piece_jointe_nom,
            piece_jointe_type: m.piece_jointe_type,
            est_intervention:  m.est_intervention,
            cree_le: m.cree_le,
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/messagerie/acheteur/conversations/:id/messages
router.post('/acheteur/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const convId     = parseInt(req.params.id);
        const { contenu, piece_jointe_url, piece_jointe_nom, piece_jointe_type } = req.body;

        if (!contenu?.trim() && !piece_jointe_url) return res.status(400).json({ error: 'Contenu requis' });

        const check = await pool.query(
            `SELECT id FROM conversations WHERE id=$1 AND acheteur_id=$2 AND statut NOT IN ('ferme','archive')`,
            [convId, acheteurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });

        const { chiffre, iv } = chiffrer(contenu?.trim() || '');
        const result = await pool.query(
            `INSERT INTO messages (conversation_id, expediteur_id, expediteur_role, contenu_chiffre, iv, piece_jointe_url, piece_jointe_nom, piece_jointe_type)
             VALUES ($1, $2, 'acheteur', $3, $4, $5, $6, $7) RETURNING id, cree_le`,
            [convId, acheteurId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null, piece_jointe_type || null]
        );

        await pool.query(`UPDATE conversations SET mis_a_jour_le = NOW() WHERE id = $1`, [convId]);

        res.json({ id: result.rows[0].id, cree_le: result.rows[0].cree_le });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// ROUTES VENDEUR (vendeur ↔ acheteur) - Table "conversations"
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/vendeur/conversations
router.get('/vendeur/conversations', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const rows = await pool.query(`
            SELECT
                c.id, c.sujet, c.statut, c.est_litige, c.commande_id,
                c.cree_le, c.mis_a_jour_le,
                a.id AS acheteur_id,
                a.email AS acheteur_email,
                TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')) AS acheteur_nom,
                (SELECT m.contenu_chiffre FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_chiffre,
                (SELECT m.iv             FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_iv,
                (SELECT m.cree_le        FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_date
            FROM conversations c
            JOIN acheteurs a ON a.id = c.acheteur_id
            WHERE c.vendeur_id = $1 AND c.statut <> 'archive'
            ORDER BY c.mis_a_jour_le DESC
        `, [vendeurId]);

        const convs = await Promise.all(rows.rows.map(async r => ({
            id: r.id, sujet: r.sujet, statut: r.statut,
            est_litige: r.est_litige, commande_id: r.commande_id,
            cree_le: r.cree_le, mis_a_jour_le: r.mis_a_jour_le,
            acheteur: { id: r.acheteur_id, nom: r.acheteur_nom, email: r.acheteur_email },
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
            non_lus: await nbNonLus(r.id, vendeurId, 'vendeur'),
        })));

        res.json(convs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/messagerie/vendeur/conversations/:id/messages
router.get('/vendeur/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const convId    = parseInt(req.params.id);
        const since     = req.query.since;

        const check = await pool.query(
            `SELECT id FROM conversations WHERE id=$1 AND vendeur_id=$2`,
            [convId, vendeurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé' });

        let query = `
            SELECT m.id, m.expediteur_id, m.expediteur_role, m.contenu_chiffre, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.est_intervention, m.cree_le,
                   CASE
                     WHEN m.expediteur_role = 'acheteur' THEN (
                         SELECT TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                         FROM acheteurs a WHERE a.id = m.expediteur_id
                     )
                     WHEN m.expediteur_role = 'vendeur'  THEN (SELECT nom FROM vendeurs WHERE id = m.expediteur_id)
                     ELSE 'Admin e-Vend'
                   END AS expediteur_nom
            FROM messages m WHERE m.conversation_id = $1
        `;
        const params = [convId];
        if (since) { query += ` AND m.cree_le > $2`; params.push(since); }
        query += ` ORDER BY m.cree_le ASC`;

        const msgs = await pool.query(query, params);
        await marquerLus(convId, vendeurId, 'vendeur');

        res.json(msgs.rows.map(m => ({
            id: m.id, expediteur_id: m.expediteur_id,
            expediteur_role: m.expediteur_role, expediteur_nom: m.expediteur_nom,
            contenu: dechiffrer(m.contenu_chiffre, m.iv),
            piece_jointe_url: m.piece_jointe_url, piece_jointe_nom: m.piece_jointe_nom,
            piece_jointe_type: m.piece_jointe_type,
            est_intervention: m.est_intervention, cree_le: m.cree_le,
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/messagerie/vendeur/conversations/:id/messages
router.post('/vendeur/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const convId    = parseInt(req.params.id);
        const { contenu, piece_jointe_url, piece_jointe_nom, piece_jointe_type } = req.body;

        if (!contenu?.trim() && !piece_jointe_url) return res.status(400).json({ error: 'Contenu requis' });

        const check = await pool.query(
            `SELECT id FROM conversations WHERE id=$1 AND vendeur_id=$2 AND statut NOT IN ('ferme','archive')`,
            [convId, vendeurId]
        );
        if (check.rows.length === 0) return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });

        const { chiffre, iv } = chiffrer(contenu?.trim() || '');
        const result = await pool.query(
            `INSERT INTO messages (conversation_id, expediteur_id, expediteur_role, contenu_chiffre, iv, piece_jointe_url, piece_jointe_nom, piece_jointe_type)
             VALUES ($1, $2, 'vendeur', $3, $4, $5, $6, $7) RETURNING id, cree_le`,
            [convId, vendeurId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null, piece_jointe_type || null]
        );

        await pool.query(`UPDATE conversations SET mis_a_jour_le = NOW() WHERE id = $1`, [convId]);

        res.json({ id: result.rows[0].id, cree_le: result.rows[0].cree_le });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 2 : VENDEUR ↔ ADMIN (tables conversations_admin / messages_admin)
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/vendeur/admin/conversations — Liste des conversations vendeur avec admin
router.get('/vendeur/admin/conversations', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const rows = await pool.query(`
            SELECT
                c.id, c.sujet AS titre, c.statut, c.priorite,
                c.cree_le, c.mis_a_jour_le AS "derniereActivite",
                (SELECT COUNT(*) FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 AND m.expediteur_role = 'admin' 
                 AND m.lu = false) AS "nonLusAdmin",
                (SELECT m.contenu_chiffre FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_chiffre,
                (SELECT m.iv FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_iv,
                (SELECT m.cree_le FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_date
            FROM conversations_admin c
            WHERE c.vendeur_id = $1 AND c.statut != 'archive'
            ORDER BY c.mis_a_jour_le DESC
        `, [vendeurId]);

        const convs = rows.rows.map(r => ({
            id: r.id,
            titre: r.titre,
            statut: r.statut || 'ouvert',
            priorite: r.priorite || 'normale',
            derniereActivite: r.derniereActivite,
            nonLusAdmin: parseInt(r.nonLusAdmin) || 0,
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
        }));

        res.json(convs);
    } catch (err) { 
        console.error('Erreur GET vendeur/admin conversations:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/vendeur/admin/conversations — Nouvelle conversation avec admin
router.post('/vendeur/admin/conversations', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const { sujet } = req.body;
        
        if (!sujet?.trim()) {
            return res.status(400).json({ error: 'Le sujet est requis' });
        }

        const result = await pool.query(
            `INSERT INTO conversations_admin (vendeur_id, sujet, statut, priorite)
             VALUES ($1, $2, 'ouvert', 'normale')
             RETURNING id, cree_le`,
            [vendeurId, sujet.trim()]
        );

        const newConv = {
            id: result.rows[0].id,
            titre: sujet.trim(),
            statut: 'ouvert',
            priorite: 'normale',
            derniereActivite: result.rows[0].cree_le,
            nonLusAdmin: 0,
            dernier_message: null,
            dernier_message_date: null,
        };

        res.json(newConv);
    } catch (err) { 
        console.error('Erreur POST vendeur/admin conversation:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// GET /api/messagerie/vendeur/admin/conversations/:id/messages
router.get('/vendeur/admin/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const convId = parseInt(req.params.id);

        const check = await pool.query(
            `SELECT id FROM conversations_admin WHERE id = $1 AND vendeur_id = $2`,
            [convId, vendeurId]
        );
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_role, 
                   m.contenu_chiffre, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.cree_le, m.supprime_par_admin, m.lu,
                   CASE 
                     WHEN m.expediteur_role = 'vendeur' THEN 'Vous'
                     ELSE 'Administration'
                   END AS expediteur_nom
            FROM messages_admin m
            WHERE m.conversation_id = $1
            ORDER BY m.cree_le ASC
        `, [convId]);

        await pool.query(
            `UPDATE messages_admin SET lu = true 
             WHERE conversation_id = $1 AND expediteur_role = 'admin' AND lu = false`,
            [convId]
        );

        const messages = msgs.rows.map(m => ({
            id: m.id,
            expediteur_role: m.expediteur_role,
            expediteur_nom: m.expediteur_nom,
            contenu: m.supprime_par_admin ? '🗑️ Message supprimé par l\'administration' : dechiffrer(m.contenu_chiffre, m.iv),
            contenu_original: m.supprime_par_admin ? dechiffrer(m.contenu_chiffre, m.iv) : undefined,
            supprime_par_admin: m.supprime_par_admin,
            piece_jointe_url: m.piece_jointe_url,
            piece_jointe_nom: m.piece_jointe_nom,
            piece_jointe_type: m.piece_jointe_type,
            cree_le: m.cree_le,
            lu: m.lu,
        }));

        res.json(messages);
    } catch (err) { 
        console.error('Erreur GET vendeur/admin messages:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/vendeur/admin/conversations/:id/messages
router.post('/vendeur/admin/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const convId = parseInt(req.params.id);
        const { contenu, piece_jointe_url, piece_jointe_nom } = req.body;

        if (!contenu?.trim() && !piece_jointe_url) {
            return res.status(400).json({ error: 'Contenu requis' });
        }

        const check = await pool.query(
            `SELECT id, statut FROM conversations_admin 
             WHERE id = $1 AND vendeur_id = $2 AND statut != 'ferme'`,
            [convId, vendeurId]
        );
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });
        }

        const { chiffre, iv } = chiffrer(contenu?.trim() || '📎 Pièce jointe');
        const result = await pool.query(
            `INSERT INTO messages_admin 
             (conversation_id, expediteur_role, contenu_chiffre, iv, 
              piece_jointe_url, piece_jointe_nom, lu)
             VALUES ($1, 'vendeur', $2, $3, $4, $5, false)
             RETURNING id, cree_le`,
            [convId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null]
        );

        await pool.query(
            `UPDATE conversations_admin SET mis_a_jour_le = NOW() WHERE id = $1`,
            [convId]
        );

        const newMsg = {
            id: result.rows[0].id,
            expediteur_role: 'vendeur',
            expediteur_nom: 'Vous',
            contenu: contenu?.trim() || '📎 Pièce jointe',
            piece_jointe_url,
            piece_jointe_nom,
            cree_le: result.rows[0].cree_le,
        };

        res.json(newMsg);
    } catch (err) { 
        console.error('Erreur POST vendeur/admin message:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/vendeur/admin/conversations/:id/lire
router.post('/vendeur/admin/conversations/:id/lire', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const convId = parseInt(req.params.id);

        await pool.query(
            `UPDATE messages_admin SET lu = true 
             WHERE conversation_id = $1 AND expediteur_role = 'admin' AND lu = false`,
            [convId]
        );

        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 3 : ACHETEUR ↔ ADMIN (tables conversations_admin_acheteur / messages_admin_acheteur)
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/acheteur/admin/conversations — Liste des conversations acheteur avec admin
router.get('/acheteur/admin/conversations', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const rows = await pool.query(`
            SELECT
                c.id, c.sujet, c.description, c.statut, c.priorite, c.categorie,
                c.cree_le, c.mis_a_jour_le, c.commande_id,
                (SELECT COUNT(*) FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 AND m.expediteur_role = 'admin' 
                 AND m.lu = false) AS non_lus,
                (SELECT m.contenu_chiffre FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_chiffre,
                (SELECT m.iv FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_iv,
                (SELECT m.cree_le FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_date
            FROM conversations_admin_acheteur c
            WHERE c.acheteur_id = $1 AND c.statut != 'archive'
            ORDER BY c.mis_a_jour_le DESC
        `, [acheteurId]);

        const convs = rows.rows.map(r => ({
            id: r.id,
            sujet: r.sujet,
            description: r.description || r.sujet,
            dateCreation: r.cree_le,
            statut: r.statut || 'ouvert',
            priorite: r.priorite || 'normale',
            categorie: r.categorie || 'Général',
            commandeId: r.commande_id,
            dernierMessage: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dateDernierMessage: r.dm_date,
            nonLus: parseInt(r.non_lus) || 0,
        }));

        res.json(convs);
    } catch (err) { 
        console.error('Erreur GET acheteur/admin conversations:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/acheteur/admin/conversations — Nouvelle conversation avec admin
router.post('/acheteur/admin/conversations', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const { sujet, description, categorie, commande_id } = req.body;
        
        if (!sujet?.trim()) {
            return res.status(400).json({ error: 'Le sujet est requis' });
        }

        const result = await pool.query(
            `INSERT INTO conversations_admin_acheteur 
             (acheteur_id, sujet, description, categorie, commande_id, statut, priorite)
             VALUES ($1, $2, $3, $4, $5, 'ouvert', 'normale')
             RETURNING id, cree_le`,
            [acheteurId, sujet.trim(), description?.trim() || sujet.trim(), categorie || 'Général', commande_id || null]
        );

        const newConv = {
            id: result.rows[0].id,
            sujet: sujet.trim(),
            description: description?.trim() || sujet.trim(),
            dateCreation: result.rows[0].cree_le,
            statut: 'ouvert',
            priorite: 'normale',
            categorie: categorie || 'Général',
            commandeId: commande_id,
            dernierMessage: null,
            dateDernierMessage: null,
            nonLus: 0,
        };

        res.json(newConv);
    } catch (err) { 
        console.error('Erreur POST acheteur/admin conversation:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// GET /api/messagerie/acheteur/admin/conversations/:id/messages
router.get('/acheteur/admin/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const convId = parseInt(req.params.id);

        const check = await pool.query(
            `SELECT id FROM conversations_admin_acheteur WHERE id = $1 AND acheteur_id = $2`,
            [convId, acheteurId]
        );
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_role, 
                   m.contenu_chiffre, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.cree_le, m.supprime_par_admin, m.lu,
                   CASE 
                     WHEN m.expediteur_role = 'acheteur' THEN 'Vous'
                     ELSE 'Administration'
                   END AS expediteur_nom
            FROM messages_admin_acheteur m
            WHERE m.conversation_id = $1
            ORDER BY m.cree_le ASC
        `, [convId]);

        await pool.query(
            `UPDATE messages_admin_acheteur SET lu = true 
             WHERE conversation_id = $1 AND expediteur_role = 'admin' AND lu = false`,
            [convId]
        );

        const messages = msgs.rows.map(m => ({
            id: m.id,
            expediteur_role: m.expediteur_role,
            expediteur_nom: m.expediteur_nom,
            contenu: m.supprime_par_admin ? '🗑️ Message supprimé par l\'administration' : dechiffrer(m.contenu_chiffre, m.iv),
            contenu_original: m.supprime_par_admin ? dechiffrer(m.contenu_chiffre, m.iv) : undefined,
            supprime_par_admin: m.supprime_par_admin,
            piece_jointe_url: m.piece_jointe_url,
            piece_jointe_nom: m.piece_jointe_nom,
            piece_jointe_type: m.piece_jointe_type,
            cree_le: m.cree_le,
            lu: m.lu,
        }));

        res.json(messages);
    } catch (err) { 
        console.error('Erreur GET acheteur/admin messages:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/acheteur/admin/conversations/:id/messages
router.post('/acheteur/admin/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const convId = parseInt(req.params.id);
        const { contenu, piece_jointe_url, piece_jointe_nom } = req.body;

        if (!contenu?.trim() && !piece_jointe_url) {
            return res.status(400).json({ error: 'Contenu requis' });
        }

        const check = await pool.query(
            `SELECT id, statut FROM conversations_admin_acheteur 
             WHERE id = $1 AND acheteur_id = $2 AND statut != 'ferme'`,
            [convId, acheteurId]
        );
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé ou conversation fermée' });
        }

        const { chiffre, iv } = chiffrer(contenu?.trim() || '');
        const result = await pool.query(
            `INSERT INTO messages_admin_acheteur 
             (conversation_id, expediteur_role, contenu_chiffre, iv, 
              piece_jointe_url, piece_jointe_nom, lu)
             VALUES ($1, 'acheteur', $2, $3, $4, $5, false)
             RETURNING id, cree_le`,
            [convId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null]
        );

        await pool.query(
            `UPDATE conversations_admin_acheteur SET mis_a_jour_le = NOW() WHERE id = $1`,
            [convId]
        );

        const newMsg = {
            id: result.rows[0].id,
            expediteur_role: 'acheteur',
            expediteur_nom: 'Vous',
            contenu: contenu?.trim() || (piece_jointe_url ? '📷 Image' : ''),
            piece_jointe_url,
            piece_jointe_nom,
            cree_le: result.rows[0].cree_le,
        };

        res.json(newMsg);
    } catch (err) { 
        console.error('Erreur POST acheteur/admin message:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/acheteur/admin/conversations/:id/lire
router.post('/acheteur/admin/conversations/:id/lire', authenticateToken, async (req, res) => {
    try {
        const acheteurId = req.user.id;
        const convId = parseInt(req.params.id);

        await pool.query(
            `UPDATE messages_admin_acheteur SET lu = true 
             WHERE conversation_id = $1 AND expediteur_role = 'admin' AND lu = false`,
            [convId]
        );

        res.json({ success: true });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 4 : ROUTES ADMIN POUR LES CONVERSATIONS AVEC ACHETEURS
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/admin/acheteur/conversations — Toutes les conversations admin ↔ acheteurs (pour admin)
router.get('/admin/acheteur/conversations', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { statut, search, limit = 50, offset = 0 } = req.query;

        let where = ['c.statut != \'archive\''];
        const params = [];
        let paramIndex = 1;

        if (statut && statut !== 'tous') {
            params.push(statut);
            where.push(`c.statut = $${paramIndex++}`);
        }
        
        if (search) {
            params.push(`%${search}%`);
            const p = paramIndex++;
            where.push(`(a.nom ILIKE $${p} OR a.prenom ILIKE $${p} OR a.email ILIKE $${p} OR c.sujet ILIKE $${p})`);
        }

        const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
        params.push(limit, offset);

        const rows = await pool.query(`
            SELECT
                c.id, c.sujet, c.statut, c.priorite, c.categorie,
                c.cree_le, c.mis_a_jour_le,
                a.id AS acheteur_id,
                a.nom AS acheteur_nom,
                a.prenom AS acheteur_prenom,
                a.email,
                c.commande_id AS commande_id,
                (SELECT COUNT(*) FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 AND m.expediteur_role = 'acheteur' 
                 AND m.lu = false) AS non_lus,
                (SELECT m.contenu_chiffre FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_chiffre,
                (SELECT m.iv FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_iv,
                (SELECT m.cree_le FROM messages_admin_acheteur m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_date
            FROM conversations_admin_acheteur c
            JOIN acheteurs a ON a.id = c.acheteur_id
            ${whereSQL}
            ORDER BY c.mis_a_jour_le DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, params);

        const convs = rows.rows.map(r => ({
            id: r.id,
            acheteurId: r.acheteur_id,
            acheteurNom: `${r.acheteur_prenom || ''} ${r.acheteur_nom || ''}`.trim() || 'Acheteur',
            email: r.email,
            avatar: (r.acheteur_prenom?.[0] || r.acheteur_nom?.[0] || 'A').toUpperCase(),
            sujet: r.sujet,
            statut: r.statut || 'ouvert',
            priorite: r.priorite || 'normale',
            categorie: r.categorie || 'Général',
            derniereActivite: r.mis_a_jour_le,
            nonLus: parseInt(r.non_lus) || 0,
            commandeId: r.commande_id,
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
        }));

        res.json(convs);
    } catch (err) { 
        console.error('Erreur GET admin/acheteur conversations:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// GET /api/messagerie/admin/acheteur/conversations/:id/messages
router.get('/admin/acheteur/conversations/:id/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);

        const check = await pool.query(
            `SELECT id, acheteur_id FROM conversations_admin_acheteur WHERE id = $1`,
            [convId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }

        const acheteurInfo = await pool.query(
            `SELECT nom, prenom FROM acheteurs WHERE id = $1`,
            [check.rows[0].acheteur_id]
        );
        const acheteurNom = acheteurInfo.rows[0] 
            ? `${acheteurInfo.rows[0].prenom || ''} ${acheteurInfo.rows[0].nom || ''}`.trim() 
            : 'Acheteur';

        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_role, 
                   m.contenu_chiffre, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.cree_le, m.supprime_par_admin, m.lu,
                   CASE 
                     WHEN m.expediteur_role = 'acheteur' THEN $2
                     ELSE 'Administration'
                   END AS expediteur_nom
            FROM messages_admin_acheteur m
            WHERE m.conversation_id = $1
            ORDER BY m.cree_le ASC
        `, [convId, acheteurNom]);

        await pool.query(
            `UPDATE messages_admin_acheteur SET lu = true 
             WHERE conversation_id = $1 AND expediteur_role = 'acheteur' AND lu = false`,
            [convId]
        );

        const messages = msgs.rows.map(m => ({
            id: m.id,
            expediteur_role: m.expediteur_role,
            expediteur_nom: m.expediteur_nom,
            contenu: m.supprime_par_admin ? '🗑️ Message supprimé par l\'administration' : dechiffrer(m.contenu_chiffre, m.iv),
            contenu_original: m.supprime_par_admin ? dechiffrer(m.contenu_chiffre, m.iv) : undefined,
            supprime_par_admin: m.supprime_par_admin,
            piece_jointe_url: m.piece_jointe_url,
            piece_jointe_nom: m.piece_jointe_nom,
            piece_jointe_type: m.piece_jointe_type,
            cree_le: m.cree_le,
            lu: m.lu,
        }));

        res.json(messages);
    } catch (err) { 
        console.error('Erreur GET admin/acheteur messages:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/admin/acheteur/conversations/:id/messages — Envoyer un message admin
router.post('/admin/acheteur/conversations/:id/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        const { contenu, piece_jointe_url, piece_jointe_nom } = req.body;

        if (!contenu?.trim() && !piece_jointe_url) {
            return res.status(400).json({ error: 'Contenu requis' });
        }

        const check = await pool.query(
            `SELECT id, statut FROM conversations_admin_acheteur WHERE id = $1 AND statut != 'ferme'`,
            [convId]
        );
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Conversation non trouvée ou fermée' });
        }

        const { chiffre, iv } = chiffrer(contenu?.trim() || '📎 Pièce jointe');
        const result = await pool.query(
            `INSERT INTO messages_admin_acheteur 
             (conversation_id, expediteur_role, contenu_chiffre, iv, 
              piece_jointe_url, piece_jointe_nom, lu)
             VALUES ($1, 'admin', $2, $3, $4, $5, false)
             RETURNING id, cree_le`,
            [convId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null]
        );

        await pool.query(
            `UPDATE conversations_admin_acheteur SET mis_a_jour_le = NOW() WHERE id = $1`,
            [convId]
        );

        const newMsg = {
            id: result.rows[0].id,
            expediteur_role: 'admin',
            expediteur_nom: 'Administration',
            contenu: contenu?.trim() || '📎 Pièce jointe',
            piece_jointe_url,
            piece_jointe_nom,
            cree_le: result.rows[0].cree_le,
        };

        res.json(newMsg);
    } catch (err) { 
        console.error('Erreur POST admin/acheteur message:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// PUT /api/messagerie/admin/acheteur/conversations/:id/statut
router.put('/admin/acheteur/conversations/:id/statut', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        const { statut } = req.body;

        if (!['ouvert', 'resolu', 'ferme'].includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        await pool.query(
            `UPDATE conversations_admin_acheteur SET statut = $1, mis_a_jour_le = NOW() WHERE id = $2`,
            [statut, convId]
        );

        res.json({ success: true });
    } catch (err) { 
        console.error('Erreur PUT admin/acheteur statut:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// PUT /api/messagerie/admin/acheteur/conversations/:id/priorite
router.put('/admin/acheteur/conversations/:id/priorite', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        const { priorite } = req.body;

        if (!['normale', 'haute', 'urgente'].includes(priorite)) {
            return res.status(400).json({ error: 'Priorité invalide' });
        }

        await pool.query(
            `UPDATE conversations_admin_acheteur SET priorite = $1, mis_a_jour_le = NOW() WHERE id = $2`,
            [priorite, convId]
        );

        res.json({ success: true });
    } catch (err) { 
        console.error('Erreur PUT admin/acheteur priorite:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 5 : ROUTES ADMIN POUR VENDEURS
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/admin/vendeur/conversations — Toutes les conversations admin ↔ vendeurs
router.get('/admin/vendeur/conversations', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { statut, search, limit = 50, offset = 0 } = req.query;

        let where = ['c.statut != \'archive\''];
        const params = [];
        let paramIndex = 1;

        if (statut && statut !== 'tous') {
            params.push(statut);
            where.push(`c.statut = $${paramIndex++}`);
        }
        
        if (search) {
            params.push(`%${search}%`);
            const p = paramIndex++;
            where.push(`(v.nom ILIKE $${p} OR v.boutique ILIKE $${p} OR c.sujet ILIKE $${p})`);
        }

        const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
        params.push(limit, offset);

        const rows = await pool.query(`
            SELECT
                c.id, c.sujet, c.statut, c.priorite,
                c.cree_le, c.mis_a_jour_le,
                v.id AS vendeur_id, v.nom AS vendeur_nom, v.boutique,
                (SELECT COUNT(*) FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 AND m.expediteur_role = 'vendeur' 
                 AND m.lu = false) AS non_lus,
                (SELECT m.contenu_chiffre FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_chiffre,
                (SELECT m.iv FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_iv,
                (SELECT m.cree_le FROM messages_admin m 
                 WHERE m.conversation_id = c.id 
                 ORDER BY m.cree_le DESC LIMIT 1) AS dm_date
            FROM conversations_admin c
            JOIN vendeurs v ON v.id = c.vendeur_id
            ${whereSQL}
            ORDER BY c.mis_a_jour_le DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, params);

        const convs = rows.rows.map(r => ({
            id: r.id,
            vendeurId: r.vendeur_id,
            vendeurNom: r.vendeur_nom,
            boutique: r.boutique,
            avatar: r.boutique?.charAt(0) || 'V',
            sujet: r.sujet,
            statut: r.statut || 'ouvert',
            priorite: r.priorite || 'normale',
            derniereActivite: r.mis_a_jour_le,
            nonLus: parseInt(r.non_lus) || 0,
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
        }));

        res.json(convs);
    } catch (err) { 
        console.error('Erreur GET admin/vendeur conversations:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// GET /api/messagerie/admin/vendeur/conversations/:id/messages
router.get('/admin/vendeur/conversations/:id/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);

        const check = await pool.query(
            `SELECT id, vendeur_id FROM conversations_admin WHERE id = $1`,
            [convId]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }

        const vendeurInfo = await pool.query(
            `SELECT nom FROM vendeurs WHERE id = $1`,
            [check.rows[0].vendeur_id]
        );
        const vendeurNom = vendeurInfo.rows[0]?.nom || 'Vendeur';

        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_role, 
                   m.contenu_chiffre, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.cree_le, m.supprime_par_admin, m.lu,
                   CASE 
                     WHEN m.expediteur_role = 'vendeur' THEN $2
                     ELSE 'Administration'
                   END AS expediteur_nom
            FROM messages_admin m
            WHERE m.conversation_id = $1
            ORDER BY m.cree_le ASC
        `, [convId, vendeurNom]);

        await pool.query(
            `UPDATE messages_admin SET lu = true 
             WHERE conversation_id = $1 AND expediteur_role = 'vendeur' AND lu = false`,
            [convId]
        );

        const messages = msgs.rows.map(m => ({
            id: m.id,
            expediteur_role: m.expediteur_role,
            expediteur_nom: m.expediteur_nom,
            contenu: m.supprime_par_admin ? '🗑️ Message supprimé par l\'administration' : dechiffrer(m.contenu_chiffre, m.iv),
            contenu_original: m.supprime_par_admin ? dechiffrer(m.contenu_chiffre, m.iv) : undefined,
            supprime_par_admin: m.supprime_par_admin,
            piece_jointe_url: m.piece_jointe_url,
            piece_jointe_nom: m.piece_jointe_nom,
            piece_jointe_type: m.piece_jointe_type,
            cree_le: m.cree_le,
            lu: m.lu,
        }));

        res.json(messages);
    } catch (err) { 
        console.error('Erreur GET admin/vendeur messages:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/messagerie/admin/vendeur/conversations/:id/messages
router.post('/admin/vendeur/conversations/:id/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        const { contenu, piece_jointe_url, piece_jointe_nom } = req.body;

        if (!contenu?.trim() && !piece_jointe_url) {
            return res.status(400).json({ error: 'Contenu requis' });
        }

        const check = await pool.query(
            `SELECT id, statut FROM conversations_admin WHERE id = $1 AND statut != 'ferme'`,
            [convId]
        );
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Conversation non trouvée ou fermée' });
        }

        const { chiffre, iv } = chiffrer(contenu?.trim() || '📎 Pièce jointe');
        const result = await pool.query(
            `INSERT INTO messages_admin 
             (conversation_id, expediteur_role, contenu_chiffre, iv, 
              piece_jointe_url, piece_jointe_nom, lu)
             VALUES ($1, 'admin', $2, $3, $4, $5, false)
             RETURNING id, cree_le`,
            [convId, chiffre, iv, piece_jointe_url || null, piece_jointe_nom || null]
        );

        await pool.query(
            `UPDATE conversations_admin SET mis_a_jour_le = NOW() WHERE id = $1`,
            [convId]
        );

        const newMsg = {
            id: result.rows[0].id,
            expediteur_role: 'admin',
            expediteur_nom: 'Administration',
            contenu: contenu?.trim() || '📎 Pièce jointe',
            piece_jointe_url,
            piece_jointe_nom,
            cree_le: result.rows[0].cree_le,
        };

        res.json(newMsg);
    } catch (err) { 
        console.error('Erreur POST admin/vendeur message:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// PUT /api/messagerie/admin/vendeur/conversations/:id/statut
router.put('/admin/vendeur/conversations/:id/statut', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        const { statut } = req.body;

        if (!['ouvert', 'resolu', 'ferme'].includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        await pool.query(
            `UPDATE conversations_admin SET statut = $1, mis_a_jour_le = NOW() WHERE id = $2`,
            [statut, convId]
        );

        res.json({ success: true });
    } catch (err) { 
        console.error('Erreur PUT admin/vendeur statut:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// PUT /api/messagerie/admin/vendeur/conversations/:id/priorite
router.put('/admin/vendeur/conversations/:id/priorite', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        const { priorite } = req.body;

        if (!['normale', 'haute', 'urgente'].includes(priorite)) {
            return res.status(400).json({ error: 'Priorité invalide' });
        }

        await pool.query(
            `UPDATE conversations_admin SET priorite = $1, mis_a_jour_le = NOW() WHERE id = $2`,
            [priorite, convId]
        );

        res.json({ success: true });
    } catch (err) { 
        console.error('Erreur PUT admin/vendeur priorite:', err);
        res.status(500).json({ error: err.message }); 
    }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 6 : ROUTES ADMIN POUR SURVEILLANCE LITIGES
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/admin/conversations — Toutes les conversations (pour litiges)
router.get('/admin/conversations', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { statut, litige, search, limit = 50, offset = 0 } = req.query;

        let where = [];
        const params = [];

        if (statut && statut !== 'tous') { params.push(statut); where.push(`c.statut = $${params.length}`); }
        if (litige === 'true') where.push(`c.est_litige = TRUE`);
        if (search) {
            params.push(`%${search}%`);
            const p = params.length;
            where.push(`(v.nom ILIKE $${p} OR a.nom ILIKE $${p} OR a.prenom ILIKE $${p} OR c.sujet ILIKE $${p} OR c.commande_id ILIKE $${p})`);
        }

        const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
        params.push(limit, offset);

        const rows = await pool.query(`
            SELECT
                c.id, c.sujet, c.statut, c.est_litige, c.commande_id,
                c.cree_le, c.mis_a_jour_le, c.notes_admin,
                a.id AS acheteur_id,
                a.email AS acheteur_email,
                TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,'')) AS acheteur_nom,
                v.id AS vendeur_id, v.nom AS vendeur_nom, v.boutique AS vendeur_boutique, v.seller_id,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS nb_messages,
                (SELECT m.contenu_chiffre FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_chiffre,
                (SELECT m.iv             FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_iv,
                (SELECT m.cree_le        FROM messages m WHERE m.conversation_id = c.id ORDER BY m.cree_le DESC LIMIT 1) AS dm_date
            FROM conversations c
            JOIN acheteurs a ON a.id = c.acheteur_id
            JOIN vendeurs  v ON v.id = c.vendeur_id
            ${whereSQL}
            ORDER BY c.est_litige DESC, c.mis_a_jour_le DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        res.json(rows.rows.map(r => ({
            id: r.id, sujet: r.sujet, statut: r.statut,
            est_litige: r.est_litige, commande_id: r.commande_id,
            cree_le: r.cree_le, mis_a_jour_le: r.mis_a_jour_le,
            notes_admin: r.notes_admin, nb_messages: parseInt(r.nb_messages),
            acheteur: { id: r.acheteur_id, nom: r.acheteur_nom, email: r.acheteur_email },
            vendeur:  { id: r.vendeur_id,  nom: r.vendeur_nom,  boutique: r.vendeur_boutique, seller_id: r.seller_id },
            dernier_message: r.dm_chiffre ? dechiffrer(r.dm_chiffre, r.dm_iv) : null,
            dernier_message_date: r.dm_date,
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/messagerie/admin/conversations/:id/messages
router.get('/admin/conversations/:id/messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        const msgs = await pool.query(`
            SELECT m.id, m.expediteur_id, m.expediteur_role, m.contenu_chiffre, m.iv,
                   m.piece_jointe_url, m.piece_jointe_nom, m.piece_jointe_type,
                   m.est_intervention, m.cree_le,
                   CASE
                     WHEN m.expediteur_role = 'acheteur' THEN (
                         SELECT TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                         FROM acheteurs a WHERE a.id = m.expediteur_id
                     )
                     WHEN m.expediteur_role = 'vendeur'  THEN (SELECT nom FROM vendeurs WHERE id = m.expediteur_id)
                     ELSE 'Admin e-Vend'
                   END AS expediteur_nom
            FROM messages m WHERE m.conversation_id = $1 ORDER BY m.cree_le ASC
        `, [convId]);

        res.json(msgs.rows.map(m => ({
            id: m.id, expediteur_id: m.expediteur_id,
            expediteur_role: m.expediteur_role, expediteur_nom: m.expediteur_nom,
            contenu: dechiffrer(m.contenu_chiffre, m.iv),
            piece_jointe_url: m.piece_jointe_url, piece_jointe_nom: m.piece_jointe_nom,
            piece_jointe_type: m.piece_jointe_type,
            est_intervention: m.est_intervention, cree_le: m.cree_le,
        })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/messagerie/admin/conversations/:id/intervenir
router.post('/admin/conversations/:id/intervenir', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId  = parseInt(req.params.id);
        const { contenu } = req.body;
        if (!contenu?.trim()) return res.status(400).json({ error: 'Contenu requis' });

        const adminId = req.user.id;
        const { chiffre, iv } = chiffrer(contenu.trim());
        const result = await pool.query(
            `INSERT INTO messages (conversation_id, expediteur_id, expediteur_role, contenu_chiffre, iv, est_intervention)
             VALUES ($1, $2, 'admin', $3, $4, TRUE) RETURNING id, cree_le`,
            [convId, adminId, chiffre, iv]
        );
        res.json({ id: result.rows[0].id, cree_le: result.rows[0].cree_le });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/messagerie/admin/conversations/:id/statut
router.put('/admin/conversations/:id/statut', authenticateToken, isAdmin, async (req, res) => {
    try {
        const convId  = parseInt(req.params.id);
        const { statut, est_litige, notes_admin } = req.body;

        const sets   = [];
        const params = [];

        if (statut) {
            params.push(statut); sets.push(`statut = $${params.length}`);
            if (statut === 'resolu')  { sets.push('resolu_le = NOW()'); }
            if (statut === 'archive') { sets.push('archive_le = NOW()'); }
        }
        if (est_litige !== undefined) { params.push(est_litige); sets.push(`est_litige = $${params.length}`); }
        if (notes_admin !== undefined){ params.push(notes_admin); sets.push(`notes_admin = $${params.length}`); }

        if (sets.length === 0) return res.status(400).json({ error: 'Rien à mettre à jour' });

        params.push(convId);
        await pool.query(`UPDATE conversations SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/messagerie/vendeur/conversations/:id/statut
router.put('/vendeur/conversations/:id/statut', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const convId    = parseInt(req.params.id);
        const { statut } = req.body;
        if (!['resolu', 'ferme', 'actif'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' });

        await pool.query(
            `UPDATE conversations SET statut=$1 ${statut === 'resolu' ? ', resolu_le=NOW()' : ''} WHERE id=$2 AND vendeur_id=$3`,
            [statut, convId, vendeurId]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 7 : STATS
// ════════════════════════════════════════════════════════════════

// GET /api/messagerie/stats — badge non-lus pour la navbar
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const role   = req.user.role;

        const col    = role === 'vendeur' ? 'vendeur_id' : 'acheteur_id';
        const convs  = await pool.query(
            `SELECT id FROM conversations WHERE ${col} = $1 AND statut NOT IN ('archive','ferme')`,
            [userId]
        );

        let totalNonLus = 0;
        for (const conv of convs.rows) {
            totalNonLus += await nbNonLus(conv.id, userId, role);
        }

        res.json({ non_lus: totalNonLus, conversations: convs.rows.length });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 8 : SUPPRESSION DE MESSAGES (fonctionne pour toutes les tables)
// ════════════════════════════════════════════════════════════════

// PUT /api/messagerie/admin/messages/:id/supprimer
router.put('/admin/messages/:id/supprimer', authenticateToken, isAdmin, async (req, res) => {
    try {
        const messageId = parseInt(req.params.id);
        const { raison } = req.body;

        console.log(`🔍 Tentative de suppression du message ${messageId}`);

        // Chercher dans messages_admin (vendeur ↔ admin)
        let messageCheck = await pool.query(
            `SELECT id, contenu_chiffre, iv, expediteur_role, conversation_id 
             FROM messages_admin WHERE id = $1`,
            [messageId]
        );

        let table = 'messages_admin';
        
        // Si pas trouvé, chercher dans messages_admin_acheteur (acheteur ↔ admin)
        if (messageCheck.rows.length === 0) {
            console.log(`📋 Message ${messageId} non trouvé dans messages_admin, recherche dans messages_admin_acheteur`);
            messageCheck = await pool.query(
                `SELECT id, contenu_chiffre, iv, expediteur_role, conversation_id 
                 FROM messages_admin_acheteur WHERE id = $1`,
                [messageId]
            );
            table = 'messages_admin_acheteur';
        }

        // Si pas trouvé, chercher dans messages (acheteur ↔ vendeur)
        if (messageCheck.rows.length === 0) {
            console.log(`📋 Message ${messageId} non trouvé dans messages_admin_acheteur, recherche dans messages`);
            messageCheck = await pool.query(
                `SELECT id, contenu_chiffre, iv, expediteur_role, conversation_id 
                 FROM messages WHERE id = $1`,
                [messageId]
            );
            table = 'messages';
        }

        if (messageCheck.rows.length === 0) {
            console.log(`❌ Message ${messageId} non trouvé dans aucune table`);
            return res.status(404).json({ error: 'Message non trouvé' });
        }

        const message = messageCheck.rows[0];
        console.log(`✅ Message trouvé dans ${table}, ID: ${messageId}, Rôle: ${message.expediteur_role}`);

        // Remplacer le contenu par un message de suppression
        const { chiffre, iv } = chiffrer('🗑️ Message supprimé par l\'administration');
        
        await pool.query(
            `UPDATE ${table} 
             SET contenu_chiffre = $1, iv = $2, piece_jointe_url = NULL, piece_jointe_nom = NULL
             WHERE id = $3`,
            [chiffre, iv, messageId]
        );

        // Sauvegarder l'original
        try {
            await pool.query(
                `UPDATE ${table} 
                 SET contenu_original = $1,
                     iv_original = $2,
                     supprime_par_admin = TRUE,
                     date_suppression = NOW(),
                     admin_id = $3,
                     raison_suppression = $4
                 WHERE id = $5`,
                [
                    message.contenu_chiffre,
                    message.iv,
                    req.user.id,
                    raison || 'Message supprimé par l\'administration',
                    messageId
                ]
            );
        } catch (err) {
            console.log(`⚠️ Colonnes supplémentaires non disponibles dans ${table}:`, err.message);
        }

        console.log(`✨ Message ${messageId} supprimé avec succès dans ${table}`);

        res.json({ 
            success: true, 
            message: 'Message masqué avec succès',
            messageId: messageId
        });

    } catch (err) {
        console.error('❌ Erreur suppression message:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /messagerie/vendeur/non-lus-total — counts non lus pour badges ──
router.get('/vendeur/non-lus-total', authenticateToken, async (req, res) => {
  const vendeurId = req.user.id;
  try {
    // 1. Messages entre vendeurs/acheteurs non lus
    const convRes = await pool.query(`
      SELECT COALESCE(SUM(
        (SELECT COUNT(*) FROM messages m
         WHERE m.conversation_id = c.id
           AND m.expediteur_role != 'vendeur'
           AND NOT EXISTS (
             SELECT 1 FROM messages_lus ml
             WHERE ml.message_id = m.id
               AND ml.utilisateur_id = $1
               AND ml.role = 'vendeur'
           ))
      ), 0) AS non_lus_acheteurs
      FROM conversations c
      WHERE c.vendeur_id = $1
    `, [vendeurId]);

    // 2. Messages admin non lus
    const adminRes = await pool.query(`
      SELECT COUNT(*) AS non_lus_admin
      FROM messages_admin m
      JOIN conversations_admin ca ON ca.id = m.conversation_id
      WHERE ca.vendeur_id = $1
        AND m.expediteur_role = 'admin'
        AND m.lu = false
    `, [vendeurId]);

    // 3. Notifications systeme non lues
    const notifRes = await pool.query(`
      SELECT COUNT(*) AS non_lus_notifs
      FROM notifications_systeme ns
      JOIN notification_destinataires nd ON nd.notification_id = ns.id
      WHERE nd.destinataire_id = $1
        AND nd.destinataire_type = 'vendeur'
        AND nd.lu = false
    `, [vendeurId]);

    const nonLusAcheteurs = parseInt(convRes.rows[0]?.non_lus_acheteurs) || 0;
    const nonLusAdmin     = parseInt(adminRes.rows[0]?.non_lus_admin)     || 0;
    const nonLusNotifs    = parseInt(notifRes.rows[0]?.non_lus_notifs)    || 0;

    res.json({
      acheteurs:  nonLusAcheteurs,
      admin:      nonLusAdmin,
      notifs:     nonLusNotifs,
      total:      nonLusAcheteurs + nonLusAdmin + nonLusNotifs,
    });
  } catch (err) {
    console.error('❌ GET /vendeur/non-lus-total:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// PARTIE 9 : CHAT VIDÉO WebRTC
// Logique : Admin toggle global (table parametres)
//           Vendeur toggle personnel (colonne video_active)
//           Plan vendeur doit avoir chatVideo = true dans fonctionnalites
//           Les deux (acheteur et vendeur) peuvent initier l'appel
// ════════════════════════════════════════════════════════════════

// ── Helper: vérifier si la vidéo est autorisée pour une conversation ──────────
async function verifierVideoAutorisee(convId) {
    // 1. Toggle global admin activé ?
    const cfg = await pool.query(
        `SELECT valeur FROM parametres WHERE cle = 'video_chat_active' LIMIT 1`
    );
    if (!cfg.rows.length || cfg.rows[0].valeur !== 'true') {
        return { ok: false, raison: 'Le chat vidéo est désactivé sur la plateforme' };
    }

    // 2. Récupérer la conversation + infos vendeur
    const conv = await pool.query(`
        SELECT c.vendeur_id, v.video_active,
               ab.fonctionnalites
        FROM conversations c
        JOIN vendeurs v ON v.id = c.vendeur_id
        LEFT JOIN abonnements ab ON ab.vendeur_id = v.id AND ab.statut = 'actif'
        WHERE c.id = $1
        LIMIT 1
    `, [convId]);

    if (!conv.rows.length) {
        return { ok: false, raison: 'Conversation introuvable' };
    }

    const { video_active, fonctionnalites } = conv.rows[0];

    // 3. Vendeur a activé son toggle vidéo ?
    if (!video_active) {
        return { ok: false, raison: 'Ce vendeur n\'offre pas le chat vidéo' };
    }

    // 4. Plan du vendeur inclut chatVideo ?
    let foncs = fonctionnalites;
    if (typeof foncs === 'string') {
        try { foncs = JSON.parse(foncs); } catch { foncs = {}; }
    }
    if (!foncs || !foncs.chatVideo) {
        return { ok: false, raison: 'Le plan du vendeur n\'inclut pas le chat vidéo' };
    }

    return { ok: true };
}

// GET /api/messagerie/video/disponibilite/:convId
// Appelé par acheteur ET vendeur pour savoir si le bouton 📹 est actif
router.get('/video/disponibilite/:convId', authenticateToken, async (req, res) => {
    try {
        const convId = parseInt(req.params.convId);
        const result = await verifierVideoAutorisee(convId);
        res.json({ disponible: result.ok, raison: result.raison || null });
    } catch (err) {
        console.error('❌ GET video/disponibilite:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/messagerie/video/demander
// Acheteur OU vendeur démarre un appel — crée une session en_attente
router.post('/video/demander', authenticateToken, async (req, res) => {
    try {
        const { conversation_id } = req.body;
        const userId   = req.user.id;
        const userRole = req.user.role; // 'acheteur' ou 'vendeur'

        if (!conversation_id) {
            return res.status(400).json({ error: 'conversation_id requis' });
        }

        // Vérifier autorisation
        const check = await verifierVideoAutorisee(conversation_id);
        if (!check.ok) {
            return res.status(403).json({ error: check.raison });
        }

        // Vérifier que l'utilisateur appartient à cette conversation
        const col = userRole === 'vendeur' ? 'vendeur_id' : 'acheteur_id';
        const conv = await pool.query(
            `SELECT id, acheteur_id, vendeur_id FROM conversations WHERE id = $1 AND ${col} = $2`,
            [conversation_id, userId]
        );
        if (!conv.rows.length) {
            return res.status(403).json({ error: 'Accès refusé à cette conversation' });
        }

        const { acheteur_id, vendeur_id } = conv.rows[0];

        // Expirer toute session en attente existante pour cette conv
        await pool.query(
            `UPDATE video_sessions SET statut = 'expire', mis_a_jour_le = NOW()
             WHERE conversation_id = $1 AND statut IN ('en_attente', 'accepte')`,
            [conversation_id]
        );

        // Créer la nouvelle session
        const result = await pool.query(
            `INSERT INTO video_sessions
             (conversation_id, initiateur_id, initiateur_role, acheteur_id, vendeur_id, statut)
             VALUES ($1, $2, $3, $4, $5, 'en_attente')
             RETURNING id, cree_le`,
            [conversation_id, userId, userRole, acheteur_id, vendeur_id]
        );

        console.log(`📹 Session vidéo créée: ${result.rows[0].id} par ${userRole} ${userId}`);
        res.json({ session_id: result.rows[0].id, cree_le: result.rows[0].cree_le });

    } catch (err) {
        console.error('❌ POST video/demander:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/messagerie/video/session-active/:convId
// Polling — les deux côtés vérifient s'il y a un appel en cours ou en attente
router.get('/video/session-active/:convId', authenticateToken, async (req, res) => {
    try {
        const convId = parseInt(req.params.convId);
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM video_sessions
             WHERE conversation_id = $1
               AND statut IN ('en_attente', 'accepte')
               AND cree_le > NOW() - INTERVAL '10 minutes'
             ORDER BY cree_le DESC
             LIMIT 1`,
            [convId]
        );

        if (!result.rows.length) {
            return res.json({ session: null });
        }

        const session = result.rows[0];

        // Vérifier que l'utilisateur appartient à cette session
        if (session.acheteur_id !== userId && session.vendeur_id !== userId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        res.json({ session });

    } catch (err) {
        console.error('❌ GET video/session-active:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/messagerie/video/:sessionId/repondre
// L'autre personne accepte ou refuse l'appel
router.put('/video/:sessionId/repondre', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const { action } = req.body; // 'accepte' ou 'refuse'
        const userId = req.user.id;

        if (!['accepte', 'refuse'].includes(action)) {
            return res.status(400).json({ error: 'action doit être accepte ou refuse' });
        }

        // Vérifier que l'utilisateur appartient à cette session
        const session = await pool.query(
            `SELECT * FROM video_sessions WHERE id = $1 AND statut = 'en_attente'`,
            [sessionId]
        );
        if (!session.rows.length) {
            return res.status(404).json({ error: 'Session introuvable ou déjà traitée' });
        }

        const s = session.rows[0];
        if (s.acheteur_id !== userId && s.vendeur_id !== userId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        await pool.query(
            `UPDATE video_sessions SET statut = $1, mis_a_jour_le = NOW() WHERE id = $2`,
            [action, sessionId]
        );

        console.log(`📹 Session ${sessionId} ${action} par user ${userId}`);
        res.json({ success: true, statut: action });

    } catch (err) {
        console.error('❌ PUT video/repondre:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/messagerie/video/:sessionId/signal
// Échange des signaux WebRTC (SDP offer/answer + ICE candidates) via polling
router.put('/video/:sessionId/signal', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const { role, offer, answer, ice_candidate } = req.body;
        const userId = req.user.id;

        const session = await pool.query(
            `SELECT * FROM video_sessions WHERE id = $1`,
            [sessionId]
        );
        if (!session.rows.length) {
            return res.status(404).json({ error: 'Session introuvable' });
        }

        const s = session.rows[0];
        if (s.acheteur_id !== userId && s.vendeur_id !== userId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Construire la mise à jour dynamiquement
        const sets   = ['mis_a_jour_le = NOW()'];
        const params = [];
        let idx = 1;

        if (offer) {
            params.push(offer);
            sets.push(`offer = $${idx++}`);
        }
        if (answer) {
            params.push(answer);
            sets.push(`answer = $${idx++}`);
        }
        if (ice_candidate) {
            // Ajouter le candidat ICE au tableau JSONB existant
            const col = role === 'acheteur' ? 'ice_candidates_acheteur' : 'ice_candidates_vendeur';
            params.push(JSON.stringify([ice_candidate]));
            sets.push(`${col} = ${col} || $${idx++}::jsonb`);
        }

        params.push(sessionId);
        await pool.query(
            `UPDATE video_sessions SET ${sets.join(', ')} WHERE id = $${idx}`,
            params
        );

        res.json({ success: true });

    } catch (err) {
        console.error('❌ PUT video/signal:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/messagerie/video/:sessionId/etat
// Polling — récupérer l'état complet d'une session (offer, answer, ICE candidates)
router.get('/video/:sessionId/etat', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId    = req.user.id;

        const result = await pool.query(
            `SELECT * FROM video_sessions WHERE id = $1`,
            [sessionId]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Session introuvable' });
        }

        const s = result.rows[0];
        if (s.acheteur_id !== userId && s.vendeur_id !== userId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        res.json(s);

    } catch (err) {
        console.error('❌ GET video/etat:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/messagerie/video/:sessionId/terminer
// N'importe qui peut raccrocher
router.put('/video/:sessionId/terminer', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const userId    = req.user.id;

        const session = await pool.query(
            `SELECT acheteur_id, vendeur_id FROM video_sessions WHERE id = $1`,
            [sessionId]
        );
        if (!session.rows.length) {
            return res.status(404).json({ error: 'Session introuvable' });
        }

        const s = session.rows[0];
        if (s.acheteur_id !== userId && s.vendeur_id !== userId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        await pool.query(
            `UPDATE video_sessions
             SET statut = 'termine', termine_le = NOW(), mis_a_jour_le = NOW()
             WHERE id = $1`,
            [sessionId]
        );

        console.log(`📹 Session ${sessionId} terminée par user ${userId}`);
        res.json({ success: true });

    } catch (err) {
        console.error('❌ PUT video/terminer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/messagerie/video/toggle-admin
// Admin — lire l'état du toggle global
router.get('/video/toggle-admin', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT valeur FROM parametres WHERE cle = 'video_chat_active' LIMIT 1`
        );
        const actif = result.rows.length ? result.rows[0].valeur === 'true' : false;
        res.json({ video_chat_active: actif });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/messagerie/video/toggle-admin
// Admin — activer / désactiver la vidéo sur toute la plateforme
router.put('/video/toggle-admin', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { actif } = req.body; // true ou false
        await pool.query(
            `INSERT INTO parametres (cle, valeur, description)
             VALUES ('video_chat_active', $1, 'Activer le chat vidéo sur toute la plateforme')
             ON CONFLICT (cle) DO UPDATE SET valeur = $1, updated_at = NOW()`,
            [actif ? 'true' : 'false']
        );
        console.log(`📹 Toggle vidéo global: ${actif ? 'ACTIVÉ' : 'DÉSACTIVÉ'} par admin`);
        res.json({ success: true, video_chat_active: actif });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/messagerie/video/toggle-vendeur
// Vendeur — lire son propre toggle
router.get('/video/toggle-vendeur', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const result = await pool.query(
            `SELECT video_active FROM vendeurs WHERE id = $1`,
            [vendeurId]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Vendeur introuvable' });
        res.json({ video_active: result.rows[0].video_active || false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/messagerie/video/toggle-vendeur
// Vendeur — activer / désactiver son offre de chat vidéo
router.put('/video/toggle-vendeur', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const { actif } = req.body; // true ou false

        await pool.query(
            `UPDATE vendeurs SET video_active = $1 WHERE id = $2`,
            [actif, vendeurId]
        );

        console.log(`📹 Toggle vidéo vendeur ${vendeurId}: ${actif ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
        res.json({ success: true, video_active: actif });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
