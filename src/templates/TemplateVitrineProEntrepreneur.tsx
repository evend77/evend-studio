// src/templates/TemplateVitrineProEntrepreneur.tsx
// e-Vend Studio — Template PREMIUM 25$ — Vitrine Pro Entrepreneur
// Inspiré design Wix Constructuro — 100% original

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface MembreEquipe {
  nom:    string;
  role:   string;
  photo:  string;
}

export interface Service {
  titre:       string;
  description: string;
  photo:       string;
  icone:       string;
}

export interface Temoignage {
  nom:     string;
  note:    number;
  texte:   string;
  photo:   string;
}

export interface ArticleBlog {
  titre:      string;
  extrait:    string;
  photo:      string;
  categorie:  string;
  date:       string;
}

export interface StatItem {
  valeur:     number;
  suffixe:    string;
  label:      string;
}

export interface ConfigVitrineProEntrepreneur {
  // Identité
  nomEntreprise:       string;
  slogan:              string;
  description:         string;
  logoUrl:             string;
  couleurPrincipale:   string;  // ex: '#f59e0b' orange/jaune
  couleurSecondaire:   string;  // ex: '#111827' dark
  couleurAccent:       string;  // ex: '#ffffff'
  police:              'moderne' | 'classique' | 'bold';

  // Hero
  heroPhoto:           string;
  heroTitre:           string;
  heroSousTitre:       string;
  heroBouton1Texte:    string;
  heroBouton2Texte:    string;

  // Badge rotatif
  badgeTexte:          string;  // texte qui tourne autour du badge
  badgeLogoUrl:        string;  // logo au centre du badge
  badgeVitesse:        number;  // secondes pour 1 tour (5=lent, 20=rapide)
  badgeActif:          boolean;

  // Stats
  stats:               StatItem[];
  statsBackground:     string;  // url photo de fond

  // À propos
  aproposPhotos:       string[];  // 3 photos grille
  aproposTitre:        string;
  aproposTexte:        string;
  aproposSousTitre:    string;
  aproposNbClients:    string;

  // Services
  servicesTitre:       string;
  servicesSousTitre:   string;
  services:            Service[];

  // Équipe
  equipeTitre:         string;
  equipe:              MembreEquipe[];

  // Témoignages
  temoignagesTitre:    string;
  temoignages:         Temoignage[];

  // Blog
  blogTitre:           string;
  articles:            ArticleBlog[];

  // Devis / CTA
  devisTitre:          string;
  devisSousTitre:      string;
  devisBackground:     string;

  // Contact
  email:               string;
  telephone:           string;
  adresse:             string;
  instagram:           string;
  facebook:            string;
  linkedin:            string;

  // Nav
  lienAbout:           boolean;
  lienServices:        boolean;
  lienEquipe:          boolean;
  lienBlog:            boolean;
  lienContact:         boolean;
}

// ─── CONFIG DÉFAUT ────────────────────────────────────────────────────────────

export const CONFIG_VITRINE_PRO_ENTREPRENEUR_DEFAUT: ConfigVitrineProEntrepreneur = {
  nomEntreprise:     'BuildPro Québec',
  slogan:            'Construire l\'excellence, bâtir votre vision',
  description:       'Entrepreneurs généraux spécialisés en construction résidentielle et commerciale au Québec depuis 1989.',
  logoUrl:           '',
  couleurPrincipale: '#f59e0b',
  couleurSecondaire: '#111827',
  couleurAccent:     '#ffffff',
  police:            'moderne',

  heroPhoto:         'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=1600',
  heroTitre:         'Construire Votre\nVision avec\nPrécision',
  heroSousTitre:     'Chez BuildPro, nous créons des structures innovantes, durables et adaptées à vos besoins. Bâtissons l\'avenir ensemble.',
  heroBouton1Texte:  'Nos services',
  heroBouton2Texte:  'Contactez-nous',

  badgeTexte:        '★ EXPERTS DE CONFIANCE ★ DEPUIS 1989 ★',
  badgeLogoUrl:      '',
  badgeVitesse:      12,
  badgeActif:        true,

  stats: [
    { valeur: 785,  suffixe: '+', label: 'Projets commerciaux' },
    { valeur: 500,  suffixe: 'M+', label: 'Pi² construits' },
    { valeur: 48,   suffixe: '+', label: 'Projets en cours' },
    { valeur: 36,   suffixe: '+', label: 'Années d\'expérience' },
  ],
  statsBackground: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg?auto=compress&cs=tinysrgb&w=1600',

  aproposPhotos: [
    'https://images.pexels.com/photos/3862627/pexels-photo-3862627.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  aproposTitre:    'À propos de BuildPro Québec',
  aproposSousTitre:'BÂTIR L\'EXCELLENCE',
  aproposTexte:    'Chez BuildPro, nous ne construisons pas seulement des structures — nous créons des héritages. Avec des solutions innovantes, des pratiques durables et un savoir-faire inégalé, nous donnons vie à votre vision. Des maisons aux grandes installations industrielles, BuildPro est votre partenaire de confiance.',
  aproposNbClients:'500+ clients satisfaits',

  servicesTitre:    'Soins professionnels pour chaque projet',
  servicesSousTitre:'NOS SERVICES',
  services: [
    { titre: 'Construction résidentielle', description: 'Des maisons sur mesure alliant confort, style et fonctionnalité adaptées à votre mode de vie.', photo: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600', icone: '🏠' },
    { titre: 'Construction commerciale', description: 'Conception et construction d\'espaces commerciaux modernes pour maximiser votre productivité.', photo: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=600', icone: '🏢' },
    { titre: 'Construction industrielle', description: 'Des structures industrielles durables et efficaces pour soutenir vos grandes opérations.', photo: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=600', icone: '🏭' },
  ],

  equipeTitre: 'Notre équipe d\'experts',
  equipe: [
    { nom: 'Jean-François Laporte', role: 'Directeur général',      photo: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Marie-Claude Hébert',   role: 'Chef de projet',         photo: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Patrick Bouchard',      role: 'Ingénieur en structure', photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Sophie Tremblay',       role: 'Architecte principale',  photo: 'https://images.pexels.com/photos/3775087/pexels-photo-3775087.jpeg?auto=compress&cs=tinysrgb&w=400' },
  ],

  temoignagesTitre: 'Ce que disent nos clients',
  temoignages: [
    { nom: 'Martin Gagnon',     note: 5, texte: 'BuildPro a transformé notre vision en réalité. Travail impeccable, délais respectés et équipe professionnelle du début à la fin.', photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { nom: 'Isabelle Côté',     note: 5, texte: 'Service exceptionnel. Notre maison dépasse toutes nos attentes. Je recommande BuildPro sans hésitation à tous.', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200' },
    { nom: 'Robert Lefebvre',   note: 5, texte: 'Construction de notre entrepôt livrée en avance sur le calendrier. Qualité irréprochable et budget respecté.', photo: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200' },
  ],

  blogTitre: 'Nos dernières actualités',
  articles: [
    { titre: '5 pratiques durables pour une construction écologique', extrait: 'La construction verte représente l\'avenir. Voici comment intégrer des matériaux durables dans vos projets...', photo: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Conseils construction', date: '2026-05-15' },
    { titre: '6 conseils essentiels pour chaque chantier sécuritaire', extrait: 'La sécurité est primordiale. Voici les règles fondamentales pour protéger votre équipe sur le terrain...', photo: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Sécurité', date: '2026-04-22' },
    { titre: 'Top 5 des tendances en construction résidentielle 2026', extrait: 'Maisons intelligentes, matériaux innovants, design biophilique — les tendances qui redéfinissent l\'habitat...', photo: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600', categorie: 'Tendances', date: '2026-03-10' },
  ],

  devisTitre:      'Estimation gratuite disponible',
  devisSousTitre:  'Obtenez une soumission',
  devisBackground: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg?auto=compress&cs=tinysrgb&w=1600',

  email:     'info@buildpro.ca',
  telephone: '514-555-0189',
  adresse:   '1245 boul. Industriel, Montréal, QC H2X 1Y4',
  instagram: 'buildproquebec',
  facebook:  'buildproquebec',
  linkedin:  'buildproquebec',

  lienAbout:    true,
  lienServices: true,
  lienEquipe:   true,
  lienBlog:     true,
  lienContact:  true,
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPolice(p: string) {
  if (p === 'classique') return "'Playfair Display', Georgia, serif";
  if (p === 'bold')      return "'Oswald', 'Impact', sans-serif";
  return "'Inter', system-ui, sans-serif";
}

// ─── HOOK COMPTEUR ANIMÉ ──────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * ease));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);
  return count;
}

// ─── BADGE ROTATIF ────────────────────────────────────────────────────────────

function BadgeRotatif({ config, cp }: { config: ConfigVitrineProEntrepreneur; cp: string }) {
  const texte = config.badgeTexte || '★ EXPERTS DE CONFIANCE ★ DEPUIS 1989 ★';
  const chars = texte.split('');
  const rayon = 70;
  const circonference = 2 * Math.PI * rayon;
  const charWidth = circonference / chars.length;

  return (
    <div style={{ width: 160, height: 160, position: 'relative', cursor: 'default' }}>
      <style>{`
        @keyframes spin-badge { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .badge-ring { animation: spin-badge ${config.badgeVitesse || 12}s linear infinite; transform-origin: center; }
      `}</style>

      {/* Anneau rotatif */}
      <svg className="badge-ring" width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute', inset: 0 }}>
        {chars.map((char, i) => {
          const angle = (i / chars.length) * 2 * Math.PI - Math.PI / 2;
          const x = 80 + rayon * Math.cos(angle);
          const y = 80 + rayon * Math.sin(angle);
          const rotation = (i / chars.length) * 360;
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              transform={`rotate(${rotation}, ${x}, ${y})`}
              style={{ fontSize: 10, fontWeight: 700, fill: '#fff', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
              {char}
            </text>
          );
        })}
        <circle cx="80" cy="80" r={rayon} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      </svg>

      {/* Centre */}
      <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        {config.badgeLogoUrl ? (
          <img src={config.badgeLogoUrl} alt="logo" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: '50%' }} />
        ) : (
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill={cp + '18'} />
            <path d="M14 38 L28 16 L42 38 Z" fill="none" stroke={cp} strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="20" y="28" width="16" height="10" fill={cp} opacity="0.3" rx="1" />
            <rect x="23" y="32" width="4" height="6" fill={cp} rx="0.5" />
            <rect x="29" y="32" width="4" height="6" fill={cp} rx="0.5" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── STATS AVEC COMPTEUR ──────────────────────────────────────────────────────

function SectionStats({ config, cp }: { config: ConfigVitrineProEntrepreneur; cp: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', padding: '72px 24px', textAlign: 'center' }}>
      {/* Photo de fond */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.statsBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.25)' }} />
      {/* Overlay couleur */}
      <div style={{ position: 'absolute', inset: 0, background: `${config.couleurSecondaire}cc` }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {config.stats.map((stat, i) => (
            <StatCard key={i} stat={stat} cp={cp} visible={visible} delay={i * 150} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ stat, cp, visible, delay }: { stat: StatItem; cp: string; visible: boolean; delay: number }) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (visible) { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }
  }, [visible, delay]);
  const count = useCountUp(stat.valeur, 2200, started);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 900, color: cp, lineHeight: 1 }}>
          {count}
        </span>
        <span style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: cp }}>{stat.suffixe}</span>
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8, letterSpacing: '0.05em' }}>{stat.label}</p>
    </div>
  );
}

// ─── SECTION TÉMOIGNAGES ──────────────────────────────────────────────────────

function SectionTemoignages({ config, cp, cs }: { config: ConfigVitrineProEntrepreneur; cp: string; cs: string }) {
  const [actif, setActif] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActif(prev => (prev + 1) % config.temoignages.length), 5000);
    return () => clearInterval(t);
  }, [config.temoignages.length]);

  const t = config.temoignages[actif];
  if (!t) return null;

  return (
    <div style={{ background: cp, padding: '72px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -40, left: -20, fontSize: 200, opacity: 0.06, fontWeight: 900, color: cs, lineHeight: 1, pointerEvents: 'none' }}>"</div>

      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: cs + 'aa', marginBottom: 12 }}>
          VRAIS HISTOIRES, VRAIE SATISFACTION
        </p>
        <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: cs, marginBottom: 48 }}>{config.temoignagesTitre}</h2>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {config.temoignages.map((tem, i) => (
            <div key={i} onClick={() => setActif(i)}
              style={{ flex: '1 1 240px', maxWidth: 320, background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', transform: i === actif ? 'scale(1.03)' : 'scale(0.97)', opacity: i === actif ? 1 : 0.7, boxShadow: i === actif ? `0 20px 48px rgba(0,0,0,0.25)` : '0 4px 12px rgba(0,0,0,0.1)' }}>
              {/* Citation */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: cp + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '-52px auto 16px', border: `3px solid #fff` }}>
                <span style={{ fontSize: 22, color: cs }}>❝</span>
              </div>
              {/* Étoiles */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 12 }}>
                {Array.from({ length: tem.note }).map((_, j) => <span key={j} style={{ color: cp, fontSize: 16 }}>★</span>)}
              </div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 20 }}>{tem.texte}</p>
              {/* Auteur */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {tem.photo && <img src={tem.photo} alt={tem.nom} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cp}` }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <div>
                  <p style={{ fontWeight: 700, color: cs, fontSize: 14, margin: 0 }}>{tem.nom}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {config.temoignages.map((_, i) => (
            <div key={i} onClick={() => setActif(i)} style={{ width: i === actif ? 24 : 8, height: 8, borderRadius: 4, background: i === actif ? cs : cs + '40', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigVitrineProEntrepreneur>;
  siteId?: number;
  vendeurId?: number;
}

export default function TemplateVitrineProEntrepreneur({ config: configProp }: Props) {
  const config = { ...CONFIG_VITRINE_PRO_ENTREPRENEUR_DEFAUT, ...configProp };
  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const ca = config.couleurAccent;
  const police = getPolice(config.police);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [devisNom, setDevisNom] = useState('');
  const [devisEmail, setDevisEmail] = useState('');
  const [devisService, setDevisService] = useState('');
  const [devisEnvoye, setDevisEnvoye] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOuvert(false); };

  const navItems = [
    config.lienAbout    && { label: 'À propos',  id: 'apropos'  },
    config.lienServices && { label: 'Services',  id: 'services' },
    config.lienEquipe   && { label: 'Équipe',    id: 'equipe'   },
    config.lienBlog     && { label: 'Blog',      id: 'blog'     },
    config.lienContact  && { label: 'Contact',   id: 'contact'  },
  ].filter(Boolean) as { label: string; id: string }[];

  return (
    <div style={{ fontFamily: police, color: cs, overflowX: 'hidden' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;700;800&family=Oswald:wght@400;600;700&display=swap" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .nav-link:hover { color: ${cp} !important; }
        .service-card:hover .service-overlay { opacity:1 !important; }
        .service-card:hover img { transform: scale(1.07) !important; }
        .article-card:hover { transform: translateY(-6px) !important; box-shadow: 0 20px 48px rgba(0,0,0,0.15) !important; }
        .membre-card:hover img { transform: scale(1.04) !important; }
        .hero-text { animation: fadeUp 0.9s ease both; }
        .hero-text-2 { animation: fadeUp 0.9s ease 0.2s both; }
        .hero-text-3 { animation: fadeUp 0.9s ease 0.4s both; }
        .badge-wrap { animation: fadeIn 1.2s ease 0.6s both; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.5); }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: ${cp}; border-radius: 3px; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, background: cs + 'f0', backdropFilter: 'blur(10px)', borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {config.logoUrl
              ? <img src={config.logoUrl} alt="logo" style={{ height: 40, objectFit: 'contain' }} />
              : <div style={{ width: 40, height: 40, borderRadius: 8, background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: cs }}>B</div>
            }
            <span style={{ fontWeight: 800, fontSize: 18, color: ca }}>{config.nomEntreprise}</span>
          </div>

          {/* Nav links desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 32 }}>
              {navItems.map(item => (
                <span key={item.id} className="nav-link" onClick={() => scrollTo(item.id)}
                  style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'color .2s' }}>
                  {item.label}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => scrollTo('contact')}
              style={{ background: cp, color: cs, border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.03em' }}>
              {config.heroBouton2Texte}
            </button>
            {isMobile && (
              <button onClick={() => setMenuOuvert(!menuOuvert)} style={{ background: 'none', border: 'none', color: ca, fontSize: 22, cursor: 'pointer' }}>
                {menuOuvert ? '✕' : '☰'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobile && menuOuvert && (
          <div style={{ background: cs, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {navItems.map(item => (
              <div key={item.id} onClick={() => scrollTo(item.id)} style={{ padding: '12px 0', color: ca, fontWeight: 600, fontSize: 15, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 68 }}>
        {/* Photo fond */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.heroPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(110deg, ${cs}e8 40%, ${cs}55 70%, transparent 100%)` }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: isMobile ? '60px 24px' : '0 64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, width: '100%', flexWrap: 'wrap' }}>
          {/* Texte */}
          <div style={{ maxWidth: 580 }}>
            <p className="hero-text" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: cp, marginBottom: 16 }}>
              BÂTIR L'EXCELLENCE
            </p>
            <h1 className="hero-text-2" style={{ fontSize: `clamp(32px, 5.5vw, 72px)`, fontWeight: 900, color: ca, lineHeight: 1.05, marginBottom: 20, whiteSpace: 'pre-line' }}>
              {config.heroTitre}
            </h1>
            <p className="hero-text-3" style={{ fontSize: `clamp(14px, 1.8vw, 18px)`, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              {config.heroSousTitre}
            </p>
            <div className="hero-text-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <button onClick={() => scrollTo('services')}
                style={{ background: cp, color: cs, border: 'none', borderRadius: 6, padding: '14px 32px', fontWeight: 800, fontSize: 15, cursor: 'pointer', letterSpacing: '0.02em' }}>
                {config.heroBouton1Texte}
              </button>
              <button onClick={() => scrollTo('contact')}
                style={{ background: 'transparent', color: ca, border: `2px solid ${ca}`, borderRadius: 6, padding: '12px 30px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                {config.heroBouton2Texte}
              </button>
            </div>
          </div>

          {/* Badge rotatif */}
          {config.badgeActif && !isMobile && (
            <div className="badge-wrap">
              <BadgeRotatif config={config} cp={cp} />
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, transparent, ${cp})` }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cp }} />
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <SectionStats config={config} cp={cp} />

      {/* ── À PROPOS ────────────────────────────────────────────────────────── */}
      <section id="apropos" style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '64px 24px' : '96px 64px', display: 'flex', gap: 64, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Grille photos asymétrique */}
        <div style={{ flex: '1 1 400px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '240px 180px', gap: 12, maxWidth: 520 }}>
          {config.aproposPhotos[0] && (
            <div style={{ gridRow: '1 / 3', borderRadius: 12, overflow: 'hidden' }}>
              <img src={config.aproposPhotos[0]} alt="à propos" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {config.aproposPhotos[1] && (
            <div style={{ borderRadius: 12, overflow: 'hidden' }}>
              <img src={config.aproposPhotos[1]} alt="à propos" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {config.aproposPhotos[2] && (
            <div style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
              <img src={config.aproposPhotos[2]} alt="à propos" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {/* Badge clients */}
          <div style={{ position: 'absolute', bottom: -10, left: -10, background: cp, borderRadius: 12, padding: '14px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'inline-block' }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: cs, margin: 0 }}>{config.aproposNbClients.split(' ')[0]}</p>
            <p style={{ fontSize: 11, color: cs, margin: 0, fontWeight: 700 }}>{config.aproposNbClients.split(' ').slice(1).join(' ')}</p>
          </div>
        </div>

        {/* Texte */}
        <div style={{ flex: '1 1 340px' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>
            {config.aproposSousTitre}
          </p>
          <h2 style={{ fontSize: `clamp(24px, 3.5vw, 42px)`, fontWeight: 800, color: cs, marginBottom: 20, lineHeight: 1.2 }}>
            {config.aproposTitre}
          </h2>
          <p style={{ fontSize: 15, color: '#555', lineHeight: 1.8, marginBottom: 28 }}>{config.aproposTexte}</p>
          <button onClick={() => scrollTo('services')}
            style={{ background: cp, color: cs, border: 'none', borderRadius: 6, padding: '12px 28px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            En savoir plus →
          </button>
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────────────── */}
      <section id="services" style={{ background: '#f9fafb', padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>{config.servicesSousTitre}</p>
            <h2 style={{ fontSize: `clamp(24px, 3.5vw, 40px)`, fontWeight: 800, color: cs }}>{config.servicesTitre}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '300px'}, 1fr))`, gap: 24 }}>
            {config.services.map((s, i) => (
              <div key={i} className="service-card" style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer' }}>
                <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                  <img src={s.photo} alt={s.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onError={e => { (e.target as HTMLImageElement).style.background = '#f3f4f6'; }} />
                  <div className="service-overlay" style={{ position: 'absolute', inset: 0, background: `${cp}cc`, opacity: 0, transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 40 }}>{s.icone}</span>
                  </div>
                </div>
                <div style={{ padding: '22px 20px' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: cs, marginBottom: 10 }}>{s.titre}</h3>
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 18 }}>{s.description}</p>
                  <button onClick={() => scrollTo('contact')}
                    style={{ background: cp, color: cs, border: 'none', borderRadius: 6, padding: '9px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    Voir les détails →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÉQUIPE ──────────────────────────────────────────────────────────── */}
      <section id="equipe" style={{ background: cs, padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>NOTRE ÉQUIPE</p>
            <h2 style={{ fontSize: `clamp(24px, 3.5vw, 40px)`, fontWeight: 800, color: ca }}>{config.equipeTitre}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '48%' : '220px'}, 1fr))`, gap: 20 }}>
            {config.equipe.map((m, i) => (
              <div key={i} className="membre-card" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ position: 'relative', paddingBottom: 8 }}>
                  <div style={{ height: isMobile ? 200 : 260, overflow: 'hidden' }}>
                    <img src={m.photo} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span style={{ background: cp, color: cs, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>{m.role}</span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: ca, margin: 0 }}>{m.nom}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────────────────── */}
      <SectionTemoignages config={config} cp={cp} cs={cs} />

      {/* ── BLOG ────────────────────────────────────────────────────────────── */}
      <section id="blog" style={{ background: '#f9fafb', padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>CONSEILS D'EXPERTS</p>
            <h2 style={{ fontSize: `clamp(24px, 3.5vw, 40px)`, fontWeight: 800, color: cs }}>{config.blogTitre}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '320px'}, 1fr))`, gap: 24 }}>
            {config.articles.map((a, i) => (
              <article key={i} className="article-card" style={{ borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transition: 'all 0.3s', cursor: 'pointer' }}>
                <div style={{ height: 200, overflow: 'hidden' }}>
                  <img src={a.photo} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div style={{ padding: '20px' }}>
                  <span style={{ display: 'inline-block', background: cp + '20', color: cs, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.categorie}</span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: cs, lineHeight: 1.4, marginBottom: 10 }}>{a.titre}</h3>
                  <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{a.extrait.slice(0, 120)}...</p>
                  <p style={{ fontSize: 11, color: '#aaa', marginTop: 12 }}>{new Date(a.date).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULAIRE DEVIS ────────────────────────────────────────────────── */}
      <section id="contact" style={{ position: 'relative', padding: isMobile ? '64px 24px' : '96px 64px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.devisBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.2)' }} />
        <div style={{ position: 'absolute', inset: 0, background: `${cp}cc` }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: cs + 'cc', marginBottom: 12 }}>{config.devisTitre}</p>
          <h2 style={{ fontSize: `clamp(26px, 4vw, 48px)`, fontWeight: 900, color: cs, marginBottom: 48 }}>{config.devisSousTitre}</h2>

          {devisEnvoye ? (
            <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: '40px 24px', maxWidth: 500, margin: '0 auto' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>✅</p>
              <h3 style={{ fontWeight: 800, color: cs, fontSize: 20, marginBottom: 8 }}>Demande envoyée!</h3>
              <p style={{ color: '#555', fontSize: 14 }}>Nous vous contacterons dans les 24 heures.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100%' : '200px'}, 1fr))`, gap: 14, maxWidth: 900, margin: '0 auto 16px' }}>
              {[
                { placeholder: 'Prénom *', value: devisNom, onChange: setDevisNom, type: 'text' },
                { placeholder: 'Courriel *', value: devisEmail, onChange: setDevisEmail, type: 'email' },
                { placeholder: 'Type de service', value: devisService, onChange: setDevisService, type: 'text' },
              ].map(({ placeholder, value, onChange, type }, i) => (
                <input key={i} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
                  style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 8, color: cs, fontSize: 14, outline: 'none', backdropFilter: 'blur(4px)', fontFamily: police }} />
              ))}
              <button onClick={() => { if (!devisNom || !devisEmail) { alert('Remplissez votre nom et courriel.'); return; } setDevisEnvoye(true); }}
                style={{ padding: '14px 28px', background: cs, color: cp, border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 14, cursor: 'pointer', letterSpacing: '0.04em', fontFamily: police }}>
                Envoyer →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: cs === '#111827' ? '#0a0f1a' : cs, padding: isMobile ? '48px 24px' : '64px 64px 32px', color: ca }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '45%' : '180px'}, 1fr))`, gap: 36, marginBottom: 48 }}>
            {/* Colonne identité */}
            <div style={{ gridColumn: isMobile ? '1 / -1' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                {config.logoUrl
                  ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 8, background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: cs }}>B</div>
                }
                <span style={{ fontWeight: 800, fontSize: 17 }}>{config.nomEntreprise}</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 200 }}>{config.description}</p>
            </div>

            {/* S'abonner */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>S'ABONNER</h4>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.6 }}>Recevez nos actualités et conseils.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Votre courriel" style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: ca, fontSize: 12, outline: 'none', fontFamily: police }} />
                <button style={{ background: cp, border: 'none', borderRadius: 6, padding: '8px 14px', color: cs, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>OK</button>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>CONTACT</h4>
              {[
                config.email     && { label: config.email,     href: `mailto:${config.email}` },
                config.telephone && { label: config.telephone, href: `tel:${config.telephone}` },
                config.adresse   && { label: config.adresse,   href: '#' },
              ].filter(Boolean).map((item: any, i) => (
                <a key={i} href={item.href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textDecoration: 'none', lineHeight: 1.5 }}>{item.label}</a>
              ))}
            </div>

            {/* Navigation */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>NAVIGATION</h4>
              {navItems.map(item => (
                <div key={item.id} onClick={() => scrollTo(item.id)} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8, cursor: 'pointer' }}>{item.label}</div>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>RÉSEAUX</h4>
              {[
                config.instagram && { label: 'Instagram', href: `https://instagram.com/${config.instagram}` },
                config.facebook  && { label: 'Facebook',  href: `https://facebook.com/${config.facebook}` },
                config.linkedin  && { label: 'LinkedIn',  href: `https://linkedin.com/company/${config.linkedin}` },
              ].filter(Boolean).map((s: any, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textDecoration: 'none' }}>{s.label}</a>
              ))}
            </div>
          </div>

          {/* Bas footer */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
              © {new Date().getFullYear()} {config.nomEntreprise} · Tous droits réservés
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
              Propulsé par <span style={{ color: cp }}>e-Vend Studio</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}