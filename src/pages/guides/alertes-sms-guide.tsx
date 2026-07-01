import React from 'react';
import { Link } from 'react-router-dom';

export default function AlertesSmsGuide() {
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
    smsBlue: '#0ea5e9',
    smsGreen: '#10b981',
    smsLight: '#e0f2fe'
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
          background: `linear-gradient(135deg, ${styles.smsBlue} 0%, ${styles.smsGreen} 100%)`,
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
            📱💬
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
            Guide d'utilisation - Alertes SMS
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Recevez des notifications SMS et appels vocaux pour les nouvelles commandes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📱 SMS automatiques</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📞 Appels vocaux IVR</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Notifications en temps réel</span>
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
              'Configuration des passerelles SMS',
              'Configuration Clockwork',
              'Configuration Twilio',
              'Configuration SMS',
              'Configuration des contacts',
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
              📱 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Alertes SMS</strong> intègre des passerelles SMS (Clockwork et Twilio) avec votre marketplace Shopify. 
              L'administrateur et les vendeurs reçoivent des notifications par SMS et/ou appels vocaux (IVR) pour les nouvelles commandes. 
              Cette fonctionnalité remplace les notifications par email uniquement.
            </p>
            <div style={{
              background: styles.smsLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.smsBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Deux passerelles sont disponibles : <strong>Clockwork</strong> pour les SMS, 
                et <strong>Twilio</strong> pour les SMS et les appels vocaux (IVR). Les frais de chaque passerelle sont indépendants 
                et facturés par le fournisseur.
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
                <li>Frais supplémentaires de <strong>5$ USD par mois</strong> pour l'add-on Alertes SMS</li>
                <li>Compte <strong>Clockwork</strong> ou <strong>Twilio</strong> selon la passerelle choisie</li>
                <li>Les frais d'envoi SMS/appels sont facturés séparément par le fournisseur</li>
                <li>Les numéros de téléphone doivent être au <strong>format international</strong> (sans + ni 0)</li>
              </ul>
            </div>

            <div style={{
              background: styles.warning + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Points importants
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Les numéros doivent être au format international : <strong>33123456789</strong> (sans +33)</li>
                <li>Pour Twilio, vous devez ajouter les localisations géographiques des numéros cibles</li>
                <li>Le nombre de SMS dépend du plan choisi chez le fournisseur</li>
                <li>Les frais des passerelles sont <strong>indépendants</strong> et en plus des frais de l'add-on</li>
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
                Depuis le tableau de bord administrateur, allez dans la section <strong>Modules complémentaires</strong> (Feature Apps).
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
                Activer l'add-on Alertes SMS
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Recherchez "SMS Alert" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>5$ USD</strong> et approuvez le paiement dans Shopify Backend.
              </p>
            </div>
          </section>

          {/* Section 4: Configuration des passerelles SMS */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔌 Configuration des passerelles SMS
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Accès aux paramètres
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Commandes</strong> → <strong>Paramètres des passerelles SMS</strong> (SMS Gateway Settings).
              </p>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Deux passerelles sont disponibles :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Clockwork</strong> : Pour l'envoi de SMS automatiques</li>
                <li><strong>Twilio</strong> : Pour les SMS et les appels vocaux (IVR)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Vous pouvez activer l'une ou l'autre, ou les deux passerelles simultanément.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Configuration Clockwork */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⏰ Configuration Clockwork
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Activation de Clockwork
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans <strong>Paramètres des passerelles SMS</strong>, cliquez sur les trois points "..." à côté de Clockwork</li>
                <li>Cliquez sur <strong>Activer</strong></li>
                <li>Entrez votre <strong>clé API Clockwork</strong></li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  🔑 Comment obtenir la clé API Clockwork ?
                </h4>
                <ol style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Créez un compte sur <strong>Clockwork</strong> (clockworksms.com)</li>
                  <li>Choisissez un plan adapté à vos besoins</li>
                  <li>Dans votre tableau de bord, récupérez votre <strong>clé API</strong></li>
                </ol>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration Twilio */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📞 Configuration Twilio
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Activation de Twilio
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans <strong>Paramètres des passerelles SMS</strong>, cliquez sur les trois points "..." à côté de Twilio</li>
                <li>Cliquez sur <strong>Activer</strong></li>
                <li>Entrez votre <strong>Twilio SID</strong> et <strong>Auth Key</strong></li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  🔑 Comment obtenir les identifiants Twilio ?
                </h4>
                <ol style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Connectez-vous à votre compte <strong>Twilio</strong></li>
                  <li>Dans le tableau de bord, récupérez le <strong>Account SID</strong> et l'<strong>Auth Token</strong></li>
                </ol>
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
                Configuration Twilio avancée
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après avoir entré les clés, configurez les paramètres supplémentaires :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration SMS Twilio</strong></li>
                <li>Entrez le <strong>numéro de contact Twilio</strong> (au format international, sans +)</li>
                <li>Activez <strong>Twilio SMS</strong> pour les notifications par SMS</li>
                <li>Activez <strong>Twilio Call</strong> pour les appels vocaux automatiques</li>
                <li>Entrez le <strong>texte de synthèse vocale</strong> (text to speech) pour les appels</li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.smsLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le numéro de contact doit être <strong>enregistré sur Twilio</strong>. 
                  Vous pouvez utiliser un numéro Twilio ou enregistrer votre propre numéro.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Configuration SMS */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚙️ Configuration des messages SMS
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Paramètres des messages
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Commandes</strong> → <strong>Paramètres SMS</strong> (SMS Settings).
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Order notification to seller</strong> : Activez/désactivez les notifications aux vendeurs</li>
                <li><strong>From Name</strong> : Nom de l'expéditeur (ex: Demo Store Admin)</li>
                <li><strong>Content</strong> : Contenu du SMS (personnalisable selon la passerelle)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Personnalisez le contenu des SMS avec des variables comme le numéro de commande, 
                  le nom du client, etc.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Configuration des contacts */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📇 Configuration des contacts
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Numéro de l'administrateur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour le <strong>Clockwork Gateway</strong>, l'administrateur doit entrer son numéro de contact :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration générale</strong></li>
                <li>Entrez le numéro avec <strong>indicatif pays, sans + et sans 0</strong></li>
                <li>Format : 33123456789 (pour la France)</li>
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
                Numéro des vendeurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Chaque vendeur doit configurer son numéro de téléphone pour recevoir les notifications :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Profil</strong> → <strong>Mon compte</strong></li>
                <li>Entrez le numéro de contact (format international, sans +)</li>
                <li>Sauvegardez les modifications</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Format requis :</strong> Les numéros doivent être au format international, 
                  sans le signe + et sans le 0 initial. Exemple pour la France : 33123456789
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
                  Quelles sont les passerelles SMS disponibles ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Deux passerelles sont intégrées : <strong>Clockwork</strong> pour les SMS uniquement, et <strong>Twilio</strong> 
                  pour les SMS et les appels vocaux (IVR). Vous pouvez activer l'une ou l'autre, ou les deux.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien coûte l'envoi des SMS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les frais d'envoi des SMS et des appels sont <strong>indépendants</strong> de l'add-on. 
                  Vous payez votre fournisseur (Clockwork ou Twilio) selon son plan tarifaire. 
                  L'add-on Alertes SMS coûte 5$ USD par mois en supplément.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir une clé API Clockwork ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Créez un compte sur clockworksms.com, choisissez un plan, puis récupérez votre clé API dans le tableau de bord.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir un numéro Twilio ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Connectez-vous à Twilio, allez dans Programmable Voice → Numbers. Vous pouvez soit acheter un numéro Twilio, 
                  soit enregistrer votre propre numéro (Manage Numbers).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quel est le format requis pour les numéros de téléphone ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les numéros doivent être au <strong>format international sans le signe + et sans le 0 initial</strong>. 
                  Exemples : 33123456789 (France), 14155552671 (USA), 442071234567 (Royaume-Uni).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je envoyer des SMS vers des numéros étrangers ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, mais avec Twilio, vous devez ajouter les <strong>localisations géographiques</strong> des pays cibles 
                  dans les paramètres de votre compte Twilio.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si je n'ai pas de numéro enregistré ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Sans numéro de téléphone configuré, les vendeurs et l'administrateur ne recevront pas les notifications SMS/appels. 
                  Il est obligatoire d'entrer un numéro valide pour recevoir les alertes.
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
              et l'optimisation de vos alertes SMS.
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
                📚 Documentation Alertes SMS
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
