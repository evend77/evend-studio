import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomOptionsGuide() {
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
            ⚙️📝
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
            Guide d'utilisation - Options personnalisées
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Permettez aux clients de personnaliser leurs achats avec des options supplémentaires
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📝 Options personnalisées</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Prix additionnels</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📋 Champs obligatoires</span>
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
              'Types d\'options',
              'Ajout d\'options (Admin)',
              'Ajout d\'options (Vendeur)',
              'Options globales',
              'Options au niveau variante',
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
              L'add-on <strong>Options personnalisées</strong> permet aux vendeurs d'ajouter des champs personnalisés 
              aux produits. Les clients peuvent ainsi fournir des informations supplémentaires lors de l'achat 
              (gravures, instructions spéciales, personnalisations) ou choisir des options payantes supplémentaires.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Jusqu'à 25 options personnalisées peuvent être ajoutées par produit. 
                Les types d'options disponibles : Texte, Zone de texte, Case à cocher, Liste déroulante et Sélection multiple.
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
                <li>Frais supplémentaires de <strong>7$ USD par mois</strong> pour l'add-on Options personnalisées</li>
                <li>Le type de panier ne doit pas être "Drawer"</li>
                <li>Désactiver la notification d'ajout au panier dans le thème</li>
              </ul>
            </div>

            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.red}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚠️ <strong>Limitations :</strong> Maximum 25 options par produit, 20 options par liste déroulante. 
                Les caractères ' , " , :: , , ne sont pas autorisés dans les noms de champs.
              </p>
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
                Recherchez "Options personnalisées" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de 7$ USD et approuvez le paiement dans Shopify Backend.
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
                Activer la configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration des options personnalisées</strong>.
                Activez <strong>Autoriser les vendeurs à ajouter des options personnalisées</strong>.
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
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Types d'entrée autorisés</strong> : Sélectionnez les types d'options disponibles</li>
                <li><strong>Rendre les champs obligatoires</strong> : Force les clients à remplir les options</li>
                <li><strong>Options globales</strong> : Créez des options réutilisables pour tous les vendeurs</li>
                <li><strong>Options au niveau variante</strong> : Activez les options par variante de produit</li>
                <li><strong>Date d'expiration des options</strong> : Limitez la disponibilité des options dans le temps</li>
                <li><strong>Option "Tout sélectionner"</strong> : Ajoutez un bouton pour sélectionner toutes les options</li>
                <li><strong>Valeurs présélectionnées</strong> : Définissez des options sélectionnées par défaut</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Types d'options */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Types d'options personnalisées
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Texte et Zone de texte</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Permettent aux clients de saisir du texte libre. Idéal pour :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Gravures personnalisées</li>
                    <li>Instructions spéciales</li>
                    <li>Messages cadeaux</li>
                  </ul>
                  <div style={{ background: styles.tealLight, borderRadius: '8px', padding: '8px', marginTop: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Exemple : "Ajoutez les initiales à graver"</p>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>☑️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Case à cocher</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Option binaire avec prix additionnel possible. Idéal pour :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Garantie prolongée</li>
                    <li>Emballage cadeau</li>
                    <li>Assurance supplémentaire</li>
                  </ul>
                  <div style={{ background: styles.tealLight, borderRadius: '8px', padding: '8px', marginTop: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Exemple : "Garantie 2 ans (+10€)"</p>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Liste déroulante</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Choix unique parmi plusieurs options avec prix différents. Idéal pour :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Choix de couleurs</li>
                    <li>Taille de produit</li>
                    <li>Options de livraison</li>
                  </ul>
                  <div style={{ background: styles.tealLight, borderRadius: '8px', padding: '8px', marginTop: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Exemple : "Taille : S / M / L / XL (+5€ pour XL)"</p>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.orange}, ${styles.orange}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔘</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Sélection multiple</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Choix multiples avec prix additionnels cumulables. Idéal pour :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Personnalisations multiples</li>
                    <li>Options complémentaires</li>
                    <li>Pack de produits</li>
                  </ul>
                  <div style={{ background: styles.tealLight, borderRadius: '8px', padding: '8px', marginTop: '12px' }}>
                    <p style={{ margin: 0, fontSize: '12px' }}>Exemple : "Front Print (+5€), Back Print (+7€)"</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Ajout d'options (Admin) */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👑 Ajout d'options personnalisées - Administrateur
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
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Ajoutez ou modifiez un produit</li>
                <li>Scrollez vers le bas jusqu'à la section <strong>Options personnalisées</strong></li>
                <li>Cliquez sur <strong>Ajouter une option</strong></li>
                <li>Sélectionnez le <strong>type d'entrée</strong> (Texte, Case à cocher, etc.)</li>
                <li>Remplissez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom du champ</li>
                  <li>Valeurs (pour listes déroulantes et sélections multiples)</li>
                  <li>Prix additionnels (optionnel)</li>
                  <li>Rendre obligatoire (cocher si nécessaire)</li>
                  <li>Date d'expiration (optionnel)</li>
                </ul>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
            </div>
          </section>

          {/* Section 7: Ajout d'options (Vendeur) */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Ajout d'options personnalisées - Côté vendeur
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
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Ajoutez ou modifiez un produit</li>
                <li>Scrollez vers le bas jusqu'à la section <strong>Options personnalisées</strong></li>
                <li>Choisissez entre :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Utiliser les options prédéfinies</strong> (globales)</li>
                  <li><strong>Créer des options personnalisées</strong> (manuellement)</li>
                </ul>
                <li>Ajoutez vos options</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le choix entre options prédéfinies et options personnalisées est définitif 
                  pour chaque produit. Pour changer, supprimez d'abord toutes les options existantes.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Options globales */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🌍 Options globales prédéfinies
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer des options globales
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Options globales</strong></li>
                <li>Cliquez sur <strong>Ajouter une option globale</strong></li>
                <li>Configurez l'option comme pour un produit</li>
                <li>Enregistrez</li>
              </ol>
              <p style={{ color: styles.textLight, marginTop: '16px' }}>
                Ces options seront disponibles pour tous les vendeurs et pour l'administrateur.
              </p>
            </div>
          </section>

          {/* Section 9: Options au niveau variante */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Options au niveau variante
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Migration et configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Lorsque vous activez les options au niveau variante :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Supprimer les options au niveau produit</strong> : Efface toutes les options existantes</li>
                <li><strong>Déplacer les options au niveau variante</strong> : Transfère les options actuelles</li>
              </ul>
              <p style={{ color: styles.textLight, marginTop: '16px' }}>
                <strong>Note importante :</strong> Une fois passé au niveau variante, vous ne pouvez pas revenir au niveau produit.
              </p>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Ajout d'options par variante
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Sélectionnez un produit avec variantes</li>
                <li>Dans la section <strong>Détails des variantes</strong>, cliquez sur les trois points (⋮) à côté d'une variante</li>
                <li>Sélectionnez <strong>Modifier</strong></li>
                <li>Ajoutez les options personnalisées pour cette variante spécifique</li>
                <li>Enregistrez</li>
              </ol>
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
                Code d'intégration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour afficher les options personnalisées sur la boutique, ajoutez le code suivant 
                dans <strong>product.liquid</strong> (à l'intérieur de la balise form) :
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <code style={{ fontSize: '13px', color: '#e1e4e8' }}>
                  {'{% render \'wk-product-custom-option\' %}'}
                </code>
              </div>
              <p style={{ color: styles.textLight }}>
                Si le fichier n'existe pas, cliquez sur <strong>Régénérer</strong> dans la section 
                <strong>Instructions pour la marketplace</strong>.
              </p>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Visualisation
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Page produit</strong> : Les options personnalisées apparaissent sous le formulaire d'achat</li>
                <li><strong>Page panier</strong> : Les options sélectionnées sont affichées avec les prix additionnels</li>
                <li><strong>Page commande</strong> : Les informations sont visibles par l'administrateur et le vendeur</li>
              </ul>
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
                  Combien d'options personnalisées puis-je ajouter par produit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Maximum 25 options personnalisées par produit. Pour les listes déroulantes, maximum 20 options par liste.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels caractères ne sont pas autorisés dans les noms de champs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les caractères suivants ne sont pas autorisés : apostrophe ('), guillemet ("), double deux-points (::), virgule (,). 
                  Utilisez la barre verticale (|) comme séparateur si nécessaire.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les options personnalisées sont-elles compatibles avec le panier divisé ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, assurez-vous d'activer les propriétés produit dans la configuration du panier divisé.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je rendre les options obligatoires ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, cochez l'option "Rendre ce champ obligatoire" lors de la création de l'option. 
                  Le client devra alors le remplir pour finaliser l'achat.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les options globales peuvent-elles être modifiées après création ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les options globales peuvent être modifiées à tout moment. Les modifications s'appliqueront 
                  aux produits qui utilisent ces options.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la date d'expiration des options ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Activez l'option dans la configuration. Les vendeurs pourront alors définir une date d'expiration 
                  pour leurs options (ex: offres limitées, promotions saisonnières). Après la date, l'option n'est plus visible.
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
              et l'optimisation de vos options personnalisées.
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
                📚 Documentation Options personnalisées
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
