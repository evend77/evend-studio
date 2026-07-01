import React from 'react';
import { Link } from 'react-router-dom';

export default function SauvegardeBaseDonneesGuide() {
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
    backupBlue: '#1e40af',
    backupCyan: '#0891b2',
    backupLight: '#e0f2fe'
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
        
        {/* En-tête avec dégradé bleu/cyan */}
        <div style={{
          background: `linear-gradient(135deg, ${styles.backupBlue} 0%, ${styles.backupCyan} 100%)`,
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
            💾🔄
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
            Guide d'utilisation - Sauvegarde base de données
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Protégez vos données en créant des sauvegardes instantanées de votre marketplace
          </p>
          <div style={{
            marginTop: '32px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>💾 Sauvegarde de données</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>🔄 Instances de sauvegarde</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 20px', borderRadius: '40px', fontSize: '14px' }}>📊 Comparaison historique</span>
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
              'Accès à la configuration',
              'Création d\'une instance de sauvegarde',
              'Statuts des instances',
              'Tarification des instances',
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
              L'add-on <strong>Sauvegarde base de données</strong> (Database Backup) permet aux administrateurs de créer 
              des sauvegardes complètes de leur marketplace Multivendor. En cas de perte de données due à une panne matérielle, 
              un problème logiciel, une erreur humaine ou une attaque malveillante, vous pouvez restaurer votre marketplace 
              à un état antérieur.
            </p>
            <div style={{
              background: styles.backupLight,
              padding: '20px',
              borderRadius: '16px',
              borderLeft: `4px solid ${styles.backupBlue}`,
              marginTop: '20px'
            }}>
              <p style={{ margin: 0, fontWeight: '500', color: styles.text }}>
                💡 <strong>À savoir :</strong> Vous pouvez créer des sauvegardes pour n'importe quelle date depuis l'installation 
                de l'application jusqu'à aujourd'hui. Les sauvegardes sont des <strong>instances</strong> que vous pouvez consulter 
                sans pouvoir modifier les données.
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
                <li>Frais supplémentaires de <strong>10$ USD par mois</strong> pour l'add-on Sauvegarde base de données</li>
                <li>Boutique Shopify sous <strong>plan payant</strong> (non compatible avec les stores de développement/partenaires)</li>
              </ul>
            </div>

            <div style={{
              background: styles.warning + '20',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.warning}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: styles.warning }}>
                ⚠️ Restrictions importantes
              </h3>
              <ul style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li><strong>Non compatible :</strong> Ne fonctionne pas sur les stores de développement ou les stores partenaires</li>
                <li><strong>Lecture seule :</strong> Dans une instance de sauvegarde, vous ne pouvez <strong>pas effectuer d'actions</strong> (ajout, modification, suppression)</li>
                <li><strong>Plage de sauvegarde :</strong> Vous pouvez sélectionner une date parmi les <strong>6 derniers jours</strong></li>
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
                Rendez-vous dans le tableau de bord administrateur et cliquez sur les trois points (⋮) dans le coin supérieur droit.
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
                Activer l'add-on
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '12px', marginLeft: '44px' }}>
                Dans la section <strong>Feature Apps</strong>, recherchez "Database Backup" et cliquez sur le bouton <strong>Activer</strong>.
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
                Acceptez les frais mensuels de <strong>10$ USD</strong> pour l'add-on et approuvez le paiement dans Shopify Backend.
              </p>
            </div>
          </section>

          {/* Section 4: Accès à la configuration */}
          <section id="section-3" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              🔧 Accès à la configuration
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Comment accéder à la sauvegarde
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Une fois l'add-on installé, suivez ces étapes :
              </p>
              <ol style={{ color: styles.textLight, lineHeight: '1.8', marginLeft: '20px' }}>
                <li>Allez dans votre <strong>Tableau de bord administrateur</strong></li>
                <li>Cliquez sur les trois points (⋮) dans le coin supérieur droit</li>
                <li>Sélectionnez <strong>Multi-vendor Database Backup</strong> dans le menu déroulant</li>
                <li>Cliquez sur <strong>Multi-vendor Backup Configuration</strong> pour commencer la configuration</li>
              </ol>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Note :</strong> Cette section vous permet de gérer vos paramètres de sauvegarde 
                  et de visualiser les données de sauvegarde disponibles.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Création d'une instance de sauvegarde */}
          <section id="section-4" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📝 Création d'une instance de sauvegarde
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Processus de création
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                La création d'une sauvegarde s'appelle la <strong>création d'instance</strong>. 
                Chaque instance de sauvegarde est <strong>payante</strong> (25$ par instance).
              </p>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  📋 Paramètres de l'instance
                </h4>
                <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                  <li><strong>Launch Description :</strong> Ajoutez une courte description de la sauvegarde (ce qu'elle couvre, pourquoi elle est créée)</li>
                  <li><strong>Launch Backup Day :</strong> Sélectionnez une date parmi les <strong>6 derniers jours</strong>. La sauvegarde couvrira de la date d'installation jusqu'à la date sélectionnée</li>
                  <li><strong>Launch Title :</strong> Fournissez un titre pertinent pour identifier facilement l'instance</li>
                </ul>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.success + '20',
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  💡 <strong>Conseil :</strong> Utilisez des titres descriptifs comme "Sauvegarde avant mise à jour majeure - 15/03/2024" 
                  pour faciliter l'identification ultérieure.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Statuts des instances */}
          <section id="section-5" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              📊 Statuts des instances
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Liste des instances
              </h3>
              <p style={{ color: styles.textLight, marginBottom: '16px' }}>
                Après la création d'une instance, vous accédez à la page <strong>Multivendor Backup Instance</strong> 
                où vous trouverez une liste avec les colonnes suivantes :
              </p>
              <ul style={{ color: styles.textLight, marginLeft: '20px' }}>
                <li>ID</li>
                <li>Launch Title (Titre)</li>
                <li>Launch Backup Date (Date de sauvegarde)</li>
                <li>Launch Date (Date de création)</li>
                <li>Launch Termination Date (Date de terminaison)</li>
                <li>Charges (Frais)</li>
                <li>Status (Statut)</li>
                <li>Action</li>
              </ul>
              
              <div style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Processing</h4>
                  <p style={{ fontSize: '12px', color: styles.textLight, margin: 0 }}>
                    Les données sont en cours de traitement en arrière-plan
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Active</h4>
                  <p style={{ fontSize: '12px', color: styles.textLight, margin: 0 }}>
                    La sauvegarde a réussi et est disponible
                  </p>
                </div>
                
                <div style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${styles.border}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⛔</div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Terminated</h4>
                  <p style={{ fontSize: '12px', color: styles.textLight, margin: 0 }}>
                    Le processus de sauvegarde a été arrêté
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Tarification des instances */}
          <section id="section-6" style={{ marginBottom: '48px' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: styles.text,
              marginBottom: '20px',
              borderLeft: `4px solid ${styles.accent}`,
              paddingLeft: '20px'
            }}>
              💰 Tarification des instances
            </h2>
            
            <div style={{
              background: '#f8fafc',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${styles.border}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Structure des coûts
              </h3>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  💵 Coût par instance
                </h4>
                <p style={{ fontSize: '14px', color: styles.textLight, margin: 0 }}>
                  Chaque instance de sauvegarde créée coûte <strong>25$ USD</strong>.
                </p>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${styles.border}`,
                marginBottom: '20px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: styles.accent }}>
                  ⏱️ Frais de conservation
                </h4>
                <p style={{ fontSize: '14px', color: styles.textLight, margin: 0 }}>
                  <strong>Gratuit :</strong> Les 2 premières heures d'une instance active ne sont pas facturées.<br />
                  <strong>5$ / heure :</strong> Au-delà de 2 heures, l'instance est facturée 5$ par heure.
                </p>
              </div>
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: styles.accentLight,
                borderRadius: '12px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: styles.text }}>
                  📌 <strong>Exemple :</strong> Si vous créez une instance qui reste active pendant 5 heures, vous serez facturé :<br />
                  - 25$ pour l'instance<br />
                  - 3 heures x 5$ = 15$ pour les heures supplémentaires<br />
                  <strong>Total : 40$</strong>
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
                  Qu'est-ce qu'une instance de sauvegarde ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Une instance est une copie complète de votre marketplace à une date spécifique. 
                  Vous pouvez créer plusieurs instances pour différents moments dans le temps.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je modifier les données dans une instance de sauvegarde ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Non, les instances de sauvegarde sont en <strong>lecture seule</strong>. Vous ne pouvez pas effectuer 
                  d'actions comme ajouter, modifier ou supprimer des données. C'est une mesure de protection pour 
                  garantir l'intégrité de la sauvegarde.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Quelle est la période maximale pour une sauvegarde ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Vous pouvez sélectionner n'importe quelle date depuis l'installation de l'application jusqu'à aujourd'hui. 
                  Cependant, dans l'interface, vous ne pouvez choisir qu'une date parmi les <strong>6 derniers jours</strong>.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Pourquoi ne puis-je pas utiliser cette fonctionnalité sur un store de développement ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les stores de développement et les stores partenaires ont des limitations techniques qui empêchent 
                  la création d'instances de sauvegarde complètes. Vous devez avoir un <strong>plan Shopify payant</strong> 
                  pour utiliser cette fonctionnalité.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Combien coûte la conservation d'une instance ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les 2 premières heures sont gratuites. Au-delà, vous êtes facturé <strong>5$ par heure</strong>. 
                  Il est recommandé de terminer les instances une fois que vous avez fini de consulter les données.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Que se passe-t-il si une instance reste active trop longtemps ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Les frais continuent de s'accumuler à 5$ par heure après les 2 premières heures. 
                  Vous pouvez terminer une instance manuellement pour arrêter les frais.
                </p>
              </div>

              <div style={{ border: `1px solid ${styles.border}`, borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: styles.accent }}>
                  Puis-je comparer les données entre différentes instances ?
                </h4>
                <p style={{ color: styles.textLight, margin: 0 }}>
                  Oui, l'administrateur peut comparer les données du passé avec le présent en accédant à différentes 
                  instances de sauvegarde. Cela permet d'analyser l'évolution des données.
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
              Notre équipe d'experts est disponible 24h/24 et 7j/7 pour vous accompagner dans la gestion 
              et l'optimisation de vos sauvegardes de base de données.
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
                📚 Documentation Sauvegarde base de données
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
