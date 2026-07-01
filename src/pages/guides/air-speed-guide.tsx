import React from 'react';
import { Link } from 'react-router-dom';

export default function AirSpeedGuide() {
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
            ✈️⚡
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
            Guide d'utilisation - AirSpeed Shipping
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Gérez vos expéditions en priorité - Notification du transporteur, exécution des commandes et étiquettes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📢 Notification du transporteur</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Priorité d'expédition maximale</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏷️ Génération automatique d'étiquettes</span>
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
              'Notification du transporteur',
              'Exécution des commandes',
              'Génération d\'étiquettes',
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
              L'add-on <strong>AirSpeed Shipping</strong> est une solution d'expédition prioritaire qui permet aux administrateurs 
              et aux vendeurs de notifier directement le transporteur lorsqu'une commande est prête à être expédiée. 
              Cette fonctionnalité se distingue par sa priorité d'exécution maximale parmi toutes les méthodes d'expédition.
            </p>
            <div style={{
              background: styles.cyanLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.cyan}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> AirSpeed Shipping est disponible uniquement pour l'exécution des commandes 
                (fulfillment). Il offre la priorité la plus élevée parmi toutes les méthodes d'expédition disponibles.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on AirSpeed Shipping</li>
                <li>Compte transporteur AirSpeed avec identifiants API</li>
                <li>Numéro de téléphone client obligatoire à la commande</li>
              </ul>
            </div>

            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.red}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚠️ <strong>Important :</strong> Le numéro de téléphone du client doit être obligatoire lors du passage en caisse.
                Configurez cela dans Shopify Backend → Settings → Checkout → Form Options → Rendre le numéro de téléphone obligatoire.
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
                Accéder à la section des modules complémentaires
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans votre tableau de bord administrateur, puis cliquez sur 
                <strong>Modules complémentaires</strong> dans le menu principal.
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
                Localiser et activer AirSpeed Shipping
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Recherchez l'add-on <strong>AirSpeed Shipping</strong> dans la liste et cliquez sur 
                <strong>Activer</strong>. Acceptez les frais mensuels de 10$ USD en cliquant sur 
                <strong>Accepter</strong>.
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
                Valider les frais supplémentaires
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Une redirection vers Shopify Backend s'effectue. Cliquez sur 
                <strong>Approuver les frais</strong> pour finaliser l'activation de l'add-on.
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
                Accéder à la configuration AirSpeed
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration AirSpeed Shipping</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord.
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
                Saisir les identifiants AirSpeed
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Remplissez les champs suivants avec les informations fournies par AirSpeed :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li><strong>Client ID AirSpeed</strong> : Votre identifiant client</li>
                <li><strong>Token ID</strong> : Votre jeton d'authentification</li>
                <li><strong>Préfixe du bordereau d'envoi</strong> : Contactez AirSpeed pour obtenir ce préfixe</li>
              </ul>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  🔧 Mode test : Activez le <strong>Mode Sandbox</strong> pour tester la fonctionnalité avant la mise en production.
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
                Configuration terminée
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Une fois la configuration enregistrée, les fonctionnalités AirSpeed sont prêtes à être utilisées 
                par vous et vos vendeurs.
              </p>
            </div>
          </section>

          {/* Section 5: Notification du transporteur */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📢 Notification du transporteur
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Notification côté administrateur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    L'administrateur peut notifier le transporteur directement depuis le panneau d'administration :
                  </p>
                  <ol style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                    <li>Sélectionnez la commande concernée</li>
                    <li>Cliquez sur <strong>Voir</strong> dans le menu Actions</li>
                    <li>Cliquez sur le bouton <strong>Notifier le transporteur</strong></li>
                  </ol>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Notification côté vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Si l'administrateur n'a pas notifié le transporteur, le vendeur peut le faire :
                  </p>
                  <ol style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                    <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                    <li>Cliquez sur <strong>Voir</strong> à côté de la commande</li>
                    <li>Cliquez sur <strong>Notifier le transporteur</strong></li>
                  </ol>
                </div>
              </div>
            </div>

            <div style={{
              background: styles.accentLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.accent}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                📢 <strong>Note :</strong> Une fois la notification envoyée, le statut est mis à jour à la fois 
                côté administrateur et côté vendeur. Le transporteur est informé que la commande est prête à être récupérée.
              </p>
            </div>
          </section>

          {/* Section 6: Exécution des commandes */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ✅ Exécution des commandes (Fulfillment)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure d'exécution pour le vendeur
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Une fois la commande notifiée, le vendeur voit l'option <strong>Exécuter</strong></li>
                <li>Cliquez sur <strong>Exécuter les articles</strong></li>
                <li>La méthode <strong>AirSpeed Shipping</strong> apparaît automatiquement comme méthode d'expédition</li>
                <li>Le <strong>numéro de suivi</strong> et la <strong>méthode d'expédition</strong> sont automatiquement renseignés</li>
                <li>Cliquez sur <strong>Exécuter les articles</strong> pour finaliser</li>
              </ol>
            </div>

            <div style={{
              background: styles.success + '20',
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.success}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚡ <strong>Avantage exclusif :</strong> AirSpeed Shipping a la priorité d'exécution la plus élevée 
                parmi toutes les méthodes d'expédition. Pas besoin de saisir manuellement le numéro de suivi 
                ou la méthode d'expédition - tout est automatique !
              </p>
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
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Générer une étiquette pour une commande exécutée
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                <li>Sélectionnez la commande <strong>exécutée</strong></li>
                <li>Cliquez sur le bouton <strong>Voir</strong> dans le menu Actions</li>
                <li>Cliquez sur <strong>Générer l'étiquette d'expédition</strong></li>
                <li>L'étiquette est automatiquement téléchargée au format PDF</li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Informations sur l'étiquette</h4>
                <p style={{ fontSize: '13px', color: styles.textLight, margin: 0 }}>
                  L'étiquette générée contient toutes les informations nécessaires à l'expédition : adresse d'expédition, 
                  adresse de retour, code-barres, numéro de suivi et instructions spéciales pour le transporteur.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Affichage frontal */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖥️ Configuration du formulaire de paiement
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📞</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Numéro de téléphone obligatoire</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Pour qu'AirSpeed Shipping fonctionne correctement, le numéro de téléphone du client doit être 
                  obligatoire au moment du paiement. Configurez cela dans :
                </p>
                <code style={{ fontSize: '12px', display: 'block', marginTop: '12px', background: '#e2e8f0', padding: '8px', borderRadius: '8px' }}>
                  Shopify Backend → Settings → Checkout → Form Options → Shipping Address Phone Number → Required
                </code>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Expérience client</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Le client n'a pas d'action supplémentaire à effectuer. Une fois la commande passée, 
                  le transporteur est automatiquement notifié lorsque la commande est prête.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📧</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Notifications clients</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Le client reçoit une notification par email dès que la commande est exécutée, 
                  avec le numéro de suivi pour suivre son colis.
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
                  Qu'est-ce qui rend AirSpeed Shipping différent des autres méthodes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  AirSpeed Shipping a la priorité d'exécution la plus élevée. De plus, le numéro de suivi et 
                  la méthode d'expédition sont automatiquement renseignés - aucune saisie manuelle n'est requise !
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Qui peut notifier le transporteur ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur et le vendeur peuvent tous deux notifier le transporteur. 
                  Si l'administrateur notifie en premier, le vendeur n'aura qu'à exécuter la commande.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir mon préfixe de bordereau d'envoi ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le préfixe de bordereau d'envoi est fourni directement par AirSpeed. Contactez leur support 
                  pour obtenir cette information après avoir créé votre compte.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je tester avant d'activer en production ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Activez le <strong>Mode Sandbox</strong> dans la configuration AirSpeed pour tester 
                  l'intégralité du flux sans frais réels. Idéal pour valider votre configuration.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les frais d'expédition sont-ils inclus dans l'abonnement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'abonnement mensuel de 10$ USD couvre l'accès à la fonctionnalité. Les frais d'expédition 
                  réels sont facturés séparément par le transporteur AirSpeed selon les tarifs en vigueur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire si le numéro de suivi n'apparaît pas automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vérifiez d'abord que la commande a bien été notifiée au transporteur. Si le problème persiste, 
                  vérifiez les identifiants API dans la configuration AirSpeed et assurez-vous que le mode Sandbox 
                  est désactivé en production.
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
              et l'optimisation de vos expéditions AirSpeed.
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
                📚 Documentation AirSpeed
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
