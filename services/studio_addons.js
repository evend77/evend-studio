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
// Identifiants possibles du template MV dans la table `sites` (le site peut être enregistré avec ou sans tiret).
const SITE_TEMPLATES_MV = ['multivendeur-premium', 'multi-vendeur-premium'];

// ── Add-ons « anciens » : activation conservée dans options_gestionnaire (une colonne booléenne par add-on) ──
// code options_studio → colonne. Les autres pages (Branding & options des autres templates, vérif. d'âge, popup…) continuent
// de lire ces booleans : on n'a donc RIEN à changer ailleurs. Le forfait MV les active/désactive via cette même colonne.
const LEGACY_COLS = {
  badge_evend_masquer: 'cacher_propulse',
  verificateur_age: 'verificateur_age',
  popup_annonce: 'popup_annonce',
  chatbot: 'chatbot',                 // Chatbot (sans IA) : options_gestionnaire.chatbot, comme dans les autres templates
};

async function etatLegacy(gid, db) {
  const c = db || pool;
  const [o, f] = await Promise.all([
    c.query('SELECT * FROM options_gestionnaire WHERE gestionnaire_id = $1 LIMIT 1', [gid]),
    c.query('SELECT code FROM options_gestionnaire_inclus WHERE gestionnaire_id = $1', [gid]),
  ]);
  return { row: o.rows[0] || {}, flags: new Set(f.rows.map(x => x.code)) };
}

async function poserLegacy(gid, code, valeur, db) {
  const col = LEGACY_COLS[code];   // colonne issue de la liste fermée ci-dessus (jamais d'entrée utilisateur)
  await (db || pool).query(
    `INSERT INTO options_gestionnaire (gestionnaire_id, ${col}) VALUES ($1, $2)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET ${col} = $2`, [gid, valeur]);
}

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
    guide_url: r.guide_url || '',
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
        AND ($2::text IS NULL OR $2 = ANY(templates) OR (cardinality(templates) = 0 AND $2 <> 'multivendeur-premium'))
      ORDER BY ordre, id`,
    [actifSeulement, templateId]
  );
  return r.rows.map(formaterAddon);
}

// ── Règle d'activation ───────────────────────────────────────────────────────

/** État complet des add-ons d'un gestionnaire MV : inclus / acheté / disponible. */
async function etatAddonsMV(gid, db) {
  const c = db || pool;
  const [forfait, catalogue, achetes, leg] = await Promise.all([
    forfaitMV(gid, c),
    listerCatalogue({ templateId: TEMPLATE_MV, actifSeulement: true, db: c }),
    c.query('SELECT code, prix_ht, active_le FROM gestionnaire_addons WHERE gestionnaire_id = $1', [gid]),
    etatLegacy(gid, c),
  ]);
  const achat = new Map(achetes.rows.map(a => [a.code, a]));

  const addons = catalogue.map(a => {
    const estInclus = forfaitInclut(forfait, a.code);
    const a2 = achat.get(a.code);
    const col = LEGACY_COLS[a.code];
    // Un add-on inclus n'est JAMAIS offert à l'achat ni facturé, même s'il a une vieille ligne d'achat.
    // Add-on « ancien » : acheté = la colonne options_gestionnaire est vraie (au prix du catalogue).
    const estAchete = !estInclus && (col ? leg.row[col] === true : !!a2);
    return {
      ...a,
      inclus: estInclus,
      achete: estAchete,
      actif_pour_gestionnaire: estInclus || estAchete,
      prix_facture: estInclus ? 0 : (estAchete ? (col ? a.prix_ht : nombre(a2.prix_ht)) : 0),
      active_le: estAchete && a2 ? a2.active_le : null,
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
        AND $3 = ANY(o.templates)
        AND ( EXISTS (SELECT 1 FROM p WHERE p.tous_addons = true OR $2 = ANY(p.addons_inclus))
           OR EXISTS (SELECT 1 FROM gestionnaire_addons ga WHERE ga.gestionnaire_id = $1 AND ga.code = $2) )
      LIMIT 1`,
    [parseInt(gid, 10), code, TEMPLATE_MV]
  );
  return r.rowCount > 0;
}

// ── Add-ons MV dont l'activation vit dans options_gestionnaire (Cacher le branding, Vérificateur d'âge, Popup Annonce, Chatbot) ──

/** Aligne options_gestionnaire sur le forfait : inclus → activé (0,00 $) ; plus inclus après une rétrogradation → désactivé. */
async function syncInclusLegacy(gid, db) {
  const c = db || pool;
  const out = { devenus_inclus: [], perdus: [] };
  const forfait = await forfaitMV(gid, c);
  if (!forfait) return out;
  const cat = await listerCatalogue({ templateId: TEMPLATE_MV, actifSeulement: true, db: c });
  const { row, flags } = await etatLegacy(gid, c);
  for (const code of Object.keys(LEGACY_COLS)) {
    const dansCat = cat.some(a => a.code === code);
    const inclus = dansCat && forfaitInclut(forfait, code);
    const actif = row[LEGACY_COLS[code]] === true;
    if (inclus) {
      if (actif && !flags.has(code)) out.devenus_inclus.push(code);     // déjà acheté → n'est plus facturé
      if (!actif) await poserLegacy(gid, code, true, c);
      if (!flags.has(code)) await c.query('INSERT INTO options_gestionnaire_inclus (gestionnaire_id, code) VALUES ($1,$2) ON CONFLICT DO NOTHING', [gid, code]);
    } else if (flags.has(code)) {
      if (actif) await poserLegacy(gid, code, false, c);                 // n'est plus inclus → désactivé
      await c.query('DELETE FROM options_gestionnaire_inclus WHERE gestionnaire_id = $1 AND code = $2', [gid, code]);
      out.perdus.push(code);
    }
  }
  return out;
}

const syncInclus = syncInclusLegacy;

/** Après qu'un admin modifie un forfait : remet à jour tous les gestionnaires qui l'utilisent. */
async function syncGestionnairesDuPlan(planId) {
  const g = await pool.query('SELECT id FROM gestionnaires WHERE plan = $1', [planId]);
  for (const x of g.rows) await syncInclus(x.id);
}

// ── Actions du gestionnaire ──────────────────────────────────────────────────

async function activerAddon(gid, code) {
  const { addons } = await etatAddonsMV(gid);
  const a = addons.find(x => x.code === code);
  if (!a) throw new ErreurAddon('Add-on introuvable ou non disponible pour ce template.', 404);
  if (a.inclus) throw new ErreurAddon('Cet add-on est déjà inclus dans votre forfait.', 409);
  if (a.achete) return { deja: true };
  if (LEGACY_COLS[code]) { await poserLegacy(gid, code, true); return { deja: false, prix_ht: a.prix_ht }; }
  await pool.query(
    `INSERT INTO gestionnaire_addons (gestionnaire_id, code, prix_ht) VALUES ($1,$2,$3)
     ON CONFLICT (gestionnaire_id, code) DO NOTHING`,
    [gid, code, a.prix_ht]
  );
  return { deja: false, prix_ht: a.prix_ht };
}

async function desactiverAddon(gid, code) {
  if (LEGACY_COLS[code]) {
    const { flags } = await etatLegacy(gid);
    if (flags.has(code)) throw new ErreurAddon('Cet add-on est inclus dans votre forfait : il ne peut pas être désactivé.', 409);
    await poserLegacy(gid, code, false);
    return { retire: true };
  }
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
    const ev = await syncInclus(gid, client);
    await client.query('COMMIT');
    const unique = (l) => Array.from(new Set(l));
    return { plan: nouveau, devenus_inclus: unique([...fusionnes, ...ev.devenus_inclus]), perdus: unique([...perdus, ...ev.perdus]) };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Résumé Mes services : forfait + add-ons facturés + total HT. */
async function resumeFacturationMV(gid) {
  const { forfait, addons } = await etatAddonsMV(gid);
  const lignesAddons = addons
    .filter(a => a.actif_pour_gestionnaire)
    .map(a => ({ code: a.code, nom: a.nom, emoji: a.emoji, inclus: a.inclus, prix_ht: a.prix_facture }));
  const totalAddons = lignesAddons.reduce((s, l) => s + l.prix_ht, 0);
  const prixForfait = forfait ? forfait.prix : 0;
  return {
    forfait,
    addons: lignesAddons,
    total_ht: Math.round((prixForfait + totalAddons) * 100) / 100,
  };
}

module.exports = {
  ErreurAddon, TEMPLATE_MV, SITE_TEMPLATES_MV,
  listerPlansMV, forfaitMV, forfaitInclut, listerCatalogue,
  etatAddonsMV, addonActif, addonActifRapide,
  activerAddon, desactiverAddon, changerForfaitMV, resumeFacturationMV,
  LEGACY_COLS, etatLegacy, syncInclusLegacy, syncInclus, syncGestionnairesDuPlan,
};