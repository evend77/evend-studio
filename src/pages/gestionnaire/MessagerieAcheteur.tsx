/**
 * MessagerieVendeur.tsx — src/pages/vendeur/MessagerieVendeur.tsx
 * Chat vendeur ↔ acheteurs — polling 5s — AES-256 via API
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

interface Conversation {
  id: number; sujet: string; statut: string; est_litige: boolean;
  commande_id: string | null; cree_le: string; mis_a_jour_le: string;
  acheteur: { id: number; nom: string; email: string };
  dernier_message: string | null; dernier_message_date: string | null;
  non_lus: number;
}
interface Message {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string;
  piece_jointe_url: string | null; piece_jointe_nom: string | null;
  piece_jointe_type: string | null; est_intervention: boolean; cree_le: string;
}
interface MessagerieVendeurProps {
  vendeurUser?: { id?: number; nom?: string };
}

const fmtHeure = (d: string) => {
  try {
    const dt = new Date(d);
    const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate())
      return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000)
      return dt.toLocaleDateString('fr-CA', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  } catch { return ''; }
};

const fmtDateSep = (d: string) => {
  try {
    const dt = new Date(d);
    const now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate()) return "Aujourd'hui";
    if (diff < 172800000) return 'Hier';
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
};

const statutCfg: Record<string, { bg: string; color: string; label: string }> = {
  actif:    { bg: '#e6f5f0', color: '#008060', label: '🟢 Actif'    },
  resolu:   { bg: '#dcfce7', color: '#16a34a', label: '✅ Résolu'   },
  litige:   { bg: '#fff1f2', color: '#be123c', label: '⚖️ Litige'   },
  ferme:    { bg: '#f3f4f6', color: '#6b7280', label: '🔒 Fermé'    },
  archive:  { bg: '#f3f4f6', color: '#6b7280', label: '📁 Archivé'  },
};

export default function MessagerieVendeur({ vendeurUser }: MessagerieVendeurProps) {
  const [convs, setConvs]           = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [texte, setTexte]           = useState('');
  const [recherche, setRecherche]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [pieceJointe, setPieceJointe] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [lastMsgDate, setLastMsgDate]     = useState<string | null>(null);
  const lastMsgDateRef = useRef<string | null>(null); // ref anti race-condition
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const getToken = () => localStorage.getItem('token');

  // ── Charger conversations ──────────────────────────────────────────────
  const chargerConvs = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/messagerie/vendeur/conversations`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await r.json();
      if (Array.isArray(data)) setConvs(data);
    } catch {}
    setLoading(false);
  }, []);

  // ── Charger messages d'une conversation ───────────────────────────────
  const chargerMessages = useCallback(async (convId: number, since?: string | null) => {
    try {
      const url = since
        ? `${API}/api/messagerie/vendeur/conversations/${convId}/messages?since=${encodeURIComponent(since)}`
        : `${API}/api/messagerie/vendeur/conversations/${convId}/messages`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await r.json();
      if (!Array.isArray(data)) return;

      if (since) {
        if (data.length > 0) {
          setMessages(prev => {
            const existIds = new Set(prev.map(m => m.id));
            const nouveaux = data.filter((m: Message) => !existIds.has(m.id));
            return [...prev, ...nouveaux];
          });
          setLastMsgDate(data[data.length - 1].cree_le);
          setConvs(prev => prev.map(c => c.id === convId ? { ...c, non_lus: 0 } : c));
        }
      } else {
        setMessages(data);
        if (data.length > 0) setLastMsgDate(data[data.length - 1].cree_le);
        else setLastMsgDate(null);
        setConvs(prev => prev.map(c => c.id === convId ? { ...c, non_lus: 0 } : c));
      }
    } catch {}
  }, []);

  useEffect(() => { lastMsgDateRef.current = lastMsgDate; }, [lastMsgDate]);
  useEffect(() => { chargerConvs(); }, [chargerConvs]);

  // ── Polling 5s ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      chargerConvs();
      if (convActive) chargerMessages(convActive.id, lastMsgDateRef.current);
    }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convActive, chargerConvs, chargerMessages]);

  // ── Scroll bas quand nouveaux messages ────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Ouvrir une conversation ────────────────────────────────────────────
  const ouvrirConv = async (conv: Conversation) => {
    setConvActive(conv);
    setMessages([]);
    setLastMsgDate(null);
    await chargerMessages(conv.id);
  };

  // ── Envoyer un message ─────────────────────────────────────────────────
  const envoyer = async () => {
    if ((!texte.trim() && !pieceJointe) || !convActive || sending) return;
    setSending(true);
    try {
      let pjUrl: string | null = null, pjNom: string | null = null, pjType: string | null = null;
      const fichier = pieceJointe;
      if (fichier) {
        setUploadingFile(true);
        const fd = new FormData();
        fd.append('file', fichier);
        const uploadRes = await fetch(`${API}/api/upload`, {
          method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          pjUrl  = uploadData.url;
          pjNom  = fichier.name;
          pjType = fichier.type;
        }
        setUploadingFile(false);
        setPieceJointe(null);
      }

      await fetch(`${API}/api/messagerie/vendeur/conversations/${convActive.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          contenu: texte.trim() || '',
          piece_jointe_url: pjUrl, piece_jointe_nom: pjNom, piece_jointe_type: pjType,
        }),
      });
      setTexte('');
      setLastMsgDate(null); // force rechargement complet
      await chargerMessages(convActive.id);
      await chargerConvs();
    } catch {}
    setSending(false);
  };

  const changerStatut = async (statut: string) => {
    if (!convActive) return;
    await fetch(`${API}/api/messagerie/vendeur/conversations/${convActive.id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ statut }),
    });
    setConvActive(prev => prev ? { ...prev, statut } : prev);
    setConvs(prev => prev.map(c => c.id === convActive.id ? { ...c, statut } : c));
  };

  const convsFiltrees = convs.filter(c => {
    const s = recherche.toLowerCase();
    return !s || c.acheteur.nom.toLowerCase().includes(s) || c.sujet.toLowerCase().includes(s);
  });

  const totalNonLus = convs.reduce((s, c) => s + c.non_lus, 0);

  // Grouper messages par date
  const groupesMessages = () => {
    const groupes: { date: string; msgs: Message[] }[] = [];
    messages.forEach(m => {
      const d = fmtDateSep(m.cree_le);
      const last = groupes[groupes.length - 1];
      if (!last || last.date !== d) groupes.push({ date: d, msgs: [m] });
      else last.msgs.push(m);
    });
    return groupes;
  };

  // ── Styles ─────────────────────────────────────────────────────────────
  const S = {
    wrap: { display: 'flex', height: 'calc(100vh - 112px)', backgroundColor: '#f4f6f8', borderRadius: '12px', border: '1px solid #e1e4e8', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } as React.CSSProperties,
    sidebar: { width: '300px', backgroundColor: 'white', borderRight: '1px solid #e1e4e8', display: 'flex', flexDirection: 'column' as const, flexShrink: 0 },
    chat: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' },
  };

  const renderPJ = (msg: Message) => {
    if (!msg.piece_jointe_url) return null;
    const isImage = msg.piece_jointe_type?.startsWith('image/');
    const isVendeur = msg.expediteur_role === 'vendeur';
    return (
      <div style={{ marginTop: '6px' }}>
        {isImage ? (
          <img src={msg.piece_jointe_url} alt={msg.piece_jointe_nom || 'Image'}
            style={{ maxWidth: '220px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
            onClick={() => window.open(msg.piece_jointe_url!, '_blank')} />
        ) : (
          <a href={msg.piece_jointe_url} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: isVendeur ? 'rgba(255,255,255,0.2)' : '#f0f5f5', borderRadius: '8px', textDecoration: 'none', color: isVendeur ? 'white' : '#1a2332' }}>
            <span style={{ fontSize: '18px' }}>📎</span>
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{msg.piece_jointe_nom}</span>
          </a>
        )}
      </div>
    );
  };

  return (
    <div style={S.wrap}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        .conv-item:hover{background-color:#f8fafc!important}
        .msg-input:focus{border-color:#008060!important;box-shadow:0 0 0 3px rgba(0,128,96,0.1)!important}
        .send-btn:hover:not(:disabled){background-color:#006650!important}
        .scroll-msgs::-webkit-scrollbar{width:4px}
        .scroll-msgs::-webkit-scrollbar-track{background:transparent}
        .scroll-msgs::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
      `}</style>

      {/* ── Sidebar ── */}
      <div style={S.sidebar}>
        <div style={{ padding: '16px', borderBottom: '2px solid #008060', backgroundColor: '#f8fffe' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#008060', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💬 Messagerie acheteurs
              </h3>
              {totalNonLus > 0 && (
                <p style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', margin: '2px 0 0 0' }}>
                  {totalNonLus} message{totalNonLus > 1 ? 's' : ''} non lu{totalNonLus > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="🔍 Rechercher..."
            style={{ width: '100%', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid #e1e4e8', borderTop: '3px solid #008060', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              Chargement...
            </div>
          ) : convsFiltrees.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#bbb' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px', opacity: 0.3 }}>💬</div>
              <p style={{ fontSize: '12px', fontWeight: '600' }}>Aucune conversation</p>
            </div>
          ) : convsFiltrees.map(c => {
            const nonLus  = c.non_lus;
            const actif   = convActive?.id === c.id;
            const cfg     = statutCfg[c.statut] || statutCfg.actif;
            return (
              <div key={c.id} className="conv-item" onClick={() => ouvrirConv(c)}
                style={{ padding: '12px 14px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', backgroundColor: actif ? '#e6f5f0' : 'white', borderLeft: `3px solid ${actif ? '#008060' : 'transparent'}`, transition: 'all 0.1s' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#008060', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', flexShrink: 0 }}>
                    {c.acheteur.nom.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '13px', fontWeight: nonLus > 0 ? '800' : '700', color: '#1a2332', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.acheteur.nom}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        {nonLus > 0 && <span style={{ backgroundColor: '#dc2626', color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '10px' }}>{nonLus}</span>}
                        {c.dernier_message_date && <span style={{ fontSize: '10px', color: '#999' }}>{fmtHeure(c.dernier_message_date)}</span>}
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: '#666', margin: '1px 0', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.sujet}
                    </p>
                    {c.dernier_message && (
                      <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.dernier_message}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '5px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ ...cfg, padding: '1px 7px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>{cfg.label}</span>
                      {c.commande_id && <span style={{ backgroundColor: '#e6f5f0', color: '#008060', padding: '1px 7px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>#{c.commande_id}</span>}
                      {c.est_litige && <span style={{ backgroundColor: '#fff1f2', color: '#be123c', padding: '1px 7px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>⚖️ Litige</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Zone chat ── */}
      {convActive ? (
        <div style={S.chat}>
          {/* Header conv */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #e1e4e8', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#008060', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', flexShrink: 0 }}>
              {convActive.acheteur.nom.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '800', color: '#1a2332', margin: 0 }}>{convActive.acheteur.nom}</p>
              <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                {convActive.sujet}
                {convActive.commande_id && <span style={{ marginLeft: '8px', backgroundColor: '#e6f5f0', color: '#008060', padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>Commande #{convActive.commande_id}</span>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ ...(statutCfg[convActive.statut] || statutCfg.actif), padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                {(statutCfg[convActive.statut] || statutCfg.actif).label}
              </span>
              {convActive.statut === 'actif' && (
                <button onClick={() => changerStatut('resolu')}
                  style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #16a34a', borderRadius: '7px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  ✅ Résoudre
                </button>
              )}
              {convActive.statut === 'resolu' && (
                <button onClick={() => changerStatut('actif')}
                  style={{ backgroundColor: '#e6f5f0', color: '#008060', border: '1px solid #008060', borderRadius: '7px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                  🔄 Réouvrir
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="scroll-msgs" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fffe' }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '36px', opacity: 0.3 }}>💬</span>
                <p style={{ fontSize: '12px', fontWeight: '600' }}>Aucun message</p>
              </div>
            ) : groupesMessages().map(groupe => (
              <React.Fragment key={groupe.date}>
                <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 8px' }}>
                  <span style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '3px 12px', borderRadius: '20px', fontSize: '10px', color: '#888', fontWeight: '600' }}>
                    {groupe.date}
                  </span>
                </div>
                {groupe.msgs.map(msg => {
                  if (msg.est_intervention) return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0', animation: 'fadeIn 0.2s ease' }}>
                      <div style={{ backgroundColor: '#fff1f2', border: '2px solid #be123c', borderRadius: '12px', padding: '10px 16px', maxWidth: '70%', textAlign: 'center' }}>
                        <p style={{ fontSize: '10px', fontWeight: '700', color: '#be123c', margin: '0 0 4px 0', textTransform: 'uppercase' }}>⚡ Admin e-Vend · {fmtHeure(msg.cree_le)}</p>
                        <p style={{ fontSize: '13px', color: '#1a2332', margin: 0, lineHeight: '1.5' }}>{msg.contenu}</p>
                      </div>
                    </div>
                  );
                  const estVendeur = msg.expediteur_role === 'vendeur';
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: estVendeur ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', marginBottom: '8px', animation: 'fadeIn 0.2s ease' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: estVendeur ? '#008060' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: estVendeur ? 'white' : '#1a2332', flexShrink: 0 }}>
                        {estVendeur ? '🏪' : msg.expediteur_nom.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ maxWidth: '65%' }}>
                        <p style={{ fontSize: '10px', color: '#999', margin: '0 0 3px 0', textAlign: estVendeur ? 'right' : 'left' }}>
                          {estVendeur ? 'Vous' : msg.expediteur_nom} · {fmtHeure(msg.cree_le)}
                        </p>
                        <div style={{ backgroundColor: estVendeur ? '#008060' : 'white', color: estVendeur ? 'white' : '#1a2332', padding: '10px 14px', borderRadius: estVendeur ? '14px 14px 4px 14px' : '14px 14px 14px 4px', fontSize: '13px', lineHeight: '1.6', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: estVendeur ? 'none' : '1px solid #e1e4e8' }}>
                          {msg.contenu}
                          {renderPJ(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Saisie */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e1e4e8', backgroundColor: 'white', flexShrink: 0 }}>
            {convActive.statut === 'ferme' ? (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', margin: 0 }}>🔒 Cette conversation est fermée.</p>
            ) : (
              <>
                {pieceJointe && (
                  <div style={{ marginBottom: '8px', padding: '8px 12px', backgroundColor: '#f0f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#537373' }}>📎 {pieceJointe.name}</span>
                    <button onClick={() => setPieceJointe(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) setPieceJointe(e.target.files[0]); e.target.value = ''; }} />
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ backgroundColor: '#f0f5f5', border: 'none', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', fontSize: '16px', flexShrink: 0, color: '#537373' }}
                    title="Joindre un fichier">
                    📎
                  </button>
                  <textarea value={texte} onChange={e => setTexte(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                    placeholder="Écrire un message... (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
                    rows={2}
                    className="msg-input"
                    style={{ flex: 1, border: '1px solid #e1e4e8', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
                  <button onClick={envoyer} disabled={(!texte.trim() && !pieceJointe) || sending}
                    className="send-btn"
                    style={{ backgroundColor: (texte.trim() || pieceJointe) ? '#008060' : '#ccc', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 18px', fontSize: '16px', cursor: (texte.trim() || pieceJointe) ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'background-color 0.2s' }}>
                    {sending ? '⏳' : '➤'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fffe', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '52px', opacity: 0.2 }}>💬</span>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#bbb' }}>Sélectionnez une conversation</p>
        </div>
      )}
    </div>
  );
}