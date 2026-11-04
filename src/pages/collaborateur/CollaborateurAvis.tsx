// CHEMIN : src/pages/collaborateur/CollaborateurAvis.tsx
// e-Vend Studio — Dashboard collaborateur : mes avis clients (consulter et répondre)
// Adapté de MesAvis.tsx (e-Vend). API : /api/collab/:gestionnaireId/avis

import React, { useState, useEffect, useCallback } from 'react';

interface Avis {
  id: number; note: number; titre: string | null; commentaire: string | null; reponse: string | null; reponse_le: string | null;
  created_at: string; produit_titre: string | null; acheteur_prenom: string | null; acheteur_initiale: string;
}
interface Reponse {
  avis: Avis[]; total: number; page: number; pages: number;
  stats: { moyenne: number; total: number; repartition: Record<string, number> };
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280' };
const etoiles = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
const dateCourte = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };

export default function CollaborateurAvis({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/avis`;
  const [data, setData] = useState<Reponse | null>(null);
  const [page, setPage] = useState(1);
  const [note, setNote] = useState(0);
  const [sansReponse, setSansReponse] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [edition, setEdition] = useState<{ id: number; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (note) p.set('note', String(note)); if (sansReponse) p.set('sans_reponse', '1');
    try {
      const res = await fetch(`${base}?${p}`, { credentials: 'include' });
      if (res.ok) { setData(await res.json()); setErreur(''); } else setErreur((await res.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, note, sansReponse]);
  useEffect(() => { charger(); }, [charger]);

  const repondre = async () => {
    if (!edition) return;
    setOccupe(true);
    try {
      const res = await fetch(`${base}/${edition.id}/reponse`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reponse: edition.texte }) });
      if (res.ok) { setEdition(null); await charger(); } else setErreur((await res.json().catch(() => ({}))).error || 'Envoi impossible');
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  const champ: React.CSSProperties = { border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none' };
  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;
  const s = data?.stats;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 20, color: T.text }}>⭐ Mes avis clients</h2>

      <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 14, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', minWidth: 110 }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: T.text }}>{s && s.total ? s.moyenne.toFixed(1) : '—'}</div>
          <div style={{ color: '#F5B301', fontSize: 16 }}>{etoiles(Math.round(s?.moyenne || 0))}</div>
          <div style={{ fontSize: 12, color: T.light }}>{s?.total || 0} avis</div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {[5, 4, 3, 2, 1].map(n => {
            const nb = s?.repartition[n] || 0; const pct = s && s.total ? (nb / s.total) * 100 : 0;
            return (
              <div key={n} onClick={() => { setNote(note === n ? 0 : n); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, cursor: 'pointer', fontSize: 12, opacity: note && note !== n ? 0.4 : 1 }}>
                <span style={{ width: 28 }}>{n} ★</span>
                <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4 }}><div style={{ width: `${pct}%`, height: 8, background: accent, borderRadius: 4 }} /></div>
                <span style={{ width: 26, textAlign: 'right', color: T.light }}>{nb}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={sansReponse} onChange={e => { setSansReponse(e.target.checked); setPage(1); }} /> Sans réponse seulement
        </label>
        {(note > 0 || sansReponse) && <button onClick={() => { setNote(0); setSansReponse(false); setPage(1); }} style={{ ...champ, cursor: 'pointer', background: '#fff' }}>Effacer les filtres</button>}
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {!data || data.avis.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>⭐</div><p style={{ fontWeight: 700, color: T.text }}>Aucun avis pour le moment</p>
        </div>
      ) : data.avis.map(a => (
        <div key={a.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 18, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ color: '#F5B301', fontSize: 16 }}>{etoiles(a.note)}</span>
            <span style={{ fontSize: 12, color: T.light }}>{(a.acheteur_prenom || 'Client')} {a.acheteur_initiale && `${a.acheteur_initiale}.`} · {dateCourte(a.created_at)}</span>
          </div>
          {a.produit_titre && <div style={{ fontSize: 12, color: T.light, marginTop: 4 }}>Produit : {a.produit_titre}</div>}
          {a.titre && <div style={{ fontWeight: 700, color: T.text, marginTop: 8 }}>{a.titre}</div>}
          {a.commentaire && <p style={{ fontSize: 14, color: T.text, margin: '6px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.commentaire}</p>}

          {a.reponse && edition?.id !== a.id && (
            <div style={{ background: '#f8fafc', borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: '8px 12px', margin: '10px 0 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.light }}>Votre réponse{a.reponse_le && ` · ${dateCourte(a.reponse_le)}`}</div>
              <p style={{ fontSize: 13, margin: '4px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{a.reponse}</p>
            </div>
          )}

          {edition?.id === a.id ? (
            <div style={{ marginTop: 10 }}>
              <textarea value={edition.texte} onChange={e => setEdition({ id: a.id, texte: e.target.value })} maxLength={1000} rows={3} placeholder="Votre réponse publique…"
                style={{ ...champ, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setEdition(null)} style={{ ...champ, cursor: 'pointer', background: '#fff' }}>Annuler</button>
                <button disabled={occupe} onClick={repondre} style={{ padding: '9px 16px', border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  {occupe ? '⏳…' : edition.texte.trim() ? 'Publier la réponse' : 'Retirer la réponse'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEdition({ id: a.id, texte: a.reponse || '' })} style={{ marginTop: 10, border: `1px solid ${accent}`, color: accent, background: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {a.reponse ? '✏️ Modifier ma réponse' : '💬 Répondre'}
            </button>
          )}
        </div>
      ))}

      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: T.light, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} avis · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}
    </div>
  );
}