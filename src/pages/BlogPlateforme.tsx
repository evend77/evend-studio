// src/pages/BlogPlateforme.tsx
// Page publique du blog e-Vend Studio — Liste des articles

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

const API_BASE = 'http://localhost:5000/api/blogPlateforme';

interface Article {
  id: number;
  titre: string;
  slug: string;
  extrait: string | null;
  image_couverture: string | null;
  auteur: string;
  categorie_nom: string | null;
  date_publication: string;
  nb_vues: number;
}

export default function Blog() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);

  usePageSeo({
    titre: 'Blog | e-Vend.ca',
    description: 'Découvrez nos articles, conseils et actualités pour les vendeurs et acheteurs sur e-Vend.',
    url: 'https://e-vend.ca/blog',
  });

  useEffect(() => {
    fetchArticles();
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function fetchArticles() {
    setLoading(true);
    try {
      // CORRECTION : utilise /blog au lieu de /blog/public/articles
      const res = await fetch(`${API_BASE}/?page=${page}&limit=9`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Erreur chargement articles', error);
    } finally {
      setLoading(false);
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '';
      return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerLoad {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes bounceUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          50% { transform: translateY(-5px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmerLoad 1.5s infinite;
          border-radius: 8px;
        }

        .article-card:hover {
          transform: translateY(-4px);
          border-color: rgba(251,191,36,0.3);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
      `}</style>

      {showScrollTop && (
        <button onClick={scrollToTop} style={s.scrollTopButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
          <button onClick={() => navigate(-1)} style={s.btnBack}>← Retour</button>
        </div>
      </nav>

      <div style={s.hero}>
        <div style={s.heroInner}>
          <h1 style={s.heroTitle}>Blog e-Vend Studio</h1>
          <p style={s.heroSubtitle}>Conseils, actualités et astuces pour réussir sur notre plateforme</p>
        </div>
      </div>

      <main style={s.main}>
        <div style={s.container}>
          {loading ? (
            <div style={s.grid}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={s.skeletonCard}>
                  <div className="skeleton" style={{ height: '180px', borderRadius: '12px 12px 0 0' }} />
                  <div style={{ padding: '20px' }}>
                    <div className="skeleton" style={{ height: '12px', width: '80px', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '20px', width: '90%', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '100%', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '70%', marginBottom: '16px' }} />
                    <div className="skeleton" style={{ height: '12px', width: '120px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📝</div>
              <h3 style={s.emptyTitle}>Aucun article pour le moment</h3>
              <p style={s.emptyText}>Revenez bientôt pour découvrir nos premiers articles !</p>
            </div>
          ) : (
            <>
              <div style={s.grid}>
                {articles.map(article => (
                  <article key={article.id} style={s.card} className="article-card" onClick={() => navigate(`/blog/${article.slug}`)}>
                    {article.image_couverture ? (
                      <img src={article.image_couverture} alt={article.titre} style={s.cardImage} />
                    ) : (
                      <div style={s.cardImagePlaceholder}><span>📖</span></div>
                    )}
                    <div style={s.cardContent}>
                      <div style={s.cardMeta}>
                        {article.categorie_nom && <span style={s.cardCategory}>{article.categorie_nom}</span>}
                        <span style={s.cardDate}>{formatDate(article.date_publication)}</span>
                      </div>
                      <h2 style={s.cardTitle}>{article.titre}</h2>
                      <p style={s.cardExcerpt}>{article.extrait || article.titre}</p>
                      <div style={s.cardFooter}>
                        <span>Par {article.auteur}</span>
                        <span>👁 {article.nb_vues} vues</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={s.pagination}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{...s.pageButton, ...(page === 1 && s.pageButtonDisabled)}}>← Précédent</button>
                  <span style={s.pageInfo}>Page {page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{...s.pageButton, ...(page === totalPages && s.pageButtonDisabled)}}>Suivant →</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer style={s.footer}>
        <p style={s.footerText}>© 2026 e-Vend Studio · Le marché d'ici, pour les gens d'ici 🇨🇦</p>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#060d1f', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' },
  scrollTopButton: { position: 'fixed', bottom: '30px', right: '30px', width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 15px rgba(251,191,36,0.3)', color: '#000' },
  nav: { borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 },
  navInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  logoIcon: { width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: '#000' },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: '#fff' },
  btnBack: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '6px 0' },
  hero: { background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(6,13,31,0) 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '48px 20px' },
  heroInner: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center' },
  heroTitle: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 6vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: '16px' },
  heroSubtitle: { fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', color: 'rgba(255,255,255,0.55)', maxWidth: '600px', margin: '0 auto' },
  main: { padding: '48px 20px 80px' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px', marginBottom: '48px' },
  skeletonCard: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' },
  card: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.3s ease' },
  cardImage: { width: '100%', height: '200px', objectFit: 'cover' },
  cardImagePlaceholder: { width: '100%', height: '200px', background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(6,13,31,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' },
  cardContent: { padding: '20px' },
  cardMeta: { display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '12px' },
  cardCategory: { background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '4px 10px', borderRadius: '20px', fontSize: '11px' },
  cardDate: { color: 'rgba(255,255,255,0.35)' },
  cardTitle: { fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px', lineHeight: 1.4 },
  cardExcerpt: { fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '16px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.35)', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' },
  pageButton: { padding: '8px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' },
  pageButtonDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  pageInfo: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '64px', marginBottom: '20px', opacity: 0.5 },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 600, marginBottom: '10px' },
  emptyText: { fontSize: '14px', color: 'rgba(255,255,255,0.4)' },
  footer: { borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: '12px' },
};