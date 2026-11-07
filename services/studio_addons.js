// CHEMIN : services/studio_addons.js
// e-Vend Studio — Forfaits multi-vendeur + add-ons. SOURCE UNIQUE de la règle :
//
//   un add-on est ACTIF pour un gestionnaire si
//     1) il existe dans options_studio ET options_studio.actif = true (kill switch global)
//     2) ET (le forfait du gestionnaire l'INCLUT  OU  le gestionnaire l'a ACHETÉ (gestionnaire_addons))
//
// Le forfait du gestionnaire = gestionnaires.plan (ex. 'mv-croissance').
// Par défaut (plan absent / inconnu / 'Gratuit') = le plus petit forfait MV actif (Démarrage).
// Facturation Stripe : plus tard — on enregistre seulement ce qui est choisi.

'use strict';

const pool = require('../db');

class ErreurAddon extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const TEMPLATE_MV = 'multivendeur-premium';

// ── Forfaits MV ──────────────────────────────────────────────────────────────

function nombre(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

function formaterPlan(r) {
  return {
    id: r.id,
    plan_id: r.plan_id,
    nom: r.nom,
    prix: nombre(r.prix),
    vendeurs_max: r.vendeurs_max == null ? null : parseInt(r.vendeurs_max, 10),
    stockage_go: r.stockage_go == null ? null : nombre(r.stockage_go),
    actif: r.actif !== false,
    ordre: r.ordre || 0,
    addons_inclus: Array.isArray(r.addons_inclus) ? r.addons_inclus : [],
    tous_addons: r.tous_addons === true,
  };
}

/** true si ce forfait inclut l'add-on `code` (liste explicite OU « tous les add-ons »). */
function forfaitInclut(forfait, code) {
  return !!forfait && (forfait.tous_addons === true || forfait.addons_inclus.includes(code));
}

async function listerPlansMV({ actifSeulement = true, db } = {}) {
  const r = await (db || pool).query(
    `SELECT * FROM plans_multivendeur ${actifSeulement ? 'WHERE actif = true' : ''} ORDER BY ordre, prix, id`
  );
  return r.rows.map(formaterPlan);
}

/** Forfait MV du gestionnaire (avec repli sur le plus petit forfait actif). */
async function forfaitMV(gid, db) {
  const c = db || pool;
  const g = await c.query('SELECT plan FROM gestionnaires WHERE id = $1', [gid]);
  if (!g.rows.length) return null;
  const code = g.rows[0].plan;
  if (code) {
    const p = await c.query('SELECT * FROM plans_multivendeur WHERE plan_id = $1', [code]);
    if (p.rows.length) return { ...formaterPlan(p.rows[0]), par_defaut: false };
  }
  const d = await c.query('SELECT * FROM plans_multivendeur WHERE actif = true ORDER BY ordre, prix, id LIMIT 1');
  return d.rows.length ? { ...formaterPlan(d.rows[0]), par_defaut: true } : null;
}

// ── Catalogue d'add-ons ──────────────────────────────────────────────────────

function formaterAddon(r) {
  return {
    code: r.code,
    nom: r.nom,
    description: r.description || '',
    emoji: r.emoji || '🧩',
    prix_ht: nombre(r.prix_ht),
    actif: r.actif !== false,
    ordre: r.ordre || 0,
    templates: Array.isArray(r.templates) ? r.templates : [],
  };
}

async function listerCatalogue({ templateId = null, actifSeulement = true, db } = {}) {
  const r = await (db || pool).query(
    `SELECT * FROM options_studio
      WHERE ($1::boolean = false OR actif = true)
        AND ($2::text IS NULL OR cardinality(templates) = 0 OR $2 = ANY(templates))
      ORDER BY ordre, id`,
    [actifSeulement, templateId]
  );
  return r.rows.map(formaterAddon);
}

// ── Règle d'activation ───────────────────────────────────────────────────────

/** État complet des add-ons d'un gestionnaire MV : inclus / acheté / disponible. */
async function etatAddonsMV(gid, db) {
  const c = db || pool;
  const [forfait, catalogue, achetes] = await Promise.all([
    forfaitMV(gid, c),
    listerCatalogue({ templateId: TEMPLATE_MV, actifSeulement: true, db: c }),
    c.query('SELECT code, prix_ht, active_le FROM gestionnaire_addons WHERE gestionnaire_id = $1', [gid]),
  ]);
  const achat = new Map(achetes.rows.map(a => [a.code, a]));

  const addons = catalogue.map(a => {
    const estInclus = forfaitInclut(forfait, a.code);
    const a2 = achat.get(a.code);
    // Un add-on inclus n'est JAMAIS offert à l'achat ni facturé, même s'il a une vieille ligne d'achat.
    const estAchete = !estInclus && !!a2;
    return {
      ...a,
      inclus: estInclus,
      achete: estAchete,
      actif_pour_gestionnaire: estInclus || estAchete,
      prix_facture: estInclus ? 0 : (estAchete ? nombre(a2.prix_ht) : 0),
      active_le: estAchete ? a2.active_le : null,
    };
  });
  return { forfait, addons };
}

/** true si l'add-on `code` est actif pour ce gestionnaire (règle ci-dessus). */
async function addonActif(gid, code, db) {
  const gidN = parseInt(gid, 10);
  if (!Number.isInteger(gidN) || !code) return false;
  const { addons } = await etatAddonsMV(gidN, db);
  const a = addons.find(x => x.code === code);
  return !!(a && a.actif_pour_gestionnaire);
}

/** Version « une requête » pour les routes publiques très sollicitées (avis, catalogue). Même règle que addonActif. */
async function addonActifRapide(gid, code, db) {
  const r = await (db || pool).query(
    `WITH g AS (SELECT id, plan FROM gestionnaires WHERE id = $1),
          p AS (
            SELECT * FROM plans_multivendeur WHERE plan_id = (SELECT plan FROM g)
            UNION ALL
            SELECT * FROM (SELECT * FROM plans_multivendeur WHERE actif = true ORDER BY ordre, prix, id LIMIT 1) d
             WHERE NOT EXISTS (SELECT 1 FROM plans_multivendeur WHERE plan_id = (SELECT plan FROM g))
          )
     SELECT 1
       FROM options_studio o
      WHERE EXISTS (SELECT 1 FROM g)
        AND o.code = $2 AND o.actif = true
        AND (cardinality(o.templates) = 0 OR $3 = ANY(o.templates))
        AND ( EXISTS (SELECT 1 FROM p WHERE p.tous_addons = true OR $2 = ANY(p.addons_inclus))
           OR EXISTS (SELECT 1 FROM gestionnaire_addons ga WHERE ga.gestionnaire_id = $1 AND ga.code = $2) )
      LIMIT 1`,
    [parseInt(gid, 10), code, TEMPLATE_MV]
  );
  return r.rowCount > 0;
}

// ── Add-ons du catalogue e-Vend (evend_addons) ───────────────────────────────
// Même règle que les add-ons Studio : inclus au forfait (liste explicite ou « tous ») OU acheté.
// L'activation reste dans evend_addons_gestionnaires (le reste du code lit toujours cette table) :
//   - acheté  → actif = true,  inclus_forfait = false  (facturé)
//   - inclus  → actif = true,  inclus_forfait = true   (0,00 $, géré automatiquement selon le forfait)
// « avis-clients » (ancien catalogue) est remplacé par l'add-on Studio « Avis clients » : on le cache pour éviter un doublon.

const EVEND_MASQUES = ['avis-clients'];

/** Prix mensuel d'un add-on e-Vend (annuel ÷ 12 ; gratuit / variable = 0). */
function mensuelEvend(prix, periode) {
  const p = nombre(prix);
  if (periode === 'mois') return p;
  if (periode === 'an') return Math.round((p / 12) * 100) / 100;
  return 0;
}

async function etatEvendMV(gid, db) {
  const c = db || pool;
  const [forfait, r] = await Promise.all([
    forfaitMV(gid, c),
    c.query(
      `SELECT a.addon_id, a.nom, a.description, a.prix, a.periode, a.categorie, a.popularite, a.companie, a.lien_documentation, a.badges,
              cat.nom AS categorie_nom, cat.icon AS categorie_icon, cat.couleur AS categorie_couleur,
              COALESCE(av.actif, false) AS actif_g, COALESCE(av.inclus_forfait, false) AS inclus_forfait, av.date_activation
         FROM evend_addons a
         LEFT JOIN evend_addons_categories cat ON cat.categorie_id = a.categorie
         LEFT JOIN evend_addons_gestionnaires av ON av.addon_id = a.addon_id AND av.gestionnaire_id = $1
        WHERE a.actif = true AND NOT (a.addon_id = ANY($2::text[]))
        ORDER BY cat.ordre_affichage, a.nom`, [gid, EVEND_MASQUES]),
  ]);
  const addons = r.rows.map(a => {
    const estInclus = forfaitInclut(forfait, a.addon_id);
    const estAchete = !estInclus && a.actif_g === true;
    const prixM = mensuelEvend(a.prix, a.periode);
    return {
      code: a.addon_id, nom: a.nom, description: a.description || '', prix: nombre(a.prix), periode: a.periode || 'mois',
      categorie: a.categorie, categorie_nom: a.categorie_nom || null, categorie_couleur: a.categorie_couleur || null,
      popularite: a.popularite || 0, companie: a.companie || null, lien_documentation: a.lien_documentation || null,
      badges: Array.isArray(a.badges) ? a.badges : [],
      inclus: estInclus, achete: estAchete, actif_pour_gestionnaire: estInclus || estAchete,
      prix_ht: prixM, prix_facture: estAchete ? prixM : 0,
    };
  });
  return { forfait, addons };
}

/**
 * Aligne evend_addons_gestionnaires sur le forfait : les add-ons inclus sont activés (inclus_forfait = true),
 * ceux qui ne sont plus inclus après une rétrogradation sont désactivés. Un add-on déjà acheté qui devient inclus n'est plus facturé.
 */
async function syncInclusEvend(gid, db) {
  const c = db || pool;
  const forfait = await forfaitMV(gid, c);
  const vide = { devenus_inclus: [], perdus: [] };
  if (!forfait) return vide;
  const cat = await c.query('SELECT addon_id FROM evend_addons WHERE actif = true AND NOT (addon_id = ANY($1::text[]))', [EVEND_MASQUES]);
  const inclus = cat.rows.map(x => x.addon_id).filter(id => forfaitInclut(forfait, id));
  const lignes = await c.query('SELECT id, addon_id, actif, inclus_forfait FROM evend_addons_gestionnaires WHERE gestionnaire_id = $1', [gid]);
  const parId = new Map(lignes.rows.map(x => [x.addon_id, x]));
  const out = { devenus_inclus: [], perdus: [] };
  for (const id of inclus) {
    const ex = parId.get(id);
    if (!ex) {
      await c.query('INSERT INTO evend_addons_gestionnaires (gestionnaire_id, addon_id, date_activation, actif, inclus_forfait) VALUES ($1,$2,NOW(),true,true)', [gid, id]);
    } else if (!ex.actif || !ex.inclus_forfait) {
      if (ex.actif && !ex.inclus_forfait) out.devenus_inclus.push(id);
      await c.query('UPDATE evend_addons_gestionnaires SET actif = true, inclus_forfait = true, date_activation = CASE WHEN actif THEN date_activation ELSE NOW() END WHERE id = $1', [ex.id]);
    }
  }
  for (const ex of lignes.rows) {
    if (ex.inclus_forfait && !inclus.includes(ex.addon_id)) {
      await c.query('UPDATE evend_addons_gestionnaires SET actif = false, inclus_forfait = false WHERE id = $1', [ex.id]);
      out.perdus.push(ex.addon_id);
    }
  }
  return out;
}

/** Après qu'un admin modifie un forfait : remet à jour tous les gestionnaires qui l'utilisent. */
async function syncGestionnairesDuPlan(planId) {
  const g = await pool.query('SELECT id FROM gestionnaires WHERE plan = $1', [planId]);
  for (const x of g.rows) await syncInclusEvend(x.id);
}

async function activerEvend(gid, addonId) {
  const { addons } = await etatEvendMV(gid);
  const a = addons.find(x => x.code === addonId);
  if (!a) throw new ErreurAddon('Add-on introuvable ou non disponible.', 404);
  if (a.inclus) throw new ErreurAddon('Cet add-on est déjà inclus dans votre forfait.', 409);
  if (a.achete) return { deja: true };
  const ex = await pool.query('SELECT id FROM evend_addons_gestionnaires WHERE gestionnaire_id = $1 AND addon_id = $2', [gid, addonId]);
  if (ex.rows.length) await pool.query('UPDATE evend_addons_gestionnaires SET actif = true, inclus_forfait = false, date_activation = NOW() WHERE id = $1', [ex.rows[0].id]);
  else await pool.query('INSERT INTO evend_addons_gestionnaires (gestionnaire_id, addon_id, date_activation, actif, inclus_forfait) VALUES ($1,$2,NOW(),true,false)', [gid, addonId]);
  try {
    await pool.query('INSERT INTO evend_addons_logs (addon_id, gestionnaire_id, action, details, utilisateur_id) VALUES ($1,$2,$3,$4,$5)', [addonId, gid, 'active_gestionnaire', JSON.stringify({ via: 'forfait-mv' }), gid]);
  } catch { /* le journal ne doit jamais bloquer l'activation */ }
  return { deja: false, prix_ht: a.prix_ht };
}

async function desactiverEvend(gid, addonId) {
  const ex = await pool.query('SELECT id, inclus_forfait FROM evend_addons_gestionnaires WHERE gestionnaire_id = $1 AND addon_id = $2', [gid, addonId]);
  if (!ex.rows.length) return { retire: false };
  if (ex.rows[0].inclus_forfait) throw new ErreurAddon('Cet add-on est inclus dans votre forfait : il ne peut pas être désactivé.', 409);
  await pool.query('UPDATE evend_addons_gestionnaires SET actif = false WHERE id = $1', [ex.rows[0].id]);
  try {
    await pool.query('INSERT INTO evend_addons_logs (addon_id, gestionnaire_id, action, details, utilisateur_id) VALUES ($1,$2,$3,$4,$5)', [addonId, gid, 'desactive_gestionnaire', JSON.stringify({ via: 'forfait-mv' }), gid]);
  } catch { /* idem */ }
  return { retire: true };
}

// ── Actions du gestionnaire ──────────────────────────────────────────────────

async function activerAddon(gid, code) {
  const { addons } = await etatAddonsMV(gid);
  const a = addons.find(x => x.code === code);
  if (!a) throw new ErreurAddon('Add-on introuvable ou non disponible pour ce template.', 404);
  if (a.inclus) throw new ErreurAddon('Cet add-on est déjà inclus dans votre forfait.', 409);
  if (a.achete) return { deja: true };
  await pool.query(
    `INSERT INTO gestionnaire_addons (gestionnaire_id, code, prix_ht) VALUES ($1,$2,$3)
     ON CONFLICT (gestionnaire_id, code) DO NOTHING`,
    [gid, code, a.prix_ht]
  );
  return { deja: false, prix_ht: a.prix_ht };
}

async function desactiverAddon(gid, code) {
  const r = await pool.query('DELETE FROM gestionnaire_addons WHERE gestionnaire_id = $1 AND code = $2', [gid, code]);
  return { retire: r.rowCount > 0 };
}

/**
 * Changer de forfait MV.
 * - monter vers un forfait qui INCLUT un add-on déjà acheté → la ligne d'achat est retirée (il ne paie plus)
 * - descendre vers un forfait qui ne l'inclut plus → rien d'automatique : l'add-on devient « à acheter »
 *   (retourne `perdus` pour que l'écran puisse avertir)
 */
async function changerForfaitMV(gid, planId) {
  const p = await pool.query('SELECT * FROM plans_multivendeur WHERE plan_id = $1 AND actif = true', [planId]);
  if (!p.rows.length) throw new ErreurAddon('Forfait introuvable ou inactif.', 404);
  const nouveau = formaterPlan(p.rows[0]);
  const avant = await etatAddonsMV(gid);
  const catalogue = await listerCatalogue({ templateId: TEMPLATE_MV, actifSeulement: true });
  const codes = catalogue.map(a => a.code);
  const inclusApres = codes.filter(c => forfaitInclut(nouveau, c));
  const perdus = codes.filter(c => forfaitInclut(avant.forfait, c) && !forfaitInclut(nouveau, c));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2', [planId, gid]);
    const fusionnes = [];
    if (inclusApres.length) {
      const r = await client.query(
        'DELETE FROM gestionnaire_addons WHERE gestionnaire_id = $1 AND code = ANY($2::text[]) RETURNING code',
        [gid, inclusApres]
      );
      r.rows.forEach(x => fusionnes.push(x.code));
    }
    const ev = await syncInclusEvend(gid, client);
    await client.query('COMMIT');
    return { plan: nouveau, devenus_inclus: [...fusionnes, ...ev.devenus_inclus], perdus: [...perdus, ...ev.perdus] };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Résumé Mes services : forfait + add-ons facturés + total HT. */
async function resumeFacturationMV(gid) {
  const [{ forfait, addons }, ev] = await Promise.all([etatAddonsMV(gid), etatEvendMV(gid)]);
  const lignesAddons = [
    ...addons.filter(a => a.actif_pour_gestionnaire).map(a => ({ code: a.code, nom: a.nom, emoji: a.emoji, inclus: a.inclus, prix_ht: a.prix_facture })),
    ...ev.addons.filter(a => a.actif_pour_gestionnaire).map(a => ({ code: a.code, nom: a.nom, emoji: '🧩', inclus: a.inclus, prix_ht: a.prix_facture })),
  ];
  const totalAddons = lignesAddons.reduce((s, l) => s + l.prix_ht, 0);
  const prixForfait = forfait ? forfait.prix : 0;
  return {
    forfait,
    addons: lignesAddons,
    total_ht: Math.round((prixForfait + totalAddons) * 100) / 100,
  };
}

module.exports = {
  ErreurAddon, TEMPLATE_MV,
  listerPlansMV, forfaitMV, forfaitInclut, listerCatalogue,
  etatAddonsMV, addonActif, addonActifRapide,
  activerAddon, desactiverAddon, changerForfaitMV, resumeFacturationMV,
  EVEND_MASQUES, etatEvendMV, syncInclusEvend, syncGestionnairesDuPlan, activerEvend, desactiverEvend,
};