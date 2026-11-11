// CHEMIN : services/boutique_taxes.js
// e-Vend Studio — Taxes des templates boutique (solo). Le gestionnaire perçoit et gère ses taxes lui-même.
// Règle : un produit est taxable ⇔ le gestionnaire est inscrit aux taxes (Mon compte → entreprise enregistrée)
//         ET sa catégorie est taxable (studio_categories.taxable ; sans catégorie = taxable).
//         Gestionnaire non inscrit → aucune taxe, jamais.
// Taux : valeurs par défaut canadiennes, que le gestionnaire peut modifier (boutique_reglages.taux_taxes).
// Décidé UNIQUEMENT par le serveur. Aucun lien avec le MV (services/studio_taxes.js).

'use strict';

const pool = require('../db');

const DEFAUT = {
  taxe_tps: 5, taxe_tvq: 9.975, taxe_tvh_on: 13, taxe_tvh_nb: 15, taxe_tvh_ns: 15, taxe_tvh_nl: 15, taxe_tvh_pe: 15,
  taxe_tvp_bc: 7, taxe_tvp_sk: 6, taxe_tvp_mb: 7,
};
const CLES = Object.keys(DEFAUT);
const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'];

function taux(surcharges, cle) {
  const brut = surcharges && surcharges[cle] !== undefined && surcharges[cle] !== null ? surcharges[cle] : '';
  const n = parseFloat(String(brut).replace(',', '.'));
  const v = Number.isFinite(n) ? n : DEFAUT[cle];
  return Math.min(30, Math.max(0, v)) / 100;
}
const pct = (f) => `${parseFloat((f * 100).toFixed(3))}`.replace('.', ',');

// Renvoie { 'QC': { tps, tvq, tvh, tvp, label }, … } (taux en fraction : 0.05 = 5 %)
function tableTaux(surcharges) {
  const tps = taux(surcharges, 'taxe_tps'), tvq = taux(surcharges, 'taxe_tvq');
  const t = {};
  for (const p of ['AB', 'NT', 'NU', 'YT']) t[p] = { tps, tvq: 0, tvh: 0, tvp: 0, label: 'TPS' };
  t.QC = { tps, tvq, tvh: 0, tvp: 0, label: 'TPS + TVQ' };
  for (const [p, k] of [['ON', 'taxe_tvh_on'], ['NB', 'taxe_tvh_nb'], ['NS', 'taxe_tvh_ns'], ['NL', 'taxe_tvh_nl'], ['PE', 'taxe_tvh_pe']]) {
    t[p] = { tps: 0, tvq: 0, tvh: taux(surcharges, k), tvp: 0, label: 'TVH' };
  }
  for (const [p, k] of [['BC', 'taxe_tvp_bc'], ['SK', 'taxe_tvp_sk'], ['MB', 'taxe_tvp_mb']]) {
    const tvp = taux(surcharges, k);
    t[p] = { tps, tvq: 0, tvh: 0, tvp, label: `TPS + TVP (${pct(tvp)} %)` };
  }
  return t;
}

async function reglages(gid, db) {
  const r = await (db || pool).query('SELECT taux_taxes, taxer_expedition FROM boutique_reglages WHERE gestionnaire_id = $1', [gid]);
  const x = r.rows[0];
  return { surcharges: (x && x.taux_taxes && typeof x.taux_taxes === 'object') ? x.taux_taxes : {}, taxer_expedition: x ? x.taxer_expedition !== false : true };
}

async function entreprise(gid, db) {
  const r = await (db || pool).query(
    'SELECT est_entreprise_enregistree, no_tps, no_taxe_provinciale, province_entreprise FROM gestionnaires WHERE id = $1', [gid]);
  const g = r.rows[0] || {};
  return {
    inscrit: g.est_entreprise_enregistree === true,
    no_tps: g.no_tps || null, no_taxe_provinciale: g.no_taxe_provinciale || null, province_entreprise: g.province_entreprise || null,
  };
}

// Renvoie Map<id, boolean> : seules les annonces SOLO de ce gestionnaire sont connues (le reste → non taxable)
async function taxabilite(db, gid, produitIds) {
  const ids = Array.from(new Set((produitIds || []).map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0)));
  const res = new Map();
  if (!ids.length) return res;
  const inscrit = (await entreprise(gid, db)).inscrit;
  const r = await db.query(
    `SELECT p.id, COALESCE(sc.taxable, true) AS taxable
       FROM produits p LEFT JOIN studio_categories sc ON sc.id = p.categorie_id
      WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.id = ANY($2::int[])`, [gid, ids]);
  for (const x of r.rows) res.set(x.id, inscrit && x.taxable === true);
  return res;
}

const arrondi2 = (n) => Math.round(n * 100 + 1e-7) / 100;

// Calcule les taxes d'une commande.
// lignes : [{ produit_id, montant }]  (montant = prix × quantité, après rabais de ligne)
// fraisExpedition : frais d'expédition déjà décidés par le serveur ; province : province de livraison de l'acheteur
async function calculer(db, { gid, lignes, fraisExpedition, province }) {
  const { surcharges, taxer_expedition } = await reglages(gid, db);
  const ent = await entreprise(gid, db);
  const sousTotal = arrondi2((lignes || []).reduce((s, l) => s + (Number(l.montant) || 0), 0));
  const vide = { inscrit: ent.inscrit, sous_total: sousTotal, base_taxable: 0, tps: 0, tvq: 0, tvh: 0, tvp: 0, total_taxes: 0, label: '' };
  if (!ent.inscrit) return vide;
  const m = await taxabilite(db, gid, (lignes || []).map((l) => l.produit_id));
  let base = 0;
  for (const l of lignes || []) if (m.get(parseInt(l.produit_id, 10)) === true) base += Number(l.montant) || 0;
  const frais = Number(fraisExpedition) || 0;
  if (base > 0 && taxer_expedition && frais > 0) base += frais;   // l'expédition est taxée quand la commande contient du taxable
  base = arrondi2(base);
  if (!(base > 0)) return { ...vide, base_taxable: 0 };
  const prov = PROVINCES.indexOf(province) >= 0 ? province : 'QC';
  const t = tableTaux(surcharges)[prov];
  const tps = arrondi2(base * t.tps), tvq = arrondi2(base * t.tvq), tvh = arrondi2(base * t.tvh), tvp = arrondi2(base * t.tvp);
  return { inscrit: true, sous_total: sousTotal, base_taxable: base, tps, tvq, tvh, tvp, total_taxes: arrondi2(tps + tvq + tvh + tvp), label: t.label };
}

module.exports = { DEFAUT, CLES, PROVINCES, taux, tableTaux, reglages, entreprise, taxabilite, calculer };