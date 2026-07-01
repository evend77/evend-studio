// backend/scripts/reparer_images.js
//
// Script one-shot pour réparer les annonces dont l'URL d'image est morte
// (uploadée sur Shopify mais jamais attachée à un produit → supprimée par Shopify)
//
// Usage : node scripts/reparer_images.js
//         node scripts/reparer_images.js --dry-run   (simulation sans modifier la DB)

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

const DRY_RUN = process.argv.includes('--dry-run');

if (DRY_RUN) {
    console.log('🔍 MODE DRY-RUN — aucune modification en DB\n');
}

// Vérifie si une URL d'image est encore accessible
async function imageVivante(url) {
    if (!url || !url.startsWith('http')) return false;
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok; // 200-299
    } catch {
        return false;
    }
}

async function reparer() {
    console.log('🔧 Démarrage réparation images...\n');

    // Récupérer tous les produits e-Vend avec un shopify_id et une image
    const { rows: produits } = await db.query(`
        SELECT 
            p.id,
            p.nom,
            p.image,
            p.images,
            p.shopify_id,
            p.vendeur_id,
            v.shop_domain,
            v.shopify_access_token
        FROM produits p
        JOIN vendeurs v ON v.id = p.vendeur_id
        WHERE p.source = 'e-Vend'
          AND p.shopify_id IS NOT NULL
          AND p.image IS NOT NULL
          AND v.shopify_access_token IS NOT NULL
        ORDER BY p.id DESC
    `);

    console.log(`📦 ${produits.length} produits e-Vend avec shopify_id à vérifier\n`);

    let nbOk = 0;
    let nbMorts = 0;
    let nbRepares = 0;
    let nbEchecs = 0;

    for (const produit of produits) {
        const vivante = await imageVivante(produit.image);

        if (vivante) {
            nbOk++;
            console.log(`✅ [${produit.id}] ${produit.nom.substring(0, 40)} — image OK`);
            continue;
        }

        nbMorts++;
        console.log(`❌ [${produit.id}] ${produit.nom.substring(0, 40)} — image MORTE`);
        console.log(`   URL morte: ${produit.image}`);

        // Récupérer les vraies images depuis Shopify
        try {
            const shopifyUrl = `https://${produit.shop_domain}/admin/api/2024-01/products/${produit.shopify_id}/images.json`;
            const res = await fetch(shopifyUrl, {
                headers: { 'X-Shopify-Access-Token': produit.shopify_access_token }
            });

            if (!res.ok) {
                console.log(`   ⚠️ Erreur Shopify API (${res.status}) — produit peut-être supprimé sur Shopify`);
                nbEchecs++;
                continue;
            }

            const data = await res.json();
            const images = data.images || [];

            if (images.length === 0) {
                console.log(`   ⚠️ Aucune image trouvée sur Shopify pour ce produit`);
                nbEchecs++;
                continue;
            }

            const nouvellesPrincipale = images[0].src;
            const nouvellesUrls = images.map(img => img.src);
            console.log(`   🔄 ${images.length} image(s) récupérée(s) depuis Shopify`);
            console.log(`   Nouvelle URL: ${nouvellesPrincipale}`);

            if (!DRY_RUN) {
                await db.query(`
                    UPDATE produits
                    SET image = $1,
                        images = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [nouvellesPrincipale, JSON.stringify(nouvellesUrls), produit.id]);
                console.log(`   ✅ DB mise à jour`);
            } else {
                console.log(`   [DRY-RUN] DB non modifiée`);
            }

            nbRepares++;

        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
            nbEchecs++;
        }

        // Petite pause pour pas spammer l'API Shopify
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n══════════════════════════════════');
    console.log(`📊 RÉSULTATS:`);
    console.log(`   ✅ Images OK       : ${nbOk}`);
    console.log(`   ❌ Images mortes   : ${nbMorts}`);
    console.log(`   🔧 Réparées        : ${nbRepares}`);
    console.log(`   ⚠️  Échecs          : ${nbEchecs}`);
    console.log('══════════════════════════════════\n');

    await db.pool?.end?.();
    process.exit(0);
}

reparer().catch(err => {
    console.error('💥 Erreur fatale:', err);
    process.exit(1);
});