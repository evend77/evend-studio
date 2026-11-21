// CHEMIN : routes/boutique_etsy_gestionnaire.js
// e-Vend Studio — Add-on « Connecteur Etsy » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/etsy
//   GET    /etat          → tout d'un coup pour la page : clés (masquées), compte connecté, import
//   GET    /config        POST /config   → lire / enregistrer les clés Etsy « développeur » (champ vide = inchangé ; chiffrées, jamais renvoyées)
//   POST   /tester        → vérifie le Keystring + le Shared secret auprès d'Etsy
//   DELETE /config        → efface les clés
//   POST   /connecter     { retour } → { url } : adresse Etsy où le gestionnaire autorise l'accès à SA boutique
//   DELETE /connexion     → déconnecte le compte Etsy (les annonces importées restent)
//   POST   /importer      → lance l'import de toutes ses annonces actives (arrière-plan ; bloqué si le palier est insuffisant)
//   GET    /import        → progression du dernier import
// Scopé sur le gestionnaire connecté (jamais un id venant du client). Add-on inactif → 403 { addon_inactif: true }.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const svc = require('../services/boutique_etsy');
const imp = require('../services/boutique_etsy_import');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    if (e instanceof svc.ErreurEtsy) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_etsy_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

router.use(authenticateToken);
router.use((req, res, next) => {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  req.gid = id;
  next();
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

router.get('/etat', h(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const config = await svc.etatConfig(req.gid);
  if (!config.addon_actif) return res.json({ config, connexion: null, import: null });
  const [c, i] = await Promise.all([svc.etatConnexion(req.gid), imp.etatImport(req.gid)]);
  res.json({ config, connexion: c.connexion, import: i });
}));

router.get('/config', h(async (req, res) => { res.set('Cache-Control', 'no-store'); res.json(await svc.etatConfig(req.gid)); }));
router.post('/config', h(async (req, res) => { await svc.enregistrerConfig(req.gid, req.body); res.json(await svc.etatConfig(req.gid)); }));
router.post('/tester', h(async (req, res) => { res.json(await svc.tester(req.gid)); }));
router.delete('/config', h(async (req, res) => { await svc.effacerConfig(req.gid); res.json(await svc.etatConfig(req.gid)); }));

router.post('/connecter', h(async (req, res) => { res.json(await svc.demarrerConnexion(req.gid, retourSur(req, (req.body || {}).retour))); }));
router.delete('/connexion', h(async (req, res) => { await svc.deconnecter(req.gid); res.json({ ok: true }); }));

router.post('/importer', h(async (req, res) => {
  const r = await imp.creerImport(req.gid);
  res.status(r.dejaEnCours ? 200 : 202).json({ ok: true, deja_en_cours: r.dejaEnCours });
}));
router.get('/import', h(async (req, res) => { res.set('Cache-Control', 'no-store'); await svc.exigerAddon(req.gid); res.json({ import: await imp.etatImport(req.gid) }); }));

module.exports = router;