// routes/blogs_sous_vendeur.js
//
// ── Côté vendeur (propriétaire marketplace) ──
// GET    /api/studio/blogs-sv/:vendeurId                — tous les articles de tous les SV
// PUT    /api/studio/blogs-sv/:vendeurId/config         — config (actif, approbation)
// GET    /api/studio/blogs-sv/:vendeurId/config         — lire la config
// PUT    /api/studio/blogs-sv/:vendeurId/:blogId/statut — approuver/refuser/publier
// DELETE /api/studio/blogs-sv/:vendeurId/:blogId        — supprimer un article
//
// ── Côté sous-vendeur ──
// GET    /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId — ses articles
// POST   /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId — créer
// PUT    /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId/:blogId — modifier
// DELETE /api/studio/blogs-sv/:vendeurId/mes-articles/:sousVendeurId/:blogId — supprimer
// GET    /api/studio/blogs-sv/:vendeurId/public/:sousVendeurId — articles publiés (public)

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Helper : vérifier que le vendeur est propriétaire du site ─────────────
async function getSiteId(vendeurId) {
  const r = await pool.query(`SELECT id FROM sites WHERE vendeur_id = $1`, [vendeurId]);
  return r.rows[0]?.id ?? null;
}

function verifierProprietaire(req, res) {
  if (parseInt(req.user?.id, 10) !== parseInt(req.params.vendeurId, 10)) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// ─── Config blogs (stockée dans sites.config.blogs_sv) ────────────────────
const CFG_DEFAUT = { actif: true, approbation_requise: false };

async function lireConfig(vendeurId) {
  const r = await pool.query(`SELECT config FROM sites WHERE vendeur_id = $1`, [vendeurId]);
  return { ...CFG_DEFAUT, ...(r.rows[0]?.config?.blogs_sv || {}) };
}

// =============================================================================
// GET /api/studio/blogs-sv/:vendeurId/config
// =============================================================================
router.get('/config', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const cfg = await lireConfig(req.params.vendeurId);
    res.json(cfg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// PUT /api/studio/blogs-sv/:vendeurId/config
// Body : { actif, approbation_requise }
// =============================================================================
router.put('/config', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { actif, approbation_requise } = req.body;
  try {
    await pool.query(
      `UPDATE sites SET config = jsonb_set(
         COALESCE(config, '{}'),
         '{blogs_sv}',
         $1::jsonb
       ), updated_at = NOW()
       WHERE vendeur_id = $2`,
      [JSON.stringify({ actif, approbation_requise }), req.params.vendeurId]
    );
    res.json({ success: true, config: { actif, approbation_requise } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// GET /api/studio/blogs-sv/:vendeurId
// Tous les articles de tous les sous-vendeurs (côté vendeur)
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const siteId = await getSiteId(req.params.vendeurId);
    if (!siteId) return res.json([]);

    const result = await pool.query(
      `SELECT b.id, b.titre, b.statut, b.vues, b.tags,
              b.date_creation, b.date_publication, b.updated_at,
              sv.id AS sous_vendeur_id,
              sv.nom AS sous_vendeur_nom,
              sv.email AS sous_vendeur_email,
              sv.nom_boutique
         FROM blogs_sous_vendeur b
         JOIN sous_vendeurs sv ON sv.id = b.sous_vendeur_id
        WHERE sv.site_id = $1
        ORDER BY b.date_creation DESC`,
      [siteId]
    );
    res.json(result.rows.map(b => ({
      ...b,
      tags: b.tags ? b.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// PUT /api/studio/blogs-sv/:vendeurId/:blogId/statut
// Changer le statut d'un article (publie / brouillon / refuse)
// =============================================================================
router.put('/:blogId/statut', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { statut } = req.body;
  const STATUTS = ['publie', 'brouillon', 'refuse', 'en_attente'];
  if (!STATUTS.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });

  try {
    const datePublication = statut === 'publie' ? 'NOW()' : 'NULL';
    const result = await pool.query(
      `UPDATE blogs_sous_vendeur
          SET statut = $1,
              date_publication = ${datePublication},
              updated_at = NOW()
        WHERE id = $2
        RETURNING id, statut`,
      [statut, req.params.blogId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Article introuvable.' });
    res.json({ success: true, blog: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// DELETE /api/studio/blogs-sv/:vendeurId/:blogId
// Supprimer un article (par le vendeur)
// =============================================================================
router.delete('/:blogId', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    await pool.query(`DELETE FROM blogs_sous_vendeur WHERE id = $1`, [req.params.blogId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// GET /api/studio/blogs-sv/:vendeurId/public/:sousVendeurId
// Articles publiés d'un sous-vendeur (public, sans auth)
// =============================================================================
router.get('/public/:sousVendeurId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, titre, contenu, tags, vues, date_publication
         FROM blogs_sous_vendeur
        WHERE sous_vendeur_id = $1 AND statut = 'publie'
        ORDER BY date_publication DESC`,
      [req.params.sousVendeurId]
    );
    res.json(result.rows.map(b => ({
      ...b,
      tags: b.tags ? b.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// ── CÔTÉ SOUS-VENDEUR ──────────────────────────────────────────────────────
// =============================================================================

// GET /mes-articles/:sousVendeurId
router.get('/mes-articles/:sousVendeurId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, titre, contenu, statut, tags, vues, date_creation, date_publication, updated_at
         FROM blogs_sous_vendeur
        WHERE sous_vendeur_id = $1
        ORDER BY date_creation DESC`,
      [req.params.sousVendeurId]
    );
    res.json(result.rows.map(b => ({
      ...b,
      tags: b.tags ? b.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /mes-articles/:sousVendeurId
router.post('/mes-articles/:sousVendeurId', authenticateToken, async (req, res) => {
  const { titre, contenu, tags = [], statut = 'brouillon' } = req.body;
  if (!titre?.trim() || !contenu?.trim()) {
    return res.status(400).json({ error: 'Titre et contenu obligatoires.' });
  }

  try {
    const siteId = await getSiteId(req.params.vendeurId);
    const cfg    = await lireConfig(req.params.vendeurId);

    // Si approbation requise, mettre en_attente
    let statutFinal = statut;
    if (statut === 'publie' && cfg.approbation_requise) {
      statutFinal = 'en_attente';
    }

    const tagsStr        = Array.isArray(tags) ? tags.join(',') : tags;
    const datePublication = statutFinal === 'publie' ? new Date() : null;

    const result = await pool.query(
      `INSERT INTO blogs_sous_vendeur (sous_vendeur_id, titre, contenu, statut, tags, date_publication)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.sousVendeurId, titre.trim(), contenu.trim(), statutFinal, tagsStr, datePublication]
    );
    res.status(201).json({
      success: true,
      blog: { ...result.rows[0], tags: tags },
      en_attente: statutFinal === 'en_attente',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /mes-articles/:sousVendeurId/:blogId
router.put('/mes-articles/:sousVendeurId/:blogId', authenticateToken, async (req, res) => {
  const { titre, contenu, tags, statut } = req.body;
  try {
    const cfg = await lireConfig(req.params.vendeurId);
    const sets = ['updated_at = NOW()'];
    const vals = [];
    let idx = 1;

    if (titre   !== undefined) { sets.push(`titre = $${idx++}`);   vals.push(titre.trim()); }
    if (contenu !== undefined) { sets.push(`contenu = $${idx++}`); vals.push(contenu.trim()); }
    if (tags    !== undefined) { sets.push(`tags = $${idx++}`);    vals.push(Array.isArray(tags) ? tags.join(',') : tags); }
    if (statut  !== undefined) {
      let statutFinal = statut;
      if (statut === 'publie' && cfg.approbation_requise) statutFinal = 'en_attente';
      sets.push(`statut = $${idx++}`);
      vals.push(statutFinal);
      if (statutFinal === 'publie') sets.push(`date_publication = NOW()`);
      else if (statut === 'brouillon') sets.push(`date_publication = NULL`);
    }

    vals.push(req.params.blogId, req.params.sousVendeurId);
    const result = await pool.query(
      `UPDATE blogs_sous_vendeur SET ${sets.join(', ')}
        WHERE id = $${idx} AND sous_vendeur_id = $${idx + 1}
        RETURNING *`,
      vals
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Article introuvable.' });
    res.json({ success: true, blog: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /mes-articles/:sousVendeurId/:blogId
router.delete('/mes-articles/:sousVendeurId/:blogId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM blogs_sous_vendeur WHERE id = $1 AND sous_vendeur_id = $2`,
      [req.params.blogId, req.params.sousVendeurId]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;