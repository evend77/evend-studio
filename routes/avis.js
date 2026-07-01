// routes/avis.js
// Gestion des avis clients — vendeur
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isVendeur } = require('../middleware/auth');

// ── GET /api/avis/vendeur ─────────────────────────────────────────────────
// Retourne tous les avis reçus pour les produits du vendeur connecté
router.get('/vendeur', authenticateToken, isVendeur, async (req, res) => {
  try {
    const vendeurId = req.user.id;

    const result = await db.query(`
      SELECT
        a.id,
        a.produit_id,
        a.acheteur_id,
        a.note_globale AS note,
        a.commentaire,
        a.reponse_vendeur,
        a.date_reponse,
        a.created_at,
        p.nom AS produit_nom,
        ac.prenom,
        ac.nom,
        ac.email AS acheteur_email,
        c.id AS commande_id
      FROM avis a
      LEFT JOIN produits p ON p.id = a.produit_id
      LEFT JOIN acheteurs ac ON ac.id = a.acheteur_id
      LEFT JOIN commandes c ON c.id = a.commande_id
      WHERE p.vendeur_id = $1
      ORDER BY a.created_at DESC
    `, [vendeurId]);

    res.json({ success: true, avis: result.rows });
  } catch (error) {
    console.error('GET /avis/vendeur:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/avis/produit/:produit_id ─────────────────────────────────────
// Retourne les avis publics d'un produit (déjà géré dans catalogue.js)
// Gardé ici comme endpoint alternatif
router.get('/produit/:produit_id', async (req, res) => {
  try {
    // Cherche par produit_id si la colonne existe, sinon par vendeur du produit
    const result = await db.query(`
      SELECT
        a.id, a.note_globale AS note, a.commentaire, a.reponse_vendeur, a.created_at,
        a.nom_visiteur, ac.prenom, ac.nom
      FROM avis a
      LEFT JOIN acheteurs ac ON ac.id = a.acheteur_id
      LEFT JOIN produits p ON p.vendeur_id = a.vendeur_id
      WHERE p.id = $1
      GROUP BY a.id, ac.prenom, ac.nom
      ORDER BY a.created_at DESC
      LIMIT 50
    `, [req.params.produit_id]);

    res.json({ success: true, avis: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/avis/:id/reponse ────────────────────────────────────────────
// Vendeur répond à un avis
router.post('/:id/reponse', authenticateToken, isVendeur, async (req, res) => {
  try {
    const { reponse } = req.body;
    const avisId = parseInt(req.params.id);
    const vendeurId = req.user.id;

    if (!reponse?.trim()) {
      return res.status(400).json({ success: false, message: 'Réponse vide' });
    }

    // Vérifier que l'avis appartient bien à un produit du vendeur
    const check = await db.query(`
      SELECT a.id FROM avis a
      WHERE a.id = $1 AND a.vendeur_id = $2
    `, [avisId, vendeurId]);

    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    await db.query(`
      UPDATE avis
      SET reponse_vendeur = $1, date_reponse = NOW()
      WHERE id = $2
    `, [reponse.trim(), avisId]);

    res.json({ success: true, message: 'Réponse publiée' });
  } catch (error) {
    console.error('POST /avis/:id/reponse:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/avis ─────────────────────────────────────────────────────────
// Acheteur laisse un avis (après achat)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { produit_id, note, commentaire, commande_id } = req.body;
    const acheteurId = req.user.id;

    if (!produit_id || !note || note < 1 || note > 5) {
      return res.status(400).json({ success: false, message: 'Note invalide (1-5 requis)' });
    }

    // Vérifier qu'il n'a pas déjà laissé un avis pour ce produit
    const existant = await db.query(
      'SELECT id FROM avis WHERE vendeur_id = $1 AND acheteur_id = $2 LIMIT 1',
      [req.body.vendeur_id || null, acheteurId]
    );
    if (existant.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Vous avez déjà laissé un avis pour ce produit.' });
    }

    const result = await db.query(`
      INSERT INTO avis (vendeur_id, acheteur_id, note_globale, commentaire, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [req.body.vendeur_id || null, acheteurId, note, commentaire || null]);

    res.status(201).json({ success: true, avis_id: result.rows[0].id });
  } catch (error) {
    console.error('POST /avis:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;