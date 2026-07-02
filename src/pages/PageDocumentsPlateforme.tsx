// src/pages/PageDocumentsPlateforme.tsx
// Page publique d'affichage d'un document/guide e-Vend
// Route : /documents/:slug

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

const API_BASE = '/api';

interface Document {
  slug: string;
  titre: string;
  contenu: string;
  updated_at: string;
}

interface AutreDocument {
  slug: string;
  titre: string;
}

export default function PageDocumentsPlateforme() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const articleRef = useRef<HTMLElement>(null);

  const [document, setDocument] = useState<Document | null>(null);

  // ── SEO dynamique ──────────────────────────────────────────────────────
  usePageSeo(document ? {
    titre:       document.titre + ' | e-Vend Studio',
    description: document.contenu
      ? document.contenu.replace(/<[^>]+>/g, '').slice(0, 160)
      : 'Consultez le guide ' + document.titre + ' de e-Vend Studio.',
    url:         'https://e-vend.ca/documents/' + slug,
  } : {});
  const [autres, setAutres] = useState<AutreDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErreur(false);

    fetch(`${API_BASE}/pagesPlateforme/public/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('introuvable');
        return r.json();
      })
      .then(data => setDocument(data.page))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetch(`${API_BASE}/pagesPlateforme/public/menu`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.pages) setAutres(data.pages); })
      .catch(() => {});
  }, []);

  // Détecter le scroll pour afficher/masquer la flèche
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le drawer si on clique dehors
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#documents-drawer') && !target.closest('#hamburger-btn')) {
        setDrawerOpen(false);
      }
    };
    window.document.addEventListener('mousedown', handler);
    return () => window.document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  // Bloquer le scroll body quand drawer ouvert
  useEffect(() => {
    if (drawerOpen) {
      window.document.body.style.overflow = 'hidden';
    } else {
      window.document.body.style.overflow = '';
    }
    return () => {
      window.document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('fr-CA', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return ''; }
  };

  const listeDocuments = autres.length > 0 ? autres : [];

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
        @keyframes bounceUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          50% { transform: translateY(-5px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Contenu principal - empêcher le débordement */
        .document-contenu {
          overflow-x: hidden;
          word-wrap: break-word;
          word-break: break-word;
        }
        .document-contenu img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }
        .document-contenu table {
          display: block;
          overflow-x: auto;
          white-space: nowrap;
        }
        .document-contenu pre,
        .document-contenu code {
          white-space: pre-wrap;
          word-wrap: break-word;
          max-width: 100%;
        }
        .document-contenu iframe,
        .document-contenu video {
          max-width: 100%;
          height: auto;
        }

        .document-contenu h1,
        .document-contenu h2,
        .document-contenu h3,
        .document-contenu h4 {
          font-family: 'Syne', sans-serif;
          color: #fff;
          margin: 2em 0 0.6em 0;
          line-height: 1.25;
        }
        .document-contenu h1 { font-size: 1.7rem; }
        .document-contenu h2 { font-size: 1.35rem; color: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4em; }
        .document-contenu h3 { font-size: 1.1rem; color: #fbbf24; }
        .document-contenu p  { color: rgba(255,255,255,0.72); line-height: 1.8; margin-bottom: 1.1em; font-size: 0.97rem; }
        .document-contenu ul,
        .document-contenu ol { color: rgba(255,255,255,0.72); padding-left: 1.6em; margin-bottom: 1.1em; }
        .document-contenu li { margin-bottom: 0.45em; line-height: 1.7; font-size: 0.97rem; }
        .document-contenu a  { color: #fbbf24; text-decoration: underline; word-break: break-all; }
        .document-contenu a:hover { color: #fde68a; }
        .document-contenu strong { color: rgba(255,255,255,0.9); font-weight: 600; }
        .document-contenu em { color: rgba(255,255,255,0.6); font-style: italic; }
        .document-contenu blockquote {
          border-left: 3px solid #fbbf24;
          padding: 0.6em 1.2em;
          margin: 1.2em 0;
          background: rgba(251,191,36,0.06);
          border-radius: 0 8px 8px 0;
          color: rgba(255,255,255,0.65);
          font-style: italic;
          overflow-x: auto;
        }
        .document-contenu hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin: 2em 0;
        }
        .document-contenu table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.2em 0;
          font-size: 0.9rem;
          display: block;
          overflow-x: auto;
        }
        .document-contenu th {
          background: rgba(251,191,36,0.12);
          color: #fbbf24;
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .document-contenu td {
          padding: 9px 14px;
          color: rgba(255,255,255,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .sidebar-link:hover { color: #fbbf24 !important; background: rgba(251,191,36,0.07) !important; }
        .sidebar-link-active { color: #fbbf24 !important; background: rgba(251,191,36,0.1) !important; border-left: 3px solid #fbbf24 !important; }
        .btn-back:hover { color: rgba(255,255,255,0.9) !important; }
        .breadcrumb-link:hover { color: rgba(255,255,255,0.7) !important; }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmerLoad 1.5s infinite;
          border-radius: 8px;
        }

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

        .page-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 48px;
          align-items: start;
        }
        .desktop-sidebar { 
          display: block;
          position: sticky;
          top: 80px;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
        }
        .mobile-menu-bar { display: none; }

        /* Scrollbar personnalisée pour la sidebar */
        .desktop-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .desktop-sidebar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .desktop-sidebar::-webkit-scrollbar-thumb {
          background: rgba(251,191,36,0.4);
          border-radius: 4px;
        }
        .desktop-sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(251,191,36,0.6);
        }

        @media (max-width: 768px) {
          .page-layout {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .desktop-sidebar { display: none; }
          .mobile-menu-bar { display: flex; }
          
          .document-contenu h1 { font-size: 1.35rem; }
          .document-contenu h2 { font-size: 1.15rem; }
          .document-contenu h3 { font-size: 1rem; }
          .document-contenu p,
          .document-contenu li { font-size: 0.93rem; }
          .document-contenu table { font-size: 0.82rem; }
          .document-contenu th,
          .document-contenu td { padding: 7px 10px; }
          
          /* Ajustement des marges sur mobile */
          .document-contenu {
            padding: 0 4px;
          }
        }
      `}</style>

      {/* Flèche de retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={s.scrollTopButton}
          className="scroll-top-btn"
          aria-label="Retour en haut"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L12 20M12 4L18 10M12 4L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

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

      {/* Barre mobile */}
      <div
        className="mobile-menu-bar"
        style={s.mobileMenuBar}
        onClick={() => setDrawerOpen(true)}
        id="hamburger-btn"
      >
        <div style={s.mobileMenuBarInner}>
          <span style={s.mobileMenuLabel}>
            {document?.titre ?? 'Guides et documentation'}
          </span>
          <div className={`ham-container ${drawerOpen ? 'ham-open' : ''}`} style={s.hamContainer}>
            <span className="ham-line" />
            <span className="ham-line" />
            <span className="ham-line" />
          </div>
        </div>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div style={s.drawerOverlay} onClick={() => setDrawerOpen(false)} />
      )}

      {/* Drawer mobile */}
      <div
        id="documents-drawer"
        style={{
          ...s.drawer,
          transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',
          animation: drawerOpen ? 'drawerIn 0.3s cubic-bezier(0.32,0.72,0,1)' : 'none',
        }}
      >
        <div style={s.drawerHandle} />
        <p style={s.drawerLabel}>Guides et documentation</p>
        <nav style={s.drawerNav}>
          {listeDocuments.map(doc => (
            <a
              key={doc.slug}
              href={`/documents/${doc.slug}`}
              className={`sidebar-link${slug === doc.slug ? ' sidebar-link-active' : ''}`}
              style={s.drawerLink}
              onClick={() => setDrawerOpen(false)}
            >
              {doc.titre}
            </a>
          ))}
        </nav>
      </div>

      {/* Contenu principal */}
      <main style={s.main}>
        <div className="page-layout">

          {/* Sidebar desktop avec scroll indépendant */}
          <aside className="desktop-sidebar" style={s.sidebar}>
            <p style={s.sidebarLabel}>Guides et documentation</p>
            <nav style={s.sidebarNav}>
              {listeDocuments.map(doc => (
                <a
                  key={doc.slug}
                  href={`/documents/${doc.slug}`}
                  className={`sidebar-link${slug === doc.slug ? ' sidebar-link-active' : ''}`}
                  style={s.sidebarLink}
                >
                  {doc.titre}
                </a>
              ))}
            </nav>
          </aside>

          {/* Article */}
          <article style={s.article} ref={articleRef}>

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
                  Document introuvable
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginBottom: '28px' }}>
                  Ce guide ou cette page d'aide n'existe pas ou n'est pas encore disponible.
                </p>
                <button onClick={() => navigate('/')} style={s.btnPrimary}>
                  Retour à l'accueil
                </button>
              </div>
            )}

            {/* AUCUN DOCUMENT SÉLECTIONNÉ */}
            {!loading && !erreur && !slug && (
              <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeUp 0.4s ease' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.3 }}>📚</div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                  Guides et documentation
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginBottom: '28px' }}>
                  Sélectionnez un guide dans le menu de gauche
                </p>
              </div>
            )}

            {/* CONTENU */}
            {!loading && !erreur && slug && document && (
              <div style={{ animation: 'fadeUp 0.5s ease' }}>
                <div style={s.breadcrumb}>
                  <span onClick={() => navigate('/')} className="breadcrumb-link" style={s.breadcrumbLink}>Accueil</span>
                  <span style={s.breadcrumbSep}>›</span>
                  <span onClick={() => navigate('/documents')} className="breadcrumb-link" style={s.breadcrumbLink}>Guides</span>
                  <span style={s.breadcrumbSep}>›</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>{document.titre}</span>
                </div>

                <h1 style={s.titre}>{document.titre}</h1>

                {document.updated_at && (
                  <p style={s.meta}>
                    Dernière mise à jour : {formatDate(document.updated_at)}
                  </p>
                )}

                <div style={s.separateur} />

                <div
                  className="document-contenu"
                  dangerouslySetInnerHTML={{ __html: document.contenu || '<p>Contenu à venir...</p>' }}
                />

                <div style={s.articleFooter}>
                  <div style={s.contactBanner}>
                    <span style={{ fontSize: '20px' }}>💬</span>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                        Besoin d'aide supplémentaire ?
                      </p>
                      <a href="mailto:support@e-vend.ca" style={{ color: '#fbbf24', fontSize: '13px', textDecoration: 'none' }}>
                        support@e-vend.ca
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </article>
        </div>
      </main>

      <footer style={s.footer}>
        <p style={s.footerText}>© 2026 e-Vend Studio · Le marché d'ici, pour les gens d'ici 🇨🇦</p>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#060d1f',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },

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

  scrollTopButton: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    boxShadow: '0 4px 15px rgba(251,191,36,0.3)',
    transition: 'all 0.3s ease',
    animation: 'bounceUp 0.3s ease-out',
    color: '#000',
  } as React.CSSProperties,

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
  drawerNav: {
    paddingBottom: '20px',
  },

  main: { flex: 1, padding: '40px 20px 80px' },

  sidebar: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    padding: '20px 0',
    overflowY: 'auto',
    position: 'sticky',
    top: '80px',
    maxHeight: 'calc(100vh - 100px)',
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
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column' as const,
  },

  article: {
    minHeight: '60vh',
    overflowX: 'hidden',
    width: '100%',
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