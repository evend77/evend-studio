// CHEMIN : src/pages/acheteur/Retours.tsx
// e-Vend Studio — Dashboard acheteur : mes retours, échanges et remboursements
// Adapté de Retours.tsx (e-Vend). Session : cookie httpOnly (credentials: 'include').
// API : GET /api/acheteur/:gid/retours   (les demandes se créent depuis « Mes commandes »)

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API = '/api';

interface Retour {
  id: number;
  commande_id: number;
  type_demande: 'retour' | 'echange' | 'remboursement';
  motif: string;
  details: string | null;
  statut: 'en_attente' | 'approuve' | 'refuse' | 'termine';
  montant_remboursement: number | string | null;
  reponse: string | null;
  created_at: string;
  updated_at: string;
  numero_commande: string;
  commande_total: number | string;
  articles: { titre?: string; nom?: string; quantite?: number }[] | null;
  boutique: string | null;
}

interface Props {
  gestionnaireId: number;
  isMobile?: boolean;
  couleurAccent?: string;
  naviguer?: (page: string) => void;
}

const C = { border: 'rgba(255,255,255,0.08)', textLight: 'rgba(255,255,255,0.5)', cardBg: 'rgba(255,255,255,0.04)' };

const STATUTS: Record<string, { label: string; couleur: string; icone: string; aide: string }> = {
  en_attente: { label: 'En attente',  couleur: '#f59e0b', icone: '⏳', aide: 'Le collaborateur examine votre demande.' },
  approuve:   { label: 'Approuvée',   couleur: '#3b82f6', icone: '✔️', aide: 'Votre demande est acceptée. Suivez les instructions ci-dessous.' },
  refuse:     { label: 'Refusée',     couleur: '#ef4444', icone: '✖️', aide: 'Votre demande a été refusée.' },
  termine:    { label: 'Terminée',    couleur: '#10b981', icone: '✅', aide: 'Le dossier est clos.' },
};
const TYPES: Record<string, string> = { retour: '↩️ Retour', echange: '🔁 Échange', remboursement: '💵 Remboursement' };

const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmt = (d: string) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Retours({ gestionnaireId, isMobile = false, couleurAccent = '#fbbf24', naviguer }: Props) {
  const [liste, setListe] = useState<Retour[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState('toutes');
  const [ouvert, setOuvert] = useState<number | null>(null);

  const charger = useCallback(async () => {
    try {
      const r = await fetch(`${API}/acheteur/${gestionnaireId}/retours`, { credentials: 'include' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Chargement impossible');
      setListe(j.retours || []);
      setErreur('');
    } catch (e: any) { setErreur(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  }, [gestionnaireId]);

  useEffect(() => { charger(); const t = setInterval(() => { if (!document.hidden) charger(); }, 60000); return () => clearInterval(t); }, [charger]);

  const filtrees = useMemo(() => liste.filter(r => filtre === 'toutes' || r.statut === filtre), [liste, filtre]);
  const compte = (s: string) => liste.filter(r => r.statut === s).length;

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: C.textLight }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)', borderRadius: 18, padding: isMobile ? '18px 16px' : '24px 28px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, color: '#fff' }}>🔄 Retours et remboursements</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.9)' }}>{liste.length} demande{liste.length > 1 ? 's' : ''}</p>
        </div>
        {naviguer && (
          <button onClick={() => naviguer('commandes')} style={{ padding: '9px 16px', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nouvelle demande (depuis une commande)
          </button>
        )}
      </div>

      {erreur && <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.35)', color: '#fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}>
        {[['toutes', `Toutes (${liste.length})`], ...Object.entries(STATUTS).map(([k, v]) => [k, `${v.icone} ${v.label} (${compte(k)})`])].map(([id, label]) => (
          <button key={id} onClick={() => setFiltre(id)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, border: `1px solid ${filtre === id ? couleurAccent : C.border}`, background: filtre === id ? `${couleurAccent}22` : 'rgba(255,255,255,.04)', color: filtre === id ? couleurAccent : 'rgba(255,255,255,.7)' }}>{label}</button>
        ))}
      </div>

      {filtrees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
          <p style={{ margin: 0, fontSize: 14, color: C.textLight }}>{liste.length === 0 ? 'Aucune demande de retour.' : 'Aucune demande dans ce filtre.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrees.map(r => {
            const s = STATUTS[r.statut];
            const open = ouvert === r.id;
            return (
              <div key={r.id} style={{ background: C.cardBg, border: `1px solid ${open ? `${s.couleur}66` : C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div onClick={() => setOuvert(open ? null : r.id)} style={{ padding: isMobile ? '12px' : '14px 18px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>{TYPES[r.type_demande] || r.type_demande} · {r.numero_commande}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textLight }}>{fmt(r.created_at)}{r.boutique ? ` · 🏪 ${r.boutique}` : ''}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${s.couleur}22`, border: `1px solid ${s.couleur}66`, color: s.couleur, whiteSpace: 'nowrap' }}>{s.icone} {s.label}</span>
                  <span style={{ color: C.textLight, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
                </div>
                {open && (
                  <div style={{ padding: isMobile ? '0 12px 14px' : '0 18px 18px', borderTop: `1px solid ${C.border}`, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                    <p style={{ margin: '14px 0 10px', padding: '10px 12px', borderRadius: 10, background: `${s.couleur}15`, color: s.couleur, fontSize: 12 }}>{s.aide}</p>
                    <p style={{ margin: '0 0 6px' }}><b style={{ color: '#fff' }}>Raisons :</b> {r.motif}</p>
                    {r.details && <p style={{ margin: '0 0 6px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><b style={{ color: '#fff' }}>Détails :</b> {r.details}</p>}
                    <p style={{ margin: '0 0 6px' }}><b style={{ color: '#fff' }}>Articles :</b> {(r.articles || []).map(a => `${a.titre || a.nom || 'Article'} × ${a.quantite || 1}`).join(', ') || '—'}</p>
                    <p style={{ margin: '0 0 6px' }}><b style={{ color: '#fff' }}>Total de la commande :</b> {num(r.commande_total).toFixed(2)} $</p>
                    {r.montant_remboursement !== null && num(r.montant_remboursement) > 0 && <p style={{ margin: '0 0 6px', color: '#6ee7b7' }}><b>Remboursement accordé :</b> {num(r.montant_remboursement).toFixed(2)} $</p>}
                    {r.reponse && (
                      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.05)', borderLeft: `3px solid ${s.couleur}` }}>
                        <p style={{ margin: '0 0 4px', fontSize: 11, color: C.textLight }}>Réponse du collaborateur · {fmt(r.updated_at)}</p>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{r.reponse}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}