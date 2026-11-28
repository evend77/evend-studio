// CHEMIN : services/vitrines_commun.js
// Outils partagés par les add-ons vitrine « Favicon » et « App installable ».

'use strict';

const pool = require('../db');
const V = require('./vitrines_addons');

const DOMAINE_PRINCIPAL = 'e-vendstudio.ca';
const MEDIA_URL = 'https://media.e-vend.ca';
const MAX_OCTETS = 2 * 1024 * 1024;
const FUSEAU = 'America/Toronto';
const CTRL = /[\u0000-\u001f\u007f<>]/g;

const normaliserHote = (h) => String(h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonSur = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Domaine visité (sous-domaine *.e-vendstudio.ca OU domaine personnalisé) → { gid, nom_boutique, statut, template_id } ou null.
async function siteDeLHote(hote) {
  if (!hote || hote === DOMAINE_PRINCIPAL || hote === 'www.' + DOMAINE_PRINCIPAL || hote === 'localhost') return null;
  const SELECT = 'SELECT g.id AS gid, g.nom_boutique, g.statut, s.template_id FROM sites s JOIN gestionnaires g ON g.id = s.gestionnaire_id WHERE ';
  if (hote.endsWith('.' + DOMAINE_PRINCIPAL)) {
    const etiquette = hote.slice(0, -(DOMAINE_PRINCIPAL.length + 1));
    if (!etiquette || etiquette.includes('.')) return null;
    return (await pool.query(SELECT + 's.sous_domaine = $1 LIMIT 1', [etiquette])).rows[0] || null;
  }
  const sansWww = hote.replace(/^www\./, '');
  return (await pool.query(SELECT + 's.domaine_perso = ANY($1::text[]) LIMIT 1', [[hote, sansWww, 'www.' + sansWww]])).rows[0] || null;
}

// Petit cache mémoire (60 s) par domaine : le serveur ne questionne pas la base à chaque page. Une erreur n'est pas mise en cache.
function memoParHote(nom, calculer) {
  const cache = new Map();
  return {
    async lire(hoteBrut) {
      const hote = normaliserHote(hoteBrut);
      const m = cache.get(hote);
      if (m && Date.now() - m.t < 60 * 1000) return m.v;
      let v;
      try { v = await calculer(hote); } catch (e) { console.warn(`[${nom}] résolution`, e.message); return null; }
      if (cache.size > 500) cache.clear();
      cache.set(hote, { t: Date.now(), v });
      return v;
    },
    vider() { cache.clear(); },
  };
}

async function exigerAddon(gid, code, nom) {
  if (!(await V.actif(gid, code))) throw new V.ErreurAddon(`L'add-on « ${nom} » n'est pas activé pour votre site.`, 403);
}

function taillePng(b) {
  if (!Buffer.isBuffer(b) || b.length < 33) return null;
  if (b.readUInt32BE(0) !== 0x89504e47 || b.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// Stockage R2 (remplaçable dans les tests)
let s3 = null;
function client() {
  if (!process.env.R2_BUCKET_PRODUITS || !process.env.R2_ENDPOINT) throw new V.ErreurAddon("L'envoi d'images n'est pas disponible pour le moment.", 503);
  const { S3Client } = require('@aws-sdk/client-s3');
  return s3 || (s3 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } }));
}
const stockage = {
  async put(cle, buffer) { const c = client(); const { PutObjectCommand } = require('@aws-sdk/client-s3'); await c.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: buffer, ContentType: 'image/png' })); },
  async del(cle) { const c = client(); const { DeleteObjectCommand } = require('@aws-sdk/client-s3'); await c.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle })); },
};

// Supprime une ancienne image, seulement si c'est l'un de NOS fichiers pour ce gestionnaire.
async function supprimerAncien(dossier, gid, url) {
  const pre = `${MEDIA_URL}/vitrine/${dossier}/${gid}/`;
  if (typeof url !== 'string' || !url.startsWith(pre)) return;
  try { await stockage.del(url.slice(MEDIA_URL.length + 1)); } catch (e) { console.warn(`[vitrine ${dossier}] suppression R2`, e.message); }
}

module.exports = { MEDIA_URL, MAX_OCTETS, FUSEAU, CTRL, normaliserHote, esc, jsonSur, siteDeLHote, memoParHote, exigerAddon, taillePng, stockage, supprimerAncien };