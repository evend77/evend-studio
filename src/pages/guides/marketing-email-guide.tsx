import React from 'react';
import { Link } from 'react-router-dom';

export default function MarketingEmailGuide() {
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
    klaviyoOrange: '#f9a825',
    klaviyoPink: '#e91e63',
    klaviyoLight: '#fff3e0'
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
        
        {/* En-tête avec dégradé orange/rose */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.klaviyoOrange} 0%, ${styles.klaviyoPink} 100%)`,
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
            📧📈
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
            Guide d'utilisation - Marketing par email
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Automatisez vos campagnes email marketing avec l'intégration Klaviyo
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📧 Email marketing</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation Klaviyo</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Campagnes automatisées</span>
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
              'Obtention des clés API Klaviyo',
              'Synchronisation des vendeurs',
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
              📧 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Marketing par email</strong> intègre Klaviyo avec votre marketplace Shopify. 
              Cette intégration vous permet de connecter votre compte Klaviyo à l'application Multivendor et 
              de transférer automatiquement les profils des vendeurs vers Klaviyo pour créer des campagnes 
              email marketing ciblées.
            </p>
            <div style={{
              background: styles.klaviyoLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.klaviyoOrange}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Lorsqu'un administrateur crée un compte vendeur ou qu'un vendeur s'inscrit, 
                son profil est automatiquement créé dans Klaviyo. Les modifications apportées au profil vendeur 
                sont également synchronisées (mais pas l'inverse).
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
                <li>Frais supplémentaires pour l'add-on Marketing par email (selon plan)</li>
                <li>Compte <strong>Klaviyo</strong> actif</li>
                <li>Clé API Klaviyo avec accès complet (Full Access Key)</li>
              </ul>
            </div>

            <div style={{
              background: styles.success + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.success}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.success }}>
                🎯 Fonctionnalités
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>✅ Synchronisation automatique des profils vendeurs vers Klaviyo</li>
                <li>✅ Mise à jour automatique des informations vendeurs</li>
                <li>✅ Visualisation de l'ID Klaviyo dans les détails du vendeur</li>
                <li>✅ Création de campagnes email ciblées pour les vendeurs</li>
                <li>✅ Envoi de newsletters, promotions et communications</li>
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
                Depuis le tableau de bord administrateur, cliquez sur les trois points (⋮) dans le coin supérieur droit, 
                puis sélectionnez <strong>Feature Apps</strong>.
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
                Recherchez "Email Marketing" et cliquez sur le bouton <strong>Activer</strong>.
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
                Configuration Email Marketing
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois l'add-on activé, un nouveau menu apparaît : 
                <strong>Configuration</strong> → <strong>Configuration Email Marketing</strong>.
              </p>
              
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Activez <strong>KLAVIYO for email marketing</strong></li>
                <li>Entrez le <strong>KLAVIYO PRIVATE API KEY NAME</strong> (Nom de la clé API)</li>
                <li>Entrez le <strong>KLAVIYO PRIVATE API KEY</strong> (Clé API privée)</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ul>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Après la configuration, lorsque l'administrateur crée un compte vendeur 
                  ou qu'un vendeur s'inscrit, le profil est automatiquement créé dans Klaviyo.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Obtention des clés API Klaviyo */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des clés API Klaviyo
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
                <li>Dans la configuration Email Marketing, cliquez sur <strong>"By klaviyo"</strong></li>
                <li>Vous êtes redirigé vers la page de connexion Klaviyo</li>
                <li>Connectez-vous à votre compte Klaviyo</li>
                <li>Dans le tableau de bord Klaviyo, allez dans <strong>Account → Settings → API Keys</strong></li>
                <li>Cliquez sur <strong>Create Private API Key</strong></li>
                <li>Sélectionnez <strong>Full Access Key</strong> (accès complet)</li>
                <li>Donnez un nom à votre clé API privée</li>
                <li>Cliquez sur <strong>CREATE</strong></li>
                <li>La clé API privée est générée et affichée</li>
                <li>Copiez le <strong>nom de la clé</strong> et la <strong>clé API</strong></li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📋 Exemple
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  <strong>KLAVIYO PRIVATE API KEY NAME :</strong> multivendor_marketplace_key<br />
                  <strong>KLAVIYO PRIVATE API KEY :</strong> pk_1234567890abcdefghijklmnopqrstuv
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> Assurez-vous de sélectionner <strong>"Full Access Key"</strong> 
                  pour que la synchronisation fonctionne correctement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Synchronisation des vendeurs */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Synchronisation des vendeurs
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Transfert automatique des profils
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois la configuration terminée, la synchronisation fonctionne automatiquement :
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  👤 Création de compte vendeur
                </h4>
                <ul style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Quand l'administrateur crée un compte vendeur → le profil est créé dans Klaviyo</li>
                  <li>Quand un vendeur s'inscrit → le profil est automatiquement créé dans Klaviyo</li>
                </ul>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  ✏️ Modification de profil
                </h4>
                <ul style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Les modifications apportées dans l'application sont synchronisées vers Klaviyo</li>
                  <li><strong>Attention :</strong> Les modifications dans Klaviyo ne sont PAS synchronisées vers l'application</li>
                </ul>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  🔍 Visualisation de l'ID Klaviyo
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Dans les détails du vendeur (page d'édition), vous pouvez voir l'ID Klaviyo associé au profil :
                </p>
                <ul style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li>Allez dans <strong>Vendeurs → Liste des vendeurs → Modifier</strong></li>
                  <li>L'ID Klaviyo est affiché dans les informations du vendeur</li>
                </ul>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Résultat :</strong> Vous pouvez maintenant créer des campagnes email marketing ciblées 
                  dans Klaviyo en utilisant les segments de vendeurs de votre marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: FAQ */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
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
                  Qu'est-ce que Klaviyo et pourquoi l'utiliser ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Klaviyo est une plateforme d'email marketing leader qui permet de créer des campagnes personnalisées, 
                  des flux automatisés et des segments d'audience avancés. Idéal pour communiquer efficacement avec vos vendeurs.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les modifications dans Klaviyo sont-elles synchronisées vers l'application ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, la synchronisation est <strong>unidirectionnelle</strong>. Les modifications dans l'application 
                  sont envoyées vers Klaviyo, mais les modifications dans Klaviyo ne sont pas répercutées dans l'application.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quel type de clé API Klaviyo dois-je utiliser ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vous devez utiliser une <strong>Private API Key avec Full Access</strong> (accès complet) 
                  pour permettre la création et la mise à jour des profils vendeurs.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils se désinscrire des emails ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, Klaviyo gère automatiquement les désinscriptions. Les vendeurs qui se désinscrivent 
                  ne recevront plus d'emails de votre part via Klaviyo.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien coûte l'intégration Klaviyo ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'add-on Marketing par email a un coût supplémentaire par mois. Les frais d'utilisation de Klaviyo 
                  sont séparés et dépendent du plan choisi directement auprès de Klaviyo.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Où puis-je voir l'ID Klaviyo d'un vendeur ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'ID Klaviyo est visible dans la page d'édition du vendeur : 
                  <strong>Vendeurs → Liste des vendeurs → Modifier</strong>.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je créer des segments personnalisés dans Klaviyo ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, une fois les profils vendeurs synchronisés, vous pouvez créer des segments dans Klaviyo 
                  basés sur les données des vendeurs (date d'inscription, produits vendus, etc.) pour des campagnes ciblées.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Support */}
          <section id="section-7" style={{
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
              et l'optimisation de vos campagnes email marketing.
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
                📚 Documentation Marketing par email
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
