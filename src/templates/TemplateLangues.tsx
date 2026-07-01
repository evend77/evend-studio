// src/templates/TemplateLangues.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template Cours de Langues
// Style : fond blanc/crème, accents violet #4F46E5 et orange #F97316
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours & formation

import React, { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface Langue {
  nom: string;        // 'Anglais', 'Français', 'Espagnol', etc.
  icone: string;      // drapeau ou emoji
  couleur: string;
  actif: boolean;
}

export interface Professeur {
  nom: string;
  prenom: string;
  langue: string;
  bio: string;
  photo: string;
  diplome: string;
  actif: boolean;
}

export interface Formule {
  titre: string;
  description: string;
  prix: string;
  icone: string;
  couleur: string;
  caracteristiques: string[];
  actif: boolean;
}

export interface Evenement {
  titre: string;
  date: string;
  langue: string;
  type: 'webinaire' | 'atelier' | 'meetup';
  lienRSVP: string;
  actif: boolean;
}

export interface Article {
  titre: string;
  date: string;
  extrait: string;
  image: string;
  lien: string;
  actif: boolean;
}

export interface FAQItem {
  question: string;
  reponse: string;
  actif: boolean;
}

export interface PourquoiItem {
  titre: string;
  description: string;
  icone: string;
  couleur: string;
  actif: boolean;
}

export interface ConfigLangues {
  // Identité
  nomEcole: string;
  slogan: string;
  heroTitre: string;
  heroSousTitre: string;
  
  // Photos/Vidéo
  heroType: 'photo' | 'video';
  heroPhoto: string;
  heroVideo: string;      // URL vidéo (max 5 sec recommandé)
  photoDefaut: string;
  
  // Couleurs
  couleurPrimaire: string;      // #4F46E5 violet
  couleurSecondaire: string;    // #F97316 orange
  couleurFond: string;          // #FAFAFA blanc cassé
  couleurTexte: string;         // #1A1A2E
  
  // Stats
  stats: { valeur: number; label: string; icone: string }[];
  
  // Langues enseignées
  langues: Langue[];
  
  // Formules
  formules: Formule[];
  
  // Professeurs
  professeurs: Professeur[];
  
  // Pourquoi nous
  pourquoiItems: PourquoiItem[];
  
  // Événements
  evenements: Evenement[];
  
  // Articles blog
  articles: Article[];
  
  // FAQ
  faq: FAQItem[];
  
  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];
  coordGoogleMaps: string;
  reseaux: { facebook?: string; twitter?: string; youtube?: string; instagram?: string; linkedin?: string };
  
  // Footer
  descFooter: string;
  
  // Newsletter
  newsletterActif: boolean;
  newsletterTexte: string;
  
  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

// ─── CONFIG PAR DÉFAUT ───────────────────────────────────────────────────────

export const CONFIG_LANGUES_DEFAUT: ConfigLangues = {
  nomEcole: 'LinguaMaster',
  slogan: 'PARLEZ AVEC CONFIANCE',
  heroTitre: 'Maîtrisez une nouvelle langue',
  heroSousTitre: 'Cours en ligne avec des professeurs certifiés. Méthode immersive pour des résultats rapides.',
  
  heroType: 'video',
  heroPhoto: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1600',
  heroVideo: 'https://player.vimeo.com/external/434045267.sd.mp4?s=8c3cc6a4f3ef4b3f9a5f5e2a3b4c5d6e&profile_id=164',
  photoDefaut: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
  
  couleurPrimaire: '#4F46E5',
  couleurSecondaire: '#F97316',
  couleurFond: '#FAFAFA',
  couleurTexte: '#1A1A2E',
  
  stats: [
    { valeur: 15280, label: 'Étudiants formés', icone: '👨‍🎓' },
    { valeur: 45, label: 'Professeurs experts', icone: '👩‍🏫' },
    { valeur: 12, label: 'Langues enseignées', icone: '🌍' },
    { valeur: 98, label: 'Taux de satisfaction', icone: '⭐' },
  ],
  
  langues: [
    { nom: 'Anglais', icone: '🇬🇧', couleur: '#3B82F6', actif: true },
    { nom: 'Français', icone: '🇫🇷', couleur: '#2563EB', actif: true },
    { nom: 'Espagnol', icone: '🇪🇸', couleur: '#F59E0B', actif: true },
    { nom: 'Allemand', icone: '🇩🇪', couleur: '#DC2626', actif: true },
    { nom: 'Chinois', icone: '🇨🇳', couleur: '#EF4444', actif: true },
    { nom: 'Italien', icone: '🇮🇹', couleur: '#10B981', actif: true },
    { nom: 'Japonais', icone: '🇯🇵', couleur: '#EC4899', actif: true },
    { nom: 'Coréen', icone: '🇰🇷', couleur: '#8B5CF6', actif: true },
  ],
  
  formules: [
    {
      titre: 'Cours en Groupe',
      description: 'Apprenez en petit groupe (max 6 pers.) pour progresser ensemble.',
      prix: '249$',
      icone: '👥',
      couleur: '#4F46E5',
      caracteristiques: ['Max 6 étudiants', '2h par semaine', 'Matériel inclus', 'Certificat'],
      actif: true,
    },
    {
      titre: 'Cours Particuliers',
      description: 'Cours 1-to-1 adapté à votre rythme et vos objectifs personnels.',
      prix: '499$',
      icone: '🎯',
      couleur: '#F97316',
      caracteristiques: ['Horaires flexibles', 'Programme personnalisé', 'Suivi hebdo', 'Certificat'],
      actif: true,
    },
    {
      titre: 'Vidéos à la demande',
      description: 'Accès illimité à notre bibliothèque de cours vidéo.',
      prix: '99$',
      icone: '📹',
      couleur: '#10B981',
      caracteristiques: ['+500 leçons', 'Exercices interactifs', 'Accès 1 an', 'Certificat'],
      actif: true,
    },
  ],
  
  professeurs: [
    {
      nom: 'Martin',
      prenom: 'Sophie',
      langue: 'Français',
      bio: 'Professeure certifiée avec 10 ans d\'expérience. Spécialiste en phonétique.',
      photo: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=400',
      diplome: 'Master FLE - Sorbonne',
      actif: true,
    },
    {
      nom: 'Johnson',
      prenom: 'Michael',
      langue: 'Anglais',
      bio: 'Native speaker de Londres. Expertise en conversation et business english.',
      photo: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
      diplome: 'TEFL Certified',
      actif: true,
    },
    {
      nom: 'García',
      prenom: 'Elena',
      langue: 'Espagnol',
      bio: 'De Madrid. Spécialiste en espagnol latino-américain et européen.',
      photo: 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=400',
      diplome: 'Instituto Cervantes',
      actif: true,
    },
    {
      nom: 'Wei',
      prenom: 'Li',
      langue: 'Chinois',
      bio: 'Pékin native. Expert en prononciation des tons et calligraphie.',
      photo: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=400',
      diplome: 'HSK Advanced',
      actif: true,
    },
  ],
  
  pourquoiItems: [
    {
      titre: 'Professeurs natifs',
      description: 'Tous nos enseignants sont de langue maternelle et certifiés.',
      icone: '🌍',
      couleur: '#4F46E5',
      actif: true,
    },
    {
      titre: 'Petits groupes',
      description: 'Maximum 6 étudiants par classe pour une attention personnalisée.',
      icone: '👥',
      couleur: '#F97316',
      actif: true,
    },
    {
      titre: 'Méthode immersive',
      description: 'Pratique dès le premier cours. Oubliez la grammaire ennuyeuse.',
      icone: '🎭',
      couleur: '#10B981',
      actif: true,
    },
    {
      titre: 'Suivi personnalisé',
      description: 'Évaluations régulières et feedback détaillé de votre progression.',
      icone: '📊',
      couleur: '#EC4899',
      actif: true,
    },
    {
      titre: 'Certificat officiel',
      description: 'Attestation de niveau reconnue à la fin de chaque formation.',
      icone: '🏆',
      couleur: '#F59E0B',
      actif: true,
    },
    {
      titre: 'Accès à vie',
      description: 'Révisez quand vous voulez avec nos ressources en ligne.',
      icone: '💎',
      couleur: '#8B5CF6',
      actif: true,
    },
  ],
  
  evenements: [
    {
      titre: 'Webinaire : Maîtriser la prononciation anglaise',
      date: '2026-07-15T18:00:00',
      langue: 'Anglais',
      type: 'webinaire',
      lienRSVP: '#',
      actif: true,
    },
    {
      titre: 'Atelier : Conversation en espagnol (niveau intermédiaire)',
      date: '2026-07-20T14:00:00',
      langue: 'Espagnol',
      type: 'atelier',
      lienRSVP: '#',
      actif: true,
    },
    {
      titre: 'Meetup : Cercle de lecture chinois',
      date: '2026-07-25T10:00:00',
      langue: 'Chinois',
      type: 'meetup',
      lienRSVP: '#',
      actif: true,
    },
  ],
  
  articles: [
    {
      titre: 'La méthode immersive : apprendre comme un enfant',
      date: '2026-04-17',
      extrait: 'Découvrez pourquoi l\'immersion totale est la méthode la plus efficace pour parler couramment.',
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600',
      lien: '#',
      actif: true,
    },
    {
      titre: '5 raisons d\'apprendre une nouvelle langue en 2026',
      date: '2026-04-10',
      extrait: 'Opportunités professionnelles, ouverture culturelle et bienfaits cognitifs.',
      image: 'https://images.pexels.com/photos/4144224/pexels-photo-4144224.jpeg?auto=compress&cs=tinysrgb&w=600',
      lien: '#',
      actif: true,
    },
    {
      titre: 'Le chinois : mythes et réalités',
      date: '2026-04-03',
      extrait: 'Le chinois n\'est pas plus difficile qu\'une autre langue avec la bonne méthode.',
      image: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?auto=compress&cs=tinysrgb&w=600',
      lien: '#',
      actif: true,
    },
  ],
  
  faq: [
    {
      question: 'Quel niveau faut-il pour commencer ?',
      reponse: 'Tous les niveaux sont acceptés, du débutant complet (A0) à l\'avancé (C1). Nous faisons un test de placement gratuit avant de commencer.',
      actif: true,
    },
    {
      question: 'Comment se déroulent les cours en ligne ?',
      reponse: 'Les cours se font via Zoom ou Google Meet. Vous recevez un lien de connexion avant chaque session.',
      actif: true,
    },
    {
      question: 'Puis-je annuler ou reporter un cours ?',
      reponse: 'Oui, vous pouvez annuler jusqu\'à 24h à l\'avance sans frais. Sinon, le cours est débité.',
      actif: true,
    },
    {
      question: 'Un certificat est-il délivré ?',
      reponse: 'Oui, à la fin de chaque module, vous recevez un certificat de niveau officiel.',
      actif: true,
    },
  ],
  
  adresse: '123 rue des Langues',
  ville: 'Montréal, QC H2X 1X4',
  telephone: '(514) 555-0123',
  email: 'bonjour@linguamaster.ca',
  horaires: ['Lun – Ven : 9h – 21h', 'Samedi : 10h – 16h', 'Dimanche : Fermé'],
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',
  reseaux: { facebook: '#', twitter: '#', instagram: '#', linkedin: '#', youtube: '#' },
  
  descFooter: 'LinguaMaster - Votre partenaire pour maîtriser les langues du monde. Méthode immersive, professeurs natifs, résultats garantis.',
  
  newsletterActif: true,
  newsletterTexte: 'Recevez nos conseils gratuits pour apprendre une langue',
  
  sections: [
    { id: 'hero',        actif: true,  ordre: 1, label: 'Hero (accueil)' },
    { id: 'langues',     actif: true,  ordre: 2, label: 'Langues enseignées' },
    { id: 'formules',    actif: true,  ordre: 3, label: 'Formules' },
    { id: 'professeurs', actif: true,  ordre: 4, label: 'Nos professeurs' },
    { id: 'pourquoi',    actif: true,  ordre: 5, label: 'Pourquoi nous' },
    { id: 'evenements',  actif: true,  ordre: 6, label: 'Événements' },
    { id: 'blog',        actif: true,  ordre: 7, label: 'Blog / Actualités' },
    { id: 'faq',         actif: true,  ordre: 8, label: 'FAQ' },
    { id: 'newsletter',  actif: true,  ordre: 9, label: 'Newsletter' },
    { id: 'contact',     actif: true,  ordre: 10, label: 'Contact & Carte' },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function ea<T>(val: any, def: T[]): T[] {
  return Array.isArray(val) && val.length > 0 ? val : def;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigLangues; page: string; setPage: (p: string) => void }) {
  const p = config.couleurPrimaire;
  const s = config.couleurSecondaire;

  const liens = [
    ['accueil', 'ACCUEIL'],
    ['formules-page', 'FORMULES'],
    ['profs-page', 'PROFESSEURS'],
    ['blog-page', 'BLOG'],
    ['contact-page', 'CONTACT'],
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
        .nav-langues-link {
          font-family:'Outfit',sans-serif; font-size:13px; font-weight:600;
          letter-spacing:0.08em; cursor:pointer; background:none; border:none;
          padding:0 20px; color:rgba(26,26,46,0.7); transition:color .2s;
          position:relative; height:100%; display:flex; align-items:center;
        }
        .nav-langues-link:hover { color:${p}; }
        .nav-langues-link.active { color:${p}; border-bottom:2px solid ${p}; }
        .btn-langues {
          background:${p}; color:#fff; border:none; padding:12px 28px;
          font-family:'Outfit',sans-serif; font-size:13px; font-weight:700;
          border-radius:40px; cursor:pointer; transition:all .2s;
          letter-spacing:0.02em;
        }
        .btn-langues:hover { background:${s}; transform:translateY(-2px); box-shadow:0 8px 20px ${p}40; }
        .btn-langues-outline {
          background:transparent; color:${p}; border:2px solid ${p}; padding:10px 26px;
          font-family:'Outfit',sans-serif; font-size:13px; font-weight:700;
          border-radius:40px; cursor:pointer; transition:all .2s;
        }
        .btn-langues-outline:hover { background:${p}; color:#fff; }
        .langue-badge {
          transition:all .2s; cursor:pointer; backdrop-filter:blur(8px);
        }
        .langue-badge:hover { transform:translateY(-3px) scale(1.02); }
        .card-formule {
          transition:all .3s cubic-bezier(0.2,0.9,0.4,1.1);
        }
        .card-formule:hover { transform:translateY(-8px); }
        .rv { opacity:0; transform:translateY(32px); transition:opacity .7s ease,transform .7s ease; }
        .rv.vis { opacity:1; transform:translateY(0); }
        .rv-l { opacity:0; transform:translateX(-36px); transition:opacity .7s ease,transform .7s ease; }
        .rv-l.vis { opacity:1; transform:translateX(0); }
        .rv-r { opacity:0; transform:translateX(36px); transition:opacity .7s ease,transform .7s ease; }
        .rv-r.vis { opacity:1; transform:translateX(0); }
        .counter-num { font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; }
      `}</style>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, background: `linear-gradient(135deg, ${p}, ${s})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {config.nomEcole.slice(0, 2)}
            </span>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700, color: config.couleurTexte, letterSpacing: '0.02em' }}>
              {config.nomEcole}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {liens.map(([id, label]) => (
              <button key={id} className={`nav-langues-link${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>
                {label}
              </button>
            ))}
            <button className="btn-langues" onClick={() => setPage('formules-page')} style={{ marginLeft: 16 }}>
              ESSAI GRATUIT
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── SECTION STATS AVEC COMPTEURS ANIMÉS ─────────────────────────────────────

function StatsSection({ config }: { config: ConfigLangues }) {
  const { ref, vis } = useReveal(0.3);
  const [counters, setCounters] = useState(config.stats.map(() => 0));

  useEffect(() => {
    if (!vis) return;
    config.stats.forEach((stat, i) => {
      let start = 0;
      const end = stat.valeur;
      const duration = 2000;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCounters(prev => { const newC = [...prev]; newC[i] = end; return newC; });
          clearInterval(timer);
        } else {
          setCounters(prev => { const newC = [...prev]; newC[i] = Math.floor(start); return newC; });
        }
      }, 16);
      return () => clearInterval(timer);
    });
  }, [vis]);

  if (config.stats.length === 0) return null;

  return (
    <section style={{ background: `linear-gradient(135deg, ${config.couleurPrimaire}08, ${config.couleurSecondaire}08)`, padding: '60px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${Math.min(config.stats.length, 4)}, 1fr)`, gap: 40, textAlign: 'center' }}>
        {config.stats.map((stat, i) => (
          <div key={i}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>{stat.icone}</div>
            <div className="counter-num" style={{ fontSize: 42, fontWeight: 800, color: config.couleurPrimaire, fontFamily: "'Outfit', sans-serif" }}>
              {counters[i].toLocaleString()}+
            </div>
            <div style={{ fontSize: 14, color: 'rgba(26,26,46,0.6)', fontWeight: 500, marginTop: 8 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION HERO ────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigLangues; setPage: (p: string) => void }) {
  const p = config.couleurPrimaire;
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section style={{ background: config.couleurFond, minHeight: '85vh', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 70 }}>
      {/* Média de fond */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {config.heroType === 'video' && config.heroVideo ? (
          <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} onLoadedData={() => setVideoLoaded(true)}>
            <source src={config.heroVideo} type="video/mp4" />
          </video>
        ) : (
          <img src={config.heroPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)' }} />
      </div>

      {/* Contenu */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1400, margin: '0 auto', padding: '80px 60px', color: '#fff' }}>
        <p className="rv" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: config.couleurSecondaire, marginBottom: 20 }}>
          {config.slogan}
        </p>
        <h1 className="rv" style={{ fontSize: 'clamp(42px, 8vw, 72px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", lineHeight: 1.1, marginBottom: 20, maxWidth: 600 }}>
          {config.heroTitre}
        </h1>
        <p className="rv" style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', maxWidth: 500, lineHeight: 1.6, marginBottom: 32 }}>
          {config.heroSousTitre}
        </p>
        <div className="rv" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn-langues" onClick={() => setPage('formules-page')}>COURS GRATUIT</button>
          <button className="btn-langues-outline" onClick={() => setPage('contact-page')} style={{ background: 'transparent', borderColor: '#fff', color: '#fff' }}>
            NOUS CONTACTER
          </button>
        </div>
      </div>

      {/* Stats flottantes en bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}>
        <StatsSection config={config} />
      </div>
    </section>
  );
}

// ─── SECTION LANGUES ENSEIGNÉES ──────────────────────────────────────────────

function SectionLangues({ config }: { config: ConfigLangues }) {
  const p = config.couleurPrimaire;
  const { ref, vis } = useReveal(0.1);
  const languesActives = ea(config.langues, CONFIG_LANGUES_DEFAUT.langues).filter(l => l.actif);

  if (languesActives.length === 0) return null;

  return (
    <section style={{ background: config.couleurFond, padding: '80px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 12 }}>NOS LANGUES</p>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte, marginBottom: 48 }}>
          Apprenez la langue de votre choix
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
          {languesActives.map(langue => (
            <div key={langue.nom} className="langue-badge" style={{
              padding: '12px 28px',
              background: `linear-gradient(135deg, ${langue.couleur}15, ${langue.couleur}08)`,
              borderRadius: 60,
              border: `1px solid ${langue.couleur}30`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: 28 }}>{langue.icone}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: config.couleurTexte }}>{langue.nom}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FORMULES ────────────────────────────────────────────────────────

function SectionFormules({ config, setPage }: { config: ConfigLangues; setPage: (p: string) => void }) {
  const p = config.couleurPrimaire;
  const { ref, vis } = useReveal(0.1);
  const formulesActives = ea(config.formules, CONFIG_LANGUES_DEFAUT.formules).filter(f => f.actif);

  if (formulesActives.length === 0) return null;

  return (
    <section style={{ background: '#fff', padding: '80px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 12 }}>NOS FORMULES</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte }}>
            Choisissez votre méthode
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30 }}>
          {formulesActives.map((formule, i) => (
            <div key={i} className="card-formule" style={{
              background: '#fff',
              borderRadius: 28,
              padding: '32px 28px',
              border: `1px solid ${formule.couleur}20`,
              boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
              textAlign: 'center',
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{formule.icone}</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte, marginBottom: 8 }}>{formule.titre}</h3>
              <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.6)', lineHeight: 1.5, marginBottom: 20 }}>{formule.description}</p>
              <div style={{ fontSize: 32, fontWeight: 800, color: formule.couleur, marginBottom: 20 }}>{formule.prix}</div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20, marginBottom: 24 }}>
                {formule.caracteristiques.map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: 'rgba(26,26,46,0.7)' }}>
                    <span style={{ color: formule.couleur }}>✓</span> {c}
                  </div>
                ))}
              </div>
              <button className="btn-langues" onClick={() => setPage('contact-page')} style={{ width: '100%' }}>
                Je m'inscris
              </button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button className="btn-langues-outline" onClick={() => setPage('contact-page')}>
            Cours d'essai gratuit de 30 min →
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION PROFESSEURS ─────────────────────────────────────────────────────

function SectionProfesseurs({ config }: { config: ConfigLangues }) {
  const p = config.couleurPrimaire;
  const { ref, vis } = useReveal(0.1);
  const profsActifs = ea(config.professeurs, CONFIG_LANGUES_DEFAUT.professeurs).filter(p => p.actif);

  if (profsActifs.length === 0) return null;

  return (
    <section style={{ background: config.couleurFond, padding: '80px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 12 }}>NOTRE ÉQUIPE</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte }}>
            Des professeurs passionnés
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(26,26,46,0.6)', maxWidth: 600, margin: '16px auto 0' }}>
            Tous natifs, certifiés et expérimentés pour vous guider vers la fluidité.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
          {profsActifs.map((prof, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: 180, height: 180, margin: '0 auto 20px',
                borderRadius: '50%', overflow: 'hidden',
                border: `4px solid ${p}20`,
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              }}>
                <img src={prof.photo} alt={prof.prenom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: config.couleurTexte }}>{prof.prenom} {prof.nom}</h3>
              <p style={{ fontSize: 13, color: p, fontWeight: 600, marginBottom: 8 }}>{prof.langue}</p>
              <p style={{ fontSize: 12, color: 'rgba(26,26,46,0.5)', marginBottom: 4 }}>{prof.diplome}</p>
              <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.7)', lineHeight: 1.5, marginTop: 12 }}>{prof.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION POURQUOI NOUS ───────────────────────────────────────────────────

function SectionPourquoi({ config }: { config: ConfigLangues }) {
  const p = config.couleurPrimaire;
  const { ref, vis } = useReveal(0.1);
  const itemsActifs = ea(config.pourquoiItems, CONFIG_LANGUES_DEFAUT.pourquoiItems).filter(i => i.actif);

  if (itemsActifs.length === 0) return null;

  return (
    <section style={{ background: '#fff', padding: '80px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 12 }}>NOS ATOUTS</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte }}>
            Pourquoi nous choisir ?
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {itemsActifs.map((item, i) => (
            <div key={i} style={{
              padding: '28px',
              background: `${item.couleur}05`,
              borderRadius: 24,
              border: `1px solid ${item.couleur}15`,
              transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icone}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: config.couleurTexte, marginBottom: 8 }}>{item.titre}</h3>
              <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.6)', lineHeight: 1.6 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION ÉVÉNEMENTS ─────────────────────────────────────────────────────

function SectionEvenements({ config }: { config: ConfigLangues }) {
  const p = config.couleurPrimaire;
  const { ref, vis } = useReveal(0.1);
  const eventsActifs = ea(config.evenements, CONFIG_LANGUES_DEFAUT.evenements).filter(e => e.actif);

  if (eventsActifs.length === 0) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  const typeIcone: Record<string, string> = { webinaire: '🎥', atelier: '✏️', meetup: '🤝' };

  return (
    <section style={{ background: `linear-gradient(135deg, ${p}05, transparent)`, padding: '80px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 12 }}>À VENIR</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte }}>
            Événements gratuits
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eventsActifs.map((event, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 16,
              padding: '20px 28px',
              background: '#fff',
              borderRadius: 20,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 32 }}>{typeIcone[event.type] || '📅'}</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: config.couleurTexte }}>{event.titre}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.5)' }}>{formatDate(event.date)} · {event.langue}</p>
                </div>
              </div>
              <button className="btn-langues-outline" onClick={() => window.open(event.lienRSVP, '_blank')} style={{ padding: '8px 24px', fontSize: 12 }}>
                S'inscrire gratuitement
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION BLOG ────────────────────────────────────────────────────────────

function SectionBlog({ config, setPage }: { config: ConfigLangues; setPage: (p: string) => void }) {
  const p = config.couleurPrimaire;
  const { ref, vis } = useReveal(0.1);
  const articlesActifs = ea(config.articles, CONFIG_LANGUES_DEFAUT.articles).filter(a => a.actif).slice(0, 3);

  if (articlesActifs.length === 0) return null;

  return (
    <section style={{ background: config.couleurFond, padding: '80px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 8 }}>BLOG & ACTUALITÉS</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte }}>
              Conseils pour progresser
            </h2>
          </div>
          <button className="btn-langues-outline" onClick={() => setPage('blog-page')} style={{ fontSize: 12, padding: '10px 24px' }}>
            Voir tous les articles →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30 }}>
          {articlesActifs.map((article, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              transition: 'transform 0.3s',
              cursor: 'pointer',
            }} onClick={() => window.open(article.lien, '_blank')}>
              <div style={{ height: 200, overflow: 'hidden' }}>
                <img src={article.image} alt={article.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.4)', marginBottom: 8 }}>{new Date(article.date).toLocaleDateString('fr-FR')}</p>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: config.couleurTexte, marginBottom: 8, lineHeight: 1.4 }}>{article.titre}</h3>
                <p style={{ fontSize: 13, color: 'rgba(26,26,46,0.6)', lineHeight: 1.5 }}>{article.extrait}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FAQ ─────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigLangues }) {
  const p = config.couleurPrimaire;
  const { ref, vis } = useReveal(0.1);
  const faqActifs = ea(config.faq, CONFIG_LANGUES_DEFAUT.faq).filter(f => f.actif);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (faqActifs.length === 0) return null;

  return (
    <section style={{ background: '#fff', padding: '80px 40px' }}>
      <div ref={ref} className={`rv ${vis ? 'vis' : ''}`} style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 12 }}>QUESTIONS FRÉQUENTES</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte }}>
            Vous avez des questions ?
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqActifs.map((item, i) => (
            <div key={i} style={{
              borderBottom: '1px solid #f0f0f0',
            }}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: '100%', padding: '20px 0', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 16, fontWeight: 600, color: config.couleurTexte, fontFamily: 'inherit',
                }}>
                {item.question}
                <span style={{ fontSize: 20, color: p }}>{openIndex === i ? '−' : '+'}</span>
              </button>
              {openIndex === i && (
                <p style={{ padding: '0 0 20px 0', fontSize: 14, color: 'rgba(26,26,46,0.6)', lineHeight: 1.6 }}>
                  {item.reponse}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION NEWSLETTER ──────────────────────────────────────────────────────

function SectionNewsletter({ config }: { config: ConfigLangues }) {
  const { isMobile } = useIsMobile();
  const p = config.couleurPrimaire;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!config.newsletterActif) return null;

  const handleSubmit = async () => {
    try {
      await fetch('/api/studio/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'langues', vendeur_id: config.vendeurId || 0 }),
      });
      setSubscribed(true);
    } catch { setSubscribed(true); }
  };

  return (
    <section style={{ background: `linear-gradient(135deg, ${p}, ${config.couleurSecondaire})`, padding: '60px 40px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 12 }}>
          {config.newsletterTexte}
        </h2>
        <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 28 }}>
          Recevez nos astuces hebdomadaires et restez informé de nos événements gratuits.
        </p>
        {subscribed ? (
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: 60 }}>
            ✅ Merci ! Vérifiez votre boîte mail pour confirmer.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              style={{
                padding: '14px 24px',
                borderRadius: 60,
                border: 'none',
                width: '280px',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button onClick={handleSubmit} style={{
              padding: '14px 32px',
              borderRadius: 60,
              border: 'none',
              background: '#fff',
              color: p,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}>
              Je m'abonne
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ─────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigLangues }) {
  const { isMobile } = useIsMobile();
  const p = config.couleurPrimaire;
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const horaires = ea(config.horaires, CONFIG_LANGUES_DEFAUT.horaires);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ecole: config.nomEcole, type: 'contact-langues', vendeur_id: config.vendeurId || 0 }),
      });
      setEnvoye(true); // handled by hook
    } catch {}
    setLoading(false);
  };

  return (
    <section style={{ background: config.couleurFond, padding: '80px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: p, marginBottom: 8 }}>CONTACTEZ-NOUS</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: config.couleurTexte }}>
            Une question ? On vous répond
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 60 }}>
          {/* Infos */}
          <div>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: config.couleurTexte, marginBottom: 16 }}>📍 Nos coordonnées</h3>
              <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.6)', marginBottom: 8 }}>{config.adresse}</p>
              <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.6)', marginBottom: 8 }}>{config.ville}</p>
              <p style={{ fontSize: 14, color: p, fontWeight: 500, marginTop: 12 }}>{config.telephone}</p>
              <p style={{ fontSize: 14, color: p }}>{config.email}</p>
            </div>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: config.couleurTexte, marginBottom: 16 }}>🕒 Horaires d'ouverture</h3>
              {horaires.map((h, i) => (
                <p key={i} style={{ fontSize: 14, color: 'rgba(26,26,46,0.6)', marginBottom: 6 }}>{h}</p>
              ))}
            </div>
            <div style={{ height: 280, borderRadius: 16, overflow: 'hidden' }}>
              <iframe src={config.coordGoogleMaps} width="100%" height="100%" style={{ border: 0, filter: 'grayscale(0.3)' }} allowFullScreen loading="lazy" />
            </div>
          </div>

          {/* Formulaire */}
          <div>
            {envoye ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: config.couleurTexte }}>Message envoyé !</h3>
                <p style={{ fontSize: 14, color: 'rgba(26,26,46,0.5)' }}>Nous vous répondrons sous 24h.</p>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 24, padding: '32px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: 20 }}>
                  <input className="input-langues" placeholder="Votre nom *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = p} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <input type="email" className="input-langues" placeholder="Votre email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <input className="input-langues" placeholder="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <textarea rows={4} placeholder="Votre message *" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              <button disabled={loading || !form.nom || !form.email || !form.message}
                  style={{ width: '100%', padding: '14px', opacity: !form.nom || !form.email || !form.message ? 0.6 : 1 }}>
                  {loading ? 'ENVOI...' : 'ENVOYER LE MESSAGE'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigLangues; setPage: (p: string) => void }) {
  const p = config.couleurPrimaire;

  return (
    <footer style={{ background: '#111', padding: '48px 40px 32px', color: 'rgba(255,255,255,0.7)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 22, fontWeight: 800, background: `linear-gradient(135deg, ${p}, ${config.couleurSecondaire})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {config.nomEcole.slice(0, 2)}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{config.nomEcole}</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{config.descFooter}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries(config.reseaux).filter(([, url]) => url && url !== '#').map(([res, url]) => {
              const icons: Record<string, string> = { facebook: '📘', twitter: '🐦', instagram: '📸', linkedin: '🔗', youtube: '📺' };
              return (
                <a key={res} href={url} target="_blank" rel="noreferrer" style={{
                  width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  textDecoration: 'none', transition: 'background 0.2s',
                }} onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = p}
                   onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'}>
                  {icons[res] || '🔗'}
                </a>
              );
            })}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '0.08em' }}>NAVIGATION</p>
          {[['accueil', 'Accueil'], ['formules-page', 'Formules'], ['profs-page', 'Professeurs'], ['blog-page', 'Blog'], ['contact-page', 'Contact']].map(([id, label]) => (
            <p key={id} onClick={() => setPage(id)} style={{ fontSize: 13, marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}
               onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = p}
               onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.6)'}>
              {label}
            </p>
          ))}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '0.08em' }}>CONTACT</p>
          <p style={{ fontSize: 13, marginBottom: 6 }}>{config.telephone}</p>
          <p style={{ fontSize: 13, marginBottom: 6 }}>{config.email}</p>
          <p style={{ fontSize: 13, lineHeight: 1.5 }}>{config.adresse}<br />{config.ville}</p>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '0.08em' }}>SUIVEZ-NOUS</p>
          <button className="btn-langues-outline" onClick={() => setPage('contact-page')} style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.3)', color: '#fff', marginBottom: 12 }}>
            Essai gratuit
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        © {new Date().getFullYear()} {config.nomEcole} — Propulsé par e-Vend Studio
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────

export interface TemplateLanguesProps {
  config?: Partial<ConfigLangues>;
  isPreview?: boolean;
}

export default function TemplateLangues({ config: partiel, isPreview }: TemplateLanguesProps) {
  // Valider les couleurs — si le fond est sombre (< luminance 80) on ignore
  // car ce template est clair (fond blanc/crème)
  const estCouleurClaire = (hex?: string): boolean => {
    if (!hex || typeof hex !== 'string') return false;
    const h = hex.replace('#', '');
    if (h.length < 6) return false;
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return (r*299 + g*587 + b*114)/1000 > 150;
  };
  const fondValide = estCouleurClaire(partiel?.couleurFond);

  const config: ConfigLangues = {
    ...CONFIG_LANGUES_DEFAUT,
    ...partiel,
    // Si fond sombre vient d'un autre template → garder les couleurs par défaut
    couleurFond:       fondValide ? (partiel?.couleurFond       || CONFIG_LANGUES_DEFAUT.couleurFond)       : CONFIG_LANGUES_DEFAUT.couleurFond,
    couleurPrimaire:   fondValide ? (partiel?.couleurPrimaire   || CONFIG_LANGUES_DEFAUT.couleurPrimaire)   : CONFIG_LANGUES_DEFAUT.couleurPrimaire,
    couleurSecondaire: fondValide ? (partiel?.couleurSecondaire || CONFIG_LANGUES_DEFAUT.couleurSecondaire) : CONFIG_LANGUES_DEFAUT.couleurSecondaire,
    couleurTexte:      fondValide ? (partiel?.couleurTexte      || CONFIG_LANGUES_DEFAUT.couleurTexte)      : CONFIG_LANGUES_DEFAUT.couleurTexte,
  };
  config.langues = ea(partiel?.langues, CONFIG_LANGUES_DEFAUT.langues);
  config.formules = ea(partiel?.formules, CONFIG_LANGUES_DEFAUT.formules);
  config.professeurs = ea(partiel?.professeurs, CONFIG_LANGUES_DEFAUT.professeurs);
  config.pourquoiItems = ea(partiel?.pourquoiItems, CONFIG_LANGUES_DEFAUT.pourquoiItems);
  config.evenements = ea(partiel?.evenements, CONFIG_LANGUES_DEFAUT.evenements);
  config.articles = ea(partiel?.articles, CONFIG_LANGUES_DEFAUT.articles);
  config.faq = ea(partiel?.faq, CONFIG_LANGUES_DEFAUT.faq);
  config.horaires = ea(partiel?.horaires, CONFIG_LANGUES_DEFAUT.horaires);
  // Valider que les sections correspondent à ce template
  const VALID_IDS_LANGUES = ['hero', 'langues', 'formules', 'professeurs', 'pourquoi', 'evenements', 'blog', 'faq', 'newsletter', 'contact'];
  const rawSectionsLangues = ea(partiel?.sections, CONFIG_LANGUES_DEFAUT.sections);
  config.sections = rawSectionsLangues.every((s: SectionConfig) => VALID_IDS_LANGUES.includes(s.id))
    ? rawSectionsLangues
    : CONFIG_LANGUES_DEFAUT.sections;

  const [page, setPage] = useState('accueil');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handlePage = (p: string) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero': return <SectionHero config={config} setPage={handlePage} />;
      case 'langues': return <SectionLangues config={config} />;
      case 'formules': return <SectionFormules config={config} setPage={handlePage} />;
      case 'professeurs': return <SectionProfesseurs config={config} />;
      case 'pourquoi': return <SectionPourquoi config={config} />;
      case 'evenements': return <SectionEvenements config={config} />;
      case 'blog': return <SectionBlog config={config} setPage={handlePage} />;
      case 'faq': return <SectionFAQ config={config} />;
      case 'newsletter': return <SectionNewsletter config={config} />;
      case 'contact': return <SectionContact config={config} />;
      default: return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 70 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'formules-page' && (<><SectionFormules config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'profs-page' && (<><SectionProfesseurs config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'blog-page' && (<><SectionBlog config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page' && (<><SectionContact config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}