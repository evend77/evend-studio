import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurEtsyGuide() {
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
    etsyOrange: '#f1641e',
    etsyLight: '#fee8e0'
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
          background: `linear-gradient(135deg, ${styles.etsyOrange} 0%, ${styles.accent} 100%)`,
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
            🧵🎨
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
            Guide d'utilisation - Connecteur Etsy
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs Etsy avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🧵 Etsy vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🎨 Produits artisanaux</span>
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
              'Authentification vendeur',
              'Synchronisation des stocks',
              'Mapping des tags',
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
              L'add-on <strong>Connecteur Etsy</strong> permet aux vendeurs de synchroniser les produits de leur boutique 
              Etsy avec votre marketplace Shopify. Idéal pour les vendeurs d'articles faits main, vintage ou de créations 
              artisanales, cette intégration facilite la gestion multi-plateforme.
            </p>
            <div style={{
              background: styles.etsyLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.etsyOrange}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs doivent créer une application sur leur compte Etsy 
                pour obtenir les identifiants API nécessaires à la synchronisation.
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
                <li>Frais supplémentaires de <strong>25$ USD par mois</strong> pour l'add-on Connecteur Etsy</li>
                <li>Les vendeurs doivent avoir une boutique Etsy avec des produits physiques (non numériques)</li>
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
                Recherchez "Connecteur Etsy" et cliquez sur le bouton <strong>Activer</strong>.
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
                Un nouveau menu <strong>Configuration Etsy</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord pour les vendeurs.
              </p>
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
                <li><strong>Produits physiques uniquement</strong> : Seuls les produits physiques sont importés (pas de produits numériques)</li>
                <li><strong>Maximum 100 variantes</strong> : Les variations de produits doivent être ≤ 100</li>
                <li><strong>Maximum 3 options</strong> : Le nombre d'options de variation doit être ≤ 3</li>
                <li><strong>Pas de mise à jour automatique</strong> : Les produits importés ne sont pas mis à jour automatiquement</li>
                <li><strong>Limite d'import des commandes</strong> : 100 commandes par statut, le reste par ID de reçu</li>
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
                <li>Sélectionnez <strong>Connecteur Etsy</strong> dans le menu déroulant</li>
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
                Gestion des taxes
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration du connecteur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Appliquer les taxes de Shopify</strong> : Les taxes sont calculées selon votre boutique</li>
                <li><strong>Appliquer les taxes d'Etsy</strong> : Les taxes sont calculées selon la boutique Etsy</li>
                <li><strong>Ne pas appliquer de taxes</strong> : Aucune taxe n'est appliquée</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Authentification vendeur */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Authentification du vendeur Etsy
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
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration Etsy</strong></li>
                <li>Cliquez sur <strong>Authentifier votre application</strong></li>
                <li>Une nouvelle page s'ouvre, sélectionnez <strong>Authentifier l'application Multivendor-Etsy Connector</strong></li>
                <li>Connectez-vous à votre compte Etsy (Handmade Marketplace)</li>
                <li>Complétez l'authentification</li>
                <li>Vous êtes automatiquement redirigé vers l'espace vendeur</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.etsyLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Une fois authentifié, l'application est prête à synchroniser les produits et commandes.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Synchronisation des stocks */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Synchronisation des stocks
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Planification automatique</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent définir trois créneaux horaires pour la synchronisation automatique des stocks :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Choisissez les heures de synchronisation</li>
                    <li>Les stocks sont mis à jour automatiquement</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Synchronisation manuelle</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent également synchroniser manuellement leurs stocks :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Cliquez sur <strong>Synchroniser les stocks en masse</strong></li>
                    <li>Tous les produits sont mis à jour immédiatement</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Mapping des tags */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏷️ Mapping des tags
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
                Les vendeurs peuvent mapper leurs tags Etsy avec les tags de la marketplace :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration Etsy</strong></li>
                <li>Cliquez sur <strong>Mapping des tags</strong></li>
                <li>Sélectionnez le tag de la marketplace à associer au tag Etsy</li>
                <li>Enregistrez</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Les vendeurs peuvent également supprimer ou désactiver les tags mappés.
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
              📦 Import de produits depuis Etsy
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Méthode 1 : Par ID de listing
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent importer des produits en utilisant les ID de listing Etsy :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Entrez un ID unique ou plusieurs IDs séparés par des virgules</li>
                <li>Cliquez sur <strong>Importer</strong></li>
                <li>Les produits sont importés avec un statut "en attente d'approbation"</li>
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
                Méthode 2 : Par fichier CSV
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour un import en masse :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Téléchargez le fichier CSV exemple</li>
                <li>Ajoutez les ID de listing dans le fichier</li>
                <li>Téléchargez le fichier CSV</li>
                <li>Cliquez sur <strong>Importer</strong></li>
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
                    <li>La commande est automatiquement créée sur Etsy</li>
                    <li>Les stocks sont mis à jour des deux côtés</li>
                    <li>Le vendeur reçoit une notification</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🧵</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Commande sur Etsy</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent importer les commandes Etsy :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Par statut de commande</strong> : Jusqu'à 100 commandes par statut</li>
                    <li><strong>Par ID de reçu</strong> : IDs séparés par des virgules ou fichier CSV</li>
                  </ul>
                </div>
              </div>
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
                background: styles.etsyLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Augmenter les prix de 15% pour couvrir les frais de commission.
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
                  Quels types de produits peuvent être importés depuis Etsy ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Seuls les produits physiques peuvent être importés. Les produits numériques, les services 
                  et les produits virtuels ne sont pas supportés.
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
                  Les produits sont-ils mis à jour automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les produits importés ne sont pas mis à jour automatiquement. Les vendeurs doivent 
                  importer à nouveau les produits pour mettre à jour les informations.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment importer les commandes depuis Etsy ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Deux méthodes : par statut de commande (jusqu'à 100 commandes) ou par ID de reçu (en CSV). 
                  Les vendeurs peuvent choisir la méthode la plus adaptée.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si un produit est refusé par l'administrateur ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le produit n'apparaît pas sur la marketplace. Le vendeur reçoit la raison du refus 
                  et peut corriger les problèmes avant de réimporter.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les taxes sont-elles gérées automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, l'administrateur peut choisir d'appliquer les taxes de Shopify, celles d'Etsy, 
                  ou de ne pas appliquer de taxes du tout.
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
              et l'optimisation de votre connecteur Etsy.
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
                📚 Documentation Connecteur Etsy
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
