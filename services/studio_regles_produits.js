// CHEMIN : services/studio_regles_produits.js
// e-Vend Studio — Règles des annonces fixées par le gestionnaire (Config marketplace → Config produits).
// Une seule façon de les lire et de les appliquer : création d'annonce, panier et paiement passent tous par ici.

const cfgMV = require('./studio_config_mv');

function deMV(mv) {
  const pos = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
  return {
    approbationAuto: cfgMV.actif(mv, 'approuver_auto_produit', true),        // false : une annonce publiée attend l'approbation du gestionnaire
    gererStock: cfgMV.actif(mv, 'gerer_inventaire_par_defaut', true),         // false : on ne gère plus le stock, les ventes continuent à 0
    prixZero: cfgMV.actif(mv, 'prix_zero_autorise', false),
    prixMin: pos(mv && mv.prix_minimum),
    qteMinActive: cfgMV.actif(mv, 'quantite_minimum_achat', false),
    qteMinMode: mv && mv.application_quantite_minimum === 'commande' ? 'commande' : 'produit',
    aide: cfgMV.actif(mv, 'texte_aide_formulaire', false) ? String((mv && mv.texte_aide_produit) || '').slice(0, 1000) : '',
    prixRevient: cfgMV.actif(mv, 'permettre_ajout_prix_revient', false),
    devise: cfgMV.deviseDe(mv),
  };
}

async function lire(gid, db) { return deMV(await cfgMV.lire(gid, db)); }

// Message d'erreur si le prix ne respecte pas les règles (null = OK). Le prix 0 n'est permis que si le gestionnaire l'autorise.
function erreurPrix(r, montant, nom) {
  const n = Number(montant);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return r.prixZero ? null : `${nom} : le prix doit être supérieur à 0 (les annonces gratuites ne sont pas permises sur cette marketplace).`;
  if (r.prixMin > 0 && n < r.prixMin) return `${nom} : le prix minimum est de ${cfgMV.montant(r.prixMin, r.devise)}.`;
  return null;
}

// Statut réel d'une annonce que le collaborateur demande de publier.
// ancien = statut actuel (une annonce déjà active qu'on modifie le reste).
function statutPublication(r, ancien, demande) {
  if (demande !== 'actif') return demande;
  if (r.approbationAuto || ancien === 'actif') return 'actif';
  return 'en_attente';
}

// lignes : [{ produit_id, titre, quantite, quantite_min, enchere_id? }] d'UNE commande (un seul collaborateur).
// Mode « produit » : chaque produit doit atteindre son minimum. Mode « commande » : le total d'articles doit atteindre le minimum du produit.
function verifierQuantitesMin(r, lignes) {
  if (!r.qteMinActive) return [];
  const produits = new Map();
  let total = 0;
  for (const l of lignes) {
    if (l.enchere_id) continue;
    const q = parseInt(l.quantite, 10) || 0;
    total += q;
    const cle = String(l.produit_id);
    const p = produits.get(cle) || { produit_id: l.produit_id, titre: l.titre, qte: 0, min: 0 };
    p.qte += q;
    p.min = Math.max(p.min, parseInt(l.quantite_min, 10) || 0);
    produits.set(cle, p);
  }
  const out = [];
  for (const p of produits.values()) {
    if (p.min < 2) continue;
    if (r.qteMinMode === 'produit' && p.qte < p.min) out.push({ produit_id: p.produit_id, message: `« ${p.titre} » : quantité minimum de ${p.min} (vous en avez ${p.qte}).` });
    if (r.qteMinMode === 'commande' && total < p.min) out.push({ produit_id: p.produit_id, message: `« ${p.titre} » exige au moins ${p.min} articles dans la commande (vous en avez ${total}).` });
  }
  return out;
}

module.exports = { deMV, lire, erreurPrix, statutPublication, verifierQuantitesMin };