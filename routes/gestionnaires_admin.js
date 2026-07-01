// routes/gestionnaires_admin.js
// Routes d'administration des vendeurs (approbation, suspension, notes, suppression)
// Montées sous /api/vendeurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET /pending — vendeurs en attente d'approbation
router.get('/pending', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, seller_id, nom, email, nom_boutique, province,
                    zone_expedition, type_entreprise, plan, statut, created_at,
                    COALESCE(note_admin, '') AS note_admin,
                    snooze_jusqu_au,
                    COALESCE(nb_tentatives, 1) AS nb_tentatives,
                    derniere_relance, date_inscription
             FROM gestionnaires WHERE statut = 'pending'
             ORDER BY created_at DESC`
        );
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['PAGE_APPROBATIONS_VISITEE', req.user?.email || 'admin',
             JSON.stringify({ nb_pending: result.rows.length }), 'info']
        ).catch(() => {});
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /pending:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /suspendus — vendeurs suspendus
router.get('/suspendus', authenticateToken, isAdmin, async (req, res) => {
    try {
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'vendeurs' AND table_schema = 'public'
        `);
        const cols = colCheck.rows.map(r => r.column_name);

        const optionalCols = [
            { col: 'telephone',          alias: 'telephone' },
            { col: 'total_ventes',       alias: 'total_ventes' },
            { col: 'commission',         alias: 'commission' },
            { col: 'produits',           alias: 'nb_commandes' },
            { col: 'nb_signalements',    alias: 'nb_signalements' },
            { col: 'date_suspension',    alias: 'date_suspension' },
            { col: 'date_fin_suspension',alias: 'date_fin_suspension' },
            { col: 'raison_suspension',  alias: 'raison_suspension' },
            { col: 'suspendu_par',       alias: 'suspendu_par' },
            { col: 'gravite',            alias: 'gravite' },
        ];

        const selectParts = ['id', 'nom', 'email', 'nom_boutique', 'province', 'plan', 'statut', 'date_inscription'].map(c => `v.${c}`);
        for (const { col, alias } of optionalCols) {
            selectParts.push(cols.includes(col)
                ? `v.${col}${alias !== col ? ' AS ' + alias : ''}`
                : `NULL AS ${alias}`
            );
        }

        const result = await pool.query(`
            SELECT ${selectParts.join(', ')} FROM gestionnaires v WHERE v.statut = 'suspendu' ORDER BY v.id DESC
        `);

        const comptes = result.rows.map(v => ({
            id: v.id,
            prenom: v.nom?.split(' ')[0] || v.nom || '',
            nom: v.nom?.split(' ').slice(1).join(' ') || '',
            email: v.email,
            telephone: v.telephone || '',
            boutique: v.nom_boutique || '',
            categorie: 'Non spécifié',
            province: v.province || 'QC',
            plan: v.plan || 'Plan Standard',
            dateSuspension: v.date_suspension ? new Date(v.date_suspension).toLocaleDateString('fr-CA') : new Date().toLocaleDateString('fr-CA'),
            dateSuspensionISO: v.date_suspension || new Date().toISOString(),
            dateFin: v.date_fin_suspension ? new Date(v.date_fin_suspension).toISOString().split('T')[0] : null,
            raisonSuspension: v.raison_suspension || 'autre',
            suspendePar: v.suspendu_par || 'Admin',
            totalVentes: parseFloat(v.total_ventes) || 0,
            nbCommandes: parseInt(v.nb_commandes) || 0,
            nbSignalements: parseInt(v.nb_signalements) || 0,
            notes: [],
            statut: v.statut,
            gravite: v.gravite || 'faible',
        }));

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['PAGE_SUSPENDUS_VISITEE', req.user?.email || 'admin',
             JSON.stringify({ nb_comptes: comptes.length }), 'info']
        ).catch(e => console.error('Erreur log:', e));

        res.json(comptes);
    } catch (err) {
        console.error('❌ Erreur GET /suspendus:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /:id/notes
router.get('/:id/notes', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, to_char(date_creation, 'DD Mon YYYY') as date, auteur, contenu, type
            FROM notes WHERE gestionnaire_id = $1 ORDER BY date_creation DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Erreur GET /:id/notes:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /:id/notes
router.post('/:id/notes', authenticateToken, isAdmin, async (req, res) => {
    const { contenu, auteur, type } = req.body;
    const vendeurId = req.params.id;
    if (!contenu || contenu.trim() === '')
        return res.status(400).json({ error: 'Le contenu de la note est requis' });
    try {
        const result = await pool.query(
            `INSERT INTO notes (gestionnaire_id, auteur, contenu, type, date_creation)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id, to_char(date_creation, 'DD Mon YYYY') as date, auteur, contenu, type`,
            [vendeurId, auteur || req.user?.email || 'Admin', contenu, type || 'suspension']
        );
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['NOTE_AJOUTEE', req.user?.email || 'admin',
             JSON.stringify({ gestionnaire_id: vendeurId, type: type || 'suspension' }), 'info']
        ).catch(e => console.error('Erreur log:', e));
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Erreur POST /:id/notes:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /:id/reactiver
router.post('/:id/reactiver', authenticateToken, isAdmin, async (req, res) => {
    const vendeurId = req.params.id;
    try {
        const check = await pool.query(
            'SELECT id, email, nom, nom_boutique, statut FROM gestionnaires WHERE id = $1', [vendeurId]
        );
        if (check.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });
        if (check.rows[0].statut !== 'suspendu') return res.status(400).json({ error: 'Ce vendeur n\'est pas suspendu' });

        const colCheck2 = await pool.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'vendeurs' AND table_schema = 'public'`
        );
        const cols2 = colCheck2.rows.map(r => r.column_name);
        const setParts = ["statut = 'actif'"];
        if (cols2.includes('date_suspension'))    setParts.push('date_suspension = NULL');
        if (cols2.includes('date_fin_suspension')) setParts.push('date_fin_suspension = NULL');
        if (cols2.includes('raison_suspension'))  setParts.push('raison_suspension = NULL');
        if (cols2.includes('suspendu_par'))       setParts.push('suspendu_par = NULL');
        if (cols2.includes('updated_at'))         setParts.push('updated_at = NOW()');

        const result = await pool.query(
            `UPDATE gestionnaires SET ${setParts.join(', ')} WHERE id = $1 RETURNING id, email, nom, nom_boutique, statut`,
            [vendeurId]
        );
        await pool.query(
            `INSERT INTO notes (gestionnaire_id, auteur, contenu, type, date_creation) VALUES ($1, $2, $3, 'suspension', NOW())`,
            [vendeurId, req.user?.email || 'Admin', `Compte réactivé par ${req.user?.email || 'Admin'}`]
        );
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['VENDEUR_REACTIVE', req.user?.email || 'admin',
             JSON.stringify({ gestionnaire_id: vendeurId, email: check.rows[0].email }), 'success']
        ).catch(e => console.error('Erreur log:', e));

        res.json({ success: true, message: 'Compte réactivé avec succès', vendeur: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur POST /:id/reactiver:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/suspendre
router.put('/:id/suspendre', authenticateToken, isAdmin, async (req, res) => {
    const { raison, gravite, date_fin, notes } = req.body;
    const vendeurId = req.params.id;
    try {
        const check = await pool.query('SELECT id, email, nom FROM gestionnaires WHERE id = $1', [vendeurId]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });

        const result = await pool.query(
            `UPDATE gestionnaires
             SET statut = 'suspendu', date_suspension = NOW(), date_fin_suspension = $1,
                 raison_suspension = $2, suspendu_par = $3, gravite = $4, updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [date_fin || null, raison || 'autre', req.user?.email || 'Admin', gravite || 'faible', vendeurId]
        );

        if (notes && notes.trim() !== '') {
            await pool.query(
                `INSERT INTO notes (gestionnaire_id, auteur, contenu, type, date_creation) VALUES ($1, $2, $3, 'suspension', NOW())`,
                [vendeurId, req.user?.email || 'Admin', notes]
            );
        }
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['VENDEUR_SUSPENDU', req.user?.email || 'admin',
             JSON.stringify({ gestionnaire_id: vendeurId, raison, gravite }), 'error']
        ).catch(e => console.error('Erreur log:', e));

        res.json({ success: true, message: 'Vendeur suspendu avec succès', vendeur: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur PUT /:id/suspendre:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/note
router.put('/:id/note', authenticateToken, isAdmin, async (req, res) => {
    const { note_admin } = req.body;
    try {
        const result = await pool.query(
            `UPDATE gestionnaires SET note_admin=$1 WHERE id=$2 RETURNING id, seller_id, nom, note_admin`,
            [note_admin, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['NOTE_ADMIN_SAUVEGARDEE', req.user?.email || 'admin',
             JSON.stringify({ gestionnaire_id: req.params.id, seller_id: result.rows[0].seller_id }), 'info']
        ).catch(() => {});
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur PUT /:id/note:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/snooze
router.put('/:id/snooze', authenticateToken, isAdmin, async (req, res) => {
    const { snooze_jusqu_au } = req.body;
    try {
        const result = await pool.query(
            `UPDATE gestionnaires SET statut='snooze', snooze_jusqu_au=$1 WHERE id=$2
             RETURNING id, seller_id, nom, statut, snooze_jusqu_au`,
            [snooze_jusqu_au, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['VENDEUR_SNOOZE', req.user?.email || 'admin',
             JSON.stringify({ gestionnaire_id: req.params.id, snooze_jusqu_au }), 'info']
        ).catch(() => {});
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur PUT /:id/snooze:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/approuver
router.put('/:id/approuver', authenticateToken, isAdmin, async (req, res) => {
    const { statut } = req.body;
    try {
        if (!['actif', 'rejected', 'pending'].includes(statut))
            return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées: actif, rejected, pending' });

        const result = await pool.query(
            `UPDATE gestionnaires SET statut=$1 WHERE id=$2 RETURNING id, seller_id, nom, email, statut`,
            [statut, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });

        const v = result.rows[0];
        console.log(`🔄 Vendeur ${v.seller_id} → statut: ${statut}`);
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            [
                statut === 'actif' ? 'VENDEUR_APPROUVE' : 'VENDEUR_REJETE',
                req.user?.email || 'admin',
                JSON.stringify(v),
                statut === 'actif' ? 'success' : 'error',
            ]
        ).catch(e => console.error('Erreur log approbation:', e));

        res.json(v);
    } catch (err) {
        console.error('Erreur PUT /:id/approuver:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/statut
router.put('/:id/statut', authenticateToken, isAdmin, async (req, res) => {
    const { statut, raison_suspension, gravite, note_admin } = req.body;
    const statuts_valides = ['actif', 'suspendu', 'pending', 'banni', 'rejected'];
    if (!statuts_valides.includes(statut))
        return res.status(400).json({ error: 'Statut invalide. Valeurs acceptées: ' + statuts_valides.join(', ') });

    try {
        const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='vendeurs'`);
        const cols = colsRes.rows.map(r => r.column_name);

        const setParts = ['statut = $1', 'updated_at = NOW()'];
        const vals = [statut];
        let p = 2;

        if (statut === 'suspendu' || statut === 'banni') {
            if (cols.includes('date_suspension')) setParts.push('date_suspension = NOW()');
            if (cols.includes('raison_suspension') && raison_suspension) { setParts.push(`raison_suspension = $${p++}`); vals.push(raison_suspension); }
            if (cols.includes('gravite') && gravite) { setParts.push(`gravite = $${p++}`); vals.push(gravite); }
            if (cols.includes('suspendu_par')) { setParts.push(`suspendu_par = $${p++}`); vals.push(req.user?.email || 'Admin'); }
        } else if (statut === 'actif') {
            if (cols.includes('date_suspension'))    setParts.push('date_suspension = NULL');
            if (cols.includes('raison_suspension'))  setParts.push('raison_suspension = NULL');
            if (cols.includes('suspendu_par'))       setParts.push('suspendu_par = NULL');
            if (cols.includes('gravite'))            setParts.push("gravite = 'faible'");
        }

        vals.push(req.params.id);
        const result = await pool.query(
            `UPDATE gestionnaires SET ${setParts.join(', ')} WHERE id = $${p}
             RETURNING id, seller_id, nom, email, statut, raison_suspension, gravite, suspendu_par`,
            vals
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });

        const v = result.rows[0];
        console.log(`🔄 Statut vendeur ${v.seller_id} changé → ${statut}`);

        if (note_admin && note_admin.trim()) {
            pool.query(
                `INSERT INTO notes (gestionnaire_id, auteur, contenu, type) VALUES ($1, $2, $3, 'suspension')`,
                [req.params.id, req.user?.email || 'Admin', note_admin.trim()]
            ).catch(() => {});
        }

        const action = statut === 'suspendu' ? 'VENDEUR_SUSPENDU' : statut === 'banni' ? 'VENDEUR_BANNI' : statut === 'actif' ? 'VENDEUR_REACTIVE' : 'VENDEUR_STATUT_CHANGE';
        const niveau = statut === 'banni' ? 'critical' : statut === 'suspendu' ? 'warning' : 'info';
        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            [action, req.user?.email || 'admin',
             JSON.stringify({ id: v.id, seller_id: v.seller_id, nouveau_statut: statut, nom: v.nom }), niveau]
        ).catch(e => console.error('Erreur log statut:', e));

        res.json({ success: true, vendeur: v });
    } catch (err) {
        console.error('Erreur PUT /:id/statut:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/2fa — activer ou désactiver la F2A d'un vendeur (admin)
router.put('/:id/2fa', authenticateToken, isAdmin, async (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean')
        return res.status(400).json({ error: 'Le champ "enabled" (boolean) est requis' });

    try {
        // 1. Mettre à jour vendeurs (les deux colonnes pour cohérence)
        const result = await pool.query(
            `UPDATE gestionnaires
             SET two_factor_enabled = $1, deux_facteurs_actif = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, seller_id, nom, email, two_factor_enabled`,
            [enabled, req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Gestionnaire non trouvé' });

        const v = result.rows[0];

        // 2. Mettre à jour config_vendeur.deux_facteurs_actif (c'est ce que le login vérifie)
        await pool.query(
            `INSERT INTO config_vendeur (gestionnaire_id, deux_facteurs_actif)
             VALUES ($1, $2)
             ON CONFLICT (gestionnaire_id) DO UPDATE SET deux_facteurs_actif = $2, updated_at = CURRENT_TIMESTAMP`,
            [req.params.id, enabled]
        );

        // 3. Si on désactive, vider les codes F2A en attente pour ce vendeur
        if (!enabled) {
            await pool.query(
                `DELETE FROM pending_2fa WHERE user_id = $1 AND user_type = 'vendeur'`,
                [req.params.id]
            );
        }

        const action = enabled ? 'F2A_ACTIVEE_ADMIN' : 'F2A_DESACTIVEE_ADMIN';
        console.log(`🔐 F2A vendeur ${v.seller_id} → ${enabled ? 'activée' : 'désactivée'} par admin`);

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            [action, req.user?.email || 'admin',
             JSON.stringify({ gestionnaire_id: v.id, seller_id: v.seller_id, nom: v.nom, two_factor_enabled: enabled }), 'info']
        ).catch(e => console.error('Erreur log 2fa:', e));

        res.json({ success: true, vendeur: v });
    } catch (err) {
        console.error('Erreur PUT /:id/2fa:', err);
        res.status(500).json({ error: err.message });
    }
});


// DELETE /:id — supprimer un vendeur (admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    const safeDelete = async (sql, params, label) => {
        try {
            const r = await pool.query(sql, params);
            if (r.rowCount > 0) console.log(`🗑️  ${label}: ${r.rowCount} ligne(s)`);
        } catch (e) {
            console.warn(`⚠️  ${label} ignoré:`, e.message);
        }
    };
    try {
        const vendeurId = parseInt(req.params.id);
        if (isNaN(vendeurId)) return res.status(400).json({ error: 'ID invalide' });
        const check = await pool.query('SELECT id, nom, email, seller_id FROM gestionnaires WHERE id=$1', [vendeurId]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Vendeur non trouve' });
        const gestionnaire = check.rows[0];
        const sellerId = vendeur.seller_id;
        console.log(`🗑️  Suppression vendeur ${vendeurId} / ${sellerId} (${gestionnaire.email})`);

        await safeDelete('DELETE FROM abonnements WHERE seller_id=$1',             [vendeurId], 'abonnements');
        await safeDelete('DELETE FROM notes_internes WHERE produit_id IN (SELECT id FROM produits WHERE gestionnaire_id=$1)', [vendeurId], 'notes_internes(produits)');
        await safeDelete('DELETE FROM notes_internes WHERE gestionnaire_id=$1',         [vendeurId], 'notes_internes(vendeur)');
        await safeDelete('DELETE FROM produits WHERE gestionnaire_id=$1',               [vendeurId], 'produits');
        await safeDelete('DELETE FROM signalements WHERE gestionnaire_id=$1',           [vendeurId], 'signalements');
        await safeDelete('DELETE FROM signalements WHERE signaleur_id=$1',         [vendeurId], 'signalements(signaleur)');
        await safeDelete('DELETE FROM vendeur_badges WHERE gestionnaire_id=$1',         [vendeurId], 'vendeur_badges');
        await safeDelete('DELETE FROM messages WHERE gestionnaire_id=$1',               [vendeurId], 'messages(vendeur)');
        await safeDelete('DELETE FROM messages WHERE destinataire_id=$1',          [vendeurId], 'messages(destinataire)');
        await safeDelete('DELETE FROM messages WHERE expediteur_id=$1',            [vendeurId], 'messages(expediteur)');
        await safeDelete('DELETE FROM messagerie WHERE gestionnaire_id=$1',             [vendeurId], 'messagerie');
        await safeDelete('DELETE FROM notifications WHERE gestionnaire_id=$1',          [vendeurId], 'notifications');
        await safeDelete('DELETE FROM factures WHERE gestionnaire_id=$1',               [vendeurId], 'factures');
        await safeDelete('DELETE FROM commandes WHERE gestionnaire_id=$1',              [vendeurId], 'commandes');
        await safeDelete('DELETE FROM avis WHERE gestionnaire_id=$1',                   [vendeurId], 'avis');
        await safeDelete('DELETE FROM blogs WHERE gestionnaire_id=$1',                  [vendeurId], 'blogs');
        await safeDelete('DELETE FROM faq WHERE gestionnaire_id=$1',                    [vendeurId], 'faq');
        await safeDelete('DELETE FROM reductions WHERE gestionnaire_id=$1',             [vendeurId], 'reductions');
        await safeDelete('DELETE FROM gestionnaires_favoris WHERE gestionnaire_id=$1',       [vendeurId], 'vendeurs_favoris');
        await safeDelete('DELETE FROM vendeur_methodes_expedition WHERE gestionnaire_id=$1', [vendeurId], 'vendeur_methodes_expedition');
        await safeDelete('DELETE FROM commissions WHERE gestionnaire_id=$1',            [vendeurId], 'commissions');
        await pool.query('DELETE FROM gestionnaires WHERE id=$1', [vendeurId]);

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['VENDEUR_SUPPRIME', req.user?.email || 'admin',
             JSON.stringify({ gestionnaire_id: vendeurId, seller_id: sellerId, nom: gestionnaire.nom, email: gestionnaire.email }), 'warning']
        ).catch(e => console.warn('Audit log ignoré:', e.message));

        console.log(`✅ Vendeur ${vendeurId} / ${sellerId} supprimé avec succès`);
        res.json({ success: true, message: `Vendeur ${gestionnaire.nom} supprimé avec succès` });
    } catch (err) {
        console.error('Erreur DELETE /:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;