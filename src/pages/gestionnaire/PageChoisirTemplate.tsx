// src/pages/gestionnaire/PageChoisirTemplate.tsx
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
      { id: 1, titre: 'T-Shirt Premium Blanc', prix: 29.99, prix_promo: 19.99, stock: 50, categorie: 'Vetements', description: 'T-shirt 100% coton bio, coupe reguliere.', photo_principale: '' },
      { id: 2, titre: 'Casquette Signature', prix: 24.99, stock: 30, categorie: 'Accessoires', description: 'Casquette ajustable brodee. Taille unique.', photo_principale: '' },
      { id: 3, titre: 'Sac Tote Canvas', prix: 34.99, stock: 25, categorie: 'Accessoires', description: 'Sac fourre-tout en canvas epais.', photo_principale: '' },
      { id: 4, titre: 'Hoodie Zip Gris', prix: 59.99, prix_promo: 44.99, stock: 20, categorie: 'Vetements', description: 'Hoodie zip molleton doux.', photo_principale: '' },
      { id: 5, titre: 'Chaussettes Pack x3', prix: 14.99, stock: 100, categorie: 'Vetements', description: 'Pack de 3 paires de chaussettes coton doux.', photo_principale: '' },
      { id: 6, titre: 'Bouteille Inox 500ml', prix: 39.99, stock: 40, categorie: 'Maison', description: 'Bouteille isotherme 24h chaud / 48h froid.', photo_principale: '' },
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

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PageChoisirTemplate({ onChoisir, gestionnaireId }: Props) {
  const [modalSimplisseOuvert, setModalSimplisseOuvert] = useState(false);
  const [enregistrementPlan, setEnregistrementPlan] = useState(false);
  const [modalResetOuvert, setModalResetOuvert] = useState(false);
  const [prixParTemplate, setPrixParTemplate] = useState<Record<string, string>>({});

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
      })
      .catch(() => { /* silencieux — fallback sur les prix codés en dur */ });
  }, []);

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
// PremiumPlan handlers — déclarés plus haut

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

  const groupes = [
    {
      titre: '🛍 Boutique en ligne — Générique',
      desc: "Votre boutique complète hébergée sur e-Vend Studio, entièrement personnalisable à votre image. Gérez vos produits, commandes et apparence depuis votre tableau de bord — sans toucher au code.",
      couleurGroupe: '#2563eb',
      nouveau: true,
      templates: [
        {
          id: 'boutique-simplisse',
          titre: 'Simplisse',
          desc: "La boutique complète, propre et professionnelle. Page d'accueil, catalogue avec filtres, page produit, blog, FAQ, contact et footer configurable. L'équivalent d'un Shopify sans le code.",
          icone: '🛍',
          couleur: '#2563eb',
          disponible: true,
          badge: 'Nouveau',
          badgeCouleur: '#2563eb',
          pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Blog', 'FAQ', 'Contact'],
        },
        {
          id: 'boutique-premium',
          titre: 'Premium',
          desc: "La boutique haut de gamme — style sombre luxueux avec accents dorés. Tout ce que Simplisse offre, plus : zoom image, wishlist, avis clients, ticker défilant, popup promo, notification dernière vente, barre livraison gratuite, compte acheteur intégré.",
          icone: '💎',
          couleur: '#c9a96e',
          disponible: true,
          badge: 'Premium',
          badgeCouleur: '#c9a96e',
          pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Blog', 'FAQ', 'À propos', 'Contact', 'Panier', 'Wishlist', 'Compte'],
        },
        { id: 'boutique-simple',    titre: 'Mono-produit',      desc: 'Une page, checkout intégré, parfait pour lancer un seul produit.',             icone: '🎯', couleur: '#a855f7', disponible: true  },
        { id: 'boutique-complete',  titre: 'Boutique Complète', desc: 'Catalogue, panier, compte acheteur et historique des achats.',                  icone: '🏪', couleur: '#16a34a', disponible: true  },
        { id: 'boutique-catalogue', titre: 'Catalogue Avancé',  desc: 'Grille produits avec filtres avancés et pages produit. Bientôt.',                icone: '🗂️', couleur: '#0ea5e9', disponible: false },
      ]
    },
    {
      titre: '🎨 Boutique en ligne — Par industrie',
      desc: "Boutiques prêtes-à-l'emploi, avec thème visuel et sections dédiées à votre secteur d'activité.",
      couleurGroupe: '#d97706',
      nouveau: true,
      templates: [
        {
          id: 'boutique-simplisse-mode',
          titre: 'Simplisse Mode',
          desc: "Boutique mode & vêtements haut de gamme. Lookbook, filtres taille/couleur visuels, guide des tailles, zoom image, wishlist, popup promo, compte acheteur. Style éditorial ivoire & bordeaux.",
          icone: '👗', couleur: '#722f37', disponible: true, badge: 'Nouveau', badgeCouleur: '#722f37',
          pages: ['Accueil', 'Catalogue', 'Fiche produit', 'Lookbook', 'Blog', 'FAQ', 'Contact', 'Panier', 'Wishlist', 'Compte'],
        },
        {
          id: 'boutique-simplisse-artisan',
          titre: 'Simplisse Artisan',
          desc: "Pour les artisans et créateurs. Mise en avant du savoir-faire, atelier, matériaux. Tons chauds & naturels. Bientôt.",
          icone: '🪵', couleur: '#b45309', disponible: false, badge: 'Bientôt', badgeCouleur: '#b45309', pages: [],
        },
        {
          id: 'boutique-simplisse-aliments',
          titre: 'Simplisse Épicerie',
          desc: "Épicerie fine, produits locaux ou fermiers. Sections origines, producteurs, fraîcheur du jour. Tons verts & terroir. Bientôt.",
          icone: '🥕', couleur: '#16a34a', disponible: false, badge: 'Bientôt', badgeCouleur: '#16a34a', pages: [],
        },
        {
          id: 'boutique-simplisse-numerique',
          titre: 'Simplisse Numérique',
          desc: "Produits numériques — PDF, guides, presets, musique, cours en ligne. Livraison instantanée par courriel. Bientôt.",
          icone: '💾', couleur: '#0891b2', disponible: false, badge: 'Bientôt', badgeCouleur: '#0891b2', pages: [],
        },
        { id: 'agricole', titre: 'Boutique Agricole', desc: 'Ferme maraîchère avec panier intégré, catalogue produits, page Notre Ferme. Style terroir sombre doré.', icone: '🌱', couleur: '#c9854a', disponible: true },
      ]
    },
    {
      titre: '🏪 Transactionnel multi-produit — multi-vendeur',
      desc: 'Marketplace complète avec plusieurs vendeurs indépendants, catalogue unifié, boutiques individuelles et système d\'enchères.',
      couleurGroupe: '#fbbf24',
      nouveau: true,
      templates: [
        {
          id: 'multi-vendeur-premium',
          titre: 'Multi-Vendeur Premium',
          desc: 'Marketplace multi-vendeur complète inspirée de e-Vend. Accueil avec catégories, catalogue avec filtres avancés, boutiques vendeurs, fiche produit, enchères, documents et politiques. Style sombre & doré.',
          icone: '🏪',
          couleur: '#fbbf24',
          disponible: true,
          badge: 'Nouveau',
          badgeCouleur: '#fbbf24',
          pages: ['Accueil', 'Catalogue', 'Boutiques', 'Fiche produit', 'Enchères', 'Documents', 'Politiques'],
        },
        {
          id: 'multi-vendeur-local',
          titre: 'Marché Local',
          desc: 'Marketplace axée produits locaux et artisans régionaux. Bientôt.',
          icone: '🌾',
          couleur: '#78350f',
          disponible: false,
          badge: 'Bientôt',
          badgeCouleur: '#78350f',
          pages: [],
        },
      ]
    }
    ,
    {
      titre: '🖼 Sites vitrine (sans formulaire)',
      desc: 'Présence simple — carte de visite, événement, horaires, sans formulaire de contact.',
      couleurGroupe: '#c9a96e',
      templates: [
        { id: 'vitrine-carte',        titre: 'Carte & Présentation', desc: "Restaurants, bars, hôtels. Horaires + adresse + carte. Simple et efficace.",         icone: '📍', couleur: '#f97316', disponible: true },
        { id: 'vitrine-evenementiel', titre: 'Événementiel',         desc: 'Mariages, conférences, festivals. Compte à rebours + programme + billetterie.',       icone: '🎉', couleur: '#ec4899', disponible: true },
      ]
    },
    {
      titre: '✉️ Sites vitrine (avec formulaire de contact)',
      desc: 'Portfolio, CV, pages pro avec formulaire de contact ou devis intégré.',
      couleurGroupe: '#0ea5e9',
      templates: [
        { id: 'vitrine-portfolio',        titre: 'Portfolio',               desc: 'Artistes, photographes, architectes. Galerie + bio + formulaire contact.',                                                     icone: '🖼',  couleur: '#c9a96e', disponible: true },
        { id: 'vitrine-cv',               titre: 'CV Professionnel',        desc: 'Coachs, consultants, avocats. Services + témoignages + prise de RDV.',                                                          icone: '💼',  couleur: '#0ea5e9', disponible: true },
        { id: 'vitrine-pro-entrepreneur', titre: 'Pro Entrepreneur ⭐',     desc: 'Badge rotatif, stats animées, équipe, blog, témoignages, formulaire devis. 25$.',                                               icone: '🏗️', couleur: '#f59e0b', disponible: true, prix: '25$' },
        { id: 'vitrine-pro-tech',         titre: 'Pro Tech / SaaS ⭐',      desc: 'Ticker défilant, hero vidéo/photo, solutions, tarifs, partenaires. 25$.',                                                        icone: '💻',  couleur: '#c026d3', disponible: true, prix: '25$' },
        { id: 'vitrine-pro-sante',        titre: 'Pro Santé / Clinique ⭐', desc: 'Carte Google Maps, formulaire contact, équipe médicale, FAQ, scroll reveal. 25$.',                                              icone: '🏥',  couleur: '#1e6fa8', disponible: true, prix: '25$' },
        { id: 'vitrine-pro-mariage',      titre: 'Pro Mariage ⭐',          desc: 'RSVP modal, compte à rebours, galerie lightbox, scroll reveal, timeline. 25$.',                                                  icone: '💍',  couleur: '#8b6914', disponible: true, prix: '25$' },
        { id: 'vitrine-pro-beaute',       titre: 'Pro Beauté ⭐',           desc: 'Pétales animés, papillons, fleur rotative configurable. Beauté, cosmétique. 25$.',                                               icone: '🌸',  couleur: '#f4a5a0', disponible: true, prix: '25$' },
        { id: 'vitrine-paysager',         titre: 'Entretien Paysager',      desc: 'Style sombre vert citron bold. Formulaire devis, galerie masonry, avis défilement auto, compteurs animés. Gratuit.',             icone: '🌿',  couleur: '#b5e24a', disponible: true },
      ]
    },
    {
      titre: '🎹 Cours & Formation',
      desc: 'Portfolio artistique et page de cours pour musiciens, coachs et formateurs.',
      couleurGroupe: '#e8a87c',
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
      titre: '🍔 Restaurant & Fast Food',
      desc: 'Site restaurant sombre & vibrant avec menu, réservation de table, avis et Google Maps.',
      couleurGroupe: '#e8820a',
      templates: [
        { id: 'vitrine-boulangerie', titre: 'Boulangerie & Pâtisserie', desc: "Croissant SVG 3D tournant, farine qui tombe, badge sortie du four live, galerie flip 3D, commandes spéciales. Brun chaud & or. Gratuit.", icone: '🥐', couleur: '#8b4513', disponible: true },
        { id: 'vitrine-foodtruck',   titre: 'Food Truck',               desc: "Camion SVG animé + flammes, emplacement GPS du jour, badge Ouvert/Fermé auto, menu flip 3D. Orange & noir. Gratuit.",                      icone: '🚚', couleur: '#ff6b00', disponible: true },
        { id: 'vitrine-resto',       titre: 'Restaurant & Fast Food',   desc: 'Fond noir & orange. Menu burgers, accompagnements, réservation table, avis carrousel, carte Google Maps. Sections réordonnables. Gratuit.', icone: '🍔', couleur: '#e8820a', disponible: true },
        { id: 'vitrine-bistro',      titre: 'Bistro & Café',            desc: 'Fond noir & brun doré. Galerie plein format, menu filtrable par catégorie, réservation, carte Google Maps, sections réordonnables. Gratuit.', icone: '☕', couleur: '#8b6914', disponible: true },
      ]
    },
    {
      titre: '💼 Profession',
      desc: "Sites professionnels dédiés aux services : bureau d'avocat, salon de coiffure et plus.",
      couleurGroupe: '#c9a84c',
      templates: [
        { id: 'vitrine-avocat', titre: "Bureau d'Avocat", desc: 'Marine & or, FAQ accordéon, formulaire consultation, Google Maps, sections réordonnables. Gratuit.', icone: '⚖️', couleur: '#c9a84c', disponible: true },
        { id: 'salon-coiffure', titre: 'Salon de Coiffure ⭐', desc: 'Réservation en ligne, galerie transformations, équipe stylistes, formulaire contact. Effet page de livre + photos twist 3D. 25$.', icone: '✂️', couleur: '#7b7cb6', disponible: true, prix: '25$' },
      ]
    },
    {
      titre: '📅 Formulaires & Réservations',
      desc: 'Sites avec système de réservation intégré — sans paiement en ligne.',
      couleurGroupe: '#6366f1',
      templates: [
        { id: 'reservation-restaurant', titre: 'Restaurant & Café',  desc: 'Réservation de table par créneau horaire avec calendrier visuel.',         icone: '🍽️', couleur: '#f97316', disponible: true },
        { id: 'reservation-location',   titre: "Location d'objet",   desc: 'Location de matériel, jeux gonflables, véhicules. Calendrier + dispo.',    icone: '📦', couleur: '#6366f1', disponible: true },
        { id: 'reservation-service',    titre: 'Service & RDV',      desc: 'Coiffeur, médecin, coach. Prise de rendez-vous par créneau.',              icone: '💈', couleur: '#0ea5e9', disponible: true },
        { id: 'reservation-spectacle',  titre: 'Spectacle & Billet', desc: 'Réservation de sièges numérotés. Plan de salle visuel + gestion billets.', icone: '🎭', couleur: '#ec4899', disponible: true },
      ]
    },
    {
      titre: '💝 CagnottePro',
      desc: 'Collecte de fonds en ligne — recevez des dons via Stripe directement dans votre compte.',
      couleurGroupe: '#ec4899',
      templates: [
        { id: 'cagnotte-personnel',     titre: 'Personnel',     desc: "Besoin d'aide financière, frais médicaux, accident de vie.",         icone: '❤️', couleur: '#ec4899', disponible: true },
        { id: 'cagnotte-projet',        titre: 'Projet',        desc: 'Financer un projet créatif, artistique ou entrepreneurial.',           icone: '🚀', couleur: '#6366f1', disponible: true },
        { id: 'cagnotte-communaute',    titre: 'Communauté',    desc: 'Cause collective, association, équipe sportive, école.',               icone: '🤝', couleur: '#0ea5e9', disponible: true },
        { id: 'cagnotte-environnement', titre: 'Environnement', desc: 'Cause verte, protection des animaux, nature.',                         icone: '🌿', couleur: '#16a34a', disponible: true },
        { id: 'cagnotte-urgence',       titre: 'Urgence',       desc: 'Catastrophe naturelle, sinistre, crise humanitaire.',                  icone: '🆘', couleur: '#dc2626', disponible: true },
      ]
    },
    {
      titre: '🔨 Enchères en ligne',
      desc: "Sites d'enchères en temps réel — du mono-produit au méga site multi-lots.",
      couleurGroupe: '#dc2626',
      templates: [
        { id: 'enchere-flash',   titre: 'Enchère Flash',   desc: 'Un produit, tension maximale. Compte à rebours géant + mises en temps réel.', icone: '⚡', couleur: '#dc2626', disponible: true },
        { id: 'enchere-galerie', titre: 'Enchère Galerie', desc: 'Plusieurs lots, style maison de ventes. Filtres + modal par lot.',             icone: '🏛', couleur: '#c9a96e', disponible: true },
        { id: 'enchere-live',    titre: 'Enchère Live',    desc: 'Méga site style bourse — ticker défilant, sidebar lots, proxy bid auto.',      icone: '📡', couleur: '#6366f1', disponible: true },
      ]
    },
  ];

  const COULEUR_MP = '#2563eb';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .template-card { transition: all 0.2s ease; }
        .template-card:hover { transform: translateY(-3px); }
        .badge-nouveau { animation: pulse-badge 2s ease-in-out infinite; }
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
        }
      `}</style>

      {/* Modal palier Simplisse */}
      {modalModeOuvert && (
        <ModalPalierSimplisseMode
          onConfirmer={handleConfirmerPalierMode}
          onAnnuler={() => setModalModeOuvert(false)}
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

      {/* Bannière réinitialisation — visible seulement si le gestionnaire a déjà un template */}
      {gestionnaireId && (
        <div style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🔄</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Vous voulez changer de template ?</p>
              <p style={{ margin: 0, fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Reinitialiser efface uniquement la config du template — vos produits et donnees sont conserves.</p>
            </div>
          </div>
          <button
            onClick={() => setModalResetOuvert(true)}
            style={{ padding: '8px 18px', background: '#dc2626', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            🗑️ Reinitialiser le template
          </button>
        </div>
      )}

      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>Choisir un template</h1>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 40, lineHeight: 1.6 }}>
        Selectionnez le type de site qui correspond a votre activite.<br />
        Vous pourrez changer de template en tout temps depuis ce menu.
      </p>

      {groupes.map(groupe => {
        const estMP = !!(groupe as any).nouveau;
        return (
          <div key={groupe.titre} style={{ marginBottom: 52 }}>
            {/* En-tête groupe */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
              paddingBottom: 14,
              borderBottom: `2px solid ${estMP ? COULEUR_MP + '40' : groupe.couleurGroupe + '20'}`,
              background: estMP ? `linear-gradient(135deg, ${COULEUR_MP}08 0%, transparent 60%)` : 'transparent',
              borderRadius: estMP ? '12px 12px 0 0' : 0,
              padding: estMP ? '16px 16px 14px' : '0 0 14px',
              margin: estMP ? '0 -8px 20px' : '0 0 20px',
            }}>
              <div style={{ width: 4, height: 28, background: estMP ? COULEUR_MP : groupe.couleurGroupe, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{groupe.titre}</h2>
                  {estMP && (
                    <span className="badge-nouveau" style={{ fontSize: 10, fontWeight: 700, background: COULEUR_MP, color: '#fff', padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>
                      ✨ NOUVEAU
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{groupe.desc}</p>
              </div>
            </div>

            {/* Grille templates */}
            <div style={{ display: 'grid', gridTemplateColumns: estMP ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, padding: estMP ? '0 8px' : 0 }}>
              {groupe.templates.map((t: any) => {
                const estSimplisse     = t.id === 'boutique-simplisse';
                const estPremium       = t.id === 'boutique-premium';
                const estSimplisseMode = t.id === 'boutique-simplisse-mode';
                return (
                  <div key={t.id} className="template-card"
                    onClick={() => {
                      if (!t.disponible) return;
                      if (estSimplisse) { handleChoisirSimplisse(); return; }
                      if (estPremium) { handleChoisirPremium(); return; }
                      if (estSimplisseMode) { handleChoisirSimplisseMode(); return; }
                      onChoisir(t.id);
                    }}
                    onMouseEnter={e => {
                      if (!t.disponible) return;
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${t.couleur}30`;
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${t.couleur}80`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = estSimplisse ? `0 4px 16px ${COULEUR_MP}20` : 'none';
                      (e.currentTarget as HTMLDivElement).style.borderColor = t.disponible ? `${t.couleur}40` : '#e5e7eb';
                    }}
                    style={{
                      padding: '20px', borderRadius: 12,
                      border: `2px solid ${t.disponible ? (estSimplisse ? COULEUR_MP + '60' : t.couleur + '40') : '#e5e7eb'}`,
                      background: t.disponible ? (estSimplisse ? `${COULEUR_MP}06` : `${t.couleur}05`) : '#fafafa',
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
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{t.titre}</h3>
                          {!t.disponible
                            ? <span style={{ fontSize: 10, background: '#e5e7eb', color: '#888', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Bientôt</span>
                            : t.badge
                            ? <span style={{ fontSize: 10, background: `${t.badgeCouleur || t.couleur}18`, color: t.badgeCouleur || t.couleur, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{t.badge}</span>
                            : (prixParTemplate[t.id] || (t as any).prix) && (prixParTemplate[t.id] || (t as any).prix) !== 'Gratuit'
                            ? <span style={{ fontSize: 10, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{prixParTemplate[t.id] || (t as any).prix}</span>
                            : <span style={{ fontSize: 10, background: `${t.couleur}18`, color: t.couleur, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Gratuit</span>
                          }
                        </div>
                        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.55, margin: 0 }}>{t.desc}</p>
                      </div>
                    </div>

                    {t.pages && t.pages.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#999', margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Pages incluses</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                          {t.pages.map((page: string) => (
                            <span key={page} style={{ fontSize: 11, fontWeight: 600, background: `${t.couleur}12`, color: t.couleur, padding: '3px 9px', borderRadius: 6, border: `1px solid ${t.couleur}25` }}>
                              {page}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {estSimplisse && (
                      <div style={{ marginBottom: 14, background: `${COULEUR_MP}08`, borderRadius: 8, padding: '10px 12px', border: `1px solid ${COULEUR_MP}20` }}>
                        <p style={{ fontSize: 11, color: '#555', margin: 0, lineHeight: 1.6 }}>
                          ✅ Géré depuis le tableau de bord — sans code<br />
                          ✅ Jusqu'à 200 produits · Catégories · Variantes · Promos<br />
                          ✅ Panier & paiement Stripe intégré<br />
                          ✅ Footer configurable · Bannière promo · Blog · FAQ<br />
                          💰 Dès <strong>15,99$/mois</strong> + taxes
                        </p>
                      </div>
                    )}

                    {t.disponible && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={e => { e.stopPropagation(); ouvrirApercu(t.id); }}
                          style={{ padding: '9px 14px', background: '#fff', border: `2px solid ${t.couleur}`, borderRadius: 8, color: t.couleur, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                          👁 Aperçu
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (estSimplisse) { handleChoisirSimplisse(); return; }
                            if (estPremium) { handleChoisirPremium(); return; }
                            if (estSimplisseMode) { handleChoisirSimplisseMode(); return; }
                            onChoisir(t.id);
                          }}
                          style={{ padding: '9px 20px', background: estSimplisse ? COULEUR_MP : t.couleur, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', flex: 1, fontFamily: 'inherit', boxShadow: estSimplisse ? `0 2px 8px ${COULEUR_MP}40` : 'none' }}>
                          {estSimplisse ? '🛍 Simplisse →' : estPremium ? '💎 Premium →' : estSimplisseMode ? '👗 Mode →' : 'Choisir →'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}