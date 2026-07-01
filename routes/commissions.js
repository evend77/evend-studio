// routes/commissions.js
// ============================================================
// Gestion des commissions e-Vend + transferts Stripe Connect
// Adapté à la vraie structure BD de e-Vend.ca
// ============================================================
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middleware auth admin (adapte selon ton système)
const { authenticateToken: verifierToken, isAdmin: verifierAdmin } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Calculer la commission pour un montant donné
// Priorité: taux du vendeur > taux global
// ─────────────────────────────────────────────────────────────────────────────
async function calculerCommission(montantTotal, vendeurId, montantTaxes = 0, extras = {}) {
  // extras = { frais_expedition, pourboire, frais_manutention }
  // Ces montants sont versés intégralement au vendeur, sans commission
  let config;

  if (vendeurId) {
    const configVendeur = await pool.query(
      `SELECT taux_commission, commission_fixe
       FROM commission_config
       WHERE vendeur_id = $1 AND actif = true`,
      [vendeurId]
    );
    if (configVendeur.rows.length > 0) {
      config = configVendeur.rows[0];
      console.log(`   📊 Taux personnalisé vendeur ${vendeurId}: ${config.taux_commission}%`);
    }
  }

  if (!config) {
    const configGlobal = await pool.query(
      `SELECT taux_commission, commission_fixe
       FROM commission_config
       WHERE vendeur_id IS NULL AND actif = true
       LIMIT 1`
    );
    config = configGlobal.rows[0] || { taux_commission: 10, commission_fixe: 0 };
    console.log(`   📊 Taux global appliqué: ${config.taux_commission}%`);
  }

  // Lire le paramètre destinataire_taxes depuis la config admin
  // 'admin' = Marketplace Facilitator — taxes restent chez la plateforme (défaut)
  // 'vendeur' = taxes versées au vendeur
  let destinataireTaxes = 'admin'; // défaut sécuritaire
  try {
    const cfgResult = await pool.query(
      `SELECT destinataire_taxes FROM configuration_admin WHERE id = 1 LIMIT 1`
    );
    if (cfgResult.rows.length > 0 && cfgResult.rows[0].destinataire_taxes) {
      destinataireTaxes = cfgResult.rows[0].destinataire_taxes;
    }
  } catch (_) {
    // Table ou colonne pas encore créée — utiliser le défaut 'admin'
  }

  const taux               = parseFloat(config.taux_commission);
  const fixe               = parseFloat(config.commission_fixe || 0);
  const taxesADeduire      = destinataireTaxes === 'admin' ? parseFloat(montantTaxes || 0) : 0;

  // Extras versés intégralement au vendeur (sans commission)
  const fraisExpedition    = parseFloat(extras.frais_expedition  || 0);
  const pourboire          = parseFloat(extras.pourboire         || 0);
  const fraisManutention   = parseFloat(extras.frais_manutention || 0);
  const totalExtras        = fraisExpedition + pourboire + fraisManutention;

  // ✅ Commission calculée sur sous-total produits SEULEMENT (avant taxes, sans extras)
  // Exemple: produits 100$ + expédition 10$ + pourboire 5$ + taxes 14.98$ = 129.98$ total
  // Commission = 100$ × 10% = 10$ seulement
  const sousTotalProduits  = Math.max(0, montantTotal - taxesADeduire - totalExtras);
  const commission         = Math.round((sousTotalProduits * taux / 100 + fixe) * 100) / 100;

  // montant_vendeur = sous-total produits - commission + extras (expédition + pourboire + manutention)
  const montantVendeur     = Math.round((sousTotalProduits - commission + totalExtras) * 100) / 100;

  console.log(`   💰 Montant total: ${montantTotal.toFixed(2)} $`);
  console.log(`   🧾 Taxes retenues: ${taxesADeduire.toFixed(2)} $`);
  console.log(`   🚚 Extras vendeur (expédition+pourboire+manutention): ${totalExtras.toFixed(2)} $`);
  console.log(`   📊 Sous-total produits (base commission): ${sousTotalProduits.toFixed(2)} $`);
  console.log(`   🏛️  Commission e-Vend (${taux}% sur produits): ${commission.toFixed(2)} $`);
  console.log(`   👤 Versement vendeur: ${montantVendeur.toFixed(2)} $`);

  return {
    taux_commission:    taux,
    commission_fixe:    fixe,
    montant_commission: commission,
    montant_taxes:      taxesADeduire,
    montant_vendeur:    Math.max(0, montantVendeur), // jamais négatif
    destinataire_taxes: destinataireTaxes,
    // Détail pour audit
    sous_total_produits:  sousTotalProduits,
    frais_expedition:     fraisExpedition,
    pourboire:            pourboire,
    frais_manutention:    fraisManutention,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Effectuer le transfert Stripe + enregistrer en BD
// commande_id = VARCHAR Shopify (ex: "13882185")
// chargeId    = ID du charge Stripe lié au paiement (pour source_transaction)
// ─────────────────────────────────────────────────────────────────────────────
async function effectuerTransfer(commissionId, commandeId, vendeur, montantVendeur, devise, chargeId = null) {
  if (!vendeur.stripe_account_id) {
    throw new Error(`Vendeur ${vendeur.id} n'a pas de compte Stripe Connect`);
  }
  if (!vendeur.stripe_charges_enabled || !vendeur.stripe_payouts_enabled) {
    throw new Error(`Compte Stripe du vendeur ${vendeur.id} non activé (vérification incomplète)`);
  }

  const montantCents = Math.round(montantVendeur * 100);

  const transferParams = {
    amount:      montantCents,
    currency:    devise || 'cad',
    destination: vendeur.stripe_account_id,
    // transfer_group lie visuellement le charge et le transfer dans le dashboard Stripe
    transfer_group: `commande_${commandeId}`,
    metadata: {
      commande_id:   commandeId?.toString() || '',
      vendeur_id:    vendeur.id?.toString() || '',
      commission_id: commissionId?.toString() || '',
      plateforme:    'e-vend.ca',
    },
    description: `e-Vend — Commande #${commandeId} — ${vendeur.nom_boutique || vendeur.id}`,
  };

  // source_transaction : lie le transfer au charge original
  // Garantit que le transfer ne s'exécute que quand les fonds sont disponibles
  // Empêche les transfers si la balance est insuffisante
  if (chargeId) {
    transferParams.source_transaction = chargeId;
  }

  const transfer = await stripe.transfers.create(transferParams);

  console.log(`   ✅ Transfer Stripe: ${transfer.id} → ${montantVendeur.toFixed(2)} ${devise.toUpperCase()}`);

  await pool.query(
    `INSERT INTO stripe_transfers (
       stripe_transfer_id, vendeur_id, commande_id,
       montant, devise, destination_account, statut, created_at
     ) VALUES ($1,$2,$3,$4,$5,$6,'cree',NOW())
     ON CONFLICT (stripe_transfer_id) DO NOTHING`,
    [transfer.id, vendeur.id, commandeId, montantVendeur, devise, vendeur.stripe_account_id]
  );

  if (commissionId) {
    await pool.query(
      `UPDATE commissions SET
         stripe_transfer_id = $1,
         statut             = 'transfer_initie',
         updated_at         = NOW()
       WHERE id = $2`,
      [transfer.id, commissionId]
    );
  }

  if (commandeId) {
    await pool.query(
      `UPDATE commandes SET
         stripe_transfer_id = $1,
         montant_transfer   = $2,
         date_transfer      = NOW(),
         updated_at         = NOW()
       WHERE commande_id = $3`,
      [transfer.id, montantVendeur, commandeId]
    );
  }

  return transfer;
}

// =============================================================================
// GET /api/commissions/config
// =============================================================================
router.get('/config', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cc.*, v.nom AS vendeur_nom, v.nom_boutique
       FROM commission_config cc
       LEFT JOIN vendeurs v ON v.id = cc.vendeur_id
       ORDER BY cc.vendeur_id NULLS FIRST`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ GET /commissions/config:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/commissions/config
// Body: { vendeur_id (optionnel), taux_commission, commission_fixe, note }
// =============================================================================
router.post('/config', verifierToken, verifierAdmin, async (req, res) => {
  const { vendeur_id, taux_commission, commission_fixe = 0, note } = req.body;

  if (taux_commission === undefined || taux_commission < 0 || taux_commission > 100) {
    return res.status(400).json({ error: 'taux_commission doit être entre 0 et 100' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO commission_config (vendeur_id, taux_commission, commission_fixe, note, updated_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (vendeur_id) DO UPDATE SET
         taux_commission = EXCLUDED.taux_commission,
         commission_fixe = EXCLUDED.commission_fixe,
         note            = EXCLUDED.note,
         actif           = true,
         updated_at      = NOW()
       RETURNING *`,
      [vendeur_id || null, taux_commission, commission_fixe, note || null]
    );
    res.json({ success: true, config: result.rows[0] });
  } catch (err) {
    console.error('❌ POST /commissions/config:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/commissions/simuler?montant=150&vendeur_id=5
// Simuler un calcul sans rien créer
// =============================================================================
router.get('/simuler', verifierToken, verifierAdmin, async (req, res) => {
  const { montant, vendeur_id } = req.query;

  if (!montant || isNaN(parseFloat(montant))) {
    return res.status(400).json({ error: 'Paramètre montant requis (ex: ?montant=150.00)' });
  }

  try {
    const calcul = await calculerCommission(
      parseFloat(montant),
      vendeur_id ? parseInt(vendeur_id) : null
    );
    res.json({
      montant_total:      parseFloat(montant),
      taux_commission:    calcul.taux_commission,
      commission_fixe:    calcul.commission_fixe,
      montant_commission: calcul.montant_commission,
      montant_vendeur:    calcul.montant_vendeur,
      resume: `Sur ${parseFloat(montant).toFixed(2)} $  →  e-Vend garde ${calcul.montant_commission.toFixed(2)} $  |  vendeur reçoit ${calcul.montant_vendeur.toFixed(2)} $`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/commissions
// Lister toutes les commissions — ?vendeur_id=5&statut=paye&page=1&limit=20
// =============================================================================
router.get('/', verifierToken, verifierAdmin, async (req, res) => {
  const { vendeur_id, statut, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params     = [];
  let   idx        = 1;

  if (vendeur_id) { conditions.push(`c.vendeur_id = $${idx++}`); params.push(vendeur_id); }
  if (statut)     { conditions.push(`c.statut = $${idx++}`);     params.push(statut); }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.commande_id,
         c.no_commande,
         c.vendeur_id,
         v.nom            AS vendeur_nom,
         v.nom_boutique,
         c.taux_commission,
         c.commission_totale_admin,
         c.montant_commission,
         c.montant_vendeur,
         c.stripe_transfer_id,
         c.statut,
         c.devise,
         c.created_at
       FROM commissions c
       LEFT JOIN vendeurs v ON v.id = c.vendeur_id
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), offset]
    );

    const total = await pool.query(
      `SELECT COUNT(*) FROM commissions c ${where}`, params
    );

    res.json({
      commissions: result.rows,
      total:       parseInt(total.rows[0].count),
      page:        parseInt(page),
      pages:       Math.ceil(parseInt(total.rows[0].count) / parseInt(limit)),
    });
  } catch (err) {
    console.error('❌ GET /commissions:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/commissions/stats
// =============================================================================
router.get('/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const global = await pool.query(
      `SELECT
         COUNT(*)                                               AS total_commissions,
         COALESCE(SUM(commission_totale_admin), 0)            AS revenus_plateforme,
         COALESCE(SUM(montant_vendeur), 0)                    AS total_transfere_vendeurs,
         COUNT(*) FILTER (WHERE statut = 'en_attente')        AS en_attente,
         COUNT(*) FILTER (WHERE statut = 'transfer_initie')   AS transfer_initie,
         COUNT(*) FILTER (WHERE statut = 'transfer_complete') AS transfer_complete,
         COUNT(*) FILTER (WHERE statut = 'paye')              AS paye,
         COUNT(*) FILTER (WHERE stripe_transfer_id IS NOT NULL) AS avec_transfer_stripe
       FROM commissions`
    );

    const parVendeur = await pool.query(
      `SELECT
         v.nom_boutique,
         v.nom                                    AS vendeur_nom,
         COUNT(c.id)                              AS nb_commissions,
         COALESCE(SUM(c.commission_totale_admin), 0) AS commission_totale
       FROM commissions c
       JOIN vendeurs v ON v.id = c.vendeur_id
       GROUP BY v.id, v.nom_boutique, v.nom
       ORDER BY commission_totale DESC
       LIMIT 10`
    );

    res.json({ global: global.rows[0], par_vendeur: parVendeur.rows });
  } catch (err) {
    console.error('❌ GET /commissions/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// POST /api/commissions/transferer/:commande_id
// Transfer manuel — :commande_id = VARCHAR Shopify (ex: "13882185")
// =============================================================================
router.post('/transferer/:commande_id', verifierToken, verifierAdmin, async (req, res) => {
  const { commande_id } = req.params;
  console.log(`\n🔁 Transfer manuel — Commande: ${commande_id}`);

  try {
    const cmdResult = await pool.query(
      `SELECT
         cmd.id, cmd.commande_id, cmd.montant, cmd.montant_paye,
         cmd.statut_paiement, cmd.stripe_payment_id,
         cmd.stripe_transfer_id, cmd.commission_id,
         v.id               AS vendeur_id,
         v.nom, v.nom_boutique, v.email,
         v.stripe_account_id,
         v.stripe_charges_enabled,
         v.stripe_payouts_enabled
       FROM commandes cmd
       JOIN vendeurs v ON v.id = cmd.vendeur_id
       WHERE cmd.commande_id = $1`,
      [commande_id]
    );

    if (cmdResult.rows.length === 0) {
      return res.status(404).json({ error: `Commande ${commande_id} introuvable` });
    }

    const commande = cmdResult.rows[0];

    if (commande.statut_paiement !== 'paye') {
      return res.status(400).json({ error: `Commande non payée (statut: ${commande.statut_paiement})` });
    }

    if (commande.stripe_transfer_id) {
      return res.status(400).json({ error: `Transfer déjà effectué: ${commande.stripe_transfer_id}` });
    }

    const montantTotal = parseFloat(commande.montant_paye || commande.montant || 0);
    if (montantTotal <= 0) {
      return res.status(400).json({ error: 'Montant invalide ou introuvable' });
    }

    // Lire les taxes et extras depuis la BD
    const taxesResult = await pool.query(
      `SELECT COALESCE(tps,0) + COALESCE(tvq,0) + COALESCE(tvh,0) AS total_taxes,
              COALESCE(frais_expedition,0) AS frais_expedition,
              COALESCE(pourboire,0) AS pourboire,
              COALESCE(frais_manutention,0) AS frais_manutention
       FROM commandes WHERE commande_id = $1`,
      [commande_id]
    );
    const taxesRow     = taxesResult.rows[0] || {};
    const montantTaxes = parseFloat(taxesRow.total_taxes || 0);
    const extras       = {
      frais_expedition:  parseFloat(taxesRow.frais_expedition  || 0),
      pourboire:         parseFloat(taxesRow.pourboire         || 0),
      frais_manutention: parseFloat(taxesRow.frais_manutention || 0),
    };

    const calcul = await calculerCommission(montantTotal, commande.vendeur_id, montantTaxes, extras);
    console.log(`   💰 Total: ${montantTotal.toFixed(2)} $`);
    console.log(`   🏦 Commission e-Vend (${calcul.taux_commission}%): ${calcul.montant_commission.toFixed(2)} $`);
    console.log(`   👤 Part vendeur: ${calcul.montant_vendeur.toFixed(2)} $`);

    // Créer la commission si elle n'existe pas
    let commissionId = commande.commission_id;
    if (!commissionId) {
      const commissionResult = await pool.query(
        `INSERT INTO commissions (
           vendeur_id, commande_id, no_commande,
           taux_commission, commission_fixe,
           montant_commission, montant_vendeur,
           devise, statut, stripe_payment_intent_id,
           created_at, updated_at
         ) VALUES ($1,$2,$2,$3,$4,$5,$6,'cad','en_attente',$7,NOW(),NOW())
         RETURNING id`,
        [
          commande.vendeur_id, commande_id,
          calcul.taux_commission, calcul.commission_fixe,
          calcul.montant_commission, calcul.montant_vendeur,
          commande.stripe_payment_id || null
        ]
      );
      commissionId = commissionResult.rows[0].id;

      await pool.query(
        `UPDATE commandes SET commission_id = $1 WHERE commande_id = $2`,
        [commissionId, commande_id]
      );
    }

    const vendeur = {
      id:                    commande.vendeur_id,
      nom:                   commande.nom,
      nom_boutique:          commande.nom_boutique,
      email:                 commande.email,
      stripe_account_id:     commande.stripe_account_id,
      stripe_charges_enabled: commande.stripe_charges_enabled,
      stripe_payouts_enabled: commande.stripe_payouts_enabled,
    };

    // Récupérer le charge_id depuis le PaymentIntent pour source_transaction
    let chargeId = null;
    if (commande.stripe_payment_id) {
      try {
        const configResult = await pool.query(
          `SELECT sandbox, dev_secret_key, prod_secret_key FROM configuration_stripe_admin WHERE id = 1`
        );
        const cfg = configResult.rows[0];
        const { dechiffrer } = require('./commissions'); // self-ref pour helper
        const stripeKey = cfg ? (cfg.sandbox
          ? (cfg.dev_secret_key ? cfg.dev_secret_key : null)
          : (cfg.prod_secret_key ? cfg.prod_secret_key : null)) : null;

        if (stripeKey) {
          const stripeClient  = require('stripe')(stripeKey);
          const pi            = await stripeClient.paymentIntents.retrieve(commande.stripe_payment_id);
          chargeId            = pi.latest_charge || null;
          console.log(`   💳 Charge ID récupéré: ${chargeId}`);
        }
      } catch (chargeErr) {
        // Non bloquant — le transfer fonctionne quand même sans source_transaction
        console.warn(`   ⚠️ Impossible de récupérer le charge: ${chargeErr.message}`);
      }
    }

    const transfer = await effectuerTransfer(
      commissionId, commande_id, vendeur, calcul.montant_vendeur, 'cad', chargeId
    );

    res.json({
      success:     true,
      message:     `Transfer de ${calcul.montant_vendeur.toFixed(2)} $ initié vers ${vendeur.nom_boutique || vendeur.nom}`,
      transfer_id: transfer.id,
      commission: {
        id:                 commissionId,
        montant_total:      montantTotal,
        taux:               calcul.taux_commission,
        montant_commission: calcul.montant_commission,
        montant_vendeur:    calcul.montant_vendeur,
      },
    });

  } catch (err) {
    console.error(`❌ Transfer manuel ${commande_id}:`, err.message);
    try {
      await pool.query(
        `INSERT INTO audit_logs (action, utilisateur, details, niveau, date) VALUES ($1,$2,$3::jsonb,$4,NOW())`,
        ['TRANSFER_MANUEL_ERREUR', 'admin', JSON.stringify({ commande_id, error: err.message }), 'error']
      );
    } catch (_) {}
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// GET /api/commissions/commande/:commande_id
// Voir le détail complet d'une commande: paiement + commission + transfers
// =============================================================================
router.get('/commande/:commande_id', verifierToken, verifierAdmin, async (req, res) => {
  const { commande_id } = req.params;
  try {
    const cmd = await pool.query(
      `SELECT
         cmd.commande_id, cmd.montant, cmd.montant_paye, cmd.statut_paiement,
         cmd.stripe_payment_id, cmd.stripe_transfer_id, cmd.montant_transfer,
         cmd.date_paiement, cmd.date_transfer,
         v.nom AS vendeur_nom, v.nom_boutique,
         v.stripe_account_id, v.stripe_charges_enabled, v.stripe_payouts_enabled
       FROM commandes cmd
       JOIN vendeurs v ON v.id = cmd.vendeur_id
       WHERE cmd.commande_id = $1`,
      [commande_id]
    );

    if (cmd.rows.length === 0) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const commissions = await pool.query(
      `SELECT * FROM commissions WHERE commande_id = $1 ORDER BY created_at DESC`,
      [commande_id]
    );

    const transfers = await pool.query(
      `SELECT * FROM stripe_transfers WHERE commande_id = $1 ORDER BY created_at DESC`,
      [commande_id]
    );

    res.json({
      commande:    cmd.rows[0],
      commissions: commissions.rows,
      transfers:   transfers.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// Exporter les helpers pour webhooks-stripe.js
// =============================================================================
module.exports = router;
module.exports.calculerCommission = calculerCommission;
module.exports.effectuerTransfer  = effectuerTransfer;