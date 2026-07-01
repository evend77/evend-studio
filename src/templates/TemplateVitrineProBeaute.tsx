// src/templates/TemplateVitrineProBeaute.tsx
// e-Vend Studio — Template PREMIUM 25$ — Vitrine Pro Beauté / Cosmétique
// Inspiré SkinGlow Wix — 100% original

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CaracteristiqueProduit {
  label: string;
}

export interface TemoignageBeaute {
  texte:  string;
  auteur: string;
}

export interface ConfigVitrineProBeaute {
  // Identité
  nomBoutique:         string;
  logoUrl:             string;
  couleurPrimaire:     string;   // rose pêche: '#f4a5a0'
  couleurSecondaire:   string;   // lavande: '#d8b4fe'
  couleurFond:         string;   // crème: '#fff5f5'
  couleurTexte:        string;   // prune foncé: '#3d1a4a'
  police:              'manuscrite' | 'elegant' | 'moderne';

  // Hero
  heroBgGradient:      string;   // ex: 'linear-gradient(135deg, #fce4dc, #f9d5e5)'
  heroTitreLigne1:     string;
  heroTitreLigne2:     string;
  heroBouton:          string;
  heroProduitPhoto:    string;   // photo produit principal (PNG fond transparent idéal)

  // Animations
  petalesActifs:       boolean;
  petalesVitesse:      number;   // 3-12 secondes
  petalesCouleur:      string;   // '#d8b4fe'
  papillonsActifs:     boolean;
  papillonsNb:         number;   // 2-6
  papillonsVitesse:    number;   // 1-4 secondes battements
  papillonsPhoto:      string;   // URL image papillon PNG transparent

  // Section À propos / titre central
  sousTitreSection:    string;
  textePresentation:   string;

  // Section caractéristiques (badges autour du produit)
  caracteristiques:    CaracteristiqueProduit[];   // max 6
  produitCentrePhoto:  string;  // photo produit (fond transparent)
  fondCaracteristiques:string;  // couleur fond dégradé section

  // Section collection / CTA
  collectionTitre:     string;
  collectionTexte:     string;
  collectionPhoto:     string;
  collectionBouton:    string;
  collectionFond:      string;   // '#c4b5fd' lavande

  // Témoignages
  temoignagesFond:     string;   // photo ou couleur fond
  temoignages:         TemoignageBeaute[];

  // Fleur décorative (rotation)
  fleurActif:          boolean;
  fleurPhoto:          string;   // URL rose/fleur PNG
  fleurVitesse:        number;   // 5-60 secondes pour 1 tour
  fleurTaille:         number;   // px (200-500)

  // Footer
  instagram:           string;
  facebook:            string;
  tiktok:              string;
  email:               string;
  telephone:           string;
  adresse:             string;
  copyright:           string;
}

// ─── CONFIG DÉFAUT ────────────────────────────────────────────────────────────

export const CONFIG_VITRINE_PRO_BEAUTE_DEFAUT: ConfigVitrineProBeaute = {
  nomBoutique:         'LunaGlow',
  logoUrl:             '',
  couleurPrimaire:     '#f4a5a0',
  couleurSecondaire:   '#d8b4fe',
  couleurFond:         '#fff8f8',
  couleurTexte:        '#3d1a4a',
  police:              'manuscrite',

  heroBgGradient:      'linear-gradient(135deg, #fce4dc 0%, #f9d5e5 40%, #fde8c8 100%)',
  heroTitreLigne1:     'Illuminate Your',
  heroTitreLigne2:     'Natural Glow',
  heroBouton:          'Découvrir →',
  heroProduitPhoto:    'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=600',

  petalesActifs:       true,
  petalesVitesse:      7,
  petalesCouleur:      '#d8b4fe',
  papillonsActifs:     true,
  papillonsNb:         4,
  papillonsVitesse:    2,
  papillonsPhoto:      '',

  sousTitreSection:    'Your Perfect Daily Essential',
  textePresentation:   'Bienvenue chez LunaGlow, où les soins rencontrent la simplicité. Notre crème hydratante signature avec FPS est conçue pour nourrir votre peau tout en la protégeant. Découvrez le secret d\'un teint radieux et en bonne santé.',

  caracteristiques:    [
    { label: 'Légèreté' },
    { label: 'Vegan' },
    { label: 'SPF protection' },
    { label: 'Sans parabens' },
    { label: 'Tous types de peau' },
    { label: 'Éco-emballage' },
  ],
  produitCentrePhoto:  'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=600',
  fondCaracteristiques:'linear-gradient(160deg, #fce4dc 0%, #e8d5c4 40%, #d4c5e2 80%, #c9d5f0 100%)',

  collectionTitre:     'Explorer la Collection Complète',
  collectionTexte:     'Des solutions de soins multifonctionnelles et de haute qualité qui subliment votre beauté naturelle et protègent contre les agressions du quotidien.',
  collectionPhoto:     'https://images.pexels.com/photos/3735641/pexels-photo-3735641.jpeg?auto=compress&cs=tinysrgb&w=800',
  collectionBouton:    'Découvrir →',
  collectionFond:      '#c4b5fd',

  temoignagesFond:     'https://images.pexels.com/photos/1084188/pexels-photo-1084188.jpeg?auto=compress&cs=tinysrgb&w=1600',
  temoignages: [
    { texte: '"LunaGlow a transformé ma routine. La crème hydratante est si légère sur ma peau, et j\'adore savoir que je suis protégée du soleil toute la journée."', auteur: '— Sarah M.' },
    { texte: '"J\'utilise LunaGlow depuis 3 mois, et ma peau n\'a jamais été aussi douce et lumineuse. Un produit incontournable!"', auteur: '— Marie-Claire B.' },
    { texte: '"Formule vegan, légère et efficace. Exactement ce que je cherchais pour une routine beauté responsable."', auteur: '— Emma L.' },
  ],

  fleurActif:          true,
  fleurPhoto:          'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=400',
  fleurVitesse:        20,
  fleurTaille:         320,

  instagram:           'lunaglow',
  facebook:            'lunaglow',
  tiktok:              'lunaglow',
  email:               'info@lunaglow.ca',
  telephone:           '514-555-0212',
  adresse:             '500 rue Ste-Catherine, Montréal, QC',
  copyright:           '© 2026 LunaGlow. Tous droits réservés.',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPolice(p: string) {
  if (p === 'manuscrite') return "'Dancing Script', 'Pacifico', cursive";
  if (p === 'elegant')    return "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  return "'Inter', system-ui, sans-serif";
}

// ─── PÉTALE ───────────────────────────────────────────────────────────────────

function Petales({ config, cp, cs }: { config: ConfigVitrineProBeaute; cp: string; cs: string }) {
  const petales = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left:  `${5 + (i * 8) % 90}%`,
    delay: `${(i * 0.7) % config.petalesVitesse}s`,
    size:  8 + (i * 3) % 16,
    drift: -30 + (i * 7) % 60,
    duration: config.petalesVitesse + (i % 4) * 1.5,
    color: i % 3 === 0 ? config.petalesCouleur : i % 3 === 1 ? cp : cs,
    shape: i % 3, // 0=rond, 1=ellipse, 2=coeur
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 3 }}>
      <style>{`
        @keyframes petale-fall {
          0%   { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes papillon-vol {
          0%,100% { transform: scaleX(1) rotate(-5deg); }
          50%     { transform: scaleX(0.3) rotate(5deg); }
        }
        @keyframes papillon-drift {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(30px, -20px); }
          50%  { transform: translate(-20px, 10px); }
          75%  { transform: translate(15px, -30px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      {petales.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 0, left: p.left,
          width: p.size, height: p.shape === 1 ? p.size * 1.6 : p.size,
          borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? '50% 50% 50% 0' : '50%',
          background: p.color,
          opacity: 0.6,
          animation: `petale-fall ${p.duration}s ${p.delay} ease-in infinite`,
          ['--drift' as any]: `${p.drift}px`,
          ['--rot' as any]: `${180 + p.drift * 2}deg`,
        }} />
      ))}
    </div>
  );
}

// ─── PAPILLON ─────────────────────────────────────────────────────────────────

function Papillons({ config, cp, cs }: { config: ConfigVitrineProBeaute; cp: string; cs: string }) {
  const positions = [
    { top: '15%', left: '8%',  couleur: cs },
    { top: '40%', left: '85%', couleur: cp },
    { top: '60%', left: '12%', couleur: '#fbbf24' },
    { top: '25%', left: '70%', couleur: cs },
    { top: '70%', left: '80%', couleur: cp },
    { top: '50%', left: '45%', couleur: cs },
  ].slice(0, config.papillonsNb);

  return (
    <>
      {positions.map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', top: pos.top, left: pos.left,
          zIndex: 4, pointerEvents: 'none',
          animation: `papillon-drift ${8 + i * 2}s ease-in-out ${i * 1.5}s infinite`,
        }}>
          {config.papillonsPhoto ? (
            <img src={config.papillonsPhoto} alt="" style={{ width: 40 + i * 8, height: 'auto', animation: `papillon-vol ${config.papillonsVitesse}s ease-in-out ${i * 0.3}s infinite` }} />
          ) : (
            // Papillon SVG dessiné
            <svg width={40 + i * 8} height={32 + i * 6} viewBox="0 0 60 48" style={{ animation: `papillon-vol ${config.papillonsVitesse}s ease-in-out ${i * 0.3}s infinite`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
              {/* Aile gauche */}
              <ellipse cx="18" cy="18" rx="16" ry="12" fill={pos.couleur} opacity="0.75" transform="rotate(-20 18 18)" />
              <ellipse cx="15" cy="34" rx="12" ry="8" fill={pos.couleur} opacity="0.6" transform="rotate(15 15 34)" />
              {/* Aile droite */}
              <ellipse cx="42" cy="18" rx="16" ry="12" fill={pos.couleur} opacity="0.75" transform="rotate(20 42 18)" />
              <ellipse cx="45" cy="34" rx="12" ry="8" fill={pos.couleur} opacity="0.6" transform="rotate(-15 45 34)" />
              {/* Corps */}
              <ellipse cx="30" cy="24" rx="2.5" ry="10" fill={config.couleurTexte} opacity="0.7" />
              {/* Antennes */}
              <line x1="28" y1="15" x2="22" y2="6" stroke={config.couleurTexte} strokeWidth="1.2" opacity="0.6" />
              <line x1="32" y1="15" x2="38" y2="6" stroke={config.couleurTexte} strokeWidth="1.2" opacity="0.6" />
              <circle cx="22" cy="6" r="1.5" fill={config.couleurTexte} opacity="0.6" />
              <circle cx="38" cy="6" r="1.5" fill={config.couleurTexte} opacity="0.6" />
            </svg>
          )}
        </div>
      ))}
    </>
  );
}

// ─── FLEUR ROTATIVE ───────────────────────────────────────────────────────────

function FleurRotative({ config }: { config: ConfigVitrineProBeaute }) {
  if (!config.fleurActif) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <style>{`@keyframes fleur-rotation { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: config.fleurTaille, height: config.fleurTaille,
        borderRadius: '50%',
        overflow: 'hidden',
        animation: `fleur-rotation ${config.fleurVitesse}s linear infinite`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        <img src={config.fleurPhoto} alt="fleur décorative"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
            // Fallback SVG rose
          }}
        />
      </div>
      {/* SVG rose de secours si pas de photo */}
      {!config.fleurPhoto && (
        <svg width={config.fleurTaille} height={config.fleurTaille} viewBox="0 0 200 200"
          style={{ animation: `fleur-rotation ${config.fleurVitesse}s linear infinite`, position: 'absolute' }}>
          {[0,45,90,135,180,225,270,315].map((angle, i) => (
            <ellipse key={i} cx="100" cy="55" rx="18" ry="32" fill={i % 2 === 0 ? '#f4a5a0' : '#d8b4fe'} opacity="0.8"
              transform={`rotate(${angle} 100 100)`} />
          ))}
          <circle cx="100" cy="100" r="22" fill="#fde8c8" />
          <circle cx="100" cy="100" r="14" fill="#f4a5a0" opacity="0.6" />
        </svg>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigVitrineProBeaute>;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateVitrineProBeaute({ config: configProp }: Props) {
  const config = { ...CONFIG_VITRINE_PRO_BEAUTE_DEFAUT, ...configProp };
  const cp   = config.couleurPrimaire;
  const cs   = config.couleurSecondaire;
  const ct   = config.couleurTexte;
  const police = getPolice(config.police);
  const policeCorps = "'Inter', system-ui, sans-serif";

  const [menuOuvert, setMenuOuvert]     = useState(false);
  const [temoinActif, setTemoinActif]   = useState(0);
  const [isMobile, setIsMobile]         = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTemoinActif(p => (p + 1) % config.temoignages.length), 5000);
    return () => clearInterval(t);
  }, [config.temoignages.length]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOuvert(false);
  };

  return (
    <div style={{ fontFamily: policeCorps, background: config.couleurFond, color: ct, overflowX: 'hidden', minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }
        .temoignage-card { transition: all 0.3s ease; }
        .temoignage-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.12) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${cp}; border-radius: 2px; }
        @keyframes float-gentle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .hero-produit { animation: float-gentle 4s ease-in-out infinite; }
        @keyframes fade-in-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fade-in-up 0.8s ease both; }
        .fade-in-2 { animation: fade-in-up 0.8s ease 0.2s both; }
        .fade-in-3 { animation: fade-in-up 0.8s ease 0.4s both; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(255,248,248,0.92)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${cp}22` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {config.logoUrl
              ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
              : <>
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill={cp + '33'} stroke={cp} strokeWidth="1.5" />
                    <text x="16" y="21" textAnchor="middle" fill={ct} fontSize="14" fontWeight="bold">✿</text>
                  </svg>
                  <span style={{ fontFamily: police, fontWeight: 700, fontSize: 22, color: ct, letterSpacing: '0.02em' }}>{config.nomBoutique}</span>
                </>
            }
          </div>

          {/* Burger */}
          <button onClick={() => setMenuOuvert(!menuOuvert)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: ct, display: 'flex', flexDirection: 'column', gap: 5, padding: 4 }}>
            <span style={{ display: 'block', width: 22, height: 1.5, background: ct, transition: 'all 0.3s', transform: menuOuvert ? 'rotate(45deg) translateY(5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: ct, opacity: menuOuvert ? 0 : 1, transition: 'all 0.3s' }} />
            <span style={{ display: 'block', width: 22, height: 1.5, background: ct, transition: 'all 0.3s', transform: menuOuvert ? 'rotate(-45deg) translateY(-5px)' : 'none' }} />
          </button>
        </div>

        {/* Menu slide-in */}
        {menuOuvert && (
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 260, background: cs + 'f5', backdropFilter: 'blur(12px)', padding: '80px 32px 32px', display: 'flex', flexDirection: 'column', gap: 24, zIndex: 200 }}>
            <button onClick={() => setMenuOuvert(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: ct }}>✕</button>
            {['À propos', 'Collection', 'Témoignages', 'Contact'].map(item => (
              <span key={item} onClick={() => scrollTo(item.toLowerCase().replace('é', 'e').replace('à', 'a'))} style={{ fontFamily: police, fontSize: 22, fontWeight: 600, color: ct, cursor: 'pointer' }}>{item}</span>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', background: config.heroBgGradient, paddingTop: 64, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>

        {/* Pétales tombants */}
        {config.petalesActifs && <Petales config={config} cp={cp} cs={cs} />}

        {/* Papillons */}
        {config.papillonsActifs && <Papillons config={config} cp={cp} cs={cs} />}

        {/* Contenu hero */}
        <div style={{ position: 'relative', zIndex: 5, maxWidth: 1280, margin: '0 auto', padding: isMobile ? '60px 24px' : '0 64px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>

          {/* Texte */}
          <div style={{ flex: '1 1 340px', maxWidth: 520 }}>
            <h1 className="fade-in" style={{ fontFamily: police, fontSize: `clamp(42px, 7vw, 88px)`, fontWeight: 700, color: ct, lineHeight: 1.1, marginBottom: 28 }}>
              {config.heroTitreLigne1}<br />{config.heroTitreLigne2}
            </h1>
            <button className="fade-in-2" onClick={() => scrollTo('collection')}
              style={{ background: 'transparent', color: ct, border: `1.5px solid ${ct}`, borderRadius: 40, padding: '14px 36px', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: policeCorps, display: 'flex', alignItems: 'center', gap: 10 }}>
              {config.heroBouton}
            </button>
          </div>

          {/* Produit flottant */}
          <div className="hero-produit fade-in-3" style={{ flex: '1 1 340px', maxWidth: 520, background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(4px)', borderRadius: 24, border: `1px solid ${cp}44`, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
            {config.heroProduitPhoto && (
              <img src={config.heroProduitPhoto} alt={config.nomBoutique}
                style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>

        {/* Vague bas */}
        <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40 C360 80 720 0 1080 40 C1260 60 1380 20 1440 40 L1440 80 L0 80 Z" fill={config.couleurFond} />
          </svg>
        </div>
      </section>

      {/* ── SECTION PRÉSENTATION ────────────────────────────────────────────── */}
      <section id="a-propos" style={{ background: config.couleurFond, padding: isMobile ? '48px 24px' : '80px 64px', textAlign: 'center', position: 'relative' }}>
        {config.papillonsActifs && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            {/* Papillon décoratif centré */}
            <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', opacity: 0.7 }}>
              <svg width="60" height="48" viewBox="0 0 60 48" style={{ animation: `papillon-vol ${config.papillonsVitesse * 1.2}s ease-in-out infinite` }}>
                <ellipse cx="18" cy="18" rx="16" ry="12" fill={cs} opacity="0.6" transform="rotate(-20 18 18)" />
                <ellipse cx="15" cy="34" rx="12" ry="8" fill={cs} opacity="0.5" transform="rotate(15 15 34)" />
                <ellipse cx="42" cy="18" rx="16" ry="12" fill={cs} opacity="0.6" transform="rotate(20 42 18)" />
                <ellipse cx="45" cy="34" rx="12" ry="8" fill={cs} opacity="0.5" transform="rotate(-15 45 34)" />
                <ellipse cx="30" cy="24" rx="2.5" ry="10" fill={ct} opacity="0.5" />
              </svg>
            </div>
          </div>
        )}
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontFamily: police, fontSize: `clamp(28px, 5vw, 52px)`, fontWeight: 700, color: ct, lineHeight: 1.2, marginBottom: 24 }}>
            {config.sousTitreSection}
          </h2>
          <p style={{ fontSize: 16, color: ct + 'bb', lineHeight: 1.8 }}>{config.textePresentation}</p>
        </div>

        {/* Vague transition */}
        <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 30 C480 60 960 0 1440 30 L1440 60 L0 60 Z" fill={config.fondCaracteristiques.includes('gradient') ? '#fce4dc' : config.fondCaracteristiques} opacity="0.4" /></svg>
        </div>
      </section>

      {/* ── SECTION CARACTÉRISTIQUES ─────────────────────────────────────────── */}
      <section style={{ background: config.fondCaracteristiques, padding: isMobile ? '64px 24px' : '96px 64px', position: 'relative', overflow: 'hidden' }}>
        {/* Pétales de fond */}
        {config.petalesActifs && <Petales config={{ ...config, petalesVitesse: config.petalesVitesse * 1.5 }} cp={cp} cs={cs} />}

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Layout : badges gauche + produit centre + badges droite */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: isMobile ? 24 : 40, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>

            {/* Badges gauche */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '0 0 auto', width: isMobile ? '100%' : 220 }}>
              {config.caracteristiques.slice(0, 3).map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', borderRadius: 30, padding: '12px 24px', fontWeight: 600, fontSize: 15, color: ct, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${cp}33` }}>
                  {c.label}
                </div>
              ))}
            </div>

            {/* Produit centre */}
            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? '80%' : 320, margin: isMobile ? '0 auto' : 0 }}>
              {config.produitCentrePhoto && (
                <img src={config.produitCentrePhoto} alt={config.nomBoutique}
                  style={{ width: '100%', maxHeight: 420, objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>

            {/* Badges droite */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: '0 0 auto', width: isMobile ? '100%' : 220 }}>
              {config.caracteristiques.slice(3, 6).map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', borderRadius: 30, padding: '12px 24px', fontWeight: 600, fontSize: 15, color: ct, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${cp}33` }}>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION COLLECTION ──────────────────────────────────────────────── */}
      <section id="collection" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ background: config.collectionFond, padding: isMobile ? '64px 24px' : '80px 64px', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-end', minHeight: 480, position: 'relative' }}>
          {/* Photo plein fond */}
          {config.collectionPhoto && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <img src={config.collectionPhoto} alt="collection"
                style={{ width: '55%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          {/* Papillons */}
          {config.papillonsActifs && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '40%', left: '35%' }}>
                <svg width="48" height="38" viewBox="0 0 60 48" style={{ animation: `papillon-vol ${config.papillonsVitesse * 0.8}s ease-in-out 0.5s infinite` }}>
                  <ellipse cx="18" cy="18" rx="16" ry="12" fill="#4ade80" opacity="0.7" transform="rotate(-20 18 18)" />
                  <ellipse cx="15" cy="34" rx="12" ry="8" fill="#22c55e" opacity="0.6" transform="rotate(15 15 34)" />
                  <ellipse cx="42" cy="18" rx="16" ry="12" fill="#4ade80" opacity="0.7" transform="rotate(20 42 18)" />
                  <ellipse cx="45" cy="34" rx="12" ry="8" fill="#22c55e" opacity="0.6" transform="rotate(-15 45 34)" />
                  <ellipse cx="30" cy="24" rx="2.5" ry="10" fill="#1a1a1a" opacity="0.5" />
                </svg>
              </div>
            </div>
          )}

          {/* Carte texte */}
          <div style={{ position: 'relative', zIndex: 5, background: 'rgba(252,228,220,0.92)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: isMobile ? '28px 20px' : '40px 36px', maxWidth: 400, border: `1.5px solid ${cp}55`, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontFamily: police, fontSize: `clamp(24px, 3.5vw, 40px)`, fontWeight: 700, color: ct, lineHeight: 1.3, marginBottom: 16 }}>
              {config.collectionTitre}
            </h2>
            <p style={{ fontSize: 14, color: ct + 'aa', lineHeight: 1.7, marginBottom: 24 }}>{config.collectionTexte}</p>
            <button onClick={() => scrollTo('contact')}
              style={{ background: 'transparent', color: ct, border: `1.5px solid ${ct}`, borderRadius: 30, padding: '12px 28px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: policeCorps }}>
              {config.collectionBouton}
            </button>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────────────────── */}
      <section id="temoignages" style={{ position: 'relative', minHeight: 480, overflow: 'hidden' }}>
        {/* Photo de fond */}
        {config.temoignagesFond && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={config.temoignagesFond} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ position: 'absolute', inset: 0, background: `${config.couleurSecondaire}55` }} />
          </div>
        )}

        {/* Vague haut */}
        <div style={{ position: 'absolute', top: -2, left: 0, right: 0, zIndex: 2 }}>
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 0 C480 60 960 0 1440 0 L1440 60 L0 60 Z" fill={config.collectionFond} opacity="0.6" /></svg>
        </div>

        {/* Carrousel témoignages */}
        <div style={{ position: 'relative', zIndex: 3, padding: isMobile ? '80px 24px 64px' : '96px 64px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 20, overflowX: 'hidden', justifyContent: 'center' }}>
            {config.temoignages.map((t, i) => (
              <div key={i} className="temoignage-card"
                onClick={() => setTemoinActif(i)}
                style={{ flex: '0 0 auto', width: isMobile ? '85%' : 380, background: 'rgba(255,248,248,0.92)', backdropFilter: 'blur(8px)', borderRadius: 18, padding: '32px 28px', border: `1px solid ${cp}33`, boxShadow: i === temoinActif ? `0 12px 40px ${cp}44` : '0 4px 16px rgba(0,0,0,0.06)', transform: i === temoinActif ? 'scale(1.03)' : 'scale(0.97)', opacity: i === temoinActif ? 1 : 0.65, transition: 'all 0.4s ease', cursor: 'pointer' }}>
                <p style={{ fontSize: 15, color: ct, lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>{t.texte}</p>
                <p style={{ fontFamily: police, fontSize: 18, color: cp, fontWeight: 600 }}>{t.auteur}</p>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            {config.temoignages.map((_, i) => (
              <div key={i} onClick={() => setTemoinActif(i)}
                style={{ width: i === temoinActif ? 24 : 8, height: 8, borderRadius: 4, background: i === temoinActif ? ct : ct + '40', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>

          {/* Flèches */}
          {!isMobile && (
            <>
              <button onClick={() => setTemoinActif(p => (p - 1 + config.temoignages.length) % config.temoignages.length)}
                style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: `1px solid ${cp}`, background: 'rgba(255,248,248,0.9)', cursor: 'pointer', fontSize: 18, color: ct }}>‹</button>
              <button onClick={() => setTemoinActif(p => (p + 1) % config.temoignages.length)}
                style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: `1px solid ${cp}`, background: 'rgba(255,248,248,0.9)', cursor: 'pointer', fontSize: 18, color: ct }}>›</button>
            </>
          )}
        </div>
      </section>

      {/* ── FLEUR ROTATIVE ──────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(180deg, ${cp}15 0%, ${cs}25 50%, ${cp}15 100%)`, position: 'relative', overflow: 'hidden' }}>
        {/* Pétales */}
        {config.petalesActifs && <Petales config={config} cp={cp} cs={cs} />}
        <FleurRotative config={config} />

        {/* Vague bas */}
        <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 50" fill="none"><path d="M0 50 C480 0 960 50 1440 50 L1440 50 L0 50 Z" fill={config.couleurFond} /></svg>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer id="contact" style={{ background: config.couleurFond, padding: isMobile ? '48px 24px 32px' : '56px 64px 32px', borderTop: `1px solid ${cp}22` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>

            {/* Logo + nom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {config.logoUrl
                ? <img src={config.logoUrl} alt="logo" style={{ height: 44, objectFit: 'contain', alignSelf: 'flex-start' }} />
                : <span style={{ fontFamily: police, fontSize: 28, fontWeight: 700, color: ct }}>{config.nomBoutique}</span>
              }
              <p style={{ fontSize: 13, color: ct + '88', lineHeight: 1.6, maxWidth: 220 }}>{config.textePresentation.slice(0, 100)}...</p>
            </div>

            {/* Réseaux */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: isMobile ? 'flex-start' : 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suivez-nous</p>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { url: `https://instagram.com/${config.instagram}`, label: 'IG' },
                  { url: `https://facebook.com/${config.facebook}`,   label: 'FB' },
                  { url: `https://tiktok.com/@${config.tiktok}`,      label: 'TK' },
                ].filter(s => s.url.split('/').pop()).map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{ width: 40, height: 40, borderRadius: '50%', background: cp + '20', border: `1px solid ${cp}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ct, fontSize: 12, fontWeight: 800, textDecoration: 'none', transition: 'all 0.2s' }}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: isMobile ? 'flex-start' : 'flex-end' }}>
              {config.email    && <a href={`mailto:${config.email}`}       style={{ fontSize: 13, color: ct + 'aa', textDecoration: 'none' }}>{config.email}</a>}
              {config.telephone && <span style={{ fontSize: 13, color: ct + 'aa' }}>{config.telephone}</span>}
              {config.adresse  && <span style={{ fontSize: 13, color: ct + 'aa', textAlign: isMobile ? 'left' : 'right', maxWidth: 200 }}>{config.adresse}</span>}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${cp}22`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 12, color: ct + '66' }}>{config.copyright}</p>
            <p style={{ fontSize: 11, color: ct + '44' }}>Propulsé par <span style={{ color: cp }}>e-Vend Studio</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}