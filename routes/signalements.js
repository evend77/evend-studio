// routes/signalements.js — Signalements & Notes
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// =====================================================================
// NOTES
// =====================================================================

// DELETE note
router.delete('/notes/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM notes WHERE id = $1 RETURNING id, vendeur_id',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Note non trouvée' });
        
        // Audit log
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) 
             VALUES ($1, $2, $3::jsonb, $4)`,
            ['NOTE_SUPPRIMEE', req.user?.email || 'admin',
             JSON.stringify({ note_id: req.params.id, vendeur_id: result.rows[0].vendeur_id }), 'info']
        ).catch(() => {});
        
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Erreur DELETE note:', err);
        res.status(500).json({ error: err.message });
    }
});

// =====================================================================
// SIGNALEMENTS
// =====================================================================

// ✅ GET tous les signalements (URL: /api/signalements)
router.get('/', async (req, res) => {
    try {
        console.log('🚀 API /signalements appelée');
        
        const { statut, recherche, page = 1, limit = 20 } = req.query;
        
        let query = `
            SELECT 
                s.*,
                COALESCE(v.nom, 'Vendeur inconnu') as vendeur_nom,
                COALESCE(v.boutique, 'Boutique inconnue') as vendeur_boutique,
                to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM signalements s
            LEFT JOIN vendeurs v ON v.id = s.vendeur_id
        `;
        
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        // Filtre par statut
        if (statut) {
            const statuts = statut.split(',');
            if (statuts.length === 1) {
                conditions.push(`s.statut = $${paramIndex++}`);
                params.push(statut);
            } else {
                conditions.push(`s.statut = ANY($${paramIndex++}::text[])`);
                params.push(statuts);
            }
        }
        
        // Recherche textuelle
        if (recherche) {
            conditions.push(`(
                s.signaleur_nom ILIKE $${paramIndex} OR
                s.signaleur_email ILIKE $${paramIndex} OR
                s.raison ILIKE $${paramIndex} OR
                v.nom ILIKE $${paramIndex} OR
                v.boutique ILIKE $${paramIndex}
            )`);
            params.push(`%${recherche}%`);
            paramIndex++;
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY s.created_at DESC';
        
        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), offset);
        
        console.log('🔍 SQL Query:', query);
        console.log('📦 Params:', params);
        
        const result = await pool.query(query, params);
        
        // Compter le total pour la pagination
        let countQuery = 'SELECT COUNT(*) FROM signalements s LEFT JOIN vendeurs v ON v.id = s.vendeur_id';
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        const countResult = await pool.query(countQuery, params.slice(0, -2)); // Enlever les params de pagination
        
        console.log(`✅ ${result.rows.length} signalements trouvés sur ${countResult.rows[0].count} total`);
        
        res.json({
            signalements: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
        });
        
    } catch (err) {
        console.error('❌ Erreur GET /api/signalements:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET signalements d'un vendeur spécifique (URL: /api/signalements/vendeur/:id)
router.get('/vendeur/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                s.id,
                s.vendeur_id,
                s.signaleur_type,
                s.signaleur_id,
                s.signaleur_nom,
                s.signaleur_email,
                s.categorie,
                s.raison,
                s.preuve_url,
                s.statut,
                s.note_admin,
                s.traite_par,
                s.date_traitement,
                to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
            FROM signalements s
            WHERE s.vendeur_id = $1
            ORDER BY s.created_at DESC
        `, [req.params.id]);

        res.json(result.rows);
    } catch (err) {
        console.error('❌ Erreur GET signalements vendeur:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET count nouveaux signalements (URL: /api/signalements/count)
router.get('/count', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT COUNT(*)::int as nouveaux FROM signalements WHERE statut = 'nouveau'"
        );
        res.json({ nouveaux: result.rows[0].nouveaux });
    } catch (err) {
        console.error('❌ Erreur GET count:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ POST créer un signalement (URL: /api/signalements)
router.post('/', async (req, res) => {
    console.log('\n📝 NOUVEAU SIGNALEMENT');
    
    try {
        const { vendeur_id, signaleur_nom, signaleur_email, categorie, raison } = req.body;

        // Validation de base
        if (!vendeur_id) {
            return res.status(400).json({ error: 'ID vendeur requis' });
        }
        if (!categorie) {
            return res.status(400).json({ error: 'Catégorie requise' });
        }
        if (!raison || raison.length < 5) {
            return res.status(400).json({ error: 'Description trop courte (min 5 caractères)' });
        }

        // Vérifier vendeur
        const vendeur = await pool.query('SELECT id, nom FROM vendeurs WHERE id = $1', [vendeur_id]);
        if (vendeur.rows.length === 0) {
            return res.status(404).json({ error: 'Vendeur non trouvé' });
        }

        // INSERT direct
        const result = await pool.query(`
            INSERT INTO signalements 
                (vendeur_id, signaleur_nom, signaleur_email, categorie, raison, statut)
            VALUES ($1, $2, $3, $4, $5, 'nouveau')
            RETURNING id
        `, [
            vendeur_id,
            signaleur_nom || 'Anonyme',
            signaleur_email || null,
            categorie,
            raison
        ]);

        console.log(`✅ Signalement ID: ${result.rows[0].id} créé`);

        // Audit log (asynchrone - ne bloque pas)
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) 
             VALUES ($1, $2, $3::jsonb, $4)`,
            ['SIGNALEMENT_CREE', signaleur_email || 'anonyme',
             JSON.stringify({ 
               vendeur_id, 
               vendeur_nom: vendeur.rows[0].nom,
               signalement_id: result.rows[0].id 
             }), 'info']
        ).catch(e => console.error('❌ Audit log error:', e));

        res.status(201).json({ 
            success: true, 
            id: result.rows[0].id,
            message: 'Signalement envoyé'
        });

    } catch (err) {
        console.error('❌ ERREUR POST signalement:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ GET un signalement spécifique (URL: /api/signalements/:id)
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                COALESCE(v.nom, 'Vendeur inconnu') as vendeur_nom,
                COALESCE(v.boutique, 'Boutique inconnue') as vendeur_boutique,
                to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM signalements s
            LEFT JOIN vendeurs v ON v.id = s.vendeur_id
            WHERE s.id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Signalement non trouvé' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Erreur GET signalement:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ PUT mise à jour statut (URL: /api/signalements/:id)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    const { statut, note_admin } = req.body;
    const statuts_valides = ['nouveau', 'vu', 'traite', 'rejete'];

    if (!statuts_valides.includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide' });
    }

    try {
        let query = 'UPDATE signalements SET statut = $1, updated_at = NOW()';
        const params = [statut];
        let paramIndex = 2;

        if (note_admin) {
            query += `, note_admin = CONCAT(COALESCE(note_admin, ''), E'\n[' || NOW() || '] ' || $${paramIndex})`;
            params.push(note_admin);
            paramIndex++;
        }

        if (statut === 'traite' || statut === 'rejete') {
            query += `, traite_par = $${paramIndex}, date_traitement = NOW()`;
            params.push(req.user?.email || 'admin');
            paramIndex++;
        }

        query += ' WHERE id = $' + paramIndex + ' RETURNING *';
        params.push(req.params.id);

        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Signalement non trouvé' });
        }

        res.json({ success: true, signalement: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur PUT:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ DELETE signalement (URL: /api/signalements/:id)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM signalements WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Signalement non trouvé' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('❌ Erreur DELETE:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
