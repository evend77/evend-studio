// CHEMIN : services/encheres_limites.js
// e-Vend Studio — Limites de lots par palier pour les sites d'ENCHÈRES (enchere-galerie, enchere-live).
// Même système que les petites annonces (services/annonces_limites.js) :
//   - paliers = grille unique de l'admin (Templates → Enchères (tarifs)) ; vide = « Prix Template » du template
//   - palier choisi = gestionnaires.plan = « <template>-<limite> » (ex. enchere-galerie-25), même planId() que les boutiques
//   - seuls les lots ACTIFS comptent (statut active et date de fin non échue) ; un lot terminé ou annulé ne compte pas
// Un template sans paliers dans Prix Template n'a aucune limite. Les boutiques, les annonces et le MV ne sont jamais touchés.

'use strict';

const pool = require('../db');
const BL = require('./boutique_limites');
const PRIX = require('./encheres_prix');   // grille de prix unique des enchères (page admin Templates → Enchères (tarifs))

const estEnchere = (templateId) => String(templateId || '').startsWith('enchere-');

// Paliers d'un site d'enchères : la grille unique de l'admin quand elle contient au moins un palier, sinon les « Prix Template » du template (comme avant)
async function paliersDe(templateId, db) {
  const g = await PRIX.paliersPourLimites(db);
  return g.length ? g : BL.paliersDuTemplate(templateId, db);
}

// Chargé à l'appel (évite un cycle de chargement avec enchere_site.js)
function erreur(message, statut, code) {
  const { ErreurEnchere } = require('./enchere_site');
  return new ErreurEnchere(message, statut, code);
}

async function compter(gid, db) {
  await require('./enchere_site').pret();
  const r = await (db || pool).query(
    `SELECT COUNT(*)::int AS n FROM ens_lots
      WHERE gestionnaire_id = $1 AND statut = 'active' AND date_fin > NOW()`, [gid]);
  return r.rows[0].n;
}

// État du palier : limite = null quand le template n'a pas de paliers (aucune limite)
async function etat(gid, db) {
  const c = db || pool;
  const s = await c.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
  const templateId = (s.rows[0] && s.rows[0].template_id) || '';
  const g = await c.query('SELECT plan FROM gestionnaires WHERE id = $1', [gid]);
  const plan = (g.rows[0] && g.rows[0].plan) || '';
  const paliers = estEnchere(templateId) ? await paliersDe(templateId, c) : [];
  const palier = paliers.length ? (paliers.find((p) => BL.planId(templateId, p.limite) === plan) || paliers[0]) : null;
  return { templateId, plan, paliers, palier, limite: palier ? palier.limite : null };
}

// Même forme que GET /api/boutique/gestionnaire/plan (la page « Mon plan & limites » est la même)
async function etatPourPage(gid) {
  const e = await etat(gid);
  const nb = await compter(gid);
  return {
    template_id: e.templateId, plan: e.plan, limite: e.limite, nb_actifs: nb,
    palier_actuel: e.palier ? BL.planId(e.templateId, e.palier.limite) : null,
    paliers: e.paliers.map((p) => Object.assign({}, p, { plan_id: BL.planId(e.templateId, p.limite) })),
  };
}

// Appelé avant d'ajouter un lot
async function verifierActivation(gid, ajout) {
  const e = await etat(gid);
  if (e.limite === null) return e;
  const nb = await compter(gid);
  if (nb + (ajout || 1) > e.limite) {
    throw erreur(
      `Votre palier permet ${e.limite} lot${e.limite > 1 ? 's' : ''} actif${e.limite > 1 ? 's' : ''} et vous en avez déjà ${nb}. Attendez la fin d'une enchère ou annulez un lot, ou passez à un palier supérieur.`,
      403, 'LIMITE_LOTS');
  }
  return e;
}

// Changer de palier. Sans templateId : dans le template actuel. Avec templateId : pour ce template (choix fait dans la fenêtre
// de palier AVANT d'appliquer le template ; le palier est ensuite conservé par appliquerChangementTemplate).
async function changerPalier(gid, limite, templateId) {
  let tid = templateId;
  if (!tid) tid = (await etat(gid)).templateId;
  if (!estEnchere(tid)) throw erreur("Votre template actuel n'est pas un site d'enchères.", 400);
  const paliers = await paliersDe(tid);
  if (!paliers.length) throw erreur("Ce template n'a pas de paliers.", 400);
  const p = paliers.find((x) => x.limite === limite);
  if (!p) throw erreur('Palier inconnu pour ce template.', 400);
  const nb = await compter(gid);
  if (nb > p.limite) {
    throw erreur(
      `Ce palier permet ${p.limite} lot${p.limite > 1 ? 's' : ''} et vous en avez ${nb} d'actifs. Attendez la fin ou annulez ${nb - p.limite} lot${nb - p.limite > 1 ? 's' : ''} d'abord.`,
      409, 'LIMITE_LOTS');
  }
  const plan = BL.planId(tid, p.limite);
  await pool.query('UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2', [plan, gid]);
  return { plan, limite: p.limite };
}

// Changement de TEMPLATE vers un site d'enchères : bloque si aucun palier ne peut contenir les lots actifs.
// Garde le palier déjà choisi s'il existe dans le nouveau template, sinon prend le plus petit palier qui convient.
async function appliquerChangementTemplate(gid, nouveauTemplateId) {
  if (!estEnchere(nouveauTemplateId)) return { ok: true };
  const s = (await pool.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid])).rows[0];
  if (s && s.template_id === nouveauTemplateId) return { ok: true };
  const paliers = await paliersDe(nouveauTemplateId);
  if (!paliers.length) return { ok: true };
  const nb = await compter(gid);
  const plan = ((await pool.query('SELECT plan FROM gestionnaires WHERE id = $1', [gid])).rows[0] || {}).plan || '';
  const courant = paliers.find((p) => BL.planId(nouveauTemplateId, p.limite) === plan);
  if (courant && nb <= courant.limite) return { ok: true };
  const convenable = paliers.find((p) => p.limite >= nb);
  if (!convenable) {
    const max = paliers[paliers.length - 1].limite;
    return {
      ok: false, code: 'LIMITE_LOTS', nb_actifs: nb, limite: max,
      message: `Ce template permet au maximum ${max} lot${max > 1 ? 's' : ''} actif${max > 1 ? 's' : ''} et vous en avez ${nb}. Attendez la fin ou annulez ${nb - max} lot${nb - max > 1 ? 's' : ''} d'abord.`,
    };
  }
  const nouveau = BL.planId(nouveauTemplateId, convenable.limite);
  await pool.query('UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2', [nouveau, gid]);
  return { ok: true, plan: nouveau, limite: convenable.limite };
}

module.exports = { estEnchere, compter, etat, etatPourPage, verifierActivation, changerPalier, appliquerChangementTemplate };