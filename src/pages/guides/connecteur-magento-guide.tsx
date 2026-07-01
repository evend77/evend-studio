import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurMagentoGuide() {
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
    magentoBlue: '#f26322',
    magentoLight: '#feefe8'
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
          background: `linear-gradient(135deg, ${styles.magentoBlue} 0%, ${styles.accent} 100%)`,
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
            🔄⚡
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
            Guide d'utilisation - Connecteur Magento
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs Magento avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Magento vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Synchronisation automatique</span>
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
              'Limitations',
              'Configuration administrateur',
              'Installation du module Magento',
              'Configuration vendeur',
              'Génération du jeton d\'accès',
              'Import de produits',
              'Gestion des commandes',
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
              L'add-on <strong>Connecteur Magento</strong> permet aux vendeurs de synchroniser les produits de leur boutique 
              Magento avec votre marketplace Shopify. Cette intégration facilite la gestion multi-plateforme avec 
              synchronisation automatique des produits, des stocks et des commandes.
            </p>
            <div style={{
              background: styles.magentoLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.magentoBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Le connecteur est disponible pour Magento 2. Les vendeurs doivent installer 
                un module fourni sur leur boutique Magento pour établir la connexion.
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
                <li>Frais supplémentaires de <strong>25$ USD par mois</strong> pour l'add-on Connecteur Magento</li>
                <li>Les vendeurs doivent avoir une boutique Magento 2</li>
                <li>Les vendeurs doivent pouvoir installer un module sur leur boutique Magento</li>
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
                Recherchez "Connecteur Magento" et cliquez sur le bouton <strong>Activer</strong>.
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
                Récupérer les informations pour les vendeurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Instructions pour la marketplace</strong>.
                Vous y trouverez :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li><strong>URL de livraison</strong> : À partager avec les vendeurs</li>
                <li><strong>SID</strong> : Identifiant unique à partager</li>
                <li><strong>Module Magento</strong> : À télécharger et à partager</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Limitations */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚠️ Limitations importantes
            </h2>
            
            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.red}`
            }}>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Types de produits supportés</strong> : Uniquement les produits "Simple" et "Configurable" actifs</li>
                <li><strong>Maximum 100 variantes</strong> : Les variations de produits doivent être ≤ 100</li>
                <li><strong>Maximum 3 options</strong> : Le nombre d'options de variation doit être ≤ 3</li>
                <li><strong>Import limité</strong> : Maximum 250 produits par import</li>
                <li><strong>Taxes non synchronisées</strong> : Les taxes de vente ne sont pas synchronisées</li>
                <li>Si un produit change de type (autre que Simple ou Configurable), il sera désactivé sur la marketplace</li>
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
                Configuration produit
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration des produits</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Sélectionnez <strong>Connecteur Magento</strong> dans le menu déroulant</li>
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
                Synchronisation des clients
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration du connecteur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Sync Customer Details ON</strong> : Les clients sont créés sur Magento avec toutes les informations</li>
                <li><strong>Sync Customer Details OFF</strong> : Choisissez les informations à synchroniser (adresse, nom, email)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Si vous ne voulez pas envoyer d'email au client, configurez un email factice.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Installation du module Magento */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Installation du module Magento
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
                <li>Téléchargez le module Magento fourni par l'administrateur</li>
                <li>Extrayez le fichier dans le dossier <strong>app/code/</strong> de votre installation Magento</li>
                <li>Exécutez les commandes suivantes dans le terminal :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><code>php bin/magento setup:upgrade</code></li>
                  <li><code>php bin/magento setup:di:compile</code></li>
                  <li><code>php bin/magento cache:flush</code></li>
                </ul>
                <li>Lisez le fichier <strong>Readme.txt</strong> pour plus de détails</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Le module est open source, les vendeurs peuvent le modifier selon leurs besoins.
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
                Saisie des informations
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration Magento</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Auto-synchronisation des nouveaux produits</strong> : Active pour une synchronisation automatique</li>
                <li><strong>URL de la boutique</strong> : L'URL de la boutique Magento (avec http:// ou https://)</li>
                <li><strong>Unité de poids</strong> : Sélectionnez l'unité utilisée sur Magento</li>
                <li><strong>Jeton d'accès</strong> : Collez le jeton généré depuis Magento</li>
                <li><strong>URL de livraison</strong> : Fournie par l'administrateur</li>
                <li><strong>SID</strong> : Fourni par l'administrateur</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.magentoLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> L'URL doit être accessible (http:// ou https://). Vérifiez la connexion.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Génération du jeton d'accès */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Génération du jeton d'accès Magento
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
                <li>Connectez-vous à l'administration Magento</li>
                <li>Allez dans <strong>Système</strong> → <strong>Intégrations</strong></li>
                <li>Cliquez sur <strong>Ajouter une nouvelle intégration</strong></li>
                <li>Remplissez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom de la boutique</li>
                  <li>Email de la boutique</li>
                  <li>Mot de passe</li>
                </ul>
                <li>Enregistrez</li>
                <li>Dans les paramètres de base, allez dans la section API</li>
                <li>Définissez l'accès aux ressources sur <strong>"Tout"</strong></li>
                <li>Activez l'intégration et définissez sur <strong>"Autoriser tout"</strong></li>
                <li>Copiez le <strong>jeton d'accès</strong> généré</li>
                <li>Collez-le dans la configuration de l'espace vendeur</li>
              </ol>
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
              📦 Import de produits depuis Magento
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Import automatique
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Si <strong>Auto-synchronisation</strong> est activée :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Les produits créés sur Magento sont automatiquement importés</li>
                <li>Ils apparaissent en statut "En attente d'approbation"</li>
                <li>Les mises à jour de produits sont automatiquement synchronisées</li>
                <li>Les suppressions sont également synchronisées</li>
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
                Import manuel (jusqu'à 250 produits)
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent importer des produits spécifiques :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Méthode 1 : Par SKU</strong> - Entrez un SKU ou plusieurs SKU séparés par des virgules</li>
                <li><strong>Méthode 2 : Par fichier CSV</strong> - Téléchargez un fichier CSV contenant les SKU</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Maximum 250 produits peuvent être importés en une seule fois.
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

          {/* Section 10: Gestion des commandes */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Gestion des commandes
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Commande sur la marketplace</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Lorsqu'une commande est passée sur la marketplace :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>La commande est automatiquement créée sur Magento</li>
                    <li>Les stocks sont mis à jour des deux côtés</li>
                    <li>Un numéro de commande de référence est visible sur Magento</li>
                    <li><strong>Note :</strong> Le montant sur Magento est hors taxes (les taxes Shopify ne sont pas synchronisées)</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Commande sur Magento</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Lorsqu'une commande est passée sur Magento :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Les stocks sont mis à jour sur la marketplace</li>
                    <li>Les quantités sont ajustées automatiquement</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.magentoLight,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>
                💡 <strong>Note :</strong> Les commandes créées sur Magento ne sont pas importées comme commandes dans Shopify, 
                seuls les stocks sont mis à jour.
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
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Diminuer les prix de 10% pour rester compétitif sur la marketplace.
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
                  Quels types de produits peuvent être importés depuis Magento ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Seuls les produits "Simple" et "Configurable" actifs peuvent être importés. 
                  Les produits virtuels, téléchargeables ou groupés ne sont pas supportés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien de variantes puis-je importer ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Maximum 100 variantes par produit et 3 options de variation (couleur, taille, etc.). 
                  C'est une limitation de Shopify.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si un produit change de type sur Magento ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si le type de produit change (ex: de Simple à Virtual), le produit sera automatiquement désactivé 
                  sur la marketplace. Il faudra le réimporter si nécessaire.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les taxes sont-elles synchronisées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les taxes de vente ne sont pas synchronisées. Le montant affiché sur Magento est hors taxes.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien de produits puis-je importer en une fois ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Maximum 250 produits par import via la méthode manuelle. L'auto-synchronisation n'a pas cette limite.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment sont gérées les suppressions de produits ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si un produit est supprimé sur Magento, il est automatiquement supprimé de la marketplace.
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
              et l'optimisation de votre connecteur Magento.
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
                📚 Documentation Connecteur Magento
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
