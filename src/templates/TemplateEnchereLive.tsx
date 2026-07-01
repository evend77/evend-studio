// src/templates/TemplateEnchereLive.tsx
// e-Vend Studio — Enchère Live — Expérience complète, style bourse / néon

import { useState, useEffect, useRef } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

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
  // Identité
  nomBoutique:       string;
  slogan:            string;
  logoUrl:           string;
  couleurPrimaire:   string;   // néon: '#6366f1'
  couleurSecondaire: string;   // '#818cf8'
  couleurFond:       string;   // '#030712'
  couleurAccent:     string;   // '#f472b6'

  // Vente
  nomVente:          string;
  descriptionVente:  string;
  incrementMin:      number;
  maxMisesSansCompte: number;  // nb mises autorisées sans compte

  // Lots
  lots:              LotLive[];

  // Contact
  email:             string;
  telephone?:        string;
  nomOrganisateur:   string;
}

const LOTS_DEFAUT: LotLive[] = [
  {
    id: 'v1', titre: 'Sneakers Nike Air Jordan 1 Retro High OG — Taille 42', description: 'Paire non portée, deadstock. Boîte originale avec tous les lacets.',
    photos: ['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800'],
    categorie: 'Sneakers', condition: 'Neuf', prixBase: 280, prixReserve: 400,
    dateFin: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: true, tags: ['Nike', 'Jordan', 'Deadstock'],
  },
  {
    id: 'v2', titre: 'Console PS5 Slim + 3 jeux — Bundle complet', description: 'PS5 Slim achetée en décembre. Jeux : Elden Ring, Astro Bot, Spider-Man 2.',
    photos: ['https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=800'],
    categorie: 'Gaming', condition: 'Excellent', prixBase: 450,
    dateFin: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: false, tags: ['Sony', 'PS5', 'Bundle'],
  },
  {
    id: 'v3', titre: 'Vélo de route Trek Domane AL 4 — 2025', description: 'Cadre aluminium, groupe Shimano 105, roues tubeless. Taille M.',
    photos: ['https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'],
    categorie: 'Sport', condition: 'Comme neuf', prixBase: 800, prixReserve: 1100,
    dateFin: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: true, tags: ['Trek', 'Vélo', 'Route'],
  },
  {
    id: 'v4', titre: 'Guitare acoustique Martin D-28 — 2019', description: 'Martin D-28 en parfait état, avec étui Hiscox. Son exceptionnel.',
    photos: ['https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=800'],
    categorie: 'Musique', condition: 'Excellent', prixBase: 1500,
    dateFin: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: false, tags: ['Martin', 'Acoustique'],
  },
  {
    id: 'v5', titre: 'Sac Hermès Birkin 30cm — Cuir Togo noir',
    description: 'Birkin 30 authenticité certifiée. Quincaillerie dorée. Livré avec boîte et dustbag.',
    photos: ['https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800'],
    categorie: 'Luxe', condition: 'Excellent', prixBase: 8500, prixReserve: 10000,
    dateFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: true, tags: ['Hermès', 'Birkin', 'Luxe'],
  },
  {
    id: 'v6', titre: 'iPhone 16 Pro Max 256Go — Naturel Titane', description: 'Vendu avec toutes les boîtes et accessoires. Apple Care+ 2 ans.',
    photos: ['https://images.pexels.com/photos/3568520/pexels-photo-3568520.jpeg?auto=compress&cs=tinysrgb&w=800'],
    categorie: 'Tech', condition: 'Comme neuf', prixBase: 950,
    dateFin: new Date(Date.now() + 30 * 60 * 1000).toISOString(), dateDebut: new Date().toISOString(), vedette: false, tags: ['Apple', 'iPhone'],
  },
];

export const CONFIG_ENCHERE_LIVE_DEFAUT: ConfigEnchereLive = {
  nomBoutique:      'LiveBid Studio',
  slogan:           'Enchérissez en temps réel — des objets triés sur le volet',
  logoUrl:          '',
  couleurPrimaire:  '#6366f1',
  couleurSecondaire:'#818cf8',
  couleurFond:      '#030712',
  couleurAccent:    '#f472b6',
  nomVente:         'Vente Live — Juin 2026',
  descriptionVente: 'Électronique, sport, mode, luxe — 6 lots d\'exception mis aux enchères simultanément.',
  incrementMin:     5,
  maxMisesSansCompte: 3,
  lots:             LOTS_DEFAUT,
  email:            'livebid@exemple.com',
  nomOrganisateur:  'L\'équipe LiveBid',
};

// ─── TIMER HOOK ───────────────────────────────────────────────────────────────
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

// ─── TICKER LIVE ──────────────────────────────────────────────────────────────
interface TickerItem { nom: string; lot: string; montant: number; }

function Ticker({ items, cp }: { items: TickerItem[]; cp: string }) {
  if (items.length === 0) return null;
  const duped = [...items, ...items, ...items];
  return (
    <div style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', height: 36, display: 'flex', alignItems: 'center' }}>
      <div style={{ flexShrink: 0, padding: '0 14px', fontSize: 11, fontWeight: 800, color: cp, background: cp + '20', height: '100%', display: 'flex', alignItems: 'center', borderRight: `1px solid ${cp}30`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        🔴 LIVE
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{ display: 'flex', gap: 40, animation: 'ticker 20s linear infinite', width: 'max-content' }}>
          {duped.map((item, i) => (
            <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
              <span style={{ color: cp, fontWeight: 700 }}>{item.nom}</span>
              {' '}a misé{' '}
              <span style={{ color: '#fff', fontWeight: 700 }}>{item.montant.toFixed(0)}$</span>
              {' '}sur{' '}
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>{item.lot}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CARD LOT COMPACT (tableau de bord) ─────────────────────────────────────
function CardLotCompact({ lot, cp, ca, incrementMin, onMiser, actif }: {
  lot: LotLive; cp: string; ca: string; incrementMin: number;
  onMiser: (lot: LotLive) => void; actif: boolean;
}) {
  const t = useTimer(lot.dateFin);
  const urgent = !t.expire && t.j === 0 && t.h < 1;
  const finBientot = !t.expire && t.j === 0 && t.h < 6;

  return (
    <div style={{
      background: actif ? `${cp}12` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${actif ? cp + '50' : urgent ? '#ef444440' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s',
      boxShadow: actif ? `0 0 20px ${cp}20` : 'none',
    }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Photo */}
        <div style={{ width: 90, flexShrink: 0, position: 'relative' }}>
          {lot.photos[0]
            ? <img src={lot.photos[0]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 90 }} />
            : <div style={{ width: '100%', minHeight: 90, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
          }
          {lot.vedette && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: cp, fontSize: 9, fontWeight: 800, color: '#fff', textAlign: 'center', padding: '2px', letterSpacing: '0.08em' }}>VEDETTE</div>
          )}
        </div>

        {/* Infos */}
        <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, color: cp, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{lot.categorie}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>{lot.titre}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 1 }}>Mise départ</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: finBientot ? '#ef4444' : cp, lineHeight: 1 }}>{lot.prixBase.toFixed(0)}$</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {t.expire ? (
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>Terminée</span>
              ) : (
                <span style={{ fontSize: 11, color: urgent ? '#ef4444' : 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
                  ⏱ {t.j > 0 ? `${t.j}j` : `${t.h}h${pad(t.m)}m`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bouton */}
      {!t.expire && (
        <button onClick={() => onMiser(lot)}
          style={{ width: '100%', padding: '9px', background: actif ? cp : 'rgba(255,255,255,0.05)', border: 'none', color: actif ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderTop: `1px solid ${actif ? cp + '30' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.2s' }}>
          {actif ? `🔨 En train d'enchérir` : 'Enchérir sur ce lot →'}
        </button>
      )}
    </div>
  );
}

// ─── PANEL MISE PRINCIPAL ─────────────────────────────────────────────────────
function PanelMise({ lot, cp, ca, incrementMin, siteId, vendeurId }: {
  lot: LotLive; cp: string; ca: string; incrementMin: number; siteId?: number; vendeurId?: number;
}) {
  const t = useTimer(lot.dateFin);
  const urgent = !t.expire && t.j === 0 && t.h < 1;

  const [mise, setMise]         = useState(lot.prixBase);
  const [nom, setNom]           = useState('');
  const [email, setEmail]       = useState('');
  const [proxy, setProxy]       = useState(false);
  const [montantProxy, setMontantProxy] = useState(lot.prixBase + incrementMin * 5);
  const [erreur, setErreur]     = useState('');
  const [succes, setSucces]     = useState('');
  const [envoi, setEnvoi]       = useState(false);
  const [nbMises, setNbMises]   = useState(0);
  const [historique, setHistorique] = useState<{ nom: string; montant: number; date: string }[]>([]);
  const [photoActive, setPhotoActive] = useState(0);

  useEffect(() => { setMise(lot.prixBase + incrementMin); setPhotoActive(0); }, [lot.id]);

  const placerMise = async () => {
    if (!nom.trim()) { setErreur('Entrez votre prénom.'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setErreur('Courriel invalide.'); return; }
    if (mise < lot.prixBase + incrementMin) { setErreur(`Minimum : ${(lot.prixBase + incrementMin).toFixed(2)} $`); return; }
    setEnvoi(true); setErreur(''); setSucces('');
    try {
      if (siteId) {
        const res = await fetch('/api/encheres-studio/miser', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site_id: siteId, vendeur_id: vendeurId, lot_id: lot.id, montant: mise, montant_proxy: proxy ? montantProxy : null, nom_encherisseur: nom, email_encherisseur: email }),
        });
        const d = await res.json();
        if (!res.ok) { setErreur(d.message || 'Erreur.'); return; }
      }
      setHistorique(prev => [{ nom, montant: mise, date: new Date().toISOString() }, ...prev]);
      setNbMises(n => n + 1);
      setSucces(`🎯 Vous êtes maintenant le plus haut enchérisseur à ${mise.toFixed(2)} $!`);
      setMise(prev => prev + incrementMin);
    } catch { setErreur('Erreur réseau.'); }
    finally { setEnvoi(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* Photo + titre */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>
        {lot.photos[photoActive] && <img src={lot.photos[photoActive]} alt={lot.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,7,18,0.9) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cp, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lot.categorie}</span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.25, margin: '4px 0 0' }}>{lot.titre}</h2>
        </div>
        {urgent && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20, animation: 'pulse 1s ease-in-out infinite' }}>
            ⚡ FIN IMMINENTE
          </div>
        )}
      </div>

      {/* Mini galerie */}
      {lot.photos.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
          {lot.photos.map((ph, i) => (
            <div key={i} onClick={() => setPhotoActive(i)} style={{ width: 48, height: 36, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === photoActive ? cp : 'transparent'}`, flexShrink: 0 }}>
              <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 0' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${cp}20` }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Mise courante</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: cp, lineHeight: 1 }}>{(lot.prixBase + nbMises * incrementMin).toFixed(0)}$</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{nbMises} mise{nbMises !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ background: urgent ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', border: `1px solid ${urgent ? '#ef444440' : 'rgba(255,255,255,0.07)'}` }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Temps restant</p>
          {t.expire ? (
            <p style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}>Terminée</p>
          ) : (
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

      {/* Formulaire */}
      {!t.expire ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {succes && <div style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '10px 12px', color: '#4ade80', fontSize: 13, fontWeight: 600 }}>{succes}</div>}
          {erreur && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 12px', color: '#f87171', fontSize: 13 }}>{erreur}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <input style={inp} placeholder="Prénom / surnom" value={nom} onChange={e => setNom(e.target.value)} />
            <input style={inp} type="email" placeholder="Courriel" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {/* Mises rapides */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 5, 10].map(mult => {
              const val = lot.prixBase + incrementMin * mult;
              return (
                <button key={mult} onClick={() => setMise(val)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${mise === val ? cp : 'rgba(255,255,255,0.12)'}`, background: mise === val ? `${cp}25` : 'rgba(255,255,255,0.04)', color: mise === val ? cp : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {val}$
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>$</span>
              <input type="number" style={{ ...inp, paddingLeft: 28 }} min={lot.prixBase + incrementMin} step={incrementMin} value={mise} onChange={e => setMise(parseFloat(e.target.value) || 0)} />
            </div>
            <button onClick={placerMise} disabled={envoi}
              style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${cp}, ${ca})`, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', opacity: envoi ? 0.7 : 1, boxShadow: `0 4px 16px ${cp}40` }}>
              {envoi ? '⏳' : '🔨 Miser'}
            </button>
          </div>

          {/* Proxy bid */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div onClick={() => setProxy(!proxy)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: proxy ? 10 : 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${proxy ? cp : 'rgba(255,255,255,0.25)'}`, background: proxy ? cp + '30' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {proxy && <span style={{ color: cp, fontSize: 11, fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>🤖 Mise proxy automatique</span>
            </div>
            {proxy && (
              <div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Le système misera pour vous automatiquement jusqu'à ce montant max :</p>
                <input type="number" style={inp} min={mise + incrementMin} step={incrementMin} value={montantProxy} onChange={e => setMontantProxy(parseFloat(e.target.value) || 0)} placeholder="Montant maximum proxy" />
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>🔒 Mise min : {(lot.prixBase + incrementMin).toFixed(2)} $ · Incrément : {incrementMin} $</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>🏆</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Cette enchère est terminée.</p>
        </div>
      )}

      {/* Historique */}
      {historique.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, marginTop: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Historique de cette session</p>
          {historique.slice(0, 4).map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
              <span style={{ color: i === 0 ? cp : 'rgba(255,255,255,0.4)' }}>{h.nom}</span>
              <span style={{ color: i === 0 ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: i === 0 ? 800 : 400 }}>{h.montant.toFixed(0)} $</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props { config?: Partial<ConfigEnchereLive>; siteId?: number; vendeurId?: number; }

export default function TemplateEnchereLive({ config: configProp, siteId, vendeurId }: Props) {
  const config = { ...CONFIG_ENCHERE_LIVE_DEFAUT, ...configProp };
  const cp = config.couleurPrimaire;
  const ca = config.couleurAccent;
  const cf = config.couleurFond;

  const [lotActif, setLotActif]   = useState<LotLive>(config.lots[0]);
  const [isMobile, setIsMobile]   = useState(false);
  const [tickerItems]             = useState<TickerItem[]>([
    { nom: 'MaxB', lot: config.lots[0]?.titre || '', montant: config.lots[0]?.prixBase + 15 || 15 },
    { nom: 'Julie22', lot: config.lots[2]?.titre || '', montant: config.lots[2]?.prixBase + 50 || 50 },
    { nom: 'TechFan', lot: config.lots[1]?.titre || '', montant: config.lots[1]?.prixBase + 25 || 25 },
    { nom: 'Collector99', lot: config.lots[4]?.titre || '', montant: config.lots[4]?.prixBase + 200 || 200 },
  ]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const lots = config.lots;

  return (
    <div style={{ minHeight: '100vh', background: cf, color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" />
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        img { display:block; }
        button { font-family:inherit; cursor:pointer; }
        input { font-family:inherit; }
        input::placeholder { color:rgba(255,255,255,0.25); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-33.33%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${cp}44; border-radius:4px; }
        .lot-card:hover { border-color: ${cp}60 !important; }
      `}</style>

      {/* NAV */}
      <nav style={{ height: 58, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(3,7,18,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {config.logoUrl
            ? <img src={config.logoUrl} alt="logo" style={{ height: 28, objectFit: 'contain' }} />
            : <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${cp}, ${ca})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>🔨</div>
          }
          <span style={{ fontWeight: 800, fontSize: 16 }}>{config.nomBoutique}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>· {lots.length} lots</span>
        </div>
      </nav>

      {/* TICKER */}
      <Ticker items={tickerItems} cp={cp} />

      {/* LAYOUT PRINCIPAL */}
      {isMobile ? (
        // Mobile : liste déroulante verticale
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {lots.map(lot => (
              <div key={lot.id} className="lot-card" onClick={() => setLotActif(lot)}
                style={{ border: `1px solid ${lot.id === lotActif.id ? cp + '50' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: lot.id === lotActif.id ? `${cp}08` : 'rgba(255,255,255,0.02)' }}>
                <CardLotCompact lot={lot} cp={cp} ca={ca} incrementMin={config.incrementMin} onMiser={setLotActif} actif={lot.id === lotActif.id} />
              </div>
            ))}
          </div>
          {lotActif && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cp}30`, borderRadius: 16, padding: 16 }}>
              <PanelMise lot={lotActif} cp={cp} ca={ca} incrementMin={config.incrementMin} siteId={siteId} vendeurId={vendeurId} />
            </div>
          )}
        </div>
      ) : (
        // Desktop : layout 2 colonnes
        <div style={{ display: 'flex', height: 'calc(100vh - 94px)', overflow: 'hidden' }}>

          {/* Sidebar lots */}
          <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 4px', marginBottom: 4 }}>
              {lots.length} lots — Sélectionnez pour enchérir
            </p>
            {lots.map(lot => (
              <div key={lot.id} className="lot-card" style={{ transition: 'border-color 0.2s' }}>
                <CardLotCompact lot={lot} cp={cp} ca={ca} incrementMin={config.incrementMin} onMiser={setLotActif} actif={lot.id === lotActif.id} />
              </div>
            ))}
          </div>

          {/* Panel mise principal */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {lotActif
              ? <PanelMise key={lotActif.id} lot={lotActif} cp={cp} ca={ca} incrementMin={config.incrementMin} siteId={siteId} vendeurId={vendeurId} />
              : <div style={{ textAlign: 'center', marginTop: 80, color: 'rgba(255,255,255,0.3)' }}>
                  <p style={{ fontSize: 48, marginBottom: 12 }}>🔨</p>
                  <p>Sélectionnez un lot pour enchérir</p>
                </div>
            }
          </div>
        </div>
      )}
    </div>
  );
}