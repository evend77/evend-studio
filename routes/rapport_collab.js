// CHEMIN : routes/rapport_collab.js
// e-Vend Studio — Rapport financier du collaborateur (ventes, taxes perçues, commissions payées au gestionnaire).
// Adapté de rapport_vendeur.js (e-Vend). Monté dans collab_dashboard.js, APRÈS le middleware d'authentification
// (req.gid = gestionnaire, req.cid = collaborateur connecté) :
//   GET /api/collab/:gestionnaireId/rapport?date_debut=YYYY-MM-DD&date_fin=YYYY-MM-DD
//   → { ventes, commissions, abonnements: [], province, inscritTaxes }   (même forme que sur e-Vend)
// Un collaborateur ne voit JAMAIS que ses propres commandes (filtre collaborateur_id = req.cid).
// Source : marketplace_commandes payées (statut_paiement = 'paye'). Les montants (taxes, commission) sont ceux figés au paiement.
// Remboursements : part remboursée = montant_rembourse / total (taxes et commission remboursées au prorata). Abonnements : addons à venir.

const express = require('express');
const pool = require('../db');
const taxesMV = require('../services/studio_taxes');
const cfgMV = require('../services/studio_config_mv');

const router = express.Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

function json(v) {
  if (v && typeof v === 'object') return v;
  try { return JSON.parse(v || 'null'); } catch (e) { return null; }
}

router.get('/rapport', async (req, res) => {
  try {
    const cfg = (await pool.query('SELECT config FROM sites WHERE gestionnaire_id = $1', [req.gid])).rows[0];
    const mv = (cfg && cfg.config && cfg.config.multivendeur) || {};
    const FUSEAU = cfgMV.fuseauDe(mv);
    const aujourdhui = new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU }).format(new Date());
    const debut = DATE_RE.test(req.query.date_debut || '') ? req.query.date_debut : `${aujourdhui.slice(0, 4)}-01-01`;
    const fin = DATE_RE.test(req.query.date_fin || '') ? req.query.date_fin : aujourdhui;

    const table = taxesMV.tableTaux(mv);

    const cmd = await pool.query(
      `SELECT c.id, c.numero_commande, c.articles, c.total, c.montant_rembourse, c.statut_paiement, c.commission, c.commission_taxes, c.frais_expedition, c.taxes, c.adresse_livraison,
              (COALESCE(c.paye_le, c.date_commande) AT TIME ZONE '${FUSEAU}')::date::text AS date_iso
         FROM marketplace_commandes c
        WHERE c.collaborateur_id = $1 AND c.gestionnaire_id = $2
          AND (c.statut_paiement = 'rembourse' OR (c.statut_paiement = 'paye' AND c.statut <> 'annulee'))
          AND (COALESCE(c.paye_le, c.date_commande) AT TIME ZONE '${FUSEAU}')::date BETWEEN $3 AND $4
        ORDER BY COALESCE(c.paye_le, c.date_commande) DESC, c.id DESC`,
      [req.cid, req.gid, debut, fin]);

    const collab = (await pool.query('SELECT province, inscrit_taxes FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [req.cid, req.gid])).rows[0] || {};
    const provinceCollab = String(collab.province || 'QC').trim().toUpperCase();

    // Poids de la commission par taxe (taux de la province du gestionnaire) pour ventiler commission_taxes
    const tp = table[mv.commission_province] || table.QC;
    const poidsTot = (tp.tps || 0) + (tp.tvq || 0) + (tp.tvh || 0) + (tp.tvp || 0);

    const ventes = [];
    const commissions = [];
    for (const row of cmd.rows) {
      const arts = Array.isArray(json(row.articles)) ? json(row.articles) : [];
      const tx = json(row.taxes) || {};
      const adr = json(row.adresse_livraison) || {};
      const dateFr = row.date_iso.split('-').reverse().join('/');
      const province = String(tx.province || adr.province || provinceCollab || 'QC').trim().toUpperCase();
      const lignes = arts.map((a) => {
        const q = Math.max(1, parseInt(a.quantite, 10) || 1);
        const base = Math.max(0, num(a.prix) * q - num(a.rabais));
        return { a, q, base, taxable: a.facturation_taxes === true };
      });
      const baseTaxable = lignes.reduce((s, l) => s + (l.taxable ? l.base : 0), 0);
      const baseTotale = lignes.reduce((s, l) => s + l.base, 0);
      const frais = num(row.frais_expedition);
      const tip = num(tx.pourboire);
      const n = Math.max(1, lignes.length);
      const ratio = num(row.total) > 0 ? Math.min(1, Math.max(0, num(row.montant_rembourse) / num(row.total))) : 0;
      const common = { orderId: String(row.id), storeOrderId: row.numero_commande || `#${row.id}`, date: dateFr, dateISO: row.date_iso,
        province, taxeRemisePar: 'vendeur', statutPaiement: row.statut_paiement === 'rembourse' ? 'refunded' : 'Paid', ratioRembourse: ratio };

      if (!lignes.length) {
        ventes.push({ id: row.id, ...common, produit: 'Commande', quantite: 1, prixUnitaire: Math.max(0, num(row.total) - frais - tip - num(tx.tps) - num(tx.tvq) - num(tx.tvh) - num(tx.tvp)),
          expedition: frais, pourboire: tip, tps: num(tx.tps), tvq: num(tx.tvq), tvh: num(tx.tvh), tvp: num(tx.tvp),
          tpsRembourse: num(tx.tps) * ratio, tvqRembourse: num(tx.tvq) * ratio, tvhRembourse: num(tx.tvh) * ratio, tvpRembourse: num(tx.tvp) * ratio });
      }
      lignes.forEach((l, i) => {
        const part = baseTaxable > 0 && l.taxable ? l.base / baseTaxable : 0;
        ventes.push({
          id: `${row.id}-${i}`, ...common,
          produit: String(l.a.titre || l.a.nom || 'Produit'), quantite: l.q, prixUnitaire: r2(l.base / l.q),
          expedition: frais / n, pourboire: tip / n,
          tps: num(tx.tps) * part, tvq: num(tx.tvq) * part, tvh: num(tx.tvh) * part, tvp: num(tx.tvp) * part,
          tpsRembourse: num(tx.tps) * part * ratio, tvqRembourse: num(tx.tvq) * part * ratio, tvhRembourse: num(tx.tvh) * part * ratio, tvpRembourse: num(tx.tvp) * part * ratio,
        });
      });

      // Commission payée au gestionnaire (HT + taxes sur la commission, si le gestionnaire les facture)
      const ht = num(row.commission);
      const taxesCom = num(row.commission_taxes);
      const v = { ht, tps: 0, tvq: 0, tvh: 0, tvp: 0 };
      if (taxesCom > 0) {
        if (poidsTot > 0) {
          for (const k of ['tps', 'tvq', 'tvh', 'tvp']) v[k] = r2(taxesCom * ((tp[k] || 0) / poidsTot));
          v.tps = r2(v.tps + (taxesCom - (v.tps + v.tvq + v.tvh + v.tvp))); // écart d'arrondi sur la TPS
        } else v.tps = taxesCom;
      }
      // Commission NETTE des remboursements (le gestionnaire rend sa part au prorata)
      const k = 1 - ratio;
      const brute = r2(ht + taxesCom), net = r2(brute * k);
      if (ratio > 0) { for (const key of ['ht', 'tps', 'tvq', 'tvh', 'tvp']) v[key] = r2(v[key] * k); v.ht = r2(v.ht + (net - (v.ht + v.tps + v.tvq + v.tvh + v.tvp))); }
      if (ht > 0 || taxesCom > 0) {
        const premier = lignes[0] ? String(lignes[0].a.titre || lignes[0].a.nom || 'Produit') : 'Commande';
        commissions.push({
          id: row.id, date: dateFr, dateISO: row.date_iso, orderId: String(row.id), storeOrderId: row.numero_commande || `#${row.id}`,
          produit: lignes.length > 1 ? `${premier} (+${lignes.length - 1})` : premier,
          montantVenteHT: r2(baseTotale), commissionBrute: net, commissionRemboursee: r2(brute - net),
          statutPaiement: row.statut_paiement === 'rembourse' ? 'refunded' : 'Paid', estimee: false, ventilationReelle: v,
        });
      }
    }

    res.json({ ventes, commissions, abonnements: [], province: provinceCollab, inscritTaxes: collab.inscrit_taxes === true });
  } catch (e) {
    console.error('[rapport_collab]', e.message);
    res.status(500).json({ error: 'Rapport indisponible', ventes: [], commissions: [], abonnements: [] });
  }
});

module.exports = router;