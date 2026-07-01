// ─────────────────────────────────────────────────────────────────────────────
// middleware/verifierLimitePlan.js
// Middleware à ajouter sur POST /api/creer-annonce (et tout POST produit vendeur)
// ─────────────────────────────────────────────────────────────────────────────
const pool = require('../db');

/**
 * Vérifie que le vendeur n'a pas atteint la limite de produits de son plan.
 * Le vendeurId doit être présent dans req.body.vendeur_id ou req.user.id (JWT).
 * 
 * Usage dans creer_annonce.js :
 *   const verifierLimitePlan = require('../middleware/verifierLimitePlan');
 *   router.post('/', verifierLimitePlan, async (req, res) => { ... });
 */
async function verifierLimitePlan(req, res, next) {
    try {
        // Récupérer le vendeurId — adapte selon ton auth (JWT ou body)
        const vendeurId = req.body.vendeur_id || req.user?.id || req.body.vendeurId;

        if (!vendeurId) {
            return res.status(400).json({ 
                error: 'vendeur_id manquant',
                code: 'VENDEUR_ID_REQUIS'
            });
        }

        // 1. Trouver l'abonnement actif
        const abonnementRes = await pool.query(
            `SELECT plan FROM abonnements 
             WHERE seller_id = $1 AND statut = 'actif' 
             ORDER BY date_debut DESC LIMIT 1`,
            [vendeurId]
        );

        // Pas d'abonnement actif = bloqué
        if (abonnementRes.rows.length === 0) {
            return res.status(403).json({
                error: 'Aucun abonnement actif. Veuillez souscrire à un plan pour publier des annonces.',
                code: 'AUCUN_ABONNEMENT_ACTIF',
                peut_creer: false
            });
        }

        const nomPlan = abonnementRes.rows[0].plan;

        // 2. Trouver le plan dans la table plans
        const planRes = await pool.query(
            `SELECT id, nom, limiter_produits, limite_produits, fonctionnalites, commission_active, commission
             FROM plans 
             WHERE LOWER(TRIM(nom)) = LOWER(TRIM($1)) AND statut = 'actif'
             LIMIT 1`,
            [nomPlan]
        );

        // Plan introuvable dans la table = on laisse passer (plan legacy ?)
        // Tu peux changer ce comportement en return 403 si tu veux être strict
        if (planRes.rows.length === 0) {
            console.warn(`⚠️ Plan "${nomPlan}" du vendeur ${vendeurId} introuvable dans la table plans — accès autorisé par défaut`);
            req.planVendeur = null;
            return next();
        }

        const plan = planRes.rows[0];

        // 3. Si le plan ne limite pas les produits, on laisse passer
        if (!plan.limiter_produits || plan.limite_produits === null) {
            req.planVendeur = plan;
            return next();
        }

        // 4. Compter les produits actifs du vendeur
        const produitsRes = await pool.query(
            `SELECT COUNT(*) as nb 
             FROM produits 
             WHERE vendeur_id = $1 AND statut NOT IN ('supprime', 'archive')`,
            [vendeurId]
        );
        const nbActifs = parseInt(produitsRes.rows[0].nb) || 0;

        // 5. Vérifier la limite
        if (nbActifs >= plan.limite_produits) {
            return res.status(403).json({
                error: `Limite atteinte. Votre plan "${plan.nom}" permet un maximum de ${plan.limite_produits} annonce${plan.limite_produits > 1 ? 's' : ''}. Vous en avez actuellement ${nbActifs}.`,
                code: 'LIMITE_PRODUITS_ATTEINTE',
                peut_creer: false,
                nb_actifs: nbActifs,
                limite: plan.limite_produits,
                plan: plan.nom
            });
        }

        // 6. OK — on attache le plan à la requête pour usage ultérieur (ex: appliquer commission)
        req.planVendeur = plan;
        next();

    } catch (err) {
        console.error('❌ verifierLimitePlan:', err);
        // En cas d'erreur technique, on laisse passer pour ne pas bloquer les vendeurs
        // Change en return res.status(500) si tu préfères être strict
        next();
    }
}

module.exports = verifierLimitePlan;