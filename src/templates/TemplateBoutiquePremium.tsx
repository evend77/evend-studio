// src/templates/TemplateBoutiquePremium.tsx
// e-Vend Studio — Template Boutique Premium
// Style sombre luxueux avec accents dorés — le vrai Shopify killer
// Pages : Accueil · Catalogue · Fiche produit · Blog · FAQ · Contact · Panier · Wishlist · Compte acheteur
// 100% mobile responsive

import { useState, useEffect, useCallback, useRef } from 'react';

const OR    = '#c9a96e';
const OR2   = '#e8c87a';
const NOIR  = '#0a0a0a';
const NOIR2 = '#111111';
const SURF  = '#1e1e1e';
const SURF2 = '#252525';
const BORD  = 'rgba(201,169,110,0.2)';
const API_BASE = '/api';

interface Produit {
  id: number; titre: string; prix: number; prix_promo?: number;
  photo_principale?: string; photos?: string[]; description?: string;
  stock?: number; categorie?: string; sku?: string; marque?: string;
  note_moyenne?: number; nb_avis?: number;
  variantes?: { nom: string; valeurs: string[] }[];
}

interface ArticleBlog {
  id: number; titre: string; slug: string; resume?: string;
  photo?: string; auteur?: string; date_publication?: string; categorie?: string;
}

interface Avis {
  id: number; note: number; commentaire: string;
  prenom?: string; nom?: string; date_avis: string;
}

interface AcheteurUser {
  id: number; prenom: string; nom: string; email: string;
  telephone?: string; adresse?: string; ville?: string; province?: string; code_postal?: string;
}

interface PanierItem { produit: Produit; qte: number; variante?: string; }

interface Props { config: any; siteId?: number; vendeurId: number; }

const px = (n: number) => n?.toFixed(2).replace('.', ',') + ' $';

const PRODUITS_DEMO: Produit[] = [
  { id:1, titre:'Montre Édition Limitée', prix:299.99, prix_promo:249.99, stock:5, categorie:'Accessoires', note_moyenne:4.8, nb_avis:124, description:'Montre de luxe avec boîtier en acier inoxydable et cadran saphir. Étanche 50m. Garantie 2 ans.', photo_principale:'' },
  { id:2, titre:'Sac Cuir Véritable', prix:189.99, stock:12, categorie:'Maroquinerie', note_moyenne:4.9, nb_avis:87, description:'Sac en cuir pleine fleur tanné végétal. Doublure en suède. Fabriqué à la main.', photo_principale:'' },
  { id:3, titre:'Parfum Signature', prix:149.99, stock:20, categorie:'Beauté', note_moyenne:4.7, nb_avis:203, description:'Eau de parfum 100ml. Notes de tête: bergamote. Notes de cœur: rose, jasmin.', photo_principale:'' },
  { id:4, titre:'Coffret Soins Premium', prix:89.99, prix_promo:69.99, stock:8, categorie:'Beauté', note_moyenne:4.6, nb_avis:56, description:'Coffret de 5 produits de soin visage haut de gamme.', photo_principale:'' },
  { id:5, titre:'Ceinture Cuir Italien', prix:119.99, stock:15, categorie:'Maroquinerie', note_moyenne:4.8, nb_avis:41, description:'Ceinture en cuir de veau italien. Boucle en laiton doré.', photo_principale:'' },
  { id:6, titre:'Portefeuille Slim', prix:79.99, stock:25, categorie:'Maroquinerie', note_moyenne:4.7, nb_avis:92, description:'Portefeuille ultra-mince en cuir de veau. 6 emplacements cartes.', photo_principale:'' },
  { id:7, titre:'Chapeau Fedora', prix:59.99, stock:10, categorie:'Accessoires', note_moyenne:4.5, nb_avis:34, description:'Chapeau fedora en laine feutrée. Ruban en soie.', photo_principale:'' },
  { id:8, titre:'Écharpe Cachemire', prix:199.99, prix_promo:159.99, stock:7, categorie:'Mode', note_moyenne:4.9, nb_avis:67, description:'Écharpe 100% cachemire mongolien. Tissage fait main.', photo_principale:'' },
];

const CFG_DEF = {
  nomBoutique: 'Ma Boutique Premium', slogan: "L'excellence à votre portée",
  couleurAccent: OR, couleurFond: NOIR, couleurTexte: '#ffffff',
  afficherTicker: true, tickerTexte: '✦ LIVRAISON GRATUITE dès 100$ ✦ RETOUR 30 JOURS ✦ PAIEMENT SÉCURISÉ ✦',
  afficherPopupPromo: false, popupPromoTexte: 'Obtenez 10% de réduction sur votre première commande !', popupPromoCode: 'BIENVENUE10',
  afficherBarreLivraison: true, seuilLivraisonGratuite: 100,
  afficherNotifVente: true, afficherNbVues: true, afficherWishlist: true, afficherAvis: true,
  logoUrl: '',
  footer: {
    nomBoutique: 'Ma Boutique Premium', slogan: "L'excellence à votre portée",
    couleurFond: '#050505', couleurTexte: '#ffffff',
    reseaux: { facebook:'', instagram:'', tiktok:'', twitter:'', youtube:'', linkedin:'', pinterest:'' },
    colonnes: { titre1:'Boutique', liens1:'Accueil\nCatalogue\nBlog\nFAQ', titre2:'Aide', liens2:'Contact\nRetours\nLivraison', titre3:'Légal', liens3:'Conditions\nConfidentialité' },
    politiques: { afficherConditions:true, afficherConfidentialite:true, afficherRetours:true, afficherLivraison:true },
    afficherPropulse: true,
  },
};

function Etoiles({ note, taille=14 }: { note:number; taille?:number }) {
  return <span style={{ display:'inline-flex',gap:1 }}>{[1,2,3,4,5].map(i=><span key={i} style={{ fontSize:taille,color:i<=Math.round(note)?OR:'#444' }}>★</span>)}</span>;
}

function Ticker({ texte, couleur=OR }: { texte:string; couleur?:string }) {
  return (
    <div style={{ background:NOIR,borderBottom:`1px solid ${BORD}`,overflow:'hidden',height:36,display:'flex',alignItems:'center' }}>
      <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}.ticker-inner{display:flex;white-space:nowrap;animation:ticker 20s linear infinite;}`}</style>
      <div className="ticker-inner">
        {[...Array(4)].map((_,i)=><span key={i} style={{ fontSize:11,fontWeight:600,color:couleur,letterSpacing:'0.1em',paddingRight:80 }}>{texte}</span>)}
      </div>
    </div>
  );
}

function NotifVente({ cp }: { cp:string }) {
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const ventes = [
    { prenom:'Marie', ville:'Montréal', produit:'Montre Édition Limitée', temps:'2 min' },
    { prenom:'Jean', ville:'Québec', produit:'Sac Cuir Véritable', temps:'5 min' },
    { prenom:'Sophie', ville:'Laval', produit:'Parfum Signature', temps:'8 min' },
  ];
  useEffect(() => {
    const t1 = setTimeout(()=>setVisible(true),3000);
    const iv = setInterval(()=>{ setVisible(false); setTimeout(()=>{ setIdx(i=>(i+1)%ventes.length); setVisible(true); },500); },6000);
    return ()=>{ clearTimeout(t1); clearInterval(iv); };
  },[]);
  if (!visible) return null;
  const v = ventes[idx];
  return (
    <div style={{ position:'fixed',bottom:24,left:24,zIndex:500,background:SURF2,border:`1px solid ${BORD}`,borderRadius:12,padding:'12px 16px',display:'flex',gap:12,alignItems:'center',maxWidth:300,boxShadow:`0 8px 32px rgba(0,0,0,0.5)` }}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:40,height:40,borderRadius:8,background:`${cp}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>🛍</div>
      <div>
        <p style={{ margin:0,fontSize:12,color:'#ccc' }}><strong style={{ color:'#fff' }}>{v.prenom}</strong> de {v.ville}</p>
        <p style={{ margin:'2px 0 0',fontSize:11,color:OR }}>a acheté {v.produit}</p>
        <p style={{ margin:'2px 0 0',fontSize:10,color:'#666' }}>il y a {v.temps}</p>
      </div>
      <button onClick={()=>setVisible(false)} style={{ position:'absolute',top:6,right:8,background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:12 }}>✕</button>
    </div>
  );
}

function BarreLivraison({ total, seuil, cp }: { total:number; seuil:number; cp:string }) {
  const pct = Math.min(100,(total/seuil)*100);
  const reste = Math.max(0,seuil-total);
  return (
    <div style={{ background:SURF,borderRadius:10,padding:'12px 16px',marginBottom:16 }}>
      {reste>0 ? <p style={{ fontSize:13,color:'#ccc',margin:'0 0 8px' }}>Ajoutez <strong style={{ color:cp }}>{px(reste)}</strong> pour la <strong style={{ color:cp }}>livraison gratuite</strong> !</p>
               : <p style={{ fontSize:13,color:'#4ade80',margin:'0 0 8px',fontWeight:700 }}>🎉 Livraison gratuite !</p>}
      <div style={{ background:'#333',borderRadius:4,height:6,overflow:'hidden' }}>
        <div style={{ width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${cp},${OR2})`,borderRadius:4,transition:'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function CarteProduit({ produit, cp, onClick, onWishlist, inWishlist, vue='grille' }: {
  produit:Produit; cp:string; onClick:()=>void; onWishlist?:()=>void; inWishlist?:boolean; vue?:'grille'|'liste';
}) {
  const [hovered,setHovered] = useState(false);
  const enPromo = produit.prix_promo && produit.prix_promo < produit.prix;

  if (vue==='liste') return (
    <div onClick={onClick} style={{ display:'flex',gap:20,padding:16,background:hovered?SURF2:SURF,border:`1px solid ${hovered?BORD:'#222'}`,borderRadius:12,cursor:'pointer',transition:'all 0.2s',alignItems:'center' }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      <div style={{ width:100,height:100,borderRadius:8,background:'#1a1a1a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,flexShrink:0,overflow:'hidden' }}>
        {produit.photo_principale ? <img src={produit.photo_principale} alt={produit.titre} style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : '📦'}
      </div>
      <div style={{ flex:1 }}>
        {produit.categorie && <span style={{ fontSize:10,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em' }}>{produit.categorie}</span>}
        <h3 style={{ fontSize:16,fontWeight:700,color:'#fff',margin:'4px 0 8px' }}>{produit.titre}</h3>
        {produit.note_moyenne && <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}><Etoiles note={produit.note_moyenne}/><span style={{ fontSize:11,color:'#888' }}>({produit.nb_avis})</span></div>}
        {produit.description && <p style={{ fontSize:13,color:'#888',margin:0,lineHeight:1.5,overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any }}>{produit.description}</p>}
      </div>
      <div style={{ textAlign:'right',flexShrink:0 }}>
        {enPromo ? (<><div style={{ fontSize:20,fontWeight:800,color:'#ef4444' }}>{px(produit.prix_promo!)}</div><div style={{ fontSize:13,color:'#555',textDecoration:'line-through' }}>{px(produit.prix)}</div></>) 
                 : <div style={{ fontSize:20,fontWeight:800,color:cp }}>{px(produit.prix)}</div>}
        <button onClick={e=>{e.stopPropagation();onClick();}} style={{ marginTop:8,padding:'6px 14px',background:cp,border:'none',borderRadius:6,color:'#000',fontSize:12,fontWeight:700,cursor:'pointer' }}>Voir</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'relative',background:hovered?SURF2:SURF,border:`1px solid ${hovered?BORD:'#222'}`,borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all 0.25s ease' }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={onClick}>
      <div style={{ aspectRatio:'1',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56,overflow:'hidden',position:'relative' }}>
        {produit.photo_principale ? <img src={produit.photo_principale} alt={produit.titre} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s ease',transform:hovered?'scale(1.08)':'scale(1)' }}/> : <span style={{ color:'#333' }}>📦</span>}
        {enPromo && <span style={{ position:'absolute',top:10,left:10,background:'#ef4444',color:'#fff',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:6 }}>SOLDE</span>}
        {produit.stock!==undefined && produit.stock<=3 && produit.stock>0 && <span style={{ position:'absolute',top:10,right:onWishlist?44:10,background:'#f59e0b',color:'#000',fontSize:9,fontWeight:800,padding:'3px 7px',borderRadius:6 }}>Plus que {produit.stock}!</span>}
        {produit.stock===0 && <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ color:'#fff',fontSize:13,fontWeight:700,background:'#333',padding:'6px 14px',borderRadius:6 }}>Épuisé</span></div>}
        {onWishlist && <button onClick={e=>{e.stopPropagation();onWishlist();}} style={{ position:'absolute',top:10,right:10,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.6)',border:`1px solid ${inWishlist?'#ef4444':'#444'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>{inWishlist?'❤️':'🤍'}</button>}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'12px',background:'linear-gradient(transparent,rgba(0,0,0,0.8))',opacity:hovered?1:0,transition:'opacity 0.25s ease' }}>
          <button onClick={e=>{e.stopPropagation();onClick();}} style={{ width:'100%',padding:'8px',background:cp,border:'none',borderRadius:7,color:'#000',fontSize:12,fontWeight:800,cursor:'pointer',letterSpacing:'0.04em' }}>VOIR LE PRODUIT</button>
        </div>
      </div>
      <div style={{ padding:'14px 16px' }}>
        {produit.categorie && <span style={{ fontSize:9,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em' }}>{produit.categorie}</span>}
        <h3 style={{ fontSize:14,fontWeight:600,color:'#e5e5e5',margin:'4px 0 6px',lineHeight:1.3 }}>{produit.titre}</h3>
        {produit.note_moyenne && <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:8 }}><Etoiles note={produit.note_moyenne} taille={11}/><span style={{ fontSize:10,color:'#666' }}>({produit.nb_avis})</span></div>}
        <div style={{ display:'flex',alignItems:'baseline',gap:8 }}>
          {enPromo ? (<><span style={{ fontSize:17,fontWeight:800,color:'#ef4444' }}>{px(produit.prix_promo!)}</span><span style={{ fontSize:12,color:'#555',textDecoration:'line-through' }}>{px(produit.prix)}</span><span style={{ fontSize:10,color:'#ef4444',fontWeight:700 }}>-{Math.round((1-produit.prix_promo!/produit.prix)*100)}%</span></>)
                   : <span style={{ fontSize:17,fontWeight:800,color:cp }}>{px(produit.prix)}</span>}
        </div>
      </div>
    </div>
  );
}

export default function TemplateBoutiquePremium({ config: configBrut, siteId, vendeurId }: Props) {
  const raw = configBrut?.premium || {};
  const cfg = { ...CFG_DEF, ...raw, footer: { ...CFG_DEF.footer, ...(raw.footer||{}) } };
  const cp  = cfg.couleurAccent || OR;

  type PageId = 'accueil'|'catalogue'|'produit'|'blog'|'article'|'faq'|'a-propos'|'contact'|'panier'|'wishlist'|'compte'|'login';
  const [page,setPage]             = useState<PageId>('accueil');
  const [produitActif,setProduitActif] = useState<Produit|null>(null);
  const [articleActif,setArticleActif] = useState<ArticleBlog|null>(null);
  const [isMobile,setIsMobile]     = useState(false);
  const [menuOuvert,setMenuOuvert] = useState(false);
  const [produits,setProduits]     = useState<Produit[]>([]);
  const [articles,setArticles]     = useState<ArticleBlog[]>([]);
  const [categories,setCategories] = useState<string[]>([]);
  const [avisActif,setAvisActif]   = useState<Avis[]>([]);
  const [acheteur,setAcheteur]     = useState<AcheteurUser|null>(null);
  const [tokenAcheteur,setTokenAcheteur] = useState('');
  const [panier,setPanier]         = useState<PanierItem[]>([]);
  const [wishlist,setWishlist]     = useState<number[]>([]);
  const [panierOuvert,setPanierOuvert] = useState(false);
  const [filtreCat,setFiltreCat]   = useState('');
  const [filtreRecherche,setFiltreRecherche] = useState('');
  const [filtrePrixMin,setFiltrePrixMin] = useState('');
  const [filtrePrixMax,setFiltrePrixMax] = useState('');
  const [tri,setTri]               = useState<'recent'|'prix_asc'|'prix_desc'|'note'>('recent');
  const [vueCatalogue,setVueCatalogue] = useState<'grille'|'liste'>('grille');
  const [colonnes,setColonnes]     = useState(3);
  const [popupPromo,setPopupPromo] = useState(false);
  const [photoIdx,setPhotoIdx]     = useState(0);
  const [qteChoisie,setQteChoisie] = useState(1);
  const [varianteChoisie,setVarianteChoisie] = useState<Record<string,string>>({});
  const [zoomActif,setZoomActif]   = useState(false);
  const [sourisPos,setSourisPos]   = useState({x:0,y:0});
  const [ongletProduit,setOngletProduit] = useState<'description'|'avis'|'livraison'>('description');
  const [codePromo,setCodePromo]   = useState('');
  const [codePromoApplique,setCodePromoApplique] = useState<{valeur:number;type:string}|null>(null);
  const [faqOuvert,setFaqOuvert]   = useState<number|null>(null);
  const [contactForm,setContactForm] = useState({nom:'',courriel:'',sujet:'',message:''});
  const [contactStatut,setContactStatut] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [loginForm,setLoginForm]   = useState({email:'',mdp:''});
  const [loginStatut,setLoginStatut] = useState<'idle'|'loading'|'err'>('idle');
  const [loginErreur,setLoginErreur] = useState('');

  useEffect(()=>{ const c=()=>setIsMobile(window.innerWidth<768); c(); window.addEventListener('resize',c); return()=>window.removeEventListener('resize',c); },[]);
  useEffect(()=>{ if(cfg.afficherPopupPromo){ const t=setTimeout(()=>setPopupPromo(true),4000); return()=>clearTimeout(t); } },[cfg.afficherPopupPromo]);

  useEffect(()=>{
    if(configBrut?.__produits_demo__){ setProduits(configBrut.__produits_demo__); setCategories(Array.from(new Set(configBrut.__produits_demo__.map((p:any)=>p.categorie).filter(Boolean))) as string[]); return; }
    setProduits(PRODUITS_DEMO); setCategories(Array.from(new Set(PRODUITS_DEMO.map(p=>p.categorie).filter(Boolean))) as string[]);
    fetch(`${API_BASE}/produits/vendeur/${vendeurId}?limit=100`).then(r=>r.ok?r.json():null).then(data=>{ if(!data) return; const l:Produit[]=data.produits||data||[]; if(l.length>0){ setProduits(l); setCategories(Array.from(new Set(l.map(p=>p.categorie).filter(Boolean))) as string[]); } }).catch(()=>{});
  },[vendeurId]);

  useEffect(()=>{ fetch(`${API_BASE}/blog/vendeur/${vendeurId}?publie=true&limit=20`).then(r=>r.ok?r.json():[]).then(data=>setArticles(Array.isArray(data)?data:data.articles||[])).catch(()=>{}); },[vendeurId]);

  useEffect(()=>{
    const u=localStorage.getItem(`acheteur_${vendeurId}`),t=localStorage.getItem(`acheteur_token_${vendeurId}`);
    if(u&&t){ try{ setAcheteur(JSON.parse(u)); setTokenAcheteur(t); } catch{} }
  },[vendeurId]);

  const naviguer = useCallback((dest:string)=>{
    setMenuOuvert(false); setPanierOuvert(false); window.scrollTo({top:0,behavior:'smooth'});
    const map:Record<string,PageId>={ accueil:'accueil',catalogue:'catalogue',blog:'blog',faq:'faq','a-propos':'a-propos',contact:'contact',panier:'panier',wishlist:'wishlist',compte:'compte',login:'login' };
    if(map[dest.toLowerCase()]) setPage(map[dest.toLowerCase()]);
  },[]);

  const voirProduit = (p:Produit)=>{ setProduitActif(p); setPhotoIdx(0); setQteChoisie(1); setVarianteChoisie({}); setOngletProduit('description'); setPage('produit'); window.scrollTo({top:0,behavior:'smooth'}); fetch(`${API_BASE}/avis/produit/${p.id}`).then(r=>r.ok?r.json():[]).then(data=>setAvisActif(Array.isArray(data)?data:[])).catch(()=>{}); };
  const voirArticle = (a:ArticleBlog)=>{ setArticleActif(a); setPage('article'); window.scrollTo({top:0,behavior:'smooth'}); };

  const ajouterAuPanier = (produit:Produit)=>{
    const variante=Object.values(varianteChoisie).join(' / ')||undefined;
    setPanier(prev=>{ const ex=prev.find(i=>i.produit.id===produit.id&&i.variante===variante); if(ex) return prev.map(i=>i.produit.id===produit.id&&i.variante===variante?{...i,qte:i.qte+qteChoisie}:i); return [...prev,{produit,qte:qteChoisie,variante}]; });
    setPanierOuvert(true);
  };

  const totalPanier  = panier.reduce((s,i)=>s+(i.produit.prix_promo||i.produit.prix)*i.qte,0);
  const nbPanier     = panier.reduce((s,i)=>s+i.qte,0);
  const totalApresCode = codePromoApplique ? (codePromoApplique.type==='pourcentage' ? totalPanier*(1-codePromoApplique.valeur/100) : Math.max(0,totalPanier-codePromoApplique.valeur)) : totalPanier;
  const toggleWishlist = (id:number)=>setWishlist(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);

  const handleLogin = async()=>{
    setLoginStatut('loading'); setLoginErreur('');
    try{
      const res=await fetch(`${API_BASE}/acheteurs/login`,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:loginForm.email,mot_de_passe:loginForm.mdp,gestionnaire_id:vendeurId}) });
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||'Erreur');
      setAcheteur(data.acheteur); setTokenAcheteur(data.token);
      localStorage.setItem(`acheteur_${vendeurId}`,JSON.stringify(data.acheteur)); localStorage.setItem(`acheteur_token_${vendeurId}`,data.token);
      setLoginStatut('idle'); naviguer('compte');
    } catch(e:any){ setLoginErreur(e.message||'Erreur'); setLoginStatut('err'); }
  };

  const handleLogout=()=>{ setAcheteur(null); setTokenAcheteur(''); localStorage.removeItem(`acheteur_${vendeurId}`); localStorage.removeItem(`acheteur_token_${vendeurId}`); naviguer('accueil'); };

  const appliquerCode=async()=>{ if(!codePromo.trim()) return; try{ const res=await fetch(`${API_BASE}/reductions/verifier`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:codePromo,vendeur_id:vendeurId,total:totalPanier})}); if(res.ok){ const data=await res.json(); setCodePromoApplique({valeur:data.valeur,type:data.type_remise}); } } catch{} };
  const envoyerContact=async()=>{ setContactStatut('loading'); try{ const res=await fetch(`${API_BASE}/contact/vendeur/${vendeurId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(contactForm)}); if(!res.ok) throw new Error(); setContactStatut('ok'); setContactForm({nom:'',courriel:'',sujet:'',message:''}); } catch{ setContactStatut('err'); } setTimeout(()=>setContactStatut('idle'),4000); };

  const produitsFiltres = produits.filter(p=>{ const mc=!filtreCat||p.categorie===filtreCat; const mr=!filtreRecherche||p.titre.toLowerCase().includes(filtreRecherche.toLowerCase()); const mn=!filtrePrixMin||p.prix>=parseFloat(filtrePrixMin); const mx=!filtrePrixMax||p.prix<=parseFloat(filtrePrixMax); return mc&&mr&&mn&&mx; }).sort((a,b)=>{ if(tri==='prix_asc') return (a.prix_promo||a.prix)-(b.prix_promo||b.prix); if(tri==='prix_desc') return (b.prix_promo||b.prix)-(a.prix_promo||a.prix); if(tri==='note') return (b.note_moyenne||0)-(a.note_moyenne||0); return 0; });

  const styleInput:React.CSSProperties = { width:'100%',padding:'12px 16px',background:SURF,border:`1px solid #333`,borderRadius:10,fontSize:14,outline:'none',color:'#fff',fontFamily:'inherit',boxSizing:'border-box' };
  const styleBtn:React.CSSProperties  = { background:`linear-gradient(135deg,${cp},${OR2})`,color:'#000',border:'none',borderRadius:10,padding:'14px 28px',fontSize:14,fontWeight:800,cursor:'pointer',letterSpacing:'0.05em' };

  const Nav = () => (
    <nav style={{ position:'sticky',top:0,zIndex:100,background:'rgba(10,10,10,0.92)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORD}` }}>
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'0 24px',height:70,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <button onClick={()=>naviguer('accueil')} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}>
          {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomBoutique} style={{ height:40 }}/>
            : <div><div style={{ fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'0.08em' }}>{cfg.nomBoutique}</div>
                {cfg.slogan&&<div style={{ fontSize:9,color:cp,letterSpacing:'0.15em',textTransform:'uppercase',marginTop:2 }}>{cfg.slogan}</div>}</div>}
        </button>
        {!isMobile&&<div style={{ display:'flex',gap:4 }}>
          {[['accueil','Accueil'],['catalogue','Catalogue'],['blog','Blog'],['faq','FAQ'],['a-propos','À propos'],['contact','Contact']].map(([id,label])=>(
            <button key={id} onClick={()=>naviguer(id)} style={{ background:'none',border:'none',color:page===id?cp:'rgba(255,255,255,0.7)',fontSize:13,fontWeight:page===id?700:500,cursor:'pointer',padding:'8px 14px',borderRadius:8,letterSpacing:'0.04em',transition:'color 0.2s' }}>{label}</button>
          ))}</div>}
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          {cfg.afficherWishlist&&<button onClick={()=>naviguer('wishlist')} style={{ position:'relative',background:'none',border:`1px solid #333`,borderRadius:10,width:40,height:40,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>🤍{wishlist.length>0&&<span style={{ position:'absolute',top:-4,right:-4,background:'#ef4444',color:'#fff',borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800 }}>{wishlist.length}</span>}</button>}
          <button onClick={()=>naviguer(acheteur?'compte':'login')} style={{ background:'none',border:`1px solid #333`,borderRadius:10,width:40,height:40,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,position:'relative' }}>
            {acheteur?'👤':'🔑'}{acheteur&&<div style={{ position:'absolute',bottom:2,right:2,width:8,height:8,borderRadius:'50%',background:'#4ade80',border:'1.5px solid #0a0a0a' }}/>}
          </button>
          <button onClick={()=>setPanierOuvert(!panierOuvert)} style={{ position:'relative',display:'flex',alignItems:'center',gap:8,background:`${cp}20`,border:`1px solid ${BORD}`,borderRadius:10,padding:'8px 14px',cursor:'pointer',color:'#fff',fontSize:13,fontWeight:600 }}>
            🛒{nbPanier>0&&<span style={{ background:cp,color:'#000',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:800 }}>{nbPanier}</span>}{!isMobile&&<span>{px(totalPanier)}</span>}
          </button>
          {isMobile&&<button onClick={()=>setMenuOuvert(!menuOuvert)} style={{ background:'none',border:`1px solid #333`,borderRadius:8,width:40,height:40,cursor:'pointer',color:'#fff',fontSize:18 }}>{menuOuvert?'✕':'☰'}</button>}
        </div>
      </div>
      {isMobile&&menuOuvert&&<div style={{ background:NOIR2,borderTop:`1px solid ${BORD}`,padding:'12px 24px 20px' }}>
        {[['accueil','Accueil'],['catalogue','Catalogue'],['blog','Blog'],['faq','FAQ'],['a-propos','À propos'],['contact','Contact']].map(([id,label])=>(
          <button key={id} onClick={()=>naviguer(id)} style={{ display:'block',width:'100%',textAlign:'left',background:page===id?`${cp}15`:'none',border:'none',borderRadius:8,color:page===id?cp:'#ccc',fontSize:15,fontWeight:page===id?700:400,cursor:'pointer',padding:'12px 14px',marginBottom:4 }}>{label}</button>
        ))}</div>}
    </nav>
  );

  const TiroirPanier = () => (
    <>
      {panierOuvert&&<div onClick={()=>setPanierOuvert(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:199,backdropFilter:'blur(4px)' }}/>}
      <div style={{ position:'fixed',top:0,right:panierOuvert?0:'-460px',width:Math.min(460,window.innerWidth),height:'100vh',background:NOIR2,zIndex:200,boxShadow:`-8px 0 40px rgba(0,0,0,0.5)`,display:'flex',flexDirection:'column',transition:'right 0.35s cubic-bezier(0.4,0,0.2,1)',borderLeft:`1px solid ${BORD}` }}>
        <div style={{ padding:'20px 24px',borderBottom:`1px solid ${BORD}`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <div><h2 style={{ margin:0,fontSize:18,fontWeight:800,color:'#fff' }}>Votre panier</h2><span style={{ fontSize:12,color:cp }}>{nbPanier} article{nbPanier>1?'s':''}</span></div>
          <button onClick={()=>setPanierOuvert(false)} style={{ background:SURF,border:'none',borderRadius:8,width:36,height:36,cursor:'pointer',fontSize:18,color:'#fff' }}>✕</button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'16px 24px' }}>
          {panier.length===0 ? <div style={{ textAlign:'center',padding:'60px 0',color:'#555' }}><div style={{ fontSize:56,marginBottom:16 }}>🛒</div><p style={{ color:'#666',marginBottom:20 }}>Votre panier est vide</p><button onClick={()=>{naviguer('catalogue');setPanierOuvert(false);}} style={{ ...styleBtn,padding:'10px 24px',fontSize:13 }}>Voir les produits</button></div>
          : <>{cfg.afficherBarreLivraison&&<BarreLivraison total={totalPanier} seuil={cfg.seuilLivraisonGratuite} cp={cp}/>}
              {panier.map((item,i)=>(
                <div key={i} style={{ display:'flex',gap:14,padding:'14px 0',borderBottom:`1px solid #222`,alignItems:'center' }}>
                  <div style={{ width:70,height:70,borderRadius:8,background:SURF,overflow:'hidden',flexShrink:0 }}>{item.produit.photo_principale?<img src={item.produit.photo_principale} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>📦</div>}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ margin:'0 0 4px',fontSize:13,fontWeight:600,color:'#e5e5e5',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.produit.titre}</p>
                    {item.variante&&<p style={{ margin:'0 0 4px',fontSize:11,color:'#666' }}>{item.variante}</p>}
                    <p style={{ margin:0,fontSize:14,fontWeight:700,color:cp }}>{px((item.produit.prix_promo||item.produit.prix)*item.qte)}</p>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <button onClick={()=>setPanier(prev=>prev.map((it,j)=>j===i?{...it,qte:Math.max(1,it.qte-1)}:it))} style={{ width:28,height:28,borderRadius:6,border:'1px solid #333',background:SURF,color:'#fff',cursor:'pointer',fontSize:14 }}>−</button>
                    <span style={{ fontSize:13,fontWeight:700,color:'#fff',minWidth:20,textAlign:'center' }}>{item.qte}</span>
                    <button onClick={()=>setPanier(prev=>prev.map((it,j)=>j===i?{...it,qte:it.qte+1}:it))} style={{ width:28,height:28,borderRadius:6,border:'1px solid #333',background:SURF,color:'#fff',cursor:'pointer',fontSize:14 }}>+</button>
                    <button onClick={()=>setPanier(prev=>prev.filter((_,j)=>j!==i))} style={{ width:28,height:28,borderRadius:6,border:'none',background:'rgba(239,68,68,0.15)',color:'#ef4444',cursor:'pointer',fontSize:13 }}>✕</button>
                  </div>
                </div>
              ))}</>}
        </div>
        {panier.length>0&&<div style={{ padding:'20px 24px',borderTop:`1px solid ${BORD}` }}>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <input value={codePromo} onChange={e=>setCodePromo(e.target.value)} placeholder="Code promo" style={{ ...styleInput,padding:'10px 14px',fontSize:13,flex:1 }}/>
            <button onClick={appliquerCode} style={{ padding:'10px 16px',background:SURF2,border:`1px solid #444`,borderRadius:10,color:'#fff',fontSize:13,cursor:'pointer',fontWeight:600,flexShrink:0 }}>OK</button>
          </div>
          {codePromoApplique&&<div style={{ background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:13,color:'#4ade80',display:'flex',justifyContent:'space-between' }}><span>✅ Code appliqué</span><button onClick={()=>{setCodePromoApplique(null);setCodePromo('');}} style={{ background:'none',border:'none',color:'#4ade80',cursor:'pointer',fontSize:12 }}>Retirer</button></div>}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:16,paddingTop:12,borderTop:`1px solid #333` }}>
            <span style={{ fontSize:16,fontWeight:700,color:'#fff' }}>Total</span>
            <span style={{ fontSize:22,fontWeight:800,color:cp }}>{px(totalApresCode)}</span>
          </div>
          <button style={{ ...styleBtn,width:'100%',textAlign:'center',fontSize:15 }}>Passer à la caisse →</button>
          <button onClick={()=>naviguer('panier')} style={{ width:'100%',marginTop:10,padding:'10px',background:'none',border:`1px solid #444`,borderRadius:10,color:'#aaa',fontSize:13,cursor:'pointer' }}>Voir le panier complet</button>
        </div>}
      </div>
    </>
  );

  const PageAccueil = () => {
    const vedette = produits.slice(0,8);
    return (
      <>
        {/* Hero */}
        <div style={{ position:'relative',height:isMobile?'80vh':'90vh',overflow:'hidden',background:NOIR }}>
          <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 20% 50%,${cp}15 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,${OR2}10 0%,transparent 50%),${NOIR}` }}/>
          <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}@keyframes glow{0%,100%{opacity:0.4}50%{opacity:0.8}}@keyframes slideIn{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}`}</style>
          {[...Array(8)].map((_,i)=><div key={i} style={{ position:'absolute',width:2,height:2,background:cp,borderRadius:'50%',top:`${10+i*12}%`,left:`${5+i*11}%`,animation:`glow ${2+i*0.3}s ease-in-out infinite`,opacity:0.4 }}/>)}
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 24px' }}>
            <div style={{ textAlign:'center',maxWidth:800,animation:'slideIn 0.8s ease' }}>
              <div style={{ display:'inline-block',fontSize:11,fontWeight:700,color:cp,letterSpacing:'0.2em',textTransform:'uppercase',borderBottom:`1px solid ${BORD}`,paddingBottom:8,marginBottom:24 }}>✦ COLLECTION EXCLUSIVE ✦</div>
              <h1 style={{ fontSize:isMobile?'clamp(36px,10vw,56px)':'clamp(48px,6vw,80px)',fontWeight:900,color:'#fff',lineHeight:1.05,margin:'0 0 24px',letterSpacing:'-0.02em' }}>{cfg.nomBoutique}</h1>
              <p style={{ fontSize:isMobile?16:20,color:'rgba(255,255,255,0.6)',lineHeight:1.6,marginBottom:40,maxWidth:560,margin:'0 auto 40px' }}>{cfg.slogan}</p>
              <div style={{ display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap' }}>
                <button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'16px 40px',fontSize:15 }}>Découvrir la collection →</button>
                <button onClick={()=>naviguer('blog')} style={{ padding:'16px 32px',background:'none',border:`1px solid ${BORD}`,borderRadius:10,color:'rgba(255,255,255,0.7)',fontSize:15,cursor:'pointer' }}>Notre univers</button>
              </div>
            </div>
          </div>
          <div style={{ position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
            <span style={{ fontSize:10,color:cp,letterSpacing:'0.15em',textTransform:'uppercase' }}>Défiler</span>
            <div style={{ width:1,height:40,background:`linear-gradient(${cp},transparent)`,animation:'float 2s ease-in-out infinite' }}/>
          </div>
        </div>

        {/* Avantages */}
        <div style={{ background:`linear-gradient(135deg,${SURF},${SURF2})`,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}` }}>
          <div style={{ maxWidth:1300,margin:'0 auto',padding:'20px 24px',display:'grid',gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:20 }}>
            {[['🚚','Livraison Premium','Offerte dès 100$'],['🔒','Paiement Sécurisé','SSL & Stripe'],['💎','Qualité Garantie','Sélection rigoureuse'],['🔄','Retour 30 Jours','Sans questions']].map(([ico,titre,desc])=>(
              <div key={titre as string} style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:10,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{ico}</div>
                <div><div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>{titre}</div><div style={{ fontSize:11,color:'#666' }}>{desc}</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* Produits vedette */}
        {vedette.length>0&&<div style={{ maxWidth:1300,margin:'0 auto',padding:'72px 24px' }}>
          <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:48 }}>
            <div><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ SÉLECTION</div><h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0,lineHeight:1.1 }}>Nos coups de cœur</h2></div>
            <button onClick={()=>naviguer('catalogue')} style={{ background:'none',border:`1px solid ${BORD}`,borderRadius:8,padding:'10px 20px',color:cp,fontSize:13,fontWeight:600,cursor:'pointer',display:isMobile?'none':'block' }}>Voir tout →</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${Math.min(4,vedette.length)},1fr)`,gap:isMobile?12:20 }}>
            {vedette.map(p=><CarteProduit key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={cfg.afficherWishlist?()=>toggleWishlist(p.id):undefined} inWishlist={wishlist.includes(p.id)}/>)}
          </div>
        </div>}

        {/* Catégories */}
        {categories.length>0&&<div style={{ background:SURF,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}`,padding:'72px 24px' }}>
          <div style={{ maxWidth:1300,margin:'0 auto' }}>
            <div style={{ textAlign:'center',marginBottom:48 }}><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ UNIVERS</div><h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0 }}>Nos catégories</h2></div>
            <div style={{ display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center' }}>
              {categories.map(cat=>(
                <button key={cat} onClick={()=>{ setFiltreCat(cat); naviguer('catalogue'); }} style={{ padding:'12px 28px',background:NOIR,border:`1px solid ${BORD}`,borderRadius:50,fontSize:14,fontWeight:600,color:'#ccc',cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.04em' }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=cp;(e.currentTarget as HTMLButtonElement).style.color='#000';}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=NOIR;(e.currentTarget as HTMLButtonElement).style.color='#ccc';}}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>}

        {/* Témoignages */}
        <div style={{ maxWidth:1300,margin:'0 auto',padding:'72px 24px' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ TÉMOIGNAGES</div><h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0 }}>Ce que disent nos clients</h2></div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
            {[{ texte:"Qualité exceptionnelle, livraison ultra rapide. Je suis cliente fidèle depuis 2 ans !",auteur:'Marie L.',ville:'Montréal',note:5 },{ texte:"Service client impeccable. Mes articles arrivent toujours parfaitement emballés.",auteur:'Jean-Pierre M.',ville:'Québec',note:5 },{ texte:"Des produits haut de gamme à des prix justes. Ma boutique préférée!",auteur:'Sophie R.',ville:'Laval',note:5 }].map((t,i)=>(
              <div key={i} style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:16,padding:28 }}>
                <Etoiles note={t.note} taille={16}/>
                <p style={{ fontSize:15,color:'#ccc',lineHeight:1.7,margin:'16px 0 20px',fontStyle:'italic' }}>"{t.texte}"</p>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:40,height:40,borderRadius:'50%',background:`${cp}20`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:cp }}>{t.auteur[0]}</div>
                  <div><div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{t.auteur}</div><div style={{ fontSize:12,color:'#666' }}>{t.ville}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infolettre */}
        <div style={{ background:`linear-gradient(135deg,${SURF},${NOIR})`,borderTop:`1px solid ${BORD}`,padding:'72px 24px' }}>
          <div style={{ maxWidth:560,margin:'0 auto',textAlign:'center' }}>
            <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ EXCLUSIVITÉS</div>
            <h2 style={{ fontSize:isMobile?28:36,fontWeight:900,color:'#fff',marginBottom:12 }}>Restez dans la boucle</h2>
            <p style={{ fontSize:15,color:'#888',marginBottom:32,lineHeight:1.6 }}>Offres exclusives, nouvelles collections et avant-premières réservées à nos abonnés.</p>
            <div style={{ display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center' }}>
              <input type="email" placeholder="votre@courriel.com" style={{ flex:1,minWidth:220,padding:'14px 20px',background:SURF,border:`1px solid ${BORD}`,borderRadius:10,fontSize:14,color:'#fff',outline:'none' }}/>
              <button style={{ ...styleBtn,padding:'14px 24px',fontSize:14,flexShrink:0 }}>S'inscrire →</button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const PageCatalogue = () => {
    const [filtresPanneau,setFiltresPanneau] = useState(!isMobile);
    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ marginBottom:32 }}><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ CATALOGUE</div><h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0 }}>Tous nos produits</h1></div>
        <div style={{ display:'flex',gap:12,marginBottom:24,alignItems:'center',flexWrap:'wrap' }}>
          <div style={{ flex:1,minWidth:200,position:'relative' }}>
            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#555',fontSize:14 }}>🔍</span>
            <input type="text" placeholder="Rechercher..." value={filtreRecherche} onChange={e=>setFiltreRecherche(e.target.value)} style={{ ...styleInput,paddingLeft:40,fontSize:13 }}/>
          </div>
          <select value={tri} onChange={e=>setTri(e.target.value as any)} style={{ padding:'12px 16px',background:SURF,border:`1px solid #333`,borderRadius:10,fontSize:13,color:'#fff',cursor:'pointer',outline:'none' }}>
            <option value="recent">Plus récents</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option><option value="note">Mieux notés</option>
          </select>
          <div style={{ display:'flex',border:`1px solid #333`,borderRadius:10,overflow:'hidden' }}>
            {(['grille','liste'] as const).map(v=><button key={v} onClick={()=>setVueCatalogue(v)} style={{ padding:'10px 14px',background:vueCatalogue===v?SURF2:'transparent',border:'none',color:vueCatalogue===v?cp:'#666',cursor:'pointer',fontSize:16 }}>{v==='grille'?'⊞':'≡'}</button>)}
          </div>
          {vueCatalogue==='grille'&&!isMobile&&<div style={{ display:'flex',border:`1px solid #333`,borderRadius:10,overflow:'hidden' }}>
            {[2,3,4].map(n=><button key={n} onClick={()=>setColonnes(n)} style={{ padding:'10px 14px',background:colonnes===n?SURF2:'transparent',border:'none',color:colonnes===n?cp:'#666',cursor:'pointer',fontSize:12,fontWeight:700 }}>{n}</button>)}
          </div>}
          <button onClick={()=>setFiltresPanneau(!filtresPanneau)} style={{ padding:'12px 16px',background:filtresPanneau?`${cp}20`:SURF,border:`1px solid ${filtresPanneau?cp:'#333'}`,borderRadius:10,color:filtresPanneau?cp:'#888',fontSize:13,cursor:'pointer',fontWeight:600 }}>⚡ Filtres</button>
        </div>
        <div style={{ display:'flex',gap:24,alignItems:'flex-start' }}>
          {filtresPanneau&&<div style={{ width:240,flexShrink:0,background:SURF,border:`1px solid #222`,borderRadius:14,padding:20,position:'sticky',top:90,maxHeight:'calc(100vh - 110px)',overflowY:'auto' }}>
            <h3 style={{ fontSize:11,fontWeight:700,color:cp,textTransform:'uppercase',letterSpacing:'0.15em',margin:'0 0 16px' }}>Catégories</h3>
            <div style={{ marginBottom:24 }}>
              <button onClick={()=>setFiltreCat('')} style={{ display:'block',width:'100%',textAlign:'left',padding:'8px 12px',background:!filtreCat?`${cp}20`:'none',border:'none',borderRadius:7,color:!filtreCat?cp:'#888',fontSize:13,cursor:'pointer',marginBottom:4 }}>Tous</button>
              {categories.map(cat=><button key={cat} onClick={()=>setFiltreCat(cat)} style={{ display:'block',width:'100%',textAlign:'left',padding:'8px 12px',background:filtreCat===cat?`${cp}20`:'none',border:'none',borderRadius:7,color:filtreCat===cat?cp:'#888',fontSize:13,cursor:'pointer',marginBottom:4 }}>{cat} <span style={{ color:'#444',fontSize:11 }}>({produits.filter(p=>p.categorie===cat).length})</span></button>)}
            </div>
            <h3 style={{ fontSize:11,fontWeight:700,color:cp,textTransform:'uppercase',letterSpacing:'0.15em',margin:'0 0 16px' }}>Prix</h3>
            <div style={{ display:'flex',gap:8,marginBottom:24 }}>
              <input type="number" placeholder="Min $" value={filtrePrixMin} onChange={e=>setFiltrePrixMin(e.target.value)} style={{ ...styleInput,padding:'8px 12px',fontSize:12,flex:1 }}/>
              <input type="number" placeholder="Max $" value={filtrePrixMax} onChange={e=>setFiltrePrixMax(e.target.value)} style={{ ...styleInput,padding:'8px 12px',fontSize:12,flex:1 }}/>
            </div>
            {(filtreCat||filtreRecherche||filtrePrixMin||filtrePrixMax)&&<button onClick={()=>{setFiltreCat('');setFiltreRecherche('');setFiltrePrixMin('');setFiltrePrixMax('');}} style={{ width:'100%',padding:'10px',background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,color:'#ef4444',fontSize:13,cursor:'pointer',fontWeight:600 }}>✕ Effacer</button>}
          </div>}
          <div style={{ flex:1 }}>
            <div style={{ marginBottom:16,fontSize:13,color:'#666' }}><strong style={{ color:'#fff' }}>{produitsFiltres.length}</strong> produit{produitsFiltres.length>1?'s':''}</div>
            {produitsFiltres.length===0 ? <div style={{ textAlign:'center',padding:'80px 0',color:'#555' }}><div style={{ fontSize:56,marginBottom:16 }}>🔍</div><h3 style={{ color:'#777',fontWeight:600,marginBottom:8 }}>Aucun produit</h3><p>Modifiez vos filtres</p></div>
            : vueCatalogue==='grille'
              ? <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${colonnes},1fr)`,gap:isMobile?12:20 }}>{produitsFiltres.map(p=><CarteProduit key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={cfg.afficherWishlist?()=>toggleWishlist(p.id):undefined} inWishlist={wishlist.includes(p.id)}/>)}</div>
              : <div style={{ display:'flex',flexDirection:'column',gap:12 }}>{produitsFiltres.map(p=><CarteProduit key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} vue="liste" onWishlist={cfg.afficherWishlist?()=>toggleWishlist(p.id):undefined} inWishlist={wishlist.includes(p.id)}/>)}</div>}
          </div>
        </div>
      </div>
    );
  };

  const PageProduit = () => {
    const [nbVues] = useState(Math.floor(Math.random()*20)+3);
    if (!produitActif) return null;
    const p = produitActif;
    const enPromo = p.prix_promo && p.prix_promo < p.prix;
    const photos = [p.photo_principale,...(p.photos||[])].filter(Boolean) as string[];
    const similaires = produits.filter(pr=>pr.id!==p.id&&pr.categorie===p.categorie).slice(0,4);

    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ display:'flex',gap:8,alignItems:'center',fontSize:12,color:'#555',marginBottom:32 }}>
          <button onClick={()=>naviguer('accueil')} style={{ background:'none',border:'none',color:cp,cursor:'pointer',fontSize:12 }}>Accueil</button>
          <span>›</span><button onClick={()=>naviguer('catalogue')} style={{ background:'none',border:'none',color:cp,cursor:'pointer',fontSize:12 }}>Catalogue</button>
          {p.categorie&&<><span>›</span><button onClick={()=>{setFiltreCat(p.categorie!);naviguer('catalogue');}} style={{ background:'none',border:'none',color:cp,cursor:'pointer',fontSize:12 }}>{p.categorie}</button></>}
          <span>›</span><span style={{ color:'#888' }}>{p.titre}</span>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:56,alignItems:'flex-start' }}>
          {/* Galerie avec zoom */}
          <div>
            <div style={{ position:'relative',borderRadius:16,overflow:'hidden',background:SURF,aspectRatio:'1',marginBottom:12,cursor:zoomActif?'zoom-out':'zoom-in' }}
              onClick={()=>setZoomActif(!zoomActif)}
              onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();setSourisPos({x:((e.clientX-r.left)/r.width)*100,y:((e.clientY-r.top)/r.height)*100});}}>
              {photos.length>0
                ? <img src={photos[photoIdx]} alt={p.titre} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.3s ease',transform:zoomActif?`scale(2) translate(${50-sourisPos.x}%,${50-sourisPos.y}%)`:'scale(1)',transformOrigin:`${sourisPos.x}% ${sourisPos.y}%` }}/>
                : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,color:'#333' }}>📦</div>}
              {enPromo&&<span style={{ position:'absolute',top:16,left:16,background:'#ef4444',color:'#fff',fontSize:12,fontWeight:800,padding:'4px 12px',borderRadius:8 }}>SOLDE -{Math.round((1-p.prix_promo!/p.prix)*100)}%</span>}
              {cfg.afficherWishlist&&<button onClick={e=>{e.stopPropagation();toggleWishlist(p.id);}} style={{ position:'absolute',top:16,right:16,width:40,height:40,borderRadius:'50%',background:'rgba(0,0,0,0.6)',border:`1px solid ${wishlist.includes(p.id)?'#ef4444':'#444'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,backdropFilter:'blur(4px)' }}>{wishlist.includes(p.id)?'❤️':'🤍'}</button>}
              <div style={{ position:'absolute',bottom:12,right:12,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',borderRadius:6,padding:'4px 10px',fontSize:11,color:'#aaa' }}>{zoomActif?'🔍 Cliquer pour dézoomer':'🔍 Cliquer pour zoomer'}</div>
            </div>
            {photos.length>1&&<div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {photos.map((ph,i)=><div key={i} onClick={()=>{setPhotoIdx(i);setZoomActif(false);}} style={{ width:68,height:68,borderRadius:8,overflow:'hidden',cursor:'pointer',border:`2px solid ${photoIdx===i?cp:'#333'}`,transition:'border-color 0.2s' }}><img src={ph} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/></div>)}
            </div>}
          </div>

          {/* Infos */}
          <div>
            {p.categorie&&<div style={{ fontSize:10,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:8 }}>{p.categorie}</div>}
            {p.marque&&<div style={{ fontSize:11,color:'#666',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.1em' }}>{p.marque}</div>}
            <h1 style={{ fontSize:isMobile?24:32,fontWeight:900,color:'#fff',marginBottom:16,lineHeight:1.15 }}>{p.titre}</h1>
            {p.note_moyenne&&<div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}><Etoiles note={p.note_moyenne} taille={16}/><span style={{ fontSize:13,color:'#888' }}>{p.note_moyenne.toFixed(1)} ({p.nb_avis} avis)</span><button onClick={()=>setOngletProduit('avis')} style={{ background:'none',border:'none',color:cp,fontSize:12,cursor:'pointer',textDecoration:'underline' }}>Voir les avis</button></div>}

            <div style={{ display:'flex',alignItems:'baseline',gap:12,marginBottom:24 }}>
              {enPromo ? (<><span style={{ fontSize:36,fontWeight:900,color:'#ef4444' }}>{px(p.prix_promo!)}</span><span style={{ fontSize:20,color:'#555',textDecoration:'line-through' }}>{px(p.prix)}</span></>) : <span style={{ fontSize:36,fontWeight:900,color:cp }}>{px(p.prix)}</span>}
            </div>

            <div style={{ display:'flex',gap:16,marginBottom:20,flexWrap:'wrap' }}>
              {p.stock!==undefined&&<span style={{ fontSize:12,fontWeight:600,color:p.stock>5?'#4ade80':p.stock>0?'#f59e0b':'#ef4444' }}>{p.stock>5?'✅ En stock':p.stock>0?`⚠️ Plus que ${p.stock} !`:'❌ Épuisé'}</span>}
              {cfg.afficherNbVues&&<span style={{ fontSize:12,color:'#555' }}>👁 {nbVues} personnes regardent</span>}
              {p.sku&&<span style={{ fontSize:11,color:'#555' }}>SKU: {p.sku}</span>}
            </div>

            {p.variantes&&p.variantes.map(v=>(
              <div key={v.nom} style={{ marginBottom:18 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8 }}>{v.nom}</div>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  {v.valeurs.map(val=><button key={val} onClick={()=>setVarianteChoisie(prev=>({...prev,[v.nom]:val}))} style={{ padding:'8px 18px',borderRadius:8,border:`2px solid ${varianteChoisie[v.nom]===val?cp:'#333'}`,background:varianteChoisie[v.nom]===val?`${cp}20`:'transparent',color:varianteChoisie[v.nom]===val?cp:'#888',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.15s' }}>{val}</button>)}
                </div>
              </div>
            ))}

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8 }}>Quantité</div>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <button onClick={()=>setQteChoisie(q=>Math.max(1,q-1))} style={{ width:42,height:42,borderRadius:8,border:`1px solid #333`,background:SURF,color:'#fff',cursor:'pointer',fontSize:18,fontWeight:700 }}>−</button>
                <span style={{ fontSize:18,fontWeight:700,color:'#fff',minWidth:32,textAlign:'center' }}>{qteChoisie}</span>
                <button onClick={()=>setQteChoisie(q=>p.stock!==undefined?Math.min(p.stock,q+1):q+1)} style={{ width:42,height:42,borderRadius:8,border:`1px solid #333`,background:SURF,color:'#fff',cursor:'pointer',fontSize:18,fontWeight:700,opacity:p.stock!==undefined&&qteChoisie>=p.stock?0.4:1 }}>+</button>
              </div>
            </div>

            <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap' }}>
              <button onClick={()=>ajouterAuPanier(p)} disabled={p.stock===0} style={{ flex:1,...styleBtn,padding:'16px 24px',fontSize:15,opacity:p.stock===0?0.5:1,cursor:p.stock===0?'not-allowed':'pointer' }}>{p.stock===0?'ÉPUISÉ':'🛒 AJOUTER AU PANIER'}</button>
              {cfg.afficherWishlist&&<button onClick={()=>toggleWishlist(p.id)} style={{ width:50,height:50,borderRadius:10,border:`1px solid ${wishlist.includes(p.id)?'#ef4444':'#333'}`,background:wishlist.includes(p.id)?'rgba(239,68,68,0.15)':SURF,color:wishlist.includes(p.id)?'#ef4444':'#888',cursor:'pointer',fontSize:20,flexShrink:0 }}>{wishlist.includes(p.id)?'❤️':'🤍'}</button>}
            </div>

            <div style={{ background:SURF,border:`1px solid #222`,borderRadius:12,padding:'14px 16px',marginBottom:24 }}>
              {[['🚚','Livraison 2-5 jours'],['🔒','Paiement sécurisé Stripe'],['🔄','Retour sous 30 jours']].map(([ico,txt])=>(
                <div key={txt as string} style={{ display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid #1a1a1a',fontSize:13,color:'#888' }}><span>{ico}</span><span>{txt}</span></div>
              ))}
            </div>

            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <span style={{ fontSize:12,color:'#555' }}>Partager :</span>
              {[['Facebook','🔵'],['Pinterest','📌'],['X','𝕏']].map(([nom,ico])=>(
                <button key={nom as string} style={{ padding:'6px 12px',background:SURF,border:`1px solid #333`,borderRadius:6,color:'#888',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>{ico} {nom}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ marginTop:56,borderTop:`1px solid ${BORD}`,paddingTop:40 }}>
          <div style={{ display:'flex',gap:0,borderBottom:`1px solid #222`,marginBottom:32 }}>
            {([['description','Description'],['avis',`Avis (${avisActif.length})`],['livraison','Livraison']] as const).map(([id,label])=>(
              <button key={id} onClick={()=>setOngletProduit(id)} style={{ padding:'14px 24px',background:'none',border:'none',borderBottom:`2px solid ${ongletProduit===id?cp:'transparent'}`,color:ongletProduit===id?cp:'#666',fontSize:14,fontWeight:ongletProduit===id?700:500,cursor:'pointer',marginBottom:-1,transition:'all 0.2s',letterSpacing:'0.04em' }}>{label}</button>
            ))}
          </div>
          {ongletProduit==='description'&&<div style={{ maxWidth:760 }}>{p.description?<p style={{ fontSize:16,color:'#ccc',lineHeight:1.9,whiteSpace:'pre-wrap' }}>{p.description}</p>:<p style={{ color:'#555' }}>Aucune description disponible.</p>}</div>}
          {ongletProduit==='avis'&&(
            <div>
              {p.note_moyenne&&<div style={{ display:'flex',gap:32,marginBottom:40,flexWrap:'wrap' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:64,fontWeight:900,color:cp,lineHeight:1 }}>{p.note_moyenne.toFixed(1)}</div><Etoiles note={p.note_moyenne} taille={20}/><div style={{ fontSize:13,color:'#666',marginTop:8 }}>{p.nb_avis} avis</div></div></div>}
              {avisActif.length===0 ? <p style={{ color:'#555',fontStyle:'italic' }}>Aucun avis pour ce produit. Soyez le premier !</p>
              : <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                  {avisActif.map((avis,i)=>(
                    <div key={i} style={{ background:SURF,border:`1px solid #222`,borderRadius:12,padding:'20px 24px' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <div style={{ width:36,height:36,borderRadius:'50%',background:`${cp}20`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:cp }}>{(avis.prenom||'?')[0]}</div>
                          <div><div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{avis.prenom} {avis.nom}</div><Etoiles note={avis.note} taille={13}/></div>
                        </div>
                        <span style={{ fontSize:12,color:'#555' }}>{new Date(avis.date_avis).toLocaleDateString('fr-CA')}</span>
                      </div>
                      <p style={{ fontSize:14,color:'#aaa',lineHeight:1.7,margin:0 }}>{avis.commentaire}</p>
                    </div>
                  ))}
                </div>}
            </div>
          )}
          {ongletProduit==='livraison'&&(
            <div style={{ maxWidth:560 }}>
              {[['🚚','Livraison standard','2-5 jours ouvrables','Gratuite dès 100$'],['⚡','Livraison express','1-2 jours ouvrables','Disponible au checkout'],['🔄','Retours','Sous 30 jours','Articles non utilisés dans emballage original']].map(([ico,titre,delai,info])=>(
                <div key={titre as string} style={{ display:'flex',gap:16,padding:'18px 0',borderBottom:`1px solid #1a1a1a` }}>
                  <div style={{ width:44,height:44,borderRadius:10,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{ico}</div>
                  <div><div style={{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:4 }}>{titre}</div><div style={{ fontSize:13,color:cp,marginBottom:4 }}>{delai}</div><div style={{ fontSize:12,color:'#666' }}>{info}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Similaires */}
        {similaires.length>0&&<div style={{ marginTop:72,paddingTop:48,borderTop:`1px solid ${BORD}` }}>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ VOUS AIMEREZ AUSSI</div>
          <h2 style={{ fontSize:isMobile?24:32,fontWeight:900,color:'#fff',marginBottom:28 }}>Produits similaires</h2>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${Math.min(4,similaires.length)},1fr)`,gap:16 }}>
            {similaires.map(p=><CarteProduit key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={cfg.afficherWishlist?()=>toggleWishlist(p.id):undefined} inWishlist={wishlist.includes(p.id)}/>)}
          </div>
        </div>}
      </div>
    );
  };

  const PagePanier = () => (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ VOTRE PANIER</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:40 }}>{nbPanier} article{nbPanier>1?'s':''}</h1>
      {panier.length===0 ? <div style={{ textAlign:'center',padding:'80px 0' }}><div style={{ fontSize:80,marginBottom:24 }}>🛒</div><h2 style={{ color:'#666',fontWeight:600,marginBottom:12 }}>Votre panier est vide</h2><button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'14px 32px' }}>Découvrir nos produits →</button></div>
      : <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 380px',gap:32,alignItems:'flex-start' }}>
          <div>
            {cfg.afficherBarreLivraison&&<BarreLivraison total={totalPanier} seuil={cfg.seuilLivraisonGratuite} cp={cp}/>}
            {panier.map((item,i)=>(
              <div key={i} style={{ display:'flex',gap:18,padding:'20px 0',borderBottom:`1px solid #1a1a1a`,alignItems:'center' }}>
                <div style={{ width:90,height:90,borderRadius:10,background:SURF,overflow:'hidden',flexShrink:0 }}>{item.produit.photo_principale?<img src={item.produit.photo_principale} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32 }}>📦</div>}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ margin:'0 0 4px',fontSize:15,fontWeight:600,color:'#e5e5e5' }}>{item.produit.titre}</p>
                  {item.variante&&<p style={{ margin:'0 0 6px',fontSize:12,color:'#666' }}>{item.variante}</p>}
                  <p style={{ margin:0,fontSize:16,fontWeight:700,color:cp }}>{px((item.produit.prix_promo||item.produit.prix)*item.qte)}</p>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <button onClick={()=>setPanier(prev=>prev.map((it,j)=>j===i?{...it,qte:Math.max(1,it.qte-1)}:it))} style={{ width:34,height:34,borderRadius:7,border:'1px solid #333',background:SURF,color:'#fff',cursor:'pointer',fontSize:16 }}>−</button>
                  <span style={{ fontSize:15,fontWeight:700,color:'#fff',minWidth:24,textAlign:'center' }}>{item.qte}</span>
                  <button onClick={()=>setPanier(prev=>prev.map((it,j)=>j===i?{...it,qte:it.qte+1}:it))} style={{ width:34,height:34,borderRadius:7,border:'1px solid #333',background:SURF,color:'#fff',cursor:'pointer',fontSize:16 }}>+</button>
                  <button onClick={()=>setPanier(prev=>prev.filter((_,j)=>j!==i))} style={{ width:34,height:34,borderRadius:7,border:'none',background:'rgba(239,68,68,0.15)',color:'#ef4444',cursor:'pointer',fontSize:14 }}>✕</button>
                </div>
              </div>
            ))}
            <button onClick={()=>naviguer('catalogue')} style={{ marginTop:20,padding:'10px 20px',background:'none',border:`1px solid #333`,borderRadius:8,color:'#888',fontSize:13,cursor:'pointer' }}>← Continuer les achats</button>
          </div>
          <div style={{ background:SURF,border:`1px solid #222`,borderRadius:16,padding:24 }}>
            <h3 style={{ fontSize:18,fontWeight:700,color:'#fff',marginBottom:20 }}>Résumé de la commande</h3>
            <div style={{ display:'flex',gap:8,marginBottom:16 }}>
              <input value={codePromo} onChange={e=>setCodePromo(e.target.value)} placeholder="Code promo" style={{ ...styleInput,padding:'10px 14px',fontSize:13,flex:1 }}/>
              <button onClick={appliquerCode} style={{ padding:'10px 14px',background:SURF2,border:`1px solid #444`,borderRadius:8,color:'#fff',fontSize:13,cursor:'pointer',fontWeight:600,flexShrink:0 }}>OK</button>
            </div>
            {codePromoApplique&&<div style={{ marginBottom:12,fontSize:13,color:'#4ade80' }}>✅ Code appliqué</div>}
            <div style={{ borderTop:`1px solid #1a1a1a`,paddingTop:16,marginBottom:20 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:14,color:'#888' }}><span>Sous-total</span><span style={{ color:'#ccc' }}>{px(totalPanier)}</span></div>
              {codePromoApplique&&<div style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:14,color:'#4ade80' }}><span>Réduction</span><span>−{px(totalPanier-totalApresCode)}</span></div>}
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:14,color:'#888' }}><span>Livraison</span><span style={{ color:totalPanier>=cfg.seuilLivraisonGratuite?'#4ade80':'#ccc' }}>{totalPanier>=cfg.seuilLivraisonGratuite?'GRATUITE':'Calculée au checkout'}</span></div>
              <div style={{ display:'flex',justifyContent:'space-between',paddingTop:12,borderTop:`1px solid #1a1a1a`,fontSize:18,fontWeight:800 }}><span style={{ color:'#fff' }}>Total</span><span style={{ color:cp }}>{px(totalApresCode)}</span></div>
            </div>
            <button style={{ ...styleBtn,width:'100%',textAlign:'center',padding:'16px',fontSize:15 }}>Passer à la caisse →</button>
            <p style={{ textAlign:'center',fontSize:11,color:'#555',marginTop:12 }}>🔒 Paiement sécurisé SSL</p>
          </div>
        </div>}
    </div>
  );

  const PageWishlist = () => {
    const items = produits.filter(p=>wishlist.includes(p.id));
    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ LISTE D'ENVIES</div>
        <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:40 }}>{items.length} article{items.length>1?'s':''} sauvegardé{items.length>1?'s':''}</h1>
        {items.length===0 ? <div style={{ textAlign:'center',padding:'80px 0' }}><div style={{ fontSize:80,marginBottom:24 }}>🤍</div><h2 style={{ color:'#666',fontWeight:600,marginBottom:12 }}>Liste vide</h2><p style={{ color:'#555',marginBottom:24 }}>Cliquez sur ❤️ sur les produits que vous aimez.</p><button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'14px 32px' }}>Découvrir nos produits →</button></div>
        : <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:20 }}>{items.map(p=><CarteProduit key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={()=>toggleWishlist(p.id)} inWishlist={true}/>)}</div>}
      </div>
    );
  };

  const PageLogin = () => (
    <div style={{ minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px' }}>
      <div style={{ width:'100%',maxWidth:440 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ ESPACE CLIENT</div>
          <h1 style={{ fontSize:32,fontWeight:900,color:'#fff',margin:0 }}>Connexion</h1>
          <p style={{ color:'#666',marginTop:10,fontSize:14 }}>Accédez à vos commandes, wishlist et bien plus</p>
        </div>
        <div style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:16,padding:32 }}>
          <div style={{ marginBottom:20 }}><label style={{ fontSize:12,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8 }}>Courriel</label><input type="email" value={loginForm.email} onChange={e=>setLoginForm(f=>({...f,email:e.target.value}))} placeholder="votre@courriel.com" style={styleInput}/></div>
          <div style={{ marginBottom:28 }}><label style={{ fontSize:12,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8 }}>Mot de passe</label><input type="password" value={loginForm.mdp} onChange={e=>setLoginForm(f=>({...f,mdp:e.target.value}))} placeholder="••••••••" style={styleInput} onKeyDown={e=>e.key==='Enter'&&handleLogin()}/></div>
          {loginErreur&&<div style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#ef4444' }}>❌ {loginErreur}</div>}
          <button onClick={handleLogin} disabled={loginStatut==='loading'} style={{ ...styleBtn,width:'100%',textAlign:'center',padding:'16px',fontSize:15 }}>{loginStatut==='loading'?'⏳ Connexion...':'Se connecter →'}</button>
          <div style={{ textAlign:'center',marginTop:20 }}><span style={{ fontSize:13,color:'#555' }}>Pas encore de compte ? </span><button style={{ background:'none',border:'none',color:cp,fontSize:13,cursor:'pointer',fontWeight:600 }}>Créer un compte</button></div>
        </div>
      </div>
    </div>
  );

  const PageCompte = () => {
    const [section,setSection] = useState('dashboard');
    if(!acheteur){ naviguer('login'); return null; }
    const initiale=(acheteur.prenom?.[0]||acheteur.email[0]).toUpperCase();
    const sections=[['dashboard','Tableau de bord','📊'],['commandes','Mes commandes','📦'],['wishlist','Ma wishlist','❤️'],['profil','Mon profil','👤']];
    return (
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'260px 1fr',gap:28,alignItems:'flex-start' }}>
          <div style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:16,padding:24 }}>
            <div style={{ textAlign:'center',marginBottom:24,paddingBottom:24,borderBottom:`1px solid #1a1a1a` }}>
              <div style={{ width:64,height:64,borderRadius:'50%',background:`linear-gradient(135deg,${cp},${OR2})`,margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#000' }}>{initiale}</div>
              <div style={{ fontSize:16,fontWeight:700,color:'#fff' }}>{acheteur.prenom} {acheteur.nom}</div>
              <div style={{ fontSize:12,color:'#666',marginTop:4 }}>{acheteur.email}</div>
            </div>
            {sections.map(([id,label,ico])=><button key={id} onClick={()=>setSection(id)} style={{ display:'flex',alignItems:'center',gap:12,width:'100%',padding:'11px 14px',background:section===id?`${cp}15`:'none',border:'none',borderRadius:8,color:section===id?cp:'#888',fontSize:13,fontWeight:section===id?700:400,cursor:'pointer',marginBottom:4,textAlign:'left',transition:'all 0.15s' }}><span style={{ fontSize:16 }}>{ico}</span>{label}</button>)}
            <div style={{ borderTop:`1px solid #1a1a1a`,marginTop:12,paddingTop:12 }}><button onClick={handleLogout} style={{ display:'flex',alignItems:'center',gap:12,width:'100%',padding:'11px 14px',background:'rgba(239,68,68,0.1)',border:'none',borderRadius:8,color:'#ef4444',fontSize:13,fontWeight:600,cursor:'pointer' }}>🚪 Se déconnecter</button></div>
          </div>
          <div style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:16,padding:28 }}>
            {section==='dashboard'&&<>
              <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ TABLEAU DE BORD</div>
              <h2 style={{ fontSize:24,fontWeight:800,color:'#fff',marginBottom:24 }}>Bonjour, {acheteur.prenom} 👋</h2>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:14,marginBottom:28 }}>
                {[['📦','0','Commandes'],['❤️',`${wishlist.length}`,'Wishlist'],['⭐','0','Avis'],['🔔','0','Notifications']].map(([ico,nb,label])=>(
                  <div key={label as string} style={{ background:NOIR,border:`1px solid #222`,borderRadius:12,padding:'18px 16px',textAlign:'center' }}>
                    <div style={{ fontSize:28,marginBottom:8 }}>{ico}</div>
                    <div style={{ fontSize:24,fontWeight:800,color:cp,marginBottom:4 }}>{nb}</div>
                    <div style={{ fontSize:12,color:'#666' }}>{label}</div>
                  </div>
                ))}
              </div>
            </>}
            {section==='commandes'&&<><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ MES COMMANDES</div><h2 style={{ fontSize:24,fontWeight:800,color:'#fff',marginBottom:24 }}>Historique</h2><div style={{ textAlign:'center',padding:'40px 0',color:'#555' }}><div style={{ fontSize:48,marginBottom:12 }}>📦</div><p>Aucune commande.</p><button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'12px 24px',marginTop:16,fontSize:13 }}>Commencer vos achats →</button></div></>}
            {section==='wishlist'&&<><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ MA WISHLIST</div><h2 style={{ fontSize:24,fontWeight:800,color:'#fff',marginBottom:24 }}>Mes coups de cœur</h2>{wishlist.length===0?<div style={{ textAlign:'center',padding:'40px 0',color:'#555' }}><div style={{ fontSize:48,marginBottom:12 }}>🤍</div><p>Wishlist vide.</p></div>:<div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14 }}>{produits.filter(p=>wishlist.includes(p.id)).map(p=><CarteProduit key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} onWishlist={()=>toggleWishlist(p.id)} inWishlist={true}/>)}</div>}</>}
            {section==='profil'&&<><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ MON PROFIL</div><h2 style={{ fontSize:24,fontWeight:800,color:'#fff',marginBottom:24 }}>Mes informations</h2><div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:560 }}>{[['Prénom',acheteur.prenom],['Nom',acheteur.nom],['Courriel',acheteur.email],['Téléphone',acheteur.telephone||'Non renseigné']].map(([label,val])=><div key={label as string}><label style={{ fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6 }}>{label}</label><div style={{ padding:'11px 14px',background:NOIR,border:'1px solid #222',borderRadius:8,fontSize:14,color:'#ccc' }}>{val}</div></div>)}</div></>}
          </div>
        </div>
      </div>
    );
  };

  const PageBlog = () => (
    <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ BLOGUE</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:40 }}>Notre univers</h1>
      {articles.length===0 ? <div style={{ textAlign:'center',padding:'80px 0',color:'#555' }}><div style={{ fontSize:56,marginBottom:16 }}>📝</div><h3 style={{ color:'#666' }}>Aucun article</h3></div>
      : <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:24 }}>
          {articles.map(a=>(
            <div key={a.id} onClick={()=>voirArticle(a)} style={{ background:SURF,border:`1px solid #222`,borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.border=`1px solid ${BORD}`;(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.border='1px solid #222';(e.currentTarget as HTMLDivElement).style.transform='none';}}>
              <div style={{ height:200,background:NOIR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,overflow:'hidden' }}>
                {a.photo?<img src={a.photo} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:'📰'}
              </div>
              <div style={{ padding:'20px 22px' }}>
                {a.categorie&&<span style={{ fontSize:10,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em' }}>{a.categorie}</span>}
                <h2 style={{ fontSize:17,fontWeight:700,color:'#fff',margin:'8px 0 10px',lineHeight:1.3 }}>{a.titre}</h2>
                {a.resume&&<p style={{ fontSize:13,color:'#777',lineHeight:1.6,marginBottom:14 }}>{a.resume}</p>}
                <div style={{ display:'flex',gap:14,fontSize:11,color:'#555' }}>
                  {a.auteur&&<span>✍️ {a.auteur}</span>}
                  {a.date_publication&&<span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA')}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );

  const PageArticle = () => {
    if(!articleActif) return null;
    const a=articleActif;
    return (
      <div style={{ maxWidth:780,margin:'0 auto',padding:'40px 24px' }}>
        <button onClick={()=>setPage('blog')} style={{ background:'none',border:'none',color:cp,fontSize:14,cursor:'pointer',marginBottom:32,display:'flex',alignItems:'center',gap:6 }}>← Retour au blogue</button>
        {a.photo&&<img src={a.photo} alt="" style={{ width:'100%',height:360,objectFit:'cover',borderRadius:16,marginBottom:36 }}/>}
        {a.categorie&&<span style={{ fontSize:10,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em' }}>{a.categorie}</span>}
        <h1 style={{ fontSize:isMobile?26:40,fontWeight:900,color:'#fff',margin:'12px 0 20px',lineHeight:1.15 }}>{a.titre}</h1>
        <div style={{ display:'flex',gap:16,fontSize:13,color:'#555',marginBottom:36 }}>
          {a.auteur&&<span>✍️ {a.auteur}</span>}
          {a.date_publication&&<span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA',{year:'numeric',month:'long',day:'numeric'})}</span>}
        </div>
        {a.resume&&<p style={{ fontSize:17,color:'#aaa',lineHeight:1.8,marginBottom:32,fontStyle:'italic',borderLeft:`3px solid ${cp}`,paddingLeft:20 }}>{a.resume}</p>}
        <p style={{ fontSize:15,color:'#999',lineHeight:1.9 }}>Contenu disponible depuis le gestionnaire de blog.</p>
      </div>
    );
  };


  const PageAPropos = () => (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ NOTRE HISTOIRE</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:48 }}>À propos de nous</h1>

      {/* Hero à propos */}
      <div style={{ background:`linear-gradient(135deg,${SURF},${SURF2})`,border:`1px solid ${BORD}`,borderRadius:20,padding:isMobile?'32px 24px':'56px 64px',marginBottom:64,position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:`${cp}08`,border:`1px solid ${BORD}` }}/>
        <div style={{ position:'absolute',bottom:-60,left:-20,width:150,height:150,borderRadius:'50%',background:`${cp}05` }}/>
        <div style={{ position:'relative',maxWidth:640 }}>
          <div style={{ width:48,height:3,background:`linear-gradient(90deg,${cp},transparent)`,marginBottom:24,borderRadius:2 }}/>
          <p style={{ fontSize:isMobile?18:24,fontWeight:700,color:'#fff',lineHeight:1.6,margin:'0 0 20px' }}>
            Nous croyons que le luxe devrait être accessible à tous — sans compromis sur la qualité.
          </p>
          <p style={{ fontSize:15,color:'#888',lineHeight:1.9,margin:0 }}>
            {cfg.description || "Fondée avec une passion pour l'excellence, notre boutique sélectionne rigoureusement chaque produit pour vous offrir ce qu'il y a de mieux. Chaque article est testé, validé et choisi avec soin pour dépasser vos attentes."}
          </p>
        </div>
      </div>

      {/* Valeurs */}
      <div style={{ marginBottom:64 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ NOS VALEURS</div>
          <h2 style={{ fontSize:isMobile?24:36,fontWeight:900,color:'#fff',margin:0 }}>Ce qui nous définit</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
          {[
            { ico:'💎',titre:'Qualité sans compromis',desc:"Chaque produit est sélectionné selon des critères rigoureux. Nous refusons la médiocrité — chaque article que vous recevez a été validé par notre équipe." },
            { ico:'🤝',titre:'Service humain',desc:"Derrière chaque commande, il y a une personne réelle. Notre équipe est disponible pour vous accompagner à chaque étape de votre expérience d'achat." },
            { ico:'🌱',titre:'Responsabilité',desc:"Nous choisissons prioritairement des fournisseurs éthiques et des emballages éco-responsables. Notre croissance respecte les gens et la planète." },
          ].map((v,i)=>(
            <div key={i} style={{ background:SURF,border:`1px solid #222`,borderRadius:16,padding:'28px 24px',transition:'border-color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=BORD}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor='#222'}>
              <div style={{ width:52,height:52,borderRadius:14,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:18 }}>{v.ico}</div>
              <h3 style={{ fontSize:17,fontWeight:800,color:'#fff',marginBottom:12 }}>{v.titre}</h3>
              <p style={{ fontSize:14,color:'#777',lineHeight:1.8,margin:0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chiffres */}
      <div style={{ background:`linear-gradient(135deg,${SURF},${SURF2})`,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}`,padding:'48px 24px',marginBottom:64,borderRadius:16 }}>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:32,textAlign:'center' }}>
          {[['500+','Produits sélectionnés'],['4.8/5','Note moyenne'],['2 000+','Clients satisfaits'],['30 jours','Politique de retour']].map(([nb,label])=>(
            <div key={label}>
              <div style={{ fontSize:isMobile?32:44,fontWeight:900,color:cp,marginBottom:8,letterSpacing:'-0.02em' }}>{nb}</div>
              <div style={{ fontSize:13,color:'#666',fontWeight:500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Équipe */}
      <div style={{ marginBottom:64 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ L'ÉQUIPE</div>
          <h2 style={{ fontSize:isMobile?24:36,fontWeight:900,color:'#fff',margin:0 }}>Les visages derrière la boutique</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
          {[
            { prenom:'Alexandre',poste:'Fondateur & Directeur',initiale:'A',couleur:cp },
            { prenom:'Marie',poste:'Responsable des achats',initiale:'M',couleur:'#818cf8' },
            { prenom:'Sophie',poste:'Service à la clientèle',initiale:'S',couleur:'#34d399' },
          ].map((m,i)=>(
            <div key={i} style={{ background:SURF,border:`1px solid #222`,borderRadius:16,padding:'28px 24px',textAlign:'center' }}>
              <div style={{ width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${m.couleur},${m.couleur}88)`,margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:900,color:m.couleur==='#c9a96e'?'#000':'#fff',boxShadow:`0 4px 20px ${m.couleur}30` }}>{m.initiale}</div>
              <div style={{ fontSize:17,fontWeight:700,color:'#fff',marginBottom:6 }}>{m.prenom}</div>
              <div style={{ fontSize:13,color:m.couleur,fontWeight:600 }}>{m.poste}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign:'center',padding:'56px 24px',background:`linear-gradient(135deg,${SURF},${NOIR})`,borderRadius:20,border:`1px solid ${BORD}` }}>
        <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:16 }}>✦ REJOIGNEZ-NOUS</div>
        <h2 style={{ fontSize:isMobile?24:36,fontWeight:900,color:'#fff',marginBottom:14 }}>Prêt à découvrir notre sélection ?</h2>
        <p style={{ fontSize:15,color:'#888',marginBottom:32,maxWidth:480,margin:'0 auto 32px' }}>Des produits d'exception vous attendent. Commencez votre expérience premium dès aujourd'hui.</p>
        <div style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={()=>naviguer('catalogue')} style={{ background:`linear-gradient(135deg,${cp},${OR2})`,color:'#000',border:'none',borderRadius:10,padding:'14px 32px',fontSize:15,fontWeight:800,cursor:'pointer',letterSpacing:'0.05em' }}>Voir notre catalogue →</button>
          <button onClick={()=>naviguer('contact')} style={{ padding:'14px 28px',background:'none',border:`1px solid ${BORD}`,borderRadius:10,color:'rgba(255,255,255,0.7)',fontSize:15,cursor:'pointer' }}>Nous contacter</button>
        </div>
      </div>
    </div>
  );

  const PageFaq = () => {
    const faq=cfg.faq?.items||[{ question:'Quels sont vos délais de livraison ?',reponse:'Les commandes sont expédiées sous 24–48h. Livraison standard 2-5 jours.' },{ question:'Puis-je retourner un article ?',reponse:'Oui, sous 30 jours dans leur emballage original.' },{ question:'Quels modes de paiement ?',reponse:'Visa, Mastercard, American Express et Apple Pay via Stripe.' },{ question:'Comment suivre ma commande ?',reponse:'Un courriel avec numéro de suivi vous est envoyé dès expédition.' }];
    return (
      <div style={{ maxWidth:780,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ FAQ</div>
        <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:48 }}>Questions fréquentes</h1>
        {faq.map((item:any,i:number)=>(
          <div key={i} style={{ borderBottom:`1px solid #1a1a1a` }}>
            <button onClick={()=>setFaqOuvert(faqOuvert===i?null:i)} style={{ width:'100%',background:'none',border:'none',padding:'22px 0',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',gap:16,textAlign:'left' }}>
              <span style={{ fontSize:16,fontWeight:600,color:'#e5e5e5',lineHeight:1.4 }}>{item.question}</span>
              <span style={{ fontSize:22,color:cp,flexShrink:0,transition:'transform 0.2s',transform:faqOuvert===i?'rotate(45deg)':'none' }}>+</span>
            </button>
            {faqOuvert===i&&<div style={{ paddingBottom:22,fontSize:15,color:'#888',lineHeight:1.8 }}>{item.reponse}</div>}
          </div>
        ))}
      </div>
    );
  };

  const PageContact = () => (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ CONTACT</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:48 }}>Nous contacter</h1>
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:48 }}>
        <div>
          <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:24 }}>Nos coordonnées</h2>
          {[['📍','Adresse','123 rue Principale, Montréal QC'],['📞','Téléphone','514 000-0000'],['✉️','Courriel','info@boutique.ca'],['⏰','Heures','Lun-Ven 9h-17h']].map(([ico,label,val])=>(
            <div key={label as string} style={{ display:'flex',gap:14,marginBottom:20,alignItems:'flex-start' }}>
              <div style={{ width:40,height:40,borderRadius:10,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>{ico}</div>
              <div><div style={{ fontSize:12,fontWeight:700,color:'#666',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.08em' }}>{label}</div><div style={{ fontSize:14,color:'#ccc' }}>{val}</div></div>
            </div>
          ))}
        </div>
        <div>
          {contactStatut==='ok' ? <div style={{ background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:16,padding:40,textAlign:'center' }}><div style={{ fontSize:48,marginBottom:16 }}>✅</div><h3 style={{ color:'#4ade80',marginBottom:8 }}>Message envoyé !</h3><p style={{ color:'#888' }}>Nous vous répondrons sous peu.</p></div>
          : <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                <div><label style={{ fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8 }}>Nom</label><input value={contactForm.nom} onChange={e=>setContactForm(f=>({...f,nom:e.target.value}))} style={styleInput} placeholder="Votre nom"/></div>
                <div><label style={{ fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8 }}>Courriel</label><input type="email" value={contactForm.courriel} onChange={e=>setContactForm(f=>({...f,courriel:e.target.value}))} style={styleInput} placeholder="votre@email.com"/></div>
              </div>
              <div><label style={{ fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8 }}>Sujet</label><input value={contactForm.sujet} onChange={e=>setContactForm(f=>({...f,sujet:e.target.value}))} style={styleInput} placeholder="Sujet de votre message"/></div>
              <div><label style={{ fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8 }}>Message</label><textarea value={contactForm.message} onChange={e=>setContactForm(f=>({...f,message:e.target.value}))} rows={5} style={{ ...styleInput,resize:'vertical',fontFamily:'inherit' }} placeholder="Votre message..."/></div>
              {contactStatut==='err'&&<p style={{ color:'#ef4444',fontSize:13 }}>❌ Erreur. Veuillez réessayer.</p>}
              <button onClick={envoyerContact} disabled={contactStatut==='loading'||!contactForm.nom||!contactForm.courriel||!contactForm.message} style={{ ...styleBtn,padding:'16px',fontSize:15,opacity:(!contactForm.nom||!contactForm.courriel||!contactForm.message)?0.5:1,cursor:(!contactForm.nom||!contactForm.courriel||!contactForm.message)?'not-allowed':'pointer' }}>{contactStatut==='loading'?'⏳ Envoi...':'Envoyer →'}</button>
            </div>}
        </div>
      </div>
    </div>
  );

  const Footer = () => {
    const f=cfg.footer;
    const reseaux=Object.entries(f.reseaux).filter(([,v])=>v);
    const icos:Record<string,string>={ facebook:'f',instagram:'📸',tiktok:'♪',twitter:'𝕏',youtube:'▶',linkedin:'in',pinterest:'P' };
    return (
      <footer style={{ background:f.couleurFond,borderTop:`1px solid ${BORD}`,paddingTop:60 }}>
        <div style={{ maxWidth:1300,margin:'0 auto',padding:'0 24px' }}>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1.5fr 1fr 1fr 1fr',gap:40,marginBottom:48 }}>
            <div>
              <div style={{ fontSize:22,fontWeight:900,color:'#fff',marginBottom:8,letterSpacing:'0.05em' }}>{f.nomBoutique}</div>
              <div style={{ width:40,height:2,background:`linear-gradient(90deg,${cp},transparent)`,marginBottom:16 }}/>
              {f.slogan&&<p style={{ fontSize:13,color:'#555',lineHeight:1.6,marginBottom:20 }}>{f.slogan}</p>}
              {reseaux.length>0&&<div style={{ display:'flex',gap:10 }}>
                {reseaux.map(([k,url])=><a key={k} href={url as string} target="_blank" rel="noopener noreferrer" style={{ width:36,height:36,borderRadius:8,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#fff',textDecoration:'none',fontWeight:700 }}>{icos[k]||k[0].toUpperCase()}</a>)}
              </div>}
            </div>
            {['1','2','3'].map(n=>f.colonnes[`titre${n}`]?(
              <div key={n}>
                <div style={{ fontSize:11,fontWeight:700,color:cp,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:18 }}>{f.colonnes[`titre${n}`]}</div>
                {f.colonnes[`liens${n}`].split('\n').filter(Boolean).map((l:string,i:number)=>(
                  <div key={i} style={{ marginBottom:10 }}><button onClick={()=>naviguer(l.toLowerCase())} style={{ background:'none',border:'none',color:'#555',fontSize:13,cursor:'pointer',padding:0,textAlign:'left' }} onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color=cp} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='#555'}>{l}</button></div>
                ))}
              </div>
            ):null)}
          </div>
          <div style={{ borderTop:`1px solid rgba(201,169,110,0.1)`,padding:'20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
            <div style={{ fontSize:12,color:'#333' }}>© {new Date().getFullYear()} {f.nomBoutique}. Tous droits réservés.</div>
            <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
              {f.politiques.afficherConditions&&<button onClick={()=>naviguer('conditions')} style={{ background:'none',border:'none',color:'#444',fontSize:11,cursor:'pointer' }}>Conditions</button>}
              {f.politiques.afficherConfidentialite&&<button onClick={()=>naviguer('confidentialite')} style={{ background:'none',border:'none',color:'#444',fontSize:11,cursor:'pointer' }}>Confidentialité</button>}
              {f.politiques.afficherRetours&&<button onClick={()=>naviguer('retours')} style={{ background:'none',border:'none',color:'#444',fontSize:11,cursor:'pointer' }}>Retours</button>}
            </div>
            {f.afficherPropulse&&<a href="https://e-vend.ca" target="_blank" rel="noopener noreferrer" style={{ fontSize:10,color:'#2a2a2a',textDecoration:'none' }}>Propulsé par e-Vend Studio</a>}
          </div>
        </div>
      </footer>
    );
  };

  const PopupPromo = () => (
    <>
      <div onClick={()=>setPopupPromo(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:1000,backdropFilter:'blur(6px)' }}/>
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:1001,background:SURF,border:`1px solid ${BORD}`,borderRadius:20,width:'90%',maxWidth:440,overflow:'hidden',boxShadow:`0 32px 80px rgba(0,0,0,0.6)` }}>
        <div style={{ padding:'36px 32px',textAlign:'center',position:'relative' }}>
          <div style={{ fontSize:48,marginBottom:16 }}>🎁</div>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:12 }}>OFFRE EXCLUSIVE</div>
          <h2 style={{ fontSize:26,fontWeight:900,color:'#fff',margin:'0 0 12px',lineHeight:1.2 }}>{cfg.popupPromoTexte}</h2>
          <div style={{ display:'inline-block',background:`${cp}20`,border:`1px solid ${BORD}`,borderRadius:10,padding:'12px 24px',marginBottom:20 }}>
            <span style={{ fontSize:22,fontWeight:900,color:cp,letterSpacing:'0.1em' }}>{cfg.popupPromoCode}</span>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>{naviguer('catalogue');setPopupPromo(false);}} style={{ flex:1,background:`linear-gradient(135deg,${cp},${OR2})`,color:'#000',border:'none',borderRadius:10,padding:'14px',fontSize:14,fontWeight:800,cursor:'pointer' }}>Profiter de l'offre →</button>
            <button onClick={()=>setPopupPromo(false)} style={{ padding:'14px 16px',background:'none',border:`1px solid #333`,borderRadius:10,color:'#666',cursor:'pointer',fontSize:13,flexShrink:0 }}>Plus tard</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif",background:cfg.couleurFond,color:cfg.couleurTexte,minHeight:'100vh',display:'flex',flexDirection:'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}button{font-family:inherit;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:${NOIR};}::-webkit-scrollbar-thumb{background:${BORD};border-radius:3px;}`}</style>

      {cfg.afficherTicker&&<Ticker texte={cfg.tickerTexte} couleur={cp}/>}
      <Nav/>
      <TiroirPanier/>
      {popupPromo&&<PopupPromo/>}
      {cfg.afficherNotifVente&&page==='accueil'&&<NotifVente cp={cp}/>}

      <main style={{ flex:1 }}>
        {page==='accueil'   && <PageAccueil/>}
        {page==='catalogue' && <PageCatalogue/>}
        {page==='produit'   && <PageProduit/>}
        {page==='blog'      && <PageBlog/>}
        {page==='article'   && <PageArticle/>}
        {page==='faq'       && <PageFaq/>}
        {page==='a-propos'   && <PageAPropos/>}
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