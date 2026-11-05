// CHEMIN : routes/marketplace-panier.js
// e-Vend Studio — Panier + Checkout scopés par gestionnaire_id
// A monter : app.use('/api/marketplace', require('./routes/marketplace-panier'));
// Utilise les tables : marketplace_panier, marketplace_commandes, marketplace_acheteurs, marketplace_collaborateurs

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const jwt     = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Middleware auth marketplace ──────────────────────────────────────────────
// Cookie httpOnly mv_token_<gid> (posé par marketplace-auth.js), avec repli sur
// l'en-tête Authorization. Le jeton doit appartenir à CETTE boutique et à un
// acheteur : un collaborateur n'a pas de panier.
function authMV(req, res, next) {
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
    req.mvUser = payload;
    next();
  } catch { res.status(401).json({ message: 'Token invalide' }); }
}

// ─── TAUX DE TAXES PAR PROVINCE ──────────────────────────────────────────────
const TAXES = {
  AB: { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
  BC: { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS + TVP (7%)' },
  MB: { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS + TVP (7%)' },
  NB: { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  NL: { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  NS: { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  ON: { tps: 0,    tvq: 0,       tvh: 0.13, label: 'TVH' },
  PE: { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  QC: { tps: 0.05, tvq: 0.09975, tvh: 0,    label: 'TPS + TVQ' },
  SK: { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS + TVP (6%)' },
  NT: { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
  NU: { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
  YT: { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
};

function calculerTaxesProvince(sousTotal, fraisExp, province, articles) {
  const tx = TAXES[province] || TAXES['QC'];
  const base = articles
    ? articles.reduce((s, a) => s + (a.facturation_taxes !== false ? parseFloat(a.prix) * a.quantite : 0), 0)
    : sousTotal;
  const tps = parseFloat(((base + fraisExp) * tx.tps).toFixed(2));
  const tvq = parseFloat(((base + fraisExp) * tx.tvq).toFixed(2));
  const tvh = parseFloat(((base + fraisExp) * tx.tvh).toFixed(2));
  const total_taxes = tps + tvq + tvh;
  return {
    sous_total: sousTotal,
    frais_expedition: fraisExp,
    tps: tps.toFixed(2),
    tvq: tvq.toFixed(2),
    tvh: tvh.toFixed(2),
    total_taxes: total_taxes.toFixed(2),
    total: (sousTotal + fraisExp + total_taxes).toFixed(2),
    label_taxe: tx.label,
    province,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// PANIER
// ══════════════════════════════════════════════════════════════════════════════

// Prix unitaire et stock disponible d'un produit, ou de la variante choisie.
// Variantes : [{ nom, prix (vide = prix du produit), stock (vide = stock du produit) }] ; stock vide = illimité.
function prixEtStock(produit, nomVariante) {
  const base = Number(produit.prix) || 0;
  const promo = produit.prix_promo !== null && produit.prix_promo !== undefined ? Number(produit.prix_promo) : 0;
  const prixProduit = promo > 0 && promo < base ? promo : base;
  const stockProduit = produit.stock === null || produit.stock === undefined ? 999999 : Math.max(0, Number(produit.stock) || 0);
  let vars = produit.variantes;
  if (typeof vars === 'string') { try { vars = JSON.parse(vars); } catch (e) { vars = []; } }
  vars = Array.isArray(vars) ? vars.filter((v) => v && typeof v.nom === 'string' && v.nom.trim()) : [];
  if (!vars.length) return nomVariante ? { erreur: 'Variante inconnue.' } : { prix: prixProduit, stock: stockProduit };
  if (!nomVariante) return { erreur: 'Choisissez une variante.' };
  const v = vars.find((x) => x.nom.trim() === nomVariante);
  if (!v) return { erreur: 'Variante inconnue.' };
  const prixVar = v.prix === null || v.prix === undefined || v.prix === '' || !(Number(v.prix) >= 0) ? prixProduit : Number(v.prix);
  const stockVar = v.stock === null || v.stock === undefined || v.stock === '' ? stockProduit : Math.max(0, Math.trunc(Number(v.stock)) || 0);
  return { prix: prixVar, stock: stockVar };
}

// GET /api/marketplace/:gid/panier
router.get('/:gid/panier', authMV, async (req, res) => {
  const { gid } = req.params;
  const acheteurId = req.mvUser.id;
  try {
    const r = await pool.query(
      `SELECT mp.*, COALESCE(mc.nom_boutique, mc.nom_responsable) AS vendeur_nom
       FROM marketplace_panier mp
       JOIN marketplace_collaborateurs mc ON mc.id = mp.collaborateur_id
       WHERE mp.acheteur_id = $1 AND mp.gestionnaire_id = $2
       ORDER BY mp.created_at ASC`,
      [acheteurId, gid]
    );
    res.json({ articles: r.rows });
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
      'SELECT id, collaborateur_id, titre, photo_principale, prix, prix_promo, stock, variantes FROM produits WHERE id = $1 AND statut = $2 AND gestionnaire_id = $3 AND collaborateur_id IS NOT NULL',
      [parseInt(produit_id), 'actif', gid]
    );
    if (!prodRes.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const produit = prodRes.rows[0];
    const collaborateurId = produit.collaborateur_id;

    // Prix et stock viennent de la base (jamais du navigateur) ; la variante choisie les remplace si elle en a.
    const choix = prixEtStock(produit, nomVariante);
    if (choix.erreur) return res.status(400).json({ error: choix.erreur });

    const existant = await pool.query(
      `SELECT id, quantite FROM marketplace_panier WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND produit_id=$3 AND COALESCE(variante,'') = $4`,
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
      `SELECT mp.variante, p.prix, p.prix_promo, p.stock, p.variantes
         FROM marketplace_panier mp LEFT JOIN produits p ON p.id = NULLIF(regexp_replace(mp.produit_id, '[^0-9].*$', ''), '')::int
        WHERE mp.id=$1 AND mp.acheteur_id=$2 AND mp.gestionnaire_id=$3`, [id, acheteurId, gid]);
    if (!l.rows[0]) return res.status(404).json({ error: 'Article introuvable' });
    if (l.rows[0].prix !== null) {
      const c = prixEtStock(l.rows[0], l.rows[0].variante || '');
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

    const articles = panierRes.rows;
    const sousTotal = articles.reduce((s, a) => s + parseFloat(a.prix) * a.quantite, 0);
    const tousNumeriques = articles.every(a => a.produit_numerique === true);
    const panierMixte = !tousNumeriques && articles.some(a => a.produit_numerique === true);

    // Expedition : cherche les methodes du collaborateur (table vendeur_methodes_expedition par vendeur_id=collab.id)
    let methodesExpedition = [];
    if (!tousNumeriques) {
      const produitIds = articles.filter(a => !a.produit_numerique).map(a => parseInt(a.produit_id)).filter(Boolean);
      if (produitIds.length) {
        // Les tables de méthodes d'expédition n'existent pas encore dans Studio : sans elles, livraison gratuite.
        let methRes = { rows: [] };
        try {
          methRes = await pool.query(
            `SELECT DISTINCT vme.*
             FROM produit_methodes_expedition pme
             JOIN vendeur_methodes_expedition vme ON vme.id = pme.methode_id
             WHERE pme.produit_id = ANY($1::int[]) AND vme.actif = true
             ORDER BY vme.frais_fixes ASC NULLS LAST`,
            [produitIds]
          );
        } catch (e) { methRes = { rows: [] }; }
        const codeProvince = province || 'QC';
        methodesExpedition = methRes.rows.map(m => ({
          id: m.id,
          nom: m.nom || 'Expedition',
          logo: '📦',
          mode_calcul: m.mode_calcul || 'fixe',
          frais_fixes: parseFloat(m.frais_fixes) || 0,
          frais_par_kg: parseFloat(m.frais_par_kg) || 0,
          gratuit_superieur: m.gratuit_superieur ? parseFloat(m.gratuit_superieur) : null,
          delais_estime: m.delais_estime || '',
          frais_calcule: parseFloat(m.frais_fixes) || 0,
          detail_calcul: '',
          gratuit: (parseFloat(m.frais_fixes) || 0) === 0,
          ramassage: false,
          non_disponible: false,
          gratuit_applique: sousTotal >= (parseFloat(m.gratuit_superieur) || Infinity),
        }));
      }
      if (!methodesExpedition.length) {
        // Fallback livraison gratuite
        methodesExpedition = [{ id: -1, nom: 'Livraison gratuite', logo: '🎁', mode_calcul: 'fixe', frais_fixes: 0, frais_calcule: 0, delais_estime: 'Variable', gratuit: true, ramassage: false, non_disponible: false, gratuit_applique: true }];
      }
    }

    res.json({
      articles,
      sous_total: sousTotal,
      tous_numeriques: tousNumeriques,
      panier_mixte: panierMixte,
      collaborateur: collabRes.rows[0] || null,
      vendeur: collabRes.rows[0] ? { // compatibilite avec CheckoutEvend.tsx
        id: collabRes.rows[0].id,
        nom: collabRes.rows[0].nom_responsable,
        nom_boutique: collabRes.rows[0].nom_boutique,
        ville: '',
        stripe_actif: false, // paiement gere par gestionnaire
        paypal_actif: false,
        stripe_compte_id: null,
        paypal_email: null,
      } : null,
      acheteur: acheteurRes.rows[0] || null,
      adresses: [],
      methodes_expedition: methodesExpedition,
    });
  } catch (err) {
    console.error('GET checkout/infos:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/marketplace/:gid/checkout/taxes
router.post('/:gid/checkout/taxes', authMV, async (req, res) => {
  const { sous_total, frais_expedition, province, articles } = req.body;
  try {
    const taxes = calculerTaxesProvince(
      parseFloat(sous_total) || 0,
      parseFloat(frais_expedition) || 0,
      province || 'QC',
      articles
    );
    res.json(taxes);
  } catch (err) { res.status(500).json({ error: 'Erreur calcul taxes' }); }
});

// POST /api/marketplace/:gid/checkout/commande
router.post('/:gid/checkout/commande', authMV, async (req, res) => {
  const { gid } = req.params;
  const acheteurId = req.mvUser.id;
  const { collaborateur_id, articles, adresse_livraison, adresse_facturation, methode_expedition_id, taxes, note_vendeur } = req.body;

  try {
    const total = parseFloat(taxes?.total) || articles.reduce((s, a) => s + parseFloat(a.prix) * a.quantite, 0);
    const numeroCommande = `MV-${gid}-${Date.now()}`;

    const commandeRes = await pool.query(
      `INSERT INTO marketplace_commandes
        (gestionnaire_id, acheteur_id, collaborateur_id, numero_commande, statut, total, articles, adresse_livraison, note)
       VALUES ($1,$2,$3,$4,'en_attente',$5,$6,$7,$8) RETURNING id, numero_commande`,
      [gid, acheteurId, collaborateur_id, numeroCommande, total, JSON.stringify(articles), JSON.stringify(adresse_livraison), note_vendeur || null]
    );

    // Vider le panier du collaborateur
    await pool.query(
      'DELETE FROM marketplace_panier WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND collaborateur_id=$3',
      [acheteurId, gid, collaborateur_id]
    );

    res.status(201).json({
      commande_id: commandeRes.rows[0].id,
      numero_commande: commandeRes.rows[0].numero_commande,
      message: 'Commande creee avec succes',
    });
  } catch (err) {
    console.error('POST checkout/commande:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/marketplace/:gid/checkout/code-promo
router.post('/:gid/checkout/code-promo', authMV, async (req, res) => {
  const { gid } = req.params;
  const { code, collaborateur_id, sous_total } = req.body;
  try {
    const r = await pool.query(
      `SELECT * FROM reductions_collaborateur
        WHERE code = $1 AND collaborateur_id = $2 AND gestionnaire_id = $3 AND actif = true
          AND (date_debut IS NULL OR date_debut <= CURRENT_DATE)
          AND (date_fin IS NULL OR date_fin >= CURRENT_DATE)
          AND (utilisations_max IS NULL OR utilisations < utilisations_max)
          AND montant_minimum <= $4`,
      [String(code || '').toUpperCase(), parseInt(collaborateur_id), parseInt(gid), parseFloat(sous_total) || 0]
    );
    if (!r.rows[0]) return res.status(404).json({ message: 'Code invalide ou expire' });
    const red = r.rows[0];
    const rabais = red.type === 'pourcentage'
      ? `${red.valeur}%`
      : `${parseFloat(red.valeur).toFixed(2)} $`;
    res.json({ code: red.code, rabais, reduction_id: red.id });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

module.exports = router;