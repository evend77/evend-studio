// =============================================
// FICHIER: routes/addons.js
// =============================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// =====================================================================
// ADMIN - RÉCUPÉRER TOUS LES ADD-ONS
// =====================================================================
router.get('/admin/addons', authenticateToken, isAdmin, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const result = await pool.query(`
      SELECT 
        a.id, a.addon_id, a.nom, a.description, a.prix, a.periode, 
        a.categorie, a.popularite, a.actif, a.companie, 
        a.lien_documentation, a.badges, a.date_creation, a.date_modification,
        c.nom as categorie_nom,
        c.icon as categorie_icon,
        c.couleur as categorie_couleur,
        (SELECT COUNT(*) FROM evend_addons_gestionnaires WHERE addon_id = a.addon_id AND actif = true) as nb_gestionnaires_actifs
      FROM evend_addons a
      LEFT JOIN evend_addons_categories c ON a.categorie = c.categorie_id
      ORDER BY c.ordre_affichage, a.nom
    `);
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('❌ Erreur chargement addons:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// VENDEUR - RÉCUPÉRER LES ADD-ONS ACTIVÉS (admin actif = true)
// =====================================================================
router.get('/gestionnaire/addons', authenticateToken, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const result = await pool.query(`
      SELECT 
        a.id, a.addon_id, a.nom, a.description, a.prix, a.periode, 
        a.categorie, a.popularite, a.actif, a.companie, 
        a.lien_documentation, a.badges, a.date_creation, a.date_modification,
        c.nom as categorie_nom,
        c.icon as categorie_icon,
        c.couleur as categorie_couleur,
        COALESCE(av.actif, false) as vendeur_actif,
        av.date_activation as vendeur_date_activation
      FROM evend_addons a
      LEFT JOIN evend_addons_categories c ON a.categorie = c.categorie_id
      LEFT JOIN evend_addons_gestionnaires av ON a.addon_id = av.addon_id AND av.gestionnaire_id = $1
      WHERE a.actif = true
      ORDER BY c.ordre_affichage, a.nom
    `, [req.user.id]);
    
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('❌ Erreur chargement addons gestionnaire:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// VENDEUR - TOGGLE (activer/désactiver pour son compte)
// =====================================================================
router.post('/gestionnaire/:addon_id/toggle', authenticateToken, async (req, res) => {
  try {
    const { addon_id } = req.params;
    const vendeur_id = req.user.id; // gestionnaire_id

    const addonCheck = await pool.query(
      'SELECT addon_id, actif FROM evend_addons WHERE addon_id = $1',
      [addon_id]
    );

    if (addonCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Add-on non trouvé' });
    }

    if (!addonCheck.rows[0].actif) {
      return res.status(403).json({ 
        success: false, 
        error: 'Cet add-on est désactivé par l\'administrateur' 
      });
    }

    const existing = await pool.query(
      `SELECT id, actif FROM evend_addons_gestionnaires 
       WHERE gestionnaire_id = $1 AND addon_id = $2`,
      [vendeur_id, addon_id]
    );

    let nouvelEtat;
    let message;

    if (existing.rows.length === 0) {
      nouvelEtat = true;
      await pool.query(
        `INSERT INTO evend_addons_gestionnaires (gestionnaire_id, addon_id, date_activation, actif)
         VALUES ($1, $2, NOW(), $3)`,
        [vendeur_id, addon_id, true]
      );
      message = '✅ Add-on activé avec succès';
    } else {
      nouvelEtat = !existing.rows[0].actif;
      await pool.query(
        `UPDATE evend_addons_gestionnaires 
         SET actif = $1, date_activation = NOW()
         WHERE id = $2`,
        [nouvelEtat, existing.rows[0].id]
      );
      message = nouvelEtat 
        ? '✅ Add-on activé avec succès' 
        : '⏸ Add-on désactivé';
    }

    await pool.query(
      `INSERT INTO evend_addons_logs (addon_id, gestionnaire_id, action, details, utilisateur_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [addon_id, vendeur_id, nouvelEtat ? 'active_gestionnaire' : 'desactive_gestionnaire', 
       JSON.stringify({ nouvelEtat }), req.user.id]
    );

    res.json({ success: true, message, actif: nouvelEtat });

  } catch (err) {
    console.error('❌ Erreur toggle gestionnaire:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - CRÉER UN ADD-ON
// =====================================================================
router.post('/admin/addons', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      addon_id, nom, description, prix, periode, categorie,
      popularite, companie, lien_documentation, badges, actif
    } = req.body;

    const existant = await pool.query(
      'SELECT addon_id FROM evend_addons WHERE addon_id = $1',
      [addon_id]
    );
    
    if (existant.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Un add-on avec l'ID "${addon_id}" existe déjà` 
      });
    }

    const result = await pool.query(
      `INSERT INTO evend_addons (
        addon_id, nom, description, prix, periode, categorie, 
        popularite, companie, lien_documentation, badges, actif
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, addon_id, nom, description, prix, periode, categorie, 
                popularite, actif, companie, lien_documentation, badges, 
                date_creation, date_modification`,
      [
        addon_id, nom, description, prix || 0, periode || 'mois',
        categorie, popularite || 0, companie || null,
        lien_documentation || null, JSON.stringify(badges || []),
        actif || false
      ]
    );

    await pool.query(
      `INSERT INTO evend_addons_logs (addon_id, action, details, utilisateur_id)
       VALUES ($1, $2, $3, $4)`,
      [addon_id, 'cree', JSON.stringify({ nom, categorie }), req.user.id]
    );

    res.json({ success: true, data: result.rows[0], message: `Add-on "${nom}" créé avec succès` });
  } catch (err) {
    console.error('❌ Erreur création addon:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - MODIFIER UN ADD-ON
// =====================================================================
router.put('/admin/addons/:addon_id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { addon_id } = req.params;
    const {
      nom, description, prix, periode, categorie,
      popularite, companie, lien_documentation, badges, actif
    } = req.body;

    const result = await pool.query(
      `UPDATE evend_addons SET
        nom = $1, description = $2, prix = $3, periode = $4,
        categorie = $5, popularite = $6,
        companie = $7, lien_documentation = $8, badges = $9,
        actif = $10, date_modification = NOW()
      WHERE addon_id = $11
      RETURNING id, addon_id, nom, description, prix, periode, categorie, 
                popularite, actif, companie, lien_documentation, badges, 
                date_creation, date_modification`,
      [
        nom, description, prix, periode, categorie,
        popularite, companie || null,
        lien_documentation || null, JSON.stringify(badges || []),
        actif, addon_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Add-on non trouvé' });
    }

    await pool.query(
      `INSERT INTO evend_addons_logs (addon_id, action, details, utilisateur_id)
       VALUES ($1, $2, $3, $4)`,
      [addon_id, 'modifie', JSON.stringify({ nom, actif }), req.user.id]
    );

    res.json({ success: true, data: result.rows[0], message: `Add-on "${nom}" modifié avec succès` });
  } catch (err) {
    console.error('❌ Erreur modification addon:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - TOGGLE (activer/désactiver globalement)
// =====================================================================
router.post('/admin/addons/:addon_id/toggle', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { addon_id } = req.params;
    
    const current = await pool.query(
      'SELECT actif, nom FROM evend_addons WHERE addon_id = $1',
      [addon_id]
    );
    
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Add-on non trouvé' });
    }
    
    const nouvelEtat = !current.rows[0].actif;
    const nom = current.rows[0].nom;
    
    const result = await pool.query(
      `UPDATE evend_addons 
       SET actif = $1, date_modification = NOW() 
       WHERE addon_id = $2 
       RETURNING id, addon_id, nom, description, prix, periode, categorie, 
                popularite, actif, companie, lien_documentation, badges, 
                date_creation, date_modification`,
      [nouvelEtat, addon_id]
    );

    await pool.query(
      `INSERT INTO evend_addons_logs (addon_id, action, details, utilisateur_id)
       VALUES ($1, $2, $3, $4)`,
      [addon_id, nouvelEtat ? 'active_admin' : 'desactive_admin', 
       JSON.stringify({ nom }), req.user.id]
    );

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: nouvelEtat ? `✅ Add-on "${nom}" activé` : `⏸ Add-on "${nom}" désactivé`
    });
  } catch (err) {
    console.error('❌ Erreur toggle addon:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - RÉCUPÉRER LES CATÉGORIES
// =====================================================================
router.get('/admin/addons-categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const result = await pool.query(
      'SELECT * FROM evend_addons_categories ORDER BY ordre_affichage'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Erreur chargement catégories:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - CRÉER UNE CATÉGORIE
// =====================================================================
router.post('/admin/addons-categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { categorie_id, nom, icon, couleur, ordre_affichage } = req.body;
    
    const result = await pool.query(
      `INSERT INTO evend_addons_categories (categorie_id, nom, icon, couleur, ordre_affichage)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [categorie_id, nom, icon, couleur || '#2d6a9f', ordre_affichage || 0]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ Erreur création catégorie:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - MODIFIER UNE CATÉGORIE
// =====================================================================
router.put('/admin/addons-categories/:categorie_id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { categorie_id } = req.params;
    const { nom, icon, couleur, ordre_affichage } = req.body;

    const result = await pool.query(
      `UPDATE evend_addons_categories
       SET nom = $1, icon = $2, couleur = $3, ordre_affichage = $4
       WHERE categorie_id = $5
       RETURNING *`,
      [nom, icon, couleur || '#2d6a9f', ordre_affichage || 0, categorie_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Catégorie non trouvée' });
    }

    res.json({ success: true, data: result.rows[0], message: `Catégorie "${nom}" modifiée avec succès` });
  } catch (err) {
    console.error('❌ Erreur modification catégorie:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ADMIN - ADD-ONS ACTIVÉS PAR VENDEUR (facturation)
// =====================================================================
router.get('/admin/addons-actives-vendeurs', authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. Tous les gestionnaires
    const gestionnaires_list = await pool.query(
      `SELECT id, nom, email,
              COALESCE(nom_boutique, nom) AS nom_boutique,
              COALESCE(plan, 'gratuit') AS plan
         FROM gestionnaires
        ORDER BY nom_boutique ASC`
    );

    // 2. Tous les add-ons actifs par gestionnaire
    const addonsActifs = await pool.query(
      `SELECT
         av.gestionnaire_id,
         a.addon_id,
         a.nom,
         a.prix::text,
         a.periode,
         COALESCE(c.nom, a.categorie) AS categorie,
         av.date_activation
       FROM evend_addons_gestionnaires av
       JOIN evend_addons a ON a.addon_id = av.addon_id
       LEFT JOIN evend_addons_categories c ON c.categorie_id = a.categorie
       WHERE av.actif = true AND a.actif = true
       ORDER BY av.gestionnaire_id, a.nom`
    );

    // 3. Regrouper les add-ons par vendeur
    const addonsByVendeur = {};
    addonsActifs.rows.forEach((row) => {
      if (!addonsByVendeur[row.vendeur_id]) addonsByVendeur[row.vendeur_id] = [];
      addonsByVendeur[row.vendeur_id].push({
        addon_id:        row.addon_id,
        nom:             row.nom,
        prix:            row.prix,
        periode:         row.periode,
        categorie:       row.categorie,
        date_activation: row.date_activation,
      });
    });

    // 4. Calculer le total mensuel par vendeur
    const result = vendeurs.rows.map((v) => {
      const addons = addonsByVendeur[v.id] || [];
      const total_mois = addons.reduce((sum, a) => {
        const prix = parseFloat(a.prix) || 0;
        if (prix === 0) return sum;
        return sum + (a.periode === 'an' ? prix / 12 : prix);
      }, 0);
      return {
        vendeur_id:   v.id,
        nom:          v.nom,
        email:        v.email,
        nom_boutique: v.nom_boutique,
        plan:         v.plan,
        addons,
        total_mois:   Math.round(total_mois * 100) / 100,
      };
    });

    res.json({ success: true, data: result, total: result.length });
  } catch (err) {
    console.error('❌ Erreur addons-actives-vendeurs:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;