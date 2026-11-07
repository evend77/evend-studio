// CHEMIN : services/studio_expedition.js
// e-Vend Studio — Calcul des frais d'expédition (même algorithme que e-Vend : 4 modes, combine shipping,
// zones par province, « gratuit dès X $ », livraison gratuite globale du collaborateur).
// Les méthodes appartiennent au collaborateur (collab_methodes_expedition) ; chaque annonce choisit les siennes
// (collab_produit_methodes_expedition). Le serveur recalcule TOUJOURS les frais : jamais ceux du navigateur.

const pool = require('../db');

const TRANSPORTEURS = {
  1:  { nom: 'Canada Post / Postes Canada', logo: '📮' },
  2:  { nom: 'Purolator',                   logo: '🚚' },
  3:  { nom: 'FedEx Canada',                logo: '✈️' },
  4:  { nom: 'UPS Canada',                  logo: '📦' },
  5:  { nom: 'Intelcom Courrier',           logo: '📬' },
  6:  { nom: 'DHL Express Canada',          logo: '🌍' },
  7:  { nom: 'GLS Canada',                  logo: '🚛' },
  8:  { nom: 'CanPar',                      logo: '🇨🇦' },
  9:  { nom: 'Loomis Express',              logo: '📦' },
  10: { nom: 'Transport A. Bélanger',       logo: '🚚' },
  11: { nom: 'Groupe Robert',               logo: '🏭' },
  12: { nom: 'Livraison locale',            logo: '🛵' },
  13: { nom: 'Ramassage sur place',         logo: '🏪' },
  14: { nom: 'Livraison gratuite',          logo: '🎁' },
};
const IDS_PERSONNALISES = [101, 102];
const LOGOS_PERSONNALISES = ['🚚', '📦', '🚛', '📮', '🏍️', '🚐', '🛻', '✈️', '🚀', '📬'];
const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'];

const GRATUITE_PAR_DEFAUT = {
  id: -1, transporteur_id: 14, nom: 'Livraison gratuite', logo: '🎁',
  mode_calcul: 'fixe', frais_fixes: 0, frais_par_kg: 0, gratuit_superieur: null, delais_estime: 'Variable selon le vendeur',
  combine_shipping: false, combine_frais_fixe_unique: true, combine_kg_additionne: true, frais_zones: null,
  frais_calcule: 0, detail_calcul: 'Livraison gratuite', gratuit_applique: false, non_disponible: false, gratuit: true, ramassage: false,
};

// Requête tolérante : si les tables/colonnes d'expédition n'existent pas encore, renvoie null.
// Dans une transaction (client), un SAVEPOINT évite que l'erreur n'annule toute la transaction.
async function tenter(db, sql, params) {
  const enTransaction = typeof db.release === 'function';
  try {
    if (enTransaction) await db.query('SAVEPOINT exp_tolerant');
    const r = await db.query(sql, params);
    if (enTransaction) await db.query('RELEASE SAVEPOINT exp_tolerant');
    return r;
  } catch (e) {
    if (enTransaction) { try { await db.query('ROLLBACK TO SAVEPOINT exp_tolerant'); } catch (e2) { /* ignoré */ } }
    return null;
  }
}

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const arrondi2 = (n) => Math.round(n * 100 + 1e-7) / 100;

// Livraison gratuite globale : seuil atteint (+ province concernée, ou toutes si aucune cochée)
function livraisonGratuiteGlobale(collab, sousTotal, province) {
  if (!collab || !collab.livraison_gratuite_globale_actif) return false;
  const seuil = num(collab.livraison_gratuite_globale_seuil);
  if (!(seuil > 0) || sousTotal < seuil) return false;
  const provs = Array.isArray(collab.livraison_gratuite_globale_provinces) ? collab.livraison_gratuite_globale_provinces : [];
  return provs.length === 0 || provs.includes(province);
}

// Algorithme e-Vend. articles : [{ methode_ids?, poids, quantite }]
function calculerFraisMethode(m, articles, sousTotal, province) {
  const mode = m.mode_calcul || 'fixe';
  const fixes = num(m.frais_fixes);
  const parKg = num(m.frais_par_kg);
  const seuil = m.gratuit_superieur ? num(m.gratuit_superieur) : null;
  const combine = m.combine_shipping || false;
  const fixeUnique = m.combine_frais_fixe_unique !== false;
  const kgAdditionne = m.combine_kg_additionne !== false;

  // Articles couverts par CETTE méthode (sinon, tous : même règle qu'e-Vend)
  const deLaMethode = articles.filter((a) => (a.methode_ids || []).includes(m.id));
  const actifs = deLaMethode.length > 0 ? deLaMethode : articles;
  const poidsTotal = actifs.reduce((s, a) => s + num(a.poids) * (parseInt(a.quantite, 10) || 1), 0);
  const poidsMax = actifs.length ? Math.max(...actifs.map((a) => num(a.poids))) : 0;

  if (seuil !== null && sousTotal >= seuil) {
    return { frais: 0, detail: `Livraison gratuite (commande ≥ ${seuil.toFixed(2)} $)`, gratuit_applique: true };
  }
  let frais = 0, detail = '';
  if (mode === 'fixe') {
    if (combine && fixeUnique) { frais = fixes; detail = `Frais fixe (combine shipping): ${fixes.toFixed(2)} $`; }
    else { frais = fixes * actifs.length; detail = `Frais fixe: ${fixes.toFixed(2)} $ × ${actifs.length} article(s) = ${frais.toFixed(2)} $`; }
  } else if (mode === 'kg') {
    if (combine && !kgAdditionne) { frais = poidsMax * parKg; detail = `Frais au kg (combine, poids max: ${poidsMax.toFixed(2)} kg): ${frais.toFixed(2)} $`; }
    else { frais = poidsTotal * parKg; detail = `Frais au kg: ${poidsTotal.toFixed(2)} kg × ${parKg.toFixed(2)} $/kg = ${frais.toFixed(2)} $`; }
  } else if (mode === 'fixe_kg') {
    const fixe = combine && fixeUnique ? fixes : fixes * actifs.length;
    const kg = combine && !kgAdditionne ? poidsMax * parKg : poidsTotal * parKg;
    frais = fixe + kg;
    detail = `Fixe: ${fixe.toFixed(2)} $ + Kg: ${kg.toFixed(2)} $ = ${frais.toFixed(2)} $`;
  } else if (mode === 'zone') {
    const zones = m.frais_zones || {};
    const prix = zones[province];
    if (prix === null || prix === 'non' || prix === undefined) {
      return { frais: null, detail: `N'expédie pas en ${province}`, gratuit_applique: false, non_disponible: true };
    }
    frais = num(prix);
    detail = `Frais zone ${province}: ${frais.toFixed(2)} $`;
  }
  return { frais: arrondi2(frais), detail, gratuit_applique: false };
}

function enrichir(m, articles, sousTotal, province) {
  const perso = IDS_PERSONNALISES.includes(m.transporteur_id);
  const t = perso
    ? { nom: m.nom_personnalise || 'Transporteur personnalisé', logo: m.logo_personnalise || '📦' }
    : (TRANSPORTEURS[m.transporteur_id] || { nom: 'Expédition', logo: '📦' });
  const c = articles ? calculerFraisMethode(m, articles, sousTotal, province) : { frais: num(m.frais_fixes), detail: '', gratuit_applique: false };
  return {
    id: m.id, transporteur_id: m.transporteur_id, nom: t.nom, logo: t.logo, personnalise: perso,
    mode_calcul: m.mode_calcul || 'fixe',
    frais_fixes: num(m.frais_fixes), frais_par_kg: num(m.frais_par_kg),
    gratuit_superieur: m.gratuit_superieur ? num(m.gratuit_superieur) : null,
    delais_estime: m.delais_estime || '',
    combine_shipping: m.combine_shipping || false,
    combine_frais_fixe_unique: m.combine_frais_fixe_unique !== false,
    combine_kg_additionne: m.combine_kg_additionne !== false,
    frais_zones: m.frais_zones || null,
    frais_calcule: c.frais, detail_calcul: c.detail, gratuit_applique: c.gratuit_applique || false,
    non_disponible: c.non_disponible || false,
    gratuit: c.frais === 0, ramassage: m.transporteur_id === 13,
  };
}

// Texte de prix pour la page produit (la province et le poids ne sont pas encore connus)
function libellePrix(m, devise) {
  const cfg = require('./studio_config_mv');
  const $ = (n) => cfg.montant(n, devise);
  const f = num(m.frais_fixes), k = num(m.frais_par_kg);
  if (m.mode_calcul === 'kg') return `${$(k)}/kg`;
  if (m.mode_calcul === 'fixe_kg') return `${$(f)} + ${$(k)}/kg`;
  if (m.mode_calcul === 'zone') {
    const v = Object.values(m.frais_zones || {}).filter((x) => x !== null && x !== 'non' && x !== undefined).map(num);
    if (!v.length) return 'Selon la province';
    const a = Math.min(...v), b = Math.max(...v);
    return a === b ? (a === 0 ? 'Gratuit' : $(a)) : `${$(a)} à ${$(b)}`;
  }
  return f === 0 ? 'Gratuit' : $(f);
}

// Méthodes actives choisies pour ces annonces (une seule requête)
async function methodesDesProduits(db, collaborateurId, produitIds) {
  if (!produitIds.length) return [];
  const r = await tenter(db,
    `SELECT vme.*, array_agg(DISTINCT pme.produit_id) AS produit_ids
       FROM collab_produit_methodes_expedition pme
       JOIN collab_methodes_expedition vme ON vme.id = pme.methode_id
      WHERE pme.produit_id = ANY($1::int[]) AND vme.actif = true AND vme.collaborateur_id = $2
      GROUP BY vme.id`, [produitIds, collaborateurId]);
  return r ? r.rows : null; // tables absentes : livraison gratuite
}

async function infosCollab(db, collaborateurId) {
  const r = await tenter(db,
    `SELECT livraison_gratuite_globale_actif, livraison_gratuite_globale_seuil, livraison_gratuite_globale_provinces
       FROM marketplace_collaborateurs WHERE id = $1`, [collaborateurId]);
  return (r && r.rows[0]) || null;
}

async function poidsDesProduits(db, produitIds) {
  const map = new Map();
  if (!produitIds.length) return map;
  const r = await tenter(db, 'SELECT id, poids FROM produits WHERE id = ANY($1::int[])', [produitIds]); // colonne absente : poids 0
  if (r) r.rows.forEach((x) => map.set(x.id, num(x.poids)));
  return map;
}

// Cœur : méthodes proposées à l'acheteur pour ce panier (physique seulement).
// lignes : [{ produit_id, quantite, produit_numerique? }] ; sousTotal : avant rabais (aperçu)
async function methodesPourPanier(db, { collaborateurId, lignes, sousTotal, province }) {
  const physiques = lignes.filter((l) => !l.produit_numerique);
  const ids = [...new Set(physiques.map((l) => parseInt(l.produit_id, 10)).filter(Boolean))];
  if (!ids.length) return { methodes: [], gratuite_globale: false, indisponible: false };
  const prov = PROVINCES.includes(province) ? province : 'QC';
  const [brutes, poids, collab] = await Promise.all([methodesDesProduits(db, collaborateurId, ids), poidsDesProduits(db, ids), infosCollab(db, collaborateurId)]);
  const articles = physiques.map((l) => ({ produit_id: parseInt(l.produit_id, 10), quantite: parseInt(l.quantite, 10) || 1, poids: poids.get(parseInt(l.produit_id, 10)) || 0 }));
  const gratuiteGlobale = livraisonGratuiteGlobale(collab, sousTotal, prov);

  if (!brutes || brutes.length === 0) { // aucune méthode configurée : livraison gratuite par défaut
    return { methodes: [{ ...GRATUITE_PAR_DEFAUT }], gratuite_globale: gratuiteGlobale, indisponible: false, brutes: [] };
  }
  const methodes = brutes.map((m) => {
    const arts = articles.map((a) => ({ ...a, methode_ids: m.produit_ids.includes(a.produit_id) ? [m.id] : [] }));
    const e = enrichir(m, arts, sousTotal, prov);
    if (gratuiteGlobale && !e.non_disponible) return { ...e, frais_calcule: 0, gratuit: true, gratuit_applique: true, detail_calcul: 'Livraison gratuite (seuil atteint)' };
    return e;
  });
  const dispo = methodes.filter((m) => !m.non_disponible).sort((a, b) => (a.frais_calcule || 0) - (b.frais_calcule || 0));
  // Le vendeur ne livre pas dans cette province : on ne retombe PAS sur une livraison gratuite
  return { methodes: dispo, gratuite_globale: gratuiteGlobale, indisponible: dispo.length === 0, brutes };
}

// Frais retenus pour le paiement. sousTotalNet : sous-total après rabais (sert au seuil « gratuit global »).
async function fraisPourPaiement(db, { collaborateurId, lignes, sousTotal, sousTotalNet, province, methodeId }) {
  const physiques = lignes.filter((l) => !l.produit_numerique);
  if (!physiques.length) return { frais: 0 };
  const prov = PROVINCES.includes(province) ? province : 'QC';
  const r = await methodesPourPanier(db, { collaborateurId, lignes, sousTotal, province: prov });
  if (r.indisponible) return { erreur: "Ce vendeur ne livre pas dans votre province." };
  const collab = await infosCollab(db, collaborateurId);
  if (livraisonGratuiteGlobale(collab, sousTotalNet ?? sousTotal, prov)) {
    // Un mode d'expédition doit quand même être choisi quand le vendeur en a configuré
    if (r.methodes.length && !(r.methodes.length === 1 && r.methodes[0].id === -1) && !r.methodes.find((m) => String(m.id) === String(methodeId))) return { erreur: "Choisissez un mode d'expédition." };
    return { frais: 0 };
  }
  if (r.methodes.length === 1 && r.methodes[0].id === -1) return { frais: 0 };
  const m = r.methodes.find((x) => String(x.id) === String(methodeId));
  if (!m) return { erreur: "Choisissez un mode d'expédition." };
  // Recalcul avec le sous-total NET pour le seuil « gratuit dès X $ » de la méthode
  const brute = (r.brutes || []).find((b) => b.id === m.id);
  if (brute) {
    const ids = [...new Set(physiques.map((l) => parseInt(l.produit_id, 10)).filter(Boolean))];
    const poids = await poidsDesProduits(db, ids);
    const arts = physiques.map((l) => ({ produit_id: parseInt(l.produit_id, 10), quantite: parseInt(l.quantite, 10) || 1, poids: poids.get(parseInt(l.produit_id, 10)) || 0 }))
      .map((a) => ({ ...a, methode_ids: brute.produit_ids.includes(a.produit_id) ? [brute.id] : [] }));
    const c = calculerFraisMethode(brute, arts, sousTotalNet ?? sousTotal, prov);
    if (c.non_disponible) return { erreur: "Ce mode d'expédition n'est pas offert dans votre province." };
    return { frais: c.frais };
  }
  return { frais: m.frais_calcule || 0 };
}

module.exports = {
  TRANSPORTEURS, IDS_PERSONNALISES, LOGOS_PERSONNALISES, PROVINCES, GRATUITE_PAR_DEFAUT,
  calculerFraisMethode, enrichir, libellePrix, livraisonGratuiteGlobale,
  methodesPourPanier, fraisPourPaiement, infosCollab,
};