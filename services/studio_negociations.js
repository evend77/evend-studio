// CHEMIN : services/studio_negociations.js
// e-Vend Studio — Add-on « Faire une offre » : règles + SQL partagé.
//
// PRINCIPE : aucune tâche planifiée. Une négociation garde sa date limite (expire_le) ; l'état « expirée » est calculé à la lecture
// (sqlEtat). Aucune réservation de stock : le produit peut se vendre pendant que l'offre est acceptée — le premier qui paie l'obtient.
//
// Cycle :  attente (offre de l'acheteur) → acceptee | refusee | contre (vendeur)   ·   contre → acceptee | refusee (acheteur)
//          acceptee → payee (paiement)   ·   tout état vivant → annulee (l'acheteur retire) ou expiree (calculé)

'use strict';

const pool = require('../db');
const addons = require('./studio_addons');
const OFFRES = require('./studio_offres');
const reglesMV = require('./studio_regles_produits');

const CODE_ADDON = 'faire_une_offre';
const ATTENTE_REPONSE_JOURS = 7;     // le vendeur a 7 jours pour répondre à une offre
const MAX_OFFRES_PAR_JOUR = 10;      // par acheteur
const VALIDITE_DEFAUT_H = 48;

class ErreurNego extends Error { constructor(m, status = 400) { super(m); this.status = status; } }
const refus = (m, s) => { throw new ErreurNego(m, s); };

const arrondi = (n) => Math.round(n * 100) / 100;
const borne = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : def; };

// ── SQL partagé ──
const sqlEtat = (a = 'n') => `(CASE WHEN ${a}.statut IN ('attente','contre','acceptee') AND ${a}.expire_le <= NOW() THEN 'expiree' ELSE ${a}.statut END)`;
const sqlVivante = (a = 'n') => `(${a}.statut IN ('attente','contre','acceptee') AND ${a}.expire_le > NOW())`;

const actifPourBoutique = (gid) => addons.addonActifRapide(gid, CODE_ADDON, pool);

// Validité d'une offre acceptée / contre-offre : réglage du gestionnaire (sites.config.multivendeur.negociation_validite_heures), 48 h par défaut
async function reglages(gid, db = pool) {
  const r = await db.query('SELECT config FROM sites WHERE gestionnaire_id = $1', [gid]);
  const mv = (r.rows[0] && r.rows[0].config && r.rows[0].config.multivendeur) || {};
  return { validiteHeures: Math.round(borne(mv.negociation_validite_heures, 1, 336, VALIDITE_DEFAUT_H)) };
}

async function reglagesCollab(gid, cid, db = pool) {
  const r = (await db.query('SELECT actif, min_pct FROM negociations_collab WHERE gestionnaire_id = $1 AND collaborateur_id = $2', [gid, cid])).rows[0];
  return { actif: r ? r.actif : true, minPct: r ? r.min_pct : 50 };
}

// Prix effectif d'un produit (copie fidèle de prixEtStock du panier : promo valide, variante avec son prix propre)
function prixEtStock(produit, nomVariante, gererStock = true) {
  const base = Number(produit.prix) || 0;
  const promo = produit.prix_promo !== null && produit.prix_promo !== undefined ? Number(produit.prix_promo) : 0;
  const prixProduit = promo > 0 && promo < base ? promo : base;
  const stockProduit = !gererStock || produit.stock === null || produit.stock === undefined ? 999999 : Math.max(0, Number(produit.stock) || 0);
  let vars = produit.variantes;
  if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = []; } }
  vars = Array.isArray(vars) ? vars.filter((v) => v && typeof v.nom === 'string' && v.nom.trim()) : [];
  if (!vars.length) return nomVariante ? { erreur: 'Variante inconnue.' } : { prix: prixProduit, stock: stockProduit };
  if (!nomVariante) return { erreur: 'Choisissez une variante.' };
  const v = vars.find((x) => x.nom.trim() === nomVariante);
  if (!v) return { erreur: 'Variante inconnue.' };
  const prixVar = v.prix === null || v.prix === undefined || v.prix === '' || !(Number(v.prix) >= 0) ? prixProduit : Number(v.prix);
  const stockVar = !gererStock ? 999999 : v.stock === null || v.stock === undefined || v.stock === '' ? stockProduit : Math.max(0, Math.trunc(Number(v.stock)) || 0);
  return { prix: prixVar, stock: stockVar };
}

async function lireProduit(db, gid, produitId, verrou = false) {
  return (await db.query(
    `SELECT id, titre, prix, ${OFFRES.sqlPromo('produits')} AS prix_promo, stock, variantes, statut, date_parution, collaborateur_id, photo_principale,
            ${OFFRES.sqlEnchereVivante('produits')} AS enchere
       FROM produits WHERE id = $1 AND gestionnaire_id = $2${verrou ? ' FOR UPDATE' : ''}`, [produitId, gid])).rows[0];
}

async function notifierAcheteur(gid, acheteurId, titre, message) {
  try {
    await pool.query(`INSERT INTO marketplace_notifications (gestionnaire_id, acheteur_id, titre, message, type) VALUES ($1,$2,$3,$4,'negociation')`, [gid, acheteurId, titre, message]);
  } catch (e) { console.error('[negociations] notification acheteur :', e.message); }
}
async function notifierCollab(gid, collabId, texte) {
  try { await require('./studio_notif_collab').notifier({ gid, collabId, texte }); }
  catch (e) { console.error('[negociations] notification collaborateur :', e.message); }
}
const $$ = (n) => `${Number(n).toFixed(2).replace('.', ',')} $`;
const motCourt = (v, n = 300) => (typeof v === 'string' ? v.trim().slice(0, n) : '') || null;

// ── Acheteur : faire une offre ──
async function faireOffre({ gid, acheteurId, produitId, variante, prix, message }) {
  if (!(await actifPourBoutique(gid))) refus("L'option « Faire une offre » n'est pas activée pour cette marketplace.", 403);
  const offert = arrondi(Number(prix));
  if (!Number.isFinite(offert) || offert <= 0) refus('Le prix proposé est invalide.');
  const v = typeof variante === 'string' ? variante.trim() : '';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const p = await lireProduit(client, gid, produitId, true);
    if (!p || p.statut !== 'actif') refus("Ce produit n'est plus disponible.", 404);
    if (p.date_parution && new Date(p.date_parution).getTime() > Date.now()) refus("Ce produit n'est pas encore en vente.", 409);
    if (p.enchere) refus('Ce produit est aux enchères : on ne peut pas y faire une offre.', 409);
    const cfgC = await reglagesCollab(gid, p.collaborateur_id, client);
    if (!cfgC.actif) refus("Ce vendeur n'accepte pas les offres de prix.", 409);
    const regP = await reglesMV.lire(gid, client);
    const choix = prixEtStock(p, v, regP.gererStock);
    if (choix.erreur) refus(choix.erreur);
    if (choix.stock <= 0) refus('Ce produit est épuisé.', 409);
    if (offert >= choix.prix) refus(`Votre offre doit être inférieure au prix actuel (${$$(choix.prix)}). Vous pouvez simplement l'acheter.`);
    const minimum = arrondi(choix.prix * cfgC.minPct / 100);
    if (offert < minimum) refus(`Ce vendeur n'accepte pas d'offre sous ${cfgC.minPct} % du prix (minimum ${$$(minimum)}).`);

    const vivante = (await client.query(
      `SELECT 1 FROM negociations n WHERE n.acheteur_id = $1 AND n.produit_id = $2 AND n.variante = $3 AND ${sqlVivante('n')} LIMIT 1`, [acheteurId, produitId, v])).rows[0];
    if (vivante) refus('Vous avez déjà une offre en cours sur ce produit. Consultez « Mes offres ».', 409);
    const jour = (await client.query(`SELECT COUNT(*)::int AS n FROM negociations WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`, [acheteurId, gid])).rows[0].n;
    if (jour >= MAX_OFFRES_PAR_JOUR) refus(`Limite de ${MAX_OFFRES_PAR_JOUR} offres par jour atteinte. Réessayez demain.`, 429);

    const n = (await client.query(
      `INSERT INTO negociations (gestionnaire_id, produit_id, collaborateur_id, acheteur_id, variante, titre, image_url, prix_produit, prix_offert, message, expire_le)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW() + ($11 || ' days')::interval) RETURNING *`,
      [gid, produitId, p.collaborateur_id, acheteurId, v, p.titre, p.photo_principale || null, choix.prix, offert, motCourt(message), String(ATTENTE_REPONSE_JOURS)])).rows[0];
    await client.query('COMMIT');
    notifierCollab(gid, p.collaborateur_id, `🤝 Nouvelle offre : ${$$(offert)} sur « ${p.titre} »${v ? ` (${v})` : ''} (prix ${$$(choix.prix)}). Répondez dans « Offres reçues ».`);
    return n;
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
}

// ── Vendeur : répondre ──
async function verrouillerDuVendeur(client, gid, collabId, id) {
  const n = (await client.query(`SELECT n.*, ${sqlEtat('n')} AS etat FROM negociations n WHERE n.id = $1 AND n.gestionnaire_id = $2 AND n.collaborateur_id = $3 FOR UPDATE`, [id, gid, collabId])).rows[0];
  if (!n) refus('Offre introuvable.', 404);
  return n;
}

async function repondreVendeur({ gid, collabId, id, action, prixContre, message }) {
  const cfg = await reglages(gid);
  const client = await pool.connect();
  let n, texteAcheteur;
  try {
    await client.query('BEGIN');
    n = await verrouillerDuVendeur(client, gid, collabId, id);
    if (n.etat !== 'attente') refus(n.etat === 'expiree' ? 'Cette offre est expirée.' : "Cette offre n'attend plus de réponse de votre part.", 409);
    const mot = motCourt(message);
    if (action === 'accepter') {
      await client.query(`UPDATE negociations SET statut='acceptee', prix_final=prix_offert, message_vendeur=$2, expire_le = NOW() + ($3 || ' hours')::interval, updated_at=NOW() WHERE id=$1`, [id, mot, String(cfg.validiteHeures)]);
      texteAcheteur = [`Offre acceptée !`, `Le vendeur accepte ${$$(n.prix_offert)} pour « ${n.titre} ». Ajoutez-le au panier et payez dans les ${cfg.validiteHeures} h. Le stock n'est pas réservé.`];
    } else if (action === 'refuser') {
      await client.query(`UPDATE negociations SET statut='refusee', message_vendeur=$2, updated_at=NOW() WHERE id=$1`, [id, mot]);
      texteAcheteur = ['Offre refusée', `Le vendeur a refusé votre offre de ${$$(n.prix_offert)} sur « ${n.titre} ».`];
    } else if (action === 'contre') {
      const c = arrondi(Number(prixContre));
      if (!Number.isFinite(c) || c <= 0) refus('Le prix de la contre-offre est invalide.');
      if (c <= Number(n.prix_offert)) refus("Une contre-offre doit être plus élevée que l'offre de l'acheteur. Sinon, acceptez-la.");
      const p = await lireProduit(client, gid, n.produit_id);
      const regP = await reglesMV.lire(gid, client);
      const choix = p ? prixEtStock(p, n.variante, regP.gererStock) : { erreur: 'x' };
      if (!choix.erreur && c >= choix.prix) refus(`La contre-offre doit être inférieure au prix actuel (${$$(choix.prix)}).`);
      await client.query(`UPDATE negociations SET statut='contre', prix_contre=$2, message_vendeur=$3, expire_le = NOW() + ($4 || ' hours')::interval, updated_at=NOW() WHERE id=$1`, [id, c, mot, String(cfg.validiteHeures)]);
      texteAcheteur = ['Contre-offre reçue', `Le vendeur propose ${$$(c)} pour « ${n.titre} ». Vous avez ${cfg.validiteHeures} h pour répondre dans « Mes offres ».`];
    } else refus('Action inconnue.');
    await client.query('COMMIT');
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
  await notifierAcheteur(gid, n.acheteur_id, texteAcheteur[0], texteAcheteur[1]);
  return true;
}

// ── Acheteur : répondre / retirer ──
async function repondreAcheteur({ gid, acheteurId, id, action }) {
  const cfg = await reglages(gid);
  const client = await pool.connect();
  let n, collabTexte = null;
  try {
    await client.query('BEGIN');
    n = (await client.query(`SELECT n.*, ${sqlEtat('n')} AS etat FROM negociations n WHERE n.id = $1 AND n.gestionnaire_id = $2 AND n.acheteur_id = $3 FOR UPDATE`, [id, gid, acheteurId])).rows[0];
    if (!n) refus('Offre introuvable.', 404);
    if (action === 'accepter') {
      if (n.etat !== 'contre') refus(n.etat === 'expiree' ? 'Cette contre-offre est expirée.' : "Il n'y a pas de contre-offre à accepter.", 409);
      await client.query(`UPDATE negociations SET statut='acceptee', prix_final=prix_contre, expire_le = NOW() + ($2 || ' hours')::interval, updated_at=NOW() WHERE id=$1`, [id, String(cfg.validiteHeures)]);
      collabTexte = `✅ ${$$(n.prix_contre)} : l'acheteur a accepté votre contre-offre sur « ${n.titre} ». Il a ${cfg.validiteHeures} h pour payer.`;
    } else if (action === 'retirer') {
      if (!['attente', 'contre', 'acceptee'].includes(n.etat)) refus('Cette offre est déjà terminée.', 409);
      await client.query(`UPDATE negociations SET statut='annulee', updated_at=NOW() WHERE id=$1`, [id]);
      await client.query('DELETE FROM marketplace_panier WHERE negociation_id = $1 AND acheteur_id = $2', [id, acheteurId]);
      collabTexte = n.etat === 'contre' ? `L'acheteur a décliné votre contre-offre sur « ${n.titre} ».` : null;
    } else refus('Action inconnue.');
    await client.query('COMMIT');
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
  if (collabTexte) notifierCollab(gid, n.collaborateur_id, collabTexte);
  return true;
}

// ── Acheteur : mettre l'offre acceptée au panier (prix et quantité verrouillés) ──
async function mettreAuPanier({ gid, acheteurId, id }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const n = (await client.query(`SELECT n.*, ${sqlEtat('n')} AS etat FROM negociations n WHERE n.id = $1 AND n.gestionnaire_id = $2 AND n.acheteur_id = $3 FOR UPDATE`, [id, gid, acheteurId])).rows[0];
    if (!n) refus('Offre introuvable.', 404);
    if (n.etat !== 'acceptee') refus(n.etat === 'expiree' ? 'Le délai pour payer cette offre est écoulé.' : "Cette offre n'est pas acceptée.", 409);
    const p = await lireProduit(client, gid, n.produit_id);
    if (!p || p.statut !== 'actif') refus("Ce produit n'est plus disponible.", 409);
    if (p.enchere) refus('Ce produit est maintenant aux enchères.', 409);
    const regP = await reglesMV.lire(gid, client);
    const choix = prixEtStock(p, n.variante, regP.gererStock);
    if (choix.erreur) refus(choix.erreur, 409);
    if (choix.stock <= 0) refus("Ce produit est épuisé : le stock n'était pas réservé et il s'est vendu entre-temps.", 409);
    const deja = await client.query('SELECT 1 FROM marketplace_panier WHERE negociation_id = $1 AND acheteur_id = $2', [id, acheteurId]);
    if (!deja.rows.length) {
      await client.query(
        `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite, variante, negociation_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,$9)`,
        [gid, acheteurId, n.collaborateur_id, String(n.produit_id), n.titre, n.image_url, n.prix_final, n.variante, id]);
    }
    await client.query('COMMIT');
    return true;
  } catch (e) { try { await client.query('ROLLBACK'); } catch (x) { /* ignore */ } throw e; }
  finally { client.release(); }
}

// Appelé par la caisse : l'offre verrouillée dans un panier (lecture seule, à l'intérieur de la transaction de la caisse)
async function pourCaisse(client, gid, acheteurId, collabId, negociationId) {
  const n = (await client.query(`SELECT n.*, ${sqlEtat('n')} AS etat FROM negociations n WHERE n.id = $1 AND n.gestionnaire_id = $2 AND n.collaborateur_id = $3 FOR UPDATE`, [negociationId, gid, collabId])).rows[0];
  if (!n || n.acheteur_id !== acheteurId || n.etat !== 'acceptee') return null;
  return n;
}

module.exports = {
  ErreurNego, CODE_ADDON, sqlEtat, sqlVivante, actifPourBoutique, reglages, reglagesCollab, prixEtStock,
  faireOffre, repondreVendeur, repondreAcheteur, mettreAuPanier, pourCaisse, VALIDITE_DEFAUT_H, ATTENTE_REPONSE_JOURS,
};