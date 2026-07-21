/**
 * InscriptionGestionnaire.tsx
 * src/pages/gestionnaire/InscriptionGestionnaire.tsx
 *
 * - Crée un vrai gestionnaire via POST /api/gestionnaires (bcrypt côté server)
 * - statut = 'pending' jusqu'à approbation admin
 * - seller_id généré automatiquement par trigger BD (GES-2026-001)
 * - Logs d'audit dans le tableau de bord admin
 * - Erreurs affichées inline (pas d'alert())
 * - "Connectez-vous ici" → redirige vers la page de connexion (fonctionne avec HashRouter)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { log } from '../../services/logger';

const API_BASE = '';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  sellerName:      string;
  storeName:       string;
  email:           string;
  password:        string;
  confirmPassword: string;
  regionAdmin:     string;
  zoneExpedition:  string;
  typeEntreprise:  string;
  ageConfirmed:    boolean;
  termsAccepted:   boolean;
}

interface InscriptionGestionnaireProps {
  onSuccess?:        (gestionnaire: { id: number; seller_id: string; nom: string }, token?: string) => void;
  loginUrl?:         string;
  termsUrl?:         string;
}

// ─── Données selects ──────────────────────────────────────────────────────────
const REGIONS_ADMIN = [
  'Abitibi-Témiscamingue (QC)','Bas-Saint-Laurent (QC)','Capitale-Nationale (QC)',
  'Centre-du-Québec (QC)','Chaudière-Appalaches (QC)','Côte-Nord (QC)',
  'Estrie (QC)','Gaspésie–Îles-de-la-Madeleine (QC)','Lanaudière (QC)',
  'Laurentides (QC)','Laval (QC)','Mauricie (QC)','Montérégie (QC)',
  'Montréal (QC)','Nord-du-Québec (QC)','Outaouais (QC)','Saguenay–Lac-Saint-Jean (QC)',
  'Albert (N.-B.)','Carleton (N.-B.)','Charlotte (N.-B.)','Gloucester (N.-B.)',
  'Kent (N.-B.)','Kings (N.-B.)','Madawaska (N.-B.)','Northumberland (N.-B.)',
  'Queens (N.-B.)','Restigouche (N.-B.)','Saint John (N.-B.)','Sunbury (N.-B.)',
  'Victoria (N.-B.)','Westmorland (N.-B.)','York (N.-B.)',
  'Toronto (ON)','Ottawa (ON)','Hamilton (ON)','London (ON)','Brampton (ON)','Mississauga (ON)',
  'Calgary (AB)','Edmonton (AB)','Vancouver (CB)','Victoria (CB)',
  'Halifax (NS)','Winnipeg (MB)','Saskatoon (SK)','Regina (SK)',
];

const ZONES_EXPEDITION = [
  'Canada entier','Québec seulement','Ontario seulement','Nouveau-Brunswick seulement',
  'Provinces maritimes seulement (NB/ NS/ Î-P-É)','Québec et Ontario',
  'Est du Canada (QC/ NB/ NS/ Î-P-É/ T.-N.-L.)','Ouest du Canada (MB/ SK/ AB/ CB)',
  'Canada sans régions éloignées','Régions sélectionnées seulement (voir description)',
  'Aucun/ ramassage sur place seulement',
];

const TYPES_ENTREPRISE = [
  'Particulier (Personne physique / non enregistrée)',
  'Entreprise (Enregistrée au registre des entreprises)',
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:       { minHeight:'100vh', background:'linear-gradient(135deg,#0a1a3d,#0d2b5d,#173366)', backgroundSize:'400% 400%', fontFamily:'"Helvetica Neue",Helvetica,Arial,sans-serif', color:'#fff', overflowX:'hidden', padding:'40px 16px 80px' },
  col:        { maxWidth:'580px', margin:'0 auto', position:'relative' as const },
  logoWrap:   { textAlign:'center' as const, marginBottom:'-44px', position:'relative' as const, zIndex:10 },
  logoImg:    { width:'110px', height:'110px', objectFit:'contain' as const, borderRadius:'50%', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' },
  card:       { borderRadius:'25px', background:'linear-gradient(160deg,#0c1e45 0%,#0d2b5d 60%,#12336b 100%)', boxShadow:'0 24px 60px rgba(0,0,0,0.55)', padding:'58px 44px 36px', position:'relative' as const, overflow:'hidden' },
  cardDecor:  { position:'absolute' as const, top:'-60px', right:'-60px', width:'200px', height:'200px', background:'rgba(255,255,255,0.04)', borderRadius:'50%', pointerEvents:'none' as const },
  cardDecor2: { position:'absolute' as const, bottom:'-80px', left:'-50px', width:'250px', height:'250px', background:'rgba(45,106,159,0.08)', borderRadius:'50%', pointerEvents:'none' as const },
  title:      { textAlign:'center' as const, color:'#a8c6ff', letterSpacing:'1.5px', textTransform:'uppercase' as const, fontSize:'17px', fontWeight:'800', marginBottom:'6px', marginTop:'0' },
  subtitle:   { textAlign:'center' as const, color:'rgba(168,198,255,0.8)', fontSize:'13px', marginBottom:'28px' },
  label:      { color:'rgba(255,255,255,0.8)', fontSize:'12px', fontWeight:'700', letterSpacing:'0.8px', textTransform:'uppercase' as const, marginBottom:'6px', display:'block' },
  required:   { color:'#f87171' },
  fieldWrap:  { marginBottom:'18px' },
  input:      { width:'100%', background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'11px 15px', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' as const, transition:'all 0.25s' },
  inputFocus: { background:'rgba(255,255,255,0.16)', border:'1px solid rgba(96,165,250,0.5)', boxShadow:'0 0 12px rgba(0,90,180,0.35)' },
  select:     { width:'100%', background:'rgba(13,43,93,0.95)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', padding:'11px 15px', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' as const, cursor:'pointer', appearance:'none' as const, WebkitAppearance:'none' as const, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23a8c6ff' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center', paddingRight:'36px' },
  pwdWrap:    { position:'relative' as const },
  eyeBtn:     { position:'absolute' as const, top:'50%', right:'12px', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#7faaff', padding:'0', display:'flex', alignItems:'center' },
  hint:       { color:'rgba(255,255,255,0.38)', fontSize:'11px', marginTop:'5px', display:'block' },
  hintBlue:   { color:'rgba(168,198,255,0.55)', fontSize:'11px', marginTop:'5px', display:'block' },
  divider:    { height:'1px', background:'rgba(255,255,255,0.07)', margin:'22px 0' },
  cbxRow:     { display:'flex', alignItems:'flex-start', gap:'10px', cursor:'pointer', marginBottom:'14px' },
  cbxBox:     { width:'20px', height:'20px', minWidth:'20px', borderRadius:'5px', border:'2px solid rgba(127,170,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.04)', transition:'all 0.2s', marginTop:'2px' },
  cbxBoxOn:   { background:'rgba(96,165,250,0.2)', borderColor:'#60a5fa' },
  cbxText:    { fontSize:'13px', color:'rgba(255,255,255,0.8)', lineHeight:'1.5' },
  rcWrap:     { display:'flex', justifyContent:'center', margin:'20px 0 8px' },
  submitBtn:  { width:'100%', padding:'13px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#1a4a8a,#0d2b5d)', color:'#fff', fontSize:'15px', fontWeight:'800', letterSpacing:'0.8px', cursor:'pointer', marginTop:'18px', transition:'all 0.25s', textTransform:'uppercase' as const, boxShadow:'0 4px 16px rgba(0,0,0,0.3)' },
  loginText:  { textAlign:'center' as const, marginTop:'16px', fontSize:'13px', color:'rgba(168,198,255,0.7)' },
  footer:     { textAlign:'center' as const, fontSize:'11px', color:'rgba(255,255,255,0.2)', marginTop:'20px' },
  errorBox:   { background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.45)', borderRadius:'10px', padding:'12px 16px', marginBottom:'18px', color:'#fca5a5', fontSize:'13px', fontWeight:'600', display:'flex', alignItems:'flex-start', gap:'8px' },
  successCard:{ background:'rgba(255,255,255,0.07)', borderRadius:'14px', padding:'20px 28px', margin:'20px auto', maxWidth:'380px', textAlign:'left' as const },
  pendingBox: { background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:'10px', padding:'14px 20px', margin:'0 auto 24px', maxWidth:'380px' },
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

// ─── Select stylisé ───────────────────────────────────────────────────────────
function StyledSelect({ value, onChange, options, placeholder, focused, onFocus, onBlur }: {
  value: string; onChange: (v: string) => void; options: string[];
  placeholder: string; focused: boolean; onFocus: () => void; onBlur: () => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      onFocus={onFocus} onBlur={onBlur}
      style={{ ...S.select, ...(focused ? { border:'1px solid rgba(96,165,250,0.5)', boxShadow:'0 0 12px rgba(0,90,180,0.3)' } : {}) }}>
      <option value="" style={{ background:'#0d2b5d', color:'rgba(255,255,255,0.5)' }}>{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt} style={{ background:'#0d2b5d', color:'#fff' }}>{opt}</option>)}
    </select>
  );
}

// ─── Checkbox animée ──────────────────────────────────────────────────────────
function Cbx({ checked, onChange, children }: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <div style={S.cbxRow} onClick={() => onChange(!checked)}>
      <div style={{ ...S.cbxBox, ...(checked ? S.cbxBoxOn : {}) }}>
        {checked && <svg width="11" height="9" viewBox="0 0 11 9"><polyline points="1,5 4,8 10,1" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={S.cbxText}>{children}</span>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function InscriptionGestionnaire({
  onSuccess,
  loginUrl = '/login',
  termsUrl = '/termes-et-conditions',
}: InscriptionGestionnaireProps) {

  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    sellerName:'', storeName:'', email:'',
    password:'', confirmPassword:'',
    regionAdmin:'', zoneExpedition:'', typeEntreprise:'',
    ageConfirmed:false, termsAccepted:false,
  });
  const [showPwd,     setShowPwd]     = useState(false);
  const [showCPwd,    setShowCPwd]    = useState(false);
  const [focused,     setFocused]     = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [erreur,      setErreur]      = useState<string | null>(null);
  const [gestionnaireCree, setGestionnaireCree] = useState<{ seller_id:string; nom:string; id?:number } | null>(null);

  // ── Anti-bot : honeypot + timer + souris ──
  const [honeypot,      setHoneypot]      = useState('');
  const [mouseHasMoved, setMouseHasMoved] = useState(false);
  const formLoadTime = useRef<number>(Date.now());

  useEffect(() => { 
    log.admin('Page visitée', 'Inscription gestionnaire'); 
    console.log('🌐 API_BASE utilisée:', API_BASE);
    formLoadTime.current = Date.now();
    const onMove = () => setMouseHasMoved(true);
    window.addEventListener('mousemove', onMove, { once: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const set = useCallback((k: keyof FormData, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v })), []);

  // Redirection vers la page de connexion
  const goToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = loginUrl;
  };

  // Validation locale
  const valider = (): string | null => {
    if (!form.sellerName.trim())   return 'Le nom du gestionnaire est obligatoire.';
    if (!form.storeName.trim())    return 'Le nom de la boutique est obligatoire.';
    if (!form.email.includes('@')) return 'Adresse courriel invalide.';
    if (form.password.length < 8)  return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
    if (!form.regionAdmin)         return 'Veuillez sélectionner une région administrative.';
    if (!form.zoneExpedition)      return "Veuillez sélectionner une zone d'expédition.";
    if (!form.typeEntreprise)      return "Veuillez sélectionner un type d'entreprise.";
    if (!form.ageConfirmed)        return 'Vous devez confirmer votre âge (16 ans ou +).';
    if (!form.termsAccepted)       return "Vous devez accepter les conditions d'utilisation.";
    return null;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    const errValidation = valider();
    if (errValidation) {
      setErreur(errValidation);
      log.erreur('Validation inscription échouée', errValidation);
      return;
    }

    setSubmitting(true);
    try {
      // ── Vérifications anti-bot ──
      if (honeypot) {
        setGestionnaireCree({ seller_id: 'BOT', nom: form.sellerName });
        setSubmitting(false);
        return;
      }
      const tempsEcoule = (Date.now() - formLoadTime.current) / 1000;
      if (tempsEcoule < 3) {
        setErreur('Soumission trop rapide. Veuillez prendre le temps de remplir le formulaire.');
        setSubmitting(false);
        return;
      }
      if (!mouseHasMoved) {
        setErreur('Comportement inhabituel détecté. Veuillez réessayer.');
        setSubmitting(false);
        return;
      }

      log.admin("Tentative d'inscription", `Email: ${form.email} | Boutique: ${form.storeName}`);

      const response = await fetch(`${API_BASE}/api/gestionnaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom:             form.sellerName,
          email:           form.email,
          mot_de_passe:    form.password,
          boutique:        form.storeName,
          province:        form.regionAdmin,
          zone_expedition: form.zoneExpedition,
          type_entreprise: form.typeEntreprise,
          telephone:       '',
          plan:            'Gratuit',
          date_inscription: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        log.admin('Inscription réussie', `${data.vendeur?.seller_id} — ${form.email} [actif]`);
        setGestionnaireCree(data.vendeur);
        if (onSuccess) {
          onSuccess(data.vendeur, data.token);
        }
      } else {
        const msg = data.error || "Erreur lors de l'inscription.";
        setErreur(msg);
        log.erreur('Échec inscription', msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion au serveur.';
      setErreur(msg);
      log.erreur('Erreur réseau inscription', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (k: string): React.CSSProperties => ({
    ...S.input, ...(focused === k ? S.inputFocus : {}),
  });

  // ── Page succès ──────────────────────────────────────────────────────────────
  if (gestionnaireCree) {
    return (
      <>
        <style>{animCSS}</style>
        <div className="evend-page" style={S.page}>
          <div style={{ ...S.col, textAlign:'center', paddingTop:'80px' }}>
            <div style={{ fontSize:'64px', marginBottom:'20px' }}>🎉</div>
            <h2 style={{ color:'#a8c6ff', fontSize:'22px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px' }}>
              Compte créé avec succès !
            </h2>

            {/* ID vendeur */}
            <div style={S.successCard}>
              <p style={{ color:'rgba(168,198,255,0.6)', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', margin:'0 0 12px 0', letterSpacing:'1px' }}>
                Votre identifiant gestionnaire
              </p>
              <p style={{ color:'#fff', fontSize:'24px', fontWeight:'900', margin:'0 0 6px 0', letterSpacing:'3px', fontFamily:'monospace' }}>
                {gestionnaireCree.seller_id}
              </p>
              <p style={{ color:'rgba(168,198,255,0.7)', fontSize:'12px', margin:0 }}>
                Notez bien cet identifiant — il vous sera utile pour contacter le support.
              </p>
            </div>

            {/* Vérification de courriel requise */}
            <div style={S.pendingBox}>
              <p style={{ color:'#fbbf24', fontSize:'13px', fontWeight:'700', margin:'0 0 4px 0' }}>
                📧 Vérifiez votre adresse courriel
              </p>
              <p style={{ color:'rgba(251,191,36,0.8)', fontSize:'12px', margin:0 }}>
                Un courriel de confirmation vient de vous être envoyé à <strong>{form.email}</strong>.
                Cliquez sur le lien qu'il contient pour activer l'accès à votre tableau de bord —
                c'est une étape obligatoire, une seule fois.
              </p>
            </div>

            <button
              onClick={goToLogin}
              style={{ display:'inline-block', padding:'12px 28px', borderRadius:'10px', background:'linear-gradient(135deg,#1a4a8a,#0d2b5d)', color:'#fff', fontWeight:'700', border:'none', cursor:'pointer', fontSize:'14px' }}>
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

            <h4 style={S.title}>Créer un compte gestionnaire</h4>
            <p style={S.subtitle}>
              Vous avez déjà un compte ?{' '}
              <button
                onClick={goToLogin}
                style={{ color:'#7faaff', textDecoration:'none', fontWeight:'600', background:'none', border:'none', cursor:'pointer', fontSize:'13px' }}>
                Se connecter
              </button>
            </p>

            {/* ── Erreur inline ── */}
            {erreur && (
              <div style={S.errorBox}>
                <span style={{ fontSize:'16px', marginTop:'1px' }}>⚠️</span>
                <span>{erreur}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot anti-bot — invisible pour les humains, rempli par les bots */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' } as React.CSSProperties} aria-hidden="true">
                <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
              </div>

              {/* Nom vendeur */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Nom du gestionnaire <span style={S.required}>*</span></label>
                <input className="evend-inp" type="text" value={form.sellerName}
                  onChange={e => set('sellerName', e.target.value)}
                  onFocus={() => setFocused('sellerName')} onBlur={() => setFocused(null)}
                  style={inp('sellerName')} placeholder="Votre nom complet" autoFocus />
              </div>

              {/* Nom boutique */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Nom de votre future boutique <span style={S.required}>*</span></label>
                <input className="evend-inp" type="text" value={form.storeName}
                  onChange={e => set('storeName', e.target.value)}
                  onFocus={() => setFocused('storeName')} onBlur={() => setFocused(null)}
                  style={inp('storeName')} placeholder="Ex : Boutique Artisanat Marie" />
              </div>

              {/* Email */}
              <div style={S.fieldWrap}>
                <label style={S.label}>E-mail <span style={S.required}>*</span></label>
                <input className="evend-inp" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  style={inp('email')} placeholder="votre@courriel.ca" />
              </div>

              {/* Mot de passe */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Mot de passe <span style={S.required}>*</span></label>
                <div style={S.pwdWrap}>
                  <input className="evend-inp" type={showPwd ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    style={{ ...inp('password'), paddingRight:'44px' }}
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
                    style={{ ...inp('confirmPassword'), paddingRight:'44px' }}
                    placeholder="Confirmez votre mot de passe" autoComplete="new-password" />
                  <button type="button" style={S.eyeBtn} onClick={() => setShowCPwd(v => !v)}>
                    <EyeIcon on={showCPwd} />
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <span style={{ ...S.hint, color:'#f87171' }}>⚠️ Les mots de passe ne correspondent pas.</span>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
                  <span style={{ ...S.hint, color:'#86efac' }}>✅ Les mots de passe correspondent.</span>
                )}
              </div>

              {/* Région */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Région administrative <span style={S.required}>*</span></label>
                <StyledSelect value={form.regionAdmin} onChange={v => set('regionAdmin', v)}
                  options={REGIONS_ADMIN} placeholder="Veuillez sélectionner une option"
                  focused={focused==='regionAdmin'} onFocus={() => setFocused('regionAdmin')} onBlur={() => setFocused(null)} />
              </div>

              {/* Zone expédition */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Zones où la boutique expédie <span style={S.required}>*</span></label>
                <StyledSelect value={form.zoneExpedition} onChange={v => set('zoneExpedition', v)}
                  options={ZONES_EXPEDITION} placeholder="Veuillez sélectionner une option"
                  focused={focused==='zoneExpedition'} onFocus={() => setFocused('zoneExpedition')} onBlur={() => setFocused(null)} />
              </div>

              {/* Type entreprise */}
              <div style={S.fieldWrap}>
                <label style={S.label}>Type d'entreprise <span style={S.required}>*</span></label>
                <StyledSelect value={form.typeEntreprise} onChange={v => set('typeEntreprise', v)}
                  options={TYPES_ENTREPRISE} placeholder="Veuillez sélectionner une option"
                  focused={focused==='typeEntreprise'} onFocus={() => setFocused('typeEntreprise')} onBlur={() => setFocused(null)} />
              </div>

              <div style={S.divider} />

              {/* Checkbox âge */}
              <Cbx checked={form.ageConfirmed} onChange={v => set('ageConfirmed', v)}>
                Je déclare avoir 16 ans ou + (consentement parental pour les mineurs)
                <span style={S.required}> *</span>
              </Cbx>

              {/* Checkbox termes */}
              <Cbx checked={form.termsAccepted} onChange={v => set('termsAccepted', v)}>
                En vous inscrivant, vous acceptez{' '}
                <a href={termsUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color:'#7faaff', textDecoration:'none' }}
                  onClick={e => e.stopPropagation()}>les termes et conditions</a>
                <span style={S.required}> *</span>
              </Cbx>

              {/* Bouton submit */}
              <button className="evend-btn" type="submit" disabled={submitting}
                style={{ ...S.submitBtn, ...(submitting ? { opacity:0.6, cursor:'wait' } : {}) }}>
                {submitting ? '⏳ Création en cours…' : 'Créer Mon Compte Gestionnaire'}
              </button>
            </form>

            <p style={S.loginText}>
              Déjà inscrit ?{' '}
              <button
                onClick={goToLogin}
                style={{ color:'#7faaff', fontWeight:'600', textDecoration:'none', background:'none', border:'none', cursor:'pointer', fontSize:'13px' }}>
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
    box-shadow: 0 6px 24px rgba(0,0,0,0.4) !important;
  }
  select option { background-color: #0d2b5d !important; color: #fff !important; }
  button { font-family: inherit; }
`;