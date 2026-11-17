// CHEMIN : services/boutique_offres.js
// e-Vend Studio — Add-on « Offres du jour » des templates boutique (solo). Copie adaptée de services/studio_offres.js (MV) ; ne touche à rien du MV.
//
// PRINCIPE (comme au MV) : le prix de l'offre est choisi À LA LECTURE, sans tâche planifiée. Chaque requête qui lit le prix d'un produit
// remplace  prix_promo  par  sqlPromo('p') : tant que l'offre est active (début <= maintenant < fin) ET que l'add-on est activé,
// son prix remplace le prix promo habituel ; sinon le prix promo habituel reste. Début et fin sont exacts à la seconde.
// Désactiver l'add-on arrête les offres tout de suite ; les réactiver ramène les offres non expirées.
// Une offre expirée reste en base (colonnes offre_prix / offre_debut / offre_fin de produits) jusqu'à ce qu'elle soit retirée ou remplacée.

'use strict';

const pool = require('../db');
const { ErreurBoutique } = require('./boutique_limites');
const A = require('./boutique_addons');

const CODE_ADDON = 'offres_du_jour';
const DUREE_MIN_MS = 60 * 60 * 1000;      // une offre dure au moins 1 heure
const DUREE_MAX_JOURS = 60;               // et au plus 60 jours
const DEBUT_MAX_JOURS = 60;               // on peut programmer une offre jusqu'à 60 jours d'avance

const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };

// ── SQL partagé ──
const addonOn = (a) => `EXISTS (SELECT 1 FROM boutique_addons_achetes x JOIN boutique_addons d ON d.code = x.code WHERE x.gestionnaire_id = ${a}.gestionnaire_id AND x.code = '${CODE_ADDON}' AND d.actif = true AND d.branche = true)`;
const actif = (a = 'p') => `(${a}.offre_prix IS NOT NULL AND ${a}.offre_debut <= NOW() AND ${a}.offre_fin > NOW() AND ${addonOn(a)})`;
const sqlPromo = (a = 'p') => `(CASE WHEN ${actif(a)} THEN ${a}.offre_prix ELSE ${a}.prix_promo END)`;
const sqlFin = (a = 'p') => `(CASE WHEN ${actif(a)} THEN ${a}.offre_fin END)`;
const sqlEtat = (a = 'p') => `(CASE WHEN ${a}.offre_prix IS NULL THEN 'aucune' WHEN ${a}.offre_fin <= NOW() THEN 'terminee' WHEN ${a}.offre_debut > NOW() THEN 'venir' ELSE 'cours' END)`;

const arrondi = (n) => Math.round(n * 100) / 100;
const BASE = 'gestionnaire_id = $1 AND collaborateur_id IS NULL';   // seulement SES produits : jamais ceux des collaborateurs du MV

const actifPourGestionnaire = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

// Crée ou remplace l'offre d'un produit du gestionnaire.
async function enregistrerOffre({ gid, produitId, prixOffre, debut, fin }) {
  if (!(await actifPourGestionnaire(gid))) refus("L'add-on « Offres du jour » n'est pas activé. Activez-le dans « Mon plan & limites ».", 403);
  const prix = arrondi(Number(prixOffre));
  if (!Number.isFinite(prix) || prix <= 0) refus("Le prix de l'offre est invalide.");
  const maintenant = Date.now();
  let d = debut ? new Date(debut) : new Date(maintenant);
  if (Number.isNaN(d.getTime())) refus('Date de début invalide.');
  if (d.getTime() < maintenant) d = new Date(maintenant);   // un début dans le passé = tout de suite
  const f = new Date(fin);
  if (!fin || Number.isNaN(f.getTime())) refus('Date de fin invalide.');
  if (d.getTime() > maintenant + DEBUT_MAX_JOURS * 86400000) refus(`Une offre peut être programmée ${DEBUT_MAX_JOURS} jours d'avance au maximum.`);
  if (f.getTime() - d.getTime() < DUREE_MIN_MS) refus('Une offre doit durer au moins 1 heure.');
  if (f.getTime() - d.getTime() > DUREE_MAX_JOURS * 86400000) refus(`Une offre ne peut pas durer plus de ${DUREE_MAX_JOURS} jours.`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = (await client.query(`SELECT id, prix, statut FROM produits WHERE id = $2 AND ${BASE} FOR UPDATE`, [gid, produitId])).rows[0];
    if (!p) refus('Produit introuvable.', 404);
    if (p.statut !== 'actif') refus('Seul un produit actif peut avoir une offre.');
    const base = Number(p.prix) || 0;
    if (!(prix < base)) refus(`Le prix de l'offre doit être plus bas que le prix du produit (${base.toFixed(2)} $).`);
    await client.query('UPDATE produits SET offre_prix = $1, offre_debut = $2, offre_fin = $3 WHERE id = $4', [prix, d, f, produitId]);
    await client.query('COMMIT');
    return { produit_id: produitId, offre_prix: prix, offre_debut: d.toISOString(), offre_fin: f.toISOString() };
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; }
  finally { client.release(); }
}

async function retirerOffre({ gid, produitId }) {
  const r = await pool.query(`UPDATE produits SET offre_prix = NULL, offre_debut = NULL, offre_fin = NULL WHERE id = $2 AND ${BASE} AND offre_prix IS NOT NULL`, [gid, produitId]);
  if (!r.rowCount) refus('Offre introuvable.', 404);
}

module.exports = { CODE_ADDON, DUREE_MAX_JOURS, DUREE_MIN_MS, actif, sqlPromo, sqlFin, sqlEtat, enregistrerOffre, retirerOffre, actifPourGestionnaire, BASE };