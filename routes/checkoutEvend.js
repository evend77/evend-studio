// routes/checkoutEvend.js
// Checkout e-Vend — calcul d'expédition intelligent
// ✅ CORRIGÉ: stripeAccount correctement passé dans checkout.sessions.create
// ✅ CORRIGÉ: les taxes ne s'appliquent que si facturation_taxes = true

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authenticateToken } = require('../middleware/auth');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.use(authenticateToken);

// ─── TRANSPORTEURS (noms/logos) ───────────────────────────────────────────
const TRANSPORTEURS = {
  1:  { nom: 'Canada Post / Postes Canada', logo: '📮' },
  2:  { nom: 'Purolator',                   logo: '🚚' },
  3:  { nom: 'FedEx Canada',                logo: '✈️'  },
  4:  { nom: 'UPS Canada',                  logo: '📦'  },
  5:  { nom: 'Intelcom Courrier',            logo: '📬'  },
  6:  { nom: 'DHL Express Canada',           logo: '🌍'  },
  7:  { nom: 'GLS Canada',                  logo: '🚛'  },
  8:  { nom: 'CanPar',                      logo: '🇨🇦'  },
  9:  { nom: 'Loomis Express',              logo: '📦'  },
  10: { nom: 'Transport A. Bélanger',        logo: '🚚'  },
  11: { nom: 'Groupe Robert',               logo: '🏭'  },
  12: { nom: 'Livraison locale',            logo: '🛵'  },
  13: { nom: 'Ramassage sur place',          logo: '🏪'  },
  14: { nom: 'Livraison gratuite',           logo: '🎁'  },
};

const FREE_SHIPPING_FALLBACK = {
  id: -1, transporteur_id: 14,
  nom: 'Livraison gratuite', logo: '🎁',
  mode_calcul: 'fixe', frais_fixes: 0, frais_par_kg: 0,
  gratuit_superieur: null, delais_estime: 'Variable selon le vendeur',
  combine_shipping: false, combine_frais_fixe_unique: true, combine_kg_additionne: true,
  frais_zones: null, gratuit: true, ramassage: false,
  frais_calcule: 0, detail_calcul: 'Livraison gratuite',
};

// ─── TAUX DE TAXES PAR PROVINCE ──────────────────────────────────────────
const TAXES = {
  'AB': { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
  'BC': { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS + TVP (7%)' },
  'MB': { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS + TVP (7%)' },
  'NB': { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  'NL': { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  'NS': { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  'ON': { tps: 0,    tvq: 0,       tvh: 0.13, label: 'TVH' },
  'PE': { tps: 0,    tvq: 0,       tvh: 0.15, label: 'TVH' },
  'QC': { tps: 0.05, tvq: 0.09975, tvh: 0,    label: 'TPS + TVQ' },
  'SK': { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS + TVP (6%)' },
  'NT': { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
  'NU': { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
  'YT': { tps: 0.05, tvq: 0,       tvh: 0,    label: 'TPS' },
};

function provinceVersCode(nomProvince) {
  const map = {
    'Alberta': 'AB', 'Colombie-Britannique': 'BC', 'Manitoba': 'MB',
    'Nouveau-Brunswick': 'NB', 'Terre-Neuve-et-Labrador': 'NL',
    'Nouvelle-Ecosse': 'NS', 'Ontario': 'ON', 'Ile-du-Prince-Edouard': 'PE',
    'Quebec': 'QC', 'Saskatchewan': 'SK',
    'Territoires du Nord-Ouest': 'NT', 'Nunavut': 'NU', 'Yukon': 'YT',
    'AB':'AB','BC':'BC','MB':'MB','NB':'NB','NL':'NL','NS':'NS',
    'ON':'ON','PE':'PE','QC':'QC','SK':'SK','NT':'NT','NU':'NU','YT':'YT',
  };
  return map[nomProvince] || 'QC';
}

// ─── ALGORITHME CALCUL EXPÉDITION (identique) ─────────────────────────────
function calculerFraisMethode(methode, articles, sousTotal, province) {
  const mode = methode.mode_calcul || 'fixe';
  const frais_fixes = parseFloat(methode.frais_fixes) || 0;
  const frais_par_kg = parseFloat(methode.frais_par_kg) || 0;
  const gratuit_superieur = methode.gratuit_superieur ? parseFloat(methode.gratuit_superieur) : null;
  const combine = methode.combine_shipping || false;
  const combine_fixe_unique = methode.combine_frais_fixe_unique !== false;
  const combine_kg_additionne = methode.combine_kg_additionne !== false;

  const articlesMethode = articles.filter(a => a.methode_expedition_id === methode.id);
  const articlesActifs = articlesMethode.length > 0 ? articlesMethode : articles;

  const poidsTotal = articlesActifs.reduce((sum, a) => {
    return sum + (parseFloat(a.poids || 0) * parseInt(a.quantite || 1));
  }, 0);

  let frais = 0;
  let detail = '';
  let gratuit_applique = false;

  if (gratuit_superieur !== null && sousTotal >= gratuit_superieur) {
    return { frais: 0, detail: `Livraison gratuite (commande ≥ ${gratuit_superieur.toFixed(2)} $)`, gratuit_applique: true };
  }

  if (mode === 'fixe') {
    if (combine && combine_fixe_unique) {
      frais = frais_fixes;
      detail = `Frais fixe (combine shipping): ${frais_fixes.toFixed(2)} $`;
    } else {
      const nbArticles = articlesActifs.reduce((sum, a) => sum + parseInt(a.quantite || 1), 0);
      frais = frais_fixes * articlesActifs.length;
      detail = `Frais fixe: ${frais_fixes.toFixed(2)} $ × ${articlesActifs.length} article(s) = ${frais.toFixed(2)} $`;
    }
  } else if (mode === 'kg') {
    if (combine && !combine_kg_additionne) {
      const poidsMax = Math.max(...articlesActifs.map(a => parseFloat(a.poids || 0)));
      frais = poidsMax * frais_par_kg;
      detail = `Frais au kg (combine, poids max: ${poidsMax.toFixed(2)} kg): ${frais.toFixed(2)} $`;
    } else {
      frais = poidsTotal * frais_par_kg;
      detail = `Frais au kg: ${poidsTotal.toFixed(2)} kg × ${frais_par_kg.toFixed(2)} $/kg = ${frais.toFixed(2)} $`;
    }
  } else if (mode === 'fixe_kg') {
    let fraisFixeTotal;
    if (combine && combine_fixe_unique) {
      fraisFixeTotal = frais_fixes;
    } else {
      fraisFixeTotal = frais_fixes * articlesActifs.length;
    }
    let fraisKgTotal;
    if (combine && !combine_kg_additionne) {
      const poidsMax = Math.max(...articlesActifs.map(a => parseFloat(a.poids || 0)));
      fraisKgTotal = poidsMax * frais_par_kg;
    } else {
      fraisKgTotal = poidsTotal * frais_par_kg;
    }
    frais = fraisFixeTotal + fraisKgTotal;
    detail = `Fixe: ${fraisFixeTotal.toFixed(2)} $ + Kg: ${fraisKgTotal.toFixed(2)} $ = ${frais.toFixed(2)} $`;
  } else if (mode === 'zone') {
    const zones = methode.frais_zones || {};
    const prixZone = zones[province];
    if (prixZone === null || prixZone === 'non' || prixZone === undefined) {
      return { frais: null, detail: `N'expédie pas en ${province}`, gratuit_applique: false, non_disponible: true };
    }
    frais = parseFloat(prixZone) || 0;
    detail = `Frais zone ${province}: ${frais.toFixed(2)} $`;
  }

  return { frais, detail, gratuit_applique };
}

function enrichirMethode(m, articles, sousTotal, province) {
  const transporteur = TRANSPORTEURS[m.transporteur_id] || { nom: 'Expédition', logo: '📦' };
  const calcul = calculerFraisMethode(m, articles, sousTotal, province);
  return {
    id: m.id,
    transporteur_id: m.transporteur_id,
    nom: transporteur.nom,
    logo: transporteur.logo,
    mode_calcul: m.mode_calcul || 'fixe',
    frais_fixes: parseFloat(m.frais_fixes) || 0,
    frais_par_kg: parseFloat(m.frais_par_kg) || 0,
    gratuit_superieur: m.gratuit_superieur ? parseFloat(m.gratuit_superieur) : null,
    delais_estime: m.delais_estime || '',
    combine_shipping: m.combine_shipping || false,
    combine_frais_fixe_unique: m.combine_frais_fixe_unique !== false,
    combine_kg_additionne: m.combine_kg_additionne !== false,
    frais_zones: m.frais_zones || null,
    frais_calcule: calcul.frais,
    detail_calcul: calcul.detail,
    gratuit_applique: calcul.gratuit_applique || false,
    non_disponible: calcul.non_disponible || false,
    gratuit: calcul.frais === 0,
    ramassage: m.transporteur_id === 13,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/checkout-evend/infos
// ─────────────────────────────────────────────────────────────────────────
router.get('/infos', async (req, res) => {
  const acheteurId = req.user.id;
  const { vendeur_id, province } = req.query;
  if (!vendeur_id) return res.status(400).json({ error: 'vendeur_id requis' });

  try {
    const panierRes = await pool.query(
      `SELECT p.*, COALESCE(v.nom_boutique, v.nom) AS vendeur_nom,
              pr.facturation_taxes
       FROM panier p
       JOIN vendeurs v ON v.id = p.vendeur_id
       LEFT JOIN produits pr ON pr.id = p.produit_shopify_id::integer
       WHERE p.acheteur_id = $1 AND p.vendeur_id = $2
       ORDER BY p.created_at ASC`,
      [acheteurId, parseInt(vendeur_id)]
    );

    if (panierRes.rows.length === 0) {
      return res.status(404).json({ error: 'Aucun article pour ce vendeur dans le panier' });
    }

    const configRes = await pool.query(
      `SELECT cv.stripe_actif, cv.paypal_actif, cv.stripe_compte_id, cv.paypal_email,
              cv.montant_minimum_actif, cv.montant_minimum_valeur,
              v.nom AS vendeur_nom, v.nom_boutique, v.id AS vendeur_id
       FROM config_vendeur cv
       JOIN vendeurs v ON v.id = cv.vendeur_id
       WHERE cv.vendeur_id = $1`,
      [parseInt(vendeur_id)]
    );

    const config = configRes.rows[0] || {};

    const adressesRes = await pool.query(
      `SELECT id, nom, ligne1 AS adresse, ligne2, ville, province,
              code_postal, pays, telephone, est_principale AS par_defaut, type
       FROM adresses_acheteurs
       WHERE acheteur_id = $1
       ORDER BY est_principale DESC, id ASC`,
      [acheteurId]
    );

    const acheteurRes = await pool.query(
      `SELECT id, prenom, nom, email, telephone FROM acheteurs WHERE id = $1`,
      [acheteurId]
    );

    const articles = panierRes.rows;
    const sousTotal = articles.reduce((s, a) => s + parseFloat(a.prix) * a.quantite, 0);

    const adressePrincipale = adressesRes.rows.find(a => a.par_defaut) || adressesRes.rows[0];
    const codeProvince = provinceVersCode(province || adressePrincipale?.province || 'QC');

    let methodesExpedition = [];
    try {
      const produitIds = articles.map(a => parseInt(a.produit_shopify_id || a.id)).filter(Boolean);
      const methodesRes = await pool.query(
        `SELECT DISTINCT vme.*
         FROM produit_methodes_expedition pme
         JOIN vendeur_methodes_expedition vme ON vme.id = pme.methode_id
         WHERE pme.produit_id = ANY($1::int[]) AND vme.actif = true
         ORDER BY vme.frais_fixes ASC NULLS LAST`,
        [produitIds]
      );

      if (methodesRes.rows.length > 0) {
        methodesExpedition = methodesRes.rows
          .map(m => enrichirMethode(m, articles, sousTotal, codeProvince))
          .filter(m => !m.non_disponible)
          .sort((a, b) => (a.frais_calcule || 0) - (b.frais_calcule || 0));
      }

      if (methodesExpedition.length === 0) {
        methodesExpedition = [{ ...FREE_SHIPPING_FALLBACK }];
      }
    } catch(e) {
      console.log('⚠️ Méthodes expédition non chargées:', e.message);
      methodesExpedition = [{ ...FREE_SHIPPING_FALLBACK }];
    }

    res.json({
      articles,
      methodes_expedition: methodesExpedition,
      province: codeProvince,
      vendeur: {
        id: config.vendeur_id,
        nom: config.vendeur_nom,
        nom_boutique: config.nom_boutique || config.vendeur_nom,
        stripe_actif: config.stripe_actif || false,
        paypal_actif: config.paypal_actif || false,
        stripe_compte_id: config.stripe_compte_id || null,
        paypal_email: config.paypal_email || null,
      },
      acheteur: acheteurRes.rows[0] || {},
      adresses: adressesRes.rows,
      sous_total: sousTotal,
    });
  } catch (err) {
    console.error('GET /checkout-evend/infos:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/checkout-evend/calculer-expedition
// ─────────────────────────────────────────────────────────────────────────
router.post('/calculer-expedition', async (req, res) => {
  const { vendeur_id, province, methode_id } = req.body;
  const acheteurId = req.user.id;

  try {
    const panierRes = await pool.query(
      `SELECT p.* FROM panier p WHERE p.acheteur_id = $1 AND p.vendeur_id = $2`,
      [acheteurId, parseInt(vendeur_id)]
    );
    const articles = panierRes.rows;
    const sousTotal = articles.reduce((s, a) => s + parseFloat(a.prix) * a.quantite, 0);
    const codeProvince = provinceVersCode(province || 'QC');

    if (methode_id && methode_id !== -1) {
      const methodeRes = await pool.query(
        `SELECT * FROM vendeur_methodes_expedition WHERE id = $1`,
        [parseInt(methode_id)]
      );
      if (methodeRes.rows.length > 0) {
        const methode = methodeRes.rows[0];
        const calcul = calculerFraisMethode(methode, articles, sousTotal, codeProvince);
        return res.json({
          frais: calcul.frais || 0,
          detail: calcul.detail,
          gratuit_applique: calcul.gratuit_applique || false,
          province: codeProvince,
        });
      }
    }

    res.json({ frais: 0, detail: 'Livraison gratuite', gratuit_applique: true, province: codeProvince });
  } catch (err) {
    console.error('POST /calculer-expedition:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/checkout-evend/calculer-taxes
// ─────────────────────────────────────────────────────────────────────────
router.post('/calculer-taxes', async (req, res) => {
  const { sous_total, frais_expedition, province, pourboire, articles } = req.body;
  const acheteurId = req.user.id;
  const code = provinceVersCode(province || 'QC');
  const taxe = TAXES[code] || TAXES['QC'];

  let totalTaxable = 0;
  let totalNonTaxable = 0;
  let frais = parseFloat(frais_expedition || 0);
  let montantPourboire = parseFloat(pourboire || 0);

  if (articles && Array.isArray(articles) && articles.length > 0) {
    for (const article of articles) {
      const montantLigne = parseFloat(article.prix) * parseInt(article.quantite);
      if (article.facturation_taxes === true) {
        totalTaxable += montantLigne;
      } else {
        totalNonTaxable += montantLigne;
      }
    }
  } else {
    try {
      const panierRes = await pool.query(
        `SELECT p.prix, p.quantite, pr.facturation_taxes
         FROM panier p
         LEFT JOIN produits pr ON pr.id = p.produit_shopify_id::integer
         WHERE p.acheteur_id = $1`,
        [acheteurId]
      );
      
      for (const article of panierRes.rows) {
        const montantLigne = parseFloat(article.prix) * parseInt(article.quantite);
        if (article.facturation_taxes === true) {
          totalTaxable += montantLigne;
        } else {
          totalNonTaxable += montantLigne;
        }
      }
    } catch (err) {
      console.log('⚠️ Impossible de charger facturation_taxes, fallback sur sous_total');
      totalTaxable = parseFloat(sous_total || 0);
      totalNonTaxable = 0;
    }
  }

  const base = totalTaxable + frais;
  const tps = base * taxe.tps;
  const tvq = base * taxe.tvq;
  const tvh = base * taxe.tvh;
  const totalTaxes = tps + tvq + tvh;
  const total = totalTaxable + totalNonTaxable + frais + totalTaxes + montantPourboire;

  res.json({
    sous_total: parseFloat(sous_total || 0),
    frais_expedition: frais,
    tps: tps.toFixed(2),
    tvq: tvq.toFixed(2),
    tvh: tvh.toFixed(2),
    total_taxes: totalTaxes.toFixed(2),
    pourboire: montantPourboire,
    total: total.toFixed(2),
    label_taxe: taxe.label,
    province: code,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/checkout-evend/creer-commande
// ✅ CORRIGÉ: stripeAccount passé correctement dans checkout.sessions.create
// ✅ CORRIGÉ: application_fee_amount pour commission automatique
// ─────────────────────────────────────────────────────────────────────────
router.post('/creer-commande', async (req, res) => {
  const acheteurId = req.user.id;
  const {
    vendeur_id, mode_paiement, infos_livraison, infos_facturation,
    frais_expedition, pourboire, taxes, total, methode_expedition_id,
  } = req.body;

  console.log('\n💳 Checkout e-Vend — creer-commande');
  console.log(`   Acheteur: ${acheteurId} | Vendeur: ${vendeur_id} | Mode: ${mode_paiement}`);
  console.log(`   Total: ${total} CAD | Expédition: ${frais_expedition} CAD`);

  if (!vendeur_id || !mode_paiement || !infos_livraison || !total) {
    return res.status(400).json({ error: 'Paramètres manquants (vendeur_id, mode_paiement, infos_livraison, total)' });
  }

  try {
    const panierRes = await pool.query(
      `SELECT p.id, p.produit_shopify_id, p.variant_id, p.quantite, p.prix,
              p.titre, p.image_url, pr.facturation_taxes
       FROM panier p
       LEFT JOIN produits pr ON pr.id = p.produit_shopify_id::integer
       WHERE p.acheteur_id = $1 AND p.vendeur_id = $2`,
      [acheteurId, parseInt(vendeur_id)]
    );

    if (panierRes.rows.length === 0) {
      return res.status(400).json({ error: 'Panier vide pour ce vendeur' });
    }

    const articles = panierRes.rows;
    const sousTotal = articles.reduce((s, a) => s + parseFloat(a.prix) * a.quantite, 0);

    const province = infos_livraison.province || 'QC';
    const code = provinceVersCode(province);
    const taxe = TAXES[code] || TAXES['QC'];
    
    let totalTaxable = 0;
    let totalNonTaxable = 0;
    
    for (const article of articles) {
      const montant = parseFloat(article.prix) * parseInt(article.quantite);
      if (article.facturation_taxes === true) {
        totalTaxable += montant;
      } else {
        totalNonTaxable += montant;
      }
    }
    
    const frais = parseFloat(frais_expedition || 0);
    const base = totalTaxable + frais;
    const tps = base * taxe.tps;
    const tvq = base * taxe.tvq;
    const tvh = base * taxe.tvh;

    const vendeurRes = await pool.query(
      `SELECT id, nom, email, nom_boutique,
              stripe_account_id, stripe_charges_enabled,
              commission_rate, commission
       FROM vendeurs WHERE id = $1`,
      [parseInt(vendeur_id)]
    );

    if (vendeurRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendeur introuvable' });
    }
    const vendeur = vendeurRes.rows[0];

    // ✅ Vérification critique: le vendeur doit avoir un compte Stripe Connect
    if (!vendeur.stripe_account_id) {
      return res.status(400).json({ 
        error: 'Ce vendeur n\'a pas encore connecté son compte Stripe. Veuillez réessayer plus tard.' 
      });
    }

    if (!vendeur.stripe_charges_enabled) {
      return res.status(400).json({ 
        error: 'Le compte Stripe du vendeur n\'est pas encore activé pour recevoir des paiements.' 
      });
    }

    const acheteurRes = await pool.query(
      `SELECT id, prenom, nom, email FROM acheteurs WHERE id = $1`,
      [acheteurId]
    );
    const acheteur = acheteurRes.rows[0];

    const commandeRes = await pool.query(
      `INSERT INTO commandes (
        vendeur_id, acheteur_id,
        statut_commande, statut_paiement,
        montant, sous_total, frais_expedition, pourboire,
        tps, tvq, tvh,
        articles, adresse_livraison, adresse_facturation,
        mode_paiement, methode_expedition_id, created_at, updated_at
      ) VALUES ($1,$2,'Unfulfilled','pending',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
      RETURNING id`,
      [
        parseInt(vendeur_id), acheteurId,
        parseFloat(total), sousTotal,
        parseFloat(frais_expedition || 0), parseFloat(pourboire || 0),
        tps, tvq, tvh,
        JSON.stringify(articles),
        JSON.stringify(infos_livraison),
        JSON.stringify(infos_facturation || infos_livraison),
        mode_paiement,
        methode_expedition_id || null,
      ]
    );
    const commandeId = commandeRes.rows[0].id;
    console.log(`✅ Commande créée en BD: ID=${commandeId}`);

    if (mode_paiement === 'stripe') {
      // ✅ Calcul de la commission
      const tauxCommission = parseFloat(vendeur.commission_rate) || 0;
      const fraisFixeCommission = parseFloat(vendeur.commission) || 0;
      const montantTotal = parseFloat(total);
      
      // application_fee_amount = commission prélevée par e-Vend
      // C'est en cents donc *100
      const applicationFeeAmount = Math.round((montantTotal * tauxCommission + fraisFixeCommission) * 100);
      
      console.log(`   📊 Commission: ${tauxCommission}% + ${fraisFixeCommission} $ fixe = ${(applicationFeeAmount/100).toFixed(2)} $`);

      // ✅ Construction des line items pour Stripe Checkout
      const lineItems = articles.map(a => ({
        price_data: {
          currency: 'cad',
          product_data: { name: a.titre.substring(0, 255) },
          unit_amount: Math.round(parseFloat(a.prix) * 100),
        },
        quantity: parseInt(a.quantite),
      }));

      if (parseFloat(frais_expedition || 0) > 0) {
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: { name: 'Frais d\'expédition' },
            unit_amount: Math.round(parseFloat(frais_expedition) * 100),
          },
          quantity: 1,
        });
      }

      const totalTaxesCalcul = tps + tvq + tvh;
      if (totalTaxesCalcul > 0) {
        lineItems.push({
          price_data: {
            currency: 'cad',
            product_data: { name: `Taxes (${taxe.label})` },
            unit_amount: Math.round(totalTaxesCalcul * 100),
          },
          quantity: 1,
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'https://evend-multivendeur-api.onrender.com';

      // ✅ CRITICAL FIX: stripeAccount passé comme SECOND paramètre
      // PAS dans le constructeur Stripe !
      console.log(`   🏦 Création session Stripe sur le compte: ${vendeur.stripe_account_id}`);

      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          line_items: lineItems,
          payment_intent_data: {
            application_fee_amount: applicationFeeAmount,
            metadata: {
              commande_id: commandeId.toString(),
              vendeur_id: vendeur_id.toString(),
              acheteur_id: acheteurId.toString(),
              plateforme: 'e-vend.ca',
            },
          },
          customer_email: acheteur?.email || undefined,
          metadata: {
            commande_id: commandeId.toString(),
            vendeur_id: vendeur_id.toString(),
            acheteur_id: acheteurId.toString(),
            plateforme: 'e-vend.ca',
          },
          success_url: `${frontendUrl}/?page=commande-confirmee&commande_id=${commandeId}&stripe=success`,
          cancel_url: `${frontendUrl}/?page=checkout&vendeur_id=${vendeur_id}&annule=1`,
        },
        {
          // ✅ ICI la correction: stripeAccount comme deuxième paramètre
          stripeAccount: vendeur.stripe_account_id
        }
      );

      console.log(`   ✅ Session Stripe créée: ${session.id}`);
      console.log(`   🔗 URL: ${session.url}`);

      await pool.query(
        `UPDATE commandes SET stripe_session_url=$1, stripe_session_id=$2 WHERE id=$3`,
        [session.url, session.id, commandeId]
      );

      // ✅ Vider le panier seulement après création réussie de la session
      await pool.query(
        `DELETE FROM panier WHERE acheteur_id=$1 AND vendeur_id=$2`,
        [acheteurId, parseInt(vendeur_id)]
      );

      return res.json({
        success: true,
        stripe_url: session.url,
        session_id: session.id,
        commande_id: commandeId,
      });
    }

    if (mode_paiement === 'paypal') {
      return res.status(501).json({ error: 'PayPal bientôt disponible' });
    }

    return res.status(400).json({ error: `Mode de paiement invalide: ${mode_paiement}` });

  } catch (err) {
    console.error('❌ creer-commande:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;