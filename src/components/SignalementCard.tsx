import React from 'react';

interface Signalement {
  id: number;
  vendeur_id: number;
  vendeur_nom: string;
  vendeur_boutique: string;
  signaleur_nom: string;
  signaleur_email: string;
  categorie: string;
  raison: string;
  preuve_url: string | null;
  statut: 'nouveau' | 'vu' | 'traite' | 'rejete';
  note_admin: string | null;
  traite_par: string | null;
  date_traitement: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  signalement: Signalement;
  onClick: () => void;
  getStatutBadge: (statut: string) => React.ReactElement;
  categorieLabels: { [key: string]: string };
}

const THEME = {
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  accent: '#2d6a9f',
  card: '#ffffff',
};

export default function SignalementCard({ signalement, onClick, getStatutBadge, categorieLabels }: Props) {
  
  const getPrioriteFromCategorie = (categorie: string): 'basse' | 'moyenne' | 'haute' | 'critique' => {
    switch(categorie) {
      case 'arnaque': return 'critique';
      case 'produit_fake': return 'haute';
      case 'comportement': return 'moyenne';
      default: return 'basse';
    }
  };

  const priorite = getPrioriteFromCategorie(signalement.categorie);
  
  const prioriteColors = {
    basse: '#6b7280',
    moyenne: '#3b82f6',
    haute: '#f97316',
    critique: '#ef4444'
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-CA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const getCategorieIcon = (categorie: string) => {
    switch(categorie) {
      case 'produit_fake': return '🕵️';
      case 'arnaque': return '💰';
      case 'comportement': return '😤';
      case 'livraison': return '📦';
      case 'qualite': return '⭐';
      default: return '🚩';
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        border: `1px solid ${THEME.border}`,
        borderRadius: '12px',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = THEME.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = THEME.border;
      }}
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Icône de catégorie */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: prioriteColors[priorite] + '15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0
        }}>
          {getCategorieIcon(signalement.categorie)}
        </div>

        {/* Contenu principal */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '8px'
          }}>
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                margin: '0 0 4px 0',
                color: THEME.text
              }}>
                {categorieLabels[signalement.categorie] || 'Signalement'}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: THEME.textLight, 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <span>👤 {signalement.signaleur_nom || 'Anonyme'}</span>
                <span style={{ fontSize: '4px', color: THEME.border }}>•</span>
                <span>🏪 {signalement.vendeur_boutique || signalement.vendeur_nom}</span>
                <span style={{ fontSize: '4px', color: THEME.border }}>•</span>
                <span style={{ color: '#999' }}>🕐 {formatDate(signalement.created_at)}</span>
              </p>
            </div>
            
            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                backgroundColor: prioriteColors[priorite] + '20',
                color: prioriteColors[priorite],
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                {priorite}
              </span>
              {getStatutBadge(signalement.statut)}
            </div>
          </div>

          {/* Raison (tronquée) */}
          <p style={{
            fontSize: '13px',
            color: THEME.text,
            lineHeight: '1.5',
            margin: '0 0 12px 0',
            maxHeight: '60px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            backgroundColor: '#f8f9fa',
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${THEME.border}`,
            fontStyle: signalement.raison ? 'normal' : 'italic',

          }}>
            {signalement.raison || 'Aucune description fournie'}
          </p>

          {/* Pied de carte */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: THEME.textLight
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              {signalement.preuve_url && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>📎</span>
                  Pièce jointe
                </span>
              )}
              {signalement.traite_par && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>👨‍⚖️</span>
                  Traité par: {signalement.traite_par}
                </span>
              )}
            </div>
            
            {signalement.statut === 'nouveau' && (
              <span style={{
                backgroundColor: THEME.danger + '10',
                color: THEME.danger,
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600',
                animation: 'pulse 2s infinite'
              }}>
                🆕 Nouveau
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
