// CHEMIN : routes/boutique_catalogue.js
// e-Vend Studio — Catalogue PUBLIC d'une boutique solo (templates boutique). Monté par routes/boutique_index.js sur :
//   GET /api/boutique/catalogue/:gid        (aucune connexion requise)
// Retourne les annonces ACTIVES du gestionnaire (table produits, collaborateur_id VIDE) — jamais celles du MV, jamais les brouillons.

'use strict';

const express = require('express');
const pool = require('../db');
const router = express.Router({ mergeParams: true });

router.get('/:gid', async (req, res) => {
  try {
    const gid = parseInt(req.params.gid, 10);
    if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ message: 'Boutique introuvable' });
    const s = await pool.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
    if (!s.rows.length || !String(s.rows[0].template_id || '').startsWith('boutique-')) return res.status(404).json({ message: "Cette boutique n'est pas disponible." });
    const l = parseInt(req.query.limit, 10);
    const limite = Number.isInteger(l) && l > 0 ? Math.min(l, 200) : 100;
    const o = parseInt(req.query.offset, 10);
    const decalage = Number.isInteger(o) && o > 0 && o < 1000000 ? o : 0;
    const r = await pool.query(
      `SELECT id, titre, description, prix, prix_promo, stock, sku, categorie, photo_principale, photos, variantes, created_at
         FROM produits
        WHERE gestionnaire_id = $1 AND collaborateur_id IS NULL AND statut = 'actif'
          AND (date_parution IS NULL OR date_parution <= NOW()) AND (date_expiration IS NULL OR date_expiration > NOW())
        ORDER BY created_at DESC, id DESC LIMIT ${limite} OFFSET ${decalage}`, [gid]);
    // NUMERIC revient en texte depuis Postgres : le template attend des nombres
    res.json({ produits: r.rows.map((x) => ({ ...x, prix: Number(x.prix), prix_promo: x.prix_promo === null ? null : Number(x.prix_promo) })) });
  } catch (err) {
    console.error('Erreur catalogue boutique:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;