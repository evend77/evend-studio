// CHEMIN : routes/cagnotte_campagne.js
// e-Vend Studio — Cagnotte : campagne du gestionnaire (prix fixe de publication). Monté sur : /api/cagnotte/campagne
//   GET  /etat      → état, prix, taxes, vérifications avant publication
//   POST /devis     → { province } → prix + taxes + total pour cette province
//   POST /verifier  → vérifie auprès de Stripe si le paiement de publication est fait (au retour de la page de paiement)
//   POST /payer     → { province } → crée le paiement (Stripe de l'admin) et renvoie checkout_url
//   POST /fermer    → ferme la campagne maintenant (remboursement partiel si aucun don)

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const camp = require('../services/cagnotte_campagnes');

const router = express.Router();
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ message: 'Accès réservé aux gestionnaires.' });
  next();
});

function erreur(res, e, contexte) {
  if (e instanceof camp.ErreurCagnotte) return res.status(e.statut).json({ message: e.message });
  console.error(`❌ ${contexte} :`, e.message);
  res.status(500).json({ message: 'Erreur serveur.' });
}

router.get('/etat', async (req, res) => {
  try { res.json(await camp.etat(req.user.id)); } catch (e) { erreur(res, e, 'GET /cagnotte/campagne/etat'); }
});

router.post('/devis', async (req, res) => {
  try {
    const province = String((req.body || {}).province || '').toUpperCase();
    if (!camp.PROVINCES.includes(province)) return res.status(400).json({ message: 'Province invalide.' });
    const rg = await camp.reglages();
    const site = await camp.siteDuGestionnaire(req.user.id);
    const objectif = Number(site && camp.configSite(site).objectifMontant) || 0;
    if (!(objectif > 0)) return res.status(400).json({ message: "Indiquez d'abord l'objectif de votre campagne." });
    const d = camp.devis(rg, objectif, province);
    res.json({ palier: d.palier.nom, prix: d.prixC / 100, taxes: d.taxes.totalC / 100, label_taxes: d.taxes.label, total: d.totalC / 100, devise: rg.devise });
  } catch (e) { erreur(res, e, 'POST /cagnotte/campagne/devis'); }
});

router.post('/payer', async (req, res) => {
  try {
    const province = String((req.body || {}).province || '').toUpperCase();
    res.json(await camp.creerPaiementPublication(req.user.id, province));
  } catch (e) { erreur(res, e, 'POST /cagnotte/campagne/payer'); }
});

router.post('/verifier', async (req, res) => {
  try { res.json({ success: true, ...(await camp.verifierPaiement(req.user.id)) }); } catch (e) { erreur(res, e, 'POST /cagnotte/campagne/verifier'); }
});

router.post('/fermer', async (req, res) => {
  try { res.json({ success: true, ...(await camp.fermerParGestionnaire(req.user.id)) }); } catch (e) { erreur(res, e, 'POST /cagnotte/campagne/fermer'); }
});

module.exports = router;