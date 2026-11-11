// CHEMIN : services/boutique_limites.js
// e-Vend Studio — Limites d'annonces par palier pour les templates boutique (solo).
// Source des paliers : Prix Template (templates_prix.prix_paliers, type « paliers »), par template.
// Palier choisi par le gestionnaire : gestionnaires.plan = « <famille>-<limite> » (ex. premium-50).
// Seules les annonces ACTIVES du solo (collaborateur_id vide) comptent. Le MV n'est jamais touché.

'use strict';

const pool = require('../db');

class ErreurBoutique extends Error {
  constructor(message, status, extra) { super(message); this.status = status || 400; this.extra = extra || {}; }
}

// boutique-premium → premium ; boutique-simplisse-mode → simplisse-mode
const famille = (templateId) => String(templateId || '').replace(/^boutique-/, '');
const planId = (templateId, limite) => `${famille(templateId)}-${limite}`;

function nettoyerPaliers(brut) {
  let p = brut;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = []; } }
  if (!Array.isArray(p)) return [];
  return p
    .map((x) => ({ label: String((x && x.label) || ''), limite: parseInt(x && x.limite, 10), prix: String((x && x.prix) || '') }))
    .filter((x) => Number.isInteger(x.limite) && x.limite > 0)
    .sort((a, b) => a.limite - b.limite);
}

async function paliersDuTemplate(templateId, db) {
  if (!templateId) return [];
  const r = await (db || pool).query('SELECT prix_type, prix_paliers FROM templates_prix WHERE template_id = $1', [templateId]);
  const row = r.rows[0];
  if (!row || row.prix_type !== 'paliers') return [];
  return nettoyerPaliers(row.prix_paliers);
}

async function compter(gid, db) {
  const r = await (db || pool).query(
    `SELECT COUNT(*)::int AS n FROM produits WHERE gestionnaire_id = $1 AND collaborateur_id IS NULL AND statut = 'actif'`, [gid]);
  return r.rows[0].n;
}

// État du palier : limite = null quand le template n'a pas de paliers (aucune limite)
async function etat(gid, db) {
  const c = db || pool;
  const s = await c.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
  const templateId = (s.rows[0] && s.rows[0].template_id) || '';
  const g = await c.query('SELECT plan FROM gestionnaires WHERE id = $1', [gid]);
  const plan = (g.rows[0] && g.rows[0].plan) || '';
  const paliers = await paliersDuTemplate(templateId, c);
  const palier = paliers.length ? (paliers.find((p) => planId(templateId, p.limite) === plan) || paliers[0]) : null;
  return { templateId, plan, paliers, palier, limite: palier ? palier.limite : null };
}

// Appelé avant de publier une annonce (création active, brouillon → actif)
async function verifierActivation(gid, ajout, db) {
  const e = await etat(gid, db);
  if (e.limite === null) return e;
  const nb = await compter(gid, db);
  if (nb + (ajout || 1) > e.limite) {
    throw new ErreurBoutique(
      `Votre palier permet ${e.limite} annonce${e.limite > 1 ? 's' : ''} active${e.limite > 1 ? 's' : ''} et vous en avez déjà ${nb}. Désactivez une annonce ou passez à un palier supérieur dans « Mon plan & limites ».`,
      403, { code: 'LIMITE_ANNONCES', nb_actifs: nb, limite: e.limite });
  }
  return e;
}

// Changer de palier dans le template actuel. Refusé si le gestionnaire a trop d'annonces actives.
async function changerPalier(gid, limite) {
  const e = await etat(gid);
  if (!e.templateId || !e.paliers.length) throw new ErreurBoutique("Votre template actuel n'a pas de paliers.", 400);
  const p = e.paliers.find((x) => x.limite === limite);
  if (!p) throw new ErreurBoutique('Palier inconnu pour ce template.', 400);
  const nb = await compter(gid);
  if (nb > p.limite) {
    throw new ErreurBoutique(
      `Ce palier permet ${p.limite} annonce${p.limite > 1 ? 's' : ''} et vous en avez ${nb} d'actives. Désactivez ou supprimez ${nb - p.limite} annonce${nb - p.limite > 1 ? 's' : ''} d'abord.`,
      409, { code: 'LIMITE_ANNONCES', nb_actifs: nb, limite: p.limite });
  }
  const plan = planId(e.templateId, p.limite);
  await pool.query('UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2', [plan, gid]);
  return { plan, limite: p.limite };
}

// Changement de TEMPLATE : bloque si aucun palier du nouveau template ne peut contenir les annonces actives.
// Sinon garde le palier actuel s'il existe dans le nouveau template, ou choisit le plus petit palier qui convient.
// Idempotent : même template = rien à faire. Un template sans paliers n'a aucune limite.
async function appliquerChangementTemplate(gid, nouveauTemplateId) {
  // Seuls les templates boutique (solo) ont des paliers gérés ici : le MV et les autres ne sont jamais touchés
  if (!String(nouveauTemplateId || '').startsWith('boutique-')) return { ok: true };
  const s = (await pool.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid])).rows[0];
  if (s && s.template_id === nouveauTemplateId) return { ok: true };
  const paliers = await paliersDuTemplate(nouveauTemplateId);
  if (!paliers.length) return { ok: true };
  const nb = await compter(gid);
  const plan = ((await pool.query('SELECT plan FROM gestionnaires WHERE id = $1', [gid])).rows[0] || {}).plan || '';
  const courant = paliers.find((p) => planId(nouveauTemplateId, p.limite) === plan);
  if (courant && nb <= courant.limite) return { ok: true };
  const convenable = paliers.find((p) => p.limite >= nb);
  if (!convenable) {
    const max = paliers[paliers.length - 1].limite;
    return {
      ok: false, code: 'LIMITE_ANNONCES', nb_actifs: nb, limite: max,
      message: `Ce template permet au maximum ${max} annonce${max > 1 ? "s" : ""} active${max > 1 ? "s" : ""} et vous en avez ${nb}. Désactivez ou supprimez ${nb - max} annonce${nb - max > 1 ? 's' : ''} d'abord.`,
    };
  }
  const nouveau = planId(nouveauTemplateId, convenable.limite);
  await pool.query('UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2', [nouveau, gid]);
  return { ok: true, plan: nouveau, limite: convenable.limite };
}

module.exports = { ErreurBoutique, famille, planId, nettoyerPaliers, paliersDuTemplate, compter, etat, verifierActivation, changerPalier, appliquerChangementTemplate };