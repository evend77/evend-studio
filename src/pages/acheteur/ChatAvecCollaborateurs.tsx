// CHEMIN : src/pages/acheteur/ChatAvecCollaborateurs.tsx
// e-Vend Studio — Dashboard acheteur : chat avec les collaborateurs (chiffré, texte seulement)
// Adapté de ChatAvecVendeurs.tsx (e-Vend) : « vendeurs » devient « collaborateurs ».
// Session : cookie httpOnly (credentials: 'include').
// API : /api/chat-acheteur-collab/:gid/acheteur/{collaborateurs, conversations, non-lus}

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = '/api';
const MAX_MESSAGE = 2000;
const MAX_SUJET = 120;

interface Conversation {
  id: number; sujet: string; statut: 'actif' | 'ferme'; updated_at: string;
  collaborateur: { id: number; nom: string };
  dernier_message: string | null; dernier_message_date: string | null; non_lus: number;
}
interface Message {
  id: number; expediteur_role: 'acheteur' | 'collaborateur' | 'gestionnaire'; expediteur_nom: string;
  est_intervention?: boolean; contenu: string; supprime: boolean; created_at: string;
}
interface CollabOption { id: number; nom: string }

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  collaborateurInitial?: number | null; // ouvre directement « nouvelle conversation » avec ce collaborateur
  onInitialConsomme?: () => void;
  onActivite?: () => void;
}

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.04)', green: '#10b981', red: '#ef4444', violet: '#7c3aed', gest: '#334155', moi: '#0f766e' };

const fmtHeure = (d: string) => {
  const dt = new Date(d), now = new Date();
  if (now.getTime() - dt.getTime() < 86400000 && dt.getDate() === now.getDate()) return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function ChatAvecCollaborateurs({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', collaborateurInitial = null, onInitialConsomme, onActivite }: Props) {
  const base = `${API}/chat-acheteur-collab/${gestionnaireId}/acheteur`;
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [actif, setActif] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [listeOuverte, setListeOuverte] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal, setModal] = useState(false);
  const [collabs, setCollabs] = useState<CollabOption[]>([]);
  const [collabSel, setCollabSel] = useState('');
  const [sujet, setSujet] = useState('');
  const [premier, setPremier] = useState('');
  const [creation, setCreation] = useState(false);
  const [defile, setDefile] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const actifId = useRef<number | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };
  const erreurDe = async (r: Response, defaut: string) => { try { return (await r.json()).error || defaut; } catch { return defaut; } };

  const chargerConvs = useCallback(async () => {
    try {
      const r = await fetch(`${base}/conversations`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); if (Array.isArray(d)) { setConvs(d); setActif(p => (p ? d.find((c: Conversation) => c.id === p.id) || p : p)); } }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [base]);

  const chargerMessages = useCallback(async (id: number) => {
    try {
      const r = await fetch(`${base}/conversations/${id}/messages`, { credentials: 'include' });
      if (r.ok && actifId.current === id) { const d = await r.json(); if (Array.isArray(d)) setMessages(d); onActivite?.(); }
    } catch { /* silencieux */ }
  }, [base, onActivite]);

  useEffect(() => { chargerConvs(); }, [chargerConvs]);
  useEffect(() => {
    const t = setInterval(() => { if (document.hidden) return; chargerConvs(); if (actifId.current) chargerMessages(actifId.current); }, 5000);
    return () => clearInterval(t);
  }, [chargerConvs, chargerMessages]);
  useEffect(() => {
    if (zone.current && !defile) { const el = zone.current; setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 80); }
  }, [messages, defile]);

  const ouvrirModal = useCallback(async (preselection?: number | null) => {
    setModal(true);
    setCollabSel(preselection ? String(preselection) : '');
    try { const r = await fetch(`${base}/collaborateurs`, { credentials: 'include' }); if (r.ok) setCollabs(await r.json()); } catch { /* liste vide */ }
  }, [base]);

  // Arrivée depuis « Écrire au collaborateur » (commandes / favoris)
  useEffect(() => {
    if (collaborateurInitial) {
      const existante = convs.find(c => c.collaborateur.id === collaborateurInitial && c.statut === 'actif');
      if (!loading) {
        if (existante) ouvrir(existante); else ouvrirModal(collaborateurInitial);
        onInitialConsomme?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaborateurInitial, loading]);

  const ouvrir = async (c: Conversation) => {
    actifId.current = c.id; setActif(c); setMessages([]); setDefile(false);
    if (isMobile) setListeOuverte(false);
    await chargerMessages(c.id);
    setConvs(p => p.map(x => (x.id === c.id ? { ...x, non_lus: 0 } : x)));
  };

  const creer = async () => {
    if (!collabSel || !sujet.trim() || !premier.trim() || creation) return;
    setCreation(true);
    try {
      const r = await fetch(`${base}/conversations`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collaborateur_id: Number(collabSel), sujet: sujet.trim(), message: premier.trim() }) });
      if (!r.ok) throw new Error(await erreurDe(r, 'Création échouée'));
      const d = await r.json();
      setModal(false); setSujet(''); setPremier(''); setCollabSel('');
      await chargerConvs();
      if (d.conversation) await ouvrir(d.conversation);
      showToast('✉️ Message envoyé');
    } catch (e: any) { showToast(e.message || 'Erreur réseau', false); }
    finally { setCreation(false); }
  };

  const envoyer = async () => {
    if (!texte.trim() || !actif || envoi) return;
    setEnvoi(true);
    try {
      const r = await fetch(`${base}/conversations/${actif.id}/messages`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contenu: texte.trim() }) });
      if (!r.ok) throw new Error(await erreurDe(r, 'Envoi échoué'));
      setTexte(''); setDefile(false);
      await chargerMessages(actif.id); chargerConvs();
    } catch (e: any) { showToast(e.message || 'Erreur réseau', false); }
    finally { setEnvoi(false); }
  };

  const totalNonLus = convs.reduce((s, c) => s + (c.non_lus || 0), 0);
  const ferme = !!actif && actif.statut !== 'actif';
  const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const etiquette: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', margin: '0 0 5px' };
  const couleurRole = (r: string) => (r === 'acheteur' ? C.moi : r === 'gestionnaire' ? C.gest : C.violet);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{`.cac-c:hover{background:rgba(255,255,255,.06)!important}.cac-s::-webkit-scrollbar{width:5px}.cac-s::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}`}</style>
      {toast && <div style={{ position: 'fixed', top: 76, right: 16, left: isMobile ? 16 : undefined, background: toast.ok ? C.green : C.red, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>{toast.msg}</div>}

      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', background: '#0f1a30', border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontFamily: "'Sora',sans-serif" }}>🏪 Écrire à un collaborateur</h3>
            <label style={etiquette}>Collaborateur *</label>
            <select style={{ ...champ, background: '#111c33', marginBottom: 6 }} value={collabSel} onChange={e => setCollabSel(e.target.value)}>
              <option value="">— Choisir —</option>
              {collabs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            {collabs.length === 0 && <p style={{ margin: '0 0 10px', fontSize: 11, color: C.textLight }}>Aucun collaborateur actif pour le moment.</p>}
            <label style={{ ...etiquette, marginTop: 14 }}>Sujet *</label>
            <input style={{ ...champ, marginBottom: 14 }} value={sujet} maxLength={MAX_SUJET} onChange={e => setSujet(e.target.value)} placeholder="Ex : Question sur un produit" />
            <label style={etiquette}>Message *</label>
            <textarea style={{ ...champ, resize: 'vertical' }} rows={4} value={premier} maxLength={MAX_MESSAGE} onChange={e => setPremier(e.target.value)} placeholder="Votre message…" />
            <p style={{ margin: '10px 0 16px', fontSize: 11, color: '#93c5fd' }}>🔒 Message chiffré. Texte seulement.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={creer} disabled={!collabSel || !sujet.trim() || !premier.trim() || creation} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: collabSel && sujet.trim() && premier.trim() ? `linear-gradient(135deg,${C.violet},#6366f1)` : 'rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: collabSel && sujet.trim() && premier.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>{creation ? '⏳ Envoi…' : '📨 Envoyer'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: isMobile ? 'calc(100vh - 150px)' : 'calc(100vh - 140px)', minHeight: 420, display: 'flex', overflow: 'hidden', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, position: 'relative' }}>
        {isMobile && listeOuverte && actif && <div onClick={() => setListeOuverte(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 40 }} />}

        <div style={{ width: isMobile ? '86%' : 300, maxWidth: 340, position: isMobile ? 'absolute' : 'static', top: 0, bottom: 0, left: 0, zIndex: isMobile ? 50 : undefined, transform: isMobile ? (listeOuverte ? 'none' : 'translateX(-100%)') : undefined, transition: 'transform .25s', background: isMobile ? '#0b1428' : 'transparent', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5 }}>🏪 Collaborateurs</h3>
              {totalNonLus > 0 && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#f87171', fontWeight: 700 }}>{totalNonLus} message{totalNonLus > 1 ? 's' : ''} non lu{totalNonLus > 1 ? 's' : ''}</p>}
            </div>
            <button onClick={() => ouvrirModal()} style={{ background: couleurAccent, color: '#000', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nouveau</button>
          </div>
          <div className="cac-s" style={{ flex: 1, overflowY: 'auto' }}>
            {convs.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: C.textLight, fontSize: 12 }}><p>Aucune conversation</p><p style={{ marginTop: 8, fontSize: 11 }}>Cliquez sur « Nouveau » pour écrire à un collaborateur.</p></div>
            ) : convs.map(c => (
              <div key={c.id} className="cac-c" onClick={() => ouvrir(c)} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: actif?.id === c.id ? 'rgba(255,255,255,.08)' : 'transparent', borderLeft: `3px solid ${actif?.id === c.id ? couleurAccent : 'transparent'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: c.non_lus ? 800 : 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sujet}</p>
                  {c.non_lus > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 10, flexShrink: 0 }}>{c.non_lus}</span>}
                </div>
                <p style={{ margin: '3px 0 2px', fontSize: 11, color: '#c4b5fd', fontWeight: 600 }}>🏪 {c.collaborateur.nom}</p>
                <p style={{ margin: 0, fontSize: 10, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.dernier_message || '—'}{c.dernier_message_date ? ` · ${fmtHeure(c.dernier_message_date)}` : ''}</p>
                {c.statut === 'ferme' && <span style={{ fontSize: 9, color: C.textLight }}>🔒 Fermée</span>}
              </div>
            ))}
          </div>
        </div>

        {actif ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile && <button onClick={() => setListeOuverte(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 4 }}>☰</button>}
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏪</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actif.sujet}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.textLight }}>{actif.collaborateur.nom} · 🔒 chiffré</p>
              </div>
            </div>
            <div ref={zone} onScroll={() => { const el = zone.current; if (el) setDefile(Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) > 60); }} className="cac-s" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {messages.map(m => {
                const moi = m.expediteur_role === 'acheteur';
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: moi ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: couleurRole(m.expediteur_role), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{moi ? '🛒' : m.expediteur_role === 'gestionnaire' ? '🏢' : '🏪'}</div>
                    <div style={{ maxWidth: isMobile ? '80%' : '65%' }}>
                      <p style={{ margin: '0 0 3px', fontSize: 10, color: C.textLight, textAlign: moi ? 'right' : 'left' }}>{moi ? 'Vous' : m.expediteur_nom}{m.est_intervention ? ' (gestionnaire)' : ''} · {fmtHeure(m.created_at)}</p>
                      <div style={{ background: couleurRole(m.expediteur_role), padding: '10px 14px', borderRadius: moi ? '12px 12px 4px 12px' : '12px 12px 12px 4px', fontSize: m.supprime ? 11 : 13, lineHeight: 1.5, fontStyle: m.supprime ? 'italic' : 'normal', opacity: m.supprime ? .6 : 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.supprime ? 'Message supprimé' : m.contenu}
                      </div>
                    </div>
                  </div>
                );
              })}
              {ferme && <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,.05)', borderRadius: 8, fontSize: 12, color: C.textLight, fontWeight: 600 }}>🔒 Conversation fermée</div>}
            </div>
            <div style={{ padding: isMobile ? '10px 12px' : '14px 20px', borderTop: `1px solid ${C.border}` }}>
              {ferme ? <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: C.textLight }}>Conversation fermée. Démarrez-en une nouvelle pour continuer.</p> : (
                <>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <textarea value={texte} maxLength={MAX_MESSAGE} rows={2} onChange={e => setTexte(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }} placeholder="Votre message… (Entrée pour envoyer)" style={{ ...champ, flex: 1, resize: 'none' }} />
                    <button onClick={envoyer} disabled={!texte.trim() || envoi} style={{ background: texte.trim() ? couleurAccent : 'rgba(255,255,255,.1)', color: '#000', border: 'none', borderRadius: 10, padding: '12px 18px', fontSize: 18, cursor: texte.trim() ? 'pointer' : 'not-allowed' }}>{envoi ? '⏳' : '➤'}</button>
                  </div>
                  {texte.length > MAX_MESSAGE - 200 && <p style={{ margin: '4px 0 0', fontSize: 10, color: C.textLight, textAlign: 'right' }}>{texte.length} / {MAX_MESSAGE}</p>}
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', color: C.textLight }}>
            <div>
              <div style={{ fontSize: 48, opacity: .3, marginBottom: 10 }}>🏪</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Sélectionnez une conversation</p>
              <p style={{ margin: '8px 0 0', fontSize: 12 }}>ou cliquez sur « Nouveau » pour écrire à un collaborateur</p>
              {isMobile && <button onClick={() => setListeOuverte(true)} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>☰ Voir mes conversations</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}