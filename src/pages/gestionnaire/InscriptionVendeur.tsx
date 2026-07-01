// src/pages/vendeur/InscriptionVendeur.tsx
// e-Vend Studio — Inscription vendeur simplifiée

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface FormData {
  nom:             string;
  nomBoutique:     string;
  email:           string;
  password:        string;
  confirmPassword: string;
  typeEntreprise:  string;
  termsAccepted:   boolean;
  ageConfirmed:    boolean;
}

interface Props {
  onLogin?: (type: string, userData: any, token: string) => void;
}

const TYPES_ENTREPRISE = [
  'Particulier (Personne physique / non enregistrée)',
  'Entreprise enregistrée au registre des entreprises',
];

// ─── ICÔNE ŒIL ────────────────────────────────────────────────────────────────
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

// ─── CHECKBOX CUSTOM ──────────────────────────────────────────────────────────
function Cbx({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
      <div style={{
        width: 20, height: 20, minWidth: 20, borderRadius: 5, marginTop: 2,
        border: `2px solid ${checked ? '#c9a96e' : 'rgba(255,255,255,0.25)'}`,
        background: checked ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {checked && <span style={{ color: '#c9a96e', fontSize: 13, fontWeight: 800 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function InscriptionVendeur({ onLogin }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get('template') || '';

  const [form, setForm] = useState<FormData>({
    nom: '', nomBoutique: '', email: '',
    password: '', confirmPassword: '',
    typeEntreprise: '', termsAccepted: false, ageConfirmed: false,
  });
  const [focused, setFocused]   = useState<string | null>(null);
  const [showPwd, setShowPwd]   = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur]     = useState('');
  const [succes, setSucces]     = useState(false);

  const set = (champ: keyof FormData, val: any) => setForm(prev => ({ ...prev, [champ]: val }));

  const inp = (champ: string): React.CSSProperties => ({
    ...S.input,
    ...(focused === champ ? S.inputFocus : {}),
  });

  // Validation
  const mdpMatch = form.password === form.confirmPassword;
  const mdpOk    = form.password.length >= 8;

  const valider = (): string | null => {
    if (!form.nom.trim())           return 'Le nom complet est requis.';
    if (!form.nomBoutique.trim())   return 'Le nom de votre boutique est requis.';
    if (!form.email.trim())         return 'L\'adresse courriel est requise.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'L\'adresse courriel n\'est pas valide.';
    if (!mdpOk)                     return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!mdpMatch)                  return 'Les mots de passe ne correspondent pas.';
    if (!form.typeEntreprise)       return 'Veuillez sélectionner le type d\'entreprise.';
    if (!form.ageConfirmed)         return 'Vous devez confirmer avoir 16 ans ou plus.';
    if (!form.termsAccepted)        return 'Vous devez accepter les conditions d\'utilisation.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = valider();
    if (err) { setErreur(err); return; }

    setSubmitting(true);
    setErreur('');

    try {
      const res = await fetch(`${API_BASE}/auth/inscription-studio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:            form.nom.trim(),
          nom_boutique:   form.nomBoutique.trim(),
          email:          form.email.trim().toLowerCase(),
          mot_de_passe:   form.password,
          type_entreprise: form.typeEntreprise,
          template_id:    templateParam || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErreur(data.message || data.error || 'Erreur lors de l\'inscription.');
        return;
      }

      // Login automatique après inscription
      if (data.token && data.vendeur) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.vendeur));
        if (onLogin) onLogin('vendeur', data.vendeur, data.token);
        // Rediriger vers dashboard → écran choix template s'affiche automatiquement
        navigate('/dashboard');
      } else {
        // Fallback si pas de token (compte en attente)
        setSucces(true);
      }
    } catch (e) {
      setErreur('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (succes) {
    return (
      <div style={S.page} className="evend-page">
        <style>{animCSS}</style>
        <div style={S.col}>
          <div style={{ ...S.card, textAlign: 'center', padding: '48px 40px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: '#c9a96e', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Compte créé!</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Votre compte e-Vend Studio a été créé avec succès.<br/>
              Connectez-vous pour choisir votre template et lancer votre site.
            </p>
            <button onClick={() => navigate('/login')} style={S.submitBtn}>
              Me connecter →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page} className="evend-page">
      <style>{animCSS}</style>

      <div style={S.col}>
        {/* Logo flottant */}
        <div style={S.logoWrap}>
          <div className="evend-float" style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a96e,#a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>e</span>
          </div>
        </div>

        <div style={S.card} className="evend-slide">
          <div style={S.cardDecor} />
          <div style={S.cardDecor2} />

          <h1 style={S.title}>Créer mon compte vendeur</h1>
          <p style={S.subtitle}>
            {templateParam
              ? `Template sélectionné : ${templateParam.replace(/-/g, ' ')} ✓`
              : 'Lancez votre site e-Vend Studio gratuitement'
            }
          </p>

          {/* Erreur globale */}
          {erreur && (
            <div style={S.errorBox}>
              <span>⚠️</span>
              <span>{erreur}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Nom complet */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Nom complet <span style={S.required}>*</span></label>
              <input className="evend-inp" style={inp('nom')} type="text"
                value={form.nom} onChange={e => set('nom', e.target.value)}
                onFocus={() => setFocused('nom')} onBlur={() => setFocused(null)}
                placeholder="Jean Tremblay" autoComplete="name" />
            </div>

            {/* Nom boutique */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Nom de votre boutique / site <span style={S.required}>*</span></label>
              <input className="evend-inp" style={inp('nomBoutique')} type="text"
                value={form.nomBoutique} onChange={e => set('nomBoutique', e.target.value)}
                onFocus={() => setFocused('nomBoutique')} onBlur={() => setFocused(null)}
                placeholder="Ma Super Boutique" autoComplete="organization" />
              <span style={S.hint}>Ce nom apparaîtra sur votre site public.</span>
            </div>

            {/* Email */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Adresse courriel <span style={S.required}>*</span></label>
              <input className="evend-inp" style={inp('email')} type="email"
                value={form.email} onChange={e => set('email', e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                placeholder="jean@exemple.com" autoComplete="email" />
            </div>

            {/* Mot de passe */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Mot de passe <span style={S.required}>*</span></label>
              <div style={S.pwdWrap}>
                <input className="evend-inp" type={showPwd ? 'text' : 'password'}
                  style={{ ...inp('password'), paddingRight: 44 }}
                  value={form.password} onChange={e => set('password', e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  placeholder="Minimum 8 caractères" autoComplete="new-password" />
                <button type="button" style={S.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                  <EyeIcon on={showPwd} />
                </button>
              </div>
              <span style={S.hint}>Minimum 8 caractères.</span>
            </div>

            {/* Confirmer mot de passe */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Confirmer le mot de passe <span style={S.required}>*</span></label>
              <div style={S.pwdWrap}>
                <input className="evend-inp" type={showCPwd ? 'text' : 'password'}
                  style={{ ...inp('confirmPassword'), paddingRight: 44 }}
                  value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}
                  placeholder="Répétez votre mot de passe" autoComplete="new-password" />
                <button type="button" style={S.eyeBtn} onClick={() => setShowCPwd(v => !v)}>
                  <EyeIcon on={showCPwd} />
                </button>
              </div>
              {form.confirmPassword && !mdpMatch && (
                <span style={{ ...S.hint, color: '#f87171' }}>⚠️ Les mots de passe ne correspondent pas.</span>
              )}
              {form.confirmPassword && mdpMatch && mdpOk && (
                <span style={{ ...S.hint, color: '#86efac' }}>✅ Les mots de passe correspondent.</span>
              )}
            </div>

            {/* Type entreprise */}
            <div style={S.fieldWrap}>
              <label style={S.label}>Type d'entreprise <span style={S.required}>*</span></label>
              <select
                value={form.typeEntreprise}
                onChange={e => set('typeEntreprise', e.target.value)}
                style={S.select}>
                <option value="">Veuillez sélectionner...</option>
                {TYPES_ENTREPRISE.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={S.divider} />

            {/* Checkboxes */}
            <Cbx checked={form.ageConfirmed} onChange={v => set('ageConfirmed', v)}>
              Je déclare avoir 16 ans ou plus <span style={S.required}>*</span>
            </Cbx>
            <Cbx checked={form.termsAccepted} onChange={v => set('termsAccepted', v)}>
              J'accepte les{' '}
              <span onClick={e => { e.stopPropagation(); window.open('/conditions', '_blank'); }}
                style={{ color: '#c9a96e', textDecoration: 'underline', cursor: 'pointer' }}>
                conditions d'utilisation
              </span>{' '}
              d'e-Vend Studio <span style={S.required}>*</span>
            </Cbx>

            <button className="evend-btn" type="submit" disabled={submitting}
              style={{ ...S.submitBtn, ...(submitting ? { opacity: 0.65, cursor: 'wait' } : {}) }}>
              {submitting ? '⏳ Création en cours…' : 'Créer mon compte →'}
            </button>
          </form>

          <p style={S.loginText}>
            Déjà inscrit ?{' '}
            <button onClick={() => navigate('/login')}
              style={{ color: '#c9a96e', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Se connecter →
            </button>
          </p>
        </div>

        <p style={S.footer}>© 2026 e-Vend Studio — Tous droits réservés</p>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:       { minHeight: '100vh', background: 'linear-gradient(135deg,#0a1a3d,#0d2b5d,#173366)', backgroundSize: '400% 400%', fontFamily: '"Inter",system-ui,sans-serif', color: '#fff', overflowX: 'hidden', padding: '40px 16px 80px' },
  col:        { maxWidth: 520, margin: '0 auto', position: 'relative' },
  logoWrap:   { textAlign: 'center', marginBottom: -40, position: 'relative', zIndex: 10 },
  card:       { borderRadius: 24, background: 'linear-gradient(160deg,#0c1e45 0%,#0d2b5d 60%,#12336b 100%)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', padding: '56px 40px 36px', position: 'relative', overflow: 'hidden' },
  cardDecor:  { position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: '50%', pointerEvents: 'none' },
  cardDecor2: { position: 'absolute', bottom: -80, left: -50, width: 250, height: 250, background: 'rgba(45,106,159,0.06)', borderRadius: '50%', pointerEvents: 'none' },
  title:      { textAlign: 'center', color: '#c9a96e', letterSpacing: '1px', textTransform: 'uppercase', fontSize: 16, fontWeight: 800, marginBottom: 6, marginTop: 0 },
  subtitle:   { textAlign: 'center', color: 'rgba(201,169,110,0.7)', fontSize: 13, marginBottom: 28 },
  label:      { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  required:   { color: '#f87171' },
  fieldWrap:  { marginBottom: 18 },
  input:      { width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 15px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit' },
  inputFocus: { background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(201,169,110,0.5)', boxShadow: '0 0 12px rgba(201,169,110,0.15)' },
  select:     { width: '100%', background: 'rgba(13,43,93,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '11px 15px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', cursor: 'pointer', fontFamily: 'inherit' },
  pwdWrap:    { position: 'relative' },
  eyeBtn:     { position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c9a96e', padding: 0, display: 'flex', alignItems: 'center' },
  hint:       { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 5, display: 'block' },
  divider:    { height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' },
  submitBtn:  { width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#c9a96e,#a07840)', color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: '0.05em', cursor: 'pointer', marginTop: 18, transition: 'all 0.25s', fontFamily: 'inherit' },
  loginText:  { textAlign: 'center', marginTop: 18, fontSize: 13, color: 'rgba(201,169,110,0.6)' },
  footer:     { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20 },
  errorBox:   { background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: '#fca5a5', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 },
};

const animCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  @keyframes gradientBG { 0%{background-position:0% 0%} 50%{background-position:100% 100%} 100%{background-position:0% 0%} }
  @keyframes floatLogo  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes slideIn    { from{transform:translateY(-16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .evend-page  { animation: gradientBG 7s ease infinite; }
  .evend-float { animation: floatLogo 3s ease-in-out infinite; }
  .evend-slide { animation: slideIn 0.6s ease forwards; }
  .evend-inp::placeholder { color: rgba(255,255,255,0.3); }
  .evend-btn:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 6px 24px rgba(201,169,110,0.35) !important; }
  select option { background-color: #0d2b5d !important; color: #fff !important; }
`;