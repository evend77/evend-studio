import React from 'react';
import { Link } from 'react-router-dom';

export default function ConnecteurDytelGuide() {
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
    dytelPurple: '#5c6bc0',
    dytelIndigo: '#3f51b5',
    dytelLight: '#ede7f6'
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
        
        {/* En-tête avec dégradé violet/indigo DYTEL */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.dytelPurple} 0%, ${styles.dytelIndigo} 100%)`,
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
            Guide d'utilisation - Connecteur DYTEL POS
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisez les commandes des vendeurs avec DYTEL POS en temps réel
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💻 DYTEL POS vers Shopify</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Synchronisation en temps réel</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Gestion des commandes restaurant</span>
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
              'Configuration vendeur',
              'Token d\'accès',
              'APIs de fulfillment',
              'Création de produits DYTEL POS',
              'Import CSV en masse',
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
              L'add-on <strong>Connecteur DYTEL POS</strong> permet d'intégrer DYTEL POS avec votre marketplace Shopify. 
              DYTEL POS offre un système centralisé pour la gestion des commandes, des paiements et des stocks en un seul endroit.
            </p>
            <div style={{
              background: styles.dytelLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.dytelPurple}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Cette intégration permet de synchroniser les commandes de la marketplace 
                directement dans le système POS des vendeurs en <strong>temps réel</strong>. Idéal pour les marketplaces 
                de restaurants et de vente au détail.
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
                <li>Frais supplémentaires de <strong>20$ USD par mois</strong> pour l'add-on Connecteur DYTEL POS</li>
                <li>Les vendeurs doivent avoir un compte <strong>DYTEL POS</strong> actif</li>
                <li>Les identifiants DYTEL POS (Source ID et Source Password) doivent être obtenus auprès du support DYTEL</li>
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
                Recherchez "Connecteur DYTEL POS" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>20$ USD</strong> et approuvez le paiement dans Shopify Backend.
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
                Un nouveau menu <strong>Configuration DYTEL POS</strong> apparaît dans la section 
                <strong>Configuration</strong> du tableau de bord administrateur et vendeur.
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
                Configuration DYTEL POS
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration DYTEL POS</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Source ID</strong> : L'identifiant source fourni par le support DYTEL</li>
                <li><strong>Source Password</strong> : Le mot de passe source fourni par le support DYTEL</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les identifiants DYTEL POS doivent être obtenus auprès du support DYTEL. 
                  Une fois saisis, cliquez sur <strong>Enregistrer</strong> pour activer la connexion.
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
              🛍️ Configuration côté vendeur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Saisie des informations
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Dans l'espace vendeur, allez dans <strong>Configuration</strong> → <strong>Configuration DYTEL POS</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Outlet Code</strong> : Le code du point de vente (obtenu auprès de l'administrateur)</li>
                <li><strong>Password</strong> : Le mot de passe associé au point de vente</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.dytelLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> Une fois les détails sauvegardés, un <strong>token unique</strong> est généré 
                  automatiquement pour le vendeur.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Token d'accès */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Token d'accès unique
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Génération du token
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Lorsqu'un vendeur configure ses informations DYTEL POS, un token unique est généré. 
                Ce token est utilisé pour :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Authentifier les requêtes API de fulfillment</li>
                <li>Synchroniser les commandes entre la marketplace et DYTEL POS</li>
                <li>Permettre l'intégration avec des services de fulfillment tiers (comme Tookan)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le fulfillment est géré en dehors de l'application. Vous pouvez créer votre propre programme 
                  en utilisant les APIs publiques ou utiliser un service tiers comme Tookan.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: APIs de fulfillment */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔌 APIs de fulfillment
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Endpoints disponibles
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour gérer le fulfillment, vous pouvez utiliser les APIs publiques suivantes. 
                Passez le <strong>token d'accès</strong> dans les paramètres de chaque requête.
              </p>
              
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                <p style={{ color: '#e2e8f0', margin: '0 0 8px 0' }}>
                  <span style={{ color: styles.success }}>GET</span> https://mvmapi.webkul.com/v2/public/shop/orders/{'{orderId}'}/line-items.json
                </p>
                <p style={{ color: '#94a3b8', margin: '0', fontSize: '11px' }}>
                  Paramètres: key: token, value: votre_token_d'accès
                </p>
              </div>
              
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                <p style={{ color: '#e2e8f0', margin: '0 0 8px 0' }}>
                  <span style={{ color: styles.success }}>GET</span> https://mvmapi.webkul.com/v2/public/shop/orders/{'{orderId}'}/fulfillments.json
                </p>
                <p style={{ color: '#94a3b8', margin: '0', fontSize: '11px' }}>
                  Récupère la liste des fulfillments pour une commande
                </p>
              </div>
              
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                <p style={{ color: '#e2e8f0', margin: '0 0 8px 0' }}>
                  <span style={{ color: styles.warning }}>POST</span> https://mvmapi.webkul.com/v2/public/shop/orders/{'{orderId}'}/fulfillments.json
                </p>
                <p style={{ color: '#94a3b8', margin: '0', fontSize: '11px' }}>
                  Body: {"{"} "line_item_ids": [{"{"}"line_item_id": "101", "quantity": "1"{"}"}], "tracking_number": "101", "shipping_method": "Test Method" {"}"}
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Création de produits DYTEL POS */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Création de produits DYTEL POS
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Création via formulaire produit
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent créer des produits DYTEL POS directement depuis leur tableau de bord :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Cliquez sur <strong>Ajouter un produit</strong></li>
                <li>Remplissez tous les détails du produit</li>
                <li>Activez l'option <strong>Want to Send It To DYTEL</strong></li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Édition d'un produit existant
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans la liste des produits, cliquez sur les trois points "..."</li>
                <li>Sélectionnez <strong>Modifier</strong></li>
                <li>Activez l'option <strong>Want to Send It To DYTEL</strong></li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
            </div>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Ajout du code article DYTEL
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après avoir créé ou modifié le produit, ajoutez manuellement le <strong>DYTEL ITEM CODE</strong> :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Cliquez sur les trois points "..." du produit</li>
                <li>Sélectionnez <strong>Modifier</strong></li>
                <li>Dans le champ <strong>DYTEL ITEM CODE</strong>, entrez le code article</li>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.dytelLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> Le code article DYTEL est essentiel pour la synchronisation correcte 
                  des produits entre la marketplace et le système POS.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Import CSV en masse */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📊 Import CSV en masse
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Ajout groupé des codes DYTEL
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Pour ajouter des codes DYTEL à plusieurs produits simultanément :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Cliquez sur <strong>Ajouter des produits DYTEL</strong> (Add DYTEL POS Products)</li>
                <li>Exportez les produits dans une plage de dates choisie au format CSV</li>
                <li>Modifiez le fichier CSV pour ajouter :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>La colonne <strong>DYTEL ITEM CODE</strong> avec le code article</li>
                  <li>La colonne <strong>DYTEL POS Product</strong> avec la valeur "yes"</li>
                </ul>
                <li>Téléchargez le fichier CSV mis à jour</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Avantage :</strong> Cette méthode permet de gérer en masse un grand nombre de produits, 
                  gagnant ainsi un temps précieux.
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
                  Qu'est-ce que DYTEL POS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  DYTEL POS est un système de point de vente qui offre une solution centralisée pour la gestion 
                  des commandes, des paiements et des stocks. Idéal pour les restaurants et commerces de détail.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir les identifiants DYTEL POS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les identifiants (Source ID et Source Password) sont fournis par le support DYTEL. 
                  Contactez votre fournisseur DYTEL pour obtenir ces informations.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne la synchronisation des commandes ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Lorsqu'une commande est passée sur la marketplace, elle est automatiquement synchronisée 
                  en temps réel avec DYTEL POS, permettant aux vendeurs de gérer les commandes directement 
                  depuis leur système POS.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Qu'est-ce que le token d'accès et à quoi sert-il ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le token d'accès est un identifiant unique généré pour chaque vendeur. Il est utilisé pour 
                  authentifier les requêtes API de fulfillment et permettre l'intégration avec des services tiers.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je ajouter des codes DYTEL en masse ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, vous pouvez exporter les produits en CSV, ajouter les codes DYTEL et les colonnes nécessaires, 
                  puis réimporter le fichier pour une mise à jour en masse.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quels sont les frais du connecteur DYTEL POS ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le connecteur DYTEL POS est proposé à <strong>20$ USD par mois</strong>, en supplément du plan 
                  Multivendor Marketplace.
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
              et l'optimisation de votre connecteur DYTEL POS.
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
                📚 Documentation Connecteur DYTEL POS
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
