// src/pages/studio/ConfigTemplateAgricole.tsx
import React, { useState, useEffect } from 'react';
import TemplateAgricole, { CONFIG_AGRICOLE_DEFAUT } from '../../templates/TemplateAgricole';
import type { ConfigAgricole, SectionConfig, ProduitAgricole } from '../../templates/TemplateAgricole';

type Onglet = 'identite'|'sections'|'apparence'|'produits'|'philosophie'|'ferme'|'contact';
const CP = '#c9854a';
const FOND = '#1a1612';

const Inp = ({ value, onChange, placeholder, type='text' }: any) => (
  <input type={type} value={value||''} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, outline:'none', background:'#fff', color:'#1a1a1a', boxSizing:'border-box' as any }}
    onFocus={e => e.target.style.borderColor=CP} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
);
const Txt = ({ value, onChange, placeholder, rows=3 }: any) => (
  <textarea value={value||''} placeholder={placeholder} rows={rows} onChange={e => onChange(e.target.value)}
    style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, outline:'none', resize:'vertical' as any, fontFamily:'inherit', background:'#fff', color:'#1a1a1a', boxSizing:'border-box' as any }}
    onFocus={e => e.target.style.borderColor=CP} onBlur={e => e.target.style.borderColor='#e5e7eb'} />
);
const F = ({ label, children }: any) => <div style={{ marginBottom:11 }}><label style={{ fontSize:11, fontWeight:600, color:'#555', display:'block', marginBottom:3 }}>{label}</label>{children}</div>;
const S = ({ titre, children }: any) => <div style={{ marginBottom:18 }}><h3 style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' as any, letterSpacing:'0.12em', color:'#aaa', marginBottom:9, paddingBottom:5, borderBottom:'1px solid #f0f0f0' }}>{titre}</h3>{children}</div>;
function ea<T>(val: any, def: T[]): T[] { return Array.isArray(val) && val.length > 0 ? val : def; }
const Del = ({ onClick }: any) => <button onClick={onClick} style={{ background:'#fef2f2', border:'none', borderRadius:4, padding:'2px 7px', fontSize:10, color:'#dc2626', cursor:'pointer' }}>✕</button>;

function SectionsManager({ sections, onChange }: { sections:SectionConfig[]; onChange:(s:SectionConfig[])=>void }) {
  const dep = (i: number, d: -1|1) => {
    const arr = [...sections].sort((a,b)=>a.ordre-b.ordre);
    const ni = i+d; if(ni<0||ni>=arr.length) return;
    const t=arr[i].ordre; arr[i]={...arr[i],ordre:arr[ni].ordre}; arr[ni]={...arr[ni],ordre:t};
    onChange(arr);
  };
  const tog = (id: string) => onChange(sections.map(s=>s.id===id?{...s,actif:!s.actif}:s));
  const sorted=[...sections].sort((a,b)=>a.ordre-b.ordre);
  const ico: Record<string,string> = { hero:'🌾',engagements:'🌿',produits:'🧺',philosophie:'☀️',contact:'📍' };
  return (
    <div>
      <div style={{ background:'#fdf5ee', border:`1px solid ${CP}40`, borderRadius:7, padding:9, fontSize:11, color:'#7c3f0a', marginBottom:12 }}>
        <strong>🌱 Sections</strong> — Toggle ON/OFF + ▲▼ pour réordonner
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {sorted.map((sec,i) => (
          <div key={sec.id} style={{ display:'flex', alignItems:'center', gap:7, background:sec.actif?'#fdf5ee':'#fafafa', border:`2px solid ${sec.actif?CP:'#e5e7eb'}`, borderRadius:8, padding:'7px 9px', transition:'all .2s', opacity:sec.actif?1:.55 }}>
            <span style={{ fontSize:13, width:18, textAlign:'center' as any, flexShrink:0 }}>{ico[sec.id]||'📄'}</span>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:10, fontWeight:800, color:'#aaa', marginRight:4 }}>#{i+1}</span>
              <span style={{ fontSize:11, fontWeight:600, color:sec.actif?'#1a1a1a':'#999' }}>{sec.label}</span>
            </div>
            <button onClick={()=>tog(sec.id)} style={{ width:38, height:19, borderRadius:10, border:'none', cursor:'pointer', background:sec.actif?CP:'#ddd', position:'relative', flexShrink:0, transition:'background .25s' }}>
              <div style={{ position:'absolute', top:1.5, left:sec.actif?19:1.5, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .25s' }} />
            </button>
            <div style={{ display:'flex', flexDirection:'column', gap:2, flexShrink:0 }}>
              <button onClick={()=>dep(i,-1)} disabled={i===0} style={{ width:18,height:14,border:'1px solid #ddd',borderRadius:3,background:i===0?'#f5f5f5':'#fff',cursor:i===0?'default':'pointer',fontSize:7,color:i===0?'#ccc':'#555',display:'flex',alignItems:'center',justifyContent:'center' }}>▲</button>
              <button onClick={()=>dep(i,1)} disabled={i===sorted.length-1} style={{ width:18,height:14,border:'1px solid #ddd',borderRadius:3,background:i===sorted.length-1?'#f5f5f5':'#fff',cursor:i===sorted.length-1?'default':'pointer',fontSize:7,color:i===sorted.length-1?'#ccc':'#555',display:'flex',alignItems:'center',justifyContent:'center' }}>▼</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:9, padding:'5px 9px', background:'#f5f5f5', borderRadius:6, fontSize:11, color:'#666' }}>
        <strong>{sorted.filter(s=>s.actif).length}</strong> sections actives sur {sorted.length}
      </div>
    </div>
  );
}

interface Props { vendeurId: string; templateId?: string; onSauvegarde?: (config:ConfigAgricole)=>Promise<void>; }

export default function ConfigTemplateAgricole({ vendeurId, onSauvegarde }: Props) {
  const [config, setConfig] = useState<ConfigAgricole>({ ...CONFIG_AGRICOLE_DEFAUT });
  const [onglet, setOnglet] = useState<Onglet>('identite');
  const [sauv, setSauv] = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [apercu, setApercu] = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [produitEdite, setProduitEdite] = useState<number|null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/studio/sites/${vendeurId}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' })
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d?.config && Object.keys(d.config).length>0) setConfig({...CONFIG_AGRICOLE_DEFAUT,...d.config}); })
      .catch(()=>{});
  }, [vendeurId]);

  const set = (k: keyof ConfigAgricole, v: any) => setConfig(prev=>({...prev,[k]:v}));

  const handleSave = async () => {
    setSauv('loading');
    try {
      if (onSauvegarde) { await onSauvegarde(config); }
      else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, { method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, credentials:'include', body: JSON.stringify({ config, template_id:'agricole' }) });
        if (!res.ok) throw new Error();
      }
      setSauv('ok'); setTimeout(()=>setSauv('idle'), 2500);
    } catch { setSauv('err'); setTimeout(()=>setSauv('idle'), 3000); }
  };

  const sections = ea(config.sections, CONFIG_AGRICOLE_DEFAUT.sections);
  const produits = ea(config.produits, CONFIG_AGRICOLE_DEFAUT.produits);

  const updProduit = (i:number, k:keyof ProduitAgricole, v:any) => {
    const a=[...produits]; a[i]={...a[i],[k]:v}; set('produits',a);
  };

  const ONGLETS: { id:Onglet; label:string; ico:string }[] = [
    { id:'identite',    label:'Identité',    ico:'🌾' },
    { id:'sections',    label:'Sections',    ico:'📋' },
    { id:'apparence',   label:'Apparence',   ico:'🎨' },
    { id:'produits',    label:'Produits',    ico:'🧺' },
    { id:'philosophie', label:'Philosophie', ico:'🌿' },
    { id:'ferme',       label:'Ferme',       ico:'🏡' },
    { id:'contact',     label:'Contact',     ico:'📍' },
  ];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:"'Inter',sans-serif" }}>

      {/* ── PANEL GAUCHE ── */}
      <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', height:'100%', borderRight:'1px solid #f0f0f0', background:'#fff' }}>

        {/* Header */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #f0f0f0', background:`linear-gradient(135deg,${FOND},#2a2018)` }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>🌱 Boutique Agricole</div>
          <div style={{ fontSize:10, color:CP, marginTop:2 }}>Template agricole — Gratuit</div>
        </div>

        {/* Onglets */}
        <div style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid #f0f0f0', flexShrink:0, background:FOND }}>
          {ONGLETS.map(o => (
            <button key={o.id} onClick={()=>setOnglet(o.id)}
              style={{ flexShrink:0, padding:'8px 10px', border:'none', background:'transparent', borderBottom:`2px solid ${onglet===o.id?CP:'transparent'}`, color:onglet===o.id?CP:'#f5ede088', fontSize:10, fontWeight:700, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <span style={{ fontSize:14 }}>{o.ico}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>

        {/* Contenu onglet */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 13px' }}>

          {onglet==='identite' && (<>
            <S titre="Identité de la ferme">
              <F label="Nom de la ferme"><Inp value={config.nomFerme} onChange={(v:string)=>set('nomFerme',v)} placeholder="Terra Nostra" /></F>
              <F label="Slogan"><Inp value={config.sloganFerme} onChange={(v:string)=>set('sloganFerme',v)} /></F>
              <F label="URL du logo (vide = nom en cursive)"><Inp value={config.logoUrl} onChange={(v:string)=>set('logoUrl',v)} placeholder="https://..." /></F>
            </S>
            <S titre="Hero plein écran">
              <F label="Titre ligne 1"><Inp value={config.heroTitre1} onChange={(v:string)=>set('heroTitre1',v)} placeholder="De la Terre," /></F>
              <F label="Titre ligne 2 (en doré italique)"><Inp value={config.heroTitre2} onChange={(v:string)=>set('heroTitre2',v)} placeholder="pour l'Âme" /></F>
              <F label="Sous-titre (séparé par ·)"><Inp value={config.heroSousTitre} onChange={(v:string)=>set('heroSousTitre',v)} /></F>
              <F label="Description"><Txt value={config.heroDescription} onChange={(v:string)=>set('heroDescription',v)} rows={3} /></F>
              <F label="Texte bouton"><Inp value={config.heroBouton} onChange={(v:string)=>set('heroBouton',v)} /></F>
              <F label="Photo hero (URL)"><Inp value={config.heroPhoto} onChange={(v:string)=>set('heroPhoto',v)} /></F>
              {config.heroPhoto && <img src={config.heroPhoto} alt="" style={{ width:'100%', height:72, objectFit:'cover', borderRadius:6, marginTop:4 }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />}
            </S>
            <S titre="Engagements (section accueil)">
              {(config.engagements||[]).map((eng,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'36px 1fr 1fr', gap:5, marginBottom:6, alignItems:'center' }}>
                  <Inp value={eng.icone} onChange={(v:string)=>{const a=[...config.engagements];a[i]={...a[i],icone:v};set('engagements',a);}} />
                  <Inp value={eng.titre} onChange={(v:string)=>{const a=[...config.engagements];a[i]={...a[i],titre:v};set('engagements',a);}} placeholder="Titre" />
                  <Inp value={eng.description} onChange={(v:string)=>{const a=[...config.engagements];a[i]={...a[i],description:v};set('engagements',a);}} placeholder="Desc." />
                </div>
              ))}
              <button onClick={()=>set('engagements',[...(config.engagements||[]),{icone:'🌱',titre:'',description:''}])}
                style={{ width:'100%', padding:'6px', border:`2px dashed ${CP}`, borderRadius:6, background:'transparent', color:CP, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter</button>
            </S>
          </>)}

          {onglet==='sections' && (
            <SectionsManager sections={sections} onChange={s=>set('sections',s)} />
          )}

          {onglet==='apparence' && (<>
            <S titre="Couleurs terroir">
              {([
                { k:'couleurAccent' as const, l:'Accent (doré)' },
                { k:'couleurFond'   as const, l:'Fond sombre (terre)' },
                { k:'couleurTexte'  as const, l:'Texte (crème)' },
              ]).map(({ k, l }) => (
                <F key={k} label={l}>
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="color" value={config[k]||'#c9854a'} onChange={e=>set(k,e.target.value)} style={{ width:34, height:30, padding:2, border:'1px solid #ddd', borderRadius:5, cursor:'pointer' }} />
                    <Inp value={config[k]} onChange={(v:string)=>set(k,v)} />
                  </div>
                </F>
              ))}
            </S>
            <S titre="Police">
              {([
                { v:'cursive' as const, l:'Cursive (Dancing Script)' },
                { v:'serif'   as const, l:'Serif (Cormorant Garamond)' },
                { v:'moderne' as const, l:'Moderne (Inter)' },
              ]).map(({ v, l }) => (
                <button key={v} onClick={()=>set('police',v)}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:7, border:`2px solid ${config.police===v?CP:'#e5e7eb'}`, background:config.police===v?CP+'15':'#fff', cursor:'pointer', textAlign:'left' as any, fontSize:12, color:config.police===v?'#7c3f0a':'#444', marginBottom:5, display:'block' }}>
                  {l}
                </button>
              ))}
            </S>
          </>)}

          {onglet==='produits' && (<>
            <S titre="Titre section produits">
              <F label="Label (ex: RÉCOLTE DU MOMENT)"><Inp value={config.produitsSousTitre} onChange={(v:string)=>set('produitsSousTitre',v)} /></F>
              <F label="Titre"><Inp value={config.produitsTitre} onChange={(v:string)=>set('produitsTitre',v)} /></F>
            </S>
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', marginBottom:10, fontSize:12, color:'#166534' }}>
              💡 Produits "Vedette" s'affichent en page accueil. Tous apparaissent en boutique.
            </div>
            <S titre={`Produits (${produits.length})`}>
              {produits.map((p,i) => (
                <div key={p.id} style={{ background:produitEdite===i?'#fef9f0':'#f9f9f9', borderRadius:8, border:`1.5px solid ${produitEdite===i?CP:'#e5e7eb'}`, padding:'10px', marginBottom:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {p.photo && <img src={p.photo} alt="" style={{ width:36, height:32, objectFit:'cover', borderRadius:4, flexShrink:0 }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0 }}>{p.nom||'(nouveau)'}</p>
                      <p style={{ fontSize:11, color:'#888', margin:0 }}>{p.prix?.toFixed(2)}$ / {p.unite} {p.vedette?'⭐':''}</p>
                    </div>
                    <button onClick={()=>setProduitEdite(produitEdite===i?null:i)} style={{ background:'#f3f4f6', border:'none', borderRadius:4, padding:'3px 7px', fontSize:11, cursor:'pointer' }}>{produitEdite===i?'✕':'✏️'}</button>
                    <Del onClick={()=>{if(window.confirm('Supprimer?')){set('produits',produits.filter((_,j)=>j!==i));if(produitEdite===i)setProduitEdite(null);}}} />
                  </div>
                  {produitEdite===i && (
                    <div style={{ marginTop:10 }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                        <F label="Nom"><Inp value={p.nom} onChange={(v:string)=>updProduit(i,'nom',v)} /></F>
                        <F label="Prix ($)"><input type="number" step="0.10" value={p.prix} onChange={e=>updProduit(i,'prix',parseFloat(e.target.value)||0)} style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, outline:'none', background:'#fff', boxSizing:'border-box' as any }} /></F>
                        <F label="Unité"><select value={p.unite} onChange={e=>updProduit(i,'unite',e.target.value)} style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, background:'#fff', boxSizing:'border-box' as any }}>
                          {['kg','botte','pièce','litre','boîte','panier','sac','douzaine'].map(u=><option key={u}>{u}</option>)}</select></F>
                        <F label="Catégorie"><Inp value={p.categorie} onChange={(v:string)=>updProduit(i,'categorie',v)} /></F>
                        <F label="Méthode"><select value={p.methode} onChange={e=>updProduit(i,'methode',e.target.value)} style={{ width:'100%', padding:'8px 11px', border:'1.5px solid #e5e7eb', borderRadius:5, fontSize:13, background:'#fff', boxSizing:'border-box' as any }}>
                          {['Pleine Terre','Permaculture','Sous Serre','Biologique','Conventionnel'].map(m=><option key={m}>{m}</option>)}</select></F>
                      </div>
                      <F label="Photo (URL)"><Inp value={p.photo} onChange={(v:string)=>updProduit(i,'photo',v)} /></F>
                      <F label="Description"><Txt value={p.description} onChange={(v:string)=>updProduit(i,'description',v)} rows={2} /></F>
                      <div style={{ display:'flex', gap:16, marginTop:6 }}>
                        <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:12, cursor:'pointer' }}><input type="checkbox" checked={p.disponible} onChange={e=>updProduit(i,'disponible',e.target.checked)} />Disponible</label>
                        <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:12, cursor:'pointer' }}><input type="checkbox" checked={p.vedette} onChange={e=>updProduit(i,'vedette',e.target.checked)} />⭐ Vedette (accueil)</label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={()=>{const p:ProduitAgricole={id:`p${Date.now()}`,nom:'',prix:0,unite:'kg',categorie:'Légumes',methode:'Pleine Terre',photo:'',description:'',disponible:true,vedette:false};set('produits',[...produits,p]);setProduitEdite(produits.length);}}
                style={{ width:'100%', padding:'7px', border:`2px dashed ${CP}`, borderRadius:7, background:'transparent', color:CP, cursor:'pointer', fontSize:11, fontWeight:600 }}>+ Ajouter un produit</button>
            </S>
          </>)}

          {onglet==='philosophie' && (
            <S titre="Section Philosophie">
              <F label="Titre (en cursive italique)"><Inp value={config.philosophieTitre} onChange={(v:string)=>set('philosophieTitre',v)} /></F>
              <F label="Photo de fond (URL)"><Inp value={config.philosophiePhoto} onChange={(v:string)=>set('philosophiePhoto',v)} /></F>
              {config.philosophiePhoto && <img src={config.philosophiePhoto} alt="" style={{ width:'100%', height:80, objectFit:'cover', borderRadius:6, marginTop:4 }} />}
            </S>
          )}

          {onglet==='ferme' && (<>
            <S titre="Notre Histoire">
              <F label="Label section"><Inp value={config.fermeHistoireSousTitre} onChange={(v:string)=>set('fermeHistoireSousTitre',v)} /></F>
              <F label="Titre en cursive"><Inp value={config.fermeHistoireTitre} onChange={(v:string)=>set('fermeHistoireTitre',v)} /></F>
              <F label="Photo (URL)"><Inp value={config.fermeHistoirePhoto} onChange={(v:string)=>set('fermeHistoirePhoto',v)} /></F>
              <F label="Texte (ligne vide entre paragraphes)"><Txt value={(config.fermeHistoireTextes||[]).join('\n\n')} onChange={(v:string)=>set('fermeHistoireTextes',v.split('\n\n').filter(Boolean))} rows={6} /></F>
            </S>
            <S titre="Nos Engagements (page Ferme)">
              <F label="Label section"><Inp value={config.fermeEngagementsSousTitre} onChange={(v:string)=>set('fermeEngagementsSousTitre',v)} /></F>
              <F label="Titre section"><Inp value={config.fermeEngagementsTitre} onChange={(v:string)=>set('fermeEngagementsTitre',v)} /></F>
            </S>
            <S titre="Venez nous visiter">
              <F label="Titre"><Inp value={config.fermeVisiteTitre} onChange={(v:string)=>set('fermeVisiteTitre',v)} /></F>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                <F label="Adresse"><Inp value={config.fermeAdresse} onChange={(v:string)=>set('fermeAdresse',v)} /></F>
                <F label="Heures"><Inp value={config.fermeHoraires} onChange={(v:string)=>set('fermeHoraires',v)} placeholder="Mer & Sam · 8h–12h" /></F>
                <F label="Code postal"><Inp value={config.fermeCp} onChange={(v:string)=>set('fermeCp',v)} /></F>
                <F label="Ville, Province"><Inp value={config.fermeVille} onChange={(v:string)=>set('fermeVille',v)} /></F>
              </div>
              <F label="Texte invitation"><Txt value={config.fermeVisiteTexte} onChange={(v:string)=>set('fermeVisiteTexte',v)} rows={3} /></F>
            </S>
          </>)}

          {onglet==='contact' && (
            <S titre="Coordonnées & Footer">
              <F label="Adresse complète"><Inp value={config.adresse} onChange={(v:string)=>set('adresse',v)} /></F>
              <F label="Téléphone"><Inp value={config.telephone} onChange={(v:string)=>set('telephone',v)} /></F>
              <F label="Courriel"><Inp value={config.email} onChange={(v:string)=>set('email',v)} type="email" /></F>
              <F label="Heures (footer)"><Inp value={config.heures} onChange={(v:string)=>set('heures',v)} /></F>
              <F label="Slogan footer"><Inp value={config.sloganFooter} onChange={(v:string)=>set('sloganFooter',v)} /></F>
              <F label="Texte copyright"><Inp value={config.copyright} onChange={(v:string)=>set('copyright',v)} /></F>
            </S>
          )}
        </div>

        {/* ── BARRE DU BAS ── */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {/* Réinitialiser */}
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' as any }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_AGRICOLE_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          {/* Aperçu + Sauvegarder */}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid ${CP}`, background:apercu?CP:'transparent', color:apercu?'#fff':CP, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauv==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauv==='ok'?'#10b981':sauv==='err'?'#dc2626':FOND, color:sauv==='ok'||sauv==='err'?'#fff':CP, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauv==='loading'?'⏳...':sauv==='ok'?'✅ Sauvegardé!':sauv==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* ── ZONE APERÇU ── */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:FOND, overflow:'hidden' }}>
        {/* Message */}
        <div style={{ background:'#1a1200', borderBottom:'1px solid #f59e0b44', padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:'#f59e0b', fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        {/* Icônes mode */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #333', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CP}33`:'transparent', color:modeApercu===m?CP:'#555', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        {/* Iframe */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'12px 8px' }}>
          <div style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', overflow:'hidden', borderRadius:modeApercu==='mobile'?20:modeApercu==='tablette'?8:4, border:`${modeApercu==='mobile'?4:2}px solid #333`, flexShrink:0, background:'#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', border:'none', display:'block' }} title="Aperçu" />
          </div>
        </div>
      </div>

      {!apercu && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:FOND, flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>🌱</div>
          <p style={{ fontSize:15, color:CP, fontWeight:600, fontFamily:'sans-serif' }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CP}60`, fontFamily:'sans-serif' }}>Template Boutique Agricole — Gratuit</p>
        </div>
      )}
    </div>
  );
}