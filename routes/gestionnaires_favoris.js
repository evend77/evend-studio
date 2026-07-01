console.log('✅ ROUTES FAVORIS CHARGÉES - Fichier vendeurs_favoris.js');

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Vérifier si un vendeur est dans les favoris
router.get('/vendeur/:vendeurId/favori/check', async (req, res) => {
    try {
        const { vendeurId } = req.params;
        const acheteurId = req.headers['x-acheteur-id'];
        
        if (!acheteurId) {
            return res.json({ isFavori: false });
        }
        
        const result = await pool.query(
            'SELECT id FROM vendeurs_favoris WHERE acheteur_id = $1 AND vendeur_id = $2',
            [acheteurId, vendeurId]
        );
        
        res.json({ isFavori: result.rows.length > 0 });
    } catch (error) {
        console.error('Erreur vérification favori:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Ajouter un vendeur aux favoris
router.post('/vendeur/:vendeurId/favori', async (req, res) => {
    try {
        const { vendeurId } = req.params;
        const acheteurId = req.headers['x-acheteur-id'];
        
        if (!acheteurId) {
            return res.status(401).json({ error: 'Vous devez être connecté' });
        }
        
        // Vérifier si déjà favori
        const existing = await pool.query(
            'SELECT id FROM vendeurs_favoris WHERE acheteur_id = $1 AND vendeur_id = $2',
            [acheteurId, vendeurId]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Déjà dans les favoris' });
        }
        
        // Ajouter aux favoris
        await pool.query(
            'INSERT INTO vendeurs_favoris (acheteur_id, vendeur_id) VALUES ($1, $2)',
            [acheteurId, vendeurId]
        );
        
        res.json({ success: true, message: 'Vendeur ajouté aux favoris' });
    } catch (error) {
        console.error('Erreur ajout favori:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Retirer un vendeur des favoris
router.delete('/vendeur/:vendeurId/favori', async (req, res) => {
    try {
        const { vendeurId } = req.params;
        const acheteurId = req.headers['x-acheteur-id'];
        
        if (!acheteurId) {
            return res.status(401).json({ error: 'Vous devez être connecté' });
        }
        
        await pool.query(
            'DELETE FROM vendeurs_favoris WHERE acheteur_id = $1 AND vendeur_id = $2',
            [acheteurId, vendeurId]
        );
        
        res.json({ success: true, message: 'Vendeur retiré des favoris' });
    } catch (error) {
        console.error('Erreur retrait favori:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer tous les vendeurs favoris d'un acheteur
router.get('/acheteur/:acheteurId/vendeurs', async (req, res) => {
    try {
        const { acheteurId } = req.params;
        
        const result = await pool.query(`
            SELECT 
                v.id,
                v.nom_boutique,
                v.logo_url,
                v.banniere_url,
                v.note_moyenne,
                v.nombre_avis,
                v.total_produits,
                v.date_inscription,
                v.region_admin as region,
                v.zone_expedition,
                v.description as categorie,
                vf.created_at as date_favori
            FROM vendeurs_favoris vf
            JOIN vendeurs v ON vf.vendeur_id = v.id
            WHERE vf.acheteur_id = $1
            ORDER BY vf.created_at DESC
        `, [acheteurId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération favoris:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;