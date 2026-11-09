// CHEMIN : routes/favicon_boutique.js
// Add-on « Favicon personnalisé ». Monté sur : /api/favicon-boutique   (gestionnaire seulement)
//   GET     /gestionnaire   → favicon actuel
//   POST    /gestionnaire   → téléverser (PNG carré, 192 à 1024 px, max 2 Mo)
//   DELETE  /gestionnaire   → retirer (la boutique reprend le favicon de la plateforme)

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const addons = require('../services/studio_addons');
const svc = require('../services/studio_favicon_boutique');

const router = express.Router();
const MEDIA_URL = 'https://media.e-vend.ca';
const MIN = 192, MAX = 1024;

router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  next();
});
router.use(async (req, res, next) => {
  try {
    if (!(await addons.addonActifRapide(req.user.id, svc.CODE_ADDON, pool))) {
      return res.status(403).json({ error: "L'add-on « Favicon personnalisé » n'est pas activé pour votre marketplace." });
    }
    next();
  } catch (e) {
    console.error('[favicon_boutique] add-on', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const envoi = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } }).single('file');

function taillePng(b) {
  if (!Buffer.isBuffer(b) || b.length < 33) return null;
  if (b.readUInt32BE(0) !== 0x89504e47 || b.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

router.get('/gestionnaire', async (req, res) => {
  try {
    const r = await pool.query('SELECT favicon_url FROM gestionnaire_favicon WHERE gestionnaire_id = $1', [req.user.id]);
    res.json({ favicon_url: (r.rows[0] && r.rows[0].favicon_url) || null, min: MIN, max: MAX });
  } catch (e) {
    console.error('[favicon_boutique] GET', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const envois = new Map();
router.post('/gestionnaire', (req, res) => {
  const now = Date.now();
  const rec = (envois.get(req.user.id) || []).filter((t) => now - t < 60 * 1000);
  if (rec.length >= 10) return res.status(429).json({ error: "Trop d'envois. Réessayez dans une minute." });
  rec.push(now); envois.set(req.user.id, rec);

  envoi(req, res, async (err) => {
    if (err) {
      const gros = err.code === 'LIMIT_FILE_SIZE';
      return res.status(gros ? 413 : 400).json({ error: gros ? 'Image trop lourde (max 2 Mo)' : 'Envoi invalide' });
    }
    try {
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
      const t = taillePng(req.file.buffer);
      if (!t) return res.status(400).json({ error: 'Format non accepté : le favicon doit être une image PNG.' });
      if (t.w !== t.h) return res.status(400).json({ error: `Le favicon doit être carré (le vôtre fait ${t.w} x ${t.h}).` });
      if (t.w < MIN) return res.status(400).json({ error: `Le favicon est trop petit (${t.w} x ${t.h}). Minimum : ${MIN} x ${MIN}.` });
      if (t.w > MAX) return res.status(400).json({ error: `Le favicon est trop grand (${t.w} x ${t.h}). Maximum : ${MAX} x ${MAX}.` });

      const cle = `studio/favicon/${req.user.id}/${crypto.randomBytes(16).toString('hex')}.png`;
      await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: req.file.buffer, ContentType: 'image/png' }));
      const url = `${MEDIA_URL}/${cle}`;
      await pool.query(
        `INSERT INTO gestionnaire_favicon (gestionnaire_id, favicon_url, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (gestionnaire_id) DO UPDATE SET favicon_url = EXCLUDED.favicon_url, updated_at = NOW()`,
        [req.user.id, url]
      );
      svc.viderCache();
      res.status(201).json({ ok: true, favicon_url: url });
    } catch (e) {
      console.error('[favicon_boutique] POST', e.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
});

router.delete('/gestionnaire', async (req, res) => {
  try {
    await pool.query('UPDATE gestionnaire_favicon SET favicon_url = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [req.user.id]);
    svc.viderCache();
    res.json({ ok: true });
  } catch (e) {
    console.error('[favicon_boutique] DELETE', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;