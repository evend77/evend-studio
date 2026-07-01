/**
 * ReductionsRabais.tsx
 * src/pages/vendeur/ReductionsRabais.tsx
 */

import React, { useState, useCallback, useEffect } from 'react';

type TypeRemise = '' | 'pourcentage' | 'montant_fixe';
type SApplique  = 'product' | 'order';
type Statut     = 'actif' | 'expire' | 'inactif';

interface Reduction {
  id: number;
  code: string;
  type: SApplique;
  type_remise: TypeRemise;
  valeur: number;
  date_debut: string;
  date_fin: string | null;
  statut: Statut;
  usages_max: number | null;
  limite_client: boolean;
  produit_id: string;
  vendeur_id: number;
}

interface FormRed {
  typeRemise: TypeRemise;
  valeur: string;
  sApplique: SApplique;
  produitNom: string;
  usagesLimites: boolean;
  usagesMax: string;
  limiteClient: boolean;
  dateDebut: string;
  avecDateFin: boolean;
  dateFin: string;
}

const API = 'https://evend-multivendeur-api.onrender.com';

const FORM_VIDE: FormRed = {
  typeRemise: '',
  valeur: '',
  sApplique: 'product',
  produitNom: '',
  usagesLimites: false,
  usagesMax: '',
  limiteClient: false,
  dateDebut: new Date().toISOString().slice(0, 16),
  avecDateFin: false,
  dateFin: '',
};

function genCode(): string {
  return Array.from({ length: 16 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
}

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

const C = {
  teal: '#537373',
  tealLight: '#e8f0f0',
  green: '#008060',
  red: '#E74C3C',
  orange: '#F39C12',
  blue: '#1e40af',
  blueLight: '#dbeafe',
  border: '#e1e4e8',
  text: '#1a2332',
  textLight: '#6b7280',
};

// ── Composants page ───────────────────────────────────────────────────────────
function SectionCard({ icon, title, color, children, noPadding }: {
  icon: string;
  title: string;
  color: string;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${C.border}`, marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '14px 20px', borderBottom: `2px solid ${color}`, background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: '800', color, textTransform: 'uppercase' as const, letterSpacing: '1px' }}>{title}</span>
      </div>
      <div style={{ padding: noPadding ? '0' : '20px' }}>{children}</div>
    </div>
  );
}

function StatutBadge({ statut }: { statut: Statut }) {
  const m = {
    actif: { bg: '#dcfce7', color: '#16a34a', label: '✅ Actif' },
    expire: { bg: '#fee2e2', color: '#dc2626', label: '❌ Expiré' },
    inactif: { bg: '#fef9c3', color: '#d97706', label: '⏸ Inactif' }
  };
  const s = m[statut];
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: '700',
      padding: '3px 9px',
      borderRadius: '20px',
      backgroundColor: s.bg,
      color: s.color,
      whiteSpace: 'nowrap' as const
    }}>
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: SApplique }) {
  return type === 'product'
    ? <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', backgroundColor: C.blueLight, color: C.blue, whiteSpace: 'nowrap' as const }}>📦 Produit</span>
    : <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', backgroundColor: '#fef9c3', color: '#d97706', whiteSpace: 'nowrap' as const }}>🛒 Commande</span>;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
const darkInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none'
};

const darkSelect: React.CSSProperties = {
  ...darkInput,
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath fill='%2310b981' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
  cursor: 'pointer'
};

function DarkField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '7px' }}>
        {label}{required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function DarkCbx({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '12px' }} onClick={() => onChange(!checked)}>
      <div style={{
        width: '20px',
        height: '20px',
        minWidth: '20px',
        borderRadius: '5px',
        border: `2px solid ${checked ? '#10b981' : 'rgba(255,255,255,0.3)'}`,
        background: checked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '1px'
      }}>
        {checked && <svg width="11" height="9" viewBox="0 0 11 9"><polyline points="1,5 4,8 10,1" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: '1.5' }}>{label}</span>
    </div>
  );
}

function DarkTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', marginTop: '4px' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>{title}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(16,185,129,0.2)' }} />
    </div>
  );
}

function DarkLine() {
  return <div style={{ height: '1px', background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)', margin: '20px 0' }} />;
}

function ModalReduction({ modeEdit, form, setF, onClose, onSave, loading }: {
  modeEdit: number | null;
  form: FormRed;
  setF: <K extends keyof FormRed>(k: K, v: FormRed[K]) => void;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
}) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(5,10,30,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0a1628,#1a3a6b)', padding: '22px 28px', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🏷️</div>
            <div>
              <p style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '800' }}>{modeEdit !== null ? 'Modifier la réduction' : 'Ajouter une réduction (Codes Promos)'}</p>
              <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>⚠️ NON COMPATIBLE AVEC STRIPE CONNECT — PayPal uniquement</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ background: '#0f1729', padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '22px', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, color: 'rgba(251,191,36,0.9)', fontSize: '12px', lineHeight: '1.6' }}>Utilisables seulement via <strong>PayPal</strong>. Transmettez le code manuellement à l'acheteur.</p>
          </div>

          <DarkTitle icon="⚙️" title="Options" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <DarkField label="Type de remise (Rabais)" required>
              <select value={form.typeRemise} onChange={e => setF('typeRemise', e.target.value as TypeRemise)} style={darkSelect}>
                <option value="" style={{ background: '#0d2b5d' }}>Veuillez sélectionner</option>
                <option value="pourcentage" style={{ background: '#0d2b5d' }}>Pourcentage (%)</option>
                <option value="montant_fixe" style={{ background: '#0d2b5d' }}>Montant fixe ($)</option>
              </select>
            </DarkField>
            <DarkField label={`Valeur${form.typeRemise === 'pourcentage' ? ' (%)' : form.typeRemise === 'montant_fixe' ? ' ($)' : ''}`} required>
              <div style={{ position: 'relative' }}>
                <input type="number" value={form.valeur} onChange={e => setF('valeur', e.target.value)} placeholder="Ex: 10" style={darkInput} disabled={!form.typeRemise} />
                {form.typeRemise && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: '700' }}>{form.typeRemise === 'pourcentage' ? '%' : '$'}</span>}
              </div>
            </DarkField>
          </div>

          <DarkLine />
          <DarkTitle icon="🎯" title="S'applique à" />
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            {(['product', 'order'] as SApplique[]).map(val => (
              <div key={val} onClick={() => setF('sApplique', val)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${form.sApplique === val ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                  background: form.sApplique === val ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                  flex: 1
                }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: `2px solid ${form.sApplique === val ? '#10b981' : 'rgba(255,255,255,0.3)'}`,
                  background: form.sApplique === val ? '#10b981' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {form.sApplique === val && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ color: form.sApplique === val ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: form.sApplique === val ? '700' : '400', fontSize: '13px' }}>
                  {val === 'product' ? '📦 Produit' : '🛒 Commande (Order)'}
                </span>
              </div>
            ))}
          </div>
          {form.sApplique === 'product' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '4px' }}>
              <div style={{ flex: 1 }}>
                <DarkField label="Produit ciblé">
                  <input type="text" value={form.produitNom} onChange={e => setF('produitNom', e.target.value)} placeholder="Entrez l'ID ou le nom du produit..." style={darkInput} />
                </DarkField>
              </div>
            </div>
          )}

          <DarkLine />
          <DarkTitle icon="🔢" title="Utilisations de la remise maximale" />
          <DarkCbx checked={form.usagesLimites} onChange={v => setF('usagesLimites', v)} label="Nombre limité de fois que cette réduction peut être utilisée au total" />
          {form.usagesLimites && (
            <div style={{ paddingLeft: '30px', marginBottom: '12px' }}>
              <input type="number" value={form.usagesMax} onChange={e => setF('usagesMax', e.target.value)} placeholder="Ex : 100" style={{ ...darkInput, width: '200px' }} min="1" />
            </div>
          )}
          <DarkCbx checked={form.limiteClient} onChange={v => setF('limiteClient', v)} label="Limite à une utilisation par client" />

          <DarkLine />
          <DarkTitle icon="📅" title="Dates actives" />
          <div style={{ display: 'grid', gridTemplateColumns: form.avecDateFin ? '1fr 1fr' : '1fr', gap: '14px' }}>
            <DarkField label="Date et heure de début des rabais" required>
              <input type="datetime-local" value={form.dateDebut} onChange={e => setF('dateDebut', e.target.value)} style={{ ...darkInput, colorScheme: 'dark' }} />
            </DarkField>
            {form.avecDateFin && (
              <DarkField label="Date et heure de fin">
                <input type="datetime-local" value={form.dateFin} onChange={e => setF('dateFin', e.target.value)} min={form.dateDebut} style={{ ...darkInput, colorScheme: 'dark' }} />
              </DarkField>
            )}
          </div>
          <DarkCbx checked={form.avecDateFin} onChange={v => setF('avecDateFin', v)} label="Définir la date de fin" />
        </div>

        {/* Footer */}
        <div style={{ background: '#0b1529', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={onSave} disabled={loading} style={{
            padding: '10px 28px',
            borderRadius: '10px',
            border: 'none',
            background: loading ? '#555' : 'linear-gradient(135deg,#065f46,#10b981)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '800',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.4)',
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? '⏳ Enregistrement...' : (modeEdit !== null ? '💾 Enregistrer les modifications' : '✅ Créer la réduction')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ReductionsRabais() {
  const [reductions, setReductions] = useState<Reduction[]>([]);
  const [onglet, setOnglet] = useState<'tout' | 'actif' | 'expire'>('tout');
  const [modalOpen, setModalOpen] = useState(false);
  const [modeEdit, setModeEdit] = useState<number | null>(null);
  const [form, setForm] = useState<FormRed>(FORM_VIDE);
  const [recherche, setRecherche] = useState('');
  const [copie, setCopie] = useState<number | null>(null);
  const [menuOuvert, setMenuOuvert] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Récupérer l'ID du vendeur connecté
  const getVendeurId = (): number => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.id || userData.vendeur_id || 0;
      }
    } catch (e) {
      console.error('Erreur lecture user:', e);
    }
    return 0;
  };

  const vendeurId = getVendeurId();
  const getToken = () => localStorage.getItem('token');

  const setF = useCallback(<K extends keyof FormRed>(k: K, v: FormRed[K]) => setForm(p => ({ ...p, [k]: v })), []);

  // Charger les réductions depuis l'API
  const chargerReductions = useCallback(async () => {
    if (!vendeurId) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setErreur(null);

    try {
      let url = `${API}/api/vendeurs/${vendeurId}/reductions`;
      const params = new URLSearchParams();
      if (onglet !== 'tout') params.append('statut', onglet);
      if (recherche) params.append('recherche', recherche);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setReductions(data);
    } catch (error) {
      console.error('Erreur chargement réductions:', error);
      setErreur('Impossible de charger les réductions');
    } finally {
      setLoadingData(false);
    }
  }, [vendeurId, onglet, recherche]);

  useEffect(() => {
    chargerReductions();
  }, [chargerReductions]);

  // Créer une nouvelle réduction
  const creerReduction = async () => {
    if (!vendeurId) return;

    setLoading(true);
    try {
      const nouvelleReduction = {
        code: genCode(),
        type: form.sApplique,
        type_remise: form.typeRemise,
        valeur: parseFloat(form.valeur) || 0,
        date_debut: new Date(form.dateDebut).toISOString(),
        date_fin: form.avecDateFin ? new Date(form.dateFin).toISOString() : null,
        usages_max: form.usagesLimites ? (parseInt(form.usagesMax) || null) : null,
        limite_client: form.limiteClient,
        produit_id: form.sApplique === 'product' ? form.produitNom : ''
      };

      const response = await fetch(`${API}/api/vendeurs/${vendeurId}/reductions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(nouvelleReduction)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur création');
      }

      await chargerReductions();
      setModalOpen(false);
    } catch (error) {
      console.error('Erreur création:', error);
      alert('Erreur lors de la création de la réduction');
    } finally {
      setLoading(false);
    }
  };

  // Modifier une réduction
  const modifierReduction = async () => {
    if (!vendeurId || !modeEdit) return;

    setLoading(true);
    try {
      const reductionModifiee = {
        type: form.sApplique,
        type_remise: form.typeRemise,
        valeur: parseFloat(form.valeur) || 0,
        date_debut: new Date(form.dateDebut).toISOString(),
        date_fin: form.avecDateFin ? new Date(form.dateFin).toISOString() : null,
        usages_max: form.usagesLimites ? (parseInt(form.usagesMax) || null) : null,
        limite_client: form.limiteClient,
        produit_id: form.sApplique === 'product' ? form.produitNom : '',
        statut: 'actif'
      };

      const response = await fetch(`${API}/api/vendeurs/${vendeurId}/reductions/${modeEdit}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(reductionModifiee)
      });

      if (!response.ok) {
        throw new Error('Erreur modification');
      }

      await chargerReductions();
      setModalOpen(false);
      setModeEdit(null);
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('Erreur lors de la modification de la réduction');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une réduction
  const supprimerReduction = async (id: number) => {
    if (!vendeurId) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette réduction ?')) return;

    try {
      const response = await fetch(`${API}/api/vendeurs/${vendeurId}/reductions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (!response.ok) {
        throw new Error('Erreur suppression');
      }

      await chargerReductions();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const ouvrirCreation = () => {
    setModeEdit(null);
    setForm({
      ...FORM_VIDE,
      dateDebut: new Date().toISOString().slice(0, 16)
    });
    setModalOpen(true);
  };

  const ouvrirEdition = (r: Reduction) => {
    setModeEdit(r.id);
    setForm({
      typeRemise: r.type_remise,
      valeur: String(r.valeur),
      sApplique: r.type,
      produitNom: r.produit_id,
      usagesLimites: r.usages_max !== null,
      usagesMax: r.usages_max !== null ? String(r.usages_max) : '',
      limiteClient: r.limite_client,
      dateDebut: formatDateForInput(r.date_debut),
      avecDateFin: r.date_fin !== null,
      dateFin: formatDateForInput(r.date_fin)
    });
    setModalOpen(true);
  };

  const copierCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopie(id);
    setTimeout(() => setCopie(null), 1500);
  };

  const enregistrer = () => {
    if (!form.typeRemise) {
      alert('Veuillez sélectionner un type de remise');
      return;
    }
    if (!form.valeur || parseFloat(form.valeur) <= 0) {
      alert('Veuillez entrer une valeur valide');
      return;
    }
    if (!form.dateDebut) {
      alert('Veuillez sélectionner une date de début');
      return;
    }

    if (modeEdit !== null) {
      modifierReduction();
    } else {
      creerReduction();
    }
  };

  const nbActif = reductions.filter(r => r.statut === 'actif').length;
  const nbExpire = reductions.filter(r => r.statut === 'expire').length;

  if (loadingData) {
    return (
      <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '28px 32px 80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#333' }}>Chargement des réductions...</p>
        </div>
      </div>
    );
  }

  if (erreur && reductions.length === 0) {
    return (
      <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '28px 32px 80px' }}>
        <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '32px' }}>⚠️</span>
          <p style={{ color: '#b91c1c', marginTop: '8px' }}>{erreur}</p>
          <button onClick={chargerReductions} style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#537373', color: '#fff', cursor: 'pointer' }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', padding: '28px 32px 80px' }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>🏷️</span>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: C.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Réductions (Codes Promos)</h1>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>⚠️ <strong>NON COMPATIBLE AVEC STRIPE CONNECT</strong> — Utilisable uniquement avec PayPal</p>
          </div>
          <button onClick={ouvrirCreation}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: `linear-gradient(135deg,${C.teal},#3a9e8a)`,
              color: '#fff',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(83,115,115,0.4)',
              whiteSpace: 'nowrap' as const
            }}>
            ➕ AJOUTER UNE RÉDUCTION (CODES PROMOS)
          </button>
        </div>

        {/* Notice */}
        <SectionCard icon="📢" title="Notice" color={C.orange}>
          <p style={{ margin: 0, fontSize: '13px', color: C.text, lineHeight: '1.6' }}>
            Liste des remises créées sur un produit spécifique ou sur l'ensemble de la commande. Vous pouvez utiliser ces réductions seulement si vous utilisez <strong>PayPal</strong>, NON COMPATIBLE AVEC STRIPE CONNECT. Une fois créées, vous devez transmettre le code à l'acheteur.
          </p>
        </SectionCard>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total codes', val: reductions.length, icon: '🏷️', color: C.teal },
            { label: 'Actifs', val: nbActif, icon: '✅', color: C.green },
            { label: 'Expirés', val: nbExpire, icon: '❌', color: C.red },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.val}</p>
                <p style={{ margin: 0, fontSize: '12px', color: C.textLight, fontWeight: '600' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <SectionCard icon="📋" title="Liste des réductions" color={C.teal} noPadding>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '4px', background: '#f0f2f5', borderRadius: '10px', padding: '4px' }}>
              {(['tout', 'actif', 'expire'] as const).map(o => (
                <button key={o} onClick={() => setOnglet(o)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '7px',
                    border: 'none',
                    background: onglet === o ? '#fff' : 'transparent',
                    color: onglet === o ? C.teal : C.textLight,
                    fontWeight: onglet === o ? '700' : '500',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: onglet === o ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                  }}>
                  {o === 'tout' ? 'Tout' : o === 'actif' ? '✅ Actifs' : '❌ Expirés'}
                </button>
              ))}
            </div>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher des éléments..."
              style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '13px', outline: 'none', width: '240px' }} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: `1px solid ${C.border}` }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `2px solid ${C.teal}` }}>
                {['ID RÉDUCTION', 'CODE DE RÉDUCTION', 'TYPE', 'TYPE DE RÉDUCTION', 'VALEUR', 'DATE DE DÉBUT', 'DATE DE FIN', 'STATUT', 'ACTION'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: C.teal, textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reductions.length === 0
                ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: C.textLight }}>Aucune réduction trouvée</td></tr>
                : reductions.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid #f5f5f5`, backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: C.teal }}>{r.id}</span>
                        <button onClick={() => copierCode(r.id, r.code)} title={`Copier : ${r.code}`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center', color: copie === r.id ? '#16a34a' : '#9ca3af' }}>
                          {copie === r.id
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          }
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px' }}><span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: C.text, background: '#f0f2f5', padding: '3px 8px', borderRadius: '6px' }}>{r.code}</span></td>
                    <td style={{ padding: '13px 14px' }}><TypeBadge type={r.type} /></td>
                    <td style={{ padding: '13px 14px' }}><span style={{ fontSize: '12px', color: C.text }}>{r.type_remise === 'pourcentage' ? 'Pourcentage' : 'Montant fixe'}</span></td>
                    <td style={{ padding: '13px 14px' }}><span style={{ fontSize: '14px', fontWeight: '800', color: C.teal }}>{r.type_remise === 'pourcentage' ? `${r.valeur} %` : `${r.valeur} $`}</span></td>
                    <td style={{ padding: '13px 14px' }}><span style={{ fontSize: '12px', color: C.textLight, whiteSpace: 'nowrap' as const }}>{formatDateForDisplay(r.date_debut)}</span></td>
                    <td style={{ padding: '13px 14px' }}><span style={{ fontSize: '12px', color: C.textLight, whiteSpace: 'nowrap' as const }}>{r.date_fin ? formatDateForDisplay(r.date_fin) : 'N/A'}</span></td>
                    <td style={{ padding: '13px 14px' }}><StatutBadge statut={r.statut} /></td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                        <button onClick={() => ouvrirEdition(r)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${C.teal}`, background: C.tealLight, color: C.teal, fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>✏️ MODIFIER</button>
                        <div style={{ position: 'relative' }}>
                          <button onClick={() => setMenuOuvert(menuOuvert === r.id ? null : r.id)}
                            style={{ padding: '5px 8px', borderRadius: '6px', border: `1px solid ${C.border}`, background: '#fff', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>⋮</button>
                          {menuOuvert === r.id && (
                            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', background: '#fff', borderRadius: '8px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '130px', overflow: 'hidden' }}>
                              <button onClick={() => { setMenuOuvert(null); supprimerReduction(r.id); }}
                                style={{ width: '100%', padding: '10px 14px', border: 'none', background: '#fff', color: C.red, fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🗑️ Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </SectionCard>

      </div>

      {modalOpen && (
        <ModalReduction
          modeEdit={modeEdit}
          form={form}
          setF={setF}
          onClose={() => setModalOpen(false)}
          onSave={enregistrer}
          loading={loading}
        />
      )}
    </React.Fragment>
  );
}