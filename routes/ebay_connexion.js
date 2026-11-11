// CHEMIN : routes/ebay_connexion.js
// Retour d'eBay après que le collaborateur a accepté ou refusé l'accès (adresse FIXE, domaine principal de Studio).
// Monté sur : /api/ebay-connexion      GET /callback   GET /refus
// Aucune session ici : le collaborateur est identifié par l'« état » à usage unique créé quand il a cliqué « Connecter ».

const crypto = require('crypto');
const express = require('express');
const svc = require('../services/studio_ebay');
const evendSvc = require('../services/studio_evend');

const router = express.Router();

function retour(res, url, etat, param = 'ebay') {
  let u;
  try { u = new URL(url); } catch (e) { return res.status(400).send('Lien de retour invalide.'); }
  u.searchParams.set('page', 'dashboard-collaborateur');
  u.searchParams.set(param, etat);
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

// ─── Retour d'Etsy (connecteur Etsy) : adresse à déclarer dans l'app Etsy du gestionnaire ───
const etsySvc = require('../services/studio_etsy');
router.get('/etsy-callback', async (req, res) => {
  let e = null;
  try {
    e = await etsySvc.consommerEtat(req.query.state);
    if (!e) return res.status(400).send('Lien expiré ou invalide. Retournez dans votre tableau de bord et cliquez de nouveau sur « Connecter mon Etsy ».');
    if (req.query.error || !req.query.code) return retour(res, e.retour_url, 'refuse', 'etsy');
    await etsySvc.connecterAvecCode(e.gestionnaire_id, e.collaborateur_id, String(req.query.code), e.code_verifier);
    retour(res, e.retour_url, 'ok', 'etsy');
  } catch (err) {
    console.error('❌ Etsy callback :', err.message);
    if (e) return retour(res, e.retour_url, 'erreur', 'etsy');
    res.status(500).send('Erreur serveur.');
  }
});

// ─── Retour d'e-Vend (pont e-Vend → Studio) : adresse FIXE https://e-vendstudio.ca/api/ebay-connexion/evend-callback ───
// e-Vend renvoie ?etat=…&code=… (code à usage unique) ou ?etat=…&erreur=refuse
router.get('/evend-callback', async (req, res) => {
  let e = null;
  try {
    e = await evendSvc.consommerEtat(req.query.etat);
    if (!e) return res.status(400).send('Lien expiré ou invalide. Retournez dans votre tableau de bord et cliquez de nouveau sur « Connecter mon e-Vend ».');
    if (req.query.erreur || !req.query.code) return retour(res, e.retour_url, 'refuse', 'evend');
    await evendSvc.connecterAvecCode(e.gestionnaire_id, e.collaborateur_id, String(req.query.code));
    retour(res, e.retour_url, 'ok', 'evend');
  } catch (err) {
    console.error('❌ e-Vend callback :', err.message);
    if (e) return retour(res, e.retour_url, 'erreur', 'evend');
    res.status(500).send('Erreur serveur.');
  }
});

// ─── Notification eBay « Marketplace Account Deletion » (obligatoire pour activer les clés de production) ───
// Adresse à donner à eBay :  https://e-vendstudio.ca/api/ebay-connexion/suppression-compte
// Jeton de vérification (32 à 80 caractères) : variable EBAY_VERIFICATION_TOKEN, sinon la valeur ci-dessous.
const JETON_EBAY = process.env.EBAY_VERIFICATION_TOKEN || 'evend-studio-ebay-verification-2026-jeton-v1';
const POINT_FINAL = `${(process.env.PUBLIC_BASE_URL || 'https://e-vendstudio.ca').replace(/\/+$/, '')}/api/ebay-connexion/suppression-compte`;

// 1) Vérification : eBay envoie ?challenge_code=… ; on répond avec SHA-256(code + jeton + adresse)
router.get('/suppression-compte', (req, res) => {
  const code = String(req.query.challenge_code || '');
  if (!code) return res.status(400).json({ error: 'challenge_code manquant' });
  const h = crypto.createHash('sha256').update(code).update(JETON_EBAY).update(POINT_FINAL).digest('hex');
  res.status(200).type('application/json').json({ challengeResponse: h });
});

// 2) Notification réelle : on accuse réception (200). Studio ne garde pas de données d'acheteurs eBay.
router.post('/suppression-compte', express.json({ limit: '100kb' }), (req, res) => {
  try {
    const d = (req.body && req.body.notification && req.body.notification.data) || {};
    console.log('[eBay] suppression de compte reçue :', d.userId ? 'userId reçu' : 'sans userId');
  } catch (e) { /* on répond quand même 200 */ }
  res.sendStatus(200);
});

// Pont Studio → e-Vend (e-Vend lit les annonces Studio du collaborateur) : /api/ebay-connexion/studio-pont/…
router.use('/studio-pont', require('./studio_pont_fournisseur'));

module.exports = router;