// src/templates/multivendeur/MVPremiumBoutiquePage.tsx
// e-Vend Studio — Page boutique individuelle d'un vendeur (Multi-Vendeur Premium)
// Onglets: Produits / A propos / Blog (add-on) / FAQ (add-on) / Avis (add-on)

import { useState, useEffect } from 'react';
import { NavMVPremium as NavMV } from './TemplateMultiVendeurPremium';

const API_BASE = 'http://localhost:5000/api';

interface Boutique {
  id: number;
  nom_boutique: string;
  description_courte?: string;
  description_longue?: string;
  ville?: string;
  province?: string;
  logo_url?: string;
  banniere_url?: string;
  nb_produits?: number;
  date_inscription?: string;
  telephone?: string;
  site_web?: string;
}

interface Produit {
  id: number; nom: string; prix: number; image?: string; stock: number; categorie_nom?: string;
}

interface BlogArticle {
  id: number; titre: string; contenu: string; tags?: string; vues: number; date_publication: string;
}

interface FaqItem { id: number; question: string; reponse: string; }

interface Avis {
  id: number; nom_client: string; note_globale: number; titre?: string; commentaire?: string; created_at: string;
}

type Onglet = 'produits' | 'apropos' | 'blog' | 'faq' | 'avis';

interface Props {
  vendeurId?: number;
  isDemo?: boolean;
  config?: Record<string, any>;
  naviguer: (d: NavMV) => void;
  boutiqueSlug?: string; // ici, utilisé comme l'ID du vendeur de la boutique
}

const DEMO_BOUTIQUE: Boutique = {
  id: 1, nom_boutique: 'TechPro Montreal',
  description_courte: 'Specialiste en electronique et gadgets technologiques.',
  description_longue: 'TechPro Montreal est votre destination de confiance pour tous vos besoins en electronique. Depuis notre ouverture, nous nous engageons a offrir des produits authentiques, garantis et a prix competitifs. Notre equipe passionnee est toujours disponible pour vous conseiller dans le choix de vos appareils.',
  ville: 'Montreal', province: 'QC', nb_produits: 48, date_inscription: '2022-03-15',
  banniere_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w:1200&q=80',
};

const DEMO_PRODUITS_BOUTIQUE: Produit[] = [
  { id:1, nom:'iPhone 15 Pro Max 256Go', prix:1449.99, stock:8, categorie_nom:'Téléphones', image:'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=400&q=80' },
  { id:8, nom:'Samsung Galaxy Watch 6', prix:429.00, stock:9, categorie_nom:'Montres connectées', image:'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&q=80' },
  { id:10, nom:'PlayStation 5 Bundle', prix:649.99, stock:1, categorie_nom:'Consoles', image:'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80' },
  { id:13, nom:'Samsung Galaxy S24 Ultra', prix:1199.99, stock:5, categorie_nom:'Téléphones', image:'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80' },
  { id:14, nom:'AirPods Pro 2e génération', prix:279.99, stock:14, categorie_nom:'Audio', image:'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400&q=80' },
  { id:15, nom:'Casque Sony WH-1000XM5', prix:399.99, stock:6, categorie_nom:'Audio', image:'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80' },
  { id:16, nom:'Apple Watch Series 9', prix:499.00, stock:7, categorie_nom:'Montres connectées', image:'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&q=80' },
  { id:17, nom:'Xbox Series X', prix:599.99, stock:3, categorie_nom:'Consoles', image:'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80' },
  { id:18, nom:'MacBook Air M3 13 pouces', prix:1399.99, stock:4, categorie_nom:'Ordinateurs', image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
];

const DEMO_BLOG: BlogArticle[] = [
  { id:1, titre:'5 conseils pour choisir votre prochain telephone', contenu:'<p>Choisir un nouveau telephone peut etre complexe avec toutes les options disponibles. Voici nos meilleurs conseils pour faire le bon choix selon vos besoins et votre budget.</p><p>Premierement, definissez votre budget. Ensuite, identifiez vos priorites: photo, autonomie, performance ou stockage.</p>', tags:'conseils,telephone', vues:234, date_publication:new Date().toISOString() },
  { id:2, titre:'Nouveautes electronique automne 2026', contenu:'<p>Decouvrez notre selection des meilleures nouveautes en electronique pour cette saison. Des produits soigneusement selectionnes par notre equipe.</p>', tags:'nouveautes', vues:156, date_publication:new Date(Date.now()-86400000*5).toISOString() },
];

const DEMO_FAQ: FaqItem[] = [
  { id:1, question:'Quels sont vos delais de livraison ?', reponse:'Nos delais de livraison varient entre 2 et 5 jours ouvrables partout au Quebec.' },
  { id:2, question:'Offrez-vous une garantie sur vos produits ?', reponse:'Oui, tous nos produits sont garantis minimum 1 an contre les defauts de fabrication.' },
  { id:3, question:'Puis-je retourner un produit ?', reponse:'Vous disposez de 14 jours suivant la reception pour retourner un produit non utilise dans son emballage original.' },
];

const DEMO_AVIS: Avis[] = [
  { id:1, nom_client:'Marie L.', note_globale:5, titre:'Excellent service', commentaire:'Tres satisfaite de mon achat, livraison rapide et produit conforme.', created_at:new Date().toISOString() },
  { id:2, nom_client:'Jean-Francois T.', note_globale:4, titre:'Bon vendeur', commentaire:'Communication claire et produit de qualite.', created_at:new Date(Date.now()-86400000*10).toISOString() },
];

function Navbar({ naviguer, config }: { naviguer: (d: NavMV) => void; config: Record<string, any> }) {
  const nom = config?.nom_boutique || 'Ma Marketplace';
  return (
    <nav style={s.nav}>
      <div style={s.navInner}>
        <div style={s.navLogo} onClick={() => naviguer({ page: 'accueil' })}>
          <div style={s.logoIcon}>{(nom[0] || 'M').toUpperCase()}</div>
          <span style={s.logoText}>{nom}</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => naviguer({ page: 'catalogue' })}>Catalogue</span>
          <span style={s.navLink} onClick={() => naviguer({ page: 'boutiques' })}>Boutiques</span>
        </div>
      </div>
    </nav>
  );
}

function Etoiles({ note, taille = 14 }: { note: number; taille?: number }) {
  return (
    <span style={{ fontSize: taille, letterSpacing: 1 }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= note ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>★</span>)}
    </span>
  );
}

export default function MVPremiumBoutiquePage({ vendeurId, isDemo, config = {}, naviguer, boutiqueSlug }: Props) {
  const couleurAccent = config.couleur_accent || '#fbbf24';
  const boutiqueId = boutiqueSlug || vendeurId;

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState<Onglet>('produits');
  const [recherche, setRecherche] = useState('');
  const [categoriesActives, setCategoriesActives] = useState<string[]>([]);
  const [filtreCatMobileOuvert, setFiltreCatMobileOuvert] = useState(false);

  // Add-ons
  const [addonsStatut, setAddonsStatut] = useState({ blog_actif: false, faq_actif: false, avis_actif: false });
  const [blog, setBlog] = useState<BlogArticle[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [moyenneAvis, setMoyenneAvis] = useState(0);
  const [blogOuvert, setBlogOuvert] = useState<number | null>(null);
  const [faqOuvert, setFaqOuvert] = useState<number | null>(null);

  // Formulaire avis
  const [formAvisOuvert, setFormAvisOuvert] = useState(false);
  const [formNote, setFormNote] = useState(5);
  const [formNom, setFormNom] = useState('');
  const [formTitre, setFormTitre] = useState('');
  const [formCommentaire, setFormCommentaire] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [msgAvis, setMsgAvis] = useState('');

  useEffect(() => {
    if (isDemo) {
      setBoutique(DEMO_BOUTIQUE);
      setProduits(DEMO_PRODUITS_BOUTIQUE);
      setAddonsStatut({ blog_actif: true, faq_actif: true, avis_actif: true });
      setBlog(DEMO_BLOG);
      setFaq(DEMO_FAQ);
      setAvis(DEMO_AVIS);
      setMoyenneAvis(4.5);
      setLoading(false);
      return;
    }
    if (!boutiqueId) return;
    setLoading(true);

    fetch(`${API_BASE}/gestionnaires/${boutiqueId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setBoutique(d))
      .catch(() => {});

    fetch(`${API_BASE}/produits/gestionnaire/${boutiqueId}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setProduits(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API_BASE}/gestionnaires/${boutiqueId}/addons-statut`)
      .then(r => r.ok ? r.json() : {} as any)
      .then((d: any) => setAddonsStatut(d))
      .catch(() => {});
  }, [boutiqueId, isDemo]);

  // Charger contenu add-ons seulement si actifs
  useEffect(() => {
    if (isDemo || !boutiqueId) return;
    if (addonsStatut.blog_actif) {
      fetch(`${API_BASE}/gestionnaires/${boutiqueId}/blog`).then(r => r.ok ? r.json() : { articles: [] }).then(d => setBlog(d.articles || [])).catch(() => {});
    }
    if (addonsStatut.faq_actif) {
      fetch(`${API_BASE}/gestionnaires/${boutiqueId}/faq`).then(r => r.ok ? r.json() : { items: [] }).then(d => setFaq(d.items || [])).catch(() => {});
    }
    if (addonsStatut.avis_actif) {
      fetch(`${API_BASE}/gestionnaires/${boutiqueId}/avis`).then(r => r.ok ? r.json() : { avis: [] }).then(d => { setAvis(d.avis || []); setMoyenneAvis(d.moyenne || 0); }).catch(() => {});
    }
  }, [addonsStatut, boutiqueId, isDemo]);

  const soumettreAvis = async () => {
    if (!formNom || !formNote) { setMsgAvis('Nom et note requis.'); return; }
    setEnvoiEnCours(true);
    try {
      const res = await fetch(`${API_BASE}/gestionnaires/${boutiqueId}/avis`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_avis: 'vendeur', nom_client: formNom, note_globale: formNote, titre: formTitre, commentaire: formCommentaire }),
      });
      if (res.ok) {
        setMsgAvis('✅ Merci pour votre avis !');
        setFormNom(''); setFormTitre(''); setFormCommentaire(''); setFormNote(5);
        setTimeout(() => { setFormAvisOuvert(false); setMsgAvis(''); }, 1500);
      } else setMsgAvis('❌ Erreur — réessayez.');
    } catch { setMsgAvis('❌ Erreur réseau.'); }
    setEnvoiEnCours(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>Chargement...</div>
  );

  if (!boutique) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Boutique introuvable</p>
      <button onClick={() => naviguer({ page: 'boutiques' })} style={{ padding: '10px 24px', background: couleurAccent, color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>← Retour aux boutiques</button>
    </div>
  );

  const ONGLETS: { id: Onglet; label: string; icone: string; visible: boolean }[] = [
    { id: 'produits', label: 'Produits', icone: '🛍️', visible: true },
    { id: 'apropos',  label: 'À propos', icone: 'ℹ️', visible: true },
    { id: 'blog',     label: 'Blog',     icone: '📝', visible: addonsStatut.blog_actif },
    { id: 'faq',      label: 'FAQ',      icone: '❓', visible: addonsStatut.faq_actif },
    { id: 'avis',     label: 'Avis',     icone: '⭐', visible: addonsStatut.avis_actif },
  ];

  // Catégories calculées depuis les produits, avec compteur
  const categoriesAvecCompteur = (() => {
    const map: Record<string, number> = {};
    produits.forEach(p => {
      const cat = p.categorie_nom || 'Autres';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).map(([nom, count]) => ({ nom, count })).sort((a, b) => b.count - a.count);
  })();

  // Produits filtrés par recherche + catégories cochées
  const produitsFiltres = produits.filter(p => {
    if (recherche && !p.nom.toLowerCase().includes(recherche.toLowerCase())) return false;
    if (categoriesActives.length > 0 && !categoriesActives.includes(p.categorie_nom || 'Autres')) return false;
    return true;
  });

  const toggleCategorie = (cat: string) => {
    setCategoriesActives(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .blog-contenu p { color: rgba(255,255,255,0.75); line-height: 1.8; margin-bottom: 1em; }
      `}</style>

      <Navbar naviguer={naviguer} config={config} />

      {/* Bannière boutique */}
      <div style={{ ...s.banniere, backgroundImage: boutique.banniere_url ? `url(${boutique.banniere_url})` : `linear-gradient(135deg, ${couleurAccent}30, #0a0a0a)` }}>
        <div style={s.bannièreOverlay} />
      </div>

      {/* Header boutique */}
      <div style={s.headerBoutique}>
        <div style={s.headerInner}>
          <div style={s.logoBoutique}>
            {boutique.logo_url
              ? <img src={boutique.logo_url} alt={boutique.nom_boutique} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
              : <span style={{ fontSize: 32, fontWeight: 900, color: couleurAccent }}>{boutique.nom_boutique[0]}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={s.nomBoutique}>{boutique.nom_boutique}</h1>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              {boutique.nb_produits != null && <span style={s.badgeMeta}>📦 {boutique.nb_produits} produits</span>}
              {(boutique.ville || boutique.province) && <span style={s.badgeMeta}>📍 {[boutique.ville, boutique.province].filter(Boolean).join(', ')}</span>}
              {addonsStatut.avis_actif && moyenneAvis > 0 && (
                <span style={s.badgeMeta}><Etoiles note={Math.round(moyenneAvis)} taille={12} /> {moyenneAvis.toFixed(1)} ({avis.length})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={s.ongletsBar}>
        <div style={s.ongletsInner}>
          {ONGLETS.filter(o => o.visible).map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              style={{ ...s.ongletBtn, borderBottom: onglet === o.id ? `3px solid ${couleurAccent}` : '3px solid transparent', color: onglet === o.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {o.icone} {o.label}
            </button>
          ))}
        </div>
      </div>

      <main style={s.main}>
        {/* ── ONGLET PRODUITS ── */}
        {onglet === 'produits' && (
          <div>
            {/* Barre de recherche */}
            <div style={s.barreRecherche}>
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un produit..." style={s.inputRecherche} />
              <button style={{ ...s.btnRecherche, background: couleurAccent }}>🔍</button>
            </div>

            <div style={s.layoutProduits}>
              {/* Sidebar catégories */}
              {categoriesAvecCompteur.length > 0 && (
                <aside style={s.sidebarCat}>
                  <div style={s.sidebarCard}>
                    <h3 style={s.sidebarTitre}>
                      Filtrer par catégories
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {categoriesAvecCompteur.reduce((acc, c) => acc + c.count, 0)}
                      </span>
                    </h3>
                    <div style={s.listeCat}>
                      {categoriesAvecCompteur.map(cat => (
                        <label key={cat.nom} style={s.catLabel}>
                          <input type="checkbox" checked={categoriesActives.includes(cat.nom)} onChange={() => toggleCategorie(cat.nom)} style={{ accentColor: couleurAccent, cursor: 'pointer' }} />
                          <span style={{ flex: 1, color: 'rgba(255,255,255,0.7)' }}>{cat.nom}</span>
                          <span style={{ ...s.badgeCount, background: couleurAccent, color: '#000' }}>{cat.count}</span>
                        </label>
                      ))}
                      {categoriesActives.length > 0 && (
                        <button onClick={() => setCategoriesActives([])} style={s.btnReset}>✕ Effacer les filtres</button>
                      )}
                    </div>
                  </div>
                </aside>
              )}

              {/* Grille produits */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {produitsFiltres.length === 0 ? (
                  <div style={s.vide}><div style={{ fontSize: 40, marginBottom: 10 }}>📦</div><p style={{ color: 'rgba(255,255,255,0.5)' }}>{recherche || categoriesActives.length > 0 ? 'Aucun produit ne correspond à votre recherche' : 'Aucun produit pour le moment'}</p></div>
                ) : (
                  <div style={s.grilleProduits}>
                    {produitsFiltres.map(p => (
                      <div key={p.id} onClick={() => naviguer({ page: 'produit', produitId: p.id })} style={s.carteProduit}>
                        <div style={s.carteImg}>
                          {p.image ? <img src={p.image} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 32, opacity: 0.2 }}>📦</div>}
                        </div>
                        <div style={{ padding: 12 }}>
                          <p style={{ fontSize: 13, color: '#fff', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{p.nom}</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: couleurAccent, margin: 0 }}>{parseFloat(String(p.prix)).toFixed(2)} $</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ONGLET À PROPOS ── */}
        {onglet === 'apropos' && (
          <div style={s.contenuApropos}>
            <h2 style={s.sectionTitre}>À propos de {boutique.nom_boutique}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: 15 }}>
              {boutique.description_longue || boutique.description_courte || 'Cette boutique n\'a pas encore ajouté de description.'}
            </p>
            <div style={s.infosGrid}>
              {boutique.date_inscription && <div style={s.infoCard}><span style={s.infoLabel}>Membre depuis</span><span style={s.infoVal}>{new Date(boutique.date_inscription).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long' })}</span></div>}
              {boutique.telephone && <div style={s.infoCard}><span style={s.infoLabel}>Téléphone</span><span style={s.infoVal}>{boutique.telephone}</span></div>}
              {boutique.site_web && <div style={s.infoCard}><span style={s.infoLabel}>Site web</span><span style={s.infoVal}>{boutique.site_web}</span></div>}
            </div>
          </div>
        )}

        {/* ── ONGLET BLOG (add-on) ── */}
        {onglet === 'blog' && addonsStatut.blog_actif && (
          <div>
            <h2 style={s.sectionTitre}>📝 Blog de la boutique</h2>
            {blog.length === 0 ? (
              <div style={s.vide}><p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucun article pour le moment</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {blog.map(article => (
                  <div key={article.id} style={{ ...s.carteBlog, borderColor: blogOuvert === article.id ? `${couleurAccent}50` : 'rgba(255,255,255,0.08)' }}>
                    <div onClick={() => setBlogOuvert(o => o === article.id ? null : article.id)} style={{ padding: 18, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{article.titre}</h3>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                          <span>📅 {new Date(article.date_publication).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          {article.vues > 0 && <span>👁 {article.vues} vues</span>}
                        </div>
                      </div>
                      <span style={{ color: couleurAccent, fontSize: 18 }}>{blogOuvert === article.id ? '▲' : '▼'}</span>
                    </div>
                    {blogOuvert === article.id && (
                      <div className="blog-contenu" style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }} dangerouslySetInnerHTML={{ __html: article.contenu }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET FAQ (add-on) ── */}
        {onglet === 'faq' && addonsStatut.faq_actif && (
          <div>
            <h2 style={s.sectionTitre}>❓ Questions fréquentes</h2>
            {faq.length === 0 ? (
              <div style={s.vide}><p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucune question pour le moment</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {faq.map(item => (
                  <div key={item.id} style={{ ...s.carteBlog, borderColor: faqOuvert === item.id ? `${couleurAccent}50` : 'rgba(255,255,255,0.08)' }}>
                    <div onClick={() => setFaqOuvert(o => o === item.id ? null : item.id)} style={{ padding: 16, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{item.question}</h3>
                      <span style={{ color: couleurAccent, fontSize: 16, flexShrink: 0 }}>{faqOuvert === item.id ? '▲' : '▼'}</span>
                    </div>
                    {faqOuvert === item.id && (
                      <p style={{ padding: '0 16px 16px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontSize: 14, margin: 0 }}>{item.reponse}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET AVIS (add-on) ── */}
        {onglet === 'avis' && addonsStatut.avis_actif && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ ...s.sectionTitre, marginBottom: 4 }}>⭐ Avis clients</h2>
                {avis.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Etoiles note={Math.round(moyenneAvis)} taille={16} /><span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{moyenneAvis.toFixed(1)} sur 5 ({avis.length} avis)</span></div>}
              </div>
              <button onClick={() => setFormAvisOuvert(true)} style={{ padding: '10px 20px', background: couleurAccent, color: '#000', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>✍️ Laisser un avis</button>
            </div>

            {avis.length === 0 ? (
              <div style={s.vide}><p style={{ color: 'rgba(255,255,255,0.5)' }}>Aucun avis pour le moment — soyez le premier !</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {avis.map(a => (
                  <div key={a.id} style={s.carteAvis}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 14 }}>{a.nom_client}</p>
                        <Etoiles note={a.note_globale} />
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{new Date(a.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {a.titre && <p style={{ fontWeight: 700, color: '#fff', margin: '0 0 4px', fontSize: 14 }}>{a.titre}</p>}
                    {a.commentaire && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{a.commentaire}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modal laisser un avis ── */}
      {formAvisOuvert && (
        <div onClick={() => setFormAvisOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#15151f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, maxWidth: 440, width: '100%', padding: 28 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 18px' }}>Laisser un avis sur {boutique.nom_boutique}</h3>

            <div style={{ marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 28, cursor: 'pointer' }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} onClick={() => setFormNote(n)} style={{ color: n <= formNote ? couleurAccent : 'rgba(255,255,255,0.2)' }}>★</span>
                ))}
              </div>
            </div>

            <input value={formNom} onChange={e => setFormNom(e.target.value)} placeholder="Votre nom"
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' as const }} />
            <input value={formTitre} onChange={e => setFormTitre(e.target.value)} placeholder="Titre de votre avis (optionnel)"
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' as const }} />
            <textarea value={formCommentaire} onChange={e => setFormCommentaire(e.target.value)} placeholder="Votre commentaire" rows={4}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, marginBottom: 14, outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />

            {msgAvis && <p style={{ fontSize: 13, color: msgAvis.startsWith('✅') ? '#6ee7b7' : '#fca5a5', marginBottom: 10 }}>{msgAvis}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setFormAvisOuvert(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={soumettreAvis} disabled={envoiEnCours} style={{ flex: 2, padding: '11px', background: couleurAccent, border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {envoiEnCours ? '⏳ Envoi...' : 'Publier mon avis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:     { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  nav:      { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navInner: { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 },
  navLogo:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  logoIcon: { width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#000' },
  logoText: { fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" },
  navLinks: { display: 'flex', gap: 24 },
  navLink:  { color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer' },
  banniere: { height: 180, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
  bannièreOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), #0a0a0a)' },
  headerBoutique: { maxWidth: 1100, margin: '-50px auto 0', padding: '0 24px', position: 'relative', zIndex: 2 },
  headerInner: { display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' },
  logoBoutique: { width: 96, height: 96, borderRadius: 18, background: '#15151f', border: '3px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  nomBoutique: { fontFamily: "'Syne',sans-serif", fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, margin: 0 },
  badgeMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 },
  ongletsBar: { borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: 28 },
  ongletsInner: { maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' as const },
  ongletBtn: { padding: '14px 18px', background: 'transparent', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, transition: 'all 0.15s' },
  main:     { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' },
  vide:     { textAlign: 'center', padding: '50px 20px' },
  barreRecherche: { display: 'flex', marginBottom: 24, maxWidth: 380 },
  inputRecherche: { flex: 1, padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px 0 0 10px', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  btnRecherche: { padding: '10px 18px', border: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontSize: 14, color: '#000' },
  layoutProduits: { display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' as const },
  sidebarCat: { width: 230, flexShrink: 0 },
  sidebarCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 },
  sidebarTitre: { fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  listeCat: { flexDirection: 'column' as const, gap: 8 },
  catLabel: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, padding: '4px 0' },
  badgeCount: { width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  btnReset: { marginTop: 10, padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: '100%' },
  grilleProduits: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
  carteProduit: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' },
  carteImg: { height: 140, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sectionTitre: { fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 16 },
  contenuApropos: { maxWidth: 700 },
  infosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginTop: 24 },
  infoCard: { background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  infoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  infoVal:   { fontSize: 14, color: '#fff', fontWeight: 600 },
  carteBlog: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s' },
  carteAvis: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 },
};