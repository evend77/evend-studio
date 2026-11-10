// CHEMIN : src/templates/multivendeur/MVPremiumAccueil.tsx
// e-Vend Studio — Template Multi-Vendeur — Page Accueil

import { useState, useEffect, useRef } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';
import MVPremiumFooter from './MVPremiumFooter';
import { fondDe, fondNav } from './mvTheme';
import { nettoyerRecherche } from './mvSecurite';
import MVPremiumAvantages from './MVPremiumAvantages';
import MVBoutonInstallerApp from './MVBoutonInstallerApp';
import { formaterPrix } from '../shared/devise';

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
    <nav style={{ ...s.nav, background: fondNav(config) }}>
      <style>{`
        @media(max-width:768px){
          .mv-nav-links { display:none !important; }
          .mv-burger { display:flex !important; }
          .mv-search { display:none !important; }
          .mv-pad { padding-left:16px !important; padding-right:16px !important; }
          .mv-navinner { padding:0 14px !important; gap:12px !important; }
        }
        @media(min-width:769px){ .mv-burger { display:none !important; } }
        .mv-navlink:hover { color:#fff !important; }
      `}</style>

      <div className="mv-navinner" style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={{ ...s.logoIcon, background: `linear-gradient(135deg,${accent},${accent}cc)` }}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={{ ...s.logoText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
        </div>

        <div className="mv-search" style={s.searchBar}>
          <input value={recherche} maxLength={100} autoComplete="off" onChange={e => setRecherche(nettoyerRecherche(e.target.value))} onKeyDown={e => e.key === 'Enter' && onRecherche()} placeholder="Rechercher des produits..." style={s.searchInput} />
          <button onClick={onRecherche} style={s.searchBtn}>🔍</button>
        </div>

        <div className="mv-nav-links" style={s.navLinks}>
          <span className="mv-navlink" style={s.navLink} onClick={() => naviguer({ page: 'catalogue' })}>Catalogue</span>
          <span className="mv-navlink" style={s.navLink} onClick={() => naviguer({ page: 'boutiques' })}>Boutiques</span>
          {config.encheres_actif !== false && <span className="mv-navlink" style={s.navLink} onClick={() => naviguer({ page: 'encheres' })}>Encheres</span>}
          {config.offres_actif === true && <span className="mv-navlink" style={s.navLink} onClick={() => naviguer({ page: 'offres' })}>🔥 Offres</span>}
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
                <input value={recherche} maxLength={100} autoComplete="off" onChange={e => setRecherche(nettoyerRecherche(e.target.value))} onKeyDown={e => { if (e.key === 'Enter') { onRecherche(); fermer(); } }} placeholder="Rechercher..." style={{ ...s.searchInput, flex: 1, borderRadius: '10px 0 0 10px' }} />
                <button onClick={() => { onRecherche(); fermer(); }} style={s.searchBtn}>🔍</button>
              </div>
            </div>
            {([{ page: 'catalogue', label: 'Catalogue' }, { page: 'boutiques', label: 'Boutiques' }, ...(config.encheres_actif !== false ? [{ page: 'encheres', label: 'Encheres' }] : []), ...(config.offres_actif === true ? [{ page: 'offres', label: '🔥 Offres du jour' }] : [])] as { page: any; label: string }[]).map(item => (
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

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function MVPremiumAccueil({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const [produits,  setProduits]  = useState<Produit[]>([]);
  const [groupes,   setGroupes]   = useState<Groupe[]>([]);
  const [recherche, setRecherche] = useState('');
  const [loading,   setLoading]   = useState(true);

  const gestionnaireId = vendeurId || config.gestionnaire_id;

  useEffect(() => {
    if (isDemo) {
      // Mode démo — données hardcodées, zéro appel API
      setProduits(DEMO_PRODUITS as any);
      setGroupes(DEMO_GROUPES as any);
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
  }, [gestionnaireId, isDemo]);

  const nomBoutique = config.nom_boutique || 'Ma Marketplace';
  const slogan = config.slogan || 'La marketplace canadienne de confiance';
  const couleurAccent = config.couleur_accent || '#fbbf24';

  return (
    <div style={{ ...s.wrapper, background: fondDe(config) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width:768px) {
          .mv-photo-banniere { height:170px !important; }
          .mv-apropos-img { width:100% !important; flex:1 1 100% !important; }
          .mv-hero { padding:36px 0 28px !important; }
          .mv-section { padding:36px 0 !important; }
          .mv-grille { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:10px !important; }
          .mv-hero-stats { width:100%; flex-wrap:nowrap !important; gap:8px !important; }
          .mv-stat { flex:1 1 0; min-width:0; padding:14px 6px !important; }
          .mv-stat > div:first-child { font-size:20px !important; }
          .mv-herobtns button { flex:1 1 100%; }
          .mv-section-head { flex-wrap:wrap; gap:10px; }
        }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} recherche={recherche} setRecherche={setRecherche}
        onRecherche={() => naviguer({ page: 'catalogue', categorieSlug: recherche })} />

      {/* ── PHOTO DE BANNIÈRE (facultative, réglée par le gestionnaire) ── */}
      {config?.extra?.accueil_banniere?.actif === true && /^https:\/\//.test(config.extra.accueil_banniere.url || '') && (
        <div className="mv-photo-banniere" style={{ position: 'relative', height: 320, backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: `url(${config.extra.accueil_banniere.url})` }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,0.1), ${fondDe(config)})` }} />
        </div>
      )}

      {/* ── HERO ── */}
      {config.accueil_hero_actif !== false && (
      <section className="mv-hero" style={{ ...s.hero, background: `radial-gradient(ellipse at 60% 50%, ${couleurAccent}15 0%, transparent 60%), ${fondDe(config)}` }}>
        <div className="mv-pad" style={s.heroInner}>
          <div style={s.heroContent}>
            <div style={{ ...s.heroBadge, background: `${couleurAccent}20`, color: couleurAccent, border: `1px solid ${couleurAccent}40` }}>
              {config.accueil_hero_badge || '🇨🇦 Marketplace canadienne'}
            </div>
            <h1 style={s.heroTitre}>{nomBoutique}</h1>
            <p style={s.heroDesc}>{slogan}</p>
            <div className="mv-herobtns" style={s.heroBtns}>
              <button onClick={() => naviguer({ page: 'catalogue' })}
                style={{ ...s.btnPrimary, background: couleurAccent, color: '#000' }}>
                Explorer le catalogue →
              </button>
              <button onClick={() => naviguer({ page: 'boutiques' })} style={s.btnSecondary}>
                Voir les boutiques
              </button>
            </div>
            {/* Add-on « App installable » : bouton mobile seulement, visible seulement si la PWA est active */}
            <div style={{ marginLeft: -20, maxWidth: 400 }}><MVBoutonInstallerApp /></div>
          </div>
          <div className="mv-hero-stats" style={s.heroStats}>
            {[
              { nb: produits.length + '+', label: 'Produits' },
              { nb: '100%', label: 'Canadien' },
              { nb: '⭐ 4.8', label: 'Satisfaction' },
            ].map((stat, i) => (
              <div key={i} className="mv-stat" style={s.statCard}>
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
        <section className="mv-section" style={s.section}>
          <div className="mv-pad" style={s.container}>
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

      {/* ── CARTES (AVANTAGES) — configurables par le gestionnaire ── */}
      <MVPremiumAvantages config={config} />

      {/* ── PRODUITS RÉCENTS ── */}
      {config.accueil_nouveautes_actif !== false && (
      <section className="mv-section" style={{ ...s.section, background: 'rgba(255,255,255,0.02)' }}>
        <div className="mv-pad" style={s.container}>
          <div className="mv-section-head" style={s.sectionHeader}>
            <h2 style={s.sectionTitre}>{config.accueil_nouveautes_titre || 'Nouveautés'}</h2>
            <button onClick={() => naviguer({ page: 'catalogue' })}
              style={{ ...s.btnSecondary, padding: '8px 20px', fontSize: 13 }}>
              Voir tout →
            </button>
          </div>
          {loading ? (
            <div style={s.loading}>Chargement...</div>
          ) : (
            <div className="mv-grille" style={s.grilleProduits}>
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
                          {formaterPrix(p.prix)}
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

      {/* ── ENCADRÉ TEXTE (facultatif, réglé par le gestionnaire) ── */}
      {config?.extra?.accueil_apropos?.actif === true && String(config.extra.accueil_apropos.texte || '').trim() && (() => {
        const ap = config.extra.accueil_apropos;
        const img = /^https:\/\//.test(ap.image_url || '') ? ap.image_url : '';
        return (
          <section className="mv-section" style={{ ...s.section }}>
            <div className="mv-pad" style={s.container}>
              <div className="mv-apropos-3d" style={{
                padding: 4, borderRadius: 24,
                background: `linear-gradient(145deg, ${couleurAccent}, ${couleurAccent}55 35%, ${couleurAccent}22 60%, ${couleurAccent})`,
                boxShadow: `0 1px 0 ${couleurAccent}, 0 6px 0 ${couleurAccent}66, 0 12px 0 ${couleurAccent}33, 0 28px 60px ${couleurAccent}33, 0 0 40px ${couleurAccent}18`,
              }}>
                <div style={{
                  borderRadius: 20, padding: 'clamp(20px,4vw,36px)',
                  background: `linear-gradient(160deg, ${couleurAccent}14 0%, rgba(255,255,255,0.03) 40%, ${fondDe(config)} 100%), ${fondDe(config)}`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 40px ${couleurAccent}12`,
                }}>
                  {ap.titre && <h2 style={{ ...s.sectionTitre, marginBottom: 18 }}>{ap.titre}</h2>}
                  <div className="mv-apropos-corps" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {img && (
                      <div className="mv-apropos-img" style={{ width: 240, height: 180, flex: '0 0 240px', borderRadius: 14, overflow: 'hidden', border: `2px solid ${couleurAccent}66`, boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 0 1px ${couleurAccent}30` }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}
                    <p style={{ flex: 1, minWidth: 240, margin: 0, color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 1.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{ap.texte}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── TEXTE ENTRE DEUX PHOTOS (facultatif, réglé par le gestionnaire) ── */}
      {config?.extra?.accueil_histoire?.actif === true && String(config.extra.accueil_histoire.texte || '').trim() && (() => {
        const hi = config.extra.accueil_histoire;
        const ok = (u: any) => (/^https:\/\//.test(u || '') ? u : '');
        const g = ok(hi.image_gauche), d = ok(hi.image_droite);
        const paras = String(hi.texte).split(/\n\s*\n/).map((x: string) => x.trim()).filter(Boolean);
        const photo = (u: string) => (
          <div className="mv-histoire-photo" style={{ borderRadius: 24, overflow: 'hidden', aspectRatio: '4 / 5', border: `1px solid ${couleurAccent}55`, boxShadow: '0 18px 50px rgba(0,0,0,0.45)', background: 'rgba(255,255,255,0.04)' }}>
            <img src={u} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        );
        return (
          <section className="mv-section" style={s.section}>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Caveat:wght@500;600&display=swap');
              .mv-histoire { display:grid; gap:48px; align-items:center; }
              @media (max-width:900px) {
                .mv-histoire { grid-template-columns:1fr 1fr !important; gap:14px !important; }
                .mv-histoire-texte { order:-1 !important; grid-column:1 / -1; }
              }
            `}</style>
            <div className="mv-pad" style={s.container}>
              <div className="mv-histoire" style={{ gridTemplateColumns: g && d ? '1fr 1.1fr 1fr' : g || d ? '1fr 1.2fr' : '1fr' }}>
                {g && <div className="mv-histoire-photos">{photo(g)}</div>}
                <div className="mv-histoire-texte" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto', order: g ? undefined : -1 }}>
                  {hi.sur_titre && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 26, color: couleurAccent, marginBottom: 6 }}>{hi.sur_titre}</div>}
                  {hi.titre && <h2 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.01em', fontSize: 'clamp(30px,4.5vw,48px)', lineHeight: 1.1, color: '#fff', margin: '0 0 22px' }}>{hi.titre}</h2>}
                  {paras.map((t: string, i: number) => (
                    <p key={i} style={{ margin: '0 0 16px', color: i === 0 ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{t}</p>
                  ))}
                </div>
                {d && <div className="mv-histoire-photos">{photo(d)}</div>}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── CTA VENDEURS ── */}
      {config.accueil_cta_vendeurs_actif !== false && (
      <section className="mv-section" style={s.ctaSection}>
        <div className="mv-pad" style={s.container}>
          <div style={s.ctaInner}>
            <h2 style={{ ...s.sectionTitre, fontSize: 'clamp(22px,3vw,38px)', marginBottom: 12 }}>
              {config.accueil_cta_titre || 'Vous êtes vendeur ?'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
              {config.accueil_cta_texte || 'Rejoignez notre marketplace et vendez vos produits à des milliers de clients canadiens.'}
            </p>
            <button onClick={() => naviguer({ page: 'inscription-collaborateur' })} style={{ ...s.btnPrimary, background: couleurAccent, color: '#000', padding: '14px 40px', fontSize: 15 }}>
              Créer ma boutique →
            </button>
          </div>
        </div>
      </section>
      )}

      <MVPremiumFooter vendeurId={gestionnaireId} isDemo={isDemo} config={config} naviguer={naviguer} />
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrapper:    { overflowX: 'clip', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  // Navbar
  nav:        { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner:   { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 20 },
  navLogo:    { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 1, minWidth: 0 },
  logoIcon:   { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000', fontFamily: "'Syne', sans-serif" },
  logoText:   { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" },
  searchBar:  { flex: 1, display: 'flex', gap: 0, maxWidth: 440 },
  searchInput:{ flex: 1, padding: '9px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px 0 0 10px', color: '#fff', fontSize: 14, outline: 'none' },
  searchBtn:  { padding: '9px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontSize: 14 },
  navLinks:   { display: 'flex', gap: 24 },
  navLink:    { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' },
  btnCompte:  { padding: '8px 18px', border: 'none', borderRadius: 20, color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  menuBurger: { marginLeft: 'auto', display: 'none', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 },
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