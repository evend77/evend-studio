// src/pages/gestionnaire/BeautePlan.tsx
// e-Vend Studio — Plan Boutique Beauté (même logique que PremiumPlan)

import { useState, useEffect } from 'react';

const API_BASE = '/api';
const FUCH = '#ec4899';
const LAV  = '#c084fc';

interface Props { gestionnaireId: number; }

const PALIERS = [
  { id:'beaute-25',  limite:25,  prix:'17,99$', prixNum:17.99, label:'Essentiel',  desc:'Parfait pour démarrer',             couleur:'#c084fc' },
  { id:'beaute-50',  limite:50,  prix:'21,99$', prixNum:21.99, label:'Croissance', desc:'Boutique en expansion',             couleur:'#ec4899' },
  { id:'beaute-100', limite:100, prix:'26,99$', prixNum:26.99, label:'Pro',        desc:'Large catalogue de beauté',         couleur:'#f472b6' },
  { id:'beaute-200', limite:200, prix:'31,99$', prixNum:31.99, label:'Business',   desc:'Volume et performance',             couleur:'#fb923c' },
  { id:'beaute-500', limite:500, prix:'41,99$', prixNum:41.99, label:'Élite',      desc:'Maximum — collection illimitée',   couleur:'#a855f7' },
];

export default function BeautePlan({ gestionnaireId }: Props) {
  const [planActuel, setPlanActuel] = useState('beaute-25');
  const [nbProduits, setNbProduits] = useState(0);
  const [planChoisi, setPlanChoisi] = useState('beaute-25');
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [statut, setStatut]         = useState<'idle'|'ok'|'err'>('idle');
  const [confirm, setConfirm]       = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API_BASE}/gestionnaires/${gestionnaireId}`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' }).then(r=>r.ok?r.json():null),
      fetch(`${API_BASE}/produits/gestionnaire/${gestionnaireId}/count`, { headers:{ Authorization:`Bearer ${token}` }, credentials:'include' }).then(r=>r.ok?r.json():{nb:0}).catch(()=>({nb:0})),
    ]).then(([gest,count]) => {
      const plan = gest?.plan || 'beaute-25';
      setPlanActuel(plan); setPlanChoisi(plan);
      setNbProduits(count?.nb || 0);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [gestionnaireId]);

  const palierActuel = PALIERS.find(p=>p.id===planActuel)||PALIERS[0];
  const palierChoisi = PALIERS.find(p=>p.id===planChoisi)||PALIERS[0];
  const aChange      = planChoisi !== planActuel;
  const pourcentage  = Math.min(100, Math.round((nbProduits / palierActuel.limite)*100));
  const couleurBarre = pourcentage>=90?'#ef4444':pourcentage>=70?'#f59e0b':'#22c55e';

  const sauvegarder = async () => {
    if (!aChange) return;
    const nouvelleLimite = PALIERS.find(p=>p.id===planChoisi)?.limite||25;
    if (nbProduits > nouvelleLimite) { setStatut('err'); setTimeout(()=>setStatut('idle'),4000); return; }
    setSaving(true); setConfirm(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        credentials:'include', body: JSON.stringify({ plan:planChoisi }),
      });
      if (!res.ok) throw new Error();
      setPlanActuel(planChoisi); setStatut('ok');
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(()=>setStatut('idle'),3000);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:40, marginBottom:12 }}>💄</div><p style={{ color:'#888' }}>Chargement...</p></div>
    </div>
  );

  return (
    <div style={{ maxWidth:780, margin:'0 auto', padding:'32px 24px', fontFamily:"'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${LAV},${FUCH})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>💄</div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#2d1b3d', margin:0 }}>Mon plan Boutique Beauté</h1>
            <p style={{ fontSize:13, color:'#888', margin:0 }}>Changez de palier en tout temps — effectif immédiatement</p>
          </div>
        </div>
      </div>

      {/* Utilisation */}
      <div style={{ background:'#fff', border:'1px solid #e9d5ff', borderRadius:12, padding:'20px 24px', marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div>
            <p style={{ fontSize:12, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 4px' }}>Plan actif</p>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18, fontWeight:800, color:palierActuel.couleur }}>{palierActuel.label}</span>
              <span style={{ fontSize:12, background:`${palierActuel.couleur}15`, color:palierActuel.couleur, padding:'2px 10px', borderRadius:20, fontWeight:700 }}>{palierActuel.prix}/mois</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#888', margin:'0 0 4px' }}>Produits actifs</p>
            <span style={{ fontSize:22, fontWeight:800, color:pourcentage>=90?'#ef4444':'#2d1b3d' }}>{nbProduits}</span>
            <span style={{ fontSize:14, color:'#888' }}> / {palierActuel.limite}</span>
          </div>
        </div>
        <div style={{ background:'#f3e8ff', borderRadius:8, height:10, overflow:'hidden' }}>
          <div style={{ width:`${pourcentage}%`, height:'100%', background:`linear-gradient(90deg,${LAV},${FUCH})`, borderRadius:8, transition:'width 0.5s ease' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
          <span style={{ fontSize:11, color:'#888' }}>{pourcentage}% utilisé</span>
          <span style={{ fontSize:11, color:palierActuel.limite-nbProduits<=5?'#ef4444':'#888', fontWeight:palierActuel.limite-nbProduits<=5?700:400 }}>
            {palierActuel.limite-nbProduits} emplacement{palierActuel.limite-nbProduits>1?'s':''} restant{palierActuel.limite-nbProduits>1?'s':''}
          </span>
        </div>
        {pourcentage>=90 && (
          <div style={{ marginTop:12, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#ef4444', fontWeight:500 }}>
            ⚠️ Vous approchez de votre limite. Passez au palier supérieur pour continuer à ajouter des produits.
          </div>
        )}
      </div>

      {/* Paliers */}
      <h2 style={{ fontSize:16, fontWeight:700, color:'#2d1b3d', marginBottom:14 }}>Choisir un palier</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:28 }}>
        {PALIERS.map(p=>{
          const estActuel  = p.id===planActuel;
          const estChoisi  = p.id===planChoisi;
          const impossible = nbProduits>p.limite;
          return (
            <div key={p.id} onClick={()=>!impossible&&setPlanChoisi(p.id)}
              style={{ border:`2px solid ${estChoisi?p.couleur:'#e9d5ff'}`, borderRadius:10, padding:'16px 14px', cursor:impossible?'not-allowed':'pointer', background:estChoisi?`${p.couleur}08`:'#fafafa', opacity:impossible?0.5:1, transition:'all 0.15s', position:'relative' }}>
              {estActuel && <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', background:p.couleur, color:'#fff', fontSize:9, fontWeight:700, padding:'2px 10px', borderRadius:'0 0 6px 6px', whiteSpace:'nowrap' }}>PLAN ACTUEL</div>}
              {estChoisi&&!estActuel && <div style={{ position:'absolute', top:8, right:8, width:18, height:18, borderRadius:'50%', background:p.couleur, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'#fff', fontSize:10, fontWeight:800 }}>✓</span></div>}
              <div style={{ fontSize:11, fontWeight:700, color:p.couleur, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, marginTop:estActuel?10:0 }}>{p.label}</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#2d1b3d', marginBottom:2 }}>{p.prix}<span style={{ fontSize:10, fontWeight:500, color:'#888' }}>/mois</span></div>
              <div style={{ fontSize:12, color:'#555', fontWeight:600, marginBottom:4 }}><span style={{ color:p.couleur }}>{p.limite} produits</span></div>
              <div style={{ fontSize:11, color:'#888' }}>{p.desc}</div>
              {impossible && <div style={{ marginTop:8, fontSize:10, color:'#ef4444', fontWeight:600 }}>⚠️ {nbProduits} produits actifs</div>}
            </div>
          );
        })}
      </div>

      {/* Récap changement */}
      {aChange && (
        <div style={{ background:`${palierChoisi.couleur}08`, border:`1px solid ${palierChoisi.couleur}30`, borderRadius:10, padding:'14px 18px', marginBottom:20 }}>
          <p style={{ fontSize:13, color:'#333', margin:0, lineHeight:1.7 }}>
            Vous passez du palier <strong style={{ color:palierActuel.couleur }}>{palierActuel.label} ({palierActuel.prix}/mois)</strong> au palier <strong style={{ color:palierChoisi.couleur }}>{palierChoisi.label} ({palierChoisi.prix}/mois)</strong>.
            {palierChoisi.prixNum>palierActuel.prixNum && ` La différence de ${(palierChoisi.prixNum-palierActuel.prixNum).toFixed(2).replace('.',',')}$ sera ajustée à votre prochain renouvellement.`}
            {palierChoisi.prixNum<palierActuel.prixNum && ` Le nouveau tarif s'appliquera à votre prochain renouvellement.`}
          </p>
        </div>
      )}

      {statut==='err' && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#ef4444', fontWeight:500 }}>
          ❌ {nbProduits>(PALIERS.find(p=>p.id===planChoisi)?.limite||0)
            ? `Impossible de passer à ce palier — vous avez ${nbProduits} produits actifs. Archivez-en d'abord.`
            : 'Erreur lors de la mise à jour. Veuillez réessayer.'}
        </div>
      )}
      {statut==='ok' && (
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:13, color:'#16a34a', fontWeight:500 }}>
          ✅ Plan mis à jour — vous êtes maintenant sur le palier <strong>{palierActuel.label}</strong>.
        </div>
      )}

      {!confirm
        ? <button onClick={()=>aChange&&setConfirm(true)} disabled={!aChange||saving}
            style={{ width:'100%', padding:'13px', background:aChange?`linear-gradient(135deg,${palierChoisi.couleur},${FUCH})`:'#e5e7eb', color:aChange?'#fff':'#aaa', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:aChange?'pointer':'not-allowed', fontFamily:'inherit', transition:'all 0.2s' }}>
            {aChange?`Changer vers ${palierChoisi.label} — ${palierChoisi.prix}/mois →`:'Sélectionnez un palier différent'}
          </button>
        : <div style={{ border:`2px solid ${palierChoisi.couleur}`, borderRadius:10, padding:'16px 20px' }}>
            <p style={{ fontSize:14, fontWeight:600, color:'#2d1b3d', marginBottom:14, textAlign:'center' }}>
              Confirmer le changement vers <strong style={{ color:palierChoisi.couleur }}>{palierChoisi.label}</strong> à <strong>{palierChoisi.prix}/mois</strong> ?
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setConfirm(false)} style={{ flex:1, padding:'10px', border:'1px solid #e9d5ff', borderRadius:8, background:'#fff', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
              <button onClick={sauvegarder} disabled={saving}
                style={{ flex:2, padding:'10px', border:'none', borderRadius:8, background:`linear-gradient(135deg,${palierChoisi.couleur},${FUCH})`, color:'#fff', fontSize:14, fontWeight:700, cursor:saving?'wait':'pointer', fontFamily:'inherit' }}>
                {saving?'⏳ Mise à jour...':'✅ Confirmer'}
              </button>
            </div>
          </div>
      }

      <div style={{ marginTop:28, padding:'14px 18px', background:'#fdf4ff', borderRadius:8, fontSize:12, color:'#888', lineHeight:1.7 }}>
        <strong style={{ color:'#555' }}>ℹ️ À savoir</strong><br/>
        • Vous pouvez monter de palier en tout temps — effectif immédiatement.<br/>
        • Pour descendre, vous devez avoir moins de produits actifs que la nouvelle limite.<br/>
        • La facturation est ajustée au prochain renouvellement mensuel.
      </div>
    </div>
  );
}