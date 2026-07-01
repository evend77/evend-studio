// src/templates/TemplateAvocat.tsx
import { useContactStudio, HoneypotField } from '../hooks/useContactStudio';
// e-Vend Studio — Template Bureau d'Avocat & Services Juridiques
// Style : fond marine #0d1b2e / or #c9a84c / blanc ivoire
// Typo : Playfair Display (serif) + Inter
// Sections ON/OFF + réordonnables

import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SectionConfig {
  id: string;
  actif: boolean;
  ordre: number;
  label: string;
}

export interface DomaineJuridique {
  nom: string;
  description: string;
  icone: string;   // SVG path ou emoji
}

export interface MembreEquipe {
  nom: string;
  titre: string;
  description: string;
  photo: string;
  barreaux?: string;
}

export interface AvisClient {
  titre: string;
  texte: string;
  auteur: string;
  role: string;
  note: number;
}

export interface FaqItem {
  question: string;
  reponse: string;
}

export interface ConfigAvocat {
  // Identité
  nomCabinet: string;
  slogan: string;
  sloganAccent: string;
  description: string;
  logoUrl: string;

  // Photos
  photoHero: string;
  photoAPropos: string;
  photoConsultation: string;

  // Couleurs
  couleurFond: string;        // marine sombre #0d1b2e
  couleurFondCarte: string;   // marine carte #162035
  couleurFondClair: string;   // blanc ivoire #f9f6f0
  couleurOr: string;          // or #c9a84c
  couleurTexte: string;       // blanc #ffffff
  couleurTexteSombre: string; // sombre #0d1b2e

  // Stats
  stats: { valeur: string; label: string }[];

  // Domaines
  domaines: DomaineJuridique[];

  // Équipe
  equipe: MembreEquipe[];

  // Avis
  avis: AvisClient[];

  // FAQ
  faq: FaqItem[];

  // Consultation
  titreConsultation: string;
  descConsultation: string;
  dureeConsultation: string;
  typeConsultation: string;

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  horaires: string[];
  coordGoogleMaps: string; // URL iframe Google Maps

  // CTA
  titreCTA: string;
  boutonsContact: string;

  // Sections
  sections: SectionConfig[];
  vendeurId?: number;
}

export const CONFIG_AVOCAT_DEFAUT: ConfigAvocat = {
  nomCabinet: 'Dubois & Associés',
  slogan: 'La justice servie avec',
  sloganAccent: 'intégrité.',
  description: 'Nous nous battons pour vos droits avec rigueur, compassion et expertise. Votre partenaire juridique de confiance depuis plus de 20 ans.',
  logoUrl: '',

  photoHero: 'https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1600',
  photoAPropos: 'https://images.pexels.com/photos/5668772/pexels-photo-5668772.jpeg?auto=compress&cs=tinysrgb&w=900',
  photoConsultation: 'https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=900',

  couleurFond: '#0d1b2e',
  couleurFondCarte: '#162035',
  couleurFondClair: '#f9f6f0',
  couleurOr: '#c9a84c',
  couleurTexte: '#ffffff',
  couleurTexteSombre: '#0d1b2e',

  stats: [
    { valeur: '20+', label: "Années d'expérience" },
    { valeur: '500+', label: 'Dossiers résolus' },
    { valeur: '95%', label: 'Taux de succès' },
  ],

  domaines: [
    { nom: 'Droit de la famille', description: 'Divorce, garde d\'enfants, pension alimentaire, adoption. Nous vous guidons avec compassion à travers chaque étape.', icone: '👨‍👩‍👧' },
    { nom: 'Préjudice corporel', description: 'Accidents, négligence médicale, blessures au travail. Nous combattons pour obtenir la compensation que vous méritez.', icone: '⚖️' },
    { nom: 'Litige commercial', description: 'Contrats, litiges d\'affaires, propriété intellectuelle. Protection robuste de vos intérêts commerciaux.', icone: '💼' },
    { nom: 'Droit immobilier', description: 'Achat, vente, baux commerciaux et résidentiels. Sécurisez vos transactions immobilières.', icone: '🏛️' },
    { nom: 'Droit du travail', description: 'Congédiements injustifiés, discrimination, contrats d\'emploi. Défendons vos droits en milieu de travail.', icone: '🤝' },
    { nom: 'Planification successorale', description: 'Testaments, fiducies, mandats de protection. Protégez votre patrimoine et vos proches.', icone: '📜' },
  ],

  equipe: [
    { nom: 'Me Anna Dubois', titre: 'Associée fondatrice', description: 'Spécialisée en droit de la famille et litige civil, Me Dubois est reconnue pour son approche humaine et ses résultats exceptionnels.', photo: 'https://images.pexels.com/photos/3756678/pexels-photo-3756678.jpeg?auto=compress&cs=tinysrgb&w=600', barreaux: 'Barreau du Québec, 2004' },
    { nom: 'Me Marc Tremblay', titre: 'Associé', description: 'Expert en droit corporatif et litige commercial, Me Tremblay représente des entreprises de toutes tailles depuis 15 ans.', photo: 'https://images.pexels.com/photos/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=600', barreaux: 'Barreau du Québec, 2009' },
    { nom: 'Me Sarah Chen', titre: 'Avocate associée', description: 'Passionnée par le droit du travail et la défense des droits des employés, Me Chen est une négociatrice redoutable.', photo: 'https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=600', barreaux: 'Barreau du Québec, 2015' },
  ],

  avis: [
    { titre: 'Service exceptionnel et compassion', texte: 'Dubois & Associés m\'a accompagné lors d\'un divorce difficile avec une profессionalisme et une empathie remarquables. Je leur fais entièrement confiance.', auteur: 'Marie L.', role: 'Cliente, droit familial', note: 5 },
    { titre: 'Résultats bien au-delà de mes attentes', texte: 'Après mon accident de travail, je pensais ne jamais obtenir justice. L\'équipe a combattu pour moi et obtenu une compensation qui couvre tous mes besoins.', auteur: 'Pierre M.', role: 'Client, préjudice corporel', note: 5 },
    { titre: 'Professionnalisme de haut niveau', texte: 'Leur expertise en litige commercial a permis de résoudre un conflit complexe avec notre partenaire. Stratégiques, efficaces et toujours disponibles.', auteur: 'R. Patel, PDG', role: 'Client, litige commercial', note: 5 },
    { titre: 'Planification successorale sans stress', texte: 'Me Chen a rendu le processus de planification testamentaire simple et rassurant. Tout a été expliqué clairement. Fortement recommandé.', auteur: 'Claudette B.', role: 'Cliente, droit successoral', note: 5 },
  ],

  faq: [
    { question: 'Dans quels domaines du droit intervenez-vous ?', reponse: 'Notre cabinet couvre le droit de la famille, le préjudice corporel, le litige commercial, le droit immobilier, le droit du travail et la planification successorale.' },
    { question: 'Offrez-vous une consultation initiale gratuite ?', reponse: 'Oui! Nous offrons une consultation initiale gratuite de 30 minutes pour évaluer votre situation et vous expliquer vos options juridiques sans engagement.' },
    { question: 'Quels sont vos honoraires ?', reponse: 'Nos honoraires varient selon la nature et la complexité du dossier. Nous offrons différentes structures : taux horaire, forfait ou honoraires conditionnels pour certains types de dossiers.' },
    { question: 'Combien de temps dure un dossier juridique ?', reponse: 'La durée varie grandement selon le type de dossier. Un règlement à l\'amiable peut prendre quelques semaines, tandis qu\'un litige en cour peut s\'étendre sur plusieurs mois ou années.' },
    { question: 'Puis-je consulter à distance ?', reponse: 'Absolument! Nous offrons des consultations virtuelles par vidéoconférence pour votre commodité, tout en maintenant la confidentialité et le professionnalisme de nos services.' },
  ],

  titreConsultation: 'Planifiez une consultation gratuite',
  descConsultation: 'Rencontrez l\'un de nos avocats pour discuter de votre situation. Consultation initiale sans frais ni engagement.',
  dureeConsultation: '30 min',
  typeConsultation: 'Consultation virtuelle ou en personne',

  adresse: '1000 rue De La Gauchetière Ouest, Suite 2500',
  ville: 'Montréal, QC H3B 4W5',
  telephone: '(514) 555-0123',
  email: 'info@duboisassocies.ca',
  horaires: ['Lun – Ven : 8h30 – 17h30', 'Samedi : Sur rendez-vous', 'Dimanche : Fermé'],
  coordGoogleMaps: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2796.7!2d-73.5698!3d45.4994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDI5JzU3LjkiTiA3M8KwMzQnMTEuMyJX!5e0!3m2!1sfr!2sca!4v1',

  titreCTA: 'Prenez rendez-vous dès aujourd\'hui',
  boutonsContact: 'Consultation gratuite →',

  sections: [
    { id: 'hero',          actif: true,  ordre: 1, label: 'Hero (accueil)'         },
    { id: 'stats',         actif: true,  ordre: 2, label: 'Chiffres clés'          },
    { id: 'apropos',       actif: true,  ordre: 3, label: 'À propos du cabinet'    },
    { id: 'domaines',      actif: true,  ordre: 4, label: 'Domaines d\'expertise'  },
    { id: 'equipe',        actif: true,  ordre: 5, label: 'Notre équipe'           },
    { id: 'avis',          actif: true,  ordre: 6, label: 'Témoignages clients'    },
    { id: 'consultation',  actif: true,  ordre: 7, label: 'Consultation gratuite'  },
    { id: 'faq',           actif: true,  ordre: 8, label: 'FAQ'                    },
    { id: 'contact',       actif: true,  ordre: 9, label: 'Contact & Carte'        },
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

function useCounter(cible: number, actif: boolean, duree = 1600) {
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

function ensureArray<T>(val: any, defaut: T[]): T[] {
  return Array.isArray(val) && val.length > 0 ? val : defaut;
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav({ config, page, setPage }: { config: ConfigAvocat; page: string; setPage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const co = config.couleurOr;
  const cf = config.couleurFond;
  const cfk = config.couleurFondCarte;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');
        .nav-av { font-family:'Inter',sans-serif; font-size:14px; font-weight:400; color:rgba(255,255,255,0.75); cursor:pointer; background:none; border:none; padding:4px 0; transition:color .2s; letter-spacing:0.02em; }
        .nav-av:hover,.nav-av.active { color:#fff; }
        .btn-consult { background:${co}; color:${cf}; border:none; border-radius:6px; padding:10px 22px; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:filter .2s,transform .2s; letter-spacing:0.03em; }
        .btn-consult:hover { filter:brightness(.88); }
        .btn-or { background:${co}; color:${cf}; border:none; border-radius:6px; padding:14px 32px; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:filter .2s,transform .2s; letter-spacing:0.03em; }
        .btn-or:hover { filter:brightness(.88); transform:translateY(-1px); }
        .btn-outline-blanc { background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,0.4); border-radius:6px; padding:13px 30px; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all .2s; }
        .btn-outline-blanc:hover { border-color:#fff; background:rgba(255,255,255,0.07); }
        .btn-sombre { background:${cf}; color:#fff; border:none; border-radius:6px; padding:14px 32px; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:filter .2s; }
        .btn-sombre:hover { filter:brightness(1.2); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .8s cubic-bezier(.22,1,.36,1) both; }
        .fade-up-2 { animation: fadeUp .8s .15s cubic-bezier(.22,1,.36,1) both; }
        .fade-up-3 { animation: fadeUp .8s .28s cubic-bezier(.22,1,.36,1) both; }
        .rv { opacity:0; transform:translateY(36px); transition:opacity .7s ease,transform .7s ease; }
        .rv.vis { opacity:1; transform:translateY(0); }
        .rv-l { opacity:0; transform:translateX(-40px); transition:opacity .7s ease,transform .7s ease; }
        .rv-l.vis { opacity:1; transform:translateX(0); }
        .rv-r { opacity:0; transform:translateX(40px); transition:opacity .7s ease,transform .7s ease; }
        .rv-r.vis { opacity:1; transform:translateX(0); }
        .carte-domaine { background:${cfk}; border:1px solid rgba(201,168,76,0.12); border-radius:16px; padding:28px 24px; transition:border-color .3s,transform .3s,box-shadow .3s; cursor:default; }
        .carte-domaine:hover { border-color:${co}60; transform:translateY(-5px); box-shadow:0 16px 40px rgba(0,0,0,0.3); }
        .carte-equipe { border-radius:16px; overflow:hidden; background:${cfk}; transition:transform .3s,box-shadow .3s; }
        .carte-equipe:hover { transform:translateY(-6px); box-shadow:0 20px 50px rgba(0,0,0,0.3); }
        .carte-equipe img { transition:transform .6s ease; }
        .carte-equipe:hover img { transform:scale(1.05); }
        .faq-item { border-bottom:1px solid rgba(255,255,255,0.1); }
        .faq-btn { width:100%; background:none; border:none; cursor:pointer; padding:20px 0; display:flex; justify-content:space-between; align-items:center; color:#fff; font-family:'Playfair Display',serif; font-size:17px; font-weight:400; text-align:left; }
        .faq-btn:hover { color:${co}; }
        .avis-card { background:${cf}; border:1px solid rgba(201,168,76,0.15); border-radius:16px; padding:28px 24px; transition:border-color .3s; }
        .avis-card:hover { border-color:${co}50; }
        input-av, .textarea-av { font-family:'Inter',sans-serif; }
      `}</style>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? `${cf}f8` : 'rgba(10,8,5,.85)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid rgba(201,168,76,0.15)` : 'none',
        transition: 'all .4s',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Liens gauche */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[['accueil', 'Accueil'], ['apropos', 'À propos'], ['contact', 'Contact']].map(([id, label]) => (
              <button key={id} className={`nav-av${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>{label}</button>
            ))}
          </div>

          {/* Logo centre */}
          <div onClick={() => setPage('accueil')} style={{ cursor: 'pointer', textAlign: 'center' }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: '#fff', letterSpacing: '0.08em' }}>
              {config.nomCabinet.split('&')[0].trim()}
            </span>
            {config.nomCabinet.includes('&') && (
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: co, letterSpacing: '0.08em' }}>
                {' '}&amp;{config.nomCabinet.split('&')[1]}
              </span>
            )}
          </div>

          {/* Droite */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button className="nav-av" onClick={() => setPage('contact')}>
              Se connecter
            </button>
            <button className="btn-consult" onClick={() => setPage('consultation')}>
              {config.boutonsContact}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

// ─── SECTION HERO ─────────────────────────────────────────────────────────────

function SectionHero({ config, setPage }: { config: ConfigAvocat; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurOr;
  const cf = config.couleurFond;

  return (
    <section style={{ background: cf, minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: 72 }}>
      {/* Texture subtile */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse at 20% 50%, ${co}08 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)` }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center', width: '100%' }}>
        {/* Texte gauche */}
        <div>
          <p className="fade-up" style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
            Votre partenaire juridique de confiance
          </p>
          <h1 className="fade-up-2" style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 4.5vw, 62px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 24 }}>
            {config.slogan}<br />
            <em style={{ fontStyle: 'italic', color: co }}>{config.sloganAccent}</em>
          </h1>
          <p className="fade-up-3" style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 40, maxWidth: 460 }}>
            {config.description}
          </p>
          <div className="fade-up-3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button className="btn-or" onClick={() => setPage('consultation')}>
              {config.boutonsContact}
            </button>
            <button className="btn-outline-blanc" onClick={() => setPage('domaines')}>
              Nos services
            </button>
          </div>
        </div>

        {/* Photo droite avec cadre décoratif */}
        <div style={{ position: 'relative' }}>
          {/* Cadre doré décoratif */}
          <div style={{
            position: 'absolute', top: -16, right: -16, bottom: 16, left: 16,
            border: `1px solid ${co}40`, borderRadius: 20, zIndex: 0,
          }} />
          {/* Photo */}
          <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', zIndex: 1, aspectRatio: '4/5', maxHeight: 580 }}>
            <img src={config.photoHero} alt="avocat" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Overlay gradient bas */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `linear-gradient(to top, ${cf}cc, transparent)` }} />
          </div>
          {/* Badge flottant */}
          <div style={{
            position: 'absolute', bottom: 28, left: -20, zIndex: 2,
            background: co, borderRadius: 12, padding: '14px 20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: config.couleurTexteSombre, margin: 0, lineHeight: 1 }}>
              {config.stats[0]?.valeur}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: config.couleurTexteSombre, opacity: 0.8, marginTop: 4 }}>
              {config.stats[0]?.label}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION STATS ─────────────────────────────────────────────────────────────

function SectionStats({ config }: { config: ConfigAvocat }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.1);
  const co = config.couleurOr;
  const stats = ensureArray(config.stats, CONFIG_AVOCAT_DEFAUT.stats);

  const parseVal = (v: string) => parseInt(v.replace(/[^0-9]/g, '')) || 0;
  const suffix = (v: string) => v.replace(/[0-9]/g, '');
  const c0 = useCounter(parseVal(stats[0]?.valeur || '0'), rv.vis);
  const c1 = useCounter(parseVal(stats[1]?.valeur || '0'), rv.vis);
  const c2 = useCounter(parseVal(stats[2]?.valeur || '0'), rv.vis);
  const counters = [c0, c1, c2];

  return (
    <section style={{ background: co, padding: '56px 40px' }}>
      <div ref={rv.ref} style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 40, opacity: rv.vis ? 1 : 0, transform: rv.vis ? 'none' : 'translateY(30px)', transition: 'all .7s ease' }}>
        <div style={{ gridColumn: '1', paddingRight: 40, borderRight: '1px solid rgba(13,27,46,0.2)' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontStyle: 'italic', color: config.couleurTexteSombre, opacity: 0.7, marginBottom: 20, lineHeight: 1.6, maxWidth: 280 }}>
            Notre bilan parle pour lui-même. Des décennies d'expertise au service de nos clients.
          </p>
        </div>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: i === stats.length - 1 ? 'right' : 'center', borderRight: i < stats.length - 1 ? '1px solid rgba(13,27,46,0.2)' : 'none', paddingRight: 20 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 700, color: config.couleurTexteSombre, lineHeight: 1, marginBottom: 6 }}>
              {counters[i]}{suffix(s.valeur)}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: config.couleurTexteSombre, opacity: 0.7 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SECTION À PROPOS ─────────────────────────────────────────────────────────

function SectionAPropos({ config, setPage }: { config: ConfigAvocat; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rvL = useReveal(0.08);
  const rvR = useReveal(0.08);
  const co = config.couleurOr;
  const cf = config.couleurFond;

  return (
    <section style={{ background: cf, padding: '100px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center' }}>
        {/* Photo gauche */}
        <div ref={rvL.ref} className={`rv-l${rvL.vis ? ' vis' : ''}`} style={{ position: 'relative' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3' }}>
            <img src={config.photoAPropos} alt="cabinet" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .6s ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'} />
          </div>
          {/* Ligne décorative or */}
          <div style={{ position: 'absolute', bottom: -24, right: -24, width: 120, height: 120, border: `2px solid ${co}30`, borderRadius: 16 }} />
        </div>

        {/* Texte droite */}
        <div ref={rvR.ref} className={`rv-r${rvR.vis ? ' vis' : ''}`}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>À propos du cabinet</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 24 }}>
            Chez {config.nomCabinet.split('&')[0].trim()}, nous croyons en une approche{' '}
            <em style={{ fontStyle: 'italic', color: co }}>centrée sur le client</em>
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, marginBottom: 16 }}>
            {config.description}
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontStyle: 'italic', color: co, lineHeight: 1.7, marginBottom: 36 }}>
            Que vous ayez besoin d'aide en droit de la famille, en préjudice corporel ou en litige commercial, vous pouvez compter sur notre expertise et notre dévouement.
          </p>
          <button className="btn-or" onClick={() => setPage('consultation')}>
            {config.boutonsContact}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION DOMAINES ─────────────────────────────────────────────────────────

function SectionDomaines({ config, setPage }: { config: ConfigAvocat; setPage: (p: string) => void }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cf = config.couleurFond;
  const domaines = ensureArray(config.domaines, CONFIG_AVOCAT_DEFAUT.domaines);

  return (
    <section style={{ background: config.couleurFondClair, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: 64, marginBottom: 56, alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Services</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 700, color: config.couleurTexteSombre, lineHeight: 1.2, marginBottom: 20 }}>
              Solutions juridiques complètes adaptées à vos besoins
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 28 }}>
              Avec notre vaste expérience, nous sommes votre partenaire de confiance pour tous vos besoins juridiques.
            </p>
            <button className="btn-sombre" onClick={() => setPage('consultation')}>
              Commencer
            </button>
          </div>

          {/* Grille domaines 3x2 */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {domaines.slice(0, 4).map((d, i) => (
              <div key={i} style={{
                background: '#fff', border: '1px solid #e8e0d0', borderRadius: 16, padding: '24px 20px',
                transition: 'border-color .3s, transform .3s, box-shadow .3s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = co; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e8e0d0'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{d.icone}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: config.couleurTexteSombre, marginBottom: 8 }}>{d.nom}</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#666', lineHeight: 1.6 }}>{d.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Liste complète des domaines */}
        <div style={{ background: cf, borderRadius: 20, padding: '40px 48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 600, color: '#fff' }}>
              Notre liste complète de services
            </h3>
            <button className="btn-or" onClick={() => setPage('consultation')}>Commencer</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
            {domaines.map((d, i) => (
              <div key={i} style={{
                background: config.couleurFondCarte, border: '1px solid rgba(201,168,76,0.15)',
                borderRadius: 14, padding: '20px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'border-color .3s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${co}50`}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(201,168,76,0.15)'}>
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{d.icone}</div>
                <div>
                  <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{d.nom}</h4>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION ÉQUIPE ───────────────────────────────────────────────────────────

function SectionEquipe({ config }: { config: ConfigAvocat }) {
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const equipe = ensureArray(config.equipe, CONFIG_AVOCAT_DEFAUT.equipe);

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Notre équipe</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            Des avocats <em style={{ fontStyle: 'italic', color: co }}>dévoués</em> à votre cause
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(equipe.length, 3)}, 1fr)`, gap: 28 }}>
          {equipe.map((m, i) => (
            <div key={i} className="carte-equipe">
              {/* Photo */}
              <div style={{ height: 320, overflow: 'hidden', position: 'relative' }}>
                <img src={m.photo} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${config.couleurFond}dd 0%, transparent 60%)` }} />
                <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{m.nom}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: co, fontWeight: 500 }}>{m.titre}</p>
                </div>
              </div>
              {/* Infos */}
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 12 }}>{m.description}</p>
                {m.barreaux && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: co, fontWeight: 500 }}>📋 {m.barreaux}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION AVIS ─────────────────────────────────────────────────────────────

function SectionAvis({ config, setPage }: { config: ConfigAvocat; setPage: (p: string) => void }) {
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const avis = ensureArray(config.avis, CONFIG_AVOCAT_DEFAUT.avis);

  return (
    <section style={{ background: config.couleurFondClair, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>Témoignages</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 700, color: config.couleurTexteSombre, lineHeight: 1.2, marginBottom: 16 }}>
            Ce que disent nos clients
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#666', maxWidth: 560, margin: '0 auto 12px', lineHeight: 1.7 }}>
            Chez {config.nomCabinet}, nous sommes fiers de notre engagement envers l'excellence et la satisfaction de nos clients.
          </p>
          <button className="btn-sombre" onClick={() => setPage('consultation')} style={{ margin: '12px 0 40px' }}>
            Commencer
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {avis.map((a, i) => (
            <div key={i} className="avis-card">
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontStyle: 'italic', color: config.couleurTexteSombre, marginBottom: 12, lineHeight: 1.3 }}>
                "{a.titre}"
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>{a.texte}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, color: config.couleurTexteSombre }}>– {a.auteur}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#888' }}>{a.role}</p>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(a.note)].map((_, j) => <span key={j} style={{ color: co, fontSize: 14 }}>★</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECTION CONSULTATION ─────────────────────────────────────────────────────

function SectionConsultation({ config }: { config: ConfigAvocat }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.08);
  const co = config.couleurOr;
  const cf = config.couleurFond;
  const cfk = config.couleurFondCarte;

  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', sujet: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cabinet: config.nomCabinet, type: 'consultation-avocat', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', background: cfk,
    border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 8,
    fontSize: 14, color: '#fff', outline: 'none',
    fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
    transition: 'border-color .2s',
  };

  return (
    <section style={{ background: cf, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 16 }}>
          {config.titreConsultation}
        </h2>

        <div style={{ maxWidth: 800, margin: '0 auto', background: cfk, borderRadius: 24, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1.5fr' }}>
          {/* Photo + infos */}
          <div style={{ position: 'relative' }}>
            <img src={config.photoConsultation} alt="consultation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${cf}ee 0%, ${cf}44 60%, transparent 100%)` }} />
            <div style={{ position: 'absolute', bottom: 28, left: 24, right: 24 }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{config.typeConsultation}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Consultation initiale</p>
              <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: co, fontWeight: 600 }}>⏱ {config.dureeConsultation}</p>
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ padding: 36 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: co, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24 }}>
              Planifiez votre rendez-vous
            </p>

            {envoye ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#fff', marginBottom: 10 }}>Demande envoyée!</h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Nous vous contacterons très rapidement.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                </div>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Adresse courriel" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                <input type="tel" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="Numéro de téléphone" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                <input value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} placeholder="Sujet" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Message" rows={3}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                  onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
              <button disabled={loading || !form.email || !form.prenom}
                  style={{ background: co, color: config.couleurTexteSombre, border: 'none', borderRadius: 8, padding: '14px', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: !form.email || !form.prenom ? 0.5 : 1, transition: 'filter .2s' }}
                  onMouseEnter={e => { if (form.email && form.prenom) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(.88)'; }}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}>
                  {loading ? 'Envoi...' : 'Envoyer ma demande'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECTION FAQ ──────────────────────────────────────────────────────────────

function SectionFAQ({ config }: { config: ConfigAvocat }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const faq = ensureArray(config.faq, CONFIG_AVOCAT_DEFAUT.faq);
  const [ouvert, setOuvert] = useState<number | null>(0);

  return (
    <section style={{ background: config.couleurFond, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            Questions fréquentes
          </h2>
        </div>
        <div>
          {faq.map((f, i) => (
            <div key={i} className="faq-item">
              <button className="faq-btn" onClick={() => setOuvert(ouvert === i ? null : i)}>
                <span>{f.question}</span>
                <span style={{ color: co, fontSize: 20, flexShrink: 0, marginLeft: 16, transition: 'transform .3s', transform: ouvert === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </button>
              <div style={{
                overflow: 'hidden', maxHeight: ouvert === i ? '300px' : '0',
                transition: 'max-height .4s ease',
              }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, paddingBottom: 20 }}>
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

function SectionContact({ config }: { config: ConfigAvocat }) {
  const { isMobile } = useIsMobile();
  const rv = useReveal(0.05);
  const co = config.couleurOr;
  const cf = config.couleurFond;
  const horaires = ensureArray(config.horaires, CONFIG_AVOCAT_DEFAUT.horaires);

  return (
    <section style={{ background: config.couleurFondClair, padding: '100px 40px' }}>
      <div ref={rv.ref} className={`rv${rv.vis ? ' vis' : ''}`} style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: isMobile ? 24 : 60, alignItems: 'flex-start' }}>
          {/* Infos contact */}
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: co, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Vous avez des questions?</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 700, color: config.couleurTexteSombre, lineHeight: 1.2, marginBottom: 32 }}>
              Contactez-nous
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: co, fontSize: 16 }}>✉️</span>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: config.couleurTexteSombre }}>{config.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: co, fontSize: 16 }}>📞</span>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: config.couleurTexteSombre }}>{config.telephone}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ color: co, fontSize: 16 }}>📍</span>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: config.couleurTexteSombre, lineHeight: 1.6 }}>{config.adresse}<br />{config.ville}</p>
              </div>
            </div>

            {/* Carte Google Maps */}
            <div style={{ borderRadius: 16, overflow: 'hidden', height: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
              <iframe
                src={config.coordGoogleMaps}
                width="100%" height="100%" style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Localisation du cabinet"
              />
            </div>
          </div>

          {/* Formulaire contact */}
          <div style={{ background: cf, borderRadius: 20, padding: '40px 36px' }}>
            <ContactForm config={config} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactForm({ config }: { config: ConfigAvocat }) {
  const { isMobile } = useIsMobile();
  const co = config.couleurOr;
  const cfk = config.couleurFondCarte;
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', sujet: '', message: '' });
  const [envoye, setEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cabinet: config.nomCabinet, type: 'contact-avocat', vendeur_id: config.vendeurId || 0 }),
      });
    } catch {}
    setEnvoye(true); // handled by hook
    setLoading(false);
  };

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', background: cfk, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 14, color: '#fff', outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box', transition: 'border-color .2s', marginBottom: 12 };

  if (envoye) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#fff', marginBottom: 10 }}>Message envoyé!</h3>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Nous vous répondrons sous 24h.</p>
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 0 }}>
        <input placeholder="Prénom" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} style={inp}
          onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <input placeholder="Nom" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inp}
          onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <input type="email" placeholder="Courriel *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp}
          onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <input type="tel" placeholder="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inp}
          onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      </div>
      <input placeholder="Sujet" value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })} style={inp}
        onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      <textarea placeholder="Message *" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
        style={{ ...inp, resize: 'vertical' as const, marginBottom: 20 }}
        onFocus={e => e.target.style.borderColor = co} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      <button onClick={handleSubmit} disabled={loading || !form.email || !form.message}
        style={{ width: '100%', padding: '14px', background: config.couleurTexteSombre, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif", opacity: !form.email || !form.message ? 0.5 : 1 }}>
        {loading ? 'Envoi...' : 'Envoyer'}
      </button>
    </>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ config, setPage }: { config: ConfigAvocat; setPage: (p: string) => void }) {
  const co = config.couleurOr;
  const cf = config.couleurFond;
  const cfk = config.couleurFondCarte;
  const horaires = ensureArray(config.horaires, CONFIG_AVOCAT_DEFAUT.horaires);

  return (
    <footer style={{ background: cfk, borderTop: `1px solid rgba(201,168,76,0.15)`, padding: '60px 40px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr 1.2fr', gap: 48, marginBottom: 48 }}>
          {/* Logo + desc */}
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              {config.nomCabinet.split('&')[0].trim()}
              <span style={{ color: co }}>{config.nomCabinet.includes('&') ? ' & ' + config.nomCabinet.split('&')[1] : ''}</span>
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 240, marginTop: 12 }}>
              {config.description}
            </p>
          </div>
          {/* Menu */}
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontStyle: 'italic', color: co, marginBottom: 18 }}>Menu</h4>
            {[['accueil', 'Accueil'], ['apropos', 'À propos'], ['contact', 'Contact'], ['domaines', 'Services'], ['consultation', 'Consultation']].map(([id, label]) => (
              <p key={id} onClick={() => setPage(id)} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8, cursor: 'pointer', transition: 'color .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLParagraphElement).style.color = co}
                onMouseLeave={e => (e.currentTarget as HTMLParagraphElement).style.color = 'rgba(255,255,255,0.55)'}>
                {label}
              </p>
            ))}
          </div>
          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontStyle: 'italic', color: co, marginBottom: 18 }}>Contact</h4>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{config.adresse}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{config.ville}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: co, marginBottom: 6 }}>{config.email}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{config.telephone}</p>
          </div>
          {/* Horaires */}
          <div>
            <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontStyle: 'italic', color: co, marginBottom: 18 }}>Heures</h4>
            {horaires.map((h, i) => (
              <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{h}</p>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Politique de confidentialité</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} {config.nomCabinet}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export interface TemplateAvocatProps {
  config?: Partial<ConfigAvocat>;
  isPreview?: boolean;
}

export default function TemplateAvocat({ config: partiel, isPreview }: TemplateAvocatProps) {
  // Vérifier si les couleurs sont celles du template avocat (marine sombre)
  const isFondSombre = (c?: string): boolean => {
    if (!c || typeof c !== 'string') return false;
    const hex = c.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 80;
  };
  const couleursValides = isFondSombre(partiel?.couleurFond);

  const config: ConfigAvocat = {
    ...CONFIG_AVOCAT_DEFAUT,
    ...partiel,
    couleurFond:        couleursValides ? (partiel?.couleurFond        || CONFIG_AVOCAT_DEFAUT.couleurFond)        : CONFIG_AVOCAT_DEFAUT.couleurFond,
    couleurFondCarte:   couleursValides ? (partiel?.couleurFondCarte   || CONFIG_AVOCAT_DEFAUT.couleurFondCarte)   : CONFIG_AVOCAT_DEFAUT.couleurFondCarte,
    couleurFondClair:   partiel?.couleurFondClair   || CONFIG_AVOCAT_DEFAUT.couleurFondClair,
    couleurOr:          partiel?.couleurOr          || CONFIG_AVOCAT_DEFAUT.couleurOr,
    couleurTexte:       couleursValides ? (partiel?.couleurTexte       || CONFIG_AVOCAT_DEFAUT.couleurTexte)       : CONFIG_AVOCAT_DEFAUT.couleurTexte,
    couleurTexteSombre: partiel?.couleurTexteSombre || CONFIG_AVOCAT_DEFAUT.couleurTexteSombre,
  };

  config.stats    = ensureArray(partiel?.stats,    CONFIG_AVOCAT_DEFAUT.stats);
  config.domaines = ensureArray(partiel?.domaines, CONFIG_AVOCAT_DEFAUT.domaines);
  config.equipe   = ensureArray(partiel?.equipe,   CONFIG_AVOCAT_DEFAUT.equipe);
  config.avis     = ensureArray(partiel?.avis,     CONFIG_AVOCAT_DEFAUT.avis);
  config.faq      = ensureArray(partiel?.faq,      CONFIG_AVOCAT_DEFAUT.faq);
  config.horaires = ensureArray(partiel?.horaires, CONFIG_AVOCAT_DEFAUT.horaires);
  const VALID_IDS_AVOCAT = ['hero', 'stats', 'apropos', 'domaines', 'equipe', 'avis', 'consultation', 'faq', 'contact'];
  const rawSectionsAvocat = ensureArray(partiel?.sections, CONFIG_AVOCAT_DEFAUT.sections);
  config.sections = rawSectionsAvocat.every((s: SectionConfig) => VALID_IDS_AVOCAT.includes(s.id))
    ? rawSectionsAvocat
    : CONFIG_AVOCAT_DEFAUT.sections;

  const [page, setPage] = useState('accueil');

  const handlePage = (p: string) => {
    setPage(p);
    if (!isPreview) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sections actives triées par ordre
  const sectionsActives = [...config.sections]
    .filter(s => s.actif)
    .sort((a, b) => a.ordre - b.ordre);

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':         return <SectionHero         config={config} setPage={handlePage} />;
      case 'stats':        return <SectionStats        config={config} />;
      case 'apropos':      return <SectionAPropos      config={config} setPage={handlePage} />;
      case 'domaines':     return <SectionDomaines     config={config} setPage={handlePage} />;
      case 'equipe':       return <SectionEquipe       config={config} />;
      case 'avis':         return <SectionAvis         config={config} setPage={handlePage} />;
      case 'consultation': return <SectionConsultation config={config} />;
      case 'faq':          return <SectionFAQ          config={config} />;
      case 'contact':      return <SectionContact      config={config} />;
      default:             return null;
    }
  };

  return (
    <div style={{ background: config.couleurFond, margin: 0, padding: 0 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
      <Nav config={config} page={page} setPage={handlePage} />
      <div style={{ paddingTop: 72 }}>
        {page === 'accueil' && (
          <>
            {sectionsActives.map(s => (
              <div key={s.id}>{renderSection(s.id)}</div>
            ))}
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'apropos' && (
          <>
            <SectionAPropos config={config} setPage={handlePage} />
            <SectionEquipe config={config} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'domaines' && (
          <>
            <SectionDomaines config={config} setPage={handlePage} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'consultation' && (
          <>
            <SectionConsultation config={config} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
        {page === 'contact' && (
          <>
            <SectionContact config={config} />
            <Footer config={config} setPage={handlePage} />
          </>
        )}
      </div>
    </div>
  );
}