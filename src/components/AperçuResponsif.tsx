// src/components/AperçuResponsif.tsx
// e-Vend Studio — Composant partagé aperçu responsive
// Utilisé dans tous les ConfigTemplate pour switcher PC / Tablette / Mobile
//
// Usage :
//   import AperçuResponsif from '../../components/AperçuResponsif';
//   <AperçuResponsif vendeurId={vendeurId} />

import React, { useState } from 'react';

type Mode = 'desktop' | 'tablette' | 'mobile';

interface Props {
  vendeurId: string;
  couleur?: string; // couleur accent du template (défaut: #c9a96e)
}

const MODES: { id: Mode; icone: string; label: string; largeur: number; echelle: number }[] = [
  { id: 'desktop',  icone: '🖥️',  label: 'PC',       largeur: 1280, echelle: 0.55 },
  { id: 'tablette', icone: '📲',  label: 'Tablette', largeur: 768,  echelle: 0.75 },
  { id: 'mobile',   icone: '📱',  label: 'Mobile',   largeur: 375,  echelle: 0.90 },
];

export default function AperçuResponsif({ vendeurId, couleur = '#c9a96e' }: Props) {
  const [mode, setMode] = useState<Mode>('desktop');
  const [ouvert, setOuvert] = useState(false);

  const modeActif = MODES.find(m => m.id === mode)!;
  // Largeur du conteneur iframe visible
  const largeurConteneur = modeActif.largeur * modeActif.echelle;
  // Hauteur visible de l'aperçu
  const hauteurApercu = mode === 'desktop' ? 520 : 580;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Barre de contrôle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#1a1a1a', borderRadius: ouvert ? '10px 10px 0 0' : 10, border: `1px solid ${couleur}33` }}>

        {/* Bouton toggle aperçu */}
        <button onClick={() => setOuvert(o => !o)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: ouvert ? couleur : '#aaa', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
          <span style={{ fontSize: 16 }}>{ouvert ? '✕' : '👁'}</span>
          {ouvert ? 'Fermer l\'aperçu' : 'Aperçu'}
        </button>

        {/* Switch modes — visible seulement quand ouvert */}
        {ouvert && (
          <div style={{ display: 'flex', gap: 4, background: '#111', borderRadius: 8, padding: 3 }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                title={m.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6, border: 'none',
                  background: mode === m.id ? couleur : 'transparent',
                  color: mode === m.id ? '#fff' : '#666',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 14 }}>{m.icone}</span>
                <span style={{ fontSize: 10 }}>{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Lien ouvrir dans nouvel onglet */}
        <a href={`/site-preview?vendeurId=${vendeurId}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: '#222', border: `1px solid #333`, color: '#888', textDecoration: 'none', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
          ↗ Plein écran
        </a>
      </div>

      {/* Zone aperçu */}
      {ouvert && (
        <div style={{ background: '#111', borderRadius: '0 0 10px 10px', border: `1px solid ${couleur}33`, borderTop: 'none', padding: '16px 0 12px', overflow: 'hidden' }}>

          {/* Label taille */}
          <div style={{ textAlign: 'center', marginBottom: 10, fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>
            {modeActif.icone} {modeActif.label} — {modeActif.largeur}px
          </div>

          {/* Conteneur iframe avec scroll horizontal si besoin */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
            <div style={{
              width: largeurConteneur,
              height: hauteurApercu,
              borderRadius: mode === 'mobile' ? 20 : mode === 'tablette' ? 12 : 8,
              overflow: 'hidden',
              border: mode === 'mobile' ? '6px solid #333' : mode === 'tablette' ? '4px solid #333' : '2px solid #333',
              background: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              position: 'relative',
              flexShrink: 0,
            }}>
              {/* Notch mobile */}
              {mode === 'mobile' && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 6, background: '#333', borderRadius: '0 0 6px 6px', zIndex: 10 }} />
              )}
              <iframe
                src={`/site-preview?vendeurId=${vendeurId}`}
                style={{
                  width: modeActif.largeur,
                  height: Math.round(hauteurApercu / modeActif.echelle),
                  border: 'none',
                  transform: `scale(${modeActif.echelle})`,
                  transformOrigin: 'top left',
                }}
                title="Aperçu du site"
              />
            </div>
          </div>

          {/* Barre de navigation simulée mobile */}
          {mode === 'mobile' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8, padding: '6px 0' }}>
              {['◀', '●', '▼'].map((s, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#444' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}