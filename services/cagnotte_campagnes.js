// CHEMIN : services/cagnotte_campagnes.js
// e-Vend Studio — Cagnotte : une campagne = un prix FIXE payé par le gestionnaire à Studio (sur le Stripe de l'admin),
// durée maximale réglable (90 jours par défaut). Sans paiement, la cagnotte ne s'ouvre pas aux dons.
// Fin de campagne sans aucun don : remboursement partiel (pourcentage réglé dans la page admin).

'use strict';

const pool = require('../db');
const schema = require('./cagnotte_schema');

const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
const cents = (n) => Math.round(Number(n) * 100 + 1e-7);
const JOUR = 86400000;

class ErreurCagnotte extends Error {
  constructor(message, statut = 400) { super(message); this.statut = statut; }
}
const refus = (m, s) => { throw new ErreurCagnotte(m, s); };

// ── Réglages (page admin) ─────────────────────────────────────────────────────
async function reglages() {
  await schema.pret();
  const r = (await pool.query('SELECT * FROM cagnotte_reglages WHERE id = 1')).rows[0];
  let paliers = r.paliers; if (typeof paliers === 'string') paliers = JSON.parse(paliers);
  let taxes = r.taxes; if (typeof taxes === 'string') taxes = JSON.parse(taxes);
  let num = r.numeros_taxes; if (typeof num === 'string') num = JSON.parse(num);
  return {
    paliers: (paliers || []).map((p) => ({ id: String(p.id), nom: String(p.nom || ''), objectif_max: p.objectif_max === null || p.objectif_max === undefined || p.objectif_max === '' ? null : Number(p.objectif_max), prix: Number(p.prix) })),
    taxes: taxes || {}, numeros_taxes: num || {},
    duree_max_jours: r.duree_max_jours, remboursement_actif: r.remboursement_actif, remboursement_pct: Number(r.remboursement_pct),
    remboursement_auto: r.remboursement_auto, don_min: Number(r.don_min), don_max: Number(r.don_max), devise: r.devise,
  };
}

// Palier = le plus petit dont l'objectif maximum couvre l'objectif demandé (objectif_max vide = illimité)
function choisirPalier(rg, objectif) {
  const tries = [...rg.paliers].sort((a, b) => (a.objectif_max === null ? Infinity : a.objectif_max) - (b.objectif_max === null ? Infinity : b.objectif_max));
  return tries.find((p) => p.objectif_max === null || objectif <= p.objectif_max) || null;
}

function calculerTaxes(rg, prixC, province) {
  const t = rg.taxes[province] || { tps: 0, tvq: 0, tvh: 0, label: 'Taxes' };
  const tps = Math.round(prixC * (Number(t.tps) || 0) / 100), tvq = Math.round(prixC * (Number(t.tvq) || 0) / 100), tvh = Math.round(prixC * (Number(t.tvh) || 0) / 100);
  return { tpsC: tps, tvqC: tvq, tvhC: tvh, totalC: tps + tvq + tvh, label: t.label || 'Taxes' };
}

function devis(rg, objectif, province) {
  const palier = choisirPalier(rg, objectif);
  if (!palier) refus("Aucun palier de prix ne couvre cet objectif. Contactez l'administrateur.", 409);
  const prixC = cents(palier.prix);
  const tx = calculerTaxes(rg, prixC, province);
  return { palier, prixC, taxes: tx, totalC: prixC + tx.totalC };
}

// ── Site / configuration de la cagnotte ──────────────────────────────────────
async function siteDuGestionnaire(gid) {
  const r = await pool.query('SELECT id, slug, domaine_custom, config FROM sites WHERE gestionnaire_id = $1 ORDER BY id LIMIT 1', [gid]);
  return r.rows[0] || null;
}
// La configuration de la cagnotte est rangée dans sites.config.cagnotte (comme les autres templates) ; les anciennes clés à plat restent lues.
function configSite(site) {
  let c = site && site.config; if (typeof c === 'string') { try { c = JSON.parse(c); } catch (e) { c = {}; } }
  c = c && typeof c === 'object' ? c : {};
  return c.cagnotte && typeof c.cagnotte === 'object' ? { ...c, ...c.cagnotte } : c;
}
// Titre du texte d'exemple du template : on refuse de publier une campagne qui n'a pas été personnalisée
const TITRES_EXEMPLE = ['Rénover la patinoire du quartier', 'Un nouveau refuge pour les animaux du quartier'];
const TITRE_EXEMPLE = TITRES_EXEMPLE[0];
const estExemple = (cfg) => TITRES_EXEMPLE.includes(String(cfg.nomCampagne || '').trim());
async function urlDuSite(site) {
  const d = site && (site.domaine_custom || (site.slug ? `${site.slug}.e-vendstudio.ca` : ''));
  return d ? `https://${d}` : null;
}

// ── Clé Stripe de la PLATEFORME (admin) : sert uniquement à encaisser le prix de publication ──
function dechiffrerAdmin(v) {
  if (!v) return null;
  if (String(v).startsWith('sk_')) return v;
  for (const chemin of ['../src/utils/chiffrement', './chiffrement']) {
    try { const d = require(chemin).dechiffrer(v); if (d && String(d).startsWith('sk_')) return d; } catch (e) { /* essaie l'autre */ }
  }
  return null;
}
async function stripePlateforme() {
  const r = (await pool.query('SELECT * FROM configuration_stripe_admin WHERE id = 1')).rows[0];
  if (!r) throw new ErreurCagnotte('Le paiement par carte de Studio est indisponible pour le moment.', 503);
  const cle = dechiffrerAdmin(r.sandbox ? r.dev_secret_key : r.prod_secret_key);
  if (!cle) throw new ErreurCagnotte('Le paiement par carte de Studio est indisponible pour le moment.', 503);
  return { stripe: require('stripe')(cle), env: r.sandbox ? 'dev' : 'prod' };
}

// ── État d'une campagne (gestionnaire) ───────────────────────────────────────
async function derniereCampagne(siteId, db) {
  return (await (db || pool).query('SELECT * FROM cagnotte_campagnes WHERE site_id = $1 ORDER BY id DESC LIMIT 1', [siteId])).rows[0] || null;
}
async function statsDons(campagneId) {
  const r = await pool.query(`SELECT COUNT(*)::int AS nb, COALESCE(SUM(montant),0)::numeric(12,2) AS total FROM dons WHERE campagne_id = $1 AND statut = 'complete'`, [campagneId]);
  return { nb: r.rows[0].nb, total: Number(r.rows[0].total) };
}

async function etat(gid) {
  await schema.pret();
  const rg = await reglages();
  const site = await siteDuGestionnaire(gid);
  const out = { site_id: site ? site.id : null, provinces: PROVINCES, paliers: rg.paliers, duree_max_jours: rg.duree_max_jours,
    remboursement: { actif: rg.remboursement_actif, pct: rg.remboursement_pct }, taxes: rg.taxes, devise: rg.devise, campagne: null, apercu: null, problemes: [] };
  if (!site) { out.problemes.push("Aucun site trouvé pour ce compte."); return out; }
  const cfg = configSite(site);
  const objectif = Number(cfg.objectifMontant) || 0;
  out.objectif = objectif;
  const c = await derniereCampagne(site.id);
  if (c) {
    const s = c.statut === 'publiee' || c.statut === 'terminee' ? await statsDons(c.id) : { nb: 0, total: 0 };
    out.campagne = { id: c.id, statut: c.statut, palier_nom: c.palier_nom, prix: Number(c.prix), total: Number(c.total), publiee_le: c.publiee_le, fin_le: c.fin_le, terminee_le: c.terminee_le,
      raison_fin: c.raison_fin, remb_statut: c.remb_statut, remb_montant: c.remb_montant === null ? null : Number(c.remb_montant), nb_dons: s.nb, total_dons: s.total };
  }
  const paiement = require('./cagnotte_paiement');
  const modes = paiement.modesDisponibles(await paiement.config(gid));
  out.modes = { stripe: modes.stripe, paypal: modes.paypal, env: modes.env };
  if (!cfg.nomCampagne || !String(cfg.nomCampagne).trim()) out.problemes.push('Donnez un titre à votre campagne (menu « Ma campagne »).');
  else if (estExemple(cfg)) out.problemes.push("Remplacez le texte d'exemple par votre propre campagne (menu « Ma campagne »).");
  if (!(objectif > 0)) out.problemes.push("Indiquez l'objectif en dollars de votre campagne.");
  if (!modes.stripe && !modes.paypal) out.problemes.push('Branchez Stripe et/ou PayPal (onglet « Paiements ») pour pouvoir recevoir les dons.');
  if (objectif > 0) {
    try { const d = devis(rg, objectif, 'QC'); out.apercu = { palier: d.palier, prix: d.prixC / 100 }; } catch (e) { out.problemes.push(e.message); }
  }
  return out;
}

// ── Paiement du prix de publication (Stripe de l'admin) ──────────────────────
async function creerPaiementPublication(gid, province, urlRetour) {
  await schema.pret();
  if (!PROVINCES.includes(province)) refus('Choisissez la province pour le calcul des taxes.');
  const rg = await reglages();
  const site = await siteDuGestionnaire(gid);
  if (!site) refus('Aucun site trouvé pour ce compte.', 404);
  const cfg = configSite(site);
  const objectif = Number(cfg.objectifMontant) || 0;
  if (!(objectif > 0)) refus("Indiquez d'abord l'objectif de votre campagne.");
  if (!cfg.nomCampagne || !String(cfg.nomCampagne).trim()) refus("Donnez d'abord un titre à votre campagne.");
  if (estExemple(cfg)) refus("Remplacez d'abord le texte d'exemple par votre propre campagne.");
  const paiement = require('./cagnotte_paiement');
  const modes = paiement.modesDisponibles(await paiement.config(gid));
  if (!modes.stripe && !modes.paypal) refus("Branchez d'abord Stripe et/ou PayPal : sans cela, personne ne pourrait vous envoyer de dons.", 409);

  const encours = await derniereCampagne(site.id);
  if (encours && encours.statut === 'publiee' && new Date(encours.fin_le).getTime() > Date.now()) refus('Une campagne est déjà ouverte sur ce site.', 409);

  // Date de fin choisie par le gestionnaire (jamais au-delà du maximum)
  let finPrevue = null;
  if (cfg.dateFinCampagne) {
    const d = new Date(cfg.dateFinCampagne);
    if (Number.isNaN(d.getTime())) refus('La date de fin de la campagne est invalide.');
    if (d.getTime() <= Date.now() + JOUR) refus('La date de fin doit être dans plus de 24 heures.');
    finPrevue = d;
  }
  const dv = devis(rg, objectif, province);
  if (dv.totalC < 50) refus('Le montant est trop bas pour un paiement en ligne.', 409);
  // Retour sur Studio : l'adresse que le gestionnaire utilise en ce moment (sinon FRONTEND_URL)
  const urlBase = String(urlRetour || process.env.FRONTEND_URL || 'https://api.e-vend.ca').replace(/\/+$/, '');
  const { stripe, env } = await stripePlateforme();
  const devise = rg.devise.toLowerCase();

  // Une seule demande de paiement non payée à la fois : les anciennes sont annulées
  await pool.query(`UPDATE cagnotte_campagnes SET statut = 'annulee', updated_at = NOW() WHERE site_id = $1 AND statut = 'en_attente_paiement'`, [site.id]);
  const ins = await pool.query(
    `INSERT INTO cagnotte_campagnes (site_id, gestionnaire_id, palier_id, palier_nom, objectif, prix, taxes, total, devise, province, statut, duree_max_jours, fin_prevue, stripe_env)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'en_attente_paiement',$11,$12,$13) RETURNING id`,
    [site.id, gid, dv.palier.id, dv.palier.nom, objectif, dv.prixC / 100, JSON.stringify({ tps: dv.taxes.tpsC / 100, tvq: dv.taxes.tvqC / 100, tvh: dv.taxes.tvhC / 100, label: dv.taxes.label, province }),
     dv.totalC / 100, rg.devise, province, rg.duree_max_jours, finPrevue, env]);
  const campagneId = ins.rows[0].id;

  const items = [{ quantity: 1, price_data: { currency: devise, unit_amount: dv.prixC, product_data: { name: `Publication de campagne — ${dv.palier.nom}`.slice(0, 120), description: (`Cagnotte ouverte jusqu'à ${rg.duree_max_jours} jours. Aucune commission sur vos dons.` + (rg.numeros_taxes.tps ? ` TPS n° ${rg.numeros_taxes.tps}.` : '') + (rg.numeros_taxes.tvq ? ` TVQ n° ${rg.numeros_taxes.tvq}.` : '')).slice(0, 300) } } }];
  if (dv.taxes.totalC > 0) items.push({ quantity: 1, price_data: { currency: devise, unit_amount: dv.taxes.totalC, product_data: { name: `Taxes (${dv.taxes.label})` } } });
  const meta = { type: 'cagnotte_publication', campagne_id: String(campagneId), gestionnaire_id: String(gid), site_id: String(site.id) };
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', line_items: items, metadata: meta, payment_intent_data: { metadata: meta },
      expires_at: Math.floor(Date.now() / 1000) + 2 * 3600,
      success_url: `${urlBase}/?cagnotte=paye&campagne=${campagneId}`, cancel_url: `${urlBase}/?cagnotte=annule&campagne=${campagneId}`,
    });
    await pool.query('UPDATE cagnotte_campagnes SET stripe_session_id = $1, updated_at = NOW() WHERE id = $2', [session.id, campagneId]);
    return { campagne_id: campagneId, checkout_url: session.url, prix: dv.prixC / 100, taxes: dv.taxes.totalC / 100, total: dv.totalC / 100 };
  } catch (e) {
    await pool.query(`UPDATE cagnotte_campagnes SET statut = 'annulee', anomalie = $2, updated_at = NOW() WHERE id = $1`, [campagneId, String(e.message).slice(0, 300)]);
    console.error('❌ [cagnotte] session de publication :', e.message);
    throw new ErreurCagnotte("Le paiement n'a pas pu être démarré. Réessayez dans un instant.", 502);
  }
}

// Le paiement du prix de publication est confirmé (retour du gestionnaire ou balayage) → la campagne s'ouvre (idempotent)
async function confirmerPublication(session) {
  const id = parseInt(session.metadata && session.metadata.campagne_id, 10);
  if (!Number.isInteger(id)) return { ignore: true };
  if (session.payment_status && session.payment_status !== 'paid') return { attente: true };
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || null;
  const r = await pool.query(
    `UPDATE cagnotte_campagnes
        SET statut = 'publiee', publiee_le = NOW(), stripe_payment_intent = $2,
            fin_le = LEAST(NOW() + (duree_max_jours || ' days')::interval, COALESCE(fin_prevue, NOW() + (duree_max_jours || ' days')::interval)),
            anomalie = CASE WHEN ROUND(total * 100) = $3 AND UPPER(devise) = UPPER($4) THEN NULL
                            ELSE 'Montant reçu ' || ($3 / 100.0)::text || ' ' || UPPER($4) || ' différent du total attendu ' || total::text END,
            updated_at = NOW()
      WHERE id = $1 AND stripe_session_id = $5 AND statut IN ('en_attente_paiement','annulee') RETURNING id`,
    [id, pi, Number(session.amount_total || 0), String(session.currency || ''), session.id]);
  if (r.rows.length) console.log(`✅ [cagnotte] campagne #${id} publiée`);
  return { publiee: r.rows.length > 0 };
}

// Vérification SANS webhook : on interroge Stripe directement (clé de la plateforme) pour savoir si la session est payée.
// Appelée au retour du gestionnaire sur Studio et, au besoin, par le balayage (s'il a fermé l'onglet après avoir payé).
async function verifierSession(c) {
  if (!c || !c.stripe_session_id || !['en_attente_paiement', 'annulee'].includes(c.statut)) return { aucune: true };
  const { stripe } = await stripePlateforme();
  const session = await stripe.checkout.sessions.retrieve(c.stripe_session_id);
  if (!session || session.payment_status !== 'paid') return { paye: false };
  // metadata de la session = celle que NOUS avons créée ; on vérifie qu'elle correspond à cette campagne
  if (!session.metadata || String(session.metadata.campagne_id) !== String(c.id)) return { paye: false };
  const r = await confirmerPublication(session);
  return { paye: true, ...r };
}
async function verifierPaiement(gid) {
  await schema.pret();
  const site = await siteDuGestionnaire(gid);
  if (!site) refus('Aucun site trouvé.', 404);
  const c = await derniereCampagne(site.id);
  if (!c) return { aucune: true };
  return verifierSession(c);
}

// ── Fin de campagne + remboursement partiel si aucun don ─────────────────────
async function rembourser(campagneId, { pct, forcer = false } = {}) {
  const rg = await reglages();
  const c = (await pool.query('SELECT * FROM cagnotte_campagnes WHERE id = $1', [campagneId])).rows[0];
  if (!c) refus('Campagne introuvable.', 404);
  if (!c.stripe_payment_intent) refus('Aucun paiement à rembourser pour cette campagne.', 409);
  if (c.remb_statut === 'fait') return { deja: true };
  const p = pct === undefined || pct === null ? rg.remboursement_pct : Number(pct);
  if (!(p > 0 && p <= 100)) refus('Pourcentage invalide.');
  const montantC = Math.floor(cents(c.total) * p / 100);
  if (montantC < 1) refus('Montant à rembourser trop bas.');
  const verrou = await pool.query(`UPDATE cagnotte_campagnes SET remb_statut = 'en_cours', updated_at = NOW() WHERE id = $1 AND remb_statut IN ('aucun','a_faire','echec') RETURNING id`, [campagneId]);
  if (!verrou.rows.length) return { deja: true };
  try {
    const { stripe } = await stripePlateforme();
    const rf = await stripe.refunds.create({ payment_intent: c.stripe_payment_intent, amount: montantC, metadata: { type: 'cagnotte_remboursement', campagne_id: String(campagneId) } }, { idempotencyKey: `cagnotte-remb-${campagneId}` });
    await pool.query(`UPDATE cagnotte_campagnes SET remb_statut = 'fait', remb_montant = $2, remb_stripe_id = $3, remb_erreur = NULL, remb_le = NOW(), updated_at = NOW() WHERE id = $1`, [campagneId, montantC / 100, rf.id]);
    console.log(`💸 [cagnotte] campagne #${campagneId} : remboursement ${(montantC / 100).toFixed(2)} $ (${p} %)`);
    return { fait: true, montant: montantC / 100 };
  } catch (e) {
    await pool.query(`UPDATE cagnotte_campagnes SET remb_statut = 'echec', remb_erreur = $2, updated_at = NOW() WHERE id = $1`, [campagneId, String(e.message).slice(0, 300)]);
    console.error(`❌ [cagnotte] remboursement campagne #${campagneId} :`, e.message);
    throw e instanceof ErreurCagnotte ? e : new ErreurCagnotte(`Remboursement refusé par Stripe : ${e.message}`, 502);
  }
}

async function terminer(campagneId, raison) {
  const r = await pool.query(`UPDATE cagnotte_campagnes SET statut = 'terminee', terminee_le = NOW(), raison_fin = $2, updated_at = NOW() WHERE id = $1 AND statut = 'publiee' RETURNING id`, [campagneId, raison]);
  if (!r.rows.length) return { deja: true };
  const s = await statsDons(campagneId);
  await pool.query('UPDATE cagnotte_campagnes SET nb_dons_final = $2, total_dons_final = $3 WHERE id = $1', [campagneId, s.nb, s.total]);
  const rg = await reglages();
  if (s.nb === 0 && rg.remboursement_actif) {
    if (rg.remboursement_auto) { try { await rembourser(campagneId); } catch (e) { /* déjà noté : état « echec », l'admin peut relancer */ } }
    else await pool.query(`UPDATE cagnotte_campagnes SET remb_statut = 'a_faire' WHERE id = $1 AND remb_statut = 'aucun'`, [campagneId]);
  }
  return { terminee: true, nb: s.nb };
}

async function fermerParGestionnaire(gid) {
  const site = await siteDuGestionnaire(gid);
  if (!site) refus('Aucun site trouvé.', 404);
  const c = await derniereCampagne(site.id);
  if (!c || c.statut !== 'publiee') refus("Aucune campagne ouverte à fermer.", 409);
  return terminer(c.id, 'fermee_par_gestionnaire');
}

// Toutes les 10 minutes : ferme les campagnes arrivées à échéance, annule les paiements jamais faits
async function balayer() {
  try {
    await schema.pret();
    // Paiements faits mais jamais confirmés (onglet fermé avant le retour sur Studio) : on interroge Stripe
    const attente = await pool.query(`SELECT * FROM cagnotte_campagnes WHERE statut = 'en_attente_paiement' AND stripe_session_id IS NOT NULL AND created_at > NOW() - INTERVAL '3 hours'`);
    for (const c of attente.rows) { try { await verifierSession(c); } catch (e) { console.error('[cagnotte] vérification', c.id, e.message); } }
    const fin = await pool.query(`SELECT id FROM cagnotte_campagnes WHERE statut = 'publiee' AND fin_le <= NOW()`);
    for (const c of fin.rows) { try { await terminer(c.id, 'echeance'); } catch (e) { console.error('[cagnotte] fermeture', c.id, e.message); } }
    await pool.query(`UPDATE cagnotte_campagnes SET statut = 'annulee', updated_at = NOW() WHERE statut = 'en_attente_paiement' AND created_at < NOW() - INTERVAL '3 hours'`);
  } catch (e) { console.error('[cagnotte] balayage :', e.message); }
}
function demarrerBalayage() {
  setTimeout(balayer, 20000);
  setInterval(balayer, 10 * 60 * 1000).unref();
}

// ── Vue publique (le site affiche la barre de progression et ouvre/ferme le bouton « Faire un don ») ──
async function etatPublic(siteId) {
  await schema.pret();
  const site = (await pool.query('SELECT id, gestionnaire_id, config FROM sites WHERE id = $1', [siteId])).rows[0];
  if (!site) return null;
  const rg = await reglages();
  const c = await derniereCampagne(site.id);
  const cfg = configSite(site);
  const paiement = require('./cagnotte_paiement');
  const modes = paiement.modesDisponibles(await paiement.config(site.gestionnaire_id));
  let statut = 'non_publiee';
  if (c && c.statut === 'publiee') statut = new Date(c.fin_le).getTime() > Date.now() ? 'publiee' : 'terminee';
  else if (c && c.statut === 'terminee') statut = 'terminee';
  const ouvert = statut === 'publiee' && (modes.stripe || modes.paypal);
  let objectif = Number(cfg.objectifMontant) || null;
  const pal = c ? rg.paliers.find((p) => p.id === c.palier_id) : null;
  if (pal && pal.objectif_max !== null && objectif && objectif > pal.objectif_max) objectif = pal.objectif_max;
  const out = { statut, ouvert, fin_le: c && c.fin_le ? c.fin_le : null, objectif, modes: { stripe: modes.stripe, paypal: modes.paypal },
    don_min: rg.don_min, don_max: rg.don_max, devise: rg.devise, dons: [], total: '0.00', count: 0, campagne_id: c ? c.id : null };
  if (c && (c.statut === 'publiee' || c.statut === 'terminee')) {
    const s = await statsDons(c.id);
    const l = await pool.query(
      `SELECT id, CASE WHEN anonyme THEN 'Anonyme' ELSE nom_donateur END AS nom_donateur, montant, message, created_at
         FROM dons WHERE campagne_id = $1 AND statut = 'complete' ORDER BY created_at DESC LIMIT 50`, [c.id]);
    out.dons = l.rows; out.total = s.total.toFixed(2); out.count = s.nb;
  }
  return out;
}

module.exports = {
  ErreurCagnotte, PROVINCES, reglages, choisirPalier, calculerTaxes, devis, siteDuGestionnaire, configSite, urlDuSite, derniereCampagne,
  etat, creerPaiementPublication, confirmerPublication, verifierPaiement, rembourser, terminer, fermerParGestionnaire, balayer, demarrerBalayage, etatPublic, statsDons, stripePlateforme,
};