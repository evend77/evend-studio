// CHEMIN : services/boutique_retours.js
// e-Vend Studio — Retours des templates boutique (solo). L'acheteur demande, le gestionnaire accepte / refuse, reçoit les articles et rembourse
// (remboursement fait sur SON Stripe / SON PayPal via services/boutique_gestion_commandes.js).

'use strict';

const pool = require('../db');
const { ErreurCommande } = require('./boutique_commandes_erreur');
const C = require('./boutique_commandes');
const G = require('./boutique_gestion_commandes');

const refus = (m, s) => { throw new ErreurCommande(m, s); };
const cents = (n) => Math.round(Number(n) * 100 + 1e-7);
const cle = (a) => `${parseInt(a.produit_id, 10)}|${a.variante || ''}`;

const MOTIFS = { defectueux: 'Article défectueux', mauvais_article: 'Mauvais article reçu', ne_convient_pas: 'Ne convient pas', endommage_transport: 'Endommagé pendant le transport', autre: 'Autre raison' };
const ACTIFS = ['demande', 'accepte', 'recu', 'rembourse'];   // retours qui « réservent » les quantités

async function reglages(db, gid) {
  const r = (await db.query('SELECT retours_actifs, delai_retour_jours FROM boutique_reglages WHERE gestionnaire_id = $1', [gid])).rows[0];
  return { retours_actifs: r ? r.retours_actifs !== false : true, delai_retour_jours: r ? r.delai_retour_jours : 30 };
}

async function majReglages(gid, b) {
  const actif = b.retours_actifs !== false;
  const jours = parseInt(b.delai_retour_jours, 10);
  if (!Number.isInteger(jours) || jours < 1 || jours > 365) refus('Le délai doit être entre 1 et 365 jours.');
  await pool.query(
    `INSERT INTO boutique_reglages (gestionnaire_id, retours_actifs, delai_retour_jours, updated_at) VALUES ($1,$2,$3,NOW())
     ON CONFLICT (gestionnaire_id) DO UPDATE SET retours_actifs = $2, delai_retour_jours = $3, updated_at = NOW()`, [gid, actif, jours]);
  return reglages(pool, gid);
}

// Quantités déjà engagées dans d'autres retours de cette commande
async function engagees(db, commandeId) {
  const r = await db.query(`SELECT articles FROM boutique_retours WHERE commande_id = $1 AND statut = ANY($2)`, [commandeId, ACTIFS]);
  const m = new Map();
  for (const x of r.rows) for (const a of (Array.isArray(x.articles) ? x.articles : [])) m.set(cle(a), (m.get(cle(a)) || 0) + (parseInt(a.quantite, 10) || 0));
  return m;
}

function delaiOk(cmd, jours) {
  const depart = cmd.livree_le || cmd.expediee_le || cmd.paye_le;
  if (!depart) return false;
  return Date.now() <= new Date(depart).getTime() + jours * 86400000;
}

function peutRetourner(cmd, reg) {
  return cmd.statut_paiement === 'paye' && (cmd.statut === 'expediee' || cmd.statut === 'livree') && reg.retours_actifs && delaiOk(cmd, reg.delai_retour_jours);
}

// ── Acheteur ──
async function eligibles(gid, acheteurId) {
  const reg = await reglages(pool, gid);
  if (!reg.retours_actifs) return { reglages: reg, commandes: [] };
  const r = await pool.query(
    `SELECT id, numero_commande, articles, devise, statut, statut_paiement, livree_le, expediee_le, paye_le, created_at
       FROM boutique_commandes WHERE gestionnaire_id = $1 AND acheteur_id = $2 AND statut_paiement = 'paye' AND statut IN ('expediee','livree') ORDER BY created_at DESC LIMIT 50`, [gid, acheteurId]);
  const out = [];
  for (const c of r.rows) {
    if (!peutRetourner(c, reg)) continue;
    const deja = await engagees(pool, c.id);
    const lignes = (c.articles || []).map((a) => ({ produit_id: a.produit_id, variante: a.variante || '', titre: a.titre, prix: a.prix, commande: a.quantite, disponible: Math.max(0, a.quantite - (deja.get(cle(a)) || 0)), image_url: a.image_url || null })).filter((l) => l.disponible > 0);
    if (lignes.length) out.push({ id: c.id, numero_commande: c.numero_commande, devise: c.devise, lignes });
  }
  return { reglages: reg, commandes: out };
}

async function demander(gid, acheteurId, b) {
  const reg = await reglages(pool, gid);
  if (!reg.retours_actifs) refus("Cette boutique n'accepte pas les retours en ligne.", 409);
  const motif = String(b.motif || '');
  if (!MOTIFS[motif]) refus('Choisissez le motif du retour.');
  const details = String(b.details || '').trim().slice(0, 1000);
  if (motif === 'autre' && details.length < 5) refus('Expliquez la raison du retour.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const c = (await client.query('SELECT * FROM boutique_commandes WHERE numero_commande = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 FOR UPDATE', [String(b.numero_commande || ''), gid, acheteurId])).rows[0];
    if (!c) refus('Commande introuvable.', 404);
    if (c.statut_paiement !== 'paye') refus("Cette commande n'est pas payée ou a été remboursée.", 409);
    if (c.statut !== 'expediee' && c.statut !== 'livree') refus("Un retour est possible une fois la commande expédiée.", 409);
    if (!delaiOk(c, reg.delai_retour_jours)) refus(`Le délai de retour de ${reg.delai_retour_jours} jours est dépassé.`, 409);
    const deja = await engagees(client, c.id);
    const par = new Map((c.articles || []).map((a) => [cle(a), a]));
    const demandes = Array.isArray(b.articles) ? b.articles : [];
    const lignes = [];
    for (const d of demandes) {
      const q = parseInt(d.quantite, 10);
      if (!(q > 0)) continue;
      const a = par.get(cle(d));
      if (!a) refus("Un des articles n'appartient pas à cette commande.");
      if (q + (deja.get(cle(a)) || 0) > a.quantite) refus(`« ${a.titre} » : quantité trop élevée (déjà en retour ou commandée en moins grand nombre).`, 409);
      lignes.push({ produit_id: a.produit_id, variante: a.variante || '', titre: a.titre, quantite: q, prix: a.prix, rabais_unitaire: a.rabais ? Math.round(a.rabais * 100 / a.quantite) / 100 : 0 });
    }
    if (!lignes.length) refus('Choisissez au moins un article à retourner.');
    const numero = `RT-${gid}-${Date.now()}`;
    const r = await client.query(
      `INSERT INTO boutique_retours (gestionnaire_id, commande_id, acheteur_id, numero_retour, articles, motif, details) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [gid, c.id, acheteurId, numero, JSON.stringify(lignes), motif, details || null]);
    await client.query('COMMIT');
    return r.rows[0];
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
}

const COL_PUB = `r.id, r.numero_retour, r.statut, r.articles, r.motif, r.details, r.reponse, r.montant_rembourse, r.created_at, r.traite_le, c.numero_commande, c.devise`;

async function listerAcheteur(gid, acheteurId) {
  const r = await pool.query(`SELECT ${COL_PUB} FROM boutique_retours r JOIN boutique_commandes c ON c.id = r.commande_id WHERE r.gestionnaire_id = $1 AND r.acheteur_id = $2 ORDER BY r.created_at DESC LIMIT 100`, [gid, acheteurId]);
  return r.rows.map((x) => ({ ...x, motif_texte: MOTIFS[x.motif] || x.motif }));
}

async function annulerAcheteur(gid, acheteurId, numero) {
  const r = await pool.query(`UPDATE boutique_retours SET statut = 'annule', updated_at = NOW() WHERE numero_retour = $1 AND gestionnaire_id = $2 AND acheteur_id = $3 AND statut = 'demande' RETURNING id`, [numero, gid, acheteurId]);
  if (!r.rows[0]) refus("Cette demande ne peut plus être annulée (elle est déjà traitée) ou est introuvable.", 409);
}

// ── Gestionnaire ──
const FILTRES = { a_traiter: `r.statut = 'demande'`, en_cours: `r.statut IN ('accepte','recu')`, termines: `r.statut IN ('rembourse','refuse','annule')`, tous: 'TRUE' };

async function listerGest(gid, filtre) {
  const f = FILTRES[filtre] || FILTRES.tous;
  const r = await pool.query(
    `SELECT ${COL_PUB}, a.email AS acheteur_email FROM boutique_retours r JOIN boutique_commandes c ON c.id = r.commande_id
       LEFT JOIN marketplace_acheteurs a ON a.id = r.acheteur_id AND a.gestionnaire_id = r.gestionnaire_id
      WHERE r.gestionnaire_id = $1 AND (${f}) ORDER BY r.created_at DESC LIMIT 200`, [gid]);
  const cp = (await pool.query(
    `SELECT COUNT(*) FILTER (WHERE statut = 'demande')::int AS a_traiter, COUNT(*) FILTER (WHERE statut IN ('accepte','recu'))::int AS en_cours,
            COUNT(*) FILTER (WHERE statut IN ('rembourse','refuse','annule'))::int AS termines, COUNT(*)::int AS tous FROM boutique_retours WHERE gestionnaire_id = $1`, [gid])).rows[0];
  return { retours: r.rows.map((x) => ({ ...x, motif_texte: MOTIFS[x.motif] || x.motif })), compteurs: cp, reglages: await reglages(pool, gid) };
}

// Montant conseillé : valeur des articles retournés (après rabais) + leur part des taxes. L'expédition n'est pas remboursée d'office.
function montantConseille(cmd, retour) {
  let netC = 0;
  for (const l of retour.articles) netC += Math.round(cents(l.prix) * l.quantite - cents(l.rabais_unitaire || 0) * l.quantite);
  const sousNetC = cents(cmd.sous_total) - cents(cmd.rabais);
  const taxesC = cents((cmd.taxes && cmd.taxes.total_taxes) || 0);
  const partTaxes = sousNetC > 0 ? Math.round(taxesC * netC / sousNetC) : 0;
  const restantC = cents(cmd.total) - cents(cmd.rembourse);
  return Math.max(0, Math.min(netC + partTaxes, restantC)) / 100;
}

async function detailGest(gid, id) {
  const r = (await pool.query(
    `SELECT r.*, c.numero_commande, c.devise, c.total, c.rembourse, c.sous_total, c.rabais, c.taxes, c.mode_paiement, c.statut_paiement AS commande_statut_paiement, a.email AS acheteur_email, a.prenom AS acheteur_prenom, a.nom AS acheteur_nom
       FROM boutique_retours r JOIN boutique_commandes c ON c.id = r.commande_id LEFT JOIN marketplace_acheteurs a ON a.id = r.acheteur_id AND a.gestionnaire_id = r.gestionnaire_id
      WHERE r.id = $1 AND r.gestionnaire_id = $2`, [id, gid])).rows[0];
  if (!r) refus('Retour introuvable.', 404);
  const { total, rembourse, sous_total, rabais, taxes, ...reste } = r;
  return { ...reste, motif_texte: MOTIFS[r.motif] || r.motif, montant_conseille: montantConseille({ total, rembourse, sous_total, rabais, taxes }, r), restant_remboursable: Math.max(0, (cents(total) - cents(rembourse)) / 100) };
}

async function changer(gid, id, depart, vers, reponse, obligatoire) {
  const rep = String(reponse || '').trim().slice(0, 1000);
  if (obligatoire && rep.length < 3) refus('Expliquez votre décision au client.');
  const r = await pool.query(
    `UPDATE boutique_retours SET statut = $3, reponse = COALESCE(NULLIF($4,''), reponse), traite_le = COALESCE(traite_le, NOW()), updated_at = NOW()
      WHERE id = $1 AND gestionnaire_id = $2 AND statut = ANY($5) RETURNING id`, [id, gid, vers, rep, depart]);
  if (!r.rows[0]) refus('Ce retour ne peut plus recevoir cette action.', 409);
  return detailGest(gid, id);
}

const accepter = (gid, id, b) => changer(gid, id, ['demande'], 'accepte', b.message, false);
const refuser = (gid, id, b) => changer(gid, id, ['demande'], 'refuse', b.message, true);

// Articles reçus par le gestionnaire (+ remise en stock, facultative)
async function recu(gid, id, { remettreStock = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = (await client.query(`SELECT * FROM boutique_retours WHERE id = $1 AND gestionnaire_id = $2 FOR UPDATE`, [id, gid])).rows[0];
    if (!r) refus('Retour introuvable.', 404);
    if (r.statut !== 'accepte') refus('Ce retour doit d\'abord être accepté.', 409);
    if (remettreStock) for (const l of [...r.articles].sort((x, y) => x.produit_id - y.produit_id)) await C.ajusterStock(client, parseInt(l.produit_id, 10), l.variante || '', parseInt(l.quantite, 10));
    await client.query(`UPDATE boutique_retours SET statut = 'recu', stock_remis = $2, updated_at = NOW() WHERE id = $1`, [id, !!remettreStock]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
  return detailGest(gid, id);
}

// Remboursement du retour (partiel ou total de la commande) : chez le fournisseur du gestionnaire, puis le retour passe à « remboursé ».
async function rembourser(gid, id, { montant, raison } = {}) {
  const r0 = (await pool.query(`SELECT statut, commande_id FROM boutique_retours WHERE id = $1 AND gestionnaire_id = $2`, [id, gid])).rows[0];
  if (!r0) refus('Retour introuvable.', 404);
  if (r0.statut !== 'accepte' && r0.statut !== 'recu') refus('Le retour doit être accepté avant le remboursement.', 409);
  const d = await detailGest(gid, id);
  const m = montant === undefined || montant === null || montant === '' ? d.montant_conseille : Number(String(montant).replace(',', '.'));
  if (!(m > 0)) refus('Montant de remboursement invalide.');
  await G.rembourser(gid, r0.commande_id, { montant: m, remettreStock: false, raison: raison || `Retour ${d.numero_retour}` });
  await pool.query(`UPDATE boutique_retours SET statut = 'rembourse', montant_rembourse = $2, traite_le = COALESCE(traite_le, NOW()), updated_at = NOW() WHERE id = $1 AND statut IN ('accepte','recu')`, [id, m]);
  return detailGest(gid, id);
}

module.exports = { MOTIFS, reglages, majReglages, eligibles, demander, listerAcheteur, annulerAcheteur, listerGest, detailGest, accepter, refuser, recu, rembourser, montantConseille };