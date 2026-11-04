/**
 * ChatAvecAcheteur.tsx — e-Vend Studio
 * Chemin : src/pages/sous-vendeurs/ChatAvecAcheteur.tsx
 * Dashboard SOUS-VENDEUR — Chat avec les acheteurs
 * Polling 5s — messages chiffrés AES-256-CBC côté serveur
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

const C = {
  accent: '#c9a96e', accentDark: '#a07840', accentLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280', textMuted: '#9ca3af',
  bulleVendeur: '#c9a96e', bulleAcheteur: '#f1f5f9',
  bulleTextVendeur: '#fff', bulleTextAcheteur: '#1a2332',
};

interface Conv {
  id: number; sujet: string; statut: string;
  created_at: string; updated_at: string;
  acheteur: { id: number; nom: string; email: string };
  dernier_message: string | null; dernier_message_date: string | null; non_lus: number;
}
interface Msg {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string; created_at: string;
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

interface Props { vendeurId: number; sousVendeurId: number; }

export default function ChatAvecAcheteur({ vendeurId, sousVendeurId }: Props) {
  const token = localStorage.getItem('token');
  const hdrs  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [convs,      setConvs]     = useState<Conv[]>([]);
  const [convActive, setConvActive]= useState<Conv | null>(null);
  const [messages,   setMessages]  = useState<Msg[]>([]);
  const [texte,      setTexte]     = useState('');
  const [loading,    setLoading]   = useState(true);
  const [sending,    setSending]   = useState(false);
  const [recherche,  setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Charger conversations ─────────────────────────────────────────────────
  const chargerConvs = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/chat-sv/${vendeurId}/sv/${sousVendeurId}/conversations`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setConvs(data);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [sousVendeurId, vendeurId]);

  // ── Charger messages ──────────────────────────────────────────────────────
  const chargerMessages = useCallback(async (convId: number) => {
    try {
      const res  = await fetch(`${API_BASE}/chat-sv/${vendeurId}/sv/${sousVendeurId}/conversations/${convId}/messages`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch { /* silencieux */ }
  }, [sousVendeurId, vendeurId]);

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

  // ── Envoyer message ────────────────────────────────────────────────────────
  const envoyer = async () => {
    if (!texte.trim() || !convActive || sending) return;
    setSending(true);
    try {
      await fetch(`${API_BASE}/chat-sv/${vendeurId}/sv/${sousVendeurId}/conversations/${convActive.id}/messages`, {
        method: 'POST', headers: hdrs as any,
        body: JSON.stringify({ contenu: texte.trim() }),
      });
      setTexte('');
      await chargerMessages(convActive.id);
    } catch { /* silencieux */ }
    finally { setSending(false); }
  };

  // ── Changer statut ────────────────────────────────────────────────────────
  const changerStatut = async (convId: number, statut: string) => {
    try {
      await fetch(`${API_BASE}/chat-sv/${vendeurId}/sv/${sousVendeurId}/conversations/${convId}/statut`, {
        method: 'PUT', headers: hdrs as any, body: JSON.stringify({ statut }),
      });
      await chargerConvs();
    } catch { /* silencieux */ }
  };

  const convsFiltrees = convs.filter(c => {
    const m = [c.sujet, c.acheteur.nom, c.acheteur.email].join(' ').toLowerCase().includes(recherche.toLowerCase());
    const s = filtreStatut === 'tous' || c.statut === filtreStatut;
    return m && s;
  });

  const nonLusTotal = convs.reduce((s, c) => s + (c.non_lus || 0), 0);

  // Séparer les messages par date
  const groupesMessages = messages.reduce((acc: { date: string; msgs: Msg[] }[], msg) => {
    const d = fmtDateSep(msg.created_at);
    const last = acc[acc.length - 1];
    if (!last || last.date !== d) acc.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
    return acc;
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>💬</div><p style={{ color: C.textLight }}>Chargement…</p></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: C.bg, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Sidebar conversations ── */}
      <div style={{ width: '320px', flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(135deg, #1a2436, #c9a96e)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 800, margin: 0 }}>💬 Mes conversations</p>
            {nonLusTotal > 0 && <span style={{ background: C.red, color: '#fff', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>{nonLusTotal} non lu{nonLusTotal > 1 ? 's' : ''}</span>}
          </div>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher…"
            style={{ width: '100%', boxSizing: 'border-box' as const, padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', outline: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff' }} />
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' as const }}>
            {['tous','actif','resolu','ferme'].map(f => (
              <button key={f} onClick={() => setFiltreStatut(f)}
                style={{ padding: '3px 10px', borderRadius: '12px', border: 'none', background: filtreStatut === f ? '#fff' : 'rgba(255,255,255,0.15)', color: filtreStatut === f ? '#1a2436' : '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                {f === 'tous' ? 'Tous' : f === 'actif' ? 'Actifs' : f === 'resolu' ? 'Résolus' : 'Fermés'}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convsFiltrees.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textLight }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>💬</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Aucune conversation</p>
            </div>
          ) : convsFiltrees.map(conv => (
            <div key={conv.id} onClick={() => setConvActive(conv)}
              style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, background: convActive?.id === conv.id ? C.accentLight : 'transparent', borderLeft: `3px solid ${convActive?.id === conv.id ? C.accent : 'transparent'}`, transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <p style={{ fontSize: '13px', fontWeight: conv.non_lus > 0 ? 800 : 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.sujet}</p>
                <span style={{ fontSize: '10px', color: C.textMuted, flexShrink: 0, marginLeft: '8px' }}>{conv.dernier_message_date ? fmtHeure(conv.dernier_message_date) : ''}</span>
              </div>
              <p style={{ fontSize: '11px', color: C.textLight, margin: '0 0 4px' }}>👤 {conv.acheteur.nom}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '11px', color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{conv.dernier_message || 'Aucun message'}</p>
                {conv.non_lus > 0 && <span style={{ background: C.accent, color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px', flexShrink: 0, marginLeft: '6px' }}>{conv.non_lus}</span>}
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
            <p style={{ fontSize: '13px', margin: 0 }}>Vos échanges avec les acheteurs apparaissent ici</p>
            <div style={{ marginTop: '20px', padding: '10px 16px', background: C.accentLight, border: `1px solid ${C.accent}`, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🔒</span>
              <p style={{ fontSize: '12px', color: C.accentDark, margin: 0, fontWeight: 600 }}>Conversations chiffrées AES-256</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header conv */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: C.text, margin: '0 0 2px' }}>{convActive.sujet}</p>
              <p style={{ fontSize: '12px', color: C.textLight, margin: 0 }}>👤 {convActive.acheteur.nom} · {convActive.acheteur.email}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
                background: convActive.statut === 'actif' ? '#dcfce7' : convActive.statut === 'resolu' ? '#dbeafe' : '#f3f4f6',
                color: convActive.statut === 'actif' ? C.green : convActive.statut === 'resolu' ? C.blue : C.textLight }}>
                {convActive.statut === 'actif' ? '⚡ Actif' : convActive.statut === 'resolu' ? '✓ Résolu' : '🔒 Fermé'}
              </span>
              <select onChange={e => changerStatut(convActive.id, e.target.value)} value={convActive.statut}
                style={{ padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                <option value="actif">Actif</option>
                <option value="resolu">Résolu</option>
                <option value="ferme">Fermer</option>
              </select>
              <span style={{ fontSize: '11px', color: C.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 Chiffré</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {groupesMessages.map(groupe => (
              <div key={groupe.date}>
                <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                  <span style={{ fontSize: '11px', color: C.textMuted, background: '#f1f5f9', padding: '3px 12px', borderRadius: '10px' }}>{groupe.date}</span>
                </div>
                {groupe.msgs.map((msg, i) => {
                  const isSV = msg.expediteur_role === 'sous_vendeur';
                  const showName = i === 0 || groupe.msgs[i-1]?.expediteur_role !== msg.expediteur_role;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSV ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                      {showName && <span style={{ fontSize: '10px', color: C.textMuted, marginBottom: '2px', marginLeft: isSV ? 0 : '4px', marginRight: isSV ? '4px' : 0 }}>{msg.expediteur_nom}</span>}
                      <div style={{ maxWidth: '68%', padding: '10px 14px', borderRadius: isSV ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isSV ? C.bulleVendeur : C.bulleAcheteur, color: isSV ? C.bulleTextVendeur : C.bulleTextAcheteur, fontSize: '14px', lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: C.card, display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea value={texte} onChange={e => setTexte(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                placeholder="Écrire un message… (Entrée pour envoyer)" rows={2}
                style={{ flex: 1, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '14px', resize: 'none' as const, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
              <button onClick={envoyer} disabled={!texte.trim() || sending}
                style={{ padding: '10px 20px', background: texte.trim() ? `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` : '#cbd5e1', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: texte.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                {sending ? '⏳' : '✈️ Envoyer'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.border}`, background: '#f8fafc', textAlign: 'center', color: C.textLight, fontSize: '13px' }}>
              🔒 Cette conversation est {convActive.statut === 'resolu' ? 'résolue' : 'fermée'} — impossible d'envoyer de nouveaux messages
            </div>
          )}
        </div>
      )}
    </div>
  );
}