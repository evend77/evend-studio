// src/templates/TemplateFormationWeb.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template Formation Web & Programmation
// Style : fond #050816 (bleu nuit) / accent cyan #00d4ff + violet #7c3aed
// Typo : JetBrains Mono (code) + Inter
// Effet : engrenages 360° miroir défilants, particules, scroll reveals
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface ModuleCours {
  titre: string;
  description: string;
  duree: string;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé';
  icone: string;
  sujets: string[];
}

export interface FormateurWeb {
  nom: string;
  titre: string;
  bio: string;
  photo: string;
  competences: string[];
  reseaux?: { github?: string; linkedin?: string };
}

export interface TemoignageWeb {
  texte: string;
  auteur: string;
  role: string;
  photo: string;
  note: number;
  entreprise?: string;
}

export interface FormuleWeb {
  nom: string;
  prix: string;
  periode: string;
  description: string;
  inclus: string[];
  populaire?: boolean;
}

export interface TechLogoItem {
  nom: string;
  icone: string;
}

export interface ConfigFormationWeb {
  // Identité
  nomEcole: string;
  tagline: string;
  sousTagline: string;
  descriptionCourte: string;
  descriptionLongue: string;
  logoTexte: string;

  // Couleurs
  couleurFond: string;       // #050816
  couleurCyan: string;       // #00d4ff
  couleurViolet: string;     // #7c3aed
  couleurCarte: string;      // #0d1224

  // Stats hero
  stats: { valeur: string; label: string; icone: string }[];

  // Technologies enseignées
  technologies: TechLogoItem[];

  // Modules / cours
  modules: ModuleCours[];

  // Formateurs
  formateurs: FormateurWeb[];

  // Témoignages
  temoignages: TemoignageWeb[];

  // Formules tarifaires
  formules: FormuleWeb[];

  // FAQ
  faq: { question: string; reponse: string }[];

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];

  // Réseaux
  reseaux: { github?: string; discord?: string; linkedin?: string; twitter?: string };

  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_WEB_DEFAUT: ConfigFormationWeb = {
  nomEcole: 'CodeLaunch',
  tagline: 'Lancez votre',
  sousTagline: 'carrière en tech.',
  descriptionCourte: 'Apprenez le développement web avec des formateurs experts du milieu. Des projets réels, une communauté active et un suivi personnalisé pour vous propulser vers l\'emploi.',
  descriptionLongue: 'CodeLaunch est une école de formation intensive en développement web et programmation. Nos bootcamps, cours en ligne et formations certifiantes sont conçus par des développeurs en activité pour vous donner les compétences demandées par le marché.',
  logoTexte: 'code<span>Launch</span>',

  couleurFond: '#050816',
  couleurCyan: '#00d4ff',
  couleurViolet: '#7c3aed',
  couleurCarte: '#0d1224',

  stats: [
    { valeur: '2,400+', label: 'Diplômés', icone: '🎓' },
    { valeur: '94%', label: 'Taux d\'emploi', icone: '💼' },
    { valeur: '12', label: 'Langages enseignés', icone: '💻' },
    { valeur: '4.9★', label: 'Note moyenne', icone: '⭐' },
  ],

  technologies: [
    { nom: 'HTML5', icone: '🌐' },
    { nom: 'CSS3', icone: '🎨' },
    { nom: 'JavaScript', icone: '⚡' },
    { nom: 'TypeScript', icone: '🔷' },
    { nom: 'React', icone: '⚛️' },
    { nom: 'Node.js', icone: '🟢' },
    { nom: 'Python', icone: '🐍' },
    { nom: 'SQL', icone: '🗄️' },
    { nom: 'Git', icone: '🌿' },
    { nom: 'Docker', icone: '🐳' },
    { nom: 'AWS', icone: '☁️' },
    { nom: 'GraphQL', icone: '◈' },
  ],

  modules: [
    {
      titre: 'Fondements du Web',
      description: 'Maîtrisez HTML, CSS et les bases de JavaScript pour construire vos premières pages web professionnelles.',
      duree: '4 semaines',
      niveau: 'Débutant',
      icone: '🌐',
      sujets: ['HTML5 sémantique', 'CSS Grid & Flexbox', 'JavaScript ES6+', 'Responsive Design'],
    },
    {
      titre: 'JavaScript Avancé & React',
      description: 'Plongez dans l\'écosystème React moderne avec hooks, context et gestion d\'état avancée.',
      duree: '6 semaines',
      niveau: 'Intermédiaire',
      icone: '⚛️',
      sujets: ['React 18+', 'TypeScript', 'Redux Toolkit', 'Testing avec Vitest'],
    },
    {
      titre: 'Backend & APIs',
      description: 'Construisez des APIs robustes avec Node.js, Express et des bases de données SQL/NoSQL.',
      duree: '5 semaines',
      niveau: 'Intermédiaire',
      icone: '🔧',
      sujets: ['Node.js & Express', 'PostgreSQL', 'REST & GraphQL', 'Authentification JWT'],
    },
    {
      titre: 'DevOps & Déploiement',
      description: 'Apprenez à déployer vos applications dans le cloud avec Docker, CI/CD et AWS.',
      duree: '3 semaines',
      niveau: 'Avancé',
      icone: '🚀',
      sujets: ['Docker & Kubernetes', 'GitHub Actions', 'AWS EC2 & S3', 'Monitoring'],
    },
    {
      titre: 'IA & Automatisation',
      description: 'Intégrez l\'intelligence artificielle dans vos projets web avec les APIs modernes.',
      duree: '4 semaines',
      niveau: 'Avancé',
      icone: '🤖',
      sujets: ['API OpenAI', 'LangChain', 'Python & FastAPI', 'ML basique'],
    },
    {
      titre: 'Projet Final & Portfolio',
      description: 'Réalisez un projet complet de A à Z et constituez un portfolio qui attire les recruteurs.',
      duree: '4 semaines',
      niveau: 'Avancé',
      icone: '🏆',
      sujets: ['Projet fullstack', 'Portfolio GitHub', 'Préparation entrevues', 'Réseautage'],
    },
  ],

  formateurs: [
    {
      nom: 'Alex Tran',
      titre: 'Lead Developer & Formateur Senior',
      bio: 'Ex-ingénieur chez Shopify avec 10 ans d\'expérience. Spécialiste React et architecture frontend moderne.',
      photo: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=400',
      competences: ['React', 'TypeScript', 'GraphQL', 'Performance Web'],
      reseaux: { github: '#', linkedin: '#' },
    },
    {
      nom: 'Sarah Montpetit',
      titre: 'Architecte Backend & DevOps',
      bio: 'Ancienne CTO d\'une startup SaaS. Passionnée par les architectures scalables et la culture DevOps.',
      photo: 'https://images.pexels.com/photos/3756678/pexels-photo-3756678.jpeg?auto=compress&cs=tinysrgb&w=400',
      competences: ['Node.js', 'Docker', 'AWS', 'PostgreSQL'],
      reseaux: { github: '#', linkedin: '#' },
    },
    {
      nom: 'Marco Beaulieu',
      titre: 'Expert IA & Python',
      bio: 'Chercheur en ML reconverti en formateur. Aide les développeurs à intégrer l\'IA dans leurs projets web.',
      photo: 'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=400',
      competences: ['Python', 'FastAPI', 'OpenAI', 'LangChain'],
      reseaux: { github: '#', linkedin: '#' },
    },
  ],

  temoignages: [
    {
      texte: 'En 6 mois avec CodeLaunch, j\'ai décroché un poste de développeur React à 75k$. La qualité des formateurs et les projets réels font toute la différence.',
      auteur: 'Julien Côté',
      role: 'Développeur Frontend',
      entreprise: 'Lightspeed',
      photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
      note: 5,
    },
    {
      texte: 'Reconversion réussie! Après 10 ans en comptabilité, CodeLaunch m\'a permis de devenir développeur fullstack. Le suivi personnalisé est exceptionnel.',
      auteur: 'Marie-Claude Lebrun',
      role: 'Développeuse Fullstack',
      entreprise: 'Ubisoft',
      photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200',
      note: 5,
    },
    {
      texte: 'La communauté Discord est incroyable. On s\'entraide, on partage des ressources et les formateurs répondent même le soir. Investissement qui en vaut largement la peine.',
      auteur: 'Kevin Arsenault',
      role: 'Développeur Backend',
      entreprise: 'Moment Factory',
      photo: 'https://images.pexels.com/photos/3756678/pexels-photo-3756678.jpeg?auto=compress&cs=tinysrgb&w=200',
      note: 5,
    },
    {
      texte: 'Les modules IA m\'ont permis de me démarquer. Je suis maintenant le seul dev de mon équipe à maîtriser l\'intégration d\'OpenAI. Merci CodeLaunch!',
      auteur: 'Priya Sharma',
      role: 'Full-Stack + IA Developer',
      entreprise: 'Coveo',
      photo: 'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=200',
      note: 5,
    },
  ],

  formules: [
    {
      nom: 'Starter',
      prix: '49$',
      periode: '/ mois',
      description: 'Pour découvrir le développement web à votre rythme.',
      inclus: ['Accès aux modules de base', 'Forum communautaire', 'Exercices pratiques', '1 projet guidé'],
      populaire: false,
    },
    {
      nom: 'Bootcamp',
      prix: '199$',
      periode: '/ mois',
      description: 'Formation intensive avec suivi personnalisé — le choix des reconversions.',
      inclus: ['Tous les modules', 'Mentorat 1-on-1 hebdo', 'Projets réels en équipe', 'Certificat reconnu', 'Aide à l\'emploi', 'Accès Discord VIP'],
      populaire: true,
    },
    {
      nom: 'Entreprise',
      prix: 'Sur mesure',
      periode: '',
      description: 'Formation adaptée pour vos équipes avec contenu personnalisé.',
      inclus: ['Contenu sur mesure', 'Formateur dédié', 'Tableau de bord RH', 'Facture entreprise', 'SLA garanti'],
      populaire: false,
    },
  ],

  faq: [
    { question: 'Faut-il avoir des connaissances préalables en programmation?', reponse: 'Non! Notre parcours Débutant part de zéro. Vous avez juste besoin d\'un ordinateur et de motivation. Nos formateurs s\'adaptent à votre rythme.' },
    { question: 'Les formations sont-elles en ligne ou en présentiel?', reponse: 'Nous offrons les deux formats. Les cours en ligne sont disponibles 24/7 en rediffusion. Le Bootcamp inclut aussi des sessions live hebdomadaires en groupe.' },
    { question: 'Quel est le taux de placement après la formation?', reponse: 'Notre taux de placement est de 94% dans les 3 mois suivant la fin de la formation. Nous avons des partenariats actifs avec +50 entreprises tech au Québec.' },
    { question: 'Est-ce que les certificats sont reconnus par les employeurs?', reponse: 'Oui. Nos certificats sont reconnus par nos entreprises partenaires. De plus, vous construirez un portfolio GitHub solide qui parle de lui-même aux recruteurs.' },
    { question: 'Puis-je suivre la formation à temps partiel?', reponse: 'Absolument. La formule Starter est conçue pour ça — 10-15h/semaine suffit. Le Bootcamp recommande 30-40h/semaine pour une progression optimale.' },
  ],

  adresse: '3500 boulevard de Maisonneuve Ouest, Suite 800',
  ville: 'Montréal, QC H3Z 1L3',
  telephone: '(514) 555-0200',
  email: 'bonjour@codelaunch.ca',
  horaires: ['Lun – Ven : 9h – 18h', 'Samedi : Sessions live 10h – 12h', 'Support Discord : 24/7'],
  reseaux: { github: '#', discord: '#', linkedin: '#', twitter: '#' },

  sections: [
    { id: 'hero',       actif: true, ordre: 1, label: 'Hero + Engrenages'      },
    { id: 'stats',      actif: true, ordre: 2, label: 'Statistiques clés'      },
    { id: 'techno',     actif: true, ordre: 3, label: 'Technologies enseignées' },
    { id: 'modules',    actif: true, ordre: 4, label: 'Modules de cours'       },
    { id: 'formateurs', actif: true, ordre: 5, label: 'Nos formateurs'         },
    { id: 'temoignages',actif: true, ordre: 6, label: 'Témoignages'            },
    { id: 'formules',   actif: true, ordre: 7, label: 'Formules & Tarifs'      },
    { id: 'faq',        actif: true, ordre: 8, label: 'FAQ'                    },
    { id: 'contact',    actif: true, ordre: 9, label: 'Contact'                },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useReveal(t = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold: t });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [t]);
  return { ref, vis };
}

function useCounter(cible: number, actif: boolean, duree = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!actif) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duree, 1);
      const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;
      setVal(Math.floor(ease * cible));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [actif, cible, duree]);
  return val;
}

function ea<T>(val: any, def: T[]): T[] {
  return Array.isArray(val) && val.length > 0 ? val : def;
}

// ─── STYLES GLOBAUX ───────────────────────────────────────────────────────────

const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.fw-btn-primary {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  color: #fff; border: none; padding: 14px 32px;
  font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
  cursor: pointer; border-radius: 8px; letter-spacing: 0.04em;
  transition: filter .25s, transform .25s; position: relative; overflow: hidden;
}
.fw-btn-primary::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, #7c3aed, #00d4ff);
  opacity: 0; transition: opacity .3s;
}
.fw-btn-primary:hover { filter: brightness(1.15); transform: translateY(-2px); }
.fw-btn-primary:hover::after { opacity: 1; }
.fw-btn-primary span { position: relative; z-index: 1; }

.fw-btn-outline {
  background: transparent; color: #00d4ff;
  border: 1.5px solid #00d4ff; padding: 13px 30px;
  font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
  cursor: pointer; border-radius: 8px; letter-spacing: 0.04em;
  transition: all .25s;
}
.fw-btn-outline:hover { background: #00d4ff15; transform: translateY(-2px); }

/* Reveal animations */
.rv { opacity: 0; transform: translateY(40px); transition: opacity .8s ease, transform .8s ease; }
.rv.vis { opacity: 1; transform: translateY(0); }
.rv-l { opacity: 0; transform: translateX(-48px); transition: opacity .8s ease, transform .8s ease; }
.rv-l.vis { opacity: 1; transform: translateX(0); }
.rv-r { opacity: 0; transform: translateX(48px); transition: opacity .8s ease, transform .8s ease; }
.rv-r.vis { opacity: 1; transform: translateX(0); }

/* Cards */
.fw-card {
  background: #0d1224; border: 1px solid rgba(0,212,255,0.12);
  border-radius: 16px; padding: 28px 24px;
  transition: border-color .3s, transform .3s, box-shadow .3s;
}
.fw-card:hover {
  border-color: rgba(0,212,255,0.45);
  transform: translateY(-6px);
  box-shadow: 0 20px 60px rgba(0,212,255,0.12);
}

.fw-card-violet {
  background: #0d1224; border: 1px solid rgba(124,58,237,0.15);
  border-radius: 16px; padding: 28px 24px;
  transition: border-color .3s, transform .3s, box-shadow .3s;
}
.fw-card-violet:hover {
  border-color: rgba(124,58,237,0.5);
  transform: translateY(-6px);
  box-shadow: 0 20px 60px rgba(124,58,237,0.15);
}

/* Nav links */
.fw-nav-link {
  font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,0.7); cursor: pointer;
  background: none; border: none;
  padding: 6px 0; transition: color .2s;
  letter-spacing: 0.02em;
}
.fw-nav-link:hover, .fw-nav-link.active { color: #00d4ff; }

/* Input style */
.fw-input {
  width: 100%; padding: 13px 16px;
  background: #0d1224; border: 1px solid rgba(0,212,255,0.2);
  border-radius: 8px; color: #fff;
  font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
  box-sizing: border-box; transition: border-color .2s;
}
.fw-input:focus { border-color: #00d4ff; box-shadow: 0 0 0 3px rgba(0,212,255,0.1); }
.fw-input::placeholder { color: rgba(255,255,255,0.3); font-size: 13px; }

/* Engrenage animation */
@keyframes gearSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes gearSpinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes glowPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes slideLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
@keyframes scanline {
  from { transform: translateY(-100%); }
  to { transform: translateY(100vh); }
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Terminal typing */
.cursor-blink { animation: blink 1s infinite; }

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #00d4ff, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* FAQ */
.faq-item { border-bottom: 1px solid rgba(255,255,255,0.07); }
.faq-btn {
  width: 100%; background: none; border: none; cursor: pointer;
  padding: 22px 0; display: flex; justify-content: space-between;
  align-items: center; color: #fff;
  font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 500;
  text-align: left; gap: 16px; transition: color .2s;
}
.faq-btn:hover { color: #00d4ff; }

/* Niveau badges */
.badge-debutant { background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; }
.badge-intermediaire { background: rgba(0,212,255,0.15); color: #00d4ff; border: 1px solid rgba(0,212,255,0.3); border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; }
.badge-avance { background: rgba(124,58,237,0.15); color: #a78bfa; border: 1px solid rgba(124,58,237,0.3); border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 600; }

/* Scrollbar custom */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #050816; }
::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
`;

// ─── COMPOSANT ENGRENAGE SVG ──────────────────────────────────────────────────

function Gear({ size, teeth, couleur, vitesse, reverse, opacity = 1 }: {
  size: number; teeth: number; couleur: string; vitesse: number; reverse?: boolean; opacity?: number;
}) {
  const R = size / 2;
  const r = R * 0.55;
  const rInner = R * 0.28;
  const toothH = R * 0.22;
  const toothW = (2 * Math.PI * R) / (teeth * 2.8);

  // Générer les dents
  const pathData = (() => {
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 0.3) / teeth) * Math.PI * 2 - Math.PI / 2;
      const a3 = ((i + 0.7) / teeth) * Math.PI * 2 - Math.PI / 2;
      const a4 = ((i + 1) / teeth) * Math.PI * 2 - Math.PI / 2;

      if (i === 0) {
        d += `M ${(r * Math.cos(a1)).toFixed(2)} ${(r * Math.sin(a1)).toFixed(2)} `;
      }
      d += `L ${((r + toothH) * Math.cos(a2)).toFixed(2)} ${((r + toothH) * Math.sin(a2)).toFixed(2)} `;
      d += `L ${((r + toothH) * Math.cos(a3)).toFixed(2)} ${((r + toothH) * Math.sin(a3)).toFixed(2)} `;
      d += `L ${(r * Math.cos(a4)).toFixed(2)} ${(r * Math.sin(a4)).toFixed(2)} `;
    }
    d += 'Z';
    return d;
  })();

  return (
    <svg
      width={size} height={size}
      viewBox={`${-R} ${-R} ${size} ${size}`}
      style={{
        animation: `${reverse ? 'gearSpinReverse' : 'gearSpin'} ${vitesse}s linear infinite`,
        opacity,
        filter: `drop-shadow(0 0 ${size * 0.06}px ${couleur})`,
      }}
    >
      <path d={pathData} fill={couleur} fillOpacity={0.15} stroke={couleur} strokeWidth={1.5} />
      <circle r={rInner} fill="none" stroke={couleur} strokeWidth={1.5} opacity={0.8} />
      <circle r={rInner * 0.4} fill={couleur} opacity={0.6} />
    </svg>
  );
}

// ─── BANDE D'ENGRENAGES MIROIR ─────────────────────────────────────────────────

function GearBand({ config }: { config: ConfigFormationWeb }) {
  const cyan = config.couleurCyan;
  const violet = config.couleurViolet;

  // Définir les engrenages de la bande (size, teeth, couleur, vitesse, reverse)
  const gears = [
    { size: 90,  teeth: 12, couleur: cyan,   vitesse: 8,  reverse: false },
    { size: 60,  teeth: 8,  couleur: violet, vitesse: 5,  reverse: true  },
    { size: 110, teeth: 14, couleur: cyan,   vitesse: 10, reverse: false },
    { size: 70,  teeth: 9,  couleur: violet, vitesse: 6,  reverse: true  },
    { size: 85,  teeth: 11, couleur: cyan,   vitesse: 7,  reverse: false },
    { size: 55,  teeth: 7,  couleur: violet, vitesse: 4,  reverse: true  },
    { size: 100, teeth: 13, couleur: cyan,   vitesse: 9,  reverse: false },
    { size: 65,  teeth: 8,  couleur: violet, vitesse: 5,  reverse: true  },
  ];

  return (
    <div style={{ position: 'relative', overflow: 'hidden', height: 180 }}>
      {/* Ligne de gradient haut et bas pour l'effet de fondu */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to bottom, ${config.couleurFond}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: `linear-gradient(to top, ${config.couleurFond}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />

      {/* Bande qui défile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, animation: 'slideLeft 30s linear infinite', width: 'max-content', paddingLeft: 20 }}>
        {/* Double pour l'effet boucle parfaite */}
        {[...gears, ...gears, ...gears].map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Gear {...g} />
            {/* Ligne de connexion entre engrenages */}
            <div style={{ width: 16, height: 2, background: `linear-gradient(90deg, ${g.couleur}40, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Miroir — bande inversée décalée (effet de reflet) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', gap: 20,
        animation: 'slideLeft 30s linear infinite reverse',
        width: 'max-content', paddingLeft: 140,
        transform: 'scaleX(-1)', opacity: 0.35,
      }}>
        {[...gears, ...gears, ...gears].map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Gear {...g} reverse={!g.reverse} />
            <div style={{ width: 16, height: 2, background: `linear-gradient(90deg, ${g.couleur}40, transparent)` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigFormationWeb; page: string; setPage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cf = config.couleurFond;
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const liens = [
    ['accueil', 'Accueil'],
    ['modules-page', 'Formations'],
    ['formateurs-page', 'Formateurs'],
    ['tarifs-page', 'Tarifs'],
    ['contact-page', 'Contact'],
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? `rgba(5,8,22,0.95)` : 'rgba(5,8,22,.85)',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? `1px solid rgba(0,212,255,0.1)` : 'none',
      transition: 'all .4s', padding: '0 40px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, position: 'relative', flexShrink: 0 }}>
            <Gear size={32} teeth={8} couleur={cc} vitesse={6} />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: '#fff' }}>
            {config.nomEcole.split(/(?=[A-Z])/).map((part, i) => (
              <span key={i} style={{ color: i === 0 ? '#fff' : cc }}>{part}</span>
            ))}
          </span>
        </div>

        {/* Liens desktop */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {liens.map(([id, label]) => (
            <button key={id} className={`fw-nav-link${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <button className="fw-btn-primary" onClick={() => setPage('contact-page')} style={{ padding: '10px 22px', fontSize: 13 }}>
          <span>Commencer gratuitement →</span>
        </button>
      </div>
    </nav>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigFormationWeb; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const cf = config.couleurFond;
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;
  const [typedText, setTypedText] = useState('');
  const fullText = '> Votre avenir en tech commence ici_';

  // Effet typing
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 55);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{
      background: cf, minHeight: '100vh', position: 'relative',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 68,
    }}>
      {/* Grille de points en arrière-plan */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(0,212,255,0.15) 1px, transparent 1px)`,
        backgroundSize: '40px 40px', opacity: 0.5,
      }} />

      {/* Gradients de lumière */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '70%', background: `radial-gradient(ellipse, ${cv}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '40%', height: '50%', background: `radial-gradient(ellipse, ${cc}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Contenu principal */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 60, alignItems: 'center', width: '100%' }}>
          {/* Texte gauche */}
          <div>
            {/* Terminal line */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: cc,
              marginBottom: 24, background: 'rgba(0,212,255,0.06)', border: `1px solid ${cc}30`,
              borderRadius: 8, padding: '10px 16px', display: 'inline-block', animation: 'fadeInUp .6s ease both',
            }}>
              {typedText}<span className="cursor-blink" style={{ color: cc }}>|</span>
            </div>

            <h1 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(40px, 6vw, 76px)',
              fontWeight: 800, color: '#fff', lineHeight: 1.05,
              marginBottom: 12, letterSpacing: '-0.02em',
              animation: 'fadeInUp .8s .1s ease both',
            }}>
              {config.tagline}<br />
              <span className="gradient-text">{config.sousTagline}</span>
            </h1>

            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 16,
              color: 'rgba(255,255,255,0.6)', lineHeight: 1.9,
              marginBottom: 40, maxWidth: 480,
              animation: 'fadeInUp .8s .2s ease both',
            }}>
              {config.descriptionCourte}
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'fadeInUp .8s .3s ease both' }}>
              <button className="fw-btn-primary" onClick={() => setPage('modules-page')}>
                <span>Voir les formations →</span>
              </button>
              <button className="fw-btn-outline" onClick={() => setPage('contact-page')}>
                Essai gratuit
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 36, animation: 'fadeInUp .8s .4s ease both' }}>
              <div style={{ display: 'flex' }}>
                {['🧑‍💻', '👩‍💻', '🧑‍💻', '👩‍💻'].map((e, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${cc}40, ${cv}40)`, border: `2px solid ${cf}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: i > 0 ? -8 : 0 }}>{e}</div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Rejoignez <span style={{ color: cc, fontWeight: 700 }}>2,400+</span> diplômés
              </p>
            </div>
          </div>

          {/* Engrenages animés droite — composition 360° */}
          <div style={{ position: 'relative', height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Engrenage central grand */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
              <Gear size={200} teeth={18} couleur={cv} vitesse={15} />
            </div>
            {/* Engrenage haut-droite */}
            <div style={{ position: 'absolute', top: '8%', right: '12%' }}>
              <Gear size={100} teeth={10} couleur={cc} vitesse={7} reverse />
            </div>
            {/* Engrenage bas-gauche */}
            <div style={{ position: 'absolute', bottom: '8%', left: '8%' }}>
              <Gear size={120} teeth={12} couleur={cc} vitesse={9} reverse />
            </div>
            {/* Petit engrenage haut-gauche */}
            <div style={{ position: 'absolute', top: '15%', left: '15%' }}>
              <Gear size={65} teeth={7} couleur={cv} vitesse={5} />
            </div>
            {/* Petit engrenage bas-droite */}
            <div style={{ position: 'absolute', bottom: '15%', right: '5%' }}>
              <Gear size={80} teeth={9} couleur={cv} vitesse={6} reverse />
            </div>
            {/* Très petit, milieu-haut */}
            <div style={{ position: 'absolute', top: '35%', right: '5%' }}>
              <Gear size={45} teeth={6} couleur={cc} vitesse={3} />
            </div>
            {/* Code snippet flottant */}
            <div style={{
              position: 'absolute', bottom: '25%', right: '2%',
              background: 'rgba(13,18,36,0.9)', border: `1px solid ${cc}30`,
              borderRadius: 10, padding: '12px 16px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: cc, animation: 'float 4s ease-in-out infinite',
              backdropFilter: 'blur(10px)',
            }}>
              <span style={{ color: cv }}>const</span>{' '}
              <span style={{ color: '#fff' }}>avenir</span>{' = '}
              <span style={{ color: '#10b981' }}>'brillant'</span>
            </div>
            {/* Label tournant */}
            <div style={{
              position: 'absolute', top: '42%', left: '32%',
              width: 140, height: 140,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'float 6s ease-in-out infinite .5s',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8 }}>
                  POWERED BY
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {config.nomEcole}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bande d'engrenages miroir */}
      <GearBand config={config} />
    </section>
  );
}

// ─── SECTION STATS ─────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigFormationWeb }) {
  const rv = useReveal(0.1);
  const cc = config.couleurCyan;
  const stats = ea(config.stats, CONFIG_WEB_DEFAUT.stats);

  const parseNum = (v: string) => parseInt(v.replace(/[^0-9]/g, '')) || 0;
  const c0 = useCounter(parseNum(stats[0]?.valeur || '0'), rv.vis);
  const c1 = useCounter(parseNum(stats[1]?.valeur || '0'), rv.vis);
  const c2 = useCounter(parseNum(stats[2]?.valeur || '0'), rv.vis);
  const c3 = useCounter(parseNum(stats[3]?.valeur || '0'), rv.vis);
  const counters = [c0, c1, c2, c3];
  const suffix = (v: string) => v.replace(/[0-9,]/g, '');

  return (
    <section style={{ background: config.couleurFond, padding: '80px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            textAlign: 'center', padding: '32px 20px',
            borderLeft: i > 0 ? '1px solid rgba(0,212,255,0.1)' : 'none',
            position: 'relative',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icone}</div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: cc, lineHeight: 1, marginBottom: 8 }}>
              {counters[i]}{suffix(s.valeur)}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION TECHNOLOGIES ─────────────────────────────────────────────────────

function SectionTechno({ config }: { config: ConfigFormationWeb }) {
  const rv = useReveal(0.05);
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;
  const techs = ea(config.technologies, CONFIG_WEB_DEFAUT.technologies);

  return (
    <section style={{ background: '#08101f', padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>
            // stack technique
          </p>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14 }}>
            Technologies que vous <span className="gradient-text">maîtriserez</span>
          </h2>
        </div>

        {/* Grille technologies */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {techs.map((t, i) => (
            <div key={i} style={{
              background: config.couleurCarte, border: '1px solid rgba(0,212,255,0.1)',
              borderRadius: 12, padding: '20px 12px', textAlign: 'center',
              transition: 'all .3s', cursor: 'default',
              animationDelay: `${i * 0.05}s`,
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = cc;
                el.style.transform = 'translateY(-4px) scale(1.04)';
                el.style.boxShadow = `0 8px 28px ${cc}20`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'rgba(0,212,255,0.1)';
                el.style.transform = 'none';
                el.style.boxShadow = 'none';
              }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icone}</div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{t.nom}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION MODULES ──────────────────────────────────────────────────────────

function SectionModules({ config, setPage }: { config: ConfigFormationWeb; setPage: (p: string) => void }) {
  const rv = useReveal(0.05);
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;
  const modules = ea(config.modules, CONFIG_WEB_DEFAUT.modules);
  const [actif, setActif] = useState<number | null>(null);

  const niveauClass = (n: string) => {
    if (n === 'Débutant') return 'badge-debutant';
    if (n === 'Intermédiaire') return 'badge-intermediaire';
    return 'badge-avance';
  };

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>// modules</p>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Votre parcours d'<span className="gradient-text">apprentissage</span>
            </h2>
          </div>
          <button className="fw-btn-outline" onClick={() => setPage('modules-page')}>Tout voir →</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {modules.map((m, i) => (
            <div key={i} className="fw-card" onClick={() => setActif(actif === i ? null : i)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36, filter: `drop-shadow(0 0 8px ${cc}60)` }}>{m.icone}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={niveauClass(m.niveau)}>{m.niveau}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>⏱ {m.duree}</span>
                </div>
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{m.titre}</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 16 }}>{m.description}</p>

              {/* Sujets — s'étendent au clic */}
              <div style={{ maxHeight: actif === i ? 200 : 0, overflow: 'hidden', transition: 'max-height .4s ease' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(0,212,255,0.1)' }}>
                  {m.sujets.map((s, j) => (
                    <span key={j} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '4px 10px', background: `${cc}12`, border: `1px solid ${cc}25`, borderRadius: 20, color: cc }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 14, color: cc, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 4 }}>
                {actif === i ? '↑ Masquer les sujets' : '↓ Voir les sujets'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FORMATEURS ───────────────────────────────────────────────────────

function SectionFormateurs({ config }: { config: ConfigFormationWeb }) {
  const rv = useReveal(0.05);
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;
  const formateurs = ea(config.formateurs, CONFIG_WEB_DEFAUT.formateurs);

  return (
    <section style={{ background: '#08101f', padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>// team</p>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Formateurs <span className="gradient-text">experts</span> en activité
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(formateurs.length, 3)}, 1fr)`, gap: 24 }}>
          {formateurs.map((f, i) => (
            <div key={i} className="fw-card-violet" style={{ textAlign: 'center' }}>
              {/* Photo */}
              <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 20px' }}>
                <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${cv}50` }}>
                  <img src={f.photo} alt={f.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* Petit engrenage décoratif */}
                <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
                  <Gear size={28} teeth={6} couleur={cc} vitesse={5} />
                </div>
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{f.nom}</h3>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: cc, marginBottom: 16, letterSpacing: '0.05em' }}>{f.titre}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 20 }}>{f.bio}</p>
              {/* Compétences */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {f.competences.map((comp, j) => (
                  <span key={j} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: '3px 8px', background: `${cv}15`, border: `1px solid ${cv}30`, borderRadius: 4, color: '#a78bfa' }}>{comp}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION TÉMOIGNAGES ──────────────────────────────────────────────────────

function SectionTemoignages({ config }: { config: ConfigFormationWeb }) {
  const rv = useReveal(0.05);
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;
  const temos = ea(config.temoignages, CONFIG_WEB_DEFAUT.temoignages);
  const [actif, setActif] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActif(a => (a + 1) % temos.length), 5000);
    return () => clearInterval(id);
  }, [temos.length]);

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>// testimonials</p>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Ils ont <span className="gradient-text">transformé</span> leur carrière
          </h2>
        </div>

        {/* Carrousel */}
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -20, left: 20, fontSize: 80, color: cc, opacity: 0.15, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>"</div>

          {temos.map((t, i) => (
            <div key={i} style={{
              display: i === actif ? 'block' : 'none',
              background: config.couleurCarte, border: `1px solid ${cc}20`,
              borderRadius: 20, padding: '40px 48px',
              animation: 'fadeInUp .5s ease',
            }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: 28, fontStyle: 'italic' }}>
                {t.texte}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img src={t.photo} alt={t.auteur} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cc}50` }} />
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>{t.auteur}</p>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: cc }}>
                    {t.role}{t.entreprise ? ` @ ${t.entreprise}` : ''}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {[...Array(t.note)].map((_, j) => <span key={j} style={{ color: '#fbbf24', fontSize: 16 }}>★</span>)}
                </div>
              </div>
            </div>
          ))}

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {temos.map((_, i) => (
              <button key={i} onClick={() => setActif(i)} style={{
                width: i === actif ? 28 : 8, height: 8, borderRadius: 4,
                border: 'none', cursor: 'pointer',
                background: i === actif ? cc : 'rgba(255,255,255,0.2)',
                transition: 'all .3s',
              }} />
            ))}
          </div>
        </div>

        {/* Mini cards côtés */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 48 }}>
          {temos.map((t, i) => (
            <div key={i} onClick={() => setActif(i)} className="fw-card" style={{ cursor: 'pointer', padding: '16px 20px', opacity: actif === i ? 1 : 0.5, borderColor: actif === i ? `${cc}50` : 'rgba(0,212,255,0.12)', transition: 'all .3s' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 8 }}>
                "{t.texte.slice(0, 60)}..."
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc }}>{t.auteur}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FORMULES ─────────────────────────────────────────────────────────

function SectionFormules({ config, setPage }: { config: ConfigFormationWeb; setPage: (p: string) => void }) {
  const rv = useReveal(0.05);
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;
  const formules = ea(config.formules, CONFIG_WEB_DEFAUT.formules);

  return (
    <section style={{ background: '#08101f', padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>// pricing</p>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Choisissez votre <span className="gradient-text">formule</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(formules.length, 3)}, 1fr)`, gap: 20, alignItems: 'start' }}>
          {formules.map((f, i) => (
            <div key={i} style={{
              background: config.couleurCarte,
              border: `1px solid ${f.populaire ? cc : 'rgba(0,212,255,0.12)'}`,
              borderRadius: 20, padding: '32px 28px',
              position: 'relative', overflow: 'hidden',
              transform: f.populaire ? 'scale(1.04)' : 'none',
              boxShadow: f.populaire ? `0 20px 60px ${cc}20` : 'none',
              transition: 'transform .3s, box-shadow .3s',
            }}>
              {/* Badge populaire */}
              {f.populaire && (
                <div style={{
                  position: 'absolute', top: 16, right: -28,
                  background: `linear-gradient(135deg, ${cc}, ${cv})`,
                  color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                  padding: '4px 40px', transform: 'rotate(45deg)', letterSpacing: '0.1em',
                }}>POPULAIRE</div>
              )}
              {/* Glow décoration */}
              {f.populaire && (
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: `radial-gradient(circle, ${cc}20, transparent)`, pointerEvents: 'none' }} />
              )}

              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                {f.nom}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{f.prix}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{f.periode}</span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>{f.description}</p>

              <div style={{ height: 1, background: `${cc}20`, marginBottom: 24 }} />

              <ul style={{ listStyle: 'none', marginBottom: 28 }}>
                {f.inclus.map((item, j) => (
                  <li key={j} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: cc, fontSize: 14, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                className={f.populaire ? 'fw-btn-primary' : 'fw-btn-outline'}
                onClick={() => setPage('contact-page')}
                style={{ width: '100%', textAlign: 'center' }}>
                <span>Commencer →</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FAQ ──────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigFormationWeb }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cc = config.couleurCyan;
  const faq = ea(config.faq, CONFIG_WEB_DEFAUT.faq);
  const [ouvert, setOuvert] = useState<number | null>(null);

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>// faq</p>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Questions <span className="gradient-text">fréquentes</span>
          </h2>
        </div>

        <div>
          {faq.map((f, i) => (
            <div key={i} className="faq-item">
              <button className="faq-btn" onClick={() => setOuvert(ouvert === i ? null : i)}>
                <span>{f.question}</span>
                <span style={{ color: cc, fontSize: 20, flexShrink: 0, transition: 'transform .3s', transform: ouvert === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </button>
              <div style={{ overflow: 'hidden', maxHeight: ouvert === i ? '300px' : '0', transition: 'max-height .4s ease' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, paddingBottom: 24 }}>
                  {f.reponse}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigFormationWeb }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;
  const horaires = ea(config.horaires, CONFIG_WEB_DEFAUT.horaires);

  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '', formule: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ecole: config.nomEcole, type: 'contact-formation-web', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ background: '#08101f', padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: cc, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>// contact</p>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Commençons <span className="gradient-text">ensemble</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: isMobile ? 24 : 60 }}>
          {/* Infos */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
              {[
                { icone: '📍', label: 'Adresse', valeur: `${config.adresse}, ${config.ville}` },
                { icone: '✉️', label: 'Courriel', valeur: config.email },
                { icone: '📞', label: 'Téléphone', valeur: config.telephone },
              ].map((info, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${cc}15`, border: `1px solid ${cc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {info.icone}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{info.label}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{info.valeur}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Horaires */}
            <div style={{ background: config.couleurCarte, border: `1px solid ${cc}15`, borderRadius: 12, padding: '20px 22px', marginBottom: 28 }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>Heures de support</p>
              {horaires.map((h, i) => (
                <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{h}</p>
              ))}
            </div>

            {/* Réseaux */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { key: 'github', label: 'GitHub', icone: '🐙' },
                { key: 'discord', label: 'Discord', icone: '💬' },
                { key: 'linkedin', label: 'LinkedIn', icone: '💼' },
                { key: 'twitter', label: 'Twitter', icone: '🐦' },
              ].map(({ key, label, icone }) => config.reseaux?.[key as keyof typeof config.reseaux] ? (
                <a key={key} href={config.reseaux[key as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                  style={{ width: 40, height: 40, borderRadius: 10, background: config.couleurCarte, border: `1px solid ${cc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none', transition: 'all .2s' }}
                  title={label}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = cc; (e.currentTarget as HTMLAnchorElement).style.background = `${cc}15`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `${cc}20`; (e.currentTarget as HTMLAnchorElement).style.background = config.couleurCarte; }}>
                  {icone}
                </a>
              ) : null)}
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ background: config.couleurCarte, border: `1px solid ${cc}15`, borderRadius: 20, padding: '40px 36px' }}>
            {envoye ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 20 }}>🚀</div>
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Message envoyé!</h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: cc }}>
                  {'> Nous vous répondrons sous 24h_'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>NOM *</label>
                    <input className="fw-input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Votre nom" />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>EMAIL *</label>
                    <input type="email" className="fw-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.ca" />
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>FORMULE D'INTÉRÊT</label>
                  <select className="fw-input" value={form.formule} onChange={e => setForm({ ...form, formule: e.target.value })} style={{ cursor: 'pointer' }}>
                    <option value="">Sélectionner...</option>
                    {ea(config.formules, CONFIG_WEB_DEFAUT.formules).map((f, i) => (
                      <option key={i} value={f.nom}>{f.nom} — {f.prix}{f.periode}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>SUJET</label>
                  <input className="fw-input" value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} placeholder="Votre sujet" />
                </div>
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, display: 'block', marginBottom: 8, letterSpacing: '0.1em' }}>MESSAGE *</label>
                  <textarea className="fw-input" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Décrivez votre situation, vos objectifs..." style={{ resize: 'none' }} />
                </div>
              <button disabled={loading || !form.nom || !form.email || !form.message}
                  style={{ opacity: !form.nom || !form.email || !form.message ? 0.5 : 1 }}>
                  <span>{loading ? '⏳ Envoi...' : '🚀 Envoyer mon message'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigFormationWeb; setPage: (p: string) => void }) {
  const cc = config.couleurCyan;
  const cv = config.couleurViolet;

  return (
    <footer style={{ background: '#030612', borderTop: `1px solid rgba(0,212,255,0.08)`, padding: '60px 40px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
        {/* Logo + desc */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Gear size={26} teeth={7} couleur={cc} vitesse={6} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: '#fff' }}>
              {config.nomEcole}
            </span>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, maxWidth: 280 }}>
            {config.descriptionCourte}
          </p>
        </div>
        {/* Navigation */}
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Navigation</p>
          {[['accueil', 'Accueil'], ['modules-page', 'Formations'], ['formateurs-page', 'Formateurs'], ['tarifs-page', 'Tarifs']].map(([id, label]) => (
            <p key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = cc}
              onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.45)'}>
              {label}
            </p>
          ))}
        </div>
        {/* Formations */}
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cv, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Formations</p>
          {ea(config.modules, CONFIG_WEB_DEFAUT.modules).slice(0, 4).map((m, i) => (
            <p key={i} onClick={() => setPage('modules-page')} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = '#a78bfa'}
              onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.45)'}>
              {m.titre}
            </p>
          ))}
        </div>
        {/* Contact */}
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: cc, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Contact</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{config.email}</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>{config.telephone}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'github', icone: '🐙' },
              { key: 'discord', icone: '💬' },
              { key: 'linkedin', icone: '💼' },
            ].map(({ key, icone }) => config.reseaux?.[key as keyof typeof config.reseaux] ? (
              <a key={key} href={config.reseaux[key as keyof typeof config.reseaux]} target="_blank" rel="noreferrer"
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(0,212,255,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, textDecoration: 'none', transition: 'all .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = cc}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,212,255,0.15)'}>
                {icone}
              </a>
            ) : null)}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} {config.nomEcole} — Tous droits réservés
        </p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>
          {'// Propulsé par e-Vend Studio'}
        </p>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateFormationWebProps {
  config?: Partial<ConfigFormationWeb>;
  isPreview?: boolean;
}

export default function TemplateFormationWeb({ config: partiel, isPreview }: TemplateFormationWebProps) {
  // Valider couleurs — ce template est sombre (#050816), ignorer configs claires
  const estFondSombre = (hex?: string): boolean => {
    if (!hex || typeof hex !== 'string') return false;
    const h = hex.replace('#', '');
    if (h.length < 6) return false;
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return (r*299 + g*587 + b*114)/1000 < 80;
  };
  const fondValide = estFondSombre(partiel?.couleurFond);

  const config: ConfigFormationWeb = {
    ...CONFIG_WEB_DEFAUT,
    ...partiel,
    couleurFond:   fondValide ? (partiel?.couleurFond   || CONFIG_WEB_DEFAUT.couleurFond)   : CONFIG_WEB_DEFAUT.couleurFond,
    couleurCarte:  fondValide ? (partiel?.couleurCarte  || CONFIG_WEB_DEFAUT.couleurCarte)  : CONFIG_WEB_DEFAUT.couleurCarte,
    couleurCyan:   partiel?.couleurCyan   || CONFIG_WEB_DEFAUT.couleurCyan,
    couleurViolet: partiel?.couleurViolet || CONFIG_WEB_DEFAUT.couleurViolet,
  };

  // Validation IDs sections
  const VALID_IDS_WEB = ['hero', 'stats', 'techno', 'modules', 'formateurs', 'temoignages', 'formules', 'faq', 'contact'];
  const rawSections = ea(partiel?.sections, CONFIG_WEB_DEFAUT.sections);
  config.sections = rawSections.every(s => VALID_IDS_WEB.includes(s.id)) ? rawSections : CONFIG_WEB_DEFAUT.sections;

  config.stats       = ea(partiel?.stats,       CONFIG_WEB_DEFAUT.stats);
  config.technologies= ea(partiel?.technologies, CONFIG_WEB_DEFAUT.technologies);
  config.modules     = ea(partiel?.modules,      CONFIG_WEB_DEFAUT.modules);
  config.formateurs  = ea(partiel?.formateurs,   CONFIG_WEB_DEFAUT.formateurs);
  config.temoignages = ea(partiel?.temoignages,  CONFIG_WEB_DEFAUT.temoignages);
  config.formules    = ea(partiel?.formules,      CONFIG_WEB_DEFAUT.formules);
  config.faq         = ea(partiel?.faq,           CONFIG_WEB_DEFAUT.faq);
  config.horaires    = ea(partiel?.horaires,      CONFIG_WEB_DEFAUT.horaires);

  const [page, setPage] = useState('accueil');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handlePage = (p: string) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} />;
      case 'stats':       return <SectionStats       config={config} />;
      case 'techno':      return <SectionTechno      config={config} />;
      case 'modules':     return <SectionModules     config={config} setPage={handlePage} />;
      case 'formateurs':  return <SectionFormateurs  config={config} />;
      case 'temoignages': return <SectionTemoignages config={config} />;
      case 'formules':    return <SectionFormules    config={config} setPage={handlePage} />;
      case 'faq':         return <SectionFAQ         config={config} />;
      case 'contact':     return <SectionContact     config={config} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0 }}>
      <style>{GLOBAL_STYLE}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 68 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'modules-page' && (<><SectionModules config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'formateurs-page' && (<><SectionFormateurs config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'tarifs-page' && (<><SectionFormules config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page' && (<><SectionContact config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}