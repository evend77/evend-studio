// routes/produits_main.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/produits - Liste paginée des produits
router.get('/', async (req, res) => {
  // Forcer l'encodage UTF-8 pour les caractères spéciaux
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  console.log('📦 Route produits principale appelée');
  
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const recherche = req.query.recherche || '';
    const statut = req.query.statut || 'tous';
    const typeVente = req.query.typeVente || 'tous';
    const tri = req.query.tri || 'productId-asc';

    // 1. Vérifier la structure de la table produits
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'produits'
      ORDER BY ordinal_position
    `);
    
    const colonnes = tableInfo.rows.map(row => row.column_name);
    console.log('📊 Colonnes disponibles dans produits:', colonnes);

    // 2. Déterminer les noms de colonnes corrects
    const mapping = {
      productId: trouverColonne(colonnes, ['product_id', 'productid', 'productId', 'id_produit', 'produit_id']),
      type: trouverColonne(colonnes, ['type', 'type_produit', 'categorie_type', 'type_article']),
      categorieId: trouverColonne(colonnes, ['categorie_id', 'category_id', 'categorie', 'category']),
      vendeurId: trouverColonne(colonnes, ['vendeur_id', 'vendeurid', 'seller_id']),
      prix: trouverColonne(colonnes, ['prix', 'price']),
      quantite: trouverColonne(colonnes, ['quantite', 'quantity', 'stock']),
      dateAjout: trouverColonne(colonnes, ['date_ajout', 'dateajout', 'created_at', 'date_creation']),
      totalVentes: trouverColonne(colonnes, ['total_ventes', 'totalventes', 'sales_count']),
      note: trouverColonne(colonnes, ['note', 'rating', 'average_rating']),
      description: trouverColonne(colonnes, ['description', 'descriptions']),
      image: trouverColonne(colonnes, ['image', 'images', 'photo', 'url_image', 'shopify_image_url', 'image_url'])
    };

    console.log('🔍 Mapping colonnes:', mapping);

    // 3. Construire la requête avec les bons noms de colonnes
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (recherche) {
      const searchFields = [];
      if (colonnes.includes('nom')) searchFields.push(`p.nom ILIKE $${paramIndex}`);
      if (mapping.productId) searchFields.push(`p.${mapping.productId}::text ILIKE $${paramIndex}`);
      if (colonnes.includes('sku')) searchFields.push(`p.sku ILIKE $${paramIndex}`);
      if (colonnes.includes('description')) searchFields.push(`p.description ILIKE $${paramIndex}`);
      
      if (searchFields.length > 0) {
        whereConditions.push(`(${searchFields.join(' OR ')})`);
        params.push(`%${recherche}%`);
        paramIndex++;
      }
    }

    if (statut !== 'tous' && colonnes.includes('statut')) {
      whereConditions.push(`p.statut = $${paramIndex}`);
      params.push(statut);
      paramIndex++;
    }

    if (typeVente !== 'tous' && colonnes.includes('type_vente')) {
      whereConditions.push(`p.type_vente = $${paramIndex}`);
      params.push(typeVente);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // 4. Compter le total
    const countQuery = `
      SELECT COUNT(*) 
      FROM produits p
      LEFT JOIN vendeurs v ON p.${mapping.vendeurId || 'vendeur_id'} = v.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // 5. Construire la clause ORDER BY
    let orderBy = 'p.id DESC';
    switch(tri) {
      case 'productId-asc':
        if (mapping.productId) orderBy = `p.${mapping.productId} ASC`;
        break;
      case 'nom-asc':
        if (colonnes.includes('nom')) orderBy = 'p.nom ASC';
        break;
      case 'vendeur-asc':
        orderBy = 'v.nom ASC';
        break;
      case 'prix-asc':
        if (mapping.prix) orderBy = `p.${mapping.prix}::numeric ASC`;
        break;
      case 'prix-desc':
        if (mapping.prix) orderBy = `p.${mapping.prix}::numeric DESC`;
        break;
      case 'quantite-asc':
        if (mapping.quantite) orderBy = `p.${mapping.quantite}::numeric ASC`;
        break;
      case 'quantite-desc':
        if (mapping.quantite) orderBy = `p.${mapping.quantite}::numeric DESC`;
        break;
      case 'date-desc':
        if (mapping.dateAjout) orderBy = `p.${mapping.dateAjout} DESC`;
        break;
    }

    // 6. Construire la requête SELECT avec jointure à la table categories
    const selectFields = [
      'p.id',
      mapping.productId ? `p.${mapping.productId} as "productId"` : 'p.id::text as "productId"',
      colonnes.includes('sku') ? 'p.sku' : 'NULL as sku',
      colonnes.includes('nom') ? 'p.nom' : 'p.id::text as nom',
      mapping.type ? `p.${mapping.type} as type` : 'NULL as type',
      'v.nom as "vendeurNom"',
      mapping.vendeurId ? `p.${mapping.vendeurId} as "vendeurId"` : 'NULL as "vendeurId"',
      // ✅ Prendre le nom de la catégorie au lieu de l'ID
      'c.nom as categorie',
      mapping.prix ? `CAST(p.${mapping.prix} AS FLOAT) as prix` : '0 as prix',
      mapping.quantite ? `CAST(p.${mapping.quantite} AS INTEGER) as quantite` : '0 as quantite',
      colonnes.includes('type_vente') ? 'p.type_vente as "typeVente"' : '\'standard\' as "typeVente"',
      colonnes.includes('statut') ? 'p.statut' : '\'actif\' as statut',
      mapping.dateAjout ? `p.${mapping.dateAjout} as "dateAjout"` : 'CURRENT_TIMESTAMP as "dateAjout"',
      mapping.totalVentes ? `COALESCE(CAST(p.${mapping.totalVentes} AS INTEGER), 0) as "totalVentes"` : '0 as "totalVentes"',
      mapping.note ? `CAST(p.${mapping.note} AS FLOAT) as note` : 'NULL as note',
      mapping.description ? `p.${mapping.description} as description` : 'NULL as description',
      mapping.image ? `p.${mapping.image} as image` : 'NULL as image',
      '\'[]\'::json as notes'
    ];

    // Ajouter les paramètres de pagination
    const queryParams = [...params, limit, offset];

    // ✅ Requête avec jointure à la table categories
    const produitsQuery = `
      SELECT 
        ${selectFields.join(', ')}
      FROM produits p
      LEFT JOIN vendeurs v ON p.${mapping.vendeurId || 'vendeur_id'} = v.id
      LEFT JOIN categories c ON p.${mapping.categorieId || 'categorie_id'} = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    console.log('📝 Requête SQL:', produitsQuery);
    const produitsResult = await pool.query(produitsQuery, queryParams);

    console.log(`✅ ${produitsResult.rows.length} produits retournés (total: ${total})`);
    
    // Vérifier les catégories
    if (produitsResult.rows.length > 0) {
      const avecCategories = produitsResult.rows.filter(p => p.categorie).length;
      console.log(`📊 Produits avec catégories: ${avecCategories}/${produitsResult.rows.length}`);
      if (produitsResult.rows[0].categorie) {
        console.log('🔍 Exemple catégorie:', produitsResult.rows[0].categorie);
      }
      
      const avecImages = produitsResult.rows.filter(p => p.image).length;
      console.log(`🖼️ Produits avec images: ${avecImages}/${produitsResult.rows.length}`);
    }

    res.json({
      produits: produitsResult.rows,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) { 
    console.error('❌ Erreur produits:', err);
    res.status(500).json({ error: err.message }); 
  }
});

// Fonction utilitaire pour trouver une colonne
function trouverColonne(colonnes, possibilites) {
  for (const possibilite of possibilites) {
    if (colonnes.includes(possibilite)) {
      return possibilite;
    }
  }
  return null;
}

module.exports = router;