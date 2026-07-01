import React from 'react';
import { Link } from 'react-router-dom';

export default function UPSGuide() {
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
    brown: '#79553d',
    brownLight: '#f5ebe5'
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
          background: `linear-gradient(135deg, ${styles.brown} 0%, ${styles.accent} 100%)`,
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
            📦🚚
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
            Guide d'utilisation - UPS Shipping
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Gérez vos expéditions avec UPS - Calcul des tarifs, suivi des colis et génération d'étiquettes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Calcul des tarifs en temps réel</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏷️ Génération d'étiquettes</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📍 Suivi des colis</span>
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
              'Obtention des identifiants UPS',
              'Installation et activation',
              'Configuration administrateur',
              'Configuration vendeur',
              'Services d\'expédition UPS',
              'Génération d\'étiquettes',
              'Deux modes de fonctionnement',
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
              L'add-on <strong>UPS Shipping</strong> permet aux vendeurs de votre marketplace d'expédier leurs produits 
              via United Parcel Service (UPS), l'un des plus grands services de livraison de colis au monde. 
              Cette intégration offre le calcul des tarifs en temps réel, le suivi des colis et la génération automatique d'étiquettes.
            </p>
            <div style={{
              background: styles.brownLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.brown}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> UPS est disponible pour le calcul des tarifs et l'exécution des commandes. 
                L'add-on permet à la fois la gestion complète des expéditions.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on UPS</li>
                <li>Plan Shopify avec <strong>Real-Time Carrier-Calculated Shipping</strong></li>
                <li>Compte développeur UPS avec identifiants API</li>
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

          {/* Section 3: Obtention des identifiants UPS */}
          <section id="section-2" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des identifiants UPS
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer un compte développeur UPS
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Rendez-vous sur <strong>developer.ups.com</strong></li>
                <li>Créez un compte développeur ou connectez-vous</li>
                <li>Allez dans la section <strong>My App</strong></li>
                <li>Cliquez sur <strong>Add apps</strong> pour créer une nouvelle application</li>
                <li>Sélectionnez les options appropriées et cliquez sur <strong>Create Account</strong></li>
                <li>Vous obtiendrez alors votre <strong>Client ID</strong> et <strong>Client Secret</strong></li>
                <li>Sélectionnez toutes les permissions en cliquant sur le signe (+) dans la section des produits</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  📌 <strong>Note importante :</strong> Les nouveaux comptes n'ont pas besoin de clé d'accès UPS. 
                  Une fois le Client ID et Client Secret configurés, le système génère automatiquement le jeton d'accès.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Installation et activation */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
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
                Activer l'add-on UPS
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "UPS" et cliquez sur le bouton <strong>Activer</strong>. Acceptez les frais mensuels de 10$ USD.
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
                Valider les frais supplémentaires
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Une redirection vers Shopify Backend s'effectue. Cliquez sur <strong>Approuver les frais</strong> 
                pour finaliser l'activation.
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
                Cliquez sur les trois points à côté de "UPS" et sélectionnez <strong>Activer</strong>.
              </p>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  ✅ Astuce : Ne sélectionnez que les services d'expédition dont vous avez besoin. Trop de services peuvent ralentir 
                  la récupération des tarifs sur la boutique.
                </code>
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
                Accéder à la configuration UPS
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration UPS</strong> apparaît dans la section <strong>Configuration</strong> 
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
                Saisir les identifiants UPS
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Remplissez les champs suivants avec les informations de votre compte UPS :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li><strong>Client ID</strong> : Votre identifiant client UPS</li>
                <li><strong>Client Secret</strong> : Votre clé secrète UPS</li>
                <li><strong>Numéro d'expéditeur UPS</strong> : Votre numéro de compte UPS</li>
                <li><strong>Nom d'utilisateur</strong> : Votre nom d'utilisateur UPS</li>
                <li><strong>Mot de passe</strong> : Votre mot de passe UPS</li>
              </ul>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  🔧 Option : Vous pouvez choisir les services d'expédition (domestique ou international) et configurer 
                  l'adresse de retrait par défaut.
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
                }}>3</span>
                Configurer le mode d'utilisation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Choisissez le mode d'utilisation :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li><strong>Both (Fulfillment+Shipping)</strong> : Les vendeurs gèrent l'expédition et l'exécution</li>
                <li><strong>Send To Merchant</strong> : Les vendeurs envoient les colis à l'entrepôt de l'administrateur</li>
              </ul>
              <div style={{
                background: styles.accentLight,
                borderRadius: '12px',
                padding: '12px',
                marginLeft: '44px',
                marginTop: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 Note : Les tarifs négociés UPS sont affichés par défaut. Si non disponibles, les tarifs standard s'appliquent.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration vendeur */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
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
                Activer UPS dans l'espace vendeur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Connectez-vous à votre <strong>espace vendeur</strong>, puis :
              </p>
              <ol style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong></li>
                <li>Localisez UPS et cliquez sur <strong>Activer</strong></li>
                <li>Vous pouvez définir UPS comme méthode par défaut</li>
              </ol>
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
                }}>2</span>
                Configurer les détails d'expédition
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration globale</strong> pour définir :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Les dimensions et poids des colis par défaut</li>
                <li>Les services UPS disponibles</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Services d'expédition UPS */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🚚 Services d'expédition UPS
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>UPS Express</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Services de livraison express :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>UPS Next Day Air</li>
                    <li>UPS 2nd Day Air</li>
                    <li>UPS 3 Day Select</li>
                    <li>UPS Express Saver</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>UPS Ground</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Livraison économique par voie terrestre :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>UPS Ground (1-5 jours)</li>
                    <li>UPS Standard (Canada)</li>
                    <li>UPS SurePost</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌍</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>UPS International</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Expéditions internationales :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>UPS Worldwide Express</li>
                    <li>UPS Worldwide Expedited</li>
                    <li>UPS Worldwide Saver</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Génération d'étiquettes */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
                <li>Sélectionnez la commande concernée et cliquez sur <strong>Voir</strong></li>
                <li>Choisissez <strong>UPS</strong> comme méthode d'expédition</li>
                <li>Cliquez sur <strong>Exécuter les articles</strong></li>
                <li>Une fois exécutée, cliquez sur <strong>Générer l'étiquette d'expédition</strong></li>
                <li>L'étiquette est téléchargée au format GIF ou PDF</li>
              </ol>
            </div>

            <div style={{
              background: styles.accentLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.accent}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                📄 <strong>Note :</strong> L'étiquette générée contient le code-barres, l'adresse d'expédition, 
                l'adresse de retour et le numéro de suivi unique pour le colis.
              </p>
            </div>
          </section>

          {/* Section 9: Deux modes de fonctionnement */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Deux modes de fonctionnement
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mode Both (Fulfillment + Shipping)</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Dans ce mode, les vendeurs sont entièrement responsables de :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>L'expédition des commandes</li>
                    <li>L'exécution des commandes</li>
                    <li>La génération des étiquettes</li>
                    <li>Le suivi des colis</li>
                  </ul>
                  <p style={{ color: styles.textLight, marginTop: '12px' }}>
                    <strong>Idéal pour :</strong> Les vendeurs qui expédient directement depuis leur propre entrepôt.
                  </p>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦➡️🏢</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mode Send To Merchant</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Dans ce mode, le processus fonctionne ainsi :
                  </p>
                  <ol style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Le vendeur reçoit la commande</li>
                    <li>Il clique sur <strong>Ship To Merchant</strong></li>
                    <li>Il envoie le colis à l'entrepôt de l'administrateur</li>
                    <li>L'administrateur gère l'expédition finale</li>
                  </ol>
                  <p style={{ color: styles.textLight, marginTop: '12px' }}>
                    <strong>Idéal pour :</strong> Les marketplaces centralisées avec entrepôt principal.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.brownLight,
              padding: '20px',
              borderRadius: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: styles.text }}>
                📌 <strong>Configuration de l'entrepôt :</strong> En mode "Send To Merchant", l'administrateur peut ajouter 
                un ou plusieurs emplacements d'entrepôt. Les stocks sont mis à jour automatiquement.
              </p>
            </div>
          </section>

          {/* Section 10: Affichage frontal */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
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
                  Les clients voient les tarifs UPS calculés dynamiquement selon le poids, les dimensions et la destination.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Choix du service</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Au checkout, les clients peuvent choisir parmi les différents services UPS configurés 
                  (Ground, 2Day Air, Next Day Air, etc.).
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📍</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Suivi des colis</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients reçoivent un email avec le numéro de suivi UPS et peuvent suivre leur colis 
                  directement sur le site UPS.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: FAQ */}
          <section id="section-10" style={{ marginBottom: '48px' }}>
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
                  Comment obtenir mes identifiants UPS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Créez un compte développeur sur developer.ups.com, créez une application dans "My App" et vous obtiendrez 
                  votre Client ID et Client Secret. Pour les nouveaux comptes, le système génère automatiquement le jeton d'accès.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels sont les services UPS disponibles ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  UPS propose des services express (Next Day Air, 2nd Day Air), des services terrestres (Ground, Standard) 
                  et des services internationaux (Worldwide Express, Worldwide Expedited). Vous pouvez sélectionner ceux 
                  que vous souhaitez activer.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre les deux modes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le mode "Both" permet aux vendeurs de gérer entièrement leurs expéditions. Le mode "Send To Merchant" 
                  centralise l'expédition auprès de l'administrateur : les vendeurs envoient les colis à l'entrepôt 
                  principal qui gère l'expédition finale.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les tarifs négociés UPS sont-ils pris en compte ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Par défaut, le système affiche les tarifs négociés si vous en avez avec UPS. 
                  En l'absence de tarifs négociés, les tarifs standard sont appliqués.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je imprimer plusieurs étiquettes à la fois ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Actuellement, les étiquettes sont générées une par une. Une fonctionnalité d'impression groupée 
                  est en cours de développement pour une version future.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire en cas d'erreur lors de la génération d'étiquette ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vérifiez que vos identifiants UPS sont corrects et que vous avez sélectionné les bons services. 
                  Assurez-vous également que le mode Sandbox n'est pas activé en production. Consultez les logs d'erreur 
                  dans la section Administration.
                </p>
              </div>
            </div>
          </section>

          {/* Section 12: Support */}
          <section id="section-11" style={{
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
              et l'optimisation de vos expéditions UPS.
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
                📚 Documentation UPS
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
