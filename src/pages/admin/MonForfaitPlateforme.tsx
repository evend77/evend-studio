import React, { useState } from 'react';

// Thème (cohérent avec l'admin)
const THEME = {
  sidebar: '#1a2436',
  sidebarHover: '#243044',
  sidebarActive: '#2d6a9f',
  accent: '#2d6a9f',
  accentLight: '#e8f2fb',
  topbar: '#ffffff',
  bg: '#f0f2f5',
  card: '#ffffff',
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
};

interface MonForfaitPlateformeProps {
  naviguerVers?: (page: string, data?: any) => void;
}

type FrequencePaiement = 'mensuel' | 'annuel';

export default function MonForfaitPlateforme({ naviguerVers }: MonForfaitPlateformeProps) {
  const [modalPauseOuvert, setModalPauseOuvert] = useState(false);
  const [modalConfirmationPause, setModalConfirmationPause] = useState(false);
  const [frequencePaiement, setFrequencePaiement] = useState<FrequencePaiement>('mensuel');
  
  // Données du forfait actuel
  const forfaitActuel = {
    nom: 'Pro',
    prixMensuel: 60,
    prixAnnuel: 650,
    devise: '$',
    vendeursActifs: 18,
    vendeursMax: 'Illimité',
    espaceDigital: '15 Go',
    emails: '10 000 / mois',
    statut: 'Actif'
  };

  // Calcul des frais de pause (25% du prix mensuel, min 10$, max 25$)
  const calculerFraisPause = () => {
    let frais = forfaitActuel.prixMensuel * 0.25;
    if (frais < 10) return 10;
    if (frais > 25) return 25;
    return Math.round(frais * 100) / 100;
  };

  const fraisPause = calculerFraisPause();

  // Prix des forfaits
  const plans = {
    basic: { mensuel: 15, annuel: 180 },
    executive: { mensuel: 40, annuel: 480 },
    pro: { mensuel: 60, annuel: 650 },
    enterprise: { mensuel: 'Sur devis', annuel: 'Sur devis' }
  };

  return (
    <div style={{ 
      padding: '28px 32px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: THEME.bg,
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* En-tête avec navigation */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Mon forfait plateforme
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Gérez votre abonnement et vos options • Mise à jour le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {naviguerVers && (
          <button
            onClick={() => naviguerVers('dashboard')}
            style={{
              backgroundColor: 'white',
              border: `1px solid ${THEME.border}`,
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: THEME.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>←</span> Retour au tableau de bord
          </button>
        )}
      </div>

      {/* Section "Acheter maintenant" / Démo */}
      <div style={{ 
        backgroundColor: THEME.accentLight, 
        borderRadius: '12px', 
        padding: '20px 24px',
        marginBottom: '32px',
        border: `1px solid ${THEME.accent}20`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🛍️</span>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: THEME.text }}>
              Suspension d'abonnement : Place de marché multi-vendeurs pour Shopify
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Avez-vous déjà ressenti le besoin de suspendre temporairement votre abonnement à une application ?
            Eh bien, l'application Multivendor Marketplace pour Shopify propose désormais cette fonctionnalité.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            backgroundColor: 'white',
            border: `1px solid ${THEME.accent}`,
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: '600',
            color: THEME.accent,
            cursor: 'pointer'
          }}>
            Démo
          </button>
          <button style={{
            backgroundColor: THEME.accent,
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: '600',
            color: 'white',
            cursor: 'pointer'
          }}>
            Acheter maintenant
          </button>
        </div>
      </div>

      {/* Onglets Mensuel/Annuel */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '32px',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'white',
          borderRadius: '50px',
          padding: '4px',
          border: `1px solid ${THEME.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setFrequencePaiement('mensuel')}
            style={{
              padding: '12px 32px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: frequencePaiement === 'mensuel' ? THEME.accent : 'transparent',
              color: frequencePaiement === 'mensuel' ? 'white' : THEME.text,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Mensuel
          </button>
          <button
            onClick={() => setFrequencePaiement('annuel')}
            style={{
              padding: '12px 32px',
              borderRadius: '50px',
              border: 'none',
              backgroundColor: frequencePaiement === 'annuel' ? THEME.accent : 'transparent',
              color: frequencePaiement === 'annuel' ? 'white' : THEME.text,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            Annuel
            {frequencePaiement === 'annuel' && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: THEME.success,
                color: 'white',
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '12px',
                whiteSpace: 'nowrap'
              }}>
                Économisez 15%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grille des forfaits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {/* Plan Basic */}
        <PlanCard
          nom="Basic"
          description="Toutes les fonctionnalités de base pour démarrer"
          prix={frequencePaiement === 'mensuel' ? plans.basic.mensuel : plans.basic.annuel}
          periode={frequencePaiement}
          devise="$"
          features={[
            { text: '3 vendeurs actifs', bold: true },
            'Nombre illimité de produits',
            'CSS personnalisé page vendeur',
            '0% de frais de transaction',
            '10 000 emails / mois',
            'Support ticket 24/7'
          ]}
          statut="indisponible"
          vendeursActifs={forfaitActuel.vendeursActifs}
          limiteVendeurs={3}
          THEME={THEME}
        />

        {/* Plan Executive */}
        <PlanCard
          nom="Executive"
          description="Pour les marketplaces en croissance"
          prix={frequencePaiement === 'mensuel' ? plans.executive.mensuel : plans.executive.annuel}
          periode={frequencePaiement}
          devise="$"
          features={[
            { text: '10 vendeurs actifs', bold: true },
            'Nombre illimité de produits',
            'CSS personnalisé page vendeur',
            '0% de frais de transaction',
            '5 Go d\'espace digital',
            '10 000 emails / mois',
            'Support ticket 24/7'
          ]}
          statut="indisponible"
          vendeursActifs={forfaitActuel.vendeursActifs}
          limiteVendeurs={10}
          THEME={THEME}
        />

        {/* Plan Pro (Actif) */}
        <PlanCard
          nom="Pro"
          description="Fonctionnalités avancées pour développer votre marketplace"
          prix={frequencePaiement === 'mensuel' ? plans.pro.mensuel : plans.pro.annuel}
          periode={frequencePaiement}
          devise="$"
          features={[
            { text: 'Vendeurs illimités', bold: true },
            'Nombre illimité de produits',
            'JS/CSS personnalisé page vendeur',
            '0% de frais de transaction',
            '15 Go d\'espace digital',
            '10 000 emails / mois',
            'Support ticket 24/7',
            'Livraison vendeur',
            'Marque blanche',
            'Domaine personnalisé'
          ]}
          statut="actif"
          actif={true}
          onPause={() => setModalPauseOuvert(true)}
          THEME={THEME}
        />

        {/* Plan Enterprise */}
        <PlanCard
          nom="Enterprise"
          description="Fonctionnalités enterprise pour faire évoluer votre marketplace"
          prix="Sur devis"
          periode={frequencePaiement}
          devise=""
          features={[
            { text: 'Vendeurs illimités', bold: true },
            'Nombre illimité de produits',
            'JS/CSS personnalisé page vendeur',
            '0% de frais de transaction',
            'Stockage optimisé',
            'Upload de fichiers numériques augmenté',
            { text: 'Services exclusifs :', bold: true, isHeader: true },
            'Serveur privé',
            'Gestionnaire de compte dédié',
            'Support chat en direct',
            'Personnalisation prioritaire'
          ]}
          statut="enterprise"
          THEME={THEME}
        />
      </div>

      {/* Section explication des frais de pause */}
      <div style={{ 
        backgroundColor: THEME.card, 
        borderRadius: '12px', 
        border: `1px solid ${THEME.border}`,
        padding: '24px',
        marginBottom: '40px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: THEME.text }}>
          💡 Tarification pendant la suspension
        </h3>
        <p style={{ fontSize: '13px', color: THEME.text, marginBottom: '16px' }}>
          Pendant la suspension de votre application, vous devrez payer <strong>25 % de vos frais mensuels</strong> d'utilisation. 
          Ces frais ne pourront être inférieurs à <strong>10 $</strong> ni supérieurs à <strong>25 $</strong> et devront être payés mensuellement.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
          {/* Exemple 1 */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px', 
            padding: '16px',
            border: `1px solid ${THEME.border}`
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 12px 0', color: THEME.accent }}>Exemple I</h4>
            <p style={{ fontSize: '13px', color: THEME.text, margin: '0 0 8px 0' }}>
              Si votre forfait vous coûte <strong>120 $ par mois</strong> :
            </p>
            <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '12px', color: THEME.text }}>
              <li>25% de 120 $ = 30 $</li>
              <li>Frais maximum : 25 $</li>
              <li><strong>Vous paierez 25 $</strong> au lieu de 30 $</li>
            </ul>
          </div>

          {/* Exemple 2 */}
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px', 
            padding: '16px',
            border: `1px solid ${THEME.border}`
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 12px 0', color: THEME.accent }}>Exemple II</h4>
            <p style={{ fontSize: '13px', color: THEME.text, margin: '0 0 8px 0' }}>
              Si votre forfait vous coûte <strong>30 $ par mois</strong> :
            </p>
            <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '12px', color: THEME.text }}>
              <li>25% de 30 $ = 7,50 $</li>
              <li>Frais minimum : 10 $</li>
              <li><strong>Vous paierez 10 $</strong> au lieu de 7,50 $</li>
            </ul>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: THEME.textLight, marginTop: '16px', fontStyle: 'italic' }}>
          * Les frais sont facturés mensuellement pendant toute la durée de la suspension.
        </p>
      </div>

      {/* Section processus et FAQ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        {/* Le processus */}
        <div style={{ 
          backgroundColor: THEME.card, 
          borderRadius: '12px', 
          border: `1px solid ${THEME.border}`,
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: THEME.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📋</span> Le processus
          </h3>
          
          <ol style={{ margin: '0 0 20px 20px', padding: 0, fontSize: '13px', color: THEME.text, lineHeight: '1.6' }}>
            <li>Accédez au panneau d'administration de la place de marché</li>
            <li>Cliquez sur le bouton "Suspendre l'abonnement" dans la carte de votre forfait actif</li>
            <li>Confirmez la suspension dans la fenêtre contextuelle</li>
            <li>Approuvez les frais sur la page Shopify</li>
            <li>Votre abonnement sera suspendu</li>
          </ol>

          <div style={{ 
            backgroundColor: '#fef9c3', 
            borderRadius: '8px', 
            padding: '12px 16px',
            border: '1px solid #d97706'
          }}>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0, fontWeight: '500' }}>
              <strong>Note :</strong> Lorsque vous réactiverez l'application, vous retrouverez le bouton 
              "Reprendre l'abonnement" pour vous réabonner à tout moment.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ 
          backgroundColor: THEME.card, 
          borderRadius: '12px', 
          border: `1px solid ${THEME.border}`,
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: THEME.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>❓</span> FAQ - Questions fréquentes
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FaqItem 
              question="Mes données seront-elles conservées pendant la pause ?"
              reponse="Oui, toutes vos données sont conservées intégralement pendant la suspension de votre abonnement."
            />
            <FaqItem 
              question="Puis-je accéder au backend pendant la pause ?"
              reponse="Non, ni l'administrateur ni les vendeurs ne peuvent accéder à l'interface d'administration. Les webhooks ne fonctionneront pas et les mises à jour ne seront pas synchronisées."
            />
            <FaqItem 
              question="Mon profil vendeur sera-t-il visible sur la boutique ?"
              reponse="Non, la page de liste des vendeurs et les profils vendeurs ne seront pas affichés sur l'interface publique."
            />
            <FaqItem 
              question="Puis-je suspendre pendant la période d'essai ?"
              reponse="Non, la suspension n'est pas disponible pendant la période d'essai gratuite ou sur une boutique partenaire."
            />
            <FaqItem 
              question="Quand puis-je réactiver mon abonnement ?"
              reponse="Vous pouvez réactiver votre abonnement à tout moment en cliquant sur l'application dans la section des applications Shopify."
            />
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px 0 0',
        borderTop: `1px solid ${THEME.border}`,
        fontSize: '11px',
        color: THEME.textLight
      }}>
        © Copyright 2010–{new Date().getFullYear()} Vickalex Software, Tous droits réservés.
      </div>

      {/* Modal de pause */}
      {modalPauseOuvert && (
        <ModalPause 
          forfaitNom={forfaitActuel.nom}
          fraisPause={fraisPause}
          onConfirm={() => {
            setModalPauseOuvert(false);
            setModalConfirmationPause(true);
          }}
          onClose={() => setModalPauseOuvert(false)}
          THEME={THEME}
        />
      )}

      {/* Modal de confirmation */}
      {modalConfirmationPause && (
        <ModalConfirmation
          onClose={() => setModalConfirmationPause(false)}
          THEME={THEME}
        />
      )}
    </div>
  );
}

// Composant pour les cartes de forfait (mis à jour)
function PlanCard({ nom, description, prix, periode, devise, features, statut, actif, vendeursActifs, limiteVendeurs, onPause, THEME }: any) {
  const estIndisponible = statut === 'indisponible';
  const estActif = actif;
  const estEnterprise = statut === 'enterprise';
  const depasseLimite = limiteVendeurs && vendeursActifs > limiteVendeurs;

  return (
    <div style={{ 
      backgroundColor: THEME.card, 
      borderRadius: '12px', 
      border: `2px solid ${estActif ? THEME.accent : estEnterprise ? THEME.accent : THEME.border}`,
      overflow: 'hidden',
      boxShadow: estActif ? '0 4px 12px rgba(45,106,159,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {estActif && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: THEME.success,
          color: 'white',
          fontSize: '10px',
          fontWeight: '800',
          padding: '4px 8px',
          borderRadius: '20px',
          textTransform: 'uppercase'
        }}>
          ACTIF
        </div>
      )}
      
      {estEnterprise && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: THEME.accent,
          color: 'white',
          fontSize: '10px',
          fontWeight: '800',
          padding: '4px 8px',
          borderRadius: '20px',
          textTransform: 'uppercase'
        }}>
          SUR DEVIS
        </div>
      )}
      
      <div style={{ padding: '20px', borderBottom: `1px solid ${THEME.border}` }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text }}>{nom}</h3>
        <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 16px 0' }}>{description}</p>
        
        {typeof prix === 'number' ? (
          <>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: THEME.accent }}>{prix} {devise}</span>
              <span style={{ fontSize: '14px', color: THEME.textLight }}> / {periode === 'mensuel' ? 'mois' : 'an'}</span>
            </div>
            <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>15 jours d'essai</p>
          </>
        ) : (
          <div style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '20px', fontWeight: '700', color: THEME.accent }}>{prix}</span>
          </div>
        )}
      </div>
      
      <div style={{ padding: '20px', flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
          {features.map((feature: any, i: number) => (
            <li key={i} style={{ 
              display: 'flex', 
              alignItems: feature.isHeader ? 'flex-start' : 'center', 
              gap: '8px', 
              marginBottom: feature.isHeader ? '12px' : '8px',
              marginTop: feature.isHeader ? '8px' : 0,
              fontSize: feature.isHeader ? '13px' : '12px',
              fontWeight: feature.isHeader ? '700' : 'normal',
              color: feature.isHeader ? THEME.text : THEME.text,
              borderBottom: feature.isHeader ? `1px solid ${THEME.border}` : 'none',
              paddingBottom: feature.isHeader ? '8px' : 0
            }}>
              {!feature.isHeader && <span style={{ color: THEME.success }}>✓</span>}
              {typeof feature === 'string' ? feature : (
                feature.bold ? <strong>{feature.text}</strong> : feature.text
              )}
            </li>
          ))}
        </ul>

        {estIndisponible ? (
          <>
            <div style={{
              backgroundColor: '#fee2e2',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: THEME.danger, fontWeight: '600', margin: 0 }}>
                {depasseLimite 
                  ? `Vous avez ${vendeursActifs} vendeurs actifs. Maximum ${limiteVendeurs} pour ce forfait.`
                  : 'INDISPONIBLE'
                }
              </p>
            </div>
            <button disabled style={{
              width: '100%',
              backgroundColor: '#e5e7eb',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#9ca3af',
              cursor: 'not-allowed'
            }}>
              NON DISPONIBLE
            </button>
          </>
        ) : estActif ? (
          <>
            <div style={{
              backgroundColor: '#dcfce7',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: THEME.success, fontWeight: '600', margin: 0 }}>
                ✓ ACTUELLEMENT ACTIF
              </p>
            </div>
            <button
              onClick={onPause}
              style={{
                width: '100%',
                backgroundColor: THEME.warning,
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '700',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              SUSPENDRE L'ABONNEMENT
            </button>
          </>
        ) : estEnterprise ? (
          <button style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: `2px solid ${THEME.accent}`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '700',
            color: THEME.accent,
            cursor: 'pointer',
            marginTop: 'auto'
          }}>
            CONTACTEZ-NOUS
          </button>
        ) : (
          <button style={{
            width: '100%',
            backgroundColor: THEME.accent,
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '700',
            color: 'white',
            cursor: 'pointer'
          }}>
            CHOISIR CE FORFAIT
          </button>
        )}
        
        {estEnterprise && (
          <p style={{ fontSize: '11px', color: THEME.textLight, textAlign: 'center', marginTop: '12px' }}>
            Si vous avez des questions concernant ce forfait, contactez-nous.
          </p>
        )}
      </div>
    </div>
  );
}

// Composant pour les items FAQ
function FaqItem({ question, reponse }: { question: string; reponse: string }) {
  const [ouvert, setOuvert] = useState(false);
  
  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }}>
      <div 
        onClick={() => setOuvert(!ouvert)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <p style={{ fontSize: '13px', fontWeight: '600', color: THEME.text, margin: 0 }}>{question}</p>
        <span style={{ fontSize: '12px', color: THEME.accent }}>{ouvert ? '▲' : '▼'}</span>
      </div>
      {ouvert && (
        <p style={{ fontSize: '12px', color: THEME.textLight, margin: '8px 0 0 0', paddingLeft: '12px' }}>
          {reponse}
        </p>
      )}
    </div>
  );
}

// Modal de pause
function ModalPause({ forfaitNom, fraisPause, onConfirm, onClose, THEME }: any) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${THEME.border}`
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: THEME.text }}>
            Suspendre l'abonnement
          </h3>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Êtes-vous sûr de vouloir suspendre l'abonnement à la plateforme ?
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{
            backgroundColor: '#fef9c3',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '13px', color: '#92400e', margin: '0 0 8px 0', fontWeight: '600' }}>
              Pendant la période de suspension :
            </p>
            <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '12px', color: '#92400e' }}>
              <li>Vous serez facturé <strong>{fraisPause} $ par mois</strong></li>
              <li>25% du montant total des frais mensuels</li>
              <li>Facturation mensuelle</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${THEME.border}`,
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '600',
                color: THEME.text,
                cursor: 'pointer'
              }}
            >
              Non
            </button>
            <button
              onClick={onConfirm}
              style={{
                backgroundColor: THEME.warning,
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Oui, je suis sûr
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de confirmation
function ModalConfirmation({ onClose, THEME }: any) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{ padding: '32px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: THEME.text }}>
            Abonnement suspendu
          </h3>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: '0 0 24px 0' }}>
            Votre abonnement a été suspendu avec succès. Vous serez redirigé vers la page Shopify pour approuver les frais.
          </p>
          <button
            onClick={onClose}
            style={{
              backgroundColor: THEME.accent,
              border: 'none',
              borderRadius: '8px',
              padding: '12px 30px',
              fontSize: '14px',
              fontWeight: '700',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Continuer vers Shopify
          </button>
        </div>
      </div>
    </div>
  );
}
