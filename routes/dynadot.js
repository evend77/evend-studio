// routes/dynadot.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');

const DYNADOT_API_KEY = process.env.DYNADOT_API_KEY;
const DYNADOT_API_URL = 'https://api.dynadot.com/api3.json';

// =====================================================================
// 🔍 Vérifier la disponibilité d'un domaine
// =====================================================================
router.post('/check-availability', authenticateToken, async (req, res) => {
  const { domain } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domaine requis' });
  }

  try {
    const url = `${DYNADOT_API_URL}?key=${DYNADOT_API_KEY}&command=check&domain=${domain}`;
    const response = await fetch(url);
    const data = await response.json();
    
    res.json({
      disponible: data.IsAvailable === 1,
      prix_wholesale: data.Price || 12.99,
    });
    
  } catch (error) {
    console.error('Erreur vérification domaine:', error);
    res.status(500).json({ error: 'Erreur de vérification' });
  }
});

// =====================================================================
// 💳 Créer une session Stripe pour l'achat de domaine
// =====================================================================
router.post('/create-checkout', authenticateToken, async (req, res) => {
  const { domain, years, vendeurId } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domaine requis' });
  }

  try {
    // Vérifier que le domaine est toujours disponible
    const checkUrl = `${DYNADOT_API_URL}?key=${DYNADOT_API_KEY}&command=check&domain=${domain}`;
    const checkResponse = await fetch(checkUrl);
    const checkData = await checkResponse.json();
    
    if (checkData.IsAvailable !== 1) {
      return res.status(409).json({ 
        error: 'Domaine plus disponible', 
        domaine: domain 
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Domaine ${domain}`,
            description: `Enregistrement du domaine ${domain} pour 1 an`,
          },
          unit_amount: 2298, // 22.98$ CAD (19.99 + taxes)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/domaine-succes?domain=${domain}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/domaine-annule`,
      metadata: {
        domain: domain,
        years: '1',
        gestionnaire_id: gestionnaireId?.toString() || vendeurId?.toString()
      }
    });

    res.json({ url: session.url });
    
  } catch (error) {
    console.error('Erreur création checkout:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
});

// =====================================================================
// ✅ Vérifier le statut d'un paiement (page de succès)
// =====================================================================
router.get('/verify-payment', authenticateToken, async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ success: false, message: 'Session ID requis' });
  }

  try {
    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return res.json({ 
        success: false, 
        message: 'Le paiement n\'est pas encore complété.' 
      });
    }

    const domain = session.metadata.domain;
    const gestionnaireId = session.metadata.vendeur_id;

    // Vérifier dans la base de données que le domaine est bien enregistré
    const result = await pool.query(
      `SELECT * FROM domaines WHERE domaine = $1 AND gestionnaire_id = $2`,
      [domain, vendeurId]
    );

    if (result.rows.length === 0) {
      // Le domaine n'a pas encore été enregistré chez Dynadot
      // (normal, le webhook Stripe s'en occupe en arrière-plan)
      return res.json({ 
        success: true, 
        message: 'Paiement confirmé. Le domaine est en cours d\'enregistrement.',
        dns_instructions: 'CNAME → sites.e-vendstudio.ca'
      });
    }

    res.json({ 
      success: true, 
      message: `Domaine ${domain} enregistré avec succès !`,
      dns_instructions: 'CNAME → sites.e-vendstudio.ca'
    });

  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la vérification.' 
    });
  }
});

// =====================================================================
// 🏠 Récupérer tous les domaines d'un gestionnaire
// =====================================================================
router.get('/domaines/:gestionnaireId', authenticateToken, async (req, res) => {
  const { vendeurId: gestionnaireId } = req.params;

  // Vérifier que l'utilisateur a accès
  if (req.user.id !== parseInt(gestionnaireId) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM domaines WHERE gestionnaire_id = $1 ORDER BY created_at DESC`,
      [gestionnaireId]
    );

    res.json({ 
      domaines: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erreur récupération domaines:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// =====================================================================
// 🔄 Webhook Stripe (confirmation de paiement)
// =====================================================================
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Erreur webhook Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const domain = session.metadata.domain;
    const years = parseInt(session.metadata.years) || 1;
    const gestionnaireId = session.metadata.vendeur_id;

    console.log(`✅ Paiement reçu pour le domaine ${domain} (gestionnaire ${gestionnaireId})`);

    try {
      // 🔥 MAINTENANT on achète le domaine chez Dynadot
      const registerResult = await enregistrerDomaineDynadot(domain, years, session);
      
      if (registerResult.success) {
        // ✅ Sauvegarder dans la base de données
        await pool.query(
          `INSERT INTO domaines (domaine, gestionnaire_id, dynadot_order_id, expiration_date, statut, created_at)
           VALUES ($1, $2, $3, $4, 'actif', NOW())`,
          [domain, gestionnaireId, registerResult.orderId || null, registerResult.expirationDate || null]
        );
        
        // 🌐 Configurer le DNS automatiquement
        await configurerDNS(domain);
        
        console.log(`✅ Domaine ${domain} enregistré avec succès chez Dynadot !`);
      } else {
        console.error(`❌ Erreur enregistrement Dynadot:`, registerResult.error);
        // Envoyer un email admin pour erreur
      }
      
    } catch (error) {
      console.error('❌ Erreur enregistrement domaine:', error);
      // Envoyer un email admin pour erreur
    }
  }

  res.json({ received: true });
});

// =====================================================================
// 🛠️ Fonction : Enregistrer un domaine chez Dynadot
// =====================================================================
async function enregistrerDomaineDynadot(domain, years, session) {
  const customerName = session.customer_details?.name || 'Client e-Vend';
  const customerEmail = session.customer_details?.email || 'client@evend.ca';
  
  // Séparer le nom en prénom/nom
  const nameParts = customerName.split(' ');
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.slice(1).join(' ') || 'e-Vend';

  const params = new URLSearchParams({
    key: DYNADOT_API_KEY,
    command: 'register',
    domain: domain,
    duration: years || 1,
    first_name: firstName,
    last_name: lastName,
    email: customerEmail,
    // Infos par défaut si manquantes
    address: '123 rue Principale',
    city: 'Montreal',
    state: 'QC',
    zip: 'H2X 1X4',
    country: 'CA',
    phone: '+1.5145550123'
  });

  try {
    const response = await fetch(DYNADOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const data = await response.json();
    
    return {
      success: data.IsSuccess === 1,
      orderId: data.OrderId || null,
      expirationDate: data.ExpirationDate || null,
      error: data.ErrorMessage || null
    };
    
  } catch (error) {
    console.error('Erreur enregistrement Dynadot:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================================
// 🌐 Fonction : Configurer le DNS automatiquement
// =====================================================================
async function configurerDNS(domain) {
  try {
    const params = new URLSearchParams({
      key: DYNADOT_API_KEY,
      command: 'set_dns',
      domain: domain,
      record_0_type: 'CNAME',
      record_0_name: 'www',
      record_0_value: 'sites.e-vendstudio.ca',
      record_0_ttl: '3600'
    });
    
    const response = await fetch(DYNADOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const data = await response.json();
    console.log(`✅ DNS configuré pour ${domain}:`, data);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Erreur configuration DNS pour ${domain}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = router;