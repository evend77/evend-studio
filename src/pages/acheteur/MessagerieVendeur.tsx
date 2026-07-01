/**
 * MessagerieVendeur.tsx — src/pages/acheteur/MessagerieVendeur.tsx
 * Chat acheteur ↔ vendeurs — polling 5s — connecté BD via API
 *
 * CORRECTIONS vs version précédente :
 *  1. Dropdown <select> remplacé par un sélecteur custom (fond sombre, texte blanc lisible)
 *  2. Barre de recherche pour filtrer les vendeurs
 *  3. ouvrirModalNouvelle gère nom_boutique / boutique / nom
 *  4. creerConversation : gestion d'erreur + toast
 *  5. Toutes les couleurs du modal forcées fond #1e293b / texte #fff
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = 'https://evend-multivendeur-api.onrender.com';
const C = {
  blue: '#3b82f6', blueDark: '#1e40af', purple: '#8b5cf6',
  green: '#10b981', red: '#ef4444', amber: '#f59e0b',
  bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)',
  text: '#fff', textLight: 'rgba(255,255,255,0.5)',
  modalBg: '#0f172a', inputBg: '#1e293b',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  id: number; sujet: string; statut: string; est_litige: boolean;
  commande_id: string | null; cree_le: string; mis_a_jour_le: string;
  vendeur: { id: number; nom: string; boutique: string };
  dernier_message: string | null; dernier_message_date: string | null;
  non_lus: number;
}
interface Message {
  id: number; expediteur_id: number; expediteur_role: string;
  expediteur_nom: string; contenu: string;
  piece_jointe_url: string | null; piece_jointe_nom: string | null;
  piece_jointe_type: string | null; est_intervention: boolean; cree_le: string;
}
interface Vendeur { id: number; nom: string; boutique: string; }
interface NouvelleConvForm { vendeur_id: string; sujet: string; commande_id: string; message: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtHeure = (d: string) => {
  try {
    const dt = new Date(d), now = new Date(), diff = now.getTime() - dt.getTime();
    if (diff < 86400000 && dt.getDate() === now.getDate())
      return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000)
      return dt.toLocaleDateString('fr-CA', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
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

const statutCfg: Record<string, { bg: string; color: string; label: string }> = {
  actif:   { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: '⚡ Actif'     },
  resolu:  { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', label: '✓ Résolu'    },
  litige:  { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', label: '⚖️ Litige'    },
  ferme:   { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', label: '🔒 Fermé'   },
  archive: { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', label: '📁 Archivé' },
};

// ── Style réutilisable pour les champs du modal (fond sombre, texte blanc) ───
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: C.inputBg, color: '#fff',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
};

// ============================================================================
export default function MessagerieVendeur({ naviguer }: { naviguer?: (p: string, props?: any) => void }) {

  const [convs,        setConvs]        = useState<Conversation[]>([]);
  const [convActive,   setConvActive]   = useState<Conversation | null>(null);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [texte,        setTexte]        = useState('');
  const [recherche,    setRecherche]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [pieceJointe,  setPieceJointe]  = useState<File | null>(null);
  const [lastMsgDate,  setLastMsgDate]  = useState<string | null>(null);
  const lastMsgDateRef = useRef<string | null>(null); // ref pour éviter race condition polling

  // ── Modal nouvelle conv ──────────────────────────────────────────────────
  const [modalNouvelle,    setModalNouvelle]    = useState(false);
  const [vendeurs,         setVendeurs]         = useState<Vendeur[]>([]);
  const [loadingVendeurs,  setLoadingVendeurs]  = useState(false);
  const [searchVendeur,    setSearchVendeur]    = useState('');
  const [vendeurChoisi,    setVendeurChoisi]    = useState<Vendeur | null>(null);
  const [dropdownOuvert,   setDropdownOuvert]   = useState(false);
  const [formNouvelle,     setFormNouvelle]     = useState<NouvelleConvForm>({ vendeur_id: '', sujet: '', commande_id: '', message: '' });
  const [creatingConv,     setCreatingConv]     = useState(false);
  const [erreurModal,      setErreurModal]      = useState('');
  const [toast,            setToast]            = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const pollingRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropdownRef    = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOuvert(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const afficherToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Chargement conversations ─────────────────────────────────────────────
  const chargerConvs = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/messagerie/acheteur/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) setConvs(data);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  // ── Chargement messages ──────────────────────────────────────────────────
  const chargerMessages = useCallback(async (convId: number, since?: string | null) => {
    try {
      const url = since
        ? `${API}/api/messagerie/acheteur/conversations/${convId}/messages?since=${encodeURIComponent(since)}`
        : `${API}/api/messagerie/acheteur/conversations/${convId}/messages`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return;
      const data = await r.json();
      if (!Array.isArray(data)) return;
      if (since) {
        if (data.length > 0) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            return [...prev, ...data.filter((m: Message) => !ids.has(m.id))];
          });
          setLastMsgDate(data[data.length - 1].cree_le);
          setConvs(prev => prev.map(c => c.id === convId ? { ...c, non_lus: 0 } : c));
        }
      } else {
        setMessages(data);
        if (data.length > 0) setLastMsgDate(data[data.length - 1].cree_le);
        setConvs(prev => prev.map(c => c.id === convId ? { ...c, non_lus: 0 } : c));
      }
    } catch {}
  }, [token]);

  // Sync ref avec state pour le polling (évite stale closure)
  useEffect(() => { lastMsgDateRef.current = lastMsgDate; }, [lastMsgDate]);

  useEffect(() => { chargerConvs(); }, [chargerConvs]);

  // Polling 5 s
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      chargerConvs();
      if (convActive) chargerMessages(convActive.id, lastMsgDateRef.current);
    }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [convActive, chargerConvs, chargerMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const ouvrirConv = async (conv: Conversation) => {
    setConvActive(conv); setMessages([]); setLastMsgDate(null);
    await chargerMessages(conv.id);
  };

  // ── Envoyer message ──────────────────────────────────────────────────────
  const envoyer = async () => {
    if ((!texte.trim() && !pieceJointe) || !convActive || sending) return;
    setSending(true);
    try {
      let pjUrl: string | null = null, pjNom: string | null = null, pjType: string | null = null;
      if (pieceJointe) {
        const fd = new FormData(); fd.append('file', pieceJointe);
        const ur = await fetch(`${API}/api/upload`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (ur.ok) { const ud = await ur.json(); pjUrl = ud.url; pjNom = pieceJointe.name; pjType = pieceJointe.type; }
        setPieceJointe(null);
      }
      const r = await fetch(`${API}/api/messagerie/acheteur/conversations/${convActive.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: texte.trim(), piece_jointe_url: pjUrl, piece_jointe_nom: pjNom, piece_jointe_type: pjType }),
      });
      if (r.ok) { setTexte(''); setLastMsgDate(null); await chargerMessages(convActive.id); await chargerConvs(); }
    } catch {}
    setSending(false);
  };

  // ── Ouvrir modal + charger vendeurs depuis BD ────────────────────────────
  const ouvrirModalNouvelle = async () => {
    setModalNouvelle(true);
    setSearchVendeur('');
    setVendeurChoisi(null);
    setDropdownOuvert(false);
    setErreurModal('');
    setFormNouvelle({ vendeur_id: '', sujet: '', commande_id: '', message: '' });

    if (vendeurs.length === 0) {
      setLoadingVendeurs(true);
      try {
        const r = await fetch(`${API}/api/vendeurs`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data)) {
            // Normaliser les noms de colonnes — la BD peut avoir boutique ou nom_boutique
            const liste: Vendeur[] = data
              .filter((v: any) => v.statut === 'actif' || !v.statut)
              .map((v: any) => ({
                id: v.id,
                boutique: (v.nom_boutique || v.boutique || v.nom || 'Boutique').trim(),
                nom: [v.prenom, v.nom].filter(Boolean).join(' ').trim() || v.email || '',
              }))
              .filter((v: Vendeur) => v.boutique !== 'Boutique' || v.nom); // éliminer entrées vides
            setVendeurs(liste);
          }
        }
      } catch {}
      setLoadingVendeurs(false);
    }
  };

  // ── Créer conversation → POST /api/messagerie/acheteur/conversations ─────
  const creerConversation = async () => {
    setErreurModal('');
    if (!vendeurChoisi)             { setErreurModal('Veuillez sélectionner un vendeur.'); return; }
    if (!formNouvelle.sujet.trim()) { setErreurModal('Le sujet est requis.');              return; }
    if (!formNouvelle.message.trim()){ setErreurModal('Le message est requis.');            return; }

    setCreatingConv(true);
    try {
      const r = await fetch(`${API}/api/messagerie/acheteur/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          vendeur_id:  vendeurChoisi.id,
          sujet:       formNouvelle.sujet.trim(),
          commande_id: formNouvelle.commande_id.trim() || null,
          message:     formNouvelle.message.trim(),
        }),
      });
      const data = await r.json();
      if (!r.ok) { setErreurModal(data.message || 'Erreur lors de la création.'); setCreatingConv(false); return; }

      setModalNouvelle(false);
      setFormNouvelle({ vendeur_id: '', sujet: '', commande_id: '', message: '' });
      setVendeurChoisi(null);
      afficherToast('✅ Conversation créée avec succès !');

      // Recharger convs puis ouvrir la nouvelle
      await chargerConvs();
      setTimeout(async () => {
        if (data.conversation_id) {
          const r2 = await fetch(`${API}/api/messagerie/acheteur/conversations`, { headers: { Authorization: `Bearer ${token}` } });
          if (r2.ok) {
            const liste = await r2.json();
            if (Array.isArray(liste)) {
              setConvs(liste);
              const newConv = liste.find((c: Conversation) => c.id === data.conversation_id);
              if (newConv) ouvrirConv(newConv);
            }
          }
        }
      }, 400);
    } catch {
      setErreurModal('Erreur réseau. Veuillez réessayer.');
    }
    setCreatingConv(false);
  };

  // ── Filtres ──────────────────────────────────────────────────────────────
  const convsFiltrees = convs.filter(c => {
    const s = recherche.toLowerCase();
    return !s || c.vendeur.nom.toLowerCase().includes(s) || c.vendeur.boutique.toLowerCase().includes(s) || c.sujet.toLowerCase().includes(s);
  });
  const vendeursFiltres = vendeurs.filter(v => {
    const s = searchVendeur.toLowerCase();
    return !s || v.boutique.toLowerCase().includes(s) || v.nom.toLowerCase().includes(s);
  });
  const totalNonLus  = convs.reduce((s, c) => s + c.non_lus, 0);
  const totalActives = convs.filter(c => c.statut === 'actif').length;

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

  const renderPJ = (msg: Message, estMoi: boolean) => {
    if (!msg.piece_jointe_url) return null;
    const isImg = msg.piece_jointe_type?.startsWith('image/');
    return (
      <div style={{ marginTop: '8px' }}>
        {isImg ? (
          <img src={msg.piece_jointe_url} alt={msg.piece_jointe_nom || ''}
            style={{ maxWidth: '200px', borderRadius: '10px', cursor: 'pointer', display: 'block' }}
            onClick={() => window.open(msg.piece_jointe_url!, '_blank')} />
        ) : (
          <a href={msg.piece_jointe_url} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: estMoi ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '8px', textDecoration: 'none', color: C.text }}>
            <span>📎</span><span style={{ fontSize: '12px' }}>{msg.piece_jointe_nom}</span>
          </a>
        )}
      </div>
    );
  };

  // ============================================================================
  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        .conv-hover:hover  { background:rgba(255,255,255,0.06)!important }
        .msg-area::-webkit-scrollbar  { width:4px }
        .msg-area::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15);border-radius:4px }
        .conv-scroll::-webkit-scrollbar { width:4px }
        .conv-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1);border-radius:4px }
        .vrow:hover        { background:rgba(59,130,246,0.2)!important }
        .vrow.sel          { background:rgba(59,130,246,0.25)!important; border-left:3px solid #3b82f6!important }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:9999, background:'#10b981', color:'#fff', padding:'12px 20px', borderRadius:'12px', fontWeight:700, fontSize:'13px', boxShadow:'0 4px 20px rgba(0,0,0,0.4)', animation:'fadeIn 0.3s ease' }}>
          {toast}
        </div>
      )}

      {/* ── Bannière stats ──────────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg, ${C.blue} 0%, ${C.purple} 100%)`, borderRadius:'20px', padding:'28px 32px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
        <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
              <span style={{ fontSize:'32px' }}>💬</span>
              <h1 style={{ margin:0, fontSize:'24px', fontWeight:'800', color:'#fff' }}>Messagerie vendeurs</h1>
            </div>
            <p style={{ margin:'0 0 16px', fontSize:'13px', color:'rgba(255,255,255,0.75)' }}>
              Discutez directement avec les vendeurs pour vos commandes.
            </p>
            <div style={{ display:'flex', gap:'28px' }}>
              {[{ v: convs.length, l:'Conversations' }, { v: totalNonLus, l:'Non lus' }, { v: totalActives, l:'Actives' }].map(s => (
                <div key={s.l}>
                  <div style={{ fontSize:'26px', fontWeight:'800', color:'#fff' }}>{s.v}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.65)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={ouvrirModalNouvelle}
            style={{ backgroundColor:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', color:'white', borderRadius:'12px', padding:'12px 22px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
            ✉️ Nouveau message
          </button>
        </div>
      </div>

      {/* ── Zone principale ─────────────────────────────────────────────── */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.02)', borderRadius:'20px', border:`1px solid ${C.border}`, height:'calc(100vh - 320px)', minHeight:'500px', overflow:'hidden' }}>

        {/* Sidebar */}
        <div style={{ width:'320px', borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <h3 style={{ margin:0, fontSize:'14px', fontWeight:'700', color:C.text }}>Messages</h3>
              {totalNonLus > 0 && <span style={{ backgroundColor:C.red, color:'#fff', fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'12px' }}>{totalNonLus}</span>}
            </div>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="🔍 Rechercher..."
              style={{ width:'100%', padding:'9px 14px', borderRadius:'30px', border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.05)', color:C.text, fontSize:'12px', outline:'none', boxSizing:'border-box' }} />
          </div>

          <div className="conv-scroll" style={{ flex:1, overflowY:'auto', padding:'10px' }}>
            {loading ? (
              <div style={{ padding:'40px', textAlign:'center', color:C.textLight }}>
                <div style={{ width:'24px', height:'24px', borderRadius:'50%', border:`3px solid rgba(255,255,255,0.1)`, borderTop:`3px solid ${C.blue}`, animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
                Chargement...
              </div>
            ) : convsFiltrees.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', color:C.textLight }}>
                <div style={{ fontSize:'36px', marginBottom:'8px', opacity:0.3 }}>💬</div>
                <p style={{ fontSize:'12px' }}>Aucune conversation</p>
                <button onClick={ouvrirModalNouvelle}
                  style={{ marginTop:'10px', backgroundColor:`${C.blue}30`, border:`1px solid ${C.blue}50`, color:C.blue, borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
                  + Démarrer une conversation
                </button>
              </div>
            ) : convsFiltrees.map(c => {
              const actif = convActive?.id === c.id;
              const cfg   = statutCfg[c.statut] || statutCfg.actif;
              return (
                <div key={c.id} className={actif ? '' : 'conv-hover'} onClick={() => ouvrirConv(c)}
                  style={{ padding:'14px 12px', marginBottom:'6px', borderRadius:'14px', background: actif ? `linear-gradient(135deg, ${C.blue}20, ${C.purple}10)` : 'transparent', border:`1px solid ${actif ? C.blue+'40' : 'transparent'}`, cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ display:'flex', gap:'12px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:`linear-gradient(135deg, ${C.blue}40, ${C.purple}40)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>🏪</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px' }}>
                        <p style={{ fontSize:'13px', fontWeight: c.non_lus > 0 ? '800' : '700', color:C.text, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {c.vendeur.boutique}
                        </p>
                        <div style={{ display:'flex', gap:'5px', alignItems:'center', flexShrink:0 }}>
                          {c.non_lus > 0 && <span style={{ background:C.blue, color:'#fff', fontSize:'9px', fontWeight:'700', padding:'1px 6px', borderRadius:'10px' }}>{c.non_lus}</span>}
                          {c.dernier_message_date && <span style={{ fontSize:'10px', color:C.textLight }}>{fmtHeure(c.dernier_message_date)}</span>}
                        </div>
                      </div>
                      <p style={{ fontSize:'11px', color:`${C.text}80`, margin:'0 0 4px', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.sujet}</p>
                      {c.dernier_message && <p style={{ fontSize:'11px', color:C.textLight, margin:'0 0 5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.dernier_message}</p>}
                      <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                        <span style={{ ...cfg, padding:'1px 8px', borderRadius:'20px', fontSize:'9px', fontWeight:'700' }}>{cfg.label}</span>
                        {c.commande_id && <span style={{ backgroundColor:`${C.green}20`, color:C.green, padding:'1px 8px', borderRadius:'20px', fontSize:'9px', fontWeight:'700' }}>#{c.commande_id}</span>}
                        {c.est_litige && <span style={{ backgroundColor:`${C.red}20`, color:C.red, padding:'1px 8px', borderRadius:'20px', fontSize:'9px', fontWeight:'700' }}>⚖️ Litige</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone chat */}
        {convActive ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'16px 22px', borderBottom:`1px solid ${C.border}`, background:'rgba(255,255,255,0.02)', display:'flex', alignItems:'center', gap:'14px', flexShrink:0 }}>
              <div style={{ width:'46px', height:'46px', borderRadius:'14px', background:`linear-gradient(135deg, ${C.blue}40, ${C.purple}40)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>🏪</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'2px' }}>
                  <h3 style={{ margin:0, fontSize:'15px', fontWeight:'800', color:C.text }}>{convActive.vendeur.boutique}</h3>
                  <span style={{ ...(statutCfg[convActive.statut] || statutCfg.actif), padding:'2px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:'700' }}>
                    {(statutCfg[convActive.statut] || statutCfg.actif).label}
                  </span>
                </div>
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <span style={{ fontSize:'11px', color:C.textLight }}>{convActive.sujet}</span>
                  {convActive.commande_id && <span style={{ fontSize:'11px', color:C.blue }}>#{convActive.commande_id}</span>}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="msg-area" style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:'4px' }}>
              {messages.length === 0 ? (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.textLight, flexDirection:'column', gap:'8px' }}>
                  <span style={{ fontSize:'40px', opacity:0.2 }}>💬</span>
                  <p style={{ fontSize:'12px' }}>Aucun message — commencez la conversation !</p>
                </div>
              ) : groupesMessages().map(groupe => (
                <React.Fragment key={groupe.date}>
                  <div style={{ display:'flex', justifyContent:'center', margin:'12px 0 8px' }}>
                    <span style={{ background:'rgba(255,255,255,0.06)', padding:'3px 14px', borderRadius:'20px', fontSize:'10px', color:C.textLight, fontWeight:'600' }}>{groupe.date}</span>
                  </div>
                  {groupe.msgs.map((msg, i) => {
                    if (msg.est_intervention) return (
                      <div key={msg.id} style={{ display:'flex', justifyContent:'center', margin:'8px 0' }}>
                        <div style={{ backgroundColor:'rgba(239,68,68,0.1)', border:'1.5px solid rgba(239,68,68,0.4)', borderRadius:'12px', padding:'10px 16px', maxWidth:'68%', textAlign:'center' }}>
                          <p style={{ fontSize:'10px', fontWeight:'700', color:'#ef4444', margin:'0 0 4px', textTransform:'uppercase' }}>⚡ Admin e-Vend · {fmtHeure(msg.cree_le)}</p>
                          <p style={{ fontSize:'13px', color:C.text, margin:0, lineHeight:'1.5' }}>{msg.contenu}</p>
                        </div>
                      </div>
                    );
                    const estMoi = msg.expediteur_role === 'acheteur';
                    const showAvatar = i === groupe.msgs.length - 1 || groupe.msgs[i+1]?.expediteur_role !== msg.expediteur_role;
                    return (
                      <div key={msg.id} style={{ display:'flex', justifyContent: estMoi ? 'flex-end' : 'flex-start', gap:'8px', marginBottom:'6px' }}>
                        {!estMoi && (
                          <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.blue}40, ${C.purple}40)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0, opacity: showAvatar ? 1 : 0 }}>🏪</div>
                        )}
                        <div style={{ maxWidth:'68%' }}>
                          {!estMoi && showAvatar && <p style={{ fontSize:'10px', color:C.blue, margin:'0 0 3px', fontWeight:'700' }}>{msg.expediteur_nom}</p>}
                          <div style={{ background: estMoi ? `linear-gradient(135deg, ${C.blue}, ${C.blueDark})` : 'rgba(255,255,255,0.07)', padding:'11px 15px', borderRadius: estMoi ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize:'13px', color:C.text, lineHeight:'1.6', border:`1px solid ${estMoi ? 'transparent' : C.border}`, boxShadow: estMoi ? `0 2px 10px ${C.blue}30` : 'none' }}>
                            {msg.contenu}{renderPJ(msg, estMoi)}
                          </div>
                          <div style={{ display:'flex', justifyContent: estMoi ? 'flex-end' : 'flex-start', marginTop:'3px', padding:'0 4px' }}>
                            <span style={{ fontSize:'10px', color:C.textLight }}>{fmtHeure(msg.cree_le)}{estMoi && <span style={{ marginLeft:'5px' }}>✓✓</span>}</span>
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
            <div style={{ padding:'16px 22px', borderTop:`1px solid ${C.border}`, background:'rgba(255,255,255,0.02)', flexShrink:0 }}>
              {convActive.statut === 'ferme' ? (
                <p style={{ textAlign:'center', color:C.textLight, fontSize:'12px', margin:0 }}>🔒 Conversation fermée.</p>
              ) : (
                <>
                  {pieceJointe && (
                    <div style={{ marginBottom:'10px', padding:'8px 12px', background:'rgba(255,255,255,0.06)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'space-between', border:`1px solid ${C.border}` }}>
                      <span style={{ fontSize:'12px', color:C.textLight }}>📎 {pieceJointe.name}</span>
                      <button onClick={() => setPieceJointe(null)} style={{ background:'none', border:'none', color:C.textLight, cursor:'pointer' }}>✕</button>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display:'none' }}
                      onChange={e => { if (e.target.files?.[0]) setPieceJointe(e.target.files[0]); e.target.value = ''; }} />
                    <button onClick={() => fileInputRef.current?.click()}
                      style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border}`, borderRadius:'12px', padding:'12px', cursor:'pointer', fontSize:'16px', color:C.textLight, flexShrink:0 }}>📎</button>
                    <input type="text" value={texte} onChange={e => setTexte(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); envoyer(); } }}
                      placeholder="Écrire un message... (Entrée pour envoyer)"
                      style={{ flex:1, padding:'13px 18px', borderRadius:'30px', border:`1px solid ${C.border}`, background:'rgba(255,255,255,0.06)', color:C.text, fontSize:'13px', outline:'none' }} />
                    <button onClick={envoyer} disabled={(!texte.trim() && !pieceJointe) || sending}
                      style={{ padding:'13px 22px', background:(texte.trim() || pieceJointe) ? `linear-gradient(135deg, ${C.blue}, ${C.blueDark})` : 'rgba(255,255,255,0.06)', border:'none', borderRadius:'30px', color:(texte.trim() || pieceJointe) ? '#fff' : C.textLight, fontSize:'13px', fontWeight:'700', cursor:(texte.trim() || pieceJointe) ? 'pointer' : 'not-allowed', flexShrink:0 }}>
                      {sending ? '⏳' : 'Envoyer →'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'14px', color:C.textLight }}>
            <span style={{ fontSize:'60px', opacity:0.15 }}>💬</span>
            <p style={{ fontSize:'14px', fontWeight:'600' }}>Sélectionnez une conversation</p>
            <button onClick={ouvrirModalNouvelle}
              style={{ background:`${C.blue}20`, border:`1px solid ${C.blue}40`, color:C.blue, borderRadius:'10px', padding:'10px 20px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
              + Nouveau message
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL NOUVELLE CONVERSATION
          ─ Sélecteur custom (fond sombre + search) au lieu du <select> natif
      ═══════════════════════════════════════════════════════════════════ */}
      {modalNouvelle && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.82)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', backdropFilter:'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalNouvelle(false); }}>

          <div style={{ background: C.modalBg, borderRadius:'20px', width:'100%', maxWidth:'500px', border:'1px solid rgba(255,255,255,0.12)', animation:'slideUp 0.25s ease', boxShadow:'0 25px 60px rgba(0,0,0,0.65)', overflow:'visible' }}>

            {/* Header */}
            <div style={{ padding:'20px 24px', background:`linear-gradient(135deg, ${C.blue}35, ${C.purple}25)`, borderBottom:'1px solid rgba(255,255,255,0.08)', borderTopLeftRadius:'20px', borderTopRightRadius:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0, fontSize:'17px', fontWeight:'800', color:'#fff' }}>✉️ Nouveau message</h3>
              <button onClick={() => setModalNouvelle(false)}
                style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', fontSize:'16px', cursor:'pointer', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ padding:'22px 24px' }}>

              {/* Erreur */}
              {erreurModal && (
                <div style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:'10px', padding:'10px 14px', marginBottom:'16px', color:'#f87171', fontSize:'13px' }}>
                  ⚠️ {erreurModal}
                </div>
              )}

              {/* ── CHAMP VENDEUR — sélecteur custom ── */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.55)', display:'block', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  Vendeur *
                </label>

                {vendeurChoisi ? (
                  /* Vendeur déjà sélectionné → afficher + bouton Changer */
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.45)', borderRadius:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'20px' }}>🏪</span>
                      <div>
                        <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'#fff' }}>{vendeurChoisi.boutique}</p>
                        {vendeurChoisi.nom && <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>{vendeurChoisi.nom}</p>}
                      </div>
                    </div>
                    <button onClick={() => { setVendeurChoisi(null); setFormNouvelle(p => ({ ...p, vendeur_id: '' })); setDropdownOuvert(true); }}
                      style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'rgba(255,255,255,0.65)', cursor:'pointer', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', fontWeight:'600' }}>
                      Changer
                    </button>
                  </div>
                ) : (
                  /* Pas encore sélectionné → search + liste */
                  <div ref={dropdownRef} style={{ position:'relative' }}>
                    <input
                      type="text"
                      value={searchVendeur}
                      onChange={e => { setSearchVendeur(e.target.value); setDropdownOuvert(true); }}
                      onFocus={() => setDropdownOuvert(true)}
                      placeholder="🔍 Rechercher un vendeur..."
                      autoFocus
                      style={{ ...inputStyle }}
                    />

                    {/* Liste déroulante */}
                    {dropdownOuvert && (
                      <div style={{ position:'absolute', left:0, right:0, top:'calc(100% + 6px)', background:'#1e293b', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'12px', zIndex:100, maxHeight:'200px', overflowY:'auto', boxShadow:'0 10px 30px rgba(0,0,0,0.5)' }}>
                        {loadingVendeurs ? (
                          <div style={{ padding:'20px', textAlign:'center', color:'rgba(255,255,255,0.45)' }}>
                            <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px solid rgba(255,255,255,0.1)`, borderTop:`2px solid ${C.blue}`, animation:'spin 0.8s linear infinite', margin:'0 auto 8px' }} />
                            <span style={{ fontSize:'12px' }}>Chargement des vendeurs...</span>
                          </div>
                        ) : vendeursFiltres.length === 0 ? (
                          <div style={{ padding:'16px', textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:'12px' }}>
                            {searchVendeur ? `Aucun vendeur pour "${searchVendeur}"` : 'Aucun vendeur actif disponible.'}
                          </div>
                        ) : vendeursFiltres.map(v => (
                          <div
                            key={v.id}
                            className="vrow"
                            onClick={() => {
                              setVendeurChoisi(v);
                              setFormNouvelle(p => ({ ...p, vendeur_id: String(v.id) }));
                              setDropdownOuvert(false);
                              setSearchVendeur('');
                            }}
                            style={{ padding:'11px 14px', display:'flex', alignItems:'center', gap:'10px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', transition:'background 0.15s' }}
                          >
                            <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`linear-gradient(135deg, ${C.blue}35, ${C.purple}35)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>🏪</div>
                            <div>
                              <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#fff' }}>{v.boutique}</p>
                              {v.nom && <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>{v.nom}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sujet */}
              <div style={{ marginBottom:'14px' }}>
                <label style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.55)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Sujet *</label>
                <input type="text" value={formNouvelle.sujet} onChange={e => setFormNouvelle(p => ({ ...p, sujet: e.target.value }))}
                  placeholder="Ex: Question sur ma commande"
                  style={inputStyle} />
              </div>

              {/* Numéro commande */}
              <div style={{ marginBottom:'14px' }}>
                <label style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.55)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Numéro de commande (optionnel)</label>
                <input type="text" value={formNouvelle.commande_id} onChange={e => setFormNouvelle(p => ({ ...p, commande_id: e.target.value }))}
                  placeholder="Ex: 13882042"
                  style={inputStyle} />
              </div>

              {/* Message */}
              <div style={{ marginBottom:'20px' }}>
                <label style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.55)', display:'block', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Message *</label>
                <textarea value={formNouvelle.message} onChange={e => setFormNouvelle(p => ({ ...p, message: e.target.value }))}
                  placeholder="Votre message..."
                  rows={3}
                  style={{ ...inputStyle, resize:'none', fontFamily:'inherit' }} />
              </div>

              {/* Boutons */}
              <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                <button onClick={() => setModalNouvelle(false)}
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', color:'#fff', borderRadius:'10px', padding:'11px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                  Annuler
                </button>
                <button onClick={creerConversation}
                  disabled={!vendeurChoisi || !formNouvelle.sujet.trim() || !formNouvelle.message.trim() || creatingConv}
                  style={{
                    background: (vendeurChoisi && formNouvelle.sujet.trim() && formNouvelle.message.trim() && !creatingConv)
                      ? `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`
                      : 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: (vendeurChoisi && formNouvelle.sujet.trim() && formNouvelle.message.trim()) ? '#fff' : 'rgba(255,255,255,0.3)',
                    borderRadius: '10px', padding: '11px 22px', fontSize: '13px', fontWeight: '700',
                    cursor: (vendeurChoisi && formNouvelle.sujet.trim() && formNouvelle.message.trim() && !creatingConv) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}>
                  {creatingConv ? '⏳ Envoi...' : '✉️ Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
