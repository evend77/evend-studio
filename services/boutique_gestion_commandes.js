// CHEMIN : services/boutique_gestion_commandes.js
// e-Vend Studio — Gestion des commandes par le gestionnaire (templates boutique, solo) : liste, expédition, remboursements, paiements reçus.
// Remboursements faits sur SON Stripe / SON PayPal (jamais celui de l'admin).

'use strict';

const pool = require('../db');
const paiement = require('./boutique_paiement');
const C = require('./boutique_commandes');

const { ErreurCommande } = C;
const refus = (m, s) => { throw new ErreurCommande(m, s); };
const cents = (n) => Math.round(Number(n) * 100 + 1e-7);

const FILTRES = {
  a_traiter: `c.statut_paiement = 'paye' AND c.statut = 'confirmee'`,
  expediees: `c.statut = 'expediee'`,
  livrees: `c.statut = 'livree'`,
  annulees: `c.statut = 'annulee'`,
  attente: `c.statut_paiement = 'en_attente' AND c.statut <> 'annulee'`,
  toutes: 'TRUE',
};

async function lister(gid, { filtre = 'toutes', q = '', page = 1, limite = 25 } = {}) {
  const f = FILTRES[filtre] || FILTRES.toutes;
  const lim = Math.min(100, Math.max(1, parseInt(limite, 10) || 25));
  const off = (Math.max(1, parseInt(page, 10) || 1) - 1) * lim;
  const params = [gid];
  let rech = '';
  const terme = String(q || '').trim().slice(0, 80);
  if (terme) { params.push(`%${terme.replace(/[%_]/g, '')}%`); rech = `AND (c.numero_commande ILIKE $2 OR c.adresse_livraison->>'nom' ILIKE $2 OR a.email ILIKE $2)`; }
  const base = `FROM boutique_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id AND a.gestionnaire_id = c.gestionnaire_id WHERE c.gestionnaire_id = $1 AND (${f}) ${rech}`;
  const total = (await pool.query(`SELECT COUNT(*)::int n ${base}`, params)).rows[0].n;
  const r = await pool.query(
    `SELECT c.id, c.numero_commande, c.statut, c.statut_paiement, c.mode_paiement, c.devise, c.total, c.rembourse, c.created_at, c.paye_le, c.anomalie,
            jsonb_array_length(c.articles) AS nb_lignes, c.adresse_livraison->>'nom' AS nom_livraison, a.email AS acheteur_email
       ${base} ORDER BY c.created_at DESC LIMIT ${lim} OFFSET ${off}`, params);
  const cr = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE statut_paiement = 'paye' AND statut = 'confirmee')::int AS a_traiter,
            COUNT(*) FILTER (WHERE statut = 'expediee')::int AS expediees, COUNT(*) FILTER (WHERE statut = 'livree')::int AS livrees,
            COUNT(*) FILTER (WHERE statut = 'annulee')::int AS annulees, COUNT(*) FILTER (WHERE statut_paiement = 'en_attente' AND statut <> 'annulee')::int AS attente,
            COUNT(*)::int AS toutes FROM boutique_commandes WHERE gestionnaire_id = $1`, [gid]);
  return { commandes: r.rows, total, page: Math.floor(off / lim) + 1, limite: lim, compteurs: cr.rows[0] };
}

async function detail(gid, id) {
  const r = await pool.query(
    `SELECT c.*, a.email AS acheteur_email, a.prenom AS acheteur_prenom, a.nom AS acheteur_nom
       FROM boutique_commandes c LEFT JOIN marketplace_acheteurs a ON a.id = c.acheteur_id AND a.gestionnaire_id = c.gestionnaire_id
      WHERE c.id = $1 AND c.gestionnaire_id = $2`, [id, gid]);
  if (!r.rows[0]) refus('Commande introuvable.', 404);
  const { stripe_session_id, stripe_payment_intent, paypal_order_id, paypal_capture_id, ...c } = r.rows[0];
  return { ...c, reference_paiement: c.mode_paiement === 'stripe' ? stripe_payment_intent : paypal_capture_id };
}

async function changerStatut(gid, id, { statut, numero_suivi, transporteur }) {
  if (statut !== 'expediee' && statut !== 'livree') refus('Statut invalide.');
  const c = (await pool.query('SELECT statut, statut_paiement FROM boutique_commandes WHERE id = $1 AND gestionnaire_id = $2', [id, gid])).rows[0];
  if (!c) refus('Commande introuvable.', 404);
  if (c.statut_paiement !== 'paye') refus("Cette commande n'est pas payée.", 409);
  if (c.statut === 'annulee') refus('Cette commande est annulée.', 409);
  if (statut === 'expediee' && c.statut !== 'confirmee') refus(c.statut === 'expediee' ? 'Cette commande est déjà expédiée.' : 'Cette commande ne peut plus être marquée comme expédiée.', 409);
  if (statut === 'livree' && !(c.statut === 'confirmee' || c.statut === 'expediee')) refus('Cette commande est déjà livrée.', 409);
  const suivi = String(numero_suivi || '').trim().slice(0, 120) || null;
  const transp = String(transporteur || '').trim().slice(0, 120) || null;
  if (statut === 'expediee') {
    await pool.query(`UPDATE boutique_commandes SET statut = 'expediee', numero_suivi = $3, transporteur_suivi = $4, expediee_le = NOW(), updated_at = NOW() WHERE id = $1 AND gestionnaire_id = $2`, [id, gid, suivi, transp]);
  } else {
    await pool.query(`UPDATE boutique_commandes SET statut = 'livree', livree_le = NOW(), updated_at = NOW() WHERE id = $1 AND gestionnaire_id = $2`, [id, gid]);
  }
  return detail(gid, id);
}

// Remboursement total ou partiel, fait chez le fournisseur du gestionnaire AVANT de toucher la base.
async function rembourser(gid, id, { montant, remettreStock = false, raison } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const c = (await client.query('SELECT * FROM boutique_commandes WHERE id = $1 AND gestionnaire_id = $2 FOR UPDATE', [id, gid])).rows[0];
    if (!c) refus('Commande introuvable.', 404);
    if (c.statut_paiement !== 'paye') refus(c.statut_paiement === 'rembourse' ? 'Cette commande est déjà remboursée.' : "Cette commande n'est pas payée.", 409);
    const restantC = cents(c.total) - cents(c.rembourse);
    const demandeC = montant === undefined || montant === null || montant === '' ? restantC : cents(montant);
    if (!(demandeC > 0)) refus('Montant de remboursement invalide.');
    if (demandeC > restantC) refus(`Le montant dépasse ce qui reste à rembourser (${(restantC / 100).toFixed(2)} ${c.devise}).`);
    const cfg = await paiement.config(gid);
    let ref = null;
    try {
      if (c.mode_paiement === 'stripe') {
        const stripe = paiement.clientStripe(cfg, c.env);
        if (!stripe || !c.stripe_payment_intent) refus('Remboursement impossible : clés Stripe ou référence de paiement manquantes.', 409);
        const rf = await stripe.refunds.create({ payment_intent: c.stripe_payment_intent, amount: demandeC, metadata: { commande_id: String(c.id), gestionnaire_id: String(gid) } });
        ref = rf && rf.id;
      } else {
        if (!c.paypal_capture_id) refus('Remboursement impossible : référence de paiement PayPal manquante.', 409);
        const r = await paiement.appelPaypal(cfg, c.env, 'POST', `/v2/payments/captures/${encodeURIComponent(c.paypal_capture_id)}/refund`,
          { amount: { value: (demandeC / 100).toFixed(2), currency_code: c.devise }, note_to_payer: String(raison || '').slice(0, 100) || undefined });
        if (r.status >= 300) throw new Error((r.data && (r.data.message || r.data.name)) || `PayPal a refusé le remboursement (${r.status})`);
        ref = r.data && r.data.id;
      }
    } catch (e) {
      if (e instanceof ErreurCommande) throw e;
      console.error('[boutique-gestion] remboursement :', e.message);
      refus(`Le fournisseur de paiement a refusé le remboursement : ${e.message}`, 502);
    }
    const total = demandeC === restantC;
    const entree = { montant: demandeC / 100, date: new Date().toISOString(), raison: String(raison || '').slice(0, 200) || null, reference: ref };
    await client.query(
      `UPDATE boutique_commandes SET rembourse = rembourse + $2, remboursements = remboursements || $3::jsonb,
              statut_paiement = CASE WHEN $4 THEN 'rembourse' ELSE statut_paiement END, statut = CASE WHEN $4 THEN 'annulee' ELSE statut END,
              annule_par = CASE WHEN $4 THEN COALESCE(annule_par, 'gestionnaire') ELSE annule_par END,
              raison_annulation = CASE WHEN $4 THEN COALESCE(raison_annulation, 'Remboursée') ELSE raison_annulation END, updated_at = NOW()
        WHERE id = $1`, [id, demandeC / 100, JSON.stringify([entree]), total]);
    if (total && remettreStock) {
      const arts = Array.isArray(c.articles) ? c.articles : [];
      for (const a of [...arts].sort((x, y) => x.produit_id - y.produit_id)) await C.ajusterStock(client, parseInt(a.produit_id, 10), a.variante || '', parseInt(a.quantite, 10));
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { client.release(); }
  return detail(gid, id);
}

// Annulation d'une commande NON payée par le gestionnaire (stock remis)
async function annulerNonPayee(gid, id) {
  const c = (await pool.query('SELECT statut, statut_paiement FROM boutique_commandes WHERE id = $1 AND gestionnaire_id = $2', [id, gid])).rows[0];
  if (!c) refus('Commande introuvable.', 404);
  if (c.statut_paiement === 'paye') refus('Cette commande est payée : utilisez le remboursement.', 409);
  if (c.statut === 'annulee') refus('Cette commande est déjà annulée.', 409);
  await C.annulerNonPayee(id, { par: 'gestionnaire', raison: 'Annulée par la boutique' });
  return detail(gid, id);
}

// Paiements reçus sur une période (par défaut : 30 derniers jours). Les taxes perçues sont à remettre aux gouvernements par le gestionnaire.
async function resumePaiements(gid, { du, au } = {}) {
  const fin = au && !isNaN(Date.parse(au)) ? new Date(au) : new Date();
  const debut = du && !isNaN(Date.parse(du)) ? new Date(du) : new Date(fin.getTime() - 30 * 86400000);
  const fin2 = new Date(fin.getTime() + 86400000 - 1);   // « au » inclus
  const r = await pool.query(
    `SELECT id, numero_commande, mode_paiement, devise, sous_total, frais_expedition, total, rembourse, taxes, paye_le, statut_paiement, anomalie
       FROM boutique_commandes WHERE gestionnaire_id = $1 AND paye_le IS NOT NULL AND paye_le BETWEEN $2 AND $3 ORDER BY paye_le DESC`, [gid, debut, fin2]);
  const z = () => ({ nb: 0, brut: 0, rembourse: 0 });
  const par = { stripe: z(), paypal: z() };
  const t = { ventes: 0, expedition: 0, tps: 0, tvq: 0, tvh: 0, tvp: 0, encaisse: 0, rembourse: 0 };
  for (const x of r.rows) {
    const tx = x.taxes || {};
    t.ventes += cents(x.sous_total); t.expedition += cents(x.frais_expedition); t.encaisse += cents(x.total); t.rembourse += cents(x.rembourse);
    for (const k of ['tps', 'tvq', 'tvh', 'tvp']) t[k] += cents(tx[k] || 0);
    const p = par[x.mode_paiement]; if (p) { p.nb++; p.brut += cents(x.total); p.rembourse += cents(x.rembourse); }
  }
  const eur = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === 'nb' ? v : v / 100]));
  const ancienne = (await pool.query(
    `SELECT id, numero_commande, anomalie FROM boutique_commandes WHERE gestionnaire_id = $1 AND anomalie IS NOT NULL ORDER BY updated_at DESC LIMIT 20`, [gid])).rows;
  return {
    du: debut.toISOString().slice(0, 10), au: fin.toISOString().slice(0, 10), nb_commandes: r.rows.length,
    totaux: { ...eur(t), net: (t.encaisse - t.rembourse) / 100, taxes_percues: (t.tps + t.tvq + t.tvh + t.tvp) / 100 },
    par_mode: { stripe: eur(par.stripe), paypal: eur(par.paypal) },
    paiements: r.rows.slice(0, 200), anomalies: ancienne,
  };
}

module.exports = { lister, detail, changerStatut, rembourser, annulerNonPayee, resumePaiements };