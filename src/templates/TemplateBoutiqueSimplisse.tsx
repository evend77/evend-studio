// src/templates/TemplateBoutiqueSimplisse.tsx
// e-Vend Studio — Template Boutique Simplisse (multi-produit 1 vendeur)
// Rendu public — lit config.simplisse + produits depuis l'API
// Pages : Accueil · Catalogue · Fiche produit · Blog · FAQ · Contact
// 100% mobile responsive

import { useState, useEffect, useCallback } from 'react';

// ─── Types (miroir de ConfigMesPagesSimplisse) ────────────────────────────────
interface SectionPage  { id: string; actif: boolean; ordre: number; label: string; icone: string; }
interface ConfigHero   { titre: string; sousTitre: string; boutonLabel: string; boutonLien: string; photo: string; couleurFond: string; couleurTitre: string; couleurBouton: string; style: 'centre'|'gauche'|'image-fond'; }
interface ConfigBanniere { actif: boolean; texte: string; couleurFond: string; couleurTexte: string; lien: string; labelLien: string; }
interface ConfigFooter {
  nomBoutique: string; slogan: string; couleurFond: string; couleurTexte: string; afficherPropulse: boolean;
  reseaux: { facebook:string; instagram:string; tiktok:string; twitter:string; youtube:string; linkedin:string; pinterest:string; };
  colonnes: { titre1:string; liens1:string; titre2:string; liens2:string; titre3:string; liens3:string; };
  politiques: { afficherConditions:boolean; afficherConfidentialite:boolean; afficherRetours:boolean; afficherLivraison:boolean; };
}
interface ConfigAccueil {
  hero: ConfigHero; banniere: ConfigBanniere; sections: SectionPage[];
  couleurPrimaire: string; couleurSecondaire: string; couleurFondPage: string; couleurTexte: string; police: string;
}
interface ConfigCatalogue {
  titre: string; sousTitre: string; colonnes: 2|3|4;
  afficherFiltres: boolean; afficherRecherche: boolean; afficherPrix: boolean; afficherStock: boolean;
  hero: ConfigHero; sections: SectionPage[];
}
interface ConfigFaq     { titre: string; sousTitre: string; hero: ConfigHero; banniere: ConfigBanniere; items: { question:string; reponse:string }[]; }
interface ConfigBlog    { titre: string; sousTitre: string; hero: ConfigHero; banniere: ConfigBanniere; afficherAuteur: boolean; afficherDate: boolean; colonnes: 2|3; }
interface ConfigContact { titre: string; sousTitre: string; hero: ConfigHero; banniere: ConfigBanniere; adresse: string; telephone: string; courriel: string; afficherCarte: boolean; urlCarte: string; }
interface ConfigSimplisse { accueil: ConfigAccueil; catalogue: ConfigCatalogue; faq: ConfigFaq; blog: ConfigBlog; contact: ConfigContact; footer: ConfigFooter; ficheProduit?: ConfigFicheProduit; }
interface ConfigSimplisse { accueil: ConfigAccueil; catalogue: ConfigCatalogue; faq: ConfigFaq; blog: ConfigBlog; contact: ConfigContact; footer: ConfigFooter; }

interface ConfigFicheProduit {
  layout:              'image-gauche' | 'image-droite' | 'image-haut';
  photosMiniatures:    'dessous' | 'gauche';
  descriptionPosition: 'droite' | 'bas' | 'onglets';
  descriptionTronquee: boolean;
  afficherBreadcrumb:  boolean;
  afficherStock:       boolean;
  afficherCategorie:   boolean;
  afficherSku:         boolean;
  afficherRabaisPct:   boolean;
  afficherQte:         boolean;
  boutonLabel:         string;
  boutonCouleur:       string;
  afficherReassurance: boolean;
  reassuranceItems:    { icone: string; texte: string }[];
  afficherPartage:     boolean;
  afficherSimilaires:  boolean;
  similairesNombre:    2 | 4 | 6;
  similairesTitre:     string;
}

interface Produit {
  id: number; titre: string; prix: number; prix_promo?: number; photo_principale?: string;
  photos?: string[]; description?: string; stock?: number; categorie?: string; sku?: string;
  variantes?: { nom: string; valeurs: string[] }[];
}

interface ArticleBlog {
  id: number; titre: string; slug: string; resume?: string; photo?: string;
  auteur?: string; date_publication?: string; categorie?: string;
}

// ─── Config par défaut (fallback si BD vide) ──────────────────────────────────
const CP = '#2563eb';
const HERO_DEF: ConfigHero = { titre: 'Bienvenue dans notre boutique', sousTitre: 'Découvrez notre sélection de produits soigneusement choisis pour vous.', boutonLabel: 'Voir le catalogue', boutonLien: '/catalogue', photo: '', couleurFond: '#f8fafc', couleurTitre: '#1a1a1a', couleurBouton: CP, style: 'centre' };
const BAN_DEF: ConfigBanniere = { actif: false, texte: '🎉 Livraison gratuite sur toutes les commandes de 75$ et plus !', couleurFond: CP, couleurTexte: '#ffffff', lien: '', labelLien: 'En savoir plus' };
const CFG_DEF: ConfigSimplisse = {
  accueil: { hero: HERO_DEF, banniere: BAN_DEF, sections: [
    { id:'banniere', label:'Bannière', icone:'📢', actif:true,  ordre:1 },
    { id:'hero',     label:'Hero',    icone:'🖼', actif:true,  ordre:2 },
    { id:'avantages',label:'Avantages',icone:'✅',actif:true,  ordre:3 },
    { id:'vedette',  label:'Vedette', icone:'⭐', actif:true,  ordre:4 },
    { id:'categories',label:'Catégories',icone:'🗂',actif:true,ordre:5 },
    { id:'nouveautes',label:'Nouveautés',icone:'🆕',actif:true,ordre:6 },
    { id:'promo',    label:'Promos',  icone:'🏷', actif:false, ordre:7 },
    { id:'temoignages',label:'Avis',  icone:'💬', actif:true,  ordre:8 },
    { id:'newsletter',label:'Infolettre',icone:'📧',actif:false,ordre:9 },
    { id:'blog-apercu',label:'Blog',  icone:'📝', actif:false, ordre:10 },
  ], couleurPrimaire:CP, couleurSecondaire:'#64748b', couleurFondPage:'#ffffff', couleurTexte:'#1a1a1a', police:'Inter' },
  catalogue: { titre:'Notre catalogue', sousTitre:'Tous nos produits disponibles.', colonnes:3, afficherFiltres:true, afficherRecherche:true, afficherPrix:true, afficherStock:true, hero:HERO_DEF, sections:[] },
  faq: { titre:'Questions fréquentes', sousTitre:'Trouvez rapidement les réponses à vos questions.', hero:HERO_DEF, banniere:BAN_DEF, items:[
    { question:'Quels sont vos délais de livraison ?', reponse:'Les commandes sont expédiées sous 24–48h ouvrables.' },
    { question:'Puis-je retourner un article ?', reponse:'Oui, sous 30 jours suivant la réception.' },
    { question:'Quels modes de paiement acceptez-vous ?', reponse:'Visa, Mastercard et Apple Pay via Stripe.' },
  ]},
  blog: { titre:'Notre blogue', sousTitre:'Actualités, conseils et nouveautés.', hero:HERO_DEF, banniere:BAN_DEF, afficherAuteur:true, afficherDate:true, colonnes:3 },
  contact: { titre:'Nous contacter', sousTitre:'Une question ? Nous sommes là pour vous.', hero:HERO_DEF, banniere:BAN_DEF, adresse:'', telephone:'', courriel:'', afficherCarte:false, urlCarte:'' },
  footer: { nomBoutique:'Ma Boutique', slogan:'', couleurFond:'#111827', couleurTexte:'#ffffff', afficherPropulse:true,
    reseaux:{ facebook:'', instagram:'', tiktok:'', twitter:'', youtube:'', linkedin:'', pinterest:'' },
    colonnes:{ titre1:'Boutique', liens1:'Accueil\nCatalogue\nBlog\nFAQ', titre2:'Aide', liens2:'Contact', titre3:'', liens3:'' },
    politiques:{ afficherConditions:true, afficherConfidentialite:true, afficherRetours:true, afficherLivraison:true },
  },
};

const API_BASE = 'http://localhost:5000/api';

const FICHE_DEF: ConfigFicheProduit = {
  layout: 'image-gauche', photosMiniatures: 'dessous', descriptionPosition: 'droite',
  descriptionTronquee: false, afficherBreadcrumb: true, afficherStock: true,
  afficherCategorie: true, afficherSku: false, afficherRabaisPct: true, afficherQte: true,
  boutonLabel: 'Ajouter au panier', boutonCouleur: '',
  afficherReassurance: true,
  reassuranceItems: [
    { icone: '🔒', texte: 'Paiement sécurisé Stripe' },
    { icone: '🔄', texte: 'Retour sous 30 jours' },
    { icone: '🚚', texte: 'Livraison rapide 24–48h' },
  ],
  afficherPartage: false, afficherSimilaires: true, similairesNombre: 4, similairesTitre: 'Vous aimerez aussi',
};



// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  config: any;   // config brute de la BD — contient config.simplisse
  siteId?: number;
  vendeurId: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function merge<T>(def: T, override: any): T {
  if (!override || typeof override !== 'object') return def;
  return { ...def, ...override };
}
function prix(n: number) { return n?.toFixed(2).replace('.', ',') + ' $'; }

// ─── Composant Bannière ───────────────────────────────────────────────────────
function Banniere({ cfg }: { cfg: ConfigBanniere }) {
  if (!cfg?.actif) return null;
  return (
    <div style={{ background: cfg.couleurFond, color: cfg.couleurTexte, padding: '10px 20px', textAlign: 'center', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span>{cfg.texte}</span>
      {cfg.lien && cfg.labelLien && (
        <a href={cfg.lien} style={{ color: cfg.couleurTexte, fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}>{cfg.labelLien} →</a>
      )}
    </div>
  );
}

// ─── Composant Hero ───────────────────────────────────────────────────────────
function Hero({ cfg, cp, onNaviguer }: { cfg: ConfigHero; cp: string; onNaviguer: (p: string) => void }) {
  const isFond = cfg.style === 'image-fond' && cfg.photo;
  const isGauche = cfg.style === 'gauche';
  return (
    <div style={{
      background: isFond ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${cfg.photo}) center/cover no-repeat` : cfg.couleurFond,
      minHeight: 420,
      display: 'flex', alignItems: 'center', justifyContent: isGauche ? 'flex-start' : 'center',
      padding: '60px 24px',
    }}>
      <div style={{ maxWidth: 680, textAlign: isGauche ? 'left' : 'center', width: '100%' }}>
        {!isFond && cfg.photo && !isGauche && (
          <img src={cfg.photo} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 16, marginBottom: 32 }} />
        )}
        {!isFond && cfg.photo && isGauche && (
          <div style={{ display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: isFond ? '#fff' : cfg.couleurTitre, lineHeight: 1.15, marginBottom: 16 }}>{cfg.titre}</h1>
              <p style={{ fontSize: 18, color: isFond ? 'rgba(255,255,255,0.85)' : '#555', marginBottom: 28, lineHeight: 1.6 }}>{cfg.sousTitre}</p>
              <button onClick={() => onNaviguer('catalogue')} style={{ background: cfg.couleurBouton, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{cfg.boutonLabel} →</button>
            </div>
            <img src={cfg.photo} alt="" style={{ width: 280, height: 220, objectFit: 'cover', borderRadius: 16, flexShrink: 0 }} />
          </div>
        )}
        {(isFond || !cfg.photo || (!isFond && !isGauche)) && (
          <>
            <h1 style={{ fontSize: 'clamp(28px,5vw,56px)', fontWeight: 800, color: isFond ? '#fff' : cfg.couleurTitre, lineHeight: 1.15, marginBottom: 16 }}>{cfg.titre}</h1>
            <p style={{ fontSize: 18, color: isFond ? 'rgba(255,255,255,0.85)' : '#555', marginBottom: 28, lineHeight: 1.6 }}>{cfg.sousTitre}</p>
            <button onClick={() => onNaviguer('catalogue')} style={{ background: cfg.couleurBouton, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{cfg.boutonLabel} →</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Carte produit ────────────────────────────────────────────────────────────
function CarteProduit({ produit, cp, afficherPrix, onClick }: { produit: Produit; cp: string; afficherPrix: boolean; onClick: () => void }) {
  const enPromo = produit.prix_promo && produit.prix_promo < produit.prix;
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${cp}20`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
      <div style={{ height: 200, background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
        {produit.photo_principale
          ? <img src={produit.photo_principale} alt={produit.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#d1d5db' }}>📦</div>
        }
        {enPromo && <span style={{ position: 'absolute', top: 10, left: 10, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>SOLDE</span>}
        {produit.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ background: '#111', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>Épuisé</span></div>}
      </div>
      <div style={{ padding: '14px 16px' }}>
        {produit.categorie && <span style={{ fontSize: 11, color: cp, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{produit.categorie}</span>}
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: '4px 0 8px', lineHeight: 1.3 }}>{produit.titre}</h3>
        {afficherPrix && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            {enPromo
              ? <>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#ef4444' }}>{prix(produit.prix_promo!)}</span>
                  <span style={{ fontSize: 13, color: '#aaa', textDecoration: 'line-through' }}>{prix(produit.prix)}</span>
                </>
              : <span style={{ fontSize: 17, fontWeight: 800, color: cp }}>{prix(produit.prix)}</span>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ cfg, onNaviguer, cacherPropulse }: { cfg: ConfigFooter; onNaviguer: (p: string) => void; cacherPropulse: boolean }) {
  const reseauxActifs = Object.entries(cfg.reseaux).filter(([, v]) => v);
  const iconeReseau: Record<string, string> = { facebook:'f', instagram:'📸', tiktok:'♪', twitter:'𝕏', youtube:'▶', linkedin:'in', pinterest:'P' };
  return (
    <footer style={{ background: cfg.couleurFond, color: cfg.couleurTexte, paddingTop: 48 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 32, marginBottom: 40 }}>
          {/* Identité */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{cfg.nomBoutique}</div>
            {cfg.slogan && <p style={{ fontSize: 14, opacity: 0.65, lineHeight: 1.6, marginBottom: 16 }}>{cfg.slogan}</p>}
            {reseauxActifs.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {reseauxActifs.map(([k, url]) => (
                  <a key={k} href={url as string} target="_blank" rel="noopener noreferrer"
                    style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: cfg.couleurTexte, textDecoration: 'none', fontWeight: 700 }}>
                    {iconeReseau[k] || k[0].toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
          {/* Col 1 */}
          {cfg.colonnes.titre1 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, opacity: 0.9 }}>{cfg.colonnes.titre1}</div>
              {cfg.colonnes.liens1.split('\n').filter(Boolean).map((l, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <button onClick={() => onNaviguer(l.toLowerCase())} style={{ background: 'none', border: 'none', color: cfg.couleurTexte, opacity: 0.65, fontSize: 14, cursor: 'pointer', padding: 0, textAlign: 'left' }}>{l}</button>
                </div>
              ))}
            </div>
          )}
          {/* Col 2 */}
          {cfg.colonnes.titre2 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, opacity: 0.9 }}>{cfg.colonnes.titre2}</div>
              {cfg.colonnes.liens2.split('\n').filter(Boolean).map((l, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <button onClick={() => onNaviguer(l.toLowerCase())} style={{ background: 'none', border: 'none', color: cfg.couleurTexte, opacity: 0.65, fontSize: 14, cursor: 'pointer', padding: 0, textAlign: 'left' }}>{l}</button>
                </div>
              ))}
            </div>
          )}
          {/* Col 3 */}
          {cfg.colonnes.titre3 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, opacity: 0.9 }}>{cfg.colonnes.titre3}</div>
              {cfg.colonnes.liens3.split('\n').filter(Boolean).map((l, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 14, opacity: 0.65 }}>{l}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bas du footer */}
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.12)`, padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13, opacity: 0.5 }}>© {new Date().getFullYear()} {cfg.nomBoutique}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {cfg.politiques.afficherConditions      && <button onClick={() => onNaviguer('conditions')}      style={{ background:'none', border:'none', color:cfg.couleurTexte, opacity:0.55, fontSize:12, cursor:'pointer' }}>Conditions de service</button>}
            {cfg.politiques.afficherConfidentialite && <button onClick={() => onNaviguer('confidentialite')} style={{ background:'none', border:'none', color:cfg.couleurTexte, opacity:0.55, fontSize:12, cursor:'pointer' }}>Confidentialité</button>}
            {cfg.politiques.afficherRetours         && <button onClick={() => onNaviguer('retours')}         style={{ background:'none', border:'none', color:cfg.couleurTexte, opacity:0.55, fontSize:12, cursor:'pointer' }}>Retours</button>}
            {cfg.politiques.afficherLivraison       && <button onClick={() => onNaviguer('livraison')}       style={{ background:'none', border:'none', color:cfg.couleurTexte, opacity:0.55, fontSize:12, cursor:'cursor' }}>Livraison</button>}
          </div>
          {!cacherPropulse && (
            <a href="https://e-vend.ca" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, opacity: 0.35, color: cfg.couleurTexte, textDecoration: 'none' }}>
              Propulsé par e-Vend Studio
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TemplateBoutiqueSimplisse({ config: configBrut, siteId, vendeurId }: Props) {
  // Extraire config.simplisse de la BD et merger avec les défauts
  const rawSimplisse = configBrut?.simplisse || {};
  const fp: ConfigFicheProduit = { ...FICHE_DEF, ...(rawSimplisse.ficheProduit || {}) };

  const cfg: ConfigSimplisse = {
    accueil:  merge(CFG_DEF.accueil,  rawSimplisse.accueil),
    catalogue: merge(CFG_DEF.catalogue, rawSimplisse.catalogue),
    faq:      merge(CFG_DEF.faq,      rawSimplisse.faq),
    blog:     merge(CFG_DEF.blog,     rawSimplisse.blog),
    contact:  merge(CFG_DEF.contact,  rawSimplisse.contact),
    footer:   merge(CFG_DEF.footer,   rawSimplisse.footer),
    ficheProduit: fp,
  };

  const cp = cfg.accueil.couleurPrimaire || CP;

  // ── State navigation interne ──────────────────────────────────────────────
  type PageId = 'accueil' | 'catalogue' | 'produit' | 'blog' | 'article' | 'faq' | 'contact';
  const [page, setPage]               = useState<PageId>('accueil');
  const [produitActif, setProduitActif] = useState<Produit | null>(null);
  const [articleActif, setArticleActif] = useState<ArticleBlog | null>(null);
  const [menuOuvert, setMenuOuvert]   = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  // ── State données ─────────────────────────────────────────────────────────
  const [produits, setProduits]       = useState<Produit[]>([]);
  const [articles, setArticles]       = useState<ArticleBlog[]>([]);
  const [categories, setCategories]   = useState<string[]>([]);
  const [filtreCat, setFiltreCat]     = useState('');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  const [panier, setPanier]           = useState<{ produit: Produit; qte: number; variante?: string }[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [faqOuvert, setFaqOuvert]     = useState<number | null>(null);
  const [contactEnvoi, setContactEnvoi] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [contactForm, setContactForm] = useState({ nom:'', courriel:'', message:'' });
  const [varianteChoisie, setVarianteChoisie] = useState<Record<string, string>>({});
  const [qteChoisie, setQteChoisie]   = useState(1);

  // ── Branding — lu depuis options_gestionnaire en BD (source de vérité) ────
  const [cacherPropulse, setCacherPropulse] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Charger options branding depuis la BD
  useEffect(() => {
    fetch(`${API_BASE}/gestionnaires/${vendeurId}/options`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCacherPropulse(data.cacher_propulse === true); })
      .catch(() => {});
  }, [vendeurId]);

  // Charger produits — si démo hardcodée présente, l'utiliser directement
  useEffect(() => {
    if (configBrut?.__produits_demo__) {
      const liste = configBrut.__produits_demo__;
      setProduits(liste);
      const cats = Array.from(new Set(liste.map((p: any) => p.categorie).filter(Boolean))) as string[];
      setCategories(cats);
      return;
    }
    fetch(`${API_BASE}/produits/vendeur/${vendeurId}?limit=100`)
      .then(r => r.ok ? r.json() : { produits: [] })
      .then(data => {
        const liste: Produit[] = data.produits || data || [];
        setProduits(liste);
        const cats = Array.from(new Set(liste.map(p => p.categorie).filter(Boolean))) as string[];
        setCategories(cats);
      })
      .catch(() => {});
  }, [vendeurId]);

  // Charger articles blog
  useEffect(() => {
    fetch(`${API_BASE}/blog/vendeur/${vendeurId}?publie=true&limit=20`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setArticles(Array.isArray(data) ? data : data.articles || []))
      .catch(() => {});
  }, [vendeurId]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const naviguer = useCallback((dest: string) => {
    setMenuOuvert(false);
    setPanierOuvert(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const map: Record<string, PageId> = { accueil:'accueil', catalogue:'catalogue', blog:'blog', faq:'faq', contact:'contact' };
    if (map[dest.toLowerCase()]) {
      setPage(map[dest.toLowerCase()]);
    }
  }, []);

  const voirProduit = (p: Produit) => {
    setProduitActif(p);
    setQteChoisie(1);
    setVarianteChoisie({});
    setPage('produit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const voirArticle = (a: ArticleBlog) => {
    setArticleActif(a);
    setPage('article');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Panier ────────────────────────────────────────────────────────────────
  const ajouterAuPanier = (produit: Produit) => {
    const variante = Object.values(varianteChoisie).join(' / ') || undefined;
    setPanier(prev => {
      const existant = prev.find(i => i.produit.id === produit.id && i.variante === variante);
      if (existant) return prev.map(i => i.produit.id === produit.id && i.variante === variante ? { ...i, qte: i.qte + qteChoisie } : i);
      return [...prev, { produit, qte: qteChoisie, variante }];
    });
    setPanierOuvert(true);
  };

  const totalPanier = panier.reduce((s, i) => s + (i.produit.prix_promo || i.produit.prix) * i.qte, 0);
  const nbPanier = panier.reduce((s, i) => s + i.qte, 0);

  // ── Produits filtrés ──────────────────────────────────────────────────────
  const produitsFiltres = produits.filter(p => {
    const matchCat = !filtreCat || p.categorie === filtreCat;
    const matchRecherche = !filtreRecherche || p.titre.toLowerCase().includes(filtreRecherche.toLowerCase());
    return matchCat && matchRecherche;
  });

  // ── Sections accueil triées ───────────────────────────────────────────────
  const sectionsAccueil = [...(cfg.accueil.sections || [])].sort((a, b) => a.ordre - b.ordre).filter(s => s.actif);

  // ── Envoi formulaire contact ──────────────────────────────────────────────
  const envoyerContact = async () => {
    setContactEnvoi('loading');
    try {
      const res = await fetch(`${API_BASE}/contact/vendeur/${vendeurId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error();
      setContactEnvoi('ok');
      setContactForm({ nom: '', courriel: '', message: '' });
    } catch {
      setContactEnvoi('err');
    }
    setTimeout(() => setContactEnvoi('idle'), 4000);
  };

  // ── Styles communs ────────────────────────────────────────────────────────
  const styleInput: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const styleBtn: React.CSSProperties  = { background: cp, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' };

  // ══════════════════════════════════════════════════════════════════════════
  // NAV
  // ══════════════════════════════════════════════════════════════════════════
  const Nav = () => (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <button onClick={() => naviguer('accueil')} style={{ background: 'none', border: 'none', fontSize: 20, fontWeight: 800, color: cp, cursor: 'pointer', padding: 0 }}>
          {cfg.footer.nomBoutique}
        </button>

        {/* Liens desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 6 }}>
            {[['accueil','Accueil'],['catalogue','Catalogue'],['blog','Blog'],['faq','FAQ'],['contact','Contact']].map(([id, label]) => (
              <button key={id} onClick={() => naviguer(id)}
                style={{ background: page === id ? `${cp}12` : 'none', border: 'none', borderRadius: 8, color: page === id ? cp : '#555', fontSize: 14, fontWeight: page === id ? 700 : 500, cursor: 'pointer', padding: '8px 14px' }}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Panier */}
          <button onClick={() => setPanierOuvert(!panierOuvert)}
            style={{ position: 'relative', background: `${cp}12`, border: 'none', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: cp, fontWeight: 700, fontSize: 14 }}>
            🛒
            {nbPanier > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: cp, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{nbPanier}</span>
            )}
            {!isMobile && <span>{prix(totalPanier)}</span>}
          </button>

          {/* Burger mobile */}
          {isMobile && (
            <button onClick={() => setMenuOuvert(!menuOuvert)}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#333', padding: '4px 8px' }}>
              {menuOuvert ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {isMobile && menuOuvert && (
        <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 20px' }}>
          {[['accueil','Accueil'],['catalogue','Catalogue'],['blog','Blog'],['faq','FAQ'],['contact','Contact']].map(([id, label]) => (
            <button key={id} onClick={() => naviguer(id)}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: page === id ? `${cp}10` : 'none', border: 'none', borderRadius: 8, color: page === id ? cp : '#333', fontSize: 16, fontWeight: page === id ? 700 : 500, cursor: 'pointer', padding: '12px 14px', marginBottom: 4 }}>
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TIROIR PANIER
  // ══════════════════════════════════════════════════════════════════════════
  const TiroirPanier = () => (
    <>
      {panierOuvert && <div onClick={() => setPanierOuvert(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }} />}
      <div style={{ position: 'fixed', top: 0, right: panierOuvert ? 0 : '-420px', width: Math.min(420, window.innerWidth), height: '100vh', background: '#fff', zIndex: 200, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', transition: 'right 0.3s ease' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🛒 Votre panier ({nbPanier})</h2>
          <button onClick={() => setPanierOuvert(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {panier.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <p>Votre panier est vide.</p>
                <button onClick={() => { naviguer('catalogue'); }} style={{ ...styleBtn, width: 'auto', padding: '10px 24px', marginTop: 8 }}>Voir le catalogue</button>
              </div>
            : panier.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                    {item.produit.photo_principale
                      ? <img src={item.produit.photo_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.produit.titre}</p>
                    {item.variante && <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{item.variante}</p>}
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: cp }}>{prix((item.produit.prix_promo || item.produit.prix) * item.qte)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setPanier(prev => prev.map((it, j) => j === i ? { ...it, qte: Math.max(1, it.qte - 1) } : it))}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qte}</span>
                    <button onClick={() => setPanier(prev => prev.map((it, j) => j === i ? { ...it, qte: it.qte + 1 } : it))}
                      style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14 }}>+</button>
                    <button onClick={() => setPanier(prev => prev.filter((_, j) => j !== i))}
                      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  </div>
                </div>
              ))
          }
        </div>
        {panier.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: cp }}>{prix(totalPanier)}</span>
            </div>
            <button style={styleBtn}>Passer à la caisse →</button>
            <button onClick={() => setPanier([])} style={{ width: '100%', background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px', marginTop: 8, fontSize: 14, color: '#888', cursor: 'pointer' }}>Vider le panier</button>
          </div>
        )}
      </div>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE ACCUEIL
  // ══════════════════════════════════════════════════════════════════════════
  const PageAccueil = () => {
    const produitsVedette  = produits.filter((_, i) => i < 4);
    const produitsNouveaux = produits.filter((_, i) => i < 4);
    const produitsPromo    = produits.filter(p => p.prix_promo && p.prix_promo < p.prix).slice(0, 4);

    const renderSection = (sec: SectionPage) => {
      switch (sec.id) {
        case 'banniere':
          return <Banniere key={sec.id} cfg={cfg.accueil.banniere} />;

        case 'hero':
          return <Hero key={sec.id} cfg={cfg.accueil.hero} cp={cp} onNaviguer={naviguer} />;

        case 'avantages':
          return (
            <div key={sec.id} style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'center', gap: isMobile ? 16 : 40, flexWrap: 'wrap' }}>
                {[['🚚', 'Livraison rapide', '24–48h ouvrables'], ['🔒', 'Paiement sécurisé', 'Stripe certifié'], ['🔄', 'Retours faciles', 'Sous 30 jours'], ['💬', 'Support client', 'Réponse rapide']].map(([ico, titre, desc]) => (
                  <div key={titre} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
                    <span style={{ fontSize: 24 }}>{ico}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{titre}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'vedette':
          if (produitsVedette.length === 0) return null;
          return (
            <div key={sec.id} style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>⭐ Produits en vedette</h2>
                <button onClick={() => naviguer('catalogue')} style={{ background: 'none', border: `2px solid ${cp}`, borderRadius: 8, color: cp, fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '8px 18px' }}>Voir tout →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(220px,1fr))`, gap: 20 }}>
                {produitsVedette.map(p => <CarteProduit key={p.id} produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} onClick={() => voirProduit(p)} />)}
              </div>
            </div>
          );

        case 'categories':
          if (categories.length === 0) return null;
          return (
            <div key={sec.id} style={{ background: '#f8fafc', padding: '56px 24px' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 32, textAlign: 'center' }}>Nos catégories</h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => { setFiltreCat(cat); naviguer('catalogue'); }}
                      style={{ background: '#fff', border: `2px solid ${cp}30`, borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = cp; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = '#1a1a1a'; }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'nouveautes':
          if (produitsNouveaux.length === 0) return null;
          return (
            <div key={sec.id} style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 32 }}>🆕 Nouveautés</h2>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(220px,1fr))`, gap: 20 }}>
                {produitsNouveaux.map(p => <CarteProduit key={p.id} produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} onClick={() => voirProduit(p)} />)}
              </div>
            </div>
          );

        case 'promo':
          if (produitsPromo.length === 0) return null;
          return (
            <div key={sec.id} style={{ background: '#fef2f2', padding: '56px 24px' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#ef4444', marginBottom: 32 }}>🏷 Offres spéciales</h2>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(220px,1fr))`, gap: 20 }}>
                  {produitsPromo.map(p => <CarteProduit key={p.id} produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} onClick={() => voirProduit(p)} />)}
                </div>
              </div>
            </div>
          );

        case 'temoignages':
          return (
            <div key={sec.id} style={{ background: '#f8fafc', padding: '56px 24px' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 40 }}>💬 Ce que disent nos clients</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
                  {[
                    { texte: 'Produits excellents et livraison ultra rapide ! Je recommande à 100%.', auteur: 'Marie L.', note: 5 },
                    { texte: 'Service client impeccable. Mes commandes arrivent toujours en parfait état.', auteur: 'Jean-Pierre M.', note: 5 },
                    { texte: 'Qualité au rendez-vous, prix compétitifs. Ma boutique préférée!', auteur: 'Sophie R.', note: 5 },
                  ].map((t, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '28px', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <div style={{ color: '#f59e0b', fontSize: 18, marginBottom: 12 }}>{'★'.repeat(t.note)}</div>
                      <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>"{t.texte}"</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>— {t.auteur}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'newsletter':
          return (
            <div key={sec.id} style={{ background: cp, padding: '56px 24px' }}>
              <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>📧 Restez informé</h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Recevez nos offres exclusives et nouveautés en avant-première.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <input type="email" placeholder="votre@courriel.com" style={{ flex: 1, minWidth: 220, padding: '13px 18px', borderRadius: 10, border: 'none', fontSize: 15, outline: 'none' }} />
                  <button style={{ background: '#fff', color: cp, border: 'none', borderRadius: 10, padding: '13px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>S'inscrire →</button>
                </div>
              </div>
            </div>
          );

        case 'blog-apercu':
          if (articles.length === 0) return null;
          return (
            <div key={sec.id} style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>📝 Notre blogue</h2>
                <button onClick={() => naviguer('blog')} style={{ background: 'none', border: `2px solid ${cp}`, borderRadius: 8, color: cp, fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '8px 18px' }}>Tous les articles →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
                {articles.slice(0, 3).map(a => (
                  <div key={a.id} onClick={() => voirArticle(a)} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer' }}>
                    {a.photo && <img src={a.photo} alt="" style={{ width: '100%', height: 180, objectFit: 'cover' }} />}
                    <div style={{ padding: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.4 }}>{a.titre}</h3>
                      {a.resume && <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{a.resume}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return <>{sectionsAccueil.map(renderSection)}</>;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE CATALOGUE
  // ══════════════════════════════════════════════════════════════════════════
  const PageCatalogue = () => {
    const colMap: Record<number, string> = { 2: 'repeat(auto-fill,minmax(300px,1fr))', 3: 'repeat(auto-fill,minmax(220px,1fr))', 4: 'repeat(auto-fill,minmax(180px,1fr))' };
    return (
      <div style={{ minHeight: '60vh' }}>
        {cfg.catalogue.sections?.find(s => s.id === 'banniere' && s.actif) && <Banniere cfg={cfg.catalogue.sections?.find(s=>s.id==='banniere')?.actif ? BAN_DEF : BAN_DEF} />}

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          {/* En-tête */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{cfg.catalogue.titre}</h1>
            {cfg.catalogue.sousTitre && <p style={{ fontSize: 16, color: '#666' }}>{cfg.catalogue.sousTitre}</p>}
          </div>

          {/* Filtres */}
          {(cfg.catalogue.afficherRecherche || cfg.catalogue.afficherFiltres) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              {cfg.catalogue.afficherRecherche && (
                <input type="text" placeholder="🔍 Rechercher un produit..." value={filtreRecherche} onChange={e => setFiltreRecherche(e.target.value)}
                  style={{ ...styleInput, maxWidth: 320, flex: 1 }} />
              )}
              {cfg.catalogue.afficherFiltres && categories.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setFiltreCat('')}
                    style={{ background: !filtreCat ? cp : '#f3f4f6', color: !filtreCat ? '#fff' : '#555', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Tous
                  </button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setFiltreCat(cat === filtreCat ? '' : cat)}
                      style={{ background: filtreCat === cat ? cp : '#f3f4f6', color: filtreCat === cat ? '#fff' : '#555', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Résultats */}
          <div style={{ marginBottom: 12, fontSize: 13, color: '#888' }}>{produitsFiltres.length} produit(s)</div>

          {produitsFiltres.length === 0
            ? <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#555', marginBottom: 8 }}>Aucun produit trouvé</h2>
                <p>Essayez de modifier vos filtres.</p>
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: colMap[cfg.catalogue.colonnes] || colMap[3], gap: 20 }}>
                {produitsFiltres.map(p => <CarteProduit key={p.id} produit={p} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} onClick={() => voirProduit(p)} />)}
              </div>
          }
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE FICHE PRODUIT — config dynamique via fp (ConfigFicheProduit)
  // ══════════════════════════════════════════════════════════════════════════
  const PageProduit = () => {
    const [photoIdx, setPhotoIdx] = useState(0);
    const [descExpanded, setDescExpanded] = useState(false);
    const [ongletActif, setOngletActif] = useState<'description'|'details'|'livraison'>('description');

    if (!produitActif) return null;
    const p = produitActif;
    const enPromo = p.prix_promo && p.prix_promo < p.prix;
    const photos = [p.photo_principale, ...(p.photos || [])].filter(Boolean) as string[];
    const btnCouleur = fp.boutonCouleur || cp;

    // Galerie component
    const GalerieBlock = () => (
      <div>
        {fp.photosMiniatures === 'gauche' && photos.length > 1 ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {photos.map((ph, i) => (
                <div key={i} onClick={() => setPhotoIdx(i)}
                  style={{ width: 56, height: 56, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${photoIdx === i ? btnCouleur : '#e5e7eb'}`, flexShrink: 0 }}>
                  <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div style={{ flex: 1, borderRadius: 14, overflow: 'hidden', background: '#f3f4f6', aspectRatio: '1' }}>
              {photos.length > 0
                ? <img src={photos[photoIdx]} alt={p.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, color: '#d1d5db' }}>📦</div>}
            </div>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: '#f3f4f6', aspectRatio: '1', marginBottom: 10 }}>
              {photos.length > 0
                ? <img src={photos[photoIdx]} alt={p.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, color: '#d1d5db' }}>📦</div>}
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {photos.map((ph, i) => (
                  <div key={i} onClick={() => setPhotoIdx(i)}
                    style={{ width: 60, height: 60, borderRadius: 7, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${photoIdx === i ? btnCouleur : '#e5e7eb'}` }}>
                    <img src={ph} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );

    // Info panel component
    const InfoBlock = () => (
      <div>
        {fp.afficherCategorie && p.categorie && <div style={{ fontSize: 12, color: btnCouleur, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{p.categorie}</div>}
        <h1 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: '#1a1a1a', marginBottom: 14, lineHeight: 1.2 }}>{p.titre}</h1>
        {fp.afficherSku && p.sku && <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>SKU : {p.sku}</div>}

        {/* Prix */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
          {enPromo ? (
            <>
              <span style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{prix(p.prix_promo!)}</span>
              <span style={{ fontSize: 20, color: '#aaa', textDecoration: 'line-through' }}>{prix(p.prix)}</span>
              {fp.afficherRabaisPct && <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
                -{Math.round((1 - p.prix_promo! / p.prix) * 100)}%
              </span>}
            </>
          ) : <span style={{ fontSize: 32, fontWeight: 800, color: btnCouleur }}>{prix(p.prix)}</span>}
        </div>

        {/* Stock */}
        {fp.afficherStock && p.stock !== undefined && (
          <div style={{ marginBottom: 16 }}>
            {p.stock > 0
              ? <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ En stock ({p.stock} disponible{p.stock > 1 ? 's' : ''})</span>
              : <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>❌ Épuisé</span>}
          </div>
        )}

        {/* Variantes */}
        {p.variantes && p.variantes.map(v => (
          <div key={v.nom} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 7 }}>{v.nom}</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {v.valeurs.map(val => (
                <button key={val} onClick={() => setVarianteChoisie(prev => ({ ...prev, [v.nom]: val }))}
                  style={{ padding: '7px 14px', borderRadius: 7, border: `2px solid ${varianteChoisie[v.nom] === val ? btnCouleur : '#e5e7eb'}`, background: varianteChoisie[v.nom] === val ? `${btnCouleur}12` : '#fff', color: varianteChoisie[v.nom] === val ? btnCouleur : '#333', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Quantité */}
        {fp.afficherQte && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 7 }}>Quantité</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setQteChoisie(q => Math.max(1, q - 1))}
                style={{ width: 38, height: 38, borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 17, fontWeight: 700 }}>−</button>
              <span style={{ fontSize: 17, fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{qteChoisie}</span>
              <button onClick={() => setQteChoisie(q => q + 1)} disabled={p.stock !== undefined && qteChoisie >= p.stock}
                style={{ width: 38, height: 38, borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', cursor: p.stock !== undefined && qteChoisie >= p.stock ? 'not-allowed' : 'pointer', fontSize: 17, fontWeight: 700, opacity: p.stock !== undefined && qteChoisie >= p.stock ? 0.4 : 1 }}>+</button>
            </div>
          </div>
        )}

        {/* Bouton */}
        <button onClick={() => ajouterAuPanier(p)} disabled={p.stock === 0}
          style={{ width: '100%', padding: '14px 24px', background: p.stock === 0 ? '#e5e7eb' : btnCouleur, color: p.stock === 0 ? '#aaa' : '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: p.stock === 0 ? 'not-allowed' : 'pointer', marginBottom: 14 }}>
          {p.stock === 0 ? 'Épuisé' : `🛒 ${fp.boutonLabel}`}
        </button>

        {/* Réassurance */}
        {fp.afficherReassurance && fp.reassuranceItems.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {fp.reassuranceItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
                <span>{item.icone}</span><span>{item.texte}</span>
              </div>
            ))}
          </div>
        )}

        {/* Partage */}
        {fp.afficherPartage && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#888', alignSelf: 'center' }}>Partager :</span>
            {[['Facebook','🔵'],['Pinterest','📌'],['X','🐦']].map(([nom, ico]) => (
              <button key={nom} style={{ padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {ico} {nom}
              </button>
            ))}
          </div>
        )}

        {/* Description — position 'droite' ou 'onglets' */}
        {fp.descriptionPosition !== 'bas' && p.description && (
          fp.descriptionPosition === 'onglets' ? (
            <div style={{ marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}>
                {(['description','details','livraison'] as const).map(ong => (
                  <button key={ong} onClick={() => setOngletActif(ong)}
                    style={{ padding: '8px 16px', border: 'none', background: 'none', borderBottom: `2px solid ${ongletActif===ong ? btnCouleur : 'transparent'}`, color: ongletActif===ong ? btnCouleur : '#888', fontSize: 13, fontWeight: ongletActif===ong ? 700 : 500, cursor: 'pointer', marginBottom: -2, textTransform: 'capitalize' }}>
                    {ong === 'description' ? 'Description' : ong === 'details' ? 'Détails' : 'Livraison'}
                  </button>
                ))}
              </div>
              {ongletActif === 'description' && <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{p.description}</div>}
              {ongletActif === 'details'     && <div style={{ fontSize: 14, color: '#888' }}>Aucun détail supplémentaire.</div>}
              {ongletActif === 'livraison'   && <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8 }}>Livraison standard : 2–5 jours ouvrables.<br />Livraison express disponible au moment du paiement.</div>}
            </div>
          ) : (
            <div style={{ marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 10 }}>Description</h3>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap', overflow: fp.descriptionTronquee && !descExpanded ? 'hidden' : 'visible', maxHeight: fp.descriptionTronquee && !descExpanded ? 120 : 'none' }}>
                {p.description}
              </div>
              {fp.descriptionTronquee && p.description.length > 300 && (
                <button onClick={() => setDescExpanded(!descExpanded)}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: btnCouleur, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {descExpanded ? '▲ Réduire' : '▼ Lire plus'}
                </button>
              )}
            </div>
          )
        )}
      </div>
    );

    // Description pleine largeur (bas)
    const DescriptionBas = () => fp.descriptionPosition === 'bas' && p.description ? (
      <div style={{ marginTop: 48, paddingTop: 40, borderTop: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 16 }}>Description</h3>
        <div style={{ fontSize: 15, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: fp.descriptionTronquee && !descExpanded ? 160 : 'none', overflow: fp.descriptionTronquee && !descExpanded ? 'hidden' : 'visible' }}>
          {p.description}
        </div>
        {fp.descriptionTronquee && p.description.length > 400 && (
          <button onClick={() => setDescExpanded(!descExpanded)}
            style={{ marginTop: 10, background: 'none', border: 'none', color: btnCouleur, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {descExpanded ? '▲ Réduire' : '▼ Lire plus'}
          </button>
        )}
      </div>
    ) : null;

    // Layout image-haut
    if (!isMobile && fp.layout === 'image-haut') {
      return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          {fp.afficherBreadcrumb && (
            <div style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#888' }}>
              <button onClick={() => naviguer('accueil')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Accueil</button>
              <span>›</span><button onClick={() => naviguer('catalogue')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Catalogue</button>
              <span>›</span><span style={{ color: '#333' }}>{p.titre}</span>
            </div>
          )}
          <div style={{ marginBottom: 36 }}><GalerieBlock /></div>
          <InfoBlock />
          <DescriptionBas />
          {fp.afficherSimilaires && produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).length > 0 && (
            <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>{fp.similairesTitre}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                {produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).slice(0, fp.similairesNombre).map(pr => (
                  <CarteProduit key={pr.id} produit={pr} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} onClick={() => voirProduit(pr)} />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Layout gauche/droite (défaut + mobile)
    const imageCol = <GalerieBlock />;
    const infoCol  = <InfoBlock />;
    const isInverse = !isMobile && fp.layout === 'image-droite';

    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        {fp.afficherBreadcrumb && (
          <div style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#888' }}>
            <button onClick={() => naviguer('accueil')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Accueil</button>
            <span>›</span><button onClick={() => naviguer('catalogue')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: btnCouleur, fontSize: 13 }}>Catalogue</button>
            <span>›</span><span style={{ color: '#333' }}>{p.titre}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {isInverse ? <>{infoCol}{imageCol}</> : <>{imageCol}{infoCol}</>}
        </div>
        <DescriptionBas />
        {fp.afficherSimilaires && produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).length > 0 && (
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 20 }}>{fp.similairesTitre}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
              {produits.filter(pr => pr.id !== p.id && pr.categorie === p.categorie).slice(0, fp.similairesNombre).map(pr => (
                <CarteProduit key={pr.id} produit={pr} cp={cp} afficherPrix={cfg.catalogue.afficherPrix} onClick={() => voirProduit(pr)} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE BLOG
  // ══════════════════════════════════════════════════════════════════════════
  const PageBlog = () => (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <Banniere cfg={cfg.blog.banniere} />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{cfg.blog.titre}</h1>
      {cfg.blog.sousTitre && <p style={{ fontSize: 16, color: '#666', marginBottom: 36 }}>{cfg.blog.sousTitre}</p>}
      {articles.length === 0
        ? <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
            <h2 style={{ fontSize: 20, color: '#555', marginBottom: 8 }}>Aucun article pour l'instant</h2>
            <p>Revenez bientôt !</p>
          </div>
        : <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${cfg.blog.colonnes === 2 ? '340px' : '280px'},1fr))`, gap: 24 }}>
            {articles.map(a => (
              <div key={a.id} onClick={() => voirArticle(a)}
                style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${cp}15`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>
                {a.photo && <img src={a.photo} alt="" style={{ width: '100%', height: 200, objectFit: 'cover' }} />}
                <div style={{ padding: 20 }}>
                  {a.categorie && <span style={{ fontSize: 11, fontWeight: 700, color: cp, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.categorie}</span>}
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '8px 0 10px', lineHeight: 1.3 }}>{a.titre}</h2>
                  {a.resume && <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>{a.resume}</p>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#aaa' }}>
                    {cfg.blog.afficherAuteur && a.auteur && <span>✍️ {a.auteur}</span>}
                    {cfg.blog.afficherDate   && a.date_publication && <span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE ARTICLE BLOG
  // ══════════════════════════════════════════════════════════════════════════
  const PageArticle = () => {
    if (!articleActif) return null;
    const a = articleActif;
    return (
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
        <button onClick={() => setPage('blog')} style={{ background: 'none', border: 'none', color: cp, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Retour au blogue
        </button>
        {a.photo && <img src={a.photo} alt="" style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 16, marginBottom: 32 }} />}
        {a.categorie && <span style={{ fontSize: 12, fontWeight: 700, color: cp, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.categorie}</span>}
        <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, color: '#1a1a1a', margin: '12px 0 16px', lineHeight: 1.2 }}>{a.titre}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#888', marginBottom: 32 }}>
          {cfg.blog.afficherAuteur && a.auteur && <span>✍️ {a.auteur}</span>}
          {cfg.blog.afficherDate && a.date_publication && <span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
        </div>
        {a.resume && <p style={{ fontSize: 18, color: '#555', lineHeight: 1.8, marginBottom: 32, fontStyle: 'italic', borderLeft: `4px solid ${cp}`, paddingLeft: 20 }}>{a.resume}</p>}
        <div style={{ fontSize: 16, color: '#333', lineHeight: 1.9 }}>
          <p>Contenu de l'article disponible depuis le gestionnaire de blog.</p>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE FAQ
  // ══════════════════════════════════════════════════════════════════════════
  const PageFaq = () => (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
      <Banniere cfg={cfg.faq.banniere} />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{cfg.faq.titre}</h1>
      {cfg.faq.sousTitre && <p style={{ fontSize: 16, color: '#666', marginBottom: 40 }}>{cfg.faq.sousTitre}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {cfg.faq.items.map((item, i) => (
          <div key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
            <button onClick={() => setFaqOuvert(faqOuvert === i ? null : i)}
              style={{ width: '100%', background: 'none', border: 'none', padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16, textAlign: 'left' }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>{item.question}</span>
              <span style={{ fontSize: 20, color: cp, flexShrink: 0, transition: 'transform 0.2s', transform: faqOuvert === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            {faqOuvert === i && (
              <div style={{ paddingBottom: 20, fontSize: 15, color: '#555', lineHeight: 1.7 }}>{item.reponse}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE CONTACT
  // ══════════════════════════════════════════════════════════════════════════
  const PageContact = () => (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <Banniere cfg={cfg.contact.banniere} />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>{cfg.contact.titre}</h1>
      {cfg.contact.sousTitre && <p style={{ fontSize: 16, color: '#666', marginBottom: 40 }}>{cfg.contact.sousTitre}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 48 }}>
        {/* Coordonnées */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 24 }}>Nos coordonnées</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {cfg.contact.adresse && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cp}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📍</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 2 }}>Adresse</div><div style={{ fontSize: 15, color: '#1a1a1a' }}>{cfg.contact.adresse}</div></div>
              </div>
            )}
            {cfg.contact.telephone && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cp}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📞</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 2 }}>Téléphone</div><a href={`tel:${cfg.contact.telephone}`} style={{ fontSize: 15, color: cp, textDecoration: 'none', fontWeight: 600 }}>{cfg.contact.telephone}</a></div>
              </div>
            )}
            {cfg.contact.courriel && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cp}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✉️</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 2 }}>Courriel</div><a href={`mailto:${cfg.contact.courriel}`} style={{ fontSize: 15, color: cp, textDecoration: 'none', fontWeight: 600 }}>{cfg.contact.courriel}</a></div>
              </div>
            )}
          </div>
          {cfg.contact.afficherCarte && cfg.contact.urlCarte && (
            <div style={{ marginTop: 28, borderRadius: 12, overflow: 'hidden', height: 260 }}>
              <iframe src={cfg.contact.urlCarte} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Carte" />
            </div>
          )}
        </div>

        {/* Formulaire */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 24 }}>Envoyer un message</h2>
          {contactEnvoi === 'ok'
            ? <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <h3 style={{ color: '#16a34a', margin: '0 0 8px' }}>Message envoyé !</h3>
                <p style={{ color: '#555', margin: 0 }}>Nous vous répondrons dans les meilleurs délais.</p>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Votre nom</label>
                  <input value={contactForm.nom} onChange={e => setContactForm(f => ({ ...f, nom: e.target.value }))} placeholder="Jean Tremblay" style={styleInput} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Votre courriel</label>
                  <input type="email" value={contactForm.courriel} onChange={e => setContactForm(f => ({ ...f, courriel: e.target.value }))} placeholder="jean@exemple.ca" style={styleInput} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Votre message</label>
                  <textarea value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} rows={5} placeholder="Décrivez votre question..." style={{ ...styleInput, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                {contactEnvoi === 'err' && <p style={{ color: '#ef4444', fontSize: 14, margin: 0 }}>❌ Erreur — veuillez réessayer.</p>}
                <button onClick={envoyerContact} disabled={contactEnvoi === 'loading' || !contactForm.nom || !contactForm.courriel || !contactForm.message}
                  style={{ ...styleBtn, opacity: (!contactForm.nom || !contactForm.courriel || !contactForm.message) ? 0.5 : 1 }}>
                  {contactEnvoi === 'loading' ? '⏳ Envoi...' : 'Envoyer le message →'}
                </button>
              </div>
          }
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: `'${cfg.accueil.police || 'Inter'}', -apple-system, sans-serif`, background: cfg.accueil.couleurFondPage, color: cfg.accueil.couleurTexte, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } button { font-family: inherit; }`}</style>

      <Nav />
      <TiroirPanier />

      <main style={{ flex: 1 }}>
        {page === 'accueil'   && <PageAccueil />}
        {page === 'catalogue' && <PageCatalogue />}
        {page === 'produit'   && <PageProduit />}
        {page === 'blog'      && <PageBlog />}
        {page === 'article'   && <PageArticle />}
        {page === 'faq'       && <PageFaq />}
        {page === 'contact'   && <PageContact />}
      </main>

      <Footer cfg={cfg.footer} onNaviguer={naviguer} cacherPropulse={cacherPropulse} />
    </div>
  );
}