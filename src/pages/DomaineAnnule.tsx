// src/pages/DomaineAnnule.tsx
// e-Vend Studio — Page quand l'utilisateur annule l'achat

import { useNavigate } from 'react-router-dom';

export default function DomaineAnnule() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fb',
      fontFamily: "'Inter', sans-serif",
      padding: '24px'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Achat annulé</h2>
      <p style={{ fontSize: 14, color: '#888', marginTop: 8, maxWidth: 400, textAlign: 'center' }}>
        Vous avez annulé l'achat du domaine. Aucune transaction n'a été effectuée.
      </p>
      
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={() => navigate('/mon-domaine')}
          style={{
            padding: '10px 24px',
            background: '#4F46E5',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🔍 Retourner à Mon domaine
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 24px',
            background: 'transparent',
            border: '1.5px solid #e5e7eb',
            borderRadius: 8,
            color: '#666',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📊 Dashboard
        </button>
      </div>
    </div>
  );
}