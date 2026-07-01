// src/templates/TemplateCoachVie.tsx
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template Coach de Vie
// Style : fond sable profond / or cuivré #C9A96E + vert forêt #2C3E35
// Effets WOW : roue de transformation 4 piliers animée, spotlight souris hero,
//              compteur vies transformées, cartes programmes flip 3D,
//              particules étoiles ascendantes, citation morphing
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : Cours & Formation

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';

export interface SectionConfig { id: string; actif: boolean; ordre: number; label: string; }

export interface ProgrammeCoach {
  id: string; nom: string; emoji: string; description: string;
  duree: string; format: string; prix: string; inclus: string[];
  couleur: string; populaire?: boolean; photo: string;
}

export interface TemoignageCoach {
  texte: string; auteur: string; titre: string;
  photo: string; note: number; transformation: string;
}

export interface ConfigCoachVie {
  nomCoach: string; prenom: string; tagline: string; sousTagline: string;
  descriptionHero: string; descriptionAPropos: string;
  citation: string; auteurCitation: string; anneesExp: string;
  couleurFond: string; couleurOr: string; couleurVert: string;
  couleurSable: string; couleurSauge: string;
  vendeurId?: number;
  photoHero: string; photoAPropos: string; photoSignature: string;
  stats: { valeur: string; label: string; icone: string }[];
  piliers: { titre: string; description: string; icone: string; couleur: string }[];
  programmes: ProgrammeCoach[];
  temoignages: TemoignageCoach[];
  faq: { question: string; reponse: string }[];
  processus: { etape: string; titre: string; description: string }[];
  adresse: string; ville: string; telephone: string; email: string;
  calendlyUrl: string;
  reseaux: { instagram?: string; facebook?: string; linkedin?: string; youtube?: string };
  sections: SectionConfig[];
}

function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }

export const CONFIG_COACH_DEFAUT: ConfigCoachVie = {
  nomCoach: 'Leclair',
  prenom: 'Sophie',
  tagline: 'Transformez',
  sousTagline: 'Votre Vie.',
  descriptionHero: "Ensemble, nous allons clarifier votre vision, lever vos blocages et construire la vie qui vous ressemble vraiment. Pas de discours — de l'action, des résultats.",
  descriptionAPropos: "Après 12 ans dans le monde corporatif, j'ai tout quitté pour suivre mon appel profond : accompagner les êtres humains vers leur meilleur version. Aujourd'hui, j'ai guidé plus de 340 personnes à travers des transformations profondes et durables. Ma méthode allie neurosciences, pleine conscience et stratégie concrète.",
  citation: "Ce n'est pas ce qui vous arrive qui définit votre vie, c'est ce que vous en faites.",
  auteurCitation: 'Sophie Leclair',
  anneesExp: '12',
  couleurFond: '#F7F3EE',
  couleurOr: '#C9A96E',
  couleurVert: '#2C3E35',
  couleurSable: '#E8DDD0',
  couleurSauge: '#6B7B6E',
  photoHero: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos: 'https://images.pexels.com/photos/5325104/pexels-photo-5325104.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoSignature: 'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=900',
  stats: [
    { valeur: '340+', label: 'Vies transformées', icone: '✨' },
    { valeur: '12',   label: 'Ans d\'expérience', icone: '🌿' },
    { valeur: '94%',  label: 'Taux de satisfaction', icone: '⭐' },
    { valeur: '6',    label: 'Programmes distincts', icone: '🎯' },
  ],
  piliers: [
    { titre: 'Clarté', description: 'Définir votre vision et vos valeurs profondes pour savoir exactement où vous allez.', icone: '🔍', couleur: '#C9A96E' },
    { titre: 'Action', description: 'Passer de l\'intention à l\'exécution grâce à des outils concrets et une responsabilité partagée.', icone: '⚡', couleur: '#2C3E35' },
    { titre: 'Confiance', description: 'Dissoudre les blocages, croyances limitantes et peurs qui vous empêchent d\'avancer.', icone: '🌱', couleur: '#8B6F47' },
    { titre: 'Résultats', description: 'Mesurer vos progrès, célébrer vos victoires et ancrer vos nouvelles habitudes durablement.', icone: '🏆', couleur: '#6B7B6E' },
  ],
  programmes: [
    { id: 'decouverte', nom: 'Appel Découverte', emoji: '☕', description: 'Un entretien sans engagement pour explorer vos défis et voir si nous sommes faits pour travailler ensemble.', duree: '45 min', format: 'Vidéo / Téléphone', prix: 'Gratuit', inclus: ['Analyse de votre situation actuelle', 'Identification de vos blocages majeurs', 'Présentation des options'], couleur: '#C9A96E', photo: 'https://images.pexels.com/photos/4491461/pexels-photo-4491461.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'essentiel', nom: 'Programme Essentiel', emoji: '🌱', description: 'Un accompagnement de 3 mois pour poser les bases solides de votre transformation personnelle.', duree: '3 mois', format: '6 séances individuelles', prix: '1 200$', inclus: ['6 séances de 60 min', 'Support WhatsApp 5j/7', 'Outils & exercices personnalisés', 'Accès à la bibliothèque de ressources'], couleur: '#2C3E35', photo: 'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'transformation', nom: 'Transformation Totale', emoji: '🦋', description: 'Mon programme signature sur 6 mois — une métamorphose complète de votre vie professionnelle et personnelle.', duree: '6 mois', format: '12 séances + groupe', prix: '2 800$', inclus: ['12 séances individuelles', 'Accès groupe privé', 'Support illimité', 'Retraite coaching 1 journée', 'Garantie résultats'], couleur: '#8B6F47', populaire: true, photo: 'https://images.pexels.com/photos/3768911/pexels-photo-3768911.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: 'vip', nom: 'Journée VIP Intensive', emoji: '💫', description: 'Une journée entière dédiée à vous — pour débloquer une situation, prendre une décision ou lancer votre projet.', duree: '1 journée', format: 'Présentiel ou virtuel', prix: '1 500$', inclus: ['7h d\'accompagnement intensif', 'Rapport de session détaillé', 'Plan d\'action 90 jours', 'Suivi 30 jours post-journée'], couleur: '#C9A96E', photo: 'https://images.pexels.com/photos/5325104/pexels-photo-5325104.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ],
  temoignages: [
    { texte: "En 6 mois avec Sophie, j'ai quitté un emploi qui m'étouffait, lancé mon entreprise et retrouvé une joie de vivre que j'avais perdue depuis des années. Cette expérience m'a littéralement sauvé.", auteur: 'Marc Thibodeau', titre: 'Entrepreneur, Montréal', photo: 'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=400', note: 5, transformation: 'Reconversion professionnelle' },
    { texte: "J'avais essayé plusieurs coachs avant Sophie. La différence? Elle ne te donne pas des réponses génériques — elle t'aide à trouver TES réponses. Trois mois plus tard, j'ai enfin osé demander la promotion que je méritais depuis 2 ans.", auteur: 'Élodie Beaumont', titre: 'Directrice marketing', photo: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400', note: 5, transformation: 'Confiance & leadership' },
    { texte: "La Journée VIP a été la meilleure décision de ma vie. En 7 heures, on a démonté des années de blocages et j'ai un plan d'action clair. Sophie est incroyablement perspicace et bienveillante.", auteur: 'Jean-François Cyr', titre: 'Médecin', photo: 'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=400', note: 5, transformation: 'Équilibre vie personnelle/pro' },
  ],
  faq: [
    { question: 'Comment savoir si le coaching est fait pour moi?', reponse: "Le coaching est idéal si vous traversez une transition importante, vous sentez bloqué malgré vos efforts, cherchez plus de clarté ou souhaitez accélérer votre croissance. L'appel découverte gratuit est le meilleur moyen de le savoir." },
    { question: 'Combien de temps avant de voir des résultats?', reponse: "La plupart de mes clients ressentent un premier déclic dès la 2e ou 3e séance. Des changements concrets et durables s'installent généralement entre le 1er et le 3e mois. Chaque parcours est unique." },
    { question: 'Les séances se déroulent comment?', reponse: "En vidéo (Zoom ou Teams) ou par téléphone, selon votre préférence. Les séances durent 60 minutes et sont structurées mais adaptées à ce dont vous avez besoin ce jour-là." },
    { question: 'Puis-je annuler ou reporter?', reponse: "Oui, avec un préavis de 48 heures. Je comprends que la vie est imprévisible. La flexibilité fait partie de mon approche." },
    { question: 'Offrez-vous un paiement en plusieurs fois?', reponse: "Absolument. Des plans de paiement mensuels sont disponibles pour tous les programmes. On en discute lors de l'appel découverte." },
  ],
  processus: [
    { etape: '01', titre: 'Appel Découverte', description: 'On se rencontre 45 min pour explorer vos défis et confirmer que nous sommes le bon match.' },
    { etape: '02', titre: 'Plan Personnalisé', description: 'Je construis un programme sur mesure aligné avec vos objectifs et votre rythme de vie.' },
    { etape: '03', titre: 'Accompagnement', description: 'Séances régulières, outils, support continu — vous avancez, je suis là à chaque étape.' },
    { etape: '04', titre: 'Transformation', description: 'Vous vivez la vie qui vous ressemble. Les résultats s\'installent et perdurent.' },
  ],
  adresse: '1234 rue Saint-Denis',
  ville: 'Montréal, QC',
  telephone: '(514) 555-0198',
  email: 'sophie@sophieleclair.com',
  calendlyUrl: '#',
  reseaux: { instagram: '#', facebook: '#', linkedin: '#', youtube: '#' },
  sections: [
    { id: 'hero',        actif: true,  ordre: 1,  label: 'Hero' },
    { id: 'stats',       actif: true,  ordre: 2,  label: 'Statistiques' },
    { id: 'piliers',     actif: true,  ordre: 3,  label: 'Les 4 Piliers' },
    { id: 'programmes',  actif: true,  ordre: 4,  label: 'Programmes' },
    { id: 'processus',   actif: true,  ordre: 5,  label: 'Processus' },
    { id: 'apropos',     actif: true,  ordre: 6,  label: 'À propos' },
    { id: 'temoignages', actif: true,  ordre: 7,  label: 'Témoignages' },
    { id: 'faq',         actif: true,  ordre: 8,  label: 'FAQ' },
    { id: 'contact',     actif: true,  ordre: 9,  label: 'Contact' },
  ],
};

// ─── STYLES GLOBAUX ─────────────────────────────────────────────────────────

function getStyle(c: ConfigCoachVie) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: ${c.couleurFond}; }
    .coach-btn-or {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 32px; border-radius: 50px;
      background: ${c.couleurOr}; color: #fff; border: none;
      font-family: 'Lato', sans-serif; font-size: 15px; font-weight: 700;
      cursor: pointer; letter-spacing: 0.04em;
      transition: all 0.3s; box-shadow: 0 4px 20px ${c.couleurOr}40;
    }
    .coach-btn-or:hover { transform: translateY(-2px); box-shadow: 0 8px 30px ${c.couleurOr}60; background: #b8904d; }
    .coach-btn-vide {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 30px; border-radius: 50px;
      background: transparent; color: ${c.couleurVert}; border: 2px solid ${c.couleurVert};
      font-family: 'Lato', sans-serif; font-size: 15px; font-weight: 600;
      cursor: pointer; letter-spacing: 0.04em; transition: all 0.3s;
    }
    .coach-btn-vide:hover { background: ${c.couleurVert}; color: #fff; transform: translateY(-2px); }
    @keyframes coach-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes coach-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes coach-counter { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes coach-star-rise { 0%{opacity:0;transform:translateY(0) scale(0)} 20%{opacity:1;transform:translateY(-30px) scale(1)} 100%{opacity:0;transform:translateY(-120px) scale(0.3)} }
    @keyframes coach-reveal { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    @keyframes coach-morph { 0%,100%{opacity:1} 45%{opacity:0} 55%{opacity:0} }
    @keyframes coach-pulse-ring { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
    @keyframes coach-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    .coach-card-hover { transition: all 0.35s; }
    .coach-card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.12) !important; }
  `;
}

// ─── NAV ────────────────────────────────────────────────────────────────────

function Nav({ config, setPage }: { config: ConfigCoachVie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [scroll, setScroll] = useState(false);
  const [menu, setMenu] = useState(false);
  const co = config.couleurOr;
  const cv = config.couleurVert;

  useEffect(() => {
    const fn = () => setScroll(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const liens = [
    { label: 'Accueil', id: 'accueil' },
    { label: 'Piliers', id: 'piliers' },
    { label: 'Programmes', id: 'programmes' },
    { label: 'À propos', id: 'apropos' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: scroll ? 'rgba(247,243,238,0.96)' : `rgba(44,63,53,0.85)`, backdropFilter: 'blur(12px)', borderBottom: scroll ? '1px solid rgba(201,169,110,0.2)' : '1px solid rgba(201,169,110,0.15)', transition: 'all 0.4s', padding: isMobile ? '14px 20px' : '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: scroll ? cv : '#fff', letterSpacing: '0.02em' }}>
          {config.prenom} <span style={{ color: co }}>{config.nomCoach}</span>
        </div>
        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, color: scroll ? config.couleurSauge : 'rgba(255,255,255,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 1 }}>Coach de Vie</div>
      </div>

      {isMobile ? (
        <>
          <button onClick={() => setMenu(!menu)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: scroll ? cv : '#fff' }}>
            {menu ? '✕' : '☰'}
          </button>
          {menu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(247,243,238,0.98)', backdropFilter: 'blur(12px)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 4, borderBottom: `2px solid ${co}` }}>
              {liens.map(l => (
                <button key={l.id} onClick={() => { setPage(l.id); setMenu(false); }} style={{ background: 'none', border: 'none', padding: '12px 16px', textAlign: 'left', fontFamily: "'Lato', sans-serif", fontSize: 15, color: cv, cursor: 'pointer', borderRadius: 8, fontWeight: 600 }}>
                  {l.label}
                </button>
              ))}
              <button onClick={() => { setPage('contact'); setMenu(false); }} className="coach-btn-or" style={{ marginTop: 8 }}>
                Appel découverte gratuit
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {liens.map(l => (
            <button key={l.id} onClick={() => setPage(l.id)} style={{ background: 'none', border: 'none', fontFamily: "'Lato', sans-serif", fontSize: 14, color: scroll ? cv : '#fff', cursor: 'pointer', fontWeight: 600, letterSpacing: '0.04em', transition: 'color 0.2s', padding: '4px 0', borderBottom: '2px solid transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = co; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = scroll ? cv : '#fff'; }}>
              {l.label}
            </button>
          ))}
          <button onClick={() => setPage('contact')} className="coach-btn-or" style={{ padding: '10px 22px', fontSize: 13 }}>
            ☕ Appel gratuit
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── SECTION HERO ───────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigCoachVie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const [citIdx, setCitIdx] = useState(0);
  const co = config.couleurOr;
  const cv = config.couleurVert;

  const citations = [
    { texte: config.tagline, sub: config.sousTagline },
    { texte: 'Osez', sub: 'Votre potentiel.' },
    { texte: 'Créez', sub: 'Votre avenir.' },
  ];

  // Rotation citation
  useEffect(() => {
    const t = setInterval(() => setCitIdx(i => (i + 1) % citations.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Étoiles montantes
  useEffect(() => {
    const add = () => {
      const id = Date.now();
      setStars(s => [...s.slice(-12), { id, x: Math.random() * 100, y: 80 + Math.random() * 20, delay: 0 }]);
      setTimeout(() => setStars(s => s.filter(st => st.id !== id)), 3000);
    };
    const t = setInterval(add, 600);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setSpotlight({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }, [isMobile]);

  return (
    <section onMouseMove={handleMouseMove} style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden', background: cv }}>
      {/* Photo de fond */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHero})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25 }} />

      {/* Spotlight */}
      {!isMobile && (
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle 400px at ${spotlight.x}% ${spotlight.y}%, rgba(201,169,110,0.15) 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 0.1s' }} />
      )}

      {/* Dégradé */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cv}ee 0%, ${cv}99 50%, ${cv}cc 100%)` }} />

      {/* Étoiles */}
      {stars.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, fontSize: 12, animation: 'coach-star-rise 3s ease-out forwards', pointerEvents: 'none', zIndex: 1 }}>✨</div>
      ))}

      {/* Roue décorative */}
      {!isMobile && (
        <div style={{ position: 'absolute', right: -80, top: '50%', transform: 'translateY(-50%)', width: 500, height: 500, opacity: 0.06, animation: 'coach-spin-slow 30s linear infinite' }}>
          <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
            <circle cx="100" cy="100" r="90" stroke={co} strokeWidth="1" fill="none" />
            <circle cx="100" cy="100" r="60" stroke={co} strokeWidth="0.5" fill="none" />
            <circle cx="100" cy="100" r="30" stroke={co} strokeWidth="0.5" fill="none" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
              <line key={a} x1="100" y1="100" x2={100 + 90 * Math.cos((a * Math.PI) / 180)} y2={100 + 90 * Math.sin((a * Math.PI) / 180)} stroke={co} strokeWidth="0.5" />
            ))}
          </svg>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', padding: isMobile ? '100px 24px 60px' : '140px 48px 80px', width: '100%' }}>
        <div style={{ maxWidth: 700 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${co}22`, border: `1px solid ${co}44`, borderRadius: 50, padding: '6px 18px', marginBottom: 28 }}>
            <span style={{ fontSize: 11 }}>🌿</span>
            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: co, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coach Certifiée ICF</span>
          </div>

          {/* Titre morphing */}
          <div style={{ marginBottom: 8, height: isMobile ? 80 : 100, overflow: 'hidden' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 52 : 80, fontWeight: 700, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              {citations[citIdx].texte}
            </h1>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 52 : 80, fontWeight: 400, color: co, fontStyle: 'italic', lineHeight: 1.05, marginBottom: 28, letterSpacing: '-0.02em' }}>
            {citations[citIdx].sub}
          </h1>

          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: isMobile ? 16 : 19, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, maxWidth: 560, marginBottom: 40 }}>
            {config.descriptionHero}
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setPage('contact')} className="coach-btn-or" style={{ fontSize: isMobile ? 14 : 16 }}>
              ☕ Appel découverte — Gratuit
            </button>
            <button onClick={() => setPage('programmes')} className="coach-btn-vide" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 14 : 16 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.5)'; }}>
              Voir les programmes →
            </button>
          </div>

          {/* Preuve sociale */}
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex' }}>
              {[config.photoHero, config.photoAPropos, config.photoSignature].map((p, i) => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${co}`, backgroundImage: `url(${p})`, backgroundSize: 'cover', backgroundPosition: 'center', marginLeft: i ? -10 : 0 }} />
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#fff', fontWeight: 700 }}>{'★'.repeat(5)}</div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>340+ clients transformés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'coach-float 2s ease-in-out infinite' }}>
        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: `${co}80`, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Découvrir</div>
        <div style={{ width: 1, height: 30, background: `linear-gradient(to bottom, ${co}, transparent)` }} />
      </div>
    </section>
  );
}

// ─── SECTION STATS ──────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigCoachVie }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurOr;
  const cv = config.couleurVert;

  return (
    <section style={{ background: co, padding: isMobile ? '48px 24px' : '60px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 24 : 0 }}>
        {config.stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: isMobile ? '16px 0' : '0 32px', borderRight: !isMobile && i < config.stats.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none' }}>
            <div style={{ fontSize: isMobile ? 28 : 20, marginBottom: 6 }}>{s.icone}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 42, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.valeur}</div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 6, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION PILIERS (Roue animée) ──────────────────────────────────────────

function SectionPiliers({ config }: { config: ConfigCoachVie }) {
  const { isMobile } = useIsMobile();
  const [actif, setActif] = useState(0);
  const co = config.couleurOr;
  const cv = config.couleurVert;
  const cf = config.couleurFond;

  // Auto-rotation
  useEffect(() => {
    const t = setInterval(() => setActif(i => (i + 1) % config.piliers.length), 2800);
    return () => clearInterval(t);
  }, [config.piliers.length]);

  const pilier = config.piliers[actif];

  return (
    <section style={{ background: cf, padding: isMobile ? '64px 24px' : '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 64 }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Ma Méthode</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 48, fontWeight: 700, color: cv, marginBottom: 16 }}>Les 4 Piliers de la Transformation</h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 17, color: config.couleurSauge, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Une approche complète et intégrée pour une transformation qui dure.
          </p>
        </div>

        {isMobile ? (
          /* Mobile : cartes verticales */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {config.piliers.map((p, i) => (
              <div key={i} onClick={() => setActif(i)} style={{ background: actif === i ? cv : '#fff', borderRadius: 16, padding: '20px 24px', border: `2px solid ${actif === i ? cv : config.couleurSable}`, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: actif === i ? co : config.couleurSable, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{p.icone}</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: actif === i ? '#fff' : cv, marginBottom: 4 }}>{p.titre}</div>
                  {actif === i && <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop : roue SVG centrale + détail */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            {/* Roue interactive */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 300 300" style={{ width: 360, height: 360 }}>
                {config.piliers.map((p, i) => {
                  const angle = (i * 360) / config.piliers.length;
                  const rad = (angle * Math.PI) / 180;
                  const r = 110;
                  const cx = 150 + r * Math.sin(rad);
                  const cy = 150 - r * Math.cos(rad);
                  const isActif = actif === i;
                  return (
                    <g key={i} onClick={() => setActif(i)} style={{ cursor: 'pointer' }}>
                      {/* Ligne vers centre */}
                      <line x1="150" y1="150" x2={cx} y2={cy} stroke={isActif ? co : config.couleurSable} strokeWidth={isActif ? 2 : 1} strokeDasharray={isActif ? 'none' : '4 4'} style={{ transition: 'all 0.3s' }} />
                      {/* Cercle pilier */}
                      <circle cx={cx} cy={cy} r={isActif ? 36 : 30} fill={isActif ? cv : '#fff'} stroke={isActif ? co : config.couleurSable} strokeWidth={isActif ? 3 : 1.5} style={{ transition: 'all 0.3s' }} />
                      {/* Anneau pulsant pour actif */}
                      {isActif && <circle cx={cx} cy={cy} r={42} fill="none" stroke={co} strokeWidth="1.5" opacity="0.4" style={{ animation: 'coach-pulse-ring 1.5s ease-out infinite' }} />}
                      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" style={{ userSelect: 'none' }}>{p.icone}</text>
                    </g>
                  );
                })}
                {/* Centre */}
                <circle cx="150" cy="150" r="45" fill={co} />
                <text x="150" y="144" textAnchor="middle" fontSize="11" fontFamily="Lato, sans-serif" fontWeight="700" fill="#fff" letterSpacing="1">MA</text>
                <text x="150" y="158" textAnchor="middle" fontSize="11" fontFamily="Lato, sans-serif" fontWeight="700" fill="#fff" letterSpacing="1">MÉTHODE</text>
                {/* Cercle guide */}
                <circle cx="150" cy="150" r="110" fill="none" stroke={config.couleurSable} strokeWidth="1" strokeDasharray="3 6" />
              </svg>
            </div>

            {/* Détail du pilier actif */}
            <div key={actif} style={{ animation: 'coach-reveal 0.4s ease-out' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{pilier.icone}</div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
                Pilier {actif + 1} / {config.piliers.length}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, color: cv, marginBottom: 20, lineHeight: 1.1 }}>{pilier.titre}</h3>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 18, color: config.couleurSauge, lineHeight: 1.8, marginBottom: 28 }}>{pilier.description}</p>

              {/* Indicateurs */}
              <div style={{ display: 'flex', gap: 8 }}>
                {config.piliers.map((_, i) => (
                  <button key={i} onClick={() => setActif(i)} style={{ width: i === actif ? 32 : 8, height: 8, borderRadius: 4, background: i === actif ? co : config.couleurSable, border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SECTION PROGRAMMES ─────────────────────────────────────────────────────

function SectionProgrammes({ config, setPage }: { config: ConfigCoachVie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [flipped, setFlipped] = useState<string | null>(null);
  const co = config.couleurOr;
  const cv = config.couleurVert;

  return (
    <section style={{ background: cv, padding: isMobile ? '64px 24px' : '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 64 }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Investissez en vous</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 48, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Programmes d'Accompagnement</h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 17, color: 'rgba(255,255,255,0.65)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            {isMobile ? 'Survolez une carte pour découvrir les détails.' : 'Survolez une carte pour découvrir ce qui vous attend.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 24 }}>
          {config.programmes.map((prog) => {
            const isFlipped = flipped === prog.id;
            return (
              <div key={prog.id} style={{ perspective: 1000, height: isMobile ? 'auto' : 360 }}
                onMouseEnter={() => !isMobile && setFlipped(prog.id)}
                onMouseLeave={() => !isMobile && setFlipped(null)}
                onClick={() => isMobile && setFlipped(isFlipped ? null : prog.id)}>
                {isMobile ? (
                  /* Mobile : accordéon */
                  <div style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid rgba(255,255,255,${isFlipped ? 0.25 : 0.1})`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s' }}>
                    <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                      <div style={{ fontSize: 32, flexShrink: 0 }}>{prog.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>{prog.nom}</div>
                        <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: co, fontWeight: 700 }}>{prog.prix}</div>
                      </div>
                      {prog.populaire && <div style={{ background: co, color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.1em' }}>★ POPULAIRE</div>}
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, transition: 'transform 0.3s', transform: isFlipped ? 'rotate(90deg)' : 'none' }}>›</div>
                    </div>
                    {isFlipped && (
                      <div style={{ padding: '0 24px 20px' }}>
                        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 16 }}>{prog.description}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, color: co, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Durée</div>
                            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#fff', fontWeight: 600 }}>{prog.duree}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, color: co, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Format</div>
                            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#fff', fontWeight: 600 }}>{prog.format}</div>
                          </div>
                        </div>
                        {prog.inclus.map((item, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: co, fontSize: 13, marginTop: 1 }}>✓</span>
                            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                          </div>
                        ))}
                        <button onClick={() => setPage('contact')} className="coach-btn-or" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                          Commencer — {prog.prix}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Desktop : flip 3D */
                  <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    {/* Face avant */}
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 20, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.12)` }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${prog.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${cv} 40%, transparent 100%)` }} />
                      {prog.populaire && (
                        <div style={{ position: 'absolute', top: 16, right: 16, background: co, color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 50, letterSpacing: '0.1em' }}>★ POPULAIRE</div>
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 28px' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>{prog.emoji}</div>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{prog.nom}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{prog.duree} · {prog.format}</span>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: co }}>{prog.prix}</span>
                        </div>
                      </div>
                    </div>
                    {/* Face arrière */}
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 20, background: '#fff', padding: '28px', border: `2px solid ${prog.couleur}30`, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: cv, marginBottom: 10 }}>{prog.emoji} {prog.nom}</h3>
                      <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: config.couleurSauge, lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{prog.description}</p>
                      <div style={{ marginBottom: 16 }}>
                        {prog.inclus.map((item, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}>
                            <span style={{ color: co, fontWeight: 700, fontSize: 14 }}>✓</span>
                            <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#555', lineHeight: 1.4 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: co }}>{prog.prix}</span>
                        <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: config.couleurSauge }}>{prog.duree}</span>
                      </div>
                      <button onClick={() => setPage('contact')} className="coach-btn-or" style={{ width: '100%', justifyContent: 'center' }}>
                        Commencer ce programme
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION PROCESSUS ──────────────────────────────────────────────────────

function SectionProcessus({ config, setPage }: { config: ConfigCoachVie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurOr;
  const cv = config.couleurVert;
  const cf = config.couleurFond;

  return (
    <section style={{ background: config.couleurSable, padding: isMobile ? '64px 24px' : '100px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 64 }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Comment ça fonctionne</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 48, fontWeight: 700, color: cv }}>Votre Parcours en 4 Étapes</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)', gap: isMobile ? 20 : 32, position: 'relative' }}>
          {/* Ligne connectrice desktop */}
          {!isMobile && (
            <div style={{ position: 'absolute', top: 36, left: '12.5%', right: '12.5%', height: 2, background: `linear-gradient(to right, ${co}, ${cv})`, zIndex: 0 }} />
          )}
          {config.processus.map((p, i) => (
            <div key={i} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              {/* Numéro */}
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: i % 2 === 0 ? co : cv, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#fff', boxShadow: `0 8px 24px ${i % 2 === 0 ? co : cv}40` }}>
                {p.etape}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 20 : 18, fontWeight: 700, color: cv, marginBottom: 10 }}>{p.titre}</h3>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: config.couleurSauge, lineHeight: 1.7 }}>{p.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: isMobile ? 40 : 56 }}>
          <button onClick={() => setPage('contact')} className="coach-btn-or">
            Commencer mon parcours →
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ───────────────────────────────────────────────────────

function SectionAPropos({ config }: { config: ConfigCoachVie }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurOr;
  const cv = config.couleurVert;

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '64px 24px' : '100px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems: 'center' }}>
        {/* Photos */}
        <div style={{ position: 'relative', height: isMobile ? 320 : 500 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '78%', height: '85%', borderRadius: 20, backgroundImage: `url(${config.photoAPropos})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '55%', height: '55%', borderRadius: 16, backgroundImage: `url(${config.photoSignature})`, backgroundSize: 'cover', backgroundPosition: 'center', border: `4px solid ${config.couleurFond}`, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }} />
          {/* Badge expérience */}
          <div style={{ position: 'absolute', top: '40%', right: '-8px', background: co, borderRadius: 16, padding: '16px 20px', textAlign: 'center', boxShadow: `0 8px 24px ${co}40` }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{config.anneesExp}</div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>ans d'exp.</div>
          </div>
        </div>

        {/* Texte */}
        <div>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Votre Coach</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 44, fontWeight: 700, color: cv, marginBottom: 8, lineHeight: 1.1 }}>
            {config.prenom}
          </h2>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 44, fontWeight: 400, fontStyle: 'italic', color: co, marginBottom: 24, lineHeight: 1.1 }}>
            {config.nomCoach}
          </h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, color: config.couleurSauge, lineHeight: 1.9, marginBottom: 28 }}>
            {config.descriptionAPropos}
          </p>

          {/* Citation */}
          <div style={{ borderLeft: `3px solid ${co}`, paddingLeft: 20, marginBottom: 28 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontStyle: 'italic', color: cv, lineHeight: 1.7 }}>
              "{config.citation}"
            </p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: co, fontWeight: 700, marginTop: 8, letterSpacing: '0.08em' }}>
              — {config.auteurCitation}
            </p>
          </div>

          {/* Certifications */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Coach certifiée ICF', 'PNL Praticienne', 'Mindfulness MBSR', 'Formation Neurosciences'].map((cert, i) => (
              <div key={i} style={{ background: config.couleurSable, borderRadius: 50, padding: '6px 14px', fontFamily: "'Lato', sans-serif", fontSize: 12, color: cv, fontWeight: 600 }}>
                ✓ {cert}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION TÉMOIGNAGES ────────────────────────────────────────────────────

function SectionTemoignages({ config }: { config: ConfigCoachVie }) {
  const { isMobile } = useIsMobile();
  const [idx, setIdx] = useState(0);
  const co = config.couleurOr;
  const cv = config.couleurVert;

  const t = config.temoignages[idx];

  return (
    <section style={{ background: cv, padding: isMobile ? '64px 24px' : '100px 48px', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Ils ont changé de vie</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 48, fontWeight: 700, color: '#fff' }}>Leurs Transformations</h2>
        </div>

        {/* Témoignage principal */}
        <div key={idx} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: isMobile ? '32px 24px' : '52px 64px', marginBottom: 28, animation: 'coach-reveal 0.5s ease-out' }}>
          <div style={{ fontSize: isMobile ? 36 : 52, color: co, fontFamily: "'Playfair Display', serif", lineHeight: 1, marginBottom: 20 }}>"</div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 18 : 24, fontStyle: 'italic', color: '#fff', lineHeight: 1.7, marginBottom: 28 }}>
            {t.texte}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundImage: `url(${t.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', border: `2px solid ${co}`, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff' }}>{t.auteur}</div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t.titre}</div>
            </div>
            <div style={{ marginLeft: 'auto', background: `${co}22`, border: `1px solid ${co}44`, borderRadius: 50, padding: '5px 14px' }}>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: co, fontWeight: 700 }}>✨ {t.transformation}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <button onClick={() => setIdx(i => (i - 1 + config.temoignages.length) % config.temoignages.length)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 18 }}>‹</button>
          {config.temoignages.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 28 : 8, height: 8, borderRadius: 4, background: i === idx ? co : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
          <button onClick={() => setIdx(i => (i + 1) % config.temoignages.length)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 18 }}>›</button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FAQ ────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigCoachVie }) {
  const { isMobile } = useIsMobile();
  const [ouvert, setOuvert] = useState<number | null>(null);
  const co = config.couleurOr;
  const cv = config.couleurVert;

  return (
    <section style={{ background: config.couleurFond, padding: isMobile ? '64px 24px' : '100px 48px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Questions fréquentes</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 48, fontWeight: 700, color: cv }}>Vous vous demandez...</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {config.faq.map((f, i) => (
            <div key={i} onClick={() => setOuvert(ouvert === i ? null : i)} style={{ background: '#fff', borderRadius: 14, border: `2px solid ${ouvert === i ? co : config.couleurSable}`, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.3s', boxShadow: ouvert === i ? `0 8px 24px ${co}18` : 'none' }}>
              <div style={{ padding: isMobile ? '16px 18px' : '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <h3 style={{ fontFamily: "'Lato', sans-serif", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: cv, lineHeight: 1.4, flex: 1 }}>{f.question}</h3>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: ouvert === i ? co : config.couleurSable, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ouvert === i ? '#fff' : cv, fontSize: 16, fontWeight: 700, flexShrink: 0, transition: 'all 0.3s', transform: ouvert === i ? 'rotate(45deg)' : 'none' }}>+</div>
              </div>
              {ouvert === i && (
                <div style={{ padding: isMobile ? '0 18px 16px' : '0 24px 20px', borderTop: `1px solid ${config.couleurSable}` }}>
                  <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 15, color: config.couleurSauge, lineHeight: 1.8, paddingTop: 16 }}>{f.reponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigCoachVie }) {
  const { isMobile } = useIsMobile();
  const { envoyer, etat, erreur } = useContactStudio();
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', objectif: '', message: '', honeypot: '' });
  const co = config.couleurOr;
  const cv = config.couleurVert;

  const setF = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.honeypot) return; // bot détecté côté client
    await envoyer({
      nom:         form.nom,
      email:       form.email,
      message:     form.message,
      vendeurId:   config.vendeurId || 0,
      templateId:  'cours-coach',
      sujet:       'Demande d\'appel découverte',
      telephone:   form.telephone,
      copieMoi:    true,
      champsExtra: form.objectif ? [{ label: 'Objectif', valeur: form.objectif }] : [],
    });
  };

  const inp = (label: string, key: keyof typeof form, ph: string, type = 'text') => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontFamily: "'Lato', sans-serif", fontSize: 12, fontWeight: 700, color: cv, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setF(key, e.target.value)} placeholder={ph} required
        style={{ width: '100%', padding: '13px 16px', border: `2px solid ${config.couleurSable}`, borderRadius: 10, fontFamily: "'Lato', sans-serif", fontSize: 15, color: '#1a1a1a', background: '#fff', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = co}
        onBlur={e => e.target.style.borderColor = config.couleurSable} />
    </div>
  );

  return (
    <section style={{ background: config.couleurSable, padding: isMobile ? '64px 24px' : '100px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 64, alignItems: 'start' }}>
        {/* Gauche */}
        <div>
          <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>Première étape</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 32 : 44, fontWeight: 700, color: cv, lineHeight: 1.15, marginBottom: 20 }}>
            Réservez votre<br />
            <span style={{ fontStyle: 'italic', color: co }}>Appel Découverte</span>
          </h2>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 16, color: config.couleurSauge, lineHeight: 1.8, marginBottom: 32 }}>
            45 minutes. Sans engagement. Pour explorer ensemble si nous sommes le bon match pour votre transformation.
          </p>

          {/* Infos */}
          {[
            { ico: '📞', val: config.telephone },
            { ico: '✉️', val: config.email },
            { ico: '📍', val: `${config.adresse}, ${config.ville}` },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{item.ico}</div>
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: 15, color: cv }}>{item.val}</span>
            </div>
          ))}

          {/* Réseaux */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {Object.entries({ instagram: '📸', facebook: '📘', linkedin: '💼', youtube: '▶️' }).map(([k, ico]) =>
              config.reseaux?.[k as keyof typeof config.reseaux] ? (
                <a key={k} href={config.reseaux[k as keyof typeof config.reseaux]} target="_blank" rel="noreferrer" style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: `2px solid ${config.couleurSable}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, textDecoration: 'none', transition: 'border-color 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = co}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = config.couleurSable}>
                  {ico}
                </a>
              ) : null
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div style={{ background: '#fff', borderRadius: 24, padding: isMobile ? '28px 24px' : '40px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          {etat === 'ok' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🌟</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: cv, marginBottom: 12 }}>Message envoyé!</h3>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 15, color: config.couleurSauge, lineHeight: 1.7 }}>Je vous reviens dans les 24 heures pour planifier votre appel découverte gratuit.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
              <HoneypotField value={form.honeypot} onChange={v => setF('honeypot', v)} />
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: cv, marginBottom: 24 }}>Votre appel découverte gratuit</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div style={{ gridColumn: '1' }}>{inp('Prénom & Nom', 'nom', 'Marie Tremblay')}</div>
                <div style={{ gridColumn: '2' }}>{inp('Courriel', 'email', 'marie@exemple.com', 'email')}</div>
              </div>
              {inp('Téléphone', 'telephone', '(514) 555-0000', 'tel')}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontFamily: "'Lato', sans-serif", fontSize: 12, fontWeight: 700, color: cv, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>Votre principal objectif</label>
                <select value={form.objectif} onChange={e => setF('objectif', e.target.value)} required
                  style={{ width: '100%', padding: '13px 16px', border: `2px solid ${config.couleurSable}`, borderRadius: 10, fontFamily: "'Lato', sans-serif", fontSize: 15, color: '#1a1a1a', background: '#fff', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Choisir...</option>
                  <option>Reconversion professionnelle</option>
                  <option>Confiance & estime de soi</option>
                  <option>Équilibre vie personnelle/pro</option>
                  <option>Lancer mon projet</option>
                  <option>Relations & communication</option>
                  <option>Autre</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontFamily: "'Lato', sans-serif", fontSize: 12, fontWeight: 700, color: cv, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>En quelques mots, où en êtes-vous?</label>
                <textarea value={form.message} onChange={e => setF('message', e.target.value)} rows={3} placeholder="Décrivez brièvement votre situation actuelle..." required
                  style={{ width: '100%', padding: '13px 16px', border: `2px solid ${config.couleurSable}`, borderRadius: 10, fontFamily: "'Lato', sans-serif", fontSize: 15, color: '#1a1a1a', background: '#fff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = co}
                  onBlur={e => e.target.style.borderColor = config.couleurSable} />
              </div>
              {erreur && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: "'Lato', sans-serif", fontSize: 13, color: '#dc2626' }}>
                  ⚠️ {erreur}
                </div>
              )}
              <button type="submit" disabled={etat === 'loading'} className="coach-btn-or" style={{ width: '100%', justifyContent: 'center', fontSize: 16, opacity: etat === 'loading' ? 0.7 : 1 }}>
                {etat === 'loading' ? '⏳ Envoi en cours...' : '☕ Réserver mon appel gratuit'}
              </button>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: config.couleurSauge, textAlign: 'center', marginTop: 12 }}>Aucun engagement · Réponse sous 24h</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigCoachVie; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurOr;
  const cv = config.couleurVert;

  return (
    <footer style={{ background: '#1a2420', padding: isMobile ? '48px 24px 24px' : '64px 48px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: isMobile ? 32 : 48, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              {config.prenom} <span style={{ color: co }}>{config.nomCoach}</span>
            </div>
            <div style={{ fontFamily: "'Lato', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Coach de Vie Certifiée ICF</div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: 300 }}>{config.ville} · {config.email}</p>
          </div>
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Navigation</p>
            {[['accueil', 'Accueil'], ['piliers', 'Ma Méthode'], ['programmes', 'Programmes'], ['apropos', 'À propos'], ['contact', 'Contact']].map(([id, label]) => (
              <p key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 8, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = co}
                onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.35)'}>
                {label}
              </p>
            ))}
          </div>
          <div>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 9, fontWeight: 700, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Programmes</p>
            {config.programmes.map(p => (
              <p key={p.id} style={{ fontFamily: "'Lato', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{p.emoji} {p.nom}</p>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>🌿 Transformez votre vie, un pas à la fois</p>
          <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} {config.prenom} {config.nomCoach}</p>
        </div>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────

export interface TemplateCoachVieProps {
  config?: Partial<ConfigCoachVie>;
  isPreview?: boolean;
}

export default function TemplateCoachVie({ config: partiel, isPreview }: TemplateCoachVieProps) {
  const config: ConfigCoachVie = {
    ...CONFIG_COACH_DEFAUT, ...partiel,
    couleurOr:    partiel?.couleurOr    || CONFIG_COACH_DEFAUT.couleurOr,
    couleurVert:  partiel?.couleurVert  || CONFIG_COACH_DEFAUT.couleurVert,
    couleurFond:  partiel?.couleurFond  || CONFIG_COACH_DEFAUT.couleurFond,
    couleurSable: partiel?.couleurSable || CONFIG_COACH_DEFAUT.couleurSable,
    couleurSauge: partiel?.couleurSauge || CONFIG_COACH_DEFAUT.couleurSauge,
  };

  const VALID_IDS = ['hero', 'stats', 'piliers', 'programmes', 'processus', 'apropos', 'temoignages', 'faq', 'contact'];
  const rawSections = ea(partiel?.sections, CONFIG_COACH_DEFAUT.sections);
  config.sections     = rawSections.every(s => VALID_IDS.includes(s.id)) ? rawSections : CONFIG_COACH_DEFAUT.sections;
  config.stats        = ea(partiel?.stats,         CONFIG_COACH_DEFAUT.stats);
  config.piliers      = ea(partiel?.piliers,        CONFIG_COACH_DEFAUT.piliers);
  config.programmes   = ea(partiel?.programmes,     CONFIG_COACH_DEFAUT.programmes);
  config.temoignages  = ea(partiel?.temoignages,    CONFIG_COACH_DEFAUT.temoignages);
  config.faq          = ea(partiel?.faq,            CONFIG_COACH_DEFAUT.faq);
  config.processus    = ea(partiel?.processus,      CONFIG_COACH_DEFAUT.processus);
  config.reseaux      = partiel?.reseaux            || CONFIG_COACH_DEFAUT.reseaux;

  const [page, setPage] = useState('accueil');
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const handlePage = (p: string) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} setPage={handlePage} />;
      case 'stats':       return <SectionStats       config={config} />;
      case 'piliers':     return <SectionPiliers     config={config} />;
      case 'programmes':  return <SectionProgrammes  config={config} setPage={handlePage} />;
      case 'processus':   return <SectionProcessus   config={config} setPage={handlePage} />;
      case 'apropos':     return <SectionAPropos     config={config} />;
      case 'temoignages': return <SectionTemoignages config={config} />;
      case 'faq':         return <SectionFAQ         config={config} />;
      case 'contact':     return <SectionContact     config={config} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond }}>
      <style>{getStyle(config)}</style>
      <Nav config={config} setPage={handlePage} />
      <div style={{ paddingTop: 0 }}>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'piliers'      && (<><SectionPiliers     config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'programmes'   && (<><SectionProgrammes  config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'apropos'      && (<><SectionAPropos     config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact'      && (<><SectionContact     config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}