// CHEMIN : routes/chat_admin_collab.js
// e-Vend Studio — Messagerie gestionnaire ↔ collaborateur (chiffrée, texte seulement)
// Tables : chat_gestionnaire_collab, chat_gestionnaire_collab_msg
//
// Monté dans server.js sur : /api/chat-admin-collab/:gestionnaireId
//
// ── Côté gestionnaire (jeton gestionnaire, doit être le propriétaire de :gestionnaireId) ──
//   GET    /gestionnaire/collaborateurs
//   GET    /gestionnaire/conversations
//   POST   /gestionnaire/conversations                      { collaborateur_id, sujet, message }
//   GET    /gestionnaire/conversations/:chatId/messages
//   POST   /gestionnaire/conversations/:chatId/messages     { contenu }
//   PUT    /gestionnaire/conversations/:chatId/statut       { statut }
//   DELETE /gestionnaire/messages/:msgId
//   GET    /gestionnaire/non-lus
//
// ── Côté collaborateur (cookie httpOnly mv_token_<gestionnaireId>, compte actif) ──
//   GET    /collab/conversations
//   POST   /collab/conversations                            { sujet, message }
//   GET    /collab/conversations/:chatId/messages
//   POST   /collab/conversations/:chatId/messages           { contenu }
//   GET    /collab/non-lus

const express = require('express');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const addonsMV = require('../services/studio_addons');
const { authenticateToken } = require('../middleware/auth');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const router = express.Router({ mergeParams: true });

// Add-on « Chat collaborateurs » : sans lui la messagerie est fermée (les compteurs de non-lus répondent 0, l'historique est conservé).
router.use(async (req, res, next) => {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (gid && await addonsMV.addonActifRapide(gid, 'chat_collab', pool)) return next();
    if (req.method === 'GET' && /\/non-lus$/.test(req.path)) return res.json({ total: 0 });
    return res.status(403).json({ error: "L'option « Chat collaborateurs » n'est pas activée pour cette marketplace." });
  } catch (err) { erreur(res, err); }
});

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_MESSAGE = 2000;
const MAX_SUJET = 120;
const STATUTS = ['actif', 'resolu', 'ferme'];

// ─── Utilitaires (inline) ─────────────────────────────────────────────────────

// Entier strictement positif, sinon null.
function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
}

// 🔒 Nettoyage TEXTE SEUL : toute balise HTML est retirée (script/style avec leur contenu),
// les caractères de contrôle aussi. Le texte est stocké tel que l'utilisateur l'a tapé,
// et l'affichage (React) l'échappe de toute façon.
const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };
function nettoyerTexte(valeur, max) {
  if (typeof valeur !== 'string') return '';
  if (valeur.length > max * 5) return null; // refus brutal des charges absurdes
  let t = sanitizeHtml(valeur, { allowedTags: [], allowedAttributes: {} });
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITES[e]); // un seul passage
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  t = t.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  return t.length > max ? null : t;
}

// Limiteur en mémoire : `max` actions par fenêtre de `fenetreMs`, par clé.
const compteurs = new Map();
function limite(cle, max, fenetreMs) {
  const now = Date.now();
  const liste = (compteurs.get(cle) || []).filter((t) => now - t < fenetreMs);
  if (liste.length >= max) { compteurs.set(cle, liste); return false; }
  liste.push(now);
  compteurs.set(cle, liste);
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [cle, liste] of compteurs) {
    const restants = liste.filter((t) => now - t < 3600000);
    if (restants.length) compteurs.set(cle, restants); else compteurs.delete(cle);
  }
}, 10 * 60 * 1000).unref();

function lireContenu(c) {
  try { return dechiffrer(c) || '[Message non déchiffrable]'; }
  catch (e) { return '[Message non déchiffrable]'; }
}

function apercu(c, supprime) {
  if (supprime) return 'Message supprimé';
  const t = lireContenu(c).replace(/\s+/g, ' ');
  return t.length > 80 ? t.slice(0, 80) + '…' : t;
}

function erreur(res, err) {
  console.error('[chat_admin_collab]', err && err.message ? err.message : err);
  return res.status(500).json({ error: 'Erreur serveur' });
}

// ─── Authentification ─────────────────────────────────────────────────────────

// Gestionnaire : jeton valide + c'est bien le propriétaire de la boutique de l'URL.
function verifierGestionnaire(req, res, next) {
  const gid = entier(req.params.gestionnaireId);
  if (!gid || !req.user || req.user.role !== 'gestionnaire' || Number(req.user.id) !== gid) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  req.gid = gid;
  next();
}

// Collaborateur : cookie httpOnly de CETTE boutique + compte réellement actif en base.
async function authCollaborateur(req, res, next) {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return res.status(400).json({ error: 'Boutique invalide' });
    const token = req.cookies && req.cookies[`mv_token_${gid}`];
    if (!token) return res.status(401).json({ error: 'Non authentifié' });

    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch (e) { return res.status(401).json({ error: 'Session expirée' }); }

    if (payload.type !== 'collaborateur' || Number(payload.gestionnaireId) !== gid) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const r = await pool.query(
      `SELECT id FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif'`,
      [entier(payload.id), gid]
    );
    if (!r.rows.length) return res.status(403).json({ error: 'Compte non actif' });

    req.gid = gid;
    req.collabId = r.rows[0].id;
    next();
  } catch (err) { erreur(res, err); }
}

router.use('/gestionnaire', authenticateToken, verifierGestionnaire);
router.use('/collab', authCollaborateur);

// ─── Requêtes communes ────────────────────────────────────────────────────────

const SQL_CONVS = `
  SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
         mc.id AS collab_id, mc.nom_responsable, mc.nom_boutique,
         g.nom AS gestionnaire_nom,
         lm.contenu AS dm_contenu, lm.created_at AS dm_date, lm.supprime AS dm_supprime,
         (SELECT COUNT(*) FROM chat_gestionnaire_collab_msg x
           WHERE x.chat_id = c.id AND x.expediteur_role = $2 AND x.lu = false AND x.supprime = false) AS non_lus
    FROM chat_gestionnaire_collab c
    JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
    JOIN gestionnaires g ON g.id = c.gestionnaire_id
    LEFT JOIN LATERAL (
      SELECT contenu, created_at, supprime FROM chat_gestionnaire_collab_msg
       WHERE chat_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1
    ) lm ON true
   WHERE c.gestionnaire_id = $1 AND ($3::int IS NULL OR c.collaborateur_id = $3)
     AND ($4::int IS NULL OR c.id = $4)
   ORDER BY c.updated_at DESC
   LIMIT 200`;

function formaterConv(r) {
  return {
    id: r.id,
    sujet: r.sujet,
    statut: r.statut,
    created_at: r.created_at,
    updated_at: r.updated_at,
    collaborateur: { id: r.collab_id, nom: r.nom_responsable, nom_boutique: r.nom_boutique },
    gestionnaire_nom: r.gestionnaire_nom,
    dernier_message: r.dm_contenu ? apercu(r.dm_contenu, r.dm_supprime) : null,
    dernier_message_date: r.dm_date,
    non_lus: parseInt(r.non_lus, 10) || 0,
  };
}

const SQL_MESSAGES = `
  SELECT m.id, m.expediteur_role, m.contenu, m.supprime, m.created_at,
         CASE WHEN m.expediteur_role = 'gestionnaire'
              THEN g.nom
              ELSE COALESCE(NULLIF(mc.nom_boutique, ''), mc.nom_responsable) END AS expediteur_nom
    FROM chat_gestionnaire_collab_msg m
    JOIN chat_gestionnaire_collab c ON c.id = m.chat_id
    JOIN gestionnaires g ON g.id = c.gestionnaire_id
    JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
   WHERE m.chat_id = $1
   ORDER BY m.created_at ASC, m.id ASC
   LIMIT 500`;

function formaterMsg(m) {
  return {
    id: m.id,
    expediteur_role: m.expediteur_role,
    expediteur_nom: m.expediteur_nom,
    contenu: m.supprime ? '' : lireContenu(m.contenu),
    supprime: m.supprime,
    created_at: m.created_at,
  };
}

async function messagesDe(chatId, roleAutre) {
  const msgs = await pool.query(SQL_MESSAGES, [chatId]);
  await pool.query(
    `UPDATE chat_gestionnaire_collab_msg SET lu = true WHERE chat_id = $1 AND expediteur_role = $2 AND lu = false`,
    [chatId, roleAutre]
  );
  return msgs.rows.map(formaterMsg);
}

// Insère un message (l'appartenance à la conversation est vérifiée AVANT l'appel).
async function ajouterMessage(chatId, role, expediteurId, texte) {
  const chiffre = chiffrer(texte);
  const r = await pool.query(
    `INSERT INTO chat_gestionnaire_collab_msg (chat_id, expediteur_role, expediteur_id, contenu)
     VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [chatId, role, expediteurId, chiffre]
  );
  await pool.query(`UPDATE chat_gestionnaire_collab SET updated_at = NOW() WHERE id = $1`, [chatId]);
  return r.rows[0];
}

async function creerConversation(gid, collabId, sujet, texte, role, expediteurId) {
  // Une seule requête : la conversation et son premier message existent ensemble ou pas du tout.
  const r = await pool.query(
    `WITH c AS (
       INSERT INTO chat_gestionnaire_collab (gestionnaire_id, collaborateur_id, sujet)
       VALUES ($1, $2, $3) RETURNING id
     )
     INSERT INTO chat_gestionnaire_collab_msg (chat_id, expediteur_role, expediteur_id, contenu)
     SELECT id, $4, $5, $6 FROM c RETURNING chat_id`,
    [gid, collabId, sujet, role, expediteurId, chiffrer(texte)]
  );
  return r.rows[0].chat_id;
}

async function conversationParId(gid, chatId, collabId) {
  // L'autre partie écrit : si c'est un collaborateur qui lit, les non-lus viennent du gestionnaire.
  const r = await pool.query(SQL_CONVS, [gid, collabId ? 'gestionnaire' : 'collaborateur', collabId || null, chatId]);
  return r.rows[0] ? formaterConv(r.rows[0]) : null;
}

// ════════════════════════════════════════════════════════════════════════════
// CÔTÉ GESTIONNAIRE
// ════════════════════════════════════════════════════════════════════════════

router.get('/gestionnaire/collaborateurs', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, nom_responsable AS nom, nom_boutique
         FROM marketplace_collaborateurs
        WHERE gestionnaire_id = $1 AND statut = 'actif'
        ORDER BY nom_boutique, nom_responsable`,
      [req.gid]
    );
    res.json(r.rows);
  } catch (err) { erreur(res, err); }
});

router.get('/gestionnaire/conversations', async (req, res) => {
  try {
    const r = await pool.query(SQL_CONVS, [req.gid, 'collaborateur', null, null]);
    res.json(r.rows.map(formaterConv));
  } catch (err) { erreur(res, err); }
});

router.get('/gestionnaire/non-lus', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) AS n FROM chat_gestionnaire_collab_msg m
         JOIN chat_gestionnaire_collab c ON c.id = m.chat_id
        WHERE c.gestionnaire_id = $1 AND m.expediteur_role = 'collaborateur' AND m.lu = false AND m.supprime = false`,
      [req.gid]
    );
    res.json({ total: parseInt(r.rows[0].n, 10) || 0 });
  } catch (err) { erreur(res, err); }
});

router.post('/gestionnaire/conversations', async (req, res) => {
  try {
    if (!limite(`g-new-${req.gid}`, 20, 10 * 60 * 1000)) return res.status(429).json({ error: 'Trop de conversations créées. Réessayez plus tard.' });
    const collabId = entier(req.body && req.body.collaborateur_id);
    const sujet = nettoyerTexte(req.body && req.body.sujet, MAX_SUJET);
    const message = nettoyerTexte(req.body && req.body.message, MAX_MESSAGE);
    if (!collabId || !sujet || !message) {
      return res.status(400).json({ error: `Collaborateur, sujet (max ${MAX_SUJET}) et message (max ${MAX_MESSAGE}) requis` });
    }
    const ok = await pool.query(
      `SELECT id FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif'`,
      [collabId, req.gid]
    );
    if (!ok.rows.length) return res.status(404).json({ error: 'Collaborateur introuvable' });

    const chatId = await creerConversation(req.gid, collabId, sujet, message, 'gestionnaire', req.gid);
    res.status(201).json({ conversation: await conversationParId(req.gid, chatId, null) });
  } catch (err) { erreur(res, err); }
});

router.get('/gestionnaire/conversations/:chatId/messages', async (req, res) => {
  try {
    const chatId = entier(req.params.chatId);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    const c = await pool.query(`SELECT id FROM chat_gestionnaire_collab WHERE id = $1 AND gestionnaire_id = $2`, [chatId, req.gid]);
    if (!c.rows.length) return res.status(404).json({ error: 'Conversation introuvable' });
    res.json(await messagesDe(chatId, 'collaborateur'));
  } catch (err) { erreur(res, err); }
});

router.post('/gestionnaire/conversations/:chatId/messages', async (req, res) => {
  try {
    if (!limite(`g-msg-${req.gid}`, 30, 60 * 1000)) return res.status(429).json({ error: 'Trop de messages. Ralentissez un peu.' });
    const chatId = entier(req.params.chatId);
    const texte = nettoyerTexte(req.body && req.body.contenu, MAX_MESSAGE);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    if (!texte) return res.status(400).json({ error: `Message requis (max ${MAX_MESSAGE} caractères)` });
    const c = await pool.query(
      `SELECT id FROM chat_gestionnaire_collab WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif'`,
      [chatId, req.gid]
    );
    if (!c.rows.length) return res.status(403).json({ error: 'Conversation introuvable ou fermée' });
    await ajouterMessage(chatId, 'gestionnaire', req.gid, texte);
    res.status(201).json({ success: true });
  } catch (err) { erreur(res, err); }
});

router.put('/gestionnaire/conversations/:chatId/statut', async (req, res) => {
  try {
    const chatId = entier(req.params.chatId);
    const statut = req.body && req.body.statut;
    if (!chatId || !STATUTS.includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
    const r = await pool.query(
      `UPDATE chat_gestionnaire_collab SET statut = $1, updated_at = NOW() WHERE id = $2 AND gestionnaire_id = $3`,
      [statut, chatId, req.gid]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Conversation introuvable' });
    res.json({ success: true });
  } catch (err) { erreur(res, err); }
});

// Un gestionnaire ne supprime que SES propres messages.
router.delete('/gestionnaire/messages/:msgId', async (req, res) => {
  try {
    const msgId = entier(req.params.msgId);
    if (!msgId) return res.status(400).json({ error: 'Message invalide' });
    const r = await pool.query(
      `UPDATE chat_gestionnaire_collab_msg m SET supprime = true
         FROM chat_gestionnaire_collab c
        WHERE m.id = $1 AND c.id = m.chat_id AND c.gestionnaire_id = $2 AND m.expediteur_role = 'gestionnaire'`,
      [msgId, req.gid]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Message introuvable' });
    res.json({ success: true });
  } catch (err) { erreur(res, err); }
});

// ════════════════════════════════════════════════════════════════════════════
// CÔTÉ COLLABORATEUR
// ════════════════════════════════════════════════════════════════════════════

router.get('/collab/conversations', async (req, res) => {
  try {
    const r = await pool.query(SQL_CONVS, [req.gid, 'gestionnaire', req.collabId, null]);
    res.json(r.rows.map(formaterConv));
  } catch (err) { erreur(res, err); }
});

router.get('/collab/non-lus', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) AS n FROM chat_gestionnaire_collab_msg m
         JOIN chat_gestionnaire_collab c ON c.id = m.chat_id
        WHERE c.gestionnaire_id = $1 AND c.collaborateur_id = $2
          AND m.expediteur_role = 'gestionnaire' AND m.lu = false AND m.supprime = false`,
      [req.gid, req.collabId]
    );
    res.json({ total: parseInt(r.rows[0].n, 10) || 0 });
  } catch (err) { erreur(res, err); }
});

router.post('/collab/conversations', async (req, res) => {
  try {
    if (!limite(`c-new-${req.collabId}`, 5, 10 * 60 * 1000)) return res.status(429).json({ error: 'Trop de conversations créées. Réessayez plus tard.' });
    const sujet = nettoyerTexte(req.body && req.body.sujet, MAX_SUJET);
    const message = nettoyerTexte(req.body && req.body.message, MAX_MESSAGE);
    if (!sujet || !message) {
      return res.status(400).json({ error: `Sujet (max ${MAX_SUJET}) et message (max ${MAX_MESSAGE}) requis` });
    }
    const chatId = await creerConversation(req.gid, req.collabId, sujet, message, 'collaborateur', req.collabId);
    res.status(201).json({ conversation: await conversationParId(req.gid, chatId, req.collabId) });
  } catch (err) { erreur(res, err); }
});

router.get('/collab/conversations/:chatId/messages', async (req, res) => {
  try {
    const chatId = entier(req.params.chatId);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    const c = await pool.query(
      `SELECT id FROM chat_gestionnaire_collab WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3`,
      [chatId, req.gid, req.collabId]
    );
    if (!c.rows.length) return res.status(404).json({ error: 'Conversation introuvable' });
    res.json(await messagesDe(chatId, 'gestionnaire'));
  } catch (err) { erreur(res, err); }
});

router.post('/collab/conversations/:chatId/messages', async (req, res) => {
  try {
    if (!limite(`c-msg-${req.collabId}`, 20, 60 * 1000)) return res.status(429).json({ error: 'Trop de messages. Ralentissez un peu.' });
    const chatId = entier(req.params.chatId);
    const texte = nettoyerTexte(req.body && req.body.contenu, MAX_MESSAGE);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    if (!texte) return res.status(400).json({ error: `Message requis (max ${MAX_MESSAGE} caractères)` });
    const c = await pool.query(
      `SELECT id FROM chat_gestionnaire_collab
        WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 AND statut = 'actif'`,
      [chatId, req.gid, req.collabId]
    );
    if (!c.rows.length) return res.status(403).json({ error: 'Conversation introuvable ou fermée' });
    await ajouterMessage(chatId, 'collaborateur', req.collabId, texte);
    res.status(201).json({ success: true });
  } catch (err) { erreur(res, err); }
});

module.exports = router;