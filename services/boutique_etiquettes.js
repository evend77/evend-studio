// CHEMIN : services/boutique_etiquettes.js
// e-Vend Studio — Add-on « Étiquettes Shippo » des templates boutique (solo) : clé du gestionnaire, tarifs, achat d'étiquette, suivi automatique.
// Reprend la logique du MV (services/studio_etiquettes.js, collaborateurs) pour UN gestionnaire qui vend lui-même ; aucun fichier MV n'est modifié.
// Le fournisseur (services/transporteurs/shippo.js) est utilisé tel quel.
//
// Modèle « bring your own token » : le gestionnaire colle SA clé Shippo ; elle est chiffrée (src/utils/chiffrement) dans boutique_etiquettes_config
// et n'est JAMAIS renvoyée au navigateur. L'étiquette est facturée sur SON compte Shippo ; l'expédition part de l'adresse de sa boutique (table gestionnaires).
// Remboursement d'une étiquette achetée par erreur : directement dans le tableau de bord Shippo (pas dans l'application).
// Suivi automatique : le webhook ne sert qu'à savoir QUELLE commande vérifier ; le vrai statut est redemandé à Shippo avec la clé du gestionnaire.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');
const { chiffrer, dechiffrer } = require('../src/utils/chiffrement');

const CODE_ADDON = 'etiquette_shippo';
const WEBHOOK_URL = 'https://e-vendstudio.ca/api/boutique/etiquettes/webhook/shippo';
const TOKEN_RE = /^shippo_(test|live)_[A-Za-z0-9]+$/;
const ETAPES_PROTEGEES = new Set(['annulee', 'refusee']);

const transporteur = { charger: () => require('./transporteurs/shippo') };   // remplaçable dans les tests
const autorise = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);
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

/** État pour l'écran de configuration : JAMAIS de clé, seulement « configuré oui/non ». */
async function etatConfig(gid) {
  const [row, addon, exp] = await Promise.all([lireConfig(gid), autorise(gid), adresseExpedition(gid)]);
  const configure = !!(row && row.shippo_token_chiffre);
  const actif = !!(row && row.provider_actif === 'shippo');
  return {
    addon_actif: addon, configure, actif, pret: addon && configure && actif,
    mode: (row && row.shippo_mode) || 'test', webhook_url: WEBHOOK_URL,
    adresse_complete: exp.manque.length === 0, adresse_manque: exp.manque,
  };
}

/** Enregistre / active / désactive / efface la clé Shippo du gestionnaire. */
async function enregistrerShippo(gid, { token, actif, effacer }) {
  if (!(await autorise(gid))) refus("L'option « Étiquettes Shippo » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
  const row = await lireConfig(gid);
  let tokenChiffre = row ? row.shippo_token_chiffre : null;
  let mode = row ? row.shippo_mode : 'test';
  let provider = row ? row.provider_actif : null;
  if (effacer) { tokenChiffre = null; mode = 'test'; provider = null; }
  else {
    if (typeof token === 'string' && token.trim()) {
      const t = token.trim();
      if (t.length > 200 || !TOKEN_RE.test(t)) refus('Clé Shippo invalide : elle doit commencer par « shippo_test_ » ou « shippo_live_ » (copiez-la en entier).');
      tokenChiffre = chiffrer(t);
      mode = t.startsWith('shippo_live_') ? 'production' : 'test';
    }
    if (actif === true) { if (!tokenChiffre) refus("Collez d'abord votre clé API Shippo."); provider = 'shippo'; }
    else if (actif === false) provider = null;
  }
  await pool.query(
    `INSERT INTO boutique_etiquettes_config (gestionnaire_id, provider_actif, shippo_token_chiffre, shippo_mode, updated_at)
     VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET provider_actif = $2, shippo_token_chiffre = $3, shippo_mode = $4, updated_at = NOW()`,
    [gid, provider, tokenChiffre, mode]);
}

async function configActive(gid) {
  const row = await lireConfig(gid);
  if (!row || row.provider_actif !== 'shippo' || !row.shippo_token_chiffre) return null;
  let token = null;
  try { token = dechiffrer(row.shippo_token_chiffre); } catch (e) { return null; }
  return token ? { provider: 'shippo', token, mode: row.shippo_mode || 'test' } : null;
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
  if (!(await autorise(gid))) refus("L'option « Étiquettes Shippo » n'est pas activée pour votre boutique.", 403, { addon_inactif: true });
  const cfg = await configActive(gid);
  if (!cfg) refus("Aucun transporteur actif. Ajoutez votre clé Shippo dans la page « Étiquettes d'expédition ».");
  return { cfg, mod: transporteur.charger() };
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
    return { provider: 'shippo', mode: cfg.mode, poids_kg: colis.poidsKg, tarifs: r.rates, diagnostic: r.diagnostic };
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
    try { achat = await mod.acheterEtiquette(cfg, { rateId, shipmentId: body.shipment_id }); }
    catch (e) { throw erreurFournisseur(e); }

    const nom = String(typeof body.transporteur === 'string' && body.transporteur.trim() ? body.transporteur : 'Shippo').slice(0, 60);
    const suivi = achat.numeroSuivi ? String(achat.numeroSuivi).slice(0, 80) : null;
    const urlSuivi = httpSure(achat.urlSuivi);
    const urlEtiquette = httpSure(achat.urlEtiquette);
    const upd = await pool.query(
      `UPDATE boutique_commandes
          SET statut = 'expediee', numero_suivi = $1, transporteur_suivi = $2, url_suivi = $3, url_etiquette = $4,
              etiquette_provider = 'shippo', etape_livraison = 'etiquette_creer', expediee_le = COALESCE(expediee_le, NOW()), updated_at = NOW()
        WHERE id = $5 AND gestionnaire_id = $6 AND statut IN ('confirmee','expediee') AND etiquette_provider IS NULL
        RETURNING id`,
      [suivi, nom, urlSuivi, urlEtiquette, id, gid]);
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
  const mod = transporteur.charger();
  const brut = mod.parserWebhook(payload);
  if (!brut || !brut.numeroSuivi) return { ignore: 'payload non reconnu' };
  const lignes = await pool.query(
    `SELECT id, statut, etape_livraison, historique_suivi, gestionnaire_id, transporteur_suivi, numero_suivi
       FROM boutique_commandes WHERE numero_suivi = $1 AND etiquette_provider = 'shippo'`, [String(brut.numeroSuivi).slice(0, 80)]);
  let traitees = 0;
  for (const cmd of lignes.rows) {
    if (ETAPES_PROTEGEES.has(cmd.etape_livraison) || cmd.statut === 'annulee') continue;
    if (!(await autorise(cmd.gestionnaire_id))) continue;
    const cfg = await configActive(cmd.gestionnaire_id);                    // transporteur changé ou clé retirée : on ignore
    if (!cfg) continue;
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

module.exports = {
  CODE_ADDON, WEBHOOK_URL, transporteur, etatConfig, enregistrerShippo, configActive, apercu, tarifs, acheter, appliquerSuivi, traiterWebhookShippo, lireHistorique,
};