import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurWooCommerceGuide() {
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
    wooCommerce: '#7f54b3',
    wooLight: '#f3eef9'
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
          background: `linear-gradient(135deg, ${styles.wooCommerce} 0%, ${styles.accent} 100%)`,
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
            🔄🐘
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
            Guide d'utilisation - Connecteur WooCommerce
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs WooCommerce avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🐘 WooCommerce vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Import en masse</span>
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
              'Critères d\'éligibilité',
              'Configuration administrateur',
              'Obtention des clés API',
              'Configuration vendeur',
              'Mapping des données',
              'Webhooks',
              'Import de produits',
              'Règles de prix',
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
              L'add-on <strong>Connecteur WooCommerce</strong> permet aux vendeurs de synchroniser les produits de leur 
              boutique WooCommerce avec votre marketplace Shopify. Les vendeurs peuvent importer leurs produits 
              en masse, et les stocks sont automatiquement mis à jour des deux côtés.
            </p>
            <div style={{
              background: styles.wooLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.wooCommerce}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs doivent avoir une boutique WooCommerce. Les produits importés 
                sont d'abord en attente d'approbation par l'administrateur avant d'être mis en vente.
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
                <li>Frais supplémentaires de <strong>25$ USD par mois</strong> pour l'add-on Connecteur WooCommerce</li>
                <li>Les vendeurs doivent avoir une boutique WooCommerce</li>
                <li>L'URL de la boutique WooCommerce doit être accessible (code 200/201 OK)</li>
              </ul>
            </div>

            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.red}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚠️ <strong>Adresses IP à autoriser :</strong> Les vendeurs doivent whitelister ces IPs :
                <br />54.255.33.47, 18.138.8.137, 47.129.250.24, 54.179.1.53, 18.136.7.41, 13.229.6.57, 18.138.9.81, 52.74.127.6, 13.228.91.147, 13.250.79.108, 13.229.100.249, 52.220.12.7, 3.1.34.177
              </p>
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
                Recherchez "Connecteur WooCommerce" et cliquez sur le bouton <strong>Activer</strong>.
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
                Un nouveau menu <strong>Configuration WooCommerce</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord.
              </p>
            </div>
          </section>

          {/* Section 4: Critères d'éligibilité */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ✅ Critères d'éligibilité pour l'import
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Le produit doit être <strong>publié</strong> sur la boutique WooCommerce</li>
                <li>Le produit doit être de type <strong>"simple" ou "variable"</strong></li>
                <li>Maximum <strong>3 attributs/options</strong> par produit (limite Shopify)</li>
                <li>Maximum <strong>100 variantes</strong> par produit (limite Shopify)</li>
                <li>Le produit ne doit pas être <strong>"téléchargeable" ou "virtuel"</strong></li>
                <li>Le produit doit être <strong>achetable</strong> (quantité ou prix défini)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.wooLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le nombre d'attributs du produit WooCommerce doit correspondre au nombre 
                  d'attributs de ses variantes, sinon la synchronisation échouera.
                </p>
              </div>
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
                Configuration produit
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration des produits</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Sélectionnez <strong>Connecteur WooCommerce</strong> dans le menu déroulant</li>
                <li><strong>Auto-approbation des produits</strong> : Active pour approuver automatiquement les produits importés</li>
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
                Synchronisation des commandes
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration du connecteur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Synchroniser les commandes</strong> : Active pour créer les commandes sur la boutique WooCommerce</li>
                <li><strong>Synchroniser les données client</strong> : Inclut les informations client</li>
                <li><strong>Restocker lors de remboursement</strong> : Met à jour les stocks lors d'un remboursement</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Obtention des clés API */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des clés API WooCommerce
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
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à l'administration WordPress du vendeur</li>
                <li>Allez dans <strong>WooCommerce</strong> → <strong>Paramètres</strong></li>
                <li>Cliquez sur l'onglet <strong>Avancé</strong> → <strong>API REST</strong></li>
                <li>Cliquez sur <strong>Ajouter une clé</strong></li>
                <li>Donnez un nom à la clé et sélectionnez les permissions (Lecture/Écriture)</li>
                <li>Cliquez sur <strong>Générer la clé API</strong></li>
                <li>Copiez la <strong>Clé API</strong> et la <strong>Clé secrète</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Les vendeurs peuvent également configurer un code ISO de langue 
                  (ex: "en" pour anglais, "fr" pour français, ou "all" pour multilingue).
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
                Saisie des identifiants
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration WooCommerce</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>URL de la boutique WooCommerce</strong> : L'adresse de la boutique du vendeur</li>
                <li><strong>Unité de poids</strong> : kg, g, lb, etc.</li>
                <li><strong>Clé API</strong> : La clé générée</li>
                <li><strong>Clé secrète</strong> : La clé secrète générée</li>
                <li><strong>Code ISO de langue</strong> : "en", "fr", "all", etc.</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.wooLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les URL de livraison WooCommerce sont automatiquement générées 
                  après la saisie des identifiants.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Mapping des données */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mapping des catégories</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent mapper leurs catégories WooCommerce avec les collections de la marketplace.
                    <strong>Note :</strong> Fonctionne uniquement avec les collections manuelles, pas les collections automatisées.
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
                    Les vendeurs peuvent mapper leurs tags WooCommerce avec les tags de la marketplace.
                    C'est un mapping un-à-plusieurs.
                  </p>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔖</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mapping des types</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent mapper leurs types de produits WooCommerce avec ceux de la marketplace.
                  </p>
                </div>
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
              🔌 Configuration des webhooks
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Ajout de webhooks
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour que les mises à jour soient automatiquement synchronisées, les vendeurs doivent configurer des webhooks :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>WooCommerce</strong> → <strong>Paramètres</strong> → <strong>Avancé</strong> → <strong>Webhooks</strong></li>
                <li>Cliquez sur <strong>Ajouter un webhook</strong></li>
                <li>Configurez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Nom</strong> : Donnez un nom au webhook</li>
                  <li><strong>Statut</strong> : Actif</li>
                  <li><strong>Sujet</strong> : Produit créé, Produit mis à jour, Produit supprimé, Commande créée</li>
                  <li><strong>URL de livraison</strong> : URL fournie dans la configuration vendeur</li>
                </ul>
                <li>Enregistrez</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les webhooks permettent de synchroniser automatiquement les commandes, 
                  les créations, modifications et suppressions de produits.
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
              📦 Import de produits
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Trois méthodes d'import
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après la configuration, les vendeurs peuvent importer leurs produits via :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Par plage de dates</strong> : Sélectionnez une période pour importer les produits créés entre ces dates</li>
                <li><strong>Par IDs de produits</strong> : Entrez les IDs séparés par des virgules</li>
                <li><strong>Par slug de produit</strong> : Entrez le slug (équivalent du handle Shopify)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.wooLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les produits importés sont d'abord en attente. L'administrateur doit les approuver 
                  avant qu'ils soient visibles sur la marketplace.
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
                Gestion des produits
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                <strong>Administrateur :</strong> Peut approuver ou refuser les produits importés (avec motif de refus)
              </p>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                <strong>Vendeur :</strong> Peut voir le statut de ses produits (en attente, approuvé, refusé)
              </p>
            </div>
          </section>

          {/* Section 11: Règles de prix */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
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
                Les vendeurs peuvent créer des règles de prix pour ajuster leurs prix lors de l'import :
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
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Augmenter les prix de 10% pour couvrir les frais de commission.
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
                  Quels types de produits peuvent être importés ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Seuls les produits "simples" et "variables" publiés, non téléchargeables, non virtuels, 
                  avec au maximum 3 attributs et 100 variantes peuvent être importés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment les commandes sont-elles synchronisées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si la synchronisation des commandes est activée, chaque commande passée sur la marketplace 
                  crée automatiquement une commande sur la boutique WooCommerce du vendeur. Les stocks sont mis à jour.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire si un produit n'est pas importé correctement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vérifiez que le produit remplit tous les critères d'éligibilité. Assurez-vous également 
                  que les adresses IP sont whitelistées et que l'URL de la boutique est accessible.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les webhooks sont-ils obligatoires ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les webhooks sont essentiels pour la synchronisation automatique des commandes, 
                  des créations, modifications et suppressions de produits.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les produits importés sont-ils automatiquement approuvés ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, par défaut les produits sont en attente d'approbation. L'administrateur peut activer 
                  l'auto-approbation dans la configuration des produits.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la règle de prix ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent augmenter ou diminuer leurs prix par un montant fixe ou un pourcentage. 
                  La règle peut s'appliquer aux nouveaux produits ou aussi aux produits déjà synchronisés.
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
              et l'optimisation de votre connecteur WooCommerce.
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
                📚 Documentation Connecteur WooCommerce
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
