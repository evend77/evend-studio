// src/templates/shared/MarketplaceInscriptionAcheteur.tsx
// e-Vend Studio — Inscription acheteur marketplace (partagee entre tous les templates multi-vendeur)

import { useState, useEffect, useRef } from 'react';

const API_BASE = '/api';

const PROVINCES: { code: string; nom: string }[] = [
  { code: 'AB', nom: 'Alberta' }, { code: 'BC', nom: 'Colombie-Britannique' }, { code: 'PE', nom: 'Île-du-Prince-Édouard' },
  { code: 'MB', nom: 'Manitoba' }, { code: 'NB', nom: 'Nouveau-Brunswick' }, { code: 'NS', nom: 'Nouvelle-Écosse' },
  { code: 'NU', nom: 'Nunavut' }, { code: 'ON', nom: 'Ontario' }, { code: 'QC', nom: 'Québec' },
  { code: 'SK', nom: 'Saskatchewan' }, { code: 'NL', nom: 'Terre-Neuve-et-Labrador' },
  { code: 'NT', nom: 'Territoires du Nord-Ouest' }, { code: 'YT', nom: 'Yukon' },
];
// Même table que le serveur (services/studio_securite_inscription.js)
const PROVINCE_PAR_LETTRE: Record<string, string> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB', G: 'QC', H: 'QC', J: 'QC',
  K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON', R: 'MB', S: 'SK', T: 'AB', V: 'BC', Y: 'YT',
};
const REGEX_CODE_POSTAL_CA = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_TEL = /^[0-9 ()+.\-]+$/;



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
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [province, setProvince] = useState('');
  const [codePostal, setCodePostal] = useState('');

  // ── Protection anti-robot : jeton signé émis au chargement + délai minimum ──
  const [jeton, setJeton] = useState('');
  const interaction = useRef(false);
  const ouvertLe = useRef(Date.now());
  useEffect(() => {
    if (isDemo || !gestionnaireId) return;
    let actif = true;
    fetch(`${API_BASE}/marketplace/${gestionnaireId}/inscription/jeton`)
      .then(r => r.json()).then(d => { if (actif && d && d.jeton) setJeton(d.jeton); })
      .catch(() => { /* le serveur refusera l'envoi sans jeton */ });
    const marquer = () => { interaction.current = true; };
    const evts = ['mousemove', 'touchstart', 'keydown', 'pointerdown'];
    evts.forEach(e => window.addEventListener(e, marquer, { passive: true }));
    return () => { actif = false; evts.forEach(e => window.removeEventListener(e, marquer)); };
  }, [gestionnaireId, isDemo]);
  // Champ piège (honeypot) : invisible pour un humain, rempli par les robots
  const [piege, setPiege] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    if (!prenom.trim() || !nomF.trim() || !email.trim() || !password || !adresse.trim() || !ville.trim() || !province || !codePostal.trim()) {
      setErreur('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (/[<>]/.test(prenom + nomF + adresse + ville)) {
      setErreur('Les caractères < et > ne sont pas permis.');
      return;
    }
    if (!REGEX_EMAIL.test(email.trim())) {
      setErreur('Adresse courriel invalide');
      return;
    }
    if (telephone.trim()) {
      const chiffres = telephone.replace(/\D/g, '');
      if (!REGEX_TEL.test(telephone.trim()) || chiffres.length < 10 || chiffres.length > 15) {
        setErreur('Numéro de téléphone invalide (ex : 514-555-1234)');
        return;
      }
    }
    if (!REGEX_CODE_POSTAL_CA.test(codePostal.trim())) {
      setErreur('Code postal invalide (format canadien attendu, ex : H2X 1Y4)');
      return;
    }
    {
      const attendue = PROVINCE_PAR_LETTRE[codePostal.trim().toUpperCase()[0]];
      const coherent = attendue ? province === attendue : (province === 'NT' || province === 'NU');
      if (!coherent) { setErreur('Le code postal ne correspond pas à la province sélectionnée.'); return; }
    }
    if (password !== passwordConfirm) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (password.length > 72) {
      setErreur('Le mot de passe est trop long (72 caractères maximum)');
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
    if (!isDemo) {
      if (piege) { setSucces(true); return; } // robot : faux succès, rien n'est envoyé
      if (Date.now() - ouvertLe.current < 3000) { setErreur('Veuillez patienter quelques secondes avant d\'envoyer le formulaire.'); return; }
      if (!interaction.current) { setErreur('Veuillez remplir le formulaire manuellement.'); return; }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace/${gestionnaireId}/acheteurs/inscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom, nom: nomF, email, mot_de_passe: password,
          telephone: telephone.trim() || null, infolettre,
          adresse: adresse.trim(), ville: ville.trim(), province, code_postal: codePostal.trim().toUpperCase(),
          jeton, website: piege,
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
            {/* Champ piège : ne pas remplir (invisible pour les humains) */}
            <div style={s.piege} aria-hidden="true">
              <label>Site web</label>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={piege} onChange={e => setPiege(e.target.value)} />
            </div>

            <div style={s.row2}>
              <div style={s.champ}>
                <label style={s.label}>Prenom</label>
                <input className="mv-input" style={s.input} maxLength={100} autoComplete="given-name" value={prenom} onChange={e => setPrenom(e.target.value)} />
              </div>
              <div style={s.champ}>
                <label style={s.label}>Nom</label>
                <input className="mv-input" style={s.input} maxLength={100} autoComplete="family-name" value={nomF} onChange={e => setNomF(e.target.value)} />
              </div>
            </div>

            <div style={s.champ}>
              <label style={s.label}>Courriel</label>
              <input className="mv-input" type="email" maxLength={254} autoComplete="email" style={s.input} value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div style={s.champ}>
              <label style={s.label}>Telephone (optionnel)</label>
              <input className="mv-input" style={s.input} maxLength={30} autoComplete="tel" value={telephone} onChange={e => setTelephone(e.target.value)} />
            </div>

            <div style={s.section}>📦 Adresse de livraison principale</div>

            <div style={s.champ}>
              <label style={s.label}>Adresse</label>
              <input className="mv-input" style={s.input} maxLength={150} autoComplete="street-address" placeholder="Ex : 123, rue des Érables" value={adresse} onChange={e => setAdresse(e.target.value)} />
            </div>

            <div style={s.row2}>
              <div style={s.champ}>
                <label style={s.label}>Ville</label>
                <input className="mv-input" style={s.input} maxLength={80} autoComplete="address-level2" placeholder="Ex : Montréal" value={ville} onChange={e => setVille(e.target.value)} />
              </div>
              <div style={s.champ}>
                <label style={s.label}>Code postal</label>
                <input className="mv-input" style={s.input} maxLength={7} autoComplete="postal-code" placeholder="Ex : H2X 1Y4" value={codePostal} onChange={e => setCodePostal(e.target.value.toUpperCase())} />
              </div>
            </div>

            <div style={s.champ}>
              <label style={s.label}>Province</label>
              <select className="mv-input" style={{ ...s.input, colorScheme: 'dark' }} autoComplete="address-level1" value={province} onChange={e => setProvince(e.target.value)}>
                <option value="" style={s.option}>Sélectionnez votre province</option>
                {PROVINCES.map(pr => <option key={pr.code} value={pr.code} style={s.option}>{pr.nom}</option>)}
              </select>
            </div>

            <div style={s.section}>🔒 Sécurité du compte</div>

            <div style={s.row2}>
              <div style={s.champ}>
                <label style={s.label}>Mot de passe</label>
                <input className="mv-input" type="password" maxLength={72} autoComplete="new-password" style={s.input} value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={s.champ}>
                <label style={s.label}>Confirmer</label>
                <input className="mv-input" type="password" maxLength={72} autoComplete="new-password" style={s.input} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
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
  page: { position: 'relative', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans',sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, cursor: 'pointer' },
  logoIcon: { width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#000' },
  logoText: { fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif" },
  card: { width: '100%', maxWidth: 460, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 },
  cardBody: { padding: '32px 28px' },
  titre: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, margin: '0 0 4px' },
  sousTitre: { fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 22px' },
  erreurBox: { background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.35)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 18 },
  section: { fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)', margin: '6px 0 14px', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' },
  piege: { position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
  option: { background: '#1a1a1a', color: '#fff' },
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