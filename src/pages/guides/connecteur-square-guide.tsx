import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurSquareGuide() {
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
    squareGreen: '#3e8e3e',
    squareLight: '#e8f5e8'
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
          background: `linear-gradient(135deg, ${styles.squareGreen} 0%, ${styles.accent} 100%)`,
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
            💳🔄
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
            Guide d'utilisation - Connecteur Square
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs Square POS avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💳 Square POS vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Gestion centralisée</span>
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
              'Création d\'application Square',
              'Configuration administrateur',
              'Webhooks',
              'Configuration vendeur',
              'Mapping des collections',
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
              L'add-on <strong>Connecteur Square</strong> permet aux vendeurs utilisant Square POS (point de vente mobile) 
              de synchroniser leurs produits avec votre marketplace Shopify. Square est une application mobile gratuite 
              qui permet d'accepter les paiements par carte de crédit, idéale pour les commerçants physiques.
            </p>
            <div style={{
              background: styles.squareLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.squareGreen}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs peuvent gérer leurs produits, stocks et prix à un seul endroit 
                grâce à cette intégration. La synchronisation est automatique.
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
                <li>Frais supplémentaires de <strong>25$ USD par mois</strong> pour l'add-on Connecteur Square</li>
                <li>Les vendeurs doivent avoir un compte Square POS</li>
                <li>L'administrateur doit créer une application sur Square Developer Portal</li>
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
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "Connecteur Square" et cliquez sur le bouton <strong>Activer</strong>.
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
                Un nouveau menu <strong>Configuration Square</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord.
              </p>
            </div>
          </section>

          {/* Section 4: Création d'application Square */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Création d'une application Square
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
                <li>Connectez-vous à <strong>https://developer.squareup.com</strong></li>
                <li>Allez dans le <strong>Tableau de bord</strong></li>
                <li>Cliquez sur le bouton <strong>+</strong> pour ajouter une nouvelle application</li>
                <li>Entrez le <strong>Nom de l'application</strong> et cliquez sur <strong>Enregistrer</strong></li>
                <li>Activez le mode <strong>Production</strong> pour obtenir les identifiants</li>
                <li>Notez le <strong>Application ID</strong> et le <strong>Application Secret</strong></li>
                <li>Assurez-vous de modifier la version de l'API vers <strong>2019-09-25</strong></li>
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
                Obtention des identifiants
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Application ID</strong> : Dans Credentials → Production App ID</li>
                <li><strong>Application Secret</strong> : Dans Credentials → OAuth → Application Secret</li>
                <li><strong>Signature Key Webhook</strong> : Après création du webhook (voir section suivante)</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Configuration administrateur */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
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
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Saisie des identifiants
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration Square</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Application ID</strong> : Collez l'ID de l'application Square</li>
                <li><strong>Application Secret</strong> : Collez le secret de l'application</li>
                <li><strong>Signature Key Webhook</strong> : Collez la clé de signature (après création webhook)</li>
                <li><strong>Version de l'API</strong> : Sélectionnez 2019-09-25</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les vendeurs doivent télécharger l'application Square depuis leur espace vendeur 
                  pour établir la connexion.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Webhooks */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔌 Création des webhooks
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure de création
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à Square Developer Dashboard</li>
                <li>Allez dans <strong>Applications</strong> → sélectionnez votre application</li>
                <li>Cliquez sur <strong>Webhooks</strong> dans le menu</li>
                <li>Activez les webhooks</li>
                <li>Cliquez sur <strong>Connect v2 Webhooks</strong> → <strong>Ajouter un endpoint</strong></li>
                <li>Entrez les informations :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Nom du webhook</strong> : Donnez un nom descriptif</li>
                  <li><strong>URL d'écoute</strong> : Fournie dans la configuration de l'application</li>
                  <li><strong>Version API</strong> : 2019-09-25</li>
                </ul>
                <li>Sélectionnez les événements :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>catalog.version.updated</strong> : Mise à jour du catalogue</li>
                  <li><strong>inventory.count.updated</strong> : Mise à jour des stocks</li>
                </ul>
                <li>Enregistrez</li>
                <li>Cliquez sur le nom du webhook créé pour obtenir la <strong>Signature Key</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Pourquoi créer un webhook ?</strong> Les webhooks fournissent des mises à jour en temps réel 
                  sans avoir à interroger régulièrement l'API.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Configuration vendeur */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
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
                Installation de l'application
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration Square</strong></li>
                <li>Cliquez sur <strong>Télécharger l'application Shopify-Square</strong></li>
                <li>Vous êtes redirigé vers la page de connexion Square</li>
                <li>Connectez-vous à votre compte Square</li>
                <li>Autorisez l'accès à l'application</li>
                <li>Vous êtes automatiquement redirigé vers l'espace vendeur</li>
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
                Options de configuration
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Auto-synchronisation des nouveaux produits</strong> : Les nouveaux produits sont automatiquement importés</li>
                <li><strong>Unité de poids</strong> : Sélectionnez l'unité utilisée sur Square</li>
                <li><strong>Mapping des collections</strong> : Associez les collections Square aux collections de la marketplace</li>
              </ul>
            </div>
          </section>

          {/* Section 8: Mapping des collections */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🗺️ Mapping des collections
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Avant l'import des produits, les vendeurs doivent mapper leurs collections :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration Square</strong></li>
                <li>Cliquez sur <strong>Mapping des collections</strong></li>
                <li>Sélectionnez la collection de la marketplace à associer</li>
                <li>Choisissez la collection Square correspondante</li>
                <li>Enregistrez</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Assurez-vous que l'administrateur a activé l'option 
                  "Restreindre les collections" dans la configuration.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Import de produits */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Import de produits depuis Square
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Import manuel
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent importer des produits spécifiques :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Cliquez sur <strong>Importer les produits</strong></li>
                <li>Entrez les <strong>IDs de produits</strong> séparés par des virgules</li>
                <li>Cliquez sur <strong>Importer</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Seuls les produits "simples" et "variables" peuvent être importés.
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
                Synchronisation manuelle
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Si les produits ne sont pas synchronisés automatiquement :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Cliquez sur <strong>Actions</strong> → <strong>Synchroniser avec la boutique vendeur</strong></li>
                <li>Les produits sont mis à jour</li>
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
                Gestion par l'administrateur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les produits importés apparaissent en attente d'approbation. L'administrateur peut :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Approuver</strong> : Le produit devient visible sur la marketplace</li>
                <li><strong>Refuser</strong> : Un motif de refus doit être fourni</li>
                <li><strong>Modifier</strong> : Éditer les informations du produit</li>
                <li><strong>Supprimer</strong> : Retire définitivement le produit</li>
              </ul>
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
                Création de règles
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
                background: styles.squareLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Augmenter les prix de 5% pour couvrir les frais de commission.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: Synchronisation des commandes */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
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
                Configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration du connecteur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Synchroniser les commandes</strong> : Active pour créer les commandes sur Square</li>
                <li><strong>Synchroniser les données client</strong> : Inclut les informations client</li>
                <li><strong>Restocker lors de remboursement</strong> : Met à jour les stocks lors d'un remboursement</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Fonctionnement :</strong> Lorsqu'une commande est passée sur la marketplace, 
                  elle est automatiquement créée sur Square POS. Les stocks sont mis à jour des deux côtés.
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
                  Qu'est-ce que Square POS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Square POS est une application mobile gratuite qui permet aux commerçants d'accepter les paiements 
                  par carte de crédit. C'est une solution populaire pour les commerces physiques.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels types de produits peuvent être importés depuis Square ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Seuls les produits "simples" et "variables" peuvent être importés. Les produits avec plusieurs 
                  options de variation sont supportés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne l'auto-synchronisation ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si l'option "Auto-synchronisation des nouveaux produits" est activée, tous les nouveaux produits 
                  créés sur Square sont automatiquement importés sur la marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les stocks sont-ils synchronisés en temps réel ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, grâce aux webhooks configurés, les mises à jour de stocks sur Square sont synchronisées 
                  en temps réel avec la marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs doivent-ils créer une application Square ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, l'administrateur crée l'application Square et fournit les identifiants. Les vendeurs 
                  n'ont qu'à se connecter à leur compte Square pour autoriser l'accès.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment synchroniser les commandes Square ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Activez l'option "Synchroniser les commandes" dans la configuration du connecteur. 
                  Les commandes passées sur la marketplace seront automatiquement créées sur Square.
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
              et l'optimisation de votre connecteur Square.
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
                📚 Documentation Connecteur Square
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
