import React from 'react';
import { Link } from 'react-router-dom';

export default function StripeConnectGuide() {
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
            Guide d'utilisation - Stripe Connect
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Paiements automatisés avec répartition automatique entre administrateur et vendeurs
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💳 Stripe Connect</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Répartition automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Paiement différé</span>
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
              'Obtention des clés API Stripe',
              'Configuration des redirections',
              'Types de comptes Stripe',
              'Configuration côté vendeur',
              'Stripe Payout vs Stripe Transfer',
              'Paiement automatique (AutoPay)',
              'Période de rétractation',
              'Checkout et paiement client',
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
              L'add-on <strong>Stripe Connect</strong> intègre la passerelle de paiement Stripe Connect avec votre marketplace Shopify. 
              Lorsqu'un client paie une commande, le montant est automatiquement réparti entre le compte du vendeur et le compte 
              de l'administrateur, selon la commission configurée.
            </p>
            <div style={{
              background: styles.stripeLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.stripePurple}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'administrateur et les vendeurs doivent chacun avoir leur propre compte Stripe. 
                Le paiement peut être configuré en mode <strong>Payout</strong> (transfert automatique) ou <strong>Transfer</strong> 
                (transfert manuel). Disponible pour <strong>10$ USD par mois</strong>.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Stripe Connect</li>
                <li>L'administrateur doit avoir un compte <strong>Stripe</strong> actif</li>
                <li>Chaque vendeur doit avoir son propre compte <strong>Stripe</strong> (Standard ou Express)</li>
                <li>Version API Stripe : <strong>2019-08-14 ou supérieure</strong></li>
                <li>Montant minimum par transaction : <strong>0,50$ USD</strong></li>
                <li>Montant maximum par transaction : <strong>999 999,99$ USD</strong></li>
              </ul>
            </div>
            
            <div style={{
              background: '#fff3cd',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Points importants à retenir
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Cartes cadeaux :</strong> Le paiement n'est pas automatiquement réparti. L'administrateur reçoit la totalité et doit reverser la part du vendeur manuellement.</li>
                <li><strong>Produits personnalisés :</strong> Ne fonctionne pas avec Stripe Connect.</li>
                <li><strong>Codes promo :</strong> Le montant total est envoyé à l'administrateur, qui est responsable du reversement aux vendeurs.</li>
                <li><strong>Type de compte fixe :</strong> Une fois qu'un vendeur est connecté avec un type de compte (Standard ou Express), vous ne pouvez pas le modifier.</li>
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
                Recherchez "Stripe Connect" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>10$ USD</strong> et approuvez le paiement dans Shopify Backend.
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
                Créer une méthode de paiement personnalisée
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Dans Shopify Backend : <strong>Paramètres → Fournisseurs de paiement → Paiements manuels</strong><br />
                Cliquez sur <strong>Créer une méthode de paiement personnalisée</strong> et donnez-lui un nom (ex: "Stripe Connect").<br />
                Le nom doit correspondre exactement à celui configuré dans l'application.
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
                Méthode de paiement
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Administrateur</strong> → <strong>Commandes</strong> → <strong>Méthode de paiement de checkout</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Cliquez sur <strong>Ajouter</strong> pour configurer Stripe Connect</li>
                <li>Choisissez <strong>Stripe Payout</strong> ou <strong>Stripe Transfer</strong> (voir section dédiée)</li>
                <li>Entrez les clés API Stripe (Secret key, Publish key, Client ID)</li>
                <li>Configurez les options de paiement automatique (AutoPay to Seller)</li>
                <li>Sélectionnez le déclencheur : <strong>Fulfill</strong>, <strong>Delivery</strong> ou <strong>Pay after return date</strong></li>
              </ul>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des périodes de rétractation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Administrateur</strong> → <strong>Paiement</strong> → <strong>Configuration du paiement vendeur</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Enable Cashable Amount for Seller</strong> : Activez pour définir des délais de paiement</li>
                <li><strong>Order refund days</strong> : Nombre de jours avant que le paiement ne soit disponible</li>
                <li><strong>Calcul basé sur</strong> : Date de livraison, date d'expédition ou date de création</li>
                <li><strong>Allow seller to enter refund days</strong> : Permet aux vendeurs de définir leurs propres délais</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les jours de rétractation doivent être supérieurs à -1 pour fonctionner. 
                  Si les vendeurs ne définissent pas leurs propres délais, ceux de l'administrateur s'appliquent par défaut.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Obtention des clés API Stripe */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des clés API Stripe
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
                <li>Connectez-vous à votre compte <strong>Stripe Dashboard</strong></li>
                <li><strong>Secret key et Publish key</strong> : Allez dans <strong>Développeurs → Clés API</strong></li>
                <li><strong>Client ID</strong> : Allez dans <strong>Paramètres → Connect Settings</strong></li>
                <li>Copiez le <strong>Client ID</strong> affiché</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.stripeLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Les clés API sont sensibles. Ne les partagez jamais et assurez-vous 
                  d'utiliser les clés de production (pas les clés de test) en environnement réel.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration des redirections */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Configuration des redirections Stripe
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des Redirect URIs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour connecter les comptes vendeurs, vous devez configurer les URLs de redirection dans Stripe :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans l'application, allez dans <strong>Configuration → Instructions pour la marketplace → Stripe Connect</strong></li>
                <li>Copiez le code fourni (ressemble à : <code>{`https://{{votre_url}}/index.php?p=stripe_connect_config&sid={{sid}}&type=connect`}</code>)</li>
                <li>Dans Stripe Dashboard, allez dans <strong>Paramètres → Connect Settings → Redirects</strong></li>
                <li>Collez l'URL dans le champ <strong>Redirect URI</strong></li>
                <li>Définissez-la comme <strong>par défaut</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Important :</strong> Ne copiez pas l'exemple ci-dessus. Utilisez le code exact fourni 
                  dans la section "Instructions pour la marketplace" de votre application.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Types de comptes Stripe */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👥 Types de comptes Stripe
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Standard vs Express
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.stripePurple }}>
                    📝 Compte Standard
                  </h4>
                  <p style={{ fontSize: '13px', color: styles.textLight, margin: 0 }}>
                    Le vendeur est redirigé vers Stripe pour créer un compte complet. 
                    Stripe gère toute la vérification d'identité et la conformité.
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.stripePurple }}>
                    ⚡ Compte Express
                  </h4>
                  <p style={{ fontSize: '13px', color: styles.textLight, margin: 0 }}>
                    Intégration plus simple avec un onboarding rapide. 
                    Le vendeur peut accéder à un tableau de bord Stripe simplifié.
                  </p>
                </div>
              </div>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> Une fois qu'un vendeur est connecté avec un type de compte, 
                  vous ne pouvez pas le modifier vers l'autre type.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Configuration côté vendeur */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
                Connexion du compte Stripe
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs doivent connecter leur compte Stripe depuis leur tableau de bord :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur → Commandes → Configuration Stripe Connect</strong></li>
                <li>Cliquez sur <strong>Ajouter un compte Stripe</strong> (Add account to stripe)</li>
                <li>Choisissez le type de compte : <strong>Standard</strong> ou <strong>Express</strong></li>
                <li>Suivez le processus d'onboarding Stripe</li>
                <li>Une fois connecté, le compte est marqué comme "Successfully added"</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Pour les comptes Express :</strong> Le vendeur peut accéder directement à son tableau de bord 
                  Stripe depuis l'application pour gérer ses paramètres de paiement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Stripe Payout vs Stripe Transfer */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💰 Stripe Payout vs Stripe Transfer
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.stripePurple }}>
                Stripe Payout
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                <strong>Fonctionnement :</strong> Les gains du vendeur sont automatiquement transférés du compte administrateur 
                vers le compte Stripe du vendeur lorsque la commande est marquée comme livrée/expédiée/après la date de rétractation.
                Stripe gère ensuite le virement vers le compte bancaire du vendeur selon ses paramètres.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Limitations :</strong> Non compatible avec le Brésil et l'Inde</li>
                <li><strong>Conditions :</strong> Le solde du compte administrateur doit être suffisant</li>
                <li><strong>Configuration :</strong> Activer "Manual Pay" sur le compte Stripe du vendeur</li>
              </ul>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.stripePurple }}>
                Stripe Transfer
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                <strong>Fonctionnement :</strong> Le client paie l'administrateur via la méthode de paiement disponible. 
                Les gains du vendeur sont ensuite transférés du compte administrateur vers le compte Stripe du vendeur, 
                géré par l'application. Stripe gère ensuite le virement bancaire.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Limitations :</strong> Non compatible avec l'Inde</li>
                <li><strong>Description personnalisée :</strong> Possibilité d'ajouter une description personnalisée aux transferts</li>
                <li><strong>Remboursement automatique :</strong> Si une commande est remboursée après transfert, le montant est automatiquement reversé à l'administrateur</li>
                <li><strong>Toutes méthodes de paiement :</strong> L'administrateur peut choisir de créer un paiement uniquement si le paiement a été effectué via une méthode spécifique</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Description des transferts :</strong> L'administrateur peut activer "Set Description in Stripe Transfer" 
                  pour ajouter une description personnalisée qui apparaîtra dans le tableau de bord Stripe.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Paiement automatique (AutoPay) */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Paiement automatique (AutoPay to Seller)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Options de déclenchement
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut choisir quand les vendeurs reçoivent automatiquement leur paiement :
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Fulfill</h4>
                  <p style={{ fontSize: '12px', color: styles.textLight, margin: 0 }}>
                    Dès que le vendeur marque la commande comme expédiée
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚚</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Delivery</h4>
                  <p style={{ fontSize: '12px', color: styles.textLight, margin: 0 }}>
                    Dès que la commande est marquée comme livrée
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏱️</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Pay after return date</h4>
                  <p style={{ fontSize: '12px', color: styles.textLight, margin: 0 }}>
                    Après la période de rétractation configurée
                  </p>
                </div>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Exemple concret :</strong> Si l'administrateur choisit "Fulfill" et que le vendeur marque la commande 
                  comme expédiée, le paiement est automatiquement transféré du compte administrateur vers le compte du vendeur.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: Période de rétractation */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📅 Période de rétractation (Cashable Amount)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des délais de paiement
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                La fonction "Cashable Amount for Seller" permet de définir une période d'attente avant que le vendeur ne reçoive son paiement :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Activez <strong>Enable Cashable Amount for Seller</strong></li>
                <li>Définissez le nombre de jours de rétractation (<strong>Order refund days</strong>)</li>
                <li>Choisissez le point de départ :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Date de livraison</strong> : Le délai commence à la livraison</li>
                  <li><strong>Date d'expédition</strong> : Le délai commence à l'expédition</li>
                  <li><strong>Date de création</strong> : Le délai commence à la création de la commande</li>
                </ul>
                <li><strong>Allow seller to enter refund days</strong> : Permet aux vendeurs de définir leurs propres délais</li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: '#f1f5f9',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: styles.text }}>
                  📋 Exemple :
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: styles.textLight }}>
                  Si vous sélectionnez la date de livraison et définissez 30 jours, le vendeur recevra son paiement 
                  30 jours après la date de livraison de la commande.
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Conditions :</strong> Les jours de rétractation doivent être supérieurs à -1. 
                  Si les vendeurs ne définissent pas leurs propres délais, ceux de l'administrateur s'appliquent.
                </p>
              </div>
            </div>
          </section>

          {/* Section 12: Checkout et paiement client */}
          <section id="section-11" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛒 Checkout et paiement client
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Expérience client
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                À la page de paiement (checkout), le client peut sélectionner <strong>Stripe Connect</strong> comme méthode de paiement.
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  ⚡ Checkout extension (Nouveau thème Shopify)
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight, marginBottom: '12px' }}>
                  Pour les nouveaux thèmes Shopify, une extension de checkout est disponible :
                </p>
                <ol style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Allez dans <strong>Shopify Backend → Paramètres → Checkout</strong></li>
                  <li>Cliquez sur le bouton <strong>Personnaliser</strong></li>
                  <li>Sélectionnez la page <strong>Merci (Thank You)</strong></li>
                  <li>Ajoutez le bloc <strong>Checkout UI Extension</strong> dans la section Commande</li>
                  <li>Un popup apparaîtra sur la page de confirmation pour finaliser le paiement</li>
                </ol>
              </div>
              
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: styles.accent }}>
                  📝 Code à ajouter dans customers/order.liquid
                </h4>
                <pre style={{
                  background: '#1a2332',
                  color: '#e2e8f0',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  overflow: 'auto',
                  margin: 0
                }}>
{`<div style="display:none;" id="wk_order_payment_status" data-payment_status="{{ order.financial_status }}" data-sh_gateway="{{ order.transactions[0].gateway }}" data-wk_gateway="Stripe Payment"></div>`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section 13: FAQ */}
          <section id="section-12" style={{ marginBottom: '48px' }}>
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
                  Quelle est la différence entre Stripe Payout et Stripe Transfer ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  <strong>Payout :</strong> Transfert automatique du compte administrateur vers le compte vendeur géré par Stripe.<br />
                  <strong>Transfer :</strong> Transfert géré par l'application, avec plus de flexibilité (description personnalisée, 
                  remboursements automatiques, compatibilité avec toutes les méthodes de paiement).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les cartes cadeaux fonctionnent-elles avec Stripe Connect ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, pour les cartes cadeaux, l'administrateur reçoit la totalité du paiement et doit reverser manuellement 
                  la part du vendeur. Cela ne fonctionne pas non plus pour les produits personnalisés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionnent les remboursements avec Stripe Transfer ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si une commande est remboursée après que les gains du vendeur ont déjà été transférés, le système 
                  gère automatiquement le remboursement. Les fonds sont automatiquement reversés du compte vendeur 
                  vers le compte administrateur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Peut-on changer le type de compte Stripe d'un vendeur ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, une fois qu'un vendeur est connecté avec un type de compte (Standard ou Express), vous ne pouvez pas 
                  le modifier vers l'autre type. C'est une limitation de Stripe.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelles sont les limitations géographiques ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  <strong>Stripe Payout :</strong> Non compatible avec le Brésil et l'Inde.<br />
                  <strong>Stripe Transfer :</strong> Non compatible avec l'Inde.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la période de rétractation ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut définir un nombre de jours après lesquels le paiement est libéré. 
                  Le délai peut être calculé à partir de la date de livraison, d'expédition ou de création de la commande. 
                  Les vendeurs peuvent également définir leurs propres délais si l'option est activée.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  L'administrateur peut-il vendre ses propres produits ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, mais pour recevoir les paiements via Stripe Connect, l'administrateur doit également être configuré 
                  comme vendeur. Sinon, il ne pourra pas recevoir les fonds via Stripe Connect.
                </p>
              </div>
            </div>
          </section>

          {/* Section 14: Support */}
          <section id="section-13" style={{
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
              et l'optimisation de Stripe Connect sur votre marketplace.
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
                📚 Documentation Stripe Connect
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
