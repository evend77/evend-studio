// CHEMIN : routes/annonces_site.js
// API PUBLIQUE des sites de petites annonces — monté sur /api/annonces-studio
'use strict';

const express = require('express');
const svc = require('../services/annonces_site');

const router = express.Router();

const compteurs = new Map();
function limiter(cle, max, fenetreMs) {
  return (req, res, next) => {
    const k = `${cle}:${req.ip}`; const now = Date.now(); const e = compteurs.get(k);
    if (!e || now > e.fin) { compteurs.set(k, { n: 1, fin: now + fenetreMs }); return next(); }
    if (++e.n > max) return res.status(429).json({ message: 'Trop de requêtes. Réessayez dans un instant.' });
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, v] of compteurs) if (now > v.fin) compteurs.delete(k); }, 60000).unref();

// Une vue comptée au plus une fois par IP et par annonce toutes les 30 minutes
const vues = new Map();
function nouvelleVue(ip, id) {
  const k = `${ip}:${id}`; const now = Date.now(); const t = vues.get(k);
  if (t && now - t < 1800000) return false;
  vues.set(k, now); if (vues.size > 20000) vues.clear();
  return true;
}

function erreur(res, e, ctx) {
  if (e instanceof svc.ErreurAnnonce) return res.status(e.statut).json({ message: e.message, code: e.code });
  console.error(`❌ ${ctx} :`, e.message);
  res.status(500).json({ message: 'Erreur serveur.' });
}
function gid(req, res, next) {
  const n = parseInt(req.params.gid, 10);
  if (!Number.isInteger(n) || n <= 0) return res.status(400).json({ message: 'Identifiant invalide.' });
  req.gid = n; next();
}

router.get('/:gid/annonces', gid, limiter('liste', 240, 60000), async (req, res) => {
  try { res.json(await svc.listerPublic(req.gid, req.query || {})); } catch (e) { erreur(res, e, 'GET annonces'); }
});
router.get('/:gid/annonces/:id', gid, limiter('detail', 240, 60000), async (req, res) => {
  try { const id = parseInt(req.params.id, 10); res.json(await svc.detailPublic(req.gid, id, nouvelleVue(req.ip, id))); } catch (e) { erreur(res, e, 'GET annonce'); }
});
router.post('/:gid/annonces/:id/message', gid, limiter('msg', 5, 10 * 60000), async (req, res) => {
  try { res.json(await svc.envoyerMessage(req.gid, parseInt(req.params.id, 10), req.body || {})); } catch (e) { erreur(res, e, 'POST message'); }
});

module.exports = router;