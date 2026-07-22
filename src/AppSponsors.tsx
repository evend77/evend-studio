// src/AppSponsors.tsx
import React, { useState, useEffect } from 'react';
import SponsorPhotos from './pages/commanditaire/SponsorPhotos';
import SponsorPubs from './pages/commanditaire/SponsorPubs';
import SponsorAbonnement from './pages/commanditaire/SponsorAbonnement';
import SponsorStats from './pages/commanditaire/SponsorStats';

function AppSponsors() {
  const [sponsorInfo, setSponsorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<'photos' | 'pubs' | 'stats' | 'abonnement' | 'configuration'>('photos');
  const [token, setToken] = useState<string>('');
  const [f2aActif, setF2aActif] = useState(false);
  const [f2aSaving, setF2aSaving] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('sponsorToken') || localStorage.getItem('token') || '';
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch('/api/sponsors/2fa', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.two_factor_enabled === 'boolean') setF2aActif(data.two_factor_enabled); })
      .catch(() => {});
  }, [token]);

  const toggleF2a = async () => {
    const nouvelEtat = !f2aActif;
    setF2aSaving(true);
    try {
      const res = await fetch('/api/sponsors/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: nouvelEtat }),
      });
      if (!res.ok) throw new Error();
      setF2aActif(nouvelEtat);
    } catch {
      // silencieux — le toggle reste à son état précédent si l'appel échoue
    } finally {
      setF2aSaving(false);
    }
  };

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
        <button
          onClick={() => setOnglet('configuration')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: onglet === 'configuration' ? '3px solid #f59e0b' : '3px solid transparent',
            color: onglet === 'configuration' ? '#f59e0b' : '#666',
            fontWeight: onglet === 'configuration' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ⚙️ Configuration
        </button>
      </div>

      {/* Contenu des onglets */}
      {onglet === 'photos' && peutPhotos && <SponsorPhotos token={token} />}
      {onglet === 'pubs' && peutPubs && <SponsorPubs token={token} />}
      {onglet === 'stats' && <SponsorStats token={token} />}
      {onglet === 'abonnement' && <SponsorAbonnement sponsorInfo={sponsorInfo} token={token} />}
      {onglet === 'configuration' && (
        <div style={{ maxWidth: '520px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>🔐 Vérification en 2 étapes</h2>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
              À chaque connexion, un code vous sera envoyé par courriel en plus de votre mot de passe.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: f2aActif ? '#16a34a' : '#94a3b8' }}>
                {f2aActif ? '🔐 Activée' : '— Désactivée'}
              </span>
              <button
                onClick={toggleF2a}
                disabled={f2aSaving}
                style={{
                  position: 'relative', width: '46px', height: '26px', borderRadius: '13px', border: 'none',
                  background: f2aActif ? '#16a34a' : '#cbd5e1', cursor: f2aSaving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px', left: f2aActif ? '23px' : '3px',
                  width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                  transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
            {f2aSaving && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '10px 0 0' }}>⏳ Mise à jour…</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default AppSponsors;