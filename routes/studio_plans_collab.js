// CHEMIN : routes/studio_plans_collab.js
// e-Vend Studio — Add-on « Plans collaborateurs » (MV Premium). Deux routeurs, déjà derrière leur authentification :
//
//   gestionnaire  (monté dans studio_mv_admin.js :  /api/studio/mv/:gestionnaireId/plans)   req.gid
//     GET    /                          → { addon_actif, config, plans[], addons_disponibles[], collaborateurs[], sans_plan }
//     POST   /plans · PUT /plans/:id · DELETE /plans/:id (archive si des collaborateurs l'ont)
//     PUT    /config                    → { actif, jours_grace, action_impaye, taxes_ajoutees }
//     PUT    /collaborateurs/:id        → { plan_id|null, forcer? }
//     POST   /assigner-tous             → { plan_id, seulement_sans_plan = true, forcer? }
//
//   collaborateur (monté dans collab_dashboard.js :  /api/collab/:gestionnaireId/plans)      req.gid, req.cid
//     GET    /mon-plan                  → état + plans proposés
//     POST   /choisir                   → { plan_id }

'use strict';

const express = require('express');
const pool = require('../db');
const P = require('../services/studio_plans_collab');
const addons = require('../services/studio_addons');

class Invalide extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const bad = (m, s) => { throw new Invalide(m, s); };
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof Invalide || e instanceof P.ErreurPlan) return res.status(e.status).json({ error: e.message });
    console.error('[plans_collab]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
const entier = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

// ═════════════════════════ GESTIONNAIRE ═════════════════════════════════════
const gestionnaire = express.Router({ mergeParams: true });

async function exigerAddon(gid) {
  if (!(await addons.addonActifRapide(gid, P.CODE_ADDON, pool))) bad("L'add-on « Plans collaborateurs » n'est pas activé. Activez-le dans Forfait & Plan.", 403);
}

gestionnaire.get('/', h(async (req, res) => {
  const gid = req.gid;
  const addonActif = await addons.addonActifRapide(gid, P.CODE_ADDON, pool);
  if (!addonActif) return res.json({ addon_actif: false });
  const [config, plans] = await Promise.all([P.reglages(gid, pool), P.listerPlans(gid, { db: pool })]);
  // Add-ons que le gestionnaire peut inclure : seulement ceux qui sont actifs pour lui
  const dispo = [];
  for (const a of P.ADDONS_PAR_PLAN) dispo.push({ ...a, actif: await addons.addonActifRapide(gid, a.code, pool) });
  const col = await pool.query(
    `SELECT c.id, c.nom_boutique, c.nom_responsable, c.email, c.statut, c.plan_id, c.plan_depuis, c.plan_statut,
            (SELECT COUNT(*)::int FROM produits p WHERE p.collaborateur_id = c.id AND p.gestionnaire_id = c.gestionnaire_id) AS nb_annonces
       FROM marketplace_collaborateurs c WHERE c.gestionnaire_id = $1 ORDER BY c.nom_boutique`, [gid]);
  const parPlan = {};
  const ids = new Set(plans.map((p) => p.id));
  const collaborateurs = col.rows.map((c) => {
    const valide = c.plan_id && ids.has(c.plan_id);
    if (valide) parPlan[c.plan_id] = (parPlan[c.plan_id] || 0) + 1;
    return { id: c.id, nom_boutique: c.nom_boutique, nom_responsable: c.nom_responsable, email: c.email, statut: c.statut,
             plan_id: valide ? c.plan_id : null, plan_statut: c.plan_statut, nb_annonces: c.nb_annonces };
  });
  res.json({
    addon_actif: true, config,
    plans: plans.map((p) => ({ ...p, nb_collaborateurs: parPlan[p.id] || 0 })),
    addons_disponibles: dispo, collaborateurs,
    sans_plan: collaborateurs.filter((c) => !c.plan_id && c.statut === 'actif').length,
  });
}));

const SQL_PLAN_CHAMPS = `nom=$3, emoji=$4, description=$5, prix_mensuel=$6, limite_annonces=$7, addons=$8::jsonb,
  type_commission=$9, commission_pct=$10, commission_fixe=$11, commission_max=$12, visible=$13, actif=$14, updated_at=NOW()`;
const valeursPlan = (v) => [v.nom, v.emoji, v.description, v.prix_mensuel, v.limite_annonces, JSON.stringify(v.addons),
  v.type_commission, v.commission_pct, v.commission_fixe, v.commission_max, v.visible, v.actif];

gestionnaire.post('/plans', h(async (req, res) => {
  await exigerAddon(req.gid);
  const v = P.validerPlan(req.body);
  const n = +(await pool.query('SELECT COUNT(*) AS n FROM mv_plans WHERE gestionnaire_id = $1', [req.gid])).rows[0].n;
  if (n >= 30) bad('Maximum 30 plans.', 409);
  const r = await pool.query(
    `INSERT INTO mv_plans (gestionnaire_id, nom, emoji, description, prix_mensuel, limite_annonces, addons, type_commission, commission_pct, commission_fixe, commission_max, visible, actif, ordre)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [req.gid, ...valeursPlan(v), n]);
  res.status(201).json({ success: true, id: r.rows[0].id });
}));

gestionnaire.put('/plans/:id', h(async (req, res) => {
  await exigerAddon(req.gid);
  const id = entier(req.params.id);
  if (!id) bad('Plan invalide');
  const v = P.validerPlan(req.body);
  const r = await pool.query(`UPDATE mv_plans SET ${SQL_PLAN_CHAMPS} WHERE id = $1 AND gestionnaire_id = $2`, [id, req.gid, ...valeursPlan(v)]);
  if (!r.rowCount) bad('Plan introuvable', 404);
  res.json({ success: true });
}));

gestionnaire.delete('/plans/:id', h(async (req, res) => {
  const id = entier(req.params.id);
  if (!id) bad('Plan invalide');
  const used = +(await pool.query('SELECT COUNT(*) AS n FROM marketplace_collaborateurs WHERE plan_id = $1 AND gestionnaire_id = $2', [id, req.gid])).rows[0].n;
  if (used > 0) {
    // Des collaborateurs l'ont : on l'archive (caché + inactif) au lieu de leur retirer leur plan
    const r = await pool.query('UPDATE mv_plans SET actif = false, visible = false, updated_at = NOW() WHERE id = $1 AND gestionnaire_id = $2', [id, req.gid]);
    if (!r.rowCount) bad('Plan introuvable', 404);
    return res.json({ success: true, archive: true, message: `Ce plan est utilisé par ${used} collaborateur${used > 1 ? 's' : ''} : il a été archivé (ils le gardent, mais il n'est plus offert).` });
  }
  const r = await pool.query('DELETE FROM mv_plans WHERE id = $1 AND gestionnaire_id = $2', [id, req.gid]);
  if (!r.rowCount) bad('Plan introuvable', 404);
  res.json({ success: true, archive: false });
}));

gestionnaire.put('/config', h(async (req, res) => {
  await exigerAddon(req.gid);
  const b = req.body || {};
  const actuel = await P.reglages(req.gid, pool);
  const actif = b.actif === undefined ? actuel.actif : b.actif === true;
  let jours = actuel.jours_grace;
  if (b.jours_grace !== undefined) {
    jours = parseInt(b.jours_grace, 10);
    if (!Number.isInteger(jours) || jours < 0 || jours > 90) bad('Jours de grâce : un nombre entre 0 et 90.');
  }
  const action = b.action_impaye === undefined ? actuel.action_impaye : b.action_impaye;
  if (!P.ACTIONS_IMPAYE.includes(action)) bad('Action invalide.');
  const taxes = b.taxes_ajoutees === undefined ? actuel.taxes_ajoutees : b.taxes_ajoutees === true;
  if (actif && !actuel.actif) {
    const n = +(await pool.query('SELECT COUNT(*) AS n FROM mv_plans WHERE gestionnaire_id = $1 AND actif = true', [req.gid])).rows[0].n;
    if (n < 1) bad("Créez au moins un plan avant d'activer les plans.", 409);
  }
  await pool.query(
    `INSERT INTO mv_plans_config (gestionnaire_id, actif, jours_grace, action_impaye, taxes_ajoutees, updated_at) VALUES ($1,$2,$3,$4,$5,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET actif=$2, jours_grace=$3, action_impaye=$4, taxes_ajoutees=$5, updated_at=NOW()`,
    [req.gid, actif, jours, action, taxes]);
  res.json({ success: true, config: await P.reglages(req.gid, pool) });
}));

// Assigne un plan à un collaborateur (le gestionnaire peut offrir n'importe quel plan, même caché)
async function poserPlan(gid, cid, plan, forcer) {
  if (plan && plan.limite_annonces != null && !forcer) {
    const n = +(await pool.query('SELECT COUNT(*) AS n FROM produits WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid])).rows[0].n;
    if (n > plan.limite_annonces) return { ok: false, nb: n };
  }
  await pool.query(
    `UPDATE marketplace_collaborateurs SET plan_id = $1, plan_depuis = CASE WHEN $1::int IS NULL THEN NULL ELSE NOW() END,
            plan_statut = 'actif', plan_impaye_depuis = NULL WHERE id = $2 AND gestionnaire_id = $3`, [plan ? plan.id : null, cid, gid]);
  return { ok: true };
}

gestionnaire.put('/collaborateurs/:id', h(async (req, res) => {
  await exigerAddon(req.gid);
  const cid = entier(req.params.id);
  if (!cid) bad('Collaborateur invalide');
  const b = req.body || {};
  let plan = null;
  if (b.plan_id !== null && b.plan_id !== undefined && b.plan_id !== '') {
    const pid = entier(b.plan_id);
    plan = pid ? await P.lirePlan(req.gid, pid, pool) : null;
    if (!plan) bad('Plan introuvable', 404);
  }
  const ex = await pool.query('SELECT id FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [cid, req.gid]);
  if (!ex.rows.length) bad('Collaborateur introuvable', 404);
  const r = await poserPlan(req.gid, cid, plan, b.forcer === true);
  if (!r.ok) bad(`Ce collaborateur a ${r.nb} annonces, plus que la limite du plan « ${plan.nom} » (${plan.limite_annonces}). Ses annonces resteraient en ligne, mais il ne pourrait plus en créer. Confirmez pour forcer.`, 409);
  res.json({ success: true });
}));

gestionnaire.post('/assigner-tous', h(async (req, res) => {
  await exigerAddon(req.gid);
  const b = req.body || {};
  const pid = entier(b.plan_id);
  const plan = pid ? await P.lirePlan(req.gid, pid, pool) : null;
  if (!plan) bad('Plan introuvable', 404);
  const seulementSansPlan = b.seulement_sans_plan !== false;
  const lignes = (await pool.query(
    `SELECT c.id, c.plan_id FROM marketplace_collaborateurs c WHERE c.gestionnaire_id = $1 AND c.statut = 'actif'
        AND ($2::boolean = false OR c.plan_id IS NULL OR NOT EXISTS (SELECT 1 FROM mv_plans p WHERE p.id = c.plan_id AND p.gestionnaire_id = c.gestionnaire_id))`,
    [req.gid, seulementSansPlan])).rows;
  let n = 0;
  for (const l of lignes) { const r = await poserPlan(req.gid, l.id, plan, true); if (r.ok) n++; }
  res.json({ success: true, assignes: n });
}));

// ═════════════════════════ COLLABORATEUR ═════════════════════════════════════
const collab = express.Router({ mergeParams: true });

collab.get('/mon-plan', h(async (req, res) => {
  const e = await P.etat(req.gid, req.cid, pool);
  if (!e.systeme) return res.json({ systeme: false });
  const tous = await P.listerPlans(req.gid, { actifsSeulement: true, db: pool });
  const proposes = tous.filter((p) => p.visible || (e.plan && p.id === e.plan.id));
  res.json({
    systeme: true, a_choisi: e.a_choisi, bloque: e.bloque, raison: e.raison, grace_restante: e.grace_restante == null ? null : e.grace_restante,
    plan: e.plan, utilise: e.utilise, limite: e.limite, addons: [...e.addons],
    plans: proposes, addons_noms: P.ADDONS_PAR_PLAN,
    paiement_en_ligne: false,   // Phase 2 : abonnement Stripe. D'ici là, seuls les plans gratuits se choisissent seuls.
  });
}));

collab.post('/choisir', h(async (req, res) => {
  if (!(await P.systemeActif(req.gid, pool))) bad("Les plans ne sont pas utilisés sur cette marketplace.", 409);
  const pid = entier(req.body && req.body.plan_id);
  const plan = pid ? await P.lirePlan(req.gid, pid, pool) : null;
  const actuel = (await pool.query('SELECT plan_id FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [req.cid, req.gid])).rows[0];
  if (!plan || !plan.actif || (!plan.visible && actuel.plan_id !== plan.id)) bad('Plan introuvable', 404);
  if (actuel.plan_id === plan.id) return res.json({ success: true });
  if (plan.prix_mensuel > 0) bad("Ce plan est payant : l'abonnement en ligne n'est pas encore disponible. Contactez le gestionnaire pour qu'il vous l'attribue.", 402);
  const n = +(await pool.query('SELECT COUNT(*) AS n FROM produits WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [req.cid, req.gid])).rows[0].n;
  if (plan.limite_annonces != null && n > plan.limite_annonces) {
    bad(`Vous avez ${n} annonces, plus que la limite de ce plan (${plan.limite_annonces}). Supprimez ${n - plan.limite_annonces} annonce${n - plan.limite_annonces > 1 ? 's' : ''} pour le choisir.`, 409);
  }
  await poserPlan(req.gid, req.cid, plan, true);
  res.json({ success: true });
}));

module.exports = { gestionnaire, collab };