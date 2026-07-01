import React from 'react';
import { Link } from 'react-router-dom';

export default function ShippingFreeGuide() {
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
    blueLight: '#dbeafe'
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
        
        {/* En-tête avec espace entre l'emoji et le titre */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.accent} 0%, ${styles.purple} 100%)`,
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
            🚚
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
            Guide d'utilisation - Expédition gratuite
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Offrez la livraison sans frais à vos clients et boostez vos ventes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Livraison offerte</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🎯 Conversion optimisée</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Activation simple</span>
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
              'Pourquoi utiliser cette fonctionnalité',
              'Installation et activation',
              'Configuration côté administrateur',
              'Configuration côté vendeur',
              'Types de configuration',
              'Paramètres avancés',
              'Expédition gratuite au checkout',
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
              L'add-on <strong>Expédition gratuite</strong> est une fonctionnalité puissante qui permet aux vendeurs de votre marketplace d'offrir la livraison sans frais à leurs clients selon des conditions personnalisables. 
              Cette stratégie marketing est reconnue comme l'un des leviers de conversion les plus efficaces dans le e-commerce.
            </p>
            <div style={{
              background: styles.blueLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.blue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>Le saviez-vous ?</strong> Selon une étude de Baymard Institute, 48% des abandons de panier sont dus à des frais de livraison trop élevés ou imprévus. 
                Offrir la livraison gratuite peut augmenter votre taux de conversion de 30% en moyenne !
              </p>
            </div>
          </section>

          {/* Section 2: Pourquoi utiliser */}
          <section id="section-1" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🎯 Pourquoi utiliser l'expédition gratuite ?
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginTop: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Augmentation du panier moyen</h3>
                <p style={{ fontSize: '14px', color: styles.textLight, margin: 0 }}>
                  Les clients ajoutent des articles supplémentaires pour atteindre le seuil de livraison gratuite.
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Réduction des abandons de panier</h3>
                <p style={{ fontSize: '14px', color: styles.textLight, margin: 0 }}>
                  Supprimez l'obstacle principal qui empêche vos clients de finaliser leurs achats.
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⭐</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Fidélisation client</h3>
                <p style={{ fontSize: '14px', color: styles.textLight, margin: 0 }}>
                  Une expérience d'achat positive encourage les achats répétés et la recommandation.
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
              ⚙️ Étape 1 : Installation et activation
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
                Accéder à la section des modules complémentaires
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans votre tableau de bord administrateur, puis cliquez sur <strong>Modules complémentaires</strong> dans le menu latéral.
                Vous verrez la liste de tous les add-ons disponibles pour votre marketplace.
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
                Localiser et activer "Expédition gratuite"
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Dans la liste, recherchez l'add-on <strong>Expédition gratuite</strong>. Cliquez sur le bouton <strong>Activer</strong>.
                L'activation est instantanée et ne nécessite aucun redémarrage du serveur.
              </p>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  ✅ Astuce : Une fois activé, un nouveau sous-menu "Méthodes d'expédition" apparaît dans la section Configuration.
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
                }}>3</span>
                Vérifier l'activation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Une notification de confirmation apparaîtra. Vous pouvez également vérifier que l'add-on apparaît comme "Actif" dans la liste des modules.
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
              👑 Étape 2 : Configuration côté administrateur
            </h2>
            
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '24px' }}>
              En tant qu'administrateur, vous avez le contrôle global sur la configuration de l'expédition gratuite.
              Voici comment paramétrer les options globales.
            </p>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Accéder à la configuration</h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong></li>
                <li>Cliquez sur le bouton <strong>Configurer</strong> à côté de "Expédition gratuite"</li>
                <li>Vous accédez à la <strong>Configuration globale d'expédition</strong></li>
              </ol>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Options de configuration globale</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>📦 Type d'expédition</h4>
                <p style={{ color: styles.textLight, marginBottom: '8px' }}>Choisissez entre :</p>
                <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                  <li><strong>Expédition unique</strong> : Une seule méthode d'expédition disponible</li>
                  <li><strong>Expédition multiple</strong> : Plusieurs méthodes d'expédition parmi lesquelles les clients peuvent choisir</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>🗺️ Type de zone</h4>
                <p style={{ color: styles.textLight }}>Sélectionnez comment les zones d'expédition sont définies :</p>
                <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                  <li><strong>Par pays</strong> : Configuration individuelle pour chaque pays</li>
                  <li><strong>Par zone</strong> : Regrouper plusieurs pays dans une même zone</li>
                  <li><strong>Par code postal</strong> : Configuration précise par code postal</li>
                </ul>
              </div>

              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>📅 Délais de livraison estimés</h4>
                <p style={{ color: styles.textLight }}>
                  Activez l'affichage des délais de livraison estimés sur les pages produits et au checkout.
                  Les clients verront des informations comme "Livraison estimée entre 3 et 5 jours ouvrables".
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Configuration vendeur */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Étape 3 : Configuration côté vendeur
            </h2>
            
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '24px' }}>
              Une fois l'add-on activé par l'administrateur, chaque vendeur peut configurer ses propres règles d'expédition gratuite.
            </p>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Accéder à la configuration vendeur</h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong></li>
                <li>Localisez "Expédition gratuite" dans la liste</li>
                <li>Cliquez sur le bouton <strong>Voir</strong> dans la colonne Actions</li>
              </ol>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Ajouter des règles d'expédition</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>1. Créer des fourchettes de prix</h4>
                <p style={{ color: styles.textLight }}>
                  Cliquez sur <strong>Ajouter une fourchette</strong> pour définir des tranches de prix.
                  Par exemple :
                </p>
                <ul style={{ color: styles.textLight, marginLeft: '20px', marginTop: '8px' }}>
                  <li>0€ - 49,99€ : Frais de livraison 5,99€</li>
                  <li>50€ - 99,99€ : Livraison gratuite</li>
                  <li>100€ et plus : Livraison gratuite express</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>2. Définir les zones éligibles</h4>
                <p style={{ color: styles.textLight }}>
                  Sélectionnez les pays, zones ou codes postaux où l'offre de livraison gratuite s'applique.
                  Vous pouvez également définir des règles différentes selon la localisation.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>3. Définir comme méthode par défaut</h4>
                <p style={{ color: styles.textLight }}>
                  Cliquez sur l'icône <strong>...</strong> et sélectionnez <strong>Définir comme par défaut</strong>.
                  Cette méthode d'expédition sera alors automatiquement appliquée à tous vos produits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Types de configuration */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🗺️ Types de configuration d'expédition
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌍</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Expédition par pays</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Configurez des règles de livraison gratuite spécifiques pour chaque pays.
                    Idéal si votre marketplace opère à l'international avec des stratégies de prix différentes selon les marchés.
                  </p>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '13px' }}>
                    <strong>Exemple :</strong><br />
                    France : livraison gratuite dès 50€<br />
                    Belgique : livraison gratuite dès 80€<br />
                    Suisse : livraison gratuite dès 100 CHF
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Expédition par zone</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Regroupez plusieurs pays dans une même zone avec des règles de livraison identiques.
                    Simplifie la gestion pour les vendeurs qui expédient vers plusieurs pays voisins.
                  </p>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '13px' }}>
                    <strong>Exemple :</strong><br />
                    Zone Europe : France, Belgique, Luxembourg, Suisse → livraison gratuite dès 70€<br />
                    Zone Amérique du Nord : États-Unis, Canada → livraison gratuite dès 90$
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📮</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Expédition par code postal</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Offrez la livraison gratuite uniquement dans certaines zones postales.
                    Parfait pour les vendeurs locaux ou pour des zones géographiques spécifiques.
                  </p>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '13px' }}>
                    <strong>Exemple :</strong><br />
                    Paris (75000-75999) : livraison gratuite dès 30€<br />
                    Province : livraison gratuite dès 60€<br />
                    Corse et DOM-TOM : livraison gratuite dès 100€
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Paramètres avancés */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚡ Paramètres avancés
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              
              <div style={{ marginBottom: '28px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎯</span> Seuil personnalisable par vendeur
                </h3>
                <p style={{ color: styles.textLight }}>
                  Chaque vendeur peut définir son propre seuil de livraison gratuite selon sa stratégie commerciale.
                  Un vendeur de produits haut de gamme pourra fixer un seuil à 200€, tandis qu'un vendeur de produits d'appel pourra le fixer à 30€.
                </p>
              </div>

              <div style={{ marginBottom: '28px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span> Périodes promotionnelles limitées
                </h3>
                <p style={{ color: styles.textLight }}>
                  Planifiez des campagnes de livraison gratuite temporaires pour le Black Friday, les soldes ou les événements spéciaux.
                  Définissez une date de début et de fin, l'offre s'activera et se désactivera automatiquement.
                </p>
              </div>

              <div style={{ marginBottom: '28px', borderBottom: `1px solid ${styles.border}`, paddingBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏷️</span> Exclusion de produits
                </h3>
                <p style={{ color: styles.textLight }}>
                  Certains produits (encombrants, fragiles, produits sous-dimensionnés) peuvent être exclus de l'offre de livraison gratuite.
                  Vous pouvez exclure des catégories entières ou des produits spécifiques.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔄</span> Expédition gratuite conditionnelle
                </h3>
                <p style={{ color: styles.textLight }}>
                  Créez des conditions complexes : "Livraison gratuite pour les membres premium", 
                  "Livraison gratuite pour toute première commande", ou "Livraison gratuite pour les commandes passées en semaine".
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Affichage au checkout */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💳 Expédition gratuite au checkout
            </h2>
            
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '24px' }}>
              Voici comment l'expédition gratuite s'affiche pour vos clients à chaque étape du processus d'achat.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛍️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page produit</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Un indicateur "Livraison gratuite dès X€ d'achat" encourage l'ajout au panier.
                  Le client voit immédiatement la condition à remplir.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Panier</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Une barre de progression montre au client combien il lui reste à ajouter pour bénéficier de la livraison gratuite.
                  Un puissant moteur de vente incrémentale !
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>💳</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Checkout</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Le montant des frais de livraison est automatiquement ajusté à 0€ lorsque les conditions sont remplies.
                  Aucune action manuelle requise.
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
                💡 <strong>Astuce :</strong> Pour les marketplaces avec plusieurs vendeurs, 
                le panier affiche la progression vers la livraison gratuite pour chaque vendeur séparément.
                Le client voit clairement chez quel vendeur il doit ajouter des articles pour bénéficier de l'offre.
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
                  La livraison gratuite s'applique-t-elle à toutes les commandes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, elle s'applique selon les conditions que vous définissez (montant minimum, zones géographiques, etc.). 
                  Vous gardez un contrôle total sur l'éligibilité.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je combiner avec d'autres offres promotionnelles ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, la livraison gratuite peut être combinée avec des codes promo et autres réductions. 
                  Vous pouvez définir dans les paramètres si les offres sont cumulables ou non.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si le client a des produits de plusieurs vendeurs dans son panier ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Chaque vendeur gère indépendamment sa politique de livraison gratuite. 
                  Le panier affichera clairement les conditions pour chaque vendeur et le montant total des frais de livraison.
                  Les frais sont calculés séparément puis additionnés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment suivre l'impact sur mes ventes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'add-on intègre des statistiques détaillées : nombre de commandes bénéficiant de la livraison gratuite, 
                  panier moyen des commandes avec livraison gratuite, taux de conversion, et impact sur le chiffre d'affaires.
                  Accédez-y depuis le tableau de bord des statistiques.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  La livraison gratuite s'applique-t-elle aux retours ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, l'offre de livraison gratuite concerne uniquement l'expédition initiale de la commande.
                  Les frais de retour restent à la charge du client selon la politique de retour de chaque vendeur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je définir des seuils différents selon les catégories de produits ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Vous pouvez créer des règles complexes où certaines catégories bénéficient d'un seuil plus bas.
                  Par exemple, les livres peuvent être livrés gratuitement dès 30€ tandis que l'électronique nécessite 100€.
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
              et l'optimisation de vos stratégies d'expédition.
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
                📚 Voir la documentation complète
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
