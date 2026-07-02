/**
 * SurveillanceChats.tsx — e-Vend Studio
 * Chemin : src/pages/gestionnaire/SurveillanceChats.tsx
 * Dashboard VENDEUR (proprio marketplace) — surveillance de tous les chats
 * Polling 15s — vue déchiffrée, intervention possible
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = (window as any).API_BASE || '/api';

const T = {
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  gold: '#c9a96e', goldLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', red: '#ef4444', amber: '#f59e0b', blue: '#3b82f6',
  purple: '#8b5cf6',
  text: '#1a2332', textLight: '#64748b', textMuted: '#94a3b8',
  sv: '#0369a1', ach: '#7c3aed', admin: '#c9a96e',
};

interface Chat {
  id: number; sujet: string; statut: string;
  created_at: string; updated_at: string; nb_messages: number;
  collaborateur: { id: number; nom: string; nom_boutique: string };
  acheteur:     { id: number; nom: string; email: string };
  dernier_message: string | null; dernier_message_date: string | null;
}

interface Msg {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string; created_at: string;
  supprime?: boolean;
}

const fmtHeure = (d: string) => {
  try {
    const dt = new Date(d), now = new Date();
    if (now.getTime() - dt.getTime() < 86400000 && dt.getDate() === now.getDate())
      return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return ''; }
};

const fmtDateSep = (d: string) => {
  try {
    const dt = new Date(d), now = new Date(), diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate()) return "Aujourd'hui";
    if (diff < 172800000) return 'Hier';
    return fmtDate(d);
  } catch { return ''; }
};

interface Props { gestionnaireId: number; }

export default function SurveillanceChats({ gestionnaireId }: Props) {
  const token = localStorage.getItem('token');
  const hdrs  = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [chats,        setChats]       = useState<Chat[]>([]);
  const [chatActif,    setChatActif]   = useState<Chat | null>(null);
  const [messages,     setMessages]    = useState<Msg[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [recherche,    setRecherche]   = useState('');
  const [filtreStatut, setFiltreStatut]= useState('tous');
  const [filtreSV,     setFiltreSV]    = useState('');
  const [texteInterv,  setTexteInterv] = useState('');
  const [sendingInterv,setSendingInterv]=useState(false);
  const [msgASupprimer,setMsgASupprimer]=useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Charger tous les chats ────────────────────────────────────────────────
  const chargerChats = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/chat-collab/${gestionnaireId}/surveillance`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) setChats(data);
    } catch { }
    finally { setLoading(false); }
  }, [gestionnaireId]);

  // ── Charger messages d'un chat ────────────────────────────────────────────
  const chargerMessages = useCallback(async (chatId: number) => {
    try {
      const res  = await fetch(`${API_BASE}/chat-collab/${gestionnaireId}/surveillance/${chatId}/messages`, { headers: hdrs as any });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch { }
  }, [gestionnaireId]);

  useEffect(() => { chargerChats(); }, [chargerChats]);

  useEffect(() => {
    if (!chatActif) return;
    chargerMessages(chatActif.id);
    pollingRef.current = setInterval(() => {
      chargerChats();
      chargerMessages(chatActif.id);
    }, 15000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [chatActif?.id]);

  // ── Envoyer intervention ──────────────────────────────────────────────────
  const envoyerIntervention = async () => {
    if (!texteInterv.trim() || !chatActif || sendingInterv) return;
    setSendingInterv(true);
    try {
      await fetch(`${API_BASE}/chat-collab/${gestionnaireId}/surveillance/${chatActif.id}/intervention`, {
        method: 'POST', headers: hdrs as any,
        body: JSON.stringify({ contenu: texteInterv.trim() }),
      });
      setTexteInterv('');
      await chargerMessages(chatActif.id);
    } catch { }
    finally { setSendingInterv(false); }
  };

  // ── Changer statut ────────────────────────────────────────────────────────
  const changerStatut = async (chatId: number, statut: string) => {
    try {
      await fetch(`${API_BASE}/chat-collab/${gestionnaireId}/surveillance/${chatId}/statut`, {
        method: 'PUT', headers: hdrs as any, body: JSON.stringify({ statut }),
      });
      await chargerChats();
      if (chatActif?.id === chatId) setChatActif(prev => prev ? { ...prev, statut } : null);
    } catch { }
  };

  // ── Supprimer message ─────────────────────────────────────────────────────
  const supprimerMessage = async (msgId: number) => {
    try {
      await fetch(`${API_BASE}/chat-collab/${gestionnaireId}/surveillance/messages/${msgId}`, {
        method: 'DELETE', headers: hdrs as any,
      });
      setMsgASupprimer(null);
      if (chatActif) await chargerMessages(chatActif.id);
    } catch { }
  };

  // ── Filtres ───────────────────────────────────────────────────────────────
  const sousvList = Array.from(new Map(chats.map(c => [c.collaborateur.id, c.collaborateur])).values());

  const chatsFiltres = chats.filter(c => {
    const m = [c.sujet, c.collaborateur.nom, c.collaborateur.nom_boutique, c.acheteur.nom, c.acheteur.email].join(' ').toLowerCase().includes(recherche.toLowerCase());
    const s = filtreStatut === 'tous' || c.statut === filtreStatut;
    const sv = !filtreSV || c.collaborateur.id === parseInt(filtreSV);
    return m && s && sv;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:   chats.length,
    actifs:  chats.filter(c => c.statut === 'actif').length,
    resolus: chats.filter(c => c.statut === 'resolu').length,
    fermes:  chats.filter(c => c.statut === 'ferme').length,
    msgs:    chats.reduce((s, c) => s + (c.nb_messages || 0), 0),
  };

  const groupesMessages = messages.reduce((acc: { date: string; msgs: Msg[] }[], msg) => {
    const d = fmtDateSep(msg.created_at);
    const last = acc[acc.length - 1];
    if (!last || last.date !== d) acc.push({ date: d, msgs: [msg] });
    else last.msgs.push(msg);
    return acc;
  }, []);

  const bulleColor = (role: string) => {
    if (role === 'collaborateur') return { bg: 'rgba(3,105,161,0.12)', color: T.sv, border: 'rgba(3,105,161,0.25)' };
    if (role === 'acheteur')     return { bg: 'rgba(124,58,237,0.10)', color: T.ach, border: 'rgba(124,58,237,0.2)' };
    return { bg: T.goldLight, color: T.gold, border: 'rgba(201,169,110,0.3)' };
  };

  const roleLabel = (role: string) => role === 'collaborateur' ? '🏪 Vendeur' : role === 'acheteur' ? '👤 Acheteur' : '⭐ Propriétaire';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: T.bg, fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '36px', marginBottom: '12px' }}>👁️</div><p style={{ color: T.textLight }}>Chargement surveillance…</p></div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', background: T.bg, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* Modal confirmation suppression */}
      {msgASupprimer !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: T.card, borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: T.text }}>Supprimer ce message ?</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: T.textLight }}>Le message sera masqué pour tous les participants.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setMsgASupprimer(null)} style={{ padding: '9px 20px', border: `1px solid ${T.border}`, borderRadius: '10px', background: T.card, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => supprimerMessage(msgASupprimer)} style={{ padding: '9px 20px', border: 'none', borderRadius: '10px', background: T.red, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <div style={{ width: '360px', flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, #1a2436, #c9a96e)', borderBottom: `1px solid ${T.border}` }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: 800, margin: '0 0 10px' }}>👁️ Surveillance des chats</p>

          {/* Stats rapides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
            {[
              { label: 'Total', val: stats.total, color: '#fff' },
              { label: 'Actifs', val: stats.actifs, color: '#4ade80' },
              { label: 'Résolus', val: stats.resolus, color: '#60a5fa' },
              { label: 'Messages', val: stats.msgs, color: '#c9a96e' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 800, color: s.color, margin: 0 }}>{s.val}</p>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="🔍 Rechercher…"
            style={{ width: '100%', boxSizing: 'border-box' as const, padding: '7px 12px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', outline: 'none', marginBottom: '8px' }} />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
            {['tous','actif','resolu','ferme'].map(f => (
              <button key={f} onClick={() => setFiltreStatut(f)}
                style={{ padding: '3px 10px', borderRadius: '12px', border: 'none', background: filtreStatut === f ? '#fff' : 'rgba(255,255,255,0.12)', color: filtreStatut === f ? '#1a2436' : '#fff', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                {f === 'tous' ? 'Tous' : f === 'actif' ? '⚡ Actifs' : f === 'resolu' ? '✓ Résolus' : '🔒 Fermés'}
              </button>
            ))}
          </div>

          {sousvList.length > 0 && (
            <select value={filtreSV} onChange={e => setFiltreSV(e.target.value)}
              style={{ width: '100%', marginTop: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px', outline: 'none', cursor: 'pointer' }}>
              <option value="" style={{ background: '#1a2436' }}>Tous les collaborateurs</option>
              {sousvList.map(sv => <option key={sv.id} value={sv.id} style={{ background: '#1a2436' }}>{sv.nom_boutique || sv.nom}</option>)}
            </select>
          )}
        </div>

        {/* Liste chats */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chatsFiltres.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textLight }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>💬</p>
              <p style={{ fontSize: '13px', margin: 0 }}>Aucun chat</p>
            </div>
          ) : chatsFiltres.map(chat => (
            <div key={chat.id} onClick={() => setChatActif(chat)}
              style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, background: chatActif?.id === chat.id ? T.goldLight : 'transparent', borderLeft: `3px solid ${chatActif?.id === chat.id ? T.gold : 'transparent'}`, transition: 'all 0.1s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.sujet}</p>
                <span style={{ fontSize: '10px', color: T.textMuted, flexShrink: 0, marginLeft: '6px' }}>{chat.dernier_message_date ? fmtHeure(chat.dernier_message_date) : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: '10px', color: T.sv, fontWeight: 600 }}>🏪 {chat.collaborateur.nom_boutique || chat.collaborateur.nom}</span>
                <span style={{ fontSize: '10px', color: T.ach }}>👤 {chat.acheteur.nom}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '10px', color: T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{chat.dernier_message || '—'}</p>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '8px',
                    background: chat.statut === 'actif' ? '#dcfce7' : chat.statut === 'resolu' ? '#dbeafe' : '#f3f4f6',
                    color: chat.statut === 'actif' ? T.green : chat.statut === 'resolu' ? T.blue : T.textLight }}>
                    {chat.statut === 'actif' ? '⚡' : chat.statut === 'resolu' ? '✓' : '🔒'}
                  </span>
                  <span style={{ fontSize: '10px', color: T.textMuted }}>💬{chat.nb_messages}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Zone principale ── */}
      {!chatActif ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textLight }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '52px', margin: '0 0 16px' }}>👁️</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Sélectionnez un chat</p>
            <p style={{ fontSize: '13px', margin: '0 0 20px' }}>Vous pouvez lire tous les échanges et intervenir si nécessaire</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: T.goldLight, border: `1px solid rgba(201,169,110,0.3)`, borderRadius: '10px' }}>
              <span>🔒</span><p style={{ fontSize: '12px', color: T.gold, margin: 0, fontWeight: 600 }}>Messages déchiffrés en temps réel — AES-256</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header chat */}
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: T.text, margin: '0 0 2px' }}>{chatActif.sujet}</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: '12px', color: T.sv }}>🏪 {chatActif.collaborateur.nom_boutique || chatActif.collaborateur.nom}</span>
                <span style={{ fontSize: '12px', color: T.ach }}>👤 {chatActif.acheteur.nom} · {chatActif.acheteur.email}</span>
                <span style={{ fontSize: '12px', color: T.textMuted }}>📅 {fmtDate(chatActif.created_at)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
                background: chatActif.statut === 'actif' ? '#dcfce7' : chatActif.statut === 'resolu' ? '#dbeafe' : '#f3f4f6',
                color: chatActif.statut === 'actif' ? T.green : chatActif.statut === 'resolu' ? T.blue : T.textLight }}>
                {chatActif.statut === 'actif' ? '⚡ Actif' : chatActif.statut === 'resolu' ? '✓ Résolu' : '🔒 Fermé'}
              </span>
              <select onChange={e => changerStatut(chatActif.id, e.target.value)} value={chatActif.statut}
                style={{ padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                <option value="actif">⚡ Actif</option>
                <option value="resolu">✓ Résolu</option>
                <option value="ferme">🔒 Fermer</option>
              </select>
              <button onClick={() => chargerMessages(chatActif.id)}
                style={{ padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: '8px', background: T.card, fontSize: '12px', cursor: 'pointer', color: T.textLight }}>
                🔄
              </button>
              <span style={{ fontSize: '10px', color: T.gold, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 Déchiffré</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {groupesMessages.map(groupe => (
              <div key={groupe.date}>
                <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                  <span style={{ fontSize: '11px', color: T.textMuted, background: '#f1f5f9', padding: '3px 12px', borderRadius: '10px' }}>{groupe.date}</span>
                </div>
                {groupe.msgs.map(msg => {
                  const bc = bulleColor(msg.expediteur_role);
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px', opacity: msg.supprime ? 0.4 : 1 }}>
                      {/* Avatar */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: bc.bg, border: `1px solid ${bc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginTop: '2px' }}>
                        {msg.expediteur_role === 'collaborateur' ? '🏪' : msg.expediteur_role === 'acheteur' ? '👤' : '⭐'}
                      </div>
                      {/* Bulle */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' as const }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: bc.color }}>{msg.expediteur_nom}</span>
                          <span style={{ fontSize: '10px', background: bc.bg, color: bc.color, padding: '1px 7px', borderRadius: '8px', border: `1px solid ${bc.border}` }}>{roleLabel(msg.expediteur_role)}</span>
                          <span style={{ fontSize: '10px', color: T.textMuted }}>{fmtHeure(msg.created_at)}</span>
                          {msg.supprime && <span style={{ fontSize: '10px', color: T.red }}>🗑️ Supprimé</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', background: bc.bg, border: `1px solid ${bc.border}`, fontSize: '14px', color: T.text, lineHeight: 1.6 }}>
                            {msg.supprime ? <em style={{ color: T.textMuted }}>Message supprimé</em> : msg.contenu}
                          </div>
                          {!msg.supprime && (
                            <button onClick={() => setMsgASupprimer(msg.id)}
                              style={{ padding: '6px 8px', border: `1px solid #fecaca`, borderRadius: '8px', background: '#fff5f5', color: T.red, fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone intervention */}
          <div style={{ padding: '14px 20px', borderTop: `2px solid ${T.gold}`, background: T.goldLight }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⭐ Votre intervention (visible par les 2 parties)
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea value={texteInterv} onChange={e => setTexteInterv(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerIntervention(); } }}
                placeholder="Écrire une intervention… (sera identifiée comme message du propriétaire)" rows={2}
                style={{ flex: 1, padding: '10px 14px', border: `1px solid rgba(201,169,110,0.3)`, borderRadius: '10px', fontSize: '13px', resize: 'none' as const, outline: 'none', background: '#fff', fontFamily: 'inherit', lineHeight: 1.5 }} />
              <button onClick={envoyerIntervention} disabled={!texteInterv.trim() || sendingInterv}
                style={{ padding: '10px 18px', background: texteInterv.trim() ? `linear-gradient(135deg, ${T.gold}, #a07840)` : '#cbd5e1', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: texteInterv.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                {sendingInterv ? '⏳' : '✈️ Intervenir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}