// CHEMIN : src/pages/gestionnaire/StudioMVOffres.tsx
// e-Vend Studio — Multi-vendeur : « Offres du jour » (add-on). Le gestionnaire règle la durée maximale d'une offre,
// voit les offres de tous ses collaborateurs et peut en retirer une.
// API : /api/studio/mv/:gid/offres (GET) · /offres/config (PUT) · /offres/:produitId/retirer (POST)

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

type Etat = 'venir' | 'cours' | 'terminee';
interface Offre { produit_id: number; titre: string; sku: string | null; photo: string | null; prix: number; boutique: string | null; etat: Etat; offre_prix: number; debut: string; fin: string }
interface Reponse { addon_actif: boolean; duree_max_jours: number; offres: Offre[]; total: number; page: number; pages: number; stats: { cours: number; venir: number; terminee: number } }

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const quand = (d: string) => { try { return new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
const $$ = (n: number) => `${Number(n).toFixed(2)} $`;
const champ: React.CSSProperties = { padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit' };
const ETATS: Record<Etat, { label: string; couleur: string }> = { cours: { label: '🔥 En cours', couleur: C.green }, venir: { label: '🗓️ À venir', couleur: C.orange }, terminee: { label: 'Terminée', couleur: C.textLight } };

const StudioMVOffres: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/mv/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [etat, setEtat] = useState('');
  const [jours, setJours] = useState('7');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [message, setMessage] = useState('');
  const [occupe, setOccupe] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setQEff(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (etat) p.set('etat', etat);
      if (qEff) p.set('q', qEff);
      const r = await fetch(`${base}/offres?${p}`, { credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j); setJours(String(j.duree_max_jours));
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base, page, etat, qEff]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3500); };
  const agir = async (chemin: string, methode: string, corps: object | undefined, ok: string) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}${chemin}`, { method: methode, credentials: 'include', headers: entetes(), body: corps ? JSON.stringify(corps) : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Erreur');
      flash(ok); charger();
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };

  const chip = (id: string, label: string, n?: number) => (
    <button key={id || 'tous'} onClick={() => { setEtat(id); setPage(1); }}
      style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${etat === id ? C.accent : C.border}`, background: etat === id ? `${C.accent}22` : '#fff', color: C.text, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
      {label}{n !== undefined ? ` (${n})` : ''}
    </button>
  );

  if (data && !data.addon_actif) return <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>L'option « Offres du jour » n'est pas activée. Activez-la dans « Mon plan &amp; limites ».</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 24, color: C.text }}>🔥 Offres du jour</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: C.textLight }}>Les offres programmées par vos collaborateurs. Le prix s'applique et se termine à la seconde exacte, sans aucune action de votre part.</p>

      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>⏱️ Durée maximale d'une offre</div>
          <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>Empêche les « fausses promotions » qui ne finissent jamais. Entre 1 et 60 jours.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" min={1} max={60} value={jours} onChange={e => setJours(e.target.value)} style={{ ...champ, width: 80 }} />
          <span style={{ fontSize: 14, color: C.text }}>jours</span>
          <button disabled={occupe} onClick={() => agir('/offres/config', 'PUT', { duree_max_jours: Number(jours) }, 'Durée maximale enregistrée.')}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Enregistrer</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {chip('', 'Toutes')}
        {chip('cours', 'En cours', data?.stats.cours)}
        {chip('venir', 'À venir', data?.stats.venir)}
        {chip('terminee', 'Terminées', data?.stats.terminee)}
      </div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un produit (titre ou SKU)…" style={{ ...champ, width: '100%', maxWidth: 420, boxSizing: 'border-box', marginBottom: 14 }} />

      {chargement && !data ? <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>Chargement…</div>
        : !data || data.offres.length === 0 ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 30, textAlign: 'center', color: C.textLight }}>Aucune offre.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.offres.map(o => {
              const st = ETATS[o.etat];
              const pct = o.prix > 0 ? Math.round(((o.prix - o.offre_prix) / o.prix) * 100) : 0;
              return (
                <div key={o.produit_id} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${st.couleur}`, borderRadius: 12, padding: 14, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {o.photo ? <img src={o.photo} alt="" loading="lazy" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} />
                    : <div style={{ width: 48, height: 48, borderRadius: 8, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</div>}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{o.titre}{o.sku ? <span style={{ fontWeight: 600, color: C.textLight }}> · SKU {o.sku}</span> : null}</div>
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{o.boutique || '—'} · {$$(o.prix)} → <b style={{ color: C.text }}>{$$(o.offre_prix)}</b>{pct > 0 ? ` (−${pct} %)` : ''}</div>
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}><b style={{ color: st.couleur }}>{st.label}</b> · {quand(o.debut)} → {quand(o.fin)}</div>
                  </div>
                  <button disabled={occupe} onClick={() => { if (window.confirm(`Retirer l'offre de « ${o.titre} » ? Le prix redevient normal tout de suite.`)) agir(`/offres/${o.produit_id}/retirer`, 'POST', {}, 'Offre retirée.'); }}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#fff', color: C.red, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Retirer</button>
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

export default StudioMVOffres;