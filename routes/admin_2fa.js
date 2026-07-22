// routes/admin_2fa.js
// GET /api/admin/config/2fa — lire l'état F2A du compte admin connecté
// PUT /api/admin/config/2fa — activer/désactiver, body : { enabled: boolean }
//
// Utilise req.user.id (le token) — pas de :id dans l'URL, chaque admin ne
// gère que son propre compte ici (contrairement à admin_gestionnaires_statut.js
// qui laisse un admin activer la F2A d'un GESTIONNAIRE).

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const bcrypt  = require('bcrypt');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT two_factor_enabled FROM admins WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compte introuvable.' });
    res.json({ two_factor_enabled: !!result.rows[0].two_factor_enabled });
  } catch (err) {
    console.error('GET /admin/config/2fa :', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await pool.query(
      `UPDATE admins SET two_factor_enabled = $1 WHERE id = $2 RETURNING id`,
      [!!enabled, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Compte introuvable.' });
    res.json({ success: true, two_factor_enabled: !!enabled });
  } catch (err) {
    console.error('PUT /admin/config/2fa :', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/config/2fa/mot-de-passe — changer son propre mot de passe (admin)
// Body : { mot_de_passe_actuel, nouveau_mot_de_passe }
router.put('/mot-de-passe', authenticateToken, isAdmin, async (req, res) => {
  const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;
  if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
    return res.status(400).json({ error: 'Les deux mots de passe sont requis.' });
  }
  if (nouveau_mot_de_passe.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
  }
  try {
    const result = await pool.query(`SELECT mot_de_passe FROM admins WHERE id = $1`, [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Compte introuvable.' });

    const valide = await bcrypt.compare(mot_de_passe_actuel, result.rows[0].mot_de_passe);
    if (!valide) return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 12);
    await pool.query(`UPDATE admins SET mot_de_passe = $1 WHERE id = $2`, [hash, req.user.id]);

    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    console.error('PUT /admin/config/2fa/mot-de-passe :', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;