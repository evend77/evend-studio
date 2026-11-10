// CHEMIN : services/studio_offres.js
// e-Vend Studio — Add-on « Offres du jour » : règles + SQL partagé.
//
// PRINCIPE : le prix de l'offre est choisi À LA LECTURE (aucune tâche planifiée). Chaque requête qui lit le prix d'un produit
// remplace  p.prix_promo  par  ${sqlPromo('p')} AS prix_promo  : tant que l'offre est active (début <= maintenant < fin), son prix
// remplace le prix promo habituel ; sinon le prix promo habituel reste. Début et fin sont donc exacts à la seconde, sur plusieurs serveurs.
// Une offre expirée reste en base (colonnes offre_*) jusqu'à ce que le collaborateur la retire ou la remplace.

'use strict';

const pool = require('../db');
const addons = require('./studio_addons');

const CODE_ADDON = 'offres_du_jour';
const DUREE_MIN_MS = 60 * 60 * 1000;          // une offre dure au moins 1 heure
const DEBUT_MAX_JOURS = 60;                   // on peut programmer une offre jusqu'à 60 jours d'avance

class ErreurOffre extends Error { constructor(m, status = 400) { super(m); this.status = status; } }
const refus = (m, s) => { throw new ErreurOffre(m, s); };

// ── SQL partagé ──
const actif = (a = 'p') => `(${a}.offre_prix IS NOT NULL AND ${a}.offre_debut <= NOW() AND ${a}.offre_fin > NOW())`;
const sqlPromo = (a = 'p') => `(CASE WHEN ${actif(a)} THEN ${a}.offre_prix ELSE ${a}.prix_promo END)`;
const sqlFin = (a = 'p') => `(CASE WHEN ${actif(a)} THEN ${a}.offre_fin END)`;
const sqlEtat = (a = 'p') => `(CASE WHEN ${a}.offre_prix IS NULL THEN 'aucune' WHEN ${a}.offre_fin <= NOW() THEN 'terminee' WHEN ${a}.offre_debut > NOW() THEN 'venir' ELSE 'cours' END)`;
const sqlEnchereVivante = (a = 'p') => `EXISTS (SELECT 1 FROM encheres e WHERE e.produit_id = ${a}.id AND e.statut IN ('active','attente_paiement'))`;

const arrondi = (n) => Math.round(n * 100) / 100;
const borne = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def; };

// Durée maximale d'une offre : réglage du gestionnaire (sites.config.multivendeur.offre_duree_max_jours), 7 jours par défaut
async function reglages(gid, db = pool) {
  const r = await db.query('SELECT config FROM sites WHERE gestionnaire_id = $1', [gid]);
  const mv = (r.rows[0] && r.rows[0].config && r.rows[0].config.multivendeur) || {};
  return { dureeMaxJours: Math.round(borne(mv.offre_duree_max_jours, 1, 60, 7)) };
}

const actifPourBoutique = (gid) => addons.addonActifRapide(gid, CODE_ADDON, pool);

// Crée ou remplace l'offre d'un produit du collaborateur.
async function enregistrerOffre({ gid, collaborateurId, produitId, prixOffre, debut, fin }) {
  if (!(await actifPourBoutique(gid))) refus("L'option « Offres du jour » n'est pas activée pour cette marketplace.", 403);
  if (!(await require('./studio_plans_collab').collabAutorise(gid, collaborateurId, 'offres_du_jour', pool).catch(() => true))) refus("L'option « Offres du jour » n'est pas incluse dans votre plan.", 403);
  const cfg = await reglages(gid);
  const prix = arrondi(Number(prixOffre));
  if (!Number.isFinite(prix) || prix <= 0) refus("Le prix de l'offre est invalide.");
  const maintenant = Date.now();
  let d = debut ? new Date(debut) : new Date(maintenant);
  if (Number.isNaN(d.getTime())) refus('Date de début invalide.');
  if (d.getTime() < maintenant) d = new Date(maintenant);   // un début dans le passé = tout de suite
  const f = new Date(fin);
  if (!fin || Number.isNaN(f.getTime())) refus('Date de fin invalide.');
  if (d.getTime() > maintenant + DEBUT_MAX_JOURS * 86400000) refus(`Une offre peut être programmée ${DEBUT_MAX_JOURS} jours d'avance au maximum.`);
  if (f.getTime() - d.getTime() < DUREE_MIN_MS) refus("Une offre doit durer au moins 1 heure.");
  if (f.getTime() - d.getTime() > cfg.dureeMaxJours * 86400000) refus(`Une offre ne peut pas durer plus de ${cfg.dureeMaxJours} jour${cfg.dureeMaxJours > 1 ? 's' : ''}.`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = (await client.query(
      `SELECT id, prix, statut FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 FOR UPDATE`, [produitId, gid, collaborateurId])).rows[0];
    if (!p) refus('Produit introuvable.', 404);
    if (p.statut !== 'actif') refus('Seule une annonce active peut avoir une offre.');
    if ((await client.query(`SELECT 1 FROM encheres WHERE produit_id = $1 AND statut IN ('active','attente_paiement') LIMIT 1`, [produitId])).rowCount)
      refus("Ce produit est en enchère : une offre du jour n'est pas possible pendant l'enchère.", 409);
    const base = Number(p.prix) || 0;
    if (!(prix < base)) refus(`Le prix de l'offre doit être plus bas que le prix du produit (${base.toFixed(2)} $).`);
    const rp = await require('./studio_regles_produits').lire(gid, client);
    const err = require('./studio_regles_produits').erreurPrix(rp, prix, "Prix de l'offre");
    if (err) refus(err);
    await client.query('UPDATE produits SET offre_prix = $1, offre_debut = $2, offre_fin = $3 WHERE id = $4', [prix, d, f, produitId]);
    await client.query('COMMIT');
    return { produit_id: produitId, offre_prix: prix, offre_debut: d.toISOString(), offre_fin: f.toISOString() };
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }
}

async function retirerOffre({ gid, collaborateurId, produitId }) {
  const r = collaborateurId
    ? await pool.query(`UPDATE produits SET offre_prix = NULL, offre_debut = NULL, offre_fin = NULL WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 AND offre_prix IS NOT NULL`, [produitId, gid, collaborateurId])
    : await pool.query(`UPDATE produits SET offre_prix = NULL, offre_debut = NULL, offre_fin = NULL WHERE id = $1 AND gestionnaire_id = $2 AND offre_prix IS NOT NULL`, [produitId, gid]);
  if (!r.rowCount) refus('Offre introuvable.', 404);
}

module.exports = { CODE_ADDON, ErreurOffre, actif, sqlPromo, sqlFin, sqlEtat, sqlEnchereVivante, reglages, actifPourBoutique, enregistrerOffre, retirerOffre, borne };