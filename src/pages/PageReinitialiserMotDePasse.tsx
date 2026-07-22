// src/pages/PageReinitialiserMotDePasse.tsx
// Page publique atteinte via le lien du courriel de réinitialisation (modèle #7).
// Lien de la forme : /reinitialiser-mot-de-passe?token=XXXX&type=admin|gestionnaire

import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const API_BASE = '/api';

export default function PageReinitialiserMotDePasse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const type = searchParams.get('type') === 'admin' ? 'admin' : 'gestionnaire';

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');

    if (motDePasse.length < 8) { setErreur('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (motDePasse !== confirmation) { setErreur('Les mots de passe ne correspondent pas.'); return; }
    if (!token) { setErreur('Lien invalide.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type, nouveau_mot_de_passe: motDePasse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur.');
      setSucces(true);
    } catch (err: any) {
      setErreur(err.message || 'Ce lien est invalide ou a expiré.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '20px', padding: '40px 32px',
        maxWidth: '420px', width: '100%', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          fontSize: 26, fontWeight: 800, textAlign: 'center', marginBottom: 24,
          background: 'linear-gradient(135deg,#c9a96e,#e8c87a)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          e-Vend Studio
        </div>

        {succes ? (
          <>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>✅</div>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>
              Mot de passe changé !
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', margin: '0 0 24px' }}>
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Link to="/login" style={{
              display: 'block', textAlign: 'center', padding: '12px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#c9a96e,#a07840)', color: '#fff', fontWeight: 700,
              fontSize: 14, textDecoration: 'none',
            }}>
              Aller à la connexion →
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 16px', textAlign: 'center' }}>
              Nouveau mot de passe
            </h1>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>
                Nouveau mot de passe
              </label>
              <input
                type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }}
              />
            </div>
            {erreur && (
              <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 16px', textAlign: 'center' }}>❌ {erreur}</p>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: loading ? '#6b6b6b' : 'linear-gradient(135deg,#c9a96e,#a07840)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? '⏳ Envoi…' : '🔑 Changer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}