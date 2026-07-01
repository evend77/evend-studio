// src/pages/guides/GuideTemplateMinimalist.tsx
// Guide du template Minimalist Studio

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STYLES = {
  accent: '#f5a623',
  accentLight: '#fff8eb',
  accentDark: '#e8900c',
  bg: '#0a1628',
  cardBg: '#0f1729',
  border: 'rgba(255,255,255,0.1)',
  text: '#ffffff',
  textLight: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  success: '#10b981',
  successLight: 'rgba(16,185,129,0.15)',
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139,92,246,0.15)',
};

// Produits fictifs pour l'aperçu
const PRODUITS = [
  { id: 1, nom: 'Lampe Minimaliste', prix: 89, image: 'https://images.pexels.com/photos/2762246/pexels-photo-2762246.jpeg?auto=compress&cs=tinysrgb&w=200', categorie: 'Décoration' },
  { id: 2, nom: 'Chaise Scandinave', prix: 299, image: 'https://images.pexels.com/photos/1166643/pexels-photo-1166643.jpeg?auto=compress&cs=tinysrgb&w=200', categorie: 'Mobilier' },
  { id: 3, nom: 'Vase Céramique', prix: 49, image: 'https://images.pexels.com/photos/1309842/pexels-photo-1309842.jpeg?auto=compress&cs=tinysrgb&w=200', categorie: 'Accessoires' },
  { id: 4, nom: 'Horloge Murale', prix: 79, image: 'https://images.pexels.com/photos/1139615/pexels-photo-1139615.jpeg?auto=compress&cs=tinysrgb&w=200', categorie: 'Décoration' },
];

export default function GuideTemplateMinimalist() {
  const navigate = useNavigate();
  const [couleurApercu, setCouleurApercu] = useState(STYLES.accent);

  return (
    <div style={{
      backgroundColor: STYLES.bg,
      minHeight: '100vh',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: STYLES.cardBg,
        borderRadius: '24px',
        overflow: 'hidden',
        border: `1px solid ${STYLES.border}`
      }}>
        
        {/* En-tête */}
        <div style={{
          background: `linear-gradient(135deg, ${STYLES.accentDark} 0%, ${STYLES.accent} 100%)`,
          padding: '60px 40px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ 
            fontSize: '80px', 
            marginBottom: '32px',
            display: 'inline-block'
          }}>
            🎨
          </div>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '800',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            Minimalist Studio
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Design épuré et moderne pour mettre vos produits en valeur
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🎯 Design épuré</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📱 Responsive</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Rapide</span>
          </div>
        </div>

        {/* Sommaire */}
        <div style={{
          padding: '32px 48px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: `1px solid ${STYLES.border}`
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: STYLES.text }}>📑 Sommaire</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {[
              'Présentation',
              'Page d\'accueil',
              'Page collection',
              'Page produit',
              'Personnalisation',
              'Configurer votre boutique',
              'Support'
            ].map((item, i) => (
              <a key={i} href={`#section-${i}`} style={{
                color: STYLES.accent,
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
          
          {/* Section 0: Présentation */}
          <section id="section-0" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: STYLES.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${STYLES.accent}`,
              paddingLeft: '20px'
            }}>
              ✨ Présentation du template
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: STYLES.textLight, marginBottom: '20px' }}>
              <strong>Minimalist Studio</strong> est un template épuré qui met l'accent sur vos produits. 
              Avec son design minimaliste et ses espaces aérés, il offre une expérience de navigation fluide 
              et agréable pour vos clients.
            </p>
            <div style={{
              background: STYLES.blueLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${STYLES.blue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: STYLES.text }}>
                💡 <strong>Idéal pour :</strong> Mode, accessoires, décoration, art, photographie
              </p>
            </div>
          </section>

          {/* Section 1: Page d'accueil */}
          <section id="section-1" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: STYLES.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${STYLES.accent}`,
              paddingLeft: '20px'
            }}>
              🏠 Page d'accueil
            </h2>
            
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${STYLES.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: STYLES.accent }}>
                Aperçu
              </h3>
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  background: '#fafafa',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    maxWidth: '400px',
                    margin: '0 auto',
                    background: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ height: '120px', background: `linear-gradient(135deg, ${STYLES.accentDark}, ${STYLES.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '36px', color: 'white' }}>🛍️</span>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ color: '#333', fontSize: '18px' }}>Boutique Minimaliste</h3>
                      <p style={{ color: '#666', fontSize: '13px' }}>Découvrez nos produits</p>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {PRODUITS.slice(0, 3).map(p => (
                          <div key={p.id} style={{ width: '60px', textAlign: 'center' }}>
                            <img src={p.image} alt={p.nom} style={{ width: '100%', borderRadius: '8px' }} />
                            <span style={{ fontSize: '10px', color: '#333' }}>{p.prix}$</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', marginTop: '24px', color: STYLES.accent }}>
                Éléments personnalisables
              </h3>
              <ul style={{ color: STYLES.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Hero section</strong> : Titre, sous-titre, image de fond, bouton CTA</li>
                <li><strong>Produits vedettes</strong> : Sélection des produits à afficher</li>
                <li><strong>Catégories mises en avant</strong> : Choix des catégories</li>
                <li><strong>Newsletter</strong> : Activation/désactivation</li>
                <li><strong>Blog</strong> : Affichage des derniers articles</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Page collection */}
          <section id="section-2" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: STYLES.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${STYLES.accent}`,
              paddingLeft: '20px'
            }}>
              📁 Page collection
            </h2>
            
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${STYLES.border}`,
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: STYLES.accent }}>
                    Grille produits
                  </h3>
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    {PRODUITS.map(p => (
                      <div key={p.id} style={{ textAlign: 'center' }}>
                        <img src={p.image} alt={p.nom} style={{ width: '100%', borderRadius: '8px' }} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: STYLES.accent, display: 'block', marginTop: '4px' }}>{p.prix}$</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: STYLES.accent }}>
                    Sidebar filtres
                  </h3>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid #e2e8f0`
                  }}>
                    <p style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>📁 Catégories</p>
                    <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                      <li style={{ padding: '4px 0', fontSize: '13px', color: '#555' }}>✓ Décoration (12)</li>
                      <li style={{ padding: '4px 0', fontSize: '13px', color: '#555' }}>✓ Mobilier (8)</li>
                      <li style={{ padding: '4px 0', fontSize: '13px', color: '#555' }}>✓ Accessoires (15)</li>
                    </ul>
                    <p style={{ fontWeight: '600', marginBottom: '8px', marginTop: '16px', color: '#333' }}>💰 Prix</p>
                    <input type="range" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: STYLES.accent }}>
                Options personnalisables
              </h3>
              <ul style={{ color: STYLES.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Nombre de produits par page</strong> : 12, 24, 48</li>
                <li><strong>Affichage</strong> : Grille ou liste</li>
                <li><strong>Filtres</strong> : Activation/désactivation des filtres par catégorie, prix, etc.</li>
                <li><strong>Sidebar</strong> : Position gauche, droite ou masquée</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Page produit */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: STYLES.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${STYLES.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Page produit
            </h2>
            
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${STYLES.border}`,
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <img src={PRODUITS[0].image} alt="Produit" style={{ width: '100%', maxWidth: '200px', borderRadius: '12px' }} />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                      {PRODUITS.slice(0, 3).map(p => (
                        <img key={p.id} src={p.image} style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#333' }}>{PRODUITS[0].nom}</h3>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: STYLES.accent, marginBottom: '16px' }}>{PRODUITS[0].prix}$</p>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>Description du produit...</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input type="number" defaultValue={1} min={1} style={{ width: '60px', padding: '8px', borderRadius: '8px', border: `1px solid #ddd` }} />
                    <button style={{ background: STYLES.accent, color: 'white', border: 'none', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer' }}>Ajouter au panier</button>
                  </div>
                </div>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', marginTop: '24px', color: STYLES.accent }}>
                Fonctionnalités
              </h3>
              <ul style={{ color: STYLES.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Galerie d'images</strong> : Miniatures cliquables</li>
                <li><strong>Sélecteur de quantité</strong> : Choix du nombre d'articles</li>
                <li><strong>Avis clients</strong> : Note et commentaires</li>
                <li><strong>Produits similaires</strong> : Recommandations automatiques</li>
                <li><strong>Stock</strong> : Indicateur de disponibilité</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Personnalisation */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: STYLES.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${STYLES.accent}`,
              paddingLeft: '20px'
            }}>
              🎨 Personnalisation
            </h2>
            
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${STYLES.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: STYLES.accent }}>
                Testez les couleurs
              </h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                <label style={{ color: STYLES.textLight }}>Couleur principale :</label>
                <input
                  type="color"
                  value={couleurApercu}
                  onChange={(e) => setCouleurApercu(e.target.value)}
                  style={{ width: '50px', height: '40px', cursor: 'pointer', background: 'transparent' }}
                />
                <div style={{
                  background: couleurApercu,
                  width: '60px',
                  height: '40px',
                  borderRadius: '8px',
                  border: `1px solid ${STYLES.border}`
                }} />
                <span style={{ color: STYLES.textLight, fontSize: '13px' }}>{couleurApercu}</span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: STYLES.accent }}>
                Aperçu en direct
              </h3>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <button style={{
                  background: couleurApercu,
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}>
                  Bouton personnalisé
                </button>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', marginTop: '24px', color: STYLES.accent }}>
                Éléments personnalisables
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ border: `1px solid ${STYLES.border}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎨</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: STYLES.text }}>Couleurs</h4>
                  <p style={{ fontSize: '12px', color: STYLES.textMuted }}>Primaire, secondaire, fond, texte</p>
                </div>
                <div style={{ border: `1px solid ${STYLES.border}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔤</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: STYLES.text }}>Polices</h4>
                  <p style={{ fontSize: '12px', color: STYLES.textMuted }}>Titres, corps, tailles</p>
                </div>
                <div style={{ border: `1px solid ${STYLES.border}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📐</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: STYLES.text }}>Mise en page</h4>
                  <p style={{ fontSize: '12px', color: STYLES.textMuted }}>Largeur, grille, sidebar</p>
                </div>
                <div style={{ border: `1px solid ${STYLES.border}`, borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: STYLES.text }}>Images</h4>
                  <p style={{ fontSize: '12px', color: STYLES.textMuted }}>Logo, bannière, héros</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Configurer */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: STYLES.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${STYLES.accent}`,
              paddingLeft: '20px'
            }}>
              ⚙️ Configurer votre boutique
            </h2>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(139,92,246,0.1) 100%)',
              borderRadius: '20px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: STYLES.text }}>
                Prêt à personnaliser votre boutique ?
              </h3>
              <p style={{ color: STYLES.textLight, marginBottom: '24px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                Accédez à l'éditeur pour modifier les couleurs, polices et agencement de votre boutique
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/template-boutique')}
                  style={{
                    background: STYLES.accent,
                    color: 'white',
                    padding: '14px 32px',
                    borderRadius: '40px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🎨 Personnaliser maintenant
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    background: 'transparent',
                    color: STYLES.textLight,
                    padding: '14px 32px',
                    borderRadius: '40px',
                    border: `1px solid ${STYLES.border}`,
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Retour au tableau de bord
                </button>
              </div>
            </div>
          </section>

          {/* Section 6: Support */}
          <section id="section-6" style={{
            background: STYLES.blueLight,
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            border: `1px solid ${STYLES.border}`
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛟</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: STYLES.text }}>
              Besoin d'aide ?
            </h3>
            <p style={{ color: STYLES.textLight, marginBottom: '24px' }}>
              Notre équipe est disponible pour vous accompagner dans la configuration de votre boutique
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="mailto:support@evend.studio" style={{
                background: STYLES.blue,
                color: 'white',
                padding: '12px 28px',
                borderRadius: '40px',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                📧 Contacter le support
              </a>
              <a href="#" style={{
                background: 'transparent',
                color: STYLES.textLight,
                padding: '12px 28px',
                borderRadius: '40px',
                textDecoration: 'none',
                border: `1px solid ${STYLES.border}`
              }}>
                📚 Documentation complète
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}