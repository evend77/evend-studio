import React, { useState, useEffect } from 'react';
import type { AbonnementVendeur } from './AbonnementsActifs';
import { FONCTIONNALITES_MASTER } from '../../shared/plansData';

const API = 'https://evend-multivendeur-api.onrender.com';

// ── Thème ─────────────────────────────────────────────────────────────────────
const THEME = {
  accent: '#2d6a9f', accentLight: '#e8f2fb', accentHover: '#245a8a',
  bg: '#f0f2f5', card: '#ffffff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626', purple: '#7c3aed',
};

const EMOJIS_PLAN = ['🌱','🥉','🥈','🥇','🚀','👑','💎','⭐','🔥','🌟'];

function calculerTTC(ht: number) {
  const tps = ht * 0.05;
  const tvq = ht * 0.09975;
  const tvh = ht * 0.15;
  return { tps, tvq, tvh, ttc: ht + tps + tvq };
}

function fmtMoney(n: number | string | undefined | null) {
  if (n === undefined || n === null) return 'Gratuit';
  const prix = typeof n === 'string' ? parseFloat(n) || 0 : n;
  return prix === 0 ? 'Gratuit' : prix.toFixed(2).replace('.', ',') + ' $';
}

const Toggle = ({ actif, onChange }: { actif: boolean; onChange: (v: boolean) => void }) => (
  <div onClick={() => onChange(!actif)} style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', backgroundColor: actif ? THEME.accent : '#d1d5db', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: '3px', left: actif ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
  </div>
);

function PlanBadge({ type, nom }: { type: string; nom: string }) {
  const styles: Record<string, React.CSSProperties> = {
    free:   { backgroundColor: '#f3f4f6', color: '#6b7280' },
    silver: { backgroundColor: '#f1f5f9', color: '#475569' },
    gold:   { backgroundColor: '#fef9c3', color: '#92400e' },
    custom: { backgroundColor: '#f3e8ff', color: '#7c3aed' },
  };
  const icons: Record<string, string> = { free: '🆓', silver: '🥈', gold: '🥇', custom: '⭐' };
  return (
    <span style={{ ...styles[type] || styles.free, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
      {icons[type] || '📦'} {nom}
    </span>
  );
}

// ── Modal Désactivation ───────────────────────────────────────────────────────
function ModalDesactivation({ vendeur, onConfirm, onCancel }: { vendeur: AbonnementVendeur; onConfirm: () => void; onCancel: () => void }) {
  const [confirmation, setConfirmation] = useState('');
  const mot = 'DÉSACTIVER';
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px 32px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: THEME.danger, margin: '0 0 6px 0' }}>Désactiver l'abonnement</h2>
          <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
            Vous êtes sur le point de désactiver le plan de <strong>{vendeur.nomBoutique}</strong>.
          </p>
        </div>
        <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: THEME.danger, margin: '0 0 6px 0', fontWeight: '700' }}>⚠️ Conséquences immédiates :</p>
          <ul style={{ fontSize: '12px', color: '#7f1d1d', margin: 0, paddingLeft: '16px', lineHeight: '1.8' }}>
            <li>Le vendeur perd l'accès aux fonctionnalités de son plan</li>
            <li>Ses produits restent visibles mais non modifiables</li>
            <li>Aucun remboursement automatique n'est effectué</li>
          </ul>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: THEME.textLight, marginBottom: '6px' }}>
            Tapez <strong style={{ color: THEME.danger }}>{mot}</strong> pour confirmer :
          </p>
          <input type="text" value={confirmation} onChange={e => setConfirmation(e.target.value.toUpperCase())} placeholder={mot}
            style={{ width: '100%', border: `2px solid ${confirmation === mot ? THEME.success : THEME.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' as const, letterSpacing: '1px' }} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
          <button onClick={onConfirm} disabled={confirmation !== mot}
            style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: confirmation === mot ? THEME.danger : '#fca5a5', color: 'white', fontSize: '13px', fontWeight: '700', cursor: confirmation === mot ? 'pointer' : 'not-allowed' }}>
            🚫 Désactiver
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Changer Plan ────────────────────────────────────────────────────────
function ModalChangerPlan({ vendeur, plans, onConfirm, onCancel }: { vendeur: AbonnementVendeur; plans: any[]; onConfirm: (planId: string) => void; onCancel: () => void }) {
  const [planChoisi, setPlanChoisi] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px 32px', maxWidth: '560px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' as const }}>
        <h2 style={{ fontSize: '18px', fontWeight: '900', color: THEME.text, margin: '0 0 4px 0' }}>🔄 Changer le plan</h2>
        <p style={{ fontSize: '13px', color: THEME.textLight, margin: '0 0 20px 0' }}>
          Vendeur : <strong>{vendeur.nomBoutique}</strong> — Plan actuel : <strong>{vendeur.plan}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '20px' }}>
          {plans.map(p => (
            <div key={p.id} onClick={() => setPlanChoisi(p.id)}
              style={{ border: `2px solid ${planChoisi === p.id ? THEME.accent : THEME.border}`, borderRadius: '10px', padding: '14px 16px', cursor: 'pointer', backgroundColor: planChoisi === p.id ? THEME.accentLight : 'white', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="radio" checked={planChoisi === p.id} onChange={() => setPlanChoisi(p.id)} style={{ accentColor: THEME.accent }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: THEME.text, margin: 0 }}>{p.emoji} {p.nom}</p>
                    <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>
                      Produits : {p.limite_produits === null ? 'Illimité' : p.limite_produits} · Commission : {p.commission}%
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '900', color: Number(p.prix_ht) === 0 ? THEME.success : THEME.text, margin: 0 }}>
                  {Number(p.prix_ht) === 0 ? 'Gratuit' : fmtMoney(p.prix_ht) + '/mois'}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
          <button onClick={() => planChoisi && onConfirm(planChoisi)} disabled={!planChoisi}
            style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '8px', backgroundColor: planChoisi ? THEME.accent : '#93c5fd', color: 'white', fontSize: '13px', fontWeight: '700', cursor: planChoisi ? 'pointer' : 'not-allowed' }}>
            ✅ Appliquer ce plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Plan Sur Mesure COMPLET ─────────────────────────────────────────────
function ModalPlanSurMesure({ vendeur, onConfirm, onCancel }: { vendeur: AbonnementVendeur; onConfirm: (planData: any) => void; onCancel: () => void }) {
  const defaultFonctionnalites = () =>
    Object.fromEntries(FONCTIONNALITES_MASTER.map(f =>
      [f.key, ['tableauBord', 'gestionCommandes', 'gestionRetours', 'paiementsStripePaypal', 'modeVacances'].includes(f.key)]
    ));

  const [form, setForm] = useState({
    nom: `Plan Custom — ${vendeur.nomBoutique || 'Vendeur'}`,
    emoji: '⭐',
    typeAbonnement: 'mensuel' as 'mensuel' | 'annuel',
    prixHT: '0',
    limiterProduits: false,
    limiteProduits: '',
    joursEssai: '0',
    commissionActive: false,
    commission: '',
    fraisActivationActif: false,
    fraisActivation: '0',
    chargerFraisSur: 'nouvelle_inscription',
    infoSupplementaire: '',
    fonctionnalites: defaultFonctionnalites(),
  });

  const [saving, setSaving] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleFonct = (key: string) => setForm(prev => ({ ...prev, fonctionnalites: { ...prev.fonctionnalites, [key]: !prev.fonctionnalites[key] } }));
  const toggleGroupe = (groupe: string, val: boolean) => {
    const keys = FONCTIONNALITES_MASTER.filter(f => f.groupe === groupe).map(f => f.key);
    setForm(prev => ({ ...prev, fonctionnalites: { ...prev.fonctionnalites, ...Object.fromEntries(keys.map(k => [k, val])) } }));
  };

  const prix = calculerTTC(parseFloat(form.prixHT) || 0);
  const groupes = FONCTIONNALITES_MASTER.map(f => f.groupe).filter((g, i, arr) => arr.indexOf(g) === i);
  const nbFonctActives = Object.values(form.fonctionnalites).filter(Boolean).length;

  const inputStyle: React.CSSProperties = { border: `1px solid ${THEME.border}`, borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' as const, backgroundColor: 'white' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: '700', color: THEME.accent, display: 'block', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
  const sectionStyle: React.CSSProperties = { backgroundColor: '#fafafa', borderRadius: '10px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginBottom: '14px' };
  const sectionHeaderStyle: React.CSSProperties = { padding: '11px 16px', backgroundColor: '#f0f4f8', borderBottom: `2px solid ${THEME.accent}`, display: 'flex', alignItems: 'center', gap: '8px' };

  const valider = () => {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = 'Nom requis';
    if (form.prixHT === '') e.prixHT = 'Prix requis';
    if (form.limiterProduits && (!form.limiteProduits || parseInt(form.limiteProduits) <= 0)) e.limiteProduits = 'Limite invalide';
    if (form.commissionActive && (form.commission === '' || parseFloat(form.commission) < 0 || parseFloat(form.commission) > 100)) e.commission = 'Commission 0-100%';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const sauvegarder = async () => {
    if (!valider()) return;
    setSaving(true);
    const prixHT = parseFloat(form.prixHT) || 0;
    const { tps, tvq, tvh } = calculerTTC(prixHT);
    const fraisHT = form.fraisActivationActif ? (parseFloat(form.fraisActivation) || 0) : 0;
    const fraisTaxes = calculerTTC(fraisHT);

    const planData = {
      nom: form.nom,
      emoji: form.emoji,
      type_abonnement: form.typeAbonnement,
      prix_ht: prixHT,
      tps, tvq, tvh,
      limiter_produits: form.limiterProduits,
      limite_produits: form.limiterProduits ? parseInt(form.limiteProduits) : null,
      jours_essai: parseInt(form.joursEssai) || 0,
      visible_vendeur: false, // plan custom = pas visible publiquement
      position: 99,
      recommande: false,
      commission_active: form.commissionActive,
      commission: parseFloat(form.commission) || 0,
      info_supplementaire: form.infoSupplementaire,
      frais_activation_actif: form.fraisActivationActif,
      frais_activation_ht: fraisHT,
      frais_activation_tps: fraisTaxes.tps,
      frais_activation_tvq: fraisTaxes.tvq,
      frais_activation_tvh: fraisTaxes.tvh,
      charger_frais_sur: form.chargerFraisSur,
      assigner_vendeurs: true,
      emails_vendeurs: vendeur.email,
      couleur_banniere: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
      couleur_carte: '#f5f0ff',
      description: form.infoSupplementaire || `Plan custom pour ${vendeur.nomBoutique}`,
      fonctionnalites: form.fonctionnalites,
      statut: 'actif',
    };

    try {
      // 1. Créer le plan dans plans
      const resPlan = await fetch(`${API}/api/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });
      if (!resPlan.ok) throw new Error('Erreur création plan');
      const planCree = await resPlan.json();

      // 2. Mettre à jour vendeurs.plan
      await fetch(`${API}/api/vendeurs/${vendeur.sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: form.nom }),
      });

      // 3. Mettre à jour abonnements
      await fetch(`${API}/api/abonnements/${vendeur.sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: form.nom, statut: 'actif' }),
      }).catch(() => {}); // pas bloquant si cette route n'existe pas encore

      onConfirm({ ...planData, id: planCree.id });
    } catch (err) {
      console.error('Erreur sauvegarde plan custom:', err);
      alert('Erreur lors de la sauvegarde du plan sur mesure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '760px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>

        {/* En-tête modal */}
        <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>⭐</span>
              <h2 style={{ fontSize: '17px', fontWeight: '900', color: 'white', margin: 0 }}>Plan sur mesure</h2>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: '2px 0 0 0' }}>
              Plan confidentiel pour <strong style={{ color: 'white' }}>{vendeur.nomBoutique}</strong> · Non visible publiquement
            </p>
          </div>
          <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>

          {/* Section 1 — Infos de base */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>📋</span>
              <h3 style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Informations de base</h3>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>

              {/* Nom + Emoji */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Nom du plan *</label>
                  <input value={form.nom} onChange={e => set('nom', e.target.value)} style={{ ...inputStyle, borderColor: erreurs.nom ? THEME.danger : THEME.border }} />
                  {erreurs.nom && <p style={{ fontSize: '11px', color: THEME.danger, margin: '3px 0 0 0' }}>{erreurs.nom}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Icône</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const, maxWidth: '200px' }}>
                    {EMOJIS_PLAN.map(e => (
                      <button key={e} onClick={() => set('emoji', e)} style={{ fontSize: '18px', padding: '5px', borderRadius: '6px', border: `2px solid ${form.emoji === e ? THEME.accent : THEME.border}`, backgroundColor: form.emoji === e ? THEME.accentLight : 'white', cursor: 'pointer' }}>{e}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Type abonnement */}
              <div>
                <label style={labelStyle}>Type d'abonnement</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[{ val: 'mensuel', label: '📅 Mensuel' }, { val: 'annuel', label: '📆 Annuel' }].map(t => (
                    <label key={t.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '9px 14px', borderRadius: '8px', border: `2px solid ${form.typeAbonnement === t.val ? THEME.accent : THEME.border}`, backgroundColor: form.typeAbonnement === t.val ? THEME.accentLight : 'white', flex: 1 }}>
                      <input type="radio" checked={form.typeAbonnement === t.val} onChange={() => set('typeAbonnement', t.val)} style={{ accentColor: THEME.accent }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: form.typeAbonnement === t.val ? THEME.accent : THEME.text }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div>
                <label style={labelStyle}>Prix HT (avant taxes) *</label>
                <div style={{ position: 'relative', maxWidth: '220px' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: THEME.textLight, fontWeight: '700' }}>$</span>
                  <input type="number" min="0" step="0.01" value={form.prixHT} onChange={e => set('prixHT', e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: '28px', borderColor: erreurs.prixHT ? THEME.danger : THEME.border }} />
                </div>
                {erreurs.prixHT && <p style={{ fontSize: '11px', color: THEME.danger, margin: '3px 0 0 0' }}>{erreurs.prixHT}</p>}
                {parseFloat(form.prixHT) > 0 && (
                  <div style={{ marginTop: '6px', backgroundColor: THEME.accentLight, borderRadius: '6px', padding: '7px 10px', fontSize: '11px', color: THEME.accent, fontWeight: '600' }}>
                    TTC : {prix.ttc.toFixed(2)} $ · TPS {prix.tps.toFixed(2)} $ · TVQ {prix.tvq.toFixed(2)} $
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
                    <input type="number" min="1" value={form.limiteProduits} onChange={e => set('limiteProduits', e.target.value)} placeholder="ex: 100" style={{ ...inputStyle, borderColor: erreurs.limiteProduits ? THEME.danger : THEME.border, maxWidth: '200px' }} />
                    {erreurs.limiteProduits && <p style={{ fontSize: '11px', color: THEME.danger, margin: '3px 0 0 0' }}>{erreurs.limiteProduits}</p>}
                  </div>
                ) : <p style={{ fontSize: '11px', color: THEME.textLight, margin: 0 }}>Désactivé = produits illimités</p>}
              </div>

              {/* Jours essai */}
              <div style={{ maxWidth: '200px' }}>
                <label style={labelStyle}>Jours d'essai</label>
                <input type="number" min="0" value={form.joursEssai} onChange={e => set('joursEssai', e.target.value)} placeholder="0" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Section 2 — Fonctionnalités */}
          <div style={sectionStyle}>
            <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚙️</span>
                <h3 style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Fonctionnalités incluses</h3>
              </div>
              <span style={{ fontSize: '11px', backgroundColor: THEME.accent, color: 'white', borderRadius: '20px', padding: '2px 10px', fontWeight: '700' }}>{nbFonctActives} / {FONCTIONNALITES_MASTER.length}</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {groupes.map(groupe => {
                const foncts = FONCTIONNALITES_MASTER.filter(f => f.groupe === groupe);
                const toutActif = foncts.every(f => form.fonctionnalites[f.key]);
                const aucunActif = foncts.every(f => !form.fonctionnalites[f.key]);
                return (
                  <div key={groupe} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: `1px solid ${THEME.border}` }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
                        {groupe === 'Base' ? '🧱' : groupe === 'Contenu' ? '📄' : groupe === 'Avancé' ? '🔧' : '⭐'} {groupe} ({foncts.filter(f => form.fonctionnalites[f.key]).length}/{foncts.length})
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => toggleGroupe(groupe, true)} disabled={toutActif} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', border: `1px solid ${THEME.accent}`, backgroundColor: toutActif ? '#f0f0f0' : THEME.accentLight, color: toutActif ? '#aaa' : THEME.accent, cursor: toutActif ? 'default' : 'pointer', fontWeight: '600' }}>Tout activer</button>
                        <button onClick={() => toggleGroupe(groupe, false)} disabled={aucunActif} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', border: `1px solid ${THEME.border}`, backgroundColor: aucunActif ? '#f0f0f0' : 'white', color: aucunActif ? '#aaa' : THEME.textLight, cursor: aucunActif ? 'default' : 'pointer', fontWeight: '600' }}>Tout désactiver</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
                      {foncts.map(f => {
                        const actif = form.fonctionnalites[f.key];
                        return (
                          <div key={f.key} onClick={() => toggleFonct(f.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '8px', backgroundColor: actif ? THEME.accentLight : '#fafafa', border: `1px solid ${actif ? THEME.accent + '40' : THEME.border}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '16px' }}>{f.icon}</span>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: actif ? THEME.text : THEME.textLight, margin: 0 }}>{f.label}</p>
                            </div>
                            <Toggle actif={actif} onChange={() => toggleFonct(f.key)} />
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
              <h3 style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Commission</h3>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>Commission par plan d'adhésion</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>Définir une commission spécifique pour ce plan</p>
                </div>
                <Toggle actif={form.commissionActive} onChange={v => set('commissionActive', v)} />
              </div>
              {form.commissionActive && (
                <div>
                  <label style={labelStyle}>Taux de commission (%)</label>
                  <div style={{ position: 'relative', maxWidth: '180px' }}>
                    <input type="number" min="0" max="100" step="0.1" value={form.commission} onChange={e => set('commission', e.target.value)} placeholder="ex: 5" style={{ ...inputStyle, borderColor: erreurs.commission ? THEME.danger : THEME.border }} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: THEME.textLight }}>%</span>
                  </div>
                  {erreurs.commission && <p style={{ fontSize: '11px', color: THEME.danger, margin: '3px 0 0 0' }}>{erreurs.commission}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Section 4 — Frais activation */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>🔑</span>
              <h3 style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Frais d'activation (unique)</h3>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: THEME.text, margin: 0 }}>Activer les frais d'inscription unique</p>
                  <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>Frais facturés une seule fois à l'inscription</p>
                </div>
                <Toggle actif={form.fraisActivationActif} onChange={v => set('fraisActivationActif', v)} />
              </div>
              {form.fraisActivationActif && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Montant HT ($)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: THEME.textLight, fontWeight: '700' }}>$</span>
                      <input type="number" min="0" step="0.01" value={form.fraisActivation} onChange={e => set('fraisActivation', e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: '28px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Facturer lors de</label>
                    <select value={form.chargerFraisSur} onChange={e => set('chargerFraisSur', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="nouvelle_inscription">Nouvelle inscription</option>
                      <option value="renouvellement">Renouvellement</option>
                      <option value="les_deux">Les deux</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5 — Note interne */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <span>📝</span>
              <h3 style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Note interne</h3>
            </div>
            <div style={{ padding: '16px' }}>
              <label style={labelStyle}>Note (non visible par le vendeur)</label>
              <textarea value={form.infoSupplementaire} onChange={e => set('infoSupplementaire', e.target.value)} rows={3}
                placeholder="ex: Vendeur VIP depuis 2024, accord spécial direction..."
                style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
          </div>

          {/* Aperçu */}
          <div style={{ backgroundColor: '#f5f0ff', border: `1px solid #c4b5fd`, borderRadius: '10px', padding: '14px 16px', marginBottom: '4px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: THEME.purple, textTransform: 'uppercase' as const, margin: '0 0 8px 0' }}>⭐ Aperçu du plan</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: THEME.textLight }}>Nom :</span><span style={{ fontWeight: '700', color: THEME.purple }}>{form.emoji} {form.nom}</span>
              <span style={{ color: THEME.textLight }}>Mensuel :</span><span style={{ fontWeight: '700' }}>{parseFloat(form.prixHT) === 0 ? 'Gratuit' : fmtMoney(parseFloat(form.prixHT))}</span>
              <span style={{ color: THEME.textLight }}>Produits :</span><span style={{ fontWeight: '700' }}>{form.limiterProduits ? (form.limiteProduits || '—') : 'Illimité ∞'}</span>
              <span style={{ color: THEME.textLight }}>Commission :</span><span style={{ fontWeight: '700' }}>{form.commissionActive ? `${form.commission}%` : 'Aucune'}</span>
              <span style={{ color: THEME.textLight }}>Fonctionnalités :</span><span style={{ fontWeight: '700' }}>{nbFonctActives} / {FONCTIONNALITES_MASTER.length}</span>
              <span style={{ color: THEME.textLight }}>Vendeur cible :</span><span style={{ fontWeight: '700' }}>{vendeur.nomBoutique}</span>
            </div>
          </div>
        </div>

        {/* Pied modal — boutons */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0, backgroundColor: 'white' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', border: `1px solid ${THEME.border}`, borderRadius: '8px', backgroundColor: 'white', color: THEME.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
          <button onClick={sauvegarder} disabled={saving}
            style={{ padding: '10px 24px', border: 'none', borderRadius: '8px', backgroundColor: saving ? '#a78bfa' : THEME.purple, color: 'white', fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⏳ Sauvegarde...' : '⭐ Attribuer ce plan sur mesure'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
interface AbonnementDetailProps {
  vendeur: AbonnementVendeur;
  naviguerVers: (page: string, data?: any) => void;
}

export default function AbonnementDetail({ vendeur: vendeurInit, naviguerVers }: AbonnementDetailProps) {
  const [vendeur, setVendeur] = useState<AbonnementVendeur>(vendeurInit);
  const [modal, setModal] = useState<'none' | 'desactiver' | 'changer' | 'surMesure'>('none');
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' | 'purple' } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [planDetails, setPlanDetails] = useState<any | null>(null);

  // Charger les plans + détails du plan actif
  useEffect(() => {
    const charger = async () => {
      try {
        const [resPlans, resPlanActif] = await Promise.all([
          fetch(`${API}/api/plans`).then(r => r.json()),
          fetch(`${API}/api/plans/vendeur/${vendeur.sellerId}/plan-actif`).then(r => r.json()),
        ]);
        setPlans(Array.isArray(resPlans) ? resPlans : []);
        setPlanDetails(resPlanActif);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    };
    charger();
  }, [vendeur.sellerId]);

  const showToast = (msg: string, type: 'success' | 'danger' | 'purple') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDesactiver = () => {
    setVendeur(v => ({ ...v, statut: 'inactif', paiementStatut: 'none' }));
    setModal('none');
    showToast(`✅ Plan de ${vendeur.nomBoutique} désactivé avec succès.`, 'danger');
  };

  const handleChangerPlan = async (planId: string) => {
    const plan = plans.find(p => String(p.id) === planId);
    if (!plan) return;
    try {
      await fetch(`${API}/api/vendeurs/${vendeur.sellerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.nom }),
      });
      setVendeur(v => ({ ...v, plan: plan.nom, prixMensuel: Number(plan.prix_ht) }));
      setModal('none');
      setMenuOuvert(false);
      showToast(`🔄 Plan changé pour ${plan.nom} avec succès.`, 'success');
    } catch {
      showToast('❌ Erreur lors du changement de plan.', 'danger');
    }
  };

  const handleSurMesure = (config: any) => {
    setVendeur(v => ({ ...v, plan: config.nom, planType: 'custom', prixMensuel: Number(config.prix_ht) }));
    setModal('none');
    setMenuOuvert(false);
    showToast(`⭐ Plan sur mesure "${config.nom}" attribué à ${vendeur.nomBoutique}.`, 'purple');
  };

  const cardStyle: React.CSSProperties = { backgroundColor: THEME.card, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '16px' };
  const rowStyle = (i: number): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: '260px 1fr', borderBottom: '1px solid #f5f5f5', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' });
  const labelStyle: React.CSSProperties = { padding: '13px 20px', fontSize: '13px', fontWeight: '700', color: THEME.text, borderRight: `1px solid ${THEME.border}` };
  const valueStyle: React.CSSProperties = { padding: '13px 20px', fontSize: '13px', color: THEME.text };
  const toastColors: Record<string, string> = { success: THEME.success, danger: THEME.danger, purple: THEME.purple };

  // Fonctionnalités actives du plan
  const fonctionnalites = planDetails?.limites?.fonctionnalites || null;
  const fonctActives = fonctionnalites
    ? FONCTIONNALITES_MASTER.filter(f => fonctionnalites[f.key] === true)
    : [];
  const fonctInactives = fonctionnalites
    ? FONCTIONNALITES_MASTER.filter(f => fonctionnalites[f.key] !== true)
    : [];

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: toastColors[toast.type], color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '380px' }}>
          {toast.msg}
        </div>
      )}

      {modal === 'desactiver' && <ModalDesactivation vendeur={vendeur} onConfirm={handleDesactiver} onCancel={() => setModal('none')} />}
      {modal === 'changer' && <ModalChangerPlan vendeur={vendeur} plans={plans} onConfirm={handleChangerPlan} onCancel={() => setModal('none')} />}
      {modal === 'surMesure' && <ModalPlanSurMesure vendeur={vendeur} onConfirm={handleSurMesure} onCancel={() => setModal('none')} />}

      <div style={{ padding: '24px 28px', backgroundColor: THEME.bg, minHeight: '100vh' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap' as const, gap: '12px' }}>
          <div>
            <button onClick={() => naviguerVers('forfaits-abonnements')}
              style={{ border: 'none', backgroundColor: 'transparent', color: THEME.accent, fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← Retour aux abonnements
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: THEME.text, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Membership Plan</h1>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>
              Détails du plan de <strong>{vendeur.nomBoutique}</strong> · ID {vendeur.sellerId}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' as const }}>
            <div style={{ position: 'relative' as const }}>
              <button onClick={() => setMenuOuvert(!menuOuvert)}
                style={{ border: `1px solid ${THEME.border}`, backgroundColor: 'white', color: THEME.text, borderRadius: '8px', padding: '9px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                Plus ▾
              </button>
              {menuOuvert && (
                <div style={{ position: 'absolute' as const, top: '100%', right: 0, marginTop: '4px', backgroundColor: 'white', border: `1px solid ${THEME.border}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '220px', overflow: 'hidden' }}>
                  <button onClick={() => { setModal('desactiver'); setMenuOuvert(false); }}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'white', color: THEME.danger, fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fff5f5')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                    🚫 Désactiver
                  </button>
                  <div style={{ height: '1px', backgroundColor: THEME.border }} />
                  <button onClick={() => { setModal('surMesure'); setMenuOuvert(false); }}
                    style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'white', color: THEME.purple, fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f0ff')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                    ⭐ Attribuer plan sur mesure
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setModal('changer')}
              style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              🔄 Changer le plan
            </button>
          </div>
        </div>

        {/* Carte vendeur */}
        <div style={{ ...cardStyle, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: THEME.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🏪</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '17px', fontWeight: '900', color: THEME.text, margin: '0 0 2px 0' }}>{vendeur.nomBoutique}</p>
            <p style={{ fontSize: '13px', color: THEME.textLight, margin: 0 }}>{vendeur.email} · ID {vendeur.sellerId} · {vendeur.province}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            <PlanBadge type={vendeur.planType} nom={vendeur.plan} />
            {(() => {
              const map: Record<string, { bg: string; color: string; label: string }> = {
                actif:    { bg: '#dcfce7', color: '#16a34a', label: '✅ Actif'   },
                pending:  { bg: '#fef9c3', color: '#92400e', label: '⏳ Pending' },
                inactif:  { bg: '#f3f4f6', color: '#6b7280', label: '⬜ Inactif' },
                suspendu: { bg: '#fee2e2', color: '#dc2626', label: '🚫 Suspendu' },
              };
              const s = map[vendeur.statut] || map.inactif;
              return <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{s.label}</span>;
            })()}
          </div>
        </div>

        {/* PLAN DETAILS */}
        <div style={cardStyle}>
          <div style={{ padding: '14px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${THEME.accent}` }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', margin: 0, color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>📋 Plan Details</h3>
            <p style={{ fontSize: '11px', color: THEME.textLight, margin: '2px 0 0 0' }}>Détails du plan de membership actuel</p>
          </div>

          {[
            { label: 'Plan actuel',            value: <PlanBadge type={vendeur.planType} nom={vendeur.plan} /> },
            { label: 'Prix mensuel',           value: Number(vendeur.prixMensuel) === 0 ? <span style={{ color: THEME.success, fontWeight: '700' }}>Gratuit (0,00 $/mois)</span> : <span style={{ fontWeight: '700' }}>{fmtMoney(vendeur.prixMensuel)} / mois</span> },
            { label: 'Produits autorisés',     value: planDetails?.limites?.limiter_produits ? <strong>{planDetails.limites.limite_produits} annonces</strong> : <span style={{ color: THEME.success, fontWeight: '700' }}>Illimité ∞</span> },
            { label: 'Annonces actives',       value: planDetails ? <span>{planDetails.utilisation?.nb_produits_actifs ?? '—'} {planDetails?.limites?.limiter_produits ? `/ ${planDetails.limites.limite_produits}` : ''}</span> : '—' },
            { label: 'Commission',             value: planDetails?.limites?.commission_active ? <span style={{ color: THEME.warning, fontWeight: '700' }}>{planDetails.limites.commission}%</span> : 'Aucune' },
            { label: 'Date de début',          value: vendeur.dateDebut || '—' },
            { label: 'Date de fin',            value: vendeur.dateFin || '—' },
            { label: 'Période de facturation', value: '30 jours' },
            { label: 'Statut du paiement',     value: (() => {
              const map: Record<string, { bg: string; color: string; label: string }> = {
                paid:    { bg: '#dcfce7', color: '#16a34a', label: '💳 Payé'       },
                pending: { bg: '#fef9c3', color: '#92400e', label: '⏳ En attente' },
                failed:  { bg: '#fee2e2', color: '#dc2626', label: '❌ Échoué'     },
                none:    { bg: '#f3f4f6', color: '#9ca3af', label: '—'             },
              };
              const s = map[vendeur.paiementStatut] || map.none;
              return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{s.label}</span>;
            })() },
          ].map((row, i) => (
            <div key={i} style={rowStyle(i)}>
              <div style={labelStyle}>{row.label}</div>
              <div style={valueStyle}>{row.value}</div>
            </div>
          ))}

          {/* Fonctionnalités actives */}
          {fonctionnalites && (
            <div style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: THEME.accent, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px 0' }}>
                ⚡ Fonctionnalités incluses — {fonctActives.length} / {FONCTIONNALITES_MASTER.length}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {FONCTIONNALITES_MASTER.map(f => {
                  const actif = fonctionnalites[f.key] === true;
                  return (
                    <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', backgroundColor: actif ? '#f0fdf4' : '#fafafa', border: `1px solid ${actif ? '#86efac' : THEME.border}` }}>
                      <span style={{ fontSize: '14px' }}>{f.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: actif ? '700' : '500', color: actif ? THEME.success : '#bbb', flex: 1 }}>{f.label}</span>
                      <span style={{ fontSize: '13px' }}>{actif ? '✅' : '✗'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}