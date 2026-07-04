// routes/dynadot.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');
const renderService = require('../services/renderService');

const DYNADOT_API_KEY = process.env.DYNADOT_API_KEY;
const DYNADOT_API_URL = 'https://api.dynadot.com/api3.json';

// ── Extensions autorisées à la vente ────────────────────────────────────────
// On limite aux extensions dont le prix reste stable et prévisible entre
// l'achat et le renouvellement (évite les mauvaises surprises comme .shop,
// .academy, .accountants, etc. qui peuvent coûter 3-5x plus cher au
// renouvellement que le prix d'appel de la 1re année).
const EXTENSIONS_AUTORISEES = ['com', 'ca', 'net', 'org'];

function extensionAutorisee(domain) {
  const parts = domain.toLowerCase().split('.');
  const ext = parts[parts.length - 1];
  return EXTENSIONS_AUTORISEES.includes(ext);
}

// ── Calcul du prix client ────────────────────────────────────────────────────
// Prix facturé = prix réel Dynadot + marge fixe de 10$ CAD.
// (Le plancher à 20$ n'est plus nécessaire puisqu'on limite déjà aux
// extensions sûres — .com/.ca/.net/.org — dont les prix restent bas et stables.)
const MARGE_FIXE = 10.00;

function calculerPrixClient(prixDynadot) {
  return (prixDynadot || 0) + MARGE_FIXE;
}

// =====================================================================
// 🔍 Vérifier la disponibilité d'un nom de base sur toutes les extensions
// sûres en même temps (ex: monsite.com, monsite.ca, monsite.net, monsite.org)
// et retourner le prix pour chacune — utile pour présenter un choix au client.
// =====================================================================
router.post('/check-availability-multi', authenticateToken, async (req, res) => {
  const { nomBase } = req.body; // ex: "monsite" (sans extension)

  if (!nomBase) {
    return res.status(400).json({ error: 'Nom de domaine (sans extension) requis' });
  }

  try {
    // ⚠️ Notre compte Dynadot est un compte standard (pas "Bulk"/"Super Bulk"),
    // donc la recherche groupée (domain0-domain99) n'est pas disponible —
    // il faut vérifier chaque extension une par une, séquentiellement
    // (Dynadot n'accepte qu'un seul appel API à la fois, en parallèle ça peut
    // entraîner un blocage temporaire du compte).
    const resultats = [];

    for (const ext of EXTENSIONS_AUTORISEES) {
      const domaineComplet = `${nomBase}.${ext}`;
      try {
        const url = `${DYNADOT_API_URL}?key=${DYNADOT_API_KEY}&command=check&domain=${domaineComplet}`;
        const response = await fetch(url);
        const data = await response.json();

        const prixDynadot = data.Price != null ? parseFloat(data.Price) || null : null;
        resultats.push({
          domaine: domaineComplet,
          disponible: Number(data.IsAvailable) === 1,
          prix_wholesale: prixDynadot,
          prix_client: prixDynadot != null ? calculerPrixClient(prixDynadot) : null,
        });
      } catch (errUnique) {
        console.error(`Erreur vérification ${domaineComplet}:`, errUnique);
        resultats.push({ domaine: domaineComplet, disponible: false, prix_wholesale: null, prix_client: null });
      }
    }

    res.json({ resultats });
  } catch (error) {
    console.error('Erreur vérification multi-extensions:', error);
    res.status(500).json({ error: 'Erreur de vérification' });
  }
});

// =====================================================================
// 🔍 Vérifier la disponibilité d'un domaine
// =====================================================================
router.post('/check-availability', authenticateToken, async (req, res) => {
  const { domain } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domaine requis' });
  }

  if (!extensionAutorisee(domain)) {
    return res.status(400).json({
      error: `Extension non supportée. Extensions disponibles : ${EXTENSIONS_AUTORISEES.map(e => '.' + e).join(', ')}`,
    });
  }

  try {
    const url = `${DYNADOT_API_URL}?key=${DYNADOT_API_KEY}&command=check&domain=${domain}`;
    const response = await fetch(url);
    const data = await response.json();

    const prixDynadot = data.Price != null ? (parseFloat(data.Price) || 12.99) : 12.99;
    const prixClient = calculerPrixClient(prixDynadot);

    res.json({
      disponible: Number(data.IsAvailable) === 1,
      prix_wholesale: prixDynadot,
      prix_client: prixClient,
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
  const { domain, years, gestionnaireId, vendeurId } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domaine requis' });
  }

  if (!extensionAutorisee(domain)) {
    return res.status(400).json({
      error: `Extension non supportée. Extensions disponibles : ${EXTENSIONS_AUTORISEES.map(e => '.' + e).join(', ')}`,
    });
  }

  try {
    // Vérifier que le domaine est toujours disponible ET récupérer son prix réel
    const checkUrl = `${DYNADOT_API_URL}?key=${DYNADOT_API_KEY}&command=check&domain=${domain}`;
    const checkResponse = await fetch(checkUrl);
    const checkData = await checkResponse.json();
    
    if (Number(checkData.IsAvailable) !== 1) {
      return res.status(409).json({ 
        error: 'Domaine plus disponible', 
        domaine: domain 
      });
    }

    const prixDynadot = checkData.Price != null ? (parseFloat(checkData.Price) || 12.99) : 12.99;
    const prixClient = calculerPrixClient(prixDynadot);
    const prixClientCents = Math.round(prixClient * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Domaine ${domain}`,
            description: `Enregistrement du domaine ${domain} pour 1 an`,
          },
          unit_amount: prixClientCents,
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
    const gestionnaireId = session.metadata.gestionnaire_id;

    // Vérifier dans la base de données que le domaine est bien enregistré
    const result = await pool.query(
      `SELECT * FROM domaines WHERE domaine = $1 AND gestionnaire_id = $2`,
      [domain, gestionnaireId]
    );

    if (result.rows.length === 0) {
      // Le domaine n'a pas encore été enregistré chez Dynadot
      // (normal, le webhook Stripe s'en occupe en arrière-plan)
      return res.json({
        success: true,
        message: 'Paiement confirmé. Le domaine est en cours d\'enregistrement.',
        dns_instructions: 'CNAME www → evend-studio.onrender.com (configuré automatiquement)'
      });
    }

    res.json({
      success: true,
      message: `Domaine ${domain} enregistré avec succès !`,
      dns_instructions: 'CNAME www → evend-studio.onrender.com (configuré automatiquement)'
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
  const { gestionnaireId } = req.params;

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
// 💳 Configurer la carte pour le renouvellement automatique
// Utilise Stripe Checkout hébergé (mode "setup"), comme pour l'achat/renouvellement
// manuel — pas de formulaire Stripe Elements à intégrer, le client est redirigé
// vers une page Stripe sécurisée pour enregistrer sa carte.
// =====================================================================
router.post('/domaines/:id/setup-renouvellement-auto', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM domaines WHERE id = $1`, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Domaine non trouvé.' });
    }
    const domaineRow = result.rows[0];

    if (req.user.id !== domaineRow.gestionnaire_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    let stripeCustomerId = domaineRow.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: { gestionnaire_id: String(domaineRow.gestionnaire_id), domaine: domaineRow.domaine },
      });
      stripeCustomerId = customer.id;
      await pool.query(`UPDATE domaines SET stripe_customer_id = $1 WHERE id = $2`, [stripeCustomerId, id]);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      success_url: `${process.env.FRONTEND_URL}/domaine-succes?domain=${domaineRow.domaine}&session_id={CHECKOUT_SESSION_ID}&type=renouvellement-auto&domaine_id=${id}`,
      cancel_url: `${process.env.FRONTEND_URL}/mon-domaine`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur setup-renouvellement-auto:', error);
    res.status(500).json({ error: 'Erreur lors de la configuration du renouvellement automatique.' });
  }
});

// =====================================================================
// 💳 Confirmer la carte sauvegardée et activer le renouvellement auto
// Appelé par la page de succès (DomaineSucces.tsx) après le retour de Stripe.
// =====================================================================
router.get('/domaines/:id/confirmer-setup-carte', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ success: false, error: 'session_id requis.' });
  }

  try {
    const result = await pool.query(`SELECT * FROM domaines WHERE id = $1`, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Domaine non trouvé.' });
    }
    const domaineRow = result.rows[0];

    if (req.user.id !== domaineRow.gestionnaire_id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['setup_intent'],
    });

    const setupIntent = session.setup_intent;
    if (!setupIntent || setupIntent.status !== 'succeeded') {
      return res.json({ success: false, message: 'La configuration de la carte n\'a pas été confirmée.' });
    }

    const paymentMethodId = setupIntent.payment_method;

    await pool.query(
      `UPDATE domaines SET stripe_payment_method_id = $1, renouvellement_auto = TRUE WHERE id = $2`,
      [paymentMethodId, id]
    );

    res.json({ success: true, message: 'Renouvellement automatique activé avec succès.' });
  } catch (error) {
    console.error('Erreur confirmer-setup-carte:', error);
    res.status(500).json({ success: false, error: 'Erreur lors de la confirmation.' });
  }
});

// =====================================================================
// 🔕 Désactiver le renouvellement automatique
// =====================================================================
router.put('/domaines/:id/renouvellement-auto', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { actif } = req.body; // true/false

  try {
    const result = await pool.query(`SELECT * FROM domaines WHERE id = $1`, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Domaine non trouvé.' });
    }
    const domaineRow = result.rows[0];

    if (req.user.id !== domaineRow.gestionnaire_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await pool.query(`UPDATE domaines SET renouvellement_auto = $1 WHERE id = $2`, [!!actif, id]);
    res.json({ success: true, renouvellement_auto: !!actif });
  } catch (error) {
    console.error('Erreur toggle renouvellement-auto:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// =====================================================================
// 🔁 Renouveler maintenant (manuel) — crée une session Stripe Checkout
// =====================================================================
router.post('/domaines/:id/renouveler-maintenant', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM domaines WHERE id = $1`, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Domaine non trouvé.' });
    }
    const domaineRow = result.rows[0];

    if (req.user.id !== domaineRow.gestionnaire_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Prix réel actuel chez Dynadot (peut avoir changé depuis l'achat initial)
    const checkUrl = `${DYNADOT_API_URL}?key=${DYNADOT_API_KEY}&command=check&domain=${domaineRow.domaine}`;
    const checkResponse = await fetch(checkUrl);
    const checkData = await checkResponse.json();
    const prixDynadot = checkData.Price != null ? (parseFloat(checkData.Price) || domaineRow.prix_dynadot || 12.99) : (domaineRow.prix_dynadot || 12.99);
    const prixClient = calculerPrixClient(prixDynadot);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Renouvellement — ${domaineRow.domaine}`,
            description: `Renouvellement du domaine ${domaineRow.domaine} pour 1 an`,
          },
          unit_amount: Math.round(prixClient * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/domaine-succes?domain=${domaineRow.domaine}&session_id={CHECKOUT_SESSION_ID}&renouvellement=true`,
      cancel_url: `${process.env.FRONTEND_URL}/domaine-annule`,
      metadata: {
        type: 'renouvellement',
        domaine_id: String(id),
        domain: domaineRow.domaine,
        gestionnaire_id: String(domaineRow.gestionnaire_id),
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur renouveler-maintenant:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement de renouvellement.' });
  }
});


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
    const typeSession = session.metadata.type; // 'renouvellement' ou undefined (= achat initial)

    // ── Cas 1 : renouvellement d'un domaine existant ──
    if (typeSession === 'renouvellement') {
      const domaineId = session.metadata.domaine_id;
      const domain = session.metadata.domain;

      console.log(`🔁 Paiement de renouvellement reçu pour ${domain} (domaine id ${domaineId})`);

      try {
        const renewResult = await renouvelerDomaineDynadot(domain);

        if (renewResult.success) {
          await pool.query(
            `UPDATE domaines
             SET expiration_date = $1, dernier_rappel_envoye = NULL, statut = 'actif'
             WHERE id = $2`,
            [renewResult.expirationDate || null, domaineId]
          );
          console.log(`✅ Domaine ${domain} renouvelé avec succès chez Dynadot !`);
        } else {
          console.error(`❌ Paiement reçu mais échec du renouvellement Dynadot pour ${domain}:`, renewResult.error);
          // Le paiement Stripe a réussi mais Dynadot a échoué — nécessite une
          // intervention manuelle (email admin à ajouter ici plus tard).
        }
      } catch (error) {
        console.error('❌ Erreur traitement renouvellement:', error);
      }

      return res.json({ received: true });
    }

    // ── Cas 2 : achat initial d'un nouveau domaine ──
    const domain = session.metadata.domain;
    const years = parseInt(session.metadata.years) || 1;
    const gestionnaireId = session.metadata.gestionnaire_id;

    console.log(`✅ Paiement reçu pour le domaine ${domain} (gestionnaire ${gestionnaireId})`);

    try {
      // 🔥 MAINTENANT on achète le domaine chez Dynadot
      const registerResult = await enregistrerDomaineDynadot(domain, years, session);

      if (registerResult.success) {
        // Récupérer le prix réel Dynadot pour référence (utile au renouvellement)
        const checkUrl = `${DYNADOT_API_URL}?key=${DYNADOT_API_KEY}&command=check&domain=${domain}`;
        const checkResponse = await fetch(checkUrl);
        const checkData = await checkResponse.json();
        const prixDynadot = checkData.Price != null ? (parseFloat(checkData.Price) || null) : null;
        const prixClient = session.amount_total ? session.amount_total / 100 : calculerPrixClient(prixDynadot);

        // ✅ Sauvegarder dans l'historique d'achats
        await pool.query(
          `INSERT INTO domaines (domaine, gestionnaire_id, dynadot_order_id, expiration_date, statut, prix_dynadot, prix_client, created_at)
           VALUES ($1, $2, $3, $4, 'actif', $5, $6, NOW())`,
          [domain, gestionnaireId, registerResult.orderId || null, registerResult.expirationDate || null, prixDynadot, prixClient]
        );

        // 🌐 Configurer le DNS automatiquement chez Dynadot (CNAME www + A apex vers Render)
        await configurerDNS(domain);

        // 🔗 Connecter le domaine au site du gestionnaire (comme le flux manuel "Mon Domaine")
        const domaineAvecWww = domain.startsWith('www.') ? domain : `www.${domain}`;
        const resultatRender = await renderService.ajouterDomainePerso(domaineAvecWww);

        if (resultatRender.success) {
          await pool.query(
            `UPDATE sites
             SET domaine_perso = $1,
                 cf_hostname_id = $2,
                 domaine_statut = 'en_attente',
                 updated_at = NOW()
             WHERE gestionnaire_id = $3`,
            [domaineAvecWww, resultatRender.domaine?.id || null, gestionnaireId]
          );
          console.log(`✅ Domaine ${domain} enregistré chez Dynadot ET connecté sur Render !`);
        } else {
          console.error(`❌ Domaine acheté et DNS configuré, mais échec de connexion Render:`, resultatRender.erreur);
          // Le domaine reste utilisable manuellement via "Mon Domaine" — le gestionnaire
          // pourra retenter la connexion depuis l'interface si besoin.
        }
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
// 🔁 Fonction : Renouveler un domaine chez Dynadot
// =====================================================================
async function renouvelerDomaineDynadot(domain, years = 1) {
  const params = new URLSearchParams({
    key: DYNADOT_API_KEY,
    command: 'renew',
    domain: domain,
    duration: years,
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
      expirationDate: data.ExpirationDate || null,
      error: data.ErrorMessage || null
    };

  } catch (error) {
    console.error('Erreur renouvellement Dynadot:', error);
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
      // www → CNAME vers Render (le domaine principal du service)
      record_0_type: 'CNAME',
      record_0_name: 'www',
      record_0_value: 'evend-studio.onrender.com',
      record_0_ttl: '3600',
      // Domaine racine (@) → A record vers l'IP de Render (les CNAME ne
      // fonctionnent pas sur un domaine racine — limitation standard du DNS).
      // Render redirige automatiquement la racine vers le www.
      record_1_type: 'A',
      record_1_name: '@',
      record_1_value: '216.24.57.1',
      record_1_ttl: '3600',
    });

    const response = await fetch(DYNADOT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    console.log(`✅ DNS configuré pour ${domain} (www + racine vers Render):`, data);
    return { success: true };

  } catch (error) {
    console.error(`❌ Erreur configuration DNS pour ${domain}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = router;