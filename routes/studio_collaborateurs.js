// routes/studio_collaborateurs.js
//
// GET    /api/studio/collaborateurs/:gestionnaireId              — liste des collaborateurs du site
// POST   /api/studio/collaborateurs/:gestionnaireId              — créer un collaborateur
// GET    /api/studio/collaborateurs/:gestionnaireId/:id          — détail d'un collaborateur
// PUT    /api/studio/collaborateurs/:gestionnaireId/:id/statut   — changer le statut
// PUT    /api/studio/collaborateurs/:gestionnaireId/:id/mot-de-passe — reset mdp
// DELETE /api/studio/collaborateurs/:gestionnaireId/:id          — supprimer
// GET    /api/studio/collaborateurs/:gestionnaireId/:id/notes    — notes internes
// POST   /api/studio/collaborateurs/:gestionnaireId/:id/notes    — ajouter une note
// DELETE /api/studio/collaborateurs/:gestionnaireId/:id/notes/:noteId — supprimer une note

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const bcrypt  = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

// ─── Helper propriétaire ──────────────────────────────────────────────────────
async function verifierProprietaire(req, res) {
  const gestionnaireIdToken = parseInt(req.user?.id, 10);
  const gestionnaireIdParam = parseInt(req.params.gestionnaireId, 10);
  if (gestionnaireIdToken !== gestionnaireIdParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return false;
  }
  return true;
}

// ─── Helper : trouver le site du gestionnaire ─────────────────────────────────
async function getSiteId(gestionnaireId) {
  const result = await pool.query(
    `SELECT id FROM sites WHERE vendeur_id = $1`, [gestionnaireId]
  );
  return result.rows[0]?.id ?? null;
}

// =============================================================================
// GET /api/studio/collaborateurs/:gestionnaireId
// Liste tous les collaborateurs du site avec stats
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    if (!siteId) return res.status(404).json({ error: 'Site introuvable.' });

    const result = await pool.query(
      `SELECT
         sv.id,
         sv.email,
         sv.nom,
         sv.nom_boutique,
         sv.telephone,
         sv.statut,
         sv.plan,
         sv.logo_url,
         sv.description,
         sv.created_at,
         sv.updated_at,
         COUNT(DISTINCT n.id) AS nb_notes
       FROM collaborateurs sv
       LEFT JOIN notes_sous_vendeur n ON n.sous_vendeur_id = sv.id
       WHERE sv.site_id = $1
       GROUP BY sv.id
       ORDER BY sv.created_at DESC`,
      [siteId]
    );

    res.json({ collaborateurs: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET /studio/collaborateurs/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/collaborateurs/:gestionnaireId
// Créer un nouveau collaborateur
// Body : { email, mot_de_passe, nom, nom_boutique, telephone }
// =============================================================================
router.post('/', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  const { email, mot_de_passe, nom, nom_boutique, telephone } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    if (!siteId) return res.status(404).json({ error: 'Site introuvable.' });

    // Vérifier doublon email sur ce site
    const doublon = await pool.query(
      `SELECT id FROM collaborateurs WHERE site_id = $1 AND email = $2`,
      [siteId, email]
    );
    if (doublon.rows.length > 0) {
      return res.status(409).json({ error: 'Un collaborateur avec cet email existe déjà sur ce site.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 12);
    const result = await pool.query(
      `INSERT INTO collaborateurs (site_id, email, mot_de_passe, nom, nom_boutique, telephone, statut)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, email, nom, nom_boutique, statut, created_at`,
      [siteId, email, hash, nom ?? '', nom_boutique ?? '', telephone ?? '']
    );

    res.status(201).json({ success: true, collaborateur: result.rows[0] });
  } catch (err) {
    console.error('POST /studio/collaborateurs/:gestionnaireId :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/collaborateurs/:gestionnaireId/:id/statut
// Changer le statut d'un collaborateur
// Body : { statut }
// =============================================================================
router.put('/:id/statut', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  const { statut } = req.body;
  const STATUTS_VALIDES = ['actif', 'suspendu', 'pending', 'rejected', 'banni', 'vacances'];
  if (!STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    const result = await pool.query(
      `UPDATE collaborateurs SET statut = $1, updated_at = NOW()
       WHERE id = $2 AND site_id = $3
       RETURNING id, statut`,
      [statut, req.params.id, siteId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    res.json({ success: true, collaborateur: result.rows[0] });
  } catch (err) {
    console.error('PUT /studio/collaborateurs/:gestionnaireId/:id/statut :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT /api/studio/collaborateurs/:gestionnaireId/:id/mot-de-passe
// Reset du mot de passe par le propriétaire du site
// Body : { nouveau_mot_de_passe }
// =============================================================================
router.put('/:id/mot-de-passe', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  const { nouveau_mot_de_passe } = req.body;
  if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 8) {
    return res.status(400).json({ error: 'Mot de passe invalide (min. 8 caractères).' });
  }

  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    const hash   = await bcrypt.hash(nouveau_mot_de_passe, 12);
    const result = await pool.query(
      `UPDATE collaborateurs SET mot_de_passe = $1, updated_at = NOW()
       WHERE id = $2 AND site_id = $3
       RETURNING id`,
      [hash, req.params.id, siteId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    res.json({ success: true, message: 'Mot de passe modifié.' });
  } catch (err) {
    console.error('PUT /studio/collaborateurs/:gestionnaireId/:id/mot-de-passe :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/collaborateurs/:gestionnaireId/:id
// Supprimer un collaborateur
// =============================================================================
router.delete('/:id', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    const result = await pool.query(
      `DELETE FROM collaborateurs WHERE id = $1 AND site_id = $2 RETURNING id`,
      [req.params.id, siteId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /studio/collaborateurs/:gestionnaireId/:id :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE bulk /api/studio/collaborateurs/:gestionnaireId/bulk
// Supprimer plusieurs collaborateurs
// Body : { ids: number[] }
// =============================================================================
router.delete('/bulk', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Liste d\'IDs requise.' });
  }
  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    await pool.query(
      `DELETE FROM collaborateurs WHERE id = ANY($1) AND site_id = $2`,
      [ids, siteId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// PUT bulk /api/studio/collaborateurs/:gestionnaireId/bulk/statut
// Changer le statut de plusieurs collaborateurs
// Body : { ids: number[], statut: string }
// =============================================================================
router.put('/bulk/statut', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  const { ids, statut } = req.body;
  if (!Array.isArray(ids) || ids.length === 0 || !statut) {
    return res.status(400).json({ error: 'Données invalides.' });
  }
  try {
    const siteId = await getSiteId(req.params.gestionnaireId);
    await pool.query(
      `UPDATE collaborateurs SET statut = $1, updated_at = NOW()
       WHERE id = ANY($2) AND site_id = $3`,
      [statut, ids, siteId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/studio/collaborateurs/:gestionnaireId/:id/notes
// Notes internes sur un collaborateur
// =============================================================================
router.get('/:id/notes', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  try {
    const result = await pool.query(
      `SELECT id, contenu, auteur, created_at
       FROM notes_collaborateur
       WHERE sous_vendeur_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows.map(n => ({
      id:      n.id,
      contenu: n.contenu,
      auteur:  n.auteur,
      date:    new Date(n.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/studio/collaborateurs/:gestionnaireId/:id/notes
// Ajouter une note interne
// Body : { contenu, auteur? }
// =============================================================================
router.post('/:id/notes', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  const { contenu, auteur } = req.body;
  if (!contenu?.trim()) return res.status(400).json({ error: 'Contenu requis.' });

  try {
    const result = await pool.query(
      `INSERT INTO notes_collaborateur (sous_vendeur_id, contenu, auteur)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, contenu.trim(), auteur || 'Propriétaire']
    );
    const n = result.rows[0];
    res.status(201).json({
      id:      n.id,
      contenu: n.contenu,
      auteur:  n.auteur,
      date:    new Date(n.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// DELETE /api/studio/collaborateurs/:gestionnaireId/:id/notes/:noteId
// Supprimer une note
// =============================================================================
router.delete('/:id/notes/:noteId', authenticateToken, async (req, res) => {
  if (!await verifierProprietaire(req, res)) return;
  try {
    await pool.query(`DELETE FROM notes_collaborateur WHERE id = $1`, [req.params.noteId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;