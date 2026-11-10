// CHEMIN : src/pages/gestionnaire/StudioMVQuestions.tsx
// e-Vend Studio — Multi-vendeur : modération des « Questions sur le produit » de toute la marketplace (add-on).
// API : /api/studio/mv/:gid/(collaborateurs|questions) — masquer / rétablir / ignorer les signalements / supprimer

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

interface Question {
  id: number; produit_id: number; produit_titre: string | null; produit_photo?: string | null; produit_sku?: string | null; produit_prix?: number | string | null; produit_stock?: number | null; boutique: string | null; question: string; reponse: string | null; reponse_le: string | null;
  statut: 'attente' | 'publiee' | 'masquee'; masque_raison: string | null; masque_par: string | null; signalements: number; created_at: string; acheteur: string;
}
interface Reponse { addon_actif?: boolean; questions: Question[]; total: number; page: number; pages: number; stats: { total: number; attente: number; publiees: number; masquees: number; signalees: number } }

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const quand = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const champ: React.CSSProperties = { padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit' };
const STATUTS: Record<string, { label: string; couleur: string }> = {
  attente: { label: 'Sans réponse', couleur: C.orange }, publiee: { label: 'Publiée', couleur: C.green }, masquee: { label: 'Masquée', couleur: C.red },
};

const StudioMVQuestions: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/mv/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [collabs, setCollabs] = useState<{ id: number; nom_boutique: string }[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [statut, setStatut] = useState(''); const [collab, setCollab] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [aMasquer, setAMasquer] = useState<Question | null>(null);
  const [raison, setRaison] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { const t = setTimeout(() => { setQEff(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { fetch(`${base}/collaborateurs`, { credentials: 'include', headers: entetes() }).then(r => r.ok ? r.json() : []).then(setCollabs).catch(() => {}); }, [base]);

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page) });
      if (statut) p.set('statut', statut);
      if (qEff) p.set('q', qEff);
      if (collab) p.set('collaborateur_id', collab);
      const r = await fetch(`${base}/questions?${p}`, { credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base, page, qEff, statut, collab]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3500); };
  const agir = async (chemin: string, methode: string, corps: object | undefined, ok: string) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}${chemin}`, { method: methode, credentials: 'include', headers: entetes(), body: corps ? JSON.stringify(corps) : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Erreur');
      flash(ok); charger(); window.dispatchEvent(new Event('questions-maj'));
      return true;
    } catch (e: any) { setErreur(e.message || 'Erreur'); return false; }
    finally { setOccupe(false); }
  };

  const masquer = async () => {
    if (!aMasquer) return;
    if (raison.trim().length < 3) { setErreur('Indiquez la raison (au moins 3 caractères).'); return; }
    if (await agir(`/questions/${aMasquer.id}/masquer`, 'POST', { raison }, 'Question masquée.')) { setAMasquer(null); setRaison(''); }
  };
  const supprimer = (x: Question) => { if (window.confirm('Supprimer définitivement cette question ?')) agir(`/questions/${x.id}`, 'DELETE', undefined, 'Question supprimée.'); };

  const s = data?.stats;
  const btn = (couleur: string): React.CSSProperties => ({ padding: '7px 13px', borderRadius: 8, border: `1px solid ${couleur}`, background: '#fff', color: couleur, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' });

  if (data && data.addon_actif === false && data.stats.total === 0) {
    return <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>L'option « Questions sur le produit » n'est pas activée. Activez-la dans « Mon plan & limites ».</div>;
  }

  return (
    <div style={{ padding: '4px 0 40px', maxWidth: 1100 }}>
      <h2 style={{ margin: '0 0 4px', color: C.text }}>💬 Questions sur les produits</h2>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: C.textLight }}>Les acheteurs posent leurs questions, les vendeurs répondent, et seules les questions répondues sont visibles sur les annonces. Ici, vous modérez.</p>

      {message && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontWeight: 600, marginBottom: 12 }}>{message}</div>}
      {erreur && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontWeight: 600, marginBottom: 12 }}>{erreur}</div>}

      {s && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 16 }}>
          {[{ l: 'Total', v: s.total, c: C.text }, { l: 'Sans réponse', v: s.attente, c: C.orange }, { l: 'Publiées', v: s.publiees, c: C.green }, { l: 'Signalées', v: s.signalees, c: C.red }, { l: 'Masquées', v: s.masquees, c: C.textLight }].map(x => (
            <div key={x.l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: x.c }}>{x.v}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>{x.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher (question, réponse, annonce)…" style={{ ...champ, flex: 1, minWidth: 220 }} />
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={champ}>
          <option value="">Tous les statuts</option><option value="signalees">⚠️ Signalées</option><option value="attente">Sans réponse</option><option value="publiee">Publiées</option><option value="masquee">Masquées</option>
        </select>
        <select value={collab} onChange={e => { setCollab(e.target.value); setPage(1); }} style={champ}>
          <option value="">Toutes les boutiques</option>{collabs.map(c => <option key={c.id} value={c.id}>{c.nom_boutique}</option>)}
        </select>
      </div>

      {chargement && !data ? <div style={{ padding: 30, textAlign: 'center', color: C.textLight }}>Chargement…</div>
        : !data || data.questions.length === 0 ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 30, textAlign: 'center', color: C.textLight }}>Aucune question.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.questions.map(x => {
              const st = STATUTS[x.statut];
              return (
                <div key={x.id} style={{ background: C.card, border: `1px solid ${x.statut === 'publiee' && x.signalements > 0 ? C.red : C.border}`, borderLeft: `4px solid ${st.couleur}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontSize: 12, color: C.textLight, marginBottom: 6 }}>
                    <span style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                      {x.produit_photo
                        ? <img src={x.produit_photo} alt="" loading="lazy" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}`, flexShrink: 0 }} />
                        : <span style={{ width: 44, height: 44, borderRadius: 8, border: `1px solid ${C.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>📦</span>}
                      <span style={{ minWidth: 0 }}>
                        <b style={{ color: C.text }}>{x.produit_titre || 'Annonce supprimée'}</b>{x.produit_sku ? ` · SKU ${x.produit_sku}` : ''}
                        <br />{x.boutique || '—'} · {x.acheteur} · {quand(x.created_at)}
                      </span>
                    </span>
                    <span>
                      <b style={{ color: st.couleur }}>{st.label}</b>
                      {x.signalements > 0 && <b style={{ color: C.red }}> · ⚠️ {x.signalements} signalement{x.signalements > 1 ? 's' : ''}</b>}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>« {x.question} »</div>
                  {x.reponse && <div style={{ marginTop: 8, padding: '9px 12px', background: '#f0fdf4', borderRadius: 8, fontSize: 14, color: C.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><div style={{ fontSize: 11, color: C.textLight }}>Réponse du vendeur · {quand(x.reponse_le)}</div>{x.reponse}</div>}
                  {x.statut === 'masquee' && <div style={{ marginTop: 8, fontSize: 12, color: C.red }}>Masquée par {x.masque_par === 'gestionnaire' ? 'vous' : 'le vendeur'}{x.masque_raison ? ` : ${x.masque_raison}` : ''}</div>}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {x.statut !== 'masquee' && <button disabled={occupe} onClick={() => { setAMasquer(x); setRaison(''); setErreur(''); }} style={btn(C.orange)}>🚫 Masquer</button>}
                    {x.statut === 'masquee' && <button disabled={occupe} onClick={() => agir(`/questions/${x.id}/retablir`, 'POST', undefined, 'Question rétablie.')} style={btn(C.green)}>↩️ Rétablir</button>}
                    {x.statut === 'publiee' && x.signalements > 0 && <button disabled={occupe} onClick={() => agir(`/questions/${x.id}/ignorer-signalements`, 'POST', undefined, 'Signalements ignorés.')} style={btn(C.textLight)}>Ignorer les signalements</button>}
                    <button disabled={occupe} onClick={() => supprimer(x)} style={btn(C.red)}>🗑️ Supprimer</button>
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

      {aMasquer && (
        <div onClick={() => setAMasquer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: '100%', maxWidth: 460 }}>
            <h3 style={{ margin: '0 0 8px', color: C.text }}>Masquer cette question</h3>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: C.textLight }}>« {aMasquer.question.slice(0, 120)}{aMasquer.question.length > 120 ? '…' : ''} »</p>
            <input autoFocus value={raison} onChange={e => setRaison(e.target.value)} placeholder="Raison (ex. contenu inapproprié, spam)" style={{ ...champ, width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setAMasquer(null)} style={{ ...champ, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe} onClick={masquer} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.orange, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Masquer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioMVQuestions;