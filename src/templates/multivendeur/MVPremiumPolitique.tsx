// src/templates/multivendeur/MVPremiumPolitique.tsx
// e-Vend Studio — Template Multi-Vendeur Premium — Politiques

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = '/api';

interface PolitiquePage {
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
  politiqueSlug?: string;
}

const DEMO_POLITIQUES: PolitiquePage[] = [
  { slug:'confidentialite', titre:'Politique de confidentialite', contenu:'<h2>Collecte des renseignements</h2><p>Nous recueillons les renseignements personnels necessaires au traitement de vos commandes : nom, adresse, courriel et informations de paiement.</p><h2>Utilisation des donnees</h2><p>Vos donnees sont utilisees uniquement pour le traitement des commandes, la communication avec les vendeurs et amelioration de nos services.</p><h2>Partage avec des tiers</h2><p>Nous ne vendons jamais vos donnees personnelles. Elles peuvent etre partagees avec les vendeurs concernes uniquement pour completer une transaction.</p><h2>Vos droits</h2><p>Vous pouvez demander acces, correction ou suppression de vos donnees personnelles en tout temps en nous contactant.</p>', updated_at:new Date().toISOString() },
  { slug:'conditions-utilisation', titre:'Conditions utilisation', contenu:'<h2>Acceptation des conditions</h2><p>En utilisant cette plateforme, vous acceptez les presentes conditions utilisation dans leur integralite.</p><h2>Comptes utilisateurs</h2><p>Vous etes responsable de la confidentialite de votre compte et de toutes les activites qui y sont associees.</p><h2>Conduite des utilisateurs</h2><ul><li>Aucun contenu illegal ou frauduleux</li><li>Respect des autres utilisateurs et vendeurs</li><li>Informations exactes lors des transactions</li></ul><h2>Limitation de responsabilite</h2><p>La plateforme agit comme intermediaire entre acheteurs et vendeurs independants.</p>', updated_at:new Date().toISOString() },
  { slug:'remboursement', titre:'Politique de remboursement', contenu:'<h2>Delai de retour</h2><p>Vous disposez de 14 jours suivant la reception pour demander un retour, sauf indication contraire du vendeur.</p><h2>Conditions</h2><p>Le produit doit etre retourne dans son etat original, non utilise et dans son emballage origine.</p><h2>Procedure</h2><p>Contactez directement le vendeur via notre systeme de messagerie pour initier une demande de retour.</p><blockquote>Les frais de retour sont generalement a la charge de acheteur, sauf en cas de produit defectueux.</blockquote>', updated_at:new Date().toISOString() },
  { slug:'expedition', titre:'Politique expedition', contenu:'<h2>Delais de livraison</h2><p>Les delais varient selon le vendeur et la destination, generalement entre 2 et 10 jours ouvrables au Canada.</p><h2>Frais de livraison</h2><p>Les frais sont calcules par chaque vendeur en fonction du poids, des dimensions et de la destination.</p><h2>Suivi de commande</h2><p>Un numero de suivi vous sera fourni par courriel des que votre commande sera expediee.</p>', updated_at:new Date().toISOString() },
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

export default function MVPremiumPolitique({ vendeurId, isDemo, config = {}, naviguer, politiqueSlug }: Props) {
  const gId = vendeurId || config.gestionnaire_id;
  const couleurAccent = config.couleur_accent || '#fbbf24';

  const [politiques, setPolitiques] = useState<PolitiquePage[]>([]);
  const [politiqueActive, setPolitiqueActive] = useState<PolitiquePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOuvert, setDrawerOuvert] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setPolitiques(DEMO_POLITIQUES);
      const trouvee = politiqueSlug ? DEMO_POLITIQUES.find(p => p.slug === politiqueSlug) : null;
      setPolitiqueActive(trouvee || DEMO_POLITIQUES[0]);
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/gestionnaires/${gId}/politiques`)
      .then(r => r.ok ? r.json() : { politiques: [] })
      .then(d => {
        const pols = d.politiques || d || [];
        setPolitiques(pols);
        const trouvee = politiqueSlug ? pols.find((p: PolitiquePage) => p.slug === politiqueSlug) : null;
        setPolitiqueActive(trouvee || pols[0] || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gId, isDemo, politiqueSlug]);

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .pol-contenu h2 { font-family:'Syne',sans-serif; font-size:1.3rem; color:rgba(255,255,255,0.92); margin:1.4em 0 0.5em; }
        .pol-contenu p { color:rgba(255,255,255,0.72); line-height:1.8; margin-bottom:1.1em; font-size:0.96rem; }
        .pol-contenu ul, .pol-contenu ol { color:rgba(255,255,255,0.72); padding-left:1.6em; margin-bottom:1.1em; }
        .pol-contenu li { margin-bottom:0.4em; line-height:1.7; }
        .pol-contenu blockquote { border-left:3px solid ${couleurAccent}; padding:0.6em 1.2em; margin:1.2em 0; background:${couleurAccent}10; border-radius:0 8px 8px 0; color:rgba(255,255,255,0.6); font-style:italic; font-size:0.9rem; }
        .pol-link:hover { color:${couleurAccent} !important; background:${couleurAccent}12 !important; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      {drawerOuvert && (
        <div onClick={() => setDrawerOuvert(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:300 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:280, background:'#111', height:'100%', overflowY:'auto', padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <p style={{ color:'#fff', fontWeight:800, margin:0 }}>Politiques</p>
              <button onClick={() => setDrawerOuvert(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            {politiques.map(p => (
              <div key={p.slug} onClick={() => { setPolitiqueActive(p); setDrawerOuvert(false); }}
                style={{ padding:'10px 12px', borderRadius:8, cursor:'pointer', color: politiqueActive?.slug === p.slug ? couleurAccent : 'rgba(255,255,255,0.7)', background: politiqueActive?.slug === p.slug ? `${couleurAccent}15` : 'transparent', fontSize:14, marginBottom:4 }}>
                {p.titre}
              </div>
            ))}
          </div>
        </div>
      )}

      <main style={s.main}>
        <div style={s.layout}>
          <aside style={s.sidebar}>
            <p style={s.sidebarTitre}>Politiques legales</p>
            {politiques.map(p => (
              <div key={p.slug} className="pol-link" onClick={() => setPolitiqueActive(p)}
                style={{ padding:'10px 14px', borderRadius:10, cursor:'pointer', color: politiqueActive?.slug === p.slug ? couleurAccent : 'rgba(255,255,255,0.65)', background: politiqueActive?.slug === p.slug ? `${couleurAccent}12` : 'transparent', fontSize:14, fontWeight: politiqueActive?.slug === p.slug ? 700 : 500, marginBottom:4, transition:'all 0.15s', borderLeft: politiqueActive?.slug === p.slug ? `3px solid ${couleurAccent}` : '3px solid transparent' }}>
                {p.titre}
              </div>
            ))}
          </aside>

          <article style={s.article}>
            <button onClick={() => setDrawerOuvert(true)} style={s.btnMobileMenu}>☰ Politiques</button>

            {loading ? (
              <div style={{ color:'rgba(255,255,255,0.4)' }}>Chargement...</div>
            ) : !politiqueActive ? (
              <div style={{ textAlign:'center', padding:'60px 0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                <p style={{ color:'rgba(255,255,255,0.5)' }}>Aucune politique disponible</p>
              </div>
            ) : (
              <>
                <div style={s.breadcrumb}>
                  <span onClick={() => naviguer({ page:'accueil' })} style={s.breadcrumbLink}>Accueil</span>
                  <span style={s.breadcrumbSep}>›</span>
                  <span style={{ color:'#fff' }}>{politiqueActive.titre}</span>
                </div>
                <h1 style={s.titre}>{politiqueActive.titre}</h1>
                {politiqueActive.updated_at && (
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:24 }}>
                    Derniere mise a jour : {new Date(politiqueActive.updated_at).toLocaleDateString('fr-CA', { year:'numeric', month:'long', day:'numeric' })}
                  </p>
                )}
                <div className="pol-contenu" dangerouslySetInnerHTML={{ __html: politiqueActive.contenu }} />
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