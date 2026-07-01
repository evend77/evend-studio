// src/templates/TemplateVitrineProMariage.tsx
// e-Vend Studio — Template PREMIUM 25$ — Vitrine Pro Mariage
// Sobre, élégant, émotionnel — inspiré Wix Bithemer — 100% original

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface EtapeHistoire {
  titre:       string;
  description: string;
  date?:       string;
}

export interface EtapeCeremonie {
  numero:      string;
  titre:       string;
  description: string;
  heure:       string;
  lieu:        string;
  photo:       string;
}

export interface Temoin {
  nom:   string;
  role:  string;
  photo: string;
}

export interface FAQ {
  question: string;
  reponse:  string;
}

export interface ConfigVitrineProMariage {
  // Identité
  prenomMarie1:       string;
  prenomMarie2:       string;
  couleurPrincipale:  string;  // '#8b6914' bronze/doré
  couleurAccent:      string;  // '#c9a96e' doré clair
  couleurFond:        string;  // '#fdf8f4' crème chaud
  couleurTexte:       string;  // '#2c1810' brun foncé
  police:             'manuscrite' | 'classique' | 'moderne';

  // Hero
  heroPhoto:          string;
  heroAnnonce:        string;   // "NOUS NOUS MARIONS !"
  dateMariage:        string;   // ISO — pour compte à rebours + affichage
  lieu:               string;
  heureMariage:       string;   // "14h00"
  boutonRSVP:         string;   // "Confirmer ma présence"

  // Section couple
  coupleMessage:      string;
  coupleDescription:  string;
  photo1:             string;
  photo2:             string;
  citation:           string;

  // Notre histoire
  histoireTitre:      string;
  histoire:           EtapeHistoire[];

  // Cérémonie
  ceremonieTitre:     string;
  etapesCeremonie:    EtapeCeremonie[];

  // Témoins / proches
  temoinsTitre:       string;
  temoinsDescription: string;
  temoins:            Temoin[];

  // Galerie
  galerieTitre:       string;
  galeriePhotos:      string[];

  // FAQ / Étiquette
  faqTitre:           string;
  faqPhoto:           string;
  faq:                FAQ[];

  // RSVP
  rsvpTitre:          string;
  rsvpDescription:    string;
  rsvpEmail:          string;   // où envoyer les confirmations

  // Footer
  telephone:          string;
  adresse:            string;
  copyright:          string;
}

// ─── CONFIG DÉFAUT ────────────────────────────────────────────────────────────

export const CONFIG_VITRINE_PRO_MARIAGE_DEFAUT: ConfigVitrineProMariage = {
  prenomMarie1:       'Thomas',
  prenomMarie2:       'Élise',
  couleurPrincipale:  '#8b6914',
  couleurAccent:      '#c9a96e',
  couleurFond:        '#fdf8f4',
  couleurTexte:       '#2c1810',
  police:             'manuscrite',

  heroPhoto:          'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600',
  heroAnnonce:        'NOUS NOUS MARIONS !',
  dateMariage:        '2026-09-12T14:00:00',
  lieu:               '168 Avenue du Château, Paris, France',
  heureMariage:       '14h00',
  boutonRSVP:         'Confirmer ma présence',

  coupleMessage:      'Nous sommes si heureux de vous avoir ici pour célébrer avec nous',
  coupleDescription:  'Deux âmes qui se sont trouvées, deux vies qui se rejoignent. Rejoignez-nous pour le plus beau jour de notre vie.',
  photo1:             'https://images.pexels.com/photos/3471999/pexels-photo-3471999.jpeg?auto=compress&cs=tinysrgb&w=600',
  photo2:             'https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600',
  citation:           '"Aujourd\'hui et pour toujours, je promets d\'être à tes côtés — ton meilleur ami, ton amour, ton confident éternel."',

  histoireTitre:      'Nous avons commencé par hasard et terminé par l\'amour',
  histoire: [
    { titre: 'La rencontre', description: 'Tout a commencé par une rencontre simple et inattendue qui a réuni deux âmes de la plus belle façon.', date: 'Septembre 2019' },
    { titre: 'Premier rendez-vous', description: 'Une soirée magique pleine de rires et de sourires timides, marquant le début d\'un voyage que rien ne pourrait arrêter.', date: 'Octobre 2019' },
    { titre: 'La demande en mariage', description: 'Dans un moment sincère sous les étoiles, une promesse a été faite — celle d\'aimer, de chérir et de marcher ensemble.', date: 'Décembre 2024' },
    { titre: 'Pour toujours', description: 'Main dans la main, ils s\'engagent vers un avenir rempli de rêves, d\'amour et de souvenirs à écrire.', date: 'Septembre 2026' },
  ],

  ceremonieTitre:     'Où et quand aura lieu notre mariage ?',
  etapesCeremonie: [
    { numero: '1', titre: 'Accueil des invités', description: 'Les invités sont chaleureusement accueillis à l\'arrivée. C\'est un moment pour se retrouver, savourer des rafraîchissements et s\'installer dans ce décor magnifique.', heure: '13h30 — 14h00', lieu: '168 Avenue du Château, Paris', photo: 'https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { numero: '2', titre: 'Cérémonie & Vœux', description: 'L\'échange des vœux est le moment le plus émouvant de la journée. Dans un silence recueilli, deux cœurs se promettent l\'éternité.', heure: '14h00 — 15h00', lieu: 'Chapelle du Château', photo: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { numero: '3', titre: 'Cocktail & Photos', description: 'Après la cérémonie, profitez d\'un cocktail en plein air pendant que le couple prend ses photos de mariage dans les jardins.', heure: '15h00 — 17h30', lieu: 'Jardins du Château', photo: 'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { numero: '4', titre: 'Dîner & Célébration', description: 'Le dîner de gala vous attend dans la grande salle ornée de fleurs. Musique, danse et joie pour célébrer jusqu\'au bout de la nuit.', heure: '18h00 — Minuit', lieu: 'Grande Salle du Château', photo: 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ],

  temoinsTitre:       'Nos proches qui sont toujours à nos côtés',
  temoinsDescription: 'NOS PROCHES',
  temoins: [
    { nom: 'Sophie Martin',  role: 'Témoin de la mariée',  photo: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Lucas Bernard',  role: 'Témoin du marié',      photo: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Emma Dubois',    role: 'Demoiselle d\'honneur', photo: 'https://images.pexels.com/photos/3775087/pexels-photo-3775087.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { nom: 'Hugo Lefebvre',  role: 'Garçon d\'honneur',    photo: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400' },
  ],

  galerieTitre:       'Explorez nos précieux souvenirs\ncapturant notre histoire d\'amour',
  galeriePhotos: [
    'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3471999/pexels-photo-3471999.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],

  faqTitre:           'L\'étiquette du mariage que chaque invité devrait connaître',
  faqPhoto:           'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
  faq: [
    { question: '1. Code vestimentaire', reponse: 'Tenue de soirée élégante recommandée. Couleurs suggérées : tons neutres, crème, champagne et bleu marine. Évitez le blanc et le noir pur par respect pour les mariés.' },
    { question: '2. Conseils de cérémonie', reponse: 'Veuillez arriver à l\'heure pour honorer le couple. Mettez vos téléphones en mode silencieux, évitez le flash pendant les vœux et suivez les indications des témoins.' },
    { question: '3. Règles de la réception', reponse: 'Votre table est assignée selon votre confirmation de présence. Merci d\'attendre votre assignation avant de vous asseoir. Le buffet ouvre après le premier discours.' },
  ],

  rsvpTitre:          'Confirmez votre présence',
  rsvpDescription:    'Votre présence est notre plus beau cadeau. Merci de confirmer avant le 1er août 2026.',
  rsvpEmail:          'mariage@thomas-elise.ca',

  telephone:          '+1 234 567 890',
  adresse:            '168 Avenue du Château, Paris, France',
  copyright:          '© 2026 Thomas & Élise · Tous droits réservés',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPolice(p: string) {
  if (p === 'classique') return "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
  if (p === 'moderne')   return "'Inter', system-ui, sans-serif";
  return "'Dancing Script', 'Great Vibes', cursive";
}

// ─── HOOK SCROLL REVEAL ──────────────────────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── COMPTE À REBOURS ────────────────────────────────────────────────────────

function CompteARebours({ dateMariage, couleur, texte }: { dateMariage: string; couleur: string; texte: string }) {
  const calc = () => {
    const diff = new Date(dateMariage).getTime() - Date.now();
    if (diff <= 0) return { j: 0, h: 0, m: 0, s: 0 };
    return { j: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
  };
  const [t, setT] = useState(calc());
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [dateMariage]);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
      {[{ v: t.j, l: 'Jours' }, { v: t.h, l: 'Heures' }, { v: t.m, l: 'Minutes' }, { v: t.s, l: 'Secondes' }].map(({ v, l }) => (
        <div key={l} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 800, color: couleur, lineHeight: 1 }}>{pad(v)}</div>
          <div style={{ fontSize: 11, color: texte + '77', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── CONFETTIS COEURS ────────────────────────────────────────────────────────

function Confettis({ actif }: { actif: boolean }) {
  if (!actif) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: 0,
          left: `${Math.random() * 100}%`,
          fontSize: 16 + Math.random() * 14,
          animation: `confetti-fall ${1.5 + Math.random() * 2}s ${Math.random() * 1}s ease-in both`,
        }}>
          {['💕', '🌸', '✨', '💍', '🌿', '❤️'][Math.floor(Math.random() * 6)]}
        </div>
      ))}
    </div>
  );
}

// ─── MODAL RSVP ──────────────────────────────────────────────────────────────

function ModalRSVP({ config, onClose, cp, ct, cf }: { config: ConfigVitrineProMariage; onClose: () => void; cp: string; ct: string; cf: string }) {
  const police = getPolice(config.police);
  const [nom, setNom]             = useState('');
  const [email, setEmail]         = useState('');
  const [telephone, setTelephone] = useState('');
  const [nb, setNb]               = useState(1);
  const [regime, setRegime]       = useState('');
  const [presence, setPresence]   = useState<'oui' | 'non' | ''>('');
  const [message, setMessage]     = useState('');
  const [envoye, setEnvoye]       = useState(false);
  const [envoi, setEnvoi]         = useState(false);
  const [confettis, setConfettis] = useState(false);
  const [erreur, setErreur]       = useState('');

  const envoyer = async () => {
    if (!nom.trim()) { setErreur('Veuillez entrer votre nom.'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setErreur('Veuillez entrer un courriel valide.'); return; }
    if (!presence) { setErreur('Veuillez indiquer votre présence.'); return; }
    setEnvoi(true); setErreur('');
    try {
      await fetch('/api/studio/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, telephone, nb_personnes: nb, regime_alimentaire: regime, presence, message, rsvp_email: config.rsvpEmail }),
      }).catch(() => {});
      setEnvoye(true);
      if (presence === 'oui') { setConfettis(true); setTimeout(() => setConfettis(false), 4000); }
    } catch {}
    setEnvoi(false);
  };

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: `1.5px solid ${cp}44`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'Inter, sans-serif', background: '#fff', color: ct, boxSizing: 'border-box' };

  return (
    <>
      <Confettis actif={confettis} />
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(44,24,16,0.7)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: cf, borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', boxShadow: `0 24px 64px rgba(0,0,0,0.35)`, border: `1px solid ${cp}33` }}>

          {/* Header */}
          <div style={{ padding: '28px 32px 0', textAlign: 'center', position: 'relative' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: `${cp}18`, border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: ct }}>✕</button>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💍</div>
            <h2 style={{ fontFamily: police, fontSize: 30, fontWeight: 700, color: ct, margin: '0 0 8px' }}>{config.rsvpTitre}</h2>
            <p style={{ fontSize: 14, color: ct + '88', lineHeight: 1.6, marginBottom: 0 }}>{config.rsvpDescription}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', margin: '16px 0' }}>
              <div style={{ height: 1, flex: 1, background: `${cp}33` }} />
              <span style={{ fontSize: 18, color: cp }}>♡</span>
              <div style={{ height: 1, flex: 1, background: `${cp}33` }} />
            </div>
          </div>

          {!envoye ? (
            <div style={{ padding: '0 32px 32px' }}>
              {erreur && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#dc2626', fontSize: 13 }}>{erreur}</div>}

              {/* Présence */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Serez-vous présent(e) ? *</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ v: 'oui' as const, l: '🎉 Oui, je serai là !' }, { v: 'non' as const, l: '😔 Non, je ne pourrai pas' }].map(({ v, l }) => (
                    <div key={v} onClick={() => setPresence(v)}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: `2px solid ${presence === v ? cp : `${cp}33`}`, background: presence === v ? `${cp}12` : '#fff', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600, color: presence === v ? cp : ct + '88', transition: 'all 0.2s' }}>
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nom complet *</label>
                  <input style={inp} value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre prénom et nom" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Courriel *</label>
                  <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@courriel.com" />
                </div>

                {presence === 'oui' && (
                  <>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Téléphone</label>
                        <input style={inp} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="514-555-0000" />
                      </div>
                      <div style={{ width: 120 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Nb personnes</label>
                        <select style={{ ...inp, cursor: 'pointer' }} value={nb} onChange={e => setNb(parseInt(e.target.value))}>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Régime alimentaire</label>
                      <input style={inp} value={regime} onChange={e => setRegime(e.target.value)} placeholder="Végétarien, allergies, etc. (optionnel)" />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: ct + '88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Message pour les mariés</label>
                  <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Un mot doux pour Thomas et Élise..." />
                </div>

                <button onClick={envoyer} disabled={envoi}
                  style={{ background: cp, color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: envoi ? 0.7 : 1, transition: 'all 0.2s' }}>
                  {envoi ? '⏳ Envoi...' : `${presence === 'non' ? '✉️ Envoyer mes regrets' : '💌 Confirmer ma présence'}`}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>{presence === 'oui' ? '🎊' : '💌'}</div>
              <h3 style={{ fontFamily: police, fontSize: 26, fontWeight: 700, color: ct, marginBottom: 12 }}>
                {presence === 'oui' ? 'À très bientôt !' : 'Merci pour votre message'}
              </h3>
              <p style={{ fontSize: 15, color: ct + '88', lineHeight: 1.7 }}>
                {presence === 'oui'
                  ? `Merci ${nom.split(' ')[0]} ! Nous sommes touchés de vous avoir parmi nous. Une confirmation vous sera envoyée par courriel.`
                  : `Merci ${nom.split(' ')[0]} pour votre message. Vous nous manquerez, mais nous vous pensons fort ce jour-là.`
                }
              </p>
              <button onClick={onClose} style={{ marginTop: 20, background: `${cp}18`, color: cp, border: `1.5px solid ${cp}44`, borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── LIGHTBOX GALERIE ─────────────────────────────────────────────────────────

function Lightbox({ photos, index, onClose, onPrev, onNext, cp }: { photos: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; cp: string }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={e => { e.stopPropagation(); onPrev(); }} style={{ position: 'absolute', left: 24, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 48, height: 48, borderRadius: '50%', fontSize: 22, cursor: 'pointer' }}>‹</button>
      <img src={photos[index]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
      <button onClick={e => { e.stopPropagation(); onNext(); }} style={{ position: 'absolute', right: 24, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 48, height: 48, borderRadius: '50%', fontSize: 22, cursor: 'pointer' }}>›</button>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
      <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{index + 1} / {photos.length}</div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props { config?: Partial<ConfigVitrineProMariage>; siteId?: number; vendeurId?: number; }

export default function TemplateVitrineProMariage({ config: configProp }: Props) {
  const config = { ...CONFIG_VITRINE_PRO_MARIAGE_DEFAUT, ...configProp };
  const cp  = config.couleurPrincipale;
  const ca  = config.couleurAccent;
  const cf  = config.couleurFond;
  const ct  = config.couleurTexte;
  const police = getPolice(config.police);
  const policeCorps = "'Cormorant Garamond', 'Playfair Display', serif";

  const [rsvpOuvert, setRsvpOuvert]     = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const [etapeCeremonie, setEtapeCeremonie] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [faqOuverte, setFaqOuverte]     = useState<number | null>(null);
  const [menuOuvert, setMenuOuvert]     = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useScrollReveal();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Parallax hero
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        heroRef.current.style.backgroundPositionY = `${50 + scrollY * 0.25}%`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOuvert(false); };
  const dateFormatee = new Date(config.dateMariage).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const navItems = ['Le Couple', "L'Histoire", 'Cérémonie', 'Proches', 'Galerie'];

  return (
    <div style={{ fontFamily: policeCorps, background: cf, color: ct, overflowX: 'hidden' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Great+Vibes&family=Inter:wght@300;400;500;600;700&display=swap" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        img { display: block; }
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.75s ease, transform 0.75s ease; }
        .reveal.delay-1 { transition-delay: 0.1s; }
        .reveal.delay-2 { transition-delay: 0.2s; }
        .reveal.delay-3 { transition-delay: 0.3s; }
        .reveal.delay-4 { transition-delay: 0.4s; }
        .photo-hover { transition: transform 0.4s ease; }
        .photo-hover:hover { transform: scale(1.03); }
        .gallery-item { transition: all 0.3s ease; cursor: pointer; overflow: hidden; }
        .gallery-item:hover img { transform: scale(1.08); }
        .gallery-item img { transition: transform 0.4s ease; width: 100%; height: 100%; object-fit: cover; }
        .temoin-card:hover { transform: translateY(-6px) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.12) !important; }
        .temoin-card { transition: all 0.3s ease; }
        .nav-link { transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: ${cp} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${ca}; border-radius: 2px; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, background: `${cf}f4`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${cp}18` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo anneaux */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
              <circle cx="13" cy="16" r="11" stroke={cp} strokeWidth="2" fill="none" />
              <circle cx="27" cy="16" r="11" stroke={cp} strokeWidth="2" fill="none" />
            </svg>
          </div>

          {/* Nav desktop */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 32, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              {navItems.map(item => (
                <span key={item} className="nav-link" style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500, letterSpacing: '0.08em', color: ct + 'aa', textTransform: 'uppercase' }}
                  onClick={() => scrollTo(item.toLowerCase().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a').replace(/['\s]+/g, '-').replace(/[^a-z0-9-]/g, ''))}>
                  {item}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setRsvpOuvert(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: cp, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
              📋 R.S.V.P
            </button>
            {isMobile && <button onClick={() => setMenuOuvert(!menuOuvert)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: ct }}>☰</button>}
          </div>
        </div>
        {isMobile && menuOuvert && (
          <div style={{ background: cf, borderTop: `1px solid ${cp}18`, padding: '16px 28px' }}>
            {navItems.map(item => (
              <div key={item} onClick={() => scrollTo(item.toLowerCase().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a').replace(/\s+/g, '-'))}
                style={{ padding: '12px 0', color: ct + 'aa', fontSize: 14, fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', borderBottom: `1px solid ${cp}18` }}>
                {item}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', paddingTop: 68 }}>
        {/* Photo gauche */}
        <div style={{ flex: '1 1 50%', position: 'relative', minHeight: isMobile ? '40vh' : '100%', order: isMobile ? 2 : 1, background: '#f0e8e0' }}>
          <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ct + '55', zIndex: 2, textAlign: 'center' }}>
            {config.heroAnnonce}
          </p>
          <div style={{ position: 'absolute', bottom: isMobile ? 24 : '15%', left: isMobile ? 24 : 48, right: isMobile ? 24 : 48, zIndex: 3 }}>
            <h1 style={{ fontFamily: police, fontSize: `clamp(36px, 6vw, 80px)`, fontWeight: 400, color: ct, lineHeight: 1, marginBottom: 16 }}>
              {config.prenomMarie1} <span style={{ color: cp }}>♥</span> {config.prenomMarie2}
            </h1>
            <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: ct + '88', letterSpacing: '0.03em' }}>
              <span style={{ fontWeight: 600 }}>Date :</span> {config.heureMariage} · {dateFormatee}
            </p>
            <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: ct + '88', marginTop: 4 }}>
              <span style={{ fontWeight: 600 }}>Lieu :</span> {config.lieu}
            </p>
          </div>
        </div>

        {/* Photo droite */}
        <div ref={heroRef} style={{ flex: '1 1 50%', backgroundImage: `url(${config.heroPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center 50%', minHeight: isMobile ? '50vh' : '100%', order: isMobile ? 1 : 2, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, transparent 60%, rgba(253,248,244,0.2))' }} />
          {/* Bouton play décoratif */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
            onClick={() => setRsvpOuvert(true)}>
            <span style={{ fontSize: 22, marginLeft: 4 }}>▶</span>
          </div>
        </div>
      </section>

      {/* ── COMPTE À REBOURS ────────────────────────────────────────────────── */}
      <section className="reveal" style={{ background: cf, padding: isMobile ? '48px 24px' : '64px', textAlign: 'center', borderTop: `1px solid ${cp}18` }}>
        <p style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 24 }}>Le grand jour dans</p>
        <CompteARebours dateMariage={config.dateMariage} couleur={cp} texte={ct} />
        <button onClick={() => setRsvpOuvert(true)} style={{ marginTop: 32, background: cp, color: '#fff', border: 'none', borderRadius: 8, padding: '14px 36px', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
          💌 {config.boutonRSVP}
        </button>
      </section>

      {/* ── SECTION COUPLE ──────────────────────────────────────────────────── */}
      <section id="le-couple" style={{ background: '#fff', padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p className="reveal" style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 14 }}>BONJOUR À TOUS !</p>
          <h2 className="reveal delay-1" style={{ fontFamily: police, fontSize: `clamp(28px, 5vw, 52px)`, fontWeight: 400, color: ct, lineHeight: 1.3, marginBottom: 36 }}>
            {config.coupleMessage}
          </h2>

          {/* 2 Photos côte à côte */}
          <div className="reveal delay-2" style={{ display: 'flex', gap: 0, justifyContent: 'center', maxWidth: 720, margin: '0 auto 36px', position: 'relative' }}>
            <div className="photo-hover" style={{ flex: 1, aspectRatio: '3/4', overflow: 'hidden', borderRadius: '4px 0 0 4px' }}>
              <img src={config.photo1} alt={config.prenomMarie2} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.background = '#e8ddd6'; }} />
            </div>
            {/* Médaillon anneaux */}
            <div style={{ position: 'absolute', left: '50%', top: '55%', transform: 'translate(-50%, -50%)', zIndex: 5, background: cf, borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: `1px solid ${cp}22` }}>
              <svg width="36" height="28" viewBox="0 0 40 32" fill="none">
                <circle cx="13" cy="16" r="11" stroke={cp} strokeWidth="2" fill="none" />
                <circle cx="27" cy="16" r="11" stroke={cp} strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div className="photo-hover" style={{ flex: 1, aspectRatio: '3/4', overflow: 'hidden', borderRadius: '0 4px 4px 0' }}>
              <img src={config.photo2} alt={config.prenomMarie1} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.background = '#e0d0c4'; }} />
            </div>
          </div>

          <p className="reveal delay-3" style={{ fontFamily: policeCorps, fontStyle: 'italic', fontSize: `clamp(15px, 2vw, 18px)`, color: ct + '99', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
            {config.citation}
          </p>
        </div>
      </section>

      {/* ── NOTRE HISTOIRE (timeline) ────────────────────────────────────────── */}
      <section id="l'histoire" style={{ background: cf, padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p className="reveal" style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 14 }}>NOTRE HISTOIRE</p>
            <h2 className="reveal delay-1" style={{ fontFamily: police, fontSize: `clamp(28px, 5vw, 52px)`, fontWeight: 400, color: ct, lineHeight: 1.35, maxWidth: 600, margin: '0 auto' }}>
              {config.histoireTitre}
            </h2>
          </div>

          {/* Grille 2x2 ou 4 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 20 : 1 }}>
            {config.histoire.map((e, i) => (
              <div key={i} className={`reveal delay-${i + 1}`}
                style={{ background: '#fff', padding: isMobile ? '24px 18px' : '40px 32px', textAlign: 'center', borderRight: !isMobile && i < config.histoire.length - 1 ? `1px solid ${cp}18` : 'none' }}>
                {e.date && <p style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', color: ca, marginBottom: 12 }}>{e.date}</p>}
                <h3 style={{ fontFamily: police, fontSize: `clamp(18px, 2.5vw, 24px)`, fontWeight: 400, color: ct, marginBottom: 14 }}>{e.titre}</h3>
                <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: ct + '88', lineHeight: 1.7 }}>{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÉRÉMONIE ───────────────────────────────────────────────────────── */}
      <section id="cérémonie" style={{ background: '#fff', padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 className="reveal" style={{ fontFamily: police, fontSize: `clamp(26px, 4.5vw, 48px)`, fontWeight: 400, color: ct, lineHeight: 1.3, marginBottom: 48, textAlign: 'center' }}>
            {config.ceremonieTitre}
          </h2>

          <div className="reveal delay-1" style={{ display: 'flex', gap: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Panneau gauche */}
            <div style={{ flex: '1 1 45%', background: cf, padding: isMobile ? '32px 24px' : '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
              {/* Navigation flèches */}
              <div style={{ display: 'flex', gap: 8, position: 'absolute', top: 20, right: 20 }}>
                <button onClick={() => setEtapeCeremonie(p => (p - 1 + config.etapesCeremonie.length) % config.etapesCeremonie.length)}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${cp}44`, background: '#fff', cursor: 'pointer', fontSize: 16, color: ct }}>‹</button>
                <button onClick={() => setEtapeCeremonie(p => (p + 1) % config.etapesCeremonie.length)}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${cp}44`, background: '#fff', cursor: 'pointer', fontSize: 16, color: ct }}>›</button>
              </div>

              {config.etapesCeremonie[etapeCeremonie] && (() => {
                const e = config.etapesCeremonie[etapeCeremonie];
                const date = new Date(config.dateMariage);
                return (
                  <div style={{ transition: 'all 0.3s ease' }}>
                    <h3 style={{ fontFamily: police, fontSize: `clamp(22px, 3vw, 36px)`, fontWeight: 400, color: ct, marginBottom: 20, lineHeight: 1.3 }}>
                      {e.titre}
                    </h3>
                    <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: ct + '88', lineHeight: 1.8, marginBottom: 24 }}>{e.description}</p>
                    <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 600, color: ct, marginBottom: 4 }}>
                      Heure : <span style={{ color: cp }}>{e.heure}</span>
                    </p>
                    <p style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 600, color: ct }}>
                      Lieu : <span style={{ color: cp }}>{e.lieu}</span>
                    </p>
                  </div>
                );
              })()}

              {/* Dots */}
              <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
                {config.etapesCeremonie.map((_, i) => (
                  <div key={i} onClick={() => setEtapeCeremonie(i)} style={{ width: i === etapeCeremonie ? 24 : 8, height: 8, borderRadius: 4, background: i === etapeCeremonie ? cp : `${cp}33`, cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>

            {/* Photo droite */}
            <div style={{ flex: '1 1 55%', position: 'relative', minHeight: isMobile ? 280 : 'auto', overflow: 'hidden' }}>
              {/* Badge date */}
              <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 3, background: '#fff', padding: '12px 16px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: ct, lineHeight: 1, fontFamily: 'Inter, sans-serif' }}>{new Date(config.dateMariage).getDate()}</div>
                <div style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', color: ct + '88' }}>{new Date(config.dateMariage).toLocaleDateString('fr-FR', { month: 'long' })}</div>
              </div>
              <img src={config.etapesCeremonie[etapeCeremonie]?.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 360, transition: 'opacity 0.3s' }} onError={e => { (e.target as HTMLImageElement).style.background = '#e8ddd6'; }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── TÉMOINS / PROCHES ────────────────────────────────────────────────── */}
      <section id="proches" style={{ background: cf, padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p className="reveal" style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 14 }}>
            {config.temoinsDescription}
          </p>
          <h2 className="reveal delay-1" style={{ fontFamily: police, fontSize: `clamp(26px, 4vw, 44px)`, fontWeight: 400, color: ct, lineHeight: 1.3, marginBottom: 56, maxWidth: 600, margin: '0 auto 56px' }}>
            {config.temoinsTitre}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 20 }}>
            {config.temoins.map((t, i) => (
              <div key={i} className={`temoin-card reveal delay-${i + 1}`}
                style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', background: '#fff' }}>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden' }}>
                  <img src={t.photo} alt={t.nom} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} onError={e => { (e.target as HTMLImageElement).style.background = '#e8ddd6'; }} />
                </div>
                <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                  <h3 style={{ fontFamily: police, fontSize: 18, fontWeight: 400, color: ct, marginBottom: 4 }}>{t.nom}</h3>
                  <p style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: ct + '77' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALERIE ─────────────────────────────────────────────────────────── */}
      <section id="galerie" style={{ background: '#fff', padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 14 }}>GALERIE PHOTOS</p>
            <h2 style={{ fontFamily: police, fontSize: `clamp(26px, 4vw, 44px)`, fontWeight: 400, color: ct, lineHeight: 1.35, maxWidth: 500, margin: '0 auto', whiteSpace: 'pre-line' }}>
              {config.galerieTitre}
            </h2>
          </div>

          {/* Mosaïque */}
          <div className="reveal delay-1" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gridAutoRows: '200px', gap: 4 }}>
            {config.galeriePhotos.map((url, i) => {
              const grand = i === 0 || i === 3; // photos grandes
              return (
                <div key={i} className="gallery-item"
                  style={{ gridColumn: grand && !isMobile ? 'span 1' : undefined, gridRow: grand && !isMobile ? 'span 2' : undefined, background: '#e8ddd6' }}
                  onClick={() => setLightboxIndex(i)}>
                  <img src={url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox photos={config.galeriePhotos} index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(p => (p! - 1 + config.galeriePhotos.length) % config.galeriePhotos.length)}
          onNext={() => setLightboxIndex(p => (p! + 1) % config.galeriePhotos.length)}
          cp={cp} />
      )}

      {/* ── FAQ / ÉTIQUETTE ─────────────────────────────────────────────────── */}
      <section style={{ background: cf, padding: isMobile ? '64px 24px' : '96px 64px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 64, alignItems: 'flex-start', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* Texte + accordéon */}
          <div className="reveal" style={{ flex: '1 1 380px' }}>
            <p style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 14 }}>ÉTIQUETTE</p>
            <h2 style={{ fontFamily: police, fontSize: `clamp(24px, 3.5vw, 40px)`, fontWeight: 400, color: ct, lineHeight: 1.35, marginBottom: 32 }}>
              {config.faqTitre}
            </h2>
            {config.faq.map((item, i) => (
              <div key={i} style={{ borderBottom: `1px solid ${cp}22`, marginBottom: 0 }}>
                <button onClick={() => setFaqOuverte(faqOuverte === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: police, fontSize: 18, fontWeight: 400, color: faqOuverte === i ? cp : ct }}>{item.question}</span>
                  <span style={{ fontSize: 18, color: cp, transition: 'transform 0.3s', transform: faqOuverte === i ? 'rotate(180deg)' : 'none', flexShrink: 0, marginLeft: 12 }}>⌄</span>
                </button>
                {faqOuverte === i && (
                  <div style={{ paddingBottom: 20 }}>
                    <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: ct + '88', lineHeight: 1.8 }}>{item.reponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Photo */}
          <div className="reveal delay-2" style={{ flex: '1 1 380px', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/5' }}>
            <img src={config.faqPhoto} alt="étiquette" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.background = '#e8ddd6'; }} />
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fff', padding: isMobile ? '64px 24px' : '80px 64px', borderTop: `1px solid ${cp}22`, textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', color: ca, marginBottom: 16 }}>NOUS NOUS MARIONS !</p>
        <h2 style={{ fontFamily: police, fontSize: `clamp(36px, 6vw, 72px)`, fontWeight: 400, color: ct, marginBottom: 20 }}>
          {config.prenomMarie1} <span style={{ color: cp }}>♥</span> {config.prenomMarie2}
        </h2>
        <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: ct + '88' }}>
          <span style={{ fontWeight: 600 }}>Date :</span> {config.heureMariage} · {dateFormatee}
        </p>
        <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: ct + '88', marginTop: 6 }}>
          <span style={{ fontWeight: 600 }}>Lieu :</span> {config.lieu}
        </p>
        {config.telephone && <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: ct + '88', marginTop: 6 }}><span style={{ fontWeight: 600 }}>Téléphone :</span> {config.telephone}</p>}
        <div style={{ height: 1, background: `${cp}22`, maxWidth: 400, margin: '32px auto' }} />
        <p style={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: ct + '55' }}>{config.copyright}</p>
        <p style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', color: ct + '33', marginTop: 8 }}>Propulsé par <span style={{ color: ca }}>e-Vend Studio</span></p>
      </footer>

      {/* ── MODAL RSVP ──────────────────────────────────────────────────────── */}
      {rsvpOuvert && <ModalRSVP config={config} onClose={() => setRsvpOuvert(false)} cp={cp} ct={ct} cf={cf} />}
    </div>
  );
}