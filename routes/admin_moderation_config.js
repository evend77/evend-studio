// routes/admin_moderation_config.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const verifierAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// GET — État actuel du toggle + seuils
router.get('/', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM configuration_moderation WHERE id = 1');
    res.json(result.rows[0] || { verification_ai_active: false });
  } catch (error) {
    console.error('❌ Erreur config modération:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
  }
});

// PUT — Activer/désactiver le toggle (et ajuster les seuils si fournis)
router.put('/', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { verification_ai_active, seuil_sexuel, seuil_violence, seuil_automutilation } = req.body;
    const result = await pool.query(
      `UPDATE configuration_moderation SET
        verification_ai_active = COALESCE($1, verification_ai_active),
        seuil_sexuel = COALESCE($2, seuil_sexuel),
        seuil_violence = COALESCE($3, seuil_violence),
        seuil_automutilation = COALESCE($4, seuil_automutilation),
        updated_at = NOW()
       WHERE id = 1 RETURNING *`,
      [verification_ai_active, seuil_sexuel, seuil_violence, seuil_automutilation]
    );
    res.json({ success: true, config: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur modification config modération:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la configuration' });
  }
});

module.exports = router;