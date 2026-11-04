// src/components/InscriptionInfolettre.tsx
// Section « Abonnez-vous à notre infolettre » du bas de page — même formulaire et même rendu que sur e-Vend.
// Envoie l'adresse à POST /api/infolettre. La propriété « source » indique d'où vient l'inscription
// (par défaut : footer_accueil, comme sur e-Vend).
//
// Utilisation (dans le bas de page, à l'intérieur du conteneur flex) :   <InscriptionInfolettre source="footer_accueil" />

import { useState } from 'react';

const API_BASE = '/api';

export default function InscriptionInfolettre({ source = 'footer_accueil' }: { source?: string }) {
  const [infolettreEmail, setInfolettreEmail] = useState('');
  const [infolettreStatut, setInfolettreStatut] = useState<'idle' | 'loading' | 'succes' | 'erreur'>('idle');
  const [infolettreMessage, setInfolettreMessage] = useState('');

  const handleInfolettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (infolettreStatut === 'loading') return;
    setInfolettreStatut('loading');
    setInfolettreMessage('');
    try {
      const res = await fetch(`${API_BASE}/infolettre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: infolettreEmail, source }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInfolettreStatut('erreur');
        setInfolettreMessage(data.error || 'Une erreur est survenue');
        return;
      }
      setInfolettreStatut('succes');
      setInfolettreMessage(data.deja_inscrit ? 'Vous êtes déjà inscrit(e) ✔' : 'Merci ! Vous êtes inscrit(e) ✔');
      setInfolettreEmail('');
    } catch {
      setInfolettreStatut('erreur');
      setInfolettreMessage('Une erreur est survenue, réessayez plus tard');
    }
  };

  return (
    <>
      <style>{`.sv-infolettre-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(251,191,36,0.4); }`}</style>
      <div style={{ flexBasis: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '24px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '420px' }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: "'Syne', sans-serif" }}>Abonnez-vous à notre infolettre</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Recevez nos nouveautés, conseils et offres e-Vend Studio.</p>
        </div>
        <form onSubmit={handleInfolettre} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            placeholder="Votre adresse courriel"
            aria-label="Votre adresse courriel"
            value={infolettreEmail}
            onChange={e => setInfolettreEmail(e.target.value)}
            style={{ padding: '11px 16px', borderRadius: '999px', minWidth: '240px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
          />
          <button
            type="submit"
            className="sv-infolettre-btn"
            disabled={infolettreStatut === 'loading'}
            style={{ padding: '11px 24px', borderRadius: '999px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', opacity: infolettreStatut === 'loading' ? 0.6 : 1 }}
          >
            {infolettreStatut === 'loading' ? '...' : "S'abonner"}
          </button>
        </form>
        {infolettreMessage && (
          <p style={{ flexBasis: '100%', fontSize: '13px', margin: 0, color: infolettreStatut === 'erreur' ? '#f87171' : '#4ade80' }}>
            {infolettreMessage}
          </p>
        )}
      </div>
    </>
  );
}