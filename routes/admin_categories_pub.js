// routes/admin_categories_pub.js
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

function genererCle(label) {
  return label.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'categorie';
}

// GET — Toutes les catégories (actives ET inactives, pour la gestion admin)
router.get('/', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories_pub ORDER BY ordre');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('❌ Erreur liste catégories pub:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// GET — Catégories actives seulement (pour le formulaire de création de pub, côté sponsor)
router.get('/actives', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT cle, label, emoji FROM categories_pub WHERE actif = true ORDER BY ordre');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('❌ Erreur liste catégories actives:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// POST — Créer une nouvelle catégorie
router.post('/', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { label, emoji, ordre } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }
    let cle = genererCle(label);
    let i = 1;
    while ((await pool.query('SELECT id FROM categories_pub WHERE cle = $1', [cle])).rows.length > 0) {
      i++;
      cle = `${genererCle(label)}_${i}`;
    }
    const maxOrdre = await pool.query('SELECT COALESCE(MAX(ordre), 0) as max FROM categories_pub');
    const result = await pool.query(
      `INSERT INTO categories_pub (cle, label, emoji, ordre) VALUES ($1, $2, $3, $4) RETURNING *`,
      [cle, label.trim(), emoji || '🌍', ordre ?? (parseInt(maxOrdre.rows[0].max) + 1)]
    );
    res.status(201).json({ success: true, categorie: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création catégorie pub:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
  }
});

// PUT — Modifier une catégorie (label/emoji/ordre/actif) — la clé ne change jamais
router.put('/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, emoji, ordre, actif } = req.body;
    const result = await pool.query(
      `UPDATE categories_pub SET
        label = COALESCE($1, label),
        emoji = COALESCE($2, emoji),
        ordre = COALESCE($3, ordre),
        actif = COALESCE($4, actif)
       WHERE id = $5 RETURNING *`,
      [label, emoji, ordre, actif, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json({ success: true, categorie: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur modification catégorie pub:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la catégorie' });
  }
});

// DELETE — Supprimer une catégorie
// Sans danger pour les pubs existantes : `categories` sur sponsor_pubs est juste un
// tableau de texte libre, pas une contrainte de clé étrangère — une pub qui ciblait
// cette catégorie continue de fonctionner, elle disparaît juste des choix futurs.
router.delete('/:id', authenticateToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories_pub WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur suppression catégorie pub:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

module.exports = router;