// CHEMIN : routes/cagnotte_admin.js
// e-Vend Studio — Cagnotte : page ADMIN (tarifs par palier, taxes, remboursement, suivi des campagnes). Monté sur : /api/admin/cagnotte
//   GET  /reglages                      → réglages actuels
//   PUT  /reglages                      → enregistrer (validé côté serveur)
//   GET  /campagnes                     → toutes les campagnes (avec dons reçus)
//   POST /campagnes/:id/rembourser      → { pct? } remboursement manuel (partiel) du prix de publication
//   POST /campagnes/:id/fermer          → ferme une campagne maintenant

const express = require('express');
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const schema = require('../services/cagnotte_schema');
const camp = require('../services/cagnotte_campagnes');

const router = express.Router();
router.use(authenticateToken, isAdmin);

const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const bad = (res, m) => res.status(400).json({ message: m });

router.get('/reglages', async (req, res) => {
  try { res.json({ ...(await camp.reglages()), provinces: camp.PROVINCES }); }
  catch (e) { console.error('❌ GET admin/cagnotte/reglages :', e.message); res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.put('/reglages', async (req, res) => {
  try {
    await schema.pret();
    const b = req.body || {};
    // Paliers
    if (!Array.isArray(b.paliers) || b.paliers.length < 1 || b.paliers.length > 8) return bad(res, 'Entre 1 et 8 paliers.');
    const ids = new Set();
    const paliers = [];
    for (const p of b.paliers) {
      const nom = String(p.nom || '').trim().slice(0, 60);
      const prix = num(p.prix);
      const max = p.objectif_max === null || p.objectif_max === '' || p.objectif_max === undefined ? null : num(p.objectif_max);
      if (!nom) return bad(res, 'Chaque palier doit avoir un nom.');
      if (!Number.isFinite(prix) || prix < 1 || prix > 5000) return bad(res, `Prix invalide pour « ${nom} » (entre 1 $ et 5000 $).`);
      if (max !== null && (!Number.isFinite(max) || max <= 0)) return bad(res, `Objectif maximum invalide pour « ${nom} ».`);
      const id = String(p.id || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || `p${paliers.length + 1}`;
      if (ids.has(id)) return bad(res, 'Identifiants de palier en double.');
      ids.add(id);
      paliers.push({ id, nom, objectif_max: max, prix: Math.round(prix * 100) / 100 });
    }
    if (paliers.filter((p) => p.objectif_max === null).length !== 1) return bad(res, 'Exactement un palier doit être sans limite d\'objectif (le plus élevé), pour couvrir tous les objectifs.');
    const maxes = paliers.filter((p) => p.objectif_max !== null).map((p) => p.objectif_max);
    if (new Set(maxes).size !== maxes.length) return bad(res, 'Deux paliers ont le même objectif maximum.');
    // Taxes
    const taxes = {};
    for (const prov of camp.PROVINCES) {
      const t = (b.taxes || {})[prov] || {};
      const tps = num(t.tps || 0), tvq = num(t.tvq || 0), tvh = num(t.tvh || 0);
      if (![tps, tvq, tvh].every((x) => Number.isFinite(x) && x >= 0 && x <= 30)) return bad(res, `Taux de taxes invalides (${prov}).`);
      taxes[prov] = { tps, tvq, tvh, label: String(t.label || 'Taxes').slice(0, 30) };
    }
    const numeros = { tps: String((b.numeros_taxes || {}).tps || '').slice(0, 40), tvq: String((b.numeros_taxes || {}).tvq || '').slice(0, 40) };
    // Divers
    const duree = parseInt(b.duree_max_jours, 10);
    if (!Number.isInteger(duree) || duree < 7 || duree > 365) return bad(res, 'Durée maximale : entre 7 et 365 jours.');
    const pct = num(b.remboursement_pct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return bad(res, 'Le pourcentage de remboursement doit être entre 0 et 100.');
    const dmin = num(b.don_min), dmax = num(b.don_max);
    if (!Number.isFinite(dmin) || dmin < 1 || !Number.isFinite(dmax) || dmax < dmin || dmax > 100000) return bad(res, 'Don minimum / maximum invalides.');
    const devise = String(b.devise || 'CAD').toUpperCase();
    if (!['CAD', 'USD'].includes(devise)) return bad(res, 'Devise non supportée.');

    await pool.query(
      `UPDATE cagnotte_reglages SET paliers = $1, taxes = $2, numeros_taxes = $3, duree_max_jours = $4, remboursement_actif = $5, remboursement_pct = $6,
              remboursement_auto = $7, don_min = $8, don_max = $9, devise = $10, updated_at = NOW() WHERE id = 1`,
      [JSON.stringify(paliers), JSON.stringify(taxes), JSON.stringify(numeros), duree, b.remboursement_actif !== false, pct, b.remboursement_auto !== false, dmin, dmax, devise]);
    res.json({ success: true, ...(await camp.reglages()) });
  } catch (e) { console.error('❌ PUT admin/cagnotte/reglages :', e.message); res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.get('/campagnes', async (req, res) => {
  try {
    await schema.pret();
    const r = await pool.query(
      `SELECT c.*, g.email AS gestionnaire_email, s.slug,
              (SELECT COUNT(*)::int FROM dons d WHERE d.campagne_id = c.id AND d.statut = 'complete') AS nb_dons,
              (SELECT COALESCE(SUM(montant),0)::numeric(12,2) FROM dons d WHERE d.campagne_id = c.id AND d.statut = 'complete') AS total_dons
         FROM cagnotte_campagnes c LEFT JOIN gestionnaires g ON g.id = c.gestionnaire_id LEFT JOIN sites s ON s.id = c.site_id
        ORDER BY c.id DESC LIMIT 500`);
    const t = await pool.query(`SELECT COALESCE(SUM(total) FILTER (WHERE statut IN ('publiee','terminee')),0)::numeric(12,2) AS encaisse,
                                       COALESCE(SUM(remb_montant) FILTER (WHERE remb_statut = 'fait'),0)::numeric(12,2) AS rembourse,
                                       COUNT(*) FILTER (WHERE statut = 'publiee')::int AS ouvertes FROM cagnotte_campagnes`);
    res.json({ campagnes: r.rows, totaux: t.rows[0] });
  } catch (e) { console.error('❌ GET admin/cagnotte/campagnes :', e.message); res.status(500).json({ message: 'Erreur serveur.' }); }
});

router.post('/campagnes/:id/rembourser', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return bad(res, 'Identifiant invalide.');
    const r = await camp.rembourser(id, { pct: (req.body || {}).pct });
    res.json({ success: true, ...r });
  } catch (e) {
    if (e instanceof camp.ErreurCagnotte) return res.status(e.statut).json({ message: e.message });
    console.error('❌ rembourser cagnotte :', e.message); res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/campagnes/:id/fermer', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return bad(res, 'Identifiant invalide.');
    res.json({ success: true, ...(await camp.terminer(id, 'fermee_par_admin')) });
  } catch (e) { console.error('❌ fermer cagnotte :', e.message); res.status(500).json({ message: 'Erreur serveur.' }); }
});

module.exports = router;