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
  const [statsParPhoto, setStatsParPhoto] = useState<Record<number, { vues: number; selections: number }>>({});
  const [quota, setQuota] = useState<{ utilisees: number; limite: number | null; planLabel: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState('general');
  const [uploading, setUploading] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sponsors/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      const map: Record<number, { vues: number; selections: number }> = {};
      (data.stats || []).forEach((s: any) => {
        map[s.photo_id] = { vues: parseInt(s.vues) || 0, selections: parseInt(s.selections) || 0 };
      });
      setStatsParPhoto(map);
    } catch (error) {
      console.error('Erreur chargement stats photos:', error);
    }
  };

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

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/sponsors/moi', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json();
      setQuota({ utilisees: data.photos_utilisees ?? 0, limite: data.photos_limite ?? null, planLabel: data.photos_plan_label ?? '' });
    } catch (error) {
      console.error('Erreur chargement quota:', error);
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchStats();
    fetchQuota();
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
      fetchQuota();
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
      fetchQuota();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  // ── Modifier la catégorie d'une photo existante ─────────────────────────
  const [categorieEnEdition, setCategorieEnEdition] = useState<Record<number, string>>({});
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState<number | null>(null);

  const changerCategorieLocale = (photoId: number, nouvelleCategorie: string) => {
    setCategorieEnEdition(prev => ({ ...prev, [photoId]: nouvelleCategorie }));
  };

  const sauvegarderCategorie = async (photo: Photo) => {
    const nouvelleCategorie = categorieEnEdition[photo.id];
    if (!nouvelleCategorie || nouvelleCategorie === photo.categorie) return;
    setSauvegardeEnCours(photo.id);
    try {
      const response = await fetch(`/api/sponsors/photos/sponsor/photos/${photo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ categorie: nouvelleCategorie }),
      });
      if (!response.ok) throw new Error('Erreur');
      setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, categorie: nouvelleCategorie } : p));
    } catch (error) {
      console.error('Erreur changement catégorie:', error);
      alert('❌ Erreur lors du changement de catégorie');
    } finally {
      setSauvegardeEnCours(null);
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

  const quotaAtteint = quota?.limite !== null && quota !== null && quota.utilisees >= (quota.limite as number);

  return (
    <div>
      {/* Quota */}
      {quota && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fff', border: '1px solid #eee', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', marginBottom: '6px' }}>
            <span>📸 {quota.utilisees} photo{quota.utilisees > 1 ? 's' : ''} — forfait {quota.planLabel}</span>
            <span style={{ fontWeight: 700 }}>{quota.limite === null ? 'Illimité' : `/ ${quota.limite}`}</span>
          </div>
          {quota.limite !== null && (
            <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min((quota.utilisees / quota.limite) * 100, 100)}%`, height: '100%',
                background: quotaAtteint ? '#dc2626' : '#f59e0b', borderRadius: '20px', transition: 'width 0.4s ease',
              }} />
            </div>
          )}
          {quotaAtteint && (
            <p style={{ fontSize: '12px', color: '#dc2626', margin: '6px 0 0' }}>
              ⚠️ Quota atteint — passez à un forfait supérieur dans l'onglet Abonnement pour ajouter des photos.
            </p>
          )}
        </div>
      )}

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
            background: quotaAtteint ? '#e5e7eb' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: quotaAtteint ? '#999' : '#000',
            borderRadius: '8px',
            cursor: (uploading || quotaAtteint) ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            opacity: uploading ? 0.6 : 1,
          }}>
            {uploading ? '⏳ Upload...' : quotaAtteint ? '🔒 Quota atteint' : 'Choisir une image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading || quotaAtteint}
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

                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', fontSize: '11px', color: '#555' }}>
                  <span title="Nombre de fois que cette photo a été choisie par un gestionnaire pour son site">
                    ✅ {statsParPhoto[photo.id]?.selections ?? 0} utilisation{(statsParPhoto[photo.id]?.selections ?? 0) > 1 ? 's' : ''}
                  </span>
                  <span title="Visible sur les sites où elle est utilisée — bientôt disponible">
                    👁️ {statsParPhoto[photo.id]?.vues ?? 0} vues
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <select
                    value={categorieEnEdition[photo.id] ?? photo.categorie ?? 'general'}
                    onChange={(e) => changerCategorieLocale(photo.id, e.target.value)}
                    style={{
                      flex: 1, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: '6px',
                      fontSize: '12px', background: '#fff', outline: 'none',
                    }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => sauvegarderCategorie(photo)}
                    disabled={sauvegardeEnCours === photo.id || (categorieEnEdition[photo.id] ?? photo.categorie) === photo.categorie}
                    style={{
                      padding: '6px 10px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                      cursor: (categorieEnEdition[photo.id] && categorieEnEdition[photo.id] !== photo.categorie) ? 'pointer' : 'default',
                      background: (categorieEnEdition[photo.id] && categorieEnEdition[photo.id] !== photo.categorie) ? '#16a34a' : '#e5e7eb',
                      color: (categorieEnEdition[photo.id] && categorieEnEdition[photo.id] !== photo.categorie) ? '#fff' : '#999',
                    }}
                  >
                    {sauvegardeEnCours === photo.id ? '⏳' : '✅'}
                  </button>
                </div>

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