// CHEMIN : services/studio_regles_commande.js
// e-Vend Studio — Règles de l'onglet « Commande » de Configuration marketplace (sites.config.multivendeur).
// Une seule lecture, valeurs par défaut identiques à celles de l'interface (StudioConfigMultivendeur.tsx).
'use strict';

const cfgMV = require('./studio_config_mv');

const POURBOIRES = ['vendeurs', 'admin', 'split50', 'desactive'];

function deMV(mv) {
  mv = mv || {};
  const dateActive = cfgMV.actif(mv, 'permettre_date_livraison_prevue', false);
  const jr = parseInt(mv.jours_remboursement, 10);
  const ja = mv.jours_delai_avis === undefined || mv.jours_delai_avis === null || mv.jours_delai_avis === '' ? 90 : parseInt(mv.jours_delai_avis, 10);
  return {
    modeExpedition: cfgMV.actif(mv, 'mode_expedition_obligatoire', false),
    suiviObligatoire: cfgMV.actif(mv, 'numero_suivi_obligatoire', false),
    dateActive,
    dateObligatoire: dateActive && cfgMV.actif(mv, 'date_livraison_obligatoire', false),
    mailExpedition: cfgMV.actif(mv, 'envoyer_mail_expedition', true),
    accepter: cfgMV.actif(mv, 'permettre_accepter_commande', true),
    annulerAcceptee: cfgMV.actif(mv, 'permettre_annuler_commande_acceptee', false),
    accepterExpedier: cfgMV.actif(mv, 'accepter_et_expedier', false),
    joursRemboursement: Number.isFinite(jr) && jr >= 0 ? Math.min(jr, 3650) : 14,   // 0 = sans limite
    joursAvis: Number.isFinite(ja) && ja >= 0 ? Math.min(ja, 3650) : 90,   // délai pour laisser un avis après la livraison, 0 = sans limite
    pourboire: POURBOIRES.includes(mv.gestion_pourboire) ? mv.gestion_pourboire : 'vendeurs',
    taxesIncluses: cfgMV.actif(mv, 'taxes_incluses_prix', false),
  };
}

async function lire(gid, db) { return deMV(await cfgMV.lire(gid, db)); }

// Le collaborateur peut-il refuser (donc rembourser en entier) cette commande payée ?
//  • pas encore acceptée (en_attente) : toujours ;
//  • acceptée (confirmee) : seulement si « Annuler commande acceptée » est permis — sauf si l'acceptation est désactivée
//    (alors toute commande payée est « confirmée » d'office et reste refusable).
function peutRefuser(r, statut, payee) {
  if (!payee) return false;
  if (statut === 'en_attente') return true;
  if (statut === 'confirmee') return r.annulerAcceptee || !r.accepter;
  return false;
}

// Statut d'une commande à la fin du paiement
const statutApresPaiement = (r) => (r.accepter ? 'en_attente' : 'confirmee');

// Date de livraison d'une commande : la dernière fois qu'elle est passée « livrée » (collaborateur ou confirmation de l'acheteur),
// sinon la date de réception enregistrée. null si on ne la connaît pas.
const SQL_LIVREE_LE = `COALESCE((SELECT MAX(h.created_at) FROM commande_historique h WHERE h.commande_id = c.id AND h.evenement = 'statut_livree'), c.recu_le)`;

// Le délai pour laisser un avis est-il dépassé ? (livreeLe = date de livraison)
function avisExpire(r, livreeLe, maintenant) {
  if (!r.joursAvis || !livreeLe) return false;
  return (maintenant || Date.now()) > new Date(livreeLe).getTime() + r.joursAvis * 86400000;
}

module.exports = { POURBOIRES, SQL_LIVREE_LE, deMV, lire, peutRefuser, statutApresPaiement, avisExpire };