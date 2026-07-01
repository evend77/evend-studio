const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================================
// GET /vendeur/:vendeurId - Infos complètes de la boutique
// ============================================================
router.get('/vendeur/:vendeurId', async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        
        console.log('\n🔍 RECHERCHE BOUTIQUE ID:', vendeurId);

        // 1. Infos vendeur avec toutes les colonnes
        const vendeur = await pool.query(`
            SELECT 
                id, 
                nom_boutique,
                nom as proprietaire,
                email,
                description as description_courte,
                description_longue,
                region_admin as region,
                date_inscription,
                total_ventes,
                total_commandes,
                total_produits,
                note_moyenne,
                nombre_avis,
                telephone,
                no_entreprise,
                no_tps,
                no_tvq,
                site_web,
                politique_retours,
                politique_livraison,
                photo_boutique,
                zone_expedition,
                province_entreprise,
                num_entreprise_provincial,
                type_entreprise,
                jours_remboursement,
                est_entreprise_enregistree,
                banniere_url,    
                logo_url         
            FROM vendeurs 
            WHERE id = $1
        `, [vendeurId]);

        if (vendeur.rows.length === 0) {
            return res.status(404).json({ error: 'Boutique non trouvée' });
        }

        // 2. Produits avec catégories, tags et URL Shopify
        const produits = await pool.query(`
            SELECT 
                p.*,
                c.nom as categorie_nom,
                c.id as categorie_id,
                COALESCE(
                    (SELECT json_agg(t.*)
                     FROM tags t
                     JOIN produit_tags pt ON t.id = pt.tag_id
                     WHERE pt.produit_id = p.id),
                    '[]'::json
                ) as tags,
                -- Utiliser shopify_url si disponible
                p.shopify_url as shopify_product_url
            FROM produits p
            LEFT JOIN categories c ON p.categorie_id = c.id
            WHERE p.vendeur_id = $1
            ORDER BY p.created_at DESC
        `, [vendeurId]);

        // 3. Catégories avec comptage
        const categories = await pool.query(`
            SELECT 
                c.id,
                c.nom,
                COUNT(p.id) as nombre_annonces
            FROM categories c
            LEFT JOIN produits p ON c.id = p.categorie_id AND p.vendeur_id = $1
            WHERE p.id IS NOT NULL
            GROUP BY c.id, c.nom
            ORDER BY c.nom
        `, [vendeurId]);

        // 4. Tags avec comptage
        const tags = await pool.query(`
            SELECT 
                t.id,
                t.nom,
                COUNT(pt.produit_id) as nombre_annonces
            FROM tags t
            LEFT JOIN produit_tags pt ON t.id = pt.tag_id
            LEFT JOIN produits p ON pt.produit_id = p.id AND p.vendeur_id = $1
            WHERE p.id IS NOT NULL
            GROUP BY t.id, t.nom
            ORDER BY t.nom
        `, [vendeurId]);

        // 5. Avis avec détails
        const avis = await pool.query(`
            SELECT 
                a.*,
                acheteurs.nom as acheteur_nom
            FROM avis a
            LEFT JOIN acheteurs ON a.acheteur_id = acheteurs.id
            WHERE a.vendeur_id = $1
            ORDER BY a.created_at DESC
            LIMIT 20
        `, [vendeurId]);

        // ============================================================
        // 6. BLOG - Récupérer les articles de blog
        // ============================================================
        let blog = [];
        try {
            // Vérifier si la table blog_articles existe
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'blog_articles'
                )
            `);
            
            if (tableCheck.rows[0].exists) {
                const blogResult = await pool.query(`
                    SELECT 
                        id,
                        titre,
                        contenu,
                        extrait,
                        image,
                        created_at,
                        statut
                    FROM blog_articles 
                    WHERE vendeur_id = $1 
                    ORDER BY created_at DESC 
                    LIMIT 10
                `, [vendeurId]);
                blog = blogResult.rows;
                console.log(`📰 ${blog.length} articles de blog trouvés`);
            } else {
                console.log('ℹ️ Table blog_articles inexistante');
            }
        } catch (err) {
            console.log('⚠️ Erreur lors de la récupération du blog:', err.message);
        }

        // ============================================================
        // 7. FAQ - Récupérer les questions fréquentes
        // ============================================================
        let faq = [];
        try {
            // Vérifier si la table faq existe
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'faq'
                )
            `);
            
            if (tableCheck.rows[0].exists) {
                const faqResult = await pool.query(`
                    SELECT 
                        id,
                        question,
                        reponse,
                        ordre
                    FROM faq 
                    WHERE vendeur_id = $1 
                    ORDER BY ordre
                `, [vendeurId]);
                faq = faqResult.rows;
                console.log(`❓ ${faq.length} questions FAQ trouvées`);
            } else {
                console.log('ℹ️ Table faq inexistante');
            }
        } catch (err) {
            console.log('⚠️ Erreur lors de la récupération de la FAQ:', err.message);
        }

        console.log(`✅ Vendeur trouvé: ${vendeur.rows[0].nom_boutique}`);
        console.log(`📦 ${produits.rows.length} produits`);
        console.log(`⭐ ${avis.rows.length} avis`);
        console.log(`📰 ${blog.length} articles de blog`);
        console.log(`❓ ${faq.length} questions FAQ`);
        console.log(`📸 banniere_url: ${vendeur.rows[0].banniere_url || 'Non définie'}`);
        console.log(`📸 logo_url: ${vendeur.rows[0].logo_url || 'Non définie'}`);
        
        // Afficher les produits avec URL Shopify pour déboguer
        produits.rows.forEach(produit => {
            if (produit.shopify_product_url) {
                console.log(`🔗 Produit ${produit.id} - ${produit.nom} : ${produit.shopify_product_url}`);
            } else {
                console.log(`⚠️ Produit ${produit.id} - ${produit.nom} : pas d'URL Shopify`);
            }
        });

        // Normaliser les images — supporte 3 formats :
        // 1. images_data (nouvelles annonces e-Vend) : [{url, attachment, ...}]
        // 2. images (anciennes annonces Webkul) : {url1,url2} ou ["url1","url2"]
        // 3. image (champ principal seul)
        const parseImages = (images) => {
            if (!images) return [];
            if (Array.isArray(images)) return images.filter(Boolean);
            if (typeof images === 'string') {
                if (images.startsWith('{') && images.endsWith('}')) {
                    return images.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                }
                try { return JSON.parse(images).filter(Boolean); } catch {}
            }
            return [];
        };

        const parseImagesData = (imagesData) => {
            if (!imagesData) return [];
            let arr = imagesData;
            if (typeof arr === 'string') {
                try { arr = JSON.parse(arr); } catch { return []; }
            }
            if (!Array.isArray(arr)) return [];
            return arr.map(img => img?.url || img?.src).filter(Boolean);
        };

        const produitsNormalises = produits.rows.map(p => {
            let imgs = parseImagesData(p.images_data);         // nouvelles annonces
            if (imgs.length === 0) imgs = parseImages(p.images); // anciennes annonces
            if (imgs.length === 0 && p.image) imgs = [p.image];  // fallback image principale
            return { ...p, images: imgs };
        });

        res.json({
            vendeur: vendeur.rows[0],
            produits: produitsNormalises,
            categories: categories.rows,
            tags: tags.rows,
            avis: avis.rows,
            blog: blog,
            faq: faq
        });

    } catch (error) {
        console.error('\n❌ ERREUR DANS BOUTIQUE PUBLIQUE:');
        console.error('❌ Message:', error.message);
        console.error('❌ Stack:', error.stack);
        
        res.status(500).json({ 
            error: error.message,
            details: error.stack
        });
    }
});

// ============================================================
// GET /vendeur/:vendeurId/badges - Récupérer les badges d'un vendeur (public)
// ============================================================
router.get('/vendeur/:vendeurId/badges', async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        
        console.log(`🔍 Récupération des badges pour le vendeur ${vendeurId}`);

        // Vérifier que la table vendeur_badges existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'vendeur_badges'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('⚠️ Table vendeur_badges n\'existe pas');
            return res.json([]);
        }
        
        // Récupérer les badges du vendeur avec les détails du badge
        const result = await pool.query(`
            SELECT 
                vb.id,
                vb.vendeur_id,
                vb.badge_id,
                vb.date_attribution,
                b.id AS badge_id_ref,
                b.nom AS badge_nom,
                b.description AS badge_description,
                b.icone AS badge_icone,
                b.couleur AS badge_couleur,
                b.niveau AS badge_niveau,
                b.critere AS badge_critere
            FROM vendeur_badges vb
            JOIN badges b ON vb.badge_id = b.id
            WHERE vb.vendeur_id = $1 
                AND vb.statut = 'actif'
                AND b.statut = 'actif'
            ORDER BY b.niveau ASC, vb.date_attribution DESC
        `, [vendeurId]);
        
        console.log(`✅ ${result.rows.length} badges trouvés pour le vendeur ${vendeurId}`);
        
        // Formater les données pour le frontend
        const badges = result.rows.map(row => ({
            id: row.id,
            badge_id: row.badge_id,
            vendeur_id: row.vendeur_id,
            date_attribution: row.date_attribution,
            badge: {
                id: row.badge_id_ref,
                nom: row.badge_nom,
                description: row.badge_description,
                icone: row.badge_icone,
                couleur: row.badge_couleur,
                niveau: row.badge_niveau,
                critere: row.badge_critere
            }
        }));
        
        res.json(badges);
        
    } catch (error) {
        console.error('❌ Erreur GET /api/boutique-publique/vendeur/:vendeurId/badges:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ============================================================
// POST /avis - Ajouter un avis sur le vendeur
// ============================================================
router.post('/avis', async (req, res) => {
    try {
        const {
            vendeur_id,
            nom,
            email,
            note_globale,
            qualite_detail,
            prix_raisonnable,
            vitesse_expedition,
            qualite_discution,
            titre,
            commentaire
        } = req.body;

        console.log('📝 Nouvel avis pour vendeur:', vendeur_id);

        const result = await pool.query(`
            INSERT INTO avis (
                vendeur_id, nom_visiteur, email_visiteur,
                note_globale, qualite_detail, prix_raisonnable,
                vitesse_expedition, qualite_discution,
                titre, commentaire, verified_purchase
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            vendeur_id, nom, email,
            note_globale, qualite_detail, prix_raisonnable,
            vitesse_expedition, qualite_discution,
            titre, commentaire, false
        ]);

        // Mettre à jour la note moyenne du vendeur
        await pool.query(`
            UPDATE vendeurs SET
                note_moyenne = (SELECT AVG(note_globale) FROM avis WHERE vendeur_id = $1),
                nombre_avis = (SELECT COUNT(*) FROM avis WHERE vendeur_id = $1)
            WHERE id = $1
        `, [vendeur_id]);

        console.log('✅ Avis ajouté avec succès');

        res.json({ 
            success: true, 
            message: 'Votre avis a été ajouté avec succès!',
            avis: result.rows[0] 
        });

    } catch (error) {
        console.error('❌ ERREUR AVIS:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ============================================================
// POST /avis-produit - Ajouter un avis sur un produit
// ============================================================
router.post('/avis-produit', async (req, res) => {
    try {
        const {
            vendeur_id,
            produit_id,
            nom,
            email,
            note_globale,
            titre,
            commentaire
        } = req.body;

        console.log('📝 Nouvel avis sur produit ID:', produit_id, 'pour vendeur:', vendeur_id);

        // Vérifier si la table avis_produits existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'avis_produits'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            // Si la table n'existe pas, créer une table temporaire
            await pool.query(`
                CREATE TABLE IF NOT EXISTS avis_produits (
                    id SERIAL PRIMARY KEY,
                    produit_id INTEGER NOT NULL,
                    vendeur_id INTEGER NOT NULL,
                    nom_visiteur VARCHAR(255),
                    email_visiteur VARCHAR(255),
                    note_globale INTEGER DEFAULT 5,
                    titre VARCHAR(255),
                    commentaire TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    verified_purchase BOOLEAN DEFAULT false
                )
            `);
        }

        const result = await pool.query(`
            INSERT INTO avis_produits (
                produit_id, vendeur_id, nom_visiteur, email_visiteur,
                note_globale, titre, commentaire, verified_purchase
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            produit_id, vendeur_id, nom, email,
            note_globale, titre, commentaire, false
        ]);

        console.log('✅ Avis produit ajouté avec succès');

        res.json({ 
            success: true, 
            message: 'Votre avis a été ajouté avec succès!',
            avis: result.rows[0] 
        });

    } catch (error) {
        console.error('❌ ERREUR AVIS PRODUIT:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ============================================================
// POST /signaler - Signaler un vendeur
// ============================================================
router.post('/signaler', async (req, res) => {
    try {
        const {
            vendeur_id,
            nom,
            email,
            raison_type,
            raison_autre,
            description
        } = req.body;

        console.log('⚠️ Nouveau signalement pour vendeur:', vendeur_id);

        // Vérifier si la table signalements_vendeur existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'signalements_vendeur'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            // Créer la table si elle n'existe pas
            await pool.query(`
                CREATE TABLE IF NOT EXISTS signalements_vendeur (
                    id SERIAL PRIMARY KEY,
                    vendeur_id INTEGER NOT NULL,
                    signaler_nom VARCHAR(255),
                    signaler_email VARCHAR(255),
                    raison_type VARCHAR(100),
                    raison_autre TEXT,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        const result = await pool.query(`
            INSERT INTO signalements_vendeur (
                vendeur_id, signaler_nom, signaler_email,
                raison_type, raison_autre, description
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [vendeur_id, nom, email, raison_type, raison_autre, description]);

        console.log('✅ Signalement enregistré ID:', result.rows[0].id);

        res.json({ 
            success: true, 
            message: 'Signalement envoyé. Merci de nous aider à améliorer la communauté!',
            id: result.rows[0].id
        });

    } catch (error) {
        console.error('❌ ERREUR SIGNALEMENT:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;