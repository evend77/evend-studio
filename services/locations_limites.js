// CHEMIN : services/locations_limites.js
// e-Vend Studio — Template LOCATION DE BIENS (reservation-location) : limite d'annonces (objets du catalogue) selon le palier choisi.
//   • Paliers = grille réglée dans l'admin (Templates → Locations (tarifs)). Grille vide = aucune limite.
//   • Palier choisi par le gestionnaire = gestionnaires.plan = « reservation-location-<limite> » (même principe que les boutiques et les enchères).
//   • Sans palier choisi (ou palier disparu de la grille) : le plus petit palier s'applique.
//   • Les « annonces » comptées = les objets du catalogue de location (config.location_objets du site).
// Ne touche jamais aux autres templates.

'use strict';

const pool = require('../db');
const PRIX = require('./locations_prix');

const TEMPLATE = 'reservation-location';

class ErreurLocation extends Error {
  constructor(message, status, code, extra) { super(message); this.status = status || 400; this.code = code; this.extra = extra; }
}

const planId = (limite) => `${TEMPLATE}-${limite}`;

function nbObjets(config) {
  let c = config;
  if (typeof c === 'string') { try { c = JSON.parse(c); } catch (e) { c = null; } }
  return c && Array.isArray(c.location_objets) ? c.location_objets.length : 0;
}

async function compter(gid, db) {
  const r = await (db || pool).query('SELECT config FROM sites WHERE gestionnaire_id = $1', [gid]);
  return r.rows[0] ? nbObjets(r.rows[0].config) : 0;
}

// limite = null quand la grille est vide (aucune limite)
async function etat(gid, db) {
  const c = db || pool;
  const rg = await PRIX.reglages(c);
  const g = await c.query('SELECT plan FROM gestionnaires WHERE id = $1', [gid]);
  const plan = (g.rows[0] && g.rows[0].plan) || '';
  const paliers = rg.paliers.map((p) => ({
    label: p.nom, limite: p.limite, prix: PRIX.formaterPrix(p.prix, rg.devise, rg.suffixe), prix_nombre: p.prix, plan_id: planId(p.limite),
  }));
  const palier = paliers.length ? (paliers.find((p) => p.plan_id === plan) || paliers[0]) : null;
  return { plan, paliers, palier, limite: palier ? palier.limite : null };
}

async function etatPourPage(gid) {
  const e = await etat(gid);
  return { limite: e.limite, nb_objets: await compter(gid), palier_actuel: e.palier ? e.palier.plan_id : null, paliers: e.paliers };
}

// Avant d'enregistrer la config d'un site de location : refuse s'il y a plus d'objets que le palier le permet
async function verifierConfig(gid, config) {
  const e = await etat(gid);
  if (e.limite === null) return;
  const n = nbObjets(config);
  if (n > e.limite) {
    throw new ErreurLocation(
      `Votre palier permet ${e.limite} annonce${e.limite > 1 ? 's' : ''} de location et votre catalogue en contient ${n}. Retirez des objets ou choisissez un palier plus grand.`,
      409, 'LIMITE_LOCATIONS', { limite: e.limite, nb_objets: n });
  }
}

async function changerPalier(gid, limite) {
  const e = await etat(gid);
  const p = e.paliers.find((x) => x.limite === limite);
  if (!p) throw new ErreurLocation('Ce palier n\'existe pas.', 400, 'PALIER_INCONNU');
  const n = await compter(gid);
  if (n > limite) {
    throw new ErreurLocation(
      `Votre catalogue contient ${n} objets : retirez-en pour passer à un palier de ${limite}.`, 409, 'LIMITE_LOCATIONS', { limite, nb_objets: n });
  }
  await pool.query('UPDATE gestionnaires SET plan = $1 WHERE id = $2', [p.plan_id, gid]);
  return etatPourPage(gid);
}

module.exports = { ErreurLocation, TEMPLATE, planId, nbObjets, compter, etat, etatPourPage, verifierConfig, changerPalier };