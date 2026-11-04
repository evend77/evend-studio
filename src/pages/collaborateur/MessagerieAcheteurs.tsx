// CHEMIN : src/pages/collaborateur/MessagerieAcheteurs.tsx
// e-Vend Studio — Dashboard collaborateur : messagerie avec mes acheteurs (texte seulement, chiffrée)
// Adapté de ChatAvecAcheteurs.tsx (e-Vend). Session : cookie httpOnly (credentials: 'include').
// API : /api/chat-acheteur-collab/:gestionnaireId/collab/...

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api';
const MAX_MESSAGE = 2000;
const MAX_SUJET = 120;

interface Conversation {
  id: number;
  sujet: string;
  statut: 'actif' | 'ferme';
  updated_at: string;
  acheteur: { id: number; prenom: string | null; nom: string | null };
  dernier_message: string | null;
  dernier_message_date: string | null;
  non_lus: number;
}

interface Message {
  id: number;
  expediteur_role: 'acheteur' | 'collaborateur' | 'gestionnaire';
  expediteur_nom: string;
  est_intervention?: boolean;
  contenu: string;
  supprime: boolean;
  created_at: string;
}

interface Props {
  gestionnaireId: number;
  accent?: string;
  isMobile?: boolean;
  onActivite?: () => void; // rafraîchit le badge du menu
}

const T = {
  gestionnaire: '#1a2436', acheteur: '#0f766e',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', success: '#16a34a',
};

const STATUT_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  actif:  { bg: '#eff6ff', color: '#1d4ed8', label: '🟢 Actif'  },
  resolu: { bg: '#f0fdf4', color: '#16a34a', label: '✅ Résolu' },
  ferme:  { bg: '#f3f4f6', color: '#6b7280', label: '🔒 Fermé'  },
};

const fmtHeure = (d: string) => {
  try {
    const dt = new Date(d), now = new Date();
    if (now.getTime() - dt.getTime() < 86400000 && dt.getDate() === now.getDate())
      return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

function Toast({ msg, type }: { msg: string; type: 'success' | 'danger' }) {
  const bg = type === 'success' ? T.success : T.danger;
  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', backgroundColor: bg, color: '#fff', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: '420px' }}>
      {msg}
    </div>
  );
}

export default function MessagerieAcheteurs({ gestionnaireId, accent = '#3b82f6', isMobile = false, onActivite }: Props) {
  const base = `${API_BASE}/chat-acheteur-collab/${gestionnaireId}/collab`;
  const jsonHdr = { 'Content-Type': 'application/json' };

  const [sidebarOuvert, setSidebarOuvert] = useState(true);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'danger' } | null>(null);
  const [modalNouv, setModalNouv] = useState(false);
  const [sujetNouv, setSujetNouv] = useState('');
  const [msgNouv, setMsgNouv] = useState('');
  const [creating, setCreating] = useState(false);
  const [acheteurs, setAcheteurs] = useState<{ id: number; prenom: string | null; nom: string | null }[]>([]);
  const [acheteurSel, setAcheteurSel] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const convActiveId = useRef<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const messageErreur = async (res: Response, defaut: string) => {
    try { const j = await res.json(); return j.error || defaut; } catch { return defaut; }
  };

  // ── Chargements ─────────────────────────────────────────────────────────────
  const chargerConvs = useCallback(async () => {
    try {
      const res = await fetch(`${base}/conversations`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setConvs(data);
          setConvActive(prev => (prev ? data.find((c: Conversation) => c.id === prev.id) || prev : prev));
        }
      }
    } catch { /* silencieux : le prochain cycle réessaie */ }
    finally { setLoading(false); }
  }, [base]);

  const chargerMessages = useCallback(async (convId: number) => {
    try {
      const res = await fetch(`${base}/conversations/${convId}/messages`, { credentials: 'include' });
      if (res.ok && convActiveId.current === convId) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
        onActivite?.();
      }
    } catch { /* silencieux */ }
  }, [base, onActivite]);

  useEffect(() => { chargerConvs(); }, [chargerConvs]);

  // Rafraîchissement toutes les 5 s, seulement quand l'onglet est visible.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      chargerConvs();
      if (convActiveId.current) chargerMessages(convActiveId.current);
    }, 5000);
    return () => clearInterval(t);
  }, [chargerConvs, chargerMessages]);

  // Défilement vers le bas, sauf si la personne a remonté dans la conversation.
  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    setUserScrolled(Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) > 60);
  }, []);

  useEffect(() => {
    if (messagesRef.current && !userScrolled) {
      const el = messagesRef.current;
      setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 80);
    }
  }, [messages, userScrolled]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const ouvrirConversation = async (conv: Conversation) => {
    convActiveId.current = conv.id;
    setConvActive(conv);
    setMessages([]);
    setUserScrolled(false);
    if (isMobile) setSidebarOuvert(false);
    await chargerMessages(conv.id);
    setConvs(prev => prev.map(c => (c.id === conv.id ? { ...c, non_lus: 0 } : c)));
  };

  const creerConversation = async () => {
    if (!acheteurSel || !sujetNouv.trim() || !msgNouv.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch(`${base}/conversations`, {
        method: 'POST', credentials: 'include', headers: jsonHdr,
        body: JSON.stringify({ acheteur_id: Number(acheteurSel), sujet: sujetNouv.trim(), message: msgNouv.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setModalNouv(false);
        setSujetNouv('');
        setMsgNouv('');
        setAcheteurSel('');
        await chargerConvs();
        if (data.conversation) await ouvrirConversation(data.conversation);
        showToast('✉️ Message envoyé à l\'acheteur', 'success');
      } else {
        showToast('❌ ' + (await messageErreur(res, 'Création échouée')), 'danger');
      }
    } catch { showToast('❌ Erreur réseau', 'danger'); }
    finally { setCreating(false); }
  };

  const envoyer = async () => {
    if (!texte.trim() || !convActive || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${base}/conversations/${convActive.id}/messages`, {
        method: 'POST', credentials: 'include', headers: jsonHdr,
        body: JSON.stringify({ contenu: texte.trim() }),
      });
      if (res.ok) {
        setTexte('');
        setUserScrolled(false);
        await chargerMessages(convActive.id);
        chargerConvs();
      } else {
        showToast('❌ ' + (await messageErreur(res, 'Envoi échoué')), 'danger');
      }
    } catch { showToast('❌ Erreur réseau', 'danger'); }
    finally { setSending(false); }
  };

  const ouvrirModal = async () => {
    setModalNouv(true);
    try {
      const res = await fetch(`${base}/acheteurs`, { credentials: 'include' });
      if (res.ok) setAcheteurs(await res.json());
    } catch { /* la liste restera vide */ }
  };

  const changerStatut = async (statut: 'actif' | 'ferme') => {
    if (!convActive) return;
    try {
      const res = await fetch(`${base}/conversations/${convActive.id}/statut`, {
        method: 'PUT', credentials: 'include', headers: jsonHdr, body: JSON.stringify({ statut }),
      });
      if (res.ok) { setConvActive({ ...convActive, statut }); chargerConvs(); }
      else showToast('❌ ' + (await messageErreur(res, 'Changement impossible')), 'danger');
    } catch { showToast('❌ Erreur réseau', 'danger'); }
  };

  const nomAcheteur = (a: { prenom: string | null; nom: string | null }) => [a.prenom, a.nom].filter(Boolean).join(' ') || 'Acheteur';

  const totalNonLus = convs.reduce((s, c) => s + (c.non_lus || 0), 0);
  const ferme = !!convActive && convActive.statut !== 'actif';

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.textLight }}>Chargement…</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '10px' : '20px' }}>
      <style>{`
        @keyframes mgFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        .mg-conv:hover{background:#f8fafc!important}
        .mg-scroll::-webkit-scrollbar{width:5px}
        .mg-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal : nouvelle conversation */}
      {modalNouv && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setModalNouv(false); }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: `2px solid ${accent}` }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: accent, margin: 0 }}>🛒 Écrire à un acheteur</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Acheteur *</label>
              <select value={acheteurSel} onChange={e => setAcheteurSel(e.target.value)}
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '6px', background: '#fff' }}>
                <option value="">— Choisir —</option>
                {acheteurs.map(a => <option key={a.id} value={a.id}>{nomAcheteur(a)}</option>)}
              </select>
              <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 14px' }}>{acheteurs.length === 0 ? 'Aucun acheteur n\'a encore commandé chez vous.' : 'Seuls les acheteurs qui ont déjà commandé chez vous sont listés.'}</p>
              <label style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Sujet *</label>
              <input type="text" value={sujetNouv} maxLength={MAX_SUJET} onChange={e => setSujetNouv(e.target.value)} autoFocus
                placeholder="Ex : Question sur mes commissions"
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '14px' }} />
              <label style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Message *</label>
              <textarea value={msgNouv} maxLength={MAX_MESSAGE} onChange={e => setMsgNouv(e.target.value)} rows={4}
                placeholder="Votre message…"
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: '14px' }} />
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#1d4ed8', margin: 0 }}>🔒 Message chiffré. Texte seulement.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setModalNouv(false); setSujetNouv(''); setMsgNouv(''); setAcheteurSel(''); }}
                  style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: '#fff', color: T.text, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={creerConversation} disabled={!acheteurSel || !sujetNouv.trim() || !msgNouv.trim() || creating}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: acheteurSel && sujetNouv.trim() && msgNouv.trim() ? accent : '#cbd5e1', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: acheteurSel && sujetNouv.trim() && msgNouv.trim() ? 'pointer' : 'not-allowed' }}>
                  {creating ? '⏳ Envoi…' : '📨 Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ margin: isMobile ? '-10px -10px 0' : '-20px -20px 0', height: 'calc(100vh - 112px)', display: 'flex', overflow: 'hidden', backgroundColor: T.bg, borderRadius: '8px', border: `1px solid ${T.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative' }}>

        {isMobile && sidebarOuvert && (
          <div onClick={() => setSidebarOuvert(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 40 }} />
        )}

        {/* ── Colonne gauche ── */}
        <div style={{
          width: isMobile ? '82%' : '290px', maxWidth: isMobile ? '320px' : undefined,
          position: isMobile ? 'absolute' : 'static', top: 0, left: 0, bottom: 0,
          zIndex: isMobile ? 50 : undefined,
          transform: isMobile ? (sidebarOuvert ? 'translateX(0)' : 'translateX(-100%)') : undefined,
          transition: isMobile ? 'transform 0.25s ease' : undefined,
          boxShadow: isMobile ? '2px 0 16px rgba(0,0,0,0.15)' : undefined,
          backgroundColor: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `2px solid ${accent}`, backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛒 Acheteurs</h3>
                {totalNonLus > 0 && <p style={{ fontSize: '10px', color: T.danger, fontWeight: 700, margin: '2px 0 0 0' }}>{totalNonLus} réponse{totalNonLus > 1 ? 's' : ''} non lue{totalNonLus > 1 ? 's' : ''}</p>}
              </div>
              <button onClick={ouvrirModal}
                style={{ backgroundColor: accent, color: '#fff', border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                + Nouveau
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {convs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>
                <p>Aucune conversation</p>
                <p style={{ fontSize: '11px', marginTop: '8px' }}>Cliquez sur « Nouveau » pour écrire à un acheteur</p>
              </div>
            ) : convs.map(c => {
              const estActif = convActive?.id === c.id;
              const st = STATUT_CONFIG[c.statut] || STATUT_CONFIG.actif;
              return (
                <div key={c.id} className="mg-conv" onClick={() => ouvrirConversation(c)}
                  style={{ padding: '12px 14px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', backgroundColor: estActif ? '#f1f5f9' : '#fff', borderLeft: estActif ? `3px solid ${accent}` : '3px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', fontWeight: c.non_lus > 0 ? 800 : 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '8px' }}>{c.sujet}</p>
                    {c.non_lus > 0 && <span style={{ backgroundColor: T.danger, color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '10px', flexShrink: 0 }}>{c.non_lus}</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: accent, fontWeight: 600, margin: '0 0 2px 0' }}>🛒 {nomAcheteur(c.acheteur)}</p>
                  <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.dernier_message || '—'}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ backgroundColor: st.bg, color: st.color, padding: '1px 6px', borderRadius: '20px', fontSize: '9px', fontWeight: 700 }}>{st.label}</span>
                    <span style={{ fontSize: '9px', color: T.textLight }}>{c.dernier_message_date ? fmtHeure(c.dernier_message_date) : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zone chat ── */}
        {convActive ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.card, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {isMobile && (
                <button onClick={() => setSidebarOuvert(true)} title="Conversations"
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: T.text, padding: '4px', flexShrink: 0 }}>☰</button>
              )}
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: T.acheteur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🛒</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 800, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{convActive.sujet}</p>
                <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{nomAcheteur(convActive.acheteur)} · 🔒 chiffré</p>
              </div>
              <button onClick={() => changerStatut(convActive.statut === 'actif' ? 'ferme' : 'actif')}
                style={{ border: `1px solid ${T.border}`, background: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: T.text, flexShrink: 0 }}>
                {convActive.statut === 'actif' ? '🔒 Fermer' : '🔓 Rouvrir'}
              </button>
            </div>

            <div ref={messagesRef} onScroll={handleScroll} className="mg-scroll"
              style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', gap: '16px', padding: '6px 12px', backgroundColor: '#fff', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: accent }}>🏪 Couleur = Vous</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: T.acheteur }}>🛒 Vert = Acheteur</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: T.gestionnaire }}>🏢 Foncé = Gestionnaire</span>
              </div>

              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: T.textLight }}>
                  <p style={{ fontSize: '13px' }}>Chargement des messages…</p>
                </div>
              ) : messages.map(msg => {
                const moi = msg.expediteur_role === 'collaborateur';
                const couleur = moi ? accent : msg.expediteur_role === 'acheteur' ? T.acheteur : T.gestionnaire;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: moi ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', marginBottom: '8px', animation: 'mgFade 0.2s ease' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
                      {moi ? '🏪' : msg.expediteur_role === 'acheteur' ? '🛒' : '🏢'}
                    </div>
                    <div style={{ maxWidth: isMobile ? '80%' : '65%' }}>
                      <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 3px 0', textAlign: moi ? 'right' : 'left' }}>
                        {moi ? 'Vous' : msg.expediteur_nom} · {fmtHeure(msg.created_at)}
                      </p>
                      <div style={{
                        backgroundColor: couleur, color: msg.supprime ? '#ddd' : '#fff', padding: '10px 14px',
                        borderRadius: moi ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                        fontSize: msg.supprime ? '11px' : '13px', lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        fontStyle: msg.supprime ? 'italic' : 'normal', opacity: msg.supprime ? 0.7 : 1,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {msg.supprime ? 'Message supprimé' : msg.contenu}
                      </div>
                    </div>
                  </div>
                );
              })}

              {ferme && (
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: T.textLight, margin: 0, fontWeight: 600 }}>
                    🔒 Conversation fermée
                  </p>
                </div>
              )}
            </div>

            <div style={{ padding: isMobile ? '10px 12px' : '14px 20px', borderTop: `1px solid ${T.border}`, backgroundColor: T.card, flexShrink: 0 }}>
              {ferme ? (
                <p style={{ textAlign: 'center', color: T.textLight, fontSize: '12px', margin: 0 }}>Conversation fermée. Cliquez sur « Rouvrir » pour écrire de nouveau.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <textarea value={texte} maxLength={MAX_MESSAGE} onChange={e => setTexte(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                      placeholder="Écrire à l'acheteur… (Entrée pour envoyer)" rows={2}
                      style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                    <button onClick={envoyer} disabled={!texte.trim() || sending}
                      style={{ backgroundColor: texte.trim() ? accent : '#cbd5e1', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 18px', fontSize: '18px', cursor: texte.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
                      {sending ? '⏳' : '➤'}
                    </button>
                  </div>
                  {texte.length > MAX_MESSAGE - 200 && (
                    <p style={{ fontSize: '10px', color: T.textLight, margin: '4px 0 0', textAlign: 'right' }}>{texte.length} / {MAX_MESSAGE}</p>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '20px' : 0 }}>
            <div style={{ textAlign: 'center', color: T.textLight }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🛒</div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Sélectionnez une conversation</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>ou cliquez sur « Nouveau » pour écrire à un acheteur</p>
              {isMobile && (
                <button onClick={() => setSidebarOuvert(true)}
                  style={{ marginTop: '18px', padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: accent, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  ☰ Voir mes conversations
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}