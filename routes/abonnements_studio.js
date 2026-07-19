// routes/abonnements_studio.js
// ============================================================
// Système d'abonnements e-Vend Studio
// ============================================================
// - Essai gratuit 14 jours (aucune carte demandée)
// - Un seul abonnement Stripe par gestionnaire (composite)
// - Cycle glissant à partir de la date de fin d'essai
// - Options dynamiques (catalogue options_studio)
// - Annulation en tout temps (accès conservé jusqu'à période_fin)
// ============================================================

const express  = require('express');
const router   = express.Router();
const pool     = require('../db');
const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { calculerTaxes, getTauxTaxes } = require('../src/utils/monetisationPub');

const FRONTEND_URL    = process.env.FRONTEND_URL || 'https://e-vendstudio.ca';
const FROM_EMAIL      = process.env.FROM_EMAIL   || 'contact@e-vendstudio.ca';
const JOURS_ESSAI     = 14;
// ⚠️ TAUX_TPS/TAUX_TVQ et calculerTaxes() codés en dur retirés — les taux
// viennent maintenant de configuration_monetisation_pub (configurable dans
// l'admin, page Monétisation), via le helper partagé importé ci-dessus.

// ─────────────────────────────────────────────────────────────
// HELPER — Récupérer ou créer le Customer Stripe
// ─────────────────────────────────────────────────────────────
async function getOrCreateCustomer(gestionnaire, abonnement) {
  if (abonnement.stripe_customer_id) {
    return abonnement.stripe_customer_id;
  }
  const customer = await stripe.customers.create({
    email:    gestionnaire.email,
    name:     gestionnaire.nom || gestionnaire.nom_boutique || gestionnaire.email,
    metadata: { gestionnaire_id: String(gestionnaire.id), evend_studio: 'true' },
  });
  await pool.query(
    `UPDATE abonnements_studio SET stripe_customer_id = $1 WHERE id = $2`,
    [customer.id, abonnement.id]
  );
  return customer.id;
}

// ─────────────────────────────────────────────────────────────
// HELPER — Calculer le montant HT total des lignes actives
// ─────────────────────────────────────────────────────────────
async function calculerMontantHT(abonnementId) {
  const res = await pool.query(
    `SELECT COALESCE(SUM(prix_ht), 0) AS total
     FROM abonnements_lignes WHERE abonnement_id = $1 AND actif = TRUE`,
    [abonnementId]
  );
  return parseFloat(res.rows[0].total) || 0;
}

// ─────────────────────────────────────────────────────────────
// HELPER — Synchroniser le Price Stripe avec les lignes actuelles
// (crée un nouveau Price si le montant a changé)
// ─────────────────────────────────────────────────────────────
async function syncStripePrice(abonnement, montantHT) {
  const taxes   = await calculerTaxes(montantHT);
  const totalCents = Math.round(taxes.total * 100);

  let product;
  if (abonnement.stripe_price_id) {
    // Récupérer le product existant via l'ancien Price
    try {
      const ancienPrice = await stripe.prices.retrieve(abonnement.stripe_price_id);
      product = { id: ancienPrice.product };
    } catch {}
  }

  if (!product) {
    product = await stripe.products.create({
      name:     'Abonnement e-Vend Studio',
      metadata: { evend_studio: 'true' },
    });
  }

  const price = await stripe.prices.create({
    product:   product.id,
    currency:  'cad',
    unit_amount: totalCents,
    recurring: { interval: 'month' },
    metadata:  { abonnement_id: String(abonnement.id), evend_studio: 'true' },
  });

  await pool.query(
    `UPDATE abonnements_studio SET stripe_price_id = $1 WHERE id = $2`,
    [price.id, abonnement.id]
  );

  return price.id;
}

// ─────────────────────────────────────────────────────────────
// GET /api/abonnements-studio/mon-abonnement
// Retourne l'abonnement + lignes + montant du gestionnaire connecté
// ─────────────────────────────────────────────────────────────
router.get('/mon-abonnement', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;

    const aboRes = await pool.query(
      `SELECT a.*, f.nom AS forfait_nom, f.description AS forfait_description
       FROM abonnements_studio a
       LEFT JOIN forfaits_studio f ON f.id = a.forfait_id
       WHERE a.gestionnaire_id = $1
       ORDER BY a.created_at DESC LIMIT 1`,
      [gestionnaireId]
    );

    if (!aboRes.rows.length) {
      return res.json({ abonnement: null, lignes: [], totaux: null });
    }

    const abo = aboRes.rows[0];

    const lignesRes = await pool.query(
      `SELECT * FROM abonnements_lignes WHERE abonnement_id = $1 AND actif = TRUE ORDER BY type, id`,
      [abo.id]
    );

    const montantHT = lignesRes.rows.reduce((sum, l) => sum + parseFloat(l.prix_ht || 0), 0);
    const taxes = await calculerTaxes(montantHT);

    const joursEssaiRestants = abo.statut === 'essai' && abo.essai_fin
      ? Math.max(0, Math.ceil((new Date(abo.essai_fin) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;

    res.json({
      abonnement: { ...abo, jours_essai_restants: joursEssaiRestants },
      lignes: lignesRes.rows,
      totaux: { montant_ht: montantHT, tps: taxes.tps, tvq: taxes.tvq, total: taxes.total },
    });
  } catch (err) {
    console.error('❌ GET /mon-abonnement:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/abonnements-studio/options-disponibles
// Liste le catalogue des options activables
// ─────────────────────────────────────────────────────────────
router.get('/options-disponibles', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM options_studio WHERE actif = TRUE ORDER BY ordre, id`
    );

    // Pour chaque option, vérifier si le gestionnaire l'a déjà activée
    const aboRes = await pool.query(
      `SELECT id FROM abonnements_studio WHERE gestionnaire_id = $1 AND statut NOT IN ('expire','a_supprimer') LIMIT 1`,
      [req.user.id]
    );

    let optionsActivees = new Set();
    if (aboRes.rows.length) {
      const lignesRes = await pool.query(
        `SELECT code FROM abonnements_lignes WHERE abonnement_id = $1 AND actif = TRUE AND type = 'option'`,
        [aboRes.rows[0].id]
      );
      optionsActivees = new Set(lignesRes.rows.map(r => r.code));
    }

    const taux = await getTauxTaxes();
    const calculerTaxesSync = (montantHT) => {
      const tps = Math.round(montantHT * taux.tps * 100) / 100;
      const tvq = Math.round(montantHT * taux.tvq * 100) / 100;
      return { tps, tvq, total: Math.round((montantHT + tps + tvq) * 100) / 100 };
    };

    const optionsAvecStatut = rows.map(o => ({
      ...o,
      activee: optionsActivees.has(o.code),
      taxes: calculerTaxesSync(parseFloat(o.prix_ht)),
    }));

    res.json(optionsAvecStatut);
  } catch (err) {
    console.error('❌ GET /options-disponibles:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// FONCTION RÉUTILISABLE — Démarrer l'essai pour un gestionnaire
// Utilisée par la route POST /demarrer-essai ci-dessous ET par
// routes/gestionnaires.js juste après la création d'un compte.
// Lève une erreur (err.code = 'ABONNEMENT_EXISTANT') si un abonnement
// existe déjà — à catcher par l'appelant.
// ─────────────────────────────────────────────────────────────
async function demarrerEssaiPourGestionnaire(gestionnaireId, forfaitId = null) {
  // Vérifier qu'il n'a pas déjà un abonnement actif
  const existant = await pool.query(
    `SELECT id FROM abonnements_studio WHERE gestionnaire_id = $1 LIMIT 1`,
    [gestionnaireId]
  );
  if (existant.rows.length) {
    const err = new Error('Un abonnement ou essai existe déjà pour ce compte.');
    err.code = 'ABONNEMENT_EXISTANT';
    throw err;
  }

  const essaiDebut = new Date();
  const essaiFin  = new Date(essaiDebut.getTime() + JOURS_ESSAI * 24 * 60 * 60 * 1000);

  // Créer l'abonnement en statut 'essai'
  const aboRes = await pool.query(
    `INSERT INTO abonnements_studio
       (gestionnaire_id, forfait_id, statut, essai_debut, essai_fin)
     VALUES ($1, $2, 'essai', $3, $4)
     RETURNING *`,
    [gestionnaireId, forfaitId || null, essaiDebut, essaiFin]
  );
  const abo = aboRes.rows[0];

  // Si un forfait est sélectionné, créer la ligne de base
  if (forfaitId) {
    const forfait = await pool.query(`SELECT * FROM forfaits_studio WHERE id = $1`, [forfaitId]);
    if (forfait.rows.length) {
      const f = forfait.rows[0];
      await pool.query(
        `INSERT INTO abonnements_lignes (abonnement_id, type, reference_id, code, nom, prix_ht)
         VALUES ($1, 'forfait', $2, $3, $4, $5)`,
        [abo.id, f.id, `forfait_${f.id}`, f.nom, f.prix_ht]
      );
    }
  }

  // Mettre à jour gestionnaires.statut_abo / essai_fin
  await pool.query(
    `UPDATE gestionnaires SET statut_abo = 'essai', essai_debut = $1, essai_fin = $2 WHERE id = $3`,
    [essaiDebut, essaiFin, gestionnaireId]
  );

  return { essai_fin: essaiFin, abonnement: abo };
}

// ─────────────────────────────────────────────────────────────
// POST /api/abonnements-studio/demarrer-essai
// Crée l'essai gratuit de 14 jours pour un nouveau gestionnaire.
// Peut aussi être déclenché automatiquement à la création de compte
// via demarrerEssaiPourGestionnaire() (voir gestionnaires.js).
// ─────────────────────────────────────────────────────────────
router.post('/demarrer-essai', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;
    const { forfait_id } = req.body;

    const resultat = await demarrerEssaiPourGestionnaire(gestionnaireId, forfait_id);

    res.json({ success: true, essai_fin: resultat.essai_fin, abonnement: resultat.abonnement });
  } catch (err) {
    if (err.code === 'ABONNEMENT_EXISTANT') {
      return res.status(409).json({ error: err.message });
    }
    console.error('❌ POST /demarrer-essai:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// FONCTION RÉUTILISABLE — Générer un lien de paiement Stripe Checkout
// pour un gestionnaire donné. Utilisée par la route ci-dessous ET
// par routes/authStudio.js quand un compte 'expire' tente de se
// connecter (aucun token émis dans ce cas — juste le lien Stripe).
// ─────────────────────────────────────────────────────────────
async function genererLienPaiementPourGestionnaire(gestionnaireId) {
  const gRes = await pool.query(`SELECT * FROM gestionnaires WHERE id = $1`, [gestionnaireId]);
  if (!gRes.rows.length) {
    const err = new Error('Gestionnaire introuvable.');
    err.code = 'GESTIONNAIRE_INTROUVABLE';
    throw err;
  }
  const gestionnaire = gRes.rows[0];

  // Inclut volontairement 'expire' : un compte expiré doit pouvoir
  // relancer son paiement pour redevenir actif. Seul 'a_supprimer'
  // (compte en cours de suppression définitive) est exclu.
  const aboRes = await pool.query(
    `SELECT * FROM abonnements_studio WHERE gestionnaire_id = $1 AND statut != 'a_supprimer'
     ORDER BY created_at DESC LIMIT 1`,
    [gestionnaireId]
  );
  if (!aboRes.rows.length) {
    const err = new Error('Aucun abonnement trouvé.');
    err.code = 'ABONNEMENT_INTROUVABLE';
    throw err;
  }
  const abo = aboRes.rows[0];

  const montantHT = await calculerMontantHT(abo.id);
  if (montantHT <= 0) {
    const err = new Error('Montant de l\'abonnement est 0 — aucun plan payant sélectionné.');
    err.code = 'MONTANT_NUL';
    throw err;
  }

  const customerId = await getOrCreateCustomer(gestionnaire, abo);
  const priceId    = await syncStripePrice(abo, montantHT);

  // Stripe Checkout en mode subscription (sans trial puisque l'essai
  // est géré par notre propre système, pas par Stripe)
  const session = await stripe.checkout.sessions.create({
    customer:     customerId,
    mode:         'subscription',
    line_items:   [{ price: priceId, quantity: 1 }],
    success_url:  `${FRONTEND_URL}/dashboard?abo=succes&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:   `${FRONTEND_URL}/login?abo=annule`,
    locale:       'fr',
    metadata: {
      gestionnaire_id: String(gestionnaireId),
      abonnement_id:   String(abo.id),
      evend_studio:    'true',
    },
    subscription_data: {
      metadata: {
        gestionnaire_id: String(gestionnaireId),
        abonnement_id:   String(abo.id),
        evend_studio:    'true',
      },
    },
  });

  return session.url;
}

// ─────────────────────────────────────────────────────────────
// POST /api/abonnements-studio/configurer-paiement
// Lance le Checkout Stripe pour configurer la carte et démarrer
// l'abonnement payant (appelé à la fin de la période d'essai ou
// quand le gestionnaire clique "Activer mon abonnement").
// ─────────────────────────────────────────────────────────────
router.post('/configurer-paiement', authenticateToken, async (req, res) => {
  try {
    const url = await genererLienPaiementPourGestionnaire(req.user.id);
    res.json({ url });
  } catch (err) {
    if (['GESTIONNAIRE_INTROUVABLE', 'ABONNEMENT_INTROUVABLE'].includes(err.code)) {
      return res.status(404).json({ error: err.message });
    }
    if (err.code === 'MONTANT_NUL') {
      return res.status(400).json({ error: err.message });
    }
    console.error('❌ POST /configurer-paiement:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/abonnements-studio/options/:code/activer
// Active une option et met à jour le subscription Stripe
// ─────────────────────────────────────────────────────────────
router.post('/options/:code/activer', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;
    const { code } = req.params;

    const optionRes = await pool.query(
      `SELECT * FROM options_studio WHERE code = $1 AND actif = TRUE`, [code]
    );
    if (!optionRes.rows.length) return res.status(404).json({ error: 'Option introuvable.' });
    const option = optionRes.rows[0];

    const aboRes = await pool.query(
      `SELECT * FROM abonnements_studio WHERE gestionnaire_id = $1 AND statut NOT IN ('expire','a_supprimer') LIMIT 1`,
      [gestionnaireId]
    );
    if (!aboRes.rows.length) return res.status(404).json({ error: 'Aucun abonnement actif.' });
    const abo = aboRes.rows[0];

    // Vérifier si déjà activée
    const existante = await pool.query(
      `SELECT id FROM abonnements_lignes WHERE abonnement_id = $1 AND code = $2 AND actif = TRUE`,
      [abo.id, code]
    );
    if (existante.rows.length) return res.status(409).json({ error: 'Option déjà activée.' });

    // Ajouter la ligne
    await pool.query(
      `INSERT INTO abonnements_lignes (abonnement_id, type, reference_id, code, nom, prix_ht)
       VALUES ($1, 'option', $2, $3, $4, $5)`,
      [abo.id, option.id, option.code, option.nom, option.prix_ht]
    );

    // Si l'abonnement est actif, mettre à jour le Price Stripe
    if (abo.statut === 'actif' && abo.stripe_subscription_id) {
      const montantHT = await calculerMontantHT(abo.id);
      const priceId   = await syncStripePrice(abo, montantHT);
      await stripe.subscriptions.update(abo.stripe_subscription_id, {
        items: [{ id: (await stripe.subscriptions.retrieve(abo.stripe_subscription_id)).items.data[0].id, price: priceId }],
        proration_behavior: 'none', // pas de prorata mid-cycle
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ POST /options/:code/activer:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/abonnements-studio/options/:code
// Désactive une option (effet au prochain cycle)
// ─────────────────────────────────────────────────────────────
router.delete('/options/:code', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;
    const { code } = req.params;

    const aboRes = await pool.query(
      `SELECT * FROM abonnements_studio WHERE gestionnaire_id = $1 AND statut NOT IN ('expire','a_supprimer') LIMIT 1`,
      [gestionnaireId]
    );
    if (!aboRes.rows.length) return res.status(404).json({ error: 'Aucun abonnement actif.' });
    const abo = aboRes.rows[0];

    await pool.query(
      `UPDATE abonnements_lignes SET actif = FALSE WHERE abonnement_id = $1 AND code = $2`,
      [abo.id, code]
    );

    // Mettre à jour Stripe si abonnement actif
    if (abo.statut === 'actif' && abo.stripe_subscription_id) {
      const montantHT = await calculerMontantHT(abo.id);
      const priceId   = await syncStripePrice(abo, montantHT);
      await stripe.subscriptions.update(abo.stripe_subscription_id, {
        items: [{ id: (await stripe.subscriptions.retrieve(abo.stripe_subscription_id)).items.data[0].id, price: priceId }],
        proration_behavior: 'none',
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /options/:code:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/abonnements-studio/annuler
// Annule l'abonnement (accès conservé jusqu'à période_fin)
// ─────────────────────────────────────────────────────────────
router.post('/annuler', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;

    const aboRes = await pool.query(
      `SELECT * FROM abonnements_studio WHERE gestionnaire_id = $1 AND statut = 'actif' LIMIT 1`,
      [gestionnaireId]
    );
    if (!aboRes.rows.length) return res.status(404).json({ error: 'Aucun abonnement actif à annuler.' });
    const abo = aboRes.rows[0];

    // Annuler chez Stripe à la fin de la période en cours (cancel_at_period_end)
    if (abo.stripe_subscription_id) {
      await stripe.subscriptions.update(abo.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    await pool.query(
      `UPDATE abonnements_studio SET statut = 'annule' WHERE id = $1`,
      [abo.id]
    );
    await pool.query(
      `UPDATE gestionnaires SET statut_abo = 'annule' WHERE id = $1`,
      [gestionnaireId]
    );

    res.json({ success: true, message: 'Abonnement annulé. Accès conservé jusqu\'à la fin de la période en cours.' });
  } catch (err) {
    console.error('❌ POST /annuler:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/abonnements-studio/portail
// Redirige vers le portail Stripe (gestion carte, factures)
// ─────────────────────────────────────────────────────────────
router.post('/portail', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;

    const aboRes = await pool.query(
      `SELECT stripe_customer_id FROM abonnements_studio WHERE gestionnaire_id = $1 AND stripe_customer_id IS NOT NULL LIMIT 1`,
      [gestionnaireId]
    );
    if (!aboRes.rows.length || !aboRes.rows[0].stripe_customer_id) {
      return res.status(404).json({ error: 'Aucune carte configurée pour le moment.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   aboRes.rows[0].stripe_customer_id,
      return_url: `${FRONTEND_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ POST /portail:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/abonnements-studio/mes-factures
// Liste l'historique des factures d'abonnement du gestionnaire connecté
// (une ligne par paiement réussi dans abonnements_paiements)
// ─────────────────────────────────────────────────────────────
router.get('/mes-factures', authenticateToken, async (req, res) => {
  try {
    const gestionnaireId = req.user.id;

    const result = await pool.query(
      `SELECT id, numero_facture, statut, montant_ht, tps, tvq, montant_total,
              periode_debut, periode_fin, created_at
       FROM abonnements_paiements
       WHERE gestionnaire_id = $1
       ORDER BY created_at DESC`,
      [gestionnaireId]
    );

    res.json({ factures: result.rows });
  } catch (err) {
    console.error('❌ GET /mes-factures:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/abonnements-studio/factures/:id
// Détail complet d'une facture d'abonnement, pour affichage/impression
// ─────────────────────────────────────────────────────────────
router.get('/factures/:id', authenticateToken, async (req, res) => {
  try {
    const factureId = parseInt(req.params.id);
    const gestionnaireId = req.user.id;

    const result = await pool.query(
      `SELECT p.*, g.nom AS gestionnaire_nom, g.nom_boutique AS gestionnaire_boutique,
              g.email AS gestionnaire_email,
              CONCAT(
                COALESCE(g.num_civique || ' ', ''),
                COALESCE(g.rue || ', ', ''),
                COALESCE(g.ville || ', ', ''),
                COALESCE(g.province || ' ', ''),
                COALESCE(g.code_postal, '')
              ) AS gestionnaire_adresse,
              g.no_tps AS gestionnaire_no_tps, g.no_taxe_provinciale AS gestionnaire_no_tvq,
              to_char(p.created_at,    'DD/MM/YYYY') AS date_emission_fr,
              to_char(p.periode_debut, 'DD/MM/YYYY') AS periode_debut_fr,
              to_char(p.periode_fin,   'DD/MM/YYYY') AS periode_fin_fr
       FROM abonnements_paiements p
       JOIN gestionnaires g ON g.id = p.gestionnaire_id
       WHERE p.id = $1`,
      [factureId]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Facture non trouvée.' });

    const facture = result.rows[0];

    // Un gestionnaire ne peut voir que ses propres factures
    if (facture.gestionnaire_id !== gestionnaireId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    // Récupérer aussi le détail des lignes actives au moment de la facture
    // (best-effort : on prend les lignes actuelles, faute d'historique ligne par ligne)
    const lignesRes = await pool.query(
      `SELECT nom, code, prix_ht FROM abonnements_lignes
       WHERE abonnement_id = $1 AND actif = TRUE ORDER BY type, id`,
      [facture.abonnement_id]
    );

    res.json({ ...facture, lignes: lignesRes.rows });
  } catch (err) {
    console.error('❌ GET /factures/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.demarrerEssaiPourGestionnaire = demarrerEssaiPourGestionnaire;
module.exports.genererLienPaiementPourGestionnaire = genererLienPaiementPourGestionnaire;