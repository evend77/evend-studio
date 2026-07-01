// routes/studio_badges.js
//
// ── Gestion des badges (créés par le gestionnaire) ──
// GET    /api/studio/badges/:gestionnaireId              — liste des badges
// POST   /api/studio/badges/:gestionnaireId              — créer un badge
// PUT    /api/studio/badges/:gestionnaireId/:id          — modifier un badge
// DELETE /api/studio/badges/:gestionnaireId/:id          — supprimer un badge
// PUT    /api/studio/badges/:gestionnaireId/bulk/statut  — changer statut en masse
// DELETE /api/studio/badges/:gestionnaireId/bulk         — supprimer en masse
//
// ── Attribution des badges aux collaborateurs ──
// GET    /api/studio/badges/:gestionnaireId/attribues              — badges attribués par collaborateur
// POST   /api/studio/badges/:gestionnaireId/attribuer              — attribuer badges à un collaborateur
// DELETE /api/studio/badges/:gestionnaireId/attribuer/:collaborateurId/:badgeId — retirer un badge

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Helper propriétaire ──────────────────────────────────────────────────────
function verifierProprietaire(req, res) {
  const gestionnaireIdToken = parseInt(req.user?.id, 10);
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  if (gestionnaireIdToken !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// ─── Helper : générer un ID badge unique ──────────────────────────────────────
async function genererIdBadge(gestionnaireId) {
  const result = await pool.query(
    `SELECT COUNT(*) AS total FROM badges_gestionnaire WHERE vendeur_id = $1`,
    [gestionnaireId]
  );
  const n = parseInt(result.rows[0].total, 10) + 1;
  return `BDG-${gestionnaireId}-${String(n).padStart(3, '0')}`;
}

// =============================================================================
// GET /api/studio/badges/:gestionnaireId
// Liste tous les badges du gestionnaire
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT b.*,
              COUNT(DISTINCT bsv.collaborateur_id) AS nb_attribues
         FROM badges_gestionnaire b
         LEFT JOIN badges_sous_vendeur bsv ON bsv.badge_id = b.id
        WHERE b.vendeur_id = $1
        GROUP BY b.id
        ORDER BY b.niveau ASC, b.nom ASC`,
      [req.params.gestionnaireId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /studio/badges/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/badges/:gestionnaireId
// Créer un badge
// =============================================================================
router.post('/', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { nom, description, statut, icone, couleur, niveau, critere, type_badge } = req.body;
  if (!nom?.trim()) return res.status(400).json({ error: 'Le nom du badge est requis.' });

  try {
    const id = await genererIdBadge(req.params.gestionnaireId);
    const result = await pool.query(
      `INSERT INTO badges_gestionnaire (id, vendeur_id, nom, description, statut, icone, couleur, niveau, critere, type_badge)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, req.params.gestionnaireId, nom.trim(), description || '', statut || 'actif', icone || '🏅', couleur || '#FFD700', niveau || 1, critere || '', type_badge || 'les-deux']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /studio/badges/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/badges/:gestionnaireId/bulk/statut
// Changer statut en masse
// =============================================================================
router.put('/bulk/statut', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { ids, statut } = req.body;
  if (!ids?.length || !['actif', 'inactif'].includes(statut)) {
    return res.status(400).json({ error: 'Données invalides.' });
  }
  try {
    await pool.query(
      `UPDATE badges_gestionnaire SET statut = $1 WHERE id = ANY($2) AND vendeur_id = $3`,
      [statut, ids, req.params.gestionnaireId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/badges/:gestionnaireId/bulk
// Supprimer en masse
// =============================================================================
router.delete('/bulk', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { ids } = req.body;
  if (!ids?.length) return res.status(400).json({ error: 'Liste d\'IDs requise.' });
  try {
    await pool.query(
      `DELETE FROM badges_gestionnaire WHERE id = ANY($1) AND vendeur_id = $2`,
      [ids, req.params.gestionnaireId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/badges/:gestionnaireId/:id
// Modifier un badge
// =============================================================================
router.put('/:id', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { nom, description, statut, icone, couleur, niveau, critere, type_badge } = req.body;

  try {
    const champs = [];
    const vals   = [];
    let p = 1;
    if (nom         !== undefined) { champs.push(`nom=$${p++}`);         vals.push(nom); }
    if (description !== undefined) { champs.push(`description=$${p++}`); vals.push(description); }
    if (statut      !== undefined) { champs.push(`statut=$${p++}`);      vals.push(statut); }
    if (icone       !== undefined) { champs.push(`icone=$${p++}`);       vals.push(icone); }
    if (couleur     !== undefined) { champs.push(`couleur=$${p++}`);     vals.push(couleur); }
    if (niveau      !== undefined) { champs.push(`niveau=$${p++}`);      vals.push(niveau); }
    if (critere     !== undefined) { champs.push(`critere=$${p++}`);     vals.push(critere); }
    if (type_badge  !== undefined) { champs.push(`type_badge=$${p++}`);  vals.push(type_badge); }

    if (!champs.length) return res.status(400).json({ error: 'Aucune donnée.' });

    vals.push(req.params.id, req.params.gestionnaireId);
    const result = await pool.query(
      `UPDATE badges_gestionnaire SET ${champs.join(', ')}
       WHERE id = $${p} AND vendeur_id = $${p + 1}
       RETURNING *`,
      vals
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Badge introuvable.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /studio/badges/:gestionnaireId/:id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/badges/:gestionnaireId/:id
// Supprimer un badge
// =============================================================================
router.delete('/:id', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `DELETE FROM badges_gestionnaire WHERE id = $1 AND vendeur_id = $2 RETURNING id`,
      [req.params.id, req.params.gestionnaireId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Badge introuvable.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/badges/:gestionnaireId/attribues
// Badges attribués par collaborateur
// =============================================================================
router.get('/attribues', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const site = await pool.query(`SELECT id FROM sites WHERE gestionnaire_id = $1`, [req.params.gestionnaireId]);
    if (!site.rows.length) return res.json([]);
    const siteId = site.rows[0].id;

    const result = await pool.query(
      `SELECT
         sv.id AS collaborateur_id,
         sv.nom AS collaborateur_nom,
         sv.email AS collaborateur_email,
         sv.nom_boutique AS boutique_nom,
         COALESCE(
           json_agg(
             json_build_object(
               'id',      b.id,
               'nom',     b.nom,
               'icone',   b.icone,
               'couleur', b.couleur,
               'niveau',  b.niveau,
               'statut',  b.statut
             )
           ) FILTER (WHERE b.id IS NOT NULL),
           '[]'
         ) AS badges
       FROM collaborateurs sv
       LEFT JOIN badges_sous_vendeur bsv ON bsv.collaborateur_id = sv.id
       LEFT JOIN badges_vendeur b ON b.id = bsv.badge_id
       WHERE sv.site_id = $1
       GROUP BY sv.id
       ORDER BY sv.nom ASC`,
      [siteId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /studio/badges/:gestionnaireId/attribues :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/badges/:gestionnaireId/attribuer
// Attribuer une liste de badges à un collaborateur (remplace les existants)
// Body : { collaborateur_id, badge_ids: string[] }
// =============================================================================
router.post('/attribuer', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { collaborateur_id, badge_ids } = req.body;
  if (!collaborateur_id) return res.status(400).json({ error: 'collaborateur_id requis.' });

  try {
    // Supprimer les attributions existantes
    await pool.query(
      `DELETE FROM badges_collaborateur WHERE collaborateur_id = $1`,
      [collaborateur_id]
    );

    // Insérer les nouvelles
    if (badge_ids?.length) {
      const values = badge_ids.map((bid, i) =>
        `($${i * 2 + 1}, $${i * 2 + 2})`
      ).join(', ');
      const params = badge_ids.flatMap(bid => [bid, collaborateur_id]);
      await pool.query(
        `INSERT INTO badges_collaborateur (badge_id, sous_vendeur_id) VALUES ${values}
         ON CONFLICT DO NOTHING`,
        params
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('POST /studio/badges/:gestionnaireId/attribuer :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/badges/:gestionnaireId/attribuer/:collaborateurId/:badgeId
// Retirer un badge d'un collaborateur
// =============================================================================
router.delete('/attribuer/:collaborateurId/:badgeId', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    await pool.query(
      `DELETE FROM badges_collaborateur WHERE collaborateur_id = $1 AND badge_id = $2`,
      [req.params.collaborateurId, req.params.badgeId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/badges/:gestionnaireId/attribues-acheteurs
// Badges attribués par acheteur
// =============================================================================
router.get('/attribues-acheteurs', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    const site = await pool.query(`SELECT id FROM sites WHERE gestionnaire_id = $1`, [req.params.gestionnaireId]);
    if (!site.rows.length) return res.json([]);
    const siteId = site.rows[0].id;

    const result = await pool.query(
      `SELECT
         a.id AS acheteur_id,
         a.nom AS acheteur_nom,
         a.email AS acheteur_email,
         COALESCE(
           json_agg(
             json_build_object(
               'id',      b.id,
               'nom',     b.nom,
               'icone',   b.icone,
               'couleur', b.couleur,
               'niveau',  b.niveau,
               'statut',  b.statut
             )
           ) FILTER (WHERE b.id IS NOT NULL),
           '[]'
         ) AS badges
       FROM acheteurs_studio a
       LEFT JOIN badges_acheteur ba ON ba.acheteur_id = a.id
       LEFT JOIN badges_vendeur b ON b.id = ba.badge_id
       WHERE a.site_id = $1
       GROUP BY a.id
       ORDER BY a.nom ASC`,
      [siteId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /studio/badges/:gestionnaireId/attribues-acheteurs :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/badges/:gestionnaireId/attribuer-acheteur
// Attribuer des badges à un acheteur
// Body : { acheteur_id, badge_ids }
// =============================================================================
router.post('/attribuer-acheteur', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  const { acheteur_id, badge_ids } = req.body;
  if (!acheteur_id) return res.status(400).json({ error: 'acheteur_id requis.' });

  try {
    await pool.query(`DELETE FROM badges_acheteur WHERE acheteur_id = $1`, [acheteur_id]);

    if (badge_ids?.length) {
      const values = badge_ids.map((bid, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const params = badge_ids.flatMap(bid => [bid, acheteur_id]);
      await pool.query(
        `INSERT INTO badges_acheteur (badge_id, acheteur_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        params
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('POST /studio/badges/:gestionnaireId/attribuer-acheteur :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/badges/:gestionnaireId/attribuer-acheteur/:acheteurId/:badgeId
// Retirer un badge d'un acheteur
// =============================================================================
router.delete('/attribuer-acheteur/:acheteurId/:badgeId', authenticateToken, async (req, res) => {
  if (!verifierProprietaire(req, res)) return;
  try {
    await pool.query(
      `DELETE FROM badges_acheteur WHERE acheteur_id = $1 AND badge_id = $2`,
      [req.params.acheteurId, req.params.badgeId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;