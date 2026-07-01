// routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db');

function verifyWebhook(hmac, body, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('base64');
  return hash === hmac;
}

async function sendEmail(destinataire, sujet, corpsHtml) {
  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID || process.env.REACT_APP_AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION || process.env.REACT_APP_AWS_REGION || 'us-east-2';
  const fromEmail = process.env.FROM_EMAIL || 'evend.ca@outlook.com';
  const sesClient = new SESClient({ region: awsRegion, credentials: { accessKeyId: awsAccessKey, secretAccessKey: awsSecretKey } });
  const command = new SendEmailCommand({
    Destination: { ToAddresses: [destinataire] },
    Message: { Subject: { Data: sujet, Charset: "UTF-8" }, Body: { Html: { Data: corpsHtml, Charset: "UTF-8" } } },
    Source: fromEmail,
  });
  return await sesClient.send(command);
}

// Webhook pour la création de commande
router.post('/orders/create', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('\n📦 ' + '='.repeat(50));
  console.log('📦 WEBHOOK REÇU - Nouvelle commande');
  console.log('📦 ' + '='.repeat(50));
  
  try {
    const rawBody = req.body;
    let bodyString;
    if (Buffer.isBuffer(rawBody)) bodyString = rawBody.toString('utf8');
    else if (typeof rawBody === 'string') bodyString = rawBody;
    else bodyString = JSON.stringify(rawBody);
    
    console.log('📝 Corps reçu (premier 200 caractères):', bodyString.substring(0, 200));
    
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const secret = process.env.SHOPIFY_API_SECRET;
    if (secret && hmac && bodyString) {
      const isValid = verifyWebhook(hmac, bodyString, secret);
      if (!isValid) { console.log('🔴 Webhook non authentifié'); return res.status(401).send('Unauthorized'); }
      console.log('✅ Webhook authentifié');
    }
    
    const order = JSON.parse(bodyString);
    console.log(`🆔 ID commande: ${order.id}`);
    console.log(`📋 Nom commande: ${order.name}`);
    console.log(`💰 Total: ${order.total_price} ${order.currency || 'CAD'}`);
    console.log(`💳 Gateway: ${order.gateway || 'N/A'}`);
    console.log(`📦 Articles: ${order.line_items?.length || 0}`);
    console.log(`👤 Client: ${order.customer?.email || 'N/A'}`);
    
    if (order.line_items?.length > 0) {
      order.line_items.forEach((item, i) => {
        console.log(`   ${i+1}. ${item.title} - ${item.quantity}x ${item.price}$ (product_id: ${item.product_id})`);
      });
    }
    
    // 1. Acheteur
    let acheteurId = null;
    const customerEmail = order.customer?.email;
    if (customerEmail) {
      const acheteurResult = await pool.query(`SELECT id FROM acheteurs WHERE email = $1`, [customerEmail]);
      if (acheteurResult.rows.length > 0) {
        acheteurId = acheteurResult.rows[0].id;
        console.log(`👤 Acheteur trouvé: ${customerEmail} (ID: ${acheteurId})`);
      } else {
        const newAcheteur = await pool.query(
          `INSERT INTO acheteurs (email, nom, prenom, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
          [customerEmail, order.customer?.last_name || '', order.customer?.first_name || '']
        );
        acheteurId = newAcheteur.rows[0].id;
        console.log(`🆕 Nouvel acheteur créé: ${customerEmail} (ID: ${acheteurId})`);
      }
    }
    
    // 2. Articles et vendeurs
    const articlesAvecVendeur = [];
    const vendeursIds = new Set();
    
    for (const item of (order.line_items || [])) {
      let vendeurId = null, vendeurNom = null, vendeurBoutique = null, vendeurEmail = null;
      if (item.product_id) {
        const produitResult = await pool.query(
          `SELECT p.vendeur_id, v.nom as vendeur_nom, v.nom_boutique as vendeur_boutique, v.email as vendeur_email, v.commission_rate, v.commission
           FROM produits p LEFT JOIN vendeurs v ON p.vendeur_id = v.id WHERE p.shopify_id = $1 LIMIT 1`,
          [item.product_id.toString()]
        );
        if (produitResult.rows.length > 0) {
          vendeurId = produitResult.rows[0].vendeur_id;
          vendeurNom = produitResult.rows[0].vendeur_nom;
          vendeurBoutique = produitResult.rows[0].vendeur_boutique;
          vendeurEmail = produitResult.rows[0].vendeur_email;
          console.log(`   🏪 Produit ${item.product_id} → Vendeur: ${vendeurNom || vendeurId} (ID: ${vendeurId})`);
          if (vendeurId) vendeursIds.add(vendeurId);

          await pool.query(
            `UPDATE produits
             SET stock        = GREATEST(COALESCE(stock, 0) - $1, 0),
                 total_ventes = COALESCE(total_ventes, 0) + $1,
                 updated_at   = NOW()
             WHERE shopify_id = $2`,
            [item.quantity, item.product_id.toString()]
          );
          console.log(`   📦 Stock -${item.quantity} et total_ventes +${item.quantity} pour produit shopify_id=${item.product_id}`);
        } else {
          console.log(`   ⚠️ Produit ${item.product_id} non trouvé dans la base`);
        }
      }
      articlesAvecVendeur.push({
        id: item.id, product_id: item.product_id, variant_id: item.variant_id,
        nom: item.title, quantite: item.quantity, prix: parseFloat(item.price),
        sku: item.sku, image: item.image?.src || null,
        vendeur_id: vendeurId, vendeur_nom: vendeurNom, vendeur_boutique: vendeurBoutique, vendeur_email: vendeurEmail
      });
    }
    
    console.log(`🏪 Vendeurs concernés: ${vendeursIds.size > 0 ? Array.from(vendeursIds).join(', ') : 'Aucun'}`);
    
    // 3. Insérer commande
    const vendeurPrincipal = vendeursIds.size === 1 ? Array.from(vendeursIds)[0] : null;

    const taxLines = order.tax_lines || [];
    let tps = 0, tvq = 0, tvh = 0;
    for (const taxLine of taxLines) {
      const titre = (taxLine.title || '').toUpperCase();
      const montantTax = parseFloat(taxLine.price || 0);
      if (titre.includes('TPS') || titre.includes('GST')) {
        tps += montantTax;
      } else if (titre.includes('TVQ') || titre.includes('QST')) {
        tvq += montantTax;
      } else if (titre.includes('TVH') || titre.includes('HST')) {
        tvh += montantTax;
      }
    }
    const totalTaxes = parseFloat(order.total_tax || 0);
    if (tps === 0 && tvq === 0 && tvh === 0 && totalTaxes > 0) {
      tps = totalTaxes;
    }
    console.log(`   🧾 Taxes: TPS=${tps.toFixed(2)}$ TVQ=${tvq.toFixed(2)}$ TVH=${tvh.toFixed(2)}$ Total=${totalTaxes.toFixed(2)}$`);

    const fraisExpedition = parseFloat(
      order.total_shipping_price_set?.shop_money?.amount ||
      order.shipping_lines?.[0]?.price ||
      0
    );
    console.log(`   🚚 Frais expédition: ${fraisExpedition.toFixed(2)}$`);

    const pourboire = parseFloat(order.tip_payment_amount || 0);
    if (pourboire > 0) console.log(`   💝 Pourboire: ${pourboire.toFixed(2)}$`);

    const sousTotal = parseFloat(order.subtotal_price || 0);
    console.log(`   📊 Sous-total produits: ${sousTotal.toFixed(2)}$`);

    const query = `
      INSERT INTO commandes (
        commande_id, statut_commande, statut_paiement, no_commande,
        date_commande, montant, sous_total, frais_expedition, pourboire,
        tps, tvq, tvh,
        articles, email_client, nom_client,
        adresse_livraison, acheteur_id, vendeur_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      ON CONFLICT (commande_id) DO UPDATE SET
        statut_commande   = EXCLUDED.statut_commande,
        statut_paiement   = EXCLUDED.statut_paiement,
        no_commande       = EXCLUDED.no_commande,
        montant           = EXCLUDED.montant,
        sous_total        = EXCLUDED.sous_total,
        frais_expedition  = EXCLUDED.frais_expedition,
        pourboire         = EXCLUDED.pourboire,
        tps               = EXCLUDED.tps,
        tvq               = EXCLUDED.tvq,
        tvh               = EXCLUDED.tvh,
        articles          = EXCLUDED.articles,
        email_client      = EXCLUDED.email_client,
        nom_client        = EXCLUDED.nom_client,
        adresse_livraison = EXCLUDED.adresse_livraison,
        acheteur_id       = COALESCE(EXCLUDED.acheteur_id, commandes.acheteur_id),
        vendeur_id        = COALESCE(EXCLUDED.vendeur_id, commandes.vendeur_id),
        updated_at        = NOW()
      RETURNING id
    `;
    
    const values = [
      order.id.toString(),
      'Unfulfilled',
      order.financial_status || 'pending',
      order.name,
      order.created_at,
      parseFloat(order.total_price) || 0,
      sousTotal,
      fraisExpedition,
      pourboire,
      tps,
      tvq,
      tvh,
      JSON.stringify(articlesAvecVendeur),
      order.customer?.email || null,
      order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : null,
      order.shipping_address ? JSON.stringify(order.shipping_address) : null,
      acheteurId,
      vendeurPrincipal
    ];
    
    const result = await pool.query(query, values);
    const commandeId = result.rows[0]?.id;
    console.log(`✅ Commande enregistrée en BD (ID: ${commandeId || 'N/A'}) — Nom: ${order.name}`);

    // ===== CRÉATION SESSION STRIPE =====
    console.log(`💳 Gateway e-Vend Stripe détecté — création session Stripe...`);
    let stripeSessionUrl = null;
    let stripeSessionId = null;
    
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const montantCents = Math.round(parseFloat(order.total_price) * 100);
      const devise = (order.currency || 'CAD').toLowerCase();

      let stripeAccountId = null;
      let applicationFeeAmount = 0;
      if (vendeurPrincipal) {
        const vendeurStripe = await pool.query(
          'SELECT stripe_account_id, stripe_charges_enabled, commission_rate, commission FROM vendeurs WHERE id = $1',
          [vendeurPrincipal]
        );
        const vStripe = vendeurStripe.rows[0];
        if (vStripe && vStripe.stripe_account_id && vStripe.stripe_charges_enabled) {
          stripeAccountId = vStripe.stripe_account_id;
          const taux = parseFloat(vStripe.commission_rate) || 0;
          const fixe = parseFloat(vStripe.commission) || 0;
          const montantTotal = parseFloat(order.total_price);
          applicationFeeAmount = Math.round((montantTotal * taux + fixe) * 100);
          console.log('💳 Compte Connect:', stripeAccountId);
          console.log('💰 Frais plateforme:', (applicationFeeAmount/100).toFixed(2), '$');
        }
      }

      const sessionParams = {
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: devise,
            product_data: {
              name: 'Commande ' + order.name + ' — e-Vend',
              description: order.line_items?.map(i => i.title).join(', ') || 'Produits e-Vend',
            },
            unit_amount: montantCents,
          },
          quantity: 1,
        }],
        customer_email: order.customer?.email || undefined,
        metadata: {
          commande_id: order.id.toString(),
          vendeur_id: vendeurPrincipal?.toString() || '',
          shopify_order_id: order.id.toString(),
          shopify_order_name: order.name,
          plateforme: 'e-vend.ca',
        },
        success_url: 'https://e-vend.ca/pages/paiement-confirme?order=' + encodeURIComponent(order.name),
        cancel_url: 'https://e-vend.ca/checkouts',
      };

      let session;
      if (stripeAccountId && applicationFeeAmount > 0) {
        const stripeConnect = require('stripe')(process.env.STRIPE_SECRET_KEY, {
          stripeAccount: stripeAccountId
        });
        
        sessionParams.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
        };
        
        session = await stripeConnect.checkout.sessions.create(sessionParams);
        console.log('✅ Session Stripe Connect (direct charge)');
      } else {
        session = await stripe.checkout.sessions.create(sessionParams);
        console.log('✅ Session Stripe standard (fallback)');
      }
      
      console.log('✅ Session Stripe pré-créée:', session.id);
      console.log('   URL:', session.url);
      
      stripeSessionUrl = session.url;
      stripeSessionId = session.id;

      await pool.query(
        `UPDATE commandes SET stripe_session_url = $1, stripe_session_id = $2 WHERE commande_id = $3`,
        [session.url, session.id, order.id.toString()]
      );

      // ===== ENVOI EMAIL AU CLIENT AVEC LIEN STRIPE =====
      if (order.customer?.email && session.url) {
        const dateFormatee = new Date(order.created_at).toLocaleString('fr-CA', {
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const articlesHtmlClient = (order.line_items || []).map(item => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0;">${item.quantity}x</td>
            <td style="padding: 8px 0;">${item.title}</td>
            <td style="padding: 8px 0; text-align: right;">${(parseFloat(item.price) * item.quantity).toFixed(2)} $</td>
          </tr>
        `).join('');
        
        const total = parseFloat(order.total_price) || 0;
        
        const corpsHtmlClient = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
          <body style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
              <div style="background: #2d6a9f; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">✅ Commande confirmée</h1>
              </div>
              <div style="padding: 24px;">
                <p><strong>Bonjour ${order.customer?.first_name || 'cher client'},</strong></p>
                <p>Merci pour votre commande <strong>${order.name}</strong> du ${dateFormatee}.</p>
                
                <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">⚠️ Paiement requis</p>
                  <p style="margin: 0 0 20px 0;">Cliquez sur le bouton ci-dessous pour finaliser votre paiement sécurisé :</p>
                  <a href="${session.url}" 
                     style="display: inline-block; background: #635bff; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                    💳 Payer maintenant
                  </a>
                  <p style="font-size: 12px; color: #666; margin-top: 16px;">Ce lien expire dans 24 heures.</p>
                </div>
                
                <h3>📦 Détails de votre commande :</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 2px solid #e5e7eb;">
                      <th style="text-align: left; padding: 8px 0;">Qté</th>
                      <th style="text-align: left; padding: 8px 0;">Produit</th>
                      <th style="text-align: right; padding: 8px 0;">Total</th>
                    </tr>
                  </thead>
                  <tbody>${articlesHtmlClient}</tbody>
                 </table>
                
                <div style="margin-top: 16px; text-align: right;">
                  <strong>Total : ${total.toFixed(2)} $</strong>
                </div>
                
                <p style="font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center;">© e-Vend.ca</p>
              </div>
            </div>
          </body></html>`;
        
        try {
          await sendEmail(order.customer.email, `✅ Commande ${order.name} — Paiement requis`, corpsHtmlClient);
          console.log(`   ✉️ Email client envoyé à ${order.customer.email}`);
        } catch (emailError) {
          console.error(`   ❌ Erreur email client:`, emailError.message);
        }
      }

    } catch (stripeErr) {
      console.error('⚠️ Erreur création session Stripe:', stripeErr.message);
    }
    
    // 5. Notifications, commissions, emails vendeurs
    for (const vendeurId of vendeursIds) {
      const vendeurInfo = await pool.query(
        `SELECT id, nom, email, nom_boutique, commission_rate, commission FROM vendeurs WHERE id = $1`,
        [vendeurId]
      );
      
      if (vendeurInfo.rows.length > 0) {
        const vendeur = vendeurInfo.rows[0];
        const articlesDuVendeur = articlesAvecVendeur.filter(a => a.vendeur_id === vendeurId);
        const totalVendeur = articlesDuVendeur.reduce((sum, a) => sum + (a.prix * a.quantite), 0);
        
        const tauxCommission = parseFloat(vendeur.commission_rate) || 0;
        const fraisFixe = parseFloat(vendeur.commission) || 0;
        const montantCommission = (totalVendeur * tauxCommission) + fraisFixe;
        const earningProduit = totalVendeur - montantCommission;
        
        console.log(`📧 Vendeur ${vendeur.nom}: total=${totalVendeur.toFixed(2)}$, commission=${montantCommission.toFixed(2)}$`);
        
        await pool.query(
          `UPDATE commandes SET earning_produit = $1, earning_shipping = 0, transaction_charge = $2 WHERE id = $3`,
          [earningProduit, montantCommission, commandeId]
        );
        
        await pool.query(
          `UPDATE vendeurs SET total_ventes = COALESCE(total_ventes, 0) + $1, total_commandes = COALESCE(total_commandes, 0) + 1, updated_at = NOW() WHERE id = $2`,
          [totalVendeur, vendeurId]
        );
        
        await pool.query(
          `INSERT INTO notifications (titre, message, type, cible, mode, nb_destinataires, cree_le) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            `🛒 Nouvelle commande ${order.name}`,
            `Commande de ${order.customer?.first_name || 'un client'}. Total: ${totalVendeur.toFixed(2)} $ pour ${articlesDuVendeur.length} article(s).`,
            'info', 'vendeurs', 'individuel', 1
          ]
        );
        
        if (vendeur.email) {
          const dateFormatee = new Date(order.created_at).toLocaleString('fr-CA', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
          const articlesHtml = articlesDuVendeur.map(a => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0;">${a.quantite}x</td>
              <td style="padding: 8px 0;">${a.nom}</td>
              <td style="padding: 8px 0; text-align: right;">${(a.prix * a.quantite).toFixed(2)} $</td>
            </tr>
          `).join('');
          
          const corpsHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
                <div style="background: #2d6a9f; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">🛒 Nouvelle commande</h1>
                </div>
                <div style="padding: 24px;">
                  <p><strong>Bonjour ${vendeur.nom || 'cher vendeur'},</strong></p>
                  <p>🎉 Nouvelle commande sur <strong>${vendeur.nom_boutique || 'e-Vend'}</strong> !</p>
                  <div style="background: #f8fafc; border-left: 4px solid #2d6a9f; padding: 12px 16px; margin: 16px 0;">
                    <p style="margin: 4px 0;"><strong>N° commande :</strong> ${order.name}</p>
                    <p style="margin: 4px 0;"><strong>Date :</strong> ${dateFormatee}</p>
                    <p style="margin: 4px 0;"><strong>Client :</strong> ${order.customer?.first_name || ''} ${order.customer?.last_name || ''}</p>
                    <p style="margin: 4px 0;"><strong>Total :</strong> <span style="font-size: 18px; font-weight: bold; color: #2d6a9f;">${totalVendeur.toFixed(2)} $</span></p>
                    <p style="margin: 4px 0;"><strong>Commission e-Vend :</strong> -${montantCommission.toFixed(2)} $</p>
                    <p style="margin: 4px 0;"><strong>Net à recevoir :</strong> ${earningProduit.toFixed(2)} $</p>
                  </div>
                  <h3>📦 Articles :</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead><tr style="border-bottom: 2px solid #e5e7eb;">
                      <th style="text-align: left; padding: 8px 0;">Qté</th>
                      <th style="text-align: left; padding: 8px 0;">Produit</th>
                      <th style="text-align: right; padding: 8px 0;">Total</th>
                    </tr></thead>
                    <tbody>${articlesHtml}</tbody>
                   </table>
                  <div style="margin-top: 24px; text-align: center;">
                    <a href="https://admin.e-vend.ca/vendeur/commandes/${order.id}" 
                       style="display: inline-block; background: #2d6a9f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                      📋 Gérer cette commande →
                    </a>
                  </div>
                  <p style="font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center;">© e-Vend.ca</p>
                </div>
              </div>
            </body></html>`;
          
          try {
            await sendEmail(vendeur.email, `🛒 Nouvelle commande ${order.name} sur e-Vend`, corpsHtml);
            console.log(`   ✉️ Email envoyé à ${vendeur.email}`);
          } catch (emailError) {
            console.error(`   ❌ Erreur email:`, emailError.message);
          }
        }
      }
    }
    
    // 6. Stats acheteur
    if (acheteurId) {
      const totalProduits = order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      await pool.query(
        `UPDATE acheteurs SET total_achats = COALESCE(total_achats, 0) + $1, nombre_commandes = COALESCE(nombre_commandes, 0) + 1, total_produits = COALESCE(total_produits, 0) + $2, derniere_commande = NOW(), updated_at = NOW() WHERE id = $3`,
        [parseFloat(order.total_price) || 0, totalProduits, acheteurId]
      );
    }
    
    // 7. Audit log
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1, $2, $3::jsonb, $4, NOW())`,
      ['SHOPIFY_WEBHOOK_ORDER_CREATE', 'shopify',
       JSON.stringify({ order_id: order.id, order_name: order.name, total: order.total_price, customer_email: order.customer?.email, vendeurs: Array.from(vendeursIds) }),
       'info']
    );
    
    console.log('📦 ' + '='.repeat(50) + '\n');
    res.status(200).json({ success: true, message: 'Commande reçue et traitée', order_id: order.id, order_name: order.name });
    
  } catch (error) {
    console.error('❌ Erreur webhook:', error.message);
    console.error('Stack:', error.stack);
    try {
      await pool.query(
        `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1, $2, $3::jsonb, $4, NOW())`,
        ['SHOPIFY_WEBHOOK_ERROR', 'shopify', JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }), 'error']
      );
    } catch (_) {}
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook mise à jour commande
router.post('/orders/updated', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('\n🔄 Mise à jour commande reçue');
  try {
    const rawBody = req.body;
    let bodyString;
    if (Buffer.isBuffer(rawBody)) bodyString = rawBody.toString('utf8');
    else if (typeof rawBody === 'string') bodyString = rawBody;
    else bodyString = JSON.stringify(rawBody);
    
    const order = JSON.parse(bodyString);
    console.log(`🆔 Commande ${order.id} - Nouveau statut: ${order.financial_status}`);
    
    await pool.query(
      `UPDATE commandes SET statut_paiement = $1, updated_at = NOW() WHERE commande_id = $2`,
      [order.financial_status, order.id.toString()]
    );
    
    console.log(`✅ Statut commande ${order.id} mis à jour`);
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Erreur webhook update:', error.message);
    res.status(500).send('Error');
  }
});

// COMPTEUR DE VUES — POST
router.post('/produits/vue', express.json(), async (req, res) => {
  try {
    const { shopify_id } = req.body;
    if (!shopify_id) return res.status(400).json({ success: false, error: 'shopify_id manquant' });

    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|crawl|spider|slurp|mediapartners|googlebot|bingbot|yandex|baidu/i.test(userAgent);
    if (isBot) return res.status(200).json({ success: true, message: 'Bot ignore' });

    const result = await pool.query(
      `UPDATE produits SET vues = COALESCE(vues, 0) + 1, updated_at = NOW()
       WHERE shopify_id = $1 RETURNING id, nom, vues`,
      [shopify_id.toString()]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Produit non trouve' });

    const produit = result.rows[0];
    console.log('Vue enregistree - ' + produit.nom + ' -> ' + produit.vues + ' vues total');
    res.status(200).json({ success: true, vues: produit.vues });

  } catch (error) {
    console.error('Erreur compteur vues:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// COMPTEUR DE VUES — GET
router.get('/produits/vue-count', async (req, res) => {
  try {
    const { shopify_id } = req.query;
    if (!shopify_id) return res.status(400).json({ success: false, vues: 0 });

    const result = await pool.query(
      'SELECT vues FROM produits WHERE shopify_id = $1 LIMIT 1',
      [shopify_id.toString()]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, vues: 0 });

    res.status(200).json({ success: true, vues: result.rows[0].vues || 0 });

  } catch (error) {
    console.error('Erreur vue-count:', error.message);
    res.status(500).json({ success: false, vues: 0 });
  }
});

// Route latest-session pour l'extension Shopify
router.post('/latest-session', express.json(), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT stripe_session_url, stripe_session_id, no_commande, commande_id, montant
       FROM commandes
       WHERE stripe_session_url IS NOT NULL
       AND statut_paiement != 'paid'
       ORDER BY created_at DESC
       LIMIT 1`
    );
    
    if (!result.rows[0]?.stripe_session_url) {
      return res.status(404).json({ error: 'Aucune session active', session_url: null });
    }
    
    const commande = result.rows[0];
    console.log(`✅ Session retournée pour commande: ${commande.no_commande}`);
    res.json({ session_url: commande.stripe_session_url });
    
  } catch (err) {
    console.error('❌ Erreur latest-session:', err.message);
    res.status(500).json({ error: err.message, session_url: null });
  }
});

// Test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Route webhooks fonctionnelle',
    endpoints: [
      'POST /api/webhooks/orders/create',
      'POST /api/webhooks/orders/updated',
      'POST /api/webhooks/latest-session',
      'POST /api/webhooks/produits/vue',
      'GET  /api/webhooks/produits/vue-count?shopify_id=xxx',
    ]
  });
});

module.exports = router;