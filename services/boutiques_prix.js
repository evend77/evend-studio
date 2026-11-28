// CHEMIN : services/boutiques_prix.js
// e-Vend Studio — Templates BOUTIQUE (solo) : GRILLE DE PRIX UNIQUE (paliers selon le nombre de produits actifs), réglée dans la page admin
// Templates → « Boutiques (tarifs) ». Même principe que la cagnotte : une seule source, lue par les 2 pages template et par le serveur.
//   • Une ligne unique dans boutiques_prix_reglages : paliers [{ nom, limite, prix }], devise, suffixe (ex. « / mois »).
//   • Tant que la grille est VIDE, les templates boutique-* éligibles gardent leurs paliers de « Prix Template » (templates_prix) comme avant.
//   • Dès qu'elle contient au moins un palier, elle s'applique à TOUS les templates boutique-* éligibles (affichage des prix + limite de produits actifs).
// Aucun prix n'est écrit dans le code.

'use strict';

const pool = require('../db');
const { nettoyerTexte } = require('../utils/sanitize');

let _pret = null;
function pret() {
  if (!_pret) {
    _pret = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS boutiques_prix_reglages (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        paliers JSONB NOT NULL DEFAULT '[]'::jsonb,
        devise TEXT NOT NULL DEFAULT 'CAD',
        suffixe TEXT NOT NULL DEFAULT '/ mois',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query('INSERT INTO boutiques_prix_reglages (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
    })().catch((e) => { _pret = null; throw e; });
  }
  return _pret;
}

function lirePaliers(brut) {
  let p = brut;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = []; } }
  if (!Array.isArray(p)) return [];
  return p
    .map((x) => ({ nom: String((x && x.nom) || ''), limite: parseInt(x && x.limite, 10), prix: Number(x && x.prix) }))
    .filter((x) => Number.isInteger(x.limite) && x.limite > 0 && Number.isFinite(x.prix) && x.prix >= 0)
    .sort((a, b) => a.limite - b.limite);
}

async function reglages(db) {
  await pret();
  const r = await (db || pool).query('SELECT paliers, devise, suffixe FROM boutiques_prix_reglages WHERE id = 1');
  const row = r.rows[0] || {};
  return { paliers: lirePaliers(row.paliers), devise: row.devise || 'CAD', suffixe: row.suffixe || '' };
}

function formaterPrix(n, devise, suffixe) {
  const f = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: devise || 'CAD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
  return suffixe ? `${f} ${suffixe}` : f;
}

// Même forme que les « Prix Template » : [{ label, limite, prix: « 14,99 $ / mois » }] (vide = pas de grille unique)
async function paliersPourLimites(db) {
  const rg = await reglages(db);
  return rg.paliers.map((p) => ({ label: p.nom || `${p.limite} produits`, limite: p.limite, prix: formaterPrix(p.prix, rg.devise, rg.suffixe) }));
}

// Validation de la saisie admin. Retourne { paliers, devise, suffixe } ou lance une Error (message affiché à l'admin).
function valider(b) {
  b = b || {};
  if (!Array.isArray(b.paliers) || b.paliers.length > 10) throw new Error('Entre 0 et 10 paliers.');
  const vus = new Set();
  const paliers = [];
  for (const p of b.paliers) {
    const limite = parseInt(p && p.limite, 10);
    const prix = (p && (p.prix === '' || p.prix === null || p.prix === undefined)) ? NaN : Number(String(p.prix).replace(',', '.'));
    if (!Number.isInteger(limite) || limite < 1 || limite > 100000) throw new Error('Chaque palier doit avoir un nombre de produits entier (1 ou plus).');
    if (!Number.isFinite(prix) || prix < 0 || prix > 5000) throw new Error(`Prix invalide pour le palier de ${limite} produits (entre 0 $ et 5000 $).`);
    if (vus.has(limite)) throw new Error(`Deux paliers ont la même limite (${limite} produits).`);
    vus.add(limite);
    const nom = nettoyerTexte(String((p && p.nom) || ''), 40).trim() || `${limite} produits`;
    paliers.push({ nom, limite, prix: Math.round(prix * 100) / 100 });
  }
  paliers.sort((a, b2) => a.limite - b2.limite);
  const devise = String(b.devise || 'CAD').toUpperCase();
  if (!['CAD', 'USD'].includes(devise)) throw new Error('Devise non supportée.');
  const suffixe = nettoyerTexte(String(b.suffixe || ''), 20).trim();
  return { paliers, devise, suffixe };
}

async function enregistrer(b) {
  await pret();
  const v = valider(b);
  await pool.query('UPDATE boutiques_prix_reglages SET paliers = $1, devise = $2, suffixe = $3, updated_at = NOW() WHERE id = 1', [JSON.stringify(v.paliers), v.devise, v.suffixe]);
  return reglages();
}

// Seul le Mono-produit ne suit pas la grille (il vend un seul produit : aucun palier). Tous les autres templates boutique-* la suivent.
const HORS_GRILLE = ['boutique-simple'];
const suitLaGrille = (templateId) => { const t = String(templateId || ''); return t.startsWith('boutique-') && !HORS_GRILLE.includes(t); };

module.exports = { HORS_GRILLE, suitLaGrille, pret, reglages, paliersPourLimites, formaterPrix, valider, enregistrer };