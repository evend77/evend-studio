// components/PopupSessionExpiree.tsx
import React from 'react';

interface PopupSessionExpireeProps {
  onDismiss: () => void;
}

const PopupSessionExpiree: React.FC<PopupSessionExpireeProps> = ({ onDismiss }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, color: '#e53e3e' }}>Session expirée</h2>
        <p>Votre session a expiré pour cause d'inactivité. Veuillez vous reconnecter pour continuer.</p>
        <button
          onClick={() => {
            onDismiss();
            window.location.href = '/';
          }}
          style={{
            backgroundColor: '#008060',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Se reconnecter
        </button>
      </div>
    </div>
  );
};

export default PopupSessionExpiree;