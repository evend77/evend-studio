// CHEMIN : services/boutique_promos.js
// e-Vend Studio — Codes promo des templates boutique (solo). Le rabais s'applique aux ARTICLES (jamais à l'expédition) ; les taxes sont calculées après rabais.
// Utilisations = commandes non annulées portant le code (une commande annulée / expirée / remboursée en entier libère l'utilisation).

'use strict';

const pool = require('../db');
const { ErreurCommande } = require('./boutique_commandes_erreur');

const refus = (m, s) => { throw new ErreurCommande(m, s); };
const cents = (n) => Math.round(Number(n) * 100 + 1e-7);

function normaliserCode(c) { return String(c || '').trim().toUpperCase(); }

// Validation d'un code créé/modifié par le gestionnaire → champs prêts pour la base
function valider(b) {
  const code = normaliserCode(b.code);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) refus('Code invalide : 3 à 30 caractères (lettres, chiffres, - ou _).');
  if (b.type !== 'pourcentage' && b.type !== 'montant') refus('Type de réduction invalide.');
  const valeur = Number(String(b.valeur).replace(',', '.'));
  if (!(valeur > 0)) refus('La valeur de la réduction doit être supérieure à 0.');
  if (b.type === 'pourcentage' && valeur > 100) refus('Un pourcentage ne peut pas dépasser 100 %.');
  if (valeur > 100000) refus('Valeur trop élevée.');
  const optNum = (v, nom, entier) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || (entier && !Number.isInteger(n))) refus(`${nom} invalide.`);
    return n;
  };
  const min = optNum(b.montant_minimum, 'Montant minimum', false);
  const max = optNum(b.utilisations_max, "Nombre d'utilisations", true);
  const parAcheteur = optNum(b.max_par_acheteur, "Limite par client", true);
  if (max !== null && max < 1) refus("Le nombre d'utilisations doit être d'au moins 1.");
  if (parAcheteur !== null && parAcheteur < 1) refus('La limite par client doit être d\'au moins 1.');
  const date = (v, nom) => { if (!v) return null; const d = new Date(v); if (isNaN(d.getTime())) refus(`${nom} invalide.`); return d; };
  const debut = date(b.date_debut, 'Date de début'), fin = date(b.date_fin, 'Date de fin');
  if (debut && fin && fin <= debut) refus('La date de fin doit être après la date de début.');
  return { code, description: String(b.description || '').trim().slice(0, 200) || null, type: b.type, valeur, montant_minimum: min, utilisations_max: max,
    max_par_acheteur: parAcheteur, date_debut: debut, date_fin: fin, actif: b.actif !== false };
}

async function utilisations(db, promoId, acheteurId) {
  const r = await db.query(
    `SELECT COUNT(*)::int n FROM boutique_commandes WHERE code_promo_id = $1 AND statut <> 'annulee' ${acheteurId ? 'AND acheteur_id = $2' : ''}`,
    acheteurId ? [promoId, acheteurId] : [promoId]);
  return r.rows[0].n;
}

// Vérifie un code pour ce panier. verrou = true (création de commande) : la ligne du code est verrouillée pour que deux acheteurs ne dépassent pas la limite.
async function evaluer(db, { gid, acheteurId, code, sousTotalC, verrou = false }) {
  const c = normaliserCode(code);
  if (!c) refus('Entrez un code promo.');
  const p = (await db.query(`SELECT * FROM boutique_codes_promo WHERE gestionnaire_id = $1 AND code = $2 ${verrou ? 'FOR UPDATE' : ''}`, [gid, c])).rows[0];
  if (!p || !p.actif) refus("Ce code promo n'est pas valide.", 400);
  const maintenant = Date.now();
  if (p.date_debut && new Date(p.date_debut).getTime() > maintenant) refus("Ce code promo n'est pas encore actif.", 400);
  if (p.date_fin && new Date(p.date_fin).getTime() < maintenant) refus('Ce code promo est expiré.', 400);
  if (p.montant_minimum !== null && sousTotalC < cents(p.montant_minimum)) refus(`Ce code exige un achat minimum de ${Number(p.montant_minimum).toFixed(2).replace('.', ',')} $.`, 400);
  if (p.utilisations_max !== null && (await utilisations(db, p.id)) >= p.utilisations_max) refus("Ce code promo a atteint sa limite d'utilisations.", 400);
  if (p.max_par_acheteur !== null && (await utilisations(db, p.id, acheteurId)) >= p.max_par_acheteur) refus('Vous avez déjà utilisé ce code promo.', 400);
  const rabaisC = p.type === 'pourcentage' ? Math.round(sousTotalC * Number(p.valeur) / 100 + 1e-7) : Math.min(cents(p.valeur), sousTotalC);
  return { promo: p, rabaisC: Math.max(0, Math.min(rabaisC, sousTotalC)) };
}

// Répartit le rabais entre les lignes, proportionnellement, au cent près (le total réparti = rabais exact)
function repartir(lignes, rabaisC) {
  const bases = lignes.map((l) => cents(l.prix) * l.quantite);
  const total = bases.reduce((s, x) => s + x, 0);
  if (!rabaisC || !total) return bases.map(() => 0);
  const brut = bases.map((b) => b * rabaisC / total);
  const alloc = brut.map((x) => Math.floor(x));
  let reste = rabaisC - alloc.reduce((s, x) => s + x, 0);
  const ordre = brut.map((x, i) => ({ i, f: x - Math.floor(x) })).sort((a, b) => b.f - a.f);
  for (let k = 0; reste > 0 && k < ordre.length; k++, reste--) alloc[ordre[k].i]++;
  return alloc.map((a, i) => Math.min(a, bases[i]));
}

// ── Côté gestionnaire ──
async function lister(gid) {
  const r = await pool.query(
    `SELECT p.*, (SELECT COUNT(*)::int FROM boutique_commandes c WHERE c.code_promo_id = p.id AND c.statut <> 'annulee') AS utilisations,
            (SELECT COALESCE(SUM(c.rabais),0) FROM boutique_commandes c WHERE c.code_promo_id = p.id AND c.statut_paiement IN ('paye','rembourse') AND c.statut <> 'annulee') AS rabais_total
       FROM boutique_codes_promo p WHERE p.gestionnaire_id = $1 ORDER BY p.created_at DESC`, [gid]);
  return r.rows;
}

async function creer(gid, b) {
  const v = valider(b);
  try {
    const r = await pool.query(
      `INSERT INTO boutique_codes_promo (gestionnaire_id, code, description, type, valeur, montant_minimum, utilisations_max, max_par_acheteur, date_debut, date_fin, actif)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [gid, v.code, v.description, v.type, v.valeur, v.montant_minimum, v.utilisations_max, v.max_par_acheteur, v.date_debut, v.date_fin, v.actif]);
    return r.rows[0];
  } catch (e) { if (e.code === '23505') refus('Ce code existe déjà.', 409); throw e; }
}

async function modifier(gid, id, b) {
  const v = valider(b);
  try {
    const r = await pool.query(
      `UPDATE boutique_codes_promo SET code=$3, description=$4, type=$5, valeur=$6, montant_minimum=$7, utilisations_max=$8, max_par_acheteur=$9, date_debut=$10, date_fin=$11, actif=$12, updated_at=NOW()
        WHERE id = $1 AND gestionnaire_id = $2 RETURNING *`,
      [id, gid, v.code, v.description, v.type, v.valeur, v.montant_minimum, v.utilisations_max, v.max_par_acheteur, v.date_debut, v.date_fin, v.actif]);
    if (!r.rows[0]) refus('Code introuvable.', 404);
    return r.rows[0];
  } catch (e) { if (e.code === '23505') refus('Ce code existe déjà.', 409); throw e; }
}

async function supprimer(gid, id) {
  const r = await pool.query('DELETE FROM boutique_codes_promo WHERE id = $1 AND gestionnaire_id = $2', [id, gid]);
  if (!r.rowCount) refus('Code introuvable.', 404);
}

module.exports = { normaliserCode, valider, utilisations, evaluer, repartir, lister, creer, modifier, supprimer };