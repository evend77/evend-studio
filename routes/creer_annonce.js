// backend/routes/creer_annonce.js
// Version e-Vend autonome (sans Shopify) — stockage S3, BD PostgreSQL sur Render
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// isVendeur/isAdmin remplacés par isVendeurOuAdmin défini localement
const isVendeur = (req, res, next) => next(); // accepte gestionnaires Studio

// Middleware qui accepte vendeurs ET admins (pour impersonation)
function isVendeurOuAdmin(req, res, next) {
  const role = req.user?.role;
  if (role === 'vendeur' || role === 'admin' || role === 'administration') return next();
  return res.status(403).json({ error: 'Accès refusé' });
}

// Retourne l'id du vendeur cible — si admin en impersonation, utilise vendeur_id du query/body
function getVendeurId(req) {
  const isAdminUser = req.user.role === 'admin' || req.user.role === 'administration';
  const fromQuery = req.query?.vendeur_id ? parseInt(req.query.vendeur_id) : null;
  const fromBody  = req.body?.vendeur_id  ? parseInt(req.body.vendeur_id)  : null;
  if (isAdminUser && (fromQuery || fromBody)) return fromQuery || fromBody;
  return req.user.id;
}

// ===== PARSER CANAUX DE VENTE =====
function parseCanauxVente(canaux) {
  if (!canaux) return { boutique_en_ligne: true, point_de_vente: false };
  if (typeof canaux === 'object' && !Array.isArray(canaux)) {
    return {
      boutique_en_ligne: canaux.boutique_en_ligne === true || canaux.boutique_en_ligne === 'true',
      point_de_vente:    canaux.point_de_vente    === true || canaux.point_de_vente    === 'true'
    };
  }
  if (Array.isArray(canaux)) {
    return {
      boutique_en_ligne: canaux.includes('boutique_en_ligne'),
      point_de_vente:    canaux.includes('point_de_vente')
    };
  }
  return { boutique_en_ligne: true, point_de_vente: false };
}

// GET /config-taxes — Retourne le mode_taxe pour le formulaire vendeur
router.get('/config-taxes', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT mode_taxe, destinataire_taxes FROM configuration_generale_admin LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.json({ mode_taxe: 'libre', destinataire_taxes: 'admin' });
    }
    return res.json({
      mode_taxe:          result.rows[0].mode_taxe          || 'libre',
      destinataire_taxes: result.rows[0].destinataire_taxes || 'admin',
    });
  } catch (err) {
    console.error('[config-taxes]', err.message);
    return res.json({ mode_taxe: 'libre', destinataire_taxes: 'admin' });
  }
});

/**
 * POST /api/creer-annonce
 * Crée une annonce complète — sauvegarde uniquement en BD PostgreSQL.
 * Les images sont déjà hébergées sur S3 (uploadées via /api/upload-image).
 */
router.post('/', authenticateToken, isVendeurOuAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const vendeurId = getVendeurId(req);
    const {
      // ===== INFOS DE BASE =====
      nom,
      description,
      type_produit = 'physique',

      // ===== PRIX =====
      prix,
      prix_original = null,
      prix_revient  = null,

      // ===== STOCK =====
      quantite = 0,
      sku,
      code_barres,
      suivi_inventaire = 'suivre',
      quantite_minimum = 1,

      // ===== DIMENSIONS =====
      poids,
      hauteur  = null,
      largeur  = null,
      longueur = null,

      // ===== MARQUE =====
      marque,
      modele,

      // ===== EXPÉDITION =====
      mode_expedition      = { transporteur: true, ramassage: false },
      expedition_necessaire = true,

      // ===== DÉTAILS ANNONCE =====
      type_annonce    = 'neuf',
      etat_article    = 'neuf',
      retour_offert   = 'non',
      garantie_offerte = 'aucune',

      // ===== CHAMPS SUPPLÉMENTAIRES =====
      pays_fabrication,
      formats,
      adresse_vente,
      lien_youtube,
      ville,
      facturation_taxes = false,

      // ===== CATÉGORIES ET TAGS =====
      categories_selectionnees = [],
      tags_selectionnes        = [],

      // ===== IMAGES (URLs S3 déjà uploadées) =====
      product_images = [],
      product_video  = null,

      // ===== VARIANTES =====
      options  = [],
      variants = [],

      // ===== PRODUIT NUMÉRIQUE =====
      produit_numerique_type   = 'fichier',
      lien_numerique,
      jours_accessibles        = 0,
      nombre_telechargements   = 0,

      // ===== DATE DE PARUTION =====
      type_parution = 'immediate',
      date_parution,

      // ===== STATUT =====
      statut = 'actif',

      // ===== CANAUX DE VENTE =====
      canaux_vente,

      // ===== MAKE OFFER =====
      make_offer_enabled     = false,
      make_offer_prix_min    = null,
      make_offer_auto_accept = false,

      // ===== MÉTHODES D'EXPÉDITION =====
      methodes_expedition_ids = [],  // IDs des vendeur_methodes_expedition sélectionnées

    } = req.body;

    // ===== VALIDATION =====
    const champsManquants = [];
    if (!nom)                                              champsManquants.push('Nom du produit');
    if (!description)                                      champsManquants.push('Description');
    if (!prix)                                             champsManquants.push('Prix de vente');
    if (product_images.length === 0)                       champsManquants.push('Images du produit');
    if (categories_selectionnees.length === 0)             champsManquants.push('Catégories');
    if (type_produit === 'physique' && !poids)             champsManquants.push('Poids');

    if (champsManquants.length > 0 && statut === 'actif') {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants',
        champs_manquants: champsManquants
      });
    }

    if (type_produit === 'numerique' && produit_numerique_type === 'lien' && !lien_numerique) {
      return res.status(400).json({
        success: false,
        message: 'Le lien du produit numérique est requis'
      });
    }


    // ===== VÉRIFICATION LIMITE PRODUITS SIMPLISSE =====
    // Paliers : 25 → 15,99$/m | 50 → 18,99$/m | 100 → 20,99$/m | 200 → 23,99$/m
    try {
      const siteResult = await db.query(
        `SELECT template_id FROM sites WHERE gestionnaire_id = $1 LIMIT 1`,
        [vendeurId]
      );
      const templateId = siteResult.rows[0]?.template_id || '';

      if (templateId.startsWith('boutique-simplisse') && statut !== 'brouillon') {

        // Lire le plan du gestionnaire + limite dans plans_simplisse
        const gestionnaireResult = await db.query(
          `SELECT g.plan, ps.limite_produits, ps.prix_mensuel
           FROM gestionnaires g
           LEFT JOIN plans_simplisse ps ON ps.plan = g.plan
           WHERE g.id = $1 LIMIT 1`,
          [vendeurId]
        );
        const limiteProduits = gestionnaireResult.rows[0]?.limite_produits || 25;

        // Compter les produits actifs du gestionnaire
        const countResult = await db.query(
          `SELECT COUNT(*) as nb FROM produits WHERE gestionnaire_id = $1 AND statut = 'actif'`,
          [vendeurId]
        );
        const nbActifs = parseInt(countResult.rows[0]?.nb || '0');

        // Paliers et tarifs pour le message d'erreur
        const paliers = [
          { limite: 25,  prix: '15,99$' },
          { limite: 50,  prix: '18,99$' },
          { limite: 100, prix: '20,99$' },
          { limite: 200, prix: '23,99$' },
        ];
        const prochainPalier = paliers.find(p => p.limite > limiteProduits);

        if (nbActifs >= limiteProduits) {
          return res.status(403).json({
            success: false,
            code: 'LIMITE_PRODUITS_SIMPLISSE',
            message: `Vous avez atteint la limite de ${limiteProduits} produits actifs de votre plan Simplisse.`,
            nb_produits: nbActifs,
            limite: limiteProduits,
            prochain_palier: prochainPalier || null,
            conseil: prochainPalier
              ? `Passez au palier ${prochainPalier.limite} produits pour seulement ${prochainPalier.prix}/mois.`
              : 'Vous êtes au palier maximum du template Simplisse (200 produits).',
          });
        }
      }
    } catch (limiteErr) {
      // Si la vérification échoue (ex: colonne manquante), on laisse passer — fail open
      console.warn('[limite-simplisse] Vérification ignorée:', limiteErr.message);
    }
    // ===================================================

    await client.query('BEGIN');

    // ===== APPLIQUER LE MODE TAXE ADMIN =====
    let facturation_taxes_finale = facturation_taxes;
    try {
      const configResult = await client.query(
        `SELECT mode_taxe FROM configuration_generale_admin LIMIT 1`
      );
      if (configResult.rows.length > 0) {
        const modeTaxe = configResult.rows[0].mode_taxe;
        if (modeTaxe === 'force_taxable')     facturation_taxes_finale = true;
        else if (modeTaxe === 'force_non_taxable') facturation_taxes_finale = false;
      }
    } catch (errConfig) {
      console.warn('[modeTaxe] Colonne mode_taxe introuvable, valeur vendeur conservée.');
    }

    // ===== 1. CONSTRUIRE LES DONNÉES IMAGES =====
    // Les URLs viennent déjà de S3 — pas de base64 nécessaire
    const imageUrls = product_images
      .map(img => img.url || img.src)
      .filter(url => url && url.startsWith('http'));
    const imageprincipale = imageUrls[0] || null;
    const imagesData = JSON.stringify(product_images.map(img => ({
      url:      img.url     || img.src || null,
      altText:  img.altText || '',
      rotation: img.rotation || 0,
      filename: img.filename || null
    })));

    // ===== 2. INSÉRER LE PRODUIT PRINCIPAL =====
    const produitResult = await client.query(`
      INSERT INTO produits (
        vendeur_id, nom, description, prix, prix_original, prix_revient,
        type_vente, type_annonce, etat, statut, stock, quantite_minimum,
        sku, code_barres, suivi_inventaire, poids, hauteur, largeur, longueur,
        marque, modele, mode_expedition, retour_offert, garantie,
        pays_fabrication, formats, adresse_vente, lien_youtube,
        categorie_id, produit_numerique, lien_numerique, jours_accessibles,
        telechargements_max, images, image, date_parution,
        boutique_en_ligne, point_de_vente, images_data,
        make_offer_enabled, make_offer_prix_min, make_offer_auto_accept,
        facturation_taxes,
        source, created_at, updated_at, ville
      ) VALUES (
        $1,  $2,  $3,  $4,  $5,  $6,
        $7,  $8,  $9,  $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27, $28,
        $29, $30, $31, $32,
        $33, $34, $35, $36,
        $37, $38, $39,
        $40, $41, $42,
        $43,
        'e-Vend', NOW(), NOW(), $44
      ) RETURNING id
    `, [
      vendeurId,                                                   // $1
      nom,                                                         // $2
      description,                                                 // $3
      parseFloat(prix) || 0,                                       // $4
      prix_original ? parseFloat(prix_original) : null,            // $5
      prix_revient  ? parseFloat(prix_revient)  : null,            // $6
      'standard',                                                  // $7  type_vente
      type_annonce,                                                // $8
      etat_article,                                                // $9
      statut,                                                      // $10
      parseInt(quantite) || 0,                                     // $11
      parseInt(quantite_minimum) || 1,                             // $12
      sku          || null,                                        // $13
      code_barres  || null,                                        // $14
      suivi_inventaire,                                            // $15
      poids   ? parseFloat(poids)   : null,                        // $16
      hauteur ? parseFloat(hauteur) : null,                        // $17
      largeur ? parseFloat(largeur) : null,                        // $18
      longueur? parseFloat(longueur): null,                        // $19
      marque  || null,                                             // $20
      modele  || null,                                             // $21
      mode_expedition,                                             // $22 (JSONB)
      retour_offert,                                               // $23
      garantie_offerte,                                            // $24
      pays_fabrication || null,                                    // $25
      formats          || null,                                    // $26
      adresse_vente    || null,                                    // $27
      lien_youtube     || null,                                    // $28
      categories_selectionnees[0]?.id || null,                     // $29 categorie_id principal
      type_produit === 'numerique',                                // $30 produit_numerique
      lien_numerique || null,                                      // $31
      parseInt(jours_accessibles)    || 0,                         // $32
      parseInt(nombre_telechargements) || 0,                       // $33
      JSON.stringify(imageUrls),                                   // $34 images[]
      imageprincipale,                                             // $35 image principale
      type_parution === 'future' ? date_parution : null,           // $36
      parseCanauxVente(canaux_vente).boutique_en_ligne,            // $37
      parseCanauxVente(canaux_vente).point_de_vente,               // $38
      imagesData,                                                  // $39 images_data (JSON complet)
      make_offer_enabled     ?? false,                             // $40
      make_offer_prix_min    ? parseFloat(make_offer_prix_min) : null, // $41
      make_offer_auto_accept ?? false,                             // $42
      facturation_taxes_finale,                                    // $43
      ville || null                                                // $44
    ]);

    const produitId = produitResult.rows[0].id;
    console.log(`✅ Produit inséré en BD — id: ${produitId}`);

    // ===== 3. INSÉRER LES TAGS =====
    if (tags_selectionnes.length > 0) {
      for (const tag of tags_selectionnes) {
        await client.query(
          `INSERT INTO produit_tags (produit_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [produitId, tag.id]
        );
      }
      console.log(`🏷️ ${tags_selectionnes.length} tag(s) associé(s)`);
    }

    // ===== 4. INSÉRER TOUTES LES CATÉGORIES (many-to-many) =====
    if (categories_selectionnees.length > 0) {
      try {
        for (const cat of categories_selectionnees) {
          await client.query(
            `INSERT INTO produit_categories (produit_id, categorie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [produitId, cat.id]
          );
        }
        console.log(`📂 ${categories_selectionnees.length} catégorie(s) associée(s)`);
      } catch (e) {
        console.log('ℹ️ Table produit_categories non disponible, catégorie principale seulement sauvegardée.');
      }
    }

    // ===== 5. INSÉRER LES OPTIONS DE VARIANTES =====
    if (options && options.length > 0) {
      for (let optIndex = 0; optIndex < options.length; optIndex++) {
        const option = options[optIndex];
        try {
          const optionResult = await client.query(
            `INSERT INTO produits_options (produit_id, nom, ordre) VALUES ($1, $2, $3) RETURNING id`,
            [produitId, option.nom, optIndex]
          );
          const optionId = optionResult.rows[0].id;

          if (option.valeurs && option.valeurs.length > 0) {
            for (let valIndex = 0; valIndex < option.valeurs.length; valIndex++) {
              await client.query(
                `INSERT INTO produits_options_valeurs (option_id, valeur, ordre) VALUES ($1, $2, $3)`,
                [optionId, option.valeurs[valIndex].valeur, valIndex]
              );
            }
          }
        } catch (e) {
          console.log('Erreur insert option:', e.message);
        }
      }
      console.log(`🎛️ ${options.length} option(s) de variante insérée(s)`);
    }

    // ===== 6. INSÉRER LES VARIANTES =====
    if (variants && variants.length > 0) {
      let stockTotal = 0;
      for (let varIndex = 0; varIndex < variants.length; varIndex++) {
        const variant = variants[varIndex];
        const varQty = parseInt(variant.quantite) || 0;
        stockTotal += varQty;

        try {
          await client.query(`
            INSERT INTO produits_variantes (
              produit_id, combinaison, prix, quantite,
              sku, poids, code_barres, image_url, position
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            produitId,
            variant.combinaison,
            (variant.prix !== null && variant.prix !== undefined && variant.prix !== '')
              ? parseFloat(variant.prix)
              : parseFloat(prix) || 0,
            varQty,
            variant.sku       || null,
            variant.poids     ? parseFloat(variant.poids) : (poids ? parseFloat(poids) : null),
            variant.codeBarres || null,
            variant.image     || null,  // URL S3 de l'image de variante
            varIndex
          ]);
        } catch (e) {
          console.log('Erreur insert variante:', e.message);
        }
      }
      // Mettre à jour le stock total depuis les variantes
      await client.query(`UPDATE produits SET stock = $1 WHERE id = $2`, [stockTotal, produitId]);
      console.log(`📦 ${variants.length} variante(s) insérée(s) — stock total: ${stockTotal}`);
    }

    // ===== 7. MÉTHODES D'EXPÉDITION =====
    if (methodes_expedition_ids && methodes_expedition_ids.length > 0) {
      try {
        // Supprimer les anciennes associations si c'est une mise à jour
        await client.query(
          `DELETE FROM produit_methodes_expedition WHERE produit_id = $1`,
          [produitId]
        );
        for (const methodeId of methodes_expedition_ids) {
          await client.query(
            `INSERT INTO produit_methodes_expedition (produit_id, methode_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [produitId, parseInt(methodeId)]
          );
        }
        console.log(`🚚 ${methodes_expedition_ids.length} méthode(s) d'expédition associée(s)`);
      } catch (e) {
        console.log('⚠️ Méthodes expédition:', e.message);
      }
    }

    // ===== 8. GÉRER LA VIDÉO =====
    if (product_video && product_video.url) {
      try {
        await client.query(`
          INSERT INTO produits_videos (produit_id, url, thumbnail, duree)
          VALUES ($1, $2, $3, $4)
        `, [
          produitId,
          product_video.url,
          product_video.thumbnail || null,
          product_video.duration  || null
        ]);
        console.log('🎥 Vidéo enregistrée');
      } catch (err) {
        console.log('Note: Table produits_videos non disponible, vidéo ignorée');
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: statut === 'actif' ? '✅ Annonce créée avec succès!' : '📝 Annonce enregistrée comme brouillon',
      produit: {
        id:             produitId,
        nom,
        statut,
        type:           type_produit,
        images_count:   imageUrls.length,
        variants_count: variants.length,
        tags_count:     tags_selectionnes.length,
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur création annonce:', error);
    res.status(500).json({
      success: false,
      message: "❌ Erreur lors de la création de l'annonce",
      error: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/creer-annonce/:id
 * Modifier une annonce existante — mise à jour BD uniquement, sans Shopify.
 */
router.put('/:id', authenticateToken, isVendeurOuAdmin, async (req, res) => {
  const client = await db.connect();

  try {
    const produitId = req.params.id;
    const vendeurId = getVendeurId(req);

    if (!/^\d+$/.test(produitId)) {
      return res.status(400).json({ success: false, message: 'ID de produit invalide' });
    }

    // Vérifier que le produit appartient bien au vendeur
    const checkResult = await client.query(
      `SELECT id, image, images FROM produits WHERE id = $1 AND vendeur_id = $2`,
      [produitId, vendeurId]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé ou accès non autorisé' });
    }
    const produitActuel = checkResult.rows[0];

    const {
      nom, description, prix, prix_original, prix_revient,
      quantite, sku, code_barres, poids, hauteur, largeur, longueur,
      marque, modele, type_annonce, etat_article, retour_offert, garantie_offerte,
      statut, ville, mode_expedition, expedition_necessaire,
      suivi_inventaire, quantite_minimum, facturation_taxes,
      type_produit, produit_numerique_type, lien_numerique,
      jours_accessibles, nombre_telechargements,
      pays_fabrication, formats, adresse_vente, lien_youtube,
      categories_selectionnees = [], tags_selectionnes = [],
      product_images = [],
      product_video  = null,
      canaux_vente,
      type_parution = 'immediate', date_parution,
      options  = [], variants = [],
      make_offer_enabled     = false,
      make_offer_prix_min    = null,
      make_offer_auto_accept = false,
      methodes_expedition_ids = [],
    } = req.body;


    // ===== VÉRIFICATION LIMITE PRODUITS SIMPLISSE =====
    // Paliers : 25 → 15,99$/m | 50 → 18,99$/m | 100 → 20,99$/m | 200 → 23,99$/m
    try {
      const siteResult = await db.query(
        `SELECT template_id FROM sites WHERE gestionnaire_id = $1 LIMIT 1`,
        [vendeurId]
      );
      const templateId = siteResult.rows[0]?.template_id || '';

      if (templateId.startsWith('boutique-simplisse') && statut !== 'brouillon') {

        // Lire le plan du gestionnaire + limite dans plans_simplisse
        const gestionnaireResult = await db.query(
          `SELECT g.plan, ps.limite_produits, ps.prix_mensuel
           FROM gestionnaires g
           LEFT JOIN plans_simplisse ps ON ps.plan = g.plan
           WHERE g.id = $1 LIMIT 1`,
          [vendeurId]
        );
        const limiteProduits = gestionnaireResult.rows[0]?.limite_produits || 25;

        // Compter les produits actifs du gestionnaire
        const countResult = await db.query(
          `SELECT COUNT(*) as nb FROM produits WHERE gestionnaire_id = $1 AND statut = 'actif'`,
          [vendeurId]
        );
        const nbActifs = parseInt(countResult.rows[0]?.nb || '0');

        // Paliers et tarifs pour le message d'erreur
        const paliers = [
          { limite: 25,  prix: '15,99$' },
          { limite: 50,  prix: '18,99$' },
          { limite: 100, prix: '20,99$' },
          { limite: 200, prix: '23,99$' },
        ];
        const prochainPalier = paliers.find(p => p.limite > limiteProduits);

        if (nbActifs >= limiteProduits) {
          return res.status(403).json({
            success: false,
            code: 'LIMITE_PRODUITS_SIMPLISSE',
            message: `Vous avez atteint la limite de ${limiteProduits} produits actifs de votre plan Simplisse.`,
            nb_produits: nbActifs,
            limite: limiteProduits,
            prochain_palier: prochainPalier || null,
            conseil: prochainPalier
              ? `Passez au palier ${prochainPalier.limite} produits pour seulement ${prochainPalier.prix}/mois.`
              : 'Vous êtes au palier maximum du template Simplisse (200 produits).',
          });
        }
      }
    } catch (limiteErr) {
      // Si la vérification échoue (ex: colonne manquante), on laisse passer — fail open
      console.warn('[limite-simplisse] Vérification ignorée:', limiteErr.message);
    }
    // ===================================================

    await client.query('BEGIN');

    // ===== APPLIQUER LE MODE TAXE ADMIN =====
    let facturation_taxes_finale = facturation_taxes;
    try {
      const configResult = await client.query(
        `SELECT mode_taxe FROM configuration_generale_admin LIMIT 1`
      );
      if (configResult.rows.length > 0) {
        const modeTaxe = configResult.rows[0].mode_taxe;
        if (modeTaxe === 'force_taxable')         facturation_taxes_finale = true;
        else if (modeTaxe === 'force_non_taxable') facturation_taxes_finale = false;
      }
    } catch (errConfig) {
      console.warn('[modeTaxe] Colonne mode_taxe introuvable, valeur vendeur conservée.');
    }

    // ===== IMAGES =====
    const imageUrls = product_images
      .map(img => img.url || img.src)
      .filter(url => url && url.startsWith('http'));
    const imageprincipale = imageUrls[0] || produitActuel.image || null;
    const imagesJson = JSON.stringify(
      imageUrls.length > 0 ? imageUrls : JSON.parse(produitActuel.images || '[]')
    );
    const imagesDataJson = product_images.length > 0
      ? JSON.stringify(product_images.map(img => ({
          url:      img.url     || img.src || null,
          altText:  img.altText || '',
          rotation: img.rotation || 0,
          filename: img.filename || null
        })))
      : null;

    // ===== MISE À JOUR DYNAMIQUE =====
    const fields = {
      nom, description,
      prix:              prix         ? parseFloat(prix)         : undefined,
      prix_original:     prix_original ? parseFloat(prix_original) : null,
      prix_revient:      prix_revient  ? parseFloat(prix_revient)  : null,
      stock:             quantite      ? parseInt(quantite)        : undefined,
      sku:               sku          || null,
      code_barres:       code_barres  || null,
      poids:             poids        ? parseFloat(poids)         : undefined,
      hauteur:           hauteur      ? parseFloat(hauteur)       : null,
      largeur:           largeur      ? parseFloat(largeur)       : null,
      longueur:          longueur     ? parseFloat(longueur)      : null,
      marque:            marque       || null,
      modele:            modele       || null,
      type_annonce,
      etat:              etat_article,
      retour_offert,
      garantie:          garantie_offerte,
      statut,
      ville:             ville        || null,
      mode_expedition,
      lien_youtube:      lien_youtube     || null,
      adresse_vente:     adresse_vente    || null,
      pays_fabrication:  pays_fabrication || null,
      formats:           formats          || null,
      boutique_en_ligne: parseCanauxVente(canaux_vente).boutique_en_ligne,
      point_de_vente:    parseCanauxVente(canaux_vente).point_de_vente,
      images:            imagesJson,
      image:             imageprincipale,
      images_data:       imagesDataJson,
      date_parution:     type_parution === 'future' ? date_parution : null,
      make_offer_enabled:     make_offer_enabled     ?? false,
      make_offer_prix_min:    make_offer_prix_min    ? parseFloat(make_offer_prix_min) : null,
      make_offer_auto_accept: make_offer_auto_accept ?? false,
      facturation_taxes:      facturation_taxes_finale,
      // ===== PRODUIT NUMÉRIQUE =====
      produit_numerique:      type_produit === 'numerique',
      lien_numerique:         lien_numerique || null,
      jours_accessibles:      parseInt(jours_accessibles) || 0,
      telechargements_max:    parseInt(nombre_telechargements) || 0,
    };

    const setClauses = [];
    const setValues  = [];
    let idx = 1;
    for (const [field, value] of Object.entries(fields)) {
      if (value !== undefined) {
        setClauses.push(`${field} = $${idx}`);
        setValues.push(value);
        idx++;
      }
    }
    setClauses.push('updated_at = NOW()');
    setValues.push(produitId);

    await client.query(
      `UPDATE produits SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      setValues
    );

    // ===== TAGS =====
    await client.query('DELETE FROM produit_tags WHERE produit_id = $1', [produitId]);
    for (const tag of tags_selectionnes) {
      await client.query(
        'INSERT INTO produit_tags (produit_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [produitId, tag.id]
      );
    }

    // ===== CATÉGORIES =====
    try {
      await client.query('DELETE FROM produit_categories WHERE produit_id = $1', [produitId]);
      for (const cat of categories_selectionnees) {
        await client.query(
          'INSERT INTO produit_categories (produit_id, categorie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [produitId, cat.id]
        );
      }
      console.log(`📂 ${categories_selectionnees.length} catégorie(s) mises à jour`);
    } catch (e) {
      console.log('ℹ️ Table produit_categories non disponible');
    }

    // ===== OPTIONS ET VARIANTES — reset complet =====
    try {
      await client.query('DELETE FROM produits_options WHERE produit_id = $1', [produitId]);
      await client.query('DELETE FROM produits_variantes WHERE produit_id = $1', [produitId]);
    } catch (e) {
      console.log('Tables options/variantes non disponibles');
    }

    if (options && options.length > 0) {
      for (let optIndex = 0; optIndex < options.length; optIndex++) {
        const option = options[optIndex];
        try {
          const optionResult = await client.query(
            'INSERT INTO produits_options (produit_id, nom, ordre) VALUES ($1, $2, $3) RETURNING id',
            [produitId, option.nom, optIndex]
          );
          const optionId = optionResult.rows[0].id;
          if (option.valeurs && option.valeurs.length > 0) {
            for (let valIndex = 0; valIndex < option.valeurs.length; valIndex++) {
              await client.query(
                'INSERT INTO produits_options_valeurs (option_id, valeur, ordre) VALUES ($1, $2, $3)',
                [optionId, option.valeurs[valIndex].valeur, valIndex]
              );
            }
          }
        } catch (e) {
          console.log('Erreur insert option:', e.message);
        }
      }
    }

    if (variants && variants.length > 0) {
      let stockTotal = 0;
      for (let varIndex = 0; varIndex < variants.length; varIndex++) {
        const variant = variants[varIndex];
        const varQty  = parseInt(variant.quantite) || 0;
        stockTotal += varQty;
        try {
          await client.query(`
            INSERT INTO produits_variantes (
              produit_id, combinaison, prix, quantite,
              sku, poids, code_barres, image_url, position
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            produitId,
            variant.combinaison,
            (variant.prix !== null && variant.prix !== undefined && variant.prix !== '')
              ? parseFloat(variant.prix)
              : parseFloat(prix) || 0,
            varQty,
            variant.sku       || null,
            variant.poids     ? parseFloat(variant.poids) : null,
            variant.codeBarres || null,
            variant.image     || null,
            varIndex
          ]);
        } catch (e) {
          console.log('Erreur insert variante:', e.message);
        }
      }
      await client.query('UPDATE produits SET stock = $1 WHERE id = $2', [stockTotal, produitId]);
    }

    // ===== VIDÉO =====
    if (product_video && product_video.url) {
      try {
        await client.query(`DELETE FROM produits_videos WHERE produit_id = $1`, [produitId]);
        await client.query(`
          INSERT INTO produits_videos (produit_id, url, thumbnail, duree)
          VALUES ($1, $2, $3, $4)
        `, [produitId, product_video.url, product_video.thumbnail || null, product_video.duration || null]);
      } catch (err) {
        console.log('Note: Table produits_videos non disponible, vidéo ignorée');
      }
    }

    // ===== MÉTHODES D'EXPÉDITION (PUT) =====
    try {
      await client.query(`DELETE FROM produit_methodes_expedition WHERE produit_id = $1`, [produitId]);
      if (methodes_expedition_ids && methodes_expedition_ids.length > 0) {
        for (const methodeId of methodes_expedition_ids) {
          await client.query(
            `INSERT INTO produit_methodes_expedition (produit_id, methode_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [produitId, parseInt(methodeId)]
          );
        }
        console.log(`🚚 ${methodes_expedition_ids.length} méthode(s) d'expédition mises à jour`);
      }
    } catch (e) { console.log('⚠️ Méthodes expédition PUT:', e.message); }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: '✅ Annonce modifiée avec succès!',
      produit: { id: parseInt(produitId), nom, statut }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur modification annonce:', error);
    res.status(500).json({ success: false, message: "❌ Erreur lors de la modification de l'annonce" });
  } finally {
    client.release();
  }
});

/**
 * GET /api/creer-annonce/:id
 * Récupérer une annonce complète pour le formulaire d'édition
 */
router.get('/:id', authenticateToken, isVendeurOuAdmin, async (req, res) => {
  try {
    const produitId = req.params.id;
    const vendeurId = getVendeurId(req);

    if (!/^\d+$/.test(produitId)) {
      return res.status(400).json({ success: false, message: 'ID de produit invalide' });
    }

    const produitResult = await db.query(`
      SELECT p.*, c.nom as categorie_nom
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      WHERE p.id = $1 AND p.vendeur_id = $2
    `, [produitId, vendeurId]);

    if (produitResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Annonce non trouvée' });
    }

    const produit = produitResult.rows[0];

    const tagsResult = await db.query(`
      SELECT t.id, t.nom FROM tags t
      JOIN produit_tags pt ON pt.tag_id = t.id
      WHERE pt.produit_id = $1
    `, [produitId]);

    let optionsResult    = { rows: [] };
    let variantsResult   = { rows: [] };
    let videoResult      = { rows: [] };
    let categoriesResult = { rows: [] };

    try {
      const optionsRaw = await db.query(`
        SELECT o.id, o.nom, o.ordre,
               json_agg(json_build_object('id', v.id, 'valeur', v.valeur, 'ordre', v.ordre)
                        ORDER BY v.ordre) FILTER (WHERE v.id IS NOT NULL) as valeurs
        FROM produits_options o
        LEFT JOIN produits_options_valeurs v ON v.option_id = o.id
        WHERE o.produit_id = $1
        GROUP BY o.id, o.nom, o.ordre
        ORDER BY o.ordre
      `, [produitId]);
      optionsResult = { rows: optionsRaw.rows.map(o => ({ ...o, valeurs: o.valeurs || [] })) };
    } catch (err) { console.log('Table produits_options non disponible'); }

    try {
      variantsResult = await db.query(
        `SELECT * FROM produits_variantes WHERE produit_id = $1 ORDER BY position`,
        [produitId]
      );
    } catch (err) { console.log('Table produits_variantes non disponible'); }

    try {
      videoResult = await db.query(
        `SELECT * FROM produits_videos WHERE produit_id = $1 LIMIT 1`,
        [produitId]
      );
    } catch (err) { console.log('Table produits_videos non disponible'); }

    try {
      categoriesResult = await db.query(`
        SELECT c.id, c.nom FROM categories c
        JOIN produit_categories pc ON pc.categorie_id = c.id
        WHERE pc.produit_id = $1
      `, [produitId]);
    } catch (err) {
      if (produit.categorie_id) {
        try {
          const fb = await db.query('SELECT id, nom FROM categories WHERE id = $1', [produit.categorie_id]);
          categoriesResult = fb;
        } catch (e2) {}
      }
    }

    // Parser les images
    let imagesArray = [];
    if (produit.images) {
      try {
        const parsed = typeof produit.images === 'string' ? JSON.parse(produit.images) : produit.images;
        imagesArray = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        imagesArray = String(produit.images).replace(/^{|}$/g, '').split(',').filter(Boolean);
      }
    }

    let imagesDataArray = [];
    if (produit.images_data) {
      try {
        imagesDataArray = typeof produit.images_data === 'string'
          ? JSON.parse(produit.images_data)
          : produit.images_data;
        if (!Array.isArray(imagesDataArray)) imagesDataArray = [];
      } catch (e) { imagesDataArray = []; }
    }

    // Formater date_parution sans le Z UTC
    let dateParutionFormatted = null;
    if (produit.date_parution) {
      const dp = String(produit.date_parution);
      dateParutionFormatted = dp.replace('Z', '').replace(/\.\d+$/, '').slice(0, 16);
    }

    res.json({
      success: true,
      produit: {
        ...produit,
        date_parution: dateParutionFormatted,
        image:         imagesArray[0] || produit.image || null,
        images:        imagesArray,
        images_data:   imagesDataArray,
        tags:          tagsResult.rows,
        categories:    categoriesResult.rows,
        options:       optionsResult.rows,
        variants:      variantsResult.rows,
        video:         videoResult.rows[0] || null
      }
    });

  } catch (error) {
    console.error('Erreur récupération annonce:', error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération de l'annonce" });
  }
});

/**
 * GET /api/creer-annonce/:id/parution
 * Endpoint PUBLIC — retourne la date de parution (pour countdown côté boutique)
 */
router.get('/:id/parution', async (req, res) => {
  try {
    const produitId = req.params.id;
    if (!/^\d+$/.test(produitId)) {
      return res.status(400).json({ success: false });
    }

    const result = await db.query(
      `SELECT id, date_parution, statut FROM produits WHERE id = $1 LIMIT 1`,
      [parseInt(produitId)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false });
    }

    const produit = result.rows[0];
    const now = new Date();
    const dateParution = produit.date_parution ? new Date(produit.date_parution) : null;
    const estEnParutionFuture = dateParution && dateParution > now;

    res.json({
      success:             true,
      id:                  produit.id,
      date_parution:       produit.date_parution || null,
      est_parution_future: estEnParutionFuture,
      secondes_restantes:  estEnParutionFuture
        ? Math.max(0, Math.floor((dateParution - now) / 1000))
        : 0
    });

  } catch (error) {
    console.error('Erreur endpoint parution:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;