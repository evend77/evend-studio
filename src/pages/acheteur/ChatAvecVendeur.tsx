/**
 * ChatAvecVendeur.tsx — e-Vend Studio
 * Chemin : src/pages/acheteur/ChatAvecVendeur.tsx
 * Dashboard ACHETEUR — Chat avec les sous-vendeurs
 * Polling 5s — messages chiffrés AES-256-CBC
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || 'http://localhost:5000/api';

const C = {
  accent: '#8b5cf6', accentDark: '#7c3aed', accentLight: 'rgba(139,92,246,0.1)',
  green: '#10b981', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6',
  bg: '#0f172a', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
  text: '#fff', textLight: 'rgba(255,255,255,0.6)', textMuted: 'rgba(255,255,255,0.35)',
  bulleAcheteur: '#8b5cf6', bulleSV: 'rgba(255,255,255,0.08)',
  bulleTextAcheteur: '#fff', bulleTextSV: '#fff',
};

interface Conv {
  id: number; sujet: string; statut: string;
  created_at: string; updated_at: string;
  sous_vendeur: { id: number; nom: string; boutique: string };
  dernier_message: string | null; dernier_message_date: string | null; non_lus: number;
}
interface Msg {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string; created_at: string;
}
interface SousVendeurDispo {
  id: number; nom: string; nom_boutique: string;
}

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

interface Props { vendeurId: number; acheteurId: number; }

export default function ChatAvecVendeur({ vendeurId, acheteurId }: Props) {
  const token = localStorage.getItem('token');
  const hdrs  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [convs,         setConvs]        = useState<Conv[]>([]);
  const [convActive,    setConvActive]   = useState<Conv | null>(null);
  const [messages,      setMessages]     = useState<Msg[]>([]);
  const [texte,         setTexte]        = useState('');
  const [loading,       setLoading]      = useState(true);
  const [sending,       setSending]      = useState(false);
  const [recherche,     setRecherche]    = useState('');
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [sousVendeurs,  setSousVendeurs] = useState<SousVendeurDispo[]>([]);
  const [nouvForm,      setNouvForm]     = useState({ sous_vendeur_id: '', sujet: '', message: '' });
  const [creatingConv,  setCreatingConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const chargerConvs = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/chat-sv/${vendeurId}/acheteur/${acheteurId}/conversations`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setConvs(data);
    } catch { }
    finally { setLoading(false); }
  }, [acheteurId, vendeurId]);

  const chargerMessages = useCallback(async (convId: number) => {
    try {
      const res  = await fetch(`${API_BASE}/chat-sv/${vendeurId}/acheteur/${acheteurId}/conversations/${convId}/messages`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch { }
  }, [acheteurId, vendeurId]);

  const chargerSousVendeurs = async () => {
    try {
      const res  = await fetch(`${API_BASE}/chat-sv/${vendeurId}/sous-vendeurs`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setSousVendeurs(data);
    } catch { }
  };

  useEffect(() => { chargerConvs(); }, [chargerConvs]);

  useEffect(() => {
    if (!convActive) return;
    chargerMessages(convActive.id);
    pollingRef.current = setInterval(() => {
      chargerConvs();
      chargerMessages(convActive.id);
    }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convActive?.id]);

  const envoyer = async () => {
    if (!texte.trim() || !convActive || sending) return;
    setSending(true);
    try {
      await fetch(`${API_BASE}/chat-sv/${vendeurId}/acheteur/${acheteurId}/conversations/${convActive.id}/messages`, {
        method: 'POST', headers: hdrs as any, body: JSON.stringify({ contenu: texte.trim() }),
      });
      setTexte('');
      await chargerMessages(convActive.id);
    } catch { }
    finally { setSending(false); }
  };

  const creerConversation = async () => {
    if (!nouvForm.sous_vendeur_id || !nouvForm.sujet.trim() || !nouvForm.message.trim()) return;
    setCreatingConv(true);
    try {
      const res = await fetch(`${API_BASE}/chat-sv/${vendeurId}/acheteur/${acheteurId}/conversations`, {
        method: 'POST', headers: hdrs as any,
        body: JSON.stringify({ sous_vendeur_id: parseInt(nouvForm.sous_vendeur_id), sujet: nouvForm.sujet, message: nouvForm.message }),
      });
      const data = await res.json();
      setShowNouveauModal(false);
      setNouvForm({ sous_vendeur_id: '', sujet: '', message: '' });
      await chargerConvs();
      if (data.conversation) setConvActive(data.conversation);
    } catch { }
    finally { setCreatingConv(false); }
  };

  const convsFiltrees = convs.filter(c =>
    [c.sujet, c.sous_vendeur.nom, c.sous_vendeur.boutique].join(' ').toLowerCase().includes(recherche.toLowerCase())
  );

  const nonLusTotal = convs.reduce((s, c) => s + (c.non_lus || 0), 0);

  const groupesMessages = messages.reduce((acc: { date: string; msgs: Msg[] }[], msg) => {
    const d = fmtDateSep(msg.created_at);
    const last = acc[acc.length - 1];
    if (!last || last.date !== d) acc.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
    return acc;
  }, []);

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'inherit' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: C.bg, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div><p style={{ color: C.textLight }}>Chargement…</p></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: C.bg, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* Modal nouvelle conversation */}
      {showNouveauModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowNouveauModal(false)}>
          <div style={{ background: '#1e293b', borderRadius: '18px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1a2436, #8b5cf6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0 }}>💬 Nouvelle conversation</p>
              <button onClick={() => setShowNouveauModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Boutique *</label>
                <select value={nouvForm.sous_vendeur_id}
                  onChange={e => setNouvForm(p => ({ ...p, sous_vendeur_id: e.target.value }))}
                  style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">— Choisir une boutique —</option>
                  {sousVendeurs.map(sv => <option key={sv.id} value={sv.id} style={{ background: '#1e293b' }}>{sv.nom_boutique || sv.nom}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Sujet *</label>
                <input value={nouvForm.sujet} onChange={e => setNouvForm(p => ({ ...p, sujet: e.target.value }))} placeholder="Ex: Question sur ma commande #1234" style={inp} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Premier message *</label>
                <textarea value={nouvForm.message} onChange={e => setNouvForm(p => ({ ...p, message: e.target.value }))} placeholder="Écrivez votre message…" rows={3}
                  style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6 }} />
              </div>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>🔒 Ce message sera chiffré AES-256 — seuls vous et le vendeur pouvez le lire.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowNouveauModal(false)} style={{ flex: 1, padding: '11px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button onClick={creerConversation} disabled={!nouvForm.sous_vendeur_id || !nouvForm.sujet.trim() || !nouvForm.message.trim() || creatingConv}
                  style={{ flex: 1, padding: '11px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {creatingConv ? '⏳…' : '💬 Démarrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: '310px', flexShrink: 0, background: 'rgba(255,255,255,0.03)', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ color: C.text, fontSize: '15px', fontWeight: 800, margin: 0 }}>
              💬 Mes chats {nonLusTotal > 0 && <span style={{ background: C.red, fontSize: '10px', padding: '1px 6px', borderRadius: '8px', marginLeft: '6px' }}>{nonLusTotal}</span>}
            </p>
            <button onClick={() => { setShowNouveauModal(true); chargerSousVendeurs(); }}
              style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              + Nouveau
            </button>
          </div>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher…"
            style={{ width: '100%', boxSizing: 'border-box' as const, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '13px', outline: 'none' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convsFiltrees.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textLight }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>💬</p>
              <p style={{ fontSize: '13px', margin: '0 0 12px' }}>Aucune conversation</p>
              <button onClick={() => { setShowNouveauModal(true); chargerSousVendeurs(); }}
                style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                + Démarrer un chat
              </button>
            </div>
          ) : convsFiltrees.map(conv => (
            <div key={conv.id} onClick={() => setConvActive(conv)}
              style={{ padding: '13px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, background: convActive?.id === conv.id ? 'rgba(139,92,246,0.12)' : 'transparent', borderLeft: `3px solid ${convActive?.id === conv.id ? C.accent : 'transparent'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <p style={{ fontSize: '12px', fontWeight: conv.non_lus > 0 ? 800 : 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.sujet}</p>
                <span style={{ fontSize: '10px', color: C.textMuted, flexShrink: 0, marginLeft: '8px' }}>{conv.dernier_message_date ? fmtHeure(conv.dernier_message_date) : ''}</span>
              </div>
              <p style={{ fontSize: '11px', color: C.accent, margin: '0 0 2px', fontWeight: 600 }}>🏪 {conv.sous_vendeur.boutique || conv.sous_vendeur.nom}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '11px', color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.dernier_message || 'Aucun message'}</p>
                {conv.non_lus > 0 && <span style={{ background: C.accent, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px', flexShrink: 0, marginLeft: '6px' }}>{conv.non_lus}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone chat */}
      {!convActive ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textLight }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '52px', margin: '0 0 16px' }}>💬</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Sélectionnez une conversation</p>
            <p style={{ fontSize: '13px', margin: '0 0 20px' }}>ou démarrez un nouveau chat avec une boutique</p>
            <button onClick={() => { setShowNouveauModal(true); chargerSousVendeurs(); }}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}>
              💬 Nouveau chat avec une boutique
            </button>
            <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px' }}>
              <span>🔒</span><p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>Messages chiffrés AES-256</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 2px' }}>{convActive.sujet}</p>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>🏪 {convActive.sous_vendeur.boutique || convActive.sous_vendeur.nom}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
                background: convActive.statut === 'actif' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                color: convActive.statut === 'actif' ? C.green : C.textLight }}>
                {convActive.statut === 'actif' ? '⚡ Actif' : convActive.statut === 'resolu' ? '✓ Résolu' : '🔒 Fermé'}
              </span>
              <span style={{ fontSize: '11px', color: C.textMuted }}>🔒 Chiffré</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {groupesMessages.map(groupe => (
              <div key={groupe.date}>
                <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                  <span style={{ fontSize: '11px', color: C.textMuted, background: 'rgba(255,255,255,0.06)', padding: '3px 12px', borderRadius: '10px' }}>{groupe.date}</span>
                </div>
                {groupe.msgs.map((msg, i) => {
                  const isAch = msg.expediteur_role === 'acheteur';
                  const showName = i === 0 || groupe.msgs[i-1]?.expediteur_role !== msg.expediteur_role;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAch ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                      {showName && <span style={{ fontSize: '10px', color: C.textMuted, marginBottom: '2px' }}>{msg.expediteur_nom}</span>}
                      <div style={{ maxWidth: '68%', padding: '10px 14px', borderRadius: isAch ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isAch ? C.bulleAcheteur : C.bulleSV, color: C.text, fontSize: '14px', lineHeight: 1.5 }}>
                        {msg.contenu}
                      </div>
                      <span style={{ fontSize: '10px', color: C.textMuted, marginTop: '2px' }}>{fmtHeure(msg.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Saisie */}
          {convActive.statut === 'actif' ? (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea value={texte} onChange={e => setTexte(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                placeholder="Écrire un message… (Entrée pour envoyer)" rows={2}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: '12px', color: '#fff', fontSize: '14px', resize: 'none' as const, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={envoyer} disabled={!texte.trim() || sending}
                style={{ padding: '10px 20px', background: texte.trim() ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: texte.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                {sending ? '⏳' : '✈️'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, textAlign: 'center', color: C.textMuted, fontSize: '13px' }}>
              🔒 Conversation {convActive.statut === 'resolu' ? 'résolue' : 'fermée'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}