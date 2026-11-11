// CHEMIN : src/pages/gestionnaire/BoutiqueModale.tsx
// e-Vend Studio — Fenêtre de message / confirmation dans l'application (jamais de popup du navigateur).
// Partagé par les pages Boutique* (templates solo).

import React from 'react';

interface Props {
  type: 'erreur' | 'succes' | 'confirmer';
  titre?: string;
  message: string;
  accent?: string;
  enCours?: boolean;
  texteConfirmer?: string;
  texteFermer?: string;
  /** Bouton d'action en plus de « Fermer » (ex. « Voir mon plan ») */
  actionSecondaire?: { texte: string; onClick: () => void };
  onConfirmer?: () => void;
  onFermer: () => void;
}

export default function BoutiqueModale({ type, titre, message, accent, enCours, texteConfirmer, texteFermer, actionSecondaire, onConfirmer, onFermer }: Props) {
  const couleur = accent || '#4f46e5';
  const icone = type === 'succes' ? '✅' : type === 'erreur' ? '⚠️' : '❓';
  const fond = type === 'succes' ? '#dcfce7' : type === 'erreur' ? '#fee2e2' : '#e0e7ff';
  const titreDefaut = type === 'succes' ? 'Succès' : type === 'erreur' ? 'Erreur' : 'Confirmation';
  return (
    <div onClick={onFermer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: 20 }}>
      <div role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, maxWidth: 440, width: '100%', padding: '28px 24px 22px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, background: fond }}>{icone}</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 19, color: '#1a2332' }}>{titre || titreDefaut}</h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#374151', lineHeight: 1.55, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {type === 'confirmer' ? (
            <>
              <button onClick={onFermer} disabled={enCours} style={{ padding: '10px 22px', border: '1px solid #e1e4e8', borderRadius: 9, background: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{texteFermer || 'Annuler'}</button>
              <button onClick={onConfirmer} disabled={enCours} style={{ padding: '10px 22px', border: 'none', borderRadius: 9, background: couleur, color: '#fff', fontSize: 14, fontWeight: 700, cursor: enCours ? 'wait' : 'pointer' }}>{enCours ? '⏳…' : (texteConfirmer || 'Confirmer')}</button>
            </>
          ) : (
            <>
              {actionSecondaire && (
                <button onClick={actionSecondaire.onClick} style={{ padding: '10px 22px', border: 'none', borderRadius: 9, background: couleur, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{actionSecondaire.texte}</button>
              )}
              <button onClick={onFermer} style={{ padding: '10px 26px', border: actionSecondaire ? '1px solid #e1e4e8' : 'none', borderRadius: 9, background: actionSecondaire ? '#fff' : (type === 'succes' ? couleur : '#dc2626'), color: actionSecondaire ? '#1a2332' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{texteFermer || 'Fermer'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}