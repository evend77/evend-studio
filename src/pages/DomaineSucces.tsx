// src/pages/DomaineSucces.tsx
// e-Vend Studio — Page de confirmation après achat de domaine
// Accessible via /domaine-succes?domain=monsite.com&session_id=cs_test_xxx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Props {
  gestionnaireId?: number;
}

export default function DomaineSucces({ gestionnaireId }: Props) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const domain = searchParams.get('domain');
  const sessionId = searchParams.get('session_id');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [dnsInstructions, setDnsInstructions] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!domain || !sessionId) {
      setStatus('error');
      setMessage('Paramètres manquants. Veuillez contacter le support.');
      return;
    }

    // Vérifier le statut du paiement
    const verifierPaiement = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/dynadot/verify-payment?session_id=${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setMessage(`✅ Félicitations ! Le domaine ${domain} vous appartient maintenant.`);
          setDnsInstructions(data.dns_instructions || 
            `CNAME → sites.e-vendstudio.ca\nou\nA → 192.0.2.1`
          );
          
          // Démarrer le compte à rebours vers le dashboard
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate('/dashboard');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        } else {
          setStatus('error');
          setMessage(data.message || 'Erreur lors de la vérification du paiement.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erreur de connexion. Veuillez vérifier votre compte.');
      }
    };

    verifierPaiement();
  }, [domain, sessionId, navigate]);

  // ── Affichage ───────────────────────────────────────────────────────────────

  if (status === 'loading') {
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
        <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>Vérification du paiement...</h2>
        <p style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Patientez pendant que nous confirmons votre achat.</p>
        <div style={{
          marginTop: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '4px solid #e5e7eb',
          borderTopColor: '#4F46E5',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'error') {
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
        <div style={{ fontSize: 48, marginBottom: 20 }}>❌</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>Une erreur est survenue</h2>
        <p style={{ fontSize: 14, color: '#888', marginTop: 8, maxWidth: 500, textAlign: 'center' }}>
          {message}
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
            Retourner à Mon domaine
          </button>
          <button
            onClick={() => navigate('/support')}
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
            Contacter le support
          </button>
        </div>
      </div>
    );
  }

  // ── Succès ──────────────────────────────────────────────────────────────────
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
      {/* Confetti / Icône succès */}
      <div style={{
        fontSize: 64,
        marginBottom: 16,
        background: '#ecfdf5',
        padding: '24px',
        borderRadius: '50%',
        display: 'inline-block'
      }}>
        🎉
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', textAlign: 'center' }}>
        Domaine acheté avec succès !
      </h1>
      
      <p style={{ fontSize: 18, fontWeight: 600, color: '#10b981', marginTop: 8 }}>
        {domain}
      </p>

      <p style={{ fontSize: 14, color: '#666', marginTop: 12, maxWidth: 500, textAlign: 'center' }}>
        {message}
      </p>

      {/* Instructions DNS */}
      {dnsInstructions && (
        <div style={{
          marginTop: 24,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 24,
          width: '100%',
          maxWidth: 500
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
            🌐 Configuration DNS
          </h3>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            Pour connecter votre domaine à votre site, configurez ces enregistrements :
          </p>
          <div style={{
            background: '#f8f8f8',
            borderRadius: 8,
            padding: '12px 16px',
            fontFamily: 'monospace',
            fontSize: 13,
            color: '#333',
            whiteSpace: 'pre-wrap'
          }}>
            {dnsInstructions}
          </div>
          <p style={{ fontSize: 12, color: '#999', marginTop: 12 }}>
            ⏱️ La propagation peut prendre jusqu'à 48h.
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate('/mon-domaine')}
          style={{
            padding: '12px 28px',
            background: '#4F46E5',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          📋 Voir mes domaines
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 28px',
            background: 'transparent',
            border: '1.5px solid #e5e7eb',
            borderRadius: 8,
            color: '#666',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          📊 Retour au dashboard
        </button>
      </div>

      {/* Redirection automatique */}
      <p style={{ fontSize: 12, color: '#aaa', marginTop: 24 }}>
        Redirection vers le tableau de bord dans {countdown} seconde{countdown > 1 ? 's' : ''}...
      </p>
    </div>
  );
}