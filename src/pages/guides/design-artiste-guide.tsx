import React from 'react';
import { Link } from 'react-router-dom';

export default function ArtistProductDesignGuide() {
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
            🎨✏️
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
            Guide d'utilisation - Design d'artiste
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Créez une marketplace d'artistes - Gérez les designs et les produits personnalisés
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🎨 Designs d'artistes</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🖼️ Vérification physique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Commission artiste</span>
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
              'Inscription des artistes',
              'Ajout de designs',
              'Vérification physique',
              'Valeur de remplacement',
              'Création de produits',
              'Commission',
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
              L'add-on <strong>Design d'artiste</strong> permet de créer une marketplace spécialisée pour les artistes. 
              Les artistes peuvent ajouter leurs designs, qui sont ensuite utilisés pour créer des produits. 
              L'administrateur peut gérer la vérification physique des designs, les valeurs de remplacement et les commissions.
            </p>
            <div style={{
              background: styles.pinkLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.pink}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'administrateur peut choisir d'avoir uniquement des artistes ou un mélange 
                d'artistes et de vendeurs classiques sur sa marketplace.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Design d'artiste</li>
              </ul>
            </div>

            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.red}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚠️ <strong>Points importants :</strong>
                <br />- Les vendeurs existants ne peuvent pas être convertis en artistes
                <br />- Deux artistes/vendeurs ne peuvent pas avoir le même email
                <br />- Les designs ne peuvent être ajoutés qu'aux produits normaux (pas de variantes)
                <br />- Un design utilisé dans un produit ne peut plus être supprimé
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
                Recherchez "Design d'artiste" et cliquez sur le bouton <strong>Activer</strong>.
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
                Les nouveaux menus <strong>Configuration des vendeurs</strong> et 
                <strong>Configuration Design d'artiste</strong> apparaissent dans la section 
                <strong>Configuration</strong>.
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
                Configuration des vendeurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration des vendeurs</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Avoir également des vendeurs sur la boutique</strong> : Active pour permettre les vendeurs classiques</li>
                <li><strong>Autoriser l'artiste à ajouter des produits</strong> : Permet aux artistes de créer leurs propres produits</li>
              </ul>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration Design d'artiste
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration Design d'artiste</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Libellé pour l'artiste</strong> : Personnalisez le nom affiché</li>
                <li><strong>Vérification du design</strong> : Active la vérification physique</li>
                <li><strong>Impression du bordereau d'emballage</strong> : Permet d'imprimer les bordereaux</li>
                <li><strong>Nom du lieu de stockage</strong> : Nom de votre entrepôt</li>
                <li><strong>Adresse de stockage</strong> : Adresse complète, ville, pays, code postal</li>
                <li><strong>Valeur de remplacement initiale</strong> : Définissez un pourcentage de remplacement</li>
                <li><strong>Commission artiste</strong> : Activez une commission spécifique pour les artistes</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Inscription des artistes */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🎨 Inscription des artistes
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Inscription par l'administrateur
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Vendeurs</strong> → <strong>Liste des vendeurs</strong></li>
                <li>Cliquez sur <strong>Ajouter un vendeur</strong></li>
                <li>Remplissez le formulaire</li>
                <li>Sélectionnez <strong>Artiste</strong> dans "S'inscrire en tant que"</li>
                <li>Enregistrez</li>
              </ol>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Auto-inscription des artistes
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Le client accède à la page d'inscription vendeur</li>
                <li>Sélectionne <strong>S'inscrire en tant qu'artiste</strong></li>
                <li>Remplit le formulaire</li>
                <li>Soumet sa demande</li>
                <li>L'administrateur approuve la demande (si l'approbation automatique n'est pas activée)</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📧 <strong>Notification :</strong> L'artiste reçoit un email avec le lien vers son tableau de bord 
                  après approbation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Ajout de designs */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖼️ Ajout de designs par les artistes
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
                <li>Connectez-vous à votre <strong>espace artiste</strong></li>
                <li>Allez dans <strong>Produits</strong> → <strong>Design produit</strong></li>
                <li>Cliquez sur <strong>Ajouter un design</strong></li>
                <li>Remplissez les informations :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom du design</li>
                  <li>Description</li>
                  <li>Image du design</li>
                  <li>Prix du design</li>
                </ul>
                <li>Enregistrez le design</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le design est créé en attente d'approbation. L'administrateur doit 
                  l'approuver avant qu'il puisse être utilisé.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Vérification physique */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Vérification physique des designs
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Envoi du design par l'artiste
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Design produit</strong></li>
                <li>Cliquez sur <strong>Modifier</strong> à côté du design</li>
                <li>Cliquez sur <strong>Envoyer le design</strong></li>
                <li>Saisissez les détails d'emballage :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Poids</li>
                  <li>Dimensions</li>
                  <li>Numéro de suivi</li>
                  <li>Transporteur</li>
                </ul>
                <li>Enregistrez</li>
              </ol>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Vérification par l'administrateur
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Design produit</strong></li>
                <li>Cliquez sur <strong>Vérifier</strong> à côté du design</li>
                <li>Validez la vérification (irréversible)</li>
                <li>Téléchargez l'image du design si nécessaire</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.pinkLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  🖨️ <strong>Impression :</strong> L'artiste peut imprimer le bordereau d'emballage en cliquant sur 
                  "Bordereau d'emballage" avant l'envoi.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Valeur de remplacement */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💰 Valeur de remplacement
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                La valeur de remplacement est le montant que l'administrateur verse à l'artiste si le design 
                est perdu ou endommagé pendant la vérification physique.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Valeur initiale</strong> : Pourcentage défini dans la configuration</li>
                <li><strong>Demande de modification</strong> : L'administrateur peut demander un changement</li>
                <li><strong>Valeur finale</strong> : Définie après accord mutuel avec preuve</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📎 <strong>Preuve requise :</strong> L'administrateur doit joindre un fichier (JPEG, JPG, PDF, max 3MB) 
                  montrant l'accord de l'artiste pour la valeur finale.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Création de produits */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛍️ Création de produits avec designs
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Création par l'administrateur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <ol style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                    <li>Cliquez sur <strong>Ajouter un produit</strong></li>
                    <li>Type de produit : <strong>Normal</strong></li>
                    <li>Email du vendeur : <strong>Email de l'artiste</strong></li>
                    <li>Cliquez sur <strong>Sélectionner un design</strong></li>
                    <li>Recherchez le design par son nom</li>
                    <li>Remplissez le formulaire (prix produit {'>'} = prix design)</li>
                    <li>Enregistrez</li>
                  </ol>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎨</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Création par l'artiste</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Si l'administrateur a autorisé les artistes à ajouter des produits :
                  </p>
                  <ol style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                    <li>Cliquez sur <strong>Ajouter un produit</strong></li>
                    <li>Type de produit : <strong>Normal</strong></li>
                    <li>Sélectionnez <strong>Choisir le design artiste</strong></li>
                    <li>Choisissez le design dans la liste</li>
                    <li>Remplissez le formulaire (prix produit {'>'} = prix design)</li>
                    <li>Enregistrez</li>
                  </ol>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.accentLight,
              borderRadius: '16px',
              padding: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: styles.text }}>
                🔄 <strong>Réassignation de produits :</strong> Si un produit est réassigné à un autre vendeur/artiste, 
                le design est automatiquement retiré et doit être réajouté.
              </p>
            </div>
          </section>

          {/* Section 10: Commission */}
          <section id="section-9" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💰 Scénarios de commission
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎨</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Commission artiste activée</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    L'artiste reçoit le prix de son design, l'administrateur reçoit la différence.
                  </p>
                  <div style={{
                    background: styles.pinkLight,
                    borderRadius: '12px',
                    padding: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                      <strong>Exemple :</strong><br />
                      Prix design : 100€<br />
                      Prix produit : 120€<br />
                      → Artiste : 100€ | Admin : 20€
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Commission artiste désactivée</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les commissions s'appliquent selon la configuration standard :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Commission globale</li>
                    <li>Commission collection</li>
                    <li>Commission produit</li>
                    <li>Commission adhésion</li>
                    <li>Commission vendeur</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: '#fff3cd',
              borderRadius: '16px',
              padding: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: styles.text }}>
                ⚠️ <strong>Note :</strong> La commission artiste ne fonctionne pas en cas de prix promotionnel (soldes).
              </p>
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
                  Un vendeur existant peut-il devenir artiste ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les vendeurs existants ne peuvent pas être convertis en artistes. 
                  Ils doivent créer un nouveau compte en tant qu'artiste.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Un artiste peut-il modifier son design après création ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'artiste peut modifier le nom et la description du design, mais pas l'image ni le prix. 
                  Une fois le design utilisé dans un produit, il ne peut plus être supprimé.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la valeur de remplacement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  C'est le montant que l'administrateur verse à l'artiste si le design est perdu ou endommagé 
                  pendant la vérification physique. Une valeur initiale est définie, puis une valeur finale 
                  est convenue avec preuve d'accord.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les designs peuvent-ils être ajoutés à des produits avec variantes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les designs ne peuvent être ajoutés qu'aux produits normaux (sans variantes).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Un produit peut-il contenir plusieurs designs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, chaque produit ne peut contenir qu'un seul design d'artiste.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si un produit est réassigné à un autre artiste ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le design est automatiquement retiré du produit. Le nouvel artiste doit ajouter son propre design.
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
              et l'optimisation de votre marketplace d'artistes.
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
                📚 Documentation Design d'artiste
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
