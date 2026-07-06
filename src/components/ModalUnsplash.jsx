// src/components/ModalUnsplash.jsx
import React, { useState } from 'react';

function ModalUnsplash({ isOpen, onClose, onSelectPhoto }) {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const rechercherPhotos = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/unsplash/search?query=${encodeURIComponent(query)}&page=1&perPage=24`
      );
      if (!response.ok) throw new Error('Erreur lors de la recherche');
      const data = await response.json();
      setPhotos(data.results || []);
    } catch (error) {
      console.error('Erreur:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') rechercherPhotos();
  };

  const copierUrl = (url, e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('✅ URL copiée !\n\n' + url);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ URL copiée !\n\n' + url);
      });
    }
  };

  const triggerDownload = async (photoId) => {
    try {
      await fetch(`/api/unsplash/download/${photoId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Erreur download:', error);
    }
  };

  const handleSelectPhoto = async (photo) => {
    await triggerDownload(photo.id);
    onSelectPhoto(photo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📷 Photos gratuites
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#666',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Recherche */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                flex: '1',
                minWidth: '120px',
                padding: '8px 12px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              onClick={rechercherPhotos}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #c9a96e, #a07840)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              🔍
            </button>
          </div>

          {/* Tags rapides */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            {['nature', 'bureau', 'montagne', 'mer', 'ville', 'café', 'voyage', 'business', 'architecture', 'plage'].map((tag) => (
              <button
                key={tag}
                onClick={() => { setQuery(tag); setTimeout(rechercherPhotos, 100); }}
                style={{
                  padding: '4px 10px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: '#555',
                  whiteSpace: 'nowrap',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', backgroundColor: '#fafafa' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
              ⏳ Chargement...
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              {query ? '😕 Aucune photo trouvée' : '🔍 Entrez un mot-clé'}
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: '12px' 
            }}>
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    background: '#fff',
                    border: '1px solid #eee',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img
                    src={photo.urls.small}
                    alt={photo.alt_description || 'Photo'}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{ padding: '6px 8px' }}>
                    <p style={{ fontSize: '9px', color: '#999', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📸 {photo.user.name}
                    </p>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => copierUrl(photo.urls.regular, e)}
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          background: '#2563eb',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        📋 Copier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPhoto(photo);
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          background: 'linear-gradient(135deg, #c9a96e, #a07840)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        ✅ Choisir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attribution */}
          {photos.length > 0 && (
            <div style={{ marginTop: '12px', fontSize: '10px', color: '#aaa', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              Photos par{' '}
              <a 
                href="https://unsplash.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#c9a96e', fontWeight: 600 }}
              >
                Unsplash
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalUnsplash;