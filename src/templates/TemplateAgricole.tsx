// src/templates/TemplateAgricole.tsx
// e-Vend Studio — Template GRATUIT — Boutique Agricole
// Style sombre terroir (#1a1612), doré (#c9854a), texte crème (#f5ede0)

import { useState, useEffect, useCallback } from 'react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ProduitAgricole {
  id: string; nom: string; prix: number; unite: string;
  categorie: string; methode: string; photo: string;
  description: string; disponible: boolean; vedette: boolean;
}

export interface EngagementFerme { icone: string; titre: string; description: string; }

export interface SectionConfig { id: string; actif: boolean; ordre: number; label: string; }

export interface ConfigAgricole {
  nomFerme: string; sloganFerme: string; logoUrl: string;
  couleurAccent: string; couleurFond: string; couleurTexte: string;
  police: 'cursive' | 'serif' | 'moderne';
  heroTitre1: string; heroTitre2: string; heroDescription: string;
  heroBouton: string; heroPhoto: string; heroSousTitre: string;
  produitsTitre: string; produitsSousTitre: string;
  produits: ProduitAgricole[];
  philosophieTitre: string; philosophiePhoto: string;
  engagements: EngagementFerme[];
  fermeHistoireTitre: string; fermeHistoireSousTitre: string;
  fermeHistoireTextes: string[]; fermeHistoirePhoto: string;
  fermeEngagementsTitre: string; fermeEngagementsSousTitre: string;
  fermeVisiteTitre: string; fermeVisiteTexte: string;
  fermeAdresse: string; fermeHoraires: string; fermeCp: string; fermeVille: string;
  adresse: string; telephone: string; email: string; heures: string;
  copyright: string; sloganFooter: string;
  vendeurId?: number;
  sections: SectionConfig[];
}

// ─── CONFIG DÉFAUT ────────────────────────────────────────────────────────────

const PRODUITS_DEFAUT: ProduitAgricole[] = [
  { id:'p1', nom:'Tomates Anciennes',   prix:4.50, unite:'kg',    categorie:'Légumes', methode:'Pleine Terre', photo:'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=600',  description:'Variétés anciennes cultivées en pleine terre. Saveur incomparable, zéro pesticide.', disponible:true, vedette:true  },
  { id:'p2', nom:'Carottes Violettes',  prix:3.80, unite:'kg',    categorie:'Légumes', methode:'Pleine Terre', photo:'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=600',  description:'Carottes violettes à la chair sucrée, riches en antioxydants.',                     disponible:true, vedette:true  },
  { id:'p3', nom:'Chou Kale',           prix:3.20, unite:'botte', categorie:'Légumes', methode:'Permaculture',  photo:'https://images.pexels.com/photos/5529621/pexels-photo-5529621.jpeg?auto=compress&cs=tinysrgb&w=600', description:'Kale frisé, récolté à maturité. Parfait en smoothie ou sauté.',                     disponible:true, vedette:false },
  { id:'p4', nom:'Radis Rose',          prix:1.80, unite:'botte', categorie:'Légumes', methode:'Pleine Terre', photo:'https://images.pexels.com/photos/4022097/pexels-photo-4022097.jpeg?auto=compress&cs=tinysrgb&w=600',  description:"Radis croquants et piquants. Récoltés chaque matin à l'aube.",                        disponible:true, vedette:false },
  { id:'p5', nom:'Courgettes & Fleurs', prix:3.50, unite:'kg',    categorie:'Légumes', methode:'Sous Serre',   photo:'https://images.pexels.com/photos/128420/pexels-photo-128420.jpeg?auto=compress&cs=tinysrgb&w=600',   description:'Courgettes avec leurs fleurs comestibles — un délice estival.',                      disponible:true, vedette:true  },
  { id:'p6', nom:"Bouquet d'Herbes",    prix:2.50, unite:'botte', categorie:'Herbes',  methode:'Pleine Terre', photo:'https://images.pexels.com/photos/906150/pexels-photo-906150.jpeg?auto=compress&cs=tinysrgb&w=600',   description:'Basilic, persil, thym et ciboulette du jardin. Arômes intenses.',                    disponible:true, vedette:false },
];

export const CONFIG_AGRICOLE_DEFAUT: ConfigAgricole = {
  nomFerme:'Terra Nostra', sloganFerme:"De la Terre, pour l'Âme", logoUrl:'',
  couleurAccent:'#c9854a', couleurFond:'#1a1612', couleurTexte:'#f5ede0',
  police:'cursive',
  heroTitre1:'De la Terre,', heroTitre2:"pour l'Âme",
  heroDescription:'Des légumes cultivés avec soin, récoltés au petit matin, pour une fraîcheur incomparable à votre table.',
  heroBouton:'Découvrir nos récoltes', heroSousTitre:'FRAÎCHAGE · DE LA TERRE · RÉCOLTE DU JOUR',
  heroPhoto:'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=1600',
  produitsTitre:'Nos Produits', produitsSousTitre:'RÉCOLTE DU MOMENT',
  produits:PRODUITS_DEFAUT,
  philosophieTitre:'Le goût authentique de la terre',
  philosophiePhoto:'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=1600',
  engagements:[
    { icone:'🌿', titre:'Pleine Terre',    description:'Nos légumes poussent en plein air, dans un sol vivant nourri au compost.' },
    { icone:'☀️', titre:'Récolte du Jour', description:'Cueillis au petit matin pour préserver toute leur fraîcheur et saveur.' },
    { icone:'🌱', titre:'Sans Pesticide',  description:'Aucun produit chimique. Seule la nature fait le travail.' },
  ],
  fermeHistoireTitre:'Une passion transmise de génération en génération',
  fermeHistoireSousTitre:"L'HISTOIRE",
  fermeHistoireTextes:[
    "Installés sur nos terres depuis trois générations, nous cultivons avec le même respect pour la terre et les saisons. Notre ferme s'étend sur 5 hectares de pleine terre, au cœur du Québec.",
    "Chaque matin, dès l'aube, nous récoltons à la main les légumes qui seront sur votre table le jour même. Pas de chambre froide, pas de longue conservation — juste la fraîcheur du champ à l'assiette.",
    "Nous travaillons en harmonie avec les cycles naturels, sans aucun pesticide ni engrais chimique. Le compost, les rotations de cultures et la biodiversité sont nos meilleurs alliés.",
  ],
  fermeHistoirePhoto:'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=800',
  fermeEngagementsTitre:'Ce en quoi nous croyons', fermeEngagementsSousTitre:'NOS ENGAGEMENTS',
  fermeVisiteTitre:'Venez à la ferme',
  fermeVisiteTexte:'Nous accueillons les visiteurs les mercredis et samedis matin de 8h à 12h. Venez découvrir nos parcelles, rencontrer nos plants et repartir avec un panier de produits fraîchement cueillis.',
  fermeAdresse:'1234 rang de la Rivière', fermeHoraires:'Mercredi & Samedi · 8h – 12h',
  fermeCp:'J0E 2B0', fermeVille:'Saint-Jean-sur-Richelieu, QC',
  adresse:'1234 rang de la Rivière, Saint-Jean-sur-Richelieu, QC',
  telephone:'(450) 555-1234', email:'contact@terranostra.ca', heures:'Mer & Sam : 8h – 12h',
  copyright:'© 2026 TERRA NOSTRA — TOUS DROITS RÉSERVÉS',
  sloganFooter:'Produits maraîchers cultivés avec passion, récoltés à la main, livrés à votre table.',
  sections: [
    { id:'hero',        actif:true, ordre:1, label:'Hero plein écran' },
    { id:'engagements', actif:true, ordre:2, label:'Nos engagements' },
    { id:'produits',    actif:true, ordre:3, label:'Produits vedettes' },
    { id:'philosophie', actif:true, ordre:4, label:'Philosophie' },
    { id:'contact',     actif:true, ordre:5, label:'Contact & Heures' },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getPolice(p: string) {
  if (p === 'serif')   return "'Cormorant Garamond', Georgia, serif";
  if (p === 'moderne') return "'Inter', system-ui, sans-serif";
  return "'Dancing Script', cursive";
}

interface LignePanier { produit: ProduitAgricole; quantite: number; }

// ─── MODAL PRODUIT ────────────────────────────────────────────────────────────

function ModalProduit({ produit, cp, police, onClose, onAjouter }: {
  produit: ProduitAgricole; cp: string; police: string;
  onClose: () => void; onAjouter: (p: ProduitAgricole, q: number) => void;
}) {
  const [quantite, setQuantite] = useState(1);
  const FOND = '#241e18';
  const TEXTE = '#f5ede0';
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:FOND, borderRadius:16, width:'100%', maxWidth:680, overflow:'hidden', display:'flex', flexDirection:'row', boxShadow:'0 24px 64px rgba(0,0,0,0.7)', border:`1px solid ${cp}33` }}>
        {/* Photo */}
        <div style={{ flex:'0 0 45%', minHeight:320, overflow:'hidden', background:'#2a1f14' }}>
          <img src={produit.photo} alt={produit.nom} style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:320, display:'block' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        </div>
        {/* Infos */}
        <div style={{ flex:1, padding:'32px 28px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'none', border:'none', color:TEXTE+'66', fontSize:22, cursor:'pointer' }}>✕</button>
          <div>
            <p style={{ fontSize:11, color:cp, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:10 }}>{produit.categorie}</p>
            <h2 style={{ fontFamily:police, fontSize:28, fontWeight:400, color:TEXTE, marginBottom:12 }}>{produit.nom}</h2>
            <p style={{ fontSize:22, color:cp, fontWeight:700, marginBottom:16 }}>{produit.prix.toFixed(2)} $ / {produit.unite}</p>
            <p style={{ fontSize:14, color:TEXTE+'bb', lineHeight:1.7, marginBottom:16 }}>{produit.description}</p>
            <span style={{ fontSize:11, background:cp+'22', color:cp, padding:'4px 12px', borderRadius:20, fontWeight:600 }}>{produit.methode}</span>
          </div>
          <div style={{ marginTop:24 }}>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
              <button onClick={() => setQuantite(Math.max(1, quantite-1))} style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${cp}55`, background:'transparent', color:TEXTE, fontSize:18, cursor:'pointer' }}>−</button>
              <span style={{ fontWeight:700, color:TEXTE, minWidth:28, textAlign:'center' as const }}>{quantite}</span>
              <button onClick={() => setQuantite(quantite+1)} style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${cp}55`, background:'transparent', color:TEXTE, fontSize:18, cursor:'pointer' }}>+</button>
              <span style={{ fontSize:13, color:TEXTE+'66' }}>{produit.unite}(s)</span>
            </div>
            <button onClick={() => { onAjouter(produit, quantite); onClose(); }}
              style={{ width:'100%', background:cp, color:'#1a1612', border:'none', borderRadius:8, padding:'13px', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
              Ajouter au panier — {(produit.prix * quantite).toFixed(2)} $
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DRAWER PANIER ────────────────────────────────────────────────────────────

function DrawerPanier({ lignes, onClose, onModifier, onSupprimer, cp }: {
  lignes: LignePanier[]; onClose: () => void;
  onModifier: (id:string, q:number) => void; onSupprimer: (id:string) => void; cp: string;
}) {
  const FOND = '#1e1912'; const TEXTE = '#f5ede0';
  const total = lignes.reduce((acc, l) => acc + l.produit.prix * l.quantite, 0);
  const [commande, setCommande] = useState(false);
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:300 }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:380, background:FOND, zIndex:301, display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.5)', border:`1px solid ${cp}22` }}>
        {/* Header */}
        <div style={{ padding:'24px 24px 16px', borderBottom:`1px solid ${cp}22`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:"'Dancing Script', cursive", fontSize:28, fontWeight:400, color:TEXTE }}>Votre Panier</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:TEXTE+'66', fontSize:22, cursor:'pointer' }}>✕</button>
        </div>
        {/* Lignes */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {lignes.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:60 }}>
              <p style={{ fontSize:36, marginBottom:16 }}>🧺</p>
              <p style={{ fontFamily:"'Dancing Script', cursive", fontSize:22, color:TEXTE+'88', marginBottom:10 }}>Votre panier est vide</p>
              <p style={{ fontSize:13, color:cp, cursor:'pointer' }} onClick={onClose}>Explorez nos récoltes →</p>
            </div>
          ) : lignes.map(ligne => (
            <div key={ligne.produit.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${cp}18` }}>
              <div style={{ width:60, height:60, borderRadius:8, overflow:'hidden', flexShrink:0, background:'#2a1f14' }}>
                <img src={ligne.produit.photo} alt={ligne.produit.nom} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:600, color:TEXTE, fontSize:14, marginBottom:2 }}>{ligne.produit.nom}</p>
                <p style={{ fontSize:12, color:TEXTE+'66' }}>{ligne.produit.prix.toFixed(2)} $ / {ligne.produit.unite}</p>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                  <button onClick={() => onModifier(ligne.produit.id, ligne.quantite-1)} style={{ width:22, height:22, borderRadius:'50%', border:`1px solid ${cp}55`, background:'transparent', color:TEXTE, fontSize:14, cursor:'pointer', lineHeight:'1' }}>−</button>
                  <span style={{ fontSize:13, color:TEXTE, minWidth:16, textAlign:'center' as const }}>{ligne.quantite}</span>
                  <button onClick={() => onModifier(ligne.produit.id, ligne.quantite+1)} style={{ width:22, height:22, borderRadius:'50%', border:`1px solid ${cp}55`, background:'transparent', color:TEXTE, fontSize:14, cursor:'pointer', lineHeight:'1' }}>+</button>
                </div>
              </div>
              <div style={{ textAlign:'right' as const, flexShrink:0 }}>
                <p style={{ fontWeight:700, color:cp, fontSize:14 }}>{(ligne.produit.prix * ligne.quantite).toFixed(2)} $</p>
                <button onClick={() => onSupprimer(ligne.produit.id)} style={{ fontSize:11, color:TEXTE+'44', background:'none', border:'none', cursor:'pointer', marginTop:4 }}>Retirer</button>
              </div>
            </div>
          ))}
        </div>
        {/* Footer panier */}
        {lignes.length > 0 && (
          <div style={{ padding:'16px 24px', borderTop:`1px solid ${cp}22` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontSize:15, color:TEXTE+'88' }}>Total</span>
              <span style={{ fontSize:22, fontWeight:800, color:cp }}>{total.toFixed(2)} $</span>
            </div>
            {!commande ? (
              <button onClick={() => setCommande(true)} style={{ width:'100%', background:cp, color:'#1a1612', border:'none', borderRadius:8, padding:'14px', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'Inter, sans-serif', marginBottom:10 }}>
                Commander — {total.toFixed(2)} $
              </button>
            ) : (
              <div style={{ background:cp+'18', border:`1px solid ${cp}44`, borderRadius:10, padding:'16px', textAlign:'center' as const }}>
                <p style={{ fontSize:22, marginBottom:8 }}>✅</p>
                <p style={{ fontFamily:"'Dancing Script', cursive", fontSize:18, color:TEXTE, marginBottom:6 }}>Commande reçue !</p>
                <p style={{ fontSize:13, color:TEXTE+'88', lineHeight:1.6 }}>Notre équipe vous contactera pour confirmer votre commande et organiser le ramassage ou la livraison.</p>
              </div>
            )}
            <p style={{ fontSize:11, color:TEXTE+'33', textAlign:'center' as const, marginTop:8 }}>Paiement sécurisé Stripe bientôt disponible.</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── CARTE PRODUIT ────────────────────────────────────────────────────────────

function CarteProduit({ produit, cp, police, onClick, onAjouter }: {
  produit: ProduitAgricole; cp: string; police: string;
  onClick: () => void; onAjouter: (p:ProduitAgricole, q:number) => void;
}) {
  return (
    <div onClick={onClick} style={{ background:'rgba(255,255,255,0.04)', borderRadius:4, overflow:'hidden', cursor:'pointer', border:'1px solid rgba(255,255,255,0.06)', position:'relative' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${cp}55`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.06)'; }}>
      {/* Photo */}
      <div style={{ aspectRatio:'4/3', overflow:'hidden', background:'#2a1f14', position:'relative' }}>
        <img src={produit.photo} alt={produit.nom} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.4s' }}
          onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
          onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
        {/* Badge catégorie */}
        <div style={{ position:'absolute', top:12, left:12, background:'rgba(26,22,18,0.85)', backdropFilter:'blur(4px)', padding:'4px 10px', borderRadius:3 }}>
          <span style={{ fontSize:10, fontFamily:'Inter, sans-serif', letterSpacing:'0.12em', color:'#f5ede0cc', fontWeight:600, textTransform:'uppercase' as const }}>{produit.categorie}</span>
        </div>
        {/* Bouton + rapide */}
        <button onClick={e => { e.stopPropagation(); onAjouter(produit, 1); }}
          style={{ position:'absolute', bottom:12, right:12, width:36, height:36, borderRadius:'50%', background:cp, border:'none', color:'#1a1612', fontSize:20, cursor:'pointer', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.4)', opacity:0, transition:'opacity 0.25s' }}
          onMouseEnter={e => { (e.currentTarget).style.opacity='1'; }}
          className="btn-plus">
          +
        </button>
      </div>
      {/* Infos */}
      <div style={{ padding:'14px 4px 6px' }}>
        <h3 style={{ fontFamily:police, fontSize:20, fontWeight:400, color:produit.vedette ? cp : '#f5ede0', fontStyle:produit.vedette ? 'italic' : 'normal', marginBottom:6 }}>{produit.nom}</h3>
        <p style={{ fontSize:15, color:cp, fontWeight:700, marginBottom:4 }}>
          {produit.prix.toFixed(2)} $ <span style={{ fontSize:12, color:'rgba(245,237,224,0.5)', fontWeight:400, fontFamily:'Inter, sans-serif' }}>/ {produit.unite}</span>
        </p>
        <p style={{ fontSize:10, fontFamily:'Inter, sans-serif', letterSpacing:'0.12em', color:'rgba(245,237,224,0.38)', textTransform:'uppercase' as const }}>{produit.methode}</p>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

interface Props { config?: Partial<ConfigAgricole>; siteId?: number; vendeurId?: number; }

export default function TemplateAgricole({ config: configProp }: Props) {
  const config = { ...CONFIG_AGRICOLE_DEFAUT, ...configProp };
  const sectionsActives = [...(config.sections||CONFIG_AGRICOLE_DEFAUT.sections)].filter(s=>s.actif).sort((a,b)=>a.ordre-b.ordre);
  const showSec = (id: string) => sectionsActives.some(s=>s.id===id);
  const cp = config.couleurAccent;   // '#c9854a'
  const cf = config.couleurFond;     // '#1a1612'
  const ct = config.couleurTexte;    // '#f5ede0'
  const police = getPolice(config.police);

  const [page, setPage]                 = useState<'accueil'|'produits'|'ferme'>('accueil');
  const [filtre, setFiltre]             = useState('Tous');
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [produitActif, setProduitActif] = useState<ProduitAgricole | null>(null);
  const [lignes, setLignes]             = useState<LignePanier[]>([]);
  const [isMobile, setIsMobile]         = useState(false);
  const [menuOuvert, setMenuOuvert]     = useState(false);
  const [flash, setFlash]               = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { window.scrollTo({ top:0, behavior:'smooth' }); }, [page]);

  const nbArticles = lignes.reduce((acc, l) => acc + l.quantite, 0);

  const ajouterAuPanier = useCallback((produit: ProduitAgricole, quantite: number) => {
    setLignes(prev => {
      const existe = prev.find(l => l.produit.id === produit.id);
      if (existe) return prev.map(l => l.produit.id === produit.id ? { ...l, quantite: l.quantite + quantite } : l);
      return [...prev, { produit, quantite }];
    });
    setFlash(`✓ ${produit.nom} ajouté au panier`);
    setTimeout(() => setFlash(''), 2500);
  }, []);

  const modifierQuantite = useCallback((id: string, q: number) => {
    if (q <= 0) setLignes(prev => prev.filter(l => l.produit.id !== id));
    else setLignes(prev => prev.map(l => l.produit.id === id ? { ...l, quantite: q } : l));
  }, []);

  const categories = ['Tous', ...Array.from(new Set(config.produits.map(p => p.categorie)))];
  const produitsFiltres = filtre === 'Tous' ? config.produits : config.produits.filter(p => p.categorie === filtre);

  const navItems = [
    { label:'ACCUEIL',      page:'accueil'  as const },
    { label:'NOS PRODUITS', page:'produits' as const },
    { label:'NOTRE FERME',  page:'ferme'    as const },
  ];

  // Style de base — TOUT le template sur fond sombre
  const baseStyle: React.CSSProperties = { background: cf, color: ct, minHeight: '100vh', fontFamily: "'Cormorant Garamond', Georgia, serif" };

  return (
    <div style={baseStyle}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap" />
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        img { display:block; }
        .nav-link { transition:color .2s; cursor:pointer; }
        .nav-link:hover { color:${cp} !important; }
        .nav-link.active { color:${cp} !important; border-bottom:1px solid ${cp}; padding-bottom:2px; }
        .produit-card:hover .btn-plus { opacity:1 !important; }
        @keyframes slide-in { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
        .flash { animation:slide-in .3s ease; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${cp}; border-radius:2px; }
      `}</style>

      {/* Flash */}
      {flash && (
        <div className="flash" style={{ position:'fixed', top:80, right:20, background:cp, color:'#1a1612', padding:'10px 20px', borderRadius:8, fontSize:13, fontWeight:700, zIndex:500, boxShadow:'0 4px 16px rgba(0,0,0,0.4)', fontFamily:'Inter, sans-serif' }}>
          {flash}
        </div>
      )}

      {/* ── NAVBAR ────────────────────────────────────────────────────────────── */}
      <nav style={{ position:'fixed', top:0, width:'100%', zIndex:200, background:`${cf}f2`, backdropFilter:'blur(12px)', borderBottom:`1px solid ${cp}18` }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 28px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:police, fontSize:24, fontWeight:400, color:ct, cursor:'pointer' }} onClick={() => setPage('accueil')}>{config.nomFerme}</span>
          {!isMobile && (
            <div style={{ display:'flex', gap:40 }}>
              {navItems.map(item => (
                <span key={item.page} className={`nav-link ${page===item.page?'active':''}`} onClick={() => setPage(item.page)}
                  style={{ fontSize:11, fontFamily:'Inter, sans-serif', fontWeight:600, letterSpacing:'0.15em', color:page===item.page ? cp : ct+'88' }}>
                  {item.label}
                </span>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            {isMobile && <button onClick={() => setMenuOuvert(!menuOuvert)} style={{ background:'none', border:'none', color:ct, fontSize:20, cursor:'pointer' }}>☰</button>}
            <button onClick={() => setPanierOuvert(true)} style={{ position:'relative', background:'none', border:'none', cursor:'pointer', color:ct, fontSize:22 }}>
              🧺
              {nbArticles > 0 && (
                <span style={{ position:'absolute', top:-8, right:-10, background:cp, color:'#1a1612', borderRadius:'50%', width:18, height:18, fontSize:10, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter, sans-serif' }}>
                  {nbArticles}
                </span>
              )}
            </button>
          </div>
        </div>
        {isMobile && menuOuvert && (
          <div style={{ background:cf, borderTop:`1px solid ${cp}18`, padding:'12px 28px' }}>
            {navItems.map(item => (
              <div key={item.page} onClick={() => { setPage(item.page); setMenuOuvert(false); }}
                style={{ padding:'12px 0', fontSize:12, fontFamily:'Inter, sans-serif', fontWeight:600, letterSpacing:'0.15em', color:page===item.page ? cp : ct+'aa', cursor:'pointer', borderBottom:`1px solid ${cp}15` }}>
                {item.label}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Modaux */}
      {panierOuvert && <DrawerPanier lignes={lignes} onClose={() => setPanierOuvert(false)} onModifier={modifierQuantite} onSupprimer={id => setLignes(prev => prev.filter(l => l.produit.id !== id))} cp={cp} />}
      {produitActif && <ModalProduit produit={produitActif} cp={cp} police={police} onClose={() => setProduitActif(null)} onAjouter={ajouterAuPanier} />}

      {/* ═══════════════════════════════ PAGE ACCUEIL ═══════════════════════════ */}
      {page === 'accueil' && (
        <div>
          {/* HERO */}
          {showSec('hero') && <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', paddingTop:64, overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0 }}>
              <img src={config.heroPhoto} alt="hero" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e => { (e.target as HTMLImageElement).style.background='#2a1f14'; }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(26,22,18,0.5) 0%, rgba(26,22,18,0.65) 50%, rgba(26,22,18,0.95) 100%)' }} />
            </div>
            <div style={{ position:'relative', zIndex:2, maxWidth:800, padding:'0 24px' }}>
              <p style={{ fontSize:10, fontFamily:'Inter, sans-serif', letterSpacing:'0.3em', color:`${cp}99`, marginBottom:28, textTransform:'uppercase' as const }}>{config.heroSousTitre}</p>
              <h1 style={{ fontFamily:police, fontSize:'clamp(52px, 9vw, 96px)', fontWeight:400, color:ct, lineHeight:1.05, marginBottom:4 }}>{config.heroTitre1}</h1>
              <h1 style={{ fontFamily:police, fontSize:'clamp(52px, 9vw, 96px)', fontWeight:400, color:cp, lineHeight:1.05, marginBottom:30, fontStyle:'italic' }}>{config.heroTitre2}</h1>
              <p style={{ fontSize:'clamp(14px, 1.8vw, 17px)', color:`${ct}cc`, maxWidth:540, margin:'0 auto 36px', lineHeight:1.8, fontFamily:'Inter, sans-serif' }}>{config.heroDescription}</p>
              <button onClick={() => setPage('produits')} style={{ background:'transparent', color:ct, border:`1px solid ${cp}88`, borderRadius:30, padding:'14px 36px', fontSize:12, fontFamily:'Inter, sans-serif', fontWeight:600, letterSpacing:'0.15em', cursor:'pointer', textTransform:'uppercase' as const }}>
                {config.heroBouton} ↓
              </button>
            </div>
            <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', width:1, height:60, background:`linear-gradient(to bottom, transparent, ${cp}66)` }} />
          </section>

          }{/* fin hero */}

          {/* PRODUITS VEDETTES */}
          <section style={{ background:cf, padding:isMobile ? '64px 24px' : '80px 64px' }}>
            <div style={{ maxWidth:1280, margin:'0 auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:40, flexWrap:'wrap', gap:12 }}>
                <div>
                  <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.2em', color:cp, textTransform:'uppercase' as const, marginBottom:8 }}>{config.produitsSousTitre}</p>
                  <h2 style={{ fontFamily:police, fontSize:'clamp(28px, 5vw, 48px)', fontWeight:400, color:ct, fontStyle:'italic' }}>{config.produitsTitre}</h2>
                </div>
                <span onClick={() => setPage('produits')} style={{ fontSize:12, fontFamily:'Inter, sans-serif', color:cp, letterSpacing:'0.1em', cursor:'pointer', fontWeight:600 }}>VOIR TOUT →</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'280px'}, 1fr))`, gap:24 }}>
                {config.produits.filter(p => p.disponible).slice(0, 6).map(produit => (
                  <CarteProduit key={produit.id} produit={produit} cp={cp} police={police} onClick={() => setProduitActif(produit)} onAjouter={ajouterAuPanier} />
                ))}
              </div>
            </div>
          </section>

          {/* PHILOSOPHIE */}
          <section style={{ position:'relative', minHeight:400, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0 }}>
              <img src={config.philosophiePhoto} alt="philosophie" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e => { (e.target as HTMLImageElement).style.background='#2a1f14'; }} />
              <div style={{ position:'absolute', inset:0, background:'rgba(26,22,18,0.75)' }} />
            </div>
            <div style={{ position:'relative', zIndex:2, textAlign:'center', padding:'80px 24px' }}>
              <p style={{ fontSize:10, fontFamily:'Inter, sans-serif', letterSpacing:'0.2em', color:cp, textTransform:'uppercase' as const, marginBottom:20 }}>NOTRE PHILOSOPHIE</p>
              <h2 style={{ fontFamily:police, fontSize:'clamp(28px, 5vw, 56px)', fontWeight:400, color:ct, fontStyle:'italic' }}>{config.philosophieTitre}</h2>
            </div>
          </section>

          {/* ENGAGEMENTS */}
          <section style={{ background:cf, borderTop:`1px solid ${cp}22` }}>
            <div style={{ maxWidth:1280, margin:'0 auto', padding:isMobile ? '64px 24px' : '80px 64px', display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'280px'}, 1fr))`, gap:isMobile ? 40 : 0 }}>
              {config.engagements.map((e, i) => (
                <div key={i} style={{ padding:'0 40px', textAlign:'left', borderRight:!isMobile && i < config.engagements.length-1 ? `1px solid ${cp}22` : 'none' }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', border:`1px solid ${cp}55`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:22 }}>{e.icone}</div>
                  <h3 style={{ fontFamily:police, fontSize:22, fontWeight:400, color:ct, fontStyle:'italic', marginBottom:12 }}>{e.titre}</h3>
                  <p style={{ fontSize:14, color:`${ct}88`, lineHeight:1.8, fontFamily:'Inter, sans-serif' }}>{e.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════════════════════ PAGE PRODUITS ══════════════════════════ */}
      {page === 'produits' && (
        <section style={{ background:cf, minHeight:'100vh', padding:isMobile ? '88px 24px 64px' : '96px 64px 80px' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div style={{ marginBottom:40 }}>
              <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.2em', color:cp, textTransform:'uppercase' as const, marginBottom:10 }}>{config.produitsSousTitre}</p>
              <h1 style={{ fontFamily:police, fontSize:'clamp(32px, 6vw, 56px)', fontWeight:400, color:ct, fontStyle:'italic' }}>{config.produitsTitre}</h1>
            </div>
            {/* Filtres */}
            <div style={{ display:'flex', gap:10, marginBottom:40, flexWrap:'wrap' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFiltre(cat)}
                  style={{ padding:'8px 20px', border:`1px solid ${filtre===cat ? cp : cp+'44'}`, borderRadius:20, background:filtre===cat ? cp : 'transparent', color:filtre===cat ? '#1a1612' : `${ct}88`, fontSize:12, fontFamily:'Inter, sans-serif', fontWeight:600, letterSpacing:'0.1em', cursor:'pointer', transition:'all .2s' }}>
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Grille */}
            <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'280px'}, 1fr))`, gap:24 }}>
              {produitsFiltres.filter(p => p.disponible).map(produit => (
                <CarteProduit key={produit.id} produit={produit} cp={cp} police={police} onClick={() => setProduitActif(produit)} onAjouter={ajouterAuPanier} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════ PAGE NOTRE FERME ═══════════════════════ */}
      {page === 'ferme' && (
        <div style={{ background:cf }}>
          {/* Histoire */}
          <section style={{ padding:isMobile ? '88px 24px 64px' : '96px 64px' }}>
            <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', gap:64, alignItems:'flex-start', flexWrap:'wrap', flexDirection:isMobile?'column':'row' }}>
              <div style={{ flex:'1 1 380px' }}>
                <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.2em', color:cp, textTransform:'uppercase' as const, marginBottom:20 }}>{config.fermeHistoireSousTitre}</p>
                <h2 style={{ fontFamily:police, fontSize:'clamp(26px, 4vw, 44px)', fontWeight:400, color:ct, fontStyle:'italic', lineHeight:1.3, marginBottom:32 }}>{config.fermeHistoireTitre}</h2>
                {config.fermeHistoireTextes.map((texte, i) => (
                  <p key={i} style={{ fontSize:15, color:`${ct}cc`, lineHeight:1.9, marginBottom:16, fontFamily:'Inter, sans-serif' }}>{texte}</p>
                ))}
              </div>
              <div style={{ flex:'1 1 340px', borderRadius:'0 60px 0 0', overflow:'hidden', maxHeight:520 }}>
                <img src={config.fermeHistoirePhoto} alt="ferme" style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:380, display:'block' }} onError={e => { (e.target as HTMLImageElement).style.background='#2a1f14'; }} />
              </div>
            </div>
          </section>

          {/* Engagements */}
          <section style={{ background:`${cf}`, borderTop:`1px solid ${cp}22`, padding:isMobile ? '64px 24px' : '80px 64px', textAlign:'center' }}>
            <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.2em', color:cp, textTransform:'uppercase' as const, marginBottom:16 }}>{config.fermeEngagementsSousTitre}</p>
            <h2 style={{ fontFamily:police, fontSize:'clamp(26px, 4vw, 44px)', fontWeight:400, color:ct, fontStyle:'italic', marginBottom:56 }}>{config.fermeEngagementsTitre}</h2>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile?'100%':'260px'}, 1fr))`, gap:40, maxWidth:1000, margin:'0 auto', textAlign:'left' as const }}>
              {[
                { icone:'🌿', titre:'Agriculture Naturelle', desc:'Aucun pesticide, aucun engrais chimique. Un sol vivant et des insectes auxiliaires.' },
                { icone:'☀️', titre:'Circuit Court', desc:'De notre champ à votre table en quelques heures, sans intermédiaire.' },
                { icone:'💧', titre:"Gestion de l'Eau", desc:'Irrigation raisonnée par goutte-à-goutte, récupération des eaux de pluie.' },
                { icone:'📍', titre:'Terroir Local', desc:'Des variétés adaptées à notre sol et à notre climat du Québec.' },
                { icone:'🗓️', titre:'Saisonnalité', desc:'Nous ne cultivons que ce que la saison permet. Pas de forçage, pas de hors-sol.' },
                { icone:'❤️', titre:'Passion', desc:"Chaque légume est un acte d'amour envers la terre et ceux qui la dégustent." },
              ].map((e, i) => (
                <div key={i}>
                  <div style={{ width:44, height:44, borderRadius:'50%', border:`1px solid ${cp}55`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, fontSize:20 }}>{e.icone}</div>
                  <h3 style={{ fontFamily:police, fontSize:20, fontWeight:400, color:ct, fontStyle:'italic', marginBottom:10 }}>{e.titre}</h3>
                  <p style={{ fontSize:13, color:`${ct}88`, lineHeight:1.8, fontFamily:'Inter, sans-serif' }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Visite */}
          <section style={{ padding:isMobile ? '64px 24px' : '80px 64px', textAlign:'center', borderTop:`1px solid ${cp}22` }}>
            <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.2em', color:cp, textTransform:'uppercase' as const, marginBottom:16 }}>NOUS RENDRE VISITE</p>
            <h2 style={{ fontFamily:police, fontSize:'clamp(28px, 5vw, 52px)', fontWeight:400, color:ct, fontStyle:'italic', marginBottom:24 }}>{config.fermeVisiteTitre}</h2>
            <p style={{ fontSize:15, color:`${ct}cc`, maxWidth:640, margin:'0 auto 32px', lineHeight:1.8, fontFamily:'Inter, sans-serif' }}>{config.fermeVisiteTexte}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <p style={{ fontSize:14, color:`${ct}88`, fontFamily:'Inter, sans-serif' }}>{config.fermeAdresse}</p>
              <p style={{ fontSize:14, color:`${ct}88`, fontFamily:'Inter, sans-serif' }}>{config.fermeCp} {config.fermeVille}</p>
              <p style={{ fontSize:14, color:cp, fontFamily:'Inter, sans-serif', fontWeight:600 }}>{config.fermeHoraires}</p>
            </div>
          </section>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer style={{ background:cf, borderTop:`1px solid ${cp}22`, padding:isMobile ? '48px 24px 24px' : '56px 64px 32px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:isMobile ? '1fr' : '2fr 1fr 1fr', gap:40, marginBottom:40 }}>
            <div>
              <h3 style={{ fontFamily:police, fontSize:28, fontWeight:400, color:ct, fontStyle:'italic', marginBottom:12 }}>{config.nomFerme}</h3>
              <p style={{ fontSize:13, color:`${ct}77`, lineHeight:1.7, maxWidth:260, fontFamily:'Inter, sans-serif' }}>{config.sloganFooter}</p>
            </div>
            <div>
              <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.15em', color:`${ct}55`, textTransform:'uppercase' as const, marginBottom:16 }}>NAVIGATION</p>
              {navItems.map(item => (
                <div key={item.page} onClick={() => setPage(item.page)} style={{ fontSize:14, color:`${ct}88`, cursor:'pointer', marginBottom:10, fontFamily:'Inter, sans-serif' }}>
                  {item.label[0] + item.label.slice(1).toLowerCase().replace(' produits', ' Produits').replace(' ferme', ' Ferme')}
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.15em', color:`${ct}55`, textTransform:'uppercase' as const, marginBottom:16 }}>CONTACT</p>
              {[{ i:'📍', t:config.adresse }, { i:'📞', t:config.telephone }, { i:'✉️', t:config.email }].map(({ i, t }) => t && (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:10, alignItems:'flex-start' }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{i}</span>
                  <span style={{ fontSize:13, color:`${ct}77`, lineHeight:1.5, fontFamily:'Inter, sans-serif' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${cp}22`, paddingTop:24, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
            <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.1em', color:`${ct}44` }}>{config.copyright}</p>
            <p style={{ fontSize:11, fontFamily:'Inter, sans-serif', letterSpacing:'0.1em', color:`${ct}33` }}>DE LA TERRE, POUR L'ÂME</p>
          </div>
        </div>
      </footer>
    </div>
  );
}