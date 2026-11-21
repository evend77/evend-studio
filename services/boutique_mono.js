// CHEMIN : services/boutique_mono.js
// e-Vend Studio — Template « Mono-produit » (boutique-simple) : UN SEUL produit vendu, avec autant de variantes que voulu.
//
// Règles :
//  • le template vend un seul produit : le « produit retenu » (table boutique_mono_produit, une ligne par gestionnaire) ;
//  • aucune ligne enregistrée : le produit retenu est la première annonce ACTIVE de sa liste (la plus récente), et le choix est mémorisé ;
//  • les autres annonces ne sont ni supprimées ni désactivées : elles restent dans sa liste, ne sont pas vendues, et reviennent
//    si le gestionnaire retourne à un template multi-produits ;
//  • le blocage est fait ICI, côté serveur (catalogue public, panier, caisse) — jamais seulement à l'affichage ;
//  • pas de produit retenu actif : le gestionnaire peut en publier un (jamais deux en même temps).
// Les anciennes commandes (tous produits) restent visibles dans ses commandes.

'use strict';

const pool = require('../db');

const TEMPLATE = 'boutique-simple';             // comparaison EXACTE : « boutique-simplisse » commence par « boutique-simple »
const estTemplateMono = (t) => t === TEMPLATE;

// Add-ons sans objet pour un seul produit (les connecteurs eBay/Etsy importent des annonces)
const ADDONS_EXCLUS = ['encheres', 'offres_du_jour', 'connecteur_ebay', 'connecteur_etsy'];

async function estMono(gid, db) {
  const r = await (db || pool).query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
  return estTemplateMono(r.rows[0] && r.rows[0].template_id);
}

const BASE = `gestionnaire_id = $1 AND collaborateur_id IS NULL`;

// Id du produit retenu qui est ACTIF maintenant (null si aucun). Mémorise le choix par défaut (annonce active la plus récente).
async function retenuActif(gid, db) {
  const c = db || pool;
  const m = await c.query('SELECT produit_id FROM boutique_mono_produit WHERE gestionnaire_id = $1', [gid]);
  if (m.rows.length) {
    const p = await c.query(`SELECT id FROM produits WHERE id = $2 AND ${BASE} AND statut = 'actif'`, [gid, m.rows[0].produit_id]);
    return p.rows.length ? p.rows[0].id : null;
  }
  const d = await c.query(`SELECT id FROM produits WHERE ${BASE} AND statut = 'actif' ORDER BY created_at DESC, id DESC LIMIT 1`, [gid]);
  if (!d.rows.length) return null;
  await c.query(`INSERT INTO boutique_mono_produit (gestionnaire_id, produit_id) VALUES ($1, $2) ON CONFLICT (gestionnaire_id) DO NOTHING`, [gid, d.rows[0].id]);
  return d.rows[0].id;
}

// undefined = template multi-produits (aucune restriction) ; sinon l'id du produit retenu actif, ou null
async function retenuPour(gid, db) {
  if (!(await estMono(gid, db))) return undefined;
  return retenuActif(gid, db);
}

// Après la publication d'une annonce : si le produit retenu n'est plus actif, la nouvelle annonce devient le produit retenu
async function apresActivation(gid, produitId, db) {
  const c = db || pool;
  if (!(await estMono(gid, c))) return;
  if (await retenuActif(gid, c)) return;
  await c.query(
    `INSERT INTO boutique_mono_produit (gestionnaire_id, produit_id) VALUES ($1, $2)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET produit_id = EXCLUDED.produit_id, updated_at = NOW()`, [gid, produitId]);
}

// Le gestionnaire choisit son produit parmi ses annonces actives
async function choisir(gid, produitId, db) {
  const c = db || pool;
  const p = await c.query(`SELECT id FROM produits WHERE id = $2 AND ${BASE} AND statut = 'actif'`, [gid, produitId]);
  if (!p.rows.length) return false;
  await c.query(
    `INSERT INTO boutique_mono_produit (gestionnaire_id, produit_id) VALUES ($1, $2)
     ON CONFLICT (gestionnaire_id) DO UPDATE SET produit_id = EXCLUDED.produit_id, updated_at = NOW()`, [gid, produitId]);
  return true;
}

// Liste pour l'écran « Produit vendu » : annonces actives, avec le produit retenu marqué
async function etat(gid, db) {
  const c = db || pool;
  const mono = await estMono(gid, c);
  if (!mono) return { mono: false, retenu_id: null, produits: [] };
  const retenu = await retenuActif(gid, c);
  const r = await c.query(
    `SELECT id, titre, prix, photo_principale, statut FROM produits WHERE ${BASE} AND statut = 'actif' ORDER BY created_at DESC, id DESC LIMIT 200`, [gid]);
  return { mono: true, retenu_id: retenu, produits: r.rows.map((x) => ({ id: x.id, titre: x.titre, prix: Number(x.prix), photo: x.photo_principale || null })) };
}

module.exports = { TEMPLATE, estTemplateMono, ADDONS_EXCLUS, estMono, retenuActif, retenuPour, apresActivation, choisir, etat };