// routes/encheres_admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// ============================================
// ROUTES POUR LA CONFIGURATION DES ENCHERES ADMIN
// ============================================

// GET - Récupérer la configuration des enchères
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM enchere_config WHERE id = 1'
        );
        
        if (result.rows.length === 0) {
            const newConfig = await pool.query(
                `INSERT INTO enchere_config (id) VALUES (1) RETURNING *`
            );
            return res.json(newConfig.rows[0]);
        }
        
        res.json(result.rows[0]);
        
    } catch (err) {
        console.error('❌ Erreur GET /api/admin/encheres:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Mettre à jour toute la configuration des enchères
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const data = req.body;
        
        console.log('========================================');
        console.log('📥 SAUVEGARDE CONFIG ENCHERES ADMIN');
        console.log('========================================');
        console.log('🔑 Utilisateur:', req.user?.email);
        
        // Vérifier que la ligne id=1 existe
        const rowCheck = await pool.query('SELECT id FROM enchere_config WHERE id = 1');
        
        if (rowCheck.rows.length === 0) {
            await pool.query('INSERT INTO enchere_config (id) VALUES (1)');
        }
        
        // Convertir les objets JSON en chaînes JSON pour PostgreSQL
        const sortOptionsJSON = data.sort_options ? JSON.stringify(data.sort_options) : null;
        const bidRulesJSON = data.bid_rules ? JSON.stringify(data.bid_rules) : null;
        const bannedUsernamesArray = data.banned_usernames || [];
        
        const query = `
            UPDATE enchere_config SET
                -- Configuration générale
                admin_email = COALESCE($1, admin_email),
                timezone = COALESCE($2, timezone),
                notif_email_admin = COALESCE($3, notif_email_admin),
                twilio_sms = COALESCE($4, twilio_sms),
                add_product_type = COALESCE($5, add_product_type),
                from_name = COALESCE($6, from_name),
                include_images = COALESCE($7, include_images),
                sort_by_option = COALESCE($8, sort_by_option),
                sort_options = COALESCE($9::jsonb, sort_options),
                show_products_tag = COALESCE($10, show_products_tag),
                remove_header_mail = COALESCE($11, remove_header_mail),
                remove_footer_mail = COALESCE($12, remove_footer_mail),
                
                -- Page enchères
                bootstrap_grids = COALESCE($13, bootstrap_grids),
                sort_running = COALESCE($14, sort_running),
                
                -- Enchère courante & plus haut enchérisseur
                show_start_bid_upcoming = COALESCE($15, show_start_bid_upcoming),
                display_current_bid = COALESCE($16, display_current_bid),
                display_highest_bidder = COALESCE($17, display_highest_bidder),
                display_current_bid_product = COALESCE($18, display_current_bid_product),
                display_current_bid_collection = COALESCE($19, display_current_bid_collection),
                display_start_bid = COALESCE($20, display_start_bid),
                display_start_bid_until = COALESCE($21, display_start_bid_until),
                display_bid_count = COALESCE($22, display_bid_count),
                
                -- Configuration enchère
                start_auction_auto = COALESCE($23, start_auction_auto),
                restart_unsucc = COALESCE($24, restart_unsucc),
                proxy_bidding = COALESCE($25, proxy_bidding),
                proxy_normal_single = COALESCE($26, proxy_normal_single),
                default_bid_rule = COALESCE($27, default_bid_rule),
                bid_rules = COALESCE($28::jsonb, bid_rules),
                place_from_collection = COALESCE($29, place_from_collection),
                integer_only = COALESCE($30, integer_only),
                max_bid_increment = COALESCE($31, max_bid_increment),
                create_auction_variant = COALESCE($32, create_auction_variant),
                multi_language = COALESCE($33, multi_language),
                stop_if_out_of_stock = COALESCE($34, stop_if_out_of_stock),
                show_max_bid_allowed = COALESCE($35, show_max_bid_allowed),
                popcorn_bidding = COALESCE($36, popcorn_bidding),
                capped_amount = COALESCE($37, capped_amount),
                allow_bid_multiple = COALESCE($38, allow_bid_multiple),
                enable_edit_bid = COALESCE($39, enable_edit_bid),
                
                -- Gagnants
                approve_winner_auto = COALESCE($40, approve_winner_auto),
                multiple_winners = COALESCE($41, multiple_winners),
                winning_amount_proxy = COALESCE($42, winning_amount_proxy),
                hide_winning_purchase = COALESCE($43, hide_winning_purchase),
                edit_winning_bid = COALESCE($44, edit_winning_bid),
                send_purchase_reminder = COALESCE($45, send_purchase_reminder),
                purchase_reminder_days = COALESCE($46, purchase_reminder_days),
                winning_product_name = COALESCE($47, winning_product_name),
                time_slots_reminder = COALESCE($48, time_slots_reminder),
                custom_shipping = COALESCE($49, custom_shipping),
                amount_to_pay = COALESCE($50, amount_to_pay),
                declare_next_if_fails = COALESCE($51, declare_next_if_fails),
                window_unit = COALESCE($52, window_unit),
                window_value = COALESCE($53, window_value),
                declare_next_winner = COALESCE($54, declare_next_winner),
                declare_next_times = COALESCE($55, declare_next_times),
                
                -- Front widget
                days_visible_after_end = COALESCE($56, days_visible_after_end),
                show_reserved_price = COALESCE($57, show_reserved_price),
                show_min_bid_amount = COALESCE($58, show_min_bid_amount),
                currency = COALESCE($59, currency),
                show_ending_bid = COALESCE($60, show_ending_bid),
                inform_bidders = COALESCE($61, inform_bidders),
                highlight_current_bid = COALESCE($62, highlight_current_bid),
                confirmation_bid = COALESCE($63, confirmation_bid),
                confirmation_label = COALESCE($64, confirmation_label),
                display_popcorn_desc = COALESCE($65, display_popcorn_desc),
                autofill_min_bid = COALESCE($66, autofill_min_bid),
                pagination_auctions = COALESCE($67, pagination_auctions),
                display_proxy_bid = COALESCE($68, display_proxy_bid),
                remove_reserve_price = COALESCE($69, remove_reserve_price),
                outbid_notif = COALESCE($70, outbid_notif),
                bidding_username = COALESCE($71, bidding_username),
                banned_usernames = COALESCE($72, banned_usernames),
                mandate_address = COALESCE($73, mandate_address),
                customized_bid_show = COALESCE($74, customized_bid_show),
                show_bids_from_others = COALESCE($75, show_bids_from_others),
                display_premium_price = COALESCE($76, display_premium_price),
                delivery_preference = COALESCE($77, delivery_preference),
                display_max_bid_page = COALESCE($78, display_max_bid_page),
                display_max_bid_customer = COALESCE($79, display_max_bid_customer),
                front_end_banned_setting = COALESCE($80, front_end_banned_setting),
                banned_bidder_option = COALESCE($81, banned_bidder_option),
                restrict_consecutive = COALESCE($82, restrict_consecutive),
                hide_bidders_name_all = COALESCE($83, hide_bidders_name_all),
                allow_hide_name = COALESCE($84, allow_hide_name),
                days_prior_view = COALESCE($85, days_prior_view),
                mail_to_highest_unit = COALESCE($86, mail_to_highest_unit),
                mail_to_highest_value = COALESCE($87, mail_to_highest_value),
                
                -- Notifications courriel
                send_mail_auto_bidder = COALESCE($88, send_mail_auto_bidder),
                add_email_field = COALESCE($89, add_email_field),
                disable_finish_auction = COALESCE($90, disable_finish_auction),
                winner_cancel_mail = COALESCE($91, winner_cancel_mail),
                highest_bid_mail_config = COALESCE($92, highest_bid_mail_config),
                email_notif_every_bid = COALESCE($93, email_notif_every_bid),
                
                -- Commandes
                manage_orders = COALESCE($94, manage_orders),
                
                -- Frais d'enchère
                fee_type = COALESCE($95, fee_type),
                joining_fee_rule = COALESCE($96, joining_fee_rule),
                charge_taxes_joining = COALESCE($97, charge_taxes_joining),
                terms_conditions = COALESCE($98, terms_conditions),
                terms_url = COALESCE($99, terms_url),
                default_terms_handle = COALESCE($100, default_terms_handle),
                tag_based_terms = COALESCE($101, tag_based_terms),
                restrict_pending_joining = COALESCE($102, restrict_pending_joining),
                auction_joining_fee = COALESCE($103, auction_joining_fee),
                refund_joining_fee = COALESCE($104, refund_joining_fee),
                options_after_joining = COALESCE($105, options_after_joining),
                multi_currency = COALESCE($106, multi_currency),
                
                -- Widget configuration
                selected_layout = COALESCE($107, selected_layout),
                display_seconds = COALESCE($108, display_seconds),
                date_format = COALESCE($109, date_format),
                
                -- Restrictions vendeur
                vendor_auto_pay_setting = COALESCE($110, vendor_auto_pay_setting),
                vendor_proxy_bidding_setting = COALESCE($111, vendor_proxy_bidding_setting),
                vendor_popcorn_bidding_setting = COALESCE($112, vendor_popcorn_bidding_setting),
                vendor_auction_duration_setting = COALESCE($113, vendor_auction_duration_setting),
                default_start_days = COALESCE($114, default_start_days),
                default_end_days = COALESCE($115, default_end_days),
                vendor_base_price_setting = COALESCE($116, vendor_base_price_setting),
                base_price = COALESCE($117, base_price),
                vendor_reserve_price_setting = COALESCE($118, vendor_reserve_price_setting),
                reserve_price = COALESCE($119, reserve_price),
                vendor_can_stop_auction = COALESCE($120, vendor_can_stop_auction),
                
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
            RETURNING *
        `;
        
        const values = [
            // Configuration générale (1-12)
            data.admin_email,
            data.timezone,
            data.notif_email_admin,
            data.twilio_sms,
            data.add_product_type,
            data.from_name,
            data.include_images,
            data.sort_by_option,
            sortOptionsJSON,
            data.show_products_tag,
            data.remove_header_mail,
            data.remove_footer_mail,
            
            // Page enchères (13-14)
            data.bootstrap_grids,
            data.sort_running,
            
            // Enchère courante (15-22)
            data.show_start_bid_upcoming,
            data.display_current_bid,
            data.display_highest_bidder,
            data.display_current_bid_product,
            data.display_current_bid_collection,
            data.display_start_bid,
            data.display_start_bid_until,
            data.display_bid_count,
            
            // Configuration enchère (23-39)
            data.start_auction_auto,
            data.restart_unsucc,
            data.proxy_bidding,
            data.proxy_normal_single,
            data.default_bid_rule,
            bidRulesJSON,
            data.place_from_collection,
            data.integer_only,
            data.max_bid_increment,
            data.create_auction_variant,
            data.multi_language,
            data.stop_if_out_of_stock,
            data.show_max_bid_allowed,
            data.popcorn_bidding,
            data.capped_amount,
            data.allow_bid_multiple,
            data.enable_edit_bid,
            
            // Gagnants (40-55)
            data.approve_winner_auto,
            data.multiple_winners,
            data.winning_amount_proxy,
            data.hide_winning_purchase,
            data.edit_winning_bid,
            data.send_purchase_reminder,
            data.purchase_reminder_days,
            data.winning_product_name,
            data.time_slots_reminder,
            data.custom_shipping,
            data.amount_to_pay,
            data.declare_next_if_fails,
            data.window_unit,
            data.window_value,
            data.declare_next_winner,
            data.declare_next_times,
            
            // Front widget (56-87)
            data.days_visible_after_end,
            data.show_reserved_price,
            data.show_min_bid_amount,
            data.currency,
            data.show_ending_bid,
            data.inform_bidders,
            data.highlight_current_bid,
            data.confirmation_bid,
            data.confirmation_label,
            data.display_popcorn_desc,
            data.autofill_min_bid,
            data.pagination_auctions,
            data.display_proxy_bid,
            data.remove_reserve_price,
            data.outbid_notif,
            data.bidding_username,
            bannedUsernamesArray,
            data.mandate_address,
            data.customized_bid_show,
            data.show_bids_from_others,
            data.display_premium_price,
            data.delivery_preference,
            data.display_max_bid_page,
            data.display_max_bid_customer,
            data.front_end_banned_setting,
            data.banned_bidder_option,
            data.restrict_consecutive,
            data.hide_bidders_name_all,
            data.allow_hide_name,
            data.days_prior_view,
            data.mail_to_highest_unit,
            data.mail_to_highest_value,
            
            // Notifications courriel (88-93)
            data.send_mail_auto_bidder,
            data.add_email_field,
            data.disable_finish_auction,
            data.winner_cancel_mail,
            data.highest_bid_mail_config,
            data.email_notif_every_bid,
            
            // Commandes (94)
            data.manage_orders,
            
            // Frais d'enchère (95-106)
            data.fee_type,
            data.joining_fee_rule,
            data.charge_taxes_joining,
            data.terms_conditions,
            data.terms_url,
            data.default_terms_handle,
            data.tag_based_terms,
            data.restrict_pending_joining,
            data.auction_joining_fee,
            data.refund_joining_fee,
            data.options_after_joining,
            data.multi_currency,
            
            // Widget configuration (107-109)
            data.selected_layout,
            data.display_seconds,
            data.date_format,
            
            // Restrictions vendeur (110-119)
            data.vendor_auto_pay_setting,
            data.vendor_proxy_bidding_setting,
            data.vendor_popcorn_bidding_setting,
            data.vendor_auction_duration_setting,
            data.default_start_days,
            data.default_end_days,
            data.vendor_base_price_setting,
            data.base_price,
            data.vendor_reserve_price_setting,
            data.reserve_price,
            data.vendor_can_stop_auction
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['CONFIG_ENCHERES_ADMIN_UPDATE', req.user?.email || 'admin',
             JSON.stringify({ updated_by: req.user?.email, timestamp: new Date().toISOString() }), 'info']
        ).catch(e => console.error('Erreur log:', e.message));
        
        console.log('✅ Configuration enchères admin sauvegardee');
        console.log('========================================\n');
        
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ Erreur POST /api/admin/encheres:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH - Mettre à jour partiellement la configuration des enchères
router.patch('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnee a mettre a jour' });
        }
        
        // Mapper les noms camelCase vers snake_case
        const columnMap = {
            'adminEmail': 'admin_email',
            'notifEmailAdmin': 'notif_email_admin',
            'twilioSMS': 'twilio_sms',
            'addProductType': 'add_product_type',
            'fromName': 'from_name',
            'includeImages': 'include_images',
            'sortByOption': 'sort_by_option',
            'sortOptions': 'sort_options',
            'showProductsTag': 'show_products_tag',
            'removeHeaderMail': 'remove_header_mail',
            'removeFooterMail': 'remove_footer_mail',
            'bootstrapGrids': 'bootstrap_grids',
            'sortRunning': 'sort_running',
            'showStartBidUpcoming': 'show_start_bid_upcoming',
            'displayCurrentBid': 'display_current_bid',
            'displayHighestBidder': 'display_highest_bidder',
            'displayCurrentBidProduct': 'display_current_bid_product',
            'displayCurrentBidCollection': 'display_current_bid_collection',
            'displayStartBid': 'display_start_bid',
            'displayStartBidUntil': 'display_start_bid_until',
            'displayBidCount': 'display_bid_count',
            'startAuctionAuto': 'start_auction_auto',
            'restartUnsucc': 'restart_unsucc',
            'proxyBidding': 'proxy_bidding',
            'proxyNormalSingle': 'proxy_normal_single',
            'defaultBidRule': 'default_bid_rule',
            'bidRules': 'bid_rules',
            'placeFromCollection': 'place_from_collection',
            'integerOnly': 'integer_only',
            'maxBidIncrement': 'max_bid_increment',
            'createAuctionVariant': 'create_auction_variant',
            'multiLanguage': 'multi_language',
            'stopIfOutOfStock': 'stop_if_out_of_stock',
            'showMaxBidAllowed': 'show_max_bid_allowed',
            'popcornBidding': 'popcorn_bidding',
            'cappedAmount': 'capped_amount',
            'allowBidMultiple': 'allow_bid_multiple',
            'enableEditBid': 'enable_edit_bid',
            'approveWinnerAuto': 'approve_winner_auto',
            'multipleWinners': 'multiple_winners',
            'winningAmountProxy': 'winning_amount_proxy',
            'hideWinningPurchase': 'hide_winning_purchase',
            'editWinningBid': 'edit_winning_bid',
            'sendPurchaseReminder': 'send_purchase_reminder',
            'purchaseReminderDays': 'purchase_reminder_days',
            'winningProductName': 'winning_product_name',
            'timeSlotsReminder': 'time_slots_reminder',
            'customShipping': 'custom_shipping',
            'amountToPay': 'amount_to_pay',
            'declareNextIfFails': 'declare_next_if_fails',
            'windowUnit': 'window_unit',
            'windowValue': 'window_value',
            'declareNextWinner': 'declare_next_winner',
            'declareNextTimes': 'declare_next_times',
            'daysVisibleAfterEnd': 'days_visible_after_end',
            'showReservedPrice': 'show_reserved_price',
            'showMinBidAmount': 'show_min_bid_amount',
            'showEndingBid': 'show_ending_bid',
            'informBidders': 'inform_bidders',
            'highlightCurrentBid': 'highlight_current_bid',
            'confirmationBid': 'confirmation_bid',
            'confirmationLabel': 'confirmation_label',
            'displayPopcornDesc': 'display_popcorn_desc',
            'autofillMinBid': 'autofill_min_bid',
            'paginationAuctions': 'pagination_auctions',
            'displayProxyBid': 'display_proxy_bid',
            'removeReservePrice': 'remove_reserve_price',
            'outbidNotif': 'outbid_notif',
            'biddingUsername': 'bidding_username',
            'bannedUsernames': 'banned_usernames',
            'mandateAddress': 'mandate_address',
            'customizedBidShow': 'customized_bid_show',
            'showBidsFromOthers': 'show_bids_from_others',
            'displayPremiumPrice': 'display_premium_price',
            'deliveryPreference': 'delivery_preference',
            'displayMaxBidPage': 'display_max_bid_page',
            'displayMaxBidCustomer': 'display_max_bid_customer',
            'frontEndBannedSetting': 'front_end_banned_setting',
            'bannedBidderOption': 'banned_bidder_option',
            'restrictConsecutive': 'restrict_consecutive',
            'hideBiddersNameAll': 'hide_bidders_name_all',
            'allowHideName': 'allow_hide_name',
            'daysPriorView': 'days_prior_view',
            'mailToHighestUnit': 'mail_to_highest_unit',
            'mailToHighestValue': 'mail_to_highest_value',
            'sendMailAutoBidder': 'send_mail_auto_bidder',
            'addEmailField': 'add_email_field',
            'disableFinishAuction': 'disable_finish_auction',
            'winnerCancelMail': 'winner_cancel_mail',
            'highestBidMailConfig': 'highest_bid_mail_config',
            'emailNotifEveryBid': 'email_notif_every_bid',
            'manageOrders': 'manage_orders',
            'feeType': 'fee_type',
            'joiningFeeRule': 'joining_fee_rule',
            'chargeTaxesJoining': 'charge_taxes_joining',
            'termsConditions': 'terms_conditions',
            'termsUrl': 'terms_url',
            'defaultTermsHandle': 'default_terms_handle',
            'tagBasedTerms': 'tag_based_terms',
            'restrictPendingJoining': 'restrict_pending_joining',
            'auctionJoiningFee': 'auction_joining_fee',
            'refundJoiningFee': 'refund_joining_fee',
            'optionsAfterJoining': 'options_after_joining',
            'multiCurrency': 'multi_currency',
            'selectedLayout': 'selected_layout',
            'displaySeconds': 'display_seconds',
            'dateFormat': 'date_format',
            'autoPaySetting': 'vendor_auto_pay_setting',
            'proxyBiddingSetting': 'vendor_proxy_bidding_setting',
            'popcornBiddingSetting': 'vendor_popcorn_bidding_setting',
            'auctionDurationSetting': 'vendor_auction_duration_setting',
            'defaultStartDays': 'default_start_days',
            'defaultEndDays': 'default_end_days',
            'basePriceSetting': 'vendor_base_price_setting',
            'basePrice': 'base_price',
            'reservePriceSetting': 'vendor_reserve_price_setting',
            'reservePrice': 'reserve_price',
            'vendorCanStopAuction': 'vendor_can_stop_auction'
        };
        
        const dbFields = fields.map(f => columnMap[f] || f);
        const values = Object.values(updates);
        
        // Gérer spécifiquement les champs JSONB
        let setClause = '';
        let finalValues = [];
        let paramIndex = 1;
        
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const dbField = dbFields[i];
            const value = values[i];
            
            if (dbField === 'sort_options' || dbField === 'bid_rules') {
                setClause += `${dbField} = $${paramIndex}::jsonb, `;
                finalValues.push(JSON.stringify(value));
            } else if (dbField === 'banned_usernames') {
                setClause += `${dbField} = $${paramIndex}, `;
                finalValues.push(value || []);
            } else {
                setClause += `${dbField} = $${paramIndex}, `;
                finalValues.push(value);
            }
            paramIndex++;
        }
        
        setClause += 'updated_at = CURRENT_TIMESTAMP';
        finalValues.push(1);
        
        const query = `
            UPDATE enchere_config 
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
        console.error('❌ Erreur PATCH /api/admin/encheres:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/encheres/vendeur-config
// Retourne TOUS les champs necessaires :
// - permissions vendeur (modal creer enchere)
// - options d'affichage (widget Shopify)
// - layout selectionne (widget Shopify)
router.get('/vendeur-config', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                -- Permissions vendeur (modal)
                proxy_bidding,
                popcorn_bidding,
                vendor_proxy_bidding_setting,
                vendor_popcorn_bidding_setting,
                vendor_auction_duration_setting,
                default_start_days,
                default_end_days,
                vendor_base_price_setting,
                base_price,
                vendor_reserve_price_setting,
                reserve_price,
                bid_rules,
                currency,
                capped_amount,
                allow_bid_multiple,
                terms_conditions,
                terms_url,
                fee_type,
                joining_fee_rule,
                vendor_auto_pay_setting,
                vendor_can_stop_auction,

                -- Options d'affichage widget Shopify
                selected_layout,
                display_current_bid,
                display_highest_bidder,
                display_bid_count,
                show_reserved_price,
                show_min_bid_amount,
                inform_bidders,
                display_seconds,
                autofill_min_bid,
                display_start_bid_until,
                display_start_bid,
                show_start_bid_upcoming,
                remove_reserve_price,
                highlight_current_bid,
                confirmation_bid,
                confirmation_label
            FROM enchere_config
            WHERE id = 1
        `);

        if (result.rows.length === 0) {
            return res.json({
                // Permissions vendeur
                proxy_bidding: true,
                popcorn_bidding: true,
                vendor_proxy_bidding_setting: true,
                vendor_popcorn_bidding_setting: true,
                vendor_auction_duration_setting: false,
                default_start_days: 0,
                default_end_days: 2,
                vendor_base_price_setting: false,
                base_price: 0,
                vendor_reserve_price_setting: false,
                reserve_price: 10,
                bid_rules: [],
                currency: 'CAD',
                capped_amount: 0,
                allow_bid_multiple: false,
                terms_conditions: true,
                terms_url: 'https://e-vend.ca/pages/guide-pour-les-encheres-e-vend',
                fee_type: 'No Fee',
                joining_fee_rule: 'per_auction',
                vendor_auto_pay_setting: false,
                vendor_can_stop_auction: false,
                // Affichage widget
                selected_layout: 'Layout 1',
                display_current_bid: true,
                display_highest_bidder: true,
                display_bid_count: true,
                show_reserved_price: false,
                show_min_bid_amount: true,
                inform_bidders: true,
                display_seconds: true,
                autofill_min_bid: true,
                display_start_bid_until: true,
                display_start_bid: false,
                show_start_bid_upcoming: false,
                remove_reserve_price: false,
                highlight_current_bid: false,
                confirmation_bid: true,
                confirmation_label: 'Confirmer ma mise'
            });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error('Erreur GET /api/admin/encheres/vendeur-config:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;