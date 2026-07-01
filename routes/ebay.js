// routes/ebay.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/database');

// 1. Initier OAuth eBay
router.get('/auth', async (req, res) => {
    const { vendor_id, store_url } = req.query;
    
    if (!vendor_id || !store_url) {
        return res.status(400).json({ error: 'vendor_id et store_url requis' });
    }
    
    const state = crypto.randomBytes(32).toString('hex');
    
    await pool.query(
        `INSERT INTO oauth_states (vendor_id, platform, state, store_url)
         VALUES ($1, $2, $3, $4)`,
        [vendor_id, 'ebay', state, store_url]
    );
    
    const redirectUri = process.env.EBAY_REDIRECT_URI;
    const clientId = process.env.EBAY_APP_ID;
    const sandbox = process.env.EBAY_SANDBOX === 'true';
    const authUrl = sandbox 
        ? 'https://auth.sandbox.ebay.com/oauth2/authorize'
        : 'https://auth.ebay.com/oauth2/authorize';
    
    const scopes = [
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
        'https://api.ebay.com/oauth/api_scope/sell.account'
    ].join(' ');
    
    const url = `${authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    res.json({ auth_url: url });
});

// 2. Callback OAuth eBay
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
        return res.status(400).send('Code manquant');
    }
    
    try {
        const stateResult = await pool.query(
            'SELECT * FROM oauth_states WHERE state = $1 AND expires_at > NOW()',
            [state]
        );
        
        if (stateResult.rows.length === 0) {
            return res.status(400).send('State invalide ou expiré');
        }
        
        const oauthState = stateResult.rows[0];
        const sandbox = process.env.EBAY_SANDBOX === 'true';
        const tokenUrl = sandbox
            ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
            : 'https://api.ebay.com/identity/v1/oauth2/token';
        
        const auth = Buffer.from(`${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`).toString('base64');
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.EBAY_REDIRECT_URI
            })
        });
        
        const tokens = await response.json();
        
        if (!response.ok) {
            throw new Error(tokens.error_description || 'Erreur obtention tokens');
        }
        
        await pool.query(
            `INSERT INTO store_connections (vendor_id, platform, store_url, store_name, access_token, refresh_token, token_expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (vendor_id, platform, store_url) 
             DO UPDATE SET access_token = $5, refresh_token = $6, token_expires_at = $7, updated_at = NOW()`,
            [
                oauthState.vendor_id,
                'ebay',
                oauthState.store_url,
                oauthState.store_name || 'Boutique eBay',
                tokens.access_token,
                tokens.refresh_token,
                new Date(Date.now() + tokens.expires_in * 1000)
            ]
        );
        
        await pool.query('DELETE FROM oauth_states WHERE state = $1', [state]);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Connexion eBay réussie</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>✅ Boutique eBay connectée avec succès !</h1>
                <p>Vous pouvez fermer cette fenêtre.</p>
                <script>setTimeout(() => window.close(), 3000);</script>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Erreur callback eBay:', error);
        res.status(500).send(`<h2>❌ Erreur : ${error.message}</h2>`);
    }
});

module.exports = router;