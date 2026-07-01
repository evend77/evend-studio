// src/templates/TemplateBoutiqueBeaute.tsx
// e-Vend Studio — Template Boutique Beauté
// Style cosmétique festif — lavande, rose, fuchsia, vagues SVG
// Pages : Accueil · Collections · Catalogue · Fiche produit · Blog · FAQ · Contact · Panier · Wishlist · Compte acheteur
// 100% mobile responsive — inspiré du style Lollipop / beauté coloré

import { useState, useEffect, useRef } from 'react';

// ─── Palette ──────────────────────────────────────────────────────────────────
const LAV   = '#c084fc';   // lavande principale
const LAV2  = '#e9d5ff';   // lavande claire
const ROSE  = '#f472b6';   // rose vif
const FUCH  = '#ec4899';   // fuchsia accent
const FOND  = '#fdf4ff';   // fond très pâle
const FOND2 = '#fce7f3';   // rose pâle sections alternées
const TXT   = '#2d1b3d';   // violet foncé pour le texte
const TXT2  = '#6b21a8';   // violet moyen
const API_BASE = 'http://localhost:5000/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Produit {
  id: number; titre: string; prix: number; prix_promo?: number;
  photo_principale?: string; photos?: string[]; description?: string;
  stock?: number; categorie?: string; sku?: string; marque?: string;
  note_moyenne?: number; nb_avis?: number; est_nouveau?: boolean;
  variantes?: { nom: string; valeurs: string[]; type?: string }[];
}
interface ArticleBlog {
  id: number; titre: string; slug: string; resume?: string;
  photo?: string; auteur?: string; date_publication?: string; categorie?: string;
}
interface AcheteurUser {
  id: number; prenom: string; nom: string; email: string;
  telephone?: string; adresse?: string; ville?: string; province?: string; code_postal?: string;
}
interface PanierItem { produit: Produit; qte: number; variante?: string; }
interface Props { config: any; siteId?: number; vendeurId: number; }

const px = (n: number) => n?.toFixed(2).replace('.', ',') + ' $';

// ─── Photos Unsplash beauté ───────────────────────────────────────────────────
const PHOTOS_BEAUTE = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
  'https://images.unsplash.com/photo-1631214524020-3c69888b8f4f?w=600&q=80',
];
const PHOTOS_HERO = [
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80',
];
const PHOTOS_COLLECTIONS = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80',
  'https://images.unsplash.com/photo-1631214524020-3c69888b8f4f?w=500&q=80',
  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&q=80',
  'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&q=80',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80',
];
const PHOTOS_BLOG = [
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
  'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80',
];

// ─── Produits démo ────────────────────────────────────────────────────────────
const PRODUITS_DEMO: Produit[] = [
  { id:1, titre:'Sérum Éclat Vitamine C', prix:49.99, prix_promo:39.99, stock:25, categorie:'Soins Visage', est_nouveau:true, note_moyenne:4.8, nb_avis:142, description:'Sérum concentré en vitamine C pure à 15%. Illumine et unifie le teint dès les premières applications. Formule vegan et sans paraben.', photo_principale:PHOTOS_BEAUTE[0], variantes:[{nom:'Format',valeurs:['30ml','50ml'],type:'taille'}] },
  { id:2, titre:'Crème Hydratante Rose', prix:34.99, stock:40, categorie:'Soins Visage', note_moyenne:4.9, nb_avis:87, description:'Crème riche à l\'extrait de rose de Damas. Hydrate intensément pendant 24h. Texture veloutée, non grasse.', photo_principale:PHOTOS_BEAUTE[1], variantes:[{nom:'Type de peau',valeurs:['Normale','Sèche','Mixte'],type:'taille'}] },
  { id:3, titre:'Palette Yeux « Sunset »', prix:42.00, stock:18, categorie:'Maquillage', est_nouveau:true, note_moyenne:4.7, nb_avis:203, description:'Palette de 12 fards à paupières aux teintes rosées et dorées. Longue tenue 16h. Bonne pigmentation.', photo_principale:PHOTOS_BEAUTE[2], variantes:[{nom:'Édition',valeurs:['Sunset','Galaxy'],type:'taille'}] },
  { id:4, titre:'Brume Fixatrice Hydra', prix:24.99, prix_promo:18.99, stock:60, categorie:'Maquillage', note_moyenne:4.6, nb_avis:56, description:'Brume fixatrice formule aloe vera. Fixe le maquillage jusqu\'à 12h. Hydrate et illumine le teint.', photo_principale:PHOTOS_BEAUTE[3] },
  { id:5, titre:'Masque Purifiant Argile', prix:29.99, stock:35, categorie:'Soins Visage', note_moyenne:4.8, nb_avis:41, description:'Masque à l\'argile verte et au charbon actif. Purifie en profondeur, resserre les pores. À utiliser 1-2 fois/semaine.', photo_principale:PHOTOS_BEAUTE[4] },
  { id:6, titre:'Rouge à Lèvres Mat Velours', prix:19.99, stock:50, categorie:'Maquillage', note_moyenne:4.7, nb_avis:92, description:'Rouge à lèvres mat longue tenue. 8 teintes disponibles. Formule hydratante enrichie en vitamine E.', photo_principale:PHOTOS_BEAUTE[5], variantes:[{nom:'Couleur',valeurs:['Rose Nude','Rouge Passion','Bordeaux','Corail','Fuchsia'],type:'couleur'}] },
  { id:7, titre:'Huile Corps Éclat Doré', prix:38.99, stock:22, categorie:'Corps & Bain', note_moyenne:4.5, nb_avis:34, description:'Huile sèche subtilement irisée pour corps et cheveux. Parfum floral envoûtant. S\'absorbe sans laisser de film gras.', photo_principale:PHOTOS_BEAUTE[6] },
  { id:8, titre:'Coffret Soin Rituel Glow', prix:79.99, prix_promo:59.99, stock:12, categorie:'Coffrets', est_nouveau:false, note_moyenne:4.9, nb_avis:67, description:'Coffret complet : sérum + crème + masque + brume. Le rituel parfait pour un teint lumineux et unifié.', photo_principale:PHOTOS_BEAUTE[7] },
];

const ARTICLES_DEMO: ArticleBlog[] = [
  { id:1, titre:'5 Routines Beauté Pour Un Teint Parfait', auteur:'Sophie Martin', date_publication:'2025-01-28', categorie:'Soins', resume:'Découvrez les secrets d\'une peau rayonnante avec ces 5 étapes incontournables de votre routine quotidienne.', photo:PHOTOS_BLOG[0], slug:'routines-beaute-teint-parfait' },
  { id:2, titre:'Les Tendances Maquillage de la Saison', auteur:'Emma Dubois', date_publication:'2025-01-15', categorie:'Maquillage', resume:'Rose nacré, eye-liner coloré et gloss glossy — tout ce qu\'il faut savoir sur les tendances maquillage.', photo:PHOTOS_BLOG[1], slug:'tendances-maquillage-saison' },
  { id:3, titre:'Guide Complet des Soins Naturels', auteur:'Léa Bernard', date_publication:'2024-12-20', categorie:'Naturel', resume:'Aloe vera, rose musquée, huile de jojoba — comment intégrer les actifs naturels dans votre routine.', photo:PHOTOS_BLOG[2], slug:'guide-soins-naturels' },
];

const COLLECTIONS = [
  { nom:'Soins Visage', nb:13, photo:PHOTOS_COLLECTIONS[0] },
  { nom:'Maquillage',   nb:6,  photo:PHOTOS_COLLECTIONS[1] },
  { nom:'Corps & Bain', nb:8,  photo:PHOTOS_COLLECTIONS[2] },
  { nom:'Coffrets',     nb:5,  photo:PHOTOS_COLLECTIONS[3] },
  { nom:'Lèvres',       nb:12, photo:PHOTOS_COLLECTIONS[4] },
  { nom:'Yeux',         nb:9,  photo:PHOTOS_COLLECTIONS[5] },
];

const CFG_DEF = {
  nomBoutique:'Ma Boutique Beauté', slogan:'La beauté qui vous ressemble',
  couleurPrimaire:FUCH, couleurSecondaire:LAV, couleurFond:FOND,
  logoUrl:'',
  tickerTexte:'✿ LIVRAISON GRATUITE dès 75$ ✿ RETOURS GRATUITS 30 JOURS ✿ PAIEMENT SÉCURISÉ ✿',
  afficherTicker:true, afficherPopupPromo:true,
  popupPromoTexte:'Bienvenue ! Obtenez -10% sur votre première commande', popupPromoCode:'BEAUTE10',
  afficherNotifVente:true, seuilLivraisonGratuite:75,
  hero:{ titre:'La Beauté Qui Vous Ressemble', sousTitre:'Découvrez nos soins et maquillage formulés avec soin, pour sublimer votre beauté naturelle.', boutonLabel:'Découvrir la collection', photo:PHOTOS_HERO[0] },
  footer:{ nomBoutique:'Ma Boutique Beauté', slogan:'La beauté qui vous ressemble', couleurFond:'#2d1b3d', couleurTexte:'#fff', afficherPropulse:true, reseaux:{facebook:'',instagram:'',tiktok:'',pinterest:'',youtube:''} },
};

// ─── Vague SVG ────────────────────────────────────────────────────────────────
function Vague({ couleurHaut='#fff', couleurBas=FOND2, flip=false }: { couleurHaut?:string; couleurBas?:string; flip?:boolean }) {
  return (
    <div style={{ background:couleurHaut, lineHeight:0, transform:flip?'scaleY(-1)':'none' }}>
      <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%' }}>
        <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill={couleurBas} />
      </svg>
    </div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker({ texte }: { texte:string }) {
  return (
    <div style={{ background:FUCH, overflow:'hidden', height:34, display:'flex', alignItems:'center' }}>
      <style>{`@keyframes tickerB{from{transform:translateX(0)}to{transform:translateX(-50%)}}.ticker-b{display:flex;white-space:nowrap;animation:tickerB 22s linear infinite;}`}</style>
      <div className="ticker-b">
        {[...Array(4)].map((_,i)=><span key={i} style={{ fontSize:11,fontWeight:700,color:'#fff',letterSpacing:'0.12em',paddingRight:80 }}>{texte}</span>)}
      </div>
    </div>
  );
}

// ─── Étoiles ──────────────────────────────────────────────────────────────────
function Etoiles({ note, taille=14 }: { note:number; taille?:number }) {
  return <span style={{ display:'inline-flex',gap:1 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:taille,color:i<=Math.round(note)?FUCH:'#ddd' }}>★</span>)}</span>;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, couleur=FUCH }: { label:string; couleur?:string }) {
  return <span style={{ display:'inline-block',background:couleur,color:'#fff',fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:20,letterSpacing:'0.06em' }}>{label}</span>;
}

// ─── Notif vente ──────────────────────────────────────────────────────────────
function NotifVente() {
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const ventes = [
    { prenom:'Camille', ville:'Montréal', produit:'Sérum Éclat Vitamine C', temps:'2 min' },
    { prenom:'Jade', ville:'Québec', produit:'Palette Yeux Sunset', temps:'5 min' },
    { prenom:'Léa', ville:'Laval', produit:'Coffret Soin Rituel Glow', temps:'9 min' },
    { prenom:'Emma', ville:'Longueuil', produit:'Crème Hydratante Rose', temps:'12 min' },
  ];
  useEffect(()=>{
    const t1 = setTimeout(()=>setVisible(true),3500);
    const iv = setInterval(()=>{ setVisible(false); setTimeout(()=>{ setIdx(i=>(i+1)%ventes.length); setVisible(true); },500); },7000);
    return ()=>{ clearTimeout(t1); clearInterval(iv); };
  },[]);
  if (!visible) return null;
  const v = ventes[idx];
  return (
    <div style={{ position:'fixed',bottom:24,left:24,zIndex:500,background:'#fff',border:`2px solid ${LAV2}`,borderRadius:16,padding:'12px 16px',display:'flex',gap:12,alignItems:'center',maxWidth:290,boxShadow:'0 8px 32px rgba(192,132,252,0.25)',animation:'fadeInUp 0.4s ease' }}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:40,height:40,borderRadius:10,background:FOND2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>🛍️</div>
      <div>
        <p style={{ margin:0,fontSize:12,color:TXT }}><strong>{v.prenom}</strong> de {v.ville}</p>
        <p style={{ margin:'2px 0 0',fontSize:11,color:FUCH,fontWeight:600 }}>a acheté {v.produit}</p>
        <p style={{ margin:'2px 0 0',fontSize:10,color:'#aaa' }}>il y a {v.temps}</p>
      </div>
      <button onClick={()=>setVisible(false)} style={{ position:'absolute',top:6,right:8,background:'none',border:'none',color:'#bbb',cursor:'pointer',fontSize:12 }}>✕</button>
    </div>
  );
}

// ─── Popup promo ──────────────────────────────────────────────────────────────
function PopupPromo({ texte, code, onFermer }: { texte:string; code:string; onFermer:()=>void }) {
  const [copie, setCopie] = useState(false);
  return (
    <div onClick={onFermer} style={{ position:'fixed',inset:0,background:'rgba(45,27,61,0.6)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:24,maxWidth:420,width:'100%',overflow:'hidden',boxShadow:'0 24px 64px rgba(192,132,252,0.3)',border:`2px solid ${LAV2}` }}>
        <div style={{ background:`linear-gradient(135deg,${LAV},${FUCH})`,padding:'32px 28px',textAlign:'center' }}>
          <div style={{ fontSize:40,marginBottom:8 }}>🎀</div>
          <h2 style={{ fontSize:22,fontWeight:900,color:'#fff',margin:'0 0 6px',fontFamily:'Georgia,serif' }}>Offre Spéciale !</h2>
          <p style={{ fontSize:14,color:'rgba(255,255,255,0.85)',margin:0 }}>{texte}</p>
        </div>
        <div style={{ padding:'24px 28px',textAlign:'center' }}>
          <div style={{ background:FOND,border:`2px dashed ${LAV}`,borderRadius:12,padding:'14px 20px',marginBottom:16 }}>
            <p style={{ fontSize:12,color:'#888',margin:'0 0 4px' }}>Votre code promo</p>
            <p style={{ fontSize:24,fontWeight:900,color:FUCH,margin:0,letterSpacing:'0.1em' }}>{code}</p>
          </div>
          <button onClick={()=>{ navigator.clipboard.writeText(code); setCopie(true); setTimeout(()=>setCopie(false),2000); }}
            style={{ width:'100%',padding:'12px',background:copie?'#22c55e':FUCH,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',marginBottom:12 }}>
            {copie?'✅ Code copié !':'📋 Copier le code'}
          </button>
          <button onClick={onFermer} style={{ width:'100%',padding:'10px',background:'none',border:'none',color:'#aaa',fontSize:13,cursor:'pointer' }}>
            Non merci, je préfère payer plein prix
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Barre livraison ──────────────────────────────────────────────────────────
function BarreLivraison({ total, seuil }: { total:number; seuil:number }) {
  const reste = Math.max(0, seuil - total);
  const pct = Math.min(100, Math.round((total / seuil) * 100));
  if (total === 0) return null;
  return (
    <div style={{ background:LAV2,padding:'10px 20px',textAlign:'center' }}>
      <p style={{ fontSize:12,color:TXT2,margin:'0 0 6px',fontWeight:600 }}>
        {reste > 0 ? <>Plus que <strong style={{ color:FUCH }}>{px(reste)}</strong> pour la livraison gratuite !</> : '🎉 Vous avez la livraison gratuite !'}
      </p>
      <div style={{ maxWidth:300,margin:'0 auto',background:'#e9d5ff',borderRadius:8,height:6,overflow:'hidden' }}>
        <div style={{ width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${LAV},${FUCH})`,borderRadius:8,transition:'width 0.4s' }} />
      </div>
    </div>
  );
}

// ─── Carte produit ────────────────────────────────────────────────────────────
function CarteProduit({ p, onVoir, onPanier, dansPanier, dansWishlist, onWishlist }: {
  p:Produit; onVoir:()=>void; onPanier:()=>void; dansPanier:boolean; dansWishlist:boolean; onWishlist:()=>void;
}) {
  const [hover, setHover] = useState(false);
  const reduction = p.prix_promo ? Math.round((1 - p.prix_promo/p.prix)*100) : 0;
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ background:'#fff',borderRadius:20,overflow:'hidden',boxShadow:hover?'0 12px 40px rgba(192,132,252,0.25)':'0 2px 12px rgba(0,0,0,0.06)',transition:'all 0.3s ease',cursor:'pointer',border:`1px solid ${hover?LAV:'#f3e8ff'}`,position:'relative' }}>
      <div onClick={onVoir} style={{ position:'relative',paddingTop:'100%',overflow:'hidden',background:FOND }}>
        {p.photo_principale
          ? <img src={p.photo_principale} alt={p.titre} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s ease',transform:hover?'scale(1.06)':'scale(1)' }} />
          : <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,background:`linear-gradient(135deg,${FOND},${LAV2})` }}>💄</div>
        }
        <div style={{ position:'absolute',top:10,left:10,display:'flex',flexDirection:'column',gap:4 }}>
          {p.est_nouveau && <Badge label="NOUVEAU" couleur={LAV} />}
          {reduction>0 && <Badge label={`-${reduction}%`} couleur={FUCH} />}
          {p.stock !== undefined && p.stock <= 5 && p.stock > 0 && <Badge label={`Plus que ${p.stock} !`} couleur='#f59e0b' />}
        </div>
        <button onClick={e=>{e.stopPropagation();onWishlist();}}
          style={{ position:'absolute',top:10,right:10,width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.9)',border:'none',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
          {dansWishlist?'❤️':'🤍'}
        </button>
      </div>
      <div style={{ padding:'14px 16px' }}>
        {p.categorie && <p style={{ margin:'0 0 4px',fontSize:11,color:LAV,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em' }}>{p.categorie}</p>}
        <h3 onClick={onVoir} style={{ margin:'0 0 6px',fontSize:15,fontWeight:700,color:TXT,lineHeight:1.3 }}>{p.titre}</h3>
        {p.note_moyenne && <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}><Etoiles note={p.note_moyenne} taille={12} /><span style={{ fontSize:11,color:'#888' }}>({p.nb_avis})</span></div>}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8 }}>
          <div>
            {p.prix_promo ? <>
              <span style={{ fontSize:17,fontWeight:900,color:FUCH }}>{px(p.prix_promo)}</span>
              <span style={{ fontSize:12,color:'#bbb',textDecoration:'line-through',marginLeft:6 }}>{px(p.prix)}</span>
            </> : <span style={{ fontSize:17,fontWeight:900,color:TXT }}>{px(p.prix)}</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();onPanier();}}
            style={{ padding:'8px 14px',background:dansPanier?'#22c55e':FUCH,color:'#fff',border:'none',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.2s',flexShrink:0 }}>
            {dansPanier?'✓':'+ Panier'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page Accueil ─────────────────────────────────────────────────────────────
function PageAccueil({ cfg, produits, articles, onNaviguer, onPanier, panier, wishlist, onWishlist }: any) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [collectionActive, setCollectionActive] = useState('Soins Visage');
  const heroPhotos = cfg.hero?.photos?.length ? cfg.hero.photos : PHOTOS_HERO;

  useEffect(()=>{ const iv = setInterval(()=>setHeroIdx(i=>(i+1)%heroPhotos.length),4000); return()=>clearInterval(iv); },[]);

  const produitsFiltres = produits.filter((p:Produit)=>p.categorie===collectionActive || PRODUITS_DEMO.filter(d=>d.categorie===collectionActive).some(d=>d.id===p.id)).slice(0,3);
  const produitsVedette = produits.slice(0,4);
  const categories = Array.from(new Set(produits.map((p:Produit)=>p.categorie).filter(Boolean))).slice(0,4) as string[];

  return (
    <div>
      {/* Hero slideshow */}
      <div style={{ position:'relative',height:'70vh',minHeight:480,overflow:'hidden' }}>
        {heroPhotos.map((ph:string,i:number)=>(
          <div key={i} style={{ position:'absolute',inset:0,transition:'opacity 0.8s ease',opacity:i===heroIdx?1:0 }}>
            <img src={ph} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
            <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(192,132,252,0.55) 0%,rgba(236,72,153,0.3) 100%)' }} />
          </div>
        ))}
        <div style={{ position:'relative',zIndex:2,height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 24px' }}>
          <h1 style={{ fontSize:'clamp(28px,5vw,56px)',fontWeight:900,color:'#fff',margin:'0 0 16px',lineHeight:1.15,fontFamily:'Georgia,serif',textShadow:'0 2px 20px rgba(0,0,0,0.2)' }}>
            {cfg.hero?.titre || CFG_DEF.hero.titre}
          </h1>
          <p style={{ fontSize:'clamp(14px,2vw,18px)',color:'rgba(255,255,255,0.9)',margin:'0 0 32px',maxWidth:540,lineHeight:1.6 }}>
            {cfg.hero?.sousTitre || CFG_DEF.hero.sousTitre}
          </p>
          <div style={{ display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center' }}>
            <button onClick={()=>onNaviguer('catalogue')} style={{ padding:'14px 32px',background:'#fff',color:FUCH,border:'none',borderRadius:50,fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
              {cfg.hero?.boutonLabel || CFG_DEF.hero.boutonLabel} →
            </button>
            <button onClick={()=>onNaviguer('collections')} style={{ padding:'14px 28px',background:'rgba(255,255,255,0.2)',color:'#fff',border:'2px solid rgba(255,255,255,0.6)',borderRadius:50,fontSize:15,fontWeight:700,cursor:'pointer',backdropFilter:'blur(8px)' }}>
              Nos collections
            </button>
          </div>
        </div>
        {/* Dots */}
        <div style={{ position:'absolute',bottom:20,left:'50%',transform:'translateX(-50%)',display:'flex',gap:8,zIndex:3 }}>
          {heroPhotos.map((_:string,i:number)=><button key={i} onClick={()=>setHeroIdx(i)} style={{ width:i===heroIdx?24:8,height:8,borderRadius:4,background:i===heroIdx?'#fff':'rgba(255,255,255,0.5)',border:'none',cursor:'pointer',transition:'all 0.3s' }} />)}
        </div>
      </div>

      {/* Vague bas hero */}
      <Vague couleurHaut='transparent' couleurBas={FOND2} />

      {/* Avantages */}
      <div style={{ background:FOND2,padding:'32px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:20 }}>
          {[
            { icone:'🚚', titre:'Livraison Rapide', desc:'Expédié sous 24h ouvrables' },
            { icone:'↩️', titre:'Retours Gratuits', desc:'30 jours pour changer d\'avis' },
            { icone:'🌿', titre:'Formules Vegan', desc:'Produits sans cruauté animale' },
            { icone:'🔒', titre:'Paiement Sécurisé', desc:'Vos données 100% protégées' },
          ].map((a,i)=>(
            <div key={i} style={{ textAlign:'center',padding:'20px 16px',background:'#fff',borderRadius:16,boxShadow:'0 2px 12px rgba(192,132,252,0.1)' }}>
              <div style={{ fontSize:32,marginBottom:8 }}>{a.icone}</div>
              <h3 style={{ fontSize:14,fontWeight:800,color:TXT,margin:'0 0 4px' }}>{a.titre}</h3>
              <p style={{ fontSize:12,color:'#888',margin:0 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Vague couleurHaut={FOND2} couleurBas={FOND} />

      {/* Section "Acheter par catégorie" — style Lollipop */}
      <div style={{ background:FOND,padding:'48px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:28,flexWrap:'wrap' }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:TXT,margin:0,fontFamily:'Georgia,serif' }}>Acheter Pour</h2>
            <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
              {categories.concat('Corps & Bain','Coffrets').slice(0,5).map((cat:string)=>(
                <button key={cat} onClick={()=>setCollectionActive(cat)}
                  style={{ padding:'8px 18px',borderRadius:50,border:`2px solid ${collectionActive===cat?FUCH:LAV2}`,background:collectionActive===cat?FUCH:'#fff',color:collectionActive===cat?'#fff':TXT2,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.2s' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:20 }}>
            {(produitsFiltres.length ? produitsFiltres : produits.slice(0,3)).map((p:Produit)=>(
              <CarteProduit key={p.id} p={p} onVoir={()=>onNaviguer('fiche',p)} onPanier={()=>onPanier(p)} dansPanier={panier.some((x:any)=>x.produit.id===p.id)} dansWishlist={wishlist.includes(p.id)} onWishlist={()=>onWishlist(p.id)} />
            ))}
          </div>
        </div>
      </div>

      <Vague couleurHaut={FOND} couleurBas={LAV2} />

      {/* À propos / mission */}
      <div style={{ background:LAV2,padding:'60px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center' }}>
          <div>
            <p style={{ fontSize:12,fontWeight:800,color:FUCH,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12 }}>Notre Mission</p>
            <h2 style={{ fontSize:'clamp(24px,3vw,36px)',fontWeight:900,color:TXT,margin:'0 0 16px',fontFamily:'Georgia,serif',lineHeight:1.25 }}>
              {cfg.aPropos?.titre || 'Des Formules Innovantes Pour Votre Peau'}
            </h2>
            <p style={{ fontSize:15,color:TXT2,lineHeight:1.8,marginBottom:20 }}>
              {cfg.aPropos?.texte || 'Nous utilisons les actifs les plus avancés en synergie avec les bienfaits de la nature pour créer des formules qui offrent des résultats visibles. Chaque produit est élaboré avec soin, pour une beauté éthique et performante.'}
            </p>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {(cfg.aPropos?.valeurs || ['🌱 Formules vegan et cruelty-free','♻️ Emballages recyclables','🔬 Testés dermatologiquement']).map((v:string,i:number)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:10,fontSize:14,fontWeight:600,color:TXT }}>
                  <span style={{ width:22,height:22,borderRadius:'50%',background:FUCH,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0 }}>✓</span>
                  {v}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius:24,overflow:'hidden',aspectRatio:'4/3',boxShadow:'0 16px 48px rgba(192,132,252,0.2)' }}>
            <img src={cfg.aPropos?.photo || 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=700&q=80'} alt="Notre mission" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
          </div>
        </div>
      </div>

      <Vague couleurHaut={LAV2} couleurBas={FOND2} />

      {/* Collections grille style Lollipop */}
      <div style={{ background:FOND2,padding:'60px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:TXT,marginBottom:8,fontFamily:'Georgia,serif',textAlign:'center' }}>Nos Collections</h2>
          <p style={{ textAlign:'center',color:'#888',marginBottom:32,fontSize:14 }}>Explorez notre univers beauté complet</p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16 }}>
            {COLLECTIONS.map((col,i)=>(
              <div key={i} onClick={()=>onNaviguer('catalogue')}
                style={{ borderRadius:20,overflow:'hidden',cursor:'pointer',position:'relative',boxShadow:'0 4px 20px rgba(192,132,252,0.15)',transition:'transform 0.3s ease' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.03)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
                <div style={{ height:200,overflow:'hidden' }}>
                  <img src={col.photo} alt={col.nom} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                </div>
                <div style={{ background:FUCH,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontWeight:800,color:'#fff',fontSize:15 }}>{col.nom}</span>
                  <span style={{ background:'rgba(255,255,255,0.25)',color:'#fff',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20 }}>{col.nb} articles</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Vague couleurHaut={FOND2} couleurBas='#fff' />

      {/* Avis clients */}
      <div style={{ background:'#fff',padding:'60px 24px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12 }}>
            <h2 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:TXT,margin:0,fontFamily:'Georgia,serif' }}>Ce Qu'Elles Disent</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20 }}>
            {[
              { prenom:'Camille R.', ville:'Montréal, QC', note:5, texte:'Le sérum vitamine C a transformé ma peau en 2 semaines ! Mon teint est lumineux et unifié. Je recommande vivement.', produit:'Sérum Éclat Vitamine C', photo:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80' },
              { prenom:'Jade M.', ville:'Québec, QC', note:5, texte:'La palette Sunset est absolument magnifique. Les couleurs sont bien pigmentées et tiennent toute la journée.', produit:'Palette Yeux « Sunset »', photo:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80' },
              { prenom:'Sophie L.', ville:'Laval, QC', note:4, texte:'Expédition ultra rapide et produits conformes à la description. La crème rose est devenue mon indispensable du matin !', produit:'Crème Hydratante Rose', photo:'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=80&q=80' },
            ].map((a,i)=>(
              <div key={i} style={{ background:FOND,border:`1px solid ${LAV2}`,borderRadius:20,padding:'20px',position:'relative' }}>
                <div style={{ display:'flex',gap:10,marginBottom:12,alignItems:'center' }}>
                  <img src={a.photo} alt={a.prenom} style={{ width:44,height:44,borderRadius:'50%',objectFit:'cover',border:`2px solid ${LAV}` }} />
                  <div>
                    <p style={{ margin:0,fontWeight:800,fontSize:14,color:TXT }}>{a.prenom}</p>
                    <p style={{ margin:0,fontSize:11,color:'#888' }}>{a.ville}</p>
                  </div>
                  <div style={{ marginLeft:'auto' }}><Etoiles note={a.note} taille={13} /></div>
                </div>
                <p style={{ fontSize:13,color:TXT2,lineHeight:1.7,margin:'0 0 10px',fontStyle:'italic' }}>"{a.texte}"</p>
                <p style={{ fontSize:11,color:FUCH,fontWeight:700,margin:0 }}>Produit : {a.produit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Vague couleurHaut='#fff' couleurBas={FOND2} />

      {/* Blog aperçu */}
      {articles.length > 0 && (
        <div style={{ background:FOND2,padding:'60px 24px' }}>
          <div style={{ maxWidth:1100,margin:'0 auto' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28 }}>
              <h2 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:TXT,margin:0,fontFamily:'Georgia,serif' }}>Actualités & Conseils</h2>
              <button onClick={()=>onNaviguer('blog')} style={{ padding:'8px 20px',border:`2px solid ${FUCH}`,background:'none',color:FUCH,borderRadius:50,fontSize:13,fontWeight:700,cursor:'pointer' }}>Voir tout →</button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20 }}>
              {articles.slice(0,2).map((a:ArticleBlog)=>(
                <div key={a.id} onClick={()=>onNaviguer('article',a)} style={{ background:'#fff',borderRadius:20,overflow:'hidden',cursor:'pointer',boxShadow:'0 2px 12px rgba(192,132,252,0.1)',transition:'transform 0.3s' }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-4px)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                  {a.photo && <img src={a.photo} alt={a.titre} style={{ width:'100%',height:200,objectFit:'cover' }} />}
                  <div style={{ padding:'18px' }}>
                    {a.date_publication && <p style={{ margin:'0 0 6px',fontSize:11,color:'#888' }}>{new Date(a.date_publication).toLocaleDateString('fr-CA',{day:'numeric',month:'long',year:'numeric'})} • {a.auteur}</p>}
                    <h3 style={{ margin:'0 0 8px',fontSize:16,fontWeight:800,color:TXT }}>{a.titre}</h3>
                    <p style={{ margin:'0 0 12px',fontSize:13,color:'#666',lineHeight:1.6 }}>{a.resume}</p>
                    <span style={{ fontSize:13,color:FUCH,fontWeight:700 }}>Lire la suite →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instagram / Follow */}
      <Vague couleurHaut={articles.length>0?FOND2:'#fff'} couleurBas={LAV} />
      <div style={{ background:LAV,padding:'40px 24px',textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(18px,3vw,28px)',fontWeight:900,color:'#fff',margin:'0 0 6px',fontFamily:'Georgia,serif' }}>
          Suivez-nous sur Instagram
        </h2>
        <p style={{ color:'rgba(255,255,255,0.8)',fontSize:14,margin:'0 0 20px' }}>@{cfg.instagram || (cfg.nomBoutique||'maboutiquebeaute').toLowerCase().replace(/\s/g,'')}</p>
        <div style={{ display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap',maxWidth:800,margin:'0 auto' }}>
          {PHOTOS_BEAUTE.slice(0,6).map((ph,i)=>(
            <div key={i} style={{ width:120,height:120,borderRadius:14,overflow:'hidden',border:'3px solid rgba(255,255,255,0.4)',flexShrink:0 }}>
              <img src={ph} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page Collections ─────────────────────────────────────────────────────────
function PageCollections({ onNaviguer }: { onNaviguer:(page:string)=>void }) {
  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ background:`linear-gradient(135deg,${LAV},${FUCH})`,padding:'60px 24px',textAlign:'center' }}>
        <h1 style={{ fontSize:'clamp(28px,4vw,48px)',fontWeight:900,color:'#fff',margin:'0 0 10px',fontFamily:'Georgia,serif' }}>Collections</h1>
        <p style={{ color:'rgba(255,255,255,0.85)',fontSize:15 }}>Explorez notre univers beauté</p>
      </div>
      <Vague couleurHaut='transparent' couleurBas={FOND} />
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px 60px' }}>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20 }}>
          {COLLECTIONS.map((col,i)=>(
            <div key={i} onClick={()=>onNaviguer('catalogue')}
              style={{ borderRadius:20,overflow:'hidden',cursor:'pointer',boxShadow:'0 4px 20px rgba(192,132,252,0.15)',transition:'transform 0.3s' }}
              onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
              <div style={{ height:240,overflow:'hidden' }}>
                <img src={col.photo} alt={col.nom} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
              </div>
              <div style={{ background:FUCH,padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ fontWeight:800,color:'#fff',fontSize:17 }}>{col.nom}</span>
                <span style={{ background:'rgba(255,255,255,0.25)',color:'#fff',fontSize:12,fontWeight:700,padding:'4px 12px',borderRadius:20 }}>{col.nb} articles</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page Catalogue ───────────────────────────────────────────────────────────
function PageCatalogue({ produits, onNaviguer, onPanier, panier, wishlist, onWishlist }: any) {
  const [recherche, setRecherche] = useState('');
  const [catActive, setCatActive] = useState('Tout');
  const [tri, setTri] = useState('defaut');
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const categories = ['Tout', ...Array.from(new Set(produits.map((p:Produit)=>p.categorie).filter(Boolean)))] as string[];

  let filtres = produits.filter((p:Produit)=>{
    const ok1 = catActive==='Tout'||p.categorie===catActive;
    const ok2 = !recherche||p.titre.toLowerCase().includes(recherche.toLowerCase());
    const ok3 = !prixMin||p.prix>=(+prixMin);
    const ok4 = !prixMax||p.prix<=(+prixMax);
    return ok1&&ok2&&ok3&&ok4;
  });
  if (tri==='prix-asc') filtres.sort((a:Produit,b:Produit)=>a.prix-b.prix);
  if (tri==='prix-desc') filtres.sort((a:Produit,b:Produit)=>b.prix-a.prix);
  if (tri==='note') filtres.sort((a:Produit,b:Produit)=>(b.note_moyenne||0)-(a.note_moyenne||0));
  if (tri==='nouveau') filtres = filtres.filter((p:Produit)=>p.est_nouveau).concat(filtres.filter((p:Produit)=>!p.est_nouveau));

  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ background:`linear-gradient(135deg,${LAV},${FUCH})`,padding:'48px 24px',textAlign:'center' }}>
        <h1 style={{ fontSize:'clamp(24px,4vw,42px)',fontWeight:900,color:'#fff',margin:'0 0 8px',fontFamily:'Georgia,serif' }}>Notre Catalogue</h1>
        <p style={{ color:'rgba(255,255,255,0.85)',fontSize:14 }}>{produits.length} produits disponibles</p>
      </div>
      <Vague couleurHaut='transparent' couleurBas={FOND} />
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px 60px' }}>
        {/* Filtres */}
        <div style={{ background:'#fff',borderRadius:16,padding:'16px 20px',marginBottom:24,border:`1px solid ${LAV2}`,display:'flex',gap:16,flexWrap:'wrap',alignItems:'center' }}>
          <input value={recherche} onChange={e=>setRecherche(e.target.value)} placeholder="🔍 Rechercher un produit..."
            style={{ flex:'1 1 200px',padding:'10px 14px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,outline:'none',color:TXT,minWidth:160 }} />
          <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            {categories.slice(0,5).map(cat=>(
              <button key={cat} onClick={()=>setCatActive(cat)}
                style={{ padding:'8px 14px',borderRadius:50,border:`2px solid ${catActive===cat?FUCH:LAV2}`,background:catActive===cat?FUCH:'#fff',color:catActive===cat?'#fff':TXT2,fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
          <select value={tri} onChange={e=>setTri(e.target.value)} style={{ padding:'10px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,background:'#fff',cursor:'pointer' }}>
            <option value="defaut">Trier par défaut</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
            <option value="note">Mieux notés</option>
            <option value="nouveau">Nouveautés</option>
          </select>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            <input value={prixMin} onChange={e=>setPrixMin(e.target.value)} placeholder="Min $" type="number" style={{ width:70,padding:'8px',border:`1px solid ${LAV2}`,borderRadius:8,fontSize:12,textAlign:'center',color:TXT }} />
            <span style={{ color:'#888',fontSize:12 }}>–</span>
            <input value={prixMax} onChange={e=>setPrixMax(e.target.value)} placeholder="Max $" type="number" style={{ width:70,padding:'8px',border:`1px solid ${LAV2}`,borderRadius:8,fontSize:12,textAlign:'center',color:TXT }} />
          </div>
        </div>
        {/* Grille */}
        {filtres.length===0
          ? <div style={{ textAlign:'center',padding:'80px 24px',color:'#aaa' }}><div style={{ fontSize:48,marginBottom:16 }}>🔍</div><p style={{ fontSize:16 }}>Aucun produit ne correspond à votre recherche.</p></div>
          : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:20 }}>
              {filtres.map((p:Produit)=>(
                <CarteProduit key={p.id} p={p} onVoir={()=>onNaviguer('fiche',p)} onPanier={()=>onPanier(p)} dansPanier={panier.some((x:any)=>x.produit.id===p.id)} dansWishlist={wishlist.includes(p.id)} onWishlist={()=>onWishlist(p.id)} />
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ─── Fiche produit ────────────────────────────────────────────────────────────
function PageFicheProduit({ produit, produits, onPanier, panier, wishlist, onWishlist, onNaviguer }: any) {
  const [photoActive, setPhotoActive] = useState(0);
  const [qte, setQte] = useState(1);
  const [variantesChoisies, setVariantesChoisies] = useState<Record<string,string>>({});
  const [onglet, setOnglet] = useState<'desc'|'avis'|'livraison'>('desc');
  const dansPanier = panier.some((x:any)=>x.produit.id===produit.id);
  const photos = produit.photos?.length ? produit.photos : produit.photo_principale ? [produit.photo_principale] : [PHOTOS_BEAUTE[0]];
  const similaires = produits.filter((p:Produit)=>p.categorie===produit.categorie&&p.id!==produit.id).slice(0,4);
  const reduction = produit.prix_promo ? Math.round((1 - produit.prix_promo/produit.prix)*100) : 0;

  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'32px 24px' }}>
        <button onClick={()=>onNaviguer('catalogue')} style={{ background:'none',border:'none',color:FUCH,fontSize:13,fontWeight:700,cursor:'pointer',marginBottom:20,display:'flex',alignItems:'center',gap:6 }}>← Retour au catalogue</button>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'start' }}>
          {/* Photos */}
          <div>
            <div style={{ borderRadius:24,overflow:'hidden',background:'#fff',marginBottom:12,border:`1px solid ${LAV2}`,aspectRatio:'1',position:'relative' }}>
              <img src={photos[photoActive]||PHOTOS_BEAUTE[0]} alt={produit.titre} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
              {reduction>0 && <div style={{ position:'absolute',top:16,left:16 }}><Badge label={`-${reduction}%`} /></div>}
              {produit.est_nouveau && <div style={{ position:'absolute',top:reduction>0?52:16,left:16 }}><Badge label="NOUVEAU" couleur={LAV} /></div>}
            </div>
            {photos.length>1 && (
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {photos.map((ph:string,i:number)=>(
                  <div key={i} onClick={()=>setPhotoActive(i)} style={{ width:70,height:70,borderRadius:12,overflow:'hidden',cursor:'pointer',border:`2px solid ${i===photoActive?FUCH:LAV2}`,flexShrink:0 }}>
                    <img src={ph} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Infos */}
          <div>
            {produit.categorie && <p style={{ margin:'0 0 8px',fontSize:12,color:LAV,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em' }}>{produit.categorie}</p>}
            <h1 style={{ fontSize:'clamp(20px,3vw,32px)',fontWeight:900,color:TXT,margin:'0 0 12px',lineHeight:1.2,fontFamily:'Georgia,serif' }}>{produit.titre}</h1>
            {produit.note_moyenne && (
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
                <Etoiles note={produit.note_moyenne} taille={16} />
                <span style={{ fontSize:13,color:'#888' }}>{produit.note_moyenne.toFixed(1)} ({produit.nb_avis} avis)</span>
              </div>
            )}
            <div style={{ marginBottom:20 }}>
              {produit.prix_promo ? (
                <div style={{ display:'flex',alignItems:'baseline',gap:12 }}>
                  <span style={{ fontSize:32,fontWeight:900,color:FUCH }}>{px(produit.prix_promo)}</span>
                  <span style={{ fontSize:18,color:'#bbb',textDecoration:'line-through' }}>{px(produit.prix)}</span>
                  <span style={{ fontSize:13,background:`${FUCH}15`,color:FUCH,padding:'3px 10px',borderRadius:20,fontWeight:700 }}>-{reduction}%</span>
                </div>
              ) : <span style={{ fontSize:32,fontWeight:900,color:TXT }}>{px(produit.prix)}</span>}
            </div>
            {/* Variantes */}
            {produit.variantes?.map((v:any)=>(
              <div key={v.nom} style={{ marginBottom:16 }}>
                <p style={{ margin:'0 0 8px',fontSize:13,fontWeight:700,color:TXT }}>{v.nom} :</p>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  {v.valeurs.map((val:string)=>(
                    <button key={val} onClick={()=>setVariantesChoisies(prev=>({...prev,[v.nom]:val}))}
                      style={{ padding:'7px 16px',borderRadius:50,border:`2px solid ${variantesChoisies[v.nom]===val?FUCH:LAV2}`,background:variantesChoisies[v.nom]===val?FUCH:'#fff',color:variantesChoisies[v.nom]===val?'#fff':TXT2,fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.15s' }}>
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {/* Qte + panier */}
            <div style={{ display:'flex',gap:12,alignItems:'center',marginBottom:16 }}>
              <div style={{ display:'flex',alignItems:'center',border:`2px solid ${LAV2}`,borderRadius:12,overflow:'hidden' }}>
                <button onClick={()=>setQte(q=>Math.max(1,q-1))} style={{ width:40,height:44,background:'#fff',border:'none',fontSize:18,cursor:'pointer',color:TXT }}>−</button>
                <span style={{ width:44,textAlign:'center',fontWeight:700,fontSize:16,color:TXT }}>{qte}</span>
                <button onClick={()=>setQte(q=>Math.min(produit.stock||99,q+1))} style={{ width:40,height:44,background:'#fff',border:'none',fontSize:18,cursor:'pointer',color:TXT }}>+</button>
              </div>
              <button onClick={()=>onPanier(produit,qte)}
                style={{ flex:1,padding:'13px',background:dansPanier?'#22c55e':FUCH,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:'pointer',transition:'all 0.2s' }}>
                {dansPanier?'✓ Dans le panier':'🛒 Ajouter au panier'}
              </button>
              <button onClick={()=>onWishlist(produit.id)}
                style={{ width:48,height:48,borderRadius:12,border:`2px solid ${LAV2}`,background:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                {wishlist.includes(produit.id)?'❤️':'🤍'}
              </button>
            </div>
            {produit.stock!==undefined && produit.stock>0 && produit.stock<=10 && (
              <p style={{ fontSize:12,color:'#f59e0b',fontWeight:700,margin:'0 0 16px' }}>⚡ Plus que {produit.stock} en stock !</p>
            )}
            {/* Réassurance */}
            <div style={{ background:FOND2,borderRadius:12,padding:'14px 16px',display:'flex',flexDirection:'column',gap:8 }}>
              {['🚚 Livraison gratuite dès 75$','↩️ Retours gratuits sous 30 jours','🌿 Formule vegan certifiée','🔒 Paiement 100% sécurisé'].map((item,i)=>(
                <p key={i} style={{ margin:0,fontSize:12,color:TXT2,fontWeight:600 }}>{item}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Onglets description */}
        <div style={{ marginTop:40 }}>
          <div style={{ display:'flex',gap:0,borderBottom:`2px solid ${LAV2}`,marginBottom:24 }}>
            {(['desc','avis','livraison'] as const).map(o=>(
              <button key={o} onClick={()=>setOnglet(o)}
                style={{ padding:'12px 24px',border:'none',background:'none',fontSize:14,fontWeight:700,cursor:'pointer',color:onglet===o?FUCH:'#888',borderBottom:`3px solid ${onglet===o?FUCH:'transparent'}`,marginBottom:-2,transition:'all 0.2s' }}>
                {o==='desc'?'Description':o==='avis'?`Avis (${produit.nb_avis||0})`:'Livraison & Retours'}
              </button>
            ))}
          </div>
          {onglet==='desc' && <p style={{ fontSize:15,color:TXT2,lineHeight:1.9,maxWidth:700 }}>{produit.description || 'Description du produit à compléter.'}</p>}
          {onglet==='avis' && (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16 }}>
              {[1,2,3].map(i=>(
                <div key={i} style={{ background:'#fff',border:`1px solid ${LAV2}`,borderRadius:16,padding:'16px' }}>
                  <div style={{ display:'flex',gap:8,marginBottom:8 }}><Etoiles note={5-i>3?5-i:4} taille={13} /></div>
                  <p style={{ fontSize:13,color:TXT2,lineHeight:1.7,margin:'0 0 8px',fontStyle:'italic' }}>"Excellent produit, je le recommande sans hésitation !"</p>
                  <p style={{ fontSize:11,color:'#aaa',margin:0 }}>Cliente vérifiée — il y a {i*3} jours</p>
                </div>
              ))}
            </div>
          )}
          {onglet==='livraison' && (
            <div style={{ fontSize:14,color:TXT2,lineHeight:2,maxWidth:600 }}>
              <p><strong>Livraison standard :</strong> 3–5 jours ouvrables</p>
              <p><strong>Livraison express :</strong> 1–2 jours ouvrables</p>
              <p><strong>Livraison gratuite</strong> dès 75$ d'achat</p>
              <p><strong>Retours :</strong> 30 jours pour changer d'avis, retours gratuits</p>
            </div>
          )}
        </div>

        {/* Produits similaires */}
        {similaires.length>0 && (
          <div style={{ marginTop:48 }}>
            <h2 style={{ fontSize:22,fontWeight:900,color:TXT,marginBottom:20,fontFamily:'Georgia,serif' }}>Vous aimerez aussi</h2>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16 }}>
              {similaires.map((p:Produit)=>(
                <CarteProduit key={p.id} p={p} onVoir={()=>onNaviguer('fiche',p)} onPanier={()=>onPanier(p)} dansPanier={panier.some((x:any)=>x.produit.id===p.id)} dansWishlist={wishlist.includes(p.id)} onWishlist={()=>onWishlist(p.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Blog ─────────────────────────────────────────────────────────────────
function PageBlog({ articles, onNaviguer }: { articles:ArticleBlog[]; onNaviguer:(page:string,data?:any)=>void }) {
  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ background:`linear-gradient(135deg,${LAV},${FUCH})`,padding:'60px 24px',textAlign:'center' }}>
        <h1 style={{ fontSize:'clamp(28px,4vw,48px)',fontWeight:900,color:'#fff',margin:'0 0 10px',fontFamily:'Georgia,serif' }}>Actualités & Conseils Beauté</h1>
        <p style={{ color:'rgba(255,255,255,0.85)',fontSize:15 }}>Nos experts partagent leurs secrets</p>
      </div>
      <Vague couleurHaut='transparent' couleurBas={FOND} />
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px 60px' }}>
        {articles.length===0
          ? <div style={{ textAlign:'center',padding:'80px',color:'#aaa' }}><div style={{ fontSize:48,marginBottom:16 }}>✍️</div><p>Aucun article pour le moment.</p></div>
          : <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:24 }}>
              {articles.map((a:ArticleBlog)=>(
                <div key={a.id} onClick={()=>onNaviguer('article',a)}
                  style={{ background:'#fff',borderRadius:20,overflow:'hidden',cursor:'pointer',boxShadow:'0 2px 16px rgba(192,132,252,0.1)',transition:'transform 0.3s,box-shadow 0.3s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(192,132,252,0.2)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 16px rgba(192,132,252,0.1)'; }}>
                  {a.photo && <div style={{ height:220,overflow:'hidden' }}><img src={a.photo} alt={a.titre} style={{ width:'100%',height:'100%',objectFit:'cover' }} /></div>}
                  <div style={{ padding:'20px' }}>
                    {a.categorie && <Badge label={a.categorie} couleur={LAV} />}
                    <h2 style={{ fontSize:17,fontWeight:800,color:TXT,margin:'10px 0 8px',lineHeight:1.35,fontFamily:'Georgia,serif' }}>{a.titre}</h2>
                    {a.date_publication && <p style={{ fontSize:11,color:'#888',margin:'0 0 8px' }}>{new Date(a.date_publication).toLocaleDateString('fr-CA',{day:'numeric',month:'long',year:'numeric'})} • {a.auteur}</p>}
                    <p style={{ fontSize:13,color:'#666',lineHeight:1.7,margin:'0 0 14px' }}>{a.resume}</p>
                    <span style={{ fontSize:13,color:FUCH,fontWeight:800 }}>Lire la suite →</span>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ─── Page Article ─────────────────────────────────────────────────────────────
function PageArticle({ article, onNaviguer }: { article:ArticleBlog; onNaviguer:(p:string)=>void }) {
  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ maxWidth:800,margin:'0 auto',padding:'40px 24px 60px' }}>
        <button onClick={()=>onNaviguer('blog')} style={{ background:'none',border:'none',color:FUCH,fontSize:13,fontWeight:700,cursor:'pointer',marginBottom:24,display:'flex',alignItems:'center',gap:6 }}>← Retour au blog</button>
        {article.photo && <img src={article.photo} alt={article.titre} style={{ width:'100%',borderRadius:20,marginBottom:28,maxHeight:400,objectFit:'cover' }} />}
        {article.categorie && <Badge label={article.categorie} couleur={LAV} />}
        <h1 style={{ fontSize:'clamp(22px,4vw,36px)',fontWeight:900,color:TXT,margin:'12px 0 10px',fontFamily:'Georgia,serif',lineHeight:1.25 }}>{article.titre}</h1>
        {article.date_publication && <p style={{ fontSize:12,color:'#888',marginBottom:24 }}>{new Date(article.date_publication).toLocaleDateString('fr-CA',{day:'numeric',month:'long',year:'numeric'})} • {article.auteur}</p>}
        <div style={{ fontSize:15,color:TXT2,lineHeight:2 }}>{article.resume}</div>
      </div>
    </div>
  );
}

// ─── Page FAQ ─────────────────────────────────────────────────────────────────
function PageFAQ({ cfg }: { cfg:any }) {
  const [ouvert, setOuvert] = useState<number|null>(0);
  const items = cfg.faq?.items || [
    { question:'Quels sont vos délais de livraison ?', reponse:'Les commandes sont expédiées sous 24h ouvrables. Comptez 3–5 jours pour la livraison standard et 1–2 jours pour l\'express.' },
    { question:'Vos produits sont-ils vraiment vegan ?', reponse:'Oui, 100% de nos formules sont certifiées vegan et cruelty-free. Aucun test sur les animaux, aucun ingrédient d\'origine animale.' },
    { question:'Comment appliquer le Sérum Vitamine C ?', reponse:'Appliquez 2–3 gouttes le matin sur peau propre, avant votre crème hydratante. Utilisez un SPF pendant la journée pour maximiser les résultats.' },
    { question:'Puis-je retourner un produit ?', reponse:'Oui, sous 30 jours suivant la réception. Le produit doit être non utilisé et dans son emballage d\'origine. Les retours sont entièrement gratuits.' },
    { question:'Comment conserver mes cosmétiques ?', reponse:'Conservez vos produits dans un endroit frais et sec, à l\'abri de la lumière directe. Refermez hermétiquement les contenants après utilisation.' },
  ];
  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ background:`linear-gradient(135deg,${LAV},${FUCH})`,padding:'60px 24px',textAlign:'center' }}>
        <h1 style={{ fontSize:'clamp(26px,4vw,44px)',fontWeight:900,color:'#fff',margin:'0 0 10px',fontFamily:'Georgia,serif' }}>Des Questions ?</h1>
        <p style={{ color:'rgba(255,255,255,0.85)',fontSize:15,maxWidth:500,margin:'0 auto' }}>Voici les réponses aux questions les plus fréquentes sur nos soins, notre maquillage et nos livraisons.</p>
      </div>
      <Vague couleurHaut='transparent' couleurBas={FOND} />
      <div style={{ maxWidth:760,margin:'0 auto',padding:'0 24px 60px' }}>
        {items.map((item:any,i:number)=>(
          <div key={i} style={{ marginBottom:12 }}>
            <button onClick={()=>setOuvert(ouvert===i?null:i)}
              style={{ width:'100%',textAlign:'left',padding:'18px 20px',background:ouvert===i?FUCH:'#fff',color:ouvert===i?'#fff':TXT,border:`1px solid ${ouvert===i?FUCH:LAV2}`,borderRadius:ouvert===i?'14px 14px 0 0':14,fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all 0.2s',fontFamily:'inherit' }}>
              {item.question}
              <span style={{ fontSize:20,fontWeight:400,transition:'transform 0.2s',transform:ouvert===i?'rotate(45deg)':'rotate(0)' }}>+</span>
            </button>
            {ouvert===i && (
              <div style={{ background:FOND2,border:`1px solid ${LAV2}`,borderTop:'none',borderRadius:'0 0 14px 14px',padding:'16px 20px',fontSize:14,color:TXT2,lineHeight:1.8 }}>
                {item.reponse}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page Contact ─────────────────────────────────────────────────────────────
function PageContact({ cfg }: { cfg:any }) {
  const [form, setForm] = useState({ prenom:'',nom:'',email:'',telephone:'',message:'' });
  const [envoye, setEnvoye] = useState(false);
  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ background:`linear-gradient(135deg,${LAV},${FUCH})`,padding:'60px 24px',textAlign:'center' }}>
        <h1 style={{ fontSize:'clamp(26px,4vw,44px)',fontWeight:900,color:'#fff',margin:'0 0 10px',fontFamily:'Georgia,serif' }}>Formulaire de Contact</h1>
        <p style={{ color:'rgba(255,255,255,0.85)',fontSize:15 }}>Nous sommes là pour vous aider !</p>
      </div>
      <Vague couleurHaut='transparent' couleurBas={FOND} />
      <div style={{ maxWidth:900,margin:'0 auto',padding:'0 24px 60px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:40 }}>
        {/* Infos */}
        <div>
          <h2 style={{ fontSize:22,fontWeight:800,color:TXT,marginBottom:20 }}>Nos coordonnées</h2>
          {[
            { icone:'📍', titre:'Adresse', val:cfg.contact?.adresse||'123 rue Principale, Montréal, QC' },
            { icone:'📞', titre:'Téléphone', val:cfg.contact?.telephone||'514 000-0000' },
            { icone:'✉️', titre:'Courriel', val:cfg.contact?.courriel||'info@maboutiquebeaute.ca' },
          ].map((c,i)=>(
            <div key={i} style={{ display:'flex',gap:14,marginBottom:20 }}>
              <div style={{ width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${LAV},${FUCH})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{c.icone}</div>
              <div><p style={{ margin:'0 0 2px',fontSize:12,color:'#888',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em' }}>{c.titre}</p><p style={{ margin:0,fontSize:14,color:TXT,fontWeight:600 }}>{c.val}</p></div>
            </div>
          ))}
          <div style={{ background:FOND2,borderRadius:16,padding:'20px',marginTop:8 }}>
            <p style={{ fontSize:13,fontWeight:700,color:TXT,marginBottom:8 }}>Heures d'ouverture</p>
            <p style={{ fontSize:13,color:'#666',margin:'0 0 4px' }}>Lun–Ven : 9h00 – 18h00</p>
            <p style={{ fontSize:13,color:'#666',margin:0 }}>Sam : 10h00 – 16h00</p>
          </div>
        </div>
        {/* Formulaire */}
        <div style={{ background:'#fff',borderRadius:20,padding:'28px',border:`1px solid ${LAV2}` }}>
          {envoye ? (
            <div style={{ textAlign:'center',padding:'40px 0' }}>
              <div style={{ fontSize:56,marginBottom:16 }}>💌</div>
              <h3 style={{ fontSize:18,fontWeight:800,color:TXT }}>Message envoyé !</h3>
              <p style={{ color:'#888',fontSize:14 }}>Nous vous répondrons dans les 24h.</p>
            </div>
          ) : (
            <>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
                <div><label style={{ fontSize:12,fontWeight:700,color:TXT,display:'block',marginBottom:6 }}>Prénom *</label>
                  <input value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} placeholder="Votre prénom" style={{ width:'100%',padding:'10px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none',boxSizing:'border-box' }} /></div>
                <div><label style={{ fontSize:12,fontWeight:700,color:TXT,display:'block',marginBottom:6 }}>Nom *</label>
                  <input value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Votre nom" style={{ width:'100%',padding:'10px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none',boxSizing:'border-box' }} /></div>
              </div>
              <div style={{ marginBottom:12 }}><label style={{ fontSize:12,fontWeight:700,color:TXT,display:'block',marginBottom:6 }}>Téléphone</label>
                <input value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))} placeholder="514 000-0000" style={{ width:'100%',padding:'10px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none',boxSizing:'border-box' }} /></div>
              <div style={{ marginBottom:12 }}><label style={{ fontSize:12,fontWeight:700,color:TXT,display:'block',marginBottom:6 }}>Courriel *</label>
                <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="votre@courriel.ca" style={{ width:'100%',padding:'10px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none',boxSizing:'border-box' }} /></div>
              <div style={{ marginBottom:20 }}><label style={{ fontSize:12,fontWeight:700,color:TXT,display:'block',marginBottom:6 }}>Votre Message *</label>
                <textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Comment pouvons-nous vous aider ?" rows={5} style={{ width:'100%',padding:'10px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none',resize:'vertical',boxSizing:'border-box',fontFamily:'inherit' }} /></div>
              <button onClick={()=>form.prenom&&form.email&&form.message&&setEnvoye(true)}
                style={{ width:'100%',padding:'13px',background:`linear-gradient(135deg,${LAV},${FUCH})`,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:'pointer' }}>
                Envoyer le message →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page Panier ──────────────────────────────────────────────────────────────
function PagePanier({ panier, onModifier, onSupprimer, onNaviguer }: any) {
  const [codePromo, setCodePromo] = useState('');
  const [remise, setRemise] = useState(0);
  const total = panier.reduce((s:number,it:PanierItem)=>s+(it.produit.prix_promo||it.produit.prix)*it.qte,0);
  const totalFinal = Math.max(0, total - remise);
  const CODES = { 'BEAUTE10':10, 'GLOW20':20 };
  const appliquer = () => { const r = (CODES as any)[codePromo.toUpperCase()]; if(r) setRemise(total*r/100); };

  if (panier.length===0) return (
    <div style={{ background:FOND,minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,gap:16 }}>
      <div style={{ fontSize:72,marginBottom:8 }}>🛒</div>
      <h2 style={{ fontSize:22,fontWeight:800,color:TXT }}>Votre panier est vide</h2>
      <p style={{ color:'#888',fontSize:14 }}>Découvrez nos produits et commencez votre rituel beauté !</p>
      <button onClick={()=>onNaviguer('catalogue')} style={{ padding:'13px 28px',background:FUCH,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer' }}>Voir le catalogue →</button>
    </div>
  );

  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ maxWidth:1000,margin:'0 auto',padding:'32px 24px 60px' }}>
        <h1 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:TXT,marginBottom:24,fontFamily:'Georgia,serif' }}>Mon Panier ({panier.length} article{panier.length>1?'s':''})</h1>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:28,alignItems:'start' }}>
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {panier.map((it:PanierItem)=>(
              <div key={it.produit.id} style={{ background:'#fff',borderRadius:16,padding:'16px',display:'flex',gap:16,alignItems:'center',border:`1px solid ${LAV2}` }}>
                <div style={{ width:72,height:72,borderRadius:12,overflow:'hidden',flexShrink:0,background:FOND }}>
                  {it.produit.photo_principale ? <img src={it.produit.photo_principale} alt={it.produit.titre} style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>💄</div>}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 4px',fontWeight:700,fontSize:14,color:TXT }}>{it.produit.titre}</p>
                  {it.variante && <p style={{ margin:'0 0 4px',fontSize:12,color:'#888' }}>{it.variante}</p>}
                  <p style={{ margin:0,fontSize:15,fontWeight:900,color:FUCH }}>{px((it.produit.prix_promo||it.produit.prix)*it.qte)}</p>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <button onClick={()=>onModifier(it.produit.id,it.qte-1)} style={{ width:30,height:30,borderRadius:8,border:`1px solid ${LAV2}`,background:'#fff',cursor:'pointer',fontSize:16 }}>−</button>
                  <span style={{ width:28,textAlign:'center',fontWeight:700 }}>{it.qte}</span>
                  <button onClick={()=>onModifier(it.produit.id,it.qte+1)} style={{ width:30,height:30,borderRadius:8,border:`1px solid ${LAV2}`,background:'#fff',cursor:'pointer',fontSize:16 }}>+</button>
                </div>
                <button onClick={()=>onSupprimer(it.produit.id)} style={{ background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:18,padding:4 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff',borderRadius:20,padding:'24px',border:`1px solid ${LAV2}`,position:'sticky',top:100 }}>
            <h3 style={{ fontSize:16,fontWeight:800,color:TXT,marginBottom:16 }}>Récapitulatif</h3>
            <div style={{ display:'flex',gap:8,marginBottom:16 }}>
              <input value={codePromo} onChange={e=>setCodePromo(e.target.value)} placeholder="Code promo" style={{ flex:1,padding:'10px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none' }} />
              <button onClick={appliquer} style={{ padding:'10px 16px',background:FUCH,color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer' }}>Appliquer</button>
            </div>
            {[['Sous-total',px(total)],remise>0?['Remise promo',`-${px(remise)}`]:null,['Livraison',total>=75?'Gratuite':'À calculer']].filter(Boolean).map(([k,v]:any,i)=>(
              <div key={i} style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:14,color:i<2?'#666':FUCH }}><span>{k}</span><span style={{ fontWeight:600,color:k==='Remise promo'?'#22c55e':undefined }}>{v}</span></div>
            ))}
            <div style={{ borderTop:`2px solid ${LAV2}`,paddingTop:12,marginBottom:20,display:'flex',justifyContent:'space-between' }}>
              <span style={{ fontWeight:800,color:TXT,fontSize:16 }}>Total</span>
              <span style={{ fontWeight:900,color:FUCH,fontSize:20 }}>{px(totalFinal)}</span>
            </div>
            <button style={{ width:'100%',padding:'14px',background:`linear-gradient(135deg,${LAV},${FUCH})`,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:800,cursor:'pointer' }}>
              Passer à la caisse →
            </button>
            <button onClick={()=>onNaviguer('catalogue')} style={{ width:'100%',padding:'10px',background:'none',border:'none',color:'#888',fontSize:13,cursor:'pointer',marginTop:8 }}>
              ← Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Wishlist ─────────────────────────────────────────────────────────────
function PageWishlist({ produits, wishlist, onWishlist, onPanier, panier, onNaviguer }: any) {
  const items = produits.filter((p:Produit)=>wishlist.includes(p.id));
  if (items.length===0) return (
    <div style={{ background:FOND,minHeight:'60vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:40,gap:16 }}>
      <div style={{ fontSize:72,marginBottom:8 }}>💜</div>
      <h2 style={{ fontSize:22,fontWeight:800,color:TXT }}>Votre liste de souhaits est vide</h2>
      <p style={{ color:'#888',fontSize:14 }}>Ajoutez des produits à votre wishlist en cliquant sur le cœur ❤️</p>
      <button onClick={()=>onNaviguer('catalogue')} style={{ padding:'13px 28px',background:FUCH,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer' }}>Découvrir nos produits →</button>
    </div>
  );
  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'32px 24px 60px' }}>
        <h1 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:900,color:TXT,marginBottom:24,fontFamily:'Georgia,serif' }}>Ma Liste de Souhaits 💜</h1>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:20 }}>
          {items.map((p:Produit)=>(
            <CarteProduit key={p.id} p={p} onVoir={()=>onNaviguer('fiche',p)} onPanier={()=>onPanier(p)} dansPanier={panier.some((x:any)=>x.produit.id===p.id)} dansWishlist={wishlist.includes(p.id)} onWishlist={()=>onWishlist(p.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Compte acheteur ──────────────────────────────────────────────────────────
function PageCompte({ gestionnaireId, onNaviguer }: { gestionnaireId:number; onNaviguer:(p:string)=>void }) {
  const CLE = `acheteur_beaute_${gestionnaireId}`;
  const [user, setUser] = useState<AcheteurUser|null>(()=>{ try{ return JSON.parse(localStorage.getItem(CLE)||'null'); }catch{ return null; } });
  const [onglet, setOnglet] = useState<'commandes'|'profil'>('commandes');
  const [form, setForm] = useState({ email:'',password:'',prenom:'',nom:'' });
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [err, setErr] = useState('');

  const connecter = () => {
    if (!form.email) { setErr('Email requis'); return; }
    const u:AcheteurUser = { id:Date.now(),prenom:form.prenom||'Cliente',nom:form.nom||'',email:form.email };
    localStorage.setItem(CLE,JSON.stringify(u)); setUser(u); setErr('');
  };
  if (!user) return (
    <div style={{ background:FOND,minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
      <div style={{ background:'#fff',borderRadius:24,padding:'36px',maxWidth:420,width:'100%',border:`1px solid ${LAV2}`,boxShadow:'0 8px 40px rgba(192,132,252,0.15)' }}>
        <div style={{ textAlign:'center',marginBottom:24 }}>
          <div style={{ fontSize:48,marginBottom:10 }}>💜</div>
          <h2 style={{ fontSize:22,fontWeight:900,color:TXT,margin:0,fontFamily:'Georgia,serif' }}>{mode==='login'?'Se connecter':'Créer un compte'}</h2>
        </div>
        {mode==='register' && <>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
            <input value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} placeholder="Prénom" style={{ padding:'11px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none' }} />
            <input value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Nom" style={{ padding:'11px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none' }} />
          </div>
        </>}
        <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Votre courriel" style={{ width:'100%',padding:'11px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none',marginBottom:10,boxSizing:'border-box' }} />
        <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Mot de passe" style={{ width:'100%',padding:'11px 12px',border:`1px solid ${LAV2}`,borderRadius:10,fontSize:13,color:TXT,outline:'none',marginBottom:16,boxSizing:'border-box' }} />
        {err && <p style={{ color:'#ef4444',fontSize:12,margin:'0 0 12px' }}>{err}</p>}
        <button onClick={connecter} style={{ width:'100%',padding:'13px',background:`linear-gradient(135deg,${LAV},${FUCH})`,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:800,cursor:'pointer',marginBottom:12 }}>
          {mode==='login'?'Se connecter →':'Créer mon compte →'}
        </button>
        <p style={{ textAlign:'center',fontSize:13,color:'#888',margin:0 }}>
          {mode==='login'?'Pas encore de compte ?':'Déjà un compte ?'}
          <button onClick={()=>setMode(m=>m==='login'?'register':'login')} style={{ background:'none',border:'none',color:FUCH,cursor:'pointer',fontSize:13,fontWeight:700,padding:'0 4px' }}>
            {mode==='login'?'S\'inscrire':'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ background:FOND,minHeight:'60vh' }}>
      <div style={{ maxWidth:800,margin:'0 auto',padding:'32px 24px 60px' }}>
        <div style={{ background:`linear-gradient(135deg,${LAV},${FUCH})`,borderRadius:20,padding:'24px',marginBottom:24,display:'flex',alignItems:'center',gap:16 }}>
          <div style={{ width:56,height:56,borderRadius:16,background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>💜</div>
          <div>
            <h2 style={{ fontSize:20,fontWeight:900,color:'#fff',margin:'0 0 4px' }}>Bonjour, {user.prenom} !</h2>
            <p style={{ fontSize:13,color:'rgba(255,255,255,0.8)',margin:0 }}>{user.email}</p>
          </div>
          <button onClick={()=>{ localStorage.removeItem(CLE); setUser(null); }} style={{ marginLeft:'auto',padding:'8px 16px',background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}>Déconnexion</button>
        </div>
        <div style={{ display:'flex',gap:0,marginBottom:24,background:'#fff',borderRadius:12,padding:4,border:`1px solid ${LAV2}` }}>
          {(['commandes','profil'] as const).map(o=>(
            <button key={o} onClick={()=>setOnglet(o)}
              style={{ flex:1,padding:'10px',border:'none',borderRadius:10,background:onglet===o?FUCH:'transparent',color:onglet===o?'#fff':'#888',fontSize:14,fontWeight:700,cursor:'pointer',transition:'all 0.2s' }}>
              {o==='commandes'?'📦 Mes commandes':'👤 Mon profil'}
            </button>
          ))}
        </div>
        {onglet==='commandes' && (
          <div style={{ textAlign:'center',padding:'48px 24px',background:'#fff',borderRadius:16,border:`1px solid ${LAV2}` }}>
            <div style={{ fontSize:48,marginBottom:12 }}>📦</div>
            <p style={{ color:'#888',fontSize:14 }}>Aucune commande pour le moment.</p>
            <button onClick={()=>onNaviguer('catalogue')} style={{ padding:'11px 24px',background:FUCH,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',marginTop:12 }}>Commencer mes achats →</button>
          </div>
        )}
        {onglet==='profil' && (
          <div style={{ background:'#fff',borderRadius:16,padding:'24px',border:`1px solid ${LAV2}` }}>
            <h3 style={{ fontSize:16,fontWeight:800,color:TXT,marginBottom:16 }}>Mes informations</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {[['Prénom',user.prenom],['Nom',user.nom||'—'],['Courriel',user.email]].map(([k,v])=>(
                <div key={k}><p style={{ margin:'0 0 4px',fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase' }}>{k}</p><p style={{ margin:0,fontSize:14,color:TXT,fontWeight:600 }}>{v}</p></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ cfg, page, onNaviguer, nbPanier, nbWishlist }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { id:'accueil', label:'Accueil' },
    { id:'collections', label:'Collections' },
    { id:'catalogue', label:'Boutique' },
    { id:'blog', label:'Journal' },
    { id:'faq', label:'FAQ' },
    { id:'contact', label:'Contact' },
  ];
  return (
    <header style={{ background:'#fff',boxShadow:'0 2px 20px rgba(192,132,252,0.12)',position:'sticky',top:0,zIndex:100,borderBottom:`1px solid ${LAV2}` }}>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',height:68,gap:24 }}>
        {cfg.logoUrl
          ? <img src={cfg.logoUrl} alt={cfg.nomBoutique} style={{ height:44,objectFit:'contain' }} />
          : <div onClick={()=>onNaviguer('accueil')} style={{ cursor:'pointer' }}>
              <span style={{ fontSize:22,fontWeight:900,color:TXT,fontFamily:'Georgia,serif' }}>{cfg.nomBoutique||CFG_DEF.nomBoutique}</span>
            </div>
        }
        <nav style={{ display:'flex',gap:28,marginLeft:28 }}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>onNaviguer(n.id)}
              style={{ background:'none',border:'none',fontSize:14,fontWeight:page===n.id?800:600,color:page===n.id?FUCH:TXT2,cursor:'pointer',padding:'4px 0',borderBottom:`2px solid ${page===n.id?FUCH:'transparent'}`,transition:'all 0.2s',fontFamily:'inherit' }}>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft:'auto',display:'flex',gap:12,alignItems:'center' }}>
          <button onClick={()=>onNaviguer('wishlist')} style={{ position:'relative',background:'none',border:'none',cursor:'pointer',fontSize:20,padding:4 }}>
            🤍{nbWishlist>0&&<span style={{ position:'absolute',top:-4,right:-4,width:18,height:18,borderRadius:'50%',background:FUCH,color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center' }}>{nbWishlist}</span>}
          </button>
          <button onClick={()=>onNaviguer('compte')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:20,padding:4 }}>👤</button>
          <button onClick={()=>onNaviguer('panier')} style={{ position:'relative',background:`linear-gradient(135deg,${LAV},${FUCH})`,border:'none',borderRadius:12,padding:'8px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:8,color:'#fff',fontWeight:700,fontSize:14 }}>
            🛒 {nbPanier>0?`${nbPanier}`:'Panier'}
            {nbPanier>0&&<span style={{ background:'rgba(255,255,255,0.3)',borderRadius:50,padding:'2px 8px',fontSize:12 }}>{nbPanier}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ cfg, onNaviguer }: any) {
  const fc = { ...CFG_DEF.footer, ...(cfg.footer||{}) };
  const reseaux = [
    { id:'instagram',icone:'📷',label:'Instagram' },
    { id:'facebook',icone:'📘',label:'Facebook' },
    { id:'tiktok',icone:'🎵',label:'TikTok' },
    { id:'pinterest',icone:'📌',label:'Pinterest' },
  ];
  return (
    <footer style={{ background:fc.couleurFond||'#2d1b3d',color:'#fff',paddingTop:40 }}>
      <Vague couleurHaut={FOND2} couleurBas={fc.couleurFond||'#2d1b3d'} />
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px 40px' }}>
        <div style={{ textAlign:'center',marginBottom:32 }}>
          <p style={{ fontSize:28,fontWeight:900,margin:'0 0 6px',fontFamily:'Georgia,serif' }}>{fc.nomBoutique}</p>
          <p style={{ fontSize:14,color:'rgba(255,255,255,0.6)',margin:'0 0 20px' }}>{fc.slogan}</p>
          <div style={{ display:'flex',justifyContent:'center',gap:12,flexWrap:'wrap' }}>
            {reseaux.map(r=>(fc.reseaux?.[r.id]&&
              <a key={r.id} href={fc.reseaux[r.id]} target="_blank" rel="noopener noreferrer"
                style={{ width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,textDecoration:'none',transition:'background 0.2s' }}>
                {r.icone}
              </a>
            ))}
          </div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:32,marginBottom:32 }}>
          {[
            { titre:'Boutique', liens:[{l:'Accueil',p:'accueil'},{l:'Collections',p:'collections'},{l:'Catalogue',p:'catalogue'},{l:'Blog',p:'blog'}] },
            { titre:'Aide', liens:[{l:'FAQ',p:'faq'},{l:'Contact',p:'contact'}] },
            { titre:'Légal', liens:[{l:'Politique de confidentialité',p:'accueil'},{l:'Conditions d\'utilisation',p:'accueil'},{l:'Politique de retours',p:'accueil'}] },
          ].map((col,i)=>(
            <div key={i}>
              <h3 style={{ fontSize:13,fontWeight:800,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:12 }}>{col.titre}</h3>
              {col.liens.map(l=>(
                <button key={l.l} onClick={()=>onNaviguer(l.p)} style={{ display:'block',background:'none',border:'none',color:'rgba(255,255,255,0.75)',fontSize:13,cursor:'pointer',padding:'3px 0',textAlign:'left',fontFamily:'inherit',transition:'color 0.2s' }}>{l.l}</button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
          <p style={{ fontSize:12,color:'rgba(255,255,255,0.4)',margin:0 }}>© 2026 {fc.nomBoutique}. Tous droits réservés.</p>
          {fc.afficherPropulse&&<p style={{ fontSize:12,color:'rgba(255,255,255,0.3)',margin:0 }}>Propulsé par <strong style={{ color:LAV }}>e-Vend Studio</strong></p>}
        </div>
      </div>
    </footer>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function TemplateBoutiqueBeaute({ config, siteId, vendeurId }: Props) {
  const cfg = { ...CFG_DEF, ...(config||{}), hero:{...CFG_DEF.hero,...(config?.hero||{})}, footer:{...CFG_DEF.footer,...(config?.footer||{})} };
  const [page, setPage] = useState<string>('accueil');
  const [pageData, setPageData] = useState<any>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [articles, setArticles] = useState<ArticleBlog[]>([]);
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(()=>{
    if (config?.__produits_demo__) { setProduits(config.__produits_demo__); setArticles(ARTICLES_DEMO); setChargement(false); return; }
    const token = localStorage.getItem('token');
    const h = { Authorization:`Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/produits/gestionnaire/${vendeurId}`,{headers:h,credentials:'include'}).then(r=>r.ok?r.json():[]).catch(()=>[]),
      fetch(`${API_BASE}/blog/gestionnaire/${vendeurId}`,{headers:h,credentials:'include'}).then(r=>r.ok?r.json():[]).catch(()=>[]),
    ]).then(([prods,arts])=>{
      setProduits(prods.length?prods:PRODUITS_DEMO);
      setArticles(arts.length?arts:ARTICLES_DEMO);
    }).finally(()=>setChargement(false));
    if (cfg.afficherPopupPromo) setTimeout(()=>setPopupVisible(true),4000);
  },[vendeurId]);

  useEffect(()=>{ window.scrollTo({top:0,behavior:'smooth'}); },[page]);

  const naviguer = (p:string, data?:any) => { setPage(p); setPageData(data||null); };
  const ajouterPanier = (produit:Produit, qte=1) => {
    setPanier(prev=>{ const ex=prev.find(x=>x.produit.id===produit.id); if(ex) return prev.map(x=>x.produit.id===produit.id?{...x,qte:x.qte+qte}:x); return [...prev,{produit,qte}]; });
  };
  const modifierPanier = (id:number,qte:number) => { if(qte<=0) supprimerPanier(id); else setPanier(prev=>prev.map(x=>x.produit.id===id?{...x,qte}:x)); };
  const supprimerPanier = (id:number) => setPanier(prev=>prev.filter(x=>x.produit.id!==id));
  const toggleWishlist = (id:number) => setWishlist(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const nbPanier = panier.reduce((s,x)=>s+x.qte,0);
  const totalPanier = panier.reduce((s,it)=>s+(it.produit.prix_promo||it.produit.prix)*it.qte,0);

  if (chargement) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:FOND,flexDirection:'column',gap:16 }}>
      <div style={{ fontSize:48 }}>💄</div>
      <p style={{ color:FUCH,fontSize:16,fontWeight:700 }}>Chargement de votre boutique...</p>
    </div>
  );

  const propsCom = { produits, onNaviguer:naviguer, onPanier:ajouterPanier, panier, wishlist, onWishlist:toggleWishlist };

  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif",color:TXT,background:FOND }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      {cfg.afficherTicker && <Ticker texte={cfg.tickerTexte||CFG_DEF.tickerTexte} />}
      <Header cfg={cfg} page={page} onNaviguer={naviguer} nbPanier={nbPanier} nbWishlist={wishlist.length} />
      {nbPanier>0 && <BarreLivraison total={totalPanier} seuil={cfg.seuilLivraisonGratuite||75} />}

      <main>
        {page==='accueil'    && <PageAccueil cfg={cfg} articles={articles} produits={produits} onNaviguer={naviguer} onPanier={ajouterPanier} panier={panier} wishlist={wishlist} onWishlist={toggleWishlist} />}
        {page==='collections'&& <PageCollections onNaviguer={naviguer} />}
        {page==='catalogue'  && <PageCatalogue {...propsCom} />}
        {page==='fiche'      && pageData && <PageFicheProduit produit={pageData} {...propsCom} />}
        {page==='blog'       && <PageBlog articles={articles} onNaviguer={naviguer} />}
        {page==='article'    && pageData && <PageArticle article={pageData} onNaviguer={naviguer} />}
        {page==='faq'        && <PageFAQ cfg={cfg} />}
        {page==='contact'    && <PageContact cfg={cfg} />}
        {page==='panier'     && <PagePanier panier={panier} onModifier={modifierPanier} onSupprimer={supprimerPanier} onNaviguer={naviguer} />}
        {page==='wishlist'   && <PageWishlist produits={produits} wishlist={wishlist} onWishlist={toggleWishlist} onPanier={ajouterPanier} panier={panier} onNaviguer={naviguer} />}
        {page==='compte'     && <PageCompte gestionnaireId={vendeurId} onNaviguer={naviguer} />}
      </main>

      <Footer cfg={cfg} onNaviguer={naviguer} />

      {cfg.afficherNotifVente && <NotifVente />}
      {popupVisible && cfg.afficherPopupPromo && <PopupPromo texte={cfg.popupPromoTexte||CFG_DEF.popupPromoTexte} code={cfg.popupPromoCode||CFG_DEF.popupPromoCode} onFermer={()=>setPopupVisible(false)} />}
    </div>
  );
}