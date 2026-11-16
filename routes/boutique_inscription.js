// CHEMIN : routes/boutique_inscription.js
// e-Vend Studio — Inscription publique d'un ACHETEUR (templates boutique solo). Monté par routes/boutique_index.js sur :
//   POST /api/boutique/acheteur/:gid/inscription   (aucune connexion requise — monté AVANT la zone connectée)
// La validation suit la config du gestionnaire (champs, âge, termes) : un champ obligatoire manquant est refusé même si la page est contournée.
// Blocage des bots : même principe que routes/acheteurs.js (limiterInscriptions : compteur par adresse IP en mémoire, fenêtre d'une heure).
// Ici le compteur est par boutique + IP, et un champ piège rempli bloque tout de suite.

'use strict';

const express = require('express');
const S = require('../services/boutique_inscription');
const router = express.Router({ mergeParams: true });

const FENETRE_MS = 60 * 60 * 1000;   // une heure
const LIMITE_TENTATIVES = 10;        // tentatives (réussies ou non) par IP et par boutique pendant la fenêtre
const compteurs = new Map();

const cle = (req) => `${parseInt(req.params.gid, 10)}:${req.ip || (req.connection && req.connection.remoteAddress) || 'inconnue'}`;

function limiter(req, res, next) {
  const k = cle(req), maintenant = Date.now();
  let e = compteurs.get(k);
  if (!e || maintenant - e.depuis > FENETRE_MS) { e = { compte: 0, depuis: maintenant }; compteurs.set(k, e); }
  if (e.compte >= LIMITE_TENTATIVES) {
    const minutes = Math.max(1, Math.ceil((e.depuis + FENETRE_MS - maintenant) / 60000));
    console.warn(`⚠️ Rate limit inscription acheteur boutique atteint (${k}, ${e.compte} tentatives)`);
    return res.status(429).json({ message: `Trop de tentatives depuis cette connexion. Réessayez dans ${minutes} minute(s).` });
  }
  e.compte++;
  next();
}
// Nettoyage de la mémoire (comme limiterInscriptions)
setInterval(() => {
  const maintenant = Date.now();
  compteurs.forEach((e, k) => { if (maintenant - e.depuis > FENETRE_MS * 2) compteurs.delete(k); });
}, 15 * 60 * 1000).unref();

router.post('/', limiter, async (req, res) => {
  try {
    const gid = parseInt(req.params.gid, 10);
    if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ message: 'Boutique introuvable' });
    const r = await S.inscrire(gid, req.body);
    // Champ piège rempli = bot certain : blocage immédiat de cette connexion pour la fenêtre
    if (r.leurre) { const e = compteurs.get(cle(req)); if (e) e.compte = LIMITE_TENTATIVES; }
    if (r.statut === 201) return res.status(201).json({ acheteur: r.acheteur });
    return res.status(r.statut).json(r.ferme ? { message: r.message, ferme: true } : { message: r.message });
  } catch (err) {
    console.error('Erreur inscription acheteur boutique:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router._reinitialiserLimites = () => compteurs.clear(); // pour les tests

module.exports = router;