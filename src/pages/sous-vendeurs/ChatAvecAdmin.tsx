/**
 * ChatAvecAdmin.tsx — e-Vend Studio
 * Chemin : src/pages/sous-vendeurs/ChatAvecAdmin.tsx
 * Dashboard SOUS-VENDEUR — Chat avec le propriétaire de la marketplace
 * Tables : chat_admin_sv, chat_admin_sv_msg
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

interface Conv {
  id: number; sujet: string; statut: string;
  created_at: string; updated_at: string;
  dernier_message: string | null; dernier_message_date: string | null; non_lus: number;
}
interface Msg {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string;
  piece_jointe_url: string | null; piece_jointe_nom: string | null; piece_jointe_type: string | null;
  supprime: boolean; created_at: string;
}

const C = {
  accent: '#0369a1', accentLight: 'rgba(3,105,161,0.1)',
  green: '#10b981', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#64748b', textMuted: '#94a3b8',
  bulleSV: '#0369a1', bulleAdmin: '#f1f5f9',
  bulleTextSV: '#fff', bulleTextAdmin: '#1a2332',
};

const fmtHeure = (d: string) => {
  try {
    const dt = new Date(d), now = new Date();
    if (now.getTime() - dt.getTime() < 86400000 && dt.getDate() === now.getDate())
      return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  } catch { return ''; }
};

const fmtDateSep = (d: string) => {
  try {
    const dt = new Date(d), now = new Date(), diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate()) return "Aujourd'hui";
    if (diff < 172800000) return 'Hier';
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
};

function Toast({ msg, type }: { msg: string; type: 'success'|'danger'|'info' }) {
  const bg = type === 'success' ? C.green : type === 'danger' ? C.red : C.blue;
  return <div style={{ position: 'fixed', top: '80px', right: '24px', background: bg, color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>{msg}</div>;
}

interface Props { vendeurId: number; sousVendeurId: number; }

export default function ChatAvecAdmin({ vendeurId, sousVendeurId }: Props) {
  const token = localStorage.getItem('token');
  const hdrs  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const base  = `${API_BASE}/chat-admin-sv/${vendeurId}/sv/${sousVendeurId}`;

  const [convs,        setConvs]        = useState<Conv[]>([]);
  const [convActive,   setConvActive]   = useState<Conv | null>(null);
  const [messages,     setMessages]     = useState<Msg[]>([]);
  const [texte,        setTexte]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [toast,        setToast]        = useState<{ msg: string; type: 'success'|'danger'|'info' } | null>(null);
  const [showModal,    setShowModal]    = useState(false);
  const [sujetNouv,    setSujetNouv]    = useState('');
  const [msgNouv,      setMsgNouv]      = useState('');
  const [creating,     setCreating]     = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const messagesRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, type: 'success'|'danger'|'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const scrollBas = useCallback((force = false) => {
    if (messagesRef.current && (!userScrolled || force))
      setTimeout(() => { messagesRef.current!.scrollTop = messagesRef.current!.scrollHeight; }, 80);
  }, [userScrolled]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const h = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setUserScrolled(Math.abs(scrollHeight - scrollTop - clientHeight) > 60);
    };
    el.addEventListener('scroll', h);
    return () => el.removeEventListener('scroll', h);
  }, []);

  const chargerConvs = useCallback(async () => {
    try {
      const res  = await fetch(`${base}/conversations`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setConvs(data);
    } catch { }
    finally { setLoading(false); }
  }, [sousVendeurId, vendeurId]);

  const chargerMessages = useCallback(async (convId: number, force = false) => {
    try {
      const res  = await fetch(`${base}/conversations/${convId}/messages`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) { setMessages(data); scrollBas(force); }
    } catch { }
  }, [sousVendeurId, vendeurId, scrollBas]);

  useEffect(() => { chargerConvs(); }, [chargerConvs]);

  useEffect(() => {
    if (!convActive) return;
    chargerMessages(convActive.id, true);
    pollingRef.current = setInterval(() => { chargerConvs(); chargerMessages(convActive.id); }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convActive?.id]);

  const envoyer = async () => {
    if (!texte.trim() || !convActive || sending) return;
    setSending(true);
    try {
      await fetch(`${base}/conversations/${convActive.id}/messages`, {
        method: 'POST', headers: hdrs as any, body: JSON.stringify({ contenu: texte.trim() }),
      });
      setTexte('');
      await chargerMessages(convActive.id, true);
    } catch { showToast('Erreur envoi', 'danger'); }
    finally { setSending(false); }
  };

  const uploadFichier = async (file: File) => {
    if (!convActive) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res  = await fetch(`${API_BASE.replace('/api', '')}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!data.url) throw new Error();
      await fetch(`${base}/conversations/${convActive.id}/messages`, {
        method: 'POST', headers: hdrs as any,
        body: JSON.stringify({ contenu: '', piece_jointe_url: data.url, piece_jointe_nom: data.nom, piece_jointe_type: data.type }),
      });
      await chargerMessages(convActive.id, true);
      showToast('📎 Fichier envoyé', 'success');
    } catch { showToast('Erreur upload', 'danger'); }
    finally { setUploading(false); }
  };

  const creerConversation = async () => {
    if (!sujetNouv.trim() || !msgNouv.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch(`${base}/conversations`, {
        method: 'POST', headers: hdrs as any,
        body: JSON.stringify({ sujet: sujetNouv, message: msgNouv }),
      });
      const data = await res.json();
      setShowModal(false); setSujetNouv(''); setMsgNouv('');
      await chargerConvs();
      if (data.conversation) setConvActive(data.conversation);
      showToast('💬 Message envoyé au propriétaire', 'success');
    } catch { showToast('Erreur', 'danger'); }
    finally { setCreating(false); }
  };

  const nonLusTotal = convs.reduce((s, c) => s + (c.non_lus || 0), 0);

  const groupes = messages.reduce((acc: { date: string; msgs: Msg[] }[], msg) => {
    const d = fmtDateSep(msg.created_at);
    const last = acc[acc.length - 1];
    if (!last || last.date !== d) acc.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
    return acc;
  }, []);

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 13px', border: `1px solid ${C.border}`, borderRadius: '9px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: C.bg, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '36px', margin: '0 0 8px' }}>💬</p><p style={{ color: C.textLight, margin: 0 }}>Chargement…</p></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: C.bg, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal nouvelle conv */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #0369a1, #1a2436)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#fff', fontSize: '15px', fontWeight: 800, margin: 0 }}>💬 Contacter le propriétaire</p>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' }}>Sujet *</label>
                <input value={sujetNouv} onChange={e => setSujetNouv(e.target.value)} placeholder="Ex: Question sur mes commissions" style={inp} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' }}>Message *</label>
                <textarea value={msgNouv} onChange={e => setMsgNouv(e.target.value)} placeholder="Votre message au propriétaire…" rows={3} style={{ ...inp, resize: 'vertical' as const }} />
              </div>
              <div style={{ background: C.accentLight, border: `1px solid rgba(3,105,161,0.3)`, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: C.accent, margin: 0, fontWeight: 600 }}>🔒 Message chiffré AES-256 — confidentiel</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', border: `1px solid ${C.border}`, borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button onClick={creerConversation} disabled={!sujetNouv.trim() || !msgNouv.trim() || creating}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #0369a1, #1a2436)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {creating ? '⏳…' : '📨 Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{ width: '300px', flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, #0369a1, #1a2436)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ color: '#fff', fontSize: '14px', fontWeight: 800, margin: 0 }}>
              💬 Chat avec le proprio
              {nonLusTotal > 0 && <span style={{ background: C.red, fontSize: '10px', padding: '1px 6px', borderRadius: '8px', marginLeft: '6px' }}>{nonLusTotal}</span>}
            </p>
            <button onClick={() => setShowModal(true)}
              style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '7px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
              + Nouveau
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0 }}>Communiquez directement avec le propriétaire de la marketplace</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convs.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: C.textLight }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>💬</p>
              <p style={{ fontSize: '13px', margin: '0 0 12px' }}>Aucun échange pour l'instant</p>
              <button onClick={() => setShowModal(true)}
                style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #0369a1, #1a2436)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                + Contacter le propriétaire
              </button>
            </div>
          ) : convs.map(conv => (
            <div key={conv.id} onClick={() => setConvActive(conv)}
              style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, background: convActive?.id === conv.id ? C.accentLight : 'transparent', borderLeft: `3px solid ${convActive?.id === conv.id ? C.accent : 'transparent'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <p style={{ fontSize: '12px', fontWeight: conv.non_lus > 0 ? 800 : 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.sujet}</p>
                <span style={{ fontSize: '10px', color: C.textMuted, flexShrink: 0, marginLeft: '6px' }}>{conv.dernier_message_date ? fmtHeure(conv.dernier_message_date) : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '10px', color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.dernier_message || '—'}</p>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '4px', alignItems: 'center' }}>
                  {conv.non_lus > 0 && <span style={{ background: C.accent, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '8px' }}>{conv.non_lus}</span>}
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px',
                    background: conv.statut === 'actif' ? '#dcfce7' : conv.statut === 'resolu' ? '#dbeafe' : '#f3f4f6',
                    color: conv.statut === 'actif' ? C.green : conv.statut === 'resolu' ? C.blue : C.textLight }}>
                    {conv.statut === 'actif' ? '⚡' : conv.statut === 'resolu' ? '✓' : '🔒'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Zone chat ── */}
      {!convActive ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '52px', margin: '0 0 16px' }}>💬</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Sélectionnez une conversation</p>
            <p style={{ fontSize: '13px', margin: '0 0 20px' }}>ou contactez directement le propriétaire de la marketplace</p>
            <button onClick={() => setShowModal(true)}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #0369a1, #1a2436)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              💬 Contacter le propriétaire
            </button>
            <div style={{ marginTop: '14px', display: 'inline-flex', gap: '8px', padding: '7px 14px', background: C.accentLight, border: `1px solid rgba(3,105,161,0.2)`, borderRadius: '8px' }}>
              <span>🔒</span><p style={{ fontSize: '12px', color: C.accent, margin: 0, fontWeight: 600 }}>Chiffré AES-256</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 2px' }}>{convActive.sujet}</p>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>⭐ Propriétaire de la marketplace</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
                background: convActive.statut === 'actif' ? '#dcfce7' : '#f3f4f6',
                color: convActive.statut === 'actif' ? C.green : C.textLight }}>
                {convActive.statut === 'actif' ? '⚡ Actif' : convActive.statut === 'resolu' ? '✓ Résolu' : '🔒 Fermé'}
              </span>
              <span style={{ fontSize: '11px', color: C.textMuted }}>🔒 Chiffré</span>
            </div>
          </div>

          <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {groupes.map(g => (
              <div key={g.date}>
                <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                  <span style={{ fontSize: '11px', color: C.textMuted, background: '#f1f5f9', padding: '3px 12px', borderRadius: '10px' }}>{g.date}</span>
                </div>
                {g.msgs.map((msg, i) => {
                  const isSV = msg.expediteur_role === 'sous_vendeur';
                  const showName = i === 0 || g.msgs[i-1]?.expediteur_role !== msg.expediteur_role;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSV ? 'flex-end' : 'flex-start', marginBottom: '4px', opacity: msg.supprime ? 0.4 : 1 }}>
                      {showName && <span style={{ fontSize: '10px', color: C.textMuted, marginBottom: '2px' }}>{isSV ? 'Vous' : `⭐ ${msg.expediteur_nom}`}</span>}
                      <div style={{ maxWidth: '68%', padding: '10px 14px', borderRadius: isSV ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isSV ? C.bulleSV : C.bulleAdmin, color: isSV ? C.bulleTextSV : C.bulleTextAdmin, fontSize: '14px', lineHeight: 1.5 }}>
                        {msg.supprime ? <em style={{ opacity: 0.6 }}>Message supprimé</em> : msg.contenu}
                        {msg.piece_jointe_url && !msg.supprime && (
                          <div style={{ marginTop: '8px' }}>
                            {msg.piece_jointe_type?.startsWith('image/') ? (
                              <img src={msg.piece_jointe_url} alt="" style={{ maxWidth: '220px', maxHeight: '160px', borderRadius: '8px', display: 'block' }} />
                            ) : (
                              <a href={msg.piece_jointe_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: isSV ? 'rgba(255,255,255,0.8)' : C.accent }}>📎 {msg.piece_jointe_nom}</a>
                            )}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: C.textMuted, marginTop: '2px' }}>{fmtHeure(msg.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFichier(f); e.target.value = ''; }} />

          {convActive.statut === 'actif' ? (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: C.card, display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                style={{ padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: '10px', background: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0, color: C.textLight }}>
                {uploading ? '⏳' : '📎'}
              </button>
              <textarea value={texte} onChange={e => setTexte(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                placeholder="Écrire un message au propriétaire… (Entrée pour envoyer)" rows={2}
                style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '14px', resize: 'none' as const, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={envoyer} disabled={!texte.trim() || sending}
                style={{ padding: '10px 20px', background: texte.trim() ? 'linear-gradient(135deg, #0369a1, #1a2436)' : '#cbd5e1', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: texte.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                {sending ? '⏳' : '✈️'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: '#f8fafc', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>
              🔒 Conversation {convActive.statut === 'resolu' ? 'résolue' : 'fermée'} par le propriétaire
            </div>
          )}
        </div>
      )}
    </div>
  );
}