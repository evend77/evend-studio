import React, { useState, useEffect } from 'react';

interface Plan {
  id: number;
  nom: string;
  emoji: string;
  description: string;
  prix_ht: number;
  tps: number;
  tvq: number;
  tvh: number;
  type_abonnement: string;
  recommande: boolean;
  fonctionnalites: any;
  couleur_carte: string;
  couleur_banniere: string;
  jours_essai: number;
  statut: string;
  visible_vendeur: boolean;
  commission: number;
  commission_active: boolean;
  limiter_produits: boolean;
  limite_produits: number;
}

interface Props {
  vendeurCree: { seller_id: string; nom: string; id?: number };
  onForfaitChoisi: (planNom: string) => void;
}

const LABELS: Record<string, string> = {
  tableauBord: 'Tableau de bord vendeur', gestionCommandes: 'Gestion des commandes',
  gestionRetours: 'Gestion des retours (RMA)', paiementsStripePaypal: 'Paiements Stripe & PayPal',
  modeVacances: 'Mode vacances', blog: 'Mes BLOG', faq: 'Ma FAQ',
  modeEncheres: 'Mode enchères', modeFaireOffre: 'Mode faire une offre',
  publicationFuture: 'Date de publication future', gestionStocks: 'Gestion des stocks & alertes',
  codesPromo: 'Codes promo', messagerie: 'Messagerie interne',
  collections: 'Collections personnalisées', statistiquesVisiteurs: 'Statistiques visiteurs',
  commandesBrouillon: 'Commandes brouillon', exportDonnees: 'Export CSV/Excel',
  reseauxSociaux: 'Intégration réseaux sociaux', multiLangues: 'Multi-langues boutique',
  apiAcces: 'Accès API', etiquettesExpedition: "Étiquettes d'expédition",
  rapportsAvances: 'Rapports avancés', supportPrioritaire: 'Support prioritaire',
};

export default function ChoisirForfaitVendeur({ vendeurCree, onForfaitChoisi }: Props) {
  const [plans, setPlans]           = useState<Plan[]>([]);
  const [loading, setLoading]       = useState(true);
  const [planChoisi, setPlanChoisi] = useState<Plan | null>(null);
  const [enCours, setEnCours]       = useState(false);

  useEffect(() => {
    fetch('https://evend-multivendeur-api.onrender.com/api/plans')
      .then(r => r.json())
      .then((data: Plan[]) => {
        const liste = Array.isArray(data)
          ? data.filter(p => (p.statut === 'actif' || p.statut == null) && p.visible_vendeur === true)
          : [];
        setPlans(liste);
        setLoading(false);
      })
      .catch(() => { setPlans([]); setLoading(false); });
  }, []);

  const parseFonctions = (f: any): string[] => {
    if (!f) return [];
    if (typeof f === 'object' && !Array.isArray(f)) {
      return Object.entries(f).filter(([, v]) => v === true).map(([k]) => LABELS[k] || k);
    }
    if (Array.isArray(f)) return f;
    try {
      const parsed = JSON.parse(f);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed).filter(([, v]) => v === true).map(([k]) => LABELS[k] || k);
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  const prixTTC = (plan: Plan) => {
    const base = parseFloat(String(plan.prix_ht)) || 0;
    const tps  = parseFloat(String(plan.tps))  || 0;
    const tvq  = parseFloat(String(plan.tvq))  || 0;
    const tvh  = parseFloat(String(plan.tvh))  || 0;
    return (base + tps + tvq + tvh).toFixed(2);
  };

  const taxesDetail = (plan: Plan) => {
    const tps = parseFloat(String(plan.tps)) || 0;
    const tvq = parseFloat(String(plan.tvq)) || 0;
    const tvh = parseFloat(String(plan.tvh)) || 0;
    const parts: string[] = [];
    if (tps > 0) parts.push(`TPS ${tps.toFixed(2)} $`);
    if (tvq > 0) parts.push(`TVQ ${tvq.toFixed(2)} $`);
    if (tvh > 0) parts.push(`TVH ${tvh.toFixed(2)} $`);
    return parts.join(' · ');
  };

  const periodLabel = (type: string) => {
    if (!type) return '/mois';
    if (type.includes('annuel') || type.includes('an')) return '/an';
    if (type.includes('vie') || type.includes('unique')) return ' — paiement unique';
    return '/mois';
  };

  const confirmer = async () => {
    if (!planChoisi) return;
    setEnCours(true);
    try {
      if (vendeurCree.id) {
        await fetch(`https://evend-multivendeur-api.onrender.com/api/vendeurs/${vendeurCree.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: planChoisi.nom }),
        });
      }
    } catch { }
    onForfaitChoisi(planChoisi.nom);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#060d1f,#0a1628)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Chargement des forfaits...</p>
    </div>
  );

  if (plans.length === 0) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#060d1f,#0a1628)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px 0', color: '#a8c6ff' }}>Aucun forfait configuré</h2>
        <p style={{ fontSize: '13px', color: 'rgba(168,198,255,0.6)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Votre compte a été créé et est en attente d'approbation.
        </p>
        <button onClick={() => onForfaitChoisi('Gratuit')}
          style={{ backgroundColor: '#1a4a8a', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          Continuer →
        </button>
      </div>
    </div>
  );

  const cols = Math.min(plans.length, 3);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#060d1f 0%,#0a1628 50%,#060d1f 100%)', fontFamily: "'Segoe UI',system-ui,sans-serif", color: '#fff' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }`}</style>

      {/* Header */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="https://cdn.shopify.com/s/files/1/0704/8734/3260/files/logo5.png?v=1758814369" alt="e-Vend" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
        <div>
          <p style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#a8c6ff' }}>e-Vend.ca</p>
          <p style={{ fontSize: '11px', color: 'rgba(168,198,255,0.5)', margin: 0 }}>Inscription vendeur</p>
        </div>
      </div>

      <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', padding: '5px 14px', fontSize: '11px', fontWeight: '700', color: '#60a5fa', letterSpacing: '0.5px', marginBottom: '14px' }}>
            ÉTAPE 2 SUR 2
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#a8c6ff', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Choisissez votre forfait
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(168,198,255,0.6)', margin: 0 }}>
            Bonjour <strong style={{ color: '#fff' }}>{vendeurCree.nom}</strong> — Sélectionnez le forfait qui convient à votre boutique.
          </p>
        </div>

        {/* Grille */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '18px', marginBottom: '36px' }}>
          {plans.map(plan => {
            const choisi    = planChoisi?.id === plan.id;
            const couleur   = plan.couleur_carte || '#2d6a9f';
            const fonctions = parseFonctions(plan.fonctionnalites);
            const gratuit   = parseFloat(String(plan.prix_ht)) === 0;
            const taxes     = taxesDetail(plan);

            return (
              <div key={plan.id} onClick={() => setPlanChoisi(plan)} style={{
                backgroundColor: choisi ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: choisi ? `2px solid ${couleur}` : '2px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: choisi ? `0 8px 32px ${couleur}40` : 'none',
                transform: choisi ? 'translateY(-4px)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>

                {/* Badge recommandé */}
                {plan.recommande && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#f59e0b', color: 'white', fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', zIndex: 1 }}>
                    ⭐ Recommandé
                  </div>
                )}

                {/* Barre couleur top */}
                <div style={{ height: '5px', backgroundColor: couleur, flexShrink: 0 }} />

                <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>

                  {/* Emoji + Nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: couleur + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {plan.emoji || '📋'}
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: 0 }}>{plan.nom}</p>
                      {plan.jours_essai > 0 && (
                        <p style={{ fontSize: '11px', color: '#4ade80', fontWeight: '700', margin: '2px 0 0 0' }}>✅ {plan.jours_essai} jours d'essai gratuit</p>
                      )}
                    </div>
                  </div>

                  {/* Prix */}
                  <div style={{ marginBottom: '12px' }}>
                    {gratuit ? (
                      <span style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80' }}>Gratuit</span>
                    ) : (
                      <>
                        <div>
                          <span style={{ fontSize: '24px', fontWeight: '900', color: couleur }}>{prixTTC(plan)} $</span>
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>{periodLabel(plan.type_abonnement)} TTC</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0 0' }}>
                          {parseFloat(String(plan.prix_ht)).toFixed(2)} $ HT
                          {taxes && <span style={{ marginLeft: '6px', color: 'rgba(168,198,255,0.4)' }}>· {taxes}</span>}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Stats : produits + commission */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0 }}>
                        {plan.limiter_produits && plan.limite_produits > 0 ? plan.limite_produits : '∞'}
                      </p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produits</p>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', fontWeight: '800', color: plan.commission_active ? '#fbbf24' : '#4ade80', margin: 0 }}>
                        {plan.commission_active && plan.commission > 0 ? `${plan.commission} %` : '—'}
                      </p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Commission</p>
                    </div>
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p style={{ fontSize: '12px', color: 'rgba(168,198,255,0.6)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                      {plan.description}
                    </p>
                  )}

                  {/* Fonctionnalités scrollables */}
                  {fonctions.length > 0 && (
                    <div style={{ marginBottom: '16px', flex: 1 }}>
                      <p style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px 0' }}>
                        {fonctions.length} fonctionnalités incluses
                      </p>
                      <ul style={{ listStyle: 'none', padding: '0 4px 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '130px', overflowY: 'auto' }}>
                        {fonctions.map((f: string, i: number) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                            <span style={{ color: '#4ade80', flexShrink: 0, marginTop: '1px' }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bouton sélection */}
                  <button style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: choisi ? '#16a34a' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    marginTop: 'auto',
                  }}>
                    {choisi ? '✓ Sélectionné' : 'Choisir ce forfait'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bouton confirmer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <button onClick={confirmer} disabled={!planChoisi || enCours} style={{
            backgroundColor: planChoisi ? '#1a4a8a' : 'rgba(255,255,255,0.08)',
            color: planChoisi ? 'white' : 'rgba(255,255,255,0.3)',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 48px',
            fontSize: '15px',
            fontWeight: '800',
            cursor: planChoisi ? 'pointer' : 'not-allowed',
            boxShadow: planChoisi ? '0 4px 20px rgba(26,74,138,0.5)' : 'none',
            transition: 'all 0.2s',
          }}>
            {enCours ? '⏳ Confirmation...' : planChoisi ? `Confirmer — ${planChoisi.nom} →` : 'Sélectionnez un forfait'}
          </button>
          {planChoisi && (
            <p style={{ fontSize: '12px', color: 'rgba(168,198,255,0.5)', margin: 0, textAlign: 'center', maxWidth: '400px', lineHeight: 1.5 }}>
              Votre compte sera soumis pour approbation après confirmation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
