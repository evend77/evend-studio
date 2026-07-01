// routes/wishlist.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// UTILITAIRES
// ============================================================

// Générer un token de partage aléatoire
const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 8);
};

// Récupérer ou créer la wishlist par défaut d'un utilisateur
async function getOrCreateDefaultWishlist(userId, userEmail, sessionId = null) {
    // Chercher la wishlist par défaut
    let query = `
        SELECT * FROM wishlists 
        WHERE user_id = $1 AND is_default = true
    `;
    let params = [userId];
    
    let result = await pool.query(query, params);
    
    if (result.rows.length > 0) {
        return result.rows[0];
    }
    
    // Créer une nouvelle wishlist par défaut
    const insertResult = await pool.query(`
        INSERT INTO wishlists (user_id, user_email, nom, is_default, partage_token)
        VALUES ($1, $2, $3, true, $4)
        RETURNING *
    `, [userId, userEmail, 'Ma liste d\'envies', generateShareToken()]);
    
    return insertResult.rows[0];
}

// ============================================================
// ROUTES ACHETEUR
// ============================================================

// GET - Récupérer la wishlist de l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        
        // Récupérer la wishlist par défaut
        const wishlist = await getOrCreateDefaultWishlist(userId, userEmail);
        
        // Récupérer les items
        const itemsResult = await pool.query(`
            SELECT 
                wi.id,
                wi.product_id,
                wi.product_title,
                wi.product_handle,
                wi.product_image_url,
                wi.variant_id,
                wi.variant_title,
                wi.price,
                wi.compare_at_price,
                wi.quantity,
                wi.notes,
                wi.added_at
            FROM wishlist_items wi
            WHERE wi.wishlist_id = $1
            ORDER BY wi.added_at DESC
        `, [wishlist.id]);
        
        res.json({
            wishlist: {
                id: wishlist.id,
                nom: wishlist.nom,
                partage_token: wishlist.partage_token,
                est_partagee: wishlist.est_partagee,
                created_at: wishlist.created_at
            },
            items: itemsResult.rows,
            total_items: itemsResult.rows.length
        });
        
    } catch (err) {
        console.error('❌ Erreur récupération wishlist:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Ajouter un produit à la wishlist
router.post('/me/items', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const {
            product_id,
            product_title,
            product_handle,
            product_image_url,
            variant_id,
            variant_title,
            price,
            compare_at_price,
            quantity = 1
        } = req.body;
        
        if (!product_id) {
            return res.status(400).json({ error: 'product_id requis' });
        }
        
        // Récupérer la wishlist par défaut
        const wishlist = await getOrCreateDefaultWishlist(userId, userEmail);
        
        // Vérifier si le produit existe déjà
        const existingItem = await pool.query(`
            SELECT id, quantity FROM wishlist_items
            WHERE wishlist_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))
        `, [wishlist.id, product_id, variant_id]);
        
        if (existingItem.rows.length > 0) {
            // Incrémenter la quantité
            const newQuantity = existingItem.rows[0].quantity + quantity;
            await pool.query(`
                UPDATE wishlist_items
                SET quantity = $1, added_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [newQuantity, existingItem.rows[0].id]);
            
            res.json({ success: true, action: 'updated', message: 'Quantité mise à jour' });
        } else {
            // Ajouter le nouvel item
            await pool.query(`
                INSERT INTO wishlist_items (
                    wishlist_id, product_id, product_title, product_handle,
                    product_image_url, variant_id, variant_title,
                    price, compare_at_price, quantity
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                wishlist.id, product_id, product_title, product_handle,
                product_image_url, variant_id, variant_title,
                price, compare_at_price, quantity
            ]);
            
            res.json({ success: true, action: 'added', message: 'Produit ajouté à la wishlist' });
        }
        
    } catch (err) {
        console.error('❌ Erreur ajout produit wishlist:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Retirer un produit de la wishlist
router.delete('/me/items/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { variant_id } = req.query;
        
        // Récupérer la wishlist par défaut
        const wishlist = await getOrCreateDefaultWishlist(userId, req.user.email);
        
        const result = await pool.query(`
            DELETE FROM wishlist_items
            WHERE wishlist_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3::text IS NULL))
            RETURNING id
        `, [wishlist.id, productId, variant_id || null]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé dans la wishlist' });
        }
        
        res.json({ success: true, message: 'Produit retiré de la wishlist' });
        
    } catch (err) {
        console.error('❌ Erreur retrait produit wishlist:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT - Mettre à jour la quantité d'un produit
router.put('/me/items/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { quantity, variant_id } = req.body;
        
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantité valide requise' });
        }
        
        const wishlist = await getOrCreateDefaultWishlist(userId, req.user.email);
        
        const result = await pool.query(`
            UPDATE wishlist_items
            SET quantity = $1
            WHERE wishlist_id = $2 AND product_id = $3 AND (variant_id = $4 OR (variant_id IS NULL AND $4::text IS NULL))
            RETURNING id
        `, [quantity, wishlist.id, productId, variant_id || null]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        
        res.json({ success: true, message: 'Quantité mise à jour' });
        
    } catch (err) {
        console.error('❌ Erreur mise à jour quantité:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Compter le nombre d'articles dans la wishlist (pour l'icône du header)
router.get('/count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const wishlist = await getOrCreateDefaultWishlist(userId, req.user.email);
        
        const result = await pool.query(`
            SELECT COUNT(*) as total FROM wishlist_items WHERE wishlist_id = $1
        `, [wishlist.id]);
        
        res.json({ count: parseInt(result.rows[0].total) });
        
    } catch (err) {
        console.error('❌ Erreur comptage wishlist:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Vider toute la wishlist
router.delete('/me/clear', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const wishlist = await getOrCreateDefaultWishlist(userId, req.user.email);
        
        await pool.query('DELETE FROM wishlist_items WHERE wishlist_id = $1', [wishlist.id]);
        
        res.json({ success: true, message: 'Wishlist vidée' });
        
    } catch (err) {
        console.error('❌ Erreur vidage wishlist:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Vérifier si un produit est dans la wishlist (pour le cœur ❤️)
router.post('/check', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, variant_id } = req.body;
        
        if (!product_id) {
            return res.status(400).json({ error: 'product_id requis' });
        }
        
        const wishlist = await getOrCreateDefaultWishlist(userId, req.user.email);
        
        const result = await pool.query(`
            SELECT id FROM wishlist_items
            WHERE wishlist_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3::text IS NULL))
        `, [wishlist.id, product_id, variant_id || null]);
        
        res.json({ inWishlist: result.rows.length > 0 });
        
    } catch (err) {
        console.error('❌ Erreur vérification wishlist:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;