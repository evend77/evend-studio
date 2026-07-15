// src/pages/admin/AdminPhotosSponsors.tsx
import React, { useState, useEffect, useRef } from 'react';

interface PhotoSponsor {
  id: number;
  titre: string;
  description: string | null;
  url_image: string;
  alt_text: string | null;
  categorie: string;
  active: boolean;
  sponsor_id: number;
  sponsor_nom: string;
  created_at: string;
}

const THEME = {
  accent: '#f59e0b', accentLight: '#fef3c7', bg: '#f0f2f5', card: '#ffffff',
  border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a',
};

const API_BASE = '/api/sponsors/photos';
const PAR_PAGE = 50;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AdminPhotosSponsors() {
  const [photos, setPhotos] = useState<PhotoSponsor[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rechercheInput, setRechercheInput] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = () => localStorage.getItem('token');
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const charger = async (pageDemandee: number, rechercheDemandee: string) => {
    setChargement(true);
    try {
      const params = new URLSearchParams({ page: String(pageDemandee), limit: String(PAR_PAGE) });
      if (rechercheDemandee) params.set('search', rechercheDemandee);
      const res = await fetch(`${API_BASE}/admin/liste?${params.toString()}`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setPhotos(data.photos || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      showToast('❌ Erreur lors du chargement des photos', 'error');
    }
    setChargement(false);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setRecherche(rechercheInput.trim()); }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [rechercheInput]);

  useEffect(() => { charger(page, recherche); }, [page, recherche]);

  const supprimer = async (photo: PhotoSponsor) => {
    if (!window.confirm(`Supprimer définitivement la photo #${photo.id} (${photo.sponsor_nom}) ?\n\nCeci retire aussi le fichier du stockage S3.`)) return;
    try {
      const res = await fetch(`${API_BASE}/${photo.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      if (!res.ok) throw new Error();
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setTotal(t => Math.max(0, t - 1));
      showToast('✅ Photo supprimée', 'success');
    } catch {
      showToast('❌ Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="aps-container" style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' }}>🖼️ Photos Sponsors</h1>
        <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Toutes les photos de la banque partagée (modal Unsplash), tous sponsors confondus</p>
      </div>

      <div className="aps-recherche" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          type="text" value={rechercheInput} onChange={e => setRechercheInput(e.target.value)}
          placeholder="🔍 Chercher par ID, titre, catégorie ou nom de sponsor..."
          style={{ flex: '1 1 320px', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 10, fontSize: 13, outline: 'none' }}
        />
        {total > 0 && <span style={{ fontSize: 12, color: THEME.textLight, whiteSpace: 'nowrap' }}>{total} résultat{total > 1 ? 's' : ''}</span>}
      </div>

      {chargement ? (
        <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>
      ) : photos.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: THEME.textLight }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{recherche ? '🔍' : '📭'}</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>{recherche ? 'Aucun résultat pour cette recherche' : 'Aucune photo sponsor pour le moment'}</p>
        </div>
      ) : (
        <>
          <div className="aps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {photos.map(photo => (
              <div key={photo.id} style={{
                background: THEME.card, borderRadius: 12, overflow: 'hidden',
                border: `1.5px solid ${photo.active ? THEME.border : '#fca5a5'}`, opacity: photo.active ? 1 : 0.6,
              }}>
                <div style={{ position: 'relative' }}>
                  <img src={photo.url_image} alt={photo.titre} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                  <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 9, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4 }}>
                    ID #{photo.id}
                  </span>
                  <span style={{ position: 'absolute', top: 6, right: 6, background: THEME.accent, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    {photo.categorie || 'general'}
                  </span>
                </div>
                <div style={{ padding: 10 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.titre || 'Sans titre'}</p>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: THEME.textLight }}>⭐ {photo.sponsor_nom}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: '#aaa' }}>{formatDate(photo.created_at)}</span>
                    {!photo.active && <span style={{ fontSize: 9, fontWeight: 700, color: THEME.danger }}>Inactive</span>}
                  </div>
                  <button onClick={() => supprimer(photo)}
                    style={{ width: '100%', padding: '6px 0', border: 'none', borderRadius: 6, background: '#fee2e2', color: THEME.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="aps-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page <= 1}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page <= 1 ? '#f3f4f6' : '#fff', color: page <= 1 ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'default' : 'pointer' }}>
                ← Précédent
              </button>
              <span style={{ fontSize: 13, color: THEME.textLight }}>Page <strong>{page}</strong> / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page >= totalPages}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${THEME.border}`, background: page >= totalPages ? '#f3f4f6' : '#fff', color: page >= totalPages ? '#ccc' : '#333', fontSize: 13, fontWeight: 600, cursor: page >= totalPages ? 'default' : 'pointer' }}>
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .aps-container { padding: 16px 10px !important; }
          .aps-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important; }
          .aps-recherche input { flex: 1 1 100% !important; }
          .aps-pagination button { padding: 8px 12px !important; font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}

export default AdminPhotosSponsors;