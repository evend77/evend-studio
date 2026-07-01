import React from 'react';
import { Link } from 'react-router-dom';

export default function PackProductGuide() {
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
            📦🎁
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
            Guide d'utilisation - Produits en lot
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Créez des packs et des combos pour booster vos ventes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Produits en pack</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🎁 Produits en combo</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📈 Vente incitative</span>
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
              'Packs vs Combos',
              'Ajout de packs (Admin)',
              'Ajout de combos (Admin)',
              'Côté vendeur',
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
              L'add-on <strong>Produits en lot</strong> permet aux vendeurs et à l'administrateur de créer des packs 
              et des combos de produits. Cette fonctionnalité est idéale pour augmenter le panier moyen 
              et proposer des offres groupées attractives aux clients.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'add-on est gratuit, mais nécessite l'installation préalable 
                de l'application Pack & Combo Product sur votre boutique (30$ USD/mois).
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
                <li>Application <strong>Pack & Combo Product</strong> installée sur Shopify (30$ USD/mois)</li>
                <li>L'add-on Produits en lot est <strong>gratuit</strong></li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.redLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> L'application Pack & Combo Product doit être installée avant d'activer cet add-on.
                </p>
              </div>
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
                Installer l'application Pack & Combo Product
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous sur la boutique d'applications Shopify et installez l'application 
                <strong>Pack & Combo Product</strong>. Acceptez les frais mensuels de 30$ USD.
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
                Activer l'add-on Produits en lot
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "Produits en lot" et cliquez sur <strong>Activer</strong>.
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
                Accéder aux menus
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Une fois activé, deux nouveaux menus apparaissent dans la section <strong>Produits</strong> :
                <strong>Produits en pack</strong> et <strong>Produits en combo</strong>.
              </p>
            </div>
          </section>

          {/* Section 4: Packs vs Combos */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Pack vs Combo - Quelle différence ?
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Produits en pack</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Un pack est un lot de produits regroupés dans un seul emballage.
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Un seul vendeur</strong> : Tous les produits viennent du même vendeur</li>
                    <li><strong>Prix unique</strong> : Un prix pour l'ensemble du lot</li>
                    <li><strong>Quantité unique</strong> : Une quantité pour le lot complet</li>
                    <li><strong>Expédition unique</strong> : Un seul colis</li>
                  </ul>
                  <div style={{ background: styles.tealLight, borderRadius: '8px', padding: '8px', marginTop: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Exemple : Lot de 3 t-shirts du même vendeur</p>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎁</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Produits en combo</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Un combo est une combinaison de produits qui peuvent venir de différents vendeurs.
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Plusieurs vendeurs</strong> : Chaque produit peut avoir son propre vendeur</li>
                    <li><strong>Prix global</strong> : Un prix pour l'ensemble</li>
                    <li><strong>Expéditions séparées</strong> : Chaque vendeur expédie sa partie</li>
                    <li><strong>Gestion individuelle</strong> : Variantes et tailles par produit</li>
                  </ul>
                  <div style={{ background: styles.tealLight, borderRadius: '8px', padding: '8px', marginTop: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Exemple : Ensemble repas (livreurs différents)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Ajout de packs (Admin) */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ➕ Ajout de produits en pack - Administrateur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Produits en pack</strong></li>
                <li>Cliquez sur <strong>Créer un pack</strong></li>
                <li>Remplissez les informations :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Nom du pack</strong></li>
                  <li><strong>Email du vendeur</strong> : Le vendeur responsable de l'exécution</li>
                  <li><strong>Prix du pack</strong> : Prix de vente du lot</li>
                  <li><strong>Quantité</strong> : Stock disponible</li>
                  <li><strong>Description</strong>, <strong>tags</strong>, <strong>collection</strong>, <strong>images</strong></li>
                </ul>
                <li>Ajoutez les produits qui composent le pack</li>
                <li>Le prix réel des produits s'affiche automatiquement</li>
                <li>Enregistrez</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> Le vendeur assigné au pack est responsable de l'expédition du lot complet.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Ajout de combos (Admin) */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🎁 Ajout de produits en combo - Administrateur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Produits en combo</strong></li>
                <li>Cliquez sur <strong>Créer un combo</strong></li>
                <li>Remplissez les informations générales :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Nom du combo</strong></li>
                  <li><strong>Description</strong></li>
                  <li><strong>Tags</strong></li>
                </ul>
                <li>Ajoutez les produits qui composent le combo</li>
                <li>Pour chaque produit, configurez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Variante</li>
                  <li>Taille</li>
                  <li>Quantité</li>
                </ul>
                <li>Enregistrez</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Dans un combo, les produits peuvent provenir de différents vendeurs.
                  Chaque vendeur expédie sa partie de la commande.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Côté vendeur */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Côté vendeur
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Produits en pack</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Créer leurs propres packs</li>
                    <li>Modifier les packs existants</li>
                    <li>Désactiver ou supprimer des packs</li>
                    <li>Voir la liste de tous leurs packs</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎁</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Produits en combo</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Créer leurs propres combos</li>
                    <li>Ajouter leurs produits dans des combos</li>
                    <li>Modifier ou supprimer leurs combos</li>
                  </ul>
                </div>
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
                💡 <strong>Astuce :</strong> Les vendeurs peuvent créer des combos avec leurs propres produits 
                uniquement, ou participer à des combos créés par l'administrateur.
              </p>
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
              🖥️ Affichage frontal
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration des codes
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour afficher les packs et combos sur la boutique, vous devez ajouter les codes fournis 
                dans l'application Pack & Combo Product. Les instructions sont disponibles sur la page d'accueil 
                de l'application.
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                  Les codes d'intégration sont disponibles dans l'application Pack & Combo Product
                </code>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginTop: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📦</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page produit pack</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients voient tous les produits inclus dans le pack, le prix total et le prix du pack 
                  en promotion. Ils peuvent ajouter le lot entier au panier en un clic.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎁</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page produit combo</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients voient les différents produits du combo et peuvent sélectionner les variantes 
                  individuellement avant d'ajouter l'ensemble au panier.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page panier</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les produits en pack apparaissent comme un seul article. Les produits en combo apparaissent 
                  comme des articles individuels regroupés.
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
                  L'add-on Produits en lot est-il gratuit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, l'add-on est gratuit. Cependant, il nécessite l'installation préalable 
                  de l'application Pack & Combo Product sur votre boutique (30$ USD/mois).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre un pack et un combo ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Un pack contient des produits d'un seul vendeur et est expédié en un seul colis. 
                  Un combo peut contenir des produits de plusieurs vendeurs, chacun expédiant sa partie 
                  séparément.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils créer leurs propres packs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Les vendeurs peuvent créer leurs propres packs et combos depuis leur espace vendeur, 
                  de la même manière que l'administrateur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment sont calculés les prix des packs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur ou le vendeur définit un prix promotionnel pour le pack. 
                  Le prix réel des produits individuels est affiché à titre indicatif pour montrer l'économie réalisée.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les stocks sont-ils gérés automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, lorsque un pack ou combo est acheté, les stocks de chaque produit individuel sont 
                  automatiquement décrémentés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les combos sont-ils compatibles avec le panier divisé ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les combos sont parfaitement compatibles avec le panier divisé. Chaque vendeur voit 
                  sa partie du combo et gère sa propre expédition.
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
              et l'optimisation de vos produits en lot.
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
                📚 Documentation Produits en lot
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
