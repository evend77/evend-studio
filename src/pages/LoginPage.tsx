// src/pages/LoginPage.tsx
// e-Vend Studio - Page de connexion (Vendeur + Admin uniquement)

import { useState, useEffect, useRef } from 'react';

const API_URL = '';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabType = 'gestionnaire' | 'administration';

interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  title: string;
  subtitle: string;
  features: string[];
  signupLabel?: string;
  signupUrl?: string;
}

// ─── Config des onglets (SEULEMENT VENDEUR + ADMIN) ─────────────────────────
const TABS: TabConfig[] = [
  {
    id: 'gestionnaire',
    label: 'Gestionnaire',
    icon: '🛍️',
    accent: '#3b82f6',
    accentDark: '#1e40af',
    accentLight: '#dbeafe',
    title: 'Espace Gestionnaire e-Vend Studio',
    subtitle: 'Gérez votre boutique et vos ventes',
    features: [
      'Tableau de bord complet',
      'Gestion des produits & commandes',
      'Rapports financiers détaillés',
      'Messagerie intégrée',
    ],
    signupLabel: "S'inscrire comme gestionnaire",
    signupUrl: '/inscription',
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: '⚙️',
    accent: '#8b5cf6',
    accentDark: '#4c1d95',
    accentLight: '#ede9fe',
    title: 'Administration e-Vend Studio',
    subtitle: 'Accès restreint au personnel autorisé',
    features: [
      'Gestion de la plateforme',
      'Validation des gestionnaires',
      'Rapports et statistiques',
      'Configuration système',
    ],
  },
];

// ─── Composant œil mot de passe ───────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Modal Mot de passe oublié ────────────────────────────────────────────────
function ForgotPasswordModal({
  open,
  onClose,
  accent,
  accentDark,
  activeTab,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
  accentDark: string;
  activeTab: TabType;
}) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setSent(false);
      setEmail('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          userType: activeTab,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
      } else {
        setError(data.message || 'Erreur lors de la demande');
      }
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 30, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)`,
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${accentDark}, ${accent})`,
            padding: '28px 32px 24px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-30px',
              left: '20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')
            }
          >
            ✕
          </button>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔐</div>
          <h3
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Mot de passe oublié?
          </h3>
          <p
            style={{
              margin: '6px 0 0',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
            }}
          >
            Un lien de réinitialisation sera envoyé à votre adresse e-mail.
          </p>
        </div>

        <div style={{ background: '#0f1729', padding: '28px 32px 32px' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
              <h4
                style={{
                  color: '#fff',
                  margin: '0 0 8px',
                  fontSize: '18px',
                }}
              >
                E-mail envoyé!
              </h4>
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '14px',
                  margin: '0 0 24px',
                }}
              >
                Vérifiez votre boîte de réception et suivez le lien pour
                réinitialiser votre mot de passe.
              </p>
              <button
                onClick={onClose}
                style={{
                  background: `linear-gradient(135deg, ${accentDark}, ${accent})`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 32px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '28px' }}>
                <label
                  style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.8px',
                    marginBottom: '8px',
                  }}
                >
                  ✉ Adresse e-mail <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box' as const,
                    padding: '13px 16px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = accent;
                    e.target.style.boxShadow = `0 0 0 3px ${accent}33`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(220,38,38,0.2)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '16px',
                    color: '#fca5a5',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '13px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '13px',
                    background: loading
                      ? 'rgba(255,255,255,0.1)'
                      : `linear-gradient(135deg, ${accentDark}, ${accent})`,
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    boxShadow: loading ? 'none' : `0 4px 20px ${accent}55`,
                  }}
                >
                  {loading ? '⏳ Envoi en cours...' : '📧 Envoyer le lien'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Déblocage Compte (OTP) ─────────────────────────────────────────────
function UnlockAccountModal({
  open,
  onClose,
  accent,
  email,
  userType,
  onUnlockSuccess,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
  email: string;
  userType: TabType;
  onUnlockSuccess: () => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setCode('');
      setError('');
      setMessage('');
    }
  }, [open]);

  const handleUnlock = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/unlock-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType, code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setTimeout(() => {
          onUnlockSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Code invalide');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/resend-unlock-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('Un nouveau code a été envoyé à votre adresse email.');
      } else {
        setError(data.message || 'Erreur lors du renvoi');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && !loading) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '450px',
          width: '100%',
          backgroundColor: '#0f1729',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #991b1b, #dc2626)',
          padding: '24px 28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔒</div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 700 }}>
            Compte temporairement bloqué
          </h3>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            Trop de tentatives de connexion échouées
          </p>
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
            Un code de déblocage a été envoyé à votre adresse email.<br />
            Saisissez-le ci-dessous pour débloquer votre compte.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '8px',
            }}>
              Code de déblocage
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                letterSpacing: '4px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(220,38,38,0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '16px',
              color: '#fca5a5',
              fontSize: '13px',
              textAlign: 'center',
            }}>
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div style={{
              backgroundColor: 'rgba(16,185,129,0.2)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '16px',
              color: '#6ee7b7',
              fontSize: '13px',
              textAlign: 'center',
            }}>
              ✅ {message}
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={loading || !code}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || !code ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading || !code ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
            }}
          >
            {loading ? '⏳ Vérification...' : '🔓 Débloquer mon compte'}
          </button>

          <button
            onClick={handleResendCode}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            📧 Renvoyer le code
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Compte expiré (essai terminé, paiement requis) ────────────────────
function CompteExpireModal({
  open,
  onClose,
  accent,
  message,
  urlPaiement,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
  message: string;
  urlPaiement: string | null;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5, 10, 30, 0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '440px', borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        background: '#0d1428',
      }}>
        <div style={{
          background: `linear-gradient(135deg, #92400e, #f59e0b)`,
          padding: '28px 32px 24px', position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: '32px', height: '32px', color: '#fff', fontSize: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏳</div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 700, fontFamily: "'Sora', sans-serif" }}>
            Période d'essai terminée
          </h3>
        </div>

        <div style={{ padding: '28px 32px' }}>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            {message}
          </p>

          {urlPaiement ? (
            <button
              onClick={() => { window.location.href = urlPaiement; }}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: `linear-gradient(135deg, #92400e, ${accent})`,
                color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                fontFamily: "'Sora', sans-serif",
              }}
            >
              💳 Configurer mon paiement
            </button>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center' }}>
              Veuillez contacter le support pour régulariser votre compte.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Vérification 2FA ───────────────────────────────────────────────────
function Verify2FAModal({
  open,
  onClose,
  userId,
  userType,
  onVerifySuccess,
}: {
  open: boolean;
  onClose: () => void;
  userId: number;
  userType: TabType;
  onVerifySuccess: (token: string, user: any) => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setCode('');
      setError('');
    }
  }, [open]);

  const getApiUserType = () => {
    if (userType === 'administration') return 'admin';
    return userType;
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    const apiUserType = getApiUserType();

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code, userType: apiUserType }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onVerifySuccess(data.token, data.user);
        onClose();
      } else {
        setError(data.message || 'Code invalide ou expiré');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && !loading) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '450px',
          width: '100%',
          backgroundColor: '#0f1729',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
          padding: '24px 28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 700 }}>
            Authentification à deux facteurs
          </h3>
          <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            Un code de vérification a été envoyé à votre adresse email
          </p>
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
            Saisissez le code à 6 chiffres reçu par email pour compléter votre connexion.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '8px',
            }}>
              Code de vérification
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                letterSpacing: '4px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(220,38,38,0.2)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '16px',
              color: '#fca5a5',
              fontSize: '13px',
              textAlign: 'center',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || !code}
            style={{
              width: '100%',
              padding: '14px',
              background: loading || !code ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading || !code ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Vérification...' : '✅ Vérifier et me connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal LoginPage ────────────────────────────────────────────
export default function LoginPage({
  onLogin,
}: {
  onLogin?: (type: string, user?: any, token?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('gestionnaire');
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [footerText, setFooterText] = useState(
    `Copyright ${new Date().getFullYear()} e-Vend Studio · Tous droits réservés`
  );
  const [nomPlateforme, setNomPlateforme] = useState('e-Vend Studio');
  const [modeMaintenance, setModeMaintenance] = useState(false);
  const [messageMaintenance, setMessageMaintenance] = useState('');
  const [bloquerInscriptionGestionnaire, setBloquerInscriptionGestionnaire] = useState(false);
  const [banniereLoginActive, setBanniereLoginActive] = useState(false);
  const [banniereLoginMessage, setBanniereLoginMessage] = useState('');
  const [banniereLoginCouleurBg, setBanniereLoginCouleurBg] = useState('#1e3a5f');
  const [banniereLoginCouleurTx, setBanniereLoginCouleurTx] = useState('#ffffff');
  const [compteExpireOpen, setCompteExpireOpen] = useState(false);
  const [compteExpireMessage, setCompteExpireMessage] = useState('');
  const [compteExpireUrl, setCompteExpireUrl] = useState<string | null>(null);
  const [banniereLoginHauteur, setBanniereLoginHauteur] = useState('36');
  const [banniereLoginPolice, setBanniereLoginPolice] = useState('13');

  // États pour les modals
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockUserType, setUnlockUserType] = useState<TabType>('gestionnaire');
  const [verify2FAModalOpen, setVerify2FAModalOpen] = useState(false);
  const [verify2FAUserId, setVerify2FAUserId] = useState<number | null>(null);
  const [verify2FAUserType, setVerify2FAUserType] = useState<TabType>('gestionnaire');

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Chargement configuration publique
  useEffect(() => {
    fetch(
      `${API_URL}/api/admin/configuration/config-publique`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.footer_text) setFooterText(data.footer_text.replace('($current_year)', new Date().getFullYear().toString()));
        if (data?.nom_plateforme) setNomPlateforme(data.nom_plateforme);
        if (data?.mode_maintenance !== undefined)
          setModeMaintenance(data.mode_maintenance);
        if (data?.message_maintenance)
          setMessageMaintenance(data.message_maintenance);
        if (data?.bloquer_inscription_gestionnaire !== undefined)
          setBloquerInscriptionGestionnaire(data.bloquer_inscription_gestionnaire);
        if (data?.banniere_login_active !== undefined)
          setBanniereLoginActive(data.banniere_login_active);
        if (data?.banniere_login_message)
          setBanniereLoginMessage(data.banniere_login_message);
        if (data?.banniere_login_couleur_bg)
          setBanniereLoginCouleurBg(data.banniere_login_couleur_bg);
        if (data?.banniere_login_couleur_tx)
          setBanniereLoginCouleurTx(data.banniere_login_couleur_tx);
        if (data?.banniere_login_hauteur)
          setBanniereLoginHauteur(data.banniere_login_hauteur);
        if (data?.banniere_login_police)
          setBanniereLoginPolice(data.banniere_login_police);
      })
      .catch(() => {});
  }, []);

  const tab = TABS.find((t) => t.id === activeTab)!;
  const particles = Array.from({ length: 18 }, (_, i) => i);

  // 🔥 FONCTION DE CONNEXION MODIFIÉE POUR E-VEND STUDIO
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');

    try {
      // Utiliser la nouvelle API Studio pour les vendeurs
      const endpoint = activeTab === 'gestionnaire' 
        ? `${API_URL}/api/auth/login-studio`
        : `${API_URL}/api/auth/login-admin`;

      const body = activeTab === 'gestionnaire'
        ? JSON.stringify({ email, mot_de_passe: password })
        : JSON.stringify({ code_utilisateur: email, mot_de_passe: password });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      const data = await response.json();

      if (response.ok) {
        // Stocker le token et l'utilisateur
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Rediriger vers le dashboard vendeur
        if (activeTab === 'gestionnaire') {
          window.location.href = '/dashboard';
        } else if (activeTab === 'administration') {
          window.location.href = '/admin';
        }
        
        if (onLogin) {
          onLogin(activeTab, data.user, data.token);
        }
      } else if (response.status === 402 && data.compte_expire) {
        // Essai terminé sans paiement : aucun token émis, on affiche
        // la popup avec le lien Stripe pour régulariser.
        setCompteExpireMessage(data.message || 'Votre période d\'essai est terminée.');
        setCompteExpireUrl(data.url_paiement || null);
        setCompteExpireOpen(true);
      } else {
        setErreur(data.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      console.error('Erreur connexion:', err);
      setErreur('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Gestion inscription
  const handleSignupClick = (e: React.MouseEvent, t: TabConfig) => {
    // Rediriger vers la page d'inscription
    e.preventDefault();
    window.location.href = '/inscription';
  };

  // Succès 2FA
  const handle2FASuccess = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (onLogin) {
      onLogin(verify2FAUserType, user, token);
    } else {
      if (verify2FAUserType === 'administration') window.location.href = '/admin';
      else if (verify2FAUserType === 'gestionnaire') window.location.href = '/dashboard';
      else window.location.href = '/';
    }
  };

  const handleUnlockSuccess = () => {
    setUnlockModalOpen(false);
  };

  return (
    <>
      {/* OVERLAY MAINTENANCE */}
      {modeMaintenance && activeTab !== 'administration' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(10,15,30,0.97)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '40px',
          }}
        >
          <div style={{ fontSize: '64px' }}>🛑</div>
          <h1
            style={{
              color: '#fff',
              fontSize: '28px',
              fontWeight: 800,
              margin: 0,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            Site en maintenance
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '16px',
              textAlign: 'center',
              maxWidth: '480px',
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            {messageMaintenance ||
              'Nous effectuons des mises à jour. Merci de réessayer bientôt.'}
          </p>
          <div
            style={{
              marginTop: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 24px',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '13px',
            }}
          >
            👆 Utilisez l'onglet <strong>Administration</strong> ci-dessus pour
            vous connecter en tant qu'admin
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes gradientBG {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatParticle {
          0%   { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
          50%  { transform: translateY(-30px) rotate(180deg); opacity: 0.8; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes cardIn {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3); }
          50%       { box-shadow: 0 0 40px rgba(59,130,246,0.6); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }

        * { box-sizing: border-box; }

        .login-input:focus {
          outline: none;
        }

        .login-tab {
          cursor: pointer;
          transition: all 0.25s ease;
          user-select: none;
        }
        .login-tab:hover {
          transform: translateY(-1px);
        }

        .feature-item {
          animation: slideInLeft 0.4s ease both;
        }
        .feature-item:nth-child(1) { animation-delay: 0.1s; }
        .feature-item:nth-child(2) { animation-delay: 0.2s; }
        .feature-item:nth-child(3) { animation-delay: 0.3s; }
        .feature-item:nth-child(4) { animation-delay: 0.4s; }

        .submit-btn {
          transition: all 0.25s ease;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0px);
        }

        .forgot-link {
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }

        .signup-link {
          transition: all 0.25s ease !important;
        }
        .signup-link:hover {
          background: rgba(255,255,255,0.25) !important;
        }

        @media (max-width: 768px) {
          .login-card-container {
            width: 95% !important;
            max-width: 500px !important;
          }
          .features-section {
            padding: 32px 24px !important;
          }
          .features-section h2 {
            font-size: 22px !important;
          }
          .features-section p {
            font-size: 13px !important;
          }
          .feature-item span {
            font-size: 13px !important;
          }
          .form-section {
            padding: 32px 24px !important;
          }
          .form-section h3 {
            font-size: 20px !important;
          }
          .login-tab {
            padding: 8px 16px !important;
            font-size: 12px !important;
          }
          .logo-text {
            font-size: 32px !important;
          }
        }

        @media (max-width: 480px) {
          .features-section {
            padding: 24px 20px !important;
          }
          .form-section {
            padding: 24px 20px !important;
          }
          .features-section h2 {
            font-size: 20px !important;
          }
          .feature-item {
            gap: 8px !important;
          }
          .feature-item div:first-child {
            width: 24px !important;
            height: 24px !important;
            font-size: 12px !important;
          }
          .feature-item span {
            font-size: 12px !important;
          }
          .signup-link {
            padding: 10px 20px !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      {/* FOND ANIMÉ */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background:
            'linear-gradient(135deg, #060d1f, #0a1628, #0d1f3c, #091322)',
          backgroundSize: '400% 400%',
          animation: 'gradientBG 8s ease infinite',
        }}
      >
        {particles.map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 37 + 5) % 95}%`,
              top: `${(i * 53 + 10) % 90}%`,
              width: `${4 + (i % 3) * 3}px`,
              height: `${4 + (i % 3) * 3}px`,
              borderRadius: '50%',
              background:
                i % 3 === 0
                  ? '#3b82f633'
                  : i % 3 === 1
                  ? '#10b98133'
                  : '#8b5cf633',
              animation: `floatParticle ${4 + (i % 5)}s ease-in-out ${
                i * 0.3
              }s infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '5%',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* BANNIÈRE LOGIN */}
      {banniereLoginActive && banniereLoginMessage && !modeMaintenance && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            height: `${banniereLoginHauteur}px`,
            backgroundColor: banniereLoginCouleurBg,
            color: banniereLoginCouleurTx,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${banniereLoginPolice}px`,
            fontWeight: '600',
            padding: '0 16px',
            textAlign: 'center',
          }}
        >
          {banniereLoginMessage}
        </div>
      )}

      {/* PAGE */}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding:
            banniereLoginActive && banniereLoginMessage && !modeMaintenance
              ? `${parseInt(banniereLoginHauteur) + (isMobile ? 20 : 40)}px ${
                  isMobile ? '12px' : '20px'
                } ${isMobile ? '20px' : '40px'}`
              : isMobile
              ? '20px 12px'
              : '40px 20px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Logo */}
        <div
          style={{
            marginBottom: isMobile ? '24px' : '32px',
            textAlign: 'center',
            animation: 'cardIn 0.6s ease both',
          }}
        >
          <div
            className="logo-text"
            style={{
              fontSize: isMobile ? '32px' : '42px',
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-1px',
            }}
          >
            {(() => {
                const parties = nomPlateforme.split('-');
                if (parties.length === 1) return <>{nomPlateforme}</>;
                return (
                  <>
                    {parties[0]}
                    <span style={{ color: tab.accent }}>-</span>
                    {parties.slice(1).join('-')}
                  </>
                );
              })()}
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            Plateforme de création de boutiques en ligne
          </div>
        </div>

        {/* ONGLETS (2 seulement : Gestionnaire + Admin) */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '5px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'cardIn 0.6s ease 0.1s both',
            flexWrap: 'wrap',
            justifyContent: 'center',
            position: 'relative',
            zIndex: modeMaintenance ? 10000 : 'auto',
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              className="login-tab"
              onClick={() => {
                setActiveTab(t.id);
                setShowPwd(false);
                setEmail('');
                setPassword('');
                setErreur('');
              }}
              style={{
                padding: isMobile ? '8px 16px' : '10px 22px',
                borderRadius: '12px',
                border: 'none',
                background:
                  activeTab === t.id
                    ? `linear-gradient(135deg, ${t.accentDark}, ${t.accent})`
                    : 'transparent',
                color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontFamily: "'Sora', sans-serif",
                boxShadow:
                  activeTab === t.id ? `0 4px 20px ${t.accent}44` : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* CARTE PRINCIPALE */}
        <div
          key={activeTab}
          className="login-card-container"
          style={{
            width: '100%',
            maxWidth: isMobile ? '500px' : '940px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)`,
            animation: 'cardIn 0.4s ease both',
          }}
        >
          {/* GAUCHE : Features */}
          <div
            className="features-section"
            style={{
              background: `linear-gradient(145deg, ${tab.accentDark}ee, ${tab.accent}cc)`,
              padding: isMobile ? '32px 24px' : '52px 44px',
              position: 'relative',
              overflow: 'hidden',
              flex: isMobile ? 'auto' : 1,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-60px',
                right: '-60px',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: '-40px',
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '40%',
                right: '10px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: isMobile ? '40px' : '52px', marginBottom: '16px' }}>
                {tab.icon}
              </div>
              <h2
                style={{
                  margin: '0 0 8px',
                  color: '#fff',
                  fontSize: isMobile ? '22px' : '26px',
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                {tab.title}
              </h2>
              <p
                style={{
                  margin: '0 0 36px',
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: isMobile ? '13px' : '14px',
                  lineHeight: 1.6,
                }}
              >
                {tab.subtitle}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '10px' : '14px',
                }}
              >
                {tab.features.map((f, i) => (
                  <div
                    key={i}
                    className="feature-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '8px' : '12px',
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? '24px' : '28px',
                        height: isMobile ? '24px' : '28px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '12px' : '14px',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: 500,
                      }}
                    >
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              {tab.signupLabel &&
                !modeMaintenance &&
                !(tab.id === 'gestionnaire' && bloquerInscriptionGestionnaire) && (
                  <a
                    href={tab.signupUrl}
                    className="signup-link"
                    onClick={(e) => handleSignupClick(e, tab)}
                    style={{
                      display: 'inline-block',
                      marginTop: isMobile ? '28px' : '36px',
                      padding: isMobile ? '10px 20px' : '12px 24px',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#fff',
                      textDecoration: 'none',
                      fontSize: isMobile ? '13px' : '14px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {tab.signupLabel} →
                  </a>
                )}
            </div>
          </div>

          {/* DROITE : Formulaire */}
          <div
            className="form-section"
            style={{
              background: '#0b1529',
              padding: isMobile ? '32px 24px' : '52px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: isMobile ? 'auto' : 1,
            }}
          >
            <h3
              style={{
                margin: '0 0 6px',
                color: '#fff',
                fontSize: isMobile ? '20px' : '22px',
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
              }}
            >
              Connexion
            </h3>
            <p
              style={{
                margin: '0 0 32px',
                color: 'rgba(255,255,255,0.45)',
                fontSize: isMobile ? '13px' : '14px',
              }}
            >
              {activeTab === 'administration'
                ? 'Accès réservé au personnel autorisé'
                : 'Bienvenue! Veuillez vous identifier.'}
            </p>

            {erreur && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(220,38,38,0.15)',
                  border: '1px solid rgba(220,38,38,0.4)',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  animation: 'shake 0.4s ease',
                }}
              >
                <span>⚠️</span>
                <span>{erreur}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <input type="hidden" name="account_type" value={activeTab} />

              <div style={{ marginBottom: '18px' }}>
                {activeTab === 'administration' ? (
                  <>
                    <label
                      style={{
                        display: 'block',
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px',
                      }}
                    >
                      🔑 Code utilisateur <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: SUPER-USER01"
                      className="login-input"
                      style={{
                        width: '100%',
                        padding: isMobile ? '12px 14px' : '13px 16px',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid rgba(255,255,255,0.1)`,
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: isMobile ? '14px' : '15px',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = tab.accent;
                        e.target.style.boxShadow = `0 0 0 3px ${tab.accent}33`;
                        e.target.style.background = 'rgba(255,255,255,0.09)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(255,255,255,0.06)';
                      }}
                    />
                  </>
                ) : (
                  <>
                    <label
                      style={{
                        display: 'block',
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px',
                      }}
                    >
                      ✉ Adresse e-mail <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="login-input"
                      style={{
                        width: '100%',
                        padding: isMobile ? '12px 14px' : '13px 16px',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid rgba(255,255,255,0.1)`,
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: isMobile ? '14px' : '15px',
                        transition: 'all 0.2s',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = tab.accent;
                        e.target.style.boxShadow = `0 0 0 3px ${tab.accent}33`;
                        e.target.style.background = 'rgba(255,255,255,0.09)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(255,255,255,0.06)';
                      }}
                    />
                  </>
                )}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label
                  style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '8px',
                  }}
                >
                  🔒 Mot de passe <span style={{ color: '#f87171' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    style={{
                      width: '100%',
                      padding: isMobile
                        ? '12px 48px 12px 14px'
                        : '13px 48px 13px 16px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: isMobile ? '14px' : '15px',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = tab.accent;
                      e.target.style.boxShadow = `0 0 0 3px ${tab.accent}33`;
                      e.target.style.background = 'rgba(255,255,255,0.09)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255,255,255,0.06)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <EyeIcon visible={showPwd} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '28px', textAlign: 'right' }}>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setForgotOpen(true)}
                  style={{
                    color: tab.accent,
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 500,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = '#fff')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = tab.accent)
                  }
                >
                  Mot de passe oublié?
                </button>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: isMobile ? '13px' : '14px',
                  background: loading
                    ? 'rgba(255,255,255,0.1)'
                    : `linear-gradient(135deg, ${tab.accentDark}, ${tab.accent})`,
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '15px' : '16px',
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: loading ? 'none' : `0 6px 24px ${tab.accent}44`,
                  letterSpacing: '0.3px',
                }}
              >
                {loading ? '⏳ Connexion en cours...' : 'Se connecter'}
              </button>

              <p
                style={{
                  margin: '16px 0 0',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                <span style={{ color: '#f87171' }}>*</span> Champs obligatoires
              </p>
            </form>
          </div>
        </div>

        {/* FOOTER AVEC BOUTON DE RETOUR */}
        <div
          style={{
            marginTop: '28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '12px' : '20px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: 'rgba(255,255,255,0.2)',
              fontSize: '11px',
              letterSpacing: '0.5px',
            }}
          >
            {footerText}
          </p>
          <button
            onClick={() => window.open('/', '_self')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '20px',
              padding: '6px 16px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            🏠 Retour vers la page principale
          </button>
        </div>
      </div>

      {/* MODAL MOT DE PASSE OUBLIÉ */}
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        accent={tab.accent}
        accentDark={tab.accentDark}
        activeTab={activeTab}
      />

      {/* MODAL DÉBLOCAGE COMPTE (RATE LIMITING) */}
      <UnlockAccountModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        accent={tab.accent}
        email={unlockEmail}
        userType={unlockUserType}
        onUnlockSuccess={handleUnlockSuccess}
      />

      {/* MODAL COMPTE EXPIRÉ (ESSAI TERMINÉ) */}
      <CompteExpireModal
        open={compteExpireOpen}
        onClose={() => setCompteExpireOpen(false)}
        accent={tab.accent}
        message={compteExpireMessage}
        urlPaiement={compteExpireUrl}
      />

      {/* MODAL VÉRIFICATION 2FA */}
      <Verify2FAModal
        open={verify2FAModalOpen}
        onClose={() => setVerify2FAModalOpen(false)}
        userId={verify2FAUserId || 0}
        userType={verify2FAUserType}
        onVerifySuccess={handle2FASuccess}
      />
    </>
  );
}