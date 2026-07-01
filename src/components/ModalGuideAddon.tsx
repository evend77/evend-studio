// src/components/ModalGuideAddon.tsx
// Modal d'affichage du guide d'un add-on — côté vendeur

import { useState, useEffect } from 'react';

const API_BASE = (window as any).API_BASE || 'http://localhost:5000/api';

interface Guide {
  addon_id:    string;
  titre:       string;
  emoji:       string;
  description: string;
  contenu:     string;
  updated_at:  string;
}

interface Props {
  addonId:  string;
  addonNom: string;
  onClose:  () => void;
}

export default function ModalGuideAddon({ addonId, addonNom, onClose }: Props) {
  const [guide, setGuide]     = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur]   = useState(false);

  useEffect(() => {
    if (!addonId) return;
    setLoading(true);
    setErreur(false);
    fetch(`${API_BASE}/guides-addons/public/${addonId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setGuide(data.guide))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, [addonId]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '820px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', marginBottom: '40px' }}>

        {/* En-tête */}
        <div style={{ padding: '32px 40px', background: 'linear-gradient(135deg, #1a2436 0%, #2d6a9f 100%)', color: '#fff', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '48px', lineHeight: 1 }}>
              {loading ? '📖' : guide?.emoji || '📖'}
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Guide d'utilisation</p>
              <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, lineHeight: 1.2 }}>
                {loading ? addonNom : guide?.titre || addonNom}
              </h1>
              {guide?.description && <p style={{ margin: 0, fontSize: '14px', opacity: 0.8, lineHeight: 1.5 }}>{guide.description}</p>}
            </div>
          </div>
          {guide?.updated_at && (
            <p style={{ margin: '16px 0 0', fontSize: '11px', opacity: 0.5 }}>
              Mis à jour le {formatDate(guide.updated_at)}
            </p>
          )}
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px 48px', minHeight: '300px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
              <p style={{ margin: 0 }}>Chargement du guide…</p>
            </div>
          ) : erreur ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#1a2332' }}>Guide non disponible</h3>
              <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px', lineHeight: 1.6 }}>
                Le guide pour cet add-on n'est pas encore disponible.<br />
                Consultez la documentation officielle ou contactez le support.
              </p>
              <a href="mailto:support@evend.ca" style={{ display: 'inline-block', padding: '10px 24px', background: '#2d6a9f', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
                📧 Contacter le support
              </a>
            </div>
          ) : guide?.contenu ? (
            <>
              <style>{`
                .guide-modal-contenu h1 { font-size:26px; font-weight:800; margin:0 0 20px; color:#1a2332; border-bottom:3px solid #2d6a9f; padding-bottom:10px; }
                .guide-modal-contenu h2 { font-size:18px; font-weight:700; margin:28px 0 12px; color:#1a2332; padding-bottom:6px; border-bottom:1px solid #e1e4e8; }
                .guide-modal-contenu h3 { font-size:15px; font-weight:700; margin:20px 0 8px; color:#1a2332; }
                .guide-modal-contenu p  { margin:0 0 14px; line-height:1.8; color:#4b5563; font-size:14px; }
                .guide-modal-contenu ul,.guide-modal-contenu ol { margin:0 0 14px; padding-left:24px; }
                .guide-modal-contenu li { margin-bottom:8px; color:#4b5563; line-height:1.7; font-size:14px; }
                .guide-modal-contenu a  { color:#2d6a9f; text-decoration:underline; }
                .guide-modal-contenu strong { color:#1a2332; font-weight:700; }
                .guide-modal-contenu hr { border:none; border-top:1px solid #e1e4e8; margin:24px 0; }
                .guide-modal-contenu img { max-width:100%; border-radius:10px; margin:12px 0; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
                .guide-modal-contenu code { background:#f1f5f9; padding:2px 6px; border-radius:4px; font-family:monospace; font-size:12px; color:#e11d48; }
                .guide-modal-contenu pre { background:#1e293b; color:#e2e8f0; padding:16px; border-radius:10px; overflow-x:auto; font-size:12px; margin:14px 0; }
                .guide-modal-contenu .tip { background:#eff6ff; border-left:4px solid #2d6a9f; padding:14px 18px; border-radius:0 10px 10px 0; margin:16px 0; }
                .guide-modal-contenu .tip * { color:#1d4ed8 !important; }
                .guide-modal-contenu .warning { background:#fffbeb; border-left:4px solid #d97706; padding:14px 18px; border-radius:0 10px 10px 0; margin:16px 0; }
                .guide-modal-contenu .warning * { color:#92400e !important; }
                .guide-modal-contenu table { width:100%; border-collapse:collapse; margin:16px 0; }
                .guide-modal-contenu th { background:#f8fafc; padding:10px 14px; text-align:left; font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; border-bottom:2px solid #e1e4e8; }
                .guide-modal-contenu td { padding:10px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; color:#4b5563; }
              `}</style>
              <div className="guide-modal-contenu" dangerouslySetInnerHTML={{ __html: guide.contenu }} />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📝</p>
              <p>Guide en cours de rédaction…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 40px', borderTop: '1px solid #e1e4e8', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            {guide ? `Guide : ${guide.addon_id}` : ''}
          </p>
          <button onClick={onClose} style={{ padding: '9px 24px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}