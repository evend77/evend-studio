// src/templates/multivendeur/MVPremiumCatalogue.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Catalogue

import { useState, useEffect, useCallback, useRef } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = 'http://localhost:5000/api';

const DEMO_PRODUITS_CAT = [
  { id:1, nom:'iPhone 15 Pro Max 256Go', prix:1449.99, prix_original:1599.99, stock:8, categorie_nom:'Électronique', nom_boutique:'TechPro Montréal', vendeur_id:1, image:'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80', created_at:new Date().toISOString() },
  { id:2, nom:'Chaise ergonomique Herman Miller', prix:899.00, stock:3, categorie_nom:'Meubles', nom_boutique:'Bureau Style QC', vendeur_id:2, image:'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80', created_at:new Date().toISOString() },
  { id:3, nom:'Nike Air Max 270 — Blanc / Noir', prix:189.99, prix_original:229.99, stock:15, categorie_nom:'Chaussures', nom_boutique:'Sport Express', vendeur_id:3, image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', created_at:new Date().toISOString() },
  { id:4, nom:'Sac cuir véritable — Collection Automne', prix:345.00, stock:5, categorie_nom:'Accessoires', nom_boutique:'Mode Élite', vendeur_id:4, image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', created_at:new Date().toISOString() },
  { id:5, nom:'Guitare acoustique Yamaha FG800', prix:399.99, stock:2, categorie_nom:'Instruments', nom_boutique:'Musique & Co', vendeur_id:5, image:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80', created_at:new Date().toISOString() },
  { id:6, nom:'Set couteaux japonais — 5 pièces', prix:279.00, prix_original:349.00, stock:12, categorie_nom:'Cuisine', nom_boutique:'Cuisine Pro MTL', vendeur_id:6, image:'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&q=80', created_at:new Date().toISOString() },
  { id:7, nom:'Vélo de montagne Trek Marlin 5 — 2024', prix:799.99, stock:4, categorie_nom:'Sport', nom_boutique:'Vélo Aventure', vendeur_id:7, image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', created_at:new Date().toISOString() },
  { id:8, nom:'Samsung Galaxy Watch 6 — Noir', prix:429.00, stock:9, categorie_nom:'Électronique', nom_boutique:'TechPro Montréal', vendeur_id:1, image:'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80', created_at:new Date().toISOString() },
  { id:9, nom:'Manteau hiver North Face — Homme L', prix:499.00, prix_original:599.00, stock:6, categorie_nom:'Vêtements', nom_boutique:'Sport Express', vendeur_id:3, image:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=80', created_at:new Date().toISOString() },
  { id:10, nom:'PlayStation 5 — Bundle avec 2 manettes', prix:649.99, stock:1, categorie_nom:'Jeux vidéo', nom_boutique:'TechPro Montréal', vendeur_id:1, image:'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600&q=80', created_at:new Date().toISOString() },
  { id:11, nom:'Aspirateur robot Roomba i7+', prix:799.00, prix_original:999.00, stock:7, categorie_nom:'Électronique', nom_boutique:'Maison Moderne', vendeur_id:8, image:'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=600&q=80', created_at:new Date().toISOString() },
  { id:12, nom:'Table basse scandinave en chêne', prix:449.00, stock:3, categorie_nom:'Meubles', nom_boutique:'Bureau Style QC', vendeur_id:2, image:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', created_at:new Date().toISOString() },
];


interface Produit {
  id: number;
  nom: string;
  prix: number;
  prix_original?: number;
  image?: string;
  images?: string;
  stock: number;
  vendeur_id?: number;
  nom_boutique?: string;
  vendeur_nom?: string;
  vendeur_ville?: string;
  categorie_nom?: string;
  categorie?: string;
  type_vente?: string;
  etat?: string;
  vues?: number;
  enchere_statut?: string;
  enchere_mise?: number;
  enchere_prix_base?: number;
  created_at?: string;
  statut?: string;
}

interface Categorie {
  id: number;
  nom: string;
  nb_produits?: number;
}

type Tri = 'recent' | 'prix_asc' | 'prix_desc' | 'alpha_az' | 'alpha_za';

const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: 'recent',    label: 'Plus récent' },
  { value: 'prix_asc',  label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix décroissant' },
  { value: 'alpha_az',  label: 'A → Z' },
  { value: 'alpha_za',  label: 'Z → A' },
];

const GROUPES_EMOJIS: Record<string, string> = {
  'Accessoires et bijoux': '💍', 'Aliments': '🍎', 'Animaux / Accessoires animaux': '🐾',
  'Antiquites': '🏺', 'Artisanat / Art': '🎨', 'Automobile / Machinerie': '🚗',
  'Bureau / Papeterie': '📎', 'Collection': '🏆', 'Cours et jardins': '🌿',
  'Decoration / Maison': '🏠', 'Electronique': '📱', 'Instruments de musique': '🎸',
  'Jeux et jouets': '🧸', 'Jeux video / Consoles': '🎮', 'Livres': '📚',
  'Meubles': '🛋️', 'Outils': '🔧', 'Sport et plein air': '⚽',
  'Vetements / Chaussures et accessoires': '👕', 'Autres / Divers / Produits numeriques': '📦',
};

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
  categorieSlug?: string;
}

function getImage(p: Produit): string | null {
  if (p.image) return p.image;
  if (p.images) {
    try {
      const arr = JSON.parse(p.images);
      if (Array.isArray(arr) && arr.length > 0) return arr[0];
    } catch { return p.images; }
  }
  return null;
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ naviguer, config, recherche, setRecherche, onRecherche }: any) {
  const nom = config?.nom_boutique || 'Ma Marketplace';
  return (
    <nav style={s.nav}>
      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={s.logoIcon}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>
        <div style={s.searchBar}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onRecherche()}
            placeholder="Rechercher dans le catalogue..."
            style={s.searchInput} />
          <button onClick={onRecherche} style={s.searchBtn}>🔍</button>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => naviguer({ page: 'accueil' })}>Accueil</span>
          <span style={s.navLink} onClick={() => naviguer({ page: 'boutiques' })}>Boutiques</span>
          <span style={s.navLink} onClick={() => naviguer({ page: 'encheres' })}>Enchères</span>
        </div>
      </div>
    </nav>
  );
}

export default function MVPremiumCatalogue({ vendeurId, isDemo, config = {}, naviguer, categorieSlug }: Props) {
  const gId = vendeurId || config.gestionnaire_id;
  const ouvrirBoutique = (boutiqueId: number | string) => {
    if (isDemo) { naviguer({ page: 'boutique-page', boutiqueSlug: String(boutiqueId) }); return; }
    window.open(`/site-preview?vendeurId=${gId}&page=boutique-page&boutiqueId=${boutiqueId}`, '_blank', 'noopener,noreferrer');
  };
  const couleurAccent = config.couleur_accent || '#fbbf24';

  const [produits,       setProduits]       = useState<Produit[]>([]);
  const [categories,     setCategories]     = useState<Categorie[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [recherche,      setRecherche]      = useState(categorieSlug || '');
  const [rechercheActif, setRechercheActif] = useState(categorieSlug || '');
  const [categorieActive, setCategorieActive] = useState<number | null>(null);
  const [groupesOuverts, setGroupesOuverts] = useState<Set<string>>(new Set());
  const [tri,            setTri]            = useState<Tri>('recent');
  const [prixMin,        setPrixMin]        = useState('');
  const [prixMax,        setPrixMax]        = useState('');
  const [filtreEnStock,  setFiltreEnStock]  = useState(false);
  const [filtreOuvert,   setFiltreOuvert]   = useState(false);
  const [page,           setPage]           = useState(1);
  const [drawerOuvert,   setDrawerOuvert]   = useState(false);
  const panneauRef = useRef<HTMLDivElement>(null);
  const LIMIT = 48;

  // Fetch produits
  const fetchProduits = useCallback(async () => {
    if (isDemo) {
      setProduits(DEMO_PRODUITS_CAT as any);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (rechercheActif) params.set('q', rechercheActif);
      if (categorieActive) params.set('categorie_id', categorieActive.toString());

      const res = await fetch(`${API_BASE}/produits/gestionnaire/${gId}?${params}`);
      const data = res.ok ? await res.json() : [];
      setProduits(Array.isArray(data) ? data.filter((p: Produit) => p.statut === 'actif' || !p.statut) : []);
    } catch { setProduits([]); }
    finally { setLoading(false); }
  }, [gId, rechercheActif, categorieActive, isDemo]);

  // Fetch catégories
  useEffect(() => {
    fetch(`${API_BASE}/gestionnaires/${gId}/categories`)
      .then(r => r.ok ? r.json() : { categories: [] })
      .then(d => setCategories(d.categories || d || []))
      .catch(() => {});
  }, [gId]);

  useEffect(() => { fetchProduits(); }, [fetchProduits]);

  // Fermer panneau filtres au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panneauRef.current && !panneauRef.current.contains(e.target as Node))
        setFiltreOuvert(false);
    };
    if (filtreOuvert) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filtreOuvert]);

  // Filtres + tri côté client
  const produitsFiltres = (() => {
    let result = [...produits];
    if (prixMin !== '') result = result.filter(p => parseFloat(String(p.prix)) >= parseFloat(prixMin));
    if (prixMax !== '') result = result.filter(p => parseFloat(String(p.prix)) <= parseFloat(prixMax));
    if (filtreEnStock) result = result.filter(p => p.stock > 0);
    result.sort((a, b) => {
      switch (tri) {
        case 'prix_asc':  return parseFloat(String(a.prix)) - parseFloat(String(b.prix));
        case 'prix_desc': return parseFloat(String(b.prix)) - parseFloat(String(a.prix));
        case 'alpha_az':  return a.nom.localeCompare(b.nom, 'fr');
        case 'alpha_za':  return b.nom.localeCompare(a.nom, 'fr');
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });
    return result;
  })();

  const totalPages = Math.ceil(produitsFiltres.length / LIMIT);
  const produitsDeLaPage = produitsFiltres.slice((page - 1) * LIMIT, page * LIMIT);
  const nbFiltresActifs = [prixMin !== '', prixMax !== '', filtreEnStock, tri !== 'recent'].filter(Boolean).length;

  // Groupes pour la sidebar
  const groupesDeCats = (() => {
    const groupes: Record<string, Categorie[]> = {};
    categories.forEach(c => {
      const groupe = c.nom.includes('/') ? c.nom.split('/')[0].trim() : 'Autres';
      if (!groupes[groupe]) groupes[groupe] = [];
      groupes[groupe].push(c);
    });
    return groupes;
  })();

  const reinitialiser = () => {
    setTri('recent'); setPrixMin(''); setPrixMax('');
    setFiltreEnStock(false); setCategorieActive(null); setRechercheActif(''); setRecherche('');
    setPage(1);
  };

  const lancer = () => { setRechercheActif(recherche); setPage(1); };

  // ── SIDEBAR ──
  const Sidebar = () => (
    <div style={s.sidebar}>
      <p style={s.sidebarTitre}>Catégories</p>
      <button onClick={() => { setCategorieActive(null); setPage(1); }}
        style={{ ...s.catBtn, ...(categorieActive === null ? { background: `${couleurAccent}20`, color: couleurAccent, borderColor: `${couleurAccent}40` } : {}) }}>
        <span>Tout le catalogue</span>
        <span style={s.catCount}>{produits.length}</span>
      </button>

      {categories.length > 0
        ? categories.map(cat => (
            <button key={cat.id} onClick={() => { setCategorieActive(cat.id); setPage(1); }}
              style={{ ...s.catBtn, ...(categorieActive === cat.id ? { background: `${couleurAccent}20`, color: couleurAccent, borderColor: `${couleurAccent}40` } : {}) }}>
              <span style={{ textAlign: 'left' as const, flex: 1 }}>{cat.nom}</span>
              {cat.nb_produits !== undefined && <span style={s.catCount}>{cat.nb_produits}</span>}
            </button>
          ))
        : Object.entries(GROUPES_EMOJIS).map(([nom, emoji]) => (
            <button key={nom} onClick={() => setRechercheActif(nom)}
              style={s.catBtn}>
              <span>{emoji} {nom}</span>
            </button>
          ))
      }
    </div>
  );

  return (
    <div style={s.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} recherche={recherche}
        setRecherche={setRecherche} onRecherche={lancer} />

      {/* Drawer mobile catégories */}
      {drawerOuvert && (
        <div onClick={() => setDrawerOuvert(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: 280, background: '#111', height: '100%', overflowY: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ color: '#fff', fontWeight: 800, margin: 0 }}>Catégories</p>
              <button onClick={() => setDrawerOuvert(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      <div style={s.layout}>
        {/* Sidebar desktop */}
        <aside style={s.asideDesktop}>
          <Sidebar />
        </aside>

        {/* Contenu principal */}
        <main style={s.main}>
          {/* Barre outils */}
          <div style={s.toolBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setDrawerOuvert(true)} style={s.btnMobileFilter}>
                ☰ Catégories
              </button>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {loading ? '...' : `${produitsFiltres.length} produit${produitsFiltres.length > 1 ? 's' : ''}`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' as const }}>
              {/* Tri rapide */}
              <select value={tri} onChange={e => setTri(e.target.value as Tri)}
                style={s.selectTri}>
                {TRI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Bouton filtres */}
              <button onClick={() => setFiltreOuvert(v => !v)} style={{ ...s.btnFiltre, borderColor: nbFiltresActifs > 0 ? couleurAccent : 'rgba(255,255,255,0.1)' }}>
                ⚙️ Filtres {nbFiltresActifs > 0 && <span style={{ ...s.badgeFiltres, background: couleurAccent, color: '#000' }}>{nbFiltresActifs}</span>}
              </button>

              {/* Panneau filtres */}
              {filtreOuvert && (
                <div ref={panneauRef} style={s.panneau}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <p style={s.filtreLabel}>Trier par</p>
                      {TRI_OPTIONS.map(o => (
                        <label key={o.value} style={{ ...s.radioLabel, background: tri === o.value ? `${couleurAccent}20` : 'transparent' }}>
                          <input type="radio" name="tri" value={o.value} checked={tri === o.value}
                            onChange={() => setTri(o.value)} style={{ accentColor: couleurAccent }} />
                          <span style={{ color: tri === o.value ? couleurAccent : 'rgba(255,255,255,0.75)', fontSize: 14 }}>{o.label}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
                      <div>
                        <p style={s.filtreLabel}>Fourchette de prix</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={s.prixBox}>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>$</span>
                            <input type="number" placeholder="0" value={prixMin} onChange={e => setPrixMin(e.target.value)} style={s.prixInput} min="0" />
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>à</span>
                          <div style={s.prixBox}>
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>$</span>
                            <input type="number" placeholder="Max" value={prixMax} onChange={e => setPrixMax(e.target.value)} style={s.prixInput} min="0" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p style={s.filtreLabel}>Disponibilité</p>
                        <label style={{ ...s.checkLabel, background: filtreEnStock ? 'rgba(16,185,129,0.15)' : 'transparent' }}>
                          <input type="checkbox" checked={filtreEnStock} onChange={e => setFiltreEnStock(e.target.checked)} style={{ accentColor: '#10b981' }} />
                          <span style={{ color: filtreEnStock ? '#6ee7b7' : 'rgba(255,255,255,0.75)', fontSize: 14 }}>En stock seulement</span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button onClick={reinitialiser} style={s.btnReset}>Réinitialiser</button>
                        <button onClick={() => setFiltreOuvert(false)} style={{ ...s.btnReset, background: couleurAccent, color: '#000', border: 'none' }}>✓ Appliquer</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fil d'ariane */}
          {(rechercheActif || categorieActive) && (
            <div style={s.breadcrumb}>
              <span onClick={() => { setCategorieActive(null); setRechercheActif(''); setRecherche(''); }}
                style={s.breadcrumbLink}>Catalogue</span>
              {rechercheActif && <><span style={s.breadcrumbSep}>›</span><span style={{ color: couleurAccent }}>"{rechercheActif}"</span></>}
              {categorieActive && <><span style={s.breadcrumbSep}>›</span><span style={{ color: couleurAccent }}>{categories.find(c => c.id === categorieActive)?.nom}</span></>}
              <button onClick={reinitialiser} style={s.btnEffacer}>✕ Effacer</button>
            </div>
          )}

          {/* Grille produits */}
          {loading ? (
            <div style={s.grille}>
              {[...Array(8)].map((_, i) => <div key={i} style={s.skeleton} />)}
            </div>
          ) : produitsDeLaPage.length === 0 ? (
            <div style={s.vide}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Aucun produit trouvé</p>
              {nbFiltresActifs > 0 && <button onClick={reinitialiser} style={s.btnReset}>Effacer les filtres</button>}
            </div>
          ) : (
            <div style={s.grille}>
              {produitsDeLaPage.map(p => {
                const img = getImage(p);
                const pct = p.prix_original && parseFloat(String(p.prix_original)) > parseFloat(String(p.prix))
                  ? Math.round(((parseFloat(String(p.prix_original)) - parseFloat(String(p.prix))) / parseFloat(String(p.prix_original))) * 100)
                  : null;

                return (
                  <div key={p.id} onClick={() => naviguer({ page: 'produit', produitId: p.id })} style={s.carte}>
                    <div style={s.carteImage}>
                      {img
                        ? <img src={img} alt={p.nom} style={s.img} loading="lazy" />
                        : <div style={s.imgPlaceholder}>📦</div>}
                      {pct && <span style={s.badgeRabais}>-{pct}%</span>}
                      {p.stock === 0 && <span style={s.badgeEpuise}>Épuisé</span>}
                      {p.enchere_statut === 'en_cours' && (
                        <span style={{ ...s.badgeRabais, background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}>🔨 Enchère</span>
                      )}
                    </div>
                    <div style={s.carteBody}>
                      {(p.nom_boutique || p.vendeur_nom) && (
                        <div onClick={e => { e.stopPropagation(); if (p.vendeur_id) ouvrirBoutique(p.vendeur_id); }}
                          style={{ ...s.boutiqueNom, color: couleurAccent }}>
                          {p.nom_boutique || p.vendeur_nom}
                        </div>
                      )}
                      <p style={s.produitNom}>{p.nom}</p>
                      <div style={s.prixRow}>
                        <span style={{ ...s.prixActuel, color: couleurAccent }}>
                          {parseFloat(String(p.prix)).toFixed(2)} $
                        </span>
                        {p.prix_original && parseFloat(String(p.prix_original)) > parseFloat(String(p.prix)) && (
                          <span style={s.prixOriginal}>{parseFloat(String(p.prix_original)).toFixed(2)} $</span>
                        )}
                      </div>
                      {p.categorie_nom && <div style={s.badgeCat}>{p.categorie_nom || p.categorie}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={s.pagination}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={s.pageBtn}>‹ Préc.</button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ ...s.pageBtn, background: page === p ? couleurAccent : 'rgba(255,255,255,0.05)', color: page === p ? '#000' : '#fff', fontWeight: page === p ? 800 : 400 }}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={s.pageBtn}>Suiv. ›</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrapper:  { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  // Navbar
  nav:      { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 20 },
  navLogo:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 },
  logoIcon: { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000', fontFamily: "'Syne', sans-serif" },
  logoText: { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" },
  searchBar:  { flex: 1, display: 'flex', maxWidth: 440 },
  searchInput:{ flex: 1, padding: '9px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px 0 0 10px', color: '#fff', fontSize: 14, outline: 'none' },
  searchBtn:  { padding: '9px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontSize: 14 },
  navLinks: { display: 'flex', gap: 24 },
  navLink:  { color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer' },
  // Layout
  layout:   { maxWidth: 1280, margin: '0 auto', padding: '24px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' },
  asideDesktop: { width: 220, flexShrink: 0, position: 'sticky', top: 80 },
  main:     { flex: 1, minWidth: 0 },
  // Sidebar
  sidebar:  { display: 'flex', flexDirection: 'column', gap: 4 },
  sidebarTitre: { fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, margin: 0 },
  catBtn:   { width: '100%', padding: '8px 12px', background: 'transparent', border: '1px solid transparent', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif" },
  catCount: { fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 },
  // Toolbar
  toolBar:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  btnMobileFilter: { padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  selectTri:{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', outline: 'none' },
  btnFiltre:{ padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", position: 'relative' },
  badgeFiltres: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', fontSize: 11, fontWeight: 800 },
  // Panneau filtres
  panneau:  { position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20, minWidth: 480, zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  filtreLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, margin: '0 0 8px' },
  radioLabel:  { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4 },
  checkLabel:  { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4 },
  prixBox:  { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, flex: 1 },
  prixInput:{ background: 'none', border: 'none', color: '#fff', fontSize: 14, outline: 'none', width: '100%', fontFamily: "'DM Sans', sans-serif" },
  btnReset: { padding: '8px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flex: 1 },
  // Fil d'ariane
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  breadcrumbLink: { fontSize: 13, color: 'rgba(255,255,255,0.5)', cursor: 'pointer' },
  breadcrumbSep:  { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  btnEffacer:     { fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8, fontFamily: "'DM Sans', sans-serif" },
  // Grille
  grille:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 },
  skeleton: { height: 300, background: 'rgba(255,255,255,0.04)', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' },
  vide:     { textAlign: 'center', padding: '80px 20px' },
  // Carte
  carte:     { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', display: 'flex', flexDirection: 'column' },
  carteImage:{ height: 180, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' },
  img:       { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.2 },
  badgeRabais: { position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6 },
  badgeEpuise: { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.6)', fontSize: 11, padding: '3px 8px', borderRadius: 6 },
  carteBody: { padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  boutiqueNom: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', cursor: 'pointer' },
  produitNom:  { fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 },
  prixRow:     { display: 'flex', alignItems: 'center', gap: 8 },
  prixActuel:  { fontSize: 16, fontWeight: 800 },
  prixOriginal:{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' },
  badgeCat:    { fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'inline-block', marginTop: 'auto' },
  // Pagination
  pagination: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32, flexWrap: 'wrap' },
  pageBtn:    { padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", minWidth: 40 },
};