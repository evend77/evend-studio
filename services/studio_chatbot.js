// CHEMIN : services/studio_chatbot.js
// e-Vend Studio — Add-on « Chatbot » (sans IA) : qui a le droit de l'utiliser.
//  • Site Multi-vendeur Premium : l'add-on doit être actif (inclus au forfait OU activé dans « Mes services »),
//    même règle que tous les autres add-ons (services/studio_addons.js).
//  • Tous les autres templates : comportement d'origine, rien n'est bloqué ici (le menu est déjà géré par options_gestionnaire.chatbot).
// Petit cache de 5 s : le chatbot public est appelé à chaque question d'un visiteur.

'use strict';

const pool = require('../db');
const addons = require('./studio_addons');

const TTL_MS = 5000;
const cache = new Map();

/** { mv: true|false, autorise: true|false } pour ce gestionnaire. */
async function etat(gid) {
  const id = parseInt(gid, 10);
  if (!Number.isInteger(id) || id <= 0) return { mv: false, autorise: false };
  const hit = cache.get(id);
  if (hit && Date.now() - hit.t < TTL_MS) return hit.v;
  const r = await pool.query(
    'SELECT 1 FROM sites WHERE gestionnaire_id = $1 AND template_id = ANY($2::text[]) LIMIT 1',
    [id, addons.SITE_TEMPLATES_MV]
  );
  const mv = r.rowCount > 0;
  const v = mv ? { mv: true, autorise: await addons.addonActif(id, 'chatbot') } : { mv: false, autorise: true };
  cache.set(id, { t: Date.now(), v });
  if (cache.size > 2000) cache.clear();
  return v;
}

module.exports = { etat };