// routes/stripe_gestionnaire.js
// e-Vend Studio — Connexion Stripe Connect du gestionnaire (compte Standard)
// Utilise un compte plateforme Stripe SÉPARÉ de celui du marketplace e-Vend
// (STRIPE_SECRET_KEY_STUDIO — le 2e compte admin non utilisé).
// Comptes Standard uniquement : le gestionnaire a son propre dashboard Stripe
// complet, l'argent va 100% chez lui, e-Vend Studio ne prend aucune commission.

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.e-vendstudio.ca';

function getStripe() {
  const { Stripe } = require('stripe');
  return Stripe(process.env.STRIPE_SECRET_KEY_STUDIO);
}

// GET /api/gestionnaires/:id/stripe/statut
router.get('/:id/stripe/statut', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ message: 'Accès refusé.' });

    const result = await pool.query(`SELECT stripe_account_id FROM options_gestionnaire WHERE gestionnaire_id = $1`, [req.params.id]);
    const stripeAccountId = result.rows[0]?.stripe_account_id;

    if (!stripeAccountId) {
      return res.json({ connecte: false, verifie: false, stripe_account_id: '', account_type: '', docs_manquants: [] });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const verifie = !!account.details_submitted && !!account.charges_enabled;
    const docsManquants = (account.requirements?.currently_due || []).map((champ) => champ.replace(/_/g, ' '));

    await pool.query(`UPDATE options_gestionnaire SET stripe_verifie = $1 WHERE gestionnaire_id = $2`, [verifie, req.params.id]);

    res.json({
      connecte: true,
      verifie,
      stripe_account_id: stripeAccountId,
      account_type: 'Standard',
      docs_manquants: docsManquants,
    });
  } catch (err) {
    console.error('GET /stripe/statut', err);
    res.status(500).json({ message: 'Erreur lors de la vérification du statut Stripe.' });
  }
});

// POST /api/gestionnaires/:id/stripe/connect — crée le compte s'il n'existe pas, retourne un lien d'onboarding
router.post('/:id/stripe/connect', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ message: 'Accès refusé.' });
    const stripe = getStripe();

    const result = await pool.query(`SELECT stripe_account_id FROM options_gestionnaire WHERE gestionnaire_id = $1`, [req.params.id]);
    let stripeAccountId = result.rows[0]?.stripe_account_id;

    if (!stripeAccountId) {
      const gestionnaireResult = await pool.query(`SELECT email FROM gestionnaires WHERE id = $1`, [req.params.id]);
      const account = await stripe.accounts.create({
        type: 'standard',
        email: gestionnaireResult.rows[0]?.email || undefined,
        country: 'CA',
      });
      stripeAccountId = account.id;

      await pool.query(
        `INSERT INTO options_gestionnaire (gestionnaire_id, stripe_account_id)
         VALUES ($1, $2)
         ON CONFLICT (gestionnaire_id) DO UPDATE SET stripe_account_id = $2`,
        [req.params.id, stripeAccountId]
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${FRONTEND_URL}/dashboard?stripe=refresh`,
      return_url: `${FRONTEND_URL}/dashboard?stripe=success`,
      type: 'account_onboarding',
    });

    res.json({ onboarding_url: accountLink.url });
  } catch (err) {
    console.error('POST /stripe/connect', err);
    res.status(500).json({ message: 'Erreur lors de la connexion à Stripe.' });
  }
});

// POST /api/gestionnaires/:id/stripe/deconnecter — délie le compte côté e-Vend Studio (ne supprime pas le compte Stripe lui-même)
router.post('/:id/stripe/deconnecter', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ message: 'Accès refusé.' });
    await pool.query(
      `UPDATE options_gestionnaire SET stripe_account_id = NULL, stripe_verifie = FALSE WHERE gestionnaire_id = $1`,
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
  }
});

// ── PayPal — simple email + toggle, aucune API Partner/Platform requise ──────

// GET /api/gestionnaires/:id/paypal
router.get('/:id/paypal', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ message: 'Accès refusé.' });
    const result = await pool.query(`SELECT paypal_actif, paypal_email FROM options_gestionnaire WHERE gestionnaire_id = $1`, [req.params.id]);
    res.json(result.rows[0] || { paypal_actif: false, paypal_email: '' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/gestionnaires/:id/paypal
router.put('/:id/paypal', authenticateToken, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id)) return res.status(403).json({ message: 'Accès refusé.' });
    const { paypal_actif, paypal_email } = req.body;
    if (paypal_actif && !paypal_email) return res.status(400).json({ message: 'Courriel PayPal requis.' });

    await pool.query(
      `INSERT INTO options_gestionnaire (gestionnaire_id, paypal_actif, paypal_email)
       VALUES ($1, $2, $3)
       ON CONFLICT (gestionnaire_id) DO UPDATE SET
         paypal_actif = COALESCE($2, options_gestionnaire.paypal_actif),
         paypal_email = COALESCE($3, options_gestionnaire.paypal_email)`,
      [req.params.id, paypal_actif ?? null, paypal_email ?? null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la sauvegarde.' });
  }
});

module.exports = router;