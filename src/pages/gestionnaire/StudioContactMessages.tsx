// CHEMIN : src/pages/gestionnaire/StudioContactMessages.tsx
// e-Vend Studio — Dashboard gestionnaire : messages reçus par le formulaire Contact de son site multi-vendeur.
// Le gestionnaire répond avec sa messagerie externe : le courriel du client se copie en un clic.
// API : /api/mv-contact/:gestionnaireId/{messages,count,messages/:id/lu,messages/lire-tous}  (table messages_contact,
// alimentée par le formulaire POST /api/studio/contact — la même boîte que Messagerie › Messages via formulaire contact)

import React, { useState, useEffect, useCallback } from 'react';

interface Props { gestionnaireId: number; }
interface Message { id: number; nom: string; email: string; telephone?: string | null; sujet: string | null; message: string; lu: boolean; created_at: string; }
interface Pagination { total: number; page: number; limit: number; pages: number; }

const C = {
  accent: '#c9a96e', accentLight: 'rgba(201,169,110,0.12)',
  green: '#10b981', red: '#ef4444', blue: '#3b82f6',
  bg: '#f4f6f8', card: '#fff', border: '#e1e4e8',
  text: '#1a2332', textLight: '#64748b', textMuted: '#94a3b8',
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return d; }
};

// Presse-papiers : API moderne, sinon copie par un champ temporaire (anciens navigateurs / page non sécurisée)
async function copier(texte: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texte); return true; }
  } catch { /* on tente l'autre méthode */ }
  try {
    const t = document.createElement('textarea');
    t.value = texte; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(t);
    return ok;
  } catch { return false; }
}

export default function StudioContactMessages({ gestionnaireId }: Props) {
  const base = `/api/mv-contact/${gestionnaireId}`;
  const entetes = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [nonLus, setNonLus] = useState(0);
  const [filtre, setFiltre] = useState<'tous' | 'non_lus' | 'lus'>('tous');
  const [recherche, setRecherche] = useState('');
  const [rechercheActive, setRechercheActive] = useState('');
  const [page, setPage] = useState(1);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [copie, setCopie] = useState<number | null>(null);
  const [aSupprimer, setASupprimer] = useState<number | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const prevenirMenu = () => window.dispatchEvent(new Event('contact-maj'));

  const charger = useCallback(async () => {
    setChargement(true); setErreur('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', filtre });
      if (rechercheActive) params.set('q', rechercheActive);
      const res = await fetch(`${base}/messages?${params}`, { credentials: 'include', headers: entetes() });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Chargement impossible');
      setMessages(d.messages || []); setPagination(d.pagination); setNonLus(d.non_lus || 0);
    } catch (e: any) { setErreur(e?.message || 'Erreur réseau'); }
    setChargement(false);
  }, [base, page, filtre, rechercheActive]);

  useEffect(() => { charger(); }, [charger]);

  const changerFiltre = (f: 'tous' | 'non_lus' | 'lus') => { setFiltre(f); setPage(1); setOuvert(null); };

  const marquer = async (m: Message, lu: boolean) => {
    setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, lu } : x)));
    setNonLus(n => Math.max(0, n + (lu ? -1 : 1) * (m.lu === lu ? 0 : 1)));
    try {
      await fetch(`${base}/messages/${m.id}/lu`, { method: 'PUT', credentials: 'include', headers: entetes(), body: JSON.stringify({ lu }) });
    } catch { /* l'état se resynchronise au prochain chargement */ }
    prevenirMenu();
  };

  // Ouvrir un message le marque comme lu
  const basculer = (m: Message) => {
    const ouvre = ouvert !== m.id;
    setOuvert(ouvre ? m.id : null);
    if (ouvre && !m.lu) marquer(m, true);
  };

  const toutLire = async () => {
    try { await fetch(`${base}/messages/lire-tous`, { method: 'PUT', credentials: 'include', headers: entetes() }); } catch { /* idem */ }
    prevenirMenu(); charger();
  };

  const supprimer = async (id: number) => {
    setASupprimer(null);
    try {
      const res = await fetch(`${base}/messages/${id}`, { method: 'DELETE', credentials: 'include', headers: entetes() });
      if (!res.ok) throw new Error();
    } catch { setErreur('Suppression impossible'); return; }
    if (ouvert === id) setOuvert(null);
    prevenirMenu(); charger();
  };

  const copierCourriel = async (m: Message) => {
    if (await copier(m.email)) { setCopie(m.id); setTimeout(() => setCopie(c => (c === m.id ? null : c)), 2000); }
    else setErreur('Copie impossible : sélectionnez le courriel et copiez-le manuellement.');
  };

  const btn = (actif: boolean): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: `1px solid ${actif ? C.accent : C.border}`, background: actif ? C.accentLight : '#fff', color: actif ? '#8a6d2b' : C.textLight, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' });
  const petit: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: C.text }}>✉️ Messages du formulaire Contact</h2>
        {nonLus > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 12, fontWeight: 700, minWidth: 22, height: 22, padding: '0 7px', borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{nonLus > 99 ? '99+' : nonLus} non lu{nonLus > 1 ? 's' : ''}</span>}
      </div>
      <p style={{ color: C.textLight, fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
        Les messages envoyés depuis la page Contact de votre site. Pour répondre, copiez le courriel du client et écrivez-lui avec votre messagerie habituelle.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <button style={btn(filtre === 'tous')} onClick={() => changerFiltre('tous')}>Tous</button>
        <button style={btn(filtre === 'non_lus')} onClick={() => changerFiltre('non_lus')}>Non lus{nonLus > 0 ? ` (${nonLus})` : ''}</button>
        <button style={btn(filtre === 'lus')} onClick={() => changerFiltre('lus')}>Lus</button>
        <form onSubmit={e => { e.preventDefault(); setRechercheActive(recherche.trim()); setPage(1); }} style={{ display: 'flex', gap: 6, flex: '1 1 200px', minWidth: 180 }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value.slice(0, 100))} placeholder="Rechercher (nom, courriel, sujet…)" style={{ flex: 1, minWidth: 0, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <button type="submit" style={petit}>🔍</button>
          {rechercheActive && <button type="button" style={petit} onClick={() => { setRecherche(''); setRechercheActive(''); setPage(1); }}>✕</button>}
        </form>
        {nonLus > 0 && <button style={petit} onClick={toutLire}>✓ Tout marquer comme lu</button>}
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {chargement ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>
      ) : messages.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40, textAlign: 'center', color: C.textLight }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
          {rechercheActive || filtre !== 'tous' ? 'Aucun message ne correspond.' : 'Aucun message reçu pour le moment.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map(m => {
            const est = ouvert === m.id;
            return (
              <div key={m.id} style={{ background: C.card, border: `1px solid ${m.lu ? C.border : C.accent}`, borderLeft: `4px solid ${m.lu ? C.border : C.red}`, borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => basculer(m)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {!m.lu && <span style={{ width: 9, height: 9, borderRadius: '50%', background: C.red, flexShrink: 0 }} title="Non lu" />}
                      <strong style={{ color: C.text, fontSize: 14, fontWeight: m.lu ? 600 : 800, overflowWrap: 'anywhere' }}>{m.sujet || '(sans sujet)'}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 3, overflowWrap: 'anywhere' }}>{m.nom} · {m.email}{m.telephone ? ` · ${m.telephone}` : ''} · {fmtDate(m.created_at)}</div>
                    {!est && <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.message.replace(/\s+/g, ' ')}</div>}
                  </div>
                  <span style={{ color: C.textMuted, fontSize: 14, flexShrink: 0 }}>{est ? '▲' : '▼'}</span>
                </div>

                {est && (
                  <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ background: C.bg, borderRadius: 10, padding: '10px 12px', margin: '14px 0 12px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase' }}>Courriel du client</span>
                      <span style={{ fontSize: 14, color: C.text, fontWeight: 700, overflowWrap: 'anywhere', userSelect: 'all' }}>{m.email}</span>
                      <button onClick={() => copierCourriel(m)} style={{ ...petit, background: copie === m.id ? C.green : '#fff', color: copie === m.id ? '#fff' : C.text, borderColor: copie === m.id ? C.green : C.border }}>
                        {copie === m.id ? '✓ Copié !' : '📋 Copier'}
                      </button>
                    </div>
                    <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{m.message}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.sujet || 'votre message'))}`} style={petit}>✉️ Répondre par courriel</a>
                      <button style={petit} onClick={() => marquer(m, !m.lu)}>{m.lu ? '↩ Marquer non lu' : '✓ Marquer lu'}</button>
                      {aSupprimer === m.id ? (
                        <>
                          <button style={{ ...petit, background: C.red, color: '#fff', borderColor: C.red }} onClick={() => supprimer(m.id)}>Confirmer la suppression</button>
                          <button style={petit} onClick={() => setASupprimer(null)}>Annuler</button>
                        </>
                      ) : (
                        <button style={{ ...petit, color: C.red, borderColor: '#fecaca' }} onClick={() => setASupprimer(m.id)}>🗑 Supprimer</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
          <button style={{ ...petit, opacity: page <= 1 ? 0.4 : 1 }} disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Précédent</button>
          <span style={{ fontSize: 13, color: C.textLight }}>Page {page} / {pagination.pages} · {pagination.total} message{pagination.total > 1 ? 's' : ''}</span>
          <button style={{ ...petit, opacity: page >= pagination.pages ? 0.4 : 1 }} disabled={page >= pagination.pages} onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}>Suivant →</button>
        </div>
      )}
    </div>
  );
}