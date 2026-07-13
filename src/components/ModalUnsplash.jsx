// src/components/ModalUnsplash.jsx
import React, { useState } from 'react';

function ModalUnsplash({ isOpen, onClose, onSelectPhoto }) {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ongletActif, setOngletActif] = useState('unsplash'); // 'unsplash' ou 'sponsors'

  // ── CATÉGORIES POUR SPONSORS ──────────────────────────────────────────
  const CATEGORIES_SPONSOR = [
    { id: 'all', label: 'Toutes' },
    { id: 'general', label: 'Général' },
    { id: 'nature', label: 'Nature' },
    { id: 'bureau', label: 'Bureau' },
    { id: 'montagne', label: 'Montagne' },
    { id: 'mer', label: 'Mer' },
    { id: 'ville', label: 'Ville' },
    { id: 'café', label: 'Café' },
    { id: 'voyage', label: 'Voyage' },
    { id: 'business', label: 'Business' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'plage', label: 'Plage' },
    { id: 'nourriture', label: 'Nourriture' },
    { id: 'sport', label: 'Sport' },
    { id: 'technologie', label: 'Technologie' },
    { id: 'mode', label: 'Mode' },
  ];

  const [categorieFiltre, setCategorieFiltre] = useState('all');

  // 🔍 RECHERCHE UNSplash
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

  // ⭐ RECHERCHE SPONSORS (API locale avec catégorie)
  const rechercherSponsors = async (cat = categorieFiltre, searchQuery = query) => {
    setLoading(true);
    try {
      let url = '/api/sponsors/photos/search?';
      const params = [];

      if (searchQuery && searchQuery.trim() !== '') {
        params.push(`query=${encodeURIComponent(searchQuery.trim())}`);
      }

      if (cat && cat !== 'all') {
        params.push(`categorie=${encodeURIComponent(cat)}`);
      }

      url += params.join('&');

      const response = await fetch(url);
      if (!response.ok) throw new Error('Erreur lors de la recherche sponsors');
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Erreur sponsors:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRechercher = () => {
    if (ongletActif === 'unsplash') {
      rechercherPhotos();
    } else {
      rechercherSponsors(categorieFiltre, query);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleRechercher();
  };

  const changerOnglet = (onglet) => {
    setOngletActif(onglet);
    setQuery('');
    setCategorieFiltre('all');
    setPhotos([]);
    if (onglet === 'sponsors') {
      rechercherSponsors('all', '');
    }
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
            📷 Bibliothèque d'images
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

        {/* 👇 ONGLETS */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #e5e7eb',
            flexShrink: 0,
            padding: '0 16px',
          }}
        >
          <button
            onClick={() => changerOnglet('unsplash')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: ongletActif === 'unsplash' ? '3px solid #c9a96e' : '3px solid transparent',
              color: ongletActif === 'unsplash' ? '#c9a96e' : '#666',
              fontSize: '14px',
              fontWeight: ongletActif === 'unsplash' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📸 Unsplash
          </button>
          <button
            onClick={() => changerOnglet('sponsors')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: ongletActif === 'sponsors' ? '3px solid #c9a96e' : '3px solid transparent',
              color: ongletActif === 'sponsors' ? '#c9a96e' : '#666',
              fontSize: '14px',
              fontWeight: ongletActif === 'sponsors' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⭐ Sponsoriser
          </button>
        </div>

        {/* Recherche */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder={ongletActif === 'unsplash' ? 'Rechercher sur Unsplash...' : 'Rechercher parmi les sponsors...'}
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
              onClick={handleRechercher}
              style={{
                padding: '8px 16px',
                background: ongletActif === 'sponsors' 
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                  : 'linear-gradient(135deg, #c9a96e, #a07840)',
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

          {/* Tags rapides (seulement pour Unsplash) */}
          {ongletActif === 'unsplash' && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {['nature', 'bureau', 'montagne', 'mer', 'ville', 'café', 'voyage', 'business', 'architecture', 'plage'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); setTimeout(handleRechercher, 100); }}
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
          )}

          {/* Filtres catégories pour sponsors */}
          {ongletActif === 'sponsors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>
                📂 Filtrer par catégorie :
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CATEGORIES_SPONSOR.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategorieFiltre(cat.id);
                      rechercherSponsors(cat.id, query);
                    }}
                    style={{
                      padding: '4px 14px',
                      background: categorieFiltre === cat.id ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#f3f4f6',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: categorieFiltre === cat.id ? '#fff' : '#555',
                      fontWeight: categorieFiltre === cat.id ? 600 : 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: '#f59e0b' }}>
                ⭐ Photos fournies par nos partenaires sponsorisés
              </div>
            </div>
          )}
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
                    border: ongletActif === 'sponsors' ? '2px solid #f59e0b' : '1px solid #eee',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {ongletActif === 'sponsors' && (
                    <div style={{ 
                      background: '#f59e0b', 
                      color: '#fff', 
                      fontSize: '9px', 
                      padding: '2px 8px', 
                      textAlign: 'center',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ⭐ Sponsorisé
                    </div>
                  )}
                  {ongletActif === 'sponsors' && photo.categorie && (
                    <div style={{ 
                      position: 'absolute',
                      top: '28px',
                      left: '4px',
                      background: 'rgba(0,0,0,0.6)', 
                      color: '#fff', 
                      fontSize: '8px', 
                      padding: '1px 6px', 
                      borderRadius: '4px',
                    }}>
                      {photo.categorie}
                    </div>
                  )}
                  <img
                    src={photo.urls?.small || photo.url_image}
                    alt={photo.alt_description || 'Photo'}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{ padding: '6px 8px' }}>
                    <p style={{ fontSize: '9px', color: '#999', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📸{' '}
                      {ongletActif === 'unsplash' ? (
                        <a 
                          href={`${photo.user.links.html}?utm_source=evend_studio&utm_medium=referral`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#0066cc', textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {photo.user.name}
                        </a>
                      ) : (
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                          {photo.sponsor_name || 'Marque sponsorisée'}
                        </span>
                      )}
                    </p>
                    {ongletActif === 'sponsors' && photo.categorie && (
                      <p style={{ fontSize: '8px', color: '#999', margin: '0 0 4px 0' }}>
                        📂 {photo.categorie}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => copierUrl(photo.urls?.regular || photo.url_image, e)}
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
                          background: ongletActif === 'sponsors' 
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                            : 'linear-gradient(135deg, #c9a96e, #a07840)',
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
          {photos.length > 0 && ongletActif === 'unsplash' && (
            <div style={{ marginTop: '12px', fontSize: '10px', color: '#aaa', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              Photos par{' '}
              <a 
                href="https://unsplash.com/?utm_source=evend_studio&utm_medium=referral" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#c9a96e', fontWeight: 600 }}
              >
                Unsplash
              </a>
            </div>
          )}

          {photos.length > 0 && ongletActif === 'sponsors' && (
            <div style={{ marginTop: '12px', fontSize: '10px', color: '#999', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              ⭐ Photos sponsorisées par nos partenaires — 
              <a 
                href="/devenir-sponsor" 
                style={{ color: '#f59e0b', fontWeight: 600, marginLeft: '4px' }}
              >
                Devenir sponsor →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalUnsplash;