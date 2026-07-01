/**
 * MessagerieAdministration.tsx — src/pages/vendeur/MessagerieAdministration.tsx
 * Messagerie vendeur ↔ administration avec persistance BD (API)
 * Version corrigée avec routes /vendeur/admin
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page } from '@shopify/polaris';

const API = 'https://evend-multivendeur-api.onrender.com';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Conversation {
  id: number;
  titre: string;
  statut: 'ouvert' | 'resolu' | 'ferme';
  priorite: 'normale' | 'haute' | 'urgente';
  derniereActivite: string;
  nonLusAdmin: number;
  dernier_message: string | null;
  dernier_message_date: string | null;
}

interface Message {
  id: number;
  expediteur_id: number;
  expediteur_role: 'admin' | 'vendeur';
  expediteur_nom: string;
  contenu: string;
  contenu_original?: string;
  supprime_par_admin?: boolean;
  piece_jointe_url?: string | null;
  piece_jointe_nom?: string | null;
  piece_jointe_type?: string | null;
  cree_le: string;
}

interface UploadResult {
  url: string;
  nom: string;
  type: string;
}

// ── Thème ─────────────────────────────────────────────────────────────────────
const T = {
  accent: '#2d6a9f', accentLight: '#e8f2fb',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#6b7280',
  danger: '#dc2626', warning: '#d97706', success: '#16a34a',
  vendeur: '#537373',
};

const STATUT_CONFIG = {
  ouvert:  { bg: '#eff6ff', color: '#1d4ed8', label: '🟢 Ouvert'  },
  resolu:  { bg: '#f0fdf4', color: '#16a34a', label: '✅ Résolu'  },
  ferme:   { bg: '#f3f4f6', color: '#6b7280', label: '🔒 Fermé'   },
};

const PRIORITE_CONFIG = {
  normale: { color: T.textLight, dot: '#9ca3af', label: 'Normale' },
  haute:   { color: T.warning,   dot: T.warning,  label: 'Haute'   },
  urgente: { color: T.danger,    dot: T.danger,   label: 'Urgente' },
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

function Toast({ msg, type }: { msg: string; type: 'success' | 'info' | 'danger' }) {
  const bg = { success: T.success, info: T.accent, danger: T.danger }[type];
  return (
    <div style={{ position: 'fixed', top: '80px', right: '24px', backgroundColor: bg, color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,0.25)', maxWidth: '420px' }}>
      {msg}
    </div>
  );
}

export default function MessagerieAdministration() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convActive, setConvActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' | 'danger' } | null>(null);
  const [modalNouv, setModalNouv] = useState(false);
  const [titrNouv, setTitrNouv] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getToken = () => localStorage.getItem('token');

  const showToast = (msg: string, type: 'success' | 'info' | 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
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

  // ── Charger les conversations depuis la BD (vendeur/admin) ─────────────────
  const chargerConvs = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/messagerie/vendeur/admin/conversations`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConvs(data);
      } else {
        console.error('Erreur chargement conversations:', response.status);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  }, []);

  // ── Charger les messages d'une conversation ────────────────────────────────
  const chargerMessages = useCallback(async (convId: number) => {
    try {
      const response = await fetch(`${API}/api/messagerie/vendeur/admin/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Erreur chargement messages:', response.status);
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  }, []);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    chargerConvs();
  }, [chargerConvs]);

  // Auto-scroll quand nouveaux messages
  useEffect(() => {
    if (messagesRef.current && !userHasScrolled) {
      setTimeout(() => {
        messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, userHasScrolled]);

  // ── Créer une nouvelle conversation avec admin ────────────────────────────
  const creerNouvConv = async () => {
    if (!titrNouv.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/messagerie/vendeur/admin/conversations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ 
          sujet: titrNouv.trim()
        }),
      });
      
      if (response.ok) {
        const newConv = await response.json();
        setConvs(prev => [newConv, ...prev]);
        setConvActive(newConv);
        setMessages([]);
        setTitrNouv('');
        setModalNouv(false);
        showToast('✉️ Nouvelle conversation créée', 'success');
      } else {
        const error = await response.json();
        showToast(`❌ Erreur: ${error.error || 'Création échouée'}`, 'danger');
      }
      
    } catch (error) {
      showToast('❌ Erreur lors de la création', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ── Envoyer un message ───────────────────────────────────────────────────
  const envoyerMessage = async () => {
    if (!texte.trim() || !convActive || sending) return;
    
    setSending(true);
    try {
      const response = await fetch(`${API}/api/messagerie/vendeur/admin/conversations/${convActive.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ 
          contenu: texte.trim() 
        }),
      });
      
      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        setTexte('');
        
        // Mettre à jour la dernière activité dans la liste
        setConvs(prev => prev.map(c => 
          c.id === convActive.id 
            ? { ...c, derniereActivite: "À l'instant" }
            : c
        ));
      } else {
        const error = await response.json();
        showToast(`❌ Erreur: ${error.error || 'Envoi échoué'}`, 'danger');
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'envoi', 'danger');
    } finally {
      setSending(false);
    }
  };

  // ── Upload de fichier vers S3 ─────────────────────────────────────────────
  const uploadFichier = async (file: File): Promise<UploadResult | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          url: data.url,
          nom: file.name,
          type: file.type,
        };
      }
      return null;
    } catch (error) {
      showToast('❌ Erreur upload', 'danger');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ── Envoyer une image ────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !convActive) return;
    
    const uploadResult = await uploadFichier(file);
    if (!uploadResult) return;
    
    try {
      const response = await fetch(`${API}/api/messagerie/vendeur/admin/conversations/${convActive.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ 
          contenu: `📷 ${file.name}`,
          piece_jointe_url: uploadResult.url,
          piece_jointe_nom: uploadResult.nom,
        }),
      });
      
      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      showToast('❌ Erreur lors de l\'envoi', 'danger');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Ouvrir une conversation ───────────────────────────────────────────────
  const ouvrirConversation = async (conv: Conversation) => {
    setConvActive(conv);
    await chargerMessages(conv.id);
    
    // Marquer comme lu
    try {
      await fetch(`${API}/api/messagerie/vendeur/admin/conversations/${conv.id}/lire`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
    
    setConvs(prev => prev.map(c => 
      c.id === conv.id ? { ...c, nonLusAdmin: 0 } : c
    ));
  };

  const totalNonLus = convs.reduce((s, c) => s + (c.nonLusAdmin || 0), 0);

  return (
    <Page title="">
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .conv-item:hover{background:#f8fafc!important}
        .msg-scroll::-webkit-scrollbar{width:5px}
        .msg-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Modal nouvelle conversation */}
      {modalNouv && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.25)', animation: 'slideUp 0.2s ease' }}>
            <div style={{ padding: '16px 20px', backgroundColor: T.accentLight, borderBottom: `2px solid ${T.accent}` }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: T.accent, margin: 0 }}>✉️ Contacter l'administration</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: T.textLight, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Sujet de votre message *</label>
              <input 
                type="text" 
                value={titrNouv} 
                onChange={e => setTitrNouv(e.target.value)}
                placeholder="Ex : Question sur mes commissions..."
                style={{ width: '100%', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }} 
                autoFocus
              />
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#1d4ed8', margin: 0 }}>ℹ️ L'administration vous répondra généralement dans les 24 heures ouvrables.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => { setModalNouv(false); setTitrNouv(''); }}
                  style={{ flex: 1, padding: '10px', border: `1px solid ${T.border}`, borderRadius: '8px', backgroundColor: 'white', color: T.text, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button 
                  onClick={creerNouvConv} 
                  disabled={!titrNouv.trim() || loading}
                  style={{ 
                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px', 
                    backgroundColor: titrNouv.trim() ? T.accent : '#93c5fd', 
                    color: 'white', fontSize: '13px', fontWeight: '700', 
                    cursor: titrNouv.trim() ? 'pointer' : 'not-allowed' 
                  }}>
                  {loading ? '⏳ Création...' : 'Créer la conversation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ margin: '-20px -20px 0', height: 'calc(100vh - 112px)', display: 'flex', overflow: 'hidden', backgroundColor: T.bg, borderRadius: '8px', border: `1px solid ${T.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* ── Colonne gauche ── */}
        <div style={{ width: '290px', backgroundColor: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: `2px solid ${T.accent}`, backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '800', color: T.accent, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛡️ Administration</h3>
                {totalNonLus > 0 && <p style={{ fontSize: '10px', color: T.danger, fontWeight: '700', margin: '2px 0 0 0' }}>{totalNonLus} réponse{totalNonLus > 1 ? 's' : ''} non lue{totalNonLus > 1 ? 's' : ''}</p>}
              </div>
              <button 
                onClick={() => setModalNouv(true)}
                style={{ backgroundColor: T.accent, color: 'white', border: 'none', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                + Nouveau
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {convs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: T.textLight, fontSize: '12px' }}>
                <p>Aucune conversation</p>
                <p style={{ fontSize: '11px', marginTop: '8px' }}>Cliquez sur "Nouveau" pour contacter l'administration</p>
              </div>
            ) : convs.map(c => {
              const estActif = convActive?.id === c.id;
              const statutConfig = STATUT_CONFIG[c.statut] || STATUT_CONFIG.ouvert;
              
              return (
                <div key={c.id} onClick={() => ouvrirConversation(c)}
                  style={{ padding: '12px 14px', borderBottom: `1px solid #f5f5f5`, cursor: 'pointer', backgroundColor: estActif ? T.accentLight : 'white', borderLeft: estActif ? `3px solid ${T.accent}` : '3px solid transparent', transition: 'all 0.12s' }}
                  className="conv-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '8px' }}>{c.titre}</p>
                    {c.nonLusAdmin > 0 && <span style={{ backgroundColor: T.danger, color: 'white', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '10px', flexShrink: 0 }}>{c.nonLusAdmin}</span>}
                  </div>
                  <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 4px 0' }}>{c.derniereActivite}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ ...statutConfig, padding: '1px 6px', borderRadius: '20px', fontSize: '9px', fontWeight: '700' }}>{statutConfig.label}</span>
                    {c.priorite !== 'normale' && (
                      <span style={{ 
                        backgroundColor: c.priorite === 'urgente' ? '#fee2e2' : '#fef9c3', 
                        color: PRIORITE_CONFIG[c.priorite]?.color || T.warning, 
                        padding: '1px 6px', 
                        borderRadius: '20px', 
                        fontSize: '9px', 
                        fontWeight: '700' 
                      }}>
                        {c.priorite === 'urgente' ? '🔴 Urgent' : '↑ Haute'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Zone chat ── */}
        {convActive ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.card, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🛡️</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '800', color: T.text, margin: 0 }}>{convActive.titre}</p>
                <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                  Administration e-Vend · {messages.length} message{messages.length > 1 ? 's' : ''}
                </p>
              </div>
              <span style={{ 
                ...(STATUT_CONFIG[convActive.statut] || STATUT_CONFIG.ouvert), 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: '700' 
              }}>
                {(STATUT_CONFIG[convActive.statut] || STATUT_CONFIG.ouvert).label}
              </span>
            </div>

            {/* Messages */}
            <div ref={messagesRef} className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#f8fafc' }}>

              {/* Légende */}
              <div style={{ display: 'flex', gap: '16px', padding: '6px 12px', backgroundColor: 'white', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.vendeur }}>🏪 Vert = Vous (vendeur)</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: T.accent }}>🛡️ Bleu = Administration</span>
              </div>

              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: T.textLight }}>
                  <p style={{ fontSize: '13px' }}>✉️ Commencez la conversation en envoyant votre message.</p>
                  <p style={{ fontSize: '12px' }}>L'administration vous répondra sous 24h ouvrables.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const estVendeur = msg.expediteur_role === 'vendeur';
                  const couleur = estVendeur ? T.vendeur : T.accent;
                  const estSupprime = msg.supprime_par_admin || msg.contenu.includes('Message supprimé par l\'administration');

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: estVendeur ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px', marginBottom: '8px', animation: 'fadeIn 0.2s ease' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>
                        {estVendeur ? '🏪' : '🛡️'}
                      </div>
                      <div style={{ maxWidth: '65%' }}>
                        <p style={{ fontSize: '10px', color: T.textLight, margin: '0 0 3px 0', textAlign: estVendeur ? 'right' : 'left' }}>
                          {estVendeur ? 'Vous' : msg.expediteur_nom} · {fmtHeure(msg.cree_le)}
                        </p>
                        <div style={{ 
                          backgroundColor: couleur, 
                          color: estSupprime ? '#ccc' : 'white', 
                          padding: '10px 14px', 
                          borderRadius: estVendeur ? '12px 12px 4px 12px' : '12px 12px 12px 4px', 
                          fontSize: estSupprime ? '11px' : '13px', 
                          lineHeight: '1.5', 
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          fontStyle: estSupprime ? 'italic' : 'normal',
                          opacity: estSupprime ? 0.7 : 1,
                        }}>
                          {msg.contenu}
                          {msg.piece_jointe_url && !estSupprime && (
                            <div style={{ marginTop: '8px' }}>
                              <img src={msg.piece_jointe_url} alt="" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(msg.piece_jointe_url!, '_blank')} />
                            </div>
                          )}
                        </div>
                        {msg.supprime_par_admin && (
                          <p style={{ fontSize: '8px', color: '#999', margin: '2px 0 0 0', textAlign: 'right' }}>🗑️ Supprimé par l'administration</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {convActive.statut === 'ferme' && (
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: T.textLight, margin: 0, fontWeight: '600' }}>🔒 Cette conversation a été fermée par l'administration</p>
                </div>
              )}
            </div>

            {/* Zone saisie */}
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, backgroundColor: T.card, flexShrink: 0 }}>
              {convActive.statut === 'ferme' ? (
                <p style={{ textAlign: 'center', color: T.textLight, fontSize: '12px', margin: 0 }}>Conversation fermée par l'administration.</p>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
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
                    placeholder="Écrire à l'administration... (Entrée pour envoyer)"
                    rows={2}
                    style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                  <button 
                    onClick={envoyerMessage} 
                    disabled={!texte.trim() || sending}
                    style={{ 
                      backgroundColor: texte.trim() ? T.accent : '#93c5fd', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '10px', 
                      padding: '12px 18px', 
                      fontSize: '18px', 
                      cursor: texte.trim() ? 'pointer' : 'not-allowed', 
                      flexShrink: 0,
                    }}>
                    {sending ? '⏳' : '➤'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: T.textLight }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>🛡️</div>
              <p style={{ fontSize: '14px', fontWeight: '600' }}>Sélectionnez une conversation</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>ou cliquez sur "Nouveau" pour contacter l'administration</p>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}