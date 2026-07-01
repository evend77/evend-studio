import React from 'react';
import { Link } from 'react-router-dom';

export default function InventaireMultiEmplacementsGuide() {
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
    inventoryBlue: '#1e40af',
    inventoryGreen: '#2e7d32',
    inventoryLight: '#e8f5e9'
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
        
        {/* En-tête avec dégradé bleu/vert */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.inventoryBlue} 0%, ${styles.inventoryGreen} 100%)`,
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
            📦🏭
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
            Guide d'utilisation - Inventaire multi-emplacements
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Gérez vos stocks sur plusieurs entrepôts et optimisez la livraison
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Multi-entrepôts</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📍 Suivi des stocks</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🚚 Priorité d'expédition</span>
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
              'Gestion des emplacements',
              'Emplacement par défaut des vendeurs',
              'Configuration côté vendeur',
              'Gestion des commandes',
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
              📦 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Inventaire multi-emplacements</strong> permet aux administrateurs et aux vendeurs de gérer 
              les stocks sur plusieurs entrepôts ou points de vente. Vous pouvez suivre les quantités disponibles à chaque 
              emplacement et définir des priorités d'expédition pour optimiser la gestion des commandes.
            </p>
            <div style={{
              background: styles.inventoryLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.inventoryBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'administrateur peut ajouter des emplacements depuis Shopify, puis les synchroniser 
                avec l'application. Les vendeurs peuvent ensuite gérer leur inventaire par emplacement. 
                Compatible avec l'option "Retrait en magasin" (Store Pickup).
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
                <li>Frais supplémentaires pour l'add-on Inventaire multi-emplacements</li>
                <li>Ajout préalable des emplacements dans <strong>Shopify Settings → Locations</strong></li>
                <li>Activation de l'option <strong>"Enable Inventory at Locations"</strong> dans Shopify</li>
              </ul>
            </div>

            <div style={{
              background: styles.warning + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Restrictions importantes
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Non compatible :</strong> Ne fonctionne pas avec le "Custom Fulfillment"</li>
                <li><strong>Emplacement principal :</strong> Vous ne pouvez pas supprimer l'emplacement principal par défaut</li>
                <li><strong>Désactivation :</strong> Si vous désactivez un emplacement, il reste disponible sur Shopify</li>
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
                Ajouter les emplacements dans Shopify
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Avant d'activer l'add-on, ajoutez vos emplacements dans <strong>Shopify Settings → Locations → Add Location</strong>.
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
                Activer l'add-on
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> (Feature Apps) de votre tableau de bord administrateur.
                Recherchez "Multi-inventory Location" et cliquez sur le bouton <strong>Activer</strong>.
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
                Accepter les frais
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Acceptez les frais supplémentaires pour l'add-on et approuvez le paiement dans Shopify Backend.
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
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration multi-emplacements
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après activation, un nouveau menu apparaît : <strong>Configuration</strong> → <strong>Configuration multi-emplacements</strong> 
                (Multilocation Configuration).
              </p>
              
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Change Status</strong> : Activez la fonctionnalité multi-emplacements pour les vendeurs</li>
                <li><strong>Add Shopify Location</strong> : Synchronisez les emplacements Shopify avec l'application</li>
                <li><strong>Multi-location Inventory</strong> : Visualisez tous les emplacements ajoutés</li>
              </ul>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Si vous désactivez l'onglet Multi-location, tous les emplacements par défaut 
                  des vendeurs seront désactivés. Vous ne pouvez pas supprimer l'emplacement principal par défaut.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Gestion des emplacements */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏭 Gestion des emplacements
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Synchronisation et visualisation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans la section <strong>Multi-location Inventory</strong>, vous pouvez :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Visualiser tous les emplacements ajoutés</li>
                <li>Ajouter des emplacements Multi-vendor</li>
                <li>Synchroniser les emplacements Shopify avec l'application</li>
                <li>Définir la <strong>priorité d'expédition</strong> pour chaque emplacement</li>
              </ul>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📍 Gestion des stocks par emplacement
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Lors de l'ajout d'un produit, vous pouvez gérer les quantités par emplacement :
                </p>
                <ol style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong> → <strong>Ajouter un produit</strong></li>
                  <li>Activez <strong>Suivre l'inventaire</strong> (Track Inventory)</li>
                  <li>Cliquez sur <strong>Modifier les emplacements</strong> (Edit Locations)</li>
                  <li>Saisissez les quantités pour chaque emplacement</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Section 6: Emplacement par défaut des vendeurs */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👤 Emplacement par défaut des vendeurs
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration depuis l'édition vendeur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut définir un emplacement par défaut pour chaque vendeur :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Vendeurs</strong> → <strong>Liste des vendeurs</strong></li>
                <li>Cliquez sur <strong>Modifier</strong> dans le menu Action</li>
                <li>Descendez jusqu'à la section <strong>Emplacement par défaut du vendeur</strong></li>
                <li>Sélectionnez l'emplacement souhaité</li>
                <li>Choisissez l'option de confirmation :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Transfer Inventory to Selected Location</strong> : Transfère tout l'inventaire vers l'emplacement sélectionné</li>
                  <li><strong>Delete Inventory</strong> : Supprime l'inventaire des autres emplacements</li>
                </ul>
                <li>Cliquez sur <strong>Sauvegarder l'emplacement</strong></li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> Si vous désactivez l'onglet Multi-location, l'emplacement par défaut 
                  du vendeur sera désactivé. Si vous désactivez un emplacement dans Shopify, vous devez synchroniser 
                  manuellement les produits dans l'application.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Configuration côté vendeur */}
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
                Gestion de l'inventaire par emplacement
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent gérer leurs stocks par emplacement lorsqu'ils ajoutent ou modifient un produit :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Cliquez sur <strong>Ajouter un produit</strong> ou sélectionnez un produit existant</li>
                <li>Activez <strong>Suivre l'inventaire</strong> (Track Inventory)</li>
                <li>Sélectionnez les emplacements où le produit doit être stocké</li>
                <li>Saisissez les quantités pour chaque emplacement</li>
                <li>Sauvegardez le produit</li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.inventoryLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Si l'administrateur a défini un emplacement par défaut pour le vendeur, 
                  seul cet emplacement sera disponible lors de l'ajout/modification de produits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Gestion des commandes */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Expédition depuis les emplacements
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Lorsqu'une commande est passée pour un produit avec plusieurs emplacements, les vendeurs peuvent sélectionner 
                l'emplacement d'expédition lors du traitement :
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📦 Processus d'expédition
                </h4>
                <ol style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                  <li>Cliquez sur <strong>Expédier</strong> (Fulfill) pour la commande concernée</li>
                  <li>Sélectionnez l'<strong>emplacement d'expédition</strong> (pour les produits multi-emplacements)</li>
                  <li>Confirmez l'expédition</li>
                </ol>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  🔍 Consultation des détails d'expédition
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Dans la section <strong>Détails de la commande</strong>, les vendeurs peuvent voir :
                </p>
                <ul style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>L'emplacement depuis lequel le produit a été expédié</li>
                  <li>Les quantités expédiées par emplacement</li>
                  <li>Le statut de l'expédition</li>
                </ul>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Option Store Pickup :</strong> Compatible avec l'option "Retrait en magasin". 
                  Les clients peuvent choisir l'emplacement pour le retrait.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: FAQ */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
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
                  Qu'est-ce que l'inventaire multi-emplacements ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  C'est une fonctionnalité qui permet de gérer les stocks sur plusieurs entrepôts ou points de vente. 
                  Chaque emplacement a sa propre quantité de stock, et vous pouvez définir des priorités d'expédition.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment ajouter des emplacements dans Shopify ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Allez dans <strong>Paramètres Shopify → Emplacements → Ajouter un emplacement</strong>. 
                  Vous pouvez ajouter plusieurs entrepôts ou points de vente. Activez "Suivre l'inventaire par emplacement".
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je supprimer l'emplacement principal ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, l'emplacement principal par défaut ne peut pas être supprimé. Il sert de référence pour tous les produits.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si je désactive un emplacement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si vous désactivez un emplacement dans l'application, il reste disponible sur Shopify. 
                  Les vendeurs ne pourront plus utiliser cet emplacement pour les nouveaux produits, mais les produits existants restent inchangés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la priorité d'expédition ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut définir un ordre de priorité pour les emplacements. Lorsqu'une commande est passée, 
                  le système propose d'expédier depuis l'emplacement prioritaire si le stock est disponible.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Cette fonctionnalité est-elle compatible avec le retrait en magasin ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, l'option <strong>Store Pickup</strong> est entièrement compatible. Les clients peuvent choisir 
                  l'emplacement pour récupérer leur commande.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que signifie l'option "Transfer Inventory to Selected Location" ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Cette option transfère tout l'inventaire des vendeurs vers l'emplacement sélectionné. 
                  L'alternative "Delete Inventory" supprime l'inventaire des autres emplacements.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Support */}
          <section id="section-9" style={{
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
              et l'optimisation de votre inventaire multi-emplacements.
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
                📚 Documentation Inventaire multi-emplacements
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
