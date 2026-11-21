// CHEMIN : routes/boutique_perso_public.js
// e-Vend Studio — Add-on « Produits personnalisés » (boutique solo), partie PUBLIQUE. Monté par routes/boutique_index.js sur /api/boutique/perso
//   GET /:gid/produit/:pid → champs et faces de l'aperçu (404 si l'add-on est inactif ou si le produit n'est pas personnalisable)

'use strict';

const express = require('express');
const svc = require('../services/boutique_perso');

const router = express.Router();
router.get('/:gid/produit/:pid', async (req, res) => {
  try {
    const gid = parseInt(req.params.gid, 10), pid = parseInt(req.params.pid, 10);
    if (!(gid > 0) || !(pid > 0)) return res.status(404).json({ error: 'Introuvable' });
    const c = await svc.configPublique(gid, pid);
    if (!c) return res.status(404).json({ error: 'Introuvable' });
    res.json(c);
  } catch (e) { console.error('[boutique_perso_public]', e && e.message); res.status(500).json({ error: 'Erreur serveur' }); }
});
module.exports = router;