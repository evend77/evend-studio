// CHEMIN : routes/effets_boutique.js
// Add-on « Effets de boutique ». Monté sur : /api/effets-boutique
//   PUBLIC  GET  /public/:gid        → effets + musique à dessiner sur la boutique (vide si l'add-on n'est pas actif)
//   GESTIONNAIRE (add-on actif)
//     GET   /gestionnaire            → réglages enregistrés + musiques disponibles
//     POST  /gestionnaire            → enregistre les réglages (saison, effets, vente, musique)
//   ADMIN (catalogue de musiques, page « Musiques »)
//     GET/POST /admin/musiques · PUT/DELETE /admin/musiques/:id
//     GET/POST /admin/categories · DELETE /admin/categories/:id

'use strict';

const express = require('express');
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const svc = require('../services/studio_effets_boutique');

const router = express.Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
// Petit cache en mémoire (20 s) pour ne pas interroger la base à chaque page vue ; vidé à chaque enregistrement.
// Côté navigateur / Cloudflare : AUCUN cache, pour que vos changements apparaissent tout de suite.
const cachePub = new Map();
const viderCachePub = (gid) => { if (gid) cachePub.delete(gid); else cachePub.clear(); };
setInterval(() => cachePub.clear(), 10 * 60 * 1000).unref();

router.get('/public/:gid', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const gid = parseInt(req.params.gid, 10);
    if (!Number.isInteger(gid) || gid <= 0) return res.json({ actif: false });
    const memo = cachePub.get(gid);
    if (memo && Date.now() - memo.t < 20000) return res.json(memo.d);
    let d = { actif: false };
    if (await svc.actif(gid)) {
      const c = await svc.lire(gid);
      const rien = !c.saison && !c.venteEffets.length && !c.musiqueUrl;
      d = { actif: !rien, saison: c.saison, effets: c.effets, effetsConfig: c.effetsConfig,
        venteEffets: c.venteEffets, venteEffetsConfig: c.venteEffetsConfig, musiqueUrl: c.musiqueUrl, musiqueConfig: c.musiqueConfig };
    }
    if (cachePub.size > 500) cachePub.clear();
    cachePub.set(gid, { t: Date.now(), d });
    res.json(d);
  } catch (e) {
    console.error('[effets_boutique] public', e.message);
    res.json({ actif: false });
  }
});

// ─── ADMIN : catalogue de musiques ───────────────────────────────────────────
// Les fichiers mp3 sont téléversés dans Paramètres → Photo → onglet Audio ; ici on crée la « fiche ».
const DOMAINES = (process.env.MUSIQUES_DOMAINES || 'https://media.e-vend.ca/,https://admin-media.e-vend.ca/')
  .split(',').map((s) => s.trim()).filter(Boolean);
const urlValide = (u) => typeof u === 'string' && u.length < 500 && DOMAINES.some((d) => u.startsWith(d));

function slugifier(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '').slice(0, 50);
}
async function slugUnique(nom) {
  const base = slugifier(nom) || 'piste-' + Date.now();
  let slug = base, n = 2;
  while ((await pool.query('SELECT 1 FROM effets_musiques WHERE slug = $1', [slug])).rows.length) slug = `${base}-${n++}`;
  return slug;
}
const erreur = (res, e, ctx) => { console.error('[effets_boutique]', ctx, e.message); res.status(500).json({ error: 'Erreur serveur' }); };

router.get('/admin/categories', authenticateToken, isAdmin, async (req, res) => {
  try { res.json({ categories: (await pool.query('SELECT id, nom FROM effets_musiques_categories ORDER BY nom')).rows }); }
  catch (e) { erreur(res, e, 'cat list'); }
});
router.post('/admin/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const nom = String((req.body && req.body.nom) || '').trim().slice(0, 60);
    if (!nom) return res.status(400).json({ error: 'Le nom de la catégorie est requis.' });
    const ex = await pool.query('SELECT nom FROM effets_musiques_categories WHERE LOWER(nom) = LOWER($1)', [nom]);
    if (ex.rows.length) return res.status(409).json({ error: `La catégorie « ${ex.rows[0].nom} » existe déjà.` });
    const r = await pool.query('INSERT INTO effets_musiques_categories (nom) VALUES ($1) RETURNING id, nom', [nom]);
    res.status(201).json({ categorie: r.rows[0] });
  } catch (e) { erreur(res, e, 'cat add'); }
});
router.delete('/admin/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM effets_musiques_categories WHERE id = $1 RETURNING id', [parseInt(req.params.id, 10) || 0]);
    if (!r.rows.length) return res.status(404).json({ error: 'Catégorie introuvable.' });
    res.json({ message: 'Catégorie retirée de la liste.' });
  } catch (e) { erreur(res, e, 'cat del'); }
});

router.get('/admin/musiques', authenticateToken, isAdmin, async (req, res) => {
  try { res.json({ musiques: (await pool.query('SELECT id, slug, nom, categorie, emoji, url, actif, cree_le FROM effets_musiques ORDER BY cree_le DESC')).rows }); }
  catch (e) { erreur(res, e, 'mus list'); }
});
router.post('/admin/musiques', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom, categorie, emoji, url } = req.body || {};
    if (!nom || !String(nom).trim()) return res.status(400).json({ error: 'Le nom est requis.' });
    if (!urlValide(url)) return res.status(400).json({ error: "L'URL doit venir de votre stockage (téléversez d'abord le mp3 dans Paramètres → Photo → Audio)." });
    const nomP = String(nom).trim().slice(0, 100);
    const r = await pool.query(
      `INSERT INTO effets_musiques (slug, nom, categorie, emoji, url) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, slug, nom, categorie, emoji, url, actif, cree_le`,
      [await slugUnique(nomP), nomP, String(categorie || '').trim().slice(0, 60) || 'Général', String(emoji || '').trim().slice(0, 10) || '🎵', url]);
    viderCachePub();
    res.status(201).json({ musique: r.rows[0] });
  } catch (e) { erreur(res, e, 'mus add'); }
});
router.put('/admin/musiques/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const b = req.body || {}, champs = [], vals = [];
    let i = 1;
    if (b.nom !== undefined) { champs.push(`nom = $${i++}`); vals.push(String(b.nom).trim().slice(0, 100)); }
    if (b.categorie !== undefined) { champs.push(`categorie = $${i++}`); vals.push(String(b.categorie).trim().slice(0, 60) || 'Général'); }
    if (b.emoji !== undefined) { champs.push(`emoji = $${i++}`); vals.push(String(b.emoji).trim().slice(0, 10) || '🎵'); }
    if (b.url !== undefined) {
      if (!urlValide(b.url)) return res.status(400).json({ error: 'URL non autorisée.' });
      champs.push(`url = $${i++}`); vals.push(b.url);
    }
    if (b.actif !== undefined) { champs.push(`actif = $${i++}`); vals.push(!!b.actif); }
    if (!champs.length) return res.status(400).json({ error: 'Aucun champ à modifier.' });
    vals.push(parseInt(req.params.id, 10) || 0);
    const r = await pool.query(`UPDATE effets_musiques SET ${champs.join(', ')} WHERE id = $${i} RETURNING id, slug, nom, categorie, emoji, url, actif, cree_le`, vals);
    if (!r.rows.length) return res.status(404).json({ error: 'Piste introuvable.' });
    viderCachePub();
    res.json({ musique: r.rows[0] });
  } catch (e) { erreur(res, e, 'mus put'); }
});
router.delete('/admin/musiques/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10) || 0;
    const ex = await pool.query('SELECT slug FROM effets_musiques WHERE id = $1', [id]);
    if (!ex.rows.length) return res.status(404).json({ error: 'Piste introuvable.' });
    await pool.query('DELETE FROM effets_musiques WHERE id = $1', [id]);
    await pool.query('UPDATE gestionnaire_effets SET musique_slug = NULL WHERE musique_slug = $1', [ex.rows[0].slug]);
    viderCachePub();
    res.json({ message: 'Piste supprimée.' });
  } catch (e) { erreur(res, e, 'mus del'); }
});

// ─── GESTIONNAIRE ────────────────────────────────────────────────────────────
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'gestionnaire') return res.status(403).json({ error: 'Accès réservé aux gestionnaires' });
  next();
});
router.use(async (req, res, next) => {
  try {
    if (!(await svc.actif(req.user.id))) return res.status(403).json({ error: "L'add-on « Effets de boutique » n'est pas activé pour votre marketplace." });
    next();
  } catch (e) { erreur(res, e, 'addon'); }
});

router.get('/gestionnaire', async (req, res) => {
  try {
    const config = await svc.lire(req.user.id);
    const musiques = (await pool.query(
      'SELECT slug AS id, nom, categorie, emoji, url FROM effets_musiques WHERE actif = TRUE ORDER BY categorie, nom')).rows;
    res.json({ config, musiques });
  } catch (e) { erreur(res, e, 'get'); }
});

router.post('/gestionnaire', express.json({ limit: '50kb' }), async (req, res) => {
  try {
    const v = svc.valider(req.body);
    if (v.musique) {
      const ok = await pool.query('SELECT 1 FROM effets_musiques WHERE slug = $1 AND actif = TRUE', [v.musique]);
      if (!ok.rows.length) v.musique = null;
    }
    await pool.query(
      `INSERT INTO gestionnaire_effets (gestionnaire_id, saison_active, effets_actifs, effets_config, vente_effets_actifs, vente_effets_config, musique_slug, musique_config, updated_at)
       VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8::jsonb,NOW())
       ON CONFLICT (gestionnaire_id) DO UPDATE SET saison_active = EXCLUDED.saison_active, effets_actifs = EXCLUDED.effets_actifs,
         effets_config = EXCLUDED.effets_config, vente_effets_actifs = EXCLUDED.vente_effets_actifs, vente_effets_config = EXCLUDED.vente_effets_config,
         musique_slug = EXCLUDED.musique_slug, musique_config = EXCLUDED.musique_config, updated_at = NOW()`,
      [req.user.id, v.saison, JSON.stringify(v.effets), JSON.stringify(v.effetsConfig), JSON.stringify(v.venteEffets),
       JSON.stringify(v.venteEffetsConfig), v.musique, JSON.stringify(v.musiqueConfig)]);
    viderCachePub(req.user.id);
    res.json({ ok: true, config: await svc.lire(req.user.id) });
  } catch (e) { erreur(res, e, 'post'); }
});

module.exports = router;