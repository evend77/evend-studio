// routes/dons.js
// e-Vend Studio — CagnottePro — Gestion des dons avec Stripe

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Helper: récupérer la clé Stripe du vendeur ──────────────────────────────
async function getStripeGestionnaire(gestionnaireId) {
  // On utilise la config Stripe admin (comme dans vendeurs_config.js)
  const cfg = await pool.query(`SELECT * FROM configuration_stripe_admin WHERE id = 1`);
  if (!cfg.rows.length) throw new Error('Configuration Stripe non configurée.');
  const row = cfg.rows[0];

  // Récupérer le stripe_compte_id du vendeur
  const gestionnaire = await pool.query(
    `SELECT stripe_compte_id FROM gestionnaires_config WHERE gestionnaire_id = $1`,
    [vendeurId]
  );
  const stripeAccountId = gestionnaire.rows[0]?.stripe_compte_id;
  if (!stripeAccountId) throw new Error('Le gestionnaire n\'a pas connecté son compte Stripe.');

  // Clé secrète admin (pour créer les sessions au nom du vendeur)
  let stripeKey = row.sandbox ? row.dev_secret_key : row.prod_secret_key;
  // Déchiffrer si nécessaire
  try {
    const { dechiffrer } = require('../services/chiffrement');
    stripeKey = dechiffrer(stripeKey);
  } catch {}

  return { stripeKey, stripeAccountId };
}

// ─── POST /api/dons/creer-session ────────────────────────────────────────────
// Crée une session Stripe Checkout pour un don
router.post('/creer-session', async (req, res) => {
  const { site_id, vendeur_id: gestionnaire_id, montant, nom_donateur, anonyme, message } = req.body;

  if (!site_id || !gestionnaire_id || !montant || montant < 1) {
    return res.status(400).json({ message: 'Montant minimum 1$.' });
  }

  try {
    const { stripeKey, stripeAccountId } = await getStripeGestionnaire(gestionnaire_id);
    const stripe = require('stripe')(stripeKey);

    // Créer le don en attente
    const donResult = await pool.query(
      `INSERT INTO dons (site_id, gestionnaire_id, nom_donateur, anonyme, montant, message, statut)
       VALUES ($1, $2, $3, $4, $5, $6, 'en_attente') RETURNING id`,
      [site_id, gestionnaire_id, anonyme ? 'Anonyme' : (nom_donateur || 'Anonyme'), anonyme || false, montant, message || null]
    );
    const donId = donResult.rows[0].id;

    // Récupérer l'URL du site pour le redirect
    const siteResult = await pool.query('SELECT slug FROM sites WHERE id = $1', [site_id]);
    const slug = siteResult.rows[0]?.slug || '';

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Don CagnottePro`,
            description: message ? `Message: ${message.substring(0, 100)}` : 'Merci pour votre générosité!',
          },
          unit_amount: Math.round(montant * 100), // en cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/site-preview?gestionnaireId=${gestionnaire_id}&don=succes&donId=${donId}`,
      cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:3000'}/site-preview?gestionnaireId=${gestionnaire_id}&don=annule`,
      metadata: { don_id: String(donId), site_id: String(site_id), gestionnaire_id: String(gestionnaire_id) },
    }, {
      stripeAccount: stripeAccountId, // Paiement direct au compte du vendeur
    });

    // Sauvegarder le session_id
    await pool.query(
      'UPDATE dons SET stripe_session_id = $1 WHERE id = $2',
      [session.id, donId]
    );

    res.json({ success: true, checkout_url: session.url, don_id: donId });
  } catch (err) {
    console.error('POST /api/dons/creer-session:', err);
    res.status(500).json({ message: err.message || 'Erreur serveur.' });
  }
});

// ─── POST /api/dons/webhook-stripe ───────────────────────────────────────────
// Webhook Stripe pour confirmer les paiements
router.post('/webhook-stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const cfg = await pool.query('SELECT * FROM configuration_stripe_admin WHERE id = 1');
    if (!cfg.rows.length) return res.status(400).send('Config manquante');

    const row = cfg.rows[0];
    let stripeKey = row.sandbox ? row.dev_secret_key : row.prod_secret_key;
    try { const { dechiffrer } = require('../services/chiffrement'); stripeKey = dechiffrer(stripeKey); } catch {}

    const stripe = require('stripe')(stripeKey);
    const sig    = req.headers['stripe-signature'];
    const webhookSecret = row.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const donId   = session.metadata?.don_id;

      if (donId) {
        await pool.query(
          `UPDATE dons SET statut = 'complete', stripe_payment_intent = $1 WHERE id = $2`,
          [session.payment_intent, donId]
        );
        console.log(`✅ Don #${donId} confirmé — ${session.amount_total / 100}$`);

        // Email de confirmation au vendeur
        try {
          const don = await pool.query(
            `SELECT d.*, v.email as gestionnaire_email, s.config
             FROM dons d
             JOIN gestionnaires v ON v.id = d.gestionnaire_id
             JOIN sites s ON s.id = d.site_id
             WHERE d.id = $1`,
            [donId]
          );
          const d = don.rows[0];
          if (d?.gestionnaire_email) {
            const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
            const ses = new SESClient({
              region: process.env.AWS_REGION || 'us-east-2',
              credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
            });
            const cp = d.config?.couleurPrincipale || '#c9a96e';
            await ses.send(new SendEmailCommand({
              Destination: { ToAddresses: [d.gestionnaire_email] },
              Message: {
                Subject: { Data: `🎉 Nouveau don reçu — ${d.montant}$ de ${d.nom_donateur}`, Charset: 'UTF-8' },
                Body: { Html: { Data: `
                  <div style="font-family:sans-serif;padding:24px">
                    <h2 style="color:${cp}">🎉 Nouveau don reçu!</h2>
                    <p><strong>Donateur:</strong> ${d.nom_donateur}</p>
                    <p><strong>Montant:</strong> ${d.montant}$</p>
                    ${d.message ? `<p><strong>Message:</strong> ${d.message}</p>` : ''}
                    <p style="color:#888;font-size:12px">CagnottePro — e-Vend Studio</p>
                  </div>`, Charset: 'UTF-8' }}
              },
              Source: process.env.FROM_EMAIL || 'contact@e-vend.ca',
            }));
          }
        } catch (emailErr) { console.error('Email don:', emailErr.message); }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook dons:', err);
    res.status(500).send('Erreur webhook');
  }
});

// ─── GET /api/dons/vendeur ───────────────────────────────────────────────────
// Liste des dons du vendeur connecté
router.get('/gestionnaire', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.nom_donateur, d.anonyme, d.montant, d.message,
              d.statut, d.created_at, s.slug as site_slug,
              s.config->>'nomEntreprise' as nom_campagne
       FROM dons d
       JOIN sites s ON s.id = d.site_id
       WHERE d.gestionnaire_id = $1
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );

    const total = result.rows
      .filter(d => d.statut === 'complete')
      .reduce((acc, d) => acc + parseFloat(d.montant), 0);

    res.json({ dons: result.rows, total: total.toFixed(2), count: result.rows.length });
  } catch (err) {
    console.error('GET /api/dons/gestionnaire:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── GET /api/dons/public/:siteId ───────────────────────────────────────────
// Dons publics d'une campagne (pour afficher sur le site)
router.get('/public/:siteId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,
              CASE WHEN anonyme THEN 'Anonyme' ELSE nom_donateur END as nom_donateur,
              montant, message, created_at
       FROM dons
       WHERE site_id = $1 AND statut = 'complete'
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.params.siteId]
    );

    const total = result.rows.reduce((acc, d) => acc + parseFloat(d.montant), 0);
    const objectif = await pool.query(
      `SELECT config->>'objectif_montant' as objectif FROM sites WHERE id = $1`,
      [req.params.siteId]
    );

    res.json({
      dons: result.rows,
      total: total.toFixed(2),
      count: result.rows.length,
      objectif: objectif.rows[0]?.objectif || null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;