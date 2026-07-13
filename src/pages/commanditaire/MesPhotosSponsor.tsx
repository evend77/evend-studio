// src/pages/commanditaire/MesPhotosSponsor.tsx
// Gestionnaire de photos pour les commanditaires

import { useState, useEffect, useRef, useCallback } from 'react';

interface PhotoItem {
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

const THEME = {
  bg: '#f0f2f5',
  card: '#fff',
  border: '#e1e4e8',
  accent: '#f59e0b',
  accentHover: '#d97706',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
};

export default function MesPhotosSponsor() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('sponsorToken') || localStorage.getItem('token');

  // ── Récupérer les photos ──────────────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sponsors/photos/sponsor/photos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Votre compte n\'est pas autorisé à uploader des photos.');
        }
        throw new Error('Erreur lors du chargement des photos');
      }
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('titre', file.name);
    formData.append('alt_text', file.name);

    try {
      const res = await fetch('/api/sponsors/photos/sponsor/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur d'upload");
      }
      if (data.photo) {
        setPhotos(prev => [data.photo, ...prev]);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Supprimer ──────────────────────────────────────────────────────────────
  const deletePhoto = async (photo: PhotoItem) => {
    if (!window.confirm(`Supprimer "${photo.titre}" ?`)) return;
    try {
      const res = await fetch(`/api/sponsors/photos/sponsor/photos/${photo.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur suppression');
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  // ── Copier URL ─────────────────────────────────────────────────────────────
  const copyUrl = async (url: string, id: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Formater ──────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const getImageUrl = (photo: PhotoItem) => {
    return photo.url_image || photo.urls?.small || '';
  };

  return (
    <div style={{ padding: '24px', background: THEME.bg, minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .photo-card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); 
          transition: all 0.25s; 
        }
        .upload-zone {
          transition: all 0.3s;
        }
        .upload-zone:hover {
          border-color: ${THEME.accent};
          background: rgba(245, 158, 11, 0.05);
        }
      `}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            📸 Mes photos sponsorisées
            <span style={{ fontSize: '14px', fontWeight: 400, color: THEME.textLight, background: '#f3f4f6', padding: '2px 12px', borderRadius: '20px' }}>
              {photos.length} photo{photos.length > 1 ? 's' : ''}
            </span>
          </h1>
          <p style={{ fontSize: '14px', color: THEME.textLight, margin: '4px 0 0' }}>
            Gérez vos photos sponsorisées disponibles dans la bibliothèque e-Vend Studio
          </p>
        </div>
        <button
          style={{
            padding: '10px 24px',
            background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentHover})`,
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.6 : 1,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '⏳ Upload en cours...' : '➕ Ajouter une photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
        />
      </div>

      {/* Erreur */}
      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '10px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>❌ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Zone de drag & drop (optionnel) */}
      <div
        className="upload-zone"
        style={{
          border: '2px dashed #ddd',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '20px',
          background: '#fafafa',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)'; }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.background = '#fafafa'; }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.background = '#fafafa';
          const file = e.dataTransfer.files[0];
          if (file) uploadPhoto(file);
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📤</div>
        <p style={{ color: THEME.textLight, margin: 0 }}>
          Glissez-déposez vos images ici ou <span style={{ color: THEME.accent, fontWeight: 600 }}>parcourez</span>
        </p>
        <p style={{ fontSize: '12px', color: THEME.textLight, margin: '4px 0 0' }}>
          JPG, PNG, WEBP • Max 5 MB
        </p>
      </div>

      {/* Grille des photos */}
      <div style={{ background: THEME.card, borderRadius: '14px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${THEME.border}`, borderTop: `3px solid ${THEME.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '56px', marginBottom: '16px' }}>📭</p>
            <p style={{ fontSize: '18px', fontWeight: 600, color: THEME.text }}>Aucune photo sponsorisée</p>
            <p style={{ color: THEME.textLight }}>Ajoutez vos premières photos pour les rendre disponibles dans la bibliothèque.</p>
            <button
              style={{ marginTop: '16px', padding: '10px 24px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => fileInputRef.current?.click()}
            >
              + Ajouter une photo
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '20px' }}>
            {photos.map((photo) => (
              <div key={photo.id} className="photo-card" style={{ background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' }}>
                {/* Image */}
                <div style={{ height: '180px', background: '#f8fafc', borderBottom: `1px solid ${THEME.border}`, position: 'relative' }}>
                  {photo.active && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: THEME.success,
                      color: '#fff',
                      fontSize: '10px',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}>
                      ✅ Active
                    </span>
                  )}
                  <img
                    src={getImageUrl(photo)}
                    alt={photo.alt_text || photo.titre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+non+disponible'; }}
                  />
                </div>

                {/* Infos */}
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {photo.titre || 'Sans titre'}
                  </p>
                  {photo.description && (
                    <p style={{ fontSize: '12px', color: THEME.textLight, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {photo.description}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 10px' }}>
                    📅 {formatDate(photo.created_at)}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={getImageUrl(photo)}
                      readOnly
                      style={{
                        flex: 1,
                        fontSize: '10px',
                        padding: '6px 8px',
                        border: `1px solid ${THEME.border}`,
                        borderRadius: '6px',
                        background: '#fafafa',
                        color: THEME.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    />
                    <button
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: `1px solid ${THEME.border}`,
                        background: copiedId === photo.id ? THEME.success : '#fff',
                        color: copiedId === photo.id ? '#fff' : THEME.text,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      onClick={() => copyUrl(getImageUrl(photo), photo.id)}
                    >
                      {copiedId === photo.id ? '✅' : '📋'}
                    </button>
                  </div>

                  <button
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '6px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${THEME.danger}`,
                      background: '#fff',
                      color: THEME.danger,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = THEME.danger; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = THEME.danger; }}
                    onClick={() => deletePhoto(photo)}
                  >
                    🗑 Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: THEME.textLight }}>
        Les photos apparaîtront dans l'onglet "⭐ Sponsoriser" de la bibliothèque d'images.
        <br />
        Maximum 200 photos selon votre forfait.
      </div>
    </div>
  );
}