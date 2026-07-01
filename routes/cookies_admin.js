// routes/cookies_admin.js
// Gestion des cookies — conforme Loi 25 (Québec) + LPRPDE (Canada)

const express = require('express');
const router = express.Router();
const db = require('../db'); // votre pool pg existant

// ── Middleware auth admin ─────────────────────────────────────────────────
const { authenticateToken: verifierToken, isAdmin: estAdmin } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════════════════
//  ROUTES PUBLIQUES (accessibles par le frontend visiteur)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/cookies/config-publique
 * Retourne la config de la bannière pour l'affichage public
 */
router.get('/config-publique', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM cookie_config WHERE id = 1`
    );
    if (!rows.length) {
      return res.json(null); // pas encore configuré → utiliser défauts côté client
    }
    const cfg = rows[0];
    // Retourner seulement les champs nécessaires pour le widget public
    res.json({
      actif: cfg.actif,
      position: cfg.position,
      titre: cfg.titre,
      description: cfg.description,
      bouton_accepter: cfg.bouton_accepter,
      bouton_refuser: cfg.bouton_refuser,
      bouton_preferences: cfg.bouton_preferences,
      lien_politique: cfg.lien_politique,
      lien_conditions: cfg.lien_conditions,
      texte_politique: cfg.texte_politique,
      texte_conditions: cfg.texte_conditions,
      couleur_fond: cfg.couleur_fond,
      couleur_titre: cfg.couleur_titre,
      couleur_texte: cfg.couleur_texte,
      couleur_bouton_accept: cfg.couleur_bouton_accept,
      couleur_texte_bouton_accept: cfg.couleur_texte_bouton_accept,
      afficher_bouton_preferences: cfg.afficher_bouton_preferences,
      categories_actives: cfg.categories_actives,
    });
  } catch (err) {
    console.error('GET /cookies/config-publique:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/cookies/consent
 * Enregistre le consentement d'un visiteur
 */
router.post('/consent', async (req, res) => {
  try {
    const { type, preferences } = req.body;
    if (!type || !preferences) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Récupérer l'IP de l'utilisateur
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
             || req.socket?.remoteAddress
             || 'inconnue';

    const pays = req.headers['cf-ipcountry'] || null; // si Cloudflare
    const userAgent = req.headers['user-agent'] || null;

    await db.query(
      `INSERT INTO cookie_consents
        (ip_address, type_consentement, necessaire, fonctionnalite, analytique, marketing, pays, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (ip_address)
       DO UPDATE SET
         type_consentement = EXCLUDED.type_consentement,
         necessaire = EXCLUDED.necessaire,
         fonctionnalite = EXCLUDED.fonctionnalite,
         analytique = EXCLUDED.analytique,
         marketing = EXCLUDED.marketing,
         date_consentement = NOW()`,
      [
        ip,
        type,
        preferences.necessaire ?? true,
        preferences.fonctionnalite ?? false,
        preferences.analytique ?? false,
        preferences.marketing ?? false,
        pays,
        userAgent,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('POST /cookies/consent:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ROUTES ADMIN (protégées — token + rôle admin requis)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/cookies/config
 * Retourne la config complète pour l'interface admin
 */
router.get('/config', verifierToken, estAdmin, async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM cookie_config WHERE id = 1`);
    if (!rows.length) {
      return res.json(null);
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /cookies/config:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/cookies/config
 * Sauvegarde la configuration de la bannière
 */
router.put('/config', verifierToken, estAdmin, async (req, res) => {
  try {
    const {
      actif, position, titre, description,
      bouton_accepter, bouton_refuser, bouton_preferences,
      lien_politique, lien_conditions, texte_politique, texte_conditions,
      couleur_fond, couleur_titre, couleur_texte,
      couleur_bouton_accept, couleur_texte_bouton_accept,
      afficher_bouton_preferences, categories_actives, supprimer_non_essentiels,
    } = req.body;

    await db.query(
      `INSERT INTO cookie_config (
        id, actif, position, titre, description,
        bouton_accepter, bouton_refuser, bouton_preferences,
        lien_politique, lien_conditions, texte_politique, texte_conditions,
        couleur_fond, couleur_titre, couleur_texte,
        couleur_bouton_accept, couleur_texte_bouton_accept,
        afficher_bouton_preferences, categories_actives, supprimer_non_essentiels,
        updated_at
      ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
      ON CONFLICT (id) DO UPDATE SET
        actif = EXCLUDED.actif,
        position = EXCLUDED.position,
        titre = EXCLUDED.titre,
        description = EXCLUDED.description,
        bouton_accepter = EXCLUDED.bouton_accepter,
        bouton_refuser = EXCLUDED.bouton_refuser,
        bouton_preferences = EXCLUDED.bouton_preferences,
        lien_politique = EXCLUDED.lien_politique,
        lien_conditions = EXCLUDED.lien_conditions,
        texte_politique = EXCLUDED.texte_politique,
        texte_conditions = EXCLUDED.texte_conditions,
        couleur_fond = EXCLUDED.couleur_fond,
        couleur_titre = EXCLUDED.couleur_titre,
        couleur_texte = EXCLUDED.couleur_texte,
        couleur_bouton_accept = EXCLUDED.couleur_bouton_accept,
        couleur_texte_bouton_accept = EXCLUDED.couleur_texte_bouton_accept,
        afficher_bouton_preferences = EXCLUDED.afficher_bouton_preferences,
        categories_actives = EXCLUDED.categories_actives,
        supprimer_non_essentiels = EXCLUDED.supprimer_non_essentiels,
        updated_at = NOW()`,
      [
        actif, position, titre, description,
        bouton_accepter, bouton_refuser, bouton_preferences,
        lien_politique, lien_conditions, texte_politique, texte_conditions,
        couleur_fond, couleur_titre, couleur_texte,
        couleur_bouton_accept, couleur_texte_bouton_accept,
        afficher_bouton_preferences, JSON.stringify(categories_actives), supprimer_non_essentiels,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('PUT /cookies/config:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/cookies/liste
 * Liste tous les cookies déclarés
 */
router.get('/liste', async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM cookie_liste ORDER BY categorie, fournisseur, nom`);
    res.json(rows);
  } catch (err) {
    console.error('GET /cookies/liste:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /api/cookies/liste
 * Ajouter un cookie à la liste
 */
router.post('/liste', verifierToken, estAdmin, async (req, res) => {
  try {
    const { nom, fournisseur, categorie, domaine, duree, description } = req.body;
    if (!nom || !categorie) {
      return res.status(400).json({ error: 'Nom et catégorie requis' });
    }
    const { rows } = await db.query(
      `INSERT INTO cookie_liste (nom, fournisseur, categorie, domaine, duree, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nom, fournisseur || 'Système', categorie, domaine || 'e-vend.ca', duree || 'session', description || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /cookies/liste:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/cookies/liste/:id
 * Modifier un cookie
 */
router.put('/liste/:id', verifierToken, estAdmin, async (req, res) => {
  try {
    const { nom, fournisseur, categorie, domaine, duree, description } = req.body;
    const { rows } = await db.query(
      `UPDATE cookie_liste SET nom=$1, fournisseur=$2, categorie=$3, domaine=$4, duree=$5, description=$6
       WHERE id=$7 RETURNING *`,
      [nom, fournisseur, categorie, domaine, duree, description, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cookie non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /cookies/liste/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /api/cookies/liste/:id
 * Supprimer un cookie de la liste
 */
router.delete('/liste/:id', verifierToken, estAdmin, async (req, res) => {
  try {
    await db.query(`DELETE FROM cookie_liste WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /cookies/liste/:id:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/cookies/consentements
 * Statistiques des consentements (admin)
 */
router.get('/consentements', verifierToken, estAdmin, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE type_consentement = 'all') AS accepte_tout,
        COUNT(*) FILTER (WHERE type_consentement = 'required') AS requis_seulement,
        COUNT(*) FILTER (WHERE type_consentement = 'custom') AS personnalise,
        COUNT(*) FILTER (WHERE analytique = true) AS analytique_ok,
        COUNT(*) FILTER (WHERE marketing = true) AS marketing_ok
      FROM cookie_consents
    `);

    const recents = await db.query(`
      SELECT ip_address, type_consentement, necessaire, fonctionnalite, analytique, marketing, pays, date_consentement
      FROM cookie_consents
      ORDER BY date_consentement DESC
      LIMIT 100
    `);

    res.json({
      stats: stats.rows[0],
      recents: recents.rows,
    });
  } catch (err) {
    console.error('GET /cookies/consentements:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;