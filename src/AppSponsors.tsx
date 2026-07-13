// src/AppSponsors.tsx
import React, { useState, useEffect } from 'react';

interface SponsorPhoto {
  id: number;
  urls: {
    small: string;
    regular: string;
    full: string;
    thumb: string;
  };
  alt_description: string;
  url_image?: string;
  titre?: string;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  sponsor_name: string;
  sponsor_logo: string;
  sponsor_id: number;
  description: string;
  created_at: string;
}

interface Stat {
  photo_id: number;
  vues: number;
  selections: number;
  clics: number;
}

function AppSponsors() {
  const [photos, setPhotos] = useState<SponsorPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [onglet, setOnglet] = useState<'photos' | 'stats' | 'abonnement'>('photos');
  const [sponsorInfo, setSponsorInfo] = useState<any>(null);

  // Récupérer les photos du sponsor
  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');
      const response = await fetch('/api/sponsors/photos/sponsor/photos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');
      const response = await fetch('/api/sponsors/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setStats(data.stats || []);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  // Récupérer les infos du sponsor
  const fetchSponsorInfo = async () => {
    try {
      const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');
      const response = await fetch('/api/sponsors/moi', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setSponsorInfo(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchStats();
    fetchSponsorInfo();
  }, []);

  // Uploader une photo
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('titre', file.name);
    formData.append('alt_text', file.name);

    try {
      const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');
      const response = await fetch('/api/sponsors/photos/sponsor/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur upload');
      }
      alert('✅ Photo uploadée avec succès !');
      fetchPhotos();
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors de l\'upload');
    }
  };

  // Supprimer une photo
  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette photo ?')) return;
    try {
      const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');
      const response = await fetch(`/api/sponsors/photos/sponsor/photos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur suppression');
      alert('✅ Photo supprimée');
      fetchPhotos();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Chargement...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>⭐</span> Espace Sponsor
          {sponsorInfo && (
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#666', marginLeft: '12px' }}>
              {sponsorInfo.nom} • {sponsorInfo.forfait || 'Basique'}
              {sponsorInfo.type_sponsor === 'pub' && ' 📢'}
              {sponsorInfo.type_sponsor === 'photos' && ' 📸'}
              {sponsorInfo.type_sponsor === 'both' && ' ⭐'}
            </span>
          )}
        </h1>
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
          📸 Mes photos
        </button>
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

      {/* Contenu */}
      {onglet === 'photos' && (
        <div>
          {/* Bouton vers la page de gestion complète des photos */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#92400e' }}>
                📸 Gérez toutes vos photos sponsorisées
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#78350f' }}>
                Upload, suppression, copie d'URL — tout en un endroit
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/sponsor/photos'}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
              }}
            >
              📸 Gérer mes photos →
            </button>
          </div>

          {/* Upload rapide */}
          <div style={{
            border: '2px dashed #ddd',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '24px',
            background: '#fafafa'
          }}>
            <p style={{ margin: '0 0 12px 0', color: '#666' }}>
              📤 Uploader une photo rapidement
            </p>
            <label style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}>
              Choisir une image
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
            </label>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              JPG, PNG, WEBP • Max 5 MB
            </p>
          </div>

          {/* Aperçu des dernières photos */}
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              📭 Aucune photo sponsorisée pour le moment
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                📸 Dernières photos ajoutées ({photos.length} au total)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {photos.slice(0, 6).map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      background: '#fff',
                      border: '1px solid #eee',
                    }}
                  >
                    <img
                      src={photo.urls?.small || photo.url_image || ''}
                      alt={photo.alt_description || photo.titre || 'Photo'}
                      style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                    />
                    <div style={{ padding: '8px 12px' }}>
                      <p style={{ fontSize: '11px', color: '#666', margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {photo.titre || photo.alt_description || 'Sans titre'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {photos.length > 6 && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#999' }}>
                    + {photos.length - 6} autres photos
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {onglet === 'stats' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>
                {stats.reduce((acc, s) => acc + s.vues, 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>👁️ Vues totales</div>
            </div>
            <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
                {stats.reduce((acc, s) => acc + s.selections, 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>✅ Sélections</div>
            </div>
            <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
                {stats.reduce((acc, s) => acc + s.clics, 0)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>🖱️ Clics</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>📊 Détail par photo</h3>
            {stats.length === 0 ? (
              <p style={{ color: '#999' }}>Aucune donnée disponible</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#666' }}>Photo</th>
                    <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#666' }}>👁️ Vues</th>
                    <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#666' }}>✅ Sélections</th>
                    <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#666' }}>🖱️ Clics</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat) => (
                    <tr key={stat.photo_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px', fontSize: '13px' }}>Photo #{stat.photo_id}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{stat.vues}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{stat.selections}</td>
                      <td style={{ textAlign: 'center', padding: '8px' }}>{stat.clics}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {onglet === 'abonnement' && (
        <div>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #eee',
            maxWidth: '500px',
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>💳 Mon forfait sponsor</h3>
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
              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                Type: {sponsorInfo?.type_sponsor === 'photos' && '📸 Photos'}
                {sponsorInfo?.type_sponsor === 'pub' && '📢 Publicité'}
                {sponsorInfo?.type_sponsor === 'both' && '⭐ Photos + Publicité'}
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/api/sponsors/checkout'}
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
              🔄 Mettre à jour mon forfait
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppSponsors;