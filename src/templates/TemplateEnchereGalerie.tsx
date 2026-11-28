// src/templates/TemplateEnchereGalerie.tsx
// e-Vend Studio — Enchère Galerie — Plusieurs lots, style maison de ventes (VRAIES enchères)
// Les lots viennent de « Mes enchères » (API /api/encheres-studio). L'apparence vient de config.enchere.

import { useState, useEffect } from 'react';
import { useEncheres, useTimer, BoiteMise, PastilleReserve, HistoriqueMises, fmt, pad, prixAffiche, type LotPub } from './enchereSite/moteur';

// Ancien format de lot, gardé pour l'éditeur de configuration (src/pages/studio/ConfigTemplateEnchereGalerie.tsx).
// Les vrais lots viennent de « Mes enchères » (LotPub) ; ces champs ne servent plus à l'affichage du site.
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

export interface ConfigEnchereGalerie {
  nomBoutique:       string;
  sloganBoutique:    string;
  logoUrl:           string;
  banniereUrl:       string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  couleurAccent:     string;
  police:            'moderne' | 'classique';
  nomVente:          string;
  descriptionVente:  string;
  incrementMin:      number;
  lots:              Lot[];
  nomVendeur:        string;
  email:             string;
  telephone?:        string;
}

export const CONFIG_ENCHERE_GALERIE_DEFAUT: ConfigEnchereGalerie = {
  nomBoutique:       'Maison des Enchères',
  sloganBoutique:    'Des objets d\'exception pour des collectionneurs exigeants',
  logoUrl:           '',
  banniereUrl:       'https://images.pexels.com/photos/1191710/pexels-photo-1191710.jpeg?auto=compress&cs=tinysrgb&w=1600',
  couleurPrincipale: '#c9a96e',
  couleurSecondaire: '#0f0c0c',
  couleurAccent:     '#fff',
  police:            'classique',
  nomVente:          'Vente de prestige',
  descriptionVente:  'Une sélection rare d\'objets de collection, montres, art et antiquités. Tous les articles sont authentifiés.',
  incrementMin:      10,
  lots:              [],
  nomVendeur:        'Maison Duchêne',
  email:             'ventes@maisonduchene.ca',
  telephone:         '',
};

const jours = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
const demoLot = (id: number, titre: string, description: string, photo: string, condition: string, categorie: string, prixBase: number, j: number, vedette = false, aReserve = false): LotPub => ({
  id, titre, description, photos: [photo], categorie, condition, tags: [], vedette, prixBase, prixActuel: null, increment: 10, nbMises: 0,
  dateDebut: new Date().toISOString(), dateFin: jours(j), statut: 'active', aReserve, reserveAtteinte: aReserve ? false : null, meneurNom: null,
});
const LOTS_DEMO: LotPub[] = [
  demoLot(1, 'Montre Tissot Le Locle — Édition limitée', 'Montre automatique suisse en parfait état, boîte et papiers d\'origine.', 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800', 'Excellent', 'Montres', 350, 3, true, true),
  demoLot(2, 'Tableau huile sur toile — Paysage québécois 1960', 'Œuvre signée, authentifiée par un expert. 60cm × 90cm. Cadre d\'époque.', 'https://images.pexels.com/photos/1209843/pexels-photo-1209843.jpeg?auto=compress&cs=tinysrgb&w=800', 'Bon état', 'Art', 200, 5),
  demoLot(3, 'Appareil photo Leica M6 — Argentique', 'Leica M6 TTL 0.85, obturateur révisé. Avec objectif Summicron 50mm f/2.', 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800', 'Excellent', 'Photographie', 1800, 1, true, true),
  demoLot(4, 'Set de 6 verres Baccarat — Cristal taillé', 'Service de 6 verres à vin Baccarat en parfait état, jamais utilisés.', 'https://images.pexels.com/photos/1282280/pexels-photo-1282280.jpeg?auto=compress&cs=tinysrgb&w=800', 'Comme neuf', 'Art de la table', 150, 7),
];

function TimerCompact({ dateFin, cp, delta }: { dateFin: string; cp: string; delta: number }) {
  const t = useTimer(dateFin, delta);
  if (t.expire) return <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 700 }}>Terminée</span>;
  const urgent = t.j === 0 && t.h < 3;
  return (
    <span style={{ color: urgent ? '#ef4444' : cp, fontSize: 12, fontWeight: 800, background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 8 }}>
      ⏱ {t.j > 0 ? `${t.j}j ${t.h}h` : `${t.h}h ${pad(t.m)}m ${pad(t.s)}s`}
    </span>
  );
}

function CarteLot({ lot, cp, police, delta, onClick }: { lot: LotPub; cp: string; police: string; delta: number; onClick: () => void }) {
  const t = useTimer(lot.dateFin, delta);
  const finie = lot.statut === 'terminee' || lot.statut === 'sans_gagnant' || t.expire;
  const urgent = !finie && t.j === 0 && t.h < 6;
  return (
    <div onClick={onClick} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', border: `1px solid ${urgent ? cp + '40' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', transition: 'all 0.25s', fontFamily: police, position: 'relative', opacity: finie ? 0.7 : 1 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
      {lot.vedette && !finie && <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: cp, color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>VEDETTE</div>}
      {urgent && <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>FIN IMMINENTE</div>}
      {lot.statut === 'terminee' && <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>VENDU</div>}
      {lot.estMeneur && lot.statut === 'active' && <div style={{ position: 'absolute', bottom: 'auto', top: 40, left: 12, zIndex: 2, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>VOUS ÊTES EN TÊTE</div>}
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        {lot.photos[0] ? <img src={lot.photos[0]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>}
      </div>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
          <p style={{ fontSize: 11, color: cp, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lot.categorie}</p>
          {lot.statut === 'a_venir' ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>À venir</span> : <TimerCompact dateFin={lot.dateFin} cp={cp} delta={delta} />}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>{lot.titre}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{lot.nbMises > 0 ? `Mise courante · ${lot.nbMises} mise${lot.nbMises > 1 ? 's' : ''}` : 'Mise de départ'}</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: cp }}>{fmt(prixAffiche(lot))}</p>
          </div>
          <button style={{ padding: '8px 16px', background: cp + '20', border: `1px solid ${cp}40`, borderRadius: 8, color: cp, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: police }}>{finie ? 'Voir' : 'Enchérir →'}</button>
        </div>
      </div>
    </div>
  );
}

type Moteur = ReturnType<typeof useEncheres>;

function ModalLot({ lotId, moteur, gid, cfg, police, onClose }: { lotId: number; moteur: Moteur; gid: number; cfg: ConfigEnchereGalerie; police: string; onClose: () => void }) {
  const lot = moteur.lots.find((l) => l.id === lotId);
  const cp = cfg.couleurPrincipale;
  const [photo, setPhoto] = useState(0);
  const t = useTimerSafe(lot ? lot.dateFin : new Date().toISOString(), moteur.delta);
  if (!lot) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: cfg.couleurSecondaire === '#0f0c0c' ? '#1a1410' : cfg.couleurSecondaire, borderRadius: 20, width: '100%', maxWidth: 840, maxHeight: '92vh', overflow: 'auto', border: `1px solid ${cp}30`, fontFamily: police }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${cp}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, color: cp, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 4 }}>Lot #{lot.id}{lot.categorie ? ` — ${lot.categorie}` : ''}</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{lot.titre}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 24, padding: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 360 }}>
            <div style={{ borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', aspectRatio: '4/3', marginBottom: 8 }}>
              {lot.photos[photo] && <img src={lot.photos[photo]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            {lot.photos.length > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {lot.photos.map((ph, i) => (
                  <div key={i} onClick={() => setPhoto(i)} style={{ width: 52, height: 40, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === photo ? cp : 'transparent'}` }}>
                    <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginTop: 14, whiteSpace: 'pre-wrap' }}>{lot.description}</p>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {lot.condition && <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, color: 'rgba(255,255,255,0.6)' }}>✨ {lot.condition}</span>}
              {lot.categorie && <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 20, color: 'rgba(255,255,255,0.6)' }}>🏷️ {lot.categorie}</span>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 18, border: `1px solid ${cp}20`, marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{lot.nbMises === 0 ? 'Prix de départ' : lot.statut === 'terminee' ? 'Prix final' : 'Mise courante'}</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: cp, margin: 0 }}>{fmt(prixAffiche(lot))}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{lot.nbMises} mise{lot.nbMises !== 1 ? 's' : ''}{lot.meneurNom ? ` · en tête : ${lot.meneurNom}` : ''}</p>
              {lot.statut === 'active' && <div style={{ marginTop: 12 }}><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Temps restant</p>
                <span style={{ fontSize: 18, fontWeight: 800, color: t.urgent ? '#ef4444' : '#fff' }}>{t.texte}</span></div>}
              <div style={{ marginTop: 10 }}><PastilleReserve lot={lot} /></div>
            </div>
            <BoiteMise lot={lot} gid={gid} demo={moteur.demo} delta={moteur.delta} session={moteur.session} setSession={moteur.setSession} verification={moteur.verification} onChange={moteur.recharger}
              theme={{ cp, texteBouton: '#000', police }} />
            <HistoriqueMises lotId={lot.id} gid={gid} cp={cp} actif={lot.nbMises} />
          </div>
        </div>
      </div>
    </div>
  );
}

function useTimerSafe(dateFin: string, delta: number) {
  const t = useTimer(dateFin, delta);
  const texte = t.expire ? 'Terminée' : t.j > 0 ? `${t.j}j ${t.h}h ${pad(t.m)}m` : `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`;
  return { texte, urgent: !t.expire && t.j === 0 && t.h < 1 };
}

interface Props { config?: Partial<ConfigEnchereGalerie>; siteId?: number; vendeurId?: number; }

export default function TemplateEnchereGalerie({ config: configProp, vendeurId }: Props) {
  const cfg: ConfigEnchereGalerie = { ...CONFIG_ENCHERE_GALERIE_DEFAUT, ...(configProp || {}) };
  const gid = Number(vendeurId || 0);
  const cp = cfg.couleurPrincipale;
  const cs = cfg.couleurSecondaire;
  const police = cfg.police === 'classique' ? "'Playfair Display', Georgia, serif" : "'Inter', sans-serif";
  const moteur = useEncheres(gid, LOTS_DEMO);

  const [lotActif, setLotActif] = useState<number | null>(null);
  const [filtre, setFiltre] = useState('Tous');
  const [tri, setTri] = useState<'fin' | 'prix'>('fin');
  const [vue, setVue] = useState<'cours' | 'terminees'>('cours');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const termines = (l: LotPub) => l.statut === 'terminee' || l.statut === 'sans_gagnant';
  const base = moteur.lots.filter((l) => (vue === 'cours' ? !termines(l) : termines(l)));
  const categories = ['Tous', ...Array.from(new Set(base.map((l) => l.categorie).filter(Boolean)))];
  const lots = base
    .filter((l) => filtre === 'Tous' || l.categorie === filtre)
    .sort((a, b) => (tri === 'fin' ? new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime() : prixAffiche(a) - prixAffiche(b)));
  const nbTermines = moteur.lots.filter(termines).length;

  return (
    <div style={{ minHeight: '100vh', background: cs, color: '#fff', fontFamily: police }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap" />
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } img { display:block; } button { font-family:inherit; } input::placeholder{color:rgba(255,255,255,0.3)}`}</style>

      {lotActif != null && <ModalLot lotId={lotActif} moteur={moteur} gid={gid} cfg={cfg} police={police} onClose={() => setLotActif(null)} />}

      <div style={{ position: 'relative', minHeight: isMobile ? 240 : 380, backgroundImage: cfg.banniereUrl ? `url(${cfg.banniereUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${cs}cc, ${cs}ee)` }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: isMobile ? '40px 20px' : '80px 24px', textAlign: 'center' }}>
          {cfg.logoUrl && <img src={cfg.logoUrl} alt="logo" style={{ height: 56, objectFit: 'contain', margin: '0 auto 20px' }} />}
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: cp, marginBottom: 14 }}>🔨 {cfg.nomBoutique}</p>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>{cfg.nomVente}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>{cfg.descriptionVente || cfg.sloganBoutique}</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ v: 'cours' as const, l: 'En cours' }, ...(nbTermines ? [{ v: 'terminees' as const, l: `Terminées (${nbTermines})` }] : [])].map(({ v, l }) => (
              <button key={v} onClick={() => { setVue(v); setFiltre('Tous'); }} style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${vue === v ? cp : 'rgba(255,255,255,0.15)'}`, background: vue === v ? cp : 'transparent', color: vue === v ? '#000' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
            ))}
            {categories.length > 2 && categories.map((cat) => (
              <button key={cat} onClick={() => setFiltre(cat)} style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${filtre === cat ? cp : 'rgba(255,255,255,0.15)'}`, background: filtre === cat ? cp + '20' : 'transparent', color: filtre === cat ? cp : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{cat}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>Trier par :</span>
            {[{ v: 'fin' as const, l: 'Fin imminente' }, { v: 'prix' as const, l: 'Prix croissant' }].map(({ v, l }) => (
              <button key={v} onClick={() => setTri(v)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${tri === v ? cp : 'rgba(255,255,255,0.15)'}`, background: tri === v ? cp + '20' : 'transparent', color: tri === v ? cp : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}>
        {moteur.demo && <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fde047', fontSize: 13, marginBottom: 20 }}>Aperçu avec des lots d'exemple. Vos vrais lots s'afficheront ici une fois ajoutés dans « Mes enchères ».</div>}
        {moteur.loading ? <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 60 }}>Chargement…</p> : lots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', color: 'rgba(255,255,255,0.45)' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔨</div>
            <p style={{ fontSize: 16 }}>{vue === 'cours' ? 'Aucun lot en enchère pour le moment. Revenez bientôt !' : 'Aucun lot terminé.'}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>{lots.length} lot{lots.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {lots.map((lot) => <CarteLot key={lot.id} lot={lot} cp={cp} police={police} delta={moteur.delta} onClick={() => setLotActif(lot.id)} />)}
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{cfg.nomVendeur || cfg.nomBoutique}</p>
        {cfg.email && <p style={{ fontSize: 13, color: cp }}>{cfg.email}</p>}
        {cfg.telephone && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{cfg.telephone}</p>}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', marginTop: 16 }}>Propulsé par <span style={{ color: cp }}>e-Vend Studio Enchères</span></p>
      </div>
    </div>
  );
}