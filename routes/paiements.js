// routes/paiements.js
// e-Vend Studio — Point d'entrée central pour le paiement des réservations et
// abonnements. Utilise Stripe Checkout (hébergé par Stripe, comme l'onboarding
// Connect déjà en place) plutôt que des champs de carte custom — Stripe gère
// la conformité PCI, nous n'avons jamais accès aux vraies données de carte.
//
// ⚠️ PayPal : réservations seulement (paiement unique). Les abonnements
// récurrents PayPal nécessitent une API complètement différente (PayPal
// Subscriptions), pas construite ici.
//
// ⚠️ Vérification PayPal plus faible que Stripe : le gestionnaire ne nous a
// donné que son Client ID (public), pas de Secret. La capture se fait côté
// navigateur (SDK JS PayPal), et notre backend fait confiance au résultat
// renvoyé par le frontend après capture — on ne peut pas revérifier
// indépendamment côté serveur sans le Secret PayPal du gestionnaire. Ajouter
// le Secret + vérification serveur (OAuth + GET /v2/checkout/orders/:id)
// serait un renforcement futur recommandé.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

function getStripePlateforme(config) {
  const { Stripe } = require('stripe');
  const cle = config.sandbox ? config.dev_secret_key : config.prod_secret_key;
  return Stripe(cle || process.env.STRIPE_SECRET_KEY_STUDIO);
}

async function chargerConfigAdmin() {
  const r = await pool.query('SELECT * FROM configuration_stripe_admin WHERE id = 1');
  return r.rows[0] || { sandbox: true };
}

async function chargerOptionsGestionnaire(siteId) {
  const r = await pool.query(
    `SELECT o.reservation_ecole_paiement, o.stripe_account_id, o.stripe_verifie,
            o.paypal_actif, o.paypal_email, o.paypal_client_id
     FROM sites s
     JOIN options_gestionnaire o ON o.gestionnaire_id = s.gestionnaire_id
     WHERE s.id = $1`,
    [siteId]
  );
  return r.rows[0] || {};
}

// GET /api/paiements/moyens/:siteId — quels moyens de paiement afficher (public)
router.get('/moyens/:siteId', async (req, res) => {
  try {
    const opts = await chargerOptionsGestionnaire(req.params.siteId);
    const configAdmin = await chargerConfigAdmin();

    const stripeDisponible = !!(opts.reservation_ecole_paiement && opts.stripe_account_id && opts.stripe_verifie);
    const paypalDisponible = !!(opts.reservation_ecole_paiement && opts.paypal_actif && opts.paypal_email && opts.paypal_client_id);

    res.json({
      stripe_disponible: stripeDisponible,
      stripe_publishable_key: stripeDisponible ? (configAdmin.sandbox ? configAdmin.dev_publish_key : configAdmin.prod_publish_key) : null,
      stripe_account_id: stripeDisponible ? opts.stripe_account_id : null,
      paypal_disponible: paypalDisponible,
      paypal_client_id: paypalDisponible ? opts.paypal_client_id : null,
    });
  } catch (err) {
    console.error('GET /api/paiements/moyens/:siteId', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// POST /api/paiements/reservation/:id/stripe-checkout — crée une session Stripe Checkout (paiement unique)
router.post('/reservation/:id/stripe-checkout', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.gestionnaire_id
       FROM reservations r JOIN sites s ON s.id = r.site_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Réservation introuvable.' });
    const reservation = result.rows[0];

    const opts = await chargerOptionsGestionnaire(reservation.site_id);
    if (!opts.stripe_account_id || !opts.stripe_verifie) return res.status(400).json({ message: 'Stripe non disponible pour ce site.' });

    const configAdmin = await chargerConfigAdmin();
    const stripe = getStripePlateforme(configAdmin);
    const baseUrl = process.env.BACKEND_URL || 'https://www.e-vendstudio.ca';

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: reservation.devise || 'cad',
            unit_amount: Math.round(Number(reservation.montant) * 100),
            product_data: { name: reservation.objet_reserve || 'Réservation' },
          },
          quantity: 1,
        }],
        customer_email: reservation.email_client,
        metadata: { type: 'reservation', reservation_id: String(reservation.id) },
        success_url: `${baseUrl}/paiement-confirme?type=reservation&id=${reservation.id}`,
        cancel_url: `${baseUrl}/paiement-annule?type=reservation&id=${reservation.id}`,
      },
      { stripeAccount: opts.stripe_account_id }
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error('POST /reservation/:id/stripe-checkout', err);
    res.status(500).json({ message: 'Erreur lors de la création du paiement Stripe.' });
  }
});

// POST /api/paiements/reservation/:id/confirmer-paypal — après capture côté navigateur (SDK JS PayPal)
router.post('/reservation/:id/confirmer-paypal', async (req, res) => {
  try {
    const { orderID } = req.body;
    if (!orderID) return res.status(400).json({ message: 'orderID requis.' });

    const result = await pool.query(`SELECT * FROM reservations WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Réservation introuvable.' });
    const reservation = result.rows[0];
    if (reservation.statut_paiement === 'recu') return res.json({ success: true }); // déjà confirmé

    await pool.query(
      `UPDATE reservations SET statut = 'confirmee', statut_paiement = 'recu' WHERE id = $1`,
      [reservation.id]
    );

    const { envoyerCourrielReservation } = require('./reservations');
    const siteResult = await pool.query(
      `SELECT s.config, g.email as gestionnaire_email FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id WHERE s.id = $1`,
      [reservation.site_id]
    );
    const siteData = siteResult.rows[0];
    const configSite = { ...(siteData?.config || {}), gestionnaireEmail: siteData?.gestionnaire_email };
    envoyerCourrielReservation('confirmation', { ...reservation, statut_paiement: 'recu' }, configSite);

    res.json({ success: true });
  } catch (err) {
    console.error('POST /reservation/:id/confirmer-paypal', err);
    res.status(500).json({ message: 'Erreur lors de la confirmation du paiement.' });
  }
});

// POST /api/paiements/abonnement/:id/stripe-checkout — crée une session Stripe Checkout (abonnement récurrent)
router.post('/abonnement/:id/stripe-checkout', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, f.titre as formation_titre, f.stripe_product_id,
              f.stripe_price_hebdo_id, f.stripe_price_mensuel_id, f.stripe_price_annuel_id
       FROM abonnements_clients a JOIN formations f ON f.id = a.formation_id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Abonnement introuvable.' });
    const abonnement = result.rows[0];

    const opts = await chargerOptionsGestionnaire(abonnement.site_id);
    if (!opts.stripe_account_id || !opts.stripe_verifie) return res.status(400).json({ message: 'Stripe non disponible pour ce site.' });

    const configAdmin = await chargerConfigAdmin();
    const stripe = getStripePlateforme(configAdmin);
    const baseUrl = process.env.BACKEND_URL || 'https://www.e-vendstudio.ca';

    // Colonne stripe_price_* correspondant à la fréquence choisie
    const colonnePrix = { hebdomadaire: 'stripe_price_hebdo_id', mensuel: 'stripe_price_mensuel_id', annuel: 'stripe_price_annuel_id' }[abonnement.frequence];
    let priceId = abonnement[colonnePrix];

    // Créer le Product + Price sur Stripe (une seule fois, réutilisé ensuite) s'ils n'existent pas encore
    if (!priceId) {
      let productId = abonnement.stripe_product_id;
      if (!productId) {
        const product = await stripe.products.create({ name: abonnement.formation_titre }, { stripeAccount: opts.stripe_account_id });
        productId = product.id;
        await pool.query(`UPDATE formations SET stripe_product_id = $1 WHERE id = $2`, [productId, abonnement.formation_id]);
      }
      const intervalleStripe = { hebdomadaire: 'week', mensuel: 'month', annuel: 'year' }[abonnement.frequence];
      const price = await stripe.prices.create(
        {
          product: productId,
          unit_amount: Math.round(Number(abonnement.montant) * 100),
          currency: abonnement.devise || 'cad',
          recurring: { interval: intervalleStripe },
        },
        { stripeAccount: opts.stripe_account_id }
      );
      priceId = price.id;
      await pool.query(`UPDATE formations SET ${colonnePrix} = $1 WHERE id = $2`, [priceId, abonnement.formation_id]);
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: abonnement.email_client,
        metadata: { type: 'abonnement', abonnement_id: String(abonnement.id) },
        success_url: `${baseUrl}/paiement-confirme?type=abonnement&id=${abonnement.id}`,
        cancel_url: `${baseUrl}/paiement-annule?type=abonnement&id=${abonnement.id}`,
      },
      { stripeAccount: opts.stripe_account_id }
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error('POST /abonnement/:id/stripe-checkout', err);
    res.status(500).json({ message: 'Erreur lors de la création du paiement Stripe.' });
  }
});

// GET /api/paiements/reservation/:id — détails publics minimaux pour la page de paiement
router.get('/reservation/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, site_id, nom_client, objet_reserve, montant, devise, statut_paiement FROM reservations WHERE id = $1`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Réservation introuvable.' });
    const reservation = r.rows[0];
    const opts = await chargerOptionsGestionnaire(reservation.site_id);
    const configAdmin = await chargerConfigAdmin();
    const stripeDisponible = !!(opts.reservation_ecole_paiement && opts.stripe_account_id && opts.stripe_verifie);
    const paypalDisponible = !!(opts.reservation_ecole_paiement && opts.paypal_actif && opts.paypal_email && opts.paypal_client_id);
    res.json({
      ...reservation,
      stripe_disponible: stripeDisponible,
      paypal_disponible: paypalDisponible,
      paypal_client_id: paypalDisponible ? opts.paypal_client_id : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// GET /api/paiements/abonnement/:id — détails publics minimaux pour la page de paiement
router.get('/abonnement/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT a.id, a.site_id, a.nom_client, f.titre as formation_titre, a.montant, a.devise, a.frequence, a.statut
       FROM abonnements_clients a JOIN formations f ON f.id = a.formation_id WHERE a.id = $1`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ message: 'Abonnement introuvable.' });
    const abonnement = r.rows[0];
    const opts = await chargerOptionsGestionnaire(abonnement.site_id);
    const stripeDisponible = !!(opts.stripe_account_id && opts.stripe_verifie); // abonnement = Stripe seulement
    res.json({ ...abonnement, stripe_disponible: stripeDisponible });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;