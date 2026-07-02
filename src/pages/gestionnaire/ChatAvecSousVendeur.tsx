/**
 * ChatAvecSousVendeur.tsx — e-Vend Studio
 * Chemin : src/pages/vendeur/ChatAvecSousVendeur.tsx
 * Dashboard VENDEUR (proprio marketplace) — Chat avec ses sous-vendeurs
 * Tables : chat_admin_sv, chat_admin_sv_msg
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

interface Conv {
  id: number; sujet: string; statut: string;
  created_at: string; updated_at: string;
  sous_vendeur: { id: number; nom: string; nom_boutique: string };
  dernier_message: string | null; dernier_message_date: string | null; non_lus: number;
}
interface Msg {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string;
  piece_jointe_url: string | null; piece_jointe_nom: string | null; piece_jointe_type: string | null;
  supprime: boolean; created_at: string;
}
interface SV { id: number; nom: string; nom_boutique: string; }

const C = {
  accent: '#c9a96e', accentDark: '#a07840', accentLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', red: '#ef4444', blue: '#3b82f6',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#64748b', textMuted: '#94a3b8',
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
  return <div style={{ position: 'fixed', top: '24px', right: '24px', background: bg, color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>{msg}</div>;
}

interface Props { vendeurId: number; }

export default function ChatAvecSousVendeur({ vendeurId }: Props) {
  const token = localStorage.getItem('token');
  const hdrs  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const base  = `${API_BASE}/chat-admin-sv/${vendeurId}`;

  const [convs,        setConvs]        = useState<Conv[]>([]);
  const [convActive,   setConvActive]   = useState<Conv | null>(null);
  const [messages,     setMessages]     = useState<Msg[]>([]);
  const [texte,        setTexte]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [recherche,    setRecherche]    = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [toast,        setToast]        = useState<{ msg: string; type: 'success'|'danger'|'info' } | null>(null);
  const [showModal,    setShowModal]    = useState(false);
  const [sousVendeurs, setSousVendeurs] = useState<SV[]>([]);
  const [nouvForm,     setNouvForm]     = useState({ sous_vendeur_id: '', sujet: '', message: '' });
  const [creating,     setCreating]     = useState(false);
  const [msgASuppr,    setMsgASuppr]    = useState<Msg | null>(null);
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
      const res  = await fetch(`${base}/admin/conversations`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setConvs(data);
    } catch { }
    finally { setLoading(false); }
  }, [vendeurId]);

  const chargerMessages = useCallback(async (convId: number, force = false) => {
    try {
      const res  = await fetch(`${base}/admin/conversations/${convId}/messages`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) { setMessages(data); scrollBas(force); }
    } catch { }
  }, [vendeurId, scrollBas]);

  const chargerSV = async () => {
    try {
      const res  = await fetch(`${base}/sous-vendeurs`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setSousVendeurs(data);
    } catch { }
  };

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
      await fetch(`${base}/admin/conversations/${convActive.id}/messages`, {
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
      await fetch(`${base}/admin/conversations/${convActive.id}/messages`, {
        method: 'POST', headers: hdrs as any,
        body: JSON.stringify({ contenu: '', piece_jointe_url: data.url, piece_jointe_nom: data.nom, piece_jointe_type: data.type }),
      });
      await chargerMessages(convActive.id, true);
      showToast('📎 Fichier envoyé', 'success');
    } catch { showToast('Erreur upload', 'danger'); }
    finally { setUploading(false); }
  };

  const supprimerMessage = async (msg: Msg) => {
    try {
      await fetch(`${base}/admin/messages/${msg.id}`, { method: 'DELETE', headers: hdrs as any });
      if (convActive) await chargerMessages(convActive.id);
      setMsgASuppr(null);
      showToast('🗑️ Message supprimé', 'info');
    } catch { showToast('Erreur', 'danger'); }
  };

  const creerConversation = async () => {
    if (!nouvForm.sous_vendeur_id || !nouvForm.sujet.trim() || !nouvForm.message.trim()) return;
    setCreating(true);
    try {
      const res  = await fetch(`${base}/admin/conversations`, {
        method: 'POST', headers: hdrs as any,
        body: JSON.stringify({ sous_vendeur_id: parseInt(nouvForm.sous_vendeur_id), sujet: nouvForm.sujet, message: nouvForm.message }),
      });
      const data = await res.json();
      setShowModal(false);
      setNouvForm({ sous_vendeur_id: '', sujet: '', message: '' });
      await chargerConvs();
      if (data.conversation) setConvActive(data.conversation);
      showToast('💬 Conversation créée', 'success');
    } catch { showToast('Erreur', 'danger'); }
    finally { setCreating(false); }
  };

  const changerStatut = async (convId: number, statut: string) => {
    try {
      await fetch(`${base}/admin/conversations/${convId}/statut`, {
        method: 'PUT', headers: hdrs as any, body: JSON.stringify({ statut }),
      });
      await chargerConvs();
      if (convActive?.id === convId) setConvActive(p => p ? { ...p, statut } : null);
    } catch { }
  };

  const convsFiltrees = convs.filter(c => {
    const m = [c.sujet, c.sous_vendeur.nom, c.sous_vendeur.nom_boutique].join(' ').toLowerCase().includes(recherche.toLowerCase());
    const s = filtreStatut === 'tous' || c.statut === filtreStatut;
    return m && s;
  });

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

      {/* Modal suppression */}
      {msgASuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🗑️</p>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: C.text }}>Supprimer ce message ?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: C.textLight }}>Il sera masqué pour les deux parties.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setMsgASuppr(null)} style={{ padding: '9px 20px', border: `1px solid ${C.border}`, borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => supprimerMessage(msgASuppr)} style={{ padding: '9px 20px', border: 'none', borderRadius: '10px', background: C.red, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle conv */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436, #c9a96e)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0 }}>💬 Nouveau chat avec un sous-vendeur</p>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' }}>Sous-vendeur *</label>
                <select value={nouvForm.sous_vendeur_id} onChange={e => setNouvForm(p => ({ ...p, sous_vendeur_id: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">— Choisir —</option>
                  {sousVendeurs.map(sv => <option key={sv.id} value={sv.id}>{sv.nom_boutique || sv.nom}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' }}>Sujet *</label>
                <input value={nouvForm.sujet} onChange={e => setNouvForm(p => ({ ...p, sujet: e.target.value }))} placeholder="Ex: Mise à jour des frais de votre boutique" style={inp} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '6px' }}>Premier message *</label>
                <textarea value={nouvForm.message} onChange={e => setNouvForm(p => ({ ...p, message: e.target.value }))} placeholder="Rédigez votre message…" rows={3} style={{ ...inp, resize: 'vertical' as const }} />
              </div>
              <div style={{ background: C.accentLight, border: `1px solid rgba(201,169,110,0.3)`, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: C.accentDark, margin: 0, fontWeight: 600 }}>🔒 Message chiffré AES-256 · Photos hébergées sur AWS S3</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', border: `1px solid ${C.border}`, borderRadius: '10px', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: C.text }}>Annuler</button>
                <button onClick={creerConversation} disabled={!nouvForm.sous_vendeur_id || !nouvForm.sujet.trim() || !nouvForm.message.trim() || creating}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {creating ? '⏳…' : '💬 Démarrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{ width: '300px', flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, #1a2436, #c9a96e)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ color: '#fff', fontSize: '14px', fontWeight: 800, margin: 0 }}>
              💬 Chats sous-vendeurs
              {nonLusTotal > 0 && <span style={{ background: C.red, fontSize: '10px', padding: '1px 6px', borderRadius: '8px', marginLeft: '6px' }}>{nonLusTotal}</span>}
            </p>
            <button onClick={() => { setShowModal(true); chargerSV(); }}
              style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '7px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
              + Nouveau
            </button>
          </div>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher…"
            style={{ width: '100%', boxSizing: 'border-box' as const, padding: '7px 12px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
            {['tous','actif','resolu','ferme'].map(f => (
              <button key={f} onClick={() => setFiltreStatut(f)}
                style={{ padding: '2px 9px', borderRadius: '10px', border: 'none', background: filtreStatut === f ? '#fff' : 'rgba(255,255,255,0.12)', color: filtreStatut === f ? '#1a2436' : '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                {f === 'tous' ? 'Tous' : f === 'actif' ? '⚡' : f === 'resolu' ? '✓' : '🔒'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convsFiltrees.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: C.textLight }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>💬</p>
              <p style={{ fontSize: '13px', margin: '0 0 12px' }}>Aucun chat</p>
              <button onClick={() => { setShowModal(true); chargerSV(); }}
                style={{ padding: '8px 14px', background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                + Démarrer un chat
              </button>
            </div>
          ) : convsFiltrees.map(conv => (
            <div key={conv.id} onClick={() => setConvActive(conv)}
              style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, background: convActive?.id === conv.id ? C.accentLight : 'transparent', borderLeft: `3px solid ${convActive?.id === conv.id ? C.accent : 'transparent'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <p style={{ fontSize: '12px', fontWeight: conv.non_lus > 0 ? 800 : 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.sujet}</p>
                <span style={{ fontSize: '10px', color: C.textMuted, flexShrink: 0, marginLeft: '6px' }}>{conv.dernier_message_date ? fmtHeure(conv.dernier_message_date) : ''}</span>
              </div>
              <p style={{ fontSize: '11px', color: C.accent, margin: '0 0 2px', fontWeight: 600 }}>🏪 {conv.sous_vendeur.nom_boutique || conv.sous_vendeur.nom}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '10px', color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.dernier_message || '—'}</p>
                {conv.non_lus > 0 && <span style={{ background: C.accent, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '8px', flexShrink: 0, marginLeft: '4px' }}>{conv.non_lus}</span>}
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
            <p style={{ fontSize: '13px', margin: '0 0 20px' }}>ou démarrez un nouveau chat avec un sous-vendeur</p>
            <button onClick={() => { setShowModal(true); chargerSV(); }}
              style={{ padding: '12px 24px', background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`, border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              💬 Nouveau chat
            </button>
            <div style={{ marginTop: '14px', display: 'inline-flex', gap: '8px', padding: '7px 14px', background: C.accentLight, border: `1px solid rgba(201,169,110,0.3)`, borderRadius: '8px' }}>
              <span>🔒</span><p style={{ fontSize: '12px', color: C.accentDark, margin: 0, fontWeight: 600 }}>Chiffré AES-256 · Photos sur AWS S3</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 2px' }}>{convActive.sujet}</p>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>🏪 {convActive.sous_vendeur.nom_boutique || convActive.sous_vendeur.nom}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select onChange={e => changerStatut(convActive.id, e.target.value)} value={convActive.statut}
                style={{ padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                <option value="actif">⚡ Actif</option>
                <option value="resolu">✓ Résolu</option>
                <option value="ferme">🔒 Fermer</option>
              </select>
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
                  const isAdmin = msg.expediteur_role === 'admin';
                  const showName = i === 0 || g.msgs[i-1]?.expediteur_role !== msg.expediteur_role;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start', marginBottom: '4px', opacity: msg.supprime ? 0.4 : 1 }}>
                      {showName && <span style={{ fontSize: '10px', color: C.textMuted, marginBottom: '2px' }}>{msg.expediteur_nom}</span>}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexDirection: isAdmin ? 'row-reverse' : 'row' }}>
                        <div style={{ maxWidth: '68%', padding: '10px 14px', borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isAdmin ? C.accent : '#f1f5f9', color: isAdmin ? '#fff' : C.text, fontSize: '14px', lineHeight: 1.5 }}>
                          {msg.supprime ? <em style={{ opacity: 0.6 }}>Message supprimé</em> : msg.contenu}
                          {msg.piece_jointe_url && !msg.supprime && (
                            <div style={{ marginTop: '8px' }}>
                              {msg.piece_jointe_type?.startsWith('image/') ? (
                                <img src={msg.piece_jointe_url} alt="" style={{ maxWidth: '220px', maxHeight: '160px', borderRadius: '8px', display: 'block' }} />
                              ) : (
                                <a href={msg.piece_jointe_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: isAdmin ? 'rgba(255,255,255,0.8)' : C.accent }}>📎 {msg.piece_jointe_nom}</a>
                              )}
                            </div>
                          )}
                        </div>
                        {isAdmin && !msg.supprime && (
                          <button onClick={() => setMsgASuppr(msg)} style={{ padding: '4px 7px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', color: C.red, fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
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
                placeholder="Écrire un message… (Entrée pour envoyer)" rows={2}
                style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '14px', resize: 'none' as const, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={envoyer} disabled={!texte.trim() || sending}
                style={{ padding: '10px 20px', background: texte.trim() ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : '#cbd5e1', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: texte.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                {sending ? '⏳' : '✈️'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: '#f8fafc', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>
              🔒 Conversation {convActive.statut === 'resolu' ? 'résolue' : 'fermée'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}