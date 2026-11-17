// CHEMIN : routes/boutique_negociations_acheteur.js
// e-Vend Studio — Add-on « Faire une offre » (boutique solo), partie ACHETEUR. Adapté de routes/studio_negociations.js (MV).
// Monté par routes/boutique_acheteur.js (après sa garde : req.gid et req.acheteurId sont déjà vérifiés) sur /api/boutique/acheteur/:gid/negociations
//   POST /offrir                  { produit_id, variante?, prix, message? }
//   GET  /mes?etat=               mes offres (état calculé : expirée si le délai est passé) + compteurs
//   POST /:id/accepter            accepter une contre-offre
//   POST /:id/panier              mettre l'offre acceptée au panier (prix convenu, quantité 1)
//   POST /:id/retirer             retirer / décliner / renoncer

'use strict';

const express = require('express');
const pool = require('../db');
const { ErreurBoutique } = require('../services/boutique_limites');
const N = require('../services/boutique_negociations');

const router = express.Router();
const ETATS = ['attente', 'contre', 'acceptee', 'refusee', 'annulee', 'payee', 'expiree'];

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ message: e.message, error: e.message });
    console.error('[boutique_negociations_acheteur]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ message: 'Erreur serveur', error: 'Erreur serveur' });
  }
};
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

// Limite d'écritures : 20 par minute et par acheteur
const m = new Map();
const limiteEcriture = (req, res, next) => {
  const k = `${req.gid}:${req.acheteurId}`, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 60000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 60000) m.delete(kk); return next(); }
  if (c.n >= 20) return res.status(429).json({ message: 'Trop de demandes, réessayez dans un instant.', error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

router.post('/offrir', limiteEcriture, h(async (req, res) => {
  const pid = entier(req.body && req.body.produit_id);
  if (!pid) return res.status(400).json({ message: 'Produit invalide.' });
  const b = req.body;
  const r = await N.faireOffre({ gid: req.gid, acheteurId: req.acheteurId, produitId: pid, variante: b.variante, prix: b.prix, message: b.message });
  res.json({ success: true, message: `Offre envoyée. Le vendeur a ${r.reponse_jours} jour${r.reponse_jours > 1 ? 's' : ''} pour répondre. Suivez-la dans « Mes offres ».` });
}));

router.get('/mes', h(async (req, res) => {
  const etat = ETATS.includes(req.query.etat) ? req.query.etat : '';
  const params = [req.gid, req.acheteurId]; let filtre = '';
  if (etat) { params.push(etat); filtre = ` AND ${N.sqlEtat('n')} = $3`; }
  const r = await pool.query(
    `SELECT n.*, ${N.sqlEtat('n')} AS etat FROM boutique_negociations n WHERE n.gestionnaire_id = $1 AND n.acheteur_id = $2${filtre} ORDER BY n.updated_at DESC LIMIT 100`, params);
  const cfg = await N.reglages(req.gid);
  res.json({
    addon_actif: await N.actifPourBoutique(req.gid), validite_heures: cfg.validiteH, maintenant: new Date().toISOString(),
    offres: r.rows.map(N.sortie), a_repondre: r.rows.filter((x) => x.etat === 'contre' || x.etat === 'acceptee').length,
  });
}));

router.post('/:id/accepter', limiteEcriture, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return res.status(400).json({ message: 'Offre invalide.' });
  await N.repondreAcheteur({ gid: req.gid, acheteurId: req.acheteurId, id, action: 'accepter' });
  res.json({ success: true });
}));
router.post('/:id/retirer', limiteEcriture, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return res.status(400).json({ message: 'Offre invalide.' });
  await N.repondreAcheteur({ gid: req.gid, acheteurId: req.acheteurId, id, action: 'retirer' });
  res.json({ success: true });
}));
router.post('/:id/panier', limiteEcriture, h(async (req, res) => {
  const id = entier(req.params.id); if (!id) return res.status(400).json({ message: 'Offre invalide.' });
  await N.mettreAuPanier({ gid: req.gid, acheteurId: req.acheteurId, id });
  res.json({ success: true });
}));

module.exports = router;