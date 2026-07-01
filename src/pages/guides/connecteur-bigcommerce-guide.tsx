import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurBigcommerceGuide() {
  const styles = {
    accent: '#2d6a9f',
    accentLight: '#e8f2fb',
    bg: '#f0f2f5',
    card: '#fff',
    border: '#e1e4e8',
    text: '#1a2332',
    textLight: '#6b7280',
    success: '#16a34a',
    warning: '#d97706',
    purple: '#8b5cf6',
    purpleLight: '#ede9fe',
    blue: '#2563eb',
    blueLight: '#dbeafe',
    orange: '#ea580c',
    orangeLight: '#ffedd5',
    red: '#dc2626',
    redLight: '#fee2e2',
    bigcommerceBlue: '#0e6ab0',
    bigcommercePurple: '#8b5cf6',
    bigcommerceLight: '#e8f0f8'
  };

  return (
    <div style={{
      backgroundColor: styles.bg,
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: styles.card,
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 35px -10px rgba(0,0,0,0.1)'
      }}>
        
        {/* En-tête avec dégradé bleu/violet BigCommerce */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.bigcommerceBlue} 0%, ${styles.bigcommercePurple} 100%)`,
          padding: '60px 40px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ 
            fontSize: '80px', 
            marginBottom: '32px',
            display: 'inline-block',
            animation: 'bounce 2s ease infinite'
          }}>
            🏪🔄
          </div>
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '800',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            Guide d'utilisation - Connecteur BigCommerce
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits et commandes des vendeurs BigCommerce avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏪 BigCommerce vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Précommandes et codes-barres</span>
          </div>
        </div>

        {/* Sommaire */}
        <div style={{
          padding: '32px 48px',
          background: '#f8fafc',
          borderBottom: `1px solid ${styles.border}`
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>📑 Sommaire</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              'Introduction',
              'Prérequis et tarification',
              'Installation et activation',
              'Configuration administrateur',
              'Précommandes (Preorder)',
              'Configuration vendeur',
              'Obtention du token d\'accès',
              'Import de produits',
              'Webhooks',
              'Règles de prix',
              'Synchronisation des codes-barres',
              'Foire aux questions',
              'Support'
            ].map((item, i) => (
              <a key={i} href={`#section-${i}`} style={{
                color: styles.accent,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ padding: '48px' }}>
          
          {/* Section 1: Introduction */}
          <section id="section-0" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📖 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Connecteur BigCommerce</strong> permet aux vendeurs utilisant BigCommerce de synchroniser 
              leurs produits et commandes avec votre marketplace Shopify. BigCommerce est une plateforme eCommerce 
              SaaS qui aide les détaillants à vendre en ligne.
            </p>
            <div style={{
              background: styles.bigcommerceLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.bigcommerceBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs peuvent synchroniser automatiquement leurs produits, 
                gérer les stocks des deux côtés, et bénéficier de fonctionnalités avancées comme les précommandes 
                et la synchronisation des codes-barres.
              </p>
            </div>
          </section>

          {/* Section 2: Prérequis et tarification */}
          <section id="section-1" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚠️ Prérequis et tarification
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Conditions préalables</h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Plan <strong>Multivendor PRO</strong> (60$/mois) ou supérieur</li>
                <li>Frais supplémentaires de <strong>25$ USD par mois</strong> pour l'add-on Connecteur BigCommerce</li>
                <li>Les vendeurs doivent avoir un compte BigCommerce avec un compte API actif</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Installation et activation */}
          <section id="section-2" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚙️ Installation et activation
            </h2>
            
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  background: styles.accent,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>1</span>
                Activer l'add-on
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> (Feature Apps) de votre tableau de bord administrateur.
                Recherchez "Connecteur BigCommerce" et cliquez sur le bouton <strong>Activer</strong>.
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  background: styles.accent,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>2</span>
                Accepter les frais supplémentaires
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Acceptez les frais mensuels de <strong>25$ USD</strong> et approuvez le paiement dans Shopify Backend.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '32px',
                  height: '32px',
                  background: styles.accent,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>3</span>
                Accéder à la configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration BigCommerce</strong> apparaît dans la section 
                <strong>Configuration</strong> du tableau de bord des vendeurs.
              </p>
            </div>
          </section>

          {/* Section 4: Configuration administrateur */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👑 Configuration côté administrateur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration du connecteur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration du connecteur</strong> et sélectionnez 
                le connecteur BigCommerce.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Synchronisation automatique</strong> : Configurez les paramètres de synchronisation</li>
                <li><strong>Synchronisation des commandes</strong> : Activez pour créer les commandes sur BigCommerce</li>
                <li><strong>Précommandes (Preorder)</strong> : Activez la synchronisation des données de précommande</li>
                <li><strong>Codes-barres</strong> : Activez la synchronisation des codes-barres (UPC, MPN, GTIN)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Lorsqu'une commande est passée sur la marketplace pour un produit connecté, 
                  elle est automatiquement créée sur BigCommerce. Un numéro de commande de référence est visible.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Précommandes */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📅 Synchronisation des précommandes (Preorder)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Fonctionnalité Preorder Data Syncing
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Cette fonctionnalité permet aux vendeurs de synchroniser les données de précommande entre BigCommerce et Shopify :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Activez l'option <strong>Preorder Data Sync</strong> dans la configuration du connecteur</li>
                <li>Les données de précommande sont sauvegardées via un metafield sur Shopify</li>
                <li>Les clients voient les informations de précommande sur la boutique</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.purpleLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note technique :</strong> Pour afficher ces informations sur votre boutique, vous devez ajouter 
                  le code fourni dans les instructions dans le fichier <code>product.json &gt;&gt; sections/main-product.liquid</code>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration vendeur */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Configuration côté vendeur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Saisie des informations
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration BigCommerce</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Store Hash</strong> : Le hash unique de la boutique BigCommerce</li>
                <li><strong>Unité de poids</strong> : Sélectionnez l'unité utilisée sur BigCommerce</li>
                <li><strong>Devise de la boutique</strong> : Choisissez la devise</li>
                <li><strong>Unité de dimension</strong> : Sélectionnez l'unité de mesure</li>
                <li><strong>Access Token</strong> : Le token d'accès API généré depuis BigCommerce</li>
                <li><strong>Auto-sync nouveaux produits</strong> : Activez pour synchroniser automatiquement</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Obtention du token d'accès */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention du token d'accès BigCommerce
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure pour le vendeur
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre compte <strong>BigCommerce</strong></li>
                <li>Allez dans <strong>Paramètres avancés</strong> (Advanced Settings)</li>
                <li>Descendez jusqu'à la section <strong>Comptes API</strong> (API Accounts)</li>
                <li>Cliquez sur <strong>Créer un compte API</strong> (Create API Account)</li>
                <li>Entrez les informations requises :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom du compte API</li>
                  <li>Sélectionnez les permissions (Produits, Commandes, Inventaire)</li>
                </ul>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
                <li>Une fenêtre contextuelle affiche le <strong>token d'accès</strong></li>
                <li>Copiez et conservez ce token précieusement</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Le token d'accès n'est affiché qu'une seule fois. Conservez-le précieusement 
                  et stockez-le dans un gestionnaire de mots de passe sécurisé.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Import de produits */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Import de produits depuis BigCommerce
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Méthodes d'import
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après la configuration, les vendeurs peuvent importer leurs produits via deux méthodes :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Méthode 1 : Par IDs de produits</strong> - Entrez les IDs des produits séparés par des virgules</li>
                <li><strong>Méthode 2 : Par plage de dates</strong> - Sélectionnez une période pour importer les produits créés entre ces dates</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Vous pouvez activer l'<strong>approbation automatique</strong> des produits 
                  dans la configuration administrateur pour que les produits importés soient directement visibles.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Webhooks */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔗 Webhooks BigCommerce
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Enregistrement des webhooks
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent enregistrer ou désenregistrer les webhooks BigCommerce depuis leur tableau de bord :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans l'espace vendeur</li>
                <li>Accédez à <strong>Configuration</strong> → <strong>Configuration BigCommerce</strong></li>
                <li>Cliquez sur l'onglet <strong>Webhooks BigCommerce</strong></li>
                <li>Cliquez sur <strong>Enregistrer les webhooks</strong> pour activer la synchronisation automatique</li>
                <li>Utilisez <strong>Désenregistrer</strong> pour désactiver si nécessaire</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.bigcommerceLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> Les webhooks permettent une synchronisation en temps réel des modifications 
                  effectuées sur BigCommerce.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Règles de prix */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💰 Règles de prix
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Création de règles de prix
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent ajuster leurs prix lors de l'import :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Règle de prix du connecteur</strong></li>
                <li>Activez le statut de la règle de prix</li>
                <li>Choisissez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Augmenter</strong> ou <strong>Diminuer</strong> le prix</li>
                  <li><strong>Montant fixe</strong> ou <strong>Pourcentage</strong></li>
                  <li>Saisissez la valeur</li>
                </ul>
                <li>Cochez pour mettre à jour les produits déjà synchronisés</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.bigcommerceLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Diminuer les prix de 10% pour rester compétitif sur la marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: Synchronisation des codes-barres */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔢 Synchronisation des codes-barres
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut activer la synchronisation des codes-barres (UPC, MPN, GTIN, etc.) :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Administrateur</strong> → <strong>Configuration</strong> → <strong>Configuration du connecteur</strong></li>
                <li>Sélectionnez <strong>BigCommerce Connector</strong></li>
                <li>Activez l'option <strong>Product Barcode</strong></li>
                <li>Sauvegardez les modifications</li>
              </ol>
              <p style={{ color: styles.textLight, marginTop: '16px' }}>
                Une fois activé, les vendeurs peuvent sélectionner le type de code-barres à synchroniser :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>MPN (Manufacturer Part Number)</li>
                <li>GTIN (Global Trade Item Number)</li>
                <li>UPC (Universal Product Code)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> La synchronisation des codes-barres est essentielle pour la gestion 
                  des stocks et la traçabilité des produits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 12: FAQ */}
          <section id="section-11" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ❓ Foire aux questions
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Qu'est-ce que BigCommerce ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  BigCommerce est une plateforme eCommerce SaaS qui permet aux entreprises de créer et gérer leur boutique en ligne. 
                  Elle offre des fonctionnalités avancées de vente multicanal.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir le store hash BigCommerce ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le store hash est disponible dans l'URL de votre boutique BigCommerce. Par exemple, 
                  pour <code>https://store-abc123.mybigcommerce.com</code>, le hash est "abc123".
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les produits sont-ils mis à jour automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si l'administrateur active les mises à jour automatiques et que les webhooks sont enregistrés, 
                  les modifications (nom, prix, stock, images) sont automatiquement synchronisées.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionnent les précommandes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Activez l'option Preorder Data Sync dans la configuration administrateur. Les données de précommande 
                  sont alors synchronisées via un metafield et affichées sur la boutique.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels types de codes-barres peuvent être synchronisés ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le connecteur prend en charge la synchronisation des codes-barres UPC, MPN et GTIN. 
                  L'administrateur doit activer cette option dans la configuration.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les commandes sont-elles synchronisées automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si l'administrateur active la synchronisation des commandes, chaque commande passée 
                  sur la marketplace est automatiquement créée sur BigCommerce avec un numéro de référence.
                </p>
              </div>
            </div>
          </section>

          {/* Section 13: Support */}
          <section id="section-12" style={{
            background: `linear-gradient(135deg, ${styles.accentLight} 0%, white 100%)`,
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center',
            border: `1px solid ${styles.border}`
          }}>
            <div style={{ 
              fontSize: '64px', 
              marginBottom: '24px',
              display: 'inline-block'
            }}>
              🛟
            </div>
            <h3 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              marginBottom: '16px', 
              color: styles.text 
            }}>
              Besoin d'aide supplémentaire ?
            </h3>
            <p style={{ color: styles.textLight, marginBottom: '32px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', fontSize: '16px' }}>
              Notre équipe d'experts est disponible 24h/24 et 7j/7 pour vous accompagner dans la configuration 
              et l'optimisation de votre connecteur BigCommerce.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/addons" style={{
                background: styles.accent,
                color: 'white',
                padding: '14px 32px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ← Retour aux add-ons
              </Link>
              <a href="mailto:support@evend.ca" style={{
                background: 'white',
                color: styles.accent,
                padding: '14px 32px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${styles.accent}`
              }}>
                📧 Contacter le support
              </a>
              <a href="#" style={{
                background: '#f0f2f5',
                color: styles.text,
                padding: '14px 32px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${styles.border}`
              }}>
                📚 Documentation Connecteur BigCommerce
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
