// routes/notes_admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer les notes d'un produit
router.get('/produit/:produitId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        produit_id as "produitId",
        admin_nom as "auteur",
        contenu,
        to_char(date_creation, 'DD Mon YYYY HH24:MI') as "date"
      FROM notes_produits_admin
      WHERE produit_id = $1
      ORDER BY date_creation DESC
    `, [req.params.produitId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur chargement notes:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ajouter une note
router.post('/', async (req, res) => {
  try {
    const { produitId, contenu, auteur } = req.body;
    
    const result = await pool.query(`
      INSERT INTO notes_produits_admin (produit_id, admin_nom, contenu)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        produit_id as "produitId",
        admin_nom as "auteur",
        contenu,
        to_char(date_creation, 'DD Mon YYYY HH24:MI') as "date"
    `, [produitId, auteur, contenu]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur ajout note:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;