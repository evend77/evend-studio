// src/templates/TemplateVitrineProSante.tsx
// e-Vend Studio — Template PREMIUM 25$ — Vitrine Pro Santé / Clinique
// Médical, dentaire, optométrie — inspiré Maryland Wix — 100% original

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ServiceSante {
  icone:       string;   // emoji ou symbole médical
  titre:       string;
  description: string;
}

export interface AvantageClinik {
  icone:       string;
  titre:       string;
  description: string;
  photo:       string;
  bouton:      string;
}

export interface MedecinSante {
  nom:         string;
  specialite:  string;
  photo:       string;
}

export interface TemoignageSante {
  nom:         string;
  role:        string;
  photo:       string;
  texte:       string;
}

export interface FAQSante {
  question: string;
  reponse:  string;
}

export interface StatSante {
  valeur:  string;
  label:   string;
}

export interface ConfigVitrineProSante {
  // Identité
  nomClinique:         string;
  sloganClinique:      string;
  logoUrl:             string;
  couleurPrincipale:   string;   // '#1e6fa8' bleu médical
  couleurSecondaire:   string;   // '#0d4f7a' bleu foncé
  couleurFond:         string;   // '#f0f4f8' gris-bleu clair
  couleurTexte:        string;   // '#1a2332'
  police:              'moderne' | 'classique' | 'sans';

  // Hero
  heroTitre1:          string;   // "Soins professionnels"
  heroTitre2:          string;   // "avec une touche humaine"
  heroAccent:          string;   // mot accentué dans heroTitre1
  heroDescription:     string;
  heroBouton:          string;
  heroPhoto:           string;   // grande photo d'équipe

  // Stats
  phraseImpact:        string;
  stats:               StatSante[];

  // Services
  servicesTitre1:      string;
  servicesTitre2:      string;
  services:            ServiceSante[];

  // Avantages (cartes bleues + photos)
  avantagesTitre1:     string;
  avantagesTitre2:     string;
  avantages:           AvantageClinik[];

  // Équipe
  equipeTitre1:        string;
  equipeTitre2:        string;
  equipe:              MedecinSante[];

  // Témoignages
  temoignagesTitre:    string;
  temoignages:         TemoignageSante[];

  // FAQ
  faqTitre:            string;
  faq:                 FAQSante[];

  // Contact + Formulaire
  contactTitre:        string;
  contactDescription:  string;
  email:               string;
  telephone:           string;
  adresse:             string;
  heures:              string;
  photoClinik:         string;   // photo salle d'attente
  // Carte Google Maps
  carteAdresseQuery:   string;   // ex: "123+Rue+Principale+Montreal+QC"
  carteLatitude:       string;
  carteLongitude:      string;

  // Réseaux sociaux
  instagram:           string;
  facebook:            string;
  youtube:             string;

  // Footer
  slogan:              string;
  copyright:           string;
}

// ─── CONFIG DÉFAUT ────────────────────────────────────────────────────────────

export const CONFIG_VITRINE_PRO_SANTE_DEFAUT: ConfigVitrineProSante = {
  nomClinique:         'Clinique MédikPlus',
  sloganClinique:      'Des soins de qualité, une approche humaine',
  logoUrl:             '',
  couleurPrincipale:   '#1e6fa8',
  couleurSecondaire:   '#0d4f7a',
  couleurFond:         '#f0f4f8',
  couleurTexte:        '#1a2332',
  police:              'moderne',

  heroTitre1:          'Soins professionnels',
  heroTitre2:          'avec une touche humaine +',
  heroAccent:          'professionnels',
  heroDescription:     'Des soins de santé centrés sur votre bien-être, votre confort et votre santé à long terme.',
  heroBouton:          'Prendre rendez-vous',
  heroPhoto:           'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=1600',

  phraseImpact:        'Nous offrons des diagnostics précis, des traitements personnalisés et des soins bienveillants adaptés à chaque patient.',
  stats: [
    { valeur: '10 000+', label: 'Patients traités'         },
    { valeur: '150+',    label: 'Spécialistes'             },
    { valeur: '98%',     label: 'Satisfaction patients'    },
    { valeur: '20+',     label: "Années d'expérience"      },
  ],

  servicesTitre1:      'Solutions de santé',
  servicesTitre2:      'adaptées à chaque besoin.',
  services: [
    { icone: '🦷', titre: 'Soins dentaires',    description: 'Nos professionnels dentaires offrent des soins bucco-dentaires complets, de la prévention à la restauration.' },
    { icone: '🦴', titre: 'Orthopédie',          description: 'Nous diagnostiquons et traitons les affections musculo-squelettiques pour restaurer votre mobilité.' },
    { icone: '❤️', titre: 'Cardiologie',         description: 'Notre équipe cardiologue se spécialise dans la santé cardiaque, du diagnostic aux soins continus.' },
    { icone: '👩', titre: 'Santé féminine',       description: "Nous offrons des soins personnalisés aux femmes à chaque étape de leur vie." },
    { icone: '🧠', titre: 'Neurologie',           description: 'Nos neurologues évaluent et traitent les affections du cerveau et de la colonne vertébrale.' },
    { icone: '👶', titre: 'Pédiatrie',            description: 'Nous offrons des soins médicaux bienveillants aux enfants, axés sur leur croissance et développement.' },
  ],

  avantagesTitre1:     'Comment nous aidons nos patients',
  avantagesTitre2:     'à améliorer leur santé et leur bien-être',
  avantages: [
    { icone: '🏠', titre: 'Soins personnalisés',  description: 'Nous créons des plans de traitement adaptés aux besoins et au mode de vie de chaque patient.', photo: 'https://images.pexels.com/photos/7088526/pexels-photo-7088526.jpeg?auto=compress&cs=tinysrgb&w=800', bouton: 'Obtenir des soins personnalisés' },
    { icone: '🏥', titre: 'Guidance experte',     description: 'Notre équipe médicale expérimentée fournit un soutien professionnel fiable à chaque étape de votre parcours de santé.', photo: 'https://images.pexels.com/photos/5327921/pexels-photo-5327921.jpeg?auto=compress&cs=tinysrgb&w=800', bouton: 'Obtenir des conseils experts' },
  ],

  equipeTitre1:        'Des professionnels dévoués',
  equipeTitre2:        'derrière vos soins',
  equipe: [
    { nom: 'Dre Émilie Chartrand', specialite: 'Pédiatre',         photo: 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Dre Sophie Amelin',    specialite: 'Psychologue',       photo: 'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Dr William Benoit',    specialite: 'Gériatre',          photo: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Dre Sophia Collins',   specialite: 'Nutritionniste',    photo: 'https://images.pexels.com/photos/5407234/pexels-photo-5407234.jpeg?auto=compress&cs=tinysrgb&w=400' },
  ],

  temoignagesTitre:    'Ce que disent nos patients',
  temoignages: [
    { nom: 'Daniel Harris',  role: 'Patient',  photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200', texte: '"Les médecins de MédikPlus étaient incroyablement attentifs et bienveillants. Ils ont tout expliqué clairement et m\'ont mis complètement à l\'aise tout au long de mon traitement."' },
    { nom: 'Isabella Moore', role: 'Patiente', photo: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200', texte: '"Ce qui m\'a le plus impressionnée, c\'est la rapidité et la qualité des soins. Je ne me suis jamais sentie comme une simple patiente — ils valorisaient vraiment mon bien-être."' },
    { nom: 'Richard Evans',  role: 'Patient',  photo: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200', texte: '"Mon expérience chez MédikPlus a été exceptionnelle. Des installations modernes et une équipe compatissante ont fait de chaque visite une expérience positive."' },
    { nom: 'Ethan Collins',  role: 'Patient',  photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=200', texte: '"L\'équipe m\'a traité avec des soins exceptionnels. Leur clarté, leur professionnalisme et leur compassion ont rendu une situation stressante supportable et sécurisante."' },
  ],

  faqTitre:            'Questions fréquentes',
  faq: [
    { question: 'Puis-je prendre rendez-vous en ligne ?',             reponse: 'Absolument ! Vous pouvez planifier votre visite directement via notre formulaire de contact ou en appelant notre réception. La prise de rendez-vous en ligne est rapide et pratique.' },
    { question: 'Quels services médicaux offrez-vous ?',              reponse: 'Nous offrons une gamme complète de services : médecine générale, pédiatrie, cardiologie, neurologie, santé féminine, orthopédie, dentisterie et bien plus encore.' },
    { question: 'Acceptez-vous les assurances maladie ?',             reponse: 'Oui, nous acceptons la plupart des régimes d\'assurance maladie privés. Contactez notre équipe administrative pour confirmer la couverture avant votre rendez-vous.' },
    { question: 'Combien de temps pour voir un médecin ?',            reponse: 'Pour les cas urgents, nous offrons des consultations le jour même. Pour les rendez-vous réguliers, le délai est généralement de 24 à 72 heures.' },
    { question: 'Proposez-vous des rendez-vous en dehors des heures de bureau ?', reponse: 'Oui, nous offrons des plages horaires en soirée les lundis et mercredis jusqu\'à 19h00, ainsi que les samedis matin sur rendez-vous.' },
    { question: 'Que dois-je apporter à mon premier rendez-vous ?',   reponse: 'Veuillez apporter votre carte d\'assurance maladie (RAMQ), une pièce d\'identité, votre liste de médicaments actuels et tout document médical pertinent.' },
  ],

  contactTitre:        'Nous sommes ici pour vous aider',
  contactDescription:  'Remplissez le formulaire et notre équipe vous répondra dans les plus brefs délais.',
  email:               'info@medikplus.ca',
  telephone:           '(514) 555-0147',
  adresse:             '1234 boulevard de la Santé, Laval, QC H7T 2B4',
  heures:              'Lun–Ven : 9h00 – 19h00 · Sam : 9h00 – 14h00',
  photoClinik:         'https://images.pexels.com/photos/1350560/pexels-photo-1350560.jpeg?auto=compress&cs=tinysrgb&w=800',
  carteAdresseQuery:   '1234+boulevard+de+la+Sante+Laval+QC',
  carteLatitude:       '45.5717',
  carteLongitude:      '-73.6928',

  instagram:           'medikplus',
  facebook:            'medikplus',
  youtube:             'medikplus',

  slogan:              'Des soins de qualité, une équipe en qui vous pouvez avoir confiance.',
  copyright:           '© 2026 Clinique MédikPlus · Tous droits réservés',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPolice(p: string) {
  if (p === 'classique') return "'Playfair Display', Georgia, serif";
  if (p === 'sans')      return "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
  return "'Inter', system-ui, sans-serif";
}

// ─── HOOK SCROLL REVEAL ──────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.rev').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── COMPTEUR ANIMÉ ──────────────────────────────────────────────────────────

function StatCard({ stat, cp }: { stat: StatSante; cp: string }) {
  return (
    <div style={{ flex: '1 1 160px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '28px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: cp, lineHeight: 1, marginBottom: 8 }}>{stat.valeur}</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>{stat.label}</div>
    </div>
  );
}

// ─── CARTE GOOGLE MAPS ────────────────────────────────────────────────────────

function CarteGoogle({ config, cp }: { config: ConfigVitrineProSante; cp: string }) {
  // On utilise une iframe Google Maps embed sans API key (mode statique)
  const src = `https://maps.google.com/maps?q=${config.carteAdresseQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  return (
    <div style={{ flex: '1 1 45%', minHeight: 340, borderRadius: 12, overflow: 'hidden', border: `1px solid #e2e8f0` }}>
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 340, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Carte de la clinique"
      />
    </div>
  );
}

// ─── FORMULAIRE CONTACT ───────────────────────────────────────────────────────

function FormulaireContact({ config, cp }: { config: ConfigVitrineProSante; cp: string }) {
  const [nom, setNom]           = useState('');
  const [email, setEmail]       = useState('');
  const [telephone, setTel]     = useState('');
  const [message, setMessage]   = useState('');
  const [accord, setAccord]     = useState(false);
  const [envoye, setEnvoye]     = useState(false);
  const [envoi, setEnvoi]       = useState(false);
  const [erreur, setErreur]     = useState('');

  const envoyer = async () => {
    if (!nom.trim() || !email.trim()) { setErreur('Veuillez remplir votre nom et courriel.'); return; }
    if (!accord) { setErreur('Veuillez accepter les conditions.'); return; }
    setEnvoi(true); setErreur('');
    try {
      await fetch('/api/studio/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, telephone, message, destinataire: config.email, clinique: config.nomClinique }),
      }).catch(() => {});
      setEnvoye(true);
    } catch {}
    setEnvoi(false);
  };

  const inp: React.CSSProperties = { width: '100%', padding: '13px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', color: '#1a2332', transition: 'border-color 0.2s' };

  if (envoye) return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Message envoyé !</h3>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15 }}>Notre équipe vous répondra dans les plus brefs délais.</p>
    </div>
  );

  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '36px 32px', border: '1px solid rgba(255,255,255,0.15)' }}>
      {erreur && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fca5a5', fontSize: 13 }}>{erreur}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6, letterSpacing: '0.04em' }}>Nom complet</label>
          <input style={inp} value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre prénom et nom" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Courriel</label>
            <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@courriel.ca" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Téléphone</label>
            <input style={inp} value={telephone} onChange={e => setTel(e.target.value)} placeholder="(514) 555-0000" />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Message</label>
          <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Comment pouvons-nous vous aider ?" />
        </div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
          <input type="checkbox" checked={accord} onChange={e => setAccord(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
            J'accepte que mes informations soient utilisées pour traiter ma demande de contact.
          </span>
        </label>
        <button onClick={envoyer} disabled={envoi}
          style={{ background: '#fff', color: cp, border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', opacity: envoi ? 0.7 : 1, transition: 'all 0.2s' }}>
          {envoi ? '⏳ Envoi...' : 'Nous contacter →'}
        </button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props { config?: Partial<ConfigVitrineProSante>; siteId?: number; vendeurId?: number; }

export default function TemplateVitrineProSante({ config: configProp }: Props) {
  const config = { ...CONFIG_VITRINE_PRO_SANTE_DEFAUT, ...configProp };
  const cp  = config.couleurPrincipale;
  const cs  = config.couleurSecondaire;
  const cf  = config.couleurFond;
  const ct  = config.couleurTexte;
  const police = getPolice(config.police);

  const [isMobile, setIsMobile]     = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0);

  useScrollReveal();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOuvert(false); };

  // Titre hero avec mot accentué en couleur
  const renderTitreHero = (titre: string, accent: string) => {
    if (!accent || !titre.includes(accent)) return <>{titre}</>;
    const parts = titre.split(accent);
    return <>{parts[0]}<span style={{ color: cp }}>{accent}</span>{parts[1]}</>;
  };

  return (
    <div style={{ fontFamily: police, background: '#fff', color: ct, overflowX: 'hidden' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }
        .rev { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .rev.d1 { transition-delay: 0.1s; } .rev.d2 { transition-delay: 0.2s; } .rev.d3 { transition-delay: 0.3s; } .rev.d4 { transition-delay: 0.4s; }
        .nav-link { transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: ${cp} !important; }
        .service-card:hover { background: #fff !important; box-shadow: 0 8px 32px rgba(30,111,168,0.12) !important; transform: translateY(-3px); }
        .service-card { transition: all 0.25s ease; }
        .medecin-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        .medecin-card { transition: all 0.25s ease; }
        .temoignage-card:hover { box-shadow: 0 8px 28px rgba(30,111,168,0.12) !important; }
        .temoignage-card { transition: box-shadow 0.25s ease; }
        input:focus, textarea:focus, select:focus { border-color: ${cp} !important; box-shadow: 0 0 0 3px ${cp}22; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: ${cp}; border-radius: 3px; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {config.logoUrl
              ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} />
              : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>+</div>
                  <span style={{ fontWeight: 800, fontSize: 17, color: ct }}>{config.nomClinique}</span>
                </div>
            }
          </div>

          {/* Nav desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 28 }}>
              {[['Nous contacter', 'contact'], ['Services', 'services'], ['À propos', 'equipe']].map(([l, id]) => (
                <span key={id} className="nav-link" onClick={() => scrollTo(id)} style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>{l}</span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => scrollTo('contact')}
              style={{ background: cp, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
              {config.heroBouton}
            </button>
            {isMobile && <button onClick={() => setMenuOuvert(!menuOuvert)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: ct }}>☰</button>}
          </div>
        </div>
        {isMobile && menuOuvert && (
          <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 28px' }}>
            {[['Nous contacter', 'contact'], ['Services', 'services'], ['Notre équipe', 'equipe']].map(([l, id]) => (
              <div key={id} onClick={() => scrollTo(id)} style={{ padding: '12px 0', fontSize: 15, fontWeight: 500, color: '#64748b', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>{l}</div>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: isMobile ? '48px 24px 0' : '72px 64px 0', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* Texte */}
          <div style={{ flex: '1 1 400px' }}>
            <h1 style={{ fontSize: `clamp(32px, 4.5vw, 58px)`, fontWeight: 800, color: ct, lineHeight: 1.1, marginBottom: 20 }}>
              {renderTitreHero(config.heroTitre1, config.heroAccent)}<br />
              <span style={{ fontSize: `clamp(28px, 4vw, 52px)`, fontWeight: 700 }}>{config.heroTitre2}</span>
            </h1>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 28, maxWidth: 420 }}>{config.heroDescription}</p>
            <button onClick={() => scrollTo('contact')}
              style={{ background: cp, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: police, boxShadow: `0 4px 20px ${cp}44` }}>
              {config.heroBouton}
            </button>
          </div>

          {/* Photo équipe (aperçu livre = coin arrondi + ombre) */}
          <div style={{ flex: '1 1 440px', position: 'relative' }}>
            {/* Décoration croix médicale */}
            <div style={{ position: 'absolute', top: -12, right: -12, width: 48, height: 48, background: cp + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <span style={{ fontSize: 24, color: cp }}>+</span>
            </div>
            <div style={{ borderRadius: '24px 24px 80px 24px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(30,111,168,0.18)', position: 'relative' }}>
              <img src={config.heroPhoto} alt="équipe médicale"
                style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', objectPosition: 'top' }}
                onError={e => { (e.target as HTMLImageElement).style.background = '#e2e8f0'; }}
              />
              {/* Badge animé */}
              <div style={{ position: 'absolute', bottom: 24, left: 24, background: '#fff', borderRadius: 12, padding: '12px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: ct }}>Clinique ouverte</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>· Disponible maintenant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 24px' : '64px' }}>
        <p className="rev" style={{ fontSize: 14, color: cp, fontWeight: 600, letterSpacing: '0.08em', marginBottom: 8, textAlign: 'center' }}>+ À propos de nous</p>
        <p className="rev d1" style={{ fontSize: `clamp(16px, 2.5vw, 22px)`, color: ct, fontWeight: 500, textAlign: 'center', maxWidth: 780, margin: '0 auto 40px', lineHeight: 1.7 }}>
          {config.phraseImpact}
        </p>
        <div className="rev d2" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {config.stats.map((s, i) => <StatCard key={i} stat={s} cp={cp} />)}
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────────────── */}
      <section id="services" style={{ background: cf, padding: isMobile ? '48px 24px' : '72px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 className="rev" style={{ fontSize: `clamp(24px, 3.5vw, 40px)`, fontWeight: 800, color: ct, textAlign: 'center', marginBottom: 48, lineHeight: 1.2 }}>
            <span style={{ color: cp }}>{config.servicesTitre1}</span><br />{config.servicesTitre2}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '300px'}, 1fr))`, gap: 16 }}>
            {config.services.map((s, i) => (
              <div key={i} className={`service-card rev d${Math.min(i + 1, 4)}`}
                style={{ background: cf, border: '1px solid #e2e8f0', borderRadius: 14, padding: '32px 24px' }}>
                <div style={{ fontSize: 28, color: cp, marginBottom: 16 }}>{s.icone}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: ct, marginBottom: 10 }}>{s.titre}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES (cartes bleu + photo) ─────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 24px' : '72px 64px' }}>
        <h2 className="rev" style={{ fontSize: `clamp(22px, 3vw, 36px)`, fontWeight: 800, color: ct, textAlign: 'center', marginBottom: 12 }}>
          {config.avantagesTitre1} <span style={{ color: cp }}>{config.avantagesTitre2.split(' ').slice(0, 2).join(' ')}</span>{' '}
          {config.avantagesTitre2.split(' ').slice(2).join(' ')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
          {config.avantages.map((a, i) => (
            <div key={i} className={`rev d${i + 1}`} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
              {/* Carte bleue */}
              <div style={{ background: cp, padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', order: i % 2 === 0 ? 0 : 1 }}>
                <div>
                  {/* Icône SVG médical */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: 26 }}>
                    {a.icone}
                  </div>
                  <h3 style={{ fontSize: `clamp(22px, 3vw, 32px)`, fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>{a.titre}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, marginBottom: 32 }}>{a.description}</p>
                </div>
                <button onClick={() => scrollTo('contact')}
                  style={{ alignSelf: 'flex-start', background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 22px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: police }}>
                  {a.bouton}
                </button>
              </div>
              {/* Photo */}
              <div style={{ minHeight: isMobile ? 240 : 'auto', order: i % 2 === 0 ? 1 : 0 }}>
                <img src={a.photo} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.background = '#e2e8f0'; }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ÉQUIPE ──────────────────────────────────────────────────────────── */}
      <section id="equipe" style={{ background: cf, padding: isMobile ? '48px 24px' : '72px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <p className="rev" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', textAlign: 'center', marginBottom: 12 }}>NOTRE ÉQUIPE</p>
          <h2 className="rev d1" style={{ fontSize: `clamp(22px, 3.5vw, 38px)`, fontWeight: 800, color: ct, textAlign: 'center', marginBottom: 48, lineHeight: 1.25 }}>
            <span style={{ color: cp }}>{config.equipeTitre1.split(' ').slice(0, 2).join(' ')}</span>{' '}
            {config.equipeTitre1.split(' ').slice(2).join(' ')}<br />
            {config.equipeTitre2}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '46%' : '240px'}, 1fr))`, gap: 20 }}>
            {config.equipe.map((m, i) => (
              <div key={i} className={`medecin-card rev d${Math.min(i + 1, 4)}`}
                style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden' }}>
                  <img src={m.photo} alt={m.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transition: 'transform 0.4s', display: 'block' }}
                    onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                    onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
                    onError={e => { (e.target as HTMLImageElement).style.background = '#e2e8f0'; }}
                  />
                </div>
                <div style={{ padding: '16px' }}>
                  <p style={{ fontSize: 13, color: cp, fontWeight: 600, marginBottom: 4 }}>{m.specialite}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: ct }}>{m.nom}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 24px' : '72px 64px' }}>
        <h2 className="rev" style={{ fontSize: `clamp(22px, 3.5vw, 38px)`, fontWeight: 800, color: ct, textAlign: 'center', marginBottom: 48 }}>
          Ce que disent <span style={{ color: cp }}>nos patients</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {config.temoignages.map((t, i) => (
            <div key={i} className={`temoignage-card rev d${Math.min(i + 1, 4)}`}
              style={{ background: cf, border: '1px solid #e2e8f0', borderRadius: 14, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.photo} alt={t.nom} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cp}22` }} onError={e => { (e.target as HTMLImageElement).style.background = '#e2e8f0'; }} />
                  <div>
                    <p style={{ fontSize: 12, color: cp, fontWeight: 600 }}>{t.role}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: ct }}>{t.nom}</p>
                  </div>
                </div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${cp}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cp, fontSize: 16 }}>+</div>
              </div>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75 }}>{t.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: cf, padding: isMobile ? '48px 24px' : '72px 64px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 className="rev" style={{ fontSize: `clamp(22px, 3.5vw, 38px)`, fontWeight: 800, color: ct, textAlign: 'center', marginBottom: 12 }}>
            Questions <span style={{ color: cp }}>fréquentes</span>
          </h2>
          <div className="rev d1" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: 40 }}>
            {config.faq.map((item, i) => (
              <div key={i} style={{ borderBottom: i < config.faq.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <button onClick={() => setFaqOuverte(faqOuverte === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: faqOuverte === i ? cp : ct, lineHeight: 1.4 }}>{item.question}</span>
                  <span style={{ fontSize: 20, color: cp, transition: 'transform 0.3s', transform: faqOuverte === i ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>⌄</span>
                </button>
                {faqOuverte === i && (
                  <div style={{ padding: '0 24px 20px' }}>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>{item.reponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ─────────────────────────────────────────────────────────── */}
      <section id="contact" style={{ background: `linear-gradient(135deg, ${cs} 0%, ${cp} 100%)`, padding: isMobile ? '48px 24px' : '80px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="rev" style={{ fontSize: `clamp(26px, 4vw, 44px)`, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{config.contactTitre}</h2>
            <p className="rev d1" style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>{config.contactDescription}</p>
          </div>
          <div className="rev d1" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>
            <FormulaireContact config={config} cp={cp} />
            {/* Infos contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icone: '✉️', label: 'Courriel',   valeur: config.email },
                { icone: '📞', label: 'Téléphone',  valeur: config.telephone },
                { icone: '📍', label: 'Adresse',    valeur: config.adresse },
                { icone: '🕐', label: 'Heures',     valeur: config.heures },
              ].map(({ icone, label, valeur }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{icone}</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 14, color: '#fff', fontWeight: 500, lineHeight: 1.5 }}>{valeur}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CARTE + PHOTO ───────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 380 }}>
        <CarteGoogle config={config} cp={cp} />
        <div style={{ flex: '1 1 50%', minHeight: 340, overflow: 'hidden' }}>
          <img src={config.photoClinik} alt="intérieur clinique"
            style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 340, display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.background = '#e2e8f0'; }}
          />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: isMobile ? '32px 24px' : '40px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 28 }}>
            {/* Logo + slogan */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 16 }}>+</div>
                <span style={{ fontWeight: 800, fontSize: 17, color: ct }}>{config.nomClinique}</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 260, lineHeight: 1.6 }}>{config.slogan}</p>
            </div>

            {/* Liens nav */}
            <div style={{ display: 'flex', gap: 24 }}>
              {[['Nous contacter', 'contact'], ['Services', 'services'], ['À propos', 'equipe']].map(([l, id]) => (
                <span key={id} onClick={() => scrollTo(id)} style={{ fontSize: 14, color: cp, cursor: 'pointer', fontWeight: 500 }}>{l}</span>
              ))}
            </div>

            {/* Réseaux */}
            <div>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 12 }}>Suivez-nous pour des mises à jour :</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'IG', href: `https://instagram.com/${config.instagram}` },
                  { label: 'YT', href: `https://youtube.com/${config.youtube}` },
                  { label: 'FB', href: `https://facebook.com/${config.facebook}` },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ width: 36, height: 36, borderRadius: 8, background: cp, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{config.copyright}</p>
            <p style={{ fontSize: 11, color: '#cbd5e1' }}>Propulsé par <span style={{ color: cp }}>e-Vend Studio</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}