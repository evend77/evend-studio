import React from 'react';
import { Link } from 'react-router-dom';

export default function FavoriteProductSellerGuide() {
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
    pink: '#db2777',
    pinkLight: '#fce7f3'
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
          background: `linear-gradient(135deg, ${styles.pink} 0%, ${styles.accent} 100%)`,
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
            ❤️⭐
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
            Guide d'utilisation - Favoris produits/vendeurs
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Permettez aux clients de liker leurs produits et vendeurs préférés
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>❤️ Produits favoris</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⭐ Vendeurs favoris</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📧 Notifications</span>
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
              'Configuration des codes',
              'Affichage frontal',
              'Côté client',
              'Côté administrateur',
              'Côté vendeur',
              'Notifications',
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
              L'add-on <strong>Favoris produits/vendeurs</strong> permet aux clients d'aimer (liker) les produits 
              ainsi que les vendeurs de votre marketplace. Cette fonctionnalité augmente l'engagement des clients 
              et permet aux vendeurs de voir leur popularité.
            </p>
            <div style={{
              background: styles.pinkLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.pink}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les clients reçoivent des notifications par email lorsque leurs 
                vendeurs ou produits favoris bénéficient de nouvelles offres ou de nouveaux produits.
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
                <li>Frais supplémentaires de <strong>5$ USD par mois</strong> pour l'add-on Favoris produits/vendeurs</li>
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
                Recherchez "Favoris produits/vendeurs" et cliquez sur le bouton <strong>Activer</strong>.
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
                Une fois activé, la fonctionnalité est disponible. Aucune configuration supplémentaire n'est requise.
              </p>
            </div>
          </section>

          {/* Section 4: Configuration des codes */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📝 Configuration des codes
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Codes à ajouter dans les templates
              </h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>1. Page produit (product.liquid)</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'<div class="wk_like_btn" style="cursor:pointer; display:none; padding:5px; clear:both;"><a><i class="fa fa-heart-o" id="wk_icon" data-like="" data-total_count="" aria-hidden="true"></i></a><input type="hidden" class="customerid" value="{{ customer.id }}"><input type="hidden" class="productid" value="{{ product.id }}" data-vid=""></div>'}
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>2. Page compte client (customers/account.liquid)</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'<div id="wk-customer-likes" style="clear: both!important; margin:10px 0!important;"><input id="wk-customer-id" type ="hidden" value="{{ customer.id }}"></div>'}
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>3. Page profil vendeur (page.mp_seller_profile.liquid)</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'<input type="hidden" class="customerid" id="customerid" value="{{customer.id}}">Favorite Product/Seller<br>'}
                  </code>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>4. Page collection (main-collection-product-grid.liquid)</h4>
                <div style={{
                  background: '#1a2332',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <code style={{ fontSize: '12px', color: '#e1e4e8' }}>
                    {'<div class="page-width hidden" id="wk-seller-like-block"><button class="btn button-primary" id="wk-seller-like-btn"><span class="fa fa-thumbs-up"></span><span id="wk-like-text" data-total-like="" data-total-count="" data-like=""></span><span id="wk-like-count"></span></button><input type="hidden" id="wk-like-label" data-label-like="Shop Like"><input type="hidden" id="wk-liked-label" data-label-liked="Liked"><input type="hidden" class="customerid" value="{{ customer.id}}"></div>'}
                  </code>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Affichage frontal */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
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
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>❤️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page produit</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Un bouton "J'aime" apparaît sur chaque produit. Le nombre de likes est affiché.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>⭐</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page profil vendeur</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Un bouton "Shop Like" permet aux clients d'aimer la boutique du vendeur. Le nombre de likes est affiché.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>👤</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Espace client</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients peuvent voir la liste de leurs produits et vendeurs favoris dans "Mon compte".
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📊</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page collection</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Le bouton "Shop Like" est également disponible sur les pages de collection de produits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Côté client */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👤 Côté client
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Fonctionnalités
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Liker un produit</strong> : Cliquer sur le cœur pour ajouter un produit aux favoris</li>
                <li><strong>Liker un vendeur</strong> : Cliquer sur "Shop Like" pour suivre une boutique</li>
                <li><strong>Voir ses favoris</strong> : Accéder à la liste dans "Mon compte"</li>
                <li><strong>Recevoir des notifications</strong> : Être informé des nouveautés et offres</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.pinkLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📧 <strong>Notifications :</strong> Les clients reçoivent des emails lorsque leurs vendeurs favoris 
                  créent des réductions ou ajoutent de nouveaux produits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Côté administrateur */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👑 Côté administrateur
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Vendeurs favoris</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Allez dans <strong>Vendeurs</strong> → <strong>Vendeurs favoris</strong>
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Liste de tous les vendeurs likés par les clients</li>
                    <li>Nombre de likes reçus par vendeur</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>❤️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Produits favoris</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Allez dans <strong>Produits</strong> → <strong>Produits favoris</strong>
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Liste de tous les produits likés par les clients</li>
                    <li>Nombre de likes par produit</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Côté vendeur */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Clients qui ont liké la boutique
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent voir la liste des clients qui ont aimé leur profil :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Mon compte</strong> → <strong>Clients favoris</strong></li>
                <li>Visualisez la liste des clients qui ont liké votre boutique</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Les vendeurs peuvent utiliser cette information pour proposer 
                  des offres spéciales à leurs fans.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Notifications */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📧 Notifications par email
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Vendeur favori</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les clients reçoivent un email lorsqu'un vendeur qu'ils suivent :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Crée une réduction</li>
                    <li>Ajoute un nouveau produit</li>
                    <li>Modifie ses offres</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>❤️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Produit favori</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les clients reçoivent un email lorsqu'une réduction est créée pour un produit qu'ils ont liké.
                  </p>
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: '#fff3cd',
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', color: styles.text }}>
                      🎁 <strong>Bonus :</strong> L'email inclut le code de réduction directement !
                    </p>
                  </div>
                </div>
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
                  Un client peut-il liker plusieurs vendeurs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Un client peut liker autant de vendeurs et de produits qu'il le souhaite. 
                  Tous ses favoris sont visibles dans son espace client.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs voient-ils qui a liké leur boutique ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les vendeurs peuvent voir la liste des clients qui ont liké leur boutique 
                  dans la section "Clients favoris" de leur tableau de bord.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les notifications sont-elles automatiques ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les notifications sont automatiques. Dès qu'un vendeur favori crée une réduction 
                  ou qu'un produit favori bénéficie d'une offre, l'email est envoyé immédiatement.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment l'administrateur peut-il voir les tendances ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut consulter la liste des vendeurs et produits les plus likés 
                  dans les sections dédiées, identifiant ainsi les contenus populaires.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les likes sont-ils visibles publiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le nombre de likes est visible publiquement sur les produits et les profils vendeurs. 
                  Cependant, l'identité des clients qui ont liké reste privée.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je désactiver les notifications ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les clients peuvent gérer leurs préférences de notifications depuis leur espace client. 
                  L'administrateur peut également désactiver les emails via la configuration.
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
              et l'optimisation de la fonctionnalité Favoris.
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
                📚 Documentation Favoris
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
