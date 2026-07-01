// routes/connections.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/vendor/:vendorId/connections
router.get('/:vendorId/connections', async (req, res) => {
    const { vendorId } = req.params;
    
    try {
        const result = await pool.query(
            `SELECT id, vendor_id, platform, store_url, store_name, email,
                    sync_status, last_sync, products_count, orders_count,
                    error_message, created_at, updated_at
             FROM store_connections 
             WHERE vendor_id = $1
             ORDER BY created_at DESC`,
            [vendorId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur chargement connexions:', error);
        res.status(500).json({ message: 'Erreur lors du chargement des connexions' });
    }
});

// GET /api/vendor/:vendorId/connections/status
router.get('/:vendorId/connections/status', async (req, res) => {
    const { vendorId } = req.params;
    
    try {
        const result = await pool.query(
            `SELECT id, sync_status, last_sync, products_count, orders_count, error_message
             FROM store_connections 
             WHERE vendor_id = $1`,
            [vendorId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur statuts:', error);
        res.status(500).json({ message: 'Erreur récupération statuts' });
    }
});

// POST /api/vendor/connect
router.post('/connect', async (req, res) => {
    const { 
        vendor_id, platform, store_url, store_name, email, 
        api_key, api_secret, seller_id, marketplace_id, region 
    } = req.body;
    
    if (!vendor_id || !platform) {
        return res.status(400).json({ message: 'vendor_id et platform requis' });
    }
    
    try {
        // Vérifier si existe déjà
        const existing = await pool.query(
            'SELECT id FROM store_connections WHERE vendor_id = $1 AND platform = $2 AND store_url = $3',
            [vendor_id, platform, store_url]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Cette boutique est déjà connectée' });
        }
        
        // Insérer la nouvelle connexion
        const result = await pool.query(
            `INSERT INTO store_connections 
             (vendor_id, platform, store_url, store_name, email, 
              api_key, api_secret, seller_id, marketplace_id, region)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, vendor_id, platform, store_url, store_name, email, sync_status, created_at`,
            [vendor_id, platform, store_url, store_name, email, 
             api_key, api_secret, seller_id, marketplace_id, region]
        );
        
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error('Erreur création connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

// POST /api/vendor/disconnect
router.post('/disconnect', async (req, res) => {
    const { connection_id, vendor_id } = req.body;
    
    try {
        // Vérifier que la connexion appartient au vendeur
        const check = await pool.query(
            'SELECT id FROM store_connections WHERE id = $1 AND vendor_id = $2',
            [connection_id, vendor_id]
        );
        
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Connexion non trouvée' });
        }
        
        await pool.query('DELETE FROM store_connections WHERE id = $1', [connection_id]);
        
        res.json({ message: 'Boutique déconnectée avec succès' });
        
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        res.status(500).json({ message: 'Erreur lors de la déconnexion' });
    }
});

// POST /api/vendor/sync/:connectionId
router.post('/sync/:connectionId', async (req, res) => {
    const { connectionId } = req.params;
    const { vendor_id } = req.body;
    
    try {
        // Vérifier la connexion
        const connection = await pool.query(
            'SELECT * FROM store_connections WHERE id = $1 AND vendor_id = $2',
            [connectionId, vendor_id]
        );
        
        if (connection.rows.length === 0) {
            return res.status(404).json({ message: 'Connexion non trouvée' });
        }
        
        // Mettre à jour le statut
        await pool.query(
            `UPDATE store_connections 
             SET sync_status = 'syncing', last_sync = NOW() 
             WHERE id = $1`,
            [connectionId]
        );
        
        // TODO: Lancer la synchronisation en arrière-plan
        // Pour l'instant, on simule un succès
        setTimeout(async () => {
            await pool.query(
                `UPDATE store_connections 
                 SET sync_status = 'ok', products_count = products_count + 1 
                 WHERE id = $1`,
                [connectionId]
            );
        }, 2000);
        
        res.json({ message: 'Synchronisation lancée' });
        
    } catch (error) {
        console.error('Erreur synchronisation:', error);
        res.status(500).json({ message: 'Erreur lors de la synchronisation' });
    }
});

// POST /api/vendor/connect/oauth (pour initier OAuth)
router.post('/connect/oauth', async (req, res) => {
    const { vendor_id, platform, store_url, store_name } = req.body;
    
    if (!vendor_id || !platform || !store_url) {
        return res.status(400).json({ message: 'vendor_id, platform et store_url requis' });
    }
    
    try {
        // Générer un state unique
        const crypto = require('crypto');
        const state = crypto.randomBytes(32).toString('hex');
        
        // Sauvegarder l'état
        await pool.query(
            `INSERT INTO oauth_states (vendor_id, platform, state, store_url, store_name)
             VALUES ($1, $2, $3, $4, $5)`,
            [vendor_id, platform, state, store_url, store_name]
        );
        
        // Construire l'URL d'authentification selon la plateforme
        let auth_url = '';
        
        if (platform === 'shopify') {
            auth_url = `https://${store_url}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SHOPIFY_SCOPES}&redirect_uri=${process.env.SHOPIFY_REDIRECT_URI}&state=${state}`;
        } else if (platform === 'ebay') {
            auth_url = `https://auth.ebay.com/oauth2/authorize?client_id=${process.env.EBAY_APP_ID}&redirect_uri=${process.env.EBAY_REDIRECT_URI}&response_type=code&scope=https://api.ebay.com/oauth/api_scope&state=${state}`;
        }
        
        res.json({ auth_url });
        
    } catch (error) {
        console.error('Erreur initiation OAuth:', error);
        res.status(500).json({ message: 'Erreur lors de l\'initiation OAuth' });
    }
});

module.exports = router;