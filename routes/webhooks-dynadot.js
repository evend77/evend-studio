// routes/webhooks-dynadot.js
// e-Vend Studio — Webhook pour recevoir les notifications Dynadot
// Écoute les événements : achat, renouvellement, expiration, transfert de domaine

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();

// Stockage temporaire (à remplacer par ta base de données)
const domainOrders = new Map();

// ─────────────────────────────────────────────────────────────
// Vérification de signature — format officiel Dynadot (doc RESTful API v2.0.0)
// https://www.dynadot.com/domain/api-document#webhook-header
//
// stringToSign = webhookKey + "\n" + fullPathAndQuery + "\n" + (xRequestId ou "") + "\n" + (requestBody ou "")
// signature attendue = HMAC-SHA256(stringToSign, webhookSecret), encodée en Base64
// ─────────────────────────────────────────────────────────────
function verifyDynadotSignature(req) {
  const webhookKey    = process.env.DYNADOT_WEBHOOK_KEY;
  const webhookSecret = process.env.DYNADOT_WEBHOOK_SECRET;

  if (!webhookKey || !webhookSecret) {
    console.error('❌ DYNADOT_WEBHOOK_KEY / DYNADOT_WEBHOOK_SECRET manquant — webhook refusé par sécurité.');
    return false;
  }

  // Authorization: Bearer WEBHOOK_KEY
  const authHeader  = req.headers['authorization'] || '';
  const providedKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (providedKey !== webhookKey) return false;

  const signature = req.headers['x-signature'];
  if (!signature) return false;

  const xRequestId       = req.headers['x-request-id'] || '';
  const fullPathAndQuery = req.originalUrl;
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

  const stringToSign = webhookKey + '\n' + fullPathAndQuery + '\n' + xRequestId + '\n' + rawBody;
  const expected = crypto.createHmac('sha256', webhookSecret).update(stringToSign, 'utf8').digest('base64');

  // Comparaison à temps constant (évite les attaques par timing)
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ============================================================
// Webhook principal - Reçoit TOUS les événements Dynadot
// ============================================================
router.post('/', async (req, res) => {
  try {
    // 🔒 Vérification de signature — la route utilise express.raw() en amont
    // (server.js), donc req.body est un Buffer brut à ce stade.
    if (process.env.NODE_ENV === 'production') {
      if (!verifyDynadotSignature(req)) {
        console.error('❌ Signature webhook Dynadot invalide ou absente.');
        return res.status(401).json({ error: 'Signature invalide' });
      }
    }

    // req.body est un Buffer (express.raw) — on le parse nous-mêmes en JSON
    // (l'ancien code faisait `req.body.EventType` directement sur le Buffer,
    // ce qui ne fonctionnait jamais).
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    let event;
    try {
      event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    } catch (e) {
      console.error('❌ Corps du webhook Dynadot illisible (JSON invalide):', e.message);
      return res.status(400).json({ error: 'Corps de requête invalide.' });
    }

    console.log('📨 Webhook Dynadot reçu:', event);

    const eventType = event.EventType || event.type || event.event;
    const domainName = event.DomainName || event.domain || event.data?.DomainName;
    const userId = event.UserId || event.user_id || event.data?.UserId;
    const orderId = event.OrderId || event.order_id || event.data?.OrderId;

    // Traiter selon le type d'événement
    switch (eventType) {
      case 'domain_registered':
      case 'order_completed':
        console.log(`✅ Domaine ${domainName} enregistré par l'utilisateur ${userId}`);
        await handleDomainRegistered(domainName, userId, orderId, event);
        await sendConfirmationEmail(domainName, userId);
        break;

      case 'domain_transfer_in':
        console.log(`🔄 Transfert entrant pour ${domainName}`);
        await handleDomainTransfer(domainName, userId, 'in', event);
        break;

      case 'domain_transfer_away':
      case 'domain_transfer_out':
        console.log(`🔄 Transfert sortant pour ${domainName}`);
        await handleDomainTransfer(domainName, userId, 'out', event);
        break;

      case 'domain_renewed':
        console.log(`🔄 Domaine ${domainName} renouvelé pour ${event.Years || 1} an(s)`);
        await handleDomainRenewed(domainName, userId, event);
        break;

      case 'domain_expiring':
      case 'domain_expiration_warning':
        console.log(`⚠️ Domaine ${domainName} expire bientôt`);
        await sendExpirationWarning(domainName, userId);
        break;

      case 'domain_expired':
        console.log(`❌ Domaine ${domainName} a expiré`);
        await handleDomainExpired(domainName, userId);
        break;

      case 'domain_deleted':
        console.log(`🗑️ Domaine ${domainName} supprimé`);
        await handleDomainDeleted(domainName, userId);
        break;

      case 'dns_updated':
        console.log(`🌐 DNS mis à jour pour ${domainName}`);
        await handleDNSUpdated(domainName, userId, event);
        break;

      default:
        console.log(`⚠️ Événement non géré: ${eventType}`);
    }

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
  domainOrders.set(domainName, {
    userId,
    orderId,
    status: 'active',
    registeredAt: new Date(),
    expirationDate: event.ExpirationDate,
    event
  });

  await configureDNSForDomain(domainName, userId);
}

async function handleDomainRenewed(domainName, userId, event) {
  console.log(`📅 Domaine ${domainName} renouvelé jusqu'au ${event.NewExpirationDate}`);
}

async function handleDomainExpired(domainName, userId) {
  console.log(`⚠️ Site pour ${domainName} désactivé - domaine expiré`);
}

async function handleDomainTransfer(domainName, userId, direction, event) {
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
  const DYNADOT_API_KEY = process.env.DYNADOT_API_KEY;
  const DYNADOT_API_URL = 'https://api.dynadot.com/api3.json';

  try {
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
  console.log(`📧 Email de confirmation envoyé pour ${domainName} à l'utilisateur ${userId}`);
}

async function sendExpirationWarning(domainName, userId) {
  console.log(`📧 Avertissement expiration envoyé pour ${domainName}`);
}

// ============================================================
// Endpoint de test — DÉSACTIVÉ EN PRODUCTION
// Avant, ce endpoint permettait à n'importe qui de simuler un
// enregistrement de domaine sans aucune authentification.
// ============================================================
if (process.env.NODE_ENV !== 'production') {
  router.post('/test', async (req, res) => {
    console.log('🧪 Test webhook - simulation Dynadot');

    const testEvent = {
      EventType: 'domain_registered',
      DomainName: 'test-evend.com',
      UserId: 1,
      OrderId: 'TEST-12345',
      ExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      await handleDomainRegistered(testEvent.DomainName, testEvent.UserId, testEvent.OrderId, testEvent);
      res.status(200).json({ status: 'success', message: 'Test webhook exécuté' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });
}

// ============================================================
// Endpoint pour lister les domaines d'un vendeur
// 🔒 CORRIGÉ : nécessite une session valide + on ne peut voir que
// ses propres domaines (sauf un admin, qui voit tout). Avant, ce
// endpoint était complètement ouvert — n'importe qui pouvait
// changer :userId dans l'URL et voir les domaines de n'importe qui.
// ============================================================
const { authenticateToken } = require('../middleware/auth');

router.get('/domains/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
    return res.status(403).json({ error: 'Accès non autorisé à ces domaines.' });
  }

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