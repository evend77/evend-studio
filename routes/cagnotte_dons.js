// CHEMIN : routes/cagnotte_dons.js
// e-Vend Studio — Cagnotte : dons (remplace l'ancien routes/dons.js). Monté sur : /api/dons
//   GET  /public/:siteId        → état public de la campagne + derniers dons (aucune authentification)
//   POST /creer-session         → crée un don et démarre le paiement (Stripe ou PayPal du gestionnaire)
//   POST /paypal/capturer       → retour de PayPal : capture le paiement
//   GET  /gestionnaire          → dons du gestionnaire connecté

const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const schema = require('../services/cagnotte_schema');
const camp = require('../services/cagnotte_campagnes');
const dons = require('../services/cagnotte_dons');

const router = express.Router();

// Petit frein contre les abus : 12 créations de don par 10 minutes et par adresse IP
const compteur = new Map();
function limite(req, res, next) {
  const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  const now = Date.now();
  const l = (compteur.get(ip) || []).filter((t) => now - t < 600000);
  if (l.length >= 12) return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans quelques minutes.' });
  l.push(now); compteur.set(ip, l);
  if (compteur.size > 5000) for (const [k, v] of compteur) if (!v.some((t) => now - t < 600000)) compteur.delete(k);
  next();
}

function erreur(res, e, contexte) {
  if (e instanceof camp.ErreurCagnotte) return res.status(e.statut).json({ message: e.message });
  console.error(`❌ ${contexte} :`, e.message);
  res.status(500).json({ message: 'Erreur serveur.' });
}

router.get('/public/:siteId', async (req, res) => {
  try {
    const id = parseInt(req.params.siteId, 10);
    if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ message: 'Introuvable.' });
    const out = await camp.etatPublic(id);
    if (!out) return res.status(404).json({ message: 'Introuvable.' });
    res.set('Cache-Control', 'no-store');
    res.json(out);
  } catch (e) { erreur(res, e, 'GET /api/dons/public'); }
});

router.post('/creer-session', limite, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await dons.creerDon({ siteId: b.site_id, montant: b.montant, nom: b.nom_donateur, anonyme: b.anonyme === true, message: b.message, mode: b.mode || 'stripe' });
    res.json({ success: true, checkout_url: r.checkout_url, don_id: r.don_id });
  } catch (e) { erreur(res, e, 'POST /api/dons/creer-session'); }
});

router.post('/paypal/capturer', limite, async (req, res) => {
  try {
    const b = req.body || {};
    const r = await dons.capturerPaypal({ siteId: b.site_id, donId: b.don_id, orderId: typeof b.order_id === 'string' ? b.order_id : '' });
    res.json({ success: true, paye: r.paye });
  } catch (e) { erreur(res, e, 'POST /api/dons/paypal/capturer'); }
});

router.get('/gestionnaire', authenticateToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ message: 'Accès réservé aux gestionnaires.' });
    await schema.pret();
    const gid = req.user.id;
    const l = await pool.query(
      `SELECT d.id, d.nom_donateur, d.anonyme, d.montant, d.message, d.statut, d.mode_paiement, d.devise, d.anomalie, d.created_at, d.campagne_id,
              s.slug AS site_slug, s.config->>'nomCampagne' AS nom_campagne
         FROM dons d JOIN sites s ON s.id = d.site_id
        WHERE d.gestionnaire_id = $1 ORDER BY d.created_at DESC LIMIT 1000`, [gid]);
    const t = await pool.query(
      `SELECT COALESCE(SUM(montant) FILTER (WHERE statut = 'complete'),0)::numeric(12,2) AS total,
              COUNT(*) FILTER (WHERE statut = 'complete')::int AS nb,
              COALESCE(SUM(montant) FILTER (WHERE statut = 'complete' AND date_trunc('month', created_at) = date_trunc('month', NOW())),0)::numeric(12,2) AS ce_mois
         FROM dons WHERE gestionnaire_id = $1`, [gid]);
    res.json({ dons: l.rows, total: t.rows[0].total, count: t.rows[0].nb, ce_mois: t.rows[0].ce_mois });
  } catch (e) { erreur(res, e, 'GET /api/dons/gestionnaire'); }
});

module.exports = router;