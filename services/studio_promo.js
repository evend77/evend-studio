// CHEMIN : services/studio_promo.js
// e-Vend Studio — Codes promo des collaborateurs (table reductions_collaborateur).
//
// Le collaborateur crée ses codes (page « Réductions » de son tableau de bord). Un code ne vaut QUE dans la boutique de
// ce collaborateur. Le rabais s'applique aux articles (jamais à l'expédition, aux taxes, au pourboire ni aux articles
// gagnés aux enchères) ; les taxes sont calculées sur le prix APRÈS rabais ; la commission aussi.
// Tout est calculé ici, en cents : le navigateur n'envoie que le code.

'use strict';

const pool = require('../db');
const taxesMV = require('./studio_taxes');

class ErreurPromo extends Error { constructor(m, s) { super(m); this.status = s || 400; } }
const refus = (m, s) => { throw new ErreurPromo(m, s); };

const cents = (v) => Math.round((Number(v) || 0) * 100);

function normaliser(code) {
  const c = String(code == null ? '' : code).trim().toUpperCase();
  return /^[A-Z0-9_-]{3,30}$/.test(c) ? c : null;
}

// lignes : [{ prix, quantite, enchere_id? }] → total admissible (en cents) : les enchères sont exclues
function baseAdmissibleC(lignes) {
  return lignes.reduce((s, l) => s + (l.enchere_id ? 0 : cents(l.prix) * (parseInt(l.quantite, 10) || 0)), 0);
}

// db : pool ou client (transaction). verrou : true → SELECT … FOR UPDATE (dans une transaction)
async function evaluer(db, { gid, collaborateurId, code, lignes, verrou }) {
  const c = normaliser(code);
  if (!c) refus('Code promo invalide.');
  const r = (await db.query(
    `SELECT id, code, type, valeur, montant_minimum, utilisations_max, utilisations, actif,
            (date_debut IS NOT NULL AND date_debut > CURRENT_DATE) AS pas_commence,
            (date_fin IS NOT NULL AND date_fin < CURRENT_DATE) AS termine
       FROM reductions_collaborateur
      WHERE code = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3 ${verrou ? 'FOR UPDATE' : ''}`,
    [c, collaborateurId, gid])).rows[0];
  if (!r || !r.actif) refus('Code promo invalide.', 404);
  if (r.pas_commence) refus("Ce code promo n'est pas encore en vigueur.");
  if (r.termine) refus('Ce code promo est expiré.');
  if (r.utilisations_max !== null && r.utilisations >= r.utilisations_max) refus("Ce code promo n'est plus disponible.");

  const baseC = baseAdmissibleC(lignes);
  if (baseC <= 0) refus("Ce code ne s'applique pas aux articles de votre panier.");
  const minC = cents(r.montant_minimum);
  if (baseC < minC) refus(`Ce code requiert un achat minimum de ${(minC / 100).toFixed(2)} $.`);

  const valeur = Number(r.valeur);
  let rabaisC = r.type === 'pourcentage' ? Math.round(baseC * valeur / 100) : cents(valeur);
  rabaisC = Math.max(0, Math.min(rabaisC, baseC));
  if (rabaisC <= 0) refus("Ce code n'offre aucun rabais sur votre panier.");
  return { reduction: r, code: r.code, rabaisC, baseC };
}

// Répartit le rabais (cents) entre les lignes admissibles au prorata, au cent près : la somme est EXACTEMENT rabaisC.
function repartir(lignes, rabaisC) {
  const totaux = lignes.map((l) => (l.enchere_id ? 0 : cents(l.prix) * (parseInt(l.quantite, 10) || 0)));
  const base = totaux.reduce((a, b) => a + b, 0);
  const alloc = totaux.map((t) => (base > 0 ? Math.floor(rabaisC * t / base) : 0));
  let reste = rabaisC - alloc.reduce((a, b) => a + b, 0);
  for (let i = 0; reste > 0 && i < alloc.length * 2; i++) {
    const k = i % alloc.length;
    if (alloc[k] < totaux[k]) { alloc[k] += 1; reste -= 1; }
  }
  return alloc;
}

// Aperçu pour l'acheteur : lit son panier chez ce collaborateur (prix du panier, indicatif — la commande recalcule tout).
async function apercu({ gid, acheteurId, collaborateurId, code }) {
  const brutes = (await pool.query(
    `SELECT prix, quantite, enchere_id, produit_id FROM marketplace_panier
      WHERE acheteur_id = $1 AND gestionnaire_id = $2 AND collaborateur_id = $3`, [acheteurId, gid, collaborateurId])).rows;
  if (!brutes.length) refus('Votre panier est vide.', 404);
  const lignes = await taxesMV.marquerLignes(pool, gid, brutes);
  const e = await evaluer(pool, { gid, collaborateurId, code, lignes });
  return { ...e, lignes, alloc: repartir(lignes, e.rabaisC) };
}

// Réserve une utilisation (atomique : jamais au-delà du maximum, même avec 2 paiements simultanés).
async function reserverUtilisation(client, reductionId) {
  const r = await client.query(
    `UPDATE reductions_collaborateur SET utilisations = utilisations + 1
      WHERE id = $1 AND actif = true AND (utilisations_max IS NULL OR utilisations < utilisations_max) RETURNING id`, [reductionId]);
  if (!r.rows[0]) refus("Ce code promo n'est plus disponible.");
}

async function remettreUtilisation(client, reductionId) {
  await client.query('UPDATE reductions_collaborateur SET utilisations = GREATEST(utilisations - 1, 0) WHERE id = $1', [reductionId]);
}

module.exports = { ErreurPromo, normaliser, evaluer, repartir, apercu, reserverUtilisation, remettreUtilisation, baseAdmissibleC };