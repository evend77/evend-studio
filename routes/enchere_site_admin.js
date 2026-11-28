// CHEMIN : routes/enchere_site_admin.js
// API GESTIONNAIRE des sites d'enchères — monté sur /api/studio/encheres-site
'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const ens = require('../services/enchere_site');
const lim = require('../services/encheres_limites');

const router = express.Router();
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ message: 'Accès réservé aux gestionnaires.' });
  next();
});

function erreur(res, e, ctx) {
  if (e instanceof ens.ErreurEnchere) return res.status(e.statut).json({ message: e.message, code: e.code });
  console.error(`❌ ${ctx} :`, e.message);
  res.status(500).json({ message: 'Erreur serveur.' });
}
const idLot = (req) => parseInt(req.params.id, 10);

router.get('/lots', async (req, res) => { try { res.json({ lots: await ens.listerGestionnaire(req.user.id) }); } catch (e) { erreur(res, e, 'GET lots'); } });
router.post('/lots', async (req, res) => { try { res.status(201).json({ id: await ens.creerLot(req.user.id, req.body || {}) }); } catch (e) { erreur(res, e, 'POST lots'); } });
router.put('/lots/:id', async (req, res) => { try { await ens.modifierLot(req.user.id, idLot(req), req.body || {}); res.json({ success: true }); } catch (e) { erreur(res, e, 'PUT lot'); } });
router.delete('/lots/:id', async (req, res) => { try { await ens.supprimerLot(req.user.id, idLot(req)); res.json({ success: true }); } catch (e) { erreur(res, e, 'DELETE lot'); } });
router.post('/lots/:id/annuler', async (req, res) => { try { await ens.annulerLot(req.user.id, idLot(req)); res.json({ success: true }); } catch (e) { erreur(res, e, 'annuler lot'); } });
router.post('/lots/:id/paiement', async (req, res) => { try { await ens.marquerPaiement(req.user.id, idLot(req), (req.body || {}).statut); res.json({ success: true }); } catch (e) { erreur(res, e, 'paiement lot'); } });
router.get('/lots/:id/mises', async (req, res) => { try { res.json({ mises: await ens.misesGestionnaire(req.user.id, idLot(req)) }); } catch (e) { erreur(res, e, 'GET mises'); } });
// Plan & limites : même forme que GET/PUT /api/boutique/gestionnaire/plan (la page « Mon plan & limites » est la même)
router.get('/plan', async (req, res) => { try { res.json(await lim.etatPourPage(req.user.id)); } catch (e) { erreur(res, e, 'GET plan'); } });
router.put('/plan', async (req, res) => {
  try {
    const b = req.body || {};
    const limite = parseInt(b.limite, 10);
    if (!Number.isInteger(limite) || limite < 1) return res.status(400).json({ message: 'Palier invalide.' });
    const tid = typeof b.template_id === 'string' ? b.template_id.slice(0, 80) : '';
    res.json({ success: true, ...(await lim.changerPalier(req.user.id, limite, tid || undefined)) });
  } catch (e) { erreur(res, e, 'PUT plan'); }
});
router.get('/reglages', async (req, res) => { try { res.json(await ens.reglages(req.user.id)); } catch (e) { erreur(res, e, 'GET reglages'); } });
router.put('/reglages', async (req, res) => { try { res.json(await ens.sauverReglages(req.user.id, req.body || {})); } catch (e) { erreur(res, e, 'PUT reglages'); } });

module.exports = router;