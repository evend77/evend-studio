// routes/faqs_collaborateur.js
//
// ── Côté gestionnaire (propriétaire marketplace) ──
// GET  /api/studio/faqs-collab/:gestionnaireId              — toutes les FAQs de tous les collaborateurs
// GET  /api/studio/faqs-collab/:gestionnaireId/config        — lire config
// PUT  /api/studio/faqs-collab/:gestionnaireId/config        — sauvegarder config
// PUT  /api/studio/faqs-collab/:gestionnaireId/:faqId/statut — changer statut
// DELETE /api/studio/faqs-collab/:gestionnaireId/:faqId      — supprimer
//
// ── Côté collaborateur ──
// GET    /api/studio/faqs-collab/:gestionnaireId/mes-faqs/:collaborateurId
// POST   /api/studio/faqs-collab/:gestionnaireId/mes-faqs/:collaborateurId
// PUT    /api/studio/faqs-collab/:gestionnaireId/mes-faqs/:collaborateurId/:faqId
// DELETE /api/studio/faqs-collab/:gestionnaireId/mes-faqs/:collaborateurId/:faqId
// GET    /api/studio/faqs-collab/:gestionnaireId/public/:collaborateurId  (sans auth)

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getSiteId(gestionnaireId) {
  const r = await pool.query(`SELECT id FROM sites WHERE gestionnaire_id = $1`, [gestionnaireId]);
  return r.rows[0]?.id ?? null;
}

function verifierProprietaire(req, res) {
  if (parseInt(req.user?.id, 10) !== parseInt(req.params.gestionnaireId, 10)) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

const CFG_DEFAUT = { actif: true, approbation_requise: false };

async function lireConfig(gestionnaireId) {
  const r = await pool.query(`SELECT config FROM sites WHERE gestionnaire_id = $1`, [gestionnaireId]);
  return { ...CFG_DEFAUT, ...(r.rows[0]?.config?.faqs_sv || {}) };
}

// =============================================================================
// GET /config
// =============================================================================
router.get('/config', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    res.json(await lireConfig(req.params.gestionnaireId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// PUT /config
// =============================================================================
router.put('/config', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { actif, approbation_requise } = req.body;
  try {
    await pool.query(
      `UPDATE sites SET config = jsonb_set(
         COALESCE(config, '{}'), '{faqs_sv}', $1::jsonb
       ), updated_at = NOW() WHERE vendeur_id = $2`,
      [JSON.stringify({ actif, approbation_requise }), req.params.gestionnaireId]
    );
    res.json({ success: true, config: { actif, approbation_requise } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// GET / — toutes les FAQs de tous les collaborateurs (gestionnaire)
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    if (!siteId) return res.json([]);

    const result = await pool.query(
      `SELECT f.id, f.question, f.reponse, f.statut, f.ordre,
              f.created_at, f.updated_at,
              sv.id AS collaborateur_id,
              sv.nom AS collaborateur_nom,
              sv.email AS collaborateur_email,
              sv.nom_boutique
         FROM faqs_collaborateur f
         JOIN sous_vendeurs sv ON sv.id = f.sous_vendeur_id
        WHERE sv.site_id = $1
        ORDER BY sv.nom ASC, f.ordre ASC, f.created_at ASC`,
      [siteId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// PUT /:faqId/statut — changer statut (gestionnaire)
// =============================================================================
router.put('/:faqId/statut', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { statut } = req.body;
  const STATUTS = ['actif', 'inactif', 'en_attente', 'refuse', 'brouillon'];
  if (!STATUTS.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });

  try {
    const result = await pool.query(
      `UPDATE faqs_collaborateur SET statut = $1, updated_at = NOW()
        WHERE id = $2 RETURNING id, statut`,
      [statut, req.params.faqId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'FAQ introuvable.' });
    res.json({ success: true, faq: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// DELETE /:faqId — supprimer (gestionnaire)
// =============================================================================
router.delete('/:faqId', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    await pool.query(`DELETE FROM faqs_collaborateur WHERE id = $1`, [req.params.faqId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// GET /public/:collaborateurId — FAQs actives publiques (sans auth)
// =============================================================================
router.get('/public/:collaborateurId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, question, reponse, ordre
         FROM faqs_collaborateur
        WHERE collaborateur_id = $1 AND statut = 'actif'
        ORDER BY ordre ASC, created_at ASC`,
      [req.params.collaborateurId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// ── CÔTÉ COLLABORATEUR ────────────────────────────────────────────────────────
// =============================================================================

// GET /mes-faqs/:collaborateurId
router.get('/mes-faqs/:collaborateurId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, question, reponse, statut, ordre, created_at, updated_at
         FROM faqs_collaborateur
        WHERE collaborateur_id = $1
        ORDER BY ordre ASC, created_at ASC`,
      [req.params.collaborateurId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /mes-faqs/:collaborateurId
router.post('/mes-faqs/:collaborateurId', authenticateToken, async (req, res) => {
  const { question, reponse, statut = 'brouillon' } = req.body;
  if (!question?.trim() || !reponse?.trim()) {
    return res.status(400).json({ error: 'Question et réponse obligatoires.' });
  }
  try {
    const cfg = await lireConfig(req.params.gestionnaireId);
    let statutFinal = statut;
    if (statut === 'actif' && cfg.approbation_requise) statutFinal = 'en_attente';

    const count = await pool.query(
      `SELECT COUNT(*) FROM faqs_collaborateur WHERE collaborateur_id = $1`,
      [req.params.collaborateurId]
    );
    const ordre = parseInt(count.rows[0].count, 10) + 1;

    const result = await pool.query(
      `INSERT INTO faqs_collaborateur (collaborateur_id, question, reponse, statut, ordre)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.collaborateurId, question.trim(), reponse.trim(), statutFinal, ordre]
    );
    res.status(201).json({
      success: true,
      faq: result.rows[0],
      en_attente: statutFinal === 'en_attente',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /mes-faqs/:collaborateurId/:faqId
router.put('/mes-faqs/:collaborateurId/:faqId', authenticateToken, async (req, res) => {
  const { question, reponse, statut, ordre } = req.body;
  try {
    const cfg = await lireConfig(req.params.gestionnaireId);
    const sets = ['updated_at = NOW()'];
    const vals = [];
    let idx = 1;

    if (question !== undefined) { sets.push(`question = $${idx++}`); vals.push(question.trim()); }
    if (reponse  !== undefined) { sets.push(`reponse = $${idx++}`);  vals.push(reponse.trim()); }
    if (ordre    !== undefined) { sets.push(`ordre = $${idx++}`);    vals.push(ordre); }
    if (statut   !== undefined) {
      let statutFinal = statut;
      if (statut === 'actif' && cfg.approbation_requise) statutFinal = 'en_attente';
      sets.push(`statut = $${idx++}`);
      vals.push(statutFinal);
    }

    vals.push(req.params.faqId, req.params.collaborateurId);
    const result = await pool.query(
      `UPDATE faqs_collaborateur SET ${sets.join(', ')}
        WHERE id = $${idx} AND sous_vendeur_id = $${idx + 1} RETURNING *`,
      vals
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'FAQ introuvable.' });
    res.json({ success: true, faq: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /mes-faqs/:collaborateurId/reordonner
router.put('/mes-faqs/:collaborateurId/reordonner', authenticateToken, async (req, res) => {
  const { ordre } = req.body;
  if (!Array.isArray(ordre)) return res.status(400).json({ error: 'Format invalide.' });
  try {
    for (const item of ordre) {
      await pool.query(
        `UPDATE faqs_collaborateur SET ordre = $1, updated_at = NOW()
          WHERE id = $2 AND sous_vendeur_id = $3`,
        [item.ordre, item.id, req.params.collaborateurId]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /mes-faqs/:collaborateurId/:faqId
router.delete('/mes-faqs/:collaborateurId/:faqId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM faqs_collaborateur WHERE id = $1 AND collaborateur_id = $2`,
      [req.params.faqId, req.params.collaborateurId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;