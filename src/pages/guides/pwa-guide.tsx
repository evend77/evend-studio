import React from 'react';
import { Link } from 'react-router-dom';

export default function PwaGuide() {
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
    pwaBlue: '#3b82f6',
    pwaPurple: '#8b5cf6',
    pwaLight: '#eef2ff'
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
          background: `linear-gradient(135deg, ${styles.pwaBlue} 0%, ${styles.pwaPurple} 100%)`,
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
            📱🔄
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
            Guide d'utilisation - PWA
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Transformez l'expérience mobile de vos vendeurs avec une application web progressive
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📱 Application mobile</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔔 Notifications push</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Expérience native</span>
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
              'Obtention des clés Firebase',
              'Configuration du manifest',
              'Gestion des notifications',
              'Envoi de notifications',
              'Expérience vendeur',
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
              L'add-on <strong>PWA (Progressive Web App)</strong> permet d'activer les fonctionnalités d'application web progressive 
              pour vos vendeurs. Grâce à cette technologie, les vendeurs peuvent accéder à leur tableau de bord depuis leur mobile 
              avec une expérience proche d'une application native, et recevoir des notifications push en temps réel.
            </p>
            <div style={{
              background: styles.pwaLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.pwaBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'add-on PWA permet d'envoyer des notifications push automatiques et manuelles 
                aux vendeurs. Actuellement, l'application n'est <strong>pas compatible avec les appareils iOS</strong>.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on PWA</li>
                <li><strong>Domaine personnalisé avec SSL</strong> pour chaque vendeur (obligatoire)</li>
                <li>Compte <strong>Firebase</strong> (Google) pour les clés de notification</li>
                <li><strong>Non compatible</strong> avec les appareils iOS</li>
              </ul>
            </div>

            <div style={{
              background: styles.warning + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Conditions importantes
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>SSL requis :</strong> Chaque vendeur doit avoir un domaine personnalisé avec certificat SSL</li>
                <li><strong>iOS non supporté :</strong> La PWA ne fonctionne pas sur les appareils Apple</li>
                <li><strong>Firebase nécessaire :</strong> Les clés de notification proviennent de Firebase</li>
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
                Depuis le tableau de bord administrateur, cliquez sur les trois points (⋮) dans le coin supérieur droit 
                et sélectionnez <strong>Feature Apps</strong>.
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
                Activer l'add-on PWA
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Recherchez "PWA" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>10$ USD</strong> et approuvez le paiement dans Shopify Backend.
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
                Configuration PWA
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration PWA</strong>.
              </p>
              
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Sender ID</strong> : ID d'expéditeur Firebase</li>
                <li><strong>Server Key</strong> : Clé serveur Firebase</li>
                <li><strong>Application Public Server Key</strong> : Clé publique VAPID</li>
                <li><strong>Application Private Server Key</strong> : Clé privée VAPID</li>
                <li><strong>Push Notification</strong> : Activez pour envoyer des notifications</li>
              </ul>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Une fois les clés saisies, deux nouvelles options apparaissent : 
                  <strong>Gérer le manifest</strong> et <strong>Notifications push</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Obtention des clés Firebase */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des clés Firebase
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure d'obtention
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Créez un compte sur <strong>Firebase</strong> (firebase.google.com)</li>
                <li>Créez un nouveau projet</li>
                <li>Ajoutez une application web au projet</li>
                <li>Dans les paramètres du projet, allez dans <strong>Cloud Messaging</strong></li>
                <li>Récupérez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Sender ID</strong> (ID d'expéditeur)</li>
                  <li><strong>Server Key</strong> (Clé serveur)</li>
                </ul>
                <li>Générez les clés VAPID pour les notifications web</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.pwaLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Les clés Firebase sont essentielles pour l'envoi de notifications push. 
                  Conservez-les précieusement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration du manifest */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Configuration du manifest
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Personnalisation de l'application
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Cliquez sur <strong>Gérer le manifest</strong> pour configurer l'apparence de la PWA :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Nom du manifest</strong> : Le nom de l'application</li>
                <li><strong>Tagline</strong> : Slogan ou description courte</li>
                <li><strong>Couleur d'arrière-plan</strong> : Couleur de l'écran de démarrage</li>
                <li><strong>Icône</strong> : Logo de l'application (téléchargez une image)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.pwaLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le manifest décrit votre PWA au navigateur. Ces valeurs sont utilisées 
                  pour l'écran d'accueil et l'expérience d'installation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Gestion des notifications */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔔 Gestion des notifications push
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Notifications automatiques
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Depuis la configuration PWA, vous pouvez activer les notifications automatiques pour :
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {[
                  'Commande passée',
                  'Mise à jour produit',
                  'Modification du vendeur',
                  'Question client',
                  'Approbation produit',
                  'Paiement vendeur',
                  'Avis produit',
                  'Badge attribué'
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: styles.textLight
                  }}>
                    <span>✅</span> {item}
                  </div>
                ))}
              </div>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📝 Notifications manuelles
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight, marginBottom: '12px' }}>
                  Cliquez sur <strong>Notifications push</strong> pour créer des notifications personnalisées :
                </p>
                <ol style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Cliquez sur <strong>+ Ajouter un message</strong></li>
                  <li>Entrez le <strong>titre</strong> et la <strong>description</strong></li>
                  <li>Téléchargez une <strong>icône</strong> pour la notification</li>
                  <li>Sauvegardez le message</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Section 8: Envoi de notifications */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📤 Envoi de notifications
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure d'envoi
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans la liste des notifications, cliquez sur <strong>Envoyer</strong></li>
                <li>Sélectionnez les destinataires :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Tous les vendeurs</strong> : Envoi à tous</li>
                  <li><strong>Vendeur spécifique</strong> : Entrez le nom du vendeur</li>
                </ul>
                <li>Cliquez sur <strong>Envoyer</strong> pour diffuser la notification</li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Résultat :</strong> Les vendeurs reçoivent la notification sur leur appareil mobile 
                  (Android) et peuvent y accéder depuis leur tableau de bord.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Expérience vendeur */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📱 Expérience vendeur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Utilisation de la PWA
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois la PWA configurée, les vendeurs peuvent :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Accéder à leur tableau de bord depuis leur mobile</li>
                <li>Installer l'application sur leur écran d'accueil</li>
                <li>Recevoir des notifications push en temps réel</li>
                <li>Gérer leurs commandes, produits et paiements</li>
                <li>Répondre aux questions des clients</li>
              </ul>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: styles.accent }}>
                  📲 Installation sur mobile (Android)
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les vendeurs peuvent ajouter la PWA à leur écran d'accueil via le navigateur Chrome : 
                  Menu → "Ajouter à l'écran d'accueil".
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
                  Qu'est-ce qu'une PWA ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Une Progressive Web App (PWA) est une application web qui offre une expérience proche d'une application native, 
                  avec installation sur l'écran d'accueil, notifications push et fonctionnement hors ligne.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Pourquoi la PWA ne fonctionne-t-elle pas sur iOS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Actuellement, les fonctionnalités PWA complètes (notifications push notamment) ne sont pas supportées 
                  par Safari sur iOS. Apple limite certaines fonctionnalités des PWA.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelles sont les conditions pour utiliser la PWA ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Chaque vendeur doit avoir un <strong>domaine personnalisé avec SSL</strong>. Sans cela, la PWA ne peut pas fonctionner.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir les clés Firebase ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Créez un projet sur Firebase, ajoutez une application web, puis récupérez les clés dans 
                  les paramètres de Cloud Messaging.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les notifications automatiques sont-elles configurables ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, l'administrateur peut choisir quels événements déclenchent une notification automatique 
                  (commande, produit, paiement, etc.) et personnaliser le contenu de chaque type de notification.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien coûte l'add-on PWA ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'add-on PWA est proposé à <strong>10$ USD par mois</strong>, en supplément du plan Multivendor Marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils personnaliser leur PWA ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le manifest et l'apparence de la PWA sont configurés par l'administrateur. Les vendeurs bénéficient 
                  de l'expérience unifiée définie au niveau de la marketplace.
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
              et l'optimisation de votre PWA pour les vendeurs.
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
                📚 Documentation PWA
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
