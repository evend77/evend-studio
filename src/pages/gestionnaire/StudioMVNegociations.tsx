// CHEMIN : src/pages/gestionnaire/StudioMVNegociations.tsx
// e-Vend Studio — Multi-vendeur : « Faire une offre » (add-on). Le gestionnaire règle la validité d'une offre acceptée / contre-offre
// et suit les négociations de tous ses collaborateurs (lecture seule).
// API : /api/studio/mv/:gid/negociations (GET) · /negociations/config (PUT)

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

interface Nego { id: number; titre: string; variante: string; photo: string | null; boutique: string | null; etat: string; prix_produit: number; prix_offert: number; prix_contre: number | null; prix_final: number | null; cree: string; expire: string }
interface Reponse { addon_actif: boolean; validite_heures: number; negociations: Nego[]; total: number; page: number; pages: number; stats: { en_cours: number; acceptees: number; payees: number; total: number } }

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const quand = (d: string) => { try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const $$ = (n: number | null) => (n === null ? '—' : `${Number(n).toFixed(2)} $`);
const champ: React.CSSProperties = { padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit' };
const ETATS: Record<string, { label: string; couleur: string }> = {
  attente: { label: '⏳ En attente du vendeur', couleur: C.orange }, contre: { label: '💬 Contre-offre', couleur: '#3b82f6' }, acceptee: { label: '✅ Acceptée', couleur: C.green },
  payee: { label: '🛍️ Vendue', couleur: C.green }, refusee: { label: 'Refusée', couleur: C.textLight }, annulee: { label: 'Retirée', couleur: C.textLight }, expiree: { label: 'Expirée', couleur: C.textLight },
};

const StudioMVNegociations: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/mv/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [etat, setEtat] = useState('');
  const [heures, setHeures] = useState('48');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setQEff(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page) }); if (etat) p.set('etat', etat); if (qEff) p.set('q', qEff);
      const r = await fetch(`${base}/negociations?${p}`, { credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j); setHeures(String(j.validite_heures));
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base, page, etat, qEff]);
  useEffect(() => { charger(); }, [charger]);

  const enregistrer = async () => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}/negociations/config`, { method: 'PUT', credentials: 'include', headers: entetes(), body: JSON.stringify({ validite_heures: Number(heures) }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Erreur');
      setMessage('Validité enregistrée.'); setTimeout(() => setMessage(''), 3500); charger();
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };

  const chip = (id: string, label: string, n?: number) => (
    <button key={id || 'tous'} onClick={() => { setEtat(id); setPage(1); }}
      style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${etat === id ? C.accent : C.border}`, background: etat === id ? `${C.accent}22` : '#fff', color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
      {label}{n !== undefined ? ` (${n})` : ''}
    </button>
  );

  if (data && !data.addon_actif) return <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>L'option « Faire une offre » n'est pas activée. Activez-la dans « Mon plan &amp; limites ».</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: C.text }}>🤝 Faire une offre</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: C.textLight }}>Les négociations de prix entre vos acheteurs et vos collaborateurs. Chaque collaborateur choisit s'il accepte les offres et son pourcentage minimum. Aucune réservation de stock.</p>
      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>⏱️ Validité d'une offre acceptée ou d'une contre-offre</div>
          <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>Temps accordé à l'acheteur pour payer (ou répondre à une contre-offre). Entre 1 et 336 heures. Défaut : 48 h.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" min={1} max={336} value={heures} onChange={e => setHeures(e.target.value)} style={{ ...champ, width: 80 }} />
          <span style={{ fontSize: 14, color: C.text }}>heures</span>
          <button disabled={occupe} onClick={enregistrer} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Enregistrer</button>
        </div>
      </div>

      {data && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {[['En cours', data.stats.en_cours], ['Acceptées (à payer)', data.stats.acceptees], ['Vendues', data.stats.payees], ['Total', data.stats.total]].map(([l, n]) => (
          <div key={String(l)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', minWidth: 110 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{n}</div><div style={{ fontSize: 12, color: C.textLight }}>{l}</div>
          </div>))}
      </div>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {chip('', 'Toutes')}{chip('attente', 'En attente')}{chip('contre', 'Contre-offres')}{chip('acceptee', 'Acceptées')}{chip('payee', 'Vendues')}{chip('refusee', 'Refusées')}{chip('expiree', 'Expirées')}
      </div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un produit…" style={{ ...champ, width: '100%', maxWidth: 420, boxSizing: 'border-box', marginBottom: 14 }} />

      {chargement && !data ? <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>Chargement…</div>
        : !data || data.negociations.length === 0 ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 30, textAlign: 'center', color: C.textLight }}>Aucune négociation.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.negociations.map(n => {
              const st = ETATS[n.etat] || ETATS.refusee;
              return (
                <div key={n.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${st.couleur}`, borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {n.photo ? <img src={n.photo} alt="" loading="lazy" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} />
                    : <div style={{ width: 48, height: 48, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</div>}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{n.titre}{n.variante ? ` — ${n.variante}` : ''}</div>
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{n.boutique || '—'} · prix {$$(n.prix_produit)} · offre <b style={{ color: C.text }}>{$$(n.prix_offert)}</b>
                      {n.prix_contre !== null ? ` · contre ${$$(n.prix_contre)}` : ''}{n.prix_final !== null ? ` · convenu ${$$(n.prix_final)}` : ''}</div>
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}><b style={{ color: st.couleur }}>{st.label}</b> · {quand(n.cree)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>← Précédent</button>
          <span style={{ fontSize: 12, color: C.textLight }}>Page {data.page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: page >= data.pages ? 'not-allowed' : 'pointer' }}>Suivant →</button>
        </div>
      )}
    </div>
  );
};

export default StudioMVNegociations;