// src/templates/shared/MarketplaceLogin.tsx
// e-Vend Studio — Page de connexion marketplace (partagee entre tous les templates multi-vendeur)
// 2 onglets : Acheteur / Vendeur — scopee par gestionnaireId (le site sur lequel on se connecte)

import { useState } from 'react';

const API_BASE = '/api';

type TypeCompte = 'acheteur' | 'collaborateur';



interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (dest: any) => void;
}

function EyeIcon({ on }: { on: boolean }) {
  return on ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function MarketplaceLogin({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const gestionnaireId = vendeurId || config.gestionnaire_id;
  const couleurAccent = config.couleur_accent || '#fbbf24';
  const nom = config.nom_boutique || 'Ma Marketplace';

  const ACCENT_ACHETEUR = couleurAccent;
  const ACCENT_COLLABORATEUR = '#3b82f6';

  const [type, setType] = useState<TypeCompte>('acheteur');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const accent = type === 'acheteur' ? ACCENT_ACHETEUR : ACCENT_COLLABORATEUR;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    if (isDemo) {
      setErreur('Mode demonstration — la connexion est desactivee dans cet apercu');
      return;
    }
    if (!email || !password) {
      setErreur('Courriel et mot de passe requis');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(`mv_token_${gestionnaireId}`, data.token);
        localStorage.setItem(`mv_compte_${gestionnaireId}`, JSON.stringify(data.compte));
        naviguer({ page: type === 'acheteur' ? 'dashboard-acheteur' : 'dashboard-collaborateur' });
      } else {
        setErreur(data.message || 'Courriel ou mot de passe incorrect');
      }
    } catch (err) {
      setErreur('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .login-input:focus { outline: none; }
      `}</style>

      <div style={s.logoWrap} onClick={() => naviguer({ page: 'accueil' })}>
        <div style={{ ...s.logoIcon, background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
          {(nom[0] || 'M').toUpperCase()}
        </div>
        <span style={s.logoText}>{nom}</span>
      </div>

      <div style={s.card}>
        <div style={s.tabs}>
          <button
            type="button"
            onClick={() => { setType('acheteur'); setErreur(''); }}
            style={{ ...s.tabBtn, color: type === 'acheteur' ? '#fff' : 'rgba(255,255,255,0.45)', borderBottom: type === 'acheteur' ? `3px solid ${ACCENT_ACHETEUR}` : '3px solid transparent' }}
          >
            🛒 Acheteur
          </button>
          <button
            type="button"
            onClick={() => { setType('collaborateur'); setErreur(''); }}
            style={{ ...s.tabBtn, color: type === 'collaborateur' ? '#fff' : 'rgba(255,255,255,0.45)', borderBottom: type === 'collaborateur' ? `3px solid ${ACCENT_COLLABORATEUR}` : '3px solid transparent' }}
          >
            🏪 Collaborateur
          </button>
        </div>

        <div style={s.cardBody}>
          <h1 style={s.titre}>{type === 'acheteur' ? 'Connexion acheteur' : 'Connexion collaborateur'}</h1>
          <p style={s.sousTitre}>
            {type === 'acheteur' ? 'Accedez a vos commandes et favoris' : 'Gerez votre boutique collaborative sur cette marketplace'}
          </p>

          {erreur && <div style={s.erreurBox}>⚠️ {erreur}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.champ}>
              <label style={s.label}>Courriel</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="login-input"
                style={s.input}
              />
            </div>

            <div style={s.champ}>
              <label style={s.label}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-input"
                  style={{ ...s.input, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={s.eyeBtn}>
                  <EyeIcon on={showPwd} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ ...s.submitBtn, background: loading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: type === 'acheteur' ? '#000' : '#fff' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={s.bas}>
            Pas encore de compte ?{' '}
            <span
              style={{ color: accent, cursor: 'pointer', fontWeight: 700 }}
              onClick={() => naviguer({ page: type === 'acheteur' ? 'inscription-acheteur' : 'inscription-collaborateur' })}
            >
              {type === 'acheteur' ? 'Creer un compte acheteur' : 'Devenir collaborateur'}
            </span>
          </p>
        </div>
      </div>

      <p style={s.retour} onClick={() => naviguer({ page: 'accueil' })}>← Retour a la boutique</p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans',sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, cursor: 'pointer' },
  logoIcon: { width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#000' },
  logoText: { fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif" },
  card: { width: '100%', maxWidth: 420, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' },
  tabs: { display: 'flex' },
  tabBtn: { flex: 1, padding: '16px 0', background: 'rgba(255,255,255,0.02)', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  cardBody: { padding: '32px 28px' },
  titre: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  sousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' },
  erreurBox: { background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 18 },
  champ: { marginBottom: 16 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' },
  submitBtn: { width: '100%', padding: 13, borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 },
  bas: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 22 },
  retour: { marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' },
};