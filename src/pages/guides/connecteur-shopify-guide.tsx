import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurShopifyGuide() {
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
    shopifyGreen: '#5e8e3e',
    shopifyLight: '#e8f5e4'
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
          background: `linear-gradient(135deg, ${styles.shopifyGreen} 0%, ${styles.accent} 100%)`,
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
            🔄🛍️
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
            Guide d'utilisation - Connecteur boutique Shopify
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs Shopify avec votre marketplace
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Import de produits</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Gestion des stocks</span>
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
              'Création d\'une application personnalisée',
              'Configuration vendeur',
              'Configuration administrateur',
              'Import de produits',
              'Synchronisation des commandes',
              'Mapping des données',
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
              L'add-on <strong>Connecteur boutique Shopify</strong> permet aux vendeurs de synchroniser les produits 
              de leur propre boutique Shopify avec votre marketplace. Les vendeurs peuvent importer leurs produits, 
              et les stocks sont automatiquement mis à jour des deux côtés. Les commandes sont également synchronisées 
              pour une gestion simplifiée.
            </p>
            <div style={{
              background: styles.shopifyLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.shopifyGreen}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs doivent créer une application personnalisée sur leur boutique Shopify 
                pour que la synchronisation fonctionne. Les stocks et les commandes sont synchronisés automatiquement.
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
                <li>Frais supplémentaires de <strong>40$ USD par mois</strong> pour l'add-on Connecteur boutique Shopify</li>
                <li>Les vendeurs doivent avoir leur propre boutique Shopify</li>
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
                Recherchez "Connecteur boutique Shopify" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de 40$ USD et approuvez le paiement dans Shopify Backend.
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
                Un nouveau menu <strong>Configuration de l'application vendeur</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord.
              </p>
            </div>
          </section>

          {/* Section 4: Création d'une application personnalisée */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Création d'une application personnalisée (vendeur)
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
                <li>Connectez-vous à <strong>https://dev.shopify.com</strong> avec le compte de la boutique vendeur</li>
                <li>Cliquez sur <strong>Créer une application</strong></li>
                <li>Donnez un nom à l'application et cliquez sur <strong>Créer</strong></li>
                <li>Remplissez les informations dans la page "Créer une version"</li>
                <li>Dans la section URLs, copiez l'URL depuis l'espace vendeur :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Allez dans <strong>Configuration</strong> → <strong>Configuration de synchronisation vendeur</strong></li>
                  <li>Copiez l'<strong>URL de l'application</strong></li>
                  <li>Collez-la dans les champs "App URL" et "Preferences URL"</li>
                </ul>
                <li>Décochez <strong>Intégrer l'application dans l'admin Shopify</strong></li>
                <li>Copiez l'<strong>Autre URL</strong> depuis la configuration vendeur et collez-la dans "Redirect URL" (séparée par une virgule)</li>
                <li>Ajoutez les permissions requises dans le bloc "Scope" :</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#1a2332',
                borderRadius: '12px'
              }}>
                <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                  write_assigned_fulfillment_orders,read_assigned_fulfillment_orders,read_fulfillments,write_fulfillments,read_inventory,write_inventory,read_locations,read_orders,write_orders,read_products,write_products,read_markets_home,read_customers,write_customers
                </code>
              </div>
              <ol start={9} style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px', marginTop: '12px' }}>
                <li>Cliquez sur <strong>Publier</strong> et confirmez</li>
                <li>Copiez le <strong>Client ID</strong> et la <strong>Clé secrète</strong> depuis les identifiants</li>
              </ol>
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
                Saisie des identifiants
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration de synchronisation vendeur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Clé API</strong> : Collez le Client ID</li>
                <li><strong>Clé secrète</strong> : Collez la Secret Key</li>
                <li><strong>URL de la boutique</strong> : URL de la boutique Shopify du vendeur</li>
              </ul>
              <p style={{ color: styles.textLight, marginTop: '16px' }}>
                Cliquez sur <strong>Enregistrer et installer</strong>. Vous serez redirigé vers la boutique Shopify pour confirmer l'installation.
              </p>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Options de synchronisation
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Conversion de devise</strong> : Définir le taux de change si la devise diffère</li>
                <li><strong>Règle de prix</strong> : Augmenter ou diminuer les prix (fixe ou pourcentage)</li>
                <li><strong>Webhooks</strong> : Enregistrer les webhooks pour la synchronisation automatique</li>
                <li><strong>Localisation</strong> : Choisir l'emplacement pour la synchronisation des stocks</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Configuration administrateur */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
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
                Options disponibles
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration de l'application vendeur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Synchroniser les commandes</strong> : Activer/désactiver la synchronisation des commandes</li>
                <li><strong>Synchroniser uniquement les commandes payées</strong> : Ne synchroniser que les commandes payées</li>
                <li><strong>Synchroniser les détails client</strong> : Inclure les informations client dans la synchronisation</li>
                <li><strong>Synchroniser les remboursements</strong> : Synchroniser les remboursements dans les deux sens</li>
                <li><strong>Restreindre le nombre d'images</strong> : Limiter le nombre d'images par produit (1-20)</li>
                <li><strong>Importer les meta-champs</strong> : Importer les meta-champs des produits</li>
                <li><strong>Suivre l'inventaire</strong> : Synchroniser le statut de suivi d'inventaire</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Import de produits */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Import de produits
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
                Les vendeurs peuvent importer leurs produits via trois méthodes :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Par plage de dates</strong> : Importer les produits créés/modifiés entre deux dates</li>
                <li><strong>Par IDs de produits</strong> : IDs séparés par des virgules</li>
                <li><strong>Par identifiants de produits</strong> : Import par handle de produit</li>
              </ul>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Mise à jour des produits
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Si l'auto-synchronisation est désactivée, les vendeurs peuvent :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Voir la liste des produits non synchronisés</li>
                <li>Mettre à jour tous les produits en un clic</li>
                <li>Mettre à jour les produits individuellement</li>
              </ul>
            </div>
          </section>

          {/* Section 8: Synchronisation des commandes */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Synchronisation des commandes
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Commande sur la marketplace</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    <strong>Sync Order activé :</strong> La commande est créée sur la boutique du vendeur, 
                    les stocks sont mis à jour automatiquement.
                  </p>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    <strong>Sync Order désactivé :</strong> Seuls les stocks sont mis à jour, 
                    la commande n'est pas créée sur la boutique du vendeur.
                  </p>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Commande sur la boutique vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les stocks sont automatiquement mis à jour sur la marketplace.
                    Les commandes ne sont pas synchronisées de la boutique vendeur vers la marketplace.
                  </p>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Synchronisation manuelle</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Si une commande n'est pas synchronisée automatiquement, les vendeurs peuvent :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Aller dans <strong>Commandes</strong> → <strong>Voir</strong></li>
                    <li>Cliquer sur <strong>Plus d'actions</strong> → <strong>Synchroniser la commande</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: Mapping des données */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🗺️ Mapping des données
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mapping des collections</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent mapper leurs collections avec celles de la marketplace.
                    Les produits importés seront automatiquement assignés à la collection correspondante.
                  </p>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏷️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mapping des tags</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les tags peuvent être mappés individuellement ou via un fichier CSV.
                    L'administrateur peut restreindre les tags par vendeur.
                  </p>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔖</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mapping des types de produits</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent mapper leurs types de produits avec ceux de la marketplace,
                    assurant une classification cohérente.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.shopifyLight,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>
                💡 <strong>Mapping des produits :</strong> Les vendeurs peuvent mapper manuellement ou automatiquement leurs produits 
                via SKU ou nom d'option. Une fois mappés, les variants sont automatiquement synchronisés.
              </p>
            </div>
          </section>

          {/* Section 10: FAQ */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
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
                  Les vendeurs doivent-ils avoir un compte développeur Shopify ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les vendeurs doivent créer une application personnalisée via le portail développeur Shopify 
                  (dev.shopify.com) pour obtenir les identifiants nécessaires à la synchronisation.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les stocks sont-ils synchronisés en temps réel ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, lorsqu'une commande est passée sur la marketplace, les stocks sont automatiquement mis à jour 
                  sur la boutique du vendeur et vice-versa. La synchronisation est quasi-instantanée.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire si un produit n'est pas synchronisé ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent synchroniser manuellement depuis la section Produits en cliquant sur 
                  "Synchroniser" à côté du produit concerné. Vérifiez également que l'application est correctement installée.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les devises différentes sont-elles gérées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les vendeurs peuvent définir un taux de conversion dans leur configuration. 
                  Les prix sont automatiquement convertis selon le taux spécifié.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la règle de prix ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent appliquer une règle pour augmenter ou diminuer leurs prix lors de l'import. 
                  La modification peut être en montant fixe ou en pourcentage.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les collections intelligentes sont-elles supportées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les collections intelligentes peuvent être importées depuis la boutique Shopify du vendeur 
                  et synchronisées avec la marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: Support */}
          <section id="section-10" style={{
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
              et l'optimisation de votre connecteur boutique Shopify.
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
                📚 Documentation Connecteur Shopify
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
