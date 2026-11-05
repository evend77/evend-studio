// CHEMIN : src/pages/acheteur/Notifications.tsx
// e-Vend Studio — Dashboard acheteur : notifications
// Adapté de Notifications.tsx (e-Vend). Session : cookie httpOnly (credentials: 'include').
// API : GET /api/acheteur/:gid/notifications · PUT /notifications/:id/lire · PUT /notifications/lire-tout

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API = '/api';
const PAR_PAGE = 10;

interface Notif {
  id: number;
  titre: string;
  message: string;
  type: string;
  lien_url: string | null;
  lien_texte: string | null;
  lu: boolean;
  date: string;
}

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  onChange?: () => void; // pour rafraîchir le badge du menu
  naviguer?: (page: string) => void;
}

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.03)', red: '#ef4444' };

const TYPES: Record<string, { icone: string; couleur: string; label: string }> = {
  commande:    { icone: '📦', couleur: '#3b82f6', label: 'Commandes' },
  retour:      { icone: '🔄', couleur: '#f59e0b', label: 'Retours' },
  promo:       { icone: '🎁', couleur: '#ec4899', label: 'Promotions' },
  paiement:    { icone: '💳', couleur: '#10b981', label: 'Paiements' },
  information: { icone: 'ℹ️', couleur: '#8b5cf6', label: 'Informations' },
};
const typeDe = (t: string) => TYPES[t] || TYPES.information;

const depuis = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (!Number.isFinite(s) || s < 0) return '';
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 7 * 86400) return `il y a ${Math.floor(s / 86400)} j`;
  return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
};

// N'accepte que des liens internes (/…) ou http(s) pour éviter tout « javascript: ».
const lienSur = (u: string | null) => (u && /^(\/(?!\/)|https?:\/\/)/i.test(u) ? u : null);

export default function Notifications({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', onChange }: Props) {
  const [liste, setListe] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState<'toutes' | 'non_lues' | string>('toutes');
  const [page, setPage] = useState(1);

  const base = `${API}/acheteur/${gestionnaireId}/notifications`;

  const charger = useCallback(async () => {
    try {
      const r = await fetch(base, { credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Chargement impossible');
      setListe(j.notifications || []);
      setErreur('');
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  }, [base]);

  useEffect(() => { charger(); const t = setInterval(() => { if (!document.hidden) charger(); }, 30000); return () => clearInterval(t); }, [charger]);
  useEffect(() => { setPage(1); }, [filtre]);

  const marquerLue = async (n: Notif) => {
    if (n.lu) return;
    setListe(prev => prev.map(x => (x.id === n.id ? { ...x, lu: true } : x)));
    try { await fetch(`${base}/${n.id}/lire`, { method: 'PUT', credentials: 'include' }); onChange?.(); }
    catch { /* le prochain rafraîchissement corrigera */ }
  };

  const toutLire = async () => {
    setListe(prev => prev.map(x => ({ ...x, lu: true })));
    try { await fetch(`${base}/lire-tout`, { method: 'PUT', credentials: 'include' }); onChange?.(); } catch { charger(); }
  };

  const nonLues = liste.filter(n => !n.lu).length;
  const filtrees = useMemo(() => liste.filter(n => (filtre === 'toutes' ? true : filtre === 'non_lues' ? !n.lu : n.type === filtre)), [liste, filtre]);
  const pages = Math.max(1, Math.ceil(filtrees.length / PAR_PAGE));
  const visibles = filtrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  const chip = (id: string, label: string, nb?: number) => (
    <button key={id} onClick={() => setFiltre(id)}
      style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
        border: `1px solid ${filtre === id ? couleurAccent : C.border}`, background: filtre === id ? `${couleurAccent}22` : 'rgba(255,255,255,.04)', color: filtre === id ? couleurAccent : 'rgba(255,255,255,.7)' }}>
      {label}{nb !== undefined && nb > 0 ? ` (${nb})` : ''}
    </button>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)', borderRadius: 18, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff' }}>🔔 Notifications</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout est lu'}</p>
        </div>
        {nonLues > 0 && (
          <button onClick={toutLire} style={{ padding: '9px 16px', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.35)', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✓ Tout marquer comme lu
          </button>
        )}
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {chip('toutes', 'Toutes')}
        {chip('non_lues', 'Non lues', nonLues)}
        {Object.entries(TYPES).map(([k, v]) => chip(k, `${v.icone} ${v.label}`))}
      </div>

      {visibles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔕</div>
          <p style={{ margin: 0, fontSize: 14, color: C.textLight }}>{liste.length === 0 ? 'Aucune notification pour le moment.' : 'Aucune notification dans ce filtre.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visibles.map(n => {
            const t = typeDe(n.type);
            const lien = lienSur(n.lien_url);
            return (
              <div key={n.id} onClick={() => marquerLue(n)}
                style={{ display: 'flex', gap: 12, padding: isMobile ? '12px' : '14px 18px', background: n.lu ? C.cardBg : `${t.couleur}12`, border: `1px solid ${n.lu ? C.border : `${t.couleur}55`}`, borderRadius: 14, cursor: n.lu ? 'default' : 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${t.couleur}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{t.icone}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: n.lu ? 600 : 800, color: '#fff', wordBreak: 'break-word' }}>{n.titre}</h3>
                    {!n.lu && <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.couleur, flexShrink: 0, marginTop: 5 }} />}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{n.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: C.textLight }}>{depuis(n.date)}</span>
                    {lien && (
                      <a href={lien} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 12, fontWeight: 700, color: t.couleur, textDecoration: 'none' }}>
                        {n.lien_texte || 'Voir'} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,.05)', color: page <= 1 ? C.textLight : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
          <span style={{ fontSize: 12, color: C.textLight }}>Page {page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,.05)', color: page >= pages ? C.textLight : '#fff', cursor: page >= pages ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>Suivant →</button>
        </div>
      )}
    </div>
  );
}