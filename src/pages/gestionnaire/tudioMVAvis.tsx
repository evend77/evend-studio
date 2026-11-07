// CHEMIN : src/pages/gestionnaire/StudioMVAvis.tsx
// e-Vend Studio — Multi-vendeur : modération des avis clients de toute la marketplace.
// API : /api/studio/mv/:gid/(collaborateurs|avis)  — approuver / refuser (masquer) / rétablir

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', blue: '#3b82f6', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

interface Avis {
  id: number; note: number; titre: string | null; commentaire: string | null; approuve: boolean; masque_raison: string | null; masque_le: string | null;
  reponse: string | null; created_at: string; commande_id: number | null; numero_commande: string | null;
  boutique: string | null; acheteur_nom: string; acheteur_email: string | null;
  approbateur: string | null; masque_par: string | null;
  criteres?: { delai_respecte?: boolean | null; communication?: number | null; emballage?: number | null }; photos?: string[];
}
interface Reponse { avis: Avis[]; total: number; page: number; pages: number; stats: { total: number; publies: number; attente: number; chez_collab: number; masques: number; moyenne: number } }

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const quand = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const champ: React.CSSProperties = { padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit' };
const enAttente = (a: Avis) => !a.approuve && !a.masque_le;
const Etoiles = ({ note }: { note: number }) => <span style={{ color: C.orange, fontSize: 14, letterSpacing: 1 }}>{'★'.repeat(note)}<span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - note)}</span></span>;

const StudioMVAvis: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/mv/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [collabs, setCollabs] = useState<{ id: number; nom_boutique: string }[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [note, setNote] = useState(''); const [statut, setStatut] = useState('tous'); const [collab, setCollab] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [aMasquer, setAMasquer] = useState<Avis | null>(null);
  const [raison, setRaison] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { const t = setTimeout(() => { setQEff(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { fetch(`${base}/collaborateurs`, { credentials: 'include', headers: entetes() }).then(r => r.ok ? r.json() : []).then(setCollabs).catch(() => {}); }, [base]);

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const p = new URLSearchParams({ page: String(page), statut });
      if (qEff) p.set('q', qEff);
      if (note) p.set('note', note);
      if (collab) p.set('collaborateur_id', collab);
      const r = await fetch(`${base}/avis?${p}`, { credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur de chargement');
      setData(j);
    } catch (e: any) { setErreur(e.message || 'Erreur de chargement'); }
    finally { setChargement(false); }
  }, [base, page, qEff, note, statut, collab]);
  useEffect(() => { charger(); }, [charger]);

  const flash = (m: string) => { setMessage(m); setTimeout(() => setMessage(''), 3500); };

  const masquer = async () => {
    if (!aMasquer) return;
    if (raison.trim().length < 5) { setErreur('Indiquez la raison (au moins 5 caractères).'); return; }
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}/avis/${aMasquer.id}/masquer`, { method: 'POST', credentials: 'include', headers: entetes(), body: JSON.stringify({ raison }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur');
      const etaitAttente = enAttente(aMasquer);
      setAMasquer(null); setRaison(''); flash(etaitAttente ? 'Avis refusé.' : 'Avis masqué.'); charger(); window.dispatchEvent(new Event('avis-maj'));
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };
  const approuver = async (a: Avis) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}/avis/${a.id}/approuver`, { method: 'POST', credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur');
      flash('Avis publié. Le collaborateur a été prévenu.'); charger(); window.dispatchEvent(new Event('avis-maj'));
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };
  const retablir = async (a: Avis) => {
    setOccupe(true); setErreur('');
    try {
      const r = await fetch(`${base}/avis/${a.id}/retablir`, { method: 'POST', credentials: 'include', headers: entetes() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur');
      flash('Avis rétabli.'); charger(); window.dispatchEvent(new Event('avis-maj'));
    } catch (e: any) { setErreur(e.message || 'Erreur'); }
    finally { setOccupe(false); }
  };

  const s = data?.stats;
  return (
    <div style={{ padding: '28px 32px', color: C.text }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>⭐ Avis clients</h1>
      <p style={{ fontSize: 14, color: C.textLight, margin: '0 0 20px' }}>Tous les avis laissés sur vos boutiques. Approuvez les avis en attente (selon vos réglages dans Config multi → Config vendeur → Gestion des avis) ou masquez un avis abusif : il disparaît de la boutique et du tableau du collaborateur, et vous pouvez le rétablir.</p>

      {s && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          {[{ l: 'Avis au total', v: s.total, c: C.blue }, { l: 'En ligne', v: s.publies, c: C.green }, { l: 'À approuver', v: s.attente, c: C.orange }, ...(s.chez_collab ? [{ l: 'Chez le collaborateur', v: s.chez_collab, c: C.blue }] : []), { l: 'Masqués/refusés', v: s.masques, c: C.red }, { l: 'Note moyenne', v: s.publies ? `${s.moyenne.toFixed(1)} / 5` : '—', c: C.orange }].map(k => (
            <div key={k.l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 18px', minWidth: 130 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.c }}>{k.v}</div>
              <div style={{ fontSize: 12, color: C.textLight, fontWeight: 600 }}>{k.l}</div>
            </div>
          ))}
        </div>
      )}

      {s && s.attente > 0 && statut !== 'attente' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span>⏳ <b>{s.attente}</b> avis attend{s.attente > 1 ? 'ent' : ''} votre approbation avant d'être publié{s.attente > 1 ? 's' : ''}.</span>
          <button onClick={() => { setStatut('attente'); setPage(1); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #f59e0b', background: '#fff', color: '#b45309', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Voir les avis à approuver</button>
        </div>
      )}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : acheteur, courriel, boutique, commentaire…" style={{ ...champ, flex: 1, minWidth: 240 }} />
        <select value={note} onChange={e => { setNote(e.target.value); setPage(1); }} style={champ}>
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
        </select>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={champ}>
          <option value="tous">Tous</option><option value="attente">À approuver</option><option value="chez_collab">Chez le collaborateur</option><option value="publie">En ligne</option><option value="masque">Masqués / refusés</option>
        </select>
        <select value={collab} onChange={e => { setCollab(e.target.value); setPage(1); }} style={champ}>
          <option value="">Toutes les boutiques</option>
          {collabs.map(c => <option key={c.id} value={c.id}>{c.nom_boutique}</option>)}
        </select>
      </div>

      {message && <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontSize: 13, fontWeight: 600 }}>{message}</div>}
      {erreur && !aMasquer && <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontSize: 13 }}>{erreur}</div>}

      {chargement && !data ? (
        <p style={{ color: C.textLight }}>Chargement…</p>
      ) : !data || data.avis.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textLight }}>
          <div style={{ fontSize: 44, opacity: 0.5 }}>⭐</div>
          <p style={{ margin: '8px 0 0', fontWeight: 600 }}>{qEff || note || collab || statut !== 'tous' ? 'Aucun avis avec ces filtres.' : 'Aucun avis pour le moment.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: chargement ? 0.6 : 1 }}>
          {data.avis.map(a => (
            <div key={a.id} style={{ background: C.card, border: `1px solid ${a.approuve ? C.border : enAttente(a) ? '#fde68a' : '#fecaca'}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <Etoiles note={a.note} />
                    <span style={{ fontSize: 12, color: C.textLight }}>{quand(a.created_at)}</span>
                    {enAttente(a) && a.approbateur !== 'collaborateur' && <span style={{ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: '#b45309', background: '#f59e0b24' }}>À approuver</span>}
                    {enAttente(a) && a.approbateur === 'collaborateur' && <span style={{ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: C.blue, background: '#3b82f61f' }}>Chez le collaborateur</span>}
                    {!a.approuve && !enAttente(a) && <span style={{ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: C.red, background: '#ef44441f' }}>Masqué</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>🛒 {a.acheteur_nom}{a.acheteur_email && <span style={{ fontWeight: 400, color: C.textLight }}> ({a.acheteur_email})</span>}</div>
                  <div style={{ fontSize: 12, color: C.textLight, margin: '2px 0 8px' }}>🏪 {a.boutique || 'Boutique'}{a.numero_commande ? ` · Commande ${a.numero_commande}` : ''}</div>
                  {a.titre && <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.titre}</div>}
                  {a.commentaire && <div style={{ fontSize: 13, background: C.bg, borderRadius: 8, padding: '9px 12px', whiteSpace: 'pre-wrap' }}>{a.commentaire}</div>}
                  {a.criteres && ((a.criteres.delai_respecte !== undefined && a.criteres.delai_respecte !== null) || a.criteres.communication || a.criteres.emballage) && (
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: C.textLight, marginTop: 8 }}>
                      {a.criteres.delai_respecte !== undefined && a.criteres.delai_respecte !== null && <span>Délai respecté : {a.criteres.delai_respecte ? '✅ oui' : '❌ non'}</span>}
                      {!!a.criteres.communication && <span>Communication : {a.criteres.communication}/5</span>}
                      {!!a.criteres.emballage && <span>Emballage : {a.criteres.emballage}/5</span>}
                    </div>
                  )}
                  {a.photos && a.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {a.photos.map((u, i) => <a key={i} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt="" loading="lazy" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} /></a>)}
                    </div>
                  )}
                  {a.reponse && <div style={{ fontSize: 12, color: C.textLight, borderLeft: `3px solid ${C.green}`, paddingLeft: 10, marginTop: 8 }}><b style={{ color: C.green }}>Réponse du collaborateur :</b> {a.reponse}</div>}
                  {!a.approuve && a.masque_le && a.masque_raison && <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 8 }}>{a.masque_par === 'collaborateur' ? 'Refusé par le collaborateur' : 'Masqué'} le {quand(a.masque_le)} — {a.masque_raison}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {enAttente(a) && <button disabled={occupe} onClick={() => approuver(a)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: C.green, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Approuver</button>}
                  {a.approuve || enAttente(a)
                    ? <button disabled={occupe} onClick={() => { setAMasquer(a); setRaison(''); setErreur(''); }} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#fff', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{enAttente(a) ? '✕ Refuser' : '🚫 Masquer (abus)'}</button>
                    : <button disabled={occupe} onClick={() => retablir(a)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.green}`, background: '#fff', color: C.green, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>↩ Rétablir</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ ...champ, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>←</button>
          <span style={{ fontSize: 13, color: C.textLight }}>Page {data.page} / {data.pages} · {data.total} avis</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => Math.min(data.pages, p + 1))} style={{ ...champ, cursor: page >= data.pages ? 'not-allowed' : 'pointer', opacity: page >= data.pages ? 0.5 : 1 }}>→</button>
        </div>
      )}

      {aMasquer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => { if (e.target === e.currentTarget && !occupe) setAMasquer(null); }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: 480, maxWidth: '100%' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{enAttente(aMasquer) ? 'Refuser cet avis' : 'Masquer cet avis'}</h3>
            <p style={{ fontSize: 12, color: C.textLight, margin: '0 0 12px' }}>L'avis de <b>{aMasquer.acheteur_nom}</b> ne sera {enAttente(aMasquer) ? 'pas publié' : 'plus visible sur la boutique ni dans le tableau du collaborateur'}. Vous pourrez le rétablir.</p>
            <div style={{ background: C.bg, borderRadius: 8, padding: '9px 12px', marginBottom: 12, fontSize: 13 }}><Etoiles note={aMasquer.note} /> {aMasquer.commentaire ? `— ${aMasquer.commentaire.slice(0, 200)}` : ''}</div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Raison *</label>
            <textarea value={raison} onChange={e => setRaison(e.target.value)} rows={3} maxLength={300} placeholder="Ex. : propos injurieux, avis sans rapport avec la commande…" style={{ ...champ, width: '100%', boxSizing: 'border-box', resize: 'vertical', marginBottom: 6 }} />
            {erreur && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 8 }}>{erreur}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button disabled={occupe} onClick={() => setAMasquer(null)} style={{ ...champ, cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button disabled={occupe} onClick={masquer} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.red, color: '#fff', fontWeight: 700, cursor: occupe ? 'not-allowed' : 'pointer', opacity: occupe ? 0.6 : 1 }}>{occupe ? 'En cours…' : enAttente(aMasquer) ? 'Refuser' : 'Masquer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioMVAvis;