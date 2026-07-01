import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurEbayGuide() {
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
    ebayBlue: '#0064d2',
    ebayYellow: '#f5af02',
    ebayRed: '#e53238',
    ebayGreen: '#86b817',
    ebayLight: '#e8f0ff'
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
        
        {/* En-tête avec dégradé bleu/jaune eBay */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.ebayBlue} 0%, ${styles.ebayYellow} 100%)`,
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
            🛒🔄
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
            Guide d'utilisation - Connecteur eBay
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs eBay avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🛒 eBay vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Gestion des stocks en temps réel</span>
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
              'Restriction des collections',
              'Configuration vendeur',
              'Obtention des identifiants eBay',
              'Synchronisation automatique',
              'Mapping des collections',
              'Import de produits',
              'Gestion des produits',
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
              L'add-on <strong>Connecteur eBay</strong> permet aux vendeurs possédant une boutique eBay de synchroniser 
              leurs produits avec votre marketplace Shopify. eBay est une plateforme eCommerce mondiale où les particuliers 
              et les entreprises échangent une large gamme de biens et services.
            </p>
            <div style={{
              background: styles.ebayLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.ebayBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Le connecteur offre une synchronisation <strong>unidirectionnelle</strong> 
                d'eBay vers Shopify. Les modifications sur eBay sont répercutées sur Shopify, mais pas l'inverse. 
                Les stocks sont synchronisés en temps réel lors des commandes.
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
                <li>Frais supplémentaires de <strong>10$ à 200$ USD par mois</strong> selon le nombre de vendeurs</li>
                <li>Les vendeurs doivent avoir un compte <strong>eBay Seller</strong> actif</li>
                <li>Les vendeurs doivent créer une application sur le <strong>portail développeur eBay</strong></li>
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
                Recherchez "Connecteur eBay" et cliquez sur le bouton <strong>Activer</strong>.
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
                Choisir le plan
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Sélectionnez le plan qui correspond à vos besoins (de 10$ à 200$ USD par mois selon le nombre de vendeurs) 
                et cliquez sur <strong>Accepter</strong> pour approuver les frais supplémentaires.
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
                Un nouveau menu <strong>Configuration eBay</strong> apparaît dans la section 
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
                le connecteur eBay.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Autoriser le vendeur à choisir l'environnement</strong> : Permet aux vendeurs de choisir entre l'environnement de test (Sandbox) et l'environnement de production</li>
                <li><strong>Taxes</strong> : Choisissez comment gérer les taxes :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Taxes comme configurées sur Shopify</li>
                  <li>Taxes comme configurées sur eBay</li>
                  <li>Ne pas facturer de taxes</li>
                </ul>
              </ul>
            </div>
          </section>

          {/* Section 5: Restriction des collections */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏷️ Restriction des collections
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des restrictions
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour permettre aux vendeurs de mapper leurs collections eBay :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration des restrictions</strong></li>
                <li>Activez l'option <strong>Restreindre les paramètres de collection</strong></li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Cette option permet aux vendeurs de mapper leurs collections avec leur boutique eBay 
                  directement depuis leur tableau de bord.
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
                Saisie des informations eBay
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration eBay</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>eBay User Name</strong> : Nom d'utilisateur eBay</li>
                <li><strong>App Client ID</strong> : Identifiant client de l'application eBay</li>
                <li><strong>Dev ID</strong> : Identifiant développeur</li>
                <li><strong>App Client Secret</strong> : Secret de l'application</li>
                <li><strong>eBay Redirect URL Name</strong> : URL de redirection</li>
                <li><strong>Seller Marketplace</strong> : Marketplace du vendeur (ex: eBay France, eBay US)</li>
                <li><strong>Select Credential Type</strong> : Type d'identifiants (Production ou Sandbox)</li>
                <li><strong>Weight unit of your eBay Store</strong> : Unité de poids</li>
                <li><strong>Currency</strong> : Devise de la boutique</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Obtention des identifiants eBay */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des identifiants eBay
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
                <li>Connectez-vous à <strong>developer.ebay.com</strong></li>
                <li>Allez dans la section <strong>Application Page</strong></li>
                <li>Entrez un titre dans la zone <strong>Enter Application Title</strong></li>
                <li>Dans la section <strong>Production</strong>, cliquez sur <strong>Create a Keyset</strong></li>
                <li>Remplissez les informations de votre profil de contact (si nécessaire)</li>
                <li>Sélectionnez l'environnement <strong>Production</strong></li>
                <li>Dans <strong>Event Notification Delivery Method</strong>, choisissez "Marketplace Account Deletion"</li>
                <li>Activez <strong>Exempted from Marketplace Account Deletion</strong></li>
                <li>Cliquez sur <strong>Confirm</strong></li>
                <li>Cliquez sur <strong>User Token</strong> sous le Client ID</li>
                <li>Cliquez sur <strong>Add eBay Redirect URL</strong></li>
                <li>Sélectionnez <strong>OAuth</strong>, entrez un titre, et configurez les URLs :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Auth Accepted URL</strong> : URL de la configuration eBay</li>
                  <li><strong>Auth Declined URL</strong> : URL de la configuration eBay</li>
                </ul>
                <li>Cliquez sur <strong>Save</strong></li>
                <li>Copiez le <strong>Client ID</strong>, <strong>Dev ID</strong> et <strong>Secret ID</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Conservez précieusement ces identifiants. Ils sont nécessaires pour établir 
                  la connexion entre votre boutique et eBay.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Synchronisation automatique */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Synchronisation automatique des produits
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Auto-sync des nouveaux produits
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent activer la synchronisation automatique pour que tout nouveau produit ajouté sur eBay 
                soit automatiquement importé sur la marketplace :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration eBay</strong></li>
                <li>Activez l'option <strong>Auto Sync new products</strong></li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
                <li>Vous serez redirigé vers la page de connexion eBay pour autoriser l'application</li>
                <li>Un message "App Details Updated Successfully" confirme la configuration</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Résultat :</strong> Tous les nouveaux produits ajoutés sur eBay sont automatiquement importés 
                  sur la marketplace, garantissant une synchronisation constante.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Mapping des collections */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🗂️ Mapping des collections
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration du mapping
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent mapper leurs collections eBay avec les collections de la marketplace :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration eBay</strong></li>
                <li>Cliquez sur la section <strong>Collection Mapping</strong></li>
                <li>Cliquez sur <strong>Map Collection</strong></li>
                <li>Sélectionnez la <strong>Collection Name of Merchant Store</strong></li>
                <li>Dans <strong>Collection Name of Your Store</strong>, entrez le nom de la collection créée sur eBay</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.ebayLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les collections mappées peuvent être désactivées ou supprimées en cliquant 
                  sur les trois points sous la colonne "Action".
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Import de produits */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Import de produits depuis eBay
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
                Les vendeurs peuvent importer leurs produits via deux méthodes :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Méthode 1 : Par période</strong></li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Sélectionnez une plage de dates (From/To)</li>
                  <li>Cliquez sur <strong>Import Products</strong></li>
                  <li>Importe tous les produits créés pendant cette période</li>
                </ul>
                <li><strong>Méthode 2 : Par numéro d'article eBay</strong></li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Entrez le numéro d'article eBay (eBay Item Number)</li>
                  <li>Cliquez sur <strong>Import Product</strong></li>
                  <li>Importe un produit spécifique</li>
                </ul>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Un message de confirmation apparaît une fois l'import réussi.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: Gestion des produits */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Gestion des produits
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Visualisation et édition
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après l'import, les vendeurs peuvent gérer leurs produits :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Visualisation</strong> : Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li><strong>Édition</strong> :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Cliquez sur les trois points "..." sous la colonne Action</li>
                  <li>Sélectionnez <strong>Modifier</strong></li>
                  <li>Effectuez les modifications nécessaires</li>
                  <li>Cliquez sur <strong>Enregistrer</strong></li>
                </ul>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note importante :</strong> Les modifications effectuées sur Shopify ne sont <strong>pas</strong> 
                  synchronisées vers eBay (synchronisation unidirectionnelle). Seuls les stocks sont mis à jour sur eBay 
                  lorsqu'une commande est passée.
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
                  Quelle est la différence entre synchronisation unidirectionnelle et bidirectionnelle ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le connecteur eBay offre une synchronisation <strong>unidirectionnelle</strong> : les modifications 
                  sur eBay sont répercutées sur Shopify, mais pas l'inverse. Les stocks sont touteous synchronisés 
                  en temps réel lors des commandes.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir les identifiants API eBay ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Connectez-vous à developer.ebay.com, créez une application, générez une clé API, et récupérez 
                  le Client ID, Dev ID et Secret ID. Suivez les étapes détaillées dans la section "Obtention des identifiants eBay".
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les produits sont-ils mis à jour automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si la synchronisation automatique est activée. Les nouveaux produits ajoutés sur eBay sont 
                  automatiquement importés. Les modifications sur les produits existants sont également synchronisées 
                  lorsqu'un vendeur utilise l'option "Mettre à jour".
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Qu'est-ce que l'environnement Sandbox ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'environnement Sandbox est un environnement de test eBay qui permet aux vendeurs de tester 
                  leurs configurations sans affecter leur boutique réelle. L'administrateur peut autoriser les vendeurs 
                  à choisir entre Sandbox et Production.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment gérer les taxes sur les produits eBay ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut choisir dans la configuration du connecteur : appliquer les taxes Shopify, 
                  les taxes eBay, ou ne pas facturer de taxes sur les produits synchronisés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les commandes sont-elles synchronisées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les <strong>stocks</strong> sont synchronisés en temps réel lorsqu'une commande est passée sur 
                  la marketplace. Cependant, les commandes elles-mêmes ne sont pas créées sur eBay.
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
              et l'optimisation de votre connecteur eBay.
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
                📚 Documentation Connecteur eBay
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
