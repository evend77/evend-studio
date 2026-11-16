// middleware/auth.js — Vérification JWT
const jwt = require('jsonwebtoken');

// 🔒 Plus de secret de secours écrit dans le code : sans JWT_SECRET, le serveur refuse de démarrer
// (sinon n'importe qui pourrait fabriquer un faux jeton avec le secret connu).
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET manquant dans les variables d\'environnement — démarrage refusé.');
}

function authenticateToken(req, res, next) {
  // Priorité au cookie httpOnly ; fallback sur le header Authorization
  // (compatibilité transitoire, le temps que le frontend migre — 201 fichiers
  // font encore des fetch() avec le token dans le header).
  const cookieToken = req.cookies && req.cookies['evend_studio_token'];
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const token = cookieToken || headerToken;

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
    // Compatibilité 'sponsor' → 'commanditaire'
    if (payload.role === 'sponsor') {
      payload.role = 'commanditaire';
    }
    // ──────────────────────────────────────────────────────────────────────

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

// Propriétaire du compte gestionnaire OU administrateur. Le RÔLE compte : sans lui, un jeton d'acheteur ou de
// commanditaire dont le numéro est le même que celui du gestionnaire passait la vérification « req.user.id === id ».
function estProprietaireOuAdmin(req, gestionnaireId) {
  const u = req.user || {};
  if (u.role === 'admin' || u.role === 'administration') return true;
  return u.role === 'gestionnaire' && Number(u.id) === Number(gestionnaireId);
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
  if (req.user && (req.user.role === 'commanditaire' || req.user.role === 'sponsor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Accès non autorisé. Droits commanditaire requis.' });
  }
}

module.exports = { authenticateToken, isAdmin, isGestionnaire, isCommanditaire, estProprietaireOuAdmin };