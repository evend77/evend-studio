// routes/configuration.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET - Récupérer toute la configuration
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM configuration_globale WHERE id = 1');
        if (result.rows.length === 0) {
            // Créer la config par défaut si elle n'existe pas
            await pool.query(
                'INSERT INTO configuration_globale (id, banniere_defaut_url, logo_defaut_url) VALUES (1, NULL, NULL)'
            );
            return res.json({ banniere_defaut_url: null, logo_defaut_url: null });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Erreur GET /api/configuration:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Sauvegarder toute la configuration
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            accepterNouveauxVendeurs,
            bloquerInscription,
            modeMaintenance,
            stripeActif,
            paypalActif,
            avisActifs,
            notifsAutoVendeurs,
            utiliserPlansVendeur,
            maxProduits,
            emailContact,
            storeEmail,
            domaine,
            contactNumber,
            currency,
            customCurrencySymbol,
            langue,
            timeZone,
            dateFormat,
            timeFormat,
            footerText,
            banniereActive,
            banniereTitre,
            banniereMessage,
            banniereType,
            // Images par défaut
            banniere_defaut_url,
            logo_defaut_url
        } = req.body;

        console.log('📦 Sauvegarde configuration - banniere_defaut_url:', banniere_defaut_url);
        console.log('📦 Sauvegarde configuration - logo_defaut_url:', logo_defaut_url);

        // Mettre à jour la table configuration_globale
        await pool.query(
            `UPDATE configuration_globale 
             SET banniere_defaut_url = $1,
                 logo_defaut_url = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = 1`,
            [banniere_defaut_url, logo_defaut_url]
        );

        // Ici tu sauvegarderais aussi tous les autres paramètres
        // dans une table config ou autre...

        res.json({ 
            success: true, 
            message: 'Configuration sauvegardée',
            banniere_defaut_url,
            logo_defaut_url
        });
    } catch (err) {
        console.error('❌ Erreur POST /api/configuration:', err);
        res.status(500).json({ error: err.message });
    }
});

// Route spécifique pour uploader les images par défaut
router.post('/upload-default-image', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { url, type } = req.body; // type = 'banniere' ou 'logo'
        
        if (!url || !type) {
            return res.status(400).json({ error: 'URL et type requis' });
        }

        const field = type === 'banniere' ? 'banniere_defaut_url' : 'logo_defaut_url';

        await pool.query(
            `UPDATE configuration_globale SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
            [url]
        );

        res.json({ success: true, url });
    } catch (err) {
        console.error('❌ Erreur POST /api/configuration/upload-default-image:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
