// src/pages/gestionnaire/ConfigPopupAnnonce.tsx
// e-Vend Studio — Configuration du Add-On Popup Annonce

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const TXT   = '#1a1a2e';
const BLEU  = '#2563eb';

interface Props { gestionnaireId: number; }

const TYPES = [
  { id: 'popup',        label: 'Popup centré',      desc: 'Fenêtre au centre de l\'écran avec fond flouté', icone: '🪟' },
  { id: 'banniere_haut',label: 'Bannière en haut',  desc: 'Barre fixe en haut du site',                    icone: '⬆️' },
  { id: 'banniere_bas', label: 'Bannière en bas',   desc: 'Barre fixe en bas (au-dessus du footer)',        icone: '⬇️' },
];

const ICONES = ['📢','🎉','⚠️','🔥','💥','🎁','✨','📅','🚨','💡','🛍️','❄️','🌟','🏷️','⏰'];

const CFG_DEF = {
  actif: true,
  type_affichage: 'popup',
  titre: 'Annonce importante',
  message: 'Profitez de notre offre spéciale limitée dans le temps !',
  bouton_label: 'En savoir plus',
  bouton_url: '',
  bouton_actif: true,
  couleur_fond: '#1a1a2e',
  couleur_texte: '#ffffff',
  couleur_bouton: '#e63946',
  delai_secondes: 2,
  fermeture_auto: false,
  fermeture_auto_secondes: 10,
  se_souvenir_heures: 24,
  icone: '📢',
  date_debut: '',
  date_fin: '',
};

function Toggle({ label, desc='', value, onChange, couleur='#2563eb' }: any) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14, padding:'12px 14px', background:'#f9fafb', borderRadius:10, border:'1px solid #e5e7eb' }}>
      <div style={{ flex:1 }}>
        <p style={{ margin:'0 0 2px', fontSize:14, fontWeight:700, color:TXT }}>{label}</p>
        {desc && <p style={{ margin:0, fontSize:12, color:'#888' }}>{desc}</p>}
      </div>
      <div onClick={()=>onChange(!value)} style={{ width:44, height:24, borderRadius:12, background:value?couleur:'#ddd', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:value?22:2, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}

function Champ({ label, value, onChange, type='text', placeholder='', multiline=false, note='' }: any) {
  const s: any = { width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, color:TXT, outline:'none', fontFamily:'inherit', boxSizing:'border-box', resize:multiline?'vertical':'none' };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>
      {multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} placeholder={placeholder} style={s} />
                 : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} />}
      {note && <p style={{ fontSize:11, color:'#aaa', margin:'4px 0 0' }}>{note}</p>}
    </div>
  );
}

// Aperçu miniature
function Apercu({ cfg }: { cfg: any }) {
  const { couleur_fond, couleur_texte, couleur_bouton } = cfg;
  if (cfg.type_affichage !== 'popup') {
    return (
      <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #e5e7eb', background:'#f3f4f6', height:120, position:'relative', display:'flex', alignItems: cfg.type_affichage === 'banniere_haut' ? 'flex-start' : 'flex-end' }}>
        <div style={{ width:'100%', background:couleur_fond, color:couleur_texte, padding:'8px 12px', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:14 }}>{cfg.icone}</span>
          <strong style={{ fontSize:11 }}>{cfg.titre || 'Titre'}</strong>
          <span style={{ fontSize:10, opacity:0.85 }}>{cfg.message?.slice(0,40)}...</span>
          {cfg.bouton_actif && <span style={{ background:couleur_bouton, color:'#fff', padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>{cfg.bouton_label || 'Bouton'}</span>}
          <span style={{ marginLeft:'auto', background:'rgba(255,255,255,0.2)', borderRadius:'50%', width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0 }}>✕</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #e5e7eb', background:'rgba(0,0,0,0.5)', height:200, display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div style={{ background:couleur_fond, borderRadius:12, padding:'16px 20px', width:'100%', maxWidth:240, textAlign:'center', position:'relative' }}>
        <div style={{ position:'absolute', top:6, right:8, fontSize:12, color:couleur_texte, opacity:0.6 }}>✕</div>
        <div style={{ fontSize:28, marginBottom:6 }}>{cfg.icone}</div>
        <h3 style={{ fontSize:13, fontWeight:800, color:couleur_texte, margin:'0 0 6px' }}>{cfg.titre || 'Titre'}</h3>
        <p style={{ fontSize:10, color:couleur_texte, opacity:0.8, margin:'0 0 10px', lineHeight:1.5 }}>{cfg.message?.slice(0,60)}...</p>
        {cfg.bouton_actif && <div style={{ background:couleur_bouton, color:'#fff', padding:'7px 14px', borderRadius:8, fontSize:10, fontWeight:800 }}>{cfg.bouton_label || 'Bouton'}</div>}
        <div style={{ fontSize:10, color:couleur_texte, opacity:0.4, marginTop:6 }}>Non merci, fermer</div>
      </div>
    </div>
  );
}

export default function ConfigPopupAnnonce({ gestionnaireId }: Props) {
  const [cfg, setCfg]     = useState<any>(CFG_DEF);
  const [onglet, setOnglet] = useState<'contenu'|'apparence'|'comportement'>('contenu');
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState<'idle'|'ok'|'err'>('idle');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/popup-annonce`, {
      headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
    }).then(r => r.ok ? r.json() : {}).then(data => {
      if (data && Object.keys(data).length > 0) setCfg((p: any) => ({ ...p, ...data }));
    }).catch(()=>{});
  }, [gestionnaireId]);

  const set = (k: string, v: any) => setCfg((p: any) => ({ ...p, [k]: v }));

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/popup-annonce`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error();
      setStatut('ok');
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  const ONGLETS = [
    { id:'contenu',      label:'Contenu',      icone:'✏️' },
    { id:'apparence',    label:'Apparence',    icone:'🎨' },
    { id:'comportement', label:'Comportement', icone:'⚙️' },
  ];

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px', fontFamily:"'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#e63946,#c1121f)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📢</div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:TXT, margin:0 }}>Popup Annonce</h1>
          <p style={{ fontSize:13, color:'#888', margin:0 }}>Affichez une annonce, promo ou événement sur votre boutique</p>
        </div>
        <div style={{ marginLeft:'auto', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, color:'#e63946' }}>
          Add-On actif · 3,00 $/mois
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24, alignItems:'start' }}>
        {/* Panneau gauche */}
        <div>
          {/* Toggle actif */}
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
            <Toggle label="Popup activée" desc="Désactivez temporairement sans perdre votre configuration" value={cfg.actif} onChange={(v: boolean)=>set('actif',v)} couleur='#22c55e' />
          </div>

          {/* Onglets */}
          <div style={{ display:'flex', gap:0, background:'#f9fafb', borderRadius:12, padding:4, marginBottom:16, border:'1px solid #e5e7eb' }}>
            {ONGLETS.map(o => (
              <button key={o.id} onClick={()=>setOnglet(o.id as any)}
                style={{ flex:1, padding:'10px 8px', border:'none', borderRadius:9, background:onglet===o.id?'#fff':'transparent', color:onglet===o.id?TXT:'#888', fontSize:13, fontWeight:onglet===o.id?700:500, cursor:'pointer', fontFamily:'inherit', boxShadow:onglet===o.id?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {o.icone} {o.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Contenu ── */}
          {onglet === 'contenu' && (
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'20px 24px' }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:TXT, margin:'0 0 16px' }}>Type d'affichage</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {TYPES.map(t => (
                  <div key={t.id} onClick={()=>set('type_affichage',t.id)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', border:`2px solid ${cfg.type_affichage===t.id?BLEU:'#e5e7eb'}`, borderRadius:10, cursor:'pointer', background:cfg.type_affichage===t.id?'#eff6ff':'#fafafa', transition:'all 0.15s' }}>
                    <span style={{ fontSize:20 }}>{t.icone}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:TXT }}>{t.label}</p>
                      <p style={{ margin:0, fontSize:11, color:'#888' }}>{t.desc}</p>
                    </div>
                    <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${cfg.type_affichage===t.id?BLEU:'#ddd'}`, background:cfg.type_affichage===t.id?BLEU:'#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {cfg.type_affichage===t.id && <span style={{ color:'#fff', fontSize:10 }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize:14, fontWeight:800, color:TXT, margin:'0 0 14px' }}>Icône</h3>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
                {ICONES.map(ic => (
                  <button key={ic} onClick={()=>set('icone',ic)}
                    style={{ width:40, height:40, borderRadius:10, border:`2px solid ${cfg.icone===ic?BLEU:'#e5e7eb'}`, background:cfg.icone===ic?'#eff6ff':'#fafafa', fontSize:20, cursor:'pointer', transition:'all 0.15s' }}>
                    {ic}
                  </button>
                ))}
              </div>

              <Champ label="Titre" value={cfg.titre} onChange={(v:string)=>set('titre',v)} placeholder="Annonce importante" />
              <Champ label="Message" value={cfg.message} onChange={(v:string)=>set('message',v)} multiline placeholder="Profitez de notre offre spéciale..." />

              <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'14px 16px' }}>
                <Toggle label="Afficher un bouton" value={cfg.bouton_actif} onChange={(v:boolean)=>set('bouton_actif',v)} />
                {cfg.bouton_actif && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <Champ label="Texte du bouton" value={cfg.bouton_label} onChange={(v:string)=>set('bouton_label',v)} placeholder="En savoir plus" />
                    <Champ label="URL du bouton" value={cfg.bouton_url} onChange={(v:string)=>set('bouton_url',v)} placeholder="https://..." note="Laisser vide pour fermer la popup" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Onglet Apparence ── */}
          {onglet === 'apparence' && (
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'20px 24px' }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:TXT, margin:'0 0 16px' }}>Couleurs</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                {[
                  { label:'Fond',   key:'couleur_fond' },
                  { label:'Texte',  key:'couleur_texte' },
                  { label:'Bouton', key:'couleur_bouton' },
                ].map(c => (
                  <div key={c.key}>
                    <label style={{ fontSize:12, fontWeight:700, color:'#888', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.label}</label>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <input type="color" value={cfg[c.key]} onChange={e=>set(c.key,e.target.value)}
                        style={{ width:44, height:36, border:'1px solid #e5e7eb', borderRadius:8, cursor:'pointer', padding:2 }} />
                      <span style={{ fontSize:11, color:TXT, fontFamily:'monospace' }}>{cfg[c.key]}</span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize:14, fontWeight:800, color:TXT, margin:'20px 0 12px' }}>Thèmes rapides</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
                {[
                  { label:'Nuit',     fond:'#1a1a2e', texte:'#ffffff', bouton:'#e63946' },
                  { label:'Urgence',  fond:'#dc2626', texte:'#ffffff', bouton:'#ffffff' },
                  { label:'Succès',   fond:'#166534', texte:'#ffffff', bouton:'#22c55e' },
                  { label:'Info',     fond:'#1e40af', texte:'#ffffff', bouton:'#60a5fa' },
                  { label:'Doré',     fond:'#1a1a1a', texte:'#c9a96e', bouton:'#c9a96e' },
                  { label:'Clair',    fond:'#ffffff', texte:'#1a1a2e', bouton:'#2563eb' },
                ].map(t => (
                  <div key={t.label} onClick={()=>setCfg((p:any)=>({...p, couleur_fond:t.fond, couleur_texte:t.texte, couleur_bouton:t.bouton}))}
                    style={{ borderRadius:10, overflow:'hidden', cursor:'pointer', border:'2px solid #e5e7eb', transition:'border-color 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor=BLEU)}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='#e5e7eb')}>
                    <div style={{ height:32, background:t.fond, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ width:20, height:8, borderRadius:4, background:t.bouton }} />
                    </div>
                    <div style={{ padding:'4px', textAlign:'center', background:'#fafafa' }}>
                      <p style={{ fontSize:10, fontWeight:700, color:TXT, margin:0 }}>{t.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Onglet Comportement ── */}
          {onglet === 'comportement' && (
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'20px 24px' }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:TXT, margin:'0 0 16px' }}>Délai d'apparition</h3>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                {[0,2,5,10,30].map(d => (
                  <button key={d} onClick={()=>set('delai_secondes',d)}
                    style={{ padding:'8px 16px', border:`2px solid ${cfg.delai_secondes===d?BLEU:'#e5e7eb'}`, background:cfg.delai_secondes===d?BLEU:'#fff', color:cfg.delai_secondes===d?'#fff':TXT, borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {d===0?'Immédiat':`${d}s`}
                  </button>
                ))}
              </div>

              <Toggle label="Fermeture automatique" desc="La popup se ferme automatiquement après quelques secondes" value={cfg.fermeture_auto} onChange={(v:boolean)=>set('fermeture_auto',v)} />
              {cfg.fermeture_auto && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16, marginTop:8 }}>
                  {[5,10,15,30].map(d => (
                    <button key={d} onClick={()=>set('fermeture_auto_secondes',d)}
                      style={{ padding:'8px 16px', border:`2px solid ${cfg.fermeture_auto_secondes===d?BLEU:'#e5e7eb'}`, background:cfg.fermeture_auto_secondes===d?BLEU:'#fff', color:cfg.fermeture_auto_secondes===d?'#fff':TXT, borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      {d}s
                    </button>
                  ))}
                </div>
              )}

              <h3 style={{ fontSize:14, fontWeight:800, color:TXT, margin:'0 0 12px' }}>Ne pas réafficher pendant</h3>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                {[1,6,24,72,168].map(h => (
                  <button key={h} onClick={()=>set('se_souvenir_heures',h)}
                    style={{ padding:'8px 16px', border:`2px solid ${cfg.se_souvenir_heures===h?BLEU:'#e5e7eb'}`, background:cfg.se_souvenir_heures===h?BLEU:'#fff', color:cfg.se_souvenir_heures===h?'#fff':TXT, borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    {h===1?'1h':h===6?'6h':h===24?'1 jour':h===72?'3 jours':'1 sem.'}
                  </button>
                ))}
              </div>

              <h3 style={{ fontSize:14, fontWeight:800, color:TXT, margin:'0 0 12px' }}>Période d'affichage (optionnel)</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Champ label="Date de début" value={cfg.date_debut||''} onChange={(v:string)=>set('date_debut',v)} type="datetime-local" note="Laisser vide = maintenant" />
                <Champ label="Date de fin" value={cfg.date_fin||''} onChange={(v:string)=>set('date_fin',v)} type="datetime-local" note="Laisser vide = sans limite" />
              </div>
            </div>
          )}

          {/* Sauvegarder */}
          <div style={{ borderTop:'1px solid #e5e7eb', marginTop:20, paddingTop:20, display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={sauvegarder} disabled={saving}
              style={{ padding:'12px 28px', background:'linear-gradient(135deg,#e63946,#c1121f)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:800, cursor:saving?'wait':'pointer', fontFamily:'inherit' }}>
              {saving?'⏳ Sauvegarde...':'💾 Sauvegarder'}
            </button>
            {statut==='ok' && <span style={{ fontSize:13, color:'#22c55e', fontWeight:700 }}>✅ Sauvegardé !</span>}
            {statut==='err' && <span style={{ fontSize:13, color:'#e63946', fontWeight:700 }}>❌ Erreur — réessayez.</span>}
          </div>
        </div>

        {/* Aperçu */}
        <div style={{ position:'sticky', top:24 }}>
          <div style={{ background:'#1a1a1a', borderRadius:16, padding:'16px', border:'1px solid #333', marginBottom:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#666', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 12px', textAlign:'center' }}>Aperçu</p>
            <Apercu cfg={cfg} />
            <p style={{ fontSize:11, color:'#555', textAlign:'center', margin:'10px 0 0' }}>Mise à jour en temps réel</p>
          </div>
          <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'14px 16px' }}>
            <p style={{ fontSize:12, fontWeight:800, color:TXT, margin:'0 0 8px' }}>ℹ️ À propos</p>
            {['✅ S\'affiche sur tous vos templates','✅ 3 formats : popup, bannière haut/bas','✅ Délai et fermeture auto','✅ Ne remontre pas après fermeture','✅ Dates de début / fin configurables'].map((i,k)=>(
              <p key={k} style={{ fontSize:12, color:'#555', margin:'0 0 4px' }}>{i}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}