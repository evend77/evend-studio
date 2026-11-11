// CHEMIN : routes/boutique_taxes_config.js
// e-Vend Studio — Taxes du gestionnaire (templates boutique, solo). Il perçoit et gère ses taxes lui-même.
// Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/taxes
//   GET  /   → état : inscrit aux taxes ? (réglé dans Mon compte), taux par défaut / personnalisés, taxer l'expédition ?
//   PUT  /   → { taux: { taxe_tps: 5, … }, taxer_expedition: bool } (valeur vide = retour au taux par défaut)

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const T = require('../services/boutique_taxes');

const router = express.Router();

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
});

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) { console.error('[boutique_taxes_config]', req.method, req.path, e && e.message ? e.message : e); res.status(500).json({ error: 'Erreur serveur' }); }
};

async function etat(gid) {
  const [ent, reg] = await Promise.all([T.entreprise(gid), T.reglages(gid)]);
  const table = T.tableTaux(reg.surcharges);
  const taux = {};
  for (const k of T.CLES) taux[k] = Math.round(T.taux(reg.surcharges, k) * 100000) / 1000;   // en % (ex. 9.975)
  const personnalises = {};
  for (const k of T.CLES) if (reg.surcharges[k] !== undefined && reg.surcharges[k] !== null && reg.surcharges[k] !== '') personnalises[k] = taux[k];
  return {
    inscrit: ent.inscrit, no_tps: ent.no_tps, no_taxe_provinciale: ent.no_taxe_provinciale, province_entreprise: ent.province_entreprise,
    taux, defauts: T.DEFAUT, personnalises, taxer_expedition: reg.taxer_expedition,
    par_province: Object.keys(table).sort().map((p) => ({ province: p, label: table[p].label, tps: table[p].tps * 100, tvq: table[p].tvq * 100, tvh: table[p].tvh * 100, tvp: table[p].tvp * 100 })),
  };
}

router.get('/', h(async (req, res) => { res.json(await etat(req.gid)); }));

router.put('/', h(async (req, res) => {
  const b = req.body || {};
  const reg = await T.reglages(req.gid);
  const surcharges = { ...reg.surcharges };
  if (b.taux !== undefined) {
    if (!b.taux || typeof b.taux !== 'object' || Array.isArray(b.taux)) return res.status(400).json({ error: 'Taux invalides' });
    for (const k of Object.keys(b.taux)) {
      if (T.CLES.indexOf(k) < 0) return res.status(400).json({ error: `Taxe inconnue : ${k}` });
      const v = b.taux[k];
      if (v === null || v === '') { delete surcharges[k]; continue; }
      const n = parseFloat(String(v).replace(',', '.'));
      if (!Number.isFinite(n) || n < 0 || n > 30) return res.status(400).json({ error: 'Chaque taux doit être entre 0 % et 30 %' });
      if (n === T.DEFAUT[k]) delete surcharges[k]; else surcharges[k] = Math.round(n * 1000) / 1000;
    }
  }
  let taxerExp = reg.taxer_expedition;
  if (b.taxer_expedition !== undefined) {
    if (typeof b.taxer_expedition !== 'boolean') return res.status(400).json({ error: 'Valeur invalide' });
    taxerExp = b.taxer_expedition;
  }
  await pool.query(
    `INSERT INTO boutique_reglages (gestionnaire_id, taux_taxes, taxer_expedition, updated_at) VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET taux_taxes = EXCLUDED.taux_taxes, taxer_expedition = EXCLUDED.taxer_expedition, updated_at = NOW()`,
    [req.gid, JSON.stringify(surcharges), taxerExp]);
  res.json(await etat(req.gid));
}));

module.exports = router;