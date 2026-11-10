// CHEMIN : routes/collab_etsy.js
// e-Vend Studio — Connecteur Etsy côté COLLABORATEUR (add-on « Connecteur Etsy »).
// Monté dans collab_dashboard.js (après l'authentification et la vérification de l'add-on) sur /api/collab/:gestionnaireId :
//   GET    /etsy            état (gestionnaire configuré ? compte connecté ?)
//   POST   /etsy/connecter  { retour } → { url } : adresse Etsy où le collaborateur autorise l'accès
//   DELETE /etsy            déconnecter son compte Etsy
//   POST   /etsy/importer   lancer l'import de toutes ses annonces Etsy (en arrière-plan)
//   GET    /etsy/import     progression du dernier import

const express = require('express');
const svc = require('../services/studio_etsy');
const imp = require('../services/studio_etsy_import');

module.exports = function creerRouteur({ h, bad }) {
  const router = express.Router();
  const metier = (fn) => h(async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      if (e instanceof svc.ErreurEtsy) return res.status(e.status).json({ error: e.message });
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

  router.get('/etsy', metier(async (req, res) => { res.json(await svc.etat(req.gid, req.cid)); }));

  router.post('/etsy/connecter', metier(async (req, res) => {
    const cfg = await svc.configGestionnaire(req.gid);
    if (!cfg) bad("Votre gestionnaire n'a pas encore terminé la configuration Etsy. Contactez-le.", 409);
    const { etat, challenge } = await svc.creerEtat(req.gid, req.cid, retourSur(req, (req.body || {}).retour));
    res.json({ url: svc.urlAutorisation(cfg, etat, challenge) });
  }));

  router.post('/etsy/importer', metier(async (req, res) => {
    const e = await svc.etat(req.gid, req.cid);
    if (!e.connexion) bad("Connectez d'abord votre compte Etsy.", 409);
    if (e.connexion.statut !== 'connecte') bad("Reconnectez votre compte Etsy avant d'importer.", 409);
    const r = await imp.creerImport(req.gid, req.cid);
    res.status(r.dejaEnCours ? 200 : 202).json({ ok: true, deja_en_cours: r.dejaEnCours });
  }));

  router.get('/etsy/import', metier(async (req, res) => { res.json({ import: await imp.etatImport(req.cid, req.gid) }); }));

  router.delete('/etsy', metier(async (req, res) => { await svc.deconnecter(req.gid, req.cid); res.json({ ok: true }); }));

  return router;
};