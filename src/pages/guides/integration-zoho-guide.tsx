import React from 'react';
import { Link } from 'react-router-dom';

export default function ZohoIntegrationGuide() {
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
            🔗📊
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
            Guide d'utilisation - Intégration Zoho
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Synchronisation automatique des données vendeurs avec Zoho CRM
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔗 Synchronisation automatique</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Gestion des leads</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Mise à jour en temps réel</span>
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
              'Obtention des identifiants Zoho',
              'Synchronisation des données',
              'Gestion des leads',
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
              L'add-on <strong>Intégration Zoho</strong> établit une connexion entre votre boutique Shopify et Zoho CRM, 
              une solution cloud de gestion de la relation client. Cette intégration synchronise automatiquement 
              les informations des vendeurs (nom de boutique, email, adresse, contact, téléphone, site web) 
              avec Zoho CRM pour une gestion organisée et efficace des données.
            </p>
            <div style={{
              background: styles.tealLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.teal}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Zoho CRM est un logiciel de gestion de la relation client basé sur le cloud, 
                reconnu pour sa rapidité de synchronisation et sa gestion efficace des données.
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
                <li>Frais supplémentaires de <strong>15$ USD par mois</strong> pour l'add-on Intégration Zoho</li>
                <li>Compte Zoho CRM (inscription séparée)</li>
                <li>Compte développeur Zoho (pour obtenir les identifiants API)</li>
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
                Recherchez "Intégration Zoho" et cliquez sur le bouton <strong>Activer</strong>.
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
                Un nouveau menu <strong>Configuration Zoho</strong> apparaît dans la section 
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
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Configuration Zoho</strong>.
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Activer l'intégration Zoho</strong> : Active pour créer des leads dans Zoho</li>
                <li><strong>Champs à synchroniser</strong> : Sélectionnez les informations à envoyer :</li>
                <ul style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  <li>Adresse de bureau (Office Address)</li>
                  <li>Ville (City)</li>
                  <li>État/Province (State)</li>
                  <li>Pays (Country)</li>
                  <li>Personne de contact (Contact Person)</li>
                  <li>Numéro de téléphone (Mobile Number)</li>
                  <li>Site web (Website)</li>
                </ul>
                <li><strong>URL du compte</strong> : URL Zoho selon votre pays (lien fourni)</li>
                <li><strong>Client ID</strong> : Votre identifiant client Zoho</li>
                <li><strong>Client Secret Key</strong> : Votre clé secrète Zoho</li>
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
                Validation et réinitialisation
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après avoir saisi les identifiants :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>Cliquez sur <strong>Enregistrer</strong></li>
                <li>Une page d'acceptation/rejet apparaît</li>
                <li>Cliquez sur <strong>Accepter</strong> pour autoriser la synchronisation</li>
                <li>Si vous cliquez sur <strong>Rejeter</strong>, les données sont sauvegardées mais les leads ne sont pas créés</li>
                <li><strong>Réinitialiser la configuration</strong> : Permet d'utiliser un autre Client ID</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Pour les vendeurs existants, les leads Zoho CRM seront créés lorsqu'ils 
                  mettront à jour leurs informations depuis "Mon compte" ou si l'administrateur fait une modification.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Obtention des identifiants Zoho */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔑 Obtention des identifiants Zoho
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Créer une application Zoho
              </h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Créez un compte sur <strong>Zoho CRM</strong></li>
                <li>Connectez-vous à la <strong>Zoho Developer Console</strong> avec le même compte</li>
                <li>Allez dans la section <strong>Applications</strong></li>
                <li>Cliquez sur <strong>Ajouter un client</strong></li>
                <li>Choisissez le type de client : <strong>Server-based applications</strong></li>
                <li>Remplissez les détails :</li>
                <ul style={{ marginLeft: '40px', marginBottom: '12px' }}>
                  <li>Nom de l'application</li>
                  <li>URL de la boutique</li>
                  <li>URL de redirection (disponible dans Instructions pour la marketplace)</li>
                </ul>
                <li>Cliquez sur <strong>Créer</strong></li>
                <li>Vous obtiendrez votre <strong>Client ID</strong> et <strong>Client Secret Key</strong></li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Astuce :</strong> Les URLs de redirection sont disponibles dans 
                  <strong>Configuration</strong> → <strong>Instructions pour la marketplace</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Synchronisation des données */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔄 Synchronisation des données
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Inscription vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Lorsqu'un nouveau vendeur s'inscrit :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Les informations sont automatiquement synchronisées avec Zoho</li>
                    <li>Un nouveau lead est créé dans Zoho CRM</li>
                    <li>Les champs sélectionnés sont inclus</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✏️</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Mise à jour vendeur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Lorsqu'un vendeur modifie ses informations :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Les modifications sont automatiquement synchronisées</li>
                    <li>Le lead Zoho est mis à jour en temps réel</li>
                    <li>Les anciennes données sont remplacées</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Modification administrateur</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Lorsque l'administrateur modifie un vendeur :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Les changements sont également synchronisés</li>
                    <li>Le lead Zoho reflète les modifications</li>
                    <li>Les données restent cohérentes</li>
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
                💡 <strong>Avantage :</strong> La synchronisation automatique garantit que vos données CRM sont toujours 
                à jour sans intervention manuelle.
              </p>
            </div>
          </section>

          {/* Section 7: Gestion des leads */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📊 Gestion des leads dans Zoho
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Fonctionnalités disponibles
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois les données synchronisées, vous pouvez :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li><strong>Consulter les leads</strong> : Tous les vendeurs apparaissent comme leads dans Zoho CRM</li>
                <li><strong>Modifier manuellement</strong> : Ajuster les détails des leads directement dans Zoho</li>
                <li><strong>Supprimer</strong> : Retirer des leads si nécessaire</li>
                <li><strong>Exporter</strong> : Générer des rapports depuis Zoho</li>
                <li><strong>Analyser</strong> : Utiliser les outils d'analyse de Zoho CRM</li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Les modifications manuelles dans Zoho ne sont pas synchronisées en retour 
                  avec la marketplace. La synchronisation est unidirectionnelle (Marketplace → Zoho).
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: FAQ */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
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
                  Qu'est-ce que Zoho CRM ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Zoho CRM est une solution cloud de gestion de la relation client qui permet de collecter, 
                  organiser et analyser les données clients. Elle est reconnue pour sa rapidité de synchronisation 
                  et sa gestion efficace des données.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelles informations sont synchronisées avec Zoho ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les informations synchronisées incluent : nom de la boutique, email, adresse de bureau, ville, 
                  état/pays, personne de contact, numéro de téléphone et site web. L'administrateur peut choisir 
                  quels champs synchroniser.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir mes identifiants Zoho ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Créez un compte Zoho CRM, puis connectez-vous à la Zoho Developer Console. 
                  Créez une application de type "Server-based applications" pour obtenir votre Client ID 
                  et Client Secret Key. Les URLs de redirection sont fournies dans les instructions de la marketplace.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si je clique sur "Rejeter" lors de la configuration ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Si vous cliquez sur "Rejeter", les données de configuration sont sauvegardées mais aucun lead 
                  n'est créé dans Zoho. Vous devrez accepter ultérieurement pour activer la synchronisation.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs existants sont-ils synchronisés automatiquement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les leads pour les vendeurs existants ne sont pas créés automatiquement. Ils seront créés 
                  lorsque le vendeur mettra à jour ses informations depuis "Mon compte" ou lorsque l'administrateur 
                  modifiera ses données.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  La synchronisation est-elle bidirectionnelle ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, la synchronisation est unidirectionnelle : de la marketplace vers Zoho CRM. 
                  Les modifications manuelles effectuées dans Zoho ne sont pas répercutées sur la marketplace.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Support */}
          <section id="section-8" style={{
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
              et l'optimisation de votre intégration Zoho.
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
                📚 Documentation Zoho
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
