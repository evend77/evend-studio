// CHEMIN : routes/cron_suivi_postescanada.js
// e-Vend Studio — Suivi automatique des colis Postes Canada. Postes Canada n'a PAS de webhook (contrairement à Shippo / EasyPost) :
// ce cron interroge son API de repérage pour chaque commande suivie, avec les identifiants du collaborateur propriétaire.
// Adapté de routes/cron-suivi-postescanada.js (e-Vend) ; la logique est dans services/studio_etiquettes.js (suivrePostesCanada).
//
// Mise en place (une seule fois, pour toute la plateforme) :
//   1. Variable d'environnement CRON_SECRET définie sur le serveur (déjà utilisée pour les autres crons si elle existe).
//   2. server.js :  app.use('/api/cron-suivi-postescanada', require('./routes/cron_suivi_postescanada'));
//   3. crontab du VPS :
//      */30 * * * * curl -s -H "x-cron-secret: $CRON_SECRET" "https://e-vendstudio.ca/api/cron-suivi-postescanada" > /dev/null
//      (le secret est accepté dans l'en-tête seulement, jamais dans l'adresse)

const express = require('express');
const crypto = require('crypto');
const svc = require('../services/studio_etiquettes');

const router = express.Router();

router.get('/', (req, res) => {
  const attendu = Buffer.from(process.env.CRON_SECRET || '');
  const fourni = Buffer.from(String(req.get('x-cron-secret') || ''));
  if (!attendu.length || attendu.length !== fourni.length || !crypto.timingSafeEqual(attendu, fourni)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  // Répond tout de suite : le traitement peut durer selon le nombre de commandes actives
  res.status(200).json({ demarre: true });
  svc.suivrePostesCanada()
    .then((b) => console.log(`📮 Cron suivi Postes Canada terminé — ${JSON.stringify(b)}`))
    .catch((e) => console.error('❌ Erreur cron suivi Postes Canada :', e.message));
});

module.exports = router;