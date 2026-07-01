// routes/produits_vendeur.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');
//const ShopifyService = require('../services/ShopifyService');
const crypto = require('crypto'); // natif Node.js, pas de npm install

// ─────────────────────────────────────────────────────────────────────────────
// CHIFFREMENT AES-256-GCM DES NOTES INTERNES
// ─────────────────────────────────────────────────────────────────────────────
// AES-256-GCM = chiffrement authentifié (confidentialité + intégrité + anti-falsification)
// Chaque note a son propre IV aléatoire (16 bytes) + authTag (16 bytes)
// Format stocké en BD : hex(iv):hex(authTag):hex(contenuChiffré)
//
// Variable d'environnement OBLIGATOIRE dans Render.com :
//   NOTES_ENCRYPTION_KEY = 64 caractères hexadécimaux (= 32 bytes = 256 bits)
//
// Pour générer une clé sécurisée, exécuter UNE SEULE FOIS :
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// Puis copier le résultat dans Render → Environment → NOTES_ENCRYPTION_KEY
//
// ⚠️ IMPORTANT : Ne jamais changer cette clé après création des premières notes.
//    Si la clé change, les notes existantes ne pourront plus être déchiffrées.
// ─────────────────────────────────────────────────────────────────────────────

const NOTES_ENCRYPTION_KEY_HEX = process.env.NOTES_ENCRYPTION_KEY;

if (!NOTES_ENCRYPTION_KEY_HEX || NOTES_ENCRYPTION_KEY_HEX.length !== 64) {
    console.error('❌ NOTES_ENCRYPTION_KEY manquante ou invalide dans les variables d\'environnement!');
    console.error('   Générer avec: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    console.error('   La clé doit faire exactement 64 caractères hexadécimaux (32 bytes).');
    // On ne crash pas le serveur, mais les notes seront inutilisables
}

const NOTES_KEY = NOTES_ENCRYPTION_KEY_HEX
    ? Buffer.from(NOTES_ENCRYPTION_KEY_HEX, 'hex')
    : crypto.randomBytes(32); // Clé temporaire (en mémoire seulement) si manquante — notes illisibles après restart

/**
 * Chiffre un texte en clair avec AES-256-GCM.
 * Retourne une string au format "hex(iv):hex(authTag):hex(contenu_chiffré)"
 * L'authTag garantit que personne n'a falsifié le chiffré en BD.
 */
function chiffrerNote(texteEnClair) {
    const iv = crypto.randomBytes(16); // IV unique par note
    const cipher = crypto.createCipheriv('aes-256-gcm', NOTES_KEY, iv);

    let chiffre = cipher.update(texteEnClair, 'utf8', 'hex');
    chiffre += cipher.final('hex');

    const authTag = cipher.getAuthTag(); // GCM auth tag (intégrité)

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${chiffre}`;
}

/**
 * Déchiffre une note chiffrée avec AES-256-GCM.
 * Vérifie l'authTag → détecte toute falsification en BD.
 * Retourne null si déchiffrement impossible (clé incorrecte, données corrompues).
 */
function dechiffrerNote(contenuChiffre) {
    try {
        const parts = contenuChiffre.split(':');

        // Ancien format (texte en clair, notes créées avant l'activation du chiffrement)
        if (parts.length !== 3) {
            console.warn('⚠️ Note en ancien format (non chiffrée) — retournée telle quelle');
            return contenuChiffre;
        }

        const [ivHex, authTagHex, chiffreHex] = parts;
        const iv      = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', NOTES_KEY, iv);
        decipher.setAuthTag(authTag);

        let dechiffre = decipher.update(chiffreHex, 'hex', 'utf8');
        dechiffre += decipher.final('utf8'); // Lance une erreur si authTag invalide

        return dechiffre;
    } catch (e) {
        console.error('❌ Échec déchiffrement note — clé incorrecte ou données falsifiées:', e.message);
        return '[NOTE ILLISIBLE — Erreur de déchiffrement]';
    }
}

// ── Helper impersonation ──────────────────────────────────────────────────────
function getVendeurId(req) {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
    const vendeurIdBody  = req.body?.vendeur_id  ? parseInt(req.body.vendeur_id)  : null;
    const vendeurIdQuery = req.query?.vendeur_id ? parseInt(req.query.vendeur_id) : null;
    if (isAdmin && (vendeurIdBody || vendeurIdQuery)) {
        return vendeurIdBody || vendeurIdQuery;
    }
    return req.user.id;
}

// ── Helper token Shopify avec fallback admin ──────────────────────────────────
// Dans ce modèle multi-vendeur, tous les vendeurs publient sur LA MÊME boutique Shopify.
// Si le vendeur n'a pas son propre token, on utilise le token admin.
async function getShopifyToken(vendeurId) {
    const vendeurRow = await pool.query(
        'SELECT shop_domain, shopify_access_token FROM vendeurs WHERE id = $1',
        [vendeurId]
    );
    const vendeurInfo = vendeurRow.rows[0] || {};

    let adminToken = null;
    let adminDomain = null;
    try {
        const adminConfig = await pool.query(
            `SELECT shopify_access_token, shopify_domain FROM configuration_generale_admin LIMIT 1`
        );
        if (adminConfig.rows.length > 0) {
            adminToken  = adminConfig.rows[0].shopify_access_token;
            adminDomain = adminConfig.rows[0].shopify_domain;
        }
    } catch (e) {}
    if (!adminToken)  adminToken  = process.env.SHOPIFY_ACCESS_TOKEN;
    if (!adminDomain) adminDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_SHOP_DOMAIN;

    const accessToken = vendeurInfo.shopify_access_token || adminToken;
    const shopDomain  = vendeurInfo.shop_domain           || adminDomain;

    if (!vendeurInfo.shopify_access_token && accessToken) {
        console.log(`ℹ️  Vendeur ${vendeurId} sans token propre — utilisation du token admin Shopify`);
    }

    return { accessToken, shopDomain };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Normalise les valeurs d'état longues (stockées dans shopify) vers les codes courts du frontend
function normaliserEtat(etat) {
    if (!etat) return null;
    const map = {
        '1. neuf':        'neuf',
        '2. comme neuf':  'comme-neuf',
        '3. très bon':    'tres-bon',
        '4. bon':         'bon',
        '5. correct':     'correct',
        '6. usé':         'use',
        '7. à réparer':   'a-reparer',
        '8. pour pièces': 'pieces',
    };
    const lower = etat.toLowerCase();
    // Si c'est déjà un code court, le retourner tel quel
    const courtsDejaTels = ['neuf','comme-neuf','tres-bon','bon','correct','use','a-reparer','pieces'];
    if (courtsDejaTels.includes(lower)) return lower;
    // Chercher par correspondance partielle (commence par le numéro)
    for (const [key, val] of Object.entries(map)) {
        if (lower.startsWith(key)) return val;
    }
    return etat; // fallback: retourner tel quel
}

// Détermine la source d'une annonce
// Si la colonne source est remplie (futures intégrations), l'utilise.
// Sinon → 'e-Vend' (créé depuis notre app)
function determinerSource(row) {
    if (row.source && row.source.trim()) return row.source.trim();
    return 'e-Vend';
}

function mapProduit(row) {
    return {
        id:               String(row.id),
        nom:              row.nom,
        sku:              row.sku || '',
        codeBarres:       row.code_barres || '',
        // Utilise categorie_nom du JOIN si disponible, sinon categorie (colonne directe si elle existe)
        categorie:        row.categorie_nom || row.categorie || '',
        categorie_id:     row.categorie_id || null,
        marque:           row.marque || '',
        modele:           row.modele || '',
        tags:             row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        prix:             parseFloat(row.prix),
        stock:            parseInt(row.stock),
        quantiteMinimum:  parseInt(row.quantite_minimum) || 1,
        typeVente:        row.type_vente || 'standard',
        typeAnnonce:      row.type_annonce || null,
        etat:             normaliserEtat(row.etat),  // ← normalisé vers code court
        statut:           row.statut,
        totalVentes:      parseInt(row.total_ventes) || 0,
        poids:            parseFloat(row.poids) || null,
        hauteur:          parseFloat(row.hauteur) || null,
        largeur:          parseFloat(row.largeur) || null,
        longueur:         parseFloat(row.longueur) || null,
        retourOffert:     row.retour_offert,
        garantie:         row.garantie,
        paysFabrication:  row.pays_fabrication || '',
        formats:          row.formats || '',
        adresseVente:     row.adresse_vente || '',
        lienYoutube:      row.lien_youtube || '',
        suiviInventaire:  row.suivi_inventaire,
        modeExpedition:   row.mode_expedition || { transporteur: false, ramassage: false },
        produitNumerique: row.produit_numerique || false,
        lienNumerique:    row.lien_numerique || '',
        joursAccessibles: row.jours_accessibles || null,
        telechargementsMax: row.telechargements_max || null,
        // Parse images
        images:           (() => {
            if (!row.images) return [];
            if (Array.isArray(row.images)) return row.images;
            const s = String(row.images).trim();
            if (s.startsWith('[')) {
                try { return JSON.parse(s); } catch(e) {}
            }
            return s.replace(/^{|}$/g, '').split(',').filter(Boolean);
        })(),
        image:            row.image || (() => {
            if (!row.images) return null;
            const s = String(row.images).trim();
            if (s.startsWith('[')) {
                try { const arr = JSON.parse(s); return arr[0] || null; } catch(e) {}
            }
            return s.replace(/^{|}$/g, '').split(',')[0] || null;
        })(),
        description:      row.description || '',
        enchereId:        row.enchere_id || null,
        dateCreation:     row.date_creation ? row.date_creation.toISOString().split('T')[0] : '',
        date_parution:    row.date_parution ? row.date_parution.toISOString() : null,
        vendeur_id:       row.vendeur_id,
        shopify_id:       row.shopify_id || null,
        shopify_handle:   row.shopify_handle || null,  // ← pour "Voir en boutique"
        source:           determinerSource(row),        // ← 'e-Vend' ou plateforme externe
        vues:             parseInt(row.vues) || 0,
        notes:            [],
    };
}

// ── GET /api/produits-gestionnaire/gestionnaire/:gestionnaireId ───────────────
// Route appelée par ListeProduits — charge tous les produits d'un gestionnaire
router.get('/gestionnaire/:gestionnaireId', authenticateToken, async (req, res) => {
    try {
        const gestionnaireId = parseInt(req.params.gestionnaireId);
        const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAdmin && req.user.id !== gestionnaireId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const result = await pool.query(
            `SELECT p.*,
                    c.nom AS categorie_nom
             FROM produits p
             WHERE p.gestionnaire_id = $1
             ORDER BY p.date_creation DESC`,
            [gestionnaireId]
        );

        const produitIds = result.rows.map(r => r.id);
        let notesMap = {};
        if (produitIds.length > 0) {
            try {
                const notesResult = await pool.query(
                    `SELECT id, produit_id, contenu, created_at FROM notes_internes WHERE produit_id = ANY($1) ORDER BY created_at ASC`,
                    [produitIds]
                );
                notesResult.rows.forEach(n => {
                    if (!notesMap[n.produit_id]) notesMap[n.produit_id] = [];
                    notesMap[n.produit_id].push({
                        id: n.id,
                        date: new Date(n.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
                        contenu: dechiffrerNote(n.contenu),
                    });
                });
            } catch (e) { /* notes_internes peut ne pas exister */ }
        }

        const produits = result.rows.map(r => ({ ...mapProduit(r), notes: notesMap[r.id] || [] }));
        res.json(produits);
    } catch (err) {
        console.error('GET /gestionnaire/:gestionnaireId', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/produits-gestionnaire/gestionnaire/:gestionnaireId/count ─────────
// Nombre de produits actifs — utilisé par BeautePlan, PremiumPlan, etc.
router.get('/gestionnaire/:gestionnaireId/count', authenticateToken, async (req, res) => {
    try {
        const gestionnaireId = parseInt(req.params.gestionnaireId);
        const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAdmin && req.user.id !== gestionnaireId) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        const result = await pool.query(
            `SELECT COUNT(*) as nb FROM produits WHERE gestionnaire_id = $1 AND statut = 'actif'`,
            [gestionnaireId]
        );
        res.json({ nb: parseInt(result.rows[0]?.nb || '0') });
    } catch (err) {
        console.error('GET /gestionnaire/:gestionnaireId/count', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/produits-gestionnaire — tous les produits du gestionnaire connecté
router.get('/', authenticateToken, async (req, res) => {
    try {
        // JOIN avec categories pour récupérer le nom de catégorie
        // JOIN avec vendeurs pour récupérer nom_boutique (source par défaut = 'e-Vend')
        const result = await pool.query(
            `SELECT p.*,
                    c.nom AS categorie_nom,
                    v.nom_boutique AS vendeur_boutique
             FROM produits p
             LEFT JOIN vendeurs v ON v.id = p.vendeur_id
             WHERE p.vendeur_id = $1
             ORDER BY p.date_creation DESC`,
            [getVendeurId(req)]
        );

        // Charger les notes pour chaque produit
        const produitIds = result.rows.map(r => r.id);
        let notesMap = {};
        if (produitIds.length > 0) {
            const notesResult = await pool.query(
                `SELECT id, produit_id, contenu, created_at FROM notes_internes WHERE produit_id = ANY($1) ORDER BY created_at ASC`,
                [produitIds]
            );
            notesResult.rows.forEach(n => {
                if (!notesMap[n.produit_id]) notesMap[n.produit_id] = [];
                notesMap[n.produit_id].push({
                    id: n.id,
                    date: new Date(n.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
                    contenu: dechiffrerNote(n.contenu), // ← déchiffrement
                });
            });
        }

        const produits = result.rows.map(r => ({ ...mapProduit(r), notes: notesMap[r.id] || [] }));
        res.json(produits);
    } catch (err) {
        console.error('❌ GET /api/produits-vendeur:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/produits-vendeur/:id — un seul produit ──────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*,
                    c.nom AS categorie_nom,
                    v.nom_boutique AS vendeur_boutique
             FROM produits p
             LEFT JOIN vendeurs v ON v.id = p.vendeur_id
             WHERE p.id = $1 AND p.vendeur_id = $2`,
            [req.params.id, getVendeurId(req)]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produit introuvable' });
        const notes = await pool.query(
            `SELECT id, contenu, created_at FROM notes_internes WHERE produit_id = $1 ORDER BY created_at ASC`,
            [req.params.id]
        );
        const produit = {
            ...mapProduit(result.rows[0]),
            notes: notes.rows.map(n => ({
                id: n.id,
                date: new Date(n.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
                contenu: dechiffrerNote(n.contenu), // ← déchiffrement
            })),
        };
        res.json(produit);
    } catch (err) {
        console.error('❌ GET /api/produits-vendeur/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/produits-vendeur — créer un produit ─────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
    try {
        const d = req.body;
        if (!d.nom?.trim()) return res.status(400).json({ error: 'Le nom est obligatoire.' });

        const tagsStr = Array.isArray(d.tags) ? d.tags.join(',') : (d.tags || '');

        const result = await pool.query(
            `INSERT INTO produits (
                vendeur_id, nom, sku, code_barres, description, categorie_id, marque, modele, tags,
                type_vente, type_annonce, etat, prix, stock, quantite_minimum, statut,
                poids, hauteur, largeur, longueur, retour_offert, garantie,
                pays_fabrication, formats, adresse_vente, lien_youtube, suivi_inventaire,
                mode_expedition, produit_numerique, lien_numerique, jours_accessibles,
                telechargements_max, image, date_parution
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,
                $10,$11,$12,$13,$14,$15,$16,
                $17,$18,$19,$20,$21,$22,
                $23,$24,$25,$26,$27,
                $28,$29,$30,$31,$32,$33,$34
            ) RETURNING *`,
            [
                getVendeurId(req), d.nom.trim(), d.sku || null, d.code_barres || null,
                d.description || null, d.categorie_id || null, d.marque || null, d.modele || null, tagsStr,
                d.type_vente || 'standard', d.type_annonce || 'neuf', d.etat || 'neuf',
                d.prix || 0, d.stock || 0, d.quantite_minimum || 1, d.statut || 'actif',
                d.poids || null, d.hauteur || null, d.largeur || null, d.longueur || null,
                d.retour_offert || 'non', d.garantie || 'aucune',
                d.pays_fabrication || null, d.formats || null, d.adresse_vente || null,
                d.lien_youtube || null, d.suivi_inventaire || 'suivre',
                JSON.stringify(d.mode_expedition || { transporteur: false, ramassage: false }),
                d.produit_numerique || false, d.lien_numerique || null,
                d.jours_accessibles || null, d.telechargements_max || null, d.image || null,
                d.date_parution || null,
            ]
        );
        const produit = { ...mapProduit(result.rows[0]), notes: [] };
        console.log('✅ Produit créé:', produit.id, '|', produit.nom);
        res.status(201).json({ success: true, produit });
    } catch (err) {
        console.error('❌ POST /api/produits-vendeur:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/produits-vendeur/:id/statut — activer/désactiver + sync Shopify ─
router.patch('/:id/statut', authenticateToken, async (req, res) => {
    try {
        const { statut, shopify_statut, stock, quantite_vendue, prix_vente } = req.body;
        const vendeurId = getVendeurId(req);
        const statutsValides = ['actif', 'inactif', 'en_attente', 'vendu'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide.' });
        }

        // 1. Mise à jour BD (avec stock si marquer comme vendu)
        let result;
        if (statut === 'vendu' && typeof stock === 'number') {
            result = await pool.query(
                `UPDATE produits
                 SET statut = $1, stock = $2,
                     total_ventes = total_ventes + $3,
                     updated_at = NOW()
                 WHERE id = $4 AND vendeur_id = $5
                 RETURNING id, statut, nom, shopify_id`,
                [statut, stock, quantite_vendue || 1, req.params.id, vendeurId]
            );
        } else {
            result = await pool.query(
                `UPDATE produits SET statut = $1, updated_at = NOW()
                 WHERE id = $2 AND vendeur_id = $3
                 RETURNING id, statut, nom, shopify_id`,
                [statut, req.params.id, vendeurId]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé ou accès refusé.' });
        }

        const produit = result.rows[0];
        console.log(`✅ Statut produit ${req.params.id} → ${statut}`);

        // 2. Sync Shopify si shopify_statut fourni et produit a un shopify_id
        let shopifyResult = { synced: false };
        if (shopify_statut && produit.shopify_id) {
            try {
                const { accessToken, shopDomain } = await getShopifyToken(vendeurId);
                if (accessToken && shopDomain) {
                    const shopifyService = new ShopifyService(shopDomain, accessToken);
                    await shopifyService.ensureToken();
                    const shopifyRes = await fetch(
                        `https://${shopDomain}/admin/api/2024-10/products/${produit.shopify_id}.json`,
                        {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Shopify-Access-Token': shopifyService.accessToken,
                            },
                            body: JSON.stringify({ product: { id: produit.shopify_id, status: shopify_statut } }),
                        }
                    );
                    if (shopifyRes.ok) {
                        shopifyResult = { synced: true, shopify_statut };
                        await pool.query(
                            `UPDATE produits SET sync_status='synced', synced_at=NOW() WHERE id=$1`,
                            [req.params.id]
                        );
                        console.log(`✅ Shopify sync: produit ${produit.shopify_id} → ${shopify_statut}`);
                    } else {
                        const errData = await shopifyRes.json().catch(() => ({}));
                        console.warn('⚠️ Erreur Shopify statut:', JSON.stringify(errData));
                        shopifyResult = { synced: false, error: JSON.stringify(errData) };
                    }
                }
            } catch (shopifyErr) {
                console.warn('⚠️ Erreur sync Shopify:', shopifyErr.message);
                shopifyResult = { synced: false, error: shopifyErr.message };
            }
        } else if (!produit.shopify_id) {
            console.log(`ℹ️ Produit ${req.params.id} sans shopify_id — pas de sync`);
        }

        res.json({
            success: true,
            id: String(produit.id),
            statut: produit.statut,
            shopify: shopifyResult,
        });
    } catch (err) {
        console.error('❌ PATCH /api/produits-vendeur/:id/statut:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/produits-vendeur/bulk/statut — activer/désactiver en masse ─────
router.patch('/bulk/statut', authenticateToken, async (req, res) => {
    try {
        const { ids, statut } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Liste d\'IDs requise.' });
        }
        const idsNumeriques = ids.map(Number).filter(Boolean);
        await pool.query(
            `UPDATE produits SET statut = $1, updated_at = NOW()
             WHERE id = ANY($2) AND vendeur_id = $3`,
            [statut, idsNumeriques, getVendeurId(req)]
        );
        console.log(`✅ Bulk statut → ${statut} pour ${ids.length} produits`);
        res.json({ success: true, updated: ids.length });
    } catch (err) {
        console.error('❌ PATCH /api/produits-vendeur/bulk/statut:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /api/produits-vendeur/:id — modifier un produit ───────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const check = await pool.query(
            'SELECT id FROM produits WHERE id = $1 AND vendeur_id = $2',
            [req.params.id, getVendeurId(req)]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé ou accès refusé.' });
        }

        const d = req.body;
        const tagsStr = Array.isArray(d.tags) ? d.tags.join(',') : (d.tags || '');
        const imagesArray = Array.isArray(d.images) && d.images.length > 0 ? d.images : null;

        const result = await pool.query(
            `UPDATE produits SET
                nom=$1, sku=$2, code_barres=$3, description=$4, categorie_id=$5, marque=$6,
                modele=$7, tags=$8, type_vente=$9, type_annonce=$10, etat=$11,
                prix=$12, stock=$13, quantite_minimum=$14, statut=$15,
                poids=$16, hauteur=$17, largeur=$18, longueur=$19,
                retour_offert=$20, garantie=$21, pays_fabrication=$22, formats=$23,
                adresse_vente=$24, lien_youtube=$25, suivi_inventaire=$26,
                mode_expedition=$27, produit_numerique=$28, lien_numerique=$29,
                jours_accessibles=$30, telechargements_max=$31, image=$32,
                date_parution=$33, images=$34, updated_at=NOW()
             WHERE id=$35 AND vendeur_id=$36 RETURNING *`,
            [
                d.nom?.trim(), d.sku || null, d.code_barres || null, d.description || null,
                d.categorie_id || null, d.marque || null, d.modele || null, tagsStr,
                d.type_vente || 'standard', d.type_annonce || 'neuf', d.etat || 'neuf',
                d.prix || 0, d.stock || 0, d.quantite_minimum || 1, d.statut || 'actif',
                d.poids || null, d.hauteur || null, d.largeur || null, d.longueur || null,
                d.retour_offert || 'non', d.garantie || 'aucune', d.pays_fabrication || null,
                d.formats || null, d.adresse_vente || null, d.lien_youtube || null,
                d.suivi_inventaire || 'suivre',
                JSON.stringify(d.mode_expedition || { transporteur: false, ramassage: false }),
                d.produit_numerique || false, d.lien_numerique || null,
                d.jours_accessibles || null, d.telechargements_max || null, d.image || null,
                d.date_parution || null, imagesArray,
                req.params.id, getVendeurId(req)
            ]
        );
        res.json({ success: true, produit: mapProduit(result.rows[0]) });
    } catch (err) {
        console.error('❌ PUT /api/produits-vendeur/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/produits-vendeur/:id — supprimer (avec suppression Shopify) ───
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const vendeurId = getVendeurId(req);
        
        // 1. Récupérer le produit pour avoir le shopify_id
        const produit = await pool.query(
            'SELECT id, nom, shopify_id FROM produits WHERE id = $1 AND vendeur_id = $2',
            [req.params.id, vendeurId]
        );
        
        if (produit.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé ou accès refusé.' });
        }
        
        const shopifyId = produit.rows[0].shopify_id;
        
        // 2. Supprimer sur Shopify si le produit a un shopify_id
        let shopify_deleted = false;
        if (shopifyId) {
            try {
                const { accessToken, shopDomain } = await getShopifyToken(vendeurId);
                if (accessToken && shopDomain) {
                    const shopifyService = new ShopifyService(shopDomain, accessToken);
                    const result = await shopifyService.deleteProduct(shopifyId);
                    if (result.success) {
                        shopify_deleted = true;
                        console.log(`🗑️ Produit Shopify ${shopifyId} supprimé`);
                    } else {
                        console.error(`❌ Erreur suppression Shopify: ${result.error}`);
                    }
                }
            } catch (shopifyError) {
                console.error(`❌ Erreur lors de la suppression Shopify: ${shopifyError.message}`);
            }
        }
        
        // 3. Supprimer de la base de données
        const result = await pool.query(
            'DELETE FROM produits WHERE id = $1 AND vendeur_id = $2 RETURNING id, nom',
            [req.params.id, vendeurId]
        );
        
        console.log('🗑️ Produit supprimé:', result.rows[0].id, '|', result.rows[0].nom);
        res.json({ success: true, deleted: result.rows[0], shopify_deleted });
    } catch (err) {
        console.error('❌ DELETE /api/produits-vendeur/:id:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/produits-vendeur/bulk/supprimer — supprimer en masse ──────────
router.delete('/bulk/supprimer', authenticateToken, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Liste d\'IDs requise.' });
        }
        const idsNumeriques = ids.map(Number).filter(Boolean);
        
        // Pour chaque produit, essayer de supprimer sur Shopify
        const { accessToken: bulkToken, shopDomain: bulkDomain } = await getShopifyToken(getVendeurId(req));
        for (const id of idsNumeriques) {
            try {
                const produit = await pool.query(
                    'SELECT shopify_id FROM produits WHERE id = $1 AND vendeur_id = $2',
                    [id, getVendeurId(req)]
                );
                if (produit.rows[0]?.shopify_id && bulkToken && bulkDomain) {
                    const shopifyService = new ShopifyService(bulkDomain, bulkToken);
                    await shopifyService.deleteProduct(produit.rows[0].shopify_id);
                    console.log(`🗑️ Produit Shopify ${produit.rows[0].shopify_id} supprimé`);
                }
            } catch (err) {
                console.error(`❌ Erreur suppression Shopify pour produit ${id}:`, err.message);
            }
        }
        
        const result = await pool.query(
            'DELETE FROM produits WHERE id = ANY($1) AND vendeur_id = $2 RETURNING id',
            [idsNumeriques, getVendeurId(req)]
        );
        res.json({ success: true, deleted: result.rows.length });
    } catch (err) {
        console.error('❌ DELETE /api/produits-vendeur/bulk:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/produits-vendeur/:id/notes — récupérer les notes (chiffrées en BD) ─
router.get('/:id/notes', authenticateToken, async (req, res) => {
    try {
        const check = await pool.query(
            'SELECT id FROM produits WHERE id = $1 AND vendeur_id = $2',
            [req.params.id, getVendeurId(req)]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé ou accès refusé.' });
        }

        const notesResult = await pool.query(
            `SELECT id, contenu, created_at FROM notes_internes
             WHERE produit_id = $1 AND vendeur_id = $2
             ORDER BY created_at ASC`,
            [req.params.id, getVendeurId(req)]
        );

        const notes = notesResult.rows.map(n => ({
            id: n.id,
            date: new Date(n.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
            contenu: dechiffrerNote(n.contenu), // ← déchiffrement
        }));

        res.json({ success: true, notes });
    } catch (err) {
        console.error('❌ GET /api/produits-vendeur/:id/notes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/produits-vendeur/:id/notes — ajouter une note ──────────────────
router.post('/:id/notes', authenticateToken, async (req, res) => {
    try {
        const { contenu } = req.body;
        if (!contenu?.trim()) return res.status(400).json({ error: 'Le contenu est obligatoire.' });

        // Vérifier ownership
        const check = await pool.query(
            'SELECT id FROM produits WHERE id = $1 AND vendeur_id = $2',
            [req.params.id, getVendeurId(req)]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé ou accès refusé.' });
        }

        const result = await pool.query(
            'INSERT INTO notes_internes (produit_id, vendeur_id, contenu) VALUES ($1, $2, $3) RETURNING *',
            [req.params.id, getVendeurId(req), chiffrerNote(contenu.trim())] // ← chiffrement avant stockage
        );
        const note = {
            id: result.rows[0].id,
            date: new Date(result.rows[0].created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }),
            contenu: contenu.trim(), // ← on retourne le texte clair au frontend (jamais le chiffré)
        };
        console.log('✅ Note ajoutée au produit', req.params.id);
        res.status(201).json({ success: true, note });
    } catch (err) {
        console.error('❌ POST /api/produits-vendeur/:id/notes:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/produits-vendeur/:id/notes/:noteId — supprimer une note ───────
router.delete('/:id/notes/:noteId', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM notes_internes WHERE id = $1 AND vendeur_id = $2',
            [req.params.noteId, getVendeurId(req)]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('❌ DELETE note:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/produits-vendeur/:id/vendu — marquer comme vendu + sync inventaire Shopify ─
router.patch('/:id/vendu', authenticateToken, async (req, res) => {
    try {
        const { quantite, prixVente } = req.body;
        const qte = parseInt(quantite) || 1;
        const vendeurId = getVendeurId(req);

        // 1. Mettre à jour stock + total_ventes en BD
        const result = await pool.query(
            `UPDATE produits SET
                stock = GREATEST(stock - $1, 0),
                total_ventes = total_ventes + $1,
                statut = CASE WHEN stock - $1 <= 0 THEN 'vendu' ELSE statut END,
                updated_at = NOW()
             WHERE id = $2 AND vendeur_id = $3
             RETURNING id, nom, stock, total_ventes, statut, shopify_id`,
            [qte, req.params.id, vendeurId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé.' });
        }

        const produit = result.rows[0];
        let shopifyResult = { synced: false };

        // 2. Sync Shopify inventaire si le produit a un shopify_id
        if (produit.shopify_id) {
            try {
                const { accessToken, shopDomain } = await getShopifyToken(vendeurId);
                if (!accessToken || !shopDomain) throw new Error('Aucun token Shopify disponible');

                const headers = {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                };
                const baseUrl = `https://${shopDomain}/admin/api/2024-10`;

                // ── ÉTAPE A : Récupérer les variantes du produit pour avoir inventory_item_id ──
                const variantRes = await fetch(
                    `${baseUrl}/products/${produit.shopify_id}/variants.json?fields=id,inventory_item_id,inventory_quantity`,
                    { headers }
                );

                if (!variantRes.ok) {
                    throw new Error(`Shopify variants fetch failed: ${variantRes.status}`);
                }

                const variantData = await variantRes.json();
                const variants = variantData.variants || [];

                if (variants.length === 0) {
                    throw new Error('Aucune variante trouvée pour ce produit Shopify');
                }

                // ── ÉTAPE B : Récupérer le location_id (entrepôt/emplacement principal) ──
                const locationRes = await fetch(`${baseUrl}/locations.json?limit=1`, { headers });
                const locationData = await locationRes.json();
                const locationId = locationData.locations?.[0]?.id;

                if (!locationId) {
                    throw new Error('Aucun location_id trouvé dans Shopify');
                }

                console.log(`📍 Location Shopify: ${locationId}`);

                // ── ÉTAPE C : Ajuster l'inventaire (delta négatif = soustraction) ──
                // On distribue la quantité vendue sur toutes les variantes proportionnellement
                // Si 1 seule variante → tout sur elle
                // Si plusieurs → on soustrait du stock de chacune jusqu'à épuisement du delta
                let resteADeduire = qte;

                for (const variant of variants) {
                    if (resteADeduire <= 0) break;
                    if (!variant.inventory_item_id) continue;

                    const stockVariante = parseInt(variant.inventory_quantity) || 0;
                    const deltaVariante = -Math.min(resteADeduire, stockVariante); // Négatif = soustraction
                    resteADeduire += deltaVariante; // deltaVariante est négatif donc on ajoute

                    if (deltaVariante === 0) continue;

                    const adjustRes = await fetch(`${baseUrl}/inventory_levels/adjust.json`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            location_id: locationId,
                            inventory_item_id: variant.inventory_item_id,
                            available_adjustment: deltaVariante, // ex: -1 pour retirer 1 unité
                        }),
                    });

                    if (adjustRes.ok) {
                        const adjustData = await adjustRes.json();
                        const newQty = adjustData.inventory_level?.available ?? '?';
                        console.log(`✅ Shopify inventaire ajusté: variante ${variant.id}, delta=${deltaVariante}, nouveau stock=${newQty}`);
                        shopifyResult = { synced: true, delta: deltaVariante, new_quantity: newQty };
                    } else {
                        const errData = await adjustRes.json().catch(() => ({}));
                        console.warn(`⚠️ Erreur ajustement inventaire Shopify:`, JSON.stringify(errData));
                        shopifyResult = { synced: false, error: JSON.stringify(errData) };
                    }
                }

                // ── ÉTAPE D : Si stock = 0, passer en brouillon sur Shopify ──
                if (produit.statut === 'vendu') {
                    await fetch(`${baseUrl}/products/${produit.shopify_id}.json`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ product: { id: produit.shopify_id, status: 'draft' } }),
                    });
                    console.log(`📝 Shopify: produit ${produit.shopify_id} passé en brouillon (stock épuisé)`);
                }

            } catch (shopifyErr) {
                console.warn('⚠️ Erreur sync Shopify inventaire:', shopifyErr.message);
                shopifyResult = { synced: false, error: shopifyErr.message };
            }
        } else {
            console.log(`ℹ️ Produit ${req.params.id} sans shopify_id — pas de sync inventaire`);
        }

        res.json({
            success: true,
            id: produit.id,
            nom: produit.nom,
            stock: produit.stock,
            total_ventes: produit.total_ventes,
            statut: produit.statut,
            shopify: shopifyResult,
        });

    } catch (err) {
        console.error('❌ PATCH /api/produits-vendeur/:id/vendu:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/produits-vendeur/sync-shopify — synchroniser les annonces sans shopify_id ─
router.post('/sync-shopify', authenticateToken, async (req, res) => {
    const vendeurId = getVendeurId(req);
    let synchronises = 0;
    let deja_sync    = 0;
    let erreurs      = 0;

    try {
        const { accessToken, shopDomain } = await getShopifyToken(vendeurId);
        if (!accessToken || !shopDomain) {
            return res.status(500).json({ success: false, message: 'Aucun token Shopify disponible' });
        }

        // Récupérer infos vendeur pour nom_boutique / logo_url
        const vendeurRow = await pool.query(
            'SELECT nom_boutique, logo_url FROM vendeurs WHERE id = $1',
            [vendeurId]
        );
        const vendeurInfo = vendeurRow.rows[0] || {};

        const shopifyService = new ShopifyService(shopDomain, accessToken);

        // Annonces actives sans shopify_id
        const produitsResult = await pool.query(
            `SELECT p.*,
                    c.nom AS categorie_nom,
                    COALESCE(
                        (SELECT json_agg(c2.nom)
                         FROM categories c2
                         JOIN produit_categories pc ON pc.categorie_id = c2.id
                         WHERE pc.produit_id = p.id),
                        '[]'
                    ) AS categories_noms,
                    COALESCE(
                        (SELECT json_agg(t.nom)
                         FROM tags t
                         JOIN produit_tags pt ON pt.tag_id = t.id
                         WHERE pt.produit_id = p.id),
                        '[]'
                    ) AS tags_noms
             FROM produits p
             WHERE p.vendeur_id = $1
               AND (p.shopify_id IS NULL OR p.shopify_id = '')
               AND p.statut = 'actif'
             ORDER BY p.id ASC`,
            [vendeurId]
        );

        if (produitsResult.rows.length === 0) {
            return res.json({
                success: true, synchronises: 0, deja_sync: 0, erreurs: 0,
                message: 'Toutes vos annonces sont déjà synchronisées ✅'
            });
        }

        console.log(`🔄 Sync Shopify: ${produitsResult.rows.length} annonce(s) à traiter pour vendeur ${vendeurId}`);

        for (const p of produitsResult.rows) {
            try {
                // Parser images_data (avec attachments) ou fallback sur images (URLs)
                let shopifyImages = [];
                if (p.images_data) {
                    try {
                        const parsed = typeof p.images_data === 'string' ? JSON.parse(p.images_data) : p.images_data;
                        if (Array.isArray(parsed)) {
                            shopifyImages = parsed
                                .filter(img => img.attachment || img.url)
                                .map((img, i) => ({
                                    attachment: img.attachment || null,
                                    src:        img.url || null,
                                    filename:   img.filename || `image-${i}.jpg`,
                                    alt:        img.altText || p.nom,
                                    position:   i + 1,
                                }));
                        }
                    } catch (e) {}
                }
                // Fallback URLs brutes
                if (shopifyImages.length === 0 && p.images) {
                    try {
                        const urls = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                        if (Array.isArray(urls)) {
                            shopifyImages = urls.filter(Boolean).map((url, i) => ({
                                src: url, attachment: null, filename: `image-${i}.jpg`,
                                alt: p.nom, position: i + 1,
                            }));
                        }
                    } catch (e) {}
                }

                const categories = Array.isArray(p.categories_noms) ? p.categories_noms.filter(Boolean) : [];
                const tags       = Array.isArray(p.tags_noms)       ? p.tags_noms.filter(Boolean)       : [];

                const shopifyData = {
                    nom:            p.nom,
                    description:    p.description || '',
                    prix:           parseFloat(p.prix) || 0,
                    quantite:       parseInt(p.stock) || 0,
                    sku:            p.sku || '',
                    marque:         p.marque || 'e-Vend',
                    nom_boutique:   vendeurInfo.nom_boutique || null,
                    logo_url:       vendeurInfo.logo_url     || null,
                    vendeur_id:     vendeurId,
                    type_annonce:   p.type_annonce,
                    etat_article:   p.etat,
                    retour_offert:  p.retour_offert,
                    garantie_offerte: p.garantie,
                    modele:         p.modele          || null,
                    code_barres:    p.code_barres     || null,
                    poids:          p.poids           ? parseFloat(p.poids)    : null,
                    hauteur:        p.hauteur         ? parseFloat(p.hauteur)  : null,
                    largeur:        p.largeur         ? parseFloat(p.largeur)  : null,
                    longueur:       p.longueur        ? parseFloat(p.longueur) : null,
                    pays_fabrication: p.pays_fabrication || null,
                    ville:          p.ville           || null,
                    type_produit:   p.produit_numerique ? 'numerique' : 'physique',
                    lien_numerique: p.lien_numerique  || null,
                    jours_accessibles:      parseInt(p.jours_accessibles)  || 0,
                    nombre_telechargements: parseInt(p.telechargements_max) || 0,
                    mode_expedition:    p.mode_expedition || { transporteur: true, ramassage: false },
                    expedition_necessaire: true,
                    suivi_inventaire:   p.suivi_inventaire || 'suivre',
                    quantite_minimum:   parseInt(p.quantite_minimum) || 1,
                    facturation_taxes:  false,
                    prix_original:  p.prix_original ? parseFloat(p.prix_original) : null,
                    statut:         p.statut,
                    date_parution:  p.date_parution  || null,
                    boutique_en_ligne: p.boutique_en_ligne !== false,
                    point_de_vente:    p.point_de_vente === true,
                    images:   shopifyImages,
                    variants: [],
                    options:  [],
                    categories,
                    tags,
                };

                const result = await shopifyService.createProduct(shopifyData);

                if (result.success) {
                    const shopifyHandle = result.product?.handle || null;
                    const shopifyUrl = shopifyHandle
                        ? `https://${shopDomain}/products/${shopifyHandle}`
                        : result.shopify_url;

                    await pool.query(
                        `UPDATE produits
                         SET shopify_id     = $1,
                             shopify_url    = $2,
                             shopify_handle = $3,
                             sync_status    = 'synced',
                             synced_at      = NOW()
                         WHERE id = $4`,
                        [result.shopify_id.toString(), shopifyUrl, shopifyHandle, p.id]
                    );
                    synchronises++;
                    console.log(`✅ Produit ${p.id} (${p.nom}) → shopify_id: ${result.shopify_id}`);
                } else {
                    erreurs++;
                    console.error(`❌ Produit ${p.id} (${p.nom}) — erreur:`, result.error);
                    await pool.query(
                        `UPDATE produits SET sync_status='error', sync_error=$1 WHERE id=$2`,
                        [result.error, p.id]
                    );
                }
            } catch (err) {
                erreurs++;
                console.error(`❌ Produit ${p.id} — exception:`, err.message);
            }
        }

        return res.json({
            success: true,
            synchronises,
            deja_sync,
            erreurs,
            message: `Sync terminée : ${synchronises} publiée(s), ${erreurs} erreur(s)`,
        });

    } catch (error) {
        console.error('❌ Erreur /sync-shopify:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur lors de la synchronisation' });
    }
});


// ── POST /api/produits-vendeur/resync-complet ─────────────────────────────────
// Équivalent de "ouvrir chaque annonce et cliquer Enregistrer".
// Appelle updateProductFull() sur TOUTES les annonces du vendeur qui ont un shopify_id.
// Remet à jour : tags, métafields, canaux de vente, prix, stock, images, tout.
router.post('/resync-complet', authenticateToken, async (req, res) => {
    const vendeurId = getVendeurId(req);
    let synchronises = 0;
    let erreurs = 0;
    const logs = [];

    const log = (type, msg) => {
        logs.push({ type, msg });
        console.log(msg);
    };

    try {
        const { accessToken, shopDomain } = await getShopifyToken(vendeurId);
        if (!accessToken || !shopDomain) {
            return res.status(500).json({ success: false, message: 'Aucun token Shopify disponible' });
        }

        // Infos vendeur pour nom_boutique / logo_url
        const vendeurRow = await pool.query(
            'SELECT nom_boutique, logo_url FROM vendeurs WHERE id = $1', [vendeurId]
        );
        const vendeurInfo = vendeurRow.rows[0] || {};

        const shopifyService = new ShopifyService(shopDomain, accessToken);

        // Toutes les annonces du vendeur QUI ONT un shopify_id (déjà sur Shopify)
        const produitsResult = await pool.query(
            `SELECT p.*,
                    c.nom AS categorie_nom,
                    COALESCE(
                        (SELECT json_agg(c2.nom)
                         FROM categories c2
                         JOIN produit_categories pc ON pc.categorie_id = c2.id
                         WHERE pc.produit_id = p.id),
                        '[]'
                    ) AS categories_noms,
                    COALESCE(
                        (SELECT json_agg(t.nom)
                         FROM tags t
                         JOIN produit_tags pt ON pt.tag_id = t.id
                         WHERE pt.produit_id = p.id),
                        '[]'
                    ) AS tags_noms
             FROM produits p
             WHERE p.vendeur_id = $1
               AND p.shopify_id IS NOT NULL
               AND p.shopify_id != ''
             ORDER BY p.id ASC`,
            [vendeurId]
        );

        const total = produitsResult.rows.length;

        if (total === 0) {
            return res.json({
                success: true, synchronises: 0, erreurs: 0, logs,
                message: 'Aucune annonce synchronisée trouvée.'
            });
        }

        log('info', `🔁 ${total} annonce(s) à mettre à jour...`);

        for (let i = 0; i < produitsResult.rows.length; i++) {
            const p = produitsResult.rows[i];

            try {
                log('info', `[${i + 1}/${total}] ${p.nom}...`);

                // Parser images — priorité aux URLs CDN déjà hébergées sur Shopify
                let shopifyImages = [];
                if (p.images) {
                    try {
                        const urls = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                        if (Array.isArray(urls)) {
                            shopifyImages = urls.filter(Boolean).map((url, idx) => ({
                                src: url, attachment: null,
                                filename: `image-${idx}.jpg`,
                                alt: p.nom, position: idx + 1,
                            }));
                        }
                    } catch (e) {}
                }
                // Compléter avec images_data si disponible (attachments)
                if (shopifyImages.length === 0 && p.images_data) {
                    try {
                        const parsed = typeof p.images_data === 'string'
                            ? JSON.parse(p.images_data) : p.images_data;
                        if (Array.isArray(parsed)) {
                            shopifyImages = parsed
                                .filter(img => img.attachment || img.url)
                                .map((img, idx) => ({
                                    attachment: img.attachment || null,
                                    src:        img.url || null,
                                    filename:   img.filename || `image-${idx}.jpg`,
                                    alt:        img.altText || p.nom,
                                    position:   idx + 1,
                                }));
                        }
                    } catch (e) {}
                }

                const categories = Array.isArray(p.categories_noms)
                    ? p.categories_noms.filter(Boolean) : [];
                const tags = Array.isArray(p.tags_noms)
                    ? p.tags_noms.filter(Boolean) : [];

                // Variantes depuis la BD
                let variantsData = [];
                try {
                    const varResult = await pool.query(
                        `SELECT * FROM produits_variantes WHERE produit_id = $1 ORDER BY position`,
                        [p.id]
                    );
                    if (varResult.rows.length > 0) {
                        variantsData = varResult.rows.map(v => ({
                            combinaison: v.combinaison || null,
                            prix:        parseFloat(v.prix) || parseFloat(p.prix) || 0,
                            quantite:    parseInt(v.quantite) || 0,
                            sku:         v.sku || p.sku || '',
                            poids:       parseFloat(v.poids) || parseFloat(p.poids) || 0,
                            image:       v.image_url || null,
                            attachment:  null,
                            filename:    null,
                        }));
                    }
                } catch (e) {}

                // Options depuis la BD
                let optionsData = [];
                try {
                    const optResult = await pool.query(
                        `SELECT o.id, o.nom, o.ordre,
                                json_agg(json_build_object('valeur', v.valeur) ORDER BY v.ordre)
                                FILTER (WHERE v.id IS NOT NULL) as valeurs
                         FROM produits_options o
                         LEFT JOIN produits_options_valeurs v ON v.option_id = o.id
                         WHERE o.produit_id = $1
                         GROUP BY o.id, o.nom, o.ordre
                         ORDER BY o.ordre`,
                        [p.id]
                    );
                    optionsData = optResult.rows;
                } catch (e) {}

                const shopifyData = {
                    nom:              p.nom,
                    description:      p.description || '',
                    prix:             parseFloat(p.prix) || 0,
                    quantite:         parseInt(p.stock) || 0,
                    sku:              p.sku || '',
                    marque:           p.marque || 'e-Vend',
                    nom_boutique:     vendeurInfo.nom_boutique || null,
                    logo_url:         vendeurInfo.logo_url     || null,
                    vendeur_id:       vendeurId,
                    type_annonce:     p.type_annonce,
                    etat_article:     p.etat,
                    retour_offert:    p.retour_offert,
                    garantie_offerte: p.garantie,
                    modele:           p.modele           || null,
                    code_barres:      p.code_barres      || null,
                    poids:            p.poids            ? parseFloat(p.poids)    : null,
                    hauteur:          p.hauteur          ? parseFloat(p.hauteur)  : null,
                    largeur:          p.largeur          ? parseFloat(p.largeur)  : null,
                    longueur:         p.longueur         ? parseFloat(p.longueur) : null,
                    pays_fabrication: p.pays_fabrication || null,
                    ville:            p.ville            || null,
                    type_produit:     p.produit_numerique ? 'numerique' : 'physique',
                    lien_numerique:   p.lien_numerique   || null,
                    jours_accessibles:      parseInt(p.jours_accessibles)  || 0,
                    nombre_telechargements: parseInt(p.telechargements_max) || 0,
                    mode_expedition:        p.mode_expedition || { transporteur: true, ramassage: false },
                    expedition_necessaire:  true,
                    suivi_inventaire:       p.suivi_inventaire || 'suivre',
                    quantite_minimum:       parseInt(p.quantite_minimum) || 1,
                    facturation_taxes:      false,
                    prix_original:    p.prix_original ? parseFloat(p.prix_original) : null,
                    prix_revient:     p.prix_revient  ? parseFloat(p.prix_revient)  : null,
                    statut:           p.statut,
                    date_parution:    p.date_parution  || null,
                    boutique_en_ligne: p.boutique_en_ligne !== false,
                    point_de_vente:    p.point_de_vente === true,
                    images:   shopifyImages,
                    variants: variantsData,
                    options:  optionsData,
                    categories,
                    tags,
                };

                const result = await shopifyService.updateProductFull(p.shopify_id, shopifyData);

                if (result.success) {
                    await pool.query(
                        `UPDATE produits SET sync_status='synced', synced_at=NOW() WHERE id=$1`,
                        [p.id]
                    );
                    synchronises++;
                    log('success', `✅ [${i + 1}/${total}] ${p.nom}`);
                } else {
                    erreurs++;
                    log('error', `❌ [${i + 1}/${total}] ${p.nom} — ${result.error}`);
                    await pool.query(
                        `UPDATE produits SET sync_status='error', sync_error=$1 WHERE id=$2`,
                        [result.error, p.id]
                    );
                }

            } catch (err) {
                erreurs++;
                log('error', `❌ [${i + 1}/${total}] ${p.nom} — ${err.message}`);
            }
        }

        return res.json({
            success: true,
            synchronises,
            erreurs,
            logs,
            message: `Resync terminée : ${synchronises} mise(s) à jour, ${erreurs} erreur(s)`,
        });

    } catch (error) {
        console.error('❌ Erreur /resync-complet:', error.message);
        return res.status(500).json({ success: false, message: 'Erreur serveur', logs });
    }
});

module.exports = router;