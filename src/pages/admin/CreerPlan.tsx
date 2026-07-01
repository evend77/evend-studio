import React, { useState } from 'react';
import { FONCTIONNALITES_MASTER } from '../../shared/plansData';
import { log } from '../../services/logger';

const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a', warning: '#d97706',
};

const EMOJIS_PLAN = ['🌱', '🥉', '🥈', '🥇', '🚀', '👑', '💎', '⭐', '🔥', '🌟'];

// Fonction de calcul des taxes (gardée car utilisée dans le formulaire)
function calculerTTC(ht: number) {
  const tps = ht * 0.05;
  const tvq = ht * 0.09975;
  const tvh = ht * 0.15;
  const ttc = ht + tps + tvq;
  return { tps, tvq, tvh, ttc };
}

interface PlanFormData {
  nom: string;
  emoji: string;
  typeAbonnement: 'mensuel' | 'annuel';
  prixHT: string;
  limiterProduits: boolean;
  limiteProduits: string;
  joursEssai: string;
  visibleVendeur: boolean;
  position: string;
  recommande: boolean;
  commissionActive: boolean;
  commission: string;
  infoSupplementaire: string;
  fraisActivationActif: boolean;
  fraisActivation: string;
  chargerFraisSur: string;
  assignerVendeurs: boolean;
  emailsVendeurs: string;
  fonctionnalites: { [key: string]: boolean };
}

const defaultFonctionnalites = () =>
  Object.fromEntries(FONCTIONNALITES_MASTER.map(f =>
    [f.key, ['tableauBord', 'gestionCommandes', 'gestionRetours', 'paiementsStripePaypal', 'modeVacances'].includes(f.key)]
  ));

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
}

interface CreerPlanProps {
  naviguerVers: (page: string, data?: any) => void;
  planAEditer?: Plan;
}

export default function CreerPlan({ naviguerVers, planAEditer }: CreerPlanProps) {
  const estEdition = !!planAEditer;

  // Initialiser le formulaire depuis le plan existant si édition
  const initFonctionnalites = () => {
    if (!planAEditer) return defaultFonctionnalites();
    return planAEditer.fonctionnalites;
  };

  const [form, setForm] = useState<PlanFormData>({
    nom: planAEditer?.nom ?? '',
    emoji: planAEditer?.emoji ?? '⭐',
    typeAbonnement: (planAEditer?.typeAbonnement as 'mensuel' | 'annuel') ?? 'mensuel',
    prixHT: planAEditer?.prixHT?.toString() ?? '',
    limiterProduits: planAEditer ? planAEditer.limiteProduits !== null : false,
    limiteProduits: planAEditer?.limiteProduits?.toString() ?? '',
    joursEssai: planAEditer?.joursEssai?.toString() ?? '10',
    visibleVendeur: planAEditer?.visibleVendeur ?? true,
    position: planAEditer?.position?.toString() ?? '',
    recommande: planAEditer?.recommande ?? false,
    commissionActive: planAEditer?.commissionActive ?? false,
    commission: planAEditer?.commission?.toString() ?? '',
    infoSupplementaire: planAEditer?.infoSupplementaire ?? '',
    fraisActivationActif: planAEditer?.fraisActivationActif ?? false,
    fraisActivation: planAEditer?.fraisActivationHT?.toString() ?? '0',
    chargerFraisSur: planAEditer?.chargerFraisSur ?? 'nouvelle_inscription',
    assignerVendeurs: planAEditer?.assignerVendeurs ?? false,
    emailsVendeurs: planAEditer?.emailsVendeurs ?? '',
    fonctionnalites: initFonctionnalites(),
  });

  const [sauvegardeReussie, setSauvegardeReussie] = useState(false);
  const [erreurs, setErreurs] = useState<{ [key: string]: string }>({});

  const set = (key: keyof PlanFormData, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (erreurs[key]) setErreurs(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const toggleFonctionnalite = (key: string) => {
    setForm(prev => ({ ...prev, fonctionnalites: { ...prev.fonctionnalites, [key]: !prev.fonctionnalites[key] } }));
  };

  const toggleGroupe = (groupe: string, valeur: boolean) => {
    const keys = FONCTIONNALITES_MASTER.filter(f => f.groupe === groupe).map(f => f.key);
    setForm(prev => ({ ...prev, fonctionnalites: { ...prev.fonctionnalites, ...Object.fromEntries(keys.map(k => [k, valeur])) } }));
  };

  const valider = () => {
    const e: { [key: string]: string } = {};
    if (!form.nom.trim()) e.nom = 'Le nom du plan est requis';
    if (form.prixHT === '') e.prixHT = 'Le prix est requis';
    if (parseFloat(form.prixHT) < 0) e.prixHT = 'Le prix ne peut pas être négatif';
    if (!form.joursEssai || parseInt(form.joursEssai) < 0) e.joursEssai = "Les jours d'essai doivent être >= 0";
    if (form.limiterProduits && (!form.limiteProduits || parseInt(form.limiteProduits) <= 0)) e.limiteProduits = 'Entrez un nombre de produits valide';
    if (form.commissionActive && (form.commission === '' || parseFloat(form.commission) < 0 || parseFloat(form.commission) > 100)) e.commission = 'La commission doit être entre 0 et 100';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const sauvegarder = async () => {
    if (!valider()) return;

    const prixHT = parseFloat(form.prixHT) || 0;
    const { tps, tvq, tvh, ttc } = calculerTTC(prixHT);
    const fraisHT = form.fraisActivationActif ? (parseFloat(form.fraisActivation) || 0) : 0;
    const fraisTaxes = calculerTTC(fraisHT);
    const limiteProduits = form.limiterProduits ? parseInt(form.limiteProduits) : null;

    // Préparer les données pour PostgreSQL
    const planData = {
      nom: form.nom,
      emoji: form.emoji,
      type_abonnement: form.typeAbonnement,
      prix_ht: prixHT,
      tps: tps,
      tvq: tvq,
      tvh: tvh,
      limiter_produits: form.limiterProduits,
      limite_produits: limiteProduits,
      jours_essai: parseInt(form.joursEssai) || 0,
      visible_vendeur: form.visibleVendeur,
      position: parseInt(form.position) || 99,
      recommande: form.recommande,
      commission_active: form.commissionActive,
      commission: parseFloat(form.commission) || 0,
      info_supplementaire: form.infoSupplementaire,
      frais_activation_actif: form.fraisActivationActif,
      frais_activation_ht: fraisHT,
      frais_activation_tps: fraisTaxes.tps,
      frais_activation_tvq: fraisTaxes.tvq,
      frais_activation_tvh: fraisTaxes.tvh,
      charger_frais_sur: form.chargerFraisSur,
      assigner_vendeurs: form.assignerVendeurs,
      emails_vendeurs: form.emailsVendeurs,
      couleur_banniere: 'linear-gradient(135deg, #537373 0%, #2c4a4a 100%)',
      couleur_carte: '#f0f5f5',
      description: form.infoSupplementaire || `Plan ${form.nom}`,
      fonctionnalites: form.fonctionnalites
    };

    try {
      let response;
      if (estEdition && planAEditer) {
        // MODIFICATION : PUT /api/plans/:id
        response = await fetch(`https://evend-multivendeur-api.onrender.com/api/plans/${planAEditer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData)
        });
      } else {
        // CRÉATION : POST /api/plans
        response = await fetch('https://evend-multivendeur-api.onrender.com/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData)
        });
      }

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      console.log('Plan sauvegardé:', data);

      // ✅ LOG DE SUCCÈS
      if (estEdition) {
        log.succes('Plan modifié', `Plan ${form.nom} modifié avec succès`, 'admin');
      } else {
        log.succes('Plan créé', `Plan ${form.nom} créé avec succès`, 'admin');
      }

      setSauvegardeReussie(true);
      setTimeout(() => naviguerVers('forfaits-liste'), 1500);
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      
      // ✅ LOG D'ERREUR
      log.erreur('Erreur création plan', err instanceof Error ? err.message : 'Erreur inconnue', { 
        plan: form.nom,
        action: estEdition ? 'modification' : 'création'
      });
      
      alert('Erreur lors de la sauvegarde du plan');
    }
  };

  const prix = calculerTTC(parseFloat(form.prixHT) || 0);
  const nbFonctActives = Object.values(form.fonctionnalites).filter(Boolean).length;
  const groupes = FONCTIONNALITES_MASTER.map(f => f.groupe).filter((g, i, arr) => arr.indexOf(g) === i);

  const inputStyle = (erreur?: string): React.CSSProperties => ({
    border: `1px solid ${erreur ? THEME.danger : THEME.border}`,
    borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
    outline: 'none', backgroundColor: 'white',
    width: '100%', boxSizing: 'border-box' as const,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: '700', color: THEME.accent,
    display: 'block', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: THEME.card, borderRadius: '12px',
    border: `1px solid ${THEME.border}`, overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '20px',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '14px 22px', backgroundColor: '#f8fafc',
    borderBottom: `2px solid ${THEME.accent}`,
    display: 'flex', alignItems: 'center', gap: '8px',
  };

  const Toggle = ({ actif, onChange }: { actif: boolean; onChange: (v: boolean) => void }) => (
    <div onClick={() => onChange(!actif)} style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', backgroundColor: actif ? THEME.accent : '#d1d5db', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: actif ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );

  if (sauvegardeReussie) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: THEME.text, margin: '0 0 8px 0' }}>
            Plan {estEdition ? 'modifié' : 'créé'} avec succès !
          </h2>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Sauvegardé — retour à la liste des plans...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '960px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

      {/* Fil d'Ariane + titre */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <button onClick={() => naviguerVers('forfaits-liste')} style={{ background: 'none', border: 'none', fontSize: '12px', color: THEME.accent, cursor: 'pointer', fontWeight: '600', padding: 0 }}>
            Forfaits & Plans
          </button>
          <span style={{ color: '#aaa', fontSize: '12px' }}>›</span>
          <span style={{ fontSize: '12px', color: THEME.textLight }}>{estEdition ? `Modifier — ${planAEditer!.nom}` : 'Créer un nouveau plan'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {estEdition ? `✏️ Modifier ${planAEditer!.nom}` : '＋ Créer un nouveau plan'}
            </h1>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
              Les modifications sont sauvegardées dans PostgreSQL et visibles immédiatement côté vendeur.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => naviguerVers('forfaits-liste')} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
            <button onClick={sauvegarder} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(45,106,159,0.3)' }}>
              {estEdition ? '💾 Enregistrer' : '✅ Créer le plan'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: '20px', alignItems: 'start' }}>

        {/* ── COLONNE PRINCIPALE ── */}
        <div>

          {/* Section 1 — Infos de base */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>📋</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informations de base</h3>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Nom + Emoji */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Nom du plan *</label>
                  <input type="text" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="ex: Plan Or" style={inputStyle(erreurs.nom)} />
                  {erreurs.nom && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.nom}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Icône</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                    {EMOJIS_PLAN.map(e => (
                      <button key={e} onClick={() => set('emoji', e)} style={{ fontSize: '20px', padding: '6px', borderRadius: '6px', border: `2px solid ${form.emoji === e ? THEME.accent : THEME.border}`, backgroundColor: form.emoji === e ? THEME.accentLight : 'white', cursor: 'pointer', lineHeight: 1 }}>{e}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Type abonnement */}
              <div>
                <label style={labelStyle}>Type d'abonnement *</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[{ val: 'mensuel', label: '📅 Mensuel' }, { val: 'annuel', label: '📆 Annuel' }].map(t => (
                    <label key={t.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', border: `2px solid ${form.typeAbonnement === t.val ? THEME.accent : THEME.border}`, backgroundColor: form.typeAbonnement === t.val ? THEME.accentLight : 'white', flex: 1 }}>
                      <input type="radio" name="abonnement" value={t.val} checked={form.typeAbonnement === t.val} onChange={() => set('typeAbonnement', t.val)} style={{ accentColor: THEME.accent }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: form.typeAbonnement === t.val ? THEME.accent : THEME.text }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div>
                <label style={labelStyle}>Prix HT (avant taxes) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: THEME.textLight, fontWeight: '700' }}>$</span>
                  <input type="number" min="0" step="0.01" value={form.prixHT} onChange={e => set('prixHT', e.target.value)} placeholder="0.00" style={{ ...inputStyle(erreurs.prixHT), paddingLeft: '28px' }} />
                </div>
                {erreurs.prixHT && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.prixHT}</p>}
                {form.prixHT && parseFloat(form.prixHT) > 0 && (
                  <div style={{ marginTop: '8px', backgroundColor: THEME.accentLight, borderRadius: '6px', padding: '8px 12px', fontSize: '11px', color: THEME.accent, fontWeight: '600' }}>
                    Prix TTC : {(prix.ttc).toFixed(2)} $ · TPS {prix.tps.toFixed(2)} $ · TVQ {prix.tvq.toFixed(2)} $ · TVH {prix.tvh.toFixed(2)} $
                  </div>
                )}
              </div>

              {/* Limiter produits */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Limiter le nombre de produits</label>
                  <Toggle actif={form.limiterProduits} onChange={v => set('limiterProduits', v)} />
                </div>
                {form.limiterProduits ? (
                  <div>
                    <input type="number" min="1" value={form.limiteProduits} onChange={e => set('limiteProduits', e.target.value)} placeholder="ex: 100" style={inputStyle(erreurs.limiteProduits)} />
                    {erreurs.limiteProduits && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.limiteProduits}</p>}
                  </div>
                ) : <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Désactivé = produits illimités</p>}
              </div>

              {/* Jours essai + Position */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Jours d'essai *</label>
                  <input type="number" min="0" value={form.joursEssai} onChange={e => set('joursEssai', e.target.value)} placeholder="10" style={inputStyle(erreurs.joursEssai)} />
                  {erreurs.joursEssai && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.joursEssai}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Position d'affichage</label>
                  <input type="number" min="1" value={form.position} onChange={e => set('position', e.target.value)} placeholder="ex: 3" style={inputStyle()} />
                </div>
              </div>

              {/* Toggles visibilité + recommandé */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Visible par les vendeurs', desc: 'Affiché dans la page des forfaits', key: 'visibleVendeur' },
                  { label: '⭐ Marquer comme "Populaire"', desc: 'Affiche un badge recommandé sur ce plan', key: 'recommande' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>{item.desc}</p>
                    </div>
                    <Toggle actif={(form as any)[item.key]} onChange={v => set(item.key as keyof PlanFormData, v)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2 — Fonctionnalités */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>⚙️</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>Fonctionnalités incluses</h3>
              <span style={{ fontSize: '12px', backgroundColor: THEME.accent, color: 'white', borderRadius: '20px', padding: '2px 10px', fontWeight: '700' }}>{nbFonctActives} / {FONCTIONNALITES_MASTER.length}</span>
            </div>
            <div style={{ padding: '16px 22px' }}>
              {groupes.map(groupe => {
                const foncts = FONCTIONNALITES_MASTER.filter(f => f.groupe === groupe);
                const toutActif = foncts.every(f => form.fonctionnalites[f.key]);
                const aucunActif = foncts.every(f => !form.fonctionnalites[f.key]);
                return (
                  <div key={groupe} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${THEME.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {groupe === 'Base' ? '🧱' : groupe === 'Contenu' ? '📄' : groupe === 'Avancé' ? '🔧' : '⭐'} {groupe}
                        </span>
                        <span style={{ fontSize: '10px', color: '#aaa' }}>({foncts.filter(f => form.fonctionnalites[f.key]).length}/{foncts.length})</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => toggleGroupe(groupe, true)} disabled={toutActif} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', border: `1px solid ${THEME.accent}`, backgroundColor: toutActif ? '#f0f0f0' : THEME.accentLight, color: toutActif ? '#aaa' : THEME.accent, cursor: toutActif ? 'default' : 'pointer', fontWeight: '600' }}>Tout activer</button>
                        <button onClick={() => toggleGroupe(groupe, false)} disabled={aucunActif} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '5px', border: `1px solid ${THEME.border}`, backgroundColor: aucunActif ? '#f0f0f0' : 'white', color: aucunActif ? '#aaa' : THEME.textLight, cursor: aucunActif ? 'default' : 'pointer', fontWeight: '600' }}>Tout désactiver</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {foncts.map(f => {
                        const actif = form.fonctionnalites[f.key];
                        return (
                          <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: actif ? THEME.accentLight : '#fafafa', border: `1px solid ${actif ? THEME.accent + '40' : THEME.border}`, transition: 'all 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                              <span style={{ fontSize: '18px', marginTop: '1px', flexShrink: 0 }}>{f.icon}</span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <p style={{ fontSize: '13px', fontWeight: '700', color: actif ? THEME.text : THEME.textLight, margin: 0 }}>{f.label}</p>
                                  {f.key === 'codesPromo' && <span style={{ fontSize: '10px', backgroundColor: '#fef9c3', color: '#92400e', border: '1px solid #d97706', borderRadius: '10px', padding: '1px 7px', fontWeight: '700' }}>PayPal uniquement</span>}
                                </div>
                                <p style={{ fontSize: '11px', color: '#aaa', margin: '2px 0 0 0', lineHeight: '1.4' }}>
                                  {f.key === 'codesPromo' ? 'Stripe Connect ne supporte pas les codes promo' : `Inclure la fonctionnalité "${f.label}" dans ce plan`}
                                </p>
                              </div>
                            </div>
                            <Toggle actif={actif} onChange={() => toggleFonctionnalite(f.key)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3 — Commission */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>💰</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Commission</h3>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>Commission par plan d'adhésion</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>Définir une commission spécifique pour ce plan</p>
                </div>
                <Toggle actif={form.commissionActive} onChange={v => set('commissionActive', v)} />
              </div>
              {form.commissionActive && (
                <div>
                  <label style={labelStyle}>Taux de commission (%)</label>
                  <div style={{ position: 'relative', maxWidth: '200px' }}>
                    <input type="number" min="0" max="100" step="0.1" value={form.commission} onChange={e => set('commission', e.target.value)} placeholder="ex: 10" style={inputStyle(erreurs.commission)} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: THEME.textLight }}>%</span>
                  </div>
                  {erreurs.commission && <p style={{ fontSize: '11px', color: THEME.danger, margin: '4px 0 0 0' }}>{erreurs.commission}</p>}
                  <div style={{ marginTop: '8px', backgroundColor: '#fef9c3', borderRadius: '6px', padding: '8px 12px', border: '1px solid #d97706' }}>
                    <p style={{ fontSize: '11px', color: '#92400e', margin: 0, fontWeight: '600' }}>⚠️ Le nouveau taux s'applique aux produits ajoutés après ce changement.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4 — Frais d'activation */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>🔑</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Frais d'activation (unique)</h3>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>Activer les frais d'inscription unique</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>Frais facturés une seule fois à l'inscription</p>
                </div>
                <Toggle actif={form.fraisActivationActif} onChange={v => set('fraisActivationActif', v)} />
              </div>
              {form.fraisActivationActif && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Montant HT ($)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: THEME.textLight, fontWeight: '700' }}>$</span>
                      <input type="number" min="0" step="0.01" value={form.fraisActivation} onChange={e => set('fraisActivation', e.target.value)} placeholder="0.00" style={{ ...inputStyle(), paddingLeft: '28px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Facturer lors de</label>
                    <select value={form.chargerFraisSur} onChange={e => set('chargerFraisSur', e.target.value)} style={{ ...inputStyle(), appearance: 'none' as const }}>
                      <option value="nouvelle_inscription">Nouvelle inscription</option>
                      <option value="renouvellement">Renouvellement</option>
                      <option value="les_deux">Les deux</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5 — Assigner vendeurs */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>👥</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigner à des vendeurs spécifiques</h3>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>Restreindre à certains vendeurs</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>Ce plan sera uniquement disponible pour les vendeurs spécifiés</p>
                </div>
                <Toggle actif={form.assignerVendeurs} onChange={v => set('assignerVendeurs', v)} />
              </div>
              {form.assignerVendeurs && (
                <div>
                  <label style={labelStyle}>Courriels des vendeurs (un par ligne)</label>
                  <textarea value={form.emailsVendeurs} onChange={e => set('emailsVendeurs', e.target.value)} placeholder={"vendeur1@example.com\nvendeur2@example.com"} rows={4} style={{ ...inputStyle(), resize: 'vertical' as const, fontFamily: 'monospace' }} />
                </div>
              )}
            </div>
          </div>

          {/* Section 6 — Description */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>📝</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description du plan</h3>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <label style={labelStyle}>Description affichée aux vendeurs</label>
              <textarea value={form.infoSupplementaire} onChange={e => set('infoSupplementaire', e.target.value)} placeholder="Décrivez les avantages de ce plan..." rows={4} style={{ ...inputStyle(), resize: 'vertical' as const }} />
            </div>
          </div>

          {/* Boutons bas */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingBottom: '40px' }}>
            <button onClick={() => naviguerVers('forfaits-liste')} style={{ backgroundColor: 'white', color: THEME.textLight, border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '11px 22px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
            <button onClick={sauvegarder} style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(45,106,159,0.3)' }}>
              {estEdition ? '💾 Enregistrer les modifications' : '✅ Créer le plan'}
            </button>
          </div>
        </div>

        {/* ── COLONNE DROITE — Aperçu ── */}
        <div style={{ position: 'sticky', top: '76px' }}>
          <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👁️</span>
              <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aperçu en direct</h3>
            </div>
            <div style={{ padding: '18px' }}>
              <div style={{ border: `2px solid ${THEME.accent}`, borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: THEME.accentLight, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '22px' }}>{form.emoji}</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: THEME.text }}>{form.nom || 'Nom du plan'}</h4>
                    {form.recommande && <span style={{ fontSize: '10px', backgroundColor: '#fef9c3', color: '#92400e', border: '1px solid #d97706', borderRadius: '10px', padding: '2px 7px', fontWeight: '700' }}>⭐ Populaire</span>}
                  </div>
                  <p style={{ fontSize: '26px', fontWeight: '900', color: THEME.text, margin: '0 0 2px 0', lineHeight: 1 }}>
                    {form.prixHT === '' || parseFloat(form.prixHT) === 0 ? 'Gratuit' : `${prix.ttc.toFixed(2).replace('.', ',')} $`}
                  </p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '0 0 4px 0' }}>/{form.typeAbonnement === 'mensuel' ? 'mois' : 'an'} TTC</p>
                  {form.prixHT && parseFloat(form.prixHT) > 0 && (
                    <p style={{ fontSize: '10px', color: '#aaa', margin: 0 }}>TPS {prix.tps.toFixed(2)} $ · TVQ {prix.tvq.toFixed(2)} $ · TVH {prix.tvh.toFixed(2)} $</p>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    {[
                      { label: 'Produits', val: form.limiterProduits ? (form.limiteProduits || '—') : '∞' },
                      { label: 'Commission', val: form.commissionActive ? `${form.commission || '—'}%` : '—' },
                      { label: 'Essai', val: `${form.joursEssai || '0'}j` },
                    ].map(item => (
                      <div key={item.label}>
                        <p style={{ fontSize: '10px', color: '#aaa', margin: '0 0 2px 0', textTransform: 'uppercase', fontWeight: '700' }}>{item.label}</p>
                        <p style={{ fontSize: '14px', fontWeight: '800', color: THEME.text, margin: 0 }}>{item.val}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '10px' }}>
                    <p style={{ fontSize: '10px', color: '#aaa', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                      {nbFonctActives} fonctionnalité{nbFonctActives > 1 ? 's' : ''} incluse{nbFonctActives > 1 ? 's' : ''}
                    </p>
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                      {FONCTIONNALITES_MASTER.map(f => (
                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
                          <span style={{ fontSize: '11px', color: form.fonctionnalites[f.key] ? THEME.success : '#ddd', flexShrink: 0 }}>{form.fonctionnalites[f.key] ? '✅' : '✗'}</span>
                          <span style={{ fontSize: '11px', color: form.fonctionnalites[f.key] ? THEME.text : '#bbb' }}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé */}
          <div style={{ backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>Résumé</p>
            {[
              { label: 'Visible vendeurs', val: form.visibleVendeur ? '✅ Oui' : '❌ Non' },
              { label: 'Populaire', val: form.recommande ? '⭐ Oui' : '—' },
              { label: 'Frais activation', val: form.fraisActivationActif ? `${form.fraisActivation} $ HT` : '—' },
              { label: 'Vendeurs spécifiques', val: form.assignerVendeurs ? '✅ Restreint' : '🌐 Tous' },
              { label: 'Fonctionnalités', val: `${nbFonctActives} / ${FONCTIONNALITES_MASTER.length}` },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none' }}>
                <span style={{ fontSize: '12px', color: THEME.textLight }}>{r.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: THEME.text }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
