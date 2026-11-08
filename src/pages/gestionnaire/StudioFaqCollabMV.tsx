/**
 * CHEMIN : src/pages/gestionnaire/StudioFaqCollabMV.tsx
 * StudioFaqCollabMV.tsx — e-Vend Studio (Multi-vendeur)
 *
 * Modération des FAQ des collaborateurs (table collab_faq). Add-on « FAQ collaborateurs » requis.
 * API : /api/studio-forfaits/mv/faq — tableau groupé par collaborateur, menu ⋮ par question
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

interface FaqItem {
  id: number; question: string; reponse: string;
  active: boolean;
  ordre: number; created_at: string;
  collaborateur_id: number; collaborateur_nom: string;
  collaborateur_email: string; nom_boutique: string;
}

interface CollaborateurGroup {
  id: number; nom: string; email: string; boutique: string;
  faqs: FaqItem[];
}

const C = {
  bg: '#f4f6f8', card: '#fff', border: '#e2e8f0',
  gold: '#c9a96e', goldLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', greenLight: 'rgba(16,185,129,0.1)',
  red: '#ef4444', redLight: 'rgba(239,68,68,0.1)',
  orange: '#f59e0b', orangeLight: 'rgba(245,158,11,0.1)',
  blue: '#3b82f6', blueLight: 'rgba(59,130,246,0.1)',
  text: '#1e293b', textLight: '#64748b', textXLight: '#94a3b8', border2: '#cbd5e1',
};

function statutStyle(active: boolean) {
  return active ? { bg: C.greenLight, color: C.green, label: '✅ Visible' } : { bg: C.redLight, color: C.red, label: '🔴 Masquée' };
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: value ? C.green : '#d1d5db', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '2px', left: value ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: 'ok'|'err' }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: type === 'ok' ? C.green : C.red, color: '#fff', padding: '11px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, zIndex: 9999, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', whiteSpace: 'nowrap' }}>
      {type === 'ok' ? '✅ ' : '❌ '}{msg}
    </div>
  );
}

function MenuTroisPoints({ faq, onStatut, onSupprimer }: {
  faq: FaqItem;
  onStatut: (id: number, active: boolean) => void;
  onSupprimer: (f: FaqItem) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { active: true,  label: '✅ Rendre visible', show: !faq.active },
    { active: false, label: '🔴 Masquer',        show: faq.active },
  ].filter(o => o.show);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOuvert(!ouvert)} style={{ width: '32px', height: '32px', border: `1px solid ${C.border}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}>⋮</button>
      {ouvert && (
        <div style={{ position: 'absolute', right: 0, top: '36px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '200px', overflow: 'hidden' }}>
          {options.map(o => (
            <button key={String(o.active)} onClick={() => { onStatut(faq.id, o.active); setOuvert(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', color: C.text, borderBottom: `1px solid ${C.border}` }}
              onMouseEnter={e => (e.currentTarget.style.background = C.goldLight)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {o.label}
            </button>
          ))}
          <button onClick={() => { onSupprimer(faq); setOuvert(false); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', color: C.red }}
            onMouseEnter={e => (e.currentTarget.style.background = C.redLight)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            🗑️ Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

interface Props { gestionnaireId: number; }

export default function StudioFaqCollabMV({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');
  const hdrs  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [faqs, setFaqs]           = useState<FaqItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok'|'err' } | null>(null);
  const [recherche, setRecherche] = useState('');
  const [expand, setExpand]       = useState<number[]>([]);
  const [aSupprimer, setASupprimer] = useState<FaqItem | null>(null);

  const showToast = (msg: string, type: 'ok'|'err') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const faqRes = await fetch(`${API_BASE}/studio-forfaits/mv/faq`, { headers: hdrs as any, credentials: 'include' });
      if (faqRes.ok) {
        const data = await faqRes.json();
        setFaqs(data);
        const ids = Array.from(new Set(data.map((f: FaqItem) => f.collaborateur_id))) as number[];
        setExpand(ids);
      } else if (faqRes.status === 403) showToast("L'option « FAQ collaborateurs » n'est pas activée.", 'err');
    } catch { showToast('Erreur de chargement', 'err'); }
    finally { setLoading(false); }
  }, [gestionnaireId]);

  useEffect(() => { charger(); }, [charger]);

  // Grouper par collaborateur
  const groupes: CollaborateurGroup[] = (() => {
    const map: Record<number, CollaborateurGroup> = {};
    faqs.forEach(f => {
      if (!map[f.collaborateur_id]) {
        map[f.collaborateur_id] = { id: f.collaborateur_id, nom: f.collaborateur_nom, email: f.collaborateur_email, boutique: f.nom_boutique, faqs: [] };
      }
      map[f.collaborateur_id].faqs.push(f);
    });
    return Object.values(map).filter(g =>
      !recherche || [g.boutique, g.nom, g.email].join(' ').toLowerCase().includes(recherche.toLowerCase())
    );
  })();

  async function changerStatut(id: number, active: boolean) {
    try {
      const res = await fetch(`${API_BASE}/studio-forfaits/mv/faq/${id}/statut`, {
        method: 'PUT', headers: hdrs as any, credentials: 'include', body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error();
      setFaqs(prev => prev.map(f => f.id === id ? { ...f, active } : f));
      showToast('Statut mis à jour', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  async function supprimer(faq: FaqItem) {
    try {
      const res = await fetch(`${API_BASE}/studio-forfaits/mv/faq/${faq.id}`, { method: 'DELETE', headers: hdrs as any, credentials: 'include' });
      if (!res.ok) throw new Error();
      setFaqs(prev => prev.filter(f => f.id !== faq.id));
      setASupprimer(null);
      showToast('Question supprimée', 'ok');
    } catch { showToast('Erreur', 'err'); }
  }

  const stats = {
    total:     faqs.length,
    actifs:    faqs.filter(f => f.active).length,
    inactifs:  faqs.filter(f => !f.active).length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: C.textLight, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>❓</div><p style={{ margin: 0 }}>Chargement…</p></div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '28px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal suppression */}
      {aSupprimer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: C.text }}>Supprimer cette question ?</h3>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: C.textLight }}>«{aSupprimer.question.slice(0, 60)}…»</p>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: C.red, fontWeight: 600 }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setASupprimer(null)} style={{ padding: '9px 20px', border: `1px solid ${C.border}`, borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => supprimer(aSupprimer)} style={{ padding: '9px 20px', border: 'none', borderRadius: '10px', background: C.red, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(201,169,110,0.3)' }}>❓</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: C.text }}>FAQ collaborateurs</h1>
            <p style={{ margin: 0, fontSize: '13px', color: C.textLight }}>Gérez les questions/réponses de vos collaborateurs</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: '❓', label: 'Total questions', val: stats.total,     color: C.text },
          { icon: '✅', label: 'Visibles',         val: stats.actifs,    color: C.green },
          { icon: '🔴', label: 'Masquées',         val: stats.inactifs,  color: C.red },
        ].map(s => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '20px', margin: '0 0 3px' }}>{s.icon}</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.val}</p>
            <p style={{ fontSize: '11px', color: C.textLight, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ══ ONGLET QUESTIONS ══ */}
      {(
        <>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
            <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher un collaborateur…"
              style={{ width: '100%', boxSizing: 'border-box' as const, padding: '8px 12px', border: `1px solid ${C.border2}`, borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
          </div>

          {groupes.length === 0 ? (
            <div style={{ background: C.card, border: `2px dashed ${C.border}`, borderRadius: '16px', padding: '60px', textAlign: 'center', color: C.textLight }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px' }}>❓</p>
              <p style={{ margin: 0 }}>Aucune question pour l'instant</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groupes.map(g => {
                const estOuvert = expand.includes(g.id);
                const nbEnAttente = 0;
                return (
                  <div key={g.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    {/* Header collaborateur */}
                    <div onClick={() => setExpand(prev => estOuvert ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                      style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr auto', gap: '12px', padding: '14px 18px', background: '#f8fafc', cursor: 'pointer', alignItems: 'center', borderBottom: estOuvert ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: C.blue, background: C.blueLight, padding: '3px 8px', borderRadius: '6px', textAlign: 'center' }}>#{g.id}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.text }}>{g.boutique || g.nom}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: C.textLight }}>{g.email}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: C.goldLight, color: C.gold }}>
                          ❓ {g.faqs.length} question{g.faqs.length > 1 ? 's' : ''}
                        </span>
                        {nbEnAttente > 0 && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: C.orangeLight, color: C.orange }}>
                            ⏳ {nbEnAttente} en attente
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '14px', color: C.textLight, transition: 'transform 0.2s', display: 'inline-block', transform: estOuvert ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>

                    {/* Questions du collaborateur */}
                    {estOuvert && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 40px', padding: '8px 18px', background: '#fafafa', borderBottom: `1px solid ${C.border}` }}>
                          {['Question', 'Statut', ''].map(h => (
                            <span key={h} style={{ fontSize: '10px', fontWeight: 800, color: C.textXLight, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                          ))}
                        </div>
                        {g.faqs.map((f, idx) => {
                          const st = statutStyle(f.active);
                          return (
                            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 40px', padding: '12px 18px', borderBottom: idx < g.faqs.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <div>
                                <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 600, color: C.text }}>{f.question}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: C.textXLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.reponse.slice(0, 80)}…</p>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: st.bg, color: st.color, whiteSpace: 'nowrap' as const }}>
                                {st.label}
                              </span>
                              <MenuTroisPoints faq={f} onStatut={changerStatut} onSupprimer={setASupprimer} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
}