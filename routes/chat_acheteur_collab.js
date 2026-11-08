// CHEMIN : routes/chat_acheteur_collab.js
// e-Vend Studio — Messagerie collaborateur ↔ acheteurs (chiffrée, texte seulement)
// Tables : chat_collab_acheteur, chat_collab_acheteur_msg
//
// Monté dans server.js sur : /api/chat-acheteur-collab/:gestionnaireId
// Côté collaborateur (cookie httpOnly mv_token_<gestionnaireId>, compte actif) :
//   GET  /collab/acheteurs                      acheteurs qui ont déjà commandé chez lui
//   GET  /collab/conversations
//   POST /collab/conversations                  { acheteur_id, sujet, message }
//   GET  /collab/conversations/:chatId/messages
//   POST /collab/conversations/:chatId/messages { contenu }
//   PUT  /collab/conversations/:chatId/statut   { statut: 'actif' | 'ferme' }
//   GET  /collab/non-lus
// Côté acheteur (même cookie, compte acheteur de la boutique) :
//   GET  /acheteur/collaborateurs               collaborateurs actifs de la boutique
//   GET  /acheteur/conversations
//   POST /acheteur/conversations                { collaborateur_id, sujet, message }
//   GET  /acheteur/conversations/:chatId/messages
//   POST /acheteur/conversations/:chatId/messages { contenu }
//   GET  /acheteur/non-lus

const express = require('express');
const jwt = require('jsonwebtoken');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');
const addonsMV = require('../services/studio_addons');
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

// ─── Utilitaires (inline) ─────────────────────────────────────────────────────

function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
}

const ENTITES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };
function nettoyerTexte(valeur, max) {
  if (typeof valeur !== 'string') return '';
  if (valeur.length > max * 5) return null;
  let t = sanitizeHtml(valeur, { allowedTags: [], allowedAttributes: {} });
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENTITES[e]);
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  t = t.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  return t.length > max ? null : t;
}

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
  console.error('[chat_acheteur_collab]', err && err.message ? err.message : err);
  return res.status(500).json({ error: 'Erreur serveur' });
}

// ─── Authentification collaborateur ───────────────────────────────────────────

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
    req.cid = r.rows[0].id;
    next();
  } catch (err) { erreur(res, err); }
}
router.use('/collab', authCollaborateur);

// ─── Authentification acheteur ────────────────────────────────────────────────

async function authAcheteur(req, res, next) {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return res.status(400).json({ error: 'Boutique invalide' });
    const token = req.cookies && req.cookies[`mv_token_${gid}`];
    if (!token) return res.status(401).json({ error: 'Non authentifié' });
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch (e) { return res.status(401).json({ error: 'Session expirée' }); }
    if (payload.type !== 'acheteur' || Number(payload.gestionnaireId) !== gid) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const r = await pool.query(
      `SELECT id FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2`,
      [entier(payload.id), gid]
    );
    if (!r.rows.length) return res.status(403).json({ error: 'Compte introuvable' });
    req.gid = gid;
    req.aid = r.rows[0].id;
    next();
  } catch (err) { erreur(res, err); }
}
router.use('/acheteur', authAcheteur);

// ─── Requêtes ─────────────────────────────────────────────────────────────────

const SQL_CONVS = `
  SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
         a.id AS acheteur_id, a.prenom, a.nom,
         lm.contenu AS dm_contenu, lm.created_at AS dm_date, lm.supprime AS dm_supprime,
         (SELECT COUNT(*) FROM chat_collab_acheteur_msg x
           WHERE x.chat_id = c.id AND x.expediteur_role = 'acheteur' AND x.lu = false AND x.supprime = false) AS non_lus
    FROM chat_collab_acheteur c
    JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
    LEFT JOIN LATERAL (
      SELECT contenu, created_at, supprime FROM chat_collab_acheteur_msg
       WHERE chat_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1
    ) lm ON true
   WHERE c.gestionnaire_id = $1 AND c.collaborateur_id = $2 AND ($3::int IS NULL OR c.id = $3)
   ORDER BY c.updated_at DESC
   LIMIT 200`;

function formaterConv(r) {
  return {
    id: r.id, sujet: r.sujet, statut: r.statut, created_at: r.created_at, updated_at: r.updated_at,
    acheteur: { id: r.acheteur_id, prenom: r.prenom, nom: r.nom },
    dernier_message: r.dm_contenu ? apercu(r.dm_contenu, r.dm_supprime) : null,
    dernier_message_date: r.dm_date,
    non_lus: parseInt(r.non_lus, 10) || 0,
  };
}

async function conversationParId(gid, cid, chatId) {
  const r = await pool.query(SQL_CONVS, [gid, cid, chatId]);
  return r.rows[0] ? formaterConv(r.rows[0]) : null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/collab/acheteurs', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT DISTINCT a.id, a.prenom, a.nom
         FROM marketplace_commandes c JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
        WHERE c.collaborateur_id = $1 AND c.gestionnaire_id = $2
        ORDER BY a.nom, a.prenom LIMIT 200`,
      [req.cid, req.gid]
    );
    res.json(r.rows);
  } catch (err) { erreur(res, err); }
});

router.get('/collab/conversations', async (req, res) => {
  try {
    const r = await pool.query(SQL_CONVS, [req.gid, req.cid, null]);
    res.json(r.rows.map(formaterConv));
  } catch (err) { erreur(res, err); }
});

router.get('/collab/non-lus', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) AS n FROM chat_collab_acheteur_msg m JOIN chat_collab_acheteur c ON c.id = m.chat_id
        WHERE c.gestionnaire_id = $1 AND c.collaborateur_id = $2
          AND m.expediteur_role = 'acheteur' AND m.lu = false AND m.supprime = false`,
      [req.gid, req.cid]
    );
    res.json({ total: parseInt(r.rows[0].n, 10) || 0 });
  } catch (err) { erreur(res, err); }
});

router.post('/collab/conversations', async (req, res) => {
  try {
    if (!limite(`ca-new-${req.cid}`, 10, 10 * 60 * 1000)) return res.status(429).json({ error: 'Trop de conversations créées. Réessayez plus tard.' });
    const acheteurId = entier(req.body && req.body.acheteur_id);
    const sujet = nettoyerTexte(req.body && req.body.sujet, MAX_SUJET);
    const message = nettoyerTexte(req.body && req.body.message, MAX_MESSAGE);
    if (!acheteurId || !sujet || !message) {
      return res.status(400).json({ error: `Acheteur, sujet (max ${MAX_SUJET}) et message (max ${MAX_MESSAGE}) requis` });
    }
    // On n'écrit qu'à un acheteur qui a déjà commandé chez ce collaborateur.
    const a = await pool.query(
      `SELECT 1 FROM marketplace_commandes WHERE acheteur_id = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3 LIMIT 1`,
      [acheteurId, req.cid, req.gid]
    );
    if (!a.rows.length) return res.status(404).json({ error: 'Acheteur introuvable' });

    const r = await pool.query(
      `WITH c AS (
         INSERT INTO chat_collab_acheteur (gestionnaire_id, collaborateur_id, acheteur_id, sujet)
         VALUES ($1, $2, $3, $4) RETURNING id
       )
       INSERT INTO chat_collab_acheteur_msg (chat_id, expediteur_role, expediteur_id, contenu)
       SELECT id, 'collaborateur', $2, $5 FROM c RETURNING chat_id`,
      [req.gid, req.cid, acheteurId, sujet, chiffrer(message)]
    );
    res.status(201).json({ conversation: await conversationParId(req.gid, req.cid, r.rows[0].chat_id) });
  } catch (err) { erreur(res, err); }
});

router.get('/collab/conversations/:chatId/messages', async (req, res) => {
  try {
    const chatId = entier(req.params.chatId);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    const c = await pool.query(
      `SELECT id FROM chat_collab_acheteur WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3`,
      [chatId, req.gid, req.cid]
    );
    if (!c.rows.length) return res.status(404).json({ error: 'Conversation introuvable' });
    const msgs = await pool.query(
      `SELECT m.id, m.expediteur_role, m.contenu, m.supprime, m.est_intervention, m.created_at,
              CASE m.expediteur_role WHEN 'acheteur' THEN TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                                     WHEN 'gestionnaire' THEN g.nom
                                     ELSE COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) END AS expediteur_nom
         FROM chat_collab_acheteur_msg m
         JOIN chat_collab_acheteur c ON c.id = m.chat_id
         JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
         JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
         JOIN gestionnaires g ON g.id = c.gestionnaire_id
        WHERE m.chat_id = $1 ORDER BY m.created_at ASC, m.id ASC LIMIT 500`,
      [chatId]
    );
    await pool.query(
      `UPDATE chat_collab_acheteur_msg SET lu = true WHERE chat_id = $1 AND expediteur_role <> 'collaborateur' AND lu = false`,
      [chatId]
    );
    res.json(msgs.rows.map((m) => ({
      id: m.id, expediteur_role: m.expediteur_role, expediteur_nom: m.expediteur_nom,
      contenu: m.supprime ? '' : lireContenu(m.contenu), supprime: m.supprime,
      est_intervention: m.est_intervention, created_at: m.created_at,
    })));
  } catch (err) { erreur(res, err); }
});

router.post('/collab/conversations/:chatId/messages', async (req, res) => {
  try {
    if (!limite(`ca-msg-${req.cid}`, 30, 60 * 1000)) return res.status(429).json({ error: 'Trop de messages. Ralentissez un peu.' });
    const chatId = entier(req.params.chatId);
    const texte = nettoyerTexte(req.body && req.body.contenu, MAX_MESSAGE);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    if (!texte) return res.status(400).json({ error: `Message requis (max ${MAX_MESSAGE} caractères)` });
    const c = await pool.query(
      `SELECT id FROM chat_collab_acheteur WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 AND statut = 'actif'`,
      [chatId, req.gid, req.cid]
    );
    if (!c.rows.length) return res.status(403).json({ error: 'Conversation introuvable ou fermée' });
    await pool.query(
      `INSERT INTO chat_collab_acheteur_msg (chat_id, expediteur_role, expediteur_id, contenu) VALUES ($1, 'collaborateur', $2, $3)`,
      [chatId, req.cid, chiffrer(texte)]
    );
    await pool.query(`UPDATE chat_collab_acheteur SET updated_at = NOW() WHERE id = $1`, [chatId]);
    res.status(201).json({ success: true });
  } catch (err) { erreur(res, err); }
});

router.put('/collab/conversations/:chatId/statut', async (req, res) => {
  try {
    const chatId = entier(req.params.chatId);
    const statut = req.body && req.body.statut;
    if (!chatId || !['actif', 'ferme'].includes(statut)) return res.status(400).json({ error: 'Statut invalide' });
    const r = await pool.query(
      `UPDATE chat_collab_acheteur SET statut = $1, updated_at = NOW() WHERE id = $2 AND gestionnaire_id = $3 AND collaborateur_id = $4`,
      [statut, chatId, req.gid, req.cid]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Conversation introuvable' });
    res.json({ success: true });
  } catch (err) { erreur(res, err); }
});

// ═════════════════════════ CÔTÉ ACHETEUR ═════════════════════════

const SQL_CONVS_ACH = `
  SELECT c.id, c.sujet, c.statut, c.created_at, c.updated_at,
         mc.id AS collab_id, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS collab_nom,
         lm.contenu AS dm_contenu, lm.created_at AS dm_date, lm.supprime AS dm_supprime,
         (SELECT COUNT(*) FROM chat_collab_acheteur_msg x
           WHERE x.chat_id = c.id AND x.expediteur_role <> 'acheteur' AND x.lu = false AND x.supprime = false) AS non_lus
    FROM chat_collab_acheteur c
    JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
    LEFT JOIN LATERAL (
      SELECT contenu, created_at, supprime FROM chat_collab_acheteur_msg
       WHERE chat_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1
    ) lm ON true
   WHERE c.gestionnaire_id = $1 AND c.acheteur_id = $2 AND ($3::int IS NULL OR c.id = $3)
   ORDER BY c.updated_at DESC
   LIMIT 200`;

function formaterConvAch(r) {
  return {
    id: r.id, sujet: r.sujet, statut: r.statut, created_at: r.created_at, updated_at: r.updated_at,
    collaborateur: { id: r.collab_id, nom: r.collab_nom },
    dernier_message: r.dm_contenu ? apercu(r.dm_contenu, r.dm_supprime) : null,
    dernier_message_date: r.dm_date,
    non_lus: parseInt(r.non_lus, 10) || 0,
  };
}

router.get('/acheteur/collaborateurs', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, COALESCE(NULLIF(nom_boutique,''), nom_responsable) AS nom
         FROM marketplace_collaborateurs WHERE gestionnaire_id = $1 AND statut = 'actif' ORDER BY 2 LIMIT 200`,
      [req.gid]
    );
    res.json(r.rows);
  } catch (err) { erreur(res, err); }
});

router.get('/acheteur/conversations', async (req, res) => {
  try {
    const r = await pool.query(SQL_CONVS_ACH, [req.gid, req.aid, null]);
    res.json(r.rows.map(formaterConvAch));
  } catch (err) { erreur(res, err); }
});

router.get('/acheteur/non-lus', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT COUNT(*) AS n FROM chat_collab_acheteur_msg m JOIN chat_collab_acheteur c ON c.id = m.chat_id
        WHERE c.gestionnaire_id = $1 AND c.acheteur_id = $2
          AND m.expediteur_role <> 'acheteur' AND m.lu = false AND m.supprime = false`,
      [req.gid, req.aid]
    );
    res.json({ total: parseInt(r.rows[0].n, 10) || 0 });
  } catch (err) { erreur(res, err); }
});

router.post('/acheteur/conversations', async (req, res) => {
  try {
    if (!limite(`ac-new-${req.aid}`, 10, 10 * 60 * 1000)) return res.status(429).json({ error: 'Trop de conversations créées. Réessayez plus tard.' });
    const collabId = entier(req.body && req.body.collaborateur_id);
    const sujet = nettoyerTexte(req.body && req.body.sujet, MAX_SUJET);
    const message = nettoyerTexte(req.body && req.body.message, MAX_MESSAGE);
    if (!collabId || !sujet || !message) {
      return res.status(400).json({ error: `Collaborateur, sujet (max ${MAX_SUJET}) et message (max ${MAX_MESSAGE}) requis` });
    }
    const c = await pool.query(
      `SELECT 1 FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif'`,
      [collabId, req.gid]
    );
    if (!c.rows.length) return res.status(404).json({ error: 'Collaborateur introuvable' });
    const r = await pool.query(
      `WITH c AS (
         INSERT INTO chat_collab_acheteur (gestionnaire_id, collaborateur_id, acheteur_id, sujet)
         VALUES ($1, $2, $3, $4) RETURNING id
       )
       INSERT INTO chat_collab_acheteur_msg (chat_id, expediteur_role, expediteur_id, contenu)
       SELECT id, 'acheteur', $3, $5 FROM c RETURNING chat_id`,
      [req.gid, collabId, req.aid, sujet, chiffrer(message)]
    );
    const conv = await pool.query(SQL_CONVS_ACH, [req.gid, req.aid, r.rows[0].chat_id]);
    res.status(201).json({ conversation: formaterConvAch(conv.rows[0]) });
  } catch (err) { erreur(res, err); }
});

router.get('/acheteur/conversations/:chatId/messages', async (req, res) => {
  try {
    const chatId = entier(req.params.chatId);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    const c = await pool.query(
      `SELECT id FROM chat_collab_acheteur WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3`,
      [chatId, req.gid, req.aid]
    );
    if (!c.rows.length) return res.status(404).json({ error: 'Conversation introuvable' });
    const msgs = await pool.query(
      `SELECT m.id, m.expediteur_role, m.contenu, m.supprime, m.est_intervention, m.created_at,
              CASE m.expediteur_role WHEN 'acheteur' THEN TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(a.nom,''))
                                     WHEN 'gestionnaire' THEN g.nom
                                     ELSE COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) END AS expediteur_nom
         FROM chat_collab_acheteur_msg m
         JOIN chat_collab_acheteur c ON c.id = m.chat_id
         JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
         JOIN marketplace_collaborateurs mc ON mc.id = c.collaborateur_id
         JOIN gestionnaires g ON g.id = c.gestionnaire_id
        WHERE m.chat_id = $1 ORDER BY m.created_at ASC, m.id ASC LIMIT 500`,
      [chatId]
    );
    await pool.query(
      `UPDATE chat_collab_acheteur_msg SET lu = true WHERE chat_id = $1 AND expediteur_role <> 'acheteur' AND lu = false`,
      [chatId]
    );
    res.json(msgs.rows.map((m) => ({
      id: m.id, expediteur_role: m.expediteur_role, expediteur_nom: m.expediteur_nom,
      contenu: m.supprime ? '' : lireContenu(m.contenu), supprime: m.supprime,
      est_intervention: m.est_intervention, created_at: m.created_at,
    })));
  } catch (err) { erreur(res, err); }
});

router.post('/acheteur/conversations/:chatId/messages', async (req, res) => {
  try {
    if (!limite(`ac-msg-${req.aid}`, 30, 60 * 1000)) return res.status(429).json({ error: 'Trop de messages. Ralentissez un peu.' });
    const chatId = entier(req.params.chatId);
    const texte = nettoyerTexte(req.body && req.body.contenu, MAX_MESSAGE);
    if (!chatId) return res.status(400).json({ error: 'Conversation invalide' });
    if (!texte) return res.status(400).json({ error: `Message requis (max ${MAX_MESSAGE} caractères)` });
    const c = await pool.query(
      `SELECT id FROM chat_collab_acheteur WHERE id = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 AND statut = 'actif'`,
      [chatId, req.gid, req.aid]
    );
    if (!c.rows.length) return res.status(403).json({ error: 'Conversation introuvable ou fermée' });
    await pool.query(
      `INSERT INTO chat_collab_acheteur_msg (chat_id, expediteur_role, expediteur_id, contenu) VALUES ($1, 'acheteur', $2, $3)`,
      [chatId, req.aid, chiffrer(texte)]
    );
    await pool.query(`UPDATE chat_collab_acheteur SET updated_at = NOW() WHERE id = $1`, [chatId]);
    res.status(201).json({ success: true });
  } catch (err) { erreur(res, err); }
});

module.exports = router;