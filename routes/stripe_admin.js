// routes/stripe_admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const crypto = require('crypto');

// ============================================================
// CRYPTAGE AES-256-GCM des clés Stripe sensibles
// Supporte ENCRYPTION_KEY, NOTES_ENCRYPTION_KEY, MSG_ENCRYPTION_KEY
// Format stocké en BD : iv:authTag:données_chiffrées (base64)
// ============================================================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  || process.env.NOTES_ENCRYPTION_KEY
  || process.env.MSG_ENCRYPTION_KEY;

function chiffrer(texte) {
  if (!texte) return null;
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY manquante dans .env');

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv   = crypto.randomBytes(12); // 96 bits pour GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const chiffre = Buffer.concat([cipher.update(texte, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Stocker : iv:authTag:données — tout en base64 séparé par ":"
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    chiffre.toString('base64'),
  ].join(':');
}

function dechiffrer(valeurStockee) {
  if (!valeurStockee) return null;
  if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY manquante dans .env');

  // Si la valeur n'est pas dans notre format crypté, la retourner telle quelle
  // (pour la compatibilité avec les anciennes clés non cryptées)
  if (!valeurStockee.includes(':')) return valeurStockee;

  const parties = valeurStockee.split(':');
  if (parties.length !== 3) return valeurStockee;

  const key     = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv      = Buffer.from(parties[0], 'base64');
  const authTag = Buffer.from(parties[1], 'base64');
  const chiffre = Buffer.from(parties[2], 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(chiffre), decipher.final()]).toString('utf8');
}

// ============================================
// ROUTES POUR LA CONFIGURATION STRIPE ADMIN
// ============================================

// GET - Récupérer la configuration Stripe
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM configuration_stripe_admin WHERE id = 1'
        );
        
        if (result.rows.length === 0) {
            const newConfig = await pool.query(
                `INSERT INTO configuration_stripe_admin (id) VALUES (1) RETURNING *`
            );
            return res.json(newConfig.rows[0]);
        }

        // Déchiffrer les clés sensibles avant d'envoyer au frontend
        const row = result.rows[0];
        const champsSecrets = [
          'dev_secret_key', 'dev_publish_key', 'dev_client_id',
          'dev_webhook_secret', 'dev_memb_webhook_secret',
          'prod_secret_key', 'prod_publish_key', 'prod_client_id',
          'prod_webhook_secret', 'prod_memb_webhook_secret',
        ];
        for (const champ of champsSecrets) {
          if (row[champ]) {
            try { row[champ] = dechiffrer(row[champ]); } catch (_) {}
          }
        }
        
        res.json(row);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/admin/stripe:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Mettre à jour toute la configuration Stripe
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const data = req.body;
        
        console.log('========================================');
        console.log('📥 SAUVEGARDE CONFIG STRIPE ADMIN');
        console.log('========================================');
        console.log('🔑 Utilisateur:', req.user?.email);
        
        // Vérifier que la ligne id=1 existe
        const rowCheck = await pool.query('SELECT id FROM configuration_stripe_admin WHERE id = 1');
        
        if (rowCheck.rows.length === 0) {
            await pool.query('INSERT INTO configuration_stripe_admin (id) VALUES (1)');
        }
        
        // Chiffrer les clés sensibles avant de stocker en BD
        const champsSecrets = [
          'dev_secret_key', 'dev_publish_key', 'dev_client_id',
          'dev_webhook_secret', 'dev_memb_webhook_secret',
          'prod_secret_key', 'prod_publish_key', 'prod_client_id',
          'prod_webhook_secret', 'prod_memb_webhook_secret',
        ];
        for (const champ of champsSecrets) {
          if (data[champ]) {
            try { data[champ] = chiffrer(data[champ]); } catch (_) {}
          }
        }

        // Convertir payment_methods en JSON si nécessaire
        const paymentMethodsJSON = data.payment_methods ? JSON.stringify(data.payment_methods) : null;
        
        const query = `
            UPDATE configuration_stripe_admin SET
                -- Paramètres généraux
                use_stripe_for = COALESCE($1, use_stripe_for),
                use_stripe_for_who = COALESCE($2, use_stripe_for_who),
                card_details_on = COALESCE($3, card_details_on),
                restrict_seller = COALESCE($4, restrict_seller),
                auto_cancel = COALESCE($5, auto_cancel),
                cancel_hour = COALESCE($6, cancel_hour),
                payment_flow = COALESCE($7, payment_flow),
                processing_method = COALESCE($8, processing_method),
                stripe_fee_bear = COALESCE($9, stripe_fee_bear),
                payment_name = COALESCE($10, payment_name),
                reminder_enabled = COALESCE($11, reminder_enabled),
                reminder_time = COALESCE($12, reminder_time),
                reminder_days = COALESCE($13, reminder_days),
                description = COALESCE($14, description),
                country_code = COALESCE($15, country_code),
                statement_desc = COALESCE($16, statement_desc),
                
                -- Méthodes de paiement
                payment_methods = COALESCE($17::jsonb, payment_methods),
                
                -- Délai de versement
                delai_actif = COALESCE($18, delai_actif),
                delai_jours = COALESCE($19, delai_jours),
                delai_statut = COALESCE($20, delai_statut),
                delai_min_montant = COALESCE($21, delai_min_montant),
                notif_versement = COALESCE($22, notif_versement),
                
                -- Configuration compte vendeur
                account_type = COALESCE($23, account_type),
                connect_flow = COALESCE($24, connect_flow),
                full_service = COALESCE($25, full_service),
                cross_border = COALESCE($26, cross_border),
                debit_negative = COALESCE($27, debit_negative),
                payout_time = COALESCE($28, payout_time),
                
                -- Credentials (dev)
                sandbox = COALESCE($29, sandbox),
                dev_publish_key = COALESCE($30, dev_publish_key),
                dev_secret_key = COALESCE($31, dev_secret_key),
                dev_client_id = COALESCE($32, dev_client_id),
                dev_webhook_secret = COALESCE($33, dev_webhook_secret),
                dev_memb_webhook_secret = COALESCE($34, dev_memb_webhook_secret),
                
                -- Credentials (prod)
                prod_publish_key = COALESCE($35, prod_publish_key),
                prod_secret_key = COALESCE($36, prod_secret_key),
                prod_client_id = COALESCE($37, prod_client_id),
                prod_webhook_secret = COALESCE($38, prod_webhook_secret),
                prod_memb_webhook_secret = COALESCE($39, prod_memb_webhook_secret),
                
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
            RETURNING *
        `;
        
        const values = [
            // Paramètres généraux (1-16)
            data.use_stripe_for,
            data.use_stripe_for_who,
            data.card_details_on,
            data.restrict_seller,
            data.auto_cancel,
            data.cancel_hour,
            data.payment_flow,
            data.processing_method,
            data.stripe_fee_bear,
            data.payment_name,
            data.reminder_enabled,
            data.reminder_time,
            data.reminder_days,
            data.description,
            data.country_code,
            data.statement_desc,
            
            // Méthodes de paiement (17)
            paymentMethodsJSON,
            
            // Délai de versement (18-22)
            data.delai_actif,
            data.delai_jours,
            data.delai_statut,
            data.delai_min_montant,
            data.notif_versement,
            
            // Configuration compte vendeur (23-28)
            data.account_type,
            data.connect_flow,
            data.full_service,
            data.cross_border,
            data.debit_negative,
            data.payout_time,
            
            // Credentials dev (29-34)
            data.sandbox,
            data.dev_publish_key,
            data.dev_secret_key,
            data.dev_client_id,
            data.dev_webhook_secret,
            data.dev_memb_webhook_secret,
            
            // Credentials prod (35-39)
            data.prod_publish_key,
            data.prod_secret_key,
            data.prod_client_id,
            data.prod_webhook_secret,
            data.prod_memb_webhook_secret
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['CONFIG_STRIPE_ADMIN_UPDATE', req.user?.email || 'admin',
             JSON.stringify({ updated_by: req.user?.email, timestamp: new Date().toISOString() }), 'info']
        ).catch(e => console.error('Erreur log:', e.message));
        
        console.log('✅ Configuration Stripe admin sauvegardee');

        // ── Appliquer les changements sur tous les comptes Stripe Connect ──────
        // Non bloquant — on répond d'abord, on propage après
        const cfg = result.rows[0];
        appliquerConfigStripe(cfg).catch(e =>
          console.error('❌ Erreur propagation config Stripe:', e.message)
        );

        console.log('========================================\n');
        
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur POST /api/admin/stripe:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH - Mettre à jour partiellement la configuration Stripe
router.patch('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnee a mettre a jour' });
        }
        
        // Mapper les noms camelCase vers snake_case si nécessaire
        const columnMap = {
            'useStripeFor': 'use_stripe_for',
            'useStripeForWho': 'use_stripe_for_who',
            'cardDetailsOn': 'card_details_on',
            'restrictSeller': 'restrict_seller',
            'autoCancel': 'auto_cancel',
            'cancelHour': 'cancel_hour',
            'paymentFlow': 'payment_flow',
            'processingMethod': 'processing_method',
            'stripeFeeBear': 'stripe_fee_bear',
            'paymentName': 'payment_name',
            'reminderEnabled': 'reminder_enabled',
            'reminderTime': 'reminder_time',
            'reminderDays': 'reminder_days',
            'countryCode': 'country_code',
            'statementDesc': 'statement_desc',
            'delaiActif': 'delai_actif',
            'delaiJours': 'delai_jours',
            'delaiStatut': 'delai_statut',
            'delaiMinMontant': 'delai_min_montant',
            'notifVersement': 'notif_versement',
            'accountType': 'account_type',
            'connectFlow': 'connect_flow',
            'fullService': 'full_service',
            'crossBorder': 'cross_border',
            'debitNegative': 'debit_negative',
            'payoutTime': 'payout_time',
            'devPublishKey': 'dev_publish_key',
            'devSecretKey': 'dev_secret_key',
            'devClientId': 'dev_client_id',
            'devWebhookSecret': 'dev_webhook_secret',
            'devMembWebhookSecret': 'dev_memb_webhook_secret',
            'prodPublishKey': 'prod_publish_key',
            'prodSecretKey': 'prod_secret_key',
            'prodClientId': 'prod_client_id',
            'prodWebhookSecret': 'prod_webhook_secret',
            'prodMembWebhookSecret': 'prod_memb_webhook_secret',
            'paymentMethods': 'payment_methods'
        };
        
        const dbFields = fields.map(f => columnMap[f] || f);
        const values = Object.values(updates);
        
        // Gérer spécifiquement payment_methods (JSONB)
        let setClause = '';
        let finalValues = [];
        let paramIndex = 1;
        
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const dbField = dbFields[i];
            const value = values[i];
            
            if (dbField === 'payment_methods') {
                setClause += `${dbField} = $${paramIndex}::jsonb, `;
                finalValues.push(JSON.stringify(value));
            } else {
                setClause += `${dbField} = $${paramIndex}, `;
                finalValues.push(value);
            }
            paramIndex++;
        }
        
        setClause += 'updated_at = CURRENT_TIMESTAMP';
        finalValues.push(1);
        
        const query = `
            UPDATE configuration_stripe_admin 
            SET ${setClause}
            WHERE id = $${finalValues.length}
            RETURNING *
        `;
        
        const result = await pool.query(query, finalValues);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur PATCH /api/admin/stripe:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ROUTES POUR LES VENDEURS STRIPE CONNECT
// ============================================

// GET - Récupérer tous les vendeurs Stripe Connect
router.get('/vendeurs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { statut, recherche } = req.query;
        
        let query = 'SELECT * FROM vendeurs_stripe_connect_admin WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (statut && statut !== 'tous') {
            query += ` AND stripe_account_status = $${paramIndex}`;
            params.push(statut);
            paramIndex++;
        }
        
        if (recherche) {
            query += ` AND (vendeur_nom ILIKE $${paramIndex} OR vendeur_email ILIKE $${paramIndex} OR stripe_account_id ILIKE $${paramIndex})`;
            params.push(`%${recherche}%`);
            paramIndex++;
        }
        
        query += ' ORDER BY connected_at DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/admin/stripe/vendeurs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Récupérer un vendeur Stripe Connect par ID
router.get('/vendeurs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        
        const result = await pool.query(
            'SELECT * FROM vendeurs_stripe_connect_admin WHERE vendeur_id = $1',
            [vendeurId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendeur non trouve' });
        }
        
        res.json(result.rows[0]);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/admin/stripe/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT - Mettre à jour le statut d'un vendeur Stripe Connect
router.put('/vendeurs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        const { stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled, stripe_verification_disabled_reason } = req.body;
        
        const query = `
            UPDATE vendeurs_stripe_connect_admin SET
                stripe_account_status = COALESCE($1, stripe_account_status),
                stripe_charges_enabled = COALESCE($2, stripe_charges_enabled),
                stripe_payouts_enabled = COALESCE($3, stripe_payouts_enabled),
                stripe_verification_disabled_reason = COALESCE($4, stripe_verification_disabled_reason),
                last_sync_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE vendeur_id = $5
            RETURNING *
        `;
        
        const values = [
            stripe_account_status,
            stripe_charges_enabled,
            stripe_payouts_enabled,
            stripe_verification_disabled_reason,
            vendeurId
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendeur non trouve' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['STRIPE_VENDEUR_UPDATE', req.user?.email || 'admin',
             JSON.stringify({ vendeur_id: vendeurId, nouveau_statut: stripe_account_status }), 'info']
        ).catch(e => console.error('Erreur log:', e.message));
        
        res.json({ success: true, vendeur: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur PUT /api/admin/stripe/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Synchroniser les vendeurs Stripe (à appeler périodiquement)
router.post('/vendeurs/sync', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Ici, tu pourras appeler l'API Stripe pour synchroniser les vendeurs
        // Pour l'instant, on met juste à jour last_sync_at
        await pool.query(
            `UPDATE vendeurs_stripe_connect_admin SET last_sync_at = CURRENT_TIMESTAMP`
        );
        
        res.json({ success: true, message: 'Synchronisation lancee' });
        
    } catch (err) {
        console.error('❌ Erreur POST /api/admin/stripe/vendeurs/sync:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Supprimer un vendeur Stripe Connect (déconnecter)
router.delete('/vendeurs/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const vendeurId = parseInt(req.params.id);
        
        const result = await pool.query(
            'DELETE FROM vendeurs_stripe_connect_admin WHERE vendeur_id = $1 RETURNING vendeur_id, vendeur_nom',
            [vendeurId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendeur non trouve' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['STRIPE_VENDEUR_DELETE', req.user?.email || 'admin',
             JSON.stringify({ vendeur_id: vendeurId, vendeur_nom: result.rows[0].vendeur_nom }), 'warning']
        ).catch(e => console.error('Erreur log:', e.message));
        
        res.json({ success: true, message: 'Vendeur deconnecte de Stripe' });
        
    } catch (err) {
        console.error('❌ Erreur DELETE /api/admin/stripe/vendeurs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});


// ============================================================
// ONBOARDING STRIPE CONNECT — VENDEURS
// Conforme API Stripe 2024 — utilise controller properties
// (le paramètre "type" est déprécié par Stripe)
// ============================================================

// POST /api/admin/stripe/onboarding/:vendeur_id
router.post('/onboarding/:vendeur_id', authenticateToken, isAdmin, async (req, res) => {
  const vendeurId = parseInt(req.params.vendeur_id);

  try {
    // 1. Lire toute la config Stripe
    const configResult = await pool.query(
      `SELECT account_type, connect_flow, processing_method,
              full_service, cross_border, debit_negative,
              delai_actif, delai_jours,
              controller_losses, controller_fees_payer,
              controller_dashboard, controller_requirements,
              country_code, sandbox, dev_secret_key, prod_secret_key,
              dev_client_id, prod_client_id
       FROM configuration_stripe_admin WHERE id = 1`
    );
    if (configResult.rows.length === 0) {
      return res.status(500).json({ error: 'Configuration Stripe introuvable' });
    }
    const cfg = configResult.rows[0];

    const stripeKey = dechiffrer(cfg.sandbox ? cfg.dev_secret_key : cfg.prod_secret_key);
    if (!stripeKey) {
      return res.status(500).json({
        error: `Cle Stripe ${cfg.sandbox ? 'dev (dev_secret_key)' : 'prod (prod_secret_key)'} non configuree`
      });
    }

    const stripe         = require('stripe')(stripeKey);
    const accountType    = (cfg.account_type || 'EXPRESS').toUpperCase();
    const country        = cfg.country_code || 'CA';
    const isDirectCharge = (cfg.processing_method || '').toUpperCase().includes('DIRECT');

    // Payout schedule depuis la config
    // delai_actif=true → daily avec delay_days | delai_actif=false → manual
    const payoutInterval = cfg.delai_actif ? 'daily' : 'manual';
    const delayDays      = cfg.delai_actif ? (parseInt(cfg.delai_jours) || 3) : undefined;

    // 2. Charger le vendeur — avec les infos business_profile si disponibles
    const vendeurResult = await pool.query(
      `SELECT id, nom, email, stripe_account_id,
              site_web, telephone, nom_boutique,
              description, description_longue
       FROM vendeurs WHERE id = $1`,
      [vendeurId]
    );
    if (vendeurResult.rows.length === 0) {
      return res.status(404).json({ error: `Vendeur ${vendeurId} introuvable` });
    }
    const vendeur = vendeurResult.rows[0];

    let stripeAccountId = vendeur.stripe_account_id;

    if (!stripeAccountId) {
      console.log(`\n Création compte Stripe ${accountType} pour vendeur ${vendeurId}...`);

      // Capabilities selon processing_method
      const capabilities = isDirectCharge
        ? { card_payments: { requested: true }, transfers: { requested: true } }
        : { transfers: { requested: true } };

      // ── Payout settings ──────────────────────────────────────────────────
      // IMPORTANT: delay_days appartient à settlement_timing, PAS à schedule
      // À la création on configure seulement l'interval dans schedule
      // Le delay_days_override se configure via Balance Settings API séparément
      const payoutSettings = {
        debit_negative_balances: cfg.debit_negative === true,
        schedule: {
          interval: payoutInterval,
          // delay_days n'est PAS dans schedule — c'est settlement_timing.delay_days_override
        },
      };

      // ── business_profile — préremplit les infos pour réduire les requirements ──
      // Stripe exige business_profile.url et business_profile.support_phone
      // Si disponibles dans la BD vendeur, on les préremplit
      const businessProfile = {};
      if (vendeur.site_web)     businessProfile.url                 = vendeur.site_web;
      if (vendeur.telephone)    businessProfile.support_phone        = vendeur.telephone;
      if (vendeur.nom_boutique) businessProfile.name                 = vendeur.nom_boutique;
      const desc = vendeur.description_longue || vendeur.description;
      if (desc)                 businessProfile.product_description  = desc.substring(0, 500);

      let accountParams = {
        country:  country,
        email:    vendeur.email,
        metadata: { vendeur_id: vendeurId.toString(), plateforme: 'e-vend.ca' },
        ...(Object.keys(businessProfile).length > 0 && { business_profile: businessProfile }),
      };

      if (accountType === 'STANDARD') {
        // Standard : on n'envoie PAS de controller properties
        // Si aucun controller n'est spécifié, Stripe applique automatiquement
        // les valeurs Standard (losses=stripe, fees=account, dashboard=full, requirements=stripe)
        // Standard ne supporte pas capabilities ni settings.payouts à la création non plus
        // Rien à ajouter — country + email + business_profile suffisent

      } else if (accountType === 'EXPRESS') {
        // Express : losses=application, fees=application (seule valeur valide à la création)
        // dashboard=express, requirements=stripe
        // NOTE: Stripe retourne application_express en réponse mais on NE PEUT PAS l'envoyer
        accountParams.controller = {
          losses:                 { payments: 'application' },
          fees:                   { payer: 'application' },
          stripe_dashboard:       { type: 'express' },
          requirement_collection: 'stripe',
        };
        accountParams.capabilities = capabilities;
        accountParams.settings     = { payouts: payoutSettings };
        if (cfg.cross_border) {
          accountParams.tos_acceptance = { service_agreement: 'full' };
        }

      } else if (accountType === 'CUSTOM') {
        // Custom : controller entièrement configurable
        // tos_acceptance obligatoire — la plateforme atteste au nom du vendeur
        // business_type requis quand stripe_dashboard.type = 'none' (doc Stripe)
        // fees.payer : seulement 'application' ou 'account' valides à la création
        const feesPayer = (cfg.controller_fees_payer === 'application_custom' || !cfg.controller_fees_payer)
          ? 'application'
          : cfg.controller_fees_payer;
        accountParams.controller = {
          losses:                 { payments: cfg.controller_losses      || 'application' },
          fees:                   { payer:    feesPayer },
          stripe_dashboard:       { type:     cfg.controller_dashboard   || 'none' },
          requirement_collection:             cfg.controller_requirements || 'application',
        };
        accountParams.business_type = 'individual'; // requis pour dashboard.type = 'none'
        accountParams.capabilities  = capabilities;
        accountParams.settings      = { payouts: payoutSettings };
        accountParams.tos_acceptance = {
          date:              Math.floor(Date.now() / 1000),
          ip:                req.ip || req.connection?.remoteAddress || '127.0.0.1',
          service_agreement: cfg.full_service ? 'full' : 'recipient',
        };
      }

      const stripeAccount = await stripe.accounts.create(accountParams);
      stripeAccountId = stripeAccount.id;
      console.log(`   OK Compte Stripe cree: ${stripeAccountId}`);

      // ── Configurer delay_days via accounts.update avec Stripe-Account header ──
      // settlement_timing.delay_days se configure via settings.payouts après la création
      // Le SDK Node utilise stripe.accounts.update() avec { stripeAccount: id } comme option
      if (cfg.delai_actif && delayDays !== undefined && accountType !== 'STANDARD') {
        try {
          // D'abord mettre à jour l'interval du payout schedule
          await stripe.accounts.update(
            stripeAccountId,
            { settings: { payouts: { schedule: { interval: payoutInterval, delay_days: delayDays } } } }
          );
          console.log(`   OK delay_days configuré: ${delayDays} jours (interval: ${payoutInterval})`);
        } catch (payoutErr) {
          // Non bloquant — le compte est créé, le payout se configure après si besoin
          console.warn(`   ⚠️ delay_days non configuré: ${payoutErr.message}`);
        }
      }

      await pool.query(
        `UPDATE vendeurs SET stripe_account_id=$1, stripe_account_type=$2, updated_at=NOW() WHERE id=$3`,
        [stripeAccountId, accountType, vendeurId]
      );

      await pool.query(
        `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
        ['STRIPE_ACCOUNT_CREATED', 'admin',
         JSON.stringify({ vendeur_id: vendeurId, stripe_account_id: stripeAccountId, type: accountType }),
         'info']
      ).catch(e => console.error('Erreur log:', e.message));

    } else {
      console.log(`\n Compte existant (${stripeAccountId}) — nouveau lien d'onboarding...`);
    }

    // 4. Generer le lien d'onboarding

    // Standard via OAuth
    if (accountType === 'STANDARD' && (cfg.connect_flow || '').includes('OAuth')) {
      const clientId = dechiffrer(cfg.sandbox ? cfg.dev_client_id : cfg.prod_client_id);
      if (!clientId) {
        return res.status(500).json({ error: 'Client ID Stripe non configure pour OAuth' });
      }
      const oauthUrl = `https://connect.stripe.com/oauth/authorize`
        + `?response_type=code`
        + `&client_id=${clientId}`
        + `&scope=read_write`
        + `&state=${vendeurId}`
        + `&redirect_uri=${encodeURIComponent(process.env.STRIPE_OAUTH_REDIRECT_URI || '')}`;

      return res.json({
        success: true, onboarding_url: oauthUrl,
        stripe_account_id: stripeAccountId, account_type: accountType, link_type: 'oauth',
      });
    }

    // Express / Custom / Standard via API → account link
    const linkType    = cfg.full_service ? 'account_onboarding' : 'account_update';
    const baseUrl     = process.env.FRONTEND_URL || 'https://admin.e-vend.ca';

    // collection_options[fields]:
    // 'eventually_due' = upfront onboarding — collecte tout d'emblée (recommandé)
    // 'currently_due'  = incremental onboarding — collecte seulement ce qui est requis maintenant
    const accountLink = await stripe.accountLinks.create({
      account:     stripeAccountId,
      refresh_url: `${baseUrl}/admin/stripe/onboarding/${vendeurId}?refresh=true`,
      return_url:  `${baseUrl}/admin/stripe/onboarding/${vendeurId}?success=true`,
      type:        linkType,
      collection_options: {
        fields: 'eventually_due', // collecte toutes les infos d'emblée
      },
    });

    console.log(`   OK Lien onboarding (${linkType}): ${accountLink.url}`);

    res.json({
      success: true, onboarding_url: accountLink.url,
      stripe_account_id: stripeAccountId, account_type: accountType,
      link_type: linkType,
      expires_at: new Date(accountLink.expires_at * 1000).toISOString(),
      config_appliquee: {
        account_type: accountType, processing_method: cfg.processing_method,
        payout_interval: payoutInterval, delay_days: delayDays,
        debit_negative: cfg.debit_negative, cross_border: cfg.cross_border,
        mode: cfg.sandbox ? 'sandbox (test)' : 'production',
      },
    });

  } catch (err) {
    console.error(`Erreur onboarding Stripe vendeur ${vendeurId}:`, err.message);
    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['STRIPE_ONBOARDING_ERREUR', 'admin',
       JSON.stringify({ vendeur_id: vendeurId, error: err.message }), 'error']
    ).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stripe/onboarding/:vendeur_id/statut
router.get('/onboarding/:vendeur_id/statut', authenticateToken, isAdmin, async (req, res) => {
  const vendeurId = parseInt(req.params.vendeur_id);
  try {
    const configResult = await pool.query(
      `SELECT sandbox, dev_secret_key, prod_secret_key FROM configuration_stripe_admin WHERE id = 1`
    );
    const cfg       = configResult.rows[0];
    const stripeKey = dechiffrer(cfg.sandbox ? cfg.dev_secret_key : cfg.prod_secret_key);
    if (!stripeKey) return res.status(500).json({ error: 'Cle Stripe non configuree' });

    const vendeurResult = await pool.query(
      `SELECT id, nom, email, stripe_account_id, stripe_charges_enabled,
              stripe_payouts_enabled, stripe_verified
       FROM vendeurs WHERE id = $1`,
      [vendeurId]
    );
    if (vendeurResult.rows.length === 0) return res.status(404).json({ error: 'Vendeur introuvable' });
    const vendeur = vendeurResult.rows[0];

    if (!vendeur.stripe_account_id) {
      return res.json({ vendeur_id: vendeurId, stripe_lie: false, message: 'Pas de compte Stripe Connect' });
    }

    const stripe        = require('stripe')(stripeKey);
    const stripeAccount = await stripe.accounts.retrieve(vendeur.stripe_account_id);

    const chargesEnabled = stripeAccount.charges_enabled;
    const payoutsEnabled = stripeAccount.payouts_enabled;
    const docManquants   = stripeAccount.requirements?.currently_due || [];
    const estVerifie     = chargesEnabled && payoutsEnabled && docManquants.length === 0;

    await pool.query(
      `UPDATE vendeurs SET stripe_charges_enabled=$1, stripe_payouts_enabled=$2,
       stripe_verified=$3, stripe_requirements=$4::jsonb, updated_at=NOW() WHERE id=$5`,
      [chargesEnabled, payoutsEnabled, estVerifie,
       JSON.stringify(stripeAccount.requirements || {}), vendeurId]
    );

    res.json({
      vendeur_id: vendeurId, vendeur_nom: vendeur.nom, stripe_lie: true,
      stripe_account_id: vendeur.stripe_account_id,
      charges_enabled: chargesEnabled, payouts_enabled: payoutsEnabled,
      est_verifie: estVerifie, documents_manquants: docManquants,
      details_requis: stripeAccount.requirements?.eventually_due || [],
      disabled_reason: stripeAccount.requirements?.disabled_reason || null,
    });

  } catch (err) {
    console.error(`Erreur statut Stripe vendeur ${vendeurId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/admin/stripe/webhook/register
// Enregistre automatiquement un webhook sur Stripe et sauvegarde le secret
// type = 'principal' → events de paiement sur ton compte platform
// type = 'connect'   → events sur les comptes Connect vendeurs
// ═════════════════════════════════════════════════════════════════════════════
router.post('/webhook/register', authenticateToken, isAdmin, async (req, res) => {
  const { type } = req.body; // 'principal' ou 'connect'

  if (!['principal', 'connect'].includes(type)) {
    return res.status(400).json({ error: 'type doit être "principal" ou "connect"' });
  }

  try {
    // Lire la config
    const cfgResult = await pool.query(
      `SELECT sandbox, dev_secret_key, prod_secret_key FROM configuration_stripe_admin WHERE id = 1`
    );
    if (cfgResult.rows.length === 0) {
      return res.status(500).json({ error: 'Configuration Stripe introuvable' });
    }
    const cfg      = cfgResult.rows[0];
    const stripeKey = dechiffrer(cfg.sandbox ? cfg.dev_secret_key : cfg.prod_secret_key);
    if (!stripeKey) {
      return res.status(500).json({ error: 'Clé Stripe non configurée — configurez d\'abord vos credentials' });
    }

    const stripe    = require('stripe')(stripeKey);
    const webhookUrl = process.env.WEBHOOK_URL ||
      'https://evend-multivendeur-api.onrender.com/api/webhooks/stripe';

    // Events selon le type de webhook
    const eventsPrincipal = [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.refunded',
      'charge.dispute.created',
      'charge.dispute.closed',
      'charge.updated',
      'refund.created',
    ];

    const eventsConnect = [
      'account.updated',
      'account.application.deauthorized',
      'payout.paid',
      'payout.failed',
      'transfer.created',
    ];

    const isConnect = type === 'connect';

    console.log(`\n🔗 Enregistrement webhook ${type} sur Stripe...`);
    console.log(`   URL: ${webhookUrl}`);
    console.log(`   Mode: ${cfg.sandbox ? 'sandbox' : 'production'}`);
    console.log(`   Connect: ${isConnect}`);

    // Créer le webhook endpoint sur Stripe
    const webhookParams = {
      url:            webhookUrl,
      enabled_events: isConnect ? eventsConnect : eventsPrincipal,
      description:    isConnect
        ? 'e-Vend — Connect webhooks (comptes vendeurs)'
        : 'e-Vend — Webhooks paiements principal',
    };

    if (isConnect) {
      webhookParams.connect = true;
    }

    const webhook = await stripe.webhookEndpoints.create(webhookParams);

    console.log(`   ✅ Webhook créé: ${webhook.id}`);
    console.log(`   Signing Secret: ${webhook.secret?.substring(0, 12)}...`);

    // ⚠️ webhook.secret n'est disponible QU'À LA CRÉATION — on le chiffre et sauvegarde immédiatement
    const secretChiffre = chiffrer(webhook.secret);

    // Sauvegarder dans la BD selon le type et le mode
    const champSecret = isConnect
      ? (cfg.sandbox ? 'dev_memb_webhook_secret' : 'prod_memb_webhook_secret')
      : (cfg.sandbox ? 'dev_webhook_secret' : 'prod_webhook_secret');

    await pool.query(
      `UPDATE configuration_stripe_admin SET ${champSecret} = $1, updated_at = NOW() WHERE id = 1`,
      [secretChiffre]
    );

    await pool.query(
      `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
      ['STRIPE_WEBHOOK_REGISTERED', req.user?.email || 'admin',
       JSON.stringify({
         type, webhook_id: webhook.id, url: webhookUrl,
         events: isConnect ? eventsConnect : eventsPrincipal,
         mode: cfg.sandbox ? 'sandbox' : 'production',
       }),
       'info']
    ).catch(() => {});

    console.log(`   ✅ Secret sauvegardé dans ${champSecret}`);

    res.json({
      success:        true,
      webhook_id:     webhook.id,
      url:            webhook.url,
      status:         webhook.status,
      events:         webhook.enabled_events,
      connect:        isConnect,
      signing_secret: webhook.secret, // retourné au frontend pour affichage unique
      champ_sauvegarde: champSecret,
      mode:           cfg.sandbox ? 'sandbox' : 'production',
      message:        `Webhook ${type} enregistré et Signing Secret sauvegardé automatiquement`,
    });

  } catch (err) {
    console.error(`❌ Erreur enregistrement webhook ${type}:`, err.message);

    if (err.message?.includes('url')) {
      return res.status(400).json({
        error: `URL webhook inaccessible par Stripe. Assurez-vous que ${process.env.WEBHOOK_URL || 'votre URL'} est publique et accessible.`,
        detail: err.message,
      });
    }

    res.status(500).json({ error: err.message });
  }
});


// Propage les changements de config sur TOUS les comptes vendeurs Stripe actifs
// Appelée après chaque sauvegarde de la page config
// ─────────────────────────────────────────────────────────────────────────────
// Ce qui est appliqué à Stripe :
//   ✅ delai_actif + delai_jours → settings.payouts.schedule (interval + delay_days)
//   ✅ debit_negative            → settings.payouts.debit_negative_balances
//   ✅ statement_desc            → settings.payments.statement_descriptor
//   ✅ Pas applicable via API :  processing_method, account_type, fees — ces
//      paramètres s'appliquent à la création du compte, pas à la mise à jour
// ═════════════════════════════════════════════════════════════════════════════
async function appliquerConfigStripe(cfg) {
  console.log('\n🔄 Propagation config → comptes Stripe Connect...');

  // Récupérer la clé Stripe
  const stripeKey = dechiffrer(cfg.sandbox ? cfg.dev_secret_key : cfg.prod_secret_key);
  if (!stripeKey) {
    console.log('   ⚠️  Clé Stripe non configurée — propagation annulée');
    return;
  }
  const stripe = require('stripe')(stripeKey);

  // Récupérer tous les vendeurs avec un compte Stripe actif
  const vendeursResult = await pool.query(
    `SELECT id, nom, stripe_account_id, stripe_account_type
     FROM vendeurs
     WHERE stripe_account_id IS NOT NULL
       AND stripe_charges_enabled = true`
  );

  if (vendeursResult.rows.length === 0) {
    console.log('   ℹ️  Aucun vendeur avec compte Stripe actif');
    return;
  }

  console.log(`   📋 ${vendeursResult.rows.length} vendeur(s) à mettre à jour`);

  // Construire les settings à appliquer
  const payoutInterval = cfg.delai_actif ? 'daily' : 'manual';
  const delayDays      = cfg.delai_actif ? (parseInt(cfg.delai_jours) || 3) : undefined;

  const settingsUpdate = {
    settings: {
      payouts: {
        debit_negative_balances: cfg.debit_negative === true,
        schedule: {
          interval: payoutInterval,
          ...(delayDays !== undefined && { delay_days: delayDays }),
        },
      },
      // statement_descriptor : max 22 chars, lettres/chiffres seulement
      ...(cfg.statement_desc && {
        payments: {
          statement_descriptor: cfg.statement_desc.substring(0, 22),
        },
      }),
    },
  };

  let succes = 0;
  let erreurs = 0;

  for (const vendeur of vendeursResult.rows) {
    try {
      // Standard : Stripe gère les payouts — ne pas modifier
      if ((vendeur.stripe_account_type || '').toUpperCase() === 'STANDARD') {
        console.log(`   ⏭️  Vendeur ${vendeur.id} (STANDARD) — payout géré par Stripe, on passe`);
        continue;
      }

      await stripe.accounts.update(vendeur.stripe_account_id, settingsUpdate);
      console.log(`   ✅ Vendeur ${vendeur.id} (${vendeur.stripe_account_id}) — mis à jour`);
      succes++;

    } catch (err) {
      console.error(`   ❌ Vendeur ${vendeur.id}: ${err.message}`);
      erreurs++;

      await pool.query(
        `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
        ['CONFIG_STRIPE_PROPAGATION_ERREUR', 'admin',
         JSON.stringify({ vendeur_id: vendeur.id, stripe_account_id: vendeur.stripe_account_id, error: err.message }),
         'error']
      ).catch(() => {});
    }
  }

  console.log(`   🏁 Propagation terminée: ${succes} succès, ${erreurs} erreur(s)`);

  await pool.query(
    `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
    ['CONFIG_STRIPE_PROPAGATION', 'admin',
     JSON.stringify({
       nb_vendeurs: vendeursResult.rows.length,
       succes, erreurs,
       payout_interval: payoutInterval,
       delay_days:      delayDays,
       debit_negative:  cfg.debit_negative,
       sandbox:         cfg.sandbox,
     }),
     erreurs > 0 ? 'warning' : 'info']
  ).catch(() => {});
}

module.exports = router;