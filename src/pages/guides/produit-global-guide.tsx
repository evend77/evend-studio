import React from 'react';
import { Link } from 'react-router-dom';

export default function GlobalProductGuide() {
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
            🌍📦
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
            Guide d'utilisation - Produit global
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Créez des produits que plusieurs vendeurs peuvent commercialiser
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🌍 Produits multi-vendeurs</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Gestion des variantes</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📤 Import CSV</span>
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
              'Ajout de produits globaux',
              'Gestion des variantes',
              'Import CSV',
              'Côté vendeur',
              'Commissions',
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
              L'add-on <strong>Produit global</strong> permet au propriétaire de la boutique de créer des produits 
              qui peuvent être vendus par plusieurs vendeurs. Les vendeurs peuvent consulter la liste des produits globaux 
              et choisir ceux qu'ils souhaitent commercialiser en un seul clic.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les vendeurs peuvent définir leurs propres prix et gérer leurs stocks 
                pour chaque produit global qu'ils choisissent de vendre.
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
                <li>Frais supplémentaires de <strong>15$ USD par mois</strong> pour l'add-on Produit global</li>
                <li>Limite Shopify : maximum 100 variantes par produit, 3 options par produit</li>
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
                Recherchez "Produit global" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de 15$ USD et approuvez le paiement dans Shopify Backend.
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
                Un nouveau menu <strong>Configuration produit global</strong> apparaît dans la section 
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
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Options de configuration
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px', marginBottom: '16px' }}>
                <li><strong>Tri des vendeurs</strong> : Ascendant ou descendant selon les prix</li>
                <li><strong>Visibilité des colonnes</strong> : Prix, Image, Description, Quantité</li>
                <li><strong>Gestion des prix</strong> : Autoriser les vendeurs à modifier les prix</li>
                <li><strong>Gestion des stocks</strong> : Autoriser les vendeurs à gérer les quantités</li>
                <li><strong>Gestion des SKU</strong> : Autoriser les vendeurs à gérer les SKU</li>
                <li><strong>Images personnalisées</strong> : Permettre aux vendeurs d'ajouter des images par variante</li>
                <li><strong>Descriptions personnalisées</strong> : Permettre aux vendeurs d'ajouter des descriptions par variante</li>
                <li><strong>Publication automatique</strong> : Publier automatiquement quand un vendeur vend le produit</li>
                <li><strong>Afficher le produit le moins cher</strong> : Afficher en priorité le produit au prix le plus bas</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les vendeurs peuvent personnaliser les prix et les quantités selon vos paramètres.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Ajout de produits globaux */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ➕ Ajout de produits globaux
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Création manuelle
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Produit global</strong></li>
                <li>Cliquez sur <strong>Ajouter un produit global</strong></li>
                <li>Remplissez les informations : titre, description, images, prix</li>
                <li>Ajoutez des variantes si nécessaire</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
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
                Convertir un produit existant
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Importer des produits</strong></li>
                <li>Sélectionnez le produit à convertir</li>
                <li>Cliquez sur <strong>Assigner le produit au vendeur</strong> (menu Actions)</li>
                <li>Sélectionnez <strong>Produit global</strong> dans la liste déroulante</li>
                <li>Cliquez sur <strong>Assigner</strong></li>
              </ol>
            </div>
          </section>

          {/* Section 6: Gestion des variantes */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🎨 Gestion des variantes
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>➕</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Ajout de variantes</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    L'administrateur peut ajouter des variantes lors de la création du produit global :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Couleurs, tailles, matières</li>
                    <li>Jusqu'à 100 variantes maximum</li>
                    <li>Jusqu'à 3 options par produit</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Sélection par le vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent choisir les variantes qu'ils souhaitent vendre :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Variantes non vendues dans "Variantes non listées"</li>
                    <li>Cliquez sur "Vendre" pour chaque variante</li>
                    <li>Définissez prix, quantité et SKU</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Images et descriptions</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent personnaliser :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Images par variante (une seule image)</li>
                    <li>Descriptions par variante</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Import CSV */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📤 Import de produits globaux via CSV
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Procédure d'import
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Produit global</strong></li>
                <li>Cliquez sur <strong>Ajouter un produit global par CSV</strong> (menu Actions)</li>
                <li>Téléchargez le fichier d'instructions</li>
                <li>Téléchargez l'exemple de CSV pour le formatage</li>
                <li>Préparez votre fichier CSV selon le format requis</li>
                <li>Importez le fichier CSV pour validation</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Utilisez l'exemple CSV pour éviter les erreurs de formatage.
                </p>
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
                Vendre un produit global
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Produit global</strong></li>
                <li>Consultez la liste des produits disponibles</li>
                <li>Cliquez sur <strong>Vendre ce produit</strong> (menu Actions)</li>
                <li>Sélectionnez les variantes à vendre</li>
                <li>Définissez :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Prix</li>
                  <li>Prix comparé</li>
                  <li>Gestion des stocks</li>
                  <li>Quantité</li>
                  <li>SKU (si autorisé)</li>
                </ul>
                <li>Cliquez sur <strong>Vendre</strong></li>
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
                Vente en masse
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent vendre plusieurs produits globaux en une seule action :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Sélectionnez plusieurs produits globaux</li>
                <li>Cliquez sur <strong>Action groupée</strong> → <strong>Vente groupée</strong></li>
                <li>Définissez les informations communes</li>
                <li>Les mêmes paramètres s'appliquent à toutes les variantes</li>
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
                Gestion des produits vendus
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Modifier</strong> : Mettre à jour prix, quantité, SKU</li>
                <li><strong>Supprimer</strong> : Retirer le produit de leur catalogue</li>
                <li><strong>Délister</strong> : Arrêter de vendre une variante spécifique</li>
                <li><strong>Délister le produit</strong> : Arrêter de vendre toutes les variantes</li>
              </ul>
            </div>
          </section>

          {/* Section 9: Commissions */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💰 Types de commissions supportés
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les produits globaux supportent plusieurs niveaux de commission (par ordre de priorité) :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Commission produit</strong> (priorité la plus élevée)</li>
                <li><strong>Commission catégorie</strong></li>
                <li><strong>Commission vendeur</strong></li>
                <li><strong>Commission globale</strong> (priorité la plus basse)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.tealLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> La commission produit a la priorité sur toutes les autres configurations.
                </p>
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
                Code d'intégration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour afficher la liste des vendeurs sur la page produit, ajoutez le code suivant dans <strong>product.liquid</strong> :
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <code style={{ fontSize: '13px', color: '#e1e4e8' }}>
                  {'<div class="wk_global_product" data-prod ="{{product.id}}" data-var ="{{product.selected_or_first_available_variant.id}}" style="display:none; border-bottom:1px solid #ddd; border-top:1px solid ddd; padding:5px;" data-tags="{{ product.tags }}" ></div>'}
                </code>
              </div>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour masquer le bouton "Ajouter au panier" sur les produits globaux :
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <code style={{ fontSize: '13px', color: '#e1e4e8' }}>
                  {'{% if product.tags contains \'wk_global\' %}style=\'display:none;\'{% endif %}'}
                </code>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginTop: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Affichage des vendeurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Sur le front-end, les clients voient :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>La liste de tous les vendeurs du produit global</li>
                <li>Leurs prix respectifs</li>
                <li>Les quantités disponibles</li>
                <li>Le nom du vendeur (cliquable vers sa boutique)</li>
                <li>Le pays du vendeur</li>
                <li>Le badge "Vendeur vérifié" si applicable</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Le produit le moins cher est affiché en premier si l'option est activée.
                </p>
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
                  Combien de variantes puis-je ajouter à un produit global ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Selon les limitations Shopify, vous pouvez ajouter jusqu'à 100 variantes par produit, 
                  avec un maximum de 3 options (ex: couleur, taille, matière).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils fixer leurs propres prix ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si l'administrateur active l'option "Autoriser les vendeurs à gérer le prix". 
                  Sinon, ils doivent vendre au prix défini par l'administrateur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment importer des produits globaux en masse ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Utilisez la fonction d'import CSV. Téléchargez le fichier exemple, remplissez-le selon les instructions, 
                  puis importez-le dans la section Produit global.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si un vendeur arrête de vendre un produit global ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le vendeur peut délistrer le produit. Le produit n'apparaît plus sur sa boutique, 
                  mais les autres vendeurs peuvent continuer à le vendre.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la commission sur les produits globaux ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les commissions s'appliquent dans cet ordre : commission produit {' > '} commission catégorie {' > '}
                  commission vendeur {' > '} commission globale. La commission la plus spécifique a la priorité.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les modifications du produit global sont-elles répercutées chez les vendeurs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les modifications (description, images principales) sont automatiquement mises à jour chez tous les vendeurs. 
                  Cependant, les images personnalisées des variantes restent propres à chaque vendeur.
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
              et l'optimisation de vos produits globaux.
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
                📚 Documentation Produit global
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
