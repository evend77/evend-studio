// CHEMIN : services/vitrines_prix.js
// e-Vend Studio — Sites VITRINE : UN PRIX PAR SOUS-CATÉGORIE (pas de paliers : une vitrine n'a pas de produits), réglé dans la page admin
// Templates → « Vitrines (tarifs) ». Tous les templates d'une sous-catégorie ont le prix de leur sous-catégorie.
//   • Une ligne unique dans vitrines_prix_reglages : prix { <groupe>: nombre }, devise, suffixe (ex. « / mois »).
//   • Une sous-catégorie sans prix saisi garde le prix qu'elle avait avant (« Prix Template » / défaut de catégorie).
//   • Un prix de 0 s'affiche « Gratuit ».
// Aucun prix n'est écrit dans le code.

'use strict';

const pool = require('../db');
const { nettoyerTexte } = require('../utils/sanitize');

// Sous-catégories de la catégorie Vitrines (ids = Template.groupe de PageTemplates.tsx)
const GROUPES = ['vitrine', 'vitrine-contact', 'cours', 'resto', 'profession', 'reservation'];

let _pret = null;
function pret() {
  if (!_pret) {
    _pret = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS vitrines_prix_reglages (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        prix JSONB NOT NULL DEFAULT '{}'::jsonb,
        devise TEXT NOT NULL DEFAULT 'CAD',
        suffixe TEXT NOT NULL DEFAULT '/ mois',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query('INSERT INTO vitrines_prix_reglages (id) VALUES (1) ON CONFLICT (id) DO NOTHING');
    })().catch((e) => { _pret = null; throw e; });
  }
  return _pret;
}

function lirePrix(brut) {
  let p = brut;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }
  const out = {};
  if (!p || typeof p !== 'object') return out;
  for (const g of GROUPES) {
    const n = Number(p[g]);
    if (p[g] !== null && p[g] !== undefined && p[g] !== '' && Number.isFinite(n) && n >= 0) out[g] = n;
  }
  return out;
}

async function reglages(db) {
  await pret();
  const r = await (db || pool).query('SELECT prix, devise, suffixe FROM vitrines_prix_reglages WHERE id = 1');
  const row = r.rows[0] || {};
  return { prix: lirePrix(row.prix), devise: row.devise || 'CAD', suffixe: row.suffixe || '' };
}

function formaterPrix(n, devise, suffixe) {
  if (n === 0) return 'Gratuit';
  const f = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: devise || 'CAD', maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
  return suffixe ? `${f} ${suffixe}` : f;
}

// Validation de la saisie admin. Retourne { prix, devise, suffixe } ou lance une Error (message affiché à l'admin).
function valider(b) {
  b = b || {};
  const brut = b.prix && typeof b.prix === 'object' ? b.prix : {};
  const prix = {};
  for (const g of GROUPES) {
    const v = brut[g];
    if (v === '' || v === null || v === undefined) continue;
    const n = Number(String(v).replace(',', '.'));
    if (!Number.isFinite(n) || n < 0 || n > 5000) throw new Error('Prix invalide (entre 0 $ et 5000 $).');
    prix[g] = Math.round(n * 100) / 100;
  }
  const devise = String(b.devise || 'CAD').toUpperCase();
  if (!['CAD', 'USD'].includes(devise)) throw new Error('Devise non supportée.');
  const suffixe = nettoyerTexte(String(b.suffixe || ''), 20).trim();
  return { prix, devise, suffixe };
}

async function enregistrer(b) {
  await pret();
  const v = valider(b);
  await pool.query('UPDATE vitrines_prix_reglages SET prix = $1, devise = $2, suffixe = $3, updated_at = NOW() WHERE id = 1', [JSON.stringify(v.prix), v.devise, v.suffixe]);
  return reglages();
}

module.exports = { GROUPES, pret, reglages, formaterPrix, valider, enregistrer };