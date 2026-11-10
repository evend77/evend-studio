// CHEMIN : routes/marketplace-panier.js
// e-Vend Studio — Panier + Checkout scopés par gestionnaire_id
// A monter : app.use('/api/marketplace', require('./routes/marketplace-panier'));
// Utilise les tables : marketplace_panier, marketplace_commandes, marketplace_acheteurs, marketplace_collaborateurs

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const jwt     = require('jsonwebtoken');
const paiement = require('../services/studio_paiement');
const promo = require('../services/studio_promo');
const taxesMV = require('../services/studio_taxes');
const expMV = require('../services/studio_expedition');
const vacMV = require('../services/studio_vacances');
const cfgMV = require('../services/studio_config_mv');
const regles = require('../services/studio_regles_produits');
const regCmd = require('../services/studio_regles_commande');
const OFFRES = require('../services/studio_offres');
const PALIERS = require('../services/studio_paliers');

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Middleware auth marketplace ──────────────────────────────────────────────
// Cookie httpOnly mv_token_<gid> (posé par marketplace-auth.js), avec repli sur
// l'en-tête Authorization. Le jeton doit appartenir à CETTE boutique et à un
// acheteur : un collaborateur n'a pas de panier.
async function authMV(req, res, next) {
  const gid = req.params.gid;
  const cookieToken = req.cookies && req.cookies[`mv_token_${gid}`];
  const auth = req.headers.authorization;
  const headerToken = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const token = cookieToken || headerToken;
  if (!token) return res.status(401).json({ message: 'Non authentifie' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.gestionnaireId !== Number(gid)) {
      return res.status(403).json({ message: 'Ce compte n\'appartient pas a cette boutique.' });
    }
    if (payload.type !== 'acheteur') {
      return res.status(403).json({ message: 'Un compte acheteur est requis.' });
    }
    const sus = await pool.query('SELECT suspendu FROM marketplace_acheteurs WHERE id = $1 AND gestionnaire_id = $2', [payload.id, Number(gid)]);
    if (sus.rows[0] && sus.rows[0].suspendu === true) return res.status(403).json({ message: 'Votre compte est suspendu. Contactez la boutique.', suspendu: true });
    req.mvUser = payload;
    next();
  } catch { res.status(401).json({ message: 'Token invalide' }); }
}

// ─── TAUX DE TAXES PAR PROVINCE ──────────────────────────────────────────────
// Les taux sont réglés par le gestionnaire (Config multi → Généralité) : voir services/studio_taxes.js.
// TAXES_DEFAUT ne sert que si aucune table n'est fournie (taux par défaut).
const TAXES_DEFAUT = taxesMV.tableTaux({});

// Arrondi au cent, demi vers le haut (évite 9.975 → 9.97 à cause des flottants)
const arrondi2 = (n) => Math.round(n * 100 + 1e-7) / 100;

// incluses = true (Configuration marketplace → Commande → « Taxes incluses dans le prix ») : les prix et l'expédition contiennent déjà
// les taxes ; on les EXTRAIT (taxe = montant × taux ÷ (1 + somme des taux)) au lieu de les ajouter. Le total ne change pas.
function calculerTaxesProvince(sousTotal, fraisExp, province, articles, pourboire, table, incluses) {
  const tbl = table || TAXES_DEFAUT;
  const tx = tbl[province] || tbl['QC'];
  const base = articles
    ? articles.reduce((s, a) => s + (a.facturation_taxes !== false ? parseFloat(a.prix) * a.quantite : 0), 0)
    : sousTotal;
  // Aucun article taxable (collaborateur non inscrit ou catégorie détaxée) : l'expédition n'est pas taxée non plus
  const aucuneTaxe = !!articles && base <= 0;
  const fraisTaxables = aucuneTaxe ? 0 : fraisExp;
  const diviseur = incluses ? 1 + (tx.tps || 0) + (tx.tvq || 0) + (tx.tvh || 0) + (tx.tvp || 0) : 1;
  const tps = arrondi2((base + fraisTaxables) * tx.tps / diviseur);
  const tvq = arrondi2((base + fraisTaxables) * tx.tvq / diviseur);
  const tvh = arrondi2((base + fraisTaxables) * tx.tvh / diviseur);
  const tvp = arrondi2((base + fraisTaxables) * (tx.tvp || 0) / diviseur);
  const total_taxes = tps + tvq + tvh + tvp;
  return {
    sous_total: sousTotal,
    frais_expedition: fraisExp,
    tps: tps.toFixed(2),
    tvq: tvq.toFixed(2),
    tvh: tvh.toFixed(2),
    tvp: tvp.toFixed(2),
    total_taxes: total_taxes.toFixed(2),
    pourboire: Math.max(0, parseFloat(pourboire) || 0),
    total: (sousTotal + fraisExp + (incluses ? 0 : total_taxes) + Math.max(0, parseFloat(pourboire) || 0)).toFixed(2),
    taxes_incluses: !!incluses,
    label_taxe: tx.label,
    aucune_taxe: aucuneTaxe,
    province,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// PANIER
// ══════════════════════════════════════════════════════════════════════════════

// Prix unitaire et stock disponible d'un produit, ou de la variante choisie.
// Variantes : [{ nom, prix (vide = prix du produit), stock (vide = stock du produit) }] ; stock vide = illimité.
function prixEtStock(produit, nomVariante, gererStock = true) {
  const base = Number(produit.prix) || 0;
  const promo = produit.prix_promo !== null && produit.prix_promo !== undefined ? Number(produit.prix_promo) : 0;
  const prixProduit = promo > 0 && promo < base ? promo : base;
  // gererStock = false (Config produits → Gérer l'inventaire) : le stock n'est plus suivi, les ventes continuent même à 0
  const stockProduit = !gererStock || produit.stock === null || produit.stock === undefined ? 999999 : Math.max(0, Number(produit.stock) || 0);
  let vars = produit.variantes;
  if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = []; } }
  vars = Array.isArray(vars) ? vars.filter((v) => v && typeof v.nom === 'string' && v.nom.trim()) : [];
  if (!vars.length) return nomVariante ? { erreur: 'Variante inconnue.' } : { prix: prixProduit, stock: stockProduit };
  if (!nomVariante) return { erreur: 'Choisissez une variante.' };
  const v = vars.find((x) => x.nom.trim() === nomVariante);
  if (!v) return { erreur: 'Variante inconnue.' };
  const prixVar = v.prix === null || v.prix === undefined || v.prix === '' || !(Number(v.prix) >= 0) ? prixProduit : Number(v.prix);
  const stockVar = !gererStock ? 999999 : v.stock === null || v.stock === undefined || v.stock === '' ? stockProduit : Math.max(0, Math.trunc(Number(v.stock)) || 0);
  return { prix: prixVar, stock: stockVar };
}

// GET /api/marketplace/:gid/panier
router.get('/:gid/panier', authMV, async (req, res) => {
  const { gid } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    // Add-on « Faire une offre » : un article au prix négocié dont l'offre a expiré (ou été retirée) quitte le panier — nettoyage fait à la lecture, sans tâche planifiée
    const avertNego = [];
    try {
      const perdus = await pool.query(
        `DELETE FROM marketplace_panier mp USING negociations n
          WHERE mp.negociation_id = n.id AND mp.acheteur_id = $1 AND mp.gestionnaire_id = $2 AND NOT (n.statut = 'acceptee' AND n.expire_le > NOW())
          RETURNING mp.titre`, [acheteurId, gid]);
      for (const x of perdus.rows) avertNego.push({ message: `Le prix négocié de « ${x.titre} » n'est plus valide : l'article a été retiré de votre panier.` });
    } catch (e) { console.error('[panier] offres expirées :', e.message); }
    // Annonce expirée (date d'expiration passée) : l'article quitte le panier — nettoyage fait à la lecture. Les articles gagnés aux enchères restent.
    try {
      const expires = await pool.query(
        `DELETE FROM marketplace_panier mp USING produits p
          WHERE p.id = NULLIF(regexp_replace(mp.produit_id, '[^0-9].*$', ''), '')::int AND mp.acheteur_id = $1 AND mp.gestionnaire_id = $2
            AND mp.enchere_id IS NULL AND p.date_expiration IS NOT NULL AND p.date_expiration <= NOW() RETURNING mp.titre`, [acheteurId, gid]);
      for (const x of expires.rows) avertNego.push({ message: `« ${x.titre} » n'est plus disponible (annonce expirée) : l'article a été retiré de votre panier.` });
    } catch (e) { console.error('[panier] annonces expirées :', e.message); }
    const r = await pool.query(
      `SELECT mp.*, mp.collaborateur_id AS vendeur_id, COALESCE(mc.nom_boutique, mc.nom_responsable) AS vendeur_nom,
              (SELECT p.quantite_min FROM produits p WHERE p.id = NULLIF(regexp_replace(mp.produit_id, '[^0-9].*$', ''), '')::int) AS quantite_min
       FROM marketplace_panier mp
       JOIN marketplace_collaborateurs mc ON mc.id = mp.collaborateur_id
       WHERE mp.acheteur_id = $1 AND mp.gestionnaire_id = $2
       ORDER BY mp.created_at ASC`,
      [acheteurId, gid]
    );
    // Quantité minimum d'achat (Config produits) : on avertit ici, et le paiement est refusé tant que ce n'est pas respecté
    const regP = await regles.lire(gid, pool);
    const avertissements = [...avertNego];
    if (regP.qteMinActive) {
      const parVendeur = new Map();
      for (const l of r.rows) { if (!parVendeur.has(l.vendeur_id)) parVendeur.set(l.vendeur_id, []); parVendeur.get(l.vendeur_id).push({ produit_id: l.produit_id, titre: l.titre, quantite: l.quantite, quantite_min: l.quantite_min, enchere_id: l.enchere_id }); }
      for (const [vendeurId, lignes] of parVendeur) for (const a of regles.verifierQuantitesMin(regP, lignes)) avertissements.push({ vendeur_id: vendeurId, produit_id: a.produit_id, message: a.message });
    }
    // Prix à jour (offres du jour qui commencent ou se terminent) : le panier affiche le prix que le paiement facturera, jamais un prix périmé
    try {
      const ids = [...new Set(r.rows.filter((l) => !l.enchere_id && !l.negociation_id).map((l) => parseInt(l.produit_id, 10)).filter((n) => Number.isInteger(n) && n > 0))];
      if (ids.length) {
        const pr = await pool.query(`SELECT id, prix, ${OFFRES.sqlPromo('produits')} AS prix_promo, stock, variantes, paliers FROM produits WHERE gestionnaire_id = $1 AND id = ANY($2::int[])`, [parseInt(gid, 10), ids]);
        const palActif = pr.rows.some((x) => x.paliers) && await PALIERS.actifPourBoutique(gid);
        const parId = new Map(pr.rows.map((x) => [x.id, x]));
        for (const l of r.rows) {
          const prod = l.enchere_id || l.negociation_id ? null : parId.get(parseInt(l.produit_id, 10));
          if (!prod) continue;
          const c = prixEtStock(prod, l.variante || '', regP.gererStock);
          if (!c.erreur && palActif && prod.paliers) c.prix = PALIERS.prixPourQuantite(prod.paliers, l.variante || '', parseInt(l.quantite, 10) || 1, c.prix);
          if (!c.erreur && Number.isFinite(c.prix) && Math.abs(c.prix - Number(l.prix)) > 0.004) {
            await pool.query('UPDATE marketplace_panier SET prix = $1 WHERE id = $2', [c.prix, l.id]);
            l.prix = c.prix;
          }
        }
      }
    } catch (e) { console.error('[panier] prix à jour :', e.message); }
    res.json({ articles: await taxesMV.marquerLignes(pool, parseInt(gid, 10), r.rows), avertissements });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/marketplace/:gid/panier
router.post('/:gid/panier', authMV, async (req, res) => {
  const { gid } = req.params;
  const acheteurId = req.mvUser.id;
  const { produit_id, image_url, quantite } = req.body;
  const nomVariante = typeof req.body.variante === 'string' ? req.body.variante.trim().slice(0, 60) : '';
  const qte = parseInt(quantite, 10);

  if (!produit_id || !Number.isInteger(qte) || qte < 1 || qte > 999) return res.status(400).json({ error: 'Champs manquants' });

  try {
    const prodRes = await pool.query(
      `SELECT id, collaborateur_id, titre, photo_principale, prix, ${OFFRES.sqlPromo('produits')} AS prix_promo, stock, variantes, date_parution, date_expiration FROM produits WHERE id = $1 AND statut = $2 AND gestionnaire_id = $3 AND collaborateur_id IS NOT NULL`,
      [parseInt(produit_id), 'actif', gid]
    );
    if (!prodRes.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });
    if (prodRes.rows[0].date_expiration && new Date(prodRes.rows[0].date_expiration).getTime() <= Date.now()) return res.status(409).json({ error: "Cette annonce n'est plus disponible (date d'expiration dépassée)." });

    const produit = prodRes.rows[0];
    const collaborateurId = produit.collaborateur_id;
    // Parution future : pas d'achat avant la date d'ouverture de la vente
    if (produit.date_parution && new Date(produit.date_parution).getTime() > Date.now()) return res.status(409).json({ error: 'Cet article sera disponible à la vente le ' + new Date(produit.date_parution).toLocaleString('fr-CA', { timeZone: 'America/Toronto', dateStyle: 'long', timeStyle: 'short' }) + '.' });

    // Vendeur en vacances avec annonces masquées : on n'ajoute rien au panier
    const vacs = await vacMV.etat(pool, parseInt(gid, 10), collaborateurId);
    if (vacs && vacs.mode === 'masque') return res.status(409).json({ error: vacMV.texteBlocage(vacs) });

    // Prix et stock viennent de la base (jamais du navigateur) ; la variante choisie les remplace si elle en a.
    const choix = prixEtStock(produit, nomVariante, (await regles.lire(gid, pool)).gererStock);
    if (choix.erreur) return res.status(400).json({ error: choix.erreur });

    const existant = await pool.query(
      `SELECT id, quantite FROM marketplace_panier WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND produit_id=$3 AND COALESCE(variante,'') = $4 AND negociation_id IS NULL AND enchere_id IS NULL`,
      [acheteurId, gid, produit_id.toString(), nomVariante]
    );
    const dejaDansPanier = existant.rows[0] ? existant.rows[0].quantite : 0;
    if (dejaDansPanier + qte > choix.stock) {
      return res.status(409).json({ error: choix.stock <= 0 ? 'Cet article est épuisé.' : `Stock insuffisant : il n'en reste que ${choix.stock}${dejaDansPanier ? ` (vous en avez déjà ${dejaDansPanier} dans votre panier)` : ''}.` });
    }

    if (existant.rows[0]) {
      await pool.query(
        'UPDATE marketplace_panier SET quantite=$1, prix=$2, updated_at=NOW() WHERE id=$3',
        [dejaDansPanier + qte, choix.prix, existant.rows[0].id]
      );
      return res.json({ message: 'Quantite mise a jour', id: existant.rows[0].id });
    }

    const titreFinal = nomVariante ? `${produit.titre} — ${nomVariante}` : produit.titre;
    const ins = await pool.query(
      `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite, variante)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [gid, acheteurId, collaborateurId, produit_id.toString(), titreFinal, image_url || produit.photo_principale || null, choix.prix, qte, nomVariante || null]
    );
    res.status(201).json({ message: 'Article ajoute', id: ins.rows[0].id });
  } catch (err) { console.error('POST panier:', err.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/marketplace/:gid/panier/:id
router.patch('/:gid/panier/:id', authMV, async (req, res) => {
  const { gid, id } = req.params;
  const { quantite } = req.body;
  const acheteurId = req.mvUser.id;
  const qte = parseInt(quantite, 10);
  if (!Number.isInteger(qte) || qte < 1 || qte > 999) return res.status(400).json({ error: 'Quantite invalide' });
  try {
    const l = await pool.query(
      `SELECT mp.variante, mp.enchere_id, mp.negociation_id, p.prix, ${OFFRES.sqlPromo('p')} AS prix_promo, p.stock, p.variantes
         FROM marketplace_panier mp LEFT JOIN produits p ON p.id = NULLIF(regexp_replace(mp.produit_id, '[^0-9].*$', ''), '')::int
        WHERE mp.id=$1 AND mp.acheteur_id=$2 AND mp.gestionnaire_id=$3`, [id, acheteurId, gid]);
    if (!l.rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    if (l.rows[0].enchere_id) return res.status(409).json({ error: 'Article gagné aux enchères : la quantité ne peut pas être modifiée.' });
    if (l.rows[0].negociation_id) return res.status(409).json({ error: 'Prix négocié : la quantité est fixée à 1.' });
    if (l.rows[0].prix !== null) {
      const c = prixEtStock(l.rows[0], l.rows[0].variante || '', (await regles.lire(gid, pool)).gererStock);
      if (!c.erreur && qte > c.stock) return res.status(409).json({ error: c.stock <= 0 ? 'Cet article est épuisé.' : `Stock insuffisant : il n'en reste que ${c.stock}.` });
    }
    await pool.query(
      'UPDATE marketplace_panier SET quantite=$1, updated_at=NOW() WHERE id=$2 AND acheteur_id=$3 AND gestionnaire_id=$4',
      [qte, id, acheteurId, gid]
    );
    res.json({ message: 'Quantite mise a jour' });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/marketplace/:gid/panier/:id
router.delete('/:gid/panier/:id', authMV, async (req, res) => {
  const { gid, id } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    await pool.query('DELETE FROM marketplace_panier WHERE id=$1 AND acheteur_id=$2 AND gestionnaire_id=$3', [id, acheteurId, gid]);
    res.json({ message: 'Article supprime' });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// DELETE /api/marketplace/:gid/panier (vider)
router.delete('/:gid/panier', authMV, async (req, res) => {
  const { gid } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    await pool.query('DELETE FROM marketplace_panier WHERE acheteur_id=$1 AND gestionnaire_id=$2', [acheteurId, gid]);
    res.json({ message: 'Panier vide' });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ── PLUS TARD ────────────────────────────────────────────────────────────────
router.get('/:gid/panier/plus-tard', authMV, async (req, res) => {
  const { gid } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    const r = await pool.query(
      'SELECT * FROM marketplace_panier_plus_tard WHERE acheteur_id=$1 AND gestionnaire_id=$2 ORDER BY created_at DESC',
      [acheteurId, gid]
    );
    res.json({ articles: r.rows });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/:gid/panier/:id/plus-tard', authMV, async (req, res) => {
  const { gid, id } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    const art = await pool.query('SELECT * FROM marketplace_panier WHERE id=$1 AND acheteur_id=$2', [id, acheteurId]);
    if (!art.rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    const a = art.rows[0];
    if (a.enchere_id) return res.status(409).json({ error: 'Un article gagné aux enchères ne peut pas être mis de côté : payez-le avant la fin du délai.' });
    if (a.negociation_id) return res.status(409).json({ error: 'Un article au prix négocié ne peut pas être mis de côté : payez-le avant la fin du délai.' });
    await pool.query(
      'INSERT INTO marketplace_panier_plus_tard (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING',
      [gid, acheteurId, a.collaborateur_id, a.produit_id, a.titre, a.image_url, a.prix]
    );
    await pool.query('DELETE FROM marketplace_panier WHERE id=$1', [id]);
    res.json({ message: 'Article mis de cote' });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.post('/:gid/panier/plus-tard/:id/remettre', authMV, async (req, res) => {
  const { gid, id } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    const art = await pool.query('SELECT * FROM marketplace_panier_plus_tard WHERE id=$1 AND acheteur_id=$2', [id, acheteurId]);
    if (!art.rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    const a = art.rows[0];
    await pool.query(
      `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite)
       VALUES ($1,$2,$3,$4,$5,$6,$7,1)
       ON CONFLICT (acheteur_id, gestionnaire_id, produit_id) DO UPDATE SET quantite = marketplace_panier.quantite + 1`,
      [gid, acheteurId, a.collaborateur_id, a.produit_id, a.titre, a.image_url, a.prix]
    );
    await pool.query('DELETE FROM marketplace_panier_plus_tard WHERE id=$1', [id]);
    res.json({ message: 'Article remis au panier' });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

router.delete('/:gid/panier/plus-tard/:id', authMV, async (req, res) => {
  const { gid, id } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    await pool.query('DELETE FROM marketplace_panier_plus_tard WHERE id=$1 AND acheteur_id=$2 AND gestionnaire_id=$3', [id, acheteurId, gid]);
    res.json({ message: 'Article supprime' });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// CHECKOUT
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/marketplace/:gid/checkout/infos?collaborateur_id=X
router.get('/:gid/checkout/infos', authMV, async (req, res) => {
  const { gid } = req.params;
  const { collaborateur_id, province } = req.query;
  const acheteurId = req.mvUser.id;

  if (!collaborateur_id) return res.status(400).json({ error: 'collaborateur_id requis' });

  try {
    const panierRes = await pool.query(
      `SELECT mp.*
       FROM marketplace_panier mp
       WHERE mp.acheteur_id=$1 AND mp.gestionnaire_id=$2 AND mp.collaborateur_id=$3
       ORDER BY mp.created_at ASC`,
      [acheteurId, gid, collaborateur_id]
    );

    if (!panierRes.rows.length) return res.status(404).json({ error: 'Panier vide pour ce collaborateur' });

    const acheteurRes = await pool.query(
      'SELECT id, prenom, nom, email, telephone FROM marketplace_acheteurs WHERE id=$1 AND gestionnaire_id=$2',
      [acheteurId, gid]
    );
    const collabRes = await pool.query(
      'SELECT id, nom_boutique, nom_responsable, email, statut FROM marketplace_collaborateurs WHERE id=$1 AND gestionnaire_id=$2',
      [collaborateur_id, gid]
    );

    const articles = await taxesMV.marquerLignes(pool, parseInt(gid, 10), panierRes.rows);
    const sousTotal = articles.reduce((s, a) => s + parseFloat(a.prix) * a.quantite, 0);
    const tousNumeriques = articles.every(a => a.produit_numerique === true);
    const panierMixte = !tousNumeriques && articles.some(a => a.produit_numerique === true);

    // Expédition : méthodes choisies pour les annonces du panier (voir services/studio_expedition.js).
    // Sans méthode configurée : livraison gratuite. Province non desservie : aucune méthode + expedition_indisponible.
    let methodesExpedition = [];
    let expeditionIndisponible = false;
    let gratuiteGlobale = false;
    const codeProvince = String(province || 'QC').toUpperCase().slice(0, 2);
    if (!tousNumeriques) {
      const r = await expMV.methodesPourPanier(pool, { collaborateurId: parseInt(collaborateur_id, 10), lignes: articles, sousTotal, province: codeProvince });
      methodesExpedition = r.methodes;
      expeditionIndisponible = r.indisponible;
      gratuiteGlobale = r.gratuite_globale;
    }

    const vacancesCollab = await vacMV.etat(pool, parseInt(gid, 10), parseInt(collaborateur_id, 10));

    const peutEncaisser = await paiement.collaborateurPeutEncaisser(parseInt(gid, 10), parseInt(collaborateur_id, 10));
    res.json({
      articles,
      sous_total: sousTotal,
      tous_numeriques: tousNumeriques,
      panier_mixte: panierMixte,
      collaborateur: collabRes.rows[0] || null,
      vendeur: collabRes.rows[0] ? { // compatibilite avec Checkout.tsx
        id: collabRes.rows[0].id,
        nom: collabRes.rows[0].nom_responsable,
        nom_boutique: collabRes.rows[0].nom_boutique,
        ville: '',
        stripe_actif: peutEncaisser, // Stripe du gestionnaire configuré + compte Stripe du collaborateur actif
        paypal_actif: false,
        stripe_compte_id: null,
        paypal_email: null,
      } : null,
      acheteur: acheteurRes.rows[0] || null,
      adresses: [],
      methodes_expedition: methodesExpedition,
      expedition_indisponible: expeditionIndisponible,
      vacances: vacancesCollab,
      achat_bloque: !!(vacancesCollab && vacancesCollab.mode === 'masque' && panierRes.rows.some((l) => !l.enchere_id)),
      livraison_gratuite_globale: gratuiteGlobale,
    });
  } catch (err) {
    console.error('GET checkout/infos:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/marketplace/:gid/checkout/taxes
// Avec code_promo + collaborateur_id : les taxes sont calculées sur le prix APRÈS rabais, et le total renvoyé est déjà net.
router.post('/:gid/checkout/taxes', authMV, async (req, res) => {
  const { sous_total, frais_expedition, province, articles, pourboire, code_promo, collaborateur_id } = req.body || {};
  try {
    const sous = parseFloat(sous_total) || 0;
    const frais = parseFloat(frais_expedition) || 0;
    const prov = province || 'QC';
    const collabId = parseInt(collaborateur_id, 10);
    // La taxe de chaque article vient du serveur (collaborateur inscrit × catégorie), jamais du navigateur
    const tableTaux = await taxesMV.chargerTable(pool, parseInt(req.params.gid, 10));
    const rgCmd = await regCmd.lire(parseInt(req.params.gid, 10), pool);
    const incl = rgCmd.taxesIncluses;
    // Pourboire : selon la configuration (désactivé = jamais)
    const tip = rgCmd.pourboire === 'desactive' ? 0 : pourboire;
    let articlesTaxes = articles;
    if (collabId) {
      const pan = await pool.query(
        'SELECT produit_id, prix, quantite FROM marketplace_panier WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND collaborateur_id=$3',
        [req.mvUser.id, parseInt(req.params.gid, 10), collabId]);
      if (pan.rows.length) articlesTaxes = await taxesMV.marquerLignes(pool, parseInt(req.params.gid, 10), pan.rows);
    }
    if (code_promo && String(code_promo).trim() && collabId) {
      try {
        const r = await promo.apercu({ gid: parseInt(req.params.gid, 10), acheteurId: req.mvUser.id, collaborateurId: collabId, code: code_promo });
        const nettes = r.lignes.map((l, i) => ({
          prix: (Math.round(parseFloat(l.prix) * 100) * (parseInt(l.quantite, 10) || 0) - r.alloc[i]) / 100,
          quantite: 1, facturation_taxes: l.facturation_taxes,
        }));
        const rabais = r.rabaisC / 100;
        const t = calculerTaxesProvince(Math.max(0, sous - rabais), frais, prov, nettes, tip, tableTaux, incl);
        return res.json({ ...t, sous_total: sous, rabais: rabais.toFixed(2), code_promo: r.code });
      } catch (e) {
        if (!(e instanceof promo.ErreurPromo)) throw e;
        // Code devenu invalide : taxes normales, et le navigateur retire le code
        const t = calculerTaxesProvince(sous, frais, prov, articlesTaxes, tip, tableTaux, incl);
        return res.json({ ...t, rabais: '0.00', code_promo_erreur: e.message });
      }
    }
    res.json(calculerTaxesProvince(sous, frais, prov, articlesTaxes, tip, tableTaux, incl));
  } catch (err) { res.status(500).json({ error: 'Erreur calcul taxes' }); }
});

// Frais d'expédition recalculés côté serveur (jamais ceux envoyés par le navigateur).
// ctx : { collaborateurId, province, sousTotalNet } — le seuil « livraison gratuite » se juge sur le montant après rabais.
async function fraisExpedition(client, lignes, sousTotal, methodeId, ctx) {
  return expMV.fraisPourPaiement(client, {
    collaborateurId: ctx.collaborateurId, lignes, sousTotal, sousTotalNet: ctx.sousTotalNet, province: ctx.province, methodeId,
  });
}

// GET /api/marketplace/:gid/produits/:produitId/methodes-expedition — public : options d'expédition affichées sur la page produit
router.get('/:gid/produits/:produitId/methodes-expedition', async (req, res) => {
  const gid = parseInt(req.params.gid, 10);
  const pid = parseInt(req.params.produitId, 10);
  if (!gid || !pid) return res.status(400).json({ error: 'Requête invalide' });
  try {
    const p = (await pool.query(`SELECT collaborateur_id FROM produits WHERE id = $1 AND gestionnaire_id = $2 AND statut = 'actif'`, [pid, gid])).rows[0];
    if (!p) return res.status(404).json({ error: 'Produit introuvable' });
    let rows = [];
    try {
      rows = (await pool.query(
        `SELECT vme.* FROM collab_produit_methodes_expedition pme JOIN collab_methodes_expedition vme ON vme.id = pme.methode_id
          WHERE pme.produit_id = $1 AND vme.actif = true AND vme.collaborateur_id = $2 ORDER BY vme.transporteur_id`, [pid, p.collaborateur_id])).rows;
    } catch (e) { rows = []; }
    const devMethodes = await cfgMV.devise(parseInt(req.params.gid, 10), pool);
    const methodes = rows.length
      ? rows.map((m) => ({ ...expMV.enrichir(m, null, 0, 'QC'), libelle_prix: expMV.libellePrix(m, devMethodes) }))
      : [{ ...expMV.GRATUITE_PAR_DEFAUT, libelle_prix: 'Gratuit' }];
    const c = await expMV.infosCollab(pool, p.collaborateur_id);
    res.json({
      methodes,
      livraison_gratuite_globale: c && c.livraison_gratuite_globale_actif && Number(c.livraison_gratuite_globale_seuil) > 0
        ? { seuil: Number(c.livraison_gratuite_globale_seuil), provinces: c.livraison_gratuite_globale_provinces || [] } : null,
    });
  } catch (err) { console.error('GET produit methodes-expedition:', err.message); res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST /api/marketplace/:gid/checkout/commande
// Le navigateur n'envoie que le collaborateur, l'adresse, le mode d'expédition et une note.
// Prix, stock, expédition, taxes et commission sont recalculés ici ; le stock est réservé ; la réponse
// contient checkout_url : la page de paiement Stripe où rediriger l'acheteur.
router.post('/:gid/checkout/commande', authMV, async (req, res) => {
  const { gid } = req.params;
  const b = req.body || {};
  // Le Checkout envoie vendeur_id / infos_livraison / note_acheteur ; on accepte aussi les noms « collaborateur ».
  const collaborateurId = parseInt(b.collaborateur_id ?? b.vendeur_id, 10);
  if (!Number.isInteger(collaborateurId)) return res.status(400).json({ error: 'collaborateur_id requis' });
  const adr = b.adresse_livraison ?? b.infos_livraison;
  const adresse = adr && typeof adr === 'object' && !Array.isArray(adr) ? adr : {};
  if (JSON.stringify(adresse).length > 4000) return res.status(400).json({ error: 'Adresse invalide' });
  try {
    const r = await paiement.creerCommandePayable({
      gid: parseInt(gid, 10), acheteurId: req.mvUser.id, collaborateurId, adresse,
      methodeId: b.methode_expedition_id, note: b.note_vendeur ?? b.note_acheteur, pourboire: b.pourboire,
      codePromo: typeof b.code_promo === 'string' ? b.code_promo : '',
      outils: { prixEtStock, calculerTaxesProvince, fraisExpedition },
    });
    res.status(201).json({ ...r, stripe_url: r.checkout_url, message: 'Commande creee avec succes' });
  } catch (err) {
    if (err instanceof paiement.ErreurPaiement) return res.status(err.status).json({ error: err.message });
    console.error('POST checkout/commande:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/marketplace/:gid/checkout/code-promo   { code, collaborateur_id }
// Vérifie le code dans la boutique du collaborateur et renvoie le rabais en $ calculé sur le panier réel de l'acheteur.
// Limite d'essais (anti-devinette) : 15 tentatives / 10 min par acheteur.
const essaisPromo = new Map();
router.post('/:gid/checkout/code-promo', authMV, async (req, res) => {
  const gid = parseInt(req.params.gid, 10);
  const b = req.body || {};
  const collaborateurId = parseInt(b.collaborateur_id ?? b.vendeur_id, 10);
  if (!Number.isInteger(collaborateurId)) return res.status(400).json({ success: false, message: 'Boutique manquante.' });
  const cle = `${gid}:${req.mvUser.id}`;
  const now = Date.now();
  const liste = (essaisPromo.get(cle) || []).filter((t) => now - t < 600000);
  if (liste.length >= 15) return res.status(429).json({ success: false, message: 'Trop d\'essais. Réessayez dans quelques minutes.' });
  liste.push(now); essaisPromo.set(cle, liste);
  if (essaisPromo.size > 5000) { for (const [k, v] of essaisPromo) if (!v.some((t) => now - t < 600000)) essaisPromo.delete(k); }
  try {
    const r = await promo.apercu({ gid, acheteurId: req.mvUser.id, collaborateurId, code: b.code });
    res.json({
      success: true, code: r.code, rabais: (r.rabaisC / 100).toFixed(2), reduction_id: r.reduction.id,
      type: r.reduction.type, valeur: Number(r.reduction.valeur), message: 'Code promo appliqué',
    });
  } catch (err) {
    if (err instanceof promo.ErreurPromo) return res.status(err.status).json({ success: false, message: err.message });
    console.error('POST checkout/code-promo:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;