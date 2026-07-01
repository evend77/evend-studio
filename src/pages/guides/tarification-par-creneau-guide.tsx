import React from 'react';
import { Link } from 'react-router-dom';

export default function SlotPricingGuide() {
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
            🏷️💰
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
            Guide d'utilisation - Tarification par créneau
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Définissez des prix différents selon les groupes de clients
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏷️ Prix personnalisés</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>👥 Groupes de clients</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Tarifs par quantité</span>
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
              'Ajout de créneaux (Vendeur)',
              'Ajout de créneaux (Admin)',
              'Montant minimum de commande',
              'Quantité minimum par produit',
              'Commission par tag',
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
              L'add-on <strong>Tarification par créneau</strong> permet aux administrateurs et aux vendeurs de définir 
              des prix différents pour un même produit selon les tags attribués aux clients. Les tags sont créés par 
              l'administrateur et assignés aux clients depuis le backend de la boutique. Chaque tag peut avoir ses 
              propres fourchettes de quantités et prix.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Cette fonctionnalité permet d'offrir des prix personnalisés à différents 
                groupes de clients (VIP, grossistes, membres, etc.) et est compatible avec le panier divisé.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Tarification par créneau</li>
                <li>Fonctionne uniquement avec les <strong>produits normaux</strong> (pas les produits avec variantes)</li>
              </ul>
            </div>

            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.red}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚠️ <strong>Limitations :</strong> Maximum 5 tags et 5 fourchettes par tag. Les clients voient le prix 
                basé sur le premier tag assigné (ordre alphabétique). Les codes promo ne sont pas compatibles.
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
                Recherchez "Tarification par créneau" et cliquez sur le bouton <strong>Activer</strong>.
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
                Un nouveau menu <strong>Configuration Tarification par créneau</strong> apparaît dans la section 
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
                Ajout des tags clients
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration Tarification par créneau</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Activez <strong>Structure de tarification par créneau</strong></li>
                <li>Ajoutez les <strong>tags clients</strong> (maximum 5)</li>
                <li>Exemples : "VIP", "Gold", "Silver", "Wholesale", "Premium"</li>
                <li>Configurez les libellés affichés sur le front-end</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Lorsque vous modifiez un tag, les codes dans "Instructions pour la marketplace" 
                  sont mis à jour. Vous devez les recopier dans vos fichiers Liquid.
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
                Options avancées
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Supprimer les créneaux pour les vendeurs</strong> : Active pour utiliser un prix fixe par tag</li>
                <li><strong>Autoriser les vendeurs à créer uniquement des produits avec créneaux</strong> : Masque le prix par défaut</li>
                <li><strong>Exonération de taxe</strong> : Exempte les clients d'un tag spécifique de la taxe</li>
                <li><strong>Commission par tag</strong> : Définissez des commissions différentes selon les tags clients</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Ajout de créneaux (Vendeur) */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ➕ Ajout de créneaux - Côté vendeur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer un produit avec tarification par créneau
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Ajoutez ou modifiez un produit</li>
                <li>Cochez <strong>Marquer le produit comme Tarification par créneau</strong></li>
                <li>Sélectionnez un <strong>tag client</strong> (ajouté par l'admin)</li>
                <li>Définissez les <strong>fourchettes de quantités</strong> et <strong>prix par quantité</strong> (maximum 5 fourchettes)</li>
                <li>Cliquez sur <strong>Ajouter un créneau</strong></li>
                <li>Répétez pour chaque tag souhaité</li>
                <li>Enregistrez le produit</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Exemple :</strong> Tag "VIP" → 1-10 unités: 20€, 11-50 unités: 18€, 51+ unités: 15€
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Ajout de créneaux (Admin) */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              👑 Ajout de créneaux - Côté administrateur
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer des créneaux depuis l'admin
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Produits</strong> → <strong>Liste des produits</strong></li>
                <li>Sélectionnez un produit</li>
                <li>Dans la section <strong>Détails des variantes</strong>, cliquez sur <strong>Modifier</strong></li>
                <li>Cochez <strong>Marquer comme Tarification par créneau</strong></li>
                <li>Sélectionnez les tags et définissez les fourchettes</li>
                <li>Enregistrez</li>
              </ol>
            </div>
          </section>

          {/* Section 7: Montant minimum de commande */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💰 Montant minimum de commande par tag
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
                L'administrateur peut activer cette option dans <strong>Configuration</strong> → <strong>Configuration générale</strong>.
                Les vendeurs peuvent ensuite définir un montant minimum de commande pour chaque tag client.
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Le vendeur va dans <strong>Configuration</strong> → <strong>Configuration générale</strong></li>
                <li>Définit le montant minimum pour chaque tag</li>
                <li>Exemple : VIP: 50€, Gold: 100€, Silver: 150€</li>
                <li>Enregistre</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Le client ne peut finaliser la commande que si le montant total dépasse le seuil 
                  défini pour son tag. Les codes correspondants sont dans "Instructions pour la marketplace".
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Quantité minimum par produit */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📦 Quantité minimum par produit
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
                L'administrateur peut activer la quantité minimum par créneau dans 
                <strong>Configuration</strong> → <strong>Configuration des produits</strong>.
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Assurez-vous que <strong>Supprimer les créneaux pour les vendeurs</strong> est désactivé</li>
                <li>Le vendeur ajoute une variante avec :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Tag client</li>
                  <li>Prix par quantité</li>
                  <li>Quantité minimum</li>
                </ul>
                <li>Le client doit acheter au moins la quantité minimum définie</li>
              </ol>
            </div>
          </section>

          {/* Section 9: Commission par tag */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💸 Commission par tag client
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
                Activez l'option dans <strong>Configuration</strong> → <strong>Configuration Tarification par créneau</strong>.
                Ensuite :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Commission globale</strong> : Ajoutez une commission par tag</li>
                <li><strong>Commission vendeur</strong> : Ajoutez une commission par tag dans le profil du vendeur</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.tealLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Ordre de priorité :</strong> Commission d'adhésion {' > '} Commission produit {' > '} Commission collection 
                  {' > '} Commission vendeur {' > '} Commission globale
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
                Codes d'intégration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les codes sont disponibles dans <strong>Configuration</strong> → <strong>Instructions pour la marketplace</strong>.
                Ajoutez-les dans :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>product.liquid</strong> : Affichage du prix par tag</li>
                <li><strong>cart.liquid</strong> : Mise à jour du prix dans le panier</li>
                <li><strong>customers/register.liquid</strong> : Sélection de tag à l'inscription</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Note :</strong> Mettez à jour les codes chaque fois que vous modifiez les tags.
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
                Visualisation par le client
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Le client voit son prix personnalisé selon son tag</li>
                <li>Le prix est mis à jour dynamiquement en fonction de la quantité</li>
                <li>Le montant minimum de commande est vérifié dans le panier</li>
                <li>Si le client n'a pas de tag, le prix par défaut s'affiche</li>
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
                  Combien de tags puis-je ajouter ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Maximum 5 tags peuvent être ajoutés à la fois. Chaque tag peut avoir jusqu'à 5 fourchettes de quantités.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Un client peut-il avoir plusieurs tags ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, mais le prix affiché sera basé sur le premier tag dans l'ordre alphabétique. 
                  Un seul tag est pris en compte pour la tarification.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les codes promo sont-ils compatibles ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les codes promo ne sont pas compatibles avec la tarification par créneau car le prix réduit 
                  est déjà géré comme une remise en backend.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si un client n'a pas de tag ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le client voit le prix par défaut du produit. Vous pouvez également masquer le prix et le bouton 
                  d'achat pour les clients sans tag en utilisant les codes fournis.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils créer des produits uniquement avec des créneaux ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, activez l'option "Autoriser les vendeurs à créer uniquement des produits avec créneaux". 
                  Le prix par défaut ne sera pas affiché.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne l'exonération de taxe par tag ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Dans la configuration, vous pouvez activer l'exonération de taxe pour certains tags. 
                  Les clients avec ces tags ne paieront pas de taxe sur leurs achats.
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
              et l'optimisation de votre tarification par créneau.
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
                📚 Documentation Tarification par créneau
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
