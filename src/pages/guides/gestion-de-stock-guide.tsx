import React from 'react';
import { Link } from 'react-router-dom';

export default function StockManagementGuide() {
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
            📦📊
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
            Guide d'utilisation - Gestion de stock
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Gérez les stocks des vendeurs et choisissez qui exécute les commandes
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Gestion centralisée</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Exécution flexible</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Suivi des demandes</span>
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
              'Modes de livraison',
              'Côté vendeur',
              'Demandes d\'envoi au marchand',
              'Gestion des commandes',
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
              L'add-on <strong>Gestion de stock</strong> permet à l'administrateur de gérer les stocks des vendeurs 
              et de contrôler qui exécute les commandes. Le vendeur peut choisir d'exécuter lui-même ses commandes 
              ou de les confier à l'administrateur pour une gestion centralisée.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Cette fonctionnalité est compatible avec l'exécution partielle des commandes 
                et avec la fonctionnalité d'inventaire multi-emplacements.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Gestion de stock</li>
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
                Recherchez "Gestion de stock" et cliquez sur le bouton <strong>Activer</strong>.
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
                Ajouter le code d'affichage
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Ajoutez le code suivant dans <strong>product.liquid</strong> (ou product-template.liquid) 
                pour afficher les informations d'exécution :
              </p>
              <div style={{
                background: '#1a2332',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px'
              }}>
                <code style={{ fontSize: '13px', color: '#e1e4e8' }}>
                  {'<div id="wk_ff_service" style="margin:15px 0; clear:both;"><input id="productid" type="hidden" value="{{ product.id }}"></div>'}
                </code>
              </div>
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
                Configuration de l'exécution
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Un nouveau menu <strong>Configuration d'exécution</strong> apparaît dans la section 
                <strong>Configuration</strong> de votre tableau de bord.
              </p>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Définissez le mode d'exécution :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Exécution par l'administrateur</strong> : Toutes les commandes sont gérées par l'admin</li>
                <li><strong>Exécution par le vendeur</strong> : Chaque vendeur gère ses propres commandes</li>
                <li><strong>Exécution par les deux</strong> : Choix flexible selon les produits</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Vous pouvez également ajouter des logos et libellés personnalisés 
                  pour l'affichage sur la page produit.
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
                Gestion des demandes
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Un nouveau menu <strong>Demandes d'exécution</strong> apparaît dans la section 
                <strong>Vendeurs</strong>. L'administrateur peut :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Accepter les demandes d'envoi de stock des vendeurs</li>
                <li>Rejeter les demandes (le vendeur gère alors ses propres stocks)</li>
                <li>Voir l'historique des demandes acceptées et rejetées</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Modes de livraison */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🚚 Modes d'exécution des commandes
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Exécution par l'administrateur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    L'administrateur gère toutes les expéditions. Idéal pour :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Centralisation des stocks</li>
                    <li>Contrôle qualité renforcé</li>
                    <li>Logistique unifiée</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Exécution par le vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs expédient leurs propres produits. Idéal pour :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Délais de livraison réduits</li>
                    <li>Vendeurs autonomes</li>
                    <li>Produits en dropshipping</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔄</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Exécution mixte</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Choix flexible par produit ou par vendeur. Permet :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Flexibilité maximale</li>
                    <li>Adaptation aux besoins</li>
                    <li>Optimisation logistique</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Côté vendeur */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
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
                Configuration de l'exécution
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Un nouveau menu <strong>Configuration d'exécution</strong> apparaît dans la section 
                <strong>Configuration</strong> de l'espace vendeur.
              </p>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Le vendeur peut choisir :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Auto-exécution</strong> : Le vendeur expédie lui-même ses produits</li>
                <li><strong>Exécution par l'administrateur</strong> : Envoie ses stocks à l'administrateur</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Si le vendeur choisit l'auto-exécution, il doit télécharger un logo 
                  qui sera affiché sur la page produit.
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
                Suivi des stocks envoyés
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent suivre les produits envoyés à l'administrateur dans :
                <strong>Produits</strong> → <strong>Stocks envoyés</strong>
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Liste des produits avec quantités envoyées</li>
                <li>Statut d'acceptation par l'administrateur</li>
                <li>Historique des demandes</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Demandes d'envoi au marchand */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Demandes d'envoi au marchand
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Envoi de produits à l'administrateur
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Cliquez sur <strong>Modifier</strong> à côté du produit concerné</li>
                <li>Cliquez sur <strong>Plus d'actions</strong> → <strong>Envoyer</strong></li>
                <li>Saisissez la quantité à envoyer</li>
                <li>Cliquez sur <strong>Envoyer au marchand</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le vendeur ne peut plus modifier la quantité une fois la demande acceptée.
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
                Options "Avant livraison" et "Après livraison"
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Si l'administrateur active l'option "Envoyer au marchand", le vendeur peut choisir :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Avant livraison</strong> : Le vendeur envoie le produit à l'administrateur, qui l'expédie au client</li>
                <li><strong>Après livraison</strong> : Le vendeur expédie directement au client, puis informe l'administrateur</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.tealLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  🔄 <strong>Flux "Après livraison" :</strong> Le vendeur expédie, met à jour les informations de suivi, 
                  l'administrateur confirme la réception pour finaliser la commande.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Gestion des commandes */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Gestion des commandes
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Liste des commandes (Admin)</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    L'administrateur peut consulter :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Commandes en attente d'approbation</strong> (mode "Après livraison")</li>
                    <li><strong>Commandes exécutées par les vendeurs</strong></li>
                    <li><strong>Commandes exécutées par l'administrateur</strong></li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Gestion des commandes (Vendeur)</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Les vendeurs peuvent :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Exécuter leurs propres commandes</li>
                    <li>Utiliser le bouton "Expédier au marchand"</li>
                    <li>Suivre le statut des commandes</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Liste de gestion des stocks</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    L'administrateur peut consulter :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li><strong>Commandes en attente</strong> (mode "Après livraison")</li>
                    <li><strong>Statut des expéditions</strong></li>
                    <li><strong>Détails des vendeurs</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.tealLight,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>
                💡 <strong>Note sur les frais d'expédition :</strong> Si l'administrateur exécute la commande, 
                les frais d'expédition lui reviennent. Si le vendeur exécute, les frais reviennent au vendeur.
              </p>
            </div>
          </section>

          {/* Section 9: Affichage frontal */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
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
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛍️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Page produit</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Le client voit qui exécute la commande :
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                  <li>Logo "Exécuté par [Nom]"</li>
                  <li>Informations de livraison</li>
                </ul>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📦</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Suivi des commandes</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients peuvent suivre l'évolution de leur commande et savoir qui l'exécute.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Confirmation d'expédition</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients reçoivent des notifications avec les informations de suivi.
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
                  Un vendeur peut-il changer le mode d'exécution après avoir envoyé ses produits ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, une fois que le vendeur a envoyé ses produits à l'administrateur, le mode d'exécution est verrouillé 
                  jusqu'à ce que l'administrateur accepte ou rejette la demande.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si l'administrateur rejette une demande d'envoi ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si l'administrateur rejette la demande, le vendeur conserve la gestion de ses stocks et exécute 
                  lui-même ses commandes. Le flux retourne au fonctionnement standard de la marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne l'option "Après livraison" ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le vendeur expédie directement au client, puis utilise le bouton "Expédier au marchand" pour 
                  notifier l'administrateur. L'administrateur confirme la réception, et la commande est marquée comme exécutée.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les frais d'expédition sont-ils affectés par le choix d'exécution ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui. Si l'administrateur exécute la commande, les frais d'expédition lui reviennent. 
                  Si le vendeur exécute, les frais d'expédition reviennent au vendeur.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  L'add-on est-il compatible avec l'inventaire multi-emplacements ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Si l'administrateur a activé l'inventaire multi-emplacements, les produits peuvent être reçus 
                  à n'importe quel emplacement (sauf l'emplacement de service d'exécution personnalisé).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Peut-on avoir une exécution mixte dans une même commande ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! En mode "Exécution par les deux", certains produits peuvent être exécutés par l'administrateur 
                  et d'autres par les vendeurs. Chaque produit est traité indépendamment.
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
              et l'optimisation de votre gestion de stock.
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
                📚 Documentation Gestion de stock
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
