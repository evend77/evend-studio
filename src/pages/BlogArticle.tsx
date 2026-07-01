// src/pages/BlogArticle.tsx
// Page d'article de blog e-Vend Studio

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

const API_BASE = 'http://localhost:5000/api/blogPlateforme';

interface Article {
  id: number;
  titre: string;
  slug: string;
  contenu: string;
  extrait: string | null;
  image_couverture: string | null;
  auteur: string;
  categorie_nom: string | null;
  tags: string[];
  date_publication: string;
  updated_at: string;
  nb_vues: number;
  seo_titre: string | null;
  seo_description: string | null;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  usePageSeo(article ? {
    titre: article.seo_titre || `${article.titre} | e-Vend.ca`,
    description: article.seo_description || article.extrait || `Lisez l'article de ${article.auteur} sur e-Vend : ${article.titre}`,
    url: `https://e-vend.ca/blog/${slug}`,
  } : {});

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    setLoading(true);
    setErreur(false);
    fetch(`${API_BASE}/article/${slug}`)
      .then(r => { if (!r.ok) throw new Error('introuvable'); return r.json(); })
      .then(data => setArticle(data.article))
      .catch(() => setErreur(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '';
      return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return ''; }
  };

  const getReadingTime = (html: string) => {
    const words = html.replace(/<[^>]+>/g, '').split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerLoad { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmerLoad 1.5s infinite; border-radius: 8px; }
        .article-contenu { overflow-x: auto; word-wrap: break-word; }
        .article-contenu img { max-width: 100%; height: auto; border-radius: 12px; margin: 12px 0; }
        .article-contenu h1, .article-contenu h2, .article-contenu h3 { 
          font-family: 'Syne', sans-serif; 
          color: #fff; 
          margin: 2em 0 0.6em 0;
          line-height: 1.3;
        }
        .article-contenu h2 { font-size: 1.35rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4em; }
        .article-contenu h3 { font-size: 1.1rem; color: #fbbf24; }
        .article-contenu p { color: rgba(255,255,255,0.72); line-height: 1.8; margin-bottom: 1.1em; font-size: 0.97rem; }
        .article-contenu a { color: #fbbf24; }
        .article-contenu blockquote { border-left: 3px solid #fbbf24; padding: 0.6em 1.2em; background: rgba(251,191,36,0.06); margin: 1.2em 0; border-radius: 0 8px 8px 0; }
        .article-contenu ul, .article-contenu ol { color: rgba(255,255,255,0.72); padding-left: 1.6em; margin-bottom: 1.1em; line-height: 1.8; font-size: 0.97rem; }
        .article-contenu ul { list-style-type: disc; }
        .article-contenu ol { list-style-type: decimal; }
        .article-contenu li { margin-bottom: 0.4em; }
        .article-contenu table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 0.9rem; border-radius: 10px; overflow: hidden; }
        .article-contenu thead { background: rgba(251,191,36,0.15); }
        .article-contenu th { color: #fbbf24; font-weight: 700; padding: 12px 16px; text-align: left; border-bottom: 2px solid rgba(251,191,36,0.3); font-family: 'Syne', sans-serif; }
        .article-contenu td { color: rgba(255,255,255,0.78); padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); vertical-align: top; }
        .article-contenu tr:last-child td { border-bottom: none; }
        .article-contenu tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        .article-contenu tr:hover td { background: rgba(251,191,36,0.04); }
        .article-contenu code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.88em; color: #fbbf24; }
        .article-contenu pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 16px; overflow-x: auto; margin: 1.2em 0; }
        @media (max-width: 768px) {
          .article-contenu h2 { font-size: 1.15rem; }
          .article-contenu p { font-size: 0.93rem; }
          .article-contenu table { font-size: 0.82rem; }
          .article-contenu th, .article-contenu td { padding: 8px 10px; }
        }
      `}</style>

      {showScrollTop && (
        <button onClick={scrollToTop} style={s.scrollTopButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4L12 20M12 4L18 10M12 4L6 10" stroke="currentColor" strokeWidth="2"/></svg>
        </button>
      )}

      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate('/')}>
            <div style={s.logoIcon}>e</div>
            <span style={s.logoText}>e-Vend Studio</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => navigate('/blog')} style={s.btnBlog}>← Blog</button>
            <button onClick={() => navigate(-1)} style={s.btnBack}>Retour</button>
          </div>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.container}>
          {loading && (
            <div>
              <div className="skeleton" style={{ height: '400px', borderRadius: '16px', marginBottom: '32px' }} />
              <div className="skeleton" style={{ height: '14px', width: '120px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ height: '40px', width: '80%', marginBottom: '32px' }} />
              {[100, 95, 85, 100, 90, 75, 88].map((w, i) => (<div key={i} className="skeleton" style={{ height: '14px', width: `${w}%`, marginBottom: '12px' }} />))}
            </div>
          )}

          {!loading && erreur && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.5 }}>📄</div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>Article introuvable</h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginBottom: '28px' }}>L'article que vous recherchez n'existe pas ou a été déplacé.</p>
              <button onClick={() => navigate('/blog')} style={s.btnPrimary}>Voir tous les articles</button>
            </div>
          )}

          {!loading && !erreur && article && (
            <>
              {article.image_couverture && <img src={article.image_couverture} alt={article.titre} style={s.heroImage} />}
              
              <div style={s.breadcrumb}>
                <span onClick={() => navigate('/')} style={s.breadcrumbLink}>Accueil</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>›</span>
                <span onClick={() => navigate('/blog')} style={s.breadcrumbLink}>Blog</span>
                <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>›</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>{article.titre}</span>
              </div>

              <h1 style={s.title}>{article.titre}</h1>

              <div style={s.metaBar}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#fbbf24', fontSize: '13px' }}>Par {article.auteur}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{formatDate(article.date_publication)}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>📖 {getReadingTime(article.contenu || '')} min</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>👁 {article.nb_vues} vues</span>
              </div>

              {article.tags && article.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {article.tags.map(tag => (<span key={tag} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '12px' }}>#{tag}</span>))}
                </div>
              )}

              <div style={s.separateur} />

              <div className="article-contenu" dangerouslySetInnerHTML={{ __html: article.contenu || '<p>Contenu à venir...</p>' }} />

              <div style={s.articleFooter}>
                <div style={{ marginBottom: '32px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Partager cet article</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.titre)}&url=${encodeURIComponent(window.location.href)}`, '_blank')} style={s.shareBtn}>𝕏</button>
                    <button onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}`, '_blank')} style={s.shareBtn}>in</button>
                    <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={s.shareBtn}>🔗</button>
                  </div>
                </div>

                <div style={s.contactBanner}>
                  <span style={{ fontSize: '20px' }}>💬</span>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>Vous avez des questions ?</p>
                    <a href="mailto:support@e-vend.ca" style={{ color: '#fbbf24', fontSize: '13px', textDecoration: 'none' }}>support@e-vend.ca</a>
                  </div>
                </div>
              </div>
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
  page: { minHeight: '100vh', background: '#060d1f', fontFamily: "'DM Sans', sans-serif", color: '#fff' },
  scrollTopButton: { position: 'fixed', bottom: '30px', right: '30px', width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, color: '#000' },
  nav: { borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 },
  navInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  logoIcon: { width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: '#000' },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: '#fff' },
  btnBlog: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '13px', padding: '6px 0' },
  btnBack: { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '6px 0' },
  main: { padding: '48px 20px 80px' },
  container: { maxWidth: '900px', margin: '0 auto' },
  heroImage: { width: '100%', borderRadius: '16px', marginBottom: '32px' },
  breadcrumb: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' },
  breadcrumbLink: { color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' },
  title: { 
    fontFamily: "'Syne', sans-serif", 
    fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', 
    fontWeight: 800, 
    marginBottom: '20px',
    lineHeight: 1.3,
    letterSpacing: '-0.02em'
  },
  metaBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' },
  separateur: { height: '1px', background: 'linear-gradient(90deg, rgba(251,191,36,0.3), rgba(255,255,255,0.05) 60%, transparent)', marginBottom: '36px' },
  articleFooter: { marginTop: '56px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  shareBtn: { width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '16px' },
  contactBanner: { display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px 22px' },
  btnPrimary: { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' },
  footer: { borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: '12px' },
};