// CHEMIN : services/studio_plans_collab.js
// e-Vend Studio — Add-on « Plans collaborateurs » (MV Premium). SOURCE UNIQUE des règles de plan :
//   - le système est ACTIF si l'add-on `plans_collab` est actif pour le gestionnaire ET qu'il a activé « Utiliser les plans »;
//   - sinon, RIEN ne change (limite « Max produits », commission générale, add-ons du gestionnaire tels quels);
//   - système actif : plan lu EN DIRECT (aucune copie), fonctionnalités = add-ons du plan ∩ add-ons actifs du gestionnaire,
//     commission du plan = celle qui s'applique (remplace Config générale → Commission).
// Aucune tâche planifiée : tout est calculé à la lecture.

'use strict';

const pool = require('../db');
const addons = require('./studio_addons');

const CODE_ADDON = 'plans_collab';

class ErreurPlan extends Error { constructor(m, s = 400) { super(m); this.status = s; } }

// Add-ons que le gestionnaire peut inclure dans un plan (propres à chaque collaborateur).
// Les add-ons « de boutique » (vérificateur d'âge, popup, effets, chatbot, PWA, favicon, analytique…) ne sont PAS ici.
const ADDONS_PAR_PLAN = [
  { code: 'blog_collab',            nom: 'Blog collaborateur',          emoji: '📝' },
  { code: 'faq_collab',             nom: 'FAQ collaborateur',           emoji: '❓' },
  { code: 'chat_collab',            nom: 'Messagerie avec les acheteurs', emoji: '💬' },
  { code: 'encheres',               nom: 'Enchères',                    emoji: '🔨' },
  { code: 'offres_du_jour',         nom: 'Offres du jour',              emoji: '🔥' },
  { code: 'faire_une_offre',        nom: 'Faire une offre',             emoji: '🤝' },
  { code: 'questions_produit',      nom: 'Questions sur le produit',    emoji: '🙋' },
  { code: 'prix_paliers',           nom: 'Prix par palier',             emoji: '💰' },
  { code: 'parution_future',        nom: 'Parution future',             emoji: '⏳' },
  { code: 'etiquette_shippo',       nom: 'Étiquettes Shippo',           emoji: '🏷️' },
  { code: 'etiquette_easypost',     nom: 'Étiquettes EasyPost',         emoji: '🏷️' },
  { code: 'etiquette_postescanada', nom: 'Étiquettes Postes Canada',    emoji: '🏷️' },
  { code: 'connecteur_ebay',        nom: 'Connecteur eBay',             emoji: '🔗' },
];
const CODES_PERMIS = new Set(ADDONS_PAR_PLAN.map((a) => a.code));
const TYPES_COMMISSION = ['pourcentage', 'fixe', 'mixte'];
const ACTIONS_IMPAYE = ['bloquer', 'bloquer_masquer'];

const num = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const arrondi = (n) => Math.round(n * 100) / 100;

// ── Réglages ─────────────────────────────────────────────────────────────────
async function reglages(gid, db) {
  const c = db || pool;
  let r = {};
  try { r = (await c.query('SELECT * FROM mv_plans_config WHERE gestionnaire_id = $1', [gid])).rows[0] || {}; } catch (e) { r = {}; }
  return {
    actif: r.actif === true,
    jours_grace: Number.isInteger(r.jours_grace) ? r.jours_grace : 7,
    action_impaye: ACTIONS_IMPAYE.includes(r.action_impaye) ? r.action_impaye : 'bloquer',
    taxes_ajoutees: r.taxes_ajoutees === true,
  };
}

/** true si l'add-on est actif pour ce gestionnaire ET que « Utiliser les plans » est activé. */
async function systemeActif(gid, db) {
  const c = db || pool;
  try {
    if (!(await addons.addonActifRapide(gid, CODE_ADDON, c))) return false;
    return (await reglages(gid, c)).actif;
  } catch (e) { return false; }   // tables absentes : système inactif, comportement d'avant
}

// ── Plans ────────────────────────────────────────────────────────────────────
function formaterPlan(r) {
  return {
    id: r.id, nom: r.nom, emoji: r.emoji || '📦', description: r.description || '',
    prix_mensuel: num(r.prix_mensuel), limite_annonces: r.limite_annonces == null ? null : parseInt(r.limite_annonces, 10),
    addons: (Array.isArray(r.addons) ? r.addons : []).filter((x) => CODES_PERMIS.has(x)),
    type_commission: TYPES_COMMISSION.includes(r.type_commission) ? r.type_commission : 'pourcentage',
    commission_pct: num(r.commission_pct), commission_fixe: num(r.commission_fixe),
    commission_max: r.commission_max == null ? null : num(r.commission_max),
    visible: r.visible !== false, actif: r.actif !== false, ordre: r.ordre || 0,
  };
}

async function listerPlans(gid, { visiblesSeulement = false, actifsSeulement = false, db } = {}) {
  const r = await (db || pool).query(
    `SELECT * FROM mv_plans WHERE gestionnaire_id = $1
        AND ($2::boolean = false OR visible = true) AND ($3::boolean = false OR actif = true)
      ORDER BY ordre, prix_mensuel, id`, [gid, visiblesSeulement, actifsSeulement]);
  return r.rows.map(formaterPlan);
}

async function lirePlan(gid, planId, db) {
  const r = await (db || pool).query('SELECT * FROM mv_plans WHERE id = $1 AND gestionnaire_id = $2', [planId, gid]);
  return r.rows[0] ? formaterPlan(r.rows[0]) : null;
}

/** Valide et normalise le corps d'un plan (création / modification). Lance ErreurPlan si invalide. */
function validerPlan(b) {
  b = b || {};
  const nom = String(b.nom || '').trim();
  if (nom.length < 2 || nom.length > 80) throw new ErreurPlan('Nom du plan : 2 à 80 caractères.');
  const emoji = String(b.emoji || '📦').trim().slice(0, 8) || '📦';
  const description = String(b.description || '').trim().slice(0, 500);
  const prix = num(b.prix_mensuel, NaN);
  if (!Number.isFinite(prix) || prix < 0 || prix > 10000) throw new ErreurPlan('Prix mensuel : entre 0 et 10 000 $ (0 = gratuit).');
  let limite = null;
  if (b.limite_annonces !== null && b.limite_annonces !== undefined && b.limite_annonces !== '') {
    limite = parseInt(b.limite_annonces, 10);
    if (!Number.isInteger(limite) || limite < 1 || limite > 100000) throw new ErreurPlan("Limite d'annonces : un nombre entre 1 et 100 000 (vide = illimité).");
  }
  const type = String(b.type_commission || 'pourcentage');
  if (!TYPES_COMMISSION.includes(type)) throw new ErreurPlan('Type de commission invalide.');
  const pct = num(b.commission_pct, 0);
  const fixe = num(b.commission_fixe, 0);
  if (pct < 0 || pct > 100) throw new ErreurPlan('Commission en % : entre 0 et 100.');
  if (fixe < 0 || fixe > 10000) throw new ErreurPlan('Commission fixe : entre 0 et 10 000 $.');
  let max = null;
  if (b.commission_max !== null && b.commission_max !== undefined && b.commission_max !== '') {
    max = num(b.commission_max, NaN);
    if (!Number.isFinite(max) || max <= 0 || max > 100000) throw new ErreurPlan('Commission maximum : un montant positif (vide = aucun plafond).');
  }
  const liste = Array.isArray(b.addons) ? [...new Set(b.addons.filter((x) => typeof x === 'string' && CODES_PERMIS.has(x)))] : [];
  return {
    nom, emoji, description, prix_mensuel: arrondi(prix), limite_annonces: limite, addons: liste,
    type_commission: type, commission_pct: pct, commission_fixe: fixe, commission_max: max,
    visible: b.visible !== false, actif: b.actif !== false,
  };
}

// ── État d'un collaborateur ─────────────────────────────────────────────────
/**
 * État du collaborateur vis-à-vis des plans.
 *  { systeme:false }                         → rien ne change
 *  { systeme:true, plan, a_choisi, bloque, raison, limite, utilise, addons:Set }
 * Un plan archivé ou supprimé que le collaborateur possède encore est CONSERVÉ tant que le plan existe (archivé = gardé).
 * Un plan supprimé (plan_id orphelin) = comme « pas de plan » : il doit en choisir un autre.
 */
async function etat(gid, cid, db) {
  const c = db || pool;
  if (!(await systemeActif(gid, c))) return { systeme: false, bloque: false, plan: null, a_choisi: true, addons: null, limite: null, utilise: 0 };
  const cfg = await reglages(gid, c);
  const col = (await c.query('SELECT plan_id, plan_statut, plan_impaye_depuis FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [cid, gid])).rows[0];
  if (!col) return { systeme: true, bloque: true, raison: 'compte', plan: null, a_choisi: false, addons: new Set(), limite: 0, utilise: 0 };
  const plan = col.plan_id ? await lirePlan(gid, col.plan_id, c) : null;
  const utilise = +(await c.query('SELECT COUNT(*) AS n FROM produits WHERE collaborateur_id = $1 AND gestionnaire_id = $2', [cid, gid])).rows[0].n;
  let bloque = false, raison = null, graceRestante = null;
  if (!plan) { bloque = true; raison = 'choisir_plan'; }
  else if (col.plan_statut === 'impaye' && col.plan_impaye_depuis) {
    const jours = (Date.now() - new Date(col.plan_impaye_depuis).getTime()) / 86400000;
    graceRestante = Math.max(0, Math.ceil(cfg.jours_grace - jours));
    if (jours >= cfg.jours_grace) { bloque = true; raison = 'impaye'; }
  }
  // Fonctionnalités : celles du plan, et seulement si l'add-on est (encore) actif pour le gestionnaire
  const permis = new Set();
  if (plan && !(bloque && raison === 'impaye')) {
    for (const code of plan.addons) { if (await addons.addonActifRapide(gid, code, c)) permis.add(code); }
  }
  return { systeme: true, plan, a_choisi: !!plan, bloque, raison, grace_restante: graceRestante, limite: plan ? plan.limite_annonces : 0, utilise,
           addons: permis, cacher_annonces: bloque && raison === 'impaye' && cfg.action_impaye === 'bloquer_masquer' };
}

/** Bloque (403) la création/modification d'annonces si le collaborateur doit choisir un plan ou est impayé. */
async function exigerDroitEcriture(gid, cid, db) {
  // Abonnement Stripe : relu au plus une fois par heure (jamais d'erreur ici)
  try { if (await systemeActif(gid, db)) await require('./studio_plans_stripe').synchroniser(gid, cid); } catch (e) { /* ignoré */ }
  const e = await etat(gid, cid, db);
  if (!e.systeme || !e.bloque) return e;
  if (e.raison === 'choisir_plan') throw new ErreurPlan('Choisissez d\'abord un plan (menu Mon profil → Mon plan) pour créer ou modifier des annonces.', 403);
  if (e.raison === 'impaye') throw new ErreurPlan('Votre plan est impayé : mettez à jour votre paiement (Mon profil → Mon plan) pour reprendre la gestion de vos annonces.', 403);
  throw new ErreurPlan('Accès refusé.', 403);
}

/** Vérifie la limite d'annonces du plan pour UNE nouvelle annonce. `nbActuel` = annonces déjà créées. */
function verifierLimite(e, nbActuel, ajout = 1) {
  if (!e.systeme || !e.plan || e.plan.limite_annonces == null) return;
  if (nbActuel + ajout > e.plan.limite_annonces) {
    throw new ErreurPlan(`Limite de votre plan « ${e.plan.nom} » atteinte : ${e.plan.limite_annonces} annonce${e.plan.limite_annonces > 1 ? 's' : ''}. Passez à un plan supérieur (Mon profil → Mon plan) ou supprimez une annonce.`, 409);
  }
}

/** Ce collaborateur peut-il utiliser cette fonctionnalité ? Système inactif → oui (le contrôle du gestionnaire, lui, reste ailleurs). */
async function collabAutorise(gid, cid, code, db) {
  const e = await etat(gid, cid, db);
  if (!e.systeme) return true;
  return e.addons.has(code);
}

/** Champs de commission du plan, à fusionner dans la config MV de `commissionDe`. null = système inactif ou pas de plan (commission générale). */
async function commissionDuPlan(gid, cid, db) {
  const c = db || pool;
  if (!cid) return null;
  const e = await etat(gid, cid, c);
  if (!e.systeme || !e.plan) return null;
  const p = e.plan;
  const t = p.type_commission;   // 'pourcentage' | 'fixe' | 'mixte' → formats de commissionDe : '%' | 'FIXED' | '% + FIXED'
  return {
    type_commission_globale: t === 'fixe' ? 'FIXED' : (t === 'mixte' ? '% + FIXED' : '%'),
    commission_globale: t === 'fixe' ? p.commission_fixe : p.commission_pct,
    seconde_commission_globale: t === 'mixte' ? p.commission_fixe : 0,
    baremes_commission: [],
    activer_commission_max: p.commission_max != null,
    commission_max: p.commission_max == null ? 0 : p.commission_max,
  };
}

/** Résumé de plans pour la liste des collaborateurs du gestionnaire. */
async function planDe(gid, planId, db) { return planId ? lirePlan(gid, planId, db) : null; }

module.exports = {
  CODE_ADDON, ErreurPlan, ADDONS_PAR_PLAN, CODES_PERMIS, TYPES_COMMISSION, ACTIONS_IMPAYE,
  reglages, systemeActif, listerPlans, lirePlan, validerPlan, formaterPlan, etat, exigerDroitEcriture,
  verifierLimite, collabAutorise, commissionDuPlan, planDe,
};