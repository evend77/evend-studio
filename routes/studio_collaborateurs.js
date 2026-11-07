// CHEMIN : routes/studio_collaborateurs.js
//
// Gestion des collaborateurs par le GESTIONNAIRE (template multi-vendeur).
// Source unique : table marketplace_collaborateurs (celle de l'inscription, de la
// connexion, du panier, des commandes et de Stripe), rattachée par gestionnaire_id.
// Monté sur : /api/studio/collaborateurs/:gestionnaireId
//
// GET    /                         — liste des collaborateurs du site
// POST   /                         — créer un collaborateur
// DELETE /bulk                     — supprimer plusieurs collaborateurs   { ids }
// PUT    /bulk/statut              — changer le statut de plusieurs        { ids, statut }
// PUT    /:id/statut               — changer le statut (approuver = 'actif') { statut }
// PUT    /:id/mot-de-passe         — réinitialiser le mot de passe         { nouveau_mot_de_passe }
// DELETE /:id                      — supprimer
// GET    /:id/notes                — notes internes
// POST   /:id/notes                — ajouter une note                      { contenu, auteur? }
// DELETE /:id/notes/:noteId        — supprimer une note
//
// Signalements de boutiques (formulaire « Signaler » de la page boutique) :
// GET    /signalements             — liste  ?statut= (ex. vu ou traite,rejete) &recherche= &page= &limit=
// GET    /signalements/count       — nombre de nouveaux (non ouverts) : { nouveaux }
// PUT    /signalements/:id         — changer le statut / ajouter une note   { statut, note_admin? }
// DELETE /signalements/:id         — supprimer

const express = require('express');
const router  = express.Router({ mergeParams: true });
const pool    = require('../db');
const bcrypt  = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');

const STATUTS_VALIDES = ['actif', 'suspendu', 'pending', 'rejected', 'banni', 'vacances'];

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

function listeIds(v) {
  if (!Array.isArray(v)) return null;
  const ids = v.map(entier).filter(Boolean);
  return ids.length > 0 && ids.length === v.length ? ids : null;
}

// Le collaborateur appartient-il bien à CE gestionnaire ?
async function collaborateurDuSite(id, gid) {
  const r = await pool.query(
    'SELECT 1 FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2',
    [id, gid]
  );
  return r.rowCount > 0;
}

// =============================================================================
// GET / — liste des collaborateurs du site, avec le nombre de notes
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.email,
         c.nom_responsable AS nom,
         c.nom_boutique,
         c.telephone,
         c.type_entreprise,
         c.statut,
         NULL::text         AS plan,
         NULL::text         AS logo_url,
         NULL::text         AS description,
         c.created_at,
         c.created_at       AS updated_at,
         COUNT(n.id)::int   AS nb_notes,
         (cv.vacances IS TRUE AND (cv.vacances_debut IS NULL OR cv.vacances_debut <= (NOW() AT TIME ZONE 'America/Toronto')::date)
           AND (cv.vacances_retour IS NULL OR cv.vacances_retour > (NOW() AT TIME ZONE 'America/Toronto')::date)) AS en_vacances,
         cv.vacances_mode,
         cv.vacances_retour::text AS vacances_retour
       FROM marketplace_collaborateurs c
       LEFT JOIN collaborateur_config cv ON cv.collaborateur_id = c.id
       LEFT JOIN notes_collaborateur n ON n.collaborateur_id = c.id
       WHERE c.gestionnaire_id = $1
       GROUP BY c.id, cv.collaborateur_id
       ORDER BY c.created_at DESC`,
      [gid]
    );
    res.json({ collaborateurs: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('GET /studio/collaborateurs :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// POST / — créer un collaborateur (statut 'pending')
// Body : { email, mot_de_passe, nom, nom_boutique, telephone, type_entreprise }
// =============================================================================
router.post('/', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const { mot_de_passe, nom, nom_boutique, telephone, type_entreprise } = req.body || {};
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';

  if (!email || !mot_de_passe) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }

  try {
    const doublon = await pool.query(
      'SELECT id FROM marketplace_collaborateurs WHERE gestionnaire_id = $1 AND email = $2',
      [gid, email]
    );
    if (doublon.rows.length > 0) {
      return res.status(409).json({ error: 'Un collaborateur avec cet email existe déjà sur ce site.' });
    }

    const hash = await bcrypt.hash(String(mot_de_passe), 12);
    const result = await pool.query(
      `INSERT INTO marketplace_collaborateurs
         (gestionnaire_id, nom_responsable, nom_boutique, email, mot_de_passe, telephone, type_entreprise, statut)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, email, nom_responsable AS nom, nom_boutique, statut, created_at`,
      [gid, nom ?? '', nom_boutique ?? '', email, hash, telephone ?? '', type_entreprise ?? '']
    );
    res.status(201).json({ success: true, collaborateur: result.rows[0] });
  } catch (err) {
    console.error('POST /studio/collaborateurs :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// DELETE /bulk — supprimer plusieurs collaborateurs   (déclaré AVANT /:id)
// =============================================================================
router.delete('/bulk', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const ids = listeIds(req.body && req.body.ids);
  if (!ids) return res.status(400).json({ error: "Liste d'IDs requise." });
  try {
    const r = await pool.query(
      'DELETE FROM marketplace_collaborateurs WHERE id = ANY($1::int[]) AND gestionnaire_id = $2',
      [ids, gid]
    );
    res.json({ success: true, supprimes: r.rowCount });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Des commandes sont rattachées à au moins un de ces collaborateurs. Suspendez-les plutôt que de les supprimer.' });
    }
    console.error('DELETE /studio/collaborateurs/bulk :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// PUT /bulk/statut — changer le statut de plusieurs collaborateurs   (AVANT /:id/statut)
// =============================================================================
router.put('/bulk/statut', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const ids = listeIds(req.body && req.body.ids);
  const statut = req.body && req.body.statut;
  if (!ids || !STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ error: 'Données invalides.' });
  }
  try {
    const r = await pool.query(
      'UPDATE marketplace_collaborateurs SET statut = $1 WHERE id = ANY($2::int[]) AND gestionnaire_id = $3',
      [statut, ids, gid]
    );
    res.json({ success: true, modifies: r.rowCount });
  } catch (err) {
    console.error('PUT /studio/collaborateurs/bulk/statut :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// PUT /:id/statut — changer le statut (approuver = 'actif')
// =============================================================================
router.put('/:id/statut', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  const statut = req.body && req.body.statut;
  if (!id || !STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }
  try {
    const r = await pool.query(
      `UPDATE marketplace_collaborateurs SET statut = $1
        WHERE id = $2 AND gestionnaire_id = $3
        RETURNING id, statut`,
      [statut, id, gid]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    res.json({ success: true, collaborateur: r.rows[0] });
  } catch (err) {
    console.error('PUT /studio/collaborateurs/:id/statut :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// PUT /:id/mot-de-passe — réinitialisation par le gestionnaire
// =============================================================================
router.put('/:id/mot-de-passe', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  const nouveau = req.body && req.body.nouveau_mot_de_passe;
  if (!id || typeof nouveau !== 'string' || nouveau.length < 8) {
    return res.status(400).json({ error: 'Mot de passe invalide (min. 8 caractères).' });
  }
  try {
    const hash = await bcrypt.hash(nouveau, 12);
    const r = await pool.query(
      'UPDATE marketplace_collaborateurs SET mot_de_passe = $1 WHERE id = $2 AND gestionnaire_id = $3 RETURNING id',
      [hash, id, gid]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    res.json({ success: true, message: 'Mot de passe modifié.' });
  } catch (err) {
    console.error('PUT /studio/collaborateurs/:id/mot-de-passe :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// DELETE /:id — supprimer un collaborateur
// =============================================================================
router.delete('/:id', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identifiant invalide.' });
  try {
    const r = await pool.query(
      'DELETE FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2 RETURNING id',
      [id, gid]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Des commandes sont rattachées à ce collaborateur. Suspendez-le plutôt que de le supprimer.' });
    }
    console.error('DELETE /studio/collaborateurs/:id :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// Notes internes
// =============================================================================
const formatDate = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });

router.get('/:id/notes', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identifiant invalide.' });
  try {
    if (!await collaborateurDuSite(id, gid)) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    const r = await pool.query(
      `SELECT id, contenu, auteur, created_at
         FROM notes_collaborateur WHERE collaborateur_id = $1 ORDER BY created_at ASC`,
      [id]
    );
    res.json(r.rows.map(n => ({ id: n.id, contenu: n.contenu, auteur: n.auteur, date: formatDate(n.created_at) })));
  } catch (err) {
    console.error('GET /studio/collaborateurs/:id/notes :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.post('/:id/notes', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  const contenu = typeof req.body?.contenu === 'string' ? req.body.contenu.trim() : '';
  if (!id) return res.status(400).json({ error: 'Identifiant invalide.' });
  if (!contenu) return res.status(400).json({ error: 'Contenu requis.' });
  const auteur = (typeof req.body?.auteur === 'string' && req.body.auteur.trim()) || 'Propriétaire';
  try {
    if (!await collaborateurDuSite(id, gid)) return res.status(404).json({ error: 'Collaborateur introuvable.' });
    const r = await pool.query(
      `INSERT INTO notes_collaborateur (collaborateur_id, contenu, auteur)
       VALUES ($1, $2, $3) RETURNING id, contenu, auteur, created_at`,
      [id, contenu, auteur.slice(0, 100)]
    );
    const n = r.rows[0];
    res.status(201).json({ id: n.id, contenu: n.contenu, auteur: n.auteur, date: formatDate(n.created_at) });
  } catch (err) {
    console.error('POST /studio/collaborateurs/:id/notes :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/:id/notes/:noteId', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  const noteId = entier(req.params.noteId);
  if (!id || !noteId) return res.status(400).json({ error: 'Identifiant invalide.' });
  try {
    // Ne supprime la note que si elle appartient à un collaborateur de CE site.
    const r = await pool.query(
      `DELETE FROM notes_collaborateur n
        USING marketplace_collaborateurs c
        WHERE n.id = $1 AND n.collaborateur_id = $2
          AND c.id = n.collaborateur_id AND c.gestionnaire_id = $3`,
      [noteId, id, gid]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Note introuvable.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /studio/collaborateurs/:id/notes/:noteId :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =============================================================================
// SIGNALEMENTS DE BOUTIQUES (collaborateurs signalés par des visiteurs)
// Statuts : nouveau (jamais ouvert) → vu → traite | rejete
// =============================================================================

const STATUTS_SIGNALEMENT = ['nouveau', 'vu', 'traite', 'rejete'];

router.get('/signalements/count', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS nouveaux FROM signalements_boutique WHERE gestionnaire_id = $1 AND statut = 'nouveau'`, [gid]);
    res.json({ nouveaux: r.rows[0].nouveaux });
  } catch (err) {
    console.error('GET /studio/collaborateurs/signalements/count :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.get('/signalements', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  try {
    const params = [gid];
    const where = ['s.gestionnaire_id = $1'];
    if (typeof req.query.statut === 'string' && req.query.statut) {
      const liste = req.query.statut.split(',').filter((x) => STATUTS_SIGNALEMENT.includes(x));
      if (liste.length) { params.push(liste); where.push(`s.statut = ANY($${params.length}::text[])`); }
    }
    const q = typeof req.query.recherche === 'string' ? req.query.recherche.trim().slice(0, 100) : '';
    if (q) {
      params.push('%' + q.replace(/[\\%_]/g, '\\$&') + '%');
      const i = params.length;
      where.push(`(s.nom ILIKE $${i} OR s.email ILIKE $${i} OR s.description ILIKE $${i} OR c.nom_boutique ILIKE $${i} OR c.nom_responsable ILIKE $${i})`);
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const W = where.join(' AND ');
    const [liste, total] = await Promise.all([
      pool.query(
        `SELECT s.id, s.collaborateur_id, COALESCE(NULLIF(c.nom_boutique,''), c.nom_responsable, 'Boutique supprimée') AS collaborateur_nom,
                s.nom AS signaleur_nom, s.email AS signaleur_email, s.raison_type, s.raison_autre, s.description,
                s.statut, s.note_admin, s.traite_par, s.date_traitement, s.created_at
           FROM signalements_boutique s LEFT JOIN marketplace_collaborateurs c ON c.id = s.collaborateur_id
          WHERE ${W} ORDER BY s.created_at DESC, s.id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`, params),
      pool.query(`SELECT COUNT(*)::int AS n FROM signalements_boutique s LEFT JOIN marketplace_collaborateurs c ON c.id = s.collaborateur_id WHERE ${W}`, params),
    ]);
    res.json({ signalements: liste.rows, total: total.rows[0].n, page, limit, totalPages: Math.max(1, Math.ceil(total.rows[0].n / limit)) });
  } catch (err) {
    console.error('GET /studio/collaborateurs/signalements :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.put('/signalements/:id', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  const statut = req.body && req.body.statut;
  if (!id || !STATUTS_SIGNALEMENT.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });
  let note = req.body.note_admin;
  if (note !== undefined && note !== null && typeof note !== 'string') return res.status(400).json({ error: 'Note invalide.' });
  note = (note || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (note.length > 2000) return res.status(400).json({ error: 'Note trop longue (max 2000 caractères).' });
  try {
    const r = await pool.query(
      `UPDATE signalements_boutique SET
              statut = $1::varchar,
              note_admin = CASE WHEN $2::text = '' THEN note_admin
                                ELSE COALESCE(note_admin || E'\n', '') || '[' || to_char(NOW(), 'YYYY-MM-DD HH24:MI') || '] ' || $2::text END,
              traite_par = CASE WHEN $1::varchar IN ('traite','rejete') THEN $3::text ELSE traite_par END,
              date_traitement = CASE WHEN $1::varchar IN ('traite','rejete') THEN NOW() ELSE date_traitement END,
              updated_at = NOW()
        WHERE id = $4 AND gestionnaire_id = $5 RETURNING id, statut, note_admin, traite_par, date_traitement`,
      [statut, note, (req.user && req.user.email) || 'gestionnaire', id, gid]);
    if (!r.rows.length) return res.status(404).json({ error: 'Signalement introuvable.' });
    res.json({ success: true, signalement: r.rows[0] });
  } catch (err) {
    console.error('PUT /studio/collaborateurs/signalements/:id :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

router.delete('/signalements/:id', authenticateToken, async (req, res) => {
  const gid = verifierProprietaire(req, res);
  if (!gid) return;
  const id = entier(req.params.id);
  if (!id) return res.status(400).json({ error: 'Signalement invalide.' });
  try {
    const r = await pool.query(`DELETE FROM signalements_boutique WHERE id = $1 AND gestionnaire_id = $2`, [id, gid]);
    if (!r.rowCount) return res.status(404).json({ error: 'Signalement introuvable.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /studio/collaborateurs/signalements/:id :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;