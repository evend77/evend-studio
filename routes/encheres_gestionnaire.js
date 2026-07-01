// routes/encheres_vendeur.js
// POST /api/encheres        — creer une enchere depuis le modal vendeur
// GET  /api/encheres        — liste des encheres du vendeur connecte
// GET  /api/encheres/:id    — detail d'une enchere
// PATCH /api/encheres/:id/demarrer  — demarrer manuellement une enchere a_venir
// PATCH /api/encheres/:id/terminer  — terminer manuellement une enchere en_cours

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Helper : recuperer le token Shopify ─────────────────────────────────────
// Priorite 1 : variable d'environnement SHOPIFY_ACCESS_TOKEN (token valide Full OAuth)
// Priorite 2 : token en BD dans vendeurs (fallback)
async function getShopifyCredentials(vendeurId) {
    try {
        const domain = process.env.SHOPIFY_SHOP_DOMAIN;

        // Priorite 1 : env var (toujours le plus a jour)
        if (process.env.SHOPIFY_ACCESS_TOKEN) {
            return { domain, token: process.env.SHOPIFY_ACCESS_TOKEN };
        }

        // Priorite 2 : BD vendeurs
        const r = await pool.query(
            'SELECT shop_domain, shopify_access_token FROM vendeurs WHERE id = $1',
            [vendeurId]
        );
        if (!r.rows[0]?.shopify_access_token) return null;
        return {
            domain: r.rows[0].shop_domain || domain,
            token:  r.rows[0].shopify_access_token,
        };
    } catch (e) {
        console.warn('Impossible de charger credentials Shopify:', e.message);
        return null;
    }
}

// ─── Helper : mettre a jour les tags Shopify d'un produit ───────────────────
// tagsAAjouter et tagsARetirer sont des tableaux de strings
async function syncTagsShopify(shopifyId, tagsAAjouter, tagsARetirer, creds) {
    if (!shopifyId || !creds) return { synced: false, reason: 'Pas de shopify_id ou credentials' };

    try {
        const baseUrl = `https://${creds.domain}/admin/api/2024-10`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': creds.token,
        };

        // 1. Recuperer les tags actuels du produit
        const getRes = await fetch(`${baseUrl}/products/${shopifyId}.json?fields=id,tags`, { headers });
        if (!getRes.ok) throw new Error(`Shopify GET product ${shopifyId}: ${getRes.status}`);
        const getData = await getRes.json();
        const tagsActuels = (getData.product?.tags || '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        // 2. Retirer les tags specifiques + ajouter les nouveaux
        const tagsFinaux = [
            ...tagsActuels.filter(t => !tagsARetirer.includes(t)),
            ...tagsAAjouter.filter(t => !tagsActuels.includes(t)),
        ];

        // 3. Mettre a jour sur Shopify
        const putRes = await fetch(`${baseUrl}/products/${shopifyId}.json`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ product: { id: shopifyId, tags: tagsFinaux.join(', ') } }),
        });

        if (!putRes.ok) {
            const err = await putRes.json().catch(() => ({}));
            throw new Error(`Shopify PUT tags: ${JSON.stringify(err)}`);
        }

        console.log(`Tags Shopify mis a jour pour produit ${shopifyId}: +[${tagsAAjouter}] -[${tagsARetirer}]`);
        return { synced: true, tags: tagsFinaux };

    } catch (e) {
        console.warn('Erreur syncTagsShopify:', e.message);
        return { synced: false, error: e.message };
    }
}

// ─── Helper : calculer l'increment minimum selon les bid_rules de la config ──
async function calculerIncrementMin(prixBase) {
    try {
        const r = await pool.query('SELECT bid_rules FROM enchere_config WHERE id = 1');
        const rules = r.rows[0]?.bid_rules || [];
        const prix = parseFloat(prixBase) || 0;

        // Trouver la regle qui correspond au prix de base
        for (const rule of rules) {
            const from = parseFloat(rule.from) || 0;
            const to   = parseFloat(rule.to)   || Infinity;
            if (prix >= from && prix < to) {
                return parseFloat(rule.minGap) || 1.00;
            }
        }
        return 1.00; // Defaut si aucune regle ne correspond
    } catch (e) {
        return 1.00;
    }
}

// =============================================================================
// POST /api/encheres
// Cree une enchere depuis le modal vendeur
// Body: { produit_id, date_debut, date_fin, prix_base, prix_reserve,
//         procuration, popcorn, popcorn_delai_mises, popcorn_delai_offres,
//         popcorn_nb_fois, commencer }
// commencer=true  → statut 'en_cours' + tags evend_on_auction + active_bidding
// commencer=false → statut 'a_venir'  + tag  evend_upcoming_auction
// =============================================================================
router.post('/', authenticateToken, async (req, res) => {
    const vendeurId = req.user.id;
    const {
        produit_id,
        date_debut,
        date_fin,
        prix_base,
        prix_reserve,
        procuration   = false,
        popcorn       = false,
        popcorn_delai_mises  = 5,
        popcorn_delai_offres = 10,
        popcorn_nb_fois      = 3,
        commencer     = false,
    } = req.body;

    // ── Validation ───────────────────────────────────────────────────────────
    if (!produit_id || !date_debut || !date_fin || !prix_base) {
        return res.status(400).json({
            error: 'Champs obligatoires manquants: produit_id, date_debut, date_fin, prix_base'
        });
    }

    if (new Date(date_fin) <= new Date(date_debut)) {
        return res.status(400).json({ error: 'La date de fin doit etre apres la date de debut.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── 1. Verifier que le produit appartient au vendeur ─────────────────
        const produitRes = await client.query(
            'SELECT id, nom, shopify_id, statut FROM produits WHERE id = $1 AND vendeur_id = $2',
            [produit_id, vendeurId]
        );
        if (produitRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Produit introuvable ou acces refuse.' });
        }
        const produit = produitRes.rows[0];

        // ── 2. Verifier qu'il n'y a pas deja une enchere active sur ce produit ─
        const enchereActive = await client.query(
            `SELECT id FROM encheres
             WHERE produit_id = $1
               AND statut IN ('a_venir', 'en_cours')`,
            [produit_id]
        );
        if (enchereActive.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                error: 'Ce produit a deja une enchere active ou programmee.',
                enchere_id: enchereActive.rows[0].id
            });
        }

        // ── 3. Calculer l'increment minimum selon la config admin ─────────────
        const incrementMin = await calculerIncrementMin(prix_base);

        // ── 4. Determiner le statut selon commencer ───────────────────────────
        const statut = commencer ? 'en_cours' : 'a_venir';

        // ── 5. Inserer l'enchere en BD ────────────────────────────────────────
        const enchereRes = await client.query(`
            INSERT INTO encheres (
                produit_id, vendeur_id,
                date_debut, date_fin,
                prix_base, prix_reserve,
                procuration, popcorn,
                popcorn_delai_mises, popcorn_delai_offres, popcorn_nb_fois,
                statut, increment_min,
                created_at, updated_at
            ) VALUES (
                $1, $2,
                $3, $4,
                $5, $6,
                $7, $8,
                $9, $10, $11,
                $12, $13,
                NOW(), NOW()
            ) RETURNING *`,
            [
                produit_id, vendeurId,
                date_debut, date_fin,
                parseFloat(prix_base), prix_reserve ? parseFloat(prix_reserve) : null,
                procuration, popcorn,
                parseInt(popcorn_delai_mises)  || 5,
                parseInt(popcorn_delai_offres) || 10,
                parseInt(popcorn_nb_fois)      || 3,
                statut, incrementMin,
            ]
        );
        const enchere = enchereRes.rows[0];

        // ── 6. Mettre a jour le type_vente du produit → 'enchere' ─────────────
        await client.query(
            `UPDATE produits SET type_vente = 'enchere', updated_at = NOW() WHERE id = $1`,
            [produit_id]
        );

        await client.query('COMMIT');

        // ── 7. Sync tags Shopify (hors transaction — une erreur Shopify ne rollback pas la BD) ─
        let shopifyResult = { synced: false };
        if (produit.shopify_id) {
            const creds = await getShopifyCredentials(vendeurId);

            let tagsAAjouter, tagsARetirer;

            if (commencer) {
                // Enchere demarree immediatement
                tagsAAjouter = ['evend_on_auction', 'active_bidding'];
                tagsARetirer = ['evend_upcoming_auction', 'evend_end_auction'];
            } else {
                // Enchere programmee (future)
                tagsAAjouter = ['evend_upcoming_auction'];
                tagsARetirer = ['evend_on_auction', 'active_bidding', 'evend_end_auction'];
            }

            shopifyResult = await syncTagsShopify(
                produit.shopify_id,
                tagsAAjouter,
                tagsARetirer,
                creds
            );

            // Sauvegarder les tags actifs dans la BD enchere
            if (shopifyResult.synced) {
                await pool.query(
                    'UPDATE encheres SET shopify_tags_actifs = $1 WHERE id = $2',
                    [tagsAAjouter, enchere.id]
                );
            }
        }

        // ── 8. Reponse ────────────────────────────────────────────────────────
        const message = commencer
            ? 'Enchere creee et demarree avec succes!'
            : 'Enchere sauvegardee. Elle demarrera a la date choisie.';

        console.log(`Enchere #${enchere.id} creee pour produit #${produit_id} (vendeur ${vendeurId}) — statut: ${statut}`);

        res.status(201).json({
            success:  true,
            message,
            enchere,
        });

    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Erreur POST /api/encheres:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// =============================================================================
// GET /api/encheres
// Liste des encheres du vendeur connecte avec TOUTES les infos
// (participants, mises, gagnant, encherisseurs)
// =============================================================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                e.id,
                e.produit_id,
                e.date_debut,
                e.date_fin,
                e.prix_base,
                e.prix_reserve,
                e.mise_courante,
                e.nb_mises,
                e.statut,
                e.increment_min,
                e.reserve_atteinte,
                e.popcorn,
                e.popcorn_delai_mises,
                e.popcorn_delai_offres,
                e.popcorn_nb_fois,
                p.nom AS produit_nom,
                p.image AS produit_image,
                p.prix AS produit_prix,
                -- Nombre d'enchérisseurs uniques
                COALESCE(
                    (SELECT COUNT(DISTINCT acheteur_id) 
                     FROM enchere_participants 
                     WHERE enchere_id = e.id),
                    0
                ) AS nb_encherisseurs,
                -- Informations du gagnant (si enchère terminée)
                eg.acheteur_nom AS gagnant_nom,
                eg.acheteur_email AS gagnant_email,
                eg.montant_gagnant,
                eg.statut_paiement,
                -- Liste des mises détaillées (pour construire l'historique)
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', m.id,
                            'acheteur_id', m.acheteur_id,
                            'acheteur_nom', m.acheteur_nom,
                            'acheteur_email', m.acheteur_email,
                            'montant', m.montant,
                            'type_mise', m.type_mise,
                            'est_gagnante', m.est_gagnante,
                            'est_outbid', m.est_outbid,
                            'created_at', m.created_at
                        ) ORDER BY m.montant DESC, m.created_at ASC
                    )
                    FROM mises m
                    WHERE m.enchere_id = e.id
                    ),
                    '[]'::json
                ) AS mises
            FROM encheres e
            LEFT JOIN produits p ON p.id = e.produit_id
            LEFT JOIN enchere_gagnants eg ON eg.enchere_id = e.id AND eg.rang = 1
            WHERE e.vendeur_id = $1
            ORDER BY 
                CASE 
                    WHEN e.statut = 'en_cours' THEN 1
                    WHEN e.statut = 'a_venir' THEN 2
                    ELSE 3
                END,
                e.date_fin ASC
        `, [req.user.id]);

        // Transformer les données pour le frontend
        const encheres = result.rows.map(row => {
            // Construire la liste des enchérisseurs à partir des mises
            const mises = row.mises || [];
            const encherisseursMap = new Map();
            
            mises.forEach(mise => {
                if (!encherisseursMap.has(mise.acheteur_id)) {
                    encherisseursMap.set(mise.acheteur_id, {
                        id: mise.acheteur_id,
                        nom: mise.acheteur_nom || mise.acheteur_email?.split('@')[0] || 'Anonyme',
                        email: mise.acheteur_email,
                        miseCourante: 0,
                        misePrecedente: 0,
                        miseMax: mise.montant,
                        nbMises: 0,
                        statut: 'surpasse'
                    });
                }
                const encherisseur = encherisseursMap.get(mise.acheteur_id);
                encherisseur.nbMises++;
                encherisseur.misePrecedente = encherisseur.miseCourante;
                encherisseur.miseCourante = mise.montant;
                if (mise.est_gagnante) {
                    encherisseur.statut = 'plus_haut';
                }
                if (mise.montant > encherisseur.miseMax) {
                    encherisseur.miseMax = mise.montant;
                }
            });
            
            // Trier les enchérisseurs par mise courante (plus haut en premier)
            const encherisseurs = Array.from(encherisseursMap.values())
                .sort((a, b) => b.miseCourante - a.miseCourante);
            
            // Déterminer le statut pour l'affichage frontend
            let statutAffichage = row.statut;
            if (row.statut === 'terminee') {
                if (row.gagnant_nom && row.reserve_atteinte) {
                    statutAffichage = 'passee_gagnee';
                } else if (!row.reserve_atteinte && row.mise_courante > 0) {
                    statutAffichage = 'passee_reserve';
                } else if (row.mise_courante === 0) {
                    statutAffichage = 'passee_non_achetee';
                } else {
                    statutAffichage = 'passee_annulee';
                }
            }
            
            return {
                id: row.id.toString(),
                produit_id: row.produit_id,
                produit: row.produit_nom || `Produit #${row.produit_id}`,
                image: row.produit_image ? '🖼️' : '📦',
                image_url: row.produit_image,
                dateDebut: new Date(row.date_debut).toLocaleString('fr-CA', { hour12: false }),
                dateFin: new Date(row.date_fin).toLocaleString('fr-CA', { hour12: false }),
                prixBase: parseFloat(row.prix_base),
                prixReserve: row.prix_reserve ? parseFloat(row.prix_reserve) : 0,
                miseCourante: parseFloat(row.mise_courante || 0),
                nbMises: parseInt(row.nb_mises || 0),
                nbEncherisseurs: parseInt(row.nb_encherisseurs || 0),
                statut: statutAffichage,
                estPopcorn: row.popcorn || false,
                reserveAtteint: row.reserve_atteinte || false,
                gagnant: row.gagnant_nom,
                emailGagnant: row.gagnant_email,
                miseGagnante: row.montant_gagnant ? parseFloat(row.montant_gagnant) : null,
                encherisseurs: encherisseurs,
                mises: mises
            };
        });

        res.json(encheres);
    } catch (err) {
        console.error('Erreur GET /api/encheres:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// GET /api/encheres/:id
// Detail d'une enchere + historique des mises
// =============================================================================
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const enchereRes = await pool.query(`
            SELECT e.*, p.nom AS produit_nom, p.sku AS produit_sku,
                   p.image AS produit_image, p.shopify_id AS produit_shopify_id
            FROM encheres e
            JOIN produits p ON p.id = e.produit_id
            WHERE e.id = $1 AND e.vendeur_id = $2
        `, [req.params.id, req.user.id]);

        if (enchereRes.rows.length === 0) {
            return res.status(404).json({ error: 'Enchere introuvable.' });
        }

        const misesRes = await pool.query(`
            SELECT * FROM mises WHERE enchere_id = $1 ORDER BY montant DESC, created_at ASC
        `, [req.params.id]);

        res.json({
            enchere: enchereRes.rows[0],
            mises:   misesRes.rows,
        });
    } catch (err) {
        console.error('Erreur GET /api/encheres/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// PATCH /api/encheres/:id/demarrer
// Demarre manuellement une enchere a_venir
// =============================================================================
router.patch('/:id/demarrer', authenticateToken, async (req, res) => {
    try {
        const enchereRes = await pool.query(
            `SELECT e.*, p.shopify_id FROM encheres e
             JOIN produits p ON p.id = e.produit_id
             WHERE e.id = $1 AND e.vendeur_id = $2`,
            [req.params.id, req.user.id]
        );

        if (enchereRes.rows.length === 0) {
            return res.status(404).json({ error: 'Enchere introuvable.' });
        }
        const enchere = enchereRes.rows[0];

        if (enchere.statut !== 'a_venir') {
            return res.status(409).json({ error: `Impossible de demarrer une enchere en statut '${enchere.statut}'.` });
        }

        await pool.query(
            `UPDATE encheres SET statut = 'en_cours', updated_at = NOW() WHERE id = $1`,
            [enchere.id]
        );

        // Sync tags Shopify
        const creds = await getShopifyCredentials(req.user.id);
        const shopifyResult = await syncTagsShopify(
            enchere.shopify_id,
            ['evend_on_auction', 'active_bidding'],
            ['evend_upcoming_auction'],
            creds
        );

        if (shopifyResult.synced) {
            await pool.query(
                "UPDATE encheres SET shopify_tags_actifs = $1 WHERE id = $2",
                [['evend_on_auction', 'active_bidding'], enchere.id]
            );
        }

        res.json({ success: true, message: 'Enchere demarree.', shopify: shopifyResult });
    } catch (err) {
        console.error('Erreur PATCH /api/encheres/:id/demarrer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// PATCH /api/encheres/:id/terminer
// Termine manuellement une enchere en_cours
// Declare le gagnant (acheteur avec la mise la plus haute)
// =============================================================================
router.patch('/:id/terminer', authenticateToken, async (req, res) => {
    try {
        const enchereRes = await pool.query(
            `SELECT e.*, p.shopify_id FROM encheres e
             JOIN produits p ON p.id = e.produit_id
             WHERE e.id = $1 AND e.vendeur_id = $2`,
            [req.params.id, req.user.id]
        );

        if (enchereRes.rows.length === 0) {
            return res.status(404).json({ error: 'Enchere introuvable.' });
        }
        const enchere = enchereRes.rows[0];

        if (enchere.statut !== 'en_cours') {
            return res.status(409).json({ error: `Impossible de terminer une enchere en statut '${enchere.statut}'.` });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Trouver la mise gagnante
            const miseRes = await client.query(
                `SELECT * FROM mises WHERE enchere_id = $1 ORDER BY montant DESC LIMIT 1`,
                [enchere.id]
            );
            const misePlusHaute = miseRes.rows[0] || null;

            // Verifier si le prix de reserve est atteint
            const reserveAtteinte = misePlusHaute
                ? (!enchere.prix_reserve || misePlusHaute.montant >= enchere.prix_reserve)
                : false;

            // Mettre a jour l'enchere
            await client.query(
                `UPDATE encheres
                 SET statut = 'terminee',
                     gagnant_id = $1,
                     reserve_atteinte = $2,
                     updated_at = NOW()
                 WHERE id = $3`,
                [misePlusHaute?.acheteur_id || null, reserveAtteinte, enchere.id]
            );

            // Marquer la mise gagnante
            if (misePlusHaute && reserveAtteinte) {
                await client.query(
                    'UPDATE mises SET est_gagnante = TRUE WHERE id = $1',
                    [misePlusHaute.id]
                );

                // Creer l'entree gagnant
                await client.query(`
                    INSERT INTO enchere_gagnants (
                        enchere_id, mise_id, acheteur_id, acheteur_email,
                        acheteur_nom, montant_gagnant, montant_a_payer,
                        statut_paiement, date_notification
                    ) VALUES ($1, $2, $3, $4, $5, $6, $6, 'notifie', NOW())
                `, [
                    enchere.id,
                    misePlusHaute.id,
                    misePlusHaute.acheteur_id,
                    misePlusHaute.acheteur_email,
                    misePlusHaute.acheteur_nom,
                    misePlusHaute.montant,
                ]);
            }

            await client.query('COMMIT');

            // Sync tags Shopify (hors transaction)
            const creds = await getShopifyCredentials(req.user.id);
            const shopifyResult = await syncTagsShopify(
                enchere.shopify_id,
                ['evend_end_auction'],
                ['evend_on_auction', 'active_bidding', 'evend_upcoming_auction'],
                creds
            );

            if (shopifyResult.synced) {
                await pool.query(
                    "UPDATE encheres SET shopify_tags_actifs = $1 WHERE id = $2",
                    [['evend_end_auction'], enchere.id]
                );
            }

            res.json({
                success: true,
                message: reserveAtteinte
                    ? `Enchere terminee. Gagnant: ${misePlusHaute?.acheteur_email}`
                    : 'Enchere terminee. Prix de reserve non atteint — pas de gagnant.',
                reserve_atteinte: reserveAtteinte,
                gagnant: misePlusHaute || null,
                shopify: shopifyResult,
            });

        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Erreur PATCH /api/encheres/:id/terminer:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// POST /api/encheres/:id/mises
// Placer une mise sur une enchere en cours
// Gere : validation, proxy bidding, popcorn, mise a jour mise_courante
// Body: { acheteur_id, acheteur_email, acheteur_nom, montant, montant_proxy? }
// =============================================================================
router.post('/:id/mises', authenticateToken, async (req, res) => {
    const enchereId = parseInt(req.params.id);
    const {
        acheteur_id,
        acheteur_email,
        acheteur_nom,
        montant,
        montant_proxy, // optionnel — mise max secrete pour le proxy bidding
    } = req.body;

    if (!acheteur_id || !acheteur_email || !montant) {
        return res.status(400).json({ error: 'acheteur_id, acheteur_email et montant sont requis.' });
    }

    const montantNum      = parseFloat(montant);
    const montantProxyNum = montant_proxy ? parseFloat(montant_proxy) : null;

    if (isNaN(montantNum) || montantNum <= 0) {
        return res.status(400).json({ error: 'Montant invalide.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Charger l'enchere et verifier son statut
        const enchereRes = await client.query(
            `SELECT e.*, p.shopify_id, p.vendeur_id AS prod_vendeur_id
             FROM encheres e
             JOIN produits p ON p.id = e.produit_id
             WHERE e.id = $1 FOR UPDATE`,
            [enchereId]
        );
        if (enchereRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Enchere introuvable.' });
        }
        const enchere = enchereRes.rows[0];

        if (enchere.statut !== 'en_cours') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: `Impossible de miser sur une enchere en statut "${enchere.statut}".` });
        }

        if (new Date(enchere.date_fin) <= new Date()) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Cette enchere est terminee.' });
        }

        // 2. Charger la config admin pour les regles
        const configRes = await client.query(
            'SELECT restrict_consecutive, increment_min FROM enchere_config WHERE id = 1'
        );
        const restrictConsecutif = configRes.rows[0]?.restrict_consecutive || false;

        // 3. Verifier que la mise est superieure a la mise courante + increment min
        const miseMiniRequise = enchere.mise_courante + enchere.increment_min;
        if (montantNum < miseMiniRequise && enchere.mise_courante > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `La mise minimum est de ${miseMiniRequise.toFixed(2)} $ (mise courante ${enchere.mise_courante.toFixed(2)} $ + increment ${enchere.increment_min.toFixed(2)} $).`,
                mise_minimum: miseMiniRequise,
            });
        }
        if (montantNum < enchere.prix_base && enchere.mise_courante === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `La mise minimum est le prix de base : ${enchere.prix_base.toFixed(2)} $.`,
                mise_minimum: enchere.prix_base,
            });
        }

        // 4. Verifier restriction mise consecutive
        if (restrictConsecutif && enchere.mise_courante > 0) {
            const derniereRes = await client.query(
                'SELECT acheteur_id FROM mises WHERE enchere_id = $1 ORDER BY created_at DESC LIMIT 1',
                [enchereId]
            );
            if (derniereRes.rows[0]?.acheteur_id === acheteur_id) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Vous ne pouvez pas encherir deux fois de suite. Attendez qu\'un autre encherisseur mise.' });
            }
        }

        // 5. Marquer les mises precedentes comme outbid
        await client.query(
            'UPDATE mises SET est_outbid = TRUE WHERE enchere_id = $1 AND est_outbid = FALSE AND acheteur_id != $2',
            [enchereId, acheteur_id]
        );

        // 6. Determiner le type de mise
        const typeMise = montantProxyNum && montantProxyNum > montantNum ? 'proxy' : 'normale';

        // 7. Inserer la mise
        const miseRes = await client.query(`
            INSERT INTO mises (
                enchere_id, acheteur_id, acheteur_email, acheteur_nom,
                montant, montant_proxy, type_mise,
                est_gagnante, est_outbid,
                ip_address, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, FALSE, $8, NOW())
            RETURNING *`,
            [
                enchereId, acheteur_id, acheteur_email, acheteur_nom || null,
                montantNum, montantProxyNum, typeMise,
                req.ip || null,
            ]
        );
        const nouvelleMise = miseRes.rows[0];

        // 8. Si proxy bidding — sauvegarder le montant max secret dans enchere_participants
        if (montantProxyNum) {
            await client.query(`
                INSERT INTO enchere_participants (enchere_id, acheteur_id, acheteur_email, proxy_montant_max, proxy_actif, joined_at, updated_at)
                VALUES ($1, $2, $3, $4, TRUE, NOW(), NOW())
                ON CONFLICT (enchere_id, acheteur_id)
                DO UPDATE SET proxy_montant_max = $4, proxy_actif = TRUE, updated_at = NOW()`,
                [enchereId, acheteur_id, acheteur_email, montantProxyNum]
            );
        } else {
            // Enregistrer la participation meme sans proxy
            await client.query(`
                INSERT INTO enchere_participants (enchere_id, acheteur_id, acheteur_email, joined_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                ON CONFLICT (enchere_id, acheteur_id) DO UPDATE SET updated_at = NOW()`,
                [enchereId, acheteur_id, acheteur_email]
            );
        }

        // 9. Mettre a jour l'enchere : mise_courante, nb_mises, reserve_atteinte
        const reserveAtteinte = enchere.prix_reserve ? montantNum >= enchere.prix_reserve : true;
        await client.query(`
            UPDATE encheres
            SET mise_courante   = $1,
                nb_mises        = nb_mises + 1,
                gagnant_id      = $2,
                reserve_atteinte = $3,
                updated_at      = NOW()
            WHERE id = $4`,
            [montantNum, acheteur_id, reserveAtteinte, enchereId]
        );

        // 10. Verifier popcorn bidding
        // Si la mise est placee dans les X dernieres minutes avant la fin → prolonger
        let popcornDeclenche = false;
        if (enchere.popcorn && enchere.popcorn_nb_fois > 0) {
            const minutesRestantes = (new Date(enchere.date_fin).getTime() - Date.now()) / 60000;
            if (minutesRestantes <= enchere.popcorn_delai_mises) {
                const nouvelleFin = new Date(enchere.date_fin.getTime() + enchere.popcorn_delai_offres * 60000);
                await client.query(`
                    UPDATE encheres
                    SET date_fin        = $1,
                        popcorn_nb_fois = popcorn_nb_fois - 1,
                        updated_at      = NOW()
                    WHERE id = $2`,
                    [nouvelleFin, enchereId]
                );
                popcornDeclenche = true;
                console.log(`Popcorn declenche sur enchere #${enchereId} — nouvelle fin: ${nouvelleFin.toISOString()}`);
            }
        }

        await client.query('COMMIT');

        console.log(`Mise #${nouvelleMise.id} placee sur enchere #${enchereId} — ${montantNum}$ par ${acheteur_email}`);

        res.status(201).json({
            success:           true,
            mise:              nouvelleMise,
            mise_courante:     montantNum,
            reserve_atteinte:  reserveAtteinte,
            popcorn_declenche: popcornDeclenche,
            message:           `Votre mise de ${montantNum.toFixed(2)} $ a ete enregistree.`,
        });

    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Erreur POST /api/encheres/:id/mises:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// =============================================================================
// GET /api/encheres/:id/mises
// Historique public des mises d'une enchere (sans montants proxy secrets)
// =============================================================================
router.get('/:id/mises', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, acheteur_id, acheteur_email, acheteur_nom,
                montant, type_mise, est_gagnante, est_outbid, created_at
            FROM mises
            WHERE enchere_id = $1
            ORDER BY montant DESC, created_at ASC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /api/encheres/:id/mises:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =============================================================================
// GET /api/encheres/publique/:produitId
// Infos publiques d'une enchere active sur un produit (pour la page produit acheteur)
// Pas besoin d'etre connecte pour lire
// =============================================================================
router.get('/publique/:produitId', async (req, res) => {
    try {
        const paramId = req.params.produitId;

        // Chercher d'abord par shopify_id (le widget envoie le Shopify ID)
        // puis par produit_id interne comme fallback
        let result = await pool.query(`
            SELECT
                e.id, e.date_debut, e.date_fin, e.prix_base, e.prix_reserve,
                e.mise_courante, e.nb_mises, e.statut, e.procuration,
                e.popcorn, e.increment_min, e.reserve_atteinte,
                p.id AS produit_id_interne,
                p.shopify_id AS produit_shopify_id,
                p.nom AS produit_nom, p.prix AS produit_prix,
                p.image AS produit_image, p.description AS produit_description
            FROM encheres e
            JOIN produits p ON p.id = e.produit_id
            WHERE p.shopify_id::text = $1::text
              AND e.statut IN ('en_cours', 'a_venir')
            ORDER BY e.created_at DESC
            LIMIT 1`,
            [paramId]
        );

        // Fallback: chercher par produit_id interne si pas trouve par shopify_id
        if (result.rows.length === 0 && !isNaN(paramId) && parseInt(paramId) < 2147483647) {
            result = await pool.query(`
                SELECT
                    e.id, e.date_debut, e.date_fin, e.prix_base, e.prix_reserve,
                    e.mise_courante, e.nb_mises, e.statut, e.procuration,
                    e.popcorn, e.increment_min, e.reserve_atteinte,
                    p.id AS produit_id_interne,
                    p.shopify_id AS produit_shopify_id,
                    p.nom AS produit_nom, p.prix AS produit_prix,
                    p.image AS produit_image, p.description AS produit_description
                FROM encheres e
                JOIN produits p ON p.id = e.produit_id
                WHERE e.produit_id = $1
                  AND e.statut IN ('en_cours', 'a_venir')
                ORDER BY e.created_at DESC
                LIMIT 1`,
                [parseInt(paramId)]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Aucune enchere active pour ce produit.' });
        }

        // Ne pas exposer le prix de reserve si la config le cache
        const configRes = await pool.query(
            'SELECT show_reserved_price FROM enchere_config WHERE id = 1'
        );
        const enchere = result.rows[0];
        if (!configRes.rows[0]?.show_reserved_price) {
            delete enchere.prix_reserve;
        }

        res.json(enchere);
    } catch (err) {
        console.error('Erreur GET /api/encheres/publique/:produitId:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/encheres/publique/:produit_id (PUBLIC — appelé par evend-auction-widget.js) ───
router.get('/publique/:produit_id', async (req, res) => {
    try {
        const produit_id = parseInt(req.params.produit_id);
        if (isNaN(produit_id)) return res.json(null);

        const pool = require('../db');
        const result = await pool.query(
            `SELECT
                e.id, e.statut, e.prix_base, e.prix_reserve,
                e.date_debut, e.date_fin, e.increment_min,
                e.vendeur_id, e.produit_id,
                COALESCE(
                    (SELECT MAX(montant) FROM mises WHERE enchere_id = e.id),
                    0
                ) AS mise_actuelle,
                (SELECT COUNT(*) FROM mises WHERE enchere_id = e.id) AS nb_mises
             FROM encheres e
             WHERE e.produit_id = $1
               AND e.statut IN ('en_cours', 'a_venir')
             ORDER BY e.created_at DESC
             LIMIT 1`,
            [produit_id]
        );

        if (result.rows.length === 0) return res.json(null);
        
        const enchere = result.rows[0];
        // Format attendu par le widget
        res.json({
            id: enchere.id,
            statut: enchere.statut,
            prix_base: parseFloat(enchere.prix_base),
            prix_reserve: enchere.prix_reserve ? parseFloat(enchere.prix_reserve) : null,
            date_debut: enchere.date_debut,
            date_fin: enchere.date_fin,
            increment_min: parseFloat(enchere.increment_min || 1),
            mise_actuelle: parseFloat(enchere.mise_actuelle || 0),
            nb_mises: parseInt(enchere.nb_mises || 0),
            reserve_atteinte: enchere.prix_reserve 
                ? parseFloat(enchere.mise_actuelle || 0) >= parseFloat(enchere.prix_reserve)
                : true,
        });
    } catch (err) {
        console.error('GET /encheres/publique/:id:', err.message);
        res.json(null);
    }
});

// ─── GET /api/encheres/produit/:produit_id (PUBLIC) ─────────────────────────
// Retourne l'enchère active ou à venir pour un produit donné
router.get('/produit/:produit_id', async (req, res) => {
    try {
        const produit_id = parseInt(req.params.produit_id);
        if (isNaN(produit_id)) return res.json({ enchere: null });

        const pool = require('../db');
        const result = await pool.query(
            `SELECT
                e.id, e.statut, e.prix_base, e.prix_reserve,
                e.date_debut, e.date_fin, e.increment_min,
                e.vendeur_id, e.produit_id,
                COALESCE(
                    (SELECT MAX(montant) FROM mises WHERE enchere_id = e.id),
                    0
                ) AS mise_actuelle,
                (SELECT COUNT(*) FROM mises WHERE enchere_id = e.id) AS nb_offres
             FROM encheres e
             WHERE e.produit_id = $1
               AND e.statut IN ('en_cours', 'a_venir')
             ORDER BY e.created_at DESC
             LIMIT 1`,
            [produit_id]
        );

        if (result.rows.length === 0) return res.json({ enchere: null });
        res.json({ enchere: result.rows[0] });
    } catch (err) {
        console.error('GET /encheres/produit/:id:', err.message);
        res.json({ enchere: null });
    }
});

module.exports = router;