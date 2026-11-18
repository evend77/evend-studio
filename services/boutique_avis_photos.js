// CHEMIN : services/boutique_avis_photos.js
// e-Vend Studio — Add-on « Avis clients » (boutique solo) : photos jointes à un avis, stockées sur Cloudflare R2 (même bucket que le MV : R2_BUCKET_AVIS, domaine avis.e-vend.ca).
// Clé : boutique/<gestionnaire>/<acheteur>/<aléatoire>.<ext> — le préfixe « boutique/ » sépare ces photos de celles du MV.
// Contrôle du contenu réel du fichier (JPEG, PNG, WebP), 5 Mo maximum.

'use strict';

const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const DOMAINE = 'https://avis.e-vend.ca';
const MAX_OCTETS = 5 * 1024 * 1024;

let s3 = null;
const client = () => s3 || (s3 = new S3Client({
  region: 'auto', endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
}));

function extensionSelonContenu(b) {
  if (!Buffer.isBuffer(b) || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') return 'png';
  if (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}
const MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Préfixe d'URL des photos d'un acheteur dans une boutique (sert aussi à vérifier qu'une URL reçue lui appartient). */
const prefixe = (gid, acheteurId) => `${DOMAINE}/boutique/${gid}/${acheteurId}/`;
const urlValide = (url, gid, acheteurId) =>
  typeof url === 'string' && url.length < 300 && url.startsWith(prefixe(gid, acheteurId)) && !url.includes('..') && /\.(jpg|png|webp)$/.test(url) && /^[A-Za-z0-9_\-./:]+$/.test(url);

async function envoyer(gid, acheteurId, buffer) {
  const ext = extensionSelonContenu(buffer);
  if (!ext) return { erreur: 'Format non accepté (JPEG, PNG ou WebP seulement).' };
  if (!process.env.R2_BUCKET_AVIS) return { erreur: "L'envoi de photos n'est pas disponible pour le moment." };
  const cle = `boutique/${gid}/${acheteurId}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
  await client().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_AVIS, Key: cle, Body: buffer, ContentType: MIMES[ext] }));
  return { url: `${DOMAINE}/${cle}` };
}

/** Supprime des photos de R2 (au mieux : une erreur est journalisée, jamais lancée). */
async function supprimer(urls, gid) {
  if (!process.env.R2_BUCKET_AVIS) return;
  for (const u of Array.isArray(urls) ? urls : []) {
    try {
      if (typeof u !== 'string' || !u.startsWith(`${DOMAINE}/boutique/${gid}/`) || u.includes('..')) continue;
      await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_AVIS, Key: u.slice(DOMAINE.length + 1) }));
    } catch (e) { console.error('[boutique_avis_photos] suppression :', e.message); }
  }
}

module.exports = { MAX_OCTETS, extensionSelonContenu, prefixe, urlValide, envoyer, supprimer };