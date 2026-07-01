// routes/acheteurs.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ============================================
// ROUTES POUR LA CONFIGURATION ACHETEUR
// ============================================

// GET - Recuperer la configuration d'un acheteur
router.get('/:acheteurId/config', authenticateToken, async (req, res) => {
    try {
        const acheteurId = parseInt(req.params.acheteurId);
        
        const isAuthorized = req.user.id === acheteurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Acces non autorise' });
        }
        
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'config_acheteur'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            return res.status(404).json({ error: 'Table config_acheteur non trouvee' });
        }
        
        const result = await pool.query(
            'SELECT * FROM config_acheteur WHERE acheteur_id = $1',
            [acheteurId]
        );
        
        if (result.rows.length === 0) {
            const newConfig = await pool.query(
                `INSERT INTO config_acheteur (acheteur_id, nom_utilisateur) VALUES ($1, 'Acheteur') RETURNING *`,
                [acheteurId]
            );
            return res.json(newConfig.rows[0]);
        }
        
        res.json(result.rows[0]);
        
    } catch (err) {
        console.error('Erreur GET /api/acheteurs/:acheteurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT - Mettre a jour la configuration complete d'un acheteur
router.put('/:acheteurId/config', authenticateToken, async (req, res) => {
    try {
        const acheteurId = parseInt(req.params.acheteurId);
        
        const isAuthorized = req.user.id === acheteurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Acces non autorise' });
        }
        
        const data = req.body;
        
        // Verifier si la colonne categories_preferees existe
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'config_acheteur' AND column_name = 'categories_preferees'
        `);
        
        let categoriesPrefereesSql = '';
        let categoriesPrefereesValue = null;
        
        if (colCheck.rows.length > 0) {
            categoriesPrefereesSql = ', categories_preferees = COALESCE($5, categories_preferees)';
            categoriesPrefereesValue = data.categories_preferees;
        }
        
        const query = `
            UPDATE config_acheteur SET
                nom_utilisateur = COALESCE($1, nom_utilisateur),
                notifications_actif = COALESCE($2, notifications_actif),
                alertes_email_actif = COALESCE($3, alertes_email_actif),
                mise_maximale_defaut = COALESCE($4, mise_maximale_defaut)
                ${categoriesPrefereesSql},
                updated_at = CURRENT_TIMESTAMP
            WHERE acheteur_id = $6
            RETURNING *
        `;
        
        const values = [
            data.nom_utilisateur,
            data.notifications_actif,
            data.alertes_email_actif,
            data.mise_maximale_defaut,
            categoriesPrefereesValue,
            acheteurId
        ].filter(v => v !== undefined);
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['CONFIG_ACHETEUR_UPDATE', req.user?.email || 'acheteur',
             JSON.stringify({ acheteur_id: acheteurId, categories: data.categories_preferees }), 'info']
        ).catch(e => console.error('Erreur log:', e));
        
        console.log(`Configuration mise a jour pour l'acheteur ${acheteurId}`);
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('Erreur PUT /api/acheteurs/:acheteurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH - Mettre a jour partiellement la configuration d'un acheteur
router.patch('/:acheteurId/config', authenticateToken, async (req, res) => {
    try {
        const acheteurId = parseInt(req.params.acheteurId);
        
        const isAuthorized = req.user.id === acheteurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) {
            return res.status(403).json({ error: 'Acces non autorise' });
        }
        
        const updates = req.body;
        const fields = Object.keys(updates);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnee a mettre a jour' });
        }
        
        const values = Object.values(updates);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        values.push(acheteurId);
        
        const query = `
            UPDATE config_acheteur 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE acheteur_id = $${values.length}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        console.log(`Configuration partiellement mise a jour pour l'acheteur ${acheteurId}`);
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('Erreur PATCH /api/acheteurs/:acheteurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// GET liste simple des acheteurs (pour notifications)
// ============================================
router.get('/liste-simple', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, prenom, email FROM acheteurs ORDER BY nom, prenom'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET /liste-simple acheteurs:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INSCRIPTION ACHETEUR (PUBLIQUE)
// ============================================
router.post('/inscription', async (req, res) => {
  const {
    prenom, nom, email, telephone, mot_de_passe,
    adresse, ville, province, code_postal,
    categories, infolettre, age_confirme, termes_acceptes
  } = req.body;

  try {
    const existingUser = await pool.query('SELECT id FROM acheteurs WHERE email = $1', [email]);
    if (existingUser.rows.length > 0)
      return res.status(400).json({ success: false, message: 'Cet email est deja utilise' });

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const result = await pool.query(
      `INSERT INTO acheteurs (
        prenom, nom, email, telephone, mot_de_passe,
        adresse, ville, province, code_postal,
        categories, infolettre, age_confirme, termes_acceptes,
        statut, date_inscription
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'actif',NOW())
      RETURNING id, prenom, nom, email, statut`,
      [
        prenom, nom, email, telephone || null, hashedPassword,
        adresse || null, ville || null, province || null, code_postal || null,
        categories || null, infolettre ? 1 : 0,
        age_confirme ? 1 : 0, termes_acceptes ? 1 : 0
      ]
    );

    // Creer une configuration par defaut pour le nouvel acheteur
    await pool.query(
      `INSERT INTO config_acheteur (acheteur_id, nom_utilisateur) 
       VALUES ($1, $2) ON CONFLICT (acheteur_id) DO NOTHING`,
      [result.rows[0].id, prenom || 'Acheteur']
    );

    res.status(201).json({ success: true, message: 'Compte cree avec succes!', acheteur: result.rows[0] });
  } catch (error) {
    console.error('Erreur inscription acheteur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================
// GET tous les acheteurs (admin)
// ============================================
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id, a.prenom, a.nom, a.email, a.telephone,
        a.adresse, a.ville, a.province, a.code_postal,
        a.statut, a.date_inscription, a.derniere_connexion, a.notes,
        COUNT(DISTINCT c.id)      AS nb_commandes,
        COALESCE(SUM(c.montant), 0) AS total_achats
      FROM acheteurs a
      LEFT JOIN commandes c ON c.acheteur_id = a.id
      GROUP BY a.id, a.prenom, a.nom, a.email, a.telephone, a.adresse,
               a.ville, a.province, a.code_postal, a.statut,
               a.date_inscription, a.derniere_connexion, a.notes
      ORDER BY a.date_inscription DESC
    `);

    const acheteurs = await Promise.all(result.rows.map(async (a) => {
      try {
        const notes = await pool.query(
          `SELECT id, to_char(date_creation,'YYYY-MM-DD') AS date, auteur, contenu
           FROM notes_acheteurs WHERE acheteur_id = $1 ORDER BY date_creation DESC`,
          [a.id]
        );
        return { ...a, nb_commandes: parseInt(a.nb_commandes) || 0, total_achats: parseFloat(a.total_achats) || 0, notes: notes.rows };
      } catch {
        return { ...a, nb_commandes: 0, total_achats: 0, notes: [] };
      }
    }));

    res.json(acheteurs);
  } catch (error) {
    console.error('Erreur GET /acheteurs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// ============================================
// GET profil complet avec stats (acheteur connecte)
// IMPORTANT: cette route doit etre avant GET /:id
// ============================================
router.get('/:id/profil', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        a.id, a.prenom, a.nom, a.email, a.telephone,
        a.date_naissance, a.date_inscription,
        a.langue, a.newsletter, a.notifications_promo,
        COUNT(DISTINCT c.id)  AS nb_commandes,
        COUNT(DISTINCT av.id) AS nb_avis,
        0                     AS nb_wishlist
      FROM acheteurs a
      LEFT JOIN commandes c  ON c.acheteur_id = a.id
      LEFT JOIN avis      av ON av.acheteur_id = a.id
      WHERE a.id = $1
      GROUP BY a.id
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Acheteur non trouve.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /:id/profil:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ============================================
// PUT modifier profil (acheteur connecte)
// ============================================
router.put('/:id/profil', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { prenom, nom, email, telephone, date_naissance, langue, newsletter, notifications_promo } = req.body;

    if (email) {
      const check = await pool.query('SELECT id FROM acheteurs WHERE email = $1 AND id != $2', [email, id]);
      if (check.rows.length > 0) return res.status(409).json({ message: 'Cet email est deja utilise.' });
    }

    const result = await pool.query(`
      UPDATE acheteurs SET
        prenom              = COALESCE($1, prenom),
        nom                 = COALESCE($2, nom),
        email               = COALESCE($3, email),
        telephone           = $4,
        date_naissance      = $5,
        langue              = COALESCE($6, langue),
        newsletter          = COALESCE($7, newsletter),
        notifications_promo = COALESCE($8, notifications_promo)
      WHERE id = $9
      RETURNING id, prenom, nom, email, telephone
    `, [prenom, nom, email, telephone || null, date_naissance || null, langue, newsletter, notifications_promo, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Acheteur non trouve.' });
    res.json({ success: true, acheteur: result.rows[0] });
  } catch (err) {
    console.error('PUT /:id/profil:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ============================================
// PUT changer mot de passe
// Supporte: acheteur (motDePasseActuel requis) ET admin (mot_de_passe direct)
// ============================================
router.put('/:id/mot-de-passe', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { motDePasseActuel, nouveauMotDePasse, mot_de_passe } = req.body;

    // Admin change directement
    if (req.user?.role === 'admin' && mot_de_passe) {
      if (mot_de_passe.length < 8) return res.status(400).json({ message: 'Minimum 8 caracteres.' });
      const hash = await bcrypt.hash(mot_de_passe, 10);
      await pool.query('UPDATE acheteurs SET mot_de_passe = $1 WHERE id = $2', [hash, id]);
      return res.json({ success: true, message: 'Mot de passe modifie.' });
    }

    // Acheteur change son propre mot de passe
    if (!nouveauMotDePasse || nouveauMotDePasse.length < 8)
      return res.status(400).json({ message: 'Minimum 8 caracteres requis.' });

    const result = await pool.query('SELECT mot_de_passe FROM acheteurs WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Acheteur non trouve.' });

    const hashActuel = result.rows[0].mot_de_passe;
    const valide = await bcrypt.compare(motDePasseActuel, hashActuel).catch(() => false)
      || motDePasseActuel === hashActuel;
    if (!valide) return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });

    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 10);
    await pool.query('UPDATE acheteurs SET mot_de_passe = $1 WHERE id = $2', [nouveauHash, id]);
    res.json({ success: true, message: 'Mot de passe mis a jour.' });
  } catch (err) {
    console.error('PUT /:id/mot-de-passe:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ============================================
// ADRESSES
// ============================================

router.get('/:id/adresses', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM adresses_acheteurs WHERE acheteur_id = $1 ORDER BY est_principale DESC, id ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /:id/adresses:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/:id/adresses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, ligne1, ligne2, ville, province, code_postal, pays, telephone, est_principale, type } = req.body;

    if (est_principale)
      await pool.query('UPDATE adresses_acheteurs SET est_principale = false WHERE acheteur_id = $1', [id]);

    const result = await pool.query(`
      INSERT INTO adresses_acheteurs
        (acheteur_id, nom, ligne1, ligne2, ville, province, code_postal, pays, telephone, est_principale, type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [id, nom, ligne1, ligne2 || null, ville, province, code_postal, pays || 'Canada', telephone || null, est_principale || false, type || 'livraison']);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /:id/adresses:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:id/adresses/:adresseId', authenticateToken, async (req, res) => {
  try {
    const { id, adresseId } = req.params;
    const { nom, ligne1, ligne2, ville, province, code_postal, pays, telephone, est_principale, type } = req.body;

    if (est_principale)
      await pool.query('UPDATE adresses_acheteurs SET est_principale = false WHERE acheteur_id = $1', [id]);

    const result = await pool.query(`
      UPDATE adresses_acheteurs SET
        nom = $1, ligne1 = $2, ligne2 = $3, ville = $4, province = $5,
        code_postal = $6, pays = $7, telephone = $8, est_principale = $9, type = $10
      WHERE id = $11 AND acheteur_id = $12
      RETURNING *
    `, [nom, ligne1, ligne2 || null, ville, province, code_postal, pays || 'Canada', telephone || null, est_principale || false, type || 'livraison', adresseId, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Adresse non trouvee.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /:id/adresses/:adresseId:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.delete('/:id/adresses/:adresseId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM adresses_acheteurs WHERE id = $1 AND acheteur_id = $2',
      [req.params.adresseId, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /:id/adresses/:adresseId:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.put('/:id/adresses/:adresseId/principale', authenticateToken, async (req, res) => {
  try {
    const { id, adresseId } = req.params;
    await pool.query('UPDATE adresses_acheteurs SET est_principale = false WHERE acheteur_id = $1', [id]);
    await pool.query('UPDATE adresses_acheteurs SET est_principale = true  WHERE id = $1 AND acheteur_id = $2', [adresseId, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /:id/adresses/:adresseId/principale:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// -----------------------------------------------------------------------------
// GET /:id/commandes - commandes de l'acheteur (dashboard polling)
// -----------------------------------------------------------------------------
router.get('/:id/commandes', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'acheteur' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    
    const result = await pool.query(
      `SELECT
         c.id,
         c.store_order_id as numero_commande,
         c.date_commande,
         c.statut_commande as statut,
         c.statut_paiement,
         c.montant as total,
         c.vendeur_id,
         c.transporteur,
         c.numero_suivi,
         c.url_suivi,
         c.etape_livraison,
         c.produits,
         c.ville,
         c.province,
         c.adresse_livraison,
         c.adresse_facturation,
         c.pourboire,
         c.sous_total,
         c.frais_expedition,
         c.tps,
         c.tvq,
         c.tvh,
         c.historique_suivi,
         v.nom AS vendeur_nom,
         v.nom_boutique AS vendeur_boutique
       FROM commandes c
       LEFT JOIN vendeurs v ON v.id = c.vendeur_id
       WHERE c.acheteur_id = $1
       ORDER BY c.date_commande DESC
       LIMIT 50`,
      [id]
    );

    // Enrichir les produits avec les images depuis la table produits
    const commandes = await Promise.all(result.rows.map(async (r) => {
      let articles = [];
      try {
        const produits = Array.isArray(r.produits) ? r.produits : JSON.parse(r.produits || '[]');
        
        // Pour chaque produit, chercher l'image via shopify_id
        articles = await Promise.all(produits.map(async (p) => {
          let image = null;
          if (p.shopify_id) {
            const imgRes = await pool.query(
              'SELECT image FROM produits WHERE shopify_id = $1 LIMIT 1',
              [String(p.shopify_id)]
            );
            image = imgRes.rows[0]?.image || null;
          }
          return { ...p, image };
        }));
      } catch (e) {
        articles = [];
      }

      // Parser l'historique de suivi
      let historiqueSuivi = [];
      try {
        if (r.historique_suivi) {
          historiqueSuivi = typeof r.historique_suivi === 'string' 
            ? JSON.parse(r.historique_suivi) 
            : r.historique_suivi;
        }
      } catch (e) {
        historiqueSuivi = [];
      }

      return {
        id: r.id,
        numero_commande: r.numero_commande || String(r.id),
        date_commande: r.date_commande,
        statut: r.statut || 'En traitement',
        statut_paiement: r.statut_paiement,
        total: parseFloat(r.total) || 0,
        articles: articles,
        vendeur_nom: r.vendeur_nom || null,
        vendeur_boutique: r.vendeur_boutique || null,
        transporteur: r.transporteur || null,
        numero_suivi: r.numero_suivi || null,
        url_suivi: r.url_suivi || null,
        etape_livraison: r.etape_livraison || 'creee',
        ville: r.ville || null,
        province: r.province || null,
        adresse_livraison: r.adresse_livraison || null,
        adresse_facturation: r.adresse_facturation || null,
        pourboire: parseFloat(r.pourboire || 0),
        sous_total: parseFloat(r.sous_total || 0),
        frais_expedition: parseFloat(r.frais_expedition || 0),
        tps: parseFloat(r.tps || 0),
        tvq: parseFloat(r.tvq || 0),
        tvh: parseFloat(r.tvh || 0),
        historique_suivi: historiqueSuivi
      };
    }));

    res.json(commandes);
  } catch (error) {
    console.error('Erreur GET /:id/commandes:', error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// GET /:id/notifications - notifications de l'acheteur (dashboard polling)
// -----------------------------------------------------------------------------
router.get('/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'acheteur' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    // Table notifications pas encore creee -> retourner tableau vide proprement
    try {
      const result = await pool.query(
        `SELECT id, titre, message, date_creation AS date, lu, type
         FROM notifications
         WHERE acheteur_id = $1
         ORDER BY date_creation DESC
         LIMIT 20`,
        [id]
      );
      res.json(result.rows);
    } catch (tableErr) {
      // Table n'existe pas encore
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------------
// GET /:id/avis - avis donnes par l'acheteur (dashboard polling)
// -----------------------------------------------------------------------------
router.get('/:id/avis', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'acheteur' && req.user.id !== id) {
      return res.status(403).json({ error: 'Acces refuse' });
    }
    // Table avis pas encore creee -> retourner tableau vide proprement
    try {
      const result = await pool.query(
        `SELECT id, produit_nom, vendeur_nom, note, commentaire, date_creation AS date
         FROM avis
         WHERE acheteur_id = $1
         ORDER BY date_creation DESC
         LIMIT 20`,
        [id]
      );
      res.json(result.rows);
    } catch (tableErr) {
      // Table n'existe pas encore
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET acheteur par ID
// ============================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, prenom, nom, email, telephone,
              adresse, ville, province, code_postal,
              statut, date_inscription, derniere_connexion
       FROM acheteurs WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Acheteur non trouve' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// ============================================
// NOTES (admin)
// ============================================
router.post('/:id/notes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { contenu } = req.body;
    if (!contenu?.trim()) return res.status(400).json({ error: 'Contenu requis' });
    const auteur = req.user.email || 'Admin';
    const result = await pool.query(
      `INSERT INTO notes_acheteurs (acheteur_id, auteur, contenu)
       VALUES ($1,$2,$3)
       RETURNING id, to_char(date_creation,'YYYY-MM-DD') AS date, auteur, contenu`,
      [req.params.id, auteur, contenu.trim()]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/notes/:noteId', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notes_acheteurs WHERE id = $1 AND acheteur_id = $2',
      [req.params.noteId, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STATUT (admin)
// ============================================
router.put('/:id/statut', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { statut, raison } = req.body;
    if (!['actif', 'suspendu', 'banni'].includes(statut))
      return res.status(400).json({ error: 'Statut invalide' });
    await pool.query(
      'UPDATE acheteurs SET statut = $1, notes = $2 WHERE id = $3',
      [statut, raison || null, req.params.id]
    );
    res.json({ success: true, message: 'Statut change a ' + statut });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;