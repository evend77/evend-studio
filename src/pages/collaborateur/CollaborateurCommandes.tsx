// CHEMIN : src/pages/collaborateur/CollaborateurCommandes.tsx
// e-Vend Studio — Dashboard collaborateur : mes commandes
// Adapté de ListeCommandes.tsx (e-Vend). API : /api/collab/:gestionnaireId/commandes
// Chaque ligne a un bouton « Détail » → page de gestion CollaborateurCommandeDetail

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formaterPrix } from '../../templates/shared/devise';

interface Commande {
  id: number; numero_commande: string; statut: string; statut_paiement: string; total: string;
  montant_rembourse?: string | null; remboursement_en_attente?: boolean;
  date_commande: string; nb_articles: number; numero_suivi: string | null;
  acheteur_prenom: string | null; acheteur_nom: string | null; acheteur_email: string | null;
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; naviguer?: (page: string) => void; onDetail: (id: number) => void; }

const T = { border: '#e1e4e8', text: '#1a2332', light: '#6b7280', danger: '#dc2626' };
const STATUTS: Record<string, { l: string; bg: string; c: string }> = {
  en_attente: { l: 'En attente', bg: '#FEF9E7', c: '#B7950B' }, confirmee: { l: 'Confirmée', bg: '#EAF2F8', c: '#2874A6' },
  expediee: { l: '📦 Expédiée', bg: '#F4ECF7', c: '#7D3C98' }, livree: { l: '✅ Livrée', bg: '#E9F7EF', c: '#1E8449' },
  annulee: { l: 'Annulée', bg: '#FDECEA', c: '#C0392B' },
};
const PAIEMENTS: Record<string, { l: string; bg: string; c: string }> = {
  en_attente: { l: 'À payer', bg: '#FEF9E7', c: '#B7950B' }, paye: { l: 'Payé', bg: '#E9F7EF', c: '#1E8449' },
  rembourse: { l: 'Remboursé', bg: '#f3f4f6', c: '#6b7280' }, echoue: { l: 'Échoué', bg: '#FDECEA', c: '#C0392B' },
};
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : formaterPrix(v));
const dateCourte = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };

function Pastille({ info }: { info?: { l: string; bg: string; c: string } }) {
  if (!info) return <span>—</span>;
  return <span style={{ background: info.bg, color: info.c, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{info.l}</span>;
}

export default function CollaborateurCommandes({ gestionnaireId, accent, isMobile, onDetail }: Props) {
  const base = `/api/collab/${gestionnaireId}/commandes`;
  const [data, setData] = useState<{ commandes: Commande[]; total: number; page: number; pages: number; par_statut: Record<string, number> } | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [statut, setStatut] = useState(''); const [paiement, setPaiement] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (qEff) p.set('q', qEff); if (statut) p.set('statut', statut); if (paiement) p.set('statut_paiement', paiement);
    try {
      const res = await fetch(`${base}?${p}`, { credentials: 'include' });
      if (res.ok) { setData(await res.json()); setErreur(''); } else setErreur((await res.json().catch(() => ({}))).error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, qEff, statut, paiement]);
  useEffect(() => { charger(); }, [charger]);

  const recherche = (v: string) => {
    setQ(v);
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = setTimeout(() => { setPage(1); setQEff(v.trim()); }, 350);
  };

  const champ: React.CSSProperties = { border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none' };
  const nomClient = (c: { acheteur_prenom: string | null; acheteur_nom: string | null; acheteur_email: string | null }) =>
    [c.acheteur_prenom, c.acheteur_nom].filter(Boolean).join(' ') || c.acheteur_email || '—';

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: T.light }}>Chargement…</div>;
  const lignes = data?.commandes || [];
  const onglets = [{ k: '', l: 'Toutes' }, { k: 'en_attente', l: 'En attente' }, { k: 'confirmee', l: 'Confirmées' }, { k: 'expediee', l: 'Expédiées' }, { k: 'livree', l: 'Livrées' }, { k: 'annulee', l: 'Annulées' }];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 20, color: T.text }}>🛒 Mes commandes</h2>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {onglets.map(o => (
          <button key={o.k} onClick={() => { setStatut(o.k); setPage(1); }}
            style={{ padding: '7px 13px', borderRadius: 20, border: `1px solid ${statut === o.k ? accent : T.border}`, background: statut === o.k ? accent : '#fff', color: statut === o.k ? '#fff' : T.text, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {o.l}{o.k && data?.par_statut[o.k] ? ` (${data.par_statut[o.k]})` : ''}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input value={q} onChange={e => recherche(e.target.value)} placeholder="🔍 N° de commande, client, courriel…" maxLength={80} style={{ ...champ, flex: 1, minWidth: 200 }} />
        <select value={paiement} onChange={e => { setPaiement(e.target.value); setPage(1); }} style={champ}>
          <option value="">Tous les paiements</option><option value="paye">Payées</option><option value="en_attente">À payer</option><option value="rembourse">Remboursées</option>
        </select>
      </div>

      {erreur && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {lignes.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, padding: 50, textAlign: 'center', color: T.light }}>
          <div style={{ fontSize: 42 }}>🛒</div><p style={{ fontWeight: 700, color: T.text }}>Aucune commande</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 110px 70px 120px 110px 90px 80px', gap: 10, padding: '10px 14px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>
              <span>Commande</span><span>Client</span><span>Date</span><span>Articles</span><span>Statut</span><span>Paiement</span><span style={{ textAlign: 'right' }}>Total</span><span></span>
            </div>
          )}
          {lignes.map(c => (
            <div key={c.id} style={isMobile
              ? { padding: 14, borderBottom: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 6 }
              : { display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 110px 70px 120px 110px 90px 80px', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${T.border}`, alignItems: 'center', fontSize: 13 }}>
              <strong style={{ color: T.text }}>{c.numero_commande}</strong>
              <span style={{ color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomClient(c)}</span>
              <span style={{ color: T.light }}>{dateCourte(c.date_commande)}</span>
              <span>{c.nb_articles}</span>
              <span><Pastille info={c.statut === 'en_attente' && c.statut_paiement === 'paye' ? { l: '🔔 À accepter', bg: '#FEF5E7', c: '#B9770E' } : STATUTS[c.statut]} /></span>
              <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Pastille info={PAIEMENTS[c.statut_paiement]} />
                {c.remboursement_en_attente && <span title="Remboursement en attente d'approbation" style={{ background: '#FEF9E7', color: '#B7950B', padding: '2px 7px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>⏳ Remb.</span>}
                {Number(c.montant_rembourse) > 0 && c.statut_paiement === 'paye' && <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '2px 7px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Partiel</span>}
              </span>
              <strong style={{ textAlign: isMobile ? 'left' : 'right' }}>{argent(c.total)}</strong>
              <span style={{ textAlign: isMobile ? 'left' : 'right' }}>
                <button onClick={() => onDetail(c.id)} style={{ border: `1px solid ${accent}`, background: '#fff', color: accent, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>👁️ Détail</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: T.light, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} commande{data.total > 1 ? 's' : ''} · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}

    </div>
  );
}