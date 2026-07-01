import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurSooposGuide() {
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
    sooposTeal: '#00a4a6',
    sooposTealLight: '#e6f7f7',
    sooposDark: '#008080'
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
        
        {/* En-tête avec dégradé turquoise/bleu */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.sooposTeal} 0%, ${styles.accent} 100%)`,
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
            💻🔄
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
            Guide d'utilisation - Connecteur SooPOS
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les produits des vendeurs SooPOS avec votre marketplace Shopify
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💻 SooPOS vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Gestion des stocks POS</span>
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
              'Conditions requises',
              'Configuration côté vendeur',
              'Configuration côté administrateur',
              'Mapping vendeur - vendor',
              'Import des produits',
              'Mises à jour automatiques',
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
              L'add-on <strong>Connecteur SooPOS</strong> permet aux vendeurs utilisant SooPOS (Shopify+POS) de synchroniser 
              leurs produits avec votre marketplace Shopify. SooPOS est une solution parfaite de gestion des stocks 
              et des commandes pour les boutiques en ligne avec point de vente physique.
            </p>
            <div style={{
              background: styles.sooposTealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.sooposTeal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Le connecteur SooPOS permet de synchroniser les produits des vendeurs 
                automatiquement lorsque le nom de la boutique du vendeur correspond au champ "vendor" sur Shopify.
                Les modifications effectuées sur Shopify sont automatiquement mises à jour dans l'application.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Connecteur SooPOS</li>
                <li>Les vendeurs doivent avoir des produits avec le tag "SooPOS" sur Shopify</li>
                <li>Le nom de la boutique du vendeur doit correspondre au champ "vendor" sur Shopify</li>
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
                Recherchez "Connecteur SooPOS" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>10$ USD</strong> et approuvez le paiement dans Shopify Backend.
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
                Un nouveau menu <strong>Configuration SooPOS</strong> apparaît dans la section 
                <strong>Configuration</strong> du tableau de bord des vendeurs.
              </p>
            </div>
          </section>

          {/* Section 4: Conditions requises */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ✅ Conditions requises
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <p style={{ color: styles.textLight, marginBottom: '20px' }}>
                Le connecteur fonctionne avec les <strong>nouveaux produits</strong> uniquement si les trois conditions 
                suivantes sont remplies :
              </p>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>✅ Les vendeurs doivent activer la <strong>"Configuration SooPOS"</strong> depuis leur tableau de bord vendeur</li>
                <li>✅ Le tag <strong>"SooPOS"</strong> doit être assigné aux produits sur Shopify</li>
                <li>✅ Le <strong>nom de la boutique du vendeur</strong> sur la marketplace doit correspondre au champ 
                <strong>"vendor"</strong> dans la section "Ajouter un produit" de Shopify</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note importante :</strong> Le connecteur fonctionne uniquement avec les <strong>nouveaux produits</strong>. 
                  Pour les produits existants, l'administrateur doit assigner manuellement les produits aux vendeurs.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Configuration côté vendeur */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
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
                Activation de SooPOS
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs doivent activer le connecteur depuis leur tableau de bord :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à l'espace <strong>vendeur</strong></li>
                <li>Allez dans <strong>Configuration</strong> → <strong>Configuration SooPOS</strong></li>
                <li>Activez l'option <strong>SooPOS</strong></li>
                <li>Sauvegardez les modifications</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.sooposTealLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> C'est la seule action requise pour les vendeurs. Une fois activé, 
                  les produits avec le tag "SooPOS" seront automatiquement synchronisés.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Configuration côté administrateur */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
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
                Vérification pré-import
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Avant d'importer les produits, l'administrateur doit vérifier :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Que le tag <strong>"SooPOS"</strong> est bien présent sur les produits à importer</li>
                <li>Que le <strong>nom de la boutique du vendeur</strong> dans l'application correspond au champ 
                <strong>"vendor"</strong> sur Shopify</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> La correspondance entre le nom du vendeur et le champ "vendor" est essentielle 
                  pour l'assignation automatique des produits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Mapping vendeur - vendor */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔗 Mapping vendeur - vendor
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Vérification de la correspondance
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour que l'assignation automatique fonctionne, le nom de la boutique du vendeur doit correspondre 
                exactement au champ "vendor" sur Shopify.
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginTop: '20px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                    📝 Sur la marketplace (vendeur)
                  </h4>
                  <p style={{ fontSize: '13px', color: styles.textLight, margin: 0 }}>
                    Le nom de la boutique du vendeur doit être configuré dans l'édition du vendeur.
                    Exemple : <strong>"Boutique Cupcake"</strong>
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                    🛒 Sur Shopify (vendor)
                  </h4>
                  <p style={{ fontSize: '13px', color: styles.textLight, margin: 0 }}>
                    Le champ "vendor" dans l'ajout de produit doit correspondre.
                    Exemple : <strong>"Boutique Cupcake"</strong>
                  </p>
                </div>
              </div>
              
              <div style={{
                marginTop: '20px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Correspondance correcte :</strong> "Boutique Cupcake" = "Boutique Cupcake" → 
                  L'assignation automatique fonctionnera.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Import des produits */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Import des produits
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
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois toutes les conditions vérifiées, l'administrateur peut importer les produits :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans la section <strong>Produits</strong> du tableau de bord administrateur</li>
                <li>Utilisez la fonction d'<strong>import de produits</strong> depuis Shopify</li>
                <li>Sélectionnez les produits avec le tag <strong>"SooPOS"</strong></li>
                <li>Importez-les dans l'application</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Résultat :</strong> Les produits "SooPOS" seront automatiquement assignés aux vendeurs 
                  correspondants grâce au mapping du nom de boutique.
                </p>
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
                Pour les produits existants
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                <strong>Important :</strong> Le connecteur fonctionne uniquement avec les <strong>nouveaux produits</strong>. 
                Pour les produits déjà existants dans l'application, l'administrateur doit :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Assigner manuellement les produits aux vendeurs concernés</li>
                <li>Modifier chaque produit pour associer le bon vendeur</li>
              </ul>
            </div>
          </section>

          {/* Section 9: Mises à jour automatiques */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Mises à jour automatiques
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Synchronisation bidirectionnelle
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois les produits importés, si l'administrateur modifie ces produits depuis Shopify :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Les modifications sont automatiquement mises à jour dans l'application marketplace</li>
                <li>Les vendeurs voient les changements reflétés dans leur tableau de bord</li>
                <li>Les stocks, prix et descriptions sont synchronisés</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.sooposTealLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> La synchronisation est automatique pour les modifications effectuées 
                  sur Shopify. Aucune action manuelle n'est requise.
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
                  Qu'est-ce que SooPOS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  SooPOS (Shopify+POS) est une solution de gestion des stocks et des commandes pour les boutiques en ligne 
                  avec point de vente physique. Elle permet une synchronisation parfaite entre la boutique en ligne et le POS.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne l'assignation automatique des produits ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les produits avec le tag "SooPOS" sont automatiquement assignés aux vendeurs dont le nom de boutique 
                  correspond exactement au champ "vendor" sur Shopify. Cette correspondance est essentielle pour 
                  le bon fonctionnement du connecteur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Le connecteur fonctionne-t-il avec les produits existants ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, le connecteur fonctionne uniquement avec les <strong>nouveaux produits</strong>. Pour les produits 
                  déjà importés, l'administrateur doit assigner manuellement les produits aux vendeurs.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire si les produits ne sont pas assignés automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vérifiez les trois conditions : 1) Les vendeurs ont activé SooPOS dans leur configuration, 
                  2) Les produits ont le tag "SooPOS" sur Shopify, 3) Le nom de la boutique du vendeur correspond 
                  exactement au champ "vendor" sur Shopify.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les modifications sur Shopify sont-elles synchronisées automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, si l'administrateur modifie les produits SooPOS depuis Shopify, les changements sont automatiquement 
                  mis à jour dans l'application marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quel est le coût du connecteur SooPOS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le connecteur SooPOS est proposé à <strong>10$ USD par mois</strong>, en supplément du plan Multivendor 
                  Marketplace. Ces frais sont facturés mensuellement et peuvent être résiliés à tout moment.
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
              et l'optimisation de votre connecteur SooPOS.
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
                📚 Documentation Connecteur SooPOS
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
