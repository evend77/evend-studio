// routes/vendeurs_config.js
// Routes pour la configuration générale du vendeur (config_vendeur)
// Montées sous /api/vendeurs par server.js

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const crypto  = require('crypto');
const { authenticateToken } = require('../middleware/auth');

// ── Helper déchiffrement AES-256-GCM ─────────────────────────────────────
// Supporte ENCRYPTION_KEY, NOTES_ENCRYPTION_KEY, MSG_ENCRYPTION_KEY
const ENC_KEY_HEX = process.env.ENCRYPTION_KEY
  || process.env.NOTES_ENCRYPTION_KEY
  || process.env.MSG_ENCRYPTION_KEY;

function dechiffrer(valeur) {
  if (!valeur) return null;
  try {
    if (!ENC_KEY_HEX) throw new Error('Clé de chiffrement manquante');
    const key   = Buffer.from(ENC_KEY_HEX, 'hex');
    const parts = valeur.split(':');
    if (parts.length !== 3) return valeur; // Pas chiffré — retourner tel quel
    const iv       = Buffer.from(parts[0], 'base64');
    const authTag  = Buffer.from(parts[1], 'base64');
    const donnees  = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(donnees, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    return valeur; // Si déchiffrement échoue, retourner tel quel
  }
}

// GET /:vendeurId/config
router.get('/:vendeurId/config', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const tableCheck = await pool.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'config_vendeur');
        `);
        if (!tableCheck.rows[0].exists) return res.status(404).json({ error: 'Table config_vendeur non trouvée' });

        const result = await pool.query('SELECT * FROM config_vendeur WHERE vendeur_id = $1', [vendeurId]);
        if (result.rows.length === 0) {
            const newConfig = await pool.query(`INSERT INTO config_vendeur (vendeur_id) VALUES ($1) RETURNING *`, [vendeurId]);
            return res.json(newConfig.rows[0]);
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('❌ Erreur GET /:vendeurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /:vendeurId/config
router.put('/:vendeurId/config', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const data = req.body;
        const query = `
            UPDATE config_vendeur SET
                montant_minimum_actif = COALESCE($1, montant_minimum_actif),
                montant_minimum_pour = COALESCE($2, montant_minimum_pour),
                montant_minimum_valeur = COALESCE($3, montant_minimum_valeur),
                courier_cc_actif = COALESCE($4, courier_cc_actif),
                courier_cc_liste = COALESCE($5, courier_cc_liste),
                approbation_commentaires_auto = COALESCE($6, approbation_commentaires_auto),
                fuseau_horaire_actif = COALESCE($7, fuseau_horaire_actif),
                fuseau_horaire_selectionne = COALESCE($8, fuseau_horaire_selectionne),
                deux_facteurs_actif = COALESCE($9, deux_facteurs_actif),
                afficher_num_entreprise = COALESCE($10, afficher_num_entreprise),
                afficher_num_taxes = COALESCE($11, afficher_num_taxes),
                afficher_adresse_entreprise = COALESCE($12, afficher_adresse_entreprise),
                afficher_telephone = COALESCE($13, afficher_telephone),
                vacances_actif = COALESCE($14, vacances_actif),
                vacances_date_debut = COALESCE($15, vacances_date_debut),
                vacances_date_fin = COALESCE($16, vacances_date_fin),
                vacances_operation_produit = COALESCE($17, vacances_operation_produit),
                vacances_message = COALESCE($18, vacances_message),
                paypal_actif = COALESCE($19, paypal_actif),
                paypal_email = COALESCE($20, paypal_email),
                stripe_actif = COALESCE($21, stripe_actif),
                stripe_compte_id = COALESCE($22, stripe_compte_id),
                shippo_actif = COALESCE($23, shippo_actif),
                shippo_api_token = COALESCE($24, shippo_api_token),
                shippo_mode = COALESCE($25, shippo_mode),
                easypost_actif = COALESCE($26, easypost_actif),
                easypost_cle_test = COALESCE($27, easypost_cle_test),
                easypost_cle_prod = COALESCE($28, easypost_cle_prod),
                easypost_mode = COALESCE($29, easypost_mode),
                postes_actif = COALESCE($30, postes_actif),
                postes_username = COALESCE($31, postes_username),
                postes_password = COALESCE($32, postes_password),
                postes_customer_number = COALESCE($33, postes_customer_number),
                postes_mode = COALESCE($34, postes_mode),
                updated_at = CURRENT_TIMESTAMP
            WHERE vendeur_id = $35
            RETURNING *
        `;
        const values = [
            data.montant_minimum_actif, data.montant_minimum_pour, data.montant_minimum_valeur,
            data.courier_cc_actif, data.courier_cc_liste, data.approbation_commentaires_auto,
            data.fuseau_horaire_actif, data.fuseau_horaire_selectionne, data.deux_facteurs_actif,
            data.afficher_num_entreprise, data.afficher_num_taxes, data.afficher_adresse_entreprise,
            data.afficher_telephone, data.vacances_actif, data.vacances_date_debut,
            data.vacances_date_fin, data.vacances_operation_produit, data.vacances_message,
            data.paypal_actif, data.paypal_email, data.stripe_actif, data.stripe_compte_id,
            data.shippo_actif, data.shippo_api_token, data.shippo_mode,
            data.easypost_actif, data.easypost_cle_test, data.easypost_cle_prod, data.easypost_mode,
            data.postes_actif, data.postes_username, data.postes_password,
            data.postes_customer_number, data.postes_mode,
            vendeurId
        ];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Configuration non trouvée' });

        pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['CONFIG_VENDEUR_UPDATE', req.user?.email || 'vendeur', JSON.stringify({ vendeur_id: vendeurId }), 'info']
        ).catch(e => console.error('Erreur log:', e));

        console.log(`✅ Configuration mise à jour pour le vendeur ${vendeurId}`);
        res.json({ success: true, config: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur PUT /:vendeurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /:vendeurId/config
router.patch('/:vendeurId/config', authenticateToken, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.vendeurId);
        const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
        if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

        const updates = req.body;
        const fields = Object.keys(updates);
        if (fields.length === 0) return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });

        const values = Object.values(updates);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        values.push(vendeurId);

        const result = await pool.query(
            `UPDATE config_vendeur SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE vendeur_id = $${values.length} RETURNING *`,
            values
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Configuration non trouvée' });

        console.log(`✅ Configuration partiellement mise à jour pour le vendeur ${vendeurId}`);
        res.json({ success: true, config: result.rows[0] });
    } catch (err) {
        console.error('❌ Erreur PATCH /:vendeurId/config:', err);
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/vendeurs/:vendeurId/stripe/connect
// Lance l'onboarding Stripe Connect pour le vendeur
// Retourne un lien d'onboarding à ouvrir dans le navigateur
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:vendeurId/stripe/connect', authenticateToken, async (req, res) => {
  const vendeurId = parseInt(req.params.vendeurId);
  const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
  if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

  try {
    // Lire la config Stripe admin
    const cfgResult = await pool.query(
      `SELECT account_type, connect_flow, processing_method,
              full_service, cross_border, debit_negative,
              delai_actif, delai_jours,
              controller_losses, controller_fees_payer,
              controller_dashboard, controller_requirements,
              country_code, sandbox,
              dev_secret_key, prod_secret_key,
              dev_client_id, prod_client_id
       FROM configuration_stripe_admin WHERE id = 1`
    );
    if (cfgResult.rows.length === 0) {
      return res.status(500).json({ error: 'Configuration Stripe non configurée par l\'administrateur' });
    }
    const cfg = cfgResult.rows[0];

    // Déchiffrer la clé Stripe avec le helper centralisé
    const stripeKey = dechiffrer(cfg.sandbox ? cfg.dev_secret_key : cfg.prod_secret_key);

    if (!stripeKey) {
      return res.status(500).json({ error: 'Clé Stripe non configurée. Contactez l\'administrateur.' });
    }

    const stripe      = require('stripe')(stripeKey);
    const accountType = (cfg.account_type || 'EXPRESS').toUpperCase();
    const country     = cfg.country_code || 'CA';
    const isDirectCharge = (cfg.processing_method || '').toUpperCase().includes('DIRECT');

    // Charger le vendeur
    const vendeurResult = await pool.query(
      `SELECT id, nom, email, telephone, site_web, nom_boutique,
              description, description_longue, stripe_account_id
       FROM vendeurs WHERE id = $1`,
      [vendeurId]
    );
    if (vendeurResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendeur introuvable' });
    }
    const vendeur = vendeurResult.rows[0];

    let stripeAccountId = vendeur.stripe_account_id;

    // Si un compte existe en BD, vérifier qu'il existe encore sur Stripe
    if (stripeAccountId) {
      try {
        await stripe.accounts.retrieve(stripeAccountId);
        console.log(`   ✅ Compte Stripe existant valide: ${stripeAccountId}`);
      } catch (stripeErr) {
        if (stripeErr.code === 'account_invalid' || stripeErr.message?.includes('No such account')) {
          console.log(`   ⚠️  Compte ${stripeAccountId} introuvable sur Stripe — nettoyage BD et recréation`);
          // Nettoyer la BD
          await pool.query(
            `UPDATE vendeurs SET
               stripe_account_id      = NULL,
               stripe_account_type    = NULL,
               stripe_charges_enabled = false,
               stripe_payouts_enabled = false,
               stripe_verified        = false,
               stripe_requirements    = NULL,
               updated_at             = NOW()
             WHERE id = $1`,
            [vendeurId]
          );
          await pool.query(
            `UPDATE config_vendeur SET stripe_compte_id = NULL, updated_at = NOW() WHERE vendeur_id = $1`,
            [vendeurId]
          );
          stripeAccountId = null; // Forcer la recréation
        } else {
          throw stripeErr; // Autre erreur Stripe — la propager
        }
      }
    }

    // Créer le compte Stripe si pas encore existant (ou si supprimé)
    if (!stripeAccountId) {
      const capabilities = isDirectCharge
        ? { card_payments: { requested: true }, transfers: { requested: true } }
        : { transfers: { requested: true } };

      const payoutInterval = cfg.delai_actif ? 'daily' : 'manual';
      const delayDays      = cfg.delai_actif ? (parseInt(cfg.delai_jours) || 3) : undefined;

      const payoutSettings = {
        debit_negative_balances: cfg.debit_negative === true,
        schedule: {
          interval: payoutInterval,
          ...(delayDays !== undefined && { delay_days: delayDays }),
        },
      };

      // Préremplir business_profile depuis les infos du vendeur
      const businessProfile = {};
      if (vendeur.site_web)      businessProfile.url                = vendeur.site_web;
      if (vendeur.telephone)     businessProfile.support_phone       = vendeur.telephone;
      if (vendeur.nom_boutique)  businessProfile.name                = vendeur.nom_boutique;
      const desc = vendeur.description_longue || vendeur.description;
      if (desc) businessProfile.product_description = desc.substring(0, 500);

      let accountParams = {
        country,
        email:    vendeur.email,
        metadata: { vendeur_id: vendeurId.toString(), plateforme: 'e-vend.ca' },
        ...(Object.keys(businessProfile).length > 0 && { business_profile: businessProfile }),
      };

      if (accountType === 'STANDARD') {
        // Standard : Stripe applique les defaults automatiquement
        accountParams.controller = {
          losses:                 { payments: 'stripe' },
          fees:                   { payer: 'account' },
          stripe_dashboard:       { type: 'full' },
          requirement_collection: 'stripe',
        };

      } else if (accountType === 'EXPRESS') {
        accountParams.controller = {
          losses:                 { payments: 'application' },
          fees:                   { payer: 'application' },
          stripe_dashboard:       { type: 'express' },
          requirement_collection: 'stripe',
        };
        accountParams.capabilities = capabilities;
        accountParams.settings     = { payouts: payoutSettings };
        if (cfg.cross_border) accountParams.tos_acceptance = { service_agreement: 'full' };

      } else if (accountType === 'CUSTOM') {
        const feesPayer = (cfg.controller_fees_payer === 'application_custom' || !cfg.controller_fees_payer)
          ? 'application' : cfg.controller_fees_payer;
        accountParams.controller = {
          losses:                 { payments: cfg.controller_losses      || 'application' },
          fees:                   { payer:    feesPayer },
          stripe_dashboard:       { type:     cfg.controller_dashboard   || 'none' },
          requirement_collection:             cfg.controller_requirements || 'application',
        };
        accountParams.business_type  = 'individual';
        accountParams.capabilities   = capabilities;
        accountParams.settings       = { payouts: payoutSettings };
        accountParams.tos_acceptance = {
          date:              Math.floor(Date.now() / 1000),
          ip:                req.ip || '127.0.0.1',
          service_agreement: cfg.full_service ? 'full' : 'recipient',
        };
      }

      const stripeAccount = await stripe.accounts.create(accountParams);
      stripeAccountId = stripeAccount.id;

      // Sauvegarder dans la BD vendeur ET config_vendeur
      await pool.query(
        `UPDATE vendeurs SET
           stripe_account_id   = $1,
           stripe_account_type = $2,
           updated_at          = NOW()
         WHERE id = $3`,
        [stripeAccountId, accountType, vendeurId]
      );
      await pool.query(
        `UPDATE config_vendeur SET stripe_actif = true, stripe_compte_id = $1, updated_at = NOW()
         WHERE vendeur_id = $2`,
        [stripeAccountId, vendeurId]
      );

      console.log(`✅ Compte Stripe ${accountType} créé pour vendeur ${vendeurId}: ${stripeAccountId}`);

      // Configurer delay_days si nécessaire
      if (cfg.delai_actif && delayDays && accountType !== 'STANDARD') {
        try {
          await stripe.accounts.update(stripeAccountId, {
            settings: { payouts: { schedule: { interval: payoutInterval, delay_days: delayDays } } }
          });
        } catch (e) { console.warn('⚠️ delay_days non configuré:', e.message); }
      }
    }

    // Générer le lien d'onboarding
    // Standard via OAuth
    if (accountType === 'STANDARD' && (cfg.connect_flow || '').includes('OAuth')) {
      const clientId = dechiffrer(cfg.sandbox ? cfg.dev_client_id : cfg.prod_client_id);
      const oauthUrl = `https://connect.stripe.com/oauth/authorize`
        + `?response_type=code&client_id=${clientId}&scope=read_write`
        + `&state=${vendeurId}`
        + `&redirect_uri=${encodeURIComponent(process.env.STRIPE_OAUTH_REDIRECT_URI || '')}`;

      return res.json({
        success:        true,
        onboarding_url: oauthUrl,
        link_type:      'oauth',
        account_type:   accountType,
        message:        'Redirigez le vendeur vers ce lien pour connecter son compte Stripe',
      });
    }

    // Express / Custom / Standard API → account link
    const baseUrl     = process.env.FRONTEND_URL || 'https://admin.e-vend.ca';
    const accountLink = await stripe.accountLinks.create({
      account:     stripeAccountId,
      refresh_url: `${baseUrl}/vendeur/configuration?stripe=refresh`,
      return_url:  `${baseUrl}/vendeur/configuration?stripe=success`,
      type:        'account_onboarding',
      collection_options: { fields: 'eventually_due' },
    });

    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['STRIPE_VENDEUR_ONBOARDING', req.user?.email || 'vendeur',
       JSON.stringify({ vendeur_id: vendeurId, stripe_account_id: stripeAccountId, type: accountType }),
       'info']
    ).catch(() => {});

    res.json({
      success:        true,
      onboarding_url: accountLink.url,
      link_type:      'account_onboarding',
      account_type:   accountType,
      expires_at:     new Date(accountLink.expires_at * 1000).toISOString(),
      message:        'Redirigez le vendeur vers ce lien pour compléter son profil Stripe',
    });

  } catch (err) {
    console.error(`❌ Erreur Stripe connect vendeur ${vendeurId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/vendeurs/:vendeurId/stripe/statut
// Retourne le statut réel du compte Stripe Connect du vendeur
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:vendeurId/stripe/statut', authenticateToken, async (req, res) => {
  const vendeurId = parseInt(req.params.vendeurId);
  const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
  if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

  try {
    const vendeurResult = await pool.query(
      `SELECT id, nom, email, stripe_account_id, stripe_account_type,
              stripe_charges_enabled, stripe_payouts_enabled, stripe_verified,
              stripe_requirements
       FROM vendeurs WHERE id = $1`,
      [vendeurId]
    );
    if (vendeurResult.rows.length === 0) return res.status(404).json({ error: 'Vendeur introuvable' });
    const vendeur = vendeurResult.rows[0];

    if (!vendeur.stripe_account_id) {
      return res.json({
        connecte:   false,
        verifie:    false,
        message:    'Aucun compte Stripe Connect',
      });
    }

    // ✅ CORRECTION: Utiliser la clé de la plateforme AVEC stripeAccount
    const stripePlatform = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // ✅ IMPORTANT: passer stripeAccount dans les options pour interroger le compte du vendeur
    const stripeAccount = await stripePlatform.accounts.retrieve(
      vendeur.stripe_account_id,
      { stripeAccount: vendeur.stripe_account_id }
    );

    const chargesEnabled  = stripeAccount.charges_enabled;
    const payoutsEnabled  = stripeAccount.payouts_enabled;
    const docsManquants   = stripeAccount.requirements?.currently_due || [];
    const estVerifie      = chargesEnabled && payoutsEnabled && docsManquants.length === 0;

    // Mettre à jour la BD
    await pool.query(
      `UPDATE vendeurs SET
         stripe_charges_enabled = $1,
         stripe_payouts_enabled = $2,
         stripe_verified        = $3,
         stripe_requirements    = $4::jsonb,
         updated_at             = NOW()
       WHERE id = $5`,
      [chargesEnabled, payoutsEnabled, estVerifie,
       JSON.stringify(stripeAccount.requirements || {}), vendeurId]
    );

    res.json({
      connecte:          true,
      stripe_account_id: vendeur.stripe_account_id,
      account_type:      vendeur.stripe_account_type,
      charges_enabled:   chargesEnabled,
      payouts_enabled:   payoutsEnabled,
      verifie:           estVerifie,
      docs_manquants:    docsManquants,
      details_requis:    stripeAccount.requirements?.eventually_due || [],
      disabled_reason:   stripeAccount.requirements?.disabled_reason || null,
      payout_schedule:   stripeAccount.settings?.payouts?.schedule || null,
    });

  } catch (err) {
    console.error(`❌ Erreur statut Stripe vendeur ${vendeurId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/vendeurs/:vendeurId/stripe/disconnect
// Déconnecte le compte Stripe du vendeur (nettoyage BD)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:vendeurId/stripe/disconnect', authenticateToken, async (req, res) => {
  const vendeurId = parseInt(req.params.vendeurId);
  const isAdmin   = req.user.role === 'admin' || req.user.role === 'administration';
  if (!isAdmin) return res.status(403).json({ error: 'Réservé aux administrateurs' });

  try {
    await pool.query(
      `UPDATE vendeurs SET
         stripe_account_id      = NULL,
         stripe_account_type    = NULL,
         stripe_charges_enabled = false,
         stripe_payouts_enabled = false,
         stripe_verified        = false,
         stripe_requirements    = NULL,
         updated_at             = NOW()
       WHERE id = $1`,
      [vendeurId]
    );
    await pool.query(
      `UPDATE config_vendeur SET stripe_actif = false, stripe_compte_id = NULL, updated_at = NOW()
       WHERE vendeur_id = $1`,
      [vendeurId]
    );
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['STRIPE_VENDEUR_DISCONNECT', req.user?.email || 'admin',
       JSON.stringify({ vendeur_id: vendeurId }), 'warning']
    );
    res.json({ success: true, message: 'Compte Stripe déconnecté' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/vendeurs/:vendeurId/stripe/deconnecter
// Le vendeur déconnecte lui-même son compte Stripe
// Efface le lien en BD — le compte Stripe reste intact sur Stripe
// ═══════════════════════════════════════════════════════════════════════════
router.post('/:vendeurId/stripe/deconnecter', authenticateToken, async (req, res) => {
  const vendeurId    = parseInt(req.params.vendeurId);
  const isAuthorized = req.user.id === vendeurId || req.user.role === 'admin' || req.user.role === 'administration';
  if (!isAuthorized) return res.status(403).json({ error: 'Accès non autorisé' });

  try {
    await pool.query(
      `UPDATE vendeurs SET
         stripe_account_id      = NULL,
         stripe_account_type    = NULL,
         stripe_charges_enabled = false,
         stripe_payouts_enabled = false,
         stripe_verified        = false,
         stripe_requirements    = NULL,
         updated_at             = NOW()
       WHERE id = $1`,
      [vendeurId]
    );
    await pool.query(
      `UPDATE config_vendeur SET stripe_actif = false, stripe_compte_id = NULL, updated_at = NOW()
       WHERE vendeur_id = $1`,
      [vendeurId]
    );
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['STRIPE_VENDEUR_DECONNECTE', req.user?.email || 'vendeur',
       JSON.stringify({ vendeur_id: vendeurId }), 'info']
    );
    res.json({ success: true, message: 'Compte Stripe déconnecté de e-Vend. Votre compte Stripe reste intact.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;