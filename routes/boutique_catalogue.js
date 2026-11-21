// CHEMIN : routes/boutique_catalogue.js
// e-Vend Studio — Catalogue PUBLIC d'une boutique solo (templates boutique). Monté par routes/boutique_index.js sur :
//   GET /api/boutique/catalogue/:gid        (aucune connexion requise)
//   GET /api/boutique/catalogue/:gid/addons (add-ons activés, aucune connexion requise)
// Retourne les annonces ACTIVES du gestionnaire (table produits, collaborateur_id VIDE) — jamais celles du MV, jamais les brouillons.

'use strict';

const express = require('express');
const pool = require('../db');
const A = require('../services/boutique_addons');
const O = require('../services/boutique_offres');
const PAL = require('../services/boutique_paliers');
const PARU = require('../services/boutique_parution');
const MONO = require('../services/boutique_mono');   // template Mono-produit : seul le produit retenu est servi
const router = express.Router({ mergeParams: true });

// Add-ons activés de la boutique (public — lu par le site). Réponse : { addons: { badge_evend_masquer: true, … } }
router.get('/:gid/addons', async (req, res) => {
  try {
    const gid = parseInt(req.params.gid, 10);
    if (!Number.isInteger(gid) || gid <= 0) return res.status(404).json({ message: 'Boutique introuvable' });
    const s = await pool.query('SELECT template_id FROM sites WHERE gestionnaire_id = $1', [gid]);
    if (!s.rows.length || !A.estTemplateSolo(s.rows[0].template_id)) return res.json({ addons: {} });
    res.json({ addons: await A.actifs(gid) });
  } catch (err) {
    console.error('Erreur add-ons boutique:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

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
    // Add-on « Offres du jour » : le prix d'offre remplace le prix promo tant que l'offre est en cours (décidé ICI, par le serveur).
    // ?offres=1 → seulement les produits dont l'offre est en cours, ceux qui finissent bientôt d'abord.
    const seulementOffres = req.query.offres === '1';
    // ?ids=3,8,12 → seulement ces produits (la page « Enchères » et « Mes enchères » ouvrent une fiche qui n'est pas dans les 100 premiers)
    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').map((x) => parseInt(x, 10)).filter((x) => Number.isInteger(x) && x > 0 && x < 2147483647).slice(0, 50) : [];
    // Mono-produit : le serveur ne sert QUE le produit retenu (les autres annonces du gestionnaire ne sont jamais exposées)
    const retenu = await MONO.retenuPour(gid);
    if (retenu === null) return res.json({ heure_serveur: new Date().toISOString(), produits: [] });
    const filtreRetenu = retenu ? `AND p.id = ${parseInt(retenu, 10)}` : '';
    const filtreIds = ids.length ? `AND p.id = ANY(ARRAY[${ids.join(',')}]::int[])` : '';
    const r = await pool.query(
      `SELECT p.id, p.titre, p.description, p.prix, ${O.sqlPromo('p')} AS prix_promo, ${O.sqlFin('p')} AS offre_fin, p.stock, p.sku, p.categorie, p.photo_principale, p.photos, p.variantes, p.created_at, p.paliers, ${PAL.sqlAddonOn('p')} AS paliers_on, p.date_parution, (p.date_parution IS NOT NULL AND p.date_parution > NOW()) AS parution_future,
             en.date_fin AS ench_fin, COALESCE(en.mise_actuelle, en.prix_depart) AS ench_mise, en.nb_mises AS ench_nb
         FROM produits p
         LEFT JOIN LATERAL (SELECT e.date_fin, e.mise_actuelle, e.prix_depart, e.nb_mises FROM boutique_encheres e WHERE e.produit_id = p.id AND e.statut = 'active' AND e.date_fin > NOW() ORDER BY e.id DESC LIMIT 1) en ON TRUE
        WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.statut = 'actif'
          AND (p.date_parution IS NULL OR p.date_parution <= NOW() ${seulementOffres ? '' : `OR ${PARU.sqlAddonOn('p')}`}) AND (p.date_expiration IS NULL OR p.date_expiration > NOW())
          ${seulementOffres ? `AND ${O.actif('p')}` : ''} ${filtreIds} ${filtreRetenu}
        ORDER BY ${seulementOffres ? 'p.offre_fin ASC, ' : ''}p.created_at DESC, p.id DESC LIMIT ${limite} OFFSET ${decalage}`, [gid]);
    // NUMERIC revient en texte depuis Postgres : le template attend des nombres
    let totalOffres;
    if (seulementOffres) {   // nombre total d'offres en cours (pour la pagination et pour savoir s'il faut afficher le lien « Offres du jour »)
      totalOffres = parseInt((await pool.query(
        `SELECT COUNT(*) AS n FROM produits p WHERE p.gestionnaire_id = $1 AND p.collaborateur_id IS NULL AND p.statut = 'actif'
            AND (p.date_parution IS NULL OR p.date_parution <= NOW()) AND (p.date_expiration IS NULL OR p.date_expiration > NOW()) AND ${O.actif('p')}`, [gid])).rows[0].n, 10);
    }
    res.json({ heure_serveur: new Date().toISOString(), ...(seulementOffres ? { total: totalOffres } : {}), produits: r.rows.map(({ paliers, paliers_on, date_parution, parution_future, ...x }) => ({
      ...x,
      ...(parution_future ? { date_parution: new Date(date_parution).toISOString() } : {}),   // add-on « Parution future » : la fiche affiche le compte à rebours (heure_serveur à la racine) prix: Number(x.prix), prix_promo: x.prix_promo === null ? null : Number(x.prix_promo),
      ...(paliers_on && paliers ? { paliers: PAL.pourAffichage(paliers) } : {}),   // add-on « Prix par palier » : envoyés seulement si l'add-on est actif
    })) });
  } catch (err) {
    console.error('Erreur catalogue boutique:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;