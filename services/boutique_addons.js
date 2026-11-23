// CHEMIN : services/boutique_addons.js
// e-Vend Studio — Add-ons des templates boutique (solo). Catalogue et achats PROPRES à la boutique
// (tables boutique_addons et boutique_addons_achetes). Ne lit ni n'écrit rien du multivendeur.
//
// Règle : un add-on est ACTIF pour un gestionnaire s'il l'a activé (ligne dans boutique_addons_achetes).
// Un add-on n'est offert que s'il est `actif` (interrupteur général) ET `branche` (il fonctionne vraiment dans la boutique).
// Facturation Stripe : plus tard — on enregistre seulement ce qui est choisi (comme pour le MV).

'use strict';

const pool = require('../db');
const { ErreurBoutique } = require('./boutique_limites');
const MONO = require('./boutique_mono');

// Sections d'affichage, dans l'ordre (la catégorie « collaboration » du MV n'existe pas dans la boutique)
const CATEGORIES = [
  { id: 'expedition',     nom: 'Expédition',        emoji: '📦' },
  { id: 'connecteurs',    nom: 'Connecteurs',       emoji: '🔌' },
  { id: 'produits',       nom: 'Produits & ventes', emoji: '🛍️' },
  { id: 'marketing',      nom: 'Marketing',         emoji: '📣' },
  { id: 'image',          nom: 'Image de marque',   emoji: '🎨' },
  { id: 'service_client', nom: 'Service client',    emoji: '💬' },
  { id: 'conformite',     nom: 'Conformité',        emoji: '🔒' },
  { id: 'autres',         nom: 'Autres',            emoji: '🧩' },
];
const CATEGORIE_IDS = new Set(CATEGORIES.map((c) => c.id));

const nombre = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const arrondi = (n) => Math.round(n * 100) / 100;

// Templates boutique SOLO (mêmes préfixes que le menu du gestionnaire) : Premium, Simplisse (et Mode), Beauté.
// Boutique Complète (boutique-complete) et Catalogue Avancé (boutique-catalogue) Boutique Agricole (boutique-agricole) et Simplisse Artisan (boutique-artisan) et Simplisse Auto (boutique-auto) et Simplisse Jouets (boutique-jouets) : comparaison EXACTE, comme le Mono-produit.
const PREFIXES_SOLO = ['boutique-premium', 'boutique-simplisse', 'boutique-beaute'];
// Mono-produit (boutique-simple) : comparaison EXACTE — « boutique-simplisse » commence par « boutique-simple »
const estTemplateSolo = (t) => typeof t === 'string' && (PREFIXES_SOLO.some((p) => t.startsWith(p)) || MONO.estTemplateMono(t) || t === 'boutique-complete' || t === 'boutique-catalogue' || t === 'boutique-agricole' || t === 'boutique-artisan' || t === 'boutique-auto' || t === 'boutique-jouets');

// Le gestionnaire a-t-il un site boutique solo ? Les add-ons ne servent qu'à ces templates.
async function aSiteBoutique(gid, db) {
  const r = await (db || pool).query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
  return estTemplateSolo(r.rows[0] && r.rows[0].template_id);
}

// État complet : add-ons offerts (ou déjà activés), avec prix, achat, total mensuel.
async function etat(gid, db) {
  const c = db || pool;
  const mono = await MONO.estMono(gid, c);   // Mono-produit : les add-ons sans objet (enchères, offres du jour, eBay, Etsy) ne sont pas proposés
  const [cat, ach] = await Promise.all([
    c.query('SELECT code, nom, description, emoji, categorie, prix_ht, guide_url, ordre, actif, branche FROM boutique_addons ORDER BY ordre, code'),
    c.query('SELECT code, prix_ht, active_le FROM boutique_addons_achetes WHERE gestionnaire_id = $1', [gid]),
  ]);
  const achat = new Map(ach.rows.map((a) => [a.code, a]));
  const addons = cat.rows
    .filter((a) => !(mono && MONO.ADDONS_EXCLUS.includes(a.code)))
    .filter((a) => (a.actif && a.branche) || achat.has(a.code))      // un add-on déjà activé reste visible même si on le retire du catalogue
    .map((a) => {
      const x = achat.get(a.code);
      return {
        code: a.code, nom: a.nom, description: a.description || '', emoji: a.emoji || '🧩',
        categorie: CATEGORIE_IDS.has(a.categorie) ? a.categorie : 'autres',
        guide_url: a.guide_url || '', prix_ht: nombre(a.prix_ht),
        achete: !!x, active_le: x ? x.active_le : null, prix_facture: x ? nombre(x.prix_ht) : 0,
        offert: !!(a.actif && a.branche),
      };
    });
  const total = arrondi(addons.reduce((s, a) => s + a.prix_facture, 0));
  return { categories: CATEGORIES, addons, total_ht: total };
}

async function activer(gid, code, db) {
  const c = db || pool;
  if (!(await aSiteBoutique(gid, c))) throw new ErreurBoutique('Les add-ons sont offerts aux templates boutique seulement.', 403);
  if ((await MONO.estMono(gid, c)) && MONO.ADDONS_EXCLUS.includes(String(code || ''))) throw new ErreurBoutique("Cet add-on n'a pas de sens pour un template Mono-produit.", 403);
  const a = (await c.query('SELECT code, prix_ht, actif, branche FROM boutique_addons WHERE code = $1', [String(code || '')])).rows[0];
  if (!a || !a.actif || !a.branche) throw new ErreurBoutique('Add-on introuvable ou non disponible.', 404);
  const r = await c.query(
    `INSERT INTO boutique_addons_achetes (gestionnaire_id, code, prix_ht) VALUES ($1, $2, $3)
     ON CONFLICT (gestionnaire_id, code) DO NOTHING`, [gid, a.code, a.prix_ht]);
  return { deja: r.rowCount === 0, prix_ht: nombre(a.prix_ht) };
}

async function desactiver(gid, code, db) {
  const r = await (db || pool).query('DELETE FROM boutique_addons_achetes WHERE gestionnaire_id = $1 AND code = $2', [gid, String(code || '')]);
  return { retire: r.rowCount > 0 };
}

// Pour le code de la boutique (vitrine, caisse…) : cet add-on est-il actif pour ce gestionnaire ?
async function addonActif(gid, code, db) {
  if (MONO.ADDONS_EXCLUS.includes(String(code || '')) && (await MONO.estMono(gid, db))) return false;
  const r = await (db || pool).query(
    `SELECT 1 FROM boutique_addons_achetes x JOIN boutique_addons a ON a.code = x.code
      WHERE x.gestionnaire_id = $1 AND x.code = $2 AND a.actif = true AND a.branche = true`, [gid, String(code || '')]);
  return r.rowCount > 0;
}

// Public (lu par le site de la boutique) : { code: true } pour chaque add-on activé ET encore offert. Rien d'autre n'est révélé.
async function actifs(gid, db) {
  const mono = await MONO.estMono(gid, db);
  const r = await (db || pool).query(
    `SELECT x.code FROM boutique_addons_achetes x JOIN boutique_addons a ON a.code = x.code
      WHERE x.gestionnaire_id = $1 AND a.actif = true AND a.branche = true`, [gid]);
  const out = {};
  for (const l of r.rows) if (!(mono && MONO.ADDONS_EXCLUS.includes(l.code))) out[l.code] = true;
  return out;
}

module.exports = { CATEGORIES, PREFIXES_SOLO, estTemplateSolo, etat, activer, desactiver, addonActif, actifs, aSiteBoutique };