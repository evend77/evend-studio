// routes/commandeCheckout.js
// Checkout e-Vend — crée commande(s) + session(s) Stripe Connect par vendeur

const express = require("express");
const router = express.Router();
const pool = require("../db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require("../middleware/auth");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

router.use(authenticateToken);

const FRONTEND_URL = process.env.FRONTEND_URL || "https://evend-multivendeur-api.onrender.com";
const COMMISSION_PERCENT = 0.05; // 5% commission e-Vend

// POST /api/checkout/creer-commande
// Corps : { infos_livraison: { prenom, nom, email, ... } }
// Retour : { stripe_url, commandes_ids }
router.post("/creer-commande", async (req, res) => {
  const acheteurId = req.user.id;
  const { infos_livraison } = req.body;

  if (!infos_livraison?.email || !infos_livraison?.adresse) {
    return res.status(400).json({ error: "Informations de livraison incomplètes" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Récupérer le panier
    const panierRes = await client.query(
      `SELECT 
        p.id, p.titre, p.image_url, p.prix, p.quantite,
        p.vendeur_id, p.produit_shopify_id, p.variant_id,
        v.nom AS vendeur_nom, v.stripe_account_id
       FROM panier p
       JOIN vendeurs v ON v.id = p.vendeur_id
       WHERE p.acheteur_id = $1`,
      [acheteurId]
    );

    if (panierRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Panier vide" });
    }

    // 2. Grouper par vendeur
    const parVendeur = {};
    for (const row of panierRes.rows) {
      if (!parVendeur[row.vendeur_id]) {
        parVendeur[row.vendeur_id] = {
          vendeur_id: row.vendeur_id,
          vendeur_nom: row.vendeur_nom,
          stripe_account_id: row.stripe_account_id,
          articles: [],
          total: 0,
        };
      }
      parVendeur[row.vendeur_id].articles.push(row);
      parVendeur[row.vendeur_id].total += row.prix * row.quantite;
    }

    const vendeurs = Object.values(parVendeur);

    // 3. Pour chaque vendeur : créer commande en BD + session Stripe
    const commandes = [];

    for (const groupe of vendeurs) {
      // 3a. Insérer commande en BD
      const commandeRes = await client.query(
        `INSERT INTO commandes 
          (acheteur_id, vendeur_id, montant, statut_commande, statut_paiement,
           articles, infos_livraison)
         VALUES ($1, $2, $3, 'pending', 'unpaid', $4, $5)
         RETURNING id`,
        [
          acheteurId,
          groupe.vendeur_id,
          groupe.total,
          JSON.stringify(groupe.articles),
          JSON.stringify(infos_livraison),
        ]
      );
      const commandeId = commandeRes.rows[0].id;

      // 3b. Créer session Stripe Connect pour ce vendeur
      let stripeUrl = null;
      if (groupe.stripe_account_id) {
        const stripeConnect = require("stripe")(process.env.STRIPE_SECRET_KEY, {
          stripeAccount: groupe.stripe_account_id,
        });

        const montantCents = Math.round(groupe.total * 100);
        const commissionCents = Math.round(montantCents * COMMISSION_PERCENT);

        const lineItems = groupe.articles.map((a) => ({
          price_data: {
            currency: "cad",
            product_data: {
              name: a.titre,
              images: a.image_url ? [a.image_url] : [],
            },
            unit_amount: Math.round(a.prix * 100),
          },
          quantity: a.quantite,
        }));

        const session = await stripeConnect.checkout.sessions.create({
          mode: "payment",
          line_items: lineItems,
          payment_intent_data: {
            application_fee_amount: commissionCents,
          },
          customer_email: infos_livraison.email,
          success_url: `${FRONTEND_URL}/commande-confirmee/${commandeId}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${FRONTEND_URL}/checkout?annule=1`,
          metadata: {
            commande_id: commandeId.toString(),
            acheteur_id: acheteurId.toString(),
            vendeur_id: groupe.vendeur_id.toString(),
          },
        });

        stripeUrl = session.url;

        // Sauvegarder session Stripe en BD
        await client.query(
          `UPDATE commandes 
           SET stripe_session_id = $1, stripe_session_url = $2
           WHERE id = $3`,
          [session.id, session.url, commandeId]
        );
      }

      commandes.push({
        commande_id: commandeId,
        vendeur_nom: groupe.vendeur_nom,
        total: groupe.total,
        stripe_url: stripeUrl,
      });
    }

    // 4. Vider le panier
    await client.query(`DELETE FROM panier WHERE acheteur_id = $1`, [acheteurId]);

    await client.query("COMMIT");

    // 5. Envoyer email au client avec liens de paiement
    await envoyerEmailAcheteur(infos_livraison, commandes);

    // 6. Retourner l'URL Stripe du premier vendeur
    // (si plusieurs vendeurs → l'acheteur paiera l'un après l'autre)
    const premiereUrl = commandes.find((c) => c.stripe_url)?.stripe_url;

    res.json({
      stripe_url: premiereUrl,
      commandes: commandes.map((c) => ({
        commande_id: c.commande_id,
        vendeur_nom: c.vendeur_nom,
        total: c.total,
      })),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("POST /checkout/creer-commande:", err);
    res.status(500).json({ error: err.message || "Erreur lors du checkout" });
  } finally {
    client.release();
  }
});

// ─── EMAIL ACHETEUR via AWS SES ───────────────────────────────────────────

async function envoyerEmailAcheteur(infos, commandes) {
  const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    },
  });

  const fromEmail = process.env.FROM_EMAIL || "evend.ca@outlook.com";

  const lignesCommandes = commandes
    .map(
      (c) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${c.vendeur_nom}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${c.total.toFixed(2)} $</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">
            ${c.stripe_url ? `<a href="${c.stripe_url}" style="color:#1a1a1a;font-weight:500;">Payer →</a>` : "Traitement en cours"}
          </td>
        </tr>`
    )
    .join("");

  const totalGlobal = commandes.reduce((s, c) => s + c.total, 0);

  const htmlBody = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <h1 style="font-size:20px;font-weight:500;margin-bottom:8px;">Bonjour ${infos.prenom},</h1>
      <p style="color:#666;margin-bottom:24px;">Votre commande a été créée. Complétez le paiement ci-dessous.</p>
      
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:10px 12px;text-align:left;font-weight:500;font-size:13px;">Vendeur</th>
            <th style="padding:10px 12px;text-align:right;font-weight:500;font-size:13px;">Montant</th>
            <th style="padding:10px 12px;text-align:center;font-weight:500;font-size:13px;">Paiement</th>
          </tr>
        </thead>
        <tbody>${lignesCommandes}</tbody>
        <tfoot>
          <tr>
            <td style="padding:12px;font-weight:500;">Total</td>
            <td style="padding:12px;text-align:right;font-weight:500;">${totalGlobal.toFixed(2)} $</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      
      <p style="font-size:13px;color:#999;">
        Adresse de livraison : ${infos.adresse}, ${infos.ville} ${infos.province} ${infos.code_postal}
      </p>
      <p style="font-size:12px;color:#bbb;margin-top:32px;">e-Vend · evend.ca</p>
    </div>
  `;

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [infos.email] },
    Message: {
      Subject: { Data: "Votre commande e-Vend — Lien de paiement", Charset: "UTF-8" },
      Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
    },
    Source: fromEmail,
  });

  try {
    await sesClient.send(command);
    console.log("✅ Email checkout envoyé à", infos.email);
  } catch (err) {
    console.error("⚠️ Erreur envoi email checkout:", err.message);
    // On ne bloque pas la commande si l'email échoue
  }
}

module.exports = router;