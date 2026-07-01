// src/pages/PageAccueil.tsx
// e-Vend Studio — Plateforme de création de boutiques en ligne simplifiée

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Photothèque libre de droits (Unsplash + Pexels via CDN)
const PHOTOS = {
  hero: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1600',
  template1: 'https://images.pexels.com/photos/4974914/pexels-photo-4974914.jpeg?auto=compress&cs=tinysrgb&w=800',
  template2: 'https://images.pexels.com/photos/5632397/pexels-photo-5632397.jpeg?auto=compress&cs=tinysrgb&w=800',
  template3: 'https://images.pexels.com/photos/6991226/pexels-photo-6991226.jpeg?auto=compress&cs=tinysrgb&w=800',
  template4: 'https://images.pexels.com/photos/4381392/pexels-photo-4381392.jpeg?auto=compress&cs=tinysrgb&w=800',
  dashboard: 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=1200',
  seller: 'https://images.pexels.com/photos/5647688/pexels-photo-5647688.jpeg?auto=compress&cs=tinysrgb&w=800',
  stripe: 'https://images.pexels.com/photos/4491459/pexels-photo-4491459.jpeg?auto=compress&cs=tinysrgb&w=800',
  domain: 'https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=800',
};

interface Template {
  id: number;
  nom: string;
  image: string;
  categorie: string;
}

export default function PageAccueil() {
  const navigate = useNavigate();
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // ✅ MÊME LOGIQUE QUE POUR LES TEMPLATES - OUVRE DANS UN NOUVEL ONGLET
  const ouvrirLogin = () => {
    window.open('/login', '_blank', 'noopener,noreferrer');
  };

  // ✅ NOUVEAU : Fonction pour ouvrir le blog dans un nouvel onglet
  const ouvrirBlog = () => {
    window.open('/blog', '_blank', 'noopener,noreferrer');
  };

  const ouvrirFaq = () => {
    window.open('/faq', '_blank', 'noopener,noreferrer');
  };

  const ouvrirDocuments = () => {
    window.open('/documents', '_blank', 'noopener,noreferrer');
  };

  const templates: Template[] = [
    { id: 1, nom: 'Minimalist Studio', image: PHOTOS.template1, categorie: 'Mode & Accessoires' },
    { id: 2, nom: 'Nature & Co', image: PHOTOS.template2, categorie: 'Artisanat / Maison' },
    { id: 3, nom: 'Tech Store', image: PHOTOS.template3, categorie: 'Électronique' },
    { id: 4, nom: 'Boutique Chic', image: PHOTOS.template4, categorie: 'Tendances' },
  ];

  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.backgroundPositionY = `${window.scrollY * 0.3}px`;
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,600;14..32,700;14..32,800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
        .slide-left { animation: slideInLeft 0.5s ease both; }
        .slide-right { animation: slideInRight 0.5s 0.15s ease both; }
        .scale-in { animation: scaleIn 0.4s ease both; }
        
        .template-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.3);
        }
        .template-card:hover .template-img {
          transform: scale(1.05);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.3);
        }
        .nav-link:hover { color: #f5a623 !important; }
        
        @media (max-width: 768px) {
          .hamburger { display: flex !important; }
          .nav-desktop { display: none !important; }
          .slide-left, .slide-right { animation: fadeUp 0.5s both; }
          .templates-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 36px !important; }
        }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      {/* ═══════════════ SLIDE 1: NAVIGATION ═══════════════ */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.logo} onClick={() => navigate('/')}>
            <span style={s.logoMark}>e</span>
            <span style={s.logoMarkUnion}>⨀</span>
            <span style={s.logoText}>VEND STUDIO</span>
          </div>

          <div className="nav-desktop" style={s.navLinks}>
            <a href="#templates" style={s.navLink} onClick={(e) => { e.preventDefault(); document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' }); }}>Templates</a>
            <a href="#features" style={s.navLink} onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Fonctionnalités</a>
            <a href="#prix" style={s.navLink} onClick={(e) => { e.preventDefault(); document.getElementById('prix')?.scrollIntoView({ behavior: 'smooth' }); }}>Tarifs</a>
            {/* ✅ MODIFICATION ICI - Blog s'ouvre dans un nouvel onglet */}
            <button onClick={ouvrirBlog} style={{ ...s.navLink, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>Blog</button>
            <button onClick={ouvrirFaq} style={{ ...s.navLink, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>FAQ</button>
            <button onClick={ouvrirDocuments} style={{ ...s.navLink, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px' }}>Documents</button>
          </div>

          <div className="nav-desktop" style={s.navButtons}>
            <button style={s.btnOutline} onClick={ouvrirLogin}>Connexion</button>
            <button style={s.btnPrimary} onClick={ouvrirLogin}>Commencer →</button>
          </div>

          <button
            className="hamburger"
            onClick={() => setMenuMobileOuvert(!menuMobileOuvert)}
            style={{ display: 'none', background: 'none', border: 'none', fontSize: '28px', color: '#fff', cursor: 'pointer' }}
          >
            {menuMobileOuvert ? '✕' : '☰'}
          </button>
        </div>

        {menuMobileOuvert && (
          <div style={s.mobileMenu}>
            <a href="#templates" style={s.mobileLink} onClick={(e) => { e.preventDefault(); document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' }); setMenuMobileOuvert(false); }}>Templates</a>
            <a href="#features" style={s.mobileLink} onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); setMenuMobileOuvert(false); }}>Fonctionnalités</a>
            <a href="#prix" style={s.mobileLink} onClick={(e) => { e.preventDefault(); document.getElementById('prix')?.scrollIntoView({ behavior: 'smooth' }); setMenuMobileOuvert(false); }}>Tarifs</a>
            {/* ✅ MODIFICATION ICI - Blog s'ouvre dans un nouvel onglet dans menu mobile */}
            <button onClick={() => { ouvrirBlog(); setMenuMobileOuvert(false); }} style={{ ...s.mobileLink, background: 'none', border: 'none', textAlign: 'left', fontSize: '16px', cursor: 'pointer' }}>Blog</button>
            <button onClick={() => { ouvrirFaq(); setMenuMobileOuvert(false); }} style={{ ...s.mobileLink, background: 'none', border: 'none', textAlign: 'left', fontSize: '16px', cursor: 'pointer' }}>FAQ</button>
            <button onClick={() => { ouvrirDocuments(); setMenuMobileOuvert(false); }} style={{ ...s.mobileLink, background: 'none', border: 'none', textAlign: 'left', fontSize: '16px', cursor: 'pointer' }}>Documents</button>
            <button style={s.btnOutlineMobile} onClick={ouvrirLogin}>Connexion</button>
            <button style={s.btnPrimaryMobile} onClick={ouvrirLogin}>Commencer</button>
          </div>
        )}
      </nav>

      {/* ═══════════════ SLIDE 2: HERO ═══════════════ */}
      <section ref={heroRef} style={s.hero}>
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <div className="fade-up" style={s.heroBadge}>✨ Lancez votre boutique en 5 minutes</div>
          <h1 className="fade-up-1" style={s.heroTitle}>
            Créez votre<br />
            <span style={s.heroAccent}>boutique en ligne</span>
          </h1>
          <p className="fade-up-2" style={s.heroSubtitle}>
            e-Vend Studio est la plateforme la plus simple pour vendre en ligne.<br />
            Choisissez un template, personnalisez-le, et commencez à vendre.
          </p>
          <div className="fade-up-3" style={s.heroButtons}>
            <button style={s.btnPrimaryLarge} onClick={ouvrirLogin}>
              Commencer gratuitement →
            </button>
            <button style={s.btnOutlineLarge} onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}>
              Voir les templates
            </button>
          </div>
          <div className="fade-up-3" style={s.heroStats}>
            <span>⭐ 4.9/5</span>
            <span>🔥 +10k boutiques</span>
            <span>🇨🇦 100% canadien</span>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 3: TEMPLATES (comme Shopify) ═══════════════ */}
      <section id="templates" style={s.slide}>
        <div style={s.container}>
          <div style={s.slideHeader}>
            <span style={s.slideBadge}>Templates</span>
            <h2 style={s.slideTitle}>Des designs <span style={s.accent}>professionnels</span></h2>
            <p style={s.slideSubtitle}>Choisissez parmi nos templates modernes et personnalisez-les</p>
          </div>

          <div className="templates-grid" style={s.templatesGrid}>
            {templates.map((t, i) => (
              <div
                key={t.id}
                className="template-card"
                style={{ ...s.templateCard, animationDelay: `${i * 0.1}s` }}
                onClick={ouvrirLogin}
              >
                <div style={s.templateImageWrap}>
                  <img src={t.image} alt={t.nom} className="template-img" style={s.templateImage} />
                  <span style={s.templateBadge}>{t.categorie}</span>
                </div>
                <div style={s.templateInfo}>
                  <h3 style={s.templateName}>{t.nom}</h3>
                  <button style={s.templateBtn}>Personnaliser →</button>
                </div>
              </div>
            ))}
          </div>

          <div style={s.templatesCta}>
            <button 
              style={s.btnSecondaryLarge} 
              onClick={() => window.open('/templates', '_blank', 'noopener,noreferrer')}
              title="Ouvrir dans un nouvel onglet"
            >
              Voir tous les templates (24) ↗
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 4: PERSONNALISATION (couleurs + photos) ═══════════════ */}
      <section id="features" style={{ ...s.slide, background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)' }}>
        <div style={s.container}>
          <div style={s.twoColumns}>
            <div className="slide-left" style={s.featureText}>
              <span style={s.slideBadge}>Personnalisation</span>
              <h2 style={s.slideTitle}>Modifiez <span style={s.accent}>couleurs et photos</span></h2>
              <p style={s.featureDesc}>
                Aucune compétence technique requise. Changez les couleurs, ajoutez vos photos,
                modifiez les polices — tout est intuitif et instantané.
              </p>
              <ul style={s.featureList}>
                <li>🎨 Thèmes de couleurs illimités</li>
                <li>📸 Bibliothèque d'images intégrée</li>
                <li>✏️ Éditeur glisser-déposer</li>
                <li>📱 Responsive sur mobile/tablette</li>
              </ul>
            </div>
            <div className="slide-right" style={s.featureImage}>
              <img src={PHOTOS.dashboard} alt="Personnalisation" style={s.mockupImage} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 5: DOMAINE + STRIPE ═══════════════ */}
      <section style={s.slide}>
        <div style={s.container}>
          <div style={{ ...s.twoColumns, flexDirection: 'row-reverse' }}>
            <div className="slide-left" style={s.featureText}>
              <span style={s.slideBadge}>Professionnel</span>
              <h2 style={s.slideTitle}>Votre <span style={s.accent}>domaine</span> + <span style={s.accent}>Stripe</span></h2>
              <p style={s.featureDesc}>
                Utilisez votre propre nom de domaine (ex: maboutique.com) et connectez votre compte Stripe
                pour recevoir vos paiements directement.
              </p>
              <ul style={s.featureList}>
                <li>🌐 Domaine personnalisé inclus</li>
                <li>💳 Paiements Stripe intégrés</li>
                <li>💰 Virement automatique vers votre compte</li>
                <li>🔒 Transactions sécurisées</li>
              </ul>
            </div>
            <div className="slide-right" style={s.featureImage}>
              <div style={s.doubleImage}>
                <img src={PHOTOS.domain} alt="Domaine" style={s.smallImage} />
                <img src={PHOTOS.stripe} alt="Stripe" style={s.smallImage} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 6: FONCTIONNALITÉS CLÉS ═══════════════ */}
      <section style={{ ...s.slide, background: '#0a0a0a' }}>
        <div style={s.container}>
          <div style={s.slideHeader}>
            <span style={s.slideBadge}>Tout compris</span>
            <h2 style={s.slideTitle}>Ce que vous <span style={s.accent}>obtenez</span></h2>
            <p style={s.slideSubtitle}>Une plateforme complète pour vendre en ligne</p>
          </div>

          <div className="features-grid" style={s.featuresGrid}>
            {[
              { emoji: '🎨', title: 'Templates pro', desc: 'Designs modernes prêts à l\'emploi' },
              { emoji: '🌈', title: 'Personnalisation', desc: 'Couleurs, photos, polices' },
              { emoji: '🌐', title: 'Domaine personnalisé', desc: 'Votre marque, votre adresse' },
              { emoji: '💳', title: 'Stripe intégré', desc: 'Paiements sécurisés' },
              { emoji: '📦', title: 'Gestion des stocks', desc: 'Suivez vos inventaires' },
              { emoji: '📊', title: 'Tableau de bord', desc: 'Statistiques et analyses' },
              { emoji: '🚚', title: 'Calculs de livraison', desc: 'Tarifs automatiques' },
              { emoji: '💬', title: 'Support client', desc: 'Assistance 7j/7' },
            ].map((f, i) => (
              <div key={f.title} className="scale-in" style={{ ...s.featureCard, animationDelay: `${i * 0.05}s` }}>
                <div style={s.featureIcon}>{f.emoji}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureCardDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 7: TÉMOIGNAGE VENDEUR ═══════════════ */}
      <section style={s.slide}>
        <div style={s.container}>
          <div style={s.testimonial}>
            <div style={s.testimonialImage}>
              <img src={PHOTOS.seller} alt="Vendeur" style={s.testimonialImg} />
            </div>
            <div style={s.testimonialText}>
              <span style={s.quoteIcon}>“</span>
              <p style={s.testimonialQuote}>
                J'ai monté ma boutique e-Vend Studio en une heure. Les templates sont magnifiques,
                l'édition est super facile, et Stripe fonctionne parfaitement. Je recommande !
              </p>
              <p style={s.testimonialAuthor}>— Marie Cloutier, Artisane à Québec</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 8: TARIFS (optionnel / style PowerPoint) ═══════════════ */}
      <section id="prix" style={{ ...s.slide, background: '#0a0a0a' }}>
        <div style={s.container}>
          <div style={s.slideHeader}>
            <span style={s.slideBadge}>Tarifs</span>
            <h2 style={s.slideTitle}>Des prix <span style={s.accent}>simples</span></h2>
            <p style={s.slideSubtitle}>Sans frais cachés. Annulable à tout moment.</p>
          </div>

          <div style={s.pricingGrid}>
            <div style={s.pricingCard}>
              <h3 style={s.pricingName}>Gratuit</h3>
              <div style={s.pricingPrice}>0<small style={s.pricingPeriod}>$/mois</small></div>
              <ul style={s.pricingList}>
                <li>✓ 1 boutique</li>
                <li>✓ Template de base</li>
                <li>✓ 10 produits max</li>
                <li>✓ Domaine e-vend.studio</li>
              </ul>
              <button style={s.btnOutline} onClick={ouvrirLogin}>Commencer</button>
            </div>
            <div style={{ ...s.pricingCard, ...s.pricingCardFeatured }}>
              <span style={s.popularBadge}>Populaire</span>
              <h3 style={s.pricingName}>Pro</h3>
              <div style={s.pricingPrice}>19<small style={s.pricingPeriod}>$/mois</small></div>
              <ul style={s.pricingList}>
                <li>✓ Boutiques illimitées</li>
                <li>✓ Tous les templates</li>
                <li>✓ Produits illimités</li>
                <li>✓ Domaine personnalisé</li>
                <li>✓ Stripe connecté</li>
                <li>✓ Support prioritaire</li>
              </ul>
              <button style={s.btnPrimary} onClick={ouvrirLogin}>Commencer l'essai 14j →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 9: CTA FINAL ═══════════════ */}
      <section style={s.ctaSlide}>
        <div style={s.ctaOverlay} />
        <div style={s.ctaContent}>
          <h2 style={s.ctaTitle}>Prêt à lancer votre boutique ?</h2>
          <p style={s.ctaSubtitle}>Rejoignez des milliers de vendeurs canadiens sur e-Vend Studio</p>
          <button style={s.btnPrimaryCta} onClick={ouvrirLogin}>
            Créer ma boutique gratuitement →
          </button>
          <p style={s.ctaNote}>Aucune carte de crédit requise pour l'essai</p>
        </div>
      </section>

      {/* ═══════════════ SLIDE 10: FOOTER ═══════════════ */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>
            <span style={s.footerLogoMark}>e</span>
            <span style={s.footerLogoUnion}>⨀</span>
            <span>VEND STUDIO</span>
          </div>
          <div style={s.footerLinks}>
            <a href="#templates" onClick={(e) => { e.preventDefault(); document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' }); }}>Templates</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Fonctionnalités</a>
            <a href="#prix" onClick={(e) => { e.preventDefault(); document.getElementById('prix')?.scrollIntoView({ behavior: 'smooth' }); }}>Tarifs</a>
            {/* ✅ MODIFICATION ICI - Blog s'ouvre dans un nouvel onglet dans le footer */}
            <button onClick={ouvrirBlog} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Blog</button>
            <button onClick={ouvrirFaq} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>FAQ</button>
            <button onClick={ouvrirDocuments} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Documents</button>
            <button onClick={() => window.open('/contact', '_blank', 'noopener,noreferrer')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Contact</button>
            <button onClick={() => window.open('/politiques/conditions-utilisation', '_blank', 'noopener,noreferrer')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Nos Politiques</button>
          </div>
          <div style={s.socialIcons}>
            <span>📘</span> <span>📷</span> <span>🐦</span>
          </div>
          <p style={s.footerCopy}>© 2026 e-Vend Studio — La solution de boutique en ligne 100% canadienne</p>
        </div>
      </footer>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#000000', color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' },

  // Navigation
  nav: { position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  navInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  logoMark: { fontSize: '24px', fontWeight: 800, background: 'linear-gradient(135deg, #f5a623, #e8900c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: "'Inter', sans-serif" },
  logoMarkUnion: { fontSize: '10px', color: '#3b82f6', marginLeft: '-2px', marginRight: '2px', display: 'inline-block', transform: 'translateY(-2px)' },
  logoText: { fontSize: '14px', fontWeight: 600, letterSpacing: '2px', color: '#fff' },
  navLinks: { display: 'flex', gap: '32px' },
  navLink: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s', cursor: 'pointer' },
  navButtons: { display: 'flex', gap: '12px' },
  btnOutline: { padding: '8px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '30px', color: '#fff', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' },
  btnPrimary: { padding: '8px 20px', background: '#f5a623', border: 'none', borderRadius: '30px', color: '#000', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  mobileMenu: { position: 'absolute', top: '70px', left: 0, right: 0, background: '#000', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  mobileLink: { color: '#fff', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' },
  btnOutlineMobile: { padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', cursor: 'pointer' },
  btnPrimaryMobile: { padding: '12px', background: '#f5a623', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 600, cursor: 'pointer' },

  // Hero
  hero: { minHeight: '100vh', background: `url(${PHOTOS.hero}) center/cover no-repeat`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 100%)' },
  heroContent: { position: 'relative', zIndex: 2, maxWidth: '800px', padding: '0 24px' },
  heroBadge: { display: 'inline-block', padding: '6px 16px', background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '30px', fontSize: '13px', color: '#f5a623', marginBottom: '24px' },
  heroTitle: { fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em' },
  heroAccent: { color: '#f5a623' },
  heroSubtitle: { fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '32px' },
  heroButtons: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' },
  btnPrimaryLarge: { padding: '14px 32px', background: '#f5a623', border: 'none', borderRadius: '40px', color: '#000', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  btnOutlineLarge: { padding: '14px 32px', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', color: '#fff', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' },
  heroStats: { display: 'flex', gap: '24px', justifyContent: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.5)' },

  // Slides génériques
  slide: { padding: '100px 0' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px' },
  slideHeader: { textAlign: 'center', marginBottom: '56px' },
  slideBadge: { display: 'inline-block', padding: '4px 12px', background: 'rgba(245,166,35,0.1)', borderRadius: '20px', fontSize: '12px', color: '#f5a623', marginBottom: '16px' },
  slideTitle: { fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, marginBottom: '12px' },
  accent: { color: '#f5a623' },
  slideSubtitle: { fontSize: '16px', color: 'rgba(255,255,255,0.6)' },

  // Templates
  templatesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' },
  templateCard: { background: '#111', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid rgba(255,255,255,0.08)' },
  templateImageWrap: { position: 'relative', aspectRatio: '1', overflow: 'hidden' },
  templateImage: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' },
  templateBadge: { position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', color: '#f5a623' },
  templateInfo: { padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  templateName: { fontSize: '16px', fontWeight: 600 },
  templateBtn: { padding: '8px 16px', background: 'rgba(245,166,35,0.15)', border: 'none', borderRadius: '20px', color: '#f5a623', fontSize: '12px', cursor: 'pointer' },
  templatesCta: { textAlign: 'center' },
  btnSecondaryLarge: { padding: '14px 32px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', color: '#fff', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s' },

  // Two columns
  twoColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' },
  featureText: { textAlign: 'left' },
  featureDesc: { fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '24px' },
  featureList: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
  featureImage: { textAlign: 'center' },
  mockupImage: { width: '100%', maxWidth: '450px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  doubleImage: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  smallImage: { width: '180px', height: '180px', objectFit: 'cover', borderRadius: '20px' },

  // Features grid
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' },
  featureCard: { padding: '24px', background: '#111', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' },
  featureIcon: { fontSize: '36px', marginBottom: '16px' },
  featureTitle: { fontSize: '18px', fontWeight: 600, marginBottom: '8px' },
  featureCardDesc: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' },

  // Testimonial
  testimonial: { display: 'flex', gap: '48px', alignItems: 'center', background: '#111', borderRadius: '24px', padding: '48px', border: '1px solid rgba(255,255,255,0.06)' },
  testimonialImage: { flexShrink: 0 },
  testimonialImg: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' },
  testimonialText: { flex: 1 },
  quoteIcon: { fontSize: '60px', color: '#f5a623', opacity: 0.5, fontFamily: 'Georgia, serif', lineHeight: 1 },
  testimonialQuote: { fontSize: '20px', lineHeight: 1.6, marginBottom: '16px', fontStyle: 'italic' },
  testimonialAuthor: { fontSize: '14px', color: '#f5a623' },

  // Pricing
  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px', maxWidth: '800px', margin: '0 auto' },
  pricingCard: { background: '#111', borderRadius: '24px', padding: '32px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' },
  pricingCardFeatured: { border: '1px solid #f5a623', transform: 'scale(1.02)' },
  popularBadge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#f5a623', color: '#000', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  pricingName: { fontSize: '20px', fontWeight: 600, marginBottom: '16px' },
  pricingPrice: { fontSize: '48px', fontWeight: 800, marginBottom: '24px' },
  pricingPeriod: { fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.5)' },
  pricingList: { listStyle: 'none', padding: 0, marginBottom: '32px', textAlign: 'left', fontSize: '14px', color: 'rgba(255,255,255,0.7)' },

  // CTA final
  ctaSlide: { padding: '120px 0', background: `url(${PHOTOS.hero}) center/cover fixed`, position: 'relative' },
  ctaOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #000 0%, rgba(245,166,35,0.2) 100%)' },
  ctaContent: { position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '700px', margin: '0 auto', padding: '0 24px' },
  ctaTitle: { fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, marginBottom: '16px' },
  ctaSubtitle: { fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' },
  btnPrimaryCta: { padding: '16px 40px', background: '#f5a623', border: 'none', borderRadius: '60px', color: '#000', fontSize: '18px', fontWeight: 700, cursor: 'pointer', marginBottom: '20px' },
  ctaNote: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' },

  // Footer
  footer: { padding: '48px 0', borderTop: '1px solid rgba(255,255,255,0.06)' },
  footerInner: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' },
  footerLogo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '24px' },
  footerLogoMark: { fontSize: '20px', fontWeight: 800, background: 'linear-gradient(135deg, #f5a623, #e8900c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  footerLogoUnion: { fontSize: '8px', color: '#3b82f6', marginLeft: '-1px', marginRight: '1px', display: 'inline-block', transform: 'translateY(-1px)' },
  footerLinks: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' },
  socialIcons: { display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '20px', marginBottom: '24px' },
  footerCopy: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' },
};