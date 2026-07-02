// src/templates/multivendeur/MVPremiumDocuments.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Documents / Guides

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = '/api';

interface DocumentPage {
  slug: string;
  titre: string;
  contenu: string;
  updated_at?: string;
}

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
}

const DEMO_DOCUMENTS: DocumentPage[] = [
  { slug:'guide-achat', titre:'Guide achat', contenu:'<h2>Comment acheter sur notre marketplace</h2><p>Notre plateforme reunit des dizaines de vendeurs independants offrant des produits varies. Voici comment proceder pour effectuer un achat en toute confiance.</p><h3>1. Trouvez votre produit</h3><p>Utilisez le catalogue ou les boutiques pour explorer les produits disponibles. Vous pouvez filtrer par categorie, prix et disponibilite.</p><h3>2. Verifiez le vendeur</h3><p>Chaque boutique affiche ses points de confiance et le nombre de produits vendus. Consultez la description de la boutique avant achat.</p><h3>3. Ajoutez au panier</h3><p>Cliquez sur Ajouter au panier depuis la fiche produit, puis procedez au paiement securise.</p><blockquote>Tous les paiements sont securises et proteges.</blockquote>', updated_at:new Date().toISOString() },
  { slug:'devenir-vendeur', titre:'Devenir vendeur', contenu:'<h2>Rejoignez notre communaute de vendeurs</h2><p>Vous avez des produits a vendre ? Notre marketplace vous permet de creer votre propre boutique en quelques minutes.</p><h3>Avantages</h3><ul><li>Visibilite aupres de milliers acheteurs</li><li>Outils de gestion simples et efficaces</li><li>Support dedie pour les vendeurs</li><li>Systeme enchere integre</li></ul><p>Pour commencer, contactez notre equipe via la page Contact.</p>', updated_at:new Date().toISOString() },
  { slug:'faq-livraison', titre:'FAQ Livraison', contenu:'<h2>Questions frequentes sur la livraison</h2><h3>Quels sont les delais de livraison ?</h3><p>Les delais varient selon le vendeur, generalement entre 2 et 7 jours ouvrables.</p><h3>Puis-je ramasser en boutique ?</h3><p>Certains vendeurs offrent le ramassage en personne. Verifiez la fiche produit pour cette option.</p><h3>Que faire si mon colis est endommage ?</h3><p>Contactez directement le vendeur via notre systeme de messagerie pour organiser un retour ou un remboursement.</p>', updated_at:new Date().toISOString() },
];

function Navbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const nom = config?.nom_boutique || 'Ma Marketplace';
  return (
    <nav style={s.nav}>
      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page:'accueil' })}>
          <div style={s.logoIcon}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => naviguer({ page:'accueil' })}>Accueil</span>
          <span style={s.navLink} onClick={() => naviguer({ page:'catalogue' })}>Catalogue</span>
          <span style={s.navLink} onClick={() => naviguer({ page:'boutiques' })}>Boutiques</span>
        </div>
      </div>
    </nav>
  );
}

export default function MVPremiumDocuments({ vendeurId, isDemo, config = {}, naviguer }: Props) {
  const gId = vendeurId || config.gestionnaire_id;
  const couleurAccent = config.couleur_accent || '#fbbf24';

  const [documents, setDocuments] = useState<DocumentPage[]>([]);
  const [docActif, setDocActif] = useState<DocumentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOuvert, setDrawerOuvert] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setDocuments(DEMO_DOCUMENTS);
      setDocActif(DEMO_DOCUMENTS[0]);
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/gestionnaires/${gId}/documents`)
      .then(r => r.ok ? r.json() : { documents: [] })
      .then(d => {
        const docs = d.documents || d || [];
        setDocuments(docs);
        if (docs.length > 0) setDocActif(docs[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gId, isDemo]);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .doc-contenu h2 { font-family:'Syne',sans-serif; font-size:1.35rem; color:rgba(255,255,255,0.92); border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.4em; margin:1.4em 0 0.6em; }
        .doc-contenu h3 { font-family:'Syne',sans-serif; font-size:1.1rem; color:${couleurAccent}; margin:1.2em 0 0.5em; }
        .doc-contenu p { color:rgba(255,255,255,0.72); line-height:1.8; margin-bottom:1.1em; font-size:0.97rem; }
        .doc-contenu ul, .doc-contenu ol { color:rgba(255,255,255,0.72); padding-left:1.6em; margin-bottom:1.1em; }
        .doc-contenu li { margin-bottom:0.45em; line-height:1.7; }
        .doc-contenu blockquote { border-left:3px solid ${couleurAccent}; padding:0.6em 1.2em; margin:1.2em 0; background:${couleurAccent}10; border-radius:0 8px 8px 0; color:rgba(255,255,255,0.65); font-style:italic; }
        .doc-link:hover { color:${couleurAccent} !important; background:${couleurAccent}12 !important; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      {/* Drawer mobile */}
      {drawerOuvert && (
        <div onClick={() => setDrawerOuvert(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:280, background:'#111', height:'100%', overflowY:'auto', padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <p style={{ color:'#fff', fontWeight:800, margin:0 }}>Documents</p>
              <button onClick={() => setDrawerOuvert(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            {documents.map(d => (
              <div key={d.slug} onClick={() => { setDocActif(d); setDrawerOuvert(false); }}
                style={{ padding:'10px 12px', borderRadius:8, cursor:'pointer', color: docActif?.slug === d.slug ? couleurAccent : 'rgba(255,255,255,0.7)', background: docActif?.slug === d.slug ? `${couleurAccent}15` : 'transparent', fontSize:14, marginBottom:4 }}>
                {d.titre}
              </div>
            ))}
          </div>
        </div>
      )}

      <main style={s.main}>
        <div style={s.layout}>
          {/* Sidebar desktop */}
          <aside style={s.sidebar}>
            <p style={s.sidebarTitre}>Documents & Guides</p>
            {documents.map(d => (
              <div key={d.slug} className="doc-link" onClick={() => setDocActif(d)}
                style={{ padding:'10px 14px', borderRadius:10, cursor:'pointer', color: docActif?.slug === d.slug ? couleurAccent : 'rgba(255,255,255,0.65)', background: docActif?.slug === d.slug ? `${couleurAccent}12` : 'transparent', fontSize:14, fontWeight: docActif?.slug === d.slug ? 700 : 500, marginBottom:4, transition:'all 0.15s', borderLeft: docActif?.slug === d.slug ? `3px solid ${couleurAccent}` : '3px solid transparent' }}>
                {d.titre}
              </div>
            ))}
          </aside>

          {/* Contenu */}
          <article style={s.article}>
            <button onClick={() => setDrawerOuvert(true)} style={s.btnMobileMenu}>☰ Documents</button>

            {loading ? (
              <div style={{ color:'rgba(255,255,255,0.4)' }}>Chargement...</div>
            ) : !docActif ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📄</div>
                <p style={{ color:'rgba(255,255,255,0.5)' }}>Aucun document disponible</p>
              </div>
            ) : (
              <>
                <div style={s.breadcrumb}>
                  <span onClick={() => naviguer({ page:'accueil' })} style={s.breadcrumbLink}>Accueil</span>
                  <span style={s.breadcrumbSep}>›</span>
                  <span style={{ color:'#fff' }}>{docActif.titre}</span>
                </div>
                <h1 style={s.titre}>{docActif.titre}</h1>
                {docActif.updated_at && (
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:24 }}>
                    Mis a jour le {new Date(docActif.updated_at).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}
                  </p>
                )}
                <div className="doc-contenu" dangerouslySetInnerHTML={{ __html: docActif.contenu }} />
              </>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:     { minHeight:'100vh', background:'#0a0a0a', color:'#fff', fontFamily:"'DM Sans',sans-serif" },
  nav:      { position:'sticky', top:0, zIndex:100, background:'rgba(10,10,10,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth:1280, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', gap:32 },
  navLogo:  { display:'flex', alignItems:'center', gap:10, cursor:'pointer' },
  logoIcon: { width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#fbbf24,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:'#000' },
  logoText: { fontSize:18, fontWeight:800, color:'#fff', fontFamily:"'Syne',sans-serif" },
  navLinks: { display:'flex', gap:24 },
  navLink:  { color:'rgba(255,255,255,0.7)', fontSize:14, cursor:'pointer' },
  main:     { padding:'40px 0 80px' },
  layout:   { maxWidth:1100, margin:'0 auto', padding:'0 24px', display:'grid', gridTemplateColumns:'240px 1fr', gap:40, alignItems:'start' },
  sidebar:  { position:'sticky', top:84, display:'flex', flexDirection:'column' },
  sidebarTitre: { fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px' },
  article:  { minWidth:0 },
  btnMobileMenu: { display:'none', padding:'8px 16px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', marginBottom:20, fontFamily:'inherit' },
  breadcrumb: { display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' },
  breadcrumbLink: { fontSize:13, color:'rgba(255,255,255,0.45)', cursor:'pointer' },
  breadcrumbSep:  { fontSize:13, color:'rgba(255,255,255,0.25)' },
  titre:    { fontFamily:"'Syne',sans-serif", fontSize:'clamp(24px,3vw,34px)', fontWeight:800, marginBottom:8 },
};