// CHEMIN : services/transporteurs/shippo.js
// e-Vend Studio — Transporteur Shippo (étiquettes d'expédition). Repris tel quel d'e-Vend (utils/shippingProviders/shippo.js) : même interface, même comportement.
// Provider Shippo — implémente l'interface commune définie dans index.js.
// Appels directs à l'API REST de Shippo (pas de SDK officiel Node à jour).
// Doc: https://docs.goshippo.com/shippoapi/public-api/

const BASE_URL = 'https://api.goshippo.com';

// ── Aplatir n'importe quelle structure d'erreur Shippo en message lisible ──
// Shippo retourne des formats d'erreur très variables selon l'endpoint :
// string simple, tableau de strings, ou objet { champ: ["message", ...] }
// potentiellement imbriqué (ex: { address_from: { zip: ["invalid"] } }).
function aplatirErreurShippo(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return data.map(aplatirErreurShippo).filter(Boolean).join(' | ');
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([champ, val]) => `${champ}: ${aplatirErreurShippo(val)}`)
      .join(' | ');
  }
  return String(data);
}

// ── Helper requête générique ─────────────────────────────────────────────
async function appelShippo(config, methode, chemin, corps) {
  if (!config?.token) {
    throw new Error('Token Shippo manquant — le vendeur doit configurer son compte dans Paramètres.');
  }
  const res = await fetch(`${BASE_URL}${chemin}`, {
    method: methode,
    headers: {
      'Authorization': `ShippoToken ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Toujours logger la réponse brute côté serveur — c'est souvent la seule
    // façon de voir EXACTEMENT quel champ Shippo rejette (adresse, colis, etc.)
    console.error(`❌ Shippo HTTP ${res.status} sur ${chemin}:`, JSON.stringify(data), '| Requête envoyée:', JSON.stringify(corps));
    const detail = data?.detail || aplatirErreurShippo(data) || `Erreur Shippo (HTTP ${res.status})`;
    const err = new Error(detail);
    err.statusCode = res.status;
    err.shippoResponse = data;
    throw err;
  }
  return data;
}

// ── Construire une adresse au format Shippo ──────────────────────────────
// Shippo impose des limites de longueur strictes par champ (ex: phone ≤ 50
// caractères). On nettoie/tronque défensivement plutôt que de laisser une
// donnée BD mal formée faire échouer tout l'achat d'étiquette.
function nettoyerTelephone(tel) {
  if (!tel) return undefined;
  // Garde uniquement les caractères usuels d'un numéro (chiffres, +, -, espaces, parenthèses)
  const nettoye = String(tel).replace(/[^\d+\-() ]/g, '').trim();
  return nettoye.slice(0, 50) || undefined;
}

// ── Normaliser la province/état en code à 2 lettres ─────────────────────
// Shippo peut accepter la création d'un envoi avec une province en toutes
// lettres (ex: "Québec") sans erreur, mais échouer ensuite silencieusement
// à calculer des tarifs car ses transporteurs attendent un code ISO à 2
// lettres (ex: "QC"). On normalise défensivement pour le Canada.
const PROVINCES_CA = {
  'alberta': 'AB', 'colombie-britannique': 'BC', 'british columbia': 'BC',
  'manitoba': 'MB', 'nouveau-brunswick': 'NB', 'new brunswick': 'NB',
  'terre-neuve-et-labrador': 'NL', 'newfoundland and labrador': 'NL',
  'nouvelle-écosse': 'NS', 'nova scotia': 'NS', 'territoires du nord-ouest': 'NT',
  'northwest territories': 'NT', 'nunavut': 'NU', 'ontario': 'ON',
  'île-du-prince-édouard': 'PE', 'prince edward island': 'PE',
  'québec': 'QC', 'quebec': 'QC', 'saskatchewan': 'SK', 'yukon': 'YT',
};
function normaliserProvince(province) {
  if (!province) return '';
  const brut = province.trim();
  if (/^[A-Za-z]{2}$/.test(brut)) return brut.toUpperCase(); // déjà un code
  // Cas "Région administrative (QC)" — extraire le code entre parenthèses
  const matchParenthese = brut.match(/\(([A-Za-z]{2})\)\s*$/);
  if (matchParenthese) return matchParenthese[1].toUpperCase();
  return PROVINCES_CA[brut.toLowerCase()] || brut; // sinon table, sinon tel quel
}

function formaterAdresse({ nom, entreprise, rue, ville, province, codePostal, pays, telephone, email }) {
  return {
    name: (nom || '—').slice(0, 100),
    company: entreprise ? entreprise.slice(0, 100) : undefined,
    street1: (rue || '').slice(0, 100),
    city: (ville || '').slice(0, 50),
    state: normaliserProvince(province),
    zip: (codePostal || '').slice(0, 20),
    country: pays || 'CA',
    phone: nettoyerTelephone(telephone),
    email: email ? email.slice(0, 100) : undefined,
  };
}

// ── obtenirTarifs ─────────────────────────────────────────────────────────
// config: { token, mode }
// params: { adresseExpedition, adresseLivraison, colis: { poidsKg, longueurCm, largeurCm, hauteurCm } }
// Retourne { rates: [...triés du moins cher au plus cher], diagnostic: {...} }
// — le diagnostic est toujours inclus (succès ou échec) pour permettre au
// vendeur/admin de copier-coller un rapport de débogage au besoin.
async function obtenirTarifs(config, { adresseExpedition, adresseLivraison, colis }) {
  if (!colis?.poidsKg || colis.poidsKg <= 0) {
    throw new Error('Poids du colis manquant ou invalide — impossible d\'obtenir des tarifs.');
  }

  const shipment = await appelShippo(config, 'POST', '/shipments', {
    address_from: formaterAdresse(adresseExpedition),
    address_to: formaterAdresse(adresseLivraison),
    parcels: [{
      length: String(colis.longueurCm || 20),
      width: String(colis.largeurCm || 15),
      height: String(colis.hauteurCm || 10),
      distance_unit: 'cm',
      weight: String(colis.poidsKg),
      mass_unit: 'kg',
    }],
    async: false,
  });

  if (shipment.status === 'ERROR') {
    const detail = shipment.messages?.map(m => m.text).join(', ') || 'Erreur de création de l\'envoi Shippo';
    throw new Error(detail);
  }

  const rawRates = shipment.rates || [];
  const rates = rawRates.filter(r => !r.messages || r.messages.length === 0);

  const diag = {
    shipment_status: shipment.status,
    shipment_object_id: shipment.object_id,
    messages_shipment: shipment.messages || [],
    address_from_envoyee: shipment.address_from || null,
    address_to_envoyee: shipment.address_to || null,
    nb_rates_bruts: rawRates.length,
    raisons_par_transporteur: rawRates.flatMap(r => (r.messages || []).map(m => `${r.provider}: ${m.text}`)),
  };

  if (rates.length === 0) {
    console.error('⚠️ Shippo: shipment créé mais aucun tarif valide.', JSON.stringify(diag, null, 2));

    let message;
    if (shipment.status === 'QUEUED' || shipment.status === 'WAITING') {
      message = 'Shippo n\'a pas fini de calculer les tarifs (statut encore en attente) — réessayez dans quelques secondes, Canada Post est parfois plus lent que les autres transporteurs.';
    } else if (rawRates.length === 0) {
      message = 'Aucun tarif retourné par Shippo — vérifiez qu\'au moins un transporteur compatible (ex: Canada Post) est activé dans votre dashboard Shippo, sous Fulfillment network → Carrier accounts. Le compte test par défaut n\'inclut souvent que USPS (États-Unis).';
    } else {
      message = `Tous les tarifs ont été rejetés par les transporteurs : ${diag.raisons_par_transporteur.join(' | ') || 'raison non précisée par Shippo'}`;
    }
    const err = new Error(message);
    err.diagnostic = diag;
    throw err;
  }

  return {
    rates: rates.map(r => ({
      rateId: r.object_id,
      transporteur: r.provider,
      service: r.servicelevel?.name || r.servicelevel?.token || 'Service standard',
      montant: parseFloat(r.amount),
      devise: r.currency,
      delaiEstimeJours: r.estimated_days ?? null,
      shipmentId: shipment.object_id,
    })).sort((a, b) => a.montant - b.montant),
    diagnostic: diag,
  };
}

// ── acheterEtiquette ──────────────────────────────────────────────────────
// config: { token, mode }
// params: { rateId }
// Retourne { succes, numeroSuivi, urlSuivi, urlEtiquette, transporteur, service, transactionId }
async function acheterEtiquette(config, { rateId }) {
  if (!rateId) throw new Error('rateId manquant pour l\'achat de l\'étiquette.');

  const transaction = await appelShippo(config, 'POST', '/transactions', {
    rate: rateId,
    label_file_type: 'PDF',
    async: false,
  });

  if (transaction.status !== 'SUCCESS') {
    const detail = transaction.messages?.map(m => m.text).join(', ') || 'Achat de l\'étiquette refusé par Shippo';
    const err = new Error(detail);
    err.shippoResponse = transaction;
    throw err;
  }

  return {
    succes: true,
    numeroSuivi: transaction.tracking_number || null,
    urlSuivi: transaction.tracking_url_provider || null,
    urlEtiquette: transaction.label_url || null,
    transactionId: transaction.object_id,
  };
}

// ── parserWebhook ──────────────────────────────────────────────────────────
// Shippo envoie un événement `track_updated` avec la structure suivante :
// { event: 'track_updated', data: {
//     tracking_number, carrier,
//     tracking_status: { status, substatus, status_details, status_date, location },
//     tracking_history: [ { status, substatus, status_details, status_date, location }, ... ]
// } }
// tracking_history contient TOUS les événements connus à ce jour (pas
// seulement le plus récent) — Shippo renvoie la liste complète à chaque
// webhook, donc on peut réécrire tout l'historique à chaque appel sans se
// soucier des doublons.
function formaterLieu(location) {
  if (!location) return { ville: null, province: null, pays: null };
  return {
    ville: location.city || null,
    province: location.state || null,
    pays: location.country || null,
  };
}

function parserWebhook(payload) {
  if (!payload || payload.event !== 'track_updated' || !payload.data) return null;
  const d = payload.data;

  const historique = (d.tracking_history || []).map(evt => ({
    statut: evt.status || null,
    sousStatut: evt.substatus?.code || null,
    description: evt.status_details || evt.substatus?.text || null,
    dateEvenement: evt.status_date || null,
    ...formaterLieu(evt.location),
  }));

  return {
    numeroSuivi: d.tracking_number || null,
    transporteur: d.carrier || null,
    statutBrut: d.tracking_status?.status || null,
    sousStatutBrut: d.tracking_status?.substatus?.code || null,
    etapeLivraison: mapperStatutVersEtape(d.tracking_status?.status),
    historique,
  };
}

// ── mapperStatutVersEtape ───────────────────────────────────────────────
// Traduit un statut Shippo vers le vocabulaire unifié `etape_livraison` de e-vend.
// Retourne null si aucun mapping pertinent (ne pas écraser l'étape actuelle).
function mapperStatutVersEtape(statutShippo) {
  const map = {
    'PRE_TRANSIT': 'etiquette_creer',
    'TRANSIT': 'transit',
    'DELIVERED': 'livree',
    'RETURNED': 'retournee_expediteur',
    'FAILURE': 'livraison_echouee',
  };
  return map[statutShippo] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🆕 obtenirStatutTrackingVerifie — cœur du correctif anti-fraude webhook
// ═══════════════════════════════════════════════════════════════════════════
// Contexte : Shippo n'offre pas de secret de signature webhook en libre-
// service (confirmé par leur support, ticket #1164621 — nécessite une
// relation Account Manager/Solutions par compte, impraticable pour un modèle
// "bring your own token" avec des dizaines de comptes vendeurs indépendants).
//
// Plutôt que de faire confiance au contenu du webhook (falsifiable par
// quiconque connaît le numero_suivi), routes/webhooks-shippo.js utilise
// cette fonction pour rappeler DIRECTEMENT l'API Shippo, avec le vrai token
// du vendeur, et demander le VRAI statut du colis. Seule cette réponse
// serveur-à-serveur est utilisée pour mettre à jour la commande — jamais le
// contenu du webhook lui-même, qui ne sert qu'à savoir QUOI vérifier.
//
// Un fraudeur peut forger un faux POST vers notre webhook, mais ne peut pas
// forger la réponse de l'API de Shippo quand on l'interroge nous-mêmes.
//
// config: { token, mode } — vendeur dont Shippo est le transporteur ACTIF
// (chargerConfigLivraisonActive), jamais un token arbitraire.
// carrier/trackingNumber : toujours lus depuis NOTRE PROPRE BD (commandes.
// transporteur / commandes.numero_suivi, fixés au moment de l'achat de
// l'étiquette), jamais depuis le corps du webhook.
//
// Doc Shippo : GET /tracks/{carrier}/{tracking_number}/
// ═══════════════════════════════════════════════════════════════════════════
async function obtenirStatutTrackingVerifie(config, { carrier, trackingNumber }) {
  if (!carrier || !trackingNumber) {
    throw new Error('carrier et trackingNumber requis pour vérifier le statut du suivi.');
  }

  const data = await appelShippo(
    config,
    'GET',
    `/tracks/${encodeURIComponent(carrier)}/${encodeURIComponent(trackingNumber)}/`
  );

  const historique = (data.tracking_history || []).map(evt => ({
    statut: evt.status || null,
    sousStatut: evt.substatus?.code || null,
    description: evt.status_details || evt.substatus?.text || null,
    dateEvenement: evt.status_date || null,
    ...formaterLieu(evt.location),
  }));

  return {
    numeroSuivi: data.tracking_number || trackingNumber,
    transporteur: data.carrier || carrier,
    statutBrut: data.tracking_status?.status || null,
    sousStatutBrut: data.tracking_status?.substatus?.code || null,
    etapeLivraison: mapperStatutVersEtape(data.tracking_status?.status),
    historique,
  };
}

module.exports = {
  obtenirTarifs,
  acheterEtiquette,
  parserWebhook,
  mapperStatutVersEtape,
  obtenirStatutTrackingVerifie,
};