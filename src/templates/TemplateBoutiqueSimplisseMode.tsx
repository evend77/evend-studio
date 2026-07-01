// src/templates/TemplateBoutiqueSimplisseMode.tsx
// e-Vend Studio — Template Boutique Simplisse Mode
// Style éditorial fashion — ivoire, noir, accents configurables
// Sections réordonnables · Variantes couleur/taille · Lookbook · Guide des tailles

import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

// ─── Couleurs de base ─────────────────────────────────────────────────────────
const IVOIRE  = '#faf8f5';
const IVOIRE2 = '#f2ede6';
const NOIR    = '#0f0f0f';
const NOIR2   = '#1a1a1a';
const GRIS    = '#888888';
const GRIS2   = '#e8e4df';
const BORD    = '#e2ddd8';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Produit {
  id: number; titre: string; prix: number; prix_promo?: number;
  photo_principale?: string; photos?: string[]; description?: string;
  stock?: number; categorie?: string; sku?: string; marque?: string;
  note_moyenne?: number; nb_avis?: number; est_nouveau?: boolean;
  variantes?: { nom: string; valeurs: string[]; type?: 'couleur'|'taille'|'texte' }[];
}

interface ArticleBlog {
  id: number; titre: string; resume?: string;
  photo?: string; auteur?: string; date_publication?: string; categorie?: string;
}

interface PanierItem { produit: Produit; qte: number; variantes?: Record<string,string>; }

interface Section {
  id: string; label: string; icone: string; actif: boolean; ordre: number;
}

interface Props { config: any; siteId?: number; vendeurId: number; }

const px = (n: number) => n?.toFixed(2).replace('.', ',') + ' $';

// ─── Couleurs mode prédéfinies ────────────────────────────────────────────────
const COULEURS_MODE: Record<string, string> = {
  'Noir': '#0f0f0f', 'Blanc': '#ffffff', 'Crème': '#faf8f5',
  'Rouge': '#c0392b', 'Rose': '#e91e8c', 'Bordeaux': '#722f37',
  'Bleu': '#2563eb', 'Marine': '#1e3a5f', 'Ciel': '#87ceeb',
  'Vert': '#16a34a', 'Sauge': '#8fae88', 'Olive': '#6b7c3a',
  'Beige': '#c9a96e', 'Camel': '#c19a6b', 'Taupe': '#8b7355',
  'Gris': '#888888', 'Anthracite': '#3d3d3d', 'Lavande': '#967bb6',
  'Jaune': '#f59e0b', 'Orange': '#f97316', 'Corail': '#ff6b6b',
};

// ─── Config défaut ────────────────────────────────────────────────────────────
const SECTIONS_DEF: Section[] = [
  { id:'hero',         label:'Hero',              icone:'🎬', actif:true,  ordre:1 },
  { id:'banniere',     label:'Bannière promo',    icone:'📢', actif:true,  ordre:2 },
  { id:'vedette',      label:'Produits vedette',  icone:'👗', actif:true,  ordre:3 },
  { id:'collections',  label:'Collections',       icone:'🗂',  actif:true,  ordre:4 },
  { id:'lookbook',     label:'Lookbook',          icone:'📸', actif:true,  ordre:5 },
  { id:'instagram',    label:'Vu sur Instagram',  icone:'📱', actif:false, ordre:6 },
  { id:'temoignages',  label:'Témoignages',       icone:'⭐', actif:true,  ordre:7 },
  { id:'blog',         label:'Articles du blog',  icone:'📰', actif:true,  ordre:8 },
  { id:'infolettre',   label:'Infolettre',        icone:'📧', actif:true,  ordre:9 },
];

const CFG_DEF = {
  nomBoutique: 'Ma Boutique Mode',
  slogan: 'Style & Élégance',
  couleurAccent: '#722f37',
  couleurFond: IVOIRE,
  couleurTexte: NOIR,
  logoUrl: '',
  afficherBanniere: true,
  banniereTexte: '✦ LIVRAISON GRATUITE dès 80$ ✦ RETOURS GRATUITS 30 JOURS ✦ NOUVEAUTÉS CHAQUE SEMAINE ✦',
  banniereColor: '#722f37',
  sections: SECTIONS_DEF,
  hero: {
    titre: 'La Mode\nComme un Art',
    sousTitre: 'Collections exclusives · Pièces uniques · Style intemporel',
    boutonLabel: 'Découvrir la collection',
    photo: '',
    style: 'diagonal', // diagonal | centre | gauche
  },
  lookbook: {
    titre: 'Lookbook',
    sousTitre: 'Inspirations & Styles de la saison',
    photos: ['','','','','',''],
    disposition: 'masonry', // masonry | grille | plein
  },
  instagram: {
    handle: '@maboutique',
    titre: 'Suivez-nous sur Instagram',
    photos: ['','','','','',''],
  },
  catalogue: {
    colonnes: 3,
    afficherFiltresTaille: true,
    afficherFiltresCouleur: true,
    afficherGuidesTailles: true,
    afficherStock: true,
    afficherNote: true,
    afficherNouveauBadge: true,
    tailles: ['XS','S','M','L','XL','XXL'],
  },
  ficheProduit: {
    afficherZoom: true,
    afficherGuidesTailles: true,
    afficherCompleterLook: true,
    afficherAvis: true,
    afficherPartage: true,
    boutonLabel: 'Ajouter au panier',
    boutonCouleur: '',
  },
  footer: {
    nomBoutique: 'Ma Boutique Mode',
    slogan: 'Style & Élégance',
    couleurFond: NOIR,
    couleurTexte: '#ffffff',
    reseaux: { facebook:'', instagram:'', tiktok:'', twitter:'', youtube:'', pinterest:'' },
    colonnes: {
      titre1:'Boutique', liens1:'Accueil\nCatalogue\nLookbook\nBlog',
      titre2:'Service', liens2:'Contact\nRetours\nLivraison\nGuide des tailles',
      titre3:'', liens3:'',
    },
    afficherPropulse: true,
  },
};

// ─── Produits démo ────────────────────────────────────────────────────────────
const PRODUITS_DEMO: Produit[] = [
  { id:1, titre:'Robe Midi Fleurie', prix:89.99, prix_promo:69.99, stock:15, categorie:'Robes', note_moyenne:4.8, nb_avis:42, est_nouveau:true, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Rouge','Bleu','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
  { id:2, titre:'Blazer Oversized Crème', prix:129.99, stock:8, categorie:'Vestes', note_moyenne:4.9, nb_avis:28, photo_principale:'', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
  { id:3, titre:'Jean Taille Haute', prix:74.99, prix_promo:59.99, stock:20, categorie:'Pantalons', note_moyenne:4.7, nb_avis:61, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Noir','Bleu','Blanc'], type:'couleur' },{ nom:'Taille', valeurs:['36','38','40','42','44'], type:'taille' }] },
  { id:4, titre:'Top Épaules Dénudées', prix:44.99, stock:25, categorie:'Hauts', note_moyenne:4.6, nb_avis:33, est_nouveau:true, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Blanc','Rose','Sauge'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
  { id:5, titre:'Manteau Long Camel', prix:189.99, prix_promo:149.99, stock:6, categorie:'Manteaux', note_moyenne:4.9, nb_avis:19, photo_principale:'', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
  { id:6, titre:'Jupe Plissée Midi', prix:59.99, stock:18, categorie:'Jupes', note_moyenne:4.7, nb_avis:47, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Bordeaux','Vert','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
  { id:7, titre:'Ensemble Loungewear', prix:94.99, prix_promo:79.99, stock:12, categorie:'Loungewear', note_moyenne:4.8, nb_avis:55, est_nouveau:true, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Crème','Gris','Rose'], type:'couleur' },{ nom:'Taille', valeurs:['S','M','L'], type:'taille' }] },
  { id:8, titre:'Chemise Lin Oversize', prix:69.99, stock:22, categorie:'Hauts', note_moyenne:4.6, nb_avis:38, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Blanc','Beige','Bleu'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
];

// ─── Silhouette SVG mode (placeholder photo) ─────────────────────────────────
function SilhouetteMode({ taille = 200, couleur = '#c9a96e', style = 1 }: { taille?:number; couleur?:string; style?:number }) {
  if (style === 2) return (
    <svg width={taille} height={taille * 1.4} viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="18" rx="12" ry="14" fill={couleur} opacity="0.3"/>
      <path d="M30 45 Q50 35 70 45 L75 90 Q60 85 50 88 Q40 85 25 90 Z" fill={couleur} opacity="0.2"/>
      <path d="M35 90 Q50 88 65 90 L70 135 Q55 130 50 132 Q45 130 30 135 Z" fill={couleur} opacity="0.15"/>
    </svg>
  );
  return (
    <svg width={taille} height={taille * 1.6} viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="15" rx="11" ry="13" fill={couleur} opacity="0.35"/>
      <path d="M28 38 Q50 28 72 38 L78 70 Q62 65 50 67 Q38 65 22 70 Z" fill={couleur} opacity="0.25"/>
      <path d="M22 70 L18 100 Q35 95 50 97 Q65 95 82 100 L78 70 Q62 65 50 67 Q38 65 22 70 Z" fill={couleur} opacity="0.2"/>
      <path d="M20 100 Q15 130 18 155 L35 155 L38 110 Q50 108 62 110 L65 155 L82 155 Q85 130 80 100 Q65 95 50 97 Q35 95 20 100 Z" fill={couleur} opacity="0.18"/>
    </svg>
  );
}

// ─── Étoiles ──────────────────────────────────────────────────────────────────
function Etoiles({ note, taille=12 }: { note:number; taille?:number }) {
  return <span style={{ display:'inline-flex',gap:1 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:taille,color:i<=Math.round(note)?'#c9a96e':'#d1ccc6' }}>★</span>)}</span>;
}

// ─── Pastille couleur ─────────────────────────────────────────────────────────
function PastilleCouleur({ couleur, actif, onClick }: { couleur:string; actif:boolean; onClick:()=>void }) {
  const hex = COULEURS_MODE[couleur] || '#888';
  return (
    <button onClick={onClick} title={couleur}
      style={{ width:24,height:24,borderRadius:'50%',background:hex,border:`2px solid ${actif?'#0f0f0f':'transparent'}`,outline:actif?'2px solid #0f0f0f':'none',outlineOffset:2,cursor:'pointer',transition:'all 0.15s',flexShrink:0 }}/>
  );
}

// ─── Ticker bannière ──────────────────────────────────────────────────────────
function BanniereMode({ texte, couleur }: { texte:string; couleur:string }) {
  return (
    <div style={{ background:couleur,overflow:'hidden',height:34,display:'flex',alignItems:'center' }}>
      <style>{`.tick-mode{display:flex;white-space:nowrap;animation:tickm 25s linear infinite;}@keyframes tickm{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div className="tick-mode">
        {[...Array(4)].map((_,i)=><span key={i} style={{ fontSize:11,fontWeight:600,color:'#fff',letterSpacing:'0.12em',paddingRight:80 }}>{texte}</span>)}
      </div>
    </div>
  );
}

// ─── Modal Guide des tailles ──────────────────────────────────────────────────
function GuideDesTailles({ onFermer, cp }: { onFermer:()=>void; cp:string }) {
  return (
    <>
      <div onClick={onFermer} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,backdropFilter:'blur(4px)' }}/>
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:1001,background:'#fff',borderRadius:16,width:'90%',maxWidth:540,padding:32,fontFamily:"'Inter',sans-serif" }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
          <h2 style={{ fontSize:20,fontWeight:800,color:NOIR }}>📏 Guide des tailles</h2>
          <button onClick={onFermer} style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:GRIS }}>✕</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
            <thead>
              <tr style={{ background:IVOIRE2 }}>
                {['Taille','Buste (cm)','Taille (cm)','Hanches (cm)'].map(h=><th key={h} style={{ padding:'10px 14px',textAlign:'left',fontWeight:700,color:NOIR,borderBottom:`2px solid ${BORD}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[['XS','80-83','60-63','86-89'],['S','84-87','64-67','90-93'],['M','88-91','68-71','94-97'],['L','92-95','72-75','98-101'],['XL','96-99','76-79','102-105'],['XXL','100-103','80-83','106-109']].map(([t,...vals],i)=>(
                <tr key={t} style={{ background:i%2===0?'#fff':IVOIRE }}>
                  <td style={{ padding:'10px 14px',fontWeight:700,color:cp,borderBottom:`1px solid ${BORD}` }}>{t}</td>
                  {vals.map(v=><td key={v} style={{ padding:'10px 14px',color:NOIR2,borderBottom:`1px solid ${BORD}` }}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize:12,color:GRIS,marginTop:16,lineHeight:1.6 }}>💡 En cas de doute entre deux tailles, nous recommandons de prendre la taille supérieure.</p>
      </div>
    </>
  );
}

// ─── Carte Produit Mode ───────────────────────────────────────────────────────
function CarteProduitMode({ produit, cp, onClick, onWishlist, inWishlist }: {
  produit:Produit; cp:string; onClick:()=>void; onWishlist?:()=>void; inWishlist?:boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const enPromo = produit.prix_promo && produit.prix_promo < produit.prix;
  const photos = [produit.photo_principale, ...(produit.photos||[])].filter(Boolean) as string[];
  const couleurs = produit.variantes?.find(v=>v.type==='couleur');
  const tailles  = produit.variantes?.find(v=>v.type==='taille');

  return (
    <div style={{ position:'relative',background:'#fff',borderRadius:2,overflow:'hidden',cursor:'pointer',transition:'all 0.3s ease',boxShadow:hovered?'0 8px 32px rgba(0,0,0,0.12)':'0 1px 4px rgba(0,0,0,0.06)' }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={onClick}>
      {/* Image */}
      <div style={{ position:'relative',aspectRatio:'3/4',background:IVOIRE2,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
        {photos.length>0
          ? <img src={photos[photoIdx]} alt={produit.titre} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.5s ease',transform:hovered?'scale(1.06)':'scale(1)' }}/>
          : <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',width:'100%' }}>
              <SilhouetteMode taille={120} couleur={cp} style={Math.random()>0.5?1:2}/>
            </div>
        }
        {/* Badges */}
        <div style={{ position:'absolute',top:12,left:12,display:'flex',flexDirection:'column',gap:6 }}>
          {produit.est_nouveau && <span style={{ background:cp,color:'#fff',fontSize:9,fontWeight:800,padding:'3px 8px',letterSpacing:'0.1em',textTransform:'uppercase' }}>Nouveau</span>}
          {enPromo && <span style={{ background:NOIR,color:'#fff',fontSize:9,fontWeight:800,padding:'3px 8px',letterSpacing:'0.1em' }}>-{Math.round((1-produit.prix_promo!/produit.prix)*100)}%</span>}
        </div>
        {/* Wishlist */}
        {onWishlist && <button onClick={e=>{e.stopPropagation();onWishlist();}} style={{ position:'absolute',top:12,right:12,width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.9)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,backdropFilter:'blur(4px)',boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>{inWishlist?'❤️':'🤍'}</button>}
        {/* Bouton rapide */}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'12px',background:'linear-gradient(transparent,rgba(0,0,0,0.7))',opacity:hovered?1:0,transition:'opacity 0.3s ease' }}>
          <button onClick={e=>{e.stopPropagation();onClick();}} style={{ width:'100%',padding:'9px',background:'#fff',border:'none',fontSize:11,fontWeight:800,cursor:'pointer',letterSpacing:'0.1em',textTransform:'uppercase',color:NOIR }}>
            VOIR LE PRODUIT
          </button>
        </div>
        {/* Stock faible */}
        {produit.stock!==undefined&&produit.stock<=3&&produit.stock>0&&<span style={{ position:'absolute',bottom:hovered?50:12,left:12,background:'#f59e0b',color:'#fff',fontSize:9,fontWeight:800,padding:'3px 8px',transition:'bottom 0.3s' }}>Plus que {produit.stock}!</span>}
      </div>
      {/* Info */}
      <div style={{ padding:'12px 14px 16px' }}>
        {produit.categorie && <span style={{ fontSize:10,color:GRIS,textTransform:'uppercase',letterSpacing:'0.12em',fontWeight:600 }}>{produit.categorie}</span>}
        <h3 style={{ fontSize:14,fontWeight:600,color:NOIR,margin:'4px 0 6px',lineHeight:1.3 }}>{produit.titre}</h3>
        {/* Pastilles couleur */}
        {couleurs && couleurs.valeurs.length>0 && (
          <div style={{ display:'flex',gap:4,marginBottom:8,flexWrap:'wrap' }}>
            {couleurs.valeurs.map(c=><PastilleCouleur key={c} couleur={c} actif={false} onClick={()=>{}} />)}
          </div>
        )}
        {/* Tailles dispo */}
        {tailles && tailles.valeurs.length>0 && (
          <div style={{ display:'flex',gap:3,marginBottom:8,flexWrap:'wrap' }}>
            {tailles.valeurs.map(t=><span key={t} style={{ fontSize:9,color:GRIS,border:`1px solid ${BORD}`,padding:'2px 5px',letterSpacing:'0.06em' }}>{t}</span>)}
          </div>
        )}
        {/* Prix + note */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div style={{ display:'flex',alignItems:'baseline',gap:6 }}>
            {enPromo ? (<><span style={{ fontSize:16,fontWeight:800,color:cp }}>{px(produit.prix_promo!)}</span><span style={{ fontSize:12,color:GRIS,textDecoration:'line-through' }}>{px(produit.prix)}</span></>) : <span style={{ fontSize:16,fontWeight:700,color:NOIR }}>{px(produit.prix)}</span>}
          </div>
          {produit.note_moyenne && <div style={{ display:'flex',alignItems:'center',gap:3 }}><Etoiles note={produit.note_moyenne} taille={10}/><span style={{ fontSize:10,color:GRIS }}>({produit.nb_avis})</span></div>}
        </div>
      </div>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────────────────────
export default function TemplateBoutiqueSimplisseMode({ config: configBrut, siteId, vendeurId }: Props) {
  const raw = configBrut?.mode || {};
  const cfg = { ...CFG_DEF, ...raw, hero: { ...CFG_DEF.hero, ...(raw.hero||{}) }, catalogue: { ...CFG_DEF.catalogue, ...(raw.catalogue||{}) }, ficheProduit: { ...CFG_DEF.ficheProduit, ...(raw.ficheProduit||{}) }, footer: { ...CFG_DEF.footer, ...(raw.footer||{}) }, lookbook: { ...CFG_DEF.lookbook, ...(raw.lookbook||{}) }, instagram: { ...CFG_DEF.instagram, ...(raw.instagram||{}) } };
  const cp = cfg.couleurAccent || '#722f37';
  const sections: Section[] = cfg.sections || SECTIONS_DEF;
  const sectionsActives = [...sections].filter(s=>s.actif).sort((a,b)=>a.ordre-b.ordre);

  type PageId = 'accueil'|'catalogue'|'produit'|'blog'|'faq'|'contact'|'panier'|'wishlist'|'compte'|'login';
  const [page, setPage]               = useState<PageId>('accueil');
  const [produitActif, setProduitActif] = useState<Produit|null>(null);
  const [isMobile, setIsMobile]       = useState(false);
  const [menuOuvert, setMenuOuvert]   = useState(false);
  const [produits, setProduits]       = useState<Produit[]>([]);
  const [articles, setArticles]       = useState<ArticleBlog[]>([]);
  const [categories, setCategories]   = useState<string[]>([]);
  const [panier, setPanier]           = useState<PanierItem[]>([]);
  const [wishlist, setWishlist]       = useState<number[]>([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [filtreCat, setFiltreCat]     = useState('');
  const [filtreTaille, setFiltreTaille] = useState('');
  const [filtreCouleur, setFiltreCouleur] = useState('');
  const [filtreRecherche, setFiltreRecherche] = useState('');
  const [filtrePrixMin, setFiltrePrixMin] = useState('');
  const [filtrePrixMax, setFiltrePrixMax] = useState('');
  const [tri, setTri]                 = useState<'recent'|'prix_asc'|'prix_desc'|'note'>('recent');
  const [popupPromo, setPopupPromo]   = useState(false);
  const [notifVente, setNotifVente]   = useState(false);
  const [photoIdx, setPhotoIdx]       = useState(0);
  const [qteChoisie, setQteChoisie]   = useState(1);
  const [variantesChoisies, setVariantesChoisies] = useState<Record<string,string>>({});
  const [zoomActif, setZoomActif]     = useState(false);
  const [sourisPos, setSourisPos]     = useState({x:0,y:0});
  const [guideOuvert, setGuideOuvert] = useState(false);
  const [ongletProduit, setOngletProduit] = useState<'description'|'avis'|'livraison'>('description');
  const [faqOuvert, setFaqOuvert]     = useState<number|null>(null);
  const [contactForm, setContactForm] = useState({nom:'',courriel:'',sujet:'',message:''});
  const [contactStatut, setContactStatut] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [loginForm, setLoginForm]     = useState({email:'',mdp:''});
  const [loginStatut, setLoginStatut] = useState<'idle'|'loading'|'err'>('idle');
  const [loginErreur, setLoginErreur] = useState('');
  const [acheteur, setAcheteur]       = useState<any>(null);
  const [codePromo, setCodePromo]     = useState('');
  const [codePromoApplique, setCodePromoApplique] = useState<any>(null);
  const [notifIdx, setNotifIdx]       = useState(0);

  useEffect(()=>{ const c=()=>setIsMobile(window.innerWidth<768); c(); window.addEventListener('resize',c); return()=>window.removeEventListener('resize',c); },[]);
  useEffect(()=>{ if(cfg.afficherPopupPromo){ const t=setTimeout(()=>setPopupPromo(true),4000); return()=>clearTimeout(t); } },[]);
  useEffect(()=>{
    const t1=setTimeout(()=>setNotifVente(true),5000);
    const iv=setInterval(()=>{ setNotifVente(false); setTimeout(()=>{ setNotifIdx(i=>(i+1)%4); setNotifVente(true); },500); },8000);
    return()=>{ clearTimeout(t1); clearInterval(iv); };
  },[]);

  useEffect(()=>{
    if(configBrut?.__produits_demo__){ setProduits(configBrut.__produits_demo__); setCategories(Array.from(new Set(configBrut.__produits_demo__.map((p:any)=>p.categorie).filter(Boolean))) as string[]); return; }
    setProduits(PRODUITS_DEMO); setCategories(Array.from(new Set(PRODUITS_DEMO.map(p=>p.categorie).filter(Boolean))) as string[]);
    fetch(`${API_BASE}/produits/vendeur/${vendeurId}?limit=100`).then(r=>r.ok?r.json():null).then(data=>{ if(!data) return; const l:Produit[]=data.produits||data||[]; if(l.length>0){ setProduits(l); setCategories(Array.from(new Set(l.map(p=>p.categorie).filter(Boolean))) as string[]); } }).catch(()=>{});
  },[vendeurId]);

  useEffect(()=>{ fetch(`${API_BASE}/blog/vendeur/${vendeurId}?publie=true&limit=6`).then(r=>r.ok?r.json():[]).then(data=>setArticles(Array.isArray(data)?data:data.articles||[])).catch(()=>{}); },[vendeurId]);
  useEffect(()=>{ const u=localStorage.getItem(`acheteur_${vendeurId}`),t=localStorage.getItem(`acheteur_token_${vendeurId}`); if(u&&t){ try{ setAcheteur(JSON.parse(u)); } catch{} } },[vendeurId]);

  const naviguer = useCallback((dest:string)=>{ setMenuOuvert(false); setPanierOuvert(false); window.scrollTo({top:0,behavior:'smooth'}); const map:Record<string,PageId>={ accueil:'accueil',catalogue:'catalogue',blog:'blog',faq:'faq',contact:'contact',panier:'panier',wishlist:'wishlist',compte:'compte',login:'login' }; if(map[dest.toLowerCase()]) setPage(map[dest.toLowerCase()]); },[]);

  const voirProduit = (p:Produit)=>{ setProduitActif(p); setPhotoIdx(0); setQteChoisie(1); setVariantesChoisies({}); setOngletProduit('description'); setPage('produit'); window.scrollTo({top:0,behavior:'smooth'}); };

  const ajouterAuPanier = (produit:Produit)=>{
    setPanier(prev=>{ const ex=prev.find(i=>i.produit.id===produit.id&&JSON.stringify(i.variantes)===JSON.stringify(variantesChoisies)); if(ex) return prev.map(i=>i.produit.id===produit.id?{...i,qte:i.qte+qteChoisie}:i); return [...prev,{produit,qte:qteChoisie,variantes:{...variantesChoisies}}]; });
    setPanierOuvert(true);
  };

  const totalPanier = panier.reduce((s,i)=>s+(i.produit.prix_promo||i.produit.prix)*i.qte,0);
  const nbPanier    = panier.reduce((s,i)=>s+i.qte,0);
  const totalApres  = codePromoApplique ? (codePromoApplique.type==='pourcentage'?totalPanier*(1-codePromoApplique.valeur/100):Math.max(0,totalPanier-codePromoApplique.valeur)) : totalPanier;
  const toggleWishlist = (id:number)=>setWishlist(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);

  const handleLogin=async()=>{ setLoginStatut('loading'); setLoginErreur(''); try{ const res=await fetch(`${API_BASE}/acheteurs/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:loginForm.email,mot_de_passe:loginForm.mdp,gestionnaire_id:vendeurId})}); const data=await res.json(); if(!res.ok) throw new Error(data.message||'Erreur'); setAcheteur(data.acheteur); localStorage.setItem(`acheteur_${vendeurId}`,JSON.stringify(data.acheteur)); localStorage.setItem(`acheteur_token_${vendeurId}`,data.token); setLoginStatut('idle'); naviguer('compte'); } catch(e:any){ setLoginErreur(e.message||'Erreur'); setLoginStatut('err'); } };
  const handleLogout=()=>{ setAcheteur(null); localStorage.removeItem(`acheteur_${vendeurId}`); localStorage.removeItem(`acheteur_token_${vendeurId}`); naviguer('accueil'); };
  const envoyerContact=async()=>{ setContactStatut('loading'); try{ const res=await fetch(`${API_BASE}/contact/vendeur/${vendeurId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(contactForm)}); if(!res.ok) throw new Error(); setContactStatut('ok'); setContactForm({nom:'',courriel:'',sujet:'',message:''}); } catch{ setContactStatut('err'); } setTimeout(()=>setContactStatut('idle'),4000); };

  const produitsFiltres = produits.filter(p=>{
    const mc=!filtreCat||p.categorie===filtreCat;
    const mr=!filtreRecherche||p.titre.toLowerCase().includes(filtreRecherche.toLowerCase());
    const mn=!filtrePrixMin||p.prix>=parseFloat(filtrePrixMin);
    const mx=!filtrePrixMax||p.prix<=parseFloat(filtrePrixMax);
    const mt=!filtreTaille||p.variantes?.find(v=>v.type==='taille')?.valeurs.includes(filtreTaille);
    const mcoul=!filtreCouleur||p.variantes?.find(v=>v.type==='couleur')?.valeurs.includes(filtreCouleur);
    return mc&&mr&&mn&&mx&&mt&&mcoul;
  }).sort((a,b)=>{ if(tri==='prix_asc') return (a.prix_promo||a.prix)-(b.prix_promo||b.prix); if(tri==='prix_desc') return (b.prix_promo||b.prix)-(a.prix_promo||a.prix); if(tri==='note') return (b.note_moyenne||0)-(a.note_moyenne||0); return 0; });

  const styleInput:React.CSSProperties = { width:'100%',padding:'11px 14px',background:'#fff',border:`1px solid ${BORD}`,borderRadius:0,fontSize:13,outline:'none',color:NOIR,fontFamily:'inherit',boxSizing:'border-box' };
  const styleBtn:React.CSSProperties  = { background:cp,color:'#fff',border:'none',padding:'14px 28px',fontSize:13,fontWeight:700,cursor:'pointer',letterSpacing:'0.1em',textTransform:'uppercase' };

  const notifVentes = [
    { prenom:'Sophie', ville:'Montréal', produit:'Robe Midi Fleurie', temps:'2 min' },
    { prenom:'Emma', ville:'Québec', produit:'Blazer Oversized Crème', temps:'5 min' },
    { prenom:'Marie', ville:'Laval', produit:'Jean Taille Haute', temps:'9 min' },
    { prenom:'Léa', ville:'Sherbrooke', produit:'Écharpe Cachemire', temps:'14 min' },
  ];

  // ══ NAV ══════════════════════════════════════════════════════════════════
  const Nav = () => (
    <nav style={{ position:'sticky',top:0,zIndex:100,background:'rgba(250,248,245,0.96)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${BORD}` }}>
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <button onClick={()=>naviguer('accueil')} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}>
          {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomBoutique} style={{ height:36 }}/> :
            <div><div style={{ fontSize:20,fontWeight:900,color:NOIR,letterSpacing:'-0.02em',fontFamily:'Georgia,serif' }}>{cfg.nomBoutique}</div><div style={{ fontSize:9,color:cp,letterSpacing:'0.2em',textTransform:'uppercase' }}>{cfg.slogan}</div></div>}
        </button>
        {!isMobile&&<div style={{ display:'flex',gap:2 }}>
          {[['accueil','Accueil'],['catalogue','Catalogue'],['blog','Blog'],['faq','FAQ'],['contact','Contact']].map(([id,label])=>(
            <button key={id} onClick={()=>naviguer(id)} style={{ background:'none',border:'none',color:page===id?cp:NOIR2,fontSize:13,fontWeight:page===id?700:400,cursor:'pointer',padding:'8px 16px',letterSpacing:'0.04em',borderBottom:page===id?`2px solid ${cp}`:'2px solid transparent',transition:'all 0.2s' }}>{label}</button>
          ))}</div>}
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={()=>naviguer('wishlist')} style={{ position:'relative',background:'none',border:'none',cursor:'pointer',fontSize:20,padding:8,color:NOIR }}>🤍{wishlist.length>0&&<span style={{ position:'absolute',top:2,right:2,background:cp,color:'#fff',borderRadius:'50%',width:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800 }}>{wishlist.length}</span>}</button>
          <button onClick={()=>naviguer(acheteur?'compte':'login')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:18,padding:8,color:NOIR,position:'relative' }}>
            {acheteur?'👤':'🔑'}{acheteur&&<div style={{ position:'absolute',bottom:6,right:6,width:7,height:7,borderRadius:'50%',background:'#4ade80',border:'1.5px solid '+IVOIRE }}/>}
          </button>
          <button onClick={()=>setPanierOuvert(!panierOuvert)} style={{ display:'flex',alignItems:'center',gap:6,background:'none',border:`1.5px solid ${BORD}`,padding:'8px 14px',cursor:'pointer',color:NOIR,fontSize:13,fontWeight:500 }}>
            🛒{nbPanier>0&&<span style={{ background:cp,color:'#fff',borderRadius:20,padding:'1px 7px',fontSize:11,fontWeight:800 }}>{nbPanier}</span>}{!isMobile&&<span style={{ fontSize:13 }}>{px(totalPanier)}</span>}
          </button>
          {isMobile&&<button onClick={()=>setMenuOuvert(!menuOuvert)} style={{ background:'none',border:`1px solid ${BORD}`,padding:'8px 12px',cursor:'pointer',color:NOIR,fontSize:16 }}>{menuOuvert?'✕':'☰'}</button>}
        </div>
      </div>
      {isMobile&&menuOuvert&&<div style={{ background:IVOIRE,borderTop:`1px solid ${BORD}`,padding:'12px 24px 20px' }}>
        {[['accueil','Accueil'],['catalogue','Catalogue'],['blog','Blog'],['faq','FAQ'],['contact','Contact']].map(([id,label])=>(
          <button key={id} onClick={()=>naviguer(id)} style={{ display:'block',width:'100%',textAlign:'left',background:'none',border:'none',borderBottom:`1px solid ${BORD}`,color:page===id?cp:NOIR2,fontSize:15,fontWeight:page===id?700:400,cursor:'pointer',padding:'14px 0' }}>{label}</button>
        ))}</div>}
    </nav>
  );

  // ══ TIROIR PANIER ════════════════════════════════════════════════════════
  const TiroirPanier = () => (
    <>
      {panierOuvert&&<div onClick={()=>setPanierOuvert(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:199,backdropFilter:'blur(3px)' }}/>}
      <div style={{ position:'fixed',top:0,right:panierOuvert?0:'-460px',width:Math.min(460,window.innerWidth),height:'100vh',background:'#fff',zIndex:200,boxShadow:'-4px 0 24px rgba(0,0,0,0.12)',display:'flex',flexDirection:'column',transition:'right 0.35s cubic-bezier(0.4,0,0.2,1)',borderLeft:`1px solid ${BORD}` }}>
        <div style={{ padding:'20px 24px',borderBottom:`1px solid ${BORD}`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div><h2 style={{ margin:0,fontSize:16,fontWeight:800,color:NOIR,textTransform:'uppercase',letterSpacing:'0.08em' }}>Votre panier</h2><span style={{ fontSize:12,color:cp }}>{nbPanier} article{nbPanier>1?'s':''}</span></div>
          <button onClick={()=>setPanierOuvert(false)} style={{ background:IVOIRE2,border:'none',padding:'8px 12px',cursor:'pointer',fontSize:14,color:NOIR,fontWeight:600 }}>FERMER</button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'16px 24px' }}>
          {panier.length===0 ? <div style={{ textAlign:'center',padding:'60px 0' }}><div style={{ fontSize:48,marginBottom:16 }}>🛒</div><p style={{ color:GRIS,marginBottom:20 }}>Votre panier est vide</p><button onClick={()=>{naviguer('catalogue');setPanierOuvert(false);}} style={styleBtn}>Découvrir la collection</button></div>
          : <>
              {cfg.afficherBarreLivraison&&<div style={{ background:IVOIRE2,padding:'10px 14px',marginBottom:16,fontSize:12,borderLeft:`3px solid ${cp}` }}>
                {totalPanier>=cfg.seuilLivraisonGratuite ? <span style={{ color:cp,fontWeight:700 }}>🎉 Livraison gratuite incluse !</span> : <span>Ajoutez <strong style={{ color:cp }}>{px(cfg.seuilLivraisonGratuite-totalPanier)}</strong> pour la livraison gratuite</span>}
              </div>}
              {panier.map((item,i)=>(
                <div key={i} style={{ display:'flex',gap:14,padding:'14px 0',borderBottom:`1px solid ${BORD}`,alignItems:'center' }}>
                  <div style={{ width:70,height:90,background:IVOIRE2,flexShrink:0,overflow:'hidden' }}>
                    {item.produit.photo_principale ? <img src={item.produit.photo_principale} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}><SilhouetteMode taille={50} couleur={cp}/></div>}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:'0 0 3px',fontSize:13,fontWeight:600,color:NOIR,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.produit.titre}</p>
                    {item.variantes&&Object.keys(item.variantes).length>0&&<p style={{ margin:'0 0 5px',fontSize:11,color:GRIS }}>{Object.entries(item.variantes).map(([k,v])=>`${k}: ${v}`).join(' · ')}</p>}
                    <p style={{ margin:0,fontSize:14,fontWeight:700,color:cp }}>{px((item.produit.prix_promo||item.produit.prix)*item.qte)}</p>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <button onClick={()=>setPanier(p=>p.map((it,j)=>j===i?{...it,qte:Math.max(1,it.qte-1)}:it))} style={{ width:28,height:28,border:`1px solid ${BORD}`,background:'#fff',cursor:'pointer',fontSize:14,fontWeight:700 }}>−</button>
                    <span style={{ fontSize:13,fontWeight:700,color:NOIR,minWidth:20,textAlign:'center' }}>{item.qte}</span>
                    <button onClick={()=>setPanier(p=>p.map((it,j)=>j===i?{...it,qte:it.qte+1}:it))} style={{ width:28,height:28,border:`1px solid ${BORD}`,background:'#fff',cursor:'pointer',fontSize:14,fontWeight:700 }}>+</button>
                    <button onClick={()=>setPanier(p=>p.filter((_,j)=>j!==i))} style={{ width:28,height:28,border:'none',background:'#fef2f2',color:'#ef4444',cursor:'pointer',fontSize:13,fontWeight:700 }}>✕</button>
                  </div>
                </div>
              ))}
            </>}
        </div>
        {panier.length>0&&<div style={{ padding:'20px 24px',borderTop:`1px solid ${BORD}` }}>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <input value={codePromo} onChange={e=>setCodePromo(e.target.value)} placeholder="Code promo" style={{ ...styleInput,flex:1 }}/>
            <button onClick={async()=>{ try{ const r=await fetch(`${API_BASE}/reductions/verifier`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:codePromo,vendeur_id:vendeurId,total:totalPanier})}); if(r.ok){ const d=await r.json(); setCodePromoApplique(d); } } catch{} }} style={{ ...styleBtn,padding:'11px 16px',fontSize:12 }}>OK</button>
          </div>
          {codePromoApplique&&<div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',padding:'8px 12px',marginBottom:12,fontSize:12,color:'#16a34a',display:'flex',justifyContent:'space-between' }}><span>✅ Code appliqué</span><button onClick={()=>{setCodePromoApplique(null);setCodePromo('');}} style={{ background:'none',border:'none',color:'#16a34a',cursor:'pointer',fontSize:11 }}>Retirer</button></div>}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:16,paddingTop:12,borderTop:`1px solid ${BORD}` }}>
            <span style={{ fontSize:15,fontWeight:800,color:NOIR,textTransform:'uppercase',letterSpacing:'0.06em' }}>Total</span>
            <span style={{ fontSize:20,fontWeight:900,color:cp }}>{px(totalApres)}</span>
          </div>
          <button style={{ ...styleBtn,width:'100%',textAlign:'center',padding:'16px',fontSize:14 }}>PASSER À LA CAISSE →</button>
          <button onClick={()=>naviguer('panier')} style={{ width:'100%',marginTop:10,padding:'10px',background:'none',border:`1px solid ${BORD}`,color:GRIS,fontSize:12,cursor:'pointer',letterSpacing:'0.06em' }}>VOIR LE PANIER COMPLET</button>
        </div>}
      </div>
    </>
  );

  // ══ NOTIF VENTE ═══════════════════════════════════════════════════════════
  const NotifVente = () => {
    const v = notifVentes[notifIdx];
    if (!notifVente || !cfg.afficherNotifVente) return null;
    return (
      <div style={{ position:'fixed',bottom:24,left:24,zIndex:500,background:'#fff',border:`1px solid ${BORD}`,padding:'12px 16px',display:'flex',gap:12,alignItems:'center',maxWidth:280,boxShadow:'0 4px 20px rgba(0,0,0,0.1)',animation:'fadeInUp 0.4s ease' }}>
        <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ width:36,height:36,background:IVOIRE2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>👗</div>
        <div>
          <p style={{ margin:0,fontSize:11,color:GRIS }}><strong style={{ color:NOIR }}>{v.prenom}</strong> de {v.ville}</p>
          <p style={{ margin:'2px 0 0',fontSize:10,color:cp,fontWeight:600 }}>a acheté {v.produit}</p>
          <p style={{ margin:'1px 0 0',fontSize:9,color:GRIS }}>il y a {v.temps}</p>
        </div>
        <button onClick={()=>setNotifVente(false)} style={{ position:'absolute',top:5,right:8,background:'none',border:'none',color:GRIS,cursor:'pointer',fontSize:11 }}>✕</button>
      </div>
    );
  };

  // ══ SECTIONS ACCUEIL ══════════════════════════════════════════════════════
  const SectionHero = () => (
    <div style={{ position:'relative',minHeight:isMobile?'80vh':'90vh',background:IVOIRE2,overflow:'hidden',display:'flex',alignItems:'center' }}>
      <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* Fond décoratif */}
      <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 70% 50%,${cp}08 0%,transparent 60%)` }}/>
      <div style={{ position:'absolute',top:-100,right:-100,width:400,height:400,borderRadius:'50%',background:`${cp}06`,border:`1px solid ${cp}15` }}/>
      <div style={{ position:'absolute',bottom:-60,left:-40,width:250,height:250,borderRadius:'50%',background:`${cp}04` }}/>
      {/* Silhouettes décoratives */}
      {!isMobile&&<div style={{ position:'absolute',right:'8%',bottom:0,opacity:0.12 }}><SilhouetteMode taille={280} couleur={cp} style={1}/></div>}
      {!isMobile&&<div style={{ position:'absolute',right:'22%',bottom:0,opacity:0.08 }}><SilhouetteMode taille={220} couleur={NOIR} style={2}/></div>}
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'80px 24px',position:'relative',zIndex:1,width:'100%' }}>
        <div style={{ maxWidth:isMobile?'100%':'55%',animation:'fadeSlide 0.8s ease' }}>
          <div style={{ display:'inline-block',fontSize:10,fontWeight:700,color:cp,letterSpacing:'0.25em',textTransform:'uppercase',borderBottom:`1px solid ${cp}`,paddingBottom:6,marginBottom:24 }}>✦ NOUVELLE COLLECTION</div>
          <h1 style={{ fontSize:isMobile?'clamp(42px,10vw,60px)':'clamp(56px,6vw,84px)',fontWeight:900,color:NOIR,lineHeight:1.0,margin:'0 0 24px',fontFamily:'Georgia,serif',letterSpacing:'-0.02em' }}>
            {cfg.hero.titre.split('\n').map((line:string,i:number)=>(
              <span key={i} style={{ display:'block',color:i%2===1?cp:NOIR }}>{line}</span>
            ))}
          </h1>
          <p style={{ fontSize:isMobile?15:18,color:GRIS,lineHeight:1.7,marginBottom:40,maxWidth:440 }}>{cfg.hero.sousTitre}</p>
          <div style={{ display:'flex',gap:14,flexWrap:'wrap' }}>
            <button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'16px 40px',fontSize:14 }}>{cfg.hero.boutonLabel} →</button>
            <button onClick={()=>naviguer('blog')} style={{ padding:'16px 28px',background:'none',border:`1.5px solid ${BORD}`,color:NOIR,fontSize:13,cursor:'pointer',letterSpacing:'0.06em',fontWeight:500 }}>Notre univers</button>
          </div>
          {/* Stats */}
          <div style={{ display:'flex',gap:32,marginTop:48,paddingTop:32,borderTop:`1px solid ${BORD}`,flexWrap:'wrap' }}>
            {[['500+','Pièces uniques'],['4.8★','Note moyenne'],['30j','Retours gratuits']].map(([nb,label])=>(
              <div key={label}><div style={{ fontSize:22,fontWeight:900,color:cp }}>{nb}</div><div style={{ fontSize:11,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em' }}>{label}</div></div>
            ))}
          </div>
        </div>
      </div>
      {/* Vague bas */}
      <div style={{ position:'absolute',bottom:0,left:0,right:0 }}>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'block',width:'100%' }}>
          <path d="M0,30 Q180,0 360,30 Q540,60 720,30 Q900,0 1080,30 Q1260,60 1440,30 L1440,60 L0,60 Z" fill={cfg.couleurFond||IVOIRE}/>
        </svg>
      </div>
    </div>
  );

  const SectionVedette = () => {
    const vedette = produits.slice(0,8);
    if(vedette.length===0) return null;
    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'72px 24px' }}>
        <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:40,flexWrap:'wrap',gap:12 }}>
          <div>
            <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ SÉLECTION</div>
            <h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,margin:0,fontFamily:'Georgia,serif' }}>Nos coups de cœur</h2>
          </div>
          <button onClick={()=>naviguer('catalogue')} style={{ background:'none',border:`1px solid ${BORD}`,padding:'10px 24px',color:NOIR,fontSize:12,cursor:'pointer',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase' }}>TOUT VOIR →</button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${Math.min(4,vedette.length)},1fr)`,gap:isMobile?12:20 }}>
          {vedette.map(p=><CarteProduitMode key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={()=>toggleWishlist(p.id)} inWishlist={wishlist.includes(p.id)}/>)}
        </div>
      </div>
    );
  };

  const SectionCollections = () => {
    if(categories.length===0) return null;
    const cats = categories.slice(0,6);
    return (
      <div style={{ background:IVOIRE2,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}`,padding:'72px 24px' }}>
        <div style={{ maxWidth:1300,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}>
            <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ COLLECTIONS</div>
            <h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,margin:0,fontFamily:'Georgia,serif' }}>Shop by catégorie</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(3,1fr)',gap:16 }}>
            {cats.map((cat,i)=>(
              <div key={cat} onClick={()=>{ setFiltreCat(cat); naviguer('catalogue'); }}
                style={{ position:'relative',aspectRatio:i===0?'2/1':'1/1',background:IVOIRE,overflow:'hidden',cursor:'pointer',border:`1px solid ${BORD}`,transition:'all 0.3s' }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLDivElement).style.borderColor=cp; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLDivElement).style.borderColor=BORD; }}>
                <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12 }}>
                  <SilhouetteMode taille={80} couleur={cp} style={i%2===0?1:2}/>
                  <div style={{ fontSize:14,fontWeight:800,color:NOIR,textTransform:'uppercase',letterSpacing:'0.12em' }}>{cat}</div>
                  <div style={{ fontSize:11,color:GRIS }}>{produits.filter(p=>p.categorie===cat).length} articles</div>
                </div>
                <div style={{ position:'absolute',bottom:0,left:0,right:0,height:3,background:cp,transform:'scaleX(0)',transition:'transform 0.3s',transformOrigin:'left' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform='scaleX(1)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform='scaleX(0)'}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SectionLookbook = () => (
    <div style={{ padding:'72px 24px' }}>
      <div style={{ maxWidth:1300,margin:'0 auto' }}>
        <div style={{ textAlign:'center',marginBottom:48 }}>
          <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ LIFESTYLE</div>
          <h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,margin:0,fontFamily:'Georgia,serif' }}>{cfg.lookbook.titre}</h2>
          {cfg.lookbook.sousTitre&&<p style={{ fontSize:15,color:GRIS,marginTop:10 }}>{cfg.lookbook.sousTitre}</p>}
        </div>
        {/* Grille lookbook asymétrique */}
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gridTemplateRows:'auto auto',gap:12 }}>
          {[0,1,2,3,4,5].map(i=>(
            <div key={i} style={{ aspectRatio:i===0&&!isMobile?undefined:'3/4',background:IVOIRE2,overflow:'hidden',position:'relative',gridColumn:i===0&&!isMobile?'1/2':undefined,gridRow:i===0&&!isMobile?'1/3':undefined }}>
              {cfg.lookbook.photos[i] ? <img src={cfg.lookbook.photos[i]} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
              : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:8 }}>
                  <SilhouetteMode taille={100} couleur={cp} style={i%2===0?1:2}/>
                  <span style={{ fontSize:10,color:GRIS,textTransform:'uppercase',letterSpacing:'0.1em' }}>Photo lookbook {i+1}</span>
                </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SectionInstagram = () => (
    <div style={{ background:IVOIRE2,borderTop:`1px solid ${BORD}`,padding:'72px 24px' }}>
      <div style={{ maxWidth:1300,margin:'0 auto',textAlign:'center' }}>
        <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ INSTAGRAM</div>
        <h2 style={{ fontSize:isMobile?24:36,fontWeight:900,color:NOIR,margin:'0 0 8px',fontFamily:'Georgia,serif' }}>{cfg.instagram.titre}</h2>
        <p style={{ color:cp,fontSize:14,marginBottom:32 }}>{cfg.instagram.handle}</p>
        <div style={{ display:'grid',gridTemplateColumns:`repeat(${isMobile?3:6},1fr)`,gap:6 }}>
          {[0,1,2,3,4,5].map(i=>(
            <div key={i} style={{ aspectRatio:'1',background:IVOIRE,overflow:'hidden' }}>
              {cfg.instagram.photos[i] ? <img src={cfg.instagram.photos[i]} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
              : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>📱</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SectionTemoignages = () => (
    <div style={{ maxWidth:1300,margin:'0 auto',padding:'72px 24px' }}>
      <div style={{ textAlign:'center',marginBottom:48 }}>
        <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ AVIS CLIENTS</div>
        <h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,margin:0,fontFamily:'Georgia,serif' }}>Elles nous font confiance</h2>
      </div>
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
        {[{ texte:"Cette boutique est une vraie pépite ! Les vêtements sont de qualité exceptionnelle et les tailles correspondent parfaitement au guide.",auteur:'Sophie M.',ville:'Montréal',note:5 },{ texte:"Service client irréprochable et livraison express. J'ai reçu ma commande en 2 jours, parfaitement emballée.",auteur:'Emma R.',ville:'Québec',note:5 },{ texte:"Des pièces uniques qu'on ne trouve nulle part ailleurs. Le rapport qualité-prix est imbattable. Je recommande !",auteur:'Chloé L.',ville:'Laval',note:5 }].map((t,i)=>(
          <div key={i} style={{ background:'#fff',border:`1px solid ${BORD}`,padding:28 }}>
            <Etoiles note={t.note} taille={14}/>
            <p style={{ fontSize:15,color:NOIR2,lineHeight:1.7,margin:'14px 0 20px',fontStyle:'italic' }}>"{t.texte}"</p>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ width:36,height:36,borderRadius:'50%',background:IVOIRE2,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:cp }}>{t.auteur[0]}</div>
              <div><div style={{ fontSize:14,fontWeight:700,color:NOIR }}>{t.auteur}</div><div style={{ fontSize:12,color:GRIS }}>{t.ville}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const SectionBlog = () => {
    if(articles.length===0) return null;
    return (
      <div style={{ background:IVOIRE2,borderTop:`1px solid ${BORD}`,padding:'72px 24px' }}>
        <div style={{ maxWidth:1300,margin:'0 auto' }}>
          <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:40 }}>
            <div><div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ TENDANCES</div><h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,margin:0,fontFamily:'Georgia,serif' }}>Notre univers</h2></div>
            <button onClick={()=>naviguer('blog')} style={{ background:'none',border:`1px solid ${BORD}`,padding:'10px 24px',color:NOIR,fontSize:12,cursor:'pointer',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase' }}>TOUT LIRE →</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
            {articles.slice(0,3).map(a=>(
              <div key={a.id} style={{ background:'#fff',border:`1px solid ${BORD}`,overflow:'hidden',cursor:'pointer',transition:'all 0.2s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=cp}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=BORD}>
                <div style={{ height:220,background:IVOIRE2,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
                  {a.photo?<img src={a.photo} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}><SilhouetteMode taille={80} couleur={cp}/><span style={{ fontSize:10,color:GRIS,textTransform:'uppercase',letterSpacing:'0.1em' }}>Article mode</span></div>}
                </div>
                <div style={{ padding:'20px 22px' }}>
                  {a.categorie&&<span style={{ fontSize:10,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em' }}>{a.categorie}</span>}
                  <h3 style={{ fontSize:16,fontWeight:700,color:NOIR,margin:'6px 0 10px',lineHeight:1.3,fontFamily:'Georgia,serif' }}>{a.titre}</h3>
                  {a.resume&&<p style={{ fontSize:13,color:GRIS,lineHeight:1.6,marginBottom:14 }}>{a.resume}</p>}
                  <div style={{ fontSize:11,color:GRIS }}>{a.date_publication&&new Date(a.date_publication).toLocaleDateString('fr-CA')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SectionInfoletre = () => (
    <div style={{ background:NOIR,padding:'72px 24px' }}>
      <div style={{ maxWidth:560,margin:'0 auto',textAlign:'center' }}>
        <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ EXCLUSIVITÉS</div>
        <h2 style={{ fontSize:isMobile?28:36,fontWeight:900,color:'#fff',marginBottom:10,fontFamily:'Georgia,serif' }}>Restez dans la tendance</h2>
        <p style={{ fontSize:14,color:GRIS,marginBottom:32,lineHeight:1.6 }}>Offres exclusives, nouvelles collections et conseils mode en avant-première.</p>
        <div style={{ display:'flex',gap:0,flexWrap:'wrap',justifyContent:'center' }}>
          <input type="email" placeholder="votre@courriel.com" style={{ flex:1,minWidth:220,padding:'14px 20px',background:'rgba(255,255,255,0.05)',border:`1px solid rgba(255,255,255,0.15)`,borderRight:'none',fontSize:14,color:'#fff',outline:'none' }}/>
          <button style={{ ...styleBtn,padding:'14px 24px',fontSize:12,flexShrink:0,letterSpacing:'0.12em' }}>S'INSCRIRE</button>
        </div>
      </div>
    </div>
  );

  const PageAccueil = () => (
    <>
      {cfg.afficherBanniere&&<BanniereMode texte={cfg.banniereTexte} couleur={cfg.banniereColor}/>}
      {sectionsActives.map(s=>{
        if(s.id==='hero')        return <SectionHero key={s.id}/>;
        if(s.id==='vedette')     return <SectionVedette key={s.id}/>;
        if(s.id==='collections') return <SectionCollections key={s.id}/>;
        if(s.id==='lookbook')    return <SectionLookbook key={s.id}/>;
        if(s.id==='instagram')   return <SectionInstagram key={s.id}/>;
        if(s.id==='temoignages') return <SectionTemoignages key={s.id}/>;
        if(s.id==='blog')        return <SectionBlog key={s.id}/>;
        if(s.id==='infolettre')  return <SectionInfoletre key={s.id}/>;
        return null;
      })}
    </>
  );

  // ══ PAGE CATALOGUE ════════════════════════════════════════════════════════
  const PageCatalogue = () => {
    const [filtresPanneau,setFiltresPanneau] = useState(!isMobile);
    const toutesLesCouleurs = Array.from(new Set(produits.flatMap(p=>p.variantes?.find(v=>v.type==='couleur')?.valeurs||[])));
    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ marginBottom:32 }}><div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ CATALOGUE</div><h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,margin:0,fontFamily:'Georgia,serif' }}>Toute la collection</h1></div>
        <div style={{ display:'flex',gap:12,marginBottom:24,alignItems:'center',flexWrap:'wrap' }}>
          <div style={{ flex:1,minWidth:200,position:'relative' }}>
            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:GRIS,fontSize:14 }}>🔍</span>
            <input type="text" placeholder="Rechercher..." value={filtreRecherche} onChange={e=>setFiltreRecherche(e.target.value)} style={{ ...styleInput,paddingLeft:40,fontSize:13 }}/>
          </div>
          <select value={tri} onChange={e=>setTri(e.target.value as any)} style={{ padding:'11px 14px',background:'#fff',border:`1px solid ${BORD}`,fontSize:13,color:NOIR,cursor:'pointer',outline:'none' }}>
            <option value="recent">Plus récents</option><option value="prix_asc">Prix ↑</option><option value="prix_desc">Prix ↓</option><option value="note">Mieux notés</option>
          </select>
          <button onClick={()=>setFiltresPanneau(!filtresPanneau)} style={{ padding:'11px 18px',background:filtresPanneau?cp:'#fff',border:`1px solid ${filtresPanneau?cp:BORD}`,color:filtresPanneau?'#fff':NOIR,fontSize:12,cursor:'pointer',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' }}>⚡ FILTRES</button>
        </div>
        <div style={{ display:'flex',gap:24,alignItems:'flex-start' }}>
          {filtresPanneau&&<div style={{ width:220,flexShrink:0,background:'#fff',border:`1px solid ${BORD}`,padding:20,position:'sticky',top:90,maxHeight:'calc(100vh-110px)',overflowY:'auto' }}>
            {/* Catégories */}
            <h4 style={{ fontSize:10,fontWeight:700,color:GRIS,textTransform:'uppercase',letterSpacing:'0.15em',margin:'0 0 12px' }}>Catégories</h4>
            <div style={{ marginBottom:20 }}>
              <button onClick={()=>setFiltreCat('')} style={{ display:'block',width:'100%',textAlign:'left',padding:'7px 10px',background:!filtreCat?IVOIRE2:'none',border:'none',color:!filtreCat?cp:GRIS,fontSize:13,cursor:'pointer',marginBottom:3,fontWeight:!filtreCat?700:400 }}>Tout ({produits.length})</button>
              {categories.map(cat=><button key={cat} onClick={()=>setFiltreCat(cat)} style={{ display:'block',width:'100%',textAlign:'left',padding:'7px 10px',background:filtreCat===cat?IVOIRE2:'none',border:'none',color:filtreCat===cat?cp:GRIS,fontSize:13,cursor:'pointer',marginBottom:3,fontWeight:filtreCat===cat?700:400 }}>{cat} ({produits.filter(p=>p.categorie===cat).length})</button>)}
            </div>
            {/* Tailles */}
            {cfg.catalogue.afficherFiltresTaille&&<><h4 style={{ fontSize:10,fontWeight:700,color:GRIS,textTransform:'uppercase',letterSpacing:'0.15em',margin:'0 0 12px' }}>Taille</h4>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:20 }}>
              {cfg.catalogue.tailles.map((t:string)=><button key={t} onClick={()=>setFiltreTaille(filtreTaille===t?'':t)} style={{ padding:'6px 10px',border:`1px solid ${filtreTaille===t?cp:BORD}`,background:filtreTaille===t?cp:'#fff',color:filtreTaille===t?'#fff':NOIR,fontSize:11,cursor:'pointer',fontWeight:700,transition:'all 0.15s' }}>{t}</button>)}
            </div></>}
            {/* Couleurs */}
            {cfg.catalogue.afficherFiltresCouleur&&toutesLesCouleurs.length>0&&<><h4 style={{ fontSize:10,fontWeight:700,color:GRIS,textTransform:'uppercase',letterSpacing:'0.15em',margin:'0 0 12px' }}>Couleur</h4>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:20 }}>
              {toutesLesCouleurs.map(c=><PastilleCouleur key={c} couleur={c} actif={filtreCouleur===c} onClick={()=>setFiltreCouleur(filtreCouleur===c?'':c)}/>)}
            </div></>}
            {/* Prix */}
            <h4 style={{ fontSize:10,fontWeight:700,color:GRIS,textTransform:'uppercase',letterSpacing:'0.15em',margin:'0 0 12px' }}>Prix</h4>
            <div style={{ display:'flex',gap:8,marginBottom:20 }}>
              <input type="number" placeholder="Min" value={filtrePrixMin} onChange={e=>setFiltrePrixMin(e.target.value)} style={{ ...styleInput,padding:'8px 10px',fontSize:12,flex:1 }}/>
              <input type="number" placeholder="Max" value={filtrePrixMax} onChange={e=>setFiltrePrixMax(e.target.value)} style={{ ...styleInput,padding:'8px 10px',fontSize:12,flex:1 }}/>
            </div>
            {(filtreCat||filtreTaille||filtreCouleur||filtreRecherche||filtrePrixMin||filtrePrixMax)&&<button onClick={()=>{setFiltreCat('');setFiltreTaille('');setFiltreCouleur('');setFiltreRecherche('');setFiltrePrixMin('');setFiltrePrixMax('');}} style={{ width:'100%',padding:'9px',background:'#fef2f2',border:'1px solid #fecaca',color:'#ef4444',fontSize:12,cursor:'pointer',fontWeight:700,letterSpacing:'0.06em' }}>✕ EFFACER</button>}
          </div>}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
              <span style={{ fontSize:13,color:GRIS }}><strong style={{ color:NOIR }}>{produitsFiltres.length}</strong> article{produitsFiltres.length>1?'s':''}</span>
              {cfg.catalogue.afficherGuidesTailles&&<button onClick={()=>setGuideOuvert(true)} style={{ background:'none',border:'none',color:cp,fontSize:12,cursor:'pointer',fontWeight:600,textDecoration:'underline' }}>📏 Guide des tailles</button>}
            </div>
            {produitsFiltres.length===0 ? <div style={{ textAlign:'center',padding:'80px 0',color:GRIS }}><div style={{ fontSize:48,marginBottom:16 }}>🔍</div><h3 style={{ color:GRIS,fontWeight:600,marginBottom:8,fontFamily:'Georgia,serif' }}>Aucun article trouvé</h3><p>Modifiez vos filtres</p></div>
            : <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${cfg.catalogue.colonnes},1fr)`,gap:isMobile?10:16 }}>
                {produitsFiltres.map(p=><CarteProduitMode key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={()=>toggleWishlist(p.id)} inWishlist={wishlist.includes(p.id)}/>)}
              </div>}
          </div>
        </div>
      </div>
    );
  };

  // ══ PAGE PRODUIT ══════════════════════════════════════════════════════════
  const PageProduit = () => {
    const [nbVues] = useState(Math.floor(Math.random()*15)+4);
    if(!produitActif) return null;
    const p = produitActif;
    const enPromo = p.prix_promo && p.prix_promo < p.prix;
    const photos = [p.photo_principale,...(p.photos||[])].filter(Boolean) as string[];
    const similaires = produits.filter(pr=>pr.id!==p.id&&pr.categorie===p.categorie).slice(0,4);
    const cp2 = cfg.ficheProduit.boutonCouleur || cp;

    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        {guideOuvert&&<GuideDesTailles onFermer={()=>setGuideOuvert(false)} cp={cp}/>}
        {/* Breadcrumb */}
        <div style={{ display:'flex',gap:8,alignItems:'center',fontSize:12,color:GRIS,marginBottom:32 }}>
          <button onClick={()=>naviguer('accueil')} style={{ background:'none',border:'none',color:cp,cursor:'pointer',fontSize:12 }}>Accueil</button>
          <span>›</span><button onClick={()=>naviguer('catalogue')} style={{ background:'none',border:'none',color:cp,cursor:'pointer',fontSize:12 }}>Catalogue</button>
          {p.categorie&&<><span>›</span><button onClick={()=>{setFiltreCat(p.categorie!);naviguer('catalogue');}} style={{ background:'none',border:'none',color:cp,cursor:'pointer',fontSize:12 }}>{p.categorie}</button></>}
          <span>›</span><span style={{ color:NOIR2 }}>{p.titre}</span>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:48,alignItems:'flex-start' }}>
          {/* Galerie */}
          <div>
            <div style={{ position:'relative',aspectRatio:'3/4',background:IVOIRE2,overflow:'hidden',cursor:zoomActif?'zoom-out':'zoom-in',marginBottom:10 }}
              onClick={()=>setZoomActif(!zoomActif)}
              onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();setSourisPos({x:((e.clientX-r.left)/r.width)*100,y:((e.clientY-r.top)/r.height)*100});}}>
              {photos.length>0
                ? <img src={photos[photoIdx]} alt={p.titre} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.3s ease',transform:zoomActif?`scale(2.2) translate(${50-sourisPos.x}%,${50-sourisPos.y}%)`:'scale(1)',transformOrigin:`${sourisPos.x}% ${sourisPos.y}%` }}/>
                : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16 }}><SilhouetteMode taille={200} couleur={cp}/><span style={{ fontSize:10,color:GRIS,textTransform:'uppercase',letterSpacing:'0.1em' }}>Photo du produit</span></div>}
              {enPromo&&<span style={{ position:'absolute',top:16,left:16,background:cp,color:'#fff',fontSize:10,fontWeight:800,padding:'4px 10px',letterSpacing:'0.08em' }}>-{Math.round((1-p.prix_promo!/p.prix)*100)}%</span>}
              {p.est_nouveau&&<span style={{ position:'absolute',top:enPromo?46:16,left:16,background:NOIR,color:'#fff',fontSize:10,fontWeight:800,padding:'4px 10px',letterSpacing:'0.08em' }}>NOUVEAU</span>}
              <button onClick={e=>{e.stopPropagation();toggleWishlist(p.id);}} style={{ position:'absolute',top:16,right:16,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.9)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>{wishlist.includes(p.id)?'❤️':'🤍'}</button>
              <div style={{ position:'absolute',bottom:12,right:12,background:'rgba(255,255,255,0.85)',padding:'4px 10px',fontSize:10,color:GRIS }}>{zoomActif?'🔍 Cliquer pour dézoomer':'🔍 Cliquer pour zoomer'}</div>
            </div>
            {photos.length>1&&<div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {photos.map((ph,i)=><div key={i} onClick={()=>{setPhotoIdx(i);setZoomActif(false);}} style={{ width:72,height:90,border:`2px solid ${photoIdx===i?cp:BORD}`,overflow:'hidden',cursor:'pointer',transition:'border-color 0.2s',background:IVOIRE2 }}><img src={ph} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/></div>)}
            </div>}
          </div>

          {/* Infos */}
          <div>
            {p.categorie&&<div style={{ fontSize:10,color:GRIS,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:8,fontWeight:600 }}>{p.categorie}</div>}
            {p.marque&&<div style={{ fontSize:11,color:cp,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6,fontWeight:700 }}>{p.marque}</div>}
            <h1 style={{ fontSize:isMobile?24:32,fontWeight:900,color:NOIR,marginBottom:12,lineHeight:1.15,fontFamily:'Georgia,serif' }}>{p.titre}</h1>
            {p.sku&&<div style={{ fontSize:11,color:GRIS,marginBottom:10 }}>Réf. {p.sku}</div>}

            {/* Note */}
            {p.note_moyenne&&<div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}>
              <Etoiles note={p.note_moyenne} taille={14}/>
              <span style={{ fontSize:13,color:GRIS }}>{p.note_moyenne.toFixed(1)} ({p.nb_avis} avis)</span>
              <button onClick={()=>setOngletProduit('avis')} style={{ background:'none',border:'none',color:cp,fontSize:12,cursor:'pointer',textDecoration:'underline' }}>Lire les avis</button>
            </div>}

            {/* Prix */}
            <div style={{ display:'flex',alignItems:'baseline',gap:12,marginBottom:24,paddingBottom:24,borderBottom:`1px solid ${BORD}` }}>
              {enPromo ? (<><span style={{ fontSize:34,fontWeight:900,color:cp }}>{px(p.prix_promo!)}</span><span style={{ fontSize:20,color:GRIS,textDecoration:'line-through' }}>{px(p.prix)}</span></>) : <span style={{ fontSize:34,fontWeight:900,color:NOIR }}>{px(p.prix)}</span>}
            </div>

            {/* Variantes */}
            {p.variantes?.map(v=>(
              <div key={v.nom} style={{ marginBottom:20 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:NOIR,textTransform:'uppercase',letterSpacing:'0.1em' }}>
                    {v.nom}{variantesChoisies[v.nom]&&<span style={{ fontWeight:400,color:GRIS,marginLeft:8 }}>— {variantesChoisies[v.nom]}</span>}
                  </div>
                  {v.type==='taille'&&cfg.ficheProduit.afficherGuidesTailles&&<button onClick={()=>setGuideOuvert(true)} style={{ background:'none',border:'none',color:cp,fontSize:11,cursor:'pointer',textDecoration:'underline',fontWeight:600 }}>📏 Guide des tailles</button>}
                </div>
                {v.type==='couleur' ? (
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                    {v.valeurs.map(val=><PastilleCouleur key={val} couleur={val} actif={variantesChoisies[v.nom]===val} onClick={()=>setVariantesChoisies(prev=>({...prev,[v.nom]:val}))}/>)}
                  </div>
                ) : (
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                    {v.valeurs.map(val=>(
                      <button key={val} onClick={()=>setVariantesChoisies(prev=>({...prev,[v.nom]:val}))}
                        style={{ padding:'9px 16px',border:`1.5px solid ${variantesChoisies[v.nom]===val?cp:BORD}`,background:variantesChoisies[v.nom]===val?cp:'#fff',color:variantesChoisies[v.nom]===val?'#fff':NOIR,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.15s',letterSpacing:'0.04em' }}>
                        {val}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Stock & vues */}
            <div style={{ display:'flex',gap:16,marginBottom:20,flexWrap:'wrap' }}>
              {p.stock!==undefined&&<span style={{ fontSize:12,fontWeight:600,color:p.stock>5?'#16a34a':p.stock>0?'#f59e0b':'#ef4444' }}>{p.stock>5?'✅ En stock':p.stock>0?`⚠️ Dernières pièces (${p.stock})`:'❌ Épuisé'}</span>}
              {cfg.afficherNbVues&&<span style={{ fontSize:12,color:GRIS }}>👁 {nbVues} personnes regardent</span>}
            </div>

            {/* Quantité */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11,fontWeight:700,color:NOIR,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10 }}>Quantité</div>
              <div style={{ display:'flex',alignItems:'center',gap:0,border:`1px solid ${BORD}`,width:'fit-content' }}>
                <button onClick={()=>setQteChoisie(q=>Math.max(1,q-1))} style={{ width:44,height:44,border:'none',background:'#fff',cursor:'pointer',fontSize:18,fontWeight:700,color:NOIR,borderRight:`1px solid ${BORD}` }}>−</button>
                <span style={{ width:52,textAlign:'center',fontSize:15,fontWeight:700,color:NOIR }}>{qteChoisie}</span>
                <button onClick={()=>setQteChoisie(q=>p.stock!==undefined?Math.min(p.stock,q+1):q+1)} style={{ width:44,height:44,border:'none',background:'#fff',cursor:'pointer',fontSize:18,fontWeight:700,color:NOIR,borderLeft:`1px solid ${BORD}`,opacity:p.stock!==undefined&&qteChoisie>=p.stock?0.4:1 }}>+</button>
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display:'flex',gap:10,marginBottom:20 }}>
              <button onClick={()=>ajouterAuPanier(p)} disabled={p.stock===0}
                style={{ flex:1,background:p.stock===0?GRIS2:cp2,color:p.stock===0?GRIS:'#fff',border:'none',padding:'16px 24px',fontSize:13,fontWeight:800,cursor:p.stock===0?'not-allowed':'pointer',letterSpacing:'0.1em',textTransform:'uppercase' }}>
                {p.stock===0?'ÉPUISÉ':`🛒 ${cfg.ficheProduit.boutonLabel}`}
              </button>
              <button onClick={()=>toggleWishlist(p.id)} style={{ width:52,height:52,border:`1.5px solid ${wishlist.includes(p.id)?cp:BORD}`,background:wishlist.includes(p.id)?IVOIRE2:'#fff',color:wishlist.includes(p.id)?cp:GRIS,cursor:'pointer',fontSize:20,flexShrink:0 }}>{wishlist.includes(p.id)?'❤️':'🤍'}</button>
            </div>

            {/* Réassurance */}
            <div style={{ background:IVOIRE2,border:`1px solid ${BORD}`,padding:'14px 18px',marginBottom:20 }}>
              {[['🚚','Livraison gratuite dès 80$'],['🔒','Paiement sécurisé SSL'],['🔄','Retour gratuit 30 jours'],['📏','Guide des tailles disponible']].map(([ico,txt])=>(
                <div key={txt as string} style={{ display:'flex',alignItems:'center',gap:10,padding:'5px 0',borderBottom:`1px solid ${BORD}`,fontSize:12,color:NOIR2 }}><span>{ico}</span><span>{txt}</span></div>
              ))}
            </div>

            {/* Partage */}
            {cfg.ficheProduit.afficherPartage&&<div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <span style={{ fontSize:11,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em' }}>Partager :</span>
              {[['Facebook','🔵'],['Pinterest','📌'],['Instagram','📸']].map(([n,i])=><button key={n as string} style={{ padding:'5px 10px',background:'#fff',border:`1px solid ${BORD}`,fontSize:11,cursor:'pointer',color:GRIS,display:'flex',alignItems:'center',gap:4 }}>{i} {n}</button>)}
            </div>}
          </div>
        </div>

        {/* Onglets description/avis/livraison */}
        <div style={{ marginTop:56,borderTop:`1px solid ${BORD}`,paddingTop:40 }}>
          <div style={{ display:'flex',gap:0,borderBottom:`1px solid ${BORD}`,marginBottom:32 }}>
            {([['description','Description'],['avis',`Avis (${0})`],['livraison','Livraison']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setOngletProduit(id)} style={{ padding:'14px 24px',background:'none',border:'none',borderBottom:`2px solid ${ongletProduit===id?cp:'transparent'}`,color:ongletProduit===id?cp:GRIS,fontSize:11,fontWeight:ongletProduit===id?700:400,cursor:'pointer',marginBottom:-1,letterSpacing:'0.06em',textTransform:'uppercase' }}>{label}</button>
            ))}
          </div>
          {ongletProduit==='description'&&<div style={{ maxWidth:760 }}>{p.description?<p style={{ fontSize:15,color:NOIR2,lineHeight:1.9,whiteSpace:'pre-wrap' }}>{p.description}</p>:<p style={{ color:GRIS }}>Aucune description disponible.</p>}</div>}
          {ongletProduit==='avis'&&<p style={{ color:GRIS,fontStyle:'italic' }}>Aucun avis pour ce produit. Soyez la première à partager votre avis !</p>}
          {ongletProduit==='livraison'&&<div style={{ maxWidth:560 }}>{[['🚚','Livraison standard','2-5 jours ouvrables','Gratuite dès 80$'],['⚡','Livraison express','1-2 jours ouvrables','Disponible au checkout'],['🔄','Retours','Sous 30 jours','Gratuits — articles non portés avec étiquettes']].map(([ico,titre,delai,info])=><div key={titre as string} style={{ display:'flex',gap:16,padding:'18px 0',borderBottom:`1px solid ${BORD}` }}><div style={{ width:44,height:44,background:IVOIRE2,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{ico}</div><div><div style={{ fontSize:14,fontWeight:700,color:NOIR,marginBottom:4 }}>{titre}</div><div style={{ fontSize:13,color:cp,marginBottom:4 }}>{delai}</div><div style={{ fontSize:12,color:GRIS }}>{info}</div></div></div>)}</div>}
        </div>

        {/* Complétez le look */}
        {cfg.ficheProduit.afficherCompleterLook&&similaires.length>0&&<div style={{ marginTop:64,paddingTop:48,borderTop:`1px solid ${BORD}` }}>
          <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ COMPLÉTEZ LE LOOK</div>
          <h2 style={{ fontSize:isMobile?24:32,fontWeight:900,color:NOIR,marginBottom:28,fontFamily:'Georgia,serif' }}>À porter avec</h2>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${Math.min(4,similaires.length)},1fr)`,gap:14 }}>
            {similaires.map(p=><CarteProduitMode key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={()=>toggleWishlist(p.id)} inWishlist={wishlist.includes(p.id)}/>)}
          </div>
        </div>}
      </div>
    );
  };

  // ══ PAGES SECONDAIRES + FOOTER + RENDU ═══════════════════════════════════
  const PageWishlist = () => {
    const items = produits.filter(p=>wishlist.includes(p.id));
    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ LISTE D'ENVIES</div>
        <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,marginBottom:40,fontFamily:'Georgia,serif' }}>{items.length} pièce{items.length>1?'s':''} sauvegardée{items.length>1?'s':''}</h1>
        {items.length===0 ? <div style={{ textAlign:'center',padding:'80px 0' }}><div style={{ marginBottom:24 }}><SilhouetteMode taille={100} couleur={GRIS}/></div><h2 style={{ color:GRIS,fontWeight:600,marginBottom:12,fontFamily:'Georgia,serif' }}>Votre liste est vide</h2><p style={{ color:GRIS,marginBottom:24 }}>Cliquez sur 🤍 sur les articles que vous aimez.</p><button onClick={()=>naviguer('catalogue')} style={styleBtn}>DÉCOUVRIR LA COLLECTION</button></div>
        : <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:16 }}>{items.map(p=><CarteProduitMode key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={()=>toggleWishlist(p.id)} inWishlist={true}/>)}</div>}
      </div>
    );
  };

  const PageLogin = () => (
    <div style={{ minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px' }}>
      <div style={{ width:'100%',maxWidth:420 }}>
        <div style={{ textAlign:'center',marginBottom:36 }}><div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ ESPACE CLIENT</div><h1 style={{ fontSize:28,fontWeight:900,color:NOIR,margin:0,fontFamily:'Georgia,serif' }}>Connexion</h1><p style={{ color:GRIS,marginTop:8,fontSize:13 }}>Accédez à vos commandes et favoris</p></div>
        <div style={{ background:'#fff',border:`1px solid ${BORD}`,padding:32 }}>
          <div style={{ marginBottom:18 }}><label style={{ fontSize:11,fontWeight:600,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6 }}>Courriel</label><input type="email" value={loginForm.email} onChange={e=>setLoginForm(f=>({...f,email:e.target.value}))} style={styleInput} placeholder="votre@courriel.com"/></div>
          <div style={{ marginBottom:24 }}><label style={{ fontSize:11,fontWeight:600,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6 }}>Mot de passe</label><input type="password" value={loginForm.mdp} onChange={e=>setLoginForm(f=>({...f,mdp:e.target.value}))} style={styleInput} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleLogin()}/></div>
          {loginErreur&&<div style={{ background:'#fef2f2',border:'1px solid #fecaca',padding:'10px 14px',marginBottom:16,fontSize:13,color:'#ef4444' }}>❌ {loginErreur}</div>}
          <button onClick={handleLogin} disabled={loginStatut==='loading'} style={{ ...styleBtn,width:'100%',textAlign:'center',padding:'16px',fontSize:13 }}>{loginStatut==='loading'?'⏳ CONNEXION...':'SE CONNECTER →'}</button>
          <div style={{ textAlign:'center',marginTop:16 }}><span style={{ fontSize:12,color:GRIS }}>Pas encore de compte ? </span><button style={{ background:'none',border:'none',color:cp,fontSize:12,cursor:'pointer',fontWeight:700,textDecoration:'underline' }}>Créer un compte</button></div>
        </div>
      </div>
    </div>
  );

  const PageCompte = () => {
    const [section, setSection] = useState('dashboard');
    if(!acheteur){ naviguer('login'); return null; }
    const initiale=(acheteur.prenom?.[0]||acheteur.email[0]).toUpperCase();
    return (
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'240px 1fr',gap:24,alignItems:'flex-start' }}>
          <div style={{ background:'#fff',border:`1px solid ${BORD}`,padding:20 }}>
            <div style={{ textAlign:'center',marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${BORD}` }}>
              <div style={{ width:56,height:56,background:cp,margin:'0 auto 10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'#fff' }}>{initiale}</div>
              <div style={{ fontSize:14,fontWeight:700,color:NOIR }}>{acheteur.prenom} {acheteur.nom}</div>
              <div style={{ fontSize:11,color:GRIS,marginTop:3 }}>{acheteur.email}</div>
            </div>
            {[['dashboard','Tableau de bord','📊'],['commandes','Mes commandes','📦'],['wishlist','Ma wishlist','❤️'],['profil','Mon profil','👤']].map(([id,label,ico])=>(
              <button key={id} onClick={()=>setSection(id)} style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 12px',background:section===id?IVOIRE2:'none',border:'none',color:section===id?cp:GRIS,fontSize:13,fontWeight:section===id?700:400,cursor:'pointer',marginBottom:3,textAlign:'left',borderLeft:section===id?`2px solid ${cp}`:'2px solid transparent' }}><span>{ico}</span>{label}</button>
            ))}
            <div style={{ borderTop:`1px solid ${BORD}`,marginTop:12,paddingTop:12 }}><button onClick={handleLogout} style={{ display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 12px',background:'none',border:'none',color:'#ef4444',fontSize:13,fontWeight:600,cursor:'pointer' }}>🚪 Se déconnecter</button></div>
          </div>
          <div style={{ background:'#fff',border:`1px solid ${BORD}`,padding:28 }}>
            {section==='dashboard'&&<><div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ TABLEAU DE BORD</div><h2 style={{ fontSize:22,fontWeight:800,color:NOIR,marginBottom:20,fontFamily:'Georgia,serif' }}>Bonjour, {acheteur.prenom} 👋</h2><div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12 }}>{[['📦','0','Commandes'],['❤️',`${wishlist.length}`,'Wishlist'],['⭐','0','Avis']].map(([ico,nb,label])=><div key={label as string} style={{ background:IVOIRE2,border:`1px solid ${BORD}`,padding:'16px',textAlign:'center' }}><div style={{ fontSize:24,marginBottom:6 }}>{ico}</div><div style={{ fontSize:20,fontWeight:800,color:cp,marginBottom:3 }}>{nb}</div><div style={{ fontSize:11,color:GRIS,textTransform:'uppercase',letterSpacing:'0.06em' }}>{label}</div></div>)}</div></>}
            {section==='commandes'&&<><div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ MES COMMANDES</div><h2 style={{ fontSize:22,fontWeight:800,color:NOIR,marginBottom:20,fontFamily:'Georgia,serif' }}>Historique</h2><div style={{ textAlign:'center',padding:'40px 0',color:GRIS }}><div style={{ fontSize:40,marginBottom:12 }}>📦</div><p>Aucune commande.</p><button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'12px 24px',marginTop:16,fontSize:12 }}>COMMENCER VOS ACHATS</button></div></>}
            {section==='wishlist'&&<><div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ MA WISHLIST</div><h2 style={{ fontSize:22,fontWeight:800,color:NOIR,marginBottom:20,fontFamily:'Georgia,serif' }}>Mes coups de cœur</h2>{wishlist.length===0?<p style={{ color:GRIS }}>Wishlist vide.</p>:<div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12 }}>{produits.filter(p=>wishlist.includes(p.id)).map(p=><CarteProduitMode key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={()=>toggleWishlist(p.id)} inWishlist={true}/>)}</div>}</>}
            {section==='profil'&&<><div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ MON PROFIL</div><h2 style={{ fontSize:22,fontWeight:800,color:NOIR,marginBottom:20,fontFamily:'Georgia,serif' }}>Mes informations</h2><div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,maxWidth:500 }}>{[['Prénom',acheteur.prenom],['Nom',acheteur.nom],['Courriel',acheteur.email],['Téléphone',acheteur.telephone||'—']].map(([label,val])=><div key={label as string}><label style={{ fontSize:11,fontWeight:600,color:GRIS,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:5 }}>{label}</label><div style={{ padding:'10px 12px',background:IVOIRE2,border:`1px solid ${BORD}`,fontSize:13,color:NOIR2 }}>{val}</div></div>)}</div></>}
          </div>
        </div>
      </div>
    );
  };

  const PageBlog = () => (
    <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ TENDANCES</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,marginBottom:40,fontFamily:'Georgia,serif' }}>Notre univers mode</h1>
      {articles.length===0 ? <div style={{ textAlign:'center',padding:'80px 0',color:GRIS }}><div style={{ marginBottom:16 }}><SilhouetteMode taille={80} couleur={GRIS}/></div><h3 style={{ color:GRIS,fontFamily:'Georgia,serif' }}>Aucun article pour l'instant</h3></div>
      : <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:24 }}>
          {articles.map(a=>(
            <div key={a.id} style={{ background:'#fff',border:`1px solid ${BORD}`,overflow:'hidden',cursor:'pointer',transition:'border-color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=cp}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=BORD}>
              <div style={{ height:240,background:IVOIRE2,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {a.photo?<img src={a.photo} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<SilhouetteMode taille={90} couleur={cp}/>}
              </div>
              <div style={{ padding:'20px 22px' }}>
                {a.categorie&&<span style={{ fontSize:10,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em' }}>{a.categorie}</span>}
                <h2 style={{ fontSize:17,fontWeight:700,color:NOIR,margin:'6px 0 10px',lineHeight:1.3,fontFamily:'Georgia,serif' }}>{a.titre}</h2>
                {a.resume&&<p style={{ fontSize:13,color:GRIS,lineHeight:1.6,marginBottom:14 }}>{a.resume}</p>}
                <div style={{ fontSize:11,color:GRIS }}>{a.auteur&&<span>✍️ {a.auteur}</span>}{a.date_publication&&<span style={{ marginLeft:10 }}>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA')}</span>}</div>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );

  const PageFaq = () => {
    const faq = cfg.faq?.items||[{ question:'Quels sont vos délais de livraison ?',reponse:'Les commandes sont expédiées sous 24–48h. Livraison standard 2-5 jours ouvrables.' },{ question:'Comment utiliser le guide des tailles ?',reponse:'Notre guide des tailles est disponible sur chaque fiche produit. Mesurez votre buste, taille et hanches et comparez avec notre tableau.' },{ question:'Les retours sont-ils gratuits ?',reponse:'Oui ! Retours gratuits sous 30 jours pour les articles non portés avec étiquettes.' },{ question:'Quels modes de paiement ?',reponse:'Visa, Mastercard, American Express et Apple Pay via Stripe.' }];
    return (
      <div style={{ maxWidth:780,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ FAQ</div>
        <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,marginBottom:48,fontFamily:'Georgia,serif' }}>Questions fréquentes</h1>
        {faq.map((item:any,i:number)=>(
          <div key={i} style={{ borderBottom:`1px solid ${BORD}` }}>
            <button onClick={()=>setFaqOuvert(faqOuvert===i?null:i)} style={{ width:'100%',background:'none',border:'none',padding:'20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',gap:16,textAlign:'left' }}>
              <span style={{ fontSize:15,fontWeight:600,color:NOIR,lineHeight:1.4 }}>{item.question}</span>
              <span style={{ fontSize:20,color:cp,flexShrink:0,transition:'transform 0.2s',transform:faqOuvert===i?'rotate(45deg)':'none',fontWeight:300 }}>+</span>
            </button>
            {faqOuvert===i&&<div style={{ paddingBottom:20,fontSize:14,color:GRIS,lineHeight:1.8 }}>{item.reponse}</div>}
          </div>
        ))}
      </div>
    );
  };

  const PageContact = () => (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ CONTACT</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,marginBottom:48,fontFamily:'Georgia,serif' }}>Nous contacter</h1>
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:48 }}>
        <div>
          <h2 style={{ fontSize:18,fontWeight:700,color:NOIR,marginBottom:20,fontFamily:'Georgia,serif' }}>Coordonnées</h2>
          {[['📍','Adresse',cfg.contact?.adresse||'123 rue de la Mode, Montréal QC'],['📞','Téléphone',cfg.contact?.telephone||'514 000-0000'],['✉️','Courriel',cfg.contact?.courriel||'info@maboutique.ca'],['⏰','Heures','Lun-Ven 10h-18h · Sam 11h-17h']].map(([ico,label,val])=>(
            <div key={label as string} style={{ display:'flex',gap:14,marginBottom:18,alignItems:'flex-start' }}>
              <div style={{ width:38,height:38,background:IVOIRE2,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>{ico}</div>
              <div><div style={{ fontSize:11,fontWeight:700,color:GRIS,marginBottom:2,textTransform:'uppercase',letterSpacing:'0.08em' }}>{label}</div><div style={{ fontSize:13,color:NOIR2 }}>{val}</div></div>
            </div>
          ))}
        </div>
        <div>
          {contactStatut==='ok' ? <div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',padding:40,textAlign:'center' }}><div style={{ fontSize:40,marginBottom:12 }}>✅</div><h3 style={{ color:'#16a34a',marginBottom:8,fontFamily:'Georgia,serif' }}>Message envoyé !</h3><p style={{ color:GRIS }}>Nous vous répondrons sous 24h.</p></div>
          : <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div><label style={{ fontSize:11,fontWeight:600,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6 }}>Nom</label><input value={contactForm.nom} onChange={e=>setContactForm(f=>({...f,nom:e.target.value}))} style={styleInput} placeholder="Votre nom"/></div>
                <div><label style={{ fontSize:11,fontWeight:600,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6 }}>Courriel</label><input type="email" value={contactForm.courriel} onChange={e=>setContactForm(f=>({...f,courriel:e.target.value}))} style={styleInput} placeholder="votre@email.com"/></div>
              </div>
              <div><label style={{ fontSize:11,fontWeight:600,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6 }}>Sujet</label><input value={contactForm.sujet} onChange={e=>setContactForm(f=>({...f,sujet:e.target.value}))} style={styleInput} placeholder="Sujet de votre message"/></div>
              <div><label style={{ fontSize:11,fontWeight:600,color:GRIS,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6 }}>Message</label><textarea value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={5} style={{ ...styleInput,resize:'vertical',fontFamily:'inherit' }} placeholder="Votre message..."/></div>
              {contactStatut==='err'&&<p style={{ color:'#ef4444',fontSize:12 }}>❌ Erreur. Veuillez réessayer.</p>}
              <button onClick={envoyerContact} disabled={contactStatut==='loading'||!contactForm.nom||!contactForm.courriel||!contactForm.message} style={{ ...styleBtn,padding:'16px',fontSize:13,letterSpacing:'0.1em',opacity:(!contactForm.nom||!contactForm.courriel||!contactForm.message)?0.5:1,cursor:(!contactForm.nom||!contactForm.courriel||!contactForm.message)?'not-allowed':'pointer' }}>{contactStatut==='loading'?'⏳ ENVOI...':'ENVOYER →'}</button>
            </div>}
        </div>
      </div>
    </div>
  );

  const PagePanier = () => (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ PANIER</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:NOIR,marginBottom:40,fontFamily:'Georgia,serif' }}>{nbPanier} article{nbPanier>1?'s':''}</h1>
      {panier.length===0 ? <div style={{ textAlign:'center',padding:'80px 0' }}><div style={{ marginBottom:20 }}><SilhouetteMode taille={100} couleur={GRIS}/></div><h2 style={{ color:GRIS,fontWeight:600,marginBottom:12,fontFamily:'Georgia,serif' }}>Votre panier est vide</h2><button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'14px 32px' }}>DÉCOUVRIR LA COLLECTION →</button></div>
      : <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 360px',gap:32,alignItems:'flex-start' }}>
          <div>
            {cfg.afficherBarreLivraison&&<div style={{ background:IVOIRE2,padding:'12px 16px',marginBottom:20,borderLeft:`3px solid ${cp}`,fontSize:13 }}>{totalPanier>=cfg.seuilLivraisonGratuite?<span style={{ color:cp,fontWeight:700 }}>🎉 Livraison gratuite incluse !</span>:<span>Ajoutez <strong style={{ color:cp }}>{px(cfg.seuilLivraisonGratuite-totalPanier)}</strong> pour la livraison gratuite</span>}</div>}
            {panier.map((item,i)=>(
              <div key={i} style={{ display:'flex',gap:18,padding:'20px 0',borderBottom:`1px solid ${BORD}`,alignItems:'center' }}>
                <div style={{ width:90,height:115,background:IVOIRE2,flexShrink:0,overflow:'hidden' }}>{item.produit.photo_principale?<img src={item.produit.photo_principale} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}><SilhouetteMode taille={60} couleur={cp}/></div>}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ margin:'0 0 4px',fontSize:15,fontWeight:700,color:NOIR,fontFamily:'Georgia,serif' }}>{item.produit.titre}</p>
                  {item.variantes&&Object.keys(item.variantes).length>0&&<p style={{ margin:'0 0 6px',fontSize:12,color:GRIS }}>{Object.entries(item.variantes).map(([k,v])=>`${k}: ${v}`).join(' · ')}</p>}
                  <p style={{ margin:0,fontSize:15,fontWeight:700,color:cp }}>{px((item.produit.prix_promo||item.produit.prix)*item.qte)}</p>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:0,border:`1px solid ${BORD}` }}>
                  <button onClick={()=>setPanier(p=>p.map((it,j)=>j===i?{...it,qte:Math.max(1,it.qte-1)}:it))} style={{ width:36,height:36,border:'none',background:'#fff',cursor:'pointer',fontSize:16,borderRight:`1px solid ${BORD}`,fontWeight:700 }}>−</button>
                  <span style={{ width:40,textAlign:'center',fontSize:14,fontWeight:700,color:NOIR }}>{item.qte}</span>
                  <button onClick={()=>setPanier(p=>p.map((it,j)=>j===i?{...it,qte:it.qte+1}:it))} style={{ width:36,height:36,border:'none',background:'#fff',cursor:'pointer',fontSize:16,borderLeft:`1px solid ${BORD}`,fontWeight:700 }}>+</button>
                </div>
                <button onClick={()=>setPanier(p=>p.filter((_,j)=>j!==i))} style={{ width:36,height:36,border:'none',background:'#fef2f2',color:'#ef4444',cursor:'pointer',fontSize:14,marginLeft:8 }}>✕</button>
              </div>
            ))}
            <button onClick={()=>naviguer('catalogue')} style={{ marginTop:16,padding:'10px 20px',background:'none',border:`1px solid ${BORD}`,color:GRIS,fontSize:12,cursor:'pointer',letterSpacing:'0.06em' }}>← CONTINUER LES ACHATS</button>
          </div>
          <div style={{ background:'#fff',border:`1px solid ${BORD}`,padding:24 }}>
            <h3 style={{ fontSize:15,fontWeight:800,color:NOIR,marginBottom:20,textTransform:'uppercase',letterSpacing:'0.08em' }}>Résumé</h3>
            <div style={{ display:'flex',gap:8,marginBottom:14 }}>
              <input value={codePromo} onChange={e=>setCodePromo(e.target.value)} placeholder="Code promo" style={{ ...styleInput,flex:1 }}/>
              <button onClick={async()=>{ try{ const r=await fetch(`${API_BASE}/reductions/verifier`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:codePromo,vendeur_id:vendeurId,total:totalPanier})}); if(r.ok){const d=await r.json();setCodePromoApplique(d);} }catch{} }} style={{ ...styleBtn,padding:'11px 16px',fontSize:11 }}>OK</button>
            </div>
            {codePromoApplique&&<div style={{ background:'#f0fdf4',border:'1px solid #bbf7d0',padding:'8px 12px',marginBottom:12,fontSize:12,color:'#16a34a',display:'flex',justifyContent:'space-between' }}><span>✅ Code appliqué</span><button onClick={()=>{setCodePromoApplique(null);setCodePromo('');}} style={{ background:'none',border:'none',color:'#16a34a',cursor:'pointer',fontSize:11 }}>Retirer</button></div>}
            <div style={{ borderTop:`1px solid ${BORD}`,paddingTop:14,marginBottom:20 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:GRIS }}><span>Sous-total</span><span style={{ color:NOIR2 }}>{px(totalPanier)}</span></div>
              {codePromoApplique&&<div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:'#16a34a' }}><span>Réduction</span><span>−{px(totalPanier-totalApres)}</span></div>}
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,color:GRIS }}><span>Livraison</span><span style={{ color:totalPanier>=cfg.seuilLivraisonGratuite?'#16a34a':NOIR2 }}>{totalPanier>=cfg.seuilLivraisonGratuite?'GRATUITE':'Calculée au checkout'}</span></div>
              <div style={{ display:'flex',justifyContent:'space-between',paddingTop:12,borderTop:`1px solid ${BORD}`,fontSize:18,fontWeight:900 }}><span style={{ color:NOIR }}>TOTAL</span><span style={{ color:cp }}>{px(totalApres)}</span></div>
            </div>
            <button style={{ ...styleBtn,width:'100%',textAlign:'center',padding:'16px',fontSize:13 }}>PASSER À LA CAISSE →</button>
            <p style={{ textAlign:'center',fontSize:11,color:GRIS,marginTop:10 }}>🔒 Paiement 100% sécurisé</p>
          </div>
        </div>}
    </div>
  );

  const Footer = () => {
    const f = cfg.footer;
    const reseaux = Object.entries(f.reseaux).filter(([,v])=>v);
    const icos:Record<string,string>={ facebook:'f',instagram:'📸',tiktok:'♪',twitter:'𝕏',youtube:'▶',pinterest:'P' };
    return (
      <footer style={{ background:f.couleurFond,borderTop:`1px solid rgba(255,255,255,0.08)`,paddingTop:56 }}>
        <div style={{ maxWidth:1300,margin:'0 auto',padding:'0 24px' }}>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1.5fr 1fr 1fr 1fr',gap:40,marginBottom:48 }}>
            <div>
              <div style={{ fontSize:22,fontWeight:900,color:'#fff',marginBottom:8,fontFamily:'Georgia,serif',letterSpacing:'-0.01em' }}>{f.nomBoutique}</div>
              <div style={{ width:32,height:2,background:cp,marginBottom:14 }}/>
              {f.slogan&&<p style={{ fontSize:13,color:'rgba(255,255,255,0.45)',lineHeight:1.6,marginBottom:20 }}>{f.slogan}</p>}
              {reseaux.length>0&&<div style={{ display:'flex',gap:8 }}>{reseaux.map(([k,url])=><a key={k} href={url as string} target="_blank" rel="noopener noreferrer" style={{ width:34,height:34,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',textDecoration:'none',fontWeight:700,transition:'all 0.2s' }}>{icos[k]||k[0].toUpperCase()}</a>)}</div>}
            </div>
            {['1','2','3'].map(n=>f.colonnes[`titre${n}`]?(
              <div key={n}>
                <div style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.18em',marginBottom:16 }}>{f.colonnes[`titre${n}`]}</div>
                {f.colonnes[`liens${n}`].split('\n').filter(Boolean).map((l:string,i:number)=>(
                  <div key={i} style={{ marginBottom:9 }}><button onClick={()=>naviguer(l.toLowerCase())} style={{ background:'none',border:'none',color:'rgba(255,255,255,0.5)',fontSize:13,cursor:'pointer',padding:0,textAlign:'left',transition:'color 0.2s' }} onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color=cp} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='rgba(255,255,255,0.5)'}>{l}</button></div>
                ))}
              </div>
            ):null)}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',padding:'18px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10 }}>
            <div style={{ fontSize:12,color:'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} {f.nomBoutique}. Tous droits réservés.</div>
            {f.afficherPropulse&&<a href="https://e-vend.ca" target="_blank" rel="noopener noreferrer" style={{ fontSize:10,color:'rgba(255,255,255,0.15)',textDecoration:'none' }}>Propulsé par e-Vend Studio</a>}
          </div>
        </div>
      </footer>
    );
  };

  const PopupPromo = () => !popupPromo ? null : (
    <>
      <div onClick={()=>setPopupPromo(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,backdropFilter:'blur(4px)' }}/>
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:1001,background:'#fff',width:'90%',maxWidth:440,overflow:'hidden',boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ background:IVOIRE2,padding:'36px 32px',textAlign:'center',borderBottom:`2px solid ${cp}` }}>
          <div style={{ fontSize:10,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:12 }}>OFFRE EXCLUSIVE</div>
          <h2 style={{ fontSize:24,fontWeight:900,color:NOIR,margin:'0 0 10px',lineHeight:1.2,fontFamily:'Georgia,serif' }}>{cfg.popupPromoTexte}</h2>
          <div style={{ display:'inline-block',background:'#fff',border:`2px solid ${cp}`,padding:'12px 28px',margin:'16px 0 20px' }}><span style={{ fontSize:24,fontWeight:900,color:cp,letterSpacing:'0.15em' }}>{cfg.popupPromoCode}</span></div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>{naviguer('catalogue');setPopupPromo(false);}} style={{ flex:1,...styleBtn,padding:'14px',fontSize:13 }}>PROFITER DE L'OFFRE →</button>
            <button onClick={()=>setPopupPromo(false)} style={{ padding:'14px 16px',background:'none',border:`1px solid ${BORD}`,color:GRIS,cursor:'pointer',fontSize:12,flexShrink:0 }}>Plus tard</button>
          </div>
        </div>
      </div>
    </>
  );

  // ══ RENDU PRINCIPAL ═══════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif",background:cfg.couleurFond||IVOIRE,color:cfg.couleurTexte||NOIR,minHeight:'100vh',display:'flex',flexDirection:'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Georgia&display=swap');*{box-sizing:border-box;margin:0;padding:0;}button{font-family:inherit;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${IVOIRE2};}::-webkit-scrollbar-thumb{background:${BORD};border-radius:2px;}`}</style>

      {guideOuvert&&<GuideDesTailles onFermer={()=>setGuideOuvert(false)} cp={cp}/>}
      <Nav/>
      <TiroirPanier/>
      <NotifVente/>
      <PopupPromo/>

      <main style={{ flex:1 }}>
        {page==='accueil'   && <PageAccueil/>}
        {page==='catalogue' && <PageCatalogue/>}
        {page==='produit'   && <PageProduit/>}
        {page==='blog'      && <PageBlog/>}
        {page==='faq'       && <PageFaq/>}
        {page==='contact'   && <PageContact/>}
        {page==='panier'    && <PagePanier/>}
        {page==='wishlist'  && <PageWishlist/>}
        {page==='login'     && <PageLogin/>}
        {page==='compte'    && <PageCompte/>}
      </main>

      <Footer/>
    </div>
  );
}