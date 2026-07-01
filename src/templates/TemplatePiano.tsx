// src/templates/TemplatePiano.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
// e-Vend Studio — Template Cours de Piano & Musicien
// Style : fond noir pur #000 / accent pêche #e8a87c / blanc
// Typo : Raleway ultra-thin + light (grands titres) + Inter
// Nav : hamburger fullscreen + initiales logo
// Sections ON/OFF + réordonnables — Gratuit — Catégorie : cours

import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface PrixCours {
  formule: string;
  prix: string;
  duree: string;
  description: string;
  inclus: string[];
}

export interface PrixPrestations {
  type: string;
  prix: string;
  description: string;
}

export interface Prix {
  cours: PrixCours[];
  prestations: PrixPrestations[];
}

export interface Recompense {
  icone: string;
  titre: string;
  description: string;
}

export interface ConfigPiano {
  // Identité
  nomArtiste: string;
  initiales: string;
  titre: string;         // ex: PIANISTE
  slogan: string;        // sous le titre
  descriptionBio: string;
  descriptionCTA: string;

  // Photos
  photoHero: string;
  photoBio: string;
  photoBio2: string;
  photoLecons: string;
  photoLecons2: string;
  photosGalerieHero: string[]; // 9 photos diagonales grille
  photosGalerie: string[];     // galerie page dédiée

  // Couleurs
  couleurFond: string;       // #000000
  couleurAccent: string;     // #e8a87c pêche
  couleurTexte: string;      // #ffffff
  couleurGris: string;       // rgba(255,255,255,0.55)

  // Récompenses
  recompenses: Recompense[];

  // Cours / tarifs
  prix: Prix;

  // Contact
  telephone: string;
  email: string;
  reseaux: { facebook?: string; instagram?: string };

  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_PIANO_DEFAUT: ConfigPiano = {
  nomArtiste: 'Marie Leclair',
  initiales: 'ML',
  titre: 'PIANISTE',
  slogan: 'La musique est le langage de l\'âme.',
  descriptionBio: 'Bienvenue sur le site officiel de Marie Leclair, pianiste de renommée internationale. Avec une passion qui transcende les touches, Marie captive son public à travers le monde grâce à ses interprétations élégantes et émouvantes. Explorez sa musique, ses événements à venir, et plongez dans l\'art du piano à travers son univers unique.',
  descriptionCTA: 'Je suis ici pour guider votre parcours musical. Contactez-moi pour commencer vos cours de piano ou pour discuter de mes services de représentation.',

  photoHero: 'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoBio: 'https://images.pexels.com/photos/4088800/pexels-photo-4088800.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoBio2: 'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoLecons: 'https://images.pexels.com/photos/4709822/pexels-photo-4709822.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoLecons2: 'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=900',

  photosGalerieHero: [
    'https://images.pexels.com/photos/164935/pexels-photo-164935.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/210764/pexels-photo-210764.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/4088800/pexels-photo-4088800.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/4709822/pexels-photo-4709822.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/164935/pexels-photo-164935.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/210764/pexels-photo-210764.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/4088800/pexels-photo-4088800.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],

  photosGalerie: [
    'https://images.pexels.com/photos/4709822/pexels-photo-4709822.jpeg?auto=compress&cs=tinysrgb&w=900',
    'https://images.pexels.com/photos/4088800/pexels-photo-4088800.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/164935/pexels-photo-164935.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/210764/pexels-photo-210764.jpeg?auto=compress&cs=tinysrgb&w=900',
    'https://images.pexels.com/photos/1246437/pexels-photo-1246437.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/4709822/pexels-photo-4709822.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/4088800/pexels-photo-4088800.jpeg?auto=compress&cs=tinysrgb&w=900',
    'https://images.pexels.com/photos/164935/pexels-photo-164935.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],

  couleurFond: '#000000',
  couleurAccent: '#e8a87c',
  couleurTexte: '#ffffff',
  couleurGris: 'rgba(255,255,255,0.55)',

  recompenses: [
    { icone: '🏆', titre: 'Concours International de Piano', description: 'Premier prix au prestigieux Concours International de Piano de Montréal, récompensant l\'excellence technique et l\'expression artistique.' },
    { icone: '🏅', titre: 'Prix Maestro — Musique Classique', description: 'Distingué pour sa contribution exceptionnelle au monde de la musique classique et ses performances live inspirantes.' },
    { icone: '⭐', titre: 'Artiste de l\'Année', description: 'Reconnu comme artiste de l\'année par le Conseil des arts du Québec pour son impact culturel et son rayonnement international.' },
  ],

  prix: {
    cours: [
      { formule: 'Cours Découverte', prix: '45$', duree: '30 min', description: 'Idéal pour les débutants. Introduction aux bases du piano.', inclus: ['Évaluation initiale', 'Technique de base', 'Partition offerte', 'Suivi personnalisé'] },
      { formule: 'Cours Standard', prix: '75$', duree: '60 min', description: 'Pour les élèves intermédiaires souhaitant progresser rapidement.', inclus: ['Répertoire varié', 'Théorie musicale', 'Enregistrement audio', 'Devoirs personnalisés'] },
      { formule: 'Cours Avancé', prix: '110$', duree: '90 min', description: 'Pour musiciens avancés visant la maîtrise et la scène.', inclus: ['Préparation concerts', 'Interprétation avancée', 'Coaching scénique', 'Partition + enregistrement'] },
    ],
    prestations: [
      { type: 'Concert privé', prix: 'À partir de 500$', description: 'Performance live pour vos événements corporatifs ou privés.' },
      { type: 'Mariage & Réceptions', prix: 'À partir de 400$', description: 'Musique de fond ou concert live pour vos célébrations.' },
      { type: 'Enregistrement studio', prix: 'À partir de 200$/h', description: 'Sessions d\'enregistrement professionnelles avec direction artistique.' },
    ],
  },

  telephone: '(514) 555-0178',
  email: 'contact@marieleclair.ca',
  reseaux: { facebook: '#', instagram: '#' },

  sections: [
    { id: 'hero',        actif: true,  ordre: 1, label: 'Hero (accueil)'        },
    { id: 'bio',         actif: true,  ordre: 2, label: 'Biographie'            },
    { id: 'grille',      actif: true,  ordre: 3, label: 'Grille photos'         },
    { id: 'recompenses', actif: true,  ordre: 4, label: 'Récompenses'           },
    { id: 'lecons',      actif: true,  ordre: 5, label: 'Cours de piano'        },
    { id: 'tarifs',      actif: true,  ordre: 6, label: 'Tarifs'                },
    { id: 'galerie',     actif: true,  ordre: 7, label: 'Galerie'               },
    { id: 'contact',     actif: true,  ordre: 8, label: 'Contact'               },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useReveal(t = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: t });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [t]);
  return { ref, vis };
}

function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }

// ─── NAV — Hamburger + Menu fullscreen ────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigPiano; page: string; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const ca = config.couleurAccent;

  const goTo = (p: string) => { setPage(p); setMenuOpen(false); };

  const liens = [
    ['accueil', 'ACCUEIL'],
    ['lecons-page', 'COURS DE PIANO'],
    ['galerie-page', 'GALERIE'],
    ['contact-page', 'ME CONTACTER'],
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;600&family=Inter:wght@300;400;500;600&display=swap');
        .piano-menu-link {
          font-family:'Raleway',sans-serif; font-size: clamp(36px, 6vw, 72px); font-weight:100;
          color:#fff; cursor:pointer; background:none; border:none; text-align:left;
          letter-spacing:0.05em; line-height:1.1; transition:color .3s;
          display:block; padding:8px 0;
        }
        .piano-menu-link:hover { color:${ca}; }
        .piano-menu-open { animation: menuIn .5s cubic-bezier(.22,1,.36,1) both; }
        @keyframes menuIn { from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pianoFadeUp { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
        .pfu { animation:pianoFadeUp .9s cubic-bezier(.22,1,.36,1) both; }
        .pfu2 { animation:pianoFadeUp .9s .15s cubic-bezier(.22,1,.36,1) both; }
        .rv { opacity:0;transform:translateY(32px);transition:opacity .7s ease,transform .7s ease; }
        .rv.vis { opacity:1;transform:translateY(0); }
        .rv-l { opacity:0;transform:translateX(-36px);transition:opacity .7s ease,transform .7s ease; }
        .rv-l.vis { opacity:1;transform:translateX(0); }
        .rv-r { opacity:0;transform:translateX(36px);transition:opacity .7s ease,transform .7s ease; }
        .rv-r.vis { opacity:1;transform:translateX(0); }
        .label-section {
          display:inline-flex; align-items:center; gap:10px;
          font-family:'Raleway',sans-serif; font-size:12px; font-weight:300;
          letter-spacing:0.2em; text-transform:uppercase; color:${ca};
          margin-bottom:20px;
        }
        .label-section::before { content:''; display:block; width:28px; height:1px; background:${ca}; }
        .btn-piano {
          border:1px solid rgba(255,255,255,0.5); background:transparent; color:#fff;
          padding:14px 40px; font-family:'Raleway',sans-serif; font-size:13px; font-weight:300;
          letter-spacing:0.15em; cursor:pointer; transition:all .3s; text-transform:uppercase;
        }
        .btn-piano:hover { border-color:#fff; background:rgba(255,255,255,0.06); }
        .input-piano {
          width:100%; padding:14px 0; background:transparent;
          border:none; border-bottom:1px solid rgba(255,255,255,0.2);
          color:#fff; font-family:'Raleway',sans-serif; font-size:14px; font-weight:300;
          outline:none; letter-spacing:0.08em; box-sizing:border-box; transition:border-color .2s;
        }
        .input-piano:focus { border-bottom-color:${ca}; }
        .input-piano::placeholder { color:rgba(255,255,255,0.3); text-transform:uppercase; font-size:12px; letter-spacing:0.15em; }
        .carte-prix {
          border:1px solid rgba(255,255,255,0.12); padding:36px 32px;
          transition:border-color .3s,transform .3s;
        }
        .carte-prix:hover { border-color:${ca}; transform:translateY(-4px); }
        .galerie-item { overflow:hidden; cursor:default; }
        .galerie-item img { transition:transform .6s ease; display:block; width:100%; height:100%; object-fit:cover; }
        .galerie-item:hover img { transform:scale(1.06); }
      `}</style>

      {/* Barre nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(10,10,20,.88)',
        transition: 'background .3s',
      }}>
        {/* Initiales logo */}
        <div onClick={() => goTo('accueil')} style={{ cursor: 'pointer', fontFamily: "'Raleway', sans-serif", fontSize: 28, fontWeight: 100, color: '#fff', letterSpacing: '0.05em' }}>
          {config.initiales}
        </div>

        {/* Droite : réseaux + burger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {config.reseaux?.facebook && (
            <a href={config.reseaux.facebook} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: 18, textDecoration: 'none', opacity: 0.8, transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'}>📘</a>
          )}
          {config.reseaux?.instagram && (
            <a href={config.reseaux.instagram} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: 18, textDecoration: 'none', opacity: 0.8, transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8'}>📸</a>
          )}

          {/* Burger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 5, padding: 4,
          }}>
            <span style={{ display: 'block', width: 24, height: 1.5, background: '#fff', transition: 'transform .3s, opacity .3s', transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 24, height: 1.5, background: '#fff', transition: 'opacity .3s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 24, height: 1.5, background: '#fff', transition: 'transform .3s', transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Menu fullscreen */}
      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.97)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: isMobile ? '60px 20px' : '80px 60px',
        }} className="piano-menu-open">
          <div style={{ marginBottom: 60 }}>
            {liens.map(([id, label], i) => (
              <button key={id} className="piano-menu-link"
                style={{ animationDelay: `${i * 0.08}s`, color: page === id ? ca : '#fff' }}
                onClick={() => goTo(id)}>
                {label}
              </button>
            ))}
          </div>
          {/* Initiales bas droite */}
          <div style={{ position: 'absolute', bottom: 40, right: 60, fontFamily: "'Raleway', sans-serif", fontSize: 36, fontWeight: 100, color: '#fff', opacity: 0.3 }}>
            {config.initiales}
          </div>
        </div>
      )}
    </>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config }: { config: ConfigPiano }) {
  const { isMobile } = useIsMobile();
  return (
    <section style={{ background: '#000', minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
      {/* Photo fond */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${config.photoHero})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' }} />

      {/* Contenu */}
      <div style={{ position: 'relative', padding: '40px 60px 80px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 40, alignItems: 'flex-end' }}>
        {/* Nom géant */}
        <div>
          <h1 className="pfu" style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: 'clamp(56px, 10vw, 130px)',
            fontWeight: 100, color: '#fff',
            lineHeight: 0.9, letterSpacing: '0.02em',
            margin: 0,
          }}>
            {config.nomArtiste.split(' ').map((mot, i) => (
              <span key={i} style={{ display: 'block' }}>{mot.toUpperCase()}</span>
            ))}
          </h1>
          <p className="pfu2" style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: 'clamp(12px, 1.5vw, 16px)',
            fontWeight: 300, color: '#fff',
            letterSpacing: '0.5em', marginTop: 20, textTransform: 'uppercase', opacity: 0.8,
          }}>
            {config.titre}
          </p>
        </div>

        {/* Texte droite */}
        <div className="pfu2" style={{ paddingBottom: 8 }}>
          <p style={{
            fontFamily: "'Raleway', sans-serif", fontSize: 14, fontWeight: 300,
            color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, maxWidth: 420,
          }}>
            {config.slogan}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION BIO ──────────────────────────────────────────────────────────────

function SectionBio({ config, setPage }: { config: ConfigPiano; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);

  return (
    <section style={{ background: '#000', padding: '120px 60px' }}>
      {/* Label section */}
      <div style={{ marginBottom: 60 }}>
        <span className="label-section">À PROPOS DE MOI</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Texte gauche */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis ? ' vis' : ''}`}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(15px, 1.6vw, 19px)', fontWeight: 300, color: '#fff', lineHeight: 1.9, marginBottom: 40 }}>
            {config.descriptionBio}
          </p>
          <button className="btn-piano" onClick={() => setPage('lecons-page')}>
            Cours de piano
          </button>
        </div>

        {/* Photo droite avec plan de composition */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis ? ' vis' : ''}`} style={{ position: 'relative' }}>
          <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src={config.photoBio} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.85)', transition: 'transform .6s' }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
          </div>
          {/* Ligne accent */}
          <div style={{ position: 'absolute', bottom: -16, left: -16, width: 80, height: 80, border: `1px solid ${ca}50` }} />
        </div>
      </div>
    </section>
  );
}

// ─── SECTION GRILLE DIAGONALE ─────────────────────────────────────────────────

function SectionGrille({ config }: { config: ConfigPiano }) {
  const { isMobile } = useIsMobile();
  const photos = ea(config.photosGalerieHero, CONFIG_PIANO_DEFAUT.photosGalerieHero);

  return (
    <section style={{ background: '#000', padding: '0' }}>
      {/* Grille 3x3 avec effet diagonal clip-path */}
      <style>{`
        .grille-cell { position:relative; overflow:hidden; }
        .grille-cell img { width:100%; height:100%; object-fit:cover; display:block; transition:transform .6s ease,filter .4s; filter:brightness(0.7); }
        .grille-cell:hover img { transform:scale(1.08); filter:brightness(1); }
        .grille-diagonal { clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gridTemplateRows: 'repeat(3, 200px)', gap: 3 }}>
        {photos.slice(0, 9).map((url, i) => (
          <div key={i} className="grille-cell grille-diagonal">
            <img src={url} alt="" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION RÉCOMPENSES ──────────────────────────────────────────────────────

function SectionRecompenses({ config }: { config: ConfigPiano }) {
  const ca = config.couleurAccent;
  const rv = useReveal(0.05);
  const recompenses = ea(config.recompenses, CONFIG_PIANO_DEFAUT.recompenses);

  return (
    <section style={{ background: '#000', padding: '120px 60px' }}>
      <div style={{ marginBottom: 60 }}>
        <span className="label-section">RÉCOMPENSES</span>
      </div>

      <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 300, color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, maxWidth: 760, marginBottom: 80, textAlign: 'center', margin: '0 auto 80px' }}>
        Tout au long de sa brillante carrière, {config.nomArtiste} a été honoré(e) de nombreuses récompenses prestigieuses célébrant son talent exceptionnel et son dévouement à l'art du piano.
      </p>

      {/* Cards récompenses — alternance avec fond fumée */}
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`}>
        {recompenses.map((r, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 40 }}>
            {/* Fond fumée visuel */}
            {i % 2 !== 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at ${i % 2 === 0 ? 'left' : 'right'} center, ${ca}15, transparent 60%)`,
                pointerEvents: 'none',
              }} />
            )}
            <div style={{
              border: `1px solid rgba(255,255,255,0.1)`,
              padding: '40px 48px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', textAlign: 'center',
              transition: 'border-color .3s',
              maxWidth: 560, margin: '0 auto',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${ca}60`}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'}>
              {/* Icône trophée SVG */}
              <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.8 }}>
                <svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M14 4h12v12c0 6.627-5.373 12-12 12S2 22.627 2 16V4h12z" transform="translate(7,2)" />
                  <path d="M8 28v4M12 32H4" transform="translate(8,2)" />
                  <path d="M14 4H2v4c0 2.209 1.791 4 4 4h2" transform="translate(7,2)" />
                  <path d="M10 4h12v4c0 2.209-1.791 4-4 4h-2" transform="translate(7,2)" />
                </svg>
              </div>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 200, color: '#fff', marginBottom: 16, lineHeight: 1.3 }}>
                {r.titre}
              </h3>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 1.7 }}>
                {r.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION LEÇONS ───────────────────────────────────────────────────────────

function SectionLecons({ config }: { config: ConfigPiano }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rv = useReveal(0.05);

  return (
    <section style={{ background: '#000', padding: '120px 60px' }}>
      <div style={{ marginBottom: 60 }}>
        <span className="label-section">COURS DE PIANO</span>
      </div>

      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0 }}>
        {/* Photo + nuages */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 500 }}>
          <img src={config.photoLecons} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        {/* Texte droite */}
        <div style={{ padding: '60px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 100, color: '#fff', letterSpacing: '0.05em', lineHeight: 1.2, marginBottom: 28, textTransform: 'uppercase' }}>
            MAÎTRISEZ L'ART DU PIANO
          </h2>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 36 }}>
            Découvrez l'art du piano avec des cours privés adaptés à votre niveau et à votre rythme. Que vous soyez débutant ou musicien avancé, mes cours personnalisés vous aideront à développer votre technique, votre expression musicale et votre confiance au piano.
          </p>
          <button className="btn-piano">En savoir plus</button>
        </div>
      </div>

      {/* Photo + texte 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0, marginTop: 3 }}>
        <div style={{ padding: '60px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9 }}>
            Chaque cours est conçu autour de vos objectifs musicaux pour assurer des progrès constants et significatifs. Rejoignez-nous et commencez votre parcours musical aujourd'hui!
          </p>
        </div>
        <div style={{ overflow: 'hidden', minHeight: 340 }}>
          <img src={config.photoLecons2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.75)' }} />
        </div>
      </div>
    </section>
  );
}

// ─── SECTION TARIFS ───────────────────────────────────────────────────────────

function SectionTarifs({ config, setPage }: { config: ConfigPiano; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rv = useReveal(0.05);
  const cours = ea(config.prix?.cours || [], CONFIG_PIANO_DEFAUT.prix.cours);
  const prestations = ea(config.prix?.prestations || [], CONFIG_PIANO_DEFAUT.prix.prestations);

  return (
    <section style={{ background: '#000', padding: '120px 60px' }}>
      <div style={{ marginBottom: 60 }}>
        <span className="label-section">TARIFS</span>
      </div>

      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Cours */}
        <h2 style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(24px, 2.5vw, 36px)', fontWeight: 200, color: '#fff', letterSpacing: '0.1em', marginBottom: 48, textTransform: 'uppercase' }}>
          Cours de Piano
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 80 }}>
          {cours.map((c, i) => (
            <div key={i} className="carte-prix">
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                {c.formule}
              </p>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 48, fontWeight: 100, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{c.prix}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20, letterSpacing: '0.05em' }}>{c.duree}</p>
              <div style={{ width: 40, height: 1, background: `${ca}60`, marginBottom: 20 }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24 }}>{c.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {c.inclus.map((item, j) => (
                  <li key={j} style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, paddingLeft: 16, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: ca }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="btn-piano" onClick={() => setPage('contact-page')} style={{ marginTop: 28, width: '100%', textAlign: 'center' }}>
                Réserver
              </button>
            </div>
          ))}
        </div>

        {/* Prestations */}
        <h2 style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(24px, 2.5vw, 36px)', fontWeight: 200, color: '#fff', letterSpacing: '0.1em', marginBottom: 32, textTransform: 'uppercase' }}>
          Prestations & Concerts
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {prestations.map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 20,
              padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
              alignItems: 'center',
            }}>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 16, fontWeight: 300, color: '#fff', letterSpacing: '0.05em' }}>{p.type}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.description}</p>
              <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 20, fontWeight: 200, color: ca, textAlign: 'right' }}>{p.prix}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION GALERIE ──────────────────────────────────────────────────────────

function SectionGalerie({ config }: { config: ConfigPiano }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const rv = useReveal(0.05);
  const photos = ea(config.photosGalerie, CONFIG_PIANO_DEFAUT.photosGalerie);

  // Layout masonry : 1 grande gauche + 2 petites droite, puis 3 petites, etc.
  return (
    <section style={{ background: '#000', padding: '120px 60px' }}>
      <div style={{ marginBottom: 60 }}>
        <span className="label-section">GALERIE</span>
      </div>

      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Rangée 1 : grande + 2 petites */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gridTemplateRows: 'auto', gap: 3, marginBottom: 3 }}>
          <div className="galerie-item" style={{ gridColumn: '1', gridRow: '1 / 3', height: 520 }}>
            <img src={photos[0]} alt="" />
          </div>
          <div className="galerie-item" style={{ height: 254 }}>
            <img src={photos[1]} alt="" />
          </div>
          <div className="galerie-item" style={{ height: 254 }}>
            <img src={photos[2]} alt="" />
          </div>
          <div className="galerie-item" style={{ height: 254 }}>
            <img src={photos[3]} alt="" />
          </div>
          <div className="galerie-item" style={{ height: 254, gridColumn: '3' }}>
            <img src={photos[4]} alt="" />
          </div>
        </div>

        {/* Rangée 2 : 3 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 3 }}>
          {photos.slice(5, 8).map((url, i) => (
            <div key={i} className="galerie-item" style={{ height: 300 }}>
              <img src={url} alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONTACT ──────────────────────────────────────────────────────────

function SectionContact({ config }: { config: ConfigPiano }) {
  const { isMobile } = useIsMobile();
  const ca = config.couleurAccent;
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, artiste: config.nomArtiste, type: 'contact-piano', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  return (
    <section style={{ background: '#000', padding: '120px 60px' }}>
      <div style={{ marginBottom: 60 }}>
        <span className="label-section">ME CONTACTER</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 120, alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto' }}>
        {/* Infos gauche */}
        <div>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(24px, 3vw, 44px)', fontWeight: 100, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: 40 }}>
            {config.descriptionCTA}
          </h2>
          <button className="btn-piano" onClick={() => {}}>CONTACT</button>

          <div style={{ marginTop: 60 }}>
            {config.telephone && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 600, color: ca, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>Téléphone</p>
                <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 20, fontWeight: 200, color: ca }}>{config.telephone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire droite */}
        <div>
          {envoye ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontSize: 24, fontWeight: 200, color: '#fff', letterSpacing: '0.1em', marginBottom: 12 }}>MESSAGE ENVOYÉ</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Je vous répondrai très rapidement.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <input className="input-piano" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom" />
              </div>
              <div>
                <input className="input-piano" type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="Téléphone" />
              </div>
              <div>
                <input className="input-piano" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" />
              </div>
              <div>
                <textarea className="input-piano" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Message *"
                  style={{ resize: 'none' }} />
              </div>
              <button disabled={loading || !form.email || !form.message}
                style={{ opacity: !form.email || !form.message ? 0.4 : 1, alignSelf: 'flex-start' }}>
                {loading ? 'ENVOI...' : 'ME CONTACTER'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigPiano; setPage: (p: string) => void }) {
  const ca = config.couleurAccent;

  return (
    <footer style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer', fontFamily: "'Raleway', sans-serif", fontSize: 24, fontWeight: 100, color: '#fff', letterSpacing: '0.1em' }}>
          {config.initiales}
        </div>
        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
          © {new Date().getFullYear()} {config.nomArtiste.toUpperCase()} — TOUS DROITS RÉSERVÉS
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          {config.reseaux?.facebook && (
            <a href={config.reseaux.facebook} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: 16, textDecoration: 'none', opacity: 0.4, transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.4'}>📘</a>
          )}
          {config.reseaux?.instagram && (
            <a href={config.reseaux.instagram} target="_blank" rel="noreferrer" style={{ color: '#fff', fontSize: 16, textDecoration: 'none', opacity: 0.4, transition: 'opacity .2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.4'}>📸</a>
          )}
        </div>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplatePianoProps {
  config?: Partial<ConfigPiano>;
  isPreview?: boolean;
}

export default function TemplatePiano({ config: partiel, isPreview }: TemplatePianoProps) {
  const config: ConfigPiano = { ...CONFIG_PIANO_DEFAUT, ...partiel };
  config.recompenses     = ea(partiel?.recompenses,     CONFIG_PIANO_DEFAUT.recompenses);
  config.photosGalerieHero = ea(partiel?.photosGalerieHero, CONFIG_PIANO_DEFAUT.photosGalerieHero);
  config.photosGalerie   = ea(partiel?.photosGalerie,   CONFIG_PIANO_DEFAUT.photosGalerie);
  // Valider que les sections viennent bien de ce template (IDs connus)
  const VALID_IDS_PIANO = ['hero', 'bio', 'grille', 'recompenses', 'lecons', 'tarifs', 'galerie', 'contact'];
  const rawSections = ea(partiel?.sections, CONFIG_PIANO_DEFAUT.sections);
  config.sections = rawSections.every(s => VALID_IDS_PIANO.includes(s.id))
    ? rawSections
    : CONFIG_PIANO_DEFAUT.sections;
  if (!config.prix?.cours?.length) config.prix = CONFIG_PIANO_DEFAUT.prix;

  const [page, setPage] = useState('accueil');

  // Reset scroll au montage
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePage = (p: string) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sectionsActives = [...config.sections].filter(s => s.actif).sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':        return <SectionHero        config={config} />;
      case 'bio':         return <SectionBio         config={config} setPage={handlePage} />;
      case 'grille':      return <SectionGrille      config={config} />;
      case 'recompenses': return <SectionRecompenses config={config} />;
      case 'lecons':      return <SectionLecons      config={config} />;
      case 'tarifs':      return <SectionTarifs      config={config} setPage={handlePage} />;
      case 'galerie':     return <SectionGalerie     config={config} />;
      case 'contact':     return <SectionContact     config={config} />;
      default:            return null;
    }
  };

  return (
    <div style={{ background: '#000', margin: 0, padding: 0 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;600&family=Inter:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div>
        {page === 'accueil' && (
          <>{sectionsActives.map(s => <div key={s.id}>{renderSection(s.id)}</div>)}<Footer config={config} setPage={handlePage} /></>
        )}
        {page === 'lecons-page' && (<><SectionLecons config={config} /><SectionTarifs config={config} setPage={handlePage} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'galerie-page' && (<><SectionGrille config={config} /><SectionGalerie config={config} /><Footer config={config} setPage={handlePage} /></>)}
        {page === 'contact-page' && (<><SectionContact config={config} /><Footer config={config} setPage={handlePage} /></>)}
      </div>
    </div>
  );
}