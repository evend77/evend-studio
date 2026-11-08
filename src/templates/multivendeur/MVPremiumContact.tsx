// CHEMIN : src/templates/multivendeur/MVPremiumContact.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Page Contact
// Adapté de Contact.tsx (e-Vend) : formulaire + anti-spam (champ invisible + délai minimum), aux couleurs du thème.
// Contenu configurable : Configurer mes pages › Contact (config.extra.contact). Les messages arrivent dans Multi-vendeur › Contact.

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';
import MVPremiumFooter from './MVPremiumFooter';
import { fondDe, fondNav } from './mvTheme';
import { nettoyerTexte } from './mvSecurite';
import { MVSouhaitsAcces } from './MVFavoris';

const API_BASE = '/api';

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
}

function Navbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const nom = config?.nom_boutique || 'Ma Marketplace';
  const accent = config?.couleur_accent || '#fbbf24';
  const liens: { label: string; dest: NavMV }[] = [{ label: 'Accueil', dest: { page: 'accueil' } }, { label: 'Catalogue', dest: { page: 'catalogue' } }, { label: 'Boutiques', dest: { page: 'boutiques' } }];
  const aller = (d: NavMV) => { setMenuOuvert(false); naviguer(d); };
  return (
    <nav style={{ ...s.nav, background: fondNav(config) }}>
      <style>{`
        @media (max-width:768px) {
          .mvn-liens { display:none !important; }
          .mvn-burger { display:flex !important; }
          .mvn-inner { padding:0 14px !important; gap:12px !important; }
        }
      `}</style>
      <div className="mvn-inner" style={s.navInner}>
        <div style={{ ...s.navLogo, minWidth: 0, flexShrink: 1 }} onClick={() => aller({ page: 'accueil' })}>
          <div style={{ ...s.logoIcon, background: `linear-gradient(135deg,${accent},${accent}cc)`, flexShrink: 0 }}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={{ ...s.logoText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
        </div>
        <div className="mvn-liens" style={s.navLinks}>
          {liens.map(l => <span key={l.label} style={s.navLink} onClick={() => aller(l.dest)}>{l.label}</span>)}
          <MVSouhaitsAcces variante="entete" gestionnaireId={config?.gestionnaire_id} isDemo={!!config?.__demo} naviguer={naviguer} />
          <button onClick={() => aller({ page: 'login' })} style={{ padding: '8px 18px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
        </div>
        <button className="mvn-burger" aria-label="Menu" onClick={() => setMenuOuvert(v => !v)}
          style={{ display: 'none', marginLeft: 'auto', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}>
          {menuOuvert ? '✕' : '☰'}
        </button>
      </div>
      {menuOuvert && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99, background: fondDe(config), borderTop: '1px solid rgba(255,255,255,0.08)', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
          {liens.map(l => (
            <div key={l.label} onClick={() => aller(l.dest)} style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.85)', fontSize: 15, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{l.label}</div>
          ))}
          <div style={{ padding: '14px 20px' }}>
            <button onClick={() => aller({ page: 'login' })} style={{ width: '100%', padding: 12, background: accent, border: 'none', borderRadius: 10, color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Mon compte</button>
          </div>
        </div>
      )}
    </nav>
  );
}

const DEFAUTS = {
  titre: 'Contactez-nous',
  sous_titre: 'Une question ? Une suggestion ? Notre équipe est là pour vous aider',
  formulaire_titre: 'Envoyez-nous un message',
  formulaire_sous_titre: 'Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.',
  message_succes: 'Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.',
};

const DEMO_CONTACT = { courriel: 'info@exemple.com', horaires: 'Lundi au vendredi : 9 h – 17 h\nSamedi : 10 h – 14 h\nDimanche : fermé', localisation: 'Québec, Canada', delai: 'Nous nous engageons à vous répondre sous 24 à 48 heures ouvrables.' };

export default function MVPremiumContact({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const gId = vendeurId || config.gestionnaire_id;
  const accent = config.couleur_accent || '#fbbf24';
  const fond = fondDe(config);
  const c = { ...(isDemo ? DEMO_CONTACT : {}), ...(config?.extra?.contact || {}) } as Record<string, any>;
  const val = (k: keyof typeof DEFAUTS) => (typeof c[k] === 'string' && c[k].trim() ? c[k] : DEFAUTS[k]);

  const [debut] = useState(Date.now());
  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '', honeypot: '' });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [popup, setPopup] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 6000);
    return () => clearTimeout(t);
  }, [popup]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: name === 'message' ? nettoyerTexte(value, 5000) : nettoyerTexte(value, 254).replace(/\n/g, '') }));
    if (erreurs[name]) setErreurs(p => ({ ...p, [name]: '' }));
  };

  const valider = () => {
    const e: Record<string, string> = {};
    if (form.nom.trim().length < 2) e.nom = form.nom.trim() ? 'Le nom doit contenir au moins 2 caractères' : 'Le nom est requis';
    if (!form.email.trim()) e.email = 'Le courriel est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Courriel invalide';
    if (form.sujet.trim().length < 3) e.sujet = form.sujet.trim() ? 'Le sujet doit contenir au moins 3 caractères' : 'Le sujet est requis';
    if (form.message.trim().length < 10) e.message = form.message.trim() ? 'Le message doit contenir au moins 10 caractères' : 'Le message est requis';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const envoyer = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!valider() || envoi) return;
    setEnvoi(true);
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500));
        setPopup({ type: 'ok', texte: 'Mode démo : le message n\'a pas été envoyé.' });
      } else {
        // Formulaire e-Vend Studio existant : courriel d'alerte au gestionnaire, anti-spam, quota, enregistrement du message
        const res = await fetch(`${API_BASE}/studio/contact`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom_expediteur: form.nom, email_expediteur: form.email, sujet: form.sujet, message: form.message,
            vendeur_id: gId, template_id: 'multivendeur-premium',
            honeypot: form.honeypot, form_start_time: debut,
          }),
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          setPopup({ type: 'ok', texte: val('message_succes') });
          setForm({ nom: '', email: '', sujet: '', message: '', honeypot: '' });
        } else {
          setPopup({ type: 'err', texte: d.message || d.error || 'Une erreur est survenue. Veuillez réessayer.' });
        }
      }
    } catch {
      setPopup({ type: 'err', texte: 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.' });
    }
    setEnvoi(false);
  };

  // Colonne d'informations : chaque bloc n'apparaît que s'il est rempli
  const lignes = (t: any) => String(t || '').split('\n').map((x: string) => x.trim()).filter(Boolean);
  const blocs: { titre: string; contenu: React.ReactNode }[] = [];
  if (c.courriel) blocs.push({ titre: '📧 Courriel', contenu: <a href={`mailto:${c.courriel}`} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textDecoration: 'none', overflowWrap: 'anywhere' }}>{c.courriel}</a> });
  if (lignes(c.horaires).length) blocs.push({ titre: '⏰ Horaires', contenu: <>{lignes(c.horaires).map((l: string, i: number) => <p key={i} style={s.infoTexte}>{l}</p>)}</> });
  if (c.localisation) blocs.push({ titre: '📍 Localisation', contenu: <p style={s.infoTexte}>{c.localisation}</p> });
  if (c.delai) blocs.push({ titre: '⚡ Délai de réponse', contenu: <p style={s.infoTexte}>{c.delai}</p> });

  const champ: React.CSSProperties = { ...s.input, borderColor: 'rgba(255,255,255,0.1)' };
  const err = (k: string): React.CSSProperties => (erreurs[k] ? { borderColor: '#ef4444' } : {});

  return (
    <div style={{ ...s.page, background: fond }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .mvc-input:focus { border-color:${accent} !important; box-shadow:0 0 0 3px ${accent}22 !important; outline:none; }
        .mvc-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 30px ${accent}4d; }
        @keyframes mvcPop { from { opacity:0; transform:translate(-50%,-50%) scale(0.85); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes mvcSpin { to { transform:rotate(360deg); } }
        @media (max-width:768px) {
          .mvc-grille { grid-template-columns:1fr !important; gap:20px !important; }
          .mvc-main { padding:28px 14px 56px !important; }
          .mvc-hero { padding:32px 16px !important; }
          .mvc-carte { padding:20px !important; }
        }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      {popup && (
        <>
          <div onClick={() => setPopup(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1200 }} />
          <div role="alert" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(92vw, 420px)', background: fond, border: `1px solid ${popup.type === 'ok' ? `${accent}55` : '#ef444466'}`, borderRadius: 20, padding: 28, textAlign: 'center', zIndex: 1201, animation: 'mvcPop 0.25s ease' }}>
            <button onClick={() => setPopup(null)} aria-label="Fermer" style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ fontSize: 44, marginBottom: 12 }}>{popup.type === 'ok' ? '✅' : '❌'}</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 20px' }}>{popup.texte}</p>
            <button onClick={() => setPopup(null)} style={{ padding: '10px 24px', background: accent, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#000', cursor: 'pointer', fontFamily: 'inherit' }}>{popup.type === 'ok' ? 'Fermer' : 'Réessayer'}</button>
          </div>
        </>
      )}

      <div className="mvc-hero" style={{ background: `linear-gradient(135deg, ${accent}14 0%, transparent 100%)`, borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '48px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(2rem,6vw,3rem)', fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>{val('titre')}</h1>
          <p style={{ fontSize: 'clamp(0.9rem,3vw,1.1rem)', color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: '0 auto' }}>{val('sous_titre')}</p>
        </div>
      </div>

      {c.actif === false && !isDemo ? (
        <main className="mvc-main" style={{ padding: '80px 20px', flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>Cette page n'est pas disponible.</p>
        </main>
      ) : (
      <main className="mvc-main" style={{ padding: '48px 20px 80px', flex: 1 }}>
        <div style={{ maxWidth: blocs.length ? 1000 : 640, margin: '0 auto' }}>
          <div className="mvc-grille" style={{ display: 'grid', gridTemplateColumns: blocs.length ? '1fr 1fr' : '1fr', gap: 40, alignItems: 'start' }}>
            <div className="mvc-carte" style={s.carte}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{val('formulaire_titre')}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 26px' }}>{val('formulaire_sous_titre')}</p>
              <form onSubmit={envoyer} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Champ invisible anti-bot : un humain ne le voit pas, un robot le remplit */}
                <input type="text" name="honeypot" value={form.honeypot} onChange={change} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
                <div style={s.groupe}>
                  <label style={s.label}>Nom complet <span style={{ color: accent }}>*</span></label>
                  <input className="mvc-input" name="nom" value={form.nom} onChange={change} maxLength={100} placeholder="Jean Dupont" style={{ ...champ, ...err('nom') }} />
                  {erreurs.nom && <span style={s.erreur}>{erreurs.nom}</span>}
                </div>
                <div style={s.groupe}>
                  <label style={s.label}>Adresse courriel <span style={{ color: accent }}>*</span></label>
                  <input className="mvc-input" type="email" name="email" value={form.email} onChange={change} maxLength={254} placeholder="jean.dupont@exemple.com" style={{ ...champ, ...err('email') }} />
                  {erreurs.email && <span style={s.erreur}>{erreurs.email}</span>}
                </div>
                <div style={s.groupe}>
                  <label style={s.label}>Sujet <span style={{ color: accent }}>*</span></label>
                  <input className="mvc-input" name="sujet" value={form.sujet} onChange={change} maxLength={150} placeholder="Question sur une commande" style={{ ...champ, ...err('sujet') }} />
                  {erreurs.sujet && <span style={s.erreur}>{erreurs.sujet}</span>}
                </div>
                <div style={s.groupe}>
                  <label style={s.label}>Message <span style={{ color: accent }}>*</span></label>
                  <textarea className="mvc-input" name="message" value={form.message} onChange={change} rows={6} maxLength={5000} placeholder="Décrivez votre demande en détail..." style={{ ...champ, ...err('message'), resize: 'vertical', fontFamily: "'DM Sans',sans-serif" }} />
                  {erreurs.message && <span style={s.erreur}>{erreurs.message}</span>}
                </div>
                <button type="submit" className="mvc-btn" disabled={envoi} style={{ padding: '14px 28px', background: accent, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#000', cursor: envoi ? 'wait' : 'pointer', transition: 'all 0.2s', marginTop: 6, fontFamily: 'inherit', opacity: envoi ? 0.8 : 1 }}>
                  {envoi ? <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'mvcSpin 0.6s linear infinite' }} /> : 'Envoyer le message →'}
                </button>
              </form>
            </div>

            {blocs.length > 0 && (
              <div className="mvc-carte" style={s.carte}>
                {blocs.map((b, i) => (
                  <div key={b.titre} style={{ marginBottom: i === blocs.length - 1 ? 0 : 28 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: accent }}>{b.titre}</h3>
                    {b.contenu}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      )}

      <MVPremiumFooter vendeurId={vendeurId} isDemo={isDemo} config={config} naviguer={naviguer} />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:     { overflowX: 'clip', display: 'flex', flexDirection: 'column', minHeight: '100vh', color: '#fff', fontFamily: "'DM Sans',sans-serif" },
  nav:      { position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 },
  navLogo:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  logoIcon: { width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000' },
  logoText: { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" },
  navLinks: { display: 'flex', gap: 24, alignItems: 'center' },
  navLink:  { color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer' },
  carte:    { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 },
  groupe:   { display: 'flex', flexDirection: 'column', gap: 6 },
  label:    { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  input:    { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 14, color: '#fff', transition: 'all 0.2s' },
  erreur:   { fontSize: 11, color: '#ef4444' },
  infoTexte:{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 4px', overflowWrap: 'anywhere' },
};