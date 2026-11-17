// CHEMIN : services/boutique_negociations.js
// e-Vend Studio — Add-on « Faire une offre » des templates boutique (solo). Adapté de services/studio_negociations.js (MV) ; ne touche à rien du MV.
//
// Différences avec le MV : le VENDEUR est le gestionnaire (pas de collaborateur), les réglages (offre minimale, validité, délai de réponse,
// limite par jour) sont ceux du gestionnaire (table boutique_reglages), et les offres vivent dans boutique_negociations.
//
// PRINCIPE (comme au MV) : aucune tâche planifiée. Une négociation garde sa date limite (expire_le) ; l'état « expirée » est calculé à la lecture
// (sqlEtat). Le stock n'est pas réservé pendant la négociation : le premier qui paie l'obtient (le stock est réservé à la création de la commande).
//
// Cycle :  attente (offre de l'acheteur) → acceptee | refusee | contre (vendeur)   ·   contre → acceptee | refusee (acheteur)
//          acceptee → payee (paiement)   ·   tout état vivant → annulee (l'acheteur retire) ou expiree (calculé)
//
// ENCHÈRES (add-on à venir) : le jour où services/boutique_encheres.js existera et exportera  sqlEnchereVivante(alias),  ce service
// refusera automatiquement les offres sur un produit aux enchères — rien d'autre à modifier ici.

'use strict';

const pool = require('../db');
const { ErreurBoutique } = require('./boutique_limites');
const A = require('./boutique_addons');
const OFFRES = require('./boutique_offres');

const CODE_ADDON = 'faire_une_offre';
const DEFAUTS = { actif: true, minPct: 50, validiteH: 48, reponseJours: 7, maxParJour: 10 };

const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };
const arrondi = (n) => Math.round(n * 100) / 100;
const $$ = (n) => `${Number(n).toFixed(2).replace('.', ',')} $`;
const motCourt = (v, n = 300) => (typeof v === 'string' ? v.trim().replace(/[\u0000-\u001f\u007f<>]/g, ' ').slice(0, n) : '') || null;

// ── Point de branchement des enchères (voir l'en-tête) ──
let ENCHERES = null;
try { ENCHERES = require('./boutique_encheres'); } catch (e) { if (!(e && e.code === 'MODULE_NOT_FOUND' && /boutique_encheres/.test(e.message))) throw e; }
const sqlEnchere = (a) => (ENCHERES && typeof ENCHERES.sqlEnchereVivante === 'function' ? ENCHERES.sqlEnchereVivante(a) : 'FALSE');

// ── SQL partagé ──
const sqlEtat = (a = 'n') => `(CASE WHEN ${a}.statut IN ('attente','contre','acceptee') AND ${a}.expire_le <= NOW() THEN 'expiree' ELSE ${a}.statut END)`;
const sqlVivante = (a = 'n') => `(${a}.statut IN ('attente','contre','acceptee') AND ${a}.expire_le > NOW())`;
// L'add-on est-il activé pour le gestionnaire de la ligne `a` ? (sert à la caisse : add-on désactivé = offres acceptées plus honorées)
const sqlAddonOn = (a) => `EXISTS (SELECT 1 FROM boutique_addons_achetes x JOIN boutique_addons d ON d.code = x.code WHERE x.gestionnaire_id = ${a}.gestionnaire_id AND x.code = '${CODE_ADDON}' AND d.actif = true AND d.branche = true)`;

const actifPourBoutique = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

// ── Réglages du gestionnaire ──
const borne = (v, min, max, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def; };

async function reglages(gid, db) {
  const r = (await (db || pool).query(
    `SELECT negociation_actif, negociation_min_pct, negociation_validite_h, negociation_reponse_jours, negociation_max_par_jour FROM boutique_reglages WHERE gestionnaire_id = $1`, [gid])).rows[0];
  if (!r) return { ...DEFAUTS };
  return {
    actif: r.negociation_actif !== false,
    minPct: borne(r.negociation_min_pct, 10, 99, DEFAUTS.minPct),
    validiteH: borne(r.negociation_validite_h, 1, 336, DEFAUTS.validiteH),
    reponseJours: borne(r.negociation_reponse_jours, 1, 30, DEFAUTS.reponseJours),
    maxParJour: borne(r.negociation_max_par_jour, 1, 50, DEFAUTS.maxParJour),
  };
}

async function ecrireReglages(gid, b) {
  b = b || {};
  const pct = Math.round(Number(b.min_pct)), h = Math.round(Number(b.validite_h)), j = Math.round(Number(b.reponse_jours)), m = Math.round(Number(b.max_par_jour));
  if (!Number.isFinite(pct) || pct < 10 || pct > 99) refus("L'offre minimale doit être entre 10 % et 99 % du prix.");
  if (!Number.isFinite(h) || h < 1 || h > 336) refus('La validité doit être entre 1 et 336 heures.');
  if (!Number.isFinite(j) || j < 1 || j > 30) refus('Le délai de réponse doit être entre 1 et 30 jours.');
  if (!Number.isFinite(m) || m < 1 || m > 50) refus('La limite par acheteur doit être entre 1 et 50 offres par jour.');
  await pool.query(
    `INSERT INTO boutique_reglages (gestionnaire_id, negociation_actif, negociation_min_pct, negociation_validite_h, negociation_reponse_jours, negociation_max_par_jour, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET negociation_actif = EXCLUDED.negociation_actif, negociation_min_pct = EXCLUDED.negociation_min_pct,
       negociation_validite_h = EXCLUDED.negociation_validite_h, negociation_reponse_jours = EXCLUDED.negociation_reponse_jours,
       negociation_max_par_jour = EXCLUDED.negociation_max_par_jour, updated_at = NOW()`,
    [gid, b.actif !== false, pct, h, j, m]);
  return reglages(gid);
}

// Prix effectif (promo valide, offre du jour, variante avec son prix propre) : la règle de la caisse elle-même (chargée à l'appel : pas de dépendance circulaire)
const prixEtStock = (p, variante) => require('./boutique_commandes').prixEtStock(p, variante);

async function lireProduit(db, gid, produitId, verrou = false) {
  return (await db.query(
    `SELECT id, titre, prix, ${OFFRES.sqlPromo('produits')} AS prix_promo, stock, variantes, statut, date_parution, date_expiration, quantite_min, photo_principale,
            ${sqlEnchere('produits')} AS enchere
       FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL${verrou ? ' FOR UPDATE' : ''}`, [produitId, gid])).rows[0];
}

// Ce produit se prête-t-il à une offre ? (texte du problème, ou null)
function problemeProduit(p) {
  if (!p || p.statut !== 'actif') return { m: "Ce produit n'est plus disponible.", s: 404 };
  if (p.date_parution && new Date(p.date_parution).getTime() > Date.now()) return { m: "Ce produit n'est pas encore en vente.", s: 409 };
  if (p.date_expiration && new Date(p.date_expiration).getTime() <= Date.now()) return { m: "Cette annonce n'est plus disponible.", s: 409 };
  if (p.enchere) return { m: 'Ce produit est aux enchères : on ne peut pas y faire une offre.', s: 409 };
  if (p.quantite_min && Number(p.quantite_min) > 1) return { m: `Ce produit se vend par lots de ${p.quantite_min} : une offre de prix n'est pas possible.`, s: 409 };
  return null;
}

// ── Acheteur : faire une offre ──
async function faireOffre({ gid, acheteurId, produitId, variante, prix, message }) {
  if (!(await actifPourBoutique(gid))) refus("L'option « Faire une offre » n'est pas activée pour cette boutique.", 403);
  const offert = arrondi(Number(prix));
  if (!Number.isFinite(offert) || offert <= 0) refus('Le prix proposé est invalide.');
  const v = typeof variante === 'string' ? variante.trim().slice(0, 200) : '';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cfg = await reglages(gid, client);
    if (!cfg.actif) refus("Cette boutique n'accepte pas les offres de prix pour le moment.", 409);
    const p = await lireProduit(client, gid, produitId, true);
    const pb = problemeProduit(p);
    if (pb) refus(pb.m, pb.s);
    const choix = prixEtStock(p, v);
    if (choix.erreur) refus(choix.erreur);
    if (choix.stock <= 0) refus('Ce produit est épuisé.', 409);
    if (offert >= choix.prix) refus(`Votre offre doit être inférieure au prix actuel (${$$(choix.prix)}). Vous pouvez simplement l'acheter.`);
    const minimum = arrondi(choix.prix * cfg.minPct / 100);
    if (offert < minimum) refus(`Cette boutique n'accepte pas d'offre sous ${cfg.minPct} % du prix (minimum ${$$(minimum)}).`);

    const vivante = (await client.query(
      `SELECT 1 FROM boutique_negociations n WHERE n.gestionnaire_id = $1 AND n.acheteur_id = $2 AND n.produit_id = $3 AND n.variante = $4 AND ${sqlVivante('n')} LIMIT 1`, [gid, acheteurId, produitId, v])).rows[0];
    if (vivante) refus('Vous avez déjà une offre en cours sur ce produit. Consultez « Mes offres ».', 409);
    const jour = (await client.query(`SELECT COUNT(*)::int AS n FROM boutique_negociations WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`, [acheteurId, gid])).rows[0].n;
    if (jour >= cfg.maxParJour) refus(`Limite de ${cfg.maxParJour} offre${cfg.maxParJour > 1 ? 's' : ''} par jour atteinte. Réessayez demain.`, 429);

    const n = (await client.query(
      `INSERT INTO boutique_negociations (gestionnaire_id, produit_id, acheteur_id, variante, titre, image_url, prix_produit, prix_offert, message, expire_le)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW() + ($10 || ' days')::interval) RETURNING *`,
      [gid, produitId, acheteurId, v, p.titre, p.photo_principale || null, choix.prix, offert, motCourt(message), String(cfg.reponseJours)])).rows[0];
    await client.query('COMMIT');
    return { negociation: n, reponse_jours: cfg.reponseJours };
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
}

// ── Vendeur (le gestionnaire) : répondre ──
async function repondreVendeur({ gid, id, action, prixContre, message }) {
  const cfg = await reglages(gid);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const n = (await client.query(`SELECT n.*, ${sqlEtat('n')} AS etat FROM boutique_negociations n WHERE n.id = $1 AND n.gestionnaire_id = $2 FOR UPDATE`, [id, gid])).rows[0];
    if (!n) refus('Offre introuvable.', 404);
    if (n.etat !== 'attente') refus(n.etat === 'expiree' ? 'Cette offre est expirée.' : "Cette offre n'attend plus de réponse de votre part.", 409);
    const mot = motCourt(message);
    if (action === 'accepter') {
      await client.query(`UPDATE boutique_negociations SET statut='acceptee', prix_final=prix_offert, message_vendeur=$2, expire_le = NOW() + ($3 || ' hours')::interval, updated_at=NOW() WHERE id=$1`, [id, mot, String(cfg.validiteH)]);
    } else if (action === 'refuser') {
      await client.query(`UPDATE boutique_negociations SET statut='refusee', message_vendeur=$2, updated_at=NOW() WHERE id=$1`, [id, mot]);
    } else if (action === 'contre') {
      const c = arrondi(Number(prixContre));
      if (!Number.isFinite(c) || c <= 0) refus('Le prix de la contre-offre est invalide.');
      if (c <= Number(n.prix_offert)) refus("Une contre-offre doit être plus élevée que l'offre de l'acheteur. Sinon, acceptez-la.");
      const p = await lireProduit(client, gid, n.produit_id);
      const choix = p ? prixEtStock(p, n.variante) : { erreur: 'x' };
      if (!choix.erreur && c >= choix.prix) refus(`La contre-offre doit être inférieure au prix actuel (${$$(choix.prix)}).`);
      await client.query(`UPDATE boutique_negociations SET statut='contre', prix_contre=$2, message_vendeur=$3, expire_le = NOW() + ($4 || ' hours')::interval, updated_at=NOW() WHERE id=$1`, [id, c, mot, String(cfg.validiteH)]);
    } else refus('Action inconnue.');
    await client.query('COMMIT');
    return true;
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
}

// ── Acheteur : répondre / retirer ──
async function repondreAcheteur({ gid, acheteurId, id, action }) {
  const cfg = await reglages(gid);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const n = (await client.query(`SELECT n.*, ${sqlEtat('n')} AS etat FROM boutique_negociations n WHERE n.id = $1 AND n.gestionnaire_id = $2 AND n.acheteur_id = $3 FOR UPDATE`, [id, gid, acheteurId])).rows[0];
    if (!n) refus('Offre introuvable.', 404);
    if (action === 'accepter') {
      if (n.etat !== 'contre') refus(n.etat === 'expiree' ? 'Cette contre-offre est expirée.' : "Il n'y a pas de contre-offre à accepter.", 409);
      await client.query(`UPDATE boutique_negociations SET statut='acceptee', prix_final=prix_contre, expire_le = NOW() + ($2 || ' hours')::interval, updated_at=NOW() WHERE id=$1`, [id, String(cfg.validiteH)]);
    } else if (action === 'retirer') {
      if (!['attente', 'contre', 'acceptee'].includes(n.etat)) refus('Cette offre est déjà terminée.', 409);
      await client.query(`UPDATE boutique_negociations SET statut='annulee', updated_at=NOW() WHERE id=$1`, [id]);
      await client.query('DELETE FROM boutique_panier WHERE negociation_id = $1 AND acheteur_id = $2', [id, acheteurId]);
    } else refus('Action inconnue.');
    await client.query('COMMIT');
    return true;
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
}

// ── Acheteur : mettre l'offre acceptée au panier (prix et quantité verrouillés) ──
async function mettreAuPanier({ gid, acheteurId, id }) {
  if (!(await actifPourBoutique(gid))) refus("L'option « Faire une offre » n'est pas activée pour cette boutique.", 403);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const n = (await client.query(`SELECT n.*, ${sqlEtat('n')} AS etat FROM boutique_negociations n WHERE n.id = $1 AND n.gestionnaire_id = $2 AND n.acheteur_id = $3 FOR UPDATE`, [id, gid, acheteurId])).rows[0];
    if (!n) refus('Offre introuvable.', 404);
    if (n.etat !== 'acceptee') refus(n.etat === 'expiree' ? 'Le délai pour payer cette offre est écoulé.' : "Cette offre n'est pas acceptée.", 409);
    const p = await lireProduit(client, gid, n.produit_id);
    const pb = problemeProduit(p);
    if (pb) refus(pb.m, 409);
    const choix = prixEtStock(p, n.variante);
    if (choix.erreur) refus(choix.erreur, 409);
    if (choix.stock <= 0) refus("Ce produit est épuisé : le stock n'était pas réservé et il s'est vendu entre-temps.", 409);
    // Une ligne existante du même produit (même variante) devient la ligne négociée : quantité 1, prix convenu
    await client.query(
      `INSERT INTO boutique_panier (gestionnaire_id, acheteur_id, produit_id, variante, quantite, negociation_id) VALUES ($1,$2,$3,$4,1,$5)
       ON CONFLICT (acheteur_id, produit_id, variante) DO UPDATE SET quantite = 1, negociation_id = EXCLUDED.negociation_id, updated_at = NOW()`,
      [gid, acheteurId, n.produit_id, n.variante, id]);
    await client.query('COMMIT');
    return true;
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
}

// ── Caisse : une fois la commande payée, les offres utilisées passent à « payée » ──
async function marquerPayees(db, gid, commandeId, articles) {
  const ids = (Array.isArray(articles) ? articles : []).map((a) => parseInt(a && a.negociation_id, 10)).filter((x) => Number.isInteger(x) && x > 0);
  if (!ids.length) return 0;
  const r = await (db || pool).query(
    `UPDATE boutique_negociations SET statut = 'payee', commande_id = $3, updated_at = NOW() WHERE id = ANY($1::int[]) AND gestionnaire_id = $2 AND statut = 'acceptee'`, [ids, gid, commandeId]);
  return r.rowCount;
}

// ── Page produit (public) : le bouton est-il offert ? et l'offre vivante de l'acheteur connecté ──
async function infoProduit(gid, produitId, acheteurId) {
  const off = { actif: false, offre: null };
  if (!(await actifPourBoutique(gid))) return off;
  const cfg = await reglages(gid);
  if (!cfg.actif) return off;
  const p = await lireProduit(pool, gid, produitId);
  if (problemeProduit(p)) return off;
  let offre = null;
  if (acheteurId) {
    const r = (await pool.query(
      `SELECT n.*, ${sqlEtat('n')} AS etat FROM boutique_negociations n WHERE n.gestionnaire_id = $1 AND n.acheteur_id = $2 AND n.produit_id = $3 AND ${sqlVivante('n')} ORDER BY n.id DESC LIMIT 1`, [gid, acheteurId, produitId])).rows[0];
    if (r) offre = sortie(r);
  }
  return { actif: true, min_pct: cfg.minPct, validite_heures: cfg.validiteH, reponse_jours: cfg.reponseJours, maintenant: new Date().toISOString(), offre };
}

// Forme envoyée au navigateur
const sortie = (x) => ({
  id: x.id, produit_id: x.produit_id, titre: x.titre, variante: x.variante || '', photo: x.image_url || null,
  prix_produit: Number(x.prix_produit), prix_offert: Number(x.prix_offert), prix_contre: x.prix_contre === null ? null : Number(x.prix_contre),
  prix_final: x.prix_final === null ? null : Number(x.prix_final), message: x.message || null, message_vendeur: x.message_vendeur || null,
  etat: x.etat, cree: x.created_at, expire: x.expire_le,
});

module.exports = {
  CODE_ADDON, DEFAUTS, sqlEtat, sqlVivante, sqlAddonOn, actifPourBoutique, reglages, ecrireReglages, prixEtStock, problemeProduit,
  faireOffre, repondreVendeur, repondreAcheteur, mettreAuPanier, marquerPayees, infoProduit, sortie,
};