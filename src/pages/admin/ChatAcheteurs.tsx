/**
 * ChatAcheteurs.tsx — src/pages/admin/ChatAcheteurs.tsx
 * Messagerie admin ↔ acheteurs avec pièces jointes S3, chiffrement, polling
 * Ajout : suppression de messages par admin, envoi de photos
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';

interface Conversation {
  id: number;
  acheteurId: number;
  acheteurNom: string;
  email: string;
  avatar: string;
  sujet: string;
  statut: 'ouvert' | 'resolu' | 'ferme';
  priorite: 'normale' | 'haute' | 'urgente';
  assigneA?: string;
  derniereActivite: string;
  nonLus: number;
  ordreRelated?: number;
  dernier_message: string | null;
  dernier_message_date: string | null;
}

interface Message {
  id: number;
  expediteur_id: number;
  expediteur_role: 'admin' | 'acheteur';
  expediteur_nom: string;
  contenu: string;
  contenu_original?: string;
  supprime_par_admin?: boolean;
  piece_jointe_url: string | null;
  piece_jointe_nom: string | null;
  piece_jointe_type: string | null;
  lu: boolean;
  cree_le: string;
}

interface UploadResult {
  url: string;
  nom: string;
  type: string;
}

const T = {
  accent: '#7c3aed', accentLight: '#f5f3ff',
  bg: '#f0f2f5', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  success: '#16a34a', warning: '#d97706', danger: '#dc2626',
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

const STATUT_CONFIG = {
  ouvert:  { bg: '#eff6ff', color: '#1d4ed8', label: '🟢 Ouvert'   },
  resolu:  { bg: '#f0fdf4', color: '#16a34a', label: '✅ Résolu'   },
  ferme:   { bg: '#f3f4f6', color: '#6b7280', label: '🔒 Fermé'    },
};

const PRIORITE_CONFIG = {
  normale: { color: T.textLight, label: '— Normale',  dot: '#9ca3af' },
  haute:   { color: T.warning,   label: '↑ Haute',    dot: T.warning },
  urgente: { color: T.danger,    label: '🔴 Urgente', dot: T.danger  },
};

function Toast({ msg, type }: { msg: string; type: 'success' | 'info' | 'danger' }) {
  const bg = { success: T.success, info: T.accent, danger: T.danger }[type];
  return (
    <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: bg, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: '420px' }}>
      {msg}
    </div>
  );
}

interface ChatAcheteursProps { naviguerVers: (p: string, d?: any) => void; }

export default function ChatAcheteurs({ naviguerVers }: ChatAcheteursProps) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'ouvert' | 'resolu' | 'ferme'>('tous');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  
  // États pour la suppression de messages
  const [messageSelectionne, setMessageSelectionne] = useState<Message | null>(null);
  const [modalSuppression, setModalSuppression] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const token = localStorage.getItem('token');

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Détection du scroll manuel
  const handleScroll = useCallback(() => {
    if (!messagesRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
    
    setUserHasScrolled(!isAtBottom);
  }, []);

  useEffect(() => {
    const currentRef = messagesRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      return () => currentRef.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // ✅ CHARGER LES CONVERSATIONS (admin ↔ acheteur)
  const chargerConvs = useCallback(async () => {
    try {
      // Route pour admin : /api/messagerie/admin/acheteur/conversations
      let url = `${API}/api/messagerie/admin/acheteur/conversations?limit=100`;
      if (filtreStatut !== 'tous') url += `&statut=${filtreStatut}`;
      if (recherche) url += `&search=${encodeURIComponent(recherche)}`;

      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      
      if (Array.isArray(data)) {
        setConvs(data);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
    setLoading(false);
  }, [token, filtreStatut, recherche]);

  // ✅ CHARGER LES MESSAGES (admin ↔ acheteur)
  const chargerMessages = useCallback(async (convId: number) => {
    try {
      // Route pour admin : /api/messagerie/admin/acheteur/conversations/${convId}/messages
      const r = await fetch(`${API}/api/messagerie/admin/acheteur/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      
      if (Array.isArray(data)) {
        const oldCount = messages.length;
        setMessages(data);
        
        // Auto-scroll intelligent
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
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  }, [token, messages.length, userHasScrolled]);

  // Polling 15 secondes
  useEffect(() => {
    chargerConvs();
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      chargerConvs();
      if (convActive) chargerMessages(convActive.id);
    }, 15000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convActive, chargerConvs, chargerMessages]);

  const ouvrirConv = (conv: Conversation) => {
    setConvActive(conv);
    setMessages([]);
    setUserHasScrolled(false);
    chargerMessages(conv.id);
    
    // Marquer comme lus (côté frontend seulement)
    setConvs(prev => prev.map(c => 
      c.id === conv.id ? { ...c, nonLus: 0 } : c
    ));
    setShowMenu(false);
  };

  // Upload de fichier vers S3
  const uploadFichier = async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          nom: file.name,
          type: file.type,
        };
      } else {
        throw new Error('Erreur upload');
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'upload', 'danger');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ✅ ENVOYER UN MESSAGE (admin → acheteur)
  const envoyerMessage = async () => {
    if ((!texte.trim() && !fileInputRef.current?.files?.length) || !convActive || convActive.statut === 'ferme' || sending) return;
    
    setSending(true);
    try {
      let pieceJointe: UploadResult | null = null;
      
      // Uploader le fichier si présent
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0];
        const uploadResult = await uploadFichier(file);
        if (uploadResult) {
          pieceJointe = uploadResult;
        }
        fileInputRef.current.value = '';
      }
      
      // Route pour admin : /api/messagerie/admin/acheteur/conversations/${convActive.id}/messages
      const response = await fetch(`${API}/api/messagerie/admin/acheteur/conversations/${convActive.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          contenu: texte.trim() || (pieceJointe ? '📎 Image partagée' : ''),
          piece_jointe_url: pieceJointe?.url || null,
          piece_jointe_nom: pieceJointe?.nom || null,
          piece_jointe_type: pieceJointe?.type || null,
        }),
      });
      
      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setTexte('');
        
        // Mettre à jour la dernière activité dans la liste
        setConvs(prev => prev.map(c => 
          c.id === convActive.id 
            ? { ...c, derniereActivite: 'À l\'instant', dernier_message: texte.trim() || '📎 Image' }
            : c
        ));
        
        // Auto-scroll
        setTimeout(() => { 
          if (messagesRef.current && !userHasScrolled) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'envoi', 'danger');
    } finally {
      setSending(false);
    }
  };

  // ✅ SUPPRIMER UN MESSAGE (admin)
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
                supprime_par_admin: true,
                piece_jointe_url: null,
                piece_jointe_nom: null,
                piece_jointe_type: null,
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

  const changerStatut = async (statut: 'ouvert' | 'resolu' | 'ferme') => {
    if (!convActive) return;
    try {
      // Route pour admin : /api/messagerie/admin/acheteur/conversations/${convActive.id}/statut
      await fetch(`${API}/api/messagerie/admin/acheteur/conversations/${convActive.id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statut }),
      });
      
      setConvActive(prev => prev ? { ...prev, statut } : prev);
      setConvs(prev => prev.map(c => c.id === convActive.id ? { ...c, statut } : c));
      setShowMenu(false);
      showToast(`📋 Conversation ${statut === 'ouvert' ? 'rouverte' : statut === 'resolu' ? 'résolue' : 'fermée'}`, 'info');
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const changerPriorite = async (priorite: 'normale' | 'haute' | 'urgente') => {
    if (!convActive) return;
    try {
      // Route pour admin : /api/messagerie/admin/acheteur/conversations/${convActive.id}/priorite
      await fetch(`${API}/api/messagerie/admin/acheteur/conversations/${convActive.id}/priorite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priorite }),
      });
      
      setConvActive(prev => prev ? { ...prev, priorite } : prev);
      setConvs(prev => prev.map(c => c.id === convActive.id ? { ...c, priorite } : c));
    } catch (error) {
      console.error('Erreur changement priorité:', error);
    }
  };

  const totalNonLus = convs.reduce((s, c) => s + c.nonLus, 0);

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

  // Fonction pour vérifier si une URL est une image
  const estUneImage = (url: string | null): boolean => {
    if (!url) return false;
    return url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) !== null;
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .conv-item:hover{background:#f8fafc!important}
        .msg-scroll::-webkit-scrollbar{width:5px}
        .msg-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
        .message-image {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid #ddd;
          transition: transform 0.2s;
        }
        .message-image:hover {
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal confirmation suppression */}
      {modalSuppression && messageSelectionne && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', width: '480px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: T.danger, margin: '0 0 10px 0' }}>
              {messageSelectionne.expediteur_role === 'admin' ? '🗑️ Supprimer votre message ?' : '🗑️ Supprimer ce message ?'}
            </h3>
            
            <p style={{ fontSize: '13px', color: T.textLight, margin: '0 0 12px 0' }}>
              {messageSelectionne.expediteur_role === 'admin' 
                ? 'Votre message sera remplacé par "Supprimé par l\'administration" :'
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
                ⚠️ Le message original reste visible ici pour l'administration, mais sera masqué pour l'acheteur.
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

        {/* ── Colonne gauche — liste conversations ── */}
        <div style={{ width: '320px', backgroundColor: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

          {/* Header liste */}
          <div style={{ padding: '16px', borderBottom: `2px solid ${T.accent}`, backgroundColor: '#faf5ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: T.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛒 Chat Acheteurs</h3>
                {totalNonLus > 0 && <span style={{ fontSize: '10px', color: T.danger, fontWeight: '700' }}>{totalNonLus} non lu{totalNonLus > 1 ? 's' : ''}</span>}
              </div>
            </div>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="🔍 Rechercher acheteur, email, sujet..."
              style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '7px 10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              {(['tous', 'ouvert', 'resolu', 'ferme'] as const).map(s => (
                <button key={s} onClick={() => setFiltreStatut(s)}
                  style={{ flex: 1, padding: '4px 6px', borderRadius: '6px', border: 'none', backgroundColor: filtreStatut === s ? T.accent : '#f0f0f0', color: filtreStatut === s ? 'white' : T.textLight, fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  {s === 'tous' ? 'Tous' : s === 'ouvert' ? 'Ouverts' : s === 'resolu' ? 'Résolus' : 'Fermés'}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: T.textLight }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '3px solid #f0f0f0', borderTop: `3px solid ${T.accent}`, animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                Chargement...
              </div>
            ) : convs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>Aucune conversation</div>
            ) : convs.map(c => (
              <div key={c.id} onClick={() => ouvrirConv(c)}
                style={{ padding: '12px 14px', borderBottom: `1px solid #f5f5f5`, cursor: 'pointer', backgroundColor: convActive?.id === c.id ? T.accentLight : 'white', borderLeft: convActive?.id === c.id ? `3px solid ${T.accent}` : '3px solid transparent', transition: 'all 0.12s' }}
                className="conv-item">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  {/* Avatar avec priorité */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white' }}>{c.avatar}</div>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', backgroundColor: PRIORITE_CONFIG[c.priorite].dot, border: '2px solid white' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.acheteurNom}</p>
                      <span style={{ fontSize: '10px', color: T.textLight, flexShrink: 0, marginLeft: '4px' }}>{c.derniereActivite}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: T.textLight, margin: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sujet}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ ...STATUT_CONFIG[c.statut], padding: '1px 6px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>{STATUT_CONFIG[c.statut].label}</span>
                      {c.ordreRelated && <span style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '1px 6px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>#{c.ordreRelated}</span>}
                      {c.nonLus > 0 && <span style={{ backgroundColor: T.danger, color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '10px' }}>{c.nonLus}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Zone chat principale ── */}
        {convActive ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header conversation */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.card, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: 'white', flexShrink: 0 }}>{convActive.avatar}</div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', backgroundColor: PRIORITE_CONFIG[convActive.priorite].dot, border: '2px solid white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '800', color: T.text, margin: 0 }}>{convActive.acheteurNom} <span style={{ fontSize: '12px', fontWeight: '400', color: T.textLight }}>· {convActive.email}</span></p>
                <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                  {convActive.sujet}
                  {convActive.ordreRelated && <span style={{ marginLeft: '8px', backgroundColor: '#dcfce7', color: T.success, padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700' }}>Commande #{convActive.ordreRelated}</span>}
                </p>
              </div>

              {/* Actions rapides */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Priorité */}
                <select value={convActive.priorite} onChange={e => changerPriorite(e.target.value as 'normale' | 'haute' | 'urgente')}
                  style={{ border: `1px solid ${T.border}`, borderRadius: '7px', padding: '5px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', outline: 'none', color: PRIORITE_CONFIG[convActive.priorite].color }}>
                  <option value="normale">— Normale</option>
                  <option value="haute">↑ Haute</option>
                  <option value="urgente">🔴 Urgente</option>
                </select>

                {/* Statut */}
                {convActive.statut !== 'ferme' && (
                  <>
                    <button onClick={() => changerStatut('resolu')}
                      style={{ backgroundColor: '#dcfce7', color: T.success, border: `1px solid ${T.success}`, borderRadius: '7px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                      ✅ Résoudre
                    </button>
                    <button onClick={() => changerStatut('ferme')}
                      style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '7px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                      🔒 Fermer
                    </button>
                  </>
                )}
                {convActive.statut === 'ferme' && (
                  <button onClick={() => changerStatut('ouvert')}
                    style={{ backgroundColor: T.accentLight, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: '7px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                    🔄 Rouvrir
                  </button>
                )}

                {/* Assigner */}
                <select defaultValue="" style={{ border: `1px solid ${T.border}`, borderRadius: '7px', padding: '5px 8px', fontSize: '11px', cursor: 'pointer', outline: 'none', color: T.textLight }}>
                  <option value="" disabled>👤 Assigner...</option>
                  <option>Admin LB</option>
                  <option>Service client</option>
                  <option>Remboursements</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesRef} className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fafc' }}>

              {/* Légende */}
              <div style={{ display: 'flex', gap: '16px', padding: '6px 12px', backgroundColor: 'white', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.accent }}>👤 Violet = Admin</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a' }}>🛒 Vert = Acheteur</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#999' }}>🗑️ Admin peut supprimer</span>
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
                    const estAdmin = msg.expediteur_role === 'admin';
                    const couleur = estAdmin ? T.accent : '#16a34a';
                    const estSupprime = msg.supprime_par_admin || msg.contenu.includes('Message supprimé par l\'administration');

                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: estAdmin ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', marginBottom: '8px', animation: 'fadeIn 0.2s ease' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: 'white', flexShrink: 0 }}>
                          {msg.expediteur_nom.charAt(0)}
                        </div>
                        <div style={{ maxWidth: '65%', position: 'relative' }}>
                          <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 3px 0', textAlign: estAdmin ? 'right' : 'left' }}>
                            {msg.expediteur_nom} · {fmtHeure(msg.cree_le)}
                          </p>
                          <div style={{ 
                            backgroundColor: couleur, 
                            color: estSupprime ? '#ccc' : 'white', 
                            padding: '10px 14px', 
                            borderRadius: estAdmin ? '12px 12px 4px 12px' : '12px 12px 12px 4px', 
                            fontSize: estSupprime ? '11px' : '13px', 
                            lineHeight: '1.5', 
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            fontStyle: estSupprime ? 'italic' : 'normal'
                          }}>
                            {msg.contenu}
                            
                            {/* Affichage des images */}
                            {msg.piece_jointe_url && !estSupprime && (
                              <div style={{ marginTop: '8px' }}>
                                {estUneImage(msg.piece_jointe_url) ? (
                                  <div>
                                    <img 
                                      src={msg.piece_jointe_url} 
                                      alt={msg.piece_jointe_nom || 'Image'} 
                                      className="message-image"
                                      onClick={() => window.open(msg.piece_jointe_url!, '_blank')}
                                      onError={(e) => {
                                        console.error('Erreur chargement image:', msg.piece_jointe_url);
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                          const errorMsg = document.createElement('p');
                                          errorMsg.style.color = '#dc2626';
                                          errorMsg.style.fontSize = '11px';
                                          errorMsg.style.margin = '4px 0 0';
                                          errorMsg.style.padding = '4px';
                                          errorMsg.style.backgroundColor = '#fee2e2';
                                          errorMsg.style.borderRadius = '4px';
                                          errorMsg.innerText = '❌ Image non disponible';
                                          parent.appendChild(errorMsg);
                                        }
                                      }}
                                    />
                                    <p style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                                      📷 {msg.piece_jointe_nom || 'Image'}
                                    </p>
                                  </div>
                                ) : (
                                  <a 
                                    href={msg.piece_jointe_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '6px', 
                                      fontSize: '11px', 
                                      color: 'white', 
                                      textDecoration: 'underline',
                                      padding: '4px 8px',
                                      backgroundColor: 'rgba(255,255,255,0.2)',
                                      borderRadius: '4px'
                                    }}>
                                    📎 {msg.piece_jointe_nom || 'Fichier joint'}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Bouton supprimer */}
                          {!estSupprime && (
                            <div style={{ marginTop: '4px', display: 'flex', justifyContent: estAdmin ? 'flex-end' : 'flex-start' }}>
                              <button
                                onClick={() => {
                                  setMessageSelectionne(msg);
                                  setModalSuppression(true);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: msg.expediteur_role === 'admin' ? T.danger : '#999',
                                  fontSize: '9px',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  opacity: 0.6,
                                  padding: '2px 6px',
                                }}
                                title={msg.expediteur_role === 'admin' ? "Supprimer votre message" : "Supprimer ce message"}
                              >
                                🗑️ Supprimer
                              </button>
                            </div>
                          )}
                          
                          {!msg.lu && !estAdmin && !estSupprime && (
                            <p style={{ fontSize: '9px', color: T.warning, margin: '2px 0 0 0', textAlign: 'right' }}>● Non lu</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

              {convActive.statut === 'ferme' && (
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', margin: '8px 0' }}>
                  <p style={{ fontSize: '12px', color: T.textLight, margin: 0, fontWeight: '600' }}>🔒 Cette conversation est fermée</p>
                </div>
              )}
            </div>

            {/* Zone saisie avec upload d'image */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, backgroundColor: T.card, flexShrink: 0 }}>
              {convActive.statut === 'ferme' ? (
                <p style={{ textAlign: 'center', color: T.textLight, fontSize: '12px', margin: 0, padding: '8px' }}>Conversation fermée — rouvrez-la pour envoyer un message.</p>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={() => {
                      if (fileInputRef.current?.files?.length) {
                        envoyerMessage();
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: 'none',
                      border: `1px solid ${T.border}`,
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: T.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '42px',
                      height: '42px',
                      flexShrink: 0,
                    }}
                    title="Ajouter une image"
                  >
                    {uploading ? '⏳' : '📷'}
                  </button>
                  <textarea
                    value={texte}
                    onChange={e => setTexte(e.target.value)}
                    onKeyDown={e => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        envoyerMessage(); 
                      } 
                    }}
                    placeholder="Écrire un message à l'acheteur... (Entrée pour envoyer)"
                    rows={2}
                    style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                  <button 
                    onClick={envoyerMessage} 
                    disabled={(!texte.trim() && !fileInputRef.current?.files?.length) || sending || uploading}
                    style={{ 
                      backgroundColor: (texte.trim() || fileInputRef.current?.files?.length) ? T.accent : '#c4b5fd', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '10px', 
                      padding: '12px 18px', 
                      fontSize: '18px', 
                      cursor: (texte.trim() || fileInputRef.current?.files?.length) ? 'pointer' : 'not-allowed', 
                      flexShrink: 0,
                      opacity: sending || uploading ? 0.7 : 1,
                    }}>
                    {sending || uploading ? '⏳' : '➤'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
            <div style={{ textAlign: 'center', color: T.textLight }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🛒</div>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
