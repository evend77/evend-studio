// CHEMIN : routes/boutique_parution_public.js
// e-Vend Studio — Add-on « Parution future » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/parution
//   GET /:gid/config  → { config }   404 si l'add-on « parution_future » n'est pas activé

'use strict';

const express = require('express');
const P = require('../services/boutique_parution');

const router = express.Router();
const entier = (v) => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null; };

const m = new Map();
function compte(k, max, fenetreMs) {
  const n = Date.now(), c = m.get(k);
  if (!c || n - c.debut > fenetreMs) { m.set(k, { debut: n, n: 1 }); if (m.size > 20000) for (const [kk, v] of m) if (n - v.debut > fenetreMs) m.delete(kk); return true; }
  if (c.n >= max) return false;
  c.n++; return true;
}

router.get('/:gid/config', async (req, res) => {
  try {
    const gid = entier(req.params.gid);
    if (!gid) return res.status(400).json({ error: 'Boutique invalide.' });
    if (!compte(`par:${req.ip}`, 300, 300000)) return res.status(429).json({ error: 'Trop de demandes, réessayez dans un instant.' });
    const config = await P.configPublique(gid);
    if (!config) return res.status(404).json({ error: 'Option non activée' });
    res.json({ config });
  } catch (e) {
    console.error('[boutique_parution_public]', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;