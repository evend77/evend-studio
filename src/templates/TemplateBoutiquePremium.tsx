// src/templates/TemplateBoutiquePremium.tsx
// e-Vend Studio — Template Boutique Premium
// Style sombre luxueux avec accents dorés — le vrai Shopify killer
// Pages : Accueil · Catalogue · Fiche produit · Blog · FAQ · Contact · Panier · Wishlist · Compte acheteur
// 100% mobile responsive

import { useState, useEffect, useCallback, useRef } from 'react';
import AppAcheteurBoutique from '../AppAcheteurBoutique';
import FaireOffreBoutique from '../pages/boutique/FaireOffreBoutique';   // add-on « Faire une offre » : bloc de la fiche produit
import BlocEnchereBoutique from '../pages/boutique/BlocEnchereBoutique';   // add-on « Enchères » : bloc de la fiche produit
import QuestionsProduitBoutique from '../pages/boutique/QuestionsProduitBoutique';   // add-on « Questions sur le produit » : bloc de la fiche produit
import OffreCompteur from './multivendeur/MVOffre';   // add-on « Offres du jour » : compte à rebours (heure du serveur)
import { BoutiqueSouhaitBouton, BoutiqueSouhaitCarte, BoutiqueSouhaitProduit, BoutiqueSouhaitsAcces, BoutiqueFavorisToast, useCarteSuperposition } from '../components/BoutiqueFavoris';   // add-on « Favoris » : cœurs, icône d'en-tête, notifications
import { ba, ajouterAuPanier as ajouterAuPanierServeur, messageAcheteur, PROVINCES } from '../pages/boutique/boutiqueAcheteurApi';

const OR    = '#c9a96e';
const OR2   = '#e8c87a';
const NOIR  = '#0a0a0a';
const NOIR2 = '#111111';
const SURF  = '#1e1e1e';
const SURF2 = '#252525';
const BORD  = 'rgba(201,169,110,0.2)';
const API_BASE = '/api';

interface Produit {
  id: number; titre: string; prix: number; prix_promo?: number|null;
  offre_fin?: string|null;   // add-on « Offres du jour » : fin de l'offre en cours (le serveur n'envoie rien si l'add-on est inactif)
  photo_principale?: string; photos?: string[]; description?: string;
  stock?: number; categorie?: string; sku?: string; marque?: string;
  note_moyenne?: number; nb_avis?: number;
  variantes?: { nom: string; valeurs: string[] }[];
  enchere?: { fin:string; mise:number; nb_mises:number; decalage?:number }|null;   // add-on « Enchères » : enchère en cours sur ce produit (null/absent sinon)
}

interface ArticleBlog {
  id: number; titre: string; slug: string; resume?: string;
  photo?: string; auteur?: string; date_publication?: string; categorie?: string;
  contenu?: string; tags?: string[]; vues?: number;   // contenu : seulement quand l'article est ouvert (la liste est légère)
}

interface Avis {
  id: number; note: number; commentaire: string;
  prenom?: string; nom?: string; date_avis: string;
}

interface AcheteurUser {
  id: number; prenom: string; nom: string; email: string;
  telephone?: string; adresse?: string; ville?: string; province?: string; code_postal?: string;
}

interface Props { config: any; siteId?: number; vendeurId: number; }

const px = (n: number) => Number(n || 0).toFixed(2).replace('.', ',') + ' $';

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

// Exemples de démonstration de la page À propos : affichés tant que le gestionnaire n'a rien saisi (Config Mes pages → À propos)
const APROPOS_DEMO = {
  accroche: 'Nous croyons que le luxe devrait être accessible à tous — sans compromis sur la qualité.',
  description: "Fondée avec une passion pour l'excellence, notre boutique sélectionne rigoureusement chaque produit pour vous offrir ce qu'il y a de mieux. Chaque article est testé, validé et choisi avec soin pour dépasser vos attentes.",
  valeurs: [
    { ico:'💎', titre:'Qualité sans compromis', desc:'Chaque produit est sélectionné selon des critères rigoureux. Nous refusons la médiocrité — chaque article que vous recevez a été validé par notre équipe.' },
    { ico:'🤝', titre:'Service humain', desc:"Derrière chaque commande, il y a une personne réelle. Notre équipe est disponible pour vous accompagner à chaque étape de votre expérience d'achat." },
    { ico:'🌱', titre:'Responsabilité', desc:'Nous choisissons prioritairement des fournisseurs éthiques et des emballages éco-responsables. Notre croissance respecte les gens et la planète.' },
  ],
  chiffres: [{ nb:'500+', label:'Produits sélectionnés' }, { nb:'4.8/5', label:'Note moyenne' }, { nb:'2 000+', label:'Clients satisfaits' }, { nb:'30 jours', label:'Politique de retour' }],
  equipe: [{ prenom:'Alexandre', poste:'Fondateur & Directeur', photo:'' }, { prenom:'Marie', poste:'Responsable des achats', photo:'' }, { prenom:'Sophie', poste:'Service à la clientèle', photo:'' }],
};

// Exemples de démonstration (accueil, fiche produit, contact) : affichés tant que le gestionnaire n'a rien saisi dans Config Mes pages
const DEMO = {
  avantages: [{ ico:'🚚', titre:'Livraison Premium', desc:'Offerte dès 100$' },{ ico:'🔒', titre:'Paiement Sécurisé', desc:'SSL & Stripe' },{ ico:'💎', titre:'Qualité Garantie', desc:'Sélection rigoureuse' },{ ico:'🔄', titre:'Retour 30 Jours', desc:'Sans questions' }],
  temoignages: [
    { texte:"Qualité exceptionnelle, livraison ultra rapide. Je suis cliente fidèle depuis 2 ans !", auteur:'Marie L.', ville:'Montréal', note:5 },
    { texte:"Service client impeccable. Mes articles arrivent toujours parfaitement emballés.", auteur:'Jean-Pierre M.', ville:'Québec', note:5 },
    { texte:"Des produits haut de gamme à des prix justes. Ma boutique préférée!", auteur:'Sophie R.', ville:'Laval', note:5 },
  ],
  reassurance: [{ ico:'🚚', texte:'Livraison 2-5 jours' },{ ico:'🔒', texte:'Paiement sécurisé Stripe' },{ ico:'🔄', texte:'Retour sous 30 jours' }],
  livraisonInfos: [
    { ico:'🚚', titre:'Livraison standard', delai:'2-5 jours ouvrables', info:'Gratuite dès 100$' },
    { ico:'⚡', titre:'Livraison express', delai:'1-2 jours ouvrables', info:'Disponible au checkout' },
    { ico:'🔄', titre:'Retours', delai:'Sous 30 jours', info:'Articles non utilisés dans emballage original' },
  ],
  contact: [{ ico:'📍', label:'Adresse', val:'123 rue Principale, Montréal QC' },{ ico:'📞', label:'Téléphone', val:'514 000-0000' },{ ico:'✉️', label:'Courriel', val:'info@boutique.ca' },{ ico:'⏰', label:'Heures', val:'Lun-Ven 9h-17h' }],
};

const CFG_DEF = {
  nomBoutique: 'Ma Boutique Premium', slogan: "L'excellence à votre portée",
  couleurAccent: OR, couleurFond: NOIR, couleurTexte: '#ffffff',
  afficherTicker: true, tickerTexte: '✦ LIVRAISON GRATUITE dès 100$ ✦ RETOUR 30 JOURS ✦ PAIEMENT SÉCURISÉ ✦',
 
  afficherBarreLivraison: true, seuilLivraisonGratuite: 100,
  afficherNotifVente: true, afficherNbVues: true, afficherAvis: true,
  logoUrl: '',
  footer: {
    nomBoutique: 'Ma Boutique Premium', slogan: "L'excellence à votre portée",
    couleurFond: '#050505', couleurTexte: '#ffffff',
    reseaux: { facebook:'', instagram:'', tiktok:'', twitter:'', youtube:'', linkedin:'', pinterest:'' },
    colonnes: { titre1:'Boutique', liens1:'Accueil\nCatalogue\nBlog\nFAQ', titre2:'Aide', liens2:'Contact', titre3:'Légal', liens3:'' },
    politiques: { afficherConditions:true, afficherConfidentialite:true, afficherRetours:true, afficherLivraison:true, afficherMentions:true, afficherCoordonnees:true },
    afficherPropulse: true,
  },
};

// ── Politiques légales du site : les 6 politiques fixes que le gestionnaire rédige (Configuration → Mes politiques) ──
const POLITIQUES_SLUGS = ['retour-remboursement','confidentialite','conditions-service','expedition','coordonnees','mentions-legales'];
const sansAccent = (t:string)=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
// Reconnaît un lien de pied de page (ou un slug) qui désigne une politique : retourne son slug, sinon ''
// Add-on « Enchères » : temps restant d'une carte de la page « Enchères » (heure du serveur, mise à jour chaque seconde)
function ResteEnchere({ fin, decalage, couleur }: { fin:string; decalage:number; couleur:string }) {
  const [t,setT]=useState(()=>Date.now());
  useEffect(()=>{ const i=setInterval(()=>setT(Date.now()),1000); return ()=>clearInterval(i); },[]);
  const ms=new Date(fin).getTime()-(t+decalage);
  if(ms<=0) return <span style={{ color:'#888' }}>Terminée</span>;
  const s=Math.floor(ms/1000), j=Math.floor(s/86400), h=Math.floor((s%86400)/3600), m=Math.floor((s%3600)/60), sec=s%60;
  const txt=j>0?`${j} j ${h} h ${m} min`:h>0?`${h} h ${String(m).padStart(2,'0')} min`:`${m} min ${String(sec).padStart(2,'0')} s`;
  return <span style={{ color:ms<300000?'#f87171':couleur,fontWeight:800 }}>⏱ {txt}</span>;
}
function slugPolitique(dest:string):string {
  const d=sansAccent(dest).replace(/[-_]+/g,' ');
  const t:Record<string,string>={ 'conditions':'conditions-service','conditions de service':'conditions-service','conditions service':'conditions-service','termes':'conditions-service','termes et conditions':'conditions-service',
    'confidentialite':'confidentialite','politique de confidentialite':'confidentialite','vie privee':'confidentialite',
    'retours':'retour-remboursement','retour':'retour-remboursement','remboursement':'retour-remboursement','remboursements':'retour-remboursement','retour et remboursement':'retour-remboursement','retours et remboursements':'retour-remboursement','retour remboursement':'retour-remboursement',
    'livraison':'expedition','expedition':'expedition','livraison et expedition':'expedition',
    'coordonnees':'coordonnees','mentions legales':'mentions-legales' };
  return t[d]||'';
}
// Nettoie le HTML d'une politique avant l'affichage (le serveur le nettoie déjà à l'enregistrement) : retire scripts, cadres, formulaires, gestionnaires d'événements et liens javascript:
function htmlSur(h:string):string {
  try {
    const doc=new DOMParser().parseFromString('<div id="r">'+h+'</div>','text/html'); const racine=doc.getElementById('r'); if(!racine) return '';
    racine.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base,svg,math').forEach(e=>e.remove());
    racine.querySelectorAll('*').forEach(e=>{
      Array.from(e.attributes).forEach(a=>{ const n=a.name.toLowerCase(), v=a.value.replace(/[\s\u0000-\u001f]/g,'').toLowerCase();
        if(n.startsWith('on')||n==='style'||((n==='href'||n==='src'||n==='xlink:href'||n==='action')&&!/^(https?:|mailto:|tel:|#|\/)/.test(v))) e.removeAttribute(a.name); });
      if(e.tagName==='A'){ e.setAttribute('target','_blank'); e.setAttribute('rel','noopener noreferrer'); }
    });
    return racine.innerHTML;
  } catch { return ''; }
}

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

// Add-on « Enchères » : compte à rebours d'une carte du catalogue (heure du serveur, pas celle de l'appareil)
function CompteurEnchere({ fin, decalage, onFini }: { fin:string; decalage:number; onFini?:()=>void }) {
  const [,setT] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setT(x=>x+1),1000); return ()=>clearInterval(t); },[]);
  const ms = new Date(fin).getTime() - (Date.now()+decalage);
  const fini = useRef(false);
  useEffect(()=>{ if(ms<=0 && !fini.current){ fini.current=true; if(onFini) onFini(); } });
  if(ms<=0) return <span>Terminée</span>;
  const s=Math.floor(ms/1000), j=Math.floor(s/86400), h=Math.floor((s%86400)/3600), m=Math.floor((s%3600)/60), sec=s%60;
  return <span>{j>0?`${j}j ${h}h ${m}m`:h>0?`${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`:`${m}m ${String(sec).padStart(2,'0')}s`}</span>;
}
function CarteProduit({ produit, cp, onClick, gid, connecte, demo, vue='grille', opts, offre }: {
  offre?:{ heureServeur:string|null; onFini:()=>void }; opts?:{ prix:boolean; stock:boolean }; produit:Produit; cp:string; onClick:()=>void; gid?:number; connecte?:boolean; demo?:boolean; vue?:'grille'|'liste';
}) {
  const [hovered,setHovered] = useState(false);
  const coeurSurImage=useCarteSuperposition(gid,connecte,demo);   // add-on « Favoris » : cœur en superposition sur l'image
  const montrerPrix=opts?opts.prix:true, montrerStock=opts?opts.stock:true;
  const enPromo = produit.prix_promo && produit.prix_promo < produit.prix;
  const ench = produit.enchere || null;
  const venteBloquee = !!ench && produit.stock===0;   // seul exemplaire réservé à l'enchère : pas de vente directe
  const bandeEnchere = ench && (
    <div style={{ marginTop:8,padding:'8px 10px',borderRadius:8,border:`1px solid ${cp}55`,background:`${cp}12` }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:8 }}>
        <div><div style={{ fontSize:9,fontWeight:700,color:'#999',textTransform:'uppercase',letterSpacing:'0.08em' }}>{ench.nb_mises>0?'Mise actuelle':'Mise de départ'}</div><div style={{ fontSize:17,fontWeight:800,color:cp }}>{px(ench.mise)}</div></div>
        <div style={{ textAlign:'right' }}><div style={{ fontSize:9,fontWeight:700,color:'#999',textTransform:'uppercase' }}>Mises</div><div style={{ fontSize:15,fontWeight:800,color:'#fff' }}>{ench.nb_mises}</div></div>
      </div>
      <div style={{ marginTop:6,display:'inline-block',fontSize:11,fontWeight:800,color:cp,background:'rgba(0,0,0,0.35)',padding:'3px 8px',borderRadius:12 }}>⏱ <CompteurEnchere fin={ench.fin} decalage={ench.decalage||0} onFini={offre?offre.onFini:undefined}/></div>
      <button onClick={e=>{e.stopPropagation();onClick();}} style={{ display:'block',width:'100%',marginTop:8,padding:'9px',background:cp,border:'none',borderRadius:7,color:'#000',fontSize:12,fontWeight:800,cursor:'pointer' }}>🔨 Participer aux enchères</button>
    </div>
  );

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
        {gid!==undefined&&<div style={{ display:'flex',justifyContent:'flex-end',marginBottom:6 }}><BoutiqueSouhaitBouton gestionnaireId={gid} produitId={produit.id} connecte={connecte} demo={demo} variante="carte"/></div>}
        {montrerPrix&&!venteBloquee&&(enPromo ? (<><div style={{ fontSize:20,fontWeight:800,color:'#ef4444' }}>{px(produit.prix_promo!)}</div><div style={{ fontSize:13,color:'#555',textDecoration:'line-through' }}>{px(produit.prix)}</div></>) 
                 : <div style={{ fontSize:20,fontWeight:800,color:cp }}>{px(produit.prix)}</div>)}
        {produit.offre_fin&&offre&&<OffreCompteur compact fin={produit.offre_fin} heureServeur={offre.heureServeur} onFini={offre.onFini}/>}
        {bandeEnchere}
        <button onClick={e=>{e.stopPropagation();onClick();}} style={{ marginTop:8,padding:'6px 14px',background:cp,border:'none',borderRadius:6,color:'#000',fontSize:12,fontWeight:700,cursor:'pointer' }}>Voir</button>
      </div>
    </div>
  );

  return (
    <div style={{ position:'relative',background:hovered?SURF2:SURF,border:`1px solid ${hovered?BORD:'#222'}`,borderRadius:14,overflow:'hidden',cursor:'pointer',transition:'all 0.25s ease' }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={onClick}>
      <div style={{ aspectRatio:'1',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56,overflow:'hidden',position:'relative' }}>
        {produit.photo_principale ? <img src={produit.photo_principale} alt={produit.titre} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.4s ease',transform:hovered?'scale(1.08)':'scale(1)' }}/> : <span style={{ color:'#333' }}>📦</span>}
        {ench && <span style={{ position:'absolute',top:enPromo?34:10,left:10,background:cp,color:'#000',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:6 }}>🔨 ENCHÈRE</span>}
        {enPromo && <span style={{ position:'absolute',top:10,left:10,background:'#ef4444',color:'#fff',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:6 }}>SOLDE</span>}
        {montrerStock && produit.stock!==undefined && produit.stock<=3 && produit.stock>0 && <span style={{ position:'absolute',top:10,right:coeurSurImage?48:10,background:'#f59e0b',color:'#000',fontSize:9,fontWeight:800,padding:'3px 7px',borderRadius:6 }}>Plus que {produit.stock}!</span>}
        {produit.stock===0 && !ench && <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ color:'#fff',fontSize:13,fontWeight:700,background:'#333',padding:'6px 14px',borderRadius:6 }}>Épuisé</span></div>}
        {gid!==undefined&&<BoutiqueSouhaitCarte zone="superposition" gestionnaireId={gid} produitId={produit.id} connecte={connecte} demo={demo}/>}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'12px',background:'linear-gradient(transparent,rgba(0,0,0,0.8))',opacity:hovered?1:0,transition:'opacity 0.25s ease' }}>
          <button onClick={e=>{e.stopPropagation();onClick();}} style={{ width:'100%',padding:'8px',background:cp,border:'none',borderRadius:7,color:'#000',fontSize:12,fontWeight:800,cursor:'pointer',letterSpacing:'0.04em' }}>VOIR LE PRODUIT</button>
        </div>
      </div>
      <div style={{ padding:'14px 16px' }}>
        {gid!==undefined&&<BoutiqueSouhaitCarte zone="haut" gestionnaireId={gid} produitId={produit.id} connecte={connecte} demo={demo}/>}
        {produit.categorie && <span style={{ fontSize:9,color:cp,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em' }}>{produit.categorie}</span>}
        <h3 style={{ fontSize:14,fontWeight:600,color:'#e5e5e5',margin:'4px 0 6px',lineHeight:1.3 }}>{produit.titre}</h3>
        {produit.note_moyenne && <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:8 }}><Etoiles note={produit.note_moyenne} taille={11}/><span style={{ fontSize:10,color:'#666' }}>({produit.nb_avis})</span></div>}
        {montrerPrix&&!venteBloquee&&<div style={{ display:'flex',alignItems:'baseline',gap:8 }}>
          {enPromo ? (<><span style={{ fontSize:17,fontWeight:800,color:'#ef4444' }}>{px(produit.prix_promo!)}</span><span style={{ fontSize:12,color:'#555',textDecoration:'line-through' }}>{px(produit.prix)}</span><span style={{ fontSize:10,color:'#ef4444',fontWeight:700 }}>-{Math.round((1-produit.prix_promo!/produit.prix)*100)}%</span></>)
                   : <span style={{ fontSize:17,fontWeight:800,color:cp }}>{px(produit.prix)}</span>}
        </div>}
        {produit.offre_fin&&offre&&<OffreCompteur compact fin={produit.offre_fin} heureServeur={offre.heureServeur} onFini={offre.onFini}/>}
        {bandeEnchere}
        {gid!==undefined&&<BoutiqueSouhaitCarte zone="bas" gestionnaireId={gid} produitId={produit.id} connecte={connecte} demo={demo}/>}
      </div>
    </div>
  );
}

// ── Inscription acheteur : config du gestionnaire (onglet « Compte / Inscription ») fusionnée avec les défauts ──
type ChampInsc = { id:string; type:'text'|'email'|'tel'|'select'|'textarea'|'checkbox'; label:string; placeholder?:string; options?:string[]; requis?:boolean };
const INSC_DEF = {
  titre:'Créer un compte', sousTitre:'', boutonTexte:'Créer mon compte',
  messageSuccesTitre:'Compte créé avec succès !', messageSuccesTexte:'Vous pouvez maintenant vous connecter.',
  libelles:{ prenom:'Prénom', nom:'Nom', email:'Courriel', mot_de_passe:'Mot de passe', confirmation:'Confirmez le mot de passe' },
  telephone:{ mode:'cache' }, adresse:{ mode:'obligatoire' }, infolettre:{ affiche:false, texte:'Je veux recevoir les nouveautés par courriel' },
  age:{ affiche:true, minimum:16, texte:'Je déclare avoir {age} ans ou + (consentement parental pour les mineurs)' },
  termes:{ affiche:true, texte:"J'accepte les termes et conditions de la boutique", url:'' },
};
function fusionInsc(b:any){
  const x=b&&typeof b==='object'?b:{}; const sous=(k:'libelles'|'telephone'|'adresse'|'infolettre'|'age'|'termes')=>({...INSC_DEF[k],...(x[k]&&typeof x[k]==='object'?x[k]:{})});
  return { ...INSC_DEF, ...x, libelles:sous('libelles'), telephone:sous('telephone'), adresse:sous('adresse'), infolettre:sous('infolettre'), age:sous('age'), termes:sous('termes'), champs:(Array.isArray(x.champs)?x.champs:[]) as ChampInsc[] };
}

export default function TemplateBoutiquePremium({ config: configBrut, siteId, vendeurId }: Props) {
  const raw = configBrut?.premium || {};
  const cfg = { ...CFG_DEF, ...raw, footer: { ...CFG_DEF.footer, ...(raw.footer||{}) } };
  // Lecture de la config du gestionnaire : texte saisi, sinon exemple ; interrupteur actif sauf s'il est coupé ; liste saisie, sinon exemples
  const tx=(sec:string,cle:string,defaut:string):string=>{ const v=raw?.[sec]?.[cle]; return typeof v==='string'&&v.trim()?v.trim():defaut; };
  const on=(sec:string,cle:string):boolean=>raw?.[sec]?.[cle]!==false;
  const lst=(sec:string,cle:string,demo:any[],ok:(x:any)=>boolean):any[]=>{ const l=(Array.isArray(raw?.[sec]?.[cle])?raw[sec][cle]:[]).filter((x:any)=>x&&typeof x==='object'&&ok(x)); return l.length>0?l:demo; };
  const nbr=(sec:string,cle:string,defaut:number,min:number,max:number):number=>{ const n=Number(raw?.[sec]?.[cle]); return Number.isFinite(n)&&n>=min&&n<=max?Math.round(n):defaut; };
  const optsCarte={ prix:on('catalogue','afficherPrix'), stock:on('catalogue','afficherStock') };
  const couleurBtn=/^#[0-9a-f]{6}$/i.test(String(raw?.ficheProduit?.boutonCouleur||''))?String(raw.ficheProduit.boutonCouleur):'';
  const lumi=couleurBtn?(parseInt(couleurBtn.slice(1,3),16)*0.299+parseInt(couleurBtn.slice(3,5),16)*0.587+parseInt(couleurBtn.slice(5,7),16)*0.114)/255:0;
  const styleBtnProduit:React.CSSProperties=couleurBtn?{ background:couleurBtn,color:lumi>0.55?'#000':'#fff' }:{};
  const partager=(reseau:string,titre:string)=>{
    const u=encodeURIComponent(window.location.href), t=encodeURIComponent(titre);
    const url=reseau==='Facebook'?`https://www.facebook.com/sharer/sharer.php?u=${u}`:reseau==='Pinterest'?`https://pinterest.com/pin/create/button/?url=${u}&description=${t}`:`https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    window.open(url,'_blank','noopener,noreferrer,width=600,height=500');
  };
  const cc:any=raw?.contact||{};
  const saisiContact=[['📍','Adresse',cc.adresse],['📞','Téléphone',cc.telephone],['✉️','Courriel',cc.courriel],['⏰','Heures',cc.heures]].filter(([,,v])=>typeof v==='string'&&String(v).trim()).map(([ico,label,val])=>({ico,label,val:String(val).trim()}));
  const lignesContact:any[]=saisiContact.length>0?saisiContact:DEMO.contact;
  const lienHttp=(u:any):string=>/^https?:\/\//i.test(String(u||''))?String(u):'';
  const cp  = cfg.couleurAccent || OR;

  type PageId = 'accueil'|'catalogue'|'offres'|'encheres'|'produit'|'blog'|'article'|'faq'|'a-propos'|'contact'|'panier'|'compte'|'login'|'inscription'|'politique';
  const [page,setPage]             = useState<PageId>('accueil');
  const [produitActif,setProduitActif] = useState<Produit|null>(null);
  const [heureServeur,setHeureServeur] = useState<string|null>(null);   // heure du serveur (add-on « Offres du jour »)
  const [enchereEtat,setEnchereEtat] = useState<Record<number,boolean>>({});   // add-on « Enchères » : enchère en cours par produit, lu en direct par le bloc de la fiche
  const enchActive=(x:Produit)=>enchereEtat[x.id]!==undefined?enchereEtat[x.id]:!!x.enchere;   // enchère en cours sur ce produit
  const venteDirecteBloquee=(x:Produit)=>enchActive(x)&&x.stock===0;   // un seul exemplaire et il est réservé à l'enchère
  const [articleActif,setArticleActif] = useState<ArticleBlog|null>(null);
  const [isMobile,setIsMobile]     = useState(false);
  const [menuOuvert,setMenuOuvert] = useState(false);
  const [produits,setProduits]     = useState<Produit[]>([]);
  const [produitsDemo,setProduitsDemo] = useState(true); // vrai tant que seuls les exemples sont affichés
  const [politiquesRedigees,setPolitiquesRedigees] = useState<Record<string,boolean>|null>(null); // slug → rédigée ? (null = pas encore lu)
  const [politique,setPolitique] = useState<{slug:string;titre:string;contenu:string}|null>(null);
  const [politiqueStatut,setPolitiqueStatut] = useState<'idle'|'loading'|'err'>('idle');
  const politiqueEnCours = useRef('');
  const [catalogueCharge,setCatalogueCharge] = useState(false); // vrai quand la lecture des vraies annonces est terminée
  const modeDemo = catalogueCharge&&produitsDemo; // éléments de démonstration seulement (futurs add-ons payants) : jamais sur une boutique qui a de vraies annonces
  const [articles,setArticles]     = useState<ArticleBlog[]>([]);
  const [blogPage,setBlogPage]     = useState(1);
  const [blogPages,setBlogPages]   = useState(1);
  const [blogCharge,setBlogCharge]  = useState(false);
  const [articleErreur,setArticleErreur] = useState(false);
  const [categories,setCategories] = useState<string[]>([]);
  const [avisActif,setAvisActif]   = useState<Avis[]>([]);
  const [acheteur,setAcheteur]     = useState<AcheteurUser|null>(null);
  const [nbPanier,setNbPanier] = useState(0);
  const [vueCompte,setVueCompte] = useState<'dashboard'|'panier'|'wishlist'>('dashboard');
  const [avisPanier,setAvisPanier] = useState('');
  const [filtreCat,setFiltreCat]   = useState('');
  const [filtreRecherche,setFiltreRecherche] = useState('');
  const [filtrePrixMin,setFiltrePrixMin] = useState('');
  const [filtrePrixMax,setFiltrePrixMax] = useState('');
  const [tri,setTri]               = useState<'recent'|'prix_asc'|'prix_desc'|'note'>('recent');
  const [vueCatalogue,setVueCatalogue] = useState<'grille'|'liste'>('grille');
  const [colonnes,setColonnes]     = useState(()=>{ const n=Number(raw?.catalogue?.colonnes); return n>=2&&n<=4?Math.round(n):3; });
  const [photoIdx,setPhotoIdx]     = useState(0);
  const [qteChoisie,setQteChoisie] = useState(1);
  const [varianteChoisie,setVarianteChoisie] = useState<Record<string,string>>({});
  const [zoomActif,setZoomActif]   = useState(false);
  const [sourisPos,setSourisPos]   = useState({x:0,y:0});
  const [ongletProduit,setOngletProduit] = useState<'description'|'avis'|'livraison'>('description');
  const [faqOuvert,setFaqOuvert]   = useState<number|null>(null);
  const [contactForm,setContactForm] = useState({nom:'',courriel:'',sujet:'',message:''});
  const [contactStatut,setContactStatut] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [loginForm,setLoginForm]   = useState({email:'',mdp:''});
  const [loginStatut,setLoginStatut] = useState<'idle'|'loading'|'err'>('idle');
  const [loginErreur,setLoginErreur] = useState('');
  const [inscVal,setInscVal]     = useState<Record<string,any>>({});
  const [inscStatut,setInscStatut] = useState<'idle'|'loading'|'ok'>('idle');
  const [inscErreur,setInscErreur] = useState('');
  const [honeypot,setHoneypot]     = useState('');
  const [sourisBougee,setSourisBougee] = useState(false);
  const debutInscription = useRef<number>(Date.now());
  const ins = fusionInsc(raw.inscription);

  useEffect(()=>{ const c=()=>setIsMobile(window.innerWidth<768); c(); window.addEventListener('resize',c); return()=>window.removeEventListener('resize',c); },[]);
  useEffect(()=>{
    fetch(`${API_BASE}/studio/politiques/${vendeurId}/public`).then(r=>r.ok?r.json():null).then(d=>{ if(!d||!Array.isArray(d.politiques)) return; const m:Record<string,boolean>={}; d.politiques.forEach((p:any)=>{ m[p.slug]=typeof p.contenu==='string'&&p.contenu.trim().length>0; }); setPolitiquesRedigees(m); }).catch(()=>{});
  },[vendeurId]);

  const chargerCatalogue = useCallback(()=>fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?limit=100`).then(r=>r.ok?r.json():null).then(data=>{ if(!data) return; const l:Produit[]=data.produits||data||[]; if(data.heure_serveur) setHeureServeur(String(data.heure_serveur)); const decSrv=data.heure_serveur?new Date(String(data.heure_serveur)).getTime()-Date.now():0; l.forEach((x:any)=>{ if(x.ench_fin){ x.enchere={ fin:x.ench_fin, mise:Number(x.ench_mise), nb_mises:Number(x.ench_nb)||0, decalage:decSrv }; } else x.enchere=null; delete x.ench_fin; delete x.ench_mise; delete x.ench_nb; }); if(l.length>0){ setProduitsDemo(false); setProduits(l); setCategories(Array.from(new Set(l.map(p=>p.categorie).filter(Boolean))) as string[]); } }).catch(()=>{}),[vendeurId]);
  useEffect(()=>{
    if(configBrut?.__produits_demo__){ setCatalogueCharge(true); setProduits(configBrut.__produits_demo__); setCategories(Array.from(new Set(configBrut.__produits_demo__.map((p:any)=>p.categorie).filter(Boolean))) as string[]); return; }
    setProduits(PRODUITS_DEMO); setCategories(Array.from(new Set(PRODUITS_DEMO.map(p=>p.categorie).filter(Boolean))) as string[]);
    chargerCatalogue().then(()=>setCatalogueCharge(true));
  },[vendeurId,chargerCatalogue]);
  // Quand une offre se termine, on relit le catalogue : le serveur renvoie alors le vrai prix
  const [nbOffres,setNbOffres] = useState(0);        // offres en cours (lien « Offres du jour » du menu)
  const [versionOffres,setVersionOffres] = useState(0); // change quand une offre se termine : la page des offres se relit
  const compterOffres = useCallback(()=>{ if(configBrut?.__produits_demo__) return; fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?offres=1&limit=1`).then(r=>r.ok?r.json():null).then(d=>{ if(d&&typeof d.total==='number') setNbOffres(d.total); }).catch(()=>{}); },[vendeurId,configBrut]);
  useEffect(()=>{ compterOffres(); },[compterOffres]);
  // Add-on « Enchères » : lien « Enchères » du menu seulement s'il y a au moins une enchère en cours ; la page lit la liste au serveur
  const [nbEncheres,setNbEncheres] = useState(0);
  const [encheresListe,setEncheresListe] = useState<any[]>([]);
  const [encheresProduits,setEncheresProduits] = useState<Record<number,Produit>>({});
  const [encheresDec,setEncheresDec] = useState(0);
  const [encheresCharge,setEncheresCharge] = useState(false);
  const [encheresErr,setEncheresErr] = useState(false);
  const [versionEncheres,setVersionEncheres] = useState(0);
  useEffect(()=>{
    if(configBrut?.__produits_demo__) return;
    let annule=false;
    const compter=()=>fetch(`${API_BASE}/boutique/encheres/${vendeurId}?limit=1`).then(r=>r.ok?r.json():null).then(d=>{ if(!annule&&d&&d.pagination&&typeof d.pagination.total==='number') setNbEncheres(d.pagination.total); }).catch(()=>{});
    compter(); const t=setInterval(compter,60000);
    return ()=>{ annule=true; clearInterval(t); };
  },[vendeurId,configBrut]);
  useEffect(()=>{
    if(page!=='encheres'||configBrut?.__produits_demo__) return;
    let annule=false; setEncheresErr(false);
    const lire=()=>fetch(`${API_BASE}/boutique/encheres/${vendeurId}?limit=60`).then(r=>r.ok?r.json():Promise.reject()).then(async d=>{
      if(annule) return;
      const l:any[]=Array.isArray(d.encheres)?d.encheres:[];
      setEncheresListe(l); setNbEncheres(d.pagination?Number(d.pagination.total)||0:l.length); if(d.maintenant) setEncheresDec(new Date(d.maintenant).getTime()-Date.now()); setEncheresCharge(true);
      const ids=l.map(x=>x.produit_id).filter((x:number)=>Number.isInteger(x)).slice(0,50);
      if(ids.length){ try{ const r2=await fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?ids=${ids.join(',')}&limit=50`); const c=r2.ok?await r2.json():null; if(!annule&&c&&Array.isArray(c.produits)){ const m:Record<number,Produit>={}; c.produits.forEach((x:Produit)=>{ m[Number(x.id)]=x; }); setEncheresProduits(m); } }catch{ /* la carte reste visible, sans ouverture de fiche */ } }
    }).catch(()=>{ if(!annule){ setEncheresErr(true); setEncheresCharge(true); } });
    lire(); const t=setInterval(lire,15000);
    return ()=>{ annule=true; clearInterval(t); };
  },[page,vendeurId,configBrut,versionEncheres]);
  // Page « Offres du jour » : lue directement du serveur (?offres=1), paginée — indépendante des 100 premiers produits du catalogue
  const OFFRES_PAR_PAGE=24;
  const [offresListe,setOffresListe] = useState<Produit[]>([]);
  const [offresTotal,setOffresTotal] = useState(0);
  const [offresPg,setOffresPg] = useState(1);
  const [offresCharge,setOffresCharge] = useState(false);
  const [offresErr,setOffresErr] = useState(false);
  useEffect(()=>{
    if(page!=='offres'||configBrut?.__produits_demo__){ return; }
    let annule=false; setOffresErr(false);
    fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?offres=1&limit=${OFFRES_PAR_PAGE}&offset=${(offresPg-1)*OFFRES_PAR_PAGE}`).then(r=>r.ok?r.json():Promise.reject()).then(d=>{ if(annule) return; setOffresListe(Array.isArray(d.produits)?d.produits:[]); setOffresTotal(Number(d.total)||0); setOffresCharge(true); }).catch(()=>{ if(!annule){ setOffresErr(true); setOffresCharge(true); } });
    return ()=>{ annule=true; };
  },[page,offresPg,versionOffres,vendeurId,configBrut]);
  const rechargerOffres = useCallback(()=>{ if(!configBrut?.__produits_demo__) chargerCatalogue(); compterOffres(); setVersionOffres(v=>v+1); },[chargerCatalogue,compterOffres,configBrut]);
  const offreCtx = { heureServeur, onFini:()=>{ setTimeout(rechargerOffres,1200); } };
  useEffect(()=>{ setProduitActif(a=>{ if(!a) return a; const n=produits.find(x=>x.id===a.id); return n&&(n.prix_promo!==a.prix_promo||n.offre_fin!==a.offre_fin)?{...a,prix_promo:n.prix_promo,offre_fin:n.offre_fin}:a; }); },[produits]);

  // Blog de la boutique (Configuration → Mes blogs) : liste légère et paginée ; l'article complet se charge à son ouverture
  const versArticle=(x:any):ArticleBlog=>({ id:x.id,titre:x.titre,slug:x.slug,resume:x.extrait||undefined,photo:x.image_couverture||undefined,auteur:x.auteur||undefined,date_publication:x.date_publication||undefined,tags:Array.isArray(x.tags)?x.tags:[],vues:x.vues });
  const chargerArticles=(p:number)=>{ if(!vendeurId){ setBlogCharge(true); return; } fetch(`${API_BASE}/boutique/blog/${vendeurId}?page=${p}&limite=12`).then(r=>r.ok?r.json():null).then(d=>{ if(!d||!Array.isArray(d.articles)) return; setBlogPage(d.page||p); setBlogPages(d.pages||1); setArticles(prev=>p===1?d.articles.map(versArticle):[...prev,...d.articles.map(versArticle)]); }).catch(()=>{}).finally(()=>setBlogCharge(true)); };
  useEffect(()=>{ chargerArticles(1); },[vendeurId]);

  // Compte acheteur = celui du MV (mêmes clés que AppAcheteur)
  useEffect(()=>{
    try{ const u=localStorage.getItem(`mv_compte_${vendeurId}`),t=localStorage.getItem(`mv_token_${vendeurId}`); setAcheteur(u&&t?JSON.parse(u):null); } catch{ setAcheteur(null); }
  },[vendeurId,page]);

  // Pastille du panier (panier du serveur)
  useEffect(()=>{
    if(!acheteur){ setNbPanier(0); return; }
    ba(vendeurId,'/panier').then(r=>{ if(r.ok) setNbPanier((r.data.articles||[]).reduce((s:number,a:any)=>s+(a.quantite||0),0)); });
  },[acheteur,vendeurId,page,vueCompte]);

  useEffect(()=>{ if(!avisPanier) return; const t=setTimeout(()=>setAvisPanier(''),4000); return()=>clearTimeout(t); },[avisPanier]);

  const ouvrirPolitique = useCallback((slugPol:string)=>{ politiqueEnCours.current=slugPol; setPolitique(null); setPolitiqueStatut('loading'); setPage('politique');
      fetch(`${API_BASE}/studio/politiques/${vendeurId}/public/${slugPol}`).then(r=>r.ok?r.json():Promise.reject()).then(d=>{ if(politiqueEnCours.current!==slugPol) return; const p=d&&d.politique; if(!p) throw new Error(); setPolitique({ slug:slugPol, titre:String(p.titre||''), contenu:typeof p.contenu==='string'?p.contenu:'' }); setPolitiqueStatut('idle'); }).catch(()=>{ if(politiqueEnCours.current===slugPol) setPolitiqueStatut('err'); });
  },[vendeurId]);
  const naviguer = useCallback((dest:string)=>{
    setMenuOuvert(false); window.scrollTo({top:0,behavior:'smooth'});
    if(dest.toLowerCase()==='panier'){ setVueCompte('panier'); setPage('compte'); return; }
    const slugPol=slugPolitique(dest);
    if(slugPol){ ouvrirPolitique(slugPol); return; }
    const map:Record<string,PageId>={ accueil:'accueil',catalogue:'catalogue',offres:'offres',encheres:'encheres',blog:'blog',faq:'faq','a-propos':'a-propos',contact:'contact',panier:'panier',compte:'compte',login:'login',inscription:'inscription' };
    const cle=sansAccent(dest).replace(/\s+/g,'-'); if(map[cle]) setPage(map[cle]);
  },[vendeurId,ouvrirPolitique]);

  // Ouvre la fiche d'un produit par son id : dans le catalogue déjà chargé, sinon lue au serveur (ex. : une enchère sur un produit au-delà des 100 premiers)
  const ouvrirProduitParId = (id:number)=>{ const p=produits.find(x=>Number(x.id)===Number(id)); if(p){ voirProduit(p); return; } fetch(`${API_BASE}/boutique/catalogue/${vendeurId}?ids=${Number(id)}&limit=1`).then(r=>r.ok?r.json():null).then(c=>{ const q=c&&Array.isArray(c.produits)?c.produits[0]:null; if(q) voirProduit(q); else naviguer('catalogue'); }).catch(()=>naviguer('catalogue')); };
  const voirProduit = (p:Produit)=>{ setProduitActif(p); setPhotoIdx(0); setQteChoisie(1); setVarianteChoisie({}); setOngletProduit('description'); setPage('produit'); window.scrollTo({top:0,behavior:'smooth'}); fetch(`${API_BASE}/avis/produit/${p.id}`).then(r=>r.ok?r.json():[]).then(data=>setAvisActif(Array.isArray(data)?data:[])).catch(()=>{}); };
  const voirArticle = (a:ArticleBlog)=>{ setArticleActif(a); setArticleErreur(false); setPage('article'); window.scrollTo({top:0,behavior:'smooth'});
    if(a.contenu===undefined&&a.slug) fetch(`${API_BASE}/boutique/blog/${vendeurId}/article/${encodeURIComponent(a.slug)}`).then(r=>r.ok?r.json():Promise.reject()).then(d=>{ if(!d||!d.article) throw new Error(); setArticleActif(cur=>cur&&cur.id===a.id?{ ...cur,...versArticle(d.article),contenu:String(d.article.contenu||'') }:cur); }).catch(()=>setArticleErreur(true)); };
  // Add-on « Chatbot » : le widget (monté par SitePreview) demande d'ouvrir une page du site ; ce template sait les ouvrir sans recharger
  const navChatbot=useRef<(d:any)=>void>(()=>{});
  navChatbot.current=(d:any)=>{ if(!d||typeof d!=='object') return; setMenuOuvert(false); window.scrollTo({top:0,behavior:'smooth'});
    if(d.page==='produit'&&Number(d.produitId)>0){ ouvrirProduitParId(Number(d.produitId)); return; }
    if(d.page==='article'&&typeof d.articleSlug==='string'){ voirArticle({ id:0,titre:'',slug:d.articleSlug }); return; }
    if(d.page==='politique'&&typeof d.politiqueSlug==='string'&&POLITIQUES_SLUGS.includes(d.politiqueSlug)){ ouvrirPolitique(d.politiqueSlug); return; }
    if(d.page==='faq'||d.page==='a-propos'||d.page==='blog') setPage(d.page); };
  useEffect(()=>{ const f=(e:Event)=>navChatbot.current((e as CustomEvent).detail); window.addEventListener('boutique-chatbot-nav',f); return()=>window.removeEventListener('boutique-chatbot-nav',f); },[]);

  const ajouterAuPanier = async (produit:Produit)=>{
    if(produitsDemo){ setAvisPanier('Produit de démonstration : publiez vos annonces pour vendre.'); return; }
    if(!acheteur){ setAvisPanier('Connectez-vous pour ajouter au panier.'); naviguer('login'); return; }
    const variante=Object.values(varianteChoisie).join(' / ');
    const r=await ajouterAuPanierServeur(vendeurId,produit.id,qteChoisie,variante);
    if(!r.ok){ setAvisPanier(messageAcheteur(r)); return; }
    setVueCompte('panier'); naviguer('compte');
  };
  const ouvrirCompte = ()=>{ setVueCompte('dashboard'); naviguer(acheteur?'compte':'login'); };
  const ouvrirPanier = ()=>{ if(!acheteur){ setAvisPanier('Connectez-vous pour voir votre panier.'); naviguer('login'); return; } setVueCompte('panier'); naviguer('compte'); };
  // Add-on « Favoris » : la liste de souhaits est une page de l'espace client (connecté) ; sinon on invite à se connecter
  const ouvrirSouhaits = ()=>{ if(!acheteur){ setAvisPanier('Connectez-vous pour voir votre liste de souhaits.'); naviguer('login'); return; } setVueCompte('wishlist'); naviguer('compte'); };

  const handleLogin = async()=>{
    setLoginStatut('loading'); setLoginErreur('');
    try{
      const res=await fetch(`${API_BASE}/marketplace/${vendeurId}/login`,{ method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'acheteur',email:loginForm.email,password:loginForm.mdp}) });
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message||'Erreur');
      try{ localStorage.setItem(`mv_token_${vendeurId}`,data.token); localStorage.setItem(`mv_compte_${vendeurId}`,JSON.stringify(data.compte)); } catch{}
      setAcheteur(data.compte);
      setLoginStatut('idle'); naviguer('compte');
    } catch(e:any){ setLoginErreur(e.message||'Erreur'); setLoginStatut('err'); }
  };


  // Anti-bot (comme l'inscription e-Vend) : champ piège + délai minimum + mouvement de souris
  useEffect(()=>{
    if(page!=='inscription') return;
    debutInscription.current=Date.now(); setSourisBougee(false);
    const bouge=()=>setSourisBougee(true);
    window.addEventListener('mousemove',bouge,{once:true});
    return()=>window.removeEventListener('mousemove',bouge);
  },[page]);

  const handleInscription = async()=>{
    setInscErreur('');
    const v=inscVal;
    if(v.mdp&&v.mdp2&&v.mdp!==v.mdp2) return setInscErreur('Les mots de passe ne correspondent pas.');
    if(!(v.prenom||'').trim()||!(v.nom||'').trim()) return setInscErreur('Prénom et nom obligatoires.');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v.email||'').trim())) return setInscErreur('Adresse courriel invalide.');
    if((v.mdp||'').length<8) return setInscErreur('Le mot de passe doit contenir au moins 8 caractères.');
    const tel=(v.telephone||'').trim();
    if(ins.telephone.mode==='obligatoire'&&!tel) return setInscErreur('Téléphone : obligatoire.');
    if(ins.telephone.mode!=='cache'&&tel&&!/^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(tel)) return setInscErreur('Numéro de téléphone invalide (ex: 514-555-0100).');
    if(ins.adresse.mode!=='cache'){
      const a=(v.adresse||'').trim(), vi=(v.ville||'').trim(), cpo=(v.code_postal||'').trim();
      if(ins.adresse.mode==='obligatoire'||a||vi||cpo){
        if(a.length<3) return setInscErreur('Adresse invalide.');
        if(vi.length<2) return setInscErreur('Ville invalide.');
        if(!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(cpo)) return setInscErreur('Code postal invalide (ex: H2X 1Y4).');
      }
    }
    const champs:Record<string,any>={}; ins.champs.forEach((c:ChampInsc)=>{ champs[c.id]=v['c_'+c.id]; });
    setInscStatut('loading');
    try{
      const res=await fetch(`${API_BASE}/boutique/acheteur/${vendeurId}/inscription`,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        prenom:v.prenom||'', nom:v.nom||'', email:v.email||'', mot_de_passe:v.mdp||'', confirmation:v.mdp2||'',
        telephone:v.telephone||'', adresse:v.adresse||'', ville:v.ville||'', code_postal:v.code_postal||'', province:v.province||'QC', infolettre:v.infolettre===true, age_confirme:v.age===true, termes_acceptes:v.termes===true, champs,
        duree_ms:Date.now()-debutInscription.current, souris:sourisBougee, website:honeypot }) });
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message||"Erreur lors de l'inscription.");
      setLoginForm({email:(v.email||'').trim(),mdp:''}); setInscStatut('ok');
    } catch(e:any){ setInscErreur(e.message||'Erreur de connexion au serveur.'); setInscStatut('idle'); }
  };

  const envoyerContact=async()=>{ setContactStatut('loading'); try{ const res=await fetch(`${API_BASE}/contact/vendeur/${vendeurId}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(contactForm)}); if(!res.ok) throw new Error(); setContactStatut('ok'); setContactForm({nom:'',courriel:'',sujet:'',message:''}); } catch{ setContactStatut('err'); } setTimeout(()=>setContactStatut('idle'),4000); };

  const produitsFiltres = produits.filter(p=>{ const mc=!filtreCat||p.categorie===filtreCat; const mr=!filtreRecherche||p.titre.toLowerCase().includes(filtreRecherche.toLowerCase()); const mn=!filtrePrixMin||p.prix>=parseFloat(filtrePrixMin); const mx=!filtrePrixMax||p.prix<=parseFloat(filtrePrixMax); return mc&&mr&&mn&&mx; }).sort((a,b)=>{ if(tri==='prix_asc') return (a.prix_promo||a.prix)-(b.prix_promo||b.prix); if(tri==='prix_desc') return (b.prix_promo||b.prix)-(a.prix_promo||a.prix); if(tri==='note') return (b.note_moyenne||0)-(a.note_moyenne||0); return 0; });

  const styleInput:React.CSSProperties = { width:'100%',padding:'12px 16px',background:SURF,border:`1px solid #333`,borderRadius:10,fontSize:14,outline:'none',color:'#fff',fontFamily:'inherit',boxSizing:'border-box' };
  const styleBtn:React.CSSProperties  = { background:`linear-gradient(135deg,${cp},${OR2})`,color:'#000',border:'none',borderRadius:10,padding:'14px 28px',fontSize:14,fontWeight:800,cursor:'pointer',letterSpacing:'0.05em' };

  const menuNav:string[][]=[['accueil','Accueil'],['catalogue','Catalogue'],...(nbOffres>0?[['offres','🔥 Offres du jour']]:[]),...(nbEncheres>0?[['encheres','🔨 Enchères']]:[]),['blog','Blog'],['faq','FAQ'],['a-propos','À propos'],['contact','Contact']]
    .filter(([id])=>!(Array.isArray(raw?.menu?.masques)?raw.menu.masques:[]).includes(id)).map(([id,l])=>[id,tx('menu',id,l)]);
  const Nav = () => (
    <nav style={{ position:'sticky',top:0,zIndex:100,background:'rgba(10,10,10,0.92)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${BORD}` }}>
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'0 24px',height:70,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <button onClick={()=>naviguer('accueil')} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}>
          {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nomBoutique} style={{ height:40 }}/>
            : <div><div style={{ fontSize:18,fontWeight:800,color:'#fff',letterSpacing:'0.08em' }}>{cfg.nomBoutique}</div>
                {cfg.slogan&&<div style={{ fontSize:9,color:cp,letterSpacing:'0.15em',textTransform:'uppercase',marginTop:2 }}>{cfg.slogan}</div>}</div>}
        </button>
        {!isMobile&&<div style={{ display:'flex',gap:4 }}>
          {menuNav.map(([id,label])=>(
            <button key={id} onClick={()=>naviguer(id)} style={{ background:'none',border:'none',color:page===id?cp:'rgba(255,255,255,0.7)',fontSize:13,fontWeight:page===id?700:500,cursor:'pointer',padding:'8px 14px',borderRadius:8,letterSpacing:'0.04em',transition:'color 0.2s' }}>{label}</button>
          ))}</div>}
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <BoutiqueSouhaitsAcces gestionnaireId={vendeurId} connecte={!!acheteur} demo={produitsDemo} ouvrir={ouvrirSouhaits} variante="entete"/>
          <button onClick={ouvrirCompte} style={{ background:'none',border:`1px solid #333`,borderRadius:10,width:40,height:40,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,position:'relative' }}>
            {acheteur?'👤':'🔑'}{acheteur&&<div style={{ position:'absolute',bottom:2,right:2,width:8,height:8,borderRadius:'50%',background:'#4ade80',border:'1.5px solid #0a0a0a' }}/>}
          </button>
          <button onClick={ouvrirPanier} style={{ position:'relative',display:'flex',alignItems:'center',gap:8,background:`${cp}20`,border:`1px solid ${BORD}`,borderRadius:10,padding:'8px 14px',cursor:'pointer',color:'#fff',fontSize:13,fontWeight:600 }}>
            🛒{nbPanier>0&&<span style={{ background:cp,color:'#000',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:800 }}>{nbPanier}</span>}
          </button>
          {isMobile&&<button onClick={()=>setMenuOuvert(!menuOuvert)} style={{ background:'none',border:`1px solid #333`,borderRadius:8,width:40,height:40,cursor:'pointer',color:'#fff',fontSize:18 }}>{menuOuvert?'✕':'☰'}</button>}
        </div>
      </div>
      {isMobile&&menuOuvert&&<div style={{ background:NOIR2,borderTop:`1px solid ${BORD}`,padding:'12px 24px 20px' }}>
        {menuNav.map(([id,label])=>(
          <button key={id} onClick={()=>naviguer(id)} style={{ display:'block',width:'100%',textAlign:'left',background:page===id?`${cp}15`:'none',border:'none',borderRadius:8,color:page===id?cp:'#ccc',fontSize:15,fontWeight:page===id?700:400,cursor:'pointer',padding:'12px 14px',marginBottom:4 }}>{label}</button>
        ))}</div>}
    </nav>
  );

  const PageAccueil = () => {
    const vedette = produits.slice(0,nbr('accueil','vedetteNombre',8,1,12));
    return (
      <>
        {/* Hero */}
        <div style={{ position:'relative',height:isMobile?'80vh':'90vh',overflow:'hidden',background:NOIR }}>
          <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse at 20% 50%,${cp}15 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,${OR2}10 0%,transparent 50%),${NOIR}` }}/>
          <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}@keyframes glow{0%,100%{opacity:0.4}50%{opacity:0.8}}@keyframes slideIn{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}`}</style>
          {[...Array(8)].map((_,i)=><div key={i} style={{ position:'absolute',width:2,height:2,background:cp,borderRadius:'50%',top:`${10+i*12}%`,left:`${5+i*11}%`,animation:`glow ${2+i*0.3}s ease-in-out infinite`,opacity:0.4 }}/>)}
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 24px' }}>
            <div style={{ textAlign:'center',maxWidth:800,animation:'slideIn 0.8s ease' }}>
              <div style={{ display:'inline-block',fontSize:11,fontWeight:700,color:cp,letterSpacing:'0.2em',textTransform:'uppercase',borderBottom:`1px solid ${BORD}`,paddingBottom:8,marginBottom:24 }}>✦ {tx('accueil','heroSurtitre','Collection exclusive')} ✦</div>
              <h1 style={{ fontSize:isMobile?'clamp(36px,10vw,56px)':'clamp(48px,6vw,80px)',fontWeight:900,color:'#fff',lineHeight:1.05,margin:'0 0 24px',letterSpacing:'-0.02em' }}>{cfg.nomBoutique}</h1>
              <p style={{ fontSize:isMobile?16:20,color:'rgba(255,255,255,0.6)',lineHeight:1.6,marginBottom:40,maxWidth:560,margin:'0 auto 40px' }}>{cfg.slogan}</p>
              <div style={{ display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap' }}>
                <button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'16px 40px',fontSize:15 }}>{tx('accueil','boutonPrincipal','Découvrir la collection →')}</button>
                <button onClick={()=>naviguer('blog')} style={{ padding:'16px 32px',background:'none',border:`1px solid ${BORD}`,borderRadius:10,color:'rgba(255,255,255,0.7)',fontSize:15,cursor:'pointer' }}>{tx('accueil','boutonSecondaire','Notre univers')}</button>
              </div>
            </div>
          </div>
          <div style={{ position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
            <span style={{ fontSize:10,color:cp,letterSpacing:'0.15em',textTransform:'uppercase' }}>Défiler</span>
            <div style={{ width:1,height:40,background:`linear-gradient(${cp},transparent)`,animation:'float 2s ease-in-out infinite' }}/>
          </div>
        </div>

        {/* Avantages */}
        {on('accueil','afficherAvantages')&&<div style={{ background:`linear-gradient(135deg,${SURF},${SURF2})`,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}` }}>
          <div style={{ maxWidth:1300,margin:'0 auto',padding:'20px 24px',display:'grid',gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:20 }}>
            {lst('accueil','avantages',DEMO.avantages,x=>!!(x.titre||x.desc)).slice(0,4).map((a:any,i:number)=>{ const {ico,titre,desc}=a; return (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:10,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{ico}</div>
                <div><div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>{titre}</div><div style={{ fontSize:11,color:'#666' }}>{desc}</div></div>
              </div>
            ); })}
          </div>
        </div>}

        {/* Produits vedette */}
        {on('accueil','afficherVedette')&&vedette.length>0&&<div style={{ maxWidth:1300,margin:'0 auto',padding:'72px 24px' }}>
          <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:48 }}>
            <div><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ {tx('accueil','vedetteSurtitre','Sélection')}</div><h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0,lineHeight:1.1 }}>{tx('accueil','vedetteTitre','Nos coups de cœur')}</h2></div>
            <button onClick={()=>naviguer('catalogue')} style={{ background:'none',border:`1px solid ${BORD}`,borderRadius:8,padding:'10px 20px',color:cp,fontSize:13,fontWeight:600,cursor:'pointer',display:isMobile?'none':'block' }}>{tx('accueil','vedetteBouton','Voir tout →')}</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:isMobile?12:20 }}>
            {vedette.map(p=><CarteProduit offre={offreCtx} opts={optsCarte} key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} gid={vendeurId} connecte={!!acheteur} demo={produitsDemo}/>)}
          </div>
        </div>}

        {/* Catégories */}
        {on('accueil','afficherCategories')&&categories.length>0&&<div style={{ background:SURF,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}`,padding:'72px 24px' }}>
          <div style={{ maxWidth:1300,margin:'0 auto' }}>
            <div style={{ textAlign:'center',marginBottom:48 }}><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ {tx('accueil','categoriesSurtitre','Univers')}</div><h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0 }}>{tx('accueil','categoriesTitre','Nos catégories')}</h2></div>
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
        {on('accueil','afficherTemoignages')&&<div style={{ maxWidth:1300,margin:'0 auto',padding:'72px 24px' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ {tx('accueil','temoignagesSurtitre','Témoignages')}</div><h2 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0 }}>{tx('accueil','temoignagesTitre','Ce que disent nos clients')}</h2></div>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
            {lst('accueil','temoignages',DEMO.temoignages,x=>!!x.texte).slice(0,6).map((t:any,i:number)=>(
              <div key={i} style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:16,padding:28 }}>
                <Etoiles note={Number(t.note)||5} taille={16}/>
                <p style={{ fontSize:15,color:'#ccc',lineHeight:1.7,margin:'16px 0 20px',fontStyle:'italic' }}>"{t.texte}"</p>
                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                  <div style={{ width:40,height:40,borderRadius:'50%',background:`${cp}20`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:cp }}>{String(t.auteur||'?')[0]}</div>
                  <div><div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{t.auteur}</div><div style={{ fontSize:12,color:'#666' }}>{t.ville}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* Infolettre */}
        {modeDemo&&on('accueil','afficherInfolettre')&&<div style={{ background:`linear-gradient(135deg,${SURF},${NOIR})`,borderTop:`1px solid ${BORD}`,padding:'72px 24px' }}>
          <div style={{ maxWidth:560,margin:'0 auto',textAlign:'center' }}>
            <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ {tx('accueil','infolettreSurtitre','Exclusivités')}</div>
            <h2 style={{ fontSize:isMobile?28:36,fontWeight:900,color:'#fff',marginBottom:12 }}>{tx('accueil','infolettreTitre','Restez dans la boucle')}</h2>
            <p style={{ fontSize:15,color:'#888',marginBottom:32,lineHeight:1.6 }}>{tx('accueil','infolettreTexte','Offres exclusives, nouvelles collections et avant-premières réservées à nos abonnés.')}</p>
            <div style={{ display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center' }}>
              <input type="email" placeholder="votre@courriel.com" style={{ flex:1,minWidth:220,padding:'14px 20px',background:SURF,border:`1px solid ${BORD}`,borderRadius:10,fontSize:14,color:'#fff',outline:'none' }}/>
              <button style={{ ...styleBtn,padding:'14px 24px',fontSize:14,flexShrink:0 }}>{tx('accueil','infolettreBouton',"S'inscrire →")}</button>
            </div>
          </div>
        </div>}
      </>
    );
  };

  const PageCatalogue = () => {
    const [filtresPanneau,setFiltresPanneau] = useState(!isMobile);
    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ marginBottom:32 }}><div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>✦ {tx('catalogue','surtitre','Catalogue')}</div><h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:0 }}>{tx('catalogue','titre','Tous nos produits')}</h1></div>
        <div style={{ display:'flex',gap:12,marginBottom:24,alignItems:'center',flexWrap:'wrap' }}>
          {on('catalogue','afficherRecherche')&&<div style={{ flex:1,minWidth:200,position:'relative' }}>
            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#555',fontSize:14 }}>🔍</span>
            <input type="text" placeholder="Rechercher..." value={filtreRecherche} onChange={e=>setFiltreRecherche(e.target.value)} style={{ ...styleInput,paddingLeft:40,fontSize:13 }}/>
          </div>}
          <select value={tri} onChange={e=>setTri(e.target.value as any)} style={{ padding:'12px 16px',background:SURF,border:`1px solid #333`,borderRadius:10,fontSize:13,color:'#fff',cursor:'pointer',outline:'none' }}>
            <option value="recent">Plus récents</option><option value="prix_asc">Prix croissant</option><option value="prix_desc">Prix décroissant</option><option value="note">Mieux notés</option>
          </select>
          <div style={{ display:'flex',border:`1px solid #333`,borderRadius:10,overflow:'hidden' }}>
            {(['grille','liste'] as const).map(v=><button key={v} onClick={()=>setVueCatalogue(v)} style={{ padding:'10px 14px',background:vueCatalogue===v?SURF2:'transparent',border:'none',color:vueCatalogue===v?cp:'#666',cursor:'pointer',fontSize:16 }}>{v==='grille'?'⊞':'≡'}</button>)}
          </div>
          {vueCatalogue==='grille'&&!isMobile&&<div style={{ display:'flex',border:`1px solid #333`,borderRadius:10,overflow:'hidden' }}>
            {[2,3,4].map(n=><button key={n} onClick={()=>setColonnes(n)} style={{ padding:'10px 14px',background:colonnes===n?SURF2:'transparent',border:'none',color:colonnes===n?cp:'#666',cursor:'pointer',fontSize:12,fontWeight:700 }}>{n}</button>)}
          </div>}
          {on('catalogue','afficherFiltres')&&<button onClick={()=>setFiltresPanneau(!filtresPanneau)} style={{ padding:'12px 16px',background:filtresPanneau?`${cp}20`:SURF,border:`1px solid ${filtresPanneau?cp:'#333'}`,borderRadius:10,color:filtresPanneau?cp:'#888',fontSize:13,cursor:'pointer',fontWeight:600 }}>⚡ Filtres</button>}
        </div>
        <div style={{ display:'flex',gap:24,alignItems:'flex-start' }}>
          {filtresPanneau&&on('catalogue','afficherFiltres')&&<div style={{ width:240,flexShrink:0,background:SURF,border:`1px solid #222`,borderRadius:14,padding:20,position:'sticky',top:90,maxHeight:'calc(100vh - 110px)',overflowY:'auto' }}>
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
            {produitsFiltres.length===0 ? <div style={{ textAlign:'center',padding:'80px 0',color:'#555' }}><div style={{ fontSize:56,marginBottom:16 }}>🔍</div><h3 style={{ color:'#777',fontWeight:600,marginBottom:8 }}>{tx('catalogue','videTitre','Aucun produit')}</h3><p>{tx('catalogue','videTexte','Modifiez vos filtres')}</p></div>
            : vueCatalogue==='grille'
              ? <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${colonnes},1fr)`,gap:isMobile?12:20 }}>{produitsFiltres.map(p=><CarteProduit offre={offreCtx} opts={optsCarte} key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} gid={vendeurId} connecte={!!acheteur} demo={produitsDemo}/>)}</div>
              : <div style={{ display:'flex',flexDirection:'column',gap:12 }}>{produitsFiltres.map(p=><CarteProduit offre={offreCtx} opts={optsCarte} key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} vue="liste" gid={vendeurId} connecte={!!acheteur} demo={produitsDemo}/>)}</div>}
          </div>
        </div>
      </div>
    );
  };

  const PageEncheres = () => (
    <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>🔨 Enchères</div>
        <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:'0 0 8px' }}>Misez sur des pièces uniques</h1>
        <p style={{ margin:0,color:'#888',fontSize:15 }}>Les enchères qui se terminent bientôt sont en premier. Une mise est un engagement d'achat.</p>
      </div>
      {!encheresCharge ? <p style={{ color:'#666' }}>Chargement…</p>
        : encheresErr ? <p style={{ color:'#fca5a5' }}>Impossible de charger les enchères. <button onClick={()=>setVersionEncheres(v=>v+1)} style={{ background:'none',border:'none',color:cp,textDecoration:'underline',cursor:'pointer',fontSize:'inherit' }}>Réessayer</button></p>
        : encheresListe.length===0
          ? <div style={{ textAlign:'center',padding:'80px 0',color:'#555' }}><div style={{ fontSize:56,marginBottom:16 }}>🔨</div><h3 style={{ color:'#777',fontWeight:600,marginBottom:16 }}>Aucune enchère en cours pour le moment. Revenez bientôt !</h3><button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'12px 28px' }}>Voir le catalogue</button></div>
          : <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${colonnes},1fr)`,gap:isMobile?12:20 }}>
              {encheresListe.map((e:any)=>{ return (
                <div key={e.id} onClick={()=>{ const p=encheresProduits[Number(e.produit_id)]; if(p) voirProduit(p); else ouvrirProduitParId(e.produit_id); }} style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:14,overflow:'hidden',cursor:'pointer' }}>
                  <div style={{ aspectRatio:'1/1',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
                    {e.image_url?<img src={e.image_url} alt={e.titre} loading="lazy" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<span style={{ fontSize:44,opacity:0.3 }}>🔨</span>}
                  </div>
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{e.titre}</div>
                    <div style={{ fontSize:20,fontWeight:900,color:cp }}>{px(e.mise_actuelle!==null?e.mise_actuelle:e.prix_depart)}</div>
                    <div style={{ fontSize:12,color:'#888',margin:'2px 0 6px' }}>{e.mise_actuelle===null?'Prix de départ':`${e.nb_mises} mise${e.nb_mises>1?'s':''}`}{e.reserve&&e.reserve.atteinte?' · réserve atteinte':''}</div>
                    <div style={{ fontSize:12 }}><ResteEnchere fin={e.date_fin} decalage={encheresDec} couleur={cp}/></div>
                  </div>
                </div>); })}
            </div>}
    </div>
  );
  const PageOffres = () => {
    const liste=offresListe, charge=offresCharge, err=offresErr, pg=offresPg, setPg=setOffresPg;
    const PAR_PAGE=OFFRES_PAR_PAGE, total=offresTotal;
    const pages=Math.max(1,Math.ceil(total/PAR_PAGE));
    const btnPg=(actif:boolean,off=false):React.CSSProperties=>({ padding:'8px 14px',borderRadius:8,border:`1px solid ${actif?cp:'#333'}`,background:actif?cp:SURF,color:actif?'#000':off?'#555':'#ddd',fontWeight:actif?800:500,fontSize:13,cursor:off?'not-allowed':'pointer',opacity:off?0.5:1 });
    return (
      <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:8 }}>🔥 Offres du jour</div>
          <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',margin:'0 0 8px' }}>Des prix spéciaux, pour un temps limité</h1>
          <p style={{ margin:0,color:'#888',fontSize:15 }}>Les offres qui se terminent bientôt sont en premier. Le prix revient à la normale dès la fin du compte à rebours.</p>
        </div>
        {!charge ? <p style={{ color:'#666' }}>Chargement…</p>
          : err ? <p style={{ color:'#fca5a5' }}>Impossible de charger les offres. <button onClick={()=>setVersionOffres(v=>v+1)} style={{ background:'none',border:'none',color:cp,textDecoration:'underline',cursor:'pointer',fontSize:'inherit' }}>Réessayer</button></p>
          : liste.length===0
            ? <div style={{ textAlign:'center',padding:'80px 0',color:'#555' }}><div style={{ fontSize:56,marginBottom:16 }}>🔥</div><h3 style={{ color:'#777',fontWeight:600,marginBottom:16 }}>Aucune offre du jour pour le moment. Revenez bientôt !</h3><button onClick={()=>naviguer('catalogue')} style={{ ...styleBtn,padding:'14px 32px' }}>Voir le catalogue →</button></div>
            : <>
              <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${colonnes},1fr)`,gap:isMobile?12:20 }}>{liste.map(p=><CarteProduit offre={offreCtx} opts={optsCarte} key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} gid={vendeurId} connecte={!!acheteur} demo={produitsDemo}/>)}</div>
              {pages>1&&<div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:32,flexWrap:'wrap' }}>
                <button disabled={pg<=1} onClick={()=>{ setPg(pg-1); window.scrollTo({top:0,behavior:'smooth'}); }} style={btnPg(false,pg<=1)}>← Préc.</button>
                {Array.from({length:pages},(_,k)=>k+1).filter(n=>n===1||n===pages||Math.abs(n-pg)<=1).map((n,i,a)=>(<span key={n} style={{ display:'inline-flex',alignItems:'center',gap:8 }}>{i>0&&n-a[i-1]>1&&<span style={{ color:'#666' }}>…</span>}<button onClick={()=>{ setPg(n); window.scrollTo({top:0,behavior:'smooth'}); }} style={btnPg(n===pg)}>{n}</button></span>))}
                <button disabled={pg>=pages} onClick={()=>{ setPg(pg+1); window.scrollTo({top:0,behavior:'smooth'}); }} style={btnPg(false,pg>=pages)}>Suiv. →</button>
              </div>}
            </>}
      </div>
    );
  };

  const PageProduit = () => {
    const [nbVues] = useState(Math.floor(Math.random()*20)+3);
    if (!produitActif) return null;
    const p = produitActif;
    const enPromo = p.prix_promo && p.prix_promo < p.prix;
    const photos = [p.photo_principale,...(p.photos||[])].filter(Boolean) as string[];
    const similaires = on('ficheProduit','afficherSimilaires')?produits.filter(pr=>pr.id!==p.id&&pr.categorie===p.categorie).slice(0,nbr('ficheProduit','similairesNombre',4,1,8)):[];

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
            <div style={{ position:'relative',borderRadius:16,overflow:'hidden',background:SURF,aspectRatio:'1',marginBottom:12,cursor:!on('ficheProduit','afficherZoom')?'default':zoomActif?'zoom-out':'zoom-in' }}
              onClick={()=>{ if(on('ficheProduit','afficherZoom')) setZoomActif(!zoomActif); }}
              onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();setSourisPos({x:((e.clientX-r.left)/r.width)*100,y:((e.clientY-r.top)/r.height)*100});}}>
              {photos.length>0
                ? <img src={photos[photoIdx]} alt={p.titre} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.3s ease',transform:zoomActif?`scale(2) translate(${50-sourisPos.x}%,${50-sourisPos.y}%)`:'scale(1)',transformOrigin:`${sourisPos.x}% ${sourisPos.y}%` }}/>
                : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,color:'#333' }}>📦</div>}
              {enPromo&&<span style={{ position:'absolute',top:16,left:16,background:'#ef4444',color:'#fff',fontSize:12,fontWeight:800,padding:'4px 12px',borderRadius:8 }}>SOLDE -{Math.round((1-p.prix_promo!/p.prix)*100)}%</span>}
              {on('ficheProduit','afficherZoom')&&<div style={{ position:'absolute',bottom:12,right:12,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',borderRadius:6,padding:'4px 10px',fontSize:11,color:'#aaa' }}>{zoomActif?'🔍 Cliquer pour dézoomer':'🔍 Cliquer pour zoomer'}</div>}
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
            {on('ficheProduit','afficherAvis')&&p.note_moyenne&&<div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}><Etoiles note={p.note_moyenne} taille={16}/><span style={{ fontSize:13,color:'#888' }}>{p.note_moyenne.toFixed(1)} ({p.nb_avis} avis)</span><button onClick={()=>setOngletProduit('avis')} style={{ background:'none',border:'none',color:cp,fontSize:12,cursor:'pointer',textDecoration:'underline' }}>Voir les avis</button></div>}

            {p.offre_fin&&<OffreCompteur fin={p.offre_fin} heureServeur={heureServeur} onFini={offreCtx.onFini}/>}
            <div style={{ display:'flex',alignItems:'baseline',gap:12,marginBottom:24 }}>
              {enPromo ? (<><span style={{ fontSize:36,fontWeight:900,color:'#ef4444' }}>{px(p.prix_promo!)}</span><span style={{ fontSize:20,color:'#555',textDecoration:'line-through' }}>{px(p.prix)}</span></>) : <span style={{ fontSize:36,fontWeight:900,color:cp }}>{px(p.prix)}</span>}
            </div>

            <div style={{ display:'flex',gap:16,marginBottom:20,flexWrap:'wrap' }}>
              {p.stock!==undefined&&p.stock!==null&&!(enchActive(p)&&p.stock===0)&&<span style={{ fontSize:12,fontWeight:600,color:p.stock>5?'#4ade80':p.stock>0?'#f59e0b':'#ef4444' }}>{enchActive(p)&&p.stock>0?`✓ En stock (${p.stock} disponible${p.stock>1?'s':''})`:p.stock>5?'✅ En stock':p.stock>0?`⚠️ Plus que ${p.stock} !`:'❌ Épuisé'}</span>}
              {enchActive(p)&&<span style={{ fontSize:12,fontWeight:600,color:'#f59e0b' }}>🔨 {p.stock===undefined||p.stock===null?'1 unité en vente aux enchères':'En stock (1 réservé enchère)'}</span>}
              {modeDemo&&cfg.afficherNbVues&&<span style={{ fontSize:12,color:'#555' }}>👁 {nbVues} personnes regardent</span>}
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

            {!venteDirecteBloquee(p)&&<div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8 }}>Quantité</div>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <button onClick={()=>setQteChoisie(q=>Math.max(1,q-1))} style={{ width:42,height:42,borderRadius:8,border:`1px solid #333`,background:SURF,color:'#fff',cursor:'pointer',fontSize:18,fontWeight:700 }}>−</button>
                <span style={{ fontSize:18,fontWeight:700,color:'#fff',minWidth:32,textAlign:'center' }}>{qteChoisie}</span>
                <button onClick={()=>setQteChoisie(q=>p.stock!=null?Math.min(p.stock,q+1):q+1)} style={{ width:42,height:42,borderRadius:8,border:`1px solid #333`,background:SURF,color:'#fff',cursor:'pointer',fontSize:18,fontWeight:700,opacity:p.stock!=null&&qteChoisie>=p.stock?0.4:1 }}>+</button>
              </div>
            </div>}

            <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap' }}>
              <BoutiqueSouhaitProduit zone="avant_panier" enLigne gestionnaireId={vendeurId} produitId={p.id} connecte={!!acheteur} demo={produitsDemo}/>
              {!venteDirecteBloquee(p)&&<button onClick={()=>ajouterAuPanier(p)} disabled={p.stock===0} style={{ flex:1,...styleBtn,...styleBtnProduit,padding:'16px 24px',fontSize:15,opacity:p.stock===0?0.5:1,cursor:p.stock===0?'not-allowed':'pointer' }}>{p.stock===0?'ÉPUISÉ':'🛒 '+tx('ficheProduit','boutonLabel','Ajouter au panier').toUpperCase()}</button>}
              <BoutiqueSouhaitProduit zone="apres_panier" enLigne gestionnaireId={vendeurId} produitId={p.id} connecte={!!acheteur} demo={produitsDemo}/>
            </div>

            <BlocEnchereBoutique gestionnaireId={vendeurId} produitId={p.id} couleurAccent={cp} isDemo={modeDemo} onEtat={a=>{ if(enchereEtat[p.id]===true&&a===false) setTimeout(rechargerOffres,400); setEnchereEtat(m=>m[p.id]===a?m:{...m,[p.id]:a}); }}
              allerConnexion={()=>{ setAvisPanier('Connectez-vous pour miser.'); naviguer('login'); }}/>

            <FaireOffreBoutique gestionnaireId={vendeurId} produitId={p.id} prix={enPromo?p.prix_promo!:p.prix} variante={Object.values(varianteChoisie).join(' / ')}
              varianteRequise={!!(p.variantes&&p.variantes.length&&p.variantes.some(v=>!varianteChoisie[v.nom]))} masque={p.stock===0} couleurAccent={cp} isDemo={modeDemo}
              allerConnexion={()=>{ setAvisPanier('Connectez-vous pour faire une offre.'); naviguer('login'); }} onPanier={()=>{ setVueCompte('panier'); naviguer('compte'); }}/>

            <div style={{ background:SURF,border:`1px solid #222`,borderRadius:12,padding:'14px 16px',marginBottom:24 }}>
              {lst('ficheProduit','reassurance',DEMO.reassurance,x=>!!x.texte).slice(0,5).map(({ico,texte:txt}:any,i:number)=>(
                <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid #1a1a1a',fontSize:13,color:'#888' }}><span>{ico}</span><span>{txt}</span></div>
              ))}
            </div>

            {on('ficheProduit','afficherPartage')&&<div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <span style={{ fontSize:12,color:'#555' }}>Partager :</span>
              {[['Facebook','🔵'],['Pinterest','📌'],['X','𝕏']].map(([nom,ico])=>(
                <button key={nom as string} onClick={()=>partager(nom as string,p.titre)} style={{ padding:'6px 12px',background:SURF,border:`1px solid #333`,borderRadius:6,color:'#888',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>{ico} {nom}</button>
              ))}
            </div>}
          </div>
        </div>

        {/* Onglets */}
        <div style={{ marginTop:56,borderTop:`1px solid ${BORD}`,paddingTop:40 }}>
          <div style={{ display:'flex',gap:0,borderBottom:`1px solid #222`,marginBottom:32 }}>
            {([['description','Description'],['avis',`Avis (${avisActif.length})`],['livraison','Livraison']] as const).filter(([id])=>id!=='avis'||on('ficheProduit','afficherAvis')).map(([id,label])=>(
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
              {lst('ficheProduit','livraisonInfos',DEMO.livraisonInfos,x=>!!(x.titre||x.delai||x.info)).slice(0,6).map(({ico,titre,delai,info}:any,i:number)=>(
                <div key={i} style={{ display:'flex',gap:16,padding:'18px 0',borderBottom:`1px solid #1a1a1a` }}>
                  <div style={{ width:44,height:44,borderRadius:10,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>{ico}</div>
                  <div><div style={{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:4 }}>{titre}</div><div style={{ fontSize:13,color:cp,marginBottom:4 }}>{delai}</div><div style={{ fontSize:12,color:'#666' }}>{info}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add-on « Questions sur le produit » : bloc caché par le serveur si l'add-on ou l'interrupteur est coupé */}
        <QuestionsProduitBoutique gestionnaireId={vendeurId} produitId={p.id} couleurAccent={cp} isDemo={modeDemo}
          allerConnexion={()=>{ setAvisPanier('Connectez-vous pour poser une question.'); naviguer('login'); }}/>

        {/* Similaires */}
        {similaires.length>0&&<div style={{ marginTop:72,paddingTop:48,borderTop:`1px solid ${BORD}` }}>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ {tx('ficheProduit','similairesSurtitre','Vous aimerez aussi')}</div>
          <h2 style={{ fontSize:isMobile?24:32,fontWeight:900,color:'#fff',marginBottom:28 }}>{tx('ficheProduit','similairesTitre','Produits similaires')}</h2>
          <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':`repeat(${Math.min(4,nbr('ficheProduit','similairesNombre',4,1,8))},1fr)`,gap:16 }}>
            {similaires.map(p=><CarteProduit offre={offreCtx} opts={optsCarte} key={p.id} produit={p} cp={cp} onClick={()=>voirProduit(p)} gid={vendeurId} connecte={!!acheteur} demo={produitsDemo}/>)}
          </div>
        </div>}
      </div>
    );
  };

  const champInsc = (cle:string,libelle:string,type:string,ph:string,requis:boolean,extra?:any)=>(
    <div key={cle} style={{ marginBottom:20 }}>
      <label style={{ fontSize:12,fontWeight:600,color:'#888',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:8 }}>{libelle}{requis&&' *'}</label>
      {type==='textarea'
        ? <textarea value={inscVal[cle]||''} onChange={e=>setInscVal(f=>({...f,[cle]:e.target.value}))} placeholder={ph} rows={3} style={{ ...styleInput,resize:'vertical' }}/>
        : type==='select'
        ? <select value={inscVal[cle]||''} onChange={e=>setInscVal(f=>({...f,[cle]:e.target.value}))} style={styleInput}><option value="">— Choisir —</option>{(extra||[]).map((o:string)=><option key={o} value={o}>{o}</option>)}</select>
        : <input type={type} value={inscVal[cle]||''} onChange={e=>setInscVal(f=>({...f,[cle]:e.target.value}))} placeholder={ph} style={styleInput} autoComplete={type==='password'?'new-password':undefined}/>}
    </div>
  );
  const caseInsc = (cle:string,contenu:any,requis:boolean)=>(
    <div key={cle} onClick={()=>setInscVal(f=>({...f,[cle]:!f[cle]}))} style={{ display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer',marginBottom:14 }}>
      <div style={{ width:20,height:20,minWidth:20,borderRadius:5,border:`2px solid ${inscVal[cle]?cp:'#555'}`,background:inscVal[cle]?`${cp}33`:'transparent',display:'flex',alignItems:'center',justifyContent:'center',color:cp,fontSize:12,marginTop:2 }}>{inscVal[cle]&&'✓'}</div>
      <span style={{ fontSize:13,color:'#ccc',lineHeight:1.5 }}>{contenu}{requis&&<span style={{ color:'#f87171' }}> *</span>}</span>
    </div>
  );

  const PageInscription = () => (
    <div style={{ minHeight:'70vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px' }}>
      <div style={{ width:'100%',maxWidth:480 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ ESPACE CLIENT</div>
          <h1 style={{ fontSize:32,fontWeight:900,color:'#fff',margin:0 }}>{ins.titre}</h1>
          {ins.sousTitre&&<p style={{ color:'#888',marginTop:10,fontSize:14 }}>{ins.sousTitre}</p>}
          <p style={{ color:'#666',marginTop:10,fontSize:14 }}>Vous avez déjà un compte ? <button onClick={()=>naviguer('login')} style={{ background:'none',border:'none',color:cp,fontSize:14,cursor:'pointer',fontWeight:600 }}>Se connecter</button></p>
        </div>
        {inscStatut==='ok' ? (
          <div style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:16,padding:32,textAlign:'center' }}>
            <div style={{ fontSize:48,marginBottom:12 }}>🎉</div>
            <h2 style={{ color:'#fff',fontSize:20,fontWeight:800,margin:'0 0 8px' }}>{ins.messageSuccesTitre}</h2>
            <p style={{ color:'#888',fontSize:14,margin:'0 0 24px' }}>{ins.messageSuccesTexte}</p>
            <button onClick={()=>naviguer('login')} style={{ ...styleBtn,width:'100%',textAlign:'center',padding:'16px',fontSize:15 }}>→ Se connecter</button>
          </div>
        ) : (
          <div style={{ background:SURF,border:`1px solid ${BORD}`,borderRadius:16,padding:32 }}>
            <div style={{ position:'absolute',left:-9999,top:-9999,opacity:0,pointerEvents:'none' }} aria-hidden="true"><input type="text" name="website" value={honeypot} onChange={e=>setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off"/></div>
            {champInsc('prenom',ins.libelles.prenom,'text','',true)}
            {champInsc('nom',ins.libelles.nom,'text','',true)}
            {champInsc('email',ins.libelles.email,'email','votre@courriel.com',true)}
            {ins.telephone.mode!=='cache'&&champInsc('telephone','Téléphone','tel','',ins.telephone.mode==='obligatoire')}
            {ins.adresse.mode!=='cache'&&<>
              {champInsc('adresse','Adresse','text','Numéro et rue',ins.adresse.mode==='obligatoire')}
              {champInsc('ville','Ville','text','',ins.adresse.mode==='obligatoire')}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {champInsc('code_postal','Code postal','text','H2X 1Y4',ins.adresse.mode==='obligatoire')}
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block',fontSize:12,fontWeight:700,color:'#aaa',marginBottom:8,letterSpacing:'0.05em',textTransform:'uppercase' }}>Province{ins.adresse.mode==='obligatoire'?' *':''}</label>
                  <select value={inscVal.province||'QC'} onChange={e=>setInscVal(f=>({...f,province:e.target.value}))} style={styleInput}>{PROVINCES.map(p=><option key={p.code} value={p.code}>{p.nom}</option>)}</select>
                </div>
              </div>
            </>}
            {champInsc('mdp',ins.libelles.mot_de_passe,'password','Minimum 8 caractères',true)}
            {champInsc('mdp2',ins.libelles.confirmation,'password','',true)}
            {inscVal.mdp2&&inscVal.mdp!==inscVal.mdp2&&<div style={{ fontSize:12,color:'#f87171',margin:'-12px 0 16px' }}>⚠️ Les mots de passe ne correspondent pas.</div>}
            {ins.champs.map((c:ChampInsc)=>c.type==='checkbox'
              ? caseInsc('c_'+c.id,c.label,!!c.requis)
              : champInsc('c_'+c.id,c.label,c.type,c.placeholder||'',!!c.requis,c.options))}
            {ins.infolettre.affiche&&caseInsc('infolettre',ins.infolettre.texte,false)}
            {ins.age.affiche&&caseInsc('age',String(ins.age.texte).replace('{age}',String(ins.age.minimum)),true)}
            {ins.termes.affiche&&caseInsc('termes',/^https?:\/\//i.test(ins.termes.url||'')
              ? <a href={ins.termes.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{ color:cp,textDecoration:'underline' }}>{ins.termes.texte}</a>
              : ins.termes.texte,true)}
            {inscErreur&&<div style={{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#ef4444' }}>⚠️ {inscErreur}</div>}
            <button onClick={handleInscription} disabled={inscStatut==='loading'} style={{ ...styleBtn,width:'100%',textAlign:'center',padding:'16px',fontSize:15 }}>{inscStatut==='loading'?'⏳ Création en cours…':ins.boutonTexte}</button>
          </div>
        )}
      </div>
    </div>
  );

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
          <div style={{ textAlign:'center',marginTop:20 }}><span style={{ fontSize:13,color:'#555' }}>Pas encore de compte ? </span><button onClick={()=>{ setInscStatut('idle'); setInscErreur(''); naviguer('inscription'); }} style={{ background:'none',border:'none',color:cp,fontSize:13,cursor:'pointer',fontWeight:600 }}>Créer un compte</button></div>
        </div>
      </div>
    </div>
  );

  const PageBlog = () => (
    <div style={{ maxWidth:1300,margin:'0 auto',padding:'40px 24px' }}>
      <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ {tx('blog','surtitre','Blogue')}</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:40 }}>{tx('blog','titre','Notre univers')}</h1>
      {articles.length===0 ? (!blogCharge ? <div style={{ textAlign:'center',padding:'80px 0',color:'#555' }}>…</div> : <div style={{ textAlign:'center',padding:'80px 0',color:'#555' }}><div style={{ fontSize:56,marginBottom:16 }}>📝</div><h3 style={{ color:'#666' }}>{tx('blog','videTitre','Aucun article')}</h3></div>)
      : <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':`repeat(${nbr('blog','colonnes',3,2,4)},1fr)`,gap:24 }}>
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
                  {a.auteur&&on('blog','afficherAuteur')&&<span>✍️ {a.auteur}</span>}
                  {a.date_publication&&on('blog','afficherDate')&&<span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA')}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>}
      {blogPage<blogPages&&<div style={{ textAlign:'center',marginTop:36 }}><button onClick={()=>chargerArticles(blogPage+1)} style={{ background:'none',border:`1px solid ${cp}`,color:cp,borderRadius:10,padding:'12px 32px',fontSize:14,fontWeight:700,cursor:'pointer' }}>Voir plus d'articles</button></div>}
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
          {a.auteur&&on('blog','afficherAuteur')&&<span>✍️ {a.auteur}</span>}
          {a.date_publication&&on('blog','afficherDate')&&<span>📅 {new Date(a.date_publication).toLocaleDateString('fr-CA',{year:'numeric',month:'long',day:'numeric'})}</span>}
        </div>
        {a.resume&&<p style={{ fontSize:17,color:'#aaa',lineHeight:1.8,marginBottom:32,fontStyle:'italic',borderLeft:`3px solid ${cp}`,paddingLeft:20 }}>{a.resume}</p>}
        <style>{`.pm-article{font-size:16px;line-height:1.9;color:#bbb;overflow-wrap:anywhere}.pm-article h2{font-size:24px;font-weight:800;color:#fff;margin:1.8em 0 .6em;line-height:1.25}.pm-article h3{font-size:19px;font-weight:700;color:${cp};margin:1.5em 0 .5em}.pm-article h4{font-size:16px;font-weight:700;color:#fff;margin:1.3em 0 .4em}.pm-article p{margin:0 0 1.1em}.pm-article a{color:${cp};text-decoration:underline}.pm-article img{max-width:100%;height:auto;border-radius:12px;margin:14px 0}.pm-article blockquote{border-left:3px solid ${cp};margin:1.4em 0;padding:.4em 1.2em;background:rgba(255,255,255,.04);border-radius:0 8px 8px 0;font-style:italic}.pm-article ul,.pm-article ol{padding-left:1.5em;margin:0 0 1.1em}.pm-article ul{list-style:disc}.pm-article ol{list-style:decimal}.pm-article li{margin-bottom:.4em}.pm-article hr{border:none;border-top:1px solid #222;margin:2em 0}.pm-article table{width:100%;border-collapse:collapse;margin:1.4em 0;font-size:14px;display:block;overflow-x:auto}.pm-article th{color:${cp};text-align:left;padding:10px 12px;border-bottom:2px solid #333}.pm-article td{padding:9px 12px;border-bottom:1px solid #222}.pm-article pre,.pm-article code{background:#111;border-radius:6px;padding:2px 6px;font-size:.9em}.pm-article pre{padding:14px;overflow-x:auto}`}</style>
        {a.contenu!==undefined?<div className="pm-article" dangerouslySetInnerHTML={{ __html:a.contenu||'<p>Contenu à venir…</p>' }}/>
          :articleErreur?<p style={{ fontSize:15,color:'#999',lineHeight:1.9 }}>Cet article est introuvable ou n'est plus disponible.</p>
          :<p style={{ fontSize:15,color:'#666' }}>Chargement…</p>}
        {(a.tags||[]).length>0&&<div style={{ display:'flex',flexWrap:'wrap',gap:8,marginTop:36 }}>{(a.tags||[]).map(t=><span key={t} style={{ fontSize:12,color:'#888',border:'1px solid #222',borderRadius:20,padding:'4px 12px' }}>#{t}</span>)}</div>}
      </div>
    );
  };


  const PageAPropos = () => {
    // Gestionnaire : ce qu'il a saisi (Config Mes pages → À propos). Vide : exemples de démonstration.
    const ap:any = raw.aPropos||{};
    const liste=(cle:string,ex:any[],ok:(x:any)=>boolean)=>{ const l=(Array.isArray(ap[cle])?ap[cle]:[]).filter((x:any)=>x&&typeof x==='object'&&ok(x)); return l.length>0?l:ex; };
    const valeurs=liste('valeurs',APROPOS_DEMO.valeurs,(x)=>!!(x.titre||x.desc));
    const chiffres=liste('chiffres',APROPOS_DEMO.chiffres,(x)=>!!(x.nb||x.label));
    const equipe=liste('equipe',APROPOS_DEMO.equipe,(x)=>!!(x.prenom||x.poste));
    const t=(cle:string,defaut:string)=>(typeof ap[cle]==='string'&&ap[cle].trim())?ap[cle].trim():defaut;
    const couleursEquipe=[cp,'#818cf8','#34d399'];
    const lblStyle:React.CSSProperties={ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 };
    return (
    <div style={{ maxWidth:1100,margin:'0 auto',padding:'40px 24px' }}>
      <div style={lblStyle}>✦ {t('sousTitre','Notre histoire')}</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:48 }}>{t('titre','À propos de nous')}</h1>

      {/* Hero à propos */}
      <div style={{ background:`linear-gradient(135deg,${SURF},${SURF2})`,border:`1px solid ${BORD}`,borderRadius:20,padding:isMobile?'32px 24px':'56px 64px',marginBottom:64,position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:`${cp}08`,border:`1px solid ${BORD}` }}/>
        <div style={{ position:'absolute',bottom:-60,left:-20,width:150,height:150,borderRadius:'50%',background:`${cp}05` }}/>
        <div style={{ position:'relative',maxWidth:640 }}>
          <div style={{ width:48,height:3,background:`linear-gradient(90deg,${cp},transparent)`,marginBottom:24,borderRadius:2 }}/>
          <p style={{ fontSize:isMobile?18:24,fontWeight:700,color:'#fff',lineHeight:1.6,margin:'0 0 20px' }}>{t('accroche',APROPOS_DEMO.accroche)}</p>
          <p style={{ fontSize:15,color:'#888',lineHeight:1.9,margin:0,whiteSpace:'pre-line' }}>{cfg.description||APROPOS_DEMO.description}</p>
        </div>
      </div>

      {/* Valeurs */}
      {ap.afficherValeurs!==false&&(
      <div style={{ marginBottom:64 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={lblStyle}>✦ {t('valeursSurtitre','Nos valeurs')}</div>
          <h2 style={{ fontSize:isMobile?24:36,fontWeight:900,color:'#fff',margin:0 }}>{t('valeursTitre','Ce qui nous définit')}</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
          {valeurs.map((v:any,i:number)=>(
            <div key={i} style={{ background:SURF,border:`1px solid #222`,borderRadius:16,padding:'28px 24px',transition:'border-color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=BORD}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor='#222'}>
              {v.ico&&<div style={{ width:52,height:52,borderRadius:14,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:18 }}>{v.ico}</div>}
              <h3 style={{ fontSize:17,fontWeight:800,color:'#fff',marginBottom:12 }}>{v.titre}</h3>
              <p style={{ fontSize:14,color:'#777',lineHeight:1.8,margin:0 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>)}

      {/* Chiffres */}
      {ap.afficherChiffres!==false&&(
      <div style={{ background:`linear-gradient(135deg,${SURF},${SURF2})`,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}`,padding:'48px 24px',marginBottom:64,borderRadius:16 }}>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:32,textAlign:'center' }}>
          {chiffres.map((x:any,i:number)=>(
            <div key={i}>
              <div style={{ fontSize:isMobile?32:44,fontWeight:900,color:cp,marginBottom:8,letterSpacing:'-0.02em' }}>{x.nb}</div>
              <div style={{ fontSize:13,color:'#666',fontWeight:500 }}>{x.label}</div>
            </div>
          ))}
        </div>
      </div>)}

      {/* Équipe */}
      {ap.afficherEquipe!==false&&(
      <div style={{ marginBottom:64 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={lblStyle}>✦ {t('equipeSurtitre',"L'équipe")}</div>
          <h2 style={{ fontSize:isMobile?24:36,fontWeight:900,color:'#fff',margin:0 }}>{t('equipeTitre','Les visages derrière la boutique')}</h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:20 }}>
          {equipe.map((m:any,i:number)=>{ const col=couleursEquipe[i%3]; const photo=/^https?:\/\//i.test(m.photo||'')?m.photo:''; return (
            <div key={i} style={{ background:SURF,border:`1px solid #222`,borderRadius:16,padding:'28px 24px',textAlign:'center' }}>
              {photo
                ? <img src={photo} alt={m.prenom||''} style={{ width:72,height:72,borderRadius:'50%',objectFit:'cover',margin:'0 auto 16px',display:'block',boxShadow:`0 4px 20px ${col}30` }}/>
                : <div style={{ width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${col},${col}88)`,margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:900,color:col===cp?'#000':'#fff',boxShadow:`0 4px 20px ${col}30` }}>{(m.prenom||'?').charAt(0).toUpperCase()}</div>}
              <div style={{ fontSize:17,fontWeight:700,color:'#fff',marginBottom:6 }}>{m.prenom}</div>
              <div style={{ fontSize:13,color:col,fontWeight:600 }}>{m.poste}</div>
            </div>
          ); })}
        </div>
      </div>)}

      {/* Bloc final */}
      {ap.afficherCta!==false&&(
      <div style={{ textAlign:'center',padding:'56px 24px',background:`linear-gradient(135deg,${SURF},${NOIR})`,borderRadius:20,border:`1px solid ${BORD}` }}>
        <div style={{ ...lblStyle,marginBottom:16 }}>✦ {t('ctaSurtitre','Rejoignez-nous')}</div>
        <h2 style={{ fontSize:isMobile?24:36,fontWeight:900,color:'#fff',marginBottom:14 }}>{t('ctaTitre','Prêt à découvrir notre sélection ?')}</h2>
        <p style={{ fontSize:15,color:'#888',marginBottom:32,maxWidth:480,margin:'0 auto 32px' }}>{t('ctaTexte',"Des produits d'exception vous attendent. Commencez votre expérience premium dès aujourd'hui.")}</p>
        <div style={{ display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={()=>naviguer('catalogue')} style={{ background:`linear-gradient(135deg,${cp},${OR2})`,color:'#000',border:'none',borderRadius:10,padding:'14px 32px',fontSize:15,fontWeight:800,cursor:'pointer',letterSpacing:'0.05em' }}>{t('ctaBoutonCatalogue','Voir notre catalogue →')}</button>
          <button onClick={()=>naviguer('contact')} style={{ padding:'14px 28px',background:'none',border:`1px solid ${BORD}`,borderRadius:10,color:'rgba(255,255,255,0.7)',fontSize:15,cursor:'pointer' }}>{t('ctaBoutonContact','Nous contacter')}</button>
        </div>
      </div>)}
    </div>
    );
  };

  const PagePolitique = () => {
    const contenu=politique&&politique.contenu.trim()?htmlSur(politique.contenu):'';
    return (
      <div style={{ maxWidth:860,margin:'0 auto',padding:'40px 24px' }}>
        <style>{`.pol-contenu h1{font-size:30px;font-weight:900;color:#fff;margin:0 0 20px;line-height:1.2}.pol-contenu h2{font-size:20px;font-weight:800;color:#fff;margin:32px 0 10px}.pol-contenu h3{font-size:16px;font-weight:700;color:#fff;margin:22px 0 8px}.pol-contenu p{color:#aaa;line-height:1.9;margin:0 0 14px;font-size:15px}.pol-contenu ul,.pol-contenu ol{color:#aaa;padding-left:22px;margin:0 0 14px}.pol-contenu li{line-height:1.8;margin-bottom:6px;font-size:15px}.pol-contenu a{color:${cp};text-decoration:underline}.pol-contenu strong{color:#fff}.pol-contenu blockquote{border-left:3px solid ${cp};padding:8px 18px;margin:16px 0;color:#bbb}.pol-contenu hr{border:0;border-top:1px solid ${BORD};margin:24px 0}`}</style>
        <button onClick={()=>naviguer('accueil')} style={{ background:'none',border:'none',color:cp,fontSize:14,cursor:'pointer',marginBottom:28,padding:0 }}>← Retour à l'accueil</button>
        {politiqueStatut==='loading'&&<p style={{ color:'#666' }}>Chargement…</p>}
        {politiqueStatut==='err'&&<p style={{ color:'#ef4444' }}>Impossible de charger cette page. Veuillez réessayer.</p>}
        {politiqueStatut==='idle'&&politique&&(contenu
          ? <div className="pol-contenu" dangerouslySetInnerHTML={{ __html:contenu }}/>
          : <><h1 style={{ fontSize:30,fontWeight:900,color:'#fff',marginBottom:16 }}>{politique.titre}</h1><p style={{ color:'#777' }}>Cette page n'a pas encore été rédigée.</p></>)}
      </div>
    );
  };

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
      <div style={{ fontSize:11,color:cp,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10 }}>✦ {tx('contact','surtitre','Contact')}</div>
      <h1 style={{ fontSize:isMobile?28:40,fontWeight:900,color:'#fff',marginBottom:tx('contact','sousTitre','')?12:48 }}>{tx('contact','titre','Nous contacter')}</h1>
      {tx('contact','sousTitre','')&&<p style={{ fontSize:16,color:'#888',marginBottom:48 }}>{tx('contact','sousTitre','')}</p>}
      <div style={{ display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:48 }}>
        <div>
          <h2 style={{ fontSize:20,fontWeight:700,color:'#fff',marginBottom:24 }}>{tx('contact','coordonneesTitre','Nos coordonnées')}</h2>
          {lignesContact.map(({ico,label,val}:any)=>(
            <div key={label} style={{ display:'flex',gap:14,marginBottom:20,alignItems:'flex-start' }}>
              <div style={{ width:40,height:40,borderRadius:10,background:`${cp}15`,border:`1px solid ${BORD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>{ico}</div>
              <div><div style={{ fontSize:12,fontWeight:700,color:'#666',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.08em' }}>{label}</div><div style={{ fontSize:14,color:'#ccc' }}>{val}</div></div>
            </div>
          ))}
          {cc.afficherCarte&&lienHttp(cc.urlCarte)&&<iframe src={lienHttp(cc.urlCarte)} title="Carte" loading="lazy" style={{ width:'100%',height:220,border:0,borderRadius:12,marginTop:8 }}/>}
        </div>
        <div>
          {contactStatut==='ok' ? <div style={{ background:'rgba(74,222,128,0.1)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:16,padding:40,textAlign:'center' }}><div style={{ fontSize:48,marginBottom:16 }}>✅</div><h3 style={{ color:'#4ade80',marginBottom:8 }}>{tx('contact','succesTitre','Message envoyé !')}</h3><p style={{ color:'#888' }}>{tx('contact','succesTexte','Nous vous répondrons sous peu.')}</p></div>
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
    const pol:any={ ...CFG_DEF.footer.politiques, ...(f.politiques||{}) };
    // Un lien légal n'apparaît que si le gestionnaire a rédigé cette politique (en démonstration : tous, pour l'aperçu)
    const polVisible=(slug:string)=>modeDemo||(politiquesRedigees?politiquesRedigees[slug]===true:false);
    const liensPol=[['retour-remboursement','Retour & remboursement',pol.afficherRetours],['confidentialite','Confidentialité',pol.afficherConfidentialite],['conditions-service','Conditions de service',pol.afficherConditions],['expedition','Expédition',pol.afficherLivraison],['coordonnees','Coordonnées',pol.afficherCoordonnees],['mentions-legales','Mentions légales',pol.afficherMentions]].filter(([slug,,actif])=>actif!==false&&polVisible(slug as string));
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
            {['1','2','3'].map(n=>(f.colonnes[`titre${n}`]||(n==='3'&&liensPol.length>0))?(
              <div key={n}>
                <div style={{ fontSize:11,fontWeight:700,color:cp,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:18 }}>{f.colonnes[`titre${n}`]||'Légal'}</div>
                {(f.colonnes[`liens${n}`]||'').split('\n').filter((l:string)=>l.trim()&&!slugPolitique(l)).map((l:string,i:number)=>(
                  <div key={i} style={{ marginBottom:10 }}><button onClick={()=>naviguer(l.toLowerCase())} style={{ background:'none',border:'none',color:'#555',fontSize:13,cursor:'pointer',padding:0,textAlign:'left' }} onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color=cp} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='#555'}>{l}</button></div>
                ))}
                {n==='3'&&liensPol.map(([slug,label])=>(<div key={slug as string} style={{ marginBottom:10 }}><button onClick={()=>naviguer(slug as string)} style={{ background:'none',border:'none',color:'#555',fontSize:13,cursor:'pointer',padding:0,textAlign:'left' }} onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color=cp} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='#555'}>{label}</button></div>))}
              </div>
            ):null)}
          </div>
          <div style={{ borderTop:`1px solid rgba(201,169,110,0.1)`,padding:'20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
            <div style={{ fontSize:12,color:'#333' }}>© {new Date().getFullYear()} {f.nomBoutique}. Tous droits réservés.</div>
            {f.afficherPropulse&&<a href="https://e-vend.ca" target="_blank" rel="noopener noreferrer" style={{ fontSize:10,color:'#2a2a2a',textDecoration:'none' }}>Propulsé par e-Vend Studio</a>}
          </div>
        </div>
      </footer>
    );
  };

  // Espace acheteur : plein écran, comme AppAcheteur (MV) — il a son propre menu et son bouton « Retour à la boutique »
  if(page==='compte') return <AppAcheteurBoutique key={vueCompte} vendeurId={vendeurId} pageInitiale={vueCompte} config={{ couleur_accent:cp, nom_boutique:cfg.nomBoutique, gestionnaire_id:vendeurId }} naviguerTemplate={(d:any)=>{ setVueCompte('dashboard'); if(d&&d.page==='produit'){ ouvrirProduitParId(d.produitId); return; } naviguer(d&&d.page?d.page:'accueil'); }} />;

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif",background:cfg.couleurFond,color:cfg.couleurTexte,minHeight:'100vh',display:'flex',flexDirection:'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0;}button{font-family:inherit;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:${NOIR};}::-webkit-scrollbar-thumb{background:${BORD};border-radius:3px;}`}</style>

      {cfg.afficherTicker&&<Ticker texte={cfg.tickerTexte} couleur={cp}/>}
      <Nav/>
      {avisPanier&&<div style={{ position:'fixed',top:84,left:'50%',transform:'translateX(-50%)',zIndex:300,background:SURF,border:`1px solid ${cp}`,color:'#fff',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:600,boxShadow:'0 8px 30px rgba(0,0,0,0.5)' }}>{avisPanier}</div>}
      {modeDemo&&cfg.afficherNotifVente&&page==='accueil'&&<NotifVente cp={cp}/>}
      <BoutiqueSouhaitsAcces gestionnaireId={vendeurId} connecte={!!acheteur} demo={produitsDemo} ouvrir={ouvrirSouhaits} variante="flottant"/>
      <BoutiqueFavorisToast gestionnaireId={vendeurId} connecte={!!acheteur} demo={produitsDemo}/>

      <main style={{ flex:1 }}>
        {page==='accueil'   && <PageAccueil/>}
        {page==='catalogue' && <PageCatalogue/>}
        {page==='offres'    && <PageOffres/>}
        {page==='encheres'  && <PageEncheres/>}
        {page==='produit'   && <PageProduit/>}
        {page==='blog'      && <PageBlog/>}
        {page==='article'   && <PageArticle/>}
        {page==='faq'       && <PageFaq/>}
        {page==='a-propos'   && <PageAPropos/>}
        {page==='contact'   && <PageContact/>}
        {page==='politique' && PagePolitique()}
        {page==='login'     && PageLogin()}
        {page==='inscription' && PageInscription()}
      </main>

      <Footer/>
    </div>
  );
}