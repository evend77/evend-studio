import React from 'react';
import { Link } from 'react-router-dom';

export default function ChatGptGuide() {
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
    openaiGreen: '#10a37f',
    openaiBlue: '#4a9eff',
    openaiDark: '#202123',
    openaiLight: '#e8f5ef'
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
        
        {/* En-tête avec dégradé vert/bleu OpenAI */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.openaiGreen} 0%, ${styles.openaiBlue} 100%)`,
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
            🤖✨
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
            Guide d'utilisation - Chat GPT
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Générez automatiquement des descriptions de produits uniques grâce à l'intelligence artificielle
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🤖 IA générative</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>✨ Descriptions uniques</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📝 Optimisation SEO</span>
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
              'Obtention de la clé API OpenAI',
              'Configuration administrateur',
              'Fonctionnement',
              'Utilisation par les vendeurs',
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
              🤖 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Chat GPT</strong> intègre l'API OpenAI avec votre marketplace Shopify, permettant aux administrateurs 
              et aux vendeurs de générer automatiquement des descriptions de produits uniques. Cette fonctionnalité utilise 
              le modèle Davinci d'OpenAI pour produire des descriptions pertinentes basées sur les mots-clés du produit.
            </p>
            <div style={{
              background: styles.openaiLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.openaiGreen}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'IA génère des descriptions <strong>uniques</strong> à chaque utilisation, 
                basées sur le titre et les mots-clés du produit. Idéal pour gagner du temps et optimiser le SEO.
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
                <li>Frais supplémentaires de <strong>15$ USD par mois</strong> pour l'add-on Chat GPT</li>
                <li>Un compte <strong>OpenAI</strong> avec une clé API active</li>
                <li>Le modèle utilisé est <strong>Davinci</strong> (OpenAI ne propose pas encore d'API officielle pour ChatGPT)</li>
              </ul>
            </div>

            <div style={{
              background: '#fff3cd',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Points importants
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Cette fonctionnalité fonctionne <strong>uniquement pour les nouveaux produits</strong></li>
                <li>Ne fonctionne <strong>pas pour les produits existants</strong></li>
                <li>Les descriptions sont générées en fonction du <strong>titre et des mots-clés</strong> du produit</li>
                <li>Chaque génération produit une <strong>description unique</strong></li>
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
                Recherchez "Chat GPT" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>15$ USD</strong> et approuvez le paiement dans Shopify Backend.
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
                Allez dans <strong>Administrateur</strong> → <strong>Produits</strong> → <strong>Configuration Chat GPT</strong> 
                pour configurer l'add-on.
              </p>
            </div>
          </section>

          {/* Section 4: Obtention de la clé API OpenAI */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention de la clé API OpenAI
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Création d'une clé API
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour utiliser l'add-on Chat GPT, vous devez créer une clé API OpenAI. Suivez ces étapes :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Créez un compte sur <strong>openai.com</strong> : <a href="https://openai.com/join/" style={{ color: styles.accent }}>https://openai.com/join/</a></li>
                <li>Connectez-vous à votre compte OpenAI</li>
                <li>Cliquez sur votre nom dans le coin supérieur droit</li>
                <li>Sélectionnez <strong>"API Keys"</strong> dans le menu déroulant</li>
                <li>Cliquez sur <strong>"Create new secret key"</strong></li>
                <li>Copiez la clé affichée à l'écran</li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> La clé API ne s'affiche qu'une seule fois. Conservez-la dans un endroit sécurisé 
                  ou gardez la page ouverte jusqu'à ce que vous l'ayez configurée dans l'application.
                </p>
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
              ⚙️ Configuration administrateur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Paramètres de l'API OpenAI
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après avoir obtenu votre clé API, configurez l'add-on :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Allez dans <strong>Administrateur</strong> → <strong>Produits</strong> → <strong>Configuration Chat GPT</strong></li>
                <li>Collez votre <strong>clé API OpenAI</strong> (OpenAI Secret Key)</li>
                <li>Configurez les paramètres avancés :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Temperature</strong> : Ajuste la créativité des réponses (0 = conservateur, 1 = créatif)</li>
                  <li><strong>Number of Token</strong> : Définit la longueur maximale de la réponse</li>
                </ul>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
                <li>Utilisez le bouton <strong>Réinitialiser</strong> pour restaurer les paramètres par défaut si nécessaire</li>
              </ul>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Conseil :</strong> Une température plus élevée (0.8-1.0) génère des descriptions plus créatives et variées. 
                  Une température plus basse (0.2-0.5) produit des descriptions plus cohérentes et prévisibles.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Fonctionnement */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🧠 Fonctionnement
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Comment l'IA génère les descriptions
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'IA utilise le <strong>titre du produit</strong> et les <strong>mots-clés</strong> que vous fournissez 
                pour générer une description unique. Plus vos mots-clés sont précis, plus la description sera pertinente.
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📝 Exemple
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  <strong>Titre :</strong> "Adidas Shoes 2023"<br />
                  <strong>Description générée :</strong> "Découvrez les nouvelles chaussures Adidas 2023, alliant confort et style. 
                  Conçues pour les athlètes modernes, ces sneakers offrent un amorti exceptionnel et une respirabilité optimale 
                  pour vos entraînements quotidiens."
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✨ <strong>Avantage majeur :</strong> L'IA génère une <strong>description unique à chaque utilisation</strong>, 
                  même avec les mêmes mots-clés. Cela garantit un contenu frais et original pour chaque produit.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Utilisation par les vendeurs */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Utilisation par les vendeurs
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Génération de description lors de la création d'un produit
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent utiliser l'IA pour générer automatiquement la description de leurs nouveaux produits :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Cliquez sur <strong>Ajouter un produit</strong></li>
                <li>Cochez l'option <strong>Activer Chat GPT</strong> (Activate Chat GPT feature)</li>
                <li>Saisissez le <strong>titre du produit</strong> et des <strong>mots-clés</strong> pertinents</li>
                <li>Cliquez sur <strong>Générer la description</strong></li>
                <li>La description est automatiquement créée et affichée dans le champ description</li>
                <li>Vous pouvez modifier la description générée si nécessaire</li>
                <li>Complétez les autres informations du produit</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.openaiLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Pour affiner le résultat, vous pouvez ajouter des mots-clés supplémentaires 
                  dans la description avant de générer. L'IA utilisera ces mots-clés pour créer un contenu plus ciblé.
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Note importante :</strong> Cette fonctionnalité est disponible <strong>uniquement pour les nouveaux produits</strong>. 
                  Les produits existants ne peuvent pas bénéficier de la génération automatique de description.
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
                  Qu'est-ce que Chat GPT et comment fonctionne-t-il ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Chat GPT est une intelligence artificielle générative qui produit du texte. L'add-on utilise le modèle Davinci 
                  d'OpenAI pour créer des descriptions de produits uniques basées sur le titre et les mots-clés fournis.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre ChatGPT et Davinci ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  OpenAI ne propose pas encore d'API officielle pour ChatGPT. L'add-on utilise le modèle <strong>Davinci</strong>, 
                  qui offre des capacités similaires pour la génération de texte. Les résultats sont très proches de ChatGPT.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Pourquoi les descriptions sont-elles uniques à chaque génération ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  C'est l'un des avantages majeurs des modèles d'IA générative. Le paramètre "Temperature" contrôle la créativité : 
                  plus il est élevé, plus les résultats sont variés et uniques.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Cette fonctionnalité fonctionne-t-elle pour les produits existants ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, l'add-on Chat GPT fonctionne <strong>uniquement pour les nouveaux produits</strong>. Les produits déjà créés 
                  ne peuvent pas bénéficier de la génération automatique de description.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que signifient les paramètres Temperature et Token ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  <strong>Temperature :</strong> Contrôle la créativité (0 = conservateur, prévisible / 1 = créatif, varié).<br />
                  <strong>Token :</strong> Représente l'unité de texte (mots, ponctuation). Plus le nombre est élevé, plus la description est longue.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir une clé API OpenAI ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Créez un compte sur openai.com, connectez-vous, allez dans "API Keys", puis cliquez sur "Create new secret key". 
                  Copiez la clé immédiatement car elle ne s'affiche qu'une seule fois.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels sont les coûts associés ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'add-on Chat GPT coûte <strong>15$ USD par mois</strong>, en supplément du plan Multivendor. 
                  Les frais d'utilisation de l'API OpenAI sont à la charge de l'utilisateur selon la consommation.
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
              et l'optimisation de votre générateur de descriptions IA.
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
                📚 Documentation Chat GPT
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
