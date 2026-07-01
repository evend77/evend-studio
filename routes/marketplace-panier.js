// routes/marketplace-panier.js
// e-Vend Studio — Panier + Checkout scopés par gestionnaire_id
// A monter : app.use('/api/marketplace', require('./routes/marketplace-panier'));
// Utilise les tables : marketplace_panier, marketplace_commandes, marketplace_acheteurs, marketplace_collaborateurs

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const jwt     = require('jsonwebtoken');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const JWT_SECRET = process.env.JWT_SECRET;

// ─── Middleware auth marketplace ──────────────────────────────────────────────
function authMV(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Non authentifie' });
  try {
    req.mvUser = jwt.verify(auth.slice(7), JWT_SECRET);
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
    ? articles.reduce((s, a) => s + (a.facturation_taxes ? parseFloat(a.prix) * a.quantite : 0), 0)
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
  const { produit_id, titre, image_url, prix, quantite } = req.body;

  if (!produit_id || !prix || !quantite) return res.status(400).json({ error: 'Champs manquants' });

  try {
    const prodRes = await pool.query(
      'SELECT id, vendeur_id, nom, image FROM produits WHERE id = $1 AND statut = $2',
      [parseInt(produit_id), 'actif']
    );
    if (!prodRes.rows[0]) return res.status(404).json({ error: 'Produit introuvable' });

    const produit = prodRes.rows[0];
    const collaborateurId = produit.vendeur_id;

    const existant = await pool.query(
      'SELECT id, quantite FROM marketplace_panier WHERE acheteur_id=$1 AND gestionnaire_id=$2 AND produit_id=$3',
      [acheteurId, gid, produit_id.toString()]
    );

    if (existant.rows[0]) {
      await pool.query(
        'UPDATE marketplace_panier SET quantite=$1, updated_at=NOW() WHERE id=$2',
        [existant.rows[0].quantite + parseInt(quantite), existant.rows[0].id]
      );
      return res.json({ message: 'Quantite mise a jour', id: existant.rows[0].id });
    }

    const ins = await pool.query(
      `INSERT INTO marketplace_panier (gestionnaire_id, acheteur_id, collaborateur_id, produit_id, titre, image_url, prix, quantite)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [gid, acheteurId, collaborateurId, produit_id.toString(), titre || produit.nom, image_url || produit.image || null, parseFloat(prix), parseInt(quantite)]
    );
    res.status(201).json({ message: 'Article ajoute', id: ins.rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// PATCH /api/marketplace/:gid/panier/:id
router.patch('/:gid/panier/:id', authMV, async (req, res) => {
  const { gid, id } = req.params;
  const { quantite } = req.body;
  const acheteurId = req.mvUser.id;
  if (!quantite || quantite < 1) return res.status(400).json({ error: 'Quantite invalide' });
  try {
    await pool.query(
      'UPDATE marketplace_panier SET quantite=$1, updated_at=NOW() WHERE id=$2 AND acheteur_id=$3 AND gestionnaire_id=$4',
      [quantite, id, acheteurId, gid]
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
      `SELECT mp.*, pr.facturation_taxes, pr.produit_numerique
       FROM marketplace_panier mp
       LEFT JOIN produits pr ON pr.id::text = mp.produit_id
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
        const methRes = await pool.query(
          `SELECT DISTINCT vme.*
           FROM produit_methodes_expedition pme
           JOIN vendeur_methodes_expedition vme ON vme.id = pme.methode_id
           WHERE pme.produit_id = ANY($1::int[]) AND vme.actif = true
           ORDER BY vme.frais_fixes ASC NULLS LAST`,
          [produitIds]
        );
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
      `SELECT * FROM reductions WHERE code = $1 AND vendeur_id = $2 AND actif = true
       AND (date_fin IS NULL OR date_fin >= NOW())`,
      [code.toUpperCase(), collaborateur_id]
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