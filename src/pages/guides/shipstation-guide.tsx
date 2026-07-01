import React from 'react';
import { Link } from 'react-router-dom';

export default function ShipStationGuide() {
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
    cyan: '#06b6d4',
    cyanLight: '#cffafe'
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
          background: `linear-gradient(135deg, ${styles.cyan} 0%, ${styles.accent} 100%)`,
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
            🚢📦
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
            Guide d'utilisation - ShipStation
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Solution d'expédition multi-transporteurs - Génération automatique d'étiquettes et gestion centralisée
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Multi-transporteurs</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏷️ Étiquettes automatiques</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Caisses personnalisées</span>
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
              'Génération d\'étiquettes',
              'Synchronisation ShipStation',
              'Caisses personnalisées (Dropbox)',
              'Affichage frontal',
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
              L'add-on <strong>ShipStation</strong> est une solution d'expédition multi-transporteurs basée sur le web, 
              conçue pour les détaillants e-commerce. Cette intégration permet d'expédier vos marchandises via plusieurs 
              transporteurs et de générer automatiquement des étiquettes d'expédition.
            </p>
            <div style={{
              background: styles.cyanLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.cyan}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> ShipStation est disponible pour le calcul des tarifs et l'exécution des commandes. 
                Vous pouvez utiliser un seul transporteur pour le calcul des tarifs tout en bénéficiant de la gestion centralisée.
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
                <li>Add-on <strong>Expédition</strong> activé (gratuit)</li>
                <li>Frais supplémentaires de <strong>15$ USD par mois</strong> pour l'add-on ShipStation</li>
                <li>Plan Shopify avec <strong>Real-Time Carrier-Calculated Shipping</strong></li>
                <li>Compte ShipStation avec clés API</li>
                <li>Un seul transporteur peut être sélectionné pour le calcul des tarifs</li>
              </ul>
            </div>

            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.red}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚠️ <strong>Important :</strong> Pour utiliser cette fonctionnalité, le numéro de téléphone de l'adresse d'expédition 
                doit être obligatoire lors du paiement. Configurez cela dans Shopify Backend → Settings → Checkout → Form Options.
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
                Activer l'add-on ShipStation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "ShipStation" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de 15$ USD et approuvez le paiement dans Shopify Backend.
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
                Activer la méthode d'expédition
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong>. 
                Cliquez sur les trois points à côté de "ShipStation" et sélectionnez <strong>Activer</strong>.
              </p>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  ✅ Astuce : Ne sélectionnez que les services d'expédition dont vous avez besoin pour optimiser les performances.
                </code>
              </div>
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
                Accéder à la configuration ShipStation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration ShipStation</strong> apparaît dans la section <strong>Configuration</strong> 
                de votre tableau de bord.
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
                Configurer les identifiants ShipStation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Remplissez les champs suivants avec les informations de votre compte ShipStation :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li><strong>Mode Sandbox</strong> : Activez pour les tests (les étiquettes ne sont pas générées)</li>
                <li><strong>Génération automatique d'étiquette</strong> : Génère l'étiquette lors de l'exécution</li>
                <li><strong>Usage</strong> : "Fulfillment only" ou "Both (Fulfillment + Shipping)"</li>
                <li><strong>Pays</strong> : Canada, Australie, États-Unis ou Royaume-Uni</li>
                <li><strong>Clé API ShipStation</strong> : Votre clé API</li>
                <li><strong>Clé secrète ShipStation</strong> : Votre clé secrète</li>
                <li><strong>Code transporteur</strong> : Cliquez sur "Obtenir le code transporteur"</li>
                <li><strong>Type de colis</strong> : Choisissez le type pour l'exécution</li>
                <li><strong>Frais d'étiquette pris en charge par</strong> : Administrateur ou Vendeur</li>
              </ul>
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
                Options avancées
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Dimensions personnalisées à l'exécution :</strong> Permet aux vendeurs d'ajouter des dimensions et poids personnalisés.
              </p>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Restreindre la méthode d'expédition :</strong> Limite les vendeurs à utiliser uniquement la méthode sélectionnée par le client.
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
                }}>4</span>
                Synchronisation avec ShipStation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Pour permettre aux vendeurs d'exécuter les commandes directement depuis leur tableau de bord ShipStation :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Choisissez <strong>"Fulfillment"</strong> dans Usage As</li>
                <li>Activez <strong>"Allow seller to configure their own ShipStation account"</strong></li>
                <li>Activez <strong>"Allow Seller to Register Webhook"</strong></li>
                <li>Choisissez l'affichage des ID de commande</li>
              </ul>
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
                }}>5</span>
                Activer Dropbox (Caisses personnalisées)
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Activez cette option pour permettre aux vendeurs de créer leurs propres caisses d'expédition :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Dimensions personnalisées</li>
                <li>Réglage de la température (caisse climatisée)</li>
                <li>Matériaux de calage (dunnage)</li>
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
                Activer ShipStation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Connectez-vous à votre <strong>espace vendeur</strong>, puis :
              </p>
              <ol style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong></li>
                <li>Activez ShipStation</li>
                <li>Définissez comme méthode par défaut si souhaité</li>
              </ol>
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
                Configurer les détails (si autorisé)
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Si l'administrateur a autorisé les vendeurs à utiliser leur propre compte ShipStation :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Clé API ShipStation</li>
                <li>Clé secrète ShipStation</li>
                <li>Code transporteur</li>
              </ul>
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
                Configuration globale des colis
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration globale</strong> pour définir les dimensions et poids par défaut des colis.
              </p>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  📦 Note : Le poids du produit est obligatoire lors de la création du produit.
                </code>
              </div>
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
                Synchronisation avec ShipStation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Pour la synchronisation automatique :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Activez <strong>"Create Order Before Fulfillment"</strong></li>
                <li>Copiez l'URL webhook fournie</li>
                <li>Configurez le webhook dans votre tableau de bord ShipStation</li>
                <li>Mettez à jour votre profil (My Profile → Save Changes)</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Génération d'étiquettes */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏷️ Génération d'étiquettes d'expédition
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Procédure de génération d'étiquette</h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                <li>Cliquez sur <strong>Voir</strong> à côté de la commande concernée</li>
                <li>Sélectionnez <strong>ShipStation</strong> comme méthode d'expédition</li>
                <li>Cliquez sur <strong>Exécuter les articles</strong></li>
                <li>L'étiquette est automatiquement téléchargée (si option activée)</li>
                <li>Pour réimprimer : Détails supplémentaires → Actions → Imprimer l'étiquette</li>
              </ol>
            </div>

            <div style={{
              background: styles.accentLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.accent}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                📄 <strong>Note :</strong> En mode Sandbox, les étiquettes ne sont pas générées. Activez le mode production pour les vraies expéditions.
              </p>
            </div>
          </section>

          {/* Section 7: Synchronisation ShipStation */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Synchronisation avec ShipStation
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Exécution des commandes depuis ShipStation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Cette fonctionnalité permet aux vendeurs d'exécuter les commandes directement depuis leur tableau de bord ShipStation.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px', marginBottom: '16px' }}>
                <li>Les commandes sont créées automatiquement sur ShipStation</li>
                <li>L'ID ShipStation s'affiche dans les détails de la commande</li>
                <li>Lors de l'exécution sur ShipStation, le statut se synchronise automatiquement</li>
                <li>Les informations de suivi sont synchronisées</li>
              </ul>
              <div style={{
                background: '#fff3cd',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⏱️ <strong>Note :</strong> La synchronisation peut prendre jusqu'à 5 minutes après l'exécution sur ShipStation.
                </p>
              </div>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  📌 <strong>Limitations :</strong>
                  <br />- Les commandes sont exécutées en totalité (pas d'exécution partielle)
                  <br />- Les modifications de commande après exécution ne sont pas synchronisées
                  <br />- L'annulation sur ShipStation n'annule pas la commande sur la marketplace
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Caisses personnalisées (Dropbox) */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Caisses personnalisées (Dropbox)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des caisses personnalisées
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Côté administrateur</h4>
                <p style={{ color: styles.textLight }}>
                  Activez l'option <strong>Dropbox</strong> dans la configuration ShipStation pour permettre aux vendeurs de créer leurs propres caisses.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Côté vendeur</h4>
                <p style={{ color: styles.textLight, marginBottom: '12px' }}>
                  Pour créer une caisse personnalisée :
                </p>
                <ol style={{ color: styles.textLight, marginLeft: '20px' }}>
                  <li>Allez dans <strong>Méthodes d'expédition</strong> → <strong>ShipStation</strong></li>
                  <li>Cliquez sur les trois points → <strong>Configurer la caisse personnalisée</strong></li>
                  <li>Activez <strong>Créer une caisse personnalisée</strong></li>
                  <li>Choisissez le type de caisse :</li>
                  <ul style={{ marginLeft: '20px', marginTop: '8px', marginBottom: '12px' }}>
                    <li><strong>Caisse normale</strong> : Dimensions + matériaux de calage</li>
                    <li><strong>Caisse climatisée</strong> : Dimensions + matériaux de calage + température min/max</li>
                  </ul>
                  <li>Saisissez les dimensions (LBH)</li>
                  <li>Ajoutez les matériaux de calage si nécessaire</li>
                  <li>Pour la caisse climatisée, définissez la plage de température</li>
                  <li>Cliquez sur <strong>Enregistrer</strong></li>
                </ol>
              </div>

              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Application aux produits</h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Lors de l'ajout ou modification d'un produit, sélectionnez ShipStation comme méthode d'expédition.
                  Vous verrez alors les options pour appliquer la caisse personnalisée créée.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Affichage frontal */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖥️ Affichage sur la boutique
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📊</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Calcul des tarifs en temps réel</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients voient les tarifs calculés selon le transporteur sélectionné et les dimensions/poids du produit.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Choix du service</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Au checkout, les clients peuvent choisir parmi les services configurés selon le transporteur sélectionné.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📍</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Suivi des colis</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients reçoivent un email avec le numéro de suivi dès que la commande est exécutée.
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
                  Combien de transporteurs puis-je utiliser avec ShipStation ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vous pouvez utiliser plusieurs transporteurs pour l'exécution, mais un seul peut être sélectionné pour le calcul des tarifs au checkout.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir mes clés API ShipStation ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Connectez-vous à votre compte ShipStation, allez dans "Paramètres" → "API" et générez vos clés API et secrètes.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils utiliser leur propre compte ShipStation ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! L'administrateur peut activer l'option "Allow seller to configure their own ShipStation account". 
                  Chaque vendeur pourra alors saisir ses propres identifiants ShipStation.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre les caisses normale et climatisée ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  La caisse normale permet uniquement de définir les dimensions et les matériaux de calage. 
                  La caisse climatisée ajoute la possibilité de définir une plage de température minimale et maximale, 
                  idéale pour les produits sensibles à la température.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien de temps prend la synchronisation avec ShipStation ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  La synchronisation peut prendre jusqu'à 5 minutes après l'exécution de la commande sur ShipStation. 
                  Le statut et les informations de suivi sont ensuite automatiquement mis à jour.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les commandes peuvent-elles être exécutées partiellement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les commandes sont exécutées en totalité avec ShipStation. L'exécution partielle par article n'est pas supportée.
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
              et l'optimisation de vos expéditions ShipStation.
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
                📚 Documentation ShipStation
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
