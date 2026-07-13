// src/AppSponsors.tsx
import React, { useState, useEffect } from 'react';

interface SponsorPhoto {
  id: number;
  url_image: string;
  titre: string;
  description: string;
  alt_text: string;
  active: boolean;
  created_at: string;
  urls?: {
    small: string;
    regular: string;
    full: string;
    thumb: string;
  };
}

interface SponsorPub {
  id: number;
  titre: string;
  description: string;
  url_image: string;
  url_lien: string;
  impressions: number;
  clics: number;
  actif: boolean;
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
  const [pubs, setPubs] = useState<SponsorPub[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [onglet, setOnglet] = useState<'photos' | 'pubs' | 'abonnement'>('photos');
  const [sponsorInfo, setSponsorInfo] = useState<any>(null);

  const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');

  // ── Récupérer les photos ──────────────────────────────────────────────────
  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/sponsors/photos/sponsor/photos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // ── Récupérer les stats ──────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
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

  // ── Récupérer les infos du sponsor ──────────────────────────────────────
  const fetchSponsorInfo = async () => {
    try {
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
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchPhotos(), fetchStats(), fetchSponsorInfo()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ── Uploader une photo ──────────────────────────────────────────────────
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('titre', file.name);
    formData.append('alt_text', file.name);

    try {
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

  // ── Supprimer une photo ──────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette photo ?')) return;
    try {
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

  // ── Formater ──────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Chargement...</div>;
  }

  // Vérifier si le sponsor peut faire des photos ou de la pub
  const peutPhotos = sponsorInfo?.type_sponsor === 'photos' || sponsorInfo?.type_sponsor === 'both';
  const peutPubs = sponsorInfo?.type_sponsor === 'pub' || sponsorInfo?.type_sponsor === 'both';

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

      {/* ─── CONTENU PHOTOS ──────────────────────────────────────────────── */}
      {onglet === 'photos' && peutPhotos && (
        <div>
          {/* Upload */}
          <div style={{
            border: '2px dashed #ddd',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '24px',
            background: '#fafafa'
          }}>
            <p style={{ margin: '0 0 12px 0', color: '#666' }}>
              📤 Uploader une photo sponsorisée
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

          {/* Liste des photos */}
          {photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              📭 Aucune photo sponsorisée pour le moment
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {photos.map((photo) => (
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
                    src={photo.url_image}
                    alt={photo.titre}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {photo.titre || 'Sans titre'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        {formatDate(photo.created_at)}
                      </span>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        style={{
                          padding: '4px 12px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── CONTENU PUBLICITÉ ───────────────────────────────────────────── */}
      {onglet === 'pubs' && peutPubs && (
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
      )}

      {/* ─── CONTENU ABONNEMENT ────────────────────────────────────────────── */}
      {onglet === 'abonnement' && (
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
      )}
    </div>
  );
}

export default AppSponsors;