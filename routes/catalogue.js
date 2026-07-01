// routes/catalogue.js
// Pages publiques — catalogue + page produit e-Vend
// Images servies depuis S3. Tri et filtres supportés.

const express = require('express');
const router = express.Router();
const pool = require('../db');

// ─── GET /api/catalogue ────────────────────────────────────────────────────
// Query params: ?categorie_id=X&vendeur_id=X&q=recherche&page=1&limit=24
// Note: le tri est appliqué côté client dans PageCatalogue.tsx
// Le backend trie toujours par created_at DESC (le plus récent en premier)

router.get('/', async (req, res) => {
  const { categorie_id, vendeur_id, q, page = 1, limit = 100 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let conditions = ["p.statut = 'actif'", "p.boutique_en_ligne = true"];
    let params = [];
    let idx = 1;

    if (categorie_id) {
      conditions.push(`(EXISTS (SELECT 1 FROM produit_categories pc WHERE pc.produit_id = p.id AND pc.categorie_id = $${idx}) OR p.categorie_id = $${idx})`);
      params.push(parseInt(categorie_id));
      idx++;
    }
    if (vendeur_id) {
      conditions.push(`p.vendeur_id = $${idx++}`);
      params.push(parseInt(vendeur_id));
    }
    if (q) {
      conditions.push(`(p.nom ILIKE $${idx} OR p.description ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const countRes = await pool.query(`SELECT COUNT(*) FROM produits p ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const produitsRes = await pool.query(
      `SELECT p.id, p.nom, p.prix, p.prix_original, p.image, p.images,
        p.stock, p.statut, p.type_vente, p.type_annonce, p.etat,
        p.marque, p.modele, p.ville, p.vendeur_id, p.categorie_id,
        p.vues, p.facturation_taxes,
        COALESCE(NULLIF(v.nom_boutique, ''), v.nom) AS nom_boutique,
        v.ville AS vendeur_ville,
        c.nom AS categorie_nom,
        (SELECT e.statut FROM encheres e WHERE e.produit_id = p.id AND e.statut IN ('en_cours','a_venir') ORDER BY e.created_at DESC LIMIT 1) AS enchere_statut,
        (SELECT COALESCE((SELECT MAX(m.montant) FROM mises m WHERE m.enchere_id = e2.id), e2.prix_base) FROM encheres e2 WHERE e2.produit_id = p.id AND e2.statut IN ('en_cours','a_venir') ORDER BY e2.created_at DESC LIMIT 1) AS enchere_mise,
        (SELECT e3.prix_base FROM encheres e3 WHERE e3.produit_id = p.id AND e3.statut IN ('en_cours','a_venir') ORDER BY e3.created_at DESC LIMIT 1) AS enchere_prix_base
       FROM produits p
       LEFT JOIN vendeurs v ON v.id = p.vendeur_id
       LEFT JOIN categories c ON c.id = p.categorie_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, parseInt(limit), offset]
    );

    const categoriesRes = await pool.query(
      `SELECT c.id, c.nom, c.description, COUNT(DISTINCT p.id) AS nb_produits
       FROM categories c
       JOIN (
         SELECT pc.categorie_id, pc.produit_id FROM produit_categories pc
         JOIN produits p ON p.id = pc.produit_id
         WHERE p.statut = 'actif' AND p.boutique_en_ligne = true
         UNION
         SELECT p.categorie_id, p.id FROM produits p
         WHERE p.statut = 'actif' AND p.boutique_en_ligne = true AND p.categorie_id IS NOT NULL
       ) AS lien ON lien.categorie_id = c.id
       JOIN produits p ON p.id = lien.produit_id
       GROUP BY c.id, c.nom, c.description
       ORDER BY nb_produits DESC`
    );

    res.json({
      produits: produitsRes.rows,
      categories: categoriesRes.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error('GET /catalogue:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/catalogue/produit/:id ───────────────────────────────────────
router.get('/produit/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`UPDATE produits SET vues = COALESCE(vues, 0) + 1 WHERE id = $1`, [id]);

    const produitRes = await pool.query(
      `SELECT p.*,
        COALESCE(NULLIF(v.nom_boutique, ''), v.nom) AS nom_boutique,
        v.nom AS vendeur_nom,
        v.ville AS vendeur_ville,
        v.description AS vendeur_description,
        c.nom AS categorie_nom
       FROM produits p
       LEFT JOIN vendeurs v ON v.id = p.vendeur_id
       LEFT JOIN categories c ON c.id = p.categorie_id
       WHERE p.id = $1`,
      [id]
    );

    if (produitRes.rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    const produit = produitRes.rows[0];

    const [categoriesRes, variantesRes, similairesRes, avisProduitsRes] = await Promise.all([
      pool.query(
        `SELECT c.id, c.nom FROM categories c
         JOIN produit_categories pc ON pc.categorie_id = c.id
         WHERE pc.produit_id = $1`, [id]
      ).catch(() => ({ rows: [] })),

      pool.query(
        `SELECT * FROM produits_variantes WHERE produit_id = $1 ORDER BY position, id`, [id]
      ).catch(() => ({ rows: [] })),

      pool.query(
        `SELECT p.id, p.nom, p.prix, p.prix_original, p.image,
                COALESCE(NULLIF(v.nom_boutique, ''), v.nom) AS nom_boutique
         FROM produits p
         LEFT JOIN vendeurs v ON v.id = p.vendeur_id
         WHERE p.id != $1 AND p.statut = 'actif'
           AND (p.categorie_id = $2
             OR EXISTS (
               SELECT 1 FROM produit_categories pc
               JOIN produit_categories pc2 ON pc2.categorie_id = pc.categorie_id
               WHERE pc2.produit_id = $1 AND pc.produit_id = p.id
             ))
         ORDER BY RANDOM() LIMIT 6`,
        [id, produit.categorie_id]
      ).catch(() => ({ rows: [] })),

      // ✅ CORRECTION : Utiliser la table avis_produits au lieu de avis
      pool.query(
        `SELECT 
           ap.note,
           ap.commentaire,
           ap.date_avis AS created_at,
           COALESCE(a.prenom, 'Acheteur') AS prenom,
           a.nom
         FROM avis_produits ap
         LEFT JOIN acheteurs a ON a.id = ap.acheteur_id
         WHERE ap.produit_id = $1
           AND ap.statut = 'publie'
         ORDER BY ap.date_avis DESC
         LIMIT 20`,
        [id]
      ).catch(() => ({ rows: [] }))
    ]);

    res.json({
      produit,
      categories: categoriesRes.rows,
      variantes: variantesRes.rows,
      similaires: similairesRes.rows,
      avis: avisProduitsRes.rows
    });
  } catch (err) {
    console.error('GET /catalogue/produit/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;