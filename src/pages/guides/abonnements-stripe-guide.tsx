import React from 'react';
import { Link } from 'react-router-dom';

export default function AbonnementsStripeGuide() {
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
    stripePurple: '#635bff',
    stripeDark: '#0a2540',
    stripeLight: '#e8f0fe'
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
        
        {/* En-tête avec dégradé violet Stripe */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.stripePurple} 0%, ${styles.stripeDark} 100%)`,
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
            🔄💳
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
            Guide d'utilisation - Abonnements Stripe
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Permettez à vos vendeurs de proposer des abonnements hebdomadaires, mensuels ou annuels
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Abonnements récurrents</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💳 Paiements Stripe</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Fidélisation client</span>
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
              'Création d\'abonnements par les vendeurs',
              'Gestion des abonnements',
              'Affichage en front-end',
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
              L'add-on <strong>Abonnements Stripe</strong> (Product Subscription) permet aux vendeurs d'ajouter des abonnements 
              pour leurs produits. Les clients peuvent s'abonner sur une base hebdomadaire, mensuelle ou annuelle, 
              ce qui favorise la fidélisation et génère des revenus récurrents.
            </p>
            <div style={{
              background: styles.stripeLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.stripePurple}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Cette fonctionnalité nécessite que l'add-on <strong>Stripe Connect</strong> soit activé. 
                Elle est également compatible avec les produits "Make an offer". Actuellement, fonctionne uniquement avec Stripe, 
                mais une version avec Shopify Payments est en développement.
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
                <li><strong>Stripe Connect</strong> doit être activé sur votre marketplace</li>
                <li>Frais supplémentaires pour l'add-on Abonnements Stripe (selon le plan choisi)</li>
                <li>Le <strong>Payment Flow</strong> de Stripe Connect doit être configuré sur <strong>"Payment on Same page"</strong></li>
                <li>Compatible avec les produits "Make an offer"</li>
              </ul>
            </div>

            <div style={{
              background: styles.warning + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Points importants à retenir
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Actuellement :</strong> Fonctionne uniquement avec Stripe Connect</li>
                <li><strong>À venir :</strong> Support pour Shopify Payments (mises à jour à venir)</li>
                <li>Les abonnements sont gérés <strong>par variante de produit</strong>, pas au niveau du produit principal</li>
                <li>Les vendeurs peuvent activer/désactiver les plans d'abonnement à tout moment</li>
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
                Vérifier Stripe Connect
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Assurez-vous que l'add-on <strong>Stripe Connect</strong> est activé et correctement configuré sur votre marketplace.
                Le Payment Flow doit être défini sur <strong>"Payment on Same page"</strong>.
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
                Activer l'add-on Abonnements Stripe
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> (Feature Apps) de votre tableau de bord administrateur.
                Recherchez "Product Subscription App" et cliquez sur le bouton <strong>Activer</strong>.
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
                Accepter les frais supplémentaires
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
                Configuration des abonnements
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois l'add-on activé, un nouveau sous-menu apparaît :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Allez dans <strong>Administrateur</strong> → <strong>Configuration</strong> → <strong>Subscription Product Configuration</strong></li>
                <li>Vous trouverez les paramètres que l'administrateur peut gérer pour :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Les packs d'abonnement des vendeurs</li>
                  <li>Les produits avec abonnement</li>
                  <li>Les options de facturation récurrente</li>
                </ul>
              </ul>
            </div>
          </section>

          {/* Section 5: Création d'abonnements par les vendeurs */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Création d'abonnements par les vendeurs
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Ajout d'abonnement par variante
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent ajouter des abonnements <strong>par variante de produit</strong> (et non au niveau du produit principal) :
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  Lors de la création d'un produit
                </h4>
                <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                  <li>Allez dans <strong>Espace vendeur</strong> → <strong>Produits</strong> → <strong>Ajouter un produit</strong></li>
                  <li>Créez les variantes du produit</li>
                  <li>Dans la section des variantes, activez l'option <strong>Subscription</strong></li>
                  <li>Configurez les détails de l'abonnement :</li>
                  <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                    <li>Fréquence : <strong>Hebdomadaire</strong>, <strong>Mensuelle</strong> ou <strong>Annuelle</strong></li>
                    <li>Prix de l'abonnement</li>
                    <li>Période d'essai (optionnel)</li>
                  </ul>
                  <li>Sauvegardez le produit</li>
                </ol>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  Lors de l'édition d'un produit existant
                </h4>
                <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                  <li>Allez dans <strong>Espace vendeur</strong> → <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                  <li>Cliquez sur les trois points "..." et sélectionnez <strong>Modifier</strong></li>
                  <li>Sélectionnez la variante concernée</li>
                  <li>Activez l'option <strong>Subscription</strong></li>
                  <li>Configurez les détails de l'abonnement</li>
                  <li>Sauvegardez les modifications</li>
                </ol>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Flexibilité :</strong> Les vendeurs peuvent activer ou désactiver un plan d'abonnement 
                  à tout moment, sans avoir à recréer le produit.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Gestion des abonnements */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Gestion des abonnements
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Visualisation des détails
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent consulter les détails de leurs abonnements :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Pour un produit avec abonnement, cliquez sur les trois points "..." dans la colonne Action</li>
                <li>Sélectionnez <strong>Voir l'abonnement</strong> (View Subscription)</li>
                <li>Vous accédez à une page avec :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Tous les détails du plan d'abonnement</li>
                  <li>La fréquence de facturation</li>
                  <li>Le prix récurrent</li>
                  <li>Un bouton <strong>Voir les commandes</strong> pour consulter les commandes associées à cette variante</li>
                </ul>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les commandes d'abonnement sont traitées via Stripe Connect. 
                  Les vendeurs peuvent suivre les paiements récurrents dans leur tableau de bord Stripe.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Affichage en front-end */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖥️ Affichage en front-end
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Ajout des codes d'affichage
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour afficher le widget d'abonnement sur votre boutique, vous devez ajouter des codes dans votre thème Shopify :
              </p>
              
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Administrateur</strong> → <strong>Configuration</strong> → <strong>Instructions pour la marketplace</strong></li>
                <li>Trouvez la section <strong>Product Subscription</strong></li>
                <li>Copiez les codes fournis</li>
                <li>Ajoutez-les dans les fichiers de thème appropriés :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><code>product.json</code> → <code>sections/main-product.liquid</code></li>
                  <li>Ou <code>product-template.liquid</code> selon votre thème</li>
                </ul>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.stripeLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Résultat :</strong> Une fois les codes ajoutés, les clients verront une option d'abonnement 
                  sur la page produit, avec le choix de la fréquence (hebdomadaire, mensuelle, annuelle).
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Besoin d'aide ?</strong> Si vous rencontrez des difficultés pour ajouter les codes, 
                  contactez-nous à <strong>support@webkul.com</strong> et nous vous assisterons.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: FAQ */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
                  Qu'est-ce que l'add-on Abonnements Stripe ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  C'est une extension qui permet aux vendeurs de proposer des abonnements récurrents (hebdomadaires, 
                  mensuels, annuels) pour leurs produits. Les clients peuvent s'abonner et être facturés automatiquement 
                  via Stripe Connect.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels sont les prérequis pour utiliser cette fonctionnalité ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vous devez avoir <strong>Stripe Connect</strong> activé sur votre marketplace, et le <strong>Payment Flow</strong> 
                  doit être configuré sur "Payment on Same page". L'add-on Abonnements Stripe doit également être activé.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Peut-on créer des abonnements pour toutes les variantes d'un produit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les abonnements sont configurés <strong>par variante</strong>. Chaque variante peut avoir son propre 
                  plan d'abonnement (fréquence, prix) ou ne pas en avoir.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les abonnements fonctionnent-ils avec Shopify Payments ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Actuellement, l'add-on fonctionne <strong>uniquement avec Stripe Connect</strong>. Une version compatible 
                  avec Shopify Payments est en cours de développement et sera disponible prochainement.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment les vendeurs voient-ils les commandes d'abonnement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent consulter les commandes d'abonnement en cliquant sur <strong>"Voir les commandes"</strong> 
                  dans la page de détails de l'abonnement. Les paiements récurrents sont gérés via Stripe Connect.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les produits "Make an offer" sont-ils compatibles ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, l'add-on Abonnements Stripe est <strong>compatible avec les produits "Make an offer"</strong>. 
                  Les vendeurs peuvent proposer des offres avec abonnement.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment afficher le widget d'abonnement sur la boutique ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur doit ajouter les codes fournis dans la section <strong>"Instructions pour la marketplace"</strong> 
                  dans les fichiers de thème appropriés. Une assistance est disponible si besoin.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Support */}
          <section id="section-8" style={{
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
              et l'optimisation de vos abonnements Stripe.
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
                📚 Documentation Abonnements Stripe
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
