// CHEMIN : routes/cron_rappels_expedition.js
// e-Vend Studio — Rappel d'expédition automatique (Configuration marketplace → Commande).
// Chaque heure : pour les gestionnaires qui ont activé « Rappel d'expédition automatique », les commandes PAYÉES
// non expédiées (en_attente / confirmee) depuis au moins « jours_avant_rappel » jours et au plus « jours_max_rappel » jours
// donnent lieu à UN message par collaborateur (messagerie + courriel si SMTP actif), au plus un rappel par commande par ~23 h.
// Les commandes avec un remboursement ouvert (en_attente / en_cours) sont ignorées.
'use strict';

const pool = require('../db');
const cfgMV = require('../services/studio_config_mv');
const notif = require('../services/studio_notif_collab');

const entier = (v, d, min, max) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };

async function lienDashboard(gid) {
  try {
    const s = (await pool.query(`SELECT slug, domaine_custom FROM sites WHERE gestionnaire_id=$1 LIMIT 1`, [gid])).rows[0];
    const d = s && (s.domaine_custom || (s.slug ? `${s.slug}.e-vendstudio.ca` : ''));
    return d ? `https://${d}/?page=dashboard-collaborateur` : '';
  } catch (e) { return ''; }
}

async function pourGestionnaire(gid, mv) {
  const avant = entier(mv.jours_avant_rappel, 2, 1, 365);
  const max = Math.max(avant, entier(mv.jours_max_rappel, 30, 1, 365));
  const r = await pool.query(
    `SELECT c.id, c.collaborateur_id, c.numero_commande, c.paye_le
       FROM marketplace_commandes c
      WHERE c.gestionnaire_id = $1 AND c.statut_paiement = 'paye' AND c.statut IN ('en_attente','confirmee')
        AND c.paye_le IS NOT NULL
        AND c.paye_le <= NOW() - ($2::int * INTERVAL '1 day')
        AND c.paye_le >  NOW() - (($3::int + 1) * INTERVAL '1 day')
        AND (c.dernier_rappel_expedition IS NULL OR c.dernier_rappel_expedition <= NOW() - INTERVAL '23 hours')
        AND NOT EXISTS (SELECT 1 FROM commande_remboursements r WHERE r.commande_id = c.id AND r.statut IN ('en_attente','en_cours'))
      ORDER BY c.collaborateur_id, c.paye_le`,
    [gid, avant, max]);
  if (!r.rows.length) return 0;
  const parCollab = new Map();
  for (const c of r.rows) { if (!parCollab.has(c.collaborateur_id)) parCollab.set(c.collaborateur_id, []); parCollab.get(c.collaborateur_id).push(c); }
  const lien = await lienDashboard(gid);
  let n = 0;
  for (const [collabId, cmds] of parCollab) {
    const lignes = cmds.map((c) => {
      const jours = Math.max(0, Math.floor((Date.now() - new Date(c.paye_le).getTime()) / 86400000));
      return `• ${c.numero_commande} — payée il y a ${jours} jour${jours > 1 ? 's' : ''}`;
    }).join('\n');
    const texte = `Rappel d'expédition : ${cmds.length} commande${cmds.length > 1 ? 's' : ''} payée${cmds.length > 1 ? 's' : ''} attend${cmds.length > 1 ? 'ent' : ''} encore d'être expédiée${cmds.length > 1 ? 's' : ''}.\n${lignes}`;
    const res = await notif.notifier({
      gid, collabId, texte,
      courriel: { cle: 'commande_rappel_expedition', variables: { liste_commandes: lignes.replace(/\n/g, '<br>'), nb_commandes: String(cmds.length), lien_dashboard: lien } },
    });
    if (res.messagerie || res.courriel) {
      await pool.query(`UPDATE marketplace_commandes SET dernier_rappel_expedition = NOW() WHERE id = ANY($1::int[])`, [cmds.map((c) => c.id)]);
      n += cmds.length;
    }
  }
  return n;
}

async function executer() {
  let total = 0;
  try {
    const g = await pool.query(`SELECT gestionnaire_id, config->'multivendeur' AS mv FROM sites WHERE config->'multivendeur'->>'rappel_expedition_auto' = 'true'`);
    for (const row of g.rows) {
      try { total += await pourGestionnaire(row.gestionnaire_id, row.mv || {}); }
      catch (e) { console.error('[cron_rappels_expedition] gestionnaire', row.gestionnaire_id, e.message); }
    }
  } catch (e) { console.error('[cron_rappels_expedition]', e.message); }
  return total;
}

let timer = null;
function demarrer() {
  if (timer) return;
  timer = setInterval(executer, 60 * 60 * 1000);
  if (timer.unref) timer.unref();
  const t0 = setTimeout(executer, 90 * 1000); if (t0.unref) t0.unref();
}

module.exports = { demarrer, executer, pourGestionnaire };