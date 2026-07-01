import React from 'react';
import { Link } from 'react-router-dom';

export default function StorePickupGuide() {
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
    redLight: '#fee2e2'
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
          background: `linear-gradient(135deg, ${styles.orange} 0%, ${styles.accent} 100%)`,
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
            🏬📦
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
            Guide d'utilisation - Retrait en magasin
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Offrez à vos clients la possibilité de retirer leurs commandes directement en magasin
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏬 Retrait en magasin</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🚚 Livraison à domicile</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Frais de livraison offerts</span>
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
              'Configuration administrateur',
              'Configuration vendeur',
              'Multi-emplacements',
              'Affichage frontal',
              'Retrait sur page panier',
              'Compatibilités',
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
              L'add-on <strong>Retrait en magasin</strong> permet aux vendeurs de votre marketplace d'offrir à leurs clients 
              la possibilité de retirer leurs commandes directement dans leur boutique physique. Cette fonctionnalité 
              élimine les frais de livraison pour les clients et simplifie la gestion des retours pour les vendeurs.
            </p>
            <div style={{
              background: styles.orangeLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.orange}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>Le saviez-vous ?</strong> Offrir un retrait en magasin peut réduire les coûts d'expédition de 30% 
                et augmenter les ventes locales. Les clients apprécient la flexibilité de choisir entre livraison et retrait !
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
                <li>Add-on <strong>Expédition</strong> activé (gratuit)</li>
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Retrait en magasin</li>
              </ul>
            </div>

            <div style={{
              background: styles.accentLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.accent}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                📌 <strong>Note importante :</strong> L'add-on Retrait en magasin fonctionne en complément de l'addon Expédition.
                Les deux doivent être activés pour que la fonctionnalité soit complète.
              </p>
            </div>
          </section>

          {/* Section 3: Configuration administrateur */}
          <section id="section-2" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👑 Étape 1 : Configuration côté administrateur
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
                Activer l'add-on Retrait en magasin
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Localisez "Retrait en magasin" et cliquez sur le bouton <strong>Activer</strong>. Acceptez les frais mensuels 
                de 10$ USD pour finaliser l'activation.
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
                Configurer les options globales
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration Retrait en magasin</strong> apparaît dans la section Configuration.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li><strong>Activer l'option de retrait</strong> : Active globalement la fonctionnalité</li>
                <li><strong>Libellé du retrait</strong> : Personnalisez le texte affiché (ex: "Retrait en boutique")</li>
                <li><strong>Afficher le nom du lieu</strong> : Montre le nom de la boutique sur le front-end</li>
                <li><strong>Notification email après paiement</strong> : Envoie un email de confirmation au client</li>
              </ul>
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
                Configurer l'affichage frontal
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Pour afficher l'option de retrait sur les pages produits, vous devez ajouter le code suivant 
                dans le fichier <strong>product.liquid</strong> ou <strong>product-template.liquid</strong> :
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: '#e1e4e8' }}>
                  {'<div id="wk_store_pickup_div" data-productid="{{ product.id }}"></div>'}
                </code>
              </div>
            </div>
          </section>

          {/* Section 4: Configuration vendeur */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Étape 2 : Configuration côté vendeur
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
                Ajouter les adresses de retrait
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Connectez-vous à votre <strong>espace vendeur</strong>, puis :
              </p>
              <ol style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Emplacements</strong></li>
                <li>Cliquez sur <strong>Ajouter un emplacement</strong></li>
                <li>Saisissez : nom du lieu, adresse complète, code postal, ville, pays</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  ✅ Astuce : Vous pouvez ajouter plusieurs emplacements (boutiques) et les gérer indépendamment.
                </code>
              </div>
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
                Configurer les options de retrait
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Retrait en magasin</strong> et choisissez :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li><strong>Application</strong> : "Tous les produits" ou "Produits spécifiques"</li>
                <li><strong>Options affichées</strong> : "Livraison + Retrait" ou "Retrait uniquement"</li>
                <li><strong>Option par défaut</strong> : Sélectionnez l'option pré-sélectionnée pour les clients</li>
              </ul>
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
                Configurer par produit (si option spécifique)
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Si vous avez choisi "Produits spécifiques", lors de l'ajout ou modification d'un produit :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Sélectionnez l'option dans la section <strong>Méthode de retrait</strong></li>
                <li>Choisissez entre : "Livraison + Retrait", "Retrait uniquement", "Livraison uniquement"</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Multi-emplacements */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📍 Gestion multi-emplacements
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏪</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Multi-boutiques</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent gérer plusieurs boutiques depuis un seul compte :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Ajouter des adresses de retrait multiples</li>
                    <li>Définir un rayon de livraison par emplacement</li>
                    <li>Gérer les stocks par emplacement</li>
                    <li>Activer/désactiver des emplacements indépendamment</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Géolocalisation Google Maps</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Intégration avec Google Maps pour :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Afficher les boutiques sur une carte</li>
                    <li>Calculer les distances</li>
                    <li>Fournir des itinéraires aux clients</li>
                    <li>Définir des zones de service</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Gestion des stocks</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    La gestion des stocks s'adapte automatiquement :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Les produits existants sont transférés au premier emplacement</li>
                    <li>Les nouveaux produits gèrent les stocks par emplacement</li>
                    <li>Le client voit la disponibilité selon sa localisation</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Affichage frontal */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖥️ Affichage sur le front-end
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛍️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page produit</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients voient deux options : "Livraison" ou "Retrait en magasin". 
                  Le choix affecte directement les frais de livraison (gratuits en cas de retrait).
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page panier</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Si le vendeur a plusieurs boutiques, le client peut sélectionner l'emplacement de retrait. 
                  Le stock est vérifié en temps réel.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>👤</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Espace client</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Dans "Mon compte", le client voit l'adresse de retrait et peut obtenir un itinéraire 
                  vers la boutique via Google Maps.
                </p>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.accentLight,
              padding: '20px',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>
                💡 <strong>Astuce :</strong> Lorsque le client choisit "Retrait en magasin", les frais de livraison 
                sont automatiquement supprimés du panier. Une notification confirme l'adresse de retrait.
              </p>
            </div>
          </section>

          {/* Section 7: Retrait sur page panier */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛒 Retrait sur la page panier
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Compatibilité avec Panier divisé
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Le retrait en magasin est compatible avec l'add-on Panier divisé. Les clients peuvent :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px', marginBottom: '16px' }}>
                <li>Choisir le retrait ou la livraison pour chaque vendeur séparément</li>
                <li>Sélectionner un emplacement de retrait différent par vendeur</li>
                <li>Voir la disponibilité des stocks en temps réel</li>
              </ul>
              <div style={{
                background: styles.redLight,
                borderRadius: '12px',
                padding: '12px',
                marginTop: '16px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> Pour utiliser cette fonctionnalité, les vendeurs doivent configurer 
                  l'option "Tous les produits" dans leur configuration de retrait en magasin.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Compatibilités */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔗 Compatibilités
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📍</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Marché hyperlocal</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Permet de restreindre la zone de service des vendeurs. Les clients voient uniquement 
                  les boutiques dans leur zone géographique.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📮</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Expédition par code postal</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Compatible avec l'expédition par code postal. Les clients peuvent choisir le retrait 
                  pour éviter les frais de livraison.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', padding: '20px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🔨</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Enchères de produits</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients peuvent choisir leur préférence de retrait lors du placement d'une enchère 
                  si le vendeur a activé l'option.
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
              📧 Notifications et emails
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Email de confirmation après paiement
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Lorsqu'un client choisit le retrait en magasin et que le paiement est capturé, 
                un email de confirmation est automatiquement envoyé avec :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>L'adresse complète de la boutique</li>
                <li>Les horaires d'ouverture</li>
                <li>Les instructions pour le retrait</li>
                <li>Un lien Google Maps pour l'itinéraire</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'white',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  ✉️ Activez cette option dans la configuration administrateur pour que les clients 
                  reçoivent automatiquement ces informations.
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
                  Les frais de livraison sont-ils vraiment gratuits en cas de retrait ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Lorsque le client sélectionne "Retrait en magasin", les frais de livraison sont automatiquement 
                  supprimés du panier. Aucune configuration supplémentaire n'est nécessaire.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je avoir plusieurs boutiques pour un seul compte vendeur ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Absolument ! Les vendeurs peuvent ajouter autant d'emplacements qu'ils le souhaitent. 
                  Chaque emplacement a sa propre adresse, ses horaires et sa gestion des stocks.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si le stock n'est pas disponible à l'emplacement choisi ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le système vérifie la disponibilité en temps réel. Si le stock est insuffisant, 
                  le client ne peut pas finaliser la commande et un message d'erreur l'informe du problème.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment les clients trouvent-ils l'adresse de retrait ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'adresse complète est affichée sur la page produit, dans le panier, et dans l'email de confirmation. 
                  Un lien Google Maps permet d'obtenir un itinéraire depuis leur position.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Peut-on combiner retrait et livraison dans un même panier avec plusieurs vendeurs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Avec la compatibilité Panier divisé, les clients peuvent choisir le retrait pour certains vendeurs 
                  et la livraison pour d'autres. Les frais sont calculés séparément pour chaque vendeur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les retours sont-ils gérés différemment ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Pour les retours, le client doit se rendre à la même boutique pour effectuer le retour. 
                  Cela simplifie grandement la gestion des retours pour les vendeurs.
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
              et l'optimisation de vos retraits en magasin.
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
                📚 Documentation retrait en magasin
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
