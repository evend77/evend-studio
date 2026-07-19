// routes/configuration_admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET - Récupérer la configuration générale
router.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM configuration_generale_admin WHERE id = 1'
        );
        
        if (result.rows.length === 0) {
            const newConfig = await pool.query(
                `INSERT INTO configuration_generale_admin (id) VALUES (1) RETURNING *`
            );
            return res.json(newConfig.rows[0]);
        }
        
        res.json(result.rows[0]);
        
    } catch (err) {
        console.error('❌ Erreur GET:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Mettre à jour TOUTE la configuration
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const data = req.body;
        
        console.log('========================================');
        console.log('📥 SAUVEGARDE CONFIG ADMIN');
        console.log('========================================');
        console.log('🔑 Utilisateur:', req.user?.email);
        
        // Vérifier que la table existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'configuration_generale_admin'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            return res.status(500).json({ error: 'La table configuration_generale_admin n\'existe pas' });
        }
        
        // Vérifier que la ligne id=1 existe
        const rowCheck = await pool.query('SELECT id FROM configuration_generale_admin WHERE id = 1');
        
        if (rowCheck.rows.length === 0) {
            await pool.query('INSERT INTO configuration_generale_admin (id) VALUES (1)');
        }
        
        // Requête complète avec TOUS les paramètres
        const query = `
            UPDATE configuration_generale_admin SET
                -- Paramètres généraux (1-20)
                bloquer_inscription_gestionnaire = $1,
                bloquer_inscription_acheteur = $2,
                mode_maintenance = $3,
                message_maintenance = $4,
                stripe_actif = $5,
                paypal_actif = $6,
                avis_actifs = $7,
                notifs_auto_vendeurs = $8,
                utiliser_plans_vendeur = $9,
                max_produits = $10,
                email_contact = $11,
                store_email = $12,
                domaine = $13,
                contact_number = $14,
                currency = $15,
                custom_currency_symbol = $16,
                langue = $17,
                time_zone = $18,
                date_format = $19,
                time_format = $20,
                footer_text = $21,
                
                -- Bannière globale (21-24)
                banniere_active = $22,
                banniere_titre = $23,
                banniere_message = $24,
                banniere_type = $25,
                
                -- Images par défaut (25-26)
                banniere_defaut_url = $26,
                logo_defaut_url = $27,
                
                -- Configuration vendeur (27-68)
                permettre_expedition = $28,
                approuver_auto_vendeur = $29,
                importer_vendeurs_csv = $30,
                voir_details_client = $31,
                voir_email_client = $32,
                voir_telephone_client = $33,
                politique_vendeur = $34,
                permettre_ajout_personnel = $35,
                restreindre_inscription = $36,
                verification_email = $37,
                permettre_tags = $38,
                restreindre_tags_inscription = $39,
                permettre_categories = $40,
                restreindre_categories_inscription = $41,
                permettre_devise_propre = $42,
                methode_conversion = $43,
                permettre_changement_unite_poids = $44,
                restreindre_desactivation_avis = $45,
                mettre_a_jour_identifiant = $46,
                rediriger_verification_email = $47,
                permettre_nom_boutique_inscription = $48,
                approuver_auto_avis = $49,
                permettre_gestion_auto_approbation_avis = $50,
                avis_avance = $51,
                sso_actif = $52,
                voir_total_du = $53,
                notification_stock_faible = $54,
                seuil_stock_faible = $55,
                modifier_valeur_par_defaut_champ = $56,
                synchroniser_meta_objet = $57,
                vacances_vendeur = $58,
                vendeur_sur_boutique = $59,
                option_inscription = $60,
                shop_faq = $61,
                c2c_marketplace = $62,
                customer_creation = $63,
                customer_tag = $64,
                email_notification_product_query = $65,
                minimum_purchase_amount = $66,
                login_as_seller = $67,
                check_customer_login = $68,
                check_customer_purchase = $69,
                
                -- Configuration produits (69-146)
                approuver_auto_produit = $70,
                desactiver_auto_produit = $71,
                condition_desactivation = $72,
                importer_produits_csv = $73,
                permettre_ajout_produit = $74,
                permettre_edition_produit = $75,
                permettre_suppression_produit = $76,
                commission_par_produit = $77,
                taxes_par_defaut = $78,
                afficher_checkbox_taxes = $79,
                expedition_requise_produits_normaux = $80,
                sku_produits_numeriques = $81,
                code_barre_produits_numeriques = $82,
                collections_obligatoires = $83,
                max_collections = $84,
                assignation_produits_par = $85,
                affichage_nom_vendeur = $86,
                utiliser_s3 = $87,
                editeur_description = $88,
                sauvegarder_brouillon = $89,
                statut_brouillon_csv = $90,
                creer_brouillon_shopify = $91,
                cacher_brouillon_admin = $92,
                ajouter_prefixe_nom_produit = $93,
                remplacer_nom_par_id = $94,
                afficher_politique_produit = $95,
                annuaire_produits_normaux = $96,
                canaux_vente = $97,
                modifier_visibilite_anciens_produits = $98,
                permettre_ajout_handle = $99,
                permettre_ajout_meta = $100,
                permettre_desactivation_produit = $101,
                mettre_a_jour_nom_boutique_shopify = $102,
                gerer_inventaire_par_defaut = $103,
                produit_numerique_comme_service = $104,
                permettre_lien_produit_numerique = $105,
                quantite_minimum_achat = $106,
                application_quantite_minimum = $107,
                prix_zero_autorise = $108,
                texte_aide_formulaire = $109,
                delais_livraison = $110,
                avalara_taxe = $111,
                code_taxe_par_type = $112,
                cacher_champ_tags = $113,
                support_video_media = $114,
                afficher_image_liste_produits = $115,
                synchronisation_double = $116,
                menu_produits_connecteur = $117,
                permettre_ajout_prix_revient = $118,
                afficher_nom_marque = $119,
                permettre_ajout_documents_signature = $120,
                publier_tous_marches = $121,
                type_prix_libre = $122,
                prix_minimum = $123,
                date_publication_future = $124,
                date_vente_future = $125,
                afficher_produits_futurs = $126,
                sync_approbation_metachamp = $127,
                liste_produits_desactives_mail = $128,
                gerer_taxonomie = $129,
                restreindre_caracteres_speciaux = $130,
                frais_transaction = $131,
                type_frais_transaction = $132,
                porteur_frais_transaction = $133,
                application_frais_transaction = $134,
                pourcentage_frais = $135,
                montant_fixe_frais = $136,
                type_frais_fixe = $137,
                selection_heure_expiration = $138,
                pays_origine_produit = $139,
                texte_alternatif_media = $140,
                template_alternatif_produit = $141,
                nom_template = $142,
                prix_solde = $143,
                arrondi_prix = $144,
                frais_manutention = $145,
                weight_unit = $146,
                dimension_unit = $147,
                
                -- Configuration commande (147-188)
                mode_expedition_obligatoire = $148,
                numero_suivi_obligatoire = $149,
                statut_preparation_commande = $150,
                heures_preparation = $151,
                remboursement_expiration = $152,
                taxes_incluses_prix = $153,
                deduire_expedition_remboursement = $154,
                deduire_taxes_remboursement = $155,
                taxes_sur_expedition = $156,
                permettre_etiquette_expedition = $157,
                montant_encaisable = $158,
                jours_remboursement = $159,
                calcul_montant_encaisable = $160,
                permettre_jours_remboursement_vendeur = $161,
                gerer_remise_commande = $162,
                frais_remise = $163,
                ajouter_tva_balise_commande = $164,
                generation_facture = $165,
                permettre_infos_supplementaires = $166,
                modifier_infos_supplementaires = $167,
                permettre_annuler_expedition = $168,
                permettre_accepter_commande = $169,
                annuler_auto_rejet = $170,
                permettre_annuler_commande_acceptee = $171,
                accepter_et_expedier = $172,
                permettre_creation_commande = $173,
                envoyer_mail_expedition = $174,
                permettre_date_livraison_prevue = $175,
                date_livraison_obligatoire = $176,
                gestion_pourboire = $177,
                permettre_cc_email_commande = $178,
                rappel_expedition_auto = $179,
                jours_avant_rappel = $180,
                jours_max_rappel = $181,
                permettre_notification_avis = $182,
                evenement_notification = $183,
                delai_notification = $184,
                limite_max_notification = $185,
                tcs_sur_commandes = $186,
                tds_sur_commandes = $187,
                restreindre_expedition_fraude = $188,
                restreindre_voir_commandes_impayees = $189,
                
                -- Paramètres avancés (189-192)
                grouping_custom_fields = $190,
                google_translation = $191,
                translation_panel = $192,
                rtl_alignment = $193,
                
                -- Commission (193-202)
                calcul_commission_base = $194,
                type_commission_globale = $195,
                commission_globale = $196,
                seconde_commission_globale = $197,
                type_commission_fixe = $198,
                activer_commission_max = $199,
                commission_max = $200,
                baremes_commission = $201::jsonb,
                commissions_categorie = $202::jsonb,
                commissions_vendeur = $203::jsonb,
                
                -- Taxes admin (203-204)
                mode_taxe = $204,
                destinataire_taxes = $205,

                -- Identité plateforme (205-206)
                nom_plateforme = $206,
                shopify_domain = $207,

                -- Bannières dashboards (208-225)
                banniere_gestionnaire_active = $208,
                banniere_gestionnaire_message = $209,
                banniere_gestionnaire_couleur_bg = $210,
                banniere_gestionnaire_couleur_tx = $211,
                banniere_gestionnaire_hauteur = $212,
                banniere_gestionnaire_police = $213,
                banniere_acheteur_active = $214,
                banniere_acheteur_message = $215,
                banniere_acheteur_couleur_bg = $216,
                banniere_acheteur_couleur_tx = $217,
                banniere_acheteur_hauteur = $218,
                banniere_acheteur_police = $219,

                -- Bannière login (220-225)
                banniere_login_active = $220,
                banniere_login_message = $221,
                banniere_login_couleur_bg = $222,
                banniere_login_couleur_tx = $223,
                banniere_login_hauteur = $224,
                banniere_login_police = $225,

                -- Taux de taxes (site complet — Studio, portefeuille sponsor, etc.) (226-227)
                taux_tps = $226,
                taux_tvq = $227,

                -- Numéros de taxes de la plateforme (apparaissent sur les factures) (228-229)
                no_tps_plateforme = $228,
                no_tvq_plateforme = $229,
                
                updated_at = CURRENT_TIMESTAMP
            WHERE id = 1
            RETURNING *
        `;
        
        // Convertir les objets JSON en chaînes JSON pour PostgreSQL
        const baremesJSON = data.baremesCommission ? JSON.stringify(data.baremesCommission) : '[{"min":"","max":"","type":"% + FIXED","premiereCommission":"","secondeCommission":""}]';
        const categoriesJSON = data.commissionsCategorie ? JSON.stringify(data.commissionsCategorie) : '[]';
        const vendeursJSON = data.commissionsVendeur ? JSON.stringify(data.commissionsVendeur) : '[]';
        
        const values = [
            // Paramètres généraux (1-20)
            data.bloquerInscriptionVendeur ?? false,
            data.bloquerInscriptionAcheteur ?? false,
            data.modeMaintenance ?? false,
            data.messageMaintenance ?? '',
            data.stripeActif ?? true,
            data.paypalActif ?? true,
            data.avisActifs ?? true,
            data.notifsAutoVendeurs ?? true,
            data.utiliserPlansVendeur ?? false,
            data.maxProduits ?? '50',
            data.emailContact ?? 'support@evend.ca',
            data.storeEmail ?? 'evend.ca@outlook.com',
            data.domaine ?? 'www.e-vend.ca',
            data.contactNumber ?? null,
            data.currency ?? 'CAD',
            data.customCurrencySymbol ?? false,
            data.langue ?? 'fr',
            data.timeZone ?? 'EST',
            data.dateFormat ?? 'DD-MMM-YYYY',
            data.timeFormat ?? 'hh:mm A',
            data.footerText ?? 'Copyright ($current_year) e-Vend Studio, Tous droits réservés',
            
            // Bannière globale (21-24)
            data.banniereActive ?? false,
            data.banniereTitre ?? null,
            data.banniereMessage ?? null,
            data.banniereType ?? 'info',
            
            // Images par défaut (25-26)
            data.banniereDefautUrl ?? null,
            data.logoDefautUrl ?? null,
            
            // Configuration vendeur (27-68)
            data.permettreExpedition ?? true,
            data.approuverAutoVendeur ?? false,
            data.importerVendeursCSV ?? false,
            data.voirDetailsClient ?? true,
            data.voirEmailClient ?? true,
            data.voirTelephoneClient ?? true,
            data.politiqueVendeur ?? 'normale',
            data.permettreAjoutPersonnel ?? false,
            data.restreindreInscription ?? false,
            data.verificationEmail ?? true,
            data.permettreTags ?? true,
            data.restreindreTagsInscription ?? false,
            data.permettreCategories ?? true,
            data.restreindreCategoriesInscription ?? false,
            data.permettreDevisePropre ?? false,
            data.methodeConversion ?? 'automatique',
            data.permettreChangementUnitePoids ?? true,
            data.restreindreDesactivationAvis ?? false,
            data.mettreAJourIdentifiant ?? false,
            data.redirigerVerificationEmail ?? false,
            data.permettreNomBoutiqueInscription ?? true,
            data.approuverAutoAvis ?? false,
            data.permettreGestionAutoApprobationAvis ?? false,
            data.avisAvance ?? false,
            data.ssoActif ?? false,
            data.voirTotalDu ?? true,
            data.notificationStockFaible ?? false,
            data.seuilStockFaible ?? '1',
            data.modifierValeurParDefautChamp ?? false,
            data.synchroniserMetaObjet ?? false,
            data.vacancesVendeur ?? false,
            data.vendeurSurBoutique ?? true,
            data.optionInscription ?? 'email',
            data.shopFaq ?? false,
            data.c2cMarketplace ?? false,
            data.customerCreation ?? 'signup',
            data.customerTag ?? 'Acheteur devenu vendeur',
            data.emailNotificationProductQuery ?? false,
            data.minimumPurchaseAmount ?? false,
            data.loginAsSeller ?? false,
            data.checkCustomerLogin ?? false,
            data.checkCustomerPurchase ?? false,
            
            // Configuration produits (69-146)
            data.approuverAutoProduit ?? true,
            data.desactiverAutoProduit ?? false,
            data.conditionDesactivation ?? null,
            data.importerProduitsCSV ?? false,
            data.permettreAjoutProduit ?? true,
            data.permettreEditionProduit ?? true,
            data.permettreSuppressionProduit ?? true,
            data.commissionParProduit ?? false,
            data.taxesParDefaut ?? false,
            data.afficherCheckboxTaxes ?? true,
            data.expeditionRequiseProduitsNormaux ?? true,
            data.skuProduitsNumeriques ?? false,
            data.codeBarreProduitsNumeriques ?? false,
            data.collectionsObligatoires ?? false,
            data.maxCollections ?? '5',
            data.assignationProduitsPar ?? 'email',
            data.affichageNomVendeur ?? 'nom',
            data.utiliserS3 ?? false,
            data.editeurDescription ?? 'tinymce',
            data.sauvegarderBrouillon ?? false,
            data.statutBrouillonCSV ?? false,
            data.creerBrouillonShopify ?? false,
            data.cacherBrouillonAdmin ?? false,
            data.ajouterPrefixeNomProduit ?? false,
            data.remplacerNomParId ?? false,
            data.afficherPolitiqueProduit ?? false,
            data.annuaireProduitsNormaux ?? false,
            data.canauxVente ?? { boutiqueEnLigne: true, pointsVente: false, canauxSociaux: false },
            data.modifierVisibiliteAnciensProduits ?? false,
            data.permettreAjoutHandle ?? false,
            data.permettreAjoutMeta ?? false,
            data.permettreDesactivationProduit ?? true,
            data.mettreAJourNomBoutiqueShopify ?? true,
            data.gererInventaireParDefaut ?? true,
            data.produitNumeriqueCommeService ?? false,
            data.permettreLienProduitNumerique ?? false,
            data.quantiteMinimumAchat ?? false,
            data.applicationQuantiteMinimum ?? 'produit',
            data.prixZeroAutorise ?? false,
            data.texteAideFormulaire ?? false,
            data.delaisLivraison ?? false,
            data.avalaraTaxe ?? false,
            data.codeTaxeParType ?? false,
            data.cacherChampTags ?? false,
            data.supportVideoMedia ?? false,
            data.afficherImageListeProduits ?? false,
            data.synchronisationDouble ?? false,
            data.menuProduitsConnecteur ?? false,
            data.permettreAjoutPrixRevient ?? false,
            data.afficherNomMarque ?? false,
            data.permettreAjoutDocumentsSignature ?? false,
            data.publierTousMarches ?? false,
            data.typePrixLibre ?? false,
            data.prixMinimum ?? '0',
            data.datePublicationFuture ?? false,
            data.dateVenteFuture ?? false,
            data.afficherProduitsFuturs ?? false,
            data.syncApprobationMetachamp ?? false,
            data.listeProduitsDesactivesMail ?? false,
            data.gererTaxonomie ?? false,
            data.restreindreCaracteresSpeciaux ?? false,
            data.fraisTransaction ?? false,
            data.typeFraisTransaction ?? 'normal',
            data.porteurFraisTransaction ?? 'admin',
            data.applicationFraisTransaction ?? 'commande',
            data.pourcentageFrais ?? '2.90',
            data.montantFixeFrais ?? '0.30',
            data.typeFraisFixe ?? 'commande',
            data.selectionHeureExpiration ?? false,
            data.paysOrigineProduit ?? false,
            data.texteAlternatifMedia ?? true,
            data.templateAlternatifProduit ?? false,
            data.nomTemplate ?? null,
            data.prixSolde ?? false,
            data.arrondiPrix ?? '2',
            data.fraisManutention ?? false,
            data.weightUnit ?? 'kg',
            data.dimensionUnit ?? 'cm',
            
            // Configuration commande (147-188)
            data.modeExpeditionObligatoire ?? false,
            data.numeroSuiviObligatoire ?? false,
            data.statutPreparationCommande ?? false,
            data.heuresPreparation ?? '0',
            data.remboursementExpiration ?? false,
            data.taxesInclusesPrix ?? false,
            data.deduireExpeditionRemboursement ?? false,
            data.deduireTaxesRemboursement ?? false,
            data.taxesSurExpedition ?? false,
            data.permettreEtiquetteExpedition ?? false,
            data.montantEncaisable ?? false,
            data.joursRemboursement ?? '14',
            data.calculMontantEncaisable ?? 'dateCommande',
            data.permettreJoursRemboursementVendeur ?? false,
            data.gererRemiseCommande ?? false,
            data.fraisRemise ?? 'vendeur',
            data.ajouterTVABaliseCommande ?? false,
            data.generationFacture ?? 'anyTime',
            data.permettreInfosSupplementaires ?? false,
            data.modifierInfosSupplementaires ?? false,
            data.permettreAnnulerExpedition ?? false,
            data.permettreAccepterCommande ?? true,
            data.annulerAutoRejet ?? false,
            data.permettreAnnulerCommandeAcceptee ?? false,
            data.accepterEtExpedier ?? false,
            data.permettreCreationCommande ?? false,
            data.envoyerMailExpedition ?? true,
            data.permettreDateLivraisonPrevue ?? false,
            data.dateLivraisonObligatoire ?? false,
            data.gestionPourboire ?? 'vendeurs',
            data.permettreCCEmailCommande ?? false,
            data.rappelExpeditionAuto ?? false,
            data.joursAvantRappel ?? '2',
            data.joursMaxRappel ?? '30',
            data.permettreNotificationAvis ?? false,
            data.evenementNotification ?? 'expedition',
            data.delaiNotification ?? '0',
            data.limiteMaxNotification ?? '1',
            data.tcsSurCommandes ?? false,
            data.tdsSurCommandes ?? false,
            data.restreindreExpeditionFraude ?? false,
            data.restreindreVoirCommandesImpayees ?? false,
            
            // Paramètres avancés (189-192)
            data.groupingCustomFields ?? false,
            data.googleTranslation ?? false,
            data.translationPanel ?? 'both',
            data.rtlAlignment ?? false,
            
            // Commission (193-202)
            data.calculCommissionBase ?? 'normal',
            data.typeCommissionGlobale ?? '%',
            data.commissionGlobale ?? '10.00',
            data.secondeCommissionGlobale ?? '0.00',
            data.typeCommissionFixe ?? 'produit',
            data.activerCommissionMax ?? false,
            data.commissionMax ?? '0.00',
            baremesJSON,
            categoriesJSON,
            vendeursJSON,
            
            // Taxes admin (203-204)
            data.modeTaxe ?? 'libre',
            data.destinataireTaxes ?? 'admin',

            // Identité plateforme (205-206)
            data.nomPlateforme ?? 'e-Vend Studio',
            data.shopifyDomain ?? '',

            // Bannières dashboards (208-225)
            data.banniereVendeurActive ?? false,
            data.banniereVendeurMessage ?? '',
            data.banniereVendeurCouleurBg ?? '#1e3a5f',
            data.banniereVendeurCouleurTx ?? '#ffffff',
            data.banniereVendeurHauteur ?? '36',
            data.banniereVendeurPolice ?? '13',
            data.banniereAcheteurActive ?? false,
            data.banniereAcheteurMessage ?? '',
            data.banniereAcheteurCouleurBg ?? '#1e3a5f',
            data.banniereAcheteurCouleurTx ?? '#ffffff',
            data.banniereAcheteurHauteur ?? '36',
            data.banniereAcheteurPolice ?? '13',

            // Bannière login (220-225)
            data.banniereLoginActive ?? false,
            data.banniereLoginMessage ?? '',
            data.banniereLoginCouleurBg ?? '#1e3a5f',
            data.banniereLoginCouleurTx ?? '#ffffff',
            data.banniereLoginHauteur ?? '36',
            data.banniereLoginPolice ?? '13',

            // Taux de taxes (226-227)
            data.tauxTps ?? 0.05,
            data.tauxTvq ?? 0.09975,

            // Numéros de taxes de la plateforme (228-229)
            data.noTpsPlateforme ?? null,
            data.noTvqPlateforme ?? null,
        ];
        
        console.log(`📊 Nombre de valeurs: ${values.length}`);
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        console.log('✅ Mise à jour réussie - ID:', result.rows[0]?.id);
        
        // Log dans audit_logs
        await pool.query(
            `INSERT INTO audit_logs (action, utilisateur, details, niveau) VALUES ($1,$2,$3,$4)`,
            ['CONFIG_ADMIN_UPDATE', req.user?.email || 'admin',
             JSON.stringify({ updated_by: req.user?.email, timestamp: new Date().toISOString() }), 'info']
        ).catch(e => console.error('Erreur log:', e.message));
        
        console.log('✅ Sauvegarde terminée avec succès');
        console.log('========================================\n');
        
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('❌ ERREUR DÉTAILLÉE:');
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        console.error('========================================\n');
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// PATCH - Mettre à jour partiellement
router.patch('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnee a mettre a jour' });
        }
        
        const values = Object.values(updates);
        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        values.push(1);
        
        const query = `
            UPDATE configuration_generale_admin 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${values.length}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuration non trouvee' });
        }
        
        res.json({ success: true, config: result.rows[0] });
        
    } catch (err) {
        console.error('Erreur PATCH:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /config-publique — Sans authentification, retourne les infos publiques de la plateforme
router.get('/config-publique', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT footer_text, nom_plateforme, shopify_domain, mode_maintenance, message_maintenance, bloquer_inscription_gestionnaire, bloquer_inscription_acheteur, banniere_gestionnaire_active, banniere_gestionnaire_message, banniere_gestionnaire_couleur_bg, banniere_gestionnaire_couleur_tx, banniere_gestionnaire_hauteur, banniere_acheteur_active, banniere_acheteur_message, banniere_acheteur_couleur_bg, banniere_acheteur_couleur_tx, banniere_acheteur_hauteur, banniere_login_active, banniere_login_message, banniere_login_couleur_bg, banniere_login_couleur_tx, banniere_login_hauteur, banniere_gestionnaire_police, banniere_acheteur_police, banniere_login_police FROM configuration_generale_admin WHERE id = 1`
        );
        if (result.rows.length === 0) {
            return res.json({ footer_text: 'Copyright ($current_year) e-Vend, Tous droits réservés', nom_plateforme: 'e-Vend Studio' });
        }
        const row = result.rows[0];
        const annee = new Date().getFullYear();
        const footerText = (row.footer_text || 'Copyright ($current_year) e-Vend Studio, Tous droits réservés')
            .replace('$current_year', annee)
            .replace('($current_year)', annee);
        res.json({
            footer_text:                  footerText,
            nom_plateforme:               row.nom_plateforme || 'e-Vend Studio',
            shopify_domain:               row.shopify_domain || '',
            mode_maintenance:             row.mode_maintenance || false,
            message_maintenance:          row.message_maintenance || '',
            bloquer_inscription_gestionnaire:  row.bloquer_inscription_gestionnaire || false,
            bloquer_inscription_acheteur: row.bloquer_inscription_acheteur || false,
            banniere_gestionnaire_active:      row.banniere_gestionnaire_active || false,
            banniere_gestionnaire_message:     row.banniere_gestionnaire_message || '',
            banniere_gestionnaire_couleur_bg:  row.banniere_gestionnaire_couleur_bg || '#1e3a5f',
            banniere_gestionnaire_couleur_tx:  row.banniere_gestionnaire_couleur_tx || '#ffffff',
            banniere_gestionnaire_hauteur:     row.banniere_gestionnaire_hauteur || '36',
            banniere_acheteur_active:     row.banniere_acheteur_active || false,
            banniere_acheteur_message:    row.banniere_acheteur_message || '',
            banniere_acheteur_couleur_bg: row.banniere_acheteur_couleur_bg || '#1e3a5f',
            banniere_acheteur_couleur_tx: row.banniere_acheteur_couleur_tx || '#ffffff',
            banniere_acheteur_hauteur:    row.banniere_acheteur_hauteur || '36',
            banniere_login_active:        row.banniere_login_active || false,
            banniere_login_message:       row.banniere_login_message || '',
            banniere_login_couleur_bg:    row.banniere_login_couleur_bg || '#1e3a5f',
            banniere_login_couleur_tx:    row.banniere_login_couleur_tx || '#ffffff',
            banniere_login_hauteur:       row.banniere_login_hauteur || '36',
            banniere_gestionnaire_police:      row.banniere_gestionnaire_police || '13',
            banniere_acheteur_police:     row.banniere_acheteur_police || '13',
            banniere_login_police:        row.banniere_login_police || '13',
        });
    } catch (err) {
        console.error('Erreur GET config-publique:', err);
        res.json({ footer_text: `© Copyright ${new Date().getFullYear()} e-Vend Studio, Tous droits réservés`, nom_plateforme: 'e-Vend Studio' });
    }
});

// GET /taxes-publiques — accessible aux vendeurs (sans isAdmin)
router.get('/taxes-publiques', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT mode_taxe, destinataire_taxes FROM configuration_generale_admin WHERE id = 1`
        );
        if (result.rows.length === 0) {
            return res.json({ mode_taxe: 'libre', destinataire_taxes: 'admin' });
        }
        res.json({
            mode_taxe:          result.rows[0].mode_taxe          || 'libre',
            destinataire_taxes: result.rows[0].destinataire_taxes || 'admin',
        });
    } catch (err) {
        console.error('Erreur GET taxes-publiques:', err);
        res.json({ mode_taxe: 'libre', destinataire_taxes: 'admin' });
    }
});

module.exports = router;