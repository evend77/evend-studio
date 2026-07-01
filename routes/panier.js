// routes/panier.js
// Routes API panier acheteur — e-Vend

const express = require("express");
const router = express.Router();
const pool = require("../db"); // PostgreSQL pool
const { authenticateToken } = require("../middleware/auth");

// ── Toutes les routes nécessitent un acheteur connecté ──

router.use(authenticateToken);

// GET /api/panier — Récupérer le panier de l'acheteur
router.get("/", async (req, res) => {
  const acheteurId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.produit_shopify_id,
        p.variant_id,
        p.titre,
        p.image_url,
        p.prix,
        p.quantite,
        p.vendeur_id,
        COALESCE(v.nom_boutique, v.nom) AS vendeur_nom
       FROM panier p
       JOIN vendeurs v ON v.id = p.vendeur_id
       WHERE p.acheteur_id = $1
       ORDER BY p.created_at ASC`,
      [acheteurId]
    );
    res.json({ articles: result.rows });
  } catch (err) {
    console.error("GET /panier:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/panier — Ajouter un article au panier
router.post("/", async (req, res) => {
  const acheteurId = req.user.id;
  const { produit_id, titre, image_url, prix, quantite } = req.body;

  if (!produit_id || !prix || !quantite) {
    return res.status(400).json({ error: "Champs manquants (produit_id, prix, quantite)" });
  }

  try {
    // Résoudre vendeur_id depuis la BD via l'ID interne du produit
    const produitRes = await pool.query(
      `SELECT id, vendeur_id, nom, image FROM produits WHERE id = $1 AND statut = 'actif'`,
      [parseInt(produit_id)]
    );

    if (produitRes.rows.length === 0) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    const produit = produitRes.rows[0];
    const vendeur_id = produit.vendeur_id;
    const titreFinal = titre || produit.nom;
    const imageFinal = image_url || produit.image || null;

    if (!vendeur_id) {
      return res.status(400).json({ error: "Vendeur introuvable pour ce produit" });
    }

    // Si le produit existe déjà dans le panier → incrémenter la quantité
    const existant = await pool.query(
      `SELECT id, quantite FROM panier 
       WHERE acheteur_id = $1 AND produit_shopify_id = $2`,
      [acheteurId, produit_id.toString()]
    );

    if (existant.rows.length > 0) {
      const nouvelleQte = existant.rows[0].quantite + parseInt(quantite);
      await pool.query(
        `UPDATE panier SET quantite = $1, updated_at = NOW() WHERE id = $2`,
        [nouvelleQte, existant.rows[0].id]
      );
      return res.json({ message: "Quantité mise à jour", id: existant.rows[0].id });
    }

    // Sinon → insérer
    const insert = await pool.query(
      `INSERT INTO panier 
        (acheteur_id, produit_shopify_id, variant_id, titre, image_url, prix, quantite, vendeur_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [acheteurId, produit_id.toString(), null, titreFinal, imageFinal, parseFloat(prix), parseInt(quantite), vendeur_id]
    );
    res.status(201).json({ message: "Article ajouté", id: insert.rows[0].id });
  } catch (err) {
    console.error("POST /panier:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/panier/:id — Modifier la quantité d'un article
router.patch("/:id", async (req, res) => {
  const acheteurId = req.user.id;
  const articleId = parseInt(req.params.id);
  const { quantite } = req.body;

  if (!quantite || quantite < 1) {
    return res.status(400).json({ error: "Quantité invalide" });
  }

  try {
    const result = await pool.query(
      `UPDATE panier SET quantite = $1, updated_at = NOW()
       WHERE id = $2 AND acheteur_id = $3
       RETURNING id`,
      [quantite, articleId, acheteurId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Article introuvable" });
    }
    res.json({ message: "Quantité mise à jour" });
  } catch (err) {
    console.error("PATCH /panier:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/panier/:id — Supprimer un article
router.delete("/:id", async (req, res) => {
  const acheteurId = req.user.id;
  const articleId = parseInt(req.params.id);

  try {
    await pool.query(
      `DELETE FROM panier WHERE id = $1 AND acheteur_id = $2`,
      [articleId, acheteurId]
    );
    res.json({ message: "Article supprimé" });
  } catch (err) {
    console.error("DELETE /panier/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/panier — Vider le panier
router.delete("/", async (req, res) => {
  const acheteurId = req.user.id;
  try {
    await pool.query(`DELETE FROM panier WHERE acheteur_id = $1`, [acheteurId]);
    res.json({ message: "Panier vidé" });
  } catch (err) {
    console.error("DELETE /panier:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── GARDER POUR PLUS TARD ────────────────────────────────────────────────

// GET /api/panier/plus-tard — Articles mis de côté
router.get("/plus-tard", async (req, res) => {
  const acheteurId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT 
        pt.id,
        pt.produit_shopify_id,
        pt.titre,
        pt.image_url,
        pt.prix,
        pt.vendeur_id,
        COALESCE(v.nom_boutique, v.nom) AS vendeur_nom,
        pt.created_at
       FROM panier_plus_tard pt
       JOIN vendeurs v ON v.id = pt.vendeur_id
       WHERE pt.acheteur_id = $1
       ORDER BY pt.created_at DESC`,
      [acheteurId]
    );
    res.json({ articles: result.rows });
  } catch (err) {
    console.error("GET /panier/plus-tard:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/panier/:id/plus-tard — Déplacer du panier vers plus tard
router.post("/:id/plus-tard", async (req, res) => {
  const acheteurId = req.user.id;
  const articleId = parseInt(req.params.id);
  try {
    // Récupérer l'article du panier
    const article = await pool.query(
      `SELECT * FROM panier WHERE id = $1 AND acheteur_id = $2`,
      [articleId, acheteurId]
    );
    if (article.rows.length === 0) {
      return res.status(404).json({ error: "Article introuvable" });
    }
    const a = article.rows[0];

    // Vérifier si déjà dans plus-tard
    const existant = await pool.query(
      `SELECT id FROM panier_plus_tard WHERE acheteur_id = $1 AND produit_shopify_id = $2`,
      [acheteurId, a.produit_shopify_id]
    );

    if (existant.rows.length === 0) {
      await pool.query(
        `INSERT INTO panier_plus_tard (acheteur_id, vendeur_id, produit_shopify_id, titre, image_url, prix)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [acheteurId, a.vendeur_id, a.produit_shopify_id, a.titre, a.image_url, a.prix]
      );
    }

    // Supprimer du panier
    await pool.query(`DELETE FROM panier WHERE id = $1`, [articleId]);

    res.json({ message: "Article mis de côté" });
  } catch (err) {
    console.error("POST /panier/:id/plus-tard:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/panier/plus-tard/:id/remettre — Remettre dans le panier
router.post("/plus-tard/:id/remettre", async (req, res) => {
  const acheteurId = req.user.id;
  const articleId = parseInt(req.params.id);
  try {
    // Récupérer l'article de plus-tard
    const article = await pool.query(
      `SELECT * FROM panier_plus_tard WHERE id = $1 AND acheteur_id = $2`,
      [articleId, acheteurId]
    );
    if (article.rows.length === 0) {
      return res.status(404).json({ error: "Article introuvable" });
    }
    const a = article.rows[0];

    // Vérifier si déjà dans panier
    const existant = await pool.query(
      `SELECT id, quantite FROM panier WHERE acheteur_id = $1 AND produit_shopify_id = $2`,
      [acheteurId, a.produit_shopify_id]
    );

    if (existant.rows.length > 0) {
      // Incrémenter la quantité
      await pool.query(
        `UPDATE panier SET quantite = quantite + 1, updated_at = NOW() WHERE id = $1`,
        [existant.rows[0].id]
      );
    } else {
      // Insérer dans le panier
      await pool.query(
        `INSERT INTO panier (acheteur_id, vendeur_id, produit_shopify_id, titre, image_url, prix, quantite)
         VALUES ($1, $2, $3, $4, $5, $6, 1)`,
        [acheteurId, a.vendeur_id, a.produit_shopify_id, a.titre, a.image_url, a.prix]
      );
    }

    // Supprimer de plus-tard
    await pool.query(`DELETE FROM panier_plus_tard WHERE id = $1`, [articleId]);

    res.json({ message: "Article remis au panier" });
  } catch (err) {
    console.error("POST /panier/plus-tard/:id/remettre:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/panier/plus-tard/:id — Supprimer de plus-tard
router.delete("/plus-tard/:id", async (req, res) => {
  const acheteurId = req.user.id;
  try {
    await pool.query(
      `DELETE FROM panier_plus_tard WHERE id = $1 AND acheteur_id = $2`,
      [parseInt(req.params.id), acheteurId]
    );
    res.json({ message: "Article supprimé" });
  } catch (err) {
    console.error("DELETE /panier/plus-tard/:id:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;