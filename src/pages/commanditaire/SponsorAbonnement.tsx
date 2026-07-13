// src/pages/commanditaire/SponsorAbonnement.tsx
import React from 'react';

interface SponsorAbonnementProps {
  sponsorInfo: any;
  token: string;
}

function SponsorAbonnement({ sponsorInfo, token }: SponsorAbonnementProps) {
  const peutPhotos = sponsorInfo?.type_sponsor === 'photos' || sponsorInfo?.type_sponsor === 'both';
  const peutPubs = sponsorInfo?.type_sponsor === 'pub' || sponsorInfo?.type_sponsor === 'both';

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: peutPhotos && peutPubs ? '1fr 1fr' : '1fr',
        gap: '24px',
      }}>
        {/* Forfait Photos */}
        {peutPhotos && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #eee',
          }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📸 Forfait Photos
            </h3>
            <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#92400e' }}>Forfait actuel</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>
                {sponsorInfo?.forfait || 'Basique'}
              </div>
              <div style={{ fontSize: '14px', color: '#92400e' }}>
                {sponsorInfo?.forfait === 'basique' && '10 photos • 50$ / mois'}
                {sponsorInfo?.forfait === 'standard' && '50 photos • 100$ / mois'}
                {sponsorInfo?.forfait === 'premium' && '200 photos • 250$ / mois'}
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/api/sponsors/checkout/photos'}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Mettre à jour
            </button>
          </div>
        )}

        {/* Forfait Publicité */}
        {peutPubs && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #eee',
          }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📢 Forfait Publicité
            </h3>
            <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#92400e' }}>Forfait actuel</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>
                {sponsorInfo?.forfait_pub || 'Basique'}
              </div>
              <div style={{ fontSize: '14px', color: '#92400e' }}>
                {sponsorInfo?.forfait_pub === 'basique' && '1000 impressions • 50$ / mois'}
                {sponsorInfo?.forfait_pub === 'standard' && '5000 impressions • 100$ / mois'}
                {sponsorInfo?.forfait_pub === 'premium' && '20000 impressions • 250$ / mois'}
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/api/sponsors/checkout/pubs'}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔄 Mettre à jour
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsorAbonnement;