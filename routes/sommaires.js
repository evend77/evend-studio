// routes/sommaires.js - À CRÉER
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Route pour le sommaire vendeur
router.get('/vendeurs/:id/sommaire/:annee/:mois', authenticateToken, async (req, res) => {
  try {
    const vendeurId = parseInt(req.params.id);
    const annee = parseInt(req.params.annee);
    const mois = parseInt(req.params.mois);
    
    // Ta fonction de calcul ici
    // ...
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
