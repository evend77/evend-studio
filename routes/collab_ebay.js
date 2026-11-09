// CHEMIN : routes/collab_ebay.js
// e-Vend Studio — Connecteur eBay côté COLLABORATEUR (add-on « Connecteur eBay »).
// Monté dans collab_dashboard.js (après l'authentification et la vérification de l'add-on) sur /api/collab/:gestionnaireId :
//   GET    /ebay            état (gestionnaire configuré ? compte connecté ?)
//   POST   /ebay/connecter  { retour } → { url } : adresse eBay où le collaborateur autorise l'accès
//   DELETE /ebay            déconnecter son compte eBay

const express = require('express');
const svc = require('../services/studio_ebay');

module.exports = function creerRouteur({ h, bad }) {
  const router = express.Router();

  const metier = (fn) => h(async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      if (e instanceof svc.ErreurEbay) return res.status(e.status).json({ error: e.message });
      throw e;
    }
  });

  // Seule une adresse du même site que la requête est acceptée comme retour (pas de redirection vers un site tiers)
  function retourSur(req, retour) {
    const hote = String(req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
    let u = null;
    try { u = new URL(String(retour || '')); } catch (e) { u = null; }
    if (!u || u.host !== hote || !/^https?:$/.test(u.protocol)) u = new URL(`${proto}://${hote}/`);
    u.hash = '';
    return u.toString();
  }

  router.get('/ebay', metier(async (req, res) => {
    res.json(await svc.etat(req.gid, req.cid));
  }));

  router.post('/ebay/connecter', metier(async (req, res) => {
    const cfg = await svc.configGestionnaire(req.gid);
    if (!cfg) bad("Votre gestionnaire n'a pas encore terminé la configuration eBay. Contactez-le.", 409);
    const etat = await svc.creerEtat(req.gid, req.cid, retourSur(req, (req.body || {}).retour));
    res.json({ url: svc.urlAutorisation(cfg, etat) });
  }));

  router.delete('/ebay', metier(async (req, res) => {
    await svc.deconnecter(req.gid, req.cid);
    res.json({ ok: true });
  }));

  return router;
};