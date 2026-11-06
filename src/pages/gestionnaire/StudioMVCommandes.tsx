// CHEMIN : src/pages/gestionnaire/StudioMVCommandes.tsx
// e-Vend Studio — Multi-vendeur : toutes les commandes de la boutique (tous collaborateurs), commissions, annulation des non payées.
// API : /api/studio/mv/:gid/(collaborateurs|commandes)

import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';
const C = { accent: '#c9a96e', green: '#10b981', red: '#ef4444', orange: '#f59e0b', blue: '#3b82f6', bg: '#f4f6f8', card: '#fff', border: '#e1e4e8', text: '#1a2332', textLight: '#64748b' };

interface Commande {
  id: number; numero_commande: string; statut: string; statut_paiement: string; total: string; commission: string | null; montant_net: string | null;
  date_commande: string; nb_articles: number; code_promo: string | null; rabais: string | null; acheteur_prenom: string | null; acheteur_nom: string | null;
  acheteur_email: string | null; boutique: string | null; collaborateur_id: number;
}
interface Detail extends Commande {
  articles: any; adresse_livraison: any; note: string | null; paye_le: string | null; frais_expedition: string | null; taxes: any;
  numero_suivi: string | null; transporteur: string | null; acheteur_telephone: string | null;
}
interface Reponse { commandes: Commande[]; total: number; page: number; pages: number; totaux: { ventes: number; commissions: number; payees: number } }

const STATUTS: Record<string, { t: string; c: string }> = {
  en_attente: { t: 'En attente', c: C.orange }, confirmee: { t: 'Confirmée', c: C.blue }, expediee: { t: 'Expédiée', c: '#8b5cf6' },
  livree: { t: 'Livrée', c: C.green }, annulee: { t: 'Annulée', c: C.red },
};
const PAIEMENTS: Record<string, { t: string; c: string }> = {
  paye: { t: 'Payée', c: C.green }, en_attente: { t: 'Non payée', c: C.orange }, echoue: { t: 'Échouée', c: C.red }, rembourse: { t: 'Remboursée', c: '#94a3b8' },
};

function entetes(): Record<string, string> {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* ignore */ }
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
const argent = (v: string | number | null) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }));
const quand = (d: string | null) => (d ? new Date(d).toLocaleString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const champ: React.CSSProperties = { padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit' };
const puce = (x?: { t: string; c: string }): React.CSSProperties => ({ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, color: x?.c, background: `${x?.c || '#999'}1f`, whiteSpace: 'nowrap' });

const StudioMVCommandes: React.FC<{ gestionnaireId: number }> = ({ gestionnaireId }) => {
  const base = `${API_BASE}/studio/mv/${gestionnaireId}`;
  const [data, setData] = useState<Reponse | null>(null);
  const [collabs, setCollabs] = useState<{ id: number; nom_boutique: string }[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(''); const [qEff, setQEff] = useState('');
  const [collab, setCollab] = useState(''); const [statut, setStatut] = useState(''); const [paiement, setPaiement] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [aAnnuler, setAAnnuler] = useState<Commande | null>(null);
  const [raison, setRaison] = useState('');
  const [occupe, setOccupe] = useState(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charger = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (qEff) p.set('q', qEff); if (collab) p.set('collaborateur_id', collab); if (statut) p.set('statut', statut); if (paiement) p.set('paiement', paiement);
    try {
      const r = await fetch(`${base}/commandes?${p}`, { credentials: 'include', headers: entetes() });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setData(d); setErreur(''); } else setErreur(d.error || 'Chargement impossible');
    } catch { setErreur('Erreur réseau'); }
    setChargement(false);
  }, [base, page, qEff, collab, statut, paiement]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => { fetch(`${base}/collaborateurs`, { credentials: 'include', headers: entetes() }).then(r => r.ok ? r.json() : []).then(setCollabs).catch(() => {}); }, [base]);

  const recherche = (v: string) => { setQ(v); if (minuterie.current) clearTimeout(minuterie.current); minuterie.current = setTimeout(() => { setPage(1); setQEff(v.trim()); }, 350); };

  const voir = async (c: Commande) => {
    try {
      const r = await fetch(`${base}/commandes/${c.id}`, { credentials: 'include', headers: entetes() });
      const d = await r.json();
      if (r.ok) setDetail(d); else setErreur(d.error || 'Commande introuvable');
    } catch { setErreur('Erreur réseau'); }
  };

  const annuler = async () => {
    if (!aAnnuler) return;
    setOccupe(true);
    try {
      const r = await fetch(`${base}/commandes/${aAnnuler.id}/annuler`, { method: 'POST', credentials: 'include', headers: entetes(), body: JSON.stringify({ raison }) });
      if (!r.ok) setErreur((await r.json().catch(() => ({}))).error || 'Annulation impossible'); else setErreur('');
      setAAnnuler(null); setRaison(''); setDetail(null);
      await charger();
    } catch { setErreur('Erreur réseau'); }
    setOccupe(false);
  };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: C.textLight }}>Chargement…</div>;
  const lignes = data?.commandes || [];
  const t = data?.totaux;
  const articles: any[] = detail ? (Array.isArray(detail.articles) ? detail.articles : []) : [];
  const adr = detail && detail.adresse_livraison && typeof detail.adresse_livraison === 'object' ? detail.adresse_livraison : null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', color: C.text }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 22 }}>🛒 Commandes de la boutique</h2>
      <p style={{ margin: '0 0 16px', color: C.textLight, fontSize: 13 }}>Toutes les commandes de vos collaborateurs. Les collaborateurs gèrent l'expédition ; vous voyez les montants et votre commission.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 14 }}>
        {[['Ventes payées', argent(t?.ventes ?? 0), C.text], ['Commissions gagnées', argent(t?.commissions ?? 0), C.green], ['Commandes payées', String(t?.payees ?? 0), C.blue]].map(([l, v, c]) => (
          <div key={String(l)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: String(c) }}>{v}</div><div style={{ fontSize: 11, color: C.textLight, textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={q} onChange={e => recherche(e.target.value)} placeholder="N° de commande, nom ou courriel…" style={{ ...champ, flex: '1 1 220px' }} />
        <select value={collab} onChange={e => { setCollab(e.target.value); setPage(1); }} style={champ}>
          <option value="">Tous les collaborateurs</option>{collabs.map(c => <option key={c.id} value={c.id}>{c.nom_boutique || `Collaborateur ${c.id}`}</option>)}
        </select>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} style={champ}>
          <option value="">Tous les statuts</option>{Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.t}</option>)}
        </select>
        <select value={paiement} onChange={e => { setPaiement(e.target.value); setPage(1); }} style={champ}>
          <option value="">Tous les paiements</option>{Object.entries(PAIEMENTS).map(([k, v]) => <option key={k} value={k}>{v.t}</option>)}
        </select>
      </div>

      {erreur && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{erreur}</div>}

      {lignes.length === 0 ? (
        <div style={{ padding: 50, textAlign: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, color: C.textLight }}>Aucune commande.</div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {lignes.map(c => (
            <div key={c.id} onClick={() => voir(c)} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${C.border}`, alignItems: 'center', flexWrap: 'wrap', cursor: 'pointer' }}>
              <div style={{ flex: '1 1 190px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{c.numero_commande}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{quand(c.date_commande)}</div>
              </div>
              <div style={{ flex: '1 1 170px', minWidth: 0, fontSize: 13 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[c.acheteur_prenom, c.acheteur_nom].filter(Boolean).join(' ') || c.acheteur_email || '—'}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>🏪 {c.boutique || '—'} · {c.nb_articles} article{c.nb_articles > 1 ? 's' : ''}</div>
              </div>
              <div style={{ minWidth: 110, fontSize: 13 }}>
                <strong>{argent(c.total)}</strong>
                {c.statut_paiement === 'paye' && <div style={{ fontSize: 11, color: C.green }}>commission {argent(c.commission)}</div>}
              </div>
              <span style={puce(PAIEMENTS[c.statut_paiement])}>{PAIEMENTS[c.statut_paiement]?.t || c.statut_paiement}</span>
              <span style={puce(STATUTS[c.statut])}>{STATUTS[c.statut]?.t || c.statut}</span>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: C.textLight, flexWrap: 'wrap', gap: 8 }}>
          <span>{data.total} commande{data.total > 1 ? 's' : ''} · page {data.page} / {data.pages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...champ, cursor: 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>← Précédent</button>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} style={{ ...champ, cursor: 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}>Suivant →</button>
          </div>
        </div>
      )}

      {detail && (
        <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 580, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <div><h3 style={{ margin: 0, fontFamily: 'monospace' }}>{detail.numero_commande}</h3><div style={{ fontSize: 12, color: C.textLight }}>{quand(detail.date_commande)} · 🏪 {detail.boutique || '—'}</div></div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.textLight }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <span style={puce(PAIEMENTS[detail.statut_paiement])}>{PAIEMENTS[detail.statut_paiement]?.t || detail.statut_paiement}</span>
              <span style={puce(STATUTS[detail.statut])}>{STATUTS[detail.statut]?.t || detail.statut}</span>
            </div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              <strong>Acheteur :</strong> {[detail.acheteur_prenom, detail.acheteur_nom].filter(Boolean).join(' ') || '—'}<br />
              {detail.acheteur_email} {detail.acheteur_telephone ? `· ${detail.acheteur_telephone}` : ''}
              {adr && <><br /><strong>Livraison :</strong> {[adr.adresse || adr.adresse1, adr.ville, adr.province, adr.code_postal].filter(Boolean).join(', ') || '—'}</>}
              {detail.numero_suivi && <><br /><strong>Suivi :</strong> {detail.transporteur} {detail.numero_suivi}</>}
              {detail.note && <><br /><strong>Note :</strong> {detail.note}</>}
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              {articles.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 12px', borderBottom: i < articles.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 13 }}>
                  <span>{a.titre}{a.variante ? ` (${a.variante})` : ''}{a.enchere_id ? ' 🔨' : ''} × {a.quantite}</span>
                  <span>{argent(Number(a.prix) * Number(a.quantite) - Number(a.rabais || 0))}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '1fr auto', gap: 4 }}>
              {detail.code_promo && <><span>Code promo {detail.code_promo}</span><span style={{ color: C.green }}>-{argent(detail.rabais)}</span></>}
              <span>Expédition</span><span>{argent(detail.frais_expedition ?? 0)}</span>
              <strong>Total</strong><strong>{argent(detail.total)}</strong>
              <span>Commission (vous)</span><span style={{ color: C.green }}>{argent(detail.commission)}</span>
              <span>Net au collaborateur</span><span>{argent(detail.montant_net)}</span>
            </div>
            {detail.statut_paiement !== 'paye' && detail.statut !== 'annulee' && (
              <button onClick={() => setAAnnuler(detail)} style={{ marginTop: 16, width: '100%', padding: 10, border: `1px solid ${C.red}`, background: '#fff', color: C.red, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler cette commande non payée</button>
            )}
            {detail.statut_paiement === 'paye' && <p style={{ fontSize: 12, color: C.textLight, marginTop: 14 }}>Commande payée : un remboursement se fait dans Stripe ou via une demande de retour de l'acheteur.</p>}
          </div>
        </div>
      )}

      {aAnnuler && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 400, width: '100%' }}>
            <h3 style={{ margin: '0 0 6px' }}>Annuler {aAnnuler.numero_commande} ?</h3>
            <p style={{ fontSize: 13, color: C.textLight, margin: '0 0 12px' }}>La page de paiement est fermée et le stock est remis en vente. Aucun montant n'a été prélevé.</p>
            <input value={raison} onChange={e => setRaison(e.target.value)} placeholder="Raison (facultatif)" style={{ ...champ, width: '100%', boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAAnnuler(null)} style={{ flex: 1, padding: 10, border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Garder</button>
              <button disabled={occupe} onClick={annuler} style={{ flex: 1, padding: 10, border: 'none', background: C.red, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Annuler la commande</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioMVCommandes;