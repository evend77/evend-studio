// src/templates/multivendeur/MVPremiumEncheres.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Page Enchères

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = '/api';

interface Enchere {
  id: number;
  produit_id: number;
  produit_nom: string;
  produit_image: string | null;
  vendeur_nom: string;
  vendeur_id: number;
  prix_base: number;
  mise_courante: number;
  nb_mises: number;
  date_debut: string;
  date_fin: string;
  statut: 'en_cours' | 'a_venir';
  popcorn?: boolean;
  reserve_atteinte?: boolean;
}

type Tri = 'fin_proche' | 'recent' | 'mise_asc' | 'mise_desc' | 'nb_mises';
type StatutFiltre = 'tous' | 'en_cours' | 'a_venir';

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
}

const maintenant = Date.now();
const DEMO_ENCHERES: Enchere[] = [
  { id:1, produit_id:1, produit_nom:'iPhone 15 Pro Max 256Go - Etat neuf scelle', produit_image:'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80', vendeur_nom:'TechPro Montreal', vendeur_id:1, prix_base:800, mise_courante:1125, nb_mises:14, date_debut:new Date(maintenant - 3600000*5).toISOString(), date_fin:new Date(maintenant + 3600000*2).toISOString(), statut:'en_cours', popcorn:true, reserve_atteinte:true },
  { id:2, produit_id:5, produit_nom:'Guitare vintage Yamaha annees 80 collection', produit_image:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80', vendeur_nom:'Musique et Co', vendeur_id:5, prix_base:200, mise_courante:340, nb_mises:8, date_debut:new Date(maintenant - 3600000*2).toISOString(), date_fin:new Date(maintenant + 3600000*0.5).toISOString(), statut:'en_cours', popcorn:false, reserve_atteinte:false },
  { id:3, produit_id:10, produit_nom:'PlayStation 5 edition limitee scellee', produit_image:'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&q=80', vendeur_nom:'TechPro Montreal', vendeur_id:1, prix_base:400, mise_courante:0, nb_mises:0, date_debut:new Date(maintenant + 3600000*4).toISOString(), date_fin:new Date(maintenant + 86400000*2).toISOString(), statut:'a_venir', popcorn:false, reserve_atteinte:false },
  { id:4, produit_id:7, produit_nom:'Velo de montagne haut de gamme Trek', produit_image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', vendeur_nom:'Velo Aventure', vendeur_id:7, prix_base:300, mise_courante:475, nb_mises:11, date_debut:new Date(maintenant - 3600000*8).toISOString(), date_fin:new Date(maintenant + 3600000*18).toISOString(), statut:'en_cours', popcorn:true, reserve_atteinte:true },
  { id:5, produit_id:11, produit_nom:'Aspirateur robot Roomba i7+ neuf', produit_image:'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=600&q=80', vendeur_nom:'Maison Moderne', vendeur_id:8, prix_base:250, mise_courante:310, nb_mises:5, date_debut:new Date(maintenant - 3600000*1).toISOString(), date_fin:new Date(maintenant + 3600000*36).toISOString(), statut:'en_cours', popcorn:false, reserve_atteinte:false },
  { id:6, produit_id:4, produit_nom:'Sac de designer authentique collection rare', produit_image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', vendeur_nom:'Mode Elite', vendeur_id:4, prix_base:150, mise_courante:0, nb_mises:0, date_debut:new Date(maintenant + 3600000*12).toISOString(), date_fin:new Date(maintenant + 86400000*3).toISOString(), statut:'a_venir', popcorn:false, reserve_atteinte:false },
];

// ─── TIMER ────────────────────────────────────────────────────────────────────
function useTimer(dateFin: string) {
  const calc = () => {
    const diff = new Date(dateFin).getTime() - Date.now();
    if (diff <= 0) return { j: 0, h: 0, m: 0, s: 0, expire: true };
    return { j: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000), expire: false };
  };
  const [t, setT] = useState(calc());
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [dateFin]);
  return t;
}

function TimerBadge({ dateFin }: { dateFin: string }) {
  const t = useTimer(dateFin);
  if (t.expire) return <span style={{ color:'#ef4444', fontSize:11, fontWeight:700 }}>Terminee</span>;
  const urgent = t.j === 0 && t.h < 1;
  const txt = t.j > 0 ? `${t.j}j ${t.h}h ${t.m}m` : `${t.h}h ${t.m}m ${t.s}s`;
  return (
    <span style={{ fontSize:11, fontWeight:700, color: urgent ? '#ef4444' : '#f59e0b', background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', padding:'3px 8px', borderRadius:20, display:'inline-flex', alignItems:'center', gap:4 }}>
      {urgent ? '🔴' : '⏱'} {txt}
    </span>
  );
}

// ─── CARTE ENCHÈRE ────────────────────────────────────────────────────────────
function CarteEnchere({ enc, naviguer, couleurAccent }: { enc: Enchere; naviguer: (d: NavMV) => void; couleurAccent: string }) {
  const montant = enc.mise_courante > 0 ? enc.mise_courante : enc.prix_base;
  const enCours = enc.statut === 'en_cours';

  return (
    <div onClick={() => naviguer({ page: 'produit', produitId: enc.produit_id })} style={s.carte}>
      <div style={s.carteImg}>
        {enc.produit_image ? <img src={enc.produit_image} alt={enc.produit_nom} style={s.img} /> : <div style={s.imgPlaceholder}>🔨</div>}
        <div style={{ position:'absolute', top:8, left:8, display:'flex', flexDirection:'column', gap:4 }}>
          {enCours ? <span style={{ ...s.badge, background:'rgba(16,185,129,0.9)' }}>🟢 En cours</span>
                   : <span style={{ ...s.badge, background:'rgba(59,130,246,0.9)' }}>🔵 A venir</span>}
          {enc.popcorn && <span style={{ ...s.badge, background:'rgba(249,115,22,0.9)' }}>🍿 Popcorn</span>}
        </div>
        {enc.reserve_atteinte && <span style={{ ...s.badge, position:'absolute', top:8, right:8, background:'rgba(16,185,129,0.9)' }}>✅ Reserve</span>}
      </div>
      <div style={s.carteBody}>
        <p style={s.vendeurNom}>{enc.vendeur_nom}</p>
        <p style={s.produitNom}>{enc.produit_nom}</p>
        <div style={{ marginTop:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
            <div>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', display:'block' }}>
                {enc.mise_courante > 0 ? 'Mise courante' : 'Mise de depart'}
              </span>
              <span style={{ fontSize:20, fontWeight:900, color:couleurAccent }}>{montant.toFixed(2)} $</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', display:'block' }}>Mises</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{enc.nb_mises}</span>
            </div>
          </div>
          {enCours
            ? <TimerBadge dateFin={enc.date_fin} />
            : <span style={{ fontSize:11, color:'#3b82f6', background:'rgba(59,130,246,0.12)', padding:'3px 8px', borderRadius:20 }}>
                📅 Debut : {new Date(enc.date_debut).toLocaleDateString('fr-CA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
              </span>}
          <button style={{ ...s.btnMiser, background: enCours ? 'linear-gradient(135deg,#f59e0b,#ea580c)' : 'rgba(59,130,246,0.2)', color: enCours ? '#000' : '#93c5fd', border: enCours ? 'none' : '1px solid rgba(59,130,246,0.3)' }}>
            {enCours ? '🔨 Participer' : '👁 Voir enchere'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const nom = config?.nom_boutique || 'Ma Marketplace';
  return (
    <nav style={s.nav}>
      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page:'accueil' })}>
          <div style={s.logoIcon}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => naviguer({ page:'accueil' })}>Accueil</span>
          <span style={s.navLink} onClick={() => naviguer({ page:'catalogue' })}>Catalogue</span>
          <span style={s.navLink} onClick={() => naviguer({ page:'boutiques' })}>Boutiques</span>
        </div>
      </div>
    </nav>
  );
}

export default function MVPremiumEncheres({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const gId = vendeurId || config.gestionnaire_id;
  const couleurAccent = config.couleur_accent || '#fbbf24';

  const [encheres, setEncheres] = useState<Enchere[]>([]);
  const [loading, setLoading] = useState(true);
  const [statutFiltre, setStatutFiltre] = useState<StatutFiltre>('tous');
  const [filtrePopcorn, setFiltrePopcorn] = useState(false);
  const [filtreReserve, setFiltreReserve] = useState(false);
  const [tri, setTri] = useState<Tri>('fin_proche');
  const [panneauOuvert, setPanneauOuvert] = useState(false);

  useEffect(() => {
    if (isDemo) { setEncheres(DEMO_ENCHERES); setLoading(false); return; }
    fetch(`${API_BASE}/gestionnaires/${gId}/encheres`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setEncheres(Array.isArray(d) ? d : d.encheres || []))
      .catch(() => setEncheres([]))
      .finally(() => setLoading(false));
  }, [gId, isDemo]);

  let filtrees = encheres.filter(e => {
    if (statutFiltre !== 'tous' && e.statut !== statutFiltre) return false;
    if (filtrePopcorn && !e.popcorn) return false;
    if (filtreReserve && !e.reserve_atteinte) return false;
    return true;
  });
  filtrees.sort((a, b) => {
    switch (tri) {
      case 'mise_asc':  return (a.mise_courante || a.prix_base) - (b.mise_courante || b.prix_base);
      case 'mise_desc': return (b.mise_courante || b.prix_base) - (a.mise_courante || a.prix_base);
      case 'nb_mises':  return b.nb_mises - a.nb_mises;
      case 'recent':    return new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime();
      default:          return new Date(a.date_fin).getTime() - new Date(b.date_fin).getTime();
    }
  });

  const totalEnCours = encheres.filter(e => e.statut === 'en_cours').length;
  const totalAVenir = encheres.filter(e => e.statut === 'a_venir').length;

  const TRI_OPTIONS: { value: Tri; label: string }[] = [
    { value:'fin_proche', label:'Fin la plus proche' },
    { value:'recent',     label:'Recemment ajoutees' },
    { value:'mise_asc',   label:'Mise : basse → haute' },
    { value:'mise_desc',  label:'Mise : haute → basse' },
    { value:'nb_mises',   label:'Plus de mises' },
  ];

  return (
    <div style={s.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={{ ...s.heroBadge, background:`${couleurAccent}20`, color:couleurAccent, border:`1px solid ${couleurAccent}40` }}>🔨 Encheres en direct</div>
          <h1 style={s.heroTitre}>{config.encheres_hero_titre || 'Participez aux encheres'}</h1>
          <p style={s.heroDesc}>{config.encheres_hero_texte || 'Misez sur des produits uniques de nos vendeurs.'} {totalEnCours} enchere{totalEnCours !== 1 ? 's' : ''} en cours.</p>
        </div>
      </div>

      <div style={s.layout}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <p style={s.sidebarTitre}>Statut</p>
          {[
            { value:'tous' as StatutFiltre, label:'Toutes', count:encheres.length, color:'#fff' },
            { value:'en_cours' as StatutFiltre, label:'En cours', count:totalEnCours, color:'#10b981' },
            { value:'a_venir' as StatutFiltre, label:'A venir', count:totalAVenir, color:'#3b82f6' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setStatutFiltre(opt.value)}
              style={{ ...s.catBtn, ...(statutFiltre === opt.value ? { background:`${couleurAccent}15`, color:couleurAccent, borderColor:`${couleurAccent}40` } : {}) }}>
              <span>{opt.label}</span><span style={s.catCount}>{opt.count}</span>
            </button>
          ))}
          <p style={{ ...s.sidebarTitre, marginTop:20 }}>Options</p>
          <label style={{ ...s.checkLabel, background: filtrePopcorn ? 'rgba(249,115,22,0.12)' : 'transparent' }}>
            <input type="checkbox" checked={filtrePopcorn} onChange={e => setFiltrePopcorn(e.target.checked)} style={{ accentColor:'#f97316' }} />
            <span style={{ color: filtrePopcorn ? '#fb923c' : 'rgba(255,255,255,0.75)', fontSize:13 }}>🍿 Encheres Popcorn</span>
          </label>
          <label style={{ ...s.checkLabel, background: filtreReserve ? 'rgba(16,185,129,0.12)' : 'transparent' }}>
            <input type="checkbox" checked={filtreReserve} onChange={e => setFiltreReserve(e.target.checked)} style={{ accentColor:'#10b981' }} />
            <span style={{ color: filtreReserve ? '#6ee7b7' : 'rgba(255,255,255,0.75)', fontSize:13 }}>✅ Reserve atteinte</span>
          </label>
        </aside>

        {/* Contenu */}
        <main style={s.main}>
          <div style={s.toolbar}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{filtrees.length} resultat{filtrees.length !== 1 ? 's' : ''}</span>
            <div style={{ position:'relative' }}>
              <button onClick={() => setPanneauOuvert(v => !v)} style={s.btnTri}>
                Trier : {TRI_OPTIONS.find(t => t.value === tri)?.label} ▾
              </button>
              {panneauOuvert && (
                <div style={s.panneau}>
                  {TRI_OPTIONS.map(t => (
                    <div key={t.value} onClick={() => { setTri(t.value); setPanneauOuvert(false); }}
                      style={{ ...s.panneauItem, color: tri === t.value ? couleurAccent : 'rgba(255,255,255,0.8)', background: tri === t.value ? `${couleurAccent}15` : 'transparent' }}>
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div style={s.grille}>{[...Array(6)].map((_, i) => <div key={i} style={s.skeleton} />)}</div>
          ) : filtrees.length === 0 ? (
            <div style={s.vide}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔨</div>
              <p style={{ color:'rgba(255,255,255,0.5)' }}>Aucune enchere ne correspond a vos filtres</p>
            </div>
          ) : (
            <div style={s.grille}>
              {filtrees.map(e => <CarteEnchere key={e.id} enc={e} naviguer={naviguer} couleurAccent={couleurAccent} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrapper:  { minHeight:'100vh', background:'#0a0a0a', color:'#fff', fontFamily:"'DM Sans',sans-serif" },
  nav:      { position:'sticky', top:0, zIndex:100, background:'rgba(10,10,10,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth:1280, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', gap:32 },
  navLogo:  { display:'flex', alignItems:'center', gap:10, cursor:'pointer' },
  logoIcon: { width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#fbbf24,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#000' },
  logoText: { fontSize:18, fontWeight:800, color:'#fff', fontFamily:"'Syne',sans-serif" },
  navLinks: { display:'flex', gap:24 },
  navLink:  { color:'rgba(255,255,255,0.7)', fontSize:14, cursor:'pointer' },
  hero:     { padding:'48px 0 32px', textAlign:'center' },
  heroInner:{ maxWidth:700, margin:'0 auto', padding:'0 24px' },
  heroBadge:{ display:'inline-block', padding:'6px 16px', borderRadius:20, fontSize:13, fontWeight:700, marginBottom:18 },
  heroTitre:{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(26px,4vw,40px)', fontWeight:800, marginBottom:12 },
  heroDesc: { fontSize:15, color:'rgba(255,255,255,0.55)', lineHeight:1.7 },
  layout:   { maxWidth:1280, margin:'0 auto', padding:'0 24px 60px', display:'flex', gap:24, alignItems:'flex-start' },
  sidebar:  { width:220, flexShrink:0, position:'sticky', top:80, display:'flex', flexDirection:'column', gap:4 },
  sidebarTitre: { fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 8px' },
  catBtn:   { width:'100%', padding:'8px 12px', background:'transparent', border:'1px solid transparent', borderRadius:8, color:'rgba(255,255,255,0.7)', fontSize:13, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'inherit' },
  catCount: { fontSize:11, color:'rgba(255,255,255,0.35)' },
  checkLabel: { display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', marginBottom:4 },
  main:     { flex:1, minWidth:0 },
  toolbar:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, flexWrap:'wrap', gap:10 },
  btnTri:   { padding:'8px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  panneau:  { position:'absolute', top:'100%', right:0, marginTop:8, background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden', zIndex:200, minWidth:220, boxShadow:'0 16px 48px rgba(0,0,0,0.5)' },
  panneauItem: { padding:'10px 14px', cursor:'pointer', fontSize:13, fontWeight:500 },
  grille:   { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 },
  skeleton: { height:280, background:'rgba(255,255,255,0.04)', borderRadius:14 },
  vide:     { textAlign:'center', padding:'60px 20px' },
  carte:    { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column', transition:'transform 0.2s' },
  carteImg: { height:180, position:'relative', background:'rgba(255,255,255,0.05)' },
  img:      { width:'100%', height:'100%', objectFit:'cover' },
  imgPlaceholder: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, opacity:0.2 },
  badge:    { fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, color:'#fff' },
  carteBody:{ padding:14, flex:1, display:'flex', flexDirection:'column', gap:6 },
  vendeurNom: { fontSize:11, fontWeight:700, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.6px', margin:0 },
  produitNom: { fontSize:14, fontWeight:600, color:'#fff', lineHeight:1.4, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },
  btnMiser: { width:'100%', padding:'10px', borderRadius:10, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', marginTop:10 },
};