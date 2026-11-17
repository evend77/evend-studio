// CHEMIN : services/boutique_encheres.js
// e-Vend Studio — Add-on « Enchères » des templates boutique (solo). Adapté de services/studio_encheres.js (MV) ; ne touche à rien du MV.
//
// Différences avec le MV : le VENDEUR est le gestionnaire (pas de collaborateur : il lance et annule lui-même ses enchères), les réglages
// (durées, incrément, réserve, délai de paiement) sont ceux du gestionnaire (table boutique_reglages), les enchères vivent dans
// boutique_encheres / boutique_encheres_mises, et le gagnant paie par la caisse de la boutique (boutique_commandes). Aucune notification
// (l'acheteur suit ses enchères dans « Mes enchères »).
//
// Cycle : active → (attente_paiement → payee | expiree)  ou  sans_gagnant  ou  annulee
//  - 1 unité du produit est retirée du stock vendable à la création (stock vide = illimité : rien à réserver) ; remise si l'enchère n'aboutit pas.
//  - Le gagnant reçoit l'article verrouillé dans son panier (prix = mise gagnante, quantité 1) et paie par la caisse normale.
//  - Une mise dans les 2 dernières minutes repousse la fin de 2 minutes (30 fois au plus). Le prix de réserve n'est jamais révélé.
//  - Aucune tâche planifiée obligatoire : une enchère échue est terminée dès qu'on la lit ou qu'on y mise ; un minuteur (30 s) termine les autres.
//
// Verrous (toujours dans cet ordre, pour éviter les blocages croisés) : enchères → produits → offres négociées.

'use strict';

const pool = require('../db');
const { ErreurBoutique } = require('./boutique_limites');
const A = require('./boutique_addons');

const CODE_ADDON = 'encheres';
const PROLONGATION_MIN = 2;
const PROLONGATIONS_MAX = 30;
const MISE_MAX = 1000000;
const DEFAUTS = { actif: true, dureeMinH: 1, dureeMaxJours: 14, increment: 1, reserve: true, delaiPaiementH: 24 };

const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };
const nombre = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const borne = (v, min, max, d) => Math.min(max, Math.max(min, Number.isFinite(parseFloat(v)) ? parseFloat(v) : d));
const arrondi = (n) => Math.round(Number(n) * 100) / 100;
const $$ = (n) => `${Number(n).toFixed(2).replace('.', ',')} $`;
const caisse = () => require('./boutique_commandes');   // chargé à l'appel : la caisse charge aussi ce service

// ── SQL partagé ──
// Ce produit (alias `a`, qui doit avoir une colonne id) a-t-il une enchère vivante ? (utilisé par « Faire une offre »)
const sqlEnchereVivante = (a = 'p') => `EXISTS (SELECT 1 FROM boutique_encheres en WHERE en.produit_id = ${a}.id AND en.statut IN ('active','attente_paiement'))`;

const actifPourBoutique = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);
const prochaineMise = (e) => (e.mise_actuelle === null || e.mise_actuelle === undefined ? Number(e.prix_depart) : arrondi(Number(e.mise_actuelle) + Number(e.increment)));

// ── Réglages du gestionnaire (valeurs sûres même si la ligne n'existe pas encore) ──
async function reglages(gid, db) {
  const r = (await (db || pool).query(
    `SELECT encheres_actif, enchere_duree_min_h, enchere_duree_max_jours, enchere_increment_min, enchere_reserve_permise, enchere_delai_paiement_h
       FROM boutique_reglages WHERE gestionnaire_id = $1`, [gid])).rows[0];
  if (!r) return { ...DEFAUTS, dureeMaxH: DEFAUTS.dureeMaxJours * 24 };
  const dureeMinH = Math.round(borne(r.enchere_duree_min_h, 1, 720, DEFAUTS.dureeMinH));
  const dureeMaxJours = Math.round(borne(r.enchere_duree_max_jours, 1, 60, DEFAUTS.dureeMaxJours));
  return {
    actif: r.encheres_actif !== false,
    dureeMinH, dureeMaxJours, dureeMaxH: Math.max(dureeMinH, dureeMaxJours * 24),
    increment: arrondi(borne(r.enchere_increment_min, 0.01, 100000, DEFAUTS.increment)),
    reserve: r.enchere_reserve_permise !== false,
    delaiPaiementH: Math.round(borne(r.enchere_delai_paiement_h, 1, 24, DEFAUTS.delaiPaiementH)),
  };
}

async function ecrireReglages(gid, b) {
  b = b || {};
  const dMin = Math.round(Number(b.duree_min_h)), dMax = Math.round(Number(b.duree_max_jours)), inc = arrondi(Number(b.increment_min)), dPay = Math.round(Number(b.delai_paiement_h));
  if (!Number.isFinite(dMin) || dMin < 1 || dMin > 720) refus('La durée minimale doit être entre 1 et 720 heures.');
  if (!Number.isFinite(dMax) || dMax < 1 || dMax > 60) refus('La durée maximale doit être entre 1 et 60 jours.');
  if (dMax * 24 < dMin) refus('La durée maximale doit être plus longue que la durée minimale.');
  if (!Number.isFinite(inc) || inc < 0.01 || inc > 100000) refus("L'incrément minimum doit être entre 0,01 $ et 100 000 $.");
  if (!Number.isFinite(dPay) || dPay < 1 || dPay > 24) refus('Le délai de paiement doit être entre 1 et 24 heures.');
  await pool.query(
    `INSERT INTO boutique_reglages (gestionnaire_id, encheres_actif, enchere_duree_min_h, enchere_duree_max_jours, enchere_increment_min, enchere_reserve_permise, enchere_delai_paiement_h, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET encheres_actif = EXCLUDED.encheres_actif, enchere_duree_min_h = EXCLUDED.enchere_duree_min_h,
       enchere_duree_max_jours = EXCLUDED.enchere_duree_max_jours, enchere_increment_min = EXCLUDED.enchere_increment_min,
       enchere_reserve_permise = EXCLUDED.enchere_reserve_permise, enchere_delai_paiement_h = EXCLUDED.enchere_delai_paiement_h, updated_at = NOW()`,
    [gid, b.actif !== false, dMin, dMax, inc, b.reserve_permise !== false, dPay]);
  return reglages(gid);
}

// ── Création (par le gestionnaire, sur un de SES produits) ──
async function creerEnchere({ gid, produitId, prixDepart, prixReserve, dureeH }) {
  // Sans l'add-on on ne peut plus CRÉER d'enchère (celles déjà en cours vont jusqu'au bout : mises, fin, paiement du gagnant)
  if (!(await actifPourBoutique(gid))) refus("L'option « Enchères » n'est pas activée pour cette boutique. Activez-la dans « Mon plan & limites ».", 403);
  const cfg = await reglages(gid);
  if (!cfg.actif) refus("Les enchères sont désactivées dans vos réglages d'enchères.", 403);

  const depart = arrondi(nombre(prixDepart, NaN));
  if (!(depart > 0) || depart > MISE_MAX) refus('Prix de départ invalide.');
  let reserve = null;
  if (prixReserve !== undefined && prixReserve !== null && prixReserve !== '') {
    if (!cfg.reserve) refus("Le prix de réserve n'est pas permis (voir vos réglages d'enchères).");
    reserve = arrondi(nombre(prixReserve, NaN));
    if (!(reserve >= depart) || reserve > MISE_MAX) refus('Le prix de réserve doit être égal ou supérieur au prix de départ.');
  }
  const heures = nombre(dureeH, NaN);
  if (!(heures >= cfg.dureeMinH) || heures > cfg.dureeMaxH) refus(`La durée doit être entre ${cfg.dureeMinH} h et ${cfg.dureeMaxJours} jour(s).`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = (await client.query(
      `SELECT id, titre, photo_principale, stock, variantes, statut, offre_prix, offre_fin, date_parution, date_expiration FROM produits
        WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id IS NULL FOR UPDATE`, [produitId, gid])).rows[0];
    if (!p) refus('Produit introuvable.', 404);
    if (p.statut !== 'actif') refus('Seule une annonce active peut être mise aux enchères.');
    if (p.offre_prix !== null && p.offre_prix !== undefined && p.offre_fin && new Date(p.offre_fin).getTime() > Date.now()) refus("Ce produit a une offre du jour (en cours ou programmée) : retirez l'offre avant de le mettre aux enchères.", 409);
    let vars = p.variantes; if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = []; } }
    if (Array.isArray(vars) && vars.some((v) => v && v.nom)) refus('Les enchères ne sont pas offertes sur les produits à variantes.');
    if (p.date_parution && new Date(p.date_parution).getTime() > Date.now()) refus("Ce produit n'est pas encore en vente (parution future).", 409);
    const fin = new Date(Date.now() + heures * 3600000);
    if (p.date_expiration && new Date(p.date_expiration).getTime() <= fin.getTime() + cfg.delaiPaiementH * 3600000) refus("L'annonce expire avant la fin de l'enchère et du délai de paiement : prolongez son expiration ou raccourcissez l'enchère.", 409);

    const vivante = await client.query(`SELECT 1 FROM boutique_encheres WHERE produit_id = $1 AND statut IN ('active','attente_paiement')`, [produitId]);
    if (vivante.rows.length) refus('Ce produit a déjà une enchère en cours.', 409);
    // Add-on « Faire une offre » : un prix déjà accepté avec un acheteur (encore valide) ne peut pas passer aux enchères
    try {
      await client.query('SAVEPOINT nego');
      const nego = await client.query(`SELECT 1 FROM boutique_negociations WHERE produit_id = $1 AND statut = 'acceptee' AND expire_le > NOW() LIMIT 1`, [produitId]);
      if (nego.rows.length) refus("Une offre a été acceptée sur ce produit et attend le paiement de l'acheteur : attendez qu'elle soit payée ou expirée.", 409);
    } catch (e) { if (e && e.status) throw e; await client.query('ROLLBACK TO SAVEPOINT nego'); }

    // 1 unité retirée du stock vendable (stock vide = illimité : rien à réserver)
    const suivi = p.stock !== null && p.stock !== undefined;
    if (suivi) {
      if (Number(p.stock) < 1) refus('Il faut au moins 1 unité en stock pour lancer une enchère.', 409);
      await caisse().ajusterStock(client, produitId, '', -1);
    }
    const r = await client.query(
      `INSERT INTO boutique_encheres (gestionnaire_id, produit_id, titre, image_url, prix_depart, prix_reserve, increment, date_fin, stock_reserve)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [gid, produitId, String(p.titre).slice(0, 200), p.photo_principale || null, depart, reserve, cfg.increment, fin, suivi]);
    await client.query('COMMIT');
    return r.rows[0];
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e && e.code === '23505') throw new ErreurBoutique('Ce produit a déjà une enchère en cours.', 409);
    throw e;
  } finally { client.release(); }
}

// ── Mise ──
async function miser({ gid, enchereId, acheteurId, montant }) {
  const m = arrondi(nombre(montant, NaN));
  if (!(m > 0) || m > MISE_MAX) refus('Montant invalide.');
  await finaliser(enchereId);   // une enchère échue est terminée avant d'accepter quoi que ce soit

  const client = await pool.connect();
  let e;
  try {
    await client.query('BEGIN');
    e = (await client.query('SELECT * FROM boutique_encheres WHERE id = $1 AND gestionnaire_id = $2 FOR UPDATE', [enchereId, gid])).rows[0];
    if (!e) refus('Enchère introuvable.', 404);
    if (e.statut !== 'active' || new Date(e.date_fin) <= new Date()) refus('Cette enchère est terminée.', 409);
    const top = (await client.query('SELECT acheteur_id, montant FROM boutique_encheres_mises WHERE enchere_id = $1 ORDER BY montant DESC, id DESC LIMIT 1', [e.id])).rows[0];
    if (top && top.acheteur_id === acheteurId) refus('Vous avez déjà la mise la plus haute.', 409);
    const min = prochaineMise(e);
    if (m < min) refus(`Votre mise doit être d'au moins ${min.toFixed(2)} $.`, 409);

    await client.query('INSERT INTO boutique_encheres_mises (enchere_id, acheteur_id, montant) VALUES ($1,$2,$3)', [e.id, acheteurId, m]);
    // Anti-« dernière seconde » : mise dans les dernières minutes → la fin est repoussée
    let fin = new Date(e.date_fin); let prolong = e.prolongations;
    if (fin.getTime() - Date.now() < PROLONGATION_MIN * 60000 && prolong < PROLONGATIONS_MAX) { fin = new Date(Date.now() + PROLONGATION_MIN * 60000); prolong++; }
    e = (await client.query(
      `UPDATE boutique_encheres SET mise_actuelle = $1, nb_mises = nb_mises + 1, date_fin = $2, prolongations = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [m, fin, prolong, e.id])).rows[0];
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }
  return { mise_actuelle: Number(e.mise_actuelle), prochaine_mise: prochaineMise(e), date_fin: e.date_fin, nb_mises: e.nb_mises, en_tete: true };
}

// ── Fin d'enchère (idempotente) ──
async function finaliser(enchereId) {
  const client = await pool.connect();
  let resultat = null;
  try {
    await client.query('BEGIN');
    const e = (await client.query(`SELECT * FROM boutique_encheres WHERE id = $1 AND statut = 'active' AND date_fin <= NOW() FOR UPDATE`, [enchereId])).rows[0];
    if (!e) { await client.query('ROLLBACK'); return null; }
    const top = (await client.query('SELECT acheteur_id, montant FROM boutique_encheres_mises WHERE enchere_id = $1 ORDER BY montant DESC, id DESC LIMIT 1', [e.id])).rows[0];
    const reserveOk = !e.prix_reserve || (top && Number(top.montant) >= Number(e.prix_reserve));
    if (!top || !reserveOk) {
      await client.query(`UPDATE boutique_encheres SET statut = 'sans_gagnant', termine_le = NOW(), stock_reserve = false, updated_at = NOW() WHERE id = $1`, [e.id]);
      if (e.stock_reserve) await caisse().ajusterStock(client, e.produit_id, '', 1);
      resultat = { type: 'sans_gagnant' };
    } else {
      const cfg = await reglages(e.gestionnaire_id, client);
      const expire = new Date(Date.now() + cfg.delaiPaiementH * 3600000);
      await client.query(
        `UPDATE boutique_encheres SET statut = 'attente_paiement', gagnant_id = $1, prix_final = $2, paiement_expire_le = $3, termine_le = NOW(), updated_at = NOW() WHERE id = $4`,
        [top.acheteur_id, top.montant, expire, e.id]);
      // L'article gagné arrive dans le panier du gagnant (prix et quantité verrouillés). Une ligne existante du même produit devient la ligne de l'enchère.
      await client.query(
        `INSERT INTO boutique_panier (gestionnaire_id, acheteur_id, produit_id, variante, quantite, enchere_id) VALUES ($1,$2,$3,'',1,$4)
         ON CONFLICT (acheteur_id, produit_id, variante) DO UPDATE SET quantite = 1, enchere_id = EXCLUDED.enchere_id, negociation_id = NULL, updated_at = NOW()`,
        [e.gestionnaire_id, top.acheteur_id, e.produit_id, e.id]);
      resultat = { type: 'gagnee' };
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }
  return resultat;
}

// Le gagnant n'a pas payé à temps → l'enchère expire et l'unité redevient vendable.
async function expirerPaiement(enchereId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const e = (await client.query(`SELECT * FROM boutique_encheres WHERE id = $1 AND statut = 'attente_paiement' AND paiement_expire_le <= NOW() FOR UPDATE`, [enchereId])).rows[0];
    if (!e) { await client.query('ROLLBACK'); return false; }
    // Un paiement est peut-être en cours : on attend la fin de sa session
    const enCours = await client.query(
      `SELECT 1 FROM boutique_commandes WHERE statut_paiement = 'en_attente' AND statut <> 'annulee' AND stock_reserve = true
          AND (expire_le IS NULL OR expire_le > NOW() - INTERVAL '10 minutes') AND articles @> $1::jsonb LIMIT 1`,
      [JSON.stringify([{ enchere_id: e.id }])]);
    if (enCours.rows.length) { await client.query('ROLLBACK'); return false; }
    await client.query(`UPDATE boutique_encheres SET statut = 'expiree', stock_reserve = false, updated_at = NOW() WHERE id = $1`, [e.id]);
    await client.query('DELETE FROM boutique_panier WHERE enchere_id = $1', [e.id]);
    if (e.stock_reserve) await caisse().ajusterStock(client, e.produit_id, '', 1);
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }
}

// Annulation par le gestionnaire : en tout temps avant la fin, même avec des mises (rien n'a été prélevé).
async function annulerEnchere({ gid, enchereId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const e = (await client.query('SELECT * FROM boutique_encheres WHERE id = $1 AND gestionnaire_id = $2 FOR UPDATE', [enchereId, gid])).rows[0];
    if (!e) refus('Enchère introuvable.', 404);
    if (e.statut !== 'active') refus('Seule une enchère en cours peut être annulée.', 409);
    await client.query(`UPDATE boutique_encheres SET statut = 'annulee', termine_le = NOW(), stock_reserve = false, updated_at = NOW() WHERE id = $1`, [e.id]);
    if (e.stock_reserve) await caisse().ajusterStock(client, e.produit_id, '', 1);
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }
}

// Le gagnant a retiré l'article de son panier (ou fermé la caisse) puis veut payer : l'article verrouillé revient.
async function remettreAuPanier({ gid, enchereId, acheteurId }) {
  const e = (await pool.query(
    `SELECT * FROM boutique_encheres WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'attente_paiement' AND gagnant_id = $3 AND paiement_expire_le > NOW()`, [enchereId, gid, acheteurId])).rows[0];
  if (!e) refus("Cette enchère n'est plus à payer.", 404);
  const deja = await pool.query('SELECT 1 FROM boutique_panier WHERE enchere_id = $1 AND acheteur_id = $2', [e.id, acheteurId]);
  if (deja.rows.length) return { deja: true };
  const enCours = await pool.query(
    `SELECT 1 FROM boutique_commandes WHERE statut_paiement = 'en_attente' AND statut <> 'annulee' AND stock_reserve = true AND articles @> $1::jsonb LIMIT 1`, [JSON.stringify([{ enchere_id: e.id }])]);
  if (enCours.rows.length) refus('Un paiement est déjà en cours pour cet article.', 409);
  await pool.query(
    `INSERT INTO boutique_panier (gestionnaire_id, acheteur_id, produit_id, variante, quantite, enchere_id) VALUES ($1,$2,$3,'',1,$4)
     ON CONFLICT (acheteur_id, produit_id, variante) DO UPDATE SET quantite = 1, enchere_id = EXCLUDED.enchere_id, negociation_id = NULL, updated_at = NOW()`,
    [e.gestionnaire_id, acheteurId, e.produit_id, e.id]);
  return { deja: false };
}

// ── Caisse : une fois la commande payée, les enchères utilisées passent à « payée » ──
async function marquerPayees(db, gid, commandeId, articles) {
  const ids = (Array.isArray(articles) ? articles : []).map((a) => parseInt(a && a.enchere_id, 10)).filter((x) => Number.isInteger(x) && x > 0);
  if (!ids.length) return 0;
  const r = await (db || pool).query(
    `UPDATE boutique_encheres SET statut = 'payee', commande_id = $3, updated_at = NOW() WHERE id = ANY($1::int[]) AND gestionnaire_id = $2 AND statut = 'attente_paiement'`, [ids, gid, commandeId]);
  return r.rowCount;
}

// ── Lectures ──
// Vue publique : le prix de réserve n'est JAMAIS révélé, seulement s'il est atteint.
function vue(e, moi) {
  const active = e.statut === 'active';
  return {
    id: e.id, produit_id: e.produit_id, titre: e.titre, image_url: e.image_url || null,
    statut: active ? 'active' : 'terminee',
    prix_depart: Number(e.prix_depart), mise_actuelle: e.mise_actuelle === null ? null : Number(e.mise_actuelle),
    prochaine_mise: active ? prochaineMise(e) : null, increment: Number(e.increment),
    nb_mises: e.nb_mises, date_fin: e.date_fin,
    reserve: e.prix_reserve === null ? null : { atteinte: e.mise_actuelle !== null && Number(e.mise_actuelle) >= Number(e.prix_reserve) },
    ...(moi ? { en_tete: !!e.en_tete } : {}),
  };
}
const COLS = `e.*, (SELECT acheteur_id FROM boutique_encheres_mises m WHERE m.enchere_id = e.id ORDER BY montant DESC, id DESC LIMIT 1) AS meneur_id`;

// Page produit : l'enchère en cours de ce produit (ou null). Une enchère échue est terminée au passage.
async function infoProduit(gid, produitId, acheteurId) {
  let e = (await pool.query(`SELECT ${COLS} FROM boutique_encheres e WHERE e.gestionnaire_id = $1 AND e.produit_id = $2 AND e.statut IN ('active','attente_paiement') LIMIT 1`, [gid, produitId])).rows[0];
  if (e && e.statut === 'active' && new Date(e.date_fin) <= new Date()) {
    await finaliser(e.id);
    e = (await pool.query(`SELECT ${COLS} FROM boutique_encheres e WHERE e.id = $1`, [e.id])).rows[0];
  }
  const maintenant = new Date().toISOString();
  if (!e || e.statut !== 'active') return { enchere: null, maintenant };
  if (acheteurId) e.en_tete = e.meneur_id === acheteurId;
  return { enchere: vue(e, !!acheteurId), maintenant };
}

const TRIS = {
  fin_proche: 'e.date_fin ASC', recent: 'e.created_at DESC',
  mise_asc: 'COALESCE(e.mise_actuelle, e.prix_depart) ASC, e.date_fin ASC', mise_desc: 'COALESCE(e.mise_actuelle, e.prix_depart) DESC, e.date_fin ASC', nb_mises: 'e.nb_mises DESC, e.date_fin ASC',
};

// Liste publique paginée des enchères en cours
async function listePublique(gid, { page = 1, limit = 24, tri, reserve } = {}) {
  const pg = Math.min(Math.max(parseInt(page, 10) || 1, 1), 1000);
  const lim = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);
  const params = [gid, lim, (pg - 1) * lim];
  const filtre = reserve ? ' AND e.prix_reserve IS NOT NULL AND e.mise_actuelle >= e.prix_reserve' : '';
  const r = await pool.query(
    `SELECT e.*, COUNT(*) OVER()::int AS total_lignes FROM boutique_encheres e
      WHERE e.gestionnaire_id = $1 AND e.statut = 'active' AND e.date_fin > NOW()${filtre}
      ORDER BY ${TRIS[tri] || TRIS.fin_proche}, e.id ASC LIMIT $2 OFFSET $3`, params);
  let total = r.rows.length ? r.rows[0].total_lignes : 0;
  if (!r.rows.length && pg > 1) total = (await pool.query(`SELECT COUNT(*)::int AS n FROM boutique_encheres e WHERE e.gestionnaire_id = $1 AND e.statut = 'active' AND e.date_fin > NOW()${filtre}`, [gid])).rows[0].n;
  return { encheres: r.rows.map((e) => vue(e, false)), page: pg, maintenant: new Date().toISOString(), pagination: { total, page: pg, limit: lim, pages: Math.max(1, Math.ceil(total / lim)) } };
}

// Dernières mises (noms masqués)
async function mises(gid, enchereId) {
  const r = await pool.query(
    `SELECT m.montant, m.created_at, a.prenom FROM boutique_encheres_mises m
       JOIN boutique_encheres e ON e.id = m.enchere_id AND e.gestionnaire_id = $2
       LEFT JOIN marketplace_acheteurs a ON a.id = m.acheteur_id
      WHERE m.enchere_id = $1 ORDER BY m.montant DESC, m.id DESC LIMIT 20`, [enchereId, gid]);
  return r.rows.map((x) => ({ montant: Number(x.montant), date: x.created_at, encherisseur: (x.prenom ? String(x.prenom).trim().charAt(0).toUpperCase() : '?') + '***' }));
}

// « Mes enchères » de l'acheteur : en tête, surpassé, à payer, perdue…
async function mesEncheres(gid, acheteurId) {
  const r = await pool.query(
    `SELECT ${COLS}, (SELECT MAX(montant) FROM boutique_encheres_mises m WHERE m.enchere_id = e.id AND m.acheteur_id = $2) AS ma_mise,
            EXISTS (SELECT 1 FROM boutique_panier p WHERE p.enchere_id = e.id AND p.acheteur_id = $2) AS dans_panier
       FROM boutique_encheres e
      WHERE e.gestionnaire_id = $1 AND EXISTS (SELECT 1 FROM boutique_encheres_mises m WHERE m.enchere_id = e.id AND m.acheteur_id = $2)
      ORDER BY e.created_at DESC LIMIT 100`, [gid, acheteurId]);
  return r.rows.map((e) => {
    let etat;
    if (e.statut === 'active') etat = e.meneur_id === acheteurId ? 'en_tete' : 'surpasse';
    else if (e.gagnant_id === acheteurId) etat = e.statut; // attente_paiement | payee | expiree
    else etat = 'perdue';
    if (etat === 'attente_paiement') etat = 'a_payer';
    if (e.statut === 'annulee' || e.statut === 'sans_gagnant') etat = e.statut;
    return { id: e.id, produit_id: e.produit_id, titre: e.titre, image_url: e.image_url || null, statut: e.statut, etat, ma_mise: Number(e.ma_mise),
      mise_actuelle: e.mise_actuelle === null ? null : Number(e.mise_actuelle), prix_final: e.gagnant_id === acheteurId && e.prix_final ? Number(e.prix_final) : null,
      date_fin: e.date_fin, paiement_expire_le: etat === 'a_payer' ? e.paiement_expire_le : null, dans_panier: etat === 'a_payer' ? e.dans_panier : false };
  });
}

const STATUTS = ['active', 'attente_paiement', 'payee', 'expiree', 'sans_gagnant', 'annulee'];

// Page du gestionnaire : toutes les enchères de SA boutique
async function listeGestionnaire(gid, { statut, page = 1 } = {}) {
  const pg = Math.min(Math.max(parseInt(page, 10) || 1, 1), 1000);
  const params = [gid, 30, (pg - 1) * 30];
  let filtre = '';
  if (STATUTS.includes(statut)) { params.push(statut); filtre = ` AND e.statut = $${params.length}`; }
  const r = await pool.query(
    `SELECT e.id, e.produit_id, e.titre, e.image_url, e.statut, e.prix_depart, e.prix_reserve, e.mise_actuelle, e.prix_final, e.nb_mises,
            e.date_fin, e.paiement_expire_le, e.created_at,
            (SELECT COUNT(DISTINCT m.acheteur_id)::int FROM boutique_encheres_mises m WHERE m.enchere_id = e.id) AS nb_encherisseurs
       FROM boutique_encheres e WHERE e.gestionnaire_id = $1${filtre}
      ORDER BY (e.statut = 'active') DESC, e.created_at DESC LIMIT $2 OFFSET $3`, params);
  const c = await pool.query('SELECT statut, COUNT(*)::int AS n FROM boutique_encheres WHERE gestionnaire_id = $1 GROUP BY statut', [gid]);
  const compte = {}; for (const x of c.rows) compte[x.statut] = x.n;
  const num = (v) => (v === null || v === undefined ? null : Number(v));
  return { page: pg, compte, encheres: r.rows.map((e) => ({ ...e, prix_depart: num(e.prix_depart), prix_reserve: num(e.prix_reserve), mise_actuelle: num(e.mise_actuelle), prix_final: num(e.prix_final) })) };
}

// Sélecteur de la page du gestionnaire : ses produits actifs, avec la raison si une enchère n'est pas possible
async function produitsPourEnchere(gid, motif) {
  const params = [gid]; let filtre = '';
  if (motif) { params.push(motif); filtre = ` AND (p.titre ILIKE $2 OR p.sku ILIKE $2)`; }
  const r = await pool.query(
    `SELECT p.id, p.titre, p.sku, p.prix, p.stock, p.photo_principale AS photo, p.variantes, p.date_parution, p.date_expiration, p.offre_prix, p.offre_fin,
            ${sqlEnchereVivante('p')} AS en_enchere,
            EXISTS (SELECT 1 FROM boutique_negociations n WHERE n.produit_id = p.id AND n.statut = 'acceptee' AND n.expire_le > NOW()) AS offre_acceptee
       FROM produits p WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.statut = 'actif'${filtre}
      ORDER BY p.created_at DESC, p.id DESC LIMIT 30`, params);
  return r.rows.map((p) => {
    let vars = p.variantes; if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = []; } }
    let raison = null;
    if (p.en_enchere) raison = 'Déjà aux enchères';
    else if (Array.isArray(vars) && vars.some((v) => v && v.nom)) raison = 'Produit à variantes';
    else if (p.offre_prix !== null && p.offre_fin && new Date(p.offre_fin).getTime() > Date.now()) raison = 'A une offre du jour';
    else if (p.offre_acceptee) raison = 'Offre acceptée en attente de paiement';
    else if (p.date_parution && new Date(p.date_parution).getTime() > Date.now()) raison = 'Parution future';
    else if (p.stock !== null && p.stock !== undefined && Number(p.stock) < 1) raison = 'Épuisé';
    return { id: p.id, titre: p.titre, sku: p.sku || null, photo: p.photo || null, prix: Number(p.prix), stock: p.stock, raison };
  });
}

// ── Tâche de fond ──
async function traiterEcheances() {
  try {
    const f = await pool.query(`SELECT id FROM boutique_encheres WHERE statut = 'active' AND date_fin <= NOW() ORDER BY date_fin LIMIT 50`);
    for (const r of f.rows) await finaliser(r.id).catch((x) => console.error('[boutique_encheres] finaliser', r.id, x.message));
    const x = await pool.query(`SELECT id FROM boutique_encheres WHERE statut = 'attente_paiement' AND paiement_expire_le <= NOW() ORDER BY paiement_expire_le LIMIT 50`);
    for (const r of x.rows) await expirerPaiement(r.id).catch((y) => console.error('[boutique_encheres] expirer', r.id, y.message));
  } catch (e) { console.error('[boutique_encheres] tâche de fond :', e.message); }
}
let minuteur = null;
function demarrer() {
  if (minuteur) return;
  minuteur = setInterval(traiterEcheances, 30000);
  if (minuteur.unref) minuteur.unref();
}

module.exports = {
  CODE_ADDON, DEFAUTS, sqlEnchereVivante, actifPourBoutique, prochaineMise, reglages, ecrireReglages, creerEnchere, miser, finaliser, expirerPaiement, annulerEnchere,
  remettreAuPanier, marquerPayees, vue, infoProduit, listePublique, mises, mesEncheres, listeGestionnaire, produitsPourEnchere, traiterEcheances, demarrer, $$,
};