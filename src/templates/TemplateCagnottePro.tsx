// src/templates/TemplateCagnottePro.tsx
// e-Vend Studio — CagnottePro — Page publique avec modal de don

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SousTypeCagnotte = 'personnel' | 'projet' | 'communaute' | 'environnement' | 'urgence';

export interface ConfigCagnotte {
  sousType: SousTypeCagnotte;
  nomEntreprise: string;
  slogan: string;
  description: string;
  logoUrl: string;
  photoHeroUrl: string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurFond: string;
  couleurTexte: string;
  police: 'moderne' | 'classique' | 'manuscrite';

  // Campagne
  nomCampagne: string;
  descriptionCampagne: string;
  objectifMontant: number;
  photoCampagne: string;
  dateFinCampagne: string;
  nomOrganisateur: string;
  photoOrganisateur: string;
  bioOrganisateur: string;

  // Mises à jour
  misesAJour: { date: string; titre: string; texte: string }[];

  // Montants suggérés
  montantsSuggeres: number[];
  montantMinimum: number;
  messageRemerciement: string;

  // Contact
  email: string;
  instagram: string;
  facebook: string;
  siteExterne: string;
}

export const CONFIG_CAGNOTTE_DEFAUT: ConfigCagnotte = {
  sousType: 'personnel',
  nomEntreprise: 'Ma Cagnotte',
  slogan: 'Aidez-moi à atteindre mon objectif',
  description: 'Votre soutien compte énormément.',
  logoUrl: '',
  photoHeroUrl: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#c9a96e',
  couleurSecondaire: '#1a1a1a',
  couleurFond: '#fafaf8',
  couleurTexte: '#1a1a1a',
  police: 'moderne',
  nomCampagne: 'Aidez Marie à financer son traitement',
  descriptionCampagne: `Bonjour à tous,\n\nJe m'appelle Marie et j'ai besoin de votre aide. Suite à un accident, je me retrouve dans une situation difficile et j'ai besoin de fonds pour couvrir mes frais médicaux.\n\nChaque don, aussi petit soit-il, fait une énorme différence dans ma vie. Merci du fond du cœur pour votre générosité.`,
  objectifMontant: 5000,
  photoCampagne: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
  dateFinCampagne: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  nomOrganisateur: 'Marie Dupont',
  photoOrganisateur: '',
  bioOrganisateur: 'Je suis mère de famille de 3 enfants basée à Montréal.',
  misesAJour: [
    { date: new Date().toISOString(), titre: 'Merci pour votre soutien!', texte: 'Grâce à vous, nous avons déjà atteint 30% de notre objectif. Chaque don compte!' },
  ],
  montantsSuggeres: [10, 25, 50, 100],
  montantMinimum: 5,
  messageRemerciement: 'Merci infiniment pour votre générosité! Votre don fait une réelle différence. Un reçu vous sera envoyé par courriel.',
  email: '',
  instagram: '',
  facebook: '',
  siteExterne: '',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getPoliceCSS(p: string) {
  switch(p) {
    case 'classique': return "'Playfair Display', Georgia, serif";
    case 'manuscrite': return "'Dancing Script', cursive";
    default: return "'Inter', sans-serif";
  }
}

function getGoogleFonts(p: string) {
  switch(p) {
    case 'classique': return 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap';
    default: return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  }
}

const EMOJI_TYPE: Record<SousTypeCagnotte, string> = {
  personnel:     '❤️',
  projet:        '🚀',
  communaute:    '🤝',
  environnement: '🌿',
  urgence:       '🆘',
};

// ─── MODAL DE DON ─────────────────────────────────────────────────────────────
interface ModalDonProps {
  config: ConfigCagnotte;
  cp: string; cs: string;
  siteId?: number; vendeurId?: number;
  onClose: () => void;
}

function ModalDon({ config, cp, cs, siteId, vendeurId, onClose }: ModalDonProps) {
  const [montant, setMontant]       = useState<number | ''>(25);
  const [montantCustom, setMontantCustom] = useState('');
  const [nomDonateur, setNomDonateur] = useState('');
  const [anonyme, setAnonyme]       = useState(false);
  const [message, setMessage]       = useState('');
  const [etape, setEtape]           = useState<'form' | 'envoi' | 'erreur'>('form');
  const [erreurMsg, setErreurMsg]   = useState('');

  const montantFinal = montantCustom ? parseFloat(montantCustom) : (typeof montant === 'number' ? montant : 0);

  const handleDon = async () => {
    if (!montantFinal || montantFinal < config.montantMinimum) {
      setErreurMsg(`Le montant minimum est de ${config.montantMinimum}$.`);
      return;
    }
    if (!anonyme && !nomDonateur.trim()) {
      setErreurMsg('Veuillez entrer votre nom ou cocher "Anonyme".');
      return;
    }
    setEtape('envoi');
    try {
      const res = await fetch('/api/dons/creer-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          vendeur_id: vendeurId,
          montant: montantFinal,
          nom_donateur: anonyme ? 'Anonyme' : nomDonateur.trim(),
          anonyme,
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setEtape('erreur');
        setErreurMsg(data.message || 'Erreur lors de la création du paiement.');
      }
    } catch {
      setEtape('erreur');
      setErreurMsg('Impossible de joindre le serveur.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 480, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>💝 Faire un don</h2>
            <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>{config.nomCampagne}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {etape === 'erreur' ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 20 }}>{erreurMsg}</p>
            <button onClick={() => { setEtape('form'); setErreurMsg(''); }}
              style={{ padding: '10px 24px', background: cp, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Réessayer</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Montants suggérés */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                Choisir un montant
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                {config.montantsSuggeres.map(m => (
                  <button key={m} onClick={() => { setMontant(m); setMontantCustom(''); }}
                    style={{ padding: '10px 6px', border: `2px solid ${montant === m && !montantCustom ? cp : '#e5e7eb'}`, borderRadius: 8, background: montant === m && !montantCustom ? `${cp}15` : '#fff', color: montant === m && !montantCustom ? cp : '#555', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {m}$
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#888', fontWeight: 600 }}>$</span>
                <input type="number" min={config.montantMinimum} value={montantCustom}
                  onChange={e => { setMontantCustom(e.target.value); setMontant(''); }}
                  placeholder={`Autre montant (min. ${config.montantMinimum}$)`}
                  style={{ width: '100%', padding: '10px 12px 10px 28px', border: `2px solid ${montantCustom ? cp : '#e5e7eb'}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any }}
                  onFocus={e => { setMontant(''); }} />
              </div>
            </div>

            {/* Anonyme */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>Votre nom</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div onClick={() => setAnonyme(!anonyme)}
                  style={{ width: 40, height: 22, borderRadius: 11, background: anonyme ? cp : '#ddd', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: anonyme ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <span style={{ fontSize: 13, color: '#555' }}>Don anonyme (votre nom n'apparaîtra pas)</span>
              </div>
              {!anonyme && (
                <input value={nomDonateur} onChange={e => setNomDonateur(e.target.value)} placeholder="Votre prénom et nom"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any }}
                  onFocus={e => e.target.style.borderColor = cp} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              )}
            </div>

            {/* Message */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Message (optionnel)
              </label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                placeholder="Laissez un mot d'encouragement..."
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'none' as any, fontFamily: 'inherit', boxSizing: 'border-box' as any }}
                onFocus={e => e.target.style.borderColor = cp} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>

            {erreurMsg && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                ⚠️ {erreurMsg}
              </div>
            )}

            {/* Résumé */}
            {montantFinal > 0 && (
              <div style={{ background: `${cp}10`, border: `1px solid ${cp}30`, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#666' }}>Votre don</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: cp }}>{montantFinal.toFixed(2)}$</span>
              </div>
            )}

            <button onClick={handleDon} disabled={etape === 'envoi' || !montantFinal}
              style={{ padding: '14px', background: !montantFinal ? '#e5e7eb' : `linear-gradient(135deg, ${cs}dd, ${cp})`, border: 'none', borderRadius: 12, color: !montantFinal ? '#aaa' : '#fff', fontSize: 16, fontWeight: 700, cursor: !montantFinal ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {etape === 'envoi' ? '⏳ Redirection...' : `💝 Faire un don de ${montantFinal ? montantFinal.toFixed(2) + '$' : '...'}`}
            </button>

            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', margin: 0 }}>
              🔒 Paiement sécurisé via Stripe. Vous recevrez un reçu par courriel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BARRE DE PROGRESSION ─────────────────────────────────────────────────────
function BarreProgression({ total, objectif, cp, nbDonateurs }: { total: number; objectif: number; cp: string; nbDonateurs: number }) {
  const pct = Math.min(Math.round((total / objectif) * 100), 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: cp }}>{total.toFixed(0)}$</span>
        <span style={{ fontSize: 13, color: '#888' }}>objectif {objectif.toLocaleString()}$</span>
      </div>
      <div style={{ height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${cp}cc, ${cp})`, borderRadius: 5, transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>{pct}% atteint</span>
        <span style={{ fontSize: 13, color: '#888' }}>· {nbDonateurs} donateur{nbDonateurs > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
interface Props {
  config?: Partial<ConfigCagnotte>;
  isPreviewMobile?: boolean;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateCagnottePro({ config: configPartiel, isPreviewMobile = false, siteId, vendeurId }: Props) {
  const config: ConfigCagnotte = { ...CONFIG_CAGNOTTE_DEFAUT, ...configPartiel };
  const isMobile = isPreviewMobile || (typeof window !== 'undefined' && window.innerWidth <= 768);
  const police   = getPoliceCSS(config.police);
  const heroRef  = useRef<HTMLDivElement>(null);
  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const cf = config.couleurFond;
  const ct = config.couleurTexte;

  const [modalDon, setModalDon]   = useState(false);
  const [donsData, setDonsData]   = useState<{ total: number; count: number; dons: any[] }>({ total: 0, count: 0, dons: [] });

  // Vérifier retour Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('don') === 'succes') setModalDon(false);
  }, []);

  // Charger les dons publics
  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/dons/public/${siteId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setDonsData({ total: parseFloat(data.total || '0'), count: data.count || 0, dons: data.dons || [] });
      })
      .catch(() => {});
  }, [siteId]);

  // Parallax
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) heroRef.current.style.backgroundPositionY = `${window.scrollY * 0.2}px`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const joursRestants = Math.max(0, Math.ceil((new Date(config.dateFinCampagne).getTime() - Date.now()) / 86400000));
  const emoji = EMOJI_TYPE[config.sousType];

  return (
    <div style={{ fontFamily: police, background: cf, color: ct, minHeight: '100vh', overflowX: 'hidden' }}>
      <link rel="stylesheet" href={getGoogleFonts(config.police)} />
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .nav-link { transition: color 0.2s; }
        .nav-link:hover { color: ${cp} !important; }
        .btn-don {
          background: linear-gradient(135deg, ${cp}, ${cp}dd);
          color: #fff; border: none; padding: 14px 36px;
          border-radius: 50px; font-size: 16px; font-weight: 800;
          cursor: pointer; box-shadow: 0 6px 24px ${cp}44;
          transition: transform 0.2s, box-shadow 0.2s;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-don:hover { transform: translateY(-3px); box-shadow: 0 10px 32px ${cp}66; }
        .don-card { transition: transform 0.2s; }
        .don-card:hover { transform: translateY(-2px); }
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none} }
        .separateur { width: 48px; height: 3px; background: ${cp}; border-radius: 2px; margin: 14px 0 20px; }
        .sep-centre { margin: 14px auto 20px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${cp}60; border-radius: 3px; }
      `}</style>

      {/* MODAL */}
      {modalDon && <ModalDon config={config} cp={cp} cs={cs} siteId={siteId} vendeurId={vendeurId} onClose={() => setModalDon(false)} />}

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: `${cf}ee`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${cp}22`, height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 32, objectFit: 'contain' }} />}
            <span style={{ fontSize: 18, fontWeight: 700, color: cs }}>{config.nomEntreprise}</span>
          </div>
          <button onClick={() => setModalDon(true)} className="btn-don" style={{ padding: '9px 22px', fontSize: 14 }}>
            💝 Faire un don
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{ minHeight: '70vh', backgroundImage: `url(${config.photoHeroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${cs}99 0%, ${cs}dd 100%)` }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, padding: '80px 24px 0' }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>{emoji} CagnottePro</p>
          <h1 style={{ fontSize: `clamp(28px, 6vw, 58px)`, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>{config.nomCampagne}</h1>
          <p style={{ fontSize: `clamp(14px, 2vw, 18px)`, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 36, maxWidth: 540, margin: '0 auto 36px' }}>{config.slogan}</p>
          <button onClick={() => setModalDon(true)} className="btn-don" style={{ fontSize: 17, padding: '15px 40px' }}>
            💝 Faire un don maintenant
          </button>
        </div>
        <div style={{ position: 'absolute', bottom: 28, left: '50%', color: 'rgba(255,255,255,0.5)', fontSize: 20, animation: 'bounce 2s infinite' }}>↓</div>
      </section>

      {/* SECTION PRINCIPALE */}
      <section style={{ padding: '64px 24px', background: cf }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 48, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>

          {/* COLONNE GAUCHE — Description + Mises à jour */}
          <div style={{ flex: 1 }}>
            {/* Photo campagne */}
            {config.photoCampagne && (
              <img src={config.photoCampagne} alt="campagne" style={{ width: '100%', borderRadius: 12, marginBottom: 32, boxShadow: `0 8px 32px ${cs}20`, objectFit: 'cover', maxHeight: 380 }} />
            )}

            {/* Description */}
            <h2 style={{ fontSize: `clamp(20px, 3vw, 28px)`, fontWeight: 700, color: cs, marginBottom: 6 }}>À propos de cette campagne</h2>
            <div className="separateur" />
            <div style={{ fontSize: 15, color: `${ct}99`, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 40 }}>
              {config.descriptionCampagne}
            </div>

            {/* Organisateur */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px', background: `${cp}08`, borderRadius: 12, border: `1px solid ${cp}20`, marginBottom: 40 }}>
              {config.photoOrganisateur
                ? <img src={config.photoOrganisateur} alt="organisateur" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
                : <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${cp}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>👤</div>
              }
              <div>
                <p style={{ fontSize: 13, color: '#888', margin: '0 0 2px' }}>Organisé par</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: cs, margin: '0 0 4px' }}>{config.nomOrganisateur}</p>
                {config.bioOrganisateur && <p style={{ fontSize: 12, color: `${ct}77`, margin: 0 }}>{config.bioOrganisateur}</p>}
              </div>
            </div>

            {/* Mises à jour */}
            {config.misesAJour.length > 0 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: cs, marginBottom: 6 }}>Mises à jour</h3>
                <div className="separateur" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {config.misesAJour.map((m, i) => (
                    <div key={i} style={{ padding: '18px 20px', background: '#fff', borderRadius: 10, border: `1px solid ${cp}20`, borderLeft: `4px solid ${cp}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: cs, margin: 0 }}>{m.titre}</p>
                        <p style={{ fontSize: 11, color: '#aaa', margin: 0 }}>{new Date(m.date).toLocaleDateString('fr-CA')}</p>
                      </div>
                      <p style={{ fontSize: 13, color: `${ct}88`, lineHeight: 1.6, margin: 0 }}>{m.texte}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE — Barre progression + Dons */}
          <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${cp}20`, position: 'sticky', top: 80 }}>

              {/* Progression */}
              <BarreProgression
                total={donsData.total || 0}
                objectif={config.objectifMontant}
                cp={cp}
                nbDonateurs={donsData.count}
              />

              {/* Jours restants */}
              <div style={{ display: 'flex', gap: 12, margin: '20px 0', padding: '12px 16px', background: joursRestants < 7 ? '#fee2e2' : `${cp}10`, borderRadius: 8, border: `1px solid ${joursRestants < 7 ? '#fca5a5' : cp + '30'}` }}>
                <span style={{ fontSize: 20 }}>{joursRestants < 7 ? '⏰' : '📅'}</span>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: joursRestants < 7 ? '#dc2626' : cs, margin: 0 }}>{joursRestants} jours</p>
                  <p style={{ fontSize: 11, color: '#888', margin: 0 }}>restants pour contribuer</p>
                </div>
              </div>

              {/* Bouton don */}
              <button onClick={() => setModalDon(true)} className="btn-don" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 16, borderRadius: 12, marginBottom: 12 }}>
                💝 Faire un don
              </button>
              <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', margin: 0 }}>🔒 Paiement sécurisé via Stripe</p>

              {/* Derniers dons */}
              {donsData.dons.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Derniers donateurs
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {donsData.dons.slice(0, 5).map((d: any, i: number) => (
                      <div key={i} className="don-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${cp}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                          {d.nom_donateur === 'Anonyme' ? '🕶' : d.nom_donateur.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: cs, margin: 0 }}>{d.nom_donateur}</p>
                          {d.message && <p style={{ fontSize: 11, color: '#888', margin: 0, fontStyle: 'italic' }}>"{d.message.substring(0, 40)}{d.message.length > 40 ? '...' : ''}"</p>}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: cp, flexShrink: 0 }}>{parseFloat(d.montant).toFixed(0)}$</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PARTAGE */}
      <section style={{ padding: '60px 24px', background: `${cp}10`, borderTop: `1px solid ${cp}20` }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Partagez</p>
          <h2 style={{ fontSize: `clamp(20px, 3vw, 30px)`, fontWeight: 700, color: cs, marginBottom: 8 }}>Aidez-nous à passer le mot!</h2>
          <div className="separateur sep-centre" />
          <p style={{ fontSize: 14, color: `${ct}88`, marginBottom: 24 }}>Chaque partage peut faire la différence.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {config.facebook && (
              <a href={`https://facebook.com/${config.facebook}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: '10px 20px', background: '#1877f2', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>👥 Facebook</a>
            )}
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: '10px 20px', background: '#e1306c', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>📷 Instagram</a>
            )}
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Lien copié!'); }}
              style={{ padding: '10px 20px', background: cs, borderRadius: 8, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🔗 Copier le lien</button>
          </div>
        </div>
      </section>

      <footer style={{ padding: 20, background: cs, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {config.nomEntreprise} — Propulsé par <span style={{ color: cp }}>e-Vend Studio CagnottePro</span>
        </p>
      </footer>
    </div>
  );
}