import React from 'react';
import { Link } from 'react-router-dom';

export default function DHLExpressGuide() {
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
    yellow: '#eab308',
    yellowLight: '#fef9c3'
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
          background: `linear-gradient(135deg, ${styles.yellow} 0%, ${styles.accent} 100%)`,
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
            ✈️📦
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
            Guide d'utilisation - DHL Express
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Expéditions internationales rapides avec DHL - Calcul des tarifs, étiquettes et enlèvements
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>✈️ Expédition internationale</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏷️ Étiquettes automatiques</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⏰ Enlèvement programmé</span>
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
              'Services DHL Express',
              'Génération d\'étiquettes',
              'Enlèvement programmé',
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
              L'add-on <strong>DHL Express</strong> permet aux vendeurs de votre marketplace d'expédier leurs produits 
              via DHL, l'un des leaders mondiaux de la logistique et du transport express. Cette intégration offre 
              le calcul des tarifs en temps réel, la génération automatique d'étiquettes et la gestion des enlèvements.
            </p>
            <div style={{
              background: styles.yellowLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.yellow}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> DHL Express est spécialisé dans les expéditions internationales rapides. 
                L'add-on permet à la fois le calcul des tarifs et l'exécution des commandes.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on DHL Express</li>
                <li>Plan Shopify avec <strong>Real-Time Carrier-Calculated Shipping</strong></li>
                <li>Compte DHL Express avec identifiants API</li>
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
                Activer l'add-on DHL Express
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "DHL Express" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de 10$ USD et approuvez le paiement dans Shopify Backend.
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
                Cliquez sur les trois points à côté de "DHL Express" et sélectionnez <strong>Activer</strong>.
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
                Accéder à la configuration DHL Express
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration DHL Express</strong> apparaît dans la section <strong>Configuration</strong> 
                de votre tableau de bord. Cliquez sur <strong>Configurer l'expédition</strong>.
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
                Saisir les identifiants DHL Express
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Remplissez les champs suivants avec les informations de votre compte DHL :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li><strong>Mode Sandbox</strong> : Activez pour les tests (les étiquettes ne sont pas générées)</li>
                <li><strong>Génération automatique d'étiquette</strong> : Génère l'étiquette lors de l'exécution</li>
                <li><strong>Message Reference Key</strong> : Clé de référence unique (28-32 caractères)</li>
                <li><strong>Site ID</strong> : Votre identifiant de site DHL</li>
                <li><strong>Mot de passe</strong> : Votre mot de passe DHL</li>
                <li><strong>Numéro de compte expéditeur</strong> : Votre numéro de compte DHL</li>
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
                Configurer les services domestiques et internationaux
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Services domestiques :</strong>
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li>Same Day (Jour même)</li>
                <li>Domestic Express (Express domestique)</li>
                <li>Express 12:00 (Livraison avant 12h)</li>
                <li>Express Worldwide (Express mondial)</li>
              </ul>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Services internationaux :</strong>
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li>Express Worldwide</li>
                <li>Medical Express</li>
                <li>Express 12:00</li>
                <li>Express 10:30</li>
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
                }}>4</span>
                Options générales
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Usage :</strong> "Fulfillment only" ou "Both (Fulfillment + Shipping)"
              </p>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Unité de poids :</strong> Kilogramme (KG) ou Livre (LB)
              </p>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Unité de longueur :</strong> Centimètre (CM) ou Pouce (IN)
              </p>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Frais d'étiquette pris en charge par :</strong> Administrateur ou Vendeur
              </p>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Jours d'enlèvement :</strong> Nombre minimum de jours avant enlèvement
              </p>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                <strong>Heure d'enlèvement :</strong> Créneaux horaires (Heure Pacifique PT)
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
                }}>5</span>
                Autoriser les vendeurs à utiliser leurs identifiants
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Activez cette option pour permettre aux vendeurs de saisir leurs propres identifiants DHL Express.
                Un menu <strong>Configuration DHL Express</strong> apparaîtra alors sur le portail vendeur.
              </p>
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
                Activer DHL Express
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Connectez-vous à votre <strong>espace vendeur</strong>, puis :
              </p>
              <ol style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong></li>
                <li>Activez DHL Express</li>
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
                Configurer les identifiants (si autorisé)
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Si l'administrateur a autorisé les vendeurs à utiliser leur propre compte, allez dans 
                <strong>Configuration</strong> → <strong>Configuration DHL Express</strong> et saisissez :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Site ID</li>
                <li>Mot de passe</li>
                <li>Numéro de compte expéditeur</li>
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
                }}>3</span>
                Configuration des colis et enlèvements
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration globale</strong> pour définir :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Les dimensions et poids des colis par défaut</li>
                <li>Les jours d'enlèvement souhaités</li>
                <li>Les créneaux horaires d'enlèvement</li>
              </ul>
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
          </section>

          {/* Section 6: Services DHL Express */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🚚 Services DHL Express
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🇫🇷</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Services domestiques</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Same Day</strong> : Livraison le jour même</li>
                    <li><strong>Domestic Express</strong> : Express national</li>
                    <li><strong>Express 12:00</strong> : Livraison avant 12h</li>
                    <li><strong>Express Worldwide</strong> : Express mondial</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌍</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Services internationaux</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Express Worldwide</strong> : Express international</li>
                    <li><strong>Medical Express</strong> : Pour envois médicaux</li>
                    <li><strong>Express 12:00</strong> : Livraison avant 12h</li>
                    <li><strong>Express 10:30</strong> : Livraison avant 10h30</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Services premium</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Express 10:30</strong> : Livraison ultra-rapide</li>
                    <li><strong>Express 12:00</strong> : Livraison matinale</li>
                    <li><strong>Same Day</strong> : Livraison le jour même</li>
                  </ul>
                  <p style={{ marginTop: '12px', fontSize: '13px', color: styles.textLight }}>
                    * Les délais varient selon la destination et le service choisi.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Génération d'étiquettes */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
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
                <li>Sélectionnez <strong>DHL Express</strong> comme méthode d'expédition</li>
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

          {/* Section 8: Enlèvement programmé */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⏰ Enlèvement programmé
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des enlèvements
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent planifier des enlèvements DHL Express directement depuis l'application.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px', marginBottom: '16px' }}>
                <li><strong>Jours d'enlèvement minimum</strong> : Nombre de jours de délai avant enlèvement</li>
                <li><strong>Créneaux horaires</strong> : Disponibles selon l'heure Pacifique (PT)</li>
                <li>Les créneaux sont affichés en heure locale après conversion</li>
              </ul>
              <div style={{
                background: '#fff3cd',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⏰ <strong>Note :</strong> Les créneaux horaires sont basés sur l'heure Pacifique (PT), 
                  qui est 7 heures en retard par rapport à l'heure que vous choisissez.
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
                  Les clients voient les tarifs DHL Express calculés dynamiquement selon le poids, les dimensions et la destination.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Choix du service</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Au checkout, les clients peuvent choisir parmi les services DHL configurés 
                  (Express, Same Day, etc.) selon leurs besoins de livraison.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📍</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Suivi des colis</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients reçoivent un email avec le numéro de suivi DHL dès que la commande est expédiée.
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
                  Quels sont les délais de livraison avec DHL Express ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les délais varient selon le service : Express 10:30 (livraison avant 10h30), Express 12:00 (avant 12h), 
                  Express Worldwide (1-3 jours ouvrables). Les délais peuvent varier selon la destination.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir mes identifiants DHL Express ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Contactez DHL Express pour ouvrir un compte expéditeur. Ils vous fourniront un Site ID, 
                  un mot de passe et un numéro de compte. Pour le mode test, vous pouvez obtenir des identifiants 
                  de test auprès du support DHL.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils utiliser leur propre compte DHL ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! L'administrateur peut activer l'option permettant aux vendeurs de saisir leurs propres 
                  identifiants DHL Express. Chaque vendeur pourra alors gérer ses expéditions avec son compte.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre les services domestiques et internationaux ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les services domestiques sont pour les expéditions à l'intérieur du même pays. 
                  Les services internationaux sont pour les expéditions transfrontalières avec des options 
                  spécifiques comme Medical Express pour les envois médicaux.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment configurer la Message Reference Key ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  La Message Reference Key doit être une chaîne unique de 28 à 32 caractères. Elle permet de tracer 
                  facilement chaque message d'expédition. Utilisez une combinaison de lettres, chiffres et symboles.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les enlèvements sont-ils automatiques ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les vendeurs doivent programmer les enlèvements dans la configuration DHL Express. 
                  Ils peuvent définir les jours et créneaux horaires souhaités. Les enlèvements se feront 
                  selon cette programmation.
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
              et l'optimisation de vos expéditions DHL Express.
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
                📚 Documentation DHL Express
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
