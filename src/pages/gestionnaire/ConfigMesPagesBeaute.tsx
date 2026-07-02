// src/pages/gestionnaire/ConfigMesPagesBeaute.tsx
// e-Vend Studio — Config pages template Boutique Beauté
// Onglets : Accueil, Collections, Catalogue, Fiche produit, Blog, FAQ, Contact, Footer, Options

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const LAV  = '#c084fc';
const FUCH = '#ec4899';
const TXT  = '#2d1b3d';

interface Props { gestionnaireId: number; }

const ONGLETS = [
  { id:'accueil',    label:'Accueil & Hero',     icone:'🏠' },
  { id:'collections',label:'Collections',         icone:'🗂️' },
  { id:'catalogue',  label:'Catalogue',           icone:'🛍️' },
  { id:'fiche',      label:'Fiche produit',       icone:'📦' },
  { id:'blog',       label:'Blog',                icone:'📝' },
  { id:'faq',        label:'FAQ',                 icone:'❓' },
  { id:'contact',    label:'Contact',             icone:'📬' },
  { id:'footer',     label:'Footer',              icone:'🔻' },
  { id:'options',    label:'Options Beauté',      icone:'⚙️' },
];

const CFG_DEFAUT = {
  nomBoutique:'Ma Boutique Beauté', slogan:'La beauté qui vous ressemble',
  couleurPrimaire:FUCH, couleurSecondaire:LAV, couleurFond:'#fdf4ff',
  tickerTexte:'✿ LIVRAISON GRATUITE dès 75$ ✿ RETOURS GRATUITS 30 JOURS ✿ PAIEMENT SÉCURISÉ ✿',
  afficherTicker:true, afficherPopupPromo:true, afficherNotifVente:true,
  popupPromoTexte:'Bienvenue ! Obtenez -10% sur votre première commande', popupPromoCode:'BEAUTE10',
  seuilLivraisonGratuite:75, instagram:'maboutiquebeaute',
  hero:{ titre:'La Beauté Qui Vous Ressemble', sousTitre:'Découvrez nos soins et maquillage formulés avec soin, pour sublimer votre beauté naturelle.', boutonLabel:'Découvrir la collection', photo:'' },
  aPropos:{ titre:'Des Formules Innovantes Pour Votre Peau', texte:'Nous utilisons les actifs les plus avancés en synergie avec les bienfaits de la nature pour créer des formules qui offrent des résultats visibles.', photo:'', valeurs:['🌱 Formules vegan et cruelty-free','♻️ Emballages recyclables','🔬 Testés dermatologiquement'] },
  catalogue:{ titre:'Notre Catalogue', sousTitre:'', colonnes:3, afficherFiltres:true, afficherRecherche:true },
  fiche:{ afficherAvis:true, afficherSimilaires:true, afficherVariantes:true, afficherReassurance:true, layoutImage:'gauche' },
  blog:{ titre:'Actualités & Conseils Beauté', sousTitre:'Nos experts partagent leurs secrets', afficherAuteur:true, afficherDate:true },
  faq:{ titre:'Des Questions ?', sousTitre:'Voici les réponses aux questions les plus fréquentes.', items:[
    { question:'Quels sont vos délais de livraison ?', reponse:'Les commandes sont expédiées sous 24h ouvrables. Comptez 3–5 jours pour la livraison standard.' },
    { question:'Vos produits sont-ils vraiment vegan ?', reponse:'Oui, 100% de nos formules sont certifiées vegan et cruelty-free.' },
    { question:'Comment appliquer le Sérum Vitamine C ?', reponse:'Appliquez 2–3 gouttes le matin sur peau propre, avant votre crème hydratante.' },
    { question:'Puis-je retourner un produit ?', reponse:'Oui, sous 30 jours suivant la réception. Les retours sont entièrement gratuits.' },
  ]},
  contact:{ titre:'Formulaire de Contact', adresse:'123 rue Principale, Montréal, QC', telephone:'514 000-0000', courriel:'info@maboutiquebeaute.ca' },
  footer:{ nomBoutique:'Ma Boutique Beauté', slogan:'La beauté qui vous ressemble', couleurFond:'#2d1b3d', couleurTexte:'#ffffff', afficherPropulse:true, reseaux:{ facebook:'', instagram:'', tiktok:'', pinterest:'', youtube:'' } },
};

function Champ({ label, value, onChange, type='text', placeholder='', multiline=false, rows=3 }: any) {
  const style: any = { width:'100%', padding:'10px 12px', border:'1px solid #e9d5ff', borderRadius:10, fontSize:13, color:TXT, outline:'none', fontFamily:'inherit', resize:multiline?'vertical':'none', boxSizing:'border-box' };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder} style={style} />
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={style} />
      }
    </div>
  );
}

function Toggle({ label, desc='', value, onChange }: any) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16, padding:'14px 16px', background:'#fdf4ff', borderRadius:12, border:'1px solid #e9d5ff' }}>
      <div style={{ flex:1 }}>
        <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:700, color:TXT }}>{label}</p>
        {desc && <p style={{ margin:0, fontSize:12, color:'#888' }}>{desc}</p>}
      </div>
      <div onClick={()=>onChange(!value)} style={{ width:44, height:24, borderRadius:12, background:value?FUCH:'#ddd', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:value?22:2, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

export default function ConfigMesPagesBeaute({ gestionnaireId }: Props) {
  const [onglet, setOnglet] = useState('accueil');
  const [cfg, setCfg] = useState<any>(CFG_DEFAUT);
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState<'idle'|'ok'|'err'>('idle');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/studio/sites/${gestionnaireId}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.config?.beaute) setCfg((prev:any) => ({ ...prev, ...data.config.beaute })); })
      .catch(() => {});
  }, [gestionnaireId]);

  const set = (chemin: string, val: any) => {
    setCfg((prev:any) => {
      const keys = chemin.split('.');
      if (keys.length === 1) return { ...prev, [keys[0]]: val };
      return { ...prev, [keys[0]]: { ...(prev[keys[0]]||{}), [keys[1]]: val } };
    });
  };

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/studio/sites/${gestionnaireId}/config`, {
        method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        credentials:'include', body: JSON.stringify({ beaute: cfg }),
      });
      if (!res.ok) throw new Error();
      setStatut('ok');
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  const contenu = () => {
    switch (onglet) {

      case 'accueil': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>🏠 Accueil & Hero</h3>
          <Champ label="Nom de la boutique" value={cfg.nomBoutique} onChange={(v:string)=>set('nomBoutique',v)} placeholder="Ma Boutique Beauté" />
          <Champ label="Slogan" value={cfg.slogan} onChange={(v:string)=>set('slogan',v)} placeholder="La beauté qui vous ressemble" />
          <Champ label="Compte Instagram (sans @)" value={cfg.instagram||''} onChange={(v:string)=>set('instagram',v)} placeholder="maboutiquebeaute" />
          <div style={{ background:'#f9f5ff', borderRadius:12, padding:16, marginBottom:20, border:'1px solid #e9d5ff' }}>
            <p style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:14 }}>Section Hero</p>
            <Champ label="Titre principal" value={cfg.hero?.titre||''} onChange={(v:string)=>set('hero.titre',v)} placeholder="La Beauté Qui Vous Ressemble" />
            <Champ label="Sous-titre" value={cfg.hero?.sousTitre||''} onChange={(v:string)=>set('hero.sousTitre',v)} multiline rows={2} />
            <Champ label="Texte du bouton" value={cfg.hero?.boutonLabel||''} onChange={(v:string)=>set('hero.boutonLabel',v)} placeholder="Découvrir la collection" />
            <Champ label="URL photo hero" value={cfg.hero?.photo||''} onChange={(v:string)=>set('hero.photo',v)} placeholder="https://..." />
          </div>
          <div style={{ background:'#f9f5ff', borderRadius:12, padding:16, marginBottom:20, border:'1px solid #e9d5ff' }}>
            <p style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:14 }}>Section À Propos</p>
            <Champ label="Titre" value={cfg.aPropos?.titre||''} onChange={(v:string)=>set('aPropos.titre',v)} />
            <Champ label="Texte" value={cfg.aPropos?.texte||''} onChange={(v:string)=>set('aPropos.texte',v)} multiline rows={4} />
            <Champ label="URL photo" value={cfg.aPropos?.photo||''} onChange={(v:string)=>set('aPropos.photo',v)} placeholder="https://..." />
          </div>
          <div style={{ background:'#fdf4ff', borderRadius:12, padding:16, border:'1px solid #e9d5ff', marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:14 }}>Ticker défilant</p>
            <Toggle label="Afficher le ticker" value={cfg.afficherTicker} onChange={(v:boolean)=>set('afficherTicker',v)} />
            {cfg.afficherTicker && <Champ label="Texte du ticker" value={cfg.tickerTexte||''} onChange={(v:string)=>set('tickerTexte',v)} />}
          </div>
          <div style={{ background:'#fdf4ff', borderRadius:12, padding:16, border:'1px solid #e9d5ff' }}>
            <p style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:14 }}>Popup promo</p>
            <Toggle label="Afficher la popup promo" value={cfg.afficherPopupPromo} onChange={(v:boolean)=>set('afficherPopupPromo',v)} />
            {cfg.afficherPopupPromo && <>
              <Champ label="Texte de la promo" value={cfg.popupPromoTexte||''} onChange={(v:string)=>set('popupPromoTexte',v)} />
              <Champ label="Code promo" value={cfg.popupPromoCode||''} onChange={(v:string)=>set('popupPromoCode',v)} placeholder="BEAUTE10" />
            </>}
          </div>
        </div>
      );

      case 'collections': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>🗂️ Collections</h3>
          <p style={{ fontSize:13, color:'#888', marginBottom:20, lineHeight:1.7 }}>
            La page Collections affiche automatiquement les catégories de vos produits avec le nombre d'articles par catégorie. Les photos sont configurables depuis vos produits.
          </p>
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 16px' }}>
            <p style={{ margin:0, fontSize:13, color:'#16a34a', fontWeight:600 }}>✅ Généré automatiquement depuis vos catégories de produits.</p>
          </div>
        </div>
      );

      case 'catalogue': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>🛍️ Catalogue</h3>
          <Champ label="Titre de la page" value={cfg.catalogue?.titre||''} onChange={(v:string)=>set('catalogue.titre',v)} placeholder="Notre Catalogue" />
          <Champ label="Sous-titre" value={cfg.catalogue?.sousTitre||''} onChange={(v:string)=>set('catalogue.sousTitre',v)} placeholder="" />
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Colonnes par défaut</label>
            <div style={{ display:'flex', gap:8 }}>
              {[2,3,4].map(n=>(
                <button key={n} onClick={()=>set('catalogue.colonnes',n)}
                  style={{ padding:'8px 20px', border:`2px solid ${cfg.catalogue?.colonnes===n?FUCH:'#e9d5ff'}`, background:cfg.catalogue?.colonnes===n?FUCH:'#fff', color:cfg.catalogue?.colonnes===n?'#fff':TXT, borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {n} colonnes
                </button>
              ))}
            </div>
          </div>
          <Toggle label="Afficher les filtres" value={cfg.catalogue?.afficherFiltres!==false} onChange={(v:boolean)=>set('catalogue.afficherFiltres',v)} />
          <Toggle label="Afficher la barre de recherche" value={cfg.catalogue?.afficherRecherche!==false} onChange={(v:boolean)=>set('catalogue.afficherRecherche',v)} />
        </div>
      );

      case 'fiche': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>📦 Fiche produit</h3>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Position de l'image</label>
            <div style={{ display:'flex', gap:8 }}>
              {[{v:'gauche',l:'Gauche'},{ v:'droite',l:'Droite'}].map(opt=>(
                <button key={opt.v} onClick={()=>set('fiche.layoutImage',opt.v)}
                  style={{ padding:'8px 20px', border:`2px solid ${cfg.fiche?.layoutImage===opt.v?FUCH:'#e9d5ff'}`, background:cfg.fiche?.layoutImage===opt.v?FUCH:'#fff', color:cfg.fiche?.layoutImage===opt.v?'#fff':TXT, borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <Toggle label="Afficher les avis clients" value={cfg.fiche?.afficherAvis!==false} onChange={(v:boolean)=>set('fiche.afficherAvis',v)} />
          <Toggle label="Afficher les produits similaires" value={cfg.fiche?.afficherSimilaires!==false} onChange={(v:boolean)=>set('fiche.afficherSimilaires',v)} />
          <Toggle label="Afficher les variantes (couleur, taille…)" value={cfg.fiche?.afficherVariantes!==false} onChange={(v:boolean)=>set('fiche.afficherVariantes',v)} />
          <Toggle label="Afficher la section réassurance" desc="Livraison, retours, vegan, paiement sécurisé" value={cfg.fiche?.afficherReassurance!==false} onChange={(v:boolean)=>set('fiche.afficherReassurance',v)} />
        </div>
      );

      case 'blog': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>📝 Blog</h3>
          <Champ label="Titre de la page" value={cfg.blog?.titre||''} onChange={(v:string)=>set('blog.titre',v)} placeholder="Actualités & Conseils Beauté" />
          <Champ label="Sous-titre" value={cfg.blog?.sousTitre||''} onChange={(v:string)=>set('blog.sousTitre',v)} placeholder="Nos experts partagent leurs secrets" />
          <Toggle label="Afficher l'auteur" value={cfg.blog?.afficherAuteur!==false} onChange={(v:boolean)=>set('blog.afficherAuteur',v)} />
          <Toggle label="Afficher la date" value={cfg.blog?.afficherDate!==false} onChange={(v:boolean)=>set('blog.afficherDate',v)} />
        </div>
      );

      case 'faq': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>❓ FAQ</h3>
          <Champ label="Titre de la page" value={cfg.faq?.titre||''} onChange={(v:string)=>set('faq.titre',v)} placeholder="Des Questions ?" />
          <Champ label="Sous-titre" value={cfg.faq?.sousTitre||''} onChange={(v:string)=>set('faq.sousTitre',v)} multiline rows={2} />
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.06em' }}>Questions & Réponses</label>
            {(cfg.faq?.items||[]).map((item:any,i:number)=>(
              <div key={i} style={{ background:'#fdf4ff', border:'1px solid #e9d5ff', borderRadius:12, padding:14, marginBottom:10 }}>
                <input value={item.question} onChange={e=>{ const items=[...(cfg.faq?.items||[])]; items[i]={...items[i],question:e.target.value}; set('faq.items',items); }}
                  placeholder="Question..." style={{ width:'100%', padding:'8px 10px', border:'1px solid #e9d5ff', borderRadius:8, fontSize:13, color:TXT, marginBottom:8, outline:'none', boxSizing:'border-box' as const, fontFamily:'inherit' }} />
                <textarea value={item.reponse} onChange={e=>{ const items=[...(cfg.faq?.items||[])]; items[i]={...items[i],reponse:e.target.value}; set('faq.items',items); }}
                  rows={2} placeholder="Réponse..." style={{ width:'100%', padding:'8px 10px', border:'1px solid #e9d5ff', borderRadius:8, fontSize:13, color:TXT, outline:'none', resize:'vertical', boxSizing:'border-box' as const, fontFamily:'inherit' }} />
                <button onClick={()=>{ const items=(cfg.faq?.items||[]).filter((_:any,j:number)=>j!==i); set('faq.items',items); }}
                  style={{ marginTop:6, padding:'4px 10px', background:'none', border:'1px solid #fecaca', borderRadius:6, color:'#ef4444', fontSize:11, fontWeight:700, cursor:'pointer' }}>Supprimer</button>
              </div>
            ))}
            <button onClick={()=>set('faq.items',[...(cfg.faq?.items||[]),{question:'',reponse:''}])}
              style={{ padding:'9px 18px', border:`2px dashed ${LAV}`, background:'#fff', borderRadius:10, fontSize:13, fontWeight:700, color:LAV, cursor:'pointer', width:'100%', marginTop:4 }}>
              + Ajouter une question
            </button>
          </div>
        </div>
      );

      case 'contact': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>📬 Contact</h3>
          <Champ label="Titre de la page" value={cfg.contact?.titre||''} onChange={(v:string)=>set('contact.titre',v)} placeholder="Formulaire de Contact" />
          <Champ label="Adresse" value={cfg.contact?.adresse||''} onChange={(v:string)=>set('contact.adresse',v)} placeholder="123 rue Principale, Montréal, QC" />
          <Champ label="Téléphone" value={cfg.contact?.telephone||''} onChange={(v:string)=>set('contact.telephone',v)} placeholder="514 000-0000" />
          <Champ label="Courriel" value={cfg.contact?.courriel||''} onChange={(v:string)=>set('contact.courriel',v)} placeholder="info@maboutiquebeaute.ca" />
        </div>
      );

      case 'footer': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>🔻 Footer</h3>
          <Champ label="Nom de la boutique (footer)" value={cfg.footer?.nomBoutique||''} onChange={(v:string)=>set('footer.nomBoutique',v)} />
          <Champ label="Slogan (footer)" value={cfg.footer?.slogan||''} onChange={(v:string)=>set('footer.slogan',v)} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <Champ label="Couleur de fond" value={cfg.footer?.couleurFond||''} onChange={(v:string)=>set('footer.couleurFond',v)} type="color" />
            <Champ label="Couleur du texte" value={cfg.footer?.couleurTexte||''} onChange={(v:string)=>set('footer.couleurTexte',v)} type="color" />
          </div>
          <p style={{ fontSize:12, fontWeight:800, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Réseaux sociaux</p>
          {['instagram','facebook','tiktok','pinterest','youtube'].map(r=>(
            <Champ key={r} label={r.charAt(0).toUpperCase()+r.slice(1)} value={cfg.footer?.reseaux?.[r]||''} onChange={(v:string)=>setCfg((prev:any)=>({ ...prev, footer:{ ...(prev.footer||{}), reseaux:{ ...(prev.footer?.reseaux||{}), [r]:v } } }))} placeholder={`https://${r}.com/...`} />
          ))}
        </div>
      );

      case 'options': return (
        <div>
          <h3 style={{ fontSize:16, fontWeight:800, color:TXT, marginBottom:20 }}>⚙️ Options Beauté</h3>
          <Toggle label="Notifications de vente" desc="Affiche une bulle en bas à gauche quand un client achète" value={cfg.afficherNotifVente!==false} onChange={(v:boolean)=>set('afficherNotifVente',v)} />
          <Toggle label="Barre progression livraison gratuite" desc="Affiche la progression vers la livraison gratuite dans le header" value={cfg.afficherBarreLivraison!==false} onChange={(v:boolean)=>set('afficherBarreLivraison',v)} />
          <Champ label="Seuil livraison gratuite ($)" value={String(cfg.seuilLivraisonGratuite||75)} onChange={(v:string)=>set('seuilLivraisonGratuite',Number(v))} type="number" />
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Couleur principale</label>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <input type="color" value={cfg.couleurPrimaire||FUCH} onChange={e=>set('couleurPrimaire',e.target.value)} style={{ width:44, height:36, border:'1px solid #e9d5ff', borderRadius:8, cursor:'pointer', padding:2 }} />
              <span style={{ fontSize:13, color:TXT, fontWeight:600 }}>{cfg.couleurPrimaire||FUCH}</span>
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Couleur secondaire (lavande)</label>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <input type="color" value={cfg.couleurSecondaire||LAV} onChange={e=>set('couleurSecondaire',e.target.value)} style={{ width:44, height:36, border:'1px solid #e9d5ff', borderRadius:8, cursor:'pointer', padding:2 }} />
              <span style={{ fontSize:13, color:TXT, fontWeight:600 }}>{cfg.couleurSecondaire||LAV}</span>
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ display:'flex', gap:0, minHeight:'80vh', fontFamily:"'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Menu gauche */}
      <div style={{ width:220, background:'#fdf4ff', borderRight:'1px solid #e9d5ff', flexShrink:0 }}>
        <div style={{ padding:'20px 16px 12px' }}>
          <p style={{ fontSize:11, fontWeight:800, color:'#c084fc', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px' }}>Configuration</p>
          {ONGLETS.map(o=>(
            <button key={o.id} onClick={()=>setOnglet(o.id)}
              style={{ width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:10, border:'none', background:onglet===o.id?`linear-gradient(135deg,${LAV},${FUCH})`:'transparent', color:onglet===o.id?'#fff':TXT, fontSize:13, fontWeight:onglet===o.id?800:600, cursor:'pointer', marginBottom:2, display:'flex', alignItems:'center', gap:10, fontFamily:'inherit', transition:'all 0.15s' }}>
              <span>{o.icone}</span> {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex:1, padding:'28px 32px', maxWidth:640 }}>
        {contenu()}

        {/* Bouton sauvegarder */}
        <div style={{ borderTop:'1px solid #e9d5ff', marginTop:28, paddingTop:20, display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={sauvegarder} disabled={saving}
            style={{ padding:'12px 28px', background:`linear-gradient(135deg,${LAV},${FUCH})`, color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:saving?'wait':'pointer', fontFamily:'inherit' }}>
            {saving?'⏳ Sauvegarde...':'💾 Sauvegarder'}
          </button>
          {statut==='ok' && <span style={{ fontSize:13, color:'#22c55e', fontWeight:700 }}>✅ Sauvegardé !</span>}
          {statut==='err' && <span style={{ fontSize:13, color:'#ef4444', fontWeight:700 }}>❌ Erreur — veuillez réessayer.</span>}
        </div>
      </div>
    </div>
  );
}