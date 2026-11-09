// CHEMIN : routes/pwa_boutique.js
// Add-on « App installable (PWA) ». Monté sur : /api/pwa-boutique
//   PUBLIC  GET  /manifest.webmanifest   → manifest de la boutique selon le domaine visité
//   PUBLIC  POST /installation           → compte une installation { device_id, plateforme }
//   GESTIONNAIRE (add-on actif) :
//   GET    /gestionnaire                 → configuration + statistiques
//   POST   /gestionnaire                 → enregistrer nom / nom court / couleurs
//   POST   /gestionnaire/icone           → téléverser l'icône (PNG carré, min 512 x 512)
//   DELETE /gestionnaire/icone           → retirer l'icône (la PWA se désactive)

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const addons = require('../services/studio_addons');
const svc = require('../services/studio_pwa_boutique');

const router = express.Router();
const FUSEAU = 'America/Toronto';
const MEDIA_URL = 'https://media.e-vend.ca';

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
router.get('/manifest.webmanifest', async (req, res) => {
  try {
    const p = await svc.pwaPourHote(req.hostname);
    if (!p) return res.status(404).json({ error: 'Aucune app pour ce domaine' });
    res.set('Cache-Control', 'public, max-age=300');
    res.type('application/manifest+json').send(JSON.stringify(svc.manifestPour(p)));
  } catch (e) {
    console.error('[pwa_boutique] manifest', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Limiteur mémoire (route publique) : 20 appels / heure / IP
const appelsParIp = new Map();
function limiteur(req, res, next) {
  const ip = req.ip || 'inconnue';
  const maintenant = Date.now();
  const recents = (appelsParIp.get(ip) || []).filter((t) => maintenant - t < 3600 * 1000);
  if (recents.length >= 20) return res.status(429).json({ error: 'Trop de requêtes' });
  recents.push(maintenant);
  appelsParIp.set(ip, recents);
  next();
}
setInterval(() => {
  const m = Date.now();
  for (const [ip, ts] of appelsParIp) if (!ts.some((t) => m - t < 3600 * 1000)) appelsParIp.delete(ip);
}, 3600 * 1000).unref();

router.post('/installation', limiteur, express.json({ limit: '2kb' }), async (req, res) => {
  try {
    const { device_id, plateforme } = req.body || {};
    if (typeof device_id !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(device_id)) {
      return res.status(400).json({ error: 'device_id invalide' });
    }
    // La boutique vient du domaine visité (jamais d'un champ envoyé par le navigateur)
    const p = await svc.pwaPourHote(req.hostname);
    if (!p) return res.status(404).json({ error: 'Aucune app pour ce domaine' });
    const plat = ['android', 'ios', 'desktop'].includes(plateforme) ? plateforme : null;
    const ua = String(req.get('user-agent') || '').slice(0, 300);

    const deja = await pool.query(
      `SELECT 1 FROM pwa_boutique_installations
       WHERE gestionnaire_id = $1 AND device_id = $2 AND installed_at > NOW() - INTERVAL '1 minute' LIMIT 1`,
      [p.gid, device_id]
    );
    if (deja.rows.length) return res.json({ success: true, doublon: true });

    await pool.query(
      'INSERT INTO pwa_boutique_installations (gestionnaire_id, device_id, plateforme, user_agent) VALUES ($1, $2, $3, $4)',
      [p.gid, device_id, plat, ua]
    );
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('[pwa_boutique] installation', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── GESTIONNAIRE ─────────────────────────────────────────────────────────────
const gest = express.Router();
router.use('/gestionnaire', gest);

gest.use(authenticateToken);
gest.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  next();
});
gest.use(async (req, res, next) => {
  try {
    if (!(await addons.addonActifRapide(req.user.id, svc.CODE_ADDON, pool))) {
      return res.status(403).json({ error: "L'add-on « App installable (PWA) » n'est pas activé pour votre marketplace." });
    }
    next();
  } catch (e) {
    console.error('[pwa_boutique] add-on', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const COULEUR_RE = svc.COULEUR_RE;
const nettoyer = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max) : '');

async function statistiques(gid) {
  const d = (await pool.query(`
    SELECT
      date_trunc('day',   NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS jour,
      date_trunc('week',  NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS semaine,
      date_trunc('month', NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS mois,
      date_trunc('year',  NOW() AT TIME ZONE '${FUSEAU}') AT TIME ZONE '${FUSEAU}' AS annee`)).rows[0];
  const params = [gid, d.jour, d.semaine, d.mois, d.annee];
  const inst = (await pool.query(`
    SELECT COUNT(*) FILTER (WHERE installed_at >= $2)::int AS jour,
           COUNT(*) FILTER (WHERE installed_at >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE installed_at >= $4)::int AS mois,
           COUNT(*) FILTER (WHERE installed_at >= $5)::int AS annee,
           COUNT(*)::int AS total
    FROM pwa_boutique_installations WHERE gestionnaire_id = $1`, params)).rows[0];
  // « appareils » = première installation de chaque appareil (une réinstallation ne compte pas)
  const app = (await pool.query(`
    WITH premiere AS (
      SELECT device_id, MIN(installed_at) AS p FROM pwa_boutique_installations WHERE gestionnaire_id = $1 GROUP BY device_id
    )
    SELECT COUNT(*) FILTER (WHERE p >= $2)::int AS jour,
           COUNT(*) FILTER (WHERE p >= $3)::int AS semaine,
           COUNT(*) FILTER (WHERE p >= $4)::int AS mois,
           COUNT(*) FILTER (WHERE p >= $5)::int AS annee,
           COUNT(*)::int AS total
    FROM premiere`, params)).rows[0];
  const plat = (await pool.query(
    `SELECT COALESCE(plateforme, 'autre') AS plateforme, COUNT(DISTINCT device_id)::int AS n
     FROM pwa_boutique_installations WHERE gestionnaire_id = $1 GROUP BY 1`, [gid])).rows;
  return { appareils: app, installations: inst, plateformes: plat };
}

async function lireConfig(gid) {
  const g = await pool.query(
    `SELECT g.nom_boutique, c.nom_app, c.nom_court, c.couleur_theme, c.couleur_fond, c.icone_url
     FROM gestionnaires g LEFT JOIN gestionnaire_pwa_config c ON c.gestionnaire_id = g.id WHERE g.id = $1`, [gid]);
  const r = g.rows[0] || {};
  return {
    nom_boutique: r.nom_boutique || '',
    nom_app: r.nom_app || '',
    nom_court: r.nom_court || '',
    couleur_theme: r.couleur_theme || svc.THEME_DEFAUT,
    couleur_fond: r.couleur_fond || svc.FOND_DEFAUT,
    icone_url: r.icone_url || null,
    active: !!r.icone_url,
  };
}

gest.get('/', async (req, res) => {
  try {
    res.json({ ...(await lireConfig(req.user.id)), stats: await statistiques(req.user.id) });
  } catch (e) {
    console.error('[pwa_boutique] GET', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

gest.post('/', express.json({ limit: '4kb' }), async (req, res) => {
  try {
    const b = req.body || {};
    const nom = nettoyer(b.nom_app, 45);
    const court = nettoyer(b.nom_court, 12);
    const theme = String(b.couleur_theme || '').trim();
    const fond = String(b.couleur_fond || '').trim();
    if (!COULEUR_RE.test(theme) || !COULEUR_RE.test(fond)) {
      return res.status(400).json({ error: 'Les couleurs doivent être au format #rrggbb (ex. #2d6a9f).' });
    }
    await pool.query(
      `INSERT INTO gestionnaire_pwa_config (gestionnaire_id, nom_app, nom_court, couleur_theme, couleur_fond, updated_at)
       VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4, $5, NOW())
       ON CONFLICT (gestionnaire_id) DO UPDATE
         SET nom_app = EXCLUDED.nom_app, nom_court = EXCLUDED.nom_court,
             couleur_theme = EXCLUDED.couleur_theme, couleur_fond = EXCLUDED.couleur_fond, updated_at = NOW()`,
      [req.user.id, nom, court, theme, fond]
    );
    svc.viderCache();
    res.json({ ok: true, ...(await lireConfig(req.user.id)) });
  } catch (e) {
    console.error('[pwa_boutique] POST', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Icône ──
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const envoi = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } }).single('file');

// Lit la taille dans l'en-tête PNG (signature + bloc IHDR). Retourne { w, h } ou null.
function taillePng(b) {
  if (!Buffer.isBuffer(b) || b.length < 33) return null;
  if (b.readUInt32BE(0) !== 0x89504e47 || b.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const envois = new Map();
gest.post('/icone', (req, res) => {
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
      if (!t) return res.status(400).json({ error: 'Format non accepté : l\'icône doit être une image PNG.' });
      if (t.w !== t.h) return res.status(400).json({ error: `L'icône doit être carrée (la vôtre fait ${t.w} x ${t.h}).` });
      if (t.w < 512) return res.status(400).json({ error: `L'icône est trop petite (${t.w} x ${t.h}). Minimum : 512 x 512.` });
      if (t.w > 2048) return res.status(400).json({ error: `L'icône est trop grande (${t.w} x ${t.h}). Maximum : 2048 x 2048.` });

      const cle = `studio/pwa/${req.user.id}/${crypto.randomBytes(16).toString('hex')}.png`;
      await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_PRODUITS, Key: cle, Body: req.file.buffer, ContentType: 'image/png' }));
      const url = `${MEDIA_URL}/${cle}`;
      await pool.query(
        `INSERT INTO gestionnaire_pwa_config (gestionnaire_id, icone_url, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (gestionnaire_id) DO UPDATE SET icone_url = EXCLUDED.icone_url, updated_at = NOW()`,
        [req.user.id, url]
      );
      svc.viderCache();
      res.status(201).json({ ok: true, icone_url: url });
    } catch (e) {
      console.error('[pwa_boutique] icone', e.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
});

gest.delete('/icone', async (req, res) => {
  try {
    await pool.query('UPDATE gestionnaire_pwa_config SET icone_url = NULL, updated_at = NOW() WHERE gestionnaire_id = $1', [req.user.id]);
    svc.viderCache();
    res.json({ ok: true });
  } catch (e) {
    console.error('[pwa_boutique] DELETE icone', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;