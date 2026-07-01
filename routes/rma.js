const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// =====================================================================
// CRÉER UNE DEMANDE RMA
// =====================================================================
router.post('/commandes/:id/rma', authenticateToken, async (req, res) => {
  try {
    const commandeId = parseInt(req.params.id);
    const acheteurId = req.user.id;
    const { type_demande, raisons, commentaire, fichiers } = req.body;

    // Vérifier que la commande appartient à l'acheteur
    const commande = await pool.query(
      'SELECT id FROM commandes WHERE id = $1 AND acheteur_id = $2',
      [commandeId, acheteurId]
    );

    if (commande.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Créer la demande RMA
    const result = await pool.query(
      `INSERT INTO demandes_rma 
       (commande_id, acheteur_id, type_demande, raisons, commentaire, statut)
       VALUES ($1, $2, $3, $4, $5, 'en_attente')
       RETURNING id`,
      [commandeId, acheteurId, type_demande, raisons, commentaire]
    );

    const demandeId = result.rows[0].id;

    // Sauvegarder les fichiers si présents
    if (fichiers && fichiers.length > 0) {
      for (const fichier of fichiers) {
        await pool.query(
          `INSERT INTO pieces_jointes_rma (demande_id, nom_fichier, chemin_fichier, type_fichier)
           VALUES ($1, $2, $3, $4)`,
          [demandeId, fichier.nom, fichier.url, fichier.type]
        );
      }
    }

    // Mettre à jour le statut de la commande
    await pool.query(
      `UPDATE commandes SET statut_commande = 'Attente approbation' WHERE id = $1`,
      [commandeId]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau)
       VALUES ($1, $2, $3::jsonb, $4)`,
      ['RMA_CREE', req.user.email, 
       JSON.stringify({ demande_id: demandeId, commande_id: commandeId }), 'info']
    );

    res.json({
      success: true,
      id: demandeId,
      type_demande,
      message: 'Demande créée avec succès'
    });

  } catch (err) {
    console.error('❌ Erreur création RMA:', err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// RÉCUPÉRER LES DEMANDES RMA D'UN ACHETEUR
// =====================================================================
router.get('/acheteurs/:id/rma', authenticateToken, async (req, res) => {
  try {
    const acheteurId = parseInt(req.params.id);

    const result = await pool.query(`
      SELECT 
        r.*,
        c.commande_id,
        c.montant,
        to_char(c.date_commande, 'DD/MM/YYYY') as date_commande,
        (SELECT json_agg(p) FROM pieces_jointes_rma p WHERE p.demande_id = r.id) as pieces_jointes
      FROM demandes_rma r
      JOIN commandes c ON c.id = r.commande_id
      WHERE r.acheteur_id = $1
      ORDER BY r.date_creation DESC
    `, [acheteurId]);

    res.json(result.rows);

  } catch (err) {
    console.error('❌ Erreur chargement RMA:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
