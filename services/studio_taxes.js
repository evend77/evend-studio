// CHEMIN : services/studio_taxes.js
// e-Vend Studio — Règle de taxe d'un produit (multi-vendeur). Décidée UNIQUEMENT par le serveur.
//
//   Un produit est taxable  ⇔  son collaborateur est inscrit aux taxes (marketplace_collaborateurs.inscrit_taxes)
//                              ET sa catégorie est taxable (studio_categories.taxable ; sans catégorie = taxable).
//   Collaborateur non inscrit (petit fournisseur) → aucune taxe, jamais.

'use strict';

// db : pool ou client. produitIds : ids (nombres ou texte). Renvoie Map<number, boolean>.
async function taxabilite(db, gid, produitIds) {
  const ids = [...new Set((produitIds || []).map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0))];
  const res = new Map();
  if (!ids.length) return res;
  const r = await db.query(
    `SELECT p.id, (mc.inscrit_taxes IS TRUE AND COALESCE(sc.taxable, true)) AS taxable
       FROM produits p
       JOIN marketplace_collaborateurs mc ON mc.id = p.collaborateur_id
       LEFT JOIN studio_categories sc ON sc.id = p.categorie_id
      WHERE p.gestionnaire_id = $1 AND p.id = ANY($2::int[])`, [gid, ids]);
  for (const x of r.rows) res.set(x.id, x.taxable === true);
  return res;
}

// Ajoute facturation_taxes (booléen) à chaque ligne de panier (ligne.produit_id). Produit introuvable → non taxable.
async function marquerLignes(db, gid, lignes) {
  const m = await taxabilite(db, gid, lignes.map((l) => l.produit_id));
  return lignes.map((l) => ({ ...l, facturation_taxes: m.get(parseInt(l.produit_id, 10)) === true }));
}

// ── Taux de taxes : réglés par le GESTIONNAIRE (Config multi → Généralité → Taux de taxes), jamais écrits en dur ──
// Valeurs de config en % (« 9.975 ») ; valeur absente ou invalide → taux par défaut ; bornée entre 0 et 30 %.
const DEFAUT = { taxe_tps: 5, taxe_tvq: 9.975, taxe_tvh_on: 13, taxe_tvh_nb: 15, taxe_tvh_ns: 15, taxe_tvh_nl: 15, taxe_tvh_pe: 15,
                 taxe_tvp_bc: 7, taxe_tvp_sk: 6, taxe_tvp_mb: 7 };

function taux(mv, cle) {
  const n = parseFloat(String(mv && mv[cle] !== undefined && mv[cle] !== null ? mv[cle] : '').replace(',', '.'));
  const v = Number.isFinite(n) ? n : DEFAUT[cle];
  return Math.min(30, Math.max(0, v)) / 100;
}
const pct = (f) => `${parseFloat((f * 100).toFixed(3))}`.replace('.', ',');

// mv = sites.config.multivendeur. Renvoie { 'QC': { tps, tvq, tvh, tvp, label }, … } (taux en fraction : 0.05 = 5 %)
function tableTaux(mv) {
  const tps = taux(mv, 'taxe_tps'), tvq = taux(mv, 'taxe_tvq');
  const t = {};
  for (const p of ['AB', 'NT', 'NU', 'YT']) t[p] = { tps, tvq: 0, tvh: 0, tvp: 0, label: 'TPS' };
  t.QC = { tps, tvq, tvh: 0, tvp: 0, label: 'TPS + TVQ' };
  for (const [p, k] of [['ON', 'taxe_tvh_on'], ['NB', 'taxe_tvh_nb'], ['NS', 'taxe_tvh_ns'], ['NL', 'taxe_tvh_nl'], ['PE', 'taxe_tvh_pe']]) {
    t[p] = { tps: 0, tvq: 0, tvh: taux(mv, k), tvp: 0, label: 'TVH' };
  }
  for (const [p, k] of [['BC', 'taxe_tvp_bc'], ['SK', 'taxe_tvp_sk'], ['MB', 'taxe_tvp_mb']]) {
    const tvp = taux(mv, k);
    t[p] = { tps, tvq: 0, tvh: 0, tvp, label: `TPS + TVP (${pct(tvp)} %)` };
  }
  return t;
}

async function chargerTable(db, gid) {
  const r = await db.query('SELECT config FROM sites WHERE gestionnaire_id = $1', [gid]);
  return tableTaux((r.rows[0] && r.rows[0].config && r.rows[0].config.multivendeur) || {});
}

module.exports = { taxabilite, marquerLignes, tableTaux, chargerTable, DEFAUT };