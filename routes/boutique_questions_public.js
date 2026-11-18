// CHEMIN : routes/boutique_questions_public.js
// e-Vend Studio — Add-on « Questions sur le produit » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/questions
//   GET /:gid/produit/:produitId?page=   → { actif, total, page, pages, questions[], peut_poser, mes_en_attente[] }  (questions publiées seulement)
// Aucune connexion exigée (un acheteur connecté reçoit en plus peut_poser et ses questions en attente). { actif:false } si l'add-on ou l'interrupteur du gestionnaire est coupé.

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const Q = require('../services/boutique_questions');

const router = express.Router();
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

const m = new Map();
const limite = (req, res, next) => {
  const k = 'ip:' + req.ip, n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > 300000) { m.set(k, { debut: n, n: 1 }); if (m.size > 5000) for (const [kk, v] of m) if (n - v.debut > 300000) m.delete(kk); return next(); }
  if (c.n >= 600) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
  c.n++; next();
};

function acheteurConnecte(req, gid) {
  const cookie = req.cookies && req.cookies[`mv_token_${gid}`];
  const a = req.headers.authorization;
  const token = cookie || (a && a.startsWith('Bearer ') ? a.slice(7) : null);
  if (!token) return null;
  try { const p = jwt.verify(token, process.env.JWT_SECRET); return p.gestionnaireId === gid && p.type === 'acheteur' ? p.id : null; } catch (e) { return null; }
}

router.get('/:gid/produit/:produitId', limite, async (req, res) => {
  try {
    const gid = entier(req.params.gid), pid = entier(req.params.produitId);
    if (!gid || !pid) return res.json({ actif: false });
    res.json(await Q.infoProduit(gid, pid, acheteurConnecte(req, gid), req.query.page));
  } catch (e) {
    console.error('[boutique_questions_public]', e && e.message ? e.message : e);
    res.json({ actif: false });
  }
});

module.exports = router;