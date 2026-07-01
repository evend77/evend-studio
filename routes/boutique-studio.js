// routes/boutique-studio.js
// e-Vend Studio — Boutique mono-produit — Commandes + Stripe

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ─── Helper Stripe vendeur ────────────────────────────────────────────────────
async function getStripeKey(vendeurId) {
  try {
    const cfg = await pool.query('SELECT * FROM configuration_stripe_admin WHERE id = 1');
    if (!cfg.rows.length) throw new Error('Config Stripe manquante.');
    const row = cfg.rows[0];
    let stripeKey = row.sandbox ? row.dev_secret_key : row.prod_secret_key;
    try { const { dechiffrer } = require('../services/chiffrement'); stripeKey = dechiffrer(stripeKey); } catch {}

    const vc = await pool.query(
      'SELECT stripe_compte_id FROM vendeurs_config WHERE vendeur_id = $1', [vendeurId]
    );
    const stripeAccountId = vc.rows[0]?.stripe_compte_id;
    if (!stripeAccountId) throw new Error('Compte Stripe non connecté.');
    return { stripeKey, stripeAccountId };
  } catch (err) {
    throw err;
  }
}

// ─── POST /api/boutique-studio/creer-commande ─────────────────────────────────
// Crée une commande + session Stripe Checkout
router.post('/creer-commande', async (req, res) => {
  const {
    site_id, vendeur_id,
    nom_client, email_client, telephone,
    adresse_livraison,
    produit_nom, variante, quantite, prix_unitaire,
    acheteur_id,
    notes,
  } = req.body;

  if (!site_id || !vendeur_id || !nom_client || !email_client || !produit_nom || !prix_unitaire) {
    return res.status(400).json({ message: 'Champs obligatoires manquants.' });
  }

  try {
    const sous_total = parseFloat(prix_unitaire) * (parseInt(quantite) || 1);
    const taxes      = parseFloat((sous_total * 0.14975).toFixed(2)); // TPS+TVQ QC
    const total      = parseFloat((sous_total + taxes).toFixed(2));

    // Créer la commande en attente
    const result = await pool.query(
      `INSERT INTO commandes_studio
        (site_id, vendeur_id, acheteur_id, nom_client, email_client, telephone,
         adresse_livraison, produit_nom, variante, quantite, prix_unitaire,
         sous_total, taxes, total, statut, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'en_attente',$15)
       RETURNING id`,
      [site_id, vendeur_id, acheteur_id || null, nom_client, email_client,
       telephone || null, adresse_livraison || null, produit_nom,
       variante || null, quantite || 1, prix_unitaire,
       sous_total, taxes, total, notes || null]
    );
    const commandeId = result.rows[0].id;

    // Stripe Checkout
    try {
      const { stripeKey, stripeAccountId } = await getStripeKey(vendeur_id);
      const stripe  = require('stripe')(stripeKey);
      const siteRes = await pool.query('SELECT config FROM sites WHERE id = $1', [site_id]);
      const config  = siteRes.rows[0]?.config || {};
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cad',
              product_data: {
                name: produit_nom,
                description: variante ? `Variante: ${variante}` : undefined,
                images: config.photosProduit?.length ? [config.photosProduit[0]] : [],
              },
              unit_amount: Math.round(parseFloat(prix_unitaire) * 100),
            },
            quantity: parseInt(quantite) || 1,
          },
        ],
        mode: 'payment',
        customer_email: email_client,
        success_url: `${frontendUrl}/site-preview?vendeurId=${vendeur_id}&commande=succes&commandeId=${commandeId}`,
        cancel_url:  `${frontendUrl}/site-preview?vendeurId=${vendeur_id}&commande=annule`,
        metadata: { commande_id: String(commandeId), site_id: String(site_id) },
        payment_intent_data: { transfer_data: { destination: stripeAccountId } },
      }, { stripeAccount: stripeAccountId });

      await pool.query(
        'UPDATE commandes_studio SET stripe_session_id = $1 WHERE id = $2',
        [session.id, commandeId]
      );

      res.json({ success: true, checkout_url: session.url, commande_id: commandeId });
    } catch (stripeErr) {
      // Si pas de Stripe configuré, retourner juste la commande
      console.warn('Stripe non configuré:', stripeErr.message);
      res.json({ success: true, commande_id: commandeId, sans_stripe: true,
        message: 'Commande créée. Le vendeur vous contactera pour le paiement.' });
    }
  } catch (err) {
    console.error('POST creer-commande:', err);
    res.status(500).json({ message: err.message || 'Erreur serveur.' });
  }
});

// ─── GET /api/boutique-studio/commandes/vendeur ───────────────────────────────
router.get('/commandes/vendeur', authenticateToken, async (req, res) => {
  try {
    const siteRes = await pool.query('SELECT id FROM sites WHERE vendeur_id = $1', [req.user.id]);
    if (!siteRes.rows.length) return res.json({ commandes: [] });

    const result = await pool.query(
      `SELECT c.*, a.prenom as acheteur_prenom, a.nom as acheteur_nom
       FROM commandes_studio c
       LEFT JOIN acheteurs_studio a ON a.id = c.acheteur_id
       WHERE c.site_id = $1
       ORDER BY c.created_at DESC`,
      [siteRes.rows[0].id]
    );
    res.json({ commandes: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── PUT /api/boutique-studio/commandes/:id/statut ────────────────────────────
router.put('/commandes/:id/statut', authenticateToken, async (req, res) => {
  const { statut } = req.body;
  const valides = ['en_attente','complete','expediee','annulee','remboursee'];
  if (!valides.includes(statut)) return res.status(400).json({ message: 'Statut invalide.' });
  try {
    await pool.query(
      `UPDATE commandes_studio SET statut = $1
       WHERE id = $2 AND site_id IN (SELECT id FROM sites WHERE vendeur_id = $3)`,
      [statut, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ─── Webhook Stripe pour boutique studio ─────────────────────────────────────
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    // Traitement simplifié — confirmer la commande
    const body = JSON.parse(req.body.toString());
    if (body.type === 'checkout.session.completed') {
      const commandeId = body.data.object.metadata?.commande_id;
      if (commandeId) {
        await pool.query(
          `UPDATE commandes_studio SET statut = 'complete',
           stripe_payment_intent = $1 WHERE id = $2`,
          [body.data.object.payment_intent, commandeId]
        );
        console.log(`✅ Commande boutique #${commandeId} complétée`);
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).send('Webhook error');
  }
});

module.exports = router;