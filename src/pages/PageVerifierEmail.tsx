// src/pages/PageVerifierEmail.tsx
// Page publique atteinte via le lien du courriel de vérification (modèle #3).
// Le lien envoyé est de la forme /verifier-email?token=XXXX

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API_BASE = '/api';

type Etat = 'chargement' | 'succes' | 'erreur';

export default function PageVerifierEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [etat, setEtat]         = useState<Etat>('chargement');
  const [message, setMessage]   = useState('');

  useEffect(() => {
    if (!token) {
      setEtat('erreur');
      setMessage('Lien de vérification incomplet.');
      return;
    }

    fetch(`${API_BASE}/gestionnaires/verifier-email/${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || 'Erreur lors de la vérification.');
        return data;
      })
      .then(data => {
        setEtat('succes');
        setMessage(data.message || 'Adresse courriel vérifiée avec succès !');

        // Si l'utilisateur a une session locale, on met à jour son statut
        // pour que la bannière disparaisse sans attendre le prochain fetch /moi.
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const user = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...user, email_verifie: true }));
          }
        } catch { /* silencieux */ }
      })
      .catch(err => {
        setEtat('erreur');
        setMessage(err.message || 'Ce lien de vérification est invalide ou a expiré.');
      });
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '20px', padding: '40px 32px',
        maxWidth: '420px', width: '100%', textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          fontSize: 30, fontWeight: 800,
          background: 'linear-gradient(135deg,#c9a96e,#e8c87a)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 24,
        }}>
          e-Vend Studio
        </div>

        {etat === 'chargement' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Vérification en cours…</p>
          </>
        )}

        {etat === 'succes' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Courriel vérifié !</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 28px' }}>{message}</p>
            <Link to="/dashboard" style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'linear-gradient(135deg,#c9a96e,#a07840)', borderRadius: '10px',
              color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
              Retourner à mon tableau de bord →
            </Link>
          </>
        )}

        {etat === 'erreur' && (
          <>
            <div style={{ fontSize: 44, marginBottom: 16 }}>❌</div>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Lien invalide</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 28px' }}>{message}</p>
            <Link to="/dashboard" style={{
              display: 'inline-block', padding: '12px 28px',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: 14, textDecoration: 'none',
            }}>
              Retourner au tableau de bord pour en redemander un →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}