// src/templates/TemplatePaysager.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
// e-Vend Studio — Template Entretien Paysager & Aménagement
// Style : fond sombre #0f1a0f / vert citron #b5e24a / blanc
// Typo bold condensée Anton — Gratuit (vitrine-contact)
// Effets : parallax hero, zoom clip-path reveal, compteurs IntersectionObserver,
//          galerie masonry hover, avis défilement auto, formulaire devis

import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ServicePaysager {
  nom: string;
  description: string;
  photo: string;
  icone: string;
}

export interface AvisPaysager {
  texte: string;
  auteur: string;
  ville: string;
  photo: string;
  note: number;
}

export interface EtapeProcessus {
  numero: string;
  titre: string;
  description: string;
}

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface ConfigPaysager {
  nomEntreprise: string;
  slogan: string;
  sloganAccent: string; // mot(s) en vert citron dans le slogan
  description: string;
  logoUrl: string;

  // Photos
  photoHero: string;
  photoAPropos: string;
  photoCTA: string;
  galerie: string[];

  // Palette
  couleurFond: string;        // ex: #0f1a0f sombre
  couleurFondCarte: string;   // ex: #1a2e1a
  couleurAccent: string;      // ex: #b5e24a vert citron
  couleurTexte: string;       // ex: #ffffff
  couleurTexteSombre: string; // ex: #0f1a0f

  // Stats
  stats: { valeur: string; label: string }[];

  // Services
  services: ServicePaysager[];

  // Processus
  etapes: EtapeProcessus[];

  // Avis
  avis: AvisPaysager[];

  // Formulaire devis
  titreDevis: string;
  sousTitreDevis: string;
  servicesDevis: string[];

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];

  // CTA
  titreCTA: string;
  boutonsDevis: string;

  // Sections — ordre et visibilité
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_PAYSAGER_DEFAUT: ConfigPaysager = {
  nomEntreprise: 'VertPro Aménagement',
  slogan: 'Des pelouses magnifiques,',
  sloganAccent: 'sans effort.',
  description: 'Services professionnels d\'entretien de pelouse et d\'aménagement paysager qui gardent votre terrain vert, sain et sans tracas toute l\'année.',
  logoUrl: '',

  photoHero: 'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos: 'https://images.pexels.com/photos/589840/pexels-photo-589840.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoCTA: 'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=1600',
  galerie: [
    'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6231625/pexels-photo-6231625.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/589840/pexels-photo-589840.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1508193/pexels-photo-1508193.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],

  couleurFond: '#0f1a0f',
  couleurFondCarte: '#1a2e1a',
  couleurAccent: '#b5e24a',
  couleurTexte: '#ffffff',
  couleurTexteSombre: '#0f1a0f',

  stats: [
    { valeur: '7+',  label: "Années d'expérience" },
    { valeur: '36+', label: 'Projets complétés' },
    { valeur: '40+', label: 'Pelouses heureuses' },
  ],

  services: [
    { nom: 'Entretien de pelouse', description: 'Un entretien régulier est la clé d\'une pelouse saine et verdoyante.', photo: 'https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=800', icone: '🌿' },
    { nom: 'Design paysager', description: 'Nos experts créent un aménagement sur mesure qui sublime votre propriété.', photo: 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=800', icone: '🎨' },
    { nom: "Systèmes d'irrigation", description: 'Des solutions d\'arrosage efficaces pour nourrir votre terrain avec précision.', photo: 'https://images.pexels.com/photos/6231625/pexels-photo-6231625.jpeg?auto=compress&cs=tinysrgb&w=800', icone: '💧' },
    { nom: 'Nettoyage saisonnier', description: 'Transformez votre espace extérieur avec notre service de nettoyage complet.', photo: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=800', icone: '🍂' },
  ],

  etapes: [
    { numero: '1', titre: 'Consultation initiale', description: 'Nous commençons par une consultation détaillée pour comprendre votre vision, vos besoins et votre budget.' },
    { numero: '2', titre: 'Planification & Stratégie', description: 'Nous concevons un plan d\'aménagement personnalisé alliant durabilité, innovation et beauté.' },
    { numero: '3', titre: 'Collaboration & Approbation', description: 'Nous affinons le design avec vos commentaires jusqu\'à ce qu\'il soit parfait.' },
    { numero: '4', titre: 'Réalisation', description: 'Notre équipe expérimentée donne vie au projet avec des matériaux et techniques de première qualité.' },
  ],

  avis: [
    { texte: 'VertPro a transformé notre cour en véritable oasis. Leur souci du détail est exceptionnel!', auteur: 'Karin M.', ville: 'Laval, QC', photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Ils ont pris notre terrain ordinaire et en ont fait un espace extérieur époustouflant. Équipe professionnelle et créative.', auteur: 'Franklin P.', ville: 'Montréal, QC', photo: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'L\'équipe était ponctuelle, professionnelle et a livré exactement ce qui était promis. Notre terrain n\'a jamais été aussi beau.', auteur: 'Sarah L.', ville: 'Brossard, QC', photo: 'https://images.pexels.com/photos/3765114/pexels-photo-3765114.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Fiables, professionnels et vraiment créatifs. Je recommande vivement à tous mes voisins!', auteur: 'Mike R.', ville: 'Longueuil, QC', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
    { texte: 'Service impeccable du début à la fin. Notre nouvelle terrasse et nos plates-bandes sont magnifiques.', auteur: 'Emily T.', ville: 'Saint-Lambert, QC', photo: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200', note: 5 },
  ],

  titreDevis: 'Obtenez une soumission gratuite',
  sousTitreDevis: 'Dites-nous en un peu plus sur votre propriété et le service souhaité. Nous vous contacterons rapidement avec nos tarifs et disponibilités.',
  servicesDevis: ['Entretien de pelouse', 'Design paysager', "Système d'irrigation", 'Nettoyage saisonnier', 'Autre'],

  adresse: '123 rue des Érables',
  ville: 'Laval, QC H7P 3M4',
  telephone: '(450) 555-0177',
  email: 'info@vertpro.ca',
  horaires: ['Lun – Ven : 8h – 19h', 'Samedi : 9h – 16h', 'Dimanche : Fermé'],

  titreCTA: 'Commencez à réaliser la pelouse de vos rêves',
  boutonsDevis: 'Obtenir une soumission gratuite',

  sections: [
    { id: 'hero',       actif: true,  ordre: 1, label: 'Hero (accueil)' },
    { id: 'apropos',    actif: true,  ordre: 2, label: 'À propos + Stats' },
    { id: 'services',   actif: true,  ordre: 3, label: 'Nos services' },
    { id: 'processus',  actif: true,  ordre: 4, label: 'Comment ça fonctionne' },
    { id: 'avis',       actif: true,  ordre: 5, label: 'Avis clients' },
    { id: 'galerie',    actif: true,  ordre: 6, label: 'Galerie portfolio' },
    { id: 'devis',      actif: true,  ordre: 7, label: 'Formulaire de devis' },
    { id: 'cta',        actif: true,  ordre: 8, label: 'CTA finale' },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useParallax(factor = 0.4) {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY * factor);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [factor]);
  return y;
}

function useReveal(threshold = 0.12) {
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

function useCounter(cible: number, actif: boolean, duree = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!actif) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duree, 1);
      setVal(Math.floor(prog * cible));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [actif, cible, duree]);
  return val;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, section, setSection }: { config: ConfigPaysager; section: string; setSection: (s: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const ca = config.couleurAccent;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&display=swap');
        .nav-link-pay { font-family:'Inter',sans-serif; font-size:14px; font-weight:500; color:rgba(255,255,255,0.75); cursor:pointer; background:none; border:none; padding:4px 0; border-bottom:2px solid transparent; transition:color .2s,border-color .2s; letter-spacing:0.02em; }
        .nav-link-pay:hover,.nav-link-pay.active { color:#fff; border-bottom-color:${ca}; }
        .btn-devis-nav { background:${ca}; color:${config.couleurTexteSombre}; border:none; border-radius:50px; padding:10px 22px; font-family:'Inter',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:filter .2s,transform .2s; letter-spacing:0.03em; }
        .btn-devis-nav:hover { filter:brightness(0.9); transform:scale(1.03); }
      `}</style>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(15,26,15,0.97)' : 'rgba(5,12,5,.85)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'background .4s',
        borderBottom: scrolled ? `1px solid ${ca}30` : 'none',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div onClick={() => setSection('accueil')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: ca, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌿</div>
            <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, color: '#fff', letterSpacing: '0.05em' }}>
              {config.nomEntreprise.toUpperCase()}
            </span>
          </div>

          {/* Liens */}
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {[['a-propos', 'À propos'], ['contact', 'Contact'], ['services', 'Services']].map(([id, label]) => (
              <button key={id} className={`nav-link-pay${section === id ? ' active' : ''}`} onClick={() => setSection(id)}>{label}</button>
            ))}
            <button className="btn-devis-nav" onClick={() => setSection('devis')}>Soumission gratuite →</button>
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setSection }: { config: ConfigPaysager; setSection: (s: string) => void }) {
  const { isMobile } = useIsMobile();
  const parallax = useParallax(0.35);
  const ca = config.couleurAccent;

  return (
    <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', paddingBottom: 80 }}>
      <style>{`
        @keyframes heroReveal { from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)} }
        .hero-text { animation: heroReveal .9s cubic-bezier(.22,1,.36,1) both; }
        .hero-text-2 { animation: heroReveal .9s .15s cubic-bezier(.22,1,.36,1) both; }
        .hero-text-3 { animation: heroReveal .9s .28s cubic-bezier(.22,1,.36,1) both; }
        .hero-btn { animation: heroReveal .9s .4s cubic-bezier(.22,1,.36,1) both; }

        /* Clip reveal image spéciale */
        .photo-clip-reveal {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          transition: clip-path .7s cubic-bezier(.25,.46,.45,.94), transform .7s ease;
        }
        .photo-clip-reveal:hover {
          clip-path: polygon(4% 4%, 96% 4%, 96% 96%, 4% 96%);
          transform: scale(1.06);
        }
        .photo-zoom { transition: transform .7s ease; overflow:hidden; }
        .photo-zoom:hover img { transform: scale(1.08) rotate(1deg); }
        .photo-zoom img { transition: transform .7s ease; width:100%; height:100%; object-fit:cover; }
      `}</style>

      {/* Background parallax */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${config.photoHero})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transform: `translateY(${parallax}px)`,
        filter: 'brightness(0.45)',
      }} />

      {/* Overlay gradient vert */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${config.couleurFond}cc 0%, transparent 60%, ${ca}15 100%)` }} />

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 40px', width: '100%' }}>
        {/* Badge nav arrondie style Byanka */}
        <div style={{ position: 'absolute', top: -480, left: 40, right: 40, display: 'flex', justifyContent: 'flex-end' }}>
          {/* déjà géré par la nav */}
        </div>

        <p className="hero-text" style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
          {config.nomEntreprise} — Services professionnels
        </p>

        <h1 className="hero-text-2" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(52px, 8vw, 110px)', color: '#fff', lineHeight: 0.95, marginBottom: 24, letterSpacing: '-0.01em' }}>
          {config.slogan}<br />
          <span style={{ color: ca }}>{config.sloganAccent}</span>
        </h1>

        <p className="hero-text-3" style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(14px, 1.6vw, 17px)', color: 'rgba(255,255,255,0.7)', maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>
          {config.description}
        </p>

        <div className="hero-btn" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setSection('devis')} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: ca, color: config.couleurTexteSombre, border: 'none',
            borderRadius: 50, padding: '14px 28px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            transition: 'filter .2s, transform .2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.9)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${config.couleurTexteSombre}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>→</span>
            {config.boutonsDevis}
          </button>
        </div>
      </div>

      {/* Texte défilant bas */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: `${ca}`, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: isMobile ? 24 : 60, animation: 'marquee 20s linear infinite', whiteSpace: 'nowrap', fontFamily: "'Anton', sans-serif", fontSize: 15, color: config.couleurTexteSombre, letterSpacing: '0.1em' }}>
          {[...Array(5)].map((_, i) => (
            <span key={i}>ENTRETIEN DE PELOUSE &nbsp;✦&nbsp; DESIGN PAYSAGER &nbsp;✦&nbsp; IRRIGATION &nbsp;✦&nbsp; NETTOYAGE SAISONNIER &nbsp;✦&nbsp;</span>
          ))}
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS + STATS ─────────────────────────────────────────────────

function SectionAPropos({ config, setSection }: { config: ConfigPaysager; setSection: (s: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.08);
  const rvStats = useReveal(0.1);
  const ca = config.couleurAccent;
  const cf = config.couleurFond;
  const cfc = config.couleurFondCarte;

  // Extraire les valeurs numériques pour les compteurs
  const parseVal = (v: string) => parseInt(v.replace(/[^0-9]/g, '')) || 0;

  const c1 = useCounter(parseVal(config.stats[0]?.valeur || '0'), rvStats.vis);
  const c2 = useCounter(parseVal(config.stats[1]?.valeur || '0'), rvStats.vis);
  const c3 = useCounter(parseVal(config.stats[2]?.valeur || '0'), rvStats.vis);
  const counters = [c1, c2, c3];

  const suffix = (v: string) => v.replace(/[0-9]/g, '');

  return (
    <section style={{ background: cf, padding: '100px 40px' }}>
      <div ref={rv.ref} style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center', opacity: rv.vis ? 1 : 0, transform: rv.vis ? 'none' : 'translateY(40px)', transition: 'all .8s ease' }}>

        {/* Texte */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Pourquoi nous choisir</p>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 4vw, 58px)', color: '#fff', lineHeight: 1.0, marginBottom: 24, letterSpacing: '-0.01em' }}>
            POURQUOI LES PROPRIÉTAIRES<br />
            <span style={{ color: ca }}>NOUS FONT CONFIANCE</span>
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 16, maxWidth: 440 }}>
            {config.nomEntreprise} se consacre à la création et à l'entretien d'espaces extérieurs magnifiques. Avec notre expertise et notre passion pour la nature, nous donnons vie à votre pelouse de rêve.
          </p>
          <button onClick={() => setSection('services')} style={{
            display: 'flex', alignItems: 'center', gap: 10, background: ca, color: config.couleurTexteSombre,
            border: 'none', borderRadius: 50, padding: '12px 24px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Inter', sans-serif", marginTop: 8,
          }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.88)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${config.couleurTexteSombre}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>→</span>
            Explorer
          </button>

          {/* Stats */}
          <div ref={rvStats.ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginTop: 48, borderTop: `1px solid rgba(255,255,255,0.1)`, paddingTop: 32 }}>
            {(Array.isArray(config.stats) ? config.stats : CONFIG_PAYSAGER_DEFAUT.stats).map((s, i) => (
              <div key={i} style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingRight: 20, paddingLeft: i > 0 ? 20 : 0 }}>
                <p style={{ fontFamily: "'Anton', sans-serif", fontSize: 48, color: '#fff', lineHeight: 1, marginBottom: 4 }}>
                  {counters[i]}{suffix(s.valeur)}
                </p>
                <div style={{ width: 32, height: 3, background: ca, borderRadius: 2, marginBottom: 8 }} />
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo avec effet spécial */}
        <div style={{ position: 'relative' }}>
          {/* Photo principale — zoom au hover */}
          <div className="photo-zoom" style={{ borderRadius: 20, overflow: 'hidden', height: 480 }}>
            <img src={config.photoAPropos} alt="équipe paysagiste" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {/* Badge flottant */}
          <div style={{
            position: 'absolute', bottom: -20, left: -20,
            background: cfc, border: `2px solid ${ca}`,
            borderRadius: 16, padding: '16px 24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <p style={{ fontFamily: "'Anton', sans-serif", fontSize: 32, color: ca, margin: 0, lineHeight: 1 }}>100%</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Satisfaction garantie</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION SERVICES — Grille avec photo hover ────────────────────────────────

function SectionServices({ config, setSection }: { config: ConfigPaysager; setSection: (s: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const ca = config.couleurAccent;
  const cf = config.couleurFond;
  const cfc = config.couleurFondCarte;

  return (
    <section style={{ background: cf, padding: '100px 40px' }}>
      <style>{`
        .carte-service {
          position:relative; border-radius:16px; overflow:hidden; cursor:pointer;
          transition: transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .4s;
        }
        .carte-service:hover { transform: translateY(-8px); box-shadow: 0 24px 60px rgba(0,0,0,0.4); }
        .carte-service img { width:100%; height:100%; object-fit:cover; transition: transform .7s ease; }
        .carte-service:hover img { transform: scale(1.08); }
        .carte-service-overlay {
          position:absolute; inset:0;
          background: linear-gradient(to top, rgba(15,26,15,0.95) 0%, rgba(15,26,15,0.3) 60%, transparent 100%);
          display:flex; flex-direction:column; justify-content:flex-end; padding:24px;
          transition: background .4s;
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div ref={rv.ref} style={{ opacity: rv.vis ? 1 : 0, transform: rv.vis ? 'none' : 'translateY(40px)', transition: 'all .8s ease' }}>

          {/* En-tête section — style "vert citron + texte géant" */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 40, marginBottom: 56, alignItems: 'flex-end' }}>
            <div style={{ background: ca, borderRadius: 20, padding: '36px 36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260 }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: config.couleurTexteSombre, opacity: 0.7, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'auto' }}>
                Ce que nous offrons
              </p>
              <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(30px, 3.5vw, 48px)', color: config.couleurTexteSombre, lineHeight: 1.05, letterSpacing: '-0.01em', margin: '24px 0' }}>
                SOLUTIONS CRÉÉES POUR DES PAYSAGES LUXURIANTS
              </h2>
              <button onClick={() => setSection('devis')} style={{
                alignSelf: 'flex-start', background: 'transparent', border: `2px solid ${config.couleurTexteSombre}`,
                color: config.couleurTexteSombre, borderRadius: 50, padding: '10px 22px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = config.couleurTexteSombre; (e.currentTarget as HTMLButtonElement).style.color = ca; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = config.couleurTexteSombre; }}>
                Commencer →
              </button>
            </div>

            {/* 4 cartes services en grille 2x2 */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              {(Array.isArray(config.services) ? config.services : CONFIG_PAYSAGER_DEFAUT.services).map((s, i) => (
                <div key={i} className="carte-service" style={{ height: 200 }}>
                  <img src={s.photo} alt={s.nom} />
                  <div className="carte-service-overlay">
                    <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, color: '#fff', marginBottom: 4, letterSpacing: '0.02em' }}>{s.nom.toUpperCase()}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION PROCESSUS ────────────────────────────────────────────────────────

function SectionProcessus({ config, setSection }: { config: ConfigPaysager; setSection: (s: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const ca = config.couleurAccent;
  const cfc = config.couleurFondCarte;

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div ref={rv.ref} style={{ opacity: rv.vis ? 1 : 0, transform: rv.vis ? 'none' : 'translateY(40px)', transition: 'all .8s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'flex-start' }}>

            {/* Photo gauche */}
            <div className="photo-zoom" style={{ borderRadius: 20, overflow: 'hidden', height: 520, position: 'sticky', top: 100 }}>
              <img src={config.photoAPropos} alt="processus" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Étapes droite */}
            <div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Notre approche</p>
              <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(32px, 3.5vw, 52px)', color: '#fff', lineHeight: 1.0, marginBottom: 8, letterSpacing: '-0.01em' }}>
                COMMENT ÇA FONCTIONNE
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 40, lineHeight: 1.7 }}>
                Découvrez la différence que la passion, l'expertise et un service personnalisé peuvent apporter à votre espace extérieur.
              </p>

              <button onClick={() => setSection('devis')} style={{
                display: 'flex', alignItems: 'center', gap: 10, background: ca, color: config.couleurTexteSombre,
                border: 'none', borderRadius: 50, padding: '12px 24px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif", marginBottom: 48,
              }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(.88)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${config.couleurTexteSombre}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>→</span>
                Commencer
              </button>

              {/* Étapes */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                {(Array.isArray(config.etapes) ? config.etapes : CONFIG_PAYSAGER_DEFAUT.etapes).map((e, i) => (
                  <div key={i} style={{
                    background: cfc, borderRadius: 14, padding: '24px 20px',
                    border: `1px solid rgba(181,226,74,0.15)`,
                    transition: 'border-color .3s, transform .3s',
                  }}
                    onMouseEnter={ev => { (ev.currentTarget as HTMLDivElement).style.borderColor = `${ca}60`; (ev.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={ev => { (ev.currentTarget as HTMLDivElement).style.borderColor = 'rgba(181,226,74,0.15)'; (ev.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: 17, color: '#fff', letterSpacing: '0.02em', lineHeight: 1.2 }}>{e.titre.toUpperCase()}</h3>
                      <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 28, color: ca, lineHeight: 1 }}>{e.numero}</span>
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{e.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS — Défilement automatique ────────────────────────────────────

function SectionAvis({ config }: { config: ConfigPaysager }) {
  const rv = useReveal(0.05);
  const ca = config.couleurAccent;
  const cfc = config.couleurFondCarte;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);

  // Défilement auto
  useEffect(() => {
    const id = setInterval(() => {
      if (!scrollRef.current) return;
      const max = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      setPos(p => {
        const next = p + 320;
        return next >= max ? 0 : next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ left: pos, behavior: 'smooth' });
  }, [pos]);

  return (
    <section style={{ background: config.couleurFond, padding: '100px 0' }}>
      <div ref={rv.ref} style={{ opacity: rv.vis ? 1 : 0, transition: 'opacity .8s ease' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', marginBottom: 48 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Ce que disent nos clients</p>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(28px, 3.5vw, 48px)', color: '#fff', lineHeight: 1.0, letterSpacing: '-0.01em' }}>
            APPROUVÉ PAR LES PROPRIÉTAIRES
            <br /><span style={{ color: ca }}>ET LES ENTREPRISES</span>
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 12, maxWidth: 560 }}>
            Découvrez ce que nos clients satisfaits disent de nos services d'entretien paysager et de notre qualité exceptionnelle.
          </p>
        </div>

        {/* Défilement horizontal */}
        <div ref={scrollRef} style={{ display: 'flex', gap: 20, overflowX: 'auto', padding: '0 40px 16px', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
          <style>{`.avis-scroll::-webkit-scrollbar{display:none}`}</style>
          {[...(Array.isArray(config.avis) ? config.avis : CONFIG_PAYSAGER_DEFAUT.avis), ...(Array.isArray(config.avis) ? config.avis : CONFIG_PAYSAGER_DEFAUT.avis)].map((a, i) => (
            <div key={i} style={{
              flexShrink: 0, width: 320, background: cfc,
              border: `1px solid rgba(181,226,74,0.12)`,
              borderRadius: 20, padding: 28, scrollSnapAlign: 'start',
              transition: 'border-color .3s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${ca}40`}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(181,226,74,0.12)'}>
              {/* Étoiles */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {[...Array(a.note)].map((_, j) => <span key={j} style={{ color: ca, fontSize: 14 }}>★</span>)}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>
                "{a.texte}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={a.photo} alt={a.auteur} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ca}40` }} />
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{a.auteur}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{a.ville}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION GALERIE — Masonry hover ──────────────────────────────────────────

function SectionGalerie({ config }: { config: ConfigPaysager }) {
  const rv = useReveal(0.05);
  const ca = config.couleurAccent;

  // Layout masonry simulé : 2 grandes + 3 petites
  const layout = [
    { row: 0, col: 0, span: 1, tall: false, i: 1 },
    { row: 0, col: 1, span: 1, tall: false, i: 2 },
    { row: 0, col: 2, span: 1, tall: true, i: 0 },
    { row: 1, col: 0, span: 1, tall: false, i: 3 },
    { row: 1, col: 1, span: 1, tall: false, i: 4 },
    { row: 1, col: 2, span: 1, tall: false, i: 5 },
  ];

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div ref={rv.ref} style={{ maxWidth: 1280, margin: '0 auto', opacity: rv.vis ? 1 : 0, transform: rv.vis ? 'none' : 'translateY(40px)', transition: 'all .8s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Notre portfolio</p>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(28px, 3.5vw, 48px)', color: '#fff', lineHeight: 1.0, letterSpacing: '-0.01em' }}>
              DÉCOUVREZ<br /><span style={{ color: ca }}>NOS RÉALISATIONS</span>
            </h2>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 340, lineHeight: 1.7 }}>
            Découvrez notre portfolio de transformations. Des jardins intimes aux rénovations extérieures complètes.
          </p>
        </div>

        {/* Grille galerie */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: 12 }}>
          {(Array.isArray(config.galerie) ? config.galerie : CONFIG_PAYSAGER_DEFAUT.galerie).slice(0, 6).map((url, i) => (
            <div key={i} className="photo-zoom" style={{
              borderRadius: 16, overflow: 'hidden',
              height: i === 0 || i === 3 ? 320 : 240,
              gridRow: i === 0 ? 'span 1' : undefined,
            }}>
              <img src={url} alt={`réalisation ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION DEVIS — Formulaire ───────────────────────────────────────────────

function SectionDevis({ config }: { config: ConfigPaysager }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const cfc = config.couleurFondCarte;

  const [form, setForm] = useState({ nom: '', email: '', telephone: '', service: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 18px',
    background: 'rgba(255,255,255,0.05)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: 50, fontSize: 14, color: '#fff',
    outline: 'none', fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color .2s',
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, entreprise: config.nomEntreprise, type: 'devis-paysager', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ background: config.couleurFond, padding: '0 40px 100px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>

        {/* Texte gauche */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Soumission gratuite</p>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 4vw, 60px)', color: '#fff', lineHeight: 1.0, letterSpacing: '-0.01em', marginBottom: 24 }}>
            {config.titreDevis.split(' ').map((mot, i, arr) => (
              i >= arr.length - 2
                ? <span key={i} style={{ color: ca }}>{mot} </span>
                : <span key={i}>{mot} </span>
            ))}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 400 }}>
            {config.sousTitreDevis}
          </p>
        </div>

        {/* Formulaire droite */}
        <div style={{ background: cfc, borderRadius: 24, padding: 40 }}>
          <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: 20, color: ca, marginBottom: 28, letterSpacing: '0.05em' }}>
            PLANIFIEZ VOTRE ENTRETIEN
          </h3>

          {envoye ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
              <h3 style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, color: '#fff', marginBottom: 12 }}>DEMANDE ENVOYÉE!</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Nous vous contacterons très rapidement.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                value={form.nom} placeholder="Nom complet"
                onChange={e => setForm({ ...form, nom: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = ca}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <input
                type="email" value={form.email} placeholder="Adresse courriel"
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = ca}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <input
                type="tel" value={form.telephone} placeholder="Numéro de téléphone"
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = ca}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <select
                value={form.service}
                onChange={e => setForm({ ...form, service: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = ca}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              >
                <option value="" style={{ background: '#1a2e1a' }}>Service souhaité</option>
                {(Array.isArray(config.servicesDevis) ? config.servicesDevis : CONFIG_PAYSAGER_DEFAUT.servicesDevis).map(s => <option key={s} value={s} style={{ background: '#1a2e1a' }}>{s}</option>)}
              </select>
              <button disabled={loading || !form.nom || !form.email}
                style={{
                  width: '100%', padding: '16px', background: ca,
                  color: config.couleurTexteSombre, border: 'none', borderRadius: 50,
                  fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                  fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em',
                  opacity: !form.nom || !form.email ? 0.5 : 1,
                  transition: 'filter .2s',
                  marginTop: 4,
                }}
                onMouseEnter={e => { if (form.nom && form.email) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(.88)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer ma demande →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CTA FINALE ───────────────────────────────────────────────────────

function SectionCTA({ config, setSection }: { config: ConfigPaysager; setSection: (s: string) => void }) {
  const parallax = useParallax(0.25);
  const ca = config.couleurAccent;

  const avis = Array.isArray(config.avis) && config.avis.length > 0 ? config.avis : CONFIG_PAYSAGER_DEFAUT.avis;
  const dernierAvis = avis[avis.length - 1];

  return (
    <section style={{ position: 'relative', overflow: 'hidden', minHeight: 520, display: 'flex', alignItems: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${config.photoCTA})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transform: `translateY(${parallax}px)`,
        filter: 'brightness(0.35)',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${config.couleurFond}dd, ${config.couleurFond}88)` }} />

      {/* Card avis flottante */}
      <div style={{
        position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '24px 28px',
        maxWidth: 300,
      }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#fff', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>
          "{dernierAvis?.texte}"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={dernierAvis?.photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ca}` }} />
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>{dernierAvis?.auteur}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{dernierAvis?.ville}</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '80px 40px' }}>
        <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 5vw, 72px)', color: '#fff', lineHeight: 1.0, letterSpacing: '-0.01em', marginBottom: 28, maxWidth: 600 }}>
          {config.titreCTA.toUpperCase()}
        </h2>
        <button onClick={() => setSection('devis')} style={{
          display: 'flex', alignItems: 'center', gap: 10, background: ca, color: config.couleurTexteSombre,
          border: 'none', borderRadius: 50, padding: '16px 32px', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', fontFamily: "'Inter', sans-serif",
          transition: 'filter .2s, transform .2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(.88)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}>
          <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${config.couleurTexteSombre}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>→</span>
          {config.boutonsDevis}
        </button>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setSection }: { config: ConfigPaysager; setSection: (s: string) => void }) {
  const ca = config.couleurAccent;
  const cfc = config.couleurFondCarte;
  const [email, setEmail] = useState('');

  return (
    <footer style={{ background: cfc, padding: '60px 40px 24px', borderTop: `1px solid rgba(181,226,74,0.1)` }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1.2fr 1.2fr', gap: 48, marginBottom: 48 }}>
          {/* Logo + desc */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, background: ca, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🌿</div>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, color: '#fff' }}>{config.nomEntreprise.toUpperCase()}</span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 220 }}>
              Nous sommes {config.nomEntreprise}, dédiés à créer de magnifiques espaces extérieurs.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, color: ca, marginBottom: 20, letterSpacing: '0.05em' }}>MENU</h4>
            {[['a-propos', 'À propos'], ['contact', 'Contact'], ['services', 'Services']].map(([id, label]) => (
              <p key={id} onClick={() => setSection(id)} style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 10, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = ca}
                onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.6)'}>
                {label}
              </p>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, color: ca, marginBottom: 20, letterSpacing: '0.05em' }}>CONTACT</h4>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{config.adresse}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{config.ville}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: ca, marginBottom: 6 }}>{config.email}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{config.telephone}</p>
          </div>

          {/* Horaires + infolettre */}
          <div>
            <h4 style={{ fontFamily: "'Anton', sans-serif", fontSize: 16, color: ca, marginBottom: 20, letterSpacing: '0.05em' }}>HEURES</h4>
            {(Array.isArray(config.horaires) ? config.horaires : CONFIG_PAYSAGER_DEFAUT.horaires).map((h, i) => (
              <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{h}</p>
            ))}
            <div style={{ marginTop: 20 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Votre courriel"
                style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', marginBottom: 8 }} />
              <button style={{ width: '100%', padding: '10px', background: ca, color: config.couleurTexteSombre, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                S'abonner à l'infolettre
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Politique de confidentialité</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© {new Date().getFullYear()} by {config.nomEntreprise}</p>
        </div>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplatePaysagerProps {
  config?: Partial<ConfigPaysager>;
  isPreview?: boolean;
}

export default function TemplatePaysager({ config: partiel, isPreview }: TemplatePaysagerProps) {
  // Sécuriser tous les tableaux — la BD peut retourner des strings ou null
  const ensureArray = <T,>(val: any, defaut: T[]): T[] =>
    Array.isArray(val) && val.length > 0 ? val : defaut;

  // Vérifier si les couleurs viennent d'un autre template (fond clair = pas paysager)
  // Si couleurFond est clair (commence par #f ou #e ou similaire), on ignore et on garde les défauts
  const isFondSombre = (c?: string) => {
    if (!c || typeof c !== 'string') return false;
    const hex = c.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (r * 299 + g * 587 + b * 114) / 1000;
    return luminance < 80; // sombre = luminance < 80 sur 255
  };

  // Si la couleur de fond n'est pas sombre, on considère que c'est un vestige d'un autre template
  // et on n'écrase pas les couleurs par défaut
  const couleursValides = isFondSombre(partiel?.couleurFond);

  const config: ConfigPaysager = {
    ...CONFIG_PAYSAGER_DEFAUT,
    ...partiel,
    // Toujours garder les couleurs sombres du paysager si la config vient d'un autre template
    couleurFond:        couleursValides ? (partiel?.couleurFond        || CONFIG_PAYSAGER_DEFAUT.couleurFond)        : CONFIG_PAYSAGER_DEFAUT.couleurFond,
    couleurFondCarte:   couleursValides ? (partiel?.couleurFondCarte   || CONFIG_PAYSAGER_DEFAUT.couleurFondCarte)   : CONFIG_PAYSAGER_DEFAUT.couleurFondCarte,
    couleurAccent:      couleursValides ? (partiel?.couleurAccent      || CONFIG_PAYSAGER_DEFAUT.couleurAccent)      : CONFIG_PAYSAGER_DEFAUT.couleurAccent,
    couleurTexte:       couleursValides ? (partiel?.couleurTexte       || CONFIG_PAYSAGER_DEFAUT.couleurTexte)       : CONFIG_PAYSAGER_DEFAUT.couleurTexte,
    couleurTexteSombre: couleursValides ? (partiel?.couleurTexteSombre || CONFIG_PAYSAGER_DEFAUT.couleurTexteSombre) : CONFIG_PAYSAGER_DEFAUT.couleurTexteSombre,
  };

  config.services     = ensureArray(partiel?.services,     CONFIG_PAYSAGER_DEFAUT.services);
  config.etapes       = ensureArray(partiel?.etapes,       CONFIG_PAYSAGER_DEFAUT.etapes);
  config.avis         = ensureArray(partiel?.avis,         CONFIG_PAYSAGER_DEFAUT.avis);
  config.stats        = ensureArray(partiel?.stats,        CONFIG_PAYSAGER_DEFAUT.stats);
  config.galerie      = ensureArray(partiel?.galerie,      CONFIG_PAYSAGER_DEFAUT.galerie);
  config.horaires     = ensureArray(partiel?.horaires,     CONFIG_PAYSAGER_DEFAUT.horaires);
  config.servicesDevis= ensureArray(partiel?.servicesDevis,CONFIG_PAYSAGER_DEFAUT.servicesDevis);
  const VALID_IDS_PAYSAGER = ['hero', 'apropos', 'services', 'processus', 'avis', 'galerie', 'devis', 'cta'];
  const rawSectionsPaysager = ensureArray(partiel?.sections, CONFIG_PAYSAGER_DEFAUT.sections);
  config.sections = rawSectionsPaysager.every((s: SectionConfig) => VALID_IDS_PAYSAGER.includes(s.id))
    ? rawSectionsPaysager
    : CONFIG_PAYSAGER_DEFAUT.sections;

  const [section, setSection] = useState('accueil');

  const handleSection = (s: string) => {
    setSection(s);
    if (!isPreview) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Rendu d'une section par son id — fonction appelée au moment du render
  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':      return <SectionHero      config={config} setSection={handleSection} />;
      case 'apropos':   return <SectionAPropos   config={config} setSection={handleSection} />;
      case 'services':  return <SectionServices  config={config} setSection={handleSection} />;
      case 'processus': return <SectionProcessus config={config} setSection={handleSection} />;
      case 'avis':      return <SectionAvis      config={config} />;
      case 'galerie':   return <SectionGalerie   config={config} />;
      case 'devis':     return <SectionDevis     config={config} />;
      case 'cta':       return <SectionCTA       config={config} setSection={handleSection} />;
      default:          return null;
    }
  };

  // Sections actives triées par ordre
  const sectionsAccueil = [...config.sections]
    .filter(s => s.actif)
    .sort((a, b) => a.ordre - b.ordre);

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .photo-zoom { overflow:hidden; }
        .photo-zoom img { transition: transform .7s ease; width:100%; height:100%; object-fit:cover; }
        .photo-zoom:hover img { transform: scale(1.07) rotate(.5deg); }
      `}</style>
      <Nav config={config} section={section} setSection={handleSection} />
      <div style={{ paddingTop: 68 }}>
        {section === 'accueil' && (
          <>
            {sectionsAccueil.map(s => (
              <div key={s.id}>
                {renderSection(s.id)}
              </div>
            ))}
            <Footer config={config} setSection={handleSection} />
          </>
        )}
        {section === 'a-propos' && (
          <>
            <SectionAPropos   config={config} setSection={handleSection} />
            <SectionProcessus config={config} setSection={handleSection} />
            <Footer config={config} setSection={handleSection} />
          </>
        )}
        {section === 'services' && (
          <>
            <SectionServices config={config} setSection={handleSection} />
            <SectionGalerie  config={config} />
            <SectionCTA      config={config} setSection={handleSection} />
            <Footer          config={config} setSection={handleSection} />
          </>
        )}
        {section === 'contact' && (
          <>
            <SectionDevis config={config} />
            <Footer config={config} setSection={handleSection} />
          </>
        )}
        {section === 'devis' && (
          <>
            <SectionDevis config={config} />
            <Footer config={config} setSection={handleSection} />
          </>
        )}
      </div>
    </div>
  );
}