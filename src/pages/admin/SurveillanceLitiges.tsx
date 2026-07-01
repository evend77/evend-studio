/**
 * SurveillanceLitiges.tsx — src/pages/admin/SurveillanceLitiges.tsx
 * Vue admin : toutes les conversations, déchiffrement, interventions, litiges
 * Polling 15s — connecté BD
 * Ajout : suppression de messages par admin (y compris ses propres messages)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

interface Conv {
  id: number; sujet: string; statut: string; est_litige: boolean;
  commande_id: string | null; cree_le: string; mis_a_jour_le: string;
  notes_admin: string | null; nb_messages: number;
  acheteur: { id: number; nom: string; email: string };
  vendeur:  { id: number; nom: string; boutique: string; seller_id: string };
  dernier_message: string | null; dernier_message_date: string | null;
}
interface Message {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string;
  contenu_original?: string;
  supprime_par_admin?: boolean;
  piece_jointe_url: string | null; piece_jointe_nom: string | null;
  piece_jointe_type: string | null; est_intervention: boolean; cree_le: string;
}

const T = {
  danger: '#dc2626', success: '#16a34a', info: '#2563eb',
  warning: '#d97706', vendeur: '#0369a1', acheteur: '#7c3aed',
  border: '#e1e4e8', text: '#1a2332', textLight: '#6b7280',
  bg: '#f4f6f8',
};

const fmtHeure = (d: string) => {
  try {
    const dt = new Date(d), now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate())
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
    const dt = new Date(d), now = new Date();
    const diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate()) return "Aujourd'hui";
    if (diff < 172800000) return 'Hier';
    return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
  } catch { return ''; }
};

const statutCfg: Record<string, { bg: string; color: string; label: string }> = {
  actif:   { bg: '#eff6ff', color: '#1d4ed8', label: '💬 Actif'   },
  litige:  { bg: '#fff1f2', color: '#be123c', label: '⚖️ Litige'  },
  resolu:  { bg: '#f0fdf4', color: '#16a34a', label: '✅ Résolu'  },
  ferme:   { bg: '#f3f4f6', color: '#6b7280', label: '🔒 Fermé'   },
  archive: { bg: '#f3f4f6', color: '#6b7280', label: '📁 Archivé' },
};

function Toast({ msg, type }: { msg: string; type: 'success' | 'info' | 'danger' }) {
  const bg = { success: T.success, info: T.info, danger: T.danger }[type];
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: bg, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: '420px' }}>
      {msg}
    </div>
  );
}

interface SurveillanceLitigesProps { naviguerVers?: (p: string, d?: any) => void; }

export default function SurveillanceLitiges({ naviguerVers }: SurveillanceLitigesProps) {
  const [convs,          setConvs]          = useState<Conv[]>([]);
  const [convActive,     setConvActive]     = useState<Conv | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [texteAdmin,     setTexteAdmin]     = useState('');
  const [notesAdmin,     setNotesAdmin]     = useState('');
  const [modeIntervention, setModeIntervention] = useState(false);
  const [modifierNotes,  setModifierNotes]  = useState(false);
  const [recherche,      setRecherche]      = useState('');
  const [filtreStatut,   setFiltreStatut]   = useState<string>('tous');
  const [filtreUrgent,   setFiltreUrgent]   = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [toast,          setToast]          = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  const [confirmerArchive, setConfirmerArchive] = useState(false);
  
  // États pour la suppression de messages et le scroll
  const [messageSelectionne, setMessageSelectionne] = useState<Message | null>(null);
  const [modalSuppression, setModalSuppression] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = localStorage.getItem('token');

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Détecte si l'utilisateur a scrollé manuellement
  const handleScroll = useCallback(() => {
    if (!messagesRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    
    setUserHasScrolled(!isAtBottom);
  }, []);

  //
  useEffect(() => {
    const currentRef = messagesRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // ── Charger toutes les conversations ─────────────────────────────────────
  const chargerConvs = useCallback(async () => {
    try {
      let url = `${API}/api/messagerie/admin/conversations?limit=100&offset=0`;
      if (filtreStatut !== 'tous') url += `&statut=${filtreStatut}`;
      if (filtreUrgent) url += `&litige=true`;
      if (recherche) url += `&search=${encodeURIComponent(recherche)}`;

      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (Array.isArray(data)) setConvs(data);
    } catch {}
    setLoading(false);
  }, [token, filtreStatut, filtreUrgent, recherche]);

  // ── Charger messages ───────────────────────────────────────────────────
  const chargerMessages = useCallback(async (convId: number) => {
    try {
      const r = await fetch(`${API}/api/messagerie/admin/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (Array.isArray(data)) {
        const oldCount = messages.length;
        setMessages(data);
        
        // Auto-scroll seulement si c'est le premier chargement OU nouveau message ET pas de scroll manuel
        if (oldCount === 0) {
          setTimeout(() => { 
            if (messagesRef.current) {
              messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
            }
          }, 100);
        } 
        else if (data.length > oldCount && !userHasScrolled) {
          setTimeout(() => { 
            if (messagesRef.current) {
              messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
            }
          }, 100);
        }
        
        setLastMessageCount(data.length);
      }
    } catch {}
  }, [token, messages.length, userHasScrolled]);

  useEffect(() => { chargerConvs(); }, [chargerConvs]);

  // ── Polling 15s ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      chargerConvs();
      if (convActive) chargerMessages(convActive.id);
    }, 15000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convActive, chargerConvs, chargerMessages]);

  const ouvrirConv = async (conv: Conv) => {
    setConvActive(conv);
    setMessages([]);
    setModeIntervention(false);
    setNotesAdmin(conv.notes_admin || '');
    setUserHasScrolled(false);
    await chargerMessages(conv.id);
  };

  // ── Intervenir ─────────────────────────────────────────────────────────
  const intervenir = async () => {
    if (!texteAdmin.trim() || !convActive || sending) return;
    setSending(true);
    try {
      const r = await fetch(`${API}/api/messagerie/admin/conversations/${convActive.id}/intervenir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: texteAdmin.trim() }),
      });
      if (r.ok) {
        setTexteAdmin('');
        setModeIntervention(false);
        await chargerMessages(convActive.id);
        showToast('✅ Intervention envoyée dans la conversation.', 'success');
      }
    } catch {}
    setSending(false);
  };

  // ── Supprimer un message (admin peut tout supprimer) ────────────────────
  const supprimerMessage = async (messageId: number) => {
    try {
      const response = await fetch(`${API}/api/messagerie/admin/messages/${messageId}/supprimer`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          raison: 'Message supprimé par l\'administration' 
        }),
      });

      if (response.ok) {
        // Met à jour l'affichage local
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                contenu: '🗑️ Message supprimé par l\'administration',
                supprime_par_admin: true 
              } 
            : msg
        ));
        setModalSuppression(false);
        setMessageSelectionne(null);
        showToast('✅ Message masqué avec succès', 'success');
      } else {
        const error = await response.json();
        showToast(`❌ Erreur: ${error.error || 'Impossible de supprimer'}`, 'danger');
      }
    } catch (error) {
      showToast('❌ Erreur lors de la suppression', 'danger');
    }
  };

  // ── Changer statut ─────────────────────────────────────────────────────
  const changerStatut = async (statut: string, estLitige?: boolean) => {
    if (!convActive) return;
    try {
      await fetch(`${API}/api/messagerie/admin/conversations/${convActive.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut, ...(estLitige !== undefined ? { est_litige: estLitige } : {}) }),
      });
      setConvActive(prev => prev ? { ...prev, statut, est_litige: estLitige ?? prev.est_litige } : prev);
      setConvs(prev => prev.map(c => c.id === convActive.id ? { ...c, statut, est_litige: estLitige ?? c.est_litige } : c));
      setConfirmerArchive(false);
      const labels: Record<string, string> = { actif: 'réouvert', litige: 'marqué en litige', resolu: 'résolu', archive: 'archivé', ferme: 'fermé' };
      showToast(`📋 Dossier ${labels[statut] || statut}.`, 'info');
    } catch {}
  };

  // ── Sauvegarder notes admin ─────────────────────────────────────────────
  const sauvegarderNotes = async () => {
    if (!convActive) return;
    await fetch(`${API}/api/messagerie/admin/conversations/${convActive.id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notes_admin: notesAdmin }),
    });
    setConvActive(prev => prev ? { ...prev, notes_admin: notesAdmin } : prev);
    setModifierNotes(false);
    showToast('📝 Notes sauvegardées.', 'success');
  };

  const nbLitiges = convs.filter(c => c.est_litige).length;
  const nbActifs  = convs.filter(c => c.statut === 'actif').length;

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

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .conv-admin:hover{background:#fafafa!important}
        .msg-scroll::-webkit-scrollbar{width:5px}
        .msg-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
        .conv-scroll::-webkit-scrollbar{width:4px}
        .conv-scroll::-webkit-scrollbar-thumb{background:#e1e4e8;border-radius:4px}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal confirmation archiver */}
      {confirmerArchive && convActive && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', width: '400px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: T.text, margin: '0 0 10px 0' }}>📁 Archiver cette conversation ?</h3>
            <p style={{ fontSize: '13px', color: T.textLight, margin: '0 0 20px 0', lineHeight: '1.6' }}>
              La conversation entre <strong>{convActive.vendeur.boutique}</strong> et <strong>{convActive.acheteur.nom}</strong> sera archivée.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmerArchive(false)} style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => changerStatut('archive')} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#6b7280', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>📁 Archiver</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression de message */}
      {modalSuppression && messageSelectionne && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', width: '480px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: T.danger, margin: '0 0 10px 0' }}>
              {messageSelectionne.expediteur_role === 'admin' ? '🗑️ Supprimer votre message ?' : '🗑️ Supprimer ce message ?'}
            </h3>
            
            <p style={{ fontSize: '13px', color: T.textLight, margin: '0 0 12px 0' }}>
              {messageSelectionne.expediteur_role === 'admin' 
                ? 'Votre message d\'intervention sera remplacé par "Supprimé par l\'administration" :'
                : 'Le message suivant sera remplacé par "Supprimé par l\'administration" :'}
            </p>
            
            <div style={{ backgroundColor: '#fff5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: `1px solid ${T.danger}` }}>
              <p style={{ fontSize: '12px', color: T.text, margin: '0 0 6px 0', fontStyle: 'italic' }}>
                "{messageSelectionne.contenu.substring(0, 150)}{messageSelectionne.contenu.length > 150 ? '...' : ''}"
              </p>
              <p style={{ fontSize: '10px', color: '#999', margin: 0 }}>
                Expéditeur: {messageSelectionne.expediteur_nom} · {fmtHeure(messageSelectionne.cree_le)}
              </p>
            </div>
            
            <div style={{ backgroundColor: '#f0f0f0', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: T.text, margin: '0 0 8px 0' }}>🔒 Pour les admins uniquement :</p>
              <textarea
                value={messageSelectionne.contenu_original || messageSelectionne.contenu}
                readOnly
                rows={2}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: '6px', padding: '8px', fontSize: '11px', backgroundColor: '#f9f9f9', fontFamily: 'monospace' }}
                placeholder="Message original conservé pour référence admin"
              />
              <p style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
                ⚠️ Le message original reste visible ici pour l'administration, mais sera masqué pour l'acheteur et le vendeur.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => { setModalSuppression(false); setMessageSelectionne(null); }} 
                style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button 
                onClick={() => supprimerMessage(messageSelectionne.id)} 
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: T.danger, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                🗑️ Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)', backgroundColor: T.bg, overflow: 'hidden' }}>

        {/* ── Sidebar gauche ── */}
        <div style={{ width: '320px', backgroundColor: 'white', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: `3px solid ${T.danger}`, backgroundColor: '#fff5f5' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: T.danger, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👁 Surveillance Messagerie
            </h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {nbLitiges > 0 && <span style={{ fontSize: '10px', color: T.danger, fontWeight: '700' }}>⚖️ {nbLitiges} litige{nbLitiges > 1 ? 's' : ''}</span>}
              {nbActifs  > 0 && <span style={{ fontSize: '10px', color: T.info,   fontWeight: '700' }}>💬 {nbActifs} actif{nbActifs > 1 ? 's' : ''}</span>}
              <span style={{ fontSize: '10px', color: T.textLight }}>{convs.length} total</span>
            </div>

            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="🔍 Vendeur, acheteur, commande..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '7px 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />

            {/* Filtres */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              {[
                { v: 'tous', l: 'Tous' },
                { v: 'litige', l: '⚖️' },
                { v: 'actif', l: '💬' },
                { v: 'resolu', l: '✅' },
                { v: 'archive', l: '📁' },
              ].map(f => (
                <button key={f.v} onClick={() => setFiltreStatut(f.v)}
                  style={{ flex: 1, padding: '5px 4px', borderRadius: '6px', border: 'none', backgroundColor: filtreStatut === f.v ? (f.v === 'litige' ? T.danger : T.info) : '#f0f0f0', color: filtreStatut === f.v ? 'white' : T.textLight, fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  {f.l}
                </button>
              ))}
            </div>

            <button onClick={() => setFiltreUrgent(p => !p)}
              style={{ width: '100%', padding: '5px', borderRadius: '6px', border: `1px solid ${filtreUrgent ? T.danger : T.border}`, backgroundColor: filtreUrgent ? '#fff1f2' : 'white', color: filtreUrgent ? T.danger : T.textLight, fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
              {filtreUrgent ? '🔴 Litiges seulement ✓' : '🔴 Filtrer litiges seulement'}
            </button>
          </div>

          {/* Liste conversations */}
          <div className="conv-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: T.textLight }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '3px solid #f0f0f0', borderTop: `3px solid ${T.danger}`, animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                Chargement...
              </div>
            ) : convs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>Aucune conversation</div>
            ) : convs.map(c => {
              const actif = convActive?.id === c.id;
              const cfg   = statutCfg[c.statut] || statutCfg.actif;
              return (
                <div key={c.id} className="conv-admin" onClick={() => ouvrirConv(c)}
                  style={{ padding: '11px 14px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', backgroundColor: actif ? '#fff5f5' : 'white', borderLeft: `3px solid ${actif ? T.danger : 'transparent'}`, transition: 'all 0.1s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: T.text, display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                      {c.est_litige && <span style={{ color: T.danger, flexShrink: 0 }}>🔴</span>}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: T.vendeur }}>🏪 {c.vendeur.boutique.split(' ').slice(0,2).join(' ')}</span>
                        <span style={{ color: '#aaa', margin: '0 4px' }}>↔</span>
                        <span style={{ color: T.acheteur }}>🛒 {c.acheteur.nom.split(' ')[0]}</span>
                      </span>
                    </div>
                    {c.dernier_message_date && <span style={{ fontSize: '9px', color: T.textLight, flexShrink: 0, marginLeft: '4px' }}>{fmtHeure(c.dernier_message_date)}</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: T.textLight, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.sujet}
                  </p>
                  {c.dernier_message && (
                    <p style={{ fontSize: '10px', color: '#bbb', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.dernier_message}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ ...cfg, padding: '1px 6px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>{cfg.label}</span>
                    {c.commande_id && <span style={{ backgroundColor: '#f0fdf4', color: T.success, padding: '1px 6px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>#{c.commande_id}</span>}
                    <span style={{ backgroundColor: '#f0f0f0', color: T.textLight, padding: '1px 6px', borderRadius: '20px', fontSize: '9px' }}>{c.nb_messages} msgs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zone principale ── */}
        {convActive ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, backgroundColor: 'white', flexShrink: 0 }}>
              {/* Ligne 1 — vendeur ↔ acheteur */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '800', color: T.text, margin: 0 }}>
                    <span style={{ color: T.vendeur }}>🏪 {convActive.vendeur.boutique}</span>
                    <span style={{ color: T.textLight, fontSize: '11px', fontWeight: '400' }}> ({convActive.vendeur.nom})</span>
                    <span style={{ margin: '0 8px', color: '#ccc' }}>↔</span>
                    <span style={{ color: T.acheteur }}>🛒 {convActive.acheteur.nom}</span>
                    <span style={{ color: T.textLight, fontSize: '11px', fontWeight: '400' }}> ({convActive.acheteur.email})</span>
                  </p>
                  <p style={{ fontSize: '11px', color: T.textLight, margin: '3px 0 0 0' }}>
                    {convActive.sujet}
                    {convActive.commande_id && <span style={{ marginLeft: '8px', backgroundColor: '#dcfce7', color: T.success, padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>Commande #{convActive.commande_id}</span>}
                    <span style={{ marginLeft: '8px', color: '#ccc', fontSize: '10px' }}>Ouvert le {fmtDate(convActive.cree_le)}</span>
                  </p>
                </div>

                {/* Boutons action */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ ...(statutCfg[convActive.statut] || statutCfg.actif), padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>
                    {(statutCfg[convActive.statut] || statutCfg.actif).label}
                  </span>
                  {!convActive.est_litige && (
                    <button onClick={() => changerStatut(convActive.statut, true)}
                      style={{ backgroundColor: '#fff1f2', color: T.danger, border: `1px solid ${T.danger}`, borderRadius: '7px', padding: '4px 9px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      ⚖️ Marquer litige
                    </button>
                  )}
                  {convActive.est_litige && (
                    <button onClick={() => changerStatut(convActive.statut, false)}
                      style={{ backgroundColor: '#f0fdf4', color: T.success, border: `1px solid ${T.success}`, borderRadius: '7px', padding: '4px 9px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      ✓ Retirer litige
                    </button>
                  )}
                  {convActive.statut !== 'resolu' && convActive.statut !== 'archive' && (
                    <button onClick={() => changerStatut('resolu')}
                      style={{ backgroundColor: '#dcfce7', color: T.success, border: `1px solid ${T.success}`, borderRadius: '7px', padding: '4px 9px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      ✅ Résoudre
                    </button>
                  )}
                  {convActive.statut !== 'archive' && (
                    <button onClick={() => setConfirmerArchive(true)}
                      style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '7px', padding: '4px 9px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      📁 Archiver
                    </button>
                  )}
                  {!modeIntervention && convActive.statut !== 'archive' && (
                    <button onClick={() => setModeIntervention(true)}
                      style={{ backgroundColor: T.danger, color: 'white', border: 'none', borderRadius: '7px', padding: '4px 12px', fontSize: '10px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 6px rgba(220,38,38,0.4)' }}>
                      ⚡ Intervenir
                    </button>
                  )}
                </div>
              </div>

              {/* Bandeau intervention */}
              {modeIntervention && (
                <div style={{ backgroundColor: '#fff5f5', border: `1px solid ${T.danger}`, borderRadius: '10px', padding: '10px 14px', marginTop: '8px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '800', color: T.danger, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚡ Mode intervention — message officiel admin visible par vendeur et acheteur
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <textarea value={texteAdmin} onChange={e => setTexteAdmin(e.target.value)}
                      placeholder="Votre message officiel d'administration..."
                      rows={2}
                      style={{ flex: 1, border: `1px solid ${T.danger}`, borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button onClick={intervenir} disabled={!texteAdmin.trim() || sending}
                        style={{ backgroundColor: texteAdmin.trim() ? T.danger : '#fca5a5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: texteAdmin.trim() ? 'pointer' : 'not-allowed' }}>
                        {sending ? '⏳' : '📢 Envoyer'}
                      </button>
                      <button onClick={() => { setModeIntervention(false); setTexteAdmin(''); }}
                        style={{ backgroundColor: 'white', color: T.textLight, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer' }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes admin */}
              <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: modifierNotes ? '6px' : '0' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>📝 Notes admin internes</span>
                  <button onClick={() => setModifierNotes(p => !p)}
                    style={{ background: 'none', border: 'none', color: '#92400e', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                    {modifierNotes ? 'Annuler' : '✏️ Modifier'}
                  </button>
                </div>
                {modifierNotes ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <textarea value={notesAdmin} onChange={e => setNotesAdmin(e.target.value)}
                      rows={2} placeholder="Notes internes visibles seulement par l'admin..."
                      style={{ flex: 1, border: '1px solid #fcd34d', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', outline: 'none', resize: 'none', fontFamily: 'inherit', backgroundColor: 'white' }} />
                    <button onClick={sauvegarderNotes}
                      style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                      💾 Sauver
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: '#78350f', margin: 0, fontStyle: notesAdmin ? 'normal' : 'italic' }}>
                    {notesAdmin || 'Aucune note — cliquez Modifier pour en ajouter.'}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesRef} className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fafc' }}>

              {/* Légende */}
              <div style={{ display: 'flex', gap: '16px', padding: '6px 12px', backgroundColor: 'white', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.vendeur }}>🏪 Bleu = Vendeur</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.acheteur }}>🛒 Violet = Acheteur</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.danger }}>⚡ Rouge = Intervention admin</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#999' }}>🗑️ Admin peut supprimer</span>
                <span style={{ fontSize: '10px', color: T.textLight, marginLeft: 'auto' }}>
                  🔒 Chiffrement AES-256 · {messages.length} messages déchiffrés
                </span>
              </div>

              {messages.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>Aucun message dans cette conversation.</div>
              ) : groupesMessages().map(groupe => (
                <React.Fragment key={groupe.date}>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 6px' }}>
                    <span style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 12px', borderRadius: '20px', fontSize: '10px', color: T.textLight, fontWeight: '600' }}>
                      {groupe.date}
                    </span>
                  </div>
                  {groupe.msgs.map(msg => {
                    if (msg.est_intervention || msg.expediteur_role === 'admin') {
                      const estSupprime = msg.supprime_par_admin || msg.contenu.includes('Message supprimé par l\'administration');
                      
                      return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0', animation: 'fadeIn 0.2s ease' }}>
                          <div style={{ backgroundColor: '#fff5f5', border: `2px solid ${T.danger}`, borderRadius: '12px', padding: '10px 16px', maxWidth: '70%', textAlign: 'center' }}>
                            <p style={{ fontSize: '10px', fontWeight: '700', color: T.danger, margin: '0 0 4px', textTransform: 'uppercase' }}>
                              ⚡ Administration e-Vend · {fmtHeure(msg.cree_le)}
                            </p>
                            <p style={{ fontSize: '13px', color: estSupprime ? '#999' : T.text, margin: 0, lineHeight: '1.5', fontStyle: estSupprime ? 'italic' : 'normal' }}>
                              {msg.contenu}
                            </p>
                          </div>
                          
                          {/* Bouton supprimer pour les messages admin */}
                          {!estSupprime && (
                            <div style={{ marginTop: '4px' }}>
                              <button
                                onClick={() => {
                                  setMessageSelectionne(msg);
                                  setModalSuppression(true);
                                }}
                                style={{
                                  background: T.danger,
                                  border: 'none',
                                  borderRadius: '20px',
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  padding: '4px 12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 4px rgba(220,38,38,0.3)',
                                }}
                                title="Supprimer votre propre message"
                              >
                                🗑️ Supprimer mon message
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const estVendeur = msg.expediteur_role === 'vendeur';
                    const couleur    = estVendeur ? T.vendeur : T.acheteur;
                    const estSupprime = msg.supprime_par_admin || msg.contenu.includes('Message supprimé par l\'administration');

                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: estVendeur ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: '8px', marginBottom: '8px', animation: 'fadeIn 0.2s ease' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                          {msg.expediteur_nom.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ maxWidth: '60%', position: 'relative' }}>
                          <p style={{ fontSize: '10px', color: couleur, margin: '0 0 3px', fontWeight: '700', textAlign: estVendeur ? 'left' : 'right' }}>
                            {estVendeur ? '🏪' : '🛒'} {msg.expediteur_nom} · {fmtHeure(msg.cree_le)}
                          </p>
                          <div style={{ 
                            backgroundColor: 'white', 
                            color: estSupprime ? '#999' : T.text, 
                            padding: '10px 14px', 
                            borderRadius: estVendeur ? '12px 12px 12px 4px' : '12px 12px 4px 12px', 
                            fontSize: estSupprime ? '11px' : '13px', 
                            lineHeight: '1.5', 
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)', 
                            border: `1px solid ${couleur}25`,
                            fontStyle: estSupprime ? 'italic' : 'normal'
                          }}>
                            {msg.contenu}
                            {msg.piece_jointe_url && !estSupprime && (
                              <div style={{ marginTop: '8px' }}>
                                {msg.piece_jointe_type?.startsWith('image/') ? (
                                  <img src={msg.piece_jointe_url} alt="" style={{ maxWidth: '180px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(msg.piece_jointe_url!, '_blank')} />
                                ) : (
                                  <a href={msg.piece_jointe_url} target="_blank" rel="noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: T.info, textDecoration: 'none' }}>
                                    📎 {msg.piece_jointe_nom}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Bouton supprimer pour les messages vendeur/acheteur */}
                          {!estSupprime && (
                            <div style={{ marginTop: '4px', display: 'flex', justifyContent: estVendeur ? 'flex-start' : 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setMessageSelectionne(msg);
                                  setModalSuppression(true);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#999',
                                  fontSize: '9px',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: '2px 6px',
                                }}
                                title="Supprimer ce message"
                              >
                                🗑️ Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

              {convActive.statut === 'archive' && (
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginTop: '8px' }}>
                  <p style={{ fontSize: '12px', color: T.textLight, margin: 0, fontWeight: '600' }}>📁 Conversation archivée — lecture seule</p>
                </div>
              )}
            </div>

            {/* Bas : info surveillance */}
            {!modeIntervention && convActive.statut !== 'archive' && (
              <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.border}`, backgroundColor: '#fafafa', flexShrink: 0 }}>
                <div style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '9px 14px' }}>
                  <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                    👁 <strong>Mode surveillance</strong> — Vous lisez la conversation déchiffrée entre{' '}
                    <span style={{ color: T.vendeur, fontWeight: '700' }}>{convActive.vendeur.boutique}</span> et{' '}
                    <span style={{ color: T.acheteur, fontWeight: '700' }}>{convActive.acheteur.nom}</span>.
                    Cliquez <strong style={{ color: T.danger }}>⚡ Intervenir</strong> pour envoyer un message officiel.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', flexDirection: 'column', gap: '12px', color: T.textLight }}>
            <span style={{ fontSize: '52px', opacity: 0.2 }}>⚖️</span>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>Sélectionnez un dossier à surveiller</p>
            {convs.length === 0 && !loading && (
              <p style={{ fontSize: '12px', color: '#ccc' }}>Aucune conversation dans la base de données.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
