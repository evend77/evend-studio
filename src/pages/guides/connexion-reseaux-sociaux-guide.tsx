import React from 'react';
import { Link } from 'react-router-dom';

export default function SocialMediaLoginGuide() {
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
    facebook: '#1877f2',
    facebookLight: '#e8f0fe',
    google: '#ea4335',
    googleLight: '#fee9e8'
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
          background: `linear-gradient(135deg, ${styles.facebook} 0%, ${styles.google} 100%)`,
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
            🔑🌐
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
            Guide d'utilisation - Connexion réseaux sociaux
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Simplifiez l'inscription et la connexion des vendeurs avec Facebook et Google
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📘 Facebook Login</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔐 Google Login</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Connexion simplifiée</span>
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
              'Configuration Facebook',
              'Configuration Google',
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
              L'add-on <strong>Connexion réseaux sociaux</strong> permet aux vendeurs de se connecter et de s'inscrire 
              à leur tableau de bord vendeur en utilisant leurs comptes Facebook ou Gmail. Cette fonctionnalité simplifie 
              le processus d'inscription et améliore l'expérience utilisateur.
            </p>
            <div style={{
              background: styles.facebookLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.facebook}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> La connexion via réseaux sociaux réduit les frictions à l'inscription 
                et peut augmenter le taux de conversion des vendeurs.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Connexion réseaux sociaux</li>
                <li>Compte développeur Facebook (pour Facebook Login)</li>
                <li>Compte développeur Google (pour Google Login)</li>
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
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "Connexion réseaux sociaux" et cliquez sur le bouton <strong>Activer</strong>.
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
                Accéder à la configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration réseaux sociaux</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord.
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
                Options de configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration réseaux sociaux</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Activer Login avec Facebook</strong> : Activez et saisissez votre Facebook API App ID</li>
                <li><strong>Activer Login avec Gmail</strong> : Activez et saisissez votre Gmail API Client ID et Secret Key</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les identifiants Facebook et Google sont obtenus via leurs plateformes développeur respectives.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Configuration Facebook */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.facebook}`,
              paddingLeft: '20px'
            }}>
              📘 Configuration Facebook Login
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer une application Facebook
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à <strong>https://developers.facebook.com/</strong></li>
                <li>Cliquez sur <strong>Créer une application</strong></li>
                <li>Sélectionnez le type de compte et cliquez sur <strong>Suivant</strong></li>
                <li>Entrez le nom de votre marketplace dans "Display Name"</li>
                <li>Saisissez votre email dans "App Contact Email"</li>
                <li>Cliquez sur <strong>Créer une application</strong></li>
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
                Configurer l'application pour la mise en production
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans le tableau de bord, cliquez sur <strong>Configurer</strong> dans la section Facebook Login</li>
                <li>Cliquez sur <strong>Paramètres de base</strong></li>
                <li>Remplissez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>App Domain : URL de votre admin panel</li>
                  <li>Privacy Policy URL : URL de votre politique de confidentialité</li>
                  <li>Terms of Service URL : URL de vos conditions d'utilisation</li>
                  <li>Catégorie : Sélectionnez la catégorie appropriée</li>
                </ul>
                <li>Cliquez sur <strong>Démarrer la vérification</strong></li>
                <li>Remplissez les informations de contact du responsable de la protection des données</li>
                <li>Cliquez sur <strong>Ajouter une plateforme</strong> et sélectionnez votre plateforme</li>
                <li>Cliquez sur <strong>Suivant</strong> puis <strong>Enregistrer</strong></li>
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
                Autorisations et mise en ligne
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>App Review</strong> → <strong>Permissions & Features</strong></li>
                <li>Pour "email" et "public_profile", cliquez sur <strong>Get Advanced Access</strong></li>
                <li>Allez dans <strong>Facebook Login</strong> → <strong>Paramètres</strong></li>
                <li>Activez <strong>Login with JavaScript SDK</strong></li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
                <li>L'application est maintenant en mode "Live"</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.facebookLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  🔑 <strong>Récupération de l'ID :</strong> Copiez le <strong>Facebook API App ID</strong> depuis le tableau de bord 
                  et collez-le dans la configuration de la marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration Google */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.google}`,
              paddingLeft: '20px'
            }}>
              🔐 Configuration Google Login
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer un projet Google Cloud
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à <strong>https://console.developers.google.com</strong></li>
                <li>Allez dans <strong>API & Services</strong> → <strong>Enabled APIs & services</strong></li>
                <li>Cliquez sur <strong>Créer un projet</strong></li>
                <li>Donnez un nom à votre projet</li>
                <li>Cliquez sur <strong>Créer</strong></li>
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
                Configurer l'écran de consentement OAuth
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>OAuth consent screen</strong></li>
                <li>Vérifiez le nom de l'application et l'email de support</li>
                <li>Ajoutez l'URL de votre site dans "Authorized domain"</li>
                <li>Cliquez sur <strong>Enregistrer et continuer</strong></li>
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
                Créer les identifiants OAuth
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Credentials</strong> → <strong>Créer des identifiants</strong></li>
                <li>Cliquez sur <strong>OAuth Client ID</strong></li>
                <li>Remplissez l'URL de votre admin panel dans "Authorized Javascript origins"</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
                <li>Allez dans <strong>OAuth consent screen</strong> et cliquez sur <strong>Publier l'application</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.googleLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  🔑 <strong>Récupération des identifiants :</strong> Allez dans <strong>Credentials</strong>, 
                  cliquez sur le nom de l'application, copiez le <strong>Client ID</strong> et le <strong>Secret Key</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Affichage frontal */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖥️ Affichage frontal
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📘</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Bouton Facebook</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Un bouton "Se connecter avec Facebook" apparaît sur la page de connexion et d'inscription des vendeurs.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔐</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Bouton Google</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Un bouton "Se connecter avec Google" apparaît sur la page de connexion et d'inscription des vendeurs.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚡</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Connexion rapide</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les vendeurs peuvent s'inscrire et se connecter en un clic, sans avoir à remplir de formulaire.
                </p>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.accentLight,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>
                💡 <strong>Avantage :</strong> La connexion sociale réduit les abandons d'inscription et simplifie l'expérience vendeur.
              </p>
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
                  Pourquoi mon application Facebook doit-elle être en mode "Live" ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Seules les applications en mode "Live" (production) peuvent être utilisées par des utilisateurs réels. 
                  Le mode développement est limité aux comptes de test.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelles sont les autorisations nécessaires pour Facebook ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les autorisations minimales requises sont "email" et "public_profile". Vous devez demander l'accès avancé 
                  pour ces permissions via App Review.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir mon Client ID et Secret Key Google ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Après avoir créé votre projet et configuré l'écran OAuth, allez dans Credentials, créez un OAuth Client ID. 
                  Vous trouverez les identifiants dans la section des identifiants créés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils utiliser les deux méthodes de connexion ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Si vous activez les deux options, les vendeurs peuvent choisir de se connecter avec Facebook ou Google, 
                  selon leur préférence.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si un vendeur utilise déjà son email ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si un vendeur a déjà un compte avec l'email utilisé sur Facebook/Google, le système lie automatiquement 
                  le compte social au compte existant.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  L'application Facebook nécessite-t-elle une vérification ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, pour passer en mode production, vous devez soumettre votre application à la vérification de Facebook. 
                  Le processus peut prendre quelques jours.
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
              et l'optimisation de la connexion via réseaux sociaux.
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
                📚 Documentation Connexion sociale
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
