/**
 * InscriptionCommanditaire.tsx
 * src/pages/commanditaire/InscriptionCommanditaire.tsx
 *
 * - Crée un vrai commanditaire via POST /api/sponsors/inscription
 * - Types de sponsor : Photos, Publicité, Les deux
 * - Erreurs affichées inline (pas d'alert())
 * - Redirige vers le dashboard sponsor après inscription réussie
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  nom: string;
  email: string;
  mot_de_passe: string;
  confirmPassword: string;
  site_web: string;
  description: string;
  type_sponsor: 'photos' | 'pub' | 'both';
  termsAccepted: boolean;
}

interface InscriptionCommanditaireProps {
  onSuccess?: (commanditaire: { id: number; nom: string; email: string }) => void;
  loginUrl?: string;
  termsUrl?: string;
}

// ─── Données ──────────────────────────────────────────────────────────────────
const TYPES_SPONSOR = [
  { id: 'photos', label: '📸 Photos', desc: 'Fournir des photos gratuites' },
  { id: 'pub', label: '📢 Publicité', desc: 'Acheter des espaces publicitaires' },
  { id: 'both', label: '⭐ Les deux', desc: 'Photos + Publicité' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a0a, #2d1a0a, #3d2a0a)',
    backgroundSize: '400% 400%',
    fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
    color: '#fff',
    overflowX: 'hidden',
    padding: '40px 16px 80px'
  },
  col: {
    maxWidth: '580px',
    margin: '0 auto',
    position: 'relative' as const
  },
  logoWrap: {
    textAlign: 'center' as const,
    marginBottom: '-44px',
    position: 'relative' as const,
    zIndex: 10
  },
  logoImg: {
    width: '110px',
    height: '110px',
    objectFit: 'contain' as const,
    borderRadius: '50%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  card: {
    borderRadius: '25px',
    background: 'linear-gradient(160deg, #1a0d0a 0%, #2d1a0a 60%, #3d2a0a 100%)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
    padding: '58px 44px 36px',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  cardDecor: {
    position: 'absolute' as const,
    top: '-60px',
    right: '-60px',
    width: '200px',
    height: '200px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '50%',
    pointerEvents: 'none' as const
  },
  cardDecor2: {
    position: 'absolute' as const,
    bottom: '-80px',
    left: '-50px',
    width: '250px',
    height: '250px',
    background: 'rgba(245, 158, 11, 0.08)',
    borderRadius: '50%',
    pointerEvents: 'none' as const
  },
  title: {
    textAlign: 'center' as const,
    color: '#f59e0b',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    fontSize: '17px',
    fontWeight: '800',
    marginBottom: '6px',
    marginTop: '0'
  },
  subtitle: {
    textAlign: 'center' as const,
    color: 'rgba(245, 158, 11, 0.8)',
    fontSize: '13px',
    marginBottom: '28px'
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    textTransform: 'uppercase' as const,
    marginBottom: '6px',
    display: 'block'
  },
  required: { color: '#f87171' },
  fieldWrap: { marginBottom: '18px' },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '11px 15px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.25s'
  },
  inputFocus: {
    background: 'rgba(255,255,255,0.16)',
    border: '1px solid rgba(245, 158, 11, 0.5)',
    boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)'
  },
  pwdWrap: {
    position: 'relative' as const
  },
  eyeBtn: {
    position: 'absolute' as const,
    top: '50%',
    right: '12px',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#f59e0b',
    padding: '0',
    display: 'flex',
    alignItems: 'center'
  },
  hint: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: '11px',
    marginTop: '5px',
    display: 'block'
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    margin: '22px 0'
  },
  cbxRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    cursor: 'pointer',
    marginBottom: '14px'
  },
  cbxBox: {
    width: '20px',
    height: '20px',
    minWidth: '20px',
    borderRadius: '5px',
    border: '2px solid rgba(245, 158, 11, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.04)',
    transition: 'all 0.2s',
    marginTop: '2px'
  },
  cbxBoxOn: {
    background: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b'
  },
  cbxText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.5'
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#000',
    fontSize: '15px',
    fontWeight: '800',
    letterSpacing: '0.8px',
    cursor: 'pointer',
    marginTop: '18px',
    transition: 'all 0.25s',
    textTransform: 'uppercase' as const,
    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
  },
  loginText: {
    textAlign: 'center' as const,
    marginTop: '16px',
    fontSize: '13px',
    color: 'rgba(245, 158, 11, 0.7)'
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '11px',
    color: 'rgba(255,255,255,0.2)',
    marginTop: '20px'
  },
  errorBox: {
    background: 'rgba(220,38,38,0.15)',
    border: '1px solid rgba(220,38,38,0.45)',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '18px',
    color: '#fca5a5',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px'
  },
  successBox: {
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '10px',
    padding: '14px 20px',
    marginBottom: '18px',
    color: '#86efac',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center' as const
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '18px'
  },
  typeCard: {
    padding: '16px 8px',
    borderRadius: '10px',
    border: '2px solid rgba(255,255,255,0.1)',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'rgba(255,255,255,0.05)'
  },
  typeCardSelected: {
    borderColor: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.15)',
    boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)'
  },
  typeEmoji: {
    fontSize: '32px',
    display: 'block',
    marginBottom: '4px'
  },
  typeName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff'
  },
  typeDesc: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '2px'
  }
};

// ─── Icône œil ────────────────────────────────────────────────────────────────
function EyeIcon({ on }: { on: boolean }) {
  return on ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function InscriptionCommanditaire({
  onSuccess,
  loginUrl = '/commanditaire/login',
  termsUrl = '/termes-et-conditions',
}: InscriptionCommanditaireProps) {

  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    nom: '',
    email: '',
    mot_de_passe: '',
    confirmPassword: '',
    site_web: '',
    description: '',
    type_sponsor: 'photos',
    termsAccepted: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = useCallback((k: keyof FormData, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v })), []);

  // Validation locale
  const valider = (): string | null => {
    if (!form.nom.trim()) return 'Le nom de la marque est obligatoire.';
    if (!form.email.includes('@')) return 'Adresse courriel invalide.';
    if (form.mot_de_passe.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (form.mot_de_passe !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    if (!form.type_sponsor) return 'Veuillez sélectionner un type de sponsor.';
    if (!form.termsAccepted) return "Vous devez accepter les conditions d'utilisation.";
    return null;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const errValidation = valider();
    if (errValidation) {
      setErreur(errValidation);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/sponsors/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom.trim(),
          email: form.email.trim().toLowerCase(),
          mot_de_passe: form.mot_de_passe,
          site_web: form.site_web || null,
          description: form.description || null,
          type_sponsor: form.type_sponsor,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        if (onSuccess) {
          onSuccess(data.sponsor);
        }
        // Rediriger vers login après 2 secondes
        setTimeout(() => {
          navigate('/commanditaire/login');
        }, 2000);
      } else {
        const msg = data.error || "Erreur lors de l'inscription.";
        setErreur(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion au serveur.';
      setErreur(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (k: string): React.CSSProperties => ({
    ...S.input,
    ...(focused === k ? S.inputFocus : {}),
  });

  // ── Page succès ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <>
        <style>{animCSS}</style>
        <div className="evend-page" style={S.page}>
          <div style={{ ...S.col, textAlign: 'center', paddingTop: '80px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⭐</div>
            <h2 style={{ color: '#f59e0b', fontSize: '22px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Compte commanditaire créé !
            </h2>
            <div style={S.successBox}>
              <p style={{ margin: '0', color: '#86efac' }}>
                ✅ Votre demande a été envoyée. Vous serez contacté sous 24-48h pour activer votre compte.
              </p>
              <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                {form.type_sponsor === 'photos' && '📸 Vous pourrez bientôt uploader vos photos.'}
                {form.type_sponsor === 'pub' && '📢 Vous pourrez bientôt créer vos campagnes publicitaires.'}
                {form.type_sponsor === 'both' && '⭐ Vous pourrez bientôt uploader des photos ET créer des publicités.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/commanditaire/login')}
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              → Se connecter
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Formulaire ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{animCSS}</style>
      <div className="evend-page" style={S.page}>
        <div style={S.col}>

          {/* Logo flottant */}
          <div style={S.logoWrap}>
            <img className="evend-float"
              src="https://cdn.shopify.com/s/files/1/0704/8734/3260/files/logo4.jpg?v=1763825082"
              alt="e-Vend" style={S.logoImg} />
          </div>

          {/* Carte */}
          <div className="evend-slide" style={S.card}>
            <div style={S.cardDecor} /><div style={S.cardDecor2} />

            <h4 style={S.title}>⭐ Devenir commanditaire</h4>
            <p style={S.subtitle}>
              Mettez vos photos en avant ou achetez des espaces publicitaires !
            </p>

            {/* ── Erreur inline ── */}
            {erreur && (
              <div style={S.errorBox}>
                <span style={{ fontSize: '16px', marginTop: '1px' }}>⚠️</span>
                <span>{erreur}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Nom de la marque */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Nom de votre marque <span style={S.required}>*</span></label>
                <input className="evend-inp" type="text" value={form.nom}
                  onChange={e => set('nom', e.target.value)}
                  onFocus={() => setFocused('nom')} onBlur={() => setFocused(null)}
                  style={inp('nom')} placeholder="Ex: Ma Marque Inc." autoFocus />
              </div>

              {/* Email */}
              <div style={S.fieldWrap}>
                <label style={S.label}>E-mail <span style={S.required}>*</span></label>
                <input className="evend-inp" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  style={inp('email')} placeholder="contact@mamarque.ca" />
              </div>

              {/* Site web */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Site web</label>
                <input className="evend-inp" type="url" value={form.site_web}
                  onChange={e => set('site_web', e.target.value)}
                  onFocus={() => setFocused('site_web')} onBlur={() => setFocused(null)}
                  style={inp('site_web')} placeholder="https://www.mamarque.ca" />
              </div>

              {/* Description */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Description de votre marque</label>
                <textarea className="evend-inp" value={form.description}
                  onChange={e => set('description', e.target.value)}
                  onFocus={() => setFocused('description')} onBlur={() => setFocused(null)}
                  style={{ ...inp('description'), minHeight: '60px', resize: 'vertical' as const }}
                  placeholder="Décrivez votre marque et vos photos..." />
              </div>

              {/* ── TYPE DE SPONSOR ── */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Type de sponsor <span style={S.required}>*</span></label>
                <div style={S.typeGrid}>
                  {TYPES_SPONSOR.map((type) => (
                    <div
                      key={type.id}
                      style={{
                        ...S.typeCard,
                        ...(form.type_sponsor === type.id ? S.typeCardSelected : {})
                      }}
                      onClick={() => set('type_sponsor', type.id as 'photos' | 'pub' | 'both')}
                    >
                      <span style={S.typeEmoji}>{type.label}</span>
                      <div style={S.typeName}>{type.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.divider} />

              {/* Mot de passe */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Mot de passe <span style={S.required}>*</span></label>
                <div style={S.pwdWrap}>
                  <input className="evend-inp" type={showPwd ? 'text' : 'password'} value={form.mot_de_passe}
                    onChange={e => set('mot_de_passe', e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    style={{ ...inp('password'), paddingRight: '44px' }}
                    placeholder="Minimum 8 caractères" autoComplete="new-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                    <EyeIcon on={showPwd} />
                  </button>
                </div>
                <span style={S.hint}>Minimum 8 caractères avec lettres et chiffres.</span>
              </div>

              {/* Confirmer mot de passe */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Confirmez le mot de passe <span style={S.required}>*</span></label>
                <div style={S.pwdWrap}>
                  <input className="evend-inp" type={showCPwd ? 'text' : 'password'} value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}
                    style={{ ...inp('confirmPassword'), paddingRight: '44px' }}
                    placeholder="Confirmez votre mot de passe" autoComplete="new-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowCPwd(v => !v)}>
                    <EyeIcon on={showCPwd} />
                  </button>
                </div>
                {form.confirmPassword && form.mot_de_passe !== form.confirmPassword && (
                  <span style={{ ...S.hint, color: '#f87171' }}>⚠️ Les mots de passe ne correspondent pas.</span>
                )}
                {form.confirmPassword && form.mot_de_passe === form.confirmPassword && form.mot_de_passe.length >= 8 && (
                  <span style={{ ...S.hint, color: '#86efac' }}>✅ Les mots de passe correspondent.</span>
                )}
              </div>

              <div style={S.divider} />

              {/* Checkbox termes */}
              <div style={S.cbxRow} onClick={() => set('termsAccepted', !form.termsAccepted)}>
                <div style={{ ...S.cbxBox, ...(form.termsAccepted ? S.cbxBoxOn : {}) }}>
                  {form.termsAccepted && (
                    <svg width="11" height="9" viewBox="0 0 11 9">
                      <polyline points="1,5 4,8 10,1" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={S.cbxText}>
                  J'accepte les{' '}
                  <a href={termsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#f59e0b', textDecoration: 'none' }}
                    onClick={e => e.stopPropagation()}>termes et conditions</a>
                  <span style={S.required}> *</span>
                </span>
              </div>

              {/* Bouton submit */}
              <button className="evend-btn" type="submit" disabled={submitting}
                style={{ ...S.submitBtn, ...(submitting ? { opacity: 0.6, cursor: 'wait' } : {}) }}>
                {submitting ? '⏳ Création en cours…' : '⭐ Devenir commanditaire'}
              </button>
            </form>

            <p style={S.loginText}>
              Déjà un compte commanditaire ?{' '}
              <button
                onClick={() => navigate('/commanditaire/login')}
                style={{
                  color: '#f59e0b',
                  fontWeight: '600',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Connectez-vous ici →
              </button>
            </p>
          </div>

          <p style={S.footer}>© Copyright 2026 e-Vend Studio — Tous droits réservés</p>
        </div>
      </div>
    </>
  );
}

// ─── Animations CSS ───────────────────────────────────────────────────────────
const animCSS = `
  @keyframes gradientBG {
    0%   { background-position: 0% 0%; }
    50%  { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
  }
  @keyframes floatLogo {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-12px); }
  }
  @keyframes slideIn {
    from { transform: translateY(-18px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }
  .evend-page  { animation: gradientBG 6s ease infinite; }
  .evend-float { animation: floatLogo 3s ease-in-out infinite; }
  .evend-slide { animation: slideIn 0.7s ease forwards; }
  .evend-inp::placeholder { color: rgba(255,255,255,0.35); }
  .evend-btn:hover:not(:disabled) {
    transform: scale(1.025) !important;
    box-shadow: 0 6px 24px rgba(245, 158, 11, 0.4) !important;
  }
  button { font-family: inherit; }
`;