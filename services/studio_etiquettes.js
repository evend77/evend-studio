// CHEMIN : services/studio_etiquettes.js
// e-Vend Studio — Étiquettes d'expédition des collaborateurs (add-ons « Étiquettes Shippo / EasyPost / Postes Canada »).
// Adapté d'e-Vend (routes/vendeurs_etiquettes.js + utils/expeditionHelpers.js + routes/webhooks-shippo.js).
//
// Modèle « bring your own token » : chaque COLLABORATEUR colle ses propres identifiants (chiffrés AES-256-GCM dans
// collab_expedition_config) ; l'étiquette est facturée sur SON compte chez le transporteur. Un seul transporteur actif à la fois.
// L'adresse d'expédition est celle de la boutique du collaborateur.
//
// Suivi automatique (Shippo) : le webhook ne sert qu'à savoir QUELLE commande vérifier. Le vrai statut est redemandé
// directement à Shippo avec le token du collaborateur (un faux webhook ne peut donc rien changer).

'use strict';

const pool = require('../db');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');
const addons = require('./studio_addons');
const rembMV = require('./studio_remboursement');

class ErreurEtiquette extends Error {
  constructor(message, status, diagnostic) { super(message); this.status = status || 400; this.diagnostic = diagnostic; }
}

// Transporteurs disponibles (un add-on chacun). EasyPost et Postes Canada s'ajoutent ici.
const TRANSPORTEURS = {
  shippo: { addon: 'etiquette_shippo', nom: 'Shippo', charger: () => require('./transporteurs/shippo') },
};

// Étapes de livraison qu'un suivi automatique ne doit jamais écraser
const ETAPES_PROTEGEES = new Set(['annulee', 'refusee', 'livree']);

// ── Configuration du collaborateur ─────────────────────────────────────────

async function lireConfig(cid, gid, db) {
  const r = await (db || pool).query('SELECT * FROM collab_expedition_config WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid]);
  return r.rows[0] || null;
}

function estConfigure(code, row) {
  if (!row) return false;
  if (code === 'shippo') return !!row.shippo_token_chiffre;
  return false;
}

/** État pour l'écran de configuration : JAMAIS de clé ni de secret, seulement « configuré oui/non ». */
async function etatConfig(cid, gid) {
  const row = await lireConfig(cid, gid);
  const transporteurs = [];
  for (const [code, t] of Object.entries(TRANSPORTEURS)) {
    transporteurs.push({
      code, nom: t.nom,
      addon_actif: await addons.addonActifRapide(gid, t.addon, pool),
      configure: estConfigure(code, row),
      mode: code === 'shippo' ? (row ? row.shippo_mode : 'test') : 'test',
      actif: !!row && row.provider_actif === code,
    });
  }
  return { transporteurs };
}

/** Enregistre / active / désactive / efface la clé Shippo du collaborateur. */
async function enregistrerShippo(cid, gid, { token, actif, effacer }) {
  if (!(await addons.addonActifRapide(gid, TRANSPORTEURS.shippo.addon, pool))) {
    throw new ErreurEtiquette("L'option « Étiquettes Shippo » n'est pas activée pour cette marketplace.", 403);
  }
  const row = await lireConfig(cid, gid);
  let tokenChiffre = row ? row.shippo_token_chiffre : null;
  let mode = row ? row.shippo_mode : 'test';
  let provider = row ? row.provider_actif : null;

  if (effacer) {
    tokenChiffre = null; mode = 'test';
    if (provider === 'shippo') provider = null;
  } else {
    if (typeof token === 'string' && token.trim()) {
      const t = token.trim();
      if (t.length > 200 || !/^shippo_(test|live)_[A-Za-z0-9]+$/.test(t)) {
        throw new ErreurEtiquette('Clé Shippo invalide : elle doit commencer par « shippo_test_ » ou « shippo_live_ » (copiez-la en entier).');
      }
      tokenChiffre = chiffrer(t);
      mode = t.startsWith('shippo_live_') ? 'production' : 'test';
    }
    if (actif === true) {
      if (!tokenChiffre) throw new ErreurEtiquette("Collez d'abord votre clé API Shippo.");
      provider = 'shippo';                       // activer Shippo désactive automatiquement les autres transporteurs
    } else if (actif === false && provider === 'shippo') {
      provider = null;
    }
  }
  await pool.query(
    `INSERT INTO collab_expedition_config (collaborateur_id, gestionnaire_id, provider_actif, shippo_token_chiffre, shippo_mode, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (collaborateur_id) DO UPDATE SET provider_actif = $3, shippo_token_chiffre = $4, shippo_mode = $5, updated_at = NOW()`,
    [cid, gid, provider, tokenChiffre, mode]);
}

/** Config prête à l'emploi (clé déchiffrée) du transporteur ACTIF du collaborateur, ou null. */
async function configActive(cid, gid) {
  const row = await lireConfig(cid, gid);
  if (!row || !row.provider_actif) return null;
  if (row.provider_actif === 'shippo') {
    const token = dechiffrer(row.shippo_token_chiffre);
    return token ? { provider: 'shippo', token, mode: row.shippo_mode || 'test' } : null;
  }
  return null;
}

// ── Adresses et colis ──────────────────────────────────────────────────────

function paysISO(v) {
  const s = String(v || '').trim();
  if (!s) return 'CA';
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  const n = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (['canada'].includes(n)) return 'CA';
  if (['etats-unis', 'etats unis', 'usa', 'united states', 'u.s.a.', 'etats-unis d\'amerique'].includes(n)) return 'US';
  return 'CA';
}

async function adresseExpedition(cid, gid) {
  const r = await pool.query(
    `SELECT nom_boutique, nom_responsable, adresse, ville, province, code_postal, telephone, email
       FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2`, [cid, gid]);
  const c = r.rows[0];
  if (!c) return null;
  return {
    nom: c.nom_responsable || c.nom_boutique || 'Vendeur', entreprise: c.nom_boutique || undefined,
    rue: c.adresse || '', ville: c.ville || '', province: c.province || '', codePostal: c.code_postal || '',
    pays: 'CA', telephone: c.telephone || undefined, email: c.email || undefined,
  };
}

function adresseLivraison(cmd) {
  const a = cmd.adresse_livraison && typeof cmd.adresse_livraison === 'object' ? cmd.adresse_livraison : {};
  const nom = [a.prenom, a.nom].filter(Boolean).join(' ').trim() || a.nom
    || [cmd.acheteur_prenom, cmd.acheteur_nom].filter(Boolean).join(' ').trim() || '—';
  return {
    nom, rue: String(a.ligne1 || a.adresse || a.rue || ''), ville: String(a.ville || ''), province: String(a.province || ''),
    codePostal: String(a.code_postal || a.codePostal || ''), pays: paysISO(a.pays),
    telephone: a.telephone || cmd.acheteur_telephone || undefined, email: a.email || cmd.acheteur_email || undefined,
  };
}

function poidsArticlesKg(cmd) {
  const lignes = Array.isArray(cmd.articles) ? cmd.articles : [];
  return lignes.reduce((s, a) => s + (parseFloat(a && a.poids) || 0) * (parseInt(a && (a.quantite || a.quantity), 10) || 1), 0);
}

function nombreOpt(v) { const n = parseFloat(v); return Number.isFinite(n) && n > 0 && n < 1000 ? n : undefined; }

// ── Commande + préparation commune ─────────────────────────────────────────

async function chargerCommande(cid, gid, id) {
  const r = await pool.query(
    `SELECT c.*, a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email, a.telephone AS acheteur_telephone
       FROM marketplace_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id
      WHERE c.id = $1 AND c.collaborateur_id = $2 AND c.gestionnaire_id = $3`, [id, cid, gid]);
  return r.rows[0] || null;
}

async function preparer(cid, gid) {
  const cfg = await configActive(cid, gid);
  if (!cfg) throw new ErreurEtiquette("Aucun transporteur actif. Ajoutez votre clé dans Configuration → Étiquettes d'expédition.");
  const t = TRANSPORTEURS[cfg.provider];
  if (!t || !(await addons.addonActifRapide(gid, t.addon, pool))) {
    throw new ErreurEtiquette(`L'option « Étiquettes ${t ? t.nom : ''} » n'est pas activée pour cette marketplace.`.replace('  ', ' '), 403);
  }
  return { cfg, mod: t.charger() };
}

function verifierCommandeExpediable(cmd) {
  if (!cmd) throw new ErreurEtiquette('Commande introuvable', 404);
  if (cmd.statut_paiement !== 'paye') throw new ErreurEtiquette("Cette commande n'est pas payée : impossible de créer une étiquette.", 409);
  if (cmd.statut === 'annulee' || cmd.statut === 'livree') throw new ErreurEtiquette('Cette commande ne peut plus être expédiée.', 409);
}

function colisDe(cmd, body) {
  const poidsKg = nombreOpt(body && body.poids_kg) || poidsArticlesKg(cmd);
  if (!poidsKg || poidsKg <= 0) throw new ErreurEtiquette('Poids de la commande manquant ou nul. Entrez un poids manuellement pour continuer.');
  return {
    poidsKg,
    longueurCm: nombreOpt(body && body.longueur_cm), largeurCm: nombreOpt(body && body.largeur_cm), hauteurCm: nombreOpt(body && body.hauteur_cm),
  };
}

async function adressesOuErreur(cid, gid, cmd) {
  const exp = await adresseExpedition(cid, gid);
  const liv = adresseLivraison(cmd);
  if (!exp || !exp.rue || !exp.ville || !exp.codePostal) {
    throw new ErreurEtiquette("L'adresse de votre boutique (adresse, ville, code postal) est incomplète — complétez-la dans Mon profil → Ma boutique.");
  }
  if (!liv.rue || !liv.ville || !liv.codePostal) throw new ErreurEtiquette("L'adresse de livraison de l'acheteur est incomplète pour cette commande.");
  return { exp, liv };
}

function erreurFournisseur(e) {
  if (e instanceof ErreurEtiquette) return e;
  return new ErreurEtiquette(e && e.message ? e.message : 'Erreur du transporteur', 502, e && e.diagnostic);
}

// ── Tarifs + achat ─────────────────────────────────────────────────────────

async function tarifs(cid, gid, id, body) {
  const cmd = await chargerCommande(cid, gid, id);
  verifierCommandeExpediable(cmd);
  const { cfg, mod } = await preparer(cid, gid);
  const colis = colisDe(cmd, body);
  const { exp, liv } = await adressesOuErreur(cid, gid, cmd);
  try {
    const r = await mod.obtenirTarifs(cfg, { adresseExpedition: exp, adresseLivraison: liv, colis });
    return { provider: cfg.provider, poids_kg: colis.poidsKg, tarifs: r.rates, diagnostic: r.diagnostic };
  } catch (e) { throw erreurFournisseur(e); }
}

/** Achète l'étiquette. N'écrit rien en base : la route applique ensuite le passage à « expédiée ». */
async function acheter(cid, gid, cmd, body) {
  verifierCommandeExpediable(cmd);
  const rateId = body && typeof body.rate_id === 'string' ? body.rate_id : '';
  if (!rateId || rateId.length > 200) throw new ErreurEtiquette('rate_id manquant');
  const { cfg, mod } = await preparer(cid, gid);
  try {
    const achat = await mod.acheterEtiquette(cfg, { rateId, shipmentId: body.shipment_id });
    return { provider: cfg.provider, achat };
  } catch (e) { throw erreurFournisseur(e); }
}

// ── Suivi de livraison ─────────────────────────────────────────────────────

function lireHistorique(brut) {
  try { const h = typeof brut === 'string' ? JSON.parse(brut) : brut; return Array.isArray(h) ? h : []; } catch (e) { return []; }
}

async function notifierAcheteur(gid, acheteurId, titre, message) {
  if (!acheteurId) return;
  try {
    await pool.query(`INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,'commande')`,
      [gid, acheteurId, titre, message]);
  } catch (e) { console.error('[studio_etiquettes] notification :', e.message); }
}

const MESSAGES_ETAPE = {
  livree: ['Commande livrée', 'a été livrée.'],
  livraison_echouee: ['Problème de livraison', 'a rencontré un problème de livraison.'],
  retournee_expediteur: ['Colis retourné', 'a été retourné à l\'expéditeur.'],
};

/** Applique un statut de suivi VÉRIFIÉ (ev) à la commande : étape, historique fusionné par source, livraison, notification. */
async function appliquerSuivi(cmd, ev, source) {
  if (ETAPES_PROTEGEES.has(cmd.etape_livraison) || cmd.statut === 'annulee') return;
  const etape = ev.etapeLivraison;
  if (etape && etape !== cmd.etape_livraison) {
    await pool.query('UPDATE marketplace_commandes SET etape_livraison = $1, updated_at = NOW() WHERE id = $2', [etape, cmd.id]);
  }
  if (ev.historique && ev.historique.length > 0) {
    const autres = lireHistorique(cmd.historique_suivi).filter((e) => e.source !== source);
    const recus = ev.historique.map((e) => ({
      date: e.dateEvenement, statut: e.description || e.statut || 'Mise à jour de suivi',
      description: [e.ville, e.province].filter(Boolean).join(', ') || e.sousStatut || '', etape: null, source,
    }));
    const fusion = [...autres, ...recus].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await pool.query('UPDATE marketplace_commandes SET historique_suivi = $1::jsonb WHERE id = $2', [JSON.stringify(fusion), cmd.id]);
  }
  if (etape === 'livree' && cmd.statut !== 'livree') {
    const r = await pool.query(`UPDATE marketplace_commandes SET statut = 'livree', updated_at = NOW() WHERE id = $1 AND statut IN ('confirmee','expediee')`, [cmd.id]);
    if (r.rowCount) await rembMV.noter(pool, cmd.id, 'statut_livree', 'Livraison confirmée par le transporteur', 'systeme');
  }
  if (etape && etape !== cmd.etape_livraison && MESSAGES_ETAPE[etape]) {
    const [titre, fin] = MESSAGES_ETAPE[etape];
    await notifierAcheteur(cmd.gestionnaire_id, cmd.acheteur_id, titre, `Votre commande ${cmd.numero_commande} ${fin}`);
  }
}

function jetonTransporteur(v) { return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }

/** Webhook Shippo (track_updated). Le contenu n'est JAMAIS cru : il sert seulement à retrouver la commande. */
async function traiterWebhookShippo(payload) {
  const mod = TRANSPORTEURS.shippo.charger();
  const brut = mod.parserWebhook(payload);
  if (!brut || !brut.numeroSuivi) return { ignore: 'payload non reconnu' };
  const lignes = await pool.query(
    `SELECT id, statut, etape_livraison, historique_suivi, acheteur_id, gestionnaire_id, collaborateur_id, transporteur, numero_suivi, numero_commande
       FROM marketplace_commandes WHERE numero_suivi = $1 AND etiquette_provider = 'shippo'`, [String(brut.numeroSuivi).slice(0, 80)]);
  let traitees = 0;
  for (const cmd of lignes.rows) {
    if (ETAPES_PROTEGEES.has(cmd.etape_livraison) || cmd.statut === 'annulee') continue;   // déjà livrée / annulée : inutile d'interroger Shippo
    const row = await lireConfig(cmd.collaborateur_id, cmd.gestionnaire_id);
    if (!row || row.provider_actif !== 'shippo') continue;                 // le collaborateur a changé de transporteur : on ignore (sécuritaire)
    const token = dechiffrer(row.shippo_token_chiffre);
    if (!token) continue;
    const candidats = [...new Set([jetonTransporteur(cmd.transporteur), jetonTransporteur(brut.transporteur)].filter(Boolean))];
    let verifie = null; let derniereErreur = null;
    for (const carrier of candidats) {
      try { verifie = await mod.obtenirStatutTrackingVerifie({ token }, { carrier, trackingNumber: cmd.numero_suivi }); break; }
      catch (e) { derniereErreur = e; }
    }
    if (!verifie) { console.error(`[studio_etiquettes] vérification Shippo échouée (commande ${cmd.id}) :`, derniereErreur && derniereErreur.message); continue; }
    await appliquerSuivi(cmd, verifie, 'shippo');
    traitees++;
  }
  return { traitees };
}

module.exports = {
  ErreurEtiquette, TRANSPORTEURS, etatConfig, enregistrerShippo, configActive,
  chargerCommande, tarifs, acheter, appliquerSuivi, traiterWebhookShippo, lireHistorique,
};