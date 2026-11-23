// CHEMIN : src/pages/SiteMaintenanceBoutique.tsx
// e-Vend Studio — Page de maintenance affichée aux visiteurs du site d'un gestionnaire (tous templates).
// Indépendante des templates. Contenu et couleurs configurables dans Configuration → Page maintenance.

import React, { useState } from 'react';

export interface PageMaintenance {
  titre?: string;
  message?: string;
  image_url?: string;
  couleur_fond?: string;
  couleur_texte?: string;
  couleur_accent?: string;
  barre?: boolean;
}

const hexOk = (v: any, d: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d);
const urlSure = (v: any) => (typeof v === 'string' && (/^https?:\/\//i.test(v) || /^\/[^/\\]/.test(v)) ? v : '');

// Mélange la couleur du texte avec le fond (pour le texte secondaire)
function melange(txt: string, fond: string, part: number) {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map(i => Math.round(p(txt, i) * part + p(fond, i) * (1 - part)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export default function SiteMaintenanceBoutique({
  nomBoutique, page, messageFallback, apercu,
}: { nomBoutique?: string; page?: PageMaintenance | null; messageFallback?: string | null; apercu?: boolean }) {
  const fond   = hexOk(page?.couleur_fond, '#0f172a');
  const texte  = hexOk(page?.couleur_texte, '#ffffff');
  const accent = hexOk(page?.couleur_accent, '#f59e0b');
  const titre   = (page?.titre || '').trim() || 'Site en maintenance';
  const message = (page?.message || messageFallback || '').trim()
    || 'Nous effectuons actuellement des améliorations. Nous serons de retour très bientôt.';
  const image = urlSure(page?.image_url);
  const [imgErreur, setImgErreur] = useState(false);
  const nom = (nomBoutique || '').trim();

  return (
    <div style={{
      minHeight: apercu ? undefined : '100vh', background: fond, color: texte, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: apercu ? '40px 16px' : '24px 16px',
      boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    }}>
      <style>{`@keyframes evMaintBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}`}</style>
      <div style={{
        width: '100%', maxWidth: '520px', textAlign: 'center', display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: '18px',
      }}>
        {nom && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '100%' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', background: accent, color: fond,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
              fontSize: '16px', flexShrink: 0,
            }}>{nom.charAt(0).toUpperCase()}</div>
            <span style={{
              fontSize: '16px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{nom}</span>
          </div>
        )}

        {image && !imgErreur ? (
          <img src={image} alt="" onError={() => setImgErreur(true)}
            style={{ maxWidth: '100%', width: '260px', maxHeight: '200px', objectFit: 'contain', borderRadius: '12px' }} />
        ) : (
          <div style={{ fontSize: '56px', lineHeight: 1 }}>⚙️</div>
        )}

        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-word' }}>
          {titre}
        </h1>

        <p style={{
          margin: 0, fontSize: '15px', lineHeight: 1.6, maxWidth: '420px',
          color: melange(texte, fond, 0.72), whiteSpace: 'pre-line', wordBreak: 'break-word',
        }}>{message}</p>

        {page?.barre !== false && (
          <div style={{
            width: '140px', height: '4px', borderRadius: '4px', overflow: 'hidden',
            background: melange(texte, fond, 0.12), marginTop: '4px',
          }}>
            <div style={{ width: '40%', height: '100%', background: accent, animation: 'evMaintBar 1.8s ease-in-out infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}