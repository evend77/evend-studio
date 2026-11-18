// CHEMIN : services/boutique_paliers.js
// e-Vend Studio — Add-on « Prix par palier de quantité » des templates boutique (solo) : validation + calcul. Aucun lien avec le MV.
//
// Stockage : produits.paliers (jsonb) = tableau de lignes  { qte_min, type: 'pourcentage'|'fixe', valeur, variante }
//   • pourcentage : rabais en % sur le prix actuel de l'article (variante ou produit, promo / offre du jour comprise)
//   • fixe        : prix par unité ; avec des variantes, une ligne par (palier, variante) et « variante » = son nom ; sans variante, variante = null
// Règles : 5 paliers maximum, quantité de départ 2 ou plus, sans doublon, un seul type par produit, un palier doit baisser le prix,
// le palier le plus élevé atteint s'applique, chaque variante est comptée séparément (par ligne de panier).
// Aucun palier (ou add-on non activé) → aucun effet. Le prix est TOUJOURS calculé ici, côté serveur.

'use strict';

const pool = require('../db');
const A = require('./boutique_addons');
const { ErreurBoutique } = require('./boutique_limites');

const CODE_ADDON = 'prix_paliers';
const MAX_PALIERS = 5;

const refus = (m, s) => { throw new ErreurBoutique(m, s || 400); };
const arrondi = (n) => Math.round(n * 100) / 100;

const actifPourBoutique = (gid, db) => A.addonActif(gid, CODE_ADDON, db || pool);

// Condition SQL « add-on actif pour le gestionnaire de l'alias a » (même forme que les autres add-ons)
const sqlAddonOn = (a) => `EXISTS (SELECT 1 FROM boutique_addons_achetes x JOIN boutique_addons d ON d.code = x.code WHERE x.gestionnaire_id = ${a}.gestionnaire_id AND x.code = '${CODE_ADDON}' AND d.actif = true AND d.branche = true)`;

function lireBrut(v) {
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return []; } }
  return Array.isArray(v) ? v : [];
}

function variantesDe(brut) {
  const vars = lireBrut(brut);
  return vars.filter((v) => v && typeof v.nom === 'string' && v.nom.trim());
}

// Valide et nettoie les paliers saisis. prix = prix du produit, variantes = variantes enregistrées avec lui.
// Retourne le tableau propre trié (null = aucun palier).
function valider(brut, prix, variantes) {
  const lignes = lireBrut(brut);
  if (!lignes.length) return null;
  if (lignes.length > MAX_PALIERS * 40) refus('Palier de prix : trop de lignes.');
  const vars = variantesDe(variantes);
  const base = Number(prix) || 0;
  const type = lignes[0] && lignes[0].type === 'fixe' ? 'fixe' : 'pourcentage';
  const propres = [];
  const qtes = new Set();
  for (const l of lignes) {
    if (!l || typeof l !== 'object') refus('Palier invalide.');
    if ((l.type === 'fixe' ? 'fixe' : 'pourcentage') !== type) refus('Tous les paliers doivent être du même type (rabais en % ou prix fixe).');
    const q = Number(l.qte_min);
    if (!Number.isInteger(q) || q < 2 || q > 100000) refus('Palier de prix : la quantité doit être un nombre entier de 2 ou plus.');
    qtes.add(q);
    const v = Number(l.valeur);
    if (type === 'pourcentage') {
      if (!(v > 0 && v < 100)) refus(`Palier de prix (${q}+) : le rabais doit être entre 0 et 100 %.`);
      propres.push({ qte_min: q, type, valeur: arrondi(v), variante: null });
    } else {
      if (!(v > 0)) refus(`Palier de prix (${q}+) : entrez un prix valide.`);
      let nom = null;
      let reference = base;
      if (vars.length) {
        nom = typeof l.variante === 'string' ? l.variante.trim() : '';
        const vr = vars.find((x) => x.nom.trim() === nom);
        if (!vr) refus(`Palier de prix (${q}+) : la variante « ${nom} » n'existe pas dans cette annonce.`);
        if (vr.prix !== null && vr.prix !== undefined && vr.prix !== '' && Number(vr.prix) >= 0) reference = Number(vr.prix);
      }
      if (!(v < reference)) refus(`Palier de prix (${q}+) : le prix doit être inférieur à ${reference.toFixed(2)} $${nom ? ` (« ${nom} »)` : ''}.`);
      propres.push({ qte_min: q, type, valeur: arrondi(v), variante: nom });
    }
  }
  if (qtes.size > MAX_PALIERS) refus(`Palier de prix : ${MAX_PALIERS} paliers maximum.`);
  if (type === 'pourcentage' && propres.length !== qtes.size) refus('Palier de prix : une quantité est en double.');
  if (type === 'fixe') {
    const vus = new Set();
    for (const p of propres) { const k = `${p.qte_min}|${p.variante || ''}`; if (vus.has(k)) refus(`Palier de prix : la quantité ${p.qte_min} est en double.`); vus.add(k); }
  }
  return propres.sort((a, b) => a.qte_min - b.qte_min || String(a.variante || '').localeCompare(String(b.variante || '')));
}

// Prix unitaire pour une quantité donnée. prixBase = prix actuel de l'article (variante/produit, promo et offre du jour comprises).
function prixPourQuantite(paliers, nomVariante, quantite, prixBase) {
  const lignes = lireBrut(paliers);
  if (!lignes.length || !(quantite >= 2)) return prixBase;
  const v = nomVariante || '';
  let meilleur = null;
  for (const l of lignes) {
    if (!l || !(Number(l.qte_min) <= quantite)) continue;
    if (l.type === 'fixe' && (l.variante || '') !== v) continue;
    const prix = l.type === 'fixe' ? arrondi(Number(l.valeur)) : arrondi(prixBase * (1 - Number(l.valeur) / 100));
    if (!(prix > 0) || !(prix < prixBase)) continue;
    if (!meilleur || Number(l.qte_min) > meilleur.q) meilleur = { q: Number(l.qte_min), prix };
  }
  return meilleur ? meilleur.prix : prixBase;
}

// Paliers affichables sur la fiche (lignes propres) — tableau vide si aucun
function pourAffichage(paliers) {
  return lireBrut(paliers).filter((l) => l && Number(l.qte_min) >= 2 && Number(l.valeur) > 0)
    .map((l) => ({ qte_min: Number(l.qte_min), type: l.type === 'fixe' ? 'fixe' : 'pourcentage', valeur: Number(l.valeur), variante: l.variante || null }));
}

module.exports = { CODE_ADDON, MAX_PALIERS, sqlAddonOn, actifPourBoutique, valider, prixPourQuantite, pourAffichage, variantesDe };