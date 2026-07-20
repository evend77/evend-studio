// routes/chatbot_gestionnaire.js
// e-Vend Studio — Add-on Chatbot (sans IA)
// Toutes les routes sont protégées (isGestionnaire) et scopées sur
// req.user.id — jamais un gestionnaire_id fourni par le client, pour
// qu'un gestionnaire ne puisse techniquement jamais lire ou modifier le
// chatbot d'un autre.

const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { authenticateToken: verifierToken, isGestionnaire: estGestionnaire } = require('../middleware/auth');

router.use(verifierToken, estGestionnaire);

// ═══════════════════════════════════════════════════════════════════════
//  CONFIGURATION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════

// GET /api/chatbot/config
router.get('/config', async (req, res) => {
  try {
    const gestionnaireId = req.user.id;
    let { rows } = await db.query(`SELECT * FROM chatbot_config_gestionnaire WHERE gestionnaire_id = $1`, [gestionnaireId]);
    if (rows.length === 0) {
      const created = await db.query(
        `INSERT INTO chatbot_config_gestionnaire (gestionnaire_id) VALUES ($1) RETURNING *`,
        [gestionnaireId]
      );
      rows = created.rows;
    }
    res.json({ config: rows[0] });
  } catch (err) {
    console.error('GET /chatbot/config:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// PATCH /api/chatbot/config
router.patch('/config', async (req, res) => {
  const { config } = req.body;
  if (!config) return res.status(400).json({ error: 'Configuration requise' });

  const gestionnaireId = req.user.id;
  const champsJson = ['accueil_phrases', 'transition_phrases', 'attente_phrases', 'erreur_phrases', 'fin_phrases', 'suggestions_defaut', 'pages_actives', 'sources_contenu'];
  const champsAutorises = [
    'actif', 'accueil_phrases', 'transition_phrases', 'attente_phrases',
    'erreur_phrases', 'fin_phrases', 'suggestions_defaut',
    'bouton_couleur', 'bouton_couleur_survol', 'bulle_couleur',
    'bulle_entete_couleur', 'texte_couleur', 'texte_entete_couleur', 'accroche_couleur',
    'largeur_widget', 'hauteur_widget', 'largeur_min', 'hauteur_min',
    'bouton_taille', 'bouton_icone_taille', 'position_widget',
    'marge_bas', 'marge_droite', 'marge_gauche', 'marge_haut',
    'border_radius_widget', 'border_radius_bouton', 'ombre_widget',
    'police_texte', 'taille_texte', 'logo_url', 'logo_taille', 'icone_bouton',
    'pages_actives', 'delai_reponse', 'animation_duree',
    'suggerer_questions', 'afficher_bulle_bienvenue', 'delai_bulle_bienvenue',
    'sonore_notification', 'max_historique', 'max_caracteres_question',
    'sources_contenu', 'score_minimum', 'max_resultats',
  ];

  try {
    // S'assurer qu'une ligne existe avant le UPDATE (comme GET /config)
    await db.query(
      `INSERT INTO chatbot_config_gestionnaire (gestionnaire_id) VALUES ($1) ON CONFLICT (gestionnaire_id) DO NOTHING`,
      [gestionnaireId]
    );

    const updates = [];
    const values = [];
    let i = 1;
    for (const champ of champsAutorises) {
      if (config[champ] !== undefined) {
        updates.push(`${champ} = $${i}`);
        values.push(champsJson.includes(champ) ? JSON.stringify(config[champ]) : config[champ]);
        i++;
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

    updates.push(`updated_at = NOW()`);
    values.push(gestionnaireId);
    const { rows } = await db.query(
      `UPDATE chatbot_config_gestionnaire SET ${updates.join(', ')} WHERE gestionnaire_id = $${i} RETURNING *`,
      values
    );
    res.json({ config: rows[0] });
  } catch (err) {
    console.error('PATCH /chatbot/config:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  RÉPONSES RAPIDES
// ═══════════════════════════════════════════════════════════════════════

router.get('/reponses-directes', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, mots_cles, reponse, reponses, menu_choix, actif, ordre, categorie, created_at, updated_at
       FROM chatbot_reponses_directes WHERE gestionnaire_id = $1 ORDER BY ordre ASC, id ASC`,
      [req.user.id]
    );
    res.json({ reponses: rows });
  } catch (err) {
    console.error('GET /chatbot/reponses-directes:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.post('/reponses-directes', async (req, res) => {
  const { mots_cles, reponse, reponses, menu_choix, actif, ordre, categorie } = req.body;
  if (!mots_cles || mots_cles.length === 0) return res.status(400).json({ error: 'Au moins un mot-clé est requis' });

  try {
    const { rows } = await db.query(
      `INSERT INTO chatbot_reponses_directes (gestionnaire_id, mots_cles, reponse, reponses, menu_choix, actif, ordre, categorie)
       VALUES ($1,$2,$3,$4,$5, COALESCE($6,true), COALESCE($7,(SELECT COALESCE(MAX(ordre),0)+1 FROM chatbot_reponses_directes WHERE gestionnaire_id=$1)), COALESCE($8,'site'))
       RETURNING *`,
      [req.user.id, mots_cles, reponse || '', reponses || null, menu_choix ? JSON.stringify(menu_choix) : null, actif, ordre, categorie]
    );
    res.status(201).json({ reponse: rows[0], message: 'Réponse ajoutée' });
  } catch (err) {
    console.error('POST /chatbot/reponses-directes:', err);
    res.status(500).json({ error: "Erreur lors de l'ajout" });
  }
});

router.put('/reponses-directes', async (req, res) => {
  const { id, mots_cles, reponse, reponses, menu_choix, actif, ordre, categorie } = req.body;
  if (!id) return res.status(400).json({ error: 'ID requis' });

  try {
    const { rows } = await db.query(
      `UPDATE chatbot_reponses_directes
       SET mots_cles = COALESCE($1, mots_cles), reponse = COALESCE($2, reponse), reponses = $3,
           menu_choix = $4, actif = COALESCE($5, actif), ordre = COALESCE($6, ordre),
           categorie = COALESCE($7, categorie, 'site'), updated_at = NOW()
       WHERE id = $8 AND gestionnaire_id = $9
       RETURNING *`,
      [mots_cles, reponse, reponses || null, menu_choix ? JSON.stringify(menu_choix) : null, actif, ordre, categorie, id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Réponse non trouvée' });
    res.json({ reponse: rows[0], message: 'Réponse mise à jour' });
  } catch (err) {
    console.error('PUT /chatbot/reponses-directes:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

router.delete('/reponses-directes/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM chatbot_reponses_directes WHERE id = $1 AND gestionnaire_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Réponse non trouvée' });
    res.json({ message: 'Réponse supprimée' });
  } catch (err) {
    console.error('DELETE /chatbot/reponses-directes/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  LISTE NOIRE — propre à chaque gestionnaire
// ═══════════════════════════════════════════════════════════════════════

router.get('/blacklist', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, mots_cles, message_reponse, actif, created_at FROM chatbot_blacklist WHERE gestionnaire_id = $1 ORDER BY id ASC`,
      [req.user.id]
    );
    res.json({ blacklist: rows });
  } catch (err) {
    console.error('GET /chatbot/blacklist:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.post('/blacklist', async (req, res) => {
  const { mots_cles, message_reponse, actif } = req.body;
  if (!mots_cles || mots_cles.length === 0) return res.status(400).json({ error: 'Au moins un mot-clé est requis' });
  if (!message_reponse) return res.status(400).json({ error: 'Le message de réponse est requis' });

  try {
    const { rows } = await db.query(
      `INSERT INTO chatbot_blacklist (gestionnaire_id, mots_cles, message_reponse, actif)
       VALUES ($1,$2,$3, COALESCE($4,true)) RETURNING *`,
      [req.user.id, mots_cles, message_reponse, actif]
    );
    res.status(201).json({ item: rows[0], message: 'Mot ajouté à la liste noire' });
  } catch (err) {
    console.error('POST /chatbot/blacklist:', err);
    res.status(500).json({ error: "Erreur lors de l'ajout" });
  }
});

router.put('/blacklist', async (req, res) => {
  const { id, mots_cles, message_reponse, actif } = req.body;
  if (!id) return res.status(400).json({ error: 'ID requis' });

  try {
    const { rows } = await db.query(
      `UPDATE chatbot_blacklist SET mots_cles = COALESCE($1, mots_cles), message_reponse = COALESCE($2, message_reponse), actif = COALESCE($3, actif)
       WHERE id = $4 AND gestionnaire_id = $5 RETURNING *`,
      [mots_cles, message_reponse, actif, id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Entrée non trouvée' });
    res.json({ item: rows[0], message: 'Liste noire mise à jour' });
  } catch (err) {
    console.error('PUT /chatbot/blacklist:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

router.delete('/blacklist/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM chatbot_blacklist WHERE id = $1 AND gestionnaire_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Entrée non trouvée' });
    res.json({ message: 'Entrée supprimée' });
  } catch (err) {
    console.error('DELETE /chatbot/blacklist/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  SOURCES PERSONNALISÉES
// ═══════════════════════════════════════════════════════════════════════

router.get('/sources-personnalisees', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, mots_cles, url_source, titre, description, actif, ordre, created_at
       FROM chatbot_sources_personnalisees WHERE gestionnaire_id = $1 ORDER BY ordre ASC, id DESC`,
      [req.user.id]
    );
    res.json({ success: true, sources: rows });
  } catch (err) {
    console.error('GET /chatbot/sources-personnalisees:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.post('/sources-personnalisees', async (req, res) => {
  const { mots_cles, url_source, titre, description, actif, ordre } = req.body;
  if (!mots_cles || mots_cles.length === 0) return res.status(400).json({ error: 'Au moins un mot-clé est requis' });
  if (!url_source) return res.status(400).json({ error: "L'URL source est requise" });

  try {
    const { rows } = await db.query(
      `INSERT INTO chatbot_sources_personnalisees (gestionnaire_id, mots_cles, url_source, titre, description, actif, ordre)
       VALUES ($1,$2,$3,$4,$5, COALESCE($6,true), COALESCE($7,(SELECT COALESCE(MAX(ordre),0)+1 FROM chatbot_sources_personnalisees WHERE gestionnaire_id=$1)))
       RETURNING *`,
      [req.user.id, mots_cles, url_source, titre, description, actif, ordre]
    );
    res.status(201).json({ success: true, source: rows[0], message: 'Source ajoutée' });
  } catch (err) {
    console.error('POST /chatbot/sources-personnalisees:', err);
    res.status(500).json({ error: "Erreur lors de l'ajout" });
  }
});

router.put('/sources-personnalisees/:id', async (req, res) => {
  const { mots_cles, url_source, titre, description, actif, ordre } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE chatbot_sources_personnalisees
       SET mots_cles = COALESCE($1, mots_cles), url_source = COALESCE($2, url_source), titre = COALESCE($3, titre),
           description = COALESCE($4, description), actif = COALESCE($5, actif), ordre = COALESCE($6, ordre), updated_at = NOW()
       WHERE id = $7 AND gestionnaire_id = $8
       RETURNING *`,
      [mots_cles, url_source, titre, description, actif, ordre, req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Source non trouvée' });
    res.json({ success: true, source: rows[0], message: 'Source mise à jour' });
  } catch (err) {
    console.error('PUT /chatbot/sources-personnalisees/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

router.delete('/sources-personnalisees/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM chatbot_sources_personnalisees WHERE id = $1 AND gestionnaire_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Source non trouvée' });
    res.json({ success: true, message: 'Source supprimée' });
  } catch (err) {
    console.error('DELETE /chatbot/sources-personnalisees/:id:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
//  STATISTIQUES
// ═══════════════════════════════════════════════════════════════════════

router.get('/stats', async (req, res) => {
  try {
    const gestionnaireId = req.user.id;
    const parJour = await db.query(
      `SELECT COUNT(*) as total_conversations, COUNT(DISTINCT session_id) as sessions_uniques,
              AVG(score) as score_moyen, DATE(date_question) as date
       FROM chatbot_conversations
       WHERE gestionnaire_id = $1 AND date_question > NOW() - INTERVAL '30 days'
       GROUP BY DATE(date_question) ORDER BY DATE(date_question) DESC`,
      [gestionnaireId]
    );
    const total = await db.query(
      `SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as sessions, AVG(score) as score_moyen
       FROM chatbot_conversations WHERE gestionnaire_id = $1`,
      [gestionnaireId]
    );
    res.json({ stats: parJour.rows, total: total.rows[0] });
  } catch (err) {
    console.error('GET /chatbot/stats:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des stats' });
  }
});

module.exports = router;