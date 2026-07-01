import React from 'react';
import { Link } from 'react-router-dom';

export default function AskQuestionGuide() {
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
    teal: '#14b8a6',
    tealLight: '#ccfbf1'
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
          background: `linear-gradient(135deg, ${styles.teal} 0%, ${styles.accent} 100%)`,
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
            ❓💬
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
            Guide d'utilisation - Poser une question
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Communication directe entre clients et vendeurs pour augmenter les ventes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>❓ Questions sur produits</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Questions sur commandes</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📋 FAQ automatiques</span>
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
              'Questions sur produits',
              'Questions sur commandes',
              'FAQ automatique',
              'Restrictions et sécurité',
              'Gestion des requêtes',
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
              L'add-on <strong>Poser une question</strong> permet aux clients de communiquer directement avec les vendeurs 
              pour obtenir des informations sur les produits ou les commandes. Cette fonctionnalité améliore l'expérience 
              client et peut augmenter les ventes en répondant aux doutes avant l'achat.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les questions peuvent être publiées automatiquement en FAQ sur la page produit 
                une fois que le vendeur y a répondu, créant ainsi une base de connaissances.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Poser une question</li>
                <li>Les clients peuvent poser des questions sans compte (selon configuration)</li>
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
                Activer l'add-on Poser une question
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "Poser une question" et cliquez sur le bouton <strong>Activer</strong>.
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
                Un nouveau menu <strong>Configuration Poser une question</strong> apparaît dans la section 
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
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Options de configuration</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>1. Restrictions sur les produits</h4>
                <p style={{ color: styles.textLight }}>
                  Activez cette option pour permettre aux clients de poser des questions uniquement sur 
                  des produits spécifiques (configurable par produit).
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>2. Questions sur les commandes</h4>
                <p style={{ color: styles.textLight }}>
                  Activez cette option pour permettre aux clients de poser des questions sur leurs commandes.
                  Les vendeurs pourront répondre depuis la page de détails de la commande.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>3. Mode d'utilisation</h4>
                <p style={{ color: styles.textLight }}>
                  Choisissez entre :
                </p>
                <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                  <li><strong>Poser une question</strong> : Utilisation standard</li>
                  <li><strong>FAQ</strong> : Questions publiées automatiquement en FAQ</li>
                  <li><strong>Les deux</strong> : Les deux modes combinés</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>4. Réouverture des requêtes</h4>
                <p style={{ color: styles.textLight }}>
                  Autorisez les clients et/ou les vendeurs à réouvrir les requêtes fermées.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                🔒 Restriction par mots-clés
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Configurez jusqu'à 50 mots-clés restreints. Deux options disponibles :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Ne pas soumettre la requête</strong> : La requête est bloquée</li>
                <li><strong>Soumettre sans notification</strong> : Le vendeur ne reçoit pas d'email</li>
              </ul>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                🔐 Captcha et sécurité
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Activez le Captcha pour prévenir le spam et les soumissions automatisées.
                Les clients devront saisir un code de vérification avant d'envoyer leur question.
              </p>
              <p style={{ color: styles.textLight }}>
                <strong>Restriction sans connexion :</strong> Activez pour obliger les clients à se connecter 
                avant de pouvoir poser une question.
              </p>
            </div>
          </section>

          {/* Section 5: Questions sur produits */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Questions sur les produits
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Côté administrateur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut voir toutes les questions dans :
                <strong>Produits</strong> → <strong>Poser une question</strong>
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Voir l'historique complet des conversations</li>
                <li>Répondre aux questions des clients</li>
                <li>Exporter les requêtes au format CSV</li>
                <li>Fermer les requêtes</li>
              </ul>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Côté vendeur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent gérer leurs questions dans :
                <strong>Produits</strong> → <strong>Poser une question</strong>
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Voir les questions pour leurs produits</li>
                <li>Répondre aux clients</li>
                <li>Fermer les requêtes</li>
                <li>Marquer comme non lu ou spam</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Questions sur commandes */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Questions sur les commandes
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Fonctionnement
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les clients peuvent poser des questions sur les produits qu'ils ont commandés.
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Le client se connecte à son compte</li>
                <li>Va dans <strong>Mon compte</strong> → <strong>Commandes</strong></li>
                <li>Clique sur un numéro de commande</li>
                <li>Clique sur <strong>Poser une question</strong></li>
                <li>Sélectionne le produit concerné</li>
                <li>Saisit sa question et soumet</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  📌 <strong>Note :</strong> Les clients ne peuvent poser des questions que sur les produits 
                  qu'ils ont effectivement achetés.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: FAQ automatique */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Publication automatique en FAQ
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Comment ça fonctionne ?
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Lorsque le mode "FAQ" est activé :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Le client pose une question sur un produit</li>
                <li>Le vendeur répond depuis son tableau de bord</li>
                <li>La question et la réponse sont automatiquement publiées sur la page produit</li>
                <li>La requête est automatiquement fermée</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.tealLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Avantage :</strong> Les clients peuvent consulter les questions/réponses existantes 
                  sans avoir à poser la même question.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Restrictions et sécurité */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔒 Restrictions et sécurité
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mots-clés restreints</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Configurez jusqu'à 50 mots-clés interdits. Deux modes :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Blocage complet de la requête</li>
                    <li>Soumission sans notification du vendeur</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Téléchargement d'images</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les clients peuvent joindre des images à leurs questions.
                    Les vendeurs peuvent également joindre des fichiers dans leurs réponses.
                  </p>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔐</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Captcha & Connexion</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    <strong>Captcha :</strong> Empêche le spam automatisé
                  </p>
                  <p style={{ color: styles.textLight }}>
                    <strong>Connexion obligatoire :</strong> Force les clients à se connecter avant de poser une question
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: Gestion des requêtes */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Gestion des requêtes
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Actions administrateur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Voir toutes les requêtes</li>
                    <li>Répondre aux questions</li>
                    <li>Fermer les requêtes</li>
                    <li>Exporter en CSV</li>
                    <li>Surveiller les conversations</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Actions vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Répondre aux clients</li>
                    <li>Fermer les requêtes</li>
                    <li>Marquer comme non lu</li>
                    <li>Marquer comme spam</li>
                    <li>Réouvrir les requêtes</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Actions client</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Poser des questions</li>
                    <li>Voir l'historique des requêtes</li>
                    <li>Répondre aux vendeurs</li>
                    <li>Réouvrir les requêtes (si autorisé)</li>
                    <li>Consulter les FAQ</li>
                  </ul>
                </div>
              </div>
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
              🖥️ Affichage frontal
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Intégration des codes
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour afficher le bouton "Poser une question", ajoutez le code suivant dans :
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <code style={{ fontSize: '13px', color: '#e1e4e8' }}>
                  {'<div id="wk-askme"> {% if customer %} <input id="wk-is-login" type="hidden" value="{{ customer.email }}"> <input id="wk-cust-name" type="hidden" value="{{ customer.name }}"> {% endif %} <input id="wk-id-product" type="hidden" value="{{ product.id }}"> </div>'}
                </code>
              </div>
              <p style={{ color: styles.textLight, marginBottom: '8px' }}>
                <strong>Fichier :</strong> product.liquid (hors formulaire "Ajouter au panier")
              </p>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                <strong>Pour l'espace client :</strong> customers/account.liquid
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <code style={{ fontSize: '13px', color: '#e1e4e8' }}>
                  {'<div id="wk-customer-queries"> <input id="wk-customer-email" type="hidden" value="{{ customer.email }}"> </div>'}
                </code>
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
                  Les clients doivent-ils avoir un compte pour poser des questions ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Par défaut, les clients peuvent poser des questions sans compte. L'administrateur peut activer 
                  l'option "Restreindre sans connexion" pour obliger les clients à se connecter.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la vérification par OTP ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les clients sans compte peuvent voir leurs requêtes en saisissant leur email. 
                  Un code OTP est envoyé par email pour vérifier l'identité avant d'afficher les requêtes.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les questions sont-elles automatiquement publiées en FAQ ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si le mode "FAQ" est activé. Dès que le vendeur répond à une question, 
                  le couple question/réponse est automatiquement publié sur la page produit.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils fermer les requêtes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si l'administrateur active cette option. Les vendeurs peuvent fermer, marquer comme non lu 
                  ou marquer comme spam les requêtes qu'ils reçoivent.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Peut-on exporter les requêtes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! L'administrateur peut exporter toutes les requêtes au format CSV avec les colonnes : 
                  champs personnalisés, date de la requête, nom du produit, etc.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment configurer les champs personnalisés ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Allez dans <strong>Configuration</strong> → <strong>Champs personnalisés</strong> → 
                  <strong>Ajouter un champ</strong>. Sélectionnez "Poser une question" dans "FIELD FOR" 
                  et configurez le nom, le type et l'ordre du champ.
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
              et l'optimisation de votre fonctionnalité "Poser une question".
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
                📚 Documentation "Poser une question"
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
