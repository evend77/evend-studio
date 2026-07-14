// src/AppSponsors.tsx
import React, { useState, useEffect } from 'react';
import SponsorPhotos from './pages/commanditaire/SponsorPhotos';
import SponsorPubs from './pages/commanditaire/SponsorPubs';
import SponsorAbonnement from './pages/commanditaire/SponsorAbonnement';
import SponsorStats from './pages/commanditaire/SponsorStats';

function AppSponsors() {
  const [sponsorInfo, setSponsorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<'photos' | 'pubs' | 'stats' | 'abonnement'>('photos');
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const t = localStorage.getItem('sponsorToken') || localStorage.getItem('token') || '';
    setToken(t);
  }, []);

  const fetchSponsorInfo = async () => {
    try {
      const t = localStorage.getItem('sponsorToken') || localStorage.getItem('token') || '';
      const response = await fetch('/api/sponsors/moi', {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setSponsorInfo(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ongletParam = params.get('onglet');
    if (ongletParam === 'pubs') {
      setOnglet('pubs');
    } else if (ongletParam === 'abonnement') {
      setOnglet('abonnement');
    } else if (ongletParam === 'stats') {
      setOnglet('stats');
    }
    
    fetchSponsorInfo();
  }, []);

  const peutPhotos = sponsorInfo?.type_sponsor === 'photos' || sponsorInfo?.type_sponsor === 'both';
  const peutPubs = sponsorInfo?.type_sponsor === 'pub' || sponsorInfo?.type_sponsor === 'both';

  if (loading || !token) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Chargement...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>⭐</span> Espace Sponsor
            {sponsorInfo && (
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#666', marginLeft: '12px' }}>
                {sponsorInfo.nom}
              </span>
            )}
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>
            {sponsorInfo?.type_sponsor === 'photos' && '📸 Vous fournissez des photos'}
            {sponsorInfo?.type_sponsor === 'pub' && '📢 Vous faites de la publicité'}
            {sponsorInfo?.type_sponsor === 'both' && '⭐ Vous fournissez des photos ET faites de la publicité'}
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ✕ Fermer
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e5e7eb', marginBottom: '24px', flexWrap: 'wrap' }}>
        {peutPhotos && (
          <button
            onClick={() => setOnglet('photos')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: onglet === 'photos' ? '3px solid #f59e0b' : '3px solid transparent',
              color: onglet === 'photos' ? '#f59e0b' : '#666',
              fontWeight: onglet === 'photos' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            📸 Photos
          </button>
        )}
        {peutPubs && (
          <button
            onClick={() => setOnglet('pubs')}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: onglet === 'pubs' ? '3px solid #f59e0b' : '3px solid transparent',
              color: onglet === 'pubs' ? '#f59e0b' : '#666',
              fontWeight: onglet === 'pubs' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            📢 Publicité
          </button>
        )}
        <button
          onClick={() => setOnglet('stats')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: onglet === 'stats' ? '3px solid #f59e0b' : '3px solid transparent',
            color: onglet === 'stats' ? '#f59e0b' : '#666',
            fontWeight: onglet === 'stats' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          📊 Statistiques
        </button>
        <button
          onClick={() => setOnglet('abonnement')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: onglet === 'abonnement' ? '3px solid #f59e0b' : '3px solid transparent',
            color: onglet === 'abonnement' ? '#f59e0b' : '#666',
            fontWeight: onglet === 'abonnement' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          💳 Abonnement
        </button>
      </div>

      {/* Contenu des onglets */}
      {onglet === 'photos' && peutPhotos && <SponsorPhotos token={token} />}
      {onglet === 'pubs' && peutPubs && <SponsorPubs token={token} />}
      {onglet === 'stats' && <SponsorStats token={token} />}
      {onglet === 'abonnement' && <SponsorAbonnement sponsorInfo={sponsorInfo} token={token} />}
    </div>
  );
}

export default AppSponsors;