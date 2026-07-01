import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurAmazonGuide() {
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
    amazonOrange: '#ff9900',
    amazonBlue: '#146eb4',
    amazonLight: '#fff3e0'
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
        
        {/* En-tête avec dégradé orange/bleu Amazon */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.amazonOrange} 0%, ${styles.amazonBlue} 100%)`,
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
            🛍️🔄
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
            Guide d'utilisation - Connecteur Amazon
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs Amazon avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🛍️ Amazon vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Import par rapports</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Conversion de devises</span>
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
              'Configuration vendeur',
              'Obtention des identifiants API Amazon',
              'Import des rapports Amazon',
              'Création des produits',
              'Mise à jour des produits',
              'Règles de prix',
              'Conversion de devises',
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
              L'add-on <strong>Connecteur Amazon</strong> permet aux vendeurs possédant une boutique Amazon de synchroniser 
              leurs produits avec votre marketplace Shopify. Les vendeurs peuvent importer leurs produits via des rapports 
              et les créer/mettre à jour en masse sur la marketplace.
            </p>
            <div style={{
              background: styles.amazonLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.amazonOrange}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs peuvent importer leurs produits Amazon via des rapports, 
                synchroniser manuellement les modifications, et bénéficier de fonctionnalités avancées comme la conversion 
                de devises et les règles de prix.
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
                <li>Frais supplémentaires selon le plan choisi : <strong>10$ - 200$ USD par mois</strong> pour l'add-on Connecteur Amazon</li>
                <li>Les vendeurs doivent avoir un compte <strong>Amazon Seller Central</strong> actif</li>
                <li>Les vendeurs doivent créer une application sur le portail développeur Amazon</li>
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
                Recherchez "Connecteur Amazon" et cliquez sur le bouton <strong>Activer</strong>.
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
                Sélectionnez le plan qui correspond à vos besoins (de 10$ à 200$ USD par mois) et autorisez les frais supplémentaires.
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
                Un nouveau menu <strong>Configuration Amazon</strong> apparaît dans la section 
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
                le connecteur Amazon.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Détails des produits à synchroniser</strong> : Sélectionnez les informations que les vendeurs peuvent synchroniser :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom du produit</li>
                  <li>Prix</li>
                  <li>Stock</li>
                  <li>Images</li>
                  <li>Description</li>
                </ul>
                <li><strong>Taxes</strong> : Choisissez comment gérer les taxes :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Taxes comme configurées sur la boutique Shopify</li>
                  <li>Taxes comme configurées sur Amazon</li>
                  <li>Ne pas facturer de taxes</li>
                </ul>
              </ul>
            </div>
          </section>

          {/* Section 5: Configuration vendeur */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
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
                Saisie des informations Amazon
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration Amazon</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Client Identifier (App ID)</strong> : L'identifiant de l'application créée sur Amazon</li>
                <li><strong>Client Secret</strong> : Le secret de l'application généré par Amazon</li>
                <li><strong>Région</strong> : La région du marketplace Amazon (Europe, Amérique du Nord, Extrême-Orient)</li>
                <li><strong>Marketplace</strong> : Le pays du marketplace Amazon (ex: France, USA, Japon)</li>
                <li><strong>Unité de poids</strong> : L'unité de poids utilisée sur Amazon</li>
                <li><strong>Devise</strong> : La devise utilisée sur Amazon</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Obtention des identifiants API Amazon */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des identifiants API Amazon
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
                <li>Connectez-vous à <strong>Amazon Seller Central</strong></li>
                <li>Allez dans le menu <strong>Partner Network</strong> → <strong>Develop Apps</strong></li>
                <li>Cliquez sur <strong>+ Add New App Client</strong></li>
                <li>Ajoutez une nouvelle application client</li>
                <li>Fournissez les permissions requises pour l'application</li>
                <li>Une fois l'application créée, vous obtiendrez un <strong>App ID</strong></li>
                <li>Cliquez sur <strong>Edit App</strong> pour obtenir :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Client Identifier</strong></li>
                  <li><strong>Client Secret</strong></li>
                </ul>
                <li>Copiez ces informations dans la configuration Amazon de votre espace vendeur</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Conservez précieusement le Client Identifier et le Client Secret. 
                  Ils sont nécessaires pour établir la connexion entre votre boutique et Amazon.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Import des rapports Amazon */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📊 Import des rapports Amazon
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Import via rapports
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Amazon fournit des rapports permettant d'importer les produits. Les vendeurs peuvent importer ces rapports :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans l'espace vendeur, allez dans <strong>Configuration Amazon</strong></li>
                <li>Cliquez sur <strong>Importer les rapports</strong> (Import Reports)</li>
                <li>Sélectionnez la <strong>période</strong> pour laquelle vous souhaitez importer les produits</li>
                <li>Le rapport est importé dans le tableau de bord vendeur</li>
                <li>Cliquez sur <strong>Voir les rapports</strong> pour consulter la liste des rapports importés</li>
                <li>Utilisez les trois points <strong>"..."</strong> pour un rapport sélectionné et cliquez sur <strong>Voir</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.amazonLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les rapports Amazon contiennent toutes les informations des produits 
                  que vous avez sélectionnés pour l'import.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Création des produits */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Création des produits
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Création individuelle ou en masse
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois le rapport importé, les vendeurs peuvent créer les produits :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Création individuelle</strong> : Cliquez sur <strong>Créer un produit</strong> pour chaque produit du rapport</li>
                <li><strong>Création en masse</strong> : Sélectionnez plusieurs produits et utilisez l'option <strong>Action groupée</strong></li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les produits créés apparaissent dans le tableau de bord administrateur 
                  où l'administrateur peut les activer.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Mise à jour des produits */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Mise à jour des produits
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Synchronisation manuelle
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois les produits créés, les vendeurs peuvent synchroniser manuellement les modifications 
                effectuées sur Amazon :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Dans la liste des produits, cliquez sur l'option <strong>Mettre à jour</strong></li>
                <li>Les changements effectués sur Amazon Seller Central sont synchronisés avec la marketplace</li>
                <li>Le prix, le stock, les images et la description sont mis à jour</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> La synchronisation est manuelle. Les vendeurs doivent déclencher 
                  la mise à jour lorsqu'ils modifient leurs produits sur Amazon.
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
                <li>Sélectionnez <strong>Seller Sync App</strong> dans le menu déroulant</li>
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
                background: styles.amazonLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Augmenter les prix de 5% pour couvrir les frais de marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: Conversion de devises */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💱 Conversion de devises
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration du taux de change
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Si la devise de la boutique Amazon du vendeur est différente de celle de votre marketplace, 
                les vendeurs peuvent spécifier un taux de change :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Règle de prix du connecteur</strong></li>
                <li>Sélectionnez <strong>Seller Sync App</strong> dans le menu déroulant</li>
                <li>Dans la section <strong>Conversion de devises</strong>, spécifiez le taux de change</li>
                <li>Le prix des produits est automatiquement calculé lors des commandes</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> La conversion de devises s'applique automatiquement lorsqu'un client 
                  passe une commande sur votre marketplace.
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
                  Comment fonctionne l'import des produits Amazon ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs importent des rapports depuis Amazon Seller Central. Ces rapports contiennent les produits 
                  qu'ils souhaitent synchroniser. Ils peuvent ensuite créer les produits individuellement ou en masse.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels sont les tarifs du connecteur Amazon ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le connecteur Amazon est proposé avec différents plans allant de <strong>10$ à 200$ USD par mois</strong>, 
                  en fonction du volume de produits et des fonctionnalités nécessaires.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les produits sont-ils mis à jour automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, la synchronisation est manuelle. Les vendeurs doivent utiliser l'option <strong>Mettre à jour</strong> 
                  pour synchroniser les modifications effectuées sur Amazon.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir les identifiants API Amazon ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Connectez-vous à Amazon Seller Central, allez dans Partner Network → Develop Apps, créez une application, 
                  et récupérez le Client Identifier et Client Secret.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment gérer les différences de devises ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent configurer un taux de change dans la section Conversion de devises. 
                  Le prix des produits est automatiquement converti lors des commandes.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les taxes sont-elles gérées automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut choisir dans la configuration du connecteur comment gérer les taxes : 
                  utiliser les taxes Shopify, les taxes Amazon, ou ne pas facturer de taxes.
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
              et l'optimisation de votre connecteur Amazon.
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
                📚 Documentation Connecteur Amazon
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
