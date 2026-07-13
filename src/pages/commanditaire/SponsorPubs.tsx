// src/pages/commanditaire/SponsorPubs.tsx
import React from 'react';

interface SponsorPubsProps {
  token: string;
}

function SponsorPubs({ token }: SponsorPubsProps) {
  return (
    <div>
      <div style={{
        background: '#fef3c7',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#92400e' }}>📢 Gestion des publicités</h3>
          <p style={{ margin: '4px 0 0', color: '#78350f', fontSize: '14px' }}>
            Créez des publicités qui apparaîtront dans les sites des gestionnaires
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/sponsor/pubs/creer'}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ➕ Créer une publicité
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>📢</p>
        <p style={{ fontSize: '18px', fontWeight: 600, color: '#666' }}>Aucune publicité pour le moment</p>
        <p style={{ fontSize: '14px' }}>Créez votre première publicité pour atteindre les gestionnaires</p>
      </div>
    </div>
  );
}

export default SponsorPubs;