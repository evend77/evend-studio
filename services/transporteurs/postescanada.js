// CHEMIN : services/transporteurs/postescanada.js
// e-Vend Studio — copie du provider e-Vend (utils/shippingProviders/postescanada.js), mêmes appels API, deux corrections de sécurité/robustesse notées « STUDIO ».
// Provider Postes Canada — implémente la même interface que shippo.js et
// easypost.js : obtenirTarifs, acheterEtiquette, mapperStatutVersEtape.
//
// ⚠️ Différences architecturales importantes avec Shippo/EasyPost :
//
// 1. AUTHENTIFICATION — OAuth 2.0 client_credentials. On doit d'abord
//    échanger clé API + code secret contre un jeton Bearer (valide ~1h),
//    avant chaque groupe d'appels. Pas de simple header "clé API" direct.
//
// 2. PAS DE "RATE ID" — contrairement à Shippo/EasyPost, on ne conserve pas
//    d'identifiant de tarif entre l'étape "obtenir les tarifs" et l'étape
//    "acheter" : on repasse directement le serviceCode (ex: "DOM.XP").
//
// 3. PAS DE WEBHOOK DE SUIVI — l'API de repérage de Postes Canada est un
//    simple GET (interrogation), pas un système d'événements poussés comme
//    Shippo/EasyPost. Le suivi automatique nécessiterait un job périodique
//    (cron) qui interroge chaque commande active, pas encore implémenté ici.
//
// 4. PDF DE L'ÉTIQUETTE NON PUBLIC — le lien "label" retourné exige le même
//    jeton Bearer pour être téléchargé (contrairement aux liens publics
//    S3/CloudFront de Shippo/EasyPost). On télécharge donc le PDF
//    immédiatement à l'achat et on le retourne en base64 (data URI),
//    directement utilisable dans un lien <a href> sans jamais exposer le
//    jeton au navigateur.
//
// 5. UNITÉS — kilogrammes et centimètres, exactement comme notre système
//    interne. Aucune conversion nécessaire (contrairement à EasyPost).

const BASE_URL = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs';
const TOKEN_URL = `${BASE_URL}/cpc-api-native-oauth-provider/oauth2/token`;

// ── Obtenir un jeton Bearer (OAuth 2.0 client_credentials) ───────────────
// Pas de cache partagé entre requêtes ici par simplicité/sûreté — un jeton
// par appel de haut niveau (obtenirTarifs / acheterEtiquette). Le coût d'un
// appel de jeton supplémentaire est négligeable comparé au risque de servir
// un jeton expiré à cause d'un cache mal invalidé.
async function obtenirJeton(config) {
  if (!config?.cleApi || !config?.codeSecret) {
    throw new Error('Clé API ou code secret Postes Canada manquant — le collaborateur doit configurer son compte dans Configuration → Étiquettes d\'expédition.');
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'X-IBM-Client-Id': config.cleApi,
      'X-IBM-Client-Secret': config.codeSecret,
      'accept': 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'scope=merchant&grant_type=client_credentials',
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) {
    console.error('❌ Postes Canada — échec obtention du jeton:', res.status, JSON.stringify(data));
    const detail = data?.error_description || data?.error || data?.message || JSON.stringify(data) || 'réponse vide';
    const err = new Error(`Authentification Postes Canada refusée (HTTP ${res.status}) — ${detail}`);
    err.diagnostic = { etape: 'obtention_jeton', statusHttp: res.status, reponse: data };
    throw err;
  }
  return data.access_token;
}

// ── Helper requête générique — ajoute le Bearer automatiquement ──────────
async function appelPostesCanada(config, methode, chemin, corps, jetonExistant) {
  const jeton = jetonExistant || await obtenirJeton(config);
  const res = await fetch(`${BASE_URL}${chemin}`, {
    method: methode,
    headers: {
      'Authorization': `Bearer ${jeton}`,
      'Accept-Language': 'fr-CA',
      'accept': 'application/json',
      'content-type': 'application/json',
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`❌ Postes Canada HTTP ${res.status} sur ${chemin}:`, JSON.stringify(data), '| Requête envoyée:', JSON.stringify(corps));
    const detail = data?.messages?.map(m => m.description || m.message).join(' | ')
      || data?.message
      || `Erreur Postes Canada (HTTP ${res.status})`;
    const err = new Error(detail);
    err.statusCode = res.status;
    err.postesCanadaResponse = data;
    throw err;
  }
  return { data, jeton };
}

// ── Noms de services fiables ──────────────────────────────────────────────
// Table tirée directement de la doc officielle Postes Canada. Utilisée en
// PRIORITÉ sur le champ "service-name" retourné par l'API — découvert que ce
// champ peut être incohérent avec le vrai serviceCode dans certaines
// réponses (ex: "DOM.RP" étiqueté à tort "Priorité").
const NOMS_SERVICES = {
  'DOM.RP': 'Colis standard',
  'DOM.EP': 'Colis accélérés',
  'DOM.XP': 'Xpresspost',
  'DOM.PC': 'Priorité',
  'DOM.LIB': 'Livres de bibliothèque',
};

// ── Lire un champ peu importe sa casse ────────────────────────────────────
// ⚠️ Découvert en pratique : la doc Postes Canada montre du camelCase
// (priceDetails, serviceName) mais l'API retourne réellement du kebab-case
// pour certains champs imbriqués (price-details, service-name) — probable
// reliquat de leur ancien système XML. On accepte les deux formats partout
// où c'est arrivé une fois, par prudence, plutôt que de deviner à nouveau.
function champ(obj, ...cles) {
  for (const cle of cles) {
    if (obj && obj[cle] !== undefined) return obj[cle];
  }
  return undefined;
}

// ── Normaliser un code postal au format attendu (ex: "G0L2K0", pas "G0L 2K0") ──
function normaliserCodePostal(cp) {
  return (cp || '').toString().replace(/\s+/g, '').toUpperCase();
}

// STUDIO : cette intégration ne gère que les envois DOMESTIQUES (services DOM.*) — on refuse clairement une adresse hors Canada
function verifierDomestique(adresseLivraison) {
  const pays = String(adresseLivraison?.pays || 'CA').toUpperCase();
  if (pays !== 'CA' && pays !== 'CANADA') throw new Error("Postes Canada (direct) ne gère ici que les livraisons au Canada. Pour l'international, utilisez Shippo ou EasyPost.");
}
// Téléphone : chiffres seulement (10 chiffres attendus par Postes Canada)
function normaliserTelephone(t) {
  const d = String(t || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '0000000000';
}

// ── obtenirTarifs ─────────────────────────────────────────────────────────
// Retourne { rates: [...triés du moins cher au plus cher], diagnostic: {...} }
async function obtenirTarifs(config, { adresseExpedition, adresseLivraison, colis }) {
  if (!colis?.poidsKg || colis.poidsKg <= 0) {
    throw new Error('Poids du colis manquant ou invalide — impossible d\'obtenir des tarifs.');
  }

  verifierDomestique(adresseLivraison);
  const corps = {
    customerNumber: config.numeroClient,
    quoteType: 'commercial', // tarif réduit Solutions pour petites entreprises
    options: [],
    // 🆕 CORRIGÉ — la doc dit qu'omettre "services" retourne tous les tarifs
    // disponibles, mais en pratique ça n'en retournait qu'un seul, avec un
    // décalage entre serviceCode et service-name (ex: "DOM.RP" étiqueté
    // "Priorité"). On demande maintenant explicitement les 4 services
    // domestiques principaux — mêmes options que Shippo/EasyPost proposent
    // par défaut (Régulier/Accéléré/Xpresspost/Priorité).
    services: ['DOM.RP', 'DOM.EP', 'DOM.XP', 'DOM.PC'],
    parcelCharacteristics: {
      weight: colis.poidsKg,
      dimensions: {
        length: colis.longueurCm || 20,
        width: colis.largeurCm || 15,
        height: colis.hauteurCm || 10,
      },
    },
    originPostalCode: normaliserCodePostal(adresseExpedition.codePostal),
    destination: {
      domestic: { postalCode: normaliserCodePostal(adresseLivraison.codePostal) },
    },
  };

  // STUDIO : le jeton Bearer n'est JAMAIS renvoyé au navigateur (e-Vend le glissait dans chaque tarif sous « _jetonReutilise »)
  const { data: rates } = await appelPostesCanada(config, 'POST', '/rating/v1/prices', corps);

  const diag = {
    nb_rates_bruts: Array.isArray(rates) ? rates.length : 0,
    corps_envoye: corps,
    reponse_brute: rates, // 🆕 pour voir la vraie structure de priceDetails retournée
  };

  if (!Array.isArray(rates) || rates.length === 0) {
    console.error('⚠️ Postes Canada: aucun tarif retourné.', JSON.stringify(diag, null, 2));
    const err = new Error('Aucun tarif retourné par Postes Canada — vérifiez que le numéro de client et les adresses sont valides.');
    err.diagnostic = diag;
    throw err;
  }

  return {
    rates: rates
      .map(r => {
        const detailsPrix = champ(r, 'priceDetails', 'price-details') || {};
        return {
          rateId: r.serviceCode, // pas de rate ID séparé chez Postes Canada — le serviceCode sert directement
          transporteur: 'Postes Canada',
          service: NOMS_SERVICES[r.serviceCode] || champ(r, 'serviceName', 'service-name') || r.serviceCode,
          montant: parseFloat(detailsPrix.due ?? 0),
          devise: 'CAD',
          delaiEstimeJours: r.serviceStandard?.expectedTransitTime ?? null,
        };
      })
      .sort((a, b) => a.montant - b.montant),
    diagnostic: diag,
  };
}

// ── acheterEtiquette ──────────────────────────────────────────────────────
// params: { rateId (= serviceCode), adresseExpedition, adresseLivraison, colis }
// Retourne { succes, numeroSuivi, urlSuivi, urlEtiquette (data URI base64), transactionId }
async function acheterEtiquette(config, { rateId, adresseExpedition, adresseLivraison, colis }) {
  if (!rateId) throw new Error('serviceCode (rateId) manquant pour l\'achat de l\'étiquette.');
  if (!/^DOM\.[A-Z]{2,4}$/.test(String(rateId))) throw new Error('Service Postes Canada invalide.');   // STUDIO : seuls les services domestiques connus
  verifierDomestique(adresseLivraison);

  const corps = {
    requestedShippingPoint: normaliserCodePostal(adresseExpedition.codePostal),
    transmitShipment: true, // pas de manifeste requis — modèle "moins de 50 colis/jour"
    deliverySpec: {
      serviceCode: rateId,
      sender: {
        name: adresseExpedition.nom || undefined,
        company: adresseExpedition.entreprise || adresseExpedition.nom || 'Vendeur',
        contactPhone: normaliserTelephone(adresseExpedition.telephone),
        addressDetails: {
          addressLine1: adresseExpedition.rue,
          city: adresseExpedition.ville,
          provState: adresseExpedition.province,
          countryCode: 'CA',
          postalZipCode: normaliserCodePostal(adresseExpedition.codePostal),
        },
      },
      destination: {
        name: adresseLivraison.nom,
        clientVoiceNumber: adresseLivraison.telephone ? normaliserTelephone(adresseLivraison.telephone) : undefined,
        addressDetails: {
          addressLine1: adresseLivraison.rue,
          city: adresseLivraison.ville,
          provState: adresseLivraison.province,
          countryCode: 'CA',
          postalZipCode: normaliserCodePostal(adresseLivraison.codePostal),
        },
      },
      parcelCharacteristics: {
        weight: colis.poidsKg,
        dimensions: {
          length: colis.longueurCm || 20,
          width: colis.largeurCm || 15,
          height: colis.hauteurCm || 10,
        },
      },
      printPreferences: { outputFormat: '4x6' },
      preferences: { showPackingInstructions: false },
      settlementInfo: {
        // ⚠️ Nécessite qu'une carte de crédit soit enregistrée et définie
        // par défaut dans le profil Postes Canada du vendeur (Solutions
        // pour petites entreprises → Paiement) — pas de contractId ici
        // puisqu'aucune convention commerciale n'est en place.
        intendedMethodOfPayment: 'CreditCard',
      },
    },
  };

  const mailedBy = config.numeroClient;
  const mobo = config.numeroClient; // "expédié au nom de" = même numéro pour un compte simple

  const { data: shipment, jeton } = await appelPostesCanada(
    config, 'POST', `/shipping/v1/${mailedBy}/${mobo}/shipments`, corps
  );

  const statutEnvoi = champ(shipment, 'shipmentStatus', 'shipment-status');
  if (statutEnvoi !== 'created') {
    const err = new Error('Achat de l\'étiquette refusé par Postes Canada.');
    err.postesCanadaResponse = shipment;
    throw err;
  }

  // Le lien "label" exige le même jeton Bearer — on le télécharge tout de
  // suite et on le convertit en data URI, directement ouvrable dans un
  // lien <a href> sans jamais exposer le jeton au navigateur.
  const liens = champ(shipment, 'links', 'links') || [];
  const lienEtiquette = liens.find(l => l.rel === 'label');
  let urlEtiquetteDataUri = null;
  if (lienEtiquette?.href) {
    try {
      const resLabel = await fetch(lienEtiquette.href, {
        headers: { 'Authorization': `Bearer ${jeton}`, 'accept': 'application/pdf' },
      });
      if (resLabel.ok) {
        const buffer = Buffer.from(await resLabel.arrayBuffer());
        urlEtiquetteDataUri = `data:application/pdf;base64,${buffer.toString('base64')}`;
      } else {
        console.error('⚠️ Postes Canada: échec téléchargement étiquette PDF, statut', resLabel.status);
      }
    } catch (e) {
      console.error('⚠️ Postes Canada: erreur téléchargement étiquette PDF:', e.message);
    }
  }

  const trackingPin = champ(shipment, 'trackingPin', 'tracking-pin');
  const shipmentId  = champ(shipment, 'shipmentId', 'shipment-id');
  const lienSuivi = trackingPin
    ? `https://www.canadapost-postescanada.ca/track-reperage/fr#/search?searchFor=${trackingPin}`
    : null;

  return {
    succes: true,
    numeroSuivi: trackingPin ? String(trackingPin) : null,
    urlSuivi: lienSuivi,
    urlEtiquette: urlEtiquetteDataUri,
    transactionId: shipmentId ? String(shipmentId) : null,
  };
}

// ── parserWebhook ──────────────────────────────────────────────────────────
// ⚠️ Postes Canada n'offre pas de webhook — cette fonction existe seulement pour respecter l'interface commune.
// Le suivi passe par le cron routes/cron_suivi_postescanada.js, qui appelle obtenirStatutSuivi() ci-dessous.
function parserWebhook(payload) {
  return null;
}

// ── obtenirStatutSuivi ───────────────────────────────────────────────────
// Utilisée par le cron de suivi — interroge le DERNIER événement connu d'un colis par PIN.
async function obtenirStatutSuivi(config, numeroSuivi) {
  if (!/^[A-Za-z0-9]{8,40}$/.test(String(numeroSuivi || ''))) return null;   // STUDIO : le PIN est inséré dans l'URL — on le valide
  const { data } = await appelPostesCanada(config, 'GET', `/tracking/v1/pins/${numeroSuivi}/summaries`);
  const evt = champ(data, 'value')?.[0];
  if (!evt) return null;
  const type = champ(evt, 'eventType', 'event-type');
  return {
    statutBrut: type || null,
    description: champ(evt, 'eventDescription', 'event-description') || null,
    ville: champ(evt, 'eventLocation', 'event-location') || null,
    dateEvenement: champ(evt, 'eventDateTime', 'event-date-time') || null,
    etapeLivraison: mapperStatutVersEtape(type),
  };
}

// ── mapperStatutVersEtape ───────────────────────────────────────────────
// ⚠️ Basé sur un seul exemple observé dans la doc ("INDUCTION") — la liste
// complète des valeurs eventType de Postes Canada n'a pas été confirmée.
// À enrichir/corriger une fois de vrais événements observés en pratique.
function mapperStatutVersEtape(eventType) {
  const map = {
    'INDUCTION': 'etiquette_creer',
    'DELIVERED': 'livree',
  };
  return map[eventType] || null;
}

module.exports = {
  obtenirTarifs,
  acheterEtiquette,
  parserWebhook,
  mapperStatutVersEtape,
  obtenirStatutSuivi, // exportée en plus, pour le cron de suivi
};