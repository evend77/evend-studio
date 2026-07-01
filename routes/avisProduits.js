// routes/avisProduits.js
// Gestion des avis sur les PRODUITS (acheteur → produit)

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAcheteur, isVendeur } = require('../middleware/auth');
const { deleteAllPhotosFromAvis } = require('./uploadAvis');

// ─────────────────────────────────────────────────────────────
// 1. Récupérer les produits "À évaluer" pour l'acheteur connecté
// ─────────────────────────────────────────────────────────────
router.get('/a-evaluer', authenticateToken, isAcheteur, async (req, res) => {
  try {
    const acheteurId = req.user.id;

    const result = await db.query(`
      SELECT DISTINCT
        p.id AS produit_id,
        p.nom AS produit_nom,
        p.prix,
        CASE 
          WHEN p.images IS NOT NULL AND p.images != '' 
          THEN (p.images::jsonb)->>0 
          ELSE NULL 
        END AS image,
        c.id AS commande_id,
        c.date_commande AS date_achat,
        v.id AS vendeur_id,
        v.nom_boutique AS vendeur_nom
      FROM commandes c
      CROSS JOIN LATERAL jsonb_array_elements(c.articles) AS article
      JOIN produits p ON p.id = (article->'id')::integer
      JOIN vendeurs v ON v.id = c.vendeur_id
      WHERE c.acheteur_id = $1
        AND c.statut_livraison = 'livree'
        AND c.statut_commande NOT IN ('Cancelled')
        AND NOT EXISTS (
          SELECT 1 FROM avis_produits ap
          WHERE ap.acheteur_id = $1
            AND ap.produit_id = p.id
            AND ap.commande_id = c.id
        )
      ORDER BY c.date_commande DESC
    `, [acheteurId]);

    res.json({ success: true, produits: result.rows });
  } catch (error) {
    console.error('GET /avis-produits/a-evaluer:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. Récupérer les avis DÉJÀ publiés par l'acheteur
// ─────────────────────────────────────────────────────────────
router.get('/mes-avis', authenticateToken, isAcheteur, async (req, res) => {
  try {
    const acheteurId = req.user.id;

    const result = await db.query(`
      SELECT
        ap.id,
        ap.produit_id,
        ap.commande_id,
        ap.note,
        ap.commentaire,
        ap.photos,
        ap.date_avis,
        ap.date_modification,
        ap.reponse_vendeur,
        ap.date_reponse_vendeur,
        p.nom AS produit_nom,
        p.prix AS produit_prix,
        CASE 
          WHEN p.images IS NOT NULL AND p.images != '' 
          THEN (p.images::jsonb)->>0 
          ELSE NULL 
        END AS produit_image,
        v.nom_boutique AS vendeur_nom,
        v.id AS vendeur_id,
        c.date_commande AS date_achat
      FROM avis_produits ap
      JOIN produits p ON p.id = ap.produit_id
      JOIN vendeurs v ON v.id = ap.vendeur_id
      JOIN commandes c ON c.id = ap.commande_id
      WHERE ap.acheteur_id = $1
        AND ap.statut = 'publie'
      ORDER BY ap.date_avis DESC
    `, [acheteurId]);

    res.json({ success: true, avis: result.rows });
  } catch (error) {
    console.error('GET /avis-produits/mes-avis:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. Créer un nouvel avis
// ─────────────────────────────────────────────────────────────
router.post('/', authenticateToken, isAcheteur, async (req, res) => {
  try {
    const { produit_id, commande_id, note, commentaire, photos } = req.body;
    const acheteurId = req.user.id;

    // Validation
    if (!produit_id || !commande_id || !note || note < 1 || note > 5) {
      return res.status(400).json({ success: false, message: 'Note invalide (1-5 requis)' });
    }
    if (!commentaire || commentaire.length < 5 || commentaire.length > 1000) {
      return res.status(400).json({ success: false, message: 'Commentaire entre 5 et 1000 caractères' });
    }
    if (photos && photos.length > 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 photos' });
    }

    // Vérifier que l'acheteur a bien acheté ce produit dans cette commande
    const verif = await db.query(`
      SELECT c.vendeur_id, c.acheteur_id
      FROM commandes c
      CROSS JOIN LATERAL jsonb_array_elements(c.articles) AS article
      WHERE c.id = $1
        AND c.acheteur_id = $2
        AND (article->>'id')::BIGINT = $3
        AND c.statut_livraison = 'livree'
        AND c.statut_commande NOT IN ('Cancelled')
      LIMIT 1
    `, [commande_id, acheteurId, produit_id]);

    if (verif.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez pas évaluer ce produit' });
    }

    const vendeurId = verif.rows[0].vendeur_id;

    // Vérifier qu'un avis n'existe pas déjà
    const existant = await db.query(
      `SELECT id FROM avis_produits 
       WHERE acheteur_id = $1 AND produit_id = $2 AND commande_id = $3`,
      [acheteurId, produit_id, commande_id]
    );

    if (existant.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Vous avez déjà laissé un avis pour ce produit' });
    }

    // Insertion
    const result = await db.query(`
      INSERT INTO avis_produits (produit_id, acheteur_id, vendeur_id, commande_id, note, commentaire, photos, date_avis)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [produit_id, acheteurId, vendeurId, commande_id, note, commentaire, photos || []]);

    res.status(201).json({ success: true, avis_id: result.rows[0].id });
  } catch (error) {
    console.error('POST /avis-produits:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. Modifier un avis existant
// ─────────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, isAcheteur, async (req, res) => {
  try {
    const avisId = parseInt(req.params.id);
    const { note, commentaire, photos } = req.body;
    const acheteurId = req.user.id;

    // Vérifier que l'avis appartient à l'acheteur
    const check = await db.query(
      `SELECT id FROM avis_produits WHERE id = $1 AND acheteur_id = $2 AND statut = 'publie'`,
      [avisId, acheteurId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Avis non trouvé ou non autorisé' });
    }

    await db.query(`
      UPDATE avis_produits
      SET note = $1, commentaire = $2, photos = $3, date_modification = NOW()
      WHERE id = $4
    `, [note, commentaire, photos || [], avisId]);

    res.json({ success: true, message: 'Avis modifié' });
  } catch (error) {
    console.error('PUT /avis-produits/:id:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. Supprimer un avis (soft delete + suppression photos S3)
// ─────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, isAcheteur, async (req, res) => {
  try {
    const avisId = parseInt(req.params.id);
    const acheteurId = req.user.id;

    // Vérifier que l'avis appartient à l'acheteur et récupérer les photos
    const check = await db.query(
      `SELECT id, photos FROM avis_produits WHERE id = $1 AND acheteur_id = $2 AND statut = 'publie'`,
      [avisId, acheteurId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Avis non trouvé ou non autorisé' });
    }

    const photos = check.rows[0].photos || [];

    // Supprimer les photos de S3 si elles existent
    if (photos.length > 0) {
      console.log(`🗑️ Suppression de ${photos.length} photo(s) pour l'avis ${avisId}`);
      await deleteAllPhotosFromAvis(db, avisId);
    }

    // Soft delete dans la BD (on vide aussi le tableau photos)
    await db.query(
      `UPDATE avis_produits SET statut = 'supprime', photos = '{}', date_modification = NOW() WHERE id = $1`,
      [avisId]
    );

    res.json({ success: true, message: 'Avis et photos supprimés avec succès' });
  } catch (error) {
    console.error('DELETE /avis-produits/:id:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. Le vendeur répond à un avis produit
// ─────────────────────────────────────────────────────────────
router.post('/:id/reponse', authenticateToken, isVendeur, async (req, res) => {
  try {
    const avisId = parseInt(req.params.id);
    const { reponse } = req.body;
    const vendeurId = req.user.id;

    if (!reponse?.trim() || reponse.length > 1000) {
      return res.status(400).json({ success: false, message: 'Réponse invalide (max 1000 caractères)' });
    }

    // Vérifier que l'avis appartient à un produit de ce vendeur
    const check = await db.query(`
      SELECT ap.id FROM avis_produits ap
      WHERE ap.id = $1 AND ap.vendeur_id = $2 AND ap.statut = 'publie'
    `, [avisId, vendeurId]);

    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await db.query(`
      UPDATE avis_produits
      SET reponse_vendeur = $1, date_reponse_vendeur = NOW()
      WHERE id = $2
    `, [reponse.trim(), avisId]);

    res.json({ success: true, message: 'Réponse publiée' });
  } catch (error) {
    console.error('POST /avis-produits/:id/reponse:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6.1. VENDEUR - Modifier sa réponse à un avis produit
// ─────────────────────────────────────────────────────────────
router.put('/:id/reponse', authenticateToken, isVendeur, async (req, res) => {
  try {
    const avisId = parseInt(req.params.id);
    const { reponse } = req.body;
    const vendeurId = req.user.id;

    if (!reponse?.trim() || reponse.length > 1000) {
      return res.status(400).json({ success: false, message: 'Réponse invalide (max 1000 caractères)' });
    }

    // Vérifier que l'avis appartient à un produit de ce vendeur ET qu'une réponse existe déjà
    const check = await db.query(`
      SELECT ap.id FROM avis_produits ap
      WHERE ap.id = $1 
        AND ap.vendeur_id = $2 
        AND ap.statut = 'publie'
        AND ap.reponse_vendeur IS NOT NULL
    `, [avisId, vendeurId]);

    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Non autorisé ou aucune réponse existante' });
    }

    await db.query(`
      UPDATE avis_produits
      SET reponse_vendeur = $1, date_reponse_vendeur = NOW()
      WHERE id = $2
    `, [reponse.trim(), avisId]);

    res.json({ success: true, message: 'Réponse modifiée avec succès' });
  } catch (error) {
    console.error('PUT /avis-produits/:id/reponse:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. VENDEUR - Récupérer les avis sur SES produits (AVEC IMAGE PRODUIT)
// ─────────────────────────────────────────────────────────────
router.get('/vendeur/produits', authenticateToken, isVendeur, async (req, res) => {
  try {
    const vendeurId = req.user.id;

    const result = await db.query(`
      SELECT
        ap.id,
        ap.produit_id,
        ap.note,
        ap.commentaire,
        ap.photos,
        ap.date_avis,
        ap.date_modification,
        ap.reponse_vendeur,
        ap.date_reponse_vendeur,
        a.id AS acheteur_id,
        a.prenom,
        a.nom,
        a.email AS acheteur_email,
        p.nom AS produit_nom,
        p.prix AS produit_prix,
        CASE 
          WHEN p.images IS NOT NULL AND p.images != '' 
          THEN (p.images::jsonb)->>0 
          ELSE NULL 
        END AS produit_image,
        c.id AS commande_id,
        c.date_commande AS date_achat
      FROM avis_produits ap
      JOIN produits p ON p.id = ap.produit_id
      JOIN acheteurs a ON a.id = ap.acheteur_id
      JOIN commandes c ON c.id = ap.commande_id
      WHERE ap.vendeur_id = $1
        AND ap.statut = 'publie'
      ORDER BY ap.date_avis DESC
    `, [vendeurId]);

    res.json({ success: true, avis: result.rows });
  } catch (error) {
    console.error('GET /avis-produits/vendeur/produits:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;