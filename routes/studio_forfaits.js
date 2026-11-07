// CHEMIN : routes/studio_forfaits.js
// e-Vend Studio — Forfaits multi-vendeur + add-ons.
// Monté dans server.js sur : /api/studio-forfaits
//
// GESTIONNAIRE (connecté)
//   GET    /mv/plans                 → forfaits MV actifs (avec add-ons inclus)
//   GET    /mv/mon-forfait           → { forfait, addons[], total_ht } (inclus / acheté / disponible)
//   PUT    /mv/mon-forfait           → { plan_id } change de forfait  → { plan, devenus_inclus, perdus }
//   POST   /mv/addons/:code/activer  → achète un add-on (409 s'il est déjà inclus dans le forfait)
//   DELETE /mv/addons/:code          → retire un add-on acheté
//
// ADMIN (Forfaits & Plans MV / Fonctionnalités & add-ons)
//   GET/POST        /admin/mv/plans            ·  PUT/DELETE /admin/mv/plans/:id
//   GET/POST        /admin/addons              ·  PUT/DELETE /admin/addons/:code
//   GET             /admin/mv/gestionnaires    → qui a quel forfait / quels add-ons (lecture seule)

'use strict';

const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const addons = require('../services/studio_addons');

const router = express.Router();
const { authenticateToken } = auth;

const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof addons.ErreurAddon) return res.status(e.status).json({ error: e.message });
    console.error('[studio_forfaits]', req.method, req.path, e.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Gardes ───────────────────────────────────────────────────────────────────
function gestionnaire(req, res, next) {
  const id = parseInt(req.user && req.user.id, 10);
  if (!req.user || req.user.role !== 'gestionnaire' || !Number.isInteger(id)) return res.status(403).json({ error: 'Accès refusé.' });
  req.gid = id;
  next();
}
const estAdmin = (u) => !!u && (u.role === 'admin' || u.role === 'administration');
const admin = [authenticateToken, (req, res, next) => {
  if (!estAdmin(req.user)) return res.status(403).json({ error: 'Accès refusé.' });
  next();
}];
if (typeof auth.verifierPermission === 'function') admin.push(auth.verifierPermission('forfaits'));

// ── Validation ───────────────────────────────────────────────────────────────
const CODE_RE = /^[a-z0-9_]{2,50}$/;
const PLAN_ID_RE = /^[a-z0-9-]{2,50}$/;
const txt = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max) : '');
const num = (v, min, max) => { const n = parseFloat(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; };

async function codesAddonsValides(liste) {
  if (!Array.isArray(liste)) return [];
  const propres = [...new Set(liste.filter(c => typeof c === 'string' && CODE_RE.test(c)))];
  if (!propres.length) return [];
  const r = await pool.query('SELECT code FROM options_studio WHERE code = ANY($1::text[])', [propres]);
  return r.rows.map(x => x.code);
}

// ════════════════════════ GESTIONNAIRE ════════════════════════════════════════

router.get('/mv/plans', authenticateToken, gestionnaire, h(async (req, res) => {
  res.json({ plans: await addons.listerPlansMV({ actifSeulement: true }) });
}));

router.get('/mv/mon-forfait', authenticateToken, gestionnaire, h(async (req, res) => {
  await addons.syncInclus(req.gid).catch((e) => console.error('[studio_forfaits] sync', e.message));   // aligne les add-ons inclus sur le forfait actuel
  const [etat, resume, plans, site] = await Promise.all([
    addons.etatAddonsMV(req.gid),
    addons.resumeFacturationMV(req.gid),
    addons.listerPlansMV({ actifSeulement: true }),
    pool.query('SELECT 1 FROM sites WHERE gestionnaire_id = $1 AND template_id = $2 LIMIT 1', [req.gid, addons.TEMPLATE_MV]),
  ]);
  // est_mv : seuls les gestionnaires dont le site utilise le template multi-vendeur ont un forfait MV à afficher dans « Mes services »
  res.json({ est_mv: site.rowCount > 0, forfait: etat.forfait, addons: etat.addons, lignes: resume.addons, plans, total_ht: resume.total_ht });
}));

router.put('/mv/mon-forfait', authenticateToken, gestionnaire, h(async (req, res) => {
  const planId = txt(req.body && req.body.plan_id, 50);
  if (!PLAN_ID_RE.test(planId)) return res.status(400).json({ error: 'Forfait invalide.' });
  const r = await addons.changerForfaitMV(req.gid, planId);
  res.json({ success: true, ...r });
}));

router.post('/mv/addons/:code/activer', authenticateToken, gestionnaire, h(async (req, res) => {
  const code = String(req.params.code || '');
  if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Add-on invalide.' });
  res.json({ success: true, ...(await addons.activerAddon(req.gid, code)) });
}));

router.delete('/mv/addons/:code', authenticateToken, gestionnaire, h(async (req, res) => {
  const code = String(req.params.code || '');
  if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Add-on invalide.' });
  res.json({ success: true, ...(await addons.desactiverAddon(req.gid, code)) });
}));

// ════════════════════════ ADMIN — FORFAITS MV ═════════════════════════════════

router.get('/admin/mv/plans', ...admin, h(async (req, res) => {
  const [plans, nb] = await Promise.all([
    addons.listerPlansMV({ actifSeulement: false }),
    pool.query(`SELECT plan, COUNT(*)::int AS n FROM gestionnaires GROUP BY plan`),
  ]);
  const compte = new Map(nb.rows.map(r => [r.plan, r.n]));
  res.json({ plans: plans.map(p => ({ ...p, nb_gestionnaires: compte.get(p.plan_id) || 0 })) });
}));

async function lirePlanBody(b) {
  const nom = txt(b.nom, 100);
  const prix = num(b.prix, 0, 100000);
  const vendeurs = num(b.vendeurs_max, 1, 100000);
  const stockage = num(b.stockage_go, 0, 100000);
  if (!nom) return { erreur: 'Le nom est requis.' };
  if (prix === null) return { erreur: 'Prix invalide.' };
  if (vendeurs === null) return { erreur: 'Nombre de vendeurs invalide.' };
  if (stockage === null) return { erreur: 'Stockage invalide.' };
  return {
    nom, prix, vendeurs_max: Math.floor(vendeurs), stockage_go: stockage,
    actif: b.actif !== false,
    ordre: Number.isInteger(parseInt(b.ordre, 10)) ? parseInt(b.ordre, 10) : 0,
    addons_inclus: await codesAddonsValides(b.addons_inclus),
    tous_addons: b.tous_addons === true,
  };
}

router.post('/admin/mv/plans', ...admin, h(async (req, res) => {
  const planId = txt(req.body && req.body.plan_id, 50).toLowerCase();
  if (!PLAN_ID_RE.test(planId) || !planId.startsWith('mv-')) return res.status(400).json({ error: "L'identifiant doit commencer par « mv- » (ex. mv-premium)." });
  const d = await lirePlanBody(req.body || {});
  if (d.erreur) return res.status(400).json({ error: d.erreur });
  const dup = await pool.query('SELECT 1 FROM plans_multivendeur WHERE plan_id = $1', [planId]);
  if (dup.rowCount) return res.status(409).json({ error: 'Cet identifiant existe déjà.' });
  const r = await pool.query(
    `INSERT INTO plans_multivendeur (plan_id, nom, prix, vendeurs_max, stockage_go, actif, ordre, addons_inclus, tous_addons)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [planId, d.nom, d.prix, d.vendeurs_max, d.stockage_go, d.actif, d.ordre, d.addons_inclus, d.tous_addons]
  );
  res.status(201).json({ plan: r.rows[0] });
}));

router.put('/admin/mv/plans/:id', ...admin, h(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide.' });
  const d = await lirePlanBody(req.body || {});
  if (d.erreur) return res.status(400).json({ error: d.erreur });
  const r = await pool.query(
    `UPDATE plans_multivendeur SET nom=$1, prix=$2, vendeurs_max=$3, stockage_go=$4, actif=$5, ordre=$6, addons_inclus=$7, tous_addons=$8 WHERE id=$9 RETURNING *`,
    [d.nom, d.prix, d.vendeurs_max, d.stockage_go, d.actif, d.ordre, d.addons_inclus, d.tous_addons, id]
  );
  if (!r.rowCount) return res.status(404).json({ error: 'Forfait introuvable.' });
  await addons.syncGestionnairesDuPlan(r.rows[0].plan_id).catch((e) => console.error('[studio_forfaits] sync', e.message));
  res.json({ plan: r.rows[0] });
}));

router.delete('/admin/mv/plans/:id', ...admin, h(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identifiant invalide.' });
  const p = await pool.query('SELECT plan_id FROM plans_multivendeur WHERE id = $1', [id]);
  if (!p.rowCount) return res.status(404).json({ error: 'Forfait introuvable.' });
  const n = await pool.query('SELECT COUNT(*)::int AS n FROM gestionnaires WHERE plan = $1', [p.rows[0].plan_id]);
  if (n.rows[0].n > 0) return res.status(409).json({ error: `${n.rows[0].n} gestionnaire(s) utilisent ce forfait. Désactivez-le plutôt que de le supprimer.` });
  await pool.query('DELETE FROM plans_multivendeur WHERE id = $1', [id]);
  res.json({ success: true });
}));

// ════════════════════════ ADMIN — ADD-ONS (fonctionnalités) ═══════════════════

router.get('/admin/addons', ...admin, h(async (req, res) => {
  const [liste, achats, inclus] = await Promise.all([
    addons.listerCatalogue({ actifSeulement: false }),
    pool.query('SELECT code, COUNT(*)::int AS n FROM gestionnaire_addons GROUP BY code'),
    pool.query(`SELECT o.code, array_agg(p.nom ORDER BY p.ordre, p.prix) AS forfaits
                  FROM options_studio o
                  JOIN plans_multivendeur p ON p.tous_addons = true OR o.code = ANY(p.addons_inclus)
                 GROUP BY o.code`),
  ]);
  const nAchats = new Map(achats.rows.map(r => [r.code, r.n]));
  for (const [code, col] of Object.entries(addons.LEGACY_COLS)) {
    const n = await pool.query(`SELECT COUNT(*)::int AS n FROM options_gestionnaire WHERE ${col} = true`);   // col = liste fermée
    nAchats.set(code, n.rows[0].n);
  }
  const parForfait = new Map(inclus.rows.map(r => [r.code, r.forfaits]));
  const out = liste.map(a => ({ ...a, nb_achats: nAchats.get(a.code) || 0, forfaits_inclus: parForfait.get(a.code) || [] }));
  res.json({ addons: out });
}));

function lireAddonBody(b) {
  const nom = txt(b.nom, 150);
  const prix = num(b.prix_ht, 0, 100000);
  if (!nom) return { erreur: 'Le nom est requis.' };
  if (prix === null) return { erreur: 'Prix invalide.' };
  const templates = (Array.isArray(b.templates) ? b.templates : [])
    .filter(t => typeof t === 'string' && /^[a-z0-9-]{2,60}$/.test(t));
  return {
    nom, prix_ht: prix, description: txt(b.description, 1000), emoji: txt(b.emoji, 8) || '🧩',
    guide_url: /^https?:\/\/\S{3,500}$/i.test(txt(b.guide_url, 500)) ? txt(b.guide_url, 500) : '',
    actif: b.actif !== false, ordre: Number.isInteger(parseInt(b.ordre, 10)) ? parseInt(b.ordre, 10) : 0,
    templates: [...new Set(templates)],
  };
}

router.post('/admin/addons', ...admin, h(async (req, res) => {
  const code = txt(req.body && req.body.code, 50).toLowerCase();
  if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Code invalide (lettres minuscules, chiffres et _, 2 à 50 caractères).' });
  const d = lireAddonBody(req.body || {});
  if (d.erreur) return res.status(400).json({ error: d.erreur });
  const dup = await pool.query('SELECT 1 FROM options_studio WHERE code = $1', [code]);
  if (dup.rowCount) return res.status(409).json({ error: 'Ce code existe déjà.' });
  const r = await pool.query(
    `INSERT INTO options_studio (code, nom, description, prix_ht, actif, ordre, templates, emoji, guide_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [code, d.nom, d.description, d.prix_ht, d.actif, d.ordre, d.templates, d.emoji, d.guide_url]
  );
  res.status(201).json({ addon: r.rows[0] });
}));

router.put('/admin/addons/:code', ...admin, h(async (req, res) => {
  const code = String(req.params.code || '');
  if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Code invalide.' });
  const d = lireAddonBody(req.body || {});
  if (d.erreur) return res.status(400).json({ error: d.erreur });
  const r = await pool.query(
    `UPDATE options_studio SET nom=$1, description=$2, prix_ht=$3, actif=$4, ordre=$5, templates=$6, emoji=$7, guide_url=$8
      WHERE code=$9 RETURNING *`,
    [d.nom, d.description, d.prix_ht, d.actif, d.ordre, d.templates, d.emoji, d.guide_url, code]
  );
  if (!r.rowCount) return res.status(404).json({ error: 'Add-on introuvable.' });
  res.json({ addon: r.rows[0] });
}));

router.delete('/admin/addons/:code', ...admin, h(async (req, res) => {
  const code = String(req.params.code || '');
  if (!CODE_RE.test(code)) return res.status(400).json({ error: 'Code invalide.' });
  if (addons.LEGACY_COLS[code]) return res.status(409).json({ error: 'Cet add-on est relié à une fonctionnalité existante (options du gestionnaire). Désactivez-le (kill switch) plutôt que de le supprimer.' });
  const [a, p] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS n FROM gestionnaire_addons WHERE code = $1', [code]),
    pool.query('SELECT COUNT(*)::int AS n FROM plans_multivendeur WHERE $1 = ANY(addons_inclus)', [code]),
  ]);
  if (a.rows[0].n > 0 || p.rows[0].n > 0)
    return res.status(409).json({ error: `Utilisé par ${a.rows[0].n} gestionnaire(s) et inclus dans ${p.rows[0].n} forfait(s). Désactivez-le (kill switch) plutôt que de le supprimer.` });
  const r = await pool.query('DELETE FROM options_studio WHERE code = $1', [code]);
  if (!r.rowCount) return res.status(404).json({ error: 'Add-on introuvable.' });
  res.json({ success: true });
}));

// ════════════════════════ ADMIN — GESTIONNAIRES MV (lecture seule) ════════════

router.get('/admin/mv/gestionnaires', ...admin, h(async (req, res) => {
  const g = await pool.query(
    `SELECT g.id, g.nom, g.email, g.nom_boutique, g.plan, g.statut
       FROM gestionnaires g
      WHERE EXISTS (SELECT 1 FROM sites s WHERE s.gestionnaire_id = g.id AND s.template_id = $1)
      ORDER BY g.id DESC LIMIT 500`,
    [addons.TEMPLATE_MV]
  );
  const out = [];
  for (const row of g.rows) {
    const r = await addons.resumeFacturationMV(row.id);
    out.push({
      id: row.id, nom: row.nom, email: row.email, nom_boutique: row.nom_boutique, statut: row.statut,
      forfait: r.forfait ? { plan_id: r.forfait.plan_id, nom: r.forfait.nom, par_defaut: r.forfait.par_defaut } : null,
      addons: r.addons, total_ht: r.total_ht,
    });
  }
  res.json({ gestionnaires: out });
}));

module.exports = router;