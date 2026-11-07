// CHEMIN : services/studio_avis.js
// e-Vend Studio — Règles des avis clients (Configuration marketplace → Config vendeur → Gestion des avis).
//   • approbationAuto  : un nouvel avis est-il publié tout de suite ou attend-il une approbation ?
//   • collabPeutChoisir: le collaborateur a-t-il le droit de régler l'auto-approbation de sa boutique ?
//   • notifierNouvelAvis: avertit le collaborateur (messagerie + courriel) quand un avis est PUBLIÉ, sauf s'il a coupé « Nouvel avis ».
'use strict';

const cfgMV = require('./studio_config_mv');

// 1) « Approuver automatiquement les avis » activé (défaut) → publié tout de suite.
// 2) Sinon, si « Auto-approbation gérable par collaborateur » est permis ET que ce collaborateur l'a activée pour sa boutique → publié.
// 3) Sinon → en attente de l'approbation du gestionnaire.
async function approbationAuto(gid, collabId, db) {
  const mv = await cfgMV.lire(gid, db);
  if (cfgMV.actif(mv, 'approuver_auto_avis', true)) return true;
  if (!cfgMV.actif(mv, 'permettre_gestion_auto_approbation_avis', false)) return false;
  const r = await db.query('SELECT avis_auto_approbation FROM collaborateur_config WHERE collaborateur_id=$1 AND gestionnaire_id=$2', [collabId, gid]);
  return !!(r.rows[0] && r.rows[0].avis_auto_approbation);
}

// Ce que le collaborateur voit dans sa Configuration
async function reglagesCollab(gid, db) {
  const mv = await cfgMV.lire(gid, db);
  const global = cfgMV.actif(mv, 'approuver_auto_avis', true);
  return { global, permis: !global && cfgMV.actif(mv, 'permettre_gestion_auto_approbation_avis', false) };
}

const etoiles = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

async function lienDashboard(gid, db) {
  try {
    const s = (await db.query(`SELECT slug, domaine_custom FROM sites WHERE gestionnaire_id=$1 LIMIT 1`, [gid])).rows[0];
    const d = s && (s.domaine_custom || (s.slug ? `${s.slug}.e-vendstudio.ca` : ''));
    return d ? `https://${d}/?page=dashboard-collaborateur` : '';
  } catch (e) { return ''; }
}

// avisId : un avis déjà publié. Ne lance jamais d'erreur.
async function notifierNouvelAvis(gid, avisId, db) {
  try {
    const a = (await db.query(
      `SELECT v.collaborateur_id, v.note, v.titre, v.commentaire, c.numero_commande,
              COALESCE(a.prenom, '') AS prenom, LEFT(COALESCE(a.nom, ''), 1) AS initiale
         FROM avis_collaborateur v
         LEFT JOIN marketplace_acheteurs a ON a.id = v.acheteur_id
         LEFT JOIN marketplace_commandes c ON c.id = v.commande_id
        WHERE v.id = $1 AND v.gestionnaire_id = $2 AND v.approuve = true`, [avisId, gid])).rows[0];
    if (!a) return { messagerie: false, courriel: false };
    const cfg = (await db.query('SELECT notif_avis FROM collaborateur_config WHERE collaborateur_id=$1 AND gestionnaire_id=$2', [a.collaborateur_id, gid])).rows[0];
    if (cfg && cfg.notif_avis === false) return { messagerie: false, courriel: false };
    const client = (a.prenom + (a.initiale ? ' ' + a.initiale + '.' : '')).trim() || 'Un client';
    const extrait = [a.titre, a.commentaire].filter(Boolean).join(' — ').slice(0, 300);
    const texte = `⭐ Nouvel avis : ${etoiles(a.note)} (${a.note}/5) de ${client}${a.numero_commande ? ` sur la commande ${a.numero_commande}` : ''}.` + (extrait ? `\n« ${extrait} »` : '');
    return await require('./studio_notif_collab').notifier({
      gid, collabId: a.collaborateur_id, texte,
      courriel: { cle: 'avis_nouveau', variables: { note: `${a.note} / 5`, etoiles: etoiles(a.note), nom_client: client, numero_commande: a.numero_commande || '', extrait_avis: extrait || '(aucun commentaire)', lien_dashboard: await lienDashboard(gid, db) } },
    });
  } catch (e) { console.error('[studio_avis] notification :', e.message); return { messagerie: false, courriel: false }; }
}

module.exports = { approbationAuto, reglagesCollab, notifierNouvelAvis };