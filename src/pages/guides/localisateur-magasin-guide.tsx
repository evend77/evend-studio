import React from 'react';
import { Link } from 'react-router-dom';

export default function LocalisateurMagasinGuide() {
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
    mapGreen: '#34a853',
    mapBlue: '#4285f4',
    mapYellow: '#fbbc05',
    mapRed: '#ea4335',
    mapLight: '#e8f5e9'
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
        
        {/* En-tête avec dégradé vert/bleu Google Maps */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.mapGreen} 0%, ${styles.mapBlue} 100%)`,
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
            📍🔄
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
            Guide d'utilisation - Localisateur de magasin
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Permettez à vos clients de localiser facilement les boutiques des vendeurs via Google Maps
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📍 Localisation des boutiques</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🗺️ Google Maps intégré</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏪 Retrait en magasin</span>
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
              'Ajout de localisation - Méthode par défaut',
              'Ajout de localisation - Méthode personnalisée',
              'Gestion des localisations par l\'administrateur',
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
              L'add-on <strong>Localisateur de magasin</strong> (Locate Your Store) permet aux vendeurs d'ajouter l'emplacement 
              de leur boutique afin que les clients puissent les localiser facilement via Google Maps. Les clients peuvent 
              trouver les boutiques proches de chez eux et obtenir un itinéraire.
            </p>
            <div style={{
              background: styles.mapLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.mapGreen}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'add-on Localisateur de magasin est <strong>gratuit</strong>, mais nécessite 
                l'installation de l'application "Locate Your Pickup Store" sur votre boutique Shopify (7$ USD par mois).
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
                <li>Installation de l'application <strong>"Locate Your Pickup Store"</strong> sur Shopify (7$ USD par mois)</li>
                <li>Coût total : <strong>67$ USD par mois</strong> (plan Multivendor 60$ + Locate Your Pickup Store 7$)</li>
                <li>L'add-on Localisateur de magasin est <strong>gratuit</strong></li>
              </ul>
            </div>

            <div style={{
              background: '#e8f5e9',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.mapGreen}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.mapGreen }}>
                🎁 Avantages de l'application
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Permet aux clients de localiser les boutiques des vendeurs</li>
                <li>Intégration avec Google Maps pour l'affichage des itinéraires</li>
                <li>Deux méthodes d'ajout de localisation pour les vendeurs</li>
                <li>Gestion des localisations par l'administrateur (activation/désactivation)</li>
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
                Installer l'application Locate Your Pickup Store
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Avant d'activer l'add-on, vous devez installer l'application <strong>"Locate Your Pickup Store"</strong> 
                depuis le Shopify App Store (7$ USD par mois).
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
                Activer l'add-on Localisateur de magasin
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> (Feature Apps) de votre tableau de bord administrateur.
                Recherchez "Localisateur de magasin" et cliquez sur le bouton <strong>Activer</strong>.
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
                Cliquez sur <strong>Accepter</strong> pour installer l'application sur votre marketplace.
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
                Configuration du Store Locator
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après installation, l'administrateur peut configurer l'add-on :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Store Locator Configuration</strong></li>
                <li>Par défaut, cette configuration est <strong>activée</strong></li>
                <li>L'administrateur peut la <strong>désactiver</strong> à tout moment</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Toutes les autres configurations côté administrateur sont disponibles 
                  dans l'application standalone "Locate Your Pickup Store" sur Shopify.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Ajout de localisation - Méthode par défaut */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏪 Ajout de localisation - Méthode par défaut
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Utilisation de l'adresse du profil vendeur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent utiliser leur adresse par défaut (celle de leur profil) comme emplacement de boutique :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Profil</strong> → <strong>Mon compte</strong></li>
                <li>Cliquez sur <strong>Ajouter un localisateur de magasin</strong> (Add Store Locator)</li>
                <li>Une popup s'ouvre avec les informations d'adresse</li>
                <li>Vous pouvez ajouter la <strong>latitude</strong> et la <strong>longitude</strong> pour que la carte apparaisse dans la popup</li>
                <li>Cliquez sur <strong>Enregistrer l'emplacement</strong> (Save Location)</li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: '#f1f5f9',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: styles.text }}>
                  📝 Mise à jour de l'adresse :
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: styles.textLight }}>
                  Si le vendeur modifie son adresse par défaut, il peut utiliser le même bouton 
                  <strong> "Ajouter un localisateur de magasin"</strong> pour mettre à jour l'emplacement.
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> L'ajout de latitude et longitude permet d'afficher une carte précise 
                  de l'emplacement de la boutique dans la popup de localisation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Ajout de localisation - Méthode personnalisée */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📍 Ajout de localisation - Méthode personnalisée
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Création d'emplacements personnalisés
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent ajouter des emplacements supplémentaires, indépendants de leur adresse de profil :
              </p>
              
              <div style={{
                background: styles.warning + '20',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Condition :</strong> Cette option est uniquement disponible si l'administrateur a activé 
                  l'application <strong>Store Pick Up</strong>.
                </p>
              </div>
              
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Configuration</strong> → <strong>Emplacements</strong> (Location)</li>
                <li>Cliquez sur <strong>Ajouter un emplacement</strong> (Add Location)</li>
                <li>Remplissez les informations :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom de l'emplacement</li>
                  <li>Adresse complète</li>
                  <li>Latitude et longitude (optionnel)</li>
                  <li>Horaires d'ouverture</li>
                </ul>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
                <li>L'emplacement apparaît dans la liste et peut être ajouté au localisateur de magasin</li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: '#f1f5f9',
                padding: '16px',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: styles.text }}>
                  📋 Note importante :
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: styles.textLight }}>
                  Si le vendeur a déjà ajouté des emplacements via l'application <strong>Store Pick Up</strong>, 
                  ces emplacements sont automatiquement disponibles dans le localisateur de magasin.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Gestion des localisations par l'administrateur */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🗂️ Gestion des localisations par l'administrateur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Activation/Désactivation des emplacements
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Tous les emplacements enregistrés sont listés dans l'application <strong>"Locate Your Pickup Store"</strong> 
                sur Shopify.
              </p>
              
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>L'administrateur ne peut pas ajouter ou modifier</strong> les emplacements des vendeurs</li>
                <li>L'administrateur peut <strong>activer ou désactiver</strong> un emplacement</li>
                <li>Pour gérer un emplacement :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Cliquez sur les trois points "..." à côté de l'emplacement</li>
                  <li>Sélectionnez <strong>Activer</strong> ou <strong>Désactiver</strong></li>
                </ul>
              </ul>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.mapLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les emplacements désactivés ne sont plus visibles par les clients 
                  dans le localisateur de magasin.
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
                  Le localisateur de magasin est-il gratuit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'add-on Localisateur de magasin est <strong>gratuit</strong>. Cependant, il nécessite l'installation 
                  de l'application "Locate Your Pickup Store" sur Shopify, qui coûte <strong>7$ USD par mois</strong>.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelles sont les deux méthodes pour ajouter un emplacement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  <strong>Méthode par défaut :</strong> Utilise l'adresse du profil vendeur.<br />
                  <strong>Méthode personnalisée :</strong> Permet d'ajouter des emplacements supplémentaires, 
                  indépendants de l'adresse de profil (nécessite l'activation de Store Pick Up).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment afficher la carte dans la popup de localisation ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le vendeur doit ajouter la <strong>latitude</strong> et la <strong>longitude</strong> de son emplacement 
                  lors de l'ajout. La carte s'affichera alors automatiquement.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  L'administrateur peut-il modifier les emplacements des vendeurs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, l'administrateur ne peut pas ajouter ou modifier les emplacements des vendeurs. 
                  Il peut seulement les <strong>activer</strong> ou les <strong>désactiver</strong>.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire si un vendeur modifie son adresse par défaut ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le vendeur doit utiliser le bouton <strong>"Ajouter un localisateur de magasin"</strong> dans son profil 
                  pour mettre à jour l'emplacement avec la nouvelle adresse.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les emplacements des vendeurs sont-ils visibles sur Google Maps ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les clients peuvent voir les emplacements des vendeurs sur Google Maps et obtenir un itinéraire 
                  pour se rendre à la boutique.
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
              et l'optimisation de votre localisateur de magasin.
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
                📚 Documentation Localisateur de magasin
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
