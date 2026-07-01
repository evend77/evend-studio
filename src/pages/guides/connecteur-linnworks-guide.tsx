import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurLinnworksGuide() {
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
    linnworksBlue: '#0078d4',
    linnworksLight: '#e8f4ff'
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
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.linnworksBlue} 0%, ${styles.accent} 100%)`,
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
            📊🔄
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
            Guide d'utilisation - Connecteur Linnworks
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits et commandes des vendeurs Linnworks avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Linnworks vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Gestion des commandes</span>
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
              'Obtention des identifiants API Linnworks',
              'Configuration vendeur',
              'Intégration des canaux Linnworks',
              'Import de produits',
              'Règles de prix',
              'Synchronisation des commandes',
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
              L'add-on <strong>Connecteur Linnworks</strong> permet aux vendeurs utilisant Linnworks de synchroniser 
              leurs produits et commandes avec votre marketplace Shopify. Linnworks est une plateforme de gestion 
              des commandes (Order Management System) qui aide les vendeurs en ligne à automatiser les processus clés, 
              réduire les coûts et développer leur activité.
            </p>
            <div style={{
              background: styles.linnworksLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.linnworksBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs peuvent synchroniser et mettre à jour automatiquement 
                le nom des produits, les stocks, les prix, les images et les descriptions. Toutes les modifications 
                effectuées sur Linnworks sont automatiquement répercutées sur la marketplace.
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
                <li>Frais supplémentaires de <strong>25$ USD par mois</strong> pour l'add-on Connecteur Linnworks</li>
                <li>Les vendeurs doivent avoir un compte Linnworks avec des produits actifs</li>
                <li>Un compte développeur Linnworks (developer.linnworks.com)</li>
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
                Recherchez "Connecteur Linnworks" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de 25$ USD et approuvez le paiement dans Shopify Backend.
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
                Un nouveau menu <strong>Configuration Linnworks</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord pour les vendeurs.
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
                Configuration Linnworks
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration Linnworks</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Application ID</strong> : L'identifiant de l'application créée sur le portail développeur Linnworks</li>
                <li><strong>Application Secret</strong> : Le secret de l'application généré sur Linnworks</li>
                <li><strong>Installation URL</strong> : L'URL d'installation fournie par Linnworks</li>
                <li><strong>Nom du canal</strong> : Le nom du canal d'intégration (maximum 20 caractères)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> En bas de cette page, vous trouverez un fichier manifest à télécharger. 
                  Vous en aurez besoin lors de la création de l'application sur le portail développeur Linnworks.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration du connecteur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration du connecteur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Mise à jour automatique</strong> : Activez pour synchroniser automatiquement :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom du produit</li>
                  <li>Inventaire/Stocks</li>
                  <li>Prix</li>
                  <li>Images</li>
                  <li>Description</li>
                </ul>
                <li><strong>Taxes</strong> : Choisissez comment gérer les taxes :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Taxes comme configurées sur Linnworks</li>
                  <li>Ne pas facturer de taxes</li>
                  <li>Taxes comme configurées sur la marketplace</li>
                </ul>
                <li><strong>Synchroniser les commandes</strong> : Activez pour synchroniser les commandes avec Linnworks</li>
                <li><strong>Détails à synchroniser</strong> : Choisissez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Adresse de livraison</li>
                  <li>Adresse de facturation</li>
                  <li>Nom du client</li>
                  <li>Email</li>
                </ul>
              </ul>
            </div>
          </section>

          {/* Section 5: Obtention des identifiants API Linnworks */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des identifiants API Linnworks
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure pour l'administrateur
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à <strong>developer.linnworks.com</strong></li>
                <li>Cliquez sur <strong>New App</strong> pour créer une nouvelle application</li>
                <li>Entrez le nom de l'application (nom de votre choix)</li>
                <li>Sélectionnez <strong>Channel Integration</strong> comme type d'application</li>
                <li>Dans <strong>App Modules</strong>, passez en mode éditeur de texte</li>
                <li>Copiez-collez le fichier <strong>manifest</strong> téléchargé depuis la configuration Linnworks</li>
                <li>Remplissez les champs vides dans le manifest :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>moduleName : nom du module</li>
                  <li>formattedName : nom formaté</li>
                  <li>ChannelName : nom du canal (max 20 caractères)</li>
                  <li>ChannelFriendlyName : nom convivial du canal</li>
                </ul>
                <li>Sauvegardez les modifications</li>
                <li>Dans l'onglet <strong>General</strong>, récupérez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Application ID</li>
                  <li>Application Secret</li>
                  <li>Installation URL</li>
                </ul>
                <li>Ajoutez ces informations dans la configuration Linnworks de votre marketplace</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Conservez précieusement ces identifiants. Ils sont nécessaires 
                  pour établir la connexion entre votre marketplace et Linnworks.
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
                Installation de l'application Shopify Linnworks
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs doivent d'abord installer l'application Shopify Linnworks :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration Linnworks</strong></li>
                <li>Cliquez sur <strong>Télécharger l'application Shopify Linnworks</strong></li>
                <li>Connectez-vous à votre compte Linnworks</li>
                <li>Autorisez et installez l'application</li>
                <li>Confirmez l'installation avec le message de succès</li>
              </ol>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des paramètres
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après l'installation, dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration Linnworks</strong> :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Unité de poids</strong> : Sélectionnez l'unité utilisée sur Linnworks</li>
                <li><strong>Devise de la boutique</strong> : Choisissez la devise</li>
                <li>Sauvegardez les modifications</li>
                <li>Actualisez la page pour que la configuration soit prise en compte</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Intégration des canaux Linnworks */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔌 Intégration des canaux Linnworks
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration du canal d'intégration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs doivent configurer le canal d'intégration dans leur compte Linnworks :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à <strong>linnworks.net</strong></li>
                <li>Allez dans <strong>Settings</strong> → <strong>Channel Integration</strong></li>
                <li>Cliquez sur <strong>Add New</strong></li>
                <li>Recherchez votre canal et installez-le</li>
                <li>Entrez un nom de compte unique pour référence</li>
                <li>Acceptez les conditions d'utilisation</li>
                <li>Activez l'intégration</li>
                <li>Configurez le <strong>Channel Location Mapping</strong> si nécessaire</li>
                <li>Configurez le <strong>Product Mapping</strong> selon vos besoins</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.linnworksLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le nom du compte doit être unique pour identifier l'intégration 
                  dans le système Linnworks.
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
              📦 Import de produits depuis Linnworks
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
                <li><strong>Méthode 1 : Par SKUs</strong> - Entrez les SKUs des produits séparés par des virgules</li>
                <li><strong>Méthode 2 : Par fichier CSV</strong> - Téléchargez un fichier CSV contenant les SKUs des produits à importer</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les produits importés apparaissent dans la liste des produits. 
                  Ils peuvent être synchronisés manuellement avec la boutique si nécessaire.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Mise à jour automatique des produits
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                <strong>Fonctionnement :</strong> Si l'administrateur a activé les mises à jour automatiques, 
                toute modification effectuée sur Linnworks est automatiquement répercutée sur la marketplace pour :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Nom du produit</li>
                <li>Quantité en stock</li>
                <li>Prix</li>
                <li>Images</li>
                <li>Description</li>
              </ul>
            </div>
          </section>

          {/* Section 9: Règles de prix */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
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
                background: styles.linnworksLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Si vous définissez une règle de diminution de 10%, un produit 
                  à 100$ sur Linnworks sera listé à 90$ sur la marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Synchronisation des commandes */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Synchronisation des commandes
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Fonctionnement
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Lorsqu'une commande est passée sur la marketplace pour un produit Linnworks :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>La commande est automatiquement synchronisée avec Linnworks</li>
                <li>Les stocks sont mis à jour des deux côtés</li>
                <li>Les informations client sont synchronisées (selon configuration)</li>
                <li>Les adresses de livraison et de facturation sont transmises</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> Activez la synchronisation des commandes dans la configuration 
                  administrateur pour que cela fonctionne. Les vendeurs peuvent ainsi gérer toutes leurs commandes 
                  depuis une seule interface Linnworks.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: FAQ */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
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
                  Qu'est-ce que Linnworks ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Linnworks est une plateforme de gestion des commandes (Order Management System) qui aide 
                  les vendeurs en ligne à automatiser le traitement des commandes, la gestion des stocks, 
                  l'impression des étiquettes et plus encore.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les produits sont-ils mis à jour automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si l'administrateur active les mises à jour automatiques dans la configuration du connecteur. 
                  Les modifications (nom, prix, stock, images, description) sont automatiquement synchronisées 
                  depuis Linnworks vers la marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment importer les produits depuis Linnworks ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent importer leurs produits en utilisant les SKUs des produits (séparés par des virgules) 
                  ou en téléchargeant un fichier CSV contenant la liste des SKUs à importer.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les commandes sont-elles synchronisées automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si l'administrateur active la synchronisation des commandes, chaque commande passée 
                  sur la marketplace est automatiquement synchronisée avec Linnworks, permettant aux vendeurs 
                  de gérer toutes leurs commandes depuis une seule interface.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment configurer les taxes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut choisir entre trois options : utiliser les taxes configurées sur Linnworks, 
                  ne pas facturer de taxes, ou utiliser les taxes configurées sur la marketplace Shopify.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire si un produit n'est pas importé correctement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vérifiez que le SKU du produit existe bien dans Linnworks, que l'application est correctement installée, 
                  et que les permissions nécessaires sont activées. Assurez-vous également que le produit est actif 
                  et publié sur Linnworks.
                </p>
              </div>
            </div>
          </section>

          {/* Section 12: Support */}
          <section id="section-11" style={{
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
              et l'optimisation de votre connecteur Linnworks.
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
                📚 Documentation Connecteur Linnworks
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
