// src/templates/TemplateSpectacle.tsx
// e-Vend Studio — Template Spectacle avec plan de salle interactif

import { useState, useEffect, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ConfigRangee {
  label: string;           // ex: 'A', 'B', '1', '2'
  nb_sieges: number;
  debut_numero: number;
  type_num: 'sequentiel' | 'impair_pair' | 'centre_ext' | 'allee';
  allee_centrale: boolean;
  zone: string;            // ex: 'VIP', 'Parterre', 'Balcon'
  couleur_zone: string;    // couleur de la zone
}

export interface ConfigSpectacle {
  nomEntreprise: string;
  slogan: string;
  description: string;
  logoUrl: string;
  photoHeroUrl: string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurFond: string;
  couleurTexte: string;
  police: 'moderne' | 'classique' | 'manuscrite';

  // Événement
  dateEvenement: string;
  lieu: string;
  duree: string;
  artiste: string;
  descriptionEvenement: string;
  photoEvenement: string;

  // Plan de salle
  rangees: ConfigRangee[];
  labelScene: string;      // ex: 'SCÈNE', 'PODIUM', 'PISTE'
  orientationScene: 'haut' | 'bas'; // scène en haut ou en bas du plan
  maxSiegesParSelection: number;

  // Contact
  adresse: string;
  ville: string;
  email: string;
  telephone: string;
  messageConfirmation: string;
}

export const CONFIG_SPECTACLE_DEFAUT: ConfigSpectacle = {
  nomEntreprise: 'Grand Théâtre',
  slogan: 'Une soirée inoubliable vous attend',
  description: 'Vivez une expérience unique dans notre salle mythique.',
  logoUrl: '',
  photoHeroUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#c9a96e',
  couleurSecondaire: '#1a1a1a',
  couleurFond: '#0d0d0d',
  couleurTexte: '#f0f0f0',
  police: 'classique',
  dateEvenement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  lieu: 'Grand Théâtre de Montréal',
  duree: '2h30 (incluant entracte)',
  artiste: 'Artiste Principal',
  descriptionEvenement: 'Une performance exceptionnelle qui vous transportera dans un univers magique. Ne manquez pas cet événement unique.',
  photoEvenement: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1600',
  rangees: [
    { label: 'A', nb_sieges: 10, debut_numero: 1, type_num: 'sequentiel', allee_centrale: false, zone: 'VIP',      couleur_zone: '#c9a96e' },
    { label: 'B', nb_sieges: 12, debut_numero: 1, type_num: 'sequentiel', allee_centrale: false, zone: 'Parterre', couleur_zone: '#6366f1' },
    { label: 'C', nb_sieges: 12, debut_numero: 1, type_num: 'sequentiel', allee_centrale: false, zone: 'Parterre', couleur_zone: '#6366f1' },
    { label: 'D', nb_sieges: 14, debut_numero: 1, type_num: 'sequentiel', allee_centrale: true,  zone: 'Parterre', couleur_zone: '#6366f1' },
    { label: 'E', nb_sieges: 14, debut_numero: 1, type_num: 'sequentiel', allee_centrale: true,  zone: 'Parterre', couleur_zone: '#6366f1' },
    { label: 'F', nb_sieges: 16, debut_numero: 1, type_num: 'sequentiel', allee_centrale: true,  zone: 'Balcon',   couleur_zone: '#0ea5e9' },
    { label: 'G', nb_sieges: 16, debut_numero: 1, type_num: 'sequentiel', allee_centrale: true,  zone: 'Balcon',   couleur_zone: '#0ea5e9' },
  ],
  labelScene: 'SCÈNE',
  orientationScene: 'haut',
  maxSiegesParSelection: 6,
  adresse: '1234 rue Saint-Denis',
  ville: 'Montréal, QC',
  email: 'info@grandtheatre.ca',
  telephone: '(514) 555-0123',
  messageConfirmation: 'Merci! Vos sièges sont réservés. Un courriel de confirmation vous a été envoyé. Présentez-vous avec cette confirmation le soir de l\'événement.',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPoliceCSS(police: string): string {
  switch (police) {
    case 'classique':  return "'Playfair Display', Georgia, serif";
    case 'manuscrite': return "'Dancing Script', cursive";
    default:           return "'Inter', sans-serif";
  }
}

function getGoogleFonts(police: string): string {
  switch (police) {
    case 'classique':  return 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap';
    default:           return 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
  }
}

function useCompteur(dateISO: string) {
  const calc = () => {
    const diff = new Date(dateISO).getTime() - Date.now();
    if (diff <= 0) return { jours: 0, heures: 0, minutes: 0, secondes: 0 };
    return {
      jours:    Math.floor(diff / 86400000),
      heures:   Math.floor((diff % 86400000) / 3600000),
      minutes:  Math.floor((diff % 3600000) / 60000),
      secondes: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [dateISO]);
  return t;
}

function genererNumeros(rangee: ConfigRangee): number[] {
  const { nb_sieges, debut_numero = 1, type_num = 'sequentiel' } = rangee;
  const nums: number[] = [];
  switch (type_num) {
    case 'impair_pair': {
      const m = Math.floor(nb_sieges / 2);
      for (let i = 0; i < m; i++) nums.push(1 + i * 2);
      for (let i = 0; i < nb_sieges - m; i++) nums.push(2 + i * 2);
      break;
    }
    case 'centre_ext': {
      const c = Math.floor(nb_sieges / 2);
      for (let i = c; i >= 1; i--) nums.push(i * 2);
      for (let i = 1; i <= nb_sieges - c; i++) nums.push(i * 2 - 1);
      break;
    }
    default:
      for (let i = 0; i < nb_sieges; i++) nums.push(debut_numero + i);
  }
  return nums;
}

// ─── PLAN DE SALLE ────────────────────────────────────────────────────────────

interface Siege {
  id: number;
  rangee: string;
  numero: number;
  statut: 'libre' | 'reserve' | 'selectionne';
  zone: string;
  couleur_zone: string;
}

interface PlanSalleProps {
  config: ConfigSpectacle;
  cp: string; cs: string;
  siegesBD: { id: number; rangee: string; numero: number; statut: string }[];
  selectionnes: number[];
  onToggle: (siegeId: number) => void;
  isPreview?: boolean;
}

function PlanSalle({ config, cp, cs, siegesBD, selectionnes, onToggle, isPreview }: PlanSalleProps) {
  const maxSieges = Math.max(...config.rangees.map(r => r.nb_sieges), 1);

  const getStatutSiege = (rangee: string, numero: number): 'libre' | 'reserve' | 'selectionne' => {
    const bd = siegesBD.find(s => s.rangee === rangee && s.numero === numero);
    if (!bd) return 'libre';
    if (bd.statut === 'reserve') return 'reserve';
    if (selectionnes.includes(bd.id)) return 'selectionne';
    return 'libre';
  };

  const getSiegeId = (rangee: string, numero: number): number | null => {
    const bd = siegesBD.find(s => s.rangee === rangee && s.numero === numero);
    return bd?.id || null;
  };

  // Zones uniques pour la légende
  const zones = config.rangees.reduce<{ zone: string; couleur: string }[]>((acc, r) => {
    if (!acc.find(z => z.zone === r.zone)) acc.push({ zone: r.zone, couleur: r.couleur_zone });
    return acc;
  }, []);

  const rangeesPlan = config.orientationScene === 'haut'
    ? [...config.rangees]
    : [...config.rangees].reverse();

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Scène */}
      {config.orientationScene === 'haut' && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', background: `${cp}30`, border: `2px solid ${cp}`, borderRadius: 8, padding: '10px 60px', fontSize: 13, fontWeight: 800, color: cp, letterSpacing: '4px' }}>
            {config.labelScene}
          </div>
          <div style={{ width: '80%', height: 4, background: `linear-gradient(to right, transparent, ${cp}60, transparent)`, margin: '8px auto 0' }} />
        </div>
      )}

      {/* Rangées */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {rangeesPlan.map((rangee) => {
          const numeros = genererNumeros(rangee);
          const moitie = rangee.allee_centrale ? Math.floor(rangee.nb_sieges / 2) : null;

          return (
            <div key={rangee.label} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
              {/* Label rangée gauche */}
              <div style={{ width: 24, textAlign: 'center', fontSize: 11, fontWeight: 700, color: rangee.couleur_zone, flexShrink: 0 }}>
                {rangee.label}
              </div>

              {/* Sièges */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                {numeros.map((num, idx) => {
                  const statut = getStatutSiege(rangee.label, num);
                  const siegeId = getSiegeId(rangee.label, num);

                  const couleur = statut === 'reserve'
                    ? '#dc2626'
                    : statut === 'selectionne'
                    ? cp
                    : rangee.couleur_zone + '80';

                  const border = statut === 'selectionne'
                    ? `2px solid ${cp}`
                    : statut === 'reserve'
                    ? '2px solid #dc2626'
                    : `1px solid ${rangee.couleur_zone}60`;

                  return (
                    <>
                      {/* Allée centrale */}
                      {moitie !== null && idx === moitie && (
                        <div key="allee" style={{ width: 12 }} />
                      )}
                      <div
                        key={num}
                        title={statut === 'reserve' ? 'Réservé' : `${rangee.label}${num} — ${rangee.zone}`}
                        onClick={() => {
                          if (statut === 'reserve' || isPreview) return;
                          if (siegeId) onToggle(siegeId);
                        }}
                        style={{
                          width: 22, height: 20,
                          borderRadius: '4px 4px 0 0',
                          background: couleur,
                          border,
                          cursor: statut === 'reserve' || isPreview ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 7, color: statut === 'libre' ? 'transparent' : '#fff',
                          fontWeight: 700,
                          transition: 'transform 0.1s, background 0.15s',
                          transform: statut === 'selectionne' ? 'scale(1.15)' : 'scale(1)',
                          position: 'relative',
                        }}
                        onMouseEnter={e => {
                          if (statut !== 'reserve' && !isPreview)
                            (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.transform = statut === 'selectionne' ? 'scale(1.15)' : 'scale(1)';
                        }}
                      >
                        {statut === 'selectionne' && '✓'}
                        {statut === 'reserve' && '✗'}
                      </div>
                    </>
                  );
                })}
              </div>

              {/* Label rangée droite */}
              <div style={{ width: 24, textAlign: 'center', fontSize: 11, fontWeight: 700, color: rangee.couleur_zone, flexShrink: 0 }}>
                {rangee.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scène en bas */}
      {config.orientationScene === 'bas' && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ width: '80%', height: 4, background: `linear-gradient(to right, transparent, ${cp}60, transparent)`, margin: '0 auto 8px' }} />
          <div style={{ display: 'inline-block', background: `${cp}30`, border: `2px solid ${cp}`, borderRadius: 8, padding: '10px 60px', fontSize: 13, fontWeight: 800, color: cp, letterSpacing: '4px' }}>
            {config.labelScene}
          </div>
        </div>
      )}

      {/* Légende */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
        {zones.map(z => (
          <div key={z.zone} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: z.couleur + '80', border: `1px solid ${z.couleur}` }} />
            <span style={{ color: '#aaa' }}>{z.zone}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: cp, border: `2px solid ${cp}` }} />
          <span style={{ color: '#aaa' }}>Sélectionné</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: '#dc2626', border: '2px solid #dc2626' }} />
          <span style={{ color: '#aaa' }}>Réservé</span>
        </div>
      </div>
    </div>
  );
}

// ─── FORMULAIRE RÉSERVATION SPECTACLE ─────────────────────────────────────────

interface FormulaireSpectacleProps {
  config: ConfigSpectacle;
  cp: string; cs: string;
  siegesSelectionnes: number[];
  siegesBD: { id: number; rangee: string; numero: number }[];
  siteId?: number;
  onSuccess: () => void;
}

function FormulaireSpectacle({ config, cp, cs, siegesSelectionnes, siegesBD, siteId, onSuccess }: FormulaireSpectacleProps) {
  const [form, setForm]   = useState({ nom: '', email: '', telephone: '', notes: '' });
  const [etape, setEtape] = useState<'form' | 'envoi' | 'succes' | 'erreur'>('form');
  const [message, setMessage] = useState('');

  const siegesLabels = siegesSelectionnes.map(id => {
    const s = siegesBD.find(s => s.id === id);
    return s ? `${s.rangee}${s.numero}` : id;
  }).join(', ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siegesSelectionnes.length) return;
    setEtape('envoi');
    try {
      const res = await fetch('/api/sieges/reserver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id:    siteId,
          siege_ids:  siegesSelectionnes,
          nom_client: form.nom,
          email_client: form.email,
          telephone:  form.telephone,
          notes:      form.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEtape('succes');
        setMessage(data.message || config.messageConfirmation);
        onSuccess();
      } else {
        setEtape('erreur');
        setMessage(data.message || 'Une erreur est survenue.');
      }
    } catch {
      setEtape('erreur');
      setMessage('Impossible de joindre le serveur.');
    }
  };

  if (etape === 'succes') return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎭</div>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: cp, marginBottom: 12 }}>Sièges confirmés!</h3>
      <div style={{ background: `${cp}20`, border: `1px solid ${cp}40`, borderRadius: 10, padding: '12px 20px', marginBottom: 16, fontSize: 15, fontWeight: 700, color: cp }}>
        {siegesLabels}
      </div>
      <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6 }}>{message}</p>
    </div>
  );

  if (etape === 'erreur') return (
    <div style={{ textAlign: 'center', padding: '24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
      <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 16 }}>{message}</p>
      <button onClick={() => setEtape('form')} style={{ padding: '9px 24px', background: cp, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Réessayer</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: `${cp}20`, border: `1px solid ${cp}40`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: cp, fontWeight: 700 }}>
        🎫 Sièges sélectionnés : {siegesLabels || 'Aucun'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Nom complet *</label>
          <input required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Marie Dupont"
            style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' as any }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Courriel *</label>
          <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="marie@exemple.com"
            style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' as any }} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Téléphone</label>
        <input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} placeholder="(514) 555-0123"
          style={{ width: '100%', padding: '9px 12px', border: `1.5px solid ${cp}40`, borderRadius: 8, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' as any }} />
      </div>
      <button type="submit" disabled={!siegesSelectionnes.length || etape === 'envoi'}
        style={{ padding: '13px', background: siegesSelectionnes.length ? cp : '#444', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: siegesSelectionnes.length ? 'pointer' : 'not-allowed' }}>
        {etape === 'envoi' ? '⏳ Réservation en cours...' : `🎫 Confirmer ${siegesSelectionnes.length} siège(s)`}
      </button>
      <p style={{ fontSize: 11, color: '#555', textAlign: 'center', margin: 0 }}>
        Un courriel de confirmation sera envoyé immédiatement. Paiement sur place.
      </p>
    </form>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props {
  config?: Partial<ConfigSpectacle>;
  isPreviewMobile?: boolean;
  siteId?: number;
}

export default function TemplateSpectacle({ config: configPartiel, isPreviewMobile = false, siteId }: Props) {
  const config: ConfigSpectacle = { ...CONFIG_SPECTACLE_DEFAUT, ...configPartiel };
  const isMobile = isPreviewMobile || (typeof window !== 'undefined' && window.innerWidth <= 768);
  const police   = getPoliceCSS(config.police);
  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const cf = config.couleurFond;
  const ct = config.couleurTexte;

  const [siegesBD, setSiegesBD]             = useState<any[]>([]);
  const [selectionnes, setSelectionnes]     = useState<number[]>([]);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const temps = useCompteur(config.dateEvenement);

  // En preview (pas de siteId) — générer les sièges depuis la config
  useEffect(() => {
    if (siteId) {
      fetch(`/api/sieges/public/${siteId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.sieges) setSiegesBD(data.sieges); })
        .catch(() => {});
    } else {
      // Preview mode — générer les sièges virtuels depuis config.rangees
      let idCounter = 1;
      const siegesVirtuels: any[] = [];
      config.rangees.forEach(rangee => {
        for (let i = 0; i < rangee.nb_sieges; i++) {
          siegesVirtuels.push({
            id: idCounter++,
            rangee: rangee.label,
            numero: rangee.debut_numero + i,
            statut: 'libre',
          });
        }
      });
      setSiegesBD(siegesVirtuels);
    }
  }, [siteId, config.rangees]);

  const toggleSiege = useCallback((siegeId: number) => {
    setSelectionnes(prev => {
      if (prev.includes(siegeId)) return prev.filter(id => id !== siegeId);
      if (prev.length >= config.maxSiegesParSelection) return prev;
      return [...prev, siegeId];
    });
  }, [config.maxSiegesParSelection]);

  const dateFormatee = new Date(config.dateEvenement).toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const heureFormatee = new Date(config.dateEvenement).toLocaleTimeString('fr-CA', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={{ fontFamily: police, background: cf, color: ct, minHeight: '100vh', overflowX: 'hidden' }}>
      <link rel="stylesheet" href={getGoogleFonts(config.police)} />
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .nav-link { transition: color 0.2s; }
        .nav-link:hover { color: ${cp} !important; }
        .btn-or {
          background: linear-gradient(135deg, ${cp}, ${cp}cc);
          color: #fff; border: none; padding: 13px 32px;
          border-radius: 6px; font-size: 15px; font-weight: 700;
          cursor: pointer; text-decoration: none; display: inline-block;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px ${cp}44;
        }
        .btn-or:hover { transform: translateY(-2px); box-shadow: 0 8px 28px ${cp}66; }
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${cp}60; border-radius: 2px; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, background: `${cf}ee`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${cp}22`, height: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: ct }}>
            {config.logoUrl ? <img src={config.logoUrl} alt="logo" style={{ height: 34, objectFit: 'contain' }} /> : config.nomEntreprise}
          </span>
          {!isMobile && (
            <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <a href="#evenement" className="nav-link" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>L'événement</a>
              <a href="#plan" className="nav-link" style={{ color: ct, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Plan de salle</a>
              <a href="#plan" className="btn-or" style={{ padding: '8px 20px', fontSize: 13 }}>Choisir mes sièges</a>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', backgroundImage: `url(${config.photoHeroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${cs}bb 0%, ${cs}ee 100%)` }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, padding: '0 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 16 }}>🎭 Spectacle</p>
          <h1 style={{ fontSize: `clamp(36px, 7vw, 72px)`, fontWeight: 700, color: '#fff', lineHeight: 1.08, marginBottom: 12 }}>{config.nomEntreprise}</h1>
          <p style={{ fontSize: `clamp(16px, 2.5vw, 22px)`, color: cp, fontWeight: 600, marginBottom: 8 }}>{config.artiste}</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 36, textTransform: 'capitalize' }}>
            📅 {dateFormatee} à {heureFormatee} &nbsp;|&nbsp; 📍 {config.lieu}
          </p>
          <a href="#plan" className="btn-or" style={{ fontSize: 16, padding: '14px 40px' }}>Choisir mes sièges →</a>
        </div>
        <div style={{ position: 'absolute', bottom: 32, left: '50%', color: 'rgba(255,255,255,0.4)', fontSize: 20, animation: 'bounce 2s infinite' }}>↓</div>
      </section>

      {/* COMPTEUR */}
      <section style={{ padding: '60px 24px', background: `${cp}12`, borderBottom: `1px solid ${cp}20` }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 20 }}>L'événement approche</p>
          <div style={{ display: 'flex', gap: isMobile ? 12 : 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { v: temps.jours,    l: 'Jours' },
              { v: temps.heures,   l: 'Heures' },
              { v: temps.minutes,  l: 'Minutes' },
              { v: temps.secondes, l: 'Secondes' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', background: `${cs}80`, borderRadius: 10, padding: isMobile ? '14px 18px' : '18px 28px', border: `1px solid ${cp}30`, minWidth: 80 }}>
                <div style={{ fontSize: isMobile ? 32 : 44, fontWeight: 800, color: cp, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {String(item.v).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666', marginTop: 6 }}>{item.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* L'ÉVÉNEMENT */}
      <section id="evenement" style={{ padding: '80px 24px', background: cf }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 48, alignItems: 'center' }}>
          {config.photoEvenement && (
            <div style={{ flexShrink: 0 }}>
              <img src={config.photoEvenement} alt="événement" style={{ width: isMobile ? '100%' : 380, height: 280, objectFit: 'cover', borderRadius: 12, boxShadow: `0 20px 60px ${cs}40` }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>À propos</p>
            <h2 style={{ fontSize: `clamp(22px, 3.5vw, 36px)`, fontWeight: 700, color: ct, marginBottom: 16 }}>{config.artiste}</h2>
            <div style={{ width: 48, height: 3, background: cp, borderRadius: 2, marginBottom: 20 }} />
            <p style={{ fontSize: 15, color: `${ct}88`, lineHeight: 1.75, marginBottom: 24 }}>{config.descriptionEvenement}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icone: '📅', label: 'Date', val: `${dateFormatee} à ${heureFormatee}` },
                { icone: '📍', label: 'Lieu',  val: `${config.lieu}${config.ville ? ', ' + config.ville : ''}` },
                { icone: '⏱',  label: 'Durée', val: config.duree },
              ].filter(i => i.val).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icone}</span>
                  <span style={{ color: `${ct}66`, minWidth: 50 }}>{item.label} :</span>
                  <span style={{ fontWeight: 600, color: ct }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLAN DE SALLE */}
      <section id="plan" style={{ padding: '80px 24px', background: `${cs}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 12 }}>Réservation</p>
            <h2 style={{ fontSize: `clamp(22px, 3.5vw, 36px)`, fontWeight: 700, color: ct, marginBottom: 8 }}>Choisissez vos sièges</h2>
            <div style={{ width: 48, height: 3, background: cp, borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, color: `${ct}66` }}>
              Cliquez sur les sièges disponibles pour les sélectionner (max {config.maxSiegesParSelection}).
            </p>
          </div>

          <div style={{ display: 'flex', gap: 32, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
            {/* Plan */}
            <div style={{ flex: 1, background: `${cf}22`, borderRadius: 16, padding: isMobile ? 20 : 32, border: `1px solid ${cp}20`, overflowX: 'auto' }}>
              <PlanSalle
                config={config}
                cp={cp} cs={cs}
                siegesBD={siegesBD}
                selectionnes={selectionnes}
                onToggle={toggleSiege}
                isPreview={!siteId}
              />
            </div>

            {/* Formulaire */}
            <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0, background: `${cf}44`, borderRadius: 16, padding: 24, border: `1px solid ${cp}20` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: ct, marginBottom: 20 }}>
                🎫 Réserver {selectionnes.length > 0 ? `(${selectionnes.length} siège${selectionnes.length > 1 ? 's' : ''})` : ''}
              </h3>
              {!showFormulaire && selectionnes.length === 0 && (
                <p style={{ fontSize: 13, color: `${ct}55`, lineHeight: 1.6 }}>
                  Sélectionnez vos sièges sur le plan à gauche, puis remplissez le formulaire pour confirmer votre réservation.
                </p>
              )}
              {selectionnes.length > 0 && !showFormulaire && (
                <div>
                  <div style={{ background: `${cp}20`, border: `1px solid ${cp}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: cp, fontWeight: 700 }}>
                    {selectionnes.map(id => {
                      const s = siegesBD.find(s => s.id === id);
                      return s ? `${s.rangee}${s.numero}` : id;
                    }).join(', ')}
                  </div>
                  <button onClick={() => setShowFormulaire(true)} className="btn-or" style={{ width: '100%', padding: 12, fontSize: 15 }}>
                    Continuer →
                  </button>
                  <button onClick={() => setSelectionnes([])} style={{ width: '100%', marginTop: 8, padding: '9px', background: 'transparent', border: `1px solid ${cp}40`, borderRadius: 8, color: cp, fontSize: 13, cursor: 'pointer' }}>
                    Effacer la sélection
                  </button>
                </div>
              )}
              {showFormulaire && (
                <FormulaireSpectacle
                  config={config}
                  cp={cp} cs={cs}
                  siegesSelectionnes={selectionnes}
                  siegesBD={siegesBD}
                  siteId={siteId}
                  onSuccess={() => {
                    setSelectionnes([]);
                    setShowFormulaire(false);
                    // Recharger les sièges
                    if (siteId) {
                      fetch(`/api/sieges/public/${siteId}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(data => { if (data?.sieges) setSiegesBD(data.sieges); })
                        .catch(() => {});
                    }
                  }}
                />
              )}
              {showFormulaire && (
                <button onClick={() => setShowFormulaire(false)} style={{ width: '100%', marginTop: 8, padding: '8px', background: 'transparent', border: `1px solid ${cp}30`, borderRadius: 8, color: `${ct}66`, fontSize: 12, cursor: 'pointer' }}>
                  ← Modifier la sélection
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{ padding: '60px 24px', background: `${cf}`, borderTop: `1px solid ${cp}20` }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: cp, marginBottom: 16 }}>Contact</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: ct, marginBottom: 20 }}>Des questions?</h2>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {config.adresse && <p style={{ color: `${ct}77`, fontSize: 14 }}>📍 {config.adresse}, {config.ville}</p>}
            {config.telephone && <p style={{ color: `${ct}77`, fontSize: 14 }}>📞 {config.telephone}</p>}
            {config.email && <a href={`mailto:${config.email}`} style={{ color: cp, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>✉️ {config.email}</a>}
          </div>
        </div>
      </section>

      <footer style={{ padding: 20, background: cs, borderTop: `1px solid ${cp}15`, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          {config.nomEntreprise} — Propulsé par <span style={{ color: cp }}>e-Vend Studio</span>
        </p>
      </footer>
    </div>
  );
}