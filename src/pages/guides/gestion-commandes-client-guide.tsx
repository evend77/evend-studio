import React from 'react';
import { Link } from 'react-router-dom';

export default function GestionCommandesClientGuide() {
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
    orderBlue: '#3b82f6',
    orderPurple: '#8b5cf6',
    orderLight: '#eff6ff'
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
        
        {/* En-tête avec dégradé bleu/violet */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.orderBlue} 0%, ${styles.orderPurple} 100%)`,
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
            📋🔄
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
            Guide d'utilisation - Gestion commandes client
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Donnez à vos clients le contrôle total sur leurs commandes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📋 Gestion des commandes</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Demandes RMA</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📄 Factures et réapprovisionnement</span>
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
              'Demandes de retour (RMA)',
              'Demandes de facture',
              'Réapprovisionnement',
              'Modification d\'adresse',
              'Recherche de commande',
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
              📋 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Gestion commandes client</strong> (Customer Order Management) permet aux clients de gérer 
              leurs commandes de manière autonome. Ils peuvent demander un retour, une annulation, un échange, une facture, 
              modifier leur adresse de livraison ou commander à nouveau un produit précédemment acheté.
            </p>
            <div style={{
              background: styles.orderLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.orderBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'add-on est <strong>gratuit</strong>, mais l'intégration coûte 
                <strong>15$ USD par mois</strong> en supplément du plan Multivendor. Les clients peuvent gérer leurs commandes 
                même sans compte via la fonctionnalité "Order Lookup".
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
                <li>Frais d'intégration de <strong>15$ USD par mois</strong> (l'add-on est gratuit)</li>
                <li>Installation de l'application <strong>Customer Order Management</strong> sur Shopify</li>
                <li>Ajout des codes dans les fichiers de thème pour l'affichage des options</li>
              </ul>
            </div>

            <div style={{
              background: styles.success + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.success}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.success }}>
                🎯 Fonctionnalités incluses
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>✅ Demandes de retour, annulation, échange (RMA)</li>
                <li>✅ Demandes de facture</li>
                <li>✅ Réapprovisionnement (Reorder) avec remise</li>
                <li>✅ Modification de l'adresse de livraison</li>
                <li>✅ Recherche de commande sans compte (Order Lookup)</li>
                <li>✅ Suivi des statuts en temps réel</li>
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
                Accéder aux Feature Apps
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> (Feature Apps) du tableau de bord administrateur.
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
                Recherchez "Customer Order Management" et cliquez sur le bouton <strong>Activer</strong>.
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
                }}>3</span>
                Installer l'application Customer Order Management
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Vous serez invité à installer l'application <strong>Customer Order Management</strong> sur votre boutique Shopify. 
                Acceptez l'installation.
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
                }}>4</span>
                Accepter les frais
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Acceptez les frais mensuels de <strong>15$ USD</strong> et approuvez le paiement dans Shopify Backend.
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
                Configuration COM
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois l'add-on activé, un nouveau menu apparaît : <strong>Configuration</strong> → <strong>Configuration COM</strong> 
                (COM Configuration).
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Activez les options souhaitées pour les clients</li>
                <li>Configurez les paramètres de retour, d'annulation et d'échange</li>
                <li>Personnalisez les emails de notification (dans Configuration des emails)</li>
                <li>Sauvegardez les modifications</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Pour que les options de gestion apparaissent sur le front-end, 
                  vous devez ajouter les codes fournis dans les fichiers de thème appropriés.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Demandes de retour (RMA) */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Demandes de retour (RMA)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Processus côté client
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les clients peuvent demander un retour, une annulation ou un échange depuis leur espace <strong>Mon compte</strong> :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à <strong>Mon compte</strong></li>
                <li>Accédez à la section <strong>Commandes</strong></li>
                <li>Sélectionnez la commande concernée</li>
                <li>Cliquez sur <strong>Demander un retour</strong> (Request Return)</li>
                <li>Remplissez le formulaire avec :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>La raison de la demande</li>
                  <li>Le type de demande (retour, annulation, échange)</li>
                  <li>Des commentaires supplémentaires</li>
                </ul>
                <li>Soumettez la demande</li>
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
                Gestion côté vendeur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent gérer les demandes RMA depuis leur tableau de bord :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                <li>Cliquez sur <strong>Modifier</strong> dans le menu Action</li>
                <li>Sélectionnez <strong>Liste des demandes de retour</strong> (Return Request List)</li>
                <li>Mettez à jour le statut de la demande :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>En attente</li>
                  <li>Approuvé</li>
                  <li>Refusé</li>
                  <li>Traité</li>
                </ul>
                <li>Ajoutez des commentaires si nécessaire</li>
                <li>Cliquez sur <strong>Mettre à jour</strong></li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.orderLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Une section dédiée <strong>RMA</strong> liste toutes les demandes, 
                  permettant aux vendeurs de les gérer sans passer par chaque commande individuellement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Demandes de facture */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📄 Demandes de facture
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Processus de demande de facture
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les clients peuvent demander une facture pour leurs commandes :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans <strong>Mon compte</strong> → <strong>Commandes</strong></li>
                <li>Sélectionnez la commande concernée</li>
                <li>Cliquez sur <strong>Demander une facture</strong> (Request Invoice)</li>
                <li>Une notification est envoyée à l'administrateur</li>
                <li>L'administrateur traite la demande et envoie la facture par email</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> L'administrateur peut configurer les emails de notification de demande de facture 
                  dans la section <strong>Configuration des emails</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Réapprovisionnement */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Réapprovisionnement (Reorder)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Commander à nouveau un produit
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les clients peuvent facilement recommander un produit précédemment acheté :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans <strong>Mon compte</strong> → <strong>Commandes</strong></li>
                <li>Sélectionnez la commande concernée</li>
                <li>Cliquez sur <strong>Recommander</strong> (Reorder)</li>
                <li>Le produit est ajouté au panier avec les mêmes options</li>
                <li>Ajustez la quantité si nécessaire</li>
                <li>Procédez au paiement</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Avantage :</strong> Les clients peuvent bénéficier de remises spéciales pour les réapprovisionnements, 
                  augmentant ainsi la fidélisation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Modification d'adresse */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📍 Modification de l'adresse de livraison
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Changer l'adresse après la commande
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les clients peuvent demander à modifier l'adresse de livraison même après avoir passé commande, 
                tant que la commande n'est pas encore expédiée :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans <strong>Mon compte</strong> → <strong>Commandes</strong></li>
                <li>Sélectionnez la commande concernée</li>
                <li>Cliquez sur <strong>Changer l'adresse de livraison</strong></li>
                <li>Choisissez une adresse existante ou ajoutez-en une nouvelle</li>
                <li>Soumettez la demande</li>
                <li>L'administrateur reçoit une notification et valide le changement</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.orderLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Cette fonctionnalité est particulièrement utile pour les cadeaux ou les déménagements 
                  survenus après la commande.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Recherche de commande */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔍 Recherche de commande (Order Lookup)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Gestion des commandes sans compte
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les clients qui n'ont pas de compte (ou dont le compte est désactivé) peuvent gérer leurs commandes 
                via la fonctionnalité Order Lookup :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Créez un menu <strong>Recherche de commande</strong> (Order Lookup) sur le front-end</li>
                <li>Le client entre son <strong>ID de commande</strong> et son <strong>email</strong></li>
                <li>Clique sur <strong>Rechercher</strong> (Lookup)</li>
                <li>L'administrateur reçoit une notification et vérifie l'email</li>
                <li>Une fois vérifié, le client accède aux détails de la commande</li>
                <li>Le client peut alors gérer sa commande (retour, facture, etc.)</li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Avantage :</strong> Simplifie la gestion pour les clients occasionnels et réduit les appels au support.
                </p>
              </div>
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
                  L'add-on Gestion commandes client est-il gratuit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'add-on lui-même est <strong>gratuit</strong>, mais l'intégration coûte <strong>15$ USD par mois</strong> 
                  en supplément du plan Multivendor Marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelles actions les clients peuvent-ils effectuer ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les clients peuvent : demander un retour/annulation/échange (RMA), demander une facture, 
                  recommander un produit, et modifier leur adresse de livraison (pour les commandes non expédiées).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment les vendeurs gèrent-ils les demandes RMA ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent gérer les demandes depuis la section <strong>Commandes</strong> ou depuis 
                  la section dédiée <strong>RMA</strong> qui liste toutes les demandes pour un accès rapide.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les clients sans compte peuvent-ils gérer leurs commandes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, grâce à la fonctionnalité <strong>Order Lookup</strong>. Les clients entrent leur ID de commande 
                  et leur email pour accéder à leurs commandes après vérification par l'administrateur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les clients peuvent-ils modifier l'adresse après la commande ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, tant que la commande n'est pas encore expédiée. La demande est envoyée à l'administrateur 
                  qui la valide avant modification.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment configurer les emails de notification ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut configurer les emails dans <strong>Configuration</strong> → <strong>Configuration des emails</strong>. 
                  Vous pouvez personnaliser les templates pour chaque type de notification.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Le réapprovisionnement inclut-il des remises ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, vous pouvez configurer des remises spéciales pour les réapprovisionnements dans la configuration 
                  de l'add-on, encourageant ainsi la fidélisation.
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
              et l'optimisation de la gestion des commandes client.
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
                📚 Documentation Gestion commandes client
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
