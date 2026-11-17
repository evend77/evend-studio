// CHEMIN : routes/boutique_effets_public.js
// e-Vend Studio — Add-on « Effets de boutique » (templates boutique solo), partie publique (lue par le site).
// Monté par routes/boutique_index.js sur /api/boutique/effets
//   GET /:gid  → effets + musique à dessiner sur la boutique ({ actif:false } si l'add-on n'est pas activé ou si rien n'est choisi)
// Aucune connexion requise. Ne révèle que ce qui est dessiné sur le site.

'use strict';

const express = require('express');
const E = require('../services/boutique_effets');

const router = express.Router();

// Petit cache en mémoire (20 s) pour ne pas interroger la base à chaque page vue ; vidé à chaque enregistrement.
// Aucun cache côté navigateur : les changements du gestionnaire apparaissent tout de suite.
const memoire = new Map();
router.vider = (gid) => { if (gid) memoire.delete(gid); else memoire.clear(); };
setInterval(() => memoire.clear(), 10 * 60 * 1000).unref();

router.get('/:gid', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const gid = parseInt(req.params.gid, 10);
    if (!Number.isInteger(gid) || gid <= 0) return res.json({ actif: false });
    const m = memoire.get(gid);
    if (m && Date.now() - m.t < 20000) return res.json(m.d);
    let d = { actif: false };
    if (await E.actif(gid)) {
      const c = await E.lire(gid);
      const rien = !c.saison && !c.venteEffets.length && !c.musiqueUrl;
      d = { actif: !rien, saison: c.saison, effets: c.effets, effetsConfig: c.effetsConfig,
        venteEffets: c.venteEffets, venteEffetsConfig: c.venteEffetsConfig, musiqueUrl: c.musiqueUrl, musiqueConfig: c.musiqueConfig };
    }
    if (memoire.size > 500) memoire.clear();
    memoire.set(gid, { t: Date.now(), d });
    res.json(d);
  } catch (e) {
    console.error('[boutique_effets_public]', e && e.message ? e.message : e);
    res.json({ actif: false });
  }
});

module.exports = router;