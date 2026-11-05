// CHEMIN : routes/catalogue_public.js
// e-Vend Studio — Catalogue PUBLIC d'une boutique (sans connexion) : produits actifs des collaborateurs actifs.
//
// Monté dans server.js sur /api/produits/gestionnaire, AVANT l'ancien routeur produits_gestionnaire :
//   GET /:gestionnaireId                  ?q= &limit= &collaborateur_id=     liste des produits
//   GET /produit/:produitId                                                  { produit, similaires }
//   (second routeur, monté sur /api/gestionnaires) GET /:gestionnaireId/boutiques  ?q= &tri= &page= &limit=
// Si la requête porte un en-tête Authorization (le gestionnaire dans son dashboard) ou si le chemin
// n'est pas reconnu, on laisse passer vers l'ancien routeur (next()).
// Les champs sont renvoyés dans la forme attendue par les pages du template (nom, prix, prix_original, image, images…).

const express = require('express');
const pool = require('../db');

const router = express.Router();

function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
}

const COLS = `p.id, p.titre, p.description, p.prix, p.prix_promo, p.stock, p.categorie, p.photo_principale, p.photos,
  p.created_at, p.collaborateur_id,
  COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS nom_boutique, mc.ville AS vendeur_ville,
  cp.label AS categorie_nom`;
const FROM = `FROM produits p
  JOIN marketplace_collaborateurs mc ON mc.id = p.collaborateur_id AND mc.statut = 'actif'
  LEFT JOIN categories_pub cp ON cp.cle = p.categorie`;
const FILTRE = `p.gestionnaire_id = $1 AND p.statut = 'actif' AND p.collaborateur_id IS NOT NULL`;

function formater(r) {
  const prix = Number(r.prix) || 0;
  const promo = r.prix_promo !== null && r.prix_promo !== undefined ? Number(r.prix_promo) : 0;
  const enPromo = promo > 0 && promo < prix;
  let photos = r.photos;
  if (typeof photos === 'string') { try { photos = JSON.parse(photos); } catch (e) { photos = []; } }
  if (!Array.isArray(photos) || !photos.length) photos = r.photo_principale ? [r.photo_principale] : [];
  return {
    id: r.id,
    nom: r.titre,
    titre: r.titre,
    description: r.description,
    prix: enPromo ? promo : prix,
    prix_original: enPromo ? prix : undefined,
    stock: r.stock === null || r.stock === undefined ? 9999 : (Number(r.stock) || 0), // stock vide = illimité
    image: r.photo_principale || photos[0] || null,
    images: JSON.stringify(photos),
    categorie: r.categorie,
    categorie_nom: r.categorie_nom || r.categorie,
    vendeur_id: r.collaborateur_id,
    nom_boutique: r.nom_boutique,
    vendeur_nom: r.nom_boutique,
    vendeur_ville: r.vendeur_ville,
    statut: 'actif',
    created_at: r.created_at,
  };
}

// Le gestionnaire connecté garde l'ancien comportement (il voit aussi brouillons et produits à lui).
router.use((req, res, next) => (req.headers.authorization ? next('router') : next()));

router.get('/produit/:produitId', async (req, res, next) => {
  try {
    const id = entier(req.params.produitId);
    if (!id) return next();
    const r = await pool.query(`SELECT ${COLS}, p.gestionnaire_id ${FROM} WHERE p.id = $1 AND p.statut = 'actif' AND p.collaborateur_id IS NOT NULL`, [id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    const p = r.rows[0];
    const sim = await pool.query(
      `SELECT ${COLS} ${FROM} WHERE ${FILTRE} AND p.id <> $2
        ORDER BY (p.categorie = $3) DESC, p.created_at DESC LIMIT 4`, [p.gestionnaire_id, id, p.categorie || '']);
    res.json({ produit: formater(p), similaires: sim.rows.map(formater) });
  } catch (e) {
    console.error('[catalogue_public] produit', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:gestionnaireId', async (req, res, next) => {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return next(); // chemin non numérique : on laisse l'ancien routeur répondre
    const params = [gid];
    let where = FILTRE;
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    if (q) { params.push('%' + q.replace(/[\\%_]/g, '\\$&') + '%'); where += ` AND (p.titre ILIKE $${params.length} OR p.categorie ILIKE $${params.length})`; }
    const collab = entier(req.query.collaborateur_id);
    if (collab) { params.push(collab); where += ` AND p.collaborateur_id = $${params.length}`; }
    const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
    const r = await pool.query(`SELECT ${COLS} ${FROM} WHERE ${where} ORDER BY p.created_at DESC LIMIT ${limite}`, params);
    res.json(r.rows.map(formater));
  } catch (e) {
    console.error('[catalogue_public] liste', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Boutiques (collaborateurs actifs) — monté sur /api/gestionnaires, avant l'ancien routeur ──────────────
const boutiques = express.Router();
const TRIS = {
  alpha_asc: 'nom_boutique ASC', alpha_desc: 'nom_boutique DESC',
  confiance: 'points_confiance DESC, nom_boutique ASC', recent: 'created_at DESC',
};

boutiques.get('/:gestionnaireId/boutiques', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return res.json({ boutiques: [] });
    const params = [gid];
    let where = `mc.gestionnaire_id = $1 AND mc.statut = 'actif'`;
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    if (q) { params.push('%' + q.replace(/[\\%_]/g, '\\$&') + '%'); where += ` AND (COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) ILIKE $${params.length} OR mc.description_boutique ILIKE $${params.length})`; }
    const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const tri = TRIS[req.query.tri] || TRIS.alpha_asc;
    const r = await pool.query(
      `SELECT * FROM (
         SELECT mc.id, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS nom_boutique, mc.logo_url AS logo,
                mc.description_boutique, mc.ville, mc.province, mc.created_at,
                (SELECT COUNT(*) FROM produits p WHERE p.collaborateur_id = mc.id AND p.statut = 'actif')::int AS nb_produits,
                COALESCE(ROUND((SELECT AVG(a.note) FROM avis_collaborateur a WHERE a.collaborateur_id = mc.id AND a.approuve) * 20), 0)::int AS points_confiance
           FROM marketplace_collaborateurs mc WHERE ${where}
       ) b ORDER BY ${tri} LIMIT ${limite} OFFSET ${(page - 1) * limite}`, params);
    res.json({ boutiques: r.rows });
  } catch (e) {
    console.error('[catalogue_public] boutiques', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
module.exports.boutiques = boutiques;