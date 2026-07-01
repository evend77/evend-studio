import React from 'react';
import { Link } from 'react-router-dom';

export default function JapaneseShippingGuide() {
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
    japanRed: '#bc002d',
    japanLight: '#ffe6ea'
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
          background: `linear-gradient(135deg, ${styles.japanRed} 0%, ${styles.accent} 100%)`,
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
            🇯🇵📦
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
            Guide d'utilisation - Expédition Japon
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Solution d'expédition intégrée pour le Japon - Yamato, Sagawa et Japan Post
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Yamato Transport</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🚚 Sagawa Express</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📬 Japan Post (Yu-Pack)</span>
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
              'Configuration administrateur',
              'Configuration vendeur',
              'Transporteurs japonais',
              'Création des données d\'étiquette',
              'Génération d\'étiquettes',
              'Suivi automatique',
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
              L'add-on <strong>Expédition Japon</strong> est spécialement conçu pour les marchands opérant au Japon. 
              Cette fonctionnalité intègre trois des plus grands transporteurs japonais : <strong>Yamato Transport</strong>, 
              <strong>Sagawa Express</strong> et <strong>Japan Post (Yu-Pack)</strong>. Les vendeurs peuvent gérer facilement 
              leurs expéditions et générer des étiquettes directement depuis leur tableau de bord.
            </p>
            <div style={{
              background: styles.japanLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.japanRed}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Cette fonctionnalité est spécialement conçue pour le marché japonais et 
                intègre les trois principaux transporteurs du pays pour une gestion d'expédition simplifiée.
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
                <li>Add-on <strong>Expédition</strong> activé (gratuit)</li>
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Expédition Japon</li>
                <li>Plan Shopify avec <strong>Real-Time Carrier-Calculated Shipping</strong></li>
                <li>Comptes transporteurs japonais (Yamato, Sagawa ou Japan Post) selon les besoins</li>
              </ul>
            </div>

            <div style={{
              background: styles.redLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.red}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                ⚠️ <strong>Important :</strong> Pour utiliser cette fonctionnalité, le numéro de téléphone de l'adresse d'expédition 
                doit être obligatoire lors du paiement. Configurez cela dans Shopify Backend → Settings → Checkout → Form Options.
              </p>
            </div>
          </section>

          {/* Section 3: Configuration administrateur */}
          <section id="section-2" style={{ marginBottom: '48px' }}>
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
                Activer l'add-on Expédition Japon
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Recherchez "Expédition Japon" et cliquez sur le bouton <strong>Activer</strong>.
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
                Activer la méthode d'expédition
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong>. 
                Cliquez sur les trois points à côté de "Expédition Japon" et sélectionnez <strong>Activer</strong>.
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
                Activer les transporteurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Une fois l'expédition activée, les options pour activer les trois transporteurs apparaissent :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li><strong>Yamato Transport</strong> - Service de livraison Kuroneko</li>
                <li><strong>Sagawa Express</strong> - Deuxième plus grand transporteur du Japon</li>
                <li><strong>Yu-Pack (Japan Post)</strong> - Service postal national</li>
              </ul>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px', marginTop: '12px' }}>
                L'administrateur peut activer les transporteurs souhaités selon ses besoins.
              </p>
            </div>
          </section>

          {/* Section 4: Configuration vendeur */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
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
                Activer Expédition Japon
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Connectez-vous à votre <strong>espace vendeur</strong>, puis :
              </p>
              <ol style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong></li>
                <li>Localisez "Expédition Japon"</li>
                <li>Activez la méthode d'expédition</li>
                <li>Sélectionnez les transporteurs que vous souhaitez utiliser (parmi ceux activés par l'administrateur)</li>
              </ol>
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
                Créer les données d'étiquette d'expédition
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Après avoir activé la méthode d'expédition :
              </p>
              <ol style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Allez dans <strong>Mon compte</strong></li>
                <li>Cliquez sur <strong>Créer les données d'étiquette d'expédition</strong></li>
                <li>Une fenêtre contextuelle apparaît</li>
                <li>Sélectionnez le transporteur parmi ceux activés (Yamato, Sagawa ou Japan Post)</li>
                <li>Configurez et enregistrez les détails d'expédition</li>
              </ol>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  📦 Note : Les données d'étiquette doivent être créées une fois pour configurer les paramètres 
                  par défaut de chaque transporteur.
                </code>
              </div>
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
                Définir la méthode par produit
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Lors de l'ajout ou modification d'un produit, sélectionnez le transporteur souhaité dans la section 
                <strong>Méthode d'expédition</strong>.
              </p>
            </div>
          </section>

          {/* Section 5: Transporteurs japonais */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🚚 Transporteurs japonais
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🐱📦</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Yamato Transport</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Service Kuroneko (chat noir) :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Plus grand transporteur privé du Japon</li>
                    <li>Livraison le lendemain</li>
                    <li>Suivi en temps réel</li>
                    <li>Options de livraison flexible</li>
                    <li>Réseau de points de retrait étendu</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚚</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Sagawa Express</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Deuxième plus grand transporteur japonais :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Réseau national étendu</li>
                    <li>Services express et standard</li>
                    <li>Solutions d'expédition B2B et B2C</li>
                    <li>Suivi détaillé</li>
                    <li>Tarifs compétitifs</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📬</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Japan Post (Yu-Pack)</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Service postal national :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Couverture de tout le Japon</li>
                    <li>Yu-Pack pour colis</li>
                    <li>Tarifs économiques</li>
                    <li>Points de dépôt dans tous les bureaux de poste</li>
                    <li>Services internationaux disponibles</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Création des données d'étiquette */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏷️ Création des données d'étiquette d'expédition
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Configuration préalable des transporteurs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Avant de pouvoir générer des étiquettes, les vendeurs doivent configurer leurs données d'expédition :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Mon compte</strong> dans l'espace vendeur</li>
                <li>Cliquez sur <strong>Créer les données d'étiquette d'expédition</strong></li>
                <li>Dans la fenêtre contextuelle, sélectionnez le transporteur :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Yamato Transport</li>
                  <li>Sagawa Express</li>
                  <li>Japan Post (Yu-Pack)</li>
                </ul>
                <li>Configurez les détails spécifiques au transporteur (compte, identifiants, etc.)</li>
                <li>Enregistrez la configuration</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  📌 <strong>Note :</strong> Cette configuration est nécessaire pour chaque transporteur que le vendeur souhaite utiliser.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Génération d'étiquettes */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📄 Génération d'étiquettes d'expédition
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Procédure de génération</h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                <li>Cliquez sur <strong>Voir</strong> à côté de la commande concernée</li>
                <li>Cliquez sur <strong>Créer les données d'étiquette d'expédition</strong></li>
                <li>Le système génère un <strong>fichier CSV</strong> contenant :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Numéro de suivi (Tracking Number)</li>
                  <li>URL de suivi (Tracking URL)</li>
                  <li>Détails d'expédition</li>
                  <li>Informations complètes du transporteur</li>
                </ul>
              </ol>
            </div>

            <div style={{
              background: styles.accentLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.accent}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                📄 <strong>Format CSV :</strong> Les étiquettes sont générées au format CSV, ce qui permet un traitement 
                facile par les transporteurs japonais et une intégration avec leurs systèmes.
              </p>
            </div>
          </section>

          {/* Section 8: Suivi automatique */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Mise à jour automatique du statut
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Synchronisation automatique
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois l'expédition terminée avec succès, le statut de la commande est automatiquement mis à jour :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px', marginBottom: '16px' }}>
                <li>Le statut passe automatiquement à <strong>"Expédié" (Shipped)</strong></li>
                <li>Les informations de suivi sont synchronisées</li>
                <li>Le client reçoit une notification par email</li>
                <li>Le numéro de suivi est disponible dans les détails de la commande</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  📬 <strong>Avantage :</strong> Plus besoin de mettre à jour manuellement le statut des commandes. 
                  Tout est automatisé !
                </p>
              </div>
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
              🖥️ Affichage sur la boutique
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📊</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Calcul des tarifs</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients voient les tarifs des transporteurs japonais calculés selon le poids, les dimensions et la destination.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Choix du transporteur</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Au checkout, les clients peuvent choisir parmi les transporteurs activés par le vendeur 
                  (Yamato, Sagawa ou Japan Post).
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>📍</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Suivi des colis</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients reçoivent un email avec le numéro de suivi et le lien de suivi du transporteur choisi.
                </p>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              background: styles.japanLight,
              borderRadius: '16px',
              padding: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: styles.text }}>
                📌 <strong>Note importante :</strong> Cette fonctionnalité est spécialement conçue pour le marché japonais. 
                Les vendeurs doivent être basés au Japon pour utiliser ce service.
              </p>
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
                  Quels transporteurs sont disponibles avec cette fonctionnalité ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Trois transporteurs majeurs sont intégrés : Yamato Transport (Kuroneko), Sagawa Express et Japan Post (Yu-Pack). 
                  L'administrateur peut activer les transporteurs de son choix.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir un compte transporteur au Japon ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Pour Yamato, Sagawa ou Japan Post, vous devez contacter directement chaque transporteur pour ouvrir un compte 
                  professionnel. Ils vous fourniront les identifiants nécessaires à la configuration.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que contient le fichier CSV généré ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le fichier CSV contient le numéro de suivi, l'URL de suivi, les détails d'expédition et les informations 
                  complètes du transporteur. Ce format est standard pour les transporteurs japonais.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Le statut de la commande se met-il à jour automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Une fois l'expédition terminée avec succès, le statut de la commande passe automatiquement à "Expédié" 
                  sans intervention manuelle.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils utiliser plusieurs transporteurs ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Les vendeurs peuvent activer et utiliser plusieurs transporteurs parmi ceux activés par l'administrateur. 
                  Ils peuvent choisir le transporteur le plus adapté pour chaque commande.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Cette fonctionnalité fonctionne-t-elle pour les expéditions internationales ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Japan Post propose des services internationaux (EMS, Airmail). Yamato et Sagawa offrent également des options 
                  d'expédition internationale. Contactez chaque transporteur pour les détails.
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
              et l'optimisation de vos expéditions au Japon.
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
                📚 Documentation Expédition Japon
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
