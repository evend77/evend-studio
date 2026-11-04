// CHEMIN : src/pages/collaborateur/CollaborateurCommandes.tsx
// e-Vend Studio — Dashboard collaborateur : mes commandes
// Adapté de ListeCommandes.tsx (e-Vend). API : /api/collab/:gestionnaireId/commandes

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Commande {
  id: number; numero_commande: string; statut: string; statut_paiement: string; total: string;
  date_commande: string; nb_articles: number; numero_suivi: string | null;
  acheteur_prenom: string | null; acheteur_nom: string | null; acheteur_email: string | null;
}
interface Detail extends Commande {
  articles: { titre?: string; prix?: number | string; quantite?: number; image_url?: string }[] | null;
  adresse_livraison: Record<string, unknown> | null; note: string | null; transporteur: string | null;
  acheteur_telephone: string | null; transitions: string[];
  retours: { id: number; motif: string; statut: string }[];
}
interface Props { gestionnaireId: number; accent: string; isMobile: boolean; naviguer?: (page: string) => void; }

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
const ACTIONS: Record<string, string> = { confirmee: '✔ Confirmer', expediee: '📦 Marquer expédiée', livree: '✅ Marquer livrée', annulee: '✕ Annuler' };
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }));
const dateCourte = (d: string) => { try { return new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; } };

function Pastille({ info }: { info?: { l: string; bg: string; c: string } }) {
  if (!info) return <span>—</span>;
  return <span style={{ background: info.bg, color: info.c, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{info.l}</span>;
}

export default function CollaborateurCommandes({ gestionnaireId, accent, isMobile, naviguer }: Props) {
  const base = `/api/collab/${gestionnaireId}/commandes`;
  const [data, setData] = useState<{ commandes: Commande[]; total: number; page: number; pages: number; par_statut: Record<string, number> } | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [statut, setStatut] = useState(''); const [paiement, setPaiement] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [expedition, setExpedition] = useState<{ suivi: string; transporteur: string } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreurDetail, setErreurDetail] = useState('');
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

  const ouvrir = async (id: number) => {
    setErreurDetail(''); setExpedition(null);
    try {
      const res = await fetch(`${base}/${id}`, { credentials: 'include' });
      if (res.ok) setDetail(await res.json()); else setErreur((await res.json().catch(() => ({}))).error || 'Commande introuvable');
    } catch { setErreur('Erreur réseau'); }
  };

  const changer = async (nouveau: string) => {
    if (!detail) return;
    if (nouveau === 'expediee' && !expedition) { setExpedition({ suivi: '', transporteur: '' }); return; }
    setOccupe(true); setErreurDetail('');
    try {
      const res = await fetch(`${base}/${detail.id}/statut`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveau, numero_suivi: expedition?.suivi, transporteur: expedition?.transporteur }),
      });
      if (res.ok) { await ouvrir(detail.id); await charger(); setExpedition(null); }
      else setErreurDetail((await res.json().catch(() => ({}))).error || 'Changement impossible');
    } catch { setErreurDetail('Erreur réseau'); }
    setOccupe(false);
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
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 110px 70px 120px 110px 90px', gap: 10, padding: '10px 14px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>
              <span>Commande</span><span>Client</span><span>Date</span><span>Articles</span><span>Statut</span><span>Paiement</span><span style={{ textAlign: 'right' }}>Total</span>
            </div>
          )}
          {lignes.map(c => (
            <div key={c.id} onClick={() => ouvrir(c.id)} style={isMobile
              ? { padding: 14, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }
              : { display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 110px 70px 120px 110px 90px', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', alignItems: 'center', fontSize: 13 }}>
              <strong style={{ color: T.text }}>{c.numero_commande}</strong>
              <span style={{ color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomClient(c)}</span>
              <span style={{ color: T.light }}>{dateCourte(c.date_commande)}</span>
              <span>{c.nb_articles}</span>
              <span><Pastille info={STATUTS[c.statut]} /></span>
              <span><Pastille info={PAIEMENTS[c.statut_paiement]} /></span>
              <strong style={{ textAlign: isMobile ? 'left' : 'right' }}>{argent(c.total)}</strong>
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

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: T.text }}>Commande {detail.numero_commande}</h3>
              <button onClick={() => setDetail(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <Pastille info={STATUTS[detail.statut]} /><Pastille info={PAIEMENTS[detail.statut_paiement]} />
              <span style={{ fontSize: 12, color: T.light }}>{dateCourte(detail.date_commande)}</span>
            </div>

            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>Client</p>
            <p style={{ margin: '0 0 12px', fontSize: 13 }}>{nomClient(detail)}<br /><span style={{ color: T.light }}>{[detail.acheteur_email, detail.acheteur_telephone].filter(Boolean).join(' · ')}</span></p>

            {detail.adresse_livraison && Object.keys(detail.adresse_livraison).length > 0 && (
              <>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>Livraison</p>
                <p style={{ margin: '0 0 12px', fontSize: 13 }}>{Object.values(detail.adresse_livraison).filter(v => typeof v === 'string' || typeof v === 'number').join(', ')}</p>
              </>
            )}

            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: T.light, textTransform: 'uppercase' }}>Articles</p>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 12 }}>
              {(detail.articles || []).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderBottom: i < (detail.articles || []).length - 1 ? `1px solid ${T.border}` : 'none', fontSize: 13 }}>
                  {a.image_url && <img src={a.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />}
                  <span style={{ flex: 1 }}>{a.titre || 'Article'} × {a.quantite ?? 1}</span>
                  <strong>{argent(Number(a.prix || 0) * Number(a.quantite ?? 1))}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', fontSize: 14 }}>
                <strong>Total</strong><strong>{argent(detail.total)}</strong>
              </div>
            </div>

            {detail.note && <p style={{ background: '#FEF9E7', borderRadius: 8, padding: '8px 12px', fontSize: 13, margin: '0 0 12px' }}>📝 {detail.note}</p>}
            {detail.numero_suivi && <p style={{ fontSize: 13, margin: '0 0 12px' }}>🚚 {detail.transporteur || 'Transporteur'} · suivi <strong>{detail.numero_suivi}</strong></p>}
            {detail.retours.length > 0 && (
              <p style={{ fontSize: 13, margin: '0 0 12px' }}>↩️ {detail.retours.length} demande{detail.retours.length > 1 ? 's' : ''} de retour — <a onClick={() => naviguer?.('commandes-retours')} style={{ color: accent, cursor: 'pointer', fontWeight: 700 }}>voir</a></p>
            )}

            {expedition && (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>Informations d'expédition (facultatif)</p>
                <input value={expedition.transporteur} onChange={e => setExpedition({ ...expedition, transporteur: e.target.value })} maxLength={60} placeholder="Transporteur (Postes Canada…)" style={{ ...champ, width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
                <input value={expedition.suivi} onChange={e => setExpedition({ ...expedition, suivi: e.target.value })} maxLength={80} placeholder="Numéro de suivi" style={{ ...champ, width: '100%', boxSizing: 'border-box' }} />
              </div>
            )}

            {erreurDetail && <div style={{ background: '#FDECEA', color: '#C0392B', padding: '9px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreurDetail}</div>}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {detail.transitions.map(t => (
                <button key={t} disabled={occupe} onClick={() => changer(t)}
                  style={{ padding: '10px 16px', borderRadius: 8, border: t === 'annulee' ? `1px solid ${T.danger}` : 'none', background: t === 'annulee' ? '#fff' : accent, color: t === 'annulee' ? T.danger : '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {expedition && t === 'expediee' ? '✔ Confirmer l\'expédition' : ACTIONS[t]}
                </button>
              ))}
              {detail.transitions.length === 0 && <span style={{ fontSize: 12, color: T.light }}>Aucune action possible : cette commande est terminée.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}