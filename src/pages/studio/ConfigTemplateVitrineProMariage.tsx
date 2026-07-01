// src/pages/studio/ConfigTemplateVitrineProMariage.tsx
// e-Vend Studio — Configurateur Template PREMIUM Vitrine Pro Mariage

import { useState, useEffect, useCallback } from 'react';
import {
  CONFIG_VITRINE_PRO_MARIAGE_DEFAUT,
  type ConfigVitrineProMariage,
  type EtapeHistoire,
  type EtapeCeremonie,
  type Temoin,
  type FAQ,
} from '../../templates/TemplateVitrineProMariage';

const CP = '#8b6914';

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px', marginBottom: 12 };
const btnP: React.CSSProperties = { background: CP, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const btnS: React.CSSProperties = { background: '#fff', color: '#444', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '6px 12px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const btnD: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '4px 8px', fontWeight: 600, fontSize: 11, cursor: 'pointer' };

type Onglet = 'couple' | 'histoire' | 'ceremonie' | 'proches' | 'galerie' | 'etiquette' | 'rsvp' | 'contact' | 'apparence';

interface Props { vendeurId: string; templateId?: string; onSauvegarde?: (config: ConfigVitrineProMariage) => Promise<void>; }

export default function ConfigTemplateVitrineProMariage({ vendeurId, templateId = 'vitrine-pro-mariage', onSauvegarde }: Props) {
  const [config, setConfig]         = useState<ConfigVitrineProMariage>(CONFIG_VITRINE_PRO_MARIAGE_DEFAUT);
  const [onglet, setOnglet]         = useState<Onglet>('couple');
  const [sauv, setSauv]             = useState<'idle'|'loading'|'ok'|'err'>('idle');
  const [apercu, setApercu]         = useState(false);
  const [modeApercu, setModeApercu] = useState<'desktop'|'tablette'|'mobile'>('desktop');
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (res.ok) {
          const d = await res.json();
          if (d.config && Object.keys(d.config).length > 0)
            setConfig({ ...CONFIG_VITRINE_PRO_MARIAGE_DEFAUT, ...d.config });
        }
      } catch {}
    })();
  }, [vendeurId]);

  const set = useCallback(<K extends keyof ConfigVitrineProMariage>(k: K, v: ConfigVitrineProMariage[K]) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  }, []);

  const handleSave = async () => {
    setSauv('loading');
    try {
      if (onSauvegarde) {
        await onSauvegarde(config);
      } else {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/studio/sites/${vendeurId}/config`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          credentials: 'include', body: JSON.stringify({ config, template_id: templateId }),
        });
        if (!res.ok) throw new Error();
      }
      setSauv('ok'); setTimeout(() => setSauv('idle'), 2500);
    } catch { setSauv('err'); setTimeout(() => setSauv('idle'), 3000); }
  };

  const onglets: { id: Onglet; label: string; icone: string }[] = [
    { id: 'couple',    label: 'Couple',    icone: '💑' },
    { id: 'histoire',  label: 'Histoire',  icone: '📖' },
    { id: 'ceremonie', label: 'Cérémonie', icone: '💍' },
    { id: 'proches',   label: 'Proches',   icone: '👥' },
    { id: 'galerie',   label: 'Galerie',   icone: '🖼' },
    { id: 'etiquette', label: 'Étiquette', icone: '📋' },
    { id: 'rsvp',      label: 'RSVP',      icone: '💌' },
    { id: 'contact',   label: 'Contact',   icone: '✉️' },
    { id: 'apparence', label: 'Apparence', icone: '🎨' },
  ];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:"'Inter', sans-serif", background:'#f8f9fb' }}>

      {/* ── Panneau ── */}
      <div style={{ width:360, minWidth:320, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 14px 0', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg, #1a0f05, ${CP})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💍</div>
            <div>
              <p style={{ fontSize:10, color:'#888', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>Template Premium</p>
              <p style={{ fontSize:13, fontWeight:700, color:'#1a1a1a', margin:0 }}>Vitrine Pro Mariage</p>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:3, paddingBottom:10 }}>
            {onglets.map(o => (
              <button key={o.id} onClick={() => setOnglet(o.id)}
                style={{ padding:'3px 7px', borderRadius:5, border:'none', cursor:'pointer', fontSize:10, fontWeight:500, background: onglet===o.id ? '#1a0f05' : '#f3f4f6', color: onglet===o.id ? CP : '#555', transition:'all 0.15s' }}>
                {o.icone} {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex:1, overflowY:'auto', padding:14 }}>

          {/* ── COUPLE ── */}
          {onglet === 'couple' && (
            <>
              <div style={card}>
                <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:CP }}>💑 Le couple</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><label style={lbl}>Prénom marié 1</label><input style={inp} value={config.prenomMarie1} onChange={e => set('prenomMarie1', e.target.value)} placeholder="Thomas" /></div>
                  <div><label style={lbl}>Prénom marié 2</label><input style={inp} value={config.prenomMarie2} onChange={e => set('prenomMarie2', e.target.value)} placeholder="Élise" /></div>
                  <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Message d'accueil</label><input style={inp} value={config.coupleMessage} onChange={e => set('coupleMessage', e.target.value)} /></div>
                  <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight:56, resize:'vertical' }} value={config.coupleDescription} onChange={e => set('coupleDescription', e.target.value)} /></div>
                  <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Citation romantique</label><textarea style={{ ...inp, minHeight:56, resize:'vertical' }} value={config.citation} onChange={e => set('citation', e.target.value)} /></div>
                  <div><label style={lbl}>Photo mariée (URL)</label><input style={inp} value={config.photo1} onChange={e => set('photo1', e.target.value)} />{config.photo1 && <img src={config.photo1} alt="" style={{ height:60, marginTop:5, objectFit:'cover', borderRadius:5, width:'100%' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />}</div>
                  <div><label style={lbl}>Photo marié (URL)</label><input style={inp} value={config.photo2} onChange={e => set('photo2', e.target.value)} />{config.photo2 && <img src={config.photo2} alt="" style={{ height:60, marginTop:5, objectFit:'cover', borderRadius:5, width:'100%' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />}</div>
                </div>
              </div>
              <div style={card}>
                <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:CP }}>🖼 Photo Hero</h3>
                <label style={lbl}>URL photo hero (plein écran)</label>
                <input style={inp} value={config.heroPhoto} onChange={e => set('heroPhoto', e.target.value)} placeholder="https://..." />
                {config.heroPhoto && <img src={config.heroPhoto} alt="" style={{ width:'100%', height:90, objectFit:'cover', borderRadius:6, marginTop:6 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />}
              </div>
              <div style={card}>
                <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:CP }}>📅 Date & Lieu</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><label style={lbl}>Date (ISO)</label><input style={inp} type="datetime-local" value={config.dateMariage.slice(0,16)} onChange={e => set('dateMariage', e.target.value+':00')} /></div>
                  <div><label style={lbl}>Heure (texte)</label><input style={inp} value={config.heureMariage} onChange={e => set('heureMariage', e.target.value)} placeholder="14h00" /></div>
                  <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Adresse / Lieu</label><input style={inp} value={config.lieu} onChange={e => set('lieu', e.target.value)} /></div>
                  <div><label style={lbl}>Annonce hero</label><input style={inp} value={config.heroAnnonce} onChange={e => set('heroAnnonce', e.target.value)} /></div>
                  <div><label style={lbl}>Texte bouton RSVP</label><input style={inp} value={config.boutonRSVP} onChange={e => set('boutonRSVP', e.target.value)} /></div>
                </div>
              </div>
            </>
          )}

          {/* ── HISTOIRE ── */}
          {onglet === 'histoire' && (
            <div style={card}>
              <div style={{ marginBottom:10 }}><label style={lbl}>Titre section Histoire</label><input style={inp} value={config.histoireTitre} onChange={e => set('histoireTitre', e.target.value)} /></div>
              {config.histoire.map((e, i) => (
                <div key={i} style={{ background:'#fdf8f4', borderRadius:8, border:'1px solid #e5e7eb', padding:'12px', marginBottom:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:6 }}>
                    <div><label style={lbl}>Titre</label><input style={inp} value={e.titre} onChange={ev => { const arr=[...config.histoire]; arr[i]={...arr[i],titre:ev.target.value}; set('histoire',arr); }} /></div>
                    <div><label style={lbl}>Date</label><input style={inp} value={e.date||''} onChange={ev => { const arr=[...config.histoire]; arr[i]={...arr[i],date:ev.target.value}; set('histoire',arr); }} placeholder="Septembre 2019" /></div>
                    <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight:52, resize:'vertical' }} value={e.description} onChange={ev => { const arr=[...config.histoire]; arr[i]={...arr[i],description:ev.target.value}; set('histoire',arr); }} /></div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}><button style={btnD} onClick={() => set('histoire', config.histoire.filter((_,j)=>j!==i))}>🗑 Supprimer</button></div>
                </div>
              ))}
              <button style={btnP} onClick={() => set('histoire', [...config.histoire, { titre:'', description:'', date:'' }])}>+ Ajouter une étape</button>
            </div>
          )}

          {/* ── CÉRÉMONIE ── */}
          {onglet === 'ceremonie' && (
            <div style={card}>
              <div style={{ marginBottom:10 }}><label style={lbl}>Titre section Cérémonie</label><input style={inp} value={config.ceremonieTitre} onChange={e => set('ceremonieTitre', e.target.value)} /></div>
              {config.etapesCeremonie.map((e, i) => (
                <div key={i} style={{ background:'#fdf8f4', borderRadius:8, border:'1px solid #e5e7eb', padding:'12px', marginBottom:10 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:6 }}>
                    <div><label style={lbl}>Titre</label><input style={inp} value={e.titre} onChange={ev => { const arr=[...config.etapesCeremonie]; arr[i]={...arr[i],titre:ev.target.value}; set('etapesCeremonie',arr); }} /></div>
                    <div><label style={lbl}>Numéro</label><input style={inp} value={e.numero} onChange={ev => { const arr=[...config.etapesCeremonie]; arr[i]={...arr[i],numero:ev.target.value}; set('etapesCeremonie',arr); }} /></div>
                    <div><label style={lbl}>Heure</label><input style={inp} value={e.heure} onChange={ev => { const arr=[...config.etapesCeremonie]; arr[i]={...arr[i],heure:ev.target.value}; set('etapesCeremonie',arr); }} placeholder="14h00 — 15h00" /></div>
                    <div><label style={lbl}>Lieu</label><input style={inp} value={e.lieu} onChange={ev => { const arr=[...config.etapesCeremonie]; arr[i]={...arr[i],lieu:ev.target.value}; set('etapesCeremonie',arr); }} /></div>
                    <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight:52, resize:'vertical' }} value={e.description} onChange={ev => { const arr=[...config.etapesCeremonie]; arr[i]={...arr[i],description:ev.target.value}; set('etapesCeremonie',arr); }} /></div>
                    <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Photo (URL)</label><input style={inp} value={e.photo} onChange={ev => { const arr=[...config.etapesCeremonie]; arr[i]={...arr[i],photo:ev.target.value}; set('etapesCeremonie',arr); }} />{e.photo && <img src={e.photo} alt="" style={{ width:'100%', height:60, objectFit:'cover', borderRadius:5, marginTop:5 }} onError={ev => { (ev.target as HTMLImageElement).style.display='none'; }} />}</div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}><button style={btnD} onClick={() => set('etapesCeremonie', config.etapesCeremonie.filter((_,j)=>j!==i))}>🗑 Supprimer</button></div>
                </div>
              ))}
              <button style={btnP} onClick={() => set('etapesCeremonie', [...config.etapesCeremonie, { numero:String(config.etapesCeremonie.length+1), titre:'', description:'', heure:'', lieu:'', photo:'' }])}>+ Ajouter une étape</button>
            </div>
          )}

          {/* ── PROCHES ── */}
          {onglet === 'proches' && (
            <div style={card}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div><label style={lbl}>Label section</label><input style={inp} value={config.temoinsDescription} onChange={e => set('temoinsDescription', e.target.value)} /></div>
                <div><label style={lbl}>Titre section</label><input style={inp} value={config.temoinsTitre} onChange={e => set('temoinsTitre', e.target.value)} /></div>
              </div>
              {config.temoins.map((t, i) => (
                <div key={i} style={{ background:'#fdf8f4', borderRadius:8, border:'1px solid #e5e7eb', padding:'12px', marginBottom:8, display:'flex', gap:10 }}>
                  {t.photo && <img src={t.photo} alt="" style={{ width:48, height:48, objectFit:'cover', borderRadius:'50%', flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      <div><label style={lbl}>Nom</label><input style={inp} value={t.nom} onChange={ev => { const arr=[...config.temoins]; arr[i]={...arr[i],nom:ev.target.value}; set('temoins',arr); }} /></div>
                      <div><label style={lbl}>Rôle</label><input style={inp} value={t.role} onChange={ev => { const arr=[...config.temoins]; arr[i]={...arr[i],role:ev.target.value}; set('temoins',arr); }} /></div>
                    </div>
                    <div><label style={lbl}>Photo (URL)</label><input style={inp} value={t.photo} onChange={ev => { const arr=[...config.temoins]; arr[i]={...arr[i],photo:ev.target.value}; set('temoins',arr); }} /></div>
                  </div>
                  <button style={{ ...btnD, alignSelf:'flex-start' }} onClick={() => set('temoins', config.temoins.filter((_,j)=>j!==i))}>✕</button>
                </div>
              ))}
              <button style={btnP} onClick={() => set('temoins', [...config.temoins, { nom:'', role:'', photo:'' }])}>+ Ajouter un proche</button>
            </div>
          )}

          {/* ── GALERIE ── */}
          {onglet === 'galerie' && (
            <div style={card}>
              <div style={{ marginBottom:10 }}><label style={lbl}>Titre galerie</label><textarea style={{ ...inp, minHeight:52, resize:'vertical' }} value={config.galerieTitre} onChange={e => set('galerieTitre', e.target.value)} /></div>
              <p style={{ fontSize:11, color:'#888', marginBottom:10 }}>Photos 1 et 4 s'affichent en grand. Recommandé : 8+ photos.</p>
              {config.galeriePhotos.map((url, i) => (
                <div key={i} style={{ display:'flex', gap:7, marginBottom:7, alignItems:'center' }}>
                  {url && <img src={url} alt="" style={{ width:44, height:36, objectFit:'cover', borderRadius:5, flexShrink:0 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />}
                  <input style={{ ...inp, flex:1 }} value={url} onChange={e => { const arr=[...config.galeriePhotos]; arr[i]=e.target.value; set('galeriePhotos',arr); }} placeholder={`Photo ${i+1}`} />
                  <button style={btnD} onClick={() => set('galeriePhotos', config.galeriePhotos.filter((_,j)=>j!==i))}>✕</button>
                </div>
              ))}
              <button style={{ ...btnS, marginTop:6 }} onClick={() => set('galeriePhotos', [...config.galeriePhotos, ''])}>+ Ajouter une photo</button>
            </div>
          )}

          {/* ── ÉTIQUETTE / FAQ ── */}
          {onglet === 'etiquette' && (
            <div style={card}>
              <div style={{ marginBottom:10 }}><label style={lbl}>Titre section Étiquette</label><input style={inp} value={config.faqTitre} onChange={e => set('faqTitre', e.target.value)} /></div>
              <div style={{ marginBottom:12 }}><label style={lbl}>Photo illustrative (URL)</label><input style={inp} value={config.faqPhoto} onChange={e => set('faqPhoto', e.target.value)} /></div>
              {config.faq.map((item, i) => (
                <div key={i} style={{ background:'#fdf8f4', borderRadius:8, border:'1px solid #e5e7eb', padding:'12px', marginBottom:8 }}>
                  <div style={{ display:'flex', gap:7, marginBottom:7 }}>
                    <div style={{ flex:1 }}><label style={lbl}>Question</label><input style={inp} value={item.question} onChange={ev => { const arr=[...config.faq]; arr[i]={...arr[i],question:ev.target.value}; set('faq',arr); }} /></div>
                    <button style={{ ...btnD, alignSelf:'flex-end' }} onClick={() => set('faq', config.faq.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                  <label style={lbl}>Réponse</label>
                  <textarea style={{ ...inp, minHeight:52, resize:'vertical' }} value={item.reponse} onChange={ev => { const arr=[...config.faq]; arr[i]={...arr[i],reponse:ev.target.value}; set('faq',arr); }} />
                </div>
              ))}
              <button style={btnP} onClick={() => set('faq', [...config.faq, { question:'', reponse:'' }])}>+ Ajouter une question</button>
            </div>
          )}

          {/* ── RSVP ── */}
          {onglet === 'rsvp' && (
            <div style={card}>
              <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:CP }}>💌 Formulaire RSVP</h3>
              <p style={{ fontSize:11, color:'#888', marginBottom:12, lineHeight:1.6 }}>Le modal RSVP est accessible via le bouton dans la navbar et le hero.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div><label style={lbl}>Titre du modal RSVP</label><input style={inp} value={config.rsvpTitre} onChange={e => set('rsvpTitre', e.target.value)} /></div>
                <div><label style={lbl}>Description / instructions</label><textarea style={{ ...inp, minHeight:60, resize:'vertical' }} value={config.rsvpDescription} onChange={e => set('rsvpDescription', e.target.value)} /></div>
                <div>
                  <label style={lbl}>Courriel de réception des confirmations</label>
                  <input style={inp} type="email" value={config.rsvpEmail} onChange={e => set('rsvpEmail', e.target.value)} placeholder="mariage@votrecourriel.ca" />
                  <p style={{ fontSize:10, color:'#aaa', marginTop:4 }}>Les confirmations de présence seront envoyées à cette adresse.</p>
                </div>
              </div>
              <div style={{ marginTop:14, background:'#fdf8f4', borderRadius:8, border:`1px solid ${CP}22`, padding:'14px', textAlign:'center' }}>
                <p style={{ fontSize:11, color:CP, fontWeight:600, margin:0 }}>📨 Envoi vers : {config.rsvpEmail || '(courriel non configuré)'}</p>
              </div>
            </div>
          )}

          {/* ── CONTACT ── */}
          {onglet === 'contact' && (
            <div style={card}>
              <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:CP }}>✉️ Contact & Footer</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={lbl}>Téléphone</label><input style={inp} value={config.telephone} onChange={e => set('telephone', e.target.value)} /></div>
                <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Adresse complète</label><input style={inp} value={config.adresse} onChange={e => set('adresse', e.target.value)} /></div>
                <div style={{ gridColumn:'1 / -1' }}><label style={lbl}>Texte copyright</label><input style={inp} value={config.copyright} onChange={e => set('copyright', e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* ── APPARENCE ── */}
          {onglet === 'apparence' && (
            <>
              <div style={card}>
                <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:CP }}>🎨 Couleurs</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {([
                    { k:'couleurPrincipale' as const, l:'Couleur principale', h:'Boutons, cœur, accents' },
                    { k:'couleurAccent'     as const, l:'Couleur accent',     h:'Labels, lignes' },
                    { k:'couleurFond'       as const, l:'Fond de page',       h:'Arrière-plan crème' },
                    { k:'couleurTexte'      as const, l:'Couleur texte',      h:'Titres et corps' },
                  ]).map(({ k, l, h }) => (
                    <div key={k}>
                      <label style={lbl}>{l}</label>
                      <div style={{ display:'flex', gap:8 }}>
                        <input type="color" value={config[k]} onChange={e => set(k, e.target.value)} style={{ width:38, height:32, border:'1.5px solid #e5e7eb', borderRadius:6, cursor:'pointer', padding:2 }} />
                        <input style={{ ...inp, flex:1, fontFamily:'monospace', fontSize:12 }} value={config[k]} onChange={e => set(k, e.target.value)} />
                      </div>
                      <p style={{ fontSize:10, color:'#aaa', marginTop:3 }}>{h}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={card}>
                <h3 style={{ fontSize:12, fontWeight:700, marginBottom:10, color:CP }}>🔤 Police des titres</h3>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {([
                    { v:'manuscrite' as const, l:'Manuscrite', preview:"'Dancing Script', cursive" },
                    { v:'classique'  as const, l:'Classique',  preview:"'Cormorant Garamond', serif" },
                    { v:'moderne'    as const, l:'Moderne',    preview:"'Inter', sans-serif" },
                  ]).map(({ v, l, preview }) => (
                    <div key={v} onClick={() => set('police', v)}
                      style={{ padding:'10px 14px', borderRadius:8, border:`2px solid ${config.police===v ? CP : '#e5e7eb'}`, background: config.police===v ? CP+'12' : '#fff', cursor:'pointer', flex:1, textAlign:'center' }}>
                      <div style={{ fontFamily:preview, fontSize:16, marginBottom:3, color: config.police===v ? CP : '#444' }}>Thomas ♥ Élise</div>
                      <div style={{ fontSize:10, color:'#888' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'11px 13px', borderTop:'1px solid #f0f0f0', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {resetConfirm ? (
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'#991b1b', fontWeight:600, flex:1 }}>⚠️ Effacer toute la config?</span>
              <button onClick={()=>{ setConfig({...CONFIG_VITRINE_PRO_MARIAGE_DEFAUT}); setResetConfirm(false); }} style={{ padding:'4px 10px', borderRadius:5, background:'#dc2626', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Confirmer</button>
              <button onClick={()=>setResetConfirm(false)} style={{ padding:'4px 8px', borderRadius:5, background:'#f3f4f6', border:'none', color:'#555', fontSize:11, cursor:'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={()=>setResetConfirm(true)} style={{ width:'100%', padding:'6px 0', borderRadius:7, background:'transparent', border:'1.5px solid #fca5a5', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              🗑️ Réinitialiser la config
            </button>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setApercu(!apercu)} style={{ flex:1, padding:'9px 0', borderRadius:7, border:`1.5px solid #1a0f05`, background:apercu?'#1a0f05':'transparent', color:apercu?CP:'#1a0f05', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .2s' }}>
              {apercu?'✕ Fermer':'👁 Aperçu'}
            </button>
            <button onClick={handleSave} disabled={sauv==='loading'} style={{ flex:2, padding:'9px 0', borderRadius:7, border:'none', background:sauv==='ok'?'#10b981':sauv==='err'?'#dc2626':'#1a0f05', color:sauv==='ok'||sauv==='err'?'#fff':CP, fontSize:12, fontWeight:700, cursor:'pointer', transition:'background .3s' }}>
              {sauv==='loading'?'⏳...':sauv==='ok'?'✅ Sauvegardé!':sauv==='err'?'❌ Erreur':'💾 Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu iframe 3 modes */}
      <div style={{ flex:1, display:apercu?'flex':'none', flexDirection:'column', background:'#1a0f05', overflow:'hidden' }}>
        <div style={{ background:'#2a1f0d', borderBottom:`1px solid ${CP}44`, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span style={{ fontSize:13 }}>⚠️</span>
          <span style={{ fontSize:11, color:CP, fontWeight:600 }}>Sauvegardez vos changements pour les voir dans l'aperçu</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderBottom:'1px solid #333', flexShrink:0 }}>
          {([['desktop','🖥️','Bureau'],['tablette','📲','Tablette'],['mobile','📱','Mobile']] as const).map(([m,ico,label])=>(
            <button key={m} onClick={()=>setModeApercu(m)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, border:'none', background:modeApercu===m?`${CP}33`:'transparent', color:modeApercu===m?CP:'#666', cursor:'pointer', fontSize:12, fontWeight:700, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>{ico}</span><span>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'hidden', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:'12px 8px' }}>
          <div style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', overflow:'hidden', borderRadius:modeApercu==='mobile'?20:modeApercu==='tablette'?8:4, border:`${modeApercu==='mobile'?4:2}px solid #333`, flexShrink:0, background:'#fff' }}>
            <iframe key={modeApercu} src={`/site-preview?vendeurId=${vendeurId}`}
              style={{ width:modeApercu==='mobile'?375:modeApercu==='tablette'?768:'100%', height:'100%', border:'none', display:'block' }} title="Aperçu" />
          </div>
        </div>
      </div>
      {!apercu && (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#1a0f05', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:52 }}>💍</div>
          <p style={{ fontSize:15, color:CP, fontWeight:600 }}>Cliquez sur "Aperçu" pour voir votre site</p>
          <p style={{ fontSize:12, color:`${CP}80` }}>Template Vitrine Pro Mariage — Premium</p>
        </div>
      )}
    </div>
  );
}