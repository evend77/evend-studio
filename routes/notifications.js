/**
 * routes/notifications.js
 * Gestion des notifications administratives
 * Envoi à vendeurs/acheteurs, historique, stats de lecture
 * Routes pour les acheteurs (consultation, marquage lu)
 * + Alertes prix (price drop notifications)
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// =====================================================================
// ENVOYER UNE NOTIFICATION (admin)
// =====================================================================
router.post('/envoyer', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { titre, message, type, cible, mode, destinataires, image_url, image_nom } = req.body;
    const adminId = req.user.id;

    // Validation
    if (!titre?.trim() || !message?.trim() || !type || !cible || !mode) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    let destinataireIds = [];
    let nbEnvoyes = 0;

    // Déterminer les destinataires selon le mode
    if (mode === 'broadcast') {
      if (cible === 'vendeurs') {
        const vendeurs = await pool.query('SELECT id FROM vendeurs');
        destinataireIds = vendeurs.rows.map(v => v.id);
      } else if (cible === 'acheteurs') {
        const acheteurs = await pool.query('SELECT id FROM acheteurs');
        destinataireIds = acheteurs.rows.map(a => a.id);
      } else if (cible === 'tous') {
        const vendeurs = await pool.query('SELECT id FROM vendeurs');
        const acheteurs = await pool.query('SELECT id FROM acheteurs');
        destinataireIds = [
          ...vendeurs.rows.map(v => ({ id: v.id, type: 'vendeur' })),
          ...acheteurs.rows.map(a => ({ id: a.id, type: 'acheteur' }))
        ];
      }
      nbEnvoyes = destinataireIds.length;
    } else {
      // mode individuel ou sélection
      if (!destinataires || !Array.isArray(destinataires) || destinataires.length === 0) {
        return res.status(400).json({ error: 'Aucun destinataire sélectionné' });
      }
      destinataireIds = destinataires.map(id => ({ id, type: cible === 'vendeurs' ? 'vendeur' : 'acheteur' }));
      nbEnvoyes = destinataireIds.length;
    }

    // Créer la notification
    const notifResult = await pool.query(
      `INSERT INTO notifications (titre, message, type, cible, mode, nb_destinataires, admin_id, image_url, image_nom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, cree_le`,
      [titre.trim(), message.trim(), type, cible, mode, nbEnvoyes, adminId, image_url || null, image_nom || null]
    );

    const notificationId = notifResult.rows[0].id;

    // Créer les entrées pour chaque destinataire
    for (const dest of destinataireIds) {
      if (typeof dest === 'object' && dest.type) {
        await pool.query(
          `INSERT INTO notifications_destinataires (notification_id, destinataire_id, destinataire_type)
           VALUES ($1, $2, $3)`,
          [notificationId, dest.id, dest.type]
        );
      } else {
        await pool.query(
          `INSERT INTO notifications_destinataires (notification_id, destinataire_id, destinataire_type)
           VALUES ($1, $2, $3)`,
          [notificationId, dest, cible === 'vendeurs' ? 'vendeur' : 'acheteur']
        );
      }
    }

    res.json({
      success: true,
      id: notificationId,
      nbEnvoyes,
      message: `Notification envoyée à ${nbEnvoyes} personne(s)`
    });

  } catch (err) {
    console.error('❌ Erreur envoi notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// RÉCUPÉRER L'HISTORIQUE DES NOTIFICATIONS (admin)
// =====================================================================
router.get('/historique', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const rows = await pool.query(`
      SELECT 
        n.id, n.titre, n.message, n.type, n.cible, n.mode,
        n.nb_destinataires, n.cree_le, n.image_url, n.image_nom,
        (SELECT COUNT(*) FROM notifications_destinataires nd 
         WHERE nd.notification_id = n.id AND nd.lu = true) AS nb_lus
      FROM notifications n
      ORDER BY n.cree_le DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const notifications = rows.rows.map(r => ({
      id: r.id,
      titre: r.titre,
      message: r.message,
      type: r.type,
      cible: r.cible,
      mode: r.mode,
      date: r.cree_le,
      image_url: r.image_url,
      image_nom: r.image_nom,
      nbDestinataires: parseInt(r.nb_destinataires),
      lu: parseInt(r.nb_lus) || 0
    }));

    res.json(notifications);
  } catch (err) {
    console.error('❌ Erreur historique notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// RÉCUPÉRER LES DESTINATAIRES D'UNE NOTIFICATION (admin)
// =====================================================================
router.get('/:id/destinataires', authenticateToken, isAdmin, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notifCheck = await pool.query('SELECT id FROM notifications WHERE id = $1', [notificationId]);
    if (notifCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    const result = await pool.query(`
      SELECT 
        nd.destinataire_id AS id,
        nd.destinataire_type AS type,
        nd.lu,
        nd.lu_le,
        CASE 
          WHEN nd.destinataire_type = 'vendeur' THEN v.nom
          WHEN nd.destinataire_type = 'acheteur' THEN a.prenom || ' ' || a.nom
        END AS nom,
        CASE 
          WHEN nd.destinataire_type = 'vendeur' THEN v.email
          WHEN nd.destinataire_type = 'acheteur' THEN a.email
        END AS email
      FROM notifications_destinataires nd
      LEFT JOIN vendeurs v ON nd.destinataire_id = v.id AND nd.destinataire_type = 'vendeur'
      LEFT JOIN acheteurs a ON nd.destinataire_id = a.id AND nd.destinataire_type = 'acheteur'
      WHERE nd.notification_id = $1
      ORDER BY nd.lu, nd.destinataire_type, nom
    `, [notificationId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur chargement destinataires:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// SUPPRIMER UNE NOTIFICATION (admin)
// =====================================================================
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    const notif = await pool.query('SELECT id FROM notifications WHERE id = $1', [notificationId]);
    if (notif.rows.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }
    
    await pool.query('DELETE FROM notifications WHERE id = $1', [notificationId]);
    
    res.json({ success: true, message: 'Notification supprimée' });
  } catch (err) {
    console.error('❌ Erreur suppression notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// STATISTIQUES DES NOTIFICATIONS (admin)
// =====================================================================
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN cible = 'vendeurs' THEN 1 END) AS total_vendeurs,
        COUNT(CASE WHEN cible = 'acheteurs' THEN 1 END) AS total_acheteurs,
        COUNT(CASE WHEN cible = 'tous' THEN 1 END) AS total_tous,
        SUM(nb_destinataires) AS total_envoyes,
        (SELECT COUNT(*) FROM notifications_destinataires WHERE lu = true) AS total_lus
      FROM notifications
    `);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('❌ Erreur stats notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ROUTES POUR LES DESTINATAIRES (vendeurs/acheteurs)
// =====================================================================
router.get('/vendeurs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const vendeurs = await pool.query(
      'SELECT id, nom, boutique, email FROM vendeurs ORDER BY boutique'
    );
    res.json(vendeurs.rows);
  } catch (err) {
    console.error('❌ Erreur GET vendeurs:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/acheteurs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const acheteurs = await pool.query(
      'SELECT id, nom, prenom, email FROM acheteurs ORDER BY nom, prenom'
    );
    res.json(acheteurs.rows);
  } catch (err) {
    console.error('❌ Erreur GET acheteurs:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ROUTES POUR LES ACHETEURS (dashboard acheteur)
// =====================================================================

// GET /acheteurs/:id/notifications - Récupérer les notifications d'un acheteur
router.get('/acheteurs/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const acheteurId = parseInt(req.params.id);
    
    if (req.user.role === 'acheteur' && req.user.id !== acheteurId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer les notifications administratives
    const adminNotifs = await pool.query(`
      SELECT 
        n.id, n.titre, n.message, n.type, n.image_url, n.image_nom,
        n.cree_le AS date,
        CASE WHEN nd.lu THEN true ELSE false END AS lu,
        false AS important,
        NULL as product_title, NULL as product_image_url, NULL as product_url,
        NULL as old_price, NULL as new_price, NULL as target_price,
        'admin' as source
      FROM notifications n
      JOIN notifications_destinataires nd ON nd.notification_id = n.id
      WHERE nd.destinataire_id = $1 
        AND nd.destinataire_type = 'acheteur'
        AND n.cible IN ('acheteurs', 'tous')
    `, [acheteurId]);

    // Récupérer les alertes prix - Version adaptée à la structure de price_alert_notifications
    const priceAlerts = await pool.query(`
      SELECT 
        pan.id,
        pan.subject as titre,
        pan.content as message,
        'succes' as type,
        COALESCE(pan.product_image_url, pa.product_image_url) as image_url,
        NULL as image_nom,
        pan.sent_at as date,
        CASE WHEN pan.lu = true OR pan.status = 'read' THEN true ELSE false END as lu,
        false as important,
        COALESCE(pan.product_title, pa.product_title) as product_title,
        COALESCE(pan.product_image_url, pa.product_image_url) as product_image_url,
        COALESCE(pan.product_url, pa.product_url) as product_url,
        pan.old_price,
        pan.new_price,
        COALESCE(pan.target_price, pa.target_price) as target_price,
        pa.message as message_acheteur,
        'price_alert' as source
      FROM price_alert_notifications pan
      JOIN price_alerts pa ON pa.id = pan.alert_id
      WHERE pa.email IN (SELECT email FROM acheteurs WHERE id = $1)
      ORDER BY pan.sent_at DESC
    `, [acheteurId]);

    // Fusionner et trier par date
    const allNotifications = [...adminNotifs.rows, ...priceAlerts.rows];
    allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allNotifications);
  } catch (err) {
    console.error('❌ Erreur GET notifications acheteur:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /notifications/:id/lire - Marquer une notification comme lue
router.put('/notifications/:id/lire', authenticateToken, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    // Vérifier si c'est une alerte prix
    const priceAlert = await pool.query(`
      SELECT id FROM price_alert_notifications WHERE id = $1
    `, [notificationId]);

    if (priceAlert.rows.length > 0) {
      // C'est une alerte prix - mettre à jour le status
      await pool.query(`
        UPDATE price_alert_notifications 
        SET status = 'read' 
        WHERE id = $1
      `, [notificationId]);
    } else {
      // C'est une notification admin
      await pool.query(`
        UPDATE notifications_destinataires 
        SET lu = true, lu_le = NOW()
        WHERE notification_id = $1 
          AND destinataire_id = $2 
          AND destinataire_type = $3
      `, [notificationId, userId, userRole]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Erreur marquage notification:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /acheteurs/:id/notifications/lire-tout - Marquer toutes comme lues
router.put('/acheteurs/:id/notifications/lire-tout', authenticateToken, async (req, res) => {
  try {
    const acheteurId = parseInt(req.params.id);

    // Marquer les notifications admin
    await pool.query(`
      UPDATE notifications_destinataires 
      SET lu = true, lu_le = NOW()
      WHERE destinataire_id = $1 
        AND destinataire_type = 'acheteur'
        AND lu = false
    `, [acheteurId]);

    // Marquer les alertes prix
    await pool.query(`
      UPDATE price_alert_notifications 
      SET status = 'read'
      WHERE id IN (
        SELECT pan.id FROM price_alert_notifications pan
        JOIN price_alerts pa ON pa.id = pan.alert_id
        WHERE pa.email IN (SELECT email FROM acheteurs WHERE id = $1)
      )
    `, [acheteurId]);

    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (err) {
    console.error('❌ Erreur marquage tout:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// ROUTES POUR LES VENDEURS (dashboard vendeur)
// =====================================================================

// GET /vendeurs/:id/notifications - Récupérer les notifications d'un vendeur
router.get('/vendeurs/:id/notifications', authenticateToken, async (req, res) => {
  try {
    const vendeurId = parseInt(req.params.id);
    
    if (req.user.role === 'vendeur' && req.user.id !== vendeurId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const result = await pool.query(`
      SELECT 
        n.id, n.titre, n.message, n.type, n.image_url, n.image_nom,
        n.cree_le AS date,
        CASE WHEN nd.lu THEN true ELSE false END AS lu,
        false AS important
      FROM notifications n
      JOIN notifications_destinataires nd ON nd.notification_id = n.id
      WHERE nd.destinataire_id = $1 
        AND nd.destinataire_type = 'vendeur'
        AND n.cible IN ('vendeurs', 'tous')
      ORDER BY n.cree_le DESC
    `, [vendeurId]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Erreur GET notifications vendeur:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /vendeurs/:id/notifications/lire-tout - Marquer toutes comme lues (vendeur)
router.put('/vendeurs/:id/notifications/lire-tout', authenticateToken, async (req, res) => {
  try {
    const vendeurId = parseInt(req.params.id);

    await pool.query(`
      UPDATE notifications_destinataires 
      SET lu = true, lu_le = NOW()
      WHERE destinataire_id = $1 
        AND destinataire_type = 'vendeur'
        AND lu = false
    `, [vendeurId]);

    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (err) {
    console.error('❌ Erreur marquage tout:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;