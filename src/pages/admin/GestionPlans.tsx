import React, { useState, useEffect } from 'react';
import { FONCTIONNALITES_MASTER } from '../../shared/plansData';
import { log } from '../../services/logger';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

// Formatage de prix sécurisé
const fmtPrix = (prix: number | undefined | null) => {
  if (prix === undefined || prix === null) return '0,00 $';
  return prix.toFixed(2).replace('.', ',') + ' $';
};

interface Plan {
  id: number;
  nom: string;
  emoji: string;
  typeAbonnement: string;
  prixHT: number;
  tps: number;
  tvq: number;
  tvh: number;
  limiterProduits: boolean;
  limiteProduits: number | null;
  joursEssai: number;
  visibleVendeur: boolean;
  position: number;
  recommande: boolean;
  commissionActive: boolean;
  commission: number;
  infoSupplementaire: string;
  fraisActivationActif: boolean;
  fraisActivationHT: number;
  fraisActivationTPS: number;
  fraisActivationTVQ: number;
  fraisActivationTVH: number;
  chargerFraisSur: string;
  assignerVendeurs: boolean;
  emailsVendeurs: string;
  fonctionnalites: { [key: string]: boolean };
  description?: string;
  couleurBanniere?: string;
  couleurCarte?: string;
  statut: 'actif' | 'inactif';
  date_creation: string;
}

interface GestionPlansProps {
  naviguerVers: (page: string, data?: any) => void;
}

// Fonction helper pour convertir un plan en format PostgreSQL (snake_case)
const buildPlanData = (plan: Plan, updates: any = {}) => ({
  id: plan.id,
  nom: plan.nom,
  emoji: plan.emoji,
  type_abonnement: plan.typeAbonnement,
  prix_ht: plan.prixHT,
  tps: plan.tps,
  tvq: plan.tvq,
  tvh: plan.tvh,
  limiter_produits: plan.limiterProduits,
  limite_produits: plan.limiteProduits,
  jours_essai: plan.joursEssai,
  visible_vendeur: plan.visibleVendeur,
  position: plan.position,
  recommande: plan.recommande,
  commission_active: plan.commissionActive,
  commission: plan.commission,
  info_supplementaire: plan.infoSupplementaire,
  frais_activation_actif: plan.fraisActivationActif,
  frais_activation_ht: plan.fraisActivationHT,
  frais_activation_tps: plan.fraisActivationTPS,
  frais_activation_tvq: plan.fraisActivationTVQ,
  frais_activation_tvh: plan.fraisActivationTVH,
  charger_frais_sur: plan.chargerFraisSur,
  assigner_vendeurs: plan.assignerVendeurs,
  emails_vendeurs: plan.emailsVendeurs,
  fonctionnalites: plan.fonctionnalites,
  description: plan.description,
  couleur_banniere: plan.couleurBanniere,
  couleur_carte: plan.couleurCarte,
  statut: plan.statut,
  ...updates
});

export default function GestionPlans({ naviguerVers }: GestionPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [modalSupprimerOuvert, setModalSupprimerOuvert] = useState(false);
  const [planASupprimer, setPlanASupprimer] = useState<Plan | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'actif' | 'inactif'>('tous');
  const [loading, setLoading] = useState(true);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);

  // Charger les plans depuis PostgreSQL
  const chargerPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://evend-multivendeur-api.onrender.com/api/plans');
      if (!response.ok) throw new Error('Erreur chargement');
      const data = await response.json();
      
      const plansTransformes = data.map((p: any) => ({
        id: p.id || 0,
        nom: p.nom || '',
        emoji: p.emoji || '⭐',
        typeAbonnement: p.type_abonnement || 'mensuel',
        prixHT: parseFloat(p.prix_ht) || 0,
        tps: parseFloat(p.tps) || 0,
        tvq: parseFloat(p.tvq) || 0,
        tvh: parseFloat(p.tvh) || 0,
        limiterProduits: p.limiter_produits === true,
        limiteProduits: p.limite_produits ? parseInt(p.limite_produits) : null,
        joursEssai: parseInt(p.jours_essai) || 0,
        visibleVendeur: p.visible_vendeur !== false,
        position: parseInt(p.position) || 99,
        recommande: p.recommande === true,
        commissionActive: p.commission_active === true,
        commission: parseFloat(p.commission) || 0,
        infoSupplementaire: p.info_supplementaire || '',
        fraisActivationActif: p.frais_activation_actif === true,
        fraisActivationHT: parseFloat(p.frais_activation_ht) || 0,
        fraisActivationTPS: parseFloat(p.frais_activation_tps) || 0,
        fraisActivationTVQ: parseFloat(p.frais_activation_tvq) || 0,
        fraisActivationTVH: parseFloat(p.frais_activation_tvh) || 0,
        chargerFraisSur: p.charger_frais_sur || 'nouvelle_inscription',
        assignerVendeurs: p.assigner_vendeurs === true,
        emailsVendeurs: p.emails_vendeurs || '',
        fonctionnalites: p.fonctionnalites || {},
        description: p.description || '',
        couleurBanniere: p.couleur_banniere || '',
        couleurCarte: p.couleur_carte || '',
        statut: p.statut || 'actif',
        date_creation: p.date_creation || '',
      }));
      
      setPlans(plansTransformes);
      log.succes('Plans chargés', `${plansTransformes.length} plans récupérés`, 'systeme');
    } catch (err) {
      console.error('❌ Erreur chargement plans:', err);
      log.erreur('Erreur chargement plans', err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerPlans();
    log.admin('Page visitée', 'Gestion des plans');
  }, []);

  const handleMenuClick = (e: React.MouseEvent, planId: number) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Calculer la position pour que le menu reste dans la fenêtre
    const menuWidth = 220;
    let left = rect.left;
    
    // Si le menu dépasse à droite, le positionner à gauche du bouton
    if (left + menuWidth > window.innerWidth) {
      left = rect.right - menuWidth;
    }
    
    setMenuPosition({ left, top: rect.bottom + 5 });
    setMenuOuvert(planId);
  };

  const toggleStatut = async (id: number) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    
    const nouveauStatut = plan.statut === 'actif' ? 'inactif' : 'actif';
    
    try {
      console.log(`🔄 Changement statut: ${plan.nom} (${plan.statut} → ${nouveauStatut})`);
      
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPlanData(plan, { statut: nouveauStatut }))
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur mise à jour');
      }
      
      const planMisAJour = await response.json();
      console.log('✅ Plan mis à jour:', planMisAJour);
      
      // Mettre à jour localement
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.id === id ? { ...p, statut: nouveauStatut } : p
        )
      );
      
      setMenuOuvert(null);
      setMenuPosition(null);
      
      log.admin(
        'Statut plan modifié', 
        `Plan ${plan.nom} ${nouveauStatut === 'actif' ? 'activé' : 'désactivé'}`,
        { id: String(plan.id) }
      );
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      log.erreur('Erreur changement statut', err instanceof Error ? err.message : 'Erreur inconnue', { 
        plan: plan.nom,
        id: String(plan.id)
      });
      alert('Erreur lors du changement de statut');
    }
  };

  const demanderSuppression = (plan: Plan) => {
    setPlanASupprimer(plan);
    setModalSupprimerOuvert(true);
    setMenuOuvert(null);
    setMenuPosition(null);
  };

  const confirmerSuppression = async () => {
    if (!planASupprimer) return;
    
    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/plans/${planASupprimer.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur suppression');
      
      // Mettre à jour localement sans recharger
      setPlans(prevPlans => prevPlans.filter(p => p.id !== planASupprimer.id));
      setModalSupprimerOuvert(false);
      log.admin('Plan supprimé', `Plan ${planASupprimer.nom} supprimé`, { id: String(planASupprimer.id) });
      setPlanASupprimer(null);
    } catch (err) {
      console.error('❌ Erreur:', err);
      log.erreur('Erreur suppression plan', err instanceof Error ? err.message : 'Erreur inconnue', { 
        plan: planASupprimer.nom,
        id: String(planASupprimer.id)
      });
    }
  };

  const toggleRecommande = async (id: number) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    
    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPlanData(plan, { recommande: !plan.recommande }))
      });
      if (!response.ok) throw new Error('Erreur mise à jour');
      
      // Mettre à jour localement
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.id === id ? { ...p, recommande: !p.recommande } : p
        )
      );
      
      setMenuOuvert(null);
      setMenuPosition(null);
      
      log.admin(plan.recommande ? 'Plan retiré des populaires' : 'Plan marqué populaire', `Plan ${plan.nom}`, { id: String(plan.id) });
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  };

  const toggleVisible = async (id: number) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    
    try {
      const response = await fetch(`https://evend-multivendeur-api.onrender.com/api/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPlanData(plan, { visible_vendeur: !plan.visibleVendeur }))
      });
      if (!response.ok) throw new Error('Erreur mise à jour');
      
      // Mettre à jour localement
      setPlans(prevPlans => 
        prevPlans.map(p => 
          p.id === id ? { ...p, visibleVendeur: !p.visibleVendeur } : p
        )
      );
      
      setMenuOuvert(null);
      setMenuPosition(null);
      
      log.admin('Visibilité plan modifiée', `Plan ${plan.nom} ${plan.visibleVendeur ? 'visible' : 'masqué'}`, { id: String(plan.id) });
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  };

  const plansFiltres = plans.filter(p => {
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = filtreStatut === 'tous' || p.statut === filtreStatut;
    return matchRecherche && matchStatut;
  }).sort((a, b) => a.position - b.position);

  const totalAbonnements = 6;
  const totalActifs = plans.filter(p => p.statut === 'actif').length;
  const revenuMensuelEstime = plans.filter(p => p.statut === 'actif').reduce((s, p) => s + (p.prixHT || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: THEME.textLight }}>Chargement des plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px 28px',
      backgroundColor: THEME.bg,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }} onClick={() => {
      setMenuOuvert(null);
      setMenuPosition(null);
    }}>

      {/* En-tête */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: '800', 
            margin: 0, 
            color: THEME.text, 
            textTransform: 'uppercase', 
            letterSpacing: '0.5px' 
          }}>
            Forfaits & Plans
          </h1>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: '4px 0 0 0' }}>
            {plans.length} plan{plans.length > 1 ? 's' : ''} configuré{plans.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => naviguerVers('forfaits-creer')}
          style={{ 
            backgroundColor: THEME.accent, 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            padding: '10px 20px', 
            fontSize: '13px', 
            fontWeight: '700', 
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(45,106,159,0.3)'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = THEME.accentHover}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = THEME.accent}
        >
          ＋ Créer un nouveau plan
        </button>
      </div>

      {/* KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '14px', 
        marginBottom: '20px' 
      }}>
        {[
          { label: 'Plans actifs', val: String(totalActifs), icon: '✅', color: THEME.success },
          { label: 'Plans inactifs', val: String(plans.filter(p => p.statut === 'inactif').length), icon: '⏸️', color: THEME.textLight },
          { label: 'Abonnements', val: String(totalAbonnements), icon: '👥', color: THEME.accent },
          { label: 'Revenu mensuel', val: `${revenuMensuelEstime.toFixed(0)} $`, icon: '💰', color: THEME.warning },
        ].map((k, i) => (
          <div key={i} style={{ 
            backgroundColor: THEME.card, 
            borderRadius: '10px', 
            border: `1px solid ${THEME.border}`, 
            padding: '16px 18px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <div style={{ 
              fontSize: '24px', 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px', 
              backgroundColor: k.color + '15', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: '800', color: THEME.text, margin: 0 }}>{k.val}</p>
              <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px', 
        alignItems: 'center' 
      }}>
        <input
          type="text" 
          value={recherche} 
          onChange={e => setRecherche(e.target.value)}
          placeholder="🔍 Rechercher un plan..."
          style={{ 
            border: `1px solid ${THEME.border}`, 
            borderRadius: '8px', 
            padding: '8px 14px', 
            fontSize: '13px', 
            outline: 'none', 
            width: '250px', 
            backgroundColor: 'white' 
          }}
        />
        {[
          { val: 'tous', label: 'Tous' }, 
          { val: 'actif', label: '✅ Actifs' }, 
          { val: 'inactif', label: '⏸️ Inactifs' }
        ].map(f => (
          <button 
            key={f.val} 
            onClick={() => setFiltreStatut(f.val as any)} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              border: `2px solid ${filtreStatut === f.val ? THEME.accent : THEME.border}`, 
              backgroundColor: filtreStatut === f.val ? THEME.accentLight : 'white', 
              color: filtreStatut === f.val ? THEME.accent : THEME.textLight 
            }}
          >
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: THEME.textLight }}>
          {plansFiltres.length} résultat{plansFiltres.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Tableau */}
      <div style={{ 
        flex: 1,
        backgroundColor: THEME.card,
        borderRadius: '12px',
        border: `1px solid ${THEME.border}`,
        overflow: 'auto',
        marginBottom: '20px',
        position: 'relative'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          minWidth: '1000px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
              <th style={{ padding: '14px 8px', width: '50px', textAlign: 'center' }}>Pos.</th>
              <th style={{ padding: '14px 8px', textAlign: 'left', width: '200px' }}>Plan</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>Période</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '90px' }}>Prix HT</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>Produits</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '90px' }}>Commission</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '90px' }}>Activation</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>Fonct.</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '90px' }}>Statut</th>
              <th style={{ padding: '14px 8px', textAlign: 'center', width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {plansFiltres.map((plan, i) => {
              const nbFonct = Object.values(plan.fonctionnalites || {}).filter(Boolean).length;
              const totalFonct = Object.keys(plan.fonctionnalites || {}).length;
              return (
                <tr key={plan.id} style={{ 
                  borderBottom: '1px solid #f5f5f5', 
                  backgroundColor: i % 2 === 0 ? 'white' : '#fafafa',
                  opacity: plan.statut === 'inactif' ? 0.6 : 1
                }}>
                  <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: '600', color: THEME.textLight }}>
                    {plan.position}
                  </td>
                  <td style={{ padding: '14px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{plan.emoji}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '800', color: THEME.text }}>{plan.nom}</span>
                          {plan.recommande && (
                            <span style={{ 
                              fontSize: '10px', 
                              backgroundColor: '#fef9c3', 
                              color: '#92400e', 
                              border: '1px solid #d97706', 
                              borderRadius: '10px', 
                              padding: '2px 7px', 
                              fontWeight: '700' 
                            }}>
                              ⭐
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10px', color: '#aaa' }}>ID: {plan.id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '12px', color: THEME.textLight }}>
                    30 jours
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ fontWeight: '700', color: plan.prixHT === 0 ? THEME.success : THEME.text }}>
                      {fmtPrix(plan.prixHT)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '12px', fontWeight: '600' }}>
                    {plan.limiteProduits === null ? '∞' : plan.limiteProduits}
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ fontWeight: '700', color: plan.commissionActive ? THEME.accent : THEME.textLight }}>
                      {plan.commissionActive ? `${plan.commission} %` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ fontWeight: '600', color: plan.fraisActivationHT === 0 ? THEME.success : THEME.text }}>
                      {plan.fraisActivationHT === 0 ? '—' : fmtPrix(plan.fraisActivationHT)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                      <div style={{ width: '30px', height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: totalFonct > 0 ? `${(nbFonct / totalFonct) * 100}%` : '0%', 
                          backgroundColor: THEME.accent 
                        }} />
                      </div>
                      <span style={{ fontSize: '10px', color: THEME.textLight, fontWeight: '600' }}>{nbFonct}/{totalFonct}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      backgroundColor: plan.statut === 'actif' ? '#dcfce7' : '#f3f4f6', 
                      color: plan.statut === 'actif' ? THEME.success : THEME.textLight,
                      border: `1px solid ${plan.statut === 'actif' ? '#86efac' : '#d1d5db'}`
                    }}>
                      {plan.statut === 'actif' ? '✓ Actif' : '⏸ Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => handleMenuClick(e, plan.id)}
                      style={{ 
                        background: 'none', 
                        border: `1px solid ${THEME.border}`, 
                        borderRadius: '4px', 
                        padding: '4px 8px', 
                        cursor: 'pointer', 
                        fontSize: '16px', 
                        color: THEME.textLight, 
                        fontWeight: '700',
                        lineHeight: 1
                      }}
                    >
                      ⋯
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Menu contextuel flottant */}
      {menuOuvert !== null && menuPosition && (
        <div style={{ 
          position: 'fixed',
          left: menuPosition.left,
          top: menuPosition.top,
          zIndex: 9999,
          backgroundColor: 'white',
          borderRadius: '10px',
          border: `1px solid ${THEME.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          minWidth: '220px',
          overflow: 'hidden'
        }}>
          {(() => {
            const plan = plans.find(p => p.id === menuOuvert);
            if (!plan) return null;
            
            return (
              <div style={{ padding: '4px 0' }}>
                <MenuItem 
                  onClick={() => { 
                    naviguerVers('forfaits-creer', plan); 
                    setMenuOuvert(null);
                    setMenuPosition(null);
                  }}
                  icon="✏️"
                  label="Modifier le plan"
                />
                <MenuItem 
                  onClick={() => toggleStatut(plan.id)}
                  icon={plan.statut === 'actif' ? '⏸️' : '▶️'}
                  label={plan.statut === 'actif' ? 'Désactiver' : 'Activer'}
                  color={plan.statut === 'actif' ? THEME.warning : THEME.success}
                />
                <MenuItem 
                  onClick={() => toggleRecommande(plan.id)}
                  icon="⭐"
                  label={plan.recommande ? 'Retirer "Populaire"' : 'Marquer "Populaire"'}
                  color={THEME.accent}
                />
                <MenuItem 
                  onClick={() => toggleVisible(plan.id)}
                  icon="👁️"
                  label={plan.visibleVendeur ? 'Masquer des vendeurs' : 'Montrer aux vendeurs'}
                  color={THEME.textLight}
                />
                <div style={{ height: '1px', backgroundColor: THEME.border, margin: '4px 0' }} />
                <MenuItem 
                  onClick={() => demanderSuppression(plan)}
                  icon="🗑️"
                  label="Supprimer ce plan"
                  color={THEME.danger}
                  danger
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Note */}
      <div style={{ 
        backgroundColor: THEME.accentLight, 
        borderRadius: '8px', 
        padding: '12px 16px', 
        border: `1px solid ${THEME.accent}40`, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px' 
      }}>
        <span>ℹ️</span>
        <p style={{ fontSize: '12px', color: THEME.accent, margin: 0, fontWeight: '600' }}>
          Prix HT. TPS 5% + TVQ 9,975% + TVH 15% calculées automatiquement.
        </p>
      </div>

      {/* Modal suppression */}
      {modalSupprimerOuvert && planASupprimer && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          zIndex: 10000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '20px' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            width: '100%', 
            maxWidth: '420px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              padding: '20px 24px', 
              backgroundColor: '#fee2e2', 
              borderBottom: `2px solid ${THEME.danger}` 
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#991b1b' }}>
                🗑️ Supprimer ce plan
              </h3>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                Cette action est irréversible
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: '10px', 
                padding: '14px 18px', 
                marginBottom: '16px', 
                border: `1px solid ${THEME.border}` 
              }}>
                <p style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text }}>
                  {planASupprimer.emoji} {planASupprimer.nom}
                </p>
                <p style={{ fontSize: '12px', color: THEME.textLight, margin: 0 }}>
                  ID: {planASupprimer.id}
                </p>
              </div>
              <p style={{ fontSize: '13px', color: THEME.text, margin: '0 0 20px 0' }}>
                Voulez-vous vraiment supprimer <strong>{planASupprimer.nom}</strong> ?
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setModalSupprimerOuvert(false)} 
                  style={{ 
                    padding: '10px 20px', 
                    border: `1px solid ${THEME.border}`, 
                    borderRadius: '8px', 
                    backgroundColor: 'white', 
                    color: THEME.text, 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    cursor: 'pointer' 
                  }}
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmerSuppression} 
                  style={{ 
                    padding: '10px 20px', 
                    border: 'none', 
                    borderRadius: '8px', 
                    backgroundColor: THEME.danger, 
                    color: 'white', 
                    fontSize: '13px', 
                    fontWeight: '700', 
                    cursor: 'pointer' 
                  }}
                >
                  🗑️ Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant helper pour les items du menu
function MenuItem({ onClick, icon, label, color = '#1a2332', danger = false }: { 
  onClick: () => void; 
  icon: string; 
  label: string; 
  color?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        width: '100%', 
        padding: '11px 16px', 
        border: 'none', 
        background: 'none', 
        cursor: 'pointer', 
        fontSize: '13px', 
        color: color, 
        fontWeight: '600', 
        textAlign: 'left',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = danger ? '#fee2e2' : '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span> {label}
    </button>
  );
}
