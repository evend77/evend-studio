// src/pages/gestionnaire/MVPremiumPlan.tsx
// e-Vend Studio — Forfaits Multi-Vendeur Premium

import { useState, useEffect } from 'react';

const API_BASE = '/api';

interface Props { gestionnaireId: number; }

const PLANS = [
  {
    id: 'mv-demarrage',
    nom: 'Démarrage',
    prix: 29.99,
    vendeurs: 3,
    stockage_go: 2,
    couleur: '#6366f1',
    icone: '🌱',
    features: [
      '3 vendeurs actifs',
      '2 Go de stockage partagé',
      'Boutiques individuelles',
      'Catalogue unifié',
      'Fiche produit complète',
      'Politiques & documents',
      'Support standard',
    ],
    locked: [],
  },
  {
    id: 'mv-croissance',
    nom: 'Croissance',
    prix: 59.99,
    vendeurs: 10,
    stockage_go: 5,
    couleur: '#2563eb',
    icone: '📈',
    badge: 'Populaire',
    features: [
      '10 vendeurs actifs',
      '5 Go de stockage partagé',
      'Boutiques individuelles',
      'Catalogue unifié',
      'Fiche produit complète',
      'Système d\'enchères ✅',
      'Politiques & documents',
      'Support standard',
    ],
    locked: [],
  },
  {
    id: 'mv-affaires',
    nom: 'Affaires',
    prix: 89.99,
    vendeurs: 25,
    stockage_go: 15,
    couleur: '#0891b2',
    icone: '💼',
    features: [
      '25 vendeurs actifs',
      '15 Go de stockage partagé',
      'Boutiques individuelles',
      'Catalogue unifié',
      'Fiche produit complète',
      'Système d\'enchères ✅',
      'Marque blanche ✅',
      'Politiques & documents',
      'Support prioritaire ✅',
    ],
    locked: [],
  },
  {
    id: 'mv-pro',
    nom: 'Pro',
    prix: 119.99,
    vendeurs: 75,
    stockage_go: 30,
    couleur: '#c9a96e',
    icone: '⭐',
    features: [
      '75 vendeurs actifs',
      '30 Go de stockage partagé',
      'Boutiques individuelles',
      'Catalogue unifié',
      'Fiche produit complète',
      'Système d\'enchères ✅',
      'Marque blanche ✅',
      'Domaine personnalisé inclus ✅',
      'Support prioritaire ✅',
    ],
    locked: [],
  },
  {
    id: 'mv-marche',
    nom: 'Marché',
    prix: 149.99,
    vendeurs: 200,
    stockage_go: 50,
    couleur: '#dc2626',
    icone: '🏪',
    badge: 'Ultime',
    features: [
      '200 vendeurs actifs',
      '50 Go de stockage partagé',
      'Boutiques individuelles',
      'Catalogue unifié',
      'Fiche produit complète',
      'Système d\'enchères ✅',
      'Marque blanche ✅',
      'Domaine personnalisé inclus ✅',
      'Support dédié & prioritaire ✅',
      'Accès API ✅',
    ],
    locked: [],
  },
];

export default function MVPremiumPlan({ gestionnaireId }: Props) {
  const [planActuel, setPlanActuel]   = useState('mv-croissance');
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [statut, setStatut]           = useState<'idle'|'ok'|'err'>('idle');
  const [confirmation, setConfirmation]         = useState<string | null>(null);
  const [confirmationUpgrade, setConfirmationUpgrade] = useState<string | null>(null);

  // Stockage simulé — sera remplacé par le vrai calcul plus tard
  const [stockageUtilise, setStockageUtilise] = useState(0);
  const planCourant = PLANS.find(p => p.id === planActuel) || PLANS[1];
  const stockageMax = planCourant.stockage_go * 1024; // en Mo
  const stockagePct = Math.min((stockageUtilise / stockageMax) * 100, 100);
  const stockageAffiche = stockageUtilise < 1024
    ? `${stockageUtilise.toFixed(0)} Mo`
    : `${(stockageUtilise / 1024).toFixed(1)} Go`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
      headers: { Authorization: `Bearer ${token}` }, credentials: 'include',
    }).then(r => r.ok ? r.json() : {} as any).then((data: any) => {
      if (data?.plan) setPlanActuel(data.plan);
      // Stockage simulé — nombre aléatoire raisonnable
      const planInfo = PLANS.find(p => p.id === data?.plan) || PLANS[1];
      const simule = Math.random() * planInfo.stockage_go * 1024 * 0.3;
      setStockageUtilise(Math.round(simule));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [gestionnaireId]);

  const choisirPlan = async (planId: string) => {
    const actuel = PLANS.findIndex(p => p.id === planActuel);
    const nouveau = PLANS.findIndex(p => p.id === planId);
    if (nouveau < actuel) {
      setConfirmation(planId);       // downgrade → popup avertissement
    } else {
      setConfirmationUpgrade(planId); // upgrade → popup confirmation frais
    }
  };

  const sauvegarder = async (planId: string) => {
    setSaving(true);
    setConfirmation(null);
    setConfirmationUpgrade(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/gestionnaires/${gestionnaireId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ plan: planId }),
      });
      if (!res.ok) throw new Error();
      setPlanActuel(planId);
      setStatut('ok');
    } catch { setStatut('err'); }
    setSaving(false);
    setTimeout(() => setStatut('idle'), 3000);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, fontFamily:"'Inter',sans-serif", color:'#888' }}>
      Chargement...
    </div>
  );

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px', fontFamily:"'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* En-tête */}
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <h1 style={{ fontSize:28, fontWeight:900, color:'#1a1a2e', margin:'0 0 8px' }}>
          🏪 Forfaits Multi-Vendeur Premium
        </h1>
        <p style={{ fontSize:14, color:'#888', margin:0 }}>
          Tous les prix sont en dollars canadiens + taxes applicables
        </p>
      </div>

      {/* Barre stockage */}
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'16px 24px', marginBottom:32, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1a1a2e' }}>💾 Stockage utilisé</span>
            <span style={{ fontSize:13, color:'#888' }}>
              {stockageAffiche} / {planCourant.stockage_go} Go
            </span>
          </div>
          <div style={{ height:8, background:'#f3f4f6', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${stockagePct}%`, background: stockagePct > 85 ? '#ef4444' : stockagePct > 60 ? '#f59e0b' : planCourant.couleur, borderRadius:4, transition:'width 0.5s' }} />
          </div>
        </div>
        <div style={{ fontSize:12, color:'#888', flexShrink:0 }}>
          {stockagePct < 60 ? '✅ Espace disponible' : stockagePct < 85 ? '⚠️ Espace limité' : '🔴 Presque plein'}
        </div>
        <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 14px', fontSize:12, color:'#888' }}>
          ⚡ Stockage simulé — calcul réel à venir
        </div>
      </div>

      {/* Grille des forfaits */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:16, marginBottom:32 }}>
        {PLANS.map(plan => {
          const estActuel = plan.id === planActuel;
          const indexActuel = PLANS.findIndex(p => p.id === planActuel);
          const indexPlan   = PLANS.findIndex(p => p.id === plan.id);
          const estUpgrade  = indexPlan > indexActuel;
          const estDowngrade = indexPlan < indexActuel;

          return (
            <div key={plan.id} style={{ background:'#fff', border:`2px solid ${estActuel ? plan.couleur : '#e5e7eb'}`, borderRadius:16, overflow:'hidden', transition:'all 0.2s', boxShadow: estActuel ? `0 4px 20px ${plan.couleur}30` : 'none', position:'relative' }}>

              {/* Badge */}
              {plan.badge && (
                <div style={{ position:'absolute', top:12, right:12, background:plan.couleur, color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20 }}>
                  {plan.badge}
                </div>
              )}
              {estActuel && (
                <div style={{ position:'absolute', top:12, left:12, background:plan.couleur, color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20 }}>
                  Actuel
                </div>
              )}

              {/* En-tête couleur */}
              <div style={{ background:`linear-gradient(135deg, ${plan.couleur}22, ${plan.couleur}08)`, padding:'24px 16px 16px', borderBottom:`1px solid ${plan.couleur}20`, textAlign:'center' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{plan.icone}</div>
                <h3 style={{ fontSize:16, fontWeight:800, color:'#1a1a2e', margin:'0 0 12px' }}>{plan.nom}</h3>
                <div style={{ fontSize:28, fontWeight:900, color:plan.couleur }}>
                  {plan.prix.toFixed(2).replace('.', ',')} $
                  <span style={{ fontSize:12, fontWeight:500, color:'#888' }}>/mois</span>
                </div>
              </div>

              {/* Infos clés */}
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #f3f4f6', display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, background:`${plan.couleur}15`, color:plan.couleur, padding:'4px 10px', borderRadius:20 }}>
                  👥 {plan.vendeurs} vendeurs
                </span>
                <span style={{ fontSize:11, fontWeight:700, background:'#f3f4f6', color:'#555', padding:'4px 10px', borderRadius:20 }}>
                  💾 {plan.stockage_go} Go
                </span>
              </div>

              {/* Features */}
              <div style={{ padding:'14px 16px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                    <span style={{ color:plan.couleur, fontSize:12, flexShrink:0, marginTop:1 }}>✓</span>
                    <span style={{ fontSize:12, color:'#444', lineHeight:1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Bouton */}
              <div style={{ padding:'0 16px 16px' }}>
                {estActuel ? (
                  <div style={{ textAlign:'center', padding:'10px', background:`${plan.couleur}15`, borderRadius:10, fontSize:13, fontWeight:800, color:plan.couleur }}>
                    ✅ Forfait actuel
                  </div>
                ) : (
                  <button onClick={() => choisirPlan(plan.id)} disabled={saving}
                    style={{ width:'100%', padding:'10px', border:`2px solid ${plan.couleur}`, borderRadius:10, background: estUpgrade ? plan.couleur : 'transparent', color: estUpgrade ? '#fff' : plan.couleur, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                    {saving ? '...' : estUpgrade ? `Passer à ${plan.nom} ↑` : `Rétrograder ↓`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Statut */}
      {statut === 'ok' && <div style={{ textAlign:'center', color:'#22c55e', fontWeight:700, marginBottom:16 }}>✅ Forfait mis à jour !</div>}
      {statut === 'err' && <div style={{ textAlign:'center', color:'#ef4444', fontWeight:700, marginBottom:16 }}>❌ Erreur — réessayez.</div>}

      {/* Note taxes */}
      <p style={{ textAlign:'center', fontSize:12, color:'#aaa' }}>
        Tous les prix sont en $ CAD + taxes applicables · Facturé mensuellement · Annulable en tout temps
      </p>

      {/* Modal confirmation UPGRADE */}
      {confirmationUpgrade && (() => {
        const planCible = PLANS.find(p => p.id === confirmationUpgrade)!;
        const planCourantInfo = PLANS.find(p => p.id === planActuel) || PLANS[1];
        const diff = planCible.prix - planCourantInfo.prix;
        return (
          <div onClick={() => setConfirmationUpgrade(null)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:'#fff', borderRadius:20, maxWidth:460, width:'100%', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', fontFamily:'inherit' }}>
              <div style={{ background:`linear-gradient(135deg, ${planCible.couleur}dd, ${planCible.couleur})`, padding:'28px 32px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:10 }}>{planCible.icone}</div>
                <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', margin:'0 0 4px' }}>
                  Passer au forfait {planCible.nom}
                </h2>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.85)', margin:0 }}>
                  Confirmation de changement de forfait
                </p>
              </div>
              <div style={{ padding:'24px 32px' }}>
                {/* Récapitulatif */}
                <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'16px', marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, color:'#888' }}>Forfait actuel</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1a1a2e' }}>{planCourantInfo.nom} — {planCourantInfo.prix.toFixed(2).replace('.',',')} $/mois</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, color:'#888' }}>Nouveau forfait</span>
                    <span style={{ fontSize:13, fontWeight:700, color:planCible.couleur }}>{planCible.nom} — {planCible.prix.toFixed(2).replace('.',',')} $/mois</span>
                  </div>
                  <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'#1a1a2e' }}>Différence</span>
                    <span style={{ fontSize:14, fontWeight:900, color:planCible.couleur }}>+{diff.toFixed(2).replace('.',',')} $/mois</span>
                  </div>
                </div>

                <div style={{ background:'#fef9ec', border:'1px solid #fde68a', borderRadius:10, padding:'12px 14px', marginBottom:20 }}>
                  <p style={{ margin:0, fontSize:13, color:'#92400e', lineHeight:1.6 }}>
                    ⚠️ Des frais de <strong>{planCible.prix.toFixed(2).replace('.',',')} $/mois + taxes applicables</strong> seront facturés à votre prochain renouvellement. Le changement est effectif immédiatement.
                  </p>
                </div>

                {/* Nouvelles features */}
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Ce que vous gagnez :</p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:12, background:`${planCible.couleur}15`, color:planCible.couleur, padding:'4px 10px', borderRadius:20, fontWeight:700 }}>👥 {planCible.vendeurs} vendeurs</span>
                    <span style={{ fontSize:12, background:'#f3f4f6', color:'#555', padding:'4px 10px', borderRadius:20, fontWeight:700 }}>💾 {planCible.stockage_go} Go stockage</span>
                  </div>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setConfirmationUpgrade(null)}
                    style={{ flex:1, padding:'11px', border:'1px solid #e5e7eb', borderRadius:10, background:'#fff', fontSize:14, cursor:'pointer', fontFamily:'inherit', color:'#555' }}>
                    Annuler
                  </button>
                  <button onClick={() => sauvegarder(confirmationUpgrade)}
                    style={{ flex:2, padding:'11px', border:'none', borderRadius:10, background:`linear-gradient(135deg, ${planCible.couleur}dd, ${planCible.couleur})`, color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                    ✅ Confirmer — {planCible.prix.toFixed(2).replace('.',',')} $/mois
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal confirmation DOWNGRADE */}
      {confirmation && (() => {
        const planCible = PLANS.find(p => p.id === confirmation)!;
        const planCourantInfo = PLANS.find(p => p.id === planActuel) || PLANS[1];
        return (
          <div onClick={() => setConfirmation(null)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20, backdropFilter:'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:'#fff', borderRadius:20, maxWidth:440, width:'100%', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', fontFamily:'inherit' }}>
              <div style={{ background:'linear-gradient(135deg,#dc2626,#ef4444)', padding:'24px 28px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:8 }}>⚠️</div>
                <h2 style={{ fontSize:18, fontWeight:900, color:'#fff', margin:0 }}>Confirmer la rétrogradation</h2>
              </div>
              <div style={{ padding:'24px 28px' }}>
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
                  <p style={{ margin:0, fontSize:14, color:'#1a1a2e', lineHeight:1.7 }}>
                    Vous passez de <strong>{planCourantInfo.nom}</strong> ({planCourantInfo.vendeurs} vendeurs, {planCourantInfo.stockage_go} Go) à <strong>{planCible.nom}</strong> ({planCible.vendeurs} vendeurs, {planCible.stockage_go} Go).
                    <br /><br />
                    Si vous avez plus de <strong>{planCible.vendeurs} vendeurs actifs</strong> ou utilisez plus de <strong>{planCible.stockage_go} Go</strong>, certaines fonctionnalités seront limitées.
                  </p>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setConfirmation(null)}
                    style={{ flex:1, padding:'11px', border:'1px solid #e5e7eb', borderRadius:10, background:'#fff', fontSize:14, cursor:'pointer', fontFamily:'inherit', color:'#555' }}>
                    Annuler
                  </button>
                  <button onClick={() => sauvegarder(confirmation)}
                    style={{ flex:2, padding:'11px', border:'none', borderRadius:10, background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
                    Confirmer la rétrogradation
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}