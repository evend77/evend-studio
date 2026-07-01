// src/templates/TemplateVitrine.tsx
// e-Vend Studio — Template "Vitrine Simple" (non transactionnel)
// Sous-types : portfolio | carte | cv | evenementiel
// Ce fichier est le RENDU PUBLIC — ce que les visiteurs du vendeur voient.
// Les données viennent de la BD via props (config du vendeur).

import { useEffect, useRef, useState } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SousTypeVitrine = 'portfolio' | 'carte' | 'cv' | 'evenementiel';

export interface ConfigVitrine {
  // Identité
  sousType: SousTypeVitrine;
  nomEntreprise: string;
  slogan: string;
  description: string;
  logoUrl: string;
  photoHeroUrl: string;

  // Couleurs & style
  couleurPrincipale: string;   // ex: '#e63946'
  couleurSecondaire: string;   // ex: '#1d3557'
  couleurFond: string;         // ex: '#f8f9fa'
  couleurTexte: string;        // ex: '#212529'
  police: 'moderne' | 'classique' | 'manuscrite';

  // Réseaux sociaux
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
  siteExterne: string;

  // ── PORTFOLIO ──
  portfolio_galerie: { url: string; titre: string; desc: string }[];

  // ── CARTE / PRÉSENTATION ──
  carte_adresse: string;
  carte_ville: string;
  carte_telephone: string;
  carte_email: string;
  carte_horaires: { jour: string; heure: string }[];
  carte_menuUrl: string;
  carte_reservationUrl: string;
  carte_googleMapsUrl: string;

  // ── CV / PROFESSIONNEL ──
  cv_titre: string;            // ex: "Avocate en droit des affaires"
  cv_services: { titre: string; desc: string; icone: string }[];
  cv_temoignages: { nom: string; texte: string; poste: string }[];
  cv_rdvUrl: string;
  cv_photoPortrait: string;

  // ── ÉVÉNEMENTIEL ──
  event_dateEvenement: string; // ISO string
  event_lieu: string;
  event_billeterieUrl: string;
  event_programme: { heure: string; titre: string; desc: string }[];
  event_photoEvent: string;
}

// ─── CONFIG PAR DÉFAUT (pour preview / démo) ─────────────────────────────────

export const CONFIG_DEFAUT: ConfigVitrine = {
  sousType: 'portfolio',
  nomEntreprise: 'Marie Dupont',
  slogan: 'Photographe & Artiste visuelle',
  description: 'Je capture l\'essentiel — la lumière, l\'instant, l\'émotion. Basée à Montréal, disponible partout.',
  logoUrl: '',
  photoHeroUrl: 'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#c9a96e',
  couleurSecondaire: '#1a1a1a',
  couleurFond: '#fafaf8',
  couleurTexte: '#1a1a1a',
  police: 'moderne',
  instagram: 'marie.photo',
  facebook: '',
  tiktok: '',
  linkedin: 'marie-dupont',
  siteExterne: '',
  portfolio_galerie: [
    { url: 'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=800', titre: 'Collection Automne', desc: 'Série portraits — 2024' },
    { url: 'https://images.pexels.com/photos/5632397/pexels-photo-5632397.jpeg?auto=compress&cs=tinysrgb&w=800', titre: 'Lumière Naturelle', desc: 'Studio et extérieur' },
    { url: 'https://images.pexels.com/photos/6991226/pexels-photo-6991226.jpeg?auto=compress&cs=tinysrgb&w=800', titre: 'Architecture', desc: 'Montréal urbain' },
    { url: 'https://images.pexels.com/photos/4381392/pexels-photo-4381392.jpeg?auto=compress&cs=tinysrgb&w=800', titre: 'Portraits', desc: 'Série intime 2025' },
    { url: 'https://images.pexels.com/photos/5647688/pexels-photo-5647688.jpeg?auto=compress&cs=tinysrgb&w=800', titre: 'Mode & Style', desc: 'Collaboration avec designers' },
    { url: 'https://images.pexels.com/photos/4491459/pexels-photo-4491459.jpeg?auto=compress&cs=tinysrgb&w=800', titre: 'Mariage', desc: 'Reportages amour' },
  ],
  carte_adresse: '1234 rue Saint-Denis',
  carte_ville: 'Montréal, QC  H2X 3K6',
  carte_telephone: '(514) 555-0123',
  carte_email: 'bonjour@restaurant.ca',
  carte_horaires: [
    { jour: 'Lun – Mer', heure: '11h30 – 21h00' },
    { jour: 'Jeu – Ven', heure: '11h30 – 22h30' },
    { jour: 'Sam', heure: '10h00 – 22h30' },
    { jour: 'Dim', heure: '10h00 – 20h00' },
  ],
  carte_menuUrl: '',
  carte_reservationUrl: '',
  carte_googleMapsUrl: 'https://maps.google.com',
  cv_titre: 'Consultante en stratégie d\'affaires',
  cv_services: [
    { titre: 'Stratégie', desc: 'Planification et croissance pour PME.', icone: '🎯' },
    { titre: 'Coaching', desc: 'Accompagnement personnalisé 1-à-1.', icone: '💡' },
    { titre: 'Formation', desc: 'Ateliers et séminaires en entreprise.', icone: '📚' },
  ],
  cv_temoignages: [
    { nom: 'Jean Tremblay', texte: 'Un travail exceptionnel, des résultats concrets dès le premier mois.', poste: 'PDG, Tremblay & Associés' },
    { nom: 'Sofie Gagnon', texte: 'Professionnelle, disponible et vraiment à l\'écoute de nos besoins.', poste: 'Directrice RH' },
  ],
  cv_rdvUrl: '',
  cv_photoPortrait: 'https://images.pexels.com/photos/5647688/pexels-photo-5647688.jpeg?auto=compress&cs=tinysrgb&w=600',
  event_dateEvenement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  event_lieu: 'Palais des congrès de Montréal',
  event_billeterieUrl: '',
  event_programme: [
    { heure: '09h00', titre: 'Accueil & café', desc: 'Networking et enregistrement' },
    { heure: '10h00', titre: 'Conférence d\'ouverture', desc: 'Keynote principal' },
    { heure: '12h00', titre: 'Dîner & exposition', desc: 'Kiosques partenaires' },
    { heure: '14h00', titre: 'Ateliers parallèles', desc: '3 pistes au choix' },
    { heure: '17h00', titre: 'Cocktail de clôture', desc: 'Réseautage et remises' },
  ],
  event_photoEvent: 'https://images.pexels.com/photos/28904962/pexels-photo-28904962.jpeg?auto=compress&cs=tinysrgb&w=1600',
};

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

function getPoliceCSS(police: string): string {
  switch (police) {
    case 'classique': return "'Playfair Display', Georgia, serif";
    case 'manuscrite': return "'Dancing Script', cursive";
    default: return "'Inter', 'Helvetica Neue', sans-serif";
  }
}

function getGoogleFontsUrl(police: string): string {
  switch (police) {
    case 'classique': return 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap';
    case 'manuscrite': return 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Inter:wght@300;400;500&display=swap';
    default: return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  }
}

function useCompteurEvenement(dateISO: string) {
  const calc = () => {
    const diff = new Date(dateISO).getTime() - Date.now();
    if (diff <= 0) return { jours: 0, heures: 0, minutes: 0, secondes: 0 };
    return {
      jours: Math.floor(diff / 86400000),
      heures: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      secondes: Math.floor((diff % 60000) / 1000),
    };
  };
  const [temps, setTemps] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTemps(calc()), 1000);
    return () => clearInterval(id);
  }, [dateISO]);
  return temps;
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigVitrine>;
  isPreviewMobile?: boolean; // true quand affiché dans le preview mobile du studio
}

export default function TemplateVitrine({ config: configPartiel, isPreviewMobile = false }: Props) {
  const config: ConfigVitrine = { ...CONFIG_DEFAUT, ...configPartiel };
  const isMobile = isPreviewMobile || (typeof window !== 'undefined' && window.innerWidth <= 768);
  
  const police = getPoliceCSS(config.police);
  const heroRef = useRef<HTMLDivElement>(null);
  const [galerieFocus, setGalerieFocus] = useState<number | null>(null);

  useScrollReveal();

  // Parallax hero léger
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.backgroundPositionY = `${window.scrollY * 0.25}px`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const cf = config.couleurFond;
  const ct = config.couleurTexte;

  return (
    <div style={{ fontFamily: police, background: cf, color: ct, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── FONTS & CSS GLOBAL ── */}
      <link rel="stylesheet" href={getGoogleFontsUrl(config.police)} />
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        /* ── Reveal au scroll ── */
        /* Visible par défaut dans le preview — animation optionnelle sur le vrai site */
        .reveal { opacity: 1; transform: none; transition: opacity 0.65s ease, transform 0.65s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        .reveal-left { opacity: 1; transform: none; transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal-left.visible { opacity: 1; transform: none; }
        .reveal-right { opacity: 1; transform: none; transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal-right.visible { opacity: 1; transform: none; }

        /* ── Hover photo galerie ── */
        .galerie-item img {
          transition: transform 0.45s cubic-bezier(.25,.46,.45,.94), filter 0.35s ease;
          will-change: transform;
        }
        .galerie-item:hover img { transform: scale(1.06); filter: brightness(0.82); }
        .galerie-item .galerie-overlay {
          opacity: 0;
          transition: opacity 0.3s ease;
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%);
          display: flex; align-items: flex-end; padding: 20px;
        }
        .galerie-item:hover .galerie-overlay { opacity: 1; }

        /* ── Hover service card ── */
        .service-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .service-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.10);
        }

        /* ── Nav link hover ── */
        .nav-link-item { transition: color 0.2s; }
        .nav-link-item:hover { color: ${cp} !important; }

        /* ── Bouton principal ── */
        .btn-principal {
          background: ${cp};
          color: #fff;
          border: none;
          padding: 13px 30px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: opacity 0.2s, transform 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .btn-principal:hover { opacity: 0.88; transform: translateY(-2px); }

        .btn-contour {
          background: transparent;
          color: ${cp};
          border: 1.5px solid ${cp};
          padding: 12px 28px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .btn-contour:hover { background: ${cp}18; }

        /* ── Séparateur doré ── */
        .separateur {
          width: 48px; height: 3px;
          background: ${cp};
          border-radius: 2px;
          margin: 18px 0 24px;
        }

        /* ── Lightbox galerie ── */
        .lightbox {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.92);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }
        .lightbox img { max-width: 90vw; max-height: 85vh; border-radius: 4px; object-fit: contain; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .galerie-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .horaires-grid { grid-template-columns: 1fr !important; }
          .cv-layout { flex-direction: column !important; }
          .services-grid { grid-template-columns: 1fr !important; }
          .programme-grid { grid-template-columns: 1fr !important; }
          .compteur-grid { gap: 12px !important; }
          .temoignages-grid { grid-template-columns: 1fr !important; }
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${cf}; }
        ::-webkit-scrollbar-thumb { background: ${cp}60; border-radius: 3px; }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: `${cf}ee`, backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${cp}22`,
        height: '64px', display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: cs, letterSpacing: '-0.01em' }}>
            {config.logoUrl
              ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
              : config.nomEntreprise
            }
          </span>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {config.sousType === 'portfolio' && (
              <>
                <a href="#galerie" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Galerie</a>
                <a href="#contact" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Contact</a>
              </>
            )}
            {config.sousType === 'carte' && (
              <>
                <a href="#infos" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Infos</a>
                <a href="#horaires" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Horaires</a>
                {config.carte_reservationUrl && (
                  <a href={config.carte_reservationUrl} target="_blank" rel="noopener noreferrer" className="btn-principal" style={{ padding: '8px 20px', fontSize: 13 }}>Réserver</a>
                )}
              </>
            )}
            {config.sousType === 'cv' && (
              <>
                <a href="#services" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Services</a>
                <a href="#temoignages" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Témoignages</a>
                {config.cv_rdvUrl && (
                  <a href={config.cv_rdvUrl} target="_blank" rel="noopener noreferrer" className="btn-principal" style={{ padding: '8px 20px', fontSize: 13 }}>Prendre RDV</a>
                )}
              </>
            )}
            {config.sousType === 'evenementiel' && (
              <>
                <a href="#programme" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Programme</a>
                <a href="#infos" className="nav-link-item" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Infos</a>
                {config.event_billeterieUrl && (
                  <a href={config.event_billeterieUrl} target="_blank" rel="noopener noreferrer" className="btn-principal" style={{ padding: '8px 20px', fontSize: 13 }}>Billets</a>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          minHeight: '100vh',
          backgroundImage: `url(${config.sousType === 'evenementiel' ? config.event_photoEvent : config.photoHeroUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cs}cc 0%, ${cs}88 100%)` }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, padding: '0 24px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: cp, marginBottom: 20, opacity: 0.95 }}>
            {config.sousType === 'portfolio' && '✦ Portfolio'}
            {config.sousType === 'carte' && '✦ Bienvenue'}
            {config.sousType === 'cv' && '✦ Profil professionnel'}
            {config.sousType === 'evenementiel' && '✦ Événement'}
          </p>
          <h1 style={{ fontSize: 'clamp(38px, 7vw, 72px)', fontWeight: 700, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 20 }}>
            {config.nomEntreprise}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', color: 'rgba(255,255,255,0.78)', fontWeight: 300, lineHeight: 1.5, marginBottom: 36 }}>
            {config.sousType === 'cv' ? config.cv_titre : config.slogan}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {config.sousType === 'portfolio' && (
              <a href="#galerie" className="btn-principal">Voir la galerie</a>
            )}
            {config.sousType === 'carte' && config.carte_reservationUrl && (
              <a href={config.carte_reservationUrl} target="_blank" rel="noopener noreferrer" className="btn-principal">Réserver une table</a>
            )}
            {config.sousType === 'carte' && config.carte_menuUrl && (
              <a href={config.carte_menuUrl} target="_blank" rel="noopener noreferrer" className="btn-contour" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}>Voir le menu</a>
            )}
            {config.sousType === 'cv' && config.cv_rdvUrl && (
              <a href={config.cv_rdvUrl} target="_blank" rel="noopener noreferrer" className="btn-principal">Prendre rendez-vous</a>
            )}
            {config.sousType === 'evenementiel' && config.event_billeterieUrl && (
              <a href={config.event_billeterieUrl} target="_blank" rel="noopener noreferrer" className="btn-principal">Obtenir mes billets</a>
            )}
            <a href="#contact" className="btn-contour" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>Me contacter</a>
          </div>
        </div>
        {/* Flèche scroll */}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 24, animation: 'bounce 2s infinite' }}>
          ↓
        </div>
        <style>{`@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)} }`}</style>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION: À PROPOS (tous les types)
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 24px', background: cf }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }} className="reveal">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>À propos</p>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, color: cs, lineHeight: 1.2, marginBottom: 20 }}>
            {config.sousType === 'cv' ? config.nomEntreprise : `Bienvenue chez ${config.nomEntreprise}`}
          </h2>
          <div className="separateur" style={{ margin: '0 auto 24px' }} />
          <p style={{ fontSize: 17, color: `${ct}99`, lineHeight: 1.75, maxWidth: 640, margin: '0 auto' }}>
            {config.description}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ██ PORTFOLIO — Galerie
      ══════════════════════════════════════════════════════════ */}
      {config.sousType === 'portfolio' && config.portfolio_galerie.length > 0 && (
        <section id="galerie" style={{ padding: '40px 24px 96px', background: `${cs}08` }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Galerie</p>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: cs }}>Mes œuvres</h2>
              <div className="separateur" style={{ margin: '18px auto 0' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 16 }}>
              {config.portfolio_galerie.map((item, i) => (
                <div
                  key={i}
                  className="galerie-item reveal"
                  style={{ position: 'relative', overflow: 'hidden', borderRadius: 6, cursor: 'zoom-in', aspectRatio: '1', animationDelay: `${i * 0.07}s` }}
                  onClick={() => setGalerieFocus(i)}
                >
                  <img src={item.url} alt={item.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div className="galerie-overlay">
                    <div>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.titre}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Lightbox */}
          {galerieFocus !== null && (
            <div className="lightbox" onClick={() => setGalerieFocus(null)}>
              <button onClick={() => setGalerieFocus(null)} style={{ position: 'fixed', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', zIndex: 1001 }}>✕</button>
              <button
                onClick={(e) => { e.stopPropagation(); setGalerieFocus(prev => prev !== null ? Math.max(0, prev - 1) : null); }}
                style={{ position: 'fixed', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', padding: '12px 16px', borderRadius: 4, zIndex: 1001 }}
              >‹</button>
              <img src={config.portfolio_galerie[galerieFocus].url} alt={config.portfolio_galerie[galerieFocus].titre} />
              <button
                onClick={(e) => { e.stopPropagation(); setGalerieFocus(prev => prev !== null ? Math.min(config.portfolio_galerie.length - 1, prev + 1) : null); }}
                style={{ position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', padding: '12px 16px', borderRadius: 4, zIndex: 1001 }}
              >›</button>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          ██ CARTE — Infos pratiques & horaires
      ══════════════════════════════════════════════════════════ */}
      {config.sousType === 'carte' && (
        <section id="infos" style={{ padding: '80px 24px', background: cf }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Où nous trouver</p>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: cs }}>Informations pratiques</h2>
              <div className="separateur" style={{ margin: '18px auto 0' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 48, alignItems: 'start' }}>
              {/* Contacts */}
              <div className="reveal-left">
                <h3 style={{ fontSize: 18, fontWeight: 600, color: cs, marginBottom: 24 }}>Nous joindre</h3>
                {[
                  { icone: '📍', label: 'Adresse', valeur: `${config.carte_adresse}\n${config.carte_ville}` },
                  { icone: '📞', label: 'Téléphone', valeur: config.carte_telephone },
                  { icone: '✉️', label: 'Courriel', valeur: config.carte_email },
                ].map((item, i) => item.valeur ? (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icone}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: cp, marginBottom: 4 }}>{item.label}</p>
                      <p style={{ fontSize: 15, color: ct, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{item.valeur}</p>
                    </div>
                  </div>
                ) : null)}
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                  {config.carte_googleMapsUrl && (
                    <a href={config.carte_googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn-principal" style={{ fontSize: 13, padding: '10px 20px' }}>Voir sur la carte</a>
                  )}
                  {config.carte_menuUrl && (
                    <a href={config.carte_menuUrl} target="_blank" rel="noopener noreferrer" className="btn-contour" style={{ fontSize: 13, padding: '9px 20px' }}>Menu en ligne</a>
                  )}
                </div>
              </div>
              {/* Horaires */}
              <div id="horaires" className="reveal-right">
                <h3 style={{ fontSize: 18, fontWeight: 600, color: cs, marginBottom: 24 }}>Heures d'ouverture</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {config.carte_horaires.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: `${cp}0d`, borderRadius: 6, borderLeft: `3px solid ${cp}` }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: cs }}>{h.jour}</span>
                      <span style={{ fontSize: 14, color: `${ct}bb` }}>{h.heure}</span>
                    </div>
                  ))}
                </div>
                {config.carte_reservationUrl && (
                  <a href={config.carte_reservationUrl} target="_blank" rel="noopener noreferrer" className="btn-principal" style={{ display: 'block', textAlign: 'center', marginTop: 28 }}>Réserver une table</a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          ██ CV — Portrait + Services
      ══════════════════════════════════════════════════════════ */}
      {config.sousType === 'cv' && (
        <>
          <section id="services" style={{ padding: '80px 24px', background: `${cs}05` }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              {/* Portrait + bio côte à côte */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 32 : 60, alignItems: 'center', marginBottom: 72 }}>
                {config.cv_photoPortrait && config.cv_photoPortrait.startsWith('http') && (
                  <div className="reveal-left" style={{ flexShrink: 0 }}>
                    <img
                      src={config.cv_photoPortrait}
                      alt={config.nomEntreprise}
                      style={{ width: 260, height: 320, objectFit: 'cover', borderRadius: 8, boxShadow: `0 20px 50px ${cs}30` }}
                      onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="reveal-right">
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Profil</p>
                  <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: cs, marginBottom: 8 }}>{config.nomEntreprise}</h2>
                  <p style={{ fontSize: 16, color: cp, fontWeight: 500, marginBottom: 20 }}>{config.cv_titre}</p>
                  <div className="separateur" />
                  <p style={{ fontSize: 16, color: `${ct}99`, lineHeight: 1.75 }}>{config.description}</p>
                  {config.cv_rdvUrl && (
                    <a href={config.cv_rdvUrl} target="_blank" rel="noopener noreferrer" className="btn-principal" style={{ marginTop: 28 }}>Prendre rendez-vous</a>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="reveal" style={{ textAlign: 'center', marginBottom: 40 }}>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Ce que je fais</p>
                <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, color: cs }}>Mes services</h2>
                <div className="separateur" style={{ margin: '18px auto 0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(config.cv_services.length, 3)}, 1fr)`, gap: 24 }}>
                {config.cv_services.map((s, i) => (
                  <div key={i} className="service-card reveal" style={{ background: cf, borderRadius: 8, padding: '32px 28px', border: `1px solid ${cp}20`, animationDelay: `${i * 0.1}s` }}>
                    <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icone}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: cs, marginBottom: 10 }}>{s.titre}</h3>
                    <p style={{ fontSize: 14, color: `${ct}88`, lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Témoignages */}
          {config.cv_temoignages.length > 0 && (
            <section id="temoignages" style={{ padding: '80px 24px', background: cf }}>
              <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Ils me font confiance</p>
                  <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, color: cs }}>Témoignages</h2>
                  <div className="separateur" style={{ margin: '18px auto 0' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 24 }}>
                  {config.cv_temoignages.map((t, i) => (
                    <div key={i} className="reveal" style={{ background: `${cs}06`, borderRadius: 8, padding: '28px 32px', borderLeft: `4px solid ${cp}`, animationDelay: `${i * 0.1}s` }}>
                      <p style={{ fontSize: 32, color: cp, fontFamily: 'Georgia, serif', lineHeight: 1, marginBottom: 12, opacity: 0.5 }}>"</p>
                      <p style={{ fontSize: 15, color: ct, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 20 }}>{t.texte}</p>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: cs }}>{t.nom}</p>
                        <p style={{ fontSize: 12, color: `${ct}66`, marginTop: 2 }}>{t.poste}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          ██ ÉVÉNEMENTIEL — Compteur + Programme
      ══════════════════════════════════════════════════════════ */}
      {config.sousType === 'evenementiel' && (
        <>
          <CompteurSection config={config} cp={cp} cs={cs} cf={cf} ct={ct} isMobile={isMobile} />
          <section id="programme" style={{ padding: '80px 24px', background: cf }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
                <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Déroulement</p>
                <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 700, color: cs }}>Programme de la journée</h2>
                <div className="separateur" style={{ margin: '18px auto 0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {config.event_programme.map((p, i) => (
                  <div key={i} className="reveal" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '20px 0', borderBottom: `1px solid ${cs}12`, animationDelay: `${i * 0.08}s` }}>
                    <div style={{ flexShrink: 0, width: 72 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cp, fontVariantNumeric: 'tabular-nums' }}>{p.heure}</span>
                    </div>
                    <div style={{ width: 3, height: 48, background: `${cp}30`, borderRadius: 2, flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: cs, marginBottom: 4 }}>{p.titre}</h3>
                      <p style={{ fontSize: 13, color: `${ct}77`, lineHeight: 1.5 }}>{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {config.event_billeterieUrl && (
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                  <a href={config.event_billeterieUrl} target="_blank" rel="noopener noreferrer" className="btn-principal" style={{ fontSize: 16, padding: '14px 36px' }}>
                    Obtenir mes billets →
                  </a>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION CONTACT (tous les types)
      ══════════════════════════════════════════════════════════ */}
      <section id="contact" style={{ padding: '80px 24px', background: cs, color: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }} className="reveal">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 16 }}>Contact</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, color: '#fff', marginBottom: 16 }}>Parlons-nous</h2>
          <div className="separateur" style={{ margin: '0 auto 24px' }} />
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 36 }}>
            {config.sousType === 'evenementiel'
              ? `Lieu : ${config.event_lieu}`
              : `N'hésitez pas à me rejoindre pour toute question ou collaboration.`}
          </p>
          {/* Réseaux sociaux */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {config.instagram && (
              <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, padding: '10px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, transition: 'background 0.2s' }}>
                📷 Instagram
              </a>
            )}
            {config.facebook && (
              <a href={`https://facebook.com/${config.facebook}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, padding: '10px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                👥 Facebook
              </a>
            )}
            {config.linkedin && (
              <a href={`https://linkedin.com/in/${config.linkedin}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, padding: '10px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                💼 LinkedIn
              </a>
            )}
            {config.tiktok && (
              <a href={`https://tiktok.com/@${config.tiktok}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, padding: '10px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                🎵 TikTok
              </a>
            )}
            {config.siteExterne && (
              <a href={config.siteExterne} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14, padding: '10px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                🌐 Site web
              </a>
            )}
          </div>
          {config.carte_email && (
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
              <a href={`mailto:${config.carte_email}`} style={{ color: cp, textDecoration: 'none', fontWeight: 500 }}>{config.carte_email}</a>
            </p>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '24px', background: cs, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {config.nomEntreprise} — Propulsé par <span style={{ color: cp }}>e-Vend Studio</span>
        </p>
      </footer>
    </div>
  );
}

// ─── SOUS-COMPOSANT: Compteur événement ──────────────────────────────────────

function CompteurSection({ config, cp, cs, cf, ct, isMobile }: { config: ConfigVitrine; cp: string; cs: string; cf: string; ct: string; isMobile: boolean }) {
  const temps = useCompteurEvenement(config.event_dateEvenement);
  const dateAffichee = new Date(config.event_dateEvenement).toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <section id="infos" style={{ padding: '80px 24px', background: `${cp}12` }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }} className="reveal">
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>L'événement approche</p>
        <p style={{ fontSize: 17, color: cs, fontWeight: 500, marginBottom: 36, textTransform: 'capitalize' }}>{dateAffichee}</p>
        <div style={{ display: 'flex', gap: isMobile ? 12 : 24, justifyContent: 'center', marginBottom: 32, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          {[
            { valeur: temps.jours, label: 'Jours' },
            { valeur: temps.heures, label: 'Heures' },
            { valeur: temps.minutes, label: 'Minutes' },
            { valeur: temps.secondes, label: 'Secondes' },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', background: cf, borderRadius: 8, padding: '20px 28px', minWidth: 90, boxShadow: `0 4px 20px ${cs}15` }}>
              <div style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: cp, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {String(item.valeur).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: `${ct}66`, marginTop: 8 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 15, color: `${ct}88`, marginBottom: 8 }}>📍 {config.event_lieu}</p>
      </div>
    </section>
  );
}