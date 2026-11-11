// CHEMIN : routes/collab_evend.js
// e-Vend Studio — Import des annonces e-Vend côté COLLABORATEUR (lecture seule). Monté dans collab_dashboard.js (après l'authentification) sur /api/collab/:gestionnaireId :
//   GET    /evend            état : pont configuré ? connecté à e-Vend (nombre d'annonces trouvées) ?
//   POST   /evend/connecter  { retour } → { url } : page d'autorisation d'e-Vend (connexion + F2A d'e-Vend)
//   GET    /evend/expedition méthodes d'expédition de son compte e-Vend (à cocher avant l'import)
//   POST   /evend/importer   { categorie_defaut_id?, methodes? } lance l'import en arrière-plan
//   GET    /evend/import     progression du dernier import
//   DELETE /evend            fermer l'accès à e-Vend

const express = require('express');
const pool = require('../db');
const svc = require('../services/studio_evend');
const imp = require('../services/studio_evend_import');
const expMV = require('../services/studio_expedition');
const cfgMV = require('../services/studio_config_mv');

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

  router.get('/evend/expedition', metier(async (req, res) => {
    const jeton = await svc.jetonDe(req.gid, req.cid);
    if (!jeton) bad("Connectez d'abord votre compte e-Vend.", 409);
    const j = await svc.appeler('GET', '/expedition', { jeton });
    const devise = await cfgMV.devise(req.gid, pool);
    const deja = new Set((await pool.query('SELECT transporteur_id FROM collab_methodes_expedition WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND actif = true', [req.cid, req.gid]).catch(() => ({ rows: [] }))).rows.map((x) => x.transporteur_id));
    const ids = new Set(Object.keys(expMV.TRANSPORTEURS).map(Number).concat(expMV.IDS_PERSONNALISES));
    res.json({ methodes: (Array.isArray(j.methodes) ? j.methodes : []).filter((m) => ids.has(Number(m.transporteur_id))).map((m) => {
      const e = expMV.enrichir(m, null, 0, 'QC');
      return { transporteur_id: Number(m.transporteur_id), nom: e.nom, logo: e.logo, libelle_prix: expMV.libellePrix(m, devise), nb_annonces: parseInt(m.nb_annonces, 10) || 0, deja: deja.has(Number(m.transporteur_id)) };
    }) });
  }));

  router.post('/evend/importer', metier(async (req, res) => {
    const e = await svc.etat(req.gid, req.cid);
    if (!e.connexion) bad("Connectez d'abord votre compte e-Vend.", 409);
    const r = await imp.creerImport(req.gid, req.cid, (req.body || {}).categorie_defaut_id, (req.body || {}).methodes);
    res.status(r.dejaEnCours ? 200 : 202).json({ ok: true, deja_en_cours: r.dejaEnCours });
  }));

  router.get('/evend/import', metier(async (req, res) => { res.json({ import: await imp.etatImport(req.cid, req.gid) }); }));

  router.delete('/evend', metier(async (req, res) => { await svc.deconnecter(req.gid, req.cid); res.json({ ok: true }); }));

  return router;
};