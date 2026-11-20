// CHEMIN : routes/boutique_cron_suivi_postescanada.js
// e-Vend Studio — Suivi automatique des colis Postes Canada de la BOUTIQUE solo. Postes Canada n'a pas de webhook : ce cron interroge
// son API de repérage pour chaque commande boutique suivie, avec les identifiants du gestionnaire propriétaire.
// La logique est dans services/boutique_etiquettes.js (suivrePostesCanada).
//
// Mise en place :
//   1. Variable d'environnement CRON_SECRET définie sur le serveur Studio (la même que pour les autres crons).
//   2. server.js :  app.use('/api/cron-suivi-postescanada-boutique', require('./routes/boutique_cron_suivi_postescanada'));
//   3. crontab du VPS :
//      */30 * * * * curl -s -H "x-cron-secret: <CRON_SECRET du serveur Studio>" "https://e-vendstudio.ca/api/cron-suivi-postescanada-boutique" > /dev/null
//      (le secret est accepté dans l'en-tête seulement, jamais dans l'adresse)

const express = require('express');
const crypto = require('crypto');
const svc = require('../services/boutique_etiquettes');

const router = express.Router();

router.get('/', (req, res) => {
  const attendu = Buffer.from(process.env.CRON_SECRET || '');
  const fourni = Buffer.from(String(req.get('x-cron-secret') || ''));
  if (!attendu.length || attendu.length !== fourni.length || !crypto.timingSafeEqual(attendu, fourni)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  res.status(200).json({ demarre: true });
  svc.suivrePostesCanada()
    .then((b) => console.log(`📮 Cron suivi Postes Canada (boutique) terminé — ${JSON.stringify(b)}`))
    .catch((e) => console.error('❌ Erreur cron suivi Postes Canada (boutique) :', e.message));
});

module.exports = router;