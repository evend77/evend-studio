/**
 * Commandes.tsx
 * src/pages/acheteur/Commandes.tsx
 * Page des commandes (liste + détail) - Connexion BD + RMA + Factures centralisées
 */

import React, { useState, useEffect } from 'react';
import FacturePopup from '../../components/FacturePopup';

const API = 'https://evend-multivendeur-api.onrender.com';

// Types
type StatutCommande = 'Confirmée' | 'Préparation pour expédition' | 'Expédiée' | 'Livrée' | 'Annulée' | 'Attente approbation' | 'En attente de paiement' | 'Paiement reçu' | 'Acceptée' | 'En traitement' | 'Traitée' | 'Refusée' | 'Partiellement livrée' | 'Remboursée' | 'En cours de livraison';

interface EvenementHistorique {
  date: string;
  statut: string;
  description: string;
  etape: string;
}

interface Commande {
  id: number;
  commande_id: string;
  statut: StatutCommande;
  date: string;
  total: string;
  montant: number;
  articles: any;
  produits?: any;
  destinataire?: string;
  adresseLivraison?: any;
  adresseFacturation?: any;
  nomClient?: string;
  emailClient?: string;
  modeExpedition?: string;
  numeroSuivi?: string;
  transporteur?: string;
  statutLivraison?: string;
  dateExpedition?: string;
  dateLivraisonPrevue?: string;
  historiqueSuivi?: Array<{ date: string; statut: string; lieu?: string }>;
  historique_suivi?: EvenementHistorique[];
  sousTotal?: number;
  fraisExpedition?: number;
  tps?: number;
  tvq?: number;
  tvh?: number;
  pourboire?: number;
  totalFinal?: number;
  numeroFacture?: string;
  methodePaiement?: string;
  noteCommande?: string;
  vendeur_id: number;
  vendeur_nom?: string;
  vendeur_boutique?: string;
  // Champs BD
  statut_commande?: string;
  statut_paiement?: string;
  statut_acceptation?: string;
  etape_traitement?: string;
  etape_livraison?: string;
  raison_annulation?: string;
  annule_par?: string;
  url_suivi?: string;
}

// Liste des raisons pour retour/échange/remboursement
const RAISONS_RETOUR = [
  { id: 'non_recu', label: '📭 Article non reçu' },
  { id: 'non_conforme', label: '❌ Non conforme à la description' },
  { id: 'endommage', label: '💔 Arrivé endommagé' },
  { id: 'pieces_manquantes', label: '🧩 Pièces manquantes' },
  { id: 'change_idee', label: '🤔 J\'ai changé d\'idée' },
  { id: 'erreur_commande', label: '⚠️ Erreur de commande' },
  { id: 'mauvaise_taille', label: '📏 Mauvaise taille' },
  { id: 'defectueux', label: '🔧 Produit défectueux' },
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
  accent: '#2d6a9f',
  accentLight: '#e8f2fb',
};

// ============================================================================
// ÉTAPES DE SUIVI COMPLÈTES (Traitement + Livraison)
// ============================================================================
const ETAPES_TRAITEMENT = [
  { key: 'creee', emoji: '🛒', label: 'Commande reçue', phase: 'traitement', couleur: '#3b82f6' },
  { key: 'payee', emoji: '💳', label: 'Paiement confirmé', phase: 'traitement', couleur: '#3b82f6' },
  { key: 'acceptee', emoji: '✅', label: 'Acceptée', phase: 'traitement', couleur: '#10b981' },
  { key: 'traitement', emoji: '⚙️', label: 'Préparation', phase: 'traitement', couleur: '#f59e0b' },
  { key: 'emballage', emoji: '📦', label: 'Emballage', phase: 'traitement', couleur: '#f59e0b' },
  { key: 'pret_expedition', emoji: '📮', label: 'Prête à expédier', phase: 'traitement', couleur: '#f97316' },
];

const ETAPES_LIVRAISON = [
  { key: 'etiquette_creer', emoji: '🏷️', label: 'Étiquette créée', phase: 'livraison', couleur: '#f97316' },
  { key: 'expediee', emoji: '🚚', label: 'Expédiée', phase: 'livraison', couleur: '#f97316' },
  { key: 'transit', emoji: '🚛', label: 'En transit', phase: 'livraison', couleur: '#f97316' },
  { key: 'tri', emoji: '🏢', label: 'Centre de tri', phase: 'livraison', couleur: '#f97316' },
  { key: 'livraison', emoji: '🛣️', label: 'En cours de livraison', phase: 'livraison', couleur: '#f97316' },
  { key: 'livree', emoji: '🏠', label: 'Livrée', phase: 'livraison', couleur: '#10b981' },
];

const ETAPE_ANNULATION = { key: 'annulee', emoji: '❌', label: 'Annulée', phase: 'annulation', couleur: '#ef4444' };

// Toutes les étapes dans l'ordre chronologique
const TOUTES_ETAPES = [
  ...ETAPES_TRAITEMENT,
  ...ETAPES_LIVRAISON,
];

// ============================================================================
// FONCTION CORRIGÉE POUR DÉTERMINER L'ÉTAPE ACTIVE
// ============================================================================
function getEtapeActive(commande: Commande): string {
  // Debug
  console.log('🔍 getEtapeActive - commande:', {
    id: commande.id,
    statut_acceptation: commande.statut_acceptation,
    statut_paiement: commande.statut_paiement,
    etape_traitement: commande.etape_traitement,
    etape_livraison: commande.etape_livraison,
    statut_commande: commande.statut_commande,
  });

  // 1. Annulation
  const estAnnulee = commande.statut_paiement === 'voided' || 
                      commande.statut_paiement === 'cancelled' ||
                      (commande.raison_annulation && commande.raison_annulation !== '') ||
                      (commande.annule_par && commande.annule_par !== '');
  
  if (estAnnulee) {
    return 'annulee';
  }
  
  // 2. Refus
  if (commande.statut_acceptation === 'Rejected') {
    return 'refusee';
  }
  
  // 3. PRIORITÉ 1: Vérifier l'étape de livraison (la plus avancée)
  if (commande.etape_livraison && commande.etape_livraison !== 'creee' && commande.etape_livraison !== '') {
    console.log('📦 Étape livraison trouvée:', commande.etape_livraison);
    return commande.etape_livraison;
  }
  
  // 4. PRIORITÉ 2: Vérifier l'étape de traitement
  if (commande.etape_traitement && commande.etape_traitement !== 'creee' && commande.etape_traitement !== '') {
    console.log('⚙️ Étape traitement trouvée:', commande.etape_traitement);
    return commande.etape_traitement;
  }
  
  // 5. Statut acceptation
  if (commande.statut_acceptation === 'Accepted') {
    return 'acceptee';
  }
  
  // 6. Paiement reçu
  if (commande.statut_paiement === 'Paid') {
    return 'payee';
  }
  
  return 'creee';
}

// ============================================================================
// COMPOSANT DE SUIVI DE COMMANDE AVEC TIMELINE COMPLÈTE
// ============================================================================
const SuiviCommande = ({ commande }: { commande: Commande }) => {
  const etapeActive = getEtapeActive(commande);
  const estAnnulee = etapeActive === 'annulee' || etapeActive === 'refusee';
  
  // Trouver l'index de l'étape active
  let indexActif = TOUTES_ETAPES.findIndex(e => e.key === etapeActive);
  
  // Si l'étape n'est pas trouvée, mettre par défaut
  if (indexActif === -1) {
    indexActif = 0;
  }
  
  // Si la commande est annulée, l'étape d'annulation remplace l'étape où l'annulation est survenue
  const etapesAAfficher = estAnnulee 
    ? [...TOUTES_ETAPES.slice(0, indexActif + 1), ETAPE_ANNULATION]
    : TOUTES_ETAPES;
  
  // Dans le cas d'une annulation, l'étape active est la dernière
  const indexActifAnnulation = estAnnulee ? etapesAAfficher.length - 1 : indexActif;
  
  // Trouver la couleur de l'étape active
  const etapeCourante = etapesAAfficher[indexActifAnnulation];
  const couleurActive = estAnnulee ? '#ef4444' : (etapeCourante?.couleur || '#3b82f6');
  
  // S'assurer que historique_suivi existe
  const historique = commande.historique_suivi || [];
  
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 28px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>🗺️ Suivi de la commande</h3>

      <div style={{ position: 'relative', paddingBottom: '8px', overflowX: 'auto' }}>
        {/* Ligne arrière-plan */}
        <div style={{ 
          position: 'absolute', 
          top: '22px', 
          left: '40px', 
          right: '40px', 
          height: '3px', 
          background: 'rgba(255,255,255,0.08)', 
          borderRadius: '2px' 
        }} />
        
        {/* Ligne progression - CORRIGÉE */}
        {indexActifAnnulation > 0 && (
          <div style={{
            position: 'absolute',
            top: '22px',
            left: '40px',
            width: `calc(${(indexActifAnnulation / (etapesAAfficher.length - 1)) * 100}% - 40px)`,
            height: '3px',
            background: estAnnulee ? `linear-gradient(90deg, #3b82f6, #ef4444)` : `linear-gradient(90deg, #3b82f6, ${couleurActive})`,
            borderRadius: '2px',
            transition: 'width 0.8s ease',
            zIndex: 1,
          }} />
        )}

        {/* Étapes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', minWidth: `${Math.max(etapesAAfficher.length * 100, 600)}px`, position: 'relative', zIndex: 2 }}>
          {etapesAAfficher.map((etape, index) => {
            const passee = index < indexActifAnnulation;
            const courante = index === indexActifAnnulation;
            const future = index > indexActifAnnulation;
            const col = etape.couleur || '#3b82f6';
            
            return (
              <div key={etape.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', opacity: future ? 0.3 : 1, flex: 1 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: passee || courante ? col : 'rgba(255,255,255,0.05)',
                  border: courante ? `3px solid ${col}` : passee ? `2px solid ${col}` : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: courante ? '20px' : '16px',
                  boxShadow: courante ? `0 0 20px ${col}60` : 'none',
                  position: 'relative',
                  zIndex: 2,
                  transition: 'all 0.3s',
                }}>
                  {passee ? '✓' : etape.emoji}
                  {courante && (
                    <div style={{ position: 'absolute', inset: '-7px', borderRadius: '50%', border: `2px solid ${col}40`, animation: 'suiviPulse 2s infinite' }} />
                  )}
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '10px', 
                  fontWeight: courante ? 700 : 500, 
                  color: courante ? col : passee ? '#fff' : 'rgba(255,255,255,0.5)', 
                  textAlign: 'center', 
                  lineHeight: '1.3',
                  maxWidth: '70px'
                }}>
                  {etape.label}
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: '8px', 
                  color: 'rgba(255,255,255,0.3)',
                  textAlign: 'center'
                }}>
                  {etape.phase === 'traitement' ? 'Vendeur' : etape.phase === 'livraison' ? 'Transporteur' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message état actuel */}
      <div style={{ 
        marginTop: '24px', 
        padding: '14px 18px', 
        borderRadius: '12px', 
        background: estAnnulee ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', 
        border: `1px solid ${estAnnulee ? '#ef4444' : '#3b82f6'}30`, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px' 
      }}>
        <span style={{ fontSize: '22px' }}>{etapeCourante?.emoji || '📦'}</span>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#fff' }}>{etapeCourante?.label || 'En traitement'}</p>
          {(commande as any).raison_annulation && (
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Raison : {(commande as any).raison_annulation}
              {(commande as any).annule_par && ` · Par : ${(commande as any).annule_par}`}
            </p>
          )}
        </div>
      </div>

      {/* Infos de suivi - Afficher si la commande est expédiée */}
      {(commande.numeroSuivi || commande.transporteur || commande.url_suivi) && (
        <div style={{ 
          marginTop: '14px', 
          padding: '14px 18px', 
          borderRadius: '12px', 
          background: 'rgba(249,115,22,0.08)', 
          border: '1px solid rgba(249,115,22,0.2)', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '16px' 
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transporteur</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              {commande.transporteur || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>N° de suivi</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#f97316' }}>
              {commande.numeroSuivi || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lien de suivi</p>
            {commande.url_suivi ? (
              <a href={commande.url_suivi} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '4px 10px', background: '#f97316', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
                🔗 Ouvrir →
              </a>
            ) : (
              <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#fff' }}>N/A</p>
            )}
          </div>
        </div>
      )}

      {/* Timeline détaillée avec historique */}
      {historique.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: `1px solid ${C.border}`, paddingTop: '20px' }}>
          <p style={{ fontSize: '12px', color: C.textLight, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📜 Détail des étapes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historique.map((event, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', marginTop: '6px' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{event.statut}</p>
                  <p style={{ margin: '2px 0', fontSize: '11px', color: C.textLight }}>{event.description}</p>
                  <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(event.date).toLocaleString('fr-CA', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes suiviPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// FONCTION POUR OBTENIR LE STATUT AFFICHABLE À PARTIR DES CHAMPS BD
// ============================================================================
const getStatutAffichable = (commande: any): StatutCommande => {
  // 1. Annulation
  if (commande.statut_paiement === 'voided' || 
      commande.statut_paiement === 'cancelled' ||
      (commande.raison_annulation && commande.raison_annulation !== '') || 
      (commande.annule_par && commande.annule_par !== '')) {
    return 'Annulée';
  }
  
  // 2. Remboursement
  if (commande.statut_paiement === 'refunded') {
    return 'Remboursée';
  }
  
  // 3. Refus
  if (commande.statut_acceptation === 'Rejected') {
    return 'Refusée';
  }
  
  // 4. Vérifier l'étape de livraison (PRIORITÉ)
  const etapeLivraison = commande.etape_livraison?.toLowerCase();
  if (etapeLivraison && etapeLivraison !== 'creee') {
    switch (etapeLivraison) {
      case 'livree':
        return 'Livrée';
      case 'livraison':
        return 'En cours de livraison';
      case 'transit':
      case 'expediee':
        return 'Expédiée';
      case 'tri':
        return 'Expédiée';
      case 'etiquette_creer':
        return 'Préparation pour expédition';
    }
  }
  
  // 5. Vérifier l'étape de traitement
  const etapeTraitement = commande.etape_traitement?.toLowerCase();
  if (etapeTraitement) {
    switch (etapeTraitement) {
      case 'pret_expedition':
        return 'Préparation pour expédition';
      case 'emballage':
        return 'Préparation pour expédition';
      case 'traitement':
        return 'En traitement';
      case 'acceptee':
        return 'Acceptée';
      case 'payee':
        return 'Paiement reçu';
      case 'creee':
        if (commande.statut_paiement === 'pending') {
          return 'En attente de paiement';
        }
        return 'Confirmée';
    }
  }
  
  // 6. Statut acceptation
  if (commande.statut_acceptation === 'Accepted') {
    return 'Acceptée';
  }
  
  // 7. Fallback sur statut_commande
  switch (commande.statut_commande) {
    case 'Fulfilled':
      return 'Livrée';
    case 'Unfulfilled':
      return 'En traitement';
    case 'Partially Fulfilled':
      return 'Partiellement livrée';
  }
  
  // 8. Vérifier le statut de paiement
  switch (commande.statut_paiement) {
    case 'Paid':
      return 'Paiement reçu';
    case 'pending':
      return 'En attente de paiement';
  }
  
  // 9. Vérifier le statut d'acceptation
  if (commande.statut_acceptation === 'Pending') {
    return 'Attente approbation';
  }
  
  return 'Confirmée';
};

// ============================================================================
// BADGE DE STATUT
// ============================================================================
const StatutBadge = ({ commande }: { commande: any }) => {
  const statut = getStatutAffichable(commande);
  
  const config: Record<string, { bg: string; color: string; icon: string }> = {
    'Confirmée': { bg: C.blueLight, color: C.blue, icon: '✅' },
    'En attente de paiement': { bg: C.yellowLight, color: C.yellow, icon: '⏳' },
    'Paiement reçu': { bg: C.blueLight, color: C.blue, icon: '💳' },
    'Acceptée': { bg: C.blueLight, color: C.blue, icon: '✅' },
    'En traitement': { bg: C.yellowLight, color: C.yellow, icon: '⚙️' },
    'Préparation pour expédition': { bg: C.purpleLight, color: C.purple, icon: '📦' },
    'Expédiée': { bg: C.purpleLight, color: C.purple, icon: '🚚' },
    'En cours de livraison': { bg: C.orangeLight, color: C.orange, icon: '🛣️' },
    'Livrée': { bg: C.greenLight, color: C.green, icon: '✅' },
    'Annulée': { bg: C.redLight, color: C.red, icon: '❌' },
    'Refusée': { bg: C.redLight, color: C.red, icon: '❌' },
    'Partiellement livrée': { bg: C.orangeLight, color: C.orange, icon: '📦' },
    'Attente approbation': { bg: C.purpleLight, color: C.purple, icon: '⏳' },
    'Remboursée': { bg: C.greenLight, color: C.green, icon: '💰' },
  };
  
  const { bg, color, icon } = config[statut] || config['Confirmée'];

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
      {icon} {statut}
    </span>
  );
};

// ============================================================================
// MODAL DE RETOUR
// ============================================================================
const ModalRetour = ({ commande, onClose, onConfirm }: { commande: Commande; onClose: () => void; onConfirm: (data: any) => void }) => {
  const [type, setType] = useState<'retour' | 'echange' | 'remboursement'>('retour');
  const [raisons, setRaisons] = useState<string[]>([]);
  const [commentaire, setCommentaire] = useState('');
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const toggleRaison = (id: string) => {
    if (raisons.includes(id)) {
      setRaisons(raisons.filter(r => r !== id));
    } else {
      setRaisons([...raisons, id]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nouveauxFichiers = Array.from(e.target.files);
      setFichiers(prev => [...prev, ...nouveauxFichiers]);
    }
  };

  const retirerFichier = (index: number) => {
    setFichiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (raisons.length === 0) {
      alert('Veuillez sélectionner au moins une raison');
      return;
    }

    setEnvoiEnCours(true);

    try {
      const formData = new FormData();
      fichiers.forEach((file) => {
        formData.append('files', file);
      });

      const uploadResponse = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      let fichiersUploades = [];
      if (uploadResponse.ok) {
        fichiersUploades = await uploadResponse.json();
      }

      const response = await fetch(`${API}/api/commandes/${commande.id}/rma`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type_demande: type,
          raisons: raisons,
          commentaire: commentaire,
          fichiers: fichiersUploades
        })
      });

      if (response.ok) {
        const data = await response.json();
        onConfirm(data);
      } else {
        alert('Erreur lors de la soumission de la demande');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setEnvoiEnCours(false);
    }
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#1a1f2e',
        borderRadius: '24px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${C.border}`,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>
              Demande pour {commande.commande_id || commande.id}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              Type de demande <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'retour', label: '↩️ Retour' },
                { id: 'echange', label: '🔄 Échange' },
                { id: 'remboursement', label: '💰 Remboursement' },
              ].map(option => (
                <div
                  key={option.id}
                  onClick={() => setType(option.id as any)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    borderRadius: '12px',
                    background: type === option.id ? `${C.blue}25` : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${type === option.id ? C.blue : 'transparent'}`,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '16px', color: '#fff' }}>{option.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              Raison(s) <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '12px', 
              padding: '8px',
              maxHeight: '240px',
              overflowY: 'auto',
            }}>
              {RAISONS_RETOUR.map(raison => (
                <label
                  key={raison.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: raisons.includes(raison.id) ? `${C.blue}20` : 'transparent',
                    cursor: 'pointer',
                    marginBottom: '4px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={raisons.includes(raison.id)}
                    onChange={() => toggleRaison(raison.id)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ color: '#fff', fontSize: '13px' }}>{raison.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              Commentaire (optionnel)
            </label>
            <textarea
              placeholder="Dites-nous en plus..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
                resize: 'vertical',
                minHeight: '80px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              Photos (optionnel)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                color: '#fff',
              }}
            />
            {fichiers.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                {fichiers.map((file, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontSize: '12px' }}>📷 {file.name}</span>
                    <button onClick={() => retirerFichier(index)} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }} disabled={envoiEnCours}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={raisons.length === 0 || envoiEnCours} style={{ flex: 1, padding: '14px', background: raisons.length === 0 || envoiEnCours ? 'rgba(59,130,246,0.3)' : `linear-gradient(135deg, ${C.blue}, #1e40af)`, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: raisons.length === 0 || envoiEnCours ? 'not-allowed' : 'pointer' }}>
              {envoiEnCours ? '⏳ Envoi...' : 'Soumettre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT DÉTAIL
// ============================================================================
const CommandeDetail = ({ commande, onBack, onOuvrirRetour, onOuvrirFacture }: { commande: Commande; onBack: () => void; onOuvrirRetour: () => void; onOuvrirFacture: () => void }) => {
  
  const getArticlesArray = () => {
    let articlesArray: any[] = [];
    try {
      if (Array.isArray(commande.articles)) {
        articlesArray = commande.articles;
      } else if (typeof commande.articles === 'string') {
        articlesArray = JSON.parse(commande.articles);
      } else if (commande.articles && typeof commande.articles === 'object') {
        articlesArray = [commande.articles];
      } else if (commande.produits) {
        if (Array.isArray(commande.produits)) {
          articlesArray = commande.produits;
        } else if (typeof commande.produits === 'string') {
          articlesArray = JSON.parse(commande.produits);
        } else if (typeof commande.produits === 'object') {
          articlesArray = [commande.produits];
        }
      }
    } catch (e) {
      articlesArray = [];
    }
    
    if (articlesArray.length === 0) {
      articlesArray = [{ nom: 'Produit', quantite: 1, prix: commande.total }];
    }
    
    return articlesArray;
  };

  const articlesArray = getArticlesArray();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Retour
        </button>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onOuvrirFacture} style={{ padding: '8px 16px', background: C.blueLight, border: `1px solid ${C.blue}40`, borderRadius: '8px', color: C.blue, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            🖨️ Voir facture
          </button>
          
          {getStatutAffichable(commande) !== 'Annulée' && getStatutAffichable(commande) !== 'Attente approbation' && (
            <button onClick={onOuvrirRetour} style={{ padding: '8px 16px', background: C.yellowLight, border: `1px solid ${C.yellow}40`, borderRadius: '8px', color: C.yellow, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔄 Demander retour
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: '#fff' }}>
          {commande.commande_id || commande.id}
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: C.textLight }}>
          {commande.date}
        </p>
      </div>

      {/* Suivi visuel - Timeline complète avec gestion d'annulation */}
      <SuiviCommande commande={{
        ...commande,
        etape_livraison: commande.etape_livraison,
        numeroSuivi: commande.numeroSuivi,
        transporteur: commande.transporteur,
        url_suivi: commande.url_suivi,
        historique_suivi: commande.historique_suivi || []
      }} />

      {/* Grille principale - 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Colonne gauche */}
        <div>
          {/* Articles commandés */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>🛒 Articles commandés</h3>
            
            {articlesArray.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '12px', marginBottom: '12px', borderBottom: i < articlesArray.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', overflow: 'hidden', flexShrink: 0 }}>
                  {a.image
                    ? <img src={a.image} alt={a.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                    : '📦'
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>{a.nom || a.nom_produit || 'Produit'}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>Qté: {a.quantite || 1} · {a.prix ? `${parseFloat(a.prix).toFixed(2)} $` : ''}</p>
                </div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  {a.sous_total ? `${parseFloat(a.sous_total).toFixed(2)} $` : (a.prix ? `${(parseFloat(a.prix) * (a.quantite || 1)).toFixed(2)} $` : '')}
                </p>
              </div>
            ))}
          </div>

          {/* Détails financiers */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>💰 Détails financiers</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight, fontSize: '13px' }}>Sous-total</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>
                  {commande.sousTotal ? `${commande.sousTotal.toFixed(2)} $` : 
                   commande.montant ? `${commande.montant.toFixed(2)} $` : commande.total}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.textLight, fontSize: '13px' }}>Frais d'expédition</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>
                  {commande.fraisExpedition ? `${commande.fraisExpedition.toFixed(2)} $` : 
                   (commande as any).frais_expedition ? `${parseFloat((commande as any).frais_expedition).toFixed(2)} $` : '0.00 $'}
                </span>
              </div>

              <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', marginTop: '8px' }}>
                  <span style={{ color: C.textLight, fontSize: '12px' }}>TPS (5%)</span>
                  <span style={{ color: '#fff', fontSize: '12px' }}>
                    {commande.tps ? `${commande.tps.toFixed(2)} $` : 
                     (commande as any).tps ? `${parseFloat((commande as any).tps).toFixed(2)} $` : '0.00 $'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: C.textLight, fontSize: '12px' }}>TVQ (9.975%)</span>
                  <span style={{ color: '#fff', fontSize: '12px' }}>
                    {commande.tvq ? `${commande.tvq.toFixed(2)} $` : 
                     (commande as any).tvq ? `${parseFloat((commande as any).tvq).toFixed(2)} $` : '0.00 $'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: C.textLight, fontSize: '12px' }}>TVH</span>
                  <span style={{ color: '#fff', fontSize: '12px' }}>
                    {commande.tvh ? `${commande.tvh.toFixed(2)} $` : 
                     (commande as any).tvh ? `${parseFloat((commande as any).tvh).toFixed(2)} $` : '0.00 $'}
                  </span>
                </div>
                {(commande.pourboire && commande.pourboire > 0) || ((commande as any).pourboire > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: C.textLight, fontSize: '12px' }}>💝 Pourboire</span>
                    <span style={{ color: C.green, fontSize: '12px', fontWeight: 600 }}>
                      {commande.pourboire ? `${commande.pourboire.toFixed(2)} $` : 
                       (commande as any).pourboire ? `${parseFloat((commande as any).pourboire).toFixed(2)} $` : '0.00 $'}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '12px', borderTop: `1px solid ${C.border}` }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Total</span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px' }}>{commande.total}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: C.textLight }}>Mode de paiement</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#fff' }}>{commande.methodePaiement || 'Carte de crédit'}</p>
            </div>

            <button 
              onClick={() => alert('Acheter à nouveau - simulation')}
              style={{ width: '100%', marginTop: '20px', padding: '14px', background: `linear-gradient(135deg, ${C.green}, #0f7b5c)`, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              🛒 Acheter à nouveau
            </button>
          </div>
        </div>

        {/* Colonne droite — Adresses */}
        <div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '20px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>📍 Adresses</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚚 Livraison</p>
              {commande.adresseLivraison ? (
                <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6' }}>
                  <p style={{ margin: 0 }}>{commande.adresseLivraison.nom || 'Nom non spécifié'}</p>
                  <p style={{ margin: 0 }}>{commande.adresseLivraison.ligne1 || ''}</p>
                  {commande.adresseLivraison.ligne2 && <p style={{ margin: 0 }}>{commande.adresseLivraison.ligne2}</p>}
                  <p style={{ margin: 0 }}>
                    {commande.adresseLivraison.ville || ''}{commande.adresseLivraison.ville ? ', ' : ''}
                    {commande.adresseLivraison.province || ''} {commande.adresseLivraison.code_postal || ''}
                  </p>
                  <p style={{ margin: 0 }}>{commande.adresseLivraison.pays || ''}</p>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Non spécifiée</p>
              )}
            </div>
            
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🧾 Facturation</p>
              {commande.adresseFacturation ? (
                <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6' }}>
                  <p style={{ margin: 0 }}>{commande.adresseFacturation.nom || 'Nom non spécifié'}</p>
                  <p style={{ margin: 0 }}>{commande.adresseFacturation.ligne1 || ''}</p>
                  {commande.adresseFacturation.ligne2 && <p style={{ margin: 0 }}>{commande.adresseFacturation.ligne2}</p>}
                  <p style={{ margin: 0 }}>
                    {commande.adresseFacturation.ville || ''}{commande.adresseFacturation.ville ? ', ' : ''}
                    {commande.adresseFacturation.province || ''} {commande.adresseFacturation.code_postal || ''}
                  </p>
                  <p style={{ margin: 0 }}>{commande.adresseFacturation.pays || ''}</p>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Non spécifiée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MENU 3 POINTS
// ============================================================================
const ActionMenu = ({ commande, onAction }: { commande: Commande; onAction: (action: string) => void }) => {
  const [ouvert, setOuvert] = useState(false);
  const statutAffichable = getStatutAffichable(commande);
  
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOuvert(!ouvert)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>⋮</button>
      {ouvert && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOuvert(false)} />
          <div style={{ position: 'absolute', right: 0, top: '40px', background: '#1a1f2e', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '8px', minWidth: '180px', zIndex: 100 }}>
            <button onClick={() => { onAction('detail'); setOuvert(false); }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderRadius: '8px', color: '#fff', textAlign: 'left', cursor: 'pointer' }}>👁️ Voir détails</button>
            {statutAffichable !== 'Annulée' && statutAffichable !== 'Attente approbation' && (
              <button onClick={() => { onAction('retour'); setOuvert(false); }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderRadius: '8px', color: '#fff', textAlign: 'left', cursor: 'pointer' }}>🔄 Retour/échange</button>
            )}
            <button onClick={() => { onAction('facture'); setOuvert(false); }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderRadius: '8px', color: '#fff', textAlign: 'left', cursor: 'pointer' }}>📄 Facture</button>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function Commandes({ page, commande, onBack, naviguer}: any) {
  const [filtre, setFiltre] = useState('toutes');
  const [commandesData, setCommandesData] = useState<Commande[]>([]);
  const [recherche, setRecherche] = useState('');
  const [modalRetourOuvert, setModalRetourOuvert] = useState(false);
  const [facturePopupOuvert, setFacturePopupOuvert] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchCommandes = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API}/api/acheteurs/${user.id}/commandes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Données brutes commandes:', data);
          console.log('🔍 etape_livraison première commande:', data[0]?.etape_livraison);
          console.log('🔍 numero_suivi première commande:', data[0]?.numero_suivi);
          
          const mapped = data.map((c: any) => {
            const statutCalcule = getStatutAffichable(c);
            
            // Parser historique_suivi
            let historiqueSuivi = [];
            try {
              if (c.historique_suivi) {
                historiqueSuivi = typeof c.historique_suivi === 'string' 
                  ? JSON.parse(c.historique_suivi) 
                  : c.historique_suivi;
              }
            } catch (e) {
              historiqueSuivi = [];
            }
            
            return {
              ...c,
              id: Number(c.id),
              commande_id: c.numero_commande || c.commande_id || String(c.id),
              date: c.date_commande ? new Date(c.date_commande).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
              total: `${parseFloat(c.montant || c.total || 0).toFixed(2)} $`,
              montant: parseFloat(c.montant || c.total || 0),
              // ⚠️ CHAMPS CRITIQUES POUR LE SUIVI
              numeroSuivi: c.numero_suivi,
              transporteur: c.transporteur,
              url_suivi: c.url_suivi,
              etape_livraison: c.etape_livraison,
              statut_acceptation: c.statut_acceptation,
              statut_paiement: c.statut_paiement,
              statut_commande: c.statut_commande,
              produits: c.produits,
              adresseLivraison: c.adresse_livraison,
              adresseFacturation: c.adresse_facturation,
              sousTotal: c.sous_total ? parseFloat(c.sous_total) : null,
              fraisExpedition: c.frais_expedition ? parseFloat(c.frais_expedition) : null,
              tps: c.tps ? parseFloat(c.tps) : null,
              tvq: c.tvq ? parseFloat(c.tvq) : null,
              tvh: c.tvh ? parseFloat(c.tvh) : null,
              pourboire: c.pourboire ? parseFloat(c.pourboire) : null,
              statut: statutCalcule,
              historique_suivi: historiqueSuivi,
            };
          });
          
          setCommandesData(mapped);
          console.log('📦 Commandes chargées (mappées):', mapped);
        } else {
          console.error('Erreur chargement commandes:', response.status);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommandes();
  }, [user?.id, token]);

  const totalCommandes = commandesData.length;
  const commandesEnCours = commandesData.filter(c => 
    c.statut !== 'Livrée' && c.statut !== 'Annulée' && c.statut !== 'Attente approbation' && c.statut !== 'Refusée'
  ).length;
  const commandesLivrees = commandesData.filter(c => c.statut === 'Livrée').length;
  const commandesAnnulees = commandesData.filter(c => c.statut === 'Annulée' || c.statut === 'Refusée').length;
  const commandesAttente = commandesData.filter(c => c.statut === 'Attente approbation').length;

  const ouvrirModalRetour = (cmd: Commande) => {
    setCommandeSelectionnee(cmd);
    setModalRetourOuvert(true);
  };

  const ouvrirFacturePopup = (cmd: Commande) => {
    setCommandeSelectionnee(cmd);
    setFacturePopupOuvert(true);
  };

  const fermerPopup = () => {
    setModalRetourOuvert(false);
    setFacturePopupOuvert(false);
    setCommandeSelectionnee(null);
  };

  const confirmerRetour = async (data: any) => {
    const response = await fetch(`${API}/api/acheteurs/${user.id}/commandes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      const newData = await response.json();
      const mapped = newData.map((c: any) => ({
        ...c,
        commande_id: c.numero_commande || c.commande_id || String(c.id),
        date: c.date_commande ? new Date(c.date_commande).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
        total: `${parseFloat(c.montant || c.total || 0).toFixed(2)} $`,
        montant: parseFloat(c.montant || c.total || 0),
        produits: c.produits,
        statut: getStatutAffichable(c),
      }));
      setCommandesData(mapped);
    }
    
    alert(`Demande de ${data.type_demande} soumise avec succès!`);
    fermerPopup();
  };

  if (page === 'commande-detail' && commande) {
    // Récupérer la commande complète depuis commandesData pour avoir l'historique
    const commandeComplete = commandesData.find(c => c.id === commande.id) || commande;
    
    return (
      <>
        <CommandeDetail 
          commande={commandeComplete} 
          onBack={onBack} 
          onOuvrirRetour={() => ouvrirModalRetour(commandeComplete)}
          onOuvrirFacture={() => ouvrirFacturePopup(commandeComplete)}
        />
        {modalRetourOuvert && commandeSelectionnee && (
          <ModalRetour 
            commande={commandeSelectionnee} 
            onClose={fermerPopup} 
            onConfirm={confirmerRetour} 
          />
        )}
        {facturePopupOuvert && commandeSelectionnee && (
          <FacturePopup 
            commandeId={commandeSelectionnee.id}
            onClose={fermerPopup} 
          />
        )}
      </>
    );
  }

  const commandesFiltrees = commandesData.filter((cmd: Commande) => {
    const matchRecherche = 
      (cmd.commande_id?.toLowerCase() || '').includes(recherche.toLowerCase()) ||
      (cmd.destinataire?.toLowerCase() || '').includes(recherche.toLowerCase());

    if (filtre === 'en-cours') {
      return cmd.statut !== 'Livrée' && cmd.statut !== 'Annulée' && cmd.statut !== 'Attente approbation' && cmd.statut !== 'Refusée' && matchRecherche;
    }
    if (filtre === 'livrees') {
      return cmd.statut === 'Livrée' && matchRecherche;
    }
    if (filtre === 'annulees') {
      return (cmd.statut === 'Annulée' || cmd.statut === 'Refusée') && matchRecherche;
    }
    if (filtre === 'attente') {
      return cmd.statut === 'Attente approbation' && matchRecherche;
    }
    return matchRecherche;
  });

  const getNombreArticles = (cmd: Commande): number => {
    const produits = (cmd as any).produits;
    if (!produits) return 0;
    if (Array.isArray(produits)) return produits.length;
    if (typeof produits === 'string') {
      try {
        const parsed = JSON.parse(produits);
        return Array.isArray(parsed) ? parsed.length : 1;
      } catch (e) {
        return 1;
      }
    }
    if (produits && typeof produits === 'object') return 1;
    return 0;
  };

  return (
    <>
      <div style={{ animation: 'fadeUp 0.5s ease' }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
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
              <span style={{ fontSize: '40px' }}>📦</span>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                Mes commandes
              </h1>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '500px' }}>
              Suivez et gérez toutes vos commandes en un coup d'œil.
            </p>
            
            {loading ? (
              <div style={{ display: 'flex', gap: '40px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>...</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Chargement</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '40px' }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{totalCommandes}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Total</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{commandesEnCours}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>En cours</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{commandesLivrees}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Livrées</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{commandesAnnulees}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Annulées</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{commandesAttente}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Attente</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'toutes', label: 'Toutes' },
              { id: 'en-cours', label: 'En cours' },
              { id: 'livrees', label: 'Livrées' },
              { id: 'annulees', label: 'Annulées' },
              { id: 'attente', label: '⏳ Attente' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltre(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '30px',
                  border: 'none',
                  background: filtre === f.id ? C.blue : 'rgba(255,255,255,0.05)',
                  color: filtre === f.id ? '#fff' : C.textLight,
                  fontSize: '13px',
                  fontWeight: filtre === f.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="🔍 Rechercher une commande..."
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
              width: '250px',
            }}
          />
        </div>

        {loading ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
          }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: C.textLight }}>Chargement de vos commandes...</p>
          </div>
        ) : commandesFiltrees.length === 0 ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '20px',
            border: `1px dashed ${C.border}`,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📭</div>
            <p style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Aucune commande trouvée</p>
            <p style={{ color: C.textLight, fontSize: '13px' }}>Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {commandesFiltrees.map((cmd: Commande) => {
              const produits = (cmd as any).produits;
              const premierProduit = produits && Array.isArray(produits) ? produits[0] : null;
              
              return (
                <div
                  key={cmd.id}
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
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    {premierProduit?.image
                      ? <img src={premierProduit.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '📦'
                    }
                  </div>

                  <div style={{ flex: 1, marginLeft: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      width: '100%', 
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                          {cmd.commande_id || `CMD-${cmd.id}`}
                        </span>
                        {cmd.destinataire && (
                          <span style={{ fontSize: '12px', color: C.textLight }}>
                            pour {cmd.destinataire}
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <StatutBadge commande={cmd} />
                        <ActionMenu commande={cmd} onAction={(action) => {
                          if (action === 'detail') naviguer('commande-detail', { commande: cmd });
                          if (action === 'retour') ouvrirModalRetour(cmd);
                          if (action === 'facture') ouvrirFacturePopup(cmd);
                        }} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: C.textLight }}>
                        📅 {cmd.date}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        {cmd.total}
                      </span>
                      <span style={{ fontSize: '12px', color: C.textLight }}>
                        {getNombreArticles(cmd)} article(s)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalRetourOuvert && commandeSelectionnee && (
        <ModalRetour 
          commande={commandeSelectionnee} 
          onClose={fermerPopup} 
          onConfirm={confirmerRetour} 
        />
      )}
      
      {facturePopupOuvert && commandeSelectionnee && (
        <FacturePopup 
          commandeId={commandeSelectionnee.id}
          onClose={fermerPopup} 
        />
      )}
    </>
  );
}
