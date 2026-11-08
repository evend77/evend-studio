// CHEMIN : services/transporteurs/easypost.js
// e-Vend Studio — copie fidèle du provider e-Vend (utils/shippingProviders/easypost.js), même interface que shippo.js.
// Provider EasyPost — implémente la même interface que shippo.js :
//   obtenirTarifs, acheterEtiquette, parserWebhook, mapperStatutVersEtape
//
// ⚠️ Différences importantes avec Shippo :
// - Authentification HTTP Basic (clé API en nom d'utilisateur, mot de passe vide)
//   plutôt qu'un header "Authorization: ShippoToken ...".
// - Unités IMPÉRIALES obligatoires : longueur/largeur/hauteur en POUCES,
//   poids en ONCES (Shippo accepte cm/kg directement). On convertit ici.
// - L'achat d'étiquette a besoin du shipment_id EN PLUS du rate_id
//   (POST /shipments/{shipment_id}/buy), contrairement à Shippo où le
//   rate_id seul suffit. C'est pour ça que shippo.js et easypost.js
//   retournent tous les deux un champ `shipmentId` par tarif — chez Shippo
//   il est ignoré à l'achat, chez EasyPost il est obligatoire.

const BASE_URL = 'https://api.easypost.com/v2';

// ── Conversions d'unités (notre système travaille en cm/kg partout) ──────
const cmVersPouces = (cm) => cm / 2.54;
const kgVersOnces  = (kg) => kg * 35.27396195;

// ── Helper requête générique — auth HTTP Basic (clé API en "username") ──
async function appelEasyPost(config, methode, chemin, corps) {
  if (!config?.token) {
    throw new Error('Clé API EasyPost manquante — le collaborateur doit configurer son compte dans Configuration → Étiquettes d\'expédition.');
  }
  const authB64 = Buffer.from(`${config.token}:`).toString('base64');
  const res = await fetch(`${BASE_URL}${chemin}`, {
    method: methode,
    headers: {
      'Authorization': `Basic ${authB64}`,
      'Content-Type': 'application/json',
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    console.error(`❌ EasyPost HTTP ${res.status} sur ${chemin}:`, JSON.stringify(data), '| Requête envoyée:', JSON.stringify(corps));
    const detail = data?.error?.message
      || (Array.isArray(data?.error?.errors) ? data.error.errors.map(e => e.message).join(' | ') : null)
      || `Erreur EasyPost (HTTP ${res.status})`;
    const err = new Error(detail);
    err.statusCode = res.status;
    err.easypostResponse = data;
    throw err;
  }
  return data;
}

// ── Construire une adresse au format EasyPost ────────────────────────────
function formaterAdresse({ nom, entreprise, rue, ville, province, codePostal, pays, telephone, email }) {
  return {
    name: (nom || '—').slice(0, 100),
    company: entreprise ? entreprise.slice(0, 100) : undefined,
    street1: (rue || '').slice(0, 100),
    city: (ville || '').slice(0, 50),
    state: (province || '').toUpperCase(),
    zip: (codePostal || '').slice(0, 20),
    country: pays || 'CA',
    phone: telephone ? String(telephone).replace(/[^\d+\-() ]/g, '').trim().slice(0, 50) : undefined,
    email: email ? email.slice(0, 100) : undefined,
  };
}

// ── obtenirTarifs ─────────────────────────────────────────────────────────
// Retourne { rates: [...triés du moins cher au plus cher], diagnostic: {...} }
async function obtenirTarifs(config, { adresseExpedition, adresseLivraison, colis }) {
  if (!colis?.poidsKg || colis.poidsKg <= 0) {
    throw new Error('Poids du colis manquant ou invalide — impossible d\'obtenir des tarifs.');
  }

  const shipment = await appelEasyPost(config, 'POST', '/shipments', {
    shipment: {
      to_address: formaterAdresse(adresseLivraison),
      from_address: formaterAdresse(adresseExpedition),
      parcel: {
        length: +cmVersPouces(colis.longueurCm || 20).toFixed(1),
        width:  +cmVersPouces(colis.largeurCm  || 15).toFixed(1),
        height: +cmVersPouces(colis.hauteurCm  || 10).toFixed(1),
        weight: +kgVersOnces(colis.poidsKg).toFixed(1),
      },
    },
  });

  const rawRates = shipment.rates || [];

  const diag = {
    shipment_id: shipment.id,
    shipment_status: shipment.status,
    messages: shipment.messages || [],
    address_from_envoyee: shipment.from_address || null,
    address_to_envoyee: shipment.to_address || null,
    nb_rates_bruts: rawRates.length,
  };

  if (rawRates.length === 0) {
    console.error('⚠️ EasyPost: shipment créé mais aucun tarif.', JSON.stringify(diag, null, 2));
    const raisons = (shipment.messages || []).map(m => `${m.carrier || ''}: ${m.message || m.text || ''}`.trim());
    const err = new Error(
      raisons.length > 0
        ? `Aucun tarif retourné par EasyPost : ${raisons.join(' | ')}`
        : 'Aucun tarif retourné par EasyPost — vérifiez qu\'au moins un transporteur est activé dans votre dashboard EasyPost (Settings → Carriers).'
    );
    err.diagnostic = diag;
    throw err;
  }

  return {
    rates: rawRates
      .map(r => ({
        rateId: r.id,
        transporteur: r.carrier,
        service: r.service || 'Service standard',
        montant: parseFloat(r.rate),
        devise: r.currency || 'USD',
        delaiEstimeJours: r.delivery_days ?? null,
        shipmentId: shipment.id, // 🔑 obligatoire pour l'achat chez EasyPost
      }))
      .sort((a, b) => a.montant - b.montant),
    diagnostic: diag,
  };
}

// ── acheterEtiquette ──────────────────────────────────────────────────────
// params: { rateId, shipmentId } — shipmentId est OBLIGATOIRE pour EasyPost
async function acheterEtiquette(config, { rateId, shipmentId }) {
  if (!rateId) throw new Error('rateId manquant pour l\'achat de l\'étiquette.');
  if (!shipmentId) throw new Error('shipmentId manquant — obligatoire pour acheter une étiquette EasyPost.');

  const shipment = await appelEasyPost(config, 'POST', `/shipments/${shipmentId}/buy`, {
    rate: { id: rateId },
  });

  if (!shipment.postage_label?.label_url) {
    const err = new Error('Achat de l\'étiquette refusé par EasyPost — aucune étiquette générée.');
    err.easypostResponse = shipment;
    throw err;
  }

  return {
    succes: true,
    numeroSuivi: shipment.tracking_code || null,
    urlSuivi: shipment.tracker?.public_url || null,
    urlEtiquette: shipment.postage_label.label_url,
    transactionId: shipment.id,
  };
}

// ── parserWebhook ──────────────────────────────────────────────────────────
// EasyPost envoie un objet Event avec description "tracker.updated" (ou
// "tracker.created") et le Tracker complet dans `result`, avec l'historique
// dans `result.tracking_details`.
function parserWebhook(payload) {
  if (!payload || !payload.description?.startsWith('tracker.') || !payload.result) return null;
  const tracker = payload.result;

  const historique = (tracker.tracking_details || []).map(evt => ({
    statut: evt.status || null,
    sousStatut: null,
    description: evt.message || null,
    dateEvenement: evt.datetime || null,
    ville: evt.tracking_location?.city || null,
    province: evt.tracking_location?.state || null,
    pays: evt.tracking_location?.country || null,
  }));

  return {
    numeroSuivi: tracker.tracking_code || null,
    transporteur: tracker.carrier || null,
    statutBrut: tracker.status || null,
    sousStatutBrut: null,
    etapeLivraison: mapperStatutVersEtape(tracker.status),
    historique,
  };
}

// ── mapperStatutVersEtape ───────────────────────────────────────────────
// Traduit un statut EasyPost vers le vocabulaire unifié `etape_livraison`.
function mapperStatutVersEtape(statutEasyPost) {
  const map = {
    'pre_transit': 'etiquette_creer',
    'in_transit': 'transit',
    'out_for_delivery': 'livraison',
    'available_for_pickup': 'prete_ramassage',
    'delivered': 'livree',
    'return_to_sender': 'retournee_expediteur',
    'failure': 'livraison_echouee',
  };
  return map[statutEasyPost] || null;
}

module.exports = {
  obtenirTarifs,
  acheterEtiquette,
  parserWebhook,
  mapperStatutVersEtape,
};