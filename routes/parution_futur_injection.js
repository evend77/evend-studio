// routes/parution_futur_injection.js
const express = require('express');
const router = express.Router();

const SCRIPT_NAME = 'parution-futur-widget.js';

// ============================================================
// POST /api/parution-futur/inject
// Enregistre le script tag sur Shopify
// ============================================================
router.post('/inject', async (req, res) => {
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

        const renderUrl = process.env.RENDER_URL || 'evend-multivendeur-api.onrender.com';
        const PARUTION_URL = `https://${renderUrl}/${SCRIPT_NAME}`;

        const baseUrl = `https://${domain}/admin/api/2024-10`;
        const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token };

        // Vérifier si le script est déjà installé
        const checkRes = await fetch(`${baseUrl}/script_tags.json`, { headers });
        const existing = await checkRes.json();
        const alreadyExists = (existing.script_tags || []).some(s => s.src === PARUTION_URL);

        if (alreadyExists) {
            console.log('ℹ️ Script parution future déjà installé');
            return res.json({ success: true, message: 'Script déjà installé', already_exists: true });
        }

        // Installer le script tag
        const createRes = await fetch(`${baseUrl}/script_tags.json`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                script_tag: {
                    event: 'onload',
                    src: PARUTION_URL,
                    display_scope: 'online_store'
                }
            })
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            console.error('❌ Erreur installation script parution:', err);
            return res.status(500).json({ success: false, error: err });
        }

        const created = await createRes.json();
        console.log('✅ Script parution future installé sur Shopify:', PARUTION_URL);
        res.json({ success: true, message: 'Script parution future installé avec succès', script_tag: created });

    } catch (error) {
        console.error('❌ Erreur injection parution:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// DELETE /api/parution-futur/uninstall
// Retire le script tag de Shopify
// ============================================================
router.delete('/uninstall', async (req, res) => {
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

        const renderUrl = process.env.RENDER_URL || 'evend-multivendeur-api.onrender.com';
        const PARUTION_URL = `https://${renderUrl}/${SCRIPT_NAME}`;

        const listRes = await fetch(`https://${domain}/admin/api/2024-10/script_tags.json`, {
            headers: { 'X-Shopify-Access-Token': token }
        });
        const scripts = await listRes.json();

        const toDelete = (scripts.script_tags || []).filter(s => s.src === PARUTION_URL);

        for (const script of toDelete) {
            await fetch(`https://${domain}/admin/api/2024-10/script_tags/${script.id}.json`, {
                method: 'DELETE',
                headers: { 'X-Shopify-Access-Token': token }
            });
            console.log(`✅ Script parution supprimé: ${script.src}`);
        }

        res.json({ success: true, message: `${toDelete.length} script(s) supprimé(s)` });

    } catch (error) {
        console.error('❌ Erreur désinstallation parution:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;