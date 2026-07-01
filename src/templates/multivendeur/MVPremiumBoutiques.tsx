// src/templates/multivendeur/MVPremiumBoutiques.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Page Boutiques

import { useState, useEffect, useRef } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = 'http://localhost:5000/api';

interface Boutique {
  id: number;
  nom_boutique: string;
  slug?: string;
  logo?: string;
  description_boutique?: string;
  points_confiance?: number;
  created_at?: string;
  nb_produits?: number;
  ville?: string;
  province?: string;
}

type Tri = 'alpha_asc' | 'alpha_desc' | 'confiance' | 'recent';

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
  boutiqueSlug?: string;
}

const DEMO_BOUTIQUES: Boutique[] = [
  { id:1, nom_boutique:'TechPro Montreal', slug:'techpro', nb_produits:48, ville:'Montreal', province:'QC', description_boutique:'Specialiste en electronique et gadgets technologiques. Produits garantis et service apres-vente.', points_confiance:98, created_at:'2022-03-15' },
  { id:2, nom_boutique:'Bureau Style QC', slug:'bureau-style', nb_produits:23, ville:'Quebec', province:'QC', description_boutique:'Mobilier et accessoires de bureau haut de gamme pour professionnels exigeants.', points_confiance:95, created_at:'2021-09-01' },
  { id:3, nom_boutique:'Sport Express', slug:'sport-express', nb_produits:67, ville:'Laval', province:'QC', description_boutique:'Equipements sportifs et vetements de marque a prix competitifs.', points_confiance:92, created_at:'2020-06-12' },
  { id:4, nom_boutique:'Mode Elite', slug:'mode-elite', nb_produits:112, ville:'Montreal', province:'QC', description_boutique:'Mode haut de gamme et accessoires de luxe pour hommes et femmes.', points_confiance:97, created_at:'2019-11-20' },
  { id:5, nom_boutique:'Musique et Co', slug:'musique-co', nb_produits:34, ville:'Sherbrooke', province:'QC', description_boutique:'Instruments de musique neufs et usages, accessoires et partitions.', points_confiance:89, created_at:'2022-01-08' },
  { id:6, nom_boutique:'Cuisine Pro MTL', slug:'cuisine-pro', nb_produits:56, ville:'Montreal', province:'QC', description_boutique:'Ustensiles et equipements de cuisine professionnels pour chefs et amateurs.', points_confiance:94, created_at:'2021-04-22' },
  { id:7, nom_boutique:'Velo Aventure', slug:'velo-aventure', nb_produits:29, ville:'Gatineau', province:'QC', description_boutique:'Velos, pieces et accessoires pour cyclistes de tous niveaux.', points_confiance:91, created_at:'2020-08-30' },
  { id:8, nom_boutique:'Maison Moderne', slug:'maison-moderne', nb_produits:83, ville:'Longueuil', province:'QC', description_boutique:'Domotique, electromenagers intelligents et decoration moderne.', points_confiance:88, created_at:'2023-02-14' },
];

function getInitiales(nom: string): string {
  return nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── CARTE BOUTIQUE ───────────────────────────────────────────────────────────
function CarteBoutique({ boutique, couleurAccent, naviguer, ouvrirBoutique }: { boutique: Boutique; couleurAccent: string; naviguer: (d: NavMV) => void; ouvrirBoutique: (id: number | string) => void }) {
  const [imgErreur, setImgErreur] = useState(false);

  return (
    <div style={s.carte}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${couleurAccent}40`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>

      {/* Logo / Initiales */}
      <div style={s.carteGauche}>
        <div style={s.logoWrap}>
          {boutique.logo && !imgErreur
            ? <img src={boutique.logo} alt={boutique.nom_boutique} onError={() => setImgErreur(true)} style={s.logoImg} />
            : <div style={{ ...s.logoInitiales, background: `linear-gradient(135deg, ${couleurAccent}44, ${couleurAccent}22)`, color: couleurAccent }}>
                {getInitiales(boutique.nom_boutique)}
              </div>
          }
        </div>

        <div style={s.carteInfo}>
          <h3 style={s.boutiqueNom}>{boutique.nom_boutique}</h3>
          <div style={s.boutiqueMeta}>
            {boutique.points_confiance != null && boutique.points_confiance > 0 && (
              <span style={s.badge}>⭐ {boutique.points_confiance} pts</span>
            )}
            {boutique.nb_produits != null && (
              <span style={s.badge}>📦 {boutique.nb_produits} produit{boutique.nb_produits !== 1 ? 's' : ''}</span>
            )}
            {(boutique.ville || boutique.province) && (
              <span style={s.badge}>📍 {[boutique.ville, boutique.province].filter(Boolean).join(', ')}</span>
            )}
          </div>
          {boutique.created_at && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              Membre depuis {new Date(boutique.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' })}
            </span>
          )}
        </div>

        <button onClick={() => ouvrirBoutique(boutique.id)}
          style={{ ...s.btnOuvrir, borderColor: `${couleurAccent}40`, color: couleurAccent }}
          onMouseEnter={e => { (e.currentTarget).style.background = couleurAccent; (e.currentTarget).style.color = '#000'; }}
          onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; (e.currentTarget).style.color = couleurAccent; }}>
          Voir la boutique →
        </button>
      </div>

      <div style={s.separateur} />

      <div style={s.carteDroite}>
        {boutique.description_boutique
          ? <p style={s.description}>{boutique.description_boutique}</p>
          : <p style={{ ...s.description, fontStyle: 'italic', color: 'rgba(255,255,255,0.25)' }}>Cette boutique n'a pas encore de description.</p>}
      </div>
    </div>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const nom = config?.nom_boutique || 'Ma Marketplace';
  return (
    <nav style={s.nav}>
      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={s.logoIcon}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => naviguer({ page: 'accueil' })}>Accueil</span>
          <span style={s.navLink} onClick={() => naviguer({ page: 'catalogue' })}>Catalogue</span>
          <span style={s.navLink} onClick={() => naviguer({ page: 'encheres' })}>Encheres</span>
        </div>
      </div>
    </nav>
  );
}

export default function MVPremiumBoutiques({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const gId = vendeurId || config.gestionnaire_id;
  const couleurAccent = config.couleur_accent || '#fbbf24';
  const ouvrirBoutique = (boutiqueId: number | string) => {
    if (isDemo) { naviguer({ page: 'boutique-page', boutiqueSlug: String(boutiqueId) }); return; }
    window.open(`/site-preview?vendeurId=${gId}&page=boutique-page&boutiqueId=${boutiqueId}`, '_blank', 'noopener,noreferrer');
  };

  const [boutiques,     setBoutiques]     = useState<Boutique[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [recherche,     setRecherche]     = useState('');
  const [rechercheInput,setRechercheInput]= useState('');
  const [tri,           setTri]           = useState<Tri>('alpha_asc');
  const [page,          setPage]          = useState(1);
  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const filtreRef = useRef<HTMLDivElement>(null);
  const PAR_PAGE = 10;

  useEffect(() => {
    if (isDemo) {
      setBoutiques(DEMO_BOUTIQUES);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAR_PAGE), tri, ...(recherche ? { q: recherche } : {}) });
    fetch(`${API_BASE}/gestionnaires/${gId}/boutiques?${params}`)
      .then(r => r.ok ? r.json() : { boutiques: [] })
      .then(d => setBoutiques(d.boutiques || d || []))
      .catch(() => setBoutiques([]))
      .finally(() => setLoading(false));
  }, [gId, page, tri, recherche, isDemo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filtreRef.current && !filtreRef.current.contains(e.target as Node)) setPanneauOuvert(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtrage + tri côté client (mode démo)
  const boutiquesFiltrees = (() => {
    let b = [...boutiques];
    if (recherche) b = b.filter(x => x.nom_boutique.toLowerCase().includes(recherche.toLowerCase()) || x.description_boutique?.toLowerCase().includes(recherche.toLowerCase()));
    b.sort((a, z) => {
      switch (tri) {
        case 'alpha_desc': return z.nom_boutique.localeCompare(a.nom_boutique, 'fr');
        case 'confiance':  return (z.points_confiance || 0) - (a.points_confiance || 0);
        case 'recent':     return new Date(z.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default:           return a.nom_boutique.localeCompare(z.nom_boutique, 'fr');
      }
    });
    return b;
  })();

  const totalPages = Math.ceil(boutiquesFiltrees.length / PAR_PAGE);
  const boutiquesPage = boutiquesFiltrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const TRI_OPTIONS: { key: Tri; label: string }[] = [
    { key: 'alpha_asc',  label: 'A → Z' },
    { key: 'alpha_desc', label: 'Z → A' },
    { key: 'confiance',  label: 'Mieux cotes' },
    { key: 'recent',     label: 'Plus recents' },
  ];

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      <main style={s.main}>
        <div style={s.inner}>
          {/* Hero */}
          <div style={{ ...s.hero, animation: 'fadeUp 0.5s ease' }}>
            <div style={{ ...s.heroBadge, background: `${couleurAccent}20`, color: couleurAccent, border: `1px solid ${couleurAccent}40` }}>
              🏪 Boutiques des vendeurs
            </div>
            <h1 style={s.heroTitre}>
              {config.boutiques_hero_titre || 'Decouvrez nos boutiques'}
            </h1>
            <p style={s.heroDesc}>
              {config.boutiques_hero_texte || 'Explorez les boutiques de nos vendeurs — artisans, collectionneurs et commercants locaux.'}
            </p>
          </div>

          {/* Toolbar */}
          <div style={s.toolbar}>
            {/* Recherche */}
            <div style={s.searchBar}>
              <input value={rechercheInput} onChange={e => setRechercheInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { setRecherche(rechercheInput.trim()); setPage(1); } }}
                placeholder="Rechercher une boutique..."
                style={s.searchInput} />
              <button onClick={() => { setRecherche(rechercheInput.trim()); setPage(1); }}
                style={{ ...s.searchBtn, background: couleurAccent, color: '#000' }}>
                🔍
              </button>
            </div>

            {/* Tri */}
            <div style={{ position: 'relative' as const }} ref={filtreRef}>
              <button onClick={() => setPanneauOuvert(v => !v)}
                style={s.btnFiltre}>
                Trier : {TRI_OPTIONS.find(t => t.key === tri)?.label} ▾
              </button>
              {panneauOuvert && (
                <div style={s.panneau}>
                  {TRI_OPTIONS.map(t => (
                    <div key={t.key} onClick={() => { setTri(t.key); setPage(1); setPanneauOuvert(false); }}
                      style={{ ...s.panneauItem, color: tri === t.key ? couleurAccent : 'rgba(255,255,255,0.8)', background: tri === t.key ? `${couleurAccent}15` : 'transparent' }}>
                      {t.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {boutiquesFiltrees.length} boutique{boutiquesFiltrees.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Liste boutiques */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <div key={i} style={s.skeleton} />)}
            </div>
          ) : boutiquesPage.length === 0 ? (
            <div style={s.vide}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucune boutique trouvee</p>
              {recherche && <button onClick={() => { setRecherche(''); setRechercheInput(''); }} style={s.btnReset}>Effacer la recherche</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {boutiquesPage.map(b => (
                <CarteBoutique key={b.id} boutique={b} couleurAccent={couleurAccent} naviguer={naviguer} ouvrirBoutique={ouvrirBoutique} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={s.pagination}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={s.pageBtn}>‹ Prec.</button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  style={{ ...s.pageBtn, background: page === i + 1 ? couleurAccent : 'rgba(255,255,255,0.05)', color: page === i + 1 ? '#000' : '#fff', fontWeight: page === i + 1 ? 800 : 400 }}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={s.pageBtn}>Suiv. ›</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page:     { minHeight: '100vh', background: '#060d1f', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  nav:      { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,13,31,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 },
  navLogo:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 },
  logoIcon: { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000' },
  logoText: { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" },
  navLinks: { display: 'flex', gap: 24 },
  navLink:  { color: 'rgba(255,255,255,0.65)', fontSize: 14, cursor: 'pointer' },
  main:     { padding: '48px 0 80px' },
  inner:    { maxWidth: 900, margin: '0 auto', padding: '0 24px' },
  hero:     { textAlign: 'center', marginBottom: 40 },
  heroBadge:{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 20 },
  heroTitre:{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, marginBottom: 14, lineHeight: 1.2 },
  heroDesc: { fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' },
  toolbar:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  searchBar:{ display: 'flex', flex: 1, minWidth: 240 },
  searchInput: { flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px 0 0 10px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  searchBtn:{ padding: '10px 16px', border: 'none', borderRadius: '0 10px 10px 0', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  btnFiltre:{ padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  panneau:  { position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#0f1c35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', zIndex: 200, minWidth: 200, boxShadow: '0 16px 48px rgba(0,0,0,0.5)' },
  panneauItem: { padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' },
  carte:    { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'flex-start', transition: 'all 0.2s', cursor: 'default' },
  carteGauche: { display: 'flex', alignItems: 'flex-start', gap: 16, flexShrink: 0, flexDirection: 'column' },
  logoWrap: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0 },
  logoImg:  { width: '100%', height: '100%', objectFit: 'cover' },
  logoInitiales: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800 },
  carteInfo:{ display: 'flex', flexDirection: 'column', gap: 6 },
  boutiqueNom: { fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 },
  boutiqueMeta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  badge:    { fontSize: 11, padding: '3px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 20, color: 'rgba(255,255,255,0.5)' },
  btnOuvrir:{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  separateur: { width: 1, background: 'rgba(255,255,255,0.07)', alignSelf: 'stretch', flexShrink: 0 },
  carteDroite: { flex: 1, minWidth: 0 },
  description: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75 },
  skeleton: { height: 130, background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.03) 75%)', borderRadius: 16, backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' },
  vide:     { textAlign: 'center', padding: '60px 20px' },
  btnReset: { marginTop: 16, padding: '8px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  pagination: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' },
  pageBtn:  { padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minWidth: 40 },
};