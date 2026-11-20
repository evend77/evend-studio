// CHEMIN : services/boutique_etiquettes.js
// e-Vend Studio — Add-ons « Étiquettes Shippo » et « Étiquettes EasyPost » des templates boutique (solo) : clés du gestionnaire, tarifs, achat d'étiquette, suivi automatique.
// Reprend la logique du MV (services/studio_etiquettes.js, collaborateurs) pour UN gestionnaire qui vend lui-même ; aucun fichier MV n'est modifié.
// Les fournisseurs (services/transporteurs/shippo.js et easypost.js) sont utilisés tels quels. UN SEUL transporteur actif à la fois (boutique_etiquettes_config.provider_actif).
//
// Modèle « bring your own token » : le gestionnaire colle SES clés ; elles sont chiffrées (src/utils/chiffrement) dans boutique_etiquettes_config
// et ne sont JAMAIS renvoyées au navigateur. L'étiquette est facturée sur SON compte chez le transporteur ; l'expédition part de l'adresse de sa boutique (table gestionnaires).
// Remboursement d'une étiquette achetée par erreur : directement dans le tableau de bord du transporteur (pas dans l'application).
// Suivi automatique — Shippo : le webhook ne sert qu'à savoir QUELLE commande vérifier ; le vrai statut est redemandé à Shippo avec la clé du gestionnaire.
//                   — EasyPost : le webhook est signé (HMAC-SHA256) avec le secret du gestionnaire ; sans secret ou signature valide il est rejeté.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const crypto = require('crypto');

const TRANSPORTEURS = {
  shippo:   { addon: 'etiquette_shippo',   nom: 'Shippo',   webhook: 'https://e-vendstudio.ca/api/boutique/etiquettes/webhook/shippo',           charger: () => require('./transporteurs/shippo') },
  easypost: { addon: 'etiquette_easypost', nom: 'EasyPost', webhook: 'https://e-vendstudio.ca/api/webhooks/boutique-etiquettes/easypost', charger: () => require('./transporteurs/easypost') },
};
const TOKEN_RE = /^shippo_(test|live)_[A-Za-z0-9]+$/;
const EASYPOST_RE = /^(EZTK|EZAK)[A-Za-z0-9]{16,200}$/;
const ETAPES_PROTEGEES = new Set(['annulee', 'refusee']);

const autorise = (gid, code, db) => A.addonActif(gid, TRANSPORTEURS[code].addon, db || pool);
const refusAddon = (code) => refus(`L'option « Étiquettes ${TRANSPORTEURS[code].nom} » n'est pas activée pour votre boutique.`, 403, { addon_inactif: true });
const refus = (m, s, extra) => { throw new ErreurBoutique(m, s || 400, extra); };
const httpSure = (u) => (typeof u === 'string' && /^https?:\/\/\S+$/i.test(u) && u.length <= 2000 ? u : null);

// ── Configuration ──────────────────────────────────────────────────────────

async function lireConfig(gid, db) {
  return (await (db || pool).query('SELECT * FROM boutique_etiquettes_config WHERE gestionnaire_id = $1', [gid])).rows[0] || null;
}

function paysISO(v) {
  const s = String(v || '').trim();
  if (!s) return 'CA';
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  const n = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (['etats-unis', 'etats unis', 'usa', 'united states', 'u.s.a.'].includes(n)) return 'US';
  return 'CA';
}

// Adresse d'expédition = adresse de la boutique du gestionnaire (table gestionnaires)
async function adresseExpedition(gid) {
  const g = (await pool.query(
    `SELECT nom, nom_boutique, email, telephone, num_civique, rue, ville, province, code_postal, pays FROM gestionnaires WHERE id = $1`, [gid])).rows[0];
  if (!g) return { adresse: null, manque: ['adresse'] };
  const rue = [g.num_civique, g.rue].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
  const manque = [];
  if (!rue) manque.push('adresse'); if (!String(g.ville || '').trim()) manque.push('ville');
  if (!String(g.province || '').trim()) manque.push('province'); if (!String(g.code_postal || '').trim()) manque.push('code postal');
  return {
    manque,
    adresse: {
      nom: String(g.nom || g.nom_boutique || 'Vendeur').trim(), entreprise: String(g.nom_boutique || '').trim() || undefined,
      rue, ville: String(g.ville || '').trim(), province: String(g.province || '').trim().toUpperCase(),
      codePostal: String(g.code_postal || '').trim().toUpperCase(), pays: paysISO(g.pays),
      telephone: String(g.telephone || '').trim() || undefined, email: String(g.email || '').trim() || undefined,
    },
  };
}

/** État pour l'écran de configuration : JAMAIS de clé, seulement « configurée oui/non ». */
async function etatConfig(gid) {
  const [row, exp] = await Promise.all([lireConfig(gid), adresseExpedition(gid)]);
  const ajoutes = await Promise.all(Object.keys(TRANSPORTEURS).map((c) => autorise(gid, c)));
  const r = row || {};
  const liste = [
    { code: 'shippo', nom: 'Shippo', addon_actif: ajoutes[0], configure: !!r.shippo_token_chiffre, mode: r.shippo_mode || 'test', actif: r.provider_actif === 'shippo', webhook_url: TRANSPORTEURS.shippo.webhook },
    { code: 'easypost', nom: 'EasyPost', addon_actif: ajoutes[1], configure: !!(r.easypost_cle_test_chiffre || r.easypost_cle_prod_chiffre), mode: r.easypost_mode || 'test', actif: r.provider_actif === 'easypost', webhook_url: TRANSPORTEURS.easypost.webhook,
      cle_test: !!r.easypost_cle_test_chiffre, cle_prod: !!r.easypost_cle_prod_chiffre, secret_configure: !!r.easypost_webhook_secret_chiffre },
  ];
  const actifOk = liste.find((t) => t.actif && t.addon_actif && t.configure);
  return {
    transporteurs: liste, addon_actif: liste.some((t) => t.addon_actif), pret: !!actifOk, actif: actifOk ? actifOk.code : null,
    adresse_complete: exp.manque.length === 0, adresse_manque: exp.manque,
  };
}

/** Shippo : enregistre / active / désactive / efface la clé. Activer Shippo désactive EasyPost (un seul transporteur actif). */
async function enregistrerShippo(gid, { token, actif, effacer }) {
  if (!(await autorise(gid, 'shippo'))) refusAddon('shippo');
  const row = await lireConfig(gid);
  let tokenChiffre = row ? row.shippo_token_chiffre : null;
  let mode = row ? row.shippo_mode : 'test';
  let provider = row ? row.provider_actif : null;
  if (effacer) { tokenChiffre = null; mode = 'test'; if (provider === 'shippo') provider = null; }
  else {
    if (typeof token === 'string' && token.trim()) {
      const t = token.trim();
      if (t.length > 200 || !TOKEN_RE.test(t)) refus('Clé Shippo invalide : elle doit commencer par « shippo_test_ » ou « shippo_live_ » (copiez-la en entier).');
      tokenChiffre = chiffrer(t);
      mode = t.startsWith('shippo_live_') ? 'production' : 'test';
    }
    if (actif === true) { if (!tokenChiffre) refus("Collez d'abord votre clé API Shippo."); provider = 'shippo'; }
    else if (actif === false && provider === 'shippo') provider = null;
  }
  await pool.query(
    `INSERT INTO boutique_etiquettes_config (gestionnaire_id, provider_actif, shippo_token_chiffre, shippo_mode, updated_at)
     VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET provider_actif = $2, shippo_token_chiffre = $3, shippo_mode = $4, updated_at = NOW()`,
    [gid, provider, tokenChiffre, mode]);
}

/** EasyPost : clés test (EZTK) et production (EZAK), mode actif, secret webhook. Activer EasyPost désactive Shippo. */
async function enregistrerEasyPost(gid, { cle, mode: modeDemande, actif, effacer, secret, effacerSecret }) {
  if (!(await autorise(gid, 'easypost'))) refusAddon('easypost');
  const row = await lireConfig(gid);
  let cleTest = row ? row.easypost_cle_test_chiffre : null;
  let cleProd = row ? row.easypost_cle_prod_chiffre : null;
  let mode = (row && row.easypost_mode) || 'test';
  let secretCh = row ? row.easypost_webhook_secret_chiffre : null;
  let provider = row ? row.provider_actif : null;
  if (effacer) { cleTest = null; cleProd = null; secretCh = null; mode = 'test'; if (provider === 'easypost') provider = null; }
  else {
    if (typeof cle === 'string' && cle.trim()) {
      const k = cle.trim();
      if (!EASYPOST_RE.test(k)) refus('Clé EasyPost invalide : elle doit commencer par « EZTK » (test) ou « EZAK » (production) — copiez-la en entier.');
      if (k.startsWith('EZAK')) { cleProd = chiffrer(k); mode = 'production'; } else { cleTest = chiffrer(k); mode = 'test'; }
    }
    if (modeDemande === 'test' || modeDemande === 'production') {
      if (!(modeDemande === 'production' ? cleProd : cleTest)) refus(`Aucune clé ${modeDemande === 'production' ? 'de production (EZAK…)' : 'de test (EZTK…)'} enregistrée : collez-la d'abord.`);
      mode = modeDemande;
    }
    if (typeof secret === 'string' && secret.trim()) {
      const sec = secret.trim();
      if (sec.length < 8 || sec.length > 200 || /\s/.test(sec)) refus('Secret webhook invalide : copiez-le tel quel depuis EasyPost (sans espaces).');
      secretCh = chiffrer(sec);
    }
    if (effacerSecret) secretCh = null;
    if (actif === true) { if (!(mode === 'production' ? cleProd : cleTest)) refus("Collez d'abord votre clé API EasyPost pour le mode choisi."); provider = 'easypost'; }
    else if (actif === false && provider === 'easypost') provider = null;
  }
  await pool.query(
    `INSERT INTO boutique_etiquettes_config (gestionnaire_id, provider_actif, easypost_cle_test_chiffre, easypost_cle_prod_chiffre, easypost_mode, easypost_webhook_secret_chiffre, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET provider_actif = $2, easypost_cle_test_chiffre = $3, easypost_cle_prod_chiffre = $4, easypost_mode = $5, easypost_webhook_secret_chiffre = $6, updated_at = NOW()`,
    [gid, provider, cleTest, cleProd, mode, secretCh]);
}

/** Transporteur ACTIF du gestionnaire avec sa clé déchiffrée (mode choisi pour EasyPost), ou null. */
async function configActive(gid) {
  const row = await lireConfig(gid);
  if (!row) return null;
  try {
    if (row.provider_actif === 'shippo' && row.shippo_token_chiffre) return { provider: 'shippo', token: dechiffrer(row.shippo_token_chiffre), mode: row.shippo_mode || 'test' };
    if (row.provider_actif === 'easypost') {
      const mode = row.easypost_mode || 'test';
      const ch = mode === 'production' ? row.easypost_cle_prod_chiffre : row.easypost_cle_test_chiffre;
      if (ch) return { provider: 'easypost', token: dechiffrer(ch), mode };
    }
  } catch (e) { return null; }
  return null;
}

// ── Commande, adresses, colis ───────────────────────────────────────────────

async function chargerCommande(gid, id) {
  const r = await pool.query(
    `SELECT c.*, a.prenom AS acheteur_prenom, a.nom AS acheteur_nom, a.email AS acheteur_email
       FROM boutique_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id AND a.gestionnaire_id = c.gestionnaire_id
      WHERE c.id = $1 AND c.gestionnaire_id = $2`, [id, gid]);
  return r.rows[0] || null;
}

function verifierExpediable(cmd) {
  if (!cmd) refus('Commande introuvable', 404);
  if (cmd.statut_paiement !== 'paye') refus("Cette commande n'est pas payée : impossible de créer une étiquette.", 409);
  if (cmd.statut === 'annulee' || cmd.statut === 'livree') refus('Cette commande ne peut plus être expédiée.', 409);
  if (cmd.etiquette_provider) refus('Une étiquette a déjà été achetée pour cette commande.', 409);
  if (cmd.statut !== 'confirmee' && cmd.statut !== 'expediee') refus("Cette commande n'est pas prête à être expédiée.", 409);
}

function adresseLivraison(cmd) {
  const a = cmd.adresse_livraison && typeof cmd.adresse_livraison === 'object' ? cmd.adresse_livraison : {};
  const nom = String(a.nom || [cmd.acheteur_prenom, cmd.acheteur_nom].filter(Boolean).join(' ') || '—').trim();
  const rue = [a.adresse1, a.adresse2].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
  return {
    nom, rue, ville: String(a.ville || '').trim(), province: String(a.province || '').trim(), codePostal: String(a.code_postal || '').trim().toUpperCase(),
    pays: paysISO(a.pays), telephone: String(a.telephone || '').trim() || undefined, email: cmd.acheteur_email || undefined,
  };
}

// Poids connu des articles (kg) : produits.poids × quantité (les lignes de commande ne gardent pas le poids)
async function poidsArticlesKg(gid, cmd) {
  const lignes = Array.isArray(cmd.articles) ? cmd.articles : [];
  const ids = [...new Set(lignes.map((l) => parseInt(l && l.produit_id, 10)).filter(Number.isInteger))];
  if (!ids.length) return 0;
  const poids = new Map((await pool.query('SELECT id, poids FROM produits WHERE gestionnaire_id = $1 AND id = ANY($2::int[])', [gid, ids])).rows.map((r) => [r.id, parseFloat(r.poids) || 0]));
  const total = lignes.reduce((s, l) => s + (poids.get(parseInt(l && l.produit_id, 10)) || 0) * (parseInt(l && l.quantite, 10) || 1), 0);
  return Math.round(total * 1000) / 1000;
}

const nombreOpt = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 && n < 1000 ? n : undefined; };

async function colisDe(gid, cmd, body) {
  const poidsKg = nombreOpt(body && body.poids_kg) || (await poidsArticlesKg(gid, cmd));
  if (!poidsKg || poidsKg <= 0) refus('Poids de la commande manquant ou nul. Entrez un poids manuellement pour continuer.');
  return { poidsKg, longueurCm: nombreOpt(body && body.longueur_cm), largeurCm: nombreOpt(body && body.largeur_cm), hauteurCm: nombreOpt(body && body.hauteur_cm) };
}

async function preparer(gid) {
  const cfg = await configActive(gid);
  if (!cfg && !(await Promise.all(Object.keys(TRANSPORTEURS).map((c) => autorise(gid, c)))).some(Boolean)) refus("Aucune option d'étiquettes d'expédition n'est activée pour votre boutique.", 403, { addon_inactif: true });
  if (!cfg) refus("Aucun transporteur actif. Ajoutez votre clé (Shippo ou EasyPost) dans Config générale → Étiquettes d'expédition.");
  if (!(await autorise(gid, cfg.provider))) refusAddon(cfg.provider);
  return { cfg, mod: TRANSPORTEURS[cfg.provider].charger() };
}

function erreurFournisseur(e) {
  if (e instanceof ErreurBoutique) return e;
  return new ErreurBoutique(e && e.message ? e.message : 'Erreur du transporteur', 502, e && e.diagnostic ? { diagnostic: e.diagnostic } : {});
}

// ── Poids affiché + tarifs + achat ──────────────────────────────────────────

/** Infos pour préremplir la fenêtre : poids connu (kg) et état de l'adresse d'expédition. */
async function apercu(gid, id) {
  const cmd = await chargerCommande(gid, id);
  if (!cmd) refus('Commande introuvable', 404);
  const exp = await adresseExpedition(gid);
  return { poids_kg: await poidsArticlesKg(gid, cmd), adresse_complete: exp.manque.length === 0, adresse_manque: exp.manque };
}

async function adressesOuErreur(gid, cmd) {
  const exp = await adresseExpedition(gid);
  if (exp.manque.length) refus(`L'adresse de votre boutique est incomplète (${exp.manque.join(', ')}) : complétez-la dans votre profil.`);
  const liv = adresseLivraison(cmd);
  if (!liv.rue || !liv.ville || !liv.codePostal) refus("L'adresse de livraison de l'acheteur est incomplète pour cette commande.");
  return { exp: exp.adresse, liv };
}

async function tarifs(gid, id, body) {
  const cmd = await chargerCommande(gid, id);
  verifierExpediable(cmd);
  const { cfg, mod } = await preparer(gid);
  const colis = await colisDe(gid, cmd, body);
  const { exp, liv } = await adressesOuErreur(gid, cmd);
  try {
    const r = await mod.obtenirTarifs(cfg, { adresseExpedition: exp, adresseLivraison: liv, colis });
    return { provider: cfg.provider, mode: cfg.mode, poids_kg: colis.poidsKg, tarifs: r.rates, diagnostic: r.diagnostic };
  } catch (e) { throw erreurFournisseur(e); }
}

/** Achète l'étiquette, puis passe la commande à « expédiée » avec suivi, lien de suivi et PDF. Un seul achat à la fois par commande. */
async function acheter(gid, id, body) {
  const rateId = body && typeof body.rate_id === 'string' ? body.rate_id : '';
  if (!rateId || rateId.length > 200) refus('rate_id manquant');
  const cl = await pool.connect();
  let verrou = false;
  try {
    verrou = (await cl.query('SELECT pg_try_advisory_lock(hashtext($1)) AS ok', [`bq-etiquette-${id}`])).rows[0].ok;
    if (!verrou) refus("Un achat d'étiquette est déjà en cours pour cette commande.", 409);
    const cmd = await chargerCommande(gid, id);
    verifierExpediable(cmd);
    const { cfg, mod } = await preparer(gid);
    let achat;
    try { achat = await mod.acheterEtiquette(cfg, { rateId, shipmentId: typeof body.shipment_id === 'string' ? body.shipment_id : undefined }); }
    catch (e) { throw erreurFournisseur(e); }

    const nom = String(typeof body.transporteur === 'string' && body.transporteur.trim() ? body.transporteur : TRANSPORTEURS[cfg.provider].nom).slice(0, 60);
    const suivi = achat.numeroSuivi ? String(achat.numeroSuivi).slice(0, 80) : null;
    const urlSuivi = httpSure(achat.urlSuivi);
    const urlEtiquette = httpSure(achat.urlEtiquette);
    const upd = await pool.query(
      `UPDATE boutique_commandes
          SET statut = 'expediee', numero_suivi = $1, transporteur_suivi = $2, url_suivi = $3, url_etiquette = $4,
              etiquette_provider = $7, etape_livraison = 'etiquette_creer', expediee_le = COALESCE(expediee_le, NOW()), updated_at = NOW()
        WHERE id = $5 AND gestionnaire_id = $6 AND statut IN ('confirmee','expediee') AND etiquette_provider IS NULL
        RETURNING id`,
      [suivi, nom, urlSuivi, urlEtiquette, id, gid, cfg.provider]);
    if (!upd.rowCount) {
      console.error(`[boutique_etiquettes] ÉTIQUETTE ACHETÉE mais commande ${id} (gestionnaire ${gid}) non mise à jour. Suivi : ${suivi}`);
      refus("L'étiquette a été achetée, mais la commande a changé d'état entre-temps. Actualisez la page ; le numéro de suivi est : " + (suivi || 'inconnu'), 409);
    }
    return { numero_suivi: suivi, url_suivi: urlSuivi, url_etiquette: urlEtiquette, transporteur: nom };
  } finally {
    if (verrou) { try { await cl.query('SELECT pg_advisory_unlock(hashtext($1))', [`bq-etiquette-${id}`]); } catch (e) { /* ignoré */ } }
    cl.release();
  }
}

// ── Suivi automatique ───────────────────────────────────────────────────────

function lireHistorique(brut) {
  try { const h = typeof brut === 'string' ? JSON.parse(brut) : brut; return Array.isArray(h) ? h : []; } catch (e) { return []; }
}

/** Applique un statut de suivi VÉRIFIÉ (ev) à la commande : étape, historique fusionné par source, livraison. */
async function appliquerSuivi(cmd, ev, source) {
  if (ETAPES_PROTEGEES.has(cmd.etape_livraison) || cmd.statut === 'annulee') return;
  const etape = ev.etapeLivraison;
  const anciens = lireHistorique(cmd.historique_suivi).filter((e) => e.source === source);
  const recus = (ev.historique || []).map((e) => ({
    date: e.dateEvenement, statut: e.description || e.statut || 'Mise à jour de suivi',
    description: [e.ville, e.province].filter(Boolean).join(', ') || e.sousStatut || '', etape: null, source,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const signe = (e) => (e ? `${e.date}|${e.statut}` : '');
  if (recus.length > 0 && etape) recus[0].etape = etape;
  const nouveau = recus.length === 0 || anciens.length === 0 || signe(recus[0]) !== signe(anciens[0]) || (!!etape && anciens[0].etape !== etape);
  const applique = !!etape && etape !== cmd.etape_livraison && nouveau;
  if (applique) await pool.query('UPDATE boutique_commandes SET etape_livraison = $1, updated_at = NOW() WHERE id = $2', [etape, cmd.id]);
  if (recus.length > 0) {
    const fusion = [...lireHistorique(cmd.historique_suivi).filter((e) => e.source !== source), ...recus]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await pool.query('UPDATE boutique_commandes SET historique_suivi = $1::jsonb WHERE id = $2', [JSON.stringify(fusion), cmd.id]);
  }
  if (applique && etape === 'livree' && cmd.statut !== 'livree') {
    await pool.query(`UPDATE boutique_commandes SET statut = 'livree', livree_le = NOW(), updated_at = NOW() WHERE id = $1 AND statut IN ('confirmee','expediee')`, [cmd.id]);
  }
  if (applique && etape !== 'livree' && cmd.statut === 'livree') {
    await pool.query(`UPDATE boutique_commandes SET statut = 'expediee', livree_le = NULL, updated_at = NOW() WHERE id = $1 AND statut = 'livree'`, [cmd.id]);
  }
}

const jeton = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** Webhook Shippo (track_updated). Le contenu n'est JAMAIS cru : il sert seulement à retrouver la commande. */
async function traiterWebhookShippo(payload) {
  const mod = TRANSPORTEURS.shippo.charger();
  const brut = mod.parserWebhook(payload);
  if (!brut || !brut.numeroSuivi) return { ignore: 'payload non reconnu' };
  const lignes = await pool.query(
    `SELECT id, statut, etape_livraison, historique_suivi, gestionnaire_id, transporteur_suivi, numero_suivi
       FROM boutique_commandes WHERE numero_suivi = $1 AND etiquette_provider = 'shippo'`, [String(brut.numeroSuivi).slice(0, 80)]);
  let traitees = 0;
  for (const cmd of lignes.rows) {
    if (ETAPES_PROTEGEES.has(cmd.etape_livraison) || cmd.statut === 'annulee') continue;
    if (!(await autorise(cmd.gestionnaire_id, 'shippo'))) continue;
    const cfg = await configActive(cmd.gestionnaire_id);                    // transporteur changé ou clé retirée : on ignore
    if (!cfg || cfg.provider !== 'shippo') continue;
    const candidats = [...new Set([jeton(cmd.transporteur_suivi), jeton(brut.transporteur)].filter(Boolean))];
    let verifie = null, derniereErreur = null;
    for (const carrier of candidats) {
      try { verifie = await mod.obtenirStatutTrackingVerifie({ token: cfg.token }, { carrier, trackingNumber: cmd.numero_suivi }); break; }
      catch (e) { derniereErreur = e; }
    }
    if (!verifie) { console.error(`[boutique_etiquettes] vérification Shippo échouée (commande ${cmd.id}) :`, derniereErreur && derniereErreur.message); continue; }
    await appliquerSuivi(cmd, verifie, 'shippo');
    traitees++;
  }
  return { traitees };
}

// ── Webhook EasyPost (signature HMAC propre à chaque gestionnaire) ───────────
// Reproduit Utils.validateWebhook() du SDK officiel @easypost/api (comme le MV) : normalisation NFKD du secret + correctif de sérialisation des poids entiers ("weight": 5 → 5.0).
// Retourne le JSON signé (issu des octets EXACTS qui ont servi à la signature) ou null.
function verifierSignatureEasyPost(rawBuffer, enTete, secret) {
  if (!enTete || !secret || !Buffer.isBuffer(rawBuffer)) return null;
  const corps = rawBuffer.toString('utf8').replace(/("weight":\s*)(\d+)(\s*)(?=,|\})/g, '$1$2.0');
  const attendue = `hmac-sha256-hex=${crypto.createHmac('sha256', Buffer.from(secret.normalize('NFKD'), 'utf8')).update(corps, 'utf8').digest('hex')}`;
  const recu = Buffer.from(String(enTete), 'utf8'); const att = Buffer.from(attendue, 'utf8');
  if (recu.length !== att.length || !crypto.timingSafeEqual(recu, att)) return null;
  try { return JSON.parse(corps); } catch (e) { return null; }
}

/** Webhook EasyPost (tracker.updated / tracker.created). Le contenu n'est cru QU'APRÈS vérification de la signature avec le secret du gestionnaire propriétaire de la commande. Sans secret : rejeté. */
async function traiterWebhookEasyPost(rawBuffer, enTeteSignature) {
  const mod = TRANSPORTEURS.easypost.charger();
  let brut;
  try { brut = mod.parserWebhook(JSON.parse(rawBuffer.toString('utf8'))); } catch (e) { return { ignore: 'JSON invalide' }; }
  if (!brut || !brut.numeroSuivi) return { ignore: 'payload non reconnu' };   // lecture NON fiable : sert seulement à retrouver la commande
  const lignes = await pool.query(
    `SELECT id, statut, etape_livraison, historique_suivi, gestionnaire_id, numero_suivi
       FROM boutique_commandes WHERE numero_suivi = $1 AND etiquette_provider = 'easypost'`, [String(brut.numeroSuivi).slice(0, 80)]);
  let traitees = 0, rejetees = 0;
  for (const cmd of lignes.rows) {
    if (ETAPES_PROTEGEES.has(cmd.etape_livraison) || cmd.statut === 'annulee') continue;
    if (!(await autorise(cmd.gestionnaire_id, 'easypost'))) continue;
    const cfg = await configActive(cmd.gestionnaire_id);                    // transporteur changé ou clé retirée : on ignore
    if (!cfg || cfg.provider !== 'easypost') continue;
    const row = await lireConfig(cmd.gestionnaire_id);
    let secret = null;
    try { secret = row && row.easypost_webhook_secret_chiffre ? dechiffrer(row.easypost_webhook_secret_chiffre) : null; } catch (e) { secret = null; }
    if (!secret) { rejetees++; console.log(`🔴 Webhook EasyPost boutique REJETÉ — aucun secret webhook configuré (commande ${cmd.id})`); continue; }
    const valide = verifierSignatureEasyPost(rawBuffer, enTeteSignature, secret);
    if (!valide) { rejetees++; console.log(`🔴 Webhook EasyPost boutique REJETÉ — signature invalide (commande ${cmd.id})`); continue; }
    const ev = mod.parserWebhook(valide);
    if (!ev || ev.numeroSuivi !== cmd.numero_suivi) continue;
    await appliquerSuivi(cmd, ev, 'easypost');
    traitees++;
  }
  return { traitees, rejetees };
}

module.exports = {
  TRANSPORTEURS, etatConfig, enregistrerShippo, enregistrerEasyPost, configActive, apercu, tarifs, acheter, appliquerSuivi, traiterWebhookShippo, traiterWebhookEasyPost, verifierSignatureEasyPost, lireHistorique,
};