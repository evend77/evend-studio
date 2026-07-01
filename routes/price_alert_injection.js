// routes/price_alert_injection.js
const express = require('express');
const router = express.Router();

// Endpoint pour injecter les scripts sur Shopify
router.post('/inject-price-alert-button', async (req, res) => {
    const pool = require('../db');
    
    try {
        const { shopify_domain, access_token } = req.body;
        
        let token = access_token;
        let domain = shopify_domain;
        
        if (!token) {
            const result = await pool.query(
                `SELECT shopify_access_token, shop_domain 
                 FROM vendeurs 
                 WHERE shop_domain = $1 OR id = 1 LIMIT 1`,
                [process.env.SHOPIFY_SHOP_DOMAIN || '41ndix-tv.myshopify.com']
            );
            
            if (result.rows.length === 0) {
                return res.status(400).json({ error: 'Token Shopify non trouvé' });
            }
            
            token = result.rows[0].shopify_access_token;
            domain = result.rows[0].shop_domain;
        }
        
        const baseUrl = `https://${domain}/admin/api/2024-10`;
        const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token };
        
        const renderUrl = process.env.RENDER_URL || 'evend-multivendeur-api.onrender.com';
        const WIDGET_URL = `https://${renderUrl}/evend-auction-widget.js`;
        const MODAL_URL = `https://${renderUrl}/js/price-drop-modal.js`;
        
        const results = {
            widget: null,
            modal: null,
            errors: []
        };
        
        // Vérifier et injecter le widget
        const checkWidgetRes = await fetch(`${baseUrl}/script_tags.json`, { headers });
        const existingWidgets = await checkWidgetRes.json();
        const widgetExists = (existingWidgets.script_tags || []).some(s => s.src === WIDGET_URL);
        
        if (!widgetExists) {
            const createWidgetRes = await fetch(`${baseUrl}/script_tags.json`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    script_tag: {
                        event: 'onload',
                        src: WIDGET_URL,
                        display_scope: 'online_store'
                    }
                })
            });
            
            if (createWidgetRes.ok) {
                results.widget = await createWidgetRes.json();
                console.log('✅ Widget installé sur Shopify');
            } else {
                const err = await createWidgetRes.text();
                results.errors.push({ script: 'widget', error: err });
                console.error('❌ Erreur installation widget:', err);
            }
        } else {
            results.widget = { already_exists: true };
            console.log('ℹ️ Widget déjà installé');
        }
        
        // Vérifier et injecter le modal
        const checkModalRes = await fetch(`${baseUrl}/script_tags.json`, { headers });
        const existingModals = await checkModalRes.json();
        const modalExists = (existingModals.script_tags || []).some(s => s.src === MODAL_URL);
        
        if (!modalExists) {
            const createModalRes = await fetch(`${baseUrl}/script_tags.json`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    script_tag: {
                        event: 'onload',
                        src: MODAL_URL,
                        display_scope: 'online_store'
                    }
                })
            });
            
            if (createModalRes.ok) {
                results.modal = await createModalRes.json();
                console.log('✅ Modal installé sur Shopify');
            } else {
                const err = await createModalRes.text();
                results.errors.push({ script: 'modal', error: err });
                console.error('❌ Erreur installation modal:', err);
            }
        } else {
            results.modal = { already_exists: true };
            console.log('ℹ️ Modal déjà installé');
        }
        
        res.json({
            success: results.errors.length === 0,
            message: results.errors.length === 0 ? 'Scripts installés avec succès' : 'Certains scripts ont échoué',
            results
        });
        
    } catch (error) {
        console.error('❌ Erreur injection:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint pour désinstaller les scripts
router.delete('/uninstall-price-alert', async (req, res) => {
    const pool = require('../db');
    
    try {
        const { script_id, shopify_domain, access_token } = req.body;
        
        let token = access_token;
        let domain = shopify_domain;
        
        if (!token) {
            const result = await pool.query(
                `SELECT shopify_access_token, shop_domain 
                 FROM vendeurs 
                 WHERE shop_domain = $1 OR id = 1 LIMIT 1`,
                [process.env.SHOPIFY_SHOP_DOMAIN || '41ndix-tv.myshopify.com']
            );
            
            if (result.rows.length === 0) {
                return res.status(400).json({ error: 'Token Shopify non trouvé' });
            }
            
            token = result.rows[0].shopify_access_token;
            domain = result.rows[0].shop_domain;
        }
        
        const renderUrl = process.env.RENDER_URL || 'evend-multivendeur-api.onrender.com';
        const WIDGET_URL = `https://${renderUrl}/evend-auction-widget.js`;
        const MODAL_URL = `https://${renderUrl}/js/price-drop-modal.js`;
        
        // Récupérer tous les scripts
        const listRes = await fetch(`https://${domain}/admin/api/2024-10/script_tags.json`, {
            headers: { 'X-Shopify-Access-Token': token }
        });
        const scripts = await listRes.json();
        
        const toDelete = (scripts.script_tags || []).filter(s => s.src === WIDGET_URL || s.src === MODAL_URL);
        
        for (const script of toDelete) {
            await fetch(`https://${domain}/admin/api/2024-10/script_tags/${script.id}.json`, {
                method: 'DELETE',
                headers: { 'X-Shopify-Access-Token': token }
            });
            console.log(`✅ Script supprimé: ${script.src}`);
        }
        
        res.json({ success: true, message: `${toDelete.length} script(s) supprimé(s)` });
        
    } catch (error) {
        console.error('❌ Erreur désinstallation:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;