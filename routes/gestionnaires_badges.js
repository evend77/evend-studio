// routes/vendeurs_badges.js
// Routes pour les badges (côté admin et côté vendeur)
// Montées sous /api/vendeurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET /badges — liste badges de tous les vendeurs (admin)
router.get('/badges', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                v.id AS vendeur_id, v.nom AS vendeur_nom, v.email AS vendeur_email,
                v.nom_boutique AS boutique_nom,
                COALESCE(
                    json_agg(json_build_object(
                        'id', b.id, 'nom', b.nom, 'icone', b.icone,
                        'couleur', b.couleur, 'niveau', b.niveau, 'statut', b.statut
                    )) FILTER (WHERE b.id IS NOT NULL),
                    '[]'
                ) AS badges
            FROM vendeurs v
            LEFT JOIN vendeur_badges vb ON v.id = vb.vendeur_id
            LEFT JOIN badges b ON vb.badge_id = b.id
            GROUP BY v.id, v.nom, v.email, v.nom_boutique
            ORDER BY v.nom
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /badges:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/badges — attribuer badges à un vendeur (admin)
router.put('/:id/badges', authenticateToken, isAdmin, async (req, res) => {
    const vendeurId = parseInt(req.params.id);
    const { badge_ids } = req.body;
    try {
        await pool.query('DELETE FROM vendeur_badges WHERE vendeur_id = $1', [vendeurId]);
        if (Array.isArray(badge_ids) && badge_ids.length > 0) {
            for (const badgeId of badge_ids) {
                await pool.query(
                    'INSERT INTO vendeur_badges (vendeur_id, badge_id, date_attribution) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
                    [vendeurId, String(badgeId)]
                );
            }
        }
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['ATTRIBUTION_BADGES', req.user?.email || 'admin', JSON.stringify({ vendeurId, badge_ids }), 'info']
        ).catch(e => console.error('Erreur log:', e));
        res.json({ success: true, vendeur_id: vendeurId, badge_ids: badge_ids || [] });
    } catch (err) {
        console.error('Erreur PUT /:id/badges:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:id/badges — retirer tous les badges d'un vendeur (admin)
router.delete('/:id/badges', authenticateToken, isAdmin, async (req, res) => {
    const vendeurId = parseInt(req.params.id);
    try {
        await pool.query('DELETE FROM vendeur_badges WHERE vendeur_id = $1', [vendeurId]);
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['SUPPRESSION_BADGES_VENDEUR', req.user?.email || 'admin', JSON.stringify({ vendeurId }), 'error']
        ).catch(e => console.error('Erreur log:', e));
        res.json({ success: true, vendeur_id: vendeurId });
    } catch (err) {
        console.error('Erreur DELETE /:id/badges:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /:vendeurId/badges — badges d'un vendeur (vendeur ou admin)
router.get('/:vendeurId/badges', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const tableCheck = await pool.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendeur_badges');
        `);
        if (!tableCheck.rows[0].exists) return res.json([]);

        const result = await pool.query(`
            SELECT vb.id, vb.vendeur_id, vb.badge_id, vb.date_attribution, vb.statut,
                   b.id AS badge_id_ref, b.nom AS badge_nom, b.description AS badge_description,
                   b.icone AS badge_icone, b.couleur AS badge_couleur, b.niveau AS badge_niveau,
                   b.critere AS badge_critere, b.statut AS badge_statut
            FROM vendeur_badges vb
            JOIN badges b ON vb.badge_id = b.id
            WHERE vb.vendeur_id = $1 AND vb.statut = 'actif' AND b.statut = 'actif'
            ORDER BY b.niveau ASC, vb.date_attribution DESC
        `, [vendeurId]);

        const badges = result.rows.map(row => ({
            id: row.id,
            badge_id: row.badge_id,
            vendeur_id: row.vendeur_id,
            date_attribution: row.date_attribution,
            statut: row.statut,
            badge: {
                id: row.badge_id_ref, nom: row.badge_nom,
                description: row.badge_description, icone: row.badge_icone,
                couleur: row.badge_couleur, niveau: row.badge_niveau,
                critere: row.badge_critere, statut: row.badge_statut
            }
        }));
        console.log(`✅ ${badges.length} badges récupérés pour le vendeur ${vendeurId}`);
        res.json(badges);
    } catch (err) {
        console.error('❌ Erreur GET /:vendeurId/badges:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /:vendeurId/badges/stats
router.get('/:vendeurId/badges/stats', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const tableCheck = await pool.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendeur_badges');
        `);
        if (!tableCheck.rows[0].exists) {
            return res.json({
                total: 0,
                parNiveau: { niveau1: 0, niveau2: 0, niveau3: 0, niveau4: 0, niveau5: 0 },
                dernierBadge: null
            });
        }

        const statsResult = await pool.query(`
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN b.niveau = 1 THEN 1 END) as niveau1,
                   COUNT(CASE WHEN b.niveau = 2 THEN 1 END) as niveau2,
                   COUNT(CASE WHEN b.niveau = 3 THEN 1 END) as niveau3,
                   COUNT(CASE WHEN b.niveau = 4 THEN 1 END) as niveau4,
                   COUNT(CASE WHEN b.niveau = 5 THEN 1 END) as niveau5
            FROM vendeur_badges vb
            JOIN badges b ON vb.badge_id = b.id
            WHERE vb.vendeur_id = $1 AND vb.statut = 'actif' AND b.statut = 'actif'
        `, [vendeurId]);

        const dernierResult = await pool.query(`
            SELECT vb.id, vb.date_attribution,
                   b.id as badge_id, b.nom as badge_nom, b.icone as badge_icone,
                   b.couleur as badge_couleur, b.niveau as badge_niveau
            FROM vendeur_badges vb
            JOIN badges b ON vb.badge_id = b.id
            WHERE vb.vendeur_id = $1 AND vb.statut = 'actif' AND b.statut = 'actif'
            ORDER BY vb.date_attribution DESC LIMIT 1
        `, [vendeurId]);

        const stats = statsResult.rows[0];
        res.json({
            total: parseInt(stats.total) || 0,
            parNiveau: {
                niveau1: parseInt(stats.niveau1) || 0,
                niveau2: parseInt(stats.niveau2) || 0,
                niveau3: parseInt(stats.niveau3) || 0,
                niveau4: parseInt(stats.niveau4) || 0,
                niveau5: parseInt(stats.niveau5) || 0
            },
            dernierBadge: dernierResult.rows[0] ? {
                id: dernierResult.rows[0].id,
                date_attribution: dernierResult.rows[0].date_attribution,
                badge: {
                    id: dernierResult.rows[0].badge_id,
                    nom: dernierResult.rows[0].badge_nom,
                    icone: dernierResult.rows[0].badge_icone,
                    couleur: dernierResult.rows[0].badge_couleur,
                    niveau: dernierResult.rows[0].badge_niveau
                }
            } : null
        });
    } catch (err) {
        console.error('❌ Erreur GET /:vendeurId/badges/stats:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;