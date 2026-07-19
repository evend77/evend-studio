// src/pages/admin/AdminForfaitsPhoto.tsx
import React, { useState, useEffect } from 'react';

interface PlanPhoto {
  id: number;
  plan_key: string;
  label: string;
  max_photos: number | null;
  prix: number;
  actif: boolean;
  ordre: number;
  nb_sponsors_abonnes?: number;
}

const THEME = {
  accent: '#f59e0b', accentLight: '#fef3c7', bg: '#f0f2f5', card: '#ffffff',
  border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280', danger: '#dc2626', success: '#16a34a',
};

const API_BASE = '/api/admin/sponsors';

function ModaleForfait({ plan, onFermer, onSauvegarder }: {
  plan: Partial<PlanPhoto> | null;
  onFermer: () => void;
  onSauvegarder: (data: { label: string; max_photos: number | null; prix: number }) => void;
}) {
  const [label, setLabel] = useState(plan?.label || '');
  const [illimite, setIllimite] = useState(plan?.max_photos === null);
  const [maxPhotos, setMaxPhotos] = useState(plan?.max_photos ?? 10);
  const [prix, setPrix] = useState(plan?.prix ?? 0);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onFermer()}>
      <div style={{ backgroundColor: 'white', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: `linear-gradient(135deg, #1a2436, ${THEME.accent})`, color: 'white' }}>
          <p style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{plan?.id ? '✏️ Modifier le forfait' : '➕ Nouveau forfait'}</p>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Nom du forfait</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Découverte"
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Nombre de photos</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input type="number" min={1} value={maxPhotos} disabled={illimite} onChange={e => setMaxPhotos(parseInt(e.target.value) || 0)}
              style={{ flex: 1, padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, outline: 'none', opacity: illimite ? 0.4 : 1 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={illimite} onChange={e => setIllimite(e.target.checked)} /> Illimité
            </label>
          </div>

          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Prix mensuel ($)</label>
          <input type="number" min={0} step="0.01" value={prix} onChange={e => setPrix(parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onFermer} style={{ padding: '9px 18px', border: `1px solid ${THEME.border}`, borderRadius: 8, backgroundColor: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button
            onClick={() => label.trim() && onSauvegarder({ label: label.trim(), max_photos: illimite ? null : maxPhotos, prix })}
            disabled={!label.trim()}
            style={{ padding: '9px 18px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: label.trim() ? 'pointer' : 'not-allowed', backgroundColor: label.trim() ? THEME.accent : '#fcd34d', color: 'white' }}>
            💾 Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminForfaitsPhoto() {
  const [plans, setPlans] = useState<PlanPhoto[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modale, setModale] = useState<{ open: boolean; plan: Partial<PlanPhoto> | null }>({ open: false, plan: null });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const token = () => localStorage.getItem('token');
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  const charger = async () => {
    setChargement(true);
    try {
      const res = await fetch(`${API_BASE}/plans-photos`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (e) {
      showToast('❌ Erreur lors du chargement des forfaits', 'error');
    }
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const sauvegarder = async (data: { label: string; max_photos: number | null; prix: number }) => {
    try {
      const estEdition = !!modale.plan?.id;
      const res = await fetch(
        estEdition ? `${API_BASE}/plans-photos/${modale.plan!.id}` : `${API_BASE}/plans-photos`,
        {
          method: estEdition ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
          body: JSON.stringify(data),
        }
      );
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Erreur');
      showToast(estEdition ? '✅ Forfait modifié' : '✅ Forfait créé', 'success');
      setModale({ open: false, plan: null });
      charger();
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    }
  };

  const toggleActif = async (plan: PlanPhoto) => {
    try {
      const res = await fetch(`${API_BASE}/plans-photos/${plan.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ actif: !plan.actif }),
      });
      if (!res.ok) throw new Error();
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, actif: !p.actif } : p));
    } catch {
      showToast('❌ Erreur lors du changement de statut', 'error');
    }
  };

  const supprimer = async (plan: PlanPhoto) => {
    if (!window.confirm(`Supprimer le forfait "${plan.label}" ?`)) return;
    try {
      const res = await fetch(`${API_BASE}/plans-photos/${plan.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      showToast('✅ Forfait supprimé', 'success');
    } catch (e: any) {
      showToast(`❌ ${e.message}`, 'error');
    }
  };

  if (chargement) return <div style={{ padding: 60, textAlign: 'center', color: THEME.textLight }}>⏳ Chargement...</div>;

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: THEME.text, textTransform: 'uppercase' }}>📸 Forfaits Photos</h1>
          <p style={{ fontSize: 13, color: THEME.textLight, margin: 0 }}>Gérez les paliers d'abonnement pour la banque de photos sponsors</p>
        </div>
        <button onClick={() => setModale({ open: true, plan: null })}
          style={{ backgroundColor: THEME.accent, color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ➕ Nouveau forfait
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ background: THEME.card, borderRadius: 12, border: `2px solid ${plan.actif ? THEME.border : '#fca5a5'}`, padding: 20, opacity: plan.actif ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{plan.label}</h3>
                <p style={{ fontSize: 10, color: '#aaa', margin: '2px 0 0', fontFamily: 'monospace' }}>{plan.plan_key}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: plan.actif ? '#dcfce7' : '#fee2e2', color: plan.actif ? THEME.success : THEME.danger }}>
                {plan.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: THEME.accent, margin: '0 0 4px' }}>{plan.prix.toFixed ? plan.prix.toFixed(2) : plan.prix}$<span style={{ fontSize: 12, fontWeight: 400, color: THEME.textLight }}>/mois</span></p>
            <p style={{ fontSize: 13, color: THEME.text, margin: '0 0 14px' }}>{plan.max_photos === null ? 'Photos illimitées' : `${plan.max_photos} photos`}</p>
            <p style={{ fontSize: 11, color: THEME.textLight, margin: '0 0 14px' }}>👥 {plan.nb_sponsors_abonnes ?? 0} sponsor(s) abonné(s)</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setModale({ open: true, plan })} style={{ flex: 1, padding: '7px 0', border: `1px solid ${THEME.border}`, borderRadius: 6, background: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✏️ Modifier</button>
              <button onClick={() => toggleActif(plan)} style={{ flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, background: plan.actif ? '#fef3c7' : '#dcfce7', color: plan.actif ? '#92400e' : THEME.success, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {plan.actif ? '⏸ Désactiver' : '▶️ Activer'}
              </button>
              <button onClick={() => supprimer(plan)} style={{ padding: '7px 12px', border: 'none', borderRadius: 6, background: '#fee2e2', color: THEME.danger, fontSize: 12, cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modale.open && (
        <ModaleForfait plan={modale.plan} onFermer={() => setModale({ open: false, plan: null })} onSauvegarder={sauvegarder} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: toast.type === 'success' ? THEME.success : THEME.danger, color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 2000, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default AdminForfaitsPhoto;