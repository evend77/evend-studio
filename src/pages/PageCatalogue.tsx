// src/pages/PageTemplates.tsx
// e-Vend Studio — Galerie de templates pour créer sa boutique en ligne

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Photothèque libre de droits
const PHOTOS = {
  hero: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1600',
  template1: 'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=800',
  template2: 'https://images.pexels.com/photos/5632397/pexels-photo-5632397.jpeg?auto=compress&cs=tinysrgb&w=800',
  template3: 'https://images.pexels.com/photos/6991226/pexels-photo-6991226.jpeg?auto=compress&cs=tinysrgb&w=800',
  template4: 'https://images.pexels.com/photos/4381392/pexels-photo-4381392.jpeg?auto=compress&cs=tinysrgb&w=800',
  template5: 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=800',
  template6: 'https://images.pexels.com/photos/5647688/pexels-photo-5647688.jpeg?auto=compress&cs=tinysrgb&w=800',
  template7: 'https://images.pexels.com/photos/4491459/pexels-photo-4491459.jpeg?auto=compress&cs=tinysrgb&w=800',
  template8: 'https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=800',
  template9: 'https://images.pexels.com/photos/28904962/pexels-photo-28904962.jpeg?auto=compress&cs=tinysrgb&w=800',
  template10: 'https://images.pexels.com/photos/29342873/pexels-photo-29342873.jpeg?auto=compress&cs=tinysrgb&w=800',
  template11: 'https://images.pexels.com/photos/29220034/pexels-photo-29220034.jpeg?auto=compress&cs=tinysrgb&w=800',
  template12: 'https://images.pexels.com/photos/28354303/pexels-photo-28354303.jpeg?auto=compress&cs=tinysrgb&w=800',
};

interface Template {
  id: number;
  nom: string;
  prix: number;
  rating: number;
  nouveau: boolean;
  image: string;
  categorie: string;
  type: 'base' | 'transactionnel' | 'monoproduit' | 'enchere';
  description: string;
}

export default function PageTemplates() {
  const navigate = useNavigate();
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [filtrePrix, setFiltrePrix] = useState<string>('tous');
  const [filtreSecteur, setFiltreSecteur] = useState<string>('tous');
  const [vue, setVue] = useState<'grille' | 'liste'>('grille');
  const [recherche, setRecherche] = useState('');

  const templates: Template[] = [
    // === SITES DE BASE (non transactionnels) ===
    { id: 1, nom: 'Minimaliste', prix: 0, rating: 98, nouveau: true, image: PHOTOS.template1, categorie: 'Artisanat', type: 'base', description: 'Design épuré pour portfolio et présentation' },
    { id: 2, nom: 'Studio Créa', prix: 0, rating: 96, nouveau: false, image: PHOTOS.template2, categorie: 'Art', type: 'base', description: 'Parfait pour les artistes et créateurs' },
    { id: 3, nom: 'Élégance', prix: 0, rating: 94, nouveau: false, image: PHOTOS.template3, categorie: 'Mode', type: 'base', description: 'Vitrine élégante pour vos créations' },
    { id: 4, nom: 'Nature & Co', prix: 0, rating: 92, nouveau: true, image: PHOTOS.template4, categorie: 'Jardin', type: 'base', description: 'Ambiance naturelle et apaisante' },
    
    // === SITES TRANSACTIONNELS ===
    { id: 5, nom: 'Boutique Pro', prix: 29, rating: 99, nouveau: false, image: PHOTOS.template5, categorie: 'Commerce', type: 'transactionnel', description: 'Panier d\'achat complet et paiements intégrés' },
    { id: 6, nom: 'Marketplace', prix: 49, rating: 97, nouveau: true, image: PHOTOS.template6, categorie: 'Multi-vendeurs', type: 'transactionnel', description: 'Plateforme multi-vendeurs avec commissions' },
    { id: 7, nom: 'Luxe & Chic', prix: 39, rating: 98, nouveau: false, image: PHOTOS.template7, categorie: 'Mode', type: 'transactionnel', description: 'Design haut de gamme pour marques premium' },
    { id: 8, nom: 'Tech Store', prix: 34, rating: 95, nouveau: true, image: PHOTOS.template8, categorie: 'Électronique', type: 'transactionnel', description: 'Vitrine technologique moderne' },
    
    // === SITES MONO-PRODUIT ===
    { id: 9, nom: 'Launch One', prix: 19, rating: 100, nouveau: true, image: PHOTOS.template9, categorie: 'Lancement', type: 'monoproduit', description: 'Page de vente unique pour un seul produit' },
    { id: 10, nom: 'Capsule', prix: 15, rating: 98, nouveau: false, image: PHOTOS.template10, categorie: 'Produit', type: 'monoproduit', description: 'Design épuré focus produit' },
    { id: 11, nom: 'Événementiel', prix: 25, rating: 96, nouveau: true, image: PHOTOS.template11, categorie: 'Événements', type: 'monoproduit', description: 'Billetterie et réservations intégrées' },
    
    // === SITES ENCHÈRES ===
    { id: 12, nom: 'Auction House', prix: 59, rating: 97, nouveau: true, image: PHOTOS.template12, categorie: 'Enchères', type: 'enchere', description: 'Système d\'enchères en temps réel' },
    { id: 13, nom: 'BidMaster', prix: 49, rating: 94, nouveau: false, image: PHOTOS.template1, categorie: 'Enchères', type: 'enchere', description: 'Plateforme d\'enchères complète' },
    { id: 14, nom: 'Art Auction', prix: 45, rating: 96, nouveau: true, image: PHOTOS.template3, categorie: 'Art', type: 'enchere', description: 'Spécialisé pour œuvres d\'art' },
  ];

  const secteurs = [
    'Art', 'Auto', 'Sacs', 'Beauté', 'Vêtements', 'Électronique', 'Divertissement',
    'Nourriture', 'Jardin', 'Matériel', 'Accueil', 'Bijoux', 'Enfants', 'Bureau',
    'Animaux', 'Services', 'Chaussures', 'Sport', 'Jouets', 'Bien-être'
  ];

  const templatesFiltres = templates.filter(t => {
    if (filtreType !== 'tous' && t.type !== filtreType) return false;
    if (filtrePrix === 'gratuit' && t.prix !== 0) return false;
    if (filtrePrix === 'payant' && t.prix === 0) return false;
    if (filtreSecteur !== 'tous' && t.categorie !== filtreSecteur) return false;
    if (recherche && !t.nom.toLowerCase().includes(recherche.toLowerCase()) && !t.description.toLowerCase().includes(recherche.toLowerCase())) return false;
    return true;
  });

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'base': return 'Site vitrine';
      case 'transactionnel': return 'Boutique en ligne';
      case 'monoproduit': return 'Mono-produit';
      case 'enchere': return 'Plateforme enchères';
      default: return '';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch(type) {
      case 'base': return '#22c55e';
      case 'transactionnel': return '#3b82f6';
      case 'monoproduit': return '#a855f7';
      case 'enchere': return '#f97316';
      default: return '#f5a623';
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .template-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .template-card:hover .template-img {
          transform: scale(1.03);
        }
        .filter-btn.active {
          background: #f5a623;
          color: #000;
          border-color: #f5a623;
        }
        .type-btn.active {
          background: #f5a623;
          color: #000;
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main-content { margin-left: 0 !important; }
          .templates-grid { grid-template-columns: 1fr !important; }
          .filters-row { flex-wrap: wrap; }
        }
      `}</style>

      {/* Barre de navigation */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logo} onClick={() => navigate('/')}>
            <span style={s.logoMark}>e</span>
            <span style={s.logoText}>VEND STUDIO</span>
          </div>
          <div style={s.navLinks}>
            <a href="/" style={s.navLink}>Accueil</a>
            <a href="/templates" style={{...s.navLink, color: '#f5a623'}}>Templates</a>
            <a href="/catalogue" style={s.navLink}>Catalogue</a>
            <a href="/blog" style={s.navLink}>Blog</a>
          </div>
          <div style={s.navButtons}>
            <button style={s.btnOutline} onClick={() => navigate('/login')}>Connexion</button>
            <button style={s.btnPrimary} onClick={() => navigate('/register')}>Démarrer →</button>
          </div>
          <button className="hamburger" onClick={() => setMenuMobileOuvert(!menuMobileOuvert)} style={{ display: 'none', background: 'none', border: 'none', fontSize: '28px', color: '#fff', cursor: 'pointer' }}>
            {menuMobileOuvert ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* En-tête */}
      <header style={s.header}>
        <div style={s.headerOverlay} />
        <div style={s.headerContent}>
          <h1 style={s.headerTitle}>Parcourir tous les <span style={s.accent}>templates</span></h1>
          <p style={s.headerSubtitle}>Choisissez parmi plus de 20 designs professionnels pour votre boutique en ligne</p>
        </div>
      </header>

      <div style={s.mainContainer}>
        {/* Sidebar filtres */}
        <aside className="sidebar" style={s.sidebar}>
          <div style={s.filterSection}>
            <h3 style={s.filterTitle}>Type de site</h3>
            <div style={s.filterGroup}>
              {[
                { value: 'tous', label: 'Tous les types' },
                { value: 'base', label: '🏠 Site vitrine', color: '#22c55e' },
                { value: 'transactionnel', label: '🛒 Boutique en ligne', color: '#3b82f6' },
                { value: 'monoproduit', label: '📦 Mono-produit', color: '#a855f7' },
                { value: 'enchere', label: '🔨 Plateforme enchères', color: '#f97316' },
              ].map(type => (
                <button
                  key={type.value}
                  className={`filter-btn ${filtreType === type.value ? 'active' : ''}`}
                  style={{ ...s.filterBtn, ...(filtreType === type.value ? s.filterBtnActive : {}) }}
                  onClick={() => setFiltreType(type.value)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div style={s.filterSection}>
            <h3 style={s.filterTitle}>Prix</h3>
            <div style={s.filterGroup}>
              {[
                { value: 'tous', label: 'Tous les prix' },
                { value: 'gratuit', label: 'Gratuit' },
                { value: 'payant', label: 'Payant' },
              ].map(prix => (
                <button
                  key={prix.value}
                  className={`filter-btn ${filtrePrix === prix.value ? 'active' : ''}`}
                  style={{ ...s.filterBtn, ...(filtrePrix === prix.value ? s.filterBtnActive : {}) }}
                  onClick={() => setFiltrePrix(prix.value)}
                >
                  {prix.label}
                </button>
              ))}
            </div>
          </div>

          <div style={s.filterSection}>
            <h3 style={s.filterTitle}>Secteur d'activité</h3>
            <div style={s.filterGroup}>
              <button
                className={`filter-btn ${filtreSecteur === 'tous' ? 'active' : ''}`}
                style={{ ...s.filterBtn, ...(filtreSecteur === 'tous' ? s.filterBtnActive : {}) }}
                onClick={() => setFiltreSecteur('tous')}
              >
                Tous
              </button>
              {secteurs.map(secteur => (
                <button
                  key={secteur}
                  className={`filter-btn ${filtreSecteur === secteur ? 'active' : ''}`}
                  style={{ ...s.filterBtn, fontSize: '12px', ...(filtreSecteur === secteur ? s.filterBtnActive : {}) }}
                  onClick={() => setFiltreSecteur(secteur)}
                >
                  {secteur}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main style={{ ...s.mainContent, marginLeft: '280px' }}>
          {/* Barre d'outils */}
          <div style={s.toolbar}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.searchInput}
                placeholder="Rechercher un template..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
              />
            </div>
            <div style={s.toolbarRight}>
              <span style={s.resultCount}>{templatesFiltres.length} templates</span>
              <div style={s.viewToggle}>
                <button onClick={() => setVue('grille')} style={{ ...s.viewBtn, ...(vue === 'grille' ? s.viewBtnActive : {}) }}>📱 Grille</button>
                <button onClick={() => setVue('liste')} style={{ ...s.viewBtn, ...(vue === 'liste' ? s.viewBtnActive : {}) }}>📋 Liste</button>
              </div>
            </div>
          </div>

          {/* Sections par type */}
          {filtreType === 'tous' ? (
            <>
              {/* Section Sites de base */}
              <div style={s.sectionGroup}>
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>🏠 Sites vitrine <span style={s.sectionBadge}>Non transactionnels</span></h2>
                  <p style={s.sectionDesc}>Parfaits pour présenter votre travail, portfolio ou service</p>
                </div>
                <div style={s.templatesGrid}>
                  {templates.filter(t => t.type === 'base').map((t, i) => (
                    <div key={t.id} className="template-card" style={{ ...s.templateCard, animationDelay: `${i * 0.05}s` }} onClick={() => navigate(`/template/${t.id}`)}>
                      <div style={s.templateImageWrap}>
                        <img src={t.image} alt={t.nom} className="template-img" style={s.templateImage} />
                        {t.nouveau && <span style={s.nouveauBadge}>NOUVEAU</span>}
                        {t.prix === 0 && <span style={s.gratuitBadge}>GRATUIT</span>}
                      </div>
                      <div style={s.templateInfo}>
                        <div style={s.templateHeader}>
                          <h3 style={s.templateName}>{t.nom}</h3>
                          <span style={{ ...s.typeBadge, background: getTypeBadgeColor(t.type) }}>{getTypeLabel(t.type)}</span>
                        </div>
                        <p style={s.templateDesc}>{t.description}</p>
                        <div style={s.templateFooter}>
                          <span style={s.templatePrix}>{t.prix === 0 ? 'Gratuit' : `${t.prix} $`}</span>
                          <span style={s.templateRating}>⭐ {t.rating}%</span>
                          <button style={s.previewBtn}>Aperçu →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Transactionnels */}
              <div style={s.sectionGroup}>
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>🛒 Boutiques en ligne <span style={s.sectionBadge}>Transactionnels</span></h2>
                  <p style={s.sectionDesc}>Vendez vos produits avec panier d'achat et paiements intégrés</p>
                </div>
                <div style={s.templatesGrid}>
                  {templates.filter(t => t.type === 'transactionnel').map((t, i) => (
                    <div key={t.id} className="template-card" style={{ ...s.templateCard, animationDelay: `${i * 0.05}s` }} onClick={() => navigate(`/template/${t.id}`)}>
                      <div style={s.templateImageWrap}>
                        <img src={t.image} alt={t.nom} className="template-img" style={s.templateImage} />
                        {t.nouveau && <span style={s.nouveauBadge}>NOUVEAU</span>}
                      </div>
                      <div style={s.templateInfo}>
                        <div style={s.templateHeader}>
                          <h3 style={s.templateName}>{t.nom}</h3>
                          <span style={{ ...s.typeBadge, background: getTypeBadgeColor(t.type) }}>{getTypeLabel(t.type)}</span>
                        </div>
                        <p style={s.templateDesc}>{t.description}</p>
                        <div style={s.templateFooter}>
                          <span style={s.templatePrix}>{t.prix === 0 ? 'Gratuit' : `${t.prix} $`}</span>
                          <span style={s.templateRating}>⭐ {t.rating}%</span>
                          <button style={s.previewBtn}>Aperçu →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Mono-produit */}
              <div style={s.sectionGroup}>
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>📦 Mono-produit</h2>
                  <p style={s.sectionDesc}>Idéal pour lancer un seul produit ou une campagne</p>
                </div>
                <div style={s.templatesGrid}>
                  {templates.filter(t => t.type === 'monoproduit').map((t, i) => (
                    <div key={t.id} className="template-card" style={{ ...s.templateCard, animationDelay: `${i * 0.05}s` }} onClick={() => navigate(`/template/${t.id}`)}>
                      <div style={s.templateImageWrap}>
                        <img src={t.image} alt={t.nom} className="template-img" style={s.templateImage} />
                        {t.nouveau && <span style={s.nouveauBadge}>NOUVEAU</span>}
                      </div>
                      <div style={s.templateInfo}>
                        <div style={s.templateHeader}>
                          <h3 style={s.templateName}>{t.nom}</h3>
                          <span style={{ ...s.typeBadge, background: getTypeBadgeColor(t.type) }}>{getTypeLabel(t.type)}</span>
                        </div>
                        <p style={s.templateDesc}>{t.description}</p>
                        <div style={s.templateFooter}>
                          <span style={s.templatePrix}>{t.prix === 0 ? 'Gratuit' : `${t.prix} $`}</span>
                          <span style={s.templateRating}>⭐ {t.rating}%</span>
                          <button style={s.previewBtn}>Aperçu →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Enchères */}
              <div style={s.sectionGroup}>
                <div style={s.sectionHeader}>
                  <h2 style={s.sectionTitle}>🔨 Plateformes d'enchères</h2>
                  <p style={s.sectionDesc}>Créez votre site d'enchères en temps réel</p>
                </div>
                <div style={s.templatesGrid}>
                  {templates.filter(t => t.type === 'enchere').map((t, i) => (
                    <div key={t.id} className="template-card" style={{ ...s.templateCard, animationDelay: `${i * 0.05}s` }} onClick={() => navigate(`/template/${t.id}`)}>
                      <div style={s.templateImageWrap}>
                        <img src={t.image} alt={t.nom} className="template-img" style={s.templateImage} />
                        {t.nouveau && <span style={s.nouveauBadge}>NOUVEAU</span>}
                      </div>
                      <div style={s.templateInfo}>
                        <div style={s.templateHeader}>
                          <h3 style={s.templateName}>{t.nom}</h3>
                          <span style={{ ...s.typeBadge, background: getTypeBadgeColor(t.type) }}>{getTypeLabel(t.type)}</span>
                        </div>
                        <p style={s.templateDesc}>{t.description}</p>
                        <div style={s.templateFooter}>
                          <span style={s.templatePrix}>{t.prix === 0 ? 'Gratuit' : `${t.prix} $`}</span>
                          <span style={s.templateRating}>⭐ {t.rating}%</span>
                          <button style={s.previewBtn}>Aperçu →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={s.templatesGrid}>
              {templatesFiltres.map((t, i) => (
                <div key={t.id} className="template-card" style={{ ...s.templateCard, animationDelay: `${i * 0.05}s` }} onClick={() => navigate(`/template/${t.id}`)}>
                  <div style={s.templateImageWrap}>
                    <img src={t.image} alt={t.nom} className="template-img" style={s.templateImage} />
                    {t.nouveau && <span style={s.nouveauBadge}>NOUVEAU</span>}
                    {t.prix === 0 && <span style={s.gratuitBadge}>GRATUIT</span>}
                  </div>
                  <div style={s.templateInfo}>
                    <div style={s.templateHeader}>
                      <h3 style={s.templateName}>{t.nom}</h3>
                      <span style={{ ...s.typeBadge, background: getTypeBadgeColor(t.type) }}>{getTypeLabel(t.type)}</span>
                    </div>
                    <p style={s.templateDesc}>{t.description}</p>
                    <div style={s.templateFooter}>
                      <span style={s.templatePrix}>{t.prix === 0 ? 'Gratuit' : `${t.prix} $`}</span>
                      <span style={s.templateRating}>⭐ {t.rating}%</span>
                      <button style={s.previewBtn}>Aperçu →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            <span style={s.footerLogoMark}>e</span>
            <span>VEND STUDIO</span>
          </div>
          <div style={s.footerLinks}>
            <a href="/templates">Templates</a>
            <a href="/catalogue">Catalogue</a>
            <a href="/blog">Blog</a>
            <a href="/support">Support</a>
          </div>
          <p style={s.footerCopy}>© 2026 e-Vend Studio — Créez votre boutique en ligne facilement</p>
        </div>
      </footer>
    </div>
  );
}

// Styles
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#000000', color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' },
  
  nav: { position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  navInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  logoMark: { fontSize: '24px', fontWeight: 800, background: 'linear-gradient(135deg, #f5a623, #e8900c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoText: { fontSize: '14px', fontWeight: 600, letterSpacing: '2px', color: '#fff' },
  navLinks: { display: 'flex', gap: '32px' },
  navLink: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' },
  navButtons: { display: 'flex', gap: '12px' },
  btnOutline: { padding: '8px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '30px', color: '#fff', fontSize: '14px', cursor: 'pointer' },
  btnPrimary: { padding: '8px 20px', background: '#f5a623', border: 'none', borderRadius: '30px', color: '#000', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  
  header: { padding: '120px 0 60px', background: `url(${PHOTOS.hero}) center/cover no-repeat`, position: 'relative', textAlign: 'center' },
  headerOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #000 0%, rgba(0,0,0,0.7) 100%)' },
  headerContent: { position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto', padding: '0 24px' },
  headerTitle: { fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, marginBottom: '16px' },
  accent: { color: '#f5a623' },
  headerSubtitle: { fontSize: '18px', color: 'rgba(255,255,255,0.6)' },
  
  mainContainer: { maxWidth: '1400px', margin: '0 auto', padding: '40px 24px', position: 'relative' },
  sidebar: { position: 'fixed', width: '260px', top: '130px', bottom: '40px', overflowY: 'auto' },
  filterSection: { marginBottom: '32px' },
  filterTitle: { fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  filterBtn: { padding: '8px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  filterBtnActive: { background: '#f5a623', color: '#000', borderColor: '#f5a623' },
  
  mainContent: { marginLeft: '280px', flex: 1 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  searchWrap: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px 16px', width: '280px' },
  searchIcon: { fontSize: '16px', marginRight: '10px' },
  searchInput: { background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', flex: 1 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  resultCount: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' },
  viewToggle: { display: 'flex', gap: '8px' },
  viewBtn: { padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '12px' },
  viewBtnActive: { background: '#f5a623', color: '#000', borderColor: '#f5a623' },
  
  sectionGroup: { marginBottom: '60px' },
  sectionHeader: { marginBottom: '24px' },
  sectionTitle: { fontSize: '26px', fontWeight: 700, marginBottom: '8px' },
  sectionBadge: { fontSize: '12px', background: 'rgba(245,166,35,0.15)', padding: '2px 10px', borderRadius: '20px', color: '#f5a623', marginLeft: '12px' },
  sectionDesc: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' },
  
  templatesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  templateCard: { background: '#111', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.08)' },
  templateImageWrap: { position: 'relative', aspectRatio: '1.2', overflow: 'hidden' },
  templateImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' },
  nouveauBadge: { position: 'absolute', top: '12px', right: '12px', background: '#f5a623', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 },
  gratuitBadge: { position: 'absolute', top: '12px', left: '12px', background: '#22c55e', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700 },
  templateInfo: { padding: '20px' },
  templateHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' },
  templateName: { fontSize: '18px', fontWeight: 700 },
  typeBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, color: '#fff' },
  templateDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '16px' },
  templateFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  templatePrix: { fontSize: '20px', fontWeight: 800, color: '#f5a623' },
  templateRating: { fontSize: '12px', color: 'rgba(255,255,255,0.6)' },
  previewBtn: { padding: '8px 16px', background: 'rgba(245,166,35,0.15)', border: 'none', borderRadius: '20px', color: '#f5a623', fontSize: '12px', cursor: 'pointer' },
  
  footer: { padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '20px' },
  footerInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 24px', textAlign: 'center' },
  footerLogo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' },
  footerLogoMark: { fontSize: '20px', fontWeight: 800, color: '#f5a623' },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '20px', flexWrap: 'wrap' },
  footerCopy: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' },
};