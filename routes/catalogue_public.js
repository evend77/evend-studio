// CHEMIN : routes/catalogue_public.js
// e-Vend Studio — Catalogue PUBLIC d'une boutique (sans connexion) : produits actifs des collaborateurs actifs.
//
// Monté dans server.js sur /api/produits/gestionnaire, AVANT l'ancien routeur produits_gestionnaire :
//   GET /:gestionnaireId                  ?q= &limit= &collaborateur_id=     liste des produits
//   GET /produit/:produitId                                                  { produit, similaires }
//                                         (+ ?categorie_id= ; ?q= cherche aussi dans le nom de la catégorie et du groupe)
//   (second routeur, monté sur /api/gestionnaires) GET /:gestionnaireId/boutiques  ?q= &tri= &page= &limit=
//                                                  GET /:gestionnaireId/boutiques/:collaborateurId (+ /avis, /addons-statut)
//                                                  GET /:gestionnaireId/categories · /categories-groupes  (actifs)
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
  p.categorie_id, COALESCE(sc.nom, cp.label) AS categorie_nom, sg.nom AS groupe_nom`;
const FROM = `FROM produits p
  JOIN marketplace_collaborateurs mc ON mc.id = p.collaborateur_id AND mc.statut = 'actif'
  LEFT JOIN categories_pub cp ON cp.cle = p.categorie
  LEFT JOIN studio_categories sc ON sc.id = p.categorie_id
  LEFT JOIN studio_groupes_categories sg ON sg.id = sc.groupe_id`;
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
    categorie_id: r.categorie_id,
    categorie_nom: r.categorie_nom || r.categorie,
    groupe_nom: r.groupe_nom || null,
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
        ORDER BY (p.categorie_id IS NOT NULL AND p.categorie_id = $3) DESC, p.created_at DESC LIMIT 4`, [p.gestionnaire_id, id, p.categorie_id || 0]);
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
    if (q) {
      params.push('%' + q.replace(/[\\%_]/g, '\\$&') + '%');
      const n = params.length;
      where += ` AND (p.titre ILIKE $${n} OR p.categorie ILIKE $${n} OR sc.nom ILIKE $${n} OR sg.nom ILIKE $${n})`;
    }
    const catId = entier(req.query.categorie_id);
    if (catId) { params.push(catId); where += ` AND p.categorie_id = $${params.length}`; }
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

// ── Page d'une boutique (collaborateur actif) : fiche, avis, modules ──────────────────────────────────────
async function boutiqueActive(gid, cid) {
  const r = await pool.query(
    `SELECT mc.id, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS nom_boutique, mc.description_boutique,
            mc.ville, mc.province, mc.logo_url, mc.banniere_url, mc.site_web, mc.created_at,
            (SELECT COUNT(*) FROM produits p WHERE p.collaborateur_id = mc.id AND p.statut = 'actif')::int AS nb_produits
       FROM marketplace_collaborateurs mc WHERE mc.id = $1 AND mc.gestionnaire_id = $2 AND mc.statut = 'actif'`, [cid, gid]);
  return r.rows[0] || null;
}

boutiques.get('/:gestionnaireId/boutiques/:collaborateurId', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.status(404).json({ error: 'Boutique introuvable' });
    const b = await boutiqueActive(gid, cid);
    if (!b) return res.status(404).json({ error: 'Boutique introuvable' });
    const desc = b.description_boutique || '';
    res.json({
      id: b.id, nom_boutique: b.nom_boutique,
      description_courte: desc.length > 160 ? desc.slice(0, 157) + '…' : desc,
      description_longue: desc, ville: b.ville, province: b.province,
      logo_url: b.logo_url, banniere_url: b.banniere_url, site_web: b.site_web,
      nb_produits: b.nb_produits, date_inscription: b.created_at,
    });
  } catch (e) {
    console.error('[catalogue_public] boutique', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Avis approuvés (laissés par des acheteurs ayant commandé) — le nom est abrégé (« Marie T. »)
boutiques.get('/:gestionnaireId/boutiques/:collaborateurId/avis', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.json({ avis: [], moyenne: 0 });
    const r = await pool.query(
      `SELECT av.id, av.note AS note_globale, av.titre, av.commentaire, av.created_at,
              TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(LEFT(a.nom,1) || '.', '')) AS nom_client
         FROM avis_collaborateur av
         JOIN marketplace_collaborateurs mc ON mc.id = av.collaborateur_id AND mc.gestionnaire_id = $2 AND mc.statut = 'actif'
         LEFT JOIN marketplace_acheteurs a ON a.id = av.acheteur_id
        WHERE av.collaborateur_id = $1 AND av.approuve = true
        ORDER BY av.created_at DESC LIMIT 100`, [cid, gid]);
    const avis = r.rows.map((x) => ({ ...x, nom_client: x.nom_client || 'Client' }));
    const moyenne = avis.length ? avis.reduce((t, x) => t + x.note_globale, 0) / avis.length : 0;
    res.json({ avis, moyenne: Math.round(moyenne * 10) / 10 });
  } catch (e) {
    console.error('[catalogue_public] avis', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modules affichés sur la page boutique : seuls les avis existent pour l'instant (blog et FAQ : à venir).
boutiques.get('/:gestionnaireId/boutiques/:collaborateurId/addons-statut', (req, res) => {
  res.json({ blog_actif: false, faq_actif: false, avis_actif: true });
});

// ── Catégories et groupes du gestionnaire (actifs seulement) — pour la barre latérale et l'accueil ──────────
boutiques.get('/:gestionnaireId/categories', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return res.json({ categories: [] });
    const r = await pool.query(
      `SELECT c.id, c.nom, c.image, g.nom AS groupe_nom,
              (SELECT COUNT(*) FROM produits p
                 JOIN marketplace_collaborateurs mc ON mc.id = p.collaborateur_id AND mc.statut = 'actif'
                WHERE p.categorie_id = c.id AND p.statut = 'actif')::int AS nb_produits
         FROM studio_categories c
         LEFT JOIN studio_groupes_categories g ON g.id = c.groupe_id
        WHERE c.gestionnaire_id = $1 AND c.active = true
        ORDER BY c.nom ASC`, [gid]);
    res.json({ categories: r.rows });
  } catch (e) {
    console.error('[catalogue_public] categories', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

boutiques.get('/:gestionnaireId/categories-groupes', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return res.json({ groupes: [] });
    const r = await pool.query(
      `SELECT g.id, g.nom, g.image,
              (SELECT COUNT(*) FROM studio_categories c WHERE c.groupe_id = g.id AND c.active = true)::int AS nb_categories
         FROM studio_groupes_categories g
        WHERE g.gestionnaire_id = $1 AND g.active = true
        ORDER BY g.ordre ASC NULLS LAST, g.nom ASC`, [gid]);
    res.json({ groupes: r.rows });
  } catch (e) {
    console.error('[catalogue_public] groupes', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
module.exports.boutiques = boutiques;