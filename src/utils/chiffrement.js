// src/utils/chiffrement.js
// e-Vend Studio — Chiffrement réversible (AES-256-GCM) pour les valeurs qu'on
// doit pouvoir relire en clair plus tard (clés Stripe, secrets de webhook).
// ⚠️ PAS bcrypt — bcrypt est à sens unique, impossible de récupérer la vraie
// valeur, donc inutilisable pour des clés API qu'on doit renvoyer à Stripe.
//
// La clé maîtresse (ENCRYPTION_KEY) vit UNIQUEMENT dans les variables
// d'environnement — jamais en BD. Elle doit faire exactement 32 octets.
// Génère-en une avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// puis mets le résultat (64 caractères hex) dans ENCRYPTION_KEY sur Render.

const crypto = require('crypto');

const ALGORITHME = 'aes-256-gcm';

function cleMaitresse() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY manquante ou invalide (doit être 64 caractères hex = 32 octets).');
  }
  return Buffer.from(hex, 'hex');
}

// Chiffre une chaîne — retourne null si la valeur est vide (rien à chiffrer)
function chiffrer(valeurClaire) {
  if (!valeurClaire) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHME, cleMaitresse(), iv);
  const chiffre = Buffer.concat([cipher.update(String(valeurClaire), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format stocké : iv:tag:données, tout en hex, pour rester simple en une seule colonne TEXT
  return `${iv.toString('hex')}:${tag.toString('hex')}:${chiffre.toString('hex')}`;
}

// Déchiffre une chaîne produite par chiffrer() — retourne null si vide/invalide
function dechiffrer(valeurChiffree) {
  if (!valeurChiffree) return null;
  try {
    const [ivHex, tagHex, donneesHex] = valeurChiffree.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const donnees = Buffer.from(donneesHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHME, cleMaitresse(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(donnees), decipher.final()]).toString('utf8');
  } catch (err) {
    console.error('❌ Erreur déchiffrement:', err.message);
    return null;
  }
}

module.exports = { chiffrer, dechiffrer };