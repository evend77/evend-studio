// CHEMIN : services/studio_notif_collab.js
// e-Vend Studio — Notification automatique à un collaborateur : un message chiffré dans la messagerie
// (conversation « Notifications automatiques », créée au besoin) + un courriel si le SMTP du gestionnaire est actif.
'use strict';

const pool = require('../db');
const { chiffrer } = require('../src/utils/chiffrement');

const SUJET = 'Notifications automatiques';

async function messagerie(gid, collabId, texte) {
  const ex = await pool.query(
    `SELECT id FROM chat_gestionnaire_collab WHERE gestionnaire_id=$1 AND collaborateur_id=$2 AND sujet=$3 AND statut='actif' ORDER BY id LIMIT 1`,
    [gid, collabId, SUJET]);
  let chatId = ex.rows[0] && ex.rows[0].id;
  if (!chatId) {
    chatId = (await pool.query(
      `INSERT INTO chat_gestionnaire_collab (gestionnaire_id, collaborateur_id, sujet) VALUES ($1,$2,$3) RETURNING id`,
      [gid, collabId, SUJET])).rows[0].id;
  }
  await pool.query(
    `INSERT INTO chat_gestionnaire_collab_msg (chat_id, expediteur_role, expediteur_id, contenu) VALUES ($1,'gestionnaire',$2,$3)`,
    [chatId, gid, chiffrer(texte)]);
  await pool.query(`UPDATE chat_gestionnaire_collab SET updated_at=NOW() WHERE id=$1`, [chatId]);
  return chatId;
}

// Retourne { messagerie: bool, courriel: bool }. Ne lance jamais d'erreur.
async function notifier({ gid, collabId, texte, courriel }) {
  const res = { messagerie: false, courriel: false };
  try { await messagerie(gid, collabId, texte); res.messagerie = true; }
  catch (e) { console.error('[notif_collab] messagerie :', e.message); }
  if (courriel) {
    try {
      const c = (await pool.query('SELECT email, nom_responsable FROM marketplace_collaborateurs WHERE id=$1 AND gestionnaire_id=$2', [collabId, gid])).rows[0];
      if (c && c.email) {
        const r = await require('./studio_courriels').envoyerCourriel({
          gestionnaireId: gid, cle: courriel.cle, a: c.email,
          variables: { prenom_collaborateur: c.nom_responsable || '', ...courriel.variables },
        });
        res.courriel = !!r.envoye;
      }
    } catch (e) { console.error('[notif_collab] courriel :', e.message); }
  }
  return res;
}

module.exports = { notifier, SUJET };