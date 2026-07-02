/**
 * StudioGestionPhotosGestionnaire.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/StudioGestionPhotosGestionnaire.tsx
 *
 * Gestionnaire de photos pour le site du vendeur.
 * Photos hébergées sur AWS S3 — max 25 photos par site.
 * ⚠️ Ces photos sont pour le site uniquement, PAS pour les produits/annonces.
 *
 * Routes API :
 *   GET    /api/studio/photos-gestionnaire/:gestionnaireId          → liste
 *   POST   /api/studio/photos-gestionnaire/:gestionnaireId/upload   → uploader
 *   DELETE /api/studio/photos-gestionnaire/:gestionnaireId/:id      → supprimer
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';
const MAX_PHOTOS = 25;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Photo {
  id:         number;
  url:        string;
  s3_key:     string;
  nom:        string;
  taille:     number;
  type:       string;
  created_at: string;
}

// ─── Palette Studio ───────────────────────────────────────────────────────────
const C = {
  bg:          '#f4f6f8',
  card:        '#ffffff',
  border:      '#e2e8f0',
  gold:        '#c9a96e',
  goldLight:   'rgba(201,169,110,0.12)',
  green:       '#10b981',
  greenLight:  'rgba(16,185,129,0.10)',
  red:         '#ef4444',
  redLight:    'rgba(239,68,68,0.10)',
  orange:      '#f59e0b',
  orangeLight: 'rgba(245,158,11,0.10)',
  text:        '#1e293b',
  textLight:   '#64748b',
  textXLight:  '#94a3b8',
  border2:     '#cbd5e1',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      background: type === 'ok' ? C.green : C.red, color: '#fff',
      padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
      zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap',
    }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

// ─── Barre de quota ───────────────────────────────────────────────────────────
function QuotaBarre({ total, max }: { total: number; max: number }) {
  const pct     = Math.min(100, (total / max) * 100);
  const couleur = pct >= 100 ? C.red : pct >= 80 ? C.orange : C.green;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1, height: '8px', background: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: couleur, borderRadius: '4px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color: couleur, whiteSpace: 'nowrap' }}>
        {total} / {max}
      </span>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface Props { gestionnaireId: number; }

export default function StudioGestionPhotosGestionnaire({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');

  const [photos, setPhotos]       = useState<Photo[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId]   = useState<number | null>(null);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [suppression, setSuppression] = useState<number | null>(null);
  const [photoZoom, setPhotoZoom] = useState<Photo | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const quotaAtteint = total >= MAX_PHOTOS;

  // ── Charger ──────────────────────────────────────────────────────────────
  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/studio/photos-gestionnaire/${gestionnaireId}`, {
        credentials: 'include', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPhotos(data.photos || []);
      setTotal(data.total || 0);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [gestionnaireId, token]);

  useEffect(() => { charger(); }, [charger]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Upload ────────────────────────────────────────────────────────────────
  async function uploadPhoto(file: File) {
    if (quotaAtteint) {
      setToast({ msg: `Quota de ${MAX_PHOTOS} photos atteint. Supprimez des photos pour continuer.`, type: 'err' });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${API_BASE}/studio/photos-gestionnaire/${gestionnaireId}/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || 'Erreur lors de l\'upload.', type: 'err' });
        return;
      }
      setPhotos(prev => [data.photo, ...prev]);
      setTotal(data.total);
      setToast({ msg: 'Photo ajoutée avec succès !', type: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message || 'Erreur lors de l\'upload.', type: 'err' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Suppression ───────────────────────────────────────────────────────────
  async function supprimerPhoto(id: number) {
    setSuppression(id);
    try {
      const res = await fetch(`${API_BASE}/studio/photos-gestionnaire/${gestionnaireId}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPhotos(prev => prev.filter(p => p.id !== id));
      setTotal(data.total);
      setToast({ msg: 'Photo supprimée.', type: 'ok' });
    } catch {
      setToast({ msg: 'Erreur lors de la suppression.', type: 'err' });
    } finally {
      setSuppression(null);
    }
  }

  // ── Copier URL ────────────────────────────────────────────────────────────
  async function copierUrl(url: string, id: number) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTaille = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  // ── Chargement ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🖼️</div>
        <p style={{ margin: 0, fontSize: '14px' }}>Chargement de vos photos…</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .photo-card:hover .photo-overlay { opacity: 1 !important; }
        .photo-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Modal zoom ── */}
      {photoZoom && (
        <div
          onClick={() => setPhotoZoom(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', cursor: 'zoom-out' }}
        >
          <img src={photoZoom.url} alt={photoZoom.nom} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setPhotoZoom(null)} style={{ position: 'fixed', top: '20px', right: '20px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ══ En-tête ══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>
            🖼️
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>Mes photos de site</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Images hébergées sur AWS S3 — utilisables dans votre site</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => {
              const files = Array.from(e.target.files || []);
              files.forEach(f => uploadPhoto(f));
            }}
          />
          <button
            onClick={() => !quotaAtteint && fileInputRef.current?.click()}
            disabled={uploading || quotaAtteint}
            style={{
              padding: '10px 22px',
              background: quotaAtteint ? '#cbd5e1' : uploading ? '#e9ecef' : 'linear-gradient(135deg, #c9a96e, #a07840)',
              border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
              color: quotaAtteint || uploading ? '#94a3b8' : '#fff',
              cursor: quotaAtteint || uploading ? 'not-allowed' : 'pointer',
              boxShadow: quotaAtteint || uploading ? 'none' : '0 4px 12px rgba(201,169,110,0.3)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            {uploading
              ? <><div style={{ width: '14px', height: '14px', border: '2px solid #94a3b8', borderTop: '2px solid #c9a96e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Upload…</>
              : '＋ Ajouter des photos'
            }
          </button>
        </div>
      </div>

      {/* ══ Bandeau avertissement ══ */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0f1e 100%)', border: `1px solid rgba(201,169,110,0.25)`, borderRadius: '16px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ fontSize: '22px', flexShrink: 0 }}>⚠️</div>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          <strong style={{ color: C.gold }}>Ces photos sont pour votre site uniquement</strong> — logos, bannières, photos d'équipe, galerie, etc.
          Les photos de vos <strong style={{ color: 'rgba(255,255,255,0.85)' }}>produits et annonces</strong> se gèrent dans la page de création d'annonces.
        </p>
      </div>

      {/* ══ Quota ══ */}
      <div style={{ background: C.card, border: `1px solid ${quotaAtteint ? C.red : C.border}`, borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', boxShadow: quotaAtteint ? `0 0 0 2px ${C.redLight}` : '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.text }}>
              Espace photos utilisé
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>
              {quotaAtteint
                ? '🔴 Quota atteint — supprimez des photos pour en ajouter de nouvelles'
                : `${MAX_PHOTOS - total} emplacement${MAX_PHOTOS - total > 1 ? 's' : ''} restant${MAX_PHOTOS - total > 1 ? 's' : ''}`
              }
            </p>
          </div>
          {quotaAtteint && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.red, background: C.redLight, padding: '4px 12px', borderRadius: '20px', border: `1px solid ${C.red}` }}>
              🔴 Quota de {MAX_PHOTOS} photos atteint
            </span>
          )}
        </div>
        <QuotaBarre total={total} max={MAX_PHOTOS} />
      </div>

      {/* ══ Grille de photos ══ */}
      {photos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: '20px', padding: '60px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldLight; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
        >
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🖼️</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: C.text }}>Aucune photo pour l'instant</h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: C.textLight }}>
            Ajoutez des images pour votre site — logos, bannières, photos d'équipe, galerie…
          </p>
          <div style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '14px' }}>
            ＋ Ajouter des photos
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              className="photo-card"
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.2s', position: 'relative' }}
            >
              {/* Image */}
              <div style={{ height: '160px', background: '#f8fafc', position: 'relative', overflow: 'hidden', cursor: 'zoom-in' }} onClick={() => setPhotoZoom(photo)}>
                <img
                  src={photo.url}
                  alt={photo.nom}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" font-size="30">🖼️</text></svg>'; }}
                />
                {/* Overlay zoom */}
                <div className="photo-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
                  <span style={{ color: '#fff', fontSize: '28px' }}>🔍</span>
                </div>
              </div>

              {/* Infos */}
              <div style={{ padding: '12px' }}>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={photo.nom}>
                  {photo.nom}
                </p>
                <p style={{ margin: '0 0 10px', fontSize: '11px', color: C.textXLight }}>
                  {formatTaille(photo.taille)} · {formatDate(photo.created_at)}
                </p>

                {/* URL + copier */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={photo.url}
                    readOnly
                    style={{ flex: 1, fontSize: '10px', padding: '6px 8px', border: `1px solid ${C.border}`, borderRadius: '7px', background: '#f8fafc', color: C.textLight, outline: 'none', minWidth: 0 }}
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => copierUrl(photo.url, photo.id)}
                    title="Copier l'URL"
                    style={{
                      padding: '6px 10px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
                      border: `1px solid ${copiedId === photo.id ? C.green : C.border}`,
                      background: copiedId === photo.id ? C.greenLight : '#fff',
                      color: copiedId === photo.id ? C.green : C.textLight,
                      transition: 'all 0.15s',
                    }}
                  >
                    {copiedId === photo.id ? '✓' : '📋'}
                  </button>
                </div>

                {/* Supprimer */}
                <button
                  onClick={() => supprimerPhoto(photo.id)}
                  disabled={suppression === photo.id}
                  style={{
                    width: '100%', padding: '7px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    border: `1px solid ${C.red}`, background: suppression === photo.id ? C.redLight : '#fff',
                    color: C.red, cursor: suppression === photo.id ? 'wait' : 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (suppression !== photo.id) e.currentTarget.style.background = C.redLight; }}
                  onMouseLeave={e => { if (suppression !== photo.id) e.currentTarget.style.background = '#fff'; }}
                >
                  {suppression === photo.id ? '⏳ Suppression…' : '🗑️ Supprimer'}
                </button>
              </div>
            </div>
          ))}

          {/* Carte ajout rapide */}
          {!quotaAtteint && (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${C.border}`, borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '240px', cursor: 'pointer', transition: 'all 0.15s', gap: '8px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ fontSize: '32px' }}>＋</div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: C.textLight }}>Ajouter une photo</p>
              <p style={{ margin: 0, fontSize: '11px', color: C.textXLight }}>JPG, PNG, WebP, GIF — max 10 Mo</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}