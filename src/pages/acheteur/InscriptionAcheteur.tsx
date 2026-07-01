/**
 * InscriptionAcheteur.tsx
 * Emplacement : src/pages/acheteur/InscriptionAcheteur.tsx
 *
 * Page d'inscription acheteur e-Vend.ca
 * - Connectée à la base de données via API
 * - Inscription automatique (statut 'actif' direct)
 * - Thème vert (identique au thème acheteur de LoginPage)
 * - Fond dégradé animé bleu marine
 * - Logo flottant animé
 * - Tous les champs : infos, adresse, téléphone, catégories, infolettre
 * - Toggle œil sur les mots de passe
 * - Checkboxes animées
 * - reCAPTCHA désactivé pour le moment
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

// ─── Couleurs thème VERT acheteur ─────────────────────────────────────────────
const ACCENT       = '#10b981';
const ACCENT_DARK  = '#065f46';
const ACCENT_MED   = '#059669';

// ─── Provinces canadiennes ────────────────────────────────────────────────────
const PROVINCES = [
  'Alberta (AB)',
  'Colombie-Britannique (CB)',
  'Île-du-Prince-Édouard (Î-P-É)',
  'Manitoba (MB)',
  'Nouveau-Brunswick (N.-B.)',
  'Nouvelle-Écosse (NS)',
  'Nunavut (NU)',
  'Ontario (ON)',
  'Québec (QC)',
  'Saskatchewan (SK)',
  'Terre-Neuve-et-Labrador (T.-N.-L.)',
  'Territoires du Nord-Ouest (T.N.-O.)',
  'Yukon (YK)',
];

// ─── Catégories d'intérêt ─────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'artisanat',    label: '🎨 Artisanat & Art',        },
  { id: 'mode',         label: '👗 Mode & Vêtements',        },
  { id: 'bijoux',       label: '💍 Bijoux & Accessoires',    },
  { id: 'maison',       label: '🏠 Maison & Décoration',     },
  { id: 'electronique', label: '💻 Électronique',            },
  { id: 'alimentaire',  label: '🍎 Alimentation & Épicerie', },
  { id: 'livres',       label: '📚 Livres & Médias',         },
  { id: 'sport',        label: '⚽ Sport & Plein air',       },
  { id: 'jouets',       label: '🧸 Jouets & Enfants',        },
  { id: 'antiquites',   label: '🏺 Antiquités & Vintage',    },
  { id: 'animaux',      label: '🐾 Animaux & Accessoires',   },
  { id: 'jardinage',    label: '🌿 Jardinage & Nature',      },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface InscriptionAcheteurProps {
  onSuccess?:        () => void;
  loginUrl?:         string;
  termsUrl?:         string;
  recaptchaSiteKey?: string;
  testMode?:         boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #060d1f, #0a1628, #0d1f3c, #091322)',
    backgroundSize: '400% 400%',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    color: '#fff',
    overflowX: 'hidden',
    padding: '40px 16px 80px',
  },
  col: {
    maxWidth: '620px',
    margin: '0 auto',
    position: 'relative',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: '-44px',
    position: 'relative',
    zIndex: 10,
  },
  logoImg: {
    width: '110px',
    height: '110px',
    objectFit: 'contain',
    borderRadius: '50%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: `3px solid ${ACCENT}44`,
  },
  card: {
    borderRadius: '25px',
    background: 'linear-gradient(160deg, #0c1e45 0%, #0d2b5d 60%, #12336b 100%)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
    padding: '58px 44px 36px',
    position: 'relative',
    overflow: 'hidden',
  },
  cardDecor1: {
    position: 'absolute', top: '-60px', right: '-60px',
    width: '200px', height: '200px',
    background: `${ACCENT}08`,
    borderRadius: '50%', pointerEvents: 'none',
  },
  cardDecor2: {
    position: 'absolute', bottom: '-80px', left: '-50px',
    width: '250px', height: '250px',
    background: `${ACCENT}06`,
    borderRadius: '50%', pointerEvents: 'none',
  },
  title: {
    textAlign: 'center',
    color: ACCENT,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    fontSize: '17px', fontWeight: '800',
    marginBottom: '6px', marginTop: '0',
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px', marginBottom: '28px',
  },
  testBanner: {
    background: 'rgba(251,191,36,0.12)',
    border: '1px solid rgba(251,191,36,0.35)',
    borderRadius: '10px', padding: '8px 14px',
    color: '#fbbf24', fontSize: '12px',
    textAlign: 'center', marginBottom: '20px', fontWeight: '600',
  },
  erreurBanner: {
    background: 'rgba(220,38,38,0.15)',
    border: '1px solid rgba(220,38,38,0.4)',
    borderRadius: '10px', padding: '12px 16px',
    marginBottom: '20px',
    color: '#fca5a5', fontSize: '13px', fontWeight: '600',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  sectionTitle: {
    fontSize: '11px', fontWeight: '800',
    color: ACCENT, textTransform: 'uppercase' as const,
    letterSpacing: '1.5px', marginBottom: '16px',
    marginTop: '4px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  divider: {
    height: '1px',
    background: `linear-gradient(to right, transparent, ${ACCENT}40, transparent)`,
    margin: '24px 0',
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '12px', fontWeight: '700',
    letterSpacing: '0.8px',
    textTransform: 'uppercase' as const,
    marginBottom: '6px', display: 'block',
  },
  required: { color: '#f87171' },
  optional: { color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '400', textTransform: 'none' as const, letterSpacing: '0' },
  fieldWrap: { marginBottom: '16px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '11px 15px',
    color: '#fff', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, transition: 'all 0.25s',
  },
  inputFocused: {
    background: 'rgba(16,185,129,0.1)',
    border: `1px solid ${ACCENT}88`,
    boxShadow: `0 0 0 3px ${ACCENT}22`,
  },
  select: {
    width: '100%',
    background: 'rgba(13,43,93,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', padding: '11px 36px 11px 15px',
    color: '#fff', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, cursor: 'pointer',
    appearance: 'none' as const, WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2310b981' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    transition: 'all 0.25s',
  },
  pwdWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', top: '50%', right: '12px',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', color: ACCENT,
    padding: '0', display: 'flex', alignItems: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '11px', marginTop: '5px', display: 'block',
  },
  hintGreen: {
    color: `${ACCENT}99`,
    fontSize: '11px', marginTop: '5px', display: 'block',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '4px',
  },
  catBtn: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.65)',
    fontSize: '12px', fontWeight: '500',
    cursor: 'pointer', textAlign: 'center' as const,
    transition: 'all 0.2s',
  },
  catBtnActive: {
    border: `1px solid ${ACCENT}`,
    background: `${ACCENT}22`,
    color: '#fff', fontWeight: '700',
  },
  cbxRow: {
    display: 'flex', alignItems: 'flex-start',
    gap: '10px', cursor: 'pointer', marginBottom: '14px',
  },
  cbxBox: {
    width: '20px', height: '20px', minWidth: '20px',
    borderRadius: '5px',
    border: `2px solid ${ACCENT}66`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.04)',
    transition: 'all 0.2s', marginTop: '2px',
  },
  cbxBoxOn: {
    background: `${ACCENT}25`,
    borderColor: ACCENT,
  },
  cbxText: {
    fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5',
  },
  recaptchaWrap: {
    display: 'flex', justifyContent: 'center',
    margin: '20px 0 8px',
  },
  submitBtn: {
    width: '100%', padding: '14px',
    borderRadius: '12px', border: 'none',
    background: `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT_MED})`,
    color: '#fff', fontSize: '15px', fontWeight: '800',
    letterSpacing: '0.8px', cursor: 'pointer',
    marginTop: '18px', transition: 'all 0.25s',
    textTransform: 'uppercase' as const,
    boxShadow: `0 4px 20px ${ACCENT}44`,
  },
  loginText: {
    textAlign: 'center' as const,
    marginTop: '16px', fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '11px',
    color: 'rgba(255,255,255,0.15)',
    marginTop: '20px',
  },
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

// ─── Checkbox animée ──────────────────────────────────────────────────────────
function Cbx({ checked, onChange, children }: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <div style={S.cbxRow} onClick={() => onChange(!checked)}>
      <div style={{ ...S.cbxBox, ...(checked ? S.cbxBoxOn : {}) }}>
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9">
            <polyline points="1,5 4,8 10,1" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={S.cbxText}>{children}</span>
    </div>
  );
}

// ─── Select stylisé ───────────────────────────────────────────────────────────
function GreenSelect({ value, onChange, options, placeholder, focused, onFocus, onBlur }: {
  value: string; onChange: (v: string) => void; options: string[];
  placeholder: string; focused: boolean; onFocus: () => void; onBlur: () => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      onFocus={onFocus} onBlur={onBlur}
      style={{ ...S.select, ...(focused ? { border: `1px solid ${ACCENT}88`, boxShadow: `0 0 0 3px ${ACCENT}22` } : {}) }}>
      <option value="" style={{ background: '#0d2b5d', color: 'rgba(255,255,255,0.4)' }}>{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt} style={{ background: '#0d2b5d', color: '#fff' }}>{opt}</option>
      ))}
    </select>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function InscriptionAcheteur({
  onSuccess,
  loginUrl           = '/connexion',
  termsUrl           = '/termes-et-conditions',
  recaptchaSiteKey   = '6LfOsWEsAAAAKworn_Frv7AomHoRYh9Z3VYmNzR',
  testMode           = false,
}: InscriptionAcheteurProps) {

  // ── State formulaire ──
  const [prenom,           setPrenom]           = useState('');
  const [nom,              setNom]              = useState('');
  const [email,            setEmail]            = useState('');
  const [emailConfirm,     setEmailConfirm]     = useState('');
  const [password,         setPassword]         = useState('');
  const [passwordConfirm,  setPasswordConfirm]  = useState('');
  const [telephone,        setTelephone]        = useState('');
  const [adresse,          setAdresse]          = useState('');
  const [ville,            setVille]            = useState('');
  const [province,         setProvince]         = useState('');
  const [codePostal,       setCodePostal]       = useState('');
  const [categories,       setCategories]       = useState<string[]>([]);
  const [infolettre,       setInfolettre]       = useState(false);
  const [ageConfirmed,     setAgeConfirmed]     = useState(false);
  const [termsAccepted,    setTermsAccepted]    = useState(false);

  const [showPwd,    setShowPwd]    = useState(false);
  const [showCPwd,   setShowCPwd]   = useState(false);
  const [focused,    setFocused]    = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [erreur,     setErreur]     = useState('');

  // ── reCAPTCHA DÉSACTIVÉ ──
  useEffect(() => {
    console.log('reCAPTCHA désactivé');
  }, []);

  // ── Toggle catégorie ──
  const toggleCat = useCallback((id: string) => {
    setCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }, []);

  // ── Extraire le code de province (QC, ON, etc.) ──
  const extraireCodeProvince = (provinceComplet: string): string => {
    const match = provinceComplet.match(/\(([^)]+)\)/);
    return match ? match[1] : provinceComplet;
  };

  // ── Soumission vers API ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErreur('');

    try {
      // Validations des champs obligatoires
      if (!prenom || !nom || !email || !emailConfirm || !password || !passwordConfirm || !adresse || !ville || !codePostal || !province) {
        setErreur('Veuillez remplir tous les champs obligatoires (*)');
        setSubmitting(false);
        return;
      }

      // Validation email
      if (email !== emailConfirm) {
        setErreur('Les adresses courriel ne correspondent pas');
        setSubmitting(false);
        return;
      }

      // Validation mot de passe
      if (password.length < 8) {
        setErreur('Le mot de passe doit contenir au moins 8 caractères');
        setSubmitting(false);
        return;
      }
      if (password !== passwordConfirm) {
        setErreur('Les mots de passe ne correspondent pas');
        setSubmitting(false);
        return;
      }

      // Validation consentements
      if (!ageConfirmed || !termsAccepted) {
        setErreur('Vous devez confirmer votre âge et accepter les conditions');
        setSubmitting(false);
        return;
      }

      // Mode TEST (si jamais quelqu'un met testMode à true)
      if (testMode) {
        await new Promise(r => setTimeout(r, 900));
        console.log('🔵 MODE TEST - Inscription simulée avec succès');
        setSubmitted(true);
        onSuccess?.();
        setSubmitting(false);
        return;
      }

      // Appel API réel - reCAPTCHA désactivé
      const response = await fetch(`${API}/api/acheteurs/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom,
          nom,
          email,
          mot_de_passe: password,
          telephone: telephone || null,
          adresse,
          ville,
          province: extraireCodeProvince(province),
          code_postal: codePostal.toUpperCase(),
          categories: categories.join(','),
          infolettre: infolettre ? 1 : 0,
          age_confirme: ageConfirmed ? 1 : 0,
          termes_acceptes: termsAccepted ? 1 : 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        onSuccess?.();
      } else {
        setErreur(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      console.error('❌ Erreur inscription:', err);
      setErreur('Impossible de joindre le serveur. Vérifiez que le backend tourne sur https://evend-multivendeur-api.onrender.com');
    } finally {
      setSubmitting(false);
    }
  };

  const iStyle = (k: string): React.CSSProperties => ({
    ...S.input, ...(focused === k ? S.inputFocused : {}),
  });

  // ── Écran succès ──
  if (submitted) {
    return (
      <>
        <style>{animCSS}</style>
        <div className="ea-page" style={S.page}>
          <div style={{ ...S.col, textAlign: 'center', paddingTop: '100px' }}>
            <div style={{ fontSize: '72px', marginBottom: '16px' }}>🛒</div>
            <h2 style={{ color: ACCENT, fontSize: '22px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Compte créé avec succès !
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '10px', marginBottom: '28px' }}>
              Bienvenue sur e-Vend ! Vous pouvez maintenant magasiner.
            </p>
            <a href={loginUrl} style={{ display: 'inline-block', padding: '13px 32px', borderRadius: '12px', background: `linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT_MED})`, color: '#fff', fontWeight: '700', textDecoration: 'none', fontSize: '14px', boxShadow: `0 4px 20px ${ACCENT}44` }}>
              → Se connecter
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{animCSS}</style>
      <div className="ea-page" style={S.page}>
        <div style={S.col}>

          {/* Logo flottant */}
          <div style={S.logoWrap}>
            <img className="ea-float"
              src="https://cdn.shopify.com/s/files/1/0704/8734/3260/files/logo4.jpg?v=1763825082"
              alt="e-Vend" style={S.logoImg} />
          </div>

          {/* Carte */}
          <div className="ea-slide" style={S.card}>
            <div style={S.cardDecor1} />
            <div style={S.cardDecor2} />

            <h4 style={S.title}>Créer un compte acheteur</h4>
            <p style={S.subtitle}>
              Déjà inscrit ?{' '}
              <a href={loginUrl} style={{ color: ACCENT, textDecoration: 'none', fontWeight: '600' }}>
                Se connecter
              </a>
            </p>

            {/* Le bandeau MODE TEST n'apparaît plus car testMode=false */}
            {testMode && (
              <div style={S.testBanner}>
                🧪 MODE TEST — La soumission est acceptée sans validation
              </div>
            )}

            {/* Message d'erreur */}
            {erreur && (
              <div style={S.erreurBanner}>
                <span>⚠️</span>
                <span>{erreur}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* ══ SECTION 1 : Informations personnelles ══ */}
              <div style={S.sectionTitle}>
                <span>👤</span> Informations personnelles
              </div>

              {/* Prénom + Nom */}
              <div style={S.row2}>
                <div>
                  <label style={S.label}>Prénom <span style={S.required}>*</span></label>
                  <input className="ea-inp" type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                    onFocus={() => setFocused('prenom')} onBlur={() => setFocused(null)}
                    style={iStyle('prenom')} placeholder="Ex : Marie" />
                </div>
                <div>
                  <label style={S.label}>Nom <span style={S.required}>*</span></label>
                  <input className="ea-inp" type="text" value={nom} onChange={e => setNom(e.target.value)}
                    onFocus={() => setFocused('nom')} onBlur={() => setFocused(null)}
                    style={iStyle('nom')} placeholder="Ex : Tremblay" />
                </div>
              </div>

              {/* Email */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Adresse e-mail <span style={S.required}>*</span></label>
                <input className="ea-inp" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  style={iStyle('email')} placeholder="votre@courriel.ca" />
              </div>

              {/* Confirmation email */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Confirmer l'e-mail <span style={S.required}>*</span></label>
                <input className="ea-inp" type="email" value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)}
                  onFocus={() => setFocused('emailConfirm')} onBlur={() => setFocused(null)}
                  style={iStyle('emailConfirm')} placeholder="Confirmez votre adresse e-mail" />
              </div>

              {/* Mot de passe */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Mot de passe <span style={S.required}>*</span></label>
                <div style={S.pwdWrap}>
                  <input className="ea-inp" type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    style={{ ...iStyle('password'), paddingRight: '44px' }}
                    placeholder="Entrez votre mot de passe" autoComplete="new-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                    <EyeIcon on={showPwd} />
                  </button>
                </div>
                <span style={S.hint}>Minimum 8 caractères, incluant lettres et chiffres.</span>
              </div>

              {/* Confirmation mot de passe */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Confirmer le mot de passe <span style={S.required}>*</span></label>
                <div style={S.pwdWrap}>
                  <input className="ea-inp" type={showCPwd ? 'text' : 'password'} value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    onFocus={() => setFocused('passwordConfirm')} onBlur={() => setFocused(null)}
                    style={{ ...iStyle('passwordConfirm'), paddingRight: '44px' }}
                    placeholder="Confirmez votre mot de passe" autoComplete="new-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowCPwd(v => !v)}>
                    <EyeIcon on={showCPwd} />
                  </button>
                </div>
                <span style={S.hintGreen}>Saisissez à nouveau le mot de passe pour vérifier qu'il correspond.</span>
              </div>

              {/* Téléphone */}
              <div style={S.fieldWrap}>
                <label style={S.label}>
                  Téléphone{' '}
                  <span style={S.optional}>(optionnel — pour le suivi de livraison)</span>
                </label>
                <input className="ea-inp" type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                  onFocus={() => setFocused('telephone')} onBlur={() => setFocused(null)}
                  style={iStyle('telephone')} placeholder="Ex : 514-555-0100" />
              </div>

              <div style={S.divider} />

              {/* ══ SECTION 2 : Adresse de livraison ══ */}
              <div style={S.sectionTitle}>
                <span>📦</span> Adresse de livraison principale
              </div>

              {/* Adresse */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Adresse <span style={S.required}>*</span></label>
                <input className="ea-inp" type="text" value={adresse} onChange={e => setAdresse(e.target.value)}
                  onFocus={() => setFocused('adresse')} onBlur={() => setFocused(null)}
                  style={iStyle('adresse')} placeholder="Ex : 123, rue des Érables" />
              </div>

              {/* Ville + Code postal */}
              <div style={S.row2}>
                <div>
                  <label style={S.label}>Ville <span style={S.required}>*</span></label>
                  <input className="ea-inp" type="text" value={ville} onChange={e => setVille(e.target.value)}
                    onFocus={() => setFocused('ville')} onBlur={() => setFocused(null)}
                    style={iStyle('ville')} placeholder="Ex : Montréal" />
                </div>
                <div>
                  <label style={S.label}>Code postal <span style={S.required}>*</span></label>
                  <input className="ea-inp" type="text" value={codePostal} onChange={e => setCodePostal(e.target.value.toUpperCase())}
                    onFocus={() => setFocused('codePostal')} onBlur={() => setFocused(null)}
                    style={iStyle('codePostal')} placeholder="Ex : H2X 1Y4" maxLength={7} />
                </div>
              </div>

              {/* Province */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Province <span style={S.required}>*</span></label>
                <GreenSelect
                  value={province} onChange={setProvince}
                  options={PROVINCES}
                  placeholder="Sélectionnez votre province"
                  focused={focused === 'province'}
                  onFocus={() => setFocused('province')}
                  onBlur={() => setFocused(null)}
                />
              </div>

              <div style={S.divider} />

              {/* ══ SECTION 3 : Préférences ══ */}
              <div style={S.sectionTitle}>
                <span>🛍️</span> Vos centres d'intérêt
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>
                  (optionnel — pour personnaliser vos suggestions)
                </span>
              </div>

              <div style={S.categoriesGrid}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} type="button"
                    onClick={() => toggleCat(cat.id)}
                    style={{
                      ...S.catBtn,
                      ...(categories.includes(cat.id) ? S.catBtnActive : {}),
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>
              {categories.length > 0 && (
                <p style={{ fontSize: '11px', color: `${ACCENT}99`, marginTop: '8px', marginBottom: '0' }}>
                  ✓ {categories.length} catégorie{categories.length > 1 ? 's' : ''} sélectionnée{categories.length > 1 ? 's' : ''}
                </p>
              )}

              <div style={S.divider} />

              {/* ══ SECTION 4 : Légal & Consentements ══ */}
              <div style={S.sectionTitle}>
                <span>✅</span> Consentements
              </div>

              <Cbx checked={ageConfirmed} onChange={setAgeConfirmed}>
                Je déclare avoir 16 ans ou + (consentement parental pour les mineurs)
                <span style={S.required}> *</span>
              </Cbx>

              <Cbx checked={termsAccepted} onChange={setTermsAccepted}>
                En vous inscrivant, vous acceptez{' '}
                <a href={termsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: ACCENT, textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}>
                  les termes et conditions
                </a>
                <span style={S.required}> *</span>
              </Cbx>

              <Cbx checked={infolettre} onChange={setInfolettre}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Je souhaite recevoir l'infolettre e-Vend (offres, nouveautés, promotions)
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}> — optionnel</span>
                </span>
              </Cbx>

              {/* reCAPTCHA - DÉSACTIVÉ */}
              {/* <div style={S.recaptchaWrap}>
                <div ref={recaptchaRef} />
              </div> */}

              {/* Bouton submit */}
              <button className="ea-btn" type="submit" disabled={submitting}
                style={{ ...S.submitBtn, ...(submitting ? { opacity: 0.6, cursor: 'wait' } : {}) }}>
                {submitting ? '⏳ Création en cours…' : '🛒 Créer Mon Compte Acheteur'}
              </button>
            </form>

            <p style={S.loginText}>
              Déjà inscrit ?{' '}
              <a href={loginUrl} style={{ color: ACCENT, fontWeight: '600', textDecoration: 'none' }}>
                Connectez-vous ici →
              </a>
            </p>
          </div>

          <p style={S.footer}>© Copyright 2026 e-Vend — Tous droits réservés</p>
        </div>
      </div>
    </>
  );
}

// ─── CSS animations ───────────────────────────────────────────────────────────
const animCSS = `
  @keyframes gradientBG {
    0%   { background-position: 0% 0%; }
    50%  { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
  }
  @keyframes floatLogo {
    0%   { transform: translateY(0); }
    50%  { transform: translateY(-12px); }
    100% { transform: translateY(0); }
  }
  @keyframes slideIn {
    from { transform: translateY(-18px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  .ea-page  { animation: gradientBG 6s ease infinite; }
  .ea-float { animation: floatLogo 3s ease-in-out infinite; }
  .ea-slide { animation: slideIn 0.7s ease forwards; }
  .ea-inp::placeholder { color: rgba(255,255,255,0.3); }
  .ea-btn:hover:not(:disabled) {
    transform: scale(1.025) !important;
    box-shadow: 0 8px 28px rgba(16,185,129,0.45) !important;
  }
  select option { background-color: #0d2b5d !important; color: #fff !important; }
`;
