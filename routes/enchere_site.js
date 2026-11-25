// CHEMIN : routes/enchere_site.js
// API PUBLIQUE des sites d'enchères (Galerie / Live) — monté sur /api/encheres-studio
'use strict';

const express = require('express');
const ens = require('../services/enchere_site');

const router = express.Router();

// Limiteur simple en mémoire (par IP + clé)
const compteurs = new Map();
function limiter(cle, max, fenetreMs) {
  return (req, res, next) => {
    const k = `${cle}:${req.ip}`;
    const now = Date.now();
    const e = compteurs.get(k);
    if (!e || now > e.fin) { compteurs.set(k, { n: 1, fin: now + fenetreMs }); return next(); }
    if (++e.n > max) return res.status(429).json({ message: 'Trop de requêtes. Réessayez dans un instant.' });
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, v] of compteurs) if (now > v.fin) compteurs.delete(k); }, 60000).unref();

function erreur(res, e, ctx) {
  if (e instanceof ens.ErreurEnchere) return res.status(e.statut).json({ message: e.message, code: e.code });
  console.error(`❌ ${ctx} :`, e.message);
  res.status(500).json({ message: 'Erreur serveur.' });
}

function gid(req, res, next) {
  const n = parseInt(req.params.gid, 10);
  if (!Number.isInteger(n) || n <= 0) return res.status(400).json({ message: 'Identifiant invalide.' });
  req.gid = n;
  next();
}

async function enchOptionnel(req) {
  const t = req.get('x-ens-token');
  const e = t ? await ens.encherisseurParToken(req.gid, t) : null;
  return e ? e.id : null;
}

router.get('/:gid/lots', gid, limiter('lots', 240, 60000), async (req, res) => {
  try {
    const [lots, rg] = await Promise.all([ens.listerPublic(req.gid, await enchOptionnel(req)), ens.reglages(req.gid)]);
    res.json({ lots, serveur_maintenant: new Date().toISOString(), verification_courriel: rg.verification_courriel });
  } catch (e) { erreur(res, e, 'GET lots'); }
});

router.get('/:gid/lots/:id', gid, limiter('lot', 240, 60000), async (req, res) => {
  try { res.json(await ens.detailPublic(req.gid, parseInt(req.params.id, 10), await enchOptionnel(req))); }
  catch (e) { erreur(res, e, 'GET lot'); }
});

router.get('/:gid/ticker', gid, limiter('ticker', 120, 60000), async (req, res) => {
  try { res.json({ mises: await ens.ticker(req.gid) }); } catch (e) { erreur(res, e, 'GET ticker'); }
});

router.post('/:gid/code', gid, limiter('code', 8, 10 * 60000), async (req, res) => {
  try { res.json(await ens.demanderCode(req.gid, (req.body || {}).email, (req.body || {}).prenom)); }
  catch (e) { erreur(res, e, 'POST code'); }
});

router.post('/:gid/verifier', gid, limiter('verif', 20, 10 * 60000), async (req, res) => {
  try { res.json(await ens.verifierCode(req.gid, (req.body || {}).email, (req.body || {}).code)); }
  catch (e) { erreur(res, e, 'POST verifier'); }
});

router.get('/:gid/mes-mises', gid, limiter('mm', 120, 60000), async (req, res) => {
  try {
    const id = await enchOptionnel(req);
    if (!id) return res.status(401).json({ message: 'Vérification requise.', code: 'non_verifie' });
    res.json({ lots: await ens.mesMises(req.gid, id) });
  } catch (e) { erreur(res, e, 'GET mes-mises'); }
});

router.post('/:gid/lots/:id/miser', gid, limiter('miser', 30, 60000), async (req, res) => {
  try {
    const id = await enchOptionnel(req);
    if (!id) return res.status(401).json({ message: 'Veuillez d\'abord vérifier votre courriel.', code: 'non_verifie' });
    const montant = Number((req.body || {}).montant);
    if (!Number.isFinite(montant) || montant <= 0 || montant > 100000000) return res.status(400).json({ message: 'Montant invalide.' });
    res.json(await ens.miser(req.gid, parseInt(req.params.id, 10), id, montant));
  } catch (e) { erreur(res, e, 'POST miser'); }
});

module.exports = router;