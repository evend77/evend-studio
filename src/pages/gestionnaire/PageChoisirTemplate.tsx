// CHEMIN : src/pages/gestionnaire/PageChoisirTemplate.tsx
// e-Vend Studio — Choix de template au premier login ou depuis le menu

import { useState, useEffect } from 'react';
import { TEMPLATES as CATALOGUE_TEMPLATES } from '../PageTemplates';

const API_BASE = '/api';

interface Props {
  onChoisir: (templateId: string) => void;
  gestionnaireId?: number;
}

// ─── Modal choix palier Simplisse ────────────────────────────────────────────
function ModalPalierSimplisse({ onConfirmer, onAnnuler }: { onConfirmer: (plan: string) => void; onAnnuler: () => void }) {
  const [planChoisi, setPlanChoisi] = useState('simplisse-25');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const paliers = [
    { id: 'simplisse-25',  limite: 25,  prix: '15,99$', label: 'Débutant',      desc: 'Parfait pour commencer',         couleur: '#2563eb' },
    { id: 'simplisse-50',  limite: 50,  prix: '18,99$', label: 'Croissance',    desc: 'Pour une boutique en expansion', couleur: '#7c3aed' },
    { id: 'simplisse-100', limite: 100, prix: '20,99$', label: 'Pro',           desc: 'Large catalogue de produits',    couleur: '#db2777' },
    { id: 'simplisse-200', limite: 200, prix: '23,99$', label: 'Entreprise',    desc: 'Maximum pour Simplisse',         couleur: '#dc2626' },
  ];

  const handleConfirmer = async () => {
    setLoading(true);
    setErreur('');
    try {
      onConfirmer(planChoisi);
    } catch {
      setErreur('Erreur lors de la sélection du plan.');
      setLoading(false);
    }
  };

  const palierActif = paliers.find(p => p.id === planChoisi)!;

  return (
    <div onClick={onAnnuler} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>

        {/* En-tête */}
        <div style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)', padding: '24px 28px' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🛍</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Choisir votre palier Simplisse</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Vous pourrez changer de palier en tout temps depuis votre tableau de bord.</p>
        </div>

        {/* Paliers */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {paliers.map(p => (
              <div key={p.id} onClick={() => setPlanChoisi(p.id)}
                style={{
                  border: `2px solid ${planChoisi === p.id ? p.couleur : '#e5e7eb'}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: planChoisi === p.id ? `${p.couleur}08` : '#fafafa',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}>
                {planChoisi === p.id && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: p.couleur, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: p.couleur, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', marginBottom: 2 }}>{p.prix}<span style={{ fontSize: 11, fontWeight: 500, color: '#888' }}>/mois + tx</span></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 3 }}>Jusqu'à <strong style={{ color: p.couleur }}>{p.limite} produits</strong></div>
                <div style={{ fontSize: 11, color: '#888' }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* Récap sélection */}
          <div style={{ background: `${palierActif.couleur}08`, border: `1px solid ${palierActif.couleur}30`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Palier choisi : </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: palierActif.couleur }}>{palierActif.label} — {palierActif.limite} produits</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: palierActif.couleur }}>{palierActif.prix}/mois</span>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
            ℹ️ Le plan sera associé à votre compte. La facturation débutera lors de l'activation de votre boutique via Stripe.
          </div>

          {erreur && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>❌ {erreur}</p>}

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onAnnuler} disabled={loading}
              style={{ flex: 1, padding: '11px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
              Annuler
            </button>
            <button onClick={handleConfirmer} disabled={loading}
              style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 8, background: palierActif.couleur, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? '⏳ Enregistrement...' : `✅ Confirmer — ${palierActif.prix}/mois`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Configs démo hardcodées pour chaque template ────────────────────────────
const DEMO_CONFIGS: Record<string, any> = {
  'boutique-premium': {
    nomBoutique: 'Ma Boutique Premium',
    __produits_demo__: [
      { id:1, titre:'Montre Édition Limitée', prix:299.99, prix_promo:249.99, stock:5, categorie:'Accessoires', note_moyenne:4.8, nb_avis:124, description:'Montre de luxe boîtier acier inoxydable.', photo_principale:'' },
      { id:2, titre:'Sac Cuir Véritable', prix:189.99, stock:12, categorie:'Maroquinerie', note_moyenne:4.9, nb_avis:87, description:'Cuir pleine fleur tanné végétal.', photo_principale:'' },
      { id:3, titre:'Parfum Signature', prix:149.99, stock:20, categorie:'Beauté', note_moyenne:4.7, nb_avis:203, description:'Eau de parfum 100ml. Notes bergamote, rose.', photo_principale:'' },
      { id:4, titre:'Coffret Soins Premium', prix:89.99, prix_promo:69.99, stock:8, categorie:'Beauté', note_moyenne:4.6, nb_avis:56, description:'Coffret 5 produits soin visage.', photo_principale:'' },
      { id:5, titre:'Ceinture Cuir Italien', prix:119.99, stock:15, categorie:'Maroquinerie', note_moyenne:4.8, nb_avis:41, description:'Cuir de veau, boucle laiton doré.', photo_principale:'' },
      { id:6, titre:'Écharpe Cachemire', prix:199.99, prix_promo:159.99, stock:7, categorie:'Mode', note_moyenne:4.9, nb_avis:67, description:'100% cachemire mongolien, tissage main.', photo_principale:'' },
    ],
  },
  'boutique-simplisse-mode': {
    nomBoutique: 'Ma Boutique Mode',
    __produits_demo__: [
      { id:1, titre:'Robe Midi Fleurie', prix:89.99, prix_promo:69.99, stock:15, categorie:'Robes', note_moyenne:4.8, nb_avis:42, est_nouveau:true, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Rouge','Bleu','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
      { id:2, titre:'Blazer Oversized Crème', prix:129.99, stock:8, categorie:'Vestes', note_moyenne:4.9, nb_avis:28, photo_principale:'', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
      { id:3, titre:'Jean Taille Haute', prix:74.99, prix_promo:59.99, stock:20, categorie:'Pantalons', note_moyenne:4.7, nb_avis:61, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Noir','Bleu','Blanc'], type:'couleur' },{ nom:'Taille', valeurs:['36','38','40','42','44'], type:'taille' }] },
      { id:4, titre:'Top Épaules Dénudées', prix:44.99, stock:25, categorie:'Hauts', note_moyenne:4.6, nb_avis:33, est_nouveau:true, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Blanc','Rose','Sauge'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
      { id:5, titre:'Manteau Long Camel', prix:189.99, prix_promo:149.99, stock:6, categorie:'Manteaux', note_moyenne:4.9, nb_avis:19, photo_principale:'', variantes:[{ nom:'Taille', valeurs:['XS','S','M','L','XL'], type:'taille' }] },
      { id:6, titre:'Jupe Plissée Midi', prix:59.99, stock:18, categorie:'Jupes', note_moyenne:4.7, nb_avis:47, photo_principale:'', variantes:[{ nom:'Couleur', valeurs:['Bordeaux','Vert','Noir'], type:'couleur' },{ nom:'Taille', valeurs:['XS','S','M','L'], type:'taille' }] },
    ],
  },
  'boutique-simplisse': {
    nomBoutique: 'Ma Belle Boutique',
    slogan: 'Qualité artisanale depuis 2020',
    simplisse: {
      accueil: {
        couleurPrimaire: '#2563eb',
        couleurFondPage: '#ffffff',
        couleurTexte: '#1a1a1a',
        banniere: { actif: true, texte: '🎉 Livraison gratuite dès 75$ !', couleurFond: '#2563eb', couleurTexte: '#fff', lien: '', labelLien: '' },
        hero: { titre: 'Bienvenue dans Ma Belle Boutique', sousTitre: 'Découvrez notre sélection de produits soigneusement choisis pour vous.', boutonLabel: 'Voir le catalogue', photo: '', couleurFond: '#f8fafc', couleurTitre: '#1a1a1a', couleurBouton: '#2563eb', style: 'centre' },
        sections: [
          { id: 'banniere', label: 'Bannière', icone: '📢', actif: true, ordre: 1 },
          { id: 'hero', label: 'Hero', icone: '🖼', actif: true, ordre: 2 },
          { id: 'avantages', label: 'Avantages', icone: '✅', actif: true, ordre: 3 },
          { id: 'vedette', label: 'Vedette', icone: '⭐', actif: true, ordre: 4 },
          { id: 'categories', label: 'Catégories', icone: '🗂', actif: true, ordre: 5 },
          { id: 'temoignages', label: 'Avis', icone: '💬', actif: true, ordre: 6 },
        ],
      },
      catalogue: { titre: 'Notre catalogue', sousTitre: 'Tous nos produits.', colonnes: 3, afficherFiltres: true, afficherRecherche: true, afficherPrix: true, afficherStock: true, sections: [] },
      faq: { titre: 'Questions fréquentes', sousTitre: '', banniere: { actif: false }, items: [
        { question: 'Quels sont vos délais de livraison ?', reponse: 'Les commandes sont expédiées sous 24–48h ouvrables.' },
        { question: 'Puis-je retourner un article ?', reponse: 'Oui, sous 30 jours suivant la réception.' },
      ]},
      blog: { titre: 'Notre blogue', sousTitre: '', banniere: { actif: false }, afficherAuteur: true, afficherDate: true, colonnes: 3 },
      contact: { titre: 'Nous contacter', sousTitre: 'Une question ? Écrivez-nous !', banniere: { actif: false }, adresse: '123 rue Principale, Montréal, QC', telephone: '514 000-0000', courriel: 'info@mabellboutique.ca', afficherCarte: false, urlCarte: '' },
      footer: { nomBoutique: 'Ma Belle Boutique', slogan: 'Qualité artisanale depuis 2020', couleurFond: '#111827', couleurTexte: '#ffffff', afficherPropulse: true, reseaux: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', tiktok: '', twitter: '', youtube: '', linkedin: '', pinterest: '' }, colonnes: { titre1: 'Boutique', liens1: 'Accueil\nCatalogue\nBlog\nFAQ', titre2: 'Aide', liens2: 'Contact', titre3: '', liens3: '' }, politiques: { afficherConditions: true, afficherConfidentialite: true, afficherRetours: true, afficherLivraison: true } },
    },
    // Produits démo hardcodés
    __produits_demo__: [
      { id: 1, titre: 'T-Shirt Premium Blanc', prix: 29.99, prix_promo: 19.99, stock: 50, categorie: 'Vetements', description: 'T-shirt 100% coton bio, coupe reguliere.', photo_principale: '', emoji: '👕' },
      { id: 2, titre: 'Tuque Tricotée', prix: 24.99, stock: 30, categorie: 'Accessoires', description: 'Tuque en laine douce, doublée polaire.', photo_principale: '', emoji: '🧢' },
      { id: 3, titre: 'Sac Tote Canvas', prix: 34.99, stock: 25, categorie: 'Accessoires', description: 'Sac fourre-tout en canvas epais.', photo_principale: '', emoji: '👜' },
      { id: 4, titre: 'Chandail Molleton Gris', prix: 59.99, prix_promo: 44.99, stock: 20, categorie: 'Vetements', description: 'Chandail en molleton doux.', photo_principale: '', emoji: '🧶' },
      { id: 5, titre: 'Bottes d\'Hiver', prix: 14.99, stock: 100, categorie: 'Chaussures', description: 'Bottes imperméables, semelle antidérapante.', photo_principale: '', emoji: '🥾' },
      { id: 6, titre: 'Outil Multifonction', prix: 39.99, stock: 40, categorie: 'Maison', description: 'Outil multifonction en acier inoxydable, 12 fonctions.', photo_principale: '', emoji: '🔧' },
    ],
  },
};

function ouvrirApercu(templateId: string) {
  const url = `/site-preview?forceTemplate=${templateId}&demo=true`;
  window.open(url, '_blank', 'noopener,noreferrer');
}



// ─── Modal palier Simplisse Mode ─────────────────────────────────────────────
function ModalPalierSimplisseMode({ onConfirmer, onAnnuler }: { onConfirmer: (plan: string) => void; onAnnuler: () => void }) {
  const [saving, setSaving] = useState(false);
  const CP = '#722f37';
  return (
    <div onClick={onAnnuler} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(4px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#faf8f5',borderRadius:16,width:'100%',maxWidth:480,boxShadow:'0 24px 60px rgba(0,0,0,0.2)',overflow:'hidden',fontFamily:"'Inter',sans-serif",border:'1px solid #e2ddd8' }}>
        <div style={{ background:`linear-gradient(135deg,${CP},#a0435a)`,padding:'28px 32px' }}>
          <div style={{ fontSize:28,marginBottom:8 }}>👗</div>
          <h2 style={{ fontSize:20,fontWeight:900,color:'#fff',margin:'0 0 6px',fontFamily:'Georgia,serif' }}>Simplisse Mode</h2>
          <p style={{ fontSize:13,color:'rgba(255,255,255,0.75)',margin:0 }}>Tarif unique — max 100 produits · Changeable en tout temps</p>
        </div>
        <div style={{ padding:'28px 32px' }}>
          <div style={{ background:'#fff',border:`2px solid ${CP}`,borderRadius:12,padding:'20px 24px',marginBottom:20,textAlign:'center' }}>
            <div style={{ fontSize:11,fontWeight:700,color:CP,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8 }}>Tarif mensuel</div>
            <div style={{ fontSize:42,fontWeight:900,color:'#0f0f0f',fontFamily:'Georgia,serif',marginBottom:4 }}>25,99$<span style={{ fontSize:14,fontWeight:400,color:'#888' }}>/mois + tx</span></div>
            <div style={{ fontSize:13,color:'#555' }}>Jusqu'à <strong style={{ color:CP }}>100 produits</strong> actifs</div>
          </div>
          <div style={{ marginBottom:20 }}>
            {['👗 Lookbook & galerie lifestyle','🎨 Filtres couleur & taille visuels','📏 Guide des tailles intégré','🔍 Zoom image sur fiche produit','❤️ Wishlist & compte acheteur','📢 Popup promo & notifications vente','🔒 Paiement sécurisé Stripe'].map((f,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid #f2ede6',fontSize:13,color:'#333' }}><span style={{ color:CP,fontWeight:700 }}>✓</span>{f}</div>
            ))}
          </div>
          <div style={{ background:'#fef9ec',border:'1px solid #fcd34d',borderRadius:8,padding:'10px 14px',marginBottom:20,fontSize:12,color:'#92400e' }}>
            ℹ️ Option "Cacher le branding e-Vend Studio" disponible pour +2,00$/mois depuis Branding & options.
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={onAnnuler} style={{ flex:1,padding:'12px',border:'1px solid #e2ddd8',borderRadius:8,background:'#fff',fontSize:14,cursor:'pointer',fontFamily:'inherit',color:'#888' }}>Annuler</button>
            <button onClick={async()=>{ setSaving(true); await onConfirmer('simplisse-mode-100'); setSaving(false); }} disabled={saving}
              style={{ flex:2,padding:'12px',border:'none',borderRadius:8,background:`linear-gradient(135deg,${CP},#a0435a)`,color:'#fff',fontSize:14,fontWeight:800,cursor:saving?'wait':'pointer',fontFamily:'inherit' }}>
              {saving?'⏳ Enregistrement...':'✅ Créer ma boutique Mode →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal palier Premium ──────────────────────────────────────────────────────
function ModalPalierPremium({ onConfirmer, onAnnuler }: { onConfirmer: (plan: string) => void; onAnnuler: () => void }) {
  const [planChoisi, setPlanChoisi] = useState('premium-25');
  const [saving, setSaving] = useState(false);
  const OR = '#c9a96e';

  const paliers = [
    { id:'premium-25',  limite:25,  prix:'18,99$', prixNum:18.99, label:'Essentiel',   desc:'Parfait pour démarrer',           couleur:'#c9a96e' },
    { id:'premium-50',  limite:50,  prix:'20,99$', prixNum:20.99, label:'Croissance',  desc:'Boutique en expansion',           couleur:'#a78bfa' },
    { id:'premium-100', limite:100, prix:'25,99$', prixNum:25.99, label:'Pro',         desc:'Large catalogue de luxe',         couleur:'#f472b6' },
    { id:'premium-200', limite:200, prix:'29,99$', prixNum:29.99, label:'Business',    desc:'Volume et performance',           couleur:'#fb923c' },
    { id:'premium-500', limite:500, prix:'39,99$', prixNum:39.99, label:'Entreprise',  desc:'Maximum — aucune limite pratique',couleur:'#ef4444' },
  ];

  const palierActif = paliers.find(p => p.id === planChoisi)!;

  return (
    <div onClick={onAnnuler} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(6px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#111',borderRadius:20,width:'100%',maxWidth:620,boxShadow:'0 32px 80px rgba(0,0,0,0.6)',border:'1px solid rgba(201,169,110,0.2)',overflow:'hidden',fontFamily:"'Inter',sans-serif" }}>
        <div style={{ background:'linear-gradient(135deg,#0a0a0a,#1a1a1a)',padding:'28px 32px',borderBottom:'1px solid rgba(201,169,110,0.15)' }}>
          <div style={{ fontSize:28,marginBottom:8 }}>💎</div>
          <h2 style={{ fontSize:20,fontWeight:900,color:'#fff',margin:'0 0 6px' }}>Choisir votre palier Premium</h2>
          <p style={{ fontSize:13,color:'#666',margin:0 }}>Changeable en tout temps depuis votre tableau de bord.</p>
        </div>
        <div style={{ padding:'24px 32px' }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:10,marginBottom:20 }}>
            {paliers.map(p => (
              <div key={p.id} onClick={()=>setPlanChoisi(p.id)}
                style={{ border:`2px solid ${planChoisi===p.id?p.couleur:'#333'}`,borderRadius:10,padding:'14px 16px',cursor:'pointer',background:planChoisi===p.id?`${p.couleur}12`:'#1a1a1a',transition:'all 0.15s',position:'relative' }}>
                {planChoisi===p.id&&<div style={{ position:'absolute',top:8,right:8,width:18,height:18,borderRadius:'50%',background:p.couleur,display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ color:'#000',fontSize:10,fontWeight:800 }}>✓</span></div>}
                <div style={{ fontSize:11,fontWeight:700,color:p.couleur,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>{p.label}</div>
                <div style={{ fontSize:20,fontWeight:900,color:'#fff',marginBottom:2 }}>{p.prix}<span style={{ fontSize:10,fontWeight:500,color:'#555' }}>/mois</span></div>
                <div style={{ fontSize:12,color:'#666',fontWeight:600 }}>{p.limite} produits</div>
                <div style={{ fontSize:10,color:'#555',marginTop:4 }}>{p.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background:`${palierActif.couleur}10`,border:`1px solid ${palierActif.couleur}30`,borderRadius:8,padding:'12px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span style={{ fontSize:13,color:'#ccc' }}>Palier choisi : <strong style={{ color:palierActif.couleur }}>{palierActif.label} — {palierActif.limite} produits</strong></span>
            <span style={{ fontSize:16,fontWeight:900,color:palierActif.couleur }}>{palierActif.prix}/mois</span>
          </div>
          <div style={{ background:'rgba(201,169,110,0.05)',border:'1px solid rgba(201,169,110,0.1)',borderRadius:8,padding:'10px 14px',marginBottom:20,fontSize:12,color:'#666',lineHeight:1.6 }}>
            ℹ️ Option "Cacher le branding e-Vend Studio" disponible pour +2,00$/mois supplémentaires depuis Branding & options.
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={onAnnuler} style={{ flex:1,padding:'12px',border:'1px solid #333',borderRadius:8,background:'transparent',fontSize:14,cursor:'pointer',fontFamily:'inherit',color:'#888' }}>Annuler</button>
            <button onClick={async()=>{ setSaving(true); await onConfirmer(planChoisi); setSaving(false); }} disabled={saving}
              style={{ flex:2,padding:'12px',border:'none',borderRadius:8,background:`linear-gradient(135deg,${palierActif.couleur},#e8c87a)`,color:'#000',fontSize:14,fontWeight:800,cursor:saving?'wait':'pointer',fontFamily:'inherit' }}>
              {saving?'⏳ Enregistrement...':'✅ Confirmer — '+palierActif.prix+'/mois'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal réinitialisation template ─────────────────────────────────────────
function ModalReinitialisationTemplate({ gestionnaireId, onConfirme, onAnnuler }: {
  gestionnaireId: number;
  onConfirme: () => void;
  onAnnuler: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur]   = useState('');
  const [etape, setEtape]     = useState<'avertissement' | 'confirmation'>('avertissement');
  const [motDePasse, setMotDePasse] = useState('');

  const reinitialiser = async () => {
    setLoading(true);
    setErreur('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/reinitialiser-template`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json();
        setErreur(d.message || 'Erreur lors de la reinitialisation');
        setLoading(false);
        return;
      }
      onConfirme();
    } catch {
      setErreur('Impossible de contacter le serveur');
      setLoading(false);
    }
  };

  return (
    <div onClick={onAnnuler} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>

        {/* En-tête rouge danger */}
        <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)', padding: '24px 28px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Reinitialiser le template</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>Cette action est irreversible. Lisez attentivement avant de continuer.</p>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {etape === 'avertissement' ? (
            <>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#991b1b', fontSize: 14 }}>Ce qui sera efface :</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#b91c1c', fontSize: 13, lineHeight: 1.8 }}>
                  <li>La configuration visuelle du template (couleurs, textes, sections)</li>
                  <li>Le template actif associe a votre compte</li>
                  <li>Les parametres des pages (accueil, catalogue, etc.)</li>
                </ul>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#166534', fontSize: 14 }}>Ce qui sera conserve :</p>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#15803d', fontSize: 13, lineHeight: 1.8 }}>
                  <li>Tous vos produits et annonces</li>
                  <li>Vos collaborateurs et leurs comptes</li>
                  <li>Les comptes acheteurs de votre marketplace</li>
                  <li>Toutes les commandes et transactions</li>
                  <li>Votre plan tarifaire actuel</li>
                </ul>
              </div>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
                Apres la reinitialisation, vous devrez <strong>choisir un nouveau template</strong> avant de pouvoir acceder a votre site.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onAnnuler} style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555', fontWeight: 600 }}>
                  Annuler
                </button>
                <button onClick={() => setEtape('confirmation')} style={{ flex: 2, padding: 12, border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Je comprends — continuer →
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: '#333', marginBottom: 20, fontWeight: 600 }}>
                Confirmez en tapant <strong style={{ color: '#dc2626' }}>REINITIALISER</strong> dans le champ ci-dessous :
              </p>
              <input
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value.toUpperCase())}
                placeholder="REINITIALISER"
                style={{ width: '100%', padding: '11px 14px', border: `2px solid ${motDePasse === 'REINITIALISER' ? '#16a34a' : '#e5e7eb'}`, borderRadius: 8, fontSize: 15, fontFamily: 'inherit', marginBottom: 16, outline: 'none', boxSizing: 'border-box', letterSpacing: '0.05em', fontWeight: 700 }}
              />
              {erreur && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>❌ {erreur}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEtape('avertissement')} style={{ flex: 1, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
                  ← Retour
                </button>
                <button
                  onClick={reinitialiser}
                  disabled={motDePasse !== 'REINITIALISER' || loading}
                  style={{ flex: 2, padding: 12, border: 'none', borderRadius: 8, background: motDePasse === 'REINITIALISER' ? '#dc2626' : '#e5e7eb', color: motDePasse === 'REINITIALISER' ? '#fff' : '#aaa', fontSize: 14, fontWeight: 700, cursor: motDePasse === 'REINITIALISER' && !loading ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}
                >
                  {loading ? '⏳ Reinitialisation...' : '🗑️ Reinitialiser le template'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal choix du palier — Boutique Complète (paliers lus dans Prix Template : rien d'inventé) ───
function ModalPalierComplete({ paliers, onConfirmer, onAnnuler, nom = 'Boutique Complète', icone = '🏪', couleur = '#16a34a' }: { paliers: { limite: number; prix: string; label: string }[]; onConfirmer: (limite: number) => void; onAnnuler: () => void; nom?: string; icone?: string; couleur?: string }) {
  const [choisi, setChoisi] = useState<number>(paliers[0]?.limite || 0);
  const [envoi, setEnvoi] = useState(false);
  const VERT = couleur;
  const actif = paliers.find(p => p.limite === choisi) || paliers[0];
  return (
    <div onClick={onAnnuler} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 70px rgba(0,0,0,0.35)', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>{icone}</div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#1a1a1a', margin: '0 0 4px' }}>Choisir votre palier — {nom}</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Le palier fixe le nombre d'annonces actives. Changeable en tout temps dans « Mon plan & limites ».</p>
        </div>
        <div style={{ padding: '20px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 18 }}>
            {paliers.map(p => (
              <button key={p.limite} onClick={() => setChoisi(p.limite)}
                style={{ textAlign: 'left', border: `2px solid ${choisi === p.limite ? VERT : '#e5e7eb'}`, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', background: choisi === p.limite ? `${VERT}10` : '#fff', fontFamily: 'inherit' }}>
                {p.label && <div style={{ fontSize: 11, fontWeight: 700, color: VERT, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{p.label}</div>}
                <div style={{ fontSize: 19, fontWeight: 800, color: '#1a1a1a' }}>{p.prix}</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 2 }}>{p.limite} annonce{p.limite > 1 ? 's' : ''} actives</div>
              </button>
            ))}
          </div>
          {actif && <div style={{ background: `${VERT}10`, border: `1px solid ${VERT}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#333' }}>Palier choisi : <strong>{actif.limite} annonces — {actif.prix}</strong> <span style={{ color: '#6b7280' }}>(taxes en sus)</span></div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onAnnuler} style={{ padding: '11px 18px', background: '#f3f4f6', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#444' }}>Annuler</button>
            <button disabled={envoi || !actif} onClick={() => { setEnvoi(true); onConfirmer(choisi); }}
              style={{ flex: 1, padding: '11px 18px', background: VERT, border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: envoi ? 'wait' : 'pointer', fontFamily: 'inherit', color: '#fff' }}>
              {envoi ? '⏳ Un instant…' : '🏪 Choisir ce palier →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PageChoisirTemplate({ onChoisir, gestionnaireId }: Props) {
  const [ongletCategorie, setOngletCategorie] = useState<'vitrines'|'boutiques'|'multivendeur'|'cagnottes'|'encheres'|'annonces'|'abonnements'|'locations'>('vitrines');
  const [descOuverte, setDescOuverte] = useState(false);
  const [modalSimplisseOuvert, setModalSimplisseOuvert] = useState(false);
  const [enregistrementPlan, setEnregistrementPlan] = useState(false);
  const [modalResetOuvert, setModalResetOuvert] = useState(false);
  const [prixParTemplate, setPrixParTemplate] = useState<Record<string, string>>({});
  // Paliers réels (Prix Template, dashboard admin) : prix de départ et nombre maximal de produits affichés sur les cartes Simplisse / Premium
  const [infoPaliers, setInfoPaliers] = useState<Record<string, { prixMin: string; limiteMax: number }>>({});
  const [paliersComplete, setPaliersComplete] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de la Boutique Complète (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalCompleteOuvert, setModalCompleteOuvert] = useState(false);
  const [paliersCatalogue, setPaliersCatalogue] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers du Catalogue Avancé (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalCatalogueOuvert, setModalCatalogueOuvert] = useState(false);
  const [paliersAgricole, setPaliersAgricole] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de la Boutique Agricole (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalAgricoleOuvert, setModalAgricoleOuvert] = useState(false);
  const [paliersArtisan, setPaliersArtisan] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Artisan (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalArtisanOuvert, setModalArtisanOuvert] = useState(false);
  const [paliersAuto, setPaliersAuto] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Auto (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalAutoOuvert, setModalAutoOuvert] = useState(false);
  const [paliersJouets, setPaliersJouets] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Jouets (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalJouetsOuvert, setModalJouetsOuvert] = useState(false);
  const [paliersGothique, setPaliersGothique] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Gothique (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalGothiqueOuvert, setModalGothiqueOuvert] = useState(false);
  const [paliersBD, setPaliersBD] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse BD (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalBDOuvert, setModalBDOuvert] = useState(false);
  const [paliersFuturiste, setPaliersFuturiste] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Futuriste (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalFuturisteOuvert, setModalFuturisteOuvert] = useState(false);
  const [paliersTech, setPaliersTech] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Tech (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalTechOuvert, setModalTechOuvert] = useState(false);
  const [paliersRose, setPaliersRose] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Rosé (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalRoseOuvert, setModalRoseOuvert] = useState(false);
  const [paliersBonbon, setPaliersBonbon] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Bonbon (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalBonbonOuvert, setModalBonbonOuvert] = useState(false);
  const [paliersSoleil, setPaliersSoleil] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Soleil (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalSoleilOuvert, setModalSoleilOuvert] = useState(false);
  const [paliersSentier, setPaliersSentier] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Sentier (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalSentierOuvert, setModalSentierOuvert] = useState(false);
  const [paliersChantier, setPaliersChantier] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Chantier (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalChantierOuvert, setModalChantierOuvert] = useState(false);
  const [paliersCafe, setPaliersCafe] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Café (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalCafeOuvert, setModalCafeOuvert] = useState(false);
  const [paliersSakura, setPaliersSakura] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Sakura (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalSakuraOuvert, setModalSakuraOuvert] = useState(false);
  const [paliersSport, setPaliersSport] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Sport (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalSportOuvert, setModalSportOuvert] = useState(false);
  const [paliersJoyau, setPaliersJoyau] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Joyau (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalJoyauOuvert, setModalJoyauOuvert] = useState(false);
  const [paliersEcume, setPaliersEcume] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Écume (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalEcumeOuvert, setModalEcumeOuvert] = useState(false);
  const [paliersAudace, setPaliersAudace] = useState<{ limite: number; prix: string; label: string }[]>([]);   // paliers de Simplisse Audace (Prix Template) ; vide = aucune limite, pas de fenêtre
  const [modalAudaceOuvert, setModalAudaceOuvert] = useState(false);

  // Prix configurés dans le dashboard admin — si l'appel échoue, on retombe
  // simplement sur le prix codé en dur (ou "Gratuit") comme avant.
  // Résolution : surcharge du template > défaut de sa catégorie > "Gratuit".
  useEffect(() => {
    fetch('/api/templates/prix')
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;
        const map: Record<string, string> = {};
        for (const t of CATALOGUE_TEMPLATES) {
          const surcharge = data.templates[t.id]?.prix_texte;
          const defautCategorie = data.groupes[t.groupe]?.prix_texte;
          map[t.id] = surcharge || defautCategorie || 'Gratuit';
        }
        setPrixParTemplate(map);
        const info: Record<string, { prixMin: string; limiteMax: number }> = {};
        for (const id of ['boutique-simplisse', 'boutique-premium', 'boutique-complete', 'boutique-catalogue', 'boutique-agricole', 'boutique-artisan', 'boutique-auto', 'boutique-jouets', 'boutique-gothique', 'boutique-bd', 'boutique-futuriste', 'boutique-tech', 'boutique-rose', 'boutique-bonbon', 'boutique-soleil', 'boutique-sentier', 'boutique-chantier', 'boutique-cafe', 'boutique-sakura', 'boutique-sport', 'boutique-joyau', 'boutique-ecume', 'boutique-audace']) {
          let pal: any = data.templates[id]?.prix_paliers;
          if (typeof pal === 'string') { try { pal = JSON.parse(pal); } catch { pal = null; } }
          if (!Array.isArray(pal) || pal.length === 0) continue;
          const ok = pal.map((x: any) => ({ prix: String(x?.prix || ''), n: parseFloat(String(x?.prix || '').replace(/[^0-9,.]/g, '').replace(',', '.')), limite: parseInt(x?.limite, 10) })).filter((x: any) => x.prix && Number.isFinite(x.n) && Number.isInteger(x.limite) && x.limite > 0);
          if (!ok.length) continue;
          const min = ok.reduce((a: any, b: any) => (b.n < a.n ? b : a));
          info[id] = { prixMin: min.prix, limiteMax: Math.max(...ok.map((x: any) => x.limite)) };
          if (id === 'boutique-complete') setPaliersComplete(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-artisan') setPaliersArtisan(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-auto') setPaliersAuto(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-jouets') setPaliersJouets(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-gothique') setPaliersGothique(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-bd') setPaliersBD(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-futuriste') setPaliersFuturiste(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-tech') setPaliersTech(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-rose') setPaliersRose(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-bonbon') setPaliersBonbon(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-soleil') setPaliersSoleil(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-sentier') setPaliersSentier(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-chantier') setPaliersChantier(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-cafe') setPaliersCafe(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-sakura') setPaliersSakura(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-sport') setPaliersSport(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-joyau') setPaliersJoyau(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-ecume') setPaliersEcume(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-audace') setPaliersAudace(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-agricole') setPaliersAgricole(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
          if (id === 'boutique-catalogue') setPaliersCatalogue(pal.map((x: any) => ({ limite: parseInt(x?.limite, 10), prix: String(x?.prix || '').slice(0, 40), label: String(x?.label || '').slice(0, 40) })).filter((x: any) => Number.isInteger(x.limite) && x.limite > 0 && x.prix).sort((a: any, b: any) => a.limite - b.limite));
        }
        setInfoPaliers(info);
      })
      .catch(() => { /* silencieux — fallback sur les prix codés en dur */ });
  }, []);

  // Boutique Complète : fenêtre de palier seulement si des paliers sont configurés dans Prix Template ; sinon aucune limite → choix direct
  const handleChoisirComplete = () => { if (paliersComplete.length > 0) setModalCompleteOuvert(true); else onChoisir('boutique-complete'); };
  const handleConfirmerPalierComplete = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `complete-${limite}` }),
      }).catch(() => {});
    }
    setModalCompleteOuvert(false);
    onChoisir('boutique-complete');
  };
  // Catalogue Avancé : même principe (fenêtre de palier seulement si des paliers sont configurés dans Prix Template)
  const handleChoisirCatalogue = () => { if (paliersCatalogue.length > 0) setModalCatalogueOuvert(true); else onChoisir('boutique-catalogue'); };
  const handleConfirmerPalierCatalogue = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `catalogue-${limite}` }),
      }).catch(() => {});
    }
    setModalCatalogueOuvert(false);
    onChoisir('boutique-catalogue');
  };
  // Boutique Agricole : même principe
  const handleChoisirAgricole = () => { if (paliersAgricole.length > 0) setModalAgricoleOuvert(true); else onChoisir('boutique-agricole'); };
  const handleConfirmerPalierAgricole = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `agricole-${limite}` }),
      }).catch(() => {});
    }
    setModalAgricoleOuvert(false);
    onChoisir('boutique-agricole');
  };
  // Simplisse Artisan : même principe
  const handleChoisirArtisan = () => { if (paliersArtisan.length > 0) setModalArtisanOuvert(true); else onChoisir('boutique-artisan'); };
  const handleConfirmerPalierArtisan = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `artisan-${limite}` }),
      }).catch(() => {});
    }
    setModalArtisanOuvert(false);
    onChoisir('boutique-artisan');
  };
  // Simplisse Auto : même principe
  const handleChoisirAuto = () => { if (paliersAuto.length > 0) setModalAutoOuvert(true); else onChoisir('boutique-auto'); };
  const handleConfirmerPalierAuto = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `auto-${limite}` }),
      }).catch(() => {});
    }
    setModalAutoOuvert(false);
    onChoisir('boutique-auto');
  };
  // Simplisse Jouets : même principe
  const handleChoisirJouets = () => { if (paliersJouets.length > 0) setModalJouetsOuvert(true); else onChoisir('boutique-jouets'); };
  const handleConfirmerPalierJouets = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `jouets-${limite}` }),
      }).catch(() => {});
    }
    setModalJouetsOuvert(false);
    onChoisir('boutique-jouets');
  };
  // Simplisse Gothique : même principe
  const handleChoisirGothique = () => { if (paliersGothique.length > 0) setModalGothiqueOuvert(true); else onChoisir('boutique-gothique'); };
  const handleConfirmerPalierGothique = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `gothique-${limite}` }),
      }).catch(() => {});
    }
    setModalGothiqueOuvert(false);
    onChoisir('boutique-gothique');
  };
  // Simplisse BD : même principe
  const handleChoisirBD = () => { if (paliersBD.length > 0) setModalBDOuvert(true); else onChoisir('boutique-bd'); };
  const handleConfirmerPalierBD = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `bd-${limite}` }),
      }).catch(() => {});
    }
    setModalBDOuvert(false);
    onChoisir('boutique-bd');
  };
  const handleChoisirFuturiste = () => { if (paliersFuturiste.length > 0) setModalFuturisteOuvert(true); else onChoisir('boutique-futuriste'); };
  const handleConfirmerPalierFuturiste = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `futuriste-${limite}` }),
      }).catch(() => {});
    }
    setModalFuturisteOuvert(false);
    onChoisir('boutique-futuriste');
  };
  const handleChoisirTech = () => { if (paliersTech.length > 0) setModalTechOuvert(true); else onChoisir('boutique-tech'); };
  const handleConfirmerPalierTech = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `tech-${limite}` }),
      }).catch(() => {});
    }
    setModalTechOuvert(false);
    onChoisir('boutique-tech');
  };
  const handleChoisirRose = () => { if (paliersRose.length > 0) setModalRoseOuvert(true); else onChoisir('boutique-rose'); };
  const handleConfirmerPalierRose = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `rose-${limite}` }),
      }).catch(() => {});
    }
    setModalRoseOuvert(false);
    onChoisir('boutique-rose');
  };
  const handleChoisirBonbon = () => { if (paliersBonbon.length > 0) setModalBonbonOuvert(true); else onChoisir('boutique-bonbon'); };
  const handleConfirmerPalierBonbon = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `bonbon-${limite}` }),
      }).catch(() => {});
    }
    setModalBonbonOuvert(false);
    onChoisir('boutique-bonbon');
  };
  const handleChoisirSoleil = () => { if (paliersSoleil.length > 0) setModalSoleilOuvert(true); else onChoisir('boutique-soleil'); };
  const handleConfirmerPalierSoleil = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `soleil-${limite}` }),
      }).catch(() => {});
    }
    setModalSoleilOuvert(false);
    onChoisir('boutique-soleil');
  };
  const handleChoisirSentier = () => { if (paliersSentier.length > 0) setModalSentierOuvert(true); else onChoisir('boutique-sentier'); };
  const handleConfirmerPalierSentier = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `sentier-${limite}` }),
      }).catch(() => {});
    }
    setModalSentierOuvert(false);
    onChoisir('boutique-sentier');
  };
  const handleChoisirChantier = () => { if (paliersChantier.length > 0) setModalChantierOuvert(true); else onChoisir('boutique-chantier'); };
  const handleConfirmerPalierChantier = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `chantier-${limite}` }),
      }).catch(() => {});
    }
    setModalChantierOuvert(false);
    onChoisir('boutique-chantier');
  };
  const handleChoisirCafe = () => { if (paliersCafe.length > 0) setModalCafeOuvert(true); else onChoisir('boutique-cafe'); };
  const handleConfirmerPalierCafe = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `cafe-${limite}` }),
      }).catch(() => {});
    }
    setModalCafeOuvert(false);
    onChoisir('boutique-cafe');
  };
  const handleChoisirSakura = () => { if (paliersSakura.length > 0) setModalSakuraOuvert(true); else onChoisir('boutique-sakura'); };
  const handleConfirmerPalierSakura = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `sakura-${limite}` }),
      }).catch(() => {});
    }
    setModalSakuraOuvert(false);
    onChoisir('boutique-sakura');
  };
  const handleChoisirSport = () => { if (paliersSport.length > 0) setModalSportOuvert(true); else onChoisir('boutique-sport'); };
  const handleConfirmerPalierSport = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `sport-${limite}` }),
      }).catch(() => {});
    }
    setModalSportOuvert(false);
    onChoisir('boutique-sport');
  };
  const handleChoisirJoyau = () => { if (paliersJoyau.length > 0) setModalJoyauOuvert(true); else onChoisir('boutique-joyau'); };
  const handleConfirmerPalierJoyau = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `joyau-${limite}` }),
      }).catch(() => {});
    }
    setModalJoyauOuvert(false);
    onChoisir('boutique-joyau');
  };
  const handleChoisirEcume = () => { if (paliersEcume.length > 0) setModalEcumeOuvert(true); else onChoisir('boutique-ecume'); };
  const handleConfirmerPalierEcume = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `ecume-${limite}` }),
      }).catch(() => {});
    }
    setModalEcumeOuvert(false);
    onChoisir('boutique-ecume');
  };
  const handleChoisirAudace = () => { if (paliersAudace.length > 0) setModalAudaceOuvert(true); else onChoisir('boutique-audace'); };
  const handleConfirmerPalierAudace = async (limite: number) => {
    if (gestionnaireId && Number.isInteger(limite) && limite > 0) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan: `audace-${limite}` }),
      }).catch(() => {});
    }
    setModalAudaceOuvert(false);
    onChoisir('boutique-audace');
  };
  const handleChoisirSimplisse = () => setModalSimplisseOuvert(true);
  const [modalPremiumOuvert, setModalPremiumOuvert] = useState(false);
  const handleChoisirPremium = () => setModalPremiumOuvert(true);
  const handleConfirmerPalierPremium = async (plan: string) => {
    if (gestionnaireId) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan }),
      }).catch(() => {});
    }
    setModalPremiumOuvert(false);
    onChoisir('boutique-premium');
  };
  const [modalModeOuvert, setModalModeOuvert] = useState(false);
  const handleChoisirSimplisseMode = () => setModalModeOuvert(true);
  const handleConfirmerPalierMode = async (plan: string) => {
    if (gestionnaireId) {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include', body: JSON.stringify({ plan }),
      }).catch(() => {});
    }
    setModalModeOuvert(false);
    onChoisir('boutique-simplisse-mode');
  };

  const handleConfirmerPalier = async (plan: string) => {
    setEnregistrementPlan(true);
    try {
      // 1. Mettre à jour le plan dans gestionnaires
      if (gestionnaireId) {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include',
          body: JSON.stringify({ plan }),
        });
      }
    } catch (e) {
      console.warn('Erreur mise à jour plan:', e);
    }
    setModalSimplisseOuvert(false);
    setEnregistrementPlan(false);
    // 2. Choisir le template (déclenche la navigation vers simplisse-config-pages)
    onChoisir('boutique-simplisse');
  };

  const categories = [
    {
      id: 'vitrines' as const,
      titre: '🖼 Vitrines',
      desc: 'Présence en ligne, portfolio, réservations — sans vente de produits en ligne.',
      couleurGroupe: '#c9a96e',
      sousGroupes: [
        {
          titre: 'Présentation simple',
          templates: [
            { id: 'vitrine-carte',        titre: 'Carte & Présentation', desc: "Restaurants, bars, hôtels. Horaires + adresse + carte. Simple et efficace.",         icone: '📍', couleur: '#f97316', disponible: true },
            { id: 'vitrine-evenementiel', titre: 'Événementiel',         desc: 'Mariages, conférences, festivals. Compte à rebours + programme + billetterie.',       icone: '🎉', couleur: '#ec4899', disponible: true },
          ]
        },
        {
          titre: 'Portfolio & Services professionnels',
          templates: [
            { id: 'vitrine-portfolio',        titre: 'Portfolio',               desc: 'Artistes, photographes, architectes. Galerie + bio + formulaire contact.',                                                     icone: '🖼',  couleur: '#c9a96e', disponible: true },
            { id: 'vitrine-cv',               titre: 'CV Professionnel',        desc: 'Coachs, consultants, avocats. Services + témoignages + prise de RDV.',                                                          icone: '💼',  couleur: '#0ea5e9', disponible: true },
            { id: 'vitrine-pro-entrepreneur', titre: 'Pro Entrepreneur ⭐',     desc: 'Badge rotatif, stats animées, équipe, blog, témoignages, formulaire devis. 25$.',                                               icone: '🏗️', couleur: '#f59e0b', disponible: true, prix: '25$' },
            { id: 'vitrine-pro-tech',         titre: 'Pro Tech / SaaS ⭐',      desc: 'Ticker défilant, hero vidéo/photo, solutions, tarifs, partenaires. 25$.',                                                        icone: '💻',  couleur: '#c026d3', disponible: true, prix: '25$' },
            { id: 'vitrine-pro-sante',        titre: 'Pro Santé / Clinique ⭐', desc: 'Carte Google Maps, formulaire contact, équipe médicale, FAQ, scroll reveal. 25$.',                                              icone: '🏥',  couleur: '#1e6fa8', disponible: true, prix: '25$' },
            { id: 'vitrine-pro-mariage',      titre: 'Pro Mariage ⭐',          desc: 'RSVP modal, compte à rebours, galerie lightbox, scroll reveal, timeline. 25$.',                                                  icone: '💍',  couleur: '#8b6914', disponible: true, prix: '25$' },
            { id: 'vitrine-pro-beaute',       titre: 'Pro Beauté ⭐',           desc: 'Pétales animés, papillons, fleur rotative configurable. Beauté, cosmétique. 25$.',                                               icone: '🌸',  couleur: '#f4a5a0', disponible: true, prix: '25$' },
            { id: 'vitrine-paysager',         titre: 'Entretien Paysager',      desc: 'Style sombre vert citron bold. Formulaire devis, galerie masonry, avis défilement auto, compteurs animés. Gratuit.',             icone: '🌿',  couleur: '#b5e24a', disponible: true },
            { id: 'vitrine-avocat',           titre: "Bureau d'Avocat",        desc: 'Marine & or, FAQ accordéon, formulaire consultation, Google Maps, sections réordonnables. Gratuit.',                             icone: '⚖️', couleur: '#c9a84c', disponible: true },
            { id: 'salon-coiffure',           titre: 'Salon de Coiffure ⭐',    desc: 'Réservation en ligne, galerie transformations, équipe stylistes, formulaire contact. Effet page de livre + photos twist 3D. 25$.', icone: '✂️', couleur: '#7b7cb6', disponible: true, prix: '25$' },
          ]
        },
        {
          titre: 'Cours & Formation',
          templates: [
            { id: 'cours-danse',      titre: 'École de Danse',       desc: "Studio de danse sombre & glamour. Rideau théâtre, silhouettes SVG, spotlight, ondes sonores, paillettes au clic. Magenta & or. Gratuit.",                     icone: '💃', couleur: '#e91e8c', disponible: true },
            { id: 'cours-peinture',   titre: 'École de Peinture',    desc: "Atelier artistique vivant. Cube 3D CSS, éclaboussures SVG au clic, galerie 3D, pinceau animé, palette multicolore. Gratuit.",                                  icone: '🎨', couleur: '#e63946', disponible: true },
            { id: 'cours-equitation', titre: "Centre d'Équitation",  desc: "Centre équestre noble. Cheval SVG au galop, herbe animée, carrousel 3D chevaux, palmarès, cours, instructeurs, événements. Bordeaux & or. Gratuit.",           icone: '🐎', couleur: '#8b2635', disponible: true },
            { id: 'cours-yoga',       titre: 'Studio Yoga & Pilates',desc: 'Studio yoga fond ivoire & terracotta. Vague respirante, lotus animé, silhouettes poses, minuteur 4-7-8, horaires, abonnements. Gratuit.',                     icone: '🧘', couleur: '#c17f5a', disponible: true },
            { id: 'cours-cuisine',    titre: 'École de Cuisine',     desc: 'École culinaire élégante. Vapeur animée, galerie plats plein écran, chefs, ateliers, thermomètre niveau. Ivoire & brique. Gratuit.',                          icone: '🍳', couleur: '#c0392b', disponible: true },
            { id: 'cours-web',        titre: 'Formation Web & Dev',  desc: 'École de dev fond sombre ultra-moderne. Engrenages 360° animés, modules, formateurs, tarifs, FAQ. Cyan & violet. Gratuit.',                                    icone: '⚙️', couleur: '#00d4ff', disponible: true },
            { id: 'cours-langues',    titre: 'École de Langues',     desc: 'École de langues complète. 10 langues, formules, professeurs, FAQ, événements, blog, newsletter. Sections réordonnables. Gratuit.',                            icone: '🌍', couleur: '#4F46E5', disponible: true },
            { id: 'cours-piano',      titre: 'Cours de Piano',       desc: 'Portfolio pianiste / musicien. Hero plein écran, grille diagonale, récompenses, tarifs cours & prestations, galerie. Menu hamburger fullscreen. Gratuit.',      icone: '🎹', couleur: '#e8a87c', disponible: true },
            { id: 'cours-coach',      titre: 'Coach de Vie',         desc: "Site coaching premium. Roue 4 piliers animée, titre morphing, flip 3D programmes, spotlight souris, étoiles ascendantes, formulaire appel découverte. Gratuit.", icone: '🌿', couleur: '#C9A96E', disponible: true },
          ]
        },
        {
          titre: 'Restaurant & Fast Food',
          templates: [
            { id: 'vitrine-boulangerie', titre: 'Boulangerie & Pâtisserie', desc: "Croissant SVG 3D tournant, farine qui tombe, badge sortie du four live, galerie flip 3D, commandes spéciales. Brun chaud & or. Gratuit.", icone: '🥐', couleur: '#8b4513', disponible: true },
            { id: 'vitrine-foodtruck',   titre: 'Food Truck',               desc: "Camion SVG animé + flammes, emplacement GPS du jour, badge Ouvert/Fermé auto, menu flip 3D. Orange & noir. Gratuit.",                      icone: '🚚', couleur: '#ff6b00', disponible: true },
            { id: 'vitrine-resto',       titre: 'Restaurant & Fast Food',   desc: 'Fond noir & orange. Menu burgers, accompagnements, réservation table, avis carrousel, carte Google Maps. Sections réordonnables. Gratuit.', icone: '🍔', couleur: '#e8820a', disponible: true },
            { id: 'vitrine-bistro',      titre: 'Bistro & Café',            desc: 'Fond noir & brun doré. Galerie plein format, menu filtrable par catégorie, réservation, carte Google Maps, sections réordonnables. Gratuit.', icone: '☕', couleur: '#8b6914', disponible: true },
          ]
        },
        {
          titre: 'Ferme & producteurs',
          templates: [
            { id: 'agricole', titre: 'Vitrine Agricole', desc: "Site vitrine de ferme, sans paiement en ligne : vos produits, Notre ferme, philosophie et visites. Le visiteur envoie une demande de commande par courriel (Messagerie), vous le contactez ensuite. Textes, couleurs et sections réglables.", icone: '🌾', couleur: '#c9854a', disponible: true },
          ]
        },
        {
          titre: 'Réservations (sans paiement en ligne)',
          templates: [
            { id: 'reservation-restaurant', titre: 'Restaurant & Café',  desc: 'Réservation de table par créneau horaire avec calendrier visuel.',         icone: '🍽️', couleur: '#f97316', disponible: true },
            { id: 'reservation-service',    titre: 'Service & RDV',      desc: 'Coiffeur, médecin, coach. Prise de rendez-vous par créneau.',              icone: '💈', couleur: '#0ea5e9', disponible: true },
            { id: 'reservation-spectacle',  titre: 'Spectacle & Billet', desc: 'Réservation de sièges numérotés. Plan de salle visuel + gestion billets.', icone: '🎭', couleur: '#ec4899', disponible: true },
          ]
        },
      ]
    },
    {
      id: 'boutiques' as const,
      titre: '🛍 Boutiques',
      desc: "Votre boutique complète hébergée sur e-Vend Studio, entièrement personnalisable à votre image. Gérez vos produits, commandes et apparence depuis votre tableau de bord — sans toucher au code.",
      couleurGroupe: '#2563eb',
      nouveau: true,
      sousGroupes: [
        {
          titre: 'Générique',
          templates: [
            {
              id: 'boutique-simplisse', titre: 'Simplisse',
              desc: "La boutique complète, propre et professionnelle. Page d'accueil, catalogue avec filtres, page produit, blog, FAQ, contact et footer configurable. L'équivalent d'un Shopify sans le code.",
              icone: '🛍', couleur: '#2563eb', disponible: true, badge: 'Nouveau', badgeCouleur: '#2563eb',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-premium', titre: 'Premium',
              desc: "La boutique haut de gamme — style sombre luxueux avec accents dorés. Accueil animé, catalogue, fiche produit avec zoom sur les photos, blog, FAQ, page À propos, contact, ticker défilant en haut de page et footer configurable. Compte acheteur et panier intégrés.",
              icone: '💎', couleur: '#c9a96e', disponible: true, badge: 'Premium', badgeCouleur: '#c9a96e',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Blog', 'FAQ', 'À propos', 'Contact', 'Panier', 'Wishlist', 'Compte'],
            },
            {
              id: 'boutique-simple', titre: 'Mono-produit',
              desc: "Une seule page de vente pour UN produit (avec ses variantes et options), pensée pour convaincre : accroches, vidéo de présentation, phrase défilante, valeurs, chronologie, tableau comparatif, avis et FAQ. Vous choisissez les blocs, leur ordre et ce qui est affiché. Paiement Stripe ou PayPal intégré.",
              icone: '🎯', couleur: '#a855f7', disponible: true,
              pages: ['Page de vente', 'Blog', 'FAQ', 'À propos', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-complete', titre: 'Boutique Complète',
              desc: "Boutique multi-produits au look clair : catalogue de vos annonces (recherche, filtres, fiche produit), panier et paiement, compte acheteur avec historique des commandes, blog, FAQ, à propos et contact. Logo, couleurs et police (Moderne, Classique ou Manuscrite) réglables.",
              icone: '🏪', couleur: '#16a34a', disponible: true,
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Blog', 'FAQ', 'À propos', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-catalogue', titre: 'Catalogue Avancé',
              desc: "Boutique au thème sombre (clair au choix) avec menu à sous-menus et méga-menu configurables : catégories en survol, filtres avancés (prix, promo, stock, tri), tuiles de catégories, bande d'annonce défilante. Panier, paiement Stripe ou PayPal, compte acheteur, blog, FAQ, à propos et contact. Logo, couleurs et police réglables.",
              icone: '🗂️', couleur: '#3b82f6', disponible: true,
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Blog', 'FAQ', 'À propos', 'Contact', 'Panier', 'Compte'],
            },
          ]
        },
        {
          titre: 'Par industrie',
          templates: [
            {
              id: 'boutique-simplisse-mode', titre: 'Simplisse Mode',
              desc: "Boutique mode & vêtements au style éditorial ivoire & bordeaux. Lookbook, section Instagram, filtres taille/couleur tirés de vos variantes, guide des tailles que vous saisissez, bandeau défilant, popup promo, panier et paiement, compte acheteur. Compatible avec les add-ons (favoris, avis, infolettre, chatbot…).",
              icone: '👗', couleur: '#722f37', disponible: true, badge: 'Nouveau', badgeCouleur: '#722f37',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Lookbook', 'Blog', 'FAQ', 'À propos', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-artisan', titre: 'Simplisse Artisan',
              desc: "Pour les artisans et créateurs, au style galerie d'art : thème clair, hero plein écran, collections en tuiles, galerie de photos, blocs de collection (photo + texte), panier et paiement Stripe ou PayPal, compte acheteur, blog, FAQ et contact. Sections masquables et réordonnables.",
              icone: '🎨', couleur: '#111111', disponible: true, badge: 'Nouveau', badgeCouleur: '#111111',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', "L'atelier", 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-auto', titre: 'Simplisse Auto',
              desc: "Pour les vendeurs de pièces auto et mécaniques : en-tête foncé avec recherche et « Mon garage », bandeau défilant, recherche par marque / modèle / année, cartes de catégories, tuiles promo, compte à rebours, marques, tableau comparatif, réservation de rendez-vous, panier et paiement Stripe ou PayPal, compte acheteur, blog, FAQ et contact. Sections masquables et réordonnables.",
              icone: '🚗', couleur: '#d9670b', disponible: true, badge: 'Nouveau', badgeCouleur: '#d9670b',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-jouets', titre: 'Simplisse Jouets',
              desc: "Pour les boutiques de jouets : barre bleue et en-tête rouge avec recherche, diaporama, rangées de produits qui défilent, grandes bannières, tuiles, chercheur de cadeau (âge, type, budget), photos de la communauté, mosaïque, chiffres clés, magasiner par âge, aperçu du blogue, panier et paiement Stripe ou PayPal, compte acheteur, FAQ et contact. Tout est réglable.",
              icone: '🧸', couleur: '#de1b2d', disponible: true, badge: 'Nouveau', badgeCouleur: '#de1b2d',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-gothique', titre: 'Simplisse Gothique',
              desc: "Boutique noire à l'allure gothique : nom en police gothique, image pleine largeur, bandeaux défilants, grilles de produits à fines lignes, collections, grande affiche, avantages, avis, blogue et grand nom en pied de page. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🖤', couleur: '#e8590c', disponible: true, badge: 'Nouveau', badgeCouleur: '#e8590c',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-bd', titre: 'Simplisse BD',
              desc: "Boutique colorée au style bande dessinée : diaporama avec bulle de BD, bandeau défilant, cartes promo, rangées de produits qui défilent, compte à rebours, collections, avis et blogue. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '💥', couleur: '#1570e0', disponible: true, badge: 'Nouveau', badgeCouleur: '#1570e0',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-futuriste', titre: 'Simplisse Futuriste',
              desc: "Boutique futuriste en blocs noirs arrondis : diaporama texte sur photo, bandeau défilant, engagements en cartes, points forts numérotés, grandes bannières, accordéons de questions, grille de garanties, avis violets et compte à rebours. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '⚡', couleur: '#1de48a', disponible: true, badge: 'Nouveau', badgeCouleur: '#1de48a',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-tech', titre: 'Simplisse Tech',
              desc: "Boutique techno et gaming : fond bleu nuit, violet néon, diaporama plein écran, mosaïque de catégories, détails d'un produit, rangées de produits avec mot géant, tableau comparatif, avis en mosaïque et compte à rebours. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🎮', couleur: '#8b2cf5', disponible: true, badge: 'Nouveau', badgeCouleur: '#8b2cf5',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-rose', titre: 'Simplisse Rosé',
              desc: "Boutique rose et lilas : bordures épaisses, bords ondulés, diaporama photo + texte, texte ondulé qui défile, collections, vitrine à points cliquables, tableau comparatif, avis et galerie de photos. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🌸', couleur: '#e0147a', disponible: true, badge: 'Nouveau', badgeCouleur: '#e0147a',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-bonbon', titre: 'Simplisse Bonbon',
              desc: "Boutique pastel bleu ciel et rose : menu latéral (catégories, réseaux, produits populaires), diaporama à flèches avec légende rose, bandeau dégradé, vidéo YouTube ou Vimeo, collections, avis. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🍬', couleur: '#d81e7c', disponible: true, badge: 'Nouveau', badgeCouleur: '#d81e7c',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-soleil', titre: 'Simplisse Soleil',
              desc: "Boutique ensoleillée : ciel bleu et fond crème, orange, menu latéral (catégories, réseaux, produits populaires en liste), diaporama à légende orange, bandeau d'offre, vidéo YouTube ou Vimeo, collines et soleil au pied de page. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '☀️', couleur: '#c95500', disponible: true, badge: 'Nouveau', badgeCouleur: '#c95500',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-sentier', titre: 'Simplisse Sentier',
              desc: "Boutique sportive et sobre : fond noir et vert sauge, grande photo pleine largeur au titre en majuscules, produits sans cadre, bandeau d'offre, compte à rebours, vidéo YouTube ou Vimeo, pied de page sauge. Mode clair possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🚵', couleur: '#5d7157', disponible: true, badge: 'Nouveau', badgeCouleur: '#5d7157',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-chantier', titre: 'Simplisse Chantier',
              desc: "Quincaillerie et outils : grand bloc jaune arrondi avec photo et deux produits, cartes blanches arrondies, bandeau d'offre jaune, compte à rebours, tableau comparatif, avis et blogue. Mode sombre possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🔨', couleur: '#1c1309', disponible: true, badge: 'Nouveau', badgeCouleur: '#1c1309',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-cafe', titre: 'Simplisse Café',
              desc: "Café et torréfaction : photo pleine largeur avec titre en bas à gauche, cartes caramel arrondies, bandeau d'offre brun, compte à rebours, avis et blogue. Mode sombre brun possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '☕', couleur: '#2a1608', disponible: true, badge: 'Nouveau', badgeCouleur: '#2a1608',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-sakura', titre: 'Simplisse Sakura',
              desc: "Papeterie et créativité : fond rose pâle, corail, titres manuscrits, photo centrée avec flèches, lignes ondulées, bande défilante à motif d’écailles, avis et blogue. Mode sombre possible. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🌸', couleur: '#e0525c', disponible: true, badge: 'Nouveau', badgeCouleur: '#e0525c',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-sport', titre: 'Simplisse Sport',
              desc: "Sport et souliers : marine et vert menthe, titres très gras, photo pleine largeur avec encoche en V, bande géante qui défile, séparateurs en chevrons, avis et blogue. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '👟', couleur: '#4de3c1', disponible: true, badge: 'Nouveau', badgeCouleur: '#4de3c1',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-joyau', titre: 'Simplisse Joyau',
              desc: "Bijoux et luxe : fond crème et terre cuite, titres à empattements, collections en cercles, bande géante en lettres creuses, avis avec bandeau vertical et calendrier d’événements. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '💍', couleur: '#b4532a', disponible: true, badge: 'Nouveau', badgeCouleur: '#b4532a',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-ecume', titre: 'Simplisse Écume',
              desc: "Style simple et lumineux : bleu cobalt et rose, grande photo centrée, ruban ondulé qui défile, bandes rayées, avis sur fond rose et accordéon avec photo. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🌊', couleur: '#2c4fe6', disponible: true, badge: 'Nouveau', badgeCouleur: '#2c4fe6',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-audace', titre: 'Simplisse Audace',
              desc: "Style affirmé : marine et vert lime, titres en majuscules, photos inclinées avec ombres dures, bandeau défilant avec étiquette, palmarès numéroté, onglets de catégories. Mode clair ou sombre. Tout est réglable, avec panier, compte acheteur et tous les add-ons.",
              icone: '🔥', couleur: '#c8ff2e', disponible: true, badge: 'Nouveau', badgeCouleur: '#c8ff2e',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'À propos', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
            {
              id: 'boutique-agricole', titre: 'Boutique Agricole',
              desc: "Boutique de ferme au look terroir sombre et doré : produits de la ferme, page Notre ferme, philosophie, visites, panier et paiement Stripe ou PayPal, compte acheteur, blog, FAQ et contact. Textes, couleurs, police et sections réglables.",
              icone: '🌾', couleur: '#c9854a', disponible: true, badge: 'Nouveau', badgeCouleur: '#c9854a',
              pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Notre ferme', 'Blog', 'FAQ', 'Contact', 'Panier', 'Compte'],
            },
          ]
        },
      ]
    },
    {
      id: 'multivendeur' as const,
      titre: '🏪 Multivendeur',
      desc: 'Marketplace complète avec plusieurs vendeurs indépendants, catalogue unifié, boutiques individuelles et système d\'enchères.',
      couleurGroupe: '#fbbf24',
      nouveau: true,
      sousGroupes: [
        {
          templates: [
            {
              id: 'multi-vendeur-premium', titre: 'Multi-Vendeur Premium',
              desc: 'Marketplace multi-vendeur complète inspirée de e-Vend. Accueil avec catégories, catalogue avec filtres avancés, boutiques vendeurs, fiche produit, enchères, documents et politiques. Style sombre & doré.',
              icone: '🏪', couleur: '#fbbf24', disponible: true, badge: 'Nouveau', badgeCouleur: '#fbbf24',
              pages: ['Accueil', 'Catalogue', 'Boutiques', 'Fiche produit', 'Enchères', 'Documents', 'Politiques'],
            },
            {
              id: 'multi-vendeur-local', titre: 'Marché Local',
              desc: 'Marketplace axée produits locaux et artisans régionaux. Bientôt.',
              icone: '🌾', couleur: '#78350f', disponible: false, badge: 'Bientôt', badgeCouleur: '#78350f', pages: [],
            },
          ]
        },
      ]
    },
    {
      id: 'cagnottes' as const,
      titre: '💝 Cagnottes',
      desc: 'Collecte de fonds en ligne — recevez des dons via Stripe directement dans votre compte.',
      couleurGroupe: '#ec4899',
      sousGroupes: [
        {
          templates: [
            { id: 'cagnotte-personnel',     titre: 'Personnel',     desc: "Besoin d'aide financière, frais médicaux, accident de vie.",         icone: '❤️', couleur: '#ec4899', disponible: true },
            { id: 'cagnotte-projet',        titre: 'Projet',        desc: 'Financer un projet créatif, artistique ou entrepreneurial.',           icone: '🚀', couleur: '#6366f1', disponible: true },
            { id: 'cagnotte-communaute',    titre: 'Communauté',    desc: 'Cause collective, association, équipe sportive, école.',               icone: '🤝', couleur: '#0ea5e9', disponible: true },
            { id: 'cagnotte-environnement', titre: 'Environnement', desc: 'Cause verte, protection des animaux, nature.',                         icone: '🌿', couleur: '#16a34a', disponible: true },
            { id: 'cagnotte-urgence',       titre: 'Urgence',       desc: 'Catastrophe naturelle, sinistre, crise humanitaire.',                  icone: '🆘', couleur: '#dc2626', disponible: true },
          ]
        },
      ]
    },
    {
      id: 'encheres' as const,
      titre: '🔨 Enchères',
      desc: "Sites d'enchères en temps réel — du mono-produit au méga site multi-lots.",
      couleurGroupe: '#dc2626',
      sousGroupes: [
        {
          templates: [
            { id: 'enchere-flash',   titre: 'Enchère Flash',   desc: 'Un produit, tension maximale. Compte à rebours géant + mises en temps réel.', icone: '⚡', couleur: '#dc2626', disponible: true },
            { id: 'enchere-galerie', titre: 'Enchère Galerie', desc: 'Plusieurs lots, style maison de ventes. Filtres + modal par lot.',             icone: '🏛', couleur: '#c9a96e', disponible: true },
            { id: 'enchere-live',    titre: 'Enchère Live',    desc: 'Méga site style bourse — ticker défilant, sidebar lots, proxy bid auto.',      icone: '📡', couleur: '#6366f1', disponible: true },
          ]
        },
      ]
    },
    // ─── Catégories à venir — pas encore de templates ────────────────────
    {
      id: 'annonces' as const,
      titre: '📋 Petites annonces',
      desc: 'Publier une annonce et se faire contacter — sans panier ni vendeur structuré. Immobilier, véhicules, emploi.',
      couleurGroupe: '#14b8a6',
      aVenir: true,
      sousGroupes: []
    },
    {
      id: 'abonnements' as const,
      titre: '🔄 Abonnements',
      desc: "Accès récurrent à du contenu ou une communauté — association, club, contenu premium mensuel.",
      couleurGroupe: '#8b5cf6',
      aVenir: true,
      sousGroupes: []
    },
    {
      id: 'locations' as const,
      titre: '🏠 Locations',
      desc: 'Location de biens avec calendrier de disponibilité et dépôt — équipement, chalets, véhicules.',
      couleurGroupe: '#84cc16',
      sousGroupes: [
        {
          templates: [
            { id: 'reservation-location', titre: "Location d'objet", desc: 'Location de matériel, jeux gonflables, véhicules. Calendrier + dispo.', icone: '📦', couleur: '#84cc16', disponible: true },
          ]
        },
      ]
    },
  ];

  const COULEUR_MP = '#2563eb';

  // ─── Palette sombre — même logique que ConfigurationEncheres.tsx ───────────
  const C = {
    bg: '#0d0d12',
    cardBg: 'rgba(255,255,255,0.03)',
    cardBgHover: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    inputBg: 'rgba(255,255,255,0.05)',
    text: '#fff',
    textLight: 'rgba(255,255,255,0.55)',
    textDim: 'rgba(255,255,255,0.35)',
    red: '#ef4444',
    redLight: 'rgba(239,68,68,0.15)',
  };

  // ─── Stats pour le header dégradé ────────────────────────────────────────
  const tousLesTemplates = categories.flatMap(c => c.sousGroupes.flatMap(sg => sg.templates));
  const nbTemplatesTotal = tousLesTemplates.length;
  const nbGratuits = tousLesTemplates.filter((t: any) => t.disponible && !t.prix).length;
  const nbCategories = categories.filter(c => !(c as any).aVenir).length;

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 96px)', background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <div className="pct-wrap" style={{ maxWidth: 1300, margin: '0 auto' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');
        .template-card { transition: all 0.2s ease; }
        .template-card:hover { transform: translateY(-3px); }
        .badge-nouveau { animation: pulse-badge 2s ease-in-out infinite; }
        .onglet-cat { transition: all 0.2s ease; }
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }

        /* ── Responsive mobile ─────────────────────────────────────────── */
        .pct-wrap { padding: 40px 32px; }
        .pct-hero { padding: 32px; }
        .pct-hero h1 { font-size: 32px; }
        .pct-hero-stats { gap: 40px; }
        .pct-onglets { gap: 8px; margin-bottom: 0; }
        .pct-onglet-btn { padding: 10px 20px; font-size: 14px; }
        .pct-desc-toggle { display: none; }
        .pct-desc-box { display: flex; }
        @media (max-width: 640px) {
          .pct-wrap { padding: 20px 16px; }
          .pct-hero { padding: 22px 18px; border-radius: 18px; }
          .pct-hero h1 { font-size: 24px; }
          .pct-hero p { font-size: 14px !important; }
          .pct-hero-stats { gap: 22px; }
          .pct-hero-stats > div > div:first-child { font-size: 22px !important; }
          .pct-onglets { gap: 6px; }
          .pct-onglet-btn { padding: 8px 12px; font-size: 12px; }
          .pct-desc-toggle { display: flex; align-items: center; gap: 6px; width: 100%; padding: 10px 14px; margin-bottom: 12px; }
          .pct-desc-box { display: none; margin-bottom: 20px !important; }
          .pct-desc-box.pct-desc-open { display: flex; }
          .pct-desc-box { padding: 14px 16px !important; font-size: 12px !important; }
        }
        @media (max-width: 420px) {
          .pct-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Modal palier Simplisse */}
      {modalModeOuvert && (
        <ModalPalierSimplisseMode
          onConfirmer={handleConfirmerPalierMode}
          onAnnuler={() => setModalModeOuvert(false)}
        />
      )}
      {modalCompleteOuvert && paliersComplete.length > 0 && (
        <ModalPalierComplete
          paliers={paliersComplete}
          onConfirmer={handleConfirmerPalierComplete}
          onAnnuler={() => setModalCompleteOuvert(false)}
        />
      )}
      {modalCatalogueOuvert && paliersCatalogue.length > 0 && (
        <ModalPalierComplete
          paliers={paliersCatalogue}
          nom="Catalogue Avancé" icone="🗂️" couleur="#3b82f6"
          onConfirmer={handleConfirmerPalierCatalogue}
          onAnnuler={() => setModalCatalogueOuvert(false)}
        />
      )}
      {modalArtisanOuvert && paliersArtisan.length > 0 && (
        <ModalPalierComplete
          paliers={paliersArtisan}
          nom="Simplisse Artisan" icone="🎨" couleur="#111111"
          onConfirmer={handleConfirmerPalierArtisan}
          onAnnuler={() => setModalArtisanOuvert(false)}
        />
      )}
      {modalAutoOuvert && paliersAuto.length > 0 && (
        <ModalPalierComplete
          paliers={paliersAuto}
          nom="Simplisse Auto" icone="🚗" couleur="#d9670b"
          onConfirmer={handleConfirmerPalierAuto}
          onAnnuler={() => setModalAutoOuvert(false)}
        />
      )}
      {modalJouetsOuvert && paliersJouets.length > 0 && (
        <ModalPalierComplete
          paliers={paliersJouets}
          nom="Simplisse Jouets" icone="🧸" couleur="#de1b2d"
          onConfirmer={handleConfirmerPalierJouets}
          onAnnuler={() => setModalJouetsOuvert(false)}
        />
      )}
      {modalGothiqueOuvert && paliersGothique.length > 0 && (
        <ModalPalierComplete
          paliers={paliersGothique}
          nom="Simplisse Gothique" icone="🖤" couleur="#e8590c"
          onConfirmer={handleConfirmerPalierGothique}
          onAnnuler={() => setModalGothiqueOuvert(false)}
        />
      )}
      {modalBDOuvert && paliersBD.length > 0 && (
        <ModalPalierComplete
          paliers={paliersBD}
          nom="Simplisse BD" icone="💥" couleur="#1570e0"
          onConfirmer={handleConfirmerPalierBD}
          onAnnuler={() => setModalBDOuvert(false)}
        />
      )}
      {modalFuturisteOuvert && paliersFuturiste.length > 0 && (
        <ModalPalierComplete
          paliers={paliersFuturiste}
          nom="Simplisse Futuriste" icone="⚡" couleur="#1de48a"
          onConfirmer={handleConfirmerPalierFuturiste}
          onAnnuler={() => setModalFuturisteOuvert(false)}
        />
      )}
      {modalTechOuvert && paliersTech.length > 0 && (
        <ModalPalierComplete
          paliers={paliersTech}
          nom="Simplisse Tech" icone="🎮" couleur="#8b2cf5"
          onConfirmer={handleConfirmerPalierTech}
          onAnnuler={() => setModalTechOuvert(false)}
        />
      )}
      {modalRoseOuvert && paliersRose.length > 0 && (
        <ModalPalierComplete
          paliers={paliersRose}
          nom="Simplisse Rosé" icone="🌸" couleur="#e0147a"
          onConfirmer={handleConfirmerPalierRose}
          onAnnuler={() => setModalRoseOuvert(false)}
        />
      )}
      {modalBonbonOuvert && paliersBonbon.length > 0 && (
        <ModalPalierComplete
          paliers={paliersBonbon}
          nom="Simplisse Bonbon" icone="🍬" couleur="#d81e7c"
          onConfirmer={handleConfirmerPalierBonbon}
          onAnnuler={() => setModalBonbonOuvert(false)}
        />
      )}
      {modalSoleilOuvert && paliersSoleil.length > 0 && (
        <ModalPalierComplete
          paliers={paliersSoleil}
          nom="Simplisse Soleil" icone="☀️" couleur="#c95500"
          onConfirmer={handleConfirmerPalierSoleil}
          onAnnuler={() => setModalSoleilOuvert(false)}
        />
      )}
      {modalSentierOuvert && paliersSentier.length > 0 && (
        <ModalPalierComplete
          paliers={paliersSentier}
          nom="Simplisse Sentier" icone="🚵" couleur="#5d7157"
          onConfirmer={handleConfirmerPalierSentier}
          onAnnuler={() => setModalSentierOuvert(false)}
        />
      )}
      {modalChantierOuvert && paliersChantier.length > 0 && (
        <ModalPalierComplete
          paliers={paliersChantier}
          nom="Simplisse Chantier" icone="🔨" couleur="#1c1309"
          onConfirmer={handleConfirmerPalierChantier}
          onAnnuler={() => setModalChantierOuvert(false)}
        />
      )}
      {modalCafeOuvert && paliersCafe.length > 0 && (
        <ModalPalierComplete
          paliers={paliersCafe}
          nom="Simplisse Café" icone="☕" couleur="#2a1608"
          onConfirmer={handleConfirmerPalierCafe}
          onAnnuler={() => setModalCafeOuvert(false)}
        />
      )}
      {modalSakuraOuvert && paliersSakura.length > 0 && (
        <ModalPalierComplete
          paliers={paliersSakura}
          nom="Simplisse Sakura" icone="🌸" couleur="#e0525c"
          onConfirmer={handleConfirmerPalierSakura}
          onAnnuler={() => setModalSakuraOuvert(false)}
        />
      )}
      {modalSportOuvert && paliersSport.length > 0 && (
        <ModalPalierComplete
          paliers={paliersSport}
          nom="Simplisse Sport" icone="👟" couleur="#4de3c1"
          onConfirmer={handleConfirmerPalierSport}
          onAnnuler={() => setModalSportOuvert(false)}
        />
      )}
      {modalJoyauOuvert && paliersJoyau.length > 0 && (
        <ModalPalierComplete
          paliers={paliersJoyau}
          nom="Simplisse Joyau" icone="💍" couleur="#b4532a"
          onConfirmer={handleConfirmerPalierJoyau}
          onAnnuler={() => setModalJoyauOuvert(false)}
        />
      )}
      {modalEcumeOuvert && paliersEcume.length > 0 && (
        <ModalPalierComplete
          paliers={paliersEcume}
          nom="Simplisse Écume" icone="🌊" couleur="#2c4fe6"
          onConfirmer={handleConfirmerPalierEcume}
          onAnnuler={() => setModalEcumeOuvert(false)}
        />
      )}
      {modalAudaceOuvert && paliersAudace.length > 0 && (
        <ModalPalierComplete
          paliers={paliersAudace}
          nom="Simplisse Audace" icone="🔥" couleur="#c8ff2e"
          onConfirmer={handleConfirmerPalierAudace}
          onAnnuler={() => setModalAudaceOuvert(false)}
        />
      )}
      {modalAgricoleOuvert && paliersAgricole.length > 0 && (
        <ModalPalierComplete
          paliers={paliersAgricole}
          nom="Boutique Agricole" icone="🌾" couleur="#c9854a"
          onConfirmer={handleConfirmerPalierAgricole}
          onAnnuler={() => setModalAgricoleOuvert(false)}
        />
      )}
      {modalPremiumOuvert && (
        <ModalPalierPremium
          onConfirmer={handleConfirmerPalierPremium}
          onAnnuler={() => setModalPremiumOuvert(false)}
        />
      )}
      {modalSimplisseOuvert && (
        <ModalPalierSimplisse
          onConfirmer={handleConfirmerPalier}
          onAnnuler={() => setModalSimplisseOuvert(false)}
        />
      )}

      {/* Modal réinitialisation */}
      {modalResetOuvert && gestionnaireId && (
        <ModalReinitialisationTemplate
          gestionnaireId={gestionnaireId}
          onConfirme={() => { setModalResetOuvert(false); onChoisir(''); }}
          onAnnuler={() => setModalResetOuvert(false)}
        />
      )}

      {/* ── Header dégradé — style ConfigurationEncheres (mêmes couleurs) ─── */}
      <div className="pct-hero" style={{
        background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)',
        borderRadius: '24px', marginBottom: '28px',
        position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.5s ease',
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <span style={{ fontSize: '40px' }}>🧩</span>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: '#fff', fontFamily: "'Sora', sans-serif" }}>
              Choisir un template
            </h1>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '560px' }}>
            Sélectionnez le type de site qui correspond à votre activité. Vous pourrez changer de template en tout temps depuis ce menu.
          </p>

          <div className="pct-hero-stats" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{nbTemplatesTotal}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Templates disponibles</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{nbCategories}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Catégories</div>
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{nbGratuits}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Gratuits</div>
            </div>
          </div>

          {/* Vous voulez changer de template ? — intégré dans le header, sous les stats */}
          {gestionnaireId && (
            <div style={{
              marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🔄</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>Vous voulez changer de template ?</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Reinitialiser efface uniquement la config du template — vos produits et donnees sont conserves.</p>
                </div>
              </div>
              <button
                onClick={() => setModalResetOuvert(true)}
                style={{ padding: '8px 18px', background: '#fff', border: 'none', borderRadius: 8, color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 8px 16px -8px rgba(0,0,0,0.3)' }}
              >
                🗑️ Reinitialiser le template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── SECTION CATÉGORIES AMÉLIORÉE ─────────────────────────────────── */}
      {/* En-tête de la section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 14,
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📂</span>
          <h2 style={{ 
            fontSize: 15, 
            fontWeight: 700, 
            color: C.text, 
            margin: 0,
            fontFamily: "'Sora', sans-serif",
            letterSpacing: '-0.02em'
          }}>
            Catégories
          </h2>
          <span style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: C.textDim,
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 10px',
            borderRadius: 20
          }}>
            {categories.length}
          </span>
        </div>
        <div style={{ 
          fontSize: 11, 
          color: C.textDim,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>💡</span>
          <span>Cliquez sur une catégorie pour voir ses templates</span>
        </div>
      </div>

      {/* Barre d'onglets — avec fond bien visible */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 16,
        padding: 8,
        marginBottom: 24,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        <div className="pct-onglets" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 6,
          marginBottom: 0 
        }}>
          {categories.map(cat => {
            const actif = ongletCategorie === cat.id;
            const aVenir = !!(cat as any).aVenir;
            return (
              <button 
                key={cat.id} 
                onClick={() => { setOngletCategorie(cat.id); setDescOuverte(false); }} 
                className="onglet-cat pct-onglet-btn"
                style={{
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 13,
                  padding: '8px 18px',
                  color: actif ? '#0d0d12' : 'rgba(255,255,255,0.7)',
                  background: actif ? cat.couleurGroupe : 'rgba(255,255,255,0.06)',
                  border: `1.5px solid ${actif ? cat.couleurGroupe : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8,
                  boxShadow: actif ? `0 4px 12px -6px ${cat.couleurGroupe}` : 'none',
                  opacity: aVenir && !actif ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!actif) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={e => {
                  if (!actif) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  }
                }}
              >
                {cat.titre}
                {aVenir && (
                  <span style={{ 
                    fontSize: 8, 
                    fontWeight: 700, 
                    background: actif ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)', 
                    color: actif ? '#0d0d12' : 'rgba(255,255,255,0.5)', 
                    padding: '2px 8px', 
                    borderRadius: 20, 
                    letterSpacing: '0.05em' 
                  }}>
                    BIENTÔT
                  </span>
                )}
                {actif && (
                  <span style={{ 
                    fontSize: 12,
                    marginLeft: 2
                  }}>
                    ✦
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── DESCRIPTION DE LA CATÉGORIE ACTIVE — AMÉLIORÉE ────────────── */}
      {categories.filter(cat => cat.id === ongletCategorie).map(categorie => {
        const estMP = !!(categorie as any).nouveau;
        const aVenir = !!(categorie as any).aVenir;
        return (
          <div key={categorie.id}>
            {/* Description améliorée avec toggle */}
            <div style={{ marginBottom: 28 }}>
              <button
                type="button"
                className="pct-desc-toggle"
                onClick={() => setDescOuverte(o => !o)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${categorie.couleurGroupe}30`,
                  borderRadius: 10,
                  padding: '10px 16px',
                  color: C.textLight,
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>ℹ️</span>
                  <span>À propos de cette catégorie</span>
                </span>
                <span style={{ fontSize: 16 }}>{descOuverte ? '▲' : '▼'}</span>
              </button>

              <div 
                className={`pct-desc-box${descOuverte ? ' pct-desc-open' : ''}`}
                style={{
                  marginTop: 8,
                  background: `linear-gradient(135deg, ${categorie.couleurGroupe}08, rgba(255,255,255,0.02))`,
                  border: `1px solid ${categorie.couleurGroupe}20`,
                  borderLeft: `4px solid ${categorie.couleurGroupe}`,
                  borderRadius: 12,
                  padding: '18px 22px',
                  display: descOuverte ? 'flex' : 'none',
                  alignItems: 'flex-start',
                  gap: 14,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
                  {categorie.id === 'vitrines' ? '🖼' :
                   categorie.id === 'boutiques' ? '🛍' :
                   categorie.id === 'multivendeur' ? '🏪' :
                   categorie.id === 'cagnottes' ? '💝' :
                   categorie.id === 'encheres' ? '🔨' :
                   categorie.id === 'annonces' ? '📋' :
                   categorie.id === 'abonnements' ? '🔄' : '🏠'}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: 15, 
                    fontWeight: 700, 
                    color: C.text, 
                    margin: '0 0 6px',
                    fontFamily: "'Sora', sans-serif"
                  }}>
                    {categorie.titre}
                  </h3>
                  <p style={{ 
                    fontSize: 13, 
                    color: C.textLight, 
                    margin: 0, 
                    lineHeight: 1.6 
                  }}>
                    {categorie.desc}
                  </p>
                  {!aVenir && (
                    <div style={{ 
                      marginTop: 10, 
                      display: 'flex', 
                      gap: 16,
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ 
                        fontSize: 11, 
                        color: C.textDim,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span>📦</span>
                        {categorie.sousGroupes.flatMap(sg => sg.templates).filter(t => t.disponible).length} templates disponibles
                      </span>
                      <span style={{ 
                        fontSize: 11, 
                        color: C.textDim,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span>🎯</span>
                        {categorie.sousGroupes.flatMap(sg => sg.templates).filter(t => t.disponible && !t.prix).length} gratuits
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {aVenir && (
              <div style={{
                textAlign: 'center', padding: '64px 24px', borderRadius: 24,
                background: C.cardBg, border: `1.5px dashed ${categorie.couleurGroupe}40`,
              }}>
                <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.7 }}>🚧</div>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
                  Bientôt disponible
                </h3>
                <p style={{ fontSize: 13, color: C.textLight, maxWidth: 420, margin: '0 auto' }}>
                  On travaille sur les premiers templates de cette catégorie. Reviens bientôt !
                </p>
              </div>
            )}

            {categorie.sousGroupes.map((sousGroupe, sgIndex) => (
              <div key={sgIndex} style={{ marginBottom: 40 }}>
                {/* Sous-titre interne — seulement si présent (Vitrines / Boutiques) */}
                {(sousGroupe as any).titre && (
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: C.textLight, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Sora', sans-serif" }}>
                    {(sousGroupe as any).titre}
                  </h3>
                )}

                {/* Grille templates */}
                <div className="pct-grid" style={{ display: 'grid', gridTemplateColumns: estMP ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {sousGroupe.templates.map((t: any) => {
                    const estSimplisse     = t.id === 'boutique-simplisse';
                    const estPremium       = t.id === 'boutique-premium';
                    const estSimplisseMode = t.id === 'boutique-simplisse-mode';
                    const estMonoProduit   = t.id === 'boutique-simple';
                    const estComplete      = t.id === 'boutique-complete';
                    const estCatalogue     = t.id === 'boutique-catalogue';
                    const estAgricole      = t.id === 'boutique-agricole';
                    const estArtisan       = t.id === 'boutique-artisan';
                    const estAuto          = t.id === 'boutique-auto';
                    const estJouets        = t.id === 'boutique-jouets';
                    const estGothique      = t.id === 'boutique-gothique';
                    const estBD            = t.id === 'boutique-bd';
                    const estFuturiste     = t.id === 'boutique-futuriste';
                    const estTech          = t.id === 'boutique-tech';
                    const estRose          = t.id === 'boutique-rose';
                    const estBonbon        = t.id === 'boutique-bonbon';
                    const estSoleil        = t.id === 'boutique-soleil';
                    const estSentier        = t.id === 'boutique-sentier';
                    const estChantier        = t.id === 'boutique-chantier';
                    const estCafe        = t.id === 'boutique-cafe';
                    const estSakura        = t.id === 'boutique-sakura';
                    const estSport        = t.id === 'boutique-sport';
                    const estJoyau      = t.id === 'boutique-joyau';
                    const estEcume      = t.id === 'boutique-ecume';
                    const estAudace      = t.id === 'boutique-audace';
                    return (
                      <div key={t.id} className="template-card"
                        onClick={() => {
                          if (!t.disponible) return;
                          if (estSimplisse) { handleChoisirSimplisse(); return; }
                          if (estPremium) { handleChoisirPremium(); return; }
                          if (estSimplisseMode) { handleChoisirSimplisseMode(); return; }
                          if (estComplete) { handleChoisirComplete(); return; }
                          if (estCatalogue) { handleChoisirCatalogue(); return; }
                          if (estAgricole) { handleChoisirAgricole(); return; }
                          if (estArtisan) { handleChoisirArtisan(); return; }
                          if (estAuto) { handleChoisirAuto(); return; }
                          if (estJouets) { handleChoisirJouets(); return; }
                          if (estGothique) { handleChoisirGothique(); return; }
                          if (estBD) { handleChoisirBD(); return; }
                          if (estFuturiste) { handleChoisirFuturiste(); return; }
                          if (estTech) { handleChoisirTech(); return; }
                          if (estRose) { handleChoisirRose(); return; }
                          if (estBonbon) { handleChoisirBonbon(); return; }
                          if (estSoleil) { handleChoisirSoleil(); return; }
                          if (estSentier) { handleChoisirSentier(); return; }
                          if (estChantier) { handleChoisirChantier(); return; }
                          if (estCafe) { handleChoisirCafe(); return; }
                          if (estSakura) { handleChoisirSakura(); return; }
                          if (estSport) { handleChoisirSport(); return; }
                          if (estJoyau) { handleChoisirJoyau(); return; }
                          if (estEcume) { handleChoisirEcume(); return; }
                          if (estAudace) { handleChoisirAudace(); return; }
                          onChoisir(t.id);
                        }}
                        onMouseEnter={e => {
                          if (!t.disponible) return;
                          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${t.couleur}30`;
                          (e.currentTarget as HTMLDivElement).style.borderColor = `${t.couleur}80`;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = estSimplisse ? `0 4px 16px ${COULEUR_MP}20` : 'none';
                          (e.currentTarget as HTMLDivElement).style.borderColor = t.disponible ? `${t.couleur}40` : C.border;
                        }}
                        style={{
                          padding: '20px', borderRadius: 24,
                          border: `2px solid ${t.disponible ? (estSimplisse ? COULEUR_MP + '60' : t.couleur + '40') : C.border}`,
                          background: t.disponible ? (estSimplisse ? `${COULEUR_MP}10` : C.cardBg) : 'rgba(255,255,255,0.015)',
                          cursor: t.disponible ? 'pointer' : 'not-allowed',
                          opacity: t.disponible ? 1 : 0.55,
                          display: 'flex', flexDirection: 'column' as const, gap: 0,
                          boxShadow: estSimplisse ? `0 4px 16px ${COULEUR_MP}20` : 'none',
                          position: 'relative' as const,
                        }}>

                        {estSimplisse && (
                          <div style={{ position: 'absolute', top: -1, right: 16, background: COULEUR_MP, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: '0 0 8px 8px', letterSpacing: '0.05em' }}>
                            LE PLUS POPULAIRE
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, marginTop: estSimplisse ? 10 : 0 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: `${t.couleur}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                            {t.icone}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' as const }}>
                              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0, fontFamily: "'Sora', sans-serif" }}>{t.titre}</h3>
                              {!t.disponible
                                ? <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: C.textDim, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Bientôt</span>
                                : t.badge
                                ? <span style={{ fontSize: 10, background: `${t.badgeCouleur || t.couleur}18`, color: t.badgeCouleur || t.couleur, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{t.badge}</span>
                                : (prixParTemplate[t.id] || (t as any).prix) && (prixParTemplate[t.id] || (t as any).prix) !== 'Gratuit'
                                ? <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{prixParTemplate[t.id] || (t as any).prix}</span>
                                : <span style={{ fontSize: 10, background: `${t.couleur}18`, color: t.couleur, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Gratuit</span>
                              }
                            </div>
                            <p style={{ fontSize: 13, color: C.textLight, lineHeight: 1.55, margin: 0 }}>{t.desc}</p>
                          </div>
                        </div>

                        {t.pages && t.pages.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.textDim, margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Pages incluses</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                              {t.pages.map((page: string) => (
                                <span key={page} style={{ fontSize: 11, fontWeight: 600, background: `${t.couleur}15`, color: t.couleur, padding: '3px 9px', borderRadius: 6, border: `1px solid ${t.couleur}30` }}>
                                  {page}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {estComplete && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '✅ Compte acheteur · historique des commandes · favoris', '✅ Logo, couleurs et police réglables · compatible avec les add-ons'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estCatalogue && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Thème sombre ou clair · menu avec sous-menus et méga-menu réglables', '✅ Filtres avancés : prix, promo, stock, tri', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '✅ Compte acheteur · historique des commandes · favoris', '✅ Logo, couleurs et police réglables · compatible avec les add-ons'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estAgricole && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Notre ferme · philosophie · visites : textes et sections réglables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estArtisan && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Galerie de photos · blocs de collection · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estAuto && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Recherche par véhicule · Mon garage · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estJouets && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Chercheur de cadeau · diaporama · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estGothique && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Police gothique · image pleine largeur · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estBD && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Diaporama bulle de BD · cartes promo · compte à rebours · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estFuturiste && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Blocs noirs arrondis · accordéons · compte à rebours · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estTech && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Mosaïque · détails produit · tableau comparatif · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estRose && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Vagues · vitrine à points · tableau comparatif · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estBonbon && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Menu latéral · diaporama à flèches · bandeau dégradé · vidéo · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estSoleil && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Menu latéral · diaporama à légende orange · bandeau offre · vidéo · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estSentier && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Grande photo pleine largeur · bandeau d\'offre · compte à rebours · vidéo · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estChantier && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Bloc jaune avec photo et produits · bandeau d\'offre · compte à rebours · tableau comparatif · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estCafe && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Photo pleine largeur · cartes caramel · bandeau d\'offre · avis · blogue · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estSakura && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Papeterie et créativité · titres manuscrits · lignes ondulées · avis · blogue · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estSport && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Marine et menthe · titres très gras · photo pleine largeur · avis · blogue · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estJoyau && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Crème et terre cuite · collections en cercles · calendrier d’événements · avis · blogue · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estEcume && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Bleu cobalt et rose · grande photo centrée · ruban ondulé · avis · blogue · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estAudace && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Marine et lime · photos inclinées · palmarès numéroté · avis · blogue · sections masquables et réordonnables', infoPaliers[t.id] ? `✅ Jusqu'à ${infoPaliers[t.id].limiteMax} produits · Catégories · Variantes · Promos` : '✅ Catégories · Variantes · Promos', '✅ Panier & paiement Stripe ou PayPal intégré', '🧩 Add-ons au choix'].map((l, i) => <span key={i}>{l}<br /></span>)}
                              {infoPaliers[t.id] && <>💰 Dès <strong style={{ color: C.text }}>{infoPaliers[t.id].prixMin}/mois</strong> + taxes</>}
                            </p>
                          </div>
                        )}

                        {estMonoProduit && (
                          <div style={{ marginBottom: 14, background: `${t.couleur}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.couleur}30` }}>
                            <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                              {['✅ Géré depuis le tableau de bord — sans code', '✅ Un produit vendu, avec ses variantes et options (couleur, taille…) et leurs photos', '✅ Page de vente en blocs : ordre, affichage et contenu réglables', '✅ Accroches multiples · Vidéo YouTube ou Vimeo · Phrase défilante · Citation · Valeurs · Chronologie · Tableau comparatif', '✅ Bénéfices · Détails · Avis · FAQ · Appel final · Bannière promo', '✅ Panier & paiement Stripe ou PayPal intégré · Barre d\'achat fixe sur mobile', '✅ Footer configurable · Blog · À propos · Contact · Compte acheteur', '🧩 Add-ons au choix : avis, favoris, infolettre, analytique…'].map((l, i) => <span key={i}>{l}<br /></span>)}
                            </p>
                          </div>
                        )}

                        {(estSimplisse || estPremium) && (() => {
                          // Valeurs de départ = paliers affichés dans la fenêtre de choix (repli si le dashboard admin ne répond pas)
                          const rep = estPremium ? { prixMin: '18,99$', limiteMax: 500 } : { prixMin: '15,99$', limiteMax: 200 };
                          const inf = infoPaliers[t.id] || rep;
                          const lignes = estPremium
                            ? ['✅ Géré depuis le tableau de bord — sans code', `✅ Jusqu'à ${inf.limiteMax} produits · Catégories · Variantes · Promos`, '✅ Panier & paiement Stripe ou PayPal intégré', '✅ Footer configurable · Ticker défilant · Zoom image · Blog · FAQ · À propos', '🧩 Add-ons au choix : enchères, offres du jour, avis, favoris, infolettre…']
                            : ['✅ Géré depuis le tableau de bord — sans code', `✅ Jusqu'à ${inf.limiteMax} produits · Catégories · Variantes · Promos`, '✅ Panier & paiement Stripe ou PayPal intégré', '✅ Footer configurable · Bannière promo · Blog · FAQ', '🧩 Add-ons au choix : enchères, offres du jour, avis, favoris, infolettre…'];
                          const coul = estPremium ? t.couleur : COULEUR_MP;
                          return (
                            <div style={{ marginBottom: 14, background: `${coul}12`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${coul}30` }}>
                              <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6 }}>
                                {lignes.map((l, i) => <span key={i}>{l}<br /></span>)}
                                💰 Dès <strong style={{ color: C.text }}>{inf.prixMin}/mois</strong> + taxes
                              </p>
                            </div>
                          );
                        })()}

                        {t.disponible && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={e => { e.stopPropagation(); ouvrirApercu(t.id); }}
                              style={{ padding: '9px 14px', background: C.inputBg, border: `2px solid ${t.couleur}60`, borderRadius: 8, color: t.couleur, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                              👁 Aperçu
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (estSimplisse) { handleChoisirSimplisse(); return; }
                                if (estPremium) { handleChoisirPremium(); return; }
                                if (estSimplisseMode) { handleChoisirSimplisseMode(); return; }
                                if (estComplete) { handleChoisirComplete(); return; }
                                if (estCatalogue) { handleChoisirCatalogue(); return; }
                                if (estAgricole) { handleChoisirAgricole(); return; }
                                if (estArtisan) { handleChoisirArtisan(); return; }
                          if (estAuto) { handleChoisirAuto(); return; }
                          if (estJouets) { handleChoisirJouets(); return; }
                          if (estGothique) { handleChoisirGothique(); return; }
                          if (estBD) { handleChoisirBD(); return; }
                          if (estFuturiste) { handleChoisirFuturiste(); return; }
                          if (estTech) { handleChoisirTech(); return; }
                          if (estRose) { handleChoisirRose(); return; }
                          if (estBonbon) { handleChoisirBonbon(); return; }
                          if (estSoleil) { handleChoisirSoleil(); return; }
                          if (estSentier) { handleChoisirSentier(); return; }
                          if (estChantier) { handleChoisirChantier(); return; }
                          if (estCafe) { handleChoisirCafe(); return; }
                          if (estSakura) { handleChoisirSakura(); return; }
                          if (estSport) { handleChoisirSport(); return; }
                          if (estJoyau) { handleChoisirJoyau(); return; }
                          if (estEcume) { handleChoisirEcume(); return; }
                          if (estAudace) { handleChoisirAudace(); return; }
                                onChoisir(t.id);
                              }}
                              style={{ padding: '9px 20px', background: estSimplisse ? COULEUR_MP : t.couleur, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', flex: 1, fontFamily: 'inherit', boxShadow: `0 8px 16px -8px ${estSimplisse ? COULEUR_MP : t.couleur}` }}>
                              {estSimplisse ? '🛍 Simplisse →' : estPremium ? '💎 Premium →' : estSimplisseMode ? '👗 Mode →' : estAgricole ? '🌾 Agricole →' : estArtisan ? '🎨 Artisan →' : estAuto ? '🚗 Auto →' : estJouets ? '🧸 Jouets →' : estGothique ? '🖤 Gothique →' : estBD ? '💥 BD →' : estFuturiste ? '⚡ Futuriste →' : estTech ? '🎮 Tech →' : estRose ? '🌸 Rosé →' : estBonbon ? '🍬 Bonbon →' : estSoleil ? '☀️ Soleil →' : estSentier ? '🚵 Sentier →' : estChantier ? '🔨 Chantier →' : estCafe ? '☕ Café →' : estSakura ? '🌸 Sakura →' : estSport ? '👟 Sport →' : estJoyau ? '💍 Joyau →' : estEcume ? '🌊 Écume →' : estAudace ? '🔥 Audace →' : 'Choisir →'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          </div>
        );
      })}
      </div>
    </div>
  );
}