// src/templates/TemplateVitrineProTech.tsx
// e-Vend Studio — Template PREMIUM 25$ — Vitrine Pro Tech / SaaS / Agence
// Inspiré design Wix Velocity — 100% original

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Solution {
  id:          string;
  nom:         string;
  description: string;
  icone:       string;  // emoji ou URL
}

export interface Feature {
  texte: string;
}

export interface Partenaire {
  nom:     string;
  logoUrl: string;
}

export interface TemoignageTech {
  citation: string;
  nom:      string;
  role:     string;
  photo:    string;
}

export interface PlanTarif {
  prix:         string;   // ex: '79$/mois'
  nom:          string;
  fonctionnalites: string[];
  cta:          string;
  vedette:      boolean;
}

export interface MediaHero {
  type:    'photo' | 'video';
  url:     string;
  poster?: string;  // miniature pour vidéo
}

export interface ConfigVitrineProTech {
  // Identité
  nomEntreprise:        string;
  logoUrl:              string;
  couleurPrincipale:    string;   // ex: '#c026d3' magenta
  couleurSecondaire:    string;   // ex: '#0f0e0e' très sombre
  couleurTexte:         string;   // ex: '#ffffff'
  police:               'moderne' | 'bold' | 'elegant';

  // Hero
  heroMedia:            MediaHero;
  heroTitre1:           string;   // grande ligne 1
  heroTitre2:           string;   // grande ligne 2 (couleur principale)
  heroCouverture:       string;   // fond si vidéo non dispo
  heroDescription:      string;
  heroBouton1:          string;
  heroBouton2:          string;

  // Ticker
  tickerTexte:          string;   // texte qui défile
  tickerIcone:          string;   // icone séparateur (ex: ✦ ou logo)
  tickerVitesse:        number;   // secondes pour traverser (20-80)
  tickerTaille:         number;   // px font-size (32-96)
  tickerActif:          boolean;

  // Phrase impact (bicolore)
  phraseImpact1:        string;   // partie blanche
  phraseImpact2:        string;   // partie couleur principale
  phraseImpact3:        string;   // suite blanche

  // Presse / Featured in
  presseLogos:          string[];  // noms de médias (texte)
  presseActif:          boolean;

  // Stats
  stats:                { valeur: string; label: string }[];

  // Vision
  visionTitre1:         string;
  visionTitre2:         string;   // accentué
  visionTexte:          string;
  visionPhoto:          string;

  // Ticker 2 (bas de page)
  ticker2Texte:         string;
  ticker2Actif:         boolean;

  // Solutions
  solutionsTitre:       string;
  solutions:            Solution[];

  // Features
  featuresTitre1:       string;
  featuresTitre2:       string;
  featuresTexte:        string;
  featuresPhoto:        string;
  features:             Feature[];

  // Partenaires
  partenairesTitre1:    string;
  partenairesTitre2:    string;
  partenairesTexte:     string;
  partenaires:          Partenaire[];

  // Témoignages
  temoignages:          TemoignageTech[];

  // Tarifs
  tarifsTitre1:         string;
  tarifsTitre2:         string;
  plans:                PlanTarif[];

  // CTA final
  ctaFinalTitre:        string;
  ctaFinalSousTitre:    string;

  // Contact / Footer
  email:                string;
  telephone?:           string;
  instagram?:           string;
  linkedin?:            string;
  newsletterTitre:      string;
  liensFooter:          { label: string }[];
}

// ─── CONFIG DÉFAUT ────────────────────────────────────────────────────────────

export const CONFIG_VITRINE_PRO_TECH_DEFAUT: ConfigVitrineProTech = {
  nomEntreprise:     'Nexus IA',
  logoUrl:           '',
  couleurPrincipale: '#c026d3',
  couleurSecondaire: '#0a0a0f',
  couleurTexte:      '#ffffff',
  police:            'moderne',

  heroMedia: {
    type: 'photo',
    url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  heroTitre1:        'Amplifier',
  heroTitre2:        'Nexus IA',
  heroCouverture:    'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600',
  heroDescription:   "Solutions d'automatisation IA pour les entreprises à croissance rapide.",
  heroBouton1:       'Commencer',
  heroBouton2:       'Réserver un appel',

  tickerTexte:       'Innover avec Précision',
  tickerIcone:       '✦',
  tickerVitesse:     30,
  tickerTaille:      64,
  tickerActif:       true,

  phraseImpact1:     'Nexus IA exploite l\'IA pour ',
  phraseImpact2:     'améliorer la performance et l\'efficacité',
  phraseImpact3:     ' de vos opérations — réduisant les coûts et maximisant vos résultats.',

  presseLogos:       ['FUTURE FORTUNE', 'Business+', 'AINOW'],
  presseActif:       true,

  stats: [
    { valeur: '+10M$',  label: 'Économies annuelles livrées aux clients' },
    { valeur: '50%',    label: 'Augmentation de l\'efficacité opérationnelle' },
    { valeur: '40+',    label: 'Solutions IA sur mesure déployées' },
    { valeur: '95%',    label: 'Taux de rétention des partenaires' },
  ],

  visionTitre1:   'VISION',
  visionTitre2:   'Efficacité\nde bout en bout',
  visionTexte:    'Nexus IA se spécialise en technologies augmentées par l\'IA pour optimiser vos processus d\'affaires. Nos solutions innovantes automatisent les tâches répétitives, libérant votre équipe pour se concentrer sur l\'essentiel.',
  visionPhoto:    'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',

  ticker2Texte:   'Bâtir des partenariats solides',
  ticker2Actif:   true,

  solutionsTitre: 'Nos solutions',
  solutions: [
    { id: 's1', nom: 'Optimus', description: 'Optimisez vos processus avec l\'IA. Optimus analyse et affine vos opérations pour une efficacité maximale.', icone: '⬡' },
    { id: 's2', nom: 'Flux',    description: 'Automatisez toutes vos opérations internes avec Flux — libérez votre équipe des tâches répétitives.', icone: '✦' },
    { id: 's3', nom: 'Synergy', description: 'Surveillance en temps réel et intégration transparente. Des insights actionnables pour de meilleures décisions.', icone: '◉' },
  ],

  featuresTitre1:  'FONCTIONNALITÉS',
  featuresTitre2:  'Propulsez vos\nopérations',
  featuresTexte:   'Nos fonctionnalités avancées sont conçues pour améliorer l\'efficacité, la sécurité et l\'expérience utilisateur.',
  featuresPhoto:   'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  features: [
    { texte: 'Augmentez les performances et réduisez les coûts grâce à l\'automatisation avancée.' },
    { texte: 'Fonctionnalités personnalisables conçues pour répondre aux besoins uniques de votre industrie.' },
    { texte: 'Supervision continue et alertes instantanées pour une performance opérationnelle optimale.' },
  ],

  partenairesTitre1: 'PARTENAIRES',
  partenairesTitre2: 'Trusted by\nInnovators',
  partenairesTexte:   'Nous sommes fiers de bâtir des relations collaboratives solides avec des leaders industriels dans divers secteurs.',
  partenaires: [
    { nom: 'BuildingBlocks', logoUrl: '' },
    { nom: '3Portals',       logoUrl: '' },
    { nom: 'Leapyear',       logoUrl: '' },
    { nom: 'Luminous',       logoUrl: '' },
    { nom: 'Interlock',      logoUrl: '' },
    { nom: 'Luminary',       logoUrl: '' },
  ],

  temoignages: [
    { citation: "L'expertise et le soutien de Nexus ont été exceptionnels, nous aidant à atteindre nos objectifs avec une fiabilité accrue.", nom: 'Lisa Arden', role: 'PDG, Luminous', photo: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { citation: "Nexus IA a transformé notre façon de travailler. Nos coûts ont diminué de 40% en seulement 3 mois d'utilisation.", nom: 'Marc Beaulieu', role: 'CTO, Interlock', photo: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { citation: "Des solutions sur mesure qui s'adaptent parfaitement à notre industrie. Support client impeccable.", nom: 'Priya Sharma', role: 'VP Opérations, 3Portals', photo: 'https://images.pexels.com/photos/3775087/pexels-photo-3775087.jpeg?auto=compress&cs=tinysrgb&w=400' },
  ],

  tarifsTitre1: 'Choisissez le plan',
  tarifsTitre2: 'idéal pour votre entreprise',
  plans: [
    { prix: '79$/mois', nom: 'Professionnel', fonctionnalites: ['Toutes les fonctions de base', 'Personnalisation IA avancée', 'Support prioritaire', 'Analyses hebdomadaires'], cta: 'Commencer', vedette: false },
    { prix: '149$/mois', nom: 'Entreprise', fonctionnalites: ['Toutes les fonctions Pro', 'Intégration IA avancée', 'Gestionnaire de compte dédié', 'Surveillance des données en temps réel'], cta: 'Commencer', vedette: true },
    { prix: 'Sur mesure', nom: 'Ultime', fonctionnalites: ['Toutes les fonctions Entreprise', 'Solutions IA entièrement sur mesure', 'Support premium 24/7', 'Optimisation complète'], cta: 'Nous contacter', vedette: false },
  ],

  ctaFinalTitre:    'Optimisé par l\'ingénierie IA.',
  ctaFinalSousTitre:'Amplifiez votre Nexus™ aujourd\'hui.',

  email:           'contact@nexusia.ca',
  telephone:       '',
  instagram:       'nexusia',
  linkedin:        'nexusia',
  newsletterTitre: 'Nos insights directement dans votre boîte',
  liensFooter:     [
    { label: 'À propos' }, { label: 'Solutions' }, { label: 'Fonctionnalités' }, { label: 'FAQ' }, { label: 'Abonnements' },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPolice(p: string) {
  if (p === 'bold')    return "'Oswald', 'Impact', sans-serif";
  if (p === 'elegant') return "'Playfair Display', Georgia, serif";
  return "'Inter', system-ui, sans-serif";
}

// ─── TICKER DÉFILANT ──────────────────────────────────────────────────────────

function Ticker({ texte, icone, vitesse, taille, couleurPrincipale, background, texteCouleur }:
  { texte: string; icone: string; vitesse: number; taille: number; couleurPrincipale: string; background: string; texteCouleur: string }) {
  // Dupliquer le texte pour un défilement infini sans saccade
  const item = `${texte} ${icone} `;
  const duped = item.repeat(8);
  return (
    <div style={{ background, overflow: 'hidden', padding: `${taille * 0.4}px 0`, borderTop: `1px solid rgba(255,255,255,0.08)`, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
      <style>{`
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-track { display: flex; width: max-content; animation: ticker-scroll ${vitesse}s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="ticker-track">
        {[duped, duped].map((d, i) => (
          <span key={i} style={{ fontSize: taille, fontWeight: 800, color: texteCouleur, whiteSpace: 'nowrap', paddingRight: 0 }}>
            {d.split(icone).map((part, j) => (
              <span key={j}>
                {part}
                {j < d.split(icone).length - 1 && <span style={{ color: couleurPrincipale }}>{icone}</span>}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigVitrineProTech>;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateVitrineProTech({ config: configProp }: Props) {
  const config = { ...CONFIG_VITRINE_PRO_TECH_DEFAUT, ...configProp };
  const cp  = config.couleurPrincipale;
  const cs  = config.couleurSecondaire;
  const ct  = config.couleurTexte;
  const police = getPolice(config.police);

  const [menuOuvert, setMenuOuvert]     = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const [temoinActif, setTemoinActif]   = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [emailEnvoye, setEmailEnvoye]   = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTemoinActif(p => (p + 1) % config.temoignages.length), 6000);
    return () => clearInterval(t);
  }, [config.temoignages.length]);

  // Autoplay vidéo silencieuse
  useEffect(() => {
    if (videoRef.current) { videoRef.current.muted = true; videoRef.current.play().catch(() => {}); }
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOuvert(false); };

  const navItems = ['À propos', 'Vision', 'Solutions', 'Fonctionnalités', 'Plans'];

  return (
    <div style={{ fontFamily: police, background: cs, color: ct, overflowX: 'hidden', minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;600;700&display=swap" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }
        ::selection { background: ${cp}55; }
        .nav-link { transition: color .2s; cursor: pointer; }
        .nav-link:hover { color: ${cp} !important; }
        .solution-card { transition: all 0.3s ease; }
        .solution-card:hover { background: rgba(255,255,255,0.06) !important; border-color: ${cp}60 !important; transform: translateY(-3px); }
        .plan-card { transition: all 0.25s ease; }
        .plan-card:hover { transform: translateY(-4px); }
        .partenaire-card { transition: all 0.25s ease; }
        .partenaire-card:hover { background: rgba(255,255,255,0.1) !important; }
        @keyframes fadeUpIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-hero { animation: fadeUpIn 1s ease both; }
        .fade-hero-2 { animation: fadeUpIn 1s ease 0.2s both; }
        .fade-hero-3 { animation: fadeUpIn 1s ease 0.4s both; }
        video { object-fit: cover; }
        input::placeholder { color: rgba(255,255,255,0.35); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${cp}; border-radius: 2px; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, background: cs + 'f2', backdropFilter: 'blur(12px)', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {config.logoUrl
              ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
              : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${cp}, ${cp}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14 }}>✦</span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 20, color: ct, letterSpacing: '-0.02em' }}>{config.nomEntreprise}</span>
                </div>
            }
          </div>

          {/* Nav links desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 36, flex: 1, justifyContent: 'center' }}>
              {navItems.map(item => (
                <span key={item} className="nav-link" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.65)' }}
                  onClick={() => scrollTo(item.toLowerCase().toLowerCase().replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u').replace(/[ç]/g, 'c').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}>
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!isMobile && (
              <button onClick={() => scrollTo('contact')}
                style={{ background: 'transparent', color: ct, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: police }}>
                {config.heroBouton2}
              </button>
            )}
            <button onClick={() => scrollTo('plans')}
              style={{ background: cp, color: '#fff', border: 'none', borderRadius: 40, padding: '9px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton1}
            </button>
            {isMobile && <button onClick={() => setMenuOuvert(!menuOuvert)} style={{ background: 'none', border: 'none', color: ct, fontSize: 22, cursor: 'pointer' }}>{menuOuvert ? '✕' : '☰'}</button>}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobile && menuOuvert && (
          <div style={{ background: cs, borderTop: `1px solid rgba(255,255,255,0.06)`, padding: '16px 28px' }}>
            {navItems.map(item => (
              <div key={item} onClick={() => scrollTo(item.toLowerCase().toLowerCase().replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u').replace(/[ç]/g, 'c').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                style={{ padding: '12px 0', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 15, cursor: 'pointer', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                {item}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 64, overflow: 'hidden' }}>
        {/* Media background (vidéo ou photo) */}
        {config.heroMedia.type === 'video' ? (
          <>
            <video ref={videoRef} loop muted playsInline autoPlay
              poster={config.heroMedia.poster || config.heroCouverture}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}>
              <source src={config.heroMedia.url} type="video/mp4" />
            </video>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${cs}99 0%, ${cs}cc 60%, ${cs}ff 100%)` }} />
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.heroMedia.url || config.heroCouverture})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 }} />
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 40%, ${cp}22 0%, ${cs}dd 50%, ${cs} 100%)` }} />
          </>
        )}

        {/* Contenu hero */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: isMobile ? '60px 24px' : '0 48px', maxWidth: 1100 }}>
          <h1 className="fade-hero" style={{ fontSize: `clamp(56px, 12vw, 160px)`, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em', marginBottom: 20 }}>
            <span style={{ display: 'block', color: ct }}>{config.heroTitre1}</span>
            <span style={{ display: 'block', color: ct, opacity: 0.9 }}>{config.heroTitre2}</span>
          </h1>
          <p className="fade-hero-2" style={{ fontSize: `clamp(14px, 2vw, 18px)`, color: 'rgba(255,255,255,0.65)', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            {config.heroDescription}
          </p>
          <div className="fade-hero-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('solutions')}
              style={{ background: cp, color: '#fff', border: 'none', borderRadius: 40, padding: '14px 36px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton1}
            </button>
            <button onClick={() => scrollTo('contact')}
              style={{ background: 'transparent', color: ct, border: `1.5px solid rgba(255,255,255,0.4)`, borderRadius: 40, padding: '12px 32px', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton2}
            </button>
          </div>
        </div>
      </section>

      {/* ── TICKER 1 ────────────────────────────────────────────────────────── */}
      {config.tickerActif && (
        <Ticker texte={config.tickerTexte} icone={config.tickerIcone} vitesse={config.tickerVitesse}
          taille={config.tickerTaille} couleurPrincipale={cp} background={cs} texteCouleur={ct} />
      )}

      {/* ── PHRASE IMPACT + PRESSE ───────────────────────────────────────────── */}
      <section style={{ background: cs, padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: `clamp(22px, 3.5vw, 42px)`, fontWeight: 700, lineHeight: 1.5, color: ct, marginBottom: 56, textAlign: 'center' }}>
            <span style={{ color: cp }}>{config.phraseImpact1}</span>
            <span style={{ color: ct }}>{config.phraseImpact2}</span>
            <span style={{ color: cp }}>{config.phraseImpact3}</span>
          </p>

          {config.presseActif && config.presseLogos.length > 0 && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 40 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 24 : 48, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>VU DANS</span>
                {config.presseLogos.map((logo, i) => (
                  <span key={i} style={{ fontSize: `clamp(16px, 2.5vw, 24px)`, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.02em' }}>{logo}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section style={{ background: cs, borderTop: `1px solid rgba(255,255,255,0.06)`, padding: isMobile ? '48px 24px' : '72px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '140px' : '220px'}, 1fr))`, gap: 32 }}>
          {config.stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: `clamp(40px, 6vw, 72px)`, fontWeight: 900, color: ct, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 8 }}>{s.valeur}</p>
              <p style={{ fontSize: 13, color: cp, lineHeight: 1.5, maxWidth: 180, margin: '0 auto' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VISION ──────────────────────────────────────────────────────────── */}
      <section id="a-propos" style={{ background: cs, padding: isMobile ? '64px 24px' : '96px 64px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: '1 1 380px' }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', marginBottom: 16, textTransform: 'uppercase' }}>{config.visionTitre1}</p>
            <h2 style={{ fontSize: `clamp(32px, 5vw, 60px)`, fontWeight: 800, color: cp, lineHeight: 1.1, marginBottom: 24, whiteSpace: 'pre-line' }}>{config.visionTitre2}</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 32 }}>{config.visionTexte}</p>
            <button onClick={() => scrollTo('contact')}
              style={{ background: 'transparent', color: ct, border: `1.5px solid rgba(255,255,255,0.35)`, borderRadius: 40, padding: '12px 28px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton2}
            </button>
          </div>
          <div style={{ flex: '1 1 400px', maxWidth: 600, borderRadius: 24, overflow: 'hidden', aspectRatio: '4/3' }}>
            <img src={config.visionPhoto} alt="vision"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.background = '#1a1a2e'; }}
            />
          </div>
        </div>
      </section>

      {/* ── TICKER 2 ────────────────────────────────────────────────────────── */}
      {config.ticker2Actif && (
        <Ticker texte={config.ticker2Texte} icone={config.tickerIcone} vitesse={config.tickerVitesse * 1.3}
          taille={config.tickerTaille * 0.9} couleurPrincipale={cp} background={cs} texteCouleur={ct} />
      )}

      {/* ── SOLUTIONS ───────────────────────────────────────────────────────── */}
      <section id="solutions" style={{ background: cs, padding: isMobile ? '64px 24px' : '96px 64px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12 }}>SOLUTIONS</p>
            <h2 style={{ fontSize: `clamp(28px, 4vw, 48px)`, fontWeight: 800, color: cp }}>{config.solutionsTitre}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '280px'}, 1fr))`, gap: 20 }}>
            {config.solutions.map((s) => (
              <div key={s.id} className="solution-card"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 36, color: cp }}>{s.icone}</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: ct }}>{s.nom}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, flex: 1 }}>{s.description}</p>
                <button onClick={() => scrollTo('contact')}
                  style={{ background: 'transparent', color: ct, border: `1px solid rgba(255,255,255,0.25)`, borderRadius: 30, padding: '9px 22px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: police, alignSelf: 'flex-start' }}>
                  Commencer →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="fonctionnalites" style={{ background: cs, padding: isMobile ? '64px 24px' : '96px 64px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
          {/* Photo */}
          <div style={{ flex: '1 1 400px', borderRadius: 24, overflow: 'hidden', aspectRatio: '4/3' }}>
            <img src={config.featuresPhoto} alt="features"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).style.background = '#1a1a2e'; }}
            />
          </div>
          {/* Texte */}
          <div style={{ flex: '1 1 380px' }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 14 }}>{config.featuresTitre1}</p>
            <h2 style={{ fontSize: `clamp(28px, 4vw, 52px)`, fontWeight: 800, color: cp, lineHeight: 1.15, marginBottom: 20, whiteSpace: 'pre-line' }}>{config.featuresTitre2}</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 28 }}>{config.featuresTexte}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {config.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>✓</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{f.texte}</p>
                </div>
              ))}
            </div>
            <button onClick={() => scrollTo('contact')} style={{ marginTop: 32, background: 'transparent', color: ct, border: `1.5px solid rgba(255,255,255,0.3)`, borderRadius: 40, padding: '12px 28px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton2}
            </button>
          </div>
        </div>
      </section>

      {/* ── PARTENAIRES ─────────────────────────────────────────────────────── */}
      <section style={{ background: '#f8f8f8', padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: isMobile ? 40 : 80, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 auto', maxWidth: 320 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: '#888', textTransform: 'uppercase', marginBottom: 14 }}>{config.partenairesTitre1}</p>
            <h2 style={{ fontSize: `clamp(28px, 4vw, 48px)`, fontWeight: 800, color: cp, lineHeight: 1.1, marginBottom: 20, whiteSpace: 'pre-line' }}>{config.partenairesTitre2}</h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>{config.partenairesTexte}</p>
            <button onClick={() => scrollTo('contact')}
              style={{ background: cp, color: '#fff', border: 'none', borderRadius: 30, padding: '11px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
              Devenir partenaire
            </button>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {config.partenaires.map((p, i) => (
              <div key={i} className="partenaire-card"
                style={{ background: '#eee', borderRadius: 14, padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
                {p.logoUrl
                  ? <img src={p.logoUrl} alt={p.nom} style={{ maxHeight: 40, maxWidth: '100%', objectFit: 'contain' }} />
                  : <span style={{ fontWeight: 800, fontSize: 14, color: '#333', textAlign: 'center' }}>{p.nom}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────────────────── */}
      <section style={{ background: cs, padding: isMobile ? '64px 24px' : '96px 64px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 36 }}>TÉMOIGNAGES</p>
          {config.temoignages.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: isMobile ? 'auto' : 400 }}>
              <div style={{ flex: 1, padding: isMobile ? '36px 24px' : '56px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: `clamp(22px, 3vw, 36px)`, fontWeight: 700, color: cp, lineHeight: 1.4, marginBottom: 32 }}>
                    "{config.temoignages[temoinActif]?.citation}"
                  </p>
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: ct, fontSize: 16, marginBottom: 4 }}>{config.temoignages[temoinActif]?.nom}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{config.temoignages[temoinActif]?.role}</p>
                  {/* Navigation */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                    <button onClick={() => setTemoinActif(p => (p - 1 + config.temoignages.length) % config.temoignages.length)}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: ct, cursor: 'pointer', fontSize: 16 }}>‹</button>
                    <button onClick={() => setTemoinActif(p => (p + 1) % config.temoignages.length)}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: ct, cursor: 'pointer', fontSize: 16 }}>›</button>
                  </div>
                </div>
              </div>
              {!isMobile && config.temoignages[temoinActif]?.photo && (
                <div style={{ flex: '0 0 420px', position: 'relative', overflow: 'hidden' }}>
                  <img src={config.temoignages[temoinActif].photo} alt={config.temoignages[temoinActif].nom}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${cs}88, transparent)` }} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── TARIFS ──────────────────────────────────────────────────────────── */}
      <section id="plans" style={{ background: cs, padding: isMobile ? '64px 24px' : '96px 64px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: `clamp(28px, 4.5vw, 56px)`, fontWeight: 800, color: cp, lineHeight: 1.15, marginBottom: 56 }}>
            {config.tarifsTitre1}<br />{config.tarifsTitre2}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '280px'}, 1fr))`, gap: 20 }}>
            {config.plans.map((plan, i) => (
              <div key={i} className="plan-card"
                style={{ borderRadius: 18, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20,
                  border: `1.5px solid ${plan.vedette ? cp : 'rgba(255,255,255,0.1)'}`,
                  background: plan.vedette ? `rgba(192,38,211,0.08)` : 'rgba(255,255,255,0.03)',
                }}>
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{plan.prix}</p>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: cp }}>{plan.nom}</h3>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.fonctionnalites.map((f, j) => (
                    <p key={j} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>• {f}</p>
                  ))}
                </div>
                <button onClick={() => scrollTo('contact')}
                  style={{ background: 'transparent', color: ct, border: `1.5px solid ${plan.vedette ? cp : 'rgba(255,255,255,0.25)'}`, borderRadius: 30, padding: '11px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section style={{ background: cp, padding: isMobile ? '64px 24px' : '80px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: `clamp(28px, 5vw, 64px)`, fontWeight: 900, color: cs, lineHeight: 1.1, marginBottom: 16 }}>{config.ctaFinalTitre}</h2>
          <h2 style={{ fontSize: `clamp(24px, 4vw, 52px)`, fontWeight: 800, color: `${cs}99`, lineHeight: 1.1, marginBottom: 36 }}>{config.ctaFinalSousTitre}</h2>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('solutions')}
              style={{ background: cs, color: cp, border: 'none', borderRadius: 40, padding: '14px 36px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton1}
            </button>
            <button onClick={() => scrollTo('contact')}
              style={{ background: 'transparent', color: cs, border: `1.5px solid ${cs}77`, borderRadius: 40, padding: '12px 32px', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton2}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer id="contact" style={{ background: cp, borderTop: `1px solid ${cs}22`, padding: isMobile ? '48px 24px' : '64px 64px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 2fr', gap: 48, marginBottom: 48 }}>
            {/* Logo + desc */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                {config.logoUrl
                  ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
                  : <span style={{ fontWeight: 900, fontSize: 28, color: cs, letterSpacing: '-0.04em' }}>{config.nomEntreprise}</span>
                }
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => scrollTo('plans')}
                  style={{ background: cs, color: cp, border: 'none', borderRadius: 30, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
                  {config.heroBouton1}
                </button>
              </div>
            </div>

            {/* Liens */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {config.liensFooter.map((l, i) => (
                  <span key={i} style={{ fontSize: 14, color: `${cs}aa`, cursor: 'pointer', fontWeight: 500 }}>{l.label}</span>
                ))}
                {config.email && <a href={`mailto:${config.email}`} style={{ fontSize: 14, color: `${cs}aa`, textDecoration: 'none' }}>{config.email}</a>}
                {config.telephone && <span style={{ fontSize: 14, color: `${cs}aa` }}>{config.telephone}</span>}
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: cs, lineHeight: 1.3, marginBottom: 20 }}>{config.newsletterTitre}</h3>
              {emailEnvoye ? (
                <div style={{ background: `${cs}22`, borderRadius: 10, padding: '14px 18px' }}>
                  <p style={{ color: cs, fontWeight: 700 }}>✓ Merci pour votre inscription!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input type="email" placeholder="Votre courriel" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)}
                    style={{ flex: 1, padding: '12px 16px', background: `${cs}22`, border: `1px solid ${cs}44`, borderRadius: 8, color: cs, fontSize: 14, outline: 'none', fontFamily: police }} />
                  <button onClick={() => { if (newsletterEmail) setEmailEnvoye(true); }}
                    style={{ background: cs, color: cp, border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
                    S'inscrire
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bas footer */}
          <div style={{ borderTop: `1px solid ${cs}22`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: `${cs}66` }}>© {new Date().getFullYear()} {config.nomEntreprise} · Politique de confidentialité</p>
            <p style={{ fontSize: 11, color: `${cs}44` }}>Propulsé par <span style={{ color: cs }}>e-Vend Studio</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}