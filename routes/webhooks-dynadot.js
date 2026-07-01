// routes/webhooks-dynadot.js
// e-Vend Studio — Webhook pour recevoir les notifications Dynadot
// Écoute les événements : achat, renouvellement, expiration, transfert de domaine

const express = require('express');
const router = express.Router();

// Stockage temporaire (à remplacer par ta base de données)
const domainOrders = new Map();

// Vérifier la signature du webhook (sécurité)
function verifyWebhookSignature(req, secret) {
  const signature = req.headers['x-dynadot-signature'];
  const timestamp = req.headers['x-dynadot-timestamp'];
  const body = JSON.stringify(req.body);
  
  // Construction du message à vérifier
  const message = timestamp + '.' + body;
  
  // TODO: Comparer avec HMAC-SHA256 utilisant ta clé secrète
  // Pour l'instant, on accepte tous les webhooks (à sécuriser en production)
  return true;
}

// ============================================================
// Webhook principal - Reçoit TOUS les événements Dynadot
// ============================================================
router.post('/', async (req, res) => {
  try {
    const event = req.body;
    console.log('📨 Webhook Dynadot reçu:', event);

    // Vérifier la signature (optionnel en dev, OBLIGATOIRE en prod)
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(req, process.env.DYNADOT_API_SECRET);
      if (!isValid) {
        console.error('❌ Signature webhook invalide');
        return res.status(401).json({ error: 'Signature invalide' });
      }
    }

    const eventType = event.EventType || event.type;
    const domainName = event.DomainName || event.domain;
    const userId = event.UserId || event.user_id;
    const orderId = event.OrderId || event.order_id;

    // Traiter selon le type d'événement
    switch (eventType) {
      case 'domain_registered':
        // Domaine enregistré avec succès
        console.log(`✅ Domaine ${domainName} enregistré par l'utilisateur ${userId}`);
        
        // Mettre à jour la base de données
        await handleDomainRegistered(domainName, userId, orderId, event);
        
        // Envoyer un email de confirmation au vendeur
        await sendConfirmationEmail(domainName, userId);
        break;

      case 'domain_transfer_in':
        // Transfert de domaine entrant
        console.log(`🔄 Transfert entrant pour ${domainName}`);
        await handleDomainTransfer(domainName, userId, 'in', event);
        break;

      case 'domain_transfer_out':
        // Transfert de domaine sortant
        console.log(`🔄 Transfert sortant pour ${domainName}`);
        await handleDomainTransfer(domainName, userId, 'out', event);
        break;

      case 'domain_renewed':
        // Renouvellement automatique
        console.log(`🔄 Domaine ${domainName} renouvelé pour ${event.Years || 1} an(s)`);
        await handleDomainRenewed(domainName, userId, event);
        break;

      case 'domain_expiration_warning':
        // Avertissement d'expiration (30 jours avant)
        console.log(`⚠️ Domaine ${domainName} expire dans 30 jours`);
        await sendExpirationWarning(domainName, userId);
        break;

      case 'domain_expired':
        // Domaine expiré
        console.log(`❌ Domaine ${domainName} a expiré`);
        await handleDomainExpired(domainName, userId);
        break;

      case 'domain_deleted':
        // Domaine supprimé
        console.log(`🗑️ Domaine ${domainName} supprimé`);
        await handleDomainDeleted(domainName, userId);
        break;

      case 'dns_updated':
        // DNS mis à jour
        console.log(`🌐 DNS mis à jour pour ${domainName}`);
        await handleDNSUpdated(domainName, userId, event);
        break;

      default:
        console.log(`⚠️ Événement non géré: ${eventType}`);
    }

    // Répondre à Dynadot pour accuser réception
    res.status(200).json({ 
      status: 'success', 
      message: 'Webhook traité',
      event: eventType 
    });

  } catch (error) {
    console.error('❌ Erreur webhook Dynadot:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// ============================================================
// Fonctions de traitement des événements
// ============================================================

async function handleDomainRegistered(domainName, userId, orderId, event) {
  // Mettre à jour la base de données e-Vend Studio
  // Exemple avec une base SQL :
  /*
  await db.query(`
    UPDATE sites 
    SET domaine = ?, 
        domaine_statut = 'actif',
        domaine_expiration = ?,
        domaine_commande_id = ?
    WHERE vendeur_id = ?
  `, [domainName, event.ExpirationDate, orderId, userId]);
  */

  // Stockage temporaire
  domainOrders.set(domainName, {
    userId,
    orderId,
    status: 'active',
    registeredAt: new Date(),
    expirationDate: event.ExpirationDate,
    event
  });

  // Configurer automatiquement le DNS vers e-Vend Studio
  await configureDNSForDomain(domainName, userId);
}

async function handleDomainRenewed(domainName, userId, event) {
  // Mettre à jour la date d'expiration
  /*
  await db.query(`
    UPDATE sites 
    SET domaine_expiration = ?
    WHERE vendeur_id = ? AND domaine = ?
  `, [event.NewExpirationDate, userId, domainName]);
  */
  
  console.log(`📅 Domaine ${domainName} renouvelé jusqu'au ${event.NewExpirationDate}`);
}

async function handleDomainExpired(domainName, userId) {
  // Désactiver le site ou afficher un avertissement
  /*
  await db.query(`
    UPDATE sites 
    SET domaine_statut = 'expire'
    WHERE vendeur_id = ? AND domaine = ?
  `, [userId, domainName]);
  */
  
  console.log(`⚠️ Site pour ${domainName} désactivé - domaine expiré`);
}

async function handleDomainTransfer(domainName, userId, direction, event) {
  // Gérer les transferts entrants/sortants
  console.log(`🔄 Transfert ${direction} pour ${domainName}`);
}

async function handleDNSUpdated(domainName, userId, event) {
  console.log(`🌐 Nouvelle configuration DNS pour ${domainName}`);
}

async function handleDomainDeleted(domainName, userId) {
  domainOrders.delete(domainName);
  console.log(`🗑️ Domaine ${domainName} supprimé de la base`);
}

// ============================================================
// Fonctions utilitaires
// ============================================================

async function configureDNSForDomain(domainName, userId) {
  // Configurer automatiquement les enregistrements DNS vers e-Vend Studio
  // via l'API Dynadot
  
  const DYNADOT_API_KEY = process.env.DYNADOT_API_KEY;
  const DYNADOT_API_URL = 'https://api.dynadot.com/api3.json';
  
  try {
    // Configurer CNAME pour www
    const params = new URLSearchParams({
      key: DYNADOT_API_KEY,
      command: 'set_dns',
      domain: domainName,
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
    console.log(`✅ DNS configuré pour ${domainName}:`, data);
    
  } catch (error) {
    console.error(`❌ Erreur configuration DNS pour ${domainName}:`, error);
  }
}

async function sendConfirmationEmail(domainName, userId) {
  // Envoyer un email au vendeur pour confirmer que le domaine est actif
  console.log(`📧 Email de confirmation envoyé pour ${domainName} à l'utilisateur ${userId}`);
  
  // TODO: Intégrer ton système d'email (nodemailer, SendGrid, etc.)
  /*
  await sendEmail({
    to: userEmail,
    subject: `🎉 Votre domaine ${domainName} est actif !`,
    template: 'domain-active',
    data: { domainName, dnsSettings: 'www → sites.e-vendstudio.ca' }
  });
  */
}

async function sendExpirationWarning(domainName, userId) {
  // Envoyer un avertissement d'expiration
  console.log(`📧 Avertissement expiration envoyé pour ${domainName}`);
}

// ============================================================
// Endpoint pour tester le webhook (développement)
// ============================================================
router.post('/test', async (req, res) => {
  console.log('🧪 Test webhook - simulation Dynadot');
  
  const testEvent = {
    EventType: 'domain_registered',
    DomainName: 'test-evend.com',
    UserId: 1,
    OrderId: 'TEST-12345',
    ExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  req.body = testEvent;
  
  try {
    await handleDomainRegistered(testEvent.DomainName, testEvent.UserId, testEvent.OrderId, testEvent);
    res.status(200).json({ status: 'success', message: 'Test webhook exécuté' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================================
// Endpoint pour lister les domaines d'un vendeur
// ============================================================
router.get('/domains/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Récupérer les domaines depuis la base de données
  // const domains = await db.query('SELECT * FROM sites WHERE vendeur_id = ?', [userId]);
  
  const domains = Array.from(domainOrders.entries())
    .filter(([_, data]) => data.userId == userId)
    .map(([domain, data]) => ({
      domain,
      status: data.status,
      expirationDate: data.expirationDate,
      registeredAt: data.registeredAt
    }));
  
  res.json({ domains });
});

module.exports = router;