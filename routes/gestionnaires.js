// routes/vendeurs.js
// Routes de base des vendeurs : liste, profil public, création, mise à jour générale
// Les autres routes sont dans des fichiers dédiés montés directement dans server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const bcrypt  = require('bcrypt');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET / — liste tous les vendeurs (avec filtre statut optionnel)
router.get('/', async (req, res) => {
    try {
        const { statut } = req.query;
        const baseQuery = `
            SELECT v.*, COALESCE(p.nb_produits, 0) AS produits
            FROM gestionnaires v
            LEFT JOIN (
                SELECT vendeur_id, COUNT(*) AS nb_produits FROM produits GROUP BY vendeur_id
            ) p ON p.gestionnaire_id = g.id
        `;
        let result;
        if (statut) {
            const statuts = statut.split(',').map(s => s.trim()).filter(Boolean);
            result = await pool.query(baseQuery + ' WHERE g.statut = ANY($1) ORDER BY v.id', [statuts]);
        } else {
            result = await pool.query(baseQuery + ' ORDER BY v.id');
        }
        res.json(result.rows);
    } catch (err) {
        console.error('Erreur GET /api/vendeurs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /populaires — vendeurs populaires (public)
router.get('/populaires', async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const result = await pool.query(`
            SELECT id, nom_boutique, logo_url, banniere_url, note_moyenne, nombre_avis,
                   total_produits, date_inscription, region, zone_expedition,
                   description_courte as categorie
            FROM gestionnaires
            WHERE statut = 'actif'
            ORDER BY note_moyenne DESC, nombre_avis DESC
            LIMIT $1
        `, [limit]);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur GET /api/vendeurs/populaires:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /:id — profil public d'un vendeur
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM gestionnaires WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur GET /api/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST / — création d'un nouveau vendeur (inscription)
router.post('/', async (req, res) => {
    const {
        nom, email, mot_de_passe, nom_boutique, province,
        zone_expedition, type_entreprise, telephone, plan, date_inscription,
        num_civique, rue, ville, code_postal, pays,
        description, description_longue, politique_retours, politique_livraison,
        jours_remboursement, est_entreprise_enregistree, province_entreprise,
        num_entreprise_provincial, no_tps, no_taxe_provinciale, banniere_url, logo_url
    } = req.body;

    try {
        if (!nom || !email || !mot_de_passe || !nom_boutique || !province)
            return res.status(400).json({ error: 'Champs obligatoires manquants (nom, email, mot_de_passe, nom_boutique, province).' });

        const emailCheck = await pool.query('SELECT id FROM gestionnaires WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) return res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });

        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        const colCheck = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'vendeurs'`);
        const existingCols = colCheck.rows.map(r => r.column_name);

        const insertCols = [
            'nom', 'email', 'mot_de_passe', 'nom_boutique', 'province',
            'zone_expedition', 'type_entreprise', 'telephone',
            'plan', 'statut', 'date_inscription', 'total_ventes', 'commission', 'produits'
        ];
        const insertVals = [
            nom, email, hashedPassword, nom_boutique, province,
            zone_expedition || null, type_entreprise || null, telephone || null,
            plan || 'Gratuit', 'pending',
            date_inscription || new Date().toISOString().split('T')[0],
            0, 0, 0
        ];

        const optionalCols = [
            'num_civique', 'rue', 'ville', 'code_postal', 'pays',
            'description', 'description_longue', 'politique_retours', 'politique_livraison',
            'jours_remboursement', 'est_entreprise_enregistree', 'province_entreprise',
            'num_entreprise_provincial', 'no_tps', 'no_taxe_provinciale', 'banniere_url', 'logo_url'
        ];

        for (const col of optionalCols) {
            if (existingCols.includes(col)) {
                insertCols.push(col);
                let val = null;
                switch(col) {
                    case 'num_civique': val = num_civique || null; break;
                    case 'rue': val = rue || null; break;
                    case 'ville': val = ville || null; break;
                    case 'code_postal': val = code_postal || null; break;
                    case 'pays': val = pays || null; break;
                    case 'description': val = description || null; break;
                    case 'description_longue': val = description_longue || description || null; break;
                    case 'politique_retours': val = politique_retours || null; break;
                    case 'politique_livraison': val = politique_livraison || null; break;
                    case 'jours_remboursement': val = jours_remboursement ? parseInt(jours_remboursement) : 1; break;
                    case 'est_entreprise_enregistree': val = est_entreprise_enregistree || false; break;
                    case 'province_entreprise': val = province_entreprise || null; break;
                    case 'num_entreprise_provincial': val = num_entreprise_provincial || null; break;
                    case 'no_tps': val = no_tps || null; break;
                    case 'no_taxe_provinciale': val = no_taxe_provinciale || null; break;
                    case 'banniere_url': val = banniere_url || null; break;
                    case 'logo_url': val = logo_url || null; break;
                }
                insertVals.push(val);
            }
        }

        const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO gestionnaires (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id, seller_id, nom, email, nom_boutique, statut, plan, date_inscription`;
        const result = await pool.query(sql, insertVals);
        const vendeur = result.rows[0];

        const nouveauId = vendeur.id;
        const sellerIdGenere = `VEN-2026-${String(nouveauId).padStart(3, '0')}`;
        if (!vendeur.seller_id || vendeur.seller_id !== sellerIdGenere) {
            await pool.query(`UPDATE gestionnaires SET seller_id = $1 WHERE id = $2`, [sellerIdGenere, nouveauId]);
            vendeur.seller_id = sellerIdGenere;
        }

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['INSCRIPTION_VENDEUR', email,
             JSON.stringify({ seller_id: vendeur.seller_id, nom, nom_boutique, statut: 'pending' }), 'info']
        ).catch(e => console.error('Erreur log inscription:', e));

        res.status(201).json({
            message: "Compte créé avec succès. En attente d'approbation.",
            vendeur: {
                id: vendeur.id, seller_id: vendeur.seller_id, nom: vendeur.nom,
                email: vendeur.email, boutique: vendeur.nom_boutique,
                statut: vendeur.statut, plan: vendeur.plan,
            },
        });
    } catch (err) {
        console.error('❌ Erreur POST /api/vendeurs:', err);
        res.status(500).json({ error: err.message || 'Erreur serveur' });
    }
});

// PUT /profil/plan — changer le plan du vendeur connecté
// ⚠️ DOIT être avant PUT /:id sinon Express matche /profil comme un :id
router.put('/profil/plan', authenticateToken, async (req, res) => {
    try {
        const vendeurId = req.user.id;
        const { plan } = req.body;

        console.log(`PUT /profil/plan — vendeurId: ${vendeurId} (${typeof vendeurId}), plan: ${plan}`);

        // 1. Mettre à jour vendeurs.plan
        await pool.query(
            'UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2',
            [plan, vendeurId]
        );

        // 2. Mettre à jour abonnements.plan (abonnement actif)
        // abonnements.seller_id = vendeurs.id (integer)
        const aboRes = await pool.query(
            `UPDATE abonnements SET plan = $1 
             WHERE seller_id = $2 AND statut = 'actif'
             RETURNING *`,
            [plan, vendeurId]
        );

        console.log(`PUT /profil/plan — abonnements mis à jour: ${aboRes.rowCount} ligne(s)`);

        // 3. Si aucun abonnement actif, en créer un
        if (aboRes.rowCount === 0) {
            console.log(`PUT /profil/plan — aucun abonnement actif, création...`);
            const planRes = await pool.query(
                `SELECT prix_ht, tps, tvq FROM plans WHERE LOWER(TRIM(nom)) = LOWER(TRIM($1)) LIMIT 1`,
                [plan]
            );
            const planData = planRes.rows[0] || {};
            await pool.query(
                `INSERT INTO abonnements 
                    (seller_id, nom_boutique, email, plan, plan_type, statut, paiement_statut, date_debut, date_fin, prix_mensuel)
                 SELECT $1, nom_boutique, email, $2, 'mensuel', 'actif', 'Actif',
                        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $3
                 FROM gestionnaires WHERE id = $4`,
                [vendeurId, plan, parseFloat(planData.prix_ht) || 0, vendeurId]
            );
            console.log(`PUT /profil/plan — abonnement créé`);
        }

        console.log(`✅ Plan changé: vendeur ${vendeurId} → ${plan}`);
        res.json({ success: true, plan });

    } catch (err) {
        console.error('❌ Erreur PUT /profil/plan:', err);
        res.status(500).json({ error: err.message });
    }
});


// GET /:id/options — lire les options payantes du gestionnaire (public — lu par les composants du site)
router.get('/:id/options', async (req, res) => {
    try {
        const gestionnaireId = parseInt(req.params.id);
        const result = await pool.query(
            `SELECT * FROM options_gestionnaire WHERE gestionnaire_id = $1 LIMIT 1`,
            [gestionnaireId]
        );
        if (result.rows.length === 0) {
            return res.json({
                cacher_propulse: false,
                verificateur_age: false,
                popup_annonce: false,
            });
        }
        return res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur GET /gestionnaires/:id/options:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /:id/options — mettre à jour les options payantes
router.put('/:id/options', authenticateToken, async (req, res) => {
    try {
        const gestionnaireId = parseInt(req.params.id);
        const isAdminUser = req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAdminUser && req.user.id !== gestionnaireId) {
            return res.status(403).json({ success: false, message: 'Accès refusé' });
        }
        const { cacher_propulse = false, domaine_personnalise = false, verificateur_age = false, popup_annonce = false } = req.body;
        console.log(`🔍 PUT options gestionnaire ${gestionnaireId}:`, { cacher_propulse, verificateur_age, popup_annonce });

        await pool.query(
            `INSERT INTO options_gestionnaire (gestionnaire_id, cacher_propulse, domaine_personnalise, verificateur_age, popup_annonce)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (gestionnaire_id) DO UPDATE SET
               cacher_propulse      = EXCLUDED.cacher_propulse,
               domaine_personnalise = EXCLUDED.domaine_personnalise,
               verificateur_age     = EXCLUDED.verificateur_age,
               popup_annonce        = EXCLUDED.popup_annonce,
               updated_at           = NOW()`,
            [gestionnaireId, cacher_propulse, domaine_personnalise, verificateur_age, popup_annonce]
        );

        const result = await pool.query(
            `SELECT * FROM options_gestionnaire WHERE gestionnaire_id = $1`,
            [gestionnaireId]
        );

        console.log(`✅ Options gestionnaire ${gestionnaireId} mises à jour`);
        return res.json({ success: true, options: result.rows[0] });

    } catch (err) {
        console.error('Erreur PUT /gestionnaires/:id/options:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /:id/plan — changer le plan Simplisse du gestionnaire
router.put('/:id/plan', authenticateToken, async (req, res) => {
    try {
        const gestionnaireId = parseInt(req.params.id);
        const { plan } = req.body;
        const isAdminUser = req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAdminUser && req.user.id !== gestionnaireId) {
            return res.status(403).json({ success: false, message: 'Accès refusé' });
        }
        const plansValides = ['simplisse-25','simplisse-50','simplisse-100','simplisse-200','premium-25','premium-50','premium-100','premium-200','premium-500','simplisse-mode-100','mv-demarrage','mv-croissance','mv-affaires','mv-pro','mv-marche'];
        if (!plansValides.includes(plan)) {
            return res.status(400).json({ success: false, message: 'Plan invalide' });
        }
        await pool.query(
            'UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2',
            [plan, gestionnaireId]
        );
        let planDetails = null;
        if (!plan.startsWith('mv-')) {
          const table = plan.startsWith('premium-') ? 'plans_premium' : plan.startsWith('simplisse-mode-') ? 'plans_simplisse_mode' : 'plans_simplisse';
          const planResult = await pool.query(`SELECT * FROM ${table} WHERE plan = $1`, [plan]);
          planDetails = planResult.rows[0] || null;
        }
        console.log(`Plan mis a jour : gestionnaire ${gestionnaireId} -> ${plan}`);
        return res.json({ success: true, plan, details: planDetails });
    } catch (err) {
        console.error('Erreur PUT /gestionnaires/:id/plan:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /:id — mise à jour générale d'un vendeur (champs de base)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const current = await pool.query('SELECT * FROM gestionnaires WHERE id=$1', [id]);
        if (current.rows.length === 0) return res.status(404).json({ error: 'Gestionnaire non trouvé' });
        const v = current.rows[0];

        const nom          = body.nom          !== undefined ? body.nom          : v.nom;
        const email        = body.email        !== undefined ? body.email        : v.email;
        const nom_boutique = body.nom_boutique !== undefined ? body.nom_boutique : v.nom_boutique;
        const plan         = body.plan         !== undefined ? body.plan         : v.plan;
        const statut       = body.statut       !== undefined ? body.statut       : v.statut;
        const province     = body.province     !== undefined ? body.province     : v.province;
        const total_ventes = body.total_ventes !== undefined ? body.total_ventes : v.total_ventes;
        const commission   = body.commission   !== undefined ? body.commission   : v.commission;
        const produits     = body.produits     !== undefined ? body.produits     : v.produits;

        const result = await pool.query(
            'UPDATE gestionnaires SET nom=$1, email=$2, nom_boutique=$3, plan=$4, statut=$5, province=$6, total_ventes=$7, commission=$8, produits=$9 WHERE id=$10 RETURNING *',
            [nom, email, nom_boutique, plan, statut, province, total_ventes, commission, produits, id]
        );
        res.json({ success: true, vendeur: result.rows[0] });
    } catch (err) {
        console.error('Erreur PUT /api/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});


// ── GET /api/gestionnaires/:id/verificateur-age — lire la config ─────────────
router.get('/:id/verificateur-age', async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const result = await pool.query(
      'SELECT * FROM config_verificateur_age WHERE gestionnaire_id = $1 LIMIT 1',
      [gestionnaireId]
    );
    if (result.rows.length === 0) return res.json({});
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /verificateur-age:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/gestionnaires/:id/verificateur-age — sauvegarder la config ──────
router.put('/:id/verificateur-age', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
    if (!isAdmin && req.user.id !== gestionnaireId) {
      return res.status(403).json({ success: false, message: 'Accès refusé.' });
    }
    const {
      actif = true, age_minimum = 18, mode = 'boutons', theme = 'sombre',
      titre, message, texte_accepter, texte_refuser,
      couleur_fond = '#0f0f0f', couleur_accent = '#ef4444',
      logo_url, url_redirection_refus, se_souvenir_jours = 30,
    } = req.body;

    await pool.query(
      `INSERT INTO config_verificateur_age
         (gestionnaire_id, actif, age_minimum, mode, theme, titre, message,
          texte_accepter, texte_refuser, couleur_fond, couleur_accent,
          logo_url, url_redirection_refus, se_souvenir_jours, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       ON CONFLICT (gestionnaire_id) DO UPDATE SET
         actif = EXCLUDED.actif,
         age_minimum = EXCLUDED.age_minimum,
         mode = EXCLUDED.mode,
         theme = EXCLUDED.theme,
         titre = EXCLUDED.titre,
         message = EXCLUDED.message,
         texte_accepter = EXCLUDED.texte_accepter,
         texte_refuser = EXCLUDED.texte_refuser,
         couleur_fond = EXCLUDED.couleur_fond,
         couleur_accent = EXCLUDED.couleur_accent,
         logo_url = EXCLUDED.logo_url,
         url_redirection_refus = EXCLUDED.url_redirection_refus,
         se_souvenir_jours = EXCLUDED.se_souvenir_jours,
         updated_at = NOW()`,
      [gestionnaireId, actif, age_minimum, mode, theme,
       titre || "Vérification d'âge requise",
       message || 'Ce site est réservé aux personnes majeures.',
       texte_accepter || "Oui, j'ai 18 ans ou plus",
       texte_refuser || "Non, j'ai moins de 18 ans",
       couleur_fond, couleur_accent,
       logo_url || null, url_redirection_refus || null, se_souvenir_jours]
    );
    console.log(`✅ Config vérificateur d'âge sauvegardée — gestionnaire ${gestionnaireId}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('PUT /verificateur-age:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /api/gestionnaires/:id/options — inclure verificateur_age ─────────────


// ── GET /api/gestionnaires/:id/popup-annonce ─────────────────────────────────
router.get('/:id/popup-annonce', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM config_popup_annonce WHERE gestionnaire_id = $1 LIMIT 1',
      [parseInt(req.params.id)]
    );
    return res.json(result.rows.length ? result.rows[0] : {});
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/gestionnaires/:id/popup-annonce ─────────────────────────────────
router.put('/:id/popup-annonce', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
    if (!isAdmin && req.user.id !== gestionnaireId)
      return res.status(403).json({ success: false, message: 'Acces refuse.' });

    const {
      actif = true, type_affichage = 'popup', titre, message,
      bouton_label, bouton_url, bouton_actif = true,
      couleur_fond = '#1a1a2e', couleur_texte = '#ffffff', couleur_bouton = '#e63946',
      delai_secondes = 2, fermeture_auto = false, fermeture_auto_secondes = 10,
      se_souvenir_heures = 24, icone = '📢', date_debut, date_fin,
    } = req.body;

    await pool.query(
      `INSERT INTO config_popup_annonce
         (gestionnaire_id, actif, type_affichage, titre, message, bouton_label, bouton_url,
          bouton_actif, couleur_fond, couleur_texte, couleur_bouton, delai_secondes,
          fermeture_auto, fermeture_auto_secondes, se_souvenir_heures, icone,
          date_debut, date_fin, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())
       ON CONFLICT (gestionnaire_id) DO UPDATE SET
         actif = EXCLUDED.actif, type_affichage = EXCLUDED.type_affichage,
         titre = EXCLUDED.titre, message = EXCLUDED.message,
         bouton_label = EXCLUDED.bouton_label, bouton_url = EXCLUDED.bouton_url,
         bouton_actif = EXCLUDED.bouton_actif, couleur_fond = EXCLUDED.couleur_fond,
         couleur_texte = EXCLUDED.couleur_texte, couleur_bouton = EXCLUDED.couleur_bouton,
         delai_secondes = EXCLUDED.delai_secondes, fermeture_auto = EXCLUDED.fermeture_auto,
         fermeture_auto_secondes = EXCLUDED.fermeture_auto_secondes,
         se_souvenir_heures = EXCLUDED.se_souvenir_heures, icone = EXCLUDED.icone,
         date_debut = EXCLUDED.date_debut, date_fin = EXCLUDED.date_fin,
         updated_at = NOW()`,
      [gestionnaireId, actif, type_affichage,
       titre || 'Annonce importante',
       message || 'Profitez de notre offre speciale !',
       bouton_label || 'En savoir plus',
       bouton_url || null, bouton_actif,
       couleur_fond, couleur_texte, couleur_bouton,
       delai_secondes, fermeture_auto, fermeture_auto_secondes,
       se_souvenir_heures, icone,
       date_debut || null, date_fin || null]
    );
    console.log(`Popup annonce sauvegardee — gestionnaire ${gestionnaireId}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('PUT /popup-annonce:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});



// ── GET /api/gestionnaires/:id/plan ─────────────────────────────────────────
router.get('/:id/plan', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
    if (!isAdmin && req.user.id !== gestionnaireId)
      return res.status(403).json({ error: 'Acces refuse' });

    const result = await pool.query(
      'SELECT plan FROM gestionnaires WHERE id = $1 LIMIT 1',
      [gestionnaireId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Gestionnaire non trouve' });
    return res.json({ plan: result.rows[0].plan || 'mv-croissance' });
  } catch (err) {
    console.error('GET /:id/plan:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/gestionnaires/:id/plan ─────────────────────────────────────────
router.put('/:id/plan', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
    if (!isAdmin && req.user.id !== gestionnaireId)
      return res.status(403).json({ error: 'Acces refuse' });

    const { plan } = req.body;
    if (!plan) return res.status(400).json({ error: 'Plan manquant' });

    await pool.query(
      'UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2',
      [plan, gestionnaireId]
    );
    console.log(`Plan mis a jour — gestionnaire ${gestionnaireId}: ${plan}`);
    return res.json({ success: true, plan });
  } catch (err) {
    console.error('PUT /:id/plan:', err.message);
    return res.status(500).json({ error: err.message });
  }
});



// ── GET /api/gestionnaires/:id/config-multivendeur ───────────────────────────
router.get('/:id/config-multivendeur', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM config_multivendeur_premium WHERE gestionnaire_id = $1 LIMIT 1',
      [parseInt(req.params.id)]
    );
    return res.json(result.rows.length ? result.rows[0] : {});
  } catch (err) {
    console.error('GET /config-multivendeur:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/gestionnaires/:id/config-multivendeur ────────────────────────────
router.put('/:id/config-multivendeur', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin' || req.user.role === 'administration';
    if (!isAdmin && req.user.id !== gestionnaireId)
      return res.status(403).json({ success: false, message: 'Acces refuse.' });

    const { nom_boutique, slogan, couleur_accent, couleur_fond, accueil_hero_actif, accueil_hero_badge, accueil_categories_actif, accueil_categories_titre, accueil_nouveautes_actif, accueil_nouveautes_titre, accueil_cta_vendeurs_actif, accueil_cta_titre, accueil_cta_texte, catalogue_sidebar_actif, catalogue_filtres_actif, catalogue_tri_defaut, boutiques_hero_titre, boutiques_hero_texte, produit_onglet_description_actif, produit_onglet_details_actif, produit_onglet_livraison_actif, produit_similaires_actif, encheres_actif, encheres_hero_titre, encheres_hero_texte, footer_documents_actif, footer_politiques_actif } = req.body;

    await pool.query(
      `INSERT INTO config_multivendeur_premium
         (gestionnaire_id, nom_boutique, slogan, couleur_accent, couleur_fond, accueil_hero_actif, accueil_hero_badge, accueil_categories_actif, accueil_categories_titre, accueil_nouveautes_actif, accueil_nouveautes_titre, accueil_cta_vendeurs_actif, accueil_cta_titre, accueil_cta_texte, catalogue_sidebar_actif, catalogue_filtres_actif, catalogue_tri_defaut, boutiques_hero_titre, boutiques_hero_texte, produit_onglet_description_actif, produit_onglet_details_actif, produit_onglet_livraison_actif, produit_similaires_actif, encheres_actif, encheres_hero_titre, encheres_hero_texte, footer_documents_actif, footer_politiques_actif, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW())
       ON CONFLICT (gestionnaire_id) DO UPDATE SET
         nom_boutique = EXCLUDED.nom_boutique,
         slogan = EXCLUDED.slogan,
         couleur_accent = EXCLUDED.couleur_accent,
         couleur_fond = EXCLUDED.couleur_fond,
         accueil_hero_actif = EXCLUDED.accueil_hero_actif,
         accueil_hero_badge = EXCLUDED.accueil_hero_badge,
         accueil_categories_actif = EXCLUDED.accueil_categories_actif,
         accueil_categories_titre = EXCLUDED.accueil_categories_titre,
         accueil_nouveautes_actif = EXCLUDED.accueil_nouveautes_actif,
         accueil_nouveautes_titre = EXCLUDED.accueil_nouveautes_titre,
         accueil_cta_vendeurs_actif = EXCLUDED.accueil_cta_vendeurs_actif,
         accueil_cta_titre = EXCLUDED.accueil_cta_titre,
         accueil_cta_texte = EXCLUDED.accueil_cta_texte,
         catalogue_sidebar_actif = EXCLUDED.catalogue_sidebar_actif,
         catalogue_filtres_actif = EXCLUDED.catalogue_filtres_actif,
         catalogue_tri_defaut = EXCLUDED.catalogue_tri_defaut,
         boutiques_hero_titre = EXCLUDED.boutiques_hero_titre,
         boutiques_hero_texte = EXCLUDED.boutiques_hero_texte,
         produit_onglet_description_actif = EXCLUDED.produit_onglet_description_actif,
         produit_onglet_details_actif = EXCLUDED.produit_onglet_details_actif,
         produit_onglet_livraison_actif = EXCLUDED.produit_onglet_livraison_actif,
         produit_similaires_actif = EXCLUDED.produit_similaires_actif,
         encheres_actif = EXCLUDED.encheres_actif,
         encheres_hero_titre = EXCLUDED.encheres_hero_titre,
         encheres_hero_texte = EXCLUDED.encheres_hero_texte,
         footer_documents_actif = EXCLUDED.footer_documents_actif,
         footer_politiques_actif = EXCLUDED.footer_politiques_actif,
         updated_at = NOW()`,
      [gestionnaireId, nom_boutique, slogan, couleur_accent, couleur_fond, accueil_hero_actif, accueil_hero_badge, accueil_categories_actif, accueil_categories_titre, accueil_nouveautes_actif, accueil_nouveautes_titre, accueil_cta_vendeurs_actif, accueil_cta_titre, accueil_cta_texte, catalogue_sidebar_actif, catalogue_filtres_actif, catalogue_tri_defaut, boutiques_hero_titre, boutiques_hero_texte, produit_onglet_description_actif, produit_onglet_details_actif, produit_onglet_livraison_actif, produit_similaires_actif, encheres_actif, encheres_hero_titre, encheres_hero_texte, footer_documents_actif, footer_politiques_actif]
    );
    console.log(`Config multi-vendeur sauvegardee — gestionnaire ${gestionnaireId}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('PUT /config-multivendeur:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});



// ── GET /api/gestionnaires/:id/addons-statut — verifie si blog/faq sont actifs
router.get('/:id/addons-statut', async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const result = await pool.query(
      `SELECT addon_id FROM addons_gestionnaire WHERE gestionnaire_id = $1 AND actif = true`,
      [gestionnaireId]
    );
    const actifs = result.rows.map(r => r.addon_id);
    return res.json({
      blog_actif: actifs.includes('blog-vendeur'),
      faq_actif: actifs.includes('poser-une-question'),
      avis_actif: actifs.includes('avis-clients'),
    });
  } catch (err) {
    console.error('GET /addons-statut:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/gestionnaires/:id/blog — articles de blog publics
router.get('/:id/blog', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM blog_articles_gestionnaire WHERE gestionnaire_id = $1 ORDER BY date_publication DESC`,
      [parseInt(req.params.id)]
    );
    return res.json({ articles: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/gestionnaires/:id/faq — items FAQ publics
router.get('/:id/faq', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM faq_items_gestionnaire WHERE gestionnaire_id = $1 ORDER BY ordre ASC, id ASC`,
      [parseInt(req.params.id)]
    );
    return res.json({ items: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});



// ── GET /api/gestionnaires/:id/avis — avis publics du gestionnaire
router.get('/:id/avis', async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const produitId = req.query.produit_id ? parseInt(req.query.produit_id) : null;
    let query = `SELECT * FROM avis_gestionnaire WHERE gestionnaire_id = $1 AND approuve = true`;
    const params = [gestionnaireId];
    if (produitId) { query += ` AND produit_id = $2`; params.push(produitId); }
    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, params);

    const moyenneRes = await pool.query(
      `SELECT AVG(note_globale)::numeric(3,2) as moyenne, COUNT(*) as total FROM avis_gestionnaire WHERE gestionnaire_id = $1 AND approuve = true`,
      [gestionnaireId]
    );
    return res.json({
      avis: result.rows,
      moyenne: parseFloat(moyenneRes.rows[0]?.moyenne || '0'),
      total: parseInt(moyenneRes.rows[0]?.total || '0'),
    });
  } catch (err) {
    console.error('GET /avis:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/gestionnaires/:id/avis — soumettre un avis (public)
router.post('/:id/avis', async (req, res) => {
  try {
    const gestionnaireId = parseInt(req.params.id);
    const { produit_id, type_avis = 'vendeur', nom_client, email_client, note_globale, titre, commentaire } = req.body;
    if (!nom_client || !note_globale) return res.status(400).json({ error: 'Champs requis manquants.' });

    await pool.query(
      `INSERT INTO avis_gestionnaire (gestionnaire_id, produit_id, type_avis, nom_client, email_client, note_globale, titre, commentaire)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [gestionnaireId, produit_id || null, type_avis, nom_client, email_client || null, note_globale, titre || null, commentaire || null]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /avis:', err.message);
    return res.status(500).json({ error: err.message });
  }
});



// ── GET /api/gestionnaires/:id/politiques — politiques publiques du gestionnaire
router.get('/:id/politiques', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT slug, titre, contenu, updated_at FROM politiques_gestionnaire WHERE gestionnaire_id = $1 ORDER BY id ASC`,
      [parseInt(req.params.id)]
    );
    return res.json({ politiques: result.rows });
  } catch (err) {
    console.error('GET /politiques:', err.message);
    return res.json({ politiques: [] });
  }
});


// ── DELETE /api/gestionnaires/:id/reinitialiser-template
// Efface uniquement la config template du gestionnaire (template_actif + config_multivendeur_premium)
// Produits, collaborateurs, acheteurs, commandes : intacts
router.delete('/:id/reinitialiser-template', authenticateToken, async (req, res) => {
  const gestionnaireId = parseInt(req.params.id);

  if (req.user.id !== gestionnaireId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acces non autorise' });
  }

  // 1. Trouver les vraies colonnes de la table gestionnaires liees au template
  try {
    const colRes = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'gestionnaires'
      ORDER BY ordinal_position
    `);
    const toutesLesColonnes = colRes.rows.map(r => r.column_name);
    console.log('[reset-template] Colonnes gestionnaires:', toutesLesColonnes.join(', '));

    // Colonnes possibles selon ce qui existe vraiment
    const colonnesTemplate = ['template_actif','template','template_id','template_selectionne','template_choisi'];
    const colonnesPlan     = ['plan','plan_actif','forfait'];

    const setParts = [];
    for (const col of colonnesTemplate) {
      if (toutesLesColonnes.includes(col)) { setParts.push(`${col} = NULL`); break; }
    }
    for (const col of colonnesPlan) {
      if (toutesLesColonnes.includes(col)) { setParts.push(`${col} = NULL`); break; }
    }

    if (setParts.length > 0) {
      await pool.query(`UPDATE gestionnaires SET ${setParts.join(', ')} WHERE id = $1`, [gestionnaireId]);
      console.log(`[reset-template] UPDATE gestionnaires OK: ${setParts.join(', ')}`);
    } else {
      console.warn('[reset-template] Aucune colonne template/plan trouvee — UPDATE ignore');
    }
  } catch (err) {
    console.error('[reset-template] Etape 1:', err.message);
    return res.status(500).json({ message: 'Erreur: ' + err.message });
  }

  // 2. Effacer template_id dans la table sites (c'est la source principale)
  try {
    await pool.query(
      `UPDATE sites SET template_id = NULL, sous_type = NULL WHERE gestionnaire_id = $1`,
      [gestionnaireId]
    );
    console.log('[reset-template] sites UPDATE OK');
  } catch (err) {
    console.error('[reset-template] sites:', err.message);
    return res.status(500).json({ message: 'Erreur: ' + err.message });
  }

  // 3. Config multivendeur premium
  try {
    await pool.query(`DELETE FROM config_multivendeur_premium WHERE gestionnaire_id = $1`, [gestionnaireId]);
    console.log('[reset-template] config_multivendeur_premium OK');
  } catch (err) {
    console.warn('[reset-template] config_multivendeur_premium:', err.message);
  }

  // 3. Autres configs optionnelles
  for (const table of ['config_simplisse', 'config_boutique_premium', 'config_template']) {
    try { await pool.query(`DELETE FROM ${table} WHERE gestionnaire_id = $1`, [gestionnaireId]); } catch {}
  }

  console.log(`[reset-template] Reinitialisation complete pour gestionnaire ${gestionnaireId}`);
  res.json({ message: 'Template reinitialise avec succes' });
});

module.exports = router;