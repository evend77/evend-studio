/**
 * Retours.tsx
 * src/pages/acheteur/Retours.tsx
 * Page des demandes de retour pour l'acheteur - Design harmonisé
 */

import React, { useState } from 'react';

// Types
type StatutRetour = 'en_attente' | 'approuve' | 'refuse' | 'termine';

interface Retour {
  id: string;
  commandeId: string;
  dateDemande: string;
  statut: StatutRetour;
  type: 'retour' | 'echange' | 'remboursement';
  raisons: string[];
  commentaire: string;
  montant: string;
  dateTraitement?: string;
  
  // Détails de la demande (ce que l'acheteur a soumis)
  demandeDetail: {
    articles: Array<{
      nom: string;
      quantite: number;
      prix: string;
    }>;
    raisonPrincipale: string;
    commentaireClient: string;
  };
  
  // Réponse du vendeur (si traité)
  reponseVendeur?: {
    date: string;
    message: string;
    instructions?: string;
    adresseRetour?: string;
    remboursementEffectue?: string;
    suivi?: string;
  };
  
  // Raison du refus (si refusé)
  raisonRefus?: string;
}

// DONNÉES FICTIVES DES RETOURS
const RETOURS_MOCK: Retour[] = [
  {
    id: 'RET-001',
    commandeId: '#1012',
    dateDemande: '12 févr. 2026',
    statut: 'en_attente',
    type: 'retour',
    raisons: ['non_conforme', 'endommage'],
    commentaire: 'Le CD est rayé et ne fonctionne pas correctement.',
    montant: '11,50 $',
    demandeDetail: {
      articles: [
        { nom: '101 70s Hits CD', quantite: 1, prix: '10,00 $' }
      ],
      raisonPrincipale: 'Article non conforme et endommagé',
      commentaireClient: 'Le CD est rayé et ne fonctionne pas correctement.'
    }
  },
  {
    id: 'RET-002',
    commandeId: '#1008',
    dateDemande: '6 janv. 2026',
    statut: 'approuve',
    type: 'remboursement',
    raisons: ['defectueux'],
    commentaire: 'La bougie sent mauvais et ne brûle pas correctement.',
    montant: '34,59 $',
    dateTraitement: '8 janv. 2026',
    demandeDetail: {
      articles: [
        { nom: 'Bougie parfumée vanille', quantite: 1, prix: '15,99 $' },
        { nom: 'Porte-clés métal', quantite: 1, prix: '10,00 $' }
      ],
      raisonPrincipale: 'Produit défectueux',
      commentaireClient: 'La bougie sent mauvais et ne brûle pas correctement.'
    },
    reponseVendeur: {
      date: '8 janv. 2026',
      message: 'Nous acceptons votre demande de remboursement. Le montant sera crédité sous 5-7 jours ouvrables.',
      remboursementEffectue: '34,59 $'
    }
  },
  {
    id: 'RET-003',
    commandeId: '#1005',
    dateDemande: '29 déc. 2025',
    statut: 'refuse',
    type: 'echange',
    raisons: ['change_idee'],
    commentaire: 'Finalement je préfère une autre couleur.',
    montant: '42,50 $',
    dateTraitement: '2 janv. 2026',
    demandeDetail: {
      articles: [
        { nom: 'Écharpe en cachemire', quantite: 1, prix: '29,99 $' },
        { nom: 'Bonnet en laine', quantite: 1, prix: '12,51 $' }
      ],
      raisonPrincipale: "J'ai changé d'idée",
      commentaireClient: 'Finalement je préfère une autre couleur.'
    },
    raisonRefus: 'Les articles en solde ne sont pas échangeables. Veuillez consulter notre politique de retour.'
  },
  {
    id: 'RET-004',
    commandeId: '#1011',
    dateDemande: '20 janv. 2026',
    statut: 'termine',
    type: 'retour',
    raisons: ['mauvaise_taille'],
    commentaire: 'Le bonnet est trop petit.',
    montant: '10,00 $',
    dateTraitement: '22 janv. 2026',
    demandeDetail: {
      articles: [
        { nom: 'Bonnet en laine', quantite: 1, prix: '10,00 $' }
      ],
      raisonPrincipale: 'Mauvaise taille',
      commentaireClient: 'Le bonnet est trop petit.'
    },
    reponseVendeur: {
      date: '22 janv. 2026',
      message: 'Retour accepté. Veuillez nous retourner l\'article à l\'adresse ci-dessous.',
      instructions: 'Emballez l\'article dans son emballage d\'origine et déposez-le dans un point Poste Canada.',
      adresseRetour: '123 rue des Artisans, Montréal, QC H2X 1Y6'
    }
  }
];

// Couleurs
const C = {
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  green: '#10b981',
  greenLight: 'rgba(16,185,129,0.15)',
  yellow: '#f59e0b',
  yellowLight: 'rgba(245,158,11,0.15)',
  red: '#ef4444',
  redLight: 'rgba(239,68,68,0.15)',
  purple: '#8b5cf6',
  purpleLight: 'rgba(139,92,246,0.15)',
  orange: '#f97316',
  orangeLight: 'rgba(249,115,22,0.15)',
  border: 'rgba(255,255,255,0.08)',
  textLight: 'rgba(255,255,255,0.5)',
  cardBg: 'rgba(255,255,255,0.03)',
};

// ============================================================================
// BADGE DE STATUT POUR RETOUR
// ============================================================================
const StatutRetourBadge = ({ statut }: { statut: StatutRetour }) => {
  const config = {
    en_attente: { bg: C.orangeLight, color: C.orange, icon: '⏳', label: 'En attente' },
    approuve: { bg: C.greenLight, color: C.green, icon: '✅', label: 'Approuvé' },
    refuse: { bg: C.redLight, color: C.red, icon: '❌', label: 'Refusé' },
    termine: { bg: C.blueLight, color: C.blue, icon: '📦', label: 'Terminé' },
  };
  const { bg, color, icon, label } = config[statut];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: '20px',
      background: bg,
      color: color,
      border: `1px solid ${color}40`,
    }}>
      {icon} {label}
    </span>
  );
};

// ============================================================================
// POPUP DE DÉTAIL DE RETOUR
// ============================================================================
const RetourDetailPopup = ({ retour, onClose }: { retour: Retour; onClose: () => void }) => {
  
  const ouvrirLitige = () => {
    alert('🚧 Fonctionnalité de litige à venir - sera configurée plus tard');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(5px)',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      
      <div style={{
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#1a1f2e',
        borderRadius: '24px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        {/* En-tête avec dégradé */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${C.border}`,
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                  Demande {retour.id}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  Commande {retour.commandeId} · {retour.dateDemande}
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>
          
          {/* Statut */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: `1px solid ${C.border}`, 
            borderRadius: '12px', 
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: '#fff', fontSize: '14px' }}>Statut de la demande</span>
            <StatutRetourBadge statut={retour.statut} />
          </div>

          {/* Type de demande */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Type de demande
            </h3>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: `1px solid ${C.border}`, 
              borderRadius: '12px', 
              padding: '12px 16px',
              color: '#fff',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {retour.type === 'retour' && '↩️ Retour'}
              {retour.type === 'echange' && '🔄 Échange'}
              {retour.type === 'remboursement' && '💰 Remboursement'}
            </div>
          </div>

          {/* Articles concernés */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Articles concernés
            </h3>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: `1px solid ${C.border}`, 
              borderRadius: '12px', 
              padding: '12px 16px',
            }}>
              {retour.demandeDetail.articles.map((article, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingBottom: index < retour.demandeDetail.articles.length - 1 ? '10px' : '0',
                  marginBottom: index < retour.demandeDetail.articles.length - 1 ? '10px' : '0',
                  borderBottom: index < retour.demandeDetail.articles.length - 1 ? `1px solid ${C.border}` : 'none'
                }}>
                  <span style={{ color: '#fff' }}>{article.nom} (x{article.quantite})</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{article.prix}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Détail de la demande (ce que l'acheteur a envoyé) */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📝 Détail de votre demande
            </h3>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: `1px solid ${C.border}`, 
              borderRadius: '12px', 
              padding: '16px',
            }}>
              <p style={{ margin: '0 0 8px', color: '#fff', fontSize: '14px' }}>
                <strong>Raison principale:</strong> {retour.demandeDetail.raisonPrincipale}
              </p>
              <p style={{ margin: 0, color: C.textLight, fontSize: '13px', lineHeight: '1.6' }}>
                <strong>Commentaire:</strong> {retour.demandeDetail.commentaireClient}
              </p>
            </div>
          </div>

          {/* Réponse du vendeur (si approuvé) */}
          {retour.statut === 'approuve' && retour.reponseVendeur && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ✅ Réponse du vendeur - Approuvé
              </h3>
              <div style={{ 
                background: C.greenLight, 
                border: `1px solid ${C.green}40`, 
                borderRadius: '12px', 
                padding: '16px',
              }}>
                <p style={{ margin: '0 0 8px', color: C.green, fontSize: '13px' }}>
                  <strong>Date:</strong> {retour.reponseVendeur.date}
                </p>
                <p style={{ margin: '0 0 12px', color: '#fff', fontSize: '14px' }}>
                  {retour.reponseVendeur.message}
                </p>
                
                {retour.reponseVendeur.instructions && (
                  <div style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: '8px', 
                    padding: '12px',
                    marginTop: '10px'
                  }}>
                    <p style={{ margin: '0 0 6px', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
                      📋 Instructions:
                    </p>
                    <p style={{ margin: '0 0 8px', color: C.textLight, fontSize: '13px' }}>
                      {retour.reponseVendeur.instructions}
                    </p>
                    {retour.reponseVendeur.adresseRetour && (
                      <p style={{ margin: 0, color: '#fff', fontSize: '13px' }}>
                        <strong>Adresse de retour:</strong> {retour.reponseVendeur.adresseRetour}
                      </p>
                    )}
                  </div>
                )}
                
                {retour.reponseVendeur.remboursementEffectue && (
                  <p style={{ margin: '10px 0 0', color: C.green, fontSize: '14px', fontWeight: 700 }}>
                    💰 Remboursement de {retour.reponseVendeur.remboursementEffectue} effectué
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Réponse du vendeur (si terminé) */}
          {retour.statut === 'termine' && retour.reponseVendeur && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📦 Retour terminé
              </h3>
              <div style={{ 
                background: C.blueLight, 
                border: `1px solid ${C.blue}40`, 
                borderRadius: '12px', 
                padding: '16px',
              }}>
                <p style={{ margin: '0 0 8px', color: '#fff', fontSize: '14px' }}>
                  {retour.reponseVendeur.message}
                </p>
                {retour.reponseVendeur.suivi && (
                  <p style={{ margin: '8px 0 0', color: C.textLight, fontSize: '13px' }}>
                    <strong>Numéro de suivi:</strong> {retour.reponseVendeur.suivi}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Raison du refus (si refusé) */}
          {retour.statut === 'refuse' && retour.raisonRefus && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ❌ Demande refusée
              </h3>
              <div style={{ 
                background: C.redLight, 
                border: `1px solid ${C.red}40`, 
                borderRadius: '12px', 
                padding: '16px',
              }}>
                <p style={{ margin: 0, color: '#fff', fontSize: '14px' }}>
                  {retour.raisonRefus}
                </p>
              </div>
            </div>
          )}

          {/* Bouton Ouvrir un litige (pour les refus ou en attente trop long) */}
          {(retour.statut === 'refuse' || retour.statut === 'en_attente') && (
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={ouvrirLitige}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: C.redLight,
                  border: `1px solid ${C.red}40`,
                  borderRadius: '12px',
                  color: C.red,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                ⚖️ Ouvrir un litige
              </button>
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: C.textLight, textAlign: 'center' }}>
                Cette fonctionnalité sera disponible prochainement
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function Retours({ naviguer }: { naviguer: (page: string, props?: any) => void }) {
  const [retours] = useState<Retour[]>(RETOURS_MOCK);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [retourPopup, setRetourPopup] = useState<Retour | null>(null);

  // Statistiques
  const totalRetours = retours.length;
  const enAttente = retours.filter(r => r.statut === 'en_attente').length;
  const approuves = retours.filter(r => r.statut === 'approuve').length;
  const termines = retours.filter(r => r.statut === 'termine').length;
  const montantTotal = retours.reduce((acc, r) => {
    const montant = parseFloat(r.montant.replace(/[^0-9.]/g, ''));
    return acc + montant;
  }, 0).toFixed(2);

  const retoursFiltres = retours.filter(retour => {
    // Filtre par recherche
    const matchRecherche = 
      retour.id.toLowerCase().includes(recherche.toLowerCase()) ||
      retour.commandeId.toLowerCase().includes(recherche.toLowerCase());
    
    // Filtre par statut
    const matchStatut = filtreStatut === 'tous' || retour.statut === filtreStatut;
    
    return matchRecherche && matchStatut;
  });

  return (
    <>
      <div style={{ animation: 'fadeUp 0.5s ease' }}>
        {/* En-tête avec statistiques - Style harmonisé */}
        <div style={{
          background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <span style={{ fontSize: '40px' }}>🔄</span>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                Demandes de retour
              </h1>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
              Gérez toutes vos demandes de retour, échange et remboursement.
            </p>
            
            {/* Statistiques rapides */}
            <div style={{ display: 'flex', gap: '40px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalRetours}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Total demandes</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{enAttente}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>En attente</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{approuves}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Approuvés</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{montantTotal} $</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Montant total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Filtres par statut */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'tous', label: 'Tous' },
              { id: 'en_attente', label: '⏳ En attente' },
              { id: 'approuve', label: '✅ Approuvé' },
              { id: 'refuse', label: '❌ Refusé' },
              { id: 'termine', label: '📦 Terminé' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltreStatut(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '30px',
                  border: 'none',
                  background: filtreStatut === f.id ? C.orange : 'rgba(255,255,255,0.05)',
                  color: filtreStatut === f.id ? '#fff' : C.textLight,
                  fontSize: '13px',
                  fontWeight: filtreStatut === f.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <input
            type="text"
            placeholder="🔍 Rechercher par ID retour ou commande..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '30px',
              border: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              width: '280px',
            }}
          />
        </div>

        {/* Liste des retours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {retoursFiltres.length === 0 ? (
            <div style={{ 
              padding: '60px', 
              textAlign: 'center', 
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '20px',
              border: `1px dashed ${C.border}`,
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
              <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Aucune demande de retour trouvée</p>
              <p style={{ color: C.textLight, fontSize: '13px' }}>Essayez de modifier vos filtres de recherche</p>
            </div>
          ) : (
            retoursFiltres.map((retour) => (
              <div
                key={retour.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                {/* Info retour */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 
                      retour.statut === 'approuve' ? C.greenLight :
                      retour.statut === 'refuse' ? C.redLight :
                      retour.statut === 'termine' ? C.blueLight :
                      C.orangeLight,
                    border: `1px solid ${
                      retour.statut === 'approuve' ? C.green :
                      retour.statut === 'refuse' ? C.red :
                      retour.statut === 'termine' ? C.blue :
                      C.orange
                    }40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: 
                      retour.statut === 'approuve' ? C.green :
                      retour.statut === 'refuse' ? C.red :
                      retour.statut === 'termine' ? C.blue :
                      C.orange,
                  }}>
                    {retour.type === 'retour' && '↩️'}
                    {retour.type === 'echange' && '🔄'}
                    {retour.type === 'remboursement' && '💰'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                        {retour.id}
                      </span>
                      <StatutRetourBadge statut={retour.statut} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: C.textLight }}>
                        Commande {retour.commandeId}
                      </span>
                      <span style={{ fontSize: '12px', color: C.textLight }}>
                        📅 {retour.dateDemande}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        {retour.montant}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton Voir détail */}
                <button
                  onClick={() => setRetourPopup(retour)}
                  style={{
                    padding: '8px 16px',
                    background: C.orangeLight,
                    border: `1px solid ${C.orange}40`,
                    borderRadius: '8px',
                    color: C.orange,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  👁️ Voir détail
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Popup de détail de retour */}
      {retourPopup && (
        <RetourDetailPopup 
          retour={retourPopup} 
          onClose={() => setRetourPopup(null)} 
        />
      )}
    </>
  );
}
