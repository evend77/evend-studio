// CHEMIN : src/pages/collaborateur/CollaborateurReductions.tsx
// e-Vend Studio — Dashboard collaborateur : réductions et codes promo
// Adapté de ReductionsRabais.tsx (e-Vend). API : /api/collab/:gestionnaireId/reductions

import React, { useState, useEffect, useCallback } from 'react';

interface Reduction {
  id: number; code: string; type: 'pourcentage' | 'montant'; valeur: string; montant_minimum: string;
  date_debut: string | null; date_fin: string | null; utilisations_max: number | null; utilisations: number;
  actif: boolean; etat: 'actif' | 'inactif' | 'expire' | 'planifie' | 'epuise';
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const ETATS: Record<string, { l: string; bg: string; c: string }> = {
  actif: { l: 'Actif', bg: '#E9F7EF', c: '#1E8449' }, inactif: { l: 'Désactivé', bg: '#f3f4f6', c: '#6b7280' },
  expire: { l: 'Expiré', bg: '#FDECEA', c: '#C0392B' }, planifie: { l: 'Planifié', bg: '#EAF2F8', c: '#2874A6' },
  epuise: { l: 'Épuisé', bg: '#FEF9E7', c: '#B7950B' },
};
const VIDE = { code: '', type: 'pourcentage', valeur: '', montant_minimum: '', date_debut: '', date_fin: '', utilisations_max: '', actif: true };
const jour = (d: string | null) => (d ? d.slice(0, 10) : '');

export default function CollaborateurReductions({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/reductions`;
  const [liste, setListe] = useState<Reduction[]>([]);
  const [chargement, setChargement] = useState(true);
  const [form, setForm] = useState<typeof VIDE | null>(null);
  const [edition, setEdition] = useState<number | null>(null);
  const [aSupprimer, setASupprimer] = useState<Reduction | null>(null);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await fetch(base, { credentials: 'include' });
      if (res.ok) setListe(await res.json());
      else setErreur((await res.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base]);
  useEffect(() => { charger(); }, [charger]);

  const ouvrir = (r?: Reduction) => {
    setErreur('');
    setEdition(r ? r.id : null);
    setForm(r ? {
      code: r.code, type: r.type, valeur: String(Number(r.valeur)), montant_minimum: Number(r.montant_minimum) ? String(Number(r.montant_minimum)) : '',
      date_debut: jour(r.date_debut), date_fin: jour(r.date_fin), utilisations_max: r.utilisations_max === null ? '' : String(r.utilisations_max), actif: r.actif,
    } : { ...VIDE });
  };

  const enregistrer = async () => {
    if (!form) return;
    setOccupe(true); setErreur('');
    try {
      const res = await fetch(edition ? `${base}/${edition}` : base, {
        method: edition ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (res.ok) { setForm(null); await charger(); }
      else setErreur((await res.json().catch(() => ({}))).error || 'Enregistrement impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const basculer = async (r: Reduction) => {
    await fetch(`${base}/${r.id}/actif`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actif: !r.actif }) });
    charger();
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    await fetch(`${base}/${aSupprimer.id}`, { method: 'DELETE', credentials: 'include' });
    setASupprimer(null); charger();
  };

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', fontSize: 14, outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase', marginBottom: 5 };
  const petit = (c: string): React.CSSProperties => ({ background: 'none', border: `1px solid ${c}`, color: c, borderRadius: 6, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' });

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>🏷️ Réductions et codes promo</h2>
        <button onClick={() => ouvrir()} style={{ background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>➕ Nouveau code</button>
      </div>

      {erreur && !form && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {liste.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>🏷️</div><p style={{ fontWeight: 700, color: T.text }}>Aucun code promo</p>
          <p style={{ fontSize: 13 }}>Créez un code pour offrir un rabais à vos clients.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
          {liste.map(r => {
            const e = ETATS[r.etat] || ETATS.actif;
            return (
              <div key={r.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, opacity: r.etat === 'actif' ? 1 : 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <code style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: 1 }}>{r.code}</code>
                  <span style={{ background: e.bg, color: e.c, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{e.l}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>
                  {r.type === 'pourcentage' ? `${Number(r.valeur)} %` : `${Number(r.valeur).toFixed(2)} $`} <span style={{ fontSize: 12, color: T.light, fontWeight: 400 }}>de rabais</span>
                </div>
                <div style={{ fontSize: 12, color: T.light, margin: '6px 0 12px', lineHeight: 1.6 }}>
                  {Number(r.montant_minimum) > 0 && <div>Achat minimum : {Number(r.montant_minimum).toFixed(2)} $</div>}
                  {(r.date_debut || r.date_fin) && <div>{jour(r.date_debut) || '…'} → {jour(r.date_fin) || '…'}</div>}
                  <div>Utilisé {r.utilisations}{r.utilisations_max ? ` / ${r.utilisations_max}` : ''} fois</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => ouvrir(r)} style={petit(accent)}>✏️ Modifier</button>
                  <button onClick={() => basculer(r)} style={petit(T.light)}>{r.actif ? '⏸ Désactiver' : '▶ Activer'}</button>
                  <button onClick={() => setASupprimer(r)} style={petit(T.danger)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setForm(null); }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', color: T.text }}>{edition ? 'Modifier le code' : 'Nouveau code promo'}</h3>
            {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}
            <label style={lbl}>Code *</label>
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={30} placeholder="ETE10" style={{ ...champ, marginBottom: 12, textTransform: 'uppercase' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div><label style={lbl}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={champ}>
                  <option value="pourcentage">Pourcentage (%)</option><option value="montant">Montant fixe ($)</option>
                </select></div>
              <div><label style={lbl}>Valeur *</label><input type="number" min="0" step="0.01" value={form.valeur} onChange={e => setForm({ ...form, valeur: e.target.value })} style={champ} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div><label style={lbl}>Début</label><input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} style={champ} /></div>
              <div><label style={lbl}>Fin</label><input type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} style={champ} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div><label style={lbl}>Achat minimum ($)</label><input type="number" min="0" step="0.01" value={form.montant_minimum} onChange={e => setForm({ ...form, montant_minimum: e.target.value })} style={champ} /></div>
              <div><label style={lbl}>Utilisations max</label><input type="number" min="1" step="1" value={form.utilisations_max} onChange={e => setForm({ ...form, utilisations_max: e.target.value })} placeholder="Illimité" style={champ} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
              <input type="checkbox" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} /> Code actif
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setForm(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe || !form.code || !form.valeur} onClick={enregistrer} style={{ flex: 1, padding: 10, border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>{occupe ? '⏳…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {aSupprimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px', color: T.text }}>Supprimer le code {aSupprimer.code} ?</h3>
            <p style={{ color: T.light, fontSize: 13, margin: '0 0 16px' }}>Cette action est définitive.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setASupprimer(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={supprimer} style={{ flex: 1, padding: 10, border: 'none', background: T.danger, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}