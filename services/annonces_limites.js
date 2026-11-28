// CHEMIN : services/annonces_limites.js
// e-Vend Studio — Limites d'annonces par palier pour les templates PETITES ANNONCES (annonces-*).
// Même système que les boutiques (services/boutique_limites.js) :
//   - paliers = Prix Template (templates_prix.prix_paliers, type « paliers »), lus avec paliersDuTemplate() de boutique_limites
//   - palier choisi = gestionnaires.plan = « <template>-<limite> » (ex. annonces-auto-classique-25), même planId() que les boutiques
//   - seules les annonces ACTIVES comptent (statut active et non expirée) ; une annonce vendue, archivée ou expirée ne compte pas
// Un template sans paliers dans Prix Template n'a aucune limite. Les boutiques et le MV ne sont jamais touchés.

'use strict';

const pool = require('../db');
const BL = require('./boutique_limites');
const PRIX = require('./annonces_prix');   // grille de prix unique des annonces (page admin Templates → Annonces (tarifs))

const estAnnonces = (templateId) => String(templateId || '').startsWith('annonces-');

// Paliers d'un template annonces : la grille unique de l'admin quand elle contient au moins un palier, sinon les « Prix Template » du template (comme avant)
async function paliersDe(templateId, db) {
  const g = await PRIX.paliersPourLimites(db);
  return g.length ? g : BL.paliersDuTemplate(templateId, db);
}

// Chargé à l'appel (annonces_site.js charge ce fichier au démarrage : évite le cycle)
function erreur(message, statut, code) {
  const { ErreurAnnonce } = require('./annonces_site');
  return new ErreurAnnonce(message, statut, code);
}

async function compter(gid, db) {
  await require('./annonces_site').pret();
  const r = await (db || pool).query(
    `SELECT COUNT(*)::int AS n FROM ann_annonces
      WHERE gestionnaire_id = $1 AND statut = 'active' AND (date_expiration IS NULL OR date_expiration > NOW())`, [gid]);
  return r.rows[0].n;
}

// État du palier : limite = null quand le template n'a pas de paliers (aucune limite)
async function etat(gid, db) {
  const c = db || pool;
  const s = await c.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
  const templateId = (s.rows[0] && s.rows[0].template_id) || '';
  const g = await c.query('SELECT plan FROM gestionnaires WHERE id = $1', [gid]);
  const plan = (g.rows[0] && g.rows[0].plan) || '';
  const paliers = estAnnonces(templateId) ? await paliersDe(templateId, c) : [];
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

// Appelé avant de publier : création, remise en ligne (vendue/archivée → active), renouvellement d'une annonce expirée
async function verifierActivation(gid, ajout) {
  const e = await etat(gid);
  if (e.limite === null) return e;
  const nb = await compter(gid);
  if (nb + (ajout || 1) > e.limite) {
    throw erreur(
      `Votre palier permet ${e.limite} annonce${e.limite > 1 ? 's' : ''} active${e.limite > 1 ? 's' : ''} et vous en avez déjà ${nb}. Marquez une annonce comme vendue ou archivez-la, ou passez à un palier supérieur dans « Mon plan & limites ».`,
      403, 'LIMITE_ANNONCES');
  }
  return e;
}

// Changer de palier. Sans templateId : dans le template actuel. Avec templateId : pour ce template (choix fait dans la fenêtre
// de palier AVANT d'appliquer le template ; le palier est ensuite conservé par appliquerChangementTemplate).
async function changerPalier(gid, limite, templateId) {
  let tid = templateId;
  if (!tid) tid = (await etat(gid)).templateId;
  if (!estAnnonces(tid)) throw erreur("Votre template actuel n'est pas un template de petites annonces.", 400);
  const paliers = await paliersDe(tid);
  if (!paliers.length) throw erreur("Ce template n'a pas de paliers.", 400);
  const p = paliers.find((x) => x.limite === limite);
  if (!p) throw erreur('Palier inconnu pour ce template.', 400);
  const nb = await compter(gid);
  if (nb > p.limite) {
    throw erreur(
      `Ce palier permet ${p.limite} annonce${p.limite > 1 ? 's' : ''} et vous en avez ${nb} d'actives. Marquez ou archivez ${nb - p.limite} annonce${nb - p.limite > 1 ? 's' : ''} d'abord.`,
      409, 'LIMITE_ANNONCES');
  }
  const plan = BL.planId(tid, p.limite);
  await pool.query('UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2', [plan, gid]);
  return { plan, limite: p.limite };
}

// Changement de TEMPLATE vers un template annonces : bloque si aucun palier ne peut contenir les annonces actives.
// Garde le palier déjà choisi s'il existe dans le nouveau template, sinon prend le plus petit palier qui convient.
async function appliquerChangementTemplate(gid, nouveauTemplateId) {
  if (!estAnnonces(nouveauTemplateId)) return { ok: true };
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
      ok: false, code: 'LIMITE_ANNONCES', nb_actifs: nb, limite: max,
      message: `Ce template permet au maximum ${max} annonce${max > 1 ? 's' : ''} active${max > 1 ? 's' : ''} et vous en avez ${nb}. Marquez ou archivez ${nb - max} annonce${nb - max > 1 ? 's' : ''} d'abord.`,
    };
  }
  const nouveau = BL.planId(nouveauTemplateId, convenable.limite);
  await pool.query('UPDATE gestionnaires SET plan = $1, updated_at = NOW() WHERE id = $2', [nouveau, gid]);
  return { ok: true, plan: nouveau, limite: convenable.limite };
}

module.exports = { estAnnonces, compter, etat, etatPourPage, verifierActivation, changerPalier, appliquerChangementTemplate };