// src/pages/PagePolitique.tsx
// Page publique d'affichage d'une politique e-Vend Studio
// Route : /politiques/:slug

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

const API_BASE = 'http://localhost:5000/api';

interface Politique {
  slug: string;
  titre: string;
  contenu: string;
  updated_at: string;
}

interface AutrePolitique {
  slug: string;
  titre: string;
}

export default function PagePolitique() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [politique, setPolitique] = useState<Politique | null>(null);

  // ── SEO dynamique ──────────────────────────────────────────────────────
  usePageSeo(politique ? {
    titre:       politique.titre + ' | e-Vend Studio',
    description: politique.contenu
      ? politique.contenu.replace(/<[^>]+>/g, '').slice(0, 160)
      : 'Consultez la politique ' + politique.titre + ' de e-Vend Studio.',
    url:         'https://e-vend.ca/politiques/' + slug,
  } : {});
  const [autres, setAutres] = useState<AutrePolitique[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setErreur(false);

    fetch(`${API_BASE}/politiquesPlateforme/public/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('introuvable');
        return r.json();
      })
      .then(data => setPolitique(data.politique))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetch(`${API_BASE}/politiquesPlateforme/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.politiques) setAutres(data.politiques); })
      .catch(() => {});
  }, []);

  // Fermer le drawer si on clique dehors
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#politique-drawer') && !target.closest('#hamburger-btn')) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  // Bloquer le scroll body quand drawer ouvert
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-CA', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return ''; }
  };

  const fallbackPolitiques = [
    { slug: 'privacy-policy',   titre: 'Politique de confidentialité' },
    { slug: 'terms-of-service', titre: "Conditions d'utilisation" },
    { slug: 'refund-policy',    titre: 'Politique de remboursement' },
    { slug: 'shipping-policy',  titre: "Politique d'expédition" },
  ];

  const listePolitiques = autres.length > 0 ? autres : fallbackPolitiques;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerLoad {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes drawerIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .politique-contenu h1,
        .politique-contenu h2,
        .politique-contenu h3,
        .politique-contenu h4 {
          font-family: 'Syne', sans-serif;
          color: #fff;
          margin: 2em 0 0.6em 0;
          line-height: 1.25;
        }
        .politique-contenu h1 { font-size: 1.7rem; }
        .politique-contenu h2 { font-size: 1.35rem; color: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4em; }
        .politique-contenu h3 { font-size: 1.1rem; color: #fbbf24; }
        .politique-contenu p  { color: rgba(255,255,255,0.72); line-height: 1.8; margin-bottom: 1.1em; font-size: 0.97rem; }
        .politique-contenu ul,
        .politique-contenu ol { color: rgba(255,255,255,0.72); padding-left: 1.6em; margin-bottom: 1.1em; }
        .politique-contenu li { margin-bottom: 0.45em; line-height: 1.7; font-size: 0.97rem; }
        .politique-contenu a  { color: #fbbf24; text-decoration: underline; }
        .politique-contenu a:hover { color: #fde68a; }
        .politique-contenu strong { color: rgba(255,255,255,0.9); font-weight: 600; }
        .politique-contenu em { color: rgba(255,255,255,0.6); font-style: italic; }
        .politique-contenu blockquote {
          border-left: 3px solid #fbbf24;
          padding: 0.6em 1.2em;
          margin: 1.2em 0;
          background: rgba(251,191,36,0.06);
          border-radius: 0 8px 8px 0;
          color: rgba(255,255,255,0.65);
          font-style: italic;
        }
        .politique-contenu hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin: 2em 0;
        }
        .politique-contenu table {
          width: 100%; border-collapse: collapse; margin: 1.2em 0; font-size: 0.9rem;
        }
        .politique-contenu th {
          background: rgba(251,191,36,0.12); color: #fbbf24;
          padding: 10px 14px; text-align: left; font-weight: 600;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .politique-contenu td {
          padding: 9px 14px; color: rgba(255,255,255,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .sidebar-link:hover { color: #fbbf24 !important; background: rgba(251,191,36,0.07) !important; }
        .sidebar-link-active { color: #fbbf24 !important; background: rgba(251,191,36,0.1) !important; border-left: 3px solid #fbbf24 !important; }
        .btn-back:hover { color: rgba(255,255,255,0.9) !important; }

        /* Boites colorees dans le contenu des politiques */
        .politique-contenu .warning {
          background: #3d3200; border-left: 4px solid #fbbf24;
          padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 16px 0;
          font-size: 14px; color: #fde68a; font-weight: 500;
        }
        .politique-contenu .important {
          background: #3d0a0a; border-left: 4px solid #ef4444;
          padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 16px 0;
          font-size: 14px; color: #fca5a5; font-weight: 500;
        }
        .politique-contenu .info {
          background: #0a2d3d; border-left: 4px solid #38bdf8;
          padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 16px 0;
          font-size: 14px; color: #bae6fd; font-weight: 500;
        }
        .politique-contenu .caps {
          text-transform: uppercase; font-size: 13px; line-height: 1.7;
          color: rgba(255,255,255,0.85); font-weight: 600;
        }
        .politique-contenu .toc {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px; padding: 16px 24px; margin: 16px 0 24px;
        }
        .politique-contenu .toc h3 { color: #fbbf24 !important; margin-top: 0; }
        .politique-contenu .toc li { font-size: 13px; margin: 3px 0; color: rgba(255,255,255,0.7); }
        .politique-contenu .footer-note {
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 8px; padding: 16px 20px;
          color: rgba(255,255,255,0.7) !important; font-size: 13px;
        }
        .politique-contenu .footer-note a { color: #fbbf24 !important; }
        .breadcrumb-link:hover { color: rgba(255,255,255,0.7) !important; }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmerLoad 1.5s infinite;
          border-radius: 8px;
        }

        /* ── Hamburger lines ── */
        .ham-line {
          display: block;
          width: 20px;
          height: 2px;
          background: rgba(255,255,255,0.7);
          border-radius: 2px;
          transition: all 0.25s ease;
          transform-origin: center;
        }
        .ham-open .ham-line:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .ham-open .ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .ham-open .ham-line:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        /* ── Responsive layout ── */
        .page-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 48px;
          align-items: start;
        }
        .desktop-sidebar { display: block; }
        .mobile-menu-bar { display: none; }

        @media (max-width: 768px) {
          .page-layout {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .desktop-sidebar { display: none; }
          .mobile-menu-bar { display: flex; }
        }

        /* ── Contenu responsive ── */
        @media (max-width: 768px) {
          .politique-contenu h1 { font-size: 1.35rem; }
          .politique-contenu h2 { font-size: 1.15rem; }
          .politique-contenu h3 { font-size: 1rem; }
          .politique-contenu p,
          .politique-contenu li { font-size: 0.93rem; }
          .politique-contenu table { font-size: 0.82rem; }
          .politique-contenu th,
          .politique-contenu td { padding: 7px 10px; }
        }
      `}</style>

      {/* ── Barre de navigation ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate('/')}>
            <div style={s.logoIcon}>e</div>
            <span style={s.logoText}>e-Vend Studio</span>
          </div>
          <button className="btn-back" onClick={() => navigate('/')} style={s.btnBack}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* ── Barre mobile "menu politiques" ── */}
      <div
        className="mobile-menu-bar"
        style={s.mobileMenuBar}
        onClick={() => setDrawerOpen(true)}
        id="hamburger-btn"
      >
        <div style={s.mobileMenuBarInner}>
          <span style={s.mobileMenuLabel}>
            {politique?.titre ?? 'Politiques et conditions'}
          </span>
          <div className={`ham-container ${drawerOpen ? 'ham-open' : ''}`} style={s.hamContainer}>
            <span className="ham-line" />
            <span className="ham-line" />
            <span className="ham-line" />
          </div>
        </div>
      </div>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div
          style={s.drawerOverlay}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Drawer ── */}
      <div
        id="politique-drawer"
        style={{
          ...s.drawer,
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          animation: drawerOpen ? 'drawerIn 0.3s cubic-bezier(0.32,0.72,0,1)' : 'none',
        }}
      >
        <div style={s.drawerHandle} />
        <p style={s.drawerLabel}>Politiques et conditions</p>
        <nav>
          {listePolitiques.map(p => (
            <a
              key={p.slug}
              href={`/politiques/${p.slug}`}
              className={`sidebar-link${slug === p.slug ? ' sidebar-link-active' : ''}`}
              style={s.drawerLink}
              onClick={() => setDrawerOpen(false)}
            >
              {p.titre}
            </a>
          ))}
        </nav>
      </div>

      {/* ── Contenu principal ── */}
      <main style={s.main}>
        <div className="page-layout">

          {/* ── Sidebar desktop ── */}
          <aside className="desktop-sidebar" style={s.sidebar}>
            <p style={s.sidebarLabel}>Politiques et conditions</p>
            <nav>
              {listePolitiques.map(p => (
                <a
                  key={p.slug}
                  href={`/politiques/${p.slug}`}
                  className={`sidebar-link${slug === p.slug ? ' sidebar-link-active' : ''}`}
                  style={s.sidebarLink}
                >
                  {p.titre}
                </a>
              ))}
            </nav>
          </aside>

          {/* ── Article ── */}
          <article style={s.article}>

            {/* LOADING */}
            {loading && (
              <div style={{ animation: 'fadeUp 0.4s ease' }}>
                <div className="skeleton" style={{ height: '14px', width: '120px', marginBottom: '28px' }} />
                <div className="skeleton" style={{ height: '40px', width: '70%', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '14px', width: '180px', marginBottom: '40px' }} />
                {[100, 90, 95, 80, 100, 75, 88].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: '14px', width: `${w}%`, marginBottom: '12px' }} />
                ))}
              </div>
            )}

            {/* ERREUR */}
            {!loading && erreur && (
              <div style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeUp 0.4s ease' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.3 }}>📄</div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                  Politique introuvable
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginBottom: '28px' }}>
                  Cette page n'existe pas ou n'est pas encore disponible.
                </p>
                <button onClick={() => navigate('/')} style={s.btnPrimary}>
                  Retour à l'accueil
                </button>
              </div>
            )}

            {/* CONTENU */}
            {!loading && !erreur && politique && (
              <div style={{ animation: 'fadeUp 0.5s ease' }}>
                {/* Breadcrumb */}
                <div style={s.breadcrumb}>
                  <span onClick={() => navigate('/')} className="breadcrumb-link" style={s.breadcrumbLink}>Accueil</span>
                  <span style={s.breadcrumbSep}>›</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>{politique.titre}</span>
                </div>

                <h1 style={s.titre}>{politique.titre}</h1>

                {politique.updated_at && (
                  <p style={s.meta}>
                    Dernière mise à jour : {formatDate(politique.updated_at)}
                  </p>
                )}

                <div style={s.separateur} />

                <div
                  className="politique-contenu"
                  dangerouslySetInnerHTML={{ __html: politique.contenu }}
                />

                <div style={s.articleFooter}>
                  <div style={s.contactBanner}>
                    <span style={{ fontSize: '20px' }}>💬</span>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                        Des questions sur cette politique ?
                      </p>
                      <a href="mailto:contact@e-vend.ca" style={{ color: '#fbbf24', fontSize: '13px', textDecoration: 'none' }}>
                        contact@e-vend.ca
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <p style={s.footerText}>© 2026 e-Vend Studio · Le marché d'ici, pour les gens d'ici 🇨🇦</p>
      </footer>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#060d1f',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },

  // Nav
  nav: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(6,13,31,0.95)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLogo: {
    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
  },
  logoIcon: {
    width: '30px', height: '30px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: '#000',
  },
  logoText: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: '#fff',
  },
  btnBack: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.4)', fontSize: '13px',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'color 0.2s', padding: '6px 0',
  },

  // Barre mobile
  mobileMenuBar: {
    position: 'sticky',
    top: '60px',
    zIndex: 40,
    background: 'rgba(6,13,31,0.97)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
  },
  mobileMenuBarInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: '48px',
  },
  mobileMenuLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
    fontFamily: "'DM Sans', sans-serif",
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
    maxWidth: 'calc(100% - 40px)',
  },
  hamContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '4px',
    cursor: 'pointer',
    flexShrink: 0,
  },

  // Drawer
  drawerOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 98,
    animation: 'overlayIn 0.2s ease',
  },
  drawer: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    background: '#0d1729',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px 20px 0 0',
    padding: '0 0 40px 0',
    maxHeight: '70vh',
    overflowY: 'auto' as const,
    transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
  },
  drawerHandle: {
    width: '36px',
    height: '4px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '2px',
    margin: '12px auto 20px',
  },
  drawerLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.25)',
    padding: '0 20px 12px',
  },
  drawerLink: {
    display: 'block',
    padding: '14px 20px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    borderLeft: '3px solid transparent',
    transition: 'all 0.18s',
  },

  // Layout
  main: { flex: 1, padding: '40px 20px 80px' },

  // Sidebar desktop
  sidebar: {
    position: 'sticky',
    top: '80px',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    padding: '20px 0',
    overflow: 'hidden',
  },
  sidebarLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.25)',
    padding: '0 18px 14px',
  },
  sidebarLink: {
    display: 'block',
    padding: '10px 18px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    borderLeft: '3px solid transparent',
    transition: 'all 0.18s',
  },

  // Article
  article: {
    minHeight: '60vh',
  },
  breadcrumb: {
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  breadcrumbLink: {
    color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer',
    textDecoration: 'none', transition: 'color 0.15s',
  },
  breadcrumbSep: {
    color: 'rgba(255,255,255,0.2)', fontSize: '13px',
  },
  titre: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.15,
    marginBottom: '10px',
  },
  meta: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.28)',
    marginBottom: '28px',
  },
  separateur: {
    height: '1px',
    background: 'linear-gradient(90deg, rgba(251,191,36,0.3), rgba(255,255,255,0.05) 60%, transparent)',
    marginBottom: '36px',
  },

  articleFooter: { marginTop: '56px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  contactBanner: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '18px 22px',
  },

  btnPrimary: {
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#000', border: 'none', borderRadius: '10px',
    padding: '12px 28px', fontSize: '14px', fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Syne', sans-serif",
  },

  footer: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    padding: '24px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: 'rgba(255,255,255,0.2)', fontSize: '12px',
  },
};