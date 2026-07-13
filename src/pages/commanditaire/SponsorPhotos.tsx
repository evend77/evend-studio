// src/pages/commanditaire/SponsorPhotos.tsx
import React, { useState, useEffect } from 'react';

interface Photo {
  id: number;
  url_image: string;
  titre: string;
  description: string;
  alt_text: string;
  active: boolean;
  created_at: string;
  categorie: string;
}

interface SponsorPhotosProps {
  token: string;
}

const CATEGORIES = [
  'general',
  'nature',
  'bureau',
  'montagne',
  'mer',
  'ville',
  'café',
  'voyage',
  'business',
  'architecture',
  'plage',
  'nourriture',
  'sport',
  'technologie',
  'mode',
  'maison',
  'jardin',
  'animaux',
  'art',
  'musique',
];

function SponsorPhotos({ token }: SponsorPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState('general');
  const [uploading, setUploading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('titre', file.name);
    formData.append('alt_text', file.name);
    formData.append('categorie', categorie);

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
      setCategorie('general');
      fetchPhotos();
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-CA', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Chargement...</div>;
  }

  return (
    <div>
      {/* Upload */}
      <div style={{
        border: '2px dashed #ddd',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        background: '#fafafa'
      }}>
        <p style={{ margin: '0 0 12px 0', color: '#666', textAlign: 'center' }}>
          📤 Uploader une photo sponsorisée
        </p>

        <div style={{ maxWidth: '400px', margin: '0 auto 16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#333' }}>
            Catégorie
          </label>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
              background: '#fff',
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'center' }}>
          <label style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#000',
            borderRadius: '8px',
            cursor: uploading ? 'wait' : 'pointer',
            fontWeight: 600,
            opacity: uploading ? 0.6 : 1,
          }}>
            {uploading ? '⏳ Upload...' : 'Choisir une image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
            JPG, PNG, WEBP • Max 5 MB
          </p>
        </div>
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
              <div style={{ position: 'relative' }}>
                <img
                  src={photo.url_image}
                  alt={photo.titre}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {photo.categorie || 'general'}
                </span>
              </div>
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
  );
}

export default SponsorPhotos;