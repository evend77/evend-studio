// utils/tokenDesabonnement.js
// Jeton signé pour les liens de désabonnement infolettre — empêche :
//  1) qu'un lien puisse être fabriqué pour désabonner l'email de quelqu'un
//     d'autre (il faut connaître le secret serveur pour générer un jeton valide)
//  2) qu'une réponse générique du serveur permette de deviner si un email
//     donné est ou non dans la liste (voir infolettre.js — message identique
//     que le jeton soit invalide ou que l'email n'existe pas)
//
// ⚠️ Ajoute UNSUB_SECRET dans le .env de Studio (une longue chaîne aléatoire,
// ex: `openssl rand -hex 32`). Sans ça, un secret dérivé de JWT_SECRET est utilisé.

const crypto = require('crypto');
const SECRET = process.env.UNSUB_SECRET
  || ('unsub:' + (process.env.JWT_SECRET || 'evend-studio-jwt-secret-2025'));

if (!process.env.UNSUB_SECRET) {
  console.warn('⚠️  UNSUB_SECRET non défini — secret dérivé de JWT_SECRET utilisé. Ajoute UNSUB_SECRET dans le .env de Studio.');
}

function genererToken(email) {
  return crypto.createHmac('sha256', SECRET).update(String(email).trim().toLowerCase()).digest('hex');
}

function verifierToken(email, token) {
  if (!email || !token) return false;
  const attendu = genererToken(email);
  try {
    // Comparaison à temps constant — évite qu'un attaquant devine le jeton
    // caractère par caractère en mesurant le temps de réponse du serveur.
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(attendu, 'hex'));
  } catch {
    return false; // longueur invalide, format non-hex, etc.
  }
}

module.exports = { genererToken, verifierToken };