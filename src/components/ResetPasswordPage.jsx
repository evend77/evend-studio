import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Vérifier la validité du token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Lien de réinitialisation invalide ou manquant');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(
          `https://evend-multivendeur-api.onrender.com/api/auth/verify-reset-token/${token}`
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setTokenValid(true);
        } else {
          setError(data.message || 'Lien de réinitialisation invalide ou expiré');
        }
      } catch (err) {
        setError('Erreur lors de la vérification du lien');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🟢 1 - FORMULAIRE SOUMIS");
    console.log("🟢 2 - Token:", token);
    console.log("🟢 3 - newPassword:", newPassword);
    console.log("🟢 4 - confirmPassword:", confirmPassword);
    
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      console.log("🔴 ERREUR: mots de passe différents");
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      console.log("🔴 ERREUR: mot de passe trop court");
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      console.log("🟢 5 - Envoi de la requête fetch...");
      const response = await fetch(
        'https://evend-multivendeur-api.onrender.com/api/auth/reset-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword, confirmPassword }),
        }
      );
      
      console.log("🟢 6 - Réponse reçue, status:", response.status);
      const data = await response.json();
      console.log("🟢 7 - Data:", data);

      if (response.ok && data.success) {
        setMessage(data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (err) {
      console.error("🔴 ERREUR CATCH:", err);
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔐</div>
          <p>Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '16px',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '12px', fontSize: '20px' }}>Lien invalide ou expiré</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#2d6a9f',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '20px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a2332', marginBottom: '8px' }}>
            Réinitialiser votre mot de passe
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Créez un nouveau mot de passe sécurisé
          </p>
        </div>

        {message && (
          <div style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            color: '#15803d',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            ✅ {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Nouveau mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 16px',
                  border: '2px solid #e1e4e8',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#2d6a9f'}
                onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#374151',
              marginBottom: '6px',
            }}>
              Confirmer le mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e4e8',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2d6a9f'}
              onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#9ca3af' : '#2d6a9f',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '⏳ Réinitialisation en cours...' : '🔑 Réinitialiser le mot de passe'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}