// CHEMIN : routes/collab_evend.js
// e-Vend Studio — Import des annonces e-Vend côté COLLABORATEUR (lecture seule). Monté dans collab_dashboard.js (après l'authentification) sur /api/collab/:gestionnaireId :
//   GET    /evend            état : pont configuré ? connecté à e-Vend (nombre d'annonces trouvées) ?
//   POST   /evend/connecter  { retour } → { url } : page d'autorisation d'e-Vend (connexion + F2A d'e-Vend)
//   POST   /evend/importer   { categorie_defaut_id? } lance l'import en arrière-plan
//   GET    /evend/import     progression du dernier import
//   DELETE /evend            fermer l'accès à e-Vend

const express = require('express');
const pool = require('../db');
const svc = require('../services/studio_evend');
const imp = require('../services/studio_evend_import');

imp.demarrer();   // file de travaux dans la base, traitée en arrière-plan

module.exports = function creerRouteur({ h, bad }) {
  const router = express.Router();
  const metier = (fn) => h(async (req, res) => {
    try { await fn(req, res); }
    catch (e) {
      if (e instanceof svc.ErreurEvend) return res.status(e.status === 401 ? 409 : e.status).json({ error: e.message });
      if (e && e.status === 400) return res.status(400).json({ error: e.message });
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

  router.get('/evend', metier(async (req, res) => { res.json(await svc.etat(req.gid, req.cid)); }));

  router.post('/evend/connecter', metier(async (req, res) => {
    if (!svc.configure()) bad("L'import depuis e-Vend n'est pas encore disponible. Contactez le support.", 409);
    const c = (await pool.query('SELECT nom_boutique FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [req.cid, req.gid])).rows[0];
    const { url } = await svc.creerEtat(req.gid, req.cid, retourSur(req, (req.body || {}).retour), (c && c.nom_boutique) || 'Ma boutique Studio');
    res.json({ url });
  }));

  router.post('/evend/importer', metier(async (req, res) => {
    const e = await svc.etat(req.gid, req.cid);
    if (!e.connexion) bad("Connectez d'abord votre compte e-Vend.", 409);
    const r = await imp.creerImport(req.gid, req.cid, (req.body || {}).categorie_defaut_id);
    res.status(r.dejaEnCours ? 200 : 202).json({ ok: true, deja_en_cours: r.dejaEnCours });
  }));

  router.get('/evend/import', metier(async (req, res) => { res.json({ import: await imp.etatImport(req.cid, req.gid) }); }));

  router.delete('/evend', metier(async (req, res) => { await svc.deconnecter(req.gid, req.cid); res.json({ ok: true }); }));

  return router;
};