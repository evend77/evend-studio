// src/templates/multivendeur/MVPremiumAccueil.tsx
// e-Vend Studio — Template Multi-Vendeur — Page Accueil

import { useState, useEffect, useRef } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = '/api';

// ─── PRODUITS DÉMO (mode preview) ────────────────────────────────────────────
const DEMO_PRODUITS = [
  { id:1, nom:'iPhone 15 Pro Max 256Go', prix:1449.99, prix_original:1599.99, stock:8, categorie_nom:'Électronique', nom_boutique:'TechPro Montréal', image:'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=600&q=80', created_at:new Date().toISOString() },
  { id:2, nom:'Chaise ergonomique Herman Miller', prix:899.00, stock:3, categorie_nom:'Meubles', nom_boutique:'Bureau Style QC', image:'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80', created_at:new Date().toISOString() },
  { id:3, nom:'Nike Air Max 270 — Blanc / Noir', prix:189.99, prix_original:229.99, stock:15, categorie_nom:'Chaussures', nom_boutique:'Sport Express', image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', created_at:new Date().toISOString() },
  { id:4, nom:'Sac cuir véritable — Collection Automne', prix:345.00, stock:5, categorie_nom:'Accessoires', nom_boutique:'Mode Élite', image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80', created_at:new Date().toISOString() },
  { id:5, nom:'Guitare acoustique Yamaha FG800', prix:399.99, stock:2, categorie_nom:'Instruments', nom_boutique:'Musique & Co', image:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80', created_at:new Date().toISOString() },
  { id:6, nom:'Set couteaux japonais — 5 pièces', prix:279.00, prix_original:349.00, stock:12, categorie_nom:'Cuisine', nom_boutique:'Cuisine Pro MTL', image:'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&q=80', created_at:new Date().toISOString() },
  { id:7, nom:'Vélo de montagne Trek Marlin 5 — 2024', prix:799.99, stock:4, categorie_nom:'Sport', nom_boutique:'Vélo Aventure', image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', created_at:new Date().toISOString() },
  { id:8, nom:'Samsung Galaxy Watch 6 — Noir', prix:429.00, stock:9, categorie_nom:'Électronique', nom_boutique:'TechPro Montréal', image:'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80', created_at:new Date().toISOString() },
];

const DEMO_GROUPES = [
  { id:1, nom:'Électronique' }, { id:2, nom:'Meubles' }, { id:3, nom:'Sport et plein air' },
  { id:4, nom:'Vêtements / Chaussures et accessoires' }, { id:5, nom:'Instruments de musique' },
  { id:6, nom:'Décoration / Maison' }, { id:7, nom:'Livres' }, { id:8, nom:'Jeux et jouets' },
  { id:9, nom:'Aliments' }, { id:10, nom:'Artisanat / Art' }, { id:11, nom:'Outils' }, { id:12, nom:'Collection' },
];



interface Produit {
  id: number;
  nom: string;
  prix: number;
  image?: string;
  images?: string;
  vendeur_nom?: string;
  nom_boutique?: string;
  categorie_nom?: string;
}

interface Categorie {
  id: number;
  nom: string;
  nb_produits?: number;
}

interface Groupe {
  id: number;
  nom: string;
  nb_categories?: number;
}

interface Politique {
  slug: string;
  titre: string;
}

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (dest: NavMV) => void;
}

function getImage(p: Produit): string | null {
  try {
    if (p.images) {
      const arr = JSON.parse(p.images);
      if (Array.isArray(arr) && arr.length > 0) return arr[0];
    }
  } catch {}
  return p.image || null;
}

const GROUPES_EMOJIS: Record<string, string> = {
  'Accessoires et bijoux': '💍', 'Aliments': '🍎', 'Animaux / Accessoires animaux': '🐾',
  'Antiquites': '🏺', 'Artisanat / Art': '🎨', 'Automobile / Machinerie': '🚗',
  'Bureau / Papeterie': '📎', 'Collection': '🏆', 'Cours et jardins': '🌿',
  'Decoration / Maison': '🏠', 'Electronique': '📱', 'Instruments de musique': '🎸',
  'Jeux et jouets': '🧸', 'Jeux video / Consoles': '🎮', 'Livres': '📚',
  'Meubles': '🛋️', 'Outils': '🔧', 'Sport et plein air': '⚽',
  'Vetements / Chaussures et accessoires': '👕', 'Autres / Divers / Produits numeriques': '📦',
};

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar({ naviguer, config, recherche, setRecherche, onRecherche }: {
  naviguer: (d: NavMV) => void;
  config: Record<string, any>;
  recherche: string;
  setRecherche: (v: string) => void;
  onRecherche: () => void;
}) {
  const [menuMobile, setMenuMobile] = useState(false);
  const nom = config.nom_boutique || 'Ma Marketplace';
  const accent = config.couleur_accent || '#fbbf24';
  const fermer = () => setMenuMobile(false);

  return (
    <nav style={s.nav}>
      <style>{`
        @media(max-width:768px){
          .mv-nav-links { display:none !important; }
          .mv-burger { display:flex !important; }
          .mv-search { max-width:100% !important; }
        }
        @media(min-width:769px){ .mv-burger { display:none !important; } }
        .mv-navlink:hover { color:#fff !important; }
      `}</style>

      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={{ ...s.logoIcon, background: `linear-gradient(135deg,${accent},${accent}cc)` }}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>

        <div className="mv-search" style={s.searchBar}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} onKeyDown={e => e.key === 'Enter' && onRecherche()} placeholder="Rechercher des produits..." style={s.searchInput} />
          <button onClick={onRecherche} style={s.searchBtn}>🔍</button>
        </div>

        <div className="mv-nav-links" style={s.navLinks}>
          <span className="mv-navlink" style={s.navLink} onClick={() => naviguer({ page: 'catalogue' })}>Catalogue</span>
          <span className="mv-navlink" style={s.navLink} onClick={() => naviguer({ page: 'boutiques' })}>Boutiques</span>
          <span className="mv-navlink" style={s.navLink} onClick={() => naviguer({ page: 'encheres' })}>Encheres</span>
          <button onClick={() => naviguer({ page: 'login' })} style={{ ...s.btnCompte, background: accent }}>Mon compte</button>
        </div>

        <button className="mv-burger" onClick={() => setMenuMobile(v => !v)} style={s.menuBurger}>
          {menuMobile ? '✕' : '☰'}
        </button>
      </div>

      {menuMobile && (
        <>
          <div onClick={fermer} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{ ...s.menuMobile, position: 'relative', zIndex: 99 }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex' }}>
                <input value={recherche} onChange={e => setRecherche(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onRecherche(); fermer(); } }} placeholder="Rechercher..." style={{ ...s.searchInput, flex: 1, borderRadius: '10px 0 0 10px' }} />
                <button onClick={() => { onRecherche(); fermer(); }} style={s.searchBtn}>🔍</button>
              </div>
            </div>
            {([{ page: 'catalogue', label: 'Catalogue' }, { page: 'boutiques', label: 'Boutiques' }, { page: 'encheres', label: 'Encheres' }] as { page: any; label: string }[]).map(item => (
              <div key={item.page} onClick={() => { naviguer({ page: item.page }); fermer(); }} style={s.menuMobileItem}>{item.label}</div>
            ))}
            <div style={{ padding: '14px 20px' }}>
              <button onClick={() => { naviguer({ page: 'login' }); fermer(); }} style={{ width: '100%', padding: 11, background: accent, border: 'none', borderRadius: 10, color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Mon compte
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer({ naviguer, config, politiques, vendeurId, isDemo }: {
  naviguer: (d: NavMV) => void;
  config: Record<string, any>;
  politiques: Politique[];
  vendeurId?: number;
  isDemo?: boolean;
}) {
  const [dropdownOuvert, setDropdownOuvert] = useState(false);
  const nom = config.nom_boutique || 'Ma Marketplace';
  const accent = config.couleur_accent || '#fbbf24';

  const ouvrirPolitique = (slug: string) => {
    setDropdownOuvert(false);
    if (isDemo) { naviguer({ page: 'politique', politiqueSlug: slug }); return; }
    window.open(`/site-preview?vendeurId=${vendeurId}&page=politique&politiqueSlug=${slug}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer style={s.footer}>
      <style>{`
        .mv-footer-link:hover { color:#fff !important; }
        .mv-pol-item:hover { background:rgba(255,255,255,0.08) !important; color:#fff !important; }
        @media(max-width:640px){
          .mv-footer-inner { flex-direction:column !important; align-items:flex-start !important; gap:20px !important; }
          .mv-footer-links { flex-wrap:wrap !important; gap:16px !important; }
          .mv-footer-copy { margin-left:0 !important; }
        }
      `}</style>
      <div className="mv-footer-inner" style={s.footerInner}>
        <div style={s.footerLogo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={{ ...s.logoIcon, width: 28, height: 28, fontSize: 13, background: `linear-gradient(135deg,${accent},${accent}cc)` }}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={{ ...s.logoText, fontSize: 14 }}>{nom}</span>
        </div>

        <div className="mv-footer-links" style={s.footerLinks}>
          <span className="mv-footer-link" style={s.footerLink} onClick={() => naviguer({ page: 'catalogue' })}>Catalogue</span>
          <span className="mv-footer-link" style={s.footerLink} onClick={() => naviguer({ page: 'boutiques' })}>Boutiques</span>
          {config.encheres_actif !== false && <span className="mv-footer-link" style={s.footerLink} onClick={() => naviguer({ page: 'encheres' })}>Encheres</span>}
          {config.footer_documents_actif !== false && <span className="mv-footer-link" style={s.footerLink} onClick={() => naviguer({ page: 'documents' })}>Documents</span>}

          {/* Dropdown Nos politiques */}
          {config.footer_politiques_actif !== false && politiques.length > 0 && (
            <div style={{ position: 'relative' }}>
              <span
                className="mv-footer-link"
                style={{ ...s.footerLink, display: 'flex', alignItems: 'center', gap: 5, userSelect: 'none' }}
                onClick={() => setDropdownOuvert(v => !v)}
              >
                Nos politiques
                <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: dropdownOuvert ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </span>

              {dropdownOuvert && (
                <>
                  <div onClick={() => setDropdownOuvert(false)} style={{ position: 'fixed', inset: 0, zIndex: 8 }} />
                  <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '6px', minWidth: 210, zIndex: 9, boxShadow: '0 -8px 32px rgba(0,0,0,0.5)' }}>
                    {politiques.map(p => (
                      <div
                        key={p.slug}
                        className="mv-pol-item"
                        onClick={() => ouvrirPolitique(p.slug)}
                        style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)', transition: 'all 0.15s' }}
                      >
                        {p.titre}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <span className="mv-footer-copy" style={s.footerCopy}>© {new Date().getFullYear()} {nom}</span>
      </div>
    </footer>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function MVPremiumAccueil({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const [produits,  setProduits]  = useState<Produit[]>([]);
  const [groupes,   setGroupes]   = useState<Groupe[]>([]);
  const [politiques,setPolitiques]= useState<Politique[]>([]);
  const [recherche, setRecherche] = useState('');
  const [loading,   setLoading]   = useState(true);

  const gestionnaireId = vendeurId || config.gestionnaire_id;

  useEffect(() => {
    if (isDemo) {
      // Mode démo — données hardcodées, zéro appel API
      setProduits(DEMO_PRODUITS as any);
      setGroupes(DEMO_GROUPES as any);
      setPolitiques([
        { slug: 'confidentialite', titre: 'Confidentialité' },
        { slug: 'conditions-utilisation', titre: "Conditions d'utilisation" },
        { slug: 'remboursement', titre: 'Remboursement' },
      ] as any);
      setLoading(false);
      return;
    }
    // Charger produits récents
    fetch(`${API_BASE}/produits/gestionnaire/${gestionnaireId}?limit=8`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setProduits(Array.isArray(d) ? d.slice(0, 8) : []))
      .catch(() => [])
      .finally(() => setLoading(false));

    // Charger groupes de catégories
    fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/categories-groupes`)
      .then(r => r.ok ? r.json() : { groupes: [] })
      .then(d => setGroupes(d.groupes || []))
      .catch(() => {});

    // Charger politiques pour le footer
    fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/politiques`)
      .then(r => r.ok ? r.json() : { politiques: [] })
      .then(d => setPolitiques(d.politiques || []))
      .catch(() => {});
  }, [gestionnaireId, isDemo]);

  const nomBoutique = config.nom_boutique || 'Ma Marketplace';
  const slogan = config.slogan || 'La marketplace canadienne de confiance';
  const couleurAccent = config.couleur_accent || '#fbbf24';

  return (
    <div style={s.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} recherche={recherche} setRecherche={setRecherche}
        onRecherche={() => naviguer({ page: 'catalogue', categorieSlug: recherche })} />

      {/* ── HERO ── */}
      {config.accueil_hero_actif !== false && (
      <section style={{ ...s.hero, background: `radial-gradient(ellipse at 60% 50%, ${couleurAccent}15 0%, transparent 60%), #0a0a0a` }}>
        <div style={s.heroInner}>
          <div style={s.heroContent}>
            <div style={{ ...s.heroBadge, background: `${couleurAccent}20`, color: couleurAccent, border: `1px solid ${couleurAccent}40` }}>
              {config.accueil_hero_badge || '🇨🇦 Marketplace canadienne'}
            </div>
            <h1 style={s.heroTitre}>{nomBoutique}</h1>
            <p style={s.heroDesc}>{slogan}</p>
            <div style={s.heroBtns}>
              <button onClick={() => naviguer({ page: 'catalogue' })}
                style={{ ...s.btnPrimary, background: couleurAccent, color: '#000' }}>
                Explorer le catalogue →
              </button>
              <button onClick={() => naviguer({ page: 'boutiques' })} style={s.btnSecondary}>
                Voir les boutiques
              </button>
            </div>
          </div>
          <div style={s.heroStats}>
            {[
              { nb: produits.length + '+', label: 'Produits' },
              { nb: '100%', label: 'Canadien' },
              { nb: '⭐ 4.8', label: 'Satisfaction' },
            ].map((stat, i) => (
              <div key={i} style={s.statCard}>
                <div style={{ ...s.statNb, color: couleurAccent }}>{stat.nb}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── CATÉGORIES ── */}
      {config.accueil_categories_actif !== false && groupes.length > 0 && (
        <section style={s.section}>
          <div style={s.container}>
            <h2 style={s.sectionTitre}>{config.accueil_categories_titre || 'Explorer par catégorie'}</h2>
            <div style={s.grilleCats}>
              {groupes.slice(0, 12).map(g => (
                <div key={g.id} onClick={() => naviguer({ page: 'catalogue', categorieSlug: g.nom })}
                  style={s.catCard}>
                  <div style={s.catEmoji}>{GROUPES_EMOJIS[g.nom] || '📦'}</div>
                  <div style={s.catNom}>{g.nom}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRODUITS RÉCENTS ── */}
      {config.accueil_nouveautes_actif !== false && (
      <section style={{ ...s.section, background: 'rgba(255,255,255,0.02)' }}>
        <div style={s.container}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitre}>{config.accueil_nouveautes_titre || 'Nouveautés'}</h2>
            <button onClick={() => naviguer({ page: 'catalogue' })}
              style={{ ...s.btnSecondary, padding: '8px 20px', fontSize: 13 }}>
              Voir tout →
            </button>
          </div>
          {loading ? (
            <div style={s.loading}>Chargement...</div>
          ) : (
            <div style={s.grilleProduits}>
              {produits.map(p => {
                const img = getImage(p);
                return (
                  <div key={p.id} onClick={() => naviguer({ page: 'produit', produitId: p.id })}
                    style={s.carteWrapper}>
                    <div style={s.carte}>
                      <div style={s.carteImg}>
                        {img ? <img src={img} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={s.carteImgPlaceholder}>📦</div>}
                        <div style={{ ...s.cartePrixBadge, background: `${couleurAccent}f0`, color: '#000' }}>
                          {p.prix?.toFixed(2)} $
                        </div>
                      </div>
                      <div style={s.carteBody}>
                        {(p.nom_boutique || p.vendeur_nom) && (
                          <div style={{ ...s.carteVendeur, color: couleurAccent }}>
                            {p.nom_boutique || p.vendeur_nom}
                          </div>
                        )}
                        <div style={s.carteNom}>{p.nom}</div>
                        {p.categorie_nom && <div style={s.carteCat}>{p.categorie_nom}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      )}

      {/* ── CTA VENDEURS ── */}
      {config.accueil_cta_vendeurs_actif !== false && (
      <section style={s.ctaSection}>
        <div style={s.container}>
          <div style={s.ctaInner}>
            <h2 style={{ ...s.sectionTitre, fontSize: 'clamp(22px,3vw,38px)', marginBottom: 12 }}>
              {config.accueil_cta_titre || 'Vous êtes vendeur ?'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
              {config.accueil_cta_texte || 'Rejoignez notre marketplace et vendez vos produits à des milliers de clients canadiens.'}
            </p>
            <button style={{ ...s.btnPrimary, background: couleurAccent, color: '#000', padding: '14px 40px', fontSize: 15 }}>
              Créer ma boutique →
            </button>
          </div>
        </div>
      </section>
      )}

      <Footer naviguer={naviguer} config={config} politiques={politiques} vendeurId={gestionnaireId} isDemo={isDemo} />
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrapper:    { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  // Navbar
  nav:        { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner:   { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 20 },
  navLogo:    { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 },
  logoIcon:   { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000', fontFamily: "'Syne', sans-serif" },
  logoText:   { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" },
  searchBar:  { flex: 1, display: 'flex', gap: 0, maxWidth: 480 },
  searchInput:{ flex: 1, padding: '9px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px 0 0 10px', color: '#fff', fontSize: 14, outline: 'none' },
  searchBtn:  { padding: '9px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontSize: 14 },
  navLinks:   { display: 'flex', gap: 24 },
  navLink:    { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' },
  btnCompte:  { padding: '8px 18px', border: 'none', borderRadius: 20, color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  menuBurger: { display: 'none', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 },
  menuMobile: { background: '#111', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px' },
  menuMobileItem: { padding: '12px 0', color: 'rgba(255,255,255,0.8)', fontSize: 15, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  // Hero
  hero:       { padding: '80px 0 60px' },
  heroInner:  { maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' },
  heroContent:{ flex: 1, minWidth: 280 },
  heroBadge:  { display: 'inline-block', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 20 },
  heroTitre:  { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px,4vw,56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 },
  heroDesc:   { fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 },
  heroBtns:   { display: 'flex', gap: 14, flexWrap: 'wrap' },
  heroStats:  { display: 'flex', gap: 16, flexWrap: 'wrap' },
  statCard:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 28px', textAlign: 'center' },
  statNb:     { fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  // Sections
  section:    { padding: '60px 0' },
  container:  { maxWidth: 1280, margin: '0 auto', padding: '0 24px' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  sectionTitre: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(20px,2.5vw,32px)', fontWeight: 800, marginBottom: 32 },
  loading:    { textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px' },
  // Catégories
  grilleCats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 },
  catCard:    { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  catEmoji:   { fontSize: 32, marginBottom: 8 },
  catNom:     { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, lineHeight: 1.3 },
  // Produits
  grilleProduits: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  carteWrapper: { cursor: 'pointer' },
  carte:      { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s', display: 'flex', flexDirection: 'column' },
  carteImg:   { height: 180, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' },
  carteImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.2 },
  cartePrixBadge: { position: 'absolute', bottom: 10, right: 10, fontWeight: 800, fontSize: 14, padding: '4px 10px', borderRadius: 8 },
  carteBody:  { padding: 16, flex: 1 },
  carteVendeur: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 6 },
  carteNom:   { fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' },
  carteCat:   { fontSize: 11, color: 'rgba(255,255,255,0.35)', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'inline-block' },
  // CTA
  ctaSection: { padding: '80px 0', background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.06) 0%, transparent 70%)' },
  ctaInner:   { maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '0 24px' },
  // Boutons
  btnPrimary: { padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'opacity 0.2s' },
  btnSecondary: { padding: '12px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  // Footer
  footer:     { padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' },
  footerInner:{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' },
  footerLogo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  footerLinks:{ display: 'flex', gap: 24, flex: 1, flexWrap: 'wrap' },
  footerLink: { color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' },
  footerCopy: { fontSize: 13, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' },
};