import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductAuctionGuide() {
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
    gold: '#fbbf24',
    goldLight: '#fef3c7'
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
          background: `linear-gradient(135deg, ${styles.gold} 0%, ${styles.accent} 100%)`,
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
            🔨💰
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
            Guide d'utilisation - Enchères de produits
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Permettez aux vendeurs de mettre leurs produits aux enchères
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔨 Enchères</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💰 Proxy bidding</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏆 Multiples gagnants</span>
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
              'Ajout d\'enchères (Vendeur)',
              'Types d\'enchères',
              'Gestion des enchères',
              'Expérience client',
              'Déclaration des gagnants',
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
              L'add-on <strong>Enchères de produits</strong> permet aux vendeurs de mettre leurs produits aux enchères. 
              Les clients peuvent placer des offres et le plus offrant remporte le produit. Cette fonctionnalité 
              stimule l'engagement et peut augmenter la valeur des ventes.
            </p>
            <div style={{
              background: styles.goldLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.gold}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'add-on Enchères de produits est gratuit, mais nécessite l'installation 
                préalable de l'application Product Auction sur votre boutique (30$ USD/mois).
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
                <li>Application <strong>Product Auction</strong> installée sur Shopify (30$ USD/mois)</li>
                <li>L'add-on Enchères de produits est <strong>gratuit</strong> (seule l'application Product Auction est payante)</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.redLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> Il est obligatoire d'installer d'abord l'application Product Auction 
                  sur votre boutique Shopify pour que cette fonctionnalité fonctionne.
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
                Installer l'application Product Auction
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous sur le Shopify App Store et installez l'application <strong>Product Auction</strong>. 
                Choisissez le plan adapté à vos besoins (Basic, Executive ou Pro).
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
                Activer l'add-on Enchères de produits
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "Enchères de produits" et cliquez sur <strong>Activer</strong>.
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
                Accepter les conditions
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Acceptez les conditions pour finaliser l'activation de l'add-on.
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
                Restrictions pour les vendeurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut restreindre certaines fonctionnalités pour les vendeurs :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>AutoPay</strong> : Paiement automatique</li>
                <li><strong>Proxy bidding</strong> : Enchères automatiques</li>
                <li><strong>Popcorn bidding</strong> : Extension de durée</li>
                <li><strong>Modification de la durée et du prix</strong> : Verrouillage des paramètres</li>
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
                Paramètres par défaut
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut définir des valeurs par défaut pour :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Durée de l'enchère</strong> : Date de début et fin par défaut</li>
                <li><strong>Prix de base</strong> : Prix de départ de l'enchère</li>
                <li><strong>Prix de réserve</strong> : Prix minimum à atteindre</li>
                <li><strong>Règles d'incrément</strong> : Montant minimum d'augmentation</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Ces valeurs par défaut sont automatiquement pré-remplies dans le formulaire 
                  d'ajout d'enchère des vendeurs.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Ajout d'enchères (Vendeur) */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ➕ Ajout d'enchères - Côté vendeur
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
                <li>Cliquez sur <strong>Voir l'enchère</strong> dans le menu Actions</li>
                <li>Cliquez sur <strong>Ajouter une enchère</strong></li>
                <li>Remplissez les informations :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li><strong>Durée de l'enchère</strong> : Date et heure de début et fin</li>
                  <li><strong>Prix de base</strong> : Prix de départ (ex: 10€)</li>
                  <li><strong>Prix de réserve</strong> : Prix minimum à atteindre (ex: 50€)</li>
                  <li><strong>Prix d'incrément</strong> : Montant minimum d'augmentation</li>
                </ul>
                <li>Cliquez sur <strong>Enregistrer</strong> ou <strong>Enregistrer et démarrer</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Si l'option "Démarrer automatiquement" est activée, l'enchère commence immédiatement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Types d'enchères */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🎯 Types d'enchères
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Proxy Bidding</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Le système enchéri automatiquement pour le client jusqu'à son montant maximum.
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Gagne du temps</li>
                    <li>Enchérit automatiquement</li>
                    <li>Montant maximum défini par le client</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍿</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Popcorn Bidding</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Prolonge la durée de l'enchère si une offre est placée dans les dernières minutes.
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Évite les offres de dernière minute</li>
                    <li>Donne une chance aux autres enchérisseurs</li>
                    <li>Extension configurable</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Multiples gagnants</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Plusieurs unités du même produit peuvent être vendues aux plus offrants.
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Enchères sur plusieurs unités</li>
                    <li>Plusieurs gagnants</li>
                    <li>AutoPay inclus</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Gestion des enchères */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Gestion des enchères
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Côté administrateur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Visualiser toutes les enchères</strong> : Dans l'application Product Auction</li>
                <li><strong>Supprimer des enchères</strong> : Retirer une enchère manuellement</li>
                <li><strong>Finir une enchère</strong> : Terminer prématurément</li>
                <li><strong>Exporter les enchères</strong> : Au format CSV</li>
                <li><strong>Déclarer un nouveau gagnant</strong> : Si le prix de réserve n'est pas atteint</li>
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
                Côté vendeur
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs peuvent :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Visualiser leurs enchères</strong> : Tous les produits mis aux enchères</li>
                <li><strong>Voir l'historique des offres</strong> : Liste des enchérisseurs</li>
                <li><strong>Voir le gagnant</strong> : Informations sur le vainqueur</li>
                <li><strong>Modifier l'enchère</strong> : Si les restrictions le permettent</li>
              </ul>
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
              👤 Expérience client
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Placer une offre
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Le client se connecte à son compte</li>
                <li>Il visite un produit en enchère</li>
                <li>Il voit la fenêtre d'enchère avec :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Prix actuel</li>
                  <li>Compte à rebours</li>
                  <li>Nombre d'offres</li>
                  <li>Champ pour placer une offre</li>
                </ul>
                <li>Il saisit son montant et valide</li>
                <li>Confirmation par pop-up</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Les offres sont mises à jour en temps réel - pas besoin de rafraîchir la page !
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
                Après l'enchère
              </h3>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Gagnant</strong> : Reçoit un email, peut acheter le produit avec le bouton "Acheter maintenant"</li>
                <li><strong>Perdant</strong> : Reçoit un email de notification</li>
                <li><strong>Historique</strong> : Toutes les offres sont visibles dans "Mon compte"</li>
              </ul>
            </div>
          </section>

          {/* Section 9: Déclaration des gagnants */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏆 Déclaration des gagnants
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Gagnant automatique
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                À la fin de l'enchère, si le prix de réserve est atteint :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Le plus offrant est déclaré gagnant automatiquement</li>
                <li>Un email est envoyé au gagnant et au vendeur</li>
                <li>Le gagnant peut acheter le produit via le bouton "Acheter maintenant"</li>
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
                Déclaration manuelle
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Si le prix de réserve n'est pas atteint, l'administrateur peut :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Aller dans <strong>Product Auction</strong> → <strong>Enchères</strong></li>
                <li>Sélectionner l'enchère terminée</li>
                <li>Cliquer sur <strong>Déclarer un nouveau gagnant</strong></li>
                <li>Choisir un enchérisseur dans la liste</li>
                <li>Valider</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.goldLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  🏆 <strong>Note :</strong> Cette fonctionnalité permet de vendre un produit même si le prix de réserve 
                  n'est pas atteint, par exemple lors d'une négociation directe.
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
                  L'add-on Enchères de produits est-il gratuit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, l'add-on Enchères de produits est gratuit. Cependant, il nécessite l'installation préalable 
                  de l'application Product Auction sur votre boutique Shopify (30$ USD/mois).
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Qu'est-ce que le proxy bidding ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le proxy bidding permet aux clients de définir un montant maximum. Le système enchéri automatiquement 
                  pour eux jusqu'à ce montant, sans qu'ils aient à surveiller l'enchère en permanence.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment fonctionne le popcorn bidding ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le popcorn bidding prolonge automatiquement la durée de l'enchère si une offre est placée 
                  dans les dernières minutes. Cela évite les offres de dernière minute et donne une chance 
                  égale à tous les enchérisseurs.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Un vendeur peut-il modifier une enchère après l'avoir créée ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, sauf si l'administrateur a restreint cette possibilité. Le vendeur peut modifier la durée, 
                  les prix ou d'autres paramètres tant que l'enchère n'a pas commencé.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les enchères fonctionnent-elles avec les produits globaux ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Les vendeurs peuvent ajouter des enchères aux produits globaux. La procédure est identique 
                  à celle des produits normaux.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si le gagnant n'achète pas le produit ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le vendeur ou l'administrateur peut contacter le gagnant. Si le produit n'est pas acheté, 
                  il peut être remis aux enchères ou déclarer un nouveau gagnant parmi les autres enchérisseurs.
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
              et l'optimisation de vos enchères de produits.
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
                📚 Documentation Product Auction
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
