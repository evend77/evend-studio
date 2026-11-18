// CHEMIN : routes/boutique_chatbot_public.js
// e-Vend Studio — Add-on « Chatbot » (boutique solo), partie PUBLIQUE (le widget du site). Monté par routes/boutique_index.js sur /api/boutique/chatbot
//   GET  /:gid/config   → { config }  404 si l'add-on n'est pas activé ou si le gestionnaire n'a pas allumé le chatbot
//   POST /:gid/ask      { question, session_id }  → { reponse, menu_choix?, pages?[{ titre, pageTitre, nav, type }], lien?, suggestions?, found }
// Anti-abus : au plus 12 questions par minute et 150 par jour par visiteur (adresse IP) et par boutique.

'use strict';

const express = require('express');
const { ErreurBoutique } = require('../services/boutique_limites');
const C = require('../services/boutique_chatbot');

const router = express.Router();
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

const m = new Map();
function compte(k, max, fenetreMs) {
  const n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > fenetreMs) { m.set(k, { debut: n, n: 1 }); if (m.size > 20000) for (const [kk, v] of m) if (n - v.debut > 86400000) m.delete(kk); return true; }
  if (c.n >= max) return false;
  c.n++; return true;
}
const h = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (e) {
    if (e instanceof ErreurBoutique) return res.status(e.status).json({ error: e.message });
    console.error('[boutique_chatbot_public]', req.method, req.path, e && e.message ? e.message : e);
    res.status(500).json({ reponse: null, error: 'Une erreur est survenue. Veuillez réessayer plus tard.' });
  }
};

router.get('/:gid/config', h(async (req, res) => {
  const gid = entier(req.params.gid);
  if (!gid) return res.status(400).json({ error: 'Boutique invalide.' });
  if (!compte(`cfg:${req.ip}`, 300, 300000)) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
  const config = await C.configPublique(gid);
  if (!config) return res.status(404).json({ error: 'Chatbot désactivé ou non configuré' });
  res.json({ config });
}));

router.post('/:gid/ask', h(async (req, res) => {
  const gid = entier(req.params.gid);
  if (!gid) return res.status(400).json({ reponse: null, error: 'Boutique invalide.' });
  const cle = `${gid}:${req.ip}`;
  if (!compte(`min:${cle}`, 12, 60000) || !compte(`jour:${cle}`, 150, 86400000)) return res.status(429).json({ reponse: null, error: 'Vous posez beaucoup de questions. Réessayez dans un instant.' });
  const b = req.body || {};
  if (typeof b.question !== 'string') return res.json({ reponse: null, error: 'Posez-moi une question sur cette boutique.' });
  res.json(await C.repondre(gid, b.question, typeof b.session_id === 'string' ? b.session_id : null, req.ip, req.headers['user-agent']));
}));

module.exports = router;