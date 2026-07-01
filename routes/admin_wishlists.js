// routes/admin_wishlists.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET - Récupérer toutes les wishlists pour l'admin
router.get('/admin/wishlists', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Récupérer toutes les wishlists
        const wishlistsResult = await pool.query(`
            SELECT 
                w.id,
                w.user_id,
                w.user_email,
                w.user_type,
                w.session_id,
                w.nom,
                w.is_default,
                w.partage_token,
                w.est_partagee,
                w.created_at,
                w.updated_at,
                w.expires_at,
                COUNT(wi.id) as total_items,
                COALESCE(SUM(wi.price * wi.quantity), 0) as total_value
            FROM wishlists w
            LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
            GROUP BY w.id
            ORDER BY w.created_at DESC
        `);

        // Pour chaque wishlist, récupérer les items
        const wishlists = [];
        for (const w of wishlistsResult.rows) {
            const itemsResult = await pool.query(`
                SELECT 
                    id,
                    wishlist_id,
                    product_id,
                    product_title,
                    product_handle,
                    product_image_url,
                    variant_id,
                    variant_title,
                    price,
                    compare_at_price,
                    quantity,
                    notes,
                    added_at
                FROM wishlist_items
                WHERE wishlist_id = $1
                ORDER BY added_at DESC
            `, [w.id]);

            wishlists.push({
                ...w,
                items: itemsResult.rows,
                total_items: parseInt(w.total_items),
                total_value: parseFloat(w.total_value)
            });
        }

        res.json(wishlists);
    } catch (err) {
        console.error('❌ Erreur récupération wishlists:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Récupérer toutes les alertes prix pour l'admin
router.get('/admin/price-alerts', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                pa.id,
                pa.product_id,
                pa.product_title,
                CASE 
                    WHEN pa.product_image_url LIKE '//%' THEN 'https:' || pa.product_image_url
                    ELSE pa.product_image_url
                END as product_image_url,
                pa.product_url,
                pa.email,
                COALESCE(a.prenom || ' ' || a.nom, 'Invité') as acheteur_nom,
                pa.current_price,
                pa.target_price,
                pa.status,
                pa.notification_email,
                pa.notification_push,
                pa.notification_sent_email,
                pa.notification_sent_push,
                pa.notification_email_sent_at,
                pa.notification_push_sent_at,
                pa.created_at,
                pa.triggered_at,
                pa.price_when_triggered,
                pa.message
            FROM price_alerts pa
            LEFT JOIN acheteurs a ON a.email = pa.email
            ORDER BY pa.created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('❌ Erreur récupération alertes prix:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Statistiques des wishlists
router.get('/admin/wishlists/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(DISTINCT w.id) as total_wishlists,
                COUNT(wi.id) as total_items,
                COALESCE(SUM(wi.price * wi.quantity), 0) as total_valeurs,
                COUNT(DISTINCT w.user_email) as acheteurs_uniques,
                COUNT(CASE WHEN w.est_partagee = true THEN 1 END) as wishlists_partagees
            FROM wishlists w
            LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
        `);

        res.json({
            total_wishlists: parseInt(stats.rows[0].total_wishlists),
            total_items: parseInt(stats.rows[0].total_items),
            total_valeurs: parseFloat(stats.rows[0].total_valeurs),
            acheteurs_uniques: parseInt(stats.rows[0].acheteurs_uniques),
            wishlists_partagees: parseInt(stats.rows[0].wishlists_partagees)
        });
    } catch (err) {
        console.error('❌ Erreur stats wishlists:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Supprimer une wishlist
router.delete('/admin/wishlists/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        // Vérifier que la wishlist existe
        const check = await pool.query('SELECT id FROM wishlists WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Wishlist non trouvée' });
        }

        // Supprimer (les items seront supprimés automatiquement par ON DELETE CASCADE)
        await pool.query('DELETE FROM wishlists WHERE id = $1', [id]);
        
        res.json({ success: true, message: 'Wishlist supprimée' });
    } catch (err) {
        console.error('❌ Erreur suppression wishlist:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Supprimer une alerte prix
router.delete('/admin/price-alerts/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const check = await pool.query('SELECT id FROM price_alerts WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Alerte non trouvée' });
        }

        await pool.query('DELETE FROM price_alerts WHERE id = $1', [id]);
        
        res.json({ success: true, message: 'Alerte prix supprimée' });
    } catch (err) {
        console.error('❌ Erreur suppression alerte:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
// ============================================================
// POST - Créer une alerte prix (appelé par le widget Shopify)
// ============================================================
router.post('/price-alerts', async (req, res) => {
    try {
        const {
            product_id,
            product_title,
            product_url,
            product_image_url,
            email,
            target_price,
            current_price,
            message,
            notification_push,
            notification_email
        } = req.body;

        if (!product_id || !email || !target_price) {
            return res.status(400).json({ error: 'Champs requis manquants: product_id, email, target_price' });
        }

        // Récupérer la config admin pour notification_push, notification_email et blacklist
        const configResult = await pool.query('SELECT config FROM wishlist_config WHERE id = 1');
        const adminConfig = configResult.rows[0]?.config || {};
        const priceDropConfig = adminConfig.priceDropAlert || {};
        const blacklist = adminConfig.priceDropBlacklist || { produitsIds: [], tags: [] };

        // Vérifier la blacklist produits
        const produitIdNum = parseInt(product_id);
        if (!isNaN(produitIdNum) && blacklist.produitsIds?.includes(produitIdNum)) {
            return res.status(403).json({ error: 'Ce produit ne supporte pas les alertes prix' });
        }

        // Les préférences de notification de l'acheteur sont limitées par la config admin
        // Si l'admin a désactivé les push globalement → jamais de push même si l'acheteur veut
        const adminAllowsPush = priceDropConfig.notificationPush !== false;
        const adminAllowsEmail = priceDropConfig.notificationEmail !== false;

        const finalPush = adminAllowsPush && (notification_push !== false);
        const finalEmail = adminAllowsEmail && (notification_email !== false);

        // Limiter le message à 150 caractères
        const messageTronque = message ? String(message).substring(0, 150) : null;

        // Vérifier si une alerte active existe déjà pour ce produit/email
        const existingAlert = await pool.query(
            `SELECT id FROM price_alerts WHERE product_id = $1 AND email = $2 AND status = 'active'`,
            [String(product_id), email]
        );

        if (existingAlert.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Une alerte active existe déjà pour ce produit et cet email',
                existing_id: existingAlert.rows[0].id
            });
        }

        const result = await pool.query(`
            INSERT INTO price_alerts (
                product_id, product_title, product_url, product_image_url,
                email, target_price, current_price, message,
                notification_push, notification_email, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
            RETURNING id
        `, [
            String(product_id),
            product_title || null,
            product_url || null,
            product_image_url || null,
            email,
            parseFloat(target_price),
            parseFloat(current_price) || 0,
            messageTronque,
            finalPush,
            finalEmail
        ]);

        console.log(`✅ Alerte prix créée id=${result.rows[0].id} pour ${email} - push:${finalPush} email:${finalEmail}`);

        res.json({ success: true, id: result.rows[0].id });

    } catch (err) {
        console.error('❌ Erreur création alerte prix:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// POST - Déclencher manuellement une vérification des prix
// Le vrai cron automatique tourne dans server.js
// ============================================================
router.post('/admin/price-alerts/check', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Lire la config pour retourner les infos
        const configResult = await pool.query('SELECT config FROM wishlist_config WHERE id = 1');
        const adminConfig = configResult.rows[0]?.config || {};
        const priceDropConfig = adminConfig.priceDropAlert || {};
        const frequence = priceDropConfig.frequenceSurveillance || 'toutesLes4Heures';

        // Compter les alertes actives
        const alertes = await pool.query(`SELECT COUNT(*) as total FROM price_alerts WHERE status = 'active'`);

        res.json({
            success: true,
            message: 'Le cron automatique tourne dans server.js. Utilisez le déploiement Render pour le contrôler.',
            frequence,
            alertes_actives: parseInt(alertes.rows[0].total)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;