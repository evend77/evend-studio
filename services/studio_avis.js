// CHEMIN : services/studio_avis.js
// e-Vend Studio — Règles des avis clients (Configuration marketplace → Config vendeur → Gestion des avis).
//   • decision         : un nouvel avis est-il publié tout de suite, ou qui doit l'approuver ?
//   • collabPeutChoisir: le collaborateur a-t-il le droit de régler l'auto-approbation de sa boutique ?
//   • notifierNouvelAvis: avertit le collaborateur (messagerie + courriel) quand un avis est PUBLIÉ, sauf s'il a coupé « Nouvel avis ».
'use strict';

const cfgMV = require('./studio_config_mv');
const studioAddons = require('./studio_addons');

// Le système d'avis est-il ACTIF pour ce gestionnaire ?
//  = add-on « Avis clients » actif (inclus au forfait ou acheté)  ET  réglage marketplace « Avis clients » non coupé.
// Aucun avis n'est supprimé quand c'est inactif : ils sont simplement cachés / bloqués.
async function actifs(gid, db, mvCfg) {
  const d = db || require('../db');
  if (!(await studioAddons.addonActifRapide(gid, 'avis_clients', d))) return false;
  const mv = mvCfg || await cfgMV.lire(gid, d);
  return cfgMV.actif(mv, 'avis_actifs', true);
}
// Seulement l'add-on (sans le réglage marketplace) — pour les écrans qui doivent distinguer « non activé » de « désactivé ».
const addonActif = (gid, db) => studioAddons.addonActifRapide(gid, 'avis_clients', db || require('../db'));

// Que devient un nouvel avis ?
//  1) « Approuver automatiquement les avis » activé (défaut) → publié tout de suite.
//  2) Sinon, si « Auto-approbation gérable par collaborateur » est permis, le collaborateur choisit pour sa boutique :
//       'auto' → publié tout de suite · 'moi' → il l'approuve lui-même · 'gestionnaire' (défaut) → le gestionnaire l'approuve.
//  3) Sinon → en attente de l'approbation du gestionnaire.
// Retourne { publie, approbateur } (approbateur : null si publié, sinon 'gestionnaire' | 'collaborateur').
async function decision(gid, collabId, db) {
  const mv = await cfgMV.lire(gid, db);
  if (cfgMV.actif(mv, 'approuver_auto_avis', true)) return { publie: true, approbateur: null };
  if (!cfgMV.actif(mv, 'permettre_gestion_auto_approbation_avis', false)) return { publie: false, approbateur: 'gestionnaire' };
  const r = await db.query('SELECT avis_mode FROM collaborateur_config WHERE collaborateur_id=$1 AND gestionnaire_id=$2', [collabId, gid]);
  const mode = r.rows[0] && r.rows[0].avis_mode;
  if (mode === 'auto') return { publie: true, approbateur: null };
  if (mode === 'moi') return { publie: false, approbateur: 'collaborateur' };
  return { publie: false, approbateur: 'gestionnaire' };
}

// Option « Avis détaillés » (critères délai / communication / emballage + photos). Désactivée par défaut : boutique simple = étoiles seulement.
const detailles = (mv) => cfgMV.actif(mv, 'avis_detailles', false);

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

// Un avis attend l'approbation du collaborateur (mode « je les approuve moi-même »). Ne lance jamais d'erreur.
async function notifierAvisAApprouver(gid, avisId, db) {
  try {
    const a = (await db.query(
      `SELECT v.collaborateur_id, v.note, v.titre, v.commentaire, c.numero_commande,
              COALESCE(a.prenom, '') AS prenom, LEFT(COALESCE(a.nom, ''), 1) AS initiale
         FROM avis_collaborateur v
         LEFT JOIN marketplace_acheteurs a ON a.id = v.acheteur_id
         LEFT JOIN marketplace_commandes c ON c.id = v.commande_id
        WHERE v.id = $1 AND v.gestionnaire_id = $2 AND v.approuve = false AND v.masque_le IS NULL AND v.approbateur = 'collaborateur'`, [avisId, gid])).rows[0];
    if (!a) return { messagerie: false, courriel: false };
    const cfg = (await db.query('SELECT notif_avis FROM collaborateur_config WHERE collaborateur_id=$1 AND gestionnaire_id=$2', [a.collaborateur_id, gid])).rows[0];
    if (cfg && cfg.notif_avis === false) return { messagerie: false, courriel: false };
    const client = (a.prenom + (a.initiale ? ' ' + a.initiale + '.' : '')).trim() || 'Un client';
    const extrait = [a.titre, a.commentaire].filter(Boolean).join(' — ').slice(0, 300);
    const texte = `⏳ Un avis attend votre approbation : ${etoiles(a.note)} (${a.note}/5) de ${client}${a.numero_commande ? ` sur la commande ${a.numero_commande}` : ''}.` + (extrait ? `\n« ${extrait} »` : '') + '\nOuvrez « Mes avis clients » pour l\'approuver ou le refuser.';
    return await require('./studio_notif_collab').notifier({
      gid, collabId: a.collaborateur_id, texte,
      courriel: { cle: 'avis_a_approuver', variables: { note: `${a.note} / 5`, etoiles: etoiles(a.note), nom_client: client, numero_commande: a.numero_commande || '', extrait_avis: extrait || '(aucun commentaire)', lien_dashboard: await lienDashboard(gid, db) } },
    });
  } catch (e) { console.error('[studio_avis] notification à approuver :', e.message); return { messagerie: false, courriel: false }; }
}

// Un avis attend l'approbation du GESTIONNAIRE : courriel à l'adresse de son compte (si le SMTP est configuré).
// En plus de la pastille du menu. Ne lance jamais d'erreur.
async function notifierGestionnaire(gid, avisId, db) {
  try {
    const a = (await db.query(
      `SELECT v.note, v.titre, v.commentaire, c.numero_commande, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS boutique,
              COALESCE(a.prenom, '') AS prenom, LEFT(COALESCE(a.nom, ''), 1) AS initiale
         FROM avis_collaborateur v
         LEFT JOIN marketplace_acheteurs a ON a.id = v.acheteur_id
         LEFT JOIN marketplace_commandes c ON c.id = v.commande_id
         LEFT JOIN marketplace_collaborateurs mc ON mc.id = v.collaborateur_id
        WHERE v.id = $1 AND v.gestionnaire_id = $2 AND v.approuve = false AND v.masque_le IS NULL AND v.approbateur = 'gestionnaire'`, [avisId, gid])).rows[0];
    if (!a) return { envoye: false };
    const g = (await db.query('SELECT email, nom FROM gestionnaires WHERE id = $1', [gid])).rows[0];
    if (!g || !g.email) return { envoye: false };
    const client = (a.prenom + (a.initiale ? ' ' + a.initiale + '.' : '')).trim() || 'Un client';
    const extrait = [a.titre, a.commentaire].filter(Boolean).join(' — ').slice(0, 300);
    return await require('./studio_courriels').envoyerCourriel({
      gestionnaireId: gid, cle: 'avis_a_approuver_gestionnaire', a: g.email,
      variables: { nom_collaborateur: a.boutique || 'Une boutique', note: `${a.note} / 5`, etoiles: etoiles(a.note), nom_client: client, numero_commande: a.numero_commande || '', extrait_avis: extrait || '(aucun commentaire)' },
    });
  } catch (e) { console.error('[studio_avis] notification gestionnaire :', e.message); return { envoye: false }; }
}

module.exports = { actifs, addonActif, detailles, decision, reglagesCollab, notifierNouvelAvis, notifierAvisAApprouver, notifierGestionnaire };