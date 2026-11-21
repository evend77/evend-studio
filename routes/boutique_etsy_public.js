// CHEMIN : routes/boutique_etsy_public.js
// e-Vend Studio — Connecteur Etsy (boutique solo) : retour d'Etsy après que le gestionnaire a accepté ou refusé l'accès.
// Monté par routes/boutique_index.js sur /api/boutique/etsy   GET /callback
// Adresse FIXE (domaine principal de Studio) à déclarer comme « Callback URL » dans l'app Etsy du gestionnaire. Aucune session ici : le gestionnaire est identifié
// par l'« état » à usage unique créé quand il a cliqué « Connecter mon Etsy ».

'use strict';

const express = require('express');
const svc = require('../services/boutique_etsy');

const router = express.Router();

function retour(res, url, etat) {
  let u;
  try { u = new URL(url); } catch (e) { return res.status(400).send('Lien de retour invalide.'); }
  u.searchParams.set('etsy', etat);
  u.hash = '';
  res.redirect(302, u.toString());
}

router.get('/callback', async (req, res) => {
  let e = null;
  try {
    e = await svc.consommerEtat(req.query.state);
    if (!e) return res.status(400).send('Lien expiré ou invalide. Retournez dans votre tableau de bord et cliquez de nouveau sur « Connecter mon Etsy ».');
    if (req.query.error || !req.query.code) return retour(res, e.retour_url, 'refuse');
    await svc.connecterAvecCode(e.gestionnaire_id, String(req.query.code), e.code_verifier);
    retour(res, e.retour_url, 'ok');
  } catch (err) {
    console.error('❌ Etsy (boutique) callback :', err.message);
    if (e) return retour(res, e.retour_url, 'erreur');
    res.status(500).send('Erreur serveur.');
  }
});

module.exports = router;