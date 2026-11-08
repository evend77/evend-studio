// CHEMIN : routes/studio_badges.js
//
// Badges du GESTIONNAIRE (template multi-vendeur) et leur attribution aux
// collaborateurs (marketplace_collaborateurs) et aux acheteurs (marketplace_acheteurs).
// Monté sur : /api/studio/badges/:gestionnaireId
//
// ── Gestion des badges ──
// GET    /                                        — liste des badges
// POST   /                                        — créer un badge
// PUT    /bulk/statut                             — changer le statut en masse   { ids, statut }
// DELETE /bulk                                    — supprimer en masse           { ids }
// PUT    /:id                                     — modifier un badge
// DELETE /:id                                     — supprimer un badge (retiré aussi de tous ceux qui l'avaient)
//
// ── Attribution aux collaborateurs ──
// GET    /attribues                               — badges attribués, par collaborateur
// POST   /attribuer                               — { collaborateur_id, badge_ids } (remplace les existants)
// DELETE /attribuer/:collaborateurId/:badgeId     — retirer un badge
//
// ── Attribution aux acheteurs ──
// GET    /attribues-acheteurs                     — badges attribués, par acheteur
// POST   /attribuer-acheteur                      — { acheteur_id, badge_ids } (remplace les existants)
// DELETE /attribuer-acheteur/:acheteurId/:badgeId — retirer un badge

const express = require('express');
const router  = express.Router({ mergeParams: true });

// Add-on « Badges » : sans lui, la gestion et l'attribution sont fermées (les badges déjà créés restent en base).
router.use(async (req, res, next) => {
  try {
    const gid = parseInt(req.params.gestionnaireId, 10);
    if (Number.isInteger(gid) && await addonsMV.addonActifRapide(gid, 'badges', pool)) return next();
    return res.status(403).json({ error: "L'option « Badges » n'est pas activée pour cette marketplace." });
  } catch (err) { console.error('studio_badges (add-on) :', err.message); return res.status(500).json({ error: 'Erreur serveur.' }); }
});
const pool    = require('../db');
const addonsMV = require('../services/studio_addons');
const { authenticateToken } = require('../middleware/auth');

const STATUTS_BADGE = ['actif', 'inactif'];
const REGEX_ID_BADGE = /^[A-Za-z0-9_-]{1,40}$/;

// ─── Sécurité : gestionnaire connecté, et on n'agit QUE sur son propre site ───
// Renvoie l'id du gestionnaire, ou null (réponse déjà envoyée).
function verifierProprietaire(req, res) {
  const idToken = parseInt(req.user && req.user.id, 10);
  const idParam = parseInt(req.params.gestionnaireId, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(idParam) || idToken !== idParam) {
    res.status(403).json({ error: 'Accès refusé.' });
    return null;
  }
  return idParam;
}

const entier = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const idBadge = (v) => (typeof v === 'string' && REGEX_ID_BADGE.test(v) ? v : null);

// Liste d'identifiants de badges valides, sans doublon ; null si un élément est invalide.
function listeIdsBadges(v) {
  if (!Array.isArray(v)) return null;
  const ids = v.map(idBadge);
  if (ids.some(x => !x)) return null;
  return [...new Set(ids)];
}

const texte = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// ─── Numéro de badge : BDG-<gestionnaire>-<nnn>, toujours le plus grand + 1 ───
// (l'ancien « nombre de badges + 1 » réutilisait un numéro après une suppression)
async function genererIdBadge(gid) {
  const r = await pool.query(
    `SELECT COALESCE(MAX(SPLIT_PART(id, '-', 3)::int), 0) + 1 AS suivant
       FROM badges_gestionnaire
      WHERE gestionnaire_id = $1 AND id ~ ('^BDG-' || $1::text || '-[0-9]+$')`,
    [gid]
  );
  return `BDG-${gid}-${String(r.rows[0].suivant).padStart(3, '0')}`;
}

// Les badges demandés appartiennent-ils tous à CE gestionnaire ?
async function badgesDuSite(ids, gid) {
  if (ids.length === 0) return true;
  const r = await pool.query(
    'SELECT COUNT(*)::int AS n FROM badges_gestionnaire WHERE id = ANY($1::text[]) AND gestionnaire_id = $2',
    [ids, gid]
  );
  return r.rows[0].n === ids.length;
}

async function existeDuSite(table, id, gid) {
  const r = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1 AND gestionnaire_id = $2`, [id, gid]);
  return r.rowCount > 0;
}

// =============================================================================
// GET / — liste tous les badges du gestionnaire
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  try {
    const r = await pool.query(
      `SELECT b.*,
              COUNT(DISTINCT bc.collaborateur_id)::int AS nb_attribues
         FROM badges_gestionnaire b
         LEFT JOIN badges_collaborateur bc ON bc.badge_id = b.id
        WHERE b.gestionnaire_id = $1
        GROUP BY b.id
        ORDER BY b.niveau ASC, b.nom ASC`,
      [gid]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('GET /studio/badges :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// POST / — créer un badge
// =============================================================================
router.post('/', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const b = req.body || {};
  const nom = texte(b.nom, 100);
  if (!nom) return res.status(400).json({ error: 'Le nom du badge est requis.' });
  const statut = b.statut === undefined ? 'actif' : b.statut;
  if (!STATUTS_BADGE.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });

  // En cas de création simultanée, la base refuse le doublon : on recalcule et on réessaie.
  for (let essai = 0; essai < 3; essai++) {
    try {
      const id = await genererIdBadge(gid);
      const r = await pool.query(
        `INSERT INTO badges_gestionnaire (id, gestionnaire_id, nom, description, statut, icone, couleur, niveau, critere, type_badge)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [id, gid, nom, texte(b.description, 2000), statut, texte(b.icone, 20) || '🏅',
         texte(b.couleur, 30) || '#FFD700', entier(b.niveau) || 1, texte(b.critere, 500),
         texte(b.type_badge, 30) || 'les-deux']
      );
      return res.status(201).json(r.rows[0]);
    } catch (err) {
      if (err.code === '23505' && essai < 2) continue;
      console.error('POST /studio/badges :', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
});

// =============================================================================
// PUT /bulk/statut — changer le statut en masse   (déclaré AVANT /:id)
// =============================================================================
router.put('/bulk/statut', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const ids = listeIdsBadges(req.body && req.body.ids);
  const statut = req.body && req.body.statut;
  if (!ids || ids.length === 0 || !STATUTS_BADGE.includes(statut)) {
    return res.status(400).json({ error: 'Données invalides.' });
  }
  try {
    const r = await pool.query(
      'UPDATE badges_gestionnaire SET statut = $1 WHERE id = ANY($2::text[]) AND gestionnaire_id = $3',
      [statut, ids, gid]
    );
    res.json({ success: true, modifies: r.rowCount });
  } catch (err) {
    console.error('PUT /studio/badges/bulk/statut :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// DELETE /bulk — supprimer en masse   (déclaré AVANT /:id)
// =============================================================================
router.delete('/bulk', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const ids = listeIdsBadges(req.body && req.body.ids);
  if (!ids || ids.length === 0) return res.status(400).json({ error: "Liste d'IDs requise." });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Seuls les badges de CE gestionnaire sont concernés ; on les retire d'abord de ceux qui les portent.
    const miens = await client.query(
      'SELECT id FROM badges_gestionnaire WHERE id = ANY($1::text[]) AND gestionnaire_id = $2',
      [ids, gid]
    );
    const idsMiens = miens.rows.map(x => x.id);
    await client.query('DELETE FROM badges_collaborateur WHERE badge_id = ANY($1::text[])', [idsMiens]);
    await client.query('DELETE FROM badges_acheteur WHERE badge_id = ANY($1::text[])', [idsMiens]);
    const r = await client.query(
      'DELETE FROM badges_gestionnaire WHERE id = ANY($1::text[]) AND gestionnaire_id = $2',
      [idsMiens, gid]
    );
    await client.query('COMMIT');
    res.json({ success: true, supprimes: r.rowCount });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('DELETE /studio/badges/bulk :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

// =============================================================================
// PUT /:id — modifier un badge
// =============================================================================
router.put('/:id', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = idBadge(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identifiant invalide.' });
  const b = req.body || {};

  const champs = [];
  const vals = [];
  const ajouter = (colonne, valeur) => { vals.push(valeur); champs.push(`${colonne} = $${vals.length}`); };

  if (b.nom !== undefined) {
    const nom = texte(b.nom, 100);
    if (!nom) return res.status(400).json({ error: 'Le nom du badge est requis.' });
    ajouter('nom', nom);
  }
  if (b.description !== undefined) ajouter('description', texte(b.description, 2000));
  if (b.statut !== undefined) {
    if (!STATUTS_BADGE.includes(b.statut)) return res.status(400).json({ error: 'Statut invalide.' });
    ajouter('statut', b.statut);
  }
  if (b.icone !== undefined) ajouter('icone', texte(b.icone, 20));
  if (b.couleur !== undefined) ajouter('couleur', texte(b.couleur, 30));
  if (b.niveau !== undefined) {
    const niveau = entier(b.niveau);
    if (!niveau) return res.status(400).json({ error: 'Niveau invalide.' });
    ajouter('niveau', niveau);
  }
  if (b.critere !== undefined) ajouter('critere', texte(b.critere, 500));
  if (b.type_badge !== undefined) ajouter('type_badge', texte(b.type_badge, 30));

  if (!champs.length) return res.status(400).json({ error: 'Aucune donnée.' });

  try {
    vals.push(id, gid);
    const r = await pool.query(
      `UPDATE badges_gestionnaire SET ${champs.join(', ')}
        WHERE id = $${vals.length - 1} AND gestionnaire_id = $${vals.length}
        RETURNING *`,
      vals
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Badge introuvable.' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('PUT /studio/badges/:id :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// DELETE /:id — supprimer un badge
// =============================================================================
router.delete('/:id', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = idBadge(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identifiant invalide.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existe = await client.query(
      'SELECT 1 FROM badges_gestionnaire WHERE id = $1 AND gestionnaire_id = $2', [id, gid]
    );
    if (existe.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Badge introuvable.' });
    }
    await client.query('DELETE FROM badges_collaborateur WHERE badge_id = $1', [id]);
    await client.query('DELETE FROM badges_acheteur WHERE badge_id = $1', [id]);
    await client.query('DELETE FROM badges_gestionnaire WHERE id = $1 AND gestionnaire_id = $2', [id, gid]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('DELETE /studio/badges/:id :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  } finally {
    client.release();
  }
});

// =============================================================================
// GET /attribues — badges attribués, par collaborateur
// =============================================================================
router.get('/attribues', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  try {
    const r = await pool.query(
      `SELECT
         c.id AS collaborateur_id,
         c.nom_responsable AS collaborateur_nom,
         c.email AS collaborateur_email,
         c.nom_boutique AS boutique_nom,
         COALESCE(
           json_agg(
             json_build_object('id', b.id, 'nom', b.nom, 'icone', b.icone,
                               'couleur', b.couleur, 'niveau', b.niveau, 'statut', b.statut)
           ) FILTER (WHERE b.id IS NOT NULL),
           '[]'
         ) AS badges
       FROM marketplace_collaborateurs c
       LEFT JOIN badges_collaborateur bc ON bc.collaborateur_id = c.id
       LEFT JOIN badges_gestionnaire b ON b.id = bc.badge_id AND b.gestionnaire_id = c.gestionnaire_id
       WHERE c.gestionnaire_id = $1
       GROUP BY c.id
       ORDER BY c.nom_responsable ASC`,
      [gid]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('GET /studio/badges/attribues :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Remplace l'ensemble des badges d'un collaborateur ou d'un acheteur (en une seule transaction).
async function remplacerAttributions(table, colonne, personneId, badgeIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${table} WHERE ${colonne} = $1`, [personneId]);
    for (const badgeId of badgeIds) {
      await client.query(`INSERT INTO ${table} (badge_id, ${colonne}) VALUES ($1, $2)`, [badgeId, personneId]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// =============================================================================
// POST /attribuer — attribuer une liste de badges à un collaborateur (remplace les existants)
// Body : { collaborateur_id, badge_ids: string[] }
// =============================================================================
router.post('/attribuer', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const collabId = entier(req.body && req.body.collaborateur_id);
  const badgeIds = listeIdsBadges((req.body && req.body.badge_ids) || []);
  if (!collabId) return res.status(400).json({ error: 'collaborateur_id requis.' });
  if (!badgeIds) return res.status(400).json({ error: 'badge_ids invalide.' });
  try {
    if (!await existeDuSite('marketplace_collaborateurs', collabId, gid)) {
      return res.status(404).json({ error: 'Collaborateur introuvable.' });
    }
    if (!await badgesDuSite(badgeIds, gid)) {
      return res.status(400).json({ error: 'Un ou plusieurs badges sont introuvables.' });
    }
    await remplacerAttributions('badges_collaborateur', 'collaborateur_id', collabId, badgeIds);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /studio/badges/attribuer :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// DELETE /attribuer/:collaborateurId/:badgeId — retirer un badge d'un collaborateur
// =============================================================================
router.delete('/attribuer/:collaborateurId/:badgeId', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const collabId = entier(req.params.collaborateurId);
  const badgeId = idBadge(req.params.badgeId);
  if (!collabId || !badgeId) return res.status(400).json({ error: 'Identifiant invalide.' });
  try {
    if (!await existeDuSite('marketplace_collaborateurs', collabId, gid)) {
      return res.status(404).json({ error: 'Collaborateur introuvable.' });
    }
    await pool.query(
      'DELETE FROM badges_collaborateur WHERE collaborateur_id = $1 AND badge_id = $2',
      [collabId, badgeId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /studio/badges/attribuer :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// GET /attribues-acheteurs — badges attribués, par acheteur
// =============================================================================
router.get('/attribues-acheteurs', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  try {
    const r = await pool.query(
      `SELECT
         a.id AS acheteur_id,
         TRIM(CONCAT_WS(' ', a.prenom, a.nom)) AS acheteur_nom,
         a.email AS acheteur_email,
         COALESCE(
           json_agg(
             json_build_object('id', b.id, 'nom', b.nom, 'icone', b.icone,
                               'couleur', b.couleur, 'niveau', b.niveau, 'statut', b.statut)
           ) FILTER (WHERE b.id IS NOT NULL),
           '[]'
         ) AS badges
       FROM marketplace_acheteurs a
       LEFT JOIN badges_acheteur ba ON ba.acheteur_id = a.id
       LEFT JOIN badges_gestionnaire b ON b.id = ba.badge_id AND b.gestionnaire_id = a.gestionnaire_id
       WHERE a.gestionnaire_id = $1
       GROUP BY a.id
       ORDER BY TRIM(CONCAT_WS(' ', a.prenom, a.nom)) ASC`,
      [gid]
    );
    res.json(r.rows);
  } catch (err) {
    console.error('GET /studio/badges/attribues-acheteurs :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// POST /attribuer-acheteur — attribuer des badges à un acheteur (remplace les existants)
// Body : { acheteur_id, badge_ids }
// =============================================================================
router.post('/attribuer-acheteur', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const acheteurId = entier(req.body && req.body.acheteur_id);
  const badgeIds = listeIdsBadges((req.body && req.body.badge_ids) || []);
  if (!acheteurId) return res.status(400).json({ error: 'acheteur_id requis.' });
  if (!badgeIds) return res.status(400).json({ error: 'badge_ids invalide.' });
  try {
    if (!await existeDuSite('marketplace_acheteurs', acheteurId, gid)) {
      return res.status(404).json({ error: 'Acheteur introuvable.' });
    }
    if (!await badgesDuSite(badgeIds, gid)) {
      return res.status(400).json({ error: 'Un ou plusieurs badges sont introuvables.' });
    }
    await remplacerAttributions('badges_acheteur', 'acheteur_id', acheteurId, badgeIds);
    res.json({ success: true });
  } catch (err) {
    console.error('POST /studio/badges/attribuer-acheteur :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// DELETE /attribuer-acheteur/:acheteurId/:badgeId — retirer un badge d'un acheteur
// =============================================================================
router.delete('/attribuer-acheteur/:acheteurId/:badgeId', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const acheteurId = entier(req.params.acheteurId);
  const badgeId = idBadge(req.params.badgeId);
  if (!acheteurId || !badgeId) return res.status(400).json({ error: 'Identifiant invalide.' });
  try {
    if (!await existeDuSite('marketplace_acheteurs', acheteurId, gid)) {
      return res.status(404).json({ error: 'Acheteur introuvable.' });
    }
    await pool.query(
      'DELETE FROM badges_acheteur WHERE acheteur_id = $1 AND badge_id = $2',
      [acheteurId, badgeId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /studio/badges/attribuer-acheteur :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;