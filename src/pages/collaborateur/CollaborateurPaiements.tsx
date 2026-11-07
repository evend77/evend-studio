// CHEMIN : src/pages/collaborateur/CollaborateurPaiements.tsx
// e-Vend Studio — Dashboard collaborateur : mes paiements (encaissé, commission du gestionnaire, net)
// Adapté de PaiementsCommandes.tsx (e-Vend). API : /api/collab/:gestionnaireId/paiements

import React, { useState, useEffect, useCallback } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

interface Paiement {
  id: number; numero_commande: string; statut: string; statut_paiement: string; total: string;
  commission: string | null; montant_net: string | null; date_commande: string; paye_le: string | null;
  acheteur_prenom: string | null; acheteur_nom: string | null; acheteur_email: string | null;
}
interface Reponse {
  paiements: Paiement[]; total: number; page: number; pages: number;
  totaux: { encaisse: number; commissions: number; net: number; en_attente: number; rembourse: number };
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; naviguer?: (page: string) => void; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280' };
const PAIEMENTS: Record<string, { l: string; bg: string; c: string }> = {
  en_attente: { l: 'À payer', bg: '#FEF9E7', c: '#B7950B' }, paye: { l: 'Payé', bg: '#E9F7EF', c: '#1E8449' },
  rembourse: { l: 'Remboursé', bg: '#f3f4f6', c: '#6b7280' }, echoue: { l: 'Échoué', bg: '#FDECEA', c: '#C0392B' },
};
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : formaterPrix(v));
const dateCourte = (d: string | null) => { try { return d ? new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; } catch { return '—'; } };

export default function CollaborateurPaiements({ gestionnaireId, accent, isMobile, naviguer }: Props) {
  const base = `/api/collab/${gestionnaireId}/paiements`;
  const [data, setData] = useState<Reponse | null>(null);
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState('');
  const [du, setDu] = useState(''); const [au, setAu] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (statut) p.set('statut_paiement', statut); if (du) p.set('du', du); if (au) p.set('au', au);
    try {
      const res = await fetch(`${base}?${p}`, { credentials: 'include' });
      if (res.ok) { setData(await res.json()); setErreur(''); } else setErreur((await res.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, statut, du, au]);
  useEffect(() => { charger(); }, [charger]);

  const champ: React.CSSProperties = { border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none' };
  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;

  const t = data?.totaux;
  const cartes = [
    { l: 'Encaissé', v: t?.encaisse, c: T.text }, { l: 'Commission du gestionnaire', v: t?.commissions, c: '#B7950B' },
    { l: 'Votre net', v: t?.net, c: '#1E8449' }, { l: 'En attente de paiement', v: t?.en_attente, c: T.light },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: T.text }}>💰 Mes paiements</h2>
        <button onClick={() => naviguer?.('config-stripe')} style={{ border: `1px solid ${accent}`, color: accent, background: '#fff', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          💳 Paramètres Stripe
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {cartes.map(c => (
          <div key={c.l} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: isMobile ? 17 : 21, fontWeight: 800, color: c.c }}>{argent(c.v ?? 0)}</div>
            <div style={{ fontSize: 11, color: T.light, textTransform: 'uppercase', fontWeight: 700 }}>{c.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={champ}>
          <option value="">Tous les paiements</option><option value="paye">Payés</option><option value="en_attente">À payer</option><option value="rembourse">Remboursés</option><option value="echoue">Échoués</option>
        </select>
        <label style={{ fontSize: 12, color: T.light }}>Du <input type="date" value={du} onChange={e => { setDu(e.target.value); setPage(1); }} style={champ} /></label>
        <label style={{ fontSize: 12, color: T.light }}>au <input type="date" value={au} onChange={e => { setAu(e.target.value); setPage(1); }} style={champ} /></label>
        {(statut || du || au) && <button onClick={() => { setStatut(''); setDu(''); setAu(''); setPage(1); }} style={{ ...champ, cursor: 'pointer', background: '#fff' }}>Effacer</button>}
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {!data || data.paiements.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>💰</div><p style={{ fontWeight: 700, color: T.text }}>Aucun paiement</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 100px 100px 100px 100px 100px', gap: 10, padding: '10px 14px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>
              <span>Commande</span><span>Client</span><span>Payé le</span><span>Statut</span><span style={{ textAlign: 'right' }}>Total</span><span style={{ textAlign: 'right' }}>Commission</span><span style={{ textAlign: 'right' }}>Net</span>
            </div>
          )}
          {data.paiements.map(p => {
            const info = PAIEMENTS[p.statut_paiement];
            const client = [p.acheteur_prenom, p.acheteur_nom].filter(Boolean).join(' ') || p.acheteur_email || '—';
            const pastille = info && <span style={{ background: info.bg, color: info.c, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{info.l}</span>;
            return isMobile ? (
              <div key={p.id} style={{ padding: 14, borderBottom: `1px solid ${T.border}`, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{p.numero_commande}</strong>{pastille}</div>
                <span style={{ color: T.light }}>{client}</span>
                <span>Total {argent(p.total)} · Commission {argent(p.commission)} · <strong style={{ color: '#1E8449' }}>Net {argent(p.montant_net)}</strong></span>
              </div>
            ) : (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 100px 100px 100px 100px 100px', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 13, alignItems: 'center' }}>
                <strong>{p.numero_commande}</strong>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client}</span>
                <span style={{ color: T.light }}>{dateCourte(p.paye_le)}</span>
                <span>{pastille}</span>
                <span style={{ textAlign: 'right' }}>{argent(p.total)}</span>
                <span style={{ textAlign: 'right', color: '#B7950B' }}>{argent(p.commission)}</span>
                <strong style={{ textAlign: 'right', color: '#1E8449' }}>{argent(p.montant_net)}</strong>
              </div>
            );
          })}
        </div>
      )}

      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: T.light, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} paiement{data.total > 1 ? 's' : ''} · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}
      <p style={{ fontSize: 11, color: T.light, marginTop: 14 }}>La commission est calculée par votre gestionnaire selon ses règles. Les montants s'affichent une fois le paiement confirmé.</p>
    </div>
  );
}