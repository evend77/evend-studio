// CHEMIN : routes/ebay_connexion.js
// Retour d'eBay après que le collaborateur a accepté ou refusé l'accès (adresse FIXE, domaine principal de Studio).
// Monté sur : /api/ebay-connexion      GET /callback   GET /refus
// Aucune session ici : le collaborateur est identifié par l'« état » à usage unique créé quand il a cliqué « Connecter ».

const express = require('express');
const svc = require('../services/studio_ebay');

const router = express.Router();

function retour(res, url, etat) {
  let u;
  try { u = new URL(url); } catch (e) { return res.status(400).send('Lien de retour invalide.'); }
  u.searchParams.set('page', 'dashboard-collaborateur');
  u.searchParams.set('ebay', etat);
  u.hash = '';
  res.redirect(302, u.toString());
}

router.get('/callback', async (req, res) => {
  let e = null;
  try {
    e = await svc.consommerEtat(req.query.state);
    if (!e) return res.status(400).send('Lien expiré ou invalide. Retournez dans votre tableau de bord et cliquez de nouveau sur « Connecter mon eBay ».');
    if (req.query.error || !req.query.code) return retour(res, e.retour_url, 'refuse');
    await svc.connecterAvecCode(e.gestionnaire_id, e.collaborateur_id, String(req.query.code));
    retour(res, e.retour_url, 'ok');
  } catch (err) {
    console.error('❌ eBay callback :', err.message);
    if (e) return retour(res, e.retour_url, 'erreur');
    res.status(500).send('Erreur serveur.');
  }
});

router.get('/refus', async (req, res) => {
  try {
    const e = await svc.consommerEtat(req.query.state);
    if (e) return retour(res, e.retour_url, 'refuse');
  } catch (err) { console.error('❌ eBay refus :', err.message); }
  res.status(200).send("Connexion annulée. Vous pouvez fermer cette page et retourner dans votre tableau de bord.");
});

module.exports = router;