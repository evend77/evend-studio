// src/templates/TemplateReservation.tsx
// e-Vend Studio — Template "Formulaires & Réservations" (non transactionnel)
// Sous-types : restaurant | location | service | spectacle
// Ce fichier est le RENDU PUBLIC — ce que les visiteurs voient.

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SousTypeReservation = 'restaurant' | 'location' | 'service' | 'spectacle';

export interface ConfigReservation {
  // Identité
  sousType: SousTypeReservation;
  nomEntreprise: string;
  slogan: string;
  description: string;
  logoUrl: string;
  photoHeroUrl: string;

  // Couleurs & style
  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurFond: string;
  couleurTexte: string;
  police: 'moderne' | 'classique' | 'manuscrite';

  // Contact
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  instagram: string;
  facebook: string;
  siteExterne: string;

  // Réservation — config générale
  titreSection: string;        // ex: "Réserver une table"
  descriptionResa: string;     // texte sous le titre
  nbPersonnesMin: number;
  nbPersonnesMax: number;
  dureeSlotMinutes: number;    // durée d'un créneau en minutes
  messageConfirmation: string; // affiché après réservation

  // ── RESTAURANT ──
  restaurant_horaires: { jour: string; heure: string }[];
  restaurant_capaciteMax: number;
  restaurant_reservationMin: number; // heures à l'avance minimum

  // ── LOCATION ──
  location_objets: {
    id: string;
    nom: string;
    description: string;
    prix: string;
    imageUrl: string;
    disponible: boolean;
  }[];
  location_depot: string;
  location_conditions: string;

  // ── SERVICE / RDV ──
  service_services: { nom: string; duree: string; prix: string; desc: string }[];
  service_rdvUrl: string;   // lien Calendly etc. si externe
  service_equipe: { nom: string; titre: string; photoUrl: string }[];

  // ── GALERIE / AMBIANCE ──
  galerie: { url: string; titre: string }[];
}

// ─── CONFIG PAR DÉFAUT ───────────────────────────────────────────────────────

export const CONFIG_RESA_DEFAUT: ConfigReservation = {
  sousType: 'restaurant',
  nomEntreprise: 'Le Petit Bistro',
  slogan: 'Une expérience culinaire unique',
  description: 'Cuisine du marché, produits locaux et atmosphère chaleureuse au cœur de Montréal.',
  logoUrl: '',
  photoHeroUrl: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#c9a96e',
  couleurSecondaire: '#1a1a1a',
  couleurFond: '#fafaf8',
  couleurTexte: '#1a1a1a',
  police: 'classique',
  adresse: '1234 rue Saint-Denis',
  ville: 'Montréal, QC  H2X 3K6',
  telephone: '(514) 555-0123',
  email: 'bonjour@lepetitbistro.ca',
  instagram: 'lepetitbistro',
  facebook: '',
  siteExterne: '',
  titreSection: 'Réserver une table',
  descriptionResa: 'Réservez votre table en quelques secondes. Confirmation immédiate par courriel.',
  nbPersonnesMin: 1,
  nbPersonnesMax: 12,
  dureeSlotMinutes: 90,
  messageConfirmation: 'Merci! Votre réservation est confirmée. Un courriel de confirmation vous a été envoyé.',
  restaurant_horaires: [
    { jour: 'Mar – Mer', heure: '17h30 – 22h00' },
    { jour: 'Jeu – Ven', heure: '17h30 – 22h30' },
    { jour: 'Sam',       heure: '17h00 – 22h30' },
    { jour: 'Dim',       heure: '11h00 – 15h00' },
  ],
  restaurant_capaciteMax: 40,
  restaurant_reservationMin: 2,
  location_objets: [
    { id: '1', nom: 'Château gonflable 5x5m', description: 'Parfait pour 10-15 enfants. Inclus souffleur et tapis de sécurité.', prix: '150$/jour', imageUrl: 'https://images.pexels.com/photos/1170882/pexels-photo-1170882.jpeg?auto=compress&cs=tinysrgb&w=600', disponible: true },
    { id: '2', nom: 'Glissade géante 8m',     description: 'Glissade gonflable géante. Convient aux enfants 5-14 ans.',         prix: '200$/jour', imageUrl: 'https://images.pexels.com/photos/1170882/pexels-photo-1170882.jpeg?auto=compress&cs=tinysrgb&w=600', disponible: true },
  ],
  location_depot: '200$',
  location_conditions: 'La livraison et le ramassage sont inclus dans un rayon de 30 km. Un dépôt remboursable est requis.',
  service_services: [
    { nom: 'Coupe & Coiffure', duree: '45 min', prix: '55$', desc: 'Coupe, shampoing et mise en forme.' },
    { nom: 'Coloration',       duree: '90 min', prix: '95$', desc: 'Coloration complète avec soin.' },
    { nom: 'Barbe',            duree: '30 min', prix: '35$', desc: 'Taille et rasage traditionnel.' },
  ],
  service_rdvUrl: '',
  service_equipe: [],
  galerie: [
    { url: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600', titre: 'Notre salle' },
    { url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600',   titre: 'Nos plats' },
    { url: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=600',   titre: 'Ambiance' },
  ],
};

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

function getPoliceCSS(police: string): string {
  switch (police) {
    case 'classique':  return "'Playfair Display', Georgia, serif";
    case 'manuscrite': return "'Dancing Script', cursive";
    default:           return "'Inter', 'Helvetica Neue', sans-serif";
  }
}

function getGoogleFontsUrl(police: string): string {
  switch (police) {
    case 'classique':  return 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap';
    case 'manuscrite': return 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Inter:wght@300;400;500&display=swap';
    default:           return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  }
}

// ─── FORMULAIRE DE RÉSERVATION ────────────────────────────────────────────────

interface FormulaireProps {
  config: ConfigReservation;
  cp: string; cs: string; cf: string; ct: string;
  siteId?: number;
}

function FormulaireReservation({ config, cp, cs, cf, ct, siteId }: FormulaireProps) {
  const [form, setForm] = useState({
    nom: '', email: '', telephone: '',
    date: '', heure: '', nbPersonnes: String(config.nbPersonnesMin),
    objet: '', notes: '',
  });
  const [etape, setEtape]     = useState<'form' | 'envoi' | 'succes' | 'erreur'>('form');
  const [message, setMessage] = useState('');

  const heuresDispos = Array.from({ length: 16 }, (_, i) => {
    const h = Math.floor(i / 2) + 8;
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2,'0')}:${m}`;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEtape('envoi');
    try {
      const dateDebut = new Date(`${form.date}T${form.heure}`);
      const dateFin   = new Date(dateDebut.getTime() + config.dureeSlotMinutes * 60000);
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id:        siteId,
          nom_client:     form.nom,
          email_client:   form.email,
          telephone:      form.telephone,
          date_debut:     dateDebut.toISOString(),
          date_fin:       dateFin.toISOString(),
          nb_personnes:   parseInt(form.nbPersonnes),
          notes:          form.notes,
          objet_reserve:  form.objet || config.nomEntreprise,
          type_reservation: config.sousType,
        }),
      });
      const data = await res.json();
      if (res.ok) { setEtape('succes'); setMessage(data.message || config.messageConfirmation); }
      else { setEtape('erreur'); setMessage(data.message || 'Une erreur est survenue.'); }
    } catch { setEtape('erreur'); setMessage('Impossible de joindre le serveur.'); }
  };

  if (etape === 'succes') return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: cs, marginBottom: 12 }}>Réservation confirmée!</h3>
      <p style={{ fontSize: 15, color: `${ct}88`, lineHeight: 1.6, maxWidth: 420, margin: '0 auto 28px' }}>{message}</p>
      <button onClick={() => setEtape('form')} style={{ padding: '11px 28px', background: cp, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
        Nouvelle réservation
      </button>
    </div>
  );

  if (etape === 'erreur') return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>Oups!</h3>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>{message}</p>
      <button onClick={() => setEtape('form')} style={{ padding: '10px 24px', background: cp, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
        Réessayer
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Objet (location seulement) */}
      {config.sousType === 'location' && config.location_objets.length > 0 && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Objet à louer <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select value={form.objet} onChange={e => setForm(p => ({ ...p, objet: e.target.value }))} required
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct }}>
            <option value="">Choisir...</option>
            {config.location_objets.filter(o => o.disponible).map(o => (
              <option key={o.id} value={o.nom}>{o.nom} — {o.prix}</option>
            ))}
          </select>
        </div>
      )}

      {/* Service (service seulement) */}
      {config.sousType === 'service' && config.service_services.length > 0 && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Service <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select value={form.objet} onChange={e => setForm(p => ({ ...p, objet: e.target.value }))} required
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct }}>
            <option value="">Choisir un service...</option>
            {config.service_services.map((s, i) => (
              <option key={i} value={s.nom}>{s.nom} — {s.duree} — {s.prix}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date + Heure */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Date <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input type="date" required value={form.date} min={new Date().toISOString().split('T')[0]}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct, boxSizing: 'border-box' as any }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Heure <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select required value={form.heure} onChange={e => setForm(p => ({ ...p, heure: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct }}>
            <option value="">Heure...</option>
            {heuresDispos.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {/* Personnes */}
      {config.sousType !== 'location' && (
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Nombre de personnes
          </label>
          <select value={form.nbPersonnes} onChange={e => setForm(p => ({ ...p, nbPersonnes: e.target.value }))}
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct }}>
            {Array.from({ length: config.nbPersonnesMax - config.nbPersonnesMin + 1 }, (_, i) => i + config.nbPersonnesMin).map(n => (
              <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      )}

      {/* Nom + Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Nom complet <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input type="text" required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Marie Dupont"
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct, boxSizing: 'border-box' as any }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Courriel <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="marie@exemple.com"
            style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct, boxSizing: 'border-box' as any }} />
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
          Téléphone
        </label>
        <input type="tel" value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} placeholder="(514) 555-0123"
          style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', color: ct, boxSizing: 'border-box' as any }} />
      </div>

      {/* Notes */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: `${ct}88`, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
          Notes / Demandes spéciales
        </label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
          placeholder="Allergie, occasion spéciale, préférences..."
          style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'inherit', background: '#fff', color: ct, boxSizing: 'border-box' as any }} />
      </div>

      {/* Bouton */}
      <button type="submit" disabled={etape === 'envoi'}
        style={{ width: '100%', padding: '14px', background: etape === 'envoi' ? `${cp}80` : cp, border: 'none', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700, cursor: etape === 'envoi' ? 'wait' : 'pointer', marginTop: 4, transition: 'all 0.2s' }}>
        {etape === 'envoi' ? '⏳ Envoi en cours...' : '✅ Confirmer la réservation'}
      </button>
      <p style={{ fontSize: 11, color: `${ct}55`, textAlign: 'center', margin: 0 }}>
        Un courriel de confirmation vous sera envoyé immédiatement.
      </p>
    </form>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigReservation>;
  isPreviewMobile?: boolean;
  siteId?: number;
}

export default function TemplateReservation({ config: configPartiel, isPreviewMobile = false, siteId }: Props) {
  const config: ConfigReservation = { ...CONFIG_RESA_DEFAUT, ...configPartiel };
  const isMobile = isPreviewMobile || (typeof window !== 'undefined' && window.innerWidth <= 768);
  const police   = getPoliceCSS(config.police);
  const heroRef  = useRef<HTMLDivElement>(null);
  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const cf = config.couleurFond;
  const ct = config.couleurTexte;

  // Parallax hero
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) heroRef.current.style.backgroundPositionY = `${window.scrollY * 0.25}px`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const labelType = {
    restaurant: '🍽️ Restaurant',
    location:   '📦 Location',
    service:    '💈 Service',
    spectacle:  '🎭 Spectacle',
  }[config.sousType];

  return (
    <div style={{ fontFamily: police, background: cf, color: ct, minHeight: '100vh', overflowX: 'hidden' }}>
      <link rel="stylesheet" href={getGoogleFontsUrl(config.police)} />
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .service-card { transition: transform 0.25s, box-shadow 0.25s; }
        .service-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }

        .objet-card img { transition: transform 0.4s ease; }
        .objet-card:hover img { transform: scale(1.04); }

        .nav-link { transition: color 0.2s; }
        .nav-link:hover { color: ${cp} !important; }

        .btn-principal {
          background: ${cp}; color: #fff; border: none;
          padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600;
          cursor: pointer; text-decoration: none; display: inline-block;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-principal:hover { opacity: 0.88; transform: translateY(-2px); }

        .separateur { width: 48px; height: 3px; background: ${cp}; border-radius: 2px; margin: 16px 0 22px; }
        .sep-centre { margin: 16px auto 22px; }

        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${cp}60; border-radius: 3px; }
      `}</style>

      {/* ── NAVIGATION ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: `${cf}ee`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${cp}22`, height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: cs }}>
            {config.logoUrl ? <img src={config.logoUrl} alt="logo" style={{ height: 36, objectFit: 'contain' }} /> : config.nomEntreprise}
          </span>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <a href="#reserver" className="nav-link" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Réserver</a>
              {config.sousType === 'restaurant' && <a href="#horaires" className="nav-link" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Horaires</a>}
              {config.sousType === 'location'   && <a href="#catalogue" className="nav-link" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Catalogue</a>}
              {config.sousType === 'service'    && <a href="#services" className="nav-link" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Services</a>}
              <a href="#contact" className="nav-link" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Contact</a>
              <a href="#reserver" className="btn-principal" style={{ padding: '8px 20px', fontSize: 13 }}>Réserver maintenant</a>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ minHeight: '100vh', backgroundImage: `url(${config.photoHeroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cs}cc, ${cs}88)` }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, padding: '0 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: cp, marginBottom: 18 }}>{labelType}</p>
          <h1 style={{ fontSize: `clamp(36px, 7vw, 68px)`, fontWeight: 700, color: '#fff', lineHeight: 1.08, marginBottom: 18 }}>{config.nomEntreprise}</h1>
          <p style={{ fontSize: `clamp(15px, 2.5vw, 20px)`, color: 'rgba(255,255,255,0.78)', fontWeight: 300, lineHeight: 1.5, marginBottom: 36 }}>{config.slogan}</p>
          <a href="#reserver" className="btn-principal" style={{ fontSize: 16, padding: '14px 36px' }}>Réserver maintenant →</a>
        </div>
        <div style={{ position: 'absolute', bottom: 32, left: '50%', color: 'rgba(255,255,255,0.5)', fontSize: 22, animation: 'bounce 2s infinite' }}>↓</div>
      </section>

      {/* ── À PROPOS ── */}
      <section style={{ padding: '88px 24px', background: cf }}>
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>À propos</p>
          <h2 style={{ fontSize: `clamp(24px, 4vw, 38px)`, fontWeight: 700, color: cs, marginBottom: 4 }}>{config.nomEntreprise}</h2>
          <div className="separateur sep-centre" />
          <p style={{ fontSize: 16, color: `${ct}99`, lineHeight: 1.75 }}>{config.description}</p>
        </div>
      </section>

      {/* ── RESTAURANT: Horaires ── */}
      {config.sousType === 'restaurant' && (
        <section id="horaires" style={{ padding: '60px 24px', background: `${cs}06` }}>
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Heures d'ouverture</p>
            <h2 style={{ fontSize: `clamp(22px, 3.5vw, 34px)`, fontWeight: 700, color: cs, marginBottom: 4 }}>Quand nous visiter</h2>
            <div className="separateur sep-centre" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {config.restaurant_horaires.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: cf, borderRadius: 8, border: `1px solid ${cp}25`, borderLeft: `3px solid ${cp}` }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: cs }}>{h.jour}</span>
                  <span style={{ fontSize: 14, color: `${ct}99` }}>{h.heure}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LOCATION: Catalogue ── */}
      {config.sousType === 'location' && config.location_objets.length > 0 && (
        <section id="catalogue" style={{ padding: '80px 24px', background: `${cs}06` }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Catalogue</p>
              <h2 style={{ fontSize: `clamp(22px, 3.5vw, 34px)`, fontWeight: 700, color: cs }}>Nos équipements</h2>
              <div className="separateur sep-centre" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 24 }}>
              {config.location_objets.map(o => (
                <div key={o.id} className="objet-card" style={{ background: cf, borderRadius: 12, border: `1px solid ${cp}20`, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                  {o.imageUrl && (
                    <div style={{ height: 220, overflow: 'hidden' }}>
                      <img src={o.imageUrl} alt={o.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: cs }}>{o.nom}</h3>
                      <span style={{ fontSize: 15, fontWeight: 700, color: cp, flexShrink: 0, marginLeft: 12 }}>{o.prix}</span>
                    </div>
                    <p style={{ fontSize: 13, color: `${ct}88`, lineHeight: 1.6, marginBottom: 14 }}>{o.description}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: o.disponible ? '#dcfce7' : '#fee2e2', color: o.disponible ? '#16a34a' : '#dc2626' }}>
                      {o.disponible ? '✓ Disponible' : '✗ Non disponible'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {config.location_conditions && (
              <div style={{ marginTop: 32, padding: '18px 24px', background: `${cp}12`, borderRadius: 10, border: `1px solid ${cp}30`, fontSize: 13, color: `${ct}88`, lineHeight: 1.6 }}>
                📋 <strong>Conditions :</strong> {config.location_conditions}
                {config.location_depot && <span style={{ marginLeft: 12 }}>| 💳 <strong>Dépôt :</strong> {config.location_depot}</span>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SERVICE: Liste des services ── */}
      {config.sousType === 'service' && config.service_services.length > 0 && (
        <section id="services" style={{ padding: '80px 24px', background: `${cs}06` }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Services</p>
              <h2 style={{ fontSize: `clamp(22px, 3.5vw, 34px)`, fontWeight: 700, color: cs }}>Ce que nous offrons</h2>
              <div className="separateur sep-centre" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
              {config.service_services.map((s, i) => (
                <div key={i} className="service-card" style={{ background: cf, borderRadius: 10, padding: '24px 22px', border: `1px solid ${cp}20`, textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: cs, marginBottom: 8 }}>{s.nom}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: cp, marginBottom: 8 }}>{s.prix}</p>
                  <p style={{ fontSize: 12, color: `${ct}66`, marginBottom: 12 }}>⏱ {s.duree}</p>
                  <p style={{ fontSize: 13, color: `${ct}88`, lineHeight: 1.55 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALERIE ── */}
      {config.galerie.length > 0 && (
        <section style={{ padding: '80px 24px', background: cf }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Galerie</p>
              <h2 style={{ fontSize: `clamp(22px, 3vw, 32px)`, fontWeight: 700, color: cs }}>Découvrez notre ambiance</h2>
              <div className="separateur sep-centre" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 14 }}>
              {config.galerie.map((g, i) => (
                <div key={i} style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '1', position: 'relative' }}>
                  <img src={g.url} alt={g.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FORMULAIRE DE RÉSERVATION ── */}
      <section id="reserver" style={{ padding: '88px 24px', background: `${cp}10` }}>
        <div style={{ maxWidth: isMobile ? '100%' : 820, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Réservation</p>
            <h2 style={{ fontSize: `clamp(24px, 4vw, 40px)`, fontWeight: 700, color: cs, marginBottom: 8 }}>{config.titreSection}</h2>
            <div className="separateur sep-centre" />
            <p style={{ fontSize: 15, color: `${ct}88`, lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>{config.descriptionResa}</p>
          </div>
          <div style={{ background: cf, borderRadius: 16, padding: isMobile ? '28px 20px' : '40px 48px', boxShadow: `0 8px 40px ${cs}18`, border: `1px solid ${cp}20` }}>
            <FormulaireReservation config={config} cp={cp} cs={cs} cf={cf} ct={ct} siteId={siteId} />
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: '80px 24px', background: cs, color: '#fff' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 16 }}>Contact</p>
          <h2 style={{ fontSize: `clamp(22px, 3.5vw, 36px)`, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Nous joindre</h2>
          <div className="separateur sep-centre" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginBottom: 28 }}>
            {config.adresse && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>📍 {config.adresse}, {config.ville}</p>}
            {config.telephone && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>📞 {config.telephone}</p>}
            {config.email && <a href={`mailto:${config.email}`} style={{ color: cp, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>✉️ {config.email}</a>}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {config.instagram && <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13 }}>📷 Instagram</a>}
            {config.facebook  && <a href={`https://facebook.com/${config.facebook}`}  target="_blank" rel="noopener noreferrer" style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13 }}>👥 Facebook</a>}
            {config.siteExterne && <a href={config.siteExterne} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13 }}>🌐 Site web</a>}
          </div>
        </div>
      </section>

      <footer style={{ padding: 20, background: cs, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {config.nomEntreprise} — Propulsé par <span style={{ color: cp }}>e-Vend Studio</span>
        </p>
      </footer>
    </div>
  );
}