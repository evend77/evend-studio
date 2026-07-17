// routes/sponsors.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const { getTousLesPlansPhotos, versDictionnaire: versDictPhotos, PLAN_PHOTOS_DEFAUT } = require('../config/plansPhotos');
const { getTousLesPlansPub, versDictionnaire: versDictPub, PLAN_PUB_DEFAUT } = require('../config/plansPub');

// ── MIDDLEWARE ──────────────────────────────────────────────────
const verifierAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ════════════════════════════════════════════════════════════════
// 🔓 ROUTES PUBLIQUES
// ════════════════════════════════════════════════════════════════

// POST — Inscription d'un nouveau sponsor
router.post('/inscription', async (req, res) => {
  try {
    const { 
      nom, 
      email, 
      mot_de_passe, 
      site_web, 
      description, 
      forfait = 'basique',
      type_sponsor = 'photos'
    } = req.body;

    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    }
    if (mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    if (!['photos', 'pub', 'both'].includes(type_sponsor)) {
      return res.status(400).json({ error: 'Type de sponsor invalide' });
    }

    const existing = await pool.query('SELECT id FROM sponsors WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

    const result = await pool.query(
      `INSERT INTO sponsors 
       (nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
       RETURNING id, nom, email, site_web, description, forfait, type_sponsor, active, created_at`,
      [nom.trim(), email.toLowerCase().trim(), hashedPassword, site_web || null, description || null, forfait, type_sponsor]
    );

    const sponsor = result.rows[0];

    const token = jwt.sign(
      { id: sponsor.id, email: sponsor.email, role: 'commanditaire' },
      process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie !',
      token,
      sponsor: {
        id: sponsor.id,
        nom: sponsor.nom,
        email: sponsor.email,
        site_web: sponsor.site_web,
        description: sponsor.description,
        forfait: sponsor.forfait,
        type_sponsor: sponsor.type_sponsor,
        active: sponsor.active,
      }
    });
  } catch (error) {
    console.error('❌ Erreur inscription sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// POST — Connexion sponsor
router.post('/login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const result = await pool.query(
      `SELECT id, nom, email, mot_de_passe, site_web, description, forfait, type_sponsor, active, created_at
       FROM sponsors WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const sponsor = result.rows[0];

    const validPassword = await bcrypt.compare(mot_de_passe, sponsor.mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!sponsor.active) {
      return res.status(403).json({ error: 'Votre compte a été désactivé. Contactez le support.' });
    }

    const token = jwt.sign(
      { id: sponsor.id, email: sponsor.email, role: 'commanditaire' },
      process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie !',
      token,
      sponsor: {
        id: sponsor.id,
        nom: sponsor.nom,
        email: sponsor.email,
        site_web: sponsor.site_web,
        description: sponsor.description,
        forfait: sponsor.forfait,
        type_sponsor: sponsor.type_sponsor,
        active: sponsor.active,
      }
    });
  } catch (error) {
    console.error('❌ Erreur login sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🔐 ROUTES PROTÉGÉES
// ════════════════════════════════════════════════════════════════

// GET — Profil du sponsor connecté
router.get('/moi', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, email, site_web, description, logo, forfait, forfait_pub, type_sponsor, active, created_at, updated_at
       FROM sponsors WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    const sponsor = result.rows[0];
    const plansPhotos = versDictPhotos(await getTousLesPlansPhotos());
    const forfaitId = sponsor.forfait || PLAN_PHOTOS_DEFAUT;
    const plan = plansPhotos[forfaitId] || plansPhotos[PLAN_PHOTOS_DEFAUT];

    const compteResult = await pool.query(
      'SELECT COUNT(*) as count FROM sponsor_photos WHERE sponsor_id = $1 AND active = true',
      [req.user.id]
    );

    const plansPub = versDictPub(await getTousLesPlansPub());
    const forfaitPubId = sponsor.forfait_pub || PLAN_PUB_DEFAUT;
    const planPub = plansPub[forfaitPubId] || plansPub[PLAN_PUB_DEFAUT];
    const comptePubsResult = await pool.query(
      `SELECT COUNT(*) as count FROM sponsor_pubs WHERE sponsor_id = $1 AND statut = 'active'`,
      [req.user.id]
    );

    res.json({
      ...sponsor,
      photos_utilisees: parseInt(compteResult.rows[0].count),
      photos_limite: plan.maxPhotos, // null = illimité
      photos_plan_label: plan.label,
      photos_plan_prix: plan.prix,
      pubs_utilisees: parseInt(comptePubsResult.rows[0].count),
      pubs_limite: planPub.maxPubsActives, // null = illimité
      pubs_plan_label: planPub.label,
      pubs_plan_prix: planPub.prix,
    });
  } catch (error) {
    console.error('❌ Erreur profil sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// GET — Liste des paliers photos disponibles (pour affichage dans le dashboard)
router.get('/plans-photos', authenticateToken, async (req, res) => {
  const tous = await getTousLesPlansPhotos();
  res.json({ plans: tous.filter(p => p.actif).map(p => ({ id: p.key, ...p })) });
});

// GET — Liste des paliers pub disponibles (pour affichage dans le dashboard)
router.get('/plans-pub', authenticateToken, async (req, res) => {
  const tous = await getTousLesPlansPub();
  res.json({ plans: tous.filter(p => p.actif).map(p => ({ id: p.key, ...p })) });
});

// PUT — Changer de forfait pub
router.put('/forfait-pub', authenticateToken, async (req, res) => {
  try {
    const { forfait } = req.body;
    const plansPub = versDictPub(await getTousLesPlansPub());
    if (!plansPub[forfait]) {
      return res.status(400).json({ error: 'Forfait invalide' });
    }

    const nouveauPlan = plansPub[forfait];

    if (nouveauPlan.maxPubsActives !== null) {
      const compteResult = await pool.query(
        `SELECT COUNT(*) as count FROM sponsor_pubs WHERE sponsor_id = $1 AND statut = 'active'`,
        [req.user.id]
      );
      const pubsActives = parseInt(compteResult.rows[0].count);

      if (pubsActives > nouveauPlan.maxPubsActives) {
        return res.status(409).json({
          error: `Vous avez ${pubsActives} pubs actives, mais le forfait "${nouveauPlan.label}" est limité à ${nouveauPlan.maxPubsActives}. Mettez ${pubsActives - nouveauPlan.maxPubsActives} pub(s) en pause avant de rétrograder.`,
          pubs_actives: pubsActives,
          limite_demandee: nouveauPlan.maxPubsActives,
        });
      }
    }

    await pool.query(
      'UPDATE sponsors SET forfait_pub = $1, updated_at = NOW() WHERE id = $2',
      [forfait, req.user.id]
    );

    res.json({ success: true, message: `Forfait pub mis à jour : ${nouveauPlan.label}`, forfait });
  } catch (error) {
    console.error('❌ Erreur changement forfait pub:', error);
    res.status(500).json({ error: 'Erreur lors du changement de forfait pub' });
  }
});

// PUT — Changer de forfait photos
router.put('/forfait-photos', authenticateToken, async (req, res) => {
  try {
    const { forfait } = req.body;
    const plansPhotos = versDictPhotos(await getTousLesPlansPhotos());
    if (!plansPhotos[forfait]) {
      return res.status(400).json({ error: 'Forfait invalide' });
    }

    const nouveauPlan = plansPhotos[forfait];

    if (nouveauPlan.maxPhotos !== null) {
      const compteResult = await pool.query(
        'SELECT COUNT(*) as count FROM sponsor_photos WHERE sponsor_id = $1 AND active = true',
        [req.user.id]
      );
      const photosActives = parseInt(compteResult.rows[0].count);

      if (photosActives > nouveauPlan.maxPhotos) {
        return res.status(409).json({
          error: `Vous avez ${photosActives} photos actives, mais le forfait "${nouveauPlan.label}" est limité à ${nouveauPlan.maxPhotos}. Supprimez ou désactivez ${photosActives - nouveauPlan.maxPhotos} photo(s) avant de rétrograder.`,
          photos_actives: photosActives,
          limite_demandee: nouveauPlan.maxPhotos,
        });
      }
    }

    await pool.query(
      'UPDATE sponsors SET forfait = $1, updated_at = NOW() WHERE id = $2',
      [forfait, req.user.id]
    );

    res.json({ success: true, message: `Forfait mis à jour : ${nouveauPlan.label}`, forfait });
  } catch (error) {
    console.error('❌ Erreur changement forfait photos:', error);
    res.status(500).json({ error: 'Erreur lors du changement de forfait' });
  }
});

// PUT — Mettre à jour le profil du sponsor
router.put('/moi', authenticateToken, async (req, res) => {
  try {
    const { nom, site_web, description, logo } = req.body;

    const result = await pool.query(
      `UPDATE sponsors SET
        nom = COALESCE($1, nom),
        site_web = COALESCE($2, site_web),
        description = COALESCE($3, description),
        logo = COALESCE($4, logo),
        updated_at = NOW()
       WHERE id = $5
       RETURNING id, nom, email, site_web, description, logo, forfait, type_sponsor, active`,
      [nom || null, site_web || null, description || null, logo || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour',
      sponsor: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour profil sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// PUT — Changer le mot de passe
router.put('/mot-de-passe', authenticateToken, async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }
    if (nouveau_mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    const result = await pool.query(
      'SELECT mot_de_passe FROM sponsors WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    const validPassword = await bcrypt.compare(ancien_mot_de_passe, result.rows[0].mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 12);

    await pool.query(
      'UPDATE sponsors SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur changement mot de passe sponsor:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// GET — Statistiques du sponsor
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const statsResult = await pool.query(
      `SELECT 
        sp.id as photo_id,
        sp.titre,
        COALESCE(SUM(ss.vue_count), 0) as vues,
        COALESCE(SUM(ss.selection_count), 0) as selections,
        COALESCE(SUM(ss.click_count), 0) as clics
       FROM sponsor_photos sp
       LEFT JOIN sponsor_photo_stats ss ON ss.photo_id = sp.id
       WHERE sp.sponsor_id = $1
       GROUP BY sp.id, sp.titre
       ORDER BY vues DESC`,
      [req.user.id]
    );

    const totalResult = await pool.query(
      `SELECT 
        COALESCE(SUM(vue_count), 0) as total_vues,
        COALESCE(SUM(selection_count), 0) as total_selections,
        COALESCE(SUM(click_count), 0) as total_clics
       FROM sponsor_photo_stats ss
       JOIN sponsor_photos sp ON sp.id = ss.photo_id
       WHERE sp.sponsor_id = $1`,
      [req.user.id]
    );

    res.json({
      stats: statsResult.rows,
      total: totalResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur stats sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

// ════════════════════════════════════════════════════════════════
// 🔐 ROUTES ADMIN
// ════════════════════════════════════════════════════════════════

// GET — Liste de tous les sponsors (admin)
router.get('/admin/liste', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id, nom, email, site_web, description, forfait, forfait_pub, type_sponsor, active, 
        created_at, updated_at,
        (SELECT COUNT(*) FROM sponsor_photos WHERE sponsor_id = sponsors.id AND active = true) as photos_actives,
        (SELECT COUNT(*) FROM sponsor_pubs WHERE sponsor_id = sponsors.id AND statut = 'active') as pubs_actives,
        (SELECT COUNT(*) FROM sponsor_pubs WHERE sponsor_id = sponsors.id AND statut = 'rejete') as pubs_bloquees,
        (SELECT COUNT(*) FROM notes_sponsors WHERE sponsor_id = sponsors.id) as nb_notes
       FROM sponsors
       ORDER BY created_at DESC`
    );

    res.json({ sponsors: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('❌ Erreur liste sponsors:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sponsors' });
  }
});

// PUT — Modifier un sponsor (admin)
router.put('/admin/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, site_web, description, forfait, type_sponsor, active } = req.body;

    const result = await pool.query(
      `UPDATE sponsors SET
        nom = COALESCE($1, nom),
        email = COALESCE($2, email),
        site_web = COALESCE($3, site_web),
        description = COALESCE($4, description),
        forfait = COALESCE($5, forfait),
        type_sponsor = COALESCE($6, type_sponsor),
        active = COALESCE($7, active),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [nom || null, email || null, site_web || null, description || null, forfait || null, type_sponsor || null, active !== undefined ? active : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    res.json({
      success: true,
      message: 'Sponsor mis à jour',
      sponsor: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur modification sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du sponsor' });
  }
});

// DELETE — Supprimer un sponsor (admin)
router.delete('/admin/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const check = await pool.query('SELECT id FROM sponsors WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }

    await pool.query('DELETE FROM sponsor_photos WHERE sponsor_id = $1', [id]);
    await pool.query('DELETE FROM sponsors WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Sponsor et toutes ses photos supprimés'
    });
  } catch (error) {
    console.error('❌ Erreur suppression sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du sponsor' });
  }
});

// POST — Impersonation (l'admin accède au dashboard du sponsor)
router.post('/admin/:id/impersonate', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, email FROM sponsors WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }
    const sponsor = result.rows[0];
    const token = jwt.sign(
      { id: sponsor.id, email: sponsor.email, role: 'commanditaire' },
      process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025',
      { expiresIn: '2h' }
    );
    res.json({ token });
  } catch (error) {
    console.error('❌ Erreur impersonation sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'accès au dashboard du sponsor' });
  }
});

// GET — Notes internes d'un sponsor
router.get('/admin/:id/notes', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, contenu, auteur, date_creation FROM notes_sponsors WHERE sponsor_id = $1 ORDER BY date_creation DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur chargement notes sponsor:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des notes' });
  }
});

// POST — Ajouter une note interne
router.post('/admin/:id/notes', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ error: 'Le contenu de la note est requis' });
    }
    const result = await pool.query(
      `INSERT INTO notes_sponsors (sponsor_id, contenu, auteur, date_creation)
       VALUES ($1, $2, $3, NOW()) RETURNING id, contenu, auteur, date_creation`,
      [id, contenu.trim(), req.user.email || 'Admin']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur ajout note sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la note' });
  }
});

// DELETE — Supprimer une note interne
router.delete('/admin/notes/:noteId', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM notes_sponsors WHERE id = $1', [req.params.noteId]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur suppression note sponsor:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la note' });
  }
});

// PUT — Changer le mot de passe d'un sponsor (admin)
router.put('/admin/:id/mot-de-passe', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nouveau_mot_de_passe } = req.body;
    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 12);
    const result = await pool.query(
      'UPDATE sponsors SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [hashedPassword, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }
    res.json({ success: true, message: 'Mot de passe modifié' });
  } catch (error) {
    console.error('❌ Erreur changement mot de passe sponsor (admin):', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// PUT — Changer le statut (actif/suspendu) — raccourci pratique en plus de PUT /admin/:id générique
router.put('/admin/:id/statut', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body; // 'actif' | 'suspendu'
    const active = statut === 'actif';
    const result = await pool.query(
      'UPDATE sponsors SET active = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsor non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur changement statut sponsor:', error);
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

module.exports = router;