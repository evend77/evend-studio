// CHEMIN : utils/chiffrement_smtp.js
// Chiffre / déchiffre le mot de passe SMTP d'un gestionnaire (AES-256-GCM).
// Clé : variable d'environnement SMTP_CHIFFREMENT_CLE (64 caractères hexadécimaux = 32 octets).
// À défaut, une clé est dérivée de JWT_SECRET (acceptable, mais définir SMTP_CHIFFREMENT_CLE est préférable).
'use strict';
const crypto = require('crypto');

function cle() {
  const brut = process.env.SMTP_CHIFFREMENT_CLE;
  if (brut && /^[0-9a-fA-F]{64}$/.test(brut)) return Buffer.from(brut, 'hex');
  const base = process.env.JWT_SECRET;
  if (!base) throw new Error('Aucune clé de chiffrement disponible (SMTP_CHIFFREMENT_CLE ou JWT_SECRET).');
  return crypto.createHash('sha256').update('studio-smtp:' + base).digest();
}

function chiffrer(texte) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', cle(), iv);
  const enc = Buffer.concat([c.update(String(texte), 'utf8'), c.final()]);
  return 'v1:' + [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join(':');
}

function dechiffrer(valeur) {
  const m = /^v1:([^:]+):([^:]+):([^:]+)$/.exec(valeur || '');
  if (!m) throw new Error('Mot de passe SMTP illisible.');
  const [iv, tag, enc] = m.slice(1).map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', cle(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

module.exports = { chiffrer, dechiffrer };