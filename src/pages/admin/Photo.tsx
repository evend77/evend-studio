
// src/pages/admin/Photo.tsx
// Gestionnaire de fichiers Cloudflare R2 - Logos, Divers & Audio (e-Vend Studio)

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../../config/api';

interface ImageItem {
  id: number;
  url: string;
  key: string;
  nom: string;
  taille: number;
  type: string;
  uploadedAt: string;
  category: 'logo' | 'divers' | 'audio';
}

const THEME = {
  bg: '#f0f2f5',
  card: '#fff',
  border: '#e1e4e8',
  accent: '#2d6a9f',
  text: '#1a2332',
  textLight: '#6b7280',
  danger: '#dc2626',
  success: '#16a34a',
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function Photo() {
  const [activeTab, setActiveTab] = useState<'logo' | 'divers' | 'audio'>('logo');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/images?category=${activeTab}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const uploadImage = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Vérification immédiate de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        `Fichier trop volumineux : ${file.name} pèse ${formatSize(file.size)}. La taille maximale autorisée est de 15 Mo. Veuillez choisir un fichier plus petit.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('category', activeTab);
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/images/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (
          res.status === 413 ||
          data.code === 'LIMIT_FILE_SIZE' ||
          data.error?.toLowerCase().includes('file too large') ||
          data.error?.toLowerCase().includes('trop volumineux')
        ) {
          throw new Error(
            'Fichier trop volumineux. La taille maximale autorisée est de 15 Mo. Veuillez choisir un fichier plus petit.'
          );
        }

        throw new Error(data.error || `Erreur lors de l'envoi (${res.status}).`);
      }

      if (data.image) {
        setImages(prev => [data.image, ...prev]);
        setUploadSuccess(`« ${file.name} » a été envoyé avec succès !`);
      } else {
        throw new Error('Le serveur a reçu le fichier, mais aucune confirmation n’a été retournée.');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Une erreur inattendue est survenue pendant l'envoi."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteImage = async (image: ImageItem) => {
    if (!confirm(`Supprimer "${image.nom}" ?`)) return;
    try {
      const res = await fetch(`${API_BASE}/images/${image.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la suppression.');
      }

      setImages(prev => prev.filter(img => img.id !== image.id));
    } catch (error) {
      alert('Erreur suppression');
    }
  };

  const copyUrl = async (url: string, id: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '24px', background: THEME.bg, minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .image-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.1); transition: all 0.2s; }
      `}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>🖼 Gestionnaire de fichiers</h1>
          <p style={{ fontSize: '14px', color: THEME.textLight, margin: '4px 0 0' }}>
            {images.length} fichier{images.length > 1 ? 's' : ''} · Cloudflare R2
          </p>
        </div>
        <button
          style={{
            padding: '10px 20px',
            background: THEME.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.6 : 1,
          }}
          onClick={() => {
            setUploadError(null);
            setUploadSuccess(null);
            fileInputRef.current?.click();
          }}
          disabled={uploading}
        >
          {uploading ? '⏳ Upload...' : '+ Ajouter'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={activeTab === 'audio' ? 'audio/mpeg,.mp3' : 'image/*'}
          style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}
        />
      </div>

      {/* Messages d'upload */}
      {uploadError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px 18px',
            marginBottom: '18px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderLeft: '5px solid #dc2626',
            borderRadius: '12px',
            color: '#991b1b',
          }}
        >
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '15px', marginBottom: '5px' }}>
              Impossible d'envoyer le fichier
            </strong>
            <span style={{ fontSize: '13px', lineHeight: 1.5 }}>
              {uploadError}
            </span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            aria-label="Fermer"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div
          role="status"
          style={{
            padding: '14px 18px',
            marginBottom: '18px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderLeft: '5px solid #16a34a',
            borderRadius: '12px',
            color: '#166534',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          ✓ {uploadSuccess}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', background: '#fff', padding: '4px', borderRadius: '10px', border: `1px solid ${THEME.border}`, width: 'fit-content', marginBottom: '20px' }}>
        <button
          style={{
            padding: '8px 24px',
            border: 'none',
            borderRadius: '7px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'logo' ? THEME.accent : 'transparent',
            color: activeTab === 'logo' ? '#fff' : THEME.textLight,
          }}
          onClick={() => setActiveTab('logo')}
        >
          🏢 Logos
        </button>
        <button
          style={{
            padding: '8px 24px',
            border: 'none',
            borderRadius: '7px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'divers' ? THEME.accent : 'transparent',
            color: activeTab === 'divers' ? '#fff' : THEME.textLight,
          }}
          onClick={() => setActiveTab('divers')}
        >
          📁 Divers
        </button>
        <button
          style={{
            padding: '8px 24px',
            border: 'none',
            borderRadius: '7px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'audio' ? THEME.accent : 'transparent',
            color: activeTab === 'audio' ? '#fff' : THEME.textLight,
          }}
          onClick={() => setActiveTab('audio')}
        >
          🎵 Audio
        </button>
      </div>

      {/* Grille */}
      <div style={{ background: THEME.card, borderRadius: '14px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '32px', height: '32px', border: `3px solid ${THEME.border}`, borderTop: `3px solid ${THEME.accent}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>{activeTab === 'logo' ? '🏢' : activeTab === 'audio' ? '🎵' : '📁'}</p>
            <p style={{ color: THEME.textLight }}>Aucun fichier dans {activeTab === 'logo' ? 'Logos' : activeTab === 'audio' ? 'Audio' : 'Divers'}</p>
            <button
              style={{ marginTop: '16px', padding: '8px 20px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
            >
              + Ajouter
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', padding: '20px' }}>
            {images.map(img => (
              <div key={img.id} className="image-card" style={{ background: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ height: '160px', background: '#f8fafc', borderBottom: `1px solid ${THEME.border}` }}>
                  {img.category === 'audio' ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '40px' }}>🎵</span>
                      <audio controls src={img.url} style={{ width: '90%', height: '32px' }} />
                    </div>
                  ) : (
                    <img src={img.url} alt={img.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.nom}</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 8px' }}>{formatSize(img.taille)} · {formatDate(img.uploadedAt)}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" value={img.url} readOnly style={{ flex: 1, fontSize: '10px', padding: '6px', border: `1px solid ${THEME.border}`, borderRadius: '6px', background: '#fafafa' }} />
                    <button
                      style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px', border: `1px solid ${THEME.border}`, background: copiedId === img.id ? THEME.success : '#fff', color: copiedId === img.id ? '#fff' : THEME.text, cursor: 'pointer' }}
                      onClick={() => copyUrl(img.url, img.id)}
                    >
                      {copiedId === img.id ? '✓' : '📋'}
                    </button>
                  </div>
                  <button
                    style={{ marginTop: '10px', width: '100%', padding: '6px', fontSize: '12px', borderRadius: '6px', border: `1px solid ${THEME.danger}`, background: '#fff', color: THEME.danger, cursor: 'pointer' }}
                    onClick={() => deleteImage(img)}
                  >
                    🗑 Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
