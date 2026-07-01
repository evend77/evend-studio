// routes/suivi.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Mettre à jour le suivi d'une commande (pour le vendeur)
router.put('/commandes/:commandeId/suivi', authenticate, async (req, res) => {
  const { commandeId } = req.params;
  const { numero_suivi, transporteur, url_suivi } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Vérifier que le vendeur a le droit de modifier cette commande
    let verificationQuery;
    let verificationValues;

    if (userRole === 'vendeur') {
      verificationQuery = `
        SELECT c.id, c.vendeur_id, c.commande_id, c.etape_livraison
        FROM commandes c
        WHERE c.id = $1 AND c.vendeur_id = $2
      `;
      verificationValues = [commandeId, userId];
    } else if (userRole === 'admin') {
      verificationQuery = `SELECT id, commande_id, etape_livraison FROM commandes WHERE id = $1`;
      verificationValues = [commandeId];
    } else {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const commandeCheck = await pool.query(verificationQuery, verificationValues);
    
    if (commandeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée ou non autorisée' });
    }

    const commande = commandeCheck.rows[0];

    // Mettre à jour le suivi
    const updateQuery = `
      UPDATE commandes 
      SET numero_suivi = $1,
          transporteur = $2,
          url_suivi = $3,
          etape_livraison = CASE 
            WHEN $1 IS NOT NULL AND $1 != '' THEN 'expediee'
            ELSE etape_livraison
          END,
          date_expedition = CASE 
            WHEN $1 IS NOT NULL AND $1 != '' AND date_expedition IS NULL THEN NOW()
            ELSE date_expedition
          END,
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      numero_suivi || null,
      transporteur || null,
      url_suivi || null,
      commandeId
    ]);

    const commandeMaj = result.rows[0];

    // Créer une notification pour l'acheteur
    if (commandeMaj.acheteur_id) {
      await pool.query(
        `INSERT INTO notifications (titre, message, type, cible, mode, nb_destinataires, cree_le)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          `📦 Mise à jour de livraison - Commande #${commandeMaj.commande_id || commandeMaj.id}`,
          `Votre commande a été expédiée${transporteur ? ` via ${transporteur}` : ''}. Numéro de suivi: ${numero_suivi || 'Non disponible'}`,
          'info',
          'acheteurs',
          'individuel',
          1
        ]
      );
    }

    // Log dans audit_logs
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau, date)
       VALUES ($1, $2, $3::jsonb, $4, NOW())`,
      ['COMMANDE_SUIVI_MIS_A_JOUR', req.user.email || 'vendeur',
       JSON.stringify({ 
         commande_id: commandeId,
         numero_suivi,
         transporteur,
         ancien_statut: commande.etape_livraison,
         nouveau_statut: commandeMaj.etape_livraison
       }),
       'info']
    );

    res.json({
      success: true,
      message: 'Suivi de commande mis à jour',
      commande: commandeMaj
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour suivi:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Récupérer les infos de suivi d'une commande
router.get('/commandes/:commandeId/suivi', authenticate, async (req, res) => {
  const { commandeId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT id, commande_id, numero_suivi, transporteur, url_suivi, 
              etape_livraison, date_expedition, date_livraison_prevue
       FROM commandes 
       WHERE id = $1`,
      [commandeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur récupération suivi:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

module.exports = router;