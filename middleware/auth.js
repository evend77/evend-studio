// middleware/auth.js — Vérification JWT
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // ── Compatibilité transitoire ──────────────────────────────────────────
    // Les anciens tokens émis avec role: 'vendeur' sont automatiquement
    // traités comme role: 'gestionnaire' le temps que tous les utilisateurs
    // se reconnectent et obtiennent un nouveau token.
    if (payload.role === 'vendeur') {
      payload.role = 'gestionnaire';
    }
    // ──────────────────────────────────────────────────────────────────────

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Accès non autorisé. Droits admin requis.' });
  }
}

function isGestionnaire(req, res, next) {
  if (req.user && (req.user.role === 'gestionnaire' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Accès non autorisé. Droits gestionnaire requis.' });
  }
}

function isCommanditaire(req, res, next) {
  if (req.user && (req.user.role === 'commanditaire' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Accès non autorisé. Droits commanditaire requis.' });
  }
}

module.exports = { authenticateToken, isAdmin, isGestionnaire, isCommanditaire };
