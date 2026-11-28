// CHEMIN : routes/vitrines_outils.js
// Outils des routes « Favicon » et « App installable » des vitrines : accès gestionnaire, erreurs, limites, envoi d'image.

'use strict';

const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const V = require('../services/vitrines_addons');
const { MAX_OCTETS } = require('../services/vitrines_commun');

const seulementGestionnaire = [authenticateToken, (req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  next();
}];

// Enveloppe une route : les erreurs prévues gardent leur message, les autres restent génériques.
const sur = (nom, fn) => async (req, res) => {
  try { await fn(req, res); } catch (e) {
    if (e instanceof V.ErreurAddon) return res.status(e.status).json({ error: e.message });
    console.error(`[${nom}]`, e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Limite en mémoire : `max` appels par `dureeMs` pour une même clé (IP ou gestionnaire).
function limiteur(max, dureeMs, cle) {
  const appels = new Map();
  setInterval(() => {
    const m = Date.now();
    for (const [k, ts] of appels) if (!ts.some((t) => m - t < dureeMs)) appels.delete(k);
  }, dureeMs).unref();
  return (req, res, next) => {
    const k = cle(req), m = Date.now();
    const recents = (appels.get(k) || []).filter((t) => m - t < dureeMs);
    if (recents.length >= max) return res.status(429).json({ error: 'Trop de requêtes. Réessayez plus tard.' });
    recents.push(m); appels.set(k, recents);
    next();
  };
}

const envoi = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_OCTETS, files: 1 } }).single('file');
function recevoirImage(req, res, next) {
  envoi(req, res, (err) => {
    if (err) {
      const gros = err.code === 'LIMIT_FILE_SIZE';
      return res.status(gros ? 413 : 400).json({ error: gros ? 'Image trop lourde (max 2 Mo)' : 'Envoi invalide' });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    next();
  });
}

module.exports = { seulementGestionnaire, sur, limiteur, recevoirImage };