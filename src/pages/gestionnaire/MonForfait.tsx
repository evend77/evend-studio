/**
 * MonForfait.tsx — src/pages/vendeur/MonForfait.tsx
 * Connecté BD — changer forfait via PUT /api/vendeurs/profil/plan
 */
import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

interface PlanBD {
  id: number; nom: string; emoji: string; description: string;
  prix_ht: any; tps: any; tvq: any; tvh?: any;
  type_abonnement: string; recommande: boolean; fonctionnalites: any;
  couleur_carte: string; couleur_banniere: string; jours_essai: number;
  commission: any; commission_active: boolean;
  limiter_produits: boolean; limite_produits: number;
  frais_activation_actif: boolean; frais_activation_ht: any;
  statut: string; visible_vendeur: boolean;
}
interface AbonnementInfo {
  sellerId: string; nomBoutique: string; email: string; plan: string;
  statut: string; statut_paiement: string; date_debut: string | null; date_fin: string | null;
  prixMensuel: any; commission: any; commission_active: boolean;
  limiter_produits: boolean; limite_produits: number;
  frais_activation_actif: boolean; frais_activation_ht: any;
  fonctionnalites: any; tps: any; tvq: any; tvh?: any; province: string;
}
interface PaiementHisto {
  id: number; date_debut: string | null; date_fin: string | null;
  montant_ht: any; frais_installation: any; methode: string; statut: string;
}
interface MonForfaitProps {
  vendeurUser?: { seller_id?: string; id?: number; nom?: string; boutique?: string };
  naviguerVers?: (page: string) => void;
}

const n = (v: any) => parseFloat(String(v ?? '0')) || 0;
const fmt = (v: any) => n(v) === 0 ? '0,00 $' : n(v).toFixed(2).replace('.', ',') + ' $';
const fmtDate = (d: string | null) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return '—'; }
};

const LABELS: Record<string, string> = {
  tableauBord: 'Tableau de bord vendeur', gestionCommandes: 'Gestion des commandes',
  gestionRetours: 'Gestion des retours (RMA)', paiementsStripePaypal: 'Paiements Stripe & PayPal',
  modeVacances: 'Mode vacances', blog: 'Mes BLOG', faq: 'Ma FAQ',
  modeEncheres: 'Mode encheres', modeFaireOffre: 'Mode faire une offre',
  publicationFuture: 'Date de publication future', gestionStocks: 'Gestion des stocks & alertes',
  codesPromo: 'Codes promo', messagerie: 'Messagerie interne',
  collections: 'Collections personnalisees', statistiquesVisiteurs: 'Statistiques visiteurs',
  commandesBrouillon: 'Commandes brouillon', exportDonnees: 'Export CSV/Excel',
  reseauxSociaux: 'Integration reseaux sociaux', multiLangues: 'Multi-langues boutique',
  apiAcces: 'Acces API', etiquettesExpedition: "Etiquettes d'expedition",
  rapportsAvances: 'Rapports avances', supportPrioritaire: 'Support prioritaire',
};

const parseFonctions = (f: any): { label: string; actif: boolean }[] => {
  if (!f) return [];
  try {
    const p = typeof f === 'string' ? JSON.parse(f) : f;
    if (p && typeof p === 'object' && !Array.isArray(p))
      return Object.entries(p).map(([k, v]) => ({ label: LABELS[k] || k, actif: v === true }));
    if (Array.isArray(p)) return p.map((l: string) => ({ label: l, actif: true }));
  } catch {}
  return [];
};

const couleurDuPlan = (nom: string) => {
  const l = (nom || '').toLowerCase();
  if (l.includes('extreme')) return '#ef4444';
  if (l.includes('fondateur')) return '#8b5cf6';
  if (l.includes('or') && !l.includes('bronze')) return '#f59e0b';
  if (l.includes('argent') || l.includes('silver')) return '#94a3b8';
  if (l.includes('bronze')) return '#CD7F32';
  return '#537373';
};

const banniereDuPlan = (nom: string) => {
  const l = (nom || '').toLowerCase();
  if (l.includes('extreme')) return 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)';
  if (l.includes('fondateur')) return 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)';
  if (l.includes('or') && !l.includes('bronze')) return 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)';
  if (l.includes('argent')) return 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)';
  if (l.includes('bronze')) return 'linear-gradient(135deg, #7c3a0a 0%, #CD7F32 100%)';
  return 'linear-gradient(135deg, #1a2e2e 0%, #537373 100%)';
};

export default function MonForfait({ vendeurUser, naviguerVers }: MonForfaitProps) {
  const [loading, setLoading] = useState(true);
  const [abo, setAbo] = useState<AbonnementInfo | null>(null);
  const [historique, setHistorique] = useState<PaiementHisto[]>([]);
  const [onglet, setOnglet] = useState<'tous' | 'reussi' | 'echoue' | 'remboursement'>('tous');
  const [modalChanger, setModalChanger] = useState(false);
  const [modalDesactiver, setModalDesactiver] = useState(false);
  const [modalPaiement, setModalPaiement] = useState(false);
  const [plans, setPlans] = useState<PlanBD[]>([]);
  const [planChoisi, setPlanChoisi] = useState<PlanBD | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [desactivationConfirmee, setDesactivationConfirmee] = useState(false);
  const [modalDowngrade, setModalDowngrade] = useState(false);
  const [downgradeInfo, setDowngradeInfo] = useState<{ nbAnnonces: number; limitePlan: number; nomPlan: string } | null>(null);
  const [desactivating, setDesactivating] = useState(false);
  const [methodePaiement, setMethodePaiement] = useState<'paypal' | 'carte'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [carteNom, setCarteNom] = useState('');
  const [carteNumero, setCarteNumero] = useState('');
  const [carteExpiry, setCarteExpiry] = useState('');
  const [carteCVV, setCarteCVV] = useState('');

  const charger = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      // Étape 1 : obtenir le profil vendeur (seller_id fiable)
      const profilRes = await fetch(`${API}/api/vendeurs/profil`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profil = await profilRes.json();
      console.log('MonForfait profil:', profil?.seller_id, '| plan:', profil?.plan);
      if (!profil || profil.error) { setLoading(false); return; }

      const sellerId = profil.seller_id;
      if (!sellerId) { setLoading(false); return; }

      // Étape 2 : charger abonnement (JOIN avec plans) + historique
      const [aboText, histRes] = await Promise.all([
        fetch(`${API}/api/abonnements/${sellerId}`).then(r => r.text()),
        fetch(`${API}/api/abonnements/historique`, { headers: { Authorization: `Bearer ${token}` } })
          .then(async r => { try { return await r.json(); } catch { return []; } }),
      ]);

      let aboData: any = null;
      try { aboData = JSON.parse(aboText); } catch {}
      console.log('MonForfait abo:', aboData);

      if (aboData && !aboData.error) {
        setAbo(aboData);
      } else {
        // Fallback: construire depuis le profil directement
        setAbo({
          sellerId: profil.seller_id,
          nomBoutique: profil.boutique || '',
          email: profil.email || '',
          plan: profil.plan || '—',
          statut: profil.statut || 'actif',
          statut_paiement: 'Actif',
          date_debut: profil.date_inscription || '',
          date_fin: '' as string,
          prixMensuel: '0',
          commission: 0,
          commission_active: false,
          limiter_produits: false,
          limite_produits: 0,
          frais_activation_actif: false,
          frais_activation_ht: '0',
          fonctionnalites: null,
          tps: '0', tvq: '0', province: profil.province || '',
        });
      }
      if (Array.isArray(histRes)) setHistorique(histRes);
    } catch (e) { console.error('MonForfait charger erreur:', e); }
    setLoading(false);
  }, [vendeurUser]);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirChangerPlan = async () => {
    setModalChanger(true);
    setPlanChoisi(null);
    setErrMsg('');
    setSuccessMsg('');
    if (plans.length === 0) {
      setLoadingPlans(true);
      try {
        const text = await fetch(`${API}/api/plans`).then(r => r.text());
        const data = JSON.parse(text);
        const liste = Array.isArray(data)
          ? data.filter((p: PlanBD) => p.visible_vendeur === true)
          : [];
        setPlans(liste);
      } catch (e) { console.error('Erreur chargement plans:', e); }
      setLoadingPlans(false);
    }
  };

  const confirmerChangementPlan = async () => {
    if (!planChoisi) return;
    setSavingPlan(true);
    setErrMsg('');
    try {
      const token = localStorage.getItem('token');

      // ── Vérification downgrade ─────────────────────────────────────────
      if (planChoisi.limiter_produits && planChoisi.limite_produits) {
        const profilRes = await fetch(`${API}/api/vendeurs/profil`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profil = await profilRes.json();
        const vendeurId = profil?.id;
        if (vendeurId) {
          const planActifRes = await fetch(`${API}/api/plans/vendeur/${vendeurId}/plan-actif`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const planActifData = await planActifRes.json();
          const nbAnnonces = planActifData?.utilisation?.nb_produits_actifs ?? 0;
          if (nbAnnonces > planChoisi.limite_produits) {
            setSavingPlan(false);
            setDowngradeInfo({ nbAnnonces, limitePlan: planChoisi.limite_produits, nomPlan: planChoisi.nom });
            setModalDowngrade(true);
            return;
          }
        }
      }
      // ──────────────────────────────────────────────────────────────────

      const res = await fetch(`${API}/api/vendeurs/profil/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planChoisi.nom }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Reponse invalide du serveur — redemarrez Node.js'); }
      if (!res.ok) throw new Error(data?.error || 'Erreur serveur');
      setSuccessMsg(`Forfait change pour : ${planChoisi.nom}`);
      setModalChanger(false);
      setPlanChoisi(null);
      await charger();
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      setErrMsg(e.message || 'Erreur lors du changement');
    }
    setSavingPlan(false);
  };

  const confirmerDesactivation = async () => {
    if (!desactivationConfirmee) return;
    setDesactivating(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API}/api/vendeurs/profil/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: null }),
      });
      setSuccessMsg('Forfait desactive. Vos annonces Shopify seront mises en brouillon prochainement.');
      setModalDesactiver(false);
      setDesactivationConfirmee(false);
      await charger();
    } catch {}
    setDesactivating(false);
  };

  const histFiltre = onglet === 'tous' ? historique : historique.filter(h => h.statut === onglet);
  const nomPlan = abo?.plan || '—';
  const prixTTC = n(abo?.prixMensuel) + n(abo?.tps) + n(abo?.tvq);
  const couleur = couleurDuPlan(nomPlan);
  const banniere = banniereDuPlan(nomPlan);
  const fonctions = parseFonctions(abo?.fonctionnalites);

  // Styles utilitaires
  const card: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e1e3e5',
    overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: '18px',
  };
  const cHeader = (c = '#537373'): React.CSSProperties => ({
    padding: '13px 20px', backgroundColor: '#f0f5f5', borderBottom: `2px solid ${c}`,
    display: 'flex', alignItems: 'center', gap: '8px',
  });
  const cTitle: React.CSSProperties = {
    fontSize: '12px', fontWeight: '700', margin: 0, color: '#537373',
    textTransform: 'uppercase', letterSpacing: '0.6px',
  };
  const row = (i: number, total: number): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 20px', borderBottom: i < total - 1 ? '1px solid #f5f5f5' : 'none',
    backgroundColor: i % 2 === 0 ? 'white' : '#fafafa',
  });
  const lbl: React.CSSProperties = { fontSize: '12px', color: '#666', fontWeight: '500' };
  const val: React.CSSProperties = { fontSize: '13px', color: '#1a2e2e', fontWeight: '600' };
  const bdg = (bg: string, c: string): React.CSSProperties => ({
    backgroundColor: bg, color: c, border: `1px solid ${c}`, borderRadius: '20px',
    padding: '2px 10px', fontSize: '10px', fontWeight: '700',
  });
  const btn = (bg: string, col = 'white', brd = 'none'): React.CSSProperties => ({
    backgroundColor: bg, color: col, border: brd, borderRadius: '8px',
    padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  });
  const inputStyle: React.CSSProperties = {
    border: '1px solid #ddd', borderRadius: '8px', padding: '11px 14px',
    fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: '700', color: '#537373', display: 'block',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  const lignes = [
    { label: 'Forfait actuel', v: nomPlan, extra: <span style={bdg('#E9F7EF', '#27AE60')}>{prixTTC === 0 ? 'Gratuit' : 'Actif'}</span> },
    { label: 'Prix mensuel TTC', v: prixTTC === 0 ? 'Gratuit (0,00 $)' : fmt(prixTTC) },
    ...(prixTTC > 0 ? [{ label: 'Taxes', v: `TPS ${fmt(abo?.tps)} · TVQ ${fmt(abo?.tvq)}` }] : []),
    { label: 'Commission', v: abo?.commission_active ? `${n(abo?.commission)} %` : 'Aucune', extra: abo?.commission_active ? <span style={bdg('#FEF3C7', '#92400E')}>Active</span> : null },
    { label: 'Produits autorises', v: abo?.limiter_produits ? String(abo.limite_produits) : 'Illimite ∞' },
    { label: "Frais d'activation", v: abo?.frais_activation_actif ? fmt(abo?.frais_activation_ht) : 'Aucun' },
    { label: 'Date de debut', v: fmtDate(abo?.date_debut || null) },
    { label: 'Renouvellement', v: fmtDate(abo?.date_fin || null) },
    { label: 'Periode de facturation', v: '30 jours' },
    { label: 'Statut paiement', v: abo?.statut_paiement || 'Actif', extra: <span style={bdg('#E9F7EF', '#27AE60')}>{abo?.statut_paiement || 'Actif'}</span> },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '14px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '3px solid #e1e3e5', borderTop: `3px solid ${couleur}`, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#888', fontSize: '13px' }}>Chargement de votre forfait...</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '80px' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        .plan-card:hover{transform:translateY(-3px)!important;box-shadow:0 10px 28px rgba(0,0,0,0.2)!important}
        .fscroll::-webkit-scrollbar{width:4px}
        .fscroll::-webkit-scrollbar-track{background:rgba(255,255,255,0.05);border-radius:4px}
        .fscroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.25);border-radius:4px}
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: '980px' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#1a2e2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mon Forfait</h1>
            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>Gerez votre abonnement et votre moyen de paiement.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setModalDesactiver(true)}
              style={{ ...btn('white', '#C0392B', '2px solid #E74C3C') }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#FDECEA'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'white'}>
              🚫 Desactiver mon forfait
            </button>
            <button onClick={ouvrirChangerPlan}
              style={{ ...btn('#537373'), boxShadow: '0 2px 8px rgba(83,115,115,0.3)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#3d5c5c'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#537373'}>
              ⭐ Changer de forfait
            </button>
          </div>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: '#E9F7EF', border: '1px solid #27AE60', borderRadius: '10px', padding: '12px 18px', marginBottom: '16px', fontSize: '13px', color: '#1a6b3d', fontWeight: '600', animation: 'fadeUp 0.3s ease' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Bannière */}
        <div style={{ background: banniere, borderRadius: '14px', padding: '24px 28px', marginBottom: '22px', color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: '700', margin: '0 0 6px 0', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>Votre plan actuel</p>
            <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 12px 0' }}>{nomPlan}</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: '700' }}>
                {prixTTC === 0 ? 'Gratuit' : fmt(prixTTC)} / mois
              </span>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: '700' }}>
                {n(abo?.commission)} % commission
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', opacity: 0.7, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Renouvellement le</p>
            <p style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>{fmtDate(abo?.date_fin || null)}</p>
            <p style={{ fontSize: '11px', opacity: 0.5, margin: 0 }}>Cycle de 30 jours</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 295px', gap: '18px', alignItems: 'start' }}>

          {/* COL GAUCHE */}
          <div>

            {/* ── MOYEN DE PAIEMENT EN ÉVIDENCE ── */}
            <div style={{ ...card, border: '2px solid #537373' }}>
              <div style={{ background: 'linear-gradient(90deg, #1a2e2e 0%, #537373 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>💳</span>
                  <div>
                    <h3 style={{ ...cTitle, color: 'white', margin: '0 0 2px 0' }}>Moyen de paiement</h3>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Configurez votre methode de facturation mensuelle</p>
                  </div>
                </div>
                <button onClick={() => setModalPaiement(true)}
                  style={{ backgroundColor: 'white', color: '#1a2e2e', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  ⚙️ Configurer
                </button>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', margin: '0 0 2px 0' }}>Aucun moyen de paiement configure</p>
                  <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>Ajoutez PayPal ou une carte de credit pour continuer votre abonnement.</p>
                </div>
                <button onClick={() => setModalPaiement(true)}
                  style={{ ...btn('#537373'), padding: '7px 14px', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  + Ajouter
                </button>
              </div>
            </div>

            {/* Détails forfait */}
            <div style={card}>
              <div style={cHeader(couleur)}>
                <span>📋</span><h3 style={cTitle}>Details du forfait</h3>
              </div>
              {lignes.map((l, i) => (
                <div key={i} style={row(i, lignes.length)}>
                  <span style={lbl}>{l.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={val}>{l.v}</span>
                    {(l as any).extra}
                  </div>
                </div>
              ))}
            </div>

            {/* Historique */}
            <div style={card}>
              <div style={cHeader(couleur)}>
                <span>📄</span><h3 style={cTitle}>Historique des paiements</h3>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 20px' }}>
                {[{ v: 'tous', l: 'Tous' }, { v: 'reussi', l: '✅ Reussis' }, { v: 'echoue', l: '❌ Echoues' }, { v: 'remboursement', l: '↩️ Remboursements' }].map(o => (
                  <button key={o.v} onClick={() => setOnglet(o.v as any)}
                    style={{ padding: '10px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '11px', fontWeight: '600', color: onglet === o.v ? '#537373' : '#999', borderBottom: onglet === o.v ? '3px solid #537373' : '3px solid transparent' }}>
                    {o.l}
                  </button>
                ))}
              </div>
              {histFiltre.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '34px', marginBottom: '8px', opacity: 0.2 }}>📄</div>
                  <p style={{ fontSize: '13px', color: '#bbb', fontWeight: '600', margin: '0 0 2px 0' }}>Aucun paiement</p>
                  <p style={{ fontSize: '11px', color: '#ccc', margin: 0 }}>Votre historique apparaitra ici.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fafafa' }}>
                        {['#ID', 'Debut', 'Fin', 'Montant HT', 'Frais install.', 'Methode', 'Statut'].map(h => (
                          <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {histFiltre.map((h, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: '#666' }}>#{h.id}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px' }}>{fmtDate(h.date_debut)}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px' }}>{fmtDate(h.date_fin)}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: '700', color: '#537373' }}>{fmt(h.montant_ht)}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px' }}>{fmt(h.frais_installation)}</td>
                          <td style={{ padding: '10px 14px', fontSize: '12px' }}>{h.methode || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={bdg(h.statut === 'reussi' ? '#E9F7EF' : h.statut === 'echoue' ? '#FDECEA' : '#FEF9E7', h.statut === 'reussi' ? '#27AE60' : h.statut === 'echoue' ? '#C0392B' : '#F39C12')}>
                              {h.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* COL DROITE */}
          <div>
            <div style={card}>
              <div style={cHeader(couleur)}>
                <span>⚡</span><h3 style={cTitle}>Inclus dans votre plan</h3>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {fonctions.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', padding: '20px 0' }}>Aucune fonctionnalite</p>
                ) : (
                  <>
                    {fonctions.filter(f => f.actif).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <span style={{ fontSize: '12px', color: '#27AE60', flexShrink: 0 }}>✅</span>
                        <span style={{ fontSize: '12px', color: '#333', fontWeight: '600' }}>{f.label}</span>
                      </div>
                    ))}
                    {fonctions.filter(f => !f.actif).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <span style={{ fontSize: '12px', color: '#ddd', flexShrink: 0 }}>✗</span>
                        <span style={{ fontSize: '12px', color: '#bbb' }}>{f.label}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {!['Plan Extreme', 'Plan Fondateur'].includes(nomPlan) && (
              <div style={{ background: 'linear-gradient(135deg, #1a2e2e 0%, #537373 100%)', borderRadius: '12px', padding: '20px', color: 'white', textAlign: 'center', boxShadow: '0 4px 16px rgba(26,46,46,0.3)' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚀</div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 6px 0' }}>Passez au plan superieur</h4>
                <p style={{ fontSize: '11px', opacity: 0.8, margin: '0 0 14px 0', lineHeight: '1.5' }}>Plus de fonctionnalites, moins de commission.</p>
                <button onClick={ouvrirChangerPlan}
                  style={{ backgroundColor: 'white', color: '#537373', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>
                  ⭐ Voir les forfaits
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MODAL CHANGER FORFAIT ═══ */}
      {modalChanger && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.82)', zIndex: 2000, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #060d1f 0%, #0a1628 50%, #060d1f 100%)', borderRadius: '16px', maxWidth: '1100px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)', animation: 'slideUp 0.3s ease' }}>

            {/* Header sticky */}
            <div style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(6,13,31,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="https://cdn.shopify.com/s/files/1/0704/8734/3260/files/logo5.png?v=1758814369" alt="e-Vend" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#a8c6ff' }}>e-Vend.ca — Changer de forfait</p>
                  <p style={{ fontSize: '11px', color: 'rgba(168,198,255,0.5)', margin: 0 }}>Actuel : <strong style={{ color: '#fff' }}>{nomPlan}</strong></p>
                </div>
              </div>
              <button onClick={() => { setModalChanger(false); setPlanChoisi(null); setErrMsg(''); }}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '32px 28px 28px' }}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', padding: '5px 14px', fontSize: '11px', fontWeight: '700', color: '#60a5fa', marginBottom: '12px' }}>
                  ⭐ CHOISISSEZ VOTRE NOUVEAU FORFAIT
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#a8c6ff', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Forfaits disponibles</h2>
                <p style={{ fontSize: '13px', color: 'rgba(168,198,255,0.6)', margin: 0 }}>Toutes les fonctionnalites sont visibles — scrollez dans chaque carte.</p>
              </div>

              {loadingPlans ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  Chargement...
                </div>
              ) : plans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                  <p>Aucun forfait disponible.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`, gap: '14px', marginBottom: '28px', alignItems: 'start' }}>
                    {plans.map(plan => {
                      const choisi = planChoisi?.id === plan.id;
                      const estActuel = plan.nom === nomPlan;
                      const coul = plan.couleur_carte || '#2d6a9f';
                      const foncs = parseFonctions(plan.fonctionnalites);
                      const foncsActives = foncs.filter(f => f.actif);
                      const foncsInactives = foncs.filter(f => !f.actif);
                      const ttc = n(plan.prix_ht) + n(plan.tps) + n(plan.tvq);

                      return (
                        <div key={plan.id}
                          className={estActuel ? '' : 'plan-card'}
                          onClick={() => !estActuel && setPlanChoisi(plan)}
                          style={{
                            backgroundColor: choisi ? 'rgba(255,255,255,0.1)' : estActuel ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                            borderRadius: '14px',
                            border: choisi ? `2px solid ${coul}` : estActuel ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(255,255,255,0.08)',
                            cursor: estActuel ? 'default' : 'pointer',
                            overflow: 'hidden',
                            boxShadow: choisi ? `0 8px 32px ${coul}40` : '0 2px 8px rgba(0,0,0,0.2)',
                            transform: choisi ? 'translateY(-4px)' : 'none',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            opacity: estActuel ? 0.65 : 1,
                          }}>

                          {plan.recommande && (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#f59e0b', color: 'white', fontSize: '9px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', zIndex: 1 }}>
                              ⭐ Recommande
                            </div>
                          )}
                          {estActuel && (
                            <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '9px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', zIndex: 1 }}>
                              ✓ Actuel
                            </div>
                          )}

                          <div style={{ height: '4px', backgroundColor: coul }} />

                          <div style={{ padding: '16px' }}>
                            {/* Nom + emoji */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', marginTop: (estActuel || plan.recommande) ? '14px' : '0' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: coul + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0 }}>
                                {plan.emoji || '📋'}
                              </div>
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: 0 }}>{plan.nom}</p>
                                {plan.jours_essai > 0 && <p style={{ fontSize: '10px', color: '#4ade80', fontWeight: '700', margin: '2px 0 0 0' }}>✅ {plan.jours_essai} jours d'essai</p>}
                              </div>
                            </div>

                            {/* Prix */}
                            <div style={{ marginBottom: '10px' }}>
                              {ttc === 0 ? (
                                <span style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80' }}>Gratuit</span>
                              ) : (
                                <div>
                                  <span style={{ fontSize: '22px', fontWeight: '900', color: coul }}>{ttc.toFixed(2)} $</span>
                                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>/mois</span>
                                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0 0' }}>{n(plan.prix_ht).toFixed(2)} $ + taxes</p>
                                </div>
                              )}
                            </div>

                            {/* Métriques */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '7px 8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: coul, margin: 0 }}>{n(plan.commission)} %</p>
                                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'uppercase' }}>Commission</p>
                              </div>
                              <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '7px 8px', textAlign: 'center' }}>
                                <p style={{ fontSize: '15px', fontWeight: '800', color: '#4ade80', margin: 0 }}>
                                  {plan.limiter_produits ? plan.limite_produits : '∞'}
                                </p>
                                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', margin: 0, textTransform: 'uppercase' }}>Produits</p>
                              </div>
                            </div>

                            {plan.description && (
                              <p style={{ fontSize: '11px', color: 'rgba(168,198,255,0.6)', margin: '0 0 10px 0', lineHeight: 1.5 }}>{plan.description}</p>
                            )}

                            {plan.frais_activation_actif && (
                              <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '6px 10px', marginBottom: '10px' }}>
                                <p style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700', margin: 0 }}>⚡ Frais d'activation : {fmt(plan.frais_activation_ht)}</p>
                              </div>
                            )}

                            {/* Fonctionnalités — TOUTES visibles avec scroll */}
                            {(foncsActives.length > 0 || foncsInactives.length > 0) && (
                              <>
                                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px 0', fontWeight: '700' }}>
                                  Fonctionnalites ({foncsActives.length}/{foncs.length} incluses)
                                </p>
                                <div className="fscroll" style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', paddingRight: '2px' }}>
                                  {foncsActives.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                      <span style={{ color: '#4ade80', flexShrink: 0, fontSize: '10px', marginTop: '2px' }}>✓</span>
                                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{f.label}</span>
                                    </div>
                                  ))}
                                  {foncsInactives.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                      <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0, fontSize: '10px', marginTop: '2px' }}>✗</span>
                                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>{f.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}

                            <button
                              disabled={estActuel}
                              style={{
                                width: '100%', padding: '10px', borderRadius: '10px',
                                border: choisi ? 'none' : estActuel ? '1px solid rgba(255,255,255,0.15)' : `1px solid ${coul}`,
                                backgroundColor: choisi ? coul : estActuel ? 'rgba(255,255,255,0.05)' : 'transparent',
                                color: choisi ? 'white' : estActuel ? 'rgba(255,255,255,0.3)' : coul,
                                fontSize: '12px', fontWeight: '700',
                                cursor: estActuel ? 'default' : 'pointer',
                                transition: 'all 0.15s',
                              }}>
                              {estActuel ? '✓ Plan actuel' : choisi ? '✓ Selectionne' : 'Choisir ce forfait'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {errMsg && (
                    <div style={{ backgroundColor: '#FDECEA', border: '1px solid #E74C3C', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#C0392B', fontWeight: '600' }}>
                      ❌ {errMsg}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
                    <button
                      onClick={confirmerChangementPlan}
                      disabled={!planChoisi || savingPlan}
                      style={{
                        backgroundColor: planChoisi ? '#1a4a8a' : 'rgba(255,255,255,0.08)',
                        color: planChoisi ? 'white' : 'rgba(255,255,255,0.25)',
                        border: 'none', borderRadius: '12px',
                        padding: '14px 48px', fontSize: '15px', fontWeight: '800',
                        cursor: planChoisi ? 'pointer' : 'not-allowed',
                        boxShadow: planChoisi ? '0 4px 20px rgba(26,74,138,0.5)' : 'none',
                        transition: 'all 0.2s', minWidth: '280px',
                      }}>
                      {savingPlan ? '⏳ Enregistrement...' : planChoisi ? `Confirmer — ${planChoisi.nom} →` : 'Selectionnez un forfait'}
                    </button>
                    {planChoisi && (
                      <p style={{ fontSize: '11px', color: 'rgba(168,198,255,0.4)', margin: 0, textAlign: 'center' }}>
                        Le changement sera effectif immediatement dans la base de donnees.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DÉSACTIVER ═══ */}
      {modalDesactiver && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '460px', boxShadow: '0 12px 48px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'slideUp 0.25s ease' }}>
            <div style={{ padding: '18px 24px', backgroundColor: '#FDECEA', borderBottom: '2px solid #E74C3C' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#C0392B', textTransform: 'uppercase' }}>🚫 Desactiver mon forfait</h3>
              <p style={{ fontSize: '12px', color: '#922B21', margin: 0 }}>Cette action mettra votre boutique en pause.</p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ backgroundColor: '#FEF9E7', border: '1px solid #F39C12', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '13px', color: '#7d6608', fontWeight: '700', margin: '0 0 8px 0' }}>⚠️ Consequences :</p>
                {['🛍️ Produits mis en brouillon sur Shopify', '📦 Commandes en cours non affectees', '🔒 Perte d\'acces au tableau de bord', '🔄 Reactivable en choisissant un forfait', '💳 Aucun remboursement au prorata'].map((item, i) => (
                  <p key={i} style={{ fontSize: '12px', color: '#7d6608', margin: '0 0 5px 0' }}>{item}</p>
                ))}
              </div>
              <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '11px', color: '#856404' }}>
                📌 Integration Shopify API disponible prochainement.
              </div>
              <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
                <input type="checkbox" id="conf-deact" checked={desactivationConfirmee}
                  onChange={e => setDesactivationConfirmee(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#E74C3C', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} />
                <label htmlFor="conf-deact" style={{ fontSize: '13px', color: '#C0392B', fontWeight: '600', cursor: 'pointer', lineHeight: 1.5 }}>
                  Je comprends les consequences et confirme la desactivation.
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setModalDesactiver(false); setDesactivationConfirmee(false); }}
                  style={{ ...btn('white', '#666', '1px solid #ddd') }}>Annuler</button>
                <button disabled={!desactivationConfirmee || desactivating} onClick={confirmerDesactivation}
                  style={{ ...btn(desactivationConfirmee ? '#E74C3C' : '#ccc'), cursor: desactivationConfirmee ? 'pointer' : 'not-allowed' }}>
                  {desactivating ? '⏳...' : '🚫 Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL PAIEMENT ═══ */}
      {modalPaiement && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '480px', boxShadow: '0 12px 48px rgba(0,0,0,0.25)', overflow: 'hidden', animation: 'slideUp 0.25s ease' }}>
            <div style={{ padding: '18px 24px', background: 'linear-gradient(90deg, #1a2e2e 0%, #537373 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 2px 0', color: 'white', textTransform: 'uppercase' }}>💳 Moyen de paiement</h3>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>Configurez votre methode de facturation</p>
              </div>
              <button onClick={() => setModalPaiement(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ backgroundColor: '#f0f5f5', border: '1px solid #b2cccc', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '18px' }}>🔒</span>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#537373', margin: '0 0 1px 0' }}>Paiement securise</p>
                  <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>Vos informations sont encryptees et securisees.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[{ v: 'paypal', icon: '🅿️', label: 'PayPal', desc: 'Via compte PayPal' }, { v: 'carte', icon: '💳', label: 'Carte de credit', desc: 'Visa, Mastercard, Amex' }].map(m => (
                  <button key={m.v} onClick={() => setMethodePaiement(m.v as any)}
                    style={{ border: `2px solid ${methodePaiement === m.v ? '#537373' : '#e1e3e5'}`, borderRadius: '10px', padding: '14px', backgroundColor: methodePaiement === m.v ? '#f0f5f5' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: '22px', marginBottom: '5px' }}>{m.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: methodePaiement === m.v ? '#537373' : '#333' }}>{m.label}</div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{m.desc}</div>
                    {methodePaiement === m.v && <div style={{ marginTop: '4px', fontSize: '10px', color: '#537373', fontWeight: '700' }}>✓ Selectionne</div>}
                  </button>
                ))}
              </div>

              {methodePaiement === 'paypal' ? (
                <div>
                  <label style={labelStyle}>Adresse courriel PayPal *</label>
                  <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)}
                    placeholder="votre@paypal.com" style={inputStyle} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Nom sur la carte *</label>
                    <input type="text" value={carteNom} onChange={e => setCarteNom(e.target.value)} placeholder="Prenom Nom" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Numero de carte *</label>
                    <input type="text" value={carteNumero}
                      onChange={e => setCarteNumero(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                      placeholder="0000 0000 0000 0000" maxLength={19}
                      style={{ ...inputStyle, letterSpacing: '2px', fontFamily: 'monospace' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Expiration *</label>
                      <input type="text" value={carteExpiry}
                        onChange={e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2); setCarteExpiry(v); }}
                        placeholder="MM/AA" maxLength={5} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>CVV *</label>
                      <input type="password" value={carteCVV}
                        onChange={e => setCarteCVV(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••" maxLength={4} style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                <button onClick={() => setModalPaiement(false)} style={{ ...btn('white', '#666', '1px solid #ddd') }}>Annuler</button>
                <button onClick={() => setModalPaiement(false)} style={{ ...btn('#537373') }}>✅ Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
