import React from 'react';
import { Link } from 'react-router-dom';

export default function SellerTagsCategoriesGuide() {
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
            🏷️📂
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
            Guide d'utilisation - Tags et catégories vendeur
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Organisation avancée des vendeurs - Filtres de recherche améliorés
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏷️ Tags vendeur</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📂 Catégories vendeur</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔍 Filtres de recherche</span>
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
              'Gestion des tags',
              'Gestion des catégories',
              'Configuration vendeur',
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
              L'add-on <strong>Tags et catégories vendeur</strong> permet aux administrateurs de créer des tags et des catégories 
              que les vendeurs peuvent choisir pour se décrire. Ces informations sont ensuite utilisées comme filtres 
              sur la boutique, permettant aux clients de trouver plus facilement les vendeurs qui correspondent à leurs besoins.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les tags et catégories vendeur améliorent la recherche et la navigation, 
                permettant aux clients de filtrer les vendeurs par spécialité, type de produits ou autres critères pertinents.
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
                <li>Frais supplémentaires de <strong>5$ USD par mois</strong> pour l'add-on Tags et catégories vendeur</li>
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
                Recherchez "Tags et catégories vendeur" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de 5$ USD et approuvez le paiement dans Shopify Backend.
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
                Une fois activé, les menus de configuration apparaissent dans la section <strong>Vendeurs</strong> 
                de votre tableau de bord.
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
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des vendeurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration des vendeurs</strong> pour activer les options :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px', marginBottom: '16px' }}>
                <li><strong>Autoriser les vendeurs à ajouter des tags</strong> : Active pour permettre l'ajout de tags</li>
                <li><strong>Restreindre l'ajout de tags à l'inscription</strong> : Limite l'ajout de tags à la page d'inscription</li>
                <li><strong>Autoriser les vendeurs à ajouter des catégories</strong> : Active pour permettre l'ajout de catégories</li>
                <li><strong>Restreindre l'ajout de catégories à l'inscription</strong> : Limite l'ajout de catégories à la page d'inscription</li>
              </ul>
              <div style={{
                background: '#fff3cd',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '8px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Astuce :</strong> Activez les autorisations pour permettre aux vendeurs de gérer leurs tags 
                  et catégories après inscription. Restreignez pour limiter à l'inscription uniquement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Gestion des tags */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏷️ Gestion des tags vendeur
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>➕</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Ajouter un tag</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Allez dans <strong>Vendeurs</strong> → <strong>Tags vendeur</strong>.
                    Cliquez sur <strong>Ajouter un tag</strong> et saisissez le nom du tag.
                  </p>
                  <div style={{
                    background: '#f1f5f9',
                    borderRadius: '12px',
                    padding: '12px'
                  }}>
                    <code style={{ fontSize: '13px', color: styles.text }}>
                      Exemples : "Mode", "Électronique", "Maison", "Sport", "Livres", "Bijoux"
                    </code>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✏️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Modifier/Supprimer</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Dans la liste des tags, chaque tag peut être :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Modifié (changer le nom)</li>
                    <li>Désactivé (masqué temporairement)</li>
                    <li>Supprimé (définitif)</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Assigner à un vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Allez dans <strong>Vendeurs</strong> → <strong>Liste des vendeurs</strong> → 
                    <strong>Modifier</strong>. Dans la page d'édition, sélectionnez les tags pour ce vendeur.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Gestion des catégories */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📂 Gestion des catégories vendeur (Collections)
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>➕</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Ajouter une catégorie</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Allez dans <strong>Vendeurs</strong> → <strong>Collections vendeur</strong>.
                    Cliquez sur <strong>Ajouter une collection</strong> et saisissez le nom de la catégorie.
                  </p>
                  <div style={{
                    background: '#f1f5f9',
                    borderRadius: '12px',
                    padding: '12px'
                  }}>
                    <code style={{ fontSize: '13px', color: styles.text }}>
                      Exemples : "Vêtements", "High-Tech", "Décoration", "Sport & Loisirs", "Art & Création"
                    </code>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✏️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Modifier/Supprimer</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Dans la liste des catégories, chaque catégorie peut être :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Modifiée (changer le nom)</li>
                    <li>Supprimée (définitif)</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Assigner à un vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Allez dans <strong>Vendeurs</strong> → <strong>Liste des vendeurs</strong> → 
                    <strong>Modifier</strong>. Dans la page d'édition, sélectionnez la catégorie pour ce vendeur.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Configuration vendeur */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
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
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Sélectionner tags et catégories
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent choisir leurs tags et catégories :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à l'<strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Mon compte</strong> → <strong>Profil</strong></li>
                <li>Dans la section dédiée, sélectionnez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>La <strong>catégorie vendeur</strong> (une seule)</li>
                  <li>Les <strong>tags vendeur</strong> (plusieurs possibles)</li>
                </ul>
                <li>Enregistrez les modifications</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  📌 <strong>Note :</strong> Si la configuration administrateur restreint l'ajout à l'inscription, 
                  les vendeurs ne pourront choisir leurs tags et catégories qu'à la création de leur compte.
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Page d'inscription vendeur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Lors de l'inscription d'un nouveau vendeur, celui-ci peut sélectionner :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Sa <strong>catégorie vendeur</strong> dans une liste déroulante</li>
                <li>Ses <strong>tags vendeur</strong> via une sélection multiple</li>
              </ul>
              <div style={{
                marginTop: '16px',
                background: styles.tealLight,
                borderRadius: '12px',
                padding: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Cette sélection initiale aide à catégoriser correctement les vendeurs 
                  dès leur arrivée sur la marketplace.
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
              🖥️ Affichage frontal et filtres
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Filtres de recherche</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients peuvent filtrer les vendeurs par :
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Catégories vendeur</li>
                  <li>Tags vendeur</li>
                </ul>
                <p style={{ fontSize: '13px', color: styles.textLight, marginTop: '12px' }}>
                  Les filtres apparaissent dans la page de recherche et de liste des vendeurs.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>👤</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page profil vendeur</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Sur la page de profil du vendeur, les tags et catégories sont affichés :
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Catégorie principale en évidence</li>
                  <li>Tags sous forme de badges</li>
                  <li>Liens cliquables pour filtrer par tag/catégorie</li>
                </ul>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📱</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page de résultats</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Dans les résultats de recherche, les tags et catégories permettent une organisation claire 
                  et aident les clients à trouver rapidement les vendeurs qui correspondent à leurs besoins.
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
                💡 <strong>Avantage :</strong> Les filtres par tags et catégories améliorent l'expérience utilisateur 
                et augmentent la visibilité des vendeurs spécialisés.
              </p>
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
                  Quelle est la différence entre un tag et une catégorie ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  La <strong>catégorie</strong> est unique par vendeur et permet de classer les vendeurs dans des grandes familles. 
                  Les <strong>tags</strong> sont multiples et permettent une classification plus fine (spécialités, caractéristiques, etc.).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien de tags un vendeur peut-il avoir ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Il n'y a pas de limite prédéfinie. L'administrateur peut créer autant de tags que nécessaire, 
                  et les vendeurs peuvent en sélectionner plusieurs selon les besoins de leur activité.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils créer leurs propres tags ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, seuls les administrateurs peuvent créer des tags et catégories. Les vendeurs choisissent 
                  parmi ceux disponibles. Cela garantit une cohérence dans la classification.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Peut-on désactiver un tag sans le supprimer ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Les tags peuvent être désactivés temporairement. Ils ne seront plus visibles ni sélectionnables, 
                  mais les données restent intactes si vous souhaitez les réactiver plus tard.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les tags et catégories apparaissent-ils dans les résultats de recherche ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Les clients peuvent filtrer les vendeurs par tags et catégories directement depuis la page 
                  de recherche ou la liste des vendeurs. Les tags sont également cliquables sur les profils vendeurs.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je restreindre les modifications après inscription ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui. Dans la configuration administrateur, vous pouvez activer l'option 
                  "Restreindre l'ajout de tags/catégories à l'inscription". Les vendeurs ne pourront alors 
                  choisir leurs tags et catégories qu'à la création de leur compte.
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
              et l'optimisation de vos tags et catégories vendeur.
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
                📚 Documentation Tags & Catégories
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
