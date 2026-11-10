// CHEMIN : services/studio_encheres.js
// e-Vend Studio — Moteur d'enchères COMMUN à tous les templates multivendeur.
// Les templates n'ont qu'à afficher ; toutes les règles sont ici (côté serveur).
//
// Cycle : active → (attente_paiement → payee | expiree) ou sans_gagnant ou annulee
//  - 1 unité du produit est réservée (retirée du stock vendable) à la création ; remise si l'enchère n'aboutit pas.
//  - Le gagnant reçoit l'article verrouillé dans son panier (prix = mise gagnante, quantité 1) et paie via le checkout normal.
//  - Réglages du gestionnaire : Config multi → Enchères (sites.config.multivendeur).

'use strict';

const pool = require('../db');
const vacances = require('./studio_vacances');
const { ajusterStock } = require('./studio_paiement');
const studioAddons = require('./studio_addons');

class ErreurEnchere extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const refus = (m, s) => { throw new ErreurEnchere(m, s); };

const PROLONGATION_MIN = 2;   // une mise dans les 2 dernières minutes repousse la fin de 2 minutes
const PROLONGATIONS_MAX = 30; // plafond pour qu'une enchère se termine toujours
const MISE_MAX = 1000000;

const nombre = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const borne = (v, min, max, d) => Math.min(max, Math.max(min, Number.isFinite(parseFloat(v)) ? parseFloat(v) : d));
const arrondi = (n) => Math.round(Number(n) * 100) / 100;

// ── Réglages du gestionnaire (valeurs sûres même si la config est incomplète) ──
async function reglages(gid, db = pool) {
  const r = await db.query('SELECT config FROM sites WHERE gestionnaire_id = $1', [gid]);
  const mv = (r.rows[0] && r.rows[0].config && r.rows[0].config.multivendeur) || {};
  const dureeMinH = Math.round(borne(mv.enchere_duree_min_h, 1, 720, 1));
  const dureeMaxH = Math.round(borne(mv.enchere_duree_max_jours, 1, 60, 14)) * 24;
  return {
    actives: mv.encheres_actives === true,
    dureeMinH, dureeMaxH: Math.max(dureeMinH, dureeMaxH),
    increment: arrondi(borne(mv.enchere_increment_min, 0.01, 100000, 1)),
    reserve: mv.enchere_reserve_permise !== false,
    delaiPaiementH: Math.round(borne(mv.enchere_delai_paiement_h, 1, 24, 24)),
    maxParCollab: Math.round(borne(mv.enchere_max_par_collab, 0, 500, 0)),
    devise: String(mv.devise || 'CAD'),
  };
}

async function infosSite(gid) {
  const r = await pool.query('SELECT slug, domaine_custom FROM sites WHERE gestionnaire_id = $1', [gid]);
  const s = r.rows[0] || {};
  const d = s.domaine_custom || (s.slug ? `${s.slug}.e-vendstudio.ca` : '');
  return d ? `https://${d}` : '';
}

const prochaineMise = (e) => (e.mise_actuelle === null || e.mise_actuelle === undefined ? Number(e.prix_depart) : arrondi(Number(e.mise_actuelle) + Number(e.increment)));

// ── Création (par le collaborateur propriétaire du produit) ──────────────────
async function creerEnchere({ gid, collaborateurId, produitId, prixDepart, prixReserve, dureeH }) {
  // Add-on « Enchères » : sans lui, on ne peut plus CRÉER d'enchère (celles déjà en cours vont jusqu'au bout : mises, fin, paiement du gagnant)
  if (!(await studioAddons.addonActifRapide(gid, 'encheres', pool))) refus("L'option « Enchères » n'est pas activée pour cette marketplace.", 403);
  if (!(await require('./studio_plans_collab').collabAutorise(gid, collaborateurId, 'encheres', pool).catch(() => true))) refus("L'option « Enchères » n'est pas incluse dans votre plan.", 403);
  const cfg = await reglages(gid);
  if (!cfg.actives) refus("Les enchères ne sont pas activées sur cette boutique.", 403);
  if (await vacances.estMasque(pool, gid, collaborateurId)) refus("Vous êtes en vacances (annonces masquées) : vous ne pouvez pas créer de nouvelle enchère. Celles en cours se terminent normalement.", 409);

  const depart = arrondi(nombre(prixDepart, NaN));
  if (!(depart > 0) || depart > MISE_MAX) refus('Prix de départ invalide.');
  // Règles de « Config produits » : prix minimum, et inventaire non géré (alors aucun stock exigé ni réservé)
  const rp = await require('./studio_regles_produits').lire(gid, pool);
  const errPrix = require('./studio_regles_produits').erreurPrix(rp, depart, 'Prix de départ');
  if (errPrix) refus(errPrix);
  let reserve = null;
  if (prixReserve !== undefined && prixReserve !== null && prixReserve !== '') {
    if (!cfg.reserve) refus("Le prix de réserve n'est pas permis sur cette boutique.");
    reserve = arrondi(nombre(prixReserve, NaN));
    if (!(reserve >= depart) || reserve > MISE_MAX) refus('Le prix de réserve doit être égal ou supérieur au prix de départ.');
  }
  const heures = nombre(dureeH, NaN);
  if (!(heures >= cfg.dureeMinH) || heures > cfg.dureeMaxH) refus(`La durée doit être entre ${cfg.dureeMinH} h et ${cfg.dureeMaxH / 24} jour(s).`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = (await client.query(
      `SELECT id, titre, photo_principale, stock, variantes, statut, offre_prix, offre_fin FROM produits
        WHERE id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3 FOR UPDATE`, [produitId, gid, collaborateurId])).rows[0];
    if (!p) refus('Produit introuvable.', 404);
    if (p.statut !== 'actif') refus("Seule une annonce active peut être mise aux enchères.");
    if (p.offre_prix !== null && p.offre_prix !== undefined && p.offre_fin && new Date(p.offre_fin).getTime() > Date.now()) refus("Ce produit a une offre du jour (en cours ou programmée) : retirez l'offre avant de le mettre aux enchères.", 409);
    let vars = p.variantes; if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = []; } }
    if (Array.isArray(vars) && vars.some((v) => v && v.nom)) refus("Les enchères ne sont pas offertes sur les produits à variantes.");

    if (cfg.maxParCollab > 0) {
      const n = (await client.query(`SELECT COUNT(*)::int AS n FROM encheres WHERE collaborateur_id = $1 AND statut IN ('active','attente_paiement')`, [collaborateurId])).rows[0].n;
      if (n >= cfg.maxParCollab) refus(`Vous avez atteint la limite de ${cfg.maxParCollab} enchère(s) en cours.`, 409);
    }
    const vivante = await client.query(`SELECT 1 FROM encheres WHERE produit_id = $1 AND statut IN ('active','attente_paiement')`, [produitId]);
    if (vivante.rows.length) refus('Ce produit a déjà une enchère en cours.', 409);
    // Add-on « Faire une offre » : un prix déjà accepté avec un acheteur (encore valide) ne peut pas passer aux enchères
    try {
      const nego = await client.query(`SELECT 1 FROM negociations WHERE produit_id = $1 AND statut = 'acceptee' AND expire_le > NOW() LIMIT 1`, [produitId]);
      if (nego.rows.length) refus("Une offre a été acceptée sur ce produit et attend le paiement de l'acheteur : attendez qu'elle soit payée ou expirée.", 409);
    } catch (e) { if (e && e.status) throw e; }

    // 1 unité réservée (stock vide = illimité : rien à réserver)
    const suivi = rp.gererStock && p.stock !== null && p.stock !== undefined;
    if (suivi) {
      if (Number(p.stock) < 1) refus('Il faut au moins 1 unité en stock pour lancer une enchère.', 409);
      await ajusterStock(client, produitId, '', -1);
    }
    const fin = new Date(Date.now() + heures * 3600000);
    const r = await client.query(
      `INSERT INTO encheres (gestionnaire_id, collaborateur_id, produit_id, titre, image_url, prix_depart, prix_reserve, increment, date_fin, stock_reserve)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [gid, collaborateurId, produitId, String(p.titre).slice(0, 200), p.photo_principale || null, depart, reserve, cfg.increment, fin, suivi]);
    await client.query('COMMIT');
    return r.rows[0];
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    if (e && e.code === '23505') throw new ErreurEnchere('Ce produit a déjà une enchère en cours.', 409);
    throw e;
  } finally { client.release(); }
}

// ── Mise ─────────────────────────────────────────────────────────────────────
async function miser({ gid, enchereId, acheteurId, montant }) {
  const m = arrondi(nombre(montant, NaN));
  if (!(m > 0) || m > MISE_MAX) refus('Montant invalide.');
  // Une enchère échue est terminée avant d'accepter quoi que ce soit
  await finaliser(enchereId);

  const client = await pool.connect();
  let precedent = null; let e;
  try {
    await client.query('BEGIN');
    e = (await client.query('SELECT * FROM encheres WHERE id = $1 AND gestionnaire_id = $2 FOR UPDATE', [enchereId, gid])).rows[0];
    if (!e) refus('Enchère introuvable.', 404);
    if (e.statut !== 'active' || new Date(e.date_fin) <= new Date()) refus('Cette enchère est terminée.', 409);
    const top = (await client.query('SELECT acheteur_id, montant FROM encheres_mises WHERE enchere_id = $1 ORDER BY montant DESC, id DESC LIMIT 1', [e.id])).rows[0];
    precedent = top || null;
    if (top && top.acheteur_id === acheteurId) refus('Vous avez déjà la mise la plus haute.', 409);
    const min = prochaineMise(e);
    if (m < min) refus(`Votre mise doit être d'au moins ${min.toFixed(2)} $.`, 409);

    await client.query('INSERT INTO encheres_mises (enchere_id, acheteur_id, montant) VALUES ($1,$2,$3)', [e.id, acheteurId, m]);
    // Anti-« dernière seconde » : mise dans les dernières minutes → la fin est repoussée
    let fin = new Date(e.date_fin); let prolong = e.prolongations;
    if (fin.getTime() - Date.now() < PROLONGATION_MIN * 60000 && prolong < PROLONGATIONS_MAX) {
      fin = new Date(Date.now() + PROLONGATION_MIN * 60000); prolong++;
    }
    e = (await client.query(
      `UPDATE encheres SET mise_actuelle = $1, nb_mises = nb_mises + 1, date_fin = $2, prolongations = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [m, fin, prolong, e.id])).rows[0];
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }

  // Le précédent meneur est averti (sans bloquer la mise)
  if (precedent) surpasse(e, precedent).catch((x) => console.error('[encheres] surpasse :', x.message));
  return { mise_actuelle: Number(e.mise_actuelle), prochaine_mise: prochaineMise(e), date_fin: e.date_fin, nb_mises: e.nb_mises, en_tete: true };
}

// ── Fin d'enchère ────────────────────────────────────────────────────────────
async function finaliser(enchereId) {
  const client = await pool.connect();
  let resultat = null;
  try {
    await client.query('BEGIN');
    const e = (await client.query(`SELECT * FROM encheres WHERE id = $1 AND statut = 'active' AND date_fin <= NOW() FOR UPDATE`, [enchereId])).rows[0];
    if (!e) { await client.query('ROLLBACK'); return null; }
    const top = (await client.query('SELECT acheteur_id, montant FROM encheres_mises WHERE enchere_id = $1 ORDER BY montant DESC, id DESC LIMIT 1', [e.id])).rows[0];
    const reserveOk = !e.prix_reserve || (top && Number(top.montant) >= Number(e.prix_reserve));
    if (!top || !reserveOk) {
      await client.query(`UPDATE encheres SET statut = 'sans_gagnant', termine_le = NOW(), stock_reserve = false, updated_at = NOW() WHERE id = $1`, [e.id]);
      if (e.stock_reserve) await ajusterStock(client, e.produit_id, '', 1);
      resultat = { type: 'sans_gagnant', e };
    } else {
      const cfg = await reglages(e.gestionnaire_id, client);
      const expire = new Date(Date.now() + cfg.delaiPaiementH * 3600000);
      const maj = (await client.query(
        `UPDATE encheres SET statut = 'attente_paiement', gagnant_id = $1, prix_final = $2, paiement_expire_le = $3, termine_le = NOW(), updated_at = NOW() WHERE id = $4 RETURNING *`,
        [top.acheteur_id, top.montant, expire, e.id])).rows[0];
      await client.query(
        `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite, enchere_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8)`,
        [e.gestionnaire_id, top.acheteur_id, e.collaborateur_id, String(e.produit_id), e.titre, e.image_url, top.montant, e.id]);
      resultat = { type: 'gagnee', e: maj, delaiH: cfg.delaiPaiementH };
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }
  if (resultat) notifierFin(resultat).catch((x) => console.error('[encheres] notification fin :', x.message));
  return resultat;
}

// Le gagnant n'a pas payé à temps → l'enchère expire et l'unité redevient vendable.
async function expirerPaiement(enchereId) {
  const client = await pool.connect();
  let e;
  try {
    await client.query('BEGIN');
    e = (await client.query(`SELECT * FROM encheres WHERE id = $1 AND statut = 'attente_paiement' AND paiement_expire_le <= NOW() FOR UPDATE`, [enchereId])).rows[0];
    if (!e) { await client.query('ROLLBACK'); return false; }
    // Un paiement Stripe est peut-être en cours : on attend la fin de sa session (30 min max)
    const enCours = await client.query(
      `SELECT 1 FROM marketplace_commandes WHERE statut_paiement = 'en_attente' AND statut <> 'annulee' AND stock_reserve = true
          AND (expire_le IS NULL OR expire_le > NOW() - INTERVAL '10 minutes') AND articles @> $1::jsonb LIMIT 1`,
      [JSON.stringify([{ enchere_id: e.id }])]);
    if (enCours.rows.length) { await client.query('ROLLBACK'); return false; }
    await client.query(`UPDATE encheres SET statut = 'expiree', stock_reserve = false, updated_at = NOW() WHERE id = $1`, [e.id]);
    await client.query('DELETE FROM marketplace_panier WHERE enchere_id = $1', [e.id]);
    if (e.stock_reserve) await ajusterStock(client, e.produit_id, '', 1);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }
  courrielCollab(e, 'enchere_paiement_expire').catch((x) => console.error('[encheres] expiration :', x.message));
  notifierAcheteur(e.gestionnaire_id, e.gagnant_id, "Délai de paiement dépassé", `Le délai pour payer « ${e.titre} » est écoulé : l'enchère est annulée.`).catch(() => {});
  return true;
}

// Annulation par le collaborateur (seulement sans aucune mise) ou par le gestionnaire (toujours, avant la fin).
async function annulerEnchere({ gid, enchereId, collaborateurId, parGestionnaire }) {
  const client = await pool.connect();
  let e;
  try {
    await client.query('BEGIN');
    e = (await client.query('SELECT * FROM encheres WHERE id = $1 AND gestionnaire_id = $2 FOR UPDATE', [enchereId, gid])).rows[0];
    if (!e || (!parGestionnaire && e.collaborateur_id !== collaborateurId)) refus('Enchère introuvable.', 404);
    if (e.statut !== 'active') refus("Seule une enchère en cours peut être annulée.", 409);
    if (!parGestionnaire && e.nb_mises > 0) refus('Une enchère qui a reçu des mises ne peut pas être annulée. Contactez le gestionnaire.', 409);
    await client.query(`UPDATE encheres SET statut = 'annulee', termine_le = NOW(), stock_reserve = false, updated_at = NOW() WHERE id = $1`, [e.id]);
    if (e.stock_reserve) await ajusterStock(client, e.produit_id, '', 1);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally { client.release(); }
  // Annulation par le gestionnaire alors qu'il y avait des mises : on prévient les enchérisseurs et le collaborateur
  if (parGestionnaire && e.nb_mises > 0) {
    try {
      const qui = (await pool.query('SELECT DISTINCT acheteur_id FROM encheres_mises WHERE enchere_id = $1', [e.id])).rows;
      for (const r of qui) await notifierAcheteur(e.gestionnaire_id, r.acheteur_id, 'Enchère annulée', `L'enchère « ${e.titre} » a été annulée par la boutique. Vos mises ne sont plus valides (aucun montant n'a été prélevé).`);
    } catch (x) { console.error('[encheres] notification annulation :', x.message); }
  }
  return true;
}

// Le gagnant ferme son panier/commande puis veut payer : l'article verrouillé revient.
async function remettreAuPanier({ gid, enchereId, acheteurId }) {
  const e = (await pool.query(`SELECT * FROM encheres WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'attente_paiement' AND gagnant_id = $3 AND paiement_expire_le > NOW()`, [enchereId, gid, acheteurId])).rows[0];
  if (!e) refus("Cette enchère n'est plus à payer.", 404);
  const deja = await pool.query('SELECT id FROM marketplace_panier WHERE enchere_id = $1 AND acheteur_id = $2', [e.id, acheteurId]);
  if (deja.rows.length) return { deja: true };
  const enCours = await pool.query(`SELECT 1 FROM marketplace_commandes WHERE statut_paiement = 'en_attente' AND statut <> 'annulee' AND stock_reserve = true AND articles @> $1::jsonb LIMIT 1`, [JSON.stringify([{ enchere_id: e.id }])]);
  if (enCours.rows.length) refus('Un paiement est déjà en cours pour cet article.', 409);
  await pool.query(
    `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite, enchere_id) VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8)`,
    [e.gestionnaire_id, e.gagnant_id, e.collaborateur_id, String(e.produit_id), e.titre, e.image_url, e.prix_final, e.id]);
  return { deja: false };
}

// ── Notifications (jamais bloquantes) ────────────────────────────────────────
async function notifierAcheteur(gid, acheteurId, titre, message) {
  if (!acheteurId) return;
  try {
    await pool.query(`INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,'enchere')`, [gid, acheteurId, titre, message]);
  } catch (e) { console.error('[encheres] notifierAcheteur', e.message); }
}
const fmt = (n) => `${Number(n).toFixed(2)} $`;
const quandTz = (d, tz) => new Date(d).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short', timeZone: tz || 'America/Toronto' });
const courriels = () => require('./studio_courriels');
const cfgMV = require('./studio_config_mv');
// Montants et dates des messages selon la devise et le fuseau réglés par le gestionnaire (Config marketplace → Généralité)
const fmtGestionnaire = async (gid) => { const dev = cfgMV.deviseDe(await cfgMV.lire(gid, pool)); return (n) => cfgMV.montant(n, dev); };
const quandGestionnaire = async (gid) => { const tz = cfgMV.fuseauDe(await cfgMV.lire(gid, pool)); return (d) => quandTz(d, tz); };

async function courrielAcheteur(gid, acheteurId, cle, variables) {
  const a = (await pool.query('SELECT email, prenom FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2', [acheteurId, gid])).rows[0];
  if (!a || !a.email) return;
  await courriels().envoyerCourriel({ gestionnaireId: gid, cle, a: a.email, variables: { prenom: a.prenom || '', ...variables } });
}
async function courrielCollab(e, cle, extra = {}) {
  const c = (await pool.query('SELECT email, nom_responsable FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2', [e.collaborateur_id, e.gestionnaire_id])).rows[0];
  if (!c || !c.email) return;
  const fmt = await fmtGestionnaire(e.gestionnaire_id);
  const site = await infosSite(e.gestionnaire_id);
  await courriels().envoyerCourriel({
    gestionnaireId: e.gestionnaire_id, cle, a: c.email,
    variables: { prenom_collaborateur: c.nom_responsable || '', produit: e.titre, prix_depart: fmt(e.prix_depart), prix_final: e.prix_final ? fmt(e.prix_final) : '',
                 lien_dashboard: site ? `${site}/?page=dashboard-collaborateur` : '', ...extra },
  });
}

async function surpasse(e, precedent) {
  const fmt = await fmtGestionnaire(e.gestionnaire_id), quand = await quandGestionnaire(e.gestionnaire_id);
  await notifierAcheteur(e.gestionnaire_id, precedent.acheteur_id, 'Vous avez été surenchéri', `Quelqu'un a misé ${fmt(e.mise_actuelle)} sur « ${e.titre} ». Misez à nouveau pour reprendre la tête.`);
  const site = await infosSite(e.gestionnaire_id);
  await courrielAcheteur(e.gestionnaire_id, precedent.acheteur_id, 'enchere_surpassee', {
    produit: e.titre, ancienne_mise: fmt(precedent.montant), prix_final: fmt(e.mise_actuelle), date_fin: quand(e.date_fin),
    lien_enchere: site ? `${site}/?page=dashboard-acheteur` : '',
  });
}

async function notifierFin({ type, e, delaiH }) {
  if (type === 'sans_gagnant') { await courrielCollab(e, 'enchere_sans_gagnant'); return; }
  const fmt = await fmtGestionnaire(e.gestionnaire_id), quand = await quandGestionnaire(e.gestionnaire_id);
  const site = await infosSite(e.gestionnaire_id);
  await notifierAcheteur(e.gestionnaire_id, e.gagnant_id, 'Vous avez gagné une enchère 🎉', `Félicitations ! « ${e.titre} » est à vous pour ${fmt(e.prix_final)}. Payez-le depuis votre panier avant le ${quand(e.paiement_expire_le)}.`);
  await courrielAcheteur(e.gestionnaire_id, e.gagnant_id, 'enchere_gagnee', {
    produit: e.titre, prix_final: fmt(e.prix_final), delai_paiement: `${delaiH} heure(s)`, lien_paiement: site ? `${site}/?page=dashboard-acheteur` : '',
  });
  await courrielCollab(e, 'enchere_terminee_collab', { delai_paiement: `${delaiH} heure(s)` });
}

// ── Tâche de fond ────────────────────────────────────────────────────────────
async function traiterEcheances() {
  try {
    const f = await pool.query(`SELECT id FROM encheres WHERE statut = 'active' AND date_fin <= NOW() ORDER BY date_fin LIMIT 50`);
    for (const r of f.rows) await finaliser(r.id).catch((x) => console.error('[encheres] finaliser', r.id, x.message));
    const x = await pool.query(`SELECT id FROM encheres WHERE statut = 'attente_paiement' AND paiement_expire_le <= NOW() ORDER BY paiement_expire_le LIMIT 50`);
    for (const r of x.rows) await expirerPaiement(r.id).catch((y) => console.error('[encheres] expirer', r.id, y.message));
  } catch (e) { console.error('[encheres] tâche de fond :', e.message); }
}
function demarrerEncheres() {
  const t = setInterval(traiterEcheances, 30000);
  if (t.unref) t.unref();
}

module.exports = { ErreurEnchere, reglages, prochaineMise, creerEnchere, miser, finaliser, expirerPaiement, annulerEnchere, remettreAuPanier, traiterEcheances, demarrerEncheres };