// src/templates/shared/MarketplaceInscriptionAcheteur.tsx
// e-Vend Studio — Inscription acheteur marketplace (partagee entre tous les templates multi-vendeur)

import { useState } from 'react';

const API_BASE = '/api';



interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (dest: any) => void;
}

export default function MarketplaceInscriptionAcheteur({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const gestionnaireId = vendeurId || config.gestionnaire_id;
  const accent = config.couleur_accent || '#fbbf24';
  const nom = config.nom_boutique || 'Ma Marketplace';

  const [prenom, setPrenom] = useState('');
  const [nomF, setNomF] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [telephone, setTelephone] = useState('');
  const [infolettre, setInfolettre] = useState(true);
  const [termesAcceptes, setTermesAcceptes] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    if (!prenom || !nomF || !email || !password) {
      setErreur('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (password !== passwordConfirm) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    if (!termesAcceptes) {
      setErreur('Vous devez accepter les conditions utilisation');
      return;
    }

    if (isDemo) {
      setSucces(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/acheteurs/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom, nom: nomF, email, mot_de_passe: password,
          telephone: telephone || null, infolettre,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSucces(true);
      } else {
        setErreur(data.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setErreur('Impossible de joindre le serveur');
    } finally {
      setSubmitting(false);
    }
  };

  if (succes) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.cardBody}>
            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>✅</div>
            <h1 style={{ ...s.titre, textAlign: 'center' }}>Compte cree !</h1>
            <p style={{ ...s.sousTitre, textAlign: 'center' }}>Vous pouvez maintenant vous connecter pour magasiner.</p>
            <button style={{ ...s.submitBtn, background: accent, color: '#000', marginTop: 12 }} onClick={() => naviguer({ page: 'login' })}>
              Aller a la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`* { box-sizing: border-box; } .mv-input:focus { outline: none; }`}</style>

      <div style={s.logoWrap} onClick={() => naviguer({ page: 'accueil' })}>
        <div style={{ ...s.logoIcon, background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>{(nom[0] || 'M').toUpperCase()}</div>
        <span style={s.logoText}>{nom}</span>
      </div>

      <div style={s.card}>
        <div style={s.cardBody}>
          <h1 style={s.titre}>Creer un compte acheteur</h1>
          <p style={s.sousTitre}>Suivez vos commandes et vos favoris</p>

          {erreur && <div style={s.erreurBox}>⚠️ {erreur}</div>}

          <form onSubmit={handleSubmit}>
            <div style={s.row2}>
              <div style={s.champ}>
                <label style={s.label}>Prenom</label>
                <input className="mv-input" style={s.input} value={prenom} onChange={e => setPrenom(e.target.value)} />
              </div>
              <div style={s.champ}>
                <label style={s.label}>Nom</label>
                <input className="mv-input" style={s.input} value={nomF} onChange={e => setNomF(e.target.value)} />
              </div>
            </div>

            <div style={s.champ}>
              <label style={s.label}>Courriel</label>
              <input className="mv-input" type="email" style={s.input} value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div style={s.champ}>
              <label style={s.label}>Telephone (optionnel)</label>
              <input className="mv-input" style={s.input} value={telephone} onChange={e => setTelephone(e.target.value)} />
            </div>

            <div style={s.row2}>
              <div style={s.champ}>
                <label style={s.label}>Mot de passe</label>
                <input className="mv-input" type="password" style={s.input} value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={s.champ}>
                <label style={s.label}>Confirmer</label>
                <input className="mv-input" type="password" style={s.input} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
              </div>
            </div>

            <div style={s.cbxRow} onClick={() => setInfolettre(v => !v)}>
              <div style={{ ...s.cbx, ...(infolettre ? { background: `${accent}33`, borderColor: accent } : {}) }}>{infolettre && '✓'}</div>
              <span style={s.cbxTexte}>Je veux recevoir les offres et nouveautes par courriel</span>
            </div>

            <div style={s.cbxRow} onClick={() => setTermesAcceptes(v => !v)}>
              <div style={{ ...s.cbx, ...(termesAcceptes ? { background: `${accent}33`, borderColor: accent } : {}) }}>{termesAcceptes && '✓'}</div>
              <span style={s.cbxTexte}>J'accepte les conditions utilisation et la politique de confidentialite</span>
            </div>

            <button type="submit" disabled={submitting} style={{ ...s.submitBtn, background: submitting ? 'rgba(255,255,255,0.1)' : accent, color: '#000' }}>
              {submitting ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>

          <p style={s.bas}>
            Deja un compte ?{' '}
            <span style={{ color: accent, cursor: 'pointer', fontWeight: 700 }} onClick={() => naviguer({ page: 'login' })}>Se connecter</span>
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
  card: { width: '100%', maxWidth: 460, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 },
  cardBody: { padding: '32px 28px' },
  titre: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  sousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 22px' },
  erreurBox: { background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 18 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  champ: { marginBottom: 16 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit' },
  cbxRow: { display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14 },
  cbx: { width: 19, height: 19, minWidth: 19, borderRadius: 5, border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginTop: 1 },
  cbxTexte: { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 },
  submitBtn: { width: '100%', padding: 13, borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 },
  bas: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 22 },
  retour: { marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' },
};