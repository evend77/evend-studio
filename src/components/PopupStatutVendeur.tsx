import React from 'react';

interface PopupStatutVendeurProps {
  statut: 'pending' | 'suspendu' | 'banni' | 'rejected' | string;
  nomVendeur?: string;
  onDeconnexion: () => void;
}

const CONFIGS = {
  pending: {
    icon: '⏳',
    couleur: '#d97706',
    bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    bordure: '#fbbf24',
    titre: 'Compte en attente d\'approbation',
    message: 'Votre demande d\'inscription a bien été reçue et est en cours de révision par notre équipe.',
    detail: 'Vous recevrez un courriel dès que votre compte sera approuvé. Ce processus prend généralement 1 à 3 jours ouvrables.',
    bouton: 'Compris, je reviendrai plus tard',
    boutonCouleur: '#d97706',
  },
  suspendu: {
    icon: '🔒',
    couleur: '#dc2626',
    bg: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
    bordure: '#fca5a5',
    titre: 'Compte suspendu',
    message: 'Votre compte vendeur a été temporairement suspendu par l\'administration.',
    detail: 'Si vous pensez qu\'il s\'agit d\'une erreur, veuillez contacter notre équipe de support à support@e-vend.ca pour obtenir de l\'aide.',
    bouton: 'Fermer',
    boutonCouleur: '#dc2626',
  },
  banni: {
    icon: '🚫',
    couleur: '#7f1d1d',
    bg: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
    bordure: '#ef4444',
    titre: 'Compte banni',
    message: 'Votre compte vendeur a été banni de la plateforme e-Vend suite à une violation de nos conditions d\'utilisation.',
    detail: 'Cette décision est définitive. Si vous avez des questions, contactez support@e-vend.ca.',
    bouton: 'Fermer',
    boutonCouleur: '#7f1d1d',
  },
  rejected: {
    icon: '❌',
    couleur: '#dc2626',
    bg: 'linear-gradient(135deg, #fff5f5, #fee2e2)',
    bordure: '#fca5a5',
    titre: 'Demande refusée',
    message: 'Votre demande d\'inscription a été refusée par notre équipe.',
    detail: 'Vous pouvez soumettre une nouvelle demande en vous assurant que toutes les informations sont complètes et conformes à nos politiques. Contactez support@e-vend.ca pour plus de détails.',
    bouton: 'Fermer',
    boutonCouleur: '#dc2626',
  },
};

export default function PopupStatutVendeur({ statut, nomVendeur, onDeconnexion }: PopupStatutVendeurProps) {
  const cfg = CONFIGS[statut as keyof typeof CONFIGS] || CONFIGS.pending;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #060d1f 0%, #0d1b35 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px',
    }}>
      {/* Fond animé subtil */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${150 + i * 80}px`, height: `${150 + i * 80}px`,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,0.03)`,
            top: `${10 + i * 12}%`, left: `${5 + i * 15}%`,
          }} />
        ))}
      </div>

      {/* Carte principale */}
      <div style={{
        background: cfg.bg,
        border: `2px solid ${cfg.bordure}`,
        borderRadius: '20px',
        padding: '40px 36px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Icône */}
        <div style={{
          fontSize: '56px',
          marginBottom: '20px',
          lineHeight: 1,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
        }}>
          {cfg.icon}
        </div>

        {/* Logo e-Vend */}
        <p style={{ fontSize: '12px', fontWeight: '800', color: cfg.couleur, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0', opacity: 0.7 }}>
          e-Vend.ca
        </p>

        {/* Titre */}
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1a2332', margin: '0 0 16px 0', lineHeight: 1.3 }}>
          {cfg.titre}
        </h2>

        {/* Salutation personnalisée */}
        {nomVendeur && (
          <p style={{ fontSize: '14px', color: '#4b5563', margin: '0 0 16px 0' }}>
            Bonjour <strong>{nomVendeur}</strong>,
          </p>
        )}

        {/* Message principal */}
        <p style={{ fontSize: '15px', color: '#374151', margin: '0 0 12px 0', lineHeight: '1.6' }}>
          {cfg.message}
        </p>

        {/* Détail */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.6)',
          border: `1px solid ${cfg.bordure}`,
          borderRadius: '10px',
          padding: '14px 16px',
          margin: '0 0 28px 0',
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
            {cfg.detail}
          </p>
        </div>

        {/* Badge statut */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          backgroundColor: cfg.couleur + '18',
          border: `1px solid ${cfg.couleur}40`,
          borderRadius: '20px', padding: '5px 14px',
          marginBottom: '24px',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.couleur }} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: cfg.couleur, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Statut : {statut === 'pending' ? 'En attente' : statut === 'suspendu' ? 'Suspendu' : statut === 'banni' ? 'Banni' : statut === 'rejected' ? 'Refusé' : statut}
          </span>
        </div>

        {/* Bouton */}
        <button onClick={onDeconnexion} style={{
          width: '100%',
          padding: '14px',
          backgroundColor: cfg.boutonCouleur,
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '800',
          cursor: 'pointer',
          boxShadow: `0 4px 14px ${cfg.boutonCouleur}40`,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {cfg.bouton}
        </button>

        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '12px 0 0 0' }}>
          Vous serez déconnecté(e) automatiquement.
        </p>
      </div>
    </div>
  );
}
