// CHEMIN : routes/favicon_boutique.js
// Add-on « Favicon personnalisé ». Monté sur : /api/favicon-boutique   (gestionnaire seulement)
//   PUBLIC  POST /retour                → compte un client revenu sur l'onglet pendant l'animation (boutique = domaine visité)
//   GET     /gestionnaire               → favicon + animation + statistiques
//   POST    /gestionnaire               → téléverser le favicon (PNG carré, 192 à 1024 px, max 2 Mo)
//   DELETE  /gestionnaire               → retirer le favicon (la boutique reprend celui de la plateforme)
//   POST    /gestionnaire/animation     → régler l'animation d'onglet (activer, déclencheur, style, émoji, messages)

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

// ─── PUBLIC : retour d'un client sur l'onglet ────────────────────────────────
const appelsParIp = new Map();
function limiteur(req, res, next) {
  const ip = req.ip || 'inconnue';
  const maintenant = Date.now();
  const recents = (appelsParIp.get(ip) || []).filter((t) => maintenant - t < 3600 * 1000);
  if (recents.length >= 60) return res.status(429).json({ error: 'Trop de requêtes' });
  recents.push(maintenant);
  appelsParIp.set(ip, recents);
  next();
}
setInterval(() => {
  const m = Date.now();
  for (const [ip, ts] of appelsParIp) if (!ts.some((t) => m - t < 3600 * 1000)) appelsParIp.delete(ip);
}, 3600 * 1000).unref();

router.post('/retour', limiteur, express.json({ limit: '1kb', type: () => true }), async (req, res) => {
  try {
    // La boutique vient du domaine visité (jamais d'un champ envoyé par le navigateur)
    const p = await svc.pourHote(req.hostname);
    if (!p || !p.anim) return res.status(204).end();
    await pool.query('INSERT INTO favicon_retours (gestionnaire_id, avec_panier) VALUES ($1, $2)', [p.gid, !!(req.body && req.body.panier === true)]);
    res.status(204).end();
  } catch (e) {
    console.error('[favicon_boutique] retour', e.message);
    res.status(204).end();
  }
});

// ─── GESTIONNAIRE ─────────────────────────────────────────────────────────────
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

const FUSEAU = 'America/Toronto';
const CTRL = /[\u0000-\u001f\u007f<>]/g;

async function lireTout(gid) {
  const r = await pool.query(
    `SELECT favicon_url, anim_actif, anim_declencheur, anim_style, anim_emoji, anim_messages
     FROM gestionnaire_favicon WHERE gestionnaire_id = $1`, [gid]);
  const f = r.rows[0] || {};
  const d = (await pool.query(`
    SELECT date_trunc('day',   NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS jour,
           date_trunc('week',  NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS semaine,
           date_trunc('month', NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS mois`)).rows[0];
  const st = (await pool.query(`
    SELECT COUNT(*) FILTER (WHERE cree_le >= $2)::int AS jour,
           COUNT(*) FILTER (WHERE cree_le >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE cree_le >= $4)::int AS mois,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE avec_panier)::int AS total_avec_panier
    FROM favicon_retours WHERE gestionnaire_id = $1`, [gid, d.jour, d.semaine, d.mois])).rows[0];
  return {
    favicon_url: f.favicon_url || null, min: MIN, max: MAX,
    animation: {
      actif: !!f.anim_actif,
      declencheur: f.anim_declencheur || 'inactif',
      style: f.anim_style || 'clignotant',
      emoji: f.anim_emoji || '',
      messages: Array.isArray(f.anim_messages) ? f.anim_messages : [],
    },
    retours: st,
  };
}

router.get('/gestionnaire', async (req, res) => {
  try {
    res.json(await lireTout(req.user.id));
  } catch (e) {
    console.error('[favicon_boutique] GET', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/gestionnaire/animation', express.json({ limit: '8kb' }), async (req, res) => {
  try {
    const b = req.body || {};
    const actif = b.actif === true;
    const declencheur = String(b.declencheur || '');
    const style = String(b.style || '');
    if (!svc.DECLENCHEURS.includes(declencheur)) return res.status(400).json({ error: 'Déclencheur invalide.' });
    if (!svc.STYLES.includes(style)) return res.status(400).json({ error: "Style d'animation invalide." });
    const emoji = String(b.emoji || '').replace(CTRL, '').replace(/["'\\`]/g, '').trim();
    if ([...emoji].length > 4) return res.status(400).json({ error: "L'émoji doit tenir en 1 à 4 caractères (ex. ✨ ou 🛒)." });
    const messages = (Array.isArray(b.messages) ? b.messages : [])
      .map((m) => (typeof m === 'string' ? m.replace(CTRL, '').trim().slice(0, 60) : ''))
      .filter(Boolean).slice(0, 5);
    if (actif && !messages.length) return res.status(400).json({ error: 'Écrivez au moins un message pour activer l\'animation.' });
    await pool.query(
      `INSERT INTO gestionnaire_favicon (gestionnaire_id, anim_actif, anim_declencheur, anim_style, anim_emoji, anim_messages, updated_at)
       VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6::jsonb, NOW())
       ON CONFLICT (gestionnaire_id) DO UPDATE SET anim_actif = EXCLUDED.anim_actif, anim_declencheur = EXCLUDED.anim_declencheur,
         anim_style = EXCLUDED.anim_style, anim_emoji = EXCLUDED.anim_emoji, anim_messages = EXCLUDED.anim_messages, updated_at = NOW()`,
      [req.user.id, actif, declencheur, style, emoji, JSON.stringify(messages)]
    );
    svc.viderCache();
    res.json({ ok: true, ...(await lireTout(req.user.id)) });
  } catch (e) {
    console.error('[favicon_boutique] animation', e.message);
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