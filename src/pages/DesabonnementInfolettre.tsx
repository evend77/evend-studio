// src/pages/DesabonnementInfolettre.tsx
// Page publique liée depuis les courriels de l'infolettre :
//   https://e-vendstudio.ca/desabonnement?email=xxx&token=yyy
//
// ⚠️ IMPORTANT : cette page ne fait RIEN au chargement. Elle affiche juste une
// confirmation. C'est seulement le CLIC sur le bouton qui déclenche le vrai
// désabonnement (appel DELETE /api/infolettre). Ça protège contre les scanners de
// sécurité des boîtes courriel (Outlook Safe Links, Proofpoint, etc.) qui
// « pré-cliquent » tous les liens d'un courriel automatiquement.

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LogoStudio from '../components/LogoStudio';

const API_BASE = '/api';

export default function DesabonnementInfolettre() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  const [statut, setStatut] = useState<'attente' | 'chargement' | 'succes' | 'erreur'>('attente');
  const [message, setMessage] = useState('');

  const lienInvalide = !email || !token;

  // Page sans intérêt pour les moteurs de recherche
  useEffect(() => {
    const ancien = document.title;
    document.title = 'Désabonnement — e-Vend Studio';
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.title = ancien; meta.remove(); };
  }, []);

  const confirmerDesabonnement = async () => {
    setStatut('chargement');
    try {
      const r = await fetch(`${API_BASE}/infolettre`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const data = await r.json().catch(() => ({} as any));
      if (r.ok) {
        setStatut('succes');
        setMessage(data.message || 'Vous avez été désabonné(e) avec succès.');
      } else {
        setStatut('erreur');
        setMessage(data.error || 'Ce lien de désabonnement est invalide.');
      }
    } catch {
      setStatut('erreur');
      setMessage('Erreur de connexion au serveur. Réessayez plus tard.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'radial-gradient(ellipse at 30% 50%, rgba(30,58,95,0.6) 0%, transparent 60%), #060d1f',
      fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
        padding: 32, maxWidth: 440, width: '100%', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <LogoStudio />
        </div>

        {lienInvalide ? (
          <>
            <p style={{ fontSize: 15, color: '#f87171', fontWeight: 700, marginTop: 24 }}>Lien invalide</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
              Ce lien de désabonnement est incomplet ou incorrect.
            </p>
          </>
        ) : statut === 'attente' ? (
          <>
            <p style={{ fontSize: 15, marginTop: 24 }}>
              Voulez-vous vous désabonner de l&rsquo;infolettre e-Vend Studio ?
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '8px 0 22px', wordBreak: 'break-all' }}>{email}</p>
            <button
              onClick={confirmerDesabonnement}
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 26px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Oui, me désabonner
            </button>
          </>
        ) : statut === 'chargement' ? (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 24 }}>⏳ Traitement en cours…</p>
        ) : (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, marginTop: 24, color: statut === 'succes' ? '#4ade80' : '#f87171' }}>
              {statut === 'succes' ? '✅' : '❌'} {message}
            </p>
            <a href="/" style={{ display: 'inline-block', marginTop: 18, color: '#fbbf24', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              ← Retour à e-Vend Studio
            </a>
          </>
        )}
      </div>
    </div>
  );
}