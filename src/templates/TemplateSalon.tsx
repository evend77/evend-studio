// src/templates/TemplateSalon.tsx
import { useIsMobile } from '../hooks/useIsMobile';
// e-Vend Studio — Template Salon de Coiffure & Beauté
// Style : violet doux / jaune citron / crème ivoire — Typographie serif + italic
// Effets : page-flip au scroll, photos twist 3D, parallax hero, galerie scroll horizontal

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ServiceSalon {
  nom: string;
  sousNom: string;    // ex: "Cut · Blowdry · Updo's"
  description: string;
  prix: string;
  duree: string;      // ex: "1h"
  photo: string;
  categorie: string;  // ex: "Coupe", "Couleur", "Soin"
}

export interface MembreSalon {
  nom: string;
  role: string;
  photo: string;
}

export interface ConfigSalon {
  nomSalon: string;
  slogan: string;
  description: string;
  logoUrl: string;
  photoHero: string;
  photoAPropos1: string;
  photoAPropos2: string;

  // Couleurs
  couleurPrimaire: string;   // ex: violet #7b7cb6
  couleurAccent: string;     // ex: jaune citron #d4e44a
  couleurFond: string;       // ex: crème #f5f0e8
  couleurFondSombre: string; // ex: violet foncé #5c5ca0
  couleurTexte: string;

  // Services
  services: ServiceSalon[];

  // Équipe
  equipe: MembreSalon[];

  // Galerie transformations
  galerie: string[];

  // Réservation (horaires gérés dans GestionReservations)
  boutonReservationTexte: string;
  messageReservation: string;

  // À propos
  aPropsTitre: string;
  aPropsTexte1: string;
  aPropsTexte2: string;

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string;

  // Instagram
  instagramHandle: string;

  // e-Vend Studio
  vendeurId?: number;
}

export const CONFIG_SALON_DEFAUT: ConfigSalon = {
  nomSalon: 'Élara Salon',
  slogan: 'Nous faisons vos cheveux autrement',
  description: 'Situé au cœur de la ville, Élara est un salon moderne créé pour vous offrir l\'expérience ultime en soins capillaires.',
  logoUrl: '',
  photoHero: 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos1: 'https://images.pexels.com/photos/3992875/pexels-photo-3992875.jpeg?auto=compress&cs=tinysrgb&w=800',
  photoAPropos2: 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=800',

  couleurPrimaire: '#7b7cb6',
  couleurAccent: '#d4e44a',
  couleurFond: '#f5f0e8',
  couleurFondSombre: '#5c5ca0',
  couleurTexte: '#1a1a1a',

  services: [
    { nom: 'Coupe & Style', sousNom: 'Cut · Blowdry · Updo\'s', description: 'Nos stylistes créent un look sur-mesure adapté à votre personnalité et vos besoins.', prix: 'À partir de 75$', duree: '1h', photo: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800', categorie: 'Coupe' },
    { nom: 'Couleur', sousNom: 'Balayage · Mèches · Teinture', description: 'Nous utilisons des produits haut de gamme pour obtenir des teintes vibrantes et personnalisées.', prix: 'À partir de 120$', duree: '2h', photo: 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800', categorie: 'Couleur' },
    { nom: 'Soins', sousNom: 'Hydratation · Kératine · Botox', description: 'Une gamme de traitements pour nourrir, renforcer et revitaliser vos cheveux en profondeur.', prix: 'À partir de 90$', duree: '1h30', photo: 'https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=800', categorie: 'Soin' },
  ],

  equipe: [
    { nom: 'Sophie M.', role: 'Fondatrice & Directrice artistique', photo: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { nom: 'Léa R.', role: 'Styliste', photo: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { nom: 'Camille N.', role: 'Coloriste', photo: 'https://images.pexels.com/photos/3765114/pexels-photo-3765114.jpeg?auto=compress&cs=tinysrgb&w=600' },
  ],

  galerie: [
    'https://images.pexels.com/photos/3993437/pexels-photo-3993437.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3992875/pexels-photo-3992875.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],

  boutonReservationTexte: 'Réserver maintenant',
  messageReservation: 'Choisissez votre service et votre styliste préféré(e). Nous vous confirmerons votre rendez-vous sous 24h.',

  aPropsTitre: 'Nous faisons les cheveux autrement',
  aPropsTexte1: 'Chez Élara, chaque client est unique. De la santé de vos cheveux à votre style recherché, nous veillons à ce que vous receviez le meilleur traitement.',
  aPropsTexte2: 'Notre mission : que vous vous sentiez au meilleur de vous-même en quittant notre salon.',

  adresse: '123 rue Laurier Ouest',
  ville: 'Montréal, QC H2T 2N3',
  telephone: '(514) 555-0199',
  email: 'info@elarasalon.ca',
  horaires: 'Lun – Dim : 10h – 18h',

  instagramHandle: '@elarasalon',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useParallax() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * 0.4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return offset;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

interface NavProps { config: ConfigSalon; page: string; setPage: (p: string) => void; }

function Nav({ config, page, setPage }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const cp = config.couleurPrimaire;
  const ca = config.couleurAccent;

  const navLinks = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'a-propos', label: 'À propos' },
    { id: 'contact', label: 'Contact' },
    { id: 'services', label: 'Services' },
    { id: 'reservations', label: 'Réservations' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');
        .salon-nav-link { cursor:pointer; font-size:14px; font-weight:500; letter-spacing:0.05em; padding:6px 4px; border-bottom:2px solid transparent; transition:border-color 0.2s, color 0.2s; font-family:'Inter',sans-serif; background:none; border-top:none; border-left:none; border-right:none; }
        .salon-nav-link:hover { border-bottom-color:${ca}; color:${ca}; }
        .salon-nav-link.active { border-bottom-color:${ca}; color:${ca}; }
      `}</style>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? cp : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 0.4s, backdrop-filter 0.4s',
        borderRadius: scrolled ? '0 0 20px 20px' : '0',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div
            onClick={() => setPage('accueil')}
            style={{ cursor: 'pointer', fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '0.1em' }}
          >
            {config.nomSalon.toUpperCase()}
          </div>

          {/* Desktop links */}
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {navLinks.map(l => (
              <button
                key={l.id}
                className={`salon-nav-link${page === l.id ? ' active' : ''}`}
                onClick={() => { setPage(l.id); setMenuOpen(false); }}
                style={{ color: page === l.id ? ca : '#fff' }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── PAGE ACCUEIL ─────────────────────────────────────────────────────────────

function PageAccueil({ config, setPage }: { config: ConfigSalon; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const parallax = useParallax();
  const cp = config.couleurPrimaire;
  const ca = config.couleurAccent;
  const cf = config.couleurFond;
  const cs = config.couleurFondSombre;

  // Scroll reveal hooks
  const rv1 = useScrollReveal(0.1);
  const rv2 = useScrollReveal(0.1);
  const rv3 = useScrollReveal(0.1);
  const rv4 = useScrollReveal(0.1);
  const rv5 = useScrollReveal(0.1);
  const rv6 = useScrollReveal(0.05);
  const rv7 = useScrollReveal(0.1);

  // Galerie scroll
  const galerieRef = useRef<HTMLDivElement>(null);

  const scrollGalerie = (dir: number) => {
    if (galerieRef.current) galerieRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  // Service actif (slider)
  const [serviceActif, setServiceActif] = useState(0);
  const services = config.services;

  useEffect(() => {
    const id = setInterval(() => setServiceActif(s => (s + 1) % services.length), 4000);
    return () => clearInterval(id);
  }, [services.length]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: config.couleurTexte, background: cf }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Inter:wght@300;400;500;600&display=swap');

        /* === HERO === */
        .salon-hero-text { animation: slideUp 1.1s cubic-bezier(.22,1,.36,1) both; }
        @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }

        /* === BOOK FLIP === */
        .book-container { perspective: 1200px; }
        .book-page {
          transform-style: preserve-3d;
          transition: transform 0.9s cubic-bezier(.45,.05,.55,.95);
          transform-origin: left center;
        }
        .book-page.flipped { transform: rotateY(-160deg); }
        .book-page-back { position:absolute; top:0; left:0; width:100%; height:100%; backface-visibility:hidden; transform:rotateY(180deg); }
        .book-page-front { backface-visibility:hidden; }

        /* === TWIST PHOTO === */
        .twist-photo {
          transition: transform 0.8s cubic-bezier(.34,1.56,.64,1), box-shadow 0.4s;
          cursor:pointer;
        }
        .twist-photo:hover { transform: perspective(800px) rotateY(-8deg) rotateX(4deg) scale(1.04); box-shadow: 20px 20px 50px rgba(0,0,0,0.25); }

        /* === SCROLL REVEAL === */
        .reveal { opacity:0; transform:translateY(50px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .reveal.visible { opacity:1; transform:translateY(0); }
        .reveal-left { opacity:0; transform:translateX(-60px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .reveal-left.visible { opacity:1; transform:translateX(0); }
        .reveal-right { opacity:0; transform:translateX(60px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .reveal-right.visible { opacity:1; transform:translateX(0); }

        /* === BTN === */
        .salon-btn-accent {
          background: ${ca}; color: #1a1a1a; border:none; border-radius:50px; padding:16px 40px;
          font-size:14px; font-weight:600; letter-spacing:0.08em; cursor:pointer;
          transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
          font-family:'Inter',sans-serif;
        }
        .salon-btn-accent:hover { transform:scale(1.04); box-shadow:0 8px 30px rgba(0,0,0,0.2); filter:brightness(1.05); }
        .salon-btn-outline {
          background:transparent; color:#fff; border:2px solid #fff; border-radius:50px; padding:14px 36px;
          font-size:14px; font-weight:500; letter-spacing:0.08em; cursor:pointer;
          transition: background 0.2s, color 0.2s;
          font-family:'Inter',sans-serif;
        }
        .salon-btn-outline:hover { background:#fff; color:${cp}; }

        /* === GALERIE SCROLL === */
        .galerie-scroll::-webkit-scrollbar { height:4px; }
        .galerie-scroll::-webkit-scrollbar-track { background:transparent; }
        .galerie-scroll::-webkit-scrollbar-thumb { background:${cp}60; border-radius:2px; }

        /* === BADGE CIRCULAIRE === */
        @keyframes rotateBadge { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .badge-rotate { animation: rotateBadge 10s linear infinite; transform-origin:center; }

        /* === SERVICE SLIDE === */
        .service-slide { transition: opacity 0.5s ease, transform 0.5s ease; }

        /* === CARTE EQUIPE === */
        .carte-equipe { transition: transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s; }
        .carte-equipe:hover { transform: translateY(-8px) rotate(-1deg); box-shadow: 0 20px 50px rgba(0,0,0,0.15); }

        /* === FOOTER GÉANT === */
        .footer-nom { font-size: clamp(40px, 8vw, 110px); line-height:1; letter-spacing:-0.02em; }
      `}</style>

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Photo parallax */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${config.photoHero})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transform: `translateY(${parallax}px)`,
          filter: 'brightness(0.55)',
        }} />

        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${cp}33, transparent 40%, ${cp}66)` }} />

        {/* Texte */}
        <div className="salon-hero-text" style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: '0 24px', maxWidth: 800 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(13px, 1.5vw, 16px)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20, opacity: 0.85, animationDelay: '0.2s' }}>
            {config.nomSalon}
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 6vw, 80px)', fontWeight: 300, lineHeight: 1.1, marginBottom: 32 }}>
            {config.slogan.split(' ').map((mot, i, arr) => (
              i === arr.length - 1
                ? <em key={i} style={{ fontStyle: 'italic' }}>{mot}</em>
                : <span key={i}>{mot} </span>
            ))}
          </h1>
          <p style={{ fontSize: 'clamp(14px, 1.6vw, 17px)', opacity: 0.85, marginBottom: 40, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            {config.description}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="salon-btn-accent" onClick={() => setPage('reservations')}>
              {config.boutonReservationTexte}
            </button>
            <button className="salon-btn-outline" onClick={() => setPage('services')}>
              Nos services
            </button>
          </div>
        </div>

        {/* Badge circulaire */}
        <div style={{ position: 'absolute', bottom: 80, right: 60, width: 110, height: 110 }}>
          <svg viewBox="0 0 110 110" style={{ width: '100%', height: '100%' }}>
            <defs>
              <path id="circle-text" d="M55,55 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
            </defs>
            <circle cx="55" cy="55" r="50" fill={ca} />
            <g className="badge-rotate">
              <text fill="#1a1a1a" fontSize="9.5" fontWeight="600" fontFamily="Inter,sans-serif" letterSpacing="2.5">
                <textPath href="#circle-text">RÉSERVER • MAINTENANT • RÉSERVER • MAINTENANT •</textPath>
              </text>
            </g>
            <text x="55" y="50" textAnchor="middle" fill="#1a1a1a" fontSize="13" fontFamily="'Cormorant Garamond',serif" fontStyle="italic">Book</text>
            <text x="55" y="67" textAnchor="middle" fill="#1a1a1a" fontSize="13" fontFamily="'Cormorant Garamond',serif" fontStyle="italic">Now</text>
          </svg>
        </div>

        {/* Texte défilant bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', height: 56, background: `${cp}cc`, display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', gap: isMobile ? 32 : 80, animation: 'marquee 18s linear infinite', whiteSpace: 'nowrap',
            fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: '#fff', opacity: 0.9,
          }}>
            {[...Array(4)].map((_, i) => (
              <span key={i}>
                Coupe &amp; Style &nbsp;·&nbsp; Couleur &nbsp;·&nbsp; Soins &nbsp;·&nbsp; Balayage &nbsp;·&nbsp; Kératine &nbsp;·&nbsp;
              </span>
            ))}
          </div>
          <style>{`@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
        </div>
      </section>

      {/* ══ 2. À PROPOS — BOOK FLIP ══════════════════════════════════════════ */}
      <section style={{ background: cf, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>

          {/* Texte gauche */}
          <div ref={rv1.ref} className={`reveal-left${rv1.visible ? ' visible' : ''}`}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 20 }}>À propos</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 400, lineHeight: 1.15, marginBottom: 24 }}>
              {config.aPropsTitre.split(' ').slice(0, 3).join(' ')}{' '}
              <em style={{ fontStyle: 'italic', color: cp }}>{config.aPropsTitre.split(' ').slice(3).join(' ')}</em>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#555', marginBottom: 16 }}>{config.aPropsTexte1}</p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: cp, fontStyle: 'italic' }}>{config.aPropsTexte2}</p>
            <div style={{ marginTop: 36 }}>
              <button className="salon-btn-accent" onClick={() => setPage('reservations')}>
                Réserver →
              </button>
            </div>
          </div>

          {/* Book flip photos droite */}
          <div ref={rv2.ref} className={`reveal-right${rv2.visible ? ' visible' : ''}`}>
            <BookFlip photo1={config.photoAPropos1} photo2={config.photoAPropos2} cp={cp} ca={ca} />
          </div>
        </div>
      </section>

      {/* ══ 3. NOS SERVICES — Slider avec photo ovale ══════════════════════════ */}
      <section style={{ background: cp, padding: '100px 24px' }}>
        <div ref={rv3.ref} className={`reveal${rv3.visible ? ' visible' : ''}`} style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 24 : 60, alignItems: 'center' }}>

          {/* Texte */}
          <div style={{ color: '#fff' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 20 }}>Ce que nous offrons</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 300, lineHeight: 1.1, marginBottom: 32 }}>
              Nos <em style={{ fontStyle: 'italic' }}>services</em>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.85, marginBottom: 32, maxWidth: 380 }}>
              Chez {config.nomSalon}, nous prenons soin de chaque client. De la santé de vos cheveux à votre style, nous vous offrons le meilleur.
            </p>
            <button className="salon-btn-accent" onClick={() => setPage('services')} style={{ marginBottom: 40 }}>
              Voir tous les services
            </button>

            {/* Indicateurs */}
            <div style={{ display: 'flex', gap: 10 }}>
              {services.map((_, i) => (
                <button key={i} onClick={() => setServiceActif(i)} style={{
                  width: i === serviceActif ? 28 : 10, height: 10,
                  borderRadius: 5, border: 'none', cursor: 'pointer',
                  background: i === serviceActif ? ca : 'rgba(255,255,255,0.35)',
                  transition: 'width 0.3s, background 0.3s',
                }} />
              ))}
            </div>
          </div>

          {/* Photo ovale + nom service (twist) */}
          <div style={{ position: 'relative' }}>
            {services.map((s, i) => (
              <div key={i} className="twist-photo" style={{
                position: i === 0 ? 'relative' : 'absolute',
                top: 0, left: 0,
                opacity: i === serviceActif ? 1 : 0,
                transform: i === serviceActif ? 'perspective(800px) rotateY(0deg)' : 'perspective(800px) rotateY(15deg)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
                pointerEvents: i === serviceActif ? 'auto' : 'none',
              }}>
                <div style={{
                  borderRadius: '50% 40% 55% 40% / 50% 45% 55% 50%',
                  overflow: 'hidden',
                  width: '100%',
                  aspectRatio: '3/4',
                  maxHeight: 520,
                }}>
                  <img src={s.photo} alt={s.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* Étiquette nom */}
                <div style={{
                  position: 'absolute', bottom: 30, right: -20,
                  background: ca, borderRadius: 12, padding: '12px 24px',
                  fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic',
                  color: '#1a1a1a', fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                }}>
                  {s.nom}<br />
                  <span style={{ fontSize: 12, fontStyle: 'normal', fontFamily: "'Inter', sans-serif", fontWeight: 400, opacity: 0.8 }}>{s.sousNom}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. TRANSFORMATIONS — Galerie scroll horizontal ════════════════════ */}
      <section style={{ background: cf, padding: '100px 0' }}>
        <div ref={rv4.ref} className={`reveal${rv4.visible ? ' visible' : ''}`}>
          <div style={{ textAlign: 'center', marginBottom: 48, padding: '0 24px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4.5vw, 58px)', fontWeight: 400 }}>
              Hair <em style={{ fontStyle: 'italic', color: cp }}>transformations</em>
            </h2>
            <p style={{ fontSize: 14, color: '#888', marginTop: 12, maxWidth: 500, margin: '12px auto 0' }}>
              Découvrez quelques-unes de nos transformations réalisées par notre équipe de stylistes passionnés.
            </p>
          </div>

          {/* Badge scroll */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <div style={{ position: 'absolute', left: 60, top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: ca, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontStyle: 'italic', color: '#1a1a1a' }}>Scroll</span>
              </div>
            </div>

            {/* Galerie */}
            <div ref={galerieRef} className="galerie-scroll" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 120px 16px', scrollSnapType: 'x mandatory' }}>
              {config.galerie.map((url, i) => (
                <div key={i} className="twist-photo" style={{
                  flexShrink: 0, width: 280, height: 360,
                  borderRadius: i % 2 === 0 ? '40% 40% 45% 45% / 50% 50% 55% 55%' : '45% 45% 40% 40% / 55% 55% 50% 50%',
                  overflow: 'hidden', scrollSnapAlign: 'start',
                }}>
                  <img src={url} alt={`transformation ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Bouton navigation */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button onClick={() => scrollGalerie(-1)} style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${cp}`, background: 'transparent', cursor: 'pointer', fontSize: 18, color: cp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
            <button className="salon-btn-accent" onClick={() => setPage('reservations')}>
              Réserver →
            </button>
            <button onClick={() => scrollGalerie(1)} style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${cp}`, background: 'transparent', cursor: 'pointer', fontSize: 18, color: cp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
          </div>
        </div>
      </section>

      {/* ══ 5. L'ESPACE / THE SPACE ══════════════════════════════════════════ */}
      <section style={{ background: cp, padding: '100px 24px' }}>
        <div ref={rv5.ref} className={`reveal${rv5.visible ? ' visible' : ''}`} style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
          <div style={{ color: '#fff' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 20 }}>Notre espace</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 4vw, 58px)', fontWeight: 300, lineHeight: 1.1, marginBottom: 24 }}>
              The <em style={{ fontStyle: 'italic' }}>space</em>
            </h2>
            <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.3)', marginBottom: 32 }} />
            <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.85, marginBottom: 16, maxWidth: 420 }}>
              Notre salon luxueux au cœur de la ville propose des intérieurs chic et modernes avec un mobilier élégant et une atmosphère sereine et accueillante.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, opacity: 0.75, maxWidth: 420 }}>
              L'espace a été pensé pour que chaque client vive une expérience confortable et indulgente lors de sa visite.
            </p>
            <div style={{ marginTop: 40 }}>
              <button className="salon-btn-outline" onClick={() => setPage('reservations')}>
                Réserver maintenant
              </button>
            </div>
          </div>

          {/* Photos empilées avec twist */}
          <div style={{ position: 'relative', height: 500 }}>
            <div className="twist-photo" style={{
              position: 'absolute', top: 0, left: 0, width: '75%', height: '70%',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <img src={config.photoAPropos1} alt="salon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="twist-photo" style={{
              position: 'absolute', bottom: 0, right: 0, width: '65%', height: '65%',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: `4px solid ${cf}`,
            }}>
              <img src={config.photoAPropos2} alt="salon intérieur" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {/* Badge */}
            <div style={{
              position: 'absolute', bottom: 40, right: -10, width: 100, height: 100,
              zIndex: 10,
            }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                <defs><path id="c2" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" /></defs>
                <circle cx="50" cy="50" r="46" fill={ca} />
                <g className="badge-rotate">
                  <text fill="#1a1a1a" fontSize="8.5" fontWeight="600" fontFamily="Inter,sans-serif" letterSpacing="2">
                    <textPath href="#c2">Book Now • Book Now • Book Now • </textPath>
                  </text>
                </g>
                <text x="50" y="55" textAnchor="middle" fill="#1a1a1a" fontSize="20" fontFamily="'Cormorant Garamond',serif" fontStyle="italic">✂</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 6. ÉQUIPE ════════════════════════════════════════════════════════ */}
      <section style={{ background: cf, padding: '100px 24px' }}>
        <div ref={rv6.ref} className={`reveal${rv6.visible ? ' visible' : ''}`} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Notre équipe</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 400 }}>
              Meet the <em style={{ fontStyle: 'italic', color: cp }}>team</em>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(config.equipe.length, 3)}, 1fr)`, gap: 32 }}>
            {config.equipe.map((m, i) => (
              <div key={i} className="carte-equipe" style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', position: 'relative' }}>
                {/* Badge rôle */}
                <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: ca, borderRadius: 50, padding: '6px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a', zIndex: 2, whiteSpace: 'nowrap' }}>
                  {m.role}
                </div>
                {/* Photo */}
                <div style={{ height: 380, overflow: 'hidden' }}>
                  <img src={m.photo} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>
                {/* Nom */}
                <div style={{ background: ca, padding: '14px 20px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: '#1a1a1a', fontWeight: 600 }}>{m.nom}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 7. CTA RÉSERVATION ═══════════════════════════════════════════════ */}
      <section ref={rv7.ref} className={`reveal${rv7.visible ? ' visible' : ''}`} style={{ background: ca, padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 400, color: '#1a1a1a', marginBottom: 16 }}>
          Prêt(e) à vivre l'expérience <em style={{ fontStyle: 'italic' }}>{config.nomSalon}</em> ?
        </h2>
        <p style={{ fontSize: 15, color: '#333', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>
          {config.messageReservation}
        </p>
        <button onClick={() => setPage('reservations')} style={{
          background: '#1a1a1a', color: ca, border: 'none', borderRadius: 50, padding: '18px 48px',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em',
          fontFamily: "'Inter', sans-serif",
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}>
          {config.boutonReservationTexte}
        </button>
      </section>

      {/* ══ 8. FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{ background: ca, padding: '60px 40px 30px' }}>
        {/* Nom géant */}
        <div className="footer-nom" style={{
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
          color: '#1a1a1a', marginBottom: 48, lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {config.nomSalon.toUpperCase()}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, borderTop: '1px solid rgba(0,0,0,0.15)', paddingTop: 40, marginBottom: 32 }}>
          {/* Description */}
          <div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#333', maxWidth: 260 }}>{config.aPropsTexte1}</p>
          </div>
          {/* Horaires */}
          <div>
            <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: '#1a1a1a', marginBottom: 12 }}>Opening Hours</h4>
            <p style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>{config.adresse}</p>
            <p style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>{config.ville}</p>
            <p style={{ fontSize: 14, color: '#333' }}>{config.horaires}</p>
          </div>
          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: '#1a1a1a', marginBottom: 12 }}>Contact</h4>
            <p style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>{config.email}</p>
            <p style={{ fontSize: 14, color: '#333' }}>{config.telephone}</p>
          </div>
          {/* Suivre */}
          <div>
            <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontStyle: 'italic', color: '#1a1a1a', marginBottom: 12 }}>Follow</h4>
            <p style={{ fontSize: 14, color: '#333' }}>{config.instagramHandle}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#555' }}>© {new Date().getFullYear()} by {config.nomSalon}</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ fontSize: 12, color: '#555', cursor: 'pointer' }}>Politique de confidentialité</span>
            <span style={{ fontSize: 12, color: '#555', cursor: 'pointer' }}>Conditions d'utilisation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── COMPOSANT BOOK FLIP ──────────────────────────────────────────────────────

function BookFlip({ photo1, photo2, cp, ca }: { photo1: string; photo2: string; cp: string; ca: string }) {
  const { isMobile } = useIsMobile();
  const [flipped, setFlipped] = useState(false);
  const [autoFlip, setAutoFlip] = useState(true);

  useEffect(() => {
    if (!autoFlip) return;
    const id = setInterval(() => setFlipped(f => !f), 3500);
    return () => clearInterval(id);
  }, [autoFlip]);

  return (
    <div
      className="book-container"
      style={{ position: 'relative', height: 500, cursor: 'pointer' }}
      onClick={() => { setAutoFlip(false); setFlipped(f => !f); }}
      title="Cliquez pour tourner la page"
    >
      {/* Page fond (photo 2) — toujours visible dessous */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <img src={photo2} alt="salon 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Page avant (photo 1) — tourne comme un livre */}
      <div className={`book-page${flipped ? ' flipped' : ''}`} style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        {/* Face avant */}
        <div className="book-page-front" style={{ position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '4px 8px 40px rgba(0,0,0,0.2)' }}>
          <img src={photo1} alt="salon 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Hint */}
          <div style={{ position: 'absolute', bottom: 20, right: 20, background: ca, borderRadius: 50, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>
            ← Cliquez
          </div>
        </div>
        {/* Face arrière */}
        <div className="book-page-back" style={{ position: 'absolute', inset: 0, borderRadius: 24, overflow: 'hidden', background: cp }}>
          <img src={photo2} alt="salon 2 dos" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        </div>
      </div>

      {/* Ombre de reliure */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)', zIndex: 3, borderRadius: '24px 0 0 24px' }} />
    </div>
  );
}

// ─── PAGE À PROPOS ────────────────────────────────────────────────────────────

function PageAPropos({ config, setPage }: { config: ConfigSalon; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const cp = config.couleurPrimaire;
  const ca = config.couleurAccent;
  const cf = config.couleurFond;
  const rv1 = useScrollReveal(0.05);
  const rv2 = useScrollReveal(0.05);

  return (
    <div style={{ background: cf, minHeight: '100vh', paddingTop: 100, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');`}</style>

      {/* Hero about */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 80px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        <div ref={rv1.ref} className={`reveal-left${rv1.visible ? ' visible' : ''}`}>
          <style>{`.reveal-left{opacity:0;transform:translateX(-60px);transition:opacity .8s ease,transform .8s ease}.reveal-left.visible{opacity:1;transform:translateX(0)}`}</style>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 16 }}>Notre histoire</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 28 }}>
            {config.aPropsTitre.split(' ').slice(0, 3).join(' ')}{' '}
            <em style={{ fontStyle: 'italic', color: cp }}>{config.aPropsTitre.split(' ').slice(3).join(' ')}</em>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: '#555', marginBottom: 20 }}>{config.aPropsTexte1}</p>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: '#666', fontStyle: 'italic', marginBottom: 36 }}>{config.aPropsTexte2}</p>
          <button
            className="salon-btn-accent"
            onClick={() => setPage('reservations')}
            style={{ background: ca, color: '#1a1a1a', border: 'none', borderRadius: 50, padding: '16px 40px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em' }}
          >
            Réserver maintenant
          </button>
        </div>
        <div ref={rv2.ref} style={{ opacity: rv2.visible ? 1 : 0, transform: rv2.visible ? 'none' : 'translateX(60px)', transition: 'all 0.8s ease' }}>
          <BookFlip photo1={config.photoAPropos1} photo2={config.photoAPropos2} cp={cp} ca={ca} />
        </div>
      </div>

      {/* Valeurs */}
      <div style={{ background: cp, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, textAlign: 'center' }}>
          {[
            { icon: '✂️', titre: 'Expertise', texte: 'Stylistes certifiés avec des années d\'expérience et une passion pour leur métier.' },
            { icon: '🌿', titre: 'Produits premium', texte: 'Nous utilisons uniquement des produits respectueux de vos cheveux et de l\'environnement.' },
            { icon: '💛', titre: 'Expérience client', texte: 'Chaque visite est une expérience personnalisée du début à la fin.' },
          ].map((v, i) => (
            <div key={i} style={{ color: '#fff' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic', marginBottom: 12 }}>{v.titre}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.85 }}>{v.texte}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Équipe */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 400 }}>
            Meet the <em style={{ fontStyle: 'italic', color: cp }}>team</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(config.equipe.length, 3)}, 1fr)`, gap: 28 }}>
          {config.equipe.map((m, i) => (
            <div key={i} style={{ borderRadius: 20, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', transition: 'transform 0.3s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', background: ca, borderRadius: 50, padding: '5px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a', zIndex: 2, whiteSpace: 'nowrap' }}>
                {m.role}
              </div>
              <div style={{ height: 320, overflow: 'hidden' }}>
                <img src={m.photo} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ background: ca, padding: '12px 16px', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic', color: '#1a1a1a', fontWeight: 600 }}>{m.nom}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE SERVICES ────────────────────────────────────────────────────────────

function PageServices({ config, setPage }: { config: ConfigSalon; setPage: (p: string) => void }) {
  const cp = config.couleurPrimaire;
  const ca = config.couleurAccent;
  const cf = config.couleurFond;

  const categories = Array.from(new Set(['Tous', ...config.services.map(s => s.categorie)]));
  const [catActive, setCatActive] = useState('Tous');
  const servicesFiltres = catActive === 'Tous' ? config.services : config.services.filter(s => s.categorie === catActive);

  return (
    <div style={{ background: cf, minHeight: '100vh', paddingTop: 100, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400;1,600&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* Hero services */}
      <div style={{ textAlign: 'center', padding: '60px 24px 48px' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 400 }}>
          Book in your <em style={{ fontStyle: 'italic', color: cp }}>service</em>
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 12 }}>Réservez votre prestation directement depuis notre agenda.</p>
      </div>

      {/* Filtres catégories */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', padding: '0 24px 48px' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCatActive(c)} style={{
            padding: '8px 22px', borderRadius: 50,
            border: `2px solid ${catActive === c ? cp : '#ddd'}`,
            background: catActive === c ? cp : 'transparent',
            color: catActive === c ? '#fff' : '#555',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* Liste services */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        {servicesFiltres.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #e5e0d8', padding: '24px 0',
            gap: 20,
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, color: '#1a1a1a' }}>{s.nom}</h3>
              <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.description}</p>
            </div>
            <div style={{ textAlign: 'center', minWidth: 80 }}>
              <p style={{ fontSize: 14, color: '#666' }}>{s.duree}</p>
              <p style={{ fontSize: 14, color: '#666', fontStyle: 'italic' }}>{s.prix}</p>
            </div>
            <button
              onClick={() => setPage('reservations')}
              style={{
                background: cp, color: '#fff', border: 'none', borderRadius: 50, padding: '10px 24px',
                fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                transition: 'filter 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.9)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}
            >
              Réserver
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE CONTACT ─────────────────────────────────────────────────────────────

function PageContact({ config }: { config: ConfigSalon }) {
  const { isMobile } = useIsMobile();
  const cp = config.couleurPrimaire;
  const ca = config.couleurAccent;
  const cf = config.couleurFond;

  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, salonNom: config.nomSalon, type: 'salon', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true);
    setLoading(false);
  };

  return (
    <div style={{ background: ca, minHeight: '100vh', paddingTop: 80, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400;1,600&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* Hero contact */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 40, alignItems: 'start', minHeight: '50vh' }}>
        {/* Photo avec overlay texte */}
        <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', height: 420 }}>
          <img src={config.photoHero} alt="contact" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} />
          <div style={{ position: 'absolute', bottom: 40, left: 40 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 3vw, 48px)', fontWeight: 400, color: '#fff', lineHeight: 1.1 }}>
              Contact <em style={{ fontStyle: 'italic' }}>Us</em>
            </h1>
          </div>
        </div>

        {/* Infos */}
        <div style={{ background: cf, borderRadius: 24, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 420, boxSizing: 'border-box' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontStyle: 'italic', color: '#1a1a1a', marginBottom: 24 }}>
            Get in touch
          </h2>
          <p style={{ fontSize: 14, color: cp, marginBottom: 6 }}>{config.email}</p>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 24 }}>{config.telephone}</p>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>{config.adresse}</p>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 32 }}>{config.ville}</p>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontStyle: 'italic', color: '#1a1a1a', marginBottom: 12 }}>
            Opening Hours
          </h3>
          <p style={{ fontSize: 14, color: '#555' }}>{config.horaires}</p>
        </div>
      </div>

      {/* Formulaire contact */}
      <div style={{ background: cf, margin: '0 24px 0', borderRadius: 24, maxWidth: 1200 - 48, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ padding: isMobile ? '48px 20px' : '60px 48px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 400, textAlign: 'center', marginBottom: 12, color: '#1a1a1a' }}>
            Contact Form
          </h2>
          <p style={{ textAlign: 'center', fontSize: 14, color: cp, marginBottom: 40 }}>
            Remplissez le formulaire et nous vous répondrons dans les plus brefs délais.
          </p>

          {envoye ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: '#1a1a1a' }}>Message envoyé!</h3>
              <p style={{ color: '#666', marginTop: 12 }}>Nous vous répondrons bientôt.</p>
            </div>
          ) : (
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Prénom</label>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom"
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any, fontFamily: "'Inter', sans-serif" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Nom</label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom"
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any, fontFamily: "'Inter', sans-serif" }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Courriel *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com"
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any, fontFamily: "'Inter', sans-serif" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Téléphone</label>
                  <input type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="(514) 555-0000"
                    style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any, fontFamily: "'Inter', sans-serif" }} />
                </div>
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Message *</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Votre message..." rows={5}
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' as any }} />
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.email || !form.message}
                style={{
                  width: '100%', padding: '16px', background: cp, color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif",
                  opacity: !form.email || !form.message ? 0.5 : 1,
                  transition: 'filter 0.2s',
                }}
              >
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}

// ─── PAGE RÉSERVATIONS ────────────────────────────────────────────────────────

function PageReservations({ config, vendeurId }: { config: ConfigSalon; vendeurId?: string }) {
  const { isMobile } = useIsMobile();
  const cp = config.couleurPrimaire;
  const ca = config.couleurAccent;
  const cf = config.couleurFond;

  const [etape, setEtape] = useState<'service' | 'horaire' | 'info' | 'confirm'>('service');
  const [serviceChoisi, setServiceChoisi] = useState<ServiceSalon | null>(null);
  const [creneaux, setCreneaux] = useState<{ date: string; heure: string; id: number }[]>([]);
  const [creneauChoisi, setCreneauChoisi] = useState<{ date: string; heure: string; id: number } | null>(null);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [erreur, setErreur] = useState('');
  const [mois, setMois] = useState(new Date());

  // Charger les créneaux disponibles via l'API GestionReservations
  useEffect(() => {
    if (etape !== 'horaire' || !vendeurId) return;
    setLoading(true);
    const debut = new Date(mois.getFullYear(), mois.getMonth(), 1).toISOString().split('T')[0];
    const fin = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).toISOString().split('T')[0];
    fetch(`/api/studio/reservations/creneaux?vendeurId=${vendeurId}&debut=${debut}&fin=${fin}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCreneaux(data); setLoading(false); })
      .catch(() => { setCreneaux([]); setLoading(false); });
  }, [etape, vendeurId, mois]);

  const confirmerReservation = async () => {
    if (!serviceChoisi || !creneauChoisi) return;
    setLoading(true);
    try {
      const res = await fetch('/api/studio/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendeurId, service: serviceChoisi.nom, creneauId: creneauChoisi.id,
          date: creneauChoisi.date, heure: creneauChoisi.heure,
          clientPrenom: form.prenom, clientNom: form.nom,
          clientEmail: form.email, clientTelephone: form.telephone,
          note: form.note,
        }),
      });
      if (res.ok) { setConfirme(true); setEtape('confirm'); }
      else { const d = await res.json(); setErreur(d.message || 'Erreur'); }
    } catch { setErreur('Erreur réseau'); }
    setLoading(false);
  };

  // Créneaux groupés par date
  const creneauxParDate = creneaux.reduce<Record<string, typeof creneaux>>((acc, c) => {
    if (!acc[c.date]) acc[c.date] = [];
    acc[c.date].push(c);
    return acc;
  }, {});

  const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' as any, fontFamily: "'Inter', sans-serif", marginBottom: 16 };

  return (
    <div style={{ background: cf, minHeight: '100vh', paddingTop: 100, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400;1,600&family=Inter:wght@400;500;600&display=swap');`}</style>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 400 }}>
            Réservez votre <em style={{ fontStyle: 'italic', color: cp }}>service</em>
          </h1>
          <p style={{ fontSize: 14, color: '#888', marginTop: 12 }}>{config.messageReservation}</p>
        </div>

        {/* Étapes */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 48, borderBottom: `2px solid ${cp}20` }}>
          {[
            { key: 'service', label: '1. Service' },
            { key: 'horaire', label: '2. Horaire' },
            { key: 'info', label: '3. Vos infos' },
            { key: 'confirm', label: '4. Confirmation' },
          ].map((e, i) => {
            const actif = e.key === etape;
            const passe = ['service', 'horaire', 'info', 'confirm'].indexOf(etape) > i;
            return (
              <div key={e.key} style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderBottom: actif ? `3px solid ${cp}` : '3px solid transparent', color: actif ? cp : passe ? '#888' : '#ccc', fontSize: 13, fontWeight: actif ? 600 : 400, transition: 'all 0.2s', cursor: passe ? 'pointer' : 'default' }}
                onClick={() => { if (passe) setEtape(e.key as any); }}>
                {e.label}
              </div>
            );
          })}
        </div>

        {/* ÉTAPE 1 : Choisir un service */}
        {etape === 'service' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, marginBottom: 28 }}>Choisissez votre service</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {config.services.map((s, i) => (
                <div key={i} onClick={() => { setServiceChoisi(s); setEtape('horaire'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px',
                    border: `2px solid ${serviceChoisi?.nom === s.nom ? cp : '#e5e0d8'}`,
                    borderRadius: 14, cursor: 'pointer', background: '#fff',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: serviceChoisi?.nom === s.nom ? `0 0 0 4px ${cp}15` : 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = cp}
                  onMouseLeave={e => { if (serviceChoisi?.nom !== s.nom) (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e0d8'; }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={s.photo} alt={s.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{s.nom}</h3>
                    <p style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>{s.sousNom}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 14, color: '#666' }}>{s.duree}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: cp }}>{s.prix}</p>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${serviceChoisi?.nom === s.nom ? cp : '#ddd'}`, background: serviceChoisi?.nom === s.nom ? cp : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 12 }}>
                    {serviceChoisi?.nom === s.nom ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Choisir un créneau */}
        {etape === 'horaire' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400 }}>Choisissez un horaire</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${cp}`, background: 'transparent', cursor: 'pointer', color: cp, fontSize: 16 }}>←</button>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#333', minWidth: 140, textAlign: 'center' }}>
                  {mois.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${cp}`, background: 'transparent', cursor: 'pointer', color: cp, fontSize: 16 }}>→</button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Chargement des disponibilités...</div>
            ) : Object.keys(creneauxParDate).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
                <p>Aucun créneau disponible ce mois-ci.</p>
                <p style={{ fontSize: 13, marginTop: 8 }}>Essayez le mois suivant ou contactez-nous directement.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 20 }}>
                {Object.entries(creneauxParDate).sort().map(([date, crs]) => (
                  <div key={date} style={{ background: '#fff', borderRadius: 16, padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 16 }}>
                      {new Date(date).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {crs.map(c => (
                        <button key={c.id} onClick={() => setCreneauChoisi(c)} style={{
                          padding: '8px 18px', borderRadius: 50,
                          border: `2px solid ${creneauChoisi?.id === c.id ? cp : '#ddd'}`,
                          background: creneauChoisi?.id === c.id ? cp : '#fff',
                          color: creneauChoisi?.id === c.id ? '#fff' : '#555',
                          fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                          transition: 'all 0.2s',
                        }}>
                          {c.heure}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
              <button onClick={() => setEtape('service')} style={{ padding: '12px 28px', border: `1px solid #ddd`, borderRadius: 10, background: 'transparent', cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>← Retour</button>
              <button onClick={() => setEtape('info')} disabled={!creneauChoisi} style={{ padding: '12px 28px', border: 'none', borderRadius: 10, background: creneauChoisi ? cp : '#ddd', color: '#fff', cursor: creneauChoisi ? 'pointer' : 'default', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Infos client */}
        {etape === 'info' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, marginBottom: 28 }}>Vos informations</h2>

            {/* Récap */}
            <div style={{ background: `${cp}15`, border: `1px solid ${cp}40`, borderRadius: 12, padding: '16px 20px', marginBottom: 32 }}>
              <p style={{ fontSize: 14, color: cp, fontWeight: 600 }}>{serviceChoisi?.nom}</p>
              <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                {creneauChoisi && `${new Date(creneauChoisi.date).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} à ${creneauChoisi.heure}`}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Prénom *</label>
                <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Nom *</label>
                <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Courriel *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Téléphone</label>
              <input type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="(514) 555-0000" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Note (optionnel)</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Allergies, préférences, infos supplémentaires..." rows={3}
                style={{ ...inputStyle, resize: 'vertical' as any }} />
            </div>

            {erreur && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>⚠️ {erreur}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, gap: 12 }}>
              <button onClick={() => setEtape('horaire')} style={{ padding: '12px 28px', border: '1px solid #ddd', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>← Retour</button>
              <button onClick={confirmerReservation} disabled={loading || !form.prenom || !form.nom || !form.email}
                style={{ padding: '12px 32px', border: 'none', borderRadius: 10, background: (!form.prenom || !form.nom || !form.email) ? '#ddd' : cp, color: '#fff', cursor: (!form.prenom || !form.nom || !form.email) ? 'default' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                {loading ? 'Réservation...' : 'Confirmer ma réservation'}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : Confirmation */}
        {etape === 'confirm' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            {/* Confettis simples */}
            <div style={{ fontSize: 64, marginBottom: 24, animation: 'bounce 0.6s ease' }}>✅</div>
            <style>{`@keyframes bounce { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }`}</style>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 400, color: '#1a1a1a', marginBottom: 16 }}>
              Réservation <em style={{ fontStyle: 'italic', color: cp }}>confirmée!</em>
            </h2>
            <div style={{ background: `${ca}40`, borderRadius: 16, padding: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7 }}>
                <strong>{serviceChoisi?.nom}</strong><br />
                {creneauChoisi && `${new Date(creneauChoisi.date).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })} à ${creneauChoisi.heure}`}<br />
                <br />
                Un courriel de confirmation a été envoyé à <strong>{form.email}</strong>.
              </p>
            </div>
            <p style={{ fontSize: 14, color: '#666', maxWidth: 500, margin: '0 auto' }}>{config.messageReservation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateSalonProps {
  config?: Partial<ConfigSalon>;
  vendeurId?: string;
  isPreview?: boolean;
}

export default function TemplateSalon({ config: configPartiel, vendeurId, isPreview }: TemplateSalonProps) {
  const config: ConfigSalon = { ...CONFIG_SALON_DEFAUT, ...configPartiel };

  // Fusionner les tableaux si fournis
  if (configPartiel?.services && configPartiel.services.length > 0) config.services = configPartiel.services;
  if (configPartiel?.equipe && configPartiel.equipe.length > 0) config.equipe = configPartiel.equipe;
  if (configPartiel?.galerie && configPartiel.galerie.length > 0) config.galerie = configPartiel.galerie;

  const [page, setPage] = useState<'accueil' | 'a-propos' | 'contact' | 'services' | 'reservations'>('accueil');

  const handleSetPage = (p: string) => {
    setPage(p as any);
    if (!isPreview) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ margin: 0, padding: 0 }}>
      <Nav config={config} page={page} setPage={handleSetPage} />
      {page === 'accueil' && <PageAccueil config={config} setPage={handleSetPage} />}
      {page === 'a-propos' && <PageAPropos config={config} setPage={handleSetPage} />}
      {page === 'contact' && <PageContact config={config} />}
      {page === 'services' && <PageServices config={config} setPage={handleSetPage} />}
      {page === 'reservations' && <PageReservations config={config} vendeurId={vendeurId} />}
    </div>
  );
}