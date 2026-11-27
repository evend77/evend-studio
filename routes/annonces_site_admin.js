// CHEMIN : routes/annonces_site_admin.js
// API GESTIONNAIRE des petites annonces — monté sur /api/studio/annonces-site
'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const svc = require('../services/annonces_site');

const router = express.Router();
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ message: 'Accès réservé aux gestionnaires.' });
  next();
});

function erreur(res, e, ctx) {
  if (e instanceof svc.ErreurAnnonce) return res.status(e.statut).json({ message: e.message, code: e.code });
  console.error(`❌ ${ctx} :`, e.message);
  res.status(500).json({ message: 'Erreur serveur.' });
}
const id = (req) => parseInt(req.params.id, 10);
const g = (req) => req.user.id;

router.get('/annonces', async (req, res) => { try { res.json({ annonces: await svc.listerGestionnaire(g(req)) }); } catch (e) { erreur(res, e, 'GET annonces'); } });
router.post('/annonces', async (req, res) => { try { res.status(201).json({ id: await svc.creer(g(req), req.body || {}) }); } catch (e) { erreur(res, e, 'POST annonces'); } });
router.put('/annonces/:id', async (req, res) => { try { await svc.modifier(g(req), id(req), req.body || {}); res.json({ success: true }); } catch (e) { erreur(res, e, 'PUT annonce'); } });
router.post('/annonces/:id/statut', async (req, res) => { try { await svc.changerStatut(g(req), id(req), (req.body || {}).statut); res.json({ success: true }); } catch (e) { erreur(res, e, 'statut annonce'); } });
router.post('/annonces/:id/renouveler', async (req, res) => { try { await svc.renouveler(g(req), id(req), (req.body || {}).dureeJours); res.json({ success: true }); } catch (e) { erreur(res, e, 'renouveler'); } });
router.delete('/annonces/:id', async (req, res) => { try { await svc.supprimer(g(req), id(req)); res.json({ success: true }); } catch (e) { erreur(res, e, 'DELETE annonce'); } });
router.get('/messages', async (req, res) => { try { res.json({ messages: await svc.messages(g(req)) }); } catch (e) { erreur(res, e, 'GET messages'); } });
router.post('/messages/:id/lu', async (req, res) => { try { await svc.marquerLu(g(req), id(req), (req.body || {}).lu); res.json({ success: true }); } catch (e) { erreur(res, e, 'lu'); } });
router.delete('/messages/:id', async (req, res) => { try { await svc.supprimerMessage(g(req), id(req)); res.json({ success: true }); } catch (e) { erreur(res, e, 'DELETE message'); } });
router.get('/reglages', async (req, res) => { try { res.json(await svc.reglages(g(req))); } catch (e) { erreur(res, e, 'GET reglages'); } });
router.put('/reglages', async (req, res) => { try { res.json(await svc.sauverReglages(g(req), req.body || {})); } catch (e) { erreur(res, e, 'PUT reglages'); } });

module.exports = router;