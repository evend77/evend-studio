// src/pages/FaqPlateforme.tsx
// Page publique FAQ Plateforme e-Vend Studio — Foire aux questions

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSeo } from '../hooks/usePageSeo';

const API_BASE = '/api';

interface FAQItem {
  id: number;
  question: string;
  reponse: string;
  categorie: string;
  ordre: number;
}

export default function FaqPlateforme() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['toutes']);
  const [categorieActive, setCategorieActive] = useState<string>('toutes');
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  usePageSeo({
    titre: 'FAQ - Foire aux questions | e-Vend Studio',
    description: 'Toutes les réponses à vos questions sur e-Vend Studio : inscription, boutiques, paiements, abonnements et support.',
    url: 'https://e-vend.ca/faq',
  });

  useEffect(() => {
    fetchFAQ();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function fetchFAQ() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/faqPlateforme/public`);
      const data = await res.json();
      const items = data.questions || [];
      setFaqs(items);
      
      // Extraire les catégories uniques
      const uniqueCategories: string[] = [];
      items.forEach((item: FAQItem) => {
        if (item.categorie && item.categorie !== '' && !uniqueCategories.includes(item.categorie)) {
          uniqueCategories.push(item.categorie);
        }
      });
      setCategories(['toutes', ...uniqueCategories]);
    } catch (error) {
      console.error('Erreur chargement FAQ', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleItem = (id: number) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenItems(newOpen);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredFaqs = faqs.filter(f => {
    if (categorieActive !== 'toutes' && f.categorie !== categorieActive) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return f.question.toLowerCase().includes(searchLower) || f.reponse.toLowerCase().includes(searchLower);
    }
    return true;
  });

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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceUp {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          50% { transform: translateY(-5px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .faq-item:hover {
          border-color: rgba(251,191,36,0.3);
        }

        .category-chip:hover {
          background: rgba(251,191,36,0.15);
          border-color: rgba(251,191,36,0.4);
        }

        .category-active {
          background: rgba(251,191,36,0.2);
          border-color: #fbbf24;
          color: #fbbf24;
        }

        .faq-reponse {
          animation: slideDown 0.3s ease-out;
        }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmerLoad 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={s.scrollTopButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4L12 20M12 4L18 10M12 4L6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Navigation */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate('/')}>
            <div style={s.logoIcon}>e</div>
            <span style={s.logoText}>e-Vend Studio</span>
          </div>
          <button onClick={() => navigate('/')} style={s.btnBack}>
            ← Retour
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <h1 style={s.heroTitle}>Foire aux questions</h1>
          <p style={s.heroSubtitle}>
            Trouvez rapidement les réponses à vos questions sur e-Vend Studio
          </p>
        </div>
      </div>

      <main style={s.main}>
        <div style={s.container}>
          {/* Search bar */}
          <div style={s.searchWrapper}>
            <svg style={s.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21L17 17"/>
            </svg>
            <input
              type="text"
              style={s.searchInput}
              placeholder="Rechercher une question..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={s.clearSearch} onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Categories */}
          {categories.length > 1 && !loading && (
            <div style={s.categoriesBar}>
              {categories.map(cat => (
                <button
                  key={cat}
                  className="category-chip"
                  style={{...s.categoryChip, ...(categorieActive === cat && s.categoryActive)}}
                  onClick={() => setCategorieActive(cat)}
                >
                  {cat === 'toutes' ? '📋 Toutes' : cat}
                </button>
              ))}
            </div>
          )}

          {/* Results count */}
          {!loading && (
            <p style={s.resultsCount}>
              {filteredFaqs.length} question{filteredFaqs.length > 1 ? 's' : ''}
              {search && ` pour "${search}"`}
            </p>
          )}

          {/* FAQ List */}
          {loading ? (
            <div style={s.faqList}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={s.skeletonItem}>
                  <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '16px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '100%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '90%' }} />
                </div>
              ))}
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>❓</div>
              <h3 style={s.emptyTitle}>Aucune question trouvée</h3>
              <p style={s.emptyText}>
                {search ? `Aucun résultat pour "${search}"` : 'Aucune FAQ dans cette catégorie'}
              </p>
              {(search || categorieActive !== 'toutes') && (
                <button style={s.resetBtn} onClick={() => { setSearch(''); setCategorieActive('toutes'); }}>
                  Voir toutes les questions
                </button>
              )}
            </div>
          ) : (
            <div style={s.faqList}>
              {filteredFaqs.map(faq => (
                <div key={faq.id} className="faq-item" style={s.faqItem}>
                  <button
                    style={s.faqQuestion}
                    onClick={() => toggleItem(faq.id)}
                  >
                    <span>{faq.question}</span>
                    <span style={s.faqIcon}>
                      {openItems.has(faq.id) ? '−' : '+'}
                    </span>
                  </button>
                  {openItems.has(faq.id) && (
                    <div className="faq-reponse" style={s.faqReponse}>
                      <div dangerouslySetInnerHTML={{ __html: faq.reponse }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Contact section - Bouton modifié pour rediriger vers /contact */}
          <div style={s.contactCard}>
            <div style={s.contactContent}>
              <span style={s.contactIcon}>💬</span>
              <div>
                <h3 style={s.contactTitle}>Vous n'avez pas trouvé votre réponse ?</h3>
                <p style={s.contactText}>Notre équipe est là pour vous aider</p>
              </div>
              <button onClick={() => navigate('/contact')} style={s.contactBtn}>
                Contacter le support
              </button>
            </div>
          </div>
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

  scrollTopButton: {
    position: 'fixed', bottom: '30px', right: '30px', width: '48px', height: '48px',
    borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, boxShadow: '0 4px 15px rgba(251,191,36,0.3)', color: '#000',
  },

  nav: {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 50,
  },
  navInner: {
    maxWidth: '1200px', margin: '0 auto', padding: '0 20px',
    height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  logoIcon: {
    width: '30px', height: '30px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: '#000',
  },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '17px', color: '#fff' },
  btnBack: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '6px 0',
  },

  hero: {
    background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(6,13,31,0) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '48px 20px',
  },
  heroInner: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center' },
  heroTitle: {
    fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 6vw, 3rem)',
    fontWeight: 800, color: '#fff', marginBottom: '16px',
  },
  heroSubtitle: {
    fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
    color: 'rgba(255,255,255,0.55)', maxWidth: '600px', margin: '0 auto',
  },

  main: { padding: '48px 20px 80px' },
  container: { maxWidth: '900px', margin: '0 auto' },

  searchWrapper: { position: 'relative', marginBottom: '32px' },
  searchIcon: {
    position: 'absolute', left: '14px', top: '50%',
    transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)',
  },
  searchInput: {
    width: '100%', padding: '14px 40px 14px 42px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px', fontSize: '14px', color: '#fff', outline: 'none',
  },
  clearSearch: {
    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px',
    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '11px', padding: '2px 6px',
  },

  categoriesBar: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' },
  categoryChip: {
    padding: '8px 18px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '30px',
    fontSize: '13px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  categoryActive: { background: 'rgba(251,191,36,0.15)', borderColor: '#fbbf24', color: '#fbbf24' },

  resultsCount: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' },

  faqList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '48px' },

  skeletonItem: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px' },

  faqItem: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s',
  },
  faqQuestion: {
    width: '100%', padding: '18px 20px', background: 'transparent',
    border: 'none', textAlign: 'left', fontSize: '16px', fontWeight: 600,
    color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', fontFamily: "'DM Sans', sans-serif",
  },
  faqIcon: { fontSize: '20px', color: '#fbbf24' },
  faqReponse: {
    padding: '0 20px 20px 20px', color: 'rgba(255,255,255,0.65)',
    fontSize: '14px', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.04)',
    marginTop: '0',
  },

  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '64px', marginBottom: '20px', opacity: 0.5 },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 600, marginBottom: '10px' },
  emptyText: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' },
  resetBtn: {
    padding: '10px 24px', background: 'rgba(251,191,36,0.15)',
    border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px',
    fontSize: '13px', color: '#fbbf24', cursor: 'pointer',
  },

  contactCard: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px', padding: '32px',
  },
  contactContent: { display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  contactIcon: { fontSize: '32px' },
  contactTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: '#fff' },
  contactText: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  contactBtn: {
    marginLeft: 'auto', padding: '12px 24px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    color: '#000', textDecoration: 'none', cursor: 'pointer',
  },

  footer: { borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center' },
  footerText: { color: 'rgba(255,255,255,0.2)', fontSize: '12px' },
};