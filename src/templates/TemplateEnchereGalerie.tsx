// src/templates/TemplateEnchereGalerie.tsx
// e-Vend Studio — Enchère Galerie — Plusieurs lots, style maison de ventes

import { useState, useEffect } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Lot {
  id:          string;
  titre:       string;
  description: string;
  photos:      string[];
  condition:   string;
  categorie:   string;
  prixBase:    number;
  prixReserve?: number;
  dateFin:     string;
  dateDebut:   string;
  vedette:     boolean;
}

export interface ConfigEnchereGalerie {
  // Identité
  nomBoutique:       string;
  sloganBoutique:    string;
  logoUrl:           string;
  banniereUrl:       string;
  couleurPrincipale: string;  // doré: '#c9a96e'
  couleurSecondaire: string;  // '#0f0c0c'
  couleurAccent:     string;  // '#fff'
  police:            'moderne' | 'classique';

  // Vente
  nomVente:          string;  // ex: "Vente de prestige — Juin 2026"
  descriptionVente:  string;
  incrementMin:      number;
  lots:              Lot[];

  // Contact
  nomVendeur:        string;
  email:             string;
  telephone?:        string;
}

export const LOT_DEFAUT: Lot = {
  id: 'l1',
  titre: 'Montre Tissot Le Locle — Édition limitée',
  description: 'Montre automatique suisse en parfait état, boîte et papiers d\'origine.',
  photos: ['https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800'],
  condition: 'Excellent',
  categorie: 'Montres',
  prixBase: 350,
  prixReserve: 500,
  dateFin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  dateDebut: new Date().toISOString(),
  vedette: true,
};

export const CONFIG_ENCHERE_GALERIE_DEFAUT: ConfigEnchereGalerie = {
  nomBoutique:       'Maison des Enchères',
  sloganBoutique:    'Des objets d\'exception pour des collectionneurs exigeants',
  logoUrl:           '',
  banniereUrl:       'https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#c9a96e',
  couleurSecondaire: '#0f0c0c',
  couleurAccent:     '#fff',
  police:            'classique',
  nomVente:          'Vente de prestige — Juin 2026',
  descriptionVente:  'Une sélection rare d\'objets de collection, montres, art et antiquités. Tous les articles sont authentifiés.',
  incrementMin:      10,
  lots: [
    LOT_DEFAUT,
    {
      id: 'l2', titre: 'Tableau huile sur toile — Paysage québécois 1960',
      description: 'Œuvre signée, authentifiée par un expert. 60cm × 90cm. Cadre d\'époque.',
      photos: ['https://images.pexels.com/photos/1209843/pexels-photo-1209843.jpeg?auto=compress&cs=tinysrgb&w=800'],
      condition: 'Bon état', categorie: 'Art', prixBase: 200, dateFin: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: false,
    },
    {
      id: 'l3', titre: 'Appareil photo Leica M6 — Argentique',
      description: 'Leica M6 TTL 0.85, obturateur révisé. Avec objectif Summicron 50mm f/2.',
      photos: ['https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800'],
      condition: 'Excellent', categorie: 'Photographie', prixBase: 1800, prixReserve: 2200, dateFin: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: true,
    },
    {
      id: 'l4', titre: 'Set de 6 verres Baccarat — Cristal taillé',
      description: 'Service de 6 verres à vin Baccarat en parfait état, jamais utilisés.',
      photos: ['https://images.pexels.com/photos/1282280/pexels-photo-1282280.jpeg?auto=compress&cs=tinysrgb&w=800'],
      condition: 'Comme neuf', categorie: 'Art de la table', prixBase: 150, dateFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: false,
    },
  ],
  nomVendeur:        'Maison Duchêne',
  email:             'ventes@maisonduchene.ca',
  telephone:         '514-555-0101',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function useTimer(dateFin: string) {
  const calc = () => {
    const diff = new Date(dateFin).getTime() - Date.now();
    if (diff <= 0) return { j: 0, h: 0, m: 0, s: 0, expire: true };
    return { j: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000), expire: false };
  };
  const [t, setT] = useState(calc());
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [dateFin]);
  return t;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── TIMER COMPACT ────────────────────────────────────────────────────────────
function TimerCompact({ dateFin, cp }: { dateFin: string; cp: string }) {
  const t = useTimer(dateFin);
  if (t.expire) return <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 700 }}>Terminée</span>;
  const urgent = t.j === 0 && t.h < 3;
  return (
    <span style={{ color: urgent ? '#ef4444' : cp, fontSize: 12, fontWeight: 800, background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(201,169,110,0.1)', padding: '3px 8px', borderRadius: 8 }}>
      ⏱ {t.j > 0 ? `${t.j}j ${t.h}h` : `${t.h}h ${pad(t.m)}m ${pad(t.s)}s`}
    </span>
  );
}

// ─── MODAL LOT ────────────────────────────────────────────────────────────────
function ModalLot({ lot, config, onClose, siteId, vendeurId }: {
  lot: Lot; config: ConfigEnchereGalerie; onClose: () => void; siteId?: number; vendeurId?: number;
}) {
  const cp = config.couleurPrincipale;
  const t  = useTimer(lot.dateFin);
  const [photoActive, setPhotoActive] = useState(0);
  const [miseCourante, setMiseCourante] = useState(lot.prixBase);
  const [nbMises, setNbMises]     = useState(0);
  const [montant, setMontant]     = useState(lot.prixBase + config.incrementMin);
  const [nom, setNom]             = useState('');
  const [email, setEmail]         = useState('');
  const [erreur, setErreur]       = useState('');
  const [succes, setSucces]       = useState('');
  const [envoi, setEnvoi]         = useState(false);

  const police = config.police === 'classique'
    ? "'Playfair Display', Georgia, serif"
    : "'Inter', sans-serif";

  const placerMise = async () => {
    if (!nom.trim() || !email.trim()) { setErreur('Remplissez votre nom et courriel.'); return; }
    if (montant < miseCourante + config.incrementMin) { setErreur(`Minimum : ${(miseCourante + config.incrementMin).toFixed(2)} $`); return; }
    setEnvoi(true); setErreur(''); setSucces('');
    try {
      if (siteId) {
        const res = await fetch('/api/encheres-studio/miser', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site_id: siteId, vendeur_id: vendeurId, lot_id: lot.id, montant, nom_encherisseur: nom, email_encherisseur: email }),
        });
        const d = await res.json();
        if (!res.ok) { setErreur(d.message || 'Erreur.'); return; }
      }
      setMiseCourante(montant); setNbMises(n => n + 1);
      setSucces(`✅ Mise de ${montant.toFixed(2)} $ enregistrée!`);
      setMontant(montant + config.incrementMin);
    } catch { setErreur('Erreur réseau.'); }
    finally { setEnvoi(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: config.couleurSecondaire === '#0f0c0c' ? '#1a1410' : config.couleurSecondaire, borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '90vh', overflow: 'auto', border: `1px solid ${cp}30`, fontFamily: police }}>

        {/* Header modal */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${cp}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: cp, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>Lot #{lot.id} — {lot.categorie}</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{lot.titre}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 24, padding: 24, flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* Photos */}
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 360 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', aspectRatio: '4/3', marginBottom: 8 }}>
              {lot.photos[photoActive] && <img src={lot.photos[photoActive]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            {lot.photos.length > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {lot.photos.map((ph, i) => (
                  <div key={i} onClick={() => setPhotoActive(i)} style={{ width: 52, height: 40, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === photoActive ? cp : 'transparent'}` }}>
                    <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginTop: 14 }}>{lot.description}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, color: 'rgba(255,255,255,0.6)' }}>✨ {lot.condition}</span>
              <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, color: 'rgba(255,255,255,0.6)' }}>🏷️ {lot.categorie}</span>
            </div>
          </div>

          {/* Enchère */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '18px', border: `1px solid ${cp}20`, marginBottom: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{nbMises === 0 ? 'Prix de départ' : 'Mise courante'}</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: cp, margin: 0 }}>{miseCourante.toFixed(2)} $</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{nbMises} mise{nbMises !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Temps restant</p>
                <TimerCompact dateFin={lot.dateFin} cp={cp} />
              </div>
              {lot.prixReserve && (
                <p style={{ fontSize: 12, color: miseCourante >= lot.prixReserve ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
                  {miseCourante >= lot.prixReserve ? '✅ Réserve atteinte' : '🔒 Réserve non atteinte'}
                </p>
              )}
            </div>

            {!t.expire && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {succes && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '10px', color: '#4ade80', fontSize: 13 }}>{succes}</div>}
                {erreur && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px', color: '#f87171', fontSize: 13 }}>{erreur}</div>}
                <input style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as any }} placeholder="Votre prénom / surnom" value={nom} onChange={e => setNom(e.target.value)} />
                <input style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as any }} type="email" placeholder="Courriel (confidentiel)" value={email} onChange={e => setEmail(e.target.value)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }} min={miseCourante + config.incrementMin} step={config.incrementMin} value={montant} onChange={e => setMontant(parseFloat(e.target.value) || 0)} />
                  <button onClick={placerMise} disabled={envoi}
                    style={{ padding: '10px 18px', background: cp, border: 'none', borderRadius: 8, color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: police }}>
                    {envoi ? '⏳' : '🔨 Miser'}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Minimum : {(miseCourante + config.incrementMin).toFixed(2)} $</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CARTE LOT ────────────────────────────────────────────────────────────────
function CarteLot({ lot, cp, police, onClick }: { lot: Lot; cp: string; police: string; onClick: () => void }) {
  const t = useTimer(lot.dateFin);
  const urgent = !t.expire && t.j === 0 && t.h < 6;

  return (
    <div onClick={onClick} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', border: `1px solid ${urgent ? cp + '40' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', transition: 'all 0.25s', fontFamily: police, position: 'relative' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.4)`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>

      {lot.vedette && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: cp, color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>VEDETTE</div>
      )}
      {urgent && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>FIN IMMINENTE</div>
      )}

      {/* Photo */}
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        {lot.photos[0]
          ? <img src={lot.photos[0]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>
        }
      </div>

      {/* Infos */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
          <p style={{ fontSize: 11, color: cp, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lot.categorie}</p>
          <TimerCompact dateFin={lot.dateFin} cp={cp} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>{lot.titre}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Mise de départ</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: cp }}>{lot.prixBase.toFixed(2)} $</p>
          </div>
          <button style={{ padding: '8px 16px', background: cp + '20', border: `1px solid ${cp}40`, borderRadius: 8, color: cp, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: police }}>
            Enchérir →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props { config?: Partial<ConfigEnchereGalerie>; siteId?: number; vendeurId?: number; }

export default function TemplateEnchereGalerie({ config: configProp, siteId, vendeurId }: Props) {
  const config = { ...CONFIG_ENCHERE_GALERIE_DEFAUT, ...configProp };
  const cp = config.couleurPrincipale;
  const cs = config.couleurSecondaire;
  const police = config.police === 'classique' ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif";

  const [lotActif, setLotActif]       = useState<Lot | null>(null);
  const [filtre, setFiltre]           = useState('Tous');
  const [tri, setTri]                 = useState<'fin' | 'prix'>('fin');
  const [isMobile, setIsMobile]       = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const categories = ['Tous', ...Array.from(new Set(config.lots.map(l => l.categorie)))];

  const lotsFiltres = config.lots
    .filter(l => filtre === 'Tous' || l.categorie === filtre)
    .sort((a, b) => tri === 'fin'
      ? new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime()
      : a.prixBase - b.prixBase
    );

  return (
    <div style={{ minHeight: '100vh', background: cs, color: '#fff', fontFamily: police }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" />
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } img { display:block; } button { font-family:inherit; }`}</style>

      {lotActif && (
        <ModalLot lot={lotActif} config={config} onClose={() => setLotActif(null)} siteId={siteId} vendeurId={vendeurId} />
      )}

      {/* HERO */}
      <div style={{ position: 'relative', minHeight: isMobile ? 240 : 380, backgroundImage: `url(${config.banniereUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${cs}cc, ${cs}ee)` }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: isMobile ? '40px 20px' : '80px 24px', textAlign: 'center' }}>
          {config.logoUrl && <img src={config.logoUrl} alt="logo" style={{ height: 56, objectFit: 'contain', margin: '0 auto 20px' }} />}
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>🔨 Vente aux enchères</p>
          <h1 style={{ fontSize: `clamp(24px, 5vw, 48px)`, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>{config.nomVente}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>{config.descriptionVente}</p>
        </div>
      </div>

      {/* FILTRES */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFiltre(cat)}
                style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${filtre === cat ? cp : 'rgba(255,255,255,0.15)'}`, background: filtre === cat ? cp + '20' : 'transparent', color: filtre === cat ? cp : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>Trier par :</span>
            {[{ v: 'fin' as const, l: 'Fin imminente' }, { v: 'prix' as const, l: 'Prix croissant' }].map(({ v, l }) => (
              <button key={v} onClick={() => setTri(v)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${tri === v ? cp : 'rgba(255,255,255,0.15)'}`, background: tri === v ? cp + '20' : 'transparent', color: tri === v ? cp : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRILLE LOTS */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>{lotsFiltres.length} lot{lotsFiltres.length !== 1 ? 's' : ''} disponible{lotsFiltres.length !== 1 ? 's' : ''}</p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {lotsFiltres.map(lot => (
            <CarteLot key={lot.id} lot={lot} cp={cp} police={police} onClick={() => setLotActif(lot)} />
          ))}
        </div>
      </div>

      {/* CONTACT */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{config.nomBoutique}</p>
        <p style={{ fontSize: 13, color: cp }}>{config.email}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 16 }}>Propulsé par <span style={{ color: cp }}>e-Vend Studio Enchères</span></p>
      </div>
    </div>
  );
}