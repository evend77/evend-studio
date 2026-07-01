import React from 'react';
import { Link } from 'react-router-dom';

export default function IntegrationWhatsappGuide() {
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
    whatsappGreen: '#25d366',
    whatsappDark: '#128c7e',
    whatsappLight: '#e8f5e9'
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
        
        {/* En-tête avec dégradé vert WhatsApp */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.whatsappGreen} 0%, ${styles.whatsappDark} 100%)`,
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
            💬📱
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
            Guide d'utilisation - Intégration WhatsApp
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Envoyez des notifications WhatsApp automatiques pour les commandes et produits
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💬 Notifications WhatsApp</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Commandes automatiques</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>⚡ Alertes en temps réel</span>
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
              'Obtention des identifiants WhatsApp',
              'Création des templates',
              'Configuration des événements',
              'Configuration côté vendeur',
              'Journal des notifications',
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
              💬 Introduction
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '20px' }}>
              L'add-on <strong>Intégration WhatsApp</strong> permet d'envoyer des notifications WhatsApp automatiques 
              aux vendeurs et aux clients. Les notifications peuvent être déclenchées pour divers événements : 
              commande passée, commande expédiée, commande remboursée, commande annulée, et bien d'autres.
            </p>
            <div style={{
              background: styles.whatsappLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.whatsappGreen}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> L'add-on coûte <strong>15$ USD par mois</strong> en supplément du plan Multivendor. 
                Nécessite un compte développeur Facebook et un numéro WhatsApp Business dédié (le numéro personnel ne fonctionne pas).
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
                <li>Frais supplémentaires de <strong>15$ USD par mois</strong> pour l'add-on</li>
                <li>Compte <strong>Facebook Developer</strong> actif</li>
                <li>Numéro <strong>WhatsApp Business</strong> dédié (nouveau numéro)</li>
                <li>Création de templates WhatsApp (produits et commandes)</li>
              </ul>
            </div>

            <div style={{
              background: styles.warning + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Points importants
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Numéro WhatsApp :</strong> Ne peut pas être un numéro WhatsApp Messenger existant</li>
                <li><strong>Suppression :</strong> Si vous utilisez un numéro existant, supprimez le compte WhatsApp Messenger et attendez 15 minutes</li>
                <li><strong>Token permanent :</strong> Nécessite un token d'accès permanent (pas temporaire)</li>
                <li><strong>Templates :</strong> Deux templates sont obligatoires (un pour les produits, un pour les commandes)</li>
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
                Accéder aux Feature Apps
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> (Feature Apps) de votre tableau de bord administrateur.
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
                Activer l'add-on WhatsApp Integration
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Recherchez "WhatsApp Integration" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>15$ USD</strong> et approuvez le paiement dans Shopify Backend.
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
                Configuration WhatsApp
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration Intégration WhatsApp</strong> 
                (WhatsApp Integration Configuration).
              </p>
              
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>WHATSAPP PHONE NUMBER ID</strong> : ID du numéro de téléphone WhatsApp</li>
                <li><strong>WHATSAPP BUSINESS ACCOUNT ID</strong> : ID du compte WhatsApp Business</li>
                <li><strong>WHATSAPP ACCESS TOKEN</strong> : Token d'accès permanent</li>
                <li><strong>WHATSAPP TEMPLATE NAME</strong> : Noms des templates (produit, commande)</li>
              </ul>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Pour les templates, entrez d'abord le nom du template produit, 
                  puis le template commande, séparés par une virgule.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Obtention des identifiants WhatsApp */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des identifiants WhatsApp
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Création de l'application Facebook
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à <strong>developers.facebook.com</strong></li>
                <li>Créez une application (nommez-la selon votre marketplace)</li>
                <li>Ajoutez le produit <strong>WhatsApp</strong> à votre application</li>
                <li>Dans WhatsApp → Settings, cliquez sur <strong>Start using the API</strong></li>
                <li>Ajoutez votre <strong>numéro WhatsApp Business</strong></li>
              </ol>
              
              <div style={{
                marginTop: '20px',
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📋 Récupération des ID
                </h4>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Une fois le numéro ajouté, vous trouverez :
                </p>
                <ul style={{ fontSize: '13px', color: styles.textLight, marginLeft: '20px' }}>
                  <li><strong>WHATSAPP PHONE NUMBER ID</strong> : ID du numéro (dans la page du numéro)</li>
                  <li><strong>WHATSAPP BUSINESS ACCOUNT ID</strong> : ID du compte (dans WhatsApp → Settings)</li>
                </ul>
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
                Obtention du token d'accès permanent
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Business Manager → Settings → Users → System Users</strong></li>
                <li>Cliquez sur <strong>Add</strong> et créez un utilisateur système (nom personnalisé)</li>
                <li>Attribuez le rôle <strong>Admin</strong></li>
                <li>Cliquez sur <strong>Generate new token</strong></li>
                <li>Sélectionnez les permissions :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>whatsapp_business_management</li>
                  <li>whatsapp_business_messaging</li>
                  <li>business_management</li>
                </ul>
                <li>Copiez le <strong>token d'accès permanent</strong> généré</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.warning + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ⚠️ <strong>Important :</strong> Le token temporaire expire après 24 heures. 
                  Utilisez le token permanent généré via l'utilisateur système.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Création des templates */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📝 Création des templates WhatsApp
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Template pour les produits
              </h3>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: styles.accent }}>
                  Body Content
                </h4>
                <pre style={{
                  background: '#f1f5f9',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  fontFamily: 'monospace'
                }}>
{`Hello *{{1}}*,

This is to inform you that the following product id *{{2}}* has been *{{3}}*.
For more details contact your merchant. Product Name : *{{4}}* ,

Regards {{5}}`}
                </pre>
                <p style={{ fontSize: '12px', color: styles.textLight, marginTop: '8px' }}>
                  Variables : {`{{1}}`} = Nom du destinataire, {`{{2}}`} = ID produit, {`{{3}}`} = Statut, {`{{4}}`} = Nom produit, {`{{5}}`} = Nom marketplace
                </p>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', marginTop: '24px' }}>
                Template pour les commandes
              </h3>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${styles.border}`
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: styles.accent }}>
                  Body Content
                </h4>
                <pre style={{
                  background: '#f1f5f9',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  fontFamily: 'monospace'
                }}>
{`Hello *{{1}}*,

This is to inform you that order *{{2}}* has been *{{3}}* .
*{{4}}*

Regards {{5}}`}
                </pre>
                <p style={{ fontSize: '12px', color: styles.textLight, marginTop: '8px' }}>
                  Variables : {`{{1}}`} = Nom du destinataire, {`{{2}}`} = Numéro commande, {`{{3}}`} = Statut, {`{{4}}`} = Détails supplémentaires, {`{{5}}`} = Nom marketplace
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Après création des templates, entrez leurs noms dans la configuration 
                  (ex: "product_template,order_template").
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Configuration des événements */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚡ Configuration des événements
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Événements disponibles
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut sélectionner les événements qui déclenchent une notification WhatsApp :
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {[
                  'Commande passée',
                  'Commande expédiée',
                  'Commande remboursée',
                  'Commande annulée',
                  'Produit ajouté',
                  'Produit modifié',
                  'Produit supprimé',
                  'Stock faible'
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: styles.textLight
                  }}>
                    <span>✅</span> {item}
                  </div>
                ))}
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.whatsappLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Activez uniquement les notifications essentielles pour éviter 
                  de surcharger vos vendeurs et clients.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Configuration côté vendeur */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
                Activation des notifications WhatsApp
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Les vendeurs doivent activer les notifications WhatsApp depuis leur tableau de bord :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans <strong>Espace vendeur</strong> → <strong>Configuration</strong> → <strong>Configuration générale</strong></li>
                <li>Activez l'option <strong>Want To Receive Order/Product Updates On WhatsApp</strong></li>
                <li>Sauvegardez les modifications</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  ✅ <strong>Résultat :</strong> Les vendeurs recevront les notifications WhatsApp pour les événements sélectionnés.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Journal des notifications */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📋 Journal des notifications WhatsApp
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Consultation des logs
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                L'administrateur peut consulter l'historique des notifications WhatsApp envoyées :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Allez dans <strong>Configuration des emails</strong> → <strong>Journal WhatsApp</strong> (WhatsApp Log)</li>
                <li>Vous trouverez la liste de toutes les notifications envoyées</li>
                <li>Chaque log contient : la date, le destinataire, le type de notification, le statut</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les logs permettent de suivre l'historique des notifications 
                  et de diagnostiquer d'éventuels problèmes d'envoi.
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
                  Puis-je utiliser mon numéro WhatsApp personnel ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, vous devez utiliser un <strong>numéro WhatsApp Business dédié</strong>. 
                  Si vous avez déjà un compte WhatsApp Messenger, supprimez-le et attendez 15 minutes 
                  avant de l'utiliser pour l'API WhatsApp Business.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la différence entre token temporaire et token permanent ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Le token temporaire expire après 24 heures et est utilisé pour les tests. 
                  Le token permanent (généré via un utilisateur système) est nécessaire pour une utilisation 
                  en production et ne expire pas.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment créer les templates WhatsApp ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les templates sont créés dans l'interface Facebook Developer, dans la section WhatsApp → Templates. 
                  Utilisez les body contents fournis dans ce guide en respectant les variables {`{{1}}`}, {`{{2}}`}, etc.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs doivent-ils configurer quelque chose ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les vendeurs doivent activer l'option <strong>"Want To Receive Order/Product Updates On WhatsApp"</strong> 
                  dans leur configuration générale pour recevoir les notifications.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Où puis-je voir l'historique des notifications envoyées ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'administrateur peut consulter le <strong>Journal WhatsApp</strong> dans la section 
                  Configuration des emails. Toutes les notifications envoyées y sont listées.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien coûte l'utilisation de l'API WhatsApp ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  L'add-on coûte <strong>15$ USD par mois</strong>. Les frais d'utilisation de l'API WhatsApp 
                  sont facturés séparément par Meta (Facebook) selon le volume de messages envoyés.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les notifications fonctionnent-elles pour les clients ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, les clients peuvent également recevoir des notifications WhatsApp pour leurs commandes, 
                  à condition d'avoir fourni leur numéro de téléphone lors de l'inscription ou de la commande.
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
              et l'optimisation de vos notifications WhatsApp.
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
                📚 Documentation Intégration WhatsApp
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
