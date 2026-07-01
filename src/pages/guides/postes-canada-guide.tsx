import React from 'react';
import { Link } from 'react-router-dom';

export default function CanadaPostGuide() {
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
    red: '#dc2626',
    redLight: '#fee2e2'
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
          background: `linear-gradient(135deg, ${styles.red} 0%, ${styles.accent} 100%)`,
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
            🇨🇦📮
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
            Guide d'utilisation - Postes Canada
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Expédiez vos produits depuis le Canada vers le monde entier avec Postes Canada
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📦 Expédition nationale et internationale</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🏷️ Génération d'étiquettes</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🚚 Demandes d'enlèvement</span>
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
              'Prérequis et configuration',
              'Configuration côté administrateur',
              'Configuration côté vendeur',
              'Types d\'expédition',
              'Génération d\'étiquettes',
              'Demandes d\'enlèvement',
              'Suivi des colis',
              'Mise à jour automatique du statut',
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
              L'add-on <strong>Postes Canada</strong> permet aux vendeurs canadiens de votre marketplace d'expédier leurs produits 
              à travers le Canada et dans le monde entier via le service postal national du Canada. Cette intégration offre une 
              solution d'expédition complète avec génération d'étiquettes, suivi des colis et demandes d'enlèvement.
            </p>
            <div style={{
              background: styles.blueLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.blue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Postes Canada est le service postal officiel du Canada, offrant des options d'expédition 
                économiques pour les envois nationaux et internationaux. Les délais de livraison varient de 2 à 10 jours ouvrables 
                selon la destination et le service choisi.
              </p>
            </div>
          </section>

          {/* Section 2: Prérequis et configuration */}
          <section id="section-1" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              ⚠️ Prérequis et configuration
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Postes Canada</li>
                <li>Plan Shopify avec <strong>Real-Time Carrier-Calculated Shipping</strong></li>
                <li>Compte marchand Postes Canada avec identifiants API</li>
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
              👑 Étape 1 : Configuration côté administrateur
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
                Activer l'add-on Postes Canada
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Rendez-vous dans la section <strong>Modules complémentaires</strong> de votre tableau de bord administrateur.
                Localisez "Postes Canada" et cliquez sur le bouton <strong>Activer</strong>. Une fenêtre de confirmation 
                s'ouvrira pour les frais mensuels de 10$ USD.
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
                Configurer les services d'expédition
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Allez dans <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong> → sélectionnez 
                <strong>Postes Canada</strong> et enregistrez les modifications.
              </p>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  ✅ Astuce : Ne sélectionnez que les services d'expédition dont vous avez besoin. Trop de services peuvent ralentir 
                  la récupération des tarifs sur la boutique.
                </code>
              </div>
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
                }}>3</span>
                Saisir les identifiants Postes Canada
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Un nouveau menu <strong>Configuration Postes Canada</strong> apparaît dans la section Configuration. 
                Remplissez les champs suivants :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px', marginBottom: '12px' }}>
                <li><strong>Nom d'utilisateur Postes Canada</strong> : Votre identifiant de compte</li>
                <li><strong>Mot de passe Postes Canada</strong> : Votre mot de passe de compte</li>
                <li><strong>Numéro de client Postes Canada</strong> : Votre numéro de client</li>
              </ul>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginLeft: '44px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  🔑 Comment obtenir vos identifiants ? Rendez-vous sur https://www.canadapost-postescanada.ca et créez un compte marchand.
                </code>
              </div>
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
                }}>4</span>
                Configurer la prise en charge des frais d'étiquettes
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Vous pouvez choisir qui supporte les frais d'étiquettes d'expédition :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li><strong>Administrateur</strong> : Les frais sont à la charge de la marketplace</li>
                <li><strong>Vendeur</strong> : Chaque vendeur paie ses propres frais d'étiquettes</li>
              </ul>
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
                }}>5</span>
                Autoriser les vendeurs à utiliser leurs propres identifiants
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Activez l'option <strong>Détails Postes Canada du vendeur</strong> pour permettre à chaque vendeur 
                d'utiliser ses propres identifiants Postes Canada. Un sous-menu "Configuration Postes Canada" 
                apparaîtra alors sur le portail vendeur.
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
              🛍️ Étape 2 : Configuration côté vendeur
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
                Sélectionner la méthode d'expédition
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Connectez-vous à votre <strong>espace vendeur</strong>, puis allez dans 
                <strong>Configuration</strong> → <strong>Méthodes d'expédition</strong>. Sélectionnez 
                <strong>Postes Canada</strong> et enregistrez les modifications.
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
                }}>2</span>
                Configurer les détails Postes Canada
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Si l'administrateur a activé l'option, un menu <strong>Configuration Postes Canada</strong> 
                apparaît. Remplissez vos identifiants personnels :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '64px' }}>
                <li>Nom d'utilisateur Postes Canada</li>
                <li>Mot de passe Postes Canada</li>
                <li>Numéro de client Postes Canada</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Types d'expédition */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🗺️ Types d'expédition Postes Canada
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              
              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.blue}, ${styles.blue}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🇨🇦</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Expédition nationale</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Pour les envois à destination du Canada. Options disponibles :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Lette-postale</li>
                    <li>Colis accéléré</li>
                    <li>Colis prioritaire</li>
                    <li>Xpresspost</li>
                    <li>Livraison le jour même (certaines villes)</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.purple}, ${styles.purple}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌍</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Expédition internationale</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Pour les envois à destination de l'international :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Colis international - Surface</li>
                    <li>Colis international - Air</li>
                    <li>Xpresspost international</li>
                    <li>Priority Worldide</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${styles.success}, ${styles.success}dd)`, padding: '20px', color: 'white' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Services express</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                    Options de livraison rapide pour les envois urgents :
                  </p>
                  <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                    <li>Xpresspost (1-2 jours ouvrables)</li>
                    <li>Priority Worldwide (1-3 jours ouvrables)</li>
                    <li>Livraison le jour même (sélection de villes)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Génération d'étiquettes */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🏷️ Génération d'étiquettes d'expédition
            </h2>
            
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '24px' }}>
              Les vendeurs peuvent générer automatiquement des étiquettes d'expédition pour les commandes 
              expédiées via Postes Canada.
            </p>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`,
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Procédure de génération d'étiquette</h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Connectez-vous à votre <strong>espace vendeur</strong></li>
                <li>Allez dans <strong>Commandes</strong> → <strong>Liste des commandes</strong></li>
                <li>Cliquez sur le bouton <strong>Voir</strong> à côté de la commande concernée</li>
                <li>Dans le menu Actions, cliquez sur <strong>Générer l'étiquette d'expédition</strong></li>
                <li>Vérifiez les informations d'expédition</li>
                <li>Confirmez pour générer l'étiquette au format PDF</li>
              </ol>
            </div>

            <div style={{
              background: styles.accentLight,
              borderRadius: '20px',
              padding: '20px',
              borderLeft: `4px solid ${styles.accent}`
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>Astuce :</strong> Les étiquettes générées peuvent être imprimées directement sur du papier 
                autocollant ou sur du papier standard à découper. Collez l'étiquette sur le colis avant l'enlèvement 
                ou le dépôt.
              </p>
            </div>
          </section>

          {/* Section 7: Demandes d'enlèvement */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🚚 Demandes d'enlèvement
            </h2>
            
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '24px' }}>
              Les vendeurs peuvent planifier des enlèvements directement depuis l'application. 
              Le service de Postes Canada viendra chercher les colis à l'adresse indiquée.
            </p>

            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Créer une demande d'enlèvement</h3>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Dans la page de détails de la commande, cliquez sur <strong>Créer une demande d'enlèvement</strong></li>
                <li>Vérifiez la disponibilité en entrant votre code postal</li>
                <li>Sélectionnez une <strong>date d'enlèvement</strong> parmi les options disponibles</li>
                <li>Le tarif total d'enlèvement s'affichera automatiquement</li>
                <li>Choisissez un <strong>créneau horaire</strong> pour l'enlèvement</li>
                <li>Entrez le <strong>volume de colis</strong> (nombre de colis)</li>
                <li>Ajoutez des <strong>instructions spéciales</strong> si nécessaire (code d'accès, etc.)</li>
                <li>Cliquez sur <strong>Confirmer la demande</strong></li>
              </ol>
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f1f5f9',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.textLight }}>
                  ⏰ <strong>Note :</strong> Les demandes d'enlèvement doivent être créées avant 14h pour un enlèvement le lendemain. 
                  Un email de confirmation sera envoyé une fois la demande validée.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Suivi des colis */}
          <section id="section-7" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📍 Suivi des colis
            </h2>
            
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: styles.textLight, marginBottom: '24px' }}>
              Administrateurs et vendeurs peuvent suivre l'état des colis en temps réel directement depuis l'application.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>👑</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Côté administrateur</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Accédez aux détails de la commande via <strong>Commandes → Liste des commandes → Voir</strong>.
                  Dans la section <strong>Détails d'expédition</strong>, vous trouverez le numéro de suivi 
                  et un lien direct vers le suivi Postes Canada.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛍️</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Côté vendeur</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Dans l'espace vendeur, allez dans <strong>Commandes → Liste des commandes → Voir</strong>.
                  La section <strong>Détails d'expédition</strong> affiche le statut actuel du colis et le numéro de suivi.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: `1px solid ${styles.border}` }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🛒</div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Côté client</h3>
                <p style={{ fontSize: '13px', color: styles.textLight }}>
                  Les clients reçoivent un email avec le numéro de suivi dès que la commande est expédiée. 
                  Ils peuvent suivre leur colis directement sur le site de Postes Canada.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Mise à jour automatique */}
          <section id="section-8" style={{ marginBottom: '48px' }}>
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
              background: styles.success + '10',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.success}30`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '32px' }}>✅</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Statut auto-mis à jour</h3>
              </div>
              <p style={{ color: styles.textLight, marginBottom: 0 }}>
                Une fois la commande livrée par Postes Canada, le statut est automatiquement mis à jour 
                dans l'application Multivendor Marketplace. Plus besoin de suivre manuellement !
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${styles.border}`
              }}>
                <code style={{ fontSize: '13px', color: styles.text }}>
                  📬 Les statuts évoluent : "En attente" → "Expédié" → "En transit" → "Livré"
                </code>
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
                  Quels sont les délais de livraison avec Postes Canada ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les délais varient selon le service choisi : 2-3 jours pour Xpresspost, 3-7 jours pour Colis accéléré, 
                  et 4-10 jours pour les envois internationaux. Des délais plus longs s'appliquent pour les régions éloignées.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Comment obtenir mes identifiants Postes Canada ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Visitez le site de Postes Canada, créez un compte marchand (commerçant), puis accédez à la section 
                  "Développeurs" pour obtenir vos clés API. Vous aurez besoin d'un nom d'utilisateur, mot de passe et 
                  numéro de client.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les vendeurs peuvent-ils utiliser leur propre compte Postes Canada ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! L'administrateur peut activer l'option "Détails Postes Canada du vendeur". Chaque vendeur 
                  pourra alors saisir ses propres identifiants et gérer ses expéditions indépendamment.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je imprimer plusieurs étiquettes à la fois ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Actuellement, les étiquettes sont générées une par une. Une fonctionnalité d'impression groupée 
                  est en cours de développement pour une version future.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que faire en cas de problème d'enlèvement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vérifiez d'abord que la demande a été confirmée. Si le facteur ne s'est pas présenté, 
                  contactez Postes Canada au 1-866-607-6301. Vous pouvez également annuler la demande 
                  et en créer une nouvelle depuis l'application.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Les tarifs sont-ils calculés en temps réel ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui ! Les tarifs d'expédition sont calculés en temps réel selon le poids, les dimensions et 
                  la destination, directement depuis l'API de Postes Canada. Les clients voient le prix exact 
                  au moment du paiement.
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
              et l'optimisation de vos expéditions Postes Canada.
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
                📚 Documentation Postes Canada
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
