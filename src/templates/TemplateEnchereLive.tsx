// src/templates/TemplateEnchereLive.tsx
// e-Vend Studio — Enchère Live — style bourse / néon (VRAIES enchères, fil d'activité réel)
// Les lots viennent de « Mes enchères » (API /api/encheres-studio). L'apparence vient de config.enchere.

import { useState, useEffect } from 'react';
import { useEncheres, useTimer, BoiteMise, PastilleReserve, HistoriqueMises, fmt, pad, prixAffiche, type LotPub, type MiseTicker } from './enchereSite/moteur';

// Ancien format de lot, gardé pour l'éditeur de configuration (src/pages/studio/ConfigTemplateEnchereLive.tsx).
// Les vrais lots viennent de « Mes enchères » (LotPub) ; ces champs ne servent plus à l'affichage du site.
export interface LotLive {
  id:          string;
  titre:       string;
  description: string;
  photos:      string[];
  categorie:   string;
  condition:   string;
  prixBase:    number;
  prixReserve?: number;
  dateFin:     string;
  dateDebut:   string;
  vedette:     boolean;
  tags:        string[];
}

export interface ConfigEnchereLive {
  nomBoutique:       string;
  slogan:            string;
  logoUrl:           string;
  couleurPrimaire:   string;
  couleurSecondaire: string;
  couleurFond:       string;
  couleurAccent:     string;
  nomVente:          string;
  descriptionVente:  string;
  incrementMin:      number;
  maxMisesSansCompte: number;
  lots:              LotLive[];
  email:             string;
  telephone?:        string;
  nomOrganisateur:   string;
}

export const CONFIG_ENCHERE_LIVE_DEFAUT: ConfigEnchereLive = {
  nomBoutique:      'LiveBid Studio',
  slogan:           'Enchérissez en temps réel — des objets triés sur le volet',
  logoUrl:          '',
  couleurPrimaire:  '#6366f1',
  couleurSecondaire:'#818cf8',
  couleurFond:      '#030712',
  couleurAccent:    '#f472b6',
  nomVente:         'Vente Live',
  descriptionVente: 'Électronique, sport, mode, luxe — des lots mis aux enchères en direct.',
  incrementMin:     5,
  maxMisesSansCompte: 3,
  lots:             [],
  email:            '',
  nomOrganisateur:  '',
};

const heures = (h: number) => new Date(Date.now() + h * 3600000).toISOString();
const demoLot = (id: number, titre: string, description: string, photo: string, categorie: string, condition: string, prixBase: number, h: number, vedette: boolean, tags: string[]): LotPub => ({
  id, titre, description, photos: [photo], categorie, condition, tags, vedette, prixBase, prixActuel: null, increment: prixBase < 100 ? 5 : prixBase < 500 ? 10 : 25, nbMises: 0,
  dateDebut: new Date().toISOString(), dateFin: heures(h), statut: 'active', aReserve: false, reserveAtteinte: null, meneurNom: null,
});
const LOTS_DEMO: LotPub[] = [
  demoLot(1, 'Sneakers Nike Air Jordan 1 Retro High OG — Taille 42', 'Paire non portée, deadstock. Boîte originale avec tous les lacets.', 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800', 'Sneakers', 'Neuf', 280, 4, true, ['Nike', 'Jordan']),
  demoLot(2, 'Console PS5 Slim + 3 jeux — Bundle complet', 'PS5 Slim achetée en décembre. Jeux : Elden Ring, Astro Bot, Spider-Man 2.', 'https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=800', 'Gaming', 'Excellent', 450, 22, false, ['Sony', 'PS5']),
  demoLot(3, 'Vélo de route Trek Domane AL 4 — 2025', 'Cadre aluminium, groupe Shimano 105, roues tubeless. Taille M.', 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800', 'Sport', 'Comme neuf', 800, 48, true, ['Trek', 'Route']),
  demoLot(4, 'iPhone 16 Pro Max 256Go — Naturel Titane', 'Vendu avec toutes les boîtes et accessoires. Apple Care+ 2 ans.', 'https://images.pexels.com/photos/3568520/pexels-photo-3568520.jpeg?auto=compress&cs=tinysrgb&w=800', 'Tech', 'Comme neuf', 950, 0.5, false, ['Apple']),
];

function Ticker({ items, cp }: { items: MiseTicker[]; cp: string }) {
  if (items.length === 0) return null;
  const duped = [...items, ...items, ...items];
  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', height: 36, display: 'flex', alignItems: 'center' }}>
      <div style={{ flexShrink: 0, padding: '0 14px', fontSize: 11, fontWeight: 800, color: cp, background: cp + '20', height: '100%', display: 'flex', alignItems: 'center', borderRight: `1px solid ${cp}30`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>🔴 LIVE</div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{ display: 'flex', gap: 40, animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {duped.map((item, i) => (
            <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
              <span style={{ color: cp, fontWeight: 700 }}>{item.nom}</span> a misé <span style={{ color: '#fff', fontWeight: 700 }}>{Math.round(item.montant)}$</span> sur <span style={{ color: 'rgba(255,255,255,0.45)' }}>{item.lot}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardLotCompact({ lot, cp, delta, onMiser, actif }: { lot: LotPub; cp: string; delta: number; onMiser: (id: number) => void; actif: boolean }) {
  const t = useTimer(lot.dateFin, delta);
  const finie = lot.statut === 'terminee' || lot.statut === 'sans_gagnant' || (lot.statut === 'active' && t.expire);
  const urgent = !finie && !t.expire && t.j === 0 && t.h < 1;
  return (
    <div onClick={() => onMiser(lot.id)} style={{ cursor: 'pointer', background: actif ? `${cp}12` : 'rgba(255,255,255,0.02)', border: `1px solid ${actif ? cp + '50' : urgent ? '#ef444440' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s', boxShadow: actif ? `0 0 20px ${cp}20` : 'none', opacity: finie ? 0.65 : 1 }}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 90, flexShrink: 0, position: 'relative' }}>
          {lot.photos[0] ? <img src={lot.photos[0]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 90 }} /> : <div style={{ width: '100%', minHeight: 90, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>}
          {lot.vedette && !finie && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: cp, fontSize: 9, fontWeight: 800, color: '#fff', textAlign: 'center', padding: 2, letterSpacing: '0.08em' }}>VEDETTE</div>}
        </div>
        <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <p style={{ fontSize: 10, color: cp, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{lot.categorie}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>{lot.titre}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 1 }}>{lot.nbMises > 0 ? `${lot.nbMises} mise${lot.nbMises > 1 ? 's' : ''}` : 'Mise départ'}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: urgent ? '#ef4444' : cp, lineHeight: 1 }}>{Math.round(prixAffiche(lot))}$</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {lot.statut === 'terminee' ? <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 800 }}>VENDU</span>
                : finie ? <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>Terminée</span>
                : lot.statut === 'a_venir' ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>À venir</span>
                : <span style={{ fontSize: 11, color: urgent ? '#ef4444' : 'rgba(255,255,255,0.45)', fontWeight: 700 }}>⏱ {t.j > 0 ? `${t.j}j ${t.h}h` : `${t.h}h${pad(t.m)}m`}</span>}
              {lot.estMeneur && lot.statut === 'active' && <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 800, marginTop: 2 }}>EN TÊTE</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type Moteur = ReturnType<typeof useEncheres>;

function Panneau({ lot, moteur, gid, cp, ca }: { lot: LotPub; moteur: Moteur; gid: number; cp: string; ca: string }) {
  const t = useTimer(lot.dateFin, moteur.delta);
  const urgent = lot.statut === 'active' && !t.expire && t.j === 0 && t.h < 1;
  const [photo, setPhoto] = useState(0);
  useEffect(() => setPhoto(0), [lot.id]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>
        {lot.photos[photo] && <img src={lot.photos[photo]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,7,18,0.9) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cp, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lot.categorie}</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: '4px 0 0' }}>{lot.titre}</h2>
        </div>
        {urgent && <div style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, animation: 'pulse 1s ease-in-out infinite' }}>⚡ FIN IMMINENTE</div>}
      </div>
      {lot.photos.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
          {lot.photos.map((ph, i) => (
            <div key={i} onClick={() => setPhoto(i)} style={{ width: 48, height: 36, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === photo ? cp : 'transparent'}`, flexShrink: 0 }}><img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          ))}
        </div>
      )}
      {lot.description && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, padding: '10px 0', whiteSpace: 'pre-wrap' }}>{lot.description}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '6px 0 12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${cp}20` }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{lot.statut === 'terminee' ? 'Prix final' : lot.nbMises ? 'Mise courante' : 'Départ'}</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: cp, lineHeight: 1 }}>{fmt(prixAffiche(lot))}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{lot.nbMises} mise{lot.nbMises !== 1 ? 's' : ''}{lot.meneurNom ? ` · ${lot.meneurNom}` : ''}</p>
          <div style={{ marginTop: 4 }}><PastilleReserve lot={lot} /></div>
        </div>
        <div style={{ background: urgent ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${urgent ? '#ef444440' : 'rgba(255,255,255,0.07)'}` }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Temps restant</p>
          {lot.statut !== 'active' || t.expire ? <p style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}>{lot.statut === 'a_venir' ? 'À venir' : 'Terminée'}</p> : (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(t.j > 0 ? [{ v: t.j, u: 'j' }, { v: t.h, u: 'h' }] : [{ v: t.h, u: 'h' }, { v: t.m, u: 'm' }, { v: t.s, u: 's' }]).map(({ v, u }) => (
                <div key={u} style={{ background: urgent ? 'rgba(239,68,68,0.2)' : `${cp}20`, borderRadius: 6, padding: '4px 6px', minWidth: 30, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: urgent ? '#ef4444' : '#fff', lineHeight: 1 }}>{pad(v)}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{u}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BoiteMise lot={lot} gid={gid} demo={moteur.demo} delta={moteur.delta} session={moteur.session} setSession={moteur.setSession} verification={moteur.verification} onChange={moteur.recharger}
        theme={{ cp, ca, texteBouton: '#fff', police: "'Inter', sans-serif", rapides: true }} />
      <HistoriqueMises lotId={lot.id} gid={gid} cp={cp} actif={lot.nbMises} />
    </div>
  );
}

interface Props { config?: Partial<ConfigEnchereLive>; siteId?: number; vendeurId?: number; }

export default function TemplateEnchereLive({ config: configProp, vendeurId }: Props) {
  const cfg: ConfigEnchereLive = { ...CONFIG_ENCHERE_LIVE_DEFAUT, ...(configProp || {}) };
  const gid = Number(vendeurId || 0);
  const cp = cfg.couleurPrimaire;
  const ca = cfg.couleurAccent;
  const cf = cfg.couleurFond;
  const moteur = useEncheres(gid, LOTS_DEMO);
  const [choisi, setChoisi] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const actifs = moteur.lots.filter((l) => l.statut === 'active' || l.statut === 'a_venir');
  const termines = moteur.lots.filter((l) => l.statut === 'terminee' || l.statut === 'sans_gagnant');
  const lots = [...actifs.sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime()), ...termines];
  const lotActif = lots.find((l) => l.id === choisi) || lots[0] || null;

  const liste = (
    <>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 4px', marginBottom: 4 }}>{actifs.length} lot{actifs.length !== 1 ? 's' : ''} en cours{termines.length ? ` · ${termines.length} terminé${termines.length > 1 ? 's' : ''}` : ''}</p>
      {lots.map((lot) => <CardLotCompact key={lot.id} lot={lot} cp={cp} delta={moteur.delta} onMiser={setChoisi} actif={!!lotActif && lot.id === lotActif.id} />)}
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: cf, color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" />
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; } img { display:block; } button { font-family:inherit; } input { font-family:inherit; }
        input::placeholder { color:rgba(255,255,255,0.25); } input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-33.33%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${cp}44; border-radius:4px; }
      `}</style>

      <nav style={{ height: 58, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.95)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {cfg.logoUrl ? <img src={cfg.logoUrl} alt="logo" style={{ height: 28, objectFit: 'contain' }} /> : <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${cp}, ${ca})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔨</div>}
          <span style={{ fontWeight: 800, fontSize: 16 }}>{cfg.nomBoutique}</span>
          {!isMobile && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{cfg.nomVente}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>· {actifs.length} lots</span>
        </div>
      </nav>

      <Ticker items={moteur.ticker} cp={cp} />

      {moteur.demo && <div style={{ background: 'rgba(250,204,21,0.1)', borderBottom: '1px solid rgba(250,204,21,0.3)', padding: '8px 20px', color: '#fde047', fontSize: 12 }}>Aperçu avec des lots d'exemple. Vos vrais lots s'afficheront ici une fois ajoutés dans « Mes enchères ».</div>}

      {moteur.loading ? <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 80 }}>Chargement…</p> : !lotActif ? (
        <div style={{ textAlign: 'center', padding: '90px 20px', color: 'rgba(255,255,255,0.45)' }}><div style={{ fontSize: 48, marginBottom: 12 }}>🔨</div><p>Aucun lot pour le moment. Revenez bientôt !</p></div>
      ) : isMobile ? (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>{liste}</div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cp}30`, borderRadius: 16, padding: 16 }}>
            <Panneau key={lotActif.id} lot={lotActif} moteur={moteur} gid={gid} cp={cp} ca={ca} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', height: 'calc(100vh - 94px)', overflow: 'hidden' }}>
          <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>{liste}</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxWidth: 760 }}>
            <Panneau key={lotActif.id} lot={lotActif} moteur={moteur} gid={gid} cp={cp} ca={ca} />
          </div>
        </div>
      )}

      {(cfg.email || cfg.nomOrganisateur) && <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px 20px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{cfg.nomOrganisateur} {cfg.email && <>· <span style={{ color: cp }}>{cfg.email}</span></>}</div>}
    </div>
  );
}