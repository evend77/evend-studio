// CHEMIN : src/pages/collaborateur/CollaborateurRetours.tsx
// e-Vend Studio — Dashboard collaborateur : retours et remboursements
// Adapté de RetourRemboursements.tsx (e-Vend). API : /api/collab/:gestionnaireId/retours

import React, { useState, useEffect, useCallback } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

interface Retour {
  id: number; commande_id: number; motif: string; details: string | null; statut: 'en_attente' | 'approuve' | 'refuse' | 'termine';
  montant_remboursement: string | null; reponse: string | null; created_at: string; numero_commande: string; total_commande: string;
  acheteur_prenom: string | null; acheteur_nom: string | null; acheteur_email: string | null;
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const STATUTS: Record<string, { l: string; bg: string; c: string }> = {
  en_attente: { l: 'À traiter', bg: '#FEF9E7', c: '#B7950B' }, approuve: { l: 'Approuvé', bg: '#EAF2F8', c: '#2874A6' },
  refuse: { l: 'Refusé', bg: '#FDECEA', c: '#C0392B' }, termine: { l: 'Terminé', bg: '#E9F7EF', c: '#1E8449' },
};
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : formaterPrix(v));
const dateCourte = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };

export default function CollaborateurRetours({ gestionnaireId, accent, isMobile }: Props) {
  const base = `/api/collab/${gestionnaireId}/retours`;
  const [data, setData] = useState<{ retours: Retour[]; total: number; page: number; pages: number; par_statut: Record<string, number> } | null>(null);
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [action, setAction] = useState<{ r: Retour; type: 'approuver' | 'refuser' } | null>(null);
  const [montant, setMontant] = useState('');
  const [reponse, setReponse] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreurModal, setErreurModal] = useState('');

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (statut) p.set('statut', statut);
    try {
      const res = await fetch(`${base}?${p}`, { credentials: 'include' });
      if (res.ok) { setData(await res.json()); setErreur(''); } else setErreur((await res.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, statut]);
  useEffect(() => { charger(); }, [charger]);

  const envoyer = async (id: number, type: string, corps: Record<string, unknown>) => {
    setOccupe(true); setErreurModal('');
    try {
      const res = await fetch(`${base}/${id}/${type}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
      if (res.ok) { setAction(null); await charger(); }
      else setErreurModal((await res.json().catch(() => ({}))).error || 'Action impossible');
    } catch { setErreurModal('Erreur réseau'); }
    setOccupe(false);
  };

  const ouvrirAction = (r: Retour, type: 'approuver' | 'refuser') => {
    setAction({ r, type }); setReponse(''); setErreurModal('');
    setMontant(type === 'approuver' ? String(Number(r.total_commande)) : '');
  };

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit' };
  const onglets = [{ k: '', l: 'Toutes' }, { k: 'en_attente', l: 'À traiter' }, { k: 'approuve', l: 'Approuvées' }, { k: 'refuse', l: 'Refusées' }, { k: 'termine', l: 'Terminées' }];

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 20, color: T.text }}>↩️ Retours et remboursements</h2>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {onglets.map(o => (
          <button key={o.k} onClick={() => { setStatut(o.k); setPage(1); }}
            style={{ padding: '7px 13px', borderRadius: 20, border: `1px solid ${statut === o.k ? accent : T.border}`, background: statut === o.k ? accent : '#fff', color: statut === o.k ? '#fff' : T.text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {o.l}{o.k && data?.par_statut[o.k] ? ` (${data.par_statut[o.k]})` : ''}
          </button>
        ))}
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {!data || data.retours.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>↩️</div><p style={{ fontWeight: 700, color: T.text }}>Aucune demande de retour</p>
        </div>
      ) : data.retours.map(r => {
        const s = STATUTS[r.statut];
        const client = [r.acheteur_prenom, r.acheteur_nom].filter(Boolean).join(' ') || r.acheteur_email || '—';
        return (
          <div key={r.id} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? 14 : 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              <strong style={{ color: T.text }}>Commande {r.numero_commande} · {argent(r.total_commande)}</strong>
              <span style={{ background: s.bg, color: s.c, padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{s.l}</span>
            </div>
            <div style={{ fontSize: 12, color: T.light, marginBottom: 8 }}>{client} · demandé le {dateCourte(r.created_at)}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{r.motif}</div>
            {r.details && <p style={{ fontSize: 13, color: T.text, margin: '6px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.details}</p>}
            {r.reponse && <p style={{ fontSize: 13, background: '#f8fafc', borderRadius: 8, padding: '8px 12px', margin: '8px 0', whiteSpace: 'pre-wrap' }}><strong>Votre réponse :</strong> {r.reponse}</p>}
            {r.montant_remboursement && <p style={{ fontSize: 13, margin: '6px 0', color: '#1E8449', fontWeight: 700 }}>Remboursement accordé : {argent(r.montant_remboursement)}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {r.statut === 'en_attente' && (<>
                <button onClick={() => ouvrirAction(r, 'approuver')} style={{ padding: '8px 14px', border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>✔ Approuver</button>
                <button onClick={() => ouvrirAction(r, 'refuser')} style={{ padding: '8px 14px', border: `1px solid ${T.danger}`, background: '#fff', color: T.danger, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>✕ Refuser</button>
              </>)}
              {r.statut === 'approuve' && (
                <button disabled={occupe} onClick={() => envoyer(r.id, 'terminer', {})} style={{ padding: '8px 14px', border: 'none', background: '#1E8449', color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  ✅ Marquer comme terminé (remboursement effectué)
                </button>
              )}
            </div>
          </div>
        );
      })}

      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: T.light, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} demande{data.total > 1 ? 's' : ''} · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, width: 'auto', cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, width: 'auto', cursor: 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}
      <p style={{ fontSize: 11, color: T.light, marginTop: 14 }}>L'approbation enregistre votre décision. Le remboursement lui-même se fait ensuite depuis votre compte Stripe.</p>

      {action && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setAction(null); }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440, padding: 22 }}>
            <h3 style={{ margin: '0 0 12px', color: T.text }}>{action.type === 'approuver' ? 'Approuver le retour' : 'Refuser le retour'}</h3>
            {erreurModal && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreurModal}</div>}
            {action.type === 'approuver' && (<>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>Montant remboursé ($) — max {argent(action.r.total_commande)}</label>
              <input type="number" min="0" step="0.01" value={montant} onChange={e => setMontant(e.target.value)} style={{ ...champ, margin: '5px 0 12px' }} />
            </>)}
            <label style={{ fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>{action.type === 'refuser' ? 'Raison du refus *' : 'Message au client (facultatif)'}</label>
            <textarea value={reponse} onChange={e => setReponse(e.target.value)} maxLength={1000} rows={4} style={{ ...champ, margin: '5px 0 14px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAction(null)} style={{ flex: 1, padding: 10, border: `1px solid ${T.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button disabled={occupe || (action.type === 'refuser' && !reponse.trim())}
                onClick={() => envoyer(action.r.id, action.type, action.type === 'approuver' ? { montant_remboursement: montant, reponse } : { reponse })}
                style={{ flex: 1, padding: 10, border: 'none', background: action.type === 'approuver' ? accent : T.danger, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                {occupe ? '⏳…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}