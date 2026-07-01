// routes/vendeurs_profil.js
// Routes pour le profil vendeur, le plan et les mots de passe
// Montées sous /api/vendeurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const bcrypt  = require('bcrypt');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET /profil — profil du vendeur connecté
router.get('/profil', authenticateToken, async (req, res) => {
    try {
        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'vendeurs'
        `);
        const allCols = colCheck.rows.map(r => r.column_name);
        const optionalCols = [
            'zone_expedition','type_entreprise','region_admin',
            'num_civique','rue','ville','code_postal','pays',
            'description','description_longue',
            'politique_retours','politique_livraison','jours_remboursement',
            'est_entreprise_enregistree','province_entreprise',
            'num_entreprise_provincial','no_tps','no_taxe_provinciale',
            'banniere_url','logo_url'
        ].filter(c => allCols.includes(c));

        const selectCols = [
            'id','seller_id','nom','email','nom_boutique','province',
            'telephone','plan','statut','date_inscription',
            ...optionalCols
        ].join(', ');

        const result = await pool.query(`SELECT ${selectCols} FROM vendeurs WHERE id = $1`, [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vendeur non trouvé' });
        console.log('GET /profil — ✅ chargé pour:', result.rows[0].email);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Erreur GET /profil:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /profil — mise à jour profil
router.put('/profil', authenticateToken, async (req, res) => {
    try {
        const {
            vendeur_id, nom, email, nom_boutique, telephone, province,
            zone_expedition, type_entreprise, region_admin,
            num_civique, rue, ville, code_postal, pays, description,
            politique_retours, politique_livraison, jours_remboursement,
            est_entreprise_enregistree, province_entreprise,
            num_entreprise_provincial, no_tps, no_taxe_provinciale,
            banniere_url, logo_url
        } = req.body;

        const isAdminUser = req.user.role === 'admin' || req.user.role === 'administration';
        const targetId = (isAdminUser && vendeur_id) ? parseInt(vendeur_id) : req.user.id;

        const colCheck = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'vendeurs' AND column_name IN (
                'region_admin','zone_expedition','type_entreprise',
                'num_civique','rue','ville','code_postal','pays',
                'description','description_longue','politique_retours','politique_livraison',
                'jours_remboursement','est_entreprise_enregistree','province_entreprise',
                'num_entreprise_provincial','no_tps','no_taxe_provinciale','banniere_url','logo_url'
            )
        `);
        const cols = colCheck.rows.map(r => r.column_name);

        const sets = [
            'nom = COALESCE($1, nom)',
            'nom_boutique = COALESCE($2, nom_boutique)',
            'telephone = COALESCE($3, telephone)',
            'province = COALESCE($4, province)',
            'email = COALESCE($5, email)',
        ];
        const vals = [nom || null, nom_boutique || null, telephone || null, province || null, email || null];
        let idx = 6;

        const addCol = (colName, val) => {
            if (cols.includes(colName)) {
                sets.push(`${colName} = $${idx}`);
                vals.push(val !== undefined ? val : null);
                idx++;
            }
        };

        addCol('zone_expedition',            zone_expedition || null);
        addCol('type_entreprise',            type_entreprise || null);
        addCol('region_admin',               region_admin || null);
        addCol('num_civique',                num_civique || null);
        addCol('rue',                        rue || null);
        addCol('ville',                      ville || null);
        addCol('code_postal',                code_postal || null);
        addCol('pays',                       pays || null);
        addCol('description',                description || null);
        addCol('description_longue',         description || null);
        addCol('politique_retours',          politique_retours || null);
        addCol('politique_livraison',        politique_livraison || null);
        addCol('jours_remboursement',        jours_remboursement ? parseInt(jours_remboursement) : null);
        addCol('est_entreprise_enregistree', est_entreprise_enregistree !== undefined ? est_entreprise_enregistree : null);
        addCol('province_entreprise',        province_entreprise || null);
        addCol('num_entreprise_provincial',  num_entreprise_provincial || null);
        addCol('no_tps',                     no_tps || null);
        addCol('no_taxe_provinciale',        no_taxe_provinciale || null);
        addCol('banniere_url',               banniere_url || null);
        addCol('logo_url',                   logo_url || null);

        vals.push(targetId);
        const sql = `UPDATE vendeurs SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await pool.query(sql, vals);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vendeur non trouve' });

        console.log(`PUT /profil — mise a jour reussie pour: ${result.rows[0].email} (id: ${targetId})`);
        res.json({ success: true, vendeur: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur PUT /profil:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /profil/plan — changer le forfait
// Met à jour vendeurs.plan ET abonnements.plan
router.put('/profil/plan', authenticateToken, async (req, res) => {
    try {
        const { plan } = req.body;
        const vendeurId = req.user.id;

        // 1. Mettre à jour vendeurs.plan
        const result = await pool.query(
            'UPDATE vendeurs SET plan = $1 WHERE id = $2 RETURNING id, email, nom, plan',
            [plan || null, vendeurId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vendeur non trouve' });

        // 2. Mettre à jour abonnements.plan (abonnements.seller_id = vendeurs.id)
        const aboRes = await pool.query(
            `UPDATE abonnements SET plan = $1 WHERE seller_id = $2 AND statut = 'actif' RETURNING *`,
            [plan, vendeurId]
        );

        // 3. Si aucun abonnement actif, en créer un
        if (aboRes.rowCount === 0) {
            const planRes = await pool.query(
                `SELECT prix_ht FROM plans WHERE LOWER(TRIM(nom)) = LOWER(TRIM($1)) LIMIT 1`,
                [plan]
            );
            const prixHT = parseFloat(planRes.rows[0]?.prix_ht) || 0;
            await pool.query(
                `INSERT INTO abonnements 
                    (seller_id, nom_boutique, email, plan, plan_type, statut, paiement_statut, date_debut, date_fin, prix_mensuel)
                 SELECT $1, nom_boutique, email, $2, 'mensuel', 'actif', 'Actif',
                        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $3
                 FROM vendeurs WHERE id = $1`,
                [vendeurId, plan, prixHT]
            );
            console.log(`PUT /profil/plan — abonnement créé pour vendeur ${vendeurId}`);
        }

        console.log(`PUT /profil/plan — forfait changé: ${result.rows[0].email} → ${plan} | abonnements mis à jour: ${aboRes.rowCount}`);
        res.json({ success: true, plan: result.rows[0].plan });
    } catch (err) {
        console.error('Erreur PUT /profil/plan:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /profil/mot-de-passe — vendeur change son propre mdp
router.put('/profil/mot-de-passe', authenticateToken, async (req, res) => {
    try {
        const { motDePasseActuel, nouveauMotDePasse } = req.body;
        if (!motDePasseActuel || !nouveauMotDePasse)
            return res.status(400).json({ error: 'Champs requis manquants' });

        const result = await pool.query('SELECT mot_de_passe FROM vendeurs WHERE id=$1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vendeur non trouvé' });

        const ok = await bcrypt.compare(motDePasseActuel, result.rows[0].mot_de_passe);
        if (!ok) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

        const hash = await bcrypt.hash(nouveauMotDePasse, 10);
        await pool.query('UPDATE vendeurs SET mot_de_passe=$1 WHERE id=$2', [hash, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erreur PUT /profil/mot-de-passe:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:id/mot-de-passe — ADMIN change mdp d'un vendeur
router.put('/:id/mot-de-passe', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        const { nouveau_mot_de_passe } = req.body;
        if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 8)
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caracteres' });

        const vendeur = await pool.query('SELECT id, nom, email FROM vendeurs WHERE id=$1', [vendeurId]);
        if (vendeur.rows.length === 0) return res.status(404).json({ error: 'Vendeur non trouve' });

        const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
        await pool.query('UPDATE vendeurs SET mot_de_passe=$1 WHERE id=$2', [hash, vendeurId]);
        console.log(`✅ Admin ${req.user.id} a change le mot de passe du vendeur ${vendeurId}`);
        res.json({ success: true, message: 'Mot de passe mis a jour avec succes' });
    } catch (err) {
        console.error('Erreur PUT /:id/mot-de-passe:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;