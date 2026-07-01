import React from 'react';
import { Link } from 'react-router-dom';

export default function AchatsGroupesGuide() {
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
    groupOrange: '#f97316',
    groupGreen: '#22c55e',
    groupLight: '#fff4ed'
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
        
        {/* En-tête avec dégradé orange/vert */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.groupOrange} 0%, ${styles.groupGreen} 100%)`,
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
            👥💰
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
            Guide d'utilisation - Achats groupés
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Permettez aux clients de créer ou rejoindre des groupes pour acheter à prix réduit
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>👥 Achats groupés</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Prix dégressifs</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🎯 Réduction de l'abandon de panier</span>
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
              'Configuration technique',
              'Configuration côté vendeur',
              'Types de groupes',
              'Expérience client',
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
              L'add-on <strong>Achats groupés</strong> (Group Buy) intègre l'application Easy Group Buy avec votre marketplace Shopify. 
              Cette fonctionnalité permet aux clients de créer ou rejoindre des groupes pour acheter des produits à prix réduit. 
              Plus le groupe est grand, plus la remise est attractive.
            </p>
            <div style={{
              background: styles.groupLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.groupOrange}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Les achats groupés réduisent l'abandon de panier, augmentent le taux de conversion 
                et le panier moyen. Les clients peuvent créer des groupes privés (sur invitation) ou publics (accessibles à tous).
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
                <li>Frais supplémentaires pour l'add-on Achats groupés (selon le plan choisi)</li>
                <li>Installation de l'application <strong>Easy Group Buy</strong> sur Shopify (si ce n'est pas déjà fait)</li>
                <li>Thème Shopify compatible (Online Store 2.0 comme Dawn)</li>
              </ul>
            </div>

            <div style={{
              background: styles.success + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.success}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.success }}>
                🎯 Avantages des achats groupés
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>✅ Réduction de l'abandon de panier</li>
                <li>✅ Augmentation du taux de conversion</li>
                <li>✅ Hausse du panier moyen</li>
                <li>✅ Effet viral via les invitations</li>
                <li>✅ Fidélisation client</li>
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
                Rendez-vous dans la section <strong>Modules complémentaires</strong> (Feature Apps) de votre tableau de bord administrateur.
                Recherchez "Easy Group Buy" et cliquez sur le bouton <strong>Activer</strong>.
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
                Installer l'application Easy Group Buy
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Si vous n'avez pas déjà installé l'application <strong>Easy Group Buying</strong> sur votre boutique Shopify, 
                vous serez invité à l'installer. Acceptez l'installation.
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
                Acceptez les frais supplémentaires pour l'add-on et approuvez le paiement dans Shopify Backend.
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
                Configuration Shopify
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour la configuration détaillée côté administrateur Shopify, référez-vous à la documentation officielle. 
                Les principaux paramètres incluent :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Types de groupes autorisés</strong> : Publics et/ou privés</li>
                <li><strong>Durée maximale des groupes</strong> : Validité des offres groupées</li>
                <li><strong>Seuil minimum de participants</strong> : Nombre requis pour déclencher la remise</li>
                <li><strong>Pourcentage de remise par palier</strong> : Configuration des réductions</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Configuration technique */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🖥️ Configuration technique (Code)
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Affichage du widget Group Buy
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour afficher le widget "Group Buy" sur la page produit, utilisez l'une des deux méthodes :
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📱 Méthode 1 : Éditeur de thème (Online Store 2.0)
                </h4>
                <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                  <li>Allez dans <strong>Boutique en ligne</strong> → <strong>Thèmes</strong> → <strong>Personnaliser</strong></li>
                  <li>Ajoutez le bloc "Group Buy" sur la page produit</li>
                  <li>Déplacez et ajustez le bloc selon vos besoins</li>
                </ol>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📝 Méthode 2 : Code manuel
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight, marginBottom: '8px' }}>
                  Ajoutez ce code dans <strong>main-product.liquid</strong> juste après <code>{'</product-form>'}</code> :
                </p>
                <pre style={{
                  background: '#1a2332',
                  color: '#e2e8f0',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  overflow: 'auto'
                }}>
{`<div id='wk_group_buy_product' pid='{{ product.id }}' cid='{{ customer.id|default: 0 }}' cemail='{{ customer.email|default: 0 }}'></div>`}
                </pre>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  👤 Affichage du compte Group Buy
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight, marginBottom: '8px' }}>
                  Ajoutez ce code dans <strong>account.liquid</strong> (en haut du fichier) :
                </p>
                <pre style={{
                  background: '#1a2332',
                  color: '#e2e8f0',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  overflow: 'auto'
                }}>
{`<button type="button" style="border-radius: 2px;border: 2px solid black;background: inherit;display: block;margin: 0 auto;"><a href="pages/group-buy-account" style="color: black;text-decoration: none;font-size:20px;">{{shop.metafields.wk_group_buy_labels.translation_labels.group_buy_account_btn|default: "Group Buy Account"}}</a></button>`}
                </pre>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration côté vendeur */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
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
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Ajout de produits en achats groupés
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent ajouter des produits éligibles aux achats groupés :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Cliquez sur <strong>Ajouter un produit</strong> ou sélectionnez un produit existant</li>
                <li>Cliquez sur <strong>Ajouter un achat groupé</strong> (Add Group Buy)</li>
                <li>Configurez les paramètres :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Pourcentage de remise</strong> : La réduction offerte</li>
                  <li><strong>Nombre minimum de membres</strong> : Seuil pour déclencher la remise</li>
                  <li><strong>Validité du groupe</strong> : Durée de l'offre groupée</li>
                </ul>
                <li>Sauvegardez les modifications</li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📋 Gestion des produits groupés
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les vendeurs peuvent consulter et modifier les produits ajoutés aux groupes via :
                </p>
                <ul style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px', marginTop: '8px' }}>
                  <li><strong>Produits groupés</strong> : Liste des produits avec offre groupée</li>
                  <li><strong>Groupes</strong> : Liste des groupes créés par les clients</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7: Types de groupes */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👥 Types de groupes
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌍</div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: styles.groupOrange }}>Groupe public</h4>
                  <p style={{ fontSize: '13px', color: styles.textLight, margin: 0 }}>
                    Visible par tous les clients. N'importe qui peut rejoindre le groupe et bénéficier de la remise.
                    Idéal pour maximiser les ventes et atteindre rapidement le seuil minimum.
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: styles.groupGreen }}>Groupe privé</h4>
                  <p style={{ fontSize: '13px', color: styles.textLight, margin: 0 }}>
                    Visible uniquement sur invitation. Seuls les clients invités par email peuvent rejoindre.
                    Idéal pour les offres exclusives entre amis ou collègues.
                  </p>
                </div>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.groupLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Fonctionnement :</strong> Un client crée un groupe, entre son email et celui des invités (pour les groupes privés), 
                  puis procède à l'achat. Les invités reçoivent une notification par email pour rejoindre le groupe.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Expérience client */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🛒 Expérience client
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer ou rejoindre un groupe
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Sur la page produit, les clients ont deux options :
              </p>
              
              <div style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  flex: 1,
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>➕ Créer un groupe</h4>
                  <ol style={{ fontSize: '12px', color: styles.textLight, marginLeft: '20px' }}>
                    <li>Cliquez sur "Créer un groupe"</li>
                    <li>Entrez le nom du groupe</li>
                    <li>Pour un groupe privé : entrez les emails des invités</li>
                    <li>Cliquez sur "Créer et acheter"</li>
                    <li>Procédez au paiement</li>
                  </ol>
                </div>
                
                <div style={{
                  flex: 1,
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>👥 Rejoindre un groupe</h4>
                  <ol style={{ fontSize: '12px', color: styles.textLight, marginLeft: '20px' }}>
                    <li>Parcourez les groupes existants</li>
                    <li>Sélectionnez un groupe public</li>
                    <li>Cliquez sur "Rejoindre le groupe"</li>
                    <li>Procédez à l'achat avec la remise</li>
                  </ol>
                </div>
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
                  Qu'est-ce qu'un achat groupé ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Un achat groupé permet à plusieurs clients de s'associer pour acheter un produit et bénéficier d'une remise. 
                  Plus le groupe est grand, plus la remise peut être importante.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre groupe public et groupe privé ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  <strong>Groupe public :</strong> Visible et accessible à tous les clients.<br />
                  <strong>Groupe privé :</strong> Visible uniquement sur invitation. Le créateur invite des personnes par email.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment les vendeurs créent-ils des offres groupées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent ajouter des produits aux achats groupés depuis leur espace vendeur, 
                  en configurant le pourcentage de remise, le nombre minimum de membres et la durée de validité.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les achats groupés réduisent-ils vraiment l'abandon de panier ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les achats groupés créent un sentiment d'urgence et d'exclusivité qui motive les clients à finaliser 
                  leur achat. De plus, les invitations entre amis génèrent un effet viral.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment afficher le widget Group Buy sur la page produit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Deux méthodes : via l'éditeur de thème (ajout d'un bloc) ou via l'ajout manuel de code 
                  dans le fichier <code>main-product.liquid</code>.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels sont les avantages pour les vendeurs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les vendeurs peuvent écouler leurs stocks plus rapidement, augmenter leur volume de ventes 
                  et attirer de nouveaux clients grâce aux invitations entre membres.
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
              et l'optimisation de vos achats groupés.
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
                📚 Documentation Achats groupés
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
