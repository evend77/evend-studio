// CHEMIN : src/pages/acheteur/MessagerieGestionnaire.tsx
// e-Vend Studio — Dashboard acheteur : messagerie avec le gestionnaire (billets de support, chiffrés)
// Adapté de MessagerieAdmin.tsx (e-Vend) : « admin » devient « gestionnaire ». Texte seulement.
// Session : cookie httpOnly (credentials: 'include').
// API : /api/acheteur/:gid/support/conversations[/:id/messages] · /support/non-lus

import React, { useState, useEffect, useRef, useCallback } from 'react';

const API = '/api';
const MAX_MESSAGE = 2000;
const CATEGORIES = ['Général', 'Paiement', 'Commande', 'Produit', 'Technique', 'Compte'];

interface Ticket {
  id: number; sujet: string; categorie: string; numero_commande: string | null; priorite: string;
  statut: 'ouvert' | 'resolu' | 'ferme'; created_at: string; updated_at: string;
  dernier_message: string | null; dernier_message_date: string | null; non_lus: number;
}
interface Message { id: number; expediteur_role: 'acheteur' | 'gestionnaire'; expediteur_nom: string; contenu: string; supprime: boolean; created_at: string }

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  onActivite?: () => void;
}

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.04)', green: '#10b981', red: '#ef4444', blue: '#3b82f6' };
const STATUTS: Record<string, { label: string; couleur: string }> = {
  ouvert: { label: '🟢 Ouvert', couleur: '#3b82f6' }, resolu: { label: '✅ Résolu', couleur: '#10b981' }, ferme: { label: '🔒 Fermé', couleur: '#6b7280' },
};

const fmtHeure = (d: string) => {
  const dt = new Date(d), now = new Date();
  if (now.getTime() - dt.getTime() < 86400000 && dt.getDate() === now.getDate()) return dt.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function MessagerieGestionnaire({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', onActivite }: Props) {
  const base = `${API}/acheteur/${gestionnaireId}/support`;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [actif, setActif] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [texte, setTexte] = useState('');
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [listeOuverte, setListeOuverte] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [modal, setModal] = useState(false);
  const [nv, setNv] = useState({ sujet: '', categorie: 'Général', numero_commande: '', description: '' });
  const [creation, setCreation] = useState(false);
  const [defile, setDefile] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const actifId = useRef<number | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };
  const erreurDe = async (r: Response, defaut: string) => { try { return (await r.json()).error || defaut; } catch { return defaut; } };

  const chargerTickets = useCallback(async () => {
    try {
      const r = await fetch(`${base}/conversations`, { credentials: 'include' });
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d)) { setTickets(d); setActif(p => (p ? d.find((t: Ticket) => t.id === p.id) || p : p)); }
      }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [base]);

  const chargerMessages = useCallback(async (id: number) => {
    try {
      const r = await fetch(`${base}/conversations/${id}/messages`, { credentials: 'include' });
      if (r.ok && actifId.current === id) { const d = await r.json(); if (Array.isArray(d)) setMessages(d); onActivite?.(); }
    } catch { /* silencieux */ }
  }, [base, onActivite]);

  useEffect(() => { chargerTickets(); }, [chargerTickets]);
  useEffect(() => {
    const t = setInterval(() => { if (document.hidden) return; chargerTickets(); if (actifId.current) chargerMessages(actifId.current); }, 5000);
    return () => clearInterval(t);
  }, [chargerTickets, chargerMessages]);

  useEffect(() => {
    if (zone.current && !defile) { const el = zone.current; setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 80); }
  }, [messages, defile]);

  const ouvrir = async (t: Ticket) => {
    actifId.current = t.id; setActif(t); setMessages([]); setDefile(false);
    if (isMobile) setListeOuverte(false);
    await chargerMessages(t.id);
    setTickets(p => p.map(x => (x.id === t.id ? { ...x, non_lus: 0 } : x)));
  };

  const creer = async () => {
    if (!nv.sujet.trim() || !nv.description.trim() || creation) return;
    setCreation(true);
    try {
      const r = await fetch(`${base}/conversations`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nv) });
      if (!r.ok) throw new Error(await erreurDe(r, 'Création échouée'));
      const t: Ticket = await r.json();
      setModal(false); setNv({ sujet: '', categorie: 'Général', numero_commande: '', description: '' });
      await chargerTickets(); await ouvrir(t);
      showToast('✉️ Billet envoyé au gestionnaire');
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
      await chargerMessages(actif.id); chargerTickets();
    } catch (e: any) { showToast(e.message || 'Erreur réseau', false); }
    finally { setEnvoi(false); }
  };

  const totalNonLus = tickets.reduce((s, t) => s + (t.non_lus || 0), 0);
  const ferme = !!actif && actif.statut === 'ferme';
  const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,.06)', border: `1px solid ${C.border}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const etiquette: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', margin: '0 0 5px' };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{`.mgg-t:hover{background:rgba(255,255,255,.06)!important}.mgg-s::-webkit-scrollbar{width:5px}.mgg-s::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}`}</style>
      {toast && <div style={{ position: 'fixed', top: 76, right: 16, left: isMobile ? 16 : undefined, background: toast.ok ? C.green : C.red, color: '#fff', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 3000, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>{toast.msg}</div>}

      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', background: '#0f1a30', border: `1px solid ${C.border}`, borderRadius: 18, padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontFamily: "'Sora',sans-serif" }}>🏢 Écrire au gestionnaire</h3>
            <label style={etiquette}>Sujet *</label>
            <input style={{ ...champ, marginBottom: 14 }} value={nv.sujet} maxLength={120} autoFocus onChange={e => setNv({ ...nv, sujet: e.target.value })} placeholder="Ex : Problème de paiement" />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={etiquette}>Catégorie</label><select style={{ ...champ, background: '#111c33' }} value={nv.categorie} onChange={e => setNv({ ...nv, categorie: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label style={etiquette}>N° de commande</label><input style={champ} value={nv.numero_commande} maxLength={60} onChange={e => setNv({ ...nv, numero_commande: e.target.value })} placeholder="Facultatif" /></div>
            </div>
            <label style={etiquette}>Message *</label>
            <textarea style={{ ...champ, resize: 'vertical' }} rows={5} value={nv.description} maxLength={MAX_MESSAGE} onChange={e => setNv({ ...nv, description: e.target.value })} placeholder="Décrivez votre demande…" />
            <p style={{ margin: '10px 0 16px', fontSize: 11, color: '#93c5fd' }}>🔒 Message chiffré. Texte seulement.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
              <button onClick={creer} disabled={!nv.sujet.trim() || !nv.description.trim() || creation} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: nv.sujet.trim() && nv.description.trim() ? `linear-gradient(135deg,${C.blue},#6366f1)` : 'rgba(255,255,255,.1)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: nv.sujet.trim() && nv.description.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>{creation ? '⏳ Envoi…' : '📨 Envoyer'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: isMobile ? 'calc(100vh - 150px)' : 'calc(100vh - 140px)', minHeight: 420, display: 'flex', overflow: 'hidden', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, position: 'relative' }}>
        {isMobile && listeOuverte && actif && <div onClick={() => setListeOuverte(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 40 }} />}

        {/* Liste des billets */}
        <div style={{ width: isMobile ? '86%' : 300, maxWidth: 340, position: isMobile ? 'absolute' : 'static', top: 0, bottom: 0, left: 0, zIndex: isMobile ? 50 : undefined, transform: isMobile ? (listeOuverte ? 'none' : 'translateX(-100%)') : undefined, transition: 'transform .25s', background: isMobile ? '#0b1428' : 'transparent', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5 }}>🏢 Gestionnaire</h3>
              {totalNonLus > 0 && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#f87171', fontWeight: 700 }}>{totalNonLus} réponse{totalNonLus > 1 ? 's' : ''} non lue{totalNonLus > 1 ? 's' : ''}</p>}
            </div>
            <button onClick={() => setModal(true)} style={{ background: couleurAccent, color: '#000', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nouveau</button>
          </div>
          <div className="mgg-s" style={{ flex: 1, overflowY: 'auto' }}>
            {tickets.length === 0 ? (
              <div style={{ padding: 36, textAlign: 'center', color: C.textLight, fontSize: 12 }}><p>Aucun billet</p><p style={{ marginTop: 8, fontSize: 11 }}>Cliquez sur « Nouveau » pour écrire au gestionnaire.</p></div>
            ) : tickets.map(t => {
              const st = STATUTS[t.statut] || STATUTS.ouvert;
              return (
                <div key={t.id} className="mgg-t" onClick={() => ouvrir(t)} style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: actif?.id === t.id ? 'rgba(255,255,255,.08)' : 'transparent', borderLeft: `3px solid ${actif?.id === t.id ? couleurAccent : 'transparent'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: t.non_lus ? 800 : 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.sujet}</p>
                    {t.non_lus > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 10, flexShrink: 0 }}>{t.non_lus}</span>}
                  </div>
                  <p style={{ margin: '3px 0 4px', fontSize: 10, color: C.textLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.dernier_message || '—'}</p>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: `${st.couleur}25`, color: st.couleur }}>{st.label}</span>
                    <span style={{ fontSize: 9, color: C.textLight }}>{t.categorie}{t.dernier_message_date ? ` · ${fmtHeure(t.dernier_message_date)}` : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation */}
        {actif ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile && <button onClick={() => setListeOuverte(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', padding: 4 }}>☰</button>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{actif.sujet}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.textLight }}>{actif.categorie}{actif.numero_commande ? ` · Commande ${actif.numero_commande}` : ''} · 🔒 chiffré</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${(STATUTS[actif.statut] || STATUTS.ouvert).couleur}25`, color: (STATUTS[actif.statut] || STATUTS.ouvert).couleur }}>{(STATUTS[actif.statut] || STATUTS.ouvert).label}</span>
            </div>
            <div ref={zone} onScroll={() => { const el = zone.current; if (el) setDefile(Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) > 60); }} className="mgg-s" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {messages.map(m => {
                const moi = m.expediteur_role === 'acheteur';
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: moi ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: moi ? '#0f766e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{moi ? '🛒' : '🏢'}</div>
                    <div style={{ maxWidth: isMobile ? '80%' : '65%' }}>
                      <p style={{ margin: '0 0 3px', fontSize: 10, color: C.textLight, textAlign: moi ? 'right' : 'left' }}>{moi ? 'Vous' : m.expediteur_nom} · {fmtHeure(m.created_at)}</p>
                      <div style={{ background: moi ? '#0f766e' : '#1e293b', border: moi ? 'none' : `1px solid ${C.border}`, padding: '10px 14px', borderRadius: moi ? '12px 12px 4px 12px' : '12px 12px 12px 4px', fontSize: m.supprime ? 11 : 13, lineHeight: 1.5, fontStyle: m.supprime ? 'italic' : 'normal', opacity: m.supprime ? .6 : 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {m.supprime ? 'Message supprimé' : m.contenu}
                      </div>
                    </div>
                  </div>
                );
              })}
              {ferme && <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,.05)', borderRadius: 8, fontSize: 12, color: C.textLight, fontWeight: 600 }}>🔒 Billet fermé par le gestionnaire</div>}
            </div>
            <div style={{ padding: isMobile ? '10px 12px' : '14px 20px', borderTop: `1px solid ${C.border}` }}>
              {ferme ? <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: C.textLight }}>Billet fermé. Créez un nouveau billet pour une autre demande.</p> : (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea value={texte} maxLength={MAX_MESSAGE} rows={2} onChange={e => setTexte(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); } }} placeholder="Votre message… (Entrée pour envoyer)" style={{ ...champ, flex: 1, resize: 'none' }} />
                  <button onClick={envoyer} disabled={!texte.trim() || envoi} style={{ background: texte.trim() ? couleurAccent : 'rgba(255,255,255,.1)', color: '#000', border: 'none', borderRadius: 10, padding: '12px 18px', fontSize: 18, cursor: texte.trim() ? 'pointer' : 'not-allowed' }}>{envoi ? '⏳' : '➤'}</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', color: C.textLight }}>
            <div>
              <div style={{ fontSize: 48, opacity: .3, marginBottom: 10 }}>💬</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Sélectionnez un billet</p>
              <p style={{ margin: '8px 0 0', fontSize: 12 }}>ou cliquez sur « Nouveau » pour écrire au gestionnaire</p>
              {isMobile && <button onClick={() => setListeOuverte(true)} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', background: couleurAccent, color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>☰ Voir mes billets</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}