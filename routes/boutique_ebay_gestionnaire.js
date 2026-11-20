// CHEMIN : routes/boutique_ebay_gestionnaire.js
// e-Vend Studio — Add-on « Connecteur eBay » (boutique solo), partie GESTIONNAIRE. Monté par routes/boutique_index.js sur /api/boutique/gestionnaire/ebay
//   GET    /etat          → tout d'un coup pour la page : clés (masquées), compte connecté, import, suivi
//   GET    /config        POST /config   → lire / enregistrer les clés eBay « développeur » (champ vide = inchangé ; secrets chiffrés, jamais renvoyés)
//   POST   /tester        → vérifie l'ID client + le secret auprès d'eBay
//   DELETE /config        → efface les clés
//   POST   /connecter     { retour } → { url } : adresse eBay où le gestionnaire autorise l'accès à SON compte
//   DELETE /connexion     → déconnecte le compte eBay (les annonces importées restent)
//   POST   /importer      → lance l'import de toutes ses annonces (arrière-plan ; bloqué si le palier est insuffisant)
//   GET    /import        → progression du dernier import
//   GET    /suivi         · POST /verifier → suivi des changements (stock, annonces terminées, nouvelles) / demander une vérification
//   GET    /categories    · PUT /categories → associer les catégories eBay à SES catégories ([{ cle, categorie_id|null }])
// Scopé sur le gestionnaire connecté (jamais un id venant du client). Add-on inactif → 403 { addon_inactif: true }.

'use strict';

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { ErreurBoutique } = require('../services/boutique_limites');
const svc = require('../services/boutique_ebay');
const imp = require('../services/boutique_ebay_import');
const suivi = require('../services/boutique_ebay_suivi');

const router = express.Router();

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message, ...e.extra });
    if (e instanceof svc.ErreurEbay) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_ebay_gestionnaire]', req.method, req.path, e && e.message ? e.message : e);
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
  if (!config.addon_actif) return res.json({ config, connexion: null, import: null, suivi: null });
  const [c, i, s] = await Promise.all([svc.etatConnexion(req.gid), imp.etatImport(req.gid), suivi.etatSuivi(req.gid)]);
  res.json({ config, connexion: c.connexion, import: i, suivi: s });
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
router.get('/suivi', h(async (req, res) => { res.set('Cache-Control', 'no-store'); await svc.exigerAddon(req.gid); res.json({ suivi: await suivi.etatSuivi(req.gid) }); }));

// Une demande toutes les 10 minutes au plus (protège la limite d'appels eBay de la boutique)
const derniere = new Map();
router.post('/verifier', h(async (req, res) => {
  await svc.exigerAddon(req.gid);
  const avant = derniere.get(req.gid) || 0;
  if (Date.now() - avant < 10 * 60 * 1000) throw new ErreurBoutique('Une vérification a déjà été demandée récemment. Réessayez dans quelques minutes.', 429);
  derniere.set(req.gid, Date.now());
  if (!(await suivi.demanderVerification(req.gid))) throw new ErreurBoutique("Connectez d'abord votre compte eBay.", 409);
  res.status(202).json({ ok: true });
}));

router.get('/categories', h(async (req, res) => { res.set('Cache-Control', 'no-store'); await svc.exigerAddon(req.gid); res.json(await imp.listerCategories(req.gid)); }));
router.put('/categories', h(async (req, res) => { await svc.exigerAddon(req.gid); res.json(await imp.associerCategories(req.gid, (req.body || {}).associations)); }));

module.exports = router;