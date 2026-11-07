// CHEMIN : routes/catalogue_public.js
// e-Vend Studio — Catalogue PUBLIC d'une boutique (sans connexion) : produits actifs des collaborateurs actifs.
//
// Monté dans server.js sur /api/produits/gestionnaire, AVANT l'ancien routeur produits_gestionnaire :
//   GET /:gestionnaireId                  ?q= &limit= &collaborateur_id=     liste des produits
//   GET /produit/:produitId                                                  { produit, similaires, avis: {total, moyenne}|null }
//                                         (+ ?categorie_id= ; ?q= cherche aussi dans le nom de la catégorie et du groupe)
//   (second routeur, monté sur /api/gestionnaires) GET /:gestionnaireId/boutiques  ?q= &tri= &page= &limit=
//                                                  GET /:gestionnaireId/boutiques/:collaborateurId (+ /avis, /addons-statut, /blog, /faq)
//                                                  POST /:gestionnaireId/boutiques/:collaborateurId/signaler · POST …/blog/:articleId/vue
//                                                  GET /:gestionnaireId/categories · /categories-groupes  (actifs)
// Si la requête porte un en-tête Authorization (le gestionnaire dans son dashboard) ou si le chemin
// n'est pas reconnu, on laisse passer vers l'ancien routeur (next()).
// Les champs sont renvoyés dans la forme attendue par les pages du template (nom, prix, prix_original, image, images…).

const express = require('express');
const sanitizeHtml = require('sanitize-html');
const pool = require('../db');

const vac = require('../services/studio_vacances');
const cfgMV = require('../services/studio_config_mv');
const router = express.Router();

function entier(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : null;
}

// Gérer l'inventaire désactivé (Config produits) : le stock n'est plus suivi, tout est « en stock »
const SANS_STOCK = `COALESCE((SELECT st.config->'multivendeur'->>'gerer_inventaire_par_defaut' = 'false' FROM sites st WHERE st.gestionnaire_id = p.gestionnaire_id LIMIT 1), false)`;
const COLS = `p.id, p.titre, p.description, p.prix, p.prix_promo, p.stock, p.categorie, p.photo_principale, p.photos,
  p.created_at, p.collaborateur_id, p.variantes,
  COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS nom_boutique, mc.ville AS vendeur_ville, mc.politique_livraison, mc.politique_retour,
  p.categorie_id, COALESCE(sc.nom, cp.label) AS categorie_nom, sg.nom AS groupe_nom,
  (mc.inscrit_taxes IS TRUE AND COALESCE(sc.taxable, true)) AS facturation_taxes, ${SANS_STOCK} AS sans_stock, ${vac.VAC_COLS}`;
const FROM = `FROM produits p
  JOIN marketplace_collaborateurs mc ON mc.id = p.collaborateur_id AND mc.statut = 'actif'
  ${vac.VAC_JOIN}
  LEFT JOIN categories_pub cp ON cp.cle = p.categorie
  LEFT JOIN studio_categories sc ON sc.id = p.categorie_id
  LEFT JOIN studio_groupes_categories sg ON sg.id = sc.groupe_id`;
// Les boutiques en vacances « annonces masquées » ne sortent ni dans les listes, ni dans la recherche, ni dans les produits similaires
const FILTRE = `p.gestionnaire_id = $1 AND p.statut = 'actif' AND p.collaborateur_id IS NOT NULL AND NOT ${vac.VAC_MASQUE}`;

// Variantes saisies par le collaborateur : [{ nom, prix (vide = prix du produit), stock (vide = stock du produit) }]
function formaterVariantes(r, stockProduit, sansStock) {
  let v = r.variantes;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = []; } }
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x && typeof x.nom === 'string' && x.nom.trim()).slice(0, 20).map((x) => ({
    nom: x.nom.trim().slice(0, 60),
    prix: x.prix === null || x.prix === undefined || x.prix === '' || !(Number(x.prix) >= 0) ? null : Number(x.prix),
    stock: sansStock || x.stock === null || x.stock === undefined || x.stock === '' ? stockProduit : Math.max(0, Math.trunc(Number(x.stock)) || 0),
  }));
}

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
    stock: r.sans_stock === true || r.stock === null || r.stock === undefined ? 9999 : (Number(r.stock) || 0), // stock vide = illimité
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
    politique_livraison: r.politique_livraison || '',
    politique_retour: r.politique_retour || '',
    facturation_taxes: r.facturation_taxes === true, // décidé par le serveur : collaborateur inscrit aux taxes ET catégorie taxable
    statut: 'actif',
    created_at: r.created_at,
    variantes: formaterVariantes(r, r.sans_stock === true || r.stock === null || r.stock === undefined ? 9999 : (Number(r.stock) || 0), r.sans_stock === true),
    vacances: vac.publicDe(r), // { mode, message, retour } si le vendeur est en vacances, sinon null
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
    // Résumé des avis de l'annonce : avis publiés des commandes qui contenaient ce produit (affiché sous le titre).
    // Absent si les avis clients sont désactivés (Config marketplace → Fonctionnalités) ou s'il n'y en a aucun.
    let avis = null;
    if (cfgMV.actif(await cfgMV.lire(p.gestionnaire_id, pool), 'avis_actifs', true)) {
      const ra = await pool.query(
        `SELECT COUNT(*)::int AS total, COALESCE(AVG(av.note), 0)::float AS moyenne
           FROM avis_collaborateur av JOIN marketplace_commandes c ON c.id = av.commande_id
          WHERE av.approuve = true AND av.collaborateur_id = $1
            AND EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(c.articles) = 'array' THEN c.articles ELSE '[]'::jsonb END) e
                         WHERE e->>'produit_id' = $2::text)`, [p.collaborateur_id, id]);
      const t = ra.rows[0];
      if (t.total > 0) avis = { total: t.total, moyenne: Math.round(t.moyenne * 10) / 10 };
    }
    res.json({ produit: formater(p), similaires: sim.rows.map(formater), avis });
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
    // Mode paginé (?page=N) : filtres, tri et pagination faits par le serveur → { produits, pagination }
    if (req.query.page !== undefined) {
      const prixEff = 'CASE WHEN p.prix_promo > 0 AND p.prix_promo < p.prix THEN p.prix_promo ELSE p.prix END';
      const pmin = Number(req.query.prix_min), pmax = Number(req.query.prix_max);
      if (req.query.prix_min !== undefined && req.query.prix_min !== '' && Number.isFinite(pmin)) { params.push(pmin); where += ` AND (${prixEff}) >= $${params.length}`; }
      if (req.query.prix_max !== undefined && req.query.prix_max !== '' && Number.isFinite(pmax)) { params.push(pmax); where += ` AND (${prixEff}) <= $${params.length}`; }
      if (req.query.en_stock === '1') where += ` AND (p.stock IS NULL OR p.stock > 0 OR ${SANS_STOCK})`;
      const TRIS_PROD = { recent: 'p.created_at DESC', prix_asc: `(${prixEff}) ASC`, prix_desc: `(${prixEff}) DESC`, alpha_az: 'LOWER(p.titre) ASC', alpha_za: 'LOWER(p.titre) DESC' };
      const tri = TRIS_PROD[req.query.tri] || TRIS_PROD.recent;
      const lim = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
      const pg = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 10000);
      const rp = await pool.query(
        `SELECT ${COLS}, COUNT(*) OVER()::int AS total_lignes ${FROM} WHERE ${where} ORDER BY ${tri}, p.id DESC LIMIT ${lim} OFFSET ${(pg - 1) * lim}`, params);
      let total = rp.rows.length ? rp.rows[0].total_lignes : 0;
      if (!rp.rows.length && pg > 1) total = (await pool.query(`SELECT COUNT(*)::int AS n ${FROM} WHERE ${where}`, params)).rows[0].n;
      return res.json({ produits: rp.rows.map(formater), pagination: { total, page: pg, limit: lim, pages: Math.max(1, Math.ceil(total / lim)) } });
    }
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
    let where = `mc.gestionnaire_id = $1 AND mc.statut = 'actif' AND NOT ${vac.VAC_MASQUE}`;
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    if (q) { params.push('%' + q.replace(/[\\%_]/g, '\\$&') + '%'); where += ` AND (COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) ILIKE $${params.length} OR mc.description_boutique ILIKE $${params.length})`; }
    const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const tri = TRIS[req.query.tri] || TRIS.alpha_asc;
    const r = await pool.query(
      `SELECT *, COUNT(*) OVER()::int AS total_lignes FROM (
         SELECT mc.id, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS nom_boutique, mc.logo_url AS logo,
                mc.description_boutique, mc.ville, mc.province, mc.created_at,
                (SELECT COUNT(*) FROM produits p WHERE p.collaborateur_id = mc.id AND p.statut = 'actif')::int AS nb_produits,
                COALESCE(ROUND((SELECT AVG(a.note) FROM avis_collaborateur a WHERE a.collaborateur_id = mc.id AND a.approuve) * 20), 0)::int AS points_confiance,
                ${vac.VAC_ACTIF} AS en_vacances
           FROM marketplace_collaborateurs mc ${vac.VAC_JOIN} WHERE ${where}
       ) b ORDER BY ${tri} LIMIT ${limite} OFFSET ${(page - 1) * limite}`, params);
    let total = r.rows.length ? r.rows[0].total_lignes : 0;
    if (!r.rows.length && page > 1) total = (await pool.query(`SELECT COUNT(*)::int AS n FROM marketplace_collaborateurs mc ${vac.VAC_JOIN} WHERE ${where}`, params)).rows[0].n;
    res.json({ boutiques: r.rows.map(({ total_lignes, ...b }) => b), pagination: { total, page, limit: limite, pages: Math.max(1, Math.ceil(total / limite)) } });
  } catch (e) {
    console.error('[catalogue_public] boutiques', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Page d'une boutique (collaborateur actif) : fiche, avis, modules ──────────────────────────────────────
async function boutiqueActive(gid, cid) {
  const r = await pool.query(
    `SELECT mc.id, COALESCE(NULLIF(mc.nom_boutique,''), mc.nom_responsable) AS nom_boutique, mc.description_boutique,
            mc.ville, mc.province, mc.logo_url, mc.banniere_url, mc.site_web, mc.adresse, mc.code_postal, mc.details_publics, mc.reseaux_sociaux, mc.email AS email_compte, mc.telephone AS telephone_compte, mc.created_at,
            (SELECT COUNT(*) FROM produits p WHERE p.collaborateur_id = mc.id AND p.statut = 'actif')::int AS nb_produits,
            (SELECT COALESCE(SUM(CASE WHEN (e->>'quantite') ~ '^[0-9]{1,6}$' THEN (e->>'quantite')::int ELSE 1 END), 0)::int
               FROM marketplace_commandes c, jsonb_array_elements(CASE WHEN jsonb_typeof(c.articles) = 'array' THEN c.articles ELSE '[]'::jsonb END) e
              WHERE c.collaborateur_id = mc.id AND c.statut_paiement = 'paye' AND c.statut <> 'annulee') AS nb_vendus,
            ${vac.VAC_COLS}
       FROM marketplace_collaborateurs mc ${vac.VAC_JOIN} WHERE mc.id = $1 AND mc.gestionnaire_id = $2 AND mc.statut = 'actif'`, [cid, gid]);
  return r.rows[0] || null;
}

boutiques.get('/:gestionnaireId/boutiques/:collaborateurId', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.status(404).json({ error: 'Boutique introuvable' });
    const b = await boutiqueActive(gid, cid);
    if (!b) return res.status(404).json({ error: 'Boutique introuvable' });
    const desc = b.description_boutique || '';
    // « + de détails » : adresse, site web et réseaux sociaux ne sortent QUE si le collaborateur a activé l'interrupteur.
    // Le gestionnaire décide ce qui peut sortir (Config vendeur → Visibilité des données clients) ; le courriel et le téléphone
    // du compte ne sortent que s'ils sont autorisés ET que le collaborateur a activé l'interrupteur.
    let details = null;
    if (b.details_publics) {
      const mv = await cfgMV.lire(gid, pool);
      const d = {};
      if (cfgMV.actif(mv, 'voir_details_client', true)) {
        const rs = b.reseaux_sociaux && typeof b.reseaux_sociaux === 'object' ? b.reseaux_sociaux : {};
        const reseaux = {};
        for (const k of ['facebook', 'instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'pinterest']) {
          if (typeof rs[k] === 'string' && /^https:\/\/[^\s<>"']+$/.test(rs[k])) reseaux[k] = rs[k];
        }
        Object.assign(d, { adresse: b.adresse || '', ville: b.ville || '', province: b.province || '', code_postal: b.code_postal || '', site_web: /^https?:\/\/[^\s<>"']+$/i.test(b.site_web || '') ? b.site_web : '', reseaux });
      }
      if (cfgMV.actif(mv, 'voir_email_client', false) && b.email_compte) d.email = b.email_compte;
      if (cfgMV.actif(mv, 'voir_telephone_client', false) && b.telephone_compte) d.telephone = b.telephone_compte;
      if (d.adresse || d.ville || d.code_postal || d.site_web || (d.reseaux && Object.keys(d.reseaux).length) || d.email || d.telephone) details = d;
    }
    res.json({
      id: b.id, nom_boutique: b.nom_boutique,
      description_courte: desc.length > 160 ? desc.slice(0, 157) + '…' : desc,
      description_longue: desc, ville: b.ville, province: b.province,
      logo_url: b.logo_url, banniere_url: b.banniere_url, details,
      nb_produits: b.nb_produits, nb_vendus: b.nb_vendus, date_inscription: b.created_at,
      vacances: vac.publicDe(b),
    });
  } catch (e) {
    console.error('[catalogue_public] boutique', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Avis approuvés (laissés par des acheteurs ayant commandé) — le nom est abrégé (« Marie T. »).
// Paginé : 25 par page (?page=). La moyenne, le total et la répartition portent sur TOUS les avis publiés, pas sur la page.
const AVIS_PAR_PAGE = 25;
boutiques.get('/:gestionnaireId/boutiques/:collaborateurId/avis', async (req, res) => {
  const vide = { avis: [], moyenne: 0, total: 0, page: 1, pages: 1, par_page: AVIS_PAR_PAGE, repartition: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.json(vide);
    const ok = await pool.query(`SELECT 1 FROM marketplace_collaborateurs WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif'`, [cid, gid]);
    if (!ok.rows.length) return res.json(vide);
    const st = await pool.query(
      `SELECT COUNT(*)::int AS total, COALESCE(AVG(note), 0)::float AS moyenne,
              COUNT(*) FILTER (WHERE note = 1)::int AS n1, COUNT(*) FILTER (WHERE note = 2)::int AS n2, COUNT(*) FILTER (WHERE note = 3)::int AS n3,
              COUNT(*) FILTER (WHERE note = 4)::int AS n4, COUNT(*) FILTER (WHERE note = 5)::int AS n5
         FROM avis_collaborateur WHERE collaborateur_id = $1 AND approuve = true`, [cid]);
    const t = st.rows[0];
    const pages = Math.max(1, Math.ceil(t.total / AVIS_PAR_PAGE));
    const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1));
    const r = await pool.query(
      `SELECT av.id, av.note AS note_globale, av.titre, av.commentaire, av.created_at, av.criteres, av.photos, av.reponse, av.reponse_le,
              TRIM(COALESCE(a.prenom,'') || ' ' || COALESCE(LEFT(a.nom,1) || '.', '')) AS nom_client,
              COALESCE((SELECT jsonb_agg(DISTINCT jsonb_build_object('id', p.id, 'titre', p.titre))
                          FROM marketplace_commandes c, jsonb_array_elements(CASE WHEN jsonb_typeof(c.articles) = 'array' THEN c.articles ELSE '[]'::jsonb END) e
                          JOIN produits p ON (e->>'produit_id') ~ '^[0-9]{1,9}$' AND p.id = (e->>'produit_id')::int AND p.collaborateur_id = av.collaborateur_id
                         WHERE c.id = av.commande_id), '[]'::jsonb) AS produits
         FROM avis_collaborateur av
         LEFT JOIN marketplace_acheteurs a ON a.id = av.acheteur_id
        WHERE av.collaborateur_id = $1 AND av.approuve = true
        ORDER BY av.created_at DESC, av.id DESC LIMIT $2 OFFSET $3`, [cid, AVIS_PAR_PAGE, (page - 1) * AVIS_PAR_PAGE]);
    const avis = r.rows.map((x) => ({ ...x, nom_client: x.nom_client || 'Client', produits: Array.isArray(x.produits) ? x.produits.slice(0, 5) : [] }));
    res.json({
      avis, moyenne: Math.round(t.moyenne * 10) / 10, total: t.total, page, pages, par_page: AVIS_PAR_PAGE,
      repartition: { 1: t.n1, 2: t.n2, 3: t.n3, 4: t.n4, 5: t.n5 },
    });
  } catch (e) {
    console.error('[catalogue_public] avis', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modules affichés sur la page boutique : l'onglet apparaît seulement s'il y a du contenu à montrer.
boutiques.get('/:gestionnaireId/boutiques/:collaborateurId/addons-statut', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.json({ blog_actif: false, faq_actif: false, avis_actif: true });
    const r = await pool.query(
      `SELECT EXISTS (SELECT 1 FROM collab_blogs WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND statut = 'publie') AS blog,
              EXISTS (SELECT 1 FROM collab_faq   WHERE collaborateur_id = $1 AND gestionnaire_id = $2 AND active) AS faq`, [cid, gid]);
    const avisOk = cfgMV.actif(await cfgMV.lire(gid, pool), 'avis_actifs', true);   // Config marketplace → Fonctionnalités → Avis clients
    res.json({ blog_actif: r.rows[0].blog, faq_actif: r.rows[0].faq, avis_actif: avisOk });
  } catch (e) {
    console.error('[catalogue_public] addons', e.message);
    res.json({ blog_actif: false, faq_actif: false, avis_actif: true });
  }
});

boutiques.get('/:gestionnaireId/boutiques/:collaborateurId/blog', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.json({ articles: [] });
    const r = await pool.query(
      `SELECT b.id, b.titre, b.contenu, array_to_string(b.tags, ', ') AS tags, b.vues, b.date_publication
         FROM collab_blogs b JOIN marketplace_collaborateurs mc ON mc.id = b.collaborateur_id AND mc.statut = 'actif'
        WHERE b.collaborateur_id = $1 AND b.gestionnaire_id = $2 AND b.statut = 'publie'
        ORDER BY b.date_publication DESC NULLS LAST, b.id DESC LIMIT 50`, [cid, gid]);
    res.json({ articles: r.rows });
  } catch (e) {
    console.error('[catalogue_public] blog', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Compteur de vues : au plus 1 vue par visiteur (adresse IP) et par article, par heure.
const vuesVues = new Map();
boutiques.post('/:gestionnaireId/boutiques/:collaborateurId/blog/:articleId/vue', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId), aid = entier(req.params.articleId);
    if (!gid || !cid || !aid) return res.json({ success: false });
    const cle = `${req.ip}|${aid}`;
    const dernier = vuesVues.get(cle);
    if (dernier && Date.now() - dernier < 3600000) return res.json({ success: true });
    vuesVues.set(cle, Date.now());
    if (vuesVues.size > 5000) vuesVues.clear();
    await pool.query(`UPDATE collab_blogs SET vues = vues + 1 WHERE id = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3 AND statut = 'publie'`, [aid, cid, gid]);
    res.json({ success: true });
  } catch (e) { res.json({ success: false }); }
});

boutiques.get('/:gestionnaireId/boutiques/:collaborateurId/faq', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.json({ items: [] });
    const r = await pool.query(
      `SELECT f.id, f.question, f.reponse FROM collab_faq f JOIN marketplace_collaborateurs mc ON mc.id = f.collaborateur_id AND mc.statut = 'actif'
        WHERE f.collaborateur_id = $1 AND f.gestionnaire_id = $2 AND f.active ORDER BY f.ordre ASC, f.id ASC LIMIT 100`, [cid, gid]);
    res.json({ items: r.rows });
  } catch (e) {
    console.error('[catalogue_public] faq', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Signalement d'une boutique (formulaire public) ─────────────────────────────────────────────────────────
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" };
function texteSur(v, max) { // texte seul, sans balises ni caractères de contrôle ; null si invalide
  if (typeof v !== 'string' || v.length > max * 5) return null;
  let t = sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} });
  t = t.replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (e) => ENT[e]);
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').trim();
  return t.length > max ? null : t;
}
const RAISONS = ['produit_fake', 'arnaque', 'comportement', 'livraison', 'qualite', 'autre'];
const signalements = new Map();
function dansLimite(cle, max, fenetreMs, noter) { // noter=false : on vérifie seulement (le décompte se fait plus tard)
  const now = Date.now();
  const l = (signalements.get(cle) || []).filter((x) => now - x < fenetreMs);
  if (l.length >= max) { signalements.set(cle, l); return false; }
  if (noter !== false) l.push(now);
  signalements.set(cle, l);
  if (signalements.size > 5000) signalements.clear();
  return true;
}

boutiques.post('/:gestionnaireId/boutiques/:collaborateurId/signaler', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId), cid = entier(req.params.collaborateurId);
    if (!gid || !cid) return res.status(404).json({ error: 'Boutique introuvable' });
    if (!dansLimite(`sig-${req.ip}`, 20, 3600000) || !dansLimite(`sigb-${req.ip}-${cid}`, 2, 24 * 3600000, false)) {
      return res.status(429).json({ error: 'Trop de signalements. Réessayez plus tard.' });
    }
    const b = req.body || {};
    const nom = texteSur(b.nom, 100), email = texteSur(b.email, 160);
    const description = texteSur(b.description, 2000);
    const raison = RAISONS.includes(b.raison_type) ? b.raison_type : null;
    const autre = raison === 'autre' ? texteSur(b.raison_autre, 150) : '';
    if (!nom || !email || !description || !raison || (raison === 'autre' && !autre)) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
    }
    if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/.test(email)) return res.status(400).json({ error: 'Adresse courriel invalide.' });
    if (!(await boutiqueActive(gid, cid))) return res.status(404).json({ error: 'Boutique introuvable' });
    await pool.query(
      `INSERT INTO signalements_boutique (gestionnaire_id, collaborateur_id, nom, email, raison_type, raison_autre, description)
       VALUES ($1,$2,$3,$4,$5,NULLIF($6,''),$7)`, [gid, cid, nom, email, raison, autre || '', description]);
    dansLimite(`sigb-${req.ip}-${cid}`, 2, 24 * 3600000); // décompte seulement quand le signalement est enregistré
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('[catalogue_public] signaler', e.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Catégories et groupes du gestionnaire (actifs seulement) — pour la barre latérale et l'accueil ──────────
boutiques.get('/:gestionnaireId/categories', async (req, res) => {
  try {
    const gid = entier(req.params.gestionnaireId);
    if (!gid) return res.json({ categories: [] });
    if (!cfgMV.actif(await cfgMV.lire(gid, pool), 'permettre_categories', true)) return res.json({ categories: [] });   // Config vendeur → Permettre les catégories
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
    if (!cfgMV.actif(await cfgMV.lire(gid, pool), 'permettre_categories', true)) return res.json({ groupes: [] });
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